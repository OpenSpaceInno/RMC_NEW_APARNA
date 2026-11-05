# RTSP Live Camera Integration Guide

## Overview

This application now supports live camera streaming via RTSP (Real-Time Streaming Protocol) with persistent configuration storage in the database.

## Features

✅ **Database-Persisted Configurations**: All RTSP settings are saved to Supabase and persist between sessions
✅ **Direct RTSP URL Support**: Enter complete RTSP URLs or build them from components
✅ **HLS Proxy Integration**: Configure HLS proxy for browser-based playback
✅ **External Player Support**: Copy RTSP URLs for use in VLC, FFplay, or other players
✅ **Multiple Transport Protocols**: Support for TCP (reliable) and UDP (low latency)
✅ **Authentication**: Username/password authentication for secure streams
✅ **Performance Tuning**: Configurable buffer size, latency mode, and reconnection intervals

## Database Schema

The following tables store device configurations:

- `camera_devices` - Device information (name, IP, status, location)
- `device_rtsp_config` - RTSP streaming settings
- `device_network_config` - Network configuration
- `device_video_config` - Video encoding settings
- `device_image_config` - Image quality settings
- `device_anpr_config` - License plate recognition settings
- `device_webhook_config` - Event notification webhooks

## RTSP Configuration

### Direct URL Mode

Enter the complete RTSP URL from your camera:

```
rtsp://192.168.0.168:554/rtsp/streaming?channel=01&subtype=0
```

With authentication:
```
rtsp://admin:password@192.168.0.168:554/rtsp/streaming?channel=01&subtype=0
```

### Manual Configuration Mode

Build the URL from components:
- **Port**: Default 554
- **Stream Path**: Camera-specific path (e.g., `/rtsp/streaming?channel=01&subtype=0`)
- **Username/Password**: Authentication credentials
- **Transport**: TCP (reliable) or UDP (low latency)

## Browser Playback with HLS Proxy

Browsers cannot play RTSP streams directly. You need an RTSP-to-HLS converter:

### Option 1: MediaMTX (Recommended)

