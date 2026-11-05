import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Truck, 
  User, 
  MapPin, 
  Clock, 
  Eye, 
  Play, 
  Square, 
  MoreVertical,
  Navigation,
  Signal,
  SignalLow,
  SignalZero,
  Package
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trip, TripStatus } from "@/types/tripManagement";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TripCardProps {
  trip: Trip;
  onView: (trip: Trip) => void;
  onStartTrip?: (tripId: string) => void;
  onUpdateStatus?: (tripId: string, status: TripStatus) => void;
  onCancel?: (tripId: string) => void;
  onDelete?: (tripId: string) => void;
}

const getStatusConfig = (status: TripStatus) => {
  const configs: Record<TripStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
    scheduled: { label: 'Scheduled', variant: 'secondary', color: 'text-muted-foreground' },
    dispatched: { label: 'Dispatched', variant: 'default', color: 'text-blue-500' },
    in_transit: { label: 'In Transit', variant: 'default', color: 'text-primary' },
    at_destination: { label: 'At Destination', variant: 'default', color: 'text-amber-500' },
    unloading: { label: 'Unloading', variant: 'default', color: 'text-orange-500' },
    completed: { label: 'Completed', variant: 'outline', color: 'text-green-500' },
    cancelled: { label: 'Cancelled', variant: 'destructive', color: 'text-destructive' },
    delayed: { label: 'Delayed', variant: 'destructive', color: 'text-destructive' },
  };
  return configs[status];
};

const getPriorityConfig = (priority: Trip['priority']) => {
  const configs = {
    low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
    normal: { label: 'Normal', className: 'bg-secondary text-secondary-foreground' },
    high: { label: 'High', className: 'bg-amber-500/20 text-amber-600' },
    urgent: { label: 'Urgent', className: 'bg-destructive/20 text-destructive' },
  };
  return configs[priority];
};

const getSignalIcon = (strength?: Trip['gpsConfig']['signalStrength']) => {
  switch (strength) {
    case 'strong': return <Signal className="h-4 w-4 text-green-500" />;
    case 'moderate': return <SignalLow className="h-4 w-4 text-amber-500" />;
    case 'weak': return <SignalZero className="h-4 w-4 text-destructive" />;
    default: return <SignalZero className="h-4 w-4 text-muted-foreground" />;
  }
};

const TripCard = ({ 
  trip, 
  onView, 
  onStartTrip, 
  onUpdateStatus,
  onCancel, 
  onDelete 
}: TripCardProps) => {
  const statusConfig = getStatusConfig(trip.status);
  const priorityConfig = getPriorityConfig(trip.priority);
  const progressPercentage = (trip.distanceCovered / trip.totalDistance) * 100;
  const isActive = ['dispatched', 'in_transit', 'at_destination', 'unloading', 'delayed'].includes(trip.status);

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      trip.status === 'delayed' && "border-destructive/50",
      trip.priority === 'urgent' && trip.status !== 'completed' && "border-amber-500/50"
    )}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{trip.tripNumber}</span>
                <Badge className={priorityConfig.className} variant="secondary">
                  {priorityConfig.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-4 w-4" />
                <span>{trip.vehicleRegNo}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={statusConfig.variant}>
                {statusConfig.label}
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(trip)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  
                  {trip.status === 'scheduled' && onStartTrip && (
                    <DropdownMenuItem onClick={() => onStartTrip(trip.id)}>
                      <Play className="h-4 w-4 mr-2" />
                      Start Trip
                    </DropdownMenuItem>
                  )}
                  
                  {trip.status === 'in_transit' && onUpdateStatus && (
                    <DropdownMenuItem onClick={() => onUpdateStatus(trip.id, 'at_destination')}>
                      <MapPin className="h-4 w-4 mr-2" />
                      Mark Arrived
                    </DropdownMenuItem>
                  )}
                  
                  {trip.status === 'at_destination' && onUpdateStatus && (
                    <DropdownMenuItem onClick={() => onUpdateStatus(trip.id, 'completed')}>
                      <Square className="h-4 w-4 mr-2" />
                      Complete Trip
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  {!['completed', 'cancelled'].includes(trip.status) && onCancel && (
                    <DropdownMenuItem 
                      onClick={() => onCancel(trip.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      Cancel Trip
                    </DropdownMenuItem>
                  )}
                  
                  {['completed', 'cancelled'].includes(trip.status) && onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(trip.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      Delete Trip
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Customer & Material */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium text-foreground">{trip.customerName}</div>
                <div className="text-muted-foreground">{trip.driverName}</div>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium text-foreground">{trip.material}</div>
                <div className="text-muted-foreground">
                  {trip.unit === 'kg' 
                    ? `${(trip.quantity / 1000).toFixed(1)} tons`
                    : `${trip.quantity} ${trip.unit}`
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Route */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-foreground">{trip.origin.name}</span>
                <Navigation className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="truncate text-foreground">{trip.destination.name}</span>
              </div>
              <div className="text-muted-foreground">
                {trip.totalDistance} km
              </div>
            </div>
          </div>

          {/* Time & GPS */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {trip.status === 'scheduled' 
                  ? `Scheduled: ${format(new Date(trip.scheduledStartTime), 'HH:mm')}`
                  : `ETA: ${format(new Date(trip.estimatedArrival), 'HH:mm')}`
                }
              </span>
            </div>
            
            {trip.gpsConfig.isEnabled && (
              <div className="flex items-center gap-1">
                {getSignalIcon(trip.gpsConfig.signalStrength)}
                <span className="text-xs text-muted-foreground">GPS</span>
              </div>
            )}
          </div>

          {/* Progress bar for active trips */}
          {isActive && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{trip.distanceCovered.toFixed(1)} km covered</span>
                <span>{trip.distanceRemaining.toFixed(1)} km remaining</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    trip.status === 'delayed' ? "bg-destructive" : "bg-primary"
                  )}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TripCard;
