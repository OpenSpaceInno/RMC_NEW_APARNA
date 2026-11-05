import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  ReportConfig, 
  GeneratedReport, 
  ScheduledReport, 
  ReportStats,
  ReportGenerateRequest,
  ScheduleReportRequest,
  TripSummaryData,
  FuelConsumptionData
} from '@/types/reports';

const mockReportConfigs: ReportConfig[] = [
  // ==================== 1. WEIGHBRIDGE OPERATOR PERSONA ====================
  {
    id: 'config-wb-001',
    name: 'Inbound Material Weighment Register',
    type: 'weighbridge_inbound_register',
    description: 'Gross, Tare, Net weights for inbound raw materials (OPC 53 Cement, 10mm/20mm Aggregates, M-Sand) with vehicle numbers, vendor names, and PO references',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
      { name: 'material', label: 'Material Filter', type: 'select', required: false, options: [
        { value: 'all', label: 'All Raw Materials' },
        { value: 'cement', label: 'OPC 53 / PPC Cement' },
        { value: 'aggregates', label: '10mm & 20mm Aggregates' },
        { value: 'sand', label: 'Crushed M-Sand' },
      ]},
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'weighbridge_operator',
    personaName: 'Weighbridge Scale Operator',
    category: 'Inbound Scale Operations',
    badgeColor: 'border-cyan-500/40 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10',
    keyMetrics: ['Gross / Tare MT', 'Net Delivered Weight', 'PO Inward Ref', 'Scale Dwell Time'],
  },
  {
    id: 'config-wb-002',
    name: 'SAP ERP MIGO 101 Goods Receipt Reconciliation',
    type: 'sap_migo_sync_log',
    description: 'Automated bidirectional sync audit between Weighbridge scale readings and SAP ERP MIGO Movement Type 101/501 Goods Receipts with material doc numbers',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
      { name: 'status', label: 'Sync Status', type: 'select', required: false, options: [
        { value: 'all', label: 'All Sync Records' },
        { value: 'synced', label: 'MIGO Posted (Success)' },
        { value: 'pending', label: 'Pending SAP Sync' },
      ]},
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'weighbridge_operator',
    personaName: 'Weighbridge Scale Operator',
    category: 'SAP ERP Integration',
    badgeColor: 'border-cyan-500/40 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10',
    keyMetrics: ['SAP Material Doc #', 'MIGO Movement 101', 'RFC Latency (ms)', 'Posting Status'],
  },
  {
    id: 'config-wb-003',
    name: 'Weighbridge Tolerance & Overload Exception Log',
    type: 'weighbridge_tolerance_breach',
    description: 'Audit log of weighments exceeding permissible ±0.5% tolerance limits, vehicle gross axle overloads, and manual supervisor weight overrides',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'weighbridge_operator',
    personaName: 'Weighbridge Scale Operator',
    category: 'Exceptions & Overloads',
    badgeColor: 'border-cyan-500/40 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10',
    keyMetrics: ['Tolerance Variance %', 'Overload (Tons)', 'Supervisor Override', 'Challan Mismatch'],
  },
  {
    id: 'config-wb-004',
    name: 'Scale Load Cell Zero-Balance Calibration Audit',
    type: 'weighbridge_calibration_audit',
    description: 'Daily test weight (20 MT standard) calibration logs, zero-drift telemetry, corner load tests, and Legal Metrology certification tracking',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'weighbridge_operator',
    personaName: 'Weighbridge Scale Operator',
    category: 'Calibration & Standards',
    badgeColor: 'border-cyan-500/40 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10',
    keyMetrics: ['Zero Drift (kg)', 'Corner Load Shift', '20 MT Test Error', 'Calibration Certificate'],
  },

  // ==================== 2. QUALITY CONTROL (QC) PERSONA ====================
  {
    id: 'config-qc-001',
    name: 'Concrete Slump & Workability Register (IS 1199)',
    type: 'qc_slump_workability',
    description: 'Plant discharge and gate-exit slump cone tests with flow table values, initial workability retention, and IS 456 / IS 1199 compliance ratings',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
      { name: 'grade', label: 'Concrete Grade', type: 'select', required: false, options: [
        { value: 'all', label: 'All Grades' },
        { value: 'M25', label: 'M25 Commercial' },
        { value: 'M30', label: 'M30 Standard' },
        { value: 'M35', label: 'M35 High Performance' },
        { value: 'M40', label: 'M40 Structural' },
      ]},
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'qc_inspector',
    personaName: 'Quality Control Lead',
    category: 'Fresh Concrete Tests',
    badgeColor: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    keyMetrics: ['Target Slump (mm)', 'Measured Slump (mm)', 'Flow (mm)', 'IS 1199 Status'],
  },
  {
    id: 'config-qc-002',
    name: '7-Day & 28-Day Compressive Strength Cube Register',
    type: 'qc_compressive_strength',
    description: 'Concrete cube crushing tests (150mm cubes) tested in UTM machine at 7 and 28 days against characteristic target strength fck + 1.65s (IS 516)',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'qc_inspector',
    personaName: 'Quality Control Lead',
    category: 'Hardened Concrete Strength',
    badgeColor: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    keyMetrics: ['7-Day Strength (MPa)', '28-Day Strength (MPa)', 'Failure Load (kN)', 'Acceptance Criteria'],
  },
  {
    id: 'config-qc-003',
    name: 'Concrete Temperature, W/C Ratio & Admixture Dosing Log',
    type: 'qc_temp_water_cement',
    description: 'Fresh concrete core temperature logging (<32°C hot weather guideline), water-cement ratio verification, and PCE superplasticizer dosing audit',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'qc_inspector',
    personaName: 'Quality Control Lead',
    category: 'Thermal & Chemical Audit',
    badgeColor: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    keyMetrics: ['Concrete Temp (°C)', 'Ambient Temp (°C)', 'W/C Ratio', 'Admixture % dosage'],
  },
  {
    id: 'config-qc-004',
    name: 'Non-Conformance & Batch Rejection Log',
    type: 'qc_rejected_batches',
    description: 'Register of rejected transit mixer loads, segregation issues, excessive slump loss at plant gate, and root cause corrective actions (CAPA)',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'qc_inspector',
    personaName: 'Quality Control Lead',
    category: 'Non-Conformance & CAPA',
    badgeColor: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    keyMetrics: ['Rejected Volume (m³)', 'Defect Code', 'Action Taken', 'QC Signoff'],
  },

  // ==================== 3. BATCHING PLANT SUPERVISOR PERSONA ====================
  {
    id: 'config-bp-001',
    name: 'Batch Production & Recipe Cycle Time Log',
    type: 'batch_production_log',
    description: 'Micro-level twin-shaft mixer batch cycles, actual vs theoretical target weights for cement, sand, aggregates, water, and batching cycle time',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'batching_operator',
    personaName: 'Batching Plant Supervisor',
    category: 'Production Telemetry',
    badgeColor: 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10',
    keyMetrics: ['Batched Volume (m³)', 'Recipe Mix Code', 'Cycle Time (sec)', 'Dosing Accuracy %'],
  },
  {
    id: 'config-bp-002',
    name: 'Silo Stocks & Raw Material Consumption Reconciliation',
    type: 'inventory_silo_consumption',
    description: 'Daily reconciliation of Silo 1 (OPC 53), Silo 2 (Fly Ash), aggregate bays, and chemical admixtures with opening balance, consumption, and closing stock',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'batching_operator',
    personaName: 'Batching Plant Supervisor',
    category: 'Silo & Raw Stock',
    badgeColor: 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10',
    keyMetrics: ['OPC 53 Stock (Tons)', 'Fly Ash (Tons)', 'Aggregates (Tons)', 'Yield Variance %'],
  },
  {
    id: 'config-bp-003',
    name: 'Plant Mixer Cycle Time & Efficiency Analysis',
    type: 'batch_cycle_efficiency',
    description: 'Mixer discharge rate, batch delay analysis, hopper gate opening times, plant idle hours, and hourly output capacity versus rated 60 m³/hr rating',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'batching_operator',
    personaName: 'Batching Plant Supervisor',
    category: 'Mixer Efficiency',
    badgeColor: 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10',
    keyMetrics: ['Output Rate (m³/hr)', 'Idle Duration (min)', 'Discharge Speed', 'Mixer Utilization %'],
  },

  // ==================== 4. GATE SECURITY SUPERVISOR PERSONA ====================
  {
    id: 'config-gt-001',
    name: 'Gate Security In-Out Register & ANPR Log',
    type: 'gate_entry_exit_register',
    description: 'Complete security log with ANPR camera license plate reads, RFID tag validations, driver credentials, entry timestamp, and gate-out clearances',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'gate_operator',
    personaName: 'Gate Security Supervisor',
    category: 'Gate Security & ANPR',
    badgeColor: 'border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10',
    keyMetrics: ['ANPR Vehicle Plate', 'Entry / Exit Time', 'RFID Tag ID', 'Driver License #'],
  },
  {
    id: 'config-gt-002',
    name: 'Boom Barrier Manual Overrides & Exception Audit',
    type: 'gate_barrier_overrides',
    description: 'Security audit of manual barrier gate lifts, unapproved pass-throughs, ANPR unreadable events, and security officer incident notes',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'gate_operator',
    personaName: 'Gate Security Supervisor',
    category: 'Access Exceptions',
    badgeColor: 'border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10',
    keyMetrics: ['Override Reason', 'Security Officer ID', 'Snapshot Capture', 'Incident Status'],
  },
  {
    id: 'config-gt-003',
    name: 'Yard Dwell Time & Plant Turnaround (TAT) Report',
    type: 'gate_dwell_time',
    description: 'Analysis of transit mixers and raw material tip trailers total time spent inside the plant (Gate-in to Weighbridge to Batching to Gate-out)',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'gate_operator',
    personaName: 'Gate Security Supervisor',
    category: 'Yard Turnaround (TAT)',
    badgeColor: 'border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10',
    keyMetrics: ['Avg Dwell Time (min)', 'Yard Congestion Index', 'Weighbridge Wait', 'Turnaround Flag'],
  },

  // ==================== 5. DISPATCH & LOGISTICS PERSONA ====================
  {
    id: 'config-dp-001',
    name: 'Electronic Delivery Docket & Challan Register',
    type: 'trip_delivery_dockets',
    description: 'Master record of all electronic concrete delivery tickets (e-Challans) with customer name, site destination, mix grade, slump, volume, and driver',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'dispatch_officer',
    personaName: 'Dispatch & Logistics Officer',
    category: 'Delivery Dockets & Challans',
    badgeColor: 'border-indigo-500/40 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
    keyMetrics: ['Challan #', 'Customer & Site', 'Concrete Volume (m³)', 'Delivery Status'],
  },
  {
    id: 'config-dp-002',
    name: 'Concrete Transit Time & Setting Window Expiry Log',
    type: 'trip_transit_delay',
    description: 'Transit telemetry monitoring time elapsed from batch water addition to site discharge against the standard 90-minute maximum limit (IS 4926)',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'dispatch_officer',
    personaName: 'Dispatch & Logistics Officer',
    category: 'Transit & Setting Time',
    badgeColor: 'border-indigo-500/40 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
    keyMetrics: ['Water Add Time', 'Elapsed Transit (min)', '90-Min Expiry Alert', 'Traffic Delay (min)'],
  },
  {
    id: 'config-dp-003',
    name: 'Site Unloading Turnaround Time (TAT) Analysis',
    type: 'trip_unloading_tat',
    description: 'Site arrival timestamp, pump waiting time, concrete pouring duration, and drum washing time to identify customer site unloading delays',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'dispatch_officer',
    personaName: 'Dispatch & Logistics Officer',
    category: 'Site Pouring Operations',
    badgeColor: 'border-indigo-500/40 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
    keyMetrics: ['Site Arrival Time', 'Pouring Duration (min)', 'Site Delay Reason', 'Demurrage Billable'],
  },

  // ==================== 6. FLEET & WORKSHOP PERSONA ====================
  {
    id: 'config-fl-001',
    name: 'Transit Mixer Fuel Economy & Diesel Log',
    type: 'fleet_fuel_efficiency',
    description: 'Diesel fuel issued vs distance travelled (GPS odometer) with mileage (km/L), PTO drum rotation fuel burn, and idle fuel waste per transit mixer',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
      { name: 'vehicleId', label: 'Transit Mixer', type: 'select', required: false },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'fleet_manager',
    personaName: 'Fleet & Workshop Manager',
    category: 'Diesel & Fuel Economy',
    badgeColor: 'border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10',
    keyMetrics: ['Distance (km)', 'Diesel Consumed (L)', 'Mileage (km/L)', 'Fuel Cost (INR)'],
  },
  {
    id: 'config-fl-002',
    name: 'Mixer Drum & Chassis Preventive Maintenance Schedule',
    type: 'fleet_preventive_maintenance',
    description: 'Scheduled lube services, drum blade wear depth inspection, hydraulic pump fluid replacement, water booster pump checks, and next due service dates',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'fleet_manager',
    personaName: 'Fleet & Workshop Manager',
    category: 'Preventive Maintenance',
    badgeColor: 'border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10',
    keyMetrics: ['Engine Hours', 'Drum Blade Wear %', 'Last Service Date', 'Next PM Due (km)'],
  },
  {
    id: 'config-fl-003',
    name: 'Vehicle Statutory Compliance & Fitness Certificate Tracker',
    type: 'fleet_statutory_compliance',
    description: 'RTO vehicle fitness certificate (FC), state road tax, National Permit, pollution (PUC), and commercial third-party insurance renewal tracking',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'fleet_manager',
    personaName: 'Fleet & Workshop Manager',
    category: 'Statutory & RTO Compliance',
    badgeColor: 'border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10',
    keyMetrics: ['FC Expiry Date', 'PUC Status', 'Insurance Valid Till', 'Days Remaining'],
  },

  // ==================== 7. COMMERCIAL & ACCOUNTS PERSONA ====================
  {
    id: 'config-ac-001',
    name: 'GST Tax Invoice & E-Way Bill Reconciliation',
    type: 'billing_tax_invoice_summary',
    description: 'Commercial GST tax invoices (HSN 38245010 Non-refractory concrete), CGST (9%) + SGST (9%), customer GSTINs, and electronic E-Way Bill matches',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'accounts_manager',
    personaName: 'Commercial & Accounts Lead',
    category: 'GST & Invoicing',
    badgeColor: 'border-violet-500/40 text-violet-600 dark:text-violet-400 bg-violet-500/10',
    keyMetrics: ['Invoice #', 'Taxable Value', 'GST Amount (18%)', 'E-Way Bill #'],
  },
  {
    id: 'config-ac-002',
    name: 'Customer Accounts Receivables & Payment Aging',
    type: 'billing_receivables_aging',
    description: 'Customer outstanding ledger with aging buckets (Current, 1-30 days, 31-60 days, 61-90 days, >90 days overdue) and credit limits',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'accounts_manager',
    personaName: 'Commercial & Accounts Lead',
    category: 'Receivables & Aging',
    badgeColor: 'border-violet-500/40 text-violet-600 dark:text-violet-400 bg-violet-500/10',
    keyMetrics: ['Total Due (INR)', 'Overdue >30d', 'Credit Limit', 'Payment Status'],
  },
  {
    id: 'config-ac-003',
    name: 'Raw Material Procurement Cost vs Inward PO Register',
    type: 'procurement_cost_reconciliation',
    description: 'Cement and aggregate purchase order rates versus actual weighbridge inward delivery slips and vendor invoice reconciliation',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'accounts_manager',
    personaName: 'Commercial & Accounts Lead',
    category: 'Procurement Reconciliation',
    badgeColor: 'border-violet-500/40 text-violet-600 dark:text-violet-400 bg-violet-500/10',
    keyMetrics: ['PO Rate / MT', 'Invoice Value', 'Net Received MT', 'Price Variance'],
  },

  // ==================== 8. PLANT MANAGER / EXECUTIVE ADMIN PERSONA ====================
  {
    id: 'config-ex-001',
    name: 'Plant Executive Operations & KPI Dashboard Summary',
    type: 'executive_plant_kpi',
    description: 'High-level executive plant performance scorecard: Total m³ batched, average trip TAT, fleet fuel economy, on-time delivery %, and plant uptime',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'admin',
    personaName: 'Plant Manager / Admin',
    category: 'Executive Overview',
    badgeColor: 'border-yellow-500/40 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10',
    keyMetrics: ['Total Volume (m³)', 'Plant Utilization %', 'On-Time Delivery %', 'Operating Margin'],
  },
  {
    id: 'config-ex-002',
    name: 'Consolidated Cross-Functional Plant Operations Report',
    type: 'consolidated_plant_summary',
    description: 'Integrated monthly review consolidating batching production, cement silo yield, fleet kilometers, quality pass rate, and commercial turnover',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'admin',
    personaName: 'Plant Manager / Admin',
    category: 'Cross-Functional Review',
    badgeColor: 'border-yellow-500/40 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10',
    keyMetrics: ['Revenue (INR)', 'Raw Material Cost', 'Fleet Uptime', 'Compliance Score'],
  },
  {
    id: 'config-ex-003',
    name: 'Security & Weighbridge Manual Override Audit Trail',
    type: 'audit_override_trail',
    description: 'Complete forensic audit log of all manual bypasses: scale weight overrides, barrier lifts, QC tolerance waivers, and SAP sync replays',
    parameters: [
      { name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
    ],
    availableFormats: ['csv', 'excel', 'pdf'],
    createdAt: '2025-01-01T00:00:00Z',
    personaId: 'admin',
    personaName: 'Plant Manager / Admin',
    category: 'Forensic Audit & Governance',
    badgeColor: 'border-yellow-500/40 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10',
    keyMetrics: ['Total Overrides', 'User ID', 'Module Affected', 'Risk Assessment'],
  },
];

const INITIAL_GENERATED_REPORTS: GeneratedReport[] = [
  {
    id: 'rep-wb-001',
    name: 'Inbound Material Weighment Register - Today',
    type: 'weighbridge_inbound_register',
    format: 'csv',
    parameters: { material: 'all', dateRange: 'Today' },
    generatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    generatedBy: 'Weighbridge Operator (R. Kadam)',
    status: 'completed',
    fileSize: 142336,
    content: `Token_No,PO_Number,Vendor_Name,Material,Vehicle_Reg,Gross_MT,Tare_MT,Net_MT,SAP_MIGO_Doc,Status
TK-2025-081,PO-880021,UltraTech Cement Ltd,OPC 53 Cement,MH-12-RN-4501,42.85,14.20,28.65,500049182,Accepted
TK-2025-082,PO-880022,Ganesh Stone Crusher,20mm Aggregates,MH-12-RN-4502,38.40,13.15,25.25,500049183,Accepted
TK-2025-083,PO-880023,Ganesh Stone Crusher,10mm Aggregates,MH-12-RN-4503,36.90,12.80,24.10,500049184,Accepted
TK-2025-084,PO-880024,Vighnaharta Sand Quarry,Crushed M-Sand,MH-14-EM-8821,39.20,13.05,26.15,500049185,Accepted
TK-2025-085,PO-880025,Sika India Pvt Ltd,Sika ViscoCrete PCE,MH-12-TK-9901,18.40,9.20,9.20,500049186,Accepted`,
    dataPreview: {
      summary: {
        totalNetMT: '113.35 MT',
        weighedVehicles: 5,
        sapMigoSuccess: '100% (5/5)',
        avgScaleDwell: '3.8 min'
      },
      headers: ['Token No', 'PO Number', 'Vendor Name', 'Material', 'Vehicle Reg', 'Gross MT', 'Tare MT', 'Net MT', 'SAP MIGO Doc', 'Status'],
      rows: [
        ['TK-2025-081', 'PO-880021', 'UltraTech Cement Ltd', 'OPC 53 Cement', 'MH-12-RN-4501', '42.85', '14.20', '28.65', '500049182', 'Accepted'],
        ['TK-2025-082', 'PO-880022', 'Ganesh Stone Crusher', '20mm Aggregates', 'MH-12-RN-4502', '38.40', '13.15', '25.25', '500049183', 'Accepted'],
        ['TK-2025-083', 'PO-880023', 'Ganesh Stone Crusher', '10mm Aggregates', 'MH-12-RN-4503', '36.90', '12.80', '24.10', '500049184', 'Accepted'],
        ['TK-2025-084', 'PO-880024', 'Vighnaharta Sand Quarry', 'Crushed M-Sand', 'MH-14-EM-8821', '39.20', '13.05', '26.15', '500049185', 'Accepted'],
        ['TK-2025-085', 'PO-880025', 'Sika India Pvt Ltd', 'Sika ViscoCrete PCE', 'MH-12-TK-9901', '18.40', '9.20', '9.20', '500049186', 'Accepted']
      ]
    }
  },
  {
    id: 'rep-qc-001',
    name: 'Concrete Slump & Workability Verification Register (IS 1199)',
    type: 'qc_slump_workability',
    format: 'excel',
    parameters: { grade: 'all', dateRange: 'Current Week' },
    generatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    generatedBy: 'QC Lead (S. Kulkarni)',
    status: 'completed',
    fileSize: 184320,
    content: `Sample_ID,Challan_No,Concrete_Grade,Target_Slump_mm,Measured_Slump_mm,Flow_mm,Temp_C,W_C_Ratio,IS_1199_Result,QC_Inspector
SLP-801,CH-2025-881,M30,130,135,520,28.4,0.44,Passed,S. Kulkarni
SLP-802,CH-2025-882,M35,125,120,500,29.1,0.42,Passed,S. Kulkarni
SLP-803,CH-2025-883,M25,140,140,540,28.8,0.48,Passed,P. Thorat
SLP-804,CH-2025-884,M40,120,125,510,27.9,0.38,Passed,S. Kulkarni
SLP-805,CH-2025-885,M35,135,130,515,28.2,0.41,Passed,P. Thorat`,
    dataPreview: {
      summary: {
        totalSamples: 42,
        slumpPassRate: '97.6%',
        avgSlump: '130 mm',
        avgConcreteTemp: '28.5 °C'
      },
      headers: ['Sample ID', 'Challan No', 'Concrete Grade', 'Target (mm)', 'Measured (mm)', 'Flow (mm)', 'Temp (°C)', 'W/C Ratio', 'IS 1199 Status', 'QC Inspector'],
      rows: [
        ['SLP-801', 'CH-2025-881', 'M30', '130', '135', '520', '28.4', '0.44', 'Passed', 'S. Kulkarni'],
        ['SLP-802', 'CH-2025-882', 'M35', '125', '120', '500', '29.1', '0.42', 'Passed', 'S. Kulkarni'],
        ['SLP-803', 'CH-2025-883', 'M25', '140', '140', '540', '28.8', '0.48', 'Passed', 'P. Thorat'],
        ['SLP-804', 'CH-2025-884', 'M40', '120', '125', '510', '27.9', '0.38', 'Passed', 'S. Kulkarni'],
        ['SLP-805', 'CH-2025-885', 'M35', '135', '130', '515', '28.2', '0.41', 'Passed', 'P. Thorat']
      ]
    }
  },
  {
    id: 'rep-bp-001',
    name: 'Batch Production & Recipe Cycle Time Log',
    type: 'batch_production_log',
    format: 'csv',
    parameters: { dateRange: 'Today' },
    generatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    generatedBy: 'Batching Supervisor (M. Jagtap)',
    status: 'completed',
    fileSize: 156672,
    content: `Batch_ID,Recipe_Mix,Volume_m3,Cement_kg,Agg_10mm_kg,Agg_20mm_kg,Sand_kg,Water_kg,Admixture_L,Cycle_Sec,Batcher_Status
BAT-9901,REC-M30-P1,7.0,2450,4200,5600,5250,1050,24.5,58,Target Reached
BAT-9902,REC-M35-P2,6.5,2470,3900,5200,4875,975,26.0,55,Target Reached
BAT-9903,REC-M25-P1,8.0,2560,4800,6400,6000,1280,24.0,62,Target Reached
BAT-9904,REC-M40-P3,6.0,2520,3600,4800,4500,900,28.8,54,Target Reached
BAT-9905,REC-M35-P2,7.5,2850,4500,6000,5625,1125,30.0,59,Target Reached`,
    dataPreview: {
      summary: {
        totalBatchedM3: '35.0 m³',
        batchesCompleted: 5,
        avgCycleTime: '57.6 sec',
        dosingVariance: '±0.3%'
      },
      headers: ['Batch ID', 'Recipe Mix', 'Volume (m³)', 'Cement (kg)', '10mm (kg)', '20mm (kg)', 'Sand (kg)', 'Water (kg)', 'Admixture (L)', 'Cycle (sec)', 'Status'],
      rows: [
        ['BAT-9901', 'REC-M30-P1', '7.0', '2450', '4200', '5600', '5250', '1050', '24.5', '58', 'Target Reached'],
        ['BAT-9902', 'REC-M35-P2', '6.5', '2470', '3900', '5200', '4875', '975', '26.0', '55', 'Target Reached'],
        ['BAT-9903', 'REC-M25-P1', '8.0', '2560', '4800', '6400', '6000', '1280', '24.0', '62', 'Target Reached'],
        ['BAT-9904', 'REC-M40-P3', '6.0', '2520', '3600', '4800', '4500', '900', '28.8', '54', 'Target Reached'],
        ['BAT-9905', 'REC-M35-P2', '7.5', '2850', '4500', '6000', '5625', '1125', '30.0', '59', 'Target Reached']
      ]
    }
  },
  {
    id: 'rep-gt-001',
    name: 'Gate Security In-Out Register & ANPR Log',
    type: 'gate_entry_exit_register',
    format: 'csv',
    parameters: { dateRange: 'Today' },
    generatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    generatedBy: 'Security Supervisor (H. Jadhav)',
    status: 'completed',
    fileSize: 112640,
    content: `Pass_ID,Plate_Number,Vehicle_Type,Driver_Name,Driver_License,Gate_In_Time,Gate_Out_Time,Duration_Mins,RFID_Tag,Security_Officer
GP-1011,MH-12-RN-4501,Transit Mixer (8m³),Suresh Patil,DL-MH12-2015-889,08:15:22,08:52:10,36.8,TAG-88201,H. Jadhav
GP-1012,MH-12-RN-4502,Transit Mixer (8m³),Rajesh Kumar,DL-MH12-2018-441,08:32:04,09:05:44,33.7,TAG-88202,H. Jadhav
GP-1013,MH-12-RN-4503,Transit Mixer (9m³),Dinesh More,DL-MH14-2016-992,09:01:10,09:42:15,41.1,TAG-88203,H. Jadhav
GP-1014,MH-14-EM-8821,Tip Trailer (Cement),Anil Ghorpade,DL-MH12-2019-103,09:15:30,10:04:12,48.7,TAG-88204,H. Jadhav
GP-1015,MH-12-TK-9901,Transit Mixer (8m³),Santosh Shinde,DL-MH12-2017-662,10:02:18,10:35:50,33.5,TAG-88205,H. Jadhav`,
    dataPreview: {
      summary: {
        totalGateEntries: 84,
        vehiclesInside: 12,
        avgTurnaround: '38.7 min',
        anprMatchAccuracy: '99.2%'
      },
      headers: ['Pass ID', 'Plate Number', 'Vehicle Type', 'Driver Name', 'License #', 'Gate In', 'Gate Out', 'Duration (min)', 'RFID Tag', 'Officer'],
      rows: [
        ['GP-1011', 'MH-12-RN-4501', 'Transit Mixer (8m³)', 'Suresh Patil', 'DL-MH12-2015-889', '08:15:22', '08:52:10', '36.8', 'TAG-88201', 'H. Jadhav'],
        ['GP-1012', 'MH-12-RN-4502', 'Transit Mixer (8m³)', 'Rajesh Kumar', 'DL-MH12-2018-441', '08:32:04', '09:05:44', '33.7', 'TAG-88202', 'H. Jadhav'],
        ['GP-1013', 'MH-12-RN-4503', 'Transit Mixer (9m³)', 'Dinesh More', 'DL-MH14-2016-992', '09:01:10', '09:42:15', '41.1', 'TAG-88203', 'H. Jadhav'],
        ['GP-1014', 'MH-14-EM-8821', 'Tip Trailer (Cement)', 'Anil Ghorpade', 'DL-MH12-2019-103', '09:15:30', '10:04:12', '48.7', 'TAG-88204', 'H. Jadhav'],
        ['GP-1015', 'MH-12-TK-9901', 'Transit Mixer (8m³)', 'Santosh Shinde', 'DL-MH12-2017-662', '10:02:18', '10:35:50', '33.5', 'TAG-88205', 'H. Jadhav']
      ]
    }
  },
  {
    id: 'rep-dp-001',
    name: 'Electronic Delivery Docket & Challan Register',
    type: 'trip_delivery_dockets',
    format: 'pdf',
    parameters: { dateRange: 'Today' },
    generatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    generatedBy: 'Dispatch Officer (P. Shinde)',
    status: 'completed',
    fileSize: 245760,
    content: `Challan_No,Customer_Name,Site_Location,Grade,Volume_m3,Slump_mm,Mixer_Reg,Driver_Name,Dispatch_Time,Site_Arrival,Delivery_Status
CH-2025-881,BuildCorp Infra,Pune Ring Road Pkg 4,M30,7.0,130,MH-12-RN-4501,Suresh Patil,08:30,09:15,Delivered
CH-2025-882,Larsen & Toubro,Hinjewadi Tech Park Ph 3,M35,6.5,125,MH-12-RN-4502,Rajesh Kumar,09:10,09:55,Delivered
CH-2025-883,Shapoorji Pallonji,Kharadi IT Park Tower B,M25,8.0,140,MH-12-RN-4503,Dinesh More,10:00,10:50,Delivered
CH-2025-884,Godrej Properties,Wakad High-Rise Sec 2,M40,6.0,120,MH-14-EM-8821,Anil Ghorpade,11:15,12:00,Delivered
CH-2025-885,Tata Projects,Metro Line 3 Viaduct P-12,M35,7.5,135,MH-12-TK-9901,Santosh Shinde,13:00,13:45,Delivered`,
    dataPreview: {
      summary: {
        totalChallans: 35.0,
        volumeDeliveredM3: '35 m³',
        onTimeRate: '95.2%',
        avgTransitDuration: '46 min'
      },
      headers: ['Challan No', 'Customer Name', 'Site Location', 'Grade', 'Volume (m³)', 'Slump (mm)', 'Mixer Reg', 'Driver', 'Dispatch', 'Arrival', 'Status'],
      rows: [
        ['CH-2025-881', 'BuildCorp Infra', 'Pune Ring Road Pkg 4', 'M30', '7.0', '130', 'MH-12-RN-4501', 'Suresh Patil', '08:30', '09:15', 'Delivered'],
        ['CH-2025-882', 'Larsen & Toubro', 'Hinjewadi Tech Park Ph 3', 'M35', '6.5', '125', 'MH-12-RN-4502', 'Rajesh Kumar', '09:10', '09:55', 'Delivered'],
        ['CH-2025-883', 'Shapoorji Pallonji', 'Kharadi IT Park Tower B', 'M25', '8.0', '140', 'MH-12-RN-4503', 'Dinesh More', '10:00', '10:50', 'Delivered'],
        ['CH-2025-884', 'Godrej Properties', 'Wakad High-Rise Sec 2', 'M40', '6.0', '120', 'MH-14-EM-8821', 'Anil Ghorpade', '11:15', '12:00', 'Delivered'],
        ['CH-2025-885', 'Tata Projects', 'Metro Line 3 Viaduct P-12', 'M35', '7.5', '135', 'MH-12-TK-9901', 'Santosh Shinde', '13:00', '13:45', 'Delivered']
      ]
    }
  },
  {
    id: 'rep-fl-001',
    name: 'Transit Mixer Fuel Economy & Diesel Log',
    type: 'fleet_fuel_efficiency',
    format: 'excel',
    parameters: { dateRange: 'This Month' },
    generatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    generatedBy: 'Fleet Manager (A. Deshmukh)',
    status: 'completed',
    fileSize: 122880,
    content: `Vehicle_Reg,Model,Distance_km,Fuel_Liters,Mileage_km_per_L,Cost_INR,PTO_Hours,Idle_Hours,Efficiency_Rating
MH-12-RN-4501,Ashok Leyland 2820 (8m³),3850,916.6,4.20,87077,48.5,12.2,Optimal
MH-12-RN-4502,Tata Signa 2823 (8m³),4120,1056.4,3.90,100358,52.0,15.8,Moderate
MH-12-RN-4503,BharatBenz 2828C (9m³),3690,838.6,4.40,79667,46.2,10.4,Optimal
MH-14-EM-8821,Eicher Pro 6028 (7m³),3450,784.0,4.40,74480,44.0,9.6,Optimal
MH-12-TK-9901,Ashok Leyland 2820 (8m³),2980,726.8,4.10,69046,38.4,11.2,Optimal`,
    dataPreview: {
      summary: {
        totalFleetDistance: '18,090 km',
        totalDieselLiters: '4,322.4 L',
        avgFleetMileage: '4.2 km/L',
        totalFuelCost: '₹4,10,628'
      },
      headers: ['Vehicle Reg', 'Model', 'Distance (km)', 'Fuel (L)', 'Mileage (km/L)', 'Cost (INR)', 'PTO (hrs)', 'Idle (hrs)', 'Efficiency'],
      rows: [
        ['MH-12-RN-4501', 'Ashok Leyland 2820', '3850', '916.6', '4.20', '₹87,077', '48.5', '12.2', 'Optimal'],
        ['MH-12-RN-4502', 'Tata Signa 2823', '4120', '1056.4', '3.90', '₹1,00,358', '52.0', '15.8', 'Moderate'],
        ['MH-12-RN-4503', 'BharatBenz 2828C', '3690', '838.6', '4.40', '₹79,667', '46.2', '10.4', 'Optimal'],
        ['MH-14-EM-8821', 'Eicher Pro 6028', '3450', '784.0', '4.40', '₹74,480', '44.0', '9.6', 'Optimal'],
        ['MH-12-TK-9901', 'Ashok Leyland 2820', '2980', '726.8', '4.10', '₹69,046', '38.4', '11.2', 'Optimal']
      ]
    }
  },
  {
    id: 'rep-ac-001',
    name: 'GST Tax Invoice & E-Way Bill Reconciliation',
    type: 'billing_tax_invoice_summary',
    format: 'pdf',
    parameters: { dateRange: 'Current Month' },
    generatedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    generatedBy: 'Accounts Lead (S. Patil)',
    status: 'completed',
    fileSize: 294912,
    content: `Invoice_No,Date,Customer_Name,GSTIN,Taxable_Value,CGST_9pct,SGST_9pct,Total_Invoice_INR,E_Way_Bill_No,Status
INV-2025-001,2025-01-10,BuildCorp Infrastructure Ltd,27AABCB1234F1Z5,315000.00,28350.00,28350.00,371700.00,281902847192,Paid
INV-2025-002,2025-01-12,Larsen & Toubro ECC,27AAACL0123M1Z2,455000.00,40950.00,40950.00,536900.00,281902847193,Paid
INV-2025-003,2025-01-14,Shapoorji Pallonji Co.,27AAACS4567H1Z8,280000.00,25200.00,25200.00,330400.00,281902847194,Pending
INV-2025-004,2025-01-15,Godrej Properties Ltd,27AAACG7890K1Z4,192000.00,17280.00,17280.00,226560.00,281902847195,Sent
INV-2025-005,2025-01-18,Tata Projects Ltd,27AAACT3344P1Z1,265000.00,23850.00,23850.00,312700.00,281902847196,Overdue`,
    dataPreview: {
      summary: {
        totalInvoicedINR: '₹17,78,260',
        totalGSTCollected: '₹2,71,260',
        collectedAmount: '₹9,08,600',
        eWayBillsMatched: '100% (5/5)'
      },
      headers: ['Invoice No', 'Date', 'Customer Name', 'GSTIN', 'Taxable (INR)', 'CGST (9%)', 'SGST (9%)', 'Total (INR)', 'E-Way Bill #', 'Status'],
      rows: [
        ['INV-2025-001', '2025-01-10', 'BuildCorp Infrastructure Ltd', '27AABCB1234F1Z5', '₹3,15,000', '₹28,350', '₹28,350', '₹3,71,700', '281902847192', 'Paid'],
        ['INV-2025-002', '2025-01-12', 'Larsen & Toubro ECC', '27AAACL0123M1Z2', '₹4,55,000', '₹40,950', '₹40,950', '₹5,36,900', '281902847193', 'Paid'],
        ['INV-2025-003', '2025-01-14', 'Shapoorji Pallonji Co.', '27AAACS4567H1Z8', '₹2,80,000', '₹25,200', '₹25,200', '₹3,30,400', '281902847194', 'Pending'],
        ['INV-2025-004', '2025-01-15', 'Godrej Properties Ltd', '27AAACG7890K1Z4', '₹1,92,000', '₹17,280', '₹17,280', '₹2,26,560', '281902847195', 'Sent'],
        ['INV-2025-005', '2025-01-18', 'Tata Projects Ltd', '27AAACT3344P1Z1', '₹2,65,000', '₹23,850', '₹23,850', '₹3,12,700', '281902847196', 'Overdue']
      ]
    }
  },
  {
    id: 'rep-ex-001',
    name: 'Plant Executive Operations & KPI Dashboard Summary',
    type: 'executive_plant_kpi',
    format: 'pdf',
    parameters: { dateRange: 'Month to Date' },
    generatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    generatedBy: 'Plant Head (V. Sawant)',
    status: 'completed',
    fileSize: 348160,
    content: `Metric_Domain,Key_Indicator,Month_Actual,Monthly_Target,Variance,Status
Production,Concrete Volume Batched,842 m³,800 m³,+5.25%,Ahead of Target
Logistics,On-Time Delivery Rate,94.8%,92.0%,+2.80%,Compliant
Quality,28-Day Strength Compliance,98.6%,95.0%,+3.60%,Compliant
Fleet,Average Mixer Mileage,4.2 km/L,4.0 km/L,+0.20 km/L,Optimal
Commercial,Net Billing Realization,₹42.8 Lakhs,₹40.0 Lakhs,+₹2.8L,Exceeded
Safety,Gate Security Incident Count,0,0,0,Zero Incidents`,
    dataPreview: {
      summary: {
        totalBatchedM3: '842 m³',
        plantCapacityUptime: '94.2%',
        onTimeDeliveryRate: '94.8%',
        operatingMargin: '21.4%'
      },
      headers: ['Domain', 'Key Indicator', 'Month Actual', 'Monthly Target', 'Variance', 'Status'],
      rows: [
        ['Production', 'Concrete Volume Batched', '842 m³', '800 m³', '+5.25%', 'Ahead of Target'],
        ['Logistics', 'On-Time Delivery Rate', '94.8%', '92.0%', '+2.80%', 'Compliant'],
        ['Quality', '28-Day Strength Compliance', '98.6%', '95.0%', '+3.60%', 'Compliant'],
        ['Fleet', 'Average Mixer Mileage', '4.2 km/L', '4.0 km/L', '+0.20 km/L', 'Optimal'],
        ['Commercial', 'Net Billing Realization', '₹42.8 Lakhs', '₹40.0 Lakhs', '+₹2.8L', 'Exceeded'],
        ['Safety', 'Gate Security Incident Count', '0', '0', '0', 'Zero Incidents']
      ]
    }
  }
];

const INITIAL_SCHEDULED_REPORTS: ScheduledReport[] = [
  {
    id: 'sched-wb-001',
    name: 'Daily Inbound Material & SAP MIGO 101 Reconciliation',
    type: 'sap_migo_sync_log',
    format: 'excel',
    frequency: 'daily',
    parameters: { status: 'all' },
    recipients: ['weighbridge.lead@aparna-rmc.com', 'sap.erp@aparna-rmc.com'],
    isActive: true,
    lastRun: new Date(Date.now() - 3600000 * 14).toISOString(),
    nextRun: new Date(Date.now() + 3600000 * 10).toISOString(),
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'sched-qc-001',
    name: 'Daily Concrete Slump & Compressive Strength Audit',
    type: 'qc_slump_workability',
    format: 'pdf',
    frequency: 'daily',
    parameters: { grade: 'all' },
    recipients: ['qc.incharge@aparna-rmc.com', 'plant.manager@aparna-rmc.com'],
    isActive: true,
    lastRun: new Date(Date.now() - 3600000 * 12).toISOString(),
    nextRun: new Date(Date.now() + 3600000 * 12).toISOString(),
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'sched-bp-001',
    name: 'Weekly Silo Stock & Material Consumption Audit',
    type: 'inventory_silo_consumption',
    format: 'excel',
    frequency: 'weekly',
    parameters: {},
    recipients: ['batching.lead@aparna-rmc.com', 'procurement@aparna-rmc.com'],
    isActive: true,
    lastRun: new Date(Date.now() - 3600000 * 96).toISOString(),
    nextRun: new Date(Date.now() + 3600000 * 72).toISOString(),
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'sched-fl-001',
    name: 'Weekly Transit Mixer Fuel & Mileage Audit',
    type: 'fleet_fuel_efficiency',
    format: 'excel',
    frequency: 'weekly',
    parameters: {},
    recipients: ['fleet.admin@aparna-rmc.com', 'accounts@aparna-rmc.com'],
    isActive: true,
    lastRun: new Date(Date.now() - 3600000 * 96).toISOString(),
    nextRun: new Date(Date.now() + 3600000 * 72).toISOString(),
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'sched-ac-001',
    name: 'Monthly GST Invoicing & Receivables Aging Ledger',
    type: 'billing_tax_invoice_summary',
    format: 'pdf',
    frequency: 'monthly',
    parameters: {},
    recipients: ['finance.head@aparna-rmc.com', 'auditor@aparna-rmc.com'],
    isActive: true,
    lastRun: new Date(Date.now() - 3600000 * 200).toISOString(),
    nextRun: new Date(Date.now() + 3600000 * 300).toISOString(),
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
  }
];

export function useReports() {
  const [configs] = useState<ReportConfig[]>(mockReportConfigs);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>(() => {
    try {
      const stored = localStorage.getItem('rmc_generated_reports');
      return stored ? JSON.parse(stored) : INITIAL_GENERATED_REPORTS;
    } catch {
      return INITIAL_GENERATED_REPORTS;
    }
  });

  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>(() => {
    try {
      const stored = localStorage.getItem('rmc_scheduled_reports');
      return stored ? JSON.parse(stored) : INITIAL_SCHEDULED_REPORTS;
    } catch {
      return INITIAL_SCHEDULED_REPORTS;
    }
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ReportConfig | null>(null);
  const { toast } = useToast();

  // Save generated reports to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('rmc_generated_reports', JSON.stringify(generatedReports));
    } catch (e) {
      console.error('Failed to save generated reports:', e);
    }
  }, [generatedReports]);

  // Save scheduled reports to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('rmc_scheduled_reports', JSON.stringify(scheduledReports));
    } catch (e) {
      console.error('Failed to save scheduled reports:', e);
    }
  }, [scheduledReports]);

  const getStats = useCallback((): ReportStats => {
    const today = new Date().toISOString().split('T')[0];
    return {
      totalReports: generatedReports.length,
      generatedToday: generatedReports.filter(r => r.generatedAt.startsWith(today)).length,
      scheduledReports: scheduledReports.length,
      activeSchedules: scheduledReports.filter(s => s.isActive).length,
      failedReports: generatedReports.filter(r => r.status === 'failed').length,
    };
  }, [generatedReports, scheduledReports]);

  // Helper to generate dynamic mock report data based on requested persona report type
  const createReportContent = (type: ReportConfig['type'], format: string): { content: string; dataPreview: any } => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    switch (type) {
      // 1. WEIGHBRIDGE PERSONA
      case 'weighbridge_inbound_register':
        return {
          content: `Token_No,PO_Number,Vendor_Name,Material,Vehicle_Reg,Gross_MT,Tare_MT,Net_MT,SAP_Doc,Status\n` +
            `TK-901,PO-880021,UltraTech Cement Ltd,OPC 53 Cement,MH-12-RN-4501,43.20,14.40,28.80,500049281,Accepted\n` +
            `TK-902,PO-880022,Ganesh Stone Crusher,20mm Aggregates,MH-12-RN-4502,38.50,13.20,25.30,500049282,Accepted\n` +
            `TK-903,PO-880023,Ganesh Stone Crusher,10mm Aggregates,MH-12-RN-4503,37.10,12.90,24.20,500049283,Accepted\n` +
            `TK-904,PO-880024,Vighnaharta Sand Quarry,Crushed M-Sand,MH-14-EM-8821,39.40,13.10,26.30,500049284,Accepted\n` +
            `TK-905,PO-880025,Sika India Pvt Ltd,Sika ViscoCrete PCE,MH-12-TK-9901,18.50,9.25,9.25,500049285,Accepted`,
          dataPreview: {
            summary: {
              totalNetWeight: '113.85 MT',
              trucksWeighed: 5,
              sapSyncRate: '100% (5/5)',
              avgTareWeight: '12.57 MT'
            },
            headers: ['Token No', 'PO Number', 'Vendor Name', 'Material', 'Vehicle Reg', 'Gross MT', 'Tare MT', 'Net MT', 'SAP Doc', 'Status'],
            rows: [
              ['TK-901', 'PO-880021', 'UltraTech Cement Ltd', 'OPC 53 Cement', 'MH-12-RN-4501', '43.20', '14.40', '28.80', '500049281', 'Accepted'],
              ['TK-902', 'PO-880022', 'Ganesh Stone Crusher', '20mm Aggregates', 'MH-12-RN-4502', '38.50', '13.20', '25.30', '500049282', 'Accepted'],
              ['TK-903', 'PO-880023', 'Ganesh Stone Crusher', '10mm Aggregates', 'MH-12-RN-4503', '37.10', '12.90', '24.20', '500049283', 'Accepted'],
              ['TK-904', 'PO-880024', 'Vighnaharta Sand Quarry', 'Crushed M-Sand', 'MH-14-EM-8821', '39.40', '13.10', '26.30', '500049284', 'Accepted'],
              ['TK-905', 'PO-880025', 'Sika India Pvt Ltd', 'Sika ViscoCrete PCE', 'MH-12-TK-9901', '18.50', '9.25', '9.25', '500049285', 'Accepted']
            ]
          }
        };

      case 'sap_migo_sync_log':
        return {
          content: `Sync_ID,Weigh_Token,PO_Number,SAP_Doc_No,Movement_Type,Item_Code,Quantity_MT,RFC_Latency_ms,Status,Sync_Time\n` +
            `SYNC-101,TK-901,PO-880021,500049281,101,MAT-C01,28.80,18,Success,${timestamp}\n` +
            `SYNC-102,TK-902,PO-880022,500049282,101,MAT-A02,25.30,22,Success,${timestamp}\n` +
            `SYNC-103,TK-903,PO-880023,500049283,101,MAT-A01,24.20,16,Success,${timestamp}\n` +
            `SYNC-104,TK-904,PO-880024,500049284,101,MAT-S01,26.30,19,Success,${timestamp}\n` +
            `SYNC-105,TK-905,PO-880025,500049285,101,MAT-AD01,9.25,24,Success,${timestamp}`,
          dataPreview: {
            summary: {
              totalSyncCount: 5,
              successRate: '100%',
              movementType: '101 (GR)',
              avgLatency: '19.8 ms'
            },
            headers: ['Sync ID', 'Token', 'PO Number', 'SAP Doc No', 'Movement', 'Item Code', 'Quantity MT', 'Latency (ms)', 'Status', 'Timestamp'],
            rows: [
              ['SYNC-101', 'TK-901', 'PO-880021', '500049281', '101', 'MAT-C01', '28.80', '18', 'Success', timestamp],
              ['SYNC-102', 'TK-902', 'PO-880022', '500049282', '101', 'MAT-A02', '25.30', '22', 'Success', timestamp],
              ['SYNC-103', 'TK-903', 'PO-880023', '500049283', '101', 'MAT-A01', '24.20', '16', 'Success', timestamp],
              ['SYNC-104', 'TK-904', 'PO-880024', '500049284', '101', 'MAT-S01', '26.30', '19', 'Success', timestamp],
              ['SYNC-105', 'TK-905', 'PO-880025', '500049285', '101', 'MAT-AD01', '9.25', '24', 'Success', timestamp]
            ]
          }
        };

      // 2. QUALITY CONTROL PERSONA
      case 'qc_slump_workability':
        return {
          content: `Sample_ID,Challan_No,Concrete_Grade,Target_Slump_mm,Measured_Slump_mm,Flow_mm,Temp_C,W_C_Ratio,IS_1199_Result,QC_Inspector\n` +
            `SLP-801,CH-2025-881,M30,130,135,520,28.4,0.44,Passed,S. Kulkarni\n` +
            `SLP-802,CH-2025-882,M35,125,120,500,29.1,0.42,Passed,S. Kulkarni\n` +
            `SLP-803,CH-2025-883,M25,140,140,540,28.8,0.48,Passed,P. Thorat\n` +
            `SLP-804,CH-2025-884,M40,120,125,510,27.9,0.38,Passed,S. Kulkarni\n` +
            `SLP-805,CH-2025-885,M35,135,130,515,28.2,0.41,Passed,P. Thorat`,
          dataPreview: {
            summary: {
              totalTested: 5,
              slumpPassRate: '100%',
              avgSlump: '130 mm',
              avgTemp: '28.5 °C'
            },
            headers: ['Sample ID', 'Challan No', 'Grade', 'Target (mm)', 'Measured (mm)', 'Flow (mm)', 'Temp (°C)', 'W/C Ratio', 'Status', 'Inspector'],
            rows: [
              ['SLP-801', 'CH-2025-881', 'M30', '130', '135', '520', '28.4', '0.44', 'Passed', 'S. Kulkarni'],
              ['SLP-802', 'CH-2025-882', 'M35', '125', '120', '500', '29.1', '0.42', 'Passed', 'S. Kulkarni'],
              ['SLP-803', 'CH-2025-883', 'M25', '140', '140', '540', '28.8', '0.48', 'Passed', 'P. Thorat'],
              ['SLP-804', 'CH-2025-884', 'M40', '120', '125', '510', '27.9', '0.38', 'Passed', 'S. Kulkarni'],
              ['SLP-805', 'CH-2025-885', 'M35', '135', '130', '515', '28.2', '0.41', 'Passed', 'P. Thorat']
            ]
          }
        };

      case 'qc_compressive_strength':
        return {
          content: `Cube_ID,Batch_ID,Grade,Cast_Date,Test_Age_Days,Failure_Load_kN,Strength_MPa,Target_fck_MPa,IS_516_Status\n` +
            `CB-501,BAT-9881,M25,2025-01-08,7,412.5,18.3,16.5,Passed\n` +
            `CB-502,BAT-9882,M30,2025-01-08,7,495.0,22.0,20.0,Passed\n` +
            `CB-503,BAT-9820,M30,2024-12-18,28,787.5,35.0,30.0,Passed\n` +
            `CB-504,BAT-9821,M35,2024-12-18,28,918.0,40.8,35.0,Passed\n` +
            `CB-505,BAT-9822,M40,2024-12-18,28,1035.0,46.0,40.0,Passed`,
          dataPreview: {
            summary: {
              totalCubesTested: 5,
              strengthPassRate: '100%',
              avg7DayStrength: '20.1 MPa',
              avg28DayStrength: '40.6 MPa'
            },
            headers: ['Cube ID', 'Batch ID', 'Grade', 'Cast Date', 'Age (Days)', 'Load (kN)', 'Strength (MPa)', 'Target fck', 'Status'],
            rows: [
              ['CB-501', 'BAT-9881', 'M25', '2025-01-08', '7', '412.5', '18.3', '16.5', 'Passed'],
              ['CB-502', 'BAT-9882', 'M30', '2025-01-08', '7', '495.0', '22.0', '20.0', 'Passed'],
              ['CB-503', 'BAT-9820', 'M30', '2024-12-18', '28', '787.5', '35.0', '30.0', 'Passed'],
              ['CB-504', 'BAT-9821', 'M35', '2024-12-18', '28', '918.0', '40.8', '35.0', 'Passed'],
              ['CB-505', 'BAT-9822', 'M40', '2024-12-18', '28', '1035.0', '46.0', '40.0', 'Passed']
            ]
          }
        };

      // 3. BATCHING PLANT SUPERVISOR
      case 'batch_production_log':
        return {
          content: `Batch_ID,Recipe_Mix,Volume_m3,Cement_kg,Agg_10mm_kg,Agg_20mm_kg,Sand_kg,Water_kg,Admixture_L,Cycle_Sec,Batcher_Status\n` +
            `BAT-9901,REC-M30-P1,7.0,2450,4200,5600,5250,1050,24.5,58,Target Reached\n` +
            `BAT-9902,REC-M35-P2,6.5,2470,3900,5200,4875,975,26.0,55,Target Reached\n` +
            `BAT-9903,REC-M25-P1,8.0,2560,4800,6400,6000,1280,24.0,62,Target Reached\n` +
            `BAT-9904,REC-M40-P3,6.0,2520,3600,4800,4500,900,28.8,54,Target Reached\n` +
            `BAT-9905,REC-M35-P2,7.5,2850,4500,6000,5625,1125,30.0,59,Target Reached`,
          dataPreview: {
            summary: {
              totalVolume: '35.0 m³',
              avgCycleTime: '57.6 sec',
              totalCementUsed: '12.85 MT',
              accuracyRating: '99.7%'
            },
            headers: ['Batch ID', 'Recipe Mix', 'Volume (m³)', 'Cement (kg)', '10mm (kg)', '20mm (kg)', 'Sand (kg)', 'Water (kg)', 'Admixture (L)', 'Cycle (sec)', 'Status'],
            rows: [
              ['BAT-9901', 'REC-M30-P1', '7.0', '2450', '4200', '5600', '5250', '1050', '24.5', '58', 'Target Reached'],
              ['BAT-9902', 'REC-M35-P2', '6.5', '2470', '3900', '5200', '4875', '975', '26.0', '55', 'Target Reached'],
              ['BAT-9903', 'REC-M25-P1', '8.0', '2560', '4800', '6400', '6000', '1280', '24.0', '62', 'Target Reached'],
              ['BAT-9904', 'REC-M40-P3', '6.0', '2520', '3600', '4800', '4500', '900', '28.8', '54', 'Target Reached'],
              ['BAT-9905', 'REC-M35-P2', '7.5', '2850', '4500', '6000', '5625', '1125', '30.0', '59', 'Target Reached']
            ]
          }
        };

      case 'inventory_silo_consumption':
        return {
          content: `Silo_Bay,Material,Opening_Stock_MT,Consumed_Today_MT,Received_Today_MT,Closing_Stock_MT,Buffer_Days,Status\n` +
            `Silo 1,OPC 53 Grade Cement,68.5,12.85,28.65,84.3,6.5,Adequate\n` +
            `Silo 2,Fly Ash (Class F),42.0,6.40,0.0,35.6,5.5,Adequate\n` +
            `Bay 1,10mm Crushed Aggregates,185.0,21.0,24.1,188.1,8.9,Adequate\n` +
            `Bay 2,20mm Crushed Aggregates,210.0,27.6,25.2,207.6,7.5,Adequate\n` +
            `Bay 3,Crushed M-Sand,340.0,26.2,26.1,339.9,12.9,Adequate\n` +
            `Drum Bay,Sika PCE Admixture (L),1850.0,133.3,0.0,1716.7,12.8,Adequate`,
          dataPreview: {
            summary: {
              totalCementInStock: '84.3 MT',
              totalAggregateStock: '735.6 MT',
              lowestBufferDays: '5.5 Days',
              replenishmentAlerts: 0
            },
            headers: ['Silo / Bay', 'Material', 'Opening (MT)', 'Consumed (MT)', 'Received (MT)', 'Closing (MT)', 'Buffer (Days)', 'Status'],
            rows: [
              ['Silo 1', 'OPC 53 Cement', '68.5', '12.85', '28.65', '84.3', '6.5', 'Adequate'],
              ['Silo 2', 'Fly Ash', '42.0', '6.40', '0.0', '35.6', '5.5', 'Adequate'],
              ['Bay 1', '10mm Aggregates', '185.0', '21.0', '24.1', '188.1', '8.9', 'Adequate'],
              ['Bay 2', '20mm Aggregates', '210.0', '27.6', '25.2', '207.6', '7.5', 'Adequate'],
              ['Bay 3', 'Crushed M-Sand', '340.0', '26.2', '26.1', '339.9', '12.9', 'Adequate'],
              ['Drum Bay', 'Sika PCE Admixture', '1850.0', '133.3', '0.0', '1716.7', '12.8', 'Adequate']
            ]
          }
        };

      // 4. GATE SECURITY SUPERVISOR
      case 'gate_entry_exit_register':
        return {
          content: `Pass_ID,Plate_Number,Vehicle_Type,Driver_Name,Driver_License,Gate_In_Time,Gate_Out_Time,Duration_Mins,RFID_Tag,Security_Officer\n` +
            `GP-1011,MH-12-RN-4501,Transit Mixer (8m³),Suresh Patil,DL-MH12-2015-889,08:15:22,08:52:10,36.8,TAG-88201,H. Jadhav\n` +
            `GP-1012,MH-12-RN-4502,Transit Mixer (8m³),Rajesh Kumar,DL-MH12-2018-441,08:32:04,09:05:44,33.7,TAG-88202,H. Jadhav\n` +
            `GP-1013,MH-12-RN-4503,Transit Mixer (9m³),Dinesh More,DL-MH14-2016-992,09:01:10,09:42:15,41.1,TAG-88203,H. Jadhav\n` +
            `GP-1014,MH-14-EM-8821,Tip Trailer (Cement),Anil Ghorpade,DL-MH12-2019-103,09:15:30,10:04:12,48.7,TAG-88204,H. Jadhav\n` +
            `GP-1015,MH-12-TK-9901,Transit Mixer (8m³),Santosh Shinde,DL-MH12-2017-662,10:02:18,10:35:50,33.5,TAG-88205,H. Jadhav`,
          dataPreview: {
            summary: {
              totalLoggedVehicles: 5,
              avgYardTurnaround: '38.7 min',
              anprMatchRate: '100%',
              securityViolations: 0
            },
            headers: ['Pass ID', 'Plate Number', 'Vehicle Type', 'Driver Name', 'License #', 'Gate In', 'Gate Out', 'Duration (min)', 'RFID Tag', 'Officer'],
            rows: [
              ['GP-1011', 'MH-12-RN-4501', 'Transit Mixer (8m³)', 'Suresh Patil', 'DL-MH12-2015-889', '08:15:22', '08:52:10', '36.8', 'TAG-88201', 'H. Jadhav'],
              ['GP-1012', 'MH-12-RN-4502', 'Transit Mixer (8m³)', 'Rajesh Kumar', 'DL-MH12-2018-441', '08:32:04', '09:05:44', '33.7', 'TAG-88202', 'H. Jadhav'],
              ['GP-1013', 'MH-12-RN-4503', 'Transit Mixer (9m³)', 'Dinesh More', 'DL-MH14-2016-992', '09:01:10', '09:42:15', '41.1', 'TAG-88203', 'H. Jadhav'],
              ['GP-1014', 'MH-14-EM-8821', 'Tip Trailer (Cement)', 'Anil Ghorpade', 'DL-MH12-2019-103', '09:15:30', '10:04:12', '48.7', 'TAG-88204', 'H. Jadhav'],
              ['GP-1015', 'MH-12-TK-9901', 'Transit Mixer (8m³)', 'Santosh Shinde', 'DL-MH12-2017-662', '10:02:18', '10:35:50', '33.5', 'TAG-88205', 'H. Jadhav']
            ]
          }
        };

      // 5. DISPATCH PERSONA
      case 'trip_delivery_dockets':
        return {
          content: `Challan_No,Customer_Name,Site_Location,Grade,Volume_m3,Slump_mm,Mixer_Reg,Driver_Name,Dispatch_Time,Site_Arrival,Delivery_Status\n` +
            `CH-2025-881,BuildCorp Infra,Pune Ring Road Pkg 4,M30,7.0,130,MH-12-RN-4501,Suresh Patil,08:30,09:15,Delivered\n` +
            `CH-2025-882,Larsen & Toubro,Hinjewadi Tech Park Ph 3,M35,6.5,125,MH-12-RN-4502,Rajesh Kumar,09:10,09:55,Delivered\n` +
            `CH-2025-883,Shapoorji Pallonji,Kharadi IT Park Tower B,M25,8.0,140,MH-12-RN-4503,Dinesh More,10:00,10:50,Delivered\n` +
            `CH-2025-884,Godrej Properties,Wakad High-Rise Sec 2,M40,6.0,120,MH-14-EM-8821,Anil Ghorpade,11:15,12:00,Delivered\n` +
            `CH-2025-885,Tata Projects,Metro Line 3 Viaduct P-12,M35,7.5,135,MH-12-TK-9901,Santosh Shinde,13:00,13:45,Delivered`,
          dataPreview: {
            summary: {
              totalVolumeDelivered: '35.0 m³',
              onTimeRate: '100%',
              avgSiteTransit: '46 min',
              pendingTrips: 0
            },
            headers: ['Challan No', 'Customer Name', 'Site Location', 'Grade', 'Volume (m³)', 'Slump (mm)', 'Mixer Reg', 'Driver', 'Dispatch', 'Arrival', 'Status'],
            rows: [
              ['CH-2025-881', 'BuildCorp Infra', 'Pune Ring Road Pkg 4', 'M30', '7.0', '130', 'MH-12-RN-4501', 'Suresh Patil', '08:30', '09:15', 'Delivered'],
              ['CH-2025-882', 'Larsen & Toubro', 'Hinjewadi Tech Park Ph 3', 'M35', '6.5', '125', 'MH-12-RN-4502', 'Rajesh Kumar', '09:10', '09:55', 'Delivered'],
              ['CH-2025-883', 'Shapoorji Pallonji', 'Kharadi IT Park Tower B', 'M25', '8.0', '140', 'MH-12-RN-4503', 'Dinesh More', '10:00', '10:50', 'Delivered'],
              ['CH-2025-884', 'Godrej Properties', 'Wakad High-Rise Sec 2', 'M40', '6.0', '120', 'MH-14-EM-8821', 'Anil Ghorpade', '11:15', '12:00', 'Delivered'],
              ['CH-2025-885', 'Tata Projects', 'Metro Line 3 Viaduct P-12', 'M35', '7.5', '135', 'MH-12-TK-9901', 'Santosh Shinde', '13:00', '13:45', 'Delivered']
            ]
          }
        };

      // 6. FLEET MANAGER PERSONA
      case 'fleet_fuel_efficiency':
      case 'fuel_consumption':
        return {
          content: `Vehicle_Reg,Model,Distance_km,Fuel_Liters,Mileage_km_per_L,Cost_INR,PTO_Hours,Idle_Hours,Efficiency_Rating\n` +
            `MH-12-RN-4501,Ashok Leyland 2820 (8m³),3850,916.6,4.20,87077,48.5,12.2,Optimal\n` +
            `MH-12-RN-4502,Tata Signa 2823 (8m³),4120,1056.4,3.90,100358,52.0,15.8,Moderate\n` +
            `MH-12-RN-4503,BharatBenz 2828C (9m³),3690,838.6,4.40,79667,46.2,10.4,Optimal\n` +
            `MH-14-EM-8821,Eicher Pro 6028 (7m³),3450,784.0,4.40,74480,44.0,9.6,Optimal\n` +
            `MH-12-TK-9901,Ashok Leyland 2820 (8m³),2980,726.8,4.10,69046,38.4,11.2,Optimal`,
          dataPreview: {
            summary: {
              totalDistanceKm: '18,090 km',
              totalFuelLiters: '4,322.4 L',
              avgFleetMileage: '4.2 km/L',
              totalFuelCost: '₹4,10,628'
            },
            headers: ['Vehicle Reg', 'Model', 'Distance (km)', 'Fuel (L)', 'Mileage (km/L)', 'Cost (INR)', 'PTO (hrs)', 'Idle (hrs)', 'Efficiency'],
            rows: [
              ['MH-12-RN-4501', 'Ashok Leyland 2820', '3850', '916.6', '4.20', '₹87,077', '48.5', '12.2', 'Optimal'],
              ['MH-12-RN-4502', 'Tata Signa 2823', '4120', '1056.4', '3.90', '₹1,00,358', '52.0', '15.8', 'Moderate'],
              ['MH-12-RN-4503', 'BharatBenz 2828C', '3690', '838.6', '4.40', '₹79,667', '46.2', '10.4', 'Optimal'],
              ['MH-14-EM-8821', 'Eicher Pro 6028', '3450', '784.0', '4.40', '₹74,480', '44.0', '9.6', 'Optimal'],
              ['MH-12-TK-9901', 'Ashok Leyland 2820', '2980', '726.8', '4.10', '₹69,046', '38.4', '11.2', 'Optimal']
            ]
          }
        };

      // 7. ACCOUNTS PERSONA
      case 'billing_tax_invoice_summary':
      case 'billing_summary':
        return {
          content: `Invoice_No,Date,Customer_Name,GSTIN,Taxable_Value,CGST_9pct,SGST_9pct,Total_Invoice_INR,E_Way_Bill_No,Status\n` +
            `INV-2025-001,2025-01-10,BuildCorp Infrastructure Ltd,27AABCB1234F1Z5,315000.00,28350.00,28350.00,371700.00,281902847192,Paid\n` +
            `INV-2025-002,2025-01-12,Larsen & Toubro ECC,27AAACL0123M1Z2,455000.00,40950.00,40950.00,536900.00,281902847193,Paid\n` +
            `INV-2025-003,2025-01-14,Shapoorji Pallonji Co.,27AAACS4567H1Z8,280000.00,25200.00,25200.00,330400.00,281902847194,Pending\n` +
            `INV-2025-004,2025-01-15,Godrej Properties Ltd,27AAACG7890K1Z4,192000.00,17280.00,17280.00,226560.00,281902847195,Sent\n` +
            `INV-2025-005,2025-01-18,Tata Projects Ltd,27AAACT3344P1Z1,265000.00,23850.00,23850.00,312700.00,281902847196,Overdue`,
          dataPreview: {
            summary: {
              totalBilled: '₹17,78,260',
              taxCollected: '₹2,71,260',
              paidAmount: '₹9,08,600',
              eWayBillsMatched: '100% (5/5)'
            },
            headers: ['Invoice No', 'Date', 'Customer Name', 'GSTIN', 'Taxable (INR)', 'CGST (9%)', 'SGST (9%)', 'Total (INR)', 'E-Way Bill #', 'Status'],
            rows: [
              ['INV-2025-001', '2025-01-10', 'BuildCorp Infrastructure Ltd', '27AABCB1234F1Z5', '₹3,15,000', '₹28,350', '₹28,350', '₹3,71,700', '281902847192', 'Paid'],
              ['INV-2025-002', '2025-01-12', 'Larsen & Toubro ECC', '27AAACL0123M1Z2', '₹4,55,000', '₹40,950', '₹40,950', '₹5,36,900', '281902847193', 'Paid'],
              ['INV-2025-003', '2025-01-14', 'Shapoorji Pallonji Co.', '27AAACS4567H1Z8', '₹2,80,000', '₹25,200', '₹25,200', '₹3,30,400', '281902847194', 'Pending'],
              ['INV-2025-004', '2025-01-15', 'Godrej Properties Ltd', '27AAACG7890K1Z4', '₹1,92,000', '₹17,280', '₹17,280', '₹2,26,560', '281902847195', 'Sent'],
              ['INV-2025-005', '2025-01-18', 'Tata Projects Ltd', '27AAACT3344P1Z1', '₹2,65,000', '₹23,850', '₹23,850', '₹3,12,700', '281902847196', 'Overdue']
            ]
          }
        };

      // 8. EXECUTIVE PERSONA
      case 'executive_plant_kpi':
      default:
        return {
          content: `Metric_Domain,Key_Indicator,Month_Actual,Monthly_Target,Variance,Status\n` +
            `Production,Concrete Volume Batched,842 m³,800 m³,+5.25%,Ahead of Target\n` +
            `Logistics,On-Time Delivery Rate,94.8%,92.0%,+2.80%,Compliant\n` +
            `Quality,28-Day Strength Compliance,98.6%,95.0%,+3.60%,Compliant\n` +
            `Fleet,Average Mixer Mileage,4.2 km/L,4.0 km/L,+0.20 km/L,Optimal\n` +
            `Commercial,Net Billing Realization,₹42.8 Lakhs,₹40.0 Lakhs,+₹2.8L,Exceeded\n` +
            `Safety,Gate Security Incident Count,0,0,0,Zero Incidents`,
          dataPreview: {
            summary: {
              totalVolume: '842 m³',
              uptime: '94.2%',
              onTimeRate: '94.8%',
              operatingMargin: '21.4%'
            },
            headers: ['Domain', 'Key Indicator', 'Month Actual', 'Monthly Target', 'Variance', 'Status'],
            rows: [
              ['Production', 'Concrete Volume Batched', '842 m³', '800 m³', '+5.25%', 'Ahead of Target'],
              ['Logistics', 'On-Time Delivery Rate', '94.8%', '92.0%', '+2.80%', 'Compliant'],
              ['Quality', '28-Day Strength Compliance', '98.6%', '95.0%', '+3.60%', 'Compliant'],
              ['Fleet', 'Average Mixer Mileage', '4.2 km/L', '4.0 km/L', '+0.20 km/L', 'Optimal'],
              ['Commercial', 'Net Billing Realization', '₹42.8 Lakhs', '₹40.0 Lakhs', '+₹2.8L', 'Exceeded'],
              ['Safety', 'Gate Security Incident Count', '0', '0', '0', 'Zero Incidents']
            ]
          }
        };
    }
  };

  const generateReport = useCallback(async (request: ReportGenerateRequest): Promise<GeneratedReport | null> => {
    setIsGenerating(true);

    try {
      // Simulate real report compile process
      await new Promise(r => setTimeout(r, 600));

      const config = configs.find(c => c.type === request.type);
      const generatedContent = createReportContent(request.type, request.format);
      const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const reportName = `${config?.name || request.type} (${dateStr})`;

      const newReport: GeneratedReport = {
        id: `rep-${Date.now().toString(36)}`,
        name: reportName,
        type: request.type,
        format: request.format,
        parameters: request.parameters || {},
        generatedAt: new Date().toISOString(),
        generatedBy: 'Operations Manager (Active User)',
        status: 'completed',
        fileSize: Math.floor(Math.random() * 250000) + 45000,
        content: generatedContent.content,
        dataPreview: generatedContent.dataPreview,
      };

      setGeneratedReports(prev => [newReport, ...prev]);

      // Emit cross-module audit trail event
      try {
        window.dispatchEvent(new CustomEvent('rmc-audit-event', {
          detail: {
            action: 'REPORT_GENERATED',
            module: 'Reports & Exports',
            description: `Generated ${reportName} in ${request.format.toUpperCase()} format`,
            user: 'Operations Manager',
            timestamp: new Date().toISOString(),
          }
        }));
      } catch (e) {
        console.error('Audit event error:', e);
      }

      toast({
        title: 'Report Generated Successfully',
        description: `${reportName} is ready for download in ${request.format.toUpperCase()} format.`,
      });

      return newReport;
    } catch (error: any) {
      toast({
        title: 'Report Generation Failed',
        description: error.message || 'An error occurred during report compiling.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [configs, toast]);

  const downloadReport = useCallback((report: GeneratedReport) => {
    try {
      const fileContent = report.content || 
        `Report: ${report.name}\nType: ${report.type}\nGenerated: ${report.generatedAt}\nGenerated By: ${report.generatedBy}\nStatus: ${report.status}\nFormat: ${report.format}`;
      
      let mimeType = 'text/csv;charset=utf-8;';
      let fileExt = 'csv';

      if (report.format === 'excel') {
        mimeType = 'application/vnd.ms-excel;charset=utf-8;';
        fileExt = 'csv';
      } else if (report.format === 'pdf') {
        mimeType = 'text/plain;charset=utf-8;';
        fileExt = 'txt';
      }

      const blob = new Blob([fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeName = report.name.replace(/[^a-zA-Z0-9_\-]/g, '_');
      link.download = `${safeName}.${fileExt}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download Started',
        description: `Exported ${report.name} as .${fileExt}`,
      });
    } catch (error: any) {
      toast({
        title: 'Download Failed',
        description: error.message || 'Unable to download report file.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const scheduleReport = useCallback(async (request: ScheduleReportRequest) => {
    try {
      const now = new Date();
      let nextRun: Date;

      switch (request.frequency) {
        case 'daily':
          nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          nextRun = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          nextRun = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
          break;
        case 'quarterly':
          nextRun = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
          break;
        default:
          nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      }

      const newSchedule: ScheduledReport = {
        id: `sched-${Date.now().toString(36)}`,
        name: request.name,
        type: request.type,
        format: request.format,
        frequency: request.frequency,
        parameters: request.parameters || {},
        recipients: request.recipients,
        isActive: true,
        nextRun: nextRun.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setScheduledReports(prev => [newSchedule, ...prev]);

      try {
        window.dispatchEvent(new CustomEvent('rmc-audit-event', {
          detail: {
            action: 'REPORT_SCHEDULED',
            module: 'Reports & Exports',
            description: `Scheduled report '${request.name}' with ${request.frequency} frequency`,
            user: 'Operations Manager',
            timestamp: new Date().toISOString(),
          }
        }));
      } catch (e) {
        console.error('Audit event error:', e);
      }

      toast({
        title: 'Schedule Created',
        description: `Automated ${request.frequency} report '${request.name}' scheduled for ${request.recipients.length} recipients.`,
      });

      return newSchedule;
    } catch (error: any) {
      toast({
        title: 'Schedule Failed',
        description: error.message || 'Unable to create automated schedule.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const toggleScheduleActive = useCallback((id: string) => {
    setScheduledReports(prev => prev.map(s => {
      if (s.id === id) {
        const nextState = !s.isActive;
        toast({
          title: nextState ? 'Schedule Resumed' : 'Schedule Paused',
          description: `'${s.name}' is now ${nextState ? 'active' : 'paused'}.`,
        });
        return { ...s, isActive: nextState, updatedAt: new Date().toISOString() };
      }
      return s;
    }));
  }, [toast]);

  const deleteSchedule = useCallback((id: string) => {
    setScheduledReports(prev => {
      const schedule = prev.find(s => s.id === id);
      toast({
        title: 'Schedule Removed',
        description: schedule ? `Removed automated schedule for '${schedule.name}'.` : 'Schedule deleted.',
      });
      return prev.filter(s => s.id !== id);
    });
  }, [toast]);

  const runScheduledNow = useCallback(async (id: string) => {
    const schedule = scheduledReports.find(s => s.id === id);
    if (!schedule) return;

    await generateReport({
      type: schedule.type,
      format: schedule.format,
      parameters: schedule.parameters,
    });
  }, [scheduledReports, generateReport]);

  const deleteGeneratedReport = useCallback((id: string) => {
    setGeneratedReports(prev => {
      const report = prev.find(r => r.id === id);
      toast({
        title: 'Report Deleted',
        description: report ? `Deleted '${report.name}' from generated history.` : 'Report deleted.',
      });
      return prev.filter(r => r.id !== id);
    });
  }, [toast]);

  const getReportsByType = useCallback((type: ReportConfig['type']) => {
    return generatedReports.filter(r => r.type === type);
  }, [generatedReports]);

  const generateTripSummaryData = useCallback((): TripSummaryData => {
    return {
      period: 'January 2025',
      totalTrips: 156,
      completedTrips: 142,
      cancelledTrips: 8,
      totalDistance: 12450,
      avgDeliveryTime: 95,
      onTimeRate: 91.2,
      topDrivers: [
        { name: 'Rajesh Kumar', trips: 45, rating: 4.8 },
        { name: 'Suresh Patil', trips: 38, rating: 4.6 },
        { name: 'Amit Sharma', trips: 32, rating: 4.7 },
      ],
      topVehicles: [
        { regNo: 'MH-12-AB-1234', trips: 52, distance: 4200 },
        { regNo: 'MH-12-CD-5678', trips: 48, distance: 3850 },
        { regNo: 'MH-12-EF-9012', trips: 44, distance: 3600 },
      ],
    };
  }, []);

  const generateFuelConsumptionData = useCallback((): FuelConsumptionData => {
    return {
      period: 'January 2025',
      totalFuel: 4580,
      totalCost: 410850,
      avgCostPerLiter: 89.70,
      avgKmPerLiter: 4.2,
      byVehicle: [
        { regNo: 'MH-12-AB-1234', fuel: 1650, cost: 147675, efficiency: 4.5 },
        { regNo: 'MH-12-CD-5678', fuel: 1480, cost: 132760, efficiency: 4.1 },
        { regNo: 'MH-12-EF-9012', fuel: 1450, cost: 130415, efficiency: 3.9 },
      ],
      trend: [
        { date: '2025-01-01', quantity: 180, cost: 16110 },
        { date: '2025-01-05', quantity: 220, cost: 19800 },
        { date: '2025-01-10', quantity: 195, cost: 17550 },
        { date: '2025-01-15', quantity: 210, cost: 18900 },
      ],
    };
  }, []);

  return {
    configs,
    generatedReports,
    scheduledReports,
    selectedConfig,
    setSelectedConfig,
    isGenerating,
    stats: getStats(),
    generateReport,
    downloadReport,
    scheduleReport,
    toggleScheduleActive,
    deleteSchedule,
    runScheduledNow,
    deleteGeneratedReport,
    getReportsByType,
    generateTripSummaryData,
    generateFuelConsumptionData,
    refetch: () => {},
  };
}
