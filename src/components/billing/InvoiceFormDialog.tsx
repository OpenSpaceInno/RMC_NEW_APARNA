import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InvoiceFormData, Invoice } from "@/types/billing";
import { Plus, Trash2 } from "lucide-react";

interface InvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InvoiceFormData) => void;
  editInvoice?: Invoice | null;
}

const defaultFormData: InvoiceFormData = {
  customerId: "",
  customerName: "",
  customerAddress: "",
  customerEmail: "",
  customerPhone: "",
  customerGST: "",
  tripIds: [],
  items: [{ description: "", quantity: 1, unit: "units", unitPrice: 0, amount: 0, taxRate: 18, taxAmount: 0, totalAmount: 0 }],
  discountAmount: 0,
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  notes: "",
  terms: "Payment due within 30 days",
};

export function InvoiceFormDialog({ open, onOpenChange, onSubmit, editInvoice }: InvoiceFormDialogProps) {
  const [formData, setFormData] = useState<InvoiceFormData>(defaultFormData);

  useEffect(() => {
    if (editInvoice) {
      setFormData({
        customerId: editInvoice.customerId,
        customerName: editInvoice.customerName,
        customerAddress: editInvoice.customerAddress || "",
        customerEmail: editInvoice.customerEmail || "",
        customerPhone: editInvoice.customerPhone || "",
        customerGST: editInvoice.customerGST || "",
        tripIds: editInvoice.tripIds || [],
        items: editInvoice.items.length > 0 ? editInvoice.items : [{ description: "", quantity: 1, unit: "units", unitPrice: 0, amount: 0, taxRate: 18, taxAmount: 0, totalAmount: 0 }],
        discountAmount: editInvoice.discountAmount,
        dueDate: editInvoice.dueDate,
        notes: editInvoice.notes || "",
        terms: editInvoice.terms || "Payment due within 30 days",
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [editInvoice, open]);

  const updateItem = (index: number, field: string, value: any) => {
    const items = [...formData.items];
    items[index] = { ...items[index], [field]: value };
    
    // Recalculate amounts
    const amount = items[index].quantity * items[index].unitPrice;
    const taxAmount = (amount * items[index].taxRate) / 100;
    items[index].amount = amount;
    items[index].taxAmount = taxAmount;
    items[index].totalAmount = amount + taxAmount;
    
    setFormData({ ...formData, items });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, unit: "units", unitPrice: 0, amount: 0, taxRate: 18, taxAmount: 0, totalAmount: 0 }],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
    setFormData(defaultFormData);
  };

  const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
  const taxTotal = formData.items.reduce((sum, item) => sum + item.taxAmount, 0);
  const total = subtotal + taxTotal - formData.discountAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editInvoice ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value, customerId: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                placeholder="ABC Construction Ltd"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                value={formData.customerPhone || ""}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail || ""}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                placeholder="accounts@abc.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerGST">GST Number</Label>
              <Input
                id="customerGST"
                value={formData.customerGST || ""}
                onChange={(e) => setFormData({ ...formData, customerGST: e.target.value })}
                placeholder="27AAAAA0000A1Z5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerAddress">Address</Label>
            <Textarea
              id="customerAddress"
              value={formData.customerAddress || ""}
              onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
              placeholder="Full billing address..."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Invoice Items</Label>
              <Button type="button" size="sm" variant="outline" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      min={1}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Tax %"
                      value={item.taxRate}
                      onChange={(e) => updateItem(index, 'taxRate', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-1 text-right font-medium">
                    ₹{item.totalAmount.toLocaleString()}
                  </div>
                  <div className="col-span-1">
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(index)} disabled={formData.items.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountAmount">Discount (₹)</Label>
              <Input
                id="discountAmount"
                type="number"
                value={formData.discountAmount}
                onChange={(e) => setFormData({ ...formData, discountAmount: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-1 text-right">
            <p className="text-sm">Subtotal: ₹{subtotal.toLocaleString()}</p>
            <p className="text-sm">Tax: ₹{taxTotal.toLocaleString()}</p>
            {formData.discountAmount > 0 && <p className="text-sm text-success">Discount: -₹{formData.discountAmount.toLocaleString()}</p>}
            <p className="text-lg font-bold">Total: ₹{total.toLocaleString()}</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editInvoice ? 'Update Invoice' : 'Create Invoice'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
