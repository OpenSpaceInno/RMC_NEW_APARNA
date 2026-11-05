import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  Truck, 
  User, 
  MapPin, 
  Clock, 
  Package, 
  Navigation, 
  Phone,
  Signal,
  SignalLow,
  SignalZero,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Square,
  MessageSquare,
  Send,
  History
} from "lucide-react";
import { Trip, TripEvent, TripStatus } from "@/types/tripManagement";
import { format } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TripDetailsDialogProps {
  trip: Trip | null;
  events: TripEvent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus?: (tripId: string, status: TripStatus) => void;
  onAddNote?: (tripId: string, note: string) => void;
  onUpdateGPS?: (tripId: string, config: { isEnabled: boolean }) => void;
}

const getStatusConfig = (status: TripStatus) => {
  const configs: Record<TripStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    scheduled: { label: 'Scheduled', variant: 'secondary', icon: <Clock className="h-4 w-4" /> },
    dispatched: { label: 'Dispatched', variant: 'default', icon: <Play className="h-4 w-4" /> },
    in_transit: { label: 'In Transit', variant: 'default', icon: <Navigation className="h-4 w-4" /> },
    at_destination: { label: 'At Destination', variant: 'default', icon: <MapPin className="h-4 w-4" /> },
    unloading: { label: 'Unloading', variant: 'default', icon: <Package className="h-4 w-4" /> },
    completed: { label: 'Completed', variant: 'outline', icon: <CheckCircle className="h-4 w-4" /> },
    cancelled: { label: 'Cancelled', variant: 'destructive', icon: <XCircle className="h-4 w-4" /> },
    delayed: { label: 'Delayed', variant: 'destructive', icon: <AlertTriangle className="h-4 w-4" /> },
  };
  return configs[status];
};

const getEventIcon = (type: TripEvent['type']) => {
  const icons: Record<TripEvent['type'], React.ReactNode> = {
    created: <Clock className="h-4 w-4 text-muted-foreground" />,
    dispatched: <Play className="h-4 w-4 text-blue-500" />,
    started: <Navigation className="h-4 w-4 text-primary" />,
    waypoint_reached: <MapPin className="h-4 w-4 text-green-500" />,
    delay_detected: <AlertTriangle className="h-4 w-4 text-destructive" />,
    arrived: <MapPin className="h-4 w-4 text-amber-500" />,
    unloading_started: <Package className="h-4 w-4 text-orange-500" />,
    completed: <CheckCircle className="h-4 w-4 text-green-500" />,
    cancelled: <XCircle className="h-4 w-4 text-destructive" />,
    note_added: <MessageSquare className="h-4 w-4 text-muted-foreground" />,
    gps_update: <Signal className="h-4 w-4 text-muted-foreground" />,
  };
  return icons[type];
};

