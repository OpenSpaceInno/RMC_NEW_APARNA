import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, CheckCircle2, Truck, AlertCircle, Package } from "lucide-react";
import { ActiveTrip, DeliveryEvent } from "@/types/trip";

interface DeliveryTimelineProps {
  trip: ActiveTrip;
}

const DeliveryTimeline = ({ trip }: DeliveryTimelineProps) => {
  const getEventIcon = (type: DeliveryEvent['type']) => {
    switch (type) {
      case 'dispatched':
        return <Truck className="h-4 w-4" />;
      case 'in_transit':
        return <MapPin className="h-4 w-4" />;
      case 'arrival':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'unloading':
        return <Package className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'delayed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: DeliveryEvent['type']) => {
    switch (type) {
      case 'dispatched':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'in_transit':
        return 'text-primary bg-primary/10 border-primary/20';
      case 'arrival':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'unloading':
        return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'completed':
        return 'text-green-600 bg-green-600/10 border-green-600/20';
      case 'delayed':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      default:
        return 'text-muted-foreground bg-muted/50 border-border';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Delivery Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-border" />

          {trip.events.map((event, index) => (
            <div key={event.id} className="relative flex gap-3">
              {/* Timeline dot */}
              <div className={`relative z-10 w-9 h-9 rounded-full border-2 flex items-center justify-center ${getEventColor(event.type)}`}>
                {getEventIcon(event.type)}
              </div>

              {/* Event content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground capitalize">
                        {event.type.replace('_', ' ')}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {new Date(event.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    {event.location && (
                      <div className="text-xs text-muted-foreground mt-1 font-mono">
                        {event.location.latitude.toFixed(4)}, {event.location.longitude.toFixed(4)}
                      </div>
                    )}
                  </div>
                </div>

                {event.evidence && event.evidence.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {event.evidence.map((url, i) => (
                      <div
                        key={i}
                        className="w-16 h-16 rounded border bg-muted overflow-hidden"
                      >
                        <img
                          src={url}
                          alt={`Evidence ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Current status indicator */}
          {trip.status === 'active' && (
            <div className="relative flex gap-3">
              <div className="relative z-10 w-9 h-9 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>
              <div className="flex-1">
                <span className="font-semibold text-primary">In Progress</span>
                <p className="text-sm text-muted-foreground">
                  Live tracking active • Updated {new Date(trip.currentLocation.timestamp).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryTimeline;
