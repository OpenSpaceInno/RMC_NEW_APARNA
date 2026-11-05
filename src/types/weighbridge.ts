export interface WeightReading {
  timestamp: string;
  weight: number;
  unit: 'kg' | 'ton';
  stable: boolean;
}

export interface Evidence {
  id: string;
  type: 'image' | 'video';
  url: string;
  angle: 'front' | 'side' | 'rear' | 'top' | 'load';
  timestamp: string;
  thumbnailUrl?: string;
}

export interface WeighbridgeSession {
  sessionId: string;
  vehicleRegNo: string;
  timestamp: string;
  tareWeight: number | null;
  grossWeight: number | null;
  netWeight: number | null;
  driverName?: string;
  material?: string;
  destination?: string;
  evidence: Evidence[];
  status: 'tare' | 'gross' | 'completed';
  operatorId: string;
  operatorName: string;
  sapPoNumber?: string;
  sapDocNumber?: string;
  sapSyncStatus?: 'synced' | 'pending' | 'none';
  syncType?: 'po_ref' | 'without_po' | 'others';
  vendorName?: string;
}

export interface WeighSlip {
  slipNumber: string;
  sessionId: string;
  vehicleRegNo: string;
  dateTime: string;
  tareWeight: number;
  grossWeight: number;
  netWeight: number;
  material: string;
  driverName: string;
  destination: string;
  operatorName: string;
  evidence: Evidence[];
  sapPoNumber?: string;
  sapDocNumber?: string;
  vendorName?: string;
  syncType?: string;
}
