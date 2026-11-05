import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExitVerification } from "@/types/exitVerification";
import { 
  Truck, 
  Weight, 
  Clock, 
  User, 
  Camera, 
  AlertTriangle, 
  CheckCircle2,
  Printer,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface VerificationDetailsDialogProps {
  verification: ExitVerification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VerificationDetailsDialog = ({ verification, open, onOpenChange }: VerificationDetailsDialogProps) => {
  const { toast } = useToast();

  if (!verification) return null;

  const formatWeight = (weight: number) => (weight / 1000).toFixed(2);
  const netLoad = (verification.loadingWeight || 0) - (verification.entryWeight || 0);

  const handlePrint = () => {
    window.print();
    toast({
      title: "Print Initiated",
      description: "Exit verification slip sent to printer",
    });
  };

  const handleExport = () => {
    const slipData = {
      verificationId: verification.verificationId,
      vehicleRegNo: verification.vehicleRegNo,
      exitTimestamp: verification.exitTimestamp,
      weights: {
        entry: verification.entryWeight,
        loading: verification.loadingWeight,
        exit: verification.exitWeight,
        netLoad,
        difference: verification.weightDifference,
      },
      status: verification.status,
      operator: {
        id: verification.operatorId,
        name: verification.operatorName,
      },
      remarks: verification.remarks,
      anomalyReason: verification.anomalyReason,
      plateImages: verification.plateImages.length,
    };

    const blob = new Blob([JSON.stringify(slipData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exit-verification-${verification.verificationId}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Verification data exported successfully",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              Exit Verification Details
              <Badge 
                variant={
                  verification.status === 'verified' ? 'default' : 
                  verification.status === 'anomaly' ? 'destructive' : 'secondary'
                }
                className="gap-1"
              >
                {verification.status === 'verified' ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : verification.status === 'anomaly' ? (
                  <AlertTriangle className="h-3 w-3" />
                ) : null}
                {verification.status}
              </Badge>
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Verification ID</div>
              <div className="font-mono font-bold">{verification.verificationId}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Truck className="h-3 w-3" />
                Vehicle
              </div>
              <div className="font-bold text-lg">{verification.vehicleRegNo}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Exit Time
              </div>
              <div className="font-medium">
                {format(new Date(verification.exitTimestamp), "dd MMM yyyy, HH:mm:ss")}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Operator
              </div>
              <div className="font-medium">{verification.operatorName}</div>
            </div>
          </div>

          {/* Weight Details */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Weight className="h-4 w-4 text-primary" />
              Weight Details
            </h4>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Entry (Tare)</div>
                <div className="font-bold text-primary">
                  {formatWeight(verification.entryWeight || 0)} t
                </div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Loading</div>
                <div className="font-bold text-primary">
                  {formatWeight(verification.loadingWeight || 0)} t
                </div>
              </div>
              <div className="text-center p-3 bg-primary/10 rounded-lg border-2 border-primary">
                <div className="text-xs text-muted-foreground mb-1">Exit</div>
                <div className="font-bold text-primary text-lg">
                  {formatWeight(verification.exitWeight)} t
                </div>
              </div>
              <div className="text-center p-3 bg-success/10 rounded-lg border border-success">
                <div className="text-xs text-muted-foreground mb-1">Net Load</div>
                <div className="font-bold text-success">
                  {formatWeight(netLoad)} t
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Weight Difference (Exit - Entry)</span>
              <span className="font-bold">
                {formatWeight(verification.weightDifference)} tons
              </span>
            </div>
          </div>

          {/* Plate Images */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              Plate Images ({verification.plateImages.length} captured)
            </h4>
            {verification.plateImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {verification.plateImages.map((image) => (
                  <div key={image.id} className="space-y-1">
                    <div className="aspect-video rounded-lg overflow-hidden border">
                      <img
                        src={image.url}
                        alt={`${image.angle} plate`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground text-center capitalize">
                      {image.angle} Plate - {format(new Date(image.timestamp), "HH:mm:ss")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">
                No plate images captured
              </div>
            )}
          </div>

          {/* Anomaly Info */}
          {verification.anomalyReason && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <div className="font-semibold text-destructive">Anomaly Detected</div>
                  <div className="text-sm text-muted-foreground">
                    {verification.anomalyReason}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Remarks */}
          {verification.remarks && (
            <div className="space-y-2">
              <h4 className="font-semibold">Remarks</h4>
              <div className="p-3 bg-muted/30 rounded-lg text-sm">
                {verification.remarks}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handlePrint} variant="outline" className="flex-1 gap-2">
              <Printer className="h-4 w-4" />
              Print Slip
            </Button>
            <Button onClick={handleExport} variant="outline" className="flex-1 gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationDetailsDialog;
