# 📹 Camera Built-in ANPR Setup Guide

## Your Camera Has Built-in ANPR!

Since your camera has built-in license plate recognition, we should use that instead of processing video frames. This is:
- ✅ **Faster** - Camera does the detection
- ✅ **More accurate** - Camera is optimized for ANPR
- ✅ **Less CPU** - No video processing needed
- ✅ **Real-time** - Instant notifications

---

## 🔧 Setup Steps

### Step 1: Find Camera's Web Interface

1. Open browser and go to your camera's IP:
   ```
   http://192.168.0.168
   ```

2. Login with your credentials:
   - Username: `admin`
   - Password: (your camera password)

### Step 2: Enable ANPR/LPR Feature

Look for settings like:
- **ANPR** (Automatic Number Plate Recognition)
- **LPR** (License Plate Recognition)
- **Vehicle Detection**
- **Smart Events**
- **IVS** (Intelligent Video Surveillance)

Enable the ANPR/LPR feature.

### Step 3: Configure Webhook/HTTP Notification

Find the notification or event settings:

**Look for:**
- Event Notification
- HTTP Notification
- Webhook
- Alarm Server
- Event Server

**Configure:**
```
URL: http://YOUR_SERVER_IP:3001/api/anpr/webhook/cam_gate_1
Method: POST
Content-Type: application/json
```

**Replace `YOUR_SERVER_IP` with:**
- If camera and server on same machine: `localhost` or `127.0.0.1`
- If different machines: Your server's IP address (e.g., `192.168.0.100`)

### Step 4: Test the Webhook

Drive a vehicle in front of the camera. The camera should:
1. Detect the license plate
2. Send HTTP POST to your webhook URL
3. You'll see in backend logs:
   ```
   📥 Received ANPR webhook from camera: cam_gate_1
   ✅ Plate extracted: KA05AB1234
   ✅ ANPR event created: evt_ANPR_...
   ```

---

## 📋 Common Camera Webhook Formats

### Format 1: Simple JSON
```json
{
  "plate": "KA05AB1234",
  "confidence": 0.95,
  "timestamp": "2026-02-06T21:00:00Z",
  "image_url": "http://camera/snapshot.jpg"
}
```

### Format 2: Hikvision
```json
{
  "AlarmInfoPlate": {
    "result": {
      "PlateResult": {
        "license": "KA05AB1234",
        "confidence": 95
      }
    }
  }
}
```

### Format 3: Dahua
```json
{
  "data": {
    "plate": "KA05AB1234",
    "confidence": 0.95,
    "vehicleType": "Car"
  }
}
```

**Our webhook endpoint supports all these formats automatically!**

---

## 🧪 Test Webhook Manually

You can test the webhook using PowerShell:

```powershell
$body = @{
    plate = "KA05AB1234"
    confidence = 0.95
    image_url = "http://camera/snapshot.jpg"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/anpr/webhook/cam_gate_1" -Method Post -Body $body -ContentType "application/json"
```

**Expected response:**
```json
{
  "success": true,
  "event_id": "evt_ANPR_1707251234567_abc123",
  "plate": "KA05AB1234",
  "message": "ANPR event received and stored"
}
```

---

## 📊 Check Backend Logs

After configuring the webhook, check backend logs:

```powershell
# Backend should show:
📥 Received ANPR webhook from camera: cam_gate_1
Webhook payload: { "plate": "KA05AB1234", ... }
✅ Plate extracted: KA05AB1234 (confidence: 0.95)
✅ ANPR event created: evt_ANPR_1707251234567_abc123
```

---

## 🔍 Troubleshooting

### Camera Not Sending Webhooks?

**Check 1: Network Connectivity**
```powershell
# From camera, can it reach your server?
ping YOUR_SERVER_IP
```

**Check 2: Firewall**
- Ensure port 3001 is open
- Check Windows Firewall settings

**Check 3: Webhook URL**
- Must be accessible from camera's network
- Use IP address, not `localhost` (unless same machine)

**Check 4: Camera Settings**
- ANPR feature enabled?
- Webhook URL correct?
- HTTP method is POST?

### No Logs in Backend?

**Check 1: Backend Running?**
```
http://localhost:3001/api/health
```

**Check 2: Webhook Endpoint Working?**
Test manually with PowerShell command above.

**Check 3: Camera Detecting Plates?**
- Check camera's own interface
- Look for ANPR events in camera logs
- Ensure vehicle is in detection zone

---

## 📱 Camera-Specific Guides

### Hikvision Cameras

1. Go to: Configuration → Event → Smart Event
2. Enable: ANPR
3. Go to: Configuration → Network → Advanced → HTTP Listening
4. Add notification URL
5. Select: ANPR event

### Dahua Cameras

1. Go to: Event → IVS
2. Enable: Traffic Flow Statistics or ANPR
3. Go to: Event → Subscription
4. Enable: HTTP
5. Add server URL

### Generic IP Cameras

1. Look for: Smart Events or IVS
2. Enable: Vehicle Detection or ANPR
3. Configure: HTTP Notification
4. Test with vehicle

---

## 🎯 Expected Workflow

```
Vehicle enters camera view
    ↓
Camera detects license plate (built-in ANPR)
    ↓
Camera sends HTTP POST to webhook
    ↓
Backend receives webhook
    ↓
Event saved to database
    ↓
Frontend polls for new events
    ↓
Plate appears in Gate Monitor
    ↓
Operator confirms/rejects
```

---

## ✅ Advantages of Camera ANPR

vs. Video Frame Processing:

| Feature | Camera ANPR | Frame Processing |
|---------|-------------|------------------|
| Speed | ⚡ Instant | 🐌 2-3 seconds |
| Accuracy | 🎯 95-99% | 📊 70-95% |
| CPU Usage | 💚 Minimal | 🔴 High |
| Cost | 💰 Free (built-in) | 💸 API costs |
| Reliability | ✅ Dedicated hardware | ⚠️ Depends on quality |

---

## 📞 Next Steps

1. ✅ Access camera web interface
2. ✅ Enable ANPR/LPR feature
3. ✅ Configure webhook URL
4. ✅ Test with vehicle
5. ✅ Check backend logs
6. ✅ See plate in Gate Monitor

---

## 🆘 Need Help?

**Provide this information:**
1. Camera brand and model
2. Camera web interface screenshots
3. Available ANPR/LPR settings
4. Webhook configuration options

**We'll help you configure it correctly!**

---

**Your camera's built-in ANPR is the best solution - let's get it configured!**
