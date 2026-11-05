import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Incident, CreateIncidentInput, IncidentStatus, EvidenceAttachment, IncidentComment } from '@/types/incident';
import { toast } from '@/hooks/use-toast';

const STORAGE_KEY = 'rmc_incidents_data';

export const initialMockIncidents: Incident[] = [
  {
    id: 'INC-2026-001',
    title: 'Exit Weighbridge Tolerance Breach - MH12AB1234',
    description: 'Gross exit weighment (19.45t) exceeded loaded mix expectation (17.80t) by 1.65 tons (>5% tolerance). Auto-escalated from Exit Verification.',
    type: 'operational',
    severity: 'critical',
    status: 'investigating',
    location: 'Exit Weighbridge',
    reportedBy: 'Exit Verification System',
    reportedAt: new Date(Date.now() - 40 * 60000).toISOString(),
    assignedTo: 'Suresh Kulkarni (Plant Head)',
    assignedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    investigationNotes: 'Mixer driver claims washdown water was mistakenly added into drum before gross weighment. Tare verification ordered.',
    vehicleRegNo: 'MH12AB1234',
    relatedModule: 'exit',
    tags: ['weight-discrepancy', 'auto-escalated', 'weighbridge'],
    evidence: [
      {
        id: 'ev-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
        fileName: 'weighbridge_scale_readout.jpg',
        uploadedAt: new Date(Date.now() - 35 * 60000).toISOString(),
        uploadedBy: 'Exit System',
        description: 'Scale display showing 19,450 kg'
      }
    ],
    comments: [
      {
        id: 'c-1',
        userId: 'u-1',
        userName: 'Suresh Kulkarni',
        comment: 'Holding vehicle at gate bay 3. Re-weighing empty tare after discharge test.',
        timestamp: new Date(Date.now() - 25 * 60000).toISOString()
      }
    ]
  },
  {
    id: 'INC-2026-002',
    title: 'Concrete Slump Specification Failure',
    description: 'M35 Grade concrete for Bandra Site failed slump retention test (slump measured 70mm vs required 140mm ± 25mm). Mixer drum rotation speed was substandard.',
    type: 'quality',
    severity: 'high',
    status: 'reported',
    location: 'QC Bay 1',
    reportedBy: 'Vikram Joshi (QC Inspector)',
    reportedAt: new Date(Date.now() - 120 * 60000).toISOString(),
    vehicleRegNo: 'MH01GH3456',
    relatedModule: 'loading',
    tags: ['slump-test', 'quality-control', 'batching'],
    evidence: [
      {
        id: 'ev-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
        fileName: 'slump_cone_test.jpg',
        uploadedAt: new Date(Date.now() - 110 * 60000).toISOString(),
        uploadedBy: 'QC Lab',
        description: 'Slump measurement test'
      }
    ],
    comments: [
      {
        id: 'c-2',
        userId: 'u-2',
        userName: 'Vikram Joshi',
        comment: 'Plasticizer dosage was under-injected by 0.8%. Batch adjusted and re-testing.',
        timestamp: new Date(Date.now() - 100 * 60000).toISOString()
      }
    ]
  },
  {
    id: 'INC-2026-003',
    title: 'Extended Transit Delay - Concrete Initial Setting Risk',
    description: 'Transit mixer MH04EF9012 stalled in traffic on Western Express Highway. Elapsed transit time 85 minutes (Max allowable: 90 minutes before setting begins).',
    type: 'operational',
    severity: 'high',
    status: 'investigating',
    location: 'Western Express Highway',
    reportedBy: 'GPS Telematics Engine',
    reportedAt: new Date(Date.now() - 60 * 60000).toISOString(),
    assignedTo: 'Rajesh Kumar (Dispatch Officer)',
    assignedAt: new Date(Date.now() - 50 * 60000).toISOString(),
    investigationNotes: 'Rerouting driver via link road. Site engineer alerted to prepare pump immediately upon arrival.',
    vehicleRegNo: 'MH04EF9012',
    relatedModule: 'trip',
    tags: ['transit-delay', 'slump-loss', 'gps-alert'],
    evidence: [],
    comments: [
      {
        id: 'c-3',
        userId: 'u-3',
        userName: 'Rajesh Kumar',
        comment: 'Driver contacted. Vehicle 4 km from site. Estimated arrival in 12 mins.',
        timestamp: new Date(Date.now() - 40 * 60000).toISOString()
      }
    ]
  },
  {
    id: 'INC-2026-004',
    title: 'Inbound ANPR Plate Recognition Mismatch',
    description: 'Automated OCR read GJ05EF9012 but RFID transponder matched GJ05EF9012. Manual visual confirmation confirmed obscured rear plate.',
    type: 'security',
    severity: 'low',
    status: 'resolved',
    location: 'Main Gate Entry',
    reportedBy: 'Gate Controller',
    reportedAt: new Date(Date.now() - 180 * 60000).toISOString(),
    resolvedAt: new Date(Date.now() - 150 * 60000).toISOString(),
    resolution: 'Plate cleared of dust and re-scanned. Driver warned to clean plates before entering plant.',
    vehicleRegNo: 'GJ05EF9012',
    relatedModule: 'gate',
    tags: ['anpr', 'ocr-mismatch', 'security'],
    evidence: [],
    comments: []
  },
  {
    id: 'INC-2026-005',
    title: 'Exit Barrier Manual Key Override',
    description: 'Emergency manual key switch used on Exit Barrier 2 without digital pass scan.',
    type: 'security',
    severity: 'critical',
    status: 'resolved',
    location: 'Gate Exit 2',
    reportedBy: 'Security Monitoring',
    reportedAt: new Date(Date.now() - 300 * 60000).toISOString(),
    resolvedAt: new Date(Date.now() - 240 * 60000).toISOString(),
    resolution: 'Authorized for emergency ambulance access. Log verified against plant security logbook.',
    relatedModule: 'gate',
    tags: ['manual-override', 'barrier-gate', 'compliance'],
    evidence: [],
    comments: []
  }
];

