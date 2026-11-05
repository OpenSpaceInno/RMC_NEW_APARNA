export interface Evidence {
  type: 'image' | 'video';
  url: string;
  angle: 'front' | 'side' | 'rear' | 'plate';
  timestamp: string;
  thumbnailUrl?: string;
}

export interface ANPREvent {
  eventId: string;
  type: 'ANPR_READ';
  timestamp: string;
  plantId: string;
  cameraId: string;
  vehicleRegNo: string;
  confidence: number;
  source: string;
  evidence: Evidence[];
  status: 'pending' | 'confirmed' | 'rejected' | 'manual_override';
  operatorNote?: string;
}

export interface CameraFeed {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'error';
  streamUrl?: string;
  ip_address?: string;
  ipAddress?: string;
  cameraType?: 'anpr' | 'overview';
  isANPR?: boolean;
}
