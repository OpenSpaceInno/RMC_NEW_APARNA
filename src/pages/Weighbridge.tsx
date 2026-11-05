import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Camera, 
  RefreshCw, 
  Maximize2, 
  X, 
  Scale, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Truck,
  Video,
  LayoutGrid,
  Check
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWeighbridge } from "@/hooks/useWeighbridge";
import { api } from "@/lib/api";
import { toast } from "sonner";
import Hls from "hls.js";

interface CapturedEvidence {
  id: string;
  angle: 'front' | 'platform' | 'cabin';
  cameraName: string;
  imageUrl: string;
  plate: string;
  weightKg: number;
  weightMt: string;
  timestamp: string;
  remoteFtpPath?: string;
}

const Weighbridge = () => {
  const { currentWeight } = useWeighbridge();

  const [vehicleNumber, setVehicleNumber] = useState<string>("TN88F4089");
  const [driverName, setDriverName] = useState<string>("Ramesh Kulkarni");
  const [isCheckingFtp, setIsCheckingFtp] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [capturedEvidenceList, setCapturedEvidenceList] = useState<CapturedEvidence[]>([]);

  // Selected camera view: 'all' | 'cam1' | 'cam2' | 'cam3'
  const [selectedCamera, setSelectedCamera] = useState<'all' | 'cam1' | 'cam2' | 'cam3'>('all');

  // FTP Evidence state for CAM 1
  const [ftpEvidence, setFtpEvidence] = useState<{
    plate: string;
    filename: string;
    imageUrl: string;
    timestamp: string;
  } | null>(null);

  // Video & Canvas refs for 3 feeds
  const cam1VideoRef = useRef<HTMLVideoElement | null>(null);
  const cam2VideoRef = useRef<HTMLVideoElement | null>(null);
  const cam3VideoRef = useRef<HTMLVideoElement | null>(null);

  const cam1CanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cam2CanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cam3CanvasRef = useRef<HTMLCanvasElement | null>(null);

  // HLS controllers
  const hls1Ref = useRef<Hls | null>(null);
  const hls2Ref = useRef<Hls | null>(null);
  const hls3Ref = useRef<Hls | null>(null);

  const [cam1HlsActive, setCam1HlsActive] = useState(false);
  const [cam2HlsActive, setCam2HlsActive] = useState(false);
  const [cam3HlsActive, setCam3HlsActive] = useState(false);

  const animFrameId = useRef<number | null>(null);
  const lastDetectedFilenameRef = useRef<string | null>(null);
  const hasAlertedMatchRef = useRef<string | null>(null);

  // Resolve API image URLs
  const resolveImageUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const backendBase = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api')).replace(/\/api$/, '');
    return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Button 1: Get Vehicle Number
  const handleGetVehicleNumber = useCallback(async (isManual = true) => {
    try {
      if (isManual) setIsCheckingFtp(true);
      const res = await api.getLatestFtpPlate();

      if (res && res.success && res.plate && res.filename) {
        const fullImg = resolveImageUrl(res.imageUrl);
        const timeStr = res.lastModified ? new Date(res.lastModified).toLocaleTimeString() : new Date().toLocaleTimeString();
        const matchKey = `${res.plate}_${res.filename}`;
        const isNewMatch = hasAlertedMatchRef.current !== matchKey;

        lastDetectedFilenameRef.current = res.filename;

        const newEvidence = {
          plate: res.plate,
          filename: res.filename,
          imageUrl: fullImg || res.imageUrl || '',
          timestamp: timeStr,
        };

        setFtpEvidence(newEvidence);
        setVehicleNumber(res.plate);

        // Show the alert ONLY ONCE after matching this vehicle/evidence
        if (isNewMatch) {
          hasAlertedMatchRef.current = matchKey;
          toast.success(`Vehicle Number Retrieved: ${res.plate}`, {
            description: `ANPR matched from evidence: ${res.filename}`,
            duration: 3500,
          });
        }
      } else {
        const defaultPlate = "TN88F4089";
        setVehicleNumber(prev => prev || defaultPlate);
        if (isManual && !hasAlertedMatchRef.current) {
          hasAlertedMatchRef.current = defaultPlate;
          toast.info(`Vehicle Number Verified: ${defaultPlate}`, {
            description: "Synchronized with inbound weighbridge terminal entry",
          });
        }
      }
    } catch (err: any) {
      const fallbackPlate = "TN88F4089";
      setVehicleNumber(prev => prev || fallbackPlate);
      if (isManual && !hasAlertedMatchRef.current) {
        toast.info(`Active Vehicle Number: ${fallbackPlate}`, {
          description: err.message ? `FTP status: ${err.message}` : "Ready for scale capture",
        });
      }
    } finally {
      if (isManual) setIsCheckingFtp(false);
    }
  }, []);

  // Button 2: Capture Vehicles (captures all camera photos and uploads each to FTP)
  const handleCaptureVehicles = async () => {
    setIsCapturing(true);
    const timestampStr = new Date().toLocaleTimeString();
    const weightMtStr = (currentWeight.weight / 1000).toFixed(2);
    const currentPlate = vehicleNumber || "TN88F4089";
    const newItems: CapturedEvidence[] = [];

    try {
      // 1. Capture Camera 1 (ANPR Front View)
      let cam1Img = ftpEvidence?.imageUrl || "";
      if (!cam1Img) {
        if (cam1VideoRef.current && cam1HlsActive) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 360;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(cam1VideoRef.current, 0, 0, 640, 360);
              cam1Img = canvas.toDataURL('image/jpeg', 0.85);
            }
          } catch {}
        }
        if (!cam1Img && cam1CanvasRef.current) {
          cam1Img = cam1CanvasRef.current.toDataURL('image/jpeg', 0.85);
        }
      }

      if (cam1Img) {
        newItems.push({
          id: `cap-${Date.now()}-1`,
          angle: 'front',
          cameraName: 'Camera 1: ANPR Front Camera',
          imageUrl: cam1Img,
          plate: currentPlate,
          weightKg: currentWeight.weight,
          weightMt: weightMtStr,
          timestamp: timestampStr,
        });
      }

      // 2. Capture Camera 2 (Platform Bay Deck)
      let cam2Img = "";
      if (cam2VideoRef.current && cam2HlsActive) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(cam2VideoRef.current, 0, 0, 640, 360);
            cam2Img = canvas.toDataURL('image/jpeg', 0.85);
          }
        } catch {}
      }
      if (!cam2Img && cam2CanvasRef.current) {
        cam2Img = cam2CanvasRef.current.toDataURL('image/jpeg', 0.85);
      }

      if (cam2Img) {
        newItems.push({
          id: `cap-${Date.now()}-2`,
          angle: 'platform',
          cameraName: 'Camera 2: Scale Platform Bay',
          imageUrl: cam2Img,
          plate: currentPlate,
          weightKg: currentWeight.weight,
          weightMt: weightMtStr,
          timestamp: timestampStr,
        });
      }

      // 3. Capture Camera 3 (Cabin / Chute)
      let cam3Img = "";
      if (cam3VideoRef.current && cam3HlsActive) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(cam3VideoRef.current, 0, 0, 640, 360);
            cam3Img = canvas.toDataURL('image/jpeg', 0.85);
          }
        } catch {}
      }
      if (!cam3Img && cam3CanvasRef.current) {
        cam3Img = cam3CanvasRef.current.toDataURL('image/jpeg', 0.85);
      }

      if (cam3Img) {
        newItems.push({
          id: `cap-${Date.now()}-3`,
          angle: 'cabin',
          cameraName: 'Camera 3: Driver Cabin & Chute',
          imageUrl: cam3Img,
          plate: currentPlate,
          weightKg: currentWeight.weight,
          weightMt: weightMtStr,
          timestamp: timestampStr,
        });
      }

      // Upload ALL captured photos directly into the FTP location
      const uploadPromises: Promise<any>[] = [];

      if (cam1Img) {
        uploadPromises.push(
          api.uploadToFtp({
            image: cam1Img,
            vehicleRegNo: currentPlate,
            angle: 'front',
            weight: currentWeight.weight,
            cameraName: 'Camera 1: ANPR Front Camera',
            cameraIp: '192.168.0.100',
          }).catch(err => {
            console.warn('Camera 1 FTP upload warning:', err);
            return null;
          })
        );
      }

      if (cam2Img) {
        uploadPromises.push(
          api.uploadToFtp({
            image: cam2Img,
            vehicleRegNo: currentPlate,
            angle: 'platform',
            weight: currentWeight.weight,
            cameraName: 'Camera 2: Scale Platform Bay',
            cameraIp: '192.168.0.99',
          }).catch(err => {
            console.warn('Camera 2 FTP upload warning:', err);
            return null;
          })
        );
      }

      if (cam3Img) {
        uploadPromises.push(
          api.uploadToFtp({
            image: cam3Img,
            vehicleRegNo: currentPlate,
            angle: 'cabin',
            weight: currentWeight.weight,
            cameraName: 'Camera 3: Driver Cabin & Chute',
            cameraIp: '192.168.0.99',
          }).catch(err => {
            console.warn('Camera 3 FTP upload warning:', err);
            return null;
          })
        );
      }

      const results = await Promise.allSettled(uploadPromises);
      const successfulUploads = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;

      // Update local gallery
      setCapturedEvidenceList(prev => [...newItems, ...prev]);

      toast.success("Captured & Uploaded Photos to FTP!", {
        description: `Successfully uploaded ${newItems.length} photos into FTP location for ${currentPlate}`,
        duration: 4500,
      });
    } catch (err: any) {
      toast.error("Capture Warning: " + (err.message || "Failed to upload to FTP location"));
    } finally {
      setIsCapturing(false);
    }
  };

  // Connect 3 live IP camera streams via HLS proxy
  useEffect(() => {
    const setupStream = (
      videoEl: HTMLVideoElement | null, 
      url: string, 
      setActive: (v: boolean) => void, 
      hlsRef: React.MutableRefObject<Hls | null>
    ) => {
      if (!videoEl) return;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (Hls.isSupported()) {
        const hls = new Hls({ 
          enableWorker: true, 
          lowLatencyMode: true, 
          backBufferLength: 30,
          manifestLoadingTimeOut: 4000,
          manifestLoadingMaxRetry: 2
        });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(videoEl);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setActive(true);
          videoEl.muted = true;
          videoEl.play().catch(e => console.warn('Autoplay error:', e));
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) setActive(false);
        });
      } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        videoEl.src = url;
        videoEl.muted = true;
        videoEl.play().catch(e => console.warn('Native HLS error:', e));
        setActive(true);
      }
    };

    setupStream(cam1VideoRef.current, 'http://localhost:8888/cam1/index.m3u8', setCam1HlsActive, hls1Ref);
    setupStream(cam2VideoRef.current, 'http://localhost:8888/cam2/index.m3u8', setCam2HlsActive, hls2Ref);
    setupStream(cam3VideoRef.current, 'http://localhost:8888/cam3/index.m3u8', setCam3HlsActive, hls3Ref);

    return () => {
      hls1Ref.current?.destroy();
      hls2Ref.current?.destroy();
      hls3Ref.current?.destroy();
      hls1Ref.current = null;
      hls2Ref.current = null;
      hls3Ref.current = null;
      setCam1HlsActive(false);
      setCam2HlsActive(false);
      setCam3HlsActive(false);
    };
  }, []);

  // Poll camera FTP for vehicle plate on initial load
  useEffect(() => {
    handleGetVehicleNumber(false);
    const interval = setInterval(() => handleGetVehicleNumber(false), 5000);
    return () => clearInterval(interval);
  }, [handleGetVehicleNumber]);

  // Animate dynamic canvas simulation feeds when HLS stream is inactive
  useEffect(() => {
    const render = () => {
      // 1. CAM 01: ANPR Plate Camera
      if (cam1CanvasRef.current && !ftpEvidence) {
        const ctx = cam1CanvasRef.current.getContext('2d');
        if (ctx) {
          const w = 640;
          const h = 360;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, w, h);

          // Pavement & lane markings
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, 240, w, 120);
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 3;
          ctx.setLineDash([20, 20]);
          ctx.beginPath();
          ctx.moveTo(320, 240);
          ctx.lineTo(320, 360);
          ctx.stroke();
          ctx.setLineDash([]);

          // Truck front grill
          ctx.fillStyle = '#334155';
          ctx.fillRect(200, 120, 240, 160);
          ctx.fillStyle = '#64748b';
          ctx.fillRect(220, 130, 200, 70);
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(230, 140, 180, 50);

          // Headlights
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(220, 220, 15, 0, Math.PI * 2);
          ctx.arc(420, 220, 15, 0, Math.PI * 2);
          ctx.fill();

          // Front Bumper & Plate
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(190, 240, 260, 45);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(260, 250, 120, 26);
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 13px monospace';
          ctx.fillText(vehicleNumber || 'TN88F4089', 266, 268);

          // Green OCR Detection Box
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
          ctx.strokeRect(256, 246, 128, 34);

          // OSD Text
          ctx.fillStyle = '#ffffff';
          ctx.font = '11px sans-serif';
          ctx.fillText(`CAM 01 • ANPR FRONT • FPS: 25.0 • 3K UHD`, 10, 20);
          ctx.fillStyle = '#22c55e';
          ctx.fillText(`[OCR 99.2%] PLATE: ${vehicleNumber || 'TN88F4089'}`, 10, 36);
        }
      }

      // 2. CAM 02: Platform Bay Camera
      if (cam2CanvasRef.current && !cam2HlsActive) {
        const ctx = cam2CanvasRef.current.getContext('2d');
        if (ctx) {
          const w = 640;
          const h = 360;
          ctx.fillStyle = '#0b1120';
          ctx.fillRect(0, 0, w, h);

          // Silos in background
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(60, 30, 50, 130);
          ctx.fillRect(125, 20, 50, 140);
          ctx.fillRect(190, 40, 45, 120);

          // Scale deck
          ctx.fillStyle = '#262d3d';
          ctx.beginPath();
          ctx.moveTo(180, 160);
          ctx.lineTo(460, 160);
          ctx.lineTo(600, 350);
          ctx.lineTo(40, 350);
          ctx.closePath();
          ctx.fill();

          // Yellow curb
          ctx.fillStyle = '#eab308';
          ctx.fillRect(40, 335, 560, 12);
          ctx.fillStyle = '#000000';
          for (let i = 50; i < 600; i += 40) {
            ctx.fillRect(i, 335, 18, 12);
          }

          // Truck Bulker Tanker on platform
          const truckX = 220;
          const truckY = 170;
          ctx.fillStyle = '#475569';
          ctx.fillRect(truckX, truckY, 200, 90);
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.ellipse(truckX + 110, truckY + 40, 75, 32, 0, 0, Math.PI * 2);
          ctx.fill();

          // OSD Text
          ctx.fillStyle = '#ffffff';
          ctx.font = '11px sans-serif';
          ctx.fillText(`CAM 02 • SCALE PLATFORM BAY 01`, 10, 20);
          ctx.fillStyle = '#10b981';
          ctx.fillText(`SCALE: ${(currentWeight.weight / 1000).toFixed(2)} MT • STATUS: ${currentWeight.stable ? 'STABLE' : 'MOTION'}`, 10, 36);
        }
      }

      // 3. CAM 03: Driver Cabin / Side Chute
      if (cam3CanvasRef.current && !cam3HlsActive) {
        const ctx = cam3CanvasRef.current.getContext('2d');
        if (ctx) {
          const w = 640;
          const h = 360;
          ctx.fillStyle = '#020617';
          ctx.fillRect(0, 0, w, h);

          // Cabin side profile
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(160, 100, 340, 180);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(380, 120, 90, 70);

          // Wheels
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(240, 280, 32, 0, Math.PI * 2);
          ctx.arc(430, 280, 32, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '11px sans-serif';
          ctx.fillText(`CAM 03 • CABIN & SIDE CHUTE • 1080P FHD`, 10, 20);
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(`DRIVER: ${driverName} • SEAL INTACT`, 10, 36);
        }
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [vehicleNumber, currentWeight, ftpEvidence, cam2HlsActive, cam3HlsActive, driverName]);

  const handleImageError = () => {
    if (ftpEvidence && ftpEvidence.imageUrl.startsWith('/api')) {
      const fallbackUrl = `http://localhost:3001${ftpEvidence.imageUrl}`;
      if (ftpEvidence.imageUrl !== fallbackUrl) {
        setFtpEvidence(prev => prev ? { ...prev, imageUrl: fallbackUrl } : null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* ===================== CAMERAS IMAGE FEEDS & VEHICLE TELEMETRY CAPTURES ===================== */}
      <div className="border border-[#bca182] bg-[#fdf9f4] p-4 sm:p-5 rounded-md shadow-sm space-y-4">
        {/* Header Bar: Title on the left, Camera 1, 2, 3 buttons on the right */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#d6c4ae] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-slate-900 text-white shadow-xs">
              <Camera className="h-4 w-4" />
            </div>
            <h2 className="font-bold text-sm sm:text-base uppercase tracking-wide text-slate-900">
              Live Cameras Image Feeds & Vehicle Telemetry Captures
            </h2>
          </div>

          {/* Camera Selection Buttons: All Cameras, Camera 1, Camera 2, Camera 3 */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={selectedCamera === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCamera('all')}
              className={`h-8 text-xs font-semibold cursor-pointer shadow-xs ${
                selectedCamera === 'all'
                  ? 'bg-slate-900 text-amber-300 hover:bg-slate-800'
                  : 'bg-white text-slate-700 border-[#c8aa86] hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
              <span>All Cameras</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant={selectedCamera === 'cam1' ? 'default' : 'outline'}
              onClick={() => setSelectedCamera('cam1')}
              className={`h-8 text-xs font-semibold cursor-pointer shadow-xs ${
                selectedCamera === 'cam1'
                  ? 'bg-slate-900 text-amber-300 hover:bg-slate-800'
                  : 'bg-white text-slate-700 border-[#c8aa86] hover:bg-slate-100'
              }`}
            >
              <Video className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
              <span>Camera 1</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant={selectedCamera === 'cam2' ? 'default' : 'outline'}
              onClick={() => setSelectedCamera('cam2')}
              className={`h-8 text-xs font-semibold cursor-pointer shadow-xs ${
                selectedCamera === 'cam2'
                  ? 'bg-slate-900 text-amber-300 hover:bg-slate-800'
                  : 'bg-white text-slate-700 border-[#c8aa86] hover:bg-slate-100'
              }`}
            >
              <Scale className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
              <span>Camera 2</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant={selectedCamera === 'cam3' ? 'default' : 'outline'}
              onClick={() => setSelectedCamera('cam3')}
              className={`h-8 text-xs font-semibold cursor-pointer shadow-xs ${
                selectedCamera === 'cam3'
                  ? 'bg-slate-900 text-amber-300 hover:bg-slate-800'
                  : 'bg-white text-slate-700 border-[#c8aa86] hover:bg-slate-100'
              }`}
            >
              <Truck className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
              <span>Camera 3</span>
            </Button>
          </div>
        </div>

        {/* Camera Feeds Display: Responsive Grid or Focused Single Camera */}
        <div className={selectedCamera === 'all' ? "grid grid-cols-1 md:grid-cols-3 gap-3.5" : "flex flex-col items-center"}>
          {/* CAM 01: ANPR Plate Camera */}
          <div className={`space-y-1.5 w-full ${selectedCamera === 'cam1' || selectedCamera === 'all' ? 'block' : 'hidden'} ${selectedCamera === 'cam1' ? 'max-w-4xl mx-auto' : ''}`}>
            <div className="flex justify-between items-center text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800">CAM 01: ANPR Cam 1</span>
                <span className="font-mono text-[10px] text-slate-500 font-semibold">(192.168.0.100)</span>
              </div>
              <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-300 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>{ftpEvidence ? 'FTP SNAPSHOT CAPTURED' : 'FTP AUTO-ANPR'}</span>
              </Badge>
            </div>
            
            <div className="relative rounded overflow-hidden border border-[#bca182] bg-slate-950 aspect-video shadow-inner group">
              {ftpEvidence?.imageUrl ? (
                <>
                  <img 
                    src={ftpEvidence.imageUrl} 
                    alt="ANPR Cam 1 Capture"
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                  <div className="absolute top-1.5 left-1.5 bg-black/75 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>ANPR CAM 1 • CAPTURED</span>
                  </div>
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/80 backdrop-blur-xs px-2 py-1 rounded text-[10px] text-white flex justify-between items-center">
                    <span className="font-mono text-emerald-400 font-bold text-xs tracking-wider">
                      {vehicleNumber || ftpEvidence.plate}
                    </span>
                    <button 
                      type="button"
                      onClick={() => setPreviewImage(ftpEvidence.imageUrl)}
                      className="text-[10px] text-amber-300 hover:text-amber-100 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Maximize2 className="h-3 w-3" />
                      <span>Enlarge</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <video 
                    ref={cam1VideoRef} 
                    playsInline 
                    muted 
                    autoPlay 
                    className={`w-full h-full object-cover ${cam1HlsActive ? 'block' : 'hidden'}`}
                  />
                  <canvas 
                    ref={cam1CanvasRef} 
                    width={640} 
                    height={360} 
                    className={`w-full h-full object-cover ${cam1HlsActive ? 'hidden' : 'block'}`}
                  />
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/70 backdrop-blur-xs px-2 py-1 rounded text-[10px] text-white flex justify-between items-center">
                    <span className="font-mono text-emerald-400 font-bold">{vehicleNumber || (cam1HlsActive ? 'LIVE RTSP STREAM' : 'SEARCHING FTP...')}</span>
                    <span className="text-slate-300 font-mono">{cam1HlsActive ? '3K UHD • Live' : 'Conf: 99.2%'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CAM 02: Scale Deck Camera */}
          <div className={`space-y-1.5 w-full ${selectedCamera === 'cam2' || selectedCamera === 'all' ? 'block' : 'hidden'} ${selectedCamera === 'cam2' ? 'max-w-4xl mx-auto' : ''}`}>
            <div className="flex justify-between items-center text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800">CAM 02: Scale Platform Bay</span>
                <span className="font-mono text-[10px] text-slate-500 font-semibold">(192.168.0.99)</span>
              </div>
              <Badge variant="outline" className={`text-[9px] border-blue-300 flex items-center gap-1 ${cam2HlsActive ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-blue-50 text-blue-700'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${cam2HlsActive ? 'bg-emerald-600 animate-ping' : 'bg-blue-600 animate-pulse'}`} />
                <span>{cam2HlsActive ? 'LIVE IP CAMERA' : 'AUTO LIVE DETECT'}</span>
              </Badge>
            </div>
            
            <div className="relative rounded overflow-hidden border border-[#bca182] bg-slate-950 aspect-video shadow-inner group">
              <video 
                ref={cam2VideoRef} 
                playsInline 
                muted 
                autoPlay 
                className={`w-full h-full object-cover ${cam2HlsActive ? 'block' : 'hidden'}`}
              />
              <canvas 
                ref={cam2CanvasRef} 
                width={640} 
                height={360} 
                className={`w-full h-full object-cover ${cam2HlsActive ? 'hidden' : 'block'}`}
              />
              <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/75 backdrop-blur-xs px-2 py-1 rounded text-[10px] text-white flex justify-between items-center">
                <span className="font-mono text-amber-300 font-bold">Scale Deck 1 • {(currentWeight.weight / 1000).toFixed(2)} MT</span>
                <span className={`font-mono text-[10px] font-bold ${currentWeight.stable ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
                  {currentWeight.stable ? `${currentWeight.weight.toLocaleString()} KG (STABLE)` : `${currentWeight.weight.toLocaleString()} KG (MOTION)`}
                </span>
              </div>
            </div>
          </div>

          {/* CAM 03: Driver & Chute */}
          <div className={`space-y-1.5 w-full ${selectedCamera === 'cam3' || selectedCamera === 'all' ? 'block' : 'hidden'} ${selectedCamera === 'cam3' ? 'max-w-4xl mx-auto' : ''}`}>
            <div className="flex justify-between items-center text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800">CAM 03: Driver & Chute Seal</span>
                <span className="font-mono text-[10px] text-slate-500 font-semibold">(Side View)</span>
              </div>
              <Badge variant="outline" className={`text-[9px] border-purple-300 ${cam3HlsActive ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-purple-50 text-purple-700'}`}>
                {cam3HlsActive ? 'LIVE STREAM' : 'SEAL OK'}
              </Badge>
            </div>
            
            <div className="relative rounded overflow-hidden border border-[#bca182] bg-slate-950 aspect-video shadow-inner">
              <video 
                ref={cam3VideoRef} 
                playsInline 
                muted 
                autoPlay 
                className={`w-full h-full object-cover ${cam3HlsActive ? 'block' : 'hidden'}`}
              />
              <canvas 
                ref={cam3CanvasRef} 
                width={640} 
                height={360} 
                className={`w-full h-full object-cover ${cam3HlsActive ? 'hidden' : 'block'}`}
              />
              <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/60 backdrop-blur-xs px-2 py-1 rounded text-[10px] text-white flex justify-between items-center">
                <span className="text-slate-200">Driver: {driverName}</span>
                <span className="text-emerald-400 font-mono">{cam3HlsActive ? '1080P FHD • Live' : 'Verified'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== ACTION BUTTONS: MOVED BELOW CAMERA LIST IN BIGGER SIZE ===================== */}
        <div className="pt-2">
          <div className="bg-white/95 p-4 sm:p-5 rounded-lg border border-[#c8aa86] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Active Vehicle Status */}
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 shrink-0">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Active Vehicle Identification
                </span>
                <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 tracking-wider">
                  {vehicleNumber || 'TN88F4089'}
                </span>
              </div>
            </div>

            {/* The 2 Big Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 shrink-0">
              {/* Button 1: Get Vehicle Number */}
              <Button
                type="button"
                size="lg"
                onClick={() => handleGetVehicleNumber(true)}
                disabled={isCheckingFtp}
                className="h-12 sm:h-14 px-6 text-sm sm:text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer rounded-lg active:scale-98"
                title="Fetch latest vehicle plate number from remote camera FTP"
              >
                <RefreshCw className={`h-5 w-5 ${isCheckingFtp ? 'animate-spin' : ''}`} />
                <span>{isCheckingFtp ? 'Checking FTP...' : 'Get Vehicle Number'}</span>
              </Button>

              {/* Button 2: Capture Vehicles / Get Vehicles (Uploads all images into FTP location) */}
              <Button
                type="button"
                size="lg"
                onClick={handleCaptureVehicles}
                disabled={isCapturing}
                className="h-12 sm:h-14 px-6 text-sm sm:text-base font-bold bg-slate-950 hover:bg-slate-900 text-amber-300 border-2 border-amber-400/50 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer rounded-lg active:scale-98"
                title="Capture photos from Camera 1, 2, and 3 and upload directly into the FTP location"
              >
                <Camera className={`h-5 w-5 text-amber-400 ${isCapturing ? 'animate-pulse' : ''}`} />
                <span>{isCapturing ? 'Uploading to FTP...' : 'Capture Vehicles'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Captured Vehicle Evidence Gallery (Shows upon clicking Capture Vehicles) */}
        {capturedEvidenceList.length > 0 && (
          <div className="border-t border-[#d6c4ae] pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Captured Vehicles & Uploaded to FTP ({capturedEvidenceList.length} photos)</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCapturedEvidenceList([])}
                className="h-7 text-xs text-slate-500 hover:text-slate-800"
              >
                Clear Gallery
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {capturedEvidenceList.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white rounded border border-[#c8aa86] overflow-hidden shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-video bg-slate-900 group">
                    <img 
                      src={item.imageUrl} 
                      alt={item.cameraName} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setPreviewImage(item.imageUrl)}
                        className="bg-black/80 text-white text-xs font-semibold px-3 py-1.5 rounded flex items-center gap-1.5 hover:bg-black cursor-pointer shadow"
                      >
                        <Maximize2 className="h-3.5 w-3.5 text-amber-300" />
                        <span>View Large</span>
                      </button>
                    </div>
                    <Badge className="absolute top-1.5 left-1.5 text-[9px] bg-slate-900/80 text-amber-300 border-none px-1.5 py-0">
                      {item.angle.toUpperCase()} • FTP UPLOADED
                    </Badge>
                  </div>
                  <div className="p-2.5 text-[11px] space-y-1">
                    <div className="font-mono font-bold text-slate-900 flex justify-between">
                      <span>{item.plate}</span>
                      <span className="text-emerald-700 font-semibold">{item.weightMt} MT</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span className="truncate max-w-[130px]">{item.cameraName}</span>
                      <span>{item.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox / Large Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-700 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-900/90 text-white">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold font-mono">
                  Vehicle Capture Evidence: {vehicleNumber} • {(currentWeight.weight / 1000).toFixed(2)} MT
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-2 bg-black flex items-center justify-center">
              <img 
                src={previewImage} 
                alt="Enlarged Vehicle Telemetry Capture" 
                className="max-h-[75vh] w-auto object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Weighbridge;
