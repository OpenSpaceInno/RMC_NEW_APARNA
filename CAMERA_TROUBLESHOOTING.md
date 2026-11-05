# 🔧 Camera Connection Troubleshooting

## Current Setup Status

✅ **Frontend**: Running on http://localhost:8080
✅ **Backend API**: Running on http://localhost:3001  
✅ **MediaMTX HLS Proxy**: Running on http://localhost:8888
✅ **MySQL Database**: Connected with camera configs

## Your Camera Details

- **IP Address**: 192.168.0.168
- **RTSP Port**: 554
- **Username**: admin
- **Password**: (empty or needs to be set)
- **RTSP URL**: `rtsp://admin:@192.168.0.168:554/rtsp/streaming?channel=01&subtype=0`
- **HLS URL**: `http://localhost:8888/cam1/index.m3u8`

---

## 🔍 Diagnostic Steps

### Step 1: Test Camera Network Connection

Open PowerShell and run:
```powershell
Test-Connection -ComputerName 192.168.0.168 -Count 4
```

**Expected**: Should show replies with response times
**If fails**: Camera is not reachable on network
- Check camera is powered on
- Verify IP address is correct
- Check you're on same network as camera

---

### Step 2: Test RTSP Stream in VLC (CRITICAL TEST)

This is the most important test! If VLC can't play it, the browser won't either.

1. **Open VLC Media Player**
2. **Go to**: Media → Open Network Stream
3. **Paste this URL**:
   ```
   rtsp://admin:@192.168.0.168:554/rtsp/streaming?channel=01&subtype=0
   ```
4. **Click Play**

**If VLC shows video**: ✅ Camera RTSP is working! Browser should work too.
**If VLC shows error**: ❌ Camera RTSP has issues. See fixes below.

---

### Step 3: Check Camera Password

Your RTSP URL has empty password: `admin:@192.168.0.168`

If camera requires password, update the URL:
```
rtsp://admin:YOUR_PASSWORD@192.168.0.168:554/rtsp/streaming?channel=01&subtype=0
```

Common default passwords:
- (empty)
- admin
- 12345
- password
- Check camera manual/sticker

---

### Step 4: Verify RTSP Path

Different camera brands use different RTSP paths:

**Your current path**: `/rtsp/streaming?channel=01&subtype=0`

**Common alternatives**:
- Hikvision: `/Streaming/Channels/101`
- Dahua: `/cam/realmonitor?channel=1&subtype=0`
- Generic: `/stream1` or `/live` or `/h264`

Check your camera's manual or web interface for correct RTSP path.

---

### Step 5: Check MediaMTX Logs

MediaMTX will show connection attempts. Check for errors:

```powershell
# In PowerShell, MediaMTX logs will show:
# - Connection attempts to camera
# - Authentication errors
# - Network timeouts
# - Stream format issues
```

Look for messages like:
- ✅ `stream ready` = Camera connected successfully
- ❌ `authentication failed` = Wrong username/password
- ❌ `connection timeout` = Camera not reachable
- ❌ `no route to host` = Network issue

---

## 🔧 Common Fixes

### Fix 1: Camera Requires Password

Update `mediamtx.yml`:
```yaml
paths:
  cam1:
    source: rtsp://admin:YOUR_PASSWORD@192.168.0.168:554/rtsp/streaming?channel=01&subtype=0
```

Then restart MediaMTX.

---

### Fix 2: Wrong RTSP Path

Try these alternative paths in `mediamtx.yml`:

```yaml
# Option 1: Hikvision style
source: rtsp://admin:@192.168.0.168:554/Streaming/Channels/101

# Option 2: Dahua style  
source: rtsp://admin:@192.168.0.168:554/cam/realmonitor?channel=1&subtype=0

# Option 3: Generic
source: rtsp://admin:@192.168.0.168:554/stream1
```

---

### Fix 3: Camera Firewall Blocking

Some cameras have firewall settings. Check camera web interface:
- Enable RTSP protocol
- Allow connections from your PC's IP
- Disable authentication (for testing)

---

### Fix 4: Use Sub-Stream Instead of Main Stream

Main stream might be too high quality. Try sub-stream:

```yaml
# Change subtype=0 (main) to subtype=1 (sub)
source: rtsp://admin:@192.168.0.168:554/rtsp/streaming?channel=01&subtype=1
```

---

## 🧪 Quick Test Commands

### Test 1: Ping Camera
```powershell
ping 192.168.0.168
```

### Test 2: Check RTSP Port
```powershell
Test-NetConnection -ComputerName 192.168.0.168 -Port 554
```

### Test 3: Open Gate Monitor
```powershell
Start-Process "http://localhost:8080/gate-monitor"
```

### Test 4: Open HLS Test Page
```powershell
Start-Process "http://localhost:8080/test-hls.html"
```

---

## 📋 What to Check on Camera

Access camera's web interface (usually `http://192.168.0.168`):

1. **Network Settings**
   - Verify IP is 192.168.0.168
   - Check RTSP port is 554

2. **RTSP Settings**
   - Enable RTSP protocol
   - Check authentication settings
   - Note the correct RTSP path

3. **Stream Settings**
   - Enable main stream (channel 01)
   - Enable sub stream if available
   - Check encoding is H.264 (not H.265)

4. **User Settings**
   - Verify username is "admin"
   - Check if password is required
   - Ensure user has streaming permissions

---

## 🎯 Expected Behavior

### When Everything Works:

1. **VLC**: Shows live video immediately
2. **MediaMTX Logs**: Shows "stream ready" message
3. **Gate Monitor**: Shows live video in browser
4. **HLS URL**: `http://localhost:8888/cam1/index.m3u8` plays in browser

### Current Status:

MediaMTX is running and waiting for stream requests. When you open Gate Monitor:
1. Browser requests HLS stream
2. MediaMTX connects to camera RTSP
3. MediaMTX converts RTSP → HLS
4. Browser plays HLS stream

---

## 🆘 Still Not Working?

### Collect This Information:

1. **VLC Test Result**: Does VLC play the RTSP stream?
2. **Camera Brand/Model**: What camera do you have?
3. **MediaMTX Logs**: Any error messages?
4. **Browser Console**: Any errors in browser console (F12)?

### Alternative: Use Test Stream

While troubleshooting, use the test stream to verify the system works:

In `mediamtx.yml`, temporarily use:
```yaml
paths:
  cam1:
    source: rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4
```

This will show a test video (Big Buck Bunny) to confirm the HLS pipeline works.

---

## 📞 Next Steps

1. ✅ Test RTSP URL in VLC first
2. ✅ If VLC works, check MediaMTX logs when accessing Gate Monitor
3. ✅ If VLC fails, check camera settings and RTSP path
4. ✅ Update `mediamtx.yml` with correct credentials/path
5. ✅ Restart MediaMTX after changes

---

**The key is**: If VLC can play it, the browser can play it through MediaMTX!
