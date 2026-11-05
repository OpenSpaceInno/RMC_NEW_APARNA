# 🚗 Automatic Number Plate Recognition (ANPR) Setup Guide

## Overview

Your system now has **automatic license plate detection** integrated with the live camera feed!

## Current Status

✅ **Backend API**: ANPR endpoints ready
✅ **Database**: ANPR tables created
✅ **Mock Mode**: Generating test detections
✅ **Real-time Updates**: Events refresh every 5 seconds
✅ **Gate Monitor**: Displays detected vehicles

---

## How It Works

```
Camera Feed (RTSP/HLS)
    ↓
Frame Capture
    ↓
ANPR Processing (Cloud/Local/Mock)
    ↓
License Plate Detected
    ↓
Saved to Database
    ↓
Displayed in Gate Monitor
    ↓
Operator Confirms/Rejects/Overrides
```

---

## Current Mode: MOCK (Testing)

The system is currently in **MOCK mode** for testing without requiring an ANPR API.

### Mock Mode Features:
- ✅ Generates random Indian license plates
- ✅ Simulates 85-99% confidence scores
- ✅ Creates events every 10 seconds (30% chance)
- ✅ Saves to database
- ✅ Shows in Gate Monitor

### Mock Plates Generated:
- KA05AB1234 (Karnataka)
- MH02CD5678 (Maharashtra)
- DL01EF9012 (Delhi)
- TN09GH3456 (Tamil Nadu)
- GJ06IJ7890 (Gujarat)

---

## Upgrade to Real ANPR

### Option 1: Cloud ANPR (Recommended - Easy Setup)

**PlateRecognizer.com** - Free tier: 2,500 detections/month

#### Step 1: Get API Key
1. Go to: https://platerecognizer.com
2. Sign up for free account
3. Get your API key from dashboard

#### Step 2: Configure Backend
Add to `server/.env`:
```env
PLATERECOGNIZER_API_KEY=your_api_key_here
```

#### Step 3: Restart Backend
```powershell
# Stop and restart backend server
```

That's it! System will automatically use cloud ANPR.

---

### Option 2: Local ANPR (Advanced - No Internet Required)

**OpenALPR** - Run ANPR locally on your server

#### Requirements:
- OpenALPR installed locally
- Runs on http://localhost:8080
- No API key needed
- Faster processing
- Works offline

#### Installation:
1. Download OpenALPR: https://github.com/openalpr/openalpr
2. Install and start service
3. Update `server/anpr-processor.js`:
   ```javascript
   localEnabled: true,
   cloudEnabled: false,
   mockEnabled: false,
   ```

---

## ANPR Configuration

### Database Table: `anpr_config`

Each camera has ANPR settings:

```sql
SELECT * FROM anpr_config WHERE camera_id = 'cam_gate_1';
```

### Settings:
- **enabled**: Turn ANPR on/off
- **min_confidence**: Minimum confidence to accept (0.70 = 70%)
- **auto_confirm_threshold**: Auto-confirm above this (0.92 = 92%)
- **capture_interval**: Seconds between captures (2)
- **region**: Country code ('in' for India)
- **processing_mode**: 'cloud', 'local', or 'mock'
- **api_key**: API key for cloud service

### Update Configuration:
```javascript
await api.updateANPRConfig('cam_gate_1', {
  enabled: true,
  min_confidence: 0.75,
  auto_confirm_threshold: 0.92,
  region: 'in',
  processing_mode: 'cloud',
  api_key: 'your_key_here'
});
```

---

## Gate Monitor Features

### Automatic Detection
- 🎥 Live camera feed shows vehicles
- 🔍 ANPR automatically detects license plates
- 📊 Confidence score displayed
- ⚡ Real-time notifications

### Operator Actions

#### 1. Confirm Entry (High Confidence)
- Click "Confirm Entry" button
- Vehicle data pushed to ERP
- Status: ✅ Confirmed

#### 2. Manual Override (Low Confidence)
- Click edit icon
- Correct the plate number
- Add reason for override
- Status: ⚠️ Manual Override

#### 3. Reject Entry
- Click "Reject" button
- Add rejection reason
- Status: ❌ Rejected

### Confidence Thresholds

| Confidence | Color | Action |
|-----------|-------|--------|
| ≥ 92% | 🟢 Green | Auto-confirm eligible |
| 85-91% | 🟡 Yellow | Manual review required |
| < 85% | 🔴 Red | High chance of error |

---

## API Endpoints

### Get ANPR Events
```javascript
GET /api/anpr/events?status=pending&limit=50
```

### Get Single Event
```javascript
GET /api/anpr/events/:eventId
```

### Create Event
```javascript
POST /api/anpr/events
{
  "event_id": "evt_ANPR_123",
  "camera_id": "cam_gate_1",
  "vehicle_reg_no": "KA05AB1234",
  "confidence": 0.95,
  "source": "anpr-system",
  "vehicle_type": "Truck"
}
```

