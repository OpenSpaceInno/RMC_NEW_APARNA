import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProofOfDelivery } from "@/types/customer";
import { Download, FileText, Image as ImageIcon, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface PODViewerProps {
  pod: ProofOfDelivery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PODViewer = ({ pod, open, onOpenChange }: PODViewerProps) => {
  if (!pod) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Proof of Delivery - {pod.orderNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Delivery Completed</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-500">
              {format(new Date(pod.deliveredAt), 'EEEE, MMMM dd, yyyy • HH:mm')}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Delivery Information</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Material:</span>
                <span className="font-medium">{pod.material}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity:</span>
                <span className="font-medium">{pod.quantity} {pod.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicle:</span>
                <span className="font-medium">{pod.vehicleRegNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Driver:</span>
                <span className="font-medium">{pod.driverName}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="font-semibold">Recipient Details</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Received By:</span>
                <span className="font-medium">{pod.recipientName}</span>
              </div>
            </div>
            
            {pod.recipientSignature && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Signature:</p>
                <div className="border rounded-lg p-4 bg-background">
                  <img 
                    src={pod.recipientSignature} 
                    alt="Recipient signature" 
                    className="h-20 mx-auto"
                  />
                </div>
              </div>
            )}
          </div>

          {pod.photos.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Delivery Photos ({pod.photos.length})
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {pod.photos.map((photo, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <img 
                        src={photo} 
                        alt={`Delivery photo ${index + 1}`}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {pod.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold">Delivery Notes</h3>
                <p className="text-sm text-muted-foreground">{pod.notes}</p>
              </div>
            </>
          )}

          {pod.weighSlipUrl && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Supporting Documents
                </h3>
                <Button variant="outline" className="w-full" asChild>
                  <a href={pod.weighSlipUrl} download>
                    <Download className="h-4 w-4 mr-2" />
                    Download Weigh Slip
                  </a>
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PODViewer;
