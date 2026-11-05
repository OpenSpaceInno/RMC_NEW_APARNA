import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QualityCheck } from "@/types/loading";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface QualityChecklistProps {
  checks: QualityCheck[];
  onComplete: (checkId: string, actualValue: string, passed: boolean) => void;
  disabled?: boolean;
}

const QualityChecklist = ({ checks, onComplete, disabled }: QualityChecklistProps) => {
  const [values, setValues] = useState<Record<string, string>>({});

  const getStatusIcon = (status: QualityCheck['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const pendingCount = checks.filter(c => c.status === 'pending').length;
  const passedCount = checks.filter(c => c.status === 'passed').length;
  const failedCount = checks.filter(c => c.status === 'failed').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Quality Checks</span>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-success border-success">
              ✓ {passedCount}
            </Badge>
            <Badge variant="outline" className="text-destructive border-destructive">
              ✗ {failedCount}
            </Badge>
            <Badge variant="outline">
              ⏳ {pendingCount}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {checks.map((check) => (
          <div key={check.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  {getStatusIcon(check.status)}
                  <span className="font-medium">{check.parameter}</span>
                  {check.mandatory && (
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Expected: {check.expectedValue}
                </div>
                {check.actualValue && (
                  <div className="text-sm">
                    Actual: <span className="font-medium">{check.actualValue}</span>
                  </div>
                )}
              </div>
            </div>

            {check.status === 'pending' && (
              <div className="space-y-2">
                <Input
                  placeholder="Enter actual value"
                  value={values[check.id] || ''}
                  onChange={(e) => setValues({ ...values, [check.id]: e.target.value })}
                  disabled={disabled}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    disabled={!values[check.id] || disabled}
                    onClick={() => {
                      onComplete(check.id, values[check.id], true);
                      setValues({ ...values, [check.id]: '' });
                    }}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Pass
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={!values[check.id] || disabled}
                    onClick={() => {
                      onComplete(check.id, values[check.id], false);
                      setValues({ ...values, [check.id]: '' });
                    }}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Fail
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default QualityChecklist;
