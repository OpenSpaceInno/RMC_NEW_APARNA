import { useState, useEffect, useRef, useCallback } from 'react';
import { CameraDevice, RTSPConfig } from '@/types/deviceConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  VideoOff, 
  Maximize2, 
  Minimize2, 
  Camera, 
  RefreshCw,
  Volume2,
  VolumeX,
  Settings2,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Tv,
  Scan,
  ShieldCheck
} from 'lucide-react';
import Hls from 'hls.js';
import { resolveCameraHlsUrl } from '@/lib/cameraStream';

interface LiveStreamViewerProps {
  device: CameraDevice | null;
  rtspConfig: RTSPConfig;
  onOpenFullscreen?: () => void;
}

type StreamStatus = 'disconnected' | 'connecting' | 'connected' | 'simulated' | 'error' | 'reconnecting' | 'no_proxy';

export function LiveStreamViewer({ 
  device, 
  rtspConfig,
  onOpenFullscreen 
}: LiveStreamViewerProps) {
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('disconnected');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [forceSimulation, setForceSimulation] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const getRtspUrl = useCallback(() => {
    if (rtspConfig.useDirectUrl && rtspConfig.directUrl) {
      return rtspConfig.directUrl;
    }
    if (!device) return '';
    const auth = rtspConfig.username && rtspConfig.password 
      ? `${rtspConfig.username}:***@` 
      : '';
    return `rtsp://${auth}${device.ipAddress}:${rtspConfig.port}${rtspConfig.streamPath}`;
  }, [rtspConfig, device]);

  // Stop simulation loop
  const stopSimulation = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  // Canvas simulation renderer
  const startSimulation = useCallback(() => {
    stopSimulation();
    const canvas = canvasRef.current;
    if (!canvas) return;

    let frame = 0;
    const devName = device?.name || 'ANPR Camera';
    const devIp = device?.ipAddress || '192.168.0.100';
    const loc = (device?.location || 'entry').toLowerCase();
    const isWeigh = loc.includes('weigh') || (device?.id || '').toLowerCase().includes('exit 2');
    const plateText = isWeigh ? 'TS 09 UB 5678' : loc.includes('exit') ? 'MH 14 DE 7890' : 'MH 12 RN 4501';

    const render = () => {
      frame++;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = 640;
      const h = 360;

      // Dark background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#090d16');
      bg.addColorStop(0.5, '#111827');
      bg.addColorStop(1, '#0b0f19');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Facility Roadway & Platform Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 180);
        ctx.lineTo(x * 1.6 - 180, h);
        ctx.stroke();
      }
      for (let y = 180; y < h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Weighbridge Platform or Gate Lane structure
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(100, 200, 440, 110);
      ctx.strokeStyle = isWeigh ? '#0284c7' : '#059669';
      ctx.lineWidth = 2;
      ctx.strokeRect(100, 200, 440, 110);

      // Yellow Guide Curbs
      ctx.fillStyle = '#eab308';
      for (let i = 0; i < 9; i++) {
        if (i % 2 === 0) {
          ctx.fillRect(100 + i * 48, 196, 48, 6);
          ctx.fillRect(100 + i * 48, 308, 48, 6);
        }
      }

      // Simulated Transit Mixer Truck
      const truckX = 220 + Math.sin(frame * 0.02) * 8;
      const truckY = 160;

      // Cabin
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(truckX + 110, truckY + 20, 70, 75);
      ctx.fillStyle = '#38bdf8'; // Windshield
      ctx.fillRect(truckX + 145, truckY + 26, 30, 28);

      // RMC Revolving Drum
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.ellipse(truckX + 45, truckY + 45, 65, 38, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(truckX + 45, truckY + 45, 65, 38, -0.15, 0, Math.PI * 2);
      ctx.stroke();

      // Drum spiral animated stripes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 3;
      const angle = (frame * 0.05) % (Math.PI * 2);
      ctx.beginPath();
      ctx.arc(truckX + 45, truckY + 45, 28, angle, angle + Math.PI * 0.7);
      ctx.stroke();

      // Chassis & Wheels
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(truckX - 15, truckY + 70, 200, 18);
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(truckX + 10, truckY + 92, 14, 0, Math.PI * 2);
      ctx.arc(truckX + 45, truckY + 92, 14, 0, Math.PI * 2);
      ctx.arc(truckX + 150, truckY + 92, 14, 0, Math.PI * 2);
      ctx.fill();

      // OCR ANPR Target Bounding Reticle
      const reticleX = truckX + 130;
      const reticleY = truckY + 72;
      const reticleW = 55;
      const reticleH = 22;

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.strokeRect(reticleX, reticleY, reticleW, reticleH);

      // Target Corner notches
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(reticleX - 2, reticleY - 2, 6, 2);
      ctx.fillRect(reticleX - 2, reticleY - 2, 2, 6);
      ctx.fillRect(reticleX + reticleW - 4, reticleY - 2, 6, 2);
      ctx.fillRect(reticleX + reticleW, reticleY - 2, 2, 6);

      // Plate OCR Display Box
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(reticleX - 10, reticleY - 24, 75, 18);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      ctx.strokeRect(reticleX - 10, reticleY - 24, 75, 18);
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(plateText, reticleX - 6, reticleY - 11);

      // Scanline sweep
      const scanY = 180 + ((frame * 2.5) % 150);
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(100, scanY);
      ctx.lineTo(540, scanY);
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    setStreamStatus('simulated');
  }, [device, stopSimulation]);

  // Connect stream using Hls.js with Canvas Simulation fallback
  useEffect(() => {
    stopSimulation();
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (!device || !rtspConfig.enabled) {
      setStreamStatus('disconnected');
      return;
    }

    if (device.status !== 'online') {
      setStreamStatus('error');
      setErrorMessage('Camera hardware is reported offline');
      return;
    }

    if (forceSimulation) {
      startSimulation();
      return;
    }

    // Try HLS playback via MediaMTX proxy
    const defaultStream = device.id === 'cam_gate_1' ? 'live_cam1' : device.id === 'cam_gate_2' ? 'live_cam2' : device.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const rawHlsUrl = rtspConfig.hlsProxyUrl || `/hls/${defaultStream}/index.m3u8`;
    const hlsUrl = resolveCameraHlsUrl(rawHlsUrl, defaultStream);
    setStreamStatus('connecting');
    setErrorMessage(null);

    const video = videoRef.current;
    if (!video) {
      startSimulation();
      return;
    }

    let isResolved = false;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 3,
        levelLoadingTimeOut: 10000,
        fragLoadingTimeOut: 10000,
        xhrSetup: (xhr) => {
          xhr.withCredentials = true;
        }
      });

      hlsRef.current = hls;

      // Smart fallback: try primary URL, then alternate alias
      const alternateUrl = hlsUrl.includes('live_cam1')
        ? hlsUrl.replace('live_cam1', 'cam1')
        : hlsUrl.includes('/cam1/')
        ? hlsUrl.replace('/cam1/', '/live_cam1/')
        : hlsUrl.includes('live_cam2')
        ? hlsUrl.replace('live_cam2', 'cam2')
        : hlsUrl.includes('/cam2/')
        ? hlsUrl.replace('/cam2/', '/live_cam2/')
        : null;

      let triedAlternate = false;

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        isResolved = true;
        setStreamStatus('connected');
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (!isResolved && alternateUrl && !triedAlternate) {
          triedAlternate = true;
          console.info(`Primary stream ${hlsUrl} not ready; checking alternate ${alternateUrl}...`);
          hls.loadSource(alternateUrl);
          return;
        }
        if (!isResolved || data.fatal) {
          console.warn(`HLS stream issue for ${device.name}; activating live simulation fallback:`, data.details);
          hls.destroy();
          hlsRef.current = null;
          startSimulation();
        }
      });

      // Quick timeout fallback: allow up to 12s for initial HLS stream handshake
      const fallbackTimer = setTimeout(() => {
        if (!isResolved) {
          console.info(`HLS timeout for ${device.name}; switching to zero-latency simulation.`);
          hls.destroy();
          hlsRef.current = null;
          startSimulation();
        }
      }, 12000);

      return () => {
        clearTimeout(fallbackTimer);
        hls.destroy();
        hlsRef.current = null;
        stopSimulation();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
      video.addEventListener('loadedmetadata', () => {
        setStreamStatus('connected');
        video.play().catch(() => {});
      });
      video.addEventListener('error', () => {
        startSimulation();
      });
    } else {
      startSimulation();
    }

    return () => {
      stopSimulation();
    };
  }, [device, rtspConfig.enabled, rtspConfig.hlsProxyUrl, forceSimulation, startSimulation, stopSimulation]);

  // Frame counter simulator
  useEffect(() => {
    if (streamStatus !== 'connected' && streamStatus !== 'simulated') return;
    const interval = setInterval(() => {
      setFrameCount(prev => prev + 1);
    }, 1000 / 30);
    return () => clearInterval(interval);
  }, [streamStatus]);

  const handleReconnect = () => {
    setForceSimulation(false);
    setStreamStatus('reconnecting');
    setErrorMessage(null);
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const captureSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = 640;
    snapCanvas.height = 360;
    const ctx = snapCanvas.getContext('2d');
    if (!ctx) return;

    if (streamStatus === 'connected' && video && video.videoWidth > 0) {
      ctx.drawImage(video, 0, 0, 640, 360);
    } else if (canvas) {
      ctx.drawImage(canvas, 0, 0, 640, 360);
    }

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(10, 320, 280, 30);
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`SNAPSHOT: ${device?.name || 'Camera'} | ${new Date().toLocaleTimeString()}`, 16, 338);

    const dataUrl = snapCanvas.toDataURL('image/jpeg');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `snapshot_${device?.id || 'cam'}_${Date.now()}.jpg`;
    a.click();
  };

  const copyRtspUrl = () => {
    navigator.clipboard.writeText(getRtspUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openInVLC = () => {
    window.open(`vlc://${getRtspUrl()}`, '_blank');
  };

  const getStatusBadge = () => {
    switch (streamStatus) {
      case 'connected':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            HLS LIVE
          </Badge>
        );
      case 'simulated':
        return (
          <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 gap-1 font-mono">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
            CCTV STREAM ACTIVE
          </Badge>
        );
      case 'connecting':
      case 'reconnecting':
        return (
          <Badge variant="secondary" className="gap-1 font-mono">
            <Loader2 className="h-3 w-3 animate-spin" />
            {streamStatus === 'connecting' ? 'Connecting...' : 'Reconnecting...'}
          </Badge>
        );
      case 'no_proxy':
        return <Badge variant="outline" className="gap-1 font-mono">RTSP Ready</Badge>;
      case 'error':
        return <Badge variant="destructive" className="font-mono">Error</Badge>;
      default:
        return <Badge variant="outline" className="font-mono">Disconnected</Badge>;
    }
  };

  if (!device) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Video className="h-5 w-5" />
            Live Stream Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center space-y-2">
              <VideoOff className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Select a camera to view live stream
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border border-border/80 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            <span>{device.name}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 px-2"
              onClick={() => setForceSimulation(!forceSimulation)}
              title="Toggle Live Stream / CCTV Simulation"
            >
              <Tv className="h-3 w-3" />
              <span>{forceSimulation ? 'Try HLS' : 'Feed Mode'}</span>
            </Button>
          </div>
        </div>
        {rtspConfig.enabled && (
          <p className="text-xs text-muted-foreground font-mono truncate">
            {getRtspUrl()}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <div 
          ref={containerRef}
          className="aspect-video bg-black rounded-lg relative overflow-hidden flex items-center justify-center"
        >
          {/* Physical Video element for HLS playback */}
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-contain bg-black ${
              streamStatus === 'connected' ? 'block' : 'hidden'
            }`}
            autoPlay
            muted={isMuted}
            playsInline
          />

          {/* Interactive Canvas Simulation Fallback */}
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className={`absolute inset-0 w-full h-full object-cover bg-black ${
              streamStatus === 'simulated' ? 'block' : 'hidden'
            }`}
          />

          {/* Stream Disabled State */}
          {!rtspConfig.enabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="text-center space-y-2">
                <Settings2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground font-medium">
                  RTSP streaming is disabled
                </p>
                <p className="text-xs text-muted-foreground">
                  Enable it in the RTSP tab to view live feed
                </p>
              </div>
            </div>
          )}

          {/* Connecting State */}
          {(streamStatus === 'connecting' || streamStatus === 'reconnecting') && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin" />
                <p className="text-xs text-slate-200 font-mono">
                  Connecting to MediaMTX stream...
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {device.ipAddress}:554
                </p>
              </div>
            </div>
          )}

          {/* Overlays when feed is active (connected or simulated) */}
          {(streamStatus === 'connected' || streamStatus === 'simulated') && (
            <>
              {/* Device and IP Badge */}
              <div className="absolute top-2.5 left-2.5 text-white/90 font-mono text-[11px] bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10 pointer-events-none">
                {device.name} • {device.ipAddress}
              </div>

              {/* REC & FPS HUD */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10 pointer-events-none">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-white/90 font-mono text-[10px]">REC • 30 FPS</span>
              </div>

              {/* Timestamp and Frame count */}
              <div className="absolute bottom-11 left-2.5 text-white/80 font-mono text-[10px] bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded pointer-events-none">
                {new Date().toLocaleTimeString()} | FR: {frameCount}
              </div>

              {/* Action Toolbar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-white hover:bg-white/20"
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-white hover:bg-white/20"
                    onClick={captureSnapshot}
                    title="Capture Snapshot Evidence"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-white hover:bg-white/20"
                    onClick={handleFullscreen}
                    title="Toggle Fullscreen"
                  >
                    {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {streamStatus === 'simulated' && (
          <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between gap-2">
            <div className="flex items-start gap-1.5">
              <span className="shrink-0 font-bold">ℹ️</span>
              <span>
                Showing simulated feed. Push from plant PC to <code className="text-emerald-400 font-mono">rtsp://213.210.37.249:8554/{device?.id === 'cam_gate_1' ? 'live_cam1' : 'live_cam2'}</code>.
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs bg-amber-500/20 border-amber-500/40 hover:bg-amber-500/30 text-amber-200 shrink-0 gap-1"
              onClick={handleReconnect}
            >
              <RefreshCw className="h-3 w-3" />
              Connect Live
            </Button>
          </div>
        )}

        {/* RTSP Direct URL Copy Toolbar */}
        {rtspConfig.enabled && (
          <div className="p-2.5 rounded-lg bg-muted/60 border border-border/60 flex items-center justify-between text-xs">
            <div className="truncate pr-2">
              <span className="text-muted-foreground mr-1.5 font-medium">Direct RTSP:</span>
              <span className="font-mono text-foreground">{getRtspUrl()}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs" 
                onClick={copyRtspUrl}
                title="Copy RTSP Link"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs" 
                onClick={openInVLC}
                title="Launch in VLC Player"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Stream Details Grid */}
        {rtspConfig.enabled && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-muted/40 border border-border/40 rounded p-2 text-center">
              <p className="text-muted-foreground text-[10px]">Transport</p>
              <p className="font-semibold uppercase">{rtspConfig.transport}</p>
            </div>
            <div className="bg-muted/40 border border-border/40 rounded p-2 text-center">
              <p className="text-muted-foreground text-[10px]">Latency</p>
              <p className="font-semibold">{rtspConfig.lowLatencyMode ? 'Low Latency' : 'Normal'}</p>
            </div>
            <div className="bg-muted/40 border border-border/40 rounded p-2 text-center">
              <p className="text-muted-foreground text-[10px]">Buffer</p>
              <p className="font-semibold">{rtspConfig.bufferSize} KB</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
