import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scale, TrendingUp, Activity, RotateCcw, Crosshair } from "lucide-react";
import { WeightReading } from "@/types/weighbridge";

interface WeightDisplayProps {
  reading: WeightReading;
  label?: string;
  indicatorModel?: string;
  port?: string;
  connected?: boolean;
  onZero?: () => void;
  onTare?: () => void;
  showControls?: boolean;
}

const WeightDisplay = ({ 
  reading, 
  label = "Current Weight",
  indicatorModel = "Toledo 8142 Indicator",
  port = "RS-232 (ws://localhost:3001/scale)",
  connected = true,
  onZero,
  onTare,
  showControls = true
}: WeightDisplayProps) => {
  const displayWeight = (reading.weight / 1000).toFixed(2); // Convert to tons
  
  return (
    <Card className="border-2 shadow-sm bg-gradient-to-b from-card to-card/90">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              {label}
            </CardTitle>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="font-mono">{indicatorModel}</span>
              <span>•</span>
              <span className="font-mono truncate max-w-[170px]">{port}</span>
            </div>
          </div>
          
          <Badge 
            variant={reading.stable ? "default" : "secondary"}
            className={`gap-1 px-2.5 py-1 ${reading.stable ? 'bg-emerald-600 hover:bg-emerald-600 text-white' : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'}`}
          >
            {reading.stable ? (
              <>
                <Activity className="h-3 w-3" />
                STABLE
              </>
            ) : (
              <>
                <TrendingUp className="h-3 w-3 animate-spin" />
                MOTION / SETTLING
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="text-center p-3 rounded-lg bg-background/80 border border-border/60">
            <div className="text-5xl font-black tracking-tight text-primary tabular-nums font-mono">
              {displayWeight}
            </div>
            <div className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mt-1">
              Metric Tons
            </div>
            <div className="text-xs text-muted-foreground/80 font-mono mt-1">
              {reading.weight.toLocaleString()} kg (Scale Readout)
            </div>
          </div>

          {showControls && (onZero || onTare) && (
            <div className="flex items-center justify-center gap-2 pt-1">
              {onZero && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onZero}
                  className="h-8 text-xs gap-1.5 border-dashed"
                >
                  <RotateCcw className="h-3 w-3" />
                  Zero (0.00t)
                </Button>
              )}
              {onTare && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onTare}
                  className="h-8 text-xs gap-1.5 border-dashed"
                >
                  <Crosshair className="h-3 w-3" />
                  Tare Scale
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeightDisplay;
