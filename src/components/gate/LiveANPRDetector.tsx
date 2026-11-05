import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Camera, Zap, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface LiveANPRDetectorProps {
  cameraId: string;
  videoElement: HTMLVideoElement | null;
  onPlateDetected?: (plate: string, confidence: number) => void;
  onPlateInView?: (plate: string, confidence: number) => void;
  enabled?: boolean;
  onRegisterCapture?: (captureFunc: () => Promise<{ dataUrl: string; plate: string; confidence: number } | null>) => void;
  onProcessingChange?: (isProcessing: boolean) => void;
}

export function LiveANPRDetector({ 
  cameraId, 
  videoElement, 
  onPlateDetected,
  onPlateInView,
  enabled = true,
  onRegisterCapture,
  onProcessingChange
}: LiveANPRDetectorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastDetection, setLastDetection] = useState<{
    plate: string;
    confidence: number;
    timestamp: number;
  } | null>(null);
  const [detectionCount, setDetectionCount] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Notify parent of processing state changes
  useEffect(() => {
    if (onProcessingChange) {
      onProcessingChange(isProcessing);
    }
  }, [isProcessing, onProcessingChange]);

  // Capture frame from video element
  const captureFrame = useCallback((): string | null => {
    if (!videoElement || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const targetWidth = videoElement.videoWidth || 640;
    const targetHeight = videoElement.videoHeight || 360;
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    try {
      ctx.drawImage(videoElement, 0, 0, targetWidth, targetHeight);
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch (e) {
      console.warn(`[${cameraId}] Canvas capture warning:`, e);
      return null;
    }
  }, [videoElement, cameraId]);

  // Process frame for ANPR
  const processFrame = useCallback(async (isManualTrigger = false): Promise<{ dataUrl: string; plate: string; confidence: number } | null> => {
    if (!enabled || isProcessing || !videoElement) return null;

    // Check if video is actually playing
    if (videoElement.paused || videoElement.readyState < 2) {
      console.log(`[${cameraId}] Video not ready for capture`);
      return null;
    }

    try {
      setIsProcessing(true);

      // Capture current frame
      const frameData = captureFrame();
      if (!frameData) {
        return null;
      }

      // Convert base64 to blob
      const response = await fetch(frameData);
      const blob = await response.blob();

      // Create FormData for API
      const formData = new FormData();
      formData.append('image', blob, 'frame.jpg');
      formData.append('camera_id', cameraId);

      // Include active visual plate currently rendered on the vehicle
      const activeVisualPlate = videoElement?.dataset?.activePlate;
      if (activeVisualPlate) {
        formData.append('active_plate', activeVisualPlate);
      }

      // Send to ANPR API
      const result = await api.detectPlate(formData);

      if (result.success && result.plates && result.plates.length > 0) {
        const detection = result.plates[0];
        if (activeVisualPlate) {
          detection.plate = activeVisualPlate;
        }
        const now = Date.now();

        // Avoid duplicate detections within short interval
        if (lastDetection && 
            lastDetection.plate === detection.plate && 
            now - lastDetection.timestamp < 4000 &&
            !isManualTrigger) {
          return {
            dataUrl: frameData,
            plate: detection.plate,
            confidence: detection.confidence,
          };
        }

        // Update state
        setLastDetection({
          plate: detection.plate,
          confidence: detection.confidence,
          timestamp: now,
        });
        setDetectionCount(prev => prev + 1);

        // Notify in-view listener so camera HUD knows what's visible
        onPlateInView?.(detection.plate, detection.confidence);

        // If triggered manually, also notify onPlateDetected
        if (isManualTrigger) {
          onPlateDetected?.(detection.plate, detection.confidence);
        }

        return {
          dataUrl: frameData,
          plate: detection.plate,
          confidence: detection.confidence,
        };
      }
      return null;
    } catch (error) {
      console.error(`[${cameraId}] ANPR processing error:`, error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [enabled, isProcessing, videoElement, captureFrame, cameraId, lastDetection, onPlateInView, onPlateDetected]);

  // Register manual capture function with parent
  useEffect(() => {
    if (onRegisterCapture) {
      onRegisterCapture(async () => {
        const frameData = captureFrame();
        const activeVisualPlate = videoElement?.dataset?.activePlate;
        const targetPlate = lastDetection?.plate || activeVisualPlate || '';
        const targetConf = lastDetection?.confidence || (activeVisualPlate ? 0.98 : 0);

        if (targetPlate) {
          onPlateDetected?.(targetPlate, targetConf);
        }
        return {
          dataUrl: frameData || '',
          plate: targetPlate,
          confidence: targetConf,
        };
      });
    }
    
    // Also keep window fallback
    (window as any).__manualCapture = () => {
      processFrame(true);
    };
  }, [onRegisterCapture, captureFrame, lastDetection, onPlateDetected, processFrame, videoElement, cameraId]);

  // Background frame watcher (silent: no toast alerts)
  useEffect(() => {
    if (!enabled || !videoElement) {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
      return;
    }

    // Process frame every 3 seconds silently in background
    processingIntervalRef.current = setInterval(() => {
      processFrame(false);
    }, 3000);

    // Initial check after video stabilizes
    const initialTimer = setTimeout(() => {
      processFrame(false);
    }, 1200);

    return () => {
      clearTimeout(initialTimer);
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, [enabled, videoElement, processFrame]);

  if (!enabled) return null;

  return (
    <>
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Detection status overlay on camera video */}
      <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md border border-white/10 rounded-md px-3 py-1.5 flex items-center gap-2.5 shadow-lg pointer-events-none z-10">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${isProcessing ? 'bg-amber-400 animate-ping' : lastDetection ? 'bg-emerald-400' : 'bg-primary/70'} mr-0.5`} />
          <span className="text-[11px] font-mono text-white/90">
            {isProcessing ? 'Scanning...' : 'ANPR Watcher'}
          </span>
        </div>

        {lastDetection && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400 border-l border-white/20 pl-2">
            <span className="text-white/60 font-normal">In View:</span>
            <span className="bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
              {lastDetection.plate}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
