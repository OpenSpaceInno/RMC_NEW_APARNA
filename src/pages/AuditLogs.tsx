import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Eye, 
  Lock, 
  RefreshCw,
  Terminal,
  Printer
} from 'lucide-react';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { AuditLogEntry, AuditModule, AuditAction, AuditSeverity } from '@/types/audit';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const moduleBadgeColors: Record<AuditModule, string> = {
  gate: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  weighbridge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  loading: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  dispatch: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  trip: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  tracking: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  exit: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  incident: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  system: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

const actionBadgeColors: Record<AuditAction, string> = {
  CREATE: 'bg-green-500/10 text-green-600',
  UPDATE: 'bg-blue-500/10 text-blue-600',
  DELETE: 'bg-red-500/10 text-red-600',
  STATUS_CHANGE: 'bg-purple-500/10 text-purple-600',
  WEIGHT_CAPTURE: 'bg-cyan-500/10 text-cyan-600',
  OVERRIDE: 'bg-amber-500/10 text-amber-600 font-bold',
  ANOMALY_DETECTED: 'bg-destructive/10 text-destructive font-bold',
  VERIFICATION_PASSED: 'bg-green-600/10 text-green-700',
  DISPATCH_APPROVED: 'bg-emerald-500/10 text-emerald-600',
  SECURITY_ALERT: 'bg-destructive/10 text-destructive',
  INCIDENT_ESCALATED: 'bg-rose-500/10 text-rose-600 font-bold',
  LOGIN: 'bg-slate-500/10 text-slate-600',
};

export default function AuditLogs() {
  const { logs, stats, liveStreaming, setLiveStreaming, clearLogs } = useAuditLogs();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !query ||
        log.id.toLowerCase().includes(query) ||
        log.entityId.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query) ||
        log.performedBy.name.toLowerCase().includes(query) ||
        log.performedBy.role.toLowerCase().includes(query);

      const matchesModule = selectedModule === 'all' || log.module === selectedModule;
      const matchesAction = selectedAction === 'all' || log.action === selectedAction;
      const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;

      return matchesSearch && matchesModule && matchesAction && matchesSeverity;
    });
  }, [logs, searchQuery, selectedModule, selectedAction, selectedSeverity]);

  // Export functions
  const handleExportCSV = () => {
    const headers = ['Audit ID', 'Timestamp', 'Module', 'Action', 'Entity ID', 'Operator', 'Role', 'Severity', 'Details', 'Checksum'];
    const rows = filteredLogs.map(l => [
      l.id,
      format(new Date(l.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      l.module,
      l.action,
      `"${l.entityId}"`,
      `"${l.performedBy.name}"`,
      `"${l.performedBy.role}"`,
      l.severity,
      `"${l.details.replace(/"/g, '""')}"`,
      l.metadata?.verifiedHash || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rmc_audit_trail_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Audit Trail Exported',
      description: `Downloaded ${filteredLogs.length} audit records in CSV format`,
    });
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `rmc_audit_trail_${format(new Date(), 'yyyyMMdd_HHmm')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Audit Trail Exported',
      description: `Downloaded ${filteredLogs.length} records in JSON format`,
    });
  };

  const handleInspect = (entry: AuditLogEntry) => {
    setSelectedEntry(entry);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Operational Audit Trail</h1>
            <p className="text-muted-foreground">
              Tamper-evident system logs across Gate, Weighbridge, Dispatch, GPS Tracking & Exit
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Live Streaming Toggle */}
          <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-card">
            <Radio className={`h-4 w-4 ${liveStreaming ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
            <Label htmlFor="live-toggle" className="text-sm font-medium cursor-pointer">
              Live Stream
            </Label>
            <Switch 
              id="live-toggle" 
              checked={liveStreaming} 
              onCheckedChange={setLiveStreaming} 
            />
          </div>

          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <FileText className="h-4 w-4 mr-2" />
            JSON
          </Button>
          <Button variant="ghost" size="sm" onClick={clearLogs} title="Reset to default sample audit log">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Events Recorded</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">Immutable operational log entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.criticalEvents}</div>
            <p className="text-xs text-muted-foreground">Weight breaches & security events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overrides & Anomalies</CardTitle>
            <ShieldCheck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{stats.anomaliesDetected}</div>
            <p className="text-xs text-muted-foreground">Supervisor overrides & tolerance deviations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Integrity</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{stats.systemIntegrity}%</div>
            <p className="text-xs text-muted-foreground">SHA-256 cryptographic verification intact</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search audit ID, entity, operator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger>
                <SelectValue placeholder="All Modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="gate">Gate Inbound / ANPR</SelectItem>
                <SelectItem value="weighbridge">Weighbridge</SelectItem>
                <SelectItem value="loading">Loading Console</SelectItem>
                <SelectItem value="dispatch">Dispatch Approval</SelectItem>
                <SelectItem value="trip">Trip Management</SelectItem>
                <SelectItem value="tracking">Trip Tracking (GPS)</SelectItem>
                <SelectItem value="exit">Exit Verification</SelectItem>
                <SelectItem value="incident">Incident Management</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="ANOMALY_DETECTED">Anomaly Detected</SelectItem>
                <SelectItem value="OVERRIDE">Manual Override</SelectItem>
                <SelectItem value="STATUS_CHANGE">Status Change</SelectItem>
                <SelectItem value="WEIGHT_CAPTURE">Weight Capture</SelectItem>
                <SelectItem value="VERIFICATION_PASSED">Verification Passed</SelectItem>
                <SelectItem value="DISPATCH_APPROVED">Dispatch Approved</SelectItem>
                <SelectItem value="INCIDENT_ESCALATED">Incident Escalated</SelectItem>
                <SelectItem value="CREATE">Create / Batch</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="info">Info / Normal</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Audit Event Feed</CardTitle>
            <CardDescription>
              Showing {filteredLogs.length} of {logs.length} compliance events
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="pb-3 font-medium">Timestamp</th>
                  <th className="pb-3 font-medium">Event ID</th>
                  <th className="pb-3 font-medium">Module</th>
                  <th className="pb-3 font-medium">Action</th>
                  <th className="pb-3 font-medium">Entity</th>
                  <th className="pb-3 font-medium">Performed By</th>
                  <th className="pb-3 font-medium">Severity</th>
                  <th className="pb-3 font-medium text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No audit events found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3.5 pr-4 whitespace-nowrap">
                        <div className="font-mono text-xs text-foreground">
                          {format(new Date(log.timestamp), 'HH:mm:ss')}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {format(new Date(log.timestamp), 'dd MMM yyyy')}
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 font-mono text-xs font-semibold text-primary">
                        {log.id}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${moduleBadgeColors[log.module] || 'bg-muted'}`}>
                          {log.module.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${actionBadgeColors[log.action] || 'bg-muted'}`}>
                          {log.action.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 font-semibold text-foreground">
                        {log.entityId}
                        <div className="text-[11px] font-normal text-muted-foreground">
                          {log.entityType}
                        </div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="font-medium text-foreground">{log.performedBy.name}</div>
                        <div className="text-xs text-muted-foreground">{log.performedBy.role}</div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <Badge 
                          variant={
                            log.severity === 'critical' ? 'destructive' :
                            log.severity === 'warning' ? 'outline' : 'secondary'
                          }
                          className="capitalize text-xs"
                        >
                          {log.severity}
                        </Badge>
                      </td>
                      <td className="py-3.5 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleInspect(log)}
                          className="gap-1.5"
                        >
                          <Eye className="h-4 w-4" />
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Audit Detail Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedEntry && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant={selectedEntry.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {selectedEntry.severity.toUpperCase()}
                  </Badge>
                  <DialogTitle className="font-mono">{selectedEntry.id}</DialogTitle>
                </div>
                <DialogDescription>
                  Detailed audit payload recorded on {format(new Date(selectedEntry.timestamp), 'PPpp')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Description */}
                <div className="p-3 bg-muted/50 rounded-lg border text-sm text-foreground">
                  {selectedEntry.details}
                </div>

                {/* Primary Meta Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 border rounded-lg bg-card">
                    <span className="text-xs text-muted-foreground">Module</span>
                    <div className="font-semibold capitalize">{selectedEntry.module}</div>
                  </div>
                  <div className="p-3 border rounded-lg bg-card">
                    <span className="text-xs text-muted-foreground">Action</span>
                    <div className="font-semibold">{selectedEntry.action}</div>
                  </div>
                  <div className="p-3 border rounded-lg bg-card">
                    <span className="text-xs text-muted-foreground">Entity Target</span>
                    <div className="font-semibold">{selectedEntry.entityId} ({selectedEntry.entityType})</div>
                  </div>
                  <div className="p-3 border rounded-lg bg-card">
                    <span className="text-xs text-muted-foreground">Performed By</span>
                    <div className="font-semibold">{selectedEntry.performedBy.name} ({selectedEntry.performedBy.role})</div>
                  </div>
                </div>

                {/* State Diff */}
                {(selectedEntry.previousState || selectedEntry.newState) && (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-primary" />
                      State Diff (Previous vs. New)
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                        <div className="font-bold text-destructive mb-1">Previous State:</div>
                        <pre className="whitespace-pre-wrap overflow-x-auto">
                          {selectedEntry.previousState ? JSON.stringify(selectedEntry.previousState, null, 2) : 'null (New Record)'}
                        </pre>
                      </div>
                      <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                        <div className="font-bold text-emerald-600 mb-1">New State:</div>
                        <pre className="whitespace-pre-wrap overflow-x-auto">
                          {selectedEntry.newState ? JSON.stringify(selectedEntry.newState, null, 2) : 'null (Deleted)'}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Compliance & Hardware Metadata */}
                <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    Security & Verification Signature
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Terminal / Node: <span className="font-mono">{selectedEntry.metadata?.terminalId || 'GATEWAY-01'}</span></div>
                    <div>Source IP: <span className="font-mono">{selectedEntry.metadata?.ipAddress || '192.168.0.1'}</span></div>
                  </div>
                  <div className="pt-1 border-t text-[11px] font-mono text-muted-foreground break-all">
                    Verification Checksum: <span className="text-foreground">{selectedEntry.metadata?.verifiedHash}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
