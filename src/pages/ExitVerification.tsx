import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LogOut, AlertCircle, Printer, Download, ArrowRightLeft } from "lucide-react";
import { useExitVerification } from "@/hooks/useExitVerification";
import WeightDisplay from "@/components/weighbridge/WeightDisplay";
import WeightComparison from "@/components/exit/WeightComparison";
import VerificationHistory from "@/components/exit/VerificationHistory";
import VerificationSteps from "@/components/exit/VerificationSteps";
import ExitVerificationSummary from "@/components/exit/ExitVerificationSummary";
import VehicleLookup from "@/components/exit/VehicleLookup";
import VerificationDetailsDialog from "@/components/exit/VerificationDetailsDialog";
import PlateImageCapture from "@/components/gate/PlateImageCapture";
import AnomalyEscalationBanner from "@/components/exit/AnomalyEscalationBanner";
import { SapGateToExitScreen } from "@/components/exit/SapGateToExitScreen";
import { SapOutboundGateOutScreen } from "@/components/exit/SapOutboundGateOutScreen";
import { SapOutboundDelivery } from "@/types/sap";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExitVerification as ExitVerificationType } from "@/types/exitVerification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ExitVerification = () => {
  const {
    currentWeight,
    activeVerification,
    lastEscalatedIncidentId,
    verifications,
    startVerification,
    startVerificationWithData,
    captureExitWeight,
    addPlateImages,
    compareWeights,
    completeVerification,
    cancelVerification,
    generateExitSlip,
  } = useExitVerification();

  // Screen View Mode: 'sap_main' (default landing view) | 'sap_gate_out' | 'standard_console'
  const [activeView, setActiveView] = useState<'sap_main' | 'sap_gate_out' | 'standard_console'>('sap_main');

  // SAP ERP Integration State
  const [syncType, setSyncType] = useState<'delivery_ref' | 'stock_transfer' | 'others'>('delivery_ref');
  const [selectedSapDelivery, setSelectedSapDelivery] = useState<SapOutboundDelivery | null>(null);
  const [activeGatePass, setActiveGatePass] = useState<string | null>(null);

  const [vehicleRegNo, setVehicleRegNo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [plateImagesCaptured, setPlateImagesCaptured] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<ExitVerificationType | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleEnterFromSapMain = (
    option: 'delivery_ref' | 'stock_transfer' | 'others',
    delivery?: SapOutboundDelivery
  ) => {
    setSyncType(option);
    if (delivery) {
      setSelectedSapDelivery(delivery);
      setVehicleRegNo(delivery.vehicleNo);
    }
    setActiveView('sap_gate_out');
  };

  const handleStartVerification = () => {
    if (!vehicleRegNo.trim()) {
      toast({
        title: "Error",
        description: "Please enter vehicle registration number",
        variant: "destructive",
      });
      return;
    }

    startVerification(vehicleRegNo);
    setRemarks("");
    setPlateImagesCaptured(false);
    toast({
      title: "Verification Started",
      description: `Exit verification started for ${vehicleRegNo}`,
    });
  };

  const handleSelectVehicleFromLookup = (vehicle: {
    regNo: string;
    entryWeight: number;
    loadingWeight: number;
  }) => {
    startVerificationWithData(vehicle.regNo, vehicle.entryWeight, vehicle.loadingWeight);
    setVehicleRegNo(vehicle.regNo);
    setRemarks("");
    setPlateImagesCaptured(false);
    toast({
      title: "Verification Started",
      description: `Exit verification started for ${vehicle.regNo} with pre-loaded weights`,
    });
  };

  const handleCaptureWeight = () => {
    if (!currentWeight.stable) {
      toast({
        title: "Weight Not Stable",
        description: "Please wait for weight to stabilize",
        variant: "destructive",
      });
      return;
    }

    const result = captureExitWeight();
    if (result) {
      toast({
        title: "Exit Weight Captured",
        description: `${(currentWeight.weight / 1000).toFixed(2)} tons recorded`,
      });
    }
  };

  const handleCompleteVerification = async () => {
    if (!plateImagesCaptured) {
      toast({
        title: "Missing Plate Images",
        description: "Please capture front and back plate images",
        variant: "destructive",
      });
      return;
    }

    const completed = await completeVerification(remarks);
    if (completed) {
      // Reset form
      setVehicleRegNo("");
      setRemarks("");
      setPlateImagesCaptured(false);
    }
  };

  const handleCancelVerification = () => {
    cancelVerification();
    setPlateImagesCaptured(false);
    setVehicleRegNo("");
    toast({
      title: "Verification Cancelled",
      description: "Exit verification has been cancelled",
    });
  };

  const handlePrintSlip = () => {
    if (!activeVerification) return;
    const slip = generateExitSlip();
    if (slip) {
      window.print();
      toast({
        title: "Print Initiated",
        description: "Exit verification slip sent to printer",
      });
    }
  };

  const handleExportSlip = () => {
    if (!activeVerification) return;
    const slip = generateExitSlip();
    if (slip) {
      const blob = new Blob([JSON.stringify(slip, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `exit-slip-${activeVerification.verificationId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Export Complete",
        description: "Exit verification data exported",
      });
    }
  };

  const handleViewDetails = (verification: ExitVerificationType) => {
    setSelectedVerification(verification);
    setDetailsDialogOpen(true);
  };

  const comparison = compareWeights();

  // Compute verification steps
  const verificationSteps = useMemo(() => {
    if (!activeVerification) return [];
    return [
      {
        id: "start",
        label: "Start",
        completed: true,
        active: false,
      },
      {
        id: "weight",
        label: "Capture Weight",
        completed: activeVerification.exitWeight > 0,
        active: !activeVerification.exitWeight,
      },
      {
        id: "plates",
        label: "Plate Images",
        completed: plateImagesCaptured,
        active: activeVerification.exitWeight > 0 && !plateImagesCaptured,
      },
      {
        id: "complete",
        label: "Complete",
        completed: false,
        active: activeVerification.exitWeight > 0 && plateImagesCaptured,
      },
    ];
  }, [activeVerification, plateImagesCaptured]);

  return (
    <div className="space-y-6">
      {/* 1. PRIMARY MAIN SCREEN: SAP ERP Gate-to-Exit Verification Integration */}
      {activeView === 'sap_main' && (
        <SapGateToExitScreen
          onEnter={handleEnterFromSapMain}
          onSwitchToStandardConsole={() => setActiveView('standard_console')}
          currentWeight={currentWeight}
          activeDeliveryNumber={selectedSapDelivery?.deliveryNumber}
          activeGatePass={activeGatePass}
        />
      )}

      {/* 2. OUTBOUND WEIGH BRIDGE INTEGRATION - GATE OUT SCREEN */}
      {activeView === 'sap_gate_out' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setActiveView('sap_main')}
              className="text-xs bg-[#e8cca8]/40 border-[#c8aa86] text-amber-950 font-bold hover:bg-[#e8cca8]/70 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>⮌ Back to SAP ERP Gate-to-Exit Integration</span>
            </Button>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono bg-amber-50 text-amber-800 border-amber-300">
                Mode: {syncType === 'delivery_ref' ? 'OBD Ref (Movement 601)' : syncType === 'stock_transfer' ? 'STO/Return (Movement 641)' : 'General Outbound (Movement 502)'}
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveView('standard_console')}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Standard Console
              </Button>
            </div>
          </div>

          <SapOutboundGateOutScreen
            isOpen={true}
            embedded={true}
            onClose={() => setActiveView('sap_main')}
            syncType={syncType}
            currentWeight={currentWeight}
            selectedDelivery={selectedSapDelivery}
            initialVehicleNo={vehicleRegNo}
            initialDriverName={selectedSapDelivery?.driverName}
            onPlateDetected={(plate) => {
              setVehicleRegNo(plate);
            }}
            onVerificationCompleted={(data) => {
              setActiveGatePass(data.gatePassNumber);
            }}
          />
        </div>
      )}

      {/* 3. STANDARD EXIT CONSOLE (FALLBACK / MANUAL CONSOLE) */}
      {activeView === 'standard_console' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <LogOut className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Standard Exit Console</h1>
                <p className="text-muted-foreground">Final ANPR + manual exit weighment comparison</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveView('sap_main')}
              className="bg-[#e8cca8]/40 border-[#c8aa86] text-amber-950 font-bold hover:bg-[#e8cca8]/70 flex items-center gap-1.5 shadow-xs"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>Switch to SAP ERP Gate-to-Exit Screen</span>
            </Button>
          </div>

          {lastEscalatedIncidentId && (
            <AnomalyEscalationBanner
              incidentId={lastEscalatedIncidentId}
              vehicleRegNo={verifications[0]?.vehicleRegNo || "MH12AB1234"}
              weightDifference={verifications[0]?.weightDifference || 1650}
            />
          )}

          {activeVerification && comparison && !comparison.withinTolerance && (
            <AnomalyEscalationBanner
              vehicleRegNo={activeVerification.vehicleRegNo}
              weightDifference={comparison.actualDifference}
            />
          )}

          {!activeVerification && (
            <Tabs defaultValue="lookup" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="lookup">Vehicle Lookup</TabsTrigger>
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              </TabsList>
              <TabsContent value="lookup" className="mt-4">
                <VehicleLookup onSelectVehicle={handleSelectVehicleFromLookup} />
              </TabsContent>
              <TabsContent value="manual" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Start Exit Verification</CardTitle>
                    <CardDescription>Enter vehicle details to begin exit verification manually</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="vehicleRegNo">Vehicle Registration *</Label>
                      <Input
                        id="vehicleRegNo"
                        placeholder="e.g., MH12AB1234"
                        value={vehicleRegNo}
                        onChange={(e) => setVehicleRegNo(e.target.value.toUpperCase())}
                      />
                    </div>
                    <Button onClick={handleStartVerification} className="w-full">
                      Start Verification
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {activeVerification && (
            <div className="space-y-6">
              <VerificationSteps steps={verificationSteps} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <WeightDisplay reading={currentWeight} label="Live Exit Scale" />

                  <Card>
                    <CardHeader>
                      <CardTitle>Weight Capture</CardTitle>
                      <CardDescription>
                        {activeVerification.exitWeight
                          ? "Exit weight has been recorded"
                          : "Position vehicle on weighbridge and capture exit weight"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {activeVerification.exitWeight ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium">Recorded Exit Weight:</span>
                            <span className="text-lg font-bold">
                              {(activeVerification.exitWeight / 1000).toFixed(2)} tons
                            </span>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={handleCaptureWeight}
                          className="w-full"
                          size="lg"
                          disabled={!currentWeight.stable}
                        >
                          Capture Exit Weight
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {comparison && <WeightComparison comparison={comparison} />}
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Plate Verification</CardTitle>
                      <CardDescription>Capture front and back plate images for verification</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <PlateImageCapture
                        onCapture={(capturedImgs) => {
                          addPlateImages(capturedImgs);
                          setPlateImagesCaptured(true);
                        }}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Verification Details</CardTitle>
                      <CardDescription>Review and complete exit verification</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="remarks">Remarks / Notes</Label>
                        <Textarea
                          id="remarks"
                          placeholder="Enter any observations or notes..."
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleCompleteVerification}
                          className="flex-1"
                          disabled={!activeVerification.exitWeight || !plateImagesCaptured}
                        >
                          Complete Verification
                        </Button>
                        <Button onClick={handleCancelVerification} variant="outline">
                          Cancel
                        </Button>
                      </div>

                      {activeVerification.status === "verified" && (
                        <div className="flex gap-2 pt-2 border-t">
                          <Button onClick={handlePrintSlip} variant="outline" className="flex-1">
                            <Printer className="h-4 w-4 mr-2" />
                            Print Slip
                          </Button>
                          <Button onClick={handleExportSlip} variant="outline" className="flex-1">
                            <Download className="h-4 w-4 mr-2" />
                            Export Data
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {verifications.length > 0 && !activeVerification && (
            <div className="space-y-6">
              <ExitVerificationSummary verification={verifications[0]} comparison={comparison} />
              <VerificationHistory
                verifications={verifications}
                onViewDetails={handleViewDetails}
              />
            </div>
          )}

          <VerificationDetailsDialog
            verification={selectedVerification}
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
          />
        </div>
      )}
    </div>
  );
};

export default ExitVerification;
