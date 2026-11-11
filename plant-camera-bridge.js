/**
 * Aparna RMC - Dedicated Plant Camera Streaming Background Daemon
 * Keeps Node.js alive 24/7 as supervisor, auto-restarts on any drop.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import net from 'net';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFile = path.join(__dirname, 'plant-bridge.log');

function log(msg) {
  const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(logFile, line + '\n');
  } catch {}
}

function getFfmpegPath() {
  const wingetPath = path.join(
    process.env.LOCALAPPDATA || 'C:\\Users\\surad\\AppData\\Local',
    'Microsoft\\WinGet\\Packages\\Gyan.FFmpeg.Shared_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build-shared\\bin\\ffmpeg.exe'
  );
  if (fs.existsSync(wingetPath)) return wingetPath;
  return 'ffmpeg';
}

function checkPort(host, port = 554, timeoutMs = 800) {
  return new Promise((resolve) => {
    const s = new net.Socket();
    s.setTimeout(timeoutMs);
    s.on('connect', () => { s.destroy(); resolve(true); });
    s.on('timeout', () => { s.destroy(); resolve(false); });
    s.on('error', () => { s.destroy(); resolve(false); });
    s.connect(port, host);
  });
}

const ffmpegBin = getFfmpegPath();
const CLOUD_TARGET = process.env.CLOUD_RTSP_TARGET || 'rtsp://213.210.37.249:8554';

const CAMERAS = [
  {
    id: 'cam1',
    name: 'Camera 1 (Entry ANPR 3K HEVC -> H.264)',
    ip: '192.168.0.101',
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
      `${CLOUD_TARGET}/live_cam1`
    ]
  },
  {
    id: 'cam2',
    name: 'Camera 2 (Exit Scale 1080p H.264)',
    ip: '192.168.0.99',
    args: [
      '-rtsp_transport', 'tcp',
      '-timeout', '5000000',
      '-i', 'rtsp://admin:Password@123@192.168.0.99:554/Streaming/Channels/101',
      '-c', 'copy',
      '-an',
      '-rtsp_transport', 'tcp',
      '-f', 'rtsp',
      `${CLOUD_TARGET}/live_cam2`
    ]
  }
];

log('====================================================');
log(' Aparna RMC - Automated Plant Camera Streaming Daemon');
log(' Running 24/7 background supervisor. No CMD needed.');
log(' Target Cloud: ' + CLOUD_TARGET);
log('====================================================');

async function superviseCamera(cam) {
  while (true) {
    try {
      const isOnline = await checkPort(cam.ip, 554, 1000);
      if (!isOnline) {
        log(`${cam.name} (${cam.ip}) waiting for camera network...`);
        await new Promise(r => setTimeout(r, 4000));
        continue;
      }

      log(`🚀 Launching background stream for ${cam.name}...`);
      
      await new Promise((resolve) => {
        const proc = spawn(ffmpegBin, cam.args, {
          stdio: 'ignore',
          windowsHide: true
        });

        proc.on('exit', (code, signal) => {
          log(`⚠️ ${cam.name} ended (exit ${code}). Auto-restarting in 2s...`);
          resolve();
        });

        proc.on('error', (err) => {
          log(`⚠️ ${cam.name} error: ${err.message}. Retrying in 3s...`);
          resolve();
        });
      });

    } catch (e) {
      log(`Worker error for ${cam.name}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}

// Start supervising all cameras in parallel
CAMERAS.forEach(cam => superviseCamera(cam));

// Heartbeat to ensure supervisor process never terminates
setInterval(() => {}, 60000);
