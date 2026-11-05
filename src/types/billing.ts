export type InvoiceStatus = 'draft' | 'pending' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'upi' | 'credit_card';
export type PaymentStatus = 'pending' | 'partial' | 'completed' | 'refunded';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerAddress?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerGST?: string;
  tripIds: string[];
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber?: string;
  date: string;
  status: PaymentStatus;
  notes?: string;
  createdAt: string;
}

export interface CustomerStatement {
  customerId: string;
  customerName: string;
  customerAddress?: string;
  periodStart: string;
  periodEnd: string;
  openingBalance: number;
  totalInvoiced: number;
  totalPayments: number;
  closingBalance: number;
  transactions: StatementTransaction[];
}

export interface StatementTransaction {
  date: string;
  description: string;
  type: 'invoice' | 'payment' | 'credit_note';
  referenceNumber: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface BillingStats {
  totalInvoices: number;
  draftInvoices: number;
  pendingInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  totalRevenue: number;
  totalOutstanding: number;
  avgPaymentDays: number;
}

export interface InvoiceFormData {
  customerId: string;
  customerName: string;
  customerAddress?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerGST?: string;
  tripIds: string[];
  items: Omit<InvoiceItem, 'id'>[];
  discountAmount: number;
  dueDate: string;
  notes?: string;
  terms?: string;
}