### Update Event Status
```javascript
PUT /api/anpr/events/:eventId
{
  "status": "confirmed",
  "operator_note": "Verified manually"
}
```

### Detect Plate from Image
```javascript
POST /api/anpr/detect
Content-Type: multipart/form-data

{
  "image": <file>,
  "camera_id": "cam_gate_1"
}
```

---

## Database Schema

### anpr_events Table
```sql
CREATE TABLE anpr_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(50) UNIQUE,
    timestamp DATETIME,
    camera_id VARCHAR(50),
    vehicle_reg_no VARCHAR(20),
    confidence DECIMAL(5,4),
    source VARCHAR(100),
    status ENUM('pending', 'confirmed', 'rejected', 'manual_override'),
    operator_note TEXT,
    vehicle_type VARCHAR(50)
);
```

### anpr_evidence Table
```sql
CREATE TABLE anpr_evidence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(50),
    evidence_type ENUM('image', 'video'),
    url TEXT,
    angle ENUM('front', 'side', 'rear', 'plate'),
    timestamp DATETIME
);
```

---

## Integration with Camera

### Option A: Webhook from Camera
If your camera supports webhooks:

1. Configure camera to send ANPR events to:
   ```
   POST http://your-server:3001/api/anpr/webhook/cam_gate_1
   ```

2. Webhook payload:
   ```json
   {
     "plate": "KA05AB1234",
     "confidence": 0.95,
     "image_url": "http://camera/snapshot.jpg",
     "vehicle_type": "Car"
   }
   ```

### Option B: Frame Capture + Processing
Capture frames from RTSP stream and process:

```javascript
// Capture frame from camera
const frame = await captureFrameFromRTSP(rtspUrl);

// Detect plate
const result = await api.detectPlate(frame);

// Create event
if (result.plates.length > 0) {
  await api.createANPREvent({
    event_id: generateEventId(),
    camera_id: 'cam_gate_1',
    vehicle_reg_no: result.plates[0].plate,
    confidence: result.plates[0].confidence,
    source: 'frame-capture',
  });
}
```

---

## Testing

### View Current Events
```powershell
# Open Gate Monitor
Start-Process "http://localhost:8080/gate-monitor"
```

### Check Database
```sql
-- View all events
SELECT * FROM anpr_events ORDER BY timestamp DESC LIMIT 10;

-- View pending events
SELECT * FROM anpr_events WHERE status = 'pending';

-- View today's events
SELECT * FROM anpr_events WHERE DATE(timestamp) = CURDATE();
```

### Test API
```powershell
# Get events
Invoke-RestMethod -Uri "http://localhost:3001/api/anpr/events" -Method Get

# Get ANPR config
Invoke-RestMethod -Uri "http://localhost:3001/api/anpr/config/cam_gate_1" -Method Get
```

---

## Performance Tips

### For High Traffic Gates:
1. **Increase capture interval**: 3-5 seconds instead of 2
2. **Use local ANPR**: Faster than cloud
3. **Auto-confirm high confidence**: ≥ 95% confidence
4. **Batch processing**: Process multiple frames together

### For Better Accuracy:
1. **Camera positioning**: 30-45° angle to plate
2. **Lighting**: Good illumination on plate area
3. **Resolution**: Minimum 720p, prefer 1080p
4. **Focus**: Sharp focus on plate area
5. **Speed**: Vehicles should be slow/stopped

---

## Troubleshooting

### No Detections Appearing
1. Check backend is running: http://localhost:3001/api/health
2. Check ANPR tables exist: `SHOW TABLES LIKE 'anpr%';`
3. Check camera is online in Gate Monitor
4. Check browser console for errors (F12)

### Low Confidence Scores
1. Improve camera angle
2. Add better lighting
3. Increase camera resolution
4. Clean camera lens
5. Reduce vehicle speed

### API Errors
1. Check API key is valid (if using cloud)
2. Check API quota not exceeded
3. Check image format is supported
4. Check network connectivity

---

## Next Steps

1. ✅ Test mock mode in Gate Monitor
2. ✅ Sign up for PlateRecognizer.com (free tier)
3. ✅ Add API key to `.env`
4. ✅ Restart backend
5. ✅ Test with real camera feed
6. ✅ Adjust confidence thresholds
7. ✅ Train operators on confirm/reject/override

---

## Support

### PlateRecognizer.com
- Free tier: 2,500 detections/month
- Paid plans: From $49/month for 10,000 detections
- Regions: Worldwide (200+ countries)
- Accuracy: 95%+ for clear images

### OpenALPR
- Open source and free
- Requires local installation
- Best for high-volume operations
- Works offline

---

**Your ANPR system is ready! Currently in mock mode for testing. Add API key to enable real detection.**
