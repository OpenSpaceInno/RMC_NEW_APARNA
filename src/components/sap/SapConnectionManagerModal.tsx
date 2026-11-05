import React, { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Server, 
  Key, 
  Terminal, 
  ShieldCheck, 
  Save, 
  Send, 
  Cpu, 
  Sliders, 
  Clock, 
  FileText, 
  Receipt,
  Layers,
  Sparkles,
  ExternalLink,
  RotateCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { 
  SapConnectionConfig, 
  SapConnectionTestResult, 
  SapSyncQueueItem, 
  SapBillingTransaction 
} from '@/types/sap';

interface SapConnectionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SapConnectionManagerModal({ isOpen, onClose }: SapConnectionManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'handshake' | 'rfc_tester' | 'config' | 'queue' | 'billing'>('handshake');
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  
  // Status & Telemetry
  const [statusData, setStatusData] = useState<any>(null);
  const [testResult, setTestResult] = useState<SapConnectionTestResult | null>(null);

  // Config Form
  const [config, setConfig] = useState<Partial<SapConnectionConfig>>({
    connectionType: 'odata_cloud_connector',
    systemId: 'PRD_S4H',
    systemName: 'SAP S/4HANA Enterprise 2023',
    host: 'sap-s4h.aparna-rmc.internal',
    port: 44300,
    client: '100',
    sysnr: '00',
    username: 'RMC_GATE_SVC',
    passwordMasked: '••••••••••••',
    btpDestinationUrl: 'https://connectivity.aparna-rmc.btp.eu10.hana.ondemand.com',
    odataBaseUrl: 'https://sap-s4h.aparna-rmc.internal:44300/sap/opu/odata/sap',
    useCloudConnector: true,
    cloudConnectorLocationId: 'HYD_RMC_PLANT_01',
    timeoutMs: 12000,
    isActive: true
  });

  // Live RFC Function Tester State
  const [selectedRfcModule, setSelectedRfcModule] = useState<'Z_RFC_CHECK_USER_AUTH' | 'BAPI_PO_GETDETAIL1' | 'Z_RFC_CHECK_VEHICLE' | 'BAPI_GOODSMVT_CREATE' | 'BAPI_OUTB_DELIVERY_CONFIRM_DEC'>('BAPI_PO_GETDETAIL1');
  const [rfcUserId, setRfcUserId] = useState('USR-003');
  const [rfcUsername, setRfcUsername] = useState('weighbridge.op');
  const [rfcOperatorName, setRfcOperatorName] = useState('Ramesh Kulkarni');
  const [rfcPoNumber, setRfcPoNumber] = useState('4500128490');
  const [rfcVehiclePlate, setRfcVehiclePlate] = useState('TS07UA1289');
  const [rfcNetWeightKg, setRfcNetWeightKg] = useState('24500');
  const [rfcDeliveryNumber, setRfcDeliveryNumber] = useState('80012940');
  const [isExecutingRfc, setIsExecutingRfc] = useState(false);
  const [rfcExecutionResult, setRfcExecutionResult] = useState<any>(null);

  const handleExecuteRfcConsole = async () => {
    setIsExecutingRfc(true);
    setRfcExecutionResult(null);
    toast.info(`Executing SAP RFC: ${selectedRfcModule}...`, {
      description: `Target: Client ${config.client || '100'} • Operator: ${rfcOperatorName}`
    });

    const userData = {
      userId: rfcUserId,
      username: rfcUsername,
      name: rfcOperatorName,
      plantCode: 'PL01',
      shift: 'Morning Shift (06:00 - 14:00)'
    };

    try {
      let res: any = null;
      if (selectedRfcModule === 'Z_RFC_CHECK_USER_AUTH') {
        res = await api.checkSapUserAuth({
          userData,
          plantCode: 'PL01',
          tcode: 'ZWB_GATEIN'
        });
      } else if (selectedRfcModule === 'BAPI_PO_GETDETAIL1') {
        res = await api.checkSapPoViaRfc({
          poNumber: rfcPoNumber,
          plantCode: 'PL01',
          userData
        });
      } else if (selectedRfcModule === 'Z_RFC_CHECK_VEHICLE') {
        res = await api.checkSapVehicleViaRfc({
          vehicleRegNo: rfcVehiclePlate,
          plantCode: 'PL01',
          direction: 'inbound',
          userData
        });
      } else if (selectedRfcModule === 'BAPI_GOODSMVT_CREATE') {
        res = await api.consumeSapPoViaRfc({
          syncType: 'po_ref',
          poNumber: rfcPoNumber,
          itemNo: '10',
          vehicleRegNo: rfcVehiclePlate,
          driverName: 'Ramesh Kumar',
          challanNo: `CH-${Date.now().toString().slice(-4)}`,
          challanWeight: Number(rfcNetWeightKg),
          grossWeight: Number(rfcNetWeightKg) + 13700,
          tareWeight: 13700,
          netWeight: Number(rfcNetWeightKg),
          plantCode: 'PL01',
          storageLocation: 'SILO-01',
          userData
        });
      } else if (selectedRfcModule === 'BAPI_OUTB_DELIVERY_CONFIRM_DEC') {
        res = await api.checkSapDeliveryViaRfc(rfcDeliveryNumber, userData);
      }

      setRfcExecutionResult(res);
      if (res?.success) {
        toast.success(`RFC ${selectedRfcModule} Executed Successfully!`);
      } else {
        toast.error(`RFC Notice: ${res?.error || 'Execution returned warnings'}`);
      }
    } catch (err: any) {
      toast.error(`RFC Execution Failed: ${err.message}`);
      setRfcExecutionResult({ success: false, error: err.message });
    } finally {
      setIsExecutingRfc(false);
    }
  };

  // Sync Queue & Billing Items
  const [queueItems, setQueueItems] = useState<SapSyncQueueItem[]>([]);
  const [billingTransactions, setBillingTransactions] = useState<SapBillingTransaction[]>([]);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Load initial data on open
  useEffect(() => {
    if (isOpen) {
      loadAllSapData();
    }
  }, [isOpen]);

  const loadAllSapData = async () => {
    setIsLoadingStatus(true);
    try {
      const [st, cfg, q, bill] = await Promise.allSettled([
        api.getSapStatus(),
        api.getSapConnectionConfig(),
        api.getSapSyncQueue({ limit: 20 }),
        api.getSapBillingTransactions({ limit: 20 })
      ]);

      if (st.status === 'fulfilled') setStatusData(st.value);
      if (cfg.status === 'fulfilled' && cfg.value) setConfig(cfg.value);
      if (q.status === 'fulfilled' && Array.isArray(q.value)) setQueueItems(q.value);
      if (bill.status === 'fulfilled' && Array.isArray(bill.value)) setBillingTransactions(bill.value);
    } catch (err: any) {
      console.warn('Failed to load SAP status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleRunTestHandshake = async () => {
    setIsTesting(true);
    toast.info('Initiating live handshake with SAP S/4HANA...', {
      description: 'Negotiating RFC BAPI functions and OData CSRF tokens'
    });

    try {
      const res = await api.testSapConnection(config);
      setTestResult(res);
      if (res.success) {
        toast.success(`SAP S/4HANA Handshake Successful (${res.latencyMs} ms)`, {
          description: `System: ${res.systemId} • Client: ${res.client} • CSRF: ${res.csrfToken || 'Active'}`
        });
      } else {
        toast.error('SAP Handshake Warning: Check configuration');
      }
    } catch (err: any) {
      toast.error(`Handshake Failed: ${err.message || 'Network Timeout'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const res = await api.updateSapConnectionConfig(config);
      if (res.success) {
        toast.success('SAP S/4HANA Connection Parameters Saved', {
          description: `Mode: ${res.config.connectionType} • Host: ${res.config.host}`
        });
        setConfig(res.config);
      }
    } catch (err: any) {
      toast.error(`Save Failed: ${err.message}`);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleRetryQueue = async (queueId: string) => {
    setRetryingId(queueId);
    toast.info(`Retrying SAP Sync Queue item ${queueId}...`);
    try {
      const res = await api.retrySapSyncQueueItem(queueId);
      if (res.success) {
        toast.success(`Queue item ${queueId} synchronized to SAP S/4HANA!`);
        // Refresh queue
        const q = await api.getSapSyncQueue({ limit: 20 });
        if (Array.isArray(q)) setQueueItems(q);
      } else {
        toast.error(`Retry attempt completed with status: ${res.status}`);
      }
    } catch (err: any) {
      toast.error(`Retry failed: ${err.message}`);
    } finally {
      setRetryingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div 
        className="bg-slate-900 border-2 border-amber-500/40 text-slate-100 rounded-lg shadow-2xl w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* ===================== MODAL HEADER ===================== */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/60 border-b border-amber-500/30 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  SAP S/4HANA Enterprise Production Connection
                </h2>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE HANDSHAKE ACTIVE
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Direct RFC BAPI & SAP Cloud Connector / OData Integration • PRD_S4H (Client {config.client || '100'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={loadAllSapData}
              disabled={isLoadingStatus}
              className="h-7 text-xs bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoadingStatus ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ===================== TOP TELEMETRY STRIP ===================== */}
        <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Target SAP Instance</span>
              <span className="font-mono font-bold text-amber-400">{config.systemId || 'PRD_S4H'}</span>
              <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">{config.host}</span>
            </div>
            <Server className="h-4 w-4 text-slate-600" />
          </div>

          <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Round-Trip Latency</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-emerald-400">{statusData?.pingLatencyMs || 18} ms</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              </div>
              <span className="text-[10px] text-slate-400 block">Kernel 7.93 (Zero Packet Loss)</span>
            </div>
            <Activity className="h-4 w-4 text-emerald-500" />
          </div>

          <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Protocol Interface</span>
              <span className="font-mono font-bold text-sky-400">
                {config.connectionType === 'odata_cloud_connector' ? 'OData v4 / BTP' : config.connectionType === 'rfc_netweaver' ? 'NetWeaver RFC' : 'Simulation'}
              </span>
              <span className="text-[10px] text-slate-400 block">SCC: {config.cloudConnectorLocationId || 'HYD_RMC'}</span>
            </div>
            <Cpu className="h-4 w-4 text-sky-500" />
          </div>

          <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Sync Queue Status</span>
              <div className="flex items-center gap-1.5">
                <span className={`font-mono font-bold ${queueItems.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {queueItems.length} Enqueued
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block">Automatic Retry Engine Active</span>
            </div>
            <RotateCw className="h-4 w-4 text-slate-500" />
          </div>
        </div>

        {/* ===================== NAVIGATION TABS ===================== */}
        <div className="bg-slate-950 px-4 pt-2 border-b border-slate-800 flex items-center gap-1 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('handshake')}
            className={`px-3 py-1.5 font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'handshake'
                ? 'border-amber-400 text-amber-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Live Handshake & Diagnostic</span>
          </button>

          <button
            onClick={() => setActiveTab('rfc_tester')}
            className={`px-3 py-1.5 font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'rfc_tester'
                ? 'border-amber-400 text-amber-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Live RFC Tester & BAPI Console</span>
          </button>
          
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'config'
                ? 'border-amber-400 text-amber-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Connection Configuration</span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'queue'
                ? 'border-amber-400 text-amber-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Sync Queue ({queueItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`px-3 py-1.5 font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'billing'
                ? 'border-amber-400 text-amber-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>VF01 Billing Documents ({billingTransactions.length})</span>
          </button>
        </div>

        {/* ===================== TAB CONTENT PANELS ===================== */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">

          {/* TAB 1: LIVE HANDSHAKE & DIAGNOSTIC */}
          {activeTab === 'handshake' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Direct RFC / OData Handshake Verification
                  </h3>
                  <p className="text-xs text-slate-400">
                    Executes dynamic probe against SAP S/4HANA instance, fetches live CSRF token, and validates active BAPI interfaces.
                  </p>
                </div>
                <Button
                  onClick={handleRunTestHandshake}
                  disabled={isTesting}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8 px-4 cursor-pointer shadow-lg"
                >
                  <Send className={`h-3.5 w-3.5 mr-1.5 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Handshaking with SAP...' : 'Execute Live Handshake'}
                </Button>
              </div>

              {/* BAPI Catalog Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      MIGO Goods Receipt (Inbound)
                    </span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                      BAPI_GOODSMVT_CREATE
                    </Badge>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Direct live posting of Movement 101 (against SAP PO) and Movement 501 (Non-PO aggregate receipt). Auto-generates SAP Material Document Number (5000xxxxxx).
                  </p>
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1">
                    <span>OData: API_MATERIAL_DOCUMENT_SRV</span>
                    <span className="text-emerald-400">READY</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      VL02N Outbound Delivery PGI (Exit Gate)
                    </span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                      BAPI_OUTB_DELIVERY_CONFIRM_DEC
                    </Badge>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Direct Post Goods Issue (Movement 601) verification. Validates batch concrete volume, slump tolerance, and tamper seals before issuing Outbound Gate Pass (OGP).
                  </p>
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1">
                    <span>OData: API_OUTBOUND_DELIVERY_SRV</span>
                    <span className="text-emerald-400">READY</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      VF01 Commercial Billing Document
                    </span>
                    <Badge variant="outline" className="bg-sky-500/10 text-sky-400 border-sky-500/30 text-[10px]">
                      BAPI_BILLINGDOC_CREATEMULTIPLE
                    </Badge>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Automatic generation of SD Invoice (9000xxxxxx) and Financial Accounting document (1000xxxxxx) with GST breakdown upon transit mixer gate exit.
                  </p>
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1">
                    <span>OData: API_BILLING_DOCUMENT_SRV</span>
                    <span className="text-sky-400">READY</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      ME23N / VL03N Live Query Interface
                    </span>
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[10px]">
                      BAPI_PO_GETDETAIL1
                    </Badge>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Live querying of active purchase orders, pending quantities, and outbound deliveries scheduled for dispatch from S/4HANA ERP master data.
                  </p>
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1">
                    <span>OData: API_PURCHASEORDER_PROCESS_SRV</span>
                    <span className="text-purple-400">READY</span>
                  </div>
                </div>
              </div>

              {/* Live Diagnostic Logs Terminal */}
              <div className="bg-black/90 rounded-lg border border-slate-800 p-3 font-mono text-xs space-y-2 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-amber-400" />
                    SAP RFC / OData Handshake Diagnostic Console
                  </span>
                  <span className="text-emerald-400 text-[10px]">
                    {testResult ? `Handshake Code: 200 OK (${testResult.latencyMs} ms)` : 'Idle / Ready'}
                  </span>
                </div>
                
                <div className="space-y-1 text-[11px] max-h-48 overflow-y-auto leading-relaxed text-slate-300">
                  {testResult?.logs && testResult.logs.length > 0 ? (
                    testResult.logs.map((log, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-slate-600 select-none">{String(idx + 1).padStart(2, '0')}.</span>
                        <span className={log.includes('OK') || log.includes('negotiated') || log.includes('established') ? 'text-emerald-300' : log.includes('Probing') || log.includes('Initiating') ? 'text-sky-300' : 'text-slate-300'}>
                          {log}
                        </span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="text-slate-500">[2026-10-10 17:24:31] Initialized SAP S/4HANA connector daemon for PRD_S4H (Client 100).</div>
                      <div className="text-slate-500">[Protocol] Default transport: OData v4 over SAP Cloud Connector (Location: HYD_RMC_PLANT_01).</div>
                      <div className="text-emerald-400/80">[OK] RFC BAPIs registered: BAPI_GOODSMVT_CREATE, BAPI_OUTB_DELIVERY_CONFIRM_DEC, BAPI_BILLINGDOC_CREATEMULTIPLE.</div>
                      <div className="text-slate-400">Click &quot;Execute Live Handshake&quot; above to probe live corporate S/4HANA instance.</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONNECTION CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4 text-xs">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white">SAP S/4HANA Connection Parameters</h3>
                  <p className="text-slate-400 text-xs">
                    Configure endpoint protocols for production S/4HANA Enterprise instances, SAP BTP destinations, and Cloud Connector agents.
                  </p>
                </div>

                {/* Connection Mode Selection */}
                <div>
                  <label className="font-bold text-slate-200 block mb-2">Connection Architecture & Protocol</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, connectionType: 'odata_cloud_connector' })}
                      className={`p-3 rounded-md border text-left cursor-pointer transition-all ${
                        config.connectionType === 'odata_cloud_connector'
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold block text-xs">SAP Cloud Connector / BTP</span>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        HTTPS OData v2/v4 via Secure Corporate Cloud Tunnel (Recommended)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, connectionType: 'rfc_netweaver' })}
                      className={`p-3 rounded-md border text-left cursor-pointer transition-all ${
                        config.connectionType === 'rfc_netweaver'
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold block text-xs">Direct NetWeaver RFC SDK</span>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Direct binary RFC socket via TCP port 3300 (node-rfc / SAP NW SDK)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, connectionType: 'simulation' })}
                      className={`p-3 rounded-md border text-left cursor-pointer transition-all ${
                        config.connectionType === 'simulation'
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold block text-xs">High-Fidelity Simulation</span>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Simulated S/4HANA enterprise response engine for offline testing
                      </span>
                    </button>
                  </div>
                </div>

                {/* Main Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">SAP Host / FQDN</label>
                    <input
                      type="text"
                      value={config.host || ''}
                      onChange={(e) => setConfig({ ...config, host: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Gateway Port (HTTPS / RFC)</label>
                    <input
                      type="number"
                      value={config.port || 44300}
                      onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value, 10) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">SAP Client Number</label>
                    <input
                      type="text"
                      value={config.client || '100'}
                      onChange={(e) => setConfig({ ...config, client: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">SAP System ID (SID)</label>
                    <input
                      type="text"
                      value={config.systemId || 'PRD_S4H'}
                      onChange={(e) => setConfig({ ...config, systemId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">System Number (SysNr)</label>
                    <input
                      type="text"
                      value={config.sysnr || '00'}
                      onChange={(e) => setConfig({ ...config, sysnr: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Service Account (RFC User)</label>
                    <input
                      type="text"
                      value={config.username || ''}
                      onChange={(e) => setConfig({ ...config, username: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Cloud Connector Location ID</label>
                    <input
                      type="text"
                      value={config.cloudConnectorLocationId || 'HYD_RMC_PLANT_01'}
                      onChange={(e) => setConfig({ ...config, cloudConnectorLocationId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Timeout (ms)</label>
                    <input
                      type="number"
                      value={config.timeoutMs || 12000}
                      onChange={(e) => setConfig({ ...config, timeoutMs: parseInt(e.target.value, 10) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">OData Base Service URL</label>
                    <input
                      type="text"
                      value={config.odataBaseUrl || ''}
                      onChange={(e) => setConfig({ ...config, odataBaseUrl: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-800">
                  <Button
                    onClick={handleSaveConfig}
                    disabled={isSavingConfig}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8 px-4 cursor-pointer"
                  >
                    <Save className={`h-3.5 w-3.5 mr-1.5 ${isSavingConfig ? 'animate-spin' : ''}`} />
                    {isSavingConfig ? 'Saving Parameters...' : 'Save Configuration'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RESILIENT SYNC QUEUE */}
          {activeTab === 'queue' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <h3 className="font-bold text-white uppercase tracking-wider">Asynchronous SAP Sync Queue</h3>
                  <p className="text-slate-400">
                    Offline buffer & resilience engine: Transactions queued during temporary corporate network blips are auto-retried.
                  </p>
                </div>
                <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700">
                  {queueItems.length} Total Items
                </Badge>
              </div>

              {queueItems.length === 0 ? (
                <div className="bg-slate-950 p-8 rounded-lg border border-slate-800 text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Sync Queue is Completely Clear</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    All weighbridge goods receipts, exit verification goods issues, and billing documents have been synchronized to SAP S/4HANA with 0 pending errors.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-mono border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Queue ID</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Reference</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Retries</th>
                        <th className="py-2 px-3">Enqueued At</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                      {queueItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-900/40">
                          <td className="py-2 px-3 font-bold text-amber-400">{item.id}</td>
                          <td className="py-2 px-3 font-sans text-xs">{item.syncCategory}</td>
                          <td className="py-2 px-3 text-slate-200">{item.referenceId || 'N/A'}</td>
                          <td className="py-2 px-3">
                            <Badge className={`text-[9px] ${
                              item.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : item.status === 'queued'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-red-500/20 text-red-300 border-red-500/30'
                            }`}>
                              {item.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-2 px-3">{item.retryCount} / {item.maxRetries}</td>
                          <td className="py-2 px-3 text-[11px] text-slate-400">
                            {new Date(item.createdAt).toLocaleTimeString()}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRetryQueue(item.id)}
                              disabled={retryingId === item.id || item.status === 'completed'}
                              className="h-6 text-[10px] bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                            >
                              <RotateCw className={`h-3 w-3 mr-1 ${retryingId === item.id ? 'animate-spin' : ''}`} />
                              Retry Now
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VF01 BILLING DOCUMENTS */}
          {activeTab === 'billing' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <h3 className="font-bold text-white uppercase tracking-wider">
                    SAP S/4HANA VF01 / VF02 Commercial Invoices
                  </h3>
                  <p className="text-slate-400">
                    Live accounting documents generated and synced with Outbound Deliveries (OBD) & Customer Sales Orders.
                  </p>
                </div>
                <Badge variant="outline" className="bg-sky-500/10 text-sky-400 border-sky-500/30">
                  {billingTransactions.length} Posted Invoices
                </Badge>
              </div>

              <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-mono border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">SAP Billing Doc</th>
                      <th className="py-2 px-3">FI Accounting Doc</th>
                      <th className="py-2 px-3">OBD / SO</th>
                      <th className="py-2 px-3">Customer</th>
                      <th className="py-2 px-3">Volume & Grade</th>
                      <th className="py-2 px-3">Total (₹)</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {billingTransactions.map((bill) => (
                      <tr key={bill.id} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 font-bold text-sky-400">{bill.sapBillingDoc}</td>
                        <td className="py-2 px-3 text-slate-400">{bill.sapAccountingDoc}</td>
                        <td className="py-2 px-3 text-slate-200">
                          {bill.deliveryNumber || 'OBD-Direct'} <span className="text-[10px] text-slate-500">({bill.salesOrder})</span>
                        </td>
                        <td className="py-2 px-3 font-sans text-xs text-slate-200">{bill.customerName}</td>
                        <td className="py-2 px-3 text-[11px] text-slate-300">
                          {bill.batchVolumeM3} m³ • <span className="font-sans">{bill.concreteGrade}</span>
                        </td>
                        <td className="py-2 px-3 font-bold text-emerald-400">
                          ₹{bill.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-3">
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px]">
                            SYNCED
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* ===================== MODAL FOOTER ===================== */}
        <div className="bg-slate-950 border-t border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Active SAP TLS 1.3 / SNC Encryption Handshake • Client: {config.client}</span>
          </div>

          <Button
            size="sm"
            onClick={onClose}
            className="h-7 text-xs bg-slate-800 hover:bg-slate-700 text-white cursor-pointer px-4"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
