import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingSession } from "@/types/loading";
import { Clock, Truck, Package } from "lucide-react";

interface LoadingProgressProps {
  session: LoadingSession;
}

const LoadingProgress = ({ session }: LoadingProgressProps) => {
  const elapsedTime = session.startTime 
    ? Math.floor((new Date().getTime() - new Date(session.startTime).getTime()) / 1000 / 60)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loading Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-bold text-2xl text-primary">
              {Math.round(session.overallProgress)}%
            </span>
          </div>
          <Progress value={session.overallProgress} className="h-4" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Truck className="h-4 w-4" />
              <span>Vehicle</span>
            </div>
            <div className="font-medium text-sm">{session.vehicleRegNo}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Package className="h-4 w-4" />
              <span>Mix Design</span>
            </div>
            <div className="font-medium text-sm">{session.mixDesignId}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Clock className="h-4 w-4" />
              <span>Elapsed Time</span>
            </div>
            <div className="font-medium text-sm">{elapsedTime} min</div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="text-sm font-medium mb-2">Material Status</div>
          <div className="space-y-1">
            {session.materials.map((material) => {
              const percentage = (material.dispensedQuantity / material.targetQuantity) * 100;
              return (
                <div key={material.type} className="flex items-center justify-between text-xs">
                  <span className="capitalize text-muted-foreground">{material.type}</span>
                  <span className={percentage >= 100 ? "text-success font-medium" : "text-muted-foreground"}>
                    {Math.round(percentage)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadingProgress;
