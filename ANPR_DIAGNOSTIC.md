# 🔍 ANPR Diagnostic Guide

## Quick Test

### Step 1: Open Gate Monitor
```
http://localhost:8080/gate-monitor
```

### Step 2: Open Browser Console
Press **F12** → Go to **Console** tab

### Step 3: Click "Capture Now" Button
You should see a "Capture Now" button next to the textbox. Click it!

### Step 4: Check Console Output

**Expected Output:**
```
🔘 Manual capture triggered
[cam_gate_1] Capturing frame from live video...
[cam_gate_1] Frame captured (87KB), sending to ANPR API...
[cam_gate_1] ANPR result: {success: true, plates: [...]}
[cam_gate_1] Plate detected: KA05AB1234 (95.3%)
[cam_gate_1] Plate sent to textbox: KA05AB1234
✅ Plate detected and displayed: KA05AB1234 Confidence: 0.953
```

**If you see errors, note them down!**

---

## Common Issues

### Issue 1: "Video not ready for capture"

**Cause**: Video element not playing

**Check:**
```javascript
// In browser console, run:
const video = document.querySelector('video');
console.log({
  paused: video.paused,
  readyState: video.readyState,
  width: video.videoWidth,
  height: video.videoHeight,
  currentTime: video.currentTime
});
```

**Expected:**
- `paused: false`
- `readyState: 4` (HAVE_ENOUGH_DATA)
- `width: 1280` (or similar)
- `height: 720` (or similar)

**Fix:**
- Ensure video is playing
- Check HLS stream is working
- Verify MediaMTX is running

---

### Issue 2: "Failed to capture frame"

**Cause**: Canvas not working

**Check:**
```javascript
// In browser console, run:
const canvas = document.querySelector('canvas');
console.log({
  exists: !!canvas,
  width: canvas?.width,
  height: canvas?.height
});
```

**Fix:**
- Refresh page
- Check browser supports canvas

---

### Issue 3: "Request Failed" or Network Error

**Cause**: Backend not responding

**Check:**
```javascript
// Test backend directly:
fetch('http://localhost:3001/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**Expected:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

**Fix:**
- Check backend is running
- Check port 3001 is not blocked
- Restart backend

---

### Issue 4: No Logs Appearing

**Cause**: ANPR detector not starting

**Check:**
```javascript
// Look for this in console:
// [cam_gate_1] ANPR detection started
```

**If missing:**
- Video might not be ready
- ANPR might be disabled
- Check `enableANPR={true}` in code

---

## Manual Testing Commands

### Test 1: Check Video Element
```javascript
const video = document.querySelector('video');
if (video) {
  console.log('✅ Video found');
  console.log('Playing:', !video.paused);
  console.log('Ready:', video.readyState >= 2);
  console.log('Size:', video.videoWidth + 'x' + video.videoHeight);
} else {
  console.log('❌ No video element found');
}
```

### Test 2: Manual Frame Capture
```javascript
const video = document.querySelector('video');
const canvas = document.createElement('canvas');
canvas.width = 640;
canvas.height = 480;
const ctx = canvas.getContext('2d');
ctx.drawImage(video, 0, 0, 640, 480);
const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
console.log('Frame captured:', Math.round(dataUrl.length / 1024) + 'KB');
```

### Test 3: Test ANPR API
```javascript
// Capture frame and send to API
const video = document.querySelector('video');
const canvas = document.createElement('canvas');
canvas.width = 640;
canvas.height = 480;
const ctx = canvas.getContext('2d');
ctx.drawImage(video, 0, 0, 640, 480);

canvas.toBlob(async (blob) => {
  const formData = new FormData();
  formData.append('image', blob, 'frame.jpg');
  formData.append('camera_id', 'cam_gate_1');
  
  const response = await fetch('http://localhost:3001/api/anpr/detect', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  console.log('ANPR Result:', result);
}, 'image/jpeg', 0.5);
```

---

## System Status Check

### Check 1: Frontend Running?
```
http://localhost:8080
```
Should show the application.

### Check 2: Backend Running?
```
http://localhost:3001/api/health
```
Should return: `{"status":"ok","message":"Server is running"}`

### Check 3: MediaMTX Running?
```
http://localhost:8888
```
Should show MediaMTX interface.

### Check 4: Camera Streaming?
```
http://localhost:8888/cam1/index.m3u8
```
Should start downloading or show video.

---

## Expected Console Logs

### On Page Load:
```
[cam_gate_1] ANPR detection started - capturing frames every 2 seconds
[cam_gate_1] Video element ready: {width: 1280, height: 720, readyState: 4, paused: false}
```

### Every 2 Seconds (Automatic):
```
[cam_gate_1] Capturing frame from live video...
[cam_gate_1] Frame captured (87KB), sending to ANPR API...
[cam_gate_1] ANPR result: {success: true, plates: [...], mock: true}
[cam_gate_1] Plate detected: KA05AB1234 (95.3%)
[cam_gate_1] Plate sent to textbox: KA05AB1234
✅ Plate detected and displayed: KA05AB1234 Confidence: 0.953
```

### On Manual Capture:
```
🔘 Manual capture triggered
[cam_gate_1] Capturing frame from live video...
... (same as above)
```

---

## What to Report

If it's still not working, please provide:

1. **Console Logs**: Copy all logs from console
2. **Video Status**: Result of video element check
3. **Backend Status**: Result of health check
4. **Errors**: Any red errors in console
5. **Network Tab**: Check F12 → Network tab for failed requests

---

## Quick Fix Checklist

- [ ] Backend running on port 3001?
- [ ] Frontend running on port 8080?
- [ ] MediaMTX running on port 8888?
- [ ] Video playing in browser?
- [ ] Console shows "ANPR detection started"?
- [ ] No red errors in console?
- [ ] "Capture Now" button visible?
- [ ] Clicking button triggers logs?

---

## Emergency Reset

If nothing works:

1. **Stop all processes**
2. **Restart backend**: `npm start` in server folder
3. **Restart frontend**: Should auto-reload
4. **Restart MediaMTX**: `.\mediamtx.exe mediamtx.yml`
5. **Clear browser cache**: Ctrl+Shift+Delete
6. **Refresh page**: Ctrl+F5

---

**Use the "Capture Now" button to test immediately!**
