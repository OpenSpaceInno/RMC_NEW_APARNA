import { useState } from "react";
import { Package, Play, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import BayStatusCard from "@/components/loading/BayStatusCard";
import MaterialDispenser from "@/components/loading/MaterialDispenser";
import LoadingProgress from "@/components/loading/LoadingProgress";
import QualityChecklist from "@/components/loading/QualityChecklist";
import { useLoadingBays } from "@/hooks/useLoadingBays";
import { toast } from "sonner";

const LoadingConsole = () => {
  const {
    bays,
    startLoading,
    dispenseMaterial,
    completeQualityCheck,
    moveToQualityCheck,
    cancelSession,
  } = useLoadingBays();

  const [selectedBayId, setSelectedBayId] = useState<string | null>(null);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [vehicleRegNo, setVehicleRegNo] = useState("");
  const [mixDesignId, setMixDesignId] = useState("");

  const selectedBay = bays.find((b) => b.id === selectedBayId);

  const handleStartLoading = () => {
    if (!selectedBayId || !vehicleRegNo || !mixDesignId) return;
    
    startLoading(selectedBayId, vehicleRegNo, mixDesignId);
    setShowStartDialog(false);
    setVehicleRegNo("");
    setMixDesignId("");
    toast.success("Loading session started", {
      description: `Bay: ${selectedBay?.name}, Vehicle: ${vehicleRegNo}`,
    });
  };

  const handleDispense = (materialType: string, quantity: number) => {
    if (!selectedBayId) return;
    dispenseMaterial(selectedBayId, materialType, quantity);
  };

  const handleQualityCheck = (checkId: string, actualValue: string, passed: boolean) => {
    if (!selectedBayId) return;
    completeQualityCheck(selectedBayId, checkId, actualValue, passed);
    toast[passed ? 'success' : 'error'](
      passed ? "Quality check passed" : "Quality check failed",
      { description: actualValue }
    );
  };

  const handleMoveToQuality = () => {
    if (!selectedBayId) return;
    moveToQualityCheck(selectedBayId);
    toast.info("Moved to quality check phase");
  };

  const handleCancel = () => {
    if (!selectedBayId) return;
    cancelSession(selectedBayId);
    setSelectedBayId(null);
    toast.info("Loading session cancelled");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Package className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Loading Console</h1>
          <p className="text-muted-foreground">
            Bay monitoring, material dispensing, progress tracking
          </p>
        </div>
      </div>

      {/* Bay Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {bays.map((bay) => (
          <BayStatusCard
            key={bay.id}
            bay={bay}
            onClick={() => {
              if (bay.status === 'available') {
                setSelectedBayId(bay.id);
                setShowStartDialog(true);
              } else {
                setSelectedBayId(bay.id);
              }
            }}
          />
        ))}
      </div>

      {/* Active Session Details */}
      {selectedBay?.currentSession && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Progress and Material Dispensing */}
          <div className="lg:col-span-2 space-y-6">
            <LoadingProgress session={selectedBay.currentSession} />
            
            {selectedBay.status === 'loading' && (
              <>
                <MaterialDispenser
                  materials={selectedBay.currentSession.materials}
                  onDispense={handleDispense}
                />
                
                {selectedBay.currentSession.overallProgress >= 99 && (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleMoveToQuality}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Move to Quality Check
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Right Column - Quality Checks */}
          <div className="space-y-6">
            <QualityChecklist
              checks={selectedBay.currentSession.qualityChecks}
              onComplete={handleQualityCheck}
              disabled={selectedBay.status !== 'quality_check'}
            />
            
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleCancel}
            >
              <XCircle className="h-5 w-5 mr-2" />
              Cancel Session
            </Button>
          </div>
        </div>
      )}

      {/* Start Loading Dialog */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Loading Session</DialogTitle>
            <DialogDescription>
              Enter vehicle and mix design details to begin loading
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleRegNo">Vehicle Registration Number</Label>
              <Input
                id="vehicleRegNo"
                placeholder="e.g., MH-01-AB-1234"
                value={vehicleRegNo}
                onChange={(e) => setVehicleRegNo(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mixDesignId">Mix Design ID</Label>
              <Input
                id="mixDesignId"
                placeholder="e.g., M25-STD-001"
                value={mixDesignId}
                onChange={(e) => setMixDesignId(e.target.value.toUpperCase())}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStartLoading}
              disabled={!vehicleRegNo || !mixDesignId}
            >
              Start Loading
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoadingConsole;