[MediaMTX](https://github.com/bluenviron/mediamtx) is a lightweight RTSP/HLS server.

**Installation:**
```bash
# Download latest release
wget https://github.com/bluenviron/mediamtx/releases/download/v1.5.0/mediamtx_v1.5.0_linux_amd64.tar.gz
tar -xzf mediamtx_v1.5.0_linux_amd64.tar.gz

# Run MediaMTX
./mediamtx
```

**Configuration (mediamtx.yml):**
```yaml
paths:
  cam1:
    source: rtsp://192.168.0.168:554/rtsp/streaming?channel=01&subtype=0
    sourceProtocol: tcp
```

**HLS URL:**
```
http://localhost:8888/cam1/index.m3u8
```

### Option 2: go2rtc

[go2rtc](https://github.com/AlexxIT/go2rtc) supports multiple protocols.

**Docker:**
```bash
docker run -p 1984:1984 -p 8554:8554 alexxit/go2rtc
```

**Configuration:**
```yaml
streams:
  cam1: rtsp://admin:password@192.168.0.168:554/rtsp/streaming?channel=01&subtype=0
```

**HLS URL:**
```
http://localhost:1984/api/stream.m3u8?src=cam1
```

### Option 3: nginx-rtmp

Traditional RTMP/HLS server with FFmpeg.

**nginx.conf:**
```nginx
rtmp {
    server {
        listen 1935;
        application live {
            live on;
            hls on;
            hls_path /tmp/hls;
        }
    }
}

http {
    server {
        listen 8080;
        location /hls {
            types {
                application/vnd.apple.mpegurl m3u8;
            }
            root /tmp;
            add_header Cache-Control no-cache;
            add_header Access-Control-Allow-Origin *;
        }
    }
}
```

**FFmpeg command to push RTSP to RTMP:**
```bash
ffmpeg -i rtsp://192.168.0.168:554/rtsp/streaming?channel=01&subtype=0 \
  -c:v copy -c:a copy -f flv rtmp://localhost/live/cam1
```

**HLS URL:**
```
http://localhost:8080/hls/cam1.m3u8
```

## Usage in Application

1. **Navigate to Device Configuration** page
2. **Select a camera** from the device list
3. **Go to RTSP tab**
4. **Configure RTSP settings:**
   - Enable RTSP streaming
   - Choose Direct URL or Manual Config mode
   - Enter RTSP URL or build from components
   - Add authentication if required
   - (Optional) Enter HLS Proxy URL for browser playback
5. **Click "Save RTSP Settings"** - Configuration is saved to database
6. **Test the stream** using the "Test Stream" button
7. **View live feed** in the Live Stream Preview panel

## External Player Usage

### VLC Media Player

1. Copy the RTSP URL from the configuration panel
2. Open VLC → Media → Open Network Stream
3. Paste the RTSP URL
4. Click Play

Or use the "Open in VLC" button in the app.

### FFplay (FFmpeg)

```bash
ffplay -rtsp_transport tcp "rtsp://admin:password@192.168.0.168:554/rtsp/streaming?channel=01&subtype=0"
```

### OBS Studio

1. Add Source → Media Source
2. Uncheck "Local File"
3. Enter RTSP URL in "Input"
4. Configure buffering and network settings

## Common RTSP URLs by Camera Brand

### Hikvision
```
rtsp://admin:password@IP:554/Streaming/Channels/101
```

### Dahua
```
rtsp://admin:password@IP:554/cam/realmonitor?channel=1&subtype=0
```

### Axis
```
rtsp://admin:password@IP:554/axis-media/media.amp
```

### Geovision (GV-DNC564-MV)
```
rtsp://admin:password@IP:554/rtsp/streaming?channel=01&subtype=0
```

### Uniview
```
rtsp://admin:password@IP:554/media/video1
```

## Troubleshooting

### Stream Not Loading

1. **Check camera is online**: Verify IP address is reachable
2. **Verify RTSP URL**: Test in VLC first
3. **Check authentication**: Ensure username/password are correct
4. **Try different transport**: Switch between TCP and UDP
5. **Check firewall**: Ensure port 554 is open

### Browser Playback Issues

1. **HLS proxy not configured**: Enter HLS proxy URL in settings
2. **HLS proxy not running**: Start MediaMTX or go2rtc
3. **CORS issues**: Ensure HLS server allows cross-origin requests
4. **Browser compatibility**: Safari has native HLS support, others may need hls.js

### High Latency

1. Enable "Low Latency Mode" in RTSP settings
2. Reduce buffer size (512-1024 KB)
3. Use UDP transport instead of TCP
4. Configure HLS proxy with lower segment duration

### Connection Drops

1. Increase reconnect interval
2. Use TCP transport for reliability
3. Check network stability
4. Verify camera firmware is up to date

## Performance Optimization

### Low Latency Setup
- Transport: UDP
- Buffer Size: 512 KB
- Low Latency Mode: Enabled
- HLS Segment Duration: 1-2 seconds

### Reliable Connection Setup
- Transport: TCP
- Buffer Size: 2048 KB
- Reconnect Interval: 5 seconds
- Retry on failure

### Bandwidth Optimization
- Use sub-stream instead of main stream
- Reduce frame rate (15 fps)
- Lower bitrate (1024 Kbps)
- Use H.265 compression

## Security Considerations

1. **Use strong passwords** for camera authentication
2. **Isolate camera network** from public internet
3. **Use VPN** for remote access
4. **Enable HTTPS** for HLS proxy
5. **Regularly update** camera firmware
6. **Monitor access logs** for unauthorized attempts

## API Integration

### Save RTSP Configuration

```typescript
const { error } = await supabase
  .from('device_rtsp_config')
  .upsert({
    device_id: 'cam-001',
    enabled: true,
    direct_url: 'rtsp://192.168.0.168:554/rtsp/streaming?channel=01&subtype=0',
    use_direct_url: true,
    port: 554,
    username: 'admin',
    password: 'password',
    stream_path: '/rtsp/streaming?channel=01&subtype=0',
    transport: 'tcp',
    reconnect_interval: 5,
    buffer_size: 1024,
    low_latency_mode: true,
    hls_proxy_url: 'http://localhost:8888/cam1/index.m3u8',
  });
```

### Load RTSP Configuration

```typescript
const { data, error } = await supabase
  .from('device_rtsp_config')
  .select('*')
  .eq('device_id', 'cam-001')
  .single();
```

## Future Enhancements

- [ ] WebRTC support for ultra-low latency
- [ ] hls.js integration for broader browser support
- [ ] Motion detection and event recording
- [ ] Multi-camera grid view
- [ ] PTZ (Pan-Tilt-Zoom) controls
- [ ] Snapshot capture and storage
- [ ] Video recording to cloud storage
- [ ] AI-powered analytics integration

## Support

For issues or questions:
1. Check camera documentation for correct RTSP URL format
2. Test RTSP stream in VLC before configuring in app
3. Verify HLS proxy is running and accessible
4. Check browser console for error messages
5. Review database logs for configuration issues
