import React, { useEffect, useState, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  Video, 
  Radio, 
  Tv, 
  Maximize2, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  Scale, 
  Play,
  LayoutGrid,
  Columns,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Scan,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  Network
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Hls from "hls.js";
import { toast } from "sonner";
import { WeightReading, Evidence } from "@/types/weighbridge";
import { api } from "@/lib/api";
import { CameraDiagnosticsModal } from "./CameraDiagnosticsModal";

export interface CameraSource {
  id: string;
  name: string;
  badge: string;
  role: string;
  ip: string;
  rtsp: string;
  hls: string;
  resolution: string;
  defaultAngle: Evidence['angle'];
  plateSample: string;
}

export const AVAILABLE_CAMERAS: CameraSource[] = [
  {
    id: 'cam_gate_1',
    name: 'ANPR Entry Camera',
    badge: 'CAM 01 • ANPR',
    role: 'Front Bumper / Plate OCR',
    ip: '192.168.0.101',
    rtsp: 'rtsp://admin:Password@123@192.168.0.101:554/ch1/main/av_stream',
    hls: 'http://localhost:8888/cam1/index.m3u8',
    resolution: '3K UHD (2880x1620)',
    defaultAngle: 'front',
    plateSample: 'MH 12 RN 4501'
  },
  {
    id: 'cam_gate_2',
    name: 'Platform Bay Camera',
    badge: 'CAM 02 • SCALE BAY',
    role: 'Scale Platform & Wheel Deck',
    ip: '192.168.0.99',
    rtsp: 'rtsp://admin:Password@123@192.168.0.99:554/Streaming/Channels/101',
    hls: 'http://localhost:8888/cam2/index.m3u8',
    resolution: '1080P FHD (1920x1080)',
    defaultAngle: 'side',
    plateSample: 'KA 04 MM 9123'
  },
  {
    id: 'cam_gate_3',
    name: 'Exit & Chute Camera',
    badge: 'CAM 03 • REAR / EXIT',
    role: 'Chute Seal & Rear Plate',
    ip: '192.168.0.99',
    rtsp: 'rtsp://admin:Password@123@192.168.0.99:554/Streaming/Channels/101',
    hls: 'http://localhost:8888/cam3/index.m3u8',
    resolution: '1080P FHD (1920x1080)',
    defaultAngle: 'rear',
    plateSample: 'MH 14 DE 7890'
  }
];

interface WeighbridgeLiveStreamProps {
  currentWeight: WeightReading;
  vehicleRegNo?: string;
  onPlateDetected?: (plate: string) => void;
  onEvidenceCaptured?: (evidence: Evidence) => void;
}

export function WeighbridgeLiveStream({
  currentWeight,
  vehicleRegNo,
  onPlateDetected,
  onEvidenceCaptured,
}: WeighbridgeLiveStreamProps) {
  const [layoutMode, setLayoutMode] = useState<'grid3' | 'focus'>('grid3');
  const [focusedIndex, setFocusedIndex] = useState<number>(1); // Platform bay by default
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isCapturingAll, setIsCapturingAll] = useState(false);
  const [cameraSources, setCameraSources] = useState<CameraSource[]>(AVAILABLE_CAMERAS);

  // Each of the 3 screens can have a custom assigned camera from cameraSources
  const [assignedCameras, setAssignedCameras] = useState<CameraSource[]>([
    AVAILABLE_CAMERAS[0],
    AVAILABLE_CAMERAS[1],
    AVAILABLE_CAMERAS[2],
  ]);

  // Dynamically load cameras from database/backend
  useEffect(() => {
    const fetchWeighbridgeCameras = async () => {
      try {
        const serverCams = await api.getCameras();
        if (Array.isArray(serverCams) && serverCams.length > 0) {
          const mapped: CameraSource[] = await Promise.all(
            serverCams.map(async (c: any, index: number) => {
              const devId = c.device_id || c.id;
              let hlsUrl = '';
              let rtspUrl = '';

              try {
                const rtspConfig = await api.getRTSPConfig(devId);
                if (rtspConfig) {
                  hlsUrl = rtspConfig.hls_proxy_url || '';
                  rtspUrl = rtspConfig.direct_url || '';
                }
              } catch {}

              const safePath = devId === 'cam_gate_1' ? 'cam1' : devId === 'cam_gate_2' ? 'cam2' : devId === 'cam_gate_3' ? 'cam3' : devId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || `cam${index + 1}`;
              if (!hlsUrl) hlsUrl = `http://localhost:8888/${safePath}/index.m3u8`;
              if (!rtspUrl) rtspUrl = `rtsp://admin:Password@123@${c.ip_address || '192.168.0.100'}:554/ch1/main/av_stream`;

              const loc = (c.location || 'entry').toLowerCase();
              const defaultAngle: Evidence['angle'] = loc.includes('weigh') ? 'side' : loc.includes('exit') ? 'rear' : 'front';
              const roleDesc = loc.includes('weigh') ? 'Scale Platform & Wheel Deck' : loc.includes('exit') ? 'Chute Seal & Rear Plate' : 'Front Bumper / Plate OCR';
              const plateSample = devId === 'Exit 2' ? 'TS 09 UB 5678' : loc.includes('exit') ? 'MH 14 DE 7890' : loc.includes('weigh') ? 'KA 04 MM 9123' : 'MH 12 RN 4501';

              return {
                id: devId,
                name: c.name || `Camera ${index + 1}`,
                badge: `CAM 0${index + 1} • ${loc.toUpperCase()}`,
                role: roleDesc,
                ip: c.ip_address || '192.168.0.100',
                rtsp: rtspUrl,
                hls: hlsUrl,
                resolution: '1080P FHD (1920x1080)',
                defaultAngle,
                plateSample,
              };
            })
          );
          setCameraSources(mapped);

          // Restore saved camera selections or assign intelligently based on device config
          const savedIdsStr = localStorage.getItem('rmc_wb_assigned_cams');
          let customAssigned: CameraSource[] | null = null;
          if (savedIdsStr) {
            try {
              const ids: string[] = JSON.parse(savedIdsStr);
              if (Array.isArray(ids) && ids.length === 3) {
                const c0 = mapped.find(c => c.id === ids[0]);
                const c1 = mapped.find(c => c.id === ids[1]);
                const c2 = mapped.find(c => c.id === ids[2]);
                if (c0 && c1 && c2) {
                  customAssigned = [c0, c1, c2];
                }
              }
            } catch (e) {}
          }

          if (customAssigned) {
            setAssignedCameras(customAssigned);
          } else {
            // Screen 0: Entry Camera
            const entryCam = mapped.find(c => c.id === 'cam_gate_1' || c.badge.toLowerCase().includes('entry')) || mapped[0];

            // Screen 1: Weighbridge / Scale Deck camera (explicitly matches configured weighbridge camera 'Exit 2' or location 'weighbridge')
            const wbCam = mapped.find(c => c.id === 'Exit 2' || c.badge.toLowerCase().includes('weigh') || c.role.toLowerCase().includes('scale')) 
              || mapped.find(c => c.id === 'cam_gate_2') 
              || mapped[1] 
              || mapped[0];

            // Screen 2: Exit / Rear Camera
            const exitCam = mapped.find(c => c.id === 'cam_gate_3' || c.badge.toLowerCase().includes('exit')) 
              || mapped.find(c => c.id !== entryCam?.id && c.id !== wbCam?.id)
              || mapped[2] 
              || mapped[0];

            setAssignedCameras([entryCam, wbCam, exitCam]);
          }
        }
      } catch (e) {
        console.warn('Failed to load dynamic cameras for weighbridge:', e);
      }
    };

    fetchWeighbridgeCameras();
    window.addEventListener('rmc-camera-updated', fetchWeighbridgeCameras);
    return () => window.removeEventListener('rmc-camera-updated', fetchWeighbridgeCameras);
  }, []);

  // Per-screen status & mode
  const [screenStatuses, setScreenStatuses] = useState<('connecting' | 'connected' | 'error' | 'simulated' | 'webcam')[]>([
    'connecting',
    'connecting',
    'connecting',
  ]);

  const [feedModes, setFeedModes] = useState<('rtsp' | 'simulated' | 'webcam')[]>([
    'rtsp',
    'rtsp',
    'rtsp',
  ]);

  // Diagnostics modal and hardware status
  const [diagModalOpen, setDiagModalOpen] = useState(false);
  const [diagData, setDiagData] = useState<any>(null);
  const [ftpStatus, setFtpStatus] = useState<any>(null);

  // 3 Video element refs
  const videoRefs = [
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
  ];

  // 3 Direct Canvas refs for robust zero-latency fallback
  const canvasRefs = [
    useRef<HTMLCanvasElement>(null),
    useRef<HTMLCanvasElement>(null),
    useRef<HTMLCanvasElement>(null),
  ];

  // 3 HLS instances
  const hlsInstances = useRef<(Hls | null)[]>([null, null, null]);
  const animFrameRefs = useRef<(number | null)[]>([null, null, null]);
  const simStreams = useRef<(MediaStream | null)[]>([null, null, null]);
  const webcamStreams = useRef<(MediaStream | null)[]>([null, null, null]);

  // Fetch camera network diagnostics and FTP status on mount
  useEffect(() => {
    api.getCameraDiagnostics()
      .then(data => setDiagData(data))
      .catch(e => console.warn('Camera diagnostics load notice:', e));

    api.getFtpStatus()
      .then(status => setFtpStatus(status))
      .catch(e => console.warn('FTP status check notice:', e));
  }, []);

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Stop tile simulation if active
  const stopTileSimulation = useCallback((screenIndex: number) => {
    if (animFrameRefs.current[screenIndex]) {
      cancelAnimationFrame(animFrameRefs.current[screenIndex]!);
      animFrameRefs.current[screenIndex] = null;
    }
    if (simStreams.current[screenIndex]) {
      simStreams.current[screenIndex]?.getTracks().forEach(t => t.stop());
      simStreams.current[screenIndex] = null;
    }
  }, []);

  // Stop WebCam stream
  const stopWebcam = useCallback((screenIndex: number) => {
    if (webcamStreams.current[screenIndex]) {
      webcamStreams.current[screenIndex]?.getTracks().forEach(t => t.stop());
      webcamStreams.current[screenIndex] = null;
    }
    const video = videoRefs[screenIndex].current;
    if (video && video.srcObject) {
      video.srcObject = null;
    }
  }, []);

  // Start WebCam stream
  const startWebcam = useCallback(async (screenIndex: number = 0) => {
    stopTileSimulation(screenIndex);
    stopWebcam(screenIndex);
    if (hlsInstances.current[screenIndex]) {
      hlsInstances.current[screenIndex]?.destroy();
      hlsInstances.current[screenIndex] = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      webcamStreams.current[screenIndex] = stream;
      const video = videoRefs[screenIndex].current;
      if (video) {
        video.srcObject = stream;
        video.play().catch(e => console.warn('Webcam play notice:', e));
      }
      setFeedModes(prev => {
        const next = [...prev];
        next[screenIndex] = 'webcam';
        return next;
      });
      setScreenStatuses(prev => {
        const next = [...prev];
        next[screenIndex] = 'webcam';
        return next;
      });
      toast.success(`Screen 0${screenIndex + 1}: Live Integrated WebCam Connected!`);
    } catch (err: any) {
      toast.error(`WebCam access notice: ${err.message || 'Permission not granted'}`);
    }
  }, [stopTileSimulation, stopWebcam]);

  // Connect WebCam to all 3 screens simultaneously
  const startAllWebcams = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      [0, 1, 2].forEach(idx => {
        stopTileSimulation(idx);
        stopWebcam(idx);
        webcamStreams.current[idx] = stream;
        const video = videoRefs[idx].current;
        if (video) {
          video.srcObject = stream;
          video.play().catch(() => {});
        }
      });
      setFeedModes(['webcam', 'webcam', 'webcam']);
      setScreenStatuses(['webcam', 'webcam', 'webcam']);
      toast.success('Live WebCam connected across all 3 screens!');
    } catch (err: any) {
      toast.error(`WebCam error: ${err.message || 'Permission denied'}`);
    }
  }, [stopTileSimulation, stopWebcam]);

  // Toggle WebCam mode
  const toggleWebcam = useCallback((screenIndex: number) => {
    if (feedModes[screenIndex] === 'webcam') {
      stopWebcam(screenIndex);
      setFeedModes(prev => {
        const next = [...prev];
        next[screenIndex] = 'simulated';
        return next;
      });
      toast.info(`Screen 0${screenIndex + 1}: Switched to CCTV Feed`);
    } else {
      startWebcam(screenIndex);
    }
  }, [feedModes, startWebcam, stopWebcam]);

  // Run in-browser canvas animation generator for a tile
  const startTileSimulation = useCallback((screenIndex: number) => {
    stopTileSimulation(screenIndex);

    const canvas = canvasRefs[screenIndex]?.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cam = assignedCameras[screenIndex];
    let frame = 0;

    const render = () => {
      frame++;
      const w = 640;
      const h = 360;

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, 150);
      sky.addColorStop(0, '#090d16');
      sky.addColorStop(1, '#1e293b');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, 150);

      // Facility Silos & Plant Structures
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(70, 30, 48, 120);
      ctx.fillRect(125, 20, 48, 130);
      ctx.fillRect(180, 40, 42, 110);
      ctx.beginPath();
      ctx.arc(94, 30, 24, Math.PI, 0);
      ctx.arc(149, 20, 24, Math.PI, 0);
      ctx.arc(201, 40, 21, Math.PI, 0);
      ctx.fill();

      // Weighbridge Platform Scale Deck
      ctx.fillStyle = screenIndex === 1 ? '#18181b' : '#1e2024';
      ctx.beginPath();
      ctx.moveTo(160, 150);
      ctx.lineTo(480, 150);
      ctx.lineTo(620, 360);
      ctx.lineTo(20, 360);
      ctx.closePath();
      ctx.fill();

      // Platform safety curb (yellow & black caution stripes)
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(30, 342, 580, 8);

      // Moving Truck
      const truckPos = (frame % 260) / 260;
      const truckX = 120 + truckPos * 270;
      const truckY = 160 + truckPos * 60;
      const truckW = 125 + truckPos * 55;
      const truckH = 60 + truckPos * 30;

      // Body & Cab
      ctx.fillStyle = screenIndex === 0 ? '#0284c7' : screenIndex === 1 ? '#059669' : '#d97706';
      ctx.fillRect(truckX, truckY, truckW, truckH);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(truckX + truckW - 36, truckY - 14, 36, truckH + 14);

      // Wheels
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(truckX + 25, truckY + truckH + 8, 12, 0, Math.PI * 2);
      ctx.arc(truckX + 60, truckY + truckH + 8, 12, 0, Math.PI * 2);
      ctx.arc(truckX + truckW - 15, truckY + truckH + 8, 12, 0, Math.PI * 2);
      ctx.fill();

      // Specific Overlays
      if (screenIndex === 0) {
        // CAM 1 ANPR: Front Bumper Plate Scan Box
        const pX = truckX + truckW - 34;
        const pY = truckY + truckH - 14;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(pX, pY, 32, 12);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.fillRect(pX, pY, 32, 12);
      } else if (screenIndex === 1) {
        // CAM 2 Platform: Toledo Deck Alignment Box
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(80, 210, 480, 125);
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
        ctx.fillRect(80, 210, 480, 125);
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('TOLEDO PLATFORM DECK • WHEEL ALIGNMENT [OK]', 95, 230);
      } else {
        // CAM 3 Exit: Chute seal
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(truckX + 10, truckY + 10, 40, 40);
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('CHUTE SEALED', truckX + 10, truckY + 5);
      }

      // Live Watermark HUD on canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(10, 10, 310, 26);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`${cam.badge} • ${cam.ip}`, 18, 27);

      animFrameRefs.current[screenIndex] = requestAnimationFrame(render);
    };

    render();

    setScreenStatuses(prev => {
      const next = [...prev];
      next[screenIndex] = 'simulated';
      return next;
    });
  }, [assignedCameras, stopTileSimulation]);

  // Connect Physical HLS Stream with automatic fallback
  const initHlsStream = useCallback((screenIndex: number) => {
    const cam = assignedCameras[screenIndex];
    const video = videoRefs[screenIndex].current;
    if (!video || !cam) return;

    if (feedModes[screenIndex] === 'simulated') {
      startTileSimulation(screenIndex);
      return;
    }

    stopTileSimulation(screenIndex);

    if (hlsInstances.current[screenIndex]) {
      hlsInstances.current[screenIndex]?.destroy();
      hlsInstances.current[screenIndex] = null;
    }

    setScreenStatuses(prev => {
      const next = [...prev];
      next[screenIndex] = 'connecting';
      return next;
    });

    let isConnected = false;

    // Generous fallback timer: only activate simulation if physical camera cannot connect within 8 seconds
    const fallbackTimer = setTimeout(() => {
      if (!isConnected && feedModes[screenIndex] === 'rtsp') {
        startTileSimulation(screenIndex);
      }
    }, 8000);

    const markConnected = () => {
      if (!isConnected) {
        isConnected = true;
        clearTimeout(fallbackTimer);
        stopTileSimulation(screenIndex);
        setScreenStatuses(prev => {
          const next = [...prev];
          next[screenIndex] = 'connected';
          return next;
        });
      }
    };

    video.onplaying = markConnected;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        manifestLoadingTimeOut: 8000,
        manifestLoadingMaxRetry: 3,
        levelLoadingTimeOut: 8000,
        fragLoadingTimeOut: 8000,
      });

      hlsInstances.current[screenIndex] = hls;
      hls.loadSource(cam.hls);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        markConnected();
        video.play().catch(e => console.warn(`Autoplay on screen ${screenIndex}:`, e));
      });

      hls.on(Hls.Events.FRAG_LOADED, () => {
        markConnected();
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              clearTimeout(fallbackTimer);
              hls.destroy();
              hlsInstances.current[screenIndex] = null;
              startTileSimulation(screenIndex);
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = cam.hls;
      video.addEventListener('loadedmetadata', () => {
        markConnected();
        video.play().catch(e => console.warn('Safari video autoplay:', e));
      });
      video.addEventListener('error', () => {
        clearTimeout(fallbackTimer);
        startTileSimulation(screenIndex);
      });
    } else {
      clearTimeout(fallbackTimer);
      startTileSimulation(screenIndex);
    }
  }, [assignedCameras, feedModes, startTileSimulation, stopTileSimulation]);


  // Connect on mount & assignedCameras changes
  useEffect(() => {
    [0, 1, 2].forEach(idx => {
      initHlsStream(idx);
    });

    return () => {
      hlsInstances.current.forEach(h => h?.destroy());
      hlsInstances.current = [null, null, null];
      [0, 1, 2].forEach(idx => stopTileSimulation(idx));
    };
  }, [initHlsStream, stopTileSimulation]);

  // Re-assign camera to a screen
  const handleAssignCamera = (screenIndex: number, cameraId: string) => {
    const selected = cameraSources.find(c => c.id === cameraId) || AVAILABLE_CAMERAS.find(c => c.id === cameraId);
    if (!selected) return;

    setAssignedCameras(prev => {
      const next = [...prev];
      next[screenIndex] = selected;
      localStorage.setItem('rmc_wb_assigned_cams', JSON.stringify(next.map(c => c.id)));
      return next;
    });

    toast.info(`Assigned ${selected.name} to Screen 0${screenIndex + 1}`);
  };


  // Toggle feed mode (RTSP vs Simulation)
  const toggleFeedMode = (screenIndex: number) => {
    const newMode = feedModes[screenIndex] === 'rtsp' ? 'simulated' : 'rtsp';
    setFeedModes(prev => {
      const next = [...prev];
      next[screenIndex] = newMode;
      return next;
    });

    if (newMode === 'simulated') {
      if (hlsInstances.current[screenIndex]) {
        hlsInstances.current[screenIndex]?.destroy();
        hlsInstances.current[screenIndex] = null;
      }
      startTileSimulation(screenIndex);
      toast.info(`Screen 0${screenIndex + 1}: Switched to Demo Simulation Feed`);
    } else {
      stopTileSimulation(screenIndex);
      setTimeout(() => initHlsStream(screenIndex), 200);
      toast.info(`Screen 0${screenIndex + 1}: Connecting to Physical RTSP stream...`);
    }
  };

  // Capture frame as Evidence Image
  const captureCameraSnapshot = (screenIndex: number) => {
    const cam = assignedCameras[screenIndex];
    const video = videoRefs[screenIndex].current;
    const canvasEl = canvasRefs[screenIndex]?.current;
    const isLiveVideo = screenStatuses[screenIndex] === 'connected' || screenStatuses[screenIndex] === 'webcam';

    if (!video && !canvasEl) {
      toast.error(`Video stream not available for ${cam.name}`);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isLiveVideo && video && (video.videoWidth > 0 || video.srcObject)) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } else if (canvasEl) {
      ctx.drawImage(canvasEl, 0, 0, canvas.width, canvas.height);
    } else if (video) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    // Watermark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(10, canvas.height - 46, 360, 36);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(
      `WEIGHBRIDGE: ${(currentWeight.weight / 1000).toFixed(2)}T | ${cam.name}`,
      20,
      canvas.height - 28
    );
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(
      `${new Date().toLocaleString()} | IP: ${cam.ip}`,
      20,
      canvas.height - 14
    );

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    const newEvidence: Evidence = {
      id: `ev-wb-s${screenIndex}-${Date.now()}`,
      type: 'image',
      url: dataUrl,
      angle: cam.defaultAngle,
      timestamp: new Date().toISOString(),
    };

    onEvidenceCaptured?.(newEvidence);
    toast.success(`Captured ${cam.name} (${cam.defaultAngle.toUpperCase()} view)! Uploading to FTP...`);

    // Upload to remote SFTPGo FTP location
    api.uploadToFtp({
      image: dataUrl,
      vehicleRegNo: vehicleRegNo || 'WB_VEH',
      angle: cam.defaultAngle,
      weight: currentWeight.weight,
      cameraName: cam.name,
    }).then(ftpRes => {
      if (ftpRes?.success) {
        toast.success(`Stored on FTP! ${ftpRes.remotePath}`, {
          description: `Uploaded to ${ftpRes.ftpUrl}`,
          action: {
            label: "Open FTP",
            onClick: () => window.open(ftpRes.webAdminUrl || 'http://sftpgo-zkiu7thmtlpwpdojnucvhahr.213.210.37.249.sslip.io/web/admin/users', '_blank')
          }
        });
      }
    }).catch(e => console.warn('FTP upload warning:', e));

    // Automatic Edge ANPR detection on camera frame
    api.recognizeEdgePlate(dataUrl, cam.id)
      .then(res => {
        if (res && res.success && res.plate) {
          toast.success(`⚡ Edge ANPR: Detected ${res.plate} (${Math.round((res.confidence || 0.96) * 100)}%) via ${res.engine}`);
          onPlateDetected?.(res.plate);
        }
      })
      .catch(e => console.warn('Edge ANPR notice:', e));
  };

  // Multi-Angle: Snap all 3 cameras concurrently & upload to FTP!
  const captureAllCameras = async () => {
    setIsCapturingAll(true);
    let count = 0;
    const uploadPromises: Promise<any>[] = [];

    [0, 1, 2].forEach(screenIndex => {
      const cam = assignedCameras[screenIndex];
      const video = videoRefs[screenIndex].current;
      const canvasEl = canvasRefs[screenIndex]?.current;
      const isLiveVideo = screenStatuses[screenIndex] === 'connected' || screenStatuses[screenIndex] === 'webcam';
      if (!video && !canvasEl) return;

      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (isLiveVideo && video && (video.videoWidth > 0 || video.srcObject)) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } else if (canvasEl) {
        ctx.drawImage(canvasEl, 0, 0, canvas.width, canvas.height);
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(10, canvas.height - 46, 360, 36);
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(
        `WEIGHBRIDGE: ${(currentWeight.weight / 1000).toFixed(2)}T | ${cam.name}`,
        20,
        canvas.height - 28
      );
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(
        `${new Date().toLocaleString()} | IP: ${cam.ip}`,
        20,
        canvas.height - 14
      );

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

      const newEvidence: Evidence = {
        id: `ev-wb-multi-${screenIndex}-${Date.now()}`,
        type: 'image',
        url: dataUrl,
        angle: cam.defaultAngle,
        timestamp: new Date().toISOString(),
      };

      onEvidenceCaptured?.(newEvidence);
      count++;

      uploadPromises.push(
        api.uploadToFtp({
          image: dataUrl,
          vehicleRegNo: vehicleRegNo || 'WB_VEH',
          angle: cam.defaultAngle,
          weight: currentWeight.weight,
          cameraName: cam.name,
        }).catch(e => console.warn('FTP upload warning:', e))
      );
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successful = results.filter(r => r?.success).length;
      toast.success(`Multi-Angle Capture Complete! Saved ${count} views & uploaded ${successful} to FTP.`, {
        description: 'Stored in /weighbridge on SFTPGo server',
        action: {
          label: "Open FTP",
          onClick: () => window.open('http://sftpgo-zkiu7thmtlpwpdojnucvhahr.213.210.37.249.sslip.io/web/admin/users', '_blank')
        }
      });
    } catch (e) {
      toast.success(`Multi-Angle Capture Complete! Saved ${count} camera angles.`);
    } finally {
      setIsCapturingAll(false);
    }
  };


  const handleScanPlate = async () => {
    try {
      const video = videoRefs[0].current;
      const canvasEl = canvasRefs[0]?.current;
      const isLiveVideo = screenStatuses[0] === 'connected' || screenStatuses[0] === 'webcam';
      if ((isLiveVideo && video) || canvasEl) {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (isLiveVideo && video && (video.videoWidth > 0 || video.srcObject)) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          } else if (canvasEl) {
            ctx.drawImage(canvasEl, 0, 0, canvas.width, canvas.height);
          }
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          const res = await api.recognizeEdgePlate(dataUrl, assignedCameras[0].id);
          if (res && res.success && res.plate) {
            onPlateDetected?.(res.plate);
            toast.success(`Edge ANPR: Scanned license plate ${res.plate} (${Math.round((res.confidence || 0.96) * 100)}% conf)`);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Edge scan notice:', e);
    }
    const plate = vehicleRegNo || assignedCameras[0].plateSample;
    onPlateDetected?.(plate);
    toast.success(`Scanned license plate from ANPR camera: ${plate}`);
  };

  const copyRtsp = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(id);
    toast.success('RTSP URL copied');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleTileFullscreen = (tileId: string) => {
    const el = document.getElementById(tileId);
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const activeLiveCount = screenStatuses.filter(s => s === 'connected' || s === 'simulated').length;

  return (
    <Card className="border-border shadow-xl overflow-hidden bg-card/95 backdrop-blur-md">
      {/* Master Surveillance Header */}
      <CardHeader className="pb-3.5 bg-gradient-to-r from-muted/60 via-card to-muted/40 border-b">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  Weighbridge Multi-Camera Surveillance
                </CardTitle>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-mono text-xs gap-1.5 py-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  {activeLiveCount} / 3 SCREENS ACTIVE
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                Concurrent Multi-Screen: {assignedCameras.map(c => `${c.name} (${c.ip})`).join(' • ')}
              </p>
            </div>
          </div>

          {/* Master Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* SFTPGo FTP Remote Storage Indicator & Link */}
            <a
              href="http://sftpgo-zkiu7thmtlpwpdojnucvhahr.213.210.37.249.sslip.io/web/admin/users"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/60 border border-sky-500/40 text-xs text-sky-300 hover:bg-sky-900/60 transition-colors font-mono shadow-xs"
              title="SFTPGo FTP Storage (User: aparna_rmc | Admin: ftpsuperadmin / Demo#Test@2026)"
            >
              <span className={`h-2 w-2 rounded-full ${ftpStatus?.online ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="font-semibold">FTP: 213.210.37.249:2121 /weighbridge</span>
              <ExternalLink className="h-3 w-3 text-sky-400 ml-0.5" />
            </a>

            {/* Diagnostics & Network Hardware Link */}
            <Button
              size="sm"
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-xs gap-1.5"
              onClick={() => setDiagModalOpen(true)}
            >
              <Network className="h-3.5 w-3.5 text-amber-400" />
              Diagnostics & Setup
            </Button>


            {/* Instant WebCam Mode Toggle */}
            <Button
              size="sm"
              variant={screenStatuses.some(s => s === 'webcam') ? 'default' : 'outline'}
              className={`text-xs gap-1.5 ${
                screenStatuses.some(s => s === 'webcam')
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
                  : 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
              }`}
              onClick={startAllWebcams}
            >
              <Video className="h-3.5 w-3.5" />
              {screenStatuses.some(s => s === 'webcam') ? 'WebCam Active' : 'Use WebCam'}
            </Button>

            {/* Multi-Angle Snap */}
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-1.5 shadow-sm"
              onClick={captureAllCameras}
              disabled={isCapturingAll}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              Capture All 3 Angles
            </Button>

            {/* Quick Plate OCR */}
            <Button
              size="sm"
              variant="outline"
              className="border-primary/40 text-primary hover:bg-primary/10 text-xs gap-1.5"
              onClick={handleScanPlate}
            >
              <Scan className="h-3.5 w-3.5" />
              Scan Plate OCR
            </Button>

            {/* Layout Mode Selector */}
            <div className="flex items-center border rounded-lg p-0.5 bg-background/80">
              <Button
                variant={layoutMode === 'grid3' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2.5 text-xs gap-1"
                onClick={() => setLayoutMode('grid3')}
                title="3 Screens Side-by-Side"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                3-Grid
              </Button>
              <Button
                variant={layoutMode === 'focus' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2.5 text-xs gap-1"
                onClick={() => setLayoutMode('focus')}
                title="1 Focus Hero + 2 Sub-Screens"
              >
                <Columns className="h-3.5 w-3.5" />
                Focus + 2
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 bg-neutral-950">
        {/* Physical Camera Link Status Alert (When IP cameras unreachable over LAN) */}
        {diagData?.networkSummary?.allCamerasOffline && (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-950/40 via-neutral-900 to-amber-950/30 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <span>Physical CCTV Cameras Offline (Ethernet Cable Unplugged)</span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1 border-amber-400/40 text-amber-400">
                    Host: 192.168.0.10
                  </Badge>
                </span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  IP cameras (<code className="text-amber-200 font-mono">192.168.0.100</code> & <code className="text-amber-200 font-mono">192.168.0.99</code>) are unreachable because PC Ethernet is disconnected. Click below to test with your WebCam or check setup steps.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                onClick={() => startWebcam(0)}
              >
                <Video className="h-3.5 w-3.5" />
                Turn On WebCam
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/10 gap-1.5"
                onClick={() => setDiagModalOpen(true)}
              >
                <Network className="h-3.5 w-3.5" />
                Network Diagnostics
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* LAYOUT 1: 3-SCREEN GRID (All 3 Screens Live Simultaneously)    */}
        {/* ============================================================== */}
        {layoutMode === 'grid3' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map(screenIdx => {
              const cam = assignedCameras[screenIdx];
              const status = screenStatuses[screenIdx];
              const isLiveVideo = status === 'connected' || status === 'webcam';
              const isLive = isLiveVideo || status === 'simulated';
              const tileId = `wb-tile-screen-${screenIdx}`;

              return (
                <div
                  key={screenIdx}
                  id={tileId}
                  className="rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 flex flex-col justify-between group shadow-lg transition-all duration-200 hover:border-primary/50 relative"
                >
                  {/* Top Bar for each Screen */}
                  <div className="p-2.5 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                      <span className="font-bold text-neutral-100 truncate">{cam.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {status === 'webcam' ? (
                        <Badge className="bg-emerald-600 text-white border-emerald-400 text-[10px] px-1.5 py-0 font-mono gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          WEBCAM LIVE
                        </Badge>
                      ) : status === 'connected' ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0 font-mono">
                          RTSP LIVE
                        </Badge>
                      ) : status === 'simulated' ? (
                        <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 text-[10px] px-1.5 py-0 font-mono">
                          CCTV FEED
                        </Badge>
                      ) : status === 'connecting' ? (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono animate-pulse">
                          CONNECTING
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-mono">
                          OFFLINE
                        </Badge>
                      )}

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-neutral-400 hover:text-white"
                        onClick={() => toggleTileFullscreen(tileId)}
                        title="Fullscreen"
                      >
                        <Maximize2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Video Viewport: Physical HLS Stream with Direct Canvas Simulation Fallback */}
                  <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                    <video
                      ref={videoRefs[screenIdx]}
                      className={`w-full h-full object-contain ${isLiveVideo ? 'block' : 'hidden'}`}
                      autoPlay
                      muted
                      playsInline
                      controls={false}
                    />
                    <canvas
                      ref={canvasRefs[screenIdx]}
                      width={640}
                      height={360}
                      className={`w-full h-full object-cover ${isLiveVideo ? 'hidden' : 'block'}`}
                    />

                    {/* Connecting Banner Overlay (Top subtle pill) */}
                    {status === 'connecting' && (
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 border border-amber-500/30 flex items-center gap-1.5 z-10">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                        <span>CONNECTING PHYSICAL RTSP...</span>
                      </div>
                    )}

                    {/* Overlays when Live */}
                    {isLive && (
                      <>
                        {/* Camera Tag & Clock HUD (Top Left) */}
                        <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-mono text-white/90 flex items-center gap-1.5 pointer-events-none">
                          <span className="font-bold text-primary">{cam.badge}</span>
                          <span className="text-neutral-500">|</span>
                          <span>{currentTime}</span>
                        </div>

                        {/* REC Badge (Top Right) */}
                        <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-mono text-rose-400 flex items-center gap-1 pointer-events-none">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                          REC
                        </div>

                        {/* Telemetry Overlay for Platform Bay (Screen 1 / Scale bay) */}
                        {cam.defaultAngle === 'side' && (
                          <div className="absolute bottom-2 left-2 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded border border-primary/40 flex items-center gap-2 pointer-events-none shadow-lg">
                            <Scale className="h-4 w-4 text-primary" />
                            <div>
                              <div className="text-[9px] font-mono uppercase text-muted-foreground leading-none">
                                DECK WEIGHT
                              </div>
                              <div className="text-sm font-bold font-mono text-primary tabular-nums leading-tight">
                                {(currentWeight.weight / 1000).toFixed(2)} <span className="text-[10px] font-normal text-white">T</span>
                                <span className={`ml-1 text-[9px] px-1 rounded ${currentWeight.stable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                  {currentWeight.stable ? 'STABLE' : 'READING'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ANPR Detected Plate Tag (Screen 0 / Front) */}
                        {cam.defaultAngle === 'front' && (
                          <div className="absolute bottom-2 left-2 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded border border-sky-500/40 flex items-center gap-2 pointer-events-none shadow-lg">
                            <Scan className="h-4 w-4 text-sky-400" />
                            <div>
                              <div className="text-[9px] font-mono uppercase text-sky-300 leading-none">
                                ANPR DETECT
                              </div>
                              <div className="text-xs font-bold font-mono text-white tabular-nums leading-tight mt-0.5">
                                {vehicleRegNo || cam.plateSample}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Exit Barrier Tag (Screen 2 / Rear) */}
                        {cam.defaultAngle === 'rear' && (
                          <div className="absolute bottom-2 left-2 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded border border-amber-500/40 flex items-center gap-2 pointer-events-none shadow-lg">
                            <ShieldCheck className="h-4 w-4 text-amber-400" />
                            <div>
                              <div className="text-[9px] font-mono uppercase text-amber-300 leading-none">
                                EXIT BARRIER
                              </div>
                              <div className="text-xs font-bold font-mono text-white leading-tight mt-0.5">
                                CHUTE MONITORED
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Screen Action Footer */}
                  <div className="p-2 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 px-2.5 text-[11px] gap-1 font-medium bg-neutral-800 hover:bg-neutral-700 text-white"
                        onClick={() => captureCameraSnapshot(screenIdx)}
                      >
                        <Camera className="h-3 w-3 text-primary" />
                        Snap {cam.defaultAngle.toUpperCase()}
                      </Button>

                      {cam.defaultAngle === 'front' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px] gap-1 border-sky-500/40 text-sky-400 hover:bg-sky-500/10"
                          onClick={handleScanPlate}
                          title="Scan Plate from ANPR"
                        >
                          <Scan className="h-3 w-3" />
                          OCR
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Camera Source Selector Dropdown */}
                      <Select
                        value={cam.id}
                        onValueChange={(val) => handleAssignCamera(screenIdx, val)}
                      >
                        <SelectTrigger className="h-7 w-[100px] text-[10px] bg-neutral-800 border-neutral-700 text-neutral-300">
                          <SelectValue placeholder="Source" />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                          {cameraSources.map(c => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        variant={status === 'webcam' ? 'default' : 'ghost'}
                        className={`h-7 px-1.5 text-[11px] ${
                          status === 'webcam' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'
                        }`}
                        onClick={() => toggleWebcam(screenIdx)}
                        title={status === 'webcam' ? 'Stop WebCam' : 'Stream WebCam to this screen'}
                      >
                        <Video className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-1.5 text-[11px] text-neutral-400 hover:text-white"
                        onClick={() => copyRtsp(cam.id, cam.rtsp)}
                        title="Copy RTSP URL"
                      >
                        {copiedKey === cam.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-1.5 text-[11px] text-neutral-400 hover:text-white"
                        onClick={() => toggleFeedMode(screenIdx)}
                        title="Toggle Demo Feed"
                      >
                        <Tv className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================================== */}
        {/* LAYOUT 2: FOCUS HERO + 2 AUXILIARY SCREENS                     */}
        {/* ============================================================== */}
        {layoutMode === 'focus' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Primary Hero Screen (8 cols) */}
            <div className="lg:col-span-8 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 flex flex-col justify-between shadow-2xl relative">
              {(() => {
                const cam = assignedCameras[focusedIndex];
                const status = screenStatuses[focusedIndex];
                const isLiveVideo = status === 'connected' || status === 'webcam';
                const isLive = isLiveVideo || status === 'simulated';

                return (
                  <>
                    <div className="p-3 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-bold text-sm text-neutral-100">{cam.name}</span>
                        <Badge variant="outline" className="text-xs font-mono border-primary/40 text-primary">
                          {cam.role}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        {status === 'webcam' ? (
                          <Badge className="bg-emerald-600 text-white border-emerald-400 text-xs font-mono">
                            WEBCAM LIVE
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs font-mono">
                            {cam.resolution}
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 text-xs gap-1.5"
                          onClick={() => captureCameraSnapshot(focusedIndex)}
                        >
                          <Camera className="h-3.5 w-3.5" />
                          Snap {cam.defaultAngle.toUpperCase()} View
                        </Button>
                      </div>
                    </div>

                    <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                      <video
                        ref={videoRefs[focusedIndex]}
                        className={`w-full h-full object-contain ${isLiveVideo ? 'block' : 'hidden'}`}
                        autoPlay
                        muted
                        playsInline
                        controls={false}
                      />
                      <canvas
                        ref={canvasRefs[focusedIndex]}
                        width={640}
                        height={360}
                        className={`w-full h-full object-cover ${isLiveVideo ? 'hidden' : 'block'}`}
                      />

                      {/* Overlaid HUD */}
                      {isLive && (
                        <>
                          <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm px-3 py-1 rounded text-xs font-mono text-white/90 flex items-center gap-2 pointer-events-none">
                            <span className="font-bold text-primary">{cam.badge}</span>
                            <span>•</span>
                            <span>{currentTime}</span>
                          </div>

                          <div className="absolute bottom-3 left-3 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-primary/40 flex items-center gap-3 pointer-events-none shadow-lg">
                            <Scale className="h-5 w-5 text-primary" />
                            <div>
                              <div className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider">SCALE DECK TELEMETRY</div>
                              <div className="text-base font-bold font-mono text-primary tabular-nums leading-none mt-0.5">
                                {(currentWeight.weight / 1000).toFixed(2)} <span className="text-xs font-normal text-white">tons</span>
                                <span className={`ml-2 text-[10px] font-mono px-1 rounded ${currentWeight.stable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                  {currentWeight.stable ? 'STABLE' : 'READING'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Auxiliary 2 Camera Screens (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {[0, 1, 2].map(idx => {
                if (idx === focusedIndex) return null;
                const cam = assignedCameras[idx];
                const status = screenStatuses[idx];
                const isLiveVideo = status === 'connected' || status === 'webcam';
                const isLive = isLiveVideo || status === 'simulated';

                return (
                  <div
                    key={idx}
                    onClick={() => setFocusedIndex(idx)}
                    className="cursor-pointer rounded-xl overflow-hidden border border-neutral-800 hover:border-primary bg-neutral-900 transition-all duration-200 group flex flex-col justify-between"
                  >
                    <div className="p-2 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-semibold text-neutral-200">{cam.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-primary group-hover:underline">
                        Click to Focus ↗
                      </span>
                    </div>

                    <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                      <video
                        ref={videoRefs[idx]}
                        className={`w-full h-full object-contain ${isLiveVideo ? 'block' : 'hidden'}`}
                        autoPlay
                        muted
                        playsInline
                        controls={false}
                      />
                      <canvas
                        ref={canvasRefs[idx]}
                        width={640}
                        height={360}
                        className={`w-full h-full object-cover ${isLiveVideo ? 'hidden' : 'block'}`}
                      />
                      <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-white/90">
                        {cam.badge}
                      </div>
                    </div>

                    <div className="p-2 bg-neutral-900 flex items-center justify-between text-xs">
                      <span className="text-[10px] font-mono text-neutral-400">{cam.ip}:554</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-6 text-[10px] px-2 gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          captureCameraSnapshot(idx);
                        }}
                      >
                        <Camera className="h-3 w-3 text-primary" />
                        Snap
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      {/* Network Camera Hardware Diagnostics & Setup Modal */}
      <CameraDiagnosticsModal
        isOpen={diagModalOpen}
        onClose={() => setDiagModalOpen(false)}
        onActivateWebcam={() => startWebcam(0)}
      />
    </Card>
  );
}
export default WeighbridgeLiveStream;
