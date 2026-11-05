import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { ExitWeightReading, ExitVerification, WeightComparison, PlateImage, ExitSlip } from '@/types/exitVerification';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useWeighbridgeScale } from './useWeighbridgeScale';

const STORAGE_KEY = 'rmc_exit_verifications_data';

export const initialSampleVerifications: ExitVerification[] = [
  {
    verificationId: 'EV-2026-001',
    vehicleRegNo: 'MH12AB1234',
    exitTimestamp: new Date(Date.now() - 40 * 60000).toISOString(),
    exitWeight: 19450,
    entryWeight: 8500,
    loadingWeight: 17800,
    weightDifference: 1650,
    plateImages: [
      { id: 'p1', angle: 'front', url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800', timestamp: new Date(Date.now() - 40 * 60000).toISOString() },
      { id: 'p2', angle: 'back', url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800', timestamp: new Date(Date.now() - 40 * 60000).toISOString() }
    ],
    status: 'anomaly',
    operatorId: 'OP001',
    operatorName: 'John Operator',
    remarks: 'Gross weight exceeds batch target by 1.65 tons (>5% tolerance). Escalated to Incident Management.',
    anomalyReason: 'Weight discrepancy exceeds tolerance threshold',
  },
  {
    verificationId: 'EV-2026-002',
    vehicleRegNo: 'MH14CD5678',
    exitTimestamp: new Date(Date.now() - 110 * 60000).toISOString(),
    exitWeight: 18520,
    entryWeight: 9200,
    loadingWeight: 18500,
    weightDifference: 20,
    plateImages: [
      { id: 'p3', angle: 'front', url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800', timestamp: new Date(Date.now() - 110 * 60000).toISOString() },
      { id: 'p4', angle: 'back', url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800', timestamp: new Date(Date.now() - 110 * 60000).toISOString() }
    ],
    status: 'verified',
    operatorId: 'OP001',
    operatorName: 'John Operator',
    remarks: 'Discrepancy +20kg is within 0.1% tolerance. Cleared for customer delivery.',
  },
  {
    verificationId: 'EV-2026-003',
    vehicleRegNo: 'DL08GH3456',
    exitTimestamp: new Date(Date.now() - 180 * 60000).toISOString(),
    exitWeight: 19080,
    entryWeight: 9500,
    loadingWeight: 19100,
    weightDifference: -20,
    plateImages: [],
    status: 'verified',
    operatorId: 'OP002',
    operatorName: 'Ramesh Kulkarni',
    remarks: 'M40 Concrete batch verified within tolerance. Digital pass issued.',
  },
  {
    verificationId: 'EV-2026-004',
    vehicleRegNo: 'GJ05EF9012',
    exitTimestamp: new Date(Date.now() - 260 * 60000).toISOString(),
    exitWeight: 17240,
    entryWeight: 8800,
    loadingWeight: 17200,
    weightDifference: 40,
    plateImages: [],
    status: 'verified',
    operatorId: 'OP002',
    operatorName: 'Ramesh Kulkarni',
    remarks: 'Normal verification. Gate pass signed and dispatched.',
  }
];

export const useExitVerification = () => {
  const [currentWeight, setCurrentWeight] = useState<ExitWeightReading>({
    timestamp: new Date().toISOString(),
    weight: 0,
    unit: 'kg',
    stable: false,
  });
  
  const [verifications, setVerifications] = useState<ExitVerification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse exit verifications from storage', e);
    }
    return initialSampleVerifications;
  });

  const [activeVerification, setActiveVerification] = useState<ExitVerification | null>(null);
  const [lastEscalatedIncidentId, setLastEscalatedIncidentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(verifications));
    } catch (e) {
      console.warn('Failed to save exit verifications', e);
    }
  }, [verifications]);

  // Fetch verifications from database (fallback to local)
  const fetchVerifications = useCallback(async () => {
    try {
      setLoading(true);
      // Primary: MySQL backend API
      const apiData = await api.getExitVerifications().catch(() => null);
      if (apiData && apiData.length > 0) {
        setVerifications(apiData);
        return;
      }

      // Secondary fallback: Supabase (only if configured)
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('exit_verifications')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mappedVerifications: ExitVerification[] = data.map((v: any) => ({
            verificationId: v.verification_id,
            vehicleRegNo: v.vehicle_reg_no,
            exitTimestamp: v.exit_timestamp,
            exitWeight: Number(v.exit_weight),
            entryWeight: v.entry_weight ? Number(v.entry_weight) : undefined,
            loadingWeight: v.loading_weight ? Number(v.loading_weight) : undefined,
            weightDifference: Number(v.weight_difference),
            plateImages: [],
            status: v.status as ExitVerification['status'],
            operatorId: v.operator_id,
            operatorName: v.operator_name,
            remarks: v.remarks || undefined,
            anomalyReason: v.anomaly_reason || undefined,
          }));
          setVerifications(mappedVerifications);
        }
      }
    } catch (error) {
      console.log('Using local exit verifications dataset');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const liveScale = useWeighbridgeScale();

  // Sync live weighbridge indicator readings from WebSocket (RS-232 / Toledo / Avery)
  useEffect(() => {
    if (liveScale.weight > 0 || liveScale.connection.connected) {
      setCurrentWeight({
        timestamp: liveScale.timestamp,
        weight: liveScale.weight,
        unit: 'kg',
        stable: liveScale.stable,
      });
    }
  }, [liveScale.weight, liveScale.stable, liveScale.timestamp, liveScale.connection.connected]);

  const startVerification = useCallback((vehicleRegNo: string) => {
    const mockEntryWeight = 8500; // 8.5 tons tare
    const mockLoadingWeight = 17800; // 17.8 tons loaded
    
    const newVerification: ExitVerification = {
      verificationId: `EV-${Date.now()}`,
      vehicleRegNo,
      exitTimestamp: new Date().toISOString(),
      exitWeight: 0,
      entryWeight: mockEntryWeight,
      loadingWeight: mockLoadingWeight,
      weightDifference: 0,
      plateImages: [],
      status: 'pending',
      operatorId: 'OP001',
      operatorName: 'John Operator',
    };
    
    setActiveVerification(newVerification);
    setLastEscalatedIncidentId(null);
    return newVerification;
  }, []);

  const startVerificationWithData = useCallback((
    vehicleRegNo: string, 
    entryWeight: number, 
    loadingWeight: number
  ) => {
    const newVerification: ExitVerification = {
      verificationId: `EV-${Date.now()}`,
      vehicleRegNo,
      exitTimestamp: new Date().toISOString(),
      exitWeight: 0,
      entryWeight,
      loadingWeight,
      weightDifference: 0,
      plateImages: [],
      status: 'pending',
      operatorId: 'OP001',
      operatorName: 'John Operator',
    };
    
    setActiveVerification(newVerification);
    setLastEscalatedIncidentId(null);
    return newVerification;
  }, []);

  const captureExitWeight = useCallback(() => {
    if (!activeVerification || !currentWeight.stable) return null;
    
    const updatedVerification: ExitVerification = {
      ...activeVerification,
      exitWeight: currentWeight.weight,
      weightDifference: currentWeight.weight - (activeVerification.loadingWeight || currentWeight.weight),
    };
    
    setActiveVerification(updatedVerification);
    return updatedVerification;
  }, [activeVerification, currentWeight]);

  const addPlateImages = useCallback((images: PlateImage[]) => {
    if (!activeVerification) return;
    
    setActiveVerification(prev => prev ? {
      ...prev,
      plateImages: images,
    } : null);
  }, [activeVerification]);

  const compareWeights = useCallback((): WeightComparison | null => {
    if (!activeVerification || !activeVerification.exitWeight) return null;

    const entryWeight = activeVerification.entryWeight || 0;
    const loadingWeight = activeVerification.loadingWeight || 0;
    const exitWeight = activeVerification.exitWeight;
    
    const expectedDifference = Math.abs(loadingWeight - entryWeight);
    const actualDifference = Math.abs(exitWeight - loadingWeight);
    const tolerance = Math.max(200, expectedDifference * 0.05); // 5% tolerance threshold (min 200kg)
    const withinTolerance = actualDifference <= tolerance;

    return {
      entryWeight,
      loadingWeight,
      exitWeight,
      expectedDifference,
      actualDifference,
      tolerance,
      withinTolerance,
    };
  }, [activeVerification]);

  const createAnomalyIncident = useCallback(async (
    verification: ExitVerification,
    comparison: WeightComparison
  ): Promise<string> => {
    const year = new Date().getFullYear();
    const randomSuffix = String(Math.floor(100 + Math.random() * 900));
    const incidentNumber = `INC-${year}-${randomSuffix}`;

    const tolerancePercent = ((comparison.actualDifference / Math.max(1, comparison.tolerance)) * 5).toFixed(1);

    // Save incident to localStorage so it appears in IncidentManagement
    const newInc = {
      id: incidentNumber,
      title: `Weight Discrepancy - ${verification.vehicleRegNo}`,
      description: `Automatic escalation: Exit weight differs from loading weight by ${(comparison.actualDifference / 1000).toFixed(2)} tons (${tolerancePercent}% of expected load), exceeding the 5% tolerance threshold. Vehicle: ${verification.vehicleRegNo}`,
      type: 'operational' as const,
      severity: (comparison.actualDifference > comparison.tolerance * 2 ? 'critical' : 'high') as 'critical' | 'high',
      status: 'reported' as const,
      location: 'Exit Weighbridge',
      reportedBy: 'Exit Verification System',
      reportedAt: new Date().toISOString(),
      vehicleRegNo: verification.vehicleRegNo,
      relatedModule: 'exit',
      tags: ['weight-discrepancy', 'auto-escalated', 'investigation-required'],
      evidence: verification.plateImages.map((p, idx) => ({
        id: `ev-${idx}`,
        type: 'image' as const,
        url: p.url,
        fileName: `exit_plate_${p.angle}.jpg`,
        uploadedAt: p.timestamp,
        uploadedBy: 'Exit Camera'
      })),
      comments: [
        {
          id: `c-${Date.now()}`,
          userId: 'sys-01',
          userName: 'System Auto-Escalation',
          comment: `Auto-generated from exit verification ${verification.verificationId}. Scale difference: ${(comparison.actualDifference / 1000).toFixed(2)} tons.`,
          timestamp: new Date().toISOString()
        }
      ]
    };

    try {
      const storedIncidents = localStorage.getItem('rmc_incidents_data');
      const parsed = storedIncidents ? JSON.parse(storedIncidents) : [];
      parsed.unshift(newInc);
      localStorage.setItem('rmc_incidents_data', JSON.stringify(parsed));
    } catch (e) {
      console.warn('Failed to sync incident to localStorage', e);
    }

    // Route incident creation through MySQL backend endpoint /api/incidents
    try {
      await api.createIncident({
        id: incidentNumber,
        incidentNumber,
        title: newInc.title,
        description: newInc.description,
        type: newInc.type,
        severity: newInc.severity,
        status: newInc.status,
        location: newInc.location,
        reportedBy: newInc.reportedBy,
        reportedAt: newInc.reportedAt,
        vehicleRegNo: newInc.vehicleRegNo,
        relatedModule: newInc.relatedModule,
        tags: newInc.tags,
        evidence: newInc.evidence,
        comments: newInc.comments
      });
    } catch (e) {
      console.warn('API incident insert fallback', e);
    }

    // Log to Audit Trail
    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'exit',
        action: 'ANOMALY_DETECTED',
        entityId: verification.vehicleRegNo,
        entityType: 'Exit Weighment',
        details: `Tolerance breach on exit scale: ${(comparison.actualDifference / 1000).toFixed(2)}t discrepancy. Auto-escalated to incident ${incidentNumber}.`,
        severity: 'critical',
        performedBy: { id: 'SYS-EXIT', name: 'Exit Verification Engine', role: 'System' }
      }
    }));

    toast({
      title: 'Incident Auto-Created',
      description: `Weight anomaly escalated as ${incidentNumber}`,
      variant: 'destructive',
    });

    return incidentNumber;
  }, []);

  const completeVerification = useCallback(async (remarks?: string): Promise<ExitVerification | null> => {
    if (!activeVerification) return null;

    const comparison = compareWeights();
    const isWithin = comparison ? comparison.withinTolerance : true;
    const status: ExitVerification['status'] = isWithin ? 'verified' : 'anomaly';
    const anomalyReason = !isWithin ? 'Weight discrepancy exceeds 5% tolerance' : undefined;

    let incidentId: string | null = null;
    if (status === 'anomaly' && comparison) {
      incidentId = await createAnomalyIncident(activeVerification, comparison);
      setLastEscalatedIncidentId(incidentId);
    }

    const completedVerification: ExitVerification = {
      ...activeVerification,
      status,
      remarks,
      anomalyReason,
    };

    // Update local state and storage
    setVerifications(prev => [completedVerification, ...prev]);

    // Log verification to Audit Trail
    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'exit',
        action: status === 'verified' ? 'VERIFICATION_PASSED' : 'ANOMALY_DETECTED',
        entityId: completedVerification.vehicleRegNo,
        entityType: 'Exit Gate Verification',
        details: status === 'verified'
          ? `Vehicle ${completedVerification.vehicleRegNo} exit verified (${(completedVerification.exitWeight / 1000).toFixed(2)}t). Cleared to depart.`
          : `Vehicle ${completedVerification.vehicleRegNo} exit anomaly logged: ${anomalyReason}.`,
        severity: status === 'verified' ? 'info' : 'critical',
        performedBy: { id: completedVerification.operatorId, name: completedVerification.operatorName, role: 'Gate Inspector' }
      }
    }));

    // Try supabase insert in background (if configured)
    if (isSupabaseConfigured) {
      try {
        await supabase.from('exit_verifications').insert({
          verification_id: completedVerification.verificationId,
          vehicle_reg_no: completedVerification.vehicleRegNo,
          exit_timestamp: completedVerification.exitTimestamp,
          exit_weight: completedVerification.exitWeight,
          entry_weight: completedVerification.entryWeight || null,
          loading_weight: completedVerification.loadingWeight || null,
          weight_difference: completedVerification.weightDifference,
          status: completedVerification.status,
          operator_id: completedVerification.operatorId,
          operator_name: completedVerification.operatorName,
          remarks: completedVerification.remarks || null,
          anomaly_reason: completedVerification.anomalyReason || null,
        });
      } catch {
        // Supabase handled gracefully
      }
    }

    toast({
      title: status === 'verified' ? 'Verification Complete' : 'Anomaly Detected',
      description: status === 'verified' 
        ? `Vehicle ${completedVerification.vehicleRegNo} cleared for exit`
        : `Weight discrepancy detected - Escalated to incident ${incidentId || 'reported'}`,
      variant: status === 'verified' ? 'default' : 'destructive',
    });

    setActiveVerification(null);
    return completedVerification;
  }, [activeVerification, compareWeights, createAnomalyIncident]);

  const cancelVerification = useCallback(() => {
    setActiveVerification(null);
    setLastEscalatedIncidentId(null);
  }, []);

  const generateExitSlip = useCallback((): ExitSlip | null => {
    if (!activeVerification) return null;

    const comparison = compareWeights();
    const netLoad = (activeVerification.loadingWeight || 0) - (activeVerification.entryWeight || 0);

    return {
      slipId: `SLIP-${activeVerification.verificationId}`,
      verificationId: activeVerification.verificationId,
      vehicleRegNo: activeVerification.vehicleRegNo,
      exitTimestamp: activeVerification.exitTimestamp,
      entryWeight: activeVerification.entryWeight || 0,
      loadingWeight: activeVerification.loadingWeight || 0,
      exitWeight: activeVerification.exitWeight,
      netLoad,
      weightDifference: activeVerification.weightDifference,
      status: activeVerification.status,
      operatorId: activeVerification.operatorId,
      operatorName: activeVerification.operatorName,
      remarks: activeVerification.remarks,
      withinTolerance: comparison?.withinTolerance || false,
      tolerance: comparison?.tolerance || 0,
      plateImageCount: activeVerification.plateImages.length,
      generatedAt: new Date().toISOString(),
    };
  }, [activeVerification, compareWeights]);

  return {
    currentWeight,
    activeVerification,
    lastEscalatedIncidentId,
    verifications,
    loading,
    liveScale,
    startVerification,
    startVerificationWithData,
    captureExitWeight,
    addPlateImages,
    compareWeights,
    completeVerification,
    cancelVerification,
    generateExitSlip,
    refetch: fetchVerifications,
  };
};
