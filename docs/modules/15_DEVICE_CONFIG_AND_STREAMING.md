# Module 15: Device Configuration & Media Streaming Architecture
## Engineering & Enhancement Blueprint

---

### Document Information
- **Module ID:** `MOD-15-DEVICES-MEDIA`
- **Module Name:** Hardware Device Configuration, RTSP Video Proxy & Network Diagnostics
- **Primary Routes:** `/device-config`
- **Core Files:**
  - [`src/pages/DeviceConfig.tsx`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/pages/DeviceConfig.tsx)
  - [`src/components/device/RTSPConfigPanel.tsx`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/components/device/RTSPConfigPanel.tsx)
  - [`src/components/device/NetworkConfigPanel.tsx`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/components/device/NetworkConfigPanel.tsx)
  - [`src/components/device/ANPRConfigPanel.tsx`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/components/device/ANPRConfigPanel.tsx)
  - [`src/components/device/LiveStreamViewer.tsx`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/components/device/LiveStreamViewer.tsx)
  - [`server/camera-stream-service.js`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/server/camera-stream-service.js)
  - [`mediamtx.yml`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/mediamtx.yml)
- **Database Tables:** `camera_devices`, `device_rtsp_config`, `device_network_config`, `anpr_config`

---

## 1. Module Overview & Business Scope

The **Device Configuration & Media Streaming Module** provides plant IT engineers and system integrators with administrative control over the physical camera hardware, networking parameters, optical OCR sensitivity, and video streaming proxies operating across the industrial plant LAN.

Because industrial IP cameras transmit video streams using raw Real-Time Streaming Protocol (RTSP) over TCP port 554, and modern Chromium browsers cannot natively render RTSP, the built-in **MediaMTX media server** acts as a high-performance, low-latency transmuxer.

### Core Business Objectives:
1. **Camera Discovery & Provisioning:** Adding, configuring, and testing industrial IP surveillance cameras (GeoVision, Hikvision, Dahua).
2. **Sub-Second Video Proxying:** Transmuxing RTSP inputs into browser-compatible HLS (`index.m3u8` over port 8888) and WebRTC (port 8889).
3. **Hardware Network Probing:** Dynamic multi-port TCP socket diagnostics probing port 554 (RTSP), port 80 (HTTP Web Admin), and port 8000 (Camera SDK) with latency measurement.
4. **OCR Lane Calibration:** Setting detection confidence thresholds and optical scan intervals per camera angle.

```mermaid
graph TD
    CAM_HW["Physical IP Camera (e.g. 192.168.0.101)"] -->|RTSP Stream :554| MMTX["MediaMTX Native Server (:8554 RTSP)"]
    
    subgraph MediaMTX_Transmuxing["MediaMTX Transmuxer (mediamtx.yml)"]
        MMTX -->|HLS Transmux| HLS_PORT["HLS Stream Server (:8888)"]
        MMTX -->|WebRTC Transmux| WEBRTC_PORT["WebRTC Server (:8889)"]
        MMTX -->|Management API| API_PORT["MediaMTX API (:9997)"]
    end

    subgraph Node_Backend["Node.js Camera Stream Service (camera-stream-service.js)"]
        PROBE["checkTcpPort() Diagnostic Prober"]
        PROC["ensureMediaServerRunning() Child Process"]
    end

    CAM_HW -.->|TCP Socket Probe| PROBE
    PROC -.->|Spawn / Monitor| MMTX

    HLS_PORT -->|HTTP Live Stream| BROWSER["Browser Client (video.js / Hls.js)"]
    WEBRTC_PORT -->|Sub-200ms Interactive| BROWSER
```

---

## 2. Component Architecture & UI Wireframe

### Component Hierarchy
```
src/pages/DeviceConfig.tsx
├── useDeviceConfig (src/hooks/useDeviceConfig.ts)
├── Device List Panel (Active cameras, IP addresses, online/offline status, model)
├── Tab Panels for Selected Camera:
│   ├── RTSPConfigPanel.tsx (RTSP URL, credentials, stream path, transport: TCP/UDP, low-latency mode)
│   ├── NetworkConfigPanel.tsx (IP address, subnet mask, gateway, primary/secondary DNS, DHCP toggle)
│   ├── VideoConfigPanel.tsx (Resolution 1080p/4K, frame rate 25fps, bitrate, codec H.264/H.265)
│   ├── ANPRConfigPanel.tsx (OCR min confidence %, auto-confirm threshold, capture interval ms)
│   └── WebhookConfigPanel.tsx (Push webhook URL, test event trigger)
│
└── LiveStreamViewer.tsx (Embedded real-time video player with diagnostic overlay)
```

