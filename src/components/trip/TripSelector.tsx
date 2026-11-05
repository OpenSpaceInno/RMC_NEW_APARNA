import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Clock } from "lucide-react";
import { ActiveTrip } from "@/types/trip";
import { cn } from "@/lib/utils";

interface TripSelectorProps {
  trips: ActiveTrip[];
  selectedTripId: string | null;
  onSelectTrip: (tripId: string) => void;
}

const TripSelector = ({ trips, selectedTripId, onSelectTrip }: TripSelectorProps) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Active Trips ({trips.length})
      </h3>
      
      <div className="space-y-2">
        {trips.map((trip) => {
          const isSelected = trip.tripId === selectedTripId;
          const progressPercentage = (trip.distanceCovered / trip.totalDistance) * 100;

          return (
            <Card
              key={trip.tripId}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected && "ring-2 ring-primary shadow-md"
              )}
              onClick={() => onSelectTrip(trip.tripId)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-bold text-foreground">{trip.vehicleRegNo}</div>
                        <div className="text-xs text-muted-foreground">{trip.tripId}</div>
                      </div>
                    </div>
                    <Badge variant={trip.status === 'active' ? 'default' : 'secondary'}>
                      {trip.status}
                    </Badge>
                  </div>

                  <div className="text-sm space-y-1">
                    <div className="font-medium text-foreground">{trip.customer}</div>
                    <div className="text-muted-foreground">{trip.destination}</div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>ETA: {new Date(trip.estimatedArrival).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}</span>
                    </div>
                    <div className="font-semibold text-primary">
                      {progressPercentage.toFixed(0)}%
                    </div>
                  </div>

                  {/* Mini progress bar */}
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TripSelector;
