import { useState, useCallback, useEffect } from 'react';
import { 
  Invoice, 
  Payment, 
  CustomerStatement, 
  BillingStats, 
  InvoiceFormData,
  StatementTransaction 
} from '@/types/billing';
import { toast } from 'sonner';
import { api } from '@/lib/api';

const STORAGE_KEY_INVOICES = 'rmc_invoices_data';
const STORAGE_KEY_PAYMENTS = 'rmc_payments_data';

const getRelativeDateStr = (daysDelta: number): string => {
  const d = new Date(Date.now() + daysDelta * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
};

const initialMockInvoices: Invoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2026-001',
    customerId: 'cust-01',
    customerName: 'BuildCorp Infrastructure Ltd',
    customerAddress: 'Tower B, Bandra-Kurla Complex, Mumbai - 400051',
    customerEmail: 'billing@buildcorp.in',
    customerPhone: '+91 98201 12345',
    customerGST: '27AABCB1234F1Z5',
    tripIds: ['TRIP-001'],
    items: [
      {
        id: 'item-1',
        description: 'M25 Ready-Mix Concrete (Pumpable Mix)',
        quantity: 45,
        unit: 'm³',
        unitPrice: 4200,
        amount: 189000,
        taxRate: 18,
        taxAmount: 34020,
        totalAmount: 223020,
      },
      {
        id: 'item-2',
        description: 'Stationary Concrete Pump Pumping Charges',
        quantity: 45,
        unit: 'm³',
        unitPrice: 250,
        amount: 11250,
        taxRate: 18,
        taxAmount: 2025,
        totalAmount: 13275,
      }
    ],
    subtotal: 200250,
    taxAmount: 36045,
    discountAmount: 0,
    totalAmount: 236295,
    paidAmount: 236295,
    balanceAmount: 0,
    status: 'paid',
    issueDate: getRelativeDateStr(-25),
    dueDate: getRelativeDateStr(5),
    paidDate: getRelativeDateStr(-20),
    notes: 'Material delivered to Godrej Woods Site B, Bandra East. QC cube tests passed.',
    terms: 'Payment due within 30 days. Interest @ 18% p.a. applicable post due date.',
    createdAt: getRelativeDateStr(-25),
    updatedAt: getRelativeDateStr(-20),
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2026-002',
    customerId: 'cust-02',
    customerName: 'L&T Construction (Metro Division)',
    customerAddress: 'Metro Line Pier #42 Site Office, Andheri West, Mumbai',
    customerEmail: 'procurement.metro@lntecc.com',
    customerPhone: '+91 98202 23456',
    customerGST: '27AABCL5678M1Z8',
    tripIds: ['TRIP-002'],
    items: [
      {
        id: 'item-3',
        description: 'M30 High-Durability Ready-Mix Concrete',
        quantity: 60,
        unit: 'm³',
        unitPrice: 4600,
        amount: 276000,
        taxRate: 18,
        taxAmount: 49680,
        totalAmount: 325680,
      }
    ],
    subtotal: 276000,
    taxAmount: 49680,
    discountAmount: 0,
    totalAmount: 325680,
    paidAmount: 200000,
    balanceAmount: 125680,
    status: 'pending',
    issueDate: getRelativeDateStr(-14),
    dueDate: getRelativeDateStr(16),
    notes: 'Pier casting batch. Delivery ticket #DK-2026-092 verified by consultant.',
    terms: 'Net 30 days payment terms via RTGS / NEFT.',
    createdAt: getRelativeDateStr(-14),
    updatedAt: getRelativeDateStr(-14),
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2026-003',
    customerId: 'cust-03',
    customerName: 'Shapoorji Pallonji Real Estate',
    customerAddress: 'SP Centre, 41/44 Minoo Desai Marg, Colaba, Mumbai',
    customerEmail: 'accounts@shapoorji.com',
    customerPhone: '+91 98203 34567',
    customerGST: '27AABCS9012K1Z2',
    tripIds: ['TRIP-003'],
    items: [
      {
        id: 'item-4',
        description: 'M35 Pre-Cast High Strength Concrete Mix',
        quantity: 32,
        unit: 'm³',
        unitPrice: 5100,
        amount: 163200,
        taxRate: 18,
        taxAmount: 29376,
        totalAmount: 192576,
      }
    ],
    subtotal: 163200,
    taxAmount: 29376,
    discountAmount: 0,
    totalAmount: 192576,
    paidAmount: 0,
    balanceAmount: 192576,
    status: 'sent',
    issueDate: getRelativeDateStr(-8),
    dueDate: getRelativeDateStr(22),
    notes: 'BKC Commercial Tower Basement Raft Pour.',
    terms: 'Strict 30 days credit.',
    createdAt: getRelativeDateStr(-8),
    updatedAt: getRelativeDateStr(-8),
  },
  {
    id: 'inv-004',
    invoiceNumber: 'INV-2026-004',
    customerId: 'cust-04',
    customerName: 'Godrej Properties Ltd',
    customerAddress: 'Godrej One, 5th Floor, Pirojshanagar, Vikhroli, Mumbai',
    customerEmail: 'invoices@godrejproperties.com',
    customerPhone: '+91 98204 45678',
    customerGST: '27AABCG3456H1Z9',
    tripIds: [],
    items: [
      {
        id: 'item-5',
        description: 'M20 Pavement & Flooring Concrete',
        quantity: 25,
        unit: 'm³',
        unitPrice: 4000,
        amount: 100000,
        taxRate: 18,
        taxAmount: 18000,
        totalAmount: 118000,
      }
    ],
    subtotal: 100000,
    taxAmount: 18000,
    discountAmount: 0,
    totalAmount: 118000,
    paidAmount: 0,
    balanceAmount: 118000,
    status: 'overdue',
    issueDate: getRelativeDateStr(-42),
    dueDate: getRelativeDateStr(-12), // Overdue by 12 days
    notes: 'Immediate payment follow-up requested by finance team.',
    terms: 'Overdue accounts subject to delivery suspension.',
    createdAt: getRelativeDateStr(-42),
    updatedAt: getRelativeDateStr(-12),
  },
  {
    id: 'inv-005',
    invoiceNumber: 'INV-2026-005',
    customerId: 'cust-05',
    customerName: 'Tata Projects Ltd',
    customerAddress: 'Mithona Towers, Preet Vihar, Thane West',
    customerEmail: 'finance.infra@tataprojects.com',
    customerPhone: '+91 98205 56789',
    customerGST: '27AABCT7890N1Z3',
    tripIds: [],
    items: [
      {
        id: 'item-6',
        description: 'M40 Heavy Bridge Girder Concrete with Microsilica',
        quantity: 80,
        unit: 'm³',
        unitPrice: 5800,
        amount: 464000,
        taxRate: 18,
        taxAmount: 83520,
        totalAmount: 547520,
      }
    ],
    subtotal: 464000,
    taxAmount: 83520,
    discountAmount: 0,
    totalAmount: 547520,
    paidAmount: 547520,
    balanceAmount: 0,
    status: 'paid',
    issueDate: getRelativeDateStr(-18),
    dueDate: getRelativeDateStr(12),
    paidDate: getRelativeDateStr(-15),
    notes: 'Thane Coastal Road Flyover Girder Batching.',
    terms: 'Approved vendor terms.',
    createdAt: getRelativeDateStr(-18),
    updatedAt: getRelativeDateStr(-15),
  },
];

