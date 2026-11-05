import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Material } from "@/types/loading";
import { PlayCircle, CheckCircle, AlertTriangle } from "lucide-react";

interface MaterialDispenserProps {
  materials: Material[];
  onDispense: (materialType: string, quantity: number) => void;
  disabled?: boolean;
}

const getMaterialColor = (type: Material['type']) => {
  switch (type) {
    case 'cement':
      return 'bg-gray-500';
    case 'sand':
      return 'bg-yellow-600';
    case 'aggregate':
      return 'bg-stone-600';
    case 'water':
      return 'bg-blue-500';
    case 'admixture':
      return 'bg-purple-500';
  }
};

const MaterialDispenser = ({ materials, onDispense, disabled }: MaterialDispenserProps) => {
  const getMaterialStatus = (material: Material) => {
    const percentage = (material.dispensedQuantity / material.targetQuantity) * 100;
    const diff = Math.abs(material.dispensedQuantity - material.targetQuantity);
    const withinTolerance = diff <= material.tolerance;

    if (percentage >= 100) {
      return withinTolerance ? 'complete' : 'over_tolerance';
    }
    return percentage > 0 ? 'dispensing' : 'pending';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Material Dispensing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {materials.map((material) => {
          const status = getMaterialStatus(material);
          const percentage = Math.min(100, (material.dispensedQuantity / material.targetQuantity) * 100);

          return (
            <div key={material.type} className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getMaterialColor(material.type)}`} />
                  <span className="font-medium capitalize">{material.type}</span>
                  {status === 'complete' && <CheckCircle className="h-4 w-4 text-success" />}
                  {status === 'over_tolerance' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                </div>
                <Badge variant={status === 'complete' ? 'default' : 'outline'}>
                  {material.dispensedQuantity} / {material.targetQuantity} {material.unit}
                </Badge>
              </div>

              <Progress value={percentage} className="h-2" />

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Tolerance: ±{material.tolerance} {material.unit}</span>
                <span>{Math.round(percentage)}%</span>
              </div>

              {status !== 'complete' && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => onDispense(material.type, material.targetQuantity * 0.1)}
                  className="w-full"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Dispense
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default MaterialDispenser;
