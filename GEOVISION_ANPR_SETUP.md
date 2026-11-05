# 🎯 GeoVision GV-DNC564-MV ANPR Setup Guide

## Your Camera: GeoVision GV-DNC564-MV

This is a professional ANPR camera with built-in license plate recognition!

---

## 📋 Quick Setup Steps

### Step 1: Access Camera Web Interface

1. Open browser: `http://192.168.0.168`
2. Login:
   - Username: `admin`
   - Password: (your camera password)

### Step 2: Enable LPR (License Plate Recognition)

1. Go to: **Configuration** → **Event** → **LPR**
2. Enable: **LPR Detection**
3. Configure detection zone (draw area where plates will be detected)
4. Set confidence threshold: **70%** or higher
5. Click **Save**

### Step 3: Configure HTTP Notification

1. Go to: **Configuration** → **Network** → **Advanced Settings**
2. Find: **HTTP Notification** or **Event Server**
3. Enable HTTP Notification
4. Configure:
   ```
   Server Address: YOUR_SERVER_IP
   Port: 3001
   Path: /api/anpr/webhook/cam_gate_1
   Method: POST
   ```

**Important:** Replace `YOUR_SERVER_IP` with:
- Same computer: `127.0.0.1` or `localhost`
- Different computer: Your server's IP (e.g., `192.168.0.100`)

### Step 4: Select LPR Event

1. In HTTP Notification settings
2. Select events to send: **LPR Detection** or **License Plate**
3. Enable: **Send snapshot**
4. Click **Save**

### Step 5: Test Detection

1. Drive a vehicle in front of camera
2. Check backend logs for:
   ```
   📥 Received ANPR webhook from camera: cam_gate_1
   ✅ Plate extracted: KA05AB1234
   ```
3. Check Gate Monitor - plate should appear!

---

## 🔧 GeoVision Webhook Format

GeoVision cameras typically send data in this format:

```json
{
  "EventType": "LPR",
  "PlateNumber": "KA05AB1234",
  "Confidence": 95,
  "CaptureTime": "2026-02-06T21:00:00",
  "ImagePath": "http://192.168.0.168/snapshot.jpg",
  "VehicleType": "Car",
  "Direction": "Entry"
}
```

Our webhook endpoint will automatically parse this format!

---

## 📱 Alternative: GeoVision Event Server

If HTTP Notification is not available, use Event Server:

1. Go to: **Configuration** → **Event** → **Event Server**
2. Enable: **Event Server**
3. Configure:
   ```
   Server Type: HTTP
   Server Address: http://YOUR_SERVER_IP:3001/api/anpr/webhook/cam_gate_1
   Protocol: HTTP POST
   ```
4. Select: **LPR Event**
5. Save and test

---

## 🎯 Optimal Camera Settings for ANPR

### Image Settings:
- **Resolution**: 1920x1080 or higher
- **Frame Rate**: 15-30 FPS
- **Shutter Speed**: 1/1000 or faster (to avoid motion blur)
- **WDR**: Enable (for varying light conditions)

### LPR Settings:
- **Detection Zone**: Draw box around license plate area
- **Plate Size**: Min 80 pixels width
- **Confidence Threshold**: 70-80%
- **Country**: India (or your region)

### Lighting:
- **IR Illuminator**: Enable for night detection
- **Backlight Compensation**: Enable if needed
- **Exposure**: Auto or manual (avoid overexposure)

---

## 🧪 Test Webhook Manually

Test if your server can receive webhooks:

```powershell
# Simulate GeoVision webhook
$body = @{
    EventType = "LPR"
    PlateNumber = "KA05AB1234"
    Confidence = 95
    CaptureTime = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    ImagePath = "http://192.168.0.168/snapshot.jpg"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/anpr/webhook/cam_gate_1" -Method Post -Body $body -ContentType "application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "event_id": "evt_ANPR_1707251234567_abc123",
  "plate": "KA05AB1234",
  "message": "ANPR event received and stored"
}
```

---

## 📊 Verify Setup

### Check 1: Camera Detecting Plates?

1. Go to camera web interface
2. Check: **Event** → **Event Log**
3. Look for LPR events
4. Should show detected plates

### Check 2: Webhook Sending?