const initialMockPayments: Payment[] = [
  {
    id: 'pay-001',
    invoiceId: 'inv-001',
    invoiceNumber: 'INV-2026-001',
    customerId: 'cust-01',
    customerName: 'BuildCorp Infrastructure Ltd',
    amount: 236295,
    method: 'bank_transfer',
    referenceNumber: 'AXISRTGS2026090123',
    date: getRelativeDateStr(-20),
    status: 'completed',
    notes: 'Full payment cleared via RTGS',
    createdAt: getRelativeDateStr(-20),
  },
  {
    id: 'pay-002',
    invoiceId: 'inv-002',
    invoiceNumber: 'INV-2026-002',
    customerId: 'cust-02',
    customerName: 'L&T Construction (Metro Division)',
    amount: 200000,
    method: 'bank_transfer',
    referenceNumber: 'HDFCN2026101948',
    date: getRelativeDateStr(-5),
    status: 'completed',
    notes: 'Part payment tranche 1 cleared',
    createdAt: getRelativeDateStr(-5),
  },
  {
    id: 'pay-003',
    invoiceId: 'inv-005',
    invoiceNumber: 'INV-2026-005',
    customerId: 'cust-05',
    customerName: 'Tata Projects Ltd',
    amount: 547520,
    method: 'bank_transfer',
    referenceNumber: 'SBIN002938102',
    date: getRelativeDateStr(-15),
    status: 'completed',
    notes: 'Payment verified and credited to ICICI main account',
    createdAt: getRelativeDateStr(-15),
  },
];

