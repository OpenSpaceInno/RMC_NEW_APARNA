import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Driver } from '@/types/driver';
import { Vehicle } from '@/types/vehicle';
import { User, Truck, Search, Star, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { differenceInDays } from 'date-fns';

interface DriverVehicleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'assign-driver-to-vehicle' | 'assign-vehicle-to-driver';
  vehicle?: Vehicle | null;
  driver?: Driver | null;
  availableDrivers: Driver[];
  availableVehicles: Vehicle[];
  onAssign: (driverId: string, vehicleId: string) => void;
  onUnassign?: () => void;
}

export function DriverVehicleAssignmentDialog({
  open,
  onOpenChange,
  mode,
  vehicle,
  driver,
  availableDrivers,
  availableVehicles,
  onAssign,
  onUnassign,
}: DriverVehicleAssignmentDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSelectedId(null);
    }
  }, [open]);

  const filteredDrivers = availableDrivers.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVehicles = availableVehicles.filter(v =>
    v.registrationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLicenseStatus = (expiryDate: string) => {
    const daysUntil = differenceInDays(new Date(expiryDate), new Date());
    if (daysUntil < 0) return { status: 'expired', color: 'text-destructive', icon: XCircle };
    if (daysUntil <= 30) return { status: 'expiring', color: 'text-amber-500', icon: AlertTriangle };
    return { status: 'valid', color: 'text-emerald-500', icon: CheckCircle };
  };

  const handleAssign = () => {
    if (!selectedId) return;
    
    if (mode === 'assign-driver-to-vehicle' && vehicle) {
      onAssign(selectedId, vehicle.id);
    } else if (mode === 'assign-vehicle-to-driver' && driver) {
      onAssign(driver.id, selectedId);
    }
    onOpenChange(false);
  };

  const hasCurrentAssignment = mode === 'assign-driver-to-vehicle' 
    ? !!vehicle?.currentDriver 
    : !!driver?.assignedVehicle;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'assign-driver-to-vehicle' 
              ? `Assign Driver to ${vehicle?.registrationNo}`
              : `Assign Vehicle to ${driver?.name}`}
          </DialogTitle>
          <DialogDescription>
            {mode === 'assign-driver-to-vehicle'
              ? 'Select an available driver to assign to this vehicle'
              : 'Select an available vehicle to assign to this driver'}
          </DialogDescription>
        </DialogHeader>

        {hasCurrentAssignment && (
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {mode === 'assign-driver-to-vehicle' ? (
                  <>
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Currently assigned: <strong>{vehicle?.currentDriver}</strong></span>
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Currently assigned: <strong>{driver?.assignedVehicle}</strong></span>
                  </>
                )}
              </div>
              {onUnassign && (
                <Button variant="outline" size="sm" onClick={onUnassign}>
                  Unassign
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={mode === 'assign-driver-to-vehicle' ? 'Search drivers...' : 'Search vehicles...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {mode === 'assign-driver-to-vehicle' ? (
              filteredDrivers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No available drivers found
                </div>
              ) : (
                filteredDrivers.map((d) => {
                  const licenseStatus = getLicenseStatus(d.license.expiryDate);
                  const LicenseIcon = licenseStatus.icon;
                  
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedId(d.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedId === d.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{d.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{d.employeeId}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                {d.rating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <LicenseIcon className={`h-4 w-4 ${licenseStatus.color}`} />
                          <Badge variant="outline" className="text-xs">
                            {d.license.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              filteredVehicles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No available vehicles found
                </div>
              ) : (
                filteredVehicles.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => setSelectedId(v.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedId === v.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Truck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{v.registrationNo}</p>
                          <p className="text-sm text-muted-foreground">
                            {v.make} {v.model} ({v.year})
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs capitalize">
                          {v.type}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {v.capacity} {v.capacityUnit}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedId}>
            Assign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
