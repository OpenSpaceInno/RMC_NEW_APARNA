import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { SapPurchaseOrder, SapStatus, SapSyncResponse, SapWeighbridgeTransaction } from '@/types/sap';
import { 
  Building2, 
  FileText, 
  ArrowRightLeft, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  Truck, 
  Scale, 
  Send, 
  Database, 
  Sparkles, 
  Layers, 
  Radio, 
  Check, 
  AlertCircle,
  ExternalLink,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface SapIntegrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplySapData?: (data: {
    syncType: 'po_ref' | 'without_po' | 'others';
    poNumber?: string;
    vendorName?: string;
    materialName?: string;
    vehicleRegNo?: string;
    driverName?: string;
    storageLocation?: string;
  }) => void;
}

export function SapIntegrationModal({
  open,
  onOpenChange,
  onApplySapData,
}: SapIntegrationModalProps) {
  // Step 1: Radio Selection (Exactly as shown in attached image)
  const [selectedOption, setSelectedOption] = useState<'po_ref' | 'without_po' | 'others'>('without_po');
  const [screenStep, setScreenStep] = useState<'menu' | 'po_selector' | 'without_po_form' | 'others_form'>('menu');

  // SAP PO data
  const [purchaseOrders, setPurchaseOrders] = useState<SapPurchaseOrder[]>([]);
  const [loadingPos, setLoadingPos] = useState<boolean>(false);
  const [poSearch, setPoSearch] = useState<string>('');
  const [selectedPo, setSelectedPo] = useState<SapPurchaseOrder | null>(null);

  // Without PO fields
  const [withoutPoVendor, setWithoutPoVendor] = useState<string>('Sri Krishna Stone Works (Spot Quarry)');
  const [withoutPoMaterial, setWithoutPoMaterial] = useState<string>('20mm Blue Metal Granite Aggregate');
  const [withoutPoChallan, setWithoutPoChallan] = useState<string>('');
  const [withoutPoVehicle, setWithoutPoVehicle] = useState<string>('');
  const [withoutPoDriver, setWithoutPoDriver] = useState<string>('');

  // Others fields
  const [othersType, setOthersType] = useState<string>('Plant Scrap Metal Sale');
  const [othersParty, setOthersParty] = useState<string>('Hitech Metal Recyclers');
  const [othersVehicle, setOthersVehicle] = useState<string>('');
  const [othersNotes, setOthersNotes] = useState<string>('Outbound weighment check');

  // Transactions log
  const [transactions, setTransactions] = useState<SapWeighbridgeTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState<boolean>(false);
  const [sapStatus, setSapStatus] = useState<SapStatus | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'console' | 'history'>('console');

  // Fetch SAP POs and status on open
  useEffect(() => {
    if (open) {
      loadSapData();
    }
  }, [open]);

  const loadSapData = async () => {
    setLoadingPos(true);
    try {
      const [posData, statusData, txData] = await Promise.allSettled([
        api.getSapPurchaseOrders(),
        api.getSapStatus(),
        api.getSapTransactions({ limit: 15 }),
      ]);

      if (posData.status === 'fulfilled' && Array.isArray(posData.value)) {
        setPurchaseOrders(posData.value);
        if (posData.value.length > 0 && !selectedPo) {
          setSelectedPo(posData.value[0]);
        }
      }

      if (statusData.status === 'fulfilled') {
        setSapStatus(statusData.value);
      }

      if (txData.status === 'fulfilled' && Array.isArray(txData.value)) {
        setTransactions(txData.value);
      }
    } catch (err: any) {
      console.warn('Failed to load SAP data:', err);
    } finally {
      setLoadingPos(false);
    }
  };

  // Handle clicking "Enter" from the classic SAP menu screen
  const handleEnterClick = () => {
    if (selectedOption === 'po_ref') {
      setScreenStep('po_selector');
    } else if (selectedOption === 'without_po') {
      setScreenStep('without_po_form');
    } else {
      setScreenStep('others_form');
    }
  };

  // Handle importing selected PO into weighbridge session
  const handleApplyPo = (po: SapPurchaseOrder) => {
    if (onApplySapData) {
      onApplySapData({
        syncType: 'po_ref',
        poNumber: po.poNumber,
        vendorName: po.vendorName,
        materialName: po.materialName,
        vehicleRegNo: po.defaultVehicle || '',
        driverName: po.defaultDriver || '',
        storageLocation: po.storageLocation,
      });
      toast.success(`SAP PO ${po.poNumber} Imported!`, {
        description: `${po.vendorName} • ${po.materialName} populated into Weighbridge Session`,
      });
    }
    onOpenChange(false);
    setScreenStep('menu');
  };

  // Handle applying Without PO details
  const handleApplyWithoutPo = () => {
    if (onApplySapData) {
      onApplySapData({
        syncType: 'without_po',
        vendorName: withoutPoVendor,
        materialName: withoutPoMaterial,
        vehicleRegNo: withoutPoVehicle,
        driverName: withoutPoDriver,
        storageLocation: 'BIN-AGG-A',
      });
      toast.success('Non-PO Inbound Receipt Configured', {
        description: `Movement 501 initialized for ${withoutPoMaterial}`,
      });
    }
    onOpenChange(false);
    setScreenStep('menu');
  };

  // Handle applying Others details
  const handleApplyOthers = () => {
    if (onApplySapData) {
      onApplySapData({
        syncType: 'others',
        vendorName: othersParty,
        materialName: othersType,
        vehicleRegNo: othersVehicle,
        storageLocation: 'YARD-OUTBOUND',
      });
      toast.success('Custom Weighment Configured', {
        description: `SAP movement registered for ${othersType}`,
      });
    }
    onOpenChange(false);
    setScreenStep('menu');
  };

  // Filtered POs
  const filteredPos = purchaseOrders.filter(
    (p) =>
      p.poNumber.includes(poSearch) ||
      p.vendorName.toLowerCase().includes(poSearch.toLowerCase()) ||
      p.materialName.toLowerCase().includes(poSearch.toLowerCase()) ||
      (p.defaultVehicle && p.defaultVehicle.toLowerCase().includes(poSearch.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-900 border-slate-700 shadow-2xl">
        {/* Authentic SAP Sand/Tan Top Header Bar (matches user screenshot) */}
        <div className="bg-[#e8cca8] border-b border-[#c8aa86] px-5 py-3 flex items-center justify-between text-slate-900 shadow-inner">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-2xl tracking-tighter italic font-serif text-[#1e2a38]">
              SAP
            </span>
            <div className="h-5 w-px bg-slate-700/20" />
            <div className="text-xs">
              <span className="font-bold text-slate-900">RMC Weighbridge Integration</span>
              <span className="mx-1.5 text-slate-600">•</span>
              <span className="text-slate-700 font-mono">System: PRD_S4H [Plant: PL01]</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] bg-[#dcb990] px-2.5 py-1 rounded border border-[#bfa079]">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-semibold text-slate-800">RFC Active (18ms)</span>
            </div>
            <div className="text-xs font-mono text-slate-700 hidden sm:block">
              Client 100
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
            <div className="flex items-center justify-between">
              <TabsList className="bg-slate-900 border border-slate-800 h-8">
                <TabsTrigger value="console" className="text-xs data-[state=active]:bg-primary">
                  SAP Weighment Console
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs data-[state=active]:bg-primary">
                  Sync & Transaction Log ({transactions.length})
                </TabsTrigger>
              </TabsList>

              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>Direction:</span>
                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                  ⇄ Bidirectional (SAP ↔ RMC)
                </Badge>
              </div>
            </div>
          </Tabs>
        </div>

        {/* CONTENT BODY */}
        <div className="p-6 bg-slate-950 min-h-[460px]">
          {activeTab === 'console' ? (
            <div>
              {/* STEP 1: CLASSIC SAP RADIO SELECTION FRAME (Exactly as user screenshot) */}
              {screenStep === 'menu' && (
                <div className="max-w-xl mx-auto py-4">
                  {/* Outer container with authentic tan background like attached photo */}
                  <div className="bg-[#f2e6d6] rounded-lg p-6 sm:p-8 border border-[#d6c4ae] shadow-lg text-slate-900 relative">
                    <div className="mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#795d3c]">
                        Transaction / Weighment Type
                      </span>
                    </div>

                    {/* Classic SAP frame with border */}
                    <div className="border border-[#bca182] bg-[#eddcc6]/60 rounded p-6 sm:p-8 space-y-4">
                      {/* Radio 1: PO ref */}
                      <label 
                        onClick={() => setSelectedOption('po_ref')}
                        className="flex items-center gap-3 cursor-pointer select-none group"
                      >
                        <input
                          type="radio"
                          name="sap_flow_option"
                          checked={selectedOption === 'po_ref'}
                          onChange={() => setSelectedOption('po_ref')}
                          className="h-4 w-4 accent-[#1e2a38] text-primary focus:ring-0 cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-900 transition-colors">
                          PO ref
                        </span>
                        <span className="text-xs text-slate-600 italic ml-2">
                          (Inbound Raw Material with SAP Purchase Order)
                        </span>
                      </label>

                      {/* Radio 2: Without PO */}
                      <label 
                        onClick={() => setSelectedOption('without_po')}
                        className="flex items-center gap-3 cursor-pointer select-none group"
                      >
                        <input
                          type="radio"
                          name="sap_flow_option"
                          checked={selectedOption === 'without_po'}
                          onChange={() => setSelectedOption('without_po')}
                          className="h-4 w-4 accent-[#1e2a38] text-primary focus:ring-0 cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-900 transition-colors">
                          Without PO
                        </span>
                        <span className="text-xs text-slate-600 italic ml-2">
                          (Direct Quarry Inbound / Spot Raw Materials / Non-PO Receipt)
                        </span>
                      </label>

                      {/* Radio 3: Others */}
                      <label 
                        onClick={() => setSelectedOption('others')}
                        className="flex items-center gap-3 cursor-pointer select-none group"
                      >
                        <input
                          type="radio"
                          name="sap_flow_option"
                          checked={selectedOption === 'others'}
                          onChange={() => setSelectedOption('others')}
                          className="h-4 w-4 accent-[#1e2a38] text-primary focus:ring-0 cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-900 transition-colors">
                          Others
                        </span>
                        <span className="text-xs text-slate-600 italic ml-2">
                          (Plant Scrap, Mixer Tare Verification, Sludge Disposal)
                        </span>
                      </label>

                      {/* Authentic Beveled Enter Button */}
                      <div className="pt-4">
                        <button
                          type="button"
                          onClick={handleEnterClick}
                          className="px-6 py-1.5 bg-[#dfcbaf] hover:bg-[#d0b99a] active:bg-[#c2aa8a] border-2 border-t-[#f5e8d8] border-l-[#f5e8d8] border-b-[#9e8365] border-r-[#9e8365] rounded text-slate-900 text-sm font-semibold shadow transition-all cursor-pointer flex items-center gap-2"
                        >
                          <span>Enter</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[11px] text-[#795d3c]">
                      <span>Select an option and press Enter to load data flow</span>
                      <span className="font-mono">SAP GUI / BAPI v2026.4</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2A: SAP PURCHASE ORDER SELECTOR (When "PO ref" was clicked) */}
              {screenStep === 'po_selector' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setScreenStep('menu')}
                        className="text-xs h-7 px-2 text-slate-400 hover:text-white"
                      >
                        ← Back to SAP Menu
                      </Button>
                      <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        <FileText className="h-4 w-4 text-amber-400" />
                        SAP Active Purchase Orders (SAP ➔ RMC App)
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative w-64">
                        <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <Input
                          placeholder="Search PO #, vendor, material..."
                          value={poSearch}
                          onChange={(e) => setPoSearch(e.target.value)}
                          className="h-8 text-xs pl-8 bg-slate-900 border-slate-800 text-white"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={loadSapData}
                        disabled={loadingPos}
                        className="h-8 text-xs gap-1 border-slate-700"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${loadingPos ? 'animate-spin' : ''}`} />
                        Refresh POs
                      </Button>
                    </div>
                  </div>

                  {/* PO Cards / Table */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                    {filteredPos.map((po) => {
                      const isSelected = selectedPo?.poNumber === po.poNumber;
                      const progress = Math.min(100, (po.receivedQty / po.orderedQty) * 100);

                      return (
                        <Card
                          key={po.poNumber}
                          onClick={() => setSelectedPo(po)}
                          className={`bg-slate-900 border cursor-pointer transition-all hover:border-amber-500/50 ${
                            isSelected ? 'border-amber-500 ring-1 ring-amber-500 bg-slate-900/90' : 'border-slate-800'
                          }`}
                        >
                          <CardHeader className="p-3.5 pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-300">
                                  PO #{po.poNumber}
                                </Badge>
                                <CardTitle className="text-sm font-semibold text-white mt-1">
                                  {po.materialName}
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-400">
                                  {po.vendorName} ({po.vendorCode})
                                </CardDescription>
                              </div>

                              <Badge variant="secondary" className="text-[10px] bg-slate-800 text-slate-300">
                                {po.category}
                              </Badge>
                            </div>
                          </CardHeader>

                          <CardContent className="p-3.5 pt-0 text-xs space-y-2">
                            <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800">
                              <span>Open / Pending Qty:</span>
                              <span className="font-bold text-emerald-400 font-mono">
                                {po.pendingQty.toFixed(2)} {po.unit}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-500 h-full rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>Recv: {po.receivedQty.toFixed(1)} T</span>
                              <span>Total: {po.orderedQty.toFixed(1)} T</span>
                            </div>

                            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-800/60">
                              <span>Silo / Storage: <strong className="text-slate-300">{po.storageLocation}</strong></span>
                              <span>Vehicle: <strong className="font-mono text-slate-300">{po.defaultVehicle || 'Any'}</strong></span>
                            </div>
                          </CardContent>

                          <CardFooter className="p-2 pt-0 flex justify-end">
                            <Button
                              size="sm"
                              className="w-full h-7 text-xs bg-amber-600 hover:bg-amber-500 text-white font-medium gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplyPo(po);
                              }}
                            >
                              <ArrowRightLeft className="h-3 w-3" />
                              Import into Weighbridge Session
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2B: WITHOUT PO FORM (When "Without PO" was clicked) */}
              {screenStep === 'without_po_form' && (
                <div className="max-w-xl mx-auto space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setScreenStep('menu')}
                      className="text-xs h-7 px-2 text-slate-400 hover:text-white"
                    >
                      ← Back to SAP Menu
                    </Button>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Truck className="h-4 w-4 text-blue-400" />
                      SAP Direct Inbound Receipt (Movement Type 501)
                    </h3>
                  </div>

                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-white">
                        Non-PO Delivery Parameters
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        Capture spot purchases or non-contract raw materials for cost center allocation in SAP.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-300">Supplier / Quarry Name *</Label>
                        <Input
                          value={withoutPoVendor}
                          onChange={(e) => setWithoutPoVendor(e.target.value)}
                          placeholder="e.g. Sri Krishna Stone Works"
                          className="bg-slate-950 border-slate-800 text-white h-8 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-300">Material Category *</Label>
                        <Input
                          value={withoutPoMaterial}
                          onChange={(e) => setWithoutPoMaterial(e.target.value)}
                          placeholder="e.g. 20mm Blue Metal Granite Aggregate"
                          className="bg-slate-950 border-slate-800 text-white h-8 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-300">Vendor DC / Challan No</Label>
                          <Input
                            value={withoutPoChallan}
                            onChange={(e) => setWithoutPoChallan(e.target.value)}
                            placeholder="DC-9921"
                            className="bg-slate-950 border-slate-800 text-white h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-300">Vehicle Registration</Label>
                          <Input
                            value={withoutPoVehicle}
                            onChange={(e) => setWithoutPoVehicle(e.target.value.toUpperCase())}
                            placeholder="TS08UB4412"
                            className="bg-slate-950 border-slate-800 text-white h-8 text-xs"
                          />
                        </div>
                      </div>

                      <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800 text-[11px] text-slate-400 space-y-1">
                        <div className="flex justify-between">
                          <span>SAP Cost Center:</span>
                          <strong className="text-slate-300">CC-RMC-PL01 (Plant Production)</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>SAP Movement Code:</span>
                          <strong className="text-emerald-400 font-mono">501 (Receipt w/o PO)</strong>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button
                        onClick={handleApplyWithoutPo}
                        className="w-full text-xs font-semibold gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Start Non-PO Weighment Session
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}

              {/* STEP 2C: OTHERS FORM (When "Others" was clicked) */}
              {screenStep === 'others_form' && (
                <div className="max-w-xl mx-auto space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setScreenStep('menu')}
                      className="text-xs h-7 px-2 text-slate-400 hover:text-white"
                    >
                      ← Back to SAP Menu
                    </Button>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Scale className="h-4 w-4 text-purple-400" />
                      SAP Miscellaneous Weighment (Others)
                    </h3>
                  </div>

                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-white">
                        Others / Outbound Weighment Parameters
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        Record internal vehicle tares, scrap sales, or sub-contractor equipment calibration.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-300">Weighment Purpose / Type *</Label>
                        <Input
                          value={othersType}
                          onChange={(e) => setOthersType(e.target.value)}
                          placeholder="e.g. Plant Scrap Metal Sale"
                          className="bg-slate-950 border-slate-800 text-white h-8 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-300">Party / Contractor / Department Name</Label>
                        <Input
                          value={othersParty}
                          onChange={(e) => setOthersParty(e.target.value)}
                          placeholder="e.g. Hitech Metal Recyclers"
                          className="bg-slate-950 border-slate-800 text-white h-8 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-300">Vehicle Registration</Label>
                        <Input
                          value={othersVehicle}
                          onChange={(e) => setOthersVehicle(e.target.value.toUpperCase())}
                          placeholder="e.g. TS09UA8811"
                          className="bg-slate-950 border-slate-800 text-white h-8 text-xs"
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button
                        onClick={handleApplyOthers}
                        className="w-full text-xs font-semibold gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Start Custom Weighment Session
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: LIVE SAP TRANSACTION & BIDIRECTIONAL SYNC LOG */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Database className="h-4 w-4 text-emerald-400" />
                    Bidirectional SAP ↔ RMC App Transaction Records
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live audit trail of data exchanged between SAP S/4HANA ERP and the plant weighbridge.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadSapData}
                  className="h-7 text-xs border-slate-800"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {transactions.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    No SAP weighbridge transactions recorded yet.
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">
                            {tx.sapDocNumber ? `SAP MIGO #${tx.sapDocNumber}` : 'Pending SAP'}
                          </Badge>
                          <span className="font-semibold text-white">{tx.vehicleNo || 'Vehicle'}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">{tx.materialName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-3">
                          <span>Vendor: <strong className="text-slate-300">{tx.vendorName || 'N/A'}</strong></span>
                          {tx.poNumber && (
                            <span>PO Ref: <strong className="font-mono text-amber-300">#{tx.poNumber}</strong></span>
                          )}
                          <span>Movement: <strong className="font-mono text-emerald-400">{tx.movementType}</strong></span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between text-right shrink-0">
                        <div className="font-bold text-emerald-400 text-sm">
                          {tx.netWeight ? `${tx.netWeight.toFixed(2)} tons` : '0.00 tons'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(tx.syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="bg-slate-950 border-t border-slate-800 px-5 py-2.5 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>RFC Destination: SAP_PRD_ECC</span>
            <span>•</span>
            <span>Format: BAPI_GOODSMVT_CREATE</span>
          </div>
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-7 text-xs border-slate-800 text-slate-300 hover:text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
