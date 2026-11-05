import { useState, useEffect, useCallback } from 'react';
import { CustomerDelivery, ProofOfDelivery, CustomerInvoice, CustomerMessage, MessageReply } from '@/types/customer';

const STORAGE_KEY_DELIVERIES = 'rmc_customer_deliveries';
const STORAGE_KEY_MESSAGES = 'rmc_customer_messages';

const getRelativeDateISO = (hoursDelta: number): string => {
  return new Date(Date.now() + hoursDelta * 60 * 60 * 1000).toISOString();
};

const initialMockDeliveries: CustomerDelivery[] = [
  {
    id: 'del-001',
    orderNumber: 'ORD-2026-089',
    tripId: 'TRIP-001',
    material: 'M25 Ready-Mix Concrete (Pumpable)',
    quantity: 18,
    unit: 'ton',
    origin: 'RMC Plant 1 - Hadapsar Batching Center',
    destination: 'Godrej Woods Site B, Bandra East, Mumbai',
    customerName: 'BuildCorp Infrastructure Ltd',
    status: 'in_transit',
    orderDate: getRelativeDateISO(-4),
    dispatchDate: getRelativeDateISO(-1.5),
    estimatedDelivery: getRelativeDateISO(1.2),
    vehicleRegNo: 'MH12AB1234',
    driverName: 'Rajesh Kumar',
    driverPhone: '+91-9876543210',
    currentLocation: {
      latitude: 19.0600,
      longitude: 72.8650,
      lastUpdate: new Date().toISOString(),
    },
    progress: 72,
    podAvailable: false,
    invoiceAvailable: true,
  },
  {
    id: 'del-002',
    orderNumber: 'ORD-2026-085',
    tripId: 'TRIP-002',
    material: 'M30 High-Durability Concrete',
    quantity: 24,
    unit: 'ton',
    origin: 'RMC Plant 2 - Hinjewadi Terminal',
    destination: 'Metro Line Pier #42, Andheri West, Mumbai',
    customerName: 'L&T Construction Div',
    status: 'delivered',
    orderDate: getRelativeDateISO(-28),
    dispatchDate: getRelativeDateISO(-26),
    estimatedDelivery: getRelativeDateISO(-23),
    actualDelivery: getRelativeDateISO(-23),
    vehicleRegNo: 'MH14CD5678',
    driverName: 'Suresh Patil',
    driverPhone: '+91-8765432109',
    currentLocation: {
      latitude: 19.1136,
      longitude: 72.8697,
      lastUpdate: getRelativeDateISO(-23),
    },
    progress: 100,
    podAvailable: true,
    invoiceAvailable: true,
  },
  {
    id: 'del-003',
    orderNumber: 'ORD-2026-092',
    tripId: 'TRIP-003',
    material: 'M35 Pre-Cast Grade Concrete',
    quantity: 16,
    unit: 'ton',
    origin: 'RMC Plant 1 - Hadapsar Batching Center',
    destination: 'Commercial Complex, BKC G-Block, Mumbai',
    customerName: 'Shapoorji Pallonji Real Estate',
    status: 'dispatched',
    orderDate: getRelativeDateISO(-2),
    dispatchDate: getRelativeDateISO(-0.5),
    estimatedDelivery: getRelativeDateISO(2.5),
    vehicleRegNo: 'MH43EF9012',
    driverName: 'Amit Sharma',
    driverPhone: '+91-9876543213',
    currentLocation: {
      latitude: 19.0176,
      longitude: 72.8561,
      lastUpdate: new Date().toISOString(),
    },
    progress: 25,
    podAvailable: false,
    invoiceAvailable: true,
  },
  {
    id: 'del-004',
    orderNumber: 'ORD-2026-095',
    material: 'M20 Flooring Screed Concrete',
    quantity: 12,
    unit: 'ton',
    origin: 'RMC Plant 1 - Hadapsar Batching Center',
    destination: 'Warehouse Logistics Park, Bhiwandi',
    customerName: 'Nexus Logistic Hubs',
    status: 'pending',
    orderDate: getRelativeDateISO(-1),
    estimatedDelivery: getRelativeDateISO(20),
    progress: 0,
    podAvailable: false,
    invoiceAvailable: false,
  },
];

const initialMockMessages: CustomerMessage[] = [
  {
    id: 'msg-001',
    subject: 'Batch Slump Test & On-Site Pump ETA for ORD-2026-089',
    message: 'Hello Operations, please confirm the initial batch slump test mm reading and if the transit mixer will arrive with retarder admixture active.',
    category: 'delivery',
    status: 'in_progress',
    priority: 'high',
    createdAt: getRelativeDateISO(-2),
    updatedAt: getRelativeDateISO(-1),
    deliveryId: 'del-001',
    orderNumber: 'ORD-2026-089',
    replies: [
      {
        id: 'rep-001',
        messageId: 'msg-001',
        from: 'operations',
        message: 'Batch QC confirmed slump at 135mm at plant gate with Sika Plastocrete retarder dosed for 3.5 hr retention. Mixer MH12AB1234 is currently 8 km from site.',
        timestamp: getRelativeDateISO(-1),
      },
    ],
  },
  {
    id: 'msg-002',
    subject: 'Tax Invoice GST Breakdown for ORD-2026-085',
    message: 'We require the signed e-way bill copy and tax invoice with HSN code 38245010 for our accounts department.',
    category: 'billing',
    status: 'resolved',
    priority: 'medium',
    createdAt: getRelativeDateISO(-25),
    updatedAt: getRelativeDateISO(-24),
    deliveryId: 'del-002',
    orderNumber: 'ORD-2026-085',
    replies: [
      {
        id: 'rep-002',
        messageId: 'msg-002',
        from: 'operations',
        message: 'Invoice INV-2026-085 has been generated with 18% GST (9% CGST + 9% SGST) and linked to your customer portal. You can view or download it now.',
        timestamp: getRelativeDateISO(-24),
      },
    ],
  },
];

