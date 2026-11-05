export type MaintenanceType = 'preventive' | 'corrective' | 'emergency' | 'inspection';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'critical';

export interface MaintenanceTask {
  id: string;
  vehicleId: string;
  vehicleRegNo: string;
  type: MaintenanceType;
  title: string;
  description: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  scheduledDate: string;
  completedDate?: string;
  estimatedCost: number;
  actualCost?: number;
  technician?: string;
  parts: MaintenancePart[];
  notes?: string;
  nextDueDate?: string;
  nextDueOdometer?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenancePart {
  id: string;
  name: string;
  partNumber: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  supplier?: string;
}

export interface MaintenanceSchedule {
  id: string;
  vehicleId: string;
  vehicleRegNo: string;
  taskName: string;
  intervalKm?: number;
  intervalDays?: number;
  lastPerformed?: string;
  lastOdometer?: number;
  nextDueDate: string;
  nextDueOdometer?: number;
  isOverdue: boolean;
  daysUntilDue: number;
}

export interface PartsInventory {
  id: string;
  name: string;
  partNumber: string;
  category: string;
  quantity: number;
  minStock: number;
  unitCost: number;
  supplier: string;
  location: string;
  lastRestocked?: string;
  isLowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceStats {
  totalTasks: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  overdue: number;
  totalCost: number;
  avgCostPerTask: number;
  lowStockParts: number;
}

export interface MaintenanceFormData {
  vehicleId: string;
  type: MaintenanceType;
  title: string;
  description: string;
  priority: MaintenancePriority;
  scheduledDate: string;
  estimatedCost: number;
  technician?: string;
  notes?: string;
}
