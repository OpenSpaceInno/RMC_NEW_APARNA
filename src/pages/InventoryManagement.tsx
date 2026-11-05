import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInventoryManagement } from "@/hooks/useInventoryManagement";
import { InventoryItemFormDialog } from "@/components/inventory/InventoryItemFormDialog";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { Package, AlertTriangle, TrendingDown, ArrowUpDown, Plus, Bell, Edit, Trash2 } from "lucide-react";
import { InventoryItem } from "@/types/inventory";
import { StockMovementDialog } from "@/components/inventory/StockMovementDialog";

const categoryColors = { cement: "default", aggregate: "secondary", sand: "outline", admixture: "default", water: "secondary", other: "outline" } as const;

export default function InventoryManagement() {
  const [formOpen, setFormOpen] = useState(false);
  const [movementOpen, setMovementOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const { items, movements, alerts, stats, updateAlertStatus, getConsumptionReport, addItem, updateItem, deleteItem, recordMovement } = useInventoryManagement();
  const consumptionReport = getConsumptionReport(30);

  const handleEdit = (item: InventoryItem) => {
    setEditItem(item);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (editItem) {
      await updateItem(editItem.id, {
        name: data.name,
        currentStock: data.currentStock,
        minStock: data.minStock,
        maxStock: data.maxStock,
        reorderLevel: data.reorderLevel,
        reorderQuantity: data.reorderQuantity,
        unitCost: data.unitCost,
        location: data.location,
        supplier: data.supplier,
      });
    } else {
      await addItem(data);
    }
    setEditItem(null);
  };

  const handleConfirmDelete = async () => {
    if (deleteItemId) {
      await deleteItem(deleteItemId);
      setDeleteItemId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Inventory Management</h1><p className="text-muted-foreground">Raw materials stock, consumption & reorder alerts</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setMovementOpen(true)}>
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Record Movement
          </Button>
          <Button onClick={() => { setEditItem(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <InventoryItemFormDialog
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditItem(null); }}
        onSubmit={handleFormSubmit}
        editItem={editItem}
      />

      <StockMovementDialog
        open={movementOpen}
        onOpenChange={setMovementOpen}
        items={items}
        onSubmit={recordMovement}
      />

      <ConfirmDeleteDialog
        open={!!deleteItemId}
        onOpenChange={(open) => !open && setDeleteItemId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Inventory Item"
        description="Are you sure you want to delete this inventory item? This action cannot be undone."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Items</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalItems}</div><p className="text-xs text-muted-foreground">₹{stats.totalValue.toLocaleString()} value</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Low Stock</CardTitle><AlertTriangle className="h-4 w-4 text-warning" /></CardHeader><CardContent><div className="text-2xl font-bold text-warning">{stats.lowStockItems}</div><p className="text-xs text-muted-foreground">Need reorder</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Today's Consumption</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">₹{stats.consumptionToday.toLocaleString()}</div><p className="text-xs text-muted-foreground">{stats.totalMovementsToday} movements</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending Reorders</CardTitle><Bell className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{stats.pendingReorders}</div><p className="text-xs text-muted-foreground">Action required</p></CardContent></Card>
      </div>

      <Tabs defaultValue="items">
        <TabsList><TabsTrigger value="items">Stock Items</TabsTrigger><TabsTrigger value="movements">Movements</TabsTrigger><TabsTrigger value="alerts">Alerts ({alerts.filter(a => a.status === 'pending').length})</TabsTrigger></TabsList>
        
        <TabsContent value="items" className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className={item.isLowStock ? 'border-warning' : ''}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div><p className="font-medium">{item.name}</p><p className="text-sm text-muted-foreground">{item.sku} • {item.location}</p></div>
                </div>
                <Badge variant={categoryColors[item.category]}>{item.category}</Badge>
                <div className="text-center"><p className="font-medium">{item.currentStock} {item.unit}</p><p className="text-xs text-muted-foreground">Min: {item.minStock}</p></div>
                <div className="text-right"><p className="text-sm">₹{item.unitCost}/{item.unit}</p><p className="text-sm font-medium">₹{item.totalValue.toLocaleString()}</p></div>
                <div className="flex items-center gap-2">
                  {item.isLowStock && <Badge variant="warning">Low</Badge>}
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteItemId(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          {movements.slice(0, 10).map((mov) => (
            <Card key={mov.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ArrowUpDown className={`h-5 w-5 ${mov.type === 'receipt' ? 'text-success' : 'text-warning'}`} />
                  <div><p className="font-medium">{mov.itemName}</p><p className="text-sm text-muted-foreground">{mov.type} • {mov.performedBy}</p></div>
                </div>
                <Badge variant={mov.type === 'receipt' ? 'success' : 'secondary'}>{mov.type}</Badge>
                <div className="text-right"><p className="font-medium">{mov.type === 'receipt' ? '+' : '-'}{mov.quantity}</p><p className="text-sm text-muted-foreground">{mov.previousStock} → {mov.newStock}</p></div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className="border-warning">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <div><p className="font-medium">{alert.itemName}</p><p className="text-sm text-muted-foreground">Current: {alert.currentStock} / Reorder: {alert.reorderLevel}</p></div>
                </div>
                <Badge variant={alert.priority === 'critical' ? 'destructive' : 'warning'}>{alert.priority}</Badge>
                <div className="text-right"><p className="text-sm">{alert.supplier}</p><p className="text-sm text-muted-foreground">Order: {alert.reorderQuantity} units</p></div>
                {alert.status === 'pending' && <Button size="sm" onClick={() => updateAlertStatus(alert.id, 'ordered')}>Mark Ordered</Button>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
