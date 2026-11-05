import { useState, useEffect, useCallback } from 'react';
import { Vehicle, MaintenanceRecord, VehicleStats } from '@/types/vehicle';
import { Driver } from '@/types/driver';
import { toast } from 'sonner';
import { api } from '@/lib/api';

const STORAGE_KEY_VEHICLES = 'rmc_vehicles_data';
const STORAGE_KEY_DRIVERS = 'rmc_drivers_data';
const STORAGE_KEY_MAINT = 'rmc_maintenance_records_history';

// Helper to create dates relative to now (in current 2026 calendar)
const getRelativeDateStr = (daysDelta: number): string => {
  const d = new Date(Date.now() + daysDelta * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
};

const initialMockVehicles: Vehicle[] = [
  {
    id: 'v1',
    registrationNo: 'MH12AB1234',
    type: 'truck',
    make: 'Tata',
    model: 'Prima 4928.S',
    year: 2023,
    capacity: 28,
    capacityUnit: 'ton',
    fuelType: 'diesel',
    status: 'available',
    currentDriver: 'Rajesh Kumar',
    currentDriverPhone: '+91 98765 43210',
    lastMaintenance: getRelativeDateStr(-20),
    nextMaintenance: getRelativeDateStr(70),
    insuranceExpiry: getRelativeDateStr(180),
    fitnessExpiry: getRelativeDateStr(90),
    permitExpiry: getRelativeDateStr(240),
    odometer: 125230,
    fuelEfficiency: 4.2,
    createdAt: getRelativeDateStr(-500),
    updatedAt: getRelativeDateStr(-1),
  },
  {
    id: 'v2',
    registrationNo: 'MH14CD5678',
    type: 'tanker',
    make: 'Ashok Leyland',
    model: 'Captain 2523',
    year: 2022,
    capacity: 20000,
    capacityUnit: 'liters',
    fuelType: 'diesel',
    status: 'in_transit',
    currentDriver: 'Suresh Patil',
    currentDriverPhone: '+91 87654 32109',
    lastMaintenance: getRelativeDateStr(-15),
    nextMaintenance: getRelativeDateStr(75),
    insuranceExpiry: getRelativeDateStr(120),
    // Expiring within 25 days to trigger document expiration notification & badge
    fitnessExpiry: getRelativeDateStr(25),
    permitExpiry: getRelativeDateStr(150),
    odometer: 98120,
    fuelEfficiency: 3.8,
    createdAt: getRelativeDateStr(-600),
    updatedAt: getRelativeDateStr(-2),
  },
  {
    id: 'v3',
    registrationNo: 'MH43EF9012',
    type: 'trailer',
    make: 'Mahindra',
    model: 'Blazo X 46',
    year: 2023,
    capacity: 40,
    capacityUnit: 'ton',
    fuelType: 'diesel',
    status: 'maintenance',
    lastMaintenance: getRelativeDateStr(-40),
    nextMaintenance: getRelativeDateStr(5),
    insuranceExpiry: getRelativeDateStr(210),
    fitnessExpiry: getRelativeDateStr(140),
    permitExpiry: getRelativeDateStr(300),
    odometer: 45680,
    fuelEfficiency: 3.5,
    createdAt: getRelativeDateStr(-350),
    updatedAt: getRelativeDateStr(-4),
  },
  {
    id: 'v4',
    registrationNo: 'MH20GH3456',
    type: 'pickup',
    make: 'Tata',
    model: 'Intra V30',
    year: 2024,
    capacity: 1500,
    capacityUnit: 'kg',
    fuelType: 'cng',
    status: 'available',
    currentDriver: 'Vikram Singh',
    currentDriverPhone: '+91 76543 21098',
    lastMaintenance: getRelativeDateStr(-10),
    nextMaintenance: getRelativeDateStr(80),
    insuranceExpiry: getRelativeDateStr(95),
    fitnessExpiry: getRelativeDateStr(110),
    permitExpiry: getRelativeDateStr(200),
    odometer: 28450,
    fuelEfficiency: 18.2,
    createdAt: getRelativeDateStr(-200),
    updatedAt: getRelativeDateStr(-5),
  },
  {
    id: 'v5',
    registrationNo: 'MH09JK7890',
    type: 'truck',
    make: 'BharatBenz',
    model: '1617R',
    year: 2021,
    capacity: 16,
    capacityUnit: 'ton',
    fuelType: 'diesel',
    status: 'inactive',
    lastMaintenance: getRelativeDateStr(-120),
    nextMaintenance: getRelativeDateStr(-30),
    insuranceExpiry: getRelativeDateStr(-10), // Expired 10 days ago
    fitnessExpiry: getRelativeDateStr(-25),   // Expired 25 days ago
    permitExpiry: getRelativeDateStr(-5),
    odometer: 210150,
    fuelEfficiency: 4.0,
    createdAt: getRelativeDateStr(-800),
    updatedAt: getRelativeDateStr(-13),
  },
];

const initialMockMaintenanceRecords: MaintenanceRecord[] = [
  {
    id: 'm1',
    vehicleId: 'v1',
    type: 'scheduled',
    description: 'Transit mixer drum roller lubrication & slump meter calibration',
    cost: 15000,
    odometerReading: 124800,
    performedAt: getRelativeDateStr(-20),
    performedBy: 'AutoCare Services Pune',
    nextDueAt: getRelativeDateStr(70),
    nextDueOdometer: 135000,
  },
  {
    id: 'm2',
    vehicleId: 'v3',
    type: 'repair',
    description: 'Hydraulic discharge chute liner replacement & emergency brake overhaul',
    cost: 45000,
    odometerReading: 45600,
    performedAt: getRelativeDateStr(-40),
    performedBy: 'Mahindra Commercial Service Center',
    nextDueAt: getRelativeDateStr(5),
  },
];

export const useVehicleManagement = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_VEHICLES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse vehicles from localStorage:', e);
    }
    return initialMockVehicles;
  });

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MAINT);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse maintenance records from localStorage:', e);
    }
    return initialMockMaintenanceRecords;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<Vehicle['status'] | 'all'>('all');

  // Fetch vehicles from MySQL backend on mount
  useEffect(() => {
    setIsLoading(true);
    api.getVehicles()
      .then(data => {
        if (data && data.length > 0) {
          setVehicles(data);
          try { localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(data)); } catch (e) {}
        }
      })
      .catch(err => {
        console.warn('Backend API offline, falling back to local storage:', err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Persistence helper
  const persistVehicles = useCallback((newVehicles: Vehicle[]) => {
    setVehicles(newVehicles);
    try {
      localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(newVehicles));
    } catch (e) {
      console.error('Failed to save vehicles to localStorage:', e);
    }
    window.dispatchEvent(new CustomEvent('rmc-fleet-vehicles-updated', { detail: newVehicles }));
  }, []);

  // Listen to external changes (e.g. from Maintenance Scheduler or sync events)
  useEffect(() => {
    // Maintenance task status update
    const handleMaintenanceStatusUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{
        vehicleRegNo?: string;
        vehicleId?: string;
        status: Vehicle['status'];
        lastMaintenance?: string;
      }>;
      const detail = customEvent.detail;
      if (!detail) return;

      setVehicles(prev => {
        const updated = prev.map(v => {
          const isMatch = (detail.vehicleRegNo && v.registrationNo === detail.vehicleRegNo) ||
                          (detail.vehicleId && v.id === detail.vehicleId);
          if (isMatch) {
            return {
              ...v,
              status: detail.status,
              ...(detail.lastMaintenance ? { lastMaintenance: detail.lastMaintenance } : {}),
              updatedAt: new Date().toISOString(),
            };
          }
          return v;
        });
        try {
          localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(updated));
        } catch (err) {}
        return updated;
      });
    };

    // External vehicle sync event
    const handleVehiclesSync = (e: Event) => {
      const customEvent = e as CustomEvent<Vehicle[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setVehicles(customEvent.detail);
      }
    };

    window.addEventListener('rmc-vehicle-status-update', handleMaintenanceStatusUpdate);
    window.addEventListener('rmc-fleet-vehicles-updated', handleVehiclesSync);

    return () => {
      window.removeEventListener('rmc-vehicle-status-update', handleMaintenanceStatusUpdate);
      window.removeEventListener('rmc-fleet-vehicles-updated', handleVehiclesSync);
    };
  }, []);

  const stats: VehicleStats = {
    totalVehicles: vehicles.length,
    available: vehicles.filter(v => v.status === 'available').length,
    inTransit: vehicles.filter(v => v.status === 'in_transit').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    inactive: vehicles.filter(v => v.status === 'inactive').length,
    expiringDocuments: vehicles.filter(v => {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return (
        new Date(v.insuranceExpiry) <= thirtyDaysFromNow ||
        new Date(v.fitnessExpiry) <= thirtyDaysFromNow ||
        new Date(v.permitExpiry) <= thirtyDaysFromNow
      );
    }).length,
  };

  const filteredVehicles = filter === 'all' 
    ? vehicles 
    : vehicles.filter(v => v.status === filter);

  const addVehicle = useCallback((vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: `v-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...vehicles, newVehicle];
    persistVehicles(updated);
    toast.success(`Vehicle ${newVehicle.registrationNo} added to fleet`);

    // Sync to MySQL API
    api.createVehicle(newVehicle).catch(err => console.warn('Failed to sync vehicle to backend:', err));

    // Audit Event
    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'vehicles',
        action: 'CREATED',
        entityId: newVehicle.id,
        entityType: 'Vehicle',
        details: `Registered new ${newVehicle.make} ${newVehicle.model} (${newVehicle.registrationNo}) with ${newVehicle.capacity} ${newVehicle.capacityUnit} capacity`,
        severity: 'info',
        performedBy: { id: 'FLEET-MGR', name: 'Fleet Manager', role: 'Manager' }
      }
    }));

    return newVehicle;
  }, [vehicles, persistVehicles]);

  const updateVehicle = useCallback((id: string, updates: Partial<Vehicle>) => {
    let updatedVehicle: Vehicle | null = null;
    const updated = vehicles.map(v => {
      if (v.id === id) {
        updatedVehicle = { ...v, ...updates, updatedAt: new Date().toISOString() };
        return updatedVehicle;
      }
      return v;
    });

    persistVehicles(updated);

    // Sync to MySQL API
    api.updateVehicle(id, updates).catch(err => console.warn('Failed to sync vehicle update to backend:', err));

    if (selectedVehicle?.id === id) {
      setSelectedVehicle(prev => prev ? { ...prev, ...updates } : null);
    }
    toast.success('Vehicle details updated');

    if (updatedVehicle) {
      window.dispatchEvent(new CustomEvent('rmc-audit-event', {
        detail: {
          module: 'vehicles',
          action: 'UPDATED',
          entityId: id,
          entityType: 'Vehicle',
          details: `Updated fleet vehicle ${(updatedVehicle as Vehicle).registrationNo}`,
          severity: 'info',
          performedBy: { id: 'FLEET-MGR', name: 'Fleet Manager', role: 'Manager' }
        }
      }));
    }
  }, [vehicles, selectedVehicle, persistVehicles]);

  const deleteVehicle = useCallback((id: string) => {
    const target = vehicles.find(v => v.id === id);
    const updated = vehicles.filter(v => v.id !== id);
    persistVehicles(updated);

    // Sync to MySQL API
    api.deleteVehicle(id).catch(err => console.warn('Failed to sync vehicle delete to backend:', err));

    if (selectedVehicle?.id === id) {
      setSelectedVehicle(null);
    }
    toast.success('Vehicle removed from fleet registry');

    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'vehicles',
        action: 'DELETED',
        entityId: id,
        entityType: 'Vehicle',
        details: `De-registered vehicle ${target?.registrationNo || id} from fleet`,
        severity: 'warning',
        performedBy: { id: 'FLEET-MGR', name: 'Fleet Manager', role: 'Manager' }
      }
    }));
  }, [vehicles, selectedVehicle, persistVehicles]);

  const assignDriver = useCallback((vehicleId: string, driverName: string, driverPhone: string) => {
    let assignedReg = '';

    // Update vehicle's assigned driver
    const updatedVehicles = vehicles.map(v => {
      if (v.id === vehicleId) {
        assignedReg = v.registrationNo;
        return {
          ...v,
          currentDriver: driverName,
          currentDriverPhone: driverPhone,
          status: v.status === 'inactive' ? ('available' as const) : v.status,
          updatedAt: new Date().toISOString(),
        };
      }
      // If another vehicle had this driver, clear it
      if (v.currentDriver === driverName) {
        return {
          ...v,
          currentDriver: undefined,
          currentDriverPhone: undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      return v;
    });

    persistVehicles(updatedVehicles);

    if (selectedVehicle?.id === vehicleId) {
      setSelectedVehicle(prev => prev ? { 
        ...prev, 
        currentDriver: driverName,
        currentDriverPhone: driverPhone,
      } : null);
    }

    // Bidirectional sync with Driver storage
    try {
      const storedDrivers = localStorage.getItem(STORAGE_KEY_DRIVERS);
      if (storedDrivers) {
        const driversList: Driver[] = JSON.parse(storedDrivers);
        const updatedDrivers = driversList.map(d => {
          if (d.name === driverName || d.phone === driverPhone) {
            return { ...d, assignedVehicle: assignedReg };
          }
          if (d.assignedVehicle === assignedReg) {
            return { ...d, assignedVehicle: undefined };
          }
          return d;
        });
        localStorage.setItem(STORAGE_KEY_DRIVERS, JSON.stringify(updatedDrivers));
        window.dispatchEvent(new CustomEvent('rmc-fleet-drivers-updated', { detail: updatedDrivers }));
      }
    } catch (err) {
      console.warn('Failed to sync driver storage during vehicle assignment:', err);
    }

    toast.success(`Assigned ${driverName} to vehicle ${assignedReg}`);

    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'vehicles',
        action: 'STATUS_CHANGE',
        entityId: vehicleId,
        entityType: 'Vehicle',
        details: `Assigned driver ${driverName} (${driverPhone}) to vehicle ${assignedReg}`,
        severity: 'info',
        performedBy: { id: 'FLEET-DISPATCH', name: 'Fleet Dispatcher', role: 'Dispatcher' }
      }
    }));
  }, [vehicles, selectedVehicle, persistVehicles]);

  const unassignDriver = useCallback((vehicleId: string) => {
    let unassignedReg = '';
    let prevDriverName = '';

    const updated = vehicles.map(v => {
      if (v.id === vehicleId) {
        unassignedReg = v.registrationNo;
        prevDriverName = v.currentDriver || '';
        return {
          ...v,
          currentDriver: undefined,
          currentDriverPhone: undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      return v;
    });

    persistVehicles(updated);

    // Sync with Driver storage
    try {
      const storedDrivers = localStorage.getItem(STORAGE_KEY_DRIVERS);
      if (storedDrivers) {
        const driversList: Driver[] = JSON.parse(storedDrivers);
        const updatedDrivers = driversList.map(d => {
          if (d.assignedVehicle === unassignedReg || (prevDriverName && d.name === prevDriverName)) {
            return { ...d, assignedVehicle: undefined };
          }
          return d;
        });
        localStorage.setItem(STORAGE_KEY_DRIVERS, JSON.stringify(updatedDrivers));
        window.dispatchEvent(new CustomEvent('rmc-fleet-drivers-updated', { detail: updatedDrivers }));
      }
    } catch (err) {}

    toast.success(`Driver unassigned from vehicle ${unassignedReg}`);

    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'vehicles',
        action: 'STATUS_CHANGE',
        entityId: vehicleId,
        entityType: 'Vehicle',
        details: `Unassigned driver ${prevDriverName} from vehicle ${unassignedReg}`,
        severity: 'info',
        performedBy: { id: 'FLEET-DISPATCH', name: 'Fleet Dispatcher', role: 'Dispatcher' }
      }
    }));
  }, [vehicles, persistVehicles]);

  const updateStatus = useCallback((vehicleId: string, status: Vehicle['status']) => {
    updateVehicle(vehicleId, { status });
  }, [updateVehicle]);

  const getAvailableVehicles = useCallback(() => {
    return vehicles.filter(v => v.status === 'available' && !v.currentDriver);
  }, [vehicles]);

  const getVehicleMaintenanceRecords = useCallback((vehicleId: string) => {
    return maintenanceRecords.filter(r => r.vehicleId === vehicleId);
  }, [maintenanceRecords]);

  const addMaintenanceRecord = useCallback((record: Omit<MaintenanceRecord, 'id'>) => {
    const newRecord: MaintenanceRecord = {
      ...record,
      id: `m-${Date.now()}`,
    };
    const updated = [...maintenanceRecords, newRecord];
    setMaintenanceRecords(updated);
    try {
      localStorage.setItem(STORAGE_KEY_MAINT, JSON.stringify(updated));
    } catch (err) {}
    
    // Update vehicle's last maintenance
    updateVehicle(record.vehicleId, {
      lastMaintenance: record.performedAt,
      nextMaintenance: record.nextDueAt,
      odometer: record.odometerReading,
    });
    
    toast.success('Maintenance record added');
  }, [maintenanceRecords, updateVehicle]);

  return {
    vehicles: filteredVehicles,
    allVehicles: vehicles,
    selectedVehicle,
    setSelectedVehicle,
    stats,
    isLoading,
    filter,
    setFilter,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    assignDriver,
    unassignDriver,
    updateStatus,
    getVehicleMaintenanceRecords,
    addMaintenanceRecord,
    getAvailableVehicles,
  };
};
