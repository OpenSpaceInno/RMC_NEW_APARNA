-- =====================================================
-- DEVICE CONFIGURATION TABLES
-- =====================================================

-- Camera Devices Table
CREATE TABLE public.camera_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  location TEXT NOT NULL CHECK (location IN ('entry', 'exit', 'weighbridge', 'loading', 'other')),
  ip_address TEXT NOT NULL,
  mac_address TEXT,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'configuring', 'error')),
  last_seen TIMESTAMPTZ,
  firmware TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Device Network Configuration Table
CREATE TABLE public.device_network_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL REFERENCES public.camera_devices(device_id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  subnet_mask TEXT NOT NULL DEFAULT '255.255.255.0',
  gateway TEXT NOT NULL,
  primary_dns TEXT NOT NULL DEFAULT '8.8.8.8',
  secondary_dns TEXT DEFAULT '8.8.4.4',
  dhcp_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Device Video Configuration Table
CREATE TABLE public.device_video_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL REFERENCES public.camera_devices(device_id) ON DELETE CASCADE,
  main_resolution TEXT NOT NULL DEFAULT '2880x1620',
  main_frame_rate INTEGER NOT NULL DEFAULT 30,
  main_bitrate INTEGER NOT NULL DEFAULT 4096,
  main_compression TEXT NOT NULL DEFAULT 'H.265' CHECK (main_compression IN ('H.264', 'H.265')),
  sub_resolution TEXT NOT NULL DEFAULT '1280x720',
  sub_frame_rate INTEGER NOT NULL DEFAULT 15,
  sub_bitrate INTEGER NOT NULL DEFAULT 1024,
  sub_compression TEXT NOT NULL DEFAULT 'H.264' CHECK (sub_compression IN ('H.264', 'H.265')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Device Image Configuration Table
CREATE TABLE public.device_image_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL REFERENCES public.camera_devices(device_id) ON DELETE CASCADE,
  brightness INTEGER NOT NULL DEFAULT 50 CHECK (brightness >= 0 AND brightness <= 100),
  contrast INTEGER NOT NULL DEFAULT 50 CHECK (contrast >= 0 AND contrast <= 100),
  saturation INTEGER NOT NULL DEFAULT 50 CHECK (saturation >= 0 AND saturation <= 100),
  sharpness INTEGER NOT NULL DEFAULT 60 CHECK (sharpness >= 0 AND sharpness <= 100),
  wdr_enabled BOOLEAN NOT NULL DEFAULT true,
  wdr_level INTEGER NOT NULL DEFAULT 120,
  dnr_enabled BOOLEAN NOT NULL DEFAULT true,
  dnr_level INTEGER NOT NULL DEFAULT 5,
  ir_mode TEXT NOT NULL DEFAULT 'auto' CHECK (ir_mode IN ('auto', 'on', 'off')),
  ir_distance INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Device ANPR Configuration Table
CREATE TABLE public.device_anpr_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL REFERENCES public.camera_devices(device_id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  detection_mode TEXT NOT NULL DEFAULT 'continuous' CHECK (detection_mode IN ('continuous', 'triggered')),
  plate_type TEXT NOT NULL DEFAULT 'both' CHECK (plate_type IN ('white', 'black', 'both')),
  min_confidence INTEGER NOT NULL DEFAULT 80 CHECK (min_confidence >= 0 AND min_confidence <= 100),
  max_plate_width INTEGER NOT NULL DEFAULT 400,
  min_plate_width INTEGER NOT NULL DEFAULT 80,
  capture_mode TEXT NOT NULL DEFAULT 'best_shot' CHECK (capture_mode IN ('best_shot', 'all')),
  capture_count INTEGER NOT NULL DEFAULT 3,
  capture_interval INTEGER NOT NULL DEFAULT 500,
  overlay_plate_number BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Device Webhook Configuration Table
CREATE TABLE public.device_webhook_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL REFERENCES public.camera_devices(device_id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'POST' CHECK (method IN ('POST', 'GET')),
  auth_type TEXT NOT NULL DEFAULT 'none' CHECK (auth_type IN ('none', 'basic', 'bearer')),
  username TEXT,
  password TEXT,
  token TEXT,
  timeout INTEGER NOT NULL DEFAULT 10,
  retry_count INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Device RTSP Configuration Table
CREATE TABLE public.device_rtsp_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL REFERENCES public.camera_devices(device_id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  url TEXT,
  direct_url TEXT,
  use_direct_url BOOLEAN NOT NULL DEFAULT true,
  port INTEGER NOT NULL DEFAULT 554,
  username TEXT,
  password TEXT,
  stream_path TEXT NOT NULL DEFAULT '/rtsp/streaming?channel=01&subtype=0',
  transport TEXT NOT NULL DEFAULT 'tcp' CHECK (transport IN ('tcp', 'udp')),
  reconnect_interval INTEGER NOT NULL DEFAULT 5,
  buffer_size INTEGER NOT NULL DEFAULT 1024,
  low_latency_mode BOOLEAN NOT NULL DEFAULT true,
  hls_proxy_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_camera_devices_device_id ON public.camera_devices(device_id);
CREATE INDEX idx_camera_devices_location ON public.camera_devices(location);
CREATE INDEX idx_camera_devices_status ON public.camera_devices(status);
CREATE INDEX idx_camera_devices_ip_address ON public.camera_devices(ip_address);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.camera_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_network_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_video_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_image_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_anpr_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_webhook_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_rtsp_config ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access" ON public.camera_devices FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.camera_devices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.camera_devices FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.camera_devices FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.device_network_config FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.device_network_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.device_network_config FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.device_network_config FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.device_video_config FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.device_video_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.device_video_config FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.device_video_config FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.device_image_config FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.device_image_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.device_image_config FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.device_image_config FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.device_anpr_config FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.device_anpr_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.device_anpr_config FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.device_anpr_config FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.device_webhook_config FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.device_webhook_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.device_webhook_config FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.device_webhook_config FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.device_rtsp_config FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.device_rtsp_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.device_rtsp_config FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.device_rtsp_config FOR DELETE USING (true);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_camera_devices_updated_at BEFORE UPDATE ON public.camera_devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_device_network_config_updated_at BEFORE UPDATE ON public.device_network_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_device_video_config_updated_at BEFORE UPDATE ON public.device_video_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_device_image_config_updated_at BEFORE UPDATE ON public.device_image_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_device_anpr_config_updated_at BEFORE UPDATE ON public.device_anpr_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_device_webhook_config_updated_at BEFORE UPDATE ON public.device_webhook_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_device_rtsp_config_updated_at BEFORE UPDATE ON public.device_rtsp_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
