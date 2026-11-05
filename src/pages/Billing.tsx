import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useBilling } from "@/hooks/useBilling";
import { InvoiceFormDialog } from "@/components/billing/InvoiceFormDialog";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { 
  FileText, 
  CreditCard, 
  AlertCircle, 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Search, 
  Download, 
  Eye, 
  Printer, 
  Receipt,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { Invoice, Payment } from "@/types/billing";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  sent: { label: "Sent", className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  overdue: { label: "Overdue", className: "bg-rose-500/10 text-rose-600 border-rose-500/30" },
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground border-border" },
};

export default function Billing() {
  const [formOpen, setFormOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Payment Form state
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<Payment['method']>('bank_transfer');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const { 
    invoices, 
    payments, 
    stats, 
    recordPayment, 
    createInvoice, 
    updateInvoice, 
    deleteInvoice 
  } = useBilling();

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch = 
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.customerGST && inv.customerGST.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const handleEdit = (invoice: Invoice) => {
    setEditInvoice(invoice);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (editInvoice) {
      await updateInvoice(editInvoice.id, {
        notes: data.notes,
        terms: data.terms,
      });
    } else {
      await createInvoice(data);
    }
    setEditInvoice(null);
  };

  const handleConfirmDelete = async () => {
    if (deleteInvoiceId) {
      await deleteInvoice(deleteInvoiceId);
      setDeleteInvoiceId(null);
    }
  };

  const openPaymentDialog = (invoice: Invoice) => {
    setPaymentInvoice(invoice);
    setPaymentAmount(invoice.balanceAmount);
    setPaymentMethod('bank_transfer');
    setPaymentRef(`RTGS-${Date.now().toString().slice(-6)}`);
    setPaymentNotes('Direct bank settlement');
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;
    if (paymentAmount <= 0) {
      toast.error('Payment amount must be greater than zero');
      return;
    }

    await recordPayment(
      paymentInvoice.id,
      paymentAmount,
      paymentMethod,
      paymentRef,
      paymentNotes
    );
    setPaymentInvoice(null);
  };

  const handleExportCSV = () => {
    if (invoices.length === 0) return;
    const headers = ['Invoice #', 'Customer', 'GSTIN', 'Issue Date', 'Due Date', 'Subtotal', 'Tax (18%)', 'Total', 'Paid', 'Balance', 'Status'];
    const rows = invoices.map(i => [
      i.invoiceNumber,
      `"${i.customerName}"`,
      i.customerGST || 'N/A',
      i.issueDate,
      i.dueDate,
      i.subtotal,
      i.taxAmount,
      i.totalAmount,
      i.paidAmount,
      i.balanceAmount,
      i.status.toUpperCase()
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rmc_invoices_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    toast.success('Invoices exported to CSV');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Receipt className="h-8 w-8 text-primary" />
            Billing & Commercial Invoicing
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage commercial GST invoices, batch receipts, and outstanding account balances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => { setEditInvoice(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      <InvoiceFormDialog
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditInvoice(null); }}
        onSubmit={handleFormSubmit}
        editInvoice={editInvoice}
      />

      <ConfirmDeleteDialog
        open={!!deleteInvoiceId}
        onOpenChange={(open) => !open && setDeleteInvoiceId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Invoice"
        description="Are you sure you want to delete this invoice? This action cannot be undone."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingInvoices} pending settlement</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Collected Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.paidInvoices} fully settled</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">₹{stats.totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Accounts receivable balance</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{stats.overdueInvoices}</div>
            <p className="text-xs text-muted-foreground">Requires immediate collection</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
            <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice, customer..."
                className="pl-9 h-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <TabsContent value="invoices" className="space-y-3">
          {filteredInvoices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-semibold text-foreground">No invoices found matching criteria</p>
              </CardContent>
            </Card>
          ) : (
            filteredInvoices.map((invoice) => {
              const statusCfg = statusConfig[invoice.status] || statusConfig.draft;

              return (
                <Card key={invoice.id} className="hover:border-primary/40 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left info */}
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-base tracking-tight">
                              {invoice.invoiceNumber}
                            </span>
                            <Badge variant="outline" className={statusCfg.className}>
                              {statusCfg.label}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground/90 mt-0.5">
                            {invoice.customerName}
                          </p>
                          {invoice.customerGST && (
                            <p className="text-xs text-muted-foreground font-mono">
                              GSTIN: {invoice.customerGST}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Middle financial metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground block">Total Amount</span>
                          <span className="font-bold text-foreground text-sm">
                            ₹{invoice.totalAmount.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Received</span>
                          <span className="font-semibold text-emerald-600 text-sm">
                            ₹{invoice.paidAmount.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Balance Due</span>
                          <span className={`font-semibold text-sm ${invoice.balanceAmount > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                            ₹{invoice.balanceAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Right timeline and action buttons */}
                      <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0">
                        <div className="text-right text-xs text-muted-foreground min-w-[90px]">
                          <div>Issued: {format(new Date(invoice.issueDate), 'dd MMM yyyy')}</div>
                          <div className={invoice.status === 'overdue' ? 'text-rose-600 font-semibold' : ''}>
                            Due: {format(new Date(invoice.dueDate), 'dd MMM yyyy')}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 text-xs"
                            onClick={() => setViewInvoice(invoice)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>

                          {invoice.balanceAmount > 0 && (
                            <Button 
                              size="sm" 
                              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => openPaymentDialog(invoice)}
                            >
                              <CreditCard className="h-3.5 w-3.5 mr-1" />
                              Pay
                            </Button>
                          )}

                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => handleEdit(invoice)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive/80 hover:text-destructive"
                            onClick={() => setDeleteInvoiceId(invoice.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-3">
          {payments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>No payments recorded yet</p>
              </CardContent>
            </Card>
          ) : (
            payments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <CreditCard className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{payment.customerName}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        Ref: {payment.referenceNumber} • Against {payment.invoiceNumber}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <Badge variant="outline" className="capitalize text-xs">
                      {payment.method.replace('_', ' ')}
                    </Badge>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600 text-base">
                        ₹{payment.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(payment.date), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Record Payment Dialog */}
      <Dialog open={!!paymentInvoice} onOpenChange={(open) => !open && setPaymentInvoice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              Record Client Payment
            </DialogTitle>
            <DialogDescription>
              Post payment against {paymentInvoice?.invoiceNumber} ({paymentInvoice?.customerName})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 py-2">
            <div className="p-3 bg-muted/50 rounded-lg text-sm flex justify-between">
              <span className="text-muted-foreground">Outstanding Balance:</span>
              <span className="font-bold text-amber-600">₹{paymentInvoice?.balanceAmount.toLocaleString()}</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payAmount">Payment Amount (₹) *</Label>
              <Input
                id="payAmount"
                type="number"
                min="1"
                max={paymentInvoice?.balanceAmount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payMethod">Payment Mode</Label>
              <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                <SelectTrigger id="payMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer (RTGS / NEFT)</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="upi">UPI / Online Gateway</SelectItem>
                  <SelectItem value="cash">Cash Counter Receipt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payRef">Bank UTR / Cheque / Transaction Ref</Label>
              <Input
                id="payRef"
                placeholder="e.g. AXISN2026090123"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payNotes">Payment Notes</Label>
              <Input
                id="payNotes"
                placeholder="Optional memo..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setPaymentInvoice(null)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Confirm & Post Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Tax Invoice Dialog */}
      <Dialog open={!!viewInvoice} onOpenChange={(open) => !open && setViewInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Commercial Tax Invoice
              </DialogTitle>
              {viewInvoice && (
                <Badge variant="outline" className={statusConfig[viewInvoice.status]?.className}>
                  {statusConfig[viewInvoice.status]?.label}
                </Badge>
              )}
            </div>
            <DialogDescription>
              GST Compliant Tax Invoice generated under Section 31 of CGST Act
            </DialogDescription>
          </DialogHeader>

          {viewInvoice && (
            <div className="space-y-5 text-sm">
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Billed To</p>
                  <p className="font-bold text-foreground text-base mt-0.5">{viewInvoice.customerName}</p>
                  <p className="text-xs text-muted-foreground">{viewInvoice.customerAddress || 'Client Project Site'}</p>
                  <p className="text-xs font-mono mt-1">GSTIN: {viewInvoice.customerGST || 'URP'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Invoice Details</p>
                  <p className="font-bold text-foreground text-base mt-0.5">{viewInvoice.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">Date: {format(new Date(viewInvoice.issueDate), 'dd MMM yyyy')}</p>
                  <p className="text-xs text-muted-foreground">Due: {format(new Date(viewInvoice.dueDate), 'dd MMM yyyy')}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted text-muted-foreground font-semibold">
                    <tr>
                      <th className="text-left p-2.5">Item Description</th>
                      <th className="text-right p-2.5">Qty</th>
                      <th className="text-right p-2.5">Rate (₹)</th>
                      <th className="text-right p-2.5">Tax (18%)</th>
                      <th className="text-right p-2.5">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {viewInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium">{item.description}</td>
                        <td className="p-2.5 text-right">{item.quantity} {item.unit}</td>
                        <td className="p-2.5 text-right">₹{item.unitPrice.toLocaleString()}</td>
                        <td className="p-2.5 text-right">₹{item.taxAmount.toLocaleString()}</td>
                        <td className="p-2.5 text-right font-semibold">₹{item.totalAmount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxable Value (Subtotal):</span>
                  <span>₹{viewInvoice.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CGST (9%):</span>
                  <span>₹{(viewInvoice.taxAmount / 2).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SGST (9%):</span>
                  <span>₹{(viewInvoice.taxAmount / 2).toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-bold text-foreground pt-1">
                  <span>Grand Total:</span>
                  <span className="text-primary text-base">₹{viewInvoice.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-600 font-medium">
                  <span>Amount Paid:</span>
                  <span>₹{viewInvoice.paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-amber-600 font-bold">
                  <span>Balance Due:</span>
                  <span>₹{viewInvoice.balanceAmount.toLocaleString()}</span>
                </div>
              </div>

              {viewInvoice.notes && (
                <div className="p-2.5 bg-muted/40 rounded text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Notes: </span>
                  {viewInvoice.notes}
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Tax Invoice
                </Button>
                <Button onClick={() => setViewInvoice(null)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
