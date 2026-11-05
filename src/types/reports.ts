export type PersonaId = 
  | 'admin'
  | 'weighbridge_operator'
  | 'qc_inspector'
  | 'batching_operator'
  | 'gate_operator'
  | 'dispatch_officer'
  | 'fleet_manager'
  | 'accounts_manager';

export type ReportType = 
  | 'trip_summary' 
  | 'fuel_consumption' 
  | 'vehicle_performance' 
  | 'driver_performance'
  | 'maintenance_history'
  | 'inventory_status'
  | 'billing_summary'
  | 'customer_statement'
  | 'incident_log'
  | 'weighbridge_log'
  // Weighbridge Operator Personas
  | 'weighbridge_inbound_register'
  | 'sap_migo_sync_log'
  | 'weighbridge_tolerance_breach'
  | 'weighbridge_calibration_audit'
  // QC Lead Personas
  | 'qc_slump_workability'
  | 'qc_compressive_strength'
  | 'qc_temp_water_cement'
  | 'qc_rejected_batches'
  // Batching Plant Supervisor Personas
  | 'batch_production_log'
  | 'inventory_silo_consumption'
  | 'batch_cycle_efficiency'
  | 'silo_replenishment_buffer'
  // Gate Security Supervisor Personas
  | 'gate_entry_exit_register'
  | 'gate_barrier_overrides'
  | 'gate_dwell_time'
  | 'gate_unauthorized_access'
  // Dispatch & Logistics Personas
  | 'trip_delivery_dockets'
  | 'trip_transit_delay'
  | 'trip_unloading_tat'
  | 'order_fulfillment_status'
  // Fleet & Workshop Personas
  | 'fleet_fuel_efficiency'
  | 'fleet_preventive_maintenance'
  | 'fleet_statutory_compliance'
  | 'fleet_breakdown_tyre_wear'
  // Accounts & Commercial Personas
  | 'billing_tax_invoice_summary'
  | 'billing_receivables_aging'
  | 'procurement_cost_reconciliation'
  // Executive / Admin Personas
  | 'executive_plant_kpi'
  | 'consolidated_plant_summary'
  | 'audit_override_trail';

export type ReportFormat = 'pdf' | 'excel' | 'csv';
export type ReportFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface ReportConfig {
  id: string;
  name: string;
  type: ReportType;
  description: string;
  parameters: ReportParameter[];
  availableFormats: ReportFormat[];
  createdAt: string;
  personaId: PersonaId | 'all';
  personaName: string;
  category: string;
  badgeColor?: string;
  keyMetrics?: string[];
}

export interface ReportParameter {
  name: string;
  label: string;
  type: 'date' | 'daterange' | 'select' | 'multiselect' | 'text';
  required: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: string | string[];
}

export interface GeneratedReport {
  id: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  parameters: Record<string, any>;
  generatedAt: string;
  generatedBy: string;
  fileUrl?: string;
  fileSize?: number;
  status: 'generating' | 'completed' | 'failed';
  errorMessage?: string;
  content?: string;
  dataPreview?: any;
}

export interface ScheduledReport {
  id: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  frequency: ReportFrequency;
  parameters: Record<string, any>;
  recipients: string[];
  isActive: boolean;
  lastRun?: string;
  nextRun: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportStats {
  totalReports: number;
  generatedToday: number;
  scheduledReports: number;
  activeSchedules: number;
  failedReports: number;
}

export interface ReportGenerateRequest {
  type: ReportType;
  format: ReportFormat;
  parameters: Record<string, any>;
}

export interface ScheduleReportRequest {
  name: string;
  type: ReportType;
  format: ReportFormat;
  frequency: ReportFrequency;
  parameters: Record<string, any>;
  recipients: string[];
}

// Report data structures for each type
export interface TripSummaryData {
  period: string;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalDistance: number;
  avgDeliveryTime: number;
  onTimeRate: number;
  topDrivers: { name: string; trips: number; rating: number }[];
  topVehicles: { regNo: string; trips: number; distance: number }[];
}

export interface FuelConsumptionData {
  period: string;
  totalFuel: number;
  totalCost: number;
  avgCostPerLiter: number;
  avgKmPerLiter: number;
  byVehicle: { regNo: string; fuel: number; cost: number; efficiency: number }[];
  trend: { date: string; quantity: number; cost: number }[];
}

export interface VehiclePerformanceData {
  vehicleId: string;
  regNo: string;
  period: string;
  totalTrips: number;
  totalDistance: number;
  fuelConsumed: number;
  fuelEfficiency: number;
  maintenanceCost: number;
  utilization: number;
  incidents: number;
}
