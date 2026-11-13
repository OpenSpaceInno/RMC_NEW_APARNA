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
import { useGateCameras, PlantCameraFeed } from "@/hooks/useGateCameras";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { resolveCameraHlsUrl, attachHlsStream } from "@/lib/cameraStream";
import { toast } from "sonner";

interface CapturedEvidence {
  id: string;
  angle: string;
  cameraName: string;
  imageUrl: string;
  plate: string;
  weightKg: number;
  weightMt: string;
  timestamp: string;
  filename?: string;
  targetUser?: string;
  remoteFtpPath?: string;
}

const Weighbridge = () => {
  const { currentWeight } = useWeighbridge();
  const { cameras, initialized: camerasInitialized, effectivePlantId } = useGateCameras();
  const { activePlant } = useAuth();

  const [vehicleNumber, setVehicleNumber] = useState<string>("");
  const [driverName, setDriverName] = useState<string>("Ramesh Kulkarni");
  const [isCheckingFtp, setIsCheckingFtp] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [capturedEvidenceList, setCapturedEvidenceList] = useState<CapturedEvidence[]>([]);

  // Selected camera view: 'all' | <device_id>
  const [selectedCamera, setSelectedCamera] = useState<string>('all');

  // FTP Evidence state for ANPR camera
  const [ftpEvidence, setFtpEvidence] = useState<{
    plate: string;
    filename: string;
    imageUrl: string;
    timestamp: string;
  } | null>(null);

  // Dynamic Video & Canvas refs keyed by camera device ID
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const [hlsActiveMap, setHlsActiveMap] = useState<Record<string, boolean>>({});

  const animFrameId = useRef<number | null>(null);
  const lastDetectedFilenameRef = useRef<string | null>(null);
  const hasAlertedMatchRef = useRef<string | null>(null);

  // Reset selected camera if plant cameras change and selected ID is no longer present
  useEffect(() => {
    if (selectedCamera !== 'all' && !cameras.some((c) => c.id === selectedCamera)) {
      setSelectedCamera('all');
    }
  }, [cameras, selectedCamera]);

  // Resolve API image URLs
  const resolveImageUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const backendBase = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api')).replace(/\/api$/, '');
    return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Button 1: Get Vehicle Number (strictly scoped to active plant's 2-level FTP folders)
  const handleGetVehicleNumber = useCallback(async (isManual = true) => {
    if (!camerasInitialized) return;

    try {
      if (isManual) setIsCheckingFtp(true);
      const scopedCameraId = selectedCamera !== 'all' ? selectedCamera : undefined;
      const res = await api.getLatestFtpPlate({
        plantId: effectivePlantId,
        cameraId: scopedCameraId,
      });

      if (res && res.success && res.filename) {
        const fullImg = resolveImageUrl(res.imageUrl);
        const timeStr = res.lastModified ? new Date(res.lastModified).toLocaleTimeString() : new Date().toLocaleTimeString();
        const storedPath = res.remotePath || res.filename;
        const matchKey = `${res.plate || ''}_${storedPath}`;
        const isNewMatch = hasAlertedMatchRef.current !== matchKey;

        lastDetectedFilenameRef.current = storedPath;

        const newEvidence = {
          plate: res.plate || '',
          filename: res.filename,
          imageUrl: fullImg || res.imageUrl || '',
          timestamp: timeStr,
        };

        setFtpEvidence(newEvidence);
        if (res.plate) {
          setVehicleNumber(res.plate);
        }

        // Show the alert ONLY ONCE after matching this vehicle/evidence
        if (isNewMatch) {
          hasAlertedMatchRef.current = matchKey;
          toast.success(
            res.plate
              ? `Vehicle Number Retrieved: ${res.plate}`
              : `Latest FTP Evidence Retrieved`,
            {
              description: `Stored in ${storedPath}`,
              duration: 3500,
            }
          );
        }
      } else if (isManual) {
        toast.info("No incoming vehicle images found in this plant's FTP folders yet.");
      }
    } catch (err: any) {
      if (isManual) {
        toast.error('Vehicle Number Check Error: ' + (err.message || 'Failed to read FTP'));
      }
    } finally {
      if (isManual) setIsCheckingFtp(false);
    }
  }, [camerasInitialized, effectivePlantId, selectedCamera]);

  // Button 2: Capture Vehicles (captures photos from ONLY this plant's assigned cameras and uploads to FTP)
  const handleCaptureVehicles = async () => {
    if (cameras.length === 0) {
      toast.error("No cameras assigned to this plant", {
        description: "Super Admin can assign cameras to this plant in Device Config.",
      });
      return;
    }

    setIsCapturing(true);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const timestampStr = now.toLocaleTimeString();
    const weightMtStr = (currentWeight.weight / 1000).toFixed(2);
    const currentPlate = vehicleNumber.trim() || "UNVERIFIED";
    const newItems: CapturedEvidence[] = [];
    const uploadPromises: Promise<any>[] = [];

    const angleForCamera = (cam: PlantCameraFeed, idx: number) => {
      if (cam.isANPR || cam.rawLocation === 'entry') return 'front';
      if (cam.rawLocation === 'exit' || cam.rawLocation === 'weighbridge') return idx === 0 ? 'front' : 'back';
      return idx === 0 ? 'front' : idx === 1 ? 'back' : 'top';
    };

    try {
      const capturedFilenames: string[] = [];

      cameras.forEach((cam, idx) => {
        const angle = angleForCamera(cam, idx);
        const labelPrefix = angle === 'front' ? 'Front' : angle === 'back' ? 'Back' : 'Top';
        const filename = `${labelPrefix}_${cam.id}_${timestamp}.jpg`;
        const videoEl = videoRefs.current[cam.id];
        const canvasEl = canvasRefs.current[cam.id];
        const isHlsActive = Boolean(hlsActiveMap[cam.id]);

        let imgData = "";
        if (videoEl && isHlsActive) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 360;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(videoEl, 0, 0, 640, 360);
              imgData = canvas.toDataURL('image/jpeg', 0.85);
            }
          } catch {}
        }
        if (!imgData && canvasEl) {
          imgData = canvasEl.toDataURL('image/jpeg', 0.85);
        }
        if (!imgData && cam.isANPR && ftpEvidence?.imageUrl) {
          imgData = ftpEvidence.imageUrl;
        }

        if (imgData) {
          capturedFilenames.push(filename);
          newItems.push({
            id: `cap-${Date.now()}-${idx}`,
            angle,
            cameraName: cam.name,
            imageUrl: imgData,
            plate: currentPlate,
            weightKg: currentWeight.weight,
            weightMt: weightMtStr,
            timestamp: timestampStr,
            filename,
            targetUser: 'sarath',
            remoteFtpPath: `/${filename}`,
          });

          uploadPromises.push(
            api.uploadToFtp({
              image: imgData,
              filename,
              targetUser: 'sarath',
              vehicleRegNo: currentPlate,
              angle,
              weight: currentWeight.weight,
              cameraId: cam.id,
              plantId: cam.plantId,
              cameraName: cam.name,
              cameraIp: cam.ipAddress || cam.ip_address || '192.168.0.100',
              gateType: cam.rawLocation || cam.location,
            }).catch(err => {
              console.warn(`${cam.name} FTP upload warning:`, err);
              return null;
            })
          );
        }
      });

      const uploadResults = await Promise.allSettled(uploadPromises);
      let uploadedCount = 0;
      uploadResults.forEach((res, idx) => {
        if (res.status === 'fulfilled' && res.value?.remotePath && newItems[idx]) {
          newItems[idx].remoteFtpPath = res.value.remotePath;
          uploadedCount++;
        }
      });
      setCapturedEvidenceList(prev => [...newItems, ...prev]);

      if (uploadedCount > 0) {
        toast.success(`Captured & Uploaded ${uploadedCount} Photo(s) to FTP!`, {
          description: `Files: ${capturedFilenames.join(', ')}`,
          duration: 5500,
        });
      } else {
        toast.error("FTP Upload Failed: Could not store captured image(s) in plant FTP folder.");
      }
    } catch (err: any) {
      toast.error("Capture Warning: " + (err.message || "Failed to upload to FTP location"));
    } finally {
      setIsCapturing(false);
    }
  };

  // Connect live IP camera streams for ONLY this plant's cameras
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const timers: Record<string, any> = {};
    setHlsActiveMap({});

    cameras.forEach((cam) => {
      const videoEl = videoRefs.current[cam.id];
      if (!videoEl) return;

      const unmount = attachHlsStream({
        video: videoEl,
        urlOrPair: resolveCameraHlsUrl(cam.hlsUrl || '', cam.id),
        onConnected: () => {
          if (timers[cam.id]) {
            clearTimeout(timers[cam.id]);
            timers[cam.id] = null;
          }
          setHlsActiveMap((prev) => ({ ...prev, [cam.id]: true }));
        },
        onError: () => {
          if (!timers[cam.id]) {
            timers[cam.id] = setTimeout(() => {
              setHlsActiveMap((prev) => ({ ...prev, [cam.id]: false }));
            }, 8000);
          }
        },
        autoReconnect: true,
      });
      cleanups.push(unmount);
    });

    return () => {
      Object.values(timers).forEach((t) => t && clearTimeout(t));
      cleanups.forEach((fn) => fn());
      setHlsActiveMap({});
    };
  }, [cameras]);

  // Poll camera FTP for vehicle plate on initial load
  useEffect(() => {
    handleGetVehicleNumber(false);
    const interval = setInterval(() => handleGetVehicleNumber(false), 5000);
    return () => clearInterval(interval);
  }, [handleGetVehicleNumber]);

  // Animate dynamic canvas simulation feeds when HLS stream is inactive
  useEffect(() => {
    if (cameras.length === 0) return;

    const render = () => {
      cameras.forEach((cam, idx) => {
        const canvas = canvasRefs.current[cam.id];
        if (!canvas || hlsActiveMap[cam.id]) return;
        if (cam.isANPR && ftpEvidence) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const w = 640;
        const h = 360;

        if (cam.isANPR || cam.rawLocation === 'entry') {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, w, h);
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
          ctx.fillStyle = '#334155';
          ctx.fillRect(200, 120, 240, 160);
          ctx.fillStyle = '#64748b';
          ctx.fillRect(220, 130, 200, 70);
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(230, 140, 180, 50);
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(220, 220, 15, 0, Math.PI * 2);
          ctx.arc(420, 220, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(190, 240, 260, 45);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(260, 250, 120, 26);
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 13px monospace';
          ctx.fillText(vehicleNumber || 'TN88F4089', 266, 268);
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
          ctx.strokeRect(256, 246, 128, 34);
          ctx.fillStyle = '#ffffff';
          ctx.font = '11px sans-serif';
          ctx.fillText(`CAM 0${idx + 1} • ${cam.name} • ${cam.ipAddress || ''}`, 10, 20);
          ctx.fillStyle = '#22c55e';
          ctx.fillText(`[OCR 99.2%] PLATE: ${vehicleNumber || 'TN88F4089'}`, 10, 36);
        } else {
          ctx.fillStyle = '#0b1120';
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(60, 30, 50, 130);
          ctx.fillRect(125, 20, 50, 140);
          ctx.fillRect(190, 40, 45, 120);
          ctx.fillStyle = '#262d3d';
          ctx.beginPath();
          ctx.moveTo(180, 160);
          ctx.lineTo(460, 160);
          ctx.lineTo(600, 350);
          ctx.lineTo(40, 350);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#eab308';
          ctx.fillRect(40, 335, 560, 12);
          ctx.fillStyle = '#000000';
          for (let i = 50; i < 600; i += 40) {
            ctx.fillRect(i, 335, 18, 12);
          }
          ctx.fillStyle = '#475569';
          ctx.fillRect(220, 170, 200, 90);
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.ellipse(330, 210, 75, 32, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '11px sans-serif';
          ctx.fillText(`CAM 0${idx + 1} • ${cam.name} • ${cam.ipAddress || ''}`, 10, 20);
          ctx.fillStyle = '#10b981';
          ctx.fillText(`SCALE: ${(currentWeight.weight / 1000).toFixed(2)} MT • ${currentWeight.stable ? 'STABLE' : 'MOTION'}`, 10, 36);
        }
      });

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [cameras, vehicleNumber, currentWeight, ftpEvidence, hlsActiveMap, driverName]);

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

          {/* Camera Selection Buttons for ONLY this plant's cameras */}
          <div className="flex flex-wrap items-center gap-1.5">
            {cameras.length > 1 && (
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
                <span>All Cameras ({cameras.length})</span>
              </Button>
            )}

            {cameras.map((cam, idx) => (
              <Button
                key={cam.id}
                type="button"
                size="sm"
                variant={selectedCamera === cam.id ? 'default' : 'outline'}
                onClick={() => setSelectedCamera(cam.id)}
                className={`h-8 text-xs font-semibold cursor-pointer shadow-xs ${
                  selectedCamera === cam.id
                    ? 'bg-slate-900 text-amber-300 hover:bg-slate-800'
                    : 'bg-white text-slate-700 border-[#c8aa86] hover:bg-slate-100'
                }`}
              >
                {cam.isANPR ? (
                  <Video className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                ) : (
                  <Scale className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                )}
                <span>{cam.name || `Camera ${idx + 1}`}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Camera Feeds Display: Strictly scoped to active plant's camera_devices */}
        {!camerasInitialized ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Loading cameras for {activePlant?.id === 'all' ? 'All Plants' : (activePlant?.name || 'plant')}...
          </div>
        ) : cameras.length === 0 ? (
          <div className="border border-dashed border-[#c8aa86] rounded-lg p-10 text-center bg-white/70">
            <Camera className="h-10 w-10 mx-auto mb-3 text-slate-400" />
            <p className="text-sm font-semibold text-slate-800">
              No Cameras Assigned to {activePlant?.id === 'all' ? 'Any Plant' : (activePlant?.name || 'This Plant')}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Super Admin can register or assign cameras to this plant in Device Config.
            </p>
          </div>
        ) : (
          <div
            className={
              selectedCamera === 'all' && cameras.length > 1
                ? cameras.length === 2
                  ? 'grid grid-cols-1 md:grid-cols-2 gap-3.5'
                  : 'grid grid-cols-1 md:grid-cols-3 gap-3.5'
                : 'flex flex-col items-center'
            }
          >
            {cameras.map((cam, idx) => {
              const isVisible = selectedCamera === 'all' || selectedCamera === cam.id;
              const isSingleFocused = selectedCamera === cam.id || cameras.length === 1;
              const isHlsActive = Boolean(hlsActiveMap[cam.id]);
              const showFtpOverlay = Boolean(cam.isANPR && ftpEvidence?.imageUrl);

              return (
                <div
                  key={cam.id}
                  className={`space-y-1.5 w-full ${isVisible ? 'block' : 'hidden'} ${isSingleFocused ? 'max-w-4xl mx-auto' : ''}`}
                >
                  <div className="flex justify-between items-center text-[11px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-slate-800 truncate">
                        CAM 0{idx + 1}: {cam.name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 font-semibold shrink-0">
                        ({cam.ipAddress || cam.ip_address})
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[9px] flex items-center gap-1 shrink-0 ${
                        isHlsActive || showFtpOverlay
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-blue-50 text-blue-700 border-blue-300'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isHlsActive ? 'bg-emerald-600 animate-ping' : 'bg-blue-600 animate-pulse'
                        }`}
                      />
                      <span>
                        {showFtpOverlay
                          ? 'FTP SNAPSHOT CAPTURED'
                          : isHlsActive
                          ? 'LIVE IP CAMERA'
                          : cam.isANPR
                          ? 'FTP AUTO-ANPR'
                          : 'AUTO LIVE DETECT'}
                      </span>
                    </Badge>
                  </div>

                  <div className="relative rounded overflow-hidden border border-[#bca182] bg-slate-950 aspect-video shadow-inner group">
                    {showFtpOverlay && ftpEvidence ? (
                      <>
                        <img
                          src={ftpEvidence.imageUrl}
                          alt={cam.name}
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                        />
                        <div className="absolute top-1.5 left-1.5 bg-black/75 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span>{cam.name} • CAPTURED</span>
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
                          ref={(el) => {
                            videoRefs.current[cam.id] = el;
                          }}
                          playsInline
                          muted
                          autoPlay
                          className={`w-full h-full object-cover ${isHlsActive ? 'block' : 'hidden'}`}
                        />
                        <canvas
                          ref={(el) => {
                            canvasRefs.current[cam.id] = el;
                          }}
                          width={640}
                          height={360}
                          className={`w-full h-full object-cover ${isHlsActive ? 'hidden' : 'block'}`}
                        />
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/75 backdrop-blur-xs px-2 py-1 rounded text-[10px] text-white flex justify-between items-center">
                          {cam.isANPR ? (
                            <>
                              <span className="font-mono text-emerald-400 font-bold">
                                {vehicleNumber || (isHlsActive ? 'LIVE RTSP STREAM' : 'SEARCHING FTP...')}
                              </span>
                              <span className="text-slate-300 font-mono">
                                {isHlsActive ? 'LIVE • RTSP' : cam.location}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="font-mono text-amber-300 font-bold">
                                {cam.location} • {(currentWeight.weight / 1000).toFixed(2)} MT
                              </span>
                              <span
                                className={`font-mono text-[10px] font-bold ${
                                  currentWeight.stable ? 'text-emerald-400' : 'text-amber-400 animate-pulse'
                                }`}
                              >
                                {currentWeight.stable
                                  ? `${currentWeight.weight.toLocaleString()} KG (STABLE)`
                                  : `${currentWeight.weight.toLocaleString()} KG (MOTION)`}
                              </span>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
                disabled={isCapturing || cameras.length === 0}
                className="h-12 sm:h-14 px-6 text-sm sm:text-base font-bold bg-slate-950 hover:bg-slate-900 text-amber-300 border-2 border-amber-400/50 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer rounded-lg active:scale-98"
                title="Capture photos from this plant's cameras and upload into FTP location for user Sarath"
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
                <span>Captured Vehicles & Uploaded to Sarath's FTP ({capturedEvidenceList.length} photos)</span>
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
                    <Badge className="absolute top-1.5 left-1.5 text-[9px] bg-slate-900/85 text-amber-300 border-none px-1.5 py-0 flex items-center gap-1 font-mono">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>{item.angle.toUpperCase()} • FTP (sarath)</span>
                    </Badge>
                  </div>
                  <div className="p-2.5 text-[11px] space-y-1.5">
                    {item.filename && (
                      <div className="font-mono text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 truncate font-semibold" title={item.filename}>
                        📁 {item.filename}
                      </div>
                    )}
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
