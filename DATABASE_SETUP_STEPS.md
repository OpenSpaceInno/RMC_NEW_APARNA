# 📋 Database Setup - Step by Step Guide

## Quick Setup (5 minutes)

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: **oyispskpeugnovyfavus**

### Step 2: Open SQL Editor
1. In the left sidebar, click **SQL Editor**
2. Click **New Query** button (top right)

### Step 3: Copy the SQL Script
1. Open the file: `QUICK_DB_SETUP.sql` (in your project root)
2. Copy ALL the content (Ctrl+A, Ctrl+C)

### Step 4: Run the Script
1. Paste the SQL into the Supabase SQL Editor
2. Click **Run** button (or press Ctrl+Enter)
3. Wait for "Success" message

### Step 5: Verify Setup
1. Go back to your application: http://localhost:8080/database-setup
2. Click **"Check Database Status"** button
3. You should see: ✅ "Database tables already exist!"

### Step 6: View Live Cameras
1. Go to: http://localhost:8080/gate-monitor
2. See 2 live camera feeds automatically!

---

## What Gets Created

The SQL script creates these tables:
- ✅ `camera_devices` - Store camera information
- ✅ `device_rtsp_config` - Store RTSP streaming settings
- ✅ `device_network_config` - Store network configuration

Plus:
- ✅ Row Level Security policies
- ✅ Indexes for performance
- ✅ Proper permissions

---

## Troubleshooting

### "Permission denied" error
**Solution**: Make sure you're signed in to the correct Supabase project

### "Table already exists" error
**Solution**: This is fine! It means tables are already created. Just refresh the app.

### "Syntax error" in SQL
**Solution**: Make sure you copied the ENTIRE SQL file, including the first and last lines

### Still showing "Initialize Database"
**Solution**: 
1. Refresh the browser (F5)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try opening in incognito/private window

---

## Alternative: Manual Table Creation

If the SQL script doesn't work, create tables manually:

### Table 1: camera_devices
```sql
CREATE TABLE public.camera_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  location TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  mac_address TEXT,
  status TEXT DEFAULT 'offline',
  last_seen TIMESTAMPTZ,
  firmware TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.camera_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.camera_devices FOR ALL USING (true);
```

### Table 2: device_rtsp_config
```sql
CREATE TABLE public.device_rtsp_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT true,
  url TEXT,
  direct_url TEXT,
  use_direct_url BOOLEAN DEFAULT true,
  port INTEGER DEFAULT 554,
  username TEXT,
  password TEXT,
  stream_path TEXT DEFAULT '/rtsp/streaming?channel=01&subtype=0',
  transport TEXT DEFAULT 'tcp',
  reconnect_interval INTEGER DEFAULT 5,
  buffer_size INTEGER DEFAULT 1024,
  low_latency_mode BOOLEAN DEFAULT true,
  hls_proxy_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.device_rtsp_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.device_rtsp_config FOR ALL USING (true);
```

### Table 3: device_network_config
```sql
CREATE TABLE public.device_network_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL,
  ip_address TEXT NOT NULL,
  subnet_mask TEXT DEFAULT '255.255.255.0',
  gateway TEXT NOT NULL,
  primary_dns TEXT DEFAULT '8.8.8.8',
  secondary_dns TEXT DEFAULT '8.8.4.4',
  dhcp_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.device_network_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.device_network_config FOR ALL USING (true);
```

---

## Verification

After setup, verify tables exist:

### In Supabase Dashboard:
1. Go to **Table Editor** (left sidebar)
2. You should see:
   - camera_devices
   - device_rtsp_config
   - device_network_config

### In Your Application:
1. Visit: http://localhost:8080/gate-monitor
2. Should NOT show "Initialize Database" button
3. Should show 2 camera feeds

---

## Next Steps

After database is set up:
1. ✅ Gate Monitor will auto-initialize cameras
2. ✅ Default RTSP configurations will be created
3. ✅ Live camera feeds will display
4. (Optional) Customize camera settings in Device Config

---

## Need Help?

If you're still having issues:
1. Check browser console for errors (F12)
2. Check Supabase logs in dashboard
3. Verify .env file has correct credentials
4. Try refreshing the page
5. Try clearing browser cache

---

**Estimated Time**: 5 minutes
**Difficulty**: Easy
**One-time Setup**: Yes
