import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CustomerInvoice } from "@/types/customer";
import { Download, FileText, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface InvoiceViewerProps {
  invoice: CustomerInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InvoiceViewer = ({ invoice, open, onOpenChange }: InvoiceViewerProps) => {
  if (!invoice) return null;

  const getStatusColor = (status: CustomerInvoice['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      case 'overdue':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      case 'cancelled':
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Invoice {invoice.invoiceNumber}
            </DialogTitle>
            <Badge className={getStatusColor(invoice.status)}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Invoice Number</p>
              <p className="font-medium">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Order Number</p>
              <p className="font-medium">{invoice.orderNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Issue Date</p>
              <p className="font-medium">{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Due Date</p>
              <p className="font-medium">{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="font-semibold">Item Details</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">Description</th>
                    <th className="text-right p-3">Quantity</th>
                    <th className="text-right p-3">Unit Price</th>
                    <th className="text-right p-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-3">{invoice.material}</td>
                    <td className="text-right p-3">{invoice.quantity} {invoice.unit}</td>
                    <td className="text-right p-3">
                      {invoice.currency} {invoice.unitPrice.toLocaleString()}
                    </td>
                    <td className="text-right p-3 font-medium">
                      {invoice.currency} {invoice.amount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">
                {invoice.currency} {invoice.amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (18% GST)</span>
              <span className="font-medium">
                {invoice.currency} {invoice.taxAmount.toLocaleString()}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="font-semibold">Total Amount</span>
              <span className="text-xl font-bold text-primary">
                {invoice.currency} {invoice.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {invoice.paidDate && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-1">
                <DollarSign className="h-5 w-5" />
                <span className="font-semibold">Payment Received</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-500">
                Paid on {format(new Date(invoice.paidDate), 'MMM dd, yyyy')}
              </p>
            </div>
          )}

          {invoice.downloadUrl && (
            <Button className="w-full" asChild>
              <a href={invoice.downloadUrl} download>
                <Download className="h-4 w-4 mr-2" />
                Download Invoice PDF
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceViewer;
