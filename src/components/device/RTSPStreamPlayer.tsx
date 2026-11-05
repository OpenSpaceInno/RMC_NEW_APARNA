import { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, ExternalLink, Copy, Check, Loader2 } from 'lucide-react';

interface RTSPStreamPlayerProps {
  rtspUrl: string;
  hlsProxyUrl?: string;
  autoPlay?: boolean;
  muted?: boolean;
  onError?: (error: string) => void;
  onLoad?: () => void;
}

export function RTSPStreamPlayer({
  rtspUrl,
  hlsProxyUrl,
  autoPlay = true,
  muted = true,
  onError,
  onLoad,
}: RTSPStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!hlsProxyUrl) {
      setLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError(null);

    // Check if browser supports HLS natively (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsProxyUrl;
      video.addEventListener('loadedmetadata', handleLoad);
      video.addEventListener('error', handleError);
    } else {
      // For other browsers, we'd need hls.js library
      // For now, show error message
      setError('HLS playback requires Safari or an HLS.js integration');
      setLoading(false);
      onError?.('Browser does not support HLS natively');
    }

    function handleLoad() {
      setLoading(false);
      onLoad?.();
    }

    function handleError() {
      const errorMsg = 'Failed to load HLS stream';
      setError(errorMsg);
      setLoading(false);
      onError?.(errorMsg);
    }

    return () => {
      if (video) {
        video.removeEventListener('loadedmetadata', handleLoad);
        video.removeEventListener('error', handleError);
      }
    };
  }, [hlsProxyUrl, onError, onLoad]);

  const copyRtspUrl = () => {
    navigator.clipboard.writeText(rtspUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openInVLC = () => {
    window.open(`vlc://${rtspUrl}`, '_blank');
  };

  if (!hlsProxyUrl) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Configure an HLS proxy URL in RTSP settings for browser playback. 
            Use the RTSP URL below in VLC or another compatible player.
          </AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="secondary"
            onClick={copyRtspUrl}
            className="gap-1"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied!' : 'Copy RTSP URL'}
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={openInVLC}
            className="gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Open in VLC
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="secondary"
            onClick={copyRtspUrl}
            className="gap-1"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            Copy RTSP URL
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={openInVLC}
            className="gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Open in VLC
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        autoPlay={autoPlay}
        muted={muted}
        playsInline
        controls
      />
    </div>
  );
}
