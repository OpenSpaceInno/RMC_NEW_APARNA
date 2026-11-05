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
          const safePath = r.device_id === 'cam_gate_1' ? 'cam1' 
            : r.device_id === 'cam_gate_2' ? 'cam2' 
            : r.device_id === 'cam_gate_3' ? 'cam3' 
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

}

export const cameraStreamService = new CameraStreamService();
export default cameraStreamService;
