import { AlertTriangle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AnomalyEscalationBannerProps {
  incidentId?: string;
  vehicleRegNo: string;
  weightDifference: number;
}

const AnomalyEscalationBanner = ({ 
  incidentId, 
  vehicleRegNo, 
  weightDifference 
}: AnomalyEscalationBannerProps) => {
  const navigate = useNavigate();

  return (
    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="flex items-center gap-2">
        Weight Anomaly Escalated
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          Vehicle <strong>{vehicleRegNo}</strong> has a weight discrepancy of{" "}
          <strong>{(weightDifference / 1000).toFixed(2)} tons</strong> that exceeds the 5% tolerance.
          {incidentId && (
            <> An incident <strong>{incidentId}</strong> has been automatically created for investigation.</>
          )}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/incidents')}
            className="border-destructive/30 hover:bg-destructive/20"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View in Incident Management
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default AnomalyEscalationBanner;
