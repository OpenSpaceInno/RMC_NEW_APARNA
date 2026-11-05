# 🎬 HLS Proxy Setup Guide - Browser Playback

## What is HLS Proxy?

Browsers cannot play RTSP streams directly. An HLS proxy converts RTSP to HLS (HTTP Live Streaming) format that browsers can play.

**MediaMTX** is a lightweight, easy-to-use RTSP-to-HLS converter.

---

## Quick Setup (5 minutes)

### Option 1: Automated Setup (Recommended)

#### Step 1: Run Setup Script
```powershell
.\setup-hls-proxy.ps1
```

This will:
- ✅ Download MediaMTX automatically
- ✅ Configure it with your camera settings
- ✅ Start the HLS proxy server

#### Step 2: Verify It's Running
Open in browser: http://localhost:8888

You should see MediaMTX web interface.

#### Step 3: Test Stream
Open: http://localhost:8888/test/index.m3u8

This plays a test video (Big Buck Bunny) to verify HLS is working.

---

### Option 2: Manual Setup

#### Step 1: Download MediaMTX
1. Go to: https://github.com/bluenviron/mediamtx/releases
2. Download: `mediamtx_v1.5.0_windows_amd64.zip`
3. Extract to project folder

#### Step 2: Start MediaMTX
```powershell
.\mediamtx.exe mediamtx.yml
```

---

## Configure Cameras in Application

### Step 1: Open Device Configuration
Visit: http://localhost:8080/device-config

### Step 2: Select Camera
Click on "Gate Entry - ANPR"

### Step 3: Go to RTSP Tab
Click the "RTSP" tab

### Step 4: Configure HLS Proxy URL
Add this to the "HLS Proxy URL" field:
```
http://localhost:8888/cam1/index.m3u8
```

### Step 5: Save Settings
Click "Save RTSP Settings"

### Step 6: Repeat for Camera 2
- Select "Gate Entry - Side View"
- HLS Proxy URL: `http://localhost:8888/cam2/index.m3u8`
- Save

---

## View Live Streams

### Step 1: Open Gate Monitor
Visit: http://localhost:8080/gate-monitor

### Step 2: See Live Feeds
You should now see live video playing in both camera feeds!

---

## Stream URLs

### Camera 1 (Gate Entry - ANPR)
- **RTSP**: `rtsp://192.168.0.168:554/rtsp/streaming?channel=01&subtype=0`
- **HLS**: `http://localhost:8888/cam1/index.m3u8`

### Camera 2 (Gate Entry - Side View)
- **RTSP**: `rtsp://192.168.0.169:554/rtsp/streaming?channel=01&subtype=0`
- **HLS**: `http://localhost:8888/cam2/index.m3u8`

### Test Stream (No Camera Required)
- **RTSP**: `rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4`
- **HLS**: `http://localhost:8888/test/index.m3u8`

---

## Testing Without Real Cameras

If you don't have physical cameras yet, use the test stream:

### Step 1: Configure Test Stream
1. Go to Device Config
2. Select any camera
3. RTSP Tab
4. Direct URL: `rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4`
5. HLS Proxy URL: `http://localhost:8888/test/index.m3u8`
6. Save

### Step 2: View in Gate Monitor
You'll see the Big Buck Bunny test video playing!

---

## Troubleshooting

### MediaMTX won't start
**Check if ports are in use:**
```powershell
netstat -ano | findstr "8888"
netstat -ano | findstr "8554"
```

**Solution**: Change ports in `mediamtx.yml`

### Stream shows "Loading..." forever
**Possible causes:**
1. Camera RTSP URL is incorrect
2. Camera is offline
3. Network connectivity issue
4. MediaMTX not running

**Solutions:**
1. Test RTSP URL in VLC first
2. Check camera is powered on and connected
3. Verify camera IP address
4. Restart MediaMTX

### "Failed to load HLS stream" error
**Solutions:**
1. Check MediaMTX is running
2. Verify HLS URL is correct
3. Check browser console for errors
4. Try opening HLS URL directly in browser

### Video is choppy or laggy
**Solutions:**
1. Reduce camera bitrate
2. Use sub-stream instead of main stream
3. Check network bandwidth
4. Adjust MediaMTX settings:
   ```yaml
   hlsSegmentDuration: 2s  # Increase for stability
   hlsPartDuration: 500ms  # Increase for stability
   ```

---

## MediaMTX Configuration

### Current Settings (mediamtx.yml)

```yaml
# HLS Server
hlsAddress: :8888
hlsVariant: lowLatency
hlsSegmentDuration: 1s
hlsPartDuration: 200ms

# Camera Paths
paths:
  cam1:
    source: rtsp://admin:@192.168.0.168:554/rtsp/streaming?channel=01&subtype=0
  cam2:
    source: rtsp://admin:@192.168.0.169:554/rtsp/streaming?channel=01&subtype=0
```

### Customize for Your Cameras

Edit `mediamtx.yml` and update:
- Camera IP addresses
- RTSP paths
- Username/password
- Port numbers

---

## Advanced Features

### WebRTC (Ultra-Low Latency)
MediaMTX also supports WebRTC for even lower latency:
- WebRTC Server: `http://localhost:8889`
- Latency: < 500ms (vs HLS ~2-3 seconds)

### API Access
MediaMTX provides REST API:
- API Endpoint: `http://localhost:9997`
- Get stream list: `GET /v3/paths/list`
- Get stream info: `GET /v3/paths/get/cam1`

### Metrics
View real-time metrics:
- Metrics: `http://localhost:9998/metrics`
- Shows bandwidth, connections, errors

---

## Running in Production

### As Windows Service

1. Download NSSM: https://nssm.cc/download
2. Install MediaMTX as service:
   ```powershell
   nssm install MediaMTX "C:\path\to\mediamtx.exe" "C:\path\to\mediamtx.yml"
   nssm start MediaMTX
   ```

### Auto-start on Boot
MediaMTX service will start automatically with Windows.

---

## Performance Tips

### For Low Latency:
```yaml
hlsVariant: lowLatency
hlsSegmentDuration: 1s
hlsPartDuration: 200ms
```

### For Stability:
```yaml
hlsVariant: standard
hlsSegmentDuration: 3s
hlsSegmentCount: 10
```

### For Multiple Viewers:
```yaml
hlsAlwaysRemux: yes  # Pre-generate HLS segments
```

---

## Architecture

```
Camera (RTSP)
    ↓
MediaMTX (Converter)
    ↓
HLS Stream (HTTP)
    ↓
Browser (Video Player)
```

---

## Summary

✅ **MediaMTX**: Converts RTSP to HLS
✅ **HLS**: Browser-compatible streaming format
✅ **Low Latency**: 1-3 second delay
✅ **Easy Setup**: One command to start
✅ **Multiple Streams**: Support unlimited cameras
✅ **Cross-Platform**: Works on Windows, Mac, Linux

---

## Next Steps

1. ✅ Run `.\setup-hls-proxy.ps1`
2. ✅ Configure HLS URLs in Device Config
3. ✅ View live streams in Gate Monitor
4. ✅ Enjoy browser-based camera viewing!

---

**Estimated Time**: 5 minutes
**Difficulty**: Easy
**Requirements**: None (script downloads everything)
