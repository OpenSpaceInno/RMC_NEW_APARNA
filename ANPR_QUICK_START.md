# 🚀 ANPR Quick Start

## What's New?

Your Gate Monitor now has **Automatic License Plate Recognition**!

## Current Status

✅ **ANPR System**: Active (Mock Mode)
✅ **Database**: Tables created
✅ **API**: Endpoints ready
✅ **Frontend**: Integrated with Gate Monitor

---

## See It In Action

### Step 1: Open Gate Monitor
```powershell
Start-Process "http://localhost:8080/gate-monitor"
```

### Step 2: Watch for Detections
- System generates mock detections every 10 seconds
- You'll see notifications: "New Vehicle Detected"
- License plates appear automatically

### Step 3: Take Action
- **Confirm**: Click "Confirm Entry" (green button)
- **Override**: Click edit icon to correct plate
- **Reject**: Click "Reject" (red button)

---

## Mock Mode Features

Currently generating test data:
- Random Indian license plates (KA05AB1234, MH02CD5678, etc.)
- Confidence scores: 85-99%
- Vehicle images
- Automatic database storage

---

## Upgrade to Real ANPR

### Get Free API Key (2 minutes)

1. **Sign up**: https://platerecognizer.com
2. **Get API key** from dashboard
3. **Add to server/.env**:
   ```env
   PLATERECOGNIZER_API_KEY=your_key_here
   ```
4. **Restart backend**

That's it! Real ANPR activated.

**Free Tier**: 2,500 detections/month

---

## How It Works

```
📹 Camera captures vehicle
    ↓
🔍 ANPR detects license plate
    ↓
💾 Saved to database
    ↓
📺 Displayed in Gate Monitor
    ↓
👤 Operator confirms/rejects
    ↓
✅ Data pushed to ERP
```

---

## Key Features

### Automatic Detection
- Real-time plate recognition
- Confidence scoring
- Vehicle type detection
- Image evidence capture

### Operator Controls
- ✅ Confirm high-confidence detections
- ✏️ Override incorrect readings
- ❌ Reject invalid entries
- 📝 Add notes for audit trail

### Smart Thresholds
- **≥ 92%**: Auto-confirm eligible (green)
- **85-91%**: Manual review (yellow)
- **< 85%**: High error risk (red)

---

## Database

All events stored in MySQL:

```sql
-- View recent detections
SELECT * FROM anpr_events ORDER BY timestamp DESC LIMIT 10;

-- View pending approvals
SELECT * FROM anpr_events WHERE status = 'pending';

-- Today's statistics
SELECT 
    status,
    COUNT(*) as count,
    AVG(confidence) as avg_confidence
FROM anpr_events 
WHERE DATE(timestamp) = CURDATE()
GROUP BY status;
```

---

## API Endpoints

### Get Events
```
GET /api/anpr/events?status=pending&limit=50
```

### Update Event
```
PUT /api/anpr/events/:eventId
{
  "status": "confirmed",
  "operator_note": "Verified"
}
```

### Detect Plate
```
POST /api/anpr/detect
(multipart/form-data with image)
```

---

## Next Steps

1. ✅ Test mock mode (already working!)
2. 🔑 Get PlateRecognizer API key (optional)
3. 📹 Connect real camera feed
4. 🎯 Adjust confidence thresholds
5. 👥 Train operators

---

## Support

- **Mock Mode**: Works out of the box
- **Cloud ANPR**: PlateRecognizer.com (free tier)
- **Local ANPR**: OpenALPR (advanced setup)

---

**Your ANPR system is live! Open Gate Monitor to see it in action.**

http://localhost:8080/gate-monitor
