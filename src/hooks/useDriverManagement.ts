import { useState, useEffect, useCallback } from 'react';
import { Driver, TripAssignment, DriverStats, DriverLicense } from '@/types/driver';
import { Vehicle } from '@/types/vehicle';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const STORAGE_KEY_DRIVERS = 'rmc_drivers_data';
const STORAGE_KEY_ASSIGNMENTS = 'rmc_driver_assignments';
const STORAGE_KEY_VEHICLES = 'rmc_vehicles_data';

// Helper to create dates relative to now
const getRelativeDateStr = (daysDelta: number): string => {
  const d = new Date(Date.now() + daysDelta * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
};

const initialMockDrivers: Driver[] = [
  {
    id: 'DRV-001',
    name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    email: 'rajesh.kumar@rmcplant.com',
    dateOfBirth: '1985-03-15',
    address: '123 MG Road, Andheri East, Mumbai - 400069',
    employeeId: 'EMP-1001',
    dateOfJoining: '2019-06-01',
    status: 'available',
    emergencyContact: {
      name: 'Priya Kumar',
      relation: 'Spouse',
      phone: '+91 98765 43211',
    },
    license: {
      number: 'MH1420180012345',
      type: 'HGMV',
      issueDate: '2018-01-15',
      expiryDate: getRelativeDateStr(580),
      issuingAuthority: 'RTO Mumbai Central',
      endorsements: ['Hazmat', 'Heavy Machinery', 'Transit Mixer Operations'],
      status: 'valid',
    },
    assignedVehicle: 'MH12AB1234',
    rating: 4.8,
    totalTrips: 1245,
    totalDistance: 45678,
  },
  {
    id: 'DRV-002',
    name: 'Suresh Patil',
    phone: '+91 87654 32109',
    email: 'suresh.patil@rmcplant.com',
    dateOfBirth: '1990-07-22',
    address: '45 Shivaji Nagar, Thane West - 400602',
    employeeId: 'EMP-1002',
    dateOfJoining: '2020-09-15',
    status: 'on_trip',
    emergencyContact: {
      name: 'Sunita Patil',
      relation: 'Spouse',
      phone: '+91 98765 43212',
    },
    license: {
      number: 'MH1420190054321',
      type: 'HGMV',
      issueDate: '2019-03-20',
      expiryDate: getRelativeDateStr(720),
      issuingAuthority: 'RTO Thane',
      endorsements: ['Heavy Machinery', 'Concrete Pump Operation'],
      status: 'valid',
    },
    assignedVehicle: 'MH14CD5678',
    rating: 4.6,
    totalTrips: 892,
    totalDistance: 32456,
    currentTripId: 'TRIP-002',
  },
  {
    id: 'DRV-003',
    name: 'Amit Sharma',
    phone: '+91 98765 43213',
    email: 'amit.sharma@rmcplant.com',
    dateOfBirth: '1988-11-08',
    address: '78 Gandhi Nagar, Powai, Mumbai - 400076',
    employeeId: 'EMP-1003',
    dateOfJoining: '2018-04-10',
    status: 'available',
    emergencyContact: {
      name: 'Rekha Sharma',
      relation: 'Mother',
      phone: '+91 98765 43214',
    },
    license: {
      number: 'MH1420170098765',
      type: 'HGMV',
      issueDate: '2017-02-28',
      // Expiring in 18 days to trigger expiry notification and badge
      expiryDate: getRelativeDateStr(18),
      issuingAuthority: 'RTO Mumbai',
      endorsements: ['Hazmat', 'Heavy Machinery', 'Crane'],
      status: 'expiring_soon',
    },
    rating: 4.9,
    totalTrips: 1567,
    totalDistance: 58923,
  },
  {
    id: 'DRV-004',
    name: 'Vikram Singh',
    phone: '+91 76543 21098',
    email: 'vikram.singh@rmcplant.com',
    dateOfBirth: '1992-05-18',
    address: '12 Nehru Road, Borivali West, Mumbai - 400092',
    employeeId: 'EMP-1004',
    dateOfJoining: '2021-01-20',
    status: 'available',
    emergencyContact: {
      name: 'Meena Singh',
      relation: 'Spouse',
      phone: '+91 98765 43216',
    },
    license: {
      number: 'MH1420200087654',
      type: 'HMV',
      issueDate: '2020-01-05',
      expiryDate: getRelativeDateStr(850),
      issuingAuthority: 'RTO Mumbai',
      endorsements: ['Heavy Machinery'],
      status: 'valid',
    },
    assignedVehicle: 'MH20GH3456',
    rating: 4.5,
    totalTrips: 456,
    totalDistance: 15678,
  },
  {
    id: 'DRV-005',
    name: 'Mohammed Farooq',
    phone: '+91 98765 43217',
    email: 'mohammed.farooq@rmcplant.com',
    dateOfBirth: '1987-09-25',
    address: '34 Mira Road, Mira-Bhayandar - 401107',
    employeeId: 'EMP-1005',
    dateOfJoining: '2017-08-12',
    status: 'on_leave',
    emergencyContact: {
      name: 'Fatima Farooq',
      relation: 'Spouse',
      phone: '+91 98765 43218',
    },
    license: {
      number: 'MH1420160045678',
      type: 'HGMV',
      issueDate: '2016-06-10',
      expiryDate: getRelativeDateStr(420),
      issuingAuthority: 'RTO Thane',
      endorsements: ['Hazmat', 'Heavy Machinery'],
      status: 'valid',
    },
    rating: 4.7,
    totalTrips: 1890,
    totalDistance: 72345,
  },
];

const initialMockAssignments: TripAssignment[] = [
  {
    id: 'ASSIGN-001',
    tripId: 'TRIP-001',
    driverId: 'DRV-001',
    vehicleRegNo: 'MH12AB1234',
    material: 'M25 RMC',
    quantity: 18500,
    customer: 'ABC Construction Ltd',
    destination: 'Bandra Site, Mumbai',
    assignedAt: new Date(Date.now() - 60 * 60000).toISOString(),
    startedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    status: 'in_progress',
    distance: 25,
  },
  {
    id: 'ASSIGN-002',
    tripId: 'TRIP-002',
    driverId: 'DRV-002',
    vehicleRegNo: 'MH14CD5678',
    material: 'M30 RMC',
    quantity: 20000,
    customer: 'XYZ Developers',
    destination: 'Andheri Project, Mumbai',
    assignedAt: new Date(Date.now() - 35 * 60000).toISOString(),
    startedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    status: 'in_progress',
    distance: 21,
  },
  {
    id: 'ASSIGN-003',
    tripId: 'TRIP-100',
    driverId: 'DRV-001',
    vehicleRegNo: 'MH12AB1234',
    material: 'M20 RMC',
    quantity: 15000,
    customer: 'PQR Builders',
    destination: 'Worli Site, Mumbai',
    assignedAt: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(),
    startedAt: new Date(Date.now() - 3 * 24 * 60 * 60000 + 10 * 60000).toISOString(),
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60000 + 90 * 60000).toISOString(),
    status: 'completed',
    distance: 18,
    duration: 80,
    rating: 5,
    feedback: 'Excellent delivery, on time',
  },
];

