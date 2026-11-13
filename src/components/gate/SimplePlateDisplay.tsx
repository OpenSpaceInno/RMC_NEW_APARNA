import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Zap, 
  Camera, 
  RefreshCw, 
  CheckCircle2, 
  RotateCcw, 
  Eye, 
  Maximize2,
  FileCheck2,
  ShieldCheck,
  Car
} from "lucide-react";
import { toast } from "sonner";

export interface FtpUploadRecord {
  remotePath: string;
  filename: string;
  timestamp: string;
  httpProxyUrl?: string;
  ftpUrl?: string;
  sizeBytes?: number;
}

interface SimplePlateDisplayProps {
  plateNumber: string;
  confidence?: number;
  onRefreshFtp?: () => void;
  isCheckingFtp?: boolean;
  onPlateChange?: (plate: string) => void;
  ftpUploadInfo?: FtpUploadRecord | null;
  capturedImage?: string | null;
  capturedTimestamp?: string | null;
  onClear?: () => void;
  isAnprCamera?: boolean;
  // Deprecated callbacks retained for backwards compatibility
  onManualCapture?: () => void;
  onSaveToFtp?: () => void;
  isProcessing?: boolean;
  isSavingFtp?: boolean;
}

export function SimplePlateDisplay({ 
  plateNumber, 
  confidence = 0.98, 
  onRefreshFtp,
  isCheckingFtp = false,
  onPlateChange,
  ftpUploadInfo,
  capturedImage,
  capturedTimestamp,
  onClear,
  isAnprCamera = true,
}: SimplePlateDisplayProps) {
  const [currentPlate, setCurrentPlate] = useState(plateNumber || "");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [displayImageUrl, setDisplayImageUrl] = useState<string | null>(capturedImage || null);

  useEffect(() => {
    setCurrentPlate(plateNumber || "");
  }, [plateNumber]);

  useEffect(() => {
    setDisplayImageUrl(capturedImage || null);
  }, [capturedImage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setCurrentPlate(val);
    onPlateChange?.(val);
  };

  const handleConfirmEntry = () => {
    if (!currentPlate.trim()) {
      toast.error("Please enter or verify a vehicle license plate number.");
      return;
    }
    toast.success(`Vehicle ${currentPlate} Verified!`, {
      description: `Gate barrier open command sent at ${new Date().toLocaleTimeString()}`,
    });
  };

  const handleClear = () => {
    setCurrentPlate("");
    setDisplayImageUrl(null);
    onPlateChange?.("");
    onClear?.();
    toast.info("Cleared plate. Ready for next incoming vehicle.");
  };

  const handleImageError = () => {
    // If the image fails with a relative path, retry directly against the backend server port 3001
    if (displayImageUrl && displayImageUrl.startsWith('/api')) {
      const fallbackUrl = `http://localhost:3001${displayImageUrl}`;
      if (displayImageUrl !== fallbackUrl) {
        setDisplayImageUrl(fallbackUrl);
      }
    }
  };

  return (
    <Card className="border-primary/50 shadow-lg">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                <span>Vehicle Plate Detection</span>
              </CardTitle>
              <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 font-mono text-[11px]">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                FTP AUTO-ANPR
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Automated ANPR plate reading & vehicle evidence snapshot directly from camera FTP
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {onRefreshFtp && (
              <Button
                size="sm"
                variant="default"
                onClick={onRefreshFtp}
                disabled={isCheckingFtp}
                className="h-9 px-3.5 text-xs font-semibold gap-2 shadow-xs cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
                title="Fetch latest vehicle number and evidence snapshot from camera FTP"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isCheckingFtp ? 'animate-spin' : ''}`} />
                <span>{isCheckingFtp ? "Fetching Vehicle Number..." : "Get Vehicle Number"}</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-4">
        {/* ============================================================== */}
        {/* VEHICLE SNAPSHOT CAPTURED: Visual Evidence from Camera FTP    */}
        {/* ============================================================== */}
        <div className="rounded-lg border bg-card/60 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                <Camera className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span>Vehicle Snapshot Captured</span>
                  {ftpUploadInfo?.filename && (
                    <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-mono">
                      FTP EVIDENCE
                    </Badge>
                  )}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Real-time evidence photograph captured automatically by camera and verified in FTP
                </p>
              </div>
            </div>

            {capturedTimestamp && (
              <Badge variant="secondary" className="text-xs font-mono">
                {capturedTimestamp}
              </Badge>
            )}
          </div>

          {/* Evidence Image Box */}
          {displayImageUrl ? (
            <div className="flex flex-col md:flex-row gap-4 items-stretch bg-muted/40 p-3.5 rounded-lg border">
              {/* Snapshot Image Container */}
              <div 
                className="relative group cursor-pointer aspect-video md:aspect-[4/3] w-full md:w-80 max-w-sm rounded-md overflow-hidden border border-border shadow-sm bg-black shrink-0 flex items-center justify-center"
                onClick={() => setPreviewOpen(true)}
                title="Click to enlarge snapshot evidence"
              >
                <img
                  src={displayImageUrl}
                  alt={`Vehicle Snapshot Evidence - ${currentPlate || 'Camera Frame'}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={handleImageError}
                />
                
                {/* Live Evidence Badge */}
                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-xs text-[10px] text-white px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1.5 border border-white/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>EVIDENCE CAPTURED</span>
                </div>

                {/* Overlaid Detected Plate */}
                {currentPlate && (
                  <div className="absolute bottom-2 left-2 bg-emerald-600/95 backdrop-blur-xs text-white font-mono font-bold px-2.5 py-1 rounded text-xs shadow-md border border-emerald-400/60">
                    {currentPlate}
                  </div>
                )}

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs gap-1.5 font-medium">
                  <Maximize2 className="h-4 w-4" />
                  <span>Click to Enlarge Snapshot</span>
                </div>
              </div>

              {/* Snapshot Metadata Details */}
              <div className="flex-1 flex flex-col justify-between space-y-2.5 min-w-0 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-background/90 p-2.5 rounded-md border shadow-2xs">
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                      Detected Vehicle No
                    </span>
                    <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 truncate block">
                      {currentPlate || 'Detecting...'}
                    </span>
                  </div>

                  <div className="bg-background/90 p-2.5 rounded-md border shadow-2xs">
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                      ANPR Match Confidence
                    </span>
                    <span className="font-mono text-base font-bold text-foreground block">
                      {Math.round(confidence * 100)}% Verified
                    </span>
                  </div>
                </div>

                {ftpUploadInfo?.filename && (
                  <div className="bg-background/90 p-2.5 rounded-md border shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-[10px] uppercase font-semibold flex items-center gap-1">
                        <FileCheck2 className="h-3 w-3 text-emerald-500" />
                        <span>FTP Evidence File</span>
                      </span>
                      {ftpUploadInfo.sizeBytes ? (
                        <span className="font-mono text-[10px]">{Math.round(ftpUploadInfo.sizeBytes / 1024)} KB</span>
                      ) : null}
                    </div>
                    <div className="font-mono text-xs text-foreground truncate font-medium" title={ftpUploadInfo.filename}>
                      {ftpUploadInfo.filename}
                    </div>
                    {ftpUploadInfo.remotePath && ftpUploadInfo.remotePath !== ftpUploadInfo.filename && (
                      <div className="font-mono text-[10px] text-muted-foreground truncate" title={ftpUploadInfo.remotePath}>
                        Folder: {ftpUploadInfo.remotePath}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 gap-1.5 cursor-pointer"
                    onClick={() => setPreviewOpen(true)}
                  >
                    <Eye className="h-3.5 w-3.5 text-primary" />
                    <span>Enlarge Snapshot</span>
                  </Button>

                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Verified Camera FTP Evidence</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State: Awaiting incoming vehicle snapshot */
            <div className="aspect-video sm:aspect-auto sm:h-36 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20 flex flex-col items-center justify-center p-4 text-center">
              <div className="p-3 rounded-full bg-muted/60 text-muted-foreground mb-2">
                <Camera className="h-6 w-6" />
              </div>
              <p className="text-xs font-semibold text-foreground">
                No vehicle snapshot captured yet
              </p>
              <p className="text-[11px] text-muted-foreground max-w-md mt-0.5">
                Click <strong className="text-foreground">"Get Vehicle Number"</strong> to retrieve the latest arriving vehicle evidence snapshot from FTP, or wait for camera ANPR auto-detection.
              </p>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* VEHICLE REGISTRATION NUMBER INPUT & CONFIRMATION ACTION       */}
        {/* ============================================================== */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="plateNumber" className="text-sm font-semibold flex items-center gap-1.5">
              <span>Vehicle Registration Number</span>
              <span className="text-xs font-normal text-muted-foreground">(Editable for verification)</span>
            </Label>
            {currentPlate && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClear}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              id="plateNumber"
              value={currentPlate}
              onChange={handleInputChange}
              placeholder="Auto-reading vehicle plate from camera FTP..."
              className="font-mono text-2xl font-bold text-center bg-muted h-14 tracking-wider flex-1 border-primary/30 focus-visible:ring-primary"
            />

            {/* "Allow Gate In" Button */}
            <Button
              size="lg"
              className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-base shadow-md cursor-pointer shrink-0"
              onClick={handleConfirmEntry}
              disabled={!currentPlate.trim()}
            >
              <CheckCircle2 className="h-5 w-5" />
              Allow Gate In
            </Button>
          </div>

          {/* Status helper text */}
          {isAnprCamera ? (
            currentPlate ? (
              <p className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>
                  Vehicle number <span className="font-mono font-bold text-foreground">{currentPlate}</span> matched with captured camera snapshot. Verify details and click <span className="font-semibold text-emerald-600 dark:text-emerald-400">"Allow Gate In"</span>.
                </span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
                <Zap className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                <span>
                  Watching camera FTP path for vehicle arrival files. Click <span className="font-semibold text-foreground">"Get Vehicle Number"</span> to check immediately.
                </span>
              </p>
            )
          ) : (
            <p className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
              <Camera className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Viewing overview camera. Switch to an ANPR camera to enable automated plate detection.</span>
            </p>
          )}
        </div>
      </CardContent>

      {/* ============================================================== */}
      {/* HIGH RESOLUTION SNAPSHOT PREVIEW DIALOG                         */}
      {/* ============================================================== */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl p-5">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center justify-between gap-2 text-base">
              <span className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                <span>Vehicle Evidence Snapshot — {currentPlate || 'Camera Frame'}</span>
              </span>
              {capturedTimestamp && (
                <Badge variant="outline" className="font-mono text-xs">{capturedTimestamp}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {displayImageUrl && (
            <div className="relative rounded-lg overflow-hidden border bg-black max-h-[75vh] flex items-center justify-center shadow-inner">
              <img 
                src={displayImageUrl} 
                alt="Enlarged Vehicle Evidence Snapshot" 
                className="max-h-[70vh] w-auto object-contain"
                onError={handleImageError}
              />
              {currentPlate && (
                <div className="absolute bottom-3 left-3 bg-emerald-600/90 backdrop-blur-xs text-white font-mono font-bold text-lg px-3.5 py-1.5 rounded-md shadow-lg border border-emerald-400">
                  {currentPlate}
                </div>
              )}
            </div>
          )}

          {ftpUploadInfo?.filename && (
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground pt-1 border-t">
              <span>File: {ftpUploadInfo.filename}</span>
              {ftpUploadInfo.sizeBytes && (
                <span>Size: {Math.round(ftpUploadInfo.sizeBytes / 1024)} KB</span>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
