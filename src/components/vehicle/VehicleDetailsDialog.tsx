import { Vehicle, MaintenanceRecord } from '@/types/vehicle';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Truck, 
  Fuel, 
  User, 
  Calendar, 
  Gauge,
  Phone,
  FileText,
  Wrench,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface VehicleDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
  maintenanceRecords: MaintenanceRecord[];
  onEdit: (vehicle: Vehicle) => void;
  onUpdateStatus: (vehicleId: string, status: Vehicle['status']) => void;
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

export const VehicleDetailsDialog = ({
  open,
  onOpenChange,
  vehicle,
  maintenanceRecords,
  onEdit,
  onUpdateStatus,
  onAssignDriver,
}: VehicleDetailsDialogProps) => {
  if (!vehicle) return null;

  const getExpiryStatus = (date: string) => {
    const daysUntil = differenceInDays(new Date(date), new Date());
    if (daysUntil < 0) return { status: 'expired', color: 'text-destructive' };
    if (daysUntil <= 30) return { status: 'expiring', color: 'text-amber-500' };
    return { status: 'valid', color: 'text-emerald-500' };
  };

  const insuranceStatus = getExpiryStatus(vehicle.insuranceExpiry);
  const fitnessStatus = getExpiryStatus(vehicle.fitnessExpiry);
  const permitStatus = getExpiryStatus(vehicle.permitExpiry);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{typeIcons[vehicle.type]}</span>
              <div>
                <DialogTitle className="text-2xl">{vehicle.registrationNo}</DialogTitle>
                <p className="text-muted-foreground">
                  {vehicle.make} {vehicle.model} ({vehicle.year})
                </p>
              </div>
            </div>
            <Badge className={statusColors[vehicle.status]}>
              {vehicle.status.replace('_', ' ')}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Truck className="h-4 w-4" />
                      <span>Capacity</span>
                    </div>
                    <span className="font-medium">{vehicle.capacity} {vehicle.capacityUnit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Fuel className="h-4 w-4" />
                      <span>Fuel Type</span>
                    </div>
                    <span className="font-medium capitalize">{vehicle.fuelType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Gauge className="h-4 w-4" />
                      <span>Odometer</span>
                    </div>
                    <span className="font-medium">{vehicle.odometer.toLocaleString()} km</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Fuel className="h-4 w-4" />
                      <span>Efficiency</span>
                    </div>
                    <span className="font-medium">{vehicle.fuelEfficiency} km/l</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Driver Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {vehicle.currentDriver ? (
                    <>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-medium">{vehicle.currentDriver}</span>
                      </div>
                      {vehicle.currentDriverPhone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{vehicle.currentDriverPhone}</span>
                        </div>
                      )}
                      {onAssignDriver && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => onAssignDriver(vehicle)}
                        >
                          Change Driver
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">No driver assigned</p>
                      {onAssignDriver && (
                        <Button 
                          size="sm" 
                          onClick={() => onAssignDriver(vehicle)}
                        >
                          Assign Driver
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={vehicle.status === 'available' ? 'default' : 'outline'}
                  onClick={() => onUpdateStatus(vehicle.id, 'available')}
                >
                  Mark Available
                </Button>
                <Button
                  size="sm"
                  variant={vehicle.status === 'maintenance' ? 'default' : 'outline'}
                  onClick={() => onUpdateStatus(vehicle.id, 'maintenance')}
                >
                  Send to Maintenance
                </Button>
                <Button
                  size="sm"
                  variant={vehicle.status === 'inactive' ? 'default' : 'outline'}
                  onClick={() => onUpdateStatus(vehicle.id, 'inactive')}
                >
                  Mark Inactive
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(vehicle)}
                >
                  Edit Details
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Insurance Certificate</p>
                        <p className="text-sm text-muted-foreground">
                          Expires: {format(new Date(vehicle.insuranceExpiry), 'PPP')}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 ${insuranceStatus.color}`}>
                      {insuranceStatus.status === 'valid' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium capitalize">{insuranceStatus.status}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Fitness Certificate</p>
                        <p className="text-sm text-muted-foreground">
                          Expires: {format(new Date(vehicle.fitnessExpiry), 'PPP')}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 ${fitnessStatus.color}`}>
                      {fitnessStatus.status === 'valid' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium capitalize">{fitnessStatus.status}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">National Permit</p>
                        <p className="text-sm text-muted-foreground">
                          Expires: {format(new Date(vehicle.permitExpiry), 'PPP')}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 ${permitStatus.color}`}>
                      {permitStatus.status === 'valid' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium capitalize">{permitStatus.status}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last Maintenance</p>
                <p className="font-medium">
                  {vehicle.lastMaintenance 
                    ? format(new Date(vehicle.lastMaintenance), 'PPP')
                    : 'No records'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Due</p>
                <p className="font-medium">
                  {vehicle.nextMaintenance 
                    ? format(new Date(vehicle.nextMaintenance), 'PPP')
                    : 'Not scheduled'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Maintenance History</h4>
              {maintenanceRecords.length > 0 ? (
                maintenanceRecords.map((record) => (
                  <Card key={record.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Wrench className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium capitalize">{record.type}</p>
                            <p className="text-sm text-muted-foreground">
                              {record.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(record.performedAt), 'PPP')} • {record.performedBy}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">₹{record.cost.toLocaleString()}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No maintenance records found</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
