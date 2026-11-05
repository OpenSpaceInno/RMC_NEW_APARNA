import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Route, 
  TrendingDown, 
  Clock, 
  MapPin, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  Navigation,
  Zap
} from "lucide-react";
import { Trip } from "@/types/tripManagement";
import { RouteOptimization } from "@/types/gps";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface RouteOptimizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: Trip | null;
  optimization: RouteOptimization | null;
  isOptimizing: boolean;
  onOptimize: (trip: Trip) => void;
}

const RouteOptimizer = ({
  open,
  onOpenChange,
  trip,
  optimization,
  isOptimizing,
  onOptimize,
}: RouteOptimizerProps) => {
  if (!trip) return null;

  const distanceSaved = optimization 
    ? optimization.originalDistance - optimization.optimizedDistance 
    : 0;
  const timeSaved = optimization 
    ? optimization.originalDuration - optimization.optimizedDuration 
    : 0;

  const getTrafficColor = (conditions: string) => {
    switch (conditions) {
      case 'light': return 'text-green-500';
      case 'moderate': return 'text-amber-500';
      case 'heavy': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getTrafficBadgeVariant = (conditions: string): 'default' | 'secondary' | 'destructive' => {
    switch (conditions) {
      case 'light': return 'default';
      case 'moderate': return 'secondary';
      case 'heavy': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            Route Optimization
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4">
            {/* Trip Info */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{trip.tripNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      {trip.origin.name} → {trip.destination.name}
                    </div>
                  </div>
                  <Badge variant="outline">{trip.totalDistance} km</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Optimize Button */}
            {!optimization && !isOptimizing && (
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => onOptimize(trip)}
              >
                <Zap className="h-4 w-4 mr-2" />
                Optimize Route
              </Button>
            )}

            {/* Loading State */}
            {isOptimizing && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                  <h3 className="text-lg font-medium">Calculating Optimal Route</h3>
                  <p className="text-muted-foreground">
                    Analyzing traffic conditions and alternative paths...
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Optimization Results */}
            {optimization && (
              <>
                {/* Summary */}
                <Card className="border-green-500/50 bg-green-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Optimization Complete
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-background rounded-lg">
                        <TrendingDown className="h-6 w-6 mx-auto mb-2 text-green-500" />
                        <div className="text-2xl font-bold text-green-500">
                          {distanceSaved.toFixed(1)} km
                        </div>
                        <div className="text-sm text-muted-foreground">Distance Saved</div>
                      </div>
                      <div className="text-center p-4 bg-background rounded-lg">
                        <Clock className="h-6 w-6 mx-auto mb-2 text-green-500" />
                        <div className="text-2xl font-bold text-green-500">
                          {Math.round(timeSaved)} min
                        </div>
                        <div className="text-sm text-muted-foreground">Time Saved</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Traffic Conditions */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className={cn("h-4 w-4", getTrafficColor(optimization.trafficConditions))} />
                      Current Traffic Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={getTrafficBadgeVariant(optimization.trafficConditions)}>
                      {optimization.trafficConditions.charAt(0).toUpperCase() + optimization.trafficConditions.slice(1)} Traffic
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      Calculated at {format(new Date(optimization.calculatedAt), 'PPpp')}
                    </p>
                  </CardContent>
                </Card>

                {/* Route Comparison */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Route Comparison</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Original Route</span>
                        <span className="text-muted-foreground">
                          {optimization.originalDistance} km • {Math.round(optimization.originalDuration)} min
                        </span>
                      </div>
                      <Progress value={100} className="h-2 bg-muted" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Optimized Route
                        </span>
                        <span className="text-green-500 font-medium">
                          {optimization.optimizedDistance} km • {Math.round(optimization.optimizedDuration)} min
                        </span>
                      </div>
                      <Progress 
                        value={(optimization.optimizedDistance / optimization.originalDistance) * 100} 
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Alternative Routes */}
                {optimization.alternativeRoutes && optimization.alternativeRoutes.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Navigation className="h-4 w-4" />
                        Alternative Routes
                      </CardTitle>
                      <CardDescription>
                        Other options based on current conditions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {optimization.alternativeRoutes.map((alt, index) => (
                        <div 
                          key={index}
                          className="p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-sm">Route {index + 1}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {alt.description}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{alt.distance} km</div>
                              <div className="text-xs text-muted-foreground">{alt.duration} min</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Re-optimize Button */}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => onOptimize(trip)}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Re-calculate Route
                </Button>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default RouteOptimizer;
