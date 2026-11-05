import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReports } from "@/hooks/useReports";
import { useAuth } from "@/contexts/AuthContext";
import { 
  FileText, 
  Calendar, 
  Download, 
  Play, 
  Clock, 
  Plus, 
  Trash2, 
  Eye, 
  Search, 
  CheckCircle2, 
  Truck, 
  Fuel, 
  Scale, 
  ShieldCheck, 
  Loader2, 
  Send,
  Warehouse,
  Wrench,
  Receipt,
  BarChart3,
  Sparkles,
  Layers,
  Activity,
  FileSpreadsheet,
  Lock
} from "lucide-react";
import { format } from "date-fns";
import { GeneratedReport, ReportConfig, ReportFormat, ReportFrequency, ReportType, PersonaId } from "@/types/reports";

interface PersonaConfig {
  id: PersonaId | 'all' | 'my_role';
  label: string;
  roleName: string;
  description: string;
  icon: React.ElementType;
  color: string;
  badgeBg: string;
  border: string;
  kpis: {
    label: string;
    value: string;
    subtext: string;
    icon: React.ElementType;
    color: string;
  }[];
}

const PERSONA_DEFINITIONS: Record<PersonaId, PersonaConfig> = {
  weighbridge_operator: {
    id: 'weighbridge_operator',
    label: 'Weighbridge Operator',
    roleName: 'Weighbridge Scale Operator',
    description: 'Gross, tare, net weighments, weigh slips, SAP ERP MIGO 101 goods receipt reconciliation, and tolerance exception audits',
    icon: Scale,
    color: 'text-cyan-600 dark:text-cyan-400',
    badgeBg: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    border: 'border-cyan-500/40',
    kpis: [
      { label: "Today's Weighments", value: '142 Trucks', subtext: '↑ 12% vs yesterday', icon: Scale, color: 'text-cyan-500' },
      { label: 'Gross Inbound MT', value: '1,840.5 MT', subtext: 'Cement + Aggregates', icon: Layers, color: 'text-blue-500' },
      { label: 'Avg Scale Dwell', value: '3.8 min', subtext: 'Optimal scale clearance', icon: Clock, color: 'text-emerald-500' },
      { label: 'SAP MIGO 101 Sync', value: '99.3%', subtext: '141/142 Posted instantly', icon: CheckCircle2, color: 'text-purple-500' },
    ]
  },
  qc_inspector: {
    id: 'qc_inspector',
    label: 'Quality Control (QC)',
    roleName: 'Quality Control Lead',
    description: 'Slump cone verification (IS 1199), 7 & 28-day compressive cube strength (IS 516), fresh concrete temperature, and CAPA logs',
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    border: 'border-emerald-500/40',
    kpis: [
      { label: 'Slump Pass Rate', value: '98.2%', subtext: '42/43 Batches passed', icon: CheckCircle2, color: 'text-emerald-500' },
      { label: '28-Day Strength Avg', value: '35.8 MPa', subtext: 'Target fck: 30.0 MPa', icon: Activity, color: 'text-blue-500' },
      { label: 'Fresh Concrete Temp', value: '28.4 °C', subtext: '<32°C IS guideline', icon: Clock, color: 'text-amber-500' },
      { label: 'Batch Rejection Rate', value: '0.0%', subtext: 'Zero non-conformances', icon: ShieldCheck, color: 'text-teal-500' },
    ]
  },
  batching_operator: {
    id: 'batching_operator',
    label: 'Batching Plant',
    roleName: 'Batching Plant Supervisor',
    description: 'Twin-shaft mixer cycle telemetry, Silo 1 (OPC 53) & Silo 2 (Fly Ash) consumption, aggregate bins, and recipe dosing precision',
    icon: Warehouse,
    color: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    border: 'border-amber-500/40',
    kpis: [
      { label: 'Batched Volume Today', value: '382.5 m³', subtext: '52 Mix cycles completed', icon: Warehouse, color: 'text-amber-500' },
      { label: 'OPC-53 Silo Level', value: '84.3 MT', subtext: '6.5 days buffer remaining', icon: Layers, color: 'text-cyan-500' },
      { label: 'Avg Batch Cycle Time', value: '57.6 sec', subtext: 'Target: <60 seconds', icon: Clock, color: 'text-blue-500' },
      { label: 'Cement Dosing Precision', value: '±0.3%', subtext: 'Auto weight compensated', icon: CheckCircle2, color: 'text-emerald-500' },
    ]
  },
  gate_operator: {
    id: 'gate_operator',
    label: 'Gate Security',
    roleName: 'Gate Security Supervisor',
    description: 'Automatic Number Plate Recognition (ANPR), barrier overrides, yard dwell time, RFID credentialing, and security audits',
    icon: ShieldCheck,
    color: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
    border: 'border-rose-500/40',
    kpis: [
      { label: 'Gate-In Entries Today', value: '84 Trucks', subtext: '62 Mixers + 22 Raw Inward', icon: ShieldCheck, color: 'text-rose-500' },
      { label: 'Active Trucks in Yard', value: '12 Trucks', subtext: 'No bay congestion', icon: Truck, color: 'text-amber-500' },
      { label: 'Avg Yard Turnaround', value: '38.7 min', subtext: 'Gate-in to gate-out TAT', icon: Clock, color: 'text-blue-500' },
      { label: 'ANPR Read Accuracy', value: '99.2%', subtext: 'High-res camera capture', icon: CheckCircle2, color: 'text-emerald-500' },
    ]
  },
  dispatch_officer: {
    id: 'dispatch_officer',
    label: 'Dispatch & Logistics',
    roleName: 'Dispatch & Logistics Officer',
    description: 'Electronic delivery challans (e-dockets), transit setting time tracking (90-min limit), site unloading turnaround, and driver dockets',
    icon: Truck,
    color: 'text-indigo-600 dark:text-indigo-400',
    badgeBg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    border: 'border-indigo-500/40',
    kpis: [
      { label: 'Active Transit Trips', value: '14 Mixers', subtext: 'Live GPS tracked', icon: Truck, color: 'text-indigo-500' },
      { label: 'Dispatched Today', value: '62 Trips', subtext: '434 m³ delivered to sites', icon: Activity, color: 'text-emerald-500' },
      { label: 'On-Time Delivery Rate', value: '95.4%', subtext: 'Within promised window', icon: CheckCircle2, color: 'text-blue-500' },
      { label: '90-Min Expiry Alert', value: '0 Breaches', subtext: 'All loads within limit', icon: Clock, color: 'text-purple-500' },
    ]
  },
  fleet_manager: {
    id: 'fleet_manager',
    label: 'Fleet & Workshop',
    roleName: 'Fleet & Workshop Manager',
    description: 'Transit mixer diesel mileage (km/L), drum rotation blade wear, scheduled chassis lubrication, and RTO statutory fitness tracker',
    icon: Wrench,
    color: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
    border: 'border-blue-500/40',
    kpis: [
      { label: 'Active Mixers Ready', value: '18 / 20', subtext: '90% Fleet availability', icon: Truck, color: 'text-blue-500' },
      { label: 'Fleet Fuel Economy', value: '4.20 km/L', subtext: 'Optimal diesel mileage', icon: Fuel, color: 'text-amber-500' },
      { label: 'Total Distance MTD', value: '18,090 km', subtext: 'Avg 904 km per vehicle', icon: Activity, color: 'text-emerald-500' },
      { label: 'Overdue PM Service', value: '1 Vehicle', subtext: 'Scheduled for workshop', icon: Wrench, color: 'text-rose-500' },
    ]
  },
  accounts_manager: {
    id: 'accounts_manager',
    label: 'Commercial & Accounts',
    roleName: 'Commercial & Accounts Lead',
    description: 'Commercial GST tax invoices (HSN 38245010), E-Way bill reconciliation, accounts receivables aging (>30d), and raw material purchase rates',
    icon: Receipt,
    color: 'text-violet-600 dark:text-violet-400',
    badgeBg: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30',
    border: 'border-violet-500/40',
    kpis: [
      { label: 'Total Billed Today', value: '₹18.4 Lakhs', subtext: '5 Commercial clients', icon: Receipt, color: 'text-violet-500' },
      { label: 'Active E-Way Bills', value: '42 Bills', subtext: '100% Tax compliance', icon: CheckCircle2, color: 'text-emerald-500' },
      { label: 'GST Amount (18%)', value: '₹2.71 Lakhs', subtext: 'CGST 9% + SGST 9%', icon: Activity, color: 'text-blue-500' },
      { label: 'Receivables >30d', value: '₹4.2 Lakhs', subtext: 'Under credit limit', icon: Clock, color: 'text-amber-500' },
    ]
  },
  admin: {
    id: 'admin',
    label: 'Plant Executive / Admin',
    roleName: 'Plant Manager / Admin',
    description: 'Consolidated plant performance scorecard, production yield, fleet uptime, commercial turnover, and forensic audit trail',
    icon: BarChart3,
    color: 'text-amber-600 dark:text-yellow-400',
    badgeBg: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/30',
    border: 'border-yellow-500/40',
    kpis: [
      { label: 'Monthly RMC Volume', value: '842 m³', subtext: '105% of monthly target', icon: BarChart3, color: 'text-amber-500' },
      { label: 'Plant Capacity Uptime', value: '94.2%', subtext: 'Twin-shaft batcher online', icon: CheckCircle2, color: 'text-emerald-500' },
      { label: 'Operating Margin', value: '21.4%', subtext: 'Revenue vs raw cost', icon: Activity, color: 'text-blue-500' },
      { label: 'Governance Overrides', value: '2 Audited', subtext: 'Supervisor signed off', icon: ShieldCheck, color: 'text-purple-500' },
    ]
  }
};

