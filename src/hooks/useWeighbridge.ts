import { useState, useEffect, useCallback } from 'react';
import { WeightReading, WeighbridgeSession } from '@/types/weighbridge';
import { api } from '@/lib/api';
import { useWeighbridgeScale } from './useWeighbridgeScale';

export const useWeighbridge = () => {
  const liveScale = useWeighbridgeScale();

  const [currentWeight, setCurrentWeight] = useState<WeightReading>({
    timestamp: new Date().toISOString(),
    weight: 0,
    unit: 'kg',
    stable: false,
  });
  
  const [sessions, setSessions] = useState<WeighbridgeSession[]>([]);
  const [activeSession, setActiveSession] = useState<WeighbridgeSession | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await api.getWeighbridgeSessions();
      if (data && Array.isArray(data) && data.length > 0) {
        setSessions(data);
      }
    } catch (err) {
      console.warn('Weighbridge sessions API fallback', err);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Sync real-time indicator WebSocket weight
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

  // Auto-set baseline load when active session starts if scale is empty
  useEffect(() => {
    if (activeSession && liveScale.weight === 0) {
      const targetKg = activeSession.status === 'tare' ? 18500 : 8500;
      liveScale.injectWeight(targetKg);
    }
  }, [activeSession, liveScale.weight, liveScale.injectWeight]);

  const startSession = useCallback((vehicleRegNo: string, driverName?: string) => {
    const newSession: WeighbridgeSession = {
      sessionId: `WB-${Date.now()}`,
      vehicleRegNo,
      timestamp: new Date().toISOString(),
      tareWeight: null,
      grossWeight: null,
      netWeight: null,
      driverName,
      evidence: [],
      status: 'tare',
      operatorId: 'OP001',
      operatorName: 'John Operator',
    };
    
    setActiveSession(newSession);

    api.startWeighbridgeSession(newSession).catch(e => console.warn('API start WB fallback', e));

    return newSession;
  }, []);

  const captureTare = useCallback(() => {
    if (!activeSession || !currentWeight.stable) return;
    
    const updatedSession = {
      ...activeSession,
      tareWeight: currentWeight.weight,
      status: 'gross' as const,
    };
    
    setActiveSession(updatedSession);

    api.captureWeighbridgeTare(activeSession.sessionId, currentWeight.weight)
      .catch(e => console.warn('API tare WB fallback', e));
  }, [activeSession, currentWeight]);

  const captureGross = useCallback(() => {
    if (!activeSession || !currentWeight.stable || !activeSession.tareWeight) return;
    
    const grossWeight = currentWeight.weight;
    const netWeight = Math.abs(grossWeight - activeSession.tareWeight);
    
    const completedSession: WeighbridgeSession = {
      ...activeSession,
      grossWeight,
      netWeight,
      status: 'completed',
    };
    
    setSessions(prev => [completedSession, ...prev]);
    setActiveSession(null);

    api.captureWeighbridgeGross(activeSession.sessionId, grossWeight)
      .catch(e => console.warn('API gross WB fallback', e));
    
    return completedSession;
  }, [activeSession, currentWeight]);

  const cancelSession = useCallback(() => {
    setActiveSession(null);
  }, []);

  return {
    currentWeight,
    activeSession,
    sessions,
    liveScale,
    zeroScale: liveScale.zeroScale,
    tareScale: liveScale.tareScale,
    injectWeight: liveScale.injectWeight,
    startSession,
    captureTare,
    captureGross,
    cancelSession,
    refetch: fetchSessions,
  };
};
