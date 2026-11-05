export type IncidentType = 
  | 'safety' 
  | 'quality' 
  | 'operational' 
  | 'security' 
  | 'environmental' 
  | 'equipment';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IncidentStatus = 
  | 'reported' 
  | 'investigating' 
  | 'resolved' 
  | 'closed';

export interface EvidenceAttachment {
  id: string;
  type: 'image' | 'video' | 'document';
  url: string;
  thumbnail?: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  description?: string;
}

export interface IncidentComment {
  id: string;
  userId: string;
  userName: string;
  comment: string;
  timestamp: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: string;
  reportedBy: string;
  reportedAt: string;
  assignedTo?: string;
  assignedAt?: string;
  investigationNotes?: string;
  resolvedAt?: string;
  resolution?: string;
  evidence: EvidenceAttachment[];
  comments: IncidentComment[];
  vehicleRegNo?: string;
  relatedModule?: 'gate' | 'weighbridge' | 'loading' | 'dispatch' | 'trip' | 'exit';
  tags?: string[];
}

export interface CreateIncidentInput {
  title: string;
  description: string;
  type: IncidentType;
  severity: IncidentSeverity;
  location: string;
  vehicleRegNo?: string;
  relatedModule?: Incident['relatedModule'];
  tags?: string[];
}
