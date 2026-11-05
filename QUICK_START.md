# 🚀 Quick Start Guide - RTSP Live Camera Integration

## Your Application is Running! 🎉

**Dev Server**: http://localhost:8080

## 📍 Key URLs to Visit

### 1. Database Setup (Start Here!)
```
http://localhost:8080/database-setup
```
**What you'll see:**
- Database migration button
- List of tables to be created
- One-click setup process
- Success confirmation

**Action**: Click "Apply Migration" to create database tables

---

### 2. Device Configuration
```
http://localhost:8080/device-config
```
**What you'll see:**
- Left: Device list (3 mock cameras)
- Center: Configuration tabs (RTSP, Network, Video, Image, ANPR, Webhook)
- Right: Live stream preview + Device actions

**Action**: 
1. Select a camera (e.g., "ANPR Entry Gate")
2. Click "RTSP" tab
3. Configure streaming settings
4. Click "Save RTSP Settings"

---

### 3. Dashboard (Overview)
```
http://localhost:8080/
```
**What you'll see:**
- System overview
- Active trips monitor
- Operations statistics
- Bay utilization charts

---

## 🎯 Step-by-Step Demo

### Step 1: Initialize Database (2 minutes)
1. Open: http://localhost:8080/database-setup
2. Click "Apply Migration"
3. Wait for success message
4. Click "Go to Device Configuration"

### Step 2: Configure RTSP (3 minutes)
1. You're now on Device Configuration page
2. Select "ANPR Entry Gate" from device list
3. Click "RTSP" tab at the top
4. You'll see two modes:
   - **Direct URL** (recommended for testing)
   - **Manual Config** (for custom setup)

#### Option A: Direct URL Mode
```
1. Select "Direct URL" tab
2. Enter your camera's RTSP URL:
   rtsp://192.168.0.168:554/rtsp/streaming?channel=01&subtype=0
   
3. (Optional) Add HLS proxy URL for browser playback:
   http://localhost:8888/cam1/index.m3u8
   
4. Click "Save RTSP Settings"
```

#### Option B: Manual Config Mode
```
1. Select "Manual Config" tab
2. Set Port: 554
3. Set Stream Path: /rtsp/streaming?channel=01&subtype=0
4. Enter Username: admin
5. Enter Password: your_password
6. Select Transport: TCP
7. Click "Save RTSP Settings"
```

### Step 3: View Live Stream (1 minute)
1. Look at the right panel "Live Stream Preview"
2. If HLS proxy configured: Stream plays in browser
3. If no HLS proxy: Click "Copy URL" or "Open in VLC"

---

## 🎬 What's Working Right Now

### ✅ Fully Functional
- **Device Management**: Add, edit, view camera devices
- **RTSP Configuration**: Save settings to database
- **Persistence**: Settings survive browser refresh
- **URL Building**: Direct URL or manual components
- **Authentication**: Username/password support
- **Performance Tuning**: Buffer size, latency, reconnect settings
- **External Players**: Copy URL for VLC/FFplay

### ⚙️ Requires Setup
- **HLS Proxy**: For browser playback (see RTSP_INTEGRATION.md)
- **Physical Cameras**: Connect real ANPR cameras
- **Network Access**: Ensure cameras are reachable

---

## 🔍 Testing Without Real Cameras

You can still test the interface without physical cameras:

1. **Mock Data**: 3 sample cameras are pre-configured
2. **Configuration UI**: All settings panels work
3. **Database Persistence**: Save/load configurations
4. **URL Generation**: See generated RTSP URLs
5. **External Player**: Copy URLs to test in VLC

### Test RTSP URL in VLC:
```bash
# Open VLC → Media → Open Network Stream
# Paste this test URL:
rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4
```

---

## 📊 Current Application State

### Pages Available:
```
/                       → Dashboard
/database-setup         → Database Migration (NEW!)
/device-config          → Device Configuration (UPDATED!)
/gate-monitor          → Gate Monitoring
/weighbridge           → Weighbridge Operations
/loading               → Loading Console
/dispatch              → Dispatch Approval
/trips                 → Trip Management
/trip-tracking         → Live Trip Tracking
/exit-verification     → Exit Verification
/incidents             → Incident Management
/customer-portal       → Customer Portal
/vehicles              → Vehicle Management
/drivers               → Driver Management
/trip-analytics        → Trip Analytics
/fuel                  → Fuel Management
/maintenance           → Maintenance Scheduler
/billing               → Billing & Invoicing
/inventory             → Inventory Management
/reports               → Reports
```

