import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, MapPin, Hourglass, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ActiveTrip } from "@/types/trip";

interface RouteProgressProps {
  trip: ActiveTrip;
}

const RouteProgress = ({ trip }: RouteProgressProps) => {
  const progressPercentage = Math.min(100, Math.max(0, (trip.distanceCovered / trip.totalDistance) * 100));
  
  const calculateTimeRemaining = () => {
    const eta = new Date(trip.estimatedArrival);
    const now = new Date();
    const diff = eta.getTime() - now.getTime();
    
    if (diff < 0) {
      const delayedMinutes = Math.abs(Math.floor(diff / 60000));
      const hours = Math.floor(delayedMinutes / 60);
      const mins = delayedMinutes % 60;
      if (hours > 0) {
        return `${hours}h ${mins}m delayed`;
      }
      return `${mins}m delayed`;
    }

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `in ${hours}h ${mins}m`;
    }
    return `in ${mins}m`;
  };

  const isDelayed = new Date(trip.estimatedArrival).getTime() < Date.now();

  // RMC Concrete Hydration & Slump retention timer
  const maxTransitMinutes = trip.maxTransitMinutes || 90;
  const batchTime = trip.batchTime ? new Date(trip.batchTime) : new Date(trip.startTime);
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - batchTime.getTime()) / 60000));
  const remainingTransitMinutes = Math.max(0, maxTransitMinutes - elapsedMinutes);
  const hydrationPercentage = Math.min(100, (elapsedMinutes / maxTransitMinutes) * 100);

  const getSlumpStatus = () => {
    if (remainingTransitMinutes === 0 || elapsedMinutes >= maxTransitMinutes) {
      return {
        label: 'INITIAL SETTING RISK',
        variant: 'destructive' as const,
        description: 'Exceeded 90m maximum transit window. High risk of slump rejection at pour site.',
        color: 'text-destructive',
      };
    }
    if (remainingTransitMinutes <= 20) {
      return {
        label: 'SLUMP DEPRECIATION WARNING',
        variant: 'outline' as const,
        description: 'Hydration accelerating. Driver must maintain high drum agitation and avoid stops.',
        color: 'text-amber-500',
      };
    }
    return {
      label: 'OPTIMAL WORKABILITY',
      variant: 'default' as const,
      description: 'Slump retention within nominal IS 4926 standard window.',
      color: 'text-green-600',
    };
  };

  const slumpStatus = getSlumpStatus();

  return (
    <div className="space-y-6">
      {/* Route Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Route Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Trip Progress</span>
              <span className="text-2xl font-bold text-primary">{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground">Covered</div>
              <div className="text-lg font-bold text-foreground">{trip.distanceCovered.toFixed(1)} km</div>
            </div>
            <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground">Remaining</div>
              <div className="text-lg font-bold text-foreground">{trip.distanceRemaining.toFixed(1)} km</div>
            </div>
            <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-lg font-bold text-foreground">{trip.totalDistance.toFixed(1)} km</div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">ETA</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-foreground">
                  {new Date(trip.estimatedArrival).toLocaleTimeString('en-IN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div className={`text-xs ${isDelayed ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                  {calculateTimeRemaining()}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Destination</span>
              </div>
              <div className="font-semibold text-foreground">{trip.destination}</div>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t">
            <div className="text-sm font-medium mb-2">Waypoints</div>
            {trip.route.map((waypoint, index) => (
              <div 
                key={waypoint.id}
                className={`flex items-center justify-between p-2 rounded ${
                  waypoint.reached ? 'bg-primary/10' : 'bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    waypoint.reached 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium">{waypoint.name}</span>
                </div>
                {waypoint.reached ? (
                  <Badge variant="default" className="text-xs">Reached</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {new Date(waypoint.eta).toLocaleTimeString('en-IN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Concrete Slump & Setting Time Monitor */}
      <Card className="border-amber-500/20 bg-gradient-to-br from-card to-amber-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Hourglass className="h-5 w-5 text-amber-500" />
              Concrete Slump & Setting Monitor
            </CardTitle>
            <Badge variant={slumpStatus.variant}>
              {slumpStatus.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Transit Hydration Window ({maxTransitMinutes}m limit)</span>
              <span className="font-semibold">{elapsedMinutes}m elapsed / {remainingTransitMinutes}m left</span>
            </div>
            <Progress 
              value={hydrationPercentage} 
              className={`h-2.5 ${hydrationPercentage >= 85 ? '[&>div]:bg-destructive' : hydrationPercentage >= 65 ? '[&>div]:bg-amber-500' : '[&>div]:bg-green-500'}`} 
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-2.5 bg-background/80 rounded-md border text-xs">
              <div className="text-muted-foreground">Batch Production Time</div>
              <div className="font-semibold mt-0.5">{batchTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
            </div>
            <div className="p-2.5 bg-background/80 rounded-md border text-xs">
              <div className="text-muted-foreground">Mixer Drum Agitation</div>
              <div className="font-semibold mt-0.5 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-blue-500 animate-spin" />
                {trip.drumRpm ? `${trip.drumRpm} RPM` : '12 RPM'} (Transit Mode)
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-muted/40 rounded-md text-xs text-muted-foreground flex items-start gap-2">
            {slumpStatus.variant === 'destructive' ? (
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            ) : slumpStatus.variant === 'outline' ? (
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            )}
            <span>{slumpStatus.description}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteProgress;
