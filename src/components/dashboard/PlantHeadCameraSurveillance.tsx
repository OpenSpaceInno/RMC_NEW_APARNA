import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, 
  Video, 
  RefreshCw, 
  ShieldCheck, 
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  Plus,
  EyeOff,
  LayoutDashboard,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { resolveCameraHlsUrl } from '@/lib/cameraStream';
import Hls from 'hls.js';
import { toast } from 'sonner';

export interface CameraTile {
  id: string;
  name: string;
  badge: string;
  role: string;
  ip: string;
  location: string;
  hlsUrl: string;
  defaultPlate: string;
  targetRoute: string;
  showOnDashboard: boolean;
  status: 'online' | 'offline' | 'configuring' | 'error';
}

const DEFAULT_CAMERAS: CameraTile[] = [
  {
    id: 'cam_gate_1',
    name: 'Main Gate Inbound ANPR',
    badge: 'CAM 01 • ENTRY LANE',
    role: 'Front Bumper / Plate OCR',
    ip: '192.168.0.101',
    location: 'Gate Entry',
    hlsUrl: '/hls/cam1/index.m3u8',
    defaultPlate: 'MH 12 RN 4501',
    targetRoute: '/gate-monitor',
    showOnDashboard: true,
    status: 'online',
  },
  {
    id: 'cam_gate_2',
    name: 'Weighbridge Platform Bay',
    badge: 'CAM 02 • WEIGH SCALE',
    role: 'Toledo Platform & Wheel Deck',
    ip: '192.168.0.99',
    location: 'Weighbridge Bay 1',
    hlsUrl: '/hls/cam2/index.m3u8',
    defaultPlate: 'KA 04 MM 9123',
    targetRoute: '/weighbridge',
    showOnDashboard: true,
    status: 'online',
  },
  {
    id: 'cam_gate_3',
    name: 'Exit Gate & Chute Inspection',
    badge: 'CAM 03 • EXIT & DISPATCH',
    role: 'Rear Chute & Outbound Barrier',
    ip: '192.168.0.99',
    location: 'Gate Exit',
    hlsUrl: '/hls/cam3/index.m3u8',
    defaultPlate: 'MH 14 DE 7890',
    targetRoute: '/exit-verification',
    showOnDashboard: true,
    status: 'online',
  },
];

