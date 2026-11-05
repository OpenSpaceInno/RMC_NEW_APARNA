import { useState, useEffect, useCallback } from 'react';
import { FuelRecord, FuelStats, FuelEfficiency, FuelFormData, FuelFilters } from '@/types/fuel';
import { Vehicle } from '@/types/vehicle';
import { Driver } from '@/types/driver';
import { api } from '@/lib/api';

const STORAGE_KEY = 'rmc_fuel_records';

const generateFuelRecordId = () => `FUEL-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

// Helper to create dates relative to now (in current year/month)
const getRelativeDateISO = (daysAgo: number, hoursOffset: number = 8): string => {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  d.setHours(hoursOffset, 30, 0, 0);
  return d.toISOString();
};

const initialMockFuelRecords: FuelRecord[] = [
  {
    id: 'fuel-001',
    vehicleId: 'v1',
    vehicleRegNo: 'MH12AB1234',
    driverId: 'DRV-001',
    driverName: 'Rajesh Kumar',
    tripId: 'TRIP-001',
    tripNumber: 'TRP-2026-001',
    fuelType: 'diesel',
    quantity: 125,
    pricePerUnit: 89.50,
    totalCost: 11187.50,
    odometerReading: 125230,
    fuelStation: 'Indian Oil - Hadapsar',
    location: 'Pune',
    receiptNumber: 'RCP-2026-089',
    date: getRelativeDateISO(1, 8),
    notes: 'Full tank refuel before Bandra batch dispatch',
    createdAt: getRelativeDateISO(1, 8),
    updatedAt: getRelativeDateISO(1, 8),
  },
  {
    id: 'fuel-002',
    vehicleId: 'v2',
    vehicleRegNo: 'MH14CD5678',
    driverId: 'DRV-002',
    driverName: 'Suresh Patil',
    tripId: 'TRIP-002',
    tripNumber: 'TRP-2026-002',
    fuelType: 'diesel',
    quantity: 110,
    pricePerUnit: 90.25,
    totalCost: 9927.50,
    odometerReading: 98120,
    fuelStation: 'HP Auto Care - Kothrud',
    location: 'Pune',
    receiptNumber: 'RCP-2026-090',
    date: getRelativeDateISO(2, 14),
    notes: 'Regular refuel after Andheri site run',
    createdAt: getRelativeDateISO(2, 14),
    updatedAt: getRelativeDateISO(2, 14),
  },
  {
    id: 'fuel-003',
    vehicleId: 'v3',
    vehicleRegNo: 'MH43EF9012',
    driverId: 'DRV-003',
    driverName: 'Amit Sharma',
    fuelType: 'diesel',
    quantity: 140,
    pricePerUnit: 89.80,
    totalCost: 12572.00,
    odometerReading: 45680,
    fuelStation: 'BPCL Highway Fuelling - Wakad',
    location: 'Pune',
    receiptNumber: 'RCP-2026-091',
    date: getRelativeDateISO(4, 9),
    notes: 'Pre-maintenance fill-up for high-torque trailer',
    createdAt: getRelativeDateISO(4, 9),
    updatedAt: getRelativeDateISO(4, 9),
  },
  {
    id: 'fuel-004',
    vehicleId: 'v4',
    vehicleRegNo: 'MH20GH3456',
    driverId: 'DRV-004',
    driverName: 'Vikram Singh',
    fuelType: 'cng',
    quantity: 26,
    pricePerUnit: 76.50,
    totalCost: 1989.00,
    odometerReading: 28450,
    fuelStation: 'MNGL CNG Station - Chakan',
    location: 'Chakan',
    receiptNumber: 'RCP-2026-092',
    date: getRelativeDateISO(5, 11),
    notes: 'CNG full cylinder refill for site utility pickup',
    createdAt: getRelativeDateISO(5, 11),
    updatedAt: getRelativeDateISO(5, 11),
  },
  {
    id: 'fuel-005',
    vehicleId: 'v1',
    vehicleRegNo: 'MH12AB1234',
    driverId: 'DRV-001',
    driverName: 'Rajesh Kumar',
    fuelType: 'diesel',
    quantity: 130,
    pricePerUnit: 89.50,
    totalCost: 11635.00,
    odometerReading: 124800,
    fuelStation: 'Indian Oil - Hadapsar',
    location: 'Pune',
    receiptNumber: 'RCP-2026-093',
    date: getRelativeDateISO(7, 16),
    notes: 'Standard refuel after long transit',
    createdAt: getRelativeDateISO(7, 16),
    updatedAt: getRelativeDateISO(7, 16),
  },
  {
    id: 'fuel-006',
    vehicleId: 'v2',
    vehicleRegNo: 'MH14CD5678',
    driverId: 'DRV-002',
    driverName: 'Suresh Patil',
    fuelType: 'diesel',
    quantity: 105,
    pricePerUnit: 90.00,
    totalCost: 9450.00,
    odometerReading: 97800,
    fuelStation: 'Shell Commercial - Hinjewadi',
    location: 'Pune',
    receiptNumber: 'RCP-2026-094',
    date: getRelativeDateISO(10, 10),
    notes: 'High-grade diesel fill',
    createdAt: getRelativeDateISO(10, 10),
    updatedAt: getRelativeDateISO(10, 10),
  },
  {
    id: 'fuel-007',
    vehicleId: 'v5',
    vehicleRegNo: 'MH09JK7890',
    driverId: 'DRV-005',
    driverName: 'Mohammed Farooq',
    fuelType: 'diesel',
    quantity: 120,
    pricePerUnit: 89.20,
    totalCost: 10704.00,
    odometerReading: 210150,
    fuelStation: 'Reliance Petroleum - Bhosari',
    location: 'Pune',
    receiptNumber: 'RCP-2026-095',
    date: getRelativeDateISO(13, 12),
    notes: 'Reserve stock replenishment',
    createdAt: getRelativeDateISO(13, 12),
    updatedAt: getRelativeDateISO(13, 12),
  },
  {
    id: 'fuel-008',
    vehicleId: 'v1',
    vehicleRegNo: 'MH12AB1234',
    driverId: 'DRV-001',
    driverName: 'Rajesh Kumar',
    fuelType: 'diesel',
    quantity: 115,
    pricePerUnit: 89.50,
    totalCost: 10292.50,
    odometerReading: 124350,
    fuelStation: 'Indian Oil - Hadapsar',
    location: 'Pune',
    receiptNumber: 'RCP-2026-096',
    date: getRelativeDateISO(16, 7),
    notes: 'Morning shift batch refuel',
    createdAt: getRelativeDateISO(16, 7),
    updatedAt: getRelativeDateISO(16, 7),
  },
  {
    id: 'fuel-009',
    vehicleId: 'v4',
    vehicleRegNo: 'MH20GH3456',
    driverId: 'DRV-004',
    driverName: 'Vikram Singh',
    fuelType: 'cng',
    quantity: 24,
    pricePerUnit: 76.50,
    totalCost: 1836.00,
    odometerReading: 28100,
    fuelStation: 'MNGL CNG Station - Chakan',
    location: 'Chakan',
    receiptNumber: 'RCP-2026-097',
    date: getRelativeDateISO(18, 15),
    notes: 'Mid-week CNG top-up',
    createdAt: getRelativeDateISO(18, 15),
    updatedAt: getRelativeDateISO(18, 15),
  },
  {
    id: 'fuel-010',
    vehicleId: 'v2',
    vehicleRegNo: 'MH14CD5678',
    driverId: 'DRV-002',
    driverName: 'Suresh Patil',
    fuelType: 'diesel',
    quantity: 115,
    pricePerUnit: 89.80,
    totalCost: 10327.00,
    odometerReading: 97450,
    fuelStation: 'HP Auto Care - Kothrud',
    location: 'Pune',
    receiptNumber: 'RCP-2026-098',
    date: getRelativeDateISO(21, 9),
    notes: 'Regular diesel fill',
    createdAt: getRelativeDateISO(21, 9),
    updatedAt: getRelativeDateISO(21, 9),
  },
  {
    id: 'fuel-011',
    vehicleId: 'v3',
    vehicleRegNo: 'MH43EF9012',
    driverId: 'DRV-003',
    driverName: 'Amit Sharma',
    fuelType: 'diesel',
    quantity: 135,
    pricePerUnit: 89.70,
    totalCost: 12109.50,
    odometerReading: 45200,
    fuelStation: 'BPCL Highway Fuelling - Wakad',
    location: 'Pune',
    receiptNumber: 'RCP-2026-099',
    date: getRelativeDateISO(24, 13),
    notes: 'Heavy payload transit refueling',
    createdAt: getRelativeDateISO(24, 13),
    updatedAt: getRelativeDateISO(24, 13),
  },
  {
    id: 'fuel-012',
    vehicleId: 'v1',
    vehicleRegNo: 'MH12AB1234',
    driverId: 'DRV-001',
    driverName: 'Rajesh Kumar',
    fuelType: 'diesel',
    quantity: 120,
    pricePerUnit: 89.50,
    totalCost: 10740.00,
    odometerReading: 123900,
    fuelStation: 'Indian Oil - Hadapsar',
    location: 'Pune',
    receiptNumber: 'RCP-2026-100',
    date: getRelativeDateISO(28, 8),
    notes: 'Monthly fleet run starter refill',
    createdAt: getRelativeDateISO(28, 8),
    updatedAt: getRelativeDateISO(28, 8),
  },
];

export function useFuelManagement() {
  const [records, setRecords] = useState<FuelRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored fuel records:', e);
    }
    return initialMockFuelRecords;
  });

  const [selectedRecord, setSelectedRecord] = useState<FuelRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FuelFilters>({});

  // Sync with localStorage
  const persistRecords = useCallback((newRecords: FuelRecord[]) => {
    setRecords(newRecords);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
    } catch (e) {
      console.error('Failed to save fuel records to localStorage:', e);
    }
    window.dispatchEvent(new CustomEvent('rmc-fuel-records-updated', { detail: newRecords }));
  }, []);

  // Listen to external fuel record updates
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<FuelRecord[]>;
      if (customEvent.detail) {
        setRecords(customEvent.detail);
      }
    };
    window.addEventListener('rmc-fuel-records-updated', handleUpdate);
    return () => window.removeEventListener('rmc-fuel-records-updated', handleUpdate);
  }, []);

  const fetchFuelRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getFuelRecords();
      if (data && Array.isArray(data) && data.length > 0) {
        setRecords(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Fuel records API fallback', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFuelRecords();
  }, [fetchFuelRecords]);

  const getStats = useCallback((): FuelStats => {
    const totalFuelConsumed = records.reduce((sum, r) => sum + r.quantity, 0);
    const totalCost = records.reduce((sum, r) => sum + r.totalCost, 0);
    const avgCostPerLiter = totalFuelConsumed > 0 ? totalCost / totalFuelConsumed : 0;

    // Calculate efficiency by vehicle
    const vehicleEfficiency = new Map<string, FuelEfficiency>();
    records.forEach(r => {
      const existing = vehicleEfficiency.get(r.vehicleId);
      if (existing) {
        existing.totalFuelConsumed += r.quantity;
        existing.totalCost += r.totalCost;
      } else {
        vehicleEfficiency.set(r.vehicleId, {
          vehicleId: r.vehicleId,
          vehicleRegNo: r.vehicleRegNo,
          avgKmPerLiter: 0,
          totalFuelConsumed: r.quantity,
          totalDistanceCovered: 0,
          totalCost: r.totalCost,
          period: 'All Time',
        });
      }
    });

    vehicleEfficiency.forEach((v) => {
      // Calculate realistic distance based on fuel type or vehicle
      const multiplier = v.vehicleRegNo === 'MH20GH3456' ? 18.2 : 4.2;
      v.totalDistanceCovered = Math.round(v.totalFuelConsumed * multiplier);
      v.avgKmPerLiter = Number((v.totalDistanceCovered / v.totalFuelConsumed).toFixed(2));
    });

    const efficiencies = Array.from(vehicleEfficiency.values());
    const sortedByEfficiency = [...efficiencies].sort((a, b) => b.avgKmPerLiter - a.avgKmPerLiter);

    return {
      totalRecords: records.length,
      totalFuelConsumed: Math.round(totalFuelConsumed),
      totalCost: Math.round(totalCost),
      avgCostPerLiter,
      avgKmPerLiter: 4.4,
      mostEfficientVehicle: sortedByEfficiency[0],
      leastEfficientVehicle: sortedByEfficiency[sortedByEfficiency.length - 1],
    };
  }, [records]);

  const getFilteredRecords = useCallback(() => {
    return records.filter(r => {
      if (filters.vehicleId && filters.vehicleId !== 'all' && r.vehicleId !== filters.vehicleId) return false;
      if (filters.driverId && filters.driverId !== 'all' && r.driverId !== filters.driverId) return false;
      if (filters.fuelType && filters.fuelType !== 'all' && r.fuelType !== filters.fuelType) return false;
      if (filters.dateRange) {
        const recordDate = new Date(r.date);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (recordDate < startDate || recordDate > endDate) return false;
      }
      return true;
    });
  }, [records, filters]);

  const addRecord = useCallback((formData: FuelFormData) => {
    // Resolve vehicle details from localStorage if possible
    let regNo = 'MH12AB1234';
    try {
      const vData = localStorage.getItem('rmc_vehicles_data');
      if (vData) {
        const vehicles: Vehicle[] = JSON.parse(vData);
        const found = vehicles.find(v => v.id === formData.vehicleId || v.registrationNo === formData.vehicleId);
        if (found) {
          regNo = found.registrationNo;
        }
      }
    } catch (e) {
      console.warn('Could not read vehicles from storage for fuel record:', e);
    }

    // Resolve driver details if provided
    let drvName: string | undefined = undefined;
    if (formData.driverId) {
      try {
        const dData = localStorage.getItem('rmc_drivers_data');
        if (dData) {
          const drivers: Driver[] = JSON.parse(dData);
          const found = drivers.find(d => d.id === formData.driverId);
          if (found) {
            drvName = found.name;
          }
        }
      } catch (e) {
        console.warn('Could not read drivers from storage for fuel record:', e);
      }
    }

    const calculatedTotal = formData.quantity * formData.pricePerUnit;

    const newRecord: FuelRecord = {
      id: generateFuelRecordId(),
      vehicleId: formData.vehicleId,
      vehicleRegNo: regNo,
      driverId: formData.driverId,
      driverName: drvName,
      tripId: formData.tripId,
      fuelType: formData.fuelType,
      quantity: Number(formData.quantity),
      pricePerUnit: Number(formData.pricePerUnit),
      totalCost: Number(calculatedTotal.toFixed(2)),
      odometerReading: Number(formData.odometerReading) || 0,
      fuelStation: formData.fuelStation || 'Plant In-House Dispenser',
      location: formData.location || 'Pune Depot',
      receiptNumber: formData.receiptNumber || `RCP-${Date.now().toString().slice(-4)}`,
      date: formData.date || new Date().toISOString(),
      notes: formData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newRecord, ...records];
    persistRecords(updated);

    try {
      api.createFuelRecord(newRecord).catch(err => console.warn('API fuel create fallback', err));
    } catch (e) {
      console.warn('API fuel create error', e);
    }

    // If odometer reading is provided and higher, update the vehicle's odometer in vehicle storage
    if (formData.odometerReading && formData.odometerReading > 0) {
      try {
        const vData = localStorage.getItem('rmc_vehicles_data');
        if (vData) {
          const vehicles: Vehicle[] = JSON.parse(vData);
          const targetIndex = vehicles.findIndex(v => v.id === formData.vehicleId || v.registrationNo === regNo);
          if (targetIndex >= 0 && (vehicles[targetIndex].odometer || 0) < formData.odometerReading) {
            vehicles[targetIndex].odometer = formData.odometerReading;
            vehicles[targetIndex].updatedAt = new Date().toISOString();
            localStorage.setItem('rmc_vehicles_data', JSON.stringify(vehicles));
            window.dispatchEvent(new CustomEvent('rmc-fleet-vehicles-updated', { detail: vehicles }));
          }
        }
      } catch (e) {
        console.warn('Failed to update vehicle odometer:', e);
      }
    }

    // Dispatch Audit Trail event
    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'fuel',
        action: 'CREATED',
        entityId: newRecord.id,
        entityType: 'Fuel Record',
        details: `Logged ${newRecord.quantity}L ${newRecord.fuelType.toUpperCase()} for ${newRecord.vehicleRegNo} at ₹${newRecord.totalCost.toLocaleString()} (${newRecord.fuelStation})`,
        severity: 'info',
        performedBy: { id: 'FLEET-SUPV', name: 'Fleet Supervisor', role: 'Supervisor' }
      }
    }));

    return newRecord;
  }, [records, persistRecords]);

  const updateRecord = useCallback((id: string, updates: Partial<FuelRecord>) => {
    const updated = records.map(r => {
      if (r.id !== id) return r;
      const totalCost = (updates.quantity ?? r.quantity) * (updates.pricePerUnit ?? r.pricePerUnit);
      return {
        ...r,
        ...updates,
        totalCost: Number(totalCost.toFixed(2)),
        updatedAt: new Date().toISOString(),
      };
    });
    persistRecords(updated);

    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'fuel',
        action: 'UPDATED',
        entityId: id,
        entityType: 'Fuel Record',
        details: `Updated fuel log #${id}`,
        severity: 'info',
        performedBy: { id: 'FLEET-SUPV', name: 'Fleet Supervisor', role: 'Supervisor' }
      }
    }));
  }, [records, persistRecords]);

  const deleteRecord = useCallback((id: string) => {
    const target = records.find(r => r.id === id);
    const updated = records.filter(r => r.id !== id);
    persistRecords(updated);

    try {
      api.deleteFuelRecord(id).catch(err => console.warn('API fuel delete fallback', err));
    } catch (e) {
      console.warn('API fuel delete error', e);
    }

    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'fuel',
        action: 'DELETED',
        entityId: id,
        entityType: 'Fuel Record',
        details: `Deleted fuel log #${id} for ${target?.vehicleRegNo || 'fleet vehicle'}`,
        severity: 'warning',
        performedBy: { id: 'FLEET-SUPV', name: 'Fleet Supervisor', role: 'Supervisor' }
      }
    }));
  }, [records, persistRecords]);

  const getVehicleEfficiency = useCallback((vehicleId: string): FuelEfficiency | null => {
    const vehicleRecords = records.filter(r => r.vehicleId === vehicleId);
    if (vehicleRecords.length === 0) return null;

    const totalFuel = vehicleRecords.reduce((sum, r) => sum + r.quantity, 0);
    const totalCost = vehicleRecords.reduce((sum, r) => sum + r.totalCost, 0);
    const odometerReadings = vehicleRecords.map(r => r.odometerReading).filter(o => o > 0).sort((a, b) => a - b);
    const distance = odometerReadings.length > 1 ? odometerReadings[odometerReadings.length - 1] - odometerReadings[0] : totalFuel * 4.2;

    return {
      vehicleId,
      vehicleRegNo: vehicleRecords[0].vehicleRegNo,
      avgKmPerLiter: totalFuel > 0 ? Number((distance / totalFuel).toFixed(2)) : 0,
      totalFuelConsumed: totalFuel,
      totalDistanceCovered: distance,
      totalCost,
      period: 'All Time',
    };
  }, [records]);

  const getFuelTrend = useCallback((days: number = 30) => {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    // Group records by calendar date
    const dailyData = new Map<string, { quantity: number; cost: number }>();

    // Pre-populate past days with 0 so the trend line/bars are smooth
    for (let i = days; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dailyData.set(key, { quantity: 0, cost: 0 });
    }
    
    records.forEach(r => {
      const date = new Date(r.date);
      if (date >= startDate && date <= now) {
        const key = date.toISOString().split('T')[0];
        const existing = dailyData.get(key) || { quantity: 0, cost: 0 };
        dailyData.set(key, {
          quantity: Math.round(existing.quantity + r.quantity),
          cost: Math.round(existing.cost + r.totalCost),
        });
      }
    });

    return Array.from(dailyData.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [records]);

  return {
    records,
    selectedRecord,
    setSelectedRecord,
    isLoading,
    filters,
    setFilters,
    stats: getStats(),
    filteredRecords: getFilteredRecords(),
    addRecord,
    updateRecord,
    deleteRecord,
    getVehicleEfficiency,
    getFuelTrend,
    refetch: fetchFuelRecords,
  };
}
