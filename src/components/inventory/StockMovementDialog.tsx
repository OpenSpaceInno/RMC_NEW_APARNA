import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { InventoryItem, MovementType, StockMovementFormData } from '@/types/inventory';
import { ArrowUpDown, PlusCircle } from 'lucide-react';

interface StockMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  onSubmit: (data: StockMovementFormData) => Promise<any>;
}

export function StockMovementDialog({
  open,
  onOpenChange,
  items,
  onSubmit,
}: StockMovementDialogProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || '');
  const [movementType, setMovementType] = useState<MovementType>('receipt');
  const [quantity, setQuantity] = useState<string>('10');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedItem = items.find(i => i.id === (selectedItemId || items[0]?.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId && items.length > 0) return;
    const finalItemId = selectedItemId || items[0]?.id;
    if (!finalItemId || !quantity || Number(quantity) <= 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        itemId: finalItemId,
        type: movementType,
        quantity: Number(quantity),
        unitCost: selectedItem?.unitCost,
        referenceNumber: referenceNumber.trim() || `MOV-${Date.now().toString().slice(-6)}`,
        notes: notes.trim(),
      });
      onOpenChange(false);
      setQuantity('10');
      setReferenceNumber('');
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-primary" />
            <DialogTitle>Record Stock Movement</DialogTitle>
          </div>
          <DialogDescription>
            Log material receipts, batching plant consumption, or physical silo inventory adjustments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Select Material */}
          <div className="space-y-1.5">
            <Label htmlFor="item-select" className="text-xs">Material / Silo Item *</Label>
            <Select 
              value={selectedItemId || items[0]?.id} 
              onValueChange={setSelectedItemId}
            >
              <SelectTrigger id="item-select">
                <SelectValue placeholder="Select raw material" />
              </SelectTrigger>
              <SelectContent>
                {items.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} ({item.currentStock} {item.unit} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Movement Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Movement Type *</Label>
              <Select value={movementType} onValueChange={(v) => setMovementType(v as MovementType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receipt">Stock Receipt (+)</SelectItem>
                  <SelectItem value="consumption">Batching Plant Usage (-)</SelectItem>
                  <SelectItem value="adjustment">Stock Audit Variance (=)</SelectItem>
                  <SelectItem value="return">Site Return (+)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <Label htmlFor="qty" className="text-xs">
                Quantity ({selectedItem?.unit || 'units'}) *
              </Label>
              <Input
                id="qty"
                type="number"
                step="0.1"
                min="0.1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>

          {/* Reference Number */}
          <div className="space-y-1.5">
            <Label htmlFor="ref-num" className="text-xs">Reference / Challan / Batch No</Label>
            <Input
              id="ref-num"
              placeholder="e.g. GRN-2026-441 or BATCH-M30-08"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs">Operational Notes</Label>
            <Textarea
              id="notes"
              placeholder="e.g. Bulk tanker unloaded into Silo 1, tested slump retention."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !quantity}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Recording...' : 'Record Movement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
