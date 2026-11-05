import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Navigation, 
  Plus, 
  Search, 
  Truck, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  TrendingUp,
  Signal,
  MapPin,
  Satellite,
  Route,
  BarChart3,
  Bell
} from "lucide-react";
import { useTripManagement } from "@/hooks/useTripManagement";
import { useGeofencing } from "@/hooks/useGeofencing";
import { useGPSIntegration } from "@/hooks/useGPSIntegration";
import { useRouteOptimization } from "@/hooks/useRouteOptimization";
import TripCard from "@/components/tripManagement/TripCard";
import TripFormDialog from "@/components/tripManagement/TripFormDialog";
import TripDetailsDialog from "@/components/tripManagement/TripDetailsDialog";
import GeofenceManager from "@/components/tripManagement/GeofenceManager";
import GPSDeviceManager from "@/components/tripManagement/GPSDeviceManager";
import RouteOptimizer from "@/components/tripManagement/RouteOptimizer";
import { Trip, TripStatus } from "@/types/tripManagement";
import { Link } from "react-router-dom";

const TripManagement = () => {
  const { 
    trips, 
    getStats, 
    createTrip, 
    updateTripStatus, 
    cancelTrip, 
    deleteTrip,
    getTripEvents,
    addTripNote,
    selectedTrip,
    setSelectedTrip
  } = useTripManagement();

  const { geofences, alerts, createGeofence, updateGeofence, deleteGeofence, acknowledgeAlert, acknowledgeAllAlerts, getUnacknowledgedAlerts } = useGeofencing(trips);
  const { devices, isConnecting, registerDevice, deleteDevice, testConnection } = useGPSIntegration();
  const { isOptimizing, optimizeRoute, getOptimization } = useRouteOptimization();

  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isGeofenceOpen, setIsGeofenceOpen] = useState(false);
  const [isGPSDeviceOpen, setIsGPSDeviceOpen] = useState(false);
  const [isRouteOptimizerOpen, setIsRouteOptimizerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const unacknowledgedAlerts = getUnacknowledgedAlerts();

  const stats = getStats();

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = 
      trip.tripNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.vehicleRegNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.driverName.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active") return matchesSearch && ['dispatched', 'in_transit', 'at_destination', 'unloading', 'delayed'].includes(trip.status);
    if (activeTab === "scheduled") return matchesSearch && trip.status === 'scheduled';
    if (activeTab === "completed") return matchesSearch && trip.status === 'completed';
    return matchesSearch;
  });

  const handleViewTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setIsDetailsOpen(true);
  };

  const handleStartTrip = (tripId: string) => {
    updateTripStatus(tripId, 'dispatched');
  };

  const handleUpdateStatus = (tripId: string, status: TripStatus) => {
    updateTripStatus(tripId, status);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Navigation className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Trip Management</h1>
            <p className="text-muted-foreground">Manage deliveries with GPS tracking integration</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setIsGeofenceOpen(true)} className="relative">
            <MapPin className="h-4 w-4 mr-2" />
            Geofences
            {unacknowledgedAlerts.length > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {unacknowledgedAlerts.length}
              </Badge>
            )}
          </Button>
          <Button variant="outline" onClick={() => setIsGPSDeviceOpen(true)}>
            <Satellite className="h-4 w-4 mr-2" />
            GPS Devices
          </Button>
          <Link to="/trip-analytics">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </Link>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Trip
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total Trips</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.scheduled}</div>
                <div className="text-xs text-muted-foreground">Scheduled</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Signal className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{stats.inProgress}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <div className="text-2xl font-bold">{stats.delayed}</div>
                <div className="text-xs text-muted-foreground">Delayed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.onTimeDeliveryRate}%</div>
                <div className="text-xs text-muted-foreground">On-Time Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by trip number, vehicle, customer, or driver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All <Badge variant="secondary" className="ml-2">{trips.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="active">
            Active <Badge variant="secondary" className="ml-2">{stats.inProgress}</Badge>
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled <Badge variant="secondary" className="ml-2">{stats.scheduled}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed <Badge variant="secondary" className="ml-2">{stats.completed}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredTrips.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Navigation className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No trips found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try adjusting your search" : "Create a new trip to get started"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTrips.map(trip => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onView={handleViewTrip}
                  onStartTrip={handleStartTrip}
                  onUpdateStatus={handleUpdateStatus}
                  onCancel={cancelTrip}
                  onDelete={deleteTrip}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <TripFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={createTrip}
      />

      <TripDetailsDialog
        trip={selectedTrip}
        events={selectedTrip ? getTripEvents(selectedTrip.id) : []}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onUpdateStatus={updateTripStatus}
        onAddNote={addTripNote}
      />

      <GeofenceManager
        open={isGeofenceOpen}
        onOpenChange={setIsGeofenceOpen}
        geofences={geofences}
        alerts={alerts}
        onCreateGeofence={createGeofence}
        onUpdateGeofence={updateGeofence}
        onDeleteGeofence={deleteGeofence}
        onAcknowledgeAlert={acknowledgeAlert}
        onAcknowledgeAllAlerts={acknowledgeAllAlerts}
      />

      <GPSDeviceManager
        open={isGPSDeviceOpen}
        onOpenChange={setIsGPSDeviceOpen}
        devices={devices}
        isConnecting={isConnecting}
        onRegisterDevice={registerDevice}
        onDeleteDevice={deleteDevice}
        onTestConnection={testConnection}
      />

      <RouteOptimizer
        open={isRouteOptimizerOpen}
        onOpenChange={setIsRouteOptimizerOpen}
        trip={selectedTrip}
        optimization={selectedTrip ? getOptimization(selectedTrip.id) || null : null}
        isOptimizing={isOptimizing}
        onOptimize={optimizeRoute}
      />
    </div>
  );
};

export default TripManagement;
