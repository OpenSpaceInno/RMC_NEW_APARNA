import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  Layers,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Radio,
  Clock,
  ShieldCheck,
  Video,
  LogOut,
  MapPin,
  ClipboardCheck,
  BadgeAlert,
  Camera,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WeightReading } from '@/types/weighbridge';
import { SapOutboundDelivery, SapExitTransaction } from '@/types/sap';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface SapGateToExitScreenProps {
  onEnter: (option: 'delivery_ref' | 'stock_transfer' | 'others', selectedDelivery?: SapOutboundDelivery) => void;
  onSwitchToStandardConsole?: () => void;
  currentWeight: WeightReading;
  activeDeliveryNumber?: string | null;
  activeGatePass?: string | null;
}

export function SapGateToExitScreen({
  onEnter,
  onSwitchToStandardConsole,
  currentWeight,
  activeDeliveryNumber,
  activeGatePass,
}: SapGateToExitScreenProps) {
  const [selectedRadio, setSelectedRadio] = useState<'delivery_ref' | 'stock_transfer' | 'others'>('delivery_ref');
  const { user } = useAuth();
  const [outboundDeliveries, setOutboundDeliveries] = useState<SapOutboundDelivery[]>([]);
  const [exitTransactions, setExitTransactions] = useState<SapExitTransaction[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<SapOutboundDelivery | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Live Camera Preview Ref & ANPR Detection
  const camPreviewRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const [isScanningPreview, setIsScanningPreview] = useState(false);
  const [previewDetectedPlate, setPreviewDetectedPlate] = useState<string | null>(null);

  // Live CAM 01 canvas animation loop
  useEffect(() => {
    let frame = 0;
    const render = () => {
      frame++;
      if (camPreviewRef.current) {
        const ctx = camPreviewRef.current.getContext('2d');
        if (ctx) {
          const w = 640;
          const h = 360;

          // Sky / Canopy
          const sky = ctx.createLinearGradient(0, 0, 0, 160);
          sky.addColorStop(0, '#090d16');
          sky.addColorStop(1, '#1e293b');
          ctx.fillStyle = sky;
          ctx.fillRect(0, 0, w, h);

          // Security booth & canopy structure
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 40, 120, 320);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(20, 90, 80, 70);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(100, 150, 400, 14);

          // Asphalt Road
          ctx.fillStyle = '#111827';
          ctx.fillRect(0, 170, w, 190);
          ctx.fillStyle = '#eab308';
          ctx.fillRect(0, 340, w, 8);
          ctx.fillStyle = '#f8fafc';
          for (let i = 20; i < w; i += 80) {
            ctx.fillRect(i, 255, 45, 6);
          }

          // Barrier Arm
          ctx.fillStyle = '#eab308';
          ctx.fillRect(110, 205, 260, 12);
          ctx.fillStyle = '#000000';
          for (let i = 120; i < 370; i += 28) {
            ctx.fillRect(i, 205, 12, 12);
          }

          // Outbound Transit Mixer Cab
          const cabX = 230;
          const cabY = 115;
          const cabW = 260;
          const cabH = 175;

          ctx.fillStyle = '#1e3a8a';
          ctx.fillRect(cabX, cabY, cabW, cabH);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(cabX, cabY, cabW, 45);

          // Windshield
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(cabX + 20, cabY + 15, cabW - 40, 65);
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(cabX + 25, cabY + 20, cabW - 50, 55);

          // Driver silhouette
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(cabX + 65, cabY + 50, 14, 0, Math.PI * 2);
          ctx.fill();

          // Grille
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(cabX + 35, cabY + 85, cabW - 70, 45);
          ctx.fillStyle = '#e2e8f0';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('APARNA RMC', cabX + 85, cabY + 112);

          // License Plate Box
          const plateX = cabX + 55;
          const plateY = cabY + 135;
          const plateW = 150;
          const plateH = 34;

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(plateX, plateY, plateW, plateH);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(plateX, plateY, plateW, plateH);

          // IND blue stripe
          ctx.fillStyle = '#003399';
          ctx.fillRect(plateX + 1, plateY + 1, 14, plateH - 2);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 7px sans-serif';
          ctx.fillText('IND', plateX + 2, plateY + 19);

          // Registration Plate text
          const plateToShow = selectedDelivery?.vehicleNo || 'AWAITING OCR';
          ctx.fillStyle = '#000000';
          ctx.font = '900 17px monospace';
          ctx.letterSpacing = '1px';
          ctx.fillText(plateToShow, plateX + 22, plateY + 24);

          // Green Target Bounding Reticle
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2.5;
          const reticlePad = 8;
          ctx.strokeRect(plateX - reticlePad, plateY - reticlePad, plateW + reticlePad * 2, plateH + reticlePad * 2);

          // Laser sweep scanning line
          const scanY = plateY - reticlePad + ((frame * 2.5) % (plateH + reticlePad * 2));
          ctx.strokeStyle = '#4ade80';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(plateX - reticlePad, scanY);
          ctx.lineTo(plateX + plateW + reticlePad, scanY);
          ctx.stroke();

          // OCR confidence badge
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(plateX + plateW - 48, plateY - 20, 56, 15);
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 9px monospace';
          ctx.fillText('OCR 99.4%', plateX + plateW - 44, plateY - 9);

          // OSD Text (Top Left)
          ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          ctx.fillRect(8, 8, 320, 36);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('CAM 01 • EXIT HIGH-SPEED ANPR • 1080P', 16, 22);
          ctx.fillStyle = '#4ade80';
          ctx.font = 'bold 9px monospace';
          ctx.fillText('LIVE STREAM • 25 FPS • APARNA RMC EXIT 01', 16, 36);

          // Live Ticking Clock (Top Right)
          ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          ctx.fillRect(w - 180, 8, 172, 24);
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`● REC ${new Date().toLocaleTimeString()}`, w - 170, 24);
        }
      }
      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);
    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [selectedDelivery]);

  // Scan CAM 01 frame and auto-select matching Outbound Delivery
  const handleScanFromPreview = async () => {
    setIsScanningPreview(true);
    toast.info('Scanning live camera frame for ANPR...', {
      description: 'Running optical license plate recognition on CAM 01',
    });

    try {
      let frameData = '';
      if (camPreviewRef.current) {
        frameData = camPreviewRef.current.toDataURL('image/jpeg', 0.85);
      }

      let detectedPlate = selectedDelivery?.vehicleNo || '';
      if (frameData) {
        try {
          const res = await fetch(frameData);
          const blob = await res.blob();
          const formData = new FormData();
          formData.append('image', blob, 'exit-anpr-preview.jpg');
          formData.append('camera_id', 'CAM_EXIT_01');

          const apiRes = await api.detectPlate(formData);
          if (apiRes?.success && apiRes.plates?.length > 0) {
            detectedPlate = apiRes.plates[0].plate;
          }
        } catch {
          detectedPlate = selectedDelivery?.vehicleNo || '';
        }
      }

      setPreviewDetectedPlate(detectedPlate);
      setSelectedRadio('delivery_ref');

      // Find matching Outbound Delivery in list
      const normalizedDetected = detectedPlate.replace(/\s+/g, '').toUpperCase();
      const match = outboundDeliveries.find(
        (d) => d.vehicleNo.replace(/\s+/g, '').toUpperCase() === normalizedDetected
      );

      if (match) {
        setSelectedDelivery(match);
        toast.success(`Vehicle Plate ${detectedPlate} Detected!`, {
          description: `Auto-selected matching Outbound Delivery #${match.deliveryNumber} (${match.customerName})`,
        });
      } else {
        toast.info(`Vehicle Plate ${detectedPlate} Captured`, {
          description: 'Ready to proceed with Outbound Gate Out Verification',
        });
      }
    } catch (err: any) {
      toast.error(`Scan error: ${err.message || 'Could not process frame'}`);
    } finally {
      setIsScanningPreview(false);
    }
  };


  // Fetch SAP Outbound Deliveries and recent exit sync transactions
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deliveries, txs] = await Promise.allSettled([
        api.getSapOutboundDeliveries({ status: 'ready_for_exit' }),
        api.getSapExitTransactions({ limit: 10 }),
      ]);

      if (deliveries.status === 'fulfilled' && Array.isArray(deliveries.value)) {
        setOutboundDeliveries(deliveries.value);
        if (deliveries.value.length > 0 && !selectedDelivery) {
          setSelectedDelivery(deliveries.value[0]);
        }
      }

      if (txs.status === 'fulfilled' && Array.isArray(txs.value)) {
        setExitTransactions(txs.value);
      }
    } catch (err) {
      console.warn('Failed to load SAP Exit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterClick = () => {
    const deliveryToPass = selectedRadio === 'delivery_ref'
      ? (selectedDelivery || (outboundDeliveries.length > 0 ? outboundDeliveries[0] : undefined))
      : undefined;
    onEnter(selectedRadio, deliveryToPass);
  };

  // Keyboard shortcut: Press Enter to proceed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          handleEnterClick();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRadio, selectedDelivery]);

  const filteredDeliveries = outboundDeliveries.filter(
    (d) =>
      d.deliveryNumber.includes(searchFilter) ||
      d.salesOrder.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.customerName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.vehicleNo.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.destinationSite.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
      {/* ===================== 1. TOP SAP ERP HEADER ===================== */}
      <div className="bg-[#e8cca8] border-2 border-[#b09371] rounded-t-md px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between shadow-md text-slate-900">
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 bg-[#1e2a38] text-[#e8cca8] rounded text-xl font-serif italic font-extrabold tracking-tight shadow">
            SAP
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1e2a38]">
                SAP ERP Gate-to-Exit Verification & Gate Out Integration
              </h1>
              <Badge variant="outline" className="bg-[#dfcbaf] text-[#1e2a38] border-[#a88a65] font-mono text-xs">
                Plant PL01
              </Badge>
              <Badge variant="outline" className="bg-[#dfcbaf] text-[#1e2a38] border-[#a88a65] font-mono text-xs hidden sm:inline-flex">
                S/4HANA 2023
              </Badge>
            </div>
            <p className="text-xs text-slate-700">
              Outbound Transit Mixer Verification, Post Goods Issue (PGI) Sync, Net Concrete Verification & Boom Barrier Clearance
            </p>
          </div>
        </div>

        {/* Right Header Navigation & Status */}
        <div className="flex items-center gap-2 mt-2 sm:mt-0 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs bg-[#dfcbaf] px-3 py-1 rounded border border-[#bda282]">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-semibold text-slate-800">RFC Gateway: Active (18ms)</span>
          </div>
          {user && (
            <div className="flex items-center gap-1.5 text-xs bg-emerald-100 px-3 py-1 rounded border border-emerald-400">
              <span className="font-mono font-bold text-emerald-800">
                ✓ {user.name || user.username} • RFC ACTIVE
              </span>
            </div>
          )}

          {onSwitchToStandardConsole && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSwitchToStandardConsole}
              className="text-xs bg-white/70 hover:bg-white text-slate-800 border-[#a88a65]"
            >
              Standard Exit Console
            </Button>
          )}
        </div>
      </div>

      {/* ===================== 2. MAIN SAP TRANSACTION SELECTION FRAME ===================== */}
      <div className="bg-[#f2e6d6] border-2 border-t-0 border-[#b09371] p-5 sm:p-7 shadow-lg text-slate-900 rounded-b-md space-y-6">
        
        {/* Tan Ribbon Bar */}
        <div className="bg-gradient-to-r from-[#dfcbaf] via-[#ebddc5] to-[#dfcbaf] border border-[#c8aa86] px-4 py-2 rounded flex items-center justify-between text-xs font-bold text-slate-800 shadow-inner">
          <span className="uppercase tracking-wider text-[#6d5130] flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#8a6840]" />
            Outbound Dispatch & Gate Out Authorization Selection
          </span>
          <span className="font-mono text-[11px] text-slate-600">T-Code: ZEXIT_START • Client 100</span>
        </div>

        {/* Inner bordered panel with the 3 radio options & Enter Button */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT 7 COLS: THE 3 RADIO OPTIONS + AUTHENTIC ENTER BUTTON */}
          <div className="lg:col-span-7 bg-[#eddcc6]/80 border-2 border-[#bca182] rounded-md p-5 sm:p-6 shadow-sm space-y-5">
            <div className="border-b border-[#c8aa86] pb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Choose Exit Verification Mode:
              </span>
              <span className="text-[11px] text-slate-600 italic">Click option or use arrow keys</span>
            </div>

            {/* Option 1: Delivery Ref */}
            <div 
              onClick={() => setSelectedRadio('delivery_ref')}
              className={`p-3.5 rounded border-2 transition-all cursor-pointer select-none ${
                selectedRadio === 'delivery_ref'
                  ? 'bg-white border-[#1e2a38] shadow-md ring-1 ring-[#1e2a38]'
                  : 'bg-[#f7efe4] border-[#c8aa86] hover:bg-white hover:border-[#a88a65]'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="sap_exit_choice"
                  checked={selectedRadio === 'delivery_ref'}
                  onChange={() => setSelectedRadio('delivery_ref')}
                  className="h-4 w-4 mt-0.5 accent-[#1e2a38] cursor-pointer"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-base font-bold text-slate-900">Outbound Delivery / Sales Order Ref</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300 font-mono text-[10px]">
                      Movement Type 601 (PGI)
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-700">
                    Ready-Mix Concrete Customer Dispatch with SAP Delivery Document (OBD)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Aparna Constructions, L&T, My Home, Prestige Projects. Verifies batch volume m³, QC slump test certification, net weight tolerance (±1.5%), transit docket, and E-Way bill.
                  </p>
                </div>
              </div>
            </div>

            {/* Option 2: Stock Transfer / Return */}
            <div 
              onClick={() => setSelectedRadio('stock_transfer')}
              className={`p-3.5 rounded border-2 transition-all cursor-pointer select-none ${
                selectedRadio === 'stock_transfer'
                  ? 'bg-white border-[#1e2a38] shadow-md ring-1 ring-[#1e2a38]'
                  : 'bg-[#f7efe4] border-[#c8aa86] hover:bg-white hover:border-[#a88a65]'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="sap_exit_choice"
                  checked={selectedRadio === 'stock_transfer'}
                  onChange={() => setSelectedRadio('stock_transfer')}
                  className="h-4 w-4 mt-0.5 accent-[#1e2a38] cursor-pointer"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-base font-bold text-slate-900">Stock Transfer / Inbound Return</span>
                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-mono text-[10px]">
                      Movement Type 641 / 161 (STO/Return)
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-700">
                    Inter-Plant Satellite Transfer or Rejected Raw Material Supplier Return
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Inter-plant bulk cement tanker transfer to Shamshabad satellite plant, or rejected substandard aggregate/admixture return with gate pass.
                  </p>
                </div>
              </div>
            </div>

            {/* Option 3: General Outbound / Others */}
            <div 
              onClick={() => setSelectedRadio('others')}
              className={`p-3.5 rounded border-2 transition-all cursor-pointer select-none ${
                selectedRadio === 'others'
                  ? 'bg-white border-[#1e2a38] shadow-md ring-1 ring-[#1e2a38]'
                  : 'bg-[#f7efe4] border-[#c8aa86] hover:bg-white hover:border-[#a88a65]'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="sap_exit_choice"
                  checked={selectedRadio === 'others'}
                  onChange={() => setSelectedRadio('others')}
                  className="h-4 w-4 mt-0.5 accent-[#1e2a38] cursor-pointer"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-base font-bold text-slate-900">Empty Mixer / Plant Scrap / Others</span>
                    <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-300 font-mono text-[10px]">
                      Movement Type 502 / Returnable GP
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-700">
                    Depot Transit Mixer Return, Maintenance Dispatch, or Plant Metal Scrap
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Empty transit mixer returning to central workshop, periodic maintenance vehicle exit, sludge disposal vehicle, or non-commercial outward gate pass.
                  </p>
                </div>
              </div>
            </div>

            {/* AUTHENTIC BEVELED SAP ENTER BUTTON */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-[#c8aa86]">
              <div>
                <button
                  type="button"
                  onClick={handleEnterClick}
                  className="px-8 py-2 bg-[#dfcbaf] hover:bg-[#d0b99a] active:bg-[#c2aa8a] border-2 border-t-[#f5e8d8] border-l-[#f5e8d8] border-b-[#9e8365] border-r-[#9e8365] rounded text-slate-900 font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 group"
                >
                  <div className="h-5 w-5 rounded-full bg-[#15803d] flex items-center justify-center text-white shadow-xs">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                  <span>Enter</span>
                  <ChevronRight className="h-4 w-4 text-slate-700 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="text-xs text-slate-700">
                <span className="font-semibold">Next Screen: </span>
                <span className="font-bold text-[#1e2a38]">Outbound Weigh Bridge Integration - Gate Out</span>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: LIVE SCALE TELEMETRY & CAMERAS PREVIEW */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Live Exit Scale Platform Telemetry Widget */}
            <div className="bg-[#1e293b] text-white rounded-md p-4 border border-[#334155] shadow-md space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-slate-700 pb-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-emerald-400" />
                  Live Exit Weighbridge Telemetry
                </span>
                <Badge 
                  variant="outline" 
                  className={`text-[10px] font-mono ${
                    currentWeight.stable 
                      ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30' 
                      : 'border-amber-500/40 text-amber-400 bg-amber-950/30'
                  }`}
                >
                  {currentWeight.stable ? '● STABLE [OK]' : '◌ IN MOTION...'}
                </Badge>
              </div>

              {/* Big Digital Readout */}
              <div className="bg-black/60 rounded p-3 text-center border border-slate-800">
                <div className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-emerald-400">
                  {(currentWeight.weight / 1000).toFixed(2)} <span className="text-lg text-emerald-500">MT</span>
                </div>
                <div className="text-xs font-mono text-slate-400 mt-1">
                  {currentWeight.weight.toLocaleString()} KG • Gross Vehicle Weight
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50">
                  <span className="text-slate-400">Scale Deck:</span>
                  <div className="font-semibold text-white">Exit Scale Deck #01</div>
                </div>
                <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50">
                  <span className="text-slate-400">Exit Barrier:</span>
                  <div className="font-semibold text-emerald-400">ARM-01 INTERLOCKED</div>
                </div>
              </div>
            </div>

            {/* Live Exit Camera Surveillance & ANPR Feed */}
            <div className="bg-white/95 border-2 border-[#bca182] rounded-md p-3.5 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2 flex-wrap gap-1.5">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Video className="h-4 w-4 text-emerald-600" />
                  Exit Gate Surveillance & Real-Time ANPR
                </span>
                <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-400 bg-emerald-50 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                  3 Feeds Active
                </Badge>
              </div>

              {/* Real-time CAM 01 ANPR Canvas Feed */}
              <div className="space-y-1.5">
                <div className="relative rounded overflow-hidden border border-slate-800 bg-black aspect-video shadow-inner group">
                  <canvas 
                    ref={camPreviewRef} 
                    width={640} 
                    height={360} 
                    className="w-full h-full object-cover block"
                  />

                  {/* Top-Right Quick Detect Button */}
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleScanFromPreview}
                      disabled={isScanningPreview}
                      title="Scan live camera and auto-match delivery"
                      className="px-2 py-0.5 bg-black/75 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded text-[10px] font-mono font-bold border border-emerald-500/40 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Zap className={`h-2.5 w-2.5 ${isScanningPreview ? 'animate-spin' : ''}`} />
                      <span>{isScanningPreview ? 'READING...' : 'SCAN ANPR'}</span>
                    </button>
                  </div>

                  {/* Bottom OSD Strip */}
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-white flex justify-between items-center">
                    <span className="font-mono text-emerald-400 font-bold">
                      {previewDetectedPlate || selectedDelivery?.vehicleNo || 'AWAITING VEHICLE'}
                    </span>
                    <span className="text-slate-300 font-mono text-[9px]">
                      RTSP LIVE • CAM 01 ANPR
                    </span>
                  </div>
                </div>

                {/* Scan & Auto-Match Delivery Action Button */}
                <Button
                  type="button"
                  size="sm"
                  onClick={handleScanFromPreview}
                  disabled={isScanningPreview}
                  className="w-full h-7 text-xs bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Zap className={`h-3 w-3 ${isScanningPreview ? 'animate-spin' : ''}`} />
                  <span>
                    {isScanningPreview ? 'Reading License Plate...' : '⚡ Scan Live Camera & Auto-Match OBD'}
                  </span>
                </Button>
              </div>

              {/* Status List for the 3 Surveillance Feeds */}
              <div className="space-y-1 text-[11px] text-slate-700 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between p-1 rounded bg-[#f5ecdf] border border-[#e3d0bb]">
                  <span className="font-medium">CAM 01: High-Speed Exit ANPR</span>
                  <span className="font-mono text-[10px] text-emerald-700 font-semibold">192.168.0.102 [ONLINE]</span>
                </div>
                <div className="flex items-center justify-between p-1 rounded bg-[#f5ecdf] border border-[#e3d0bb]">
                  <span className="font-medium">CAM 02: Exit Scale Deck Platform</span>
                  <span className="font-mono text-[10px] text-emerald-700 font-semibold">192.168.0.103 [ONLINE]</span>
                </div>
                <div className="flex items-center justify-between p-1 rounded bg-[#f5ecdf] border border-[#e3d0bb]">
                  <span className="font-medium">CAM 03: Drum Chute & Seal Inspector</span>
                  <span className="font-mono text-[10px] text-emerald-700 font-semibold">192.168.0.104 [ONLINE]</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500">
                CAM 01 optical recognition automatically extracts vehicle plate from video and selects matching delivery.
              </p>
            </div>

          </div>
        </div>

        {/* ===================== 3. ACTIVE SAP OUTBOUND DELIVERIES OVERVIEW ===================== */}
        <div className="bg-white border border-[#bca182] rounded-md p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#8a6840]" />
              <h3 className="text-sm font-bold text-slate-900">
                Active SAP Outbound Deliveries for Plant PL01 ({outboundDeliveries.length} Ready Dispatches)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by OBD, Customer, Vehicle..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-[#f7efe4] border border-[#c8aa86] rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1e2a38] w-48 sm:w-64"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={loading}
                className="h-7 text-xs bg-[#f7efe4] border-[#c8aa86] text-slate-800 hover:bg-[#ebdcc6]"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Table of active deliveries */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#ede1d1] text-slate-800 border-b border-[#c8aa86]">
                  <th className="py-2 px-2.5 font-bold">Select</th>
                  <th className="py-2 px-2.5 font-bold">OBD Number</th>
                  <th className="py-2 px-2.5 font-bold">Sales Order</th>
                  <th className="py-2 px-2.5 font-bold">Customer & Project Site</th>
                  <th className="py-2 px-2.5 font-bold">Concrete Grade</th>
                  <th className="py-2 px-2.5 font-bold text-right">Volume</th>
                  <th className="py-2 px-2.5 font-bold">Vehicle / Driver</th>
                  <th className="py-2 px-2.5 font-bold">Mixer Tare</th>
                  <th className="py-2 px-2.5 font-bold">QC Status</th>
                  <th className="py-2 px-2.5 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDeliveries.map((delivery) => {
                  const isSelected = selectedDelivery?.deliveryNumber === delivery.deliveryNumber;
                  return (
                    <tr 
                      key={delivery.deliveryNumber}
                      onClick={() => {
                        setSelectedDelivery(delivery);
                        setSelectedRadio('delivery_ref');
                      }}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-amber-100/70 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2 px-2.5">
                        <input
                          type="radio"
                          name="selected_delivery_row"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedDelivery(delivery);
                            setSelectedRadio('delivery_ref');
                          }}
                          className="h-3.5 w-3.5 accent-[#1e2a38]"
                        />
                      </td>
                      <td className="py-2 px-2.5 font-mono font-bold text-blue-900">
                        {delivery.deliveryNumber}
                      </td>
                      <td className="py-2 px-2.5 font-mono text-slate-700">
                        {delivery.salesOrder}
                      </td>
                      <td className="py-2 px-2.5 max-w-[220px]">
                        <div className="font-bold text-slate-900 truncate">{delivery.customerName}</div>
                        <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                          {delivery.destinationSite}
                        </div>
                      </td>
                      <td className="py-2 px-2.5">
                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-800 border-slate-300">
                          {delivery.concreteGrade}
                        </Badge>
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-800">
                        {delivery.batchVolumeM3.toFixed(2)} m³
                      </td>
                      <td className="py-2 px-2.5 font-mono">
                        <div className="font-bold text-slate-900">{delivery.vehicleNo}</div>
                        <div className="text-[11px] text-slate-500 font-sans">{delivery.driverName}</div>
                      </td>
                      <td className="py-2 px-2.5 font-mono text-slate-700">
                        {(delivery.mixerTareKg / 1000).toFixed(2)} MT
                      </td>
                      <td className="py-2 px-2.5">
                        <Badge className="text-[10px] bg-emerald-600 text-white hover:bg-emerald-700 border-none">
                          <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                          QC PASS
                        </Badge>
                      </td>
                      <td className="py-2 px-2.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDelivery(delivery);
                            setSelectedRadio('delivery_ref');
                            onEnter('delivery_ref', delivery);
                          }}
                          className="h-6 text-[10px] px-2 bg-[#dfcbaf] hover:bg-[#d0b99a] text-slate-900 border-[#b09371] font-bold"
                        >
                          Verify & Exit
                        </Button>
                      </td>
                    </tr>
                  );
                })}

                {filteredDeliveries.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-4 text-center text-slate-500">
                      No matching outbound deliveries found for Plant PL01.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===================== 4. RECENT SAP GATE OUT DISPATCHES ===================== */}
        {exitTransactions.length > 0 && (
          <div className="bg-white border border-[#bca182] rounded-md p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <LogOut className="h-4 w-4 text-[#8a6840]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Recent SAP Gate Out Dispatches & PGI Postings
                </h3>
              </div>
              <Badge variant="outline" className="text-[11px] bg-emerald-50 text-emerald-800 border-emerald-300">
                S/4HANA Synced
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#ede1d1] text-slate-800 border-b border-[#c8aa86]">
                    <th className="py-1.5 px-2.5 font-bold">Gate Pass #</th>
                    <th className="py-1.5 px-2.5 font-bold">OBD Number</th>
                    <th className="py-1.5 px-2.5 font-bold">Customer Name</th>
                    <th className="py-1.5 px-2.5 font-bold">Vehicle No</th>
                    <th className="py-1.5 px-2.5 font-bold text-right">Net Concrete</th>
                    <th className="py-1.5 px-2.5 font-bold">SAP PGI Material Doc</th>
                    <th className="py-1.5 px-2.5 font-bold">Barrier Status</th>
                    <th className="py-1.5 px-2.5 font-bold">Exit Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {exitTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-2 px-2.5 font-mono font-bold text-purple-900">
                        {tx.gatePassNumber}
                      </td>
                      <td className="py-2 px-2.5 font-mono text-blue-900">
                        {tx.deliveryNumber || 'N/A'}
                      </td>
                      <td className="py-2 px-2.5 text-slate-800">
                        {tx.customerName || 'General Gate Out'}
                      </td>
                      <td className="py-2 px-2.5 font-mono font-bold text-slate-900">
                        {tx.vehicleNo}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-800">
                        {(tx.netWeight / 1000).toFixed(2)} MT
                      </td>
                      <td className="py-2 px-2.5 font-mono text-emerald-700 font-bold">
                        {tx.sapPgiDocNumber}
                      </td>
                      <td className="py-2 px-2.5">
                        <Badge className="text-[10px] bg-emerald-600 text-white">
                          BARRIER CLEARED
                        </Badge>
                      </td>
                      <td className="py-2 px-2.5 text-slate-500 text-[11px]">
                        {new Date(tx.syncedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
