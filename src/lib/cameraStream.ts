/**
 * Utility functions for resolving camera HLS URLs safely in both local and hosted production environments.
 * Prevents browser "Mixed Content" blocks on HTTPS servers (e.g. Coolify sslip.io).
 * Automatically maps plant cameras to active live streaming bridges (live_cam1, live_cam2) with dual-stream fallback.
 */
import Hls from 'hls.js';

export interface CameraStreamPair {
  primaryUrl: string;
  alternateUrl: string | null;
}

/**
 * Normalizes legacy camera stream aliases to active live stream endpoints.
 * Plant camera 1 (192.168.0.101) -> live_cam1
 * Plant camera 2 (192.168.0.99)  -> live_cam2
 * Plant camera 3 (192.168.0.99)  -> live_cam2
 */
export function normalizeCameraStreamPath(pathOrId: string = 'live_cam1'): string {
  const lower = (pathOrId || '').toLowerCase().trim();
  if (lower === 'cam1' || lower === 'cam_gate_1' || lower.includes('entry') || lower.includes('anpr')) {
    return 'live_cam1';
  }
  if (
    lower === 'cam2' || 
    lower === 'cam_gate_2' || 
    lower === 'cam3' || 
    lower === 'cam_gate_3' || 
    lower === 'exit 2' || 
    lower.includes('exit') || 
    lower.includes('scale') || 
    lower.includes('weigh') || 
    lower.includes('overview')
  ) {
    return 'live_cam2';
  }
  return pathOrId.replace(/[^a-zA-Z0-9_\-]/g, '') || 'live_cam1';
}

/**
 * Resolves camera HLS URLs safely, converting relative, local port 8888,
 * or legacy /cam1/ /cam2/ paths to production-safe live_cam1 / live_cam2 endpoints.
 */
export function resolveCameraHlsUrl(rawUrl?: string, defaultPath: string = 'live_cam1'): string {
  const normDefault = normalizeCameraStreamPath(defaultPath);

  if (!rawUrl || rawUrl.trim() === '') {
    return `/hls/${normDefault}/index.m3u8`;
  }

  let clean = rawUrl.trim();

  // If already relative /hls/...
  if (clean.startsWith('/hls/')) {
    if (clean.includes('/cam1/') && !clean.includes('live_cam1')) {
      return clean.replace('/cam1/', '/live_cam1/');
    }
    if (clean.includes('/cam2/') && !clean.includes('live_cam2')) {
      return clean.replace('/cam2/', '/live_cam2/');
    }
    if (clean.includes('/cam3/') && !clean.includes('live_cam2')) {
      return clean.replace('/cam3/', '/live_cam2/');
    }
    return clean;
  }

  // If it references port 8888 (e.g. http://localhost:8888/cam1/index.m3u8)
  if (clean.includes(':8888/')) {
    let subPath = clean.split(':8888/')[1];
    if (subPath.startsWith('cam1/')) subPath = subPath.replace('cam1/', 'live_cam1/');
    else if (subPath.startsWith('cam2/')) subPath = subPath.replace('cam2/', 'live_cam2/');
    else if (subPath.startsWith('cam3/')) subPath = subPath.replace('cam3/', 'live_cam2/');
    return `/hls/${subPath}`;
  }

  // If HTTPS and starts with http:// (Mixed Content prevention)
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && clean.startsWith('http://')) {
    const match = clean.match(/\/([a-zA-Z0-9_\-]+)\/index\.m3u8/);
    if (match && match[1]) {
      let streamName = match[1];
      if (streamName === 'cam1') streamName = 'live_cam1';
      else if (streamName === 'cam2') streamName = 'live_cam2';
      else if (streamName === 'cam3') streamName = 'live_cam2';
      return `/hls/${streamName}/index.m3u8`;
    }
  }

  // Fallback string replacements for legacy alias paths
  if (clean.includes('/cam1/') && !clean.includes('live_cam1')) {
    return clean.replace('/cam1/', '/live_cam1/');
  }
  if (clean.includes('/cam2/') && !clean.includes('live_cam2')) {
    return clean.replace('/cam2/', '/live_cam2/');
  }
  if (clean.includes('/cam3/') && !clean.includes('live_cam2')) {
    return clean.replace('/cam3/', '/live_cam2/');
  }

  return clean;
}

