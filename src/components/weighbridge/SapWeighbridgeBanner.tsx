import React, { useState } from 'react';
import { 
  Building2, 
  ArrowRightLeft, 
  Check, 
  ChevronRight, 
  FileText, 
  Truck, 
  Scale, 
  Database,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface SapWeighbridgeBannerProps {
  onOpenSapModal: () => void;
  onOpenGateInScreen: (option: 'po_ref' | 'without_po' | 'others') => void;
  activeSapPo?: string | null;
  activeSapDoc?: string | null;
  onSelectOption: (option: 'po_ref' | 'without_po' | 'others') => void;
}

export function SapWeighbridgeBanner({
  onOpenSapModal,
  onOpenGateInScreen,
  activeSapPo,
  activeSapDoc,
  onSelectOption,
}: SapWeighbridgeBannerProps) {
  const [selectedRadio, setSelectedRadio] = useState<'po_ref' | 'without_po' | 'others'>('po_ref');

  const handleEnterClick = () => {
    onSelectOption(selectedRadio);
    onOpenGateInScreen(selectedRadio);
  };

  return (
    <Card className="border-border/80 overflow-hidden shadow-md bg-card">
      {/* Top authentic SAP Tan/Caramel header bar */}
      <div className="bg-[#e8cca8] border-b border-[#c8aa86] px-4 py-2 flex items-center justify-between text-slate-900">
        <div className="flex items-center gap-2.5">
          <span className="font-extrabold text-xl tracking-tighter italic font-serif text-[#1e2a38]">
            SAP
          </span>
          <div className="h-4 w-px bg-slate-700/20" />
          <span className="text-xs font-semibold text-slate-900">
            ERP Gate-to-Weighbridge Integration
          </span>
          <Badge variant="outline" className="text-[10px] bg-[#dfcbaf] text-slate-900 border-[#bda282] font-mono">
            Plant PL01
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] bg-[#dfcbaf] px-2 py-0.5 rounded border border-[#bda282]">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-medium text-slate-800">S/4HANA Connected</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSapModal}
            className="h-6 text-[11px] px-2 text-slate-800 hover:text-slate-950 hover:bg-[#d6b793]"
          >
            <span>Open Console</span>
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Left: Authentic Frame with Radio Buttons & Enter button (matches screenshot) */}
          <div className="md:col-span-7">
            <div className="bg-[#f2e6d6] rounded-lg p-4 sm:p-5 border border-[#d6c4ae] shadow-inner text-slate-900">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#795d3c] mb-2.5 flex items-center justify-between">
                <span>Select Weighment Authorization</span>
                <span className="font-mono text-[10px]">SAP GUI Screen</span>
              </div>

              {/* Inner bordered panel */}
              <div className="border border-[#bca182] bg-[#eddcc6]/60 rounded p-4 space-y-2.5">
                <label 
                  onClick={() => setSelectedRadio('po_ref')}
                  className="flex items-center gap-2.5 cursor-pointer select-none"
                >
                  <input
                    type="radio"
                    name="sap_banner_option"
                    checked={selectedRadio === 'po_ref'}
                    onChange={() => setSelectedRadio('po_ref')}
                    className="h-3.5 w-3.5 accent-[#1e2a38] cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-900">PO ref</span>
                  <span className="text-[11px] text-slate-600 italic">
                    (Inbound Raw Material with SAP Purchase Order)
                  </span>
                </label>

                <label 
                  onClick={() => setSelectedRadio('without_po')}
                  className="flex items-center gap-2.5 cursor-pointer select-none"
                >
                  <input
                    type="radio"
                    name="sap_banner_option"
                    checked={selectedRadio === 'without_po'}
                    onChange={() => setSelectedRadio('without_po')}
                    className="h-3.5 w-3.5 accent-[#1e2a38] cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-900">Without PO</span>
                  <span className="text-[11px] text-slate-600 italic">
                    (Direct Quarry Receipts / Non-PO Supply)
                  </span>
                </label>

                <label 
                  onClick={() => setSelectedRadio('others')}
                  className="flex items-center gap-2.5 cursor-pointer select-none"
                >
                  <input
                    type="radio"
                    name="sap_banner_option"
                    checked={selectedRadio === 'others'}
                    onChange={() => setSelectedRadio('others')}
                    className="h-3.5 w-3.5 accent-[#1e2a38] cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-900">Others</span>
                  <span className="text-[11px] text-slate-600 italic">
                    (Plant Scrap, Mixer Tare Check, Disposal)
                  </span>
                </label>

                {/* Classic Beveled Enter Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleEnterClick}
                    className="px-5 py-1 bg-[#dfcbaf] hover:bg-[#d0b99a] active:bg-[#c2aa8a] border-2 border-t-[#f5e8d8] border-l-[#f5e8d8] border-b-[#9e8365] border-r-[#9e8365] rounded text-slate-900 text-xs font-semibold shadow transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Enter</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Data Flow Info & Active SAP Linking */}
          <div className="md:col-span-5 space-y-3">
            <div className="p-3.5 rounded-lg bg-muted/40 border border-border space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Data Synchronization:</span>
                <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                  Bidirectional ⇄
                </Badge>
              </div>

              <div className="space-y-1.5 text-[11px] text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">1. SAP ➔ RMC:</span>
                  <span>Pulls PO lines, suppliers, and expected quantities.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-400 font-bold">2. RMC ➔ SAP:</span>
                  <span>Posts Gross/Tare weights to create MIGO Goods Receipt.</span>
                </div>
              </div>

              {activeSapPo ? (
                <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px]">
                  <div className="flex justify-between items-center text-amber-300 font-semibold">
                    <span>Linked SAP PO:</span>
                    <span className="font-mono">#{activeSapPo}</span>
                  </div>
                  {activeSapDoc && (
                    <div className="flex justify-between items-center text-emerald-400 mt-1">
                      <span>SAP Doc Posted:</span>
                      <span className="font-mono">{activeSapDoc}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Active Session:</span>
                  <span className="text-slate-400">Ready to link SAP data</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