1. Check camera: **Network** → **HTTP Notification** → **Test**
2. Should show "Success" or "Connected"

### Check 3: Backend Receiving?

Check backend terminal for:
```
📥 Received ANPR webhook from camera: cam_gate_1
Webhook payload: { "EventType": "LPR", "PlateNumber": "KA05AB1234", ... }
✅ Plate extracted: KA05AB1234 (confidence: 0.95)
✅ ANPR event created: evt_ANPR_1707251234567_abc123
```

### Check 4: Database Storing?

```sql
SELECT * FROM anpr_events ORDER BY timestamp DESC LIMIT 5;
```

Should show recent detections.

### Check 5: Frontend Displaying?

1. Open: http://localhost:8080/gate-monitor
2. Should show detected plates in textbox
3. Check browser console (F12) for updates

---

## 🔍 Troubleshooting

### Camera Not Detecting Plates?

**Issue**: No LPR events in camera logs

**Solutions:**
1. Check detection zone is configured
2. Ensure vehicle is in detection zone
3. Verify plate is clearly visible
4. Check lighting conditions
5. Adjust confidence threshold (lower to 60%)

### Webhook Not Sending?

**Issue**: Camera detects but doesn't send webhook

**Solutions:**
1. Verify HTTP Notification is enabled
2. Check server address and port are correct
3. Test connection from camera interface
4. Check firewall isn't blocking port 3001
5. Try using IP address instead of hostname

### Backend Not Receiving?

**Issue**: Camera sends but backend doesn't log

**Solutions:**
1. Check backend is running: `http://localhost:3001/api/health`
2. Verify webhook URL is correct
3. Check backend logs for errors
4. Test webhook manually with PowerShell

### Plate Not Showing in Frontend?

**Issue**: Backend receives but frontend doesn't show

**Solutions:**
1. Check database: `SELECT * FROM anpr_events`
2. Refresh Gate Monitor page
3. Check browser console for errors
4. Verify frontend is polling for events

---

## 📸 Camera Positioning Tips

For best ANPR accuracy:

### Distance:
- **Optimal**: 3-5 meters from vehicle
- **Min**: 2 meters
- **Max**: 8 meters

### Angle:
- **Horizontal**: 0-30° (straight on is best)
- **Vertical**: 10-20° (slightly downward)

### Height:
- **Optimal**: 1.5-2 meters above ground
- Aim at license plate level

### Lighting:
- **Day**: Natural light is fine
- **Night**: Enable IR illuminator
- **Avoid**: Direct sunlight on plate

---

## 🎬 Expected Workflow

```
1. Vehicle enters camera view
   ↓
2. Camera detects license plate (built-in LPR)
   ↓
3. Camera sends HTTP POST to:
   http://YOUR_SERVER:3001/api/anpr/webhook/cam_gate_1
   ↓
4. Backend receives webhook
   ↓
5. Plate extracted and saved to database
   ↓
6. Frontend polls database every 5 seconds
   ↓
7. Plate appears in Gate Monitor textbox
   ↓
8. Operator sees plate and takes action
```

---

## ✅ Success Checklist

- [ ] Camera web interface accessible
- [ ] LPR feature enabled
- [ ] Detection zone configured
- [ ] HTTP Notification enabled
- [ ] Webhook URL configured correctly
- [ ] Test connection successful
- [ ] Vehicle detected in camera logs
- [ ] Webhook received in backend logs
- [ ] Event saved in database
- [ ] Plate displayed in Gate Monitor

---

## 📞 GeoVision Support Resources

- **Manual**: Check camera documentation for LPR setup
- **Support**: GeoVision technical support
- **Firmware**: Ensure camera has latest firmware

---

## 🎯 Next Steps

1. ✅ Login to camera: `http://192.168.0.168`
2. ✅ Enable LPR Detection
3. ✅ Configure HTTP Notification
4. ✅ Set webhook URL: `http://YOUR_SERVER_IP:3001/api/anpr/webhook/cam_gate_1`
5. ✅ Test with vehicle
6. ✅ Check backend logs
7. ✅ See plate in Gate Monitor!

---

**Your GeoVision camera's built-in ANPR is ready to use - just configure the webhook!**
