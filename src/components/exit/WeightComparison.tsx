import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, AlertTriangle, CheckCircle2 } from "lucide-react";
import { WeightComparison as WeightComparisonType } from "@/types/exitVerification";

interface WeightComparisonProps {
  comparison: WeightComparisonType;
}

const WeightComparison = ({ comparison }: WeightComparisonProps) => {
  const formatWeight = (weight: number) => (weight / 1000).toFixed(2);

  return (
    <Card className={comparison.withinTolerance ? "border-success" : "border-destructive"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Weight Comparison
          </CardTitle>
          <Badge 
            variant={comparison.withinTolerance ? "default" : "destructive"}
            className="gap-1"
          >
            {comparison.withinTolerance ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Within Tolerance
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3" />
                Anomaly Detected
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Entry Weight (Empty)</span>
            <span className="font-bold">{formatWeight(comparison.entryWeight || 0)} tons</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Loading Weight (Loaded)</span>
            <span className="font-bold">{formatWeight(comparison.loadingWeight || 0)} tons</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border-2 border-primary">
            <span className="font-semibold">Exit Weight (Current)</span>
            <span className="text-xl font-bold text-primary">
              {formatWeight(comparison.exitWeight)} tons
            </span>
          </div>

          <div className="pt-3 border-t space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Expected Difference</span>
              <span className="font-semibold">{formatWeight(comparison.expectedDifference)} tons</span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Actual Difference</span>
              <span className={`font-semibold ${comparison.withinTolerance ? 'text-success' : 'text-destructive'}`}>
                {formatWeight(comparison.actualDifference)} tons
              </span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Tolerance (±5%)</span>
              <span className="font-semibold">{formatWeight(comparison.tolerance)} tons</span>
            </div>
          </div>
        </div>

        {!comparison.withinTolerance && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-destructive">Weight Anomaly Detected</p>
              <p className="text-xs text-muted-foreground">
                Exit weight differs significantly from loading weight. Manual verification required.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeightComparison;
