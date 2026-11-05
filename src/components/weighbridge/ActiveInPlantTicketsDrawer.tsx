import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  RefreshCw, 
  Truck, 
  Clock, 
  Scale, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SapActiveTicket } from '@/types/sap';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ActiveInPlantTicketsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTicket: (ticket: SapActiveTicket) => void;
}

export function ActiveInPlantTicketsDrawer({
  isOpen,
  onClose,
  onSelectTicket
}: ActiveInPlantTicketsDrawerProps) {
  const [tickets, setTickets] = useState<SapActiveTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState('');

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await api.getActiveWeighbridgeTickets();
      if (res && res.success && Array.isArray(res.tickets)) {
        setTickets(res.tickets);
      }
    } catch (err: any) {
      console.warn('Failed to load active in-plant tickets:', err);
      toast.error('Unable to fetch in-plant vehicles: ' + (err.message || 'Server error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTickets();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredTickets = tickets.filter(t => 
    t.ticketNumber.toLowerCase().includes(filterText.toLowerCase()) ||
    t.vehicleNumber.toLowerCase().includes(filterText.toLowerCase()) ||
    (t.materialName && t.materialName.toLowerCase().includes(filterText.toLowerCase())) ||
    (t.vendorName && t.vendorName.toLowerCase().includes(filterText.toLowerCase())) ||
    (t.poNumber && t.poNumber.includes(filterText))
  );

  const getScenarioBadge = (scenario: string) => {
    switch (scenario) {
      case 'with_po':
        return <Badge className="bg-blue-100 text-blue-900 border-blue-300 font-mono text-[10px]">With PO (101)</Badge>;
      case 'without_po':
        return <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-mono text-[10px]">Without PO (501)</Badge>;
      case 'others':
        return <Badge className="bg-purple-100 text-purple-900 border-purple-300 font-mono text-[10px]">Others (Outward)</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{scenario}</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex justify-end">
      <div 
        className="w-full max-w-lg bg-[#f4ece1] text-slate-900 h-full shadow-2xl flex flex-col border-l-2 border-[#b09371] animate-in slide-in-from-right duration-200"
        style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="bg-[#e8cca8] border-b-2 border-[#b09371] p-4 flex items-center justify-between text-slate-900 shadow-sm">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-[#1e2a38]" />
            <div>
              <h2 className="text-base font-bold text-[#1e2a38]">
                Vehicles Inside Plant (Gate-In Complete)
              </h2>
              <p className="text-xs text-slate-700">
                Awaiting unloading/loading and Gate-Out second weighment
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 rounded text-slate-700 hover:text-black hover:bg-[#dfcbaf] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Stats Bar */}
        <div className="p-3 bg-[#ede1d1] border-b border-[#c8aa86] flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-500 absolute left-2.5 top-2" />
            <input 
              type="text"
              placeholder="Search by ticket #, vehicle, vendor, PO..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-white border border-[#bca182] text-xs rounded-xs placeholder:text-slate-400"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={loadTickets}
            disabled={loading}
            className="h-8 text-xs bg-[#dfcbaf] hover:bg-[#d0b99a] text-slate-900 border-[#a88a65] font-bold"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Vehicle Counter Ribbon */}
        <div className="px-4 py-2 bg-[#dfcbaf] border-b border-[#c8aa86] flex items-center justify-between text-xs font-semibold text-slate-800">
          <span>Active In-Plant Count: <strong>{tickets.length}</strong></span>
          <span className="text-[11px] text-slate-600">Showing {filteredTickets.length} matching</span>
        </div>

        {/* Tickets List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && tickets.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#8a6840]" />
              Querying active weighbridge sessions from SAP...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs bg-white/60 rounded border border-[#c8aa86] p-6">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
              <div className="font-bold text-slate-800 text-sm">No Vehicles Awaiting Gate-Out</div>
              <p className="mt-1 text-slate-600">
                {filterText ? 'No records match your filter query.' : 'All inbound and outward vehicles have completed their weighbridge cycle.'}
              </p>
            </div>
          ) : (
            filteredTickets.map((t) => (
              <div 
                key={t.ticketNumber}
                onClick={() => {
                  onSelectTicket(t);
                  onClose();
                }}
                className="bg-white border-2 border-[#c8aa86] hover:border-[#1e2a38] rounded p-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer group space-y-2.5"
              >
                {/* Top Row: Ticket Number & Scenario */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-[#1e2a38] group-hover:text-blue-900">
                      {t.ticketNumber}
                    </span>
                    {getScenarioBadge(t.scenario)}
                  </div>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {t.gateInTime ? new Date(t.gateInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                  </span>
                </div>

                {/* Vehicle & Material Row */}
                <div className="flex items-baseline justify-between border-t border-slate-100 pt-2">
                  <div>
                    <span className="font-mono font-bold text-base text-slate-950">
                      {t.vehicleNumber}
                    </span>
                    <div className="text-xs text-slate-700 font-medium">
                      {t.materialName || 'Material Inbound'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">
                      First Wt ({t.firstWeightType})
                    </span>
                    <span className="font-mono font-black text-sm text-slate-900">
                      {Number(t.firstWeight).toLocaleString()} KG
                    </span>
                  </div>
                </div>

                {/* Vendor / Transporter / PO Row */}
                <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1 bg-slate-50 p-2 rounded border border-slate-200">
                  {t.poNumber && (
                    <span>PO: <strong className="text-blue-900 font-mono">{t.poNumber}</strong></span>
                  )}
                  {t.vendorName && (
                    <span>Vendor: <strong className="text-slate-800">{t.vendorName}</strong></span>
                  )}
                  {t.transporter && (
                    <span>Transporter: <strong className="text-slate-800">{t.transporter}</strong></span>
                  )}
                  {t.challanNo && (
                    <span>Challan: <strong className="text-slate-800">{t.challanNo}</strong></span>
                  )}
                </div>

                {/* Bottom Action Hint */}
                <div className="flex items-center justify-between text-xs text-blue-900 font-bold group-hover:translate-x-0.5 transition-transform">
                  <span>Select for Gate-Out Second Weighment</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#ede1d1] border-t border-[#c8aa86] flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            className="h-8 text-xs bg-[#dfcbaf] border-[#a88a65] text-slate-900 font-semibold"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

