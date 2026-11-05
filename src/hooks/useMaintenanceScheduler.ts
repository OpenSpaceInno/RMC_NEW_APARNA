import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  MaintenanceTask, 
  MaintenanceSchedule, 
  PartsInventory, 
  MaintenanceStats, 
  MaintenanceFormData,
  MaintenancePart
} from '@/types/maintenance';
import { api } from '@/lib/api';

const TASKS_STORAGE_KEY = 'rmc_maintenance_tasks';
const SCHEDULES_STORAGE_KEY = 'rmc_maintenance_schedules';
const PARTS_STORAGE_KEY = 'rmc_parts_inventory';

const createInitialTasks = (): MaintenanceTask[] => {
  const now = new Date();
  const formatDay = (daysOffset: number) => {
    const d = new Date(now.getTime() + daysOffset * 86400000);
    return d.toISOString();
  };

  return [
    {
      id: 'task-001',
      vehicleId: 'v1',
      vehicleRegNo: 'MH12AB1234',
      type: 'preventive',
      title: 'Mixer Drum Roller Bearing Lubrication',
      description: 'Grease seal repacking and roller bearing runout check for transit mixer drum.',
      status: 'scheduled',
      priority: 'medium',
      scheduledDate: formatDay(2),
      estimatedCost: 4500,
      technician: 'Ramesh AutoEng',
      parts: [
        { id: 'p1', name: 'Heavy Duty Lithium EP-2 Grease', partNumber: 'GRS-EP2-400', quantity: 2, unitCost: 380, totalCost: 760 }
      ],
      notes: 'Standard 250-hour lubrication cycle.',
      createdAt: formatDay(-5),
      updatedAt: formatDay(-1),
    },
    {
      id: 'task-002',
      vehicleId: 'v2',
      vehicleRegNo: 'MH14CD5678',
      type: 'preventive',
      title: 'Hydraulic Pump & Relief Valve Pressure Test',
      description: 'Check auxiliary hydrostatic drive pressure under full drum load (350 bar test).',
      status: 'in_progress',
      priority: 'high',
      scheduledDate: formatDay(0),
      estimatedCost: 12000,
      technician: 'Apex Hydraulics Pune',
      parts: [
        { id: 'p2', name: 'Hydraulic Pressure Filter', partNumber: 'HYD-FLT-09', quantity: 1, unitCost: 3200, totalCost: 3200 }
      ],
      notes: 'Driver reported minor sluggishness during high-slump discharge.',
      createdAt: formatDay(-2),
      updatedAt: formatDay(0),
    },
    {
      id: 'task-003',
      vehicleId: 'v3',
      vehicleRegNo: 'MH43EF9012',
      type: 'corrective',
      title: 'Discharge Chute Swivel Pin & Liner Replacement',
      description: 'Worn chute steel liner causing concrete hang-up. Replace with polyurethane wear liner.',
      status: 'in_progress',
      priority: 'high',
      scheduledDate: formatDay(-1),
      estimatedCost: 18500,
      technician: 'Mahindra Service Center',
      parts: [
        { id: 'p3', name: 'Polyurethane Chute Liner Sheet', partNumber: 'LIN-PU-400', quantity: 2, unitCost: 4100, totalCost: 8200 }
      ],
      notes: 'Vehicle currently grounded in plant workshop bay #2.',
      createdAt: formatDay(-3),
      updatedAt: formatDay(-1),
    },
    {
      id: 'task-004',
      vehicleId: 'v4',
      vehicleRegNo: 'MH20GH3456',
      type: 'inspection',
      title: 'Water Flowmeter & Slump Sensor Calibration',
      description: 'Quarterly metrological verification of batch water injection meter.',
      status: 'completed',
      priority: 'low',
      scheduledDate: formatDay(-7),
      completedDate: formatDay(-7),
      estimatedCost: 2800,
      actualCost: 2800,
      technician: 'QA Metro Labs',
      parts: [],
      notes: 'Calibration certificate valid for 90 days.',
      createdAt: formatDay(-10),
      updatedAt: formatDay(-7),
    },
    {
      id: 'task-005',
      vehicleId: 'v5',
      vehicleRegNo: 'MH09JK7890',
      type: 'corrective',
      title: 'Drum Spiral Blade Wear Hardfacing & Engine Service',
      description: 'Severe blade wear detected; concrete buildup on outer spirals. Re-welding wear strips.',
      status: 'overdue',
      priority: 'critical',
      scheduledDate: formatDay(-4),
      estimatedCost: 55000,
      technician: 'Tata Commercial Workshop',
      parts: [
        { id: 'p4', name: 'Drum Blade Wear Liner Plate', partNumber: 'BLD-WR-01', quantity: 4, unitCost: 6400, totalCost: 25600 }
      ],
      notes: 'Overdue service. Vehicle flagged inactive until repair sign-off.',
      createdAt: formatDay(-12),
      updatedAt: formatDay(-4),
    },
  ];
};

