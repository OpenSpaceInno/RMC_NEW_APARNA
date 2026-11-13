// Physical IP Cameras & RTSP Feeds Service
// Media server manager (MediaMTX / go2rtc / WebRTC / HLS)

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import http from 'http';
import net from 'net';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CameraStreamService {
  constructor() {
    this.mediaMtxProcess = null;
    
    // Auto-locate mediamtx.exe and mediamtx.yml across possible roots
    const candidateRoots = [
      path.resolve(__dirname, '..'),                      // rmc-gate-to-exit-main
      path.resolve(process.cwd()),                        // current working dir
      path.resolve(process.cwd(), '..'),                  // parent of cwd
      path.resolve(__dirname, '../..'),                   // root repo
    ];

    this.rootDir = candidateRoots.find(dir => fs.existsSync(path.join(dir, 'mediamtx.exe'))) || path.resolve(__dirname, '..');
    this.exePath = path.join(this.rootDir, 'mediamtx.exe');
    this.configPath = path.join(this.rootDir, 'mediamtx.yml');
    this.isRunning = false;

    this.streamEndpoints = {
      hlsPort: 8888,
      webrtcPort: 8889,
      rtspPort: 8554,
      apiPort: 9997,
    };
  }

  /**
   * Check if MediaMTX port is responsive
   * @param {number} port 
   * @returns {Promise<boolean>}
   */
  async isPortOpen(port) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(800);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      const targetHost = process.env.MEDIAMTX_HOST || '127.0.0.1';
      socket.connect(port, targetHost);
    });
  }

  /**
   * Start MediaMTX if available and not already listening
   */
  async ensureMediaServerRunning() {
    const isHlsUp = await this.isPortOpen(this.streamEndpoints.hlsPort);
    if (isHlsUp) {
      this.isRunning = true;
      console.log(`📹 MediaMTX media server already active on port ${this.streamEndpoints.hlsPort} (HLS) / ${this.streamEndpoints.webrtcPort} (WebRTC)`);
      return true;
    }

    if (!fs.existsSync(this.exePath)) {
      console.log(`⚠️ mediamtx.exe not found at ${this.exePath}. Video feeds will use direct HLS / Canvas simulation.`);
      return false;
    }

    try {
      console.log(`🚀 Starting MediaMTX media server from ${this.exePath}...`);
      this.mediaMtxProcess = spawn(this.exePath, [this.configPath], {
        cwd: this.rootDir,
        stdio: 'ignore',
        detached: true
      });

      this.mediaMtxProcess.unref();
      this.isRunning = true;
      console.log('✅ MediaMTX spawned successfully.');
      return true;
    } catch (err) {
      console.error('Failed to spawn MediaMTX:', err.message);
      return false;
    }
  }

  /**
   * Locate FFmpeg binary on Windows or system PATH
   */
  getFfmpegPath() {
    const wingetPath = path.join(
      process.env.LOCALAPPDATA || 'C:\\Users\\surad\\AppData\\Local',
      'Microsoft\\WinGet\\Packages\\Gyan.FFmpeg.Shared_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build-shared\\bin\\ffmpeg.exe'
    );
    if (fs.existsSync(wingetPath)) return wingetPath;
    return 'ffmpeg';
  }

  /**
   * Automatically start and supervise plant camera streaming bridges in background.
   * Runs 100% detached with zero console windows. Survives CMD closures.
   */
  async ensurePlantBridgesRunning() {
    // Check if plant cameras exist on local network
    const cam1Check = await this.checkTcpPort('192.168.0.101', 554, 800);
    const cam2Check = await this.checkTcpPort('192.168.0.99', 554, 800);

    if (!cam1Check.reachable && !cam2Check.reachable) {
      // Cloud VPS or network without plant cameras: skip local bridge
      return false;
    }

    const ffmpegBin = this.getFfmpegPath();
    const cloudTarget = process.env.CLOUD_RTSP_TARGET || 'rtsp://213.210.37.249:8554';

    const bridges = [
      {
        id: 'cam1_local',
        name: 'Camera 1 Local (Entry ANPR 3K HEVC -> H.264 @ local)',
        reachable: cam1Check.reachable,
        args: [
          '-rtsp_transport', 'tcp',
          '-timeout', '5000000',
          '-i', 'rtsp://admin:Password@123@192.168.0.101:554/ch1/main/av_stream',
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-tune', 'zerolatency',
          '-g', '25',
          '-keyint_min', '25',
          '-sc_threshold', '0',
          '-b:v', '2500k',
          '-an',
          '-rtsp_transport', 'tcp',
          '-f', 'rtsp',
          'rtsp://127.0.0.1:8554/live_cam1'
        ]
      },
      {
        id: 'cam1_cloud',
        name: 'Camera 1 Cloud Forwarder (local -> cloud)',
        reachable: cam1Check.reachable,
        args: [
          '-rtsp_transport', 'tcp',
          '-timeout', '5000000',
          '-i', 'rtsp://127.0.0.1:8554/live_cam1',
          '-c', 'copy',
          '-an',
          '-rtsp_transport', 'tcp',
          '-f', 'rtsp',
          `${cloudTarget}/live_cam1`
        ]
      },
      {
        id: 'cam2_local',
        name: 'Camera 2 Local (Exit Scale 1080p H.264 @ local)',
        reachable: cam2Check.reachable,
        args: [
          '-rtsp_transport', 'tcp',
          '-timeout', '5000000',
          '-i', 'rtsp://admin:Password@123@192.168.0.99:554/Streaming/Channels/101',
          '-c', 'copy',
          '-an',
          '-rtsp_transport', 'tcp',
          '-f', 'rtsp',
          'rtsp://127.0.0.1:8554/live_cam2'
        ]
      },
      {
        id: 'cam2_cloud',
        name: 'Camera 2 Cloud Forwarder (local -> cloud)',
        reachable: cam2Check.reachable,
        args: [
          '-rtsp_transport', 'tcp',
          '-timeout', '5000000',
          '-i', 'rtsp://127.0.0.1:8554/live_cam2',
          '-c', 'copy',
          '-an',
          '-rtsp_transport', 'tcp',
          '-f', 'rtsp',
          `${cloudTarget}/live_cam2`
        ]
      }
    ];

    if (!this.bridgeWorkers) this.bridgeWorkers = new Map();

    for (const bridge of bridges) {
      if (!bridge.reachable || this.bridgeWorkers.has(bridge.id)) continue;

      const launchWorker = () => {
        try {
          console.log(`🚀 [AutoBridge] Starting detached background stream for ${bridge.name}...`);
          const proc = spawn(ffmpegBin, bridge.args, {
            detached: true,
            stdio: 'ignore',
            windowsHide: true
          });

          proc.unref();
          this.bridgeWorkers.set(bridge.id, proc);

          proc.on('exit', (code) => {
            console.log(`⚠️ [AutoBridge] ${bridge.name} ended (exit ${code}). Auto-restarting in 3s...`);
            this.bridgeWorkers.delete(bridge.id);
            setTimeout(launchWorker, 3000);
          });

          proc.on('error', (err) => {
            console.warn(`⚠️ [AutoBridge] ${bridge.name} error: ${err.message}. Retrying in 5s...`);
            this.bridgeWorkers.delete(bridge.id);
            setTimeout(launchWorker, 5000);
          });
        } catch (e) {
          console.error(`Failed to launch ${bridge.name}:`, e.message);
        }
      };

      launchWorker();
    }

    return true;
  }

  /**
   * Fast probe of remote TCP port (e.g. camera RTSP port 554)
   * @param {string} host
   * @param {number} port
   * @param {number} timeoutMs
   * @returns {Promise<{reachable: boolean, latencyMs?: number, error?: string}>}
   */
  async checkTcpPort(host, port = 554, timeoutMs = 600) {
    const start = Date.now();
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(timeoutMs);

      socket.on('connect', () => {
        const latencyMs = Date.now() - start;
        socket.destroy();
        resolve({ reachable: true, latencyMs });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({ reachable: false, error: 'Connection timed out (Host unreachable / Cable unplugged)' });
      });

      socket.on('error', (err) => {
        socket.destroy();
        resolve({ reachable: false, error: err.message });
      });

      socket.connect(port, host);
    });
  }

  /**
   * Get detailed camera network & hardware diagnostics
   */
  async getDetailedDiagnostics() {
    const baseStatus = await this.getStreamStatus();

    // Probe configured cameras
    const cameraProbes = await Promise.all(
      baseStatus.physicalCameras.map(async (cam) => {
        const probe = await this.checkTcpPort(cam.ip, 554, 700);
        return {
          ...cam,
          online: probe.reachable,
          latencyMs: probe.latencyMs || null,
          probeError: probe.error || null,
        };
      })
    );

    // Identify primary issue
    const allCamerasOffline = cameraProbes.every(c => !c.online);
    let recommendation = 'Physical cameras connected and ready.';
    if (allCamerasOffline) {
      recommendation = 'Ethernet network cable to CCTV PoE switch is unplugged or cameras are powered off. Connect LAN cable or use Live WebCam / Realistic CCTV mode.';
    }

    return {
      timestamp: new Date().toISOString(),
      mediaServerActive: baseStatus.mediaServerActive,
      recommendation,
      cameraProbes,
      networkSummary: {
        allCamerasOffline,
        activeHlsUrls: baseStatus.protocols.hls.urls,
      }
    };
  }

  /**
   * Get real-time status of camera streams
   */
  async getStreamStatus() {
    const hlsOpen = await this.isPortOpen(this.streamEndpoints.hlsPort);
    const webrtcOpen = await this.isPortOpen(this.streamEndpoints.webrtcPort);
    const rtspOpen = await this.isPortOpen(this.streamEndpoints.rtspPort);

    let physicalCameras = [
      {
        id: 'cam_gate_1',
        name: 'ANPR Camera (Gate Entry)',
        ip: '192.168.0.101',
        rtsp: 'rtsp://admin:Password@123@192.168.0.101:554/ch1/main/av_stream',
        hlsProxy: `/hls/cam1/index.m3u8`
      },
      {
        id: 'cam_gate_2',
        name: 'IP Camera (Overview Lane)',
        ip: '192.168.0.99',
        rtsp: 'rtsp://admin:Password@123@192.168.0.99:554/Streaming/Channels/101',
        hlsProxy: `/hls/cam2/index.m3u8`
      },
      {
        id: 'cam_gate_3',
        name: 'Exit & Weighbridge Camera (Gate Exit)',
        ip: '192.168.0.99',
        rtsp: 'rtsp://admin:Password@123@192.168.0.99:554/Streaming/Channels/101',
        hlsProxy: `/hls/cam3/index.m3u8`
      }
    ];

    try {
      const [rows] = await pool.query('SELECT * FROM camera_devices ORDER BY created_at');
      if (Array.isArray(rows) && rows.length > 0) {
        physicalCameras = rows.map((r, i) => {
          const safePath = r.device_id === 'cam_gate_1' ? 'live_cam1' 
            : r.device_id === 'cam_gate_2' ? 'live_cam2' 
            : r.device_id === 'cam_gate_3' ? 'live_cam2' 
            : r.device_id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || `cam${i + 1}`;
          return {
            id: r.device_id,
            name: r.name,
            ip: r.ip_address,
            location: r.location,
            rtsp: `rtsp://admin:Password@123@${r.ip_address || '192.168.0.100'}:554/ch1/main/av_stream`,
            hlsProxy: `/hls/${safePath}/index.m3u8`
          };
        });
      }
    } catch (e) {
      console.warn('Physical camera DB query notice:', e.message);
    }

    return {
      mediaServerActive: hlsOpen,
      protocols: {
        hls: {
          port: this.streamEndpoints.hlsPort,
          active: hlsOpen,
          urls: {
            live_cam1: `/hls/live_cam1/index.m3u8`,
            live_cam2: `/hls/live_cam2/index.m3u8`,
            cam1: `/hls/cam1/index.m3u8`,
            cam2: `/hls/cam2/index.m3u8`,
            cam3: `/hls/cam3/index.m3u8`,
            exit2: `/hls/exit2/index.m3u8`,
            test: `/hls/test/index.m3u8`,
          }
        },
        webrtc: {
          port: this.streamEndpoints.webrtcPort,
          active: webrtcOpen,
          urls: {
            cam1: `http://localhost:${this.streamEndpoints.webrtcPort}/cam1/whep`,
            cam2: `http://localhost:${this.streamEndpoints.webrtcPort}/cam2/whep`,
          }
        },
        rtsp: {
          port: this.streamEndpoints.rtspPort,
          active: rtspOpen
        }
      },
      physicalCameras
    };
  }

  /**
   * Determine if an IP is in RFC 1918 private range (e.g. 192.168.x.x)
   */
  isPrivateIp(ip) {
    if (!ip) return false;
    return (
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) ||
      ip === '127.0.0.1' ||
      ip.toLowerCase() === 'localhost'
    );
  }

  /**
   * Safely encode special characters in RTSP credentials (e.g. '@' in password -> '%40')
   */
  sanitizeRtspUrl(url) {
    if (!url || !url.startsWith('rtsp://')) return url;
    try {
      const withoutProto = url.slice(7);
      const lastAt = withoutProto.lastIndexOf('@');
      if (lastAt === -1) return url;

      const userinfo = withoutProto.substring(0, lastAt);
      const hostAndPath = withoutProto.substring(lastAt + 1);

      const colonIdx = userinfo.indexOf(':');
      if (colonIdx === -1) return url;

      const user = userinfo.substring(0, colonIdx);
      const pass = userinfo.substring(colonIdx + 1);

      // If pass already contains '%', leave it, otherwise URL-encode '@' and other reserved chars
      const cleanPass = pass.includes('%') ? pass : encodeURIComponent(pass);
      return `rtsp://${user}:${cleanPass}@${hostAndPath}`;
    } catch {
      return url;
    }
  }

  /**
   * Dynamically update or add an active stream path in MediaMTX via its REST API
   * @param {string} pathName
   * @param {string} sourceUrl
   */
  async updateMediaMtxPath(pathName, sourceUrl) {
    const targetHost = process.env.MEDIAMTX_HOST || '127.0.0.1';
    const apiPort = this.streamEndpoints.apiPort || 9997;
    const cleanUrl = this.sanitizeRtspUrl(sourceUrl);

    const payload = JSON.stringify({
      source: cleanUrl || 'publisher',
      sourceProtocol: 'tcp',
      sourceOnDemand: true,
      overridePublisher: true
    });

    const sendRequest = (method, urlPath) => {
      return new Promise((resolve) => {
        const req = http.request({
          hostname: targetHost,
          port: apiPort,
          path: urlPath,
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          },
          timeout: 2500
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ status: res.statusCode, data }));
        });

        req.on('error', (err) => resolve({ status: 500, error: err.message }));
        req.on('timeout', () => { req.destroy(); resolve({ status: 408, error: 'Timeout' }); });
        req.write(payload);
        req.end();
      });
    };

    try {
      // Attempt PATCH first (updates existing entry)
      let res = await sendRequest('PATCH', `/v3/config/paths/patch/${pathName}`);
      if (res.status === 404) {
        // If path does not exist, add it
        res = await sendRequest('POST', `/v3/config/paths/add/${pathName}`);
      }
      return { success: res.status >= 200 && res.status < 300, ...res };
    } catch (e) {
      console.warn(`MediaMTX API update failed for ${pathName}:`, e.message);
      return { success: false, error: e.message };
    }
  }

}

export const cameraStreamService = new CameraStreamService();
export default cameraStreamService;
