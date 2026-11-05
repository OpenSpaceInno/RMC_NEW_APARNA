import { useState, useCallback, useEffect } from 'react';
import { 
  InventoryItem, 
  StockMovement, 
  ReorderAlert, 
  InventoryStats,
  InventoryFormData,
  StockMovementFormData,
  ConsumptionReport 
} from '@/types/inventory';
import { toast } from 'sonner';
import { api } from '@/lib/api';

const STORAGE_KEY_ITEMS = 'rmc_inventory_items';
const STORAGE_KEY_MOVEMENTS = 'rmc_stock_movements';
const STORAGE_KEY_ALERTS = 'rmc_reorder_alerts';

const getRelativeDateStr = (daysDelta: number): string => {
  const d = new Date(Date.now() + daysDelta * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
};

const initialMockItems: InventoryItem[] = [
  {
    id: 'item-01',
    name: 'OPC 53 Grade Cement',
    sku: 'CEM-OPC-53',
    category: 'cement',
    unit: 'tons',
    currentStock: 85,
    minStock: 30,
    maxStock: 180,
    reorderLevel: 45,
    reorderQuantity: 60,
    unitCost: 6500,
    totalValue: 552500,
    location: 'Cement Silo #1 & #2',
    supplier: 'UltraTech Cement Ltd',
    supplierContact: '+91 98200 11223',
    lastReceived: getRelativeDateStr(-2),
    lastConsumed: getRelativeDateStr(0),
    isLowStock: false,
    isOverstock: false,
    createdAt: getRelativeDateStr(-100),
    updatedAt: getRelativeDateStr(0),
  },
  {
    id: 'item-02',
    name: 'PPC Flyash Cement',
    sku: 'CEM-PPC-FA',
    category: 'cement',
    unit: 'tons',
    currentStock: 42,
    minStock: 20,
    maxStock: 120,
    reorderLevel: 30,
    reorderQuantity: 40,
    unitCost: 5900,
    totalValue: 247800,
    location: 'Cement Silo #3',
    supplier: 'Ambuja Cements Ltd',
    supplierContact: '+91 98200 44556',
    lastReceived: getRelativeDateStr(-5),
    lastConsumed: getRelativeDateStr(-1),
    isLowStock: false,
    isOverstock: false,
    createdAt: getRelativeDateStr(-90),
    updatedAt: getRelativeDateStr(-1),
  },
  {
    id: 'item-03',
    name: '10mm Crushed Basalt Aggregate',
    sku: 'AGG-10MM-BST',
    category: 'aggregate',
    unit: 'tons',
    currentStock: 165,
    minStock: 60,
    maxStock: 300,
    reorderLevel: 80,
    reorderQuantity: 120,
    unitCost: 1100,
    totalValue: 181500,
    location: 'Aggregate Bunker A',
    supplier: 'Vighnaharta Stone Crushers',
    supplierContact: '+91 98200 77889',
    lastReceived: getRelativeDateStr(-1),
    lastConsumed: getRelativeDateStr(0),
    isLowStock: false,
    isOverstock: false,
    createdAt: getRelativeDateStr(-120),
    updatedAt: getRelativeDateStr(0),
  },
  {
    id: 'item-04',
    name: '20mm Crushed Basalt Aggregate',
    sku: 'AGG-20MM-BST',
    category: 'aggregate',
    unit: 'tons',
    currentStock: 210,
    minStock: 80,
    maxStock: 400,
    reorderLevel: 100,
    reorderQuantity: 150,
    unitCost: 1050,
    totalValue: 220500,
    location: 'Aggregate Bunker B',
    supplier: 'Vighnaharta Stone Crushers',
    supplierContact: '+91 98200 77889',
    lastReceived: getRelativeDateStr(-3),
    lastConsumed: getRelativeDateStr(0),
    isLowStock: false,
    isOverstock: false,
    createdAt: getRelativeDateStr(-120),
    updatedAt: getRelativeDateStr(0),
  },
  {
    id: 'item-05',
    name: 'Washed Manufactured Sand (M-Sand)',
    sku: 'SND-MSAND-WSH',
    category: 'sand',
    unit: 'tons',
    currentStock: 28, // Low Stock Trigger (< 35 minStock & < 50 reorder)
    minStock: 35,
    maxStock: 250,
    reorderLevel: 50,
    reorderQuantity: 80,
    unitCost: 1850,
    totalValue: 51800,
    location: 'Sand Bunker C',
    supplier: 'Pune Sand & Mineral Traders',
    supplierContact: '+91 98200 99001',
    lastReceived: getRelativeDateStr(-6),
    lastConsumed: getRelativeDateStr(0),
    isLowStock: true,
    isOverstock: false,
    createdAt: getRelativeDateStr(-110),
    updatedAt: getRelativeDateStr(0),
  },
  {
    id: 'item-06',
    name: 'PCE Superplasticizer Admixture',
    sku: 'ADM-PCE-PLAST',
    category: 'admixture',
    unit: 'liters',
    currentStock: 480, // Low Stock Trigger (< 500 minStock)
    minStock: 500,
    maxStock: 3000,
    reorderLevel: 800,
    reorderQuantity: 1000,
    unitCost: 120,
    totalValue: 57600,
    location: 'Admixture Drum Bay 1',
    supplier: 'Sika India Pvt Ltd',
    supplierContact: '+91 98200 33445',
    lastReceived: getRelativeDateStr(-12),
    lastConsumed: getRelativeDateStr(0),
    isLowStock: true,
    isOverstock: false,
    createdAt: getRelativeDateStr(-150),
    updatedAt: getRelativeDateStr(0),
  },
  {
    id: 'item-07',
    name: 'Retarder Chemical Admixture',
    sku: 'ADM-RETARD-RT',
    category: 'admixture',
    unit: 'liters',
    currentStock: 1250,
    minStock: 300,
    maxStock: 2000,
    reorderLevel: 500,
    reorderQuantity: 800,
    unitCost: 95,
    totalValue: 118750,
    location: 'Admixture Drum Bay 2',
    supplier: 'Fosroc Chemicals India',
    supplierContact: '+91 98200 66778',
    lastReceived: getRelativeDateStr(-8),
    lastConsumed: getRelativeDateStr(-1),
    isLowStock: false,
    isOverstock: false,
    createdAt: getRelativeDateStr(-130),
    updatedAt: getRelativeDateStr(-1),
  },
  {
    id: 'item-08',
    name: 'Industrial Batching Water',
    sku: 'WTR-PLANT-REC',
    category: 'water',
    unit: 'liters',
    currentStock: 85000,
    minStock: 25000,
    maxStock: 150000,
    reorderLevel: 40000,
    reorderQuantity: 50000,
    unitCost: 0.15,
    totalValue: 12750,
    location: 'Underground Reservoirs 1 & 2',
    supplier: 'Municipal Treated Supply',
    supplierContact: '+91 98200 11000',
    lastReceived: getRelativeDateStr(0),
    lastConsumed: getRelativeDateStr(0),
    isLowStock: false,
    isOverstock: false,
    createdAt: getRelativeDateStr(-200),
    updatedAt: getRelativeDateStr(0),
  },
];

const initialMockMovements: StockMovement[] = [
  {
    id: 'mov-001',
    itemId: 'item-01',
    itemName: 'OPC 53 Grade Cement',
    itemSku: 'CEM-OPC-53',
    type: 'receipt',
    quantity: 40,
    previousStock: 45,
    newStock: 85,
    unitCost: 6500,
    totalCost: 260000,
    referenceNumber: 'BULK-GRN-2026-104',
    notes: 'Bulk tanker discharge into Silo 1. Lab compressive test voucher #VT-902 approved.',
    performedBy: 'Suresh Patil (Silo Operator)',
    date: getRelativeDateStr(-2),
    createdAt: getRelativeDateStr(-2),
  },
  {
    id: 'mov-002',
    itemId: 'item-05',
    itemName: 'Washed Manufactured Sand (M-Sand)',
    itemSku: 'SND-MSAND-WSH',
    type: 'consumption',
    quantity: 18,
    previousStock: 46,
    newStock: 28,
    unitCost: 1850,
    totalCost: 33300,
    tripId: 'TRIP-001',
    referenceNumber: 'BATCH-2026-089',
    notes: 'Batching cycle for 18 m³ M25 concrete (Bandra Godrej Woods site)',
    performedBy: 'Batching Plant SCADA Auto-Weigher',
    date: getRelativeDateStr(0),
    createdAt: getRelativeDateStr(0),
  },
  {
    id: 'mov-003',
    itemId: 'item-04',
    itemName: '20mm Crushed Basalt Aggregate',
    itemSku: 'AGG-20MM-BST',
    type: 'consumption',
    quantity: 24,
    previousStock: 234,
    newStock: 210,
    unitCost: 1050,
    totalCost: 25200,
    tripId: 'TRIP-002',
    referenceNumber: 'BATCH-2026-092',
    notes: 'Batching cycle for 24 m³ M30 concrete (L&T Metro Pier Pier #42)',
    performedBy: 'Batching Plant SCADA Auto-Weigher',
    date: getRelativeDateStr(0),
    createdAt: getRelativeDateStr(0),
  },
  {
    id: 'mov-004',
    itemId: 'item-06',
    itemName: 'PCE Superplasticizer Admixture',
    itemSku: 'ADM-PCE-PLAST',
    type: 'consumption',
    quantity: 120,
    previousStock: 600,
    newStock: 480,
    unitCost: 120,
    totalCost: 14400,
    tripId: 'TRIP-003',
    referenceNumber: 'BATCH-2026-095',
    notes: 'Dosed into mixer for slump retention 135mm',
    performedBy: 'Admixture Metering Pump #1',
    date: getRelativeDateStr(0),
    createdAt: getRelativeDateStr(0),
  },
  {
    id: 'mov-005',
    itemId: 'item-03',
    itemName: '10mm Crushed Basalt Aggregate',
    itemSku: 'AGG-10MM-BST',
    type: 'receipt',
    quantity: 50,
    previousStock: 115,
    newStock: 165,
    unitCost: 1100,
    totalCost: 55000,
    referenceNumber: 'DMP-TRUCK-40192',
    notes: 'Tipper delivery weighbridge slip #WB-2026-041',
    performedBy: 'Gate Inward Weighmaster',
    date: getRelativeDateStr(-1),
    createdAt: getRelativeDateStr(-1),
  },
];

const initialMockAlerts: ReorderAlert[] = [
  {
    id: 'alt-001',
    itemId: 'item-05',
    itemName: 'Washed Manufactured Sand (M-Sand)',
    itemSku: 'SND-MSAND-WSH',
    currentStock: 28,
    reorderLevel: 50,
    reorderQuantity: 80,
    supplier: 'Pune Sand & Mineral Traders',
    priority: 'critical',
    status: 'pending',
    createdAt: getRelativeDateStr(0),
  },
  {
    id: 'alt-002',
    itemId: 'item-06',
    itemName: 'PCE Superplasticizer Admixture',
    itemSku: 'ADM-PCE-PLAST',
    currentStock: 480,
    reorderLevel: 800,
    reorderQuantity: 1000,
    supplier: 'Sika India Pvt Ltd',
    priority: 'high',
    status: 'pending',
    createdAt: getRelativeDateStr(0),
  },
];

export function useInventoryManagement() {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialMockItems;
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MOVEMENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialMockMovements;
  });

  const [alerts, setAlerts] = useState<ReorderAlert[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ALERTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialMockAlerts;
  });

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const persistItems = useCallback((newItems: InventoryItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(newItems));
    } catch (e) {}
  }, []);

  const persistMovements = useCallback((newMovements: StockMovement[]) => {
    setMovements(newMovements);
    try {
      localStorage.setItem(STORAGE_KEY_MOVEMENTS, JSON.stringify(newMovements));
    } catch (e) {}
  }, []);

  const persistAlerts = useCallback((newAlerts: ReorderAlert[]) => {
    setAlerts(newAlerts);
    try {
      localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(newAlerts));
    } catch (e) {}
  }, []);

  const fetchInventoryData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [fetchedItems, fetchedMovements, fetchedAlerts] = await Promise.allSettled([
        api.getInventoryItems(),
        api.getStockMovements(),
        api.getReorderAlerts()
      ]);

      if (fetchedItems.status === 'fulfilled' && Array.isArray(fetchedItems.value) && fetchedItems.value.length > 0) {
        setItems(fetchedItems.value);
        localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(fetchedItems.value));
      }
      if (fetchedMovements.status === 'fulfilled' && Array.isArray(fetchedMovements.value) && fetchedMovements.value.length > 0) {
        setMovements(fetchedMovements.value);
        localStorage.setItem(STORAGE_KEY_MOVEMENTS, JSON.stringify(fetchedMovements.value));
      }
      if (fetchedAlerts.status === 'fulfilled' && Array.isArray(fetchedAlerts.value) && fetchedAlerts.value.length > 0) {
        setAlerts(fetchedAlerts.value);
        localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(fetchedAlerts.value));
      }
    } catch (err) {
      console.warn('Inventory API fallback', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  const getStats = useCallback((): InventoryStats => {
    const today = new Date().toISOString().split('T')[0];
    const todayMovements = movements.filter(m => m.date.startsWith(today));

    return {
      totalItems: items.length,
      totalValue: items.reduce((sum, i) => sum + i.totalValue, 0),
      lowStockItems: items.filter(i => i.isLowStock).length,
      overstockItems: items.filter(i => i.isOverstock).length,
      pendingReorders: alerts.filter(a => a.status === 'pending').length,
      totalMovementsToday: todayMovements.length,
      consumptionToday: todayMovements.filter(m => m.type === 'consumption').reduce((sum, m) => sum + m.totalCost, 0),
      receiptsToday: todayMovements.filter(m => m.type === 'receipt').reduce((sum, m) => sum + m.totalCost, 0),
    };
  }, [items, movements, alerts]);

  const addItem = useCallback(async (formData: InventoryFormData) => {
    const newItem: InventoryItem = {
      id: `item-${Date.now()}`,
      name: formData.name,
      sku: formData.sku,
      category: formData.category,
      unit: formData.unit,
      currentStock: Number(formData.currentStock),
      minStock: Number(formData.minStock),
      maxStock: Number(formData.maxStock),
      reorderLevel: Number(formData.reorderLevel),
      reorderQuantity: Number(formData.reorderQuantity),
      unitCost: Number(formData.unitCost),
      totalValue: Number(formData.currentStock) * Number(formData.unitCost),
      location: formData.location || 'General Yard',
      supplier: formData.supplier || 'Plant Supplier',
      supplierContact: formData.supplierContact,
      isLowStock: Number(formData.currentStock) <= Number(formData.reorderLevel),
      isOverstock: Number(formData.currentStock) > Number(formData.maxStock),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedItems = [...items, newItem];
    persistItems(updatedItems);

    try {
      await api.createInventoryItem(newItem);
    } catch (e) {
      console.warn('API inventory create fallback', e);
    }

    if (newItem.isLowStock) {
      const newAlert: ReorderAlert = {
        id: `alt-${Date.now()}`,
        itemId: newItem.id,
        itemName: newItem.name,
        itemSku: newItem.sku,
        currentStock: newItem.currentStock,
        reorderLevel: newItem.reorderLevel,
        reorderQuantity: newItem.reorderQuantity,
        supplier: newItem.supplier,
        priority: newItem.currentStock < newItem.minStock ? 'critical' : 'high',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      persistAlerts([newAlert, ...alerts]);
    }

    toast.success(`Inventory item "${newItem.name}" added successfully`);

    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'inventory',
        action: 'CREATED',
        entityId: newItem.id,
        entityType: 'Inventory Item',
        details: `Added raw material "${newItem.name}" (${newItem.currentStock} ${newItem.unit})`,
        severity: 'info',
        performedBy: { id: 'INV-MGR', name: 'Raw Material Yard Supv', role: 'Inventory' }
      }
    }));

    return newItem;
  }, [items, alerts, persistItems, persistAlerts]);

  const updateItem = useCallback(async (id: string, updates: Partial<InventoryItem>) => {
    let targetItem: InventoryItem | null = null;
    const updated = items.map(item => {
      if (item.id === id) {
        const currentStock = updates.currentStock !== undefined ? Number(updates.currentStock) : item.currentStock;
        const reorderLevel = updates.reorderLevel !== undefined ? Number(updates.reorderLevel) : item.reorderLevel;
        const minStock = updates.minStock !== undefined ? Number(updates.minStock) : item.minStock;
        const maxStock = updates.maxStock !== undefined ? Number(updates.maxStock) : item.maxStock;
        const unitCost = updates.unitCost !== undefined ? Number(updates.unitCost) : item.unitCost;

        targetItem = {
          ...item,
          ...updates,
          currentStock,
          totalValue: currentStock * unitCost,
          isLowStock: currentStock <= reorderLevel,
          isOverstock: currentStock > maxStock,
          updatedAt: new Date().toISOString(),
        };
        return targetItem;
      }
      return item;
    });

    persistItems(updated);
    toast.success('Inventory item updated');

    try {
      await api.updateInventoryItem(id, updates);
    } catch (e) {
      console.warn('API inventory update fallback', e);
    }

    if (targetItem) {
      window.dispatchEvent(new CustomEvent('rmc-audit-event', {
        detail: {
          module: 'inventory',
          action: 'UPDATED',
          entityId: id,
          entityType: 'Inventory Item',
          details: `Updated inventory specs for ${(targetItem as InventoryItem).name}`,
          severity: 'info',
          performedBy: { id: 'INV-MGR', name: 'Raw Material Yard Supv', role: 'Inventory' }
        }
      }));
    }
  }, [items, persistItems]);

  const deleteItem = useCallback(async (id: string) => {
    const target = items.find(i => i.id === id);
    const updated = items.filter(i => i.id !== id);
    persistItems(updated);
    toast.success('Item deleted from inventory registry');

    try {
      await api.deleteInventoryItem(id);
    } catch (e) {
      console.warn('API inventory delete fallback', e);
    }

    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'inventory',
        action: 'DELETED',
        entityId: id,
        entityType: 'Inventory Item',
        details: `Deleted item "${target?.name || id}" from inventory`,
        severity: 'warning',
        performedBy: { id: 'INV-MGR', name: 'Raw Material Yard Supv', role: 'Inventory' }
      }
    }));
  }, [items, persistItems]);

  const recordMovement = useCallback(async (formData: StockMovementFormData, performedBy: string = 'Yard Supervisor') => {
    const item = items.find(i => i.id === formData.itemId);
    if (!item) {
      toast.error('Item not found');
      return null;
    }

    const previousStock = item.currentStock;
    let newStock: number;

    switch (formData.type) {
      case 'receipt':
        newStock = previousStock + Number(formData.quantity);
        break;
      case 'consumption':
      case 'transfer':
        newStock = Math.max(0, previousStock - Number(formData.quantity));
        break;
      case 'adjustment':
        newStock = Number(formData.quantity);
        break;
      case 'return':
        newStock = previousStock + Number(formData.quantity);
        break;
      default:
        newStock = previousStock;
    }

    const newMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      itemId: item.id,
      itemName: item.name,
      itemSku: item.sku,
      type: formData.type,
      quantity: Number(formData.quantity),
      previousStock,
      newStock,
      unitCost: formData.unitCost || item.unitCost,
      totalCost: Number(formData.quantity) * (formData.unitCost || item.unitCost),
      referenceNumber: formData.referenceNumber || `REF-${Date.now().toString().slice(-5)}`,
      tripId: formData.tripId,
      notes: formData.notes,
      performedBy,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    persistMovements([newMovement, ...movements]);

    try {
      await api.recordStockMovement({
        id: newMovement.id,
        itemId: item.id,
        type: formData.type,
        quantity: Number(formData.quantity),
        unitCost: newMovement.unitCost,
        referenceNumber: newMovement.referenceNumber,
        notes: newMovement.notes,
        performedBy
      });
    } catch (e) {
      console.warn('API record movement fallback', e);
    }

    // Update item stock
    const isLow = newStock <= item.reorderLevel;
    const isOver = newStock > item.maxStock;

    const updatedItems = items.map(i => {
      if (i.id === item.id) {
        return {
          ...i,
          currentStock: newStock,
          totalValue: newStock * i.unitCost,
          isLowStock: isLow,
          isOverstock: isOver,
          lastReceived: formData.type === 'receipt' ? new Date().toISOString().split('T')[0] : i.lastReceived,
          lastConsumed: formData.type === 'consumption' ? new Date().toISOString().split('T')[0] : i.lastConsumed,
          updatedAt: new Date().toISOString(),
        };
      }
      return i;
    });

    persistItems(updatedItems);

    // Update or create alert if low stock
    if (isLow) {
      const exists = alerts.some(a => a.itemId === item.id && a.status === 'pending');
      if (!exists) {
        const alert: ReorderAlert = {
          id: `alt-${Date.now()}`,
          itemId: item.id,
          itemName: item.name,
          itemSku: item.sku,
          currentStock: newStock,
          reorderLevel: item.reorderLevel,
          reorderQuantity: item.reorderQuantity,
          supplier: item.supplier,
          priority: newStock < item.minStock ? 'critical' : 'high',
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        persistAlerts([alert, ...alerts]);
      }
    }

    toast.success(`Stock ${formData.type} recorded for ${item.name} (${previousStock} → ${newStock} ${item.unit})`);

    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'inventory',
        action: formData.type === 'receipt' ? 'CREATED' : 'STATUS_CHANGE',
        entityId: newMovement.id,
        entityType: 'Stock Movement',
        details: `${formData.type.toUpperCase()}: ${formData.quantity} ${item.unit} of ${item.name} (${newMovement.referenceNumber})`,
        severity: 'info',
        performedBy: { id: 'INV-MGR', name: performedBy, role: 'Inventory' }
      }
    }));

    return newMovement;
  }, [items, movements, alerts, persistItems, persistMovements, persistAlerts]);

  const updateAlertStatus = useCallback(async (alertId: string, status: ReorderAlert['status']) => {
    const updatedAlerts = alerts.map(a => {
      if (a.id === alertId) {
        return {
          ...a,
          status,
          acknowledgedAt: new Date().toISOString(),
          orderedAt: status === 'ordered' ? new Date().toISOString() : a.orderedAt,
        };
      }
      return a;
    });

    persistAlerts(updatedAlerts);
    toast.success(`Reorder alert marked as ${status}`);
  }, [alerts, persistAlerts]);

  const getConsumptionReport = useCallback((days: number = 30): ConsumptionReport[] => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return items.map(item => {
      const itemMovements = movements.filter(m =>
        m.itemId === item.id &&
        m.type === 'consumption' &&
        new Date(m.date) >= startDate
      );

      const totalConsumed = itemMovements.reduce((sum, m) => sum + m.quantity, 0);
      const avgDaily = totalConsumed / days;
      const daysOfStock = avgDaily > 0 ? Math.floor(item.currentStock / avgDaily) : 999;

      return {
        itemId: item.id,
        itemName: item.name,
        period: `Last ${days} days`,
        totalConsumed,
        avgDailyConsumption: Math.round(avgDaily * 100) / 100,
        daysOfStock,
        totalCost: itemMovements.reduce((sum, m) => sum + m.totalCost, 0),
      };
    }).sort((a, b) => a.daysOfStock - b.daysOfStock);
  }, [items, movements]);

  const getLowStockItems = useCallback(() => {
    return items.filter(i => i.isLowStock);
  }, [items]);

  const getItemsByCategory = useCallback((category: InventoryItem['category']) => {
    return items.filter(i => i.category === category);
  }, [items]);

  return {
    items,
    movements,
    alerts,
    selectedItem,
    setSelectedItem,
    isLoading,
    stats: getStats(),
    addItem,
    updateItem,
    deleteItem,
    recordMovement,
    updateAlertStatus,
    getConsumptionReport,
    getLowStockItems,
    getItemsByCategory,
    refetch: fetchInventoryData,
  };
}
