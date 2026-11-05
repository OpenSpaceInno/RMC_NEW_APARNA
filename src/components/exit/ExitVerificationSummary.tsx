import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExitVerification, WeightComparison } from "@/types/exitVerification";
import { Truck, Weight, Package, Clock, User } from "lucide-react";
import { format } from "date-fns";

interface ExitVerificationSummaryProps {
  verification: ExitVerification;
  comparison?: WeightComparison | null;
}

const ExitVerificationSummary = ({ verification, comparison }: ExitVerificationSummaryProps) => {
  const formatWeight = (weight: number) => (weight / 1000).toFixed(2);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Verification Summary
          </CardTitle>
          <Badge variant="outline">{verification.verificationId}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
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
              {format(new Date(verification.exitTimestamp), "HH:mm:ss")}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              Operator
            </div>
            <div className="font-medium">{verification.operatorName}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Package className="h-3 w-3" />
              Status
            </div>
            <Badge 
              variant={
                verification.status === 'verified' ? 'default' : 
                verification.status === 'anomaly' ? 'destructive' : 'secondary'
              }
            >
              {verification.status}
            </Badge>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="text-sm font-medium mb-3 flex items-center gap-2">
            <Weight className="h-4 w-4 text-primary" />
            Weight Journey
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Entry (Tare)</div>
              <div className="font-bold text-primary">
                {formatWeight(verification.entryWeight || 0)} t
              </div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Loading (Gross)</div>
              <div className="font-bold text-primary">
                {formatWeight(verification.loadingWeight || 0)} t
              </div>
            </div>
            <div className="text-center p-3 bg-primary/10 rounded-lg border-2 border-primary">
              <div className="text-xs text-muted-foreground mb-1">Exit Weight</div>
              <div className="font-bold text-primary text-lg">
                {formatWeight(verification.exitWeight)} t
              </div>
            </div>
          </div>
        </div>

        {comparison && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Net Load</span>
              <span className="font-bold">
                {formatWeight((verification.loadingWeight || 0) - (verification.entryWeight || 0))} tons
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground">Exit vs Loading Δ</span>
              <span className={`font-bold ${comparison.withinTolerance ? 'text-success' : 'text-destructive'}`}>
                {formatWeight(comparison.actualDifference)} tons
              </span>
            </div>
          </div>
        )}

        {verification.remarks && (
          <div className="border-t pt-4">
            <div className="text-xs text-muted-foreground mb-1">Remarks</div>
            <div className="text-sm">{verification.remarks}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExitVerificationSummary;
