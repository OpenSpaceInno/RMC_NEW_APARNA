import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CustomerDelivery } from "@/types/customer";
import { Package, MapPin, Calendar, Truck, FileText, Download } from "lucide-react";
import { format } from "date-fns";

interface DeliveryCardProps {
  delivery: CustomerDelivery;
  onViewDetails: (delivery: CustomerDelivery) => void;
  onViewPOD: (deliveryId: string) => void;
  onViewInvoice: (deliveryId: string) => void;
}

const DeliveryCard = ({ delivery, onViewDetails, onViewPOD, onViewInvoice }: DeliveryCardProps) => {
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

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewDetails(delivery)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">{delivery.orderNumber}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{delivery.material}</p>
            </div>
            <Badge className={getStatusColor(delivery.status)}>
              {formatStatus(delivery.status)}
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-muted-foreground">From: {delivery.origin}</p>
                <p className="font-medium">To: {delivery.destination}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {delivery.actualDelivery 
                  ? `Delivered: ${format(new Date(delivery.actualDelivery), 'MMM dd, yyyy HH:mm')}`
                  : `ETA: ${format(new Date(delivery.estimatedDelivery), 'MMM dd, yyyy HH:mm')}`
                }
              </span>
            </div>

            {delivery.vehicleRegNo && (
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {delivery.vehicleRegNo} • {delivery.driverName}
                </span>
              </div>
            )}
          </div>

          {delivery.status === 'in_transit' && typeof delivery.progress === 'number' && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{delivery.progress}%</span>
              </div>
              <Progress value={delivery.progress} className="h-2" />
            </div>
          )}

          <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
            {delivery.podAvailable && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onViewPOD(delivery.id)}
              >
                <FileText className="h-4 w-4 mr-2" />
                View POD
              </Button>
            )}
            {delivery.invoiceAvailable && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onViewInvoice(delivery.id)}
              >
                <Download className="h-4 w-4 mr-2" />
                Invoice
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryCard;
