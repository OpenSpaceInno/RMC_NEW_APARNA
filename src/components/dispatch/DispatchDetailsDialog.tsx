import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PendingDispatch } from "@/types/dispatch";
import { CheckCircle, FileText, MapPin, Phone, User, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface DispatchDetailsDialogProps {
  dispatch: PendingDispatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignRoute: () => void;
}

const DispatchDetailsDialog = ({
  dispatch,
  open,
  onOpenChange,
  onAssignRoute,
}: DispatchDetailsDialogProps) => {
  if (!dispatch) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{dispatch.vehicleRegNo}</DialogTitle>
          <DialogDescription>Dispatch ID: {dispatch.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Material</div>
              <div className="font-semibold">{dispatch.material}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Quantity</div>
              <div className="font-semibold">
                {dispatch.quantity.toLocaleString()} {dispatch.unit}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Customer</div>
              <div className="font-semibold">{dispatch.customer}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Timestamp</div>
              <div className="font-semibold">
                {new Date(dispatch.timestamp).toLocaleString()}
              </div>
            </div>
          </div>

          <Separator />

          {/* Plate Images */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              License Plate Images
              {dispatch.plateImages.length === 2 && (
                <CheckCircle className="h-4 w-4 text-success" />
              )}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {dispatch.plateImages.map((img) => (
                <div key={img.id} className="space-y-2">
                  <div className="text-sm text-muted-foreground capitalize">{img.angle} View</div>
                  <img
                    src={img.url}
                    alt={img.angle}
                    className="w-full aspect-video object-cover rounded-lg border"
                  />
                  <div className="text-xs text-muted-foreground">
                    {new Date(img.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Documentation */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentation
            </h3>
            <div className="space-y-2">
              {dispatch.documentation.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="font-medium capitalize">
                      {doc.type.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(doc.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant={doc.verified ? "default" : "outline"}>
                    {doc.verified ? "Verified" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Route Assignment */}
          {dispatch.route ? (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Assigned Route
                </h3>
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Destination</div>
                      <div className="font-semibold">{dispatch.route.destination}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Distance</div>
                      <div className="font-semibold">{dispatch.route.distance} km</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Driver
                      </div>
                      <div className="font-semibold">{dispatch.route.driver}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Est. Time
                      </div>
                      <div className="font-semibold">{dispatch.route.estimatedTime} min</div>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Contact
                      </div>
                      <div className="font-semibold">{dispatch.route.driverPhone}</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <Button onClick={onAssignRoute} className="w-full" size="lg">
              <MapPin className="h-4 w-4 mr-2" />
              Assign Route
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DispatchDetailsDialog;
