import React from 'react';
import { 
  Printer, 
  Download, 
  X, 
  CheckCircle2, 
  Scale, 
  Truck, 
  Calendar, 
  Clock, 
  Building2, 
  FileText, 
  ShieldCheck,
  User,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export interface WeighbridgeSlipData {
  type: 'gate_in_token' | 'final_weigh_slip';
  ticketNumber: string;
  scenario: 'with_po' | 'without_po' | 'others';
  plant: string;
  vehicleNumber: string;
  transporter?: string;
  driverName?: string;
  poNumber?: string;
  itemNo?: string;
  vendorName?: string;
  vendorCode?: string;
  materialName?: string;
  materialCode?: string;
  customerName?: string;
  destinationSite?: string;
  challanNo?: string;
  challanWeight?: number;
  challanDate?: string;
  
  // Weights (KG)
  firstWeight: number;
  firstWeightType: 'GROSS' | 'TARE';
  secondWeight?: number;
  secondWeightType?: 'GROSS' | 'TARE';
  netWeight?: number;
  grossWeight?: number;
  tareWeight?: number;
  
  // Timestamps & Operators
  gateInTime?: string;
  gateOutTime?: string;
  gateInOperator?: string;
  gateOutOperator?: string;
  
  // SAP Output
  sapDocNumber?: string;
  slipNumber?: string;
  movementType?: string;
  notes?: string;
  evidenceImages?: string[];
}

interface SapWeighbridgeSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: WeighbridgeSlipData | null;
}