---

## 🎨 UI Features

### Device Configuration Page Layout:

```
┌─────────────────────────────────────────────────────────────┐
│  Device Configuration                                        │
├──────────────┬──────────────────────────┬───────────────────┤
│              │                          │                   │
│  Device List │  Configuration Tabs      │  Live Preview     │
│              │                          │                   │
│  ● Entry     │  [RTSP] Network Video    │  ┌─────────────┐ │
│  ● Exit      │                          │  │   Camera    │ │
│  ○ Bridge    │  ┌──────────────────┐   │  │   Stream    │ │
│              │  │ Enable RTSP      │   │  │   Display   │ │
│  [Refresh]   │  │ ☑ Enabled        │   │  └─────────────┘ │
│              │  │                  │   │                   │
│              │  │ Direct URL       │   │  Transport: TCP   │
│              │  │ [____________]   │   │  Latency: Low     │
│              │  │                  │   │  Buffer: 1024 KB  │
│              │  │ HLS Proxy URL    │   │                   │
│              │  │ [____________]   │   │  [Copy URL]       │
│              │  │                  │   │  [Open VLC]       │
│              │  │ [Test] [Save]    │   │                   │
│              │  └──────────────────┘   │  [Reboot Device]  │
│              │                          │                   │
└──────────────┴──────────────────────────┴───────────────────┘
```

---

## 🔧 Configuration Options Explained

### RTSP Settings:
- **Enable RTSP**: Turn streaming on/off
- **Direct URL**: Complete RTSP URL from camera
- **Port**: Usually 554 (RTSP standard)
- **Stream Path**: Camera-specific path
- **Username/Password**: Camera credentials
- **Transport**: TCP (reliable) or UDP (faster)
- **Buffer Size**: 512KB-4MB (affects latency)
- **Low Latency Mode**: Reduces buffering
- **HLS Proxy URL**: For browser playback

### Performance Tips:
- **Low Latency**: UDP + 512KB buffer + Low Latency Mode ON
- **Reliability**: TCP + 2MB buffer + Reconnect 5s
- **Bandwidth**: Use sub-stream, reduce FPS/bitrate

---

## 📱 Browser Compatibility

### Live Stream Playback:
- ✅ **Safari**: Native HLS support (works with HLS proxy)
- ⚠️ **Chrome/Firefox**: Requires hls.js (not yet integrated)
- ✅ **All Browsers**: Can copy URL for external player

### Recommended Workflow:
1. Configure RTSP in browser
2. Test stream in VLC first
3. Set up HLS proxy for browser playback
4. Or continue using VLC for monitoring

---

## 🎯 Success Checklist

After following this guide, you should have:

- [x] Database tables created
- [x] Camera devices visible in list
- [x] RTSP configuration saved
- [x] Settings persist after refresh
- [x] RTSP URL generated correctly
- [x] Can copy URL to clipboard
- [x] Can open in VLC (if installed)
- [x] Understand HLS proxy requirement

---

## 🆘 Troubleshooting

### "Apply Migration" button doesn't work
- Check browser console for errors
- Verify .env file has correct Supabase credentials
- Try refreshing the page

### Can't see live stream in browser
- This is expected without HLS proxy
- Use "Copy URL" and test in VLC
- See RTSP_INTEGRATION.md for HLS proxy setup

### Settings don't save
- Check browser console for errors
- Verify database migration was successful
- Check Supabase dashboard for table creation

### Device shows offline
- This is mock data for demonstration
- Real cameras will show online when connected
- Status updates when camera is reachable

---

## 📚 Additional Resources

- **Full Documentation**: See `RTSP_INTEGRATION.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Database Schema**: See `supabase/migrations/20260206000000_device_configurations.sql`

---

## 🎉 You're All Set!

Your RTSP live camera integration is ready. Start by visiting:

👉 **http://localhost:8080/database-setup**

Then explore the device configuration and test the features!

---

**Need Help?** Check the documentation files or browser console for detailed error messages.
