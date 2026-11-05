import { useState } from 'react';
import { useVehicleManagement } from '@/hooks/useVehicleManagement';
import { useDriverManagement } from '@/hooks/useDriverManagement';
import { Vehicle } from '@/types/vehicle';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { VehicleFormDialog } from '@/components/vehicle/VehicleFormDialog';
import { VehicleDetailsDialog } from '@/components/vehicle/VehicleDetailsDialog';
import { DriverVehicleAssignmentDialog } from '@/components/shared/DriverVehicleAssignmentDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Truck, 
  CheckCircle, 
  Navigation, 
  Wrench, 
  XCircle,
  AlertTriangle
} from 'lucide-react';

const VehicleManagement = () => {
  const {
    vehicles,
    allVehicles,
    selectedVehicle,
    setSelectedVehicle,
    stats,
    isLoading,
    filter,
    setFilter,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    updateStatus,
    getVehicleMaintenanceRecords,
    assignDriver,
    unassignDriver,
  } = useVehicleManagement();

  const {
    drivers,
    getAvailableDrivers,
    assignVehicle,
  } = useDriverManagement();

  const [searchQuery, setSearchQuery] = useState('');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [vehicleToAssign, setVehicleToAssign] = useState<Vehicle | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const handleView = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setDetailsDialogOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormDialogOpen(true);
  };

  const handleFormSubmit = (data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingVehicle) {
      updateVehicle(editingVehicle.id, data);
    } else {
      addVehicle(data);
    }
    setEditingVehicle(null);
  };

  const handleFormDialogClose = (open: boolean) => {
    if (!open) {
      setEditingVehicle(null);
    }
    setFormDialogOpen(open);
  };

  const filteredVehicles = vehicles.filter((v) =>
    v.registrationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.currentDriver?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssignDriver = (vehicle: Vehicle) => {
    setVehicleToAssign(vehicle);
    setAssignmentDialogOpen(true);
  };

  const handleAssignment = (driverId: string, vehicleId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    const vehicle = allVehicles.find(v => v.id === vehicleId);
    if (driver && vehicle) {
      // Update vehicle's assigned driver
      assignDriver(vehicleId, driver.name, driver.phone);
      // Update driver's assigned vehicle
      assignVehicle(driverId, vehicle.registrationNo);
    }
  };

  const handleUnassignDriver = () => {
    if (vehicleToAssign) {
      const driver = drivers.find(d => d.assignedVehicle === vehicleToAssign.registrationNo);
      unassignDriver(vehicleToAssign.id);
      if (driver) {
        assignVehicle(driver.id, undefined);
      }
    }
    setAssignmentDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vehicle Management</h1>
          <p className="text-muted-foreground">Manage your fleet and track vehicle status</p>
        </div>
        <Button onClick={() => setFormDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalVehicles}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.available}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Navigation className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inTransit}</p>
                <p className="text-xs text-muted-foreground">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Wrench className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.maintenance}</p>
                <p className="text-xs text-muted-foreground">Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inactive}</p>
                <p className="text-xs text-muted-foreground">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.expiringDocuments}</p>
                <p className="text-xs text-muted-foreground">Expiring Docs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicles by registration, make, model, or driver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Vehicle['status'] | 'all')}>
        <TabsList>
          <TabsTrigger value="all">All ({allVehicles.length})</TabsTrigger>
          <TabsTrigger value="available">Available ({stats.available})</TabsTrigger>
          <TabsTrigger value="in_transit">In Transit ({stats.inTransit})</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance ({stats.maintenance})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({stats.inactive})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {filteredVehicles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={deleteVehicle}
                  onAssignDriver={handleAssignDriver}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground">No vehicles found</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Add your first vehicle to get started'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <VehicleFormDialog
        open={formDialogOpen}
        onOpenChange={handleFormDialogClose}
        vehicle={editingVehicle}
        onSubmit={handleFormSubmit}
      />

      <VehicleDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        vehicle={selectedVehicle}
        maintenanceRecords={selectedVehicle ? getVehicleMaintenanceRecords(selectedVehicle.id) : []}
        onEdit={(vehicle) => {
          setDetailsDialogOpen(false);
          handleEdit(vehicle);
        }}
        onUpdateStatus={updateStatus}
        onAssignDriver={handleAssignDriver}
      />

      <DriverVehicleAssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        mode="assign-driver-to-vehicle"
        vehicle={vehicleToAssign}
        availableDrivers={drivers.filter(d => d.status === 'available')}
        availableVehicles={[]}
        onAssign={handleAssignment}
        onUnassign={vehicleToAssign?.currentDriver ? handleUnassignDriver : undefined}
      />
    </div>
  );
};

export default VehicleManagement;
