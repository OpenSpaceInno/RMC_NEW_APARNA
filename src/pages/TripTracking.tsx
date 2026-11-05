import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Route, 
  User, 
  Phone, 
  Package, 
  Play, 
  Pause, 
  FastForward, 
  Navigation, 
  AlertTriangle, 
  CheckCircle2, 
  Radio
} from "lucide-react";
import { useTripTracking } from "@/hooks/useTripTracking";
import TripMap from "@/components/trip/TripMap";
import RouteProgress from "@/components/trip/RouteProgress";
import DeliveryTimeline from "@/components/trip/DeliveryTimeline";
import TripSelector from "@/components/trip/TripSelector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TripTracking = () => {
  const { 
    activeTrips, 
    selectedTrip, 
    selectTrip,
    isSimulating,
    setIsSimulating,
    simSpeed,
    setSimSpeed,
    advanceWaypoint,
    reportTripDelay,
    markTripCompleted
  } = useTripTracking();

  const [delayDialogOpen, setDelayDialogOpen] = useState(false);
  const [delayReason, setDelayReason] = useState("Traffic congestion on major arterial corridor");

  const handleConfirmDelay = () => {
    if (selectedTrip) {
      reportTripDelay(selectedTrip.tripId, delayReason);
      setDelayDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Route className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Trip Tracking & Replay</h1>
            <p className="text-muted-foreground">Real-time GPS tracking with slump retention countdown and fleet controls</p>
          </div>
        </div>

        {/* Global GPS Telemetry status badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-card text-xs font-medium">
          <Radio className={`h-3.5 w-3.5 ${isSimulating ? 'text-green-500 animate-pulse' : 'text-amber-500'}`} />
          <span>{isSimulating ? `Live GPS Feeds Online (${simSpeed}x)` : 'Simulation Paused'}</span>
        </div>
      </div>

      {activeTrips.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Active Trips</CardTitle>
            <CardDescription>There are currently no active trips to track</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-center py-8">
              Trips will appear here when vehicles are dispatched
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left sidebar - Trip list */}
          <div className="lg:col-span-1">
            <TripSelector
              trips={activeTrips}
              selectedTripId={selectedTrip?.tripId || null}
              onSelectTrip={selectTrip}
            />
          </div>

          {/* Main content - Selected trip details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedTrip ? (
              <>
                {/* Trip header */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-2xl font-bold text-foreground mb-1">
                            {selectedTrip.vehicleRegNo}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Trip ID: {selectedTrip.tripId}
                          </div>
                        </div>
                        <Badge 
                          variant={selectedTrip.status === 'completed' ? 'secondary' : selectedTrip.status === 'delayed' ? 'destructive' : 'default'} 
                          className="text-sm uppercase"
                        >
                          {selectedTrip.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-muted-foreground text-xs">Driver</div>
                              <div className="font-semibold text-foreground">{selectedTrip.driverName}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-muted-foreground text-xs">Contact</div>
                              <div className="font-semibold text-foreground">{selectedTrip.driverPhone}</div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-muted-foreground text-xs">Material</div>
                              <div className="font-semibold text-foreground">{selectedTrip.material}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-muted-foreground text-xs">Quantity</div>
                              <div className="font-semibold text-foreground">
                                {(selectedTrip.quantity / 1000).toFixed(1)} tons
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Dispatcher Controls Bar */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="py-4 px-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Simulation:
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsSimulating(!isSimulating)}
                          className="h-8 gap-1.5 text-xs font-medium"
                        >
                          {isSimulating ? <Pause className="h-3.5 w-3.5 text-amber-500" /> : <Play className="h-3.5 w-3.5 text-green-500" />}
                          {isSimulating ? 'Pause GPS' : 'Resume GPS'}
                        </Button>
                        <div className="flex items-center gap-1 bg-background/80 border rounded-md p-0.5">
                          {[1, 2, 5].map((speed) => (
                            <Button
                              key={speed}
                              variant={simSpeed === speed ? 'secondary' : 'ghost'}
                              size="sm"
                              className="h-7 px-2 text-xs font-mono"
                              onClick={() => setSimSpeed(speed)}
                            >
                              {speed}x
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => advanceWaypoint(selectedTrip.tripId)}
                          disabled={selectedTrip.status === 'completed'}
                        >
                          <Navigation className="h-3.5 w-3.5 text-blue-500" />
                          Advance Waypoint
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs text-amber-600 hover:text-amber-700"
                          onClick={() => setDelayDialogOpen(true)}
                          disabled={selectedTrip.status === 'completed'}
                        >
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          Report Delay
                        </Button>

                        <Button
                          variant="default"
                          size="sm"
                          className="h-8 gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => markTripCompleted(selectedTrip.tripId)}
                          disabled={selectedTrip.status === 'completed'}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark Delivered
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Map */}
                <TripMap trip={selectedTrip} />

                {/* Route Progress */}
                <RouteProgress trip={selectedTrip} />

                {/* Delivery Timeline */}
                <DeliveryTimeline trip={selectedTrip} />
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Select a trip to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Delay Reporting Dialog */}
      <Dialog open={delayDialogOpen} onOpenChange={setDelayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Transit Delay & Slump Alert</DialogTitle>
            <DialogDescription>
              Reporting an en-route delay alerts the batch plant QA desk and logs an audit trail incident.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Delay Cause</label>
              <Select value={delayReason} onValueChange={setDelayReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose delay reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Traffic congestion on major arterial corridor">Traffic congestion on major arterial corridor</SelectItem>
                  <SelectItem value="Site pump access blocked by customer cranes">Site pump access blocked by customer cranes</SelectItem>
                  <SelectItem value="Mechanical warning on mixer drum hydrostatic drive">Mechanical warning on mixer drum drive</SelectItem>
                  <SelectItem value="Rerouted due to municipal water line maintenance">Rerouted due to road maintenance</SelectItem>
                  <SelectItem value="Customer requested staggered discharge timing">Customer requested staggered discharge</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDelayDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelay}>
              Confirm Delay Notice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TripTracking;
