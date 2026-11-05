import { useEffect, useRef, useState, useCallback } from "react";

interface SimulatedFeedOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  cameraName: string;
  laneType: 'entry' | 'exit';
  plateNumber: string;
}

export function useSimulatedFeed({
  videoRef,
  cameraName,
  laneType,
  plateNumber,
}: SimulatedFeedOptions) {
  const [isSimulating, setIsSimulating] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopSimulation = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
    }
    setIsSimulating(false);
  }, [videoRef]);

  const startSimulation = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Attach active plate directly to video dataset so OCR / capture reads exact vehicle nameplate
    video.dataset.activePlate = plateNumber;

    // Stop any existing simulation or stream
    stopSimulation();

    // Create or reuse hidden canvas
    if (!canvasRef.current) {
      const c = document.createElement('canvas');
      c.width = 640;
      c.height = 360;
      canvasRef.current = c;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const isEntry = laneType === 'entry';

    const render = () => {
      frame++;
      const time = Date.now();

      // 1. Sky & Plant Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 160);
      skyGrad.addColorStop(0, '#1e293b');
      skyGrad.addColorStop(1, '#334155');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 640, 160);

      // Plant Silhouettes / Batching Silos in background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(80, 40, 45, 120); // Silo 1
      ctx.fillRect(135, 30, 45, 130); // Silo 2
      ctx.fillRect(190, 50, 40, 110); // Silo 3
      // Silo tops (domes)
      ctx.beginPath();
      ctx.arc(102.5, 40, 22.5, Math.PI, 0);
      ctx.arc(157.5, 30, 22.5, Math.PI, 0);
      ctx.arc(210, 50, 20, Math.PI, 0);
      ctx.fill();

      // Conveyor belt truss
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(135, 60);
      ctx.lineTo(340, 150);
      ctx.stroke();

      // 2. Asphalt Road / Gate Lane (Perspective)
      ctx.fillStyle = '#1e2024';
      ctx.beginPath();
      ctx.moveTo(220, 160);
      ctx.lineTo(420, 160);
      ctx.lineTo(590, 360);
      ctx.lineTo(50, 360);
      ctx.closePath();
      ctx.fill();

      // Road curbs & safety curbs
      ctx.fillStyle = '#fbbf24'; // Yellow safety curb
      ctx.fillRect(40, 350, 20, 10);
      ctx.fillRect(580, 350, 20, 10);

      // Road lane markers (moving dashes)
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 3;
      ctx.setLineDash([15, 12]);
      ctx.lineDashOffset = -(frame * 1.5) % 27;
      ctx.beginPath();
      ctx.moveTo(320, 160);
      ctx.lineTo(320, 360);
      ctx.stroke();
      ctx.setLineDash([]); // reset

      // 3. Concrete Mixer Truck (approaching gate)
      // Cycle position: Truck approaches, pauses at barrier for ANPR, then proceeds
      const cycle = (frame % 450); // ~15 seconds loop
      let truckScale = 1.0;
      let truckY = 220;
      let barrierOpen = false;

      if (cycle < 160) {
        // Approaching barrier
        const p = cycle / 160;
        truckScale = 0.5 + p * 0.5;
        truckY = 175 + p * 60;
      } else if (cycle < 320) {
        // Stopped at barrier for ANPR scanning
        truckScale = 1.0;
        truckY = 235;
        if (cycle > 220) {
          barrierOpen = true; // Barrier lifts
        }
      } else {
        // Passing through gate
        const p = (cycle - 320) / 130;
        truckScale = 1.0 + p * 0.4;
        truckY = 235 + p * 80;
        barrierOpen = true;
      }

      ctx.save();
      ctx.translate(320, truckY);
      ctx.scale(truckScale, truckScale);

      // Truck Body / Cabin
      ctx.fillStyle = '#0284c7'; // RMC Blue Cabin
      ctx.fillRect(-70, -60, 140, 50);

      // Cabin Roof
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(-65, -85, 130, 26);

      // Windshield
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-55, -80, 110, 20);

      // Rotating Mixer Drum Graphic (behind cab)
      ctx.fillStyle = '#e2e8f0'; // White/gray drum
      ctx.beginPath();
      ctx.ellipse(0, -95, 50, 25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      // Spiral stripe on drum
      const drumAngle = (frame * 0.08) % (Math.PI * 2);
      ctx.beginPath();
      ctx.arc(0, -95, 25, drumAngle, drumAngle + Math.PI);
      ctx.stroke();

      // Front Grill
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-50, -25, 100, 18);
      // Grill bars
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      for (let gx = -45; gx <= 45; gx += 10) {
        ctx.beginPath();
        ctx.moveTo(gx, -25);
        ctx.lineTo(gx, -7);
        ctx.stroke();
      }

      // Headlights
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#fef08a';
      ctx.shadowBlur = 10;
      ctx.fillRect(-65, -24, 12, 10);
      ctx.fillRect(53, -24, 12, 10);
      ctx.shadowBlur = 0; // reset

      // Wheels
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-80, -10, 20, 25);
      ctx.fillRect(60, -10, 20, 25);

      // Front Bumper
      ctx.fillStyle = '#334155';
      ctx.fillRect(-75, -6, 150, 14);

      // 4. Indian License Plate (Clear, bold text for ANPR OCR)
      const plateWidth = 92;
      const plateHeight = 22;
      const plateX = -plateWidth / 2;
      const plateY = 10;

      // Yellow/White Plate base
      ctx.fillStyle = '#fef08a'; // Indian commercial yellow plate
      ctx.fillRect(plateX, plateY, plateWidth, plateHeight);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(plateX, plateY, plateWidth, plateHeight);

      // IND Blue strip on left
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(plateX, plateY, 10, plateHeight);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 6px monospace';
      ctx.fillText('IND', plateX + 1, plateY + 13);

      // Plate Number Text
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(plateNumber, 2, plateY + 15);

      // 5. ANPR OCR Real-time Target Bounding Box
      if (cycle >= 120 && cycle <= 340) {
        ctx.strokeStyle = '#10b981'; // Emerald Green ANPR detection box
        ctx.lineWidth = 2;
        ctx.strokeRect(plateX - 5, plateY - 4, plateWidth + 10, plateHeight + 8);

        // Corner accents
        const cw = 6;
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2.5;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(plateX - 5, plateY - 4 + cw);
        ctx.lineTo(plateX - 5, plateY - 4);
        ctx.lineTo(plateX - 5 + cw, plateY - 4);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(plateX + plateWidth + 5 - cw, plateY - 4);
        ctx.lineTo(plateX + plateWidth + 5, plateY - 4);
        ctx.lineTo(plateX + plateWidth + 5, plateY - 4 + cw);
        ctx.stroke();

        // ANPR Detection tag above plate
        ctx.fillStyle = '#10b981';
        ctx.fillRect(plateX - 5, plateY - 20, 95, 14);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`ANPR: ${plateNumber}`, plateX - 2, plateY - 10);
      }

      ctx.restore();

      // 6. Gate Boom Barrier Arm
      const barrierAngle = barrierOpen ? -Math.PI / 3 : 0;
      ctx.save();
      ctx.translate(460, 240); // Barrier hinge position
      // Post
      ctx.fillStyle = '#f97316'; // Orange barrier housing
      ctx.fillRect(-12, -50, 24, 70);
      ctx.fillStyle = barrierOpen ? '#22c55e' : '#ef4444'; // Status light
      ctx.beginPath();
      ctx.arc(0, -38, 5, 0, Math.PI * 2);
      ctx.fill();

      // Arm
      ctx.rotate(barrierAngle);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-220, -6, 220, 10);
      // Red stripes on arm
      ctx.fillStyle = '#dc2626';
      for (let s = -210; s < 0; s += 30) {
        ctx.fillRect(s, -6, 15, 10);
      }
      ctx.restore();

      // 7. Security Camera HUD Overlays
      // Top Left: Camera ID, Lane Name & Live Clock
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(10, 10, 240, 36);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(22, 28, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${cameraName} [${isEntry ? 'ENTRY' : 'EXIT'}]`, 34, 24);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      const timeStr = new Date(time).toISOString().replace('T', ' ').substring(0, 19);
      ctx.fillText(timeStr, 34, 38);

      // Top Right: REC Badge & FPS
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(530, 10, 100, 36);
      // Blinking REC dot
      if (Math.floor(time / 500) % 2 === 0) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(546, 28, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('REC', 556, 26);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText('30 FPS | 1080p', 546, 38);

      // Bottom Right: Simulation Tag
      ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
      ctx.fillRect(490, 335, 140, 18);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('DEMO FEED (CANVAS)', 498, 348);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    // Pipe canvas stream directly into video element
    try {
      // @ts-ignore
      const stream = canvas.captureStream ? canvas.captureStream(30) : null;
      if (stream) {
        streamRef.current = stream;
        video.srcObject = stream;
        video.play().catch(e => console.warn('Simulated video autoplay:', e));
        setIsSimulating(true);
      } else {
        console.warn('captureStream not supported in this browser');
      }
    } catch (err) {
      console.error('Failed to capture canvas stream:', err);
    }
  }, [cameraName, laneType, plateNumber, videoRef, stopSimulation]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.dataset.activePlate = plateNumber;
    }
    return () => {
      stopSimulation();
    };
  }, [plateNumber, videoRef, stopSimulation]);

  return {
    isSimulating,
    startSimulation,
    stopSimulation,
  };
}