export default function Reports() {
  const { user } = useAuth();
  const { 
    configs, 
    generatedReports, 
    scheduledReports, 
    stats, 
    isGenerating, 
    generateReport, 
    downloadReport,
    deleteGeneratedReport,
    scheduleReport,
    toggleScheduleActive,
    deleteSchedule,
    runScheduledNow
  } = useReports();

  // Determine user's native role
  const userPersonaId = useMemo((): PersonaId => {
    const rawRoleId = user?.roleId || '';
    if (rawRoleId in PERSONA_DEFINITIONS) {
      return rawRoleId as PersonaId;
    }
    return 'weighbridge_operator';
  }, [user]);

  // Check if current user is Super Admin or Plant Head
  const isSuperAdminOrPlantHead = useMemo(() => {
    if (!user) return false;
    const rId = (user.roleId || user.role?.id || '').toLowerCase();
    const rName = (user.roleName || user.role?.name || '').toLowerCase();
    return (
      rId === 'admin' ||
      rId === 'super_admin' ||
      rId === 'plant_head' ||
      rId === 'plant_manager' ||
      rName.includes('admin') ||
      rName.includes('plant manager') ||
      rName.includes('plant head')
    );
  }, [user]);

  // Persona filter state:
  // For Super Admin/Plant Head: defaults to 'all' or 'my_role' with full switcher
  // For normal users: locked strictly to 'my_role'
  const [selectedPersona, setSelectedPersona] = useState<string>('my_role');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [historyFormatFilter, setHistoryFormatFilter] = useState<string>("all");
  const [selectedFormatMap, setSelectedFormatMap] = useState<Record<string, ReportFormat>>({});

  // Preview Dialog State
  const [previewReport, setPreviewReport] = useState<GeneratedReport | null>(null);
  const [previewViewMode, setPreviewViewMode] = useState<'table' | 'raw'>('table');

  // New Schedule Dialog State
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [scheduleName, setScheduleName] = useState("");
  const [scheduleType, setScheduleType] = useState<ReportType>("weighbridge_inbound_register");
  const [scheduleFormat, setScheduleFormat] = useState<ReportFormat>("excel");
  const [scheduleFrequency, setScheduleFrequency] = useState<ReportFrequency>("daily");
  const [scheduleRecipients, setScheduleRecipients] = useState("weighbridge.lead@aparna-rmc.com, plant.manager@aparna-rmc.com");

  // Format selection per config
  const handleFormatChange = (configId: string, formatVal: ReportFormat) => {
    setSelectedFormatMap(prev => ({ ...prev, [configId]: formatVal }));
  };

  const handleGenerate = async (config: ReportConfig) => {
    const targetFormat = selectedFormatMap[config.id] || config.availableFormats[0] || 'csv';
    await generateReport({
      type: config.type,
      format: targetFormat,
      parameters: {
        dateRange: 'Current Period',
        generatedTimestamp: new Date().toISOString()
      }
    });
  };

  // Helper to resolve currently active persona definition for KPI display
  const activePersonaConfig = useMemo(() => {
    // If not super admin, strictly use logged in user's persona
    if (!isSuperAdminOrPlantHead) {
      return PERSONA_DEFINITIONS[userPersonaId] || PERSONA_DEFINITIONS.weighbridge_operator;
    }

    if (selectedPersona === 'my_role') {
      return PERSONA_DEFINITIONS[userPersonaId] || PERSONA_DEFINITIONS.admin;
    }
    if (selectedPersona !== 'all' && selectedPersona in PERSONA_DEFINITIONS) {
      return PERSONA_DEFINITIONS[selectedPersona as PersonaId];
    }
    return PERSONA_DEFINITIONS[userPersonaId] || PERSONA_DEFINITIONS.admin;
  }, [selectedPersona, userPersonaId, isSuperAdminOrPlantHead]);

  // Filter report configurations strictly based on user role permissions
  const filteredConfigs = useMemo(() => {
    return configs.filter(c => {
      let matchesPersona = true;

      // If user is NOT Super Admin/Plant Head, strictly restrict to their logged-in persona
      if (!isSuperAdminOrPlantHead) {
        matchesPersona = c.personaId === userPersonaId || c.personaId === 'all';
      } else {
        // Super Admin / Plant Head can filter by any selected persona or view all
        if (selectedPersona === 'my_role') {
          matchesPersona = c.personaId === userPersonaId || c.personaId === 'all';
        } else if (selectedPersona !== 'all') {
          matchesPersona = c.personaId === selectedPersona || c.personaId === 'all';
        }
      }

      // Search matching
      const matchesSearch = 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.personaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.keyMetrics && c.keyMetrics.some(m => m.toLowerCase().includes(searchTerm.toLowerCase())));

      return matchesPersona && matchesSearch;
    });
  }, [configs, selectedPersona, userPersonaId, searchTerm, isSuperAdminOrPlantHead]);

  // Filter report history: non-admin users only see reports belonging to their role
  const filteredHistory = useMemo(() => {
    return generatedReports.filter(r => {
      const config = configs.find(c => c.type === r.type);
      let matchesPersona = true;

      if (!isSuperAdminOrPlantHead) {
        matchesPersona = !config || config.personaId === userPersonaId || config.personaId === 'all';
      } else {
        if (selectedPersona === 'my_role') {
          matchesPersona = !config || config.personaId === userPersonaId || config.personaId === 'all';
        } else if (selectedPersona !== 'all') {
          matchesPersona = !config || config.personaId === selectedPersona || config.personaId === 'all';
        }
      }

      const matchesSearch = 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.generatedBy.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFormat = historyFormatFilter === 'all' || r.format === historyFormatFilter;

      return matchesPersona && matchesSearch && matchesFormat;
    });
  }, [generatedReports, configs, selectedPersona, userPersonaId, searchTerm, historyFormatFilter, isSuperAdminOrPlantHead]);

  // Filter scheduled reports: non-admin users only see schedules belonging to their role
  const filteredScheduledReports = useMemo(() => {
    return scheduledReports.filter(s => {
      const config = configs.find(c => c.type === s.type);
      if (!isSuperAdminOrPlantHead) {
        return !config || config.personaId === userPersonaId || config.personaId === 'all';
      }
      if (selectedPersona === 'all') return true;
      if (selectedPersona === 'my_role') {
        return !config || config.personaId === userPersonaId || config.personaId === 'all';
      }
      return !config || config.personaId === selectedPersona || config.personaId === 'all';
    });
  }, [scheduledReports, configs, isSuperAdminOrPlantHead, selectedPersona, userPersonaId]);

  // Available report templates for schedule dialog (filtered by permissions)
  const availableScheduleConfigs = useMemo(() => {
    if (isSuperAdminOrPlantHead) {
      return configs;
    }
    return configs.filter(c => c.personaId === userPersonaId || c.personaId === 'all');
  }, [configs, isSuperAdminOrPlantHead, userPersonaId]);

  const handleCreateSchedule = async () => {
    if (!scheduleName.trim()) return;

    const emails = scheduleRecipients
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    await scheduleReport({
      name: scheduleName.trim(),
      type: scheduleType,
      format: scheduleFormat,
      frequency: scheduleFrequency,
      parameters: {},
      recipients: emails.length > 0 ? emails : ['reports@aparna-rmc.com'],
    });

    setIsScheduleDialogOpen(false);
    setScheduleName("");
  };

  const getPersonaBadge = (personaId: string) => {
    if (personaId in PERSONA_DEFINITIONS) {
      const p = PERSONA_DEFINITIONS[personaId as PersonaId];
      const Icon = p.icon;
      return (
        <Badge variant="outline" className={`gap-1 font-medium text-[11px] ${p.badgeBg}`}>
          <Icon className="h-3 w-3" />
          {p.label}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[11px]">
        {personaId}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* 1. PAGE HEADER & USER PERSONA CONTEXT */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  Ready-Mix Operational Reports
                </h1>
                {isSuperAdminOrPlantHead ? (
                  <Badge variant="secondary" className="font-mono text-xs gap-1 border border-primary/30">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    Super Admin / Plant Head
                  </Badge>
                ) : (
                  <Badge variant="secondary" className={`font-mono text-xs gap-1 border ${activePersonaConfig.badgeBg}`}>
                    <activePersonaConfig.icon className="h-3 w-3" />
                    {activePersonaConfig.roleName} Workspace
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {isSuperAdminOrPlantHead 
                  ? "Executive view across all plant departments — Select a persona view or export consolidated plant analytics."
                  : `Showing authorized operational reports and live telemetry for ${activePersonaConfig.roleName}.`}
              </p>
            </div>
          </div>
        </div>

        {/* Right Header Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3 py-1.5 rounded-lg border bg-card text-xs flex items-center gap-2 shadow-xs">
            <span className="text-muted-foreground">Logged In As:</span>
            <span className="font-semibold text-foreground">{user?.name || 'Authorized User'}</span>
            <Badge variant="outline" className="text-[10px] font-mono capitalize bg-primary/5">
              {user?.roleName || activePersonaConfig.roleName}
            </Badge>
          </div>

          <Button onClick={() => setIsScheduleDialogOpen(true)} className="flex items-center gap-2 cursor-pointer shadow-sm">
            <Plus className="h-4 w-4" />
            Schedule Report
          </Button>
        </div>
      </div>

      {/* 2. PERSONA SELECTOR TABS (SHOWN ONLY TO SUPER ADMIN / PLANT HEAD) */}
      {isSuperAdminOrPlantHead ? (
        <div className="space-y-2 p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
              <Layers className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>Select Persona View:</span>
              <span className="text-[10px] font-normal normal-case text-muted-foreground ml-1">
                (Visible to Super Admin / Plant Head only)
              </span>
            </div>
            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-1 font-mono">
              <Sparkles className="h-3 w-3" />
              Executive Multi-Role Switcher
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {/* ALL PERSONAS PILL */}
            <Button
              type="button"
              size="sm"
              variant={selectedPersona === 'all' ? "default" : "outline"}
              onClick={() => setSelectedPersona('all')}
              className={`h-8 text-xs gap-1.5 rounded-full shrink-0 font-medium ${
                selectedPersona === 'all' ? 'shadow-sm' : 'bg-card'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>All Personas ({configs.length})</span>
            </Button>

            {/* MY ROLE PILL */}
            <Button
              type="button"
              size="sm"
              variant={selectedPersona === 'my_role' ? "default" : "outline"}
              onClick={() => setSelectedPersona('my_role')}
              className={`h-8 text-xs gap-1.5 rounded-full shrink-0 font-medium ${
                selectedPersona === 'my_role' ? 'shadow-sm' : 'bg-card'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Executive / Plant Head</span>
            </Button>

            <div className="h-5 w-px bg-border/60 mx-1 shrink-0" />

            {/* INDIVIDUAL PERSONA PILLS */}
            {(Object.keys(PERSONA_DEFINITIONS) as PersonaId[]).map((pId) => {
              const p = PERSONA_DEFINITIONS[pId];
              const Icon = p.icon;
              const isSelected = selectedPersona === pId;
              return (
                <Button
                  key={pId}
                  type="button"
                  size="sm"
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => setSelectedPersona(pId)}
                  className={`h-8 text-xs gap-1.5 rounded-full shrink-0 ${
                    isSelected ? 'shadow-sm' : 'bg-card hover:bg-muted/60'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-inherit' : p.color}`} />
                  <span>{p.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Context notification banner for department users (No Switcher Visible) */
        <div className="px-4 py-2 rounded-lg border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-primary" />
            <span>
              Role Workspace: <strong className="text-foreground">{activePersonaConfig.roleName}</strong> — Showing reports assigned to your security profile.
            </span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground hidden sm:inline-block">
            {filteredConfigs.length} Authorized Templates
          </span>
        </div>
      )}

      {/* 3. DYNAMIC PERSONA KPI BANNER */}
      <div className="p-4 rounded-xl border bg-gradient-to-r from-card via-card to-accent/20 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg bg-card border ${activePersonaConfig.border} shadow-xs`}>
              <activePersonaConfig.icon className={`h-5 w-5 ${activePersonaConfig.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-foreground">
                  {activePersonaConfig.label} KPI Telemetry
                </h3>
                <Badge variant="outline" className={`text-[10px] ${activePersonaConfig.badgeBg}`}>
                  {activePersonaConfig.roleName}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activePersonaConfig.description}
              </p>
            </div>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {activePersonaConfig.kpis.map((kpi, idx) => {
            const KpiIcon = kpi.icon;
            return (
              <div 
                key={idx} 
                className="p-3 rounded-lg border bg-card/80 hover:bg-card transition-colors shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span className="font-medium truncate">{kpi.label}</span>
                  <KpiIcon className={`h-3.5 w-3.5 ${kpi.color} shrink-0`} />
                </div>
                <div className="text-xl font-extrabold text-foreground tracking-tight">
                  {kpi.value}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {kpi.subtext}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MAIN TABS (CATALOG / HISTORY / SCHEDULES) */}
      <Tabs defaultValue="generate" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <TabsList className="grid grid-cols-3 w-full sm:w-[460px]">
            <TabsTrigger value="generate">Report Catalog ({filteredConfigs.length})</TabsTrigger>
            <TabsTrigger value="history">History ({filteredHistory.length})</TabsTrigger>
            <TabsTrigger value="scheduled">Schedules ({filteredScheduledReports.length})</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search report titles, metrics, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-xs"
              />
            </div>
          </div>
        </div>

        {/* ===================== TAB 1: REPORT CATALOG ===================== */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredConfigs.map((config) => {
              const currentFormat = selectedFormatMap[config.id] || config.availableFormats[0] || 'csv';
              const persona = PERSONA_DEFINITIONS[config.personaId as PersonaId];
              const Icon = persona?.icon || FileText;

              return (
                <Card 
                  key={config.id} 
                  className="flex flex-col justify-between hover:shadow-md transition-all duration-200 border-border/80 group hover:border-primary/50"
                >
                  <CardHeader className="pb-3 space-y-2.5">
                    {/* Header Pills: Persona + Category */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <div className={`p-1.5 rounded-md bg-accent/60 ${persona?.color || 'text-primary'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        {getPersonaBadge(config.personaId)}
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {config.category}
                      </Badge>
                    </div>

                    <div>
                      <CardTitle className="text-base font-bold group-hover:text-primary transition-colors">
                        {config.name}
                      </CardTitle>
                      <CardDescription className="text-xs line-clamp-3 mt-1 leading-relaxed">
                        {config.description}
                      </CardDescription>
                    </div>

                    {/* Key Metrics Chips */}
                    {config.keyMetrics && (
                      <div className="pt-1">
                        <div className="flex flex-wrap gap-1">
                          {config.keyMetrics.map((km, i) => (
                            <span 
                              key={i} 
                              className="text-[10px] px-2 py-0.5 rounded bg-muted/60 border text-muted-foreground font-mono"
                            >
                              {km}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3 pt-2 border-t border-border/40 mt-auto">
                    {/* Format Selector */}
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-[11px] text-muted-foreground">Format:</Label>
                      <div className="flex items-center gap-1">
                        {config.availableFormats.map((f) => (
                          <Button
                            key={f}
                            type="button"
                            size="sm"
                            variant={currentFormat === f ? "default" : "outline"}
                            className="h-6 text-[10px] px-2 uppercase font-mono"
                            onClick={() => handleFormatChange(config.id, f)}
                          >
                            {f}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs cursor-pointer flex items-center justify-center gap-1.5"
                        onClick={() => {
                          const previewSample: GeneratedReport = {
                            id: `preview-${config.id}`,
                            name: config.name,
                            type: config.type,
                            format: currentFormat,
                            parameters: { sample: 'Instant Template Preview' },
                            generatedAt: new Date().toISOString(),
                            generatedBy: `${config.personaName} (Sample)`,
                            status: 'completed',
                            fileSize: 135000,
                            content: `Metric,Recorded_Value,Standard,Verification\nSample_Type,${config.name},IS 456,Verified\nTimestamp,${new Date().toISOString()},System,Passed`,
                            dataPreview: {
                              summary: {
                                template: config.name,
                                persona: config.personaName,
                                category: config.category,
                                format: currentFormat.toUpperCase()
                              },
                              headers: ['Parameter', 'Target Value', 'Operational Range', 'Verification'],
                              rows: [
                                ['Batch Accuracy', '±0.5%', 'IS 4926 Clause 6', 'Certified'],
                                ['Scale Calibration', '20 MT Test Weight', 'Legal Metrology', 'Verified'],
                                ['Slump Variance', '±15 mm', 'IS 1199 Cone Test', 'Compliant'],
                                ['SAP ERP Link', 'RFC Gateway PL01', 'S/4HANA 2023', 'Connected']
                              ]
                            }
                          };
                          setPreviewReport(previewSample);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        Preview
                      </Button>

                      <Button 
                        size="sm"
                        className="w-full text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-xs" 
                        onClick={() => handleGenerate(config)} 
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Compiling...
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5" />
                            Generate
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredConfigs.length === 0 && (
            <div className="text-center py-12 border rounded-xl bg-card text-muted-foreground space-y-2">
              <FileText className="h-10 w-10 mx-auto opacity-40 text-primary" />
              <p className="text-base font-semibold text-foreground">No reports found for your profile</p>
              <p className="text-xs">
                {isSuperAdminOrPlantHead
                  ? 'Try selecting "All Personas" above or clearing your search term.'
                  : 'Contact your System Administrator if you need access to additional department reports.'}
              </p>
              {isSuperAdminOrPlantHead && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { setSelectedPersona('all'); setSearchTerm(''); }}
                  className="mt-2 text-xs"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        {/* ===================== TAB 2: REPORT HISTORY ===================== */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-1">Filter Format:</span>
              {['all', 'csv', 'excel', 'pdf'].map(fmt => (
                <Button
                  key={fmt}
                  size="sm"
                  variant={historyFormatFilter === fmt ? 'default' : 'outline'}
                  className="h-7 text-xs uppercase font-mono"
                  onClick={() => setHistoryFormatFilter(fmt)}
                >
                  {fmt}
                </Button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Showing {filteredHistory.length} of {generatedReports.length} generated files
            </p>
          </div>

          <div className="space-y-3">
            {filteredHistory.map((report) => {
              const config = configs.find(c => c.type === report.type);
              const persona = config ? PERSONA_DEFINITIONS[config.personaId as PersonaId] : null;

              return (
                <Card key={report.id} className="hover:bg-accent/10 transition-colors border-border/80">
                  <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start md:items-center gap-3">
                      <div className={`p-2.5 rounded-lg bg-accent/60 ${persona?.color || 'text-primary'}`}>
                        {persona ? <persona.icon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-foreground text-sm">{report.name}</p>
                          {config && getPersonaBadge(config.personaId)}
                          <Badge variant="outline" className="uppercase font-mono text-[10px]">
                            {report.format}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{format(new Date(report.generatedAt), 'dd MMM yyyy, HH:mm')}</span>
                          <span>•</span>
                          <span>By {report.generatedBy}</span>
                          <span>•</span>
                          <span>{report.fileSize ? `${Math.round(report.fileSize / 1024)} KB` : '120 KB'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewReport(report)}
                        className="text-xs h-8 cursor-pointer"
                        title="View Report Preview"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Preview
                      </Button>

                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => downloadReport(report)}
                        className="text-xs h-8 cursor-pointer shadow-xs"
                        title="Download Export File"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Download
                      </Button>

                      {isSuperAdminOrPlantHead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteGeneratedReport(report.id)}
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
                          title="Delete Report"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredHistory.length === 0 && (
              <div className="text-center py-12 border rounded-xl bg-card text-muted-foreground space-y-2">
                <FileText className="h-10 w-10 mx-auto opacity-40 text-primary" />
                <p className="font-semibold text-sm text-foreground">No reports found in history</p>
                <p className="text-xs">
                  Generate a report from the catalog tab to build your historical download archive.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ===================== TAB 3: SCHEDULED REPORTS ===================== */}
        <TabsContent value="scheduled" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <div>
              <h3 className="text-sm font-bold text-foreground">Automated Email Dispatches</h3>
              <p className="text-xs text-muted-foreground">Automated scheduled reports emailed to stakeholders</p>
            </div>
            <Button size="sm" onClick={() => setIsScheduleDialogOpen(true)} className="text-xs gap-1.5 cursor-pointer">
              <Plus className="h-3.5 w-3.5" />
              Add Schedule
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredScheduledReports.map((schedule) => {
              const config = configs.find(c => c.type === schedule.type);
              const persona = config ? PERSONA_DEFINITIONS[config.personaId as PersonaId] : null;

              return (
                <Card key={schedule.id} className="border-border/80 flex flex-col justify-between shadow-2xs">
                  <CardHeader className="pb-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold">{schedule.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {config && getPersonaBadge(config.personaId)}
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {schedule.frequency.toUpperCase()} • {schedule.format.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={schedule.isActive ? "default" : "secondary"} className="text-[10px]">
                        {schedule.isActive ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-1 border-t border-border/40 mt-auto">
                    {/* Recipients */}
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Dispatched To:</Label>
                      <div className="flex flex-wrap gap-1">
                        {schedule.recipients.map((rec, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] font-normal py-0">
                            {rec}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-muted/40 text-xs flex items-center justify-between">
                      <span className="text-muted-foreground">Next Run:</span>
                      <span className="font-semibold text-foreground font-mono">
                        {format(new Date(schedule.nextRun), 'dd MMM yyyy, HH:mm')}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/40">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => runScheduledNow(schedule.id)}
                        className="text-xs h-7"
                        title="Run immediately"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Run Now
                      </Button>
                      <Button 
                        variant={schedule.isActive ? "secondary" : "default"} 
                        size="sm" 
                        onClick={() => toggleScheduleActive(schedule.id)}
                        className="text-xs h-7"
                      >
                        {schedule.isActive ? 'Pause' : 'Resume'}
                      </Button>
                      {isSuperAdminOrPlantHead && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteSchedule(schedule.id)}
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredScheduledReports.length === 0 && (
            <div className="text-center py-12 border rounded-xl text-muted-foreground space-y-2">
              <Clock className="h-10 w-10 mx-auto opacity-40 text-primary" />
              <p className="font-semibold text-sm text-foreground">No automated schedules active</p>
              <p className="text-xs">Click "Add Schedule" above to set up automated recurring exports.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ===================== MODAL 1: REPORT PREVIEW DIALOG ===================== */}
      <Dialog open={!!previewReport} onOpenChange={(open) => !open && setPreviewReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
          <DialogHeader className="border-b pb-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">
                    {previewReport?.name}
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    Format: {previewReport?.format.toUpperCase()} • Generated by {previewReport?.generatedBy}
                  </DialogDescription>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 border rounded-md p-0.5 bg-muted/40">
                <Button
                  size="sm"
                  variant={previewViewMode === 'table' ? 'default' : 'ghost'}
                  className="h-6 text-[11px] px-2.5"
                  onClick={() => setPreviewViewMode('table')}
                >
                  Table View
                </Button>
                <Button
                  size="sm"
                  variant={previewViewMode === 'raw' ? 'default' : 'ghost'}
                  className="h-6 text-[11px] px-2.5"
                  onClick={() => setPreviewViewMode('raw')}
                >
                  Raw CSV/Text
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto py-3 flex-1">
            {/* Top Summary KPI Badges */}
            {previewReport?.dataPreview?.summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {Object.entries(previewReport.dataPreview.summary).map(([key, val]) => (
                  <div key={key} className="p-2.5 rounded-lg border bg-card text-center shadow-2xs">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </p>
                    <p className="text-sm font-extrabold text-foreground mt-0.5 truncate">
                      {String(val)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* TABULAR VIEW */}
            {previewViewMode === 'table' && previewReport?.dataPreview?.headers && previewReport?.dataPreview?.rows && (
              <div className="rounded-lg border overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-muted/80 text-muted-foreground font-semibold sticky top-0 border-b">
                      <tr>
                        {previewReport.dataPreview.headers.map((h: string, idx: number) => (
                          <th key={idx} className="p-2.5 whitespace-nowrap font-mono text-[11px]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {previewReport.dataPreview.rows.map((row: string[], rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-accent/40 transition-colors odd:bg-card even:bg-muted/20">
                          {row.map((cell: string, cIdx: number) => {
                            const isStatus = ['Accepted', 'Passed', 'Target Reached', 'Optimal', 'Paid', 'Success', 'Compliant'].includes(cell);
                            const isWarning = ['Low Stock Warning', 'Moderate', 'Sent', 'Pending'].includes(cell);
                            const isDestructive = ['Overdue', 'Failed', 'Rejected'].includes(cell);

                            return (
                              <td key={cIdx} className="p-2.5 whitespace-nowrap font-mono text-[11px]">
                                {isStatus ? (
                                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                                    {cell}
                                  </Badge>
                                ) : isWarning ? (
                                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                                    {cell}
                                  </Badge>
                                ) : isDestructive ? (
                                  <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/30">
                                    {cell}
                                  </Badge>
                                ) : (
                                  cell
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* RAW MONOSPACE VIEW */}
            {(previewViewMode === 'raw' || !previewReport?.dataPreview?.headers) && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Raw Data Output</Label>
                <div className="p-3 rounded-lg border bg-muted/40 font-mono text-xs max-h-72 overflow-x-auto overflow-y-auto whitespace-pre leading-relaxed">
                  {previewReport?.content || "No raw preview content available for this report."}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between border-t pt-3">
            <span className="text-xs text-muted-foreground font-mono">
              Size: {previewReport?.fileSize ? `${Math.round(previewReport.fileSize / 1024)} KB` : '120 KB'} • Status: {previewReport?.status}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewReport(null)}>
                Close
              </Button>
              {previewReport && (
                <Button size="sm" onClick={() => downloadReport(previewReport)} className="shadow-xs">
                  <Download className="h-4 w-4 mr-1.5" />
                  Download File
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================== MODAL 2: SCHEDULE NEW REPORT DIALOG ===================== */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <DialogTitle className="text-lg">Schedule Automated Report</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Configure recurring export execution and automatic email dispatch to operational stakeholders.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="sched-name" className="text-xs font-semibold">Schedule Title *</Label>
              <Input
                id="sched-name"
                placeholder="e.g. Daily Inbound Aggregate & Cement Register"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Report Template *</Label>
              <Select value={scheduleType} onValueChange={(val) => setScheduleType(val as ReportType)}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {availableScheduleConfigs.map(c => (
                    <SelectItem key={c.type} value={c.type} className="text-xs">
                      [{c.personaName.split(' ')[0]}] {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Export Format *</Label>
                <Select value={scheduleFormat} onValueChange={(val) => setScheduleFormat(val as ReportFormat)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv" className="text-xs">CSV (Spreadsheet)</SelectItem>
                    <SelectItem value="excel" className="text-xs">Excel (.xlsx)</SelectItem>
                    <SelectItem value="pdf" className="text-xs">PDF Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Frequency *</Label>
                <Select value={scheduleFrequency} onValueChange={(val) => setScheduleFrequency(val as ReportFrequency)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily" className="text-xs">Daily</SelectItem>
                    <SelectItem value="weekly" className="text-xs">Weekly</SelectItem>
                    <SelectItem value="monthly" className="text-xs">Monthly</SelectItem>
                    <SelectItem value="quarterly" className="text-xs">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sched-recipients" className="text-xs font-semibold">Recipients (comma separated)</Label>
              <Input
                id="sched-recipients"
                placeholder="reports@aparna-rmc.com, lead@aparna-rmc.com"
                value={scheduleRecipients}
                onChange={(e) => setScheduleRecipients(e.target.value)}
                className="text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Automated email delivery will be dispatched at 07:00 AM on scheduled days.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateSchedule} disabled={!scheduleName.trim()}>
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Save Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