const createInitialSchedules = (): MaintenanceSchedule[] => {
  const now = new Date();
  const formatDay = (daysOffset: number) => new Date(now.getTime() + daysOffset * 86400000).toISOString();

  return [
    {
      id: 'sched-001',
      vehicleId: 'v1',
      vehicleRegNo: 'MH12AB1234',
      taskName: '500-Hour Drum Hydrostatic Gearbox Oil Replacement',
      intervalDays: 90,
      intervalKm: 15000,
      lastPerformed: formatDay(-78),
      nextDueDate: formatDay(12),
      isOverdue: false,
      daysUntilDue: 12,
    },
    {
      id: 'sched-002',
      vehicleId: 'v2',
      vehicleRegNo: 'MH14CD5678',
      taskName: 'Hydraulic Filter Element Replacement',
      intervalDays: 60,
      intervalKm: 10000,
      lastPerformed: formatDay(-42),
      nextDueDate: formatDay(18),
      isOverdue: false,
      daysUntilDue: 18,
    },
    {
      id: 'sched-003',
      vehicleId: 'v3',
      vehicleRegNo: 'MH43EF9012',
      taskName: 'Annual Chassis Structural & Leaf Spring Inspection',
      intervalDays: 365,
      intervalKm: 50000,
      lastPerformed: formatDay(-368),
      nextDueDate: formatDay(-3),
      isOverdue: true,
      daysUntilDue: -3,
    },
    {
      id: 'sched-004',
      vehicleId: 'v4',
      vehicleRegNo: 'MH20GH3456',
      taskName: 'Water Tank Pressure Relief Valve & Hose Check',
      intervalDays: 90,
      lastPerformed: formatDay(-65),
      nextDueDate: formatDay(25),
      isOverdue: false,
      daysUntilDue: 25,
    },
    {
      id: 'sched-005',
      vehicleId: 'v5',
      vehicleRegNo: 'MH09JK7890',
      taskName: 'Air Brake Pneumatics & ABS Sensor Calibration',
      intervalDays: 180,
      lastPerformed: formatDay(-188),
      nextDueDate: formatDay(-8),
      isOverdue: true,
      daysUntilDue: -8,
    },
  ];
};

