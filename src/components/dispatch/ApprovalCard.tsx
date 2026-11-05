import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PendingDispatch } from "@/types/dispatch";
import { CheckCircle, XCircle, Truck, Package, User, Clock, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ApprovalCardProps {
  dispatch: PendingDispatch;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onViewDetails: (dispatch: PendingDispatch) => void;
}

const ApprovalCard = ({ dispatch, onApprove, onReject, onViewDetails }: ApprovalCardProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const allDocsVerified = dispatch.documentation.every(doc => doc.verified);
  const hasPlateImages = dispatch.plateImages.length === 2;

  const getStatusColor = (status: PendingDispatch['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'approved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'dispatched': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                {dispatch.vehicleRegNo}
              </CardTitle>
              <CardDescription>ID: {dispatch.id}</CardDescription>
            </div>
            <Badge className={`${getStatusColor(dispatch.status)} capitalize`}>
              {dispatch.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>Material</span>
              </div>
              <div className="font-semibold">{dispatch.material}</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Customer</span>
              </div>
              <div className="font-semibold">{dispatch.customer}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Quantity</span>
              </div>
              <div className="font-semibold">
                {dispatch.quantity.toLocaleString()} {dispatch.unit}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span>Plate Images</span>
              </div>
              <div className="flex gap-1">
                {dispatch.plateImages.map((img) => (
                  <img
                    key={img.id}
                    src={img.url}
                    alt={img.angle}
                    className="h-8 w-12 object-cover rounded border cursor-pointer hover:opacity-80"
                    onClick={() => setSelectedImage(img.url)}
                  />
                ))}
                {!hasPlateImages && (
                  <span className="text-xs text-destructive">Incomplete</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Documentation Status</div>
            <div className="flex flex-wrap gap-2">
              {dispatch.documentation.map((doc) => (
                <Badge 
                  key={doc.id}
                  variant={doc.verified ? "default" : "outline"}
                  className="text-xs"
                >
                  {doc.type.replace('_', ' ')}
                  {doc.verified && <CheckCircle className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
            </div>
          </div>

          {dispatch.route && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-1 text-sm">
              <div className="font-medium">Assigned Route</div>
              <div className="text-muted-foreground">
                {dispatch.route.destination} • {dispatch.route.distance}km • {dispatch.route.driver}
              </div>
            </div>
          )}

          {dispatch.status === 'pending' && (
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => onViewDetails(dispatch)} 
                variant="outline"
                className="flex-1"
              >
                View Details
              </Button>
              <Button 
                onClick={() => onApprove(dispatch.id)}
                disabled={!allDocsVerified || !hasPlateImages}
                className="flex-1 gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </Button>
              <Button 
                onClick={() => onReject(dispatch.id, "Manual rejection")}
                variant="destructive"
                size="icon"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>License Plate Image</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img src={selectedImage} alt="Plate" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ApprovalCard;
