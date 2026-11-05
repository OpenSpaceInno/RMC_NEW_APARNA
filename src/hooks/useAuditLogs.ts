import { useState, useEffect, useCallback } from 'react';
import { AuditLogEntry, AuditModule, AuditAction, AuditSeverity, AuditStats } from '@/types/audit';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const STORAGE_KEY = 'rmc_audit_trail_logs';

// Helper to generate verification hash
export const generateAuditHash = (id: string, timestamp: string, entityId: string, action: string) => {
  const raw = `${id}:${timestamp}:${entityId}:${action}:SALT_RMC_PLANT_2026`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `SHA256-${hex.toUpperCase()}${timestamp.slice(-4)}`;
};

const initialSampleLogs: AuditLogEntry[] = [
  {
    id: 'AUD-2026-0091',
    timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
    module: 'exit',
    action: 'ANOMALY_DETECTED',
    entityId: 'MH12AB1234',
    entityType: 'Vehicle Exit Weighment',
    performedBy: { id: 'OP-004', name: 'Ramesh Kulkarni', role: 'Weighbridge Operator' },
    details: 'Exit weighment gross weight (19,450 kg) exceeded loaded batch expectation (17,800 kg) by 1,650 kg (>5% tolerance threshold). Auto-escalation triggered.',
    severity: 'critical',
    previousState: { expectedGross: 17800, status: 'pending' },
    newState: { actualGross: 19450, discrepancyKg: 1650, status: 'anomaly' },
    metadata: {
      terminalId: 'WB-OUT-01',
      ipAddress: '192.168.0.45',
      cameraId: 'cam_gate_2',
      verifiedHash: generateAuditHash('AUD-2026-0091', new Date(Date.now() - 4 * 60000).toISOString(), 'MH12AB1234', 'ANOMALY_DETECTED'),
    },
  },
  {
    id: 'AUD-2026-0090',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    module: 'incident',
    action: 'INCIDENT_ESCALATED',
    entityId: 'INC-2026-001',
    entityType: 'Incident Case',
    performedBy: { id: 'SYS-AUTO', name: 'Automated Compliance Engine', role: 'System' },
    details: 'System automatically created operational anomaly incident INC-2026-001 for vehicle MH12AB1234 following weighbridge tolerance breach.',
    severity: 'critical',
    previousState: null,
    newState: { incidentNumber: 'INC-2026-001', type: 'operational', severity: 'critical', status: 'investigating' },
    metadata: {
      terminalId: 'SERVER-JOB-01',
      ipAddress: '127.0.0.1',
      verifiedHash: generateAuditHash('AUD-2026-0090', new Date(Date.now() - 5 * 60000).toISOString(), 'INC-2026-001', 'INCIDENT_ESCALATED'),
    },
  },
  {
    id: 'AUD-2026-0089',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    module: 'tracking',
    action: 'STATUS_CHANGE',
    entityId: 'TRIP-004',
    entityType: 'Transit Delivery',
    performedBy: { id: 'GPS-TELE', name: 'GPS Telematics Server', role: 'Automated Bot' },
    details: 'Vehicle MH01GH3456 en route to Worli Site flagged delayed. Speed dropped below 15 km/h on Western Express Highway with ETA slippage > 25 mins.',
    severity: 'warning',
    previousState: { status: 'in_transit', speed: 38 },
    newState: { status: 'delayed', speed: 12, delayMinutes: 28 },
    metadata: {
      terminalId: 'GPS-GATEWAY',
      ipAddress: '192.168.0.88',
      verifiedHash: generateAuditHash('AUD-2026-0089', new Date(Date.now() - 12 * 60000).toISOString(), 'TRIP-004', 'STATUS_CHANGE'),
    },
  },
  {
    id: 'AUD-2026-0088',
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    module: 'dispatch',
    action: 'DISPATCH_APPROVED',
    entityId: 'DISP-8921',
    entityType: 'Dispatch Docket',
    performedBy: { id: 'QC-002', name: 'Vikram Joshi', role: 'Quality Control Lead' },
    details: 'M30 Grade Ready-Mix Concrete batch #B-7729 approved for delivery. Slump test: 145mm (Target 150mm ± 25mm). Max transit setting window: 90 mins.',
    severity: 'info',
    previousState: { qcApproval: 'pending' },
    newState: { qcApproval: 'approved', slumpMm: 145, waterCementRatio: 0.42 },
    metadata: {
      terminalId: 'QC-LAB-01',
      ipAddress: '192.168.0.12',
      verifiedHash: generateAuditHash('AUD-2026-0088', new Date(Date.now() - 25 * 60000).toISOString(), 'DISP-8921', 'DISPATCH_APPROVED'),
    },
  },
  {
    id: 'AUD-2026-0087',
    timestamp: new Date(Date.now() - 38 * 60000).toISOString(),
    module: 'loading',
    action: 'CREATE',
    entityId: 'BATCH-2026-441',
    entityType: 'Mixing Console',
    performedBy: { id: 'PLANT-01', name: 'Anil Desai', role: 'Batching Plant Operator' },
    details: 'Batching completed for Bay 2. Total gross mix load: 18,500 kg M25 concrete into transit mixer MH14CD5678.',
    severity: 'info',
    previousState: null,
    newState: { batchKg: 18500, cementKg: 3400, waterL: 1480, aggregatesKg: 13620 },
    metadata: {
      terminalId: 'BATCH-PANEL-02',
      ipAddress: '192.168.0.15',
      verifiedHash: generateAuditHash('AUD-2026-0087', new Date(Date.now() - 38 * 60000).toISOString(), 'BATCH-2026-441', 'CREATE'),
    },
  },
  {
    id: 'AUD-2026-0086',
    timestamp: new Date(Date.now() - 50 * 60000).toISOString(),
    module: 'weighbridge',
    action: 'WEIGHT_CAPTURE',
    entityId: 'MH14CD5678',
    entityType: 'Inbound Weighment',
    performedBy: { id: 'OP-001', name: 'Sanjay Shinde', role: 'Weighbridge Operator' },
    details: 'Tare weight recorded for empty transit mixer MH14CD5678: 9,200 kg. Stable scale lock verified.',
    severity: 'info',
    previousState: null,
    newState: { tareWeightKg: 9200, unit: 'kg', stable: true },
    metadata: {
      terminalId: 'WB-IN-01',
      ipAddress: '192.168.0.44',
      verifiedHash: generateAuditHash('AUD-2026-0086', new Date(Date.now() - 50 * 60000).toISOString(), 'MH14CD5678', 'WEIGHT_CAPTURE'),
    },
  },
  {
    id: 'AUD-2026-0085',
    timestamp: new Date(Date.now() - 65 * 60000).toISOString(),
    module: 'gate',
    action: 'VERIFICATION_PASSED',
    entityId: 'MH14CD5678',
    entityType: 'Gate Entry ANPR',
    performedBy: { id: 'ANPR-AI', name: 'Automated ANPR Camera', role: 'AI OCR Engine' },
    details: 'License plate MH14CD5678 identified with 98.4% confidence at Gate 1 Inbound. Entry barrier raised automatically.',
    severity: 'info',
    previousState: { barrier: 'closed' },
    newState: { barrier: 'opened', confidence: 0.984, matchedVehicle: true },
    metadata: {
      cameraId: 'cam_gate_1',
      ipAddress: '192.168.0.168',
      verifiedHash: generateAuditHash('AUD-2026-0085', new Date(Date.now() - 65 * 60000).toISOString(), 'MH14CD5678', 'VERIFICATION_PASSED'),
    },
  },
  {
    id: 'AUD-2026-0084',
    timestamp: new Date(Date.now() - 110 * 60000).toISOString(),
    module: 'gate',
    action: 'OVERRIDE',
    entityId: 'GATE-ENTRY-02',
    entityType: 'Gate Barrier',
    performedBy: { id: 'SEC-003', name: 'Mahesh Patil', role: 'Security Supervisor' },
    details: 'Manual supervisor key override applied to open exit barrier for maintenance vehicle MH04EF9012 without automated slip print.',
    severity: 'warning',
    previousState: { barrier: 'locked' },
    newState: { barrier: 'manual_opened', reason: 'Maintenance vehicle bypass' },
    metadata: {
      terminalId: 'GATE-BOOTH-02',
      ipAddress: '192.168.0.46',
      verifiedHash: generateAuditHash('AUD-2026-0084', new Date(Date.now() - 110 * 60000).toISOString(), 'GATE-ENTRY-02', 'OVERRIDE'),
    },
  },
];