export function SapWeighbridgeSlipModal({ isOpen, onClose, data }: SapWeighbridgeSlipModalProps) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
    toast.success('Document sent to industrial slip printer');
  };

  const handleDownload = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.type === 'gate_in_token' ? 'GATE-PASS' : 'WEIGH-SLIP'}-${data.ticketNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Slip details exported successfully');
  };

  const isFinalSlip = data.type === 'final_weigh_slip';
  const grossKg = data.grossWeight ?? (data.firstWeightType === 'GROSS' ? data.firstWeight : (data.secondWeightType === 'GROSS' ? data.secondWeight : 0)) ?? 0;
  const tareKg = data.tareWeight ?? (data.firstWeightType === 'TARE' ? data.firstWeight : (data.secondWeightType === 'TARE' ? data.secondWeight : 0)) ?? 0;
  const netKg = data.netWeight ?? Math.max(0, grossKg - tareKg);
  const challanKg = data.challanWeight ? Number(data.challanWeight) : 0;
  const varianceKg = challanKg > 0 && netKg > 0 ? (netKg - challanKg) : 0;

  const scenarioLabel = 
    data.scenario === 'with_po' 
      ? 'With PO (Movement 101 - Standard Inbound)' 
      : data.scenario === 'without_po' 
        ? 'Without PO (Movement 501 - Spot Inbound)' 
        : 'Others (Movement 601 / Outward Dispatch)';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white overflow-y-auto">
      {/* Container - Printable Card */}
      <div 
        className="bg-white text-slate-900 border-2 border-slate-400 rounded-md shadow-2xl max-w-3xl w-full max-h-[96vh] flex flex-col overflow-hidden print:border-none print:shadow-none print:max-w-none print:w-full print:max-h-none"
        style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}
      >
        {/* Top Modal Action Bar (Hidden on print) */}
        <div className="bg-[#1e2a38] text-white px-4 py-2.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#dfcbaf] text-[#1e2a38] font-bold text-xs rounded">SAP</span>
            <span className="font-bold text-sm">
              {isFinalSlip ? 'Official Weighbridge Slip (SAP ERP Integrated)' : 'Gate-In Token Pass (Entry Authorization)'}
            </span>
            <Badge variant="outline" className="border-amber-400 text-amber-300 text-[10px] font-mono">
              {data.ticketNumber}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={handlePrint}
              className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1 shadow-xs cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Document (Ctrl+P)</span>
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleDownload}
              className="h-7 text-xs bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 gap-1 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export JSON</span>
            </Button>
            <button 
              type="button" 
              onClick={onClose}
              className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 overflow-y-auto print:overflow-visible space-y-4 text-xs">
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-950 font-serif">
                  APARNA ENTERPRISES LIMITED
                </span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded border border-slate-300">
                  RMC DIVISION
                </span>
              </div>
              <p className="text-slate-600 font-medium text-[11px] mt-0.5">
                Ready Mix Concrete Batching Plant • Plant Code: <strong className="text-slate-900">{data.plant || 'PL01'}</strong>
              </p>
              <p className="text-slate-500 text-[10px]">
                Plot 42, Hardware Park, Shamshabad Central, Hyderabad - 501218, Telangana
              </p>
            </div>

            <div className="text-right">
              <div className="inline-block border-2 border-slate-900 px-3 py-1 bg-amber-50 font-mono font-bold text-center">
                <div className="text-[10px] text-slate-600 uppercase tracking-wider">
                  {isFinalSlip ? 'Official Weighbridge Slip' : 'Gate Entry Pass'}
                </div>
                <div className="text-base text-slate-950 font-black">
                  {data.ticketNumber}
                </div>
              </div>
              {data.slipNumber && (
                <div className="text-[10px] font-mono text-slate-500 mt-1">
                  Slip Ref: {data.slipNumber}
                </div>
              )}
            </div>
          </div>

          {/* SAP Document & Movement Ribbon */}
          <div className="bg-[#f4efe6] border border-[#cfbeaa] p-2.5 rounded flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-[#1e2a38] text-white border-transparent text-[10px] font-mono">
                SAP S/4HANA CONNECTED
              </Badge>
              <span className="font-semibold text-slate-700">Movement Scenario:</span>
              <span className="font-bold text-slate-950">{scenarioLabel}</span>
            </div>
            {data.sapDocNumber && (
              <div className="flex items-center gap-1.5 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                <span className="font-semibold text-emerald-950">SAP Material Doc:</span>
                <span className="font-mono font-black text-emerald-900">#{data.sapDocNumber}</span>
              </div>
            )}
          </div>

          {/* Vehicle & Movement Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Vehicle Number</span>
              <span className="font-mono font-black text-sm text-slate-950">{data.vehicleNumber}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Transporter</span>
              <span className="font-semibold text-slate-900 truncate block">{data.transporter || 'Self / Own Fleet'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Driver Name</span>
              <span className="font-semibold text-slate-900 truncate block">{data.driverName || 'Verified on Arrival'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Weighbridge Bay</span>
              <span className="font-semibold text-slate-900">Bay 01 (60 MT Pitless)</span>
            </div>
          </div>

          {/* PO, Vendor, Material Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-slate-200 p-3 rounded bg-white">
            <div className="space-y-1.5">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Material Name:</span>
                <span className="font-bold text-slate-900">{data.materialName || 'Raw Material Inbound'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Material Code:</span>
                <span className="font-mono text-slate-800">{data.materialCode || 'N/A'}</span>
              </div>
              {data.scenario === 'with_po' && (
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">SAP PO Number:</span>
                  <span className="font-mono font-bold text-blue-900">{data.poNumber} (Item {data.itemNo || '10'})</span>
                </div>
              )}
              {data.customerName && (
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Customer / Client:</span>
                  <span className="font-semibold text-slate-900">{data.customerName}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Vendor / Supplier:</span>
                <span className="font-semibold text-slate-900">{data.vendorName || 'Spot / Non-PO Source'}</span>
              </div>
              {data.vendorCode && (
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Vendor Code:</span>
                  <span className="font-mono text-slate-800">{data.vendorCode}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Delivery Challan #:</span>
                <span className="font-mono text-slate-900 font-semibold">{data.challanNo || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Challan Date:</span>
                <span className="text-slate-900">{data.challanDate || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Primary Weight Breakdown Section */}
          <div className="border-2 border-slate-800 rounded overflow-hidden">
            <div className="bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-emerald-400" />
                OFFICIAL WEIGHMENT CERTIFICATION
              </span>
              <span className="font-mono text-[10px] text-slate-300">CALIBRATED CLASS III • STAMPED BY LEGAL METROLOGY</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 bg-slate-50">
              {/* Gross Weight */}
              <div className="p-3 text-center">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">1. Gross Weight (Loaded)</span>
                <span className="font-mono text-xl sm:text-2xl font-black text-slate-950 block my-1">
                  {grossKg.toLocaleString()} <span className="text-xs font-normal font-sans">KG</span>
                </span>
                <span className="text-xs font-mono font-semibold text-slate-600">
                  {(grossKg / 1000).toFixed(3)} Metric Tons
                </span>
              </div>

              {/* Tare Weight */}
              <div className="p-3 text-center">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">2. Tare Weight (Empty)</span>
                <span className="font-mono text-xl sm:text-2xl font-black text-slate-950 block my-1">
                  {tareKg > 0 ? tareKg.toLocaleString() : '---'} <span className="text-xs font-normal font-sans">{tareKg > 0 ? 'KG' : ''}</span>
                </span>
                <span className="text-xs font-mono font-semibold text-slate-600">
                  {tareKg > 0 ? `${(tareKg / 1000).toFixed(3)} Metric Tons` : 'Awaiting Gate Out'}
                </span>
              </div>

              {/* Net Weight */}
              <div className="p-3 text-center bg-[#e8f5e9]">
                <span className="text-[10px] font-bold text-[#1b5e20] uppercase block">3. Net Material Weight</span>
                <span className="font-mono text-xl sm:text-2xl font-black text-[#1b5e20] block my-1">
                  {isFinalSlip && netKg > 0 ? netKg.toLocaleString() : '---'} <span className="text-xs font-normal font-sans">{isFinalSlip && netKg > 0 ? 'KG' : ''}</span>
                </span>
                <span className="text-xs font-mono font-bold text-[#1b5e20]">
                  {isFinalSlip && netKg > 0 ? `${(netKg / 1000).toFixed(3)} Metric Tons` : 'Calculated at Gate Out'}
                </span>
              </div>
            </div>

            {/* Challan Comparison / Variance Bar (If Challan Weight exists & Final slip) */}
            {isFinalSlip && challanKg > 0 && (
              <div className="bg-slate-100 border-t border-slate-300 p-2.5 flex flex-wrap items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-slate-600">Supplier Challan Weight:</span>
                  <span className="font-mono font-bold text-slate-900">{challanKg.toLocaleString()} KG ({(challanKg / 1000).toFixed(2)} MT)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Variance (Net vs Challan):</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                    Math.abs(varianceKg) <= 100 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-400' 
                      : 'bg-amber-100 text-amber-900 border border-amber-400'
                  }`}>
                    {varianceKg >= 0 ? `+${varianceKg.toLocaleString()}` : varianceKg.toLocaleString()} KG 
                    ({((varianceKg / (challanKg || 1)) * 100).toFixed(2)}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Timestamps & Operators Audit Table */}
          <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded p-3 bg-slate-50 text-[11px]">
            <div>
              <span className="font-bold text-slate-800 uppercase block mb-1">Gate In Audit:</span>
              <div className="space-y-0.5 text-slate-600">
                <div>Date & Time: <strong className="text-slate-900">{data.gateInTime || new Date().toLocaleString()}</strong></div>
                <div>Operator: <strong className="text-slate-900">{data.gateInOperator || 'Ramesh Kulkarni'}</strong></div>
                <div>Initial Weight Type: <strong className="text-slate-900">{data.firstWeightType}</strong></div>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-800 uppercase block mb-1">Gate Out Audit:</span>
              <div className="space-y-0.5 text-slate-600">
                <div>Date & Time: <strong className="text-slate-900">{data.gateOutTime || (isFinalSlip ? new Date().toLocaleString() : 'In-Progress Inside Plant')}</strong></div>
                <div>Operator: <strong className="text-slate-900">{data.gateOutOperator || (isFinalSlip ? 'Ramesh Kulkarni' : 'Pending')}</strong></div>
                <div>Second Weight Type: <strong className="text-slate-900">{data.secondWeightType || (data.firstWeightType === 'GROSS' ? 'TARE' : 'GROSS')}</strong></div>
              </div>
            </div>
          </div>

          {/* Signatures & Barcode Footer */}
          <div className="pt-6 border-t-2 border-slate-800 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-8">
              <div className="h-8 border-b border-dashed border-slate-400" />
              <div className="font-semibold text-slate-800">
                Vehicle Driver's Signature
              </div>
            </div>

            <div className="space-y-8">
              <div className="h-8 border-b border-dashed border-slate-400" />
              <div className="font-semibold text-slate-800">
                Weighbridge Operator
                <div className="text-[10px] text-slate-500 font-normal">Aparna Enterprises Ltd</div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="h-8 border-b border-dashed border-slate-400" />
              <div className="font-semibold text-slate-800">
                Security / Plant In-Charge
                <div className="text-[10px] text-slate-500 font-normal">Gate Authorization Stamped</div>
              </div>
            </div>
          </div>

          {/* Barcode & Legal Disclaimer */}
          <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200">
            <div className="font-mono">
              ||| | ||||| |||| || |||||||| | |||| {data.ticketNumber} |||| |||
            </div>
            <div>
              Generated via Aparna RMC Gate-to-Exit System • Certified Compliant with SAP S/4HANA
            </div>
          </div>
        </div>

        {/* Modal Bottom Close Button */}
        <div className="bg-slate-100 px-4 py-2 border-t border-slate-300 flex justify-end print:hidden">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClose}
            className="h-7 text-xs bg-white text-slate-800 border-slate-300"
          >
            Close Slip
          </Button>
        </div>
      </div>
    </div>
  );
}

