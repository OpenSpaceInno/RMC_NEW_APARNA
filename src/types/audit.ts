export type AuditModule = 
  | 'gate' 
  | 'weighbridge' 
  | 'loading' 
  | 'dispatch' 
  | 'trip' 
  | 'tracking' 
  | 'exit' 
  | 'incident' 
  | 'system';

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'STATUS_CHANGE' 
  | 'WEIGHT_CAPTURE' 
  | 'OVERRIDE' 
  | 'ANOMALY_DETECTED' 
  | 'VERIFICATION_PASSED' 
  | 'DISPATCH_APPROVED' 
  | 'SECURITY_ALERT' 
  | 'INCIDENT_ESCALATED' 
  | 'LOGIN';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  module: AuditModule;
  action: AuditAction;
  entityId: string;
  entityType: string;
  performedBy: {
    id: string;
    name: string;
    role: string;
  };
  details: string;
  severity: AuditSeverity;
  previousState?: Record<string, any> | null;
  newState?: Record<string, any> | null;
  metadata?: {
    ipAddress?: string;
    terminalId?: string;
    cameraId?: string;
    verifiedHash?: string;
  };
}

export interface AuditStats {
  totalEvents: number;
  criticalEvents: number;
  anomaliesDetected: number;
  systemIntegrity: number;
}
