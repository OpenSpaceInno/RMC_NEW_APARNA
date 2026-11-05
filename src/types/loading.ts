export type BayStatus = 'available' | 'loading' | 'quality_check' | 'maintenance' | 'offline';
export type MaterialType = 'cement' | 'sand' | 'aggregate' | 'water' | 'admixture';

export interface Material {
  type: MaterialType;
  targetQuantity: number;
  dispensedQuantity: number;
  unit: 'kg' | 'liters';
  tolerance: number;
}

export interface QualityCheck {
  id: string;
  parameter: string;
  expectedValue: string;
  actualValue?: string;
  status: 'pending' | 'passed' | 'failed';
  mandatory: boolean;
}

export interface LoadingSession {
  sessionId: string;
  bayId: string;
  vehicleRegNo: string;
  mixDesignId: string;
  startTime: string;
  endTime?: string;
  materials: Material[];
  qualityChecks: QualityCheck[];
  overallProgress: number;
  status: 'in_progress' | 'quality_check' | 'completed' | 'failed';
  operatorId: string;
}

export interface LoadingBay {
  id: string;
  name: string;
  status: BayStatus;
  currentSession?: LoadingSession;
  capacity: number;
  location: string;
}
