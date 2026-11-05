import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CustomerDelivery } from "@/types/customer";
import { Package, MapPin, Calendar, Truck, Phone, Weight, Clock } from "lucide-react";
import { format } from "date-fns";

interface DeliveryDetailsDialogProps {
  delivery: CustomerDelivery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeliveryDetailsDialog = ({ delivery, open, onOpenChange }: DeliveryDetailsDialogProps) => {
  if (!delivery) return null;

  const getStatusColor = (status: CustomerDelivery['status']) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'in_transit':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      case 'dispatched':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {delivery.orderNumber}
            </DialogTitle>
            <Badge className={getStatusColor(delivery.status)}>
              {delivery.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Material Details
            </h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Material:</span>
                <span className="font-medium">{delivery.material}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity:</span>
                <span className="font-medium">{delivery.quantity} {delivery.unit}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Route Information
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Origin</p>
                <p className="font-medium">{delivery.origin}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Destination</p>
                <p className="font-medium">{delivery.destination}</p>
              </div>
              {delivery.currentLocation && (
                <div>
                  <p className="text-muted-foreground mb-1">Current Location</p>
                  <p className="text-xs">
                    Lat: {delivery.currentLocation.latitude.toFixed(4)}, 
                    Lng: {delivery.currentLocation.longitude.toFixed(4)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {format(new Date(delivery.currentLocation.lastUpdate), 'HH:mm:ss')}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Date:</span>
                <span className="font-medium">{format(new Date(delivery.orderDate), 'MMM dd, yyyy HH:mm')}</span>
              </div>
              {delivery.dispatchDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dispatch Date:</span>
                  <span className="font-medium">{format(new Date(delivery.dispatchDate), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {delivery.actualDelivery ? 'Delivered:' : 'Estimated Delivery:'}
                </span>
                <span className="font-medium">
                  {format(new Date(delivery.actualDelivery || delivery.estimatedDelivery), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>
            </div>
          </div>

          {delivery.vehicleRegNo && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Vehicle & Driver
                </h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle:</span>
                    <span className="font-medium">{delivery.vehicleRegNo}</span>
                  </div>
                  {delivery.driverName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Driver:</span>
                      <span className="font-medium">{delivery.driverName}</span>
                    </div>
                  )}
                  {delivery.driverPhone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contact:</span>
                      <span className="font-medium">{delivery.driverPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryDetailsDialog;
