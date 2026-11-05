export interface DeliveryDocumentation {
  id: string;
  type: 'weigh_slip' | 'quality_cert' | 'invoice' | 'delivery_note';
  url: string;
  timestamp: string;
  verified: boolean;
}

export interface RouteAssignment {
  routeId: string;
  destination: string;
  distance: number;
  estimatedTime: number;
  driver: string;
  driverPhone: string;
}

export interface PlateImage {
  id: string;
  angle: 'front' | 'back';
  url: string;
  timestamp: string;
}

export interface PendingDispatch {
  id: string;
  vehicleRegNo: string;
  timestamp: string;
  material: string;
  quantity: number;
  unit: 'kg' | 'ton';
  customer: string;
  documentation: DeliveryDocumentation[];
  route?: RouteAssignment;
  plateImages: PlateImage[];
  status: 'pending' | 'approved' | 'rejected' | 'dispatched';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface ApprovalAction {
  dispatchId: string;
  action: 'approve' | 'reject';
  reason?: string;
  route?: RouteAssignment;
}
