import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Truck, User, MapPin, Package, Navigation, Settings, Loader2 } from "lucide-react";
import { TripFormData } from "@/types/tripManagement";
import { useVehicleManagement } from "@/hooks/useVehicleManagement";
import { useDriverManagement } from "@/hooks/useDriverManagement";

interface TripFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TripFormData) => void;
}

const defaultOrigin = {
  name: 'RMC Plant Thane',
  address: 'Industrial Area, Thane West, Maharashtra',
  latitude: 19.1000,
  longitude: 72.9000,
};

const materialOptions = [
  'M15 RMC', 'M20 RMC', 'M25 RMC', 'M30 RMC', 'M35 RMC', 'M40 RMC', 'M45 RMC', 'M50 RMC'
];

const TripFormDialog = ({ open, onOpenChange, onSubmit }: TripFormDialogProps) => {
  const { vehicles } = useVehicleManagement();
  const { drivers, getAvailableDrivers } = useDriverManagement();
  
  const availableVehicles = vehicles.filter(v => v.status === 'available');
  const availableDrivers = getAvailableDrivers();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<TripFormData>>({
    origin: defaultOrigin,
    unit: 'kg',
    priority: 'normal',
    enableGPS: true,
    scheduledStartTime: new Date().toISOString().slice(0, 16),
  });

  const handleSubmit = async () => {
    if (!formData.vehicleId || !formData.driverId || !formData.customerName || 
        !formData.material || !formData.quantity || !formData.destination?.name) {
      return;
    }

    setIsSubmitting(true);
    try {
      onSubmit({
        ...formData,
        vehicleRegNo: (selectedVehicle as any)?.registrationNumber || (selectedVehicle as any)?.vehicleNumber || 'MH12AB1234',
        driverName: selectedDriver?.name || 'Assigned Driver',
        driverPhone: selectedDriver?.phone || '+91 98765 43210',
      } as TripFormData);
      onOpenChange(false);
      setFormData({
        origin: defaultOrigin,
        unit: 'kg',
        priority: 'normal',
        enableGPS: true,
        scheduledStartTime: new Date().toISOString().slice(0, 16),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = <K extends keyof TripFormData>(field: K, value: TripFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
  const selectedDriver = drivers.find(d => d.id === formData.driverId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            Create New Trip
          </DialogTitle>
          <DialogDescription>
            Schedule a new delivery trip with GPS tracking
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <Tabs defaultValue="assignment" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="assignment">Assignment</TabsTrigger>
              <TabsTrigger value="cargo">Cargo</TabsTrigger>
              <TabsTrigger value="route">Route</TabsTrigger>
              <TabsTrigger value="gps">GPS Config</TabsTrigger>
            </TabsList>

            <TabsContent value="assignment" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Select Vehicle
                  </Label>
                  <Select
                    value={formData.vehicleId}
                    onValueChange={(value) => updateField('vehicleId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVehicles.map(vehicle => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.registrationNo} - {vehicle.make} {vehicle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedVehicle && (
                    <p className="text-xs text-muted-foreground">
                      Capacity: {selectedVehicle.capacity} kg | Type: {selectedVehicle.type}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Assign Driver
                  </Label>
                  <Select
                    value={formData.driverId}
                    onValueChange={(value) => updateField('driverId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDrivers.map(driver => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name} - {driver.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedDriver && (
                    <p className="text-xs text-muted-foreground">
                      License: {selectedDriver.license.number} | Rating: {selectedDriver.rating}⭐
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Customer Name *</Label>
                  <Input
                    value={formData.customerName || ''}
                    onChange={(e) => updateField('customerName', e.target.value)}
                    placeholder="Enter customer name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Customer Contact</Label>
                  <Input
                    value={formData.customerContact || ''}
                    onChange={(e) => updateField('customerContact', e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cargo" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Material Type *
                  </Label>
                  <Select
                    value={formData.material}
                    onValueChange={(value) => updateField('material', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materialOptions.map(material => (
                        <SelectItem key={material} value={material}>
                          {material}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      value={formData.quantity || ''}
                      onChange={(e) => updateField('quantity', parseFloat(e.target.value))}
                      placeholder="Enter quantity"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => updateField('unit', value as TripFormData['unit'])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                        <SelectItem value="tons">Tons</SelectItem>
                        <SelectItem value="cubic_meters">Cubic Meters (m³)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => updateField('priority', value as TripFormData['priority'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes || ''}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Add any special instructions or notes..."
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="route" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-500" />
                    Origin (Plant)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>Location Name</Label>
                    <Input
                      value={formData.origin?.name || ''}
                      onChange={(e) => updateField('origin', { ...formData.origin!, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={formData.origin?.address || ''}
                      onChange={(e) => updateField('origin', { ...formData.origin!, address: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Latitude</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={formData.origin?.latitude || ''}
                        onChange={(e) => updateField('origin', { ...formData.origin!, latitude: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Longitude</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={formData.origin?.longitude || ''}
                        onChange={(e) => updateField('origin', { ...formData.origin!, longitude: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-destructive" />
                    Destination *
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>Location Name *</Label>
                    <Input
                      value={formData.destination?.name || ''}
                      onChange={(e) => updateField('destination', { 
                        ...formData.destination!, 
                        name: e.target.value 
                      })}
                      placeholder="Site name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address *</Label>
                    <Input
                      value={formData.destination?.address || ''}
                      onChange={(e) => updateField('destination', { 
                        ...formData.destination!, 
                        address: e.target.value 
                      })}
                      placeholder="Full address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Latitude</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={formData.destination?.latitude || ''}
                        onChange={(e) => updateField('destination', { 
                          ...formData.destination!, 
                          latitude: parseFloat(e.target.value) 
                        })}
                        placeholder="19.0760"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Longitude</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={formData.destination?.longitude || ''}
                        onChange={(e) => updateField('destination', { 
                          ...formData.destination!, 
                          longitude: parseFloat(e.target.value) 
                        })}
                        placeholder="72.8777"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Scheduled Start Time *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduledStartTime || ''}
                    onChange={(e) => updateField('scheduledStartTime', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estimated Distance (km) *</Label>
                  <Input
                    type="number"
                    value={formData.estimatedDistance || ''}
                    onChange={(e) => updateField('estimatedDistance', parseFloat(e.target.value))}
                    placeholder="25"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="gps" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    GPS Tracking Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure real-time GPS tracking for this trip
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable GPS Tracking</Label>
                      <p className="text-sm text-muted-foreground">
                        Track vehicle location in real-time
                      </p>
                    </div>
                    <Switch
                      checked={formData.enableGPS}
                      onCheckedChange={(checked) => updateField('enableGPS', checked)}
                    />
                  </div>

                  {formData.enableGPS && (
                    <div className="space-y-2">
                      <Label>GPS Device ID</Label>
                      <Input
                        value={formData.gpsDeviceId || ''}
                        onChange={(e) => updateField('gpsDeviceId', e.target.value)}
                        placeholder="Enter GPS device ID (optional)"
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty to use vehicle's default GPS device
                      </p>
                    </div>
                  )}

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <h4 className="font-medium text-sm">GPS Integration Ready</h4>
                    <p className="text-xs text-muted-foreground">
                      This trip is configured to integrate with GPS tracking modules. 
                      When connected, you'll receive:
                    </p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                      <li>Real-time location updates</li>
                      <li>Speed and heading information</li>
                      <li>Geofence alerts</li>
                      <li>Route deviation notifications</li>
                      <li>ETA recalculations</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Trip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TripFormDialog;
