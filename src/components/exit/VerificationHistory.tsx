import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExitVerification } from "@/types/exitVerification";
import { CheckCircle2, AlertTriangle, Clock, Eye } from "lucide-react";
import { format } from "date-fns";

interface VerificationHistoryProps {
  verifications: ExitVerification[];
  onViewDetails?: (verification: ExitVerification) => void;
}

const VerificationHistory = ({ verifications, onViewDetails }: VerificationHistoryProps) => {
  const getStatusIcon = (status: ExitVerification['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'anomaly':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusVariant = (status: ExitVerification['status']) => {
    switch (status) {
      case 'verified':
        return 'default';
      case 'anomaly':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Verifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {verifications.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No verifications recorded yet
            </div>
          ) : (
            verifications.map((verification) => (
              <div
                key={verification.verificationId}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{verification.vehicleRegNo}</span>
                    <Badge variant={getStatusVariant(verification.status)} className="gap-1">
                      {getStatusIcon(verification.status)}
                      {verification.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(verification.exitTimestamp), "dd MMM yyyy, HH:mm:ss")}
                  </div>
                  {verification.anomalyReason && (
                    <div className="text-xs text-destructive">
                      {verification.anomalyReason}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right space-y-1">
                    <div className="font-bold text-primary">
                      {(verification.exitWeight / 1000).toFixed(2)} tons
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Δ {(verification.weightDifference / 1000).toFixed(2)} tons
                    </div>
                  </div>
                  {onViewDetails && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewDetails(verification)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VerificationHistory;