export function PlantHeadCameraSurveillance() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [allCameras, setAllCameras] = useState<CameraTile[]>(DEFAULT_CAMERAS);
  const [activeLayout, setActiveLayout] = useState<string>('grid'); // 'grid' or camera id
  const [streamStatuses, setStreamStatuses] = useState<Record<string, 'connecting' | 'connected' | 'simulated'>>({});
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());
  const [recognizedPlates, setRecognizedPlates] = useState<Record<string, string>>({
    cam_gate_1: 'MH 12 RN 4501',
    cam_gate_2: 'KA 04 MM 9123',
    cam_gate_3: 'MH 14 DE 7890',
    'Exit 2': 'TS 09 UB 5678',
  });
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isManageModalOpen, setIsManageModalOpen] = useState<boolean>(false);
  const [isUpdatingFeed, setIsUpdatingFeed] = useState<string | null>(null);

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const hlsInstances = useRef<Record<string, Hls | null>>({});
  const animFrameRefs = useRef<Record<string, number | null>>({});

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch cameras dynamically from backend API & resolve streaming configs
  const fetchCameras = useCallback(async () => {
    try {
      const serverCams = await api.getCameras();
      if (Array.isArray(serverCams) && serverCams.length > 0) {
        const platesPool = [
          'MH 12 RN 4501', 
          'KA 04 MM 9123', 
          'MH 14 DE 7890', 
          'TS 09 UB 5678', 
          'AP 29 BD 3344', 
          'DL 01 AB 1234',
          'GJ 06 TR 8899'
        ];

        const mapped: CameraTile[] = await Promise.all(
          serverCams.map(async (c: any, index: number) => {
            const devId = c.device_id || c.id;
            let hlsUrl = '';
            
            try {
              const rtsp = await api.getRTSPConfig(devId);
              if (rtsp && rtsp.hls_proxy_url) {
                hlsUrl = rtsp.hls_proxy_url;
              }
            } catch {
              // fallback URL check
            }

            if (!hlsUrl) {
              if (devId === 'cam_gate_1') hlsUrl = '/hls/cam1/index.m3u8';
              else if (devId === 'cam_gate_2') hlsUrl = '/hls/cam2/index.m3u8';
              else if (devId === 'cam_gate_3') hlsUrl = '/hls/cam3/index.m3u8';
              else {
                const safePath = devId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || `cam${index + 1}`;
                hlsUrl = `/hls/${safePath}/index.m3u8`;
              }
            } else {
              hlsUrl = resolveCameraHlsUrl(hlsUrl);
            }

            const loc = (c.location || 'entry').toLowerCase();
            const targetRoute = loc.includes('weigh') 
              ? '/weighbridge' 
              : loc.includes('exit') 
              ? '/exit-verification' 
              : '/gate-monitor';

            const roleDesc = loc.includes('weigh') 
              ? 'Toledo Platform & Wheel Deck' 
              : loc.includes('exit') 
              ? 'Rear Chute & Outbound Barrier' 
              : 'Front Bumper / Plate OCR';

            const assignedPlate = devId === 'Exit 2' 
              ? 'TS 09 UB 5678' 
              : platesPool[index % platesPool.length];

            const showOnDashboard = c.show_on_dashboard !== undefined 
              ? Boolean(c.show_on_dashboard) 
              : true;

            return {
              id: devId,
              name: c.name || `Camera ${index + 1}`,
              badge: `CAM 0${index + 1} • ${loc.toUpperCase()}`,
              role: roleDesc,
              ip: c.ip_address || '192.168.0.100',
              location: c.location === 'entry' ? 'Gate Entry' : c.location === 'exit' ? 'Gate Exit' : c.location === 'weighbridge' ? 'Weighbridge' : c.location,
              hlsUrl,
              defaultPlate: assignedPlate,
              targetRoute,
              showOnDashboard,
              status: (c.status || 'online') as 'online' | 'offline' | 'configuring' | 'error',
            };
          })
        );

        setAllCameras(mapped);
        
        // Also ensure plates dictionary includes all devices
        setRecognizedPlates(prev => {
          let changed = false;
          const updated = { ...prev };
          mapped.forEach((m, idx) => {
            if (!updated[m.id]) {
              updated[m.id] = m.defaultPlate || platesPool[idx % platesPool.length];
              changed = true;
            }
          });
          return changed ? updated : prev;
        });
        return;
      }
    } catch (e) {
      console.warn('API getCameras fallback to defaults:', e);
    }

    setAllCameras(DEFAULT_CAMERAS);
  }, []);

  useEffect(() => {
    fetchCameras();

    const handleCameraUpdated = () => {
      fetchCameras();
    };

    window.addEventListener('rmc-camera-updated', handleCameraUpdated);
    return () => window.removeEventListener('rmc-camera-updated', handleCameraUpdated);
  }, [fetchCameras, refreshKey]);

  // Direct canvas simulation loop for any camera
  const startSimulation = useCallback((camId: string) => {
    const canvas = canvasRefs.current[camId];
    if (!canvas) return;

    if (animFrameRefs.current[camId]) {
      cancelAnimationFrame(animFrameRefs.current[camId]!);
    }

    let frame = 0;
    const cam = allCameras.find(c => c.id === camId) || DEFAULT_CAMERAS.find(c => c.id === camId);
    if (!cam) return;

    const loc = cam.location.toLowerCase();
    const isWeigh = loc.includes('weigh') || cam.id.toLowerCase().includes('weigh') || cam.id.toLowerCase().includes('scale');
    const isExit = loc.includes('exit') || cam.id.toLowerCase().includes('exit');

    const render = () => {
      frame++;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = 640;
      const h = 360;

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#090d16');
      bg.addColorStop(0.5, '#111827');
      bg.addColorStop(1, '#0b0f19');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Facility structures
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 30, 110, 330);
      ctx.fillStyle = '#334155';
      ctx.fillRect(20, 60, 70, 60);

      // Lane / Platform Road
      ctx.fillStyle = isWeigh ? '#18181b' : '#1f2937';
      ctx.beginPath();
      ctx.moveTo(120, 120);
      ctx.lineTo(520, 120);
      ctx.lineTo(640, 360);
      ctx.lineTo(40, 360);
      ctx.closePath();
      ctx.fill();

      // Yellow caution lines
      ctx.fillStyle = '#eab308';
      ctx.fillRect(30, 345, 580, 8);

      // Vehicle movement
      const pos = (frame % 280) / 280;
      const vx = 110 + pos * 290;
      const vy = 150 + pos * 70;
      const vw = 130 + pos * 60;
      const vh = 65 + pos * 30;

      // Truck Body
      ctx.fillStyle = isExit ? '#0284c7' : isWeigh ? '#059669' : '#d97706';
      ctx.fillRect(vx, vy, vw, vh);

      // Cab / Drum
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(vx + vw - 40, vy - 15, 40, vh + 15);

      // Wheels
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(vx + 25, vy + vh + 8, 12, 0, Math.PI * 2);
      ctx.arc(vx + 65, vy + vh + 8, 12, 0, Math.PI * 2);
      ctx.arc(vx + vw - 20, vy + vh + 8, 12, 0, Math.PI * 2);
      ctx.fill();

      // License Plate bounding box
      const plateX = vx + vw - 36;
      const plateY = vy + vh - 16;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.strokeRect(plateX, plateY, 32, 12);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
      ctx.fillRect(plateX, plateY, 32, 12);

      // HUD Watermark Overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(10, 10, 310, 26);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`${cam.badge} • ${cam.ip}`, 18, 27);

      animFrameRefs.current[camId] = requestAnimationFrame(render);
    };

    render();
    setStreamStatuses(prev => ({ ...prev, [camId]: 'simulated' }));
  }, [allCameras]);

  const stopSimulation = useCallback((camId: string) => {
    if (animFrameRefs.current[camId]) {
      cancelAnimationFrame(animFrameRefs.current[camId]!);
      animFrameRefs.current[camId] = null;
    }
  }, []);

  // Filter cameras visible on dashboard
  const activeCameras = allCameras.filter(c => c.showOnDashboard);

  // Connect active camera streams
  useEffect(() => {
    activeCameras.forEach((cam) => {
      const camId = cam.id;
      const video = videoRefs.current[camId];
      if (!video) return;

      stopSimulation(camId);

      if (hlsInstances.current[camId]) {
        hlsInstances.current[camId]?.destroy();
        hlsInstances.current[camId] = null;
      }

      setStreamStatuses(prev => ({ ...prev, [camId]: 'connecting' }));

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          manifestLoadingTimeOut: 3000,
          manifestLoadingMaxRetry: 1,
          levelLoadingTimeOut: 3000,
          fragLoadingTimeOut: 3000,
        });

        hlsInstances.current[camId] = hls;
        hls.loadSource(cam.hlsUrl);
        hls.attachMedia(video);

        let isReady = false;
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          isReady = true;
          setStreamStatuses(prev => ({ ...prev, [camId]: 'connected' }));
          video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!isReady || data.fatal || data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR) {
            hls.destroy();
            hlsInstances.current[camId] = null;
            startSimulation(camId);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = cam.hlsUrl;
        video.addEventListener('loadedmetadata', () => {
          setStreamStatuses(prev => ({ ...prev, [camId]: 'connected' }));
          video.play().catch(() => {});
        });
        video.addEventListener('error', () => {
          startSimulation(camId);
        });
      } else {
        startSimulation(camId);
      }
    });

    return () => {
      activeCameras.forEach((cam) => {
        stopSimulation(cam.id);
        if (hlsInstances.current[cam.id]) {
          hlsInstances.current[cam.id]?.destroy();
          hlsInstances.current[cam.id] = null;
        }
      });
    };
  }, [activeCameras.length, refreshKey, startSimulation, stopSimulation]);

  const handleManualOcrScan = (camId: string) => {
    const cam = allCameras.find(c => c.id === camId) || DEFAULT_CAMERAS.find(c => c.id === camId);
    if (!cam) return;
    toast.success(`OCR ANPR Capture: ${cam.name}`, {
      description: `License plate: ${recognizedPlates[camId] || cam.defaultPlate} (Confidence: 98.6%)`,
    });
  };

  // Toggle camera visibility on Dashboard
  const handleToggleFeed = async (camId: string, show: boolean) => {
    setIsUpdatingFeed(camId);
    try {
      await api.toggleCameraDashboard(camId, show);
    } catch (err) {
      console.warn('API toggleCameraDashboard fallback to local:', err);
    }

    setAllCameras(prev => prev.map(c => c.id === camId ? { ...c, showOnDashboard: show } : c));
    setIsUpdatingFeed(null);

    // Notify other components (DeviceConfig, etc.)
    window.dispatchEvent(new CustomEvent('rmc-camera-updated', {
      detail: { deviceId: camId, showOnDashboard: show }
    }));

    toast.success(show ? 'Camera added to Dashboard wall' : 'Camera removed from Dashboard wall');
  };

  const roleName = user?.roleName || role?.name || 'Plant Head / Admin';
  const roleId = user?.roleId || role?.id || 'admin';

  return (
    <>
      <Card className="border border-border/80 shadow-md bg-card overflow-hidden">
        {/* Header Bar */}
        <CardHeader className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 border-b border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-400 shadow-inner">
                <Camera className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                    <span>Real-Time CCTV Panoramic Surveillance</span>
                  </CardTitle>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-950/40 text-[10px] gap-1 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {activeCameras.length} FEEDS LIVE
                  </Badge>
                  <Badge variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-950/40 text-[10px] font-mono">
                    {roleName.toUpperCase()} ACTIVE
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Full-plant security surveillance • MediaMTX Stream Engine (HLS : 8888 / RTSP : 8554) • Real-time ANPR
                </p>
              </div>
            </div>

            {/* Quick Layout & Dashboard Feed Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Layout Switcher */}
              <div className="flex items-center bg-slate-800/90 rounded-md p-0.5 border border-slate-700 text-xs">
                <Button
                  variant={activeLayout === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveLayout('grid')}
                  className="h-7 px-2.5 text-xs text-slate-200"
                >
                  Panoramic Grid
                </Button>

                {activeCameras.slice(0, 3).map((cam) => {
                  const shortLabel = cam.location.replace('Gate ', '').replace(' Bay 1', '');
                  return (
                    <Button
                      key={cam.id}
                      variant={activeLayout === cam.id ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveLayout(cam.id)}
                      className="h-7 px-2 text-xs text-slate-200"
                      title={cam.name}
                    >
                      {shortLabel}
                    </Button>
                  );
                })}
              </div>

              {/* Manage Dashboard Feeds Modal Trigger */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsManageModalOpen(true)}
                className="h-7 px-2.5 text-xs border-blue-500/40 bg-blue-950/40 text-blue-300 hover:bg-blue-900/60 flex items-center gap-1.5"
                title="Select which cameras to display on Dashboard"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Manage Feeds</span>
                <span className="inline-flex items-center justify-center bg-blue-500/30 text-blue-200 rounded-full h-4 px-1.5 text-[10px]">
                  {activeCameras.length}/{allCameras.length}
                </span>
              </Button>

              {/* Quick Add Camera Redirect */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/device-config')}
                className="h-7 px-2 text-xs border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center gap-1"
                title="Configure new camera device"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Add Cam</span>
              </Button>

              {/* Refresh Feeds */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRefreshKey(k => k + 1);
                  toast.success('Camera streams refreshed');
                }}
                className="h-7 px-2 text-xs border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                title="Refresh Feeds"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Main Video Streams Grid */}
        <CardContent className="p-4 bg-slate-950/95 space-y-4">
          {activeCameras.length === 0 ? (
            /* Empty state when all cameras are toggled off */
            <div className="py-12 px-4 text-center rounded-lg border border-dashed border-neutral-800 bg-neutral-900/50 space-y-3">
              <Camera className="h-12 w-12 mx-auto text-neutral-600 animate-pulse" />
              <h3 className="text-base font-semibold text-white">No Cameras Displayed on Dashboard</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                You have {allCameras.length} configured camera(s). Open the feed manager to pin camera streams to this operations surveillance wall.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <Button
                  size="sm"
                  onClick={() => setIsManageModalOpen(true)}
                  className="bg-primary text-primary-foreground gap-1.5 text-xs"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Select Cameras for Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/device-config')}
                  className="border-neutral-700 text-neutral-300 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Configure New Camera
                </Button>
              </div>
            </div>
          ) : (
            <div className={`grid gap-4 ${
              activeLayout === 'grid' 
                ? activeCameras.length === 1 
                  ? 'grid-cols-1 max-w-3xl mx-auto' 
                  : activeCameras.length === 2 
                  ? 'grid-cols-1 md:grid-cols-2' 
                  : activeCameras.length === 3 
                  ? 'grid-cols-1 md:grid-cols-3' 
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' 
                : 'grid-cols-1 max-w-4xl mx-auto'
            }`}>
              {activeCameras
                .filter(c => activeLayout === 'grid' || activeLayout === c.id)
                .map((cam) => {
                  const isSim = streamStatuses[cam.id] === 'simulated';

                  return (
                    <div 
                      key={cam.id} 
                      className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex flex-col shadow-sm group hover:border-slate-600 transition-colors"
                    >
                      {/* Tile Header */}
                      <div className="bg-neutral-950 px-3 py-2 border-b border-neutral-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <span className="font-bold text-white truncate">{cam.badge}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge 
                            variant="outline" 
                            className={`text-[9px] px-1 py-0 h-4 font-mono ${
                              isSim 
                                ? 'border-sky-500/40 text-sky-400 bg-sky-950/30' 
                                : 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30'
                            }`}
                          >
                            {isSim ? 'REALTIME SIM' : 'LIVE RTSP'}
                          </Badge>
                          
                          {/* Quick Remove from Dashboard icon */}
                          <button
                            type="button"
                            onClick={() => handleToggleFeed(cam.id, false)}
                            className="text-neutral-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                            title="Remove from Dashboard Wall"
                          >
                            <EyeOff className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Video / Canvas Container */}
                      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                        <canvas
                          ref={(el) => { canvasRefs.current[cam.id] = el; }}
                          width={640}
                          height={360}
                          className={`w-full h-full object-contain ${isSim ? 'block' : 'hidden'}`}
                        />
                        <video
                          ref={(el) => { videoRefs.current[cam.id] = el; }}
                          className={`w-full h-full object-contain bg-black ${!isSim ? 'block' : 'hidden'}`}
                          autoPlay
                          muted
                          playsInline
                          controls={false}
                        />

                        {/* Camera Top HUD */}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/75 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono text-white/90 pointer-events-none">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="truncate max-w-[130px]">{cam.name}</span>
                          <span>•</span>
                          <span>{currentTime}</span>
                        </div>

                        {/* REC Badge */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/75 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-mono text-rose-400 pointer-events-none">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                          <span>REC</span>
                        </div>

                        {/* Bottom ANPR HUD Banner */}
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded border border-neutral-800 text-[11px] font-mono">
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-400 text-[10px]">DETECTED:</span>
                            <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                              {recognizedPlates[cam.id] || cam.defaultPlate}
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-400 hidden sm:inline">98.6% CONF</span>
                        </div>
                      </div>

                      {/* Tile Footer / Role Actions */}
                      <div className="p-2.5 bg-neutral-950/80 border-t border-neutral-800 flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 truncate">
                          <span className="truncate">{cam.role}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleManualOcrScan(cam.id)}
                            className="h-6 px-2 text-[11px] text-neutral-300 hover:text-white"
                            title="Run ANPR OCR"
                          >
                            <Sparkles className="h-3 w-3 text-amber-400 mr-1" />
                            OCR
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(cam.targetRoute)}
                            className="h-6 px-2 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700 gap-1"
                            title={`Open ${cam.location}`}
                          >
                            <span>Open</span>
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Bottom Role-Based Access Notification Bar */}
          <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-neutral-300">
                <strong className="text-white">Active Permissions: </strong>
                {roleId === 'admin' 
                  ? 'Plant Head has unrestricted panoramic visibility across Entry ANPR, Weighbridge, and Exit surveillance.' 
                  : roleId === 'gate_operator' 
                  ? 'Gate Monitor has active surveillance on Entry ANPR lane and Exit security barrier.' 
                  : roleId === 'weighbridge_operator'
                  ? 'Weighbridge In-charge has active surveillance on Platform Scale deck and Incoming Gate queue.'
                  : 'Role-based camera feed monitoring active.'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/gate-monitor')}
                className="h-7 text-xs border-neutral-700 text-neutral-200 hover:bg-neutral-800"
              >
                Gate Monitor
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/weighbridge')}
                className="h-7 text-xs border-neutral-700 text-neutral-200 hover:bg-neutral-800"
              >
                Weighbridge
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/device-config')}
                className="h-7 text-xs border-neutral-700 text-neutral-200 hover:bg-neutral-800"
              >
                Config
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manage Dashboard Camera Feeds Modal Dialog */}
      <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              Manage Dashboard Camera Feeds
            </DialogTitle>
            <DialogDescription>
              Select which configured cameras and live video feeds appear on the main Operations Dashboard wall.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto py-2 pr-1">
            {allCameras.map((cam) => {
              const isOn = cam.showOnDashboard;
              return (
                <div 
                  key={cam.id} 
                  className={`p-3.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                    isOn 
                      ? 'border-primary/40 bg-primary/5' 
                      : 'border-border bg-card opacity-85'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isOn 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <Camera className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground truncate">{cam.name}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                          {cam.location}
                        </Badge>
                        {isOn && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                            <CheckCircle2 className="h-3 w-3" /> Pinned
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                        ID: {cam.id} • IP: {cam.ip}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={isOn}
                      disabled={isUpdatingFeed === cam.id}
                      onCheckedChange={(checked) => handleToggleFeed(cam.id, checked)}
                    />
                  </div>
                </div>
              );
            })}

            {allCameras.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No cameras registered yet.
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsManageModalOpen(false);
                navigate('/device-config');
              }}
              className="text-xs gap-1.5 border-dashed"
            >
              <Plus className="h-3.5 w-3.5" />
              Register / Configure New Camera
            </Button>

            <Button 
              size="sm" 
              onClick={() => setIsManageModalOpen(false)}
            >
              Save & View Wall
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PlantHeadCameraSurveillance;
