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
  autoReconnect?: boolean;
}

/**
 * Universal HLS stream player attachment helper with credentials, dual URL fallback,
 * automatic infinite reconnection, and live stall recovery.
 * Guarantees cameras remain continuously live without requiring page refreshes.
 */
export function attachHlsStream({
  video,
  urlOrPair,
  onConnected,
  onError,
  timeoutMs = 12000,
  autoReconnect = true,
}: AttachHlsOptions): () => void {
  if (!video) return () => {};

  const pair: CameraStreamPair = typeof urlOrPair === 'string'
    ? resolveCameraStreamPair(urlOrPair)
    : urlOrPair;

  let isDestroyed = false;
  let isResolved = false;
  let useAlternate = false;
  let hlsInstance: Hls | null = null;
  let fallbackTimer: any = null;
  let reconnectTimer: any = null;
  let heartbeatTimer: any = null;
  let lastPlaybackTime = -1;
  let stallCount = 0;

  let consecutiveErrors = 0;

  const getTargetUrl = () => {
    return useAlternate && pair.alternateUrl ? pair.alternateUrl : pair.primaryUrl;
  };

  const markSuccess = () => {
    if (isDestroyed) return;
    consecutiveErrors = 0;
    if (!isResolved) {
      isResolved = true;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      video.muted = true;
      video.play().catch(e => console.warn('[CameraStream] Autoplay notice:', e));
      onConnected?.();
    }
  };

  const scheduleReconnect = (delayMs: number = 2000) => {
    if (isDestroyed || !autoReconnect) return;
    if (reconnectTimer) return;

    // Toggle between primary and alternate on repeated reconnects if alternate exists
    if (pair.alternateUrl) {
      useAlternate = !useAlternate;
    }

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (isDestroyed) return;
      console.info(`[CameraStream] Auto-reconnecting live stream -> ${getTargetUrl()}`);
      connect();
    }, delayMs);
  };

  const cleanupCurrentHls = () => {
    if (hlsInstance) {
      try {
        hlsInstance.stopLoad();
        hlsInstance.detachMedia();
        hlsInstance.destroy();
      } catch (e) {}
      hlsInstance = null;
    }
  };

  const connect = () => {
    if (isDestroyed || !video) return;
    cleanupCurrentHls();

    const targetUrl = getTargetUrl();

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 10,
        maxMaxBufferLength: 20,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 6,
        liveDurationInfinity: true,
        manifestLoadingTimeOut: 8000,
        manifestLoadingMaxRetry: Infinity,
        manifestLoadingRetryDelay: 1000,
        manifestLoadingMaxRetryTimeout: 4000,
        levelLoadingTimeOut: 8000,
        levelLoadingMaxRetry: Infinity,
        levelLoadingRetryDelay: 1000,
        levelLoadingMaxRetryTimeout: 4000,
        fragLoadingTimeOut: 10000,
        fragLoadingMaxRetry: 10,
        fragLoadingRetryDelay: 1000,
        xhrSetup: (xhr) => {
          xhr.withCredentials = true;
        }
      });

      hlsInstance = hls;
      hls.loadSource(targetUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, markSuccess);
      hls.on(Hls.Events.FRAG_LOADED, markSuccess);

      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (isDestroyed) return;

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn(`[CameraStream] Network hiccup on ${targetUrl}, reloading...`);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn(`[CameraStream] Media error on ${targetUrl}, recovering...`);
              hls.recoverMediaError();
              break;
            default:
              consecutiveErrors++;
              console.warn(`[CameraStream] Stream hiccup on ${targetUrl}:`, data.details);
              scheduleReconnect(1500);
              if (consecutiveErrors >= 3) {
                isResolved = false;
                onError?.(data);
              }
              break;
          }
        } else if (data.details === 'bufferStalledError') {
          // If buffered data exists, jump forward slightly to break the stall
          if (video && video.buffered && video.buffered.length > 0) {
            const end = video.buffered.end(video.buffered.length - 1);
            if (end - video.currentTime > 0.5) {
              video.currentTime = end - 0.2;
              video.play().catch(() => {});
            }
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = targetUrl;
      video.muted = true;

      const onMeta = () => markSuccess();
      const onErr = () => {
        if (isDestroyed) return;
        consecutiveErrors++;
        scheduleReconnect(2000);
        if (consecutiveErrors >= 3) {
          isResolved = false;
          onError?.({ details: 'SAFARI_HLS_ERROR' });
        }
      };

      video.addEventListener('loadedmetadata', onMeta, { once: true });
      video.addEventListener('error', onErr, { once: true });
    } else {
      onError?.({ details: 'HLS_UNSUPPORTED' });
    }
  };

  // Initial stream connection
  connect();

  // Watchdog: ensures video keeps advancing and doesn't get stuck at buffer boundary
  heartbeatTimer = setInterval(() => {
    if (isDestroyed || !video) return;

    if (isResolved) {
      if (video.paused && !video.ended) {
        video.play().catch(() => {});
      }

      if (video.currentTime === lastPlaybackTime && !video.paused) {
        stallCount++;
        if (stallCount >= 3) {
          stallCount = 0;
          if (video.buffered && video.buffered.length > 0) {
            const end = video.buffered.end(video.buffered.length - 1);
            video.currentTime = Math.max(0, end - 0.2);
            video.play().catch(() => {});
          } else {
            // Buffer empty / publisher reset -> reload stream cleanly
            scheduleReconnect(1000);
          }
        }
      } else {
        stallCount = 0;
        lastPlaybackTime = video.currentTime;
      }
    }
  }, 2500);

  if (timeoutMs > 0) {
    fallbackTimer = setTimeout(() => {
      if (!isResolved && !isDestroyed) {
        console.info(`[CameraStream] Initial handshake wait elapsed for ${pair.primaryUrl}; activating fallback.`);
        onError?.({ details: 'STREAM_TIMEOUT' });
        scheduleReconnect(2000);
      }
    }, timeoutMs);
  }

  // Teardown function for React useEffect unmount
  return () => {
    isDestroyed = true;
    if (fallbackTimer) clearTimeout(fallbackTimer);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    cleanupCurrentHls();
    try {
      video.pause();
      video.removeAttribute('src');
      video.load();
    } catch (e) {}
  };
}

