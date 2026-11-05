export interface CustomerDelivery {
  id: string;
  orderNumber: string;
  tripId?: string;
  material: string;
  quantity: number;
  unit: 'kg' | 'ton';
  origin: string;
  destination: string;
  customerName: string;
  status: 'pending' | 'dispatched' | 'in_transit' | 'delivered' | 'cancelled';
  orderDate: string;
  dispatchDate?: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  vehicleRegNo?: string;
  driverName?: string;
  driverPhone?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    lastUpdate: string;
  };
  progress?: number; // 0-100
  podAvailable: boolean;
  invoiceAvailable: boolean;
}

export interface ProofOfDelivery {
  id: string;
  deliveryId: string;
  orderNumber: string;
  deliveredAt: string;
  recipientName: string;
  recipientSignature?: string;
  photos: string[];
  weighSlipUrl?: string;
  notes?: string;
  vehicleRegNo: string;
  driverName: string;
  material: string;
  quantity: number;
  unit: 'kg' | 'ton';
}

export interface CustomerInvoice {
  id: string;
  invoiceNumber: string;
  deliveryId: string;
  orderNumber: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paidDate?: string;
  material: string;
  quantity: number;
  unit: 'kg' | 'ton';
  unitPrice: number;
  taxAmount: number;
  totalAmount: number;
  downloadUrl?: string;
}

export interface CustomerMessage {
  id: string;
  subject: string;
  message: string;
  category: 'general' | 'delivery' | 'billing' | 'complaint';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  deliveryId?: string;
  orderNumber?: string;
  replies: MessageReply[];
}

export interface MessageReply {
  id: string;
  messageId: string;
  from: 'customer' | 'operations';
  message: string;
  timestamp: string;
  attachments?: string[];
}