export const useDriverManagement = () => {
  const { toast } = useToast();

  const [drivers, setDrivers] = useState<Driver[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DRIVERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse drivers from localStorage:', e);
    }
    return initialMockDrivers;
  });

  const [assignments, setAssignments] = useState<TripAssignment[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse driver assignments from localStorage:', e);
    }
    return initialMockAssignments;
  });

  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch drivers from MySQL backend on mount
  useEffect(() => {
    setLoading(true);
    api.getDrivers()
      .then(data => {
        if (data && data.length > 0) {
          setDrivers(data);
          try { localStorage.setItem(STORAGE_KEY_DRIVERS, JSON.stringify(data)); } catch (e) {}
        }
      })
      .catch(err => {
        console.warn('Backend API offline, using local drivers:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Persistence helper
  const persistDrivers = useCallback((newDrivers: Driver[]) => {
    setDrivers(newDrivers);
    try {
      localStorage.setItem(STORAGE_KEY_DRIVERS, JSON.stringify(newDrivers));
    } catch (e) {
      console.error('Failed to save drivers to localStorage:', e);
    }
    window.dispatchEvent(new CustomEvent('rmc-fleet-drivers-updated', { detail: newDrivers }));
  }, []);

  // Sync listener
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<Driver[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setDrivers(customEvent.detail);
      }
    };
    window.addEventListener('rmc-fleet-drivers-updated', handleSync);
    return () => window.removeEventListener('rmc-fleet-drivers-updated', handleSync);
  }, []);

  const getStats = useCallback((): DriverStats => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      totalDrivers: drivers.length,
      availableDrivers: drivers.filter(d => d.status === 'available').length,
      onTripDrivers: drivers.filter(d => d.status === 'on_trip').length,
      onLeaveDrivers: drivers.filter(d => d.status === 'on_leave').length,
      licensesExpiringSoon: drivers.filter(d => {
        const expiry = new Date(d.license.expiryDate);
        return (expiry <= thirtyDaysFromNow && expiry > now) || d.license.status === 'expiring_soon';
      }).length,
    };
  }, [drivers]);

  const addDriver = useCallback((driverData: Omit<Driver, 'id' | 'rating' | 'totalTrips' | 'totalDistance'>) => {
    const newDriver: Driver = {
      ...driverData,
      id: `DRV-${String(drivers.length + 1).padStart(3, '0')}`,
      rating: 5.0,
      totalTrips: 0,
      totalDistance: 0,
    };

    const updated = [...drivers, newDriver];
    persistDrivers(updated);

    // Sync to MySQL API
    api.createDriver(newDriver).catch(err => console.warn('Failed to sync driver to API:', err));

    toast({
      title: 'Driver Added',
      description: `${newDriver.name} has been enrolled into driver registry`,
    });

    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'drivers',
        action: 'CREATED',
        entityId: newDriver.id,
        entityType: 'Driver',
        details: `Enrolled driver ${newDriver.name} (${newDriver.employeeId}) with ${newDriver.license.type} license`,
        severity: 'info',
        performedBy: { id: 'HR-OFFICER', name: 'Fleet HR Officer', role: 'HR' }
      }
    }));

    return newDriver;
  }, [drivers, persistDrivers, toast]);

  const updateDriver = useCallback((id: string, updates: Partial<Driver>) => {
    let targetDriver: Driver | null = null;
    const updated = drivers.map(driver => {
      if (driver.id === id) {
        targetDriver = { ...driver, ...updates };
        return targetDriver;
      }
      return driver;
    });

    persistDrivers(updated);

    // Sync to MySQL API
    api.updateDriver(id, updates).catch(err => console.warn('Failed to sync driver update to API:', err));

    if (selectedDriver?.id === id) {
      setSelectedDriver(prev => prev ? { ...prev, ...updates } : null);
    }

    toast({
      title: 'Driver Updated',
      description: 'Driver profile details updated successfully',
    });

    if (targetDriver) {
      window.dispatchEvent(new CustomEvent('rmc-audit-event', {
        detail: {
          module: 'drivers',
          action: 'UPDATED',
          entityId: id,
          entityType: 'Driver',
          details: `Updated profile for driver ${(targetDriver as Driver).name} (${id})`,
          severity: 'info',
          performedBy: { id: 'HR-OFFICER', name: 'Fleet HR Officer', role: 'HR' }
        }
      }));
    }
  }, [drivers, selectedDriver, persistDrivers, toast]);

  const deleteDriver = useCallback((id: string) => {
    const driver = drivers.find(d => d.id === id);
    if (driver?.status === 'on_trip') {
      toast({
        title: 'Cannot Delete Driver',
        description: 'Driver is currently actively piloting an in-progress trip',
        variant: 'destructive',
      });
      return false;
    }

    const updated = drivers.filter(d => d.id !== id);
    persistDrivers(updated);

    // Sync to MySQL API
    api.deleteDriver(id).catch(err => console.warn('Failed to sync driver delete to API:', err));

    // If driver had assigned vehicle, unassign that vehicle in vehicle storage
    if (driver?.assignedVehicle) {
      try {
        const storedV = localStorage.getItem(STORAGE_KEY_VEHICLES);
        if (storedV) {
          const vList: Vehicle[] = JSON.parse(storedV);
          const updatedV = vList.map(v => {
            if (v.registrationNo === driver.assignedVehicle) {
              return { ...v, currentDriver: undefined, currentDriverPhone: undefined, updatedAt: new Date().toISOString() };
            }
            return v;
          });
          localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(updatedV));
          window.dispatchEvent(new CustomEvent('rmc-fleet-vehicles-updated', { detail: updatedV }));
        }
      } catch (e) {}
    }

    toast({
      title: 'Driver Removed',
      description: 'Driver profile removed from active roster',
    });

    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'drivers',
        action: 'DELETED',
        entityId: id,
        entityType: 'Driver',
        details: `De-registered driver ${driver?.name || id} from company roster`,
        severity: 'warning',
        performedBy: { id: 'HR-OFFICER', name: 'Fleet HR Officer', role: 'HR' }
      }
    }));

    return true;
  }, [drivers, persistDrivers, toast]);

  const updateDriverStatus = useCallback((id: string, status: Driver['status']) => {
    let drvName = '';
    const updated = drivers.map(driver => {
      if (driver.id === id) {
        drvName = driver.name;
        return { ...driver, status };
      }
      return driver;
    });

    persistDrivers(updated);

    toast({
      title: 'Status Updated',
      description: `Driver ${drvName} status changed to ${status.replace('_', ' ')}`,
    });

    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'drivers',
        action: 'STATUS_CHANGE',
        entityId: id,
        entityType: 'Driver',
        details: `Updated status to ${status.toUpperCase()} for ${drvName}`,
        severity: 'info',
        performedBy: { id: 'FLEET-DISPATCH', name: 'Fleet Dispatcher', role: 'Dispatcher' }
      }
    }));
  }, [drivers, persistDrivers, toast]);

  const assignVehicle = useCallback((driverId: string, vehicleRegNo: string | undefined) => {
    let targetDriver: Driver | null = null;

    const updatedDrivers = drivers.map(driver => {
      if (driver.id === driverId) {
        targetDriver = { ...driver, assignedVehicle: vehicleRegNo };
        return targetDriver;
      }
      // If unassigning or another driver had this vehicle, clear it
      if (vehicleRegNo && driver.assignedVehicle === vehicleRegNo) {
        return { ...driver, assignedVehicle: undefined };
      }
      return driver;
    });

    persistDrivers(updatedDrivers);

    // Sync with Vehicle storage
    try {
      const storedVehicles = localStorage.getItem(STORAGE_KEY_VEHICLES);
      if (storedVehicles) {
        const vList: Vehicle[] = JSON.parse(storedVehicles);
        const updatedV = vList.map(v => {
          if (vehicleRegNo && v.registrationNo === vehicleRegNo) {
            return {
              ...v,
              currentDriver: targetDriver?.name,
              currentDriverPhone: targetDriver?.phone,
              updatedAt: new Date().toISOString(),
            };
          }
          // If unassigning, clear driver from old vehicle
          if (!vehicleRegNo && targetDriver && v.registrationNo === targetDriver.assignedVehicle) {
            return {
              ...v,
              currentDriver: undefined,
              currentDriverPhone: undefined,
              updatedAt: new Date().toISOString(),
            };
          }
          return v;
        });
        localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(updatedV));
        window.dispatchEvent(new CustomEvent('rmc-fleet-vehicles-updated', { detail: updatedV }));
      }
    } catch (err) {
      console.warn('Failed to sync vehicle storage during driver assignment:', err);
    }

    toast({
      title: vehicleRegNo ? 'Vehicle Assigned' : 'Vehicle Unassigned',
      description: vehicleRegNo
        ? `Vehicle ${vehicleRegNo} assigned to ${targetDriver?.name || 'driver'}`
        : 'Vehicle unassigned from driver profile',
    });

    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'drivers',
        action: 'STATUS_CHANGE',
        entityId: driverId,
        entityType: 'Driver',
        details: vehicleRegNo
          ? `Assigned vehicle ${vehicleRegNo} to driver ${targetDriver?.name}`
          : `Unassigned vehicle from driver ${targetDriver?.name}`,
        severity: 'info',
        performedBy: { id: 'FLEET-DISPATCH', name: 'Fleet Dispatcher', role: 'Dispatcher' }
      }
    }));
  }, [drivers, persistDrivers, toast]);

  const getDriversWithExpiringLicenses = useCallback((daysThreshold: number = 30): Driver[] => {
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);
    return drivers.filter(d => new Date(d.license.expiryDate) <= thresholdDate);
  }, [drivers]);

  const getDriverAssignments = useCallback((driverId: string): TripAssignment[] => {
    return assignments
      .filter(a => a.driverId === driverId)
      .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
  }, [assignments]);

  const getAvailableDrivers = useCallback((): Driver[] => {
    return drivers.filter(d => d.status === 'available');
  }, [drivers]);

  const getLicenseStatus = useCallback((license: DriverLicense): DriverLicense['status'] => {
    const now = new Date();
    const expiry = new Date(license.expiryDate);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (expiry < now) return 'expired';
    if (expiry <= thirtyDaysFromNow) return 'expiring_soon';
    return 'valid';
  }, []);

  return {
    drivers,
    assignments,
    selectedDriver,
    setSelectedDriver,
    loading,
    getStats,
    addDriver,
    updateDriver,
    deleteDriver,
    updateDriverStatus,
    assignVehicle,
    getDriverAssignments,
    getAvailableDrivers,
    getLicenseStatus,
    getDriversWithExpiringLicenses,
  };
};
