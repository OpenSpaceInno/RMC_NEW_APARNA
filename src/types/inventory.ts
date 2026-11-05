export type MaterialCategory = 'cement' | 'aggregate' | 'sand' | 'admixture' | 'water' | 'other';
export type MovementType = 'receipt' | 'consumption' | 'adjustment' | 'return' | 'transfer';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: MaterialCategory;
  unit: 'kg' | 'tons' | 'liters' | 'cubic_meters' | 'bags' | 'pieces';
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  unitCost: number;
  totalValue: number;
  location: string;
  supplier: string;
  supplierContact?: string;
  lastReceived?: string;
  lastConsumed?: string;
  expiryDate?: string;
  isLowStock: boolean;
  isOverstock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost: number;
  totalCost: number;
  referenceNumber?: string;
  tripId?: string;
  supplierId?: string;
  notes?: string;
  performedBy: string;
  date: string;
  createdAt: string;
}

export interface ReorderAlert {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  currentStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  supplier: string;
  priority: AlertPriority;
  status: 'pending' | 'ordered' | 'received' | 'dismissed';
  createdAt: string;
  acknowledgedAt?: string;
  orderedAt?: string;
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  overstockItems: number;
  pendingReorders: number;
  totalMovementsToday: number;
  consumptionToday: number;
  receiptsToday: number;
}

export interface ConsumptionReport {
  itemId: string;
  itemName: string;
  period: string;
  totalConsumed: number;
  avgDailyConsumption: number;
  daysOfStock: number;
  totalCost: number;
}

export interface InventoryFormData {
  name: string;
  sku: string;
  category: MaterialCategory;
  unit: InventoryItem['unit'];
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  unitCost: number;
  location: string;
  supplier: string;
  supplierContact?: string;
  expiryDate?: string;
}

export interface StockMovementFormData {
  itemId: string;
  type: MovementType;
  quantity: number;
  unitCost?: number;
  referenceNumber?: string;
  tripId?: string;
  notes?: string;
}
