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
  Maximize2,
  Ticket,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WeightReading } from '@/types/weighbridge';
import { SapPurchaseOrder, SapWeighbridgeTransaction, SapActiveTicket } from '@/types/sap';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { SapConnectionManagerModal } from '../sap/SapConnectionManagerModal';
import { ActiveInPlantTicketsDrawer } from './ActiveInPlantTicketsDrawer';

interface SapGateToWeighbridgeScreenProps {
  onEnter: (
    option: 'po_ref' | 'without_po' | 'others', 
    selectedPo?: SapPurchaseOrder,
    mode?: 'gate_in' | 'gate_out',
    ticketNumber?: string
  ) => void;
  onSwitchToBayConsole?: () => void;
  currentWeight: WeightReading;
  activeSapPo?: string | null;
  activeSapDoc?: string | null;
}

export function SapGateToWeighbridgeScreen({
  onEnter,
  onSwitchToBayConsole,
  currentWeight,
  activeSapPo,
  activeSapDoc,
}: SapGateToWeighbridgeScreenProps) {
  const [activeTab, setActiveTab] = useState<'gate_in' | 'gate_out'>('gate_in');
  const [selectedRadio, setSelectedRadio] = useState<'po_ref' | 'without_po' | 'others'>('po_ref');
  const [purchaseOrders, setPurchaseOrders] = useState<SapPurchaseOrder[]>([]);
  const [transactions, setTransactions] = useState<SapWeighbridgeTransaction[]>([]);
  const [activeTickets, setActiveTickets] = useState<SapActiveTicket[]>([]);
  const [selectedPo, setSelectedPo] = useState<SapPurchaseOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [poFilter, setPoFilter] = useState('');
  const [sapModalOpen, setSapModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [gateOutTicketInput, setGateOutTicketInput] = useState('');
  const [timeStr, setTimeStr] = useState<string>(new Date().toLocaleTimeString());

  // User Auth & RFC Verification State
  const { user } = useAuth();
  const [verifyingPo, setVerifyingPo] = useState<string | null>(null);
  const [verifiedPoMap, setVerifiedPoMap] = useState<Record<string, any>>({});

  const handleVerifyPoRfc = async (poNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVerifyingPo(poNumber);
    try {
      const res = await api.checkSapPoViaRfc({
        poNumber,
        userData: {
          userId: user?.id,
          username: user?.username,
          name: user?.name,
          roleId: user?.roleId,
          shift: user?.shift
        }
      });
      if (res.success && res.item) {
        setVerifiedPoMap(prev => ({
          ...prev,
          [poNumber]: {
            pendingQty: res.item?.pendingQty,
            unit: res.item?.unit,
            latencyMs: res.rfcTelemetry?.latencyMs || 12
          }
        }));
        toast.success(`SAP RFC Verified: PO #${poNumber}`, {
          description: `Open Balance: ${res.item?.pendingQty} ${res.item?.unit} • Operator: ${user?.name || 'Ramesh'}`
        });
      }
    } catch (err: any) {
      toast.error(`RFC Check failed: ${err.message}`);
    } finally {
      setVerifyingPo(null);
    }
  };

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setTimeStr(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch SAP Purchase Orders, active tickets, and recent sync transactions
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pos, txs, act] = await Promise.allSettled([
        api.getSapPurchaseOrders({ status: 'open' }),
        api.getSapTransactions({ limit: 10 }),
        api.getActiveWeighbridgeTickets(),
      ]);

      if (pos.status === 'fulfilled' && Array.isArray(pos.value)) {
        setPurchaseOrders(pos.value);
        if (pos.value.length > 0 && !selectedPo) {
          setSelectedPo(pos.value[0]);
        }
      }

      if (txs.status === 'fulfilled' && Array.isArray(txs.value)) {
        setTransactions(txs.value);
      }

      if (act.status === 'fulfilled' && act.value && Array.isArray(act.value.tickets)) {
        setActiveTickets(act.value.tickets);
      }
    } catch (err) {
      console.warn('Failed to load SAP data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterClick = () => {
    if (activeTab === 'gate_in') {
      onEnter(selectedRadio, selectedRadio === 'po_ref' && selectedPo ? selectedPo : undefined, 'gate_in');
    } else {
      if (!gateOutTicketInput.trim()) {
        toast.error('Please enter a Ticket Number or select a vehicle from the active in-plant list below');
        return;
      }
      onEnter('po_ref', undefined, 'gate_out', gateOutTicketInput.trim().toUpperCase());
    }
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
  }, [activeTab, selectedRadio, selectedPo, gateOutTicketInput]);

  const filteredPos = purchaseOrders.filter(
    (p) =>
      p.poNumber.includes(poFilter) ||
      p.vendorName.toLowerCase().includes(poFilter.toLowerCase()) ||
      p.materialName.toLowerCase().includes(poFilter.toLowerCase())
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
                SAP ERP Gate-to-Weighbridge Integration
              </h1>
              <Badge variant="outline" className="bg-[#dfcbaf] text-[#1e2a38] border-[#a88a65] font-mono text-xs">
                Plant PL01
              </Badge>
              <Badge variant="outline" className="bg-[#dfcbaf] text-[#1e2a38] border-[#a88a65] font-mono text-xs hidden sm:inline-flex">
                S/4HANA 2023
              </Badge>
              <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#dfcbaf] border border-[#a88a65] text-xs text-slate-800">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                <span className="font-semibold">Operator: {user?.name || 'Ramesh Kulkarni'}</span>
                <span className="text-[10px] text-slate-600 font-mono">({user?.id || 'USR-003'})</span>
                <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-800 border-emerald-400 font-bold uppercase">
                  RFC ACTIVE
                </Badge>
              </div>
            </div>
            <p className="text-xs text-slate-700">
              Dual-Stage Weighment: Gate-In First Weight, Token Pass Issue, Gate-Out Second Weight & SAP MIGO/PGI
            </p>
          </div>
        </div>

        {/* Right Header Navigation & Active In-Plant Badge */}
        <div className="flex items-center gap-2 mt-2 sm:mt-0 flex-wrap">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1.5 text-xs bg-blue-100 hover:bg-blue-200 active:bg-blue-300 px-3 py-1.5 rounded border border-blue-400 cursor-pointer shadow-xs transition-all font-bold text-blue-950"
            title="View vehicles inside plant awaiting Gate-Out"
          >
            <Truck className="h-3.5 w-3.5 text-blue-800" />
            <span>In-Plant Awaiting Gate-Out: {activeTickets.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setSapModalOpen(true)}
            className="flex items-center gap-1.5 text-xs bg-[#dfcbaf] hover:bg-[#d0b99a] active:bg-[#c2aa8a] px-3 py-1.5 rounded border border-[#bda282] cursor-pointer shadow-xs transition-all"
            title="Click to open SAP S/4HANA Connection Manager & Live Handshake"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-semibold text-slate-800">PRD_S4H: Active (16ms)</span>
          </button>
        </div>
      </div>

      {/* ===================== 2. MAIN SAP TRANSACTION SELECTION FRAME ===================== */}
      <div className="bg-[#f2e6d6] border-2 border-t-0 border-[#b09371] p-5 sm:p-7 shadow-lg text-slate-900 rounded-b-md space-y-6">
        
        {/* Tan Ribbon Bar with Mode Switcher */}
        <div className="bg-gradient-to-r from-[#dfcbaf] via-[#ebddc5] to-[#dfcbaf] border border-[#c8aa86] px-4 py-2 rounded flex flex-wrap items-center justify-between text-xs font-bold text-slate-800 shadow-inner gap-2">
          <div className="flex items-center gap-3">
            <span className="uppercase tracking-wider text-[#6d5130] flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[#8a6840]" />
              Weighbridge Transaction Phase:
            </span>

            {/* TAB TOGGLE: GATE IN VS GATE OUT */}
            <div className="inline-flex rounded border border-[#a88a65] bg-[#dfcbaf] p-0.5 text-xs font-bold shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab('gate_in')}
                className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  activeTab === 'gate_in'
                    ? 'bg-[#1e2a38] text-amber-300 shadow-sm'
                    : 'text-slate-800 hover:text-black'
                }`}
              >
                <Truck className="h-3.5 w-3.5" />
                <span>1. GATE IN (First Weighment & Token)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('gate_out')}
                className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  activeTab === 'gate_out'
                    ? 'bg-[#1e2a38] text-amber-300 shadow-sm'
                    : 'text-slate-800 hover:text-black'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>2. GATE OUT (Second Weighment & MIGO)</span>
              </button>
            </div>
          </div>

          <span className="font-mono text-[11px] text-slate-600">
            {activeTab === 'gate_in' ? 'T-Code: ZWB_GATEIN' : 'T-Code: ZWB_GATEOUT'} • Client 100
          </span>
        </div>

        {/* ===================== INNER PANEL ===================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT 7 COLS: BASED ON ACTIVE TAB */}
          <div className="lg:col-span-7 bg-[#eddcc6]/80 border-2 border-[#bca182] rounded-md p-5 sm:p-6 shadow-sm space-y-5">
            
            {activeTab === 'gate_in' ? (
              <>
                <div className="border-b border-[#c8aa86] pb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Choose Inbound Weighment Mode:
                  </span>
                  <span className="text-[11px] text-slate-600 italic">Select scenario to proceed to Gate In</span>
                </div>

                {/* Option 1: PO ref */}
                <div 
                  onClick={() => setSelectedRadio('po_ref')}
                  className={`p-3.5 rounded border-2 transition-all cursor-pointer select-none ${
                    selectedRadio === 'po_ref'
                      ? 'bg-white border-[#1e2a38] shadow-md ring-1 ring-[#1e2a38]'
                      : 'bg-[#f7efe4] border-[#c8aa86] hover:bg-white hover:border-[#a88a65]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="sap_flow_choice"
                      checked={selectedRadio === 'po_ref'}
                      onChange={() => setSelectedRadio('po_ref')}
                      className="h-4 w-4 mt-0.5 accent-[#1e2a38] cursor-pointer"
                    />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="text-base font-bold text-slate-900">1. With PO (Purchase Order)</span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300 font-mono text-[10px]">
                          Movement Type 101 (MIGO)
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-700">
                        Inbound Material Receipt against SAP Purchase Order (First Wt: <strong>GROSS</strong>)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        UltraTech Cement, JSW Slag Cement, RoboSand, Micro-Silica, Fly Ash. Fetches PO, vendor, and material details from SAP; captures Gross weight; saves and generates a unique Ticket Number.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Option 2: Without PO */}
                <div 
                  onClick={() => setSelectedRadio('without_po')}
                  className={`p-3.5 rounded border-2 transition-all cursor-pointer select-none ${
                    selectedRadio === 'without_po'
                      ? 'bg-white border-[#1e2a38] shadow-md ring-1 ring-[#1e2a38]'
                      : 'bg-[#f7efe4] border-[#c8aa86] hover:bg-white hover:border-[#a88a65]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="sap_flow_choice"
                      checked={selectedRadio === 'without_po'}
                      onChange={() => setSelectedRadio('without_po')}
                      className="h-4 w-4 mt-0.5 accent-[#1e2a38] cursor-pointer"
                    />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="text-base font-bold text-slate-900">2. Without PO (Spot Inbound)</span>
                        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-mono text-[10px]">
                          Movement Type 501 (Spot Receipt)
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-700">
                        Inbound Material Receipt without PO (First Wt: <strong>GROSS</strong>)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Direct quarry stone aggregates (10mm/20mm), river sand. Plant details fetched from SAP; operator enters material, vendor, challan details; saves and generates unique Ticket Number.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Option 3: Others */}
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
                      name="sap_flow_choice"
                      checked={selectedRadio === 'others'}
                      onChange={() => setSelectedRadio('others')}
                      className="h-4 w-4 mt-0.5 accent-[#1e2a38] cursor-pointer"
                    />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="text-base font-bold text-slate-900">3. Others (Sales / Outward Dispatch)</span>
                        <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-300 font-mono text-[10px]">
                          Movement Type 601 (PGI)
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-700">
                        Vehicle enters <strong>EMPTY</strong> and leaves after loading material (First Wt: <strong>TARE</strong>)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Outbound steel scrap sale, transit mixer empty tare verification, sediment disposal. Gate In captures initial Tare Weight; vehicle is loaded; Gate Out captures Gross Weight and calculates Net Weight.
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
                      <span>Enter Gate In Console</span>
                      <ChevronRight className="h-4 w-4 text-slate-700 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-700">
                    <span className="font-semibold">Next Screen: </span>
                    <span className="font-bold text-[#1e2a38]">Inbound Weigh Bridge — Gate In (First Weighment)</span>
                  </div>
                </div>
              </>
            ) : (
              /* GATE OUT MODE SCREEN */
              <div className="space-y-4">
                <div className="border-b border-[#c8aa86] pb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Gate Out: Second Weighment & SAP Document Generation
                  </span>
                  <span className="text-[11px] text-slate-600 font-mono">
                    {activeTickets.length} Vehicles Currently in Plant
                  </span>
                </div>

                {/* Direct Ticket / Plate Search */}
                <div className="bg-white p-4 rounded border border-[#bca182] space-y-2">
                  <label className="text-xs font-bold text-slate-800 block">
                    Enter Ticket Number or Vehicle Number from Gate Entry Pass:
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="e.g. TK-20261029-6026 or TS09UB5678"
                        value={gateOutTicketInput}
                        onChange={(e) => setGateOutTicketInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEnterClick();
                        }}
                        className="w-full h-9 px-3 bg-slate-50 border-2 border-[#bca182] font-mono text-xs font-bold uppercase rounded-xs"
                      />
                    </div>
                    <Button
                      onClick={handleEnterClick}
                      className="h-9 px-4 bg-[#1e2a38] text-amber-300 hover:bg-slate-800 font-bold text-xs gap-1.5 shadow-sm"
                    >
                      <span>Proceed to Gate Out</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Active In-Plant Vehicles Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Or Select an In-Plant Vehicle for Gate-Out:</span>
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(true)}
                      className="text-blue-900 hover:underline font-bold"
                    >
                      View All ({activeTickets.length})
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {activeTickets.length === 0 ? (
                      <div className="p-4 bg-white/70 rounded text-center text-xs text-slate-500 border border-[#c8aa86]">
                        No vehicles currently in plant awaiting Gate-Out.
                      </div>
                    ) : (
                      activeTickets.slice(0, 4).map((t) => (
                        <div
                          key={t.ticketNumber}
                          onClick={() => onEnter('po_ref', undefined, 'gate_out', t.ticketNumber)}
                          className="bg-white p-3 rounded border border-[#c8aa86] hover:border-[#1e2a38] hover:shadow-xs transition-all cursor-pointer flex items-center justify-between text-xs group"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-blue-950">{t.ticketNumber}</span>
                              <Badge className="bg-slate-100 text-slate-800 text-[10px] uppercase font-bold">
                                {t.scenario.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="text-slate-600 mt-0.5">
                              Plate: <strong className="font-mono text-slate-900">{t.vehicleNumber}</strong> • {t.materialName || 'Material'}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block uppercase font-bold">First Wt</span>
                            <span className="font-mono font-bold text-slate-900">{Number(t.firstWeight).toLocaleString()} KG</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT 5 COLS: LIVE SCALE TELEMETRY & BAY STATUS */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Live Scale Platform Telemetry Widget */}
            <div className="bg-[#1e293b] text-white rounded-md p-4 border border-[#334155] shadow-md space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-slate-700 pb-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-emerald-400" />
                  Live Platform Scale Reading
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
                  {currentWeight.weight.toLocaleString()} KG • Capacity: 60,000 KG
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50">
                  <span className="text-slate-400">Scale Deck:</span>
                  <div className="font-semibold text-white">Bay 01 Inbound/Outbound</div>
                </div>
                <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50">
                  <span className="text-slate-400">Zero Balance:</span>
                  <div className="font-semibold text-emerald-400">Calibrated ±0 KG</div>
                </div>
              </div>
            </div>

            {/* Weighbridge Bay Status & Scale Console Access */}
            <div className="bg-white/95 border border-[#bca182] rounded-md p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-[#1e2a38]" />
                  Bay 01 Inbound Scale Status
                </span>
                <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-400 bg-emerald-50 font-mono font-bold">
                  ● SCALE OPERATIONAL
                </Badge>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Plant / Location:</span>
                  <span className="font-semibold text-slate-900">PL01 — Ready Mix Concrete</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Gross Capacity:</span>
                  <span className="font-semibold text-slate-900">60.00 MT (Electronic Pitless)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">SAP RFC Integration:</span>
                  <span className="font-semibold text-emerald-600">Active (MIGO 101/501, PGI 601)</span>
                </div>
              </div>

              {onSwitchToBayConsole && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onSwitchToBayConsole}
                  className="w-full h-8 text-xs bg-[#1e2a38] text-amber-300 hover:bg-slate-800 border-[#1e2a38] font-bold gap-2 shadow-xs cursor-pointer"
                >
                  <Scale className="h-3.5 w-3.5 text-amber-400" />
                  <span>Manual Scale Deck & Weigh Slips Console</span>
                </Button>
              )}
            </div>

          </div>
        </div>

        {/* ===================== 3. ACTIVE SAP PURCHASE ORDERS OVERVIEW (WHEN IN GATE IN) ===================== */}
        {activeTab === 'gate_in' && (
          <div className="bg-white border border-[#bca182] rounded-md p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#8a6840]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Active SAP Purchase Orders for Plant PL01 ({purchaseOrders.length} Open POs)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-56">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2 top-2" />
                  <input
                    type="text"
                    placeholder="Filter PO #, vendor..."
                    value={poFilter}
                    onChange={(e) => setPoFilter(e.target.value)}
                    className="h-7 w-full pl-7 pr-2 bg-slate-50 border border-slate-300 rounded text-xs"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadData}
                  className="h-7 px-2 text-xs text-slate-700 hover:text-black"
                  title="Refresh SAP POs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Table of Open POs */}
            <div className="overflow-x-auto max-h-56">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#ede1d1] text-slate-800 font-bold border-b border-[#c8aa86] sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Select</th>
                    <th className="py-2 px-3">PO Number</th>
                    <th className="py-2 px-3">Vendor / Supplier</th>
                    <th className="py-2 px-3">Material Description</th>
                    <th className="py-2 px-3">Pending Qty</th>
                    <th className="py-2 px-3">Assigned Truck</th>
                    <th className="py-2 px-3">Location</th>
                    <th className="py-2 px-3 text-right">RFC Verify</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPos.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-slate-500">
                        No matching open Purchase Orders found.
                      </td>
                    </tr>
                  ) : (
                    filteredPos.map((po) => {
                      const isSelected = selectedPo?.poNumber === po.poNumber;
                      return (
                        <tr 
                          key={po.poNumber}
                          onClick={() => {
                            setSelectedPo(po);
                            setSelectedRadio('po_ref');
                          }}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-amber-100/70 font-semibold' : 'hover:bg-amber-50/50'
                          }`}
                        >
                          <td className="py-2 px-3">
                            <input 
                              type="radio" 
                              name="selected_po_table" 
                              checked={isSelected}
                              onChange={() => {
                                setSelectedPo(po);
                                setSelectedRadio('po_ref');
                              }}
                              className="h-3.5 w-3.5 accent-[#1e2a38]"
                            />
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-blue-900">
                            #{po.poNumber}
                          </td>
                          <td className="py-2 px-3 text-slate-900">{po.vendorName}</td>
                          <td className="py-2 px-3 text-slate-700">{po.materialName}</td>
                          <td className="py-2 px-3 font-mono font-medium">
                            {po.pendingQty} {po.unit || 'MT'}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-800">
                            {po.defaultVehicle || 'Unassigned'}
                          </td>
                          <td className="py-2 px-3">
                            <Badge variant="outline" className="text-[10px] font-mono border-slate-300">
                              {po.storageLocation || 'SILO-01'}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 text-right">
                            {verifiedPoMap[po.poNumber] ? (
                              <Badge className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-400 font-mono font-bold">
                                ✓ {verifiedPoMap[po.poNumber].pendingQty} MT ({verifiedPoMap[po.poNumber].latencyMs}ms)
                              </Badge>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => handleVerifyPoRfc(po.poNumber, e)}
                                disabled={verifyingPo === po.poNumber}
                                className="px-2 py-0.5 bg-[#dfcbaf] hover:bg-[#d0b99a] active:bg-[#c2aa8a] border border-[#a88a65] rounded text-[10px] font-bold text-slate-900 shadow-2xs inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Query SAP PO via RFC BAPI_PO_GETDETAIL1"
                              >
                                <RefreshCw className={`h-2.5 w-2.5 text-blue-800 ${verifyingPo === po.poNumber ? 'animate-spin' : ''}`} />
                                <span>Check RFC</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Selecting a PO automatically highlights "With PO" and passes all details into Gate In screen</span>
              <span>Click Enter button above to proceed</span>
            </div>
          </div>
        )}

        {/* ===================== 4. RECENT SAP WEIGHBRIDGE TRANSACTIONS ===================== */}
        {transactions.length > 0 && (
          <div className="bg-white/80 border border-[#bca182] rounded-md p-4 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Recent SAP Weighbridge Synchronization Log (RMC App ➔ S/4HANA MIGO)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {transactions.length} Recorded Posts
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {transactions.slice(0, 6).map((tx) => (
                <div 
                  key={tx.id} 
                  className="p-2.5 rounded border border-slate-200 bg-slate-50/70 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-emerald-800">
                      Doc #{tx.sapDocNumber}
                    </span>
                    <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-300">
                      {tx.movementType ? `Mvt ${tx.movementType}` : '101 OK'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span className="font-mono">{tx.vehicleNo || (tx as any).vehicleRegNo}</span>
                    <span>Net: {(tx.netWeight / 1000).toFixed(2)} MT</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {tx.vendorName || tx.materialName || 'Direct Delivery'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Drawer for Active In-Plant Vehicles */}
      <ActiveInPlantTicketsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSelectTicket={(ticket) => {
          onEnter('po_ref', undefined, 'gate_out', ticket.ticketNumber);
        }}
      />

      {/* SAP S/4HANA Production Connection & Sync Queue Modal */}
      <SapConnectionManagerModal 
        isOpen={sapModalOpen} 
        onClose={() => setSapModalOpen(false)} 
      />
    </div>
  );
}
