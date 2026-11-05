export interface ExitWeightReading {
  timestamp: string;
  weight: number;
  unit: 'kg' | 'ton';
  stable: boolean;
}

export interface PlateImage {
  id: string;
  angle: 'front' | 'back';
  url: string;
  timestamp: string;
}

export interface ExitVerification {
  verificationId: string;
  vehicleRegNo: string;
  exitTimestamp: string;
  exitWeight: number;
  entryWeight?: number;
  loadingWeight?: number;
  weightDifference: number;
  plateImages: PlateImage[];
  status: 'pending' | 'verified' | 'anomaly';
  operatorId: string;
  operatorName: string;
  remarks?: string;
  anomalyReason?: string;
}

export interface WeightComparison {
  entryWeight?: number;
  loadingWeight?: number;
  exitWeight: number;
  expectedDifference: number;
  actualDifference: number;
  tolerance: number;
  withinTolerance: boolean;
}

export interface ExitSlip {
  slipId: string;
  verificationId: string;
  vehicleRegNo: string;
  exitTimestamp: string;
  entryWeight: number;
  loadingWeight: number;
  exitWeight: number;
  netLoad: number;
  weightDifference: number;
  status: 'pending' | 'verified' | 'anomaly';
  operatorId: string;
  operatorName: string;
  remarks?: string;
  withinTolerance: boolean;
  tolerance: number;
  plateImageCount: number;
  generatedAt: string;
}