export const useCustomerPortal = () => {
  const [deliveries, setDeliveries] = useState<CustomerDelivery[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DELIVERIES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialMockDeliveries;
  });

  const [messages, setMessages] = useState<CustomerMessage[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialMockMessages;
  });

  const [loading, setLoading] = useState(false);

  const persistMessages = useCallback((newMessages: CustomerMessage[]) => {
    setMessages(newMessages);
    try {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(newMessages));
    } catch (e) {}
  }, []);

  const persistDeliveries = useCallback((newDeliveries: CustomerDelivery[]) => {
    setDeliveries(newDeliveries);
    try {
      localStorage.setItem(STORAGE_KEY_DELIVERIES, JSON.stringify(newDeliveries));
    } catch (e) {}
  }, []);

  const getPOD = useCallback((deliveryId: string): ProofOfDelivery | null => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery || !delivery.podAvailable) return null;

    return {
      id: `pod-${deliveryId}`,
      deliveryId,
      orderNumber: delivery.orderNumber,
      deliveredAt: delivery.actualDelivery || new Date().toISOString(),
      recipientName: 'Er. Sandeep Deshmukh (Site In-Charge)',
      recipientSignature: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xMCA1MCBDIDQwIDEwLCA4MCA3MCwgMTEwIDIwIFMgMTUwIDcwLCAxOTAgMzAiIHN0cm9rZT0iIzFkNGVkOCIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIi8+PC9zdmc+',
      photos: [
        'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
      ],
      weighSlipUrl: '#',
      notes: 'Concrete poured with mobile boom pump. Slump test verified 125mm. 6 concrete test cubes cast on site. Unloading duration 42 mins. Zero segregation observed.',
      vehicleRegNo: delivery.vehicleRegNo || 'MH14CD5678',
      driverName: delivery.driverName || 'Suresh Patil',
      material: delivery.material,
      quantity: delivery.quantity,
      unit: delivery.unit,
    };
  }, [deliveries]);

  const getInvoice = useCallback((deliveryId: string): CustomerInvoice | null => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery || !delivery.invoiceAvailable) return null;

    const ratePerTon = 4850;
    const subtotal = delivery.quantity * ratePerTon;
    const taxAmount = Math.round(subtotal * 0.18); // 18% GST (CGST 9% + SGST 9%)
    const total = subtotal + taxAmount;

    return {
      id: `inv-${deliveryId}`,
      invoiceNumber: `INV-2026-${delivery.orderNumber.replace(/[^0-9]/g, '').slice(-3) || '101'}`,
      deliveryId,
      orderNumber: delivery.orderNumber,
      issueDate: delivery.actualDelivery || delivery.dispatchDate || delivery.orderDate,
      dueDate: getRelativeDateISO(24 * 30),
      amount: subtotal,
      currency: 'INR',
      status: delivery.status === 'delivered' ? 'paid' : 'pending',
      paidDate: delivery.status === 'delivered' ? delivery.actualDelivery : undefined,
      material: delivery.material,
      quantity: delivery.quantity,
      unit: delivery.unit,
      unitPrice: ratePerTon,
      taxAmount,
      totalAmount: total,
      downloadUrl: '#',
    };
  }, [deliveries]);

  const createMessage = useCallback((messageData: Omit<CustomerMessage, 'id' | 'createdAt' | 'updatedAt' | 'replies' | 'status'>) => {
    const newMessage: CustomerMessage = {
      ...messageData,
      id: `msg-${Date.now()}`,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replies: [],
    };
    const updated = [newMessage, ...messages];
    persistMessages(updated);

    // Audit Event
    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'customer',
        action: 'CREATED',
        entityId: newMessage.id,
        entityType: 'Customer Message',
        details: `Customer submitted inquiry: "${newMessage.subject}" (Order: ${newMessage.orderNumber || 'General'})`,
        severity: 'info',
        performedBy: { id: 'CUST-PORTAL', name: 'Customer Representative', role: 'Client' }
      }
    }));

    return newMessage;
  }, [messages, persistMessages]);

  const replyToMessage = useCallback((messageId: string, replyText: string, from: 'customer' | 'operations' = 'customer') => {
    const updated = messages.map(m => {
      if (m.id !== messageId) return m;
      const newReply: MessageReply = {
        id: `rep-${Date.now()}`,
        messageId,
        from,
        message: replyText,
        timestamp: new Date().toISOString(),
      };
      return {
        ...m,
        status: from === 'operations' ? ('in_progress' as const) : m.status,
        updatedAt: new Date().toISOString(),
        replies: [...m.replies, newReply],
      };
    });
    persistMessages(updated);

    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'customer',
        action: 'UPDATED',
        entityId: messageId,
        entityType: 'Customer Message',
        details: `New reply added to message #${messageId} from ${from}`,
        severity: 'info',
        performedBy: { id: 'CUST-PORTAL', name: 'Portal User', role: from }
      }
    }));
  }, [messages, persistMessages]);

  const resolveMessage = useCallback((messageId: string) => {
    const updated = messages.map(m => {
      if (m.id !== messageId) return m;
      return {
        ...m,
        status: 'resolved' as const,
        updatedAt: new Date().toISOString(),
      };
    });
    persistMessages(updated);
  }, [messages, persistMessages]);

  return {
    deliveries,
    messages,
    loading,
    getPOD,
    getInvoice,
    createMessage,
    replyToMessage,
    resolveMessage,
  };
};