const createInitialParts = (): PartsInventory[] => {
  const now = new Date().toISOString();
  return [
    {
      id: 'part-001',
      name: 'Transit Mixer Drum Roller Bearing (Heavy Duty)',
      partNumber: 'RLR-BRG-22318',
      category: 'Drum Drive',
      quantity: 6,
      minStock: 2,
      unitCost: 8500,
      supplier: 'SKF Bearings India',
      location: 'Rack A-04',
      lastRestocked: '2026-09-15',
      isLowStock: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'part-002',
      name: 'Hydraulic Return Line Pressure Filter Element',
      partNumber: 'HYD-FLT-09',
      category: 'Hydraulics',
      quantity: 1,
      minStock: 3,
      unitCost: 3200,
      supplier: 'Parker Hannifin',
      location: 'Rack B-02',
      lastRestocked: '2026-08-20',
      isLowStock: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'part-003',
      name: 'Polyurethane Chute Wear Liner Sheet (1200x600mm)',
      partNumber: 'LIN-PU-400',
      category: 'Chute Assembly',
      quantity: 8,
      minStock: 4,
      unitCost: 4100,
      supplier: 'Vulcan Polymers',
      location: 'Rack C-01',
      lastRestocked: '2026-09-28',
      isLowStock: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'part-004',
      name: 'High-Pressure Water Washout Spray Nozzle',
      partNumber: 'NZL-WSH-15',
      category: 'Water System',
      quantity: 12,
      minStock: 5,
      unitCost: 850,
      supplier: 'Spraying Systems Co',
      location: 'Bin D-12',
      lastRestocked: '2026-10-01',
      isLowStock: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'part-005',
      name: 'Drum Internal Spiral Blade Wear Liner Plate (Hardox 450)',
      partNumber: 'BLD-WR-01',
      category: 'Drum Shell',
      quantity: 2,
      minStock: 4,
      unitCost: 6400,
      supplier: 'SSAB Hardox Steel',
      location: 'Heavy Storage Bay',
      lastRestocked: '2026-07-10',
      isLowStock: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'part-006',
      name: 'Heavy Duty Lithium EP-2 Grease Cartridge (400g)',
      partNumber: 'GRS-EP2-400',
      category: 'Consumables',
      quantity: 18,
      minStock: 10,
      unitCost: 380,
      supplier: 'Castrol Industrial',
      location: 'Chemical Cabinet E',
      lastRestocked: '2026-10-02',
      isLowStock: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
};

export function useMaintenanceScheduler() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [parts, setParts] = useState<PartsInventory[]>([]);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from LocalStorage or rich initial RMC datasets
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
      const savedSchedules = localStorage.getItem(SCHEDULES_STORAGE_KEY);
      const savedParts = localStorage.getItem(PARTS_STORAGE_KEY);

      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      } else {
        const initialTasks = createInitialTasks();
        setTasks(initialTasks);
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(initialTasks));
      }

      if (savedSchedules) {
        setSchedules(JSON.parse(savedSchedules));
      } else {
        const initialSchedules = createInitialSchedules();
        setSchedules(initialSchedules);
        localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(initialSchedules));
      }

      if (savedParts) {
        setParts(JSON.parse(savedParts));
      } else {
        const initialParts = createInitialParts();
        setParts(initialParts);
        localStorage.setItem(PARTS_STORAGE_KEY, JSON.stringify(initialParts));
      }
    } catch (e) {
      console.warn('Failed to parse maintenance local storage, using initial data', e);
      setTasks(createInitialTasks());
      setSchedules(createInitialSchedules());
      setParts(createInitialParts());
    } finally {
      setIsLoading(false);
    }

    // Attempt to pull latest maintenance tasks from MySQL API
    api.getMaintenanceTasks()
      .then(dbTasks => {
        if (dbTasks && Array.isArray(dbTasks) && dbTasks.length > 0) {
          setTasks(dbTasks);
          localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(dbTasks));
        }
      })
      .catch(err => console.warn('API maintenance tasks fallback', err));
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getMaintenanceTasks();
      if (data && Array.isArray(data) && data.length > 0) {
        setTasks(data);
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.warn('API maintenance tasks error', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save changes to localStorage helper
  const persistTasks = useCallback((newTasks: MaintenanceTask[]) => {
    setTasks(newTasks);
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(newTasks));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const persistSchedules = useCallback((newSchedules: MaintenanceSchedule[]) => {
    setSchedules(newSchedules);
    try {
      localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(newSchedules));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const persistParts = useCallback((newParts: PartsInventory[]) => {
    setParts(newParts);
    try {
      localStorage.setItem(PARTS_STORAGE_KEY, JSON.stringify(newParts));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const getStats = useCallback((): MaintenanceStats => {
    const totalCost = tasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.actualCost || t.estimatedCost), 0);

    const completedCount = tasks.filter(t => t.status === 'completed').length;

    return {
      totalTasks: tasks.length,
      scheduled: tasks.filter(t => t.status === 'scheduled').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: completedCount,
      overdue: tasks.filter(t => t.status === 'overdue').length,
      totalCost,
      avgCostPerTask: completedCount > 0 ? Math.round(totalCost / completedCount) : 0,
      lowStockParts: parts.filter(p => p.isLowStock).length,
    };
  }, [tasks, parts]);

  const createTask = useCallback(async (formData: MaintenanceFormData) => {
    const now = new Date().toISOString();
    const newTask: MaintenanceTask = {
      id: `task-${Date.now()}`,
      vehicleId: formData.vehicleId,
      vehicleRegNo: formData.vehicleId,
      type: formData.type,
      title: formData.title,
      description: formData.description || '',
      status: 'scheduled',
      priority: formData.priority,
      scheduledDate: formData.scheduledDate,
      estimatedCost: Number(formData.estimatedCost) || 0,
      technician: formData.technician,
      parts: [],
      notes: formData.notes,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newTask, ...tasks];
    persistTasks(updated);

    try {
      api.createMaintenanceTask(newTask).catch(e => console.warn('API create task fallback', e));
    } catch (e) {
      console.warn('API task error', e);
    }

    toast({ title: 'Task Scheduled', description: `Maintenance task scheduled for ${newTask.vehicleRegNo}` });

    // Audit Trail event
    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'maintenance',
        action: 'CREATED',
        entityId: newTask.id,
        entityType: 'Maintenance Task',
        details: `Scheduled ${newTask.type} maintenance: "${newTask.title}" for vehicle ${newTask.vehicleRegNo}`,
        severity: newTask.priority === 'critical' ? 'warning' : 'info',
        performedBy: { id: 'FLEET-MECH', name: 'Fleet Maintenance Supv', role: 'Engineer' }
      }
    }));

    return newTask;
  }, [tasks, persistTasks, toast]);

  const updateTask = useCallback(async (id: string, updates: Partial<MaintenanceTask>) => {
    const updated = tasks.map(t => {
      if (t.id !== id) return t;
      return {
        ...t,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    });
    persistTasks(updated);

    try {
      api.updateMaintenanceTask(id, updates).catch(e => console.warn('API update task fallback', e));
    } catch (e) {
      console.warn('API update task error', e);
    }

    toast({ title: 'Task Updated', description: 'Maintenance task has been updated' });
  }, [tasks, persistTasks, toast]);

  const updateTaskStatus = useCallback(async (id: string, status: MaintenanceTask['status']) => {
    const now = new Date().toISOString();
    let affectedVehicleRegNo = '';

    const updated = tasks.map(t => {
      if (t.id !== id) return t;
      affectedVehicleRegNo = t.vehicleRegNo;
      return {
        ...t,
        status,
        completedDate: status === 'completed' ? now : t.completedDate,
        actualCost: status === 'completed' && !t.actualCost ? t.estimatedCost : t.actualCost,
        updatedAt: now,
      };
    });

    persistTasks(updated);

    try {
      api.updateMaintenanceTask(id, {
        status,
        completedDate: status === 'completed' ? now : undefined
      }).catch(e => console.warn('API update task status fallback', e));
    } catch (e) {
      console.warn('API update task status error', e);
    }

    toast({ title: 'Status Updated', description: `Task marked as ${status.replace('_', ' ')}` });

    // Cross-module vehicle status event
    if (status === 'in_progress') {
      window.dispatchEvent(new CustomEvent('rmc-vehicle-status-update', {
        detail: { vehicleRegNo: affectedVehicleRegNo, status: 'maintenance' }
      }));
    } else if (status === 'completed') {
      window.dispatchEvent(new CustomEvent('rmc-vehicle-status-update', {
        detail: { vehicleRegNo: affectedVehicleRegNo, status: 'available', lastMaintenance: now.split('T')[0] }
      }));
    }

    // Audit Trail event
    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'maintenance',
        action: status === 'completed' ? 'VERIFICATION_PASSED' : 'STATUS_CHANGE',
        entityId: id,
        entityType: 'Maintenance Task',
        details: `Task status updated to ${status.toUpperCase()} for ${affectedVehicleRegNo}`,
        severity: status === 'completed' ? 'info' : status === 'overdue' ? 'warning' : 'info',
        performedBy: { id: 'MECH-01', name: 'Workshop Incharge', role: 'Engineer' }
      }
    }));
  }, [tasks, persistTasks, toast]);

  const deleteTask = useCallback(async (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    const updated = tasks.filter(t => t.id !== id);
    persistTasks(updated);

    try {
      api.deleteMaintenanceTask(id).catch(e => console.warn('API delete task fallback', e));
    } catch (e) {
      console.warn('API delete task error', e);
    }

    toast({ title: 'Task Removed', description: 'Maintenance task was deleted' });

    if (taskToDelete) {
      window.dispatchEvent(new CustomEvent('rmc-audit-event', {
        detail: {
          module: 'maintenance',
          action: 'OVERRIDE_APPLIED',
          entityId: id,
          entityType: 'Maintenance Task',
          details: `Deleted maintenance task: "${taskToDelete.title}" for ${taskToDelete.vehicleRegNo}`,
          severity: 'warning',
          performedBy: { id: 'MGR-01', name: 'Fleet Manager', role: 'Manager' }
        }
      }));
    }
  }, [tasks, persistTasks, toast]);

  const getUpcomingMaintenance = useCallback((days: number = 30) => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 86400000);
    
    return schedules.filter(s => {
      const dueDate = new Date(s.nextDueDate);
      return dueDate <= futureDate;
    }).sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }, [schedules]);

  const getOverdueTasks = useCallback(() => {
    return tasks.filter(t => t.status === 'overdue');
  }, [tasks]);

  const getLowStockParts = useCallback(() => {
    return parts.filter(p => p.isLowStock);
  }, [parts]);

  const updatePartStock = useCallback(async (partId: string, deltaQuantity: number) => {
    const updated = parts.map(p => {
      if (p.id !== partId) return p;
      const newQty = Math.max(0, p.quantity + deltaQuantity);
      return {
        ...p,
        quantity: newQty,
        isLowStock: newQty <= p.minStock,
        lastRestocked: deltaQuantity > 0 ? new Date().toISOString().split('T')[0] : p.lastRestocked,
        updatedAt: new Date().toISOString(),
      };
    });

    persistParts(updated);
    toast({ title: 'Stock Updated', description: 'Parts inventory balance updated' });
  }, [parts, persistParts, toast]);

  const getVehicleMaintenanceHistory = useCallback((vehicleId: string) => {
    return tasks.filter(t => t.vehicleId === vehicleId || t.vehicleRegNo === vehicleId)
      .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
  }, [tasks]);

  return {
    tasks,
    schedules,
    parts,
    selectedTask,
    setSelectedTask,
    isLoading,
    stats: getStats(),
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    getUpcomingMaintenance,
    getOverdueTasks,
    getLowStockParts,
    updatePartStock,
    getVehicleMaintenanceHistory,
    refetch: fetchTasks,
  };
}
