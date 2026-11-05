-- =====================================================
-- QUICK DATABASE SETUP FOR RTSP CAMERA INTEGRATION
-- Copy and paste this entire script into Supabase SQL Editor
-- =====================================================

-- Camera Devices Table
CREATE TABLE IF NOT EXISTS public.camera_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  location TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  mac_address TEXT,
  status TEXT NOT NULL DEFAULT 'offline',
  last_seen TIMESTAMPTZ,
  firmware TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Device RTSP Configuration Table
CREATE TABLE IF NOT EXISTS public.device_rtsp_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  url TEXT,
  direct_url TEXT,
  use_direct_url BOOLEAN NOT NULL DEFAULT true,
  port INTEGER NOT NULL DEFAULT 554,
  username TEXT,
  password TEXT,
  stream_path TEXT NOT NULL DEFAULT '/rtsp/streaming?channel=01&subtype=0',
  transport TEXT NOT NULL DEFAULT 'tcp',
  reconnect_interval INTEGER NOT NULL DEFAULT 5,
  buffer_size INTEGER NOT NULL DEFAULT 1024,
  low_latency_mode BOOLEAN NOT NULL DEFAULT true,
  hls_proxy_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Device Network Configuration Table
CREATE TABLE IF NOT EXISTS public.device_network_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL,
  ip_address TEXT NOT NULL,
  subnet_mask TEXT NOT NULL DEFAULT '255.255.255.0',
  gateway TEXT NOT NULL,
  primary_dns TEXT NOT NULL DEFAULT '8.8.8.8',
  secondary_dns TEXT DEFAULT '8.8.4.4',
  dhcp_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.camera_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_rtsp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_network_config ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
DROP POLICY IF EXISTS "Allow public read access" ON public.camera_devices;
DROP POLICY IF EXISTS "Allow public insert access" ON public.camera_devices;
DROP POLICY IF EXISTS "Allow public update access" ON public.camera_devices;
DROP POLICY IF EXISTS "Allow public delete access" ON public.camera_devices;

CREATE POLICY "Allow public read access" ON public.camera_devices FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.camera_devices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.camera_devices FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.camera_devices FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.device_rtsp_config;
DROP POLICY IF EXISTS "Allow public insert access" ON public.device_rtsp_config;
DROP POLICY IF EXISTS "Allow public update access" ON public.device_rtsp_config;
DROP POLICY IF EXISTS "Allow public delete access" ON public.device_rtsp_config;

CREATE POLICY "Allow public read access" ON public.device_rtsp_config FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.device_rtsp_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.device_rtsp_config FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.device_rtsp_config FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.device_network_config;
DROP POLICY IF EXISTS "Allow public insert access" ON public.device_network_config;
DROP POLICY IF EXISTS "Allow public update access" ON public.device_network_config;
DROP POLICY IF EXISTS "Allow public delete access" ON public.device_network_config;

CREATE POLICY "Allow public read access" ON public.device_network_config FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.device_network_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.device_network_config FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.device_network_config FOR DELETE USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_camera_devices_device_id ON public.camera_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_camera_devices_location ON public.camera_devices(location);
CREATE INDEX IF NOT EXISTS idx_camera_devices_status ON public.camera_devices(status);

-- Success message
SELECT 'Database tables created successfully!' as message;