export const useIncidents = () => {
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse stored incidents', e);
    }
    return initialMockIncidents;
  });

  const [loading, setLoading] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
    } catch (e) {
      console.warn('Failed to save incidents to localStorage', e);
    }
  }, [incidents]);

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getIncidents();
      if (data && Array.isArray(data) && data.length > 0) {
        const mapped = data.map((d: any): Incident => ({
          id: d.id || d.incidentNumber,
          title: d.title,
          description: d.description,
          type: d.type,
          severity: d.severity,
          status: d.status,
          location: d.location,
          reportedBy: d.reportedBy || d.reported_by,
          reportedAt: d.reportedAt || d.reported_at,
          assignedTo: d.assignedTo || undefined,
          assignedAt: d.assignedAt || undefined,
          investigationNotes: d.investigationNotes || undefined,
          resolvedAt: d.resolvedAt || undefined,
          resolution: d.resolution || undefined,
          vehicleRegNo: d.vehicleRegNo || undefined,
          relatedModule: d.relatedModule || undefined,
          tags: Array.isArray(d.tags) ? d.tags : [],
          evidence: Array.isArray(d.evidence) ? d.evidence : [],
          comments: Array.isArray(d.comments) ? d.comments : []
        }));
        setIncidents(mapped);
      }
    } catch (err) {
      console.log('Using local incidents dataset fallback');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const createIncident = useCallback(async (
    input: CreateIncidentInput, 
    source: 'manual' | 'automatic' = 'manual', 
    sourceReferenceId?: string
  ): Promise<Incident | null> => {
    const year = new Date().getFullYear();
    const randomSuffix = String(Math.floor(100 + Math.random() * 900));
    const incidentNumber = `INC-${year}-${randomSuffix}`;
    const now = new Date().toISOString();

    const newIncident: Incident = {
      id: incidentNumber,
      title: input.title,
      description: input.description,
      type: input.type,
      severity: input.severity,
      status: 'reported',
      location: input.location,
      reportedBy: 'Control Room Officer',
      reportedAt: now,
      vehicleRegNo: input.vehicleRegNo,
      relatedModule: input.relatedModule,
      tags: input.tags || ['manual-report'],
      evidence: [],
      comments: [],
    };

    // Route incident creation through MySQL backend endpoint /api/incidents
    let savedIncident: Incident = newIncident;
    try {
      const res = await api.createIncident({
        id: incidentNumber,
        incidentNumber,
        title: input.title,
        description: input.description,
        type: input.type,
        severity: input.severity,
        status: 'reported',
        location: input.location,
        reportedBy: 'Control Room Officer',
        reportedAt: now,
        vehicleRegNo: input.vehicleRegNo || null,
        relatedModule: input.relatedModule || null,
        tags: input.tags || ['manual-report'],
        evidence: [],
        comments: []
      });

      if (res && res.id) {
        savedIncident = {
          ...newIncident,
          id: res.id,
          title: res.title || newIncident.title,
          description: res.description || newIncident.description,
          type: res.type || newIncident.type,
          severity: res.severity || newIncident.severity,
          status: res.status || newIncident.status,
          location: res.location || newIncident.location,
          reportedBy: res.reportedBy || newIncident.reportedBy,
          reportedAt: res.reportedAt || newIncident.reportedAt,
        };
      }
    } catch (e) {
      console.warn('API incident insert fallback', e);
    }

    setIncidents(prev => [savedIncident, ...prev]);

    // Dispatch custom event for audit trail integration
    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'incident',
        action: 'CREATE',
        entityId: incidentNumber,
        entityType: 'Incident Case',
        details: `Incident reported: ${input.title} (${input.severity.toUpperCase()}) at ${input.location}`,
        severity: input.severity === 'critical' ? 'critical' : input.severity === 'high' ? 'warning' : 'info',
        performedBy: { id: 'CTRL-01', name: 'Control Room Officer', role: 'Operator' }
      }
    }));

    toast({
      title: 'Incident Reported',
      description: `Incident ${incidentNumber} has been logged for investigation`,
    });

    return newIncident;
  }, []);

  const updateIncidentStatus = useCallback(async (incidentId: string, status: IncidentStatus) => {
    const now = new Date().toISOString();

    setIncidents(prev =>
      prev.map(inc => {
        if (inc.id !== incidentId) return inc;
        return {
          ...inc,
          status,
          ...(status === 'resolved' ? { resolvedAt: now } : {})
        };
      })
    );

    try {
      await api.updateIncident(incidentId, {
        status,
        ...(status === 'resolved' ? { resolvedAt: now } : {})
      });
    } catch (e) {
      console.warn('API status update fallback', e);
    }

    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'incident',
        action: 'STATUS_CHANGE',
        entityId: incidentId,
        entityType: 'Incident Case',
        details: `Incident status updated to ${status.toUpperCase()}`,
        severity: status === 'resolved' ? 'info' : 'warning',
        performedBy: { id: 'CTRL-01', name: 'Incident Handler', role: 'Investigator' }
      }
    }));

    toast({
      title: 'Status Updated',
      description: `Incident ${incidentId} marked as ${status}`,
    });
  }, []);

  const assignIncident = useCallback(async (incidentId: string, assignedTo: string) => {
    const now = new Date().toISOString();

    setIncidents(prev =>
      prev.map(inc => {
        if (inc.id !== incidentId) return inc;
        const newStatus = inc.status === 'reported' ? 'investigating' : inc.status;
        return {
          ...inc,
          assignedTo,
          assignedAt: now,
          status: newStatus,
        };
      })
    );

    try {
      await api.assignIncident(incidentId, assignedTo);
    } catch (e) {
      console.warn('API assign fallback', e);
    }

    toast({
      title: 'Incident Assigned',
      description: `Assigned to ${assignedTo}`,
    });
  }, []);

  const addEvidence = useCallback(async (incidentId: string, evidence: Omit<EvidenceAttachment, 'id'>) => {
    const newEvidence: EvidenceAttachment = {
      ...evidence,
      id: `ev-${Date.now()}`,
    };

    setIncidents(prev =>
      prev.map(inc =>
        inc.id === incidentId
          ? { ...inc, evidence: [...inc.evidence, newEvidence] }
          : inc
      )
    );

    try {
      await api.addIncidentEvidence(incidentId, newEvidence);
    } catch (e) {
      console.warn('API evidence fallback', e);
    }

    toast({
      title: 'Evidence Added',
      description: 'Evidence file has been attached',
    });
  }, []);

  const addComment = useCallback(async (incidentId: string, comment: string) => {
    const newComment: IncidentComment = {
      id: `c-${Date.now()}`,
      userId: 'usr-001',
      userName: 'Operations Lead',
      comment,
      timestamp: new Date().toISOString(),
    };

    setIncidents(prev =>
      prev.map(inc =>
        inc.id === incidentId
          ? { ...inc, comments: [...inc.comments, newComment] }
          : inc
      )
    );

    try {
      await api.addIncidentComment(incidentId, newComment);
    } catch (e) {
      console.warn('API comment fallback', e);
    }

    toast({
      title: 'Comment Added',
      description: 'Your investigation note has been recorded',
    });
  }, []);

  const resolveIncident = useCallback(async (incidentId: string, resolution: string) => {
    const now = new Date().toISOString();

    setIncidents(prev =>
      prev.map(inc =>
        inc.id === incidentId
          ? { ...inc, status: 'resolved', resolution, resolvedAt: now }
          : inc
      )
    );

    try {
      await api.resolveIncident(incidentId, resolution);
    } catch (e) {
      console.warn('API resolve fallback', e);
    }

    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'incident',
        action: 'UPDATE',
        entityId: incidentId,
        entityType: 'Incident Case',
        details: `Incident resolved: ${resolution}`,
        severity: 'info',
        performedBy: { id: 'CTRL-01', name: 'Plant Head', role: 'Management' }
      }
    }));

    toast({
      title: 'Incident Resolved',
      description: 'The incident has been marked as resolved and verified',
    });
  }, []);

  const updateInvestigationNotes = useCallback(async (incidentId: string, notes: string) => {
    setIncidents(prev =>
      prev.map(inc =>
        inc.id === incidentId
          ? { ...inc, investigationNotes: notes }
          : inc
      )
    );

    try {
      await api.updateIncident(incidentId, { investigationNotes: notes });
    } catch (e) {
      console.warn('API update notes fallback', e);
    }

    toast({
      title: 'Notes Saved',
      description: 'Investigation notes updated successfully',
    });
  }, []);

  return {
    incidents,
    loading,
    selectedIncident,
    setSelectedIncident,
    createIncident,
    updateIncidentStatus,
    assignIncident,
    addEvidence,
    addComment,
    resolveIncident,
    updateInvestigationNotes,
    refetch: fetchIncidents,
  };
};
