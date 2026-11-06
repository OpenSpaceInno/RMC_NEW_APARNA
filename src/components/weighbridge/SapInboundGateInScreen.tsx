import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  Truck, 
  Save, 
  Scale, 
  Camera, 
  Check, 
  Search, 
  Printer, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  SlidersHorizontal,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
  Copy,
  Video,
  Radio,
  Eye,
  ArrowRight,
  CornerDownRight,
  QrCode,
  Ticket,
  ChevronRight
} from 'lucide-react';
import Hls from 'hls.js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { resolveCameraHlsUrl, attachHlsStream } from '@/lib/cameraStream';
import { WeightReading, Evidence } from '@/types/weighbridge';
import { 
  SapPurchaseOrder, 
  SapTicketDetails, 
  SapActiveTicket, 
  WeighbridgeScenario, 
  SapRfcCheckPoResponse, 
  SapRfcConsumePoResponse 
} from '@/types/sap';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { SapConnectionManagerModal } from '../sap/SapConnectionManagerModal';
import { SapWeighbridgeSlipModal, WeighbridgeSlipData } from './SapWeighbridgeSlipModal';
import { ActiveInPlantTicketsDrawer } from './ActiveInPlantTicketsDrawer';

interface SapInboundGateInScreenProps {
  isOpen: boolean;
  onClose: () => void;
  syncType?: 'po_ref' | 'without_po' | 'others';
  currentWeight: WeightReading;
  initialVehicleNo?: string;
  initialDriverName?: string;
  embedded?: boolean;
  initialMode?: 'gate_in' | 'gate_out';
  initialTicketNumber?: string;
  onSessionUpdated?: (data: {
    vehicleRegNo: string;
    driverName: string;
    material: string;
    tareWeight?: number;
    grossWeight?: number;
    netWeight?: number;
    sapDocNumber?: string;
    sapPoNumber?: string;
  }) => void;
}