const TripDetailsDialog = ({ 
  trip, 
  events, 
  open, 
  onOpenChange, 
  onUpdateStatus,
  onAddNote,
  onUpdateGPS
}: TripDetailsDialogProps) => {
  const [newNote, setNewNote] = useState('');

  if (!trip) return null;

  const statusConfig = getStatusConfig(trip.status);
  const progressPercentage = (trip.distanceCovered / trip.totalDistance) * 100;
  const isActive = ['dispatched', 'in_transit', 'at_destination', 'unloading', 'delayed'].includes(trip.status);

  const handleAddNote = () => {
    if (newNote.trim() && onAddNote) {
      onAddNote(trip.id, newNote.trim());
      setNewNote('');
    }
  };

  const getSignalIcon = (strength?: Trip['gpsConfig']['signalStrength']) => {
    switch (strength) {
      case 'strong': return <Signal className="h-5 w-5 text-green-500" />;
      case 'moderate': return <SignalLow className="h-5 w-5 text-amber-500" />;
      case 'weak': return <SignalZero className="h-5 w-5 text-destructive" />;
      default: return <SignalZero className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Trip {trip.tripNumber}
            </DialogTitle>
            <Badge variant={statusConfig.variant} className="flex items-center gap-1">
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="route">Route</TabsTrigger>
              <TabsTrigger value="gps">GPS Status</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Progress */}
              {isActive && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Trip Progress</span>
                        <span className="text-muted-foreground">{progressPercentage.toFixed(0)}%</span>
                      </div>
                      <Progress value={progressPercentage} className="h-3" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{trip.distanceCovered.toFixed(1)} km covered</span>
                        <span>{trip.distanceRemaining.toFixed(1)} km remaining</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Vehicle & Driver */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Vehicle
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">{trip.vehicleRegNo}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Driver
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-medium">{trip.driverName}</div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {trip.driverPhone}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Customer & Cargo */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Cargo Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Customer</div>
                      <div className="font-medium">{trip.customerName}</div>
                      {trip.customerContact && (
                        <div className="text-sm text-muted-foreground">{trip.customerContact}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Material</div>
                      <div className="font-medium">{trip.material}</div>
                      <div className="text-sm text-muted-foreground">
                        {trip.unit === 'kg' 
                          ? `${(trip.quantity / 1000).toFixed(2)} tons`
                          : `${trip.quantity} ${trip.unit}`
                        }
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timing */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Timing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Scheduled Start</div>
                      <div className="font-medium">
                        {format(new Date(trip.scheduledStartTime), 'PPp')}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Estimated Arrival</div>
                      <div className="font-medium">
                        {format(new Date(trip.estimatedArrival), 'PPp')}
                      </div>
                    </div>
                    {trip.actualStartTime && (
                      <div>
                        <div className="text-muted-foreground">Actual Start</div>
                        <div className="font-medium">
                          {format(new Date(trip.actualStartTime), 'PPp')}
                        </div>
                      </div>
                    )}
                    {trip.actualArrival && (
                      <div>
                        <div className="text-muted-foreground">Actual Arrival</div>
                        <div className="font-medium">
                          {format(new Date(trip.actualArrival), 'PPp')}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              {onUpdateStatus && !['completed', 'cancelled'].includes(trip.status) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-2 flex-wrap">
                    {trip.status === 'scheduled' && (
                      <Button size="sm" onClick={() => onUpdateStatus(trip.id, 'dispatched')}>
                        <Play className="h-4 w-4 mr-1" />
                        Dispatch
                      </Button>
                    )}
                    {trip.status === 'dispatched' && (
                      <Button size="sm" onClick={() => onUpdateStatus(trip.id, 'in_transit')}>
                        <Navigation className="h-4 w-4 mr-1" />
                        Start Transit
                      </Button>
                    )}
                    {trip.status === 'in_transit' && (
                      <Button size="sm" onClick={() => onUpdateStatus(trip.id, 'at_destination')}>
                        <MapPin className="h-4 w-4 mr-1" />
                        Mark Arrived
                      </Button>
                    )}
                    {trip.status === 'at_destination' && (
                      <Button size="sm" onClick={() => onUpdateStatus(trip.id, 'unloading')}>
                        <Package className="h-4 w-4 mr-1" />
                        Start Unloading
                      </Button>
                    )}
                    {trip.status === 'unloading' && (
                      <Button size="sm" onClick={() => onUpdateStatus(trip.id, 'completed')}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => onUpdateStatus(trip.id, 'cancelled')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="route" className="space-y-4 mt-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-500" />
                      Origin
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-medium">{trip.origin.name}</div>
                    <div className="text-sm text-muted-foreground">{trip.origin.address}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Coordinates: {trip.origin.location.latitude.toFixed(4)}, {trip.origin.location.longitude.toFixed(4)}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-0.5 h-8 bg-border" />
                    <div className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                      {trip.totalDistance} km
                    </div>
                    <div className="w-0.5 h-8 bg-border" />
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-destructive" />
                      Destination
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-medium">{trip.destination.name}</div>
                    <div className="text-sm text-muted-foreground">{trip.destination.address}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Coordinates: {trip.destination.location.latitude.toFixed(4)}, {trip.destination.location.longitude.toFixed(4)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="gps" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Signal className="h-4 w-4" />
                    GPS Tracking Status
                  </CardTitle>
                  <CardDescription>
                    Real-time location tracking configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getSignalIcon(trip.gpsConfig.signalStrength)}
                      <div>
                        <div className="font-medium">
                          {trip.gpsConfig.isEnabled ? 'GPS Tracking Active' : 'GPS Tracking Disabled'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {trip.gpsConfig.deviceId || 'No device assigned'}
                        </div>
                      </div>
                    </div>
                    <Badge variant={trip.gpsConfig.isEnabled ? 'default' : 'secondary'}>
                      {trip.gpsConfig.signalStrength || 'offline'}
                    </Badge>
                  </div>

                  {trip.currentLocation && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Current Location</div>
                        <div className="font-mono text-sm">
                          {trip.currentLocation.latitude.toFixed(6)}, {trip.currentLocation.longitude.toFixed(6)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Speed / Heading</div>
                        <div className="font-mono text-sm">
                          {trip.currentLocation.speed.toFixed(0)} km/h / {trip.currentLocation.heading.toFixed(0)}°
                        </div>
                      </div>
                    </div>
                  )}

                  {trip.gpsConfig.lastPing && (
                    <div>
                      <div className="text-sm text-muted-foreground">Last GPS Ping</div>
                      <div className="text-sm">
                        {format(new Date(trip.gpsConfig.lastPing), 'PPpp')}
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="bg-primary/5 rounded-lg p-4">
                    <h4 className="font-medium text-sm mb-2">GPS Integration Features</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Real-time location updates (every {trip.gpsConfig.trackingInterval}s)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Speed and heading monitoring
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Geofence entry/exit alerts
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Route deviation detection
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Automatic ETA recalculation
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Trip Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Add Note */}
                  {onAddNote && !['completed', 'cancelled'].includes(trip.status) && (
                    <div className="flex gap-2 mb-4">
                      <Input
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a note..."
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                      />
                      <Button size="icon" onClick={handleAddNote} disabled={!newNote.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="space-y-4">
                    {events.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No events recorded yet
                      </div>
                    ) : (
                      events.map((event, index) => (
                        <div key={event.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="p-2 rounded-full bg-muted">
                              {getEventIcon(event.type)}
                            </div>
                            {index < events.length - 1 && (
                              <div className="w-0.5 flex-1 bg-border my-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-medium text-sm">{event.description}</div>
                                {event.location && (
                                  <div className="text-xs text-muted-foreground">
                                    Location: {event.location.latitude.toFixed(4)}, {event.location.longitude.toFixed(4)}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(event.timestamp), 'HH:mm')}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {format(new Date(event.timestamp), 'PP')}
                              {event.createdBy && ` • ${event.createdBy}`}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TripDetailsDialog;
