import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  UserPlus, 
  Search, 
  Truck, 
  AlertTriangle,
  CheckCircle,
  Coffee
} from "lucide-react";
import { useDriverManagement } from "@/hooks/useDriverManagement";
import { useVehicleManagement } from "@/hooks/useVehicleManagement";
import { DriverCard } from "@/components/driver/DriverCard";
import { DriverFormDialog } from "@/components/driver/DriverFormDialog";
import { DriverDetailsDialog } from "@/components/driver/DriverDetailsDialog";
import { DriverVehicleAssignmentDialog } from "@/components/shared/DriverVehicleAssignmentDialog";
import { LicenseExpiryNotifications, LicenseExpiryAlert } from "@/components/shared/LicenseExpiryNotifications";
import { Driver } from "@/types/driver";

const DriverManagement = () => {
  const {
    drivers,
    loading,
    getStats,
    addDriver,
    updateDriver,
    deleteDriver,
    getDriverAssignments,
    selectedDriver,
    setSelectedDriver,
    assignVehicle,
    getAvailableDrivers,
  } = useDriverManagement();

  const {
    allVehicles,
    getAvailableVehicles,
    assignDriver: assignDriverToVehicle,
    unassignDriver,
  } = useVehicleManagement();

  const [searchQuery, setSearchQuery] = useState("");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [driverToAssign, setDriverToAssign] = useState<Driver | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const stats = getStats();

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = 
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.includes(searchQuery);

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "available") return matchesSearch && driver.status === 'available';
    if (activeTab === "on_trip") return matchesSearch && driver.status === 'on_trip';
    if (activeTab === "on_leave") return matchesSearch && driver.status === 'on_leave';
    if (activeTab === "expiring") return matchesSearch && driver.license.status === 'expiring_soon';
    return matchesSearch;
  });

  const handleView = (driver: Driver) => {
    setSelectedDriver(driver);
    setDetailsDialogOpen(true);
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this driver?")) {
      deleteDriver(id);
    }
  };

  const handleSave = (driverData: Omit<Driver, 'id' | 'rating' | 'totalTrips' | 'totalDistance'>) => {
    if (editingDriver) {
      updateDriver(editingDriver.id, driverData);
    } else {
      addDriver(driverData);
    }
    setEditingDriver(null);
  };

  const handleAddNew = () => {
    setEditingDriver(null);
    setFormDialogOpen(true);
  };

  const handleAssignVehicle = (driver: Driver) => {
    setDriverToAssign(driver);
    setAssignmentDialogOpen(true);
  };

  const handleAssignment = (driverId: string, vehicleId: string) => {
    const vehicle = allVehicles.find(v => v.id === vehicleId);
    const driver = drivers.find(d => d.id === driverId);
    if (vehicle && driver) {
      // Update driver's assigned vehicle
      assignVehicle(driverId, vehicle.registrationNo);
      // Update vehicle's assigned driver
      assignDriverToVehicle(vehicleId, driver.name, driver.phone);
    }
  };

  const handleUnassignVehicle = () => {
    if (driverToAssign) {
      const vehicle = allVehicles.find(v => v.registrationNo === driverToAssign.assignedVehicle);
      assignVehicle(driverToAssign.id, undefined);
      if (vehicle) {
        unassignDriver(vehicle.id);
      }
    }
    setAssignmentDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading drivers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Driver Management</h1>
            <p className="text-muted-foreground">Manage driver profiles, licenses, and assignments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LicenseExpiryNotifications 
            drivers={drivers} 
            onViewDriver={(driver) => {
              setSelectedDriver(driver);
              setDetailsDialogOpen(true);
            }}
          />
          <Button onClick={handleAddNew}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Driver
          </Button>
        </div>
      </div>

      {/* License Expiry Alert */}
      <LicenseExpiryAlert drivers={drivers} />

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalDrivers}</p>
                <p className="text-xs text-muted-foreground">Total Drivers</p>
              </div>
              <Users className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.availableDrivers}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.onTripDrivers}</p>
                <p className="text-xs text-muted-foreground">On Trip</p>
              </div>
              <Truck className="h-8 w-8 text-blue-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.onLeaveDrivers}</p>
                <p className="text-xs text-muted-foreground">On Leave</p>
              </div>
              <Coffee className="h-8 w-8 text-amber-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.licensesExpiringSoon}</p>
                <p className="text-xs text-muted-foreground">License Expiring</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search drivers by name, ID, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs and Driver List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All ({drivers.length})
          </TabsTrigger>
          <TabsTrigger value="available">
            Available ({stats.availableDrivers})
          </TabsTrigger>
          <TabsTrigger value="on_trip">
            On Trip ({stats.onTripDrivers})
          </TabsTrigger>
          <TabsTrigger value="on_leave">
            On Leave ({stats.onLeaveDrivers})
          </TabsTrigger>
          <TabsTrigger value="expiring" className="text-amber-600">
            License Expiring ({stats.licensesExpiringSoon})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredDrivers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No drivers found</p>
                {searchQuery && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your search criteria
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDrivers.map(driver => (
                <DriverCard
                  key={driver.id}
                  driver={driver}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAssignVehicle={handleAssignVehicle}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <DriverFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        driver={editingDriver}
        onSave={handleSave}
      />

      <DriverDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        driver={selectedDriver}
        assignments={selectedDriver ? getDriverAssignments(selectedDriver.id) : []}
      />

      <DriverVehicleAssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        mode="assign-vehicle-to-driver"
        driver={driverToAssign}
        availableDrivers={[]}
        availableVehicles={allVehicles.filter(v => v.status === 'available')}
        onAssign={handleAssignment}
        onUnassign={driverToAssign?.assignedVehicle ? handleUnassignVehicle : undefined}
      />
    </div>
  );
};

export default DriverManagement;