export function SapInboundGateInScreen({
  isOpen,
  onClose,
  syncType: initialSyncType = 'po_ref',
  currentWeight,
  initialVehicleNo = '',
  initialDriverName = '',
  embedded = false,
  initialMode = 'gate_in',
  initialTicketNumber = '',
  onSessionUpdated,
}: SapInboundGateInScreenProps) {
  // Screen Display Mode & Navigation
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mode, setMode] = useState<'gate_in' | 'gate_out'>(initialMode);
  const [scenario, setScenario] = useState<WeighbridgeScenario>(
    initialSyncType === 'po_ref' ? 'with_po' : (initialSyncType as WeighbridgeScenario)
  );

  // Weight target: 'gross' vs 'tare'
  const [weightTarget, setWeightTarget] = useState<'gross' | 'tare'>('gross');
  const [sapModalOpen, setSapModalOpen] = useState(false);
  const [activeTicketsDrawerOpen, setActiveTicketsDrawerOpen] = useState(false);

  // Slip Printing & Issued Ticket Modal
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [slipData, setSlipData] = useState<WeighbridgeSlipData | null>(null);
  const [issuedTicketModalOpen, setIssuedTicketModalOpen] = useState(false);
  const [issuedTicketNumber, setIssuedTicketNumber] = useState<string | null>(null);

  // User Auth & SAP RFC State
  const { user } = useAuth();
  const [isCheckingPoRfc, setIsCheckingPoRfc] = useState(false);
  const [poRfcResult, setPoRfcResult] = useState<SapRfcCheckPoResponse | null>(null);
  const [isCheckingVehicleRfc, setIsCheckingVehicleRfc] = useState(false);

  // ===================== FORM FIELDS (Matches SAP GUI) =====================
  const [plant, setPlant] = useState('PL01');
  const [purchasingDoc, setPurchasingDoc] = useState('');
  const [itemNo, setItemNo] = useState('10');
  const [materialCode, setMaterialCode] = useState('MAT-CEM-OPC53');
  const [materialName, setMaterialName] = useState('Ordinary Portland Cement 53 Grade');
  const [vehicleNumber, setVehicleNumber] = useState(initialVehicleNo || '');
  const [driverName, setDriverName] = useState(initialDriverName || '');
  const [transport, setTransport] = useState('Sri Sai Ram Logistics');
  const [headerText, setHeaderText] = useState('Bulk Cement Inbound for Shamshabad RMC Plant');
  const [vendorCode, setVendorCode] = useState('VEND-10023');
  const [vendorName, setVendorName] = useState('UltraTech Cement Limited');
  const [customerName, setCustomerName] = useState('');
  const [destinationSite, setDestinationSite] = useState('');
  const [challanNo, setChallanNo] = useState(`CH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [challanWeight, setChallanWeight] = useState('24500.00');
  const [challanDate, setChallanDate] = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  });

  // Weights (KG)
  const [grossWeight, setGrossWeight] = useState<number>(0);
  const [tareWeight, setTareWeight] = useState<number>(0);
  const [uom, setUom] = useState('KG');

  // Time & Date
  const [truckInDate, setTruckInDate] = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  });
  const [truckInTime, setTruckInTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  });

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setTruckInTime(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // SAP PO Data
  const [purchaseOrders, setPurchaseOrders] = useState<SapPurchaseOrder[]>([]);
  const [poPickerOpen, setPoPickerOpen] = useState(false);
  const [isLoadingPos, setIsLoadingPos] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccessDoc, setSavedSuccessDoc] = useState<string | null>(null);

  // ===================== GATE OUT STATE =====================
  const [searchTicketQuery, setSearchTicketQuery] = useState(initialTicketNumber || '');
  const [isSearchingTicket, setIsSearchingTicket] = useState(false);
  const [loadedGateInRecord, setLoadedGateInRecord] = useState<SapTicketDetails | null>(null);

  // Active in-plant count
  const [activeInPlantCount, setActiveInPlantCount] = useState<number>(0);

  const fetchActiveCount = async () => {
    try {
      const res = await api.getActiveWeighbridgeTickets();
      if (res && res.success && Array.isArray(res.tickets)) {
        setActiveInPlantCount(res.tickets.length);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchActiveCount();
      const interval = setInterval(fetchActiveCount, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Adjust weight target automatically whenever mode or scenario changes
  useEffect(() => {
    if (mode === 'gate_in') {
      if (scenario === 'others') {
        // Vehicle enters EMPTY
        setWeightTarget('tare');
      } else {
        // Inbound: vehicle enters LOADED
        setWeightTarget('gross');
      }
    } else {
      // Gate Out mode
      if (loadedGateInRecord) {
        if (loadedGateInRecord.scenario === 'others') {
          // Outward: vehicle leaves LOADED
          setWeightTarget('gross');
        } else {
          // Inbound: vehicle leaves EMPTY
          setWeightTarget('tare');
        }
      } else {
        setWeightTarget('tare');
      }
    }
  }, [mode, scenario, loadedGateInRecord]);

  // If initialTicketNumber is passed, search it automatically
  useEffect(() => {
    if (initialTicketNumber && initialMode === 'gate_out') {
      handleSearchTicket(initialTicketNumber);
    }
  }, [initialTicketNumber, initialMode]);

  // Evidence / Camera Snapshots
  const [capturedPhotos, setCapturedPhotos] = useState<{
    anpr?: string;
    platform?: string;
    side?: string;
  }>({});

  // FTP Evidence / Snapshot from ANPR Cam 1
  const [ftpEvidence, setFtpEvidence] = useState<{
    plate: string;
    filename: string;
    imageUrl: string;
    timestamp: string;
  } | null>(null);
  const [isCheckingFtp, setIsCheckingFtp] = useState(false);
  const lastDetectedFilenameRef = useRef<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 3 Canvas & Video refs for real-time camera simulation & IP HLS Stream
  const cam1CanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cam2CanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cam3CanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cam1VideoRef = useRef<HTMLVideoElement | null>(null);
  const cam2VideoRef = useRef<HTMLVideoElement | null>(null);
  const cam3VideoRef = useRef<HTMLVideoElement | null>(null);
  const hls1Ref = useRef<Hls | null>(null);
  const hls2Ref = useRef<Hls | null>(null);
  const hls3Ref = useRef<Hls | null>(null);
  const [cam1HlsActive, setCam1HlsActive] = useState(false);
  const [cam2HlsActive, setCam2HlsActive] = useState(false);
  const [cam3HlsActive, setCam3HlsActive] = useState(false);
  const animFrameId = useRef<number | null>(null);

  // Load SAP Purchase Orders on open
  useEffect(() => {
    if (isOpen) {
      if (scenario === 'with_po') {
        loadPos();
      } else if (scenario === 'without_po') {
        setPurchasingDoc('');
        setItemNo('501');
        setMaterialCode('AGG-20MM');
        setMaterialName('20mm Blue Metal Granite Aggregate');
        setVendorCode('VEND-SPOT-01');
        setVendorName('Sri Krishna Stone Works (Spot Quarry)');
        setHeaderText('Direct Quarry Inbound Receipt (Movement 501)');
        setTransport('Local Tipper Haulage (Spot)');
        setChallanWeight('22800.00');
      } else if (scenario === 'others') {
        setPurchasingDoc('');
        setItemNo('0');
        setMaterialCode('SCRAP-MT');
        setMaterialName('Plant Scrap Metal Sale / Yard Return');
        setVendorCode('');
        setVendorName('');
        setCustomerName('Hitech Metal Recyclers & Re-rollers');
        setDestinationSite('Balanagar Yard');
        setHeaderText('Plant Outbound Sales / Scrap Disposal (Movement 601)');
        setTransport('Self Collection');
        setChallanWeight('5400.00');
      }
    }
  }, [isOpen, scenario]);

  const loadPos = async () => {
    setIsLoadingPos(true);
    try {
      const pos = await api.getSapPurchaseOrders({ status: 'open' });
      setPurchaseOrders(pos);
      if (pos.length > 0 && !purchasingDoc) {
        applyPo(pos[0]);
      }
    } catch (err) {
      console.warn('Failed to fetch SAP POs:', err);
    } finally {
      setIsLoadingPos(false);
    }
  };

  const applyPo = (po: SapPurchaseOrder) => {
    setPurchasingDoc(po.poNumber);
    setItemNo('10');
    setMaterialCode(po.materialCode);
    setMaterialName(po.materialName);
    setVendorCode(po.vendorCode);
    setVendorName(po.vendorName);
    if (po.defaultVehicle && !vehicleNumber) setVehicleNumber(po.defaultVehicle);
    setHeaderText(`PO #${po.poNumber} - ${po.materialName} Inbound`);
    setChallanWeight((po.pendingQty * 1000).toFixed(2));
    setPoPickerOpen(false);
    toast.success(`Loaded SAP PO #${po.poNumber}`, {
      description: `${po.vendorName} • ${po.materialName}`
    });
  };

  // Function to Check PO via RFC (BAPI_PO_GETDETAIL1)
  const handleCheckPoRfc = async (poToVerify?: string) => {
    const poNum = poToVerify || purchasingDoc;
    if (!poNum.trim()) {
      toast.error('Please enter a Purchase Order number first');
      return;
    }

    setIsCheckingPoRfc(true);
    try {
      const res = await api.checkSapPoViaRfc({
        poNumber: poNum,
        plantCode: plant,
        userData: {
          userId: user?.id,
          username: user?.username,
          name: user?.name,
          roleId: user?.roleId,
          shift: user?.shift,
          department: user?.department,
          plantCode: plant
        }
      });

      setPoRfcResult(res);

      if (res.success && res.item) {
        setPurchasingDoc(res.poNumber);
        setItemNo(res.item.itemNo || '10');
        setMaterialCode(res.item.materialCode);
        setMaterialName(res.item.materialName);
        if (res.header?.vendorCode) setVendorCode(res.header.vendorCode);
        if (res.header?.vendorName) setVendorName(res.header.vendorName);
        if (res.item.defaultVehicle && !vehicleNumber) {
          setVehicleNumber(res.item.defaultVehicle);
        }
        setChallanWeight((res.item.pendingQty * 1000).toFixed(2));
        setHeaderText(`PO #${res.poNumber} - ${res.item.materialName} Inbound`);

        toast.success(`SAP RFC Verified: PO #${res.poNumber}`, {
          description: `Vendor: ${res.header?.vendorName} • Balance: ${res.item.pendingQty} ${res.item.unit} (${res.rfcTelemetry?.latencyMs || 14}ms)`
        });
      } else {
        toast.error(`SAP RFC Error: ${res.error || 'PO not active in SAP'}`);
      }
    } catch (err: any) {
      toast.error(`RFC Connection Error: ${err.message || 'Failed to query SAP'}`);
    } finally {
      setIsCheckingPoRfc(false);
    }
  };

  // Function to Check Vehicle Plate in SAP via RFC
  const handleCheckVehicleRfc = async (plateToCheck?: string) => {
    const plate = plateToCheck || vehicleNumber;
    if (!plate.trim()) {
      toast.error('Vehicle Number is required for RFC check');
      return;
    }

    setIsCheckingVehicleRfc(true);
    try {
      const res = await api.checkSapVehicleViaRfc({
        vehicleRegNo: plate,
        plantCode: plant,
        direction: 'inbound',
        userData: {
          userId: user?.id,
          username: user?.username,
          name: user?.name,
          roleId: user?.roleId,
          shift: user?.shift
        }
      });

      if (res.success && res.matchFound && res.matchedPo) {
        setPurchasingDoc(res.matchedPo.poNumber);
        setVendorCode(res.matchedPo.vendorCode);
        setVendorName(res.matchedPo.vendorName);
        setMaterialCode(res.matchedPo.materialCode);
        setMaterialName(res.matchedPo.materialName);
        setChallanWeight((res.matchedPo.pendingQty * 1000).toFixed(2));
        setHeaderText(`PO #${res.matchedPo.poNumber} - ${res.matchedPo.materialName} Inbound`);

        toast.success(`SAP RFC Match: ${plate} ➔ PO #${res.matchedPo.poNumber}`, {
          description: `${res.matchedPo.vendorName} • Pending: ${res.matchedPo.pendingQty} ${res.matchedPo.unit}`
        });
      } else {
        toast.info(`Vehicle ${plate} verified in SAP (Spot Receipt / Scheduled Inbound)`);
      }
    } catch (err: any) {
      toast.warning(`RFC Vehicle Check: ${err.message}`);
    } finally {
      setIsCheckingVehicleRfc(false);
    }
  };

  // ---------------- CAMERA CANVAS SIMULATION & HLS ----------------
  useEffect(() => {
    if (!isOpen) return;

    const render = () => {
      // 1. CAM 01: ANPR Plate Camera
      if (cam1CanvasRef.current && !ftpEvidence) {
        const ctx = cam1CanvasRef.current.getContext('2d');
        if (ctx) {
          const w = 640;
          const h = 360;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, w, h);

          // Pavement & lane markings
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, 240, w, 120);
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 3;
          ctx.setLineDash([20, 20]);
          ctx.beginPath();
          ctx.moveTo(320, 240);
          ctx.lineTo(320, 360);
          ctx.stroke();
          ctx.setLineDash([]);

          // Truck front grill
          ctx.fillStyle = '#334155';
          ctx.fillRect(200, 120, 240, 160);
          ctx.fillStyle = '#64748b';
          ctx.fillRect(220, 130, 200, 70);
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(230, 140, 180, 50);

          // Headlights
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(220, 220, 15, 0, Math.PI * 2);
          ctx.arc(420, 220, 15, 0, Math.PI * 2);
          ctx.fill();

          // Front Bumper & Plate
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(190, 240, 260, 45);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(270, 250, 100, 25);
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 13px monospace';
          ctx.fillText(vehicleNumber || 'AWAITING_OCR', 276, 268);

          // Green OCR Detection Box
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
          ctx.strokeRect(266, 246, 108, 33);

          // OSD Text
          ctx.fillStyle = '#ffffff';
          ctx.font = '11px sans-serif';
          ctx.fillText(`CAM 01 • ANPR FRONT • FPS: 25.0 • 3K UHD`, 10, 20);
          ctx.fillStyle = vehicleNumber ? '#22c55e' : '#f59e0b';
          ctx.fillText(vehicleNumber ? `[OCR 98.8%] PLATE: ${vehicleNumber}` : `[OCR STANDBY] AWAITING VEHICLE...`, 10, 36);
        }
      }

      // 2. CAM 02: Platform Bay Camera
      if (cam2CanvasRef.current && !cam2HlsActive) {
        const ctx = cam2CanvasRef.current.getContext('2d');
        if (ctx) {
          const w = 640;
          const h = 360;
          ctx.fillStyle = '#0b1120';
          ctx.fillRect(0, 0, w, h);

          // Silos in background
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(60, 30, 50, 130);
          ctx.fillRect(125, 20, 50, 140);
          ctx.fillRect(190, 40, 45, 120);

          // Scale deck
          ctx.fillStyle = '#262d3d';
          ctx.beginPath();
          ctx.moveTo(180, 160);
          ctx.lineTo(460, 160);
          ctx.lineTo(600, 350);
          ctx.lineTo(40, 350);
          ctx.closePath();
          ctx.fill();

          // Yellow curb
          ctx.fillStyle = '#eab308';
          ctx.fillRect(40, 335, 560, 12);
          ctx.fillStyle = '#000000';
          for (let i = 50; i < 600; i += 40) {
            ctx.fillRect(i, 335, 18, 12);
          }

          // Truck Bulker Tanker on platform
          const truckX = 220;
          const truckY = 170;
          ctx.fillStyle = '#475569';
          ctx.fillRect(truckX, truckY, 200, 90);
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.ellipse(truckX + 110, truckY + 40, 75, 32, 0, 0, Math.PI * 2);
          ctx.fill();

          // OSD Text
          ctx.fillStyle = '#ffffff';
          ctx.font = '11px sans-serif';
          ctx.fillText(`CAM 02 • SCALE PLATFORM BAY 01`, 10, 20);
          ctx.fillStyle = '#10b981';
          ctx.fillText(`SCALE: ${(currentWeight.weight / 1000).toFixed(2)} MT • STATUS: ${currentWeight.stable ? 'STABLE' : 'MOTION'}`, 10, 36);
        }
      }

      // 3. CAM 03: Driver Cabin / Side Chute
      if (cam3CanvasRef.current) {
        const ctx = cam3CanvasRef.current.getContext('2d');
        if (ctx) {
          const w = 640;
          const h = 360;
          ctx.fillStyle = '#020617';
          ctx.fillRect(0, 0, w, h);

          // Cabin side profile
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(160, 100, 340, 180);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(380, 120, 90, 70);

          // Wheels
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(240, 280, 32, 0, Math.PI * 2);
          ctx.arc(430, 280, 32, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '11px sans-serif';
          ctx.fillText(`CAM 03 • CABIN & SIDE CHUTE • 1080P FHD`, 10, 20);
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(`DRIVER: ${driverName || 'VERIFIED ON ARRIVAL'} • SEAL INTACT`, 10, 36);
        }
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isOpen, vehicleNumber, currentWeight, ftpEvidence, cam2HlsActive, driverName]);

  // Image URL resolver
  const resolveImageUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const backendBase = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api')).replace(/\/api$/, '');
    return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Poll camera FTP directory for latest vehicle plate file
  const checkLatestFtpPlate = useCallback(async (isManual = false) => {
    try {
      if (isManual) setIsCheckingFtp(true);
      const res = await api.getLatestFtpPlate();

      if (res && res.success && res.plate && res.filename) {
        const fullImg = resolveImageUrl(res.imageUrl);
        const timeStr = res.lastModified ? new Date(res.lastModified).toLocaleTimeString() : new Date().toLocaleTimeString();

        if (lastDetectedFilenameRef.current !== res.filename || isManual || !ftpEvidence) {
          const isNew = lastDetectedFilenameRef.current !== res.filename;
          lastDetectedFilenameRef.current = res.filename;

          const newEvidence = {
            plate: res.plate,
            filename: res.filename,
            imageUrl: fullImg || res.imageUrl || '',
            timestamp: timeStr,
          };

          setFtpEvidence(newEvidence);
          setVehicleNumber(res.plate);

          if (isNew) {
            toast.success(`Vehicle Plate ${res.plate} Captured from FTP!`, {
              description: `Evidence file: ${res.filename} loaded in ANPR Cam 1`,
              duration: 4000,
            });
          } else if (isManual) {
            toast.success(`Vehicle Number ${res.plate} Retrieved from FTP!`, {
              description: `Evidence file: ${res.filename}`,
              duration: 3000,
            });
          }
        }
      } else if (isManual) {
        toast.info("No incoming vehicle plate files found on FTP yet.");
      }
    } catch (err: any) {
      if (isManual) toast.error('FTP Plate Check Error: ' + (err.message || 'Failed to read FTP'));
    } finally {
      if (isManual) setIsCheckingFtp(false);
    }
  }, [ftpEvidence]);

  useEffect(() => {
    if (!isOpen) return;
    checkLatestFtpPlate(false);
    const interval = setInterval(() => checkLatestFtpPlate(false), 4000);
    return () => clearInterval(interval);
  }, [isOpen, checkLatestFtpPlate]);

  // Connect 3 live IP camera streams
  useEffect(() => {
    if (!isOpen) return;

    const unmount1 = attachHlsStream({
      video: cam1VideoRef.current,
      urlOrPair: resolveCameraHlsUrl('', 'live_cam1'),
      onConnected: () => setCam1HlsActive(true),
      onError: () => setCam1HlsActive(false),
    });

    const unmount2 = attachHlsStream({
      video: cam2VideoRef.current,
      urlOrPair: resolveCameraHlsUrl('', 'live_cam2'),
      onConnected: () => setCam2HlsActive(true),
      onError: () => setCam2HlsActive(false),
    });

    const unmount3 = attachHlsStream({
      video: cam3VideoRef.current,
      urlOrPair: resolveCameraHlsUrl('', 'live_cam2'),
      onConnected: () => setCam3HlsActive(true),
      onError: () => setCam3HlsActive(false),
    });

    return () => {
      unmount1();
      unmount2();
      unmount3();
      setCam1HlsActive(false);
      setCam2HlsActive(false);
      setCam3HlsActive(false);
    };
  }, [isOpen]);

  // Live Canvas CCTV animation loop when HLS stream is inactive/offline
  useEffect(() => {
    if (!isOpen) return;

    const render = () => {
      // 1. CAM 01: ANPR Plate Camera
      if (cam1CanvasRef.current && !ftpEvidence && !cam1HlsActive) {
        const ctx = cam1CanvasRef.current.getContext('2d');
        if (ctx) {
          const w = 640;
          const h = 360;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, w, h);

          // Pavement & lane markings
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, 240, w, 120);
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 3;
          ctx.setLineDash([20, 20]);
          ctx.beginPath();
          ctx.moveTo(320, 240);
          ctx.lineTo(320, 360);
          ctx.stroke();
          ctx.setLineDash([]);

          // Truck front cab
          ctx.fillStyle = '#334155';
          ctx.fillRect(200, 120, 240, 160);
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(230, 140, 180, 50);

          // Headlights
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(220, 220, 15, 0, Math.PI * 2);
          ctx.arc(420, 220, 15, 0, Math.PI * 2);
          ctx.fill();

          // Bumper & Plate
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(190, 240, 260, 45);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(260, 250, 120, 26);
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 13px monospace';
          ctx.fillText(vehicleNumber || 'TN88F4089', 266, 268);

          // Green OCR Detection Box
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
          ctx.strokeRect(256, 246, 128, 34);

          // OSD Text
          ctx.fillStyle = '#ffffff';
          ctx.font = '11px sans-serif';
          ctx.fillText(`CAM 01 • GATE ENTRY ANPR • 3K UHD`, 10, 20);
          ctx.fillStyle = '#22c55e';
          ctx.fillText(`[OCR 99.2%] PLATE: ${vehicleNumber || 'TN88F4089'}`, 10, 36);
        }
      }

      // 2. CAM 02: Scale Deck Platform Bay
      if (cam2CanvasRef.current && !cam2HlsActive) {
        const ctx = cam2CanvasRef.current.getContext('2d');
        if (ctx) {
          const w = 640;
          const h = 360;
          ctx.fillStyle = '#0b1120';
          ctx.fillRect(0, 0, w, h);

          // Silos in background
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(60, 30, 50, 130);
          ctx.fillRect(125, 20, 50, 140);
          ctx.fillRect(190, 40, 45, 120);

          // Scale deck
          ctx.fillStyle = '#262d3d';
          ctx.beginPath();
          ctx.moveTo(180, 160);
          ctx.lineTo(460, 160);
          ctx.lineTo(600, 350);
          ctx.lineTo(40, 350);
          ctx.closePath();
          ctx.fill();

          // Yellow caution curb
          ctx.fillStyle = '#eab308';
          ctx.fillRect(40, 335, 560, 12);
          ctx.fillStyle = '#000000';
          for (let i = 50; i < 600; i += 40) {
            ctx.fillRect(i, 335, 18, 12);
          }

          // Truck Bulker Tanker on platform
          const truckX = 220;
          const truckY = 170;
          ctx.fillStyle = '#475569';
          ctx.fillRect(truckX, truckY, 200, 90);
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.ellipse(truckX + 110, truckY + 40, 75, 32, 0, 0, Math.PI * 2);
          ctx.fill();

          // OSD Text
          ctx.fillStyle = '#ffffff';
          ctx.font = '11px sans-serif';
          ctx.fillText(`CAM 02 • SCALE PLATFORM BAY 01`, 10, 20);
          ctx.fillStyle = '#10b981';
          ctx.fillText(`LIVE WT: ${(currentWeight.weight / 1000).toFixed(2)} MT • STATUS: ${currentWeight.stable ? 'STABLE' : 'MOTION'}`, 10, 36);
        }
      }

      // 3. CAM 03: Driver Cabin / Side Chute
      if (cam3CanvasRef.current && !cam3HlsActive) {
        const ctx = cam3CanvasRef.current.getContext('2d');
        if (ctx) {
          const w = 640;
          const h = 360;
          ctx.fillStyle = '#020617';
          ctx.fillRect(0, 0, w, h);

          // Cabin side profile
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(160, 100, 340, 180);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(380, 120, 90, 70);

          // Wheels
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(240, 280, 32, 0, Math.PI * 2);
          ctx.arc(430, 280, 32, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '11px sans-serif';
          ctx.fillText(`CAM 03 • CABIN & SIDE CHUTE • 1080P FHD`, 10, 20);
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(`DRIVER: ${driverName || 'ASSIGNED'} • SEAL INTACT`, 10, 36);
        }
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isOpen, vehicleNumber, currentWeight, ftpEvidence, cam1HlsActive, cam2HlsActive, cam3HlsActive, driverName]);

  const handleImageError = () => {
    // If image fails, clear it gracefully
    setFtpEvidence(null);
  };

  // Helper to snapshot the 3 cameras
  const captureSnapshots = () => {
    const snaps: { anpr?: string; platform?: string; side?: string } = {};

    // CAM 1 snapshot
    if (ftpEvidence?.imageUrl) {
      snaps.anpr = ftpEvidence.imageUrl;
    } else if (cam1VideoRef.current && cam1HlsActive) {
      try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 640;
        tempCanvas.height = 360;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(cam1VideoRef.current, 0, 0, 640, 360);
          snaps.anpr = tempCanvas.toDataURL('image/jpeg', 0.85);
        }
      } catch {
        if (cam1CanvasRef.current) snaps.anpr = cam1CanvasRef.current.toDataURL('image/jpeg', 0.8);
      }
    } else if (cam1CanvasRef.current) {
      snaps.anpr = cam1CanvasRef.current.toDataURL('image/jpeg', 0.8);
    }

    // CAM 2 snapshot
    if (cam2VideoRef.current && cam2HlsActive) {
      try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 640;
        tempCanvas.height = 360;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(cam2VideoRef.current, 0, 0, 640, 360);
          snaps.platform = tempCanvas.toDataURL('image/jpeg', 0.85);
        }
      } catch {
        if (cam2CanvasRef.current) snaps.platform = cam2CanvasRef.current.toDataURL('image/jpeg', 0.8);
      }
    } else if (cam2CanvasRef.current) {
      snaps.platform = cam2CanvasRef.current.toDataURL('image/jpeg', 0.8);
    }

    // CAM 3 snapshot
    if (cam3VideoRef.current && cam3HlsActive) {
      try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 640;
        tempCanvas.height = 360;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(cam3VideoRef.current, 0, 0, 640, 360);
          snaps.side = tempCanvas.toDataURL('image/jpeg', 0.85);
        }
      } catch {
        if (cam3CanvasRef.current) snaps.side = cam3CanvasRef.current.toDataURL('image/jpeg', 0.8);
      }
    } else if (cam3CanvasRef.current) {
      snaps.side = cam3CanvasRef.current.toDataURL('image/jpeg', 0.8);
    }

    setCapturedPhotos(snaps);
    toast.success('Snapshots Captured from Feeds');
  };

  // Edge ANPR
  const handleEdgeScanPlate = async () => {
    try {
      let dataUrl: string | null = null;
      if (cam1VideoRef.current && cam1HlsActive) {
        try {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = 640;
          tempCanvas.height = 360;
          const ctx = tempCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(cam1VideoRef.current, 0, 0, 640, 360);
            dataUrl = tempCanvas.toDataURL('image/jpeg', 0.85);
          }
        } catch {}
      }
      if (!dataUrl && cam1CanvasRef.current) {
        dataUrl = cam1CanvasRef.current.toDataURL('image/jpeg', 0.85);
      }
      if (!dataUrl) return;

      toast.info('Scanning CAM 01 with Edge ANPR Engine...');
      const res = await api.recognizeEdgePlate(dataUrl, 'CAM_INBOUND_01');
      if (res?.success && res.plate) {
        setVehicleNumber(res.plate);
        toast.success(`Edge ANPR Recognized: ${res.plate}`);
      } else {
        toast.warning('Edge ANPR confidence low. Manual entry required.');
      }
    } catch {
      toast.warning('Unable to read vehicle plate from camera stream.');
    }
  };

  // ===================== ACTION: GET WT (Grabs live scale reading) =====================
  const handleGetWeight = () => {
    const liveWeightKg = currentWeight.weight;
    
    if (weightTarget === 'gross') {
      setGrossWeight(liveWeightKg);
      toast.success(`Gross Weight Recorded: ${liveWeightKg.toLocaleString()} KG`, {
        description: `Scale status: ${currentWeight.stable ? 'STABLE' : 'UNSTABLE'} (${(liveWeightKg / 1000).toFixed(2)} MT)`
      });
    } else {
      setTareWeight(liveWeightKg);
      toast.success(`Tare Weight Recorded: ${liveWeightKg.toLocaleString()} KG`, {
        description: `Scale status: ${currentWeight.stable ? 'STABLE' : 'UNSTABLE'} (${(liveWeightKg / 1000).toFixed(2)} MT)`
      });
    }

    captureSnapshots();
  };

  // ===================== GATE OUT: SEARCH TICKET =====================
  const handleSearchTicket = async (ticketOrPlate?: string) => {
    const query = (ticketOrPlate || searchTicketQuery).trim();
    if (!query) {
      toast.error('Please enter a Ticket Number or Vehicle Number');
      return;
    }

    setIsSearchingTicket(true);
    try {
      const res = await api.getWeighbridgeTicket(query);
      if (res && res.success && res.ticket) {
        const t = res.ticket;
        setLoadedGateInRecord(t);
        setScenario(t.scenario);
        setPlant(t.plant || 'PL01');
        setVehicleNumber(t.vehicleNumber);
        if (t.transporter) setTransport(t.transporter);
        if (t.driverName) setDriverName(t.driverName);
        if (t.poNumber) setPurchasingDoc(t.poNumber);
        if (t.itemNo) setItemNo(t.itemNo);
        if (t.vendorName) setVendorName(t.vendorName);
        if (t.vendorCode) setVendorCode(t.vendorCode);
        if (t.materialName) setMaterialName(t.materialName);
        if (t.materialCode) setMaterialCode(t.materialCode);
        if (t.customerName) setCustomerName(t.customerName);
        if (t.destinationSite) setDestinationSite(t.destinationSite);
        if (t.challanNo) setChallanNo(t.challanNo);
        if (t.challanWeight) setChallanWeight(String(t.challanWeight));
        if (t.challanDate) setChallanDate(t.challanDate);

        // First weight assignment
        if (t.firstWeightType === 'GROSS') {
          setGrossWeight(Number(t.firstWeight));
          setTareWeight(0);
          setWeightTarget('tare'); // Second weight is Tare!
        } else {
          setTareWeight(Number(t.firstWeight));
          setGrossWeight(0);
          setWeightTarget('gross'); // Second weight is Gross!
        }

        toast.success(`Retrieved Gate-In Ticket #${t.ticketNumber}`, {
          description: `Vehicle: ${t.vehicleNumber} • First Wt: ${Number(t.firstWeight).toLocaleString()} KG (${t.firstWeightType})`
        });
      } else {
        toast.error(`Ticket "${query}" not found or already completed`);
      }
    } catch (err: any) {
      toast.error('Ticket lookup failed: ' + (err.message || 'Server error'));
    } finally {
      setIsSearchingTicket(false);
    }
  };

  // ===================== ACTION: SAVE (Dual Flow: Gate In vs Gate Out) =====================
  const handleSave = async () => {
    if (mode === 'gate_in') {
      await handleGateInSave();
    } else {
      await handleGateOutSave();
    }
  };

  // Gate In Save Handler
  const handleGateInSave = async () => {
    if (!vehicleNumber.trim()) {
      toast.error('Vehicle Number is required');
      return;
    }

    const recordedWeight = scenario === 'others' ? tareWeight : grossWeight;
    if (recordedWeight <= 0) {
      toast.error(`Please click [GET WT] to record initial ${scenario === 'others' ? 'Tare' : 'Gross'} Weight first`);
      return;
    }

    if (scenario === 'with_po' && !purchasingDoc.trim()) {
      toast.error('SAP Purchase Order Number is required for With PO flow');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        scenario: scenario,
        plant: plant || 'PL01',
        grossWeight: scenario === 'others' ? undefined : grossWeight,
        tareWeight: scenario === 'others' ? tareWeight : undefined,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        transporter: transport || undefined,
        challanNo: challanNo || undefined,
        challanWeight: challanWeight ? Number(challanWeight) : undefined,
        challanDate: challanDate || undefined,
        poNumber: scenario === 'with_po' ? purchasingDoc : undefined,
        itemNo: scenario === 'with_po' ? itemNo : undefined,
        vendorCode: vendorCode || undefined,
        vendorName: vendorName || undefined,
        materialCode: materialCode || undefined,
        materialName: materialName || undefined,
        customerName: scenario === 'others' ? customerName : undefined,
        destinationSite: scenario === 'others' ? destinationSite : undefined,
        driverName: driverName || 'Inbound Driver',
        notes: `Gate In: ${scenario.toUpperCase()} | Vehicle: ${vehicleNumber} | Operator: ${user?.name || 'Ramesh Kulkarni'}`,
        evidenceImages: Array.from(new Set([ftpEvidence?.imageUrl, ...Object.values(capturedPhotos)].filter(Boolean))) as string[],
        userData: {
          userId: user?.id || 'USR-003',
          username: user?.username || 'weighbridge.op',
          name: user?.name || 'Ramesh Kulkarni',
          operatorName: user?.name || 'Ramesh Kulkarni',
          roleId: user?.roleId || 'weighbridge_operator',
          department: user?.department || 'Weighbridge Operations',
          shift: user?.shift || 'Morning Shift',
          plantCode: plant || 'PL01'
        }
      };

      const res = await api.postWeighbridgeGateIn(payload);

      if (res && res.success && res.ticketNumber) {
        setIssuedTicketNumber(res.ticketNumber);
        setIssuedTicketModalOpen(true);
        fetchActiveCount();

        toast.success(`Gate-In Complete! Ticket Issued: ${res.ticketNumber}`, {
          description: `First Weight: ${res.firstWeight.toLocaleString()} KG (${res.firstWeightType})`
        });

        if (onSessionUpdated) {
          onSessionUpdated({
            vehicleRegNo: vehicleNumber,
            driverName: driverName || 'Inbound Driver',
            material: materialName || 'Cement',
            grossWeight: scenario === 'others' ? undefined : grossWeight,
            tareWeight: scenario === 'others' ? tareWeight : undefined,
            sapPoNumber: purchasingDoc || undefined,
          });
        }
      } else {
        toast.error('Failed to issue Gate-In ticket');
      }
    } catch (err: any) {
      toast.error('Gate-In Error: ' + (err.message || 'Server error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Gate Out Save Handler
  const handleGateOutSave = async () => {
    if (!loadedGateInRecord) {
      toast.error('Please search or select an active in-plant vehicle first');
      return;
    }

    const secondWeight = loadedGateInRecord.scenario === 'others' ? grossWeight : tareWeight;
    if (secondWeight <= 0) {
      toast.error(`Please click [GET WT] to record second ${loadedGateInRecord.scenario === 'others' ? 'Gross' : 'Tare'} Weight`);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ticketNumber: loadedGateInRecord.ticketNumber,
        tareWeight: loadedGateInRecord.scenario === 'others' ? undefined : tareWeight,
        grossWeight: loadedGateInRecord.scenario === 'others' ? grossWeight : undefined,
        notes: `Gate Out Final Weighment: ${loadedGateInRecord.vehicleNumber} | Operator: ${user?.name || 'Ramesh Kulkarni'}`,
        evidenceImages: Array.from(new Set([ftpEvidence?.imageUrl, ...Object.values(capturedPhotos)].filter(Boolean))) as string[],
        userData: {
          userId: user?.id || 'USR-003',
          username: user?.username || 'weighbridge.op',
          name: user?.name || 'Ramesh Kulkarni',
          operatorName: user?.name || 'Ramesh Kulkarni',
          roleId: user?.roleId || 'weighbridge_operator',
          department: user?.department || 'Weighbridge Operations',
          shift: user?.shift || 'Morning Shift',
          plantCode: plant || 'PL01'
        }
      };

      const res = await api.postWeighbridgeGateOut(payload);

      if (res && res.success) {
        setSavedSuccessDoc(res.sapDocNumber || 'MIGO-POSTED');
        fetchActiveCount();

        // Prepare print slip data
        const printPayload: WeighbridgeSlipData = {
          type: 'final_weigh_slip',
          ticketNumber: res.ticketNumber,
          scenario: loadedGateInRecord.scenario,
          plant: loadedGateInRecord.plant || 'PL01',
          vehicleNumber: loadedGateInRecord.vehicleNumber,
          transporter: loadedGateInRecord.transporter,
          driverName: loadedGateInRecord.driverName,
          poNumber: loadedGateInRecord.poNumber,
          itemNo: loadedGateInRecord.itemNo,
          vendorName: loadedGateInRecord.vendorName,
          vendorCode: loadedGateInRecord.vendorCode,
          materialName: loadedGateInRecord.materialName,
          materialCode: loadedGateInRecord.materialCode,
          customerName: loadedGateInRecord.customerName,
          destinationSite: loadedGateInRecord.destinationSite,
          challanNo: loadedGateInRecord.challanNo,
          challanWeight: loadedGateInRecord.challanWeight,
          challanDate: loadedGateInRecord.challanDate,
          firstWeight: Number(loadedGateInRecord.firstWeight),
          firstWeightType: loadedGateInRecord.firstWeightType,
          secondWeight: Number(secondWeight),
          secondWeightType: loadedGateInRecord.scenario === 'others' ? 'GROSS' : 'TARE',
          grossWeight: res.grossWeight,
          tareWeight: res.tareWeight,
          netWeight: res.netWeight,
          gateInTime: loadedGateInRecord.gateInTime,
          gateOutTime: new Date().toLocaleString(),
          gateInOperator: loadedGateInRecord.gateInOperatorName || 'Ramesh Kulkarni',
          gateOutOperator: user?.name || 'Ramesh Kulkarni',
          sapDocNumber: res.sapDocNumber,
          slipNumber: res.slipNumber,
        };

        setSlipData(printPayload);
        setSlipModalOpen(true);

        toast.success(`Gate-Out Complete! SAP Document #${res.sapDocNumber}`, {
          description: `Net Material Weight: ${(res.netWeight / 1000).toFixed(2)} MT`
        });

        if (onSessionUpdated) {
          onSessionUpdated({
            vehicleRegNo: loadedGateInRecord.vehicleNumber,
            driverName: loadedGateInRecord.driverName || 'Inbound Driver',
            material: loadedGateInRecord.materialName || 'Cement',
            grossWeight: res.grossWeight,
            tareWeight: res.tareWeight,
            netWeight: res.netWeight,
            sapDocNumber: res.sapDocNumber,
            sapPoNumber: loadedGateInRecord.poNumber,
          });
        }
      } else {
        toast.error('Gate-Out failed: ' + (res?.message || 'Server error'));
      }
    } catch (err: any) {
      toast.error('Gate-Out Error: ' + (err.message || 'Server error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to open Gate-In Token Pass print
  const handlePrintGateInPass = () => {
    if (!issuedTicketNumber) return;
    const printPayload: WeighbridgeSlipData = {
      type: 'gate_in_token',
      ticketNumber: issuedTicketNumber,
      scenario: scenario,
      plant: plant || 'PL01',
      vehicleNumber: vehicleNumber,
      transporter: transport,
      driverName: driverName,
      poNumber: purchasingDoc,
      itemNo: itemNo,
      vendorName: vendorName,
      vendorCode: vendorCode,
      materialName: materialName,
      materialCode: materialCode,
      customerName: customerName,
      destinationSite: destinationSite,
      challanNo: challanNo,
      challanWeight: challanWeight ? Number(challanWeight) : undefined,
      challanDate: challanDate,
      firstWeight: scenario === 'others' ? tareWeight : grossWeight,
      firstWeightType: scenario === 'others' ? 'TARE' : 'GROSS',
      gateInTime: `${truckInDate} ${truckInTime}`,
      gateInOperator: user?.name || 'Ramesh Kulkarni',
    };
    setSlipData(printPayload);
    setSlipModalOpen(true);
  };

  // Switch to Gate-Out for this freshly issued ticket
  const handleProceedToGateOutFromTicket = () => {
    if (!issuedTicketNumber) return;
    setIssuedTicketModalOpen(false);
    setMode('gate_out');
    setSearchTicketQuery(issuedTicketNumber);
    handleSearchTicket(issuedTicketNumber);
  };

  // Reset form for next vehicle
  const handleNextVehicle = () => {
    setIssuedTicketModalOpen(false);
    setIssuedTicketNumber(null);
    setSavedSuccessDoc(null);
    setLoadedGateInRecord(null);
    setGrossWeight(0);
    setTareWeight(0);
    setVehicleNumber('');
    setDriverName('');
    setFtpEvidence(null);
    setChallanNo(`CH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  if (!isOpen) return null;

  // Real-time calculated net kg
  const calculatedNetKg = grossWeight > 0 && tareWeight > 0 ? Math.max(0, grossWeight - tareWeight) : 0;
  const numChallanKg = challanWeight ? Number(challanWeight) : 0;
  const challanVarianceKg = numChallanKg > 0 && calculatedNetKg > 0 ? calculatedNetKg - numChallanKg : 0;

  const windowFrame = (
    <>
      <div 
        className={`bg-[#e5d4be] text-slate-900 border-2 border-[#b09371] shadow-2xl rounded-sm flex flex-col transition-all duration-200 ${
        isFullscreen 
          ? 'fixed inset-0 z-50 w-full h-full max-w-none max-h-none rounded-none' 
          : embedded 
            ? 'w-full min-h-[85vh] rounded-md' 
            : 'w-full max-w-6xl max-h-[94vh]'
      }`}
      style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}
    >
      {/* ===================== 1. SAP GUI TOP ACTION BAR ===================== */}
      <div className="bg-[#ede1d1] border-b border-[#c8aa86] px-2 sm:px-3 py-1 flex items-center justify-between text-xs select-none">
        {/* Left: SAP Green Checkmark + Fastpath Command Box + Navigation Icons */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          {/* Green checkmark button (Enter) */}
          <button
            type="button"
            onClick={handleGetWeight}
            title="Enter / Refresh Weight"
            className="h-6 w-6 rounded-full bg-[#15803d] hover:bg-[#166534] active:bg-[#14532d] flex items-center justify-center text-white shadow cursor-pointer border border-[#14532d]"
          >
            <Check className="h-4 w-4 stroke-[3]" />
          </button>

          {/* Fastpath Transaction input */}
          <div className="flex items-center border border-[#9ca3af] bg-white rounded-none px-1.5 py-0.5 shadow-inner">
            <span className="font-mono text-[11px] text-slate-800 font-bold">
              {mode === 'gate_in' ? '/nZWB_GATEIN' : '/nZWB_GATEOUT'}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-500 ml-1 cursor-pointer" />
          </div>

          {/* Explicit Back to Selection Screen Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            title="Back to SAP Gate-to-Weighbridge Selection"
            className="h-6 text-[11px] px-2.5 bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-400 font-bold flex items-center gap-1 shadow-xs ml-1 cursor-pointer"
          >
            <span>⮌ Back to Selection Screen</span>
          </Button>

          <div className="h-4 w-px bg-slate-400 mx-1 hidden sm:block" />

          {/* Classic SAP GUI Icons */}
          <div className="flex items-center gap-0.5 text-slate-700">
            <button 
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              title="Save (Ctrl+S)"
              className="p-1 hover:bg-[#dfcbaf] rounded text-slate-800"
            >
              <Save className="h-3.5 w-3.5" />
            </button>
            <button 
              type="button"
              onClick={onClose}
              title="Back (F3)"
              className="p-1 hover:bg-[#dfcbaf] rounded text-amber-800"
            >
              <span className="inline-block h-3.5 w-3.5 rounded-full bg-amber-400 border border-amber-600 text-[10px] leading-3 text-center font-bold">⮌</span>
            </button>
            <button 
              type="button"
              onClick={onClose}
              title="Exit (Shift+F3)"
              className="p-1 hover:bg-[#dfcbaf] rounded text-red-800"
            >
              <span className="inline-block h-3.5 w-3.5 rounded-full bg-red-500 text-white border border-red-700 text-[10px] leading-3 text-center font-bold">⇧</span>
            </button>
            <button 
              type="button"
              onClick={onClose}
              title="Cancel (F12)"
              className="p-1 hover:bg-[#dfcbaf] rounded text-red-800"
            >
              <span className="inline-block h-3.5 w-3.5 rounded-full bg-red-600 text-white border border-red-800 text-[10px] leading-3 text-center font-bold">✖</span>
            </button>
            <span className="text-slate-400 mx-0.5">|</span>
            <button 
              type="button"
              onClick={() => window.print()}
              title="Print"
              className="p-1 hover:bg-[#dfcbaf] rounded"
            >
              <Printer className="h-3.5 w-3.5" />
            </button>
            {scenario === 'with_po' && mode === 'gate_in' && (
              <button 
                type="button"
                onClick={() => setPoPickerOpen(true)}
                title="Find SAP PO"
                className="p-1 hover:bg-[#dfcbaf] rounded"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            )}
            <button 
              type="button"
              onClick={fetchActiveCount}
              title="Refresh In-Plant Count"
              className="p-1 hover:bg-[#dfcbaf] rounded"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Window Controls & Active Count */}
        <div className="flex items-center gap-1.5">
          {/* Active In-Plant Vehicles Drawer Trigger */}
          <button
            type="button"
            onClick={() => setActiveTicketsDrawerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-100 hover:bg-blue-200 border border-blue-400 text-blue-950 font-bold text-[11px] cursor-pointer shadow-xs transition-all"
            title="View all vehicles currently inside the plant awaiting Gate-Out"
          >
            <Truck className="h-3.5 w-3.5 text-blue-800" />
            <span>In-Plant: {activeInPlantCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setSapModalOpen(true)}
            className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[10px] font-mono text-emerald-800 font-bold cursor-pointer transition-all shadow-2xs"
            title="Click to open SAP S/4HANA Connection Manager & Live Handshake"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>PRD_S4H (100) • 16ms</span>
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 hover:bg-[#dfcbaf] rounded text-slate-800"
            title={isFullscreen ? "Restore window" : "Maximize window"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-red-200 rounded text-red-700"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ===================== 2. TAN RIBBON TITLE & MODE SWITCHER ===================== */}
      <div className="bg-gradient-to-r from-[#decca5] via-[#e8d8b8] to-[#decca5] border-b border-[#be9f77] px-4 py-2 flex flex-wrap items-center justify-between shadow-sm gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-serif italic font-extrabold text-lg sm:text-xl text-[#1e232a] tracking-tight">
            SAP Third-Party Weighbridge Integration
          </span>

          {/* DUAL MODE TOGGLE BUTTONS */}
          <div className="inline-flex rounded border border-[#a88a65] bg-[#dfcbaf] p-0.5 text-xs font-bold shadow-xs">
            <button
              type="button"
              onClick={() => {
                setMode('gate_in');
                setSavedSuccessDoc(null);
              }}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                mode === 'gate_in'
                  ? 'bg-[#1e2a38] text-amber-300 shadow-sm'
                  : 'text-slate-800 hover:text-black'
              }`}
            >
              <Truck className="h-3.5 w-3.5" />
              <span>1. GATE IN (First Weighment)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('gate_out');
                setSavedSuccessDoc(null);
              }}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                mode === 'gate_out'
                  ? 'bg-[#1e2a38] text-amber-300 shadow-sm'
                  : 'text-slate-800 hover:text-black'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>2. GATE OUT (Second Weighment & MIGO)</span>
            </button>
          </div>

          <Badge variant="outline" className="bg-[#ede1d1] text-[#1e232a] border-[#bca182] font-mono text-[11px]">
            {mode === 'gate_in' ? 'T-Code: ZWB_GATEIN' : 'T-Code: ZWB_GATEOUT'}
          </Badge>
        </div>

        {/* Right Header Status */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-700">Target for [GET WT]:</span>
          <div className="inline-flex rounded-sm border border-[#a88a65] bg-[#dfcbaf] p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setWeightTarget('gross')}
              className={`px-2 py-0.5 rounded-xs transition-colors ${
                weightTarget === 'gross' 
                  ? 'bg-[#1e293b] text-white shadow-xs' 
                  : 'text-slate-800 hover:text-black'
              }`}
            >
              Gross Weight
            </button>
            <button
              type="button"
              onClick={() => setWeightTarget('tare')}
              className={`px-2 py-0.5 rounded-xs transition-colors ${
                weightTarget === 'tare' 
                  ? 'bg-[#1e293b] text-white shadow-xs' 
                  : 'text-slate-800 hover:text-black'
              }`}
            >
              Tare Weight
            </button>
          </div>
        </div>
      </div>

      {/* ===================== 3. MAIN CONTENT SCROLL AREA ===================== */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 bg-[#f8f3eb]">
        
        {/* ===================== IF IN GATE OUT MODE: TICKET SEARCH BAR ===================== */}
        {mode === 'gate_out' && (
          <div className="bg-[#ede1d1] border-2 border-[#b09371] p-3.5 rounded shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Ticket className="h-4 w-4 text-[#8a6840]" />
                Retrieve Gate-In Transaction Details for Gate-Out:
              </span>
              <button
                type="button"
                onClick={() => setActiveTicketsDrawerOpen(true)}
                className="text-xs text-blue-900 hover:text-blue-950 font-bold underline flex items-center gap-1 cursor-pointer"
              >
                <span>Select from {activeInPlantCount} active vehicles inside plant</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter Ticket Number (e.g. TK-20261029-6026) or Vehicle Plate Number..."
                  value={searchTicketQuery}
                  onChange={(e) => setSearchTicketQuery(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearchTicket();
                  }}
                  className="w-full h-8 px-3 pr-8 bg-white border-2 border-[#a88a65] font-mono text-xs font-bold uppercase"
                />
              </div>

              <Button
                size="sm"
                onClick={() => handleSearchTicket()}
                disabled={isSearchingTicket || !searchTicketQuery.trim()}
                className="h-8 text-xs bg-[#1e2a38] text-amber-300 hover:bg-slate-800 font-bold px-4 gap-1.5 cursor-pointer shadow-xs"
              >
                <Search className={`h-3.5 w-3.5 ${isSearchingTicket ? 'animate-spin' : ''}`} />
                <span>{isSearchingTicket ? 'Searching SAP...' : 'Retrieve Gate-In'}</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveTicketsDrawerOpen(true)}
                className="h-8 text-xs bg-[#dfcbaf] hover:bg-[#d0b99a] text-slate-900 border-[#a88a65] font-bold gap-1 cursor-pointer"
              >
                <Truck className="h-3.5 w-3.5 text-slate-800" />
                <span>Browse In-Plant</span>
              </Button>
            </div>

            {loadedGateInRecord && (
              <div className="bg-emerald-50 border border-emerald-400 p-2 rounded flex items-center justify-between text-xs text-emerald-950">
                <div className="flex items-center gap-2 flex-wrap">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  <span>Active Ticket: <strong className="font-mono text-sm">{loadedGateInRecord.ticketNumber}</strong></span>
                  <span>• Vehicle: <strong className="font-mono">{loadedGateInRecord.vehicleNumber}</strong></span>
                  <span>• First Wt ({loadedGateInRecord.firstWeightType}): <strong className="font-mono">{Number(loadedGateInRecord.firstWeight).toLocaleString()} KG</strong></span>
                  <Badge className="bg-emerald-200 text-emerald-900 text-[10px] uppercase font-bold">
                    {loadedGateInRecord.scenario.replace('_', ' ')}
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLoadedGateInRecord(null);
                    setSearchTicketQuery('');
                  }}
                  className="text-slate-500 hover:text-black text-xs font-semibold underline"
                >
                  Clear Ticket
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===================== GROUPBOX: Weighbridge Form ===================== */}
        <div className="border border-[#bca182] bg-[#fdf9f4] p-4 sm:p-5 rounded-xs shadow-xs relative">
          {/* Groupbox Legend Title */}
          <div className="absolute -top-3 left-4 bg-[#fdf9f4] px-2 text-xs font-bold text-slate-800 border border-[#bca182]/50 rounded-xs flex items-center gap-2">
            <span>{mode === 'gate_in' ? 'Weighbridge Inbound — Gate In' : 'Weighbridge Outbound — Gate Out'}</span>
            <Badge variant="outline" className="text-[10px] font-mono bg-[#dfcbaf]">
              {scenario === 'with_po' ? '1. With PO' : scenario === 'without_po' ? '2. Without PO' : '3. Others (Sales)'}
            </Badge>
          </div>

          {/* Scenario Radio Selector (When in Gate In mode) */}
          {mode === 'gate_in' && (
            <div className="mb-4 pt-1 border-b border-[#d6c4ae] pb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800">Select Inbound Scenario:</span>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="scenario_select"
                    checked={scenario === 'with_po'}
                    onChange={() => setScenario('with_po')}
                    className="accent-[#1e2a38]"
                  />
                  <span className="font-bold">1. With PO (Movement 101)</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="scenario_select"
                    checked={scenario === 'without_po'}
                    onChange={() => setScenario('without_po')}
                    className="accent-[#1e2a38]"
                  />
                  <span className="font-bold">2. Without PO (Movement 501)</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="scenario_select"
                    checked={scenario === 'others'}
                    onChange={() => setScenario('others')}
                    className="accent-[#1e2a38]"
                  />
                  <span className="font-bold">3. Others (Sales / Outward Dispatch)</span>
                </label>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            
            {/* LEFT 7 COLUMNS: ALL SAP FIELDS */}
            <div className="lg:col-span-7 space-y-2.5 text-xs">
              
              {/* 1. Plant */}
              <div className="grid grid-cols-12 items-center gap-2">
                <label className="col-span-4 font-semibold text-slate-800 flex items-center gap-1">
                  <span>Plant</span>
                </label>
                <div className="col-span-8 flex items-center gap-1.5">
                  <button 
                    type="button" 
                    className="h-5 w-5 bg-[#dfcbaf] border border-[#a88a65] flex items-center justify-center text-[10px] shadow-xs cursor-pointer"
                    title="Matchcode Plant"
                  >
                    ☑
                  </button>
                  <input
                    type="text"
                    value={plant}
                    onChange={(e) => setPlant(e.target.value)}
                    className="h-6 w-20 px-2 bg-white border border-[#7f9db9] font-mono text-xs uppercase"
                  />
                  <span className="text-[11px] text-slate-500 font-medium">(Shamshabad Central)</span>
                </div>
              </div>

              {/* 2. Purchasing Doc. & Item (Only for With PO) */}
              {scenario === 'with_po' && (
                <div className="grid grid-cols-12 items-center gap-2">
                  <label className="col-span-4 font-semibold text-slate-800">
                    Purchasing Doc.
                  </label>
                  <div className="col-span-8 flex items-center gap-2">
                    <div className="relative flex-1 flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={purchasingDoc}
                          onChange={(e) => {
                            setPurchasingDoc(e.target.value);
                            setPoRfcResult(null);
                          }}
                          placeholder="e.g. 4500128490"
                          className="h-6 w-full px-2 pr-6 bg-white border border-[#7f9db9] font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setPoPickerOpen(true)}
                          className="absolute right-1 top-1 text-slate-500 hover:text-black cursor-pointer"
                          title="Search Purchase Orders"
                        >
                          <Search className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCheckPoRfc()}
                        disabled={isCheckingPoRfc || !purchasingDoc.trim()}
                        className="h-6 px-2 bg-[#dfcbaf] hover:bg-[#d0b99a] active:bg-[#c2aa8a] border border-[#a88a65] rounded-xs text-[10px] font-bold text-slate-900 shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        title="Check PO open quantity and validity in SAP via RFC BAPI_PO_GETDETAIL1"
                      >
                        <RefreshCw className={`h-3 w-3 text-blue-900 ${isCheckingPoRfc ? 'animate-spin' : ''}`} />
                        <span>RFC Check</span>
                      </button>
                    </div>

                    <span className="font-semibold text-slate-800">Item</span>
                    <select
                      value={itemNo}
                      onChange={(e) => setItemNo(e.target.value)}
                      className="h-6 px-1.5 bg-white border border-[#7f9db9] text-xs font-mono"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="30">30</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 3. Material (Code + Description) */}
              <div className="grid grid-cols-12 items-center gap-2">
                <label className="col-span-4 font-semibold text-slate-800">
                  Material
                </label>
                <div className="col-span-8 flex items-center gap-2">
                  <input
                    type="text"
                    value={materialCode}
                    onChange={(e) => setMaterialCode(e.target.value)}
                    placeholder="MAT-CEM-OPC53"
                    className="h-6 w-32 px-2 bg-white border border-[#7f9db9] font-mono text-xs"
                  />
                  <input
                    type="text"
                    value={materialName}
                    onChange={(e) => setMaterialName(e.target.value)}
                    placeholder="Material Description"
                    className="h-6 flex-1 px-2 bg-white border border-[#7f9db9] text-slate-800 text-xs truncate"
                  />
                </div>
              </div>

              {/* 4. Vehicle Number */}
              <div className="grid grid-cols-12 items-center gap-2">
                <label className="col-span-4 font-semibold text-slate-800 flex items-center gap-1">
                  <span>Vehicle Number</span>
                </label>
                <div className="col-span-8 flex items-center gap-1.5">
                  <button 
                    type="button" 
                    onClick={() => {
                      toast.info(`Synced Vehicle from ANPR Camera: ${vehicleNumber}`);
                    }}
                    className="h-5 w-5 bg-[#dfcbaf] border border-[#a88a65] flex items-center justify-center text-[10px] shadow-xs cursor-pointer"
                    title="Sync from ANPR OCR Camera"
                  >
                    ☑
                  </button>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. TS09UB5678"
                    className="h-6 w-36 px-2 bg-white border border-[#7f9db9] font-mono font-bold text-xs uppercase"
                  />
                  {scenario === 'with_po' && (
                    <button
                      type="button"
                      onClick={() => handleCheckVehicleRfc()}
                      disabled={isCheckingVehicleRfc || !vehicleNumber.trim()}
                      className="h-6 px-2 bg-[#dfcbaf] hover:bg-[#d0b99a] active:bg-[#c2aa8a] border border-[#a88a65] rounded-xs text-[10px] font-bold text-slate-900 shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                      title="Check vehicle in SAP via RFC to auto-match PO and vendor"
                    >
                      <Sparkles className={`h-3 w-3 text-amber-700 ${isCheckingVehicleRfc ? 'animate-spin' : ''}`} />
                      <span>RFC Match</span>
                    </button>
                  )}
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300">
                    CAM OCR Matched
                  </Badge>
                </div>
              </div>

              {/* 5. Transporter */}
              <div className="grid grid-cols-12 items-center gap-2">
                <label className="col-span-4 font-semibold text-slate-800">
                  Transporter
                </label>
                <div className="col-span-8">
                  <input
                    type="text"
                    value={transport}
                    onChange={(e) => setTransport(e.target.value)}
                    placeholder="Transporter Name"
                    className="h-6 w-full max-w-sm px-2 bg-white border border-[#7f9db9] text-xs"
                  />
                </div>
              </div>

              {/* 6. Vendor or Customer (depending on scenario) */}
              {scenario === 'others' ? (
                <>
                  <div className="grid grid-cols-12 items-center gap-2">
                    <label className="col-span-4 font-semibold text-slate-800">
                      Customer / Client
                    </label>
                    <div className="col-span-8">
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Customer Name"
                        className="h-6 w-full max-w-md px-2 bg-white border border-[#7f9db9] text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-12 items-center gap-2">
                    <label className="col-span-4 font-semibold text-slate-800">
                      Destination Site
                    </label>
                    <div className="col-span-8">
                      <input
                        type="text"
                        value={destinationSite}
                        onChange={(e) => setDestinationSite(e.target.value)}
                        placeholder="Destination Site / Yard"
                        className="h-6 w-full max-w-md px-2 bg-white border border-[#7f9db9] text-xs"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-12 items-center gap-2">
                  <label className="col-span-4 font-semibold text-slate-800">
                    Vendor
                  </label>
                  <div className="col-span-8 flex items-center gap-2">
                    <input
                      type="text"
                      value={vendorCode}
                      onChange={(e) => setVendorCode(e.target.value)}
                      placeholder="VEND-10023"
                      className="h-6 w-24 px-2 bg-white border border-[#7f9db9] font-mono text-xs"
                    />
                    <input
                      type="text"
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      placeholder="Vendor Name"
                      className="h-6 flex-1 max-w-xs px-2 bg-white border border-[#7f9db9] text-xs"
                    />
                  </div>
                </div>
              )}

              {/* 7. Challan No (Inbound) */}
              {scenario !== 'others' && (
                <div className="grid grid-cols-12 items-center gap-2">
                  <label className="col-span-4 font-semibold text-slate-800">
                    Challan No
                  </label>
                  <div className="col-span-8">
                    <input
                      type="text"
                      value={challanNo}
                      onChange={(e) => setChallanNo(e.target.value)}
                      placeholder="Supplier Challan Number"
                      className="h-6 w-48 px-2 bg-white border border-[#7f9db9] font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {/* 8. Challan Weight & Date (Inbound) */}
              {scenario !== 'others' && (
                <>
                  <div className="grid grid-cols-12 items-center gap-2">
                    <label className="col-span-4 font-semibold text-slate-800">
                      Challan Weight
                    </label>
                    <div className="col-span-8 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={challanWeight}
                        onChange={(e) => setChallanWeight(e.target.value)}
                        placeholder="e.g. 24500.00"
                        className="h-6 w-36 px-2 bg-white border border-[#7f9db9] font-mono text-xs"
                      />
                      <span className="text-[11px] text-slate-600 font-semibold">KG</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 items-center gap-2">
                    <label className="col-span-4 font-semibold text-slate-800">
                      Challan Date
                    </label>
                    <div className="col-span-8">
                      <input
                        type="text"
                        value={challanDate}
                        onChange={(e) => setChallanDate(e.target.value)}
                        placeholder="DD.MM.YYYY"
                        className="h-6 w-28 px-2 bg-white border border-[#7f9db9] font-mono text-xs"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* RIGHT 5 COLUMNS: WEIGHT FIELDS, CLOCK, AND SAP ACTION BUTTONS */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4 border-l border-[#d6c4ae] pl-0 lg:pl-6 text-xs">
              
              {/* Weights Block */}
              <div className="space-y-3">
                
                {/* Gross weight input */}
                <div className="grid grid-cols-12 items-center gap-2">
                  <label className="col-span-4 font-semibold text-slate-800">
                    Gross weight
                  </label>
                  <div className="col-span-8">
                    <div className="relative">
                      <input
                        type="text"
                        value={grossWeight > 0 ? grossWeight.toFixed(3) : '0.000'}
                        readOnly
                        className={`h-7 w-full px-2.5 font-mono text-sm font-bold border ${
                          grossWeight > 0 
                            ? 'bg-amber-50 text-amber-950 border-amber-400' 
                            : 'bg-white text-slate-700 border-[#7f9db9]'
                        }`}
                      />
                      {weightTarget === 'gross' && (
                        <span className="absolute right-2 top-1 text-[10px] text-amber-600 font-bold uppercase">
                          Target
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tare weight input */}
                <div className="grid grid-cols-12 items-center gap-2">
                  <label className="col-span-4 font-semibold text-slate-800 flex items-center gap-1">
                    <span>Tare weight</span>
                    <span className="text-[10px] text-blue-700 font-mono font-bold">*</span>
                  </label>
                  <div className="col-span-8">
                    <div className="relative">
                      <input
                        type="text"
                        value={tareWeight > 0 ? tareWeight.toFixed(3) : '0.000'}
                        readOnly
                        className={`h-7 w-full px-2.5 font-mono text-sm font-bold border ${
                          tareWeight > 0 
                            ? 'bg-blue-50 text-blue-950 border-blue-400' 
                            : 'bg-white text-slate-700 border-[#7f9db9]'
                        }`}
                      />
                      {weightTarget === 'tare' && (
                        <span className="absolute right-2 top-1 text-[10px] text-blue-600 font-bold uppercase">
                          Target
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Net weight (Auto calculated: Gross - Tare) */}
                <div className="grid grid-cols-12 items-center gap-2">
                  <label className="col-span-4 font-bold text-slate-900">
                    Net weight
                  </label>
                  <div className="col-span-8">
                    <div className="h-7 w-full px-2.5 flex items-center justify-between font-mono text-sm font-extrabold bg-[#e8f5e9] text-[#1b5e20] border border-[#81c784]">
                      <span>{calculatedNetKg.toFixed(3)}</span>
                      <span className="text-xs font-sans font-semibold">({(calculatedNetKg / 1000).toFixed(2)} MT)</span>
                    </div>
                  </div>
                </div>

                {/* Challan Variance display if in Gate Out */}
                {mode === 'gate_out' && numChallanKg > 0 && calculatedNetKg > 0 && (
                  <div className="grid grid-cols-12 items-center gap-2">
                    <label className="col-span-4 font-semibold text-slate-800">
                      Variance
                    </label>
                    <div className="col-span-8">
                      <div className={`h-6 px-2 flex items-center justify-between font-mono text-xs font-bold rounded border ${
                        Math.abs(challanVarianceKg) <= 100 
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-400' 
                          : 'bg-amber-100 text-amber-900 border-amber-400'
                      }`}>
                        <span>{challanVarianceKg >= 0 ? `+${challanVarianceKg}` : challanVarianceKg} KG</span>
                        <span className="text-[10px]">({((challanVarianceKg / numChallanKg) * 100).toFixed(2)}%)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Truck In Date & Time */}
                <div className="grid grid-cols-12 items-center gap-2">
                  <label className="col-span-4 font-semibold text-slate-800">
                    Truck In Time
                  </label>
                  <div className="col-span-8 flex items-center gap-2">
                    <input
                      type="text"
                      value={`${truckInDate} ${truckInTime}`}
                      readOnly
                      className="h-6 w-full px-2 bg-[#fdfaf5] border border-[#a88a65] font-mono text-xs font-semibold text-slate-800"
                    />
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Live clock" />
                  </div>
                </div>
              </div>

              {/* Live Scale Telemetry Mini Bar */}
              <div className="p-2.5 bg-[#f0e4d0] border border-[#c5ab8d] rounded-xs space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <Scale className="h-3.5 w-3.5 text-slate-700" />
                    Live Weighbridge Scale:
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] font-mono ${
                      currentWeight.stable 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-400' 
                        : 'bg-amber-100 text-amber-800 border-amber-400 animate-pulse'
                    }`}
                  >
                    {currentWeight.stable ? '● STABLE' : '◌ MOTION'}
                  </Badge>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="font-mono text-xl font-black text-slate-950">
                    {currentWeight.weight.toLocaleString()} <span className="text-xs font-normal font-sans">KG</span>
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-700">
                    {(currentWeight.weight / 1000).toFixed(2)} Metric Tons
                  </span>
                </div>
              </div>

              {/* ACTION BUTTONS: GET WT & SAVE */}
              <div className="pt-2 flex items-center justify-end gap-3">
                {/* [ 🚚 GET WT ] Button */}
                <button
                  type="button"
                  onClick={handleGetWeight}
                  className="px-4 py-1.5 bg-[#dfcbaf] hover:bg-[#d0b99a] active:bg-[#c2aa8a] border-2 border-t-[#f5e8d8] border-l-[#f5e8d8] border-b-[#9e8365] border-r-[#9e8365] rounded-xs text-slate-900 text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Truck className="h-4 w-4 text-amber-800" />
                  <span>GET WT ({weightTarget.toUpperCase()})</span>
                </button>

                {/* [ 💾 SAVE ] Button */}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-1.5 bg-[#dfcbaf] hover:bg-[#d0b99a] active:bg-[#c2aa8a] border-2 border-t-[#f5e8d8] border-l-[#f5e8d8] border-b-[#9e8365] border-r-[#9e8365] rounded-xs text-slate-900 text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 text-blue-800" />
                  <span>
                    {isSaving 
                      ? 'COMMUNICATING WITH SAP...' 
                      : mode === 'gate_in' 
                        ? 'SAVE & ISSUE TICKET' 
                        : 'SAVE & POST TO SAP (GATE OUT)'
                    }
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== 4. CAMERAS IMAGE FEEDS ===================== */}
        <div className="border border-[#bca182] bg-[#fdf9f4] p-4 rounded-xs shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6c4ae] pb-2">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-slate-800" />
              <span className="font-bold text-xs uppercase tracking-wide text-slate-900">
                Live Cameras Image Feeds & Vehicle Telemetry Captures
              </span>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300">
                3 Feeds Synchronized
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => checkLatestFtpPlate(true)}
                disabled={isCheckingFtp}
                className="h-6 text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                title="Fetch latest vehicle number and evidence snapshot from camera FTP"
              >
                <RefreshCw className={`h-3 w-3 ${isCheckingFtp ? 'animate-spin' : ''}`} />
                <span>{isCheckingFtp ? 'Checking FTP...' : 'Get Vehicle Number'}</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleEdgeScanPlate}
                className="h-6 text-[11px] bg-[#dfcbaf] border-[#a88a65] text-slate-900 hover:bg-[#d0b99a] font-semibold"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Edge ANPR Scan
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={captureSnapshots}
                className="h-6 text-[11px] bg-[#f5ecdf] border-[#bca182] text-slate-800 hover:bg-[#ede0ce]"
              >
                <Camera className="h-3 w-3 mr-1" />
                Capture Photos
              </Button>
            </div>
          </div>

          {/* 3 Camera Feeds Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* CAM 01: ANPR Plate Camera */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-800">CAM 01: ANPR Cam 1</span>
                  <span className="font-mono text-[10px] text-slate-500 font-semibold">(192.168.0.100)</span>
                </div>
                <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-300 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>{ftpEvidence ? 'FTP SNAPSHOT CAPTURED' : 'FTP AUTO-ANPR'}</span>
                </Badge>
              </div>
              <div className="relative rounded overflow-hidden border border-[#bca182] bg-slate-950 aspect-video shadow-inner group">
                {ftpEvidence?.imageUrl ? (
                  <>
                    <img 
                      src={ftpEvidence.imageUrl} 
                      alt="ANPR Cam 1 FTP Capture"
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                    <div className="absolute top-1.5 left-1.5 bg-black/75 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>ANPR CAM 1 • FTP CAPTURED</span>
                    </div>
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/80 backdrop-blur-xs px-2 py-1 rounded text-[10px] text-white flex justify-between items-center">
                      <span className="font-mono text-emerald-400 font-bold text-xs tracking-wider">
                        {vehicleNumber || ftpEvidence.plate}
                      </span>
                      <button 
                        type="button"
                        onClick={() => setPreviewImage(ftpEvidence.imageUrl)}
                        className="text-[10px] text-amber-300 hover:text-amber-100 flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Maximize2 className="h-3 w-3" />
                        <span>Enlarge</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <video 
                      ref={cam1VideoRef} 
                      playsInline 
                      muted 
                      autoPlay 
                      className={`w-full h-full object-cover ${cam1HlsActive ? 'block' : 'hidden'}`}
                    />
                    <canvas 
                      ref={cam1CanvasRef} 
                      width={640} 
                      height={360} 
                      className={`w-full h-full object-cover ${cam1HlsActive ? 'hidden' : 'block'}`}
                    />
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-white flex justify-between items-center">
                      <span className="font-mono text-emerald-400 font-bold">{vehicleNumber || (cam1HlsActive ? 'LIVE RTSP STREAM' : 'SEARCHING FTP...')}</span>
                      <span className="text-slate-300 font-mono">{cam1HlsActive ? '3K UHD • Live' : 'Conf: 98.8%'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* CAM 02: Scale Deck Camera */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-800">CAM 02: Scale Platform Bay</span>
                  <span className="font-mono text-[10px] text-slate-500 font-semibold">(192.168.0.99)</span>
                </div>
                <Badge variant="outline" className={`text-[9px] border-blue-300 flex items-center gap-1 ${cam2HlsActive ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-blue-50 text-blue-700'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${cam2HlsActive ? 'bg-emerald-600 animate-ping' : 'bg-blue-600 animate-pulse'}`} />
                  <span>{cam2HlsActive ? 'LIVE IP CAMERA' : 'AUTO LIVE DETECT'}</span>
                </Badge>
              </div>
              <div className="relative rounded overflow-hidden border border-[#bca182] bg-slate-950 aspect-video shadow-inner group">
                <video 
                  ref={cam2VideoRef} 
                  playsInline 
                  muted 
                  autoPlay 
                  className={`w-full h-full object-cover ${cam2HlsActive ? 'block' : 'hidden'}`}
                />
                <canvas 
                  ref={cam2CanvasRef} 
                  width={640} 
                  height={360} 
                  className={`w-full h-full object-cover ${cam2HlsActive ? 'hidden' : 'block'}`}
                />
                <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/75 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-white flex justify-between items-center">
                  <span className="font-mono text-amber-300 font-bold">Scale Deck 1 • {(currentWeight.weight / 1000).toFixed(2)} MT</span>
                  <span className={`font-mono text-[10px] font-bold ${currentWeight.stable ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
                    {currentWeight.stable ? `${currentWeight.weight} KG (STABLE)` : `${currentWeight.weight} KG (MOTION)`}
                  </span>
                </div>
              </div>
            </div>

            {/* CAM 03: Driver & Chute */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-800">CAM 03: Driver & Chute Seal</span>
                  <span className="font-mono text-[10px] text-slate-500 font-semibold">(Side View)</span>
                </div>
                <Badge variant="outline" className={`text-[9px] border-purple-300 ${cam3HlsActive ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-purple-50 text-purple-700'}`}>
                  {cam3HlsActive ? 'LIVE STREAM' : 'SEAL OK'}
                </Badge>
              </div>
              <div className="relative rounded overflow-hidden border border-[#bca182] bg-slate-950 aspect-video shadow-inner">
                <video 
                  ref={cam3VideoRef} 
                  playsInline 
                  muted 
                  autoPlay 
                  className={`w-full h-full object-cover ${cam3HlsActive ? 'block' : 'hidden'}`}
                />
                <canvas 
                  ref={cam3CanvasRef} 
                  width={640} 
                  height={360} 
                  className={`w-full h-full object-cover ${cam3HlsActive ? 'hidden' : 'block'}`}
                />
                <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-white flex justify-between items-center">
                  <span className="text-slate-200">Driver: {driverName || 'Verified on Arrival'}</span>
                  <span className="text-emerald-400 font-mono">{cam3HlsActive ? '1080P FHD • Live' : (driverName ? 'Verified' : 'Pending')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== 5. SAP BOTTOM STATUS BAR ===================== */}
      <div className="bg-[#e0cdb2] border-t border-[#be9f77] px-3 py-1 flex flex-wrap items-center justify-between text-[11px] text-slate-800 select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <span>Ready for Weighment (Gross / Tare)</span>
          </span>
          <span className="text-slate-400">|</span>
          <span>Plant: PL01</span>
          <span className="text-slate-400">|</span>
          <span>System: PRD_S4H</span>
          <span className="text-slate-400">|</span>
          <span>Program: {mode === 'gate_in' ? 'ZWB_INBOUND_GATEIN' : 'ZWB_OUTBOUND_GATEOUT'}</span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span>INS</span>
          <span className="text-slate-400">|</span>
          <span>100</span>
          <span className="text-slate-400">|</span>
          <span>WB_BAY_01</span>
        </div>
      </div>
    </div>

    {/* ===================== ISSUED TICKET MODAL (AFTER GATE-IN SAVE) ===================== */}
    {issuedTicketModalOpen && (
      <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in zoom-in-95 duration-150">
        <div 
          className="bg-[#fcf8f2] border-3 border-[#1e2a38] shadow-2xl rounded-sm w-full max-w-lg flex flex-col overflow-hidden text-slate-900"
          style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}
        >
          {/* Header */}
          <div className="bg-[#1e2a38] text-white p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-amber-400" />
              <span className="font-bold text-sm">Gate-In Saved: SAP Weighbridge Ticket Issued</span>
            </div>
            <button
              type="button"
              onClick={() => setIssuedTicketModalOpen(false)}
              className="text-slate-300 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Ticket Body */}
          <div className="p-5 space-y-4">
            <div className="text-center bg-amber-50 border-2 border-amber-300 rounded p-4">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest block">
                Unique Weighbridge Ticket / Token Number
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-black text-[#1e2a38] block my-1">
                {issuedTicketNumber}
              </span>
              <div className="font-mono text-[11px] text-slate-400 tracking-widest">
                |||| | ||||| |||| || |||||||| | ||||
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3 rounded border border-slate-200">
              <div>
                <span className="text-slate-500 block">Vehicle Number:</span>
                <span className="font-mono font-black text-sm text-slate-900">{vehicleNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Movement Scenario:</span>
                <span className="font-bold text-slate-900 uppercase">{scenario.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Initial Weight Recorded:</span>
                <span className="font-mono font-bold text-slate-900">
                  {scenario === 'others' ? tareWeight.toLocaleString() : grossWeight.toLocaleString()} KG ({scenario === 'others' ? 'TARE' : 'GROSS'})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Material:</span>
                <span className="font-semibold text-slate-900 truncate block">{materialName}</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed">
              Vehicle has completed Gate-In and is authorized to enter plant premises for 
              <strong> {scenario === 'others' ? 'loading material' : 'unloading material'}</strong>. 
              The driver will present this ticket upon returning to the weighbridge for Gate-Out.
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintGateInPass}
                className="w-full sm:w-auto h-8 text-xs bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-400 font-bold gap-1"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Gate Entry Pass</span>
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextVehicle}
                  className="h-8 text-xs bg-white text-slate-800"
                >
                  Next Vehicle
                </Button>
                <Button
                  size="sm"
                  onClick={handleProceedToGateOutFromTicket}
                  className="h-8 text-xs bg-[#1e2a38] text-amber-300 hover:bg-slate-800 font-bold gap-1"
                >
                  <span>Proceed to Gate-Out</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ===================== ACTIVE IN-PLANT TICKETS DRAWER ===================== */}
    <ActiveInPlantTicketsDrawer
      isOpen={activeTicketsDrawerOpen}
      onClose={() => setActiveTicketsDrawerOpen(false)}
      onSelectTicket={(ticket) => {
        setMode('gate_out');
        setSearchTicketQuery(ticket.ticketNumber);
        handleSearchTicket(ticket.ticketNumber);
      }}
    />

    {/* ===================== OFFICIAL WEIGHBRIDGE SLIP PRINT MODAL ===================== */}
    <SapWeighbridgeSlipModal
      isOpen={slipModalOpen}
      onClose={() => setSlipModalOpen(false)}
      data={slipData}
    />

    {/* ===================== SAP PO MATCHCODE POPUP MODAL ===================== */}
    {poPickerOpen && (
      <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-3">
        <div className="bg-[#fcf8f2] border-2 border-[#b09371] shadow-2xl rounded-sm w-full max-w-2xl max-h-[80vh] flex flex-col text-slate-900">
          <div className="bg-[#e8d8b8] border-b border-[#c8aa86] px-3 py-2 flex justify-between items-center">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
              SAP Matchcode: Select Purchase Order (Plant PL01)
            </span>
            <button 
              type="button" 
              onClick={() => setPoPickerOpen(false)}
              className="text-slate-700 hover:text-black cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-3 overflow-y-auto max-h-[60vh] space-y-2">
            <table className="w-full text-xs text-left border-collapse border border-[#d6c4ae]">
              <thead>
                <tr className="bg-[#ede1d1] text-slate-800 border-b border-[#d6c4ae]">
                  <th className="p-2 font-bold">PO Number</th>
                  <th className="p-2 font-bold">Material</th>
                  <th className="p-2 font-bold">Vendor</th>
                  <th className="p-2 font-bold">Pending Qty</th>
                  <th className="p-2 font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((po) => (
                  <tr 
                    key={po.poNumber} 
                    className="border-b border-[#e5d4be] hover:bg-[#f5ebd9] cursor-pointer"
                    onClick={() => applyPo(po)}
                  >
                    <td className="p-2 font-mono font-bold text-blue-900">{po.poNumber}</td>
                    <td className="p-2">{po.materialName}</td>
                    <td className="p-2 text-slate-700">{po.vendorName}</td>
                    <td className="p-2 font-mono font-semibold">{po.pendingQty} {po.unit}</td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          applyPo(po);
                        }}
                        className="px-2 py-0.5 bg-[#dfcbaf] hover:bg-[#cbb292] border border-[#a88a65] rounded text-[11px] font-bold"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
                {purchaseOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500">
                      {isLoadingPos ? 'Loading SAP Purchase Orders...' : 'No open Purchase Orders found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-2 bg-[#f0e4d0] border-t border-[#d6c4ae] flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPoPickerOpen(false)}
              className="h-7 text-xs bg-white text-slate-800"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* ===================== ANPR CAM 1 FTP SNAPSHOT PREVIEW MODAL ===================== */}
    {previewImage && (
      <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
        <div className="bg-[#fcf8f2] border-2 border-[#b09371] shadow-2xl rounded-sm w-full max-w-3xl flex flex-col overflow-hidden text-slate-900">
          <div className="bg-[#e8d8b8] border-b border-[#c8aa86] px-3 py-2 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-emerald-800" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                ANPR Cam 1 FTP Vehicle Snapshot • Plate: {vehicleNumber || ftpEvidence?.plate}
              </span>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300">
                OCR 99.4%
              </Badge>
            </div>
            <button 
              type="button" 
              onClick={() => setPreviewImage(null)}
              className="text-slate-700 hover:text-black font-bold p-1 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-3 bg-black flex justify-center items-center">
            <img 
              src={previewImage} 
              alt="Enlarged ANPR Snapshot" 
              className="max-h-[65vh] w-auto object-contain rounded border border-slate-800"
            />
          </div>

          <div className="bg-[#f5ecdf] px-3 py-2 border-t border-[#d8c2a8] flex flex-wrap justify-between items-center text-xs gap-2">
            <div className="font-mono text-slate-700 text-[11px]">
              FTP File: <span className="font-bold text-slate-900">{ftpEvidence?.filename}</span>
              {ftpEvidence?.timestamp && <span className="text-slate-500 ml-2">({ftpEvidence.timestamp})</span>}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={() => {
                  if (ftpEvidence?.plate) setVehicleNumber(ftpEvidence.plate);
                  setPreviewImage(null);
                  toast.success(`Vehicle Plate ${ftpEvidence?.plate} Applied to Form`);
                }}
                className="h-7 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Apply Plate to SAP
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setPreviewImage(null)}
                className="h-7 text-xs bg-[#dfcbaf] border border-[#a88a65] text-slate-900 hover:bg-[#d0b99a]"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* SAP S/4HANA Connection Manager Modal */}
    <SapConnectionManagerModal
      isOpen={sapModalOpen}
      onClose={() => setSapModalOpen(false)}
    />
  </>
  );

  if (embedded && !isFullscreen) {
    return (
      <div className="w-full animate-in fade-in duration-200">
        {windowFrame}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {windowFrame}
    </div>
  );
}