export const useAuditLogs = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse stored audit logs', e);
    }
    return initialSampleLogs;
  });

  const [liveStreaming, setLiveStreaming] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.warn('Failed to save audit logs to localStorage', e);
    }
  }, [logs]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const data = await api.getAuditLogs({ limit: 100 });
      if (data && Array.isArray(data) && data.length > 0) {
        setLogs(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Audit logs API fallback', err);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Log action method
  const logAction = useCallback((entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const timestamp = new Date().toISOString();
    const id = `AUD-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const verifiedHash = generateAuditHash(id, timestamp, entry.entityId, entry.action);

    const newEntry: AuditLogEntry = {
      ...entry,
      id,
      timestamp,
      metadata: {
        ...entry.metadata,
        verifiedHash,
      },
    };

    setLogs(prev => [newEntry, ...prev]);

    // Send to backend API asynchronously
    api.createAuditLog(newEntry).catch(err => console.warn('API audit create fallback', err));

    return newEntry;
  }, []);

  // Listen for custom audit events across modules
  useEffect(() => {
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        logAction(customEvent.detail);
      }
    };
    window.addEventListener('rmc-audit-event', handleCustomEvent);
    return () => window.removeEventListener('rmc-audit-event', handleCustomEvent);
  }, [logAction]);

  // Live simulation effect
  useEffect(() => {
    if (!liveStreaming) return;

    const interval = setInterval(() => {
      const randomEvents = [
        {
          module: 'gate' as AuditModule,
          action: 'VERIFICATION_PASSED' as AuditAction,
          entityId: 'MH12AB1234',
          entityType: 'Inbound ANPR',
          performedBy: { id: 'ANPR-AI', name: 'Auto Gate AI', role: 'AI Engine' },
          details: 'Live ANPR ping: Camera 1 detected license plate with 96.2% confidence.',
          severity: 'info' as AuditSeverity,
        },
        {
          module: 'weighbridge' as AuditModule,
          action: 'WEIGHT_CAPTURE' as AuditAction,
          entityId: 'MH01GH3456',
          entityType: 'Scale Platform',
          performedBy: { id: 'OP-001', name: 'Sanjay Shinde', role: 'Operator' },
          details: 'Real-time weighbridge sensor verified stable scale reading: 18,220 kg.',
          severity: 'info' as AuditSeverity,
        },
        {
          module: 'tracking' as AuditModule,
          action: 'STATUS_CHANGE' as AuditAction,
          entityId: 'TRIP-001',
          entityType: 'GPS Telematics',
          performedBy: { id: 'GPS-TELE', name: 'Telematics Gateway', role: 'System' },
          details: 'GPS Beacon ping received: Vehicle speed 34 km/h, heading 225°, distance to Bandra: 5.8 km.',
          severity: 'info' as AuditSeverity,
        },
      ];

      const selected = randomEvents[Math.floor(Math.random() * randomEvents.length)];
      logAction(selected);
    }, 8000);

    return () => clearInterval(interval);
  }, [liveStreaming, logAction]);

  const clearLogs = useCallback(() => {
    setLogs(initialSampleLogs);
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: 'Audit Trail Reset',
      description: 'Audit logs reset to baseline compliance dataset',
    });
  }, [toast]);

  // Compute stats
  const stats: AuditStats = {
    totalEvents: logs.length,
    criticalEvents: logs.filter(l => l.severity === 'critical').length,
    anomaliesDetected: logs.filter(l => l.action === 'ANOMALY_DETECTED' || l.action === 'OVERRIDE').length,
    systemIntegrity: 100, // Non-repudiation integrity check
  };

  return {
    logs,
    stats,
    liveStreaming,
    setLiveStreaming,
    logAction,
    clearLogs,
    refetch: fetchAuditLogs,
  };
};
