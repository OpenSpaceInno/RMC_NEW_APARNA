import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Clock, AlertTriangle } from "lucide-react";
import { useTripTracking } from "@/hooks/useTripTracking";
import { useNavigate } from "react-router-dom";

export const ActiveTripsMonitor = () => {
  const { activeTrips } = useTripTracking();
  const navigate = useNavigate();

  const recentTrips = activeTrips.slice(0, 5);

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/trip-tracking')}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          Active Trips Monitor
        </CardTitle>
        <CardDescription>Real-time tracking of ongoing deliveries</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentTrips.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No active trips</p>
        ) : (
          recentTrips.map((trip) => (
            <div key={trip.tripId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">{trip.vehicleRegNo}</p>
                  {trip.status === 'delayed' && (
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{trip.customer}</p>
              </div>
              <div className="text-right space-y-1">
                <Badge variant={trip.status === 'delayed' ? 'destructive' : 'secondary'}>
                  {trip.status}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>ETA: {new Date(trip.estimatedArrival).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
