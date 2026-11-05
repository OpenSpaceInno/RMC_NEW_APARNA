import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Printer, FileText } from "lucide-react";
import { WeighSlip as WeighSlipType } from "@/types/weighbridge";
import { useToast } from "@/hooks/use-toast";

interface WeighSlipProps {
  slip: WeighSlipType;
}

const WeighSlip = ({ slip }: WeighSlipProps) => {
  const { toast } = useToast();

  const handlePrint = () => {
    window.print();
    toast({
      title: "Printing",
      description: "Weigh slip sent to printer",
    });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(slip, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `weigh-slip-${slip.slipNumber}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Exported",
      description: "Weigh slip exported successfully",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Digital Weigh Slip
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 print:text-black print:bg-white">
        <div className="text-center border-b pb-4">
          <h2 className="text-2xl font-bold">RMC Plant - Weighbridge</h2>
          <p className="text-sm text-muted-foreground print:text-gray-600">Digital Weigh Slip</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground print:text-gray-600">Slip Number</div>
            <div className="font-semibold">{slip.slipNumber}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground print:text-gray-600">Date & Time</div>
            <div className="font-semibold">{new Date(slip.dateTime).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground print:text-gray-600">Vehicle Registration</div>
            <div className="font-semibold text-lg">{slip.vehicleRegNo}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground print:text-gray-600">Driver Name</div>
            <div className="font-semibold">{slip.driverName}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground print:text-gray-600">Material</div>
            <div className="font-semibold">{slip.material}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground print:text-gray-600">Destination</div>
            <div className="font-semibold">{slip.destination}</div>
          </div>
        </div>

        <Separator />

        <div className="bg-muted/50 print:bg-gray-100 p-4 rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground print:text-gray-600">Gross Weight</span>
            <span className="text-xl font-bold">{(slip.grossWeight / 1000).toFixed(2)} tons</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground print:text-gray-600">Tare Weight</span>
            <span className="text-xl font-bold">{(slip.tareWeight / 1000).toFixed(2)} tons</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-semibold">Net Weight</span>
            <span className="text-3xl font-bold text-primary print:text-black">
              {(slip.netWeight / 1000).toFixed(2)} tons
            </span>
          </div>
        </div>

        <Separator />

        {slip.sapDocNumber && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between text-xs print:bg-yellow-50 print:border-yellow-300">
            <div>
              <div className="font-bold text-amber-500 flex items-center gap-1.5 print:text-yellow-800">
                <span className="font-serif italic font-extrabold text-sm">SAP</span>
                <span>Verified Material Document (MIGO)</span>
              </div>
              <div className="text-muted-foreground print:text-gray-700 mt-0.5">
                Doc Number: <strong className="font-mono text-foreground print:text-black">{slip.sapDocNumber}</strong>
                {slip.sapPoNumber && (
                  <span> • PO Reference: <strong className="font-mono text-foreground print:text-black">#{slip.sapPoNumber}</strong></span>
                )}
                {slip.vendorName && (
                  <span> • Vendor: <strong className="text-foreground print:text-black">{slip.vendorName}</strong></span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-500 print:text-green-800 font-bold border border-emerald-500/40">
                POSTED TO ERP
              </span>
              <div className="text-[10px] text-muted-foreground print:text-gray-600 mt-0.5">Plant PL01 • Shamshabad</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground print:text-gray-600">Operator</div>
            <div className="font-medium">{slip.operatorName}</div>
          </div>
          <div>
            <div className="text-muted-foreground print:text-gray-600">Session ID</div>
            <div className="font-medium">{slip.sessionId}</div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground print:text-gray-600 text-center pt-4 border-t">
          This is a computer-generated slip and does not require a signature. 
          Evidence images captured: {slip.evidence.length}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeighSlip;
