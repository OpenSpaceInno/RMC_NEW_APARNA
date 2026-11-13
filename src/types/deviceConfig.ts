export interface CameraDevice {
  id: string;
  name: string;
  model: string;
  location: 'entry' | 'exit' | 'weighbridge' | string;
  plantId?: string;
  ipAddress: string;
  macAddress: string;
  status: 'online' | 'offline' | 'configuring' | 'error';
  lastSeen: string;
  firmware: string;
  showOnDashboard?: boolean;
  hlsProxyUrl?: string;
  rtspUrl?: string;
}

export interface NetworkConfig {
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  primaryDns: string;
  secondaryDns: string;
  dhcpEnabled: boolean;
}

export interface VideoConfig {
  mainStream: {
    resolution: string;
    frameRate: number;
    bitrate: number;
    compression: 'H.264' | 'H.265';
  };
  subStream: {
    resolution: string;
    frameRate: number;
    bitrate: number;
    compression: 'H.264' | 'H.265';
  };
}

export interface ImageConfig {
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  wdrEnabled: boolean;
  wdrLevel: number;
  dnrEnabled: boolean;
  dnrLevel: number;
  irMode: 'auto' | 'on' | 'off';
  irDistance: number;
}

export interface ANPRConfig {
  enabled: boolean;
  detectionMode: 'continuous' | 'triggered';
  plateType: 'white' | 'black' | 'both';
  minConfidence: number;
  maxPlateWidth: number;
  minPlateWidth: number;
  captureMode: 'best_shot' | 'all';
  captureCount: number;
  captureInterval: number;
  overlayPlateNumber: boolean;
}

export interface WebhookConfig {
  url: string;
  method: 'POST' | 'GET';
  authType: 'none' | 'basic' | 'bearer';
  username?: string;
  password?: string;
  token?: string;
  timeout: number;
  retryCount: number;
}

export interface RTSPConfig {
  enabled: boolean;
  url: string;
  directUrl: string; // Full RTSP URL for direct input
  useDirectUrl: boolean; // Toggle between constructed URL and direct URL
  port: number;
  username: string;
  password: string;
  streamPath: string;
  transport: 'tcp' | 'udp';
  reconnectInterval: number;
  bufferSize: number;
  lowLatencyMode: boolean;
  hlsProxyUrl: string; // Optional HLS proxy URL for browser playback
}

export interface FtpConfig {
  host: string;
  apiUrl: string;
  ftpPort: number;
  sftpPort: number;
  username: string;
  password?: string;
  cameraUser: string;
  cameraPassword?: string;
  adminUser?: string;
  adminPassword?: string;
  remoteFolder: string;
  webAdminUrl: string;
}

export interface DeviceConfiguration {
  device: CameraDevice;
  network: NetworkConfig;
  video: VideoConfig;
  image: ImageConfig;
  anpr: ANPRConfig;
  webhook: WebhookConfig;
  rtsp: RTSPConfig;
  ftp?: FtpConfig;
}
