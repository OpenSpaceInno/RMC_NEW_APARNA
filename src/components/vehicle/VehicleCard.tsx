import { Vehicle } from '@/types/vehicle';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Truck, 
  Fuel, 
  User, 
  Calendar, 
  Gauge,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  UserPlus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VehicleCardProps {
  vehicle: Vehicle;
  onView: (vehicle: Vehicle) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
  onAssignDriver?: (vehicle: Vehicle) => void;
}

const statusColors: Record<Vehicle['status'], string> = {
  available: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  in_transit: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  maintenance: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  inactive: 'bg-muted text-muted-foreground border-border',
};

const typeIcons: Record<Vehicle['type'], string> = {
  truck: '🚛',
  tanker: '⛽',
  trailer: '🚚',
  pickup: '🛻',
};

export const VehicleCard = ({ vehicle, onView, onEdit, onDelete, onAssignDriver }: VehicleCardProps) => {
  const isDocumentExpiring = () => {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return (
      new Date(vehicle.insuranceExpiry) <= thirtyDays ||
      new Date(vehicle.fitnessExpiry) <= thirtyDays ||
      new Date(vehicle.permitExpiry) <= thirtyDays
    );
  };

  return (
    <Card className="hover:shadow-lg transition-shadow border-border/50 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{typeIcons[vehicle.type]}</div>
            <div>
              <h3 className="font-bold text-lg text-foreground">{vehicle.registrationNo}</h3>
              <p className="text-sm text-muted-foreground">
                {vehicle.make} {vehicle.model}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDocumentExpiring() && (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
            <Badge className={statusColors[vehicle.status]}>
              {vehicle.status.replace('_', ' ')}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(vehicle)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(vehicle)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {onAssignDriver && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onAssignDriver(vehicle)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      {vehicle.currentDriver ? 'Change Driver' : 'Assign Driver'}
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(vehicle.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Truck className="h-4 w-4" />
            <span>{vehicle.capacity} {vehicle.capacityUnit}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Fuel className="h-4 w-4" />
            <span>{vehicle.fuelType}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Gauge className="h-4 w-4" />
            <span>{vehicle.odometer.toLocaleString()} km</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{vehicle.year}</span>
          </div>
        </div>

        {vehicle.currentDriver && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <User className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{vehicle.currentDriver}</span>
          </div>
        )}

        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => onView(vehicle)}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};
