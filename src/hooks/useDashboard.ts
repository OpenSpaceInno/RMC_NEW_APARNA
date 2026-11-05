import { useState, useEffect } from 'react';
import { useDispatchApproval } from './useDispatchApproval';
import { useTripTracking } from './useTripTracking';
import { useLoadingBays } from './useLoadingBays';

export interface DashboardStats {
  activeVehicles: number;
  todayDispatches: number;
  pendingApprovals: number;
  activeAlerts: number;
  activeTrips: number;
  completedTrips: number;
  delayedTrips: number;
  baysAvailable: number;
  baysLoading: number;
  baysUnderMaintenance: number;
  totalBays: number;
  bayUtilization: number;
}

export interface OperationalData {
  hour: string;
  dispatches: number;
  loads: number;
  exits: number;
}

export interface BayUtilizationData {
  name: string;
  utilization: number;
  status: string;
}

export const useDashboard = () => {
  const { pendingDispatches } = useDispatchApproval();
  const { activeTrips } = useTripTracking();
  const { bays } = useLoadingBays();
  
  const [stats, setStats] = useState<DashboardStats>({
    activeVehicles: 0,
    todayDispatches: 0,
    pendingApprovals: 0,
    activeAlerts: 0,
    activeTrips: 0,
    completedTrips: 0,
    delayedTrips: 0,
    baysAvailable: 0,
    baysLoading: 0,
    baysUnderMaintenance: 0,
    totalBays: 0,
    bayUtilization: 0,
  });

  const [operationalData, setOperationalData] = useState<OperationalData[]>([]);
  const [bayUtilizationData, setBayUtilizationData] = useState<BayUtilizationData[]>([]);

  useEffect(() => {
    // Calculate real-time statistics
    const pendingCount = pendingDispatches.filter(d => d.status === 'pending').length;
    const approvedToday = pendingDispatches.filter(d => d.status === 'approved').length;
    const activeTripsCount = activeTrips.filter(t => t.status === 'active').length;
    const completedTripsCount = activeTrips.filter(t => t.status === 'completed').length;
    const delayedTripsCount = activeTrips.filter(t => t.status === 'delayed').length;
    
    const availableBays = bays.filter(b => b.status === 'available').length;
    const loadingBays = bays.filter(b => b.status === 'loading').length;
    const maintenanceBays = bays.filter(b => b.status === 'maintenance').length;
    const totalBays = bays.length;
    const utilization = totalBays > 0 ? ((loadingBays / totalBays) * 100) : 0;

    setStats({
      activeVehicles: activeTripsCount + loadingBays,
      todayDispatches: approvedToday + activeTripsCount + completedTripsCount,
      pendingApprovals: pendingCount,
      activeAlerts: delayedTripsCount + (pendingCount > 5 ? 1 : 0),
      activeTrips: activeTripsCount,
      completedTrips: completedTripsCount,
      delayedTrips: delayedTripsCount,
      baysAvailable: availableBays,
      baysLoading: loadingBays,
      baysUnderMaintenance: maintenanceBays,
      totalBays,
      bayUtilization: Math.round(utilization),
    });

    // Generate hourly operational data for the last 8 hours
    const now = new Date();
    const hourlyData: OperationalData[] = [];
    for (let i = 7; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStr = hour.getHours().toString().padStart(2, '0') + ':00';
      hourlyData.push({
        hour: hourStr,
        dispatches: Math.floor(Math.random() * 10) + 3,
        loads: Math.floor(Math.random() * 8) + 2,
        exits: Math.floor(Math.random() * 9) + 2,
      });
    }
    setOperationalData(hourlyData);

    // Generate bay utilization data
    const bayData: BayUtilizationData[] = bays.map(bay => ({
      name: bay.name,
      utilization: bay.status === 'loading' ? Math.floor(Math.random() * 30) + 70 :
                   bay.status === 'quality_check' ? Math.floor(Math.random() * 20) + 40 :
                   bay.status === 'available' ? Math.floor(Math.random() * 10) : 0,
      status: bay.status,
    }));
    setBayUtilizationData(bayData);
  }, [pendingDispatches, activeTrips, bays]);

  return {
    stats,
    operationalData,
    bayUtilizationData,
  };
};