/**
 * Returns primary (live_cam*) and alternate (legacy cam*) URL pairs
 * so players can automatically fallback without dropping straight to simulated canvas.
 */
export function resolveCameraStreamPair(rawUrlOrId?: string, defaultStream: string = 'live_cam1'): CameraStreamPair {
  const primary = resolveCameraHlsUrl(rawUrlOrId, defaultStream);

  let alternate: string | null = null;
  if (primary.includes('live_cam1')) {
    alternate = primary.replace('live_cam1', 'cam1');
  } else if (primary.includes('/cam1/')) {
    alternate = primary.replace('/cam1/', '/live_cam1/');
  } else if (primary.includes('live_cam2')) {
    alternate = primary.replace('live_cam2', 'cam2');
  } else if (primary.includes('/cam2/')) {
    alternate = primary.replace('/cam2/', '/live_cam2/');
  } else if (primary.includes('/cam3/')) {
    alternate = primary.replace('/cam3/', '/live_cam2/');
  }

  return { primaryUrl: primary, alternateUrl: alternate };
}

export interface AttachHlsOptions {
  video: HTMLVideoElement | null;
  urlOrPair: string | CameraStreamPair;
  onConnected?: () => void;
  onError?: (err?: any) => void;
  timeoutMs?: number;
}

/**
 * Universal HLS stream player attachment helper with credentials, dual URL fallback,
 * and graceful timeouts for zero-latency camera viewing across all plant modules.
 */
export function attachHlsStream({
  video,
  urlOrPair,
  onConnected,
  onError,
  timeoutMs = 12000,
}: AttachHlsOptions): () => void {
  if (!video) return () => {};

  const pair: CameraStreamPair = typeof urlOrPair === 'string'
    ? resolveCameraStreamPair(urlOrPair)
    : urlOrPair;

  let isResolved = false;
  let triedAlternate = false;
  let hlsInstance: Hls | null = null;
  let fallbackTimer: any = null;

  const markSuccess = () => {
    if (!isResolved) {
      isResolved = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      video.muted = true;
      video.play().catch(e => console.warn('Autoplay error:', e));
      onConnected?.();
    }
  };

  const markError = (details?: any) => {
    if (fallbackTimer) clearTimeout(fallbackTimer);
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
    onError?.(details);
  };

  if (timeoutMs > 0) {
    fallbackTimer = setTimeout(() => {
      if (!isResolved) {
        console.info(`HLS stream timeout (${pair.primaryUrl}); engaging fallback.`);
        markError({ details: 'TIMEOUT' });
      }
    }, timeoutMs);
  }

  if (Hls.isSupported()) {
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 60,
      manifestLoadingTimeOut: 10000,
      manifestLoadingMaxRetry: 3,
      levelLoadingTimeOut: 10000,
      fragLoadingTimeOut: 10000,
      xhrSetup: (xhr) => {
        xhr.withCredentials = true;
      }
    });

    hlsInstance = hls;
    hls.loadSource(pair.primaryUrl);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, markSuccess);
    hls.on(Hls.Events.FRAG_LOADED, markSuccess);

    hls.on(Hls.Events.ERROR, (_evt, data) => {
      if (!isResolved && pair.alternateUrl && !triedAlternate) {
        triedAlternate = true;
        console.info(`Primary stream ${pair.primaryUrl} error; testing alternate ${pair.alternateUrl}...`);
        hls.loadSource(pair.alternateUrl);
        return;
      }

      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            markError(data);
            break;
        }
      }
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = pair.primaryUrl;
    let triedAlt = false;

    const onMeta = () => markSuccess();
    const onErr = () => {
      if (!triedAlt && pair.alternateUrl) {
        triedAlt = true;
        video.src = pair.alternateUrl;
        return;
      }
      markError();
    };

    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('error', onErr);

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('error', onErr);
    };
  } else {
    markError({ details: 'HLS_UNSUPPORTED' });
  }

  return () => {
    if (fallbackTimer) clearTimeout(fallbackTimer);
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
  };
}
