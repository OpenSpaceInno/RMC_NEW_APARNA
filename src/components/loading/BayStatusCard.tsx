import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingBay } from "@/types/loading";
import { MapPin, Truck, AlertCircle } from "lucide-react";

interface BayStatusCardProps {
  bay: LoadingBay;
  onClick: () => void;
}

const getStatusColor = (status: LoadingBay['status']) => {
  switch (status) {
    case 'available':
      return 'bg-success text-success-foreground';
    case 'loading':
      return 'bg-primary text-primary-foreground';
    case 'quality_check':
      return 'bg-warning text-warning-foreground';
    case 'maintenance':
      return 'bg-muted text-muted-foreground';
    case 'offline':
      return 'bg-destructive text-destructive-foreground';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
};

const getStatusIcon = (status: LoadingBay['status']) => {
  switch (status) {
    case 'loading':
      return <Truck className="h-8 w-8 animate-pulse" />;
    case 'maintenance':
    case 'offline':
      return <AlertCircle className="h-8 w-8" />;
    default:
      return <Truck className="h-8 w-8" />;
  }
};

const BayStatusCard = ({ bay, onClick }: BayStatusCardProps) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{bay.name}</span>
          <Badge className={getStatusColor(bay.status)}>
            {bay.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center py-4">
          {getStatusIcon(bay.status)}
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{bay.location}</span>
          </div>
          
          {bay.currentSession && (
            <div className="pt-2 border-t">
              <div className="font-medium text-foreground">
                Vehicle: {bay.currentSession.vehicleRegNo}
              </div>
              <div className="text-muted-foreground">
                Progress: {Math.round(bay.currentSession.overallProgress)}%
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BayStatusCard;
