/**
 * Utility functions for resolving camera HLS URLs safely in both local and hosted production environments.
 * Prevents browser "Mixed Content" blocks on HTTPS servers (e.g. Coolify sslip.io).
 */

export function resolveCameraHlsUrl(rawUrl?: string, defaultPath: string = 'cam1'): string {
  if (!rawUrl || rawUrl.trim() === '') {
    return `/hls/${defaultPath}/index.m3u8`;
  }

  const clean = rawUrl.trim();

  // If already relative /hls/...
  if (clean.startsWith('/hls/')) {
    return clean;
  }

  // If it references port 8888 (e.g. http://localhost:8888/cam1/index.m3u8 or http://192.168.0.x:8888/cam1/index.m3u8)
  if (clean.includes(':8888/')) {
    const subPath = clean.split(':8888/')[1];
    return `/hls/${subPath}`;
  }

  // If the browser is running over HTTPS and the URL is http:// (which browsers strictly block as Mixed Content)
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && clean.startsWith('http://')) {
    // If it contains a camera path like /cam1/index.m3u8 or /test/index.m3u8
    const match = clean.match(/\/([a-zA-Z0-9_\-]+)\/index\.m3u8/);
    if (match && match[1]) {
      return `/hls/${match[1]}/index.m3u8`;
    }
  }

  return clean;
}