---

## 3. Backend Services & Media Server Configuration

### 1. Media Server Manager (`server/camera-stream-service.js`)
- Automatically verifies if `mediamtx.exe` is listening on port 8888.
- If not running, spawns `mediamtx.exe` detached with `mediamtx.yml` configuration:
```yaml
paths:
  cam_gate_1:
    source: rtsp://admin:admin123@192.168.0.101:554/live/ch0
    sourceOnDemand: no
  cam_exit_1:
    source: rtsp://admin:admin123@192.168.0.102:554/live/ch0
    sourceOnDemand: no
  cam_scale_1:
    source: rtsp://admin:admin123@192.168.0.103:554/live/ch0
    sourceOnDemand: no
```

### 2. Multi-Port Diagnostic Prober
The backend probes camera network responsiveness across 3 critical ports simultaneously:
- Port 554: RTSP video streaming port.
- Port 80: HTTP camera web management interface.
- Port 8000: Proprietary camera SDK control port.

---

## 4. API Contracts & Telemetry Specifications

### `GET /api/cameras/diagnostic/:ip`
- **Response (200 OK):**
```json
{
  "ip": "192.168.0.101",
  "reachable": true,
  "ports": {
    "554": true,
    "80": true,
    "8000": false
  },
  "status": "online",
  "message": "Camera at 192.168.0.101 is responsive on network (RTSP & HTTP active)"
}
```

---

## 5. Database Schema & Data Dictionary

### Table: `camera_devices`
```sql
CREATE TABLE IF NOT EXISTS camera_devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(128) NOT NULL,
  model VARCHAR(128),
  location VARCHAR(128),
  ip_address VARCHAR(45) NOT NULL,
  mac_address VARCHAR(45),
  status VARCHAR(32) DEFAULT 'online', -- 'online' | 'offline' | 'error'
  firmware VARCHAR(64),
  show_on_dashboard TINYINT(1) DEFAULT 1,
  last_seen DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Table: `device_rtsp_config`
```sql
CREATE TABLE IF NOT EXISTS device_rtsp_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(64) UNIQUE NOT NULL,
  enabled TINYINT(1) DEFAULT 1,
  url TEXT NOT NULL,
  port INT DEFAULT 554,
  username VARCHAR(64),
  password VARCHAR(64),
  stream_path VARCHAR(128) DEFAULT 'live/ch0',
  transport VARCHAR(32) DEFAULT 'tcp', -- 'tcp' | 'udp'
  hls_proxy_url TEXT,
  low_latency_mode TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 6. Business Logic & Resiliency Fallbacks

1. **Procedural Canvas Fallback:**
   If a physical camera goes offline or `mediamtx.exe` is absent, the frontend automatically switches from `<video>` to an animated `<canvas>` rendering high-fidelity simulated plant CCTV footage with live ticking timecodes and optical scanlines, ensuring operations are never blocked.

---

## 7. Current Implementation vs Production Reality (Gaps)

| Feature | Current State | Production Reality Gap | Solution / Action Item |
| :--- | :--- | :--- | :--- |
| **MediaMTX Linux Daemon** | Windows `.exe` path. | Production server runs Ubuntu Server with systemd daemon management. | Create `mediamtx.service` systemd service unit file with auto-restart on failure. |
| **ONVIF PTZ Auto-Tracking** | Static RTSP URL. | PTZ cameras at the gate can zoom onto license plates automatically. | Implement `node-onvif` library to send PTZ optical zoom and focus commands. |

---

## 8. Future Enhancement Blueprint & Extension Hooks

1. **Dual-Stream Network Optimization:**
   - Ingest 4K High-Res Main Stream for OCR plate recognition, and 720p Sub-Stream for browser grid monitoring to save LAN bandwidth.
2. **Camera Tampering / Lens Occlusion Alert:**
   - Detect if camera view is spray-painted or blocked by cement dust.

---

## 9. Developer "How-To" Playbook: Step-by-Step Feature Extension

### Scenario: Adding ONVIF Profile S Auto-Discovery for New Plant Cameras

#### Step 1: Install Dependency
In `server/`:
```bash
npm install node-onvif
```

#### Step 2: Add Discovery Route in `server/routes/cameras.js`
Broadcast WS-Discovery UDP probe on port 3702 to find connected IP cameras on the local subnet.

#### Step 3: UI Trigger Button
In `src/pages/DeviceConfig.tsx`, add `[Scan Network for Cameras]` button.