export function useBilling() {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_INVOICES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialMockInvoices;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PAYMENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialMockPayments;
  });

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const persistInvoices = useCallback((newInvoices: Invoice[]) => {
    setInvoices(newInvoices);
    try {
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(newInvoices));
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('rmc-invoices-updated', { detail: newInvoices }));
  }, []);

  const persistPayments = useCallback((newPayments: Payment[]) => {
    setPayments(newPayments);
    try {
      localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(newPayments));
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('rmc-payments-updated', { detail: newPayments }));
  }, []);

  const fetchBillingData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getInvoices();
      if (data && Array.isArray(data) && data.length > 0) {
        setInvoices(data);
        localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(data));
      }
    } catch (err) {
      console.warn('API invoices fallback', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  const getStats = useCallback((): BillingStats => {
    const totalRevenue = invoices
      .filter(i => i.status === 'paid' || i.paidAmount > 0)
      .reduce((sum, i) => sum + i.paidAmount, 0);
    
    const totalOutstanding = invoices
      .filter(i => ['pending', 'sent', 'overdue'].includes(i.status))
      .reduce((sum, i) => sum + i.balanceAmount, 0);

    const paidInvoices = invoices.filter(i => i.status === 'paid');

    return {
      totalInvoices: invoices.length,
      draftInvoices: invoices.filter(i => i.status === 'draft').length,
      pendingInvoices: invoices.filter(i => i.status === 'pending' || i.status === 'sent').length,
      paidInvoices: paidInvoices.length,
      overdueInvoices: invoices.filter(i => i.status === 'overdue').length,
      totalRevenue: Math.round(totalRevenue),
      totalOutstanding: Math.round(totalOutstanding),
      avgPaymentDays: 14,
    };
  }, [invoices]);

  const createInvoice = useCallback(async (formData: InvoiceFormData) => {
    try {
      const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const taxAmount = formData.items.reduce((sum, item) => sum + ((item.quantity * item.unitPrice * (item.taxRate || 18)) / 100), 0);
      const totalAmount = subtotal + taxAmount - (formData.discountAmount || 0);

      const newInvNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;

      const newInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber: newInvNumber,
        customerId: formData.customerId || `cust-${Date.now()}`,
        customerName: formData.customerName,
        customerAddress: formData.customerAddress,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        customerGST: formData.customerGST,
        tripIds: formData.tripIds || [],
        items: formData.items.map((it, idx) => ({
          ...it,
          id: `item-${Date.now()}-${idx}`,
          amount: it.quantity * it.unitPrice,
          taxAmount: (it.quantity * it.unitPrice * (it.taxRate || 18)) / 100,
          totalAmount: (it.quantity * it.unitPrice) * 1.18,
        })),
        subtotal: Math.round(subtotal),
        taxAmount: Math.round(taxAmount),
        discountAmount: Number(formData.discountAmount || 0),
        totalAmount: Math.round(totalAmount),
        paidAmount: 0,
        balanceAmount: Math.round(totalAmount),
        status: 'pending',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: formData.dueDate || getRelativeDateStr(30),
        notes: formData.notes,
        terms: formData.terms || 'Payment due within 30 days',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = [newInvoice, ...invoices];
      persistInvoices(updated);

      try {
        api.createInvoice(newInvoice).catch(e => console.warn('API create invoice fallback', e));
      } catch (e) {
        console.warn('API invoice error', e);
      }

      toast.success(`Invoice ${newInvoice.invoiceNumber} created successfully`);

      // Audit Event
      window.dispatchEvent(new CustomEvent('rmc-audit-event', {
        detail: {
          module: 'billing',
          action: 'CREATED',
          entityId: newInvoice.id,
          entityType: 'Invoice',
          details: `Generated tax invoice ${newInvoice.invoiceNumber} for ${newInvoice.customerName} (₹${newInvoice.totalAmount.toLocaleString()})`,
          severity: 'info',
          performedBy: { id: 'ACCOUNTS-OFFICER', name: 'Commercial Billing Mgr', role: 'Finance' }
        }
      }));

      return newInvoice;
    } catch (error: any) {
      toast.error('Failed to create invoice');
      return null;
    }
  }, [invoices, persistInvoices]);

  const updateInvoice = useCallback(async (id: string, updates: Partial<Invoice>) => {
    let targetInv: Invoice | null = null;
    const updated = invoices.map(i => {
      if (i.id === id) {
        targetInv = { ...i, ...updates, updatedAt: new Date().toISOString() };
        return targetInv;
      }
      return i;
    });

    persistInvoices(updated);
    toast.success('Invoice updated successfully');

    if (targetInv) {
      window.dispatchEvent(new CustomEvent('rmc-audit-event', {
        detail: {
          module: 'billing',
          action: 'UPDATED',
          entityId: id,
          entityType: 'Invoice',
          details: `Updated invoice ${(targetInv as Invoice).invoiceNumber}`,
          severity: 'info',
          performedBy: { id: 'ACCOUNTS-OFFICER', name: 'Commercial Billing Mgr', role: 'Finance' }
        }
      }));
    }
  }, [invoices, persistInvoices]);

  const updateInvoiceStatus = useCallback(async (id: string, status: Invoice['status']) => {
    const updated = invoices.map(i => {
      if (i.id === id) {
        return {
          ...i,
          status,
          paidDate: status === 'paid' ? new Date().toISOString().split('T')[0] : i.paidDate,
          updatedAt: new Date().toISOString(),
        };
      }
      return i;
    });
    persistInvoices(updated);
    toast.success(`Invoice marked as ${status}`);
  }, [invoices, persistInvoices]);

  const deleteInvoice = useCallback(async (id: string) => {
    const target = invoices.find(i => i.id === id);
    const updated = invoices.filter(i => i.id !== id);
    persistInvoices(updated);
    toast.success('Invoice deleted');

    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'billing',
        action: 'DELETED',
        entityId: id,
        entityType: 'Invoice',
        details: `Deleted invoice ${target?.invoiceNumber || id}`,
        severity: 'warning',
        performedBy: { id: 'ACCOUNTS-OFFICER', name: 'Commercial Billing Mgr', role: 'Finance' }
      }
    }));
  }, [invoices, persistInvoices]);

  const recordPayment = useCallback(async (
    invoiceId: string, 
    amount: number, 
    method: Payment['method'], 
    referenceNumber?: string, 
    notes?: string
  ) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return null;

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      amount: Number(amount),
      method,
      referenceNumber: referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      notes,
      createdAt: new Date().toISOString(),
    };

    const newPaidAmount = Math.min(invoice.totalAmount, invoice.paidAmount + Number(amount));
    const newBalance = Math.max(0, invoice.totalAmount - newPaidAmount);
    const newStatus: Invoice['status'] = newBalance === 0 ? 'paid' : 'pending';

    const updatedInvoices = invoices.map(i => {
      if (i.id === invoiceId) {
        return {
          ...i,
          paidAmount: newPaidAmount,
          balanceAmount: newBalance,
          status: newStatus,
          paidDate: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : i.paidDate,
          updatedAt: new Date().toISOString(),
        };
      }
      return i;
    });

    persistInvoices(updatedInvoices);
    const updatedPayments = [newPayment, ...payments];
    persistPayments(updatedPayments);

    try {
      api.recordPayment({
        id: newPayment.id,
        invoiceId,
        amount: Number(amount),
        method,
        referenceNumber,
        notes
      }).catch(e => console.warn('API record payment fallback', e));
    } catch (e) {
      console.warn('API payment error', e);
    }

    toast.success(`Payment of ₹${Number(amount).toLocaleString()} recorded successfully`);

    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'billing',
        action: 'VERIFICATION_PASSED',
        entityId: newPayment.id,
        entityType: 'Payment',
        details: `Recorded payment of ₹${Number(amount).toLocaleString()} for ${invoice.invoiceNumber} (${method})`,
        severity: 'info',
        performedBy: { id: 'ACCOUNTS-OFFICER', name: 'Commercial Billing Mgr', role: 'Finance' }
      }
    }));

    return newPayment;
  }, [invoices, payments, persistInvoices, persistPayments]);

  const getCustomerStatement = useCallback((customerId: string, startDate: string, endDate: string): CustomerStatement | null => {
    const customerInvoices = invoices.filter(i => 
      i.customerId === customerId &&
      new Date(i.issueDate) >= new Date(startDate) &&
      new Date(i.issueDate) <= new Date(endDate)
    );

    const customerPayments = payments.filter(p =>
      p.customerId === customerId &&
      new Date(p.date) >= new Date(startDate) &&
      new Date(p.date) <= new Date(endDate)
    );

    if (customerInvoices.length === 0 && customerPayments.length === 0) return null;

    const customer = customerInvoices[0] || { customerName: '', customerAddress: '' };
    const transactions: StatementTransaction[] = [];
    let balance = 0;

    const allTransactions = [
      ...customerInvoices.map(i => ({ date: i.issueDate, type: 'invoice' as const, ref: i.invoiceNumber, amount: i.totalAmount })),
      ...customerPayments.map(p => ({ date: p.date, type: 'payment' as const, ref: p.referenceNumber || p.id, amount: p.amount })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    allTransactions.forEach(t => {
      if (t.type === 'invoice') {
        balance += t.amount;
        transactions.push({
          date: t.date,
          description: `Tax Invoice ${t.ref}`,
          type: 'invoice',
          referenceNumber: t.ref,
          debit: t.amount,
          credit: 0,
          balance,
        });
      } else {
        balance -= t.amount;
        transactions.push({
          date: t.date,
          description: `Payment Received (${t.ref})`,
          type: 'payment',
          referenceNumber: t.ref,
          debit: 0,
          credit: t.amount,
          balance,
        });
      }
    });

    return {
      customerId,
      customerName: customer.customerName,
      customerAddress: customer.customerAddress,
      periodStart: startDate,
      periodEnd: endDate,
      openingBalance: 0,
      totalInvoiced: customerInvoices.reduce((sum, i) => sum + i.totalAmount, 0),
      totalPayments: customerPayments.reduce((sum, p) => sum + p.amount, 0),
      closingBalance: balance,
      transactions,
    };
  }, [invoices, payments]);

  const getOverdueInvoices = useCallback(() => {
    const now = new Date();
    return invoices.filter(i => 
      ['pending', 'sent'].includes(i.status) &&
      new Date(i.dueDate) < now
    );
  }, [invoices]);

  const getCustomerInvoices = useCallback((customerId: string) => {
    return invoices.filter(i => i.customerId === customerId);
  }, [invoices]);

  const getInvoicePayments = useCallback((invoiceId: string) => {
    return payments.filter(p => p.invoiceId === invoiceId);
  }, [payments]);

  return {
    invoices,
    payments,
    selectedInvoice,
    setSelectedInvoice,
    isLoading,
    stats: getStats(),
    createInvoice,
    updateInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    recordPayment,
    getCustomerStatement,
    getOverdueInvoices,
    getCustomerInvoices,
    getInvoicePayments,
    refetch: fetchBillingData,
  };
}
