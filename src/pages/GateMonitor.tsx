import { useState, useEffect, useRef, useCallback } from "react";
import { LogIn, Loader2, Camera, LayoutGrid, Video, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LiveFeedViewer } from "@/components/gate/LiveFeedViewer";
import { SimplePlateDisplay, FtpUploadRecord } from "@/components/gate/SimplePlateDisplay";
import { useGateCameras } from "@/hooks/useGateCameras";
import { api } from "@/lib/api";
import { toast } from "sonner";

const GateMonitor = () => {
  const { cameras, initialized, effectivePlantId } = useGateCameras();
  const [dbInitialized, setDbInitialized] = useState(false);
  const [checkingDb, setCheckingDb] = useState(true);
  const [detectedPlate, setDetectedPlate] = useState<string>("");
  const [detectedConfidence, setDetectedConfidence] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingFtp, setIsSavingFtp] = useState(false);
  const [capturedFrameUrl, setCapturedFrameUrl] = useState<string | null>(null);
  const [capturedTimestamp, setCapturedTimestamp] = useState<string | null>(null);
  const [capturedCameraName, setCapturedCameraName] = useState<string>('Main Gate ANPR Camera');
  const [selectedCameraId, setSelectedCameraId] = useState<string>("all");
  const [ftpUploadInfo, setFtpUploadInfo] = useState<FtpUploadRecord | null>(null);

  // Map of camera capture functions for each active camera feed
  const cameraCaptureMapRef = useRef<Record<string, () => Promise<{
    dataUrl: string;
    plate: string;
    confidence: number;
    cameraName: string;
    cameraId: string;
  }>>>({});

  // Real-time in-view plate detected by each camera
  const cameraInViewPlatesRef = useRef<Record<string, { plate: string; confidence: number }>>({});
  const lastDetectedFilenameRef = useRef<string | null>(null);
  const [isCheckingFtp, setIsCheckingFtp] = useState(false);

  const checkDatabaseTables = async () => {
    try {
      const status = await api.checkDatabaseStatus();
      setDbInitialized(status.initialized);
    } catch (error) {
      console.log('Database tables not initialized yet', error);
      setDbInitialized(false);
    } finally {
      setCheckingDb(false);
    }
  };

  const initializeDatabase = () => {
    window.location.href = '/database-setup';
  };

  const getFormattedDDMMYY = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    return `${dd}${mm}${yy}`;
  };

  // Track what plate is in camera view without overwriting text box automatically
  const handlePlateInView = (cameraId: string, plate: string, confidence: number) => {
    console.log(`[${cameraId}] Camera plate in view:`, plate, `(${Math.round(confidence * 100)}%)`);
    cameraInViewPlatesRef.current[cameraId] = { plate, confidence };
  };

  // Callback to register camera frame grabber from LiveFeedViewer
  const registerCameraCapture = (
    cameraId: string,
    captureFunc: () => Promise<{ dataUrl: string; plate: string; confidence: number; cameraName: string; cameraId: string }>
  ) => {
    cameraCaptureMapRef.current[cameraId] = captureFunc;
  };

  useEffect(() => {
    checkDatabaseTables();
  }, []);

  const resolveImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const backendBase = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api')).replace(/\/api$/, '');
    return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Reset scoped evidence display when switching plants or cameras
  useEffect(() => {
    lastDetectedFilenameRef.current = null;
    setFtpUploadInfo(null);
    setCapturedFrameUrl(null);
    setDetectedPlate("");
  }, [effectivePlantId, selectedCameraId]);

  // Poll camera FTP directory for latest incoming vehicle nameplate or uploaded evidence image scoped to active plant/camera
  const checkLatestFtpPlate = useCallback(async (isManual = false) => {
    if (!initialized) return;

    try {
      if (isManual) setIsCheckingFtp(true);
      const scopedCameraId = selectedCameraId !== 'all' ? selectedCameraId : undefined;
      const res = await api.getLatestFtpPlate({
        plantId: effectivePlantId,
        cameraId: scopedCameraId,
      });

      if (res && res.success && res.filename) {
        const fullImg = resolveImageUrl(res.imageUrl);
        const timeStr = res.lastModified ? new Date(res.lastModified).toLocaleTimeString() : new Date().toLocaleTimeString();
        const storedPath = res.remotePath || res.filename;

        if (lastDetectedFilenameRef.current !== storedPath || isManual || (res.plate && !detectedPlate)) {
          const isNew = lastDetectedFilenameRef.current !== storedPath;
          lastDetectedFilenameRef.current = storedPath;
          if (res.plate) {
            setDetectedPlate(res.plate);
            setDetectedConfidence(0.98);
          }
          if (fullImg) {
            setCapturedFrameUrl(fullImg);
          }
          setCapturedTimestamp(timeStr);
          setFtpUploadInfo({
            remotePath: storedPath,
            filename: res.filename,
            timestamp: timeStr,
            httpProxyUrl: fullImg || res.imageUrl,
            ftpUrl: res.ftpUrl,
            sizeBytes: res.sizeBytes,
          });

          if (isNew) {
            toast.success(
              res.plate
                ? `Vehicle Plate ${res.plate} Detected from FTP!`
                : `FTP Image Loaded: ${res.filename}`,
              {
                description: `Folder: ${res.folderPath || storedPath}`,
                duration: 4500,
              }
            );
          } else if (isManual) {
            toast.success(
              res.plate
                ? `Vehicle Number ${res.plate} Retrieved!`
                : `Latest FTP Evidence Retrieved!`,
              {
                description: `Stored in ${storedPath}`,
                duration: 3500,
              }
            );
          }
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
  }, [detectedPlate, initialized, effectivePlantId, selectedCameraId]);

  // Periodic background check of camera FTP directory (every 3 seconds)
  useEffect(() => {
    checkLatestFtpPlate(false);
    const interval = setInterval(() => {
      checkLatestFtpPlate(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [checkLatestFtpPlate]);

  // Step 1: Takes real-time image from live feed, populates detected plate into text box, and saves to FTP
  const handleManualCapture = async (specificCameraId?: string) => {
    console.log('🔘 Capture Plate triggered, target:', specificCameraId || selectedCameraId);

    try {
      setIsProcessing(true);

      // 1. Determine target camera & IP
      let targetCameraId = specificCameraId;
      if (!targetCameraId) {
        if (selectedCameraId !== 'all') {
          targetCameraId = selectedCameraId;
        } else {
          // In dual view, choose the camera that currently has a plate in view, or the first assigned camera
          const camWithPlate = displayedCameras.find(c => cameraInViewPlatesRef.current[c.id]?.plate);
          targetCameraId = camWithPlate ? camWithPlate.id : displayedCameras[0]?.id;
        }
      }

      if (!targetCameraId) {
        toast.error('No camera assigned to this plant to capture from.');
        return;
      }

      const targetCam = cameras.find(c => c.id === targetCameraId);
      const cameraIp = targetCam?.ip_address || (targetCam as any)?.ipAddress || targetCameraId;

      const captureFunc = cameraCaptureMapRef.current[targetCameraId];
      let frameDataUrl = '';
      let plateNumber = '';
      let confidence = 0.95;
      let cameraName = targetCam?.name || 'Main Gate ANPR Camera';

      if (captureFunc) {
        try {
          const snap = await captureFunc();
          frameDataUrl = snap.dataUrl;
          plateNumber = snap.plate;
          confidence = snap.confidence;
          cameraName = snap.cameraName || cameraName;
        } catch (snapErr) {
          console.warn('Camera snap notice:', snapErr);
        }
      }

      // Store captured real-time frame snapshot
      if (frameDataUrl) {
        setCapturedFrameUrl(frameDataUrl);
        setCapturedTimestamp(new Date().toLocaleTimeString());
        setCapturedCameraName(cameraName);
      }

      // Check if we have an in-view plate tracked for this camera
      if (!plateNumber && cameraInViewPlatesRef.current[targetCameraId]?.plate) {
        plateNumber = cameraInViewPlatesRef.current[targetCameraId].plate;
        confidence = cameraInViewPlatesRef.current[targetCameraId].confidence;
      }

      // If we got a camera frame but no plate yet, run instant edge ANPR on the real-time frame
      if (frameDataUrl && !plateNumber) {
        try {
          const edgeRes = await api.recognizeEdgePlate(frameDataUrl, targetCameraId);
          if (edgeRes && edgeRes.success && edgeRes.plate) {
            plateNumber = edgeRes.plate;
            confidence = edgeRes.confidence || 0.95;
          }
        } catch (edgeErr) {
          console.warn('Instant OCR check note:', edgeErr);
        }
      }

      // Automatically place the recognized license plate into the text box
      if (plateNumber) {
        setDetectedPlate(plateNumber);
        setDetectedConfidence(confidence);
      }

      // Generate filename according to camera's configured gate location, IP & timestamp
      const rawLocation = targetCam?.rawLocation || 'entry';
      const locationTag = rawLocation.toLowerCase().includes('exit') ? 'Exit_Gate' : 'Entry_Gate';
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const ddmmyy = getFormattedDDMMYY();
      const hhmmss = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const ftpFilename = `${locationTag}_${cameraIp}_${ddmmyy}_${hhmmss}.jpg`;

      // Automatically save to FTP upon capturing
      if (frameDataUrl) {
        try {
          setIsSavingFtp(true);
          const uploadRes = await api.uploadToFtp({
            image: frameDataUrl,
            filename: ftpFilename,
            vehicleRegNo: plateNumber || 'PENDING',
            angle: 'front',
            cameraId: targetCameraId,
            plantId: targetCam?.plantId,
            cameraName: cameraName,
            cameraIp: cameraIp,
            gateType: targetCam?.rawLocation || 'entry'
          });

          if (uploadRes && uploadRes.success) {
            const record: FtpUploadRecord = {
              remotePath: uploadRes.remotePath,
              filename: uploadRes.filename,
              timestamp: new Date().toLocaleTimeString(),
              httpProxyUrl: uploadRes.httpProxyUrl,
              ftpUrl: uploadRes.ftpUrl,
              sizeBytes: uploadRes.sizeBytes,
            };
            lastDetectedFilenameRef.current = uploadRes.remotePath || uploadRes.filename;
            setFtpUploadInfo(record);

            toast.success(
              plateNumber 
                ? `Vehicle plate ${plateNumber} captured & saved to FTP!` 
                : `Image captured & saved to FTP!`, 
              {
                description: `Saved as ${uploadRes.filename} in ${uploadRes.remotePath}`,
                duration: 5000,
              }
            );
          } else {
            toast.warning(`Plate captured, but FTP upload returned an unconfirmed response.`);
          }
        } catch (ftpErr: any) {
          console.error('FTP auto-save notice on capture:', ftpErr);
          toast.error(`Captured image, but FTP save encountered: ${ftpErr.message || 'Upload error'}`);
        } finally {
          setIsSavingFtp(false);
        }
      } else {
        toast.info("Captured from camera. Ensure camera feed is active.");
      }
    } catch (err: any) {
      console.error('Error during manual plate capture:', err);
      toast.error('Capture Error: ' + (err.message || 'Failed to capture frame'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: Uploads or re-syncs the verified plate and image to remote SFTPGo FTP
  const handleSaveToFtp = async () => {
    const plate = detectedPlate.trim();
    if (!plate) {
      toast.error("Please enter or capture a vehicle license plate number first.");
      return;
    }

    const targetCameraId = selectedCameraId !== 'all' ? selectedCameraId : displayedCameras[0]?.id;
    if (!targetCameraId) {
      toast.error("No camera assigned to this plant.");
      return;
    }
    const targetCam = cameras.find(c => c.id === targetCameraId);
    const cameraIp = targetCam?.ip_address || (targetCam as any)?.ipAddress || targetCameraId;
    const rawLocation = targetCam?.rawLocation || 'entry';
    const locationTag = rawLocation.toLowerCase().includes('exit') ? 'Exit_Gate' : 'Entry_Gate';

    const ddmmyy = getFormattedDDMMYY();
    const ftpFilename = `${locationTag}_${cameraIp}_${ddmmyy}.jpg`;

    let imageToUpload = capturedFrameUrl;
    if (!imageToUpload) {
      // Capture from current camera if not snapped yet
      const captureFunc = cameraCaptureMapRef.current[targetCameraId];
      if (captureFunc) {
        try {
          const snap = await captureFunc();
          imageToUpload = snap.dataUrl;
          setCapturedFrameUrl(snap.dataUrl);
          setCapturedTimestamp(new Date().toLocaleTimeString());
        } catch (e) {
          console.warn('Snap on save notice:', e);
        }
      }
    }

    if (!imageToUpload) {
      toast.error("No camera snapshot available. Please click 'Capture Plate' first.");
      return;
    }

    try {
      setIsSavingFtp(true);
      toast.loading(`Saving ${plate} snapshot to FTP (${ftpFilename})...`, { id: 'gate-ftp-upload' });

      const uploadRes = await api.uploadToFtp({
        image: imageToUpload,
        filename: ftpFilename,
        vehicleRegNo: plate,
        angle: rawLocation.toLowerCase().includes('exit') ? 'exit' : 'front',
        cameraId: targetCameraId,
        plantId: targetCam?.plantId,
        cameraName: capturedCameraName || targetCam?.name || targetCameraId,
        cameraIp: cameraIp,
        gateType: rawLocation
      });

      if (uploadRes && uploadRes.success) {
        const record: FtpUploadRecord = {
          remotePath: uploadRes.remotePath,
          filename: uploadRes.filename,
          timestamp: new Date().toLocaleTimeString(),
          httpProxyUrl: uploadRes.httpProxyUrl,
          ftpUrl: uploadRes.ftpUrl,
          sizeBytes: uploadRes.sizeBytes,
        };
        lastDetectedFilenameRef.current = uploadRes.remotePath || uploadRes.filename;
        setFtpUploadInfo(record);

        toast.success(`Vehicle ${plate} Saved to FTP!`, {
          id: 'gate-ftp-upload',
          description: `Location: ${uploadRes.remotePath} (${uploadRes.filename})`,
        });
      } else {
        toast.error("Failed to upload image to FTP server.", { id: 'gate-ftp-upload' });
      }
    } catch (err: any) {
      console.error('Error during FTP upload:', err);
      toast.error('FTP Upload Error: ' + (err.message || 'Failed to save to FTP'), { id: 'gate-ftp-upload' });
    } finally {
      setIsSavingFtp(false);
    }
  };

  // Helper to determine if a camera is ANPR capable
  const isCameraANPR = (cam: any): boolean => {
    if (!cam) return false;
    if (cam.isANPR || cam.cameraType === 'anpr') return true;
    const name = (cam.name || '').toLowerCase();
    const id = (cam.id || '').toLowerCase();
    return id === 'cam_gate_1' || id === 'Exit 2' || name.includes('anpr') || id.includes('anpr');
  };

  // Reset selected camera if plant or camera list changes and selected camera is no longer in list
  useEffect(() => {
    if (selectedCameraId !== 'all' && !cameras.some(c => c.id === selectedCameraId)) {
      setSelectedCameraId('all');
    }
  }, [cameras, selectedCameraId]);

  // Filter cameras based on user's selection
  const displayedCameras = selectedCameraId === "all"
    ? cameras
    : cameras.filter(cam => cam.id === selectedCameraId);

  // Check if current view has ANPR capability
  const activeSelectedCamera = cameras.find(c => c.id === selectedCameraId);
  const isAnprAvailable = selectedCameraId === "all"
    ? cameras.some(isCameraANPR)
    : isCameraANPR(activeSelectedCamera);

  if (checkingDb) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground">Checking system status...</p>
        </div>
      </div>
    );
  }

  if (!dbInitialized) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <LogIn className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gate Monitor</h1>
            <p className="text-muted-foreground">
              Live ANPR feed with vehicle detection
            </p>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            <div className="space-y-4">
              <p className="font-medium">Database tables need to be initialized first.</p>
              <p className="text-sm text-muted-foreground">
                This is a one-time setup that will create the necessary tables for camera configuration and streaming.
              </p>
              <Button onClick={initializeDatabase}>
                Initialize Database
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <LogIn className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Gate Monitor</h1>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 text-xs gap-1 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                GATE CONTROL
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Live gate surveillance, vehicle plate recognition & entry authorization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card/80 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {displayedCameras.length} {displayedCameras.length === 1 ? 'Camera Active' : 'Cameras Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Gatekeeper Camera Selector Bar */}
      <div className="bg-card border rounded-lg p-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Select Gate Camera View:</span>
          </div>

          {/* Quick Select Buttons for Gatekeeper */}
          <div className="flex flex-wrap items-center gap-1.5">
            {cameras.length > 1 && (
              <Button
                type="button"
                variant={selectedCameraId === "all" ? "default" : "outline"}
                size="sm"
                className="text-xs gap-1.5 cursor-pointer h-8"
                onClick={() => setSelectedCameraId("all")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>All Feeds ({cameras.length})</span>
              </Button>
            )}

            {cameras.length === 0 && initialized && (
              <span className="text-xs text-muted-foreground">No cameras assigned to this plant</span>
            )}

            {cameras.map((cam, idx) => {
              const isAnpr = isCameraANPR(cam);
              return (
                <Button
                  key={cam.id}
                  type="button"
                  variant={selectedCameraId === cam.id ? "default" : "outline"}
                  size="sm"
                  className="text-xs gap-1.5 cursor-pointer h-8"
                  onClick={() => setSelectedCameraId(cam.id)}
                >
                  <Video className="h-3.5 w-3.5" />
                  <span>{cam.name || `Camera ${idx + 1}`}</span>
                  {isAnpr ? (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-primary/20 text-primary uppercase font-mono ml-0.5">
                      ANPR
                    </Badge>
                  ) : (
                    <span className="text-[9px] text-muted-foreground ml-0.5 opacity-80">(Overview)</span>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Mobile / Dropdown Fallback */}
          <div className="sm:hidden w-full">
            <Select value={selectedCameraId} onValueChange={setSelectedCameraId}>
              <SelectTrigger className="w-full text-xs h-9">
                <SelectValue placeholder="Choose Camera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📺 All Feeds (Split View)</SelectItem>
                {cameras.map((cam) => (
                  <SelectItem key={cam.id} value={cam.id}>
                    📹 {cam.name} {isCameraANPR(cam) ? '— [ANPR]' : '— [Overview]'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Grid Layout: Live Camera Feeds */}
      <div className="grid grid-cols-1 gap-5">
        {initialized ? (
          displayedCameras.length > 0 ? (
            <div className={selectedCameraId === "all" && displayedCameras.length > 1 ? "grid grid-cols-1 md:grid-cols-2 gap-5" : "grid grid-cols-1 gap-5"}>
              {displayedCameras.map((camera) => (
                <LiveFeedViewer 
                  key={camera.id} 
                  camera={camera}
                  enableANPR={isCameraANPR(camera)}
                  gatekeeperMode={true}
                  onPlateInView={handlePlateInView}
                  onRegisterCapture={registerCameraCapture}
                  onManualCaptureClick={handleManualCapture}
                />
              ))}
            </div>
          ) : (
            <div className="border border-dashed rounded-lg p-10 text-center bg-card/50">
              <Camera className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">No Cameras Assigned to This Plant</p>
              <p className="text-xs text-muted-foreground mt-1">
                Super Admin can register or assign cameras to this plant in Device Config.
              </p>
            </div>
          )
        ) : (
          <div className={selectedCameraId === "all" ? "grid grid-cols-1 md:grid-cols-2 gap-5" : "grid grid-cols-1 gap-5"}>
            {displayedCameras.map((camera) => (
              <div key={camera.id} className="aspect-video bg-muted rounded-lg flex items-center justify-center border">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ))}
          </div>
        )}

        {/* Detected Plate Display & Entry Action */}
        <SimplePlateDisplay 
          plateNumber={detectedPlate}
          confidence={detectedConfidence}
          onRefreshFtp={() => checkLatestFtpPlate(true)}
          isCheckingFtp={isCheckingFtp}
          onPlateChange={setDetectedPlate}
          ftpUploadInfo={ftpUploadInfo}
          capturedImage={capturedFrameUrl}
          capturedTimestamp={capturedTimestamp}
          onClear={() => {
            setDetectedPlate("");
            setCapturedFrameUrl(null);
            setCapturedTimestamp(null);
            setFtpUploadInfo(null);
          }}
          isAnprCamera={isAnprAvailable}
        />
      </div>
    </div>
  );
};

export default GateMonitor;
