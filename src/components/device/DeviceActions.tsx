import { CameraDevice } from '@/types/deviceConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Power, 
  RefreshCw, 
  ExternalLink, 
  Download, 
  Loader2,
  Cpu,
  HardDrive,
  Thermometer,
  Clock,
  LayoutDashboard,
  Pencil
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DeviceActionsProps {
  device: CameraDevice;
  plantName?: string;
  onReboot: () => Promise<void>;
  onExportConfig?: (device: CameraDevice) => void;
  onDeleteDevice?: (deviceId: string) => void;
  onToggleDashboard?: (deviceId: string, show: boolean) => Promise<void>;
  onEditDevice?: (device: CameraDevice) => void;
  isLoading: boolean;
}

export function DeviceActions({
  device,
  plantName,
  onReboot,
  onExportConfig,
  onDeleteDevice,
  onToggleDashboard,
  onEditDevice,
  isLoading,
}: DeviceActionsProps) {
  const handleOpenWebUI = () => {
    window.open(`http://${device.ipAddress}`, '_blank');
  };

  // Mock system stats
  const systemStats = {
    cpuUsage: 35,
    memoryUsage: 42,
    temperature: 48,
    uptime: '5d 12h 34m',
    storageUsed: 68,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Power className="h-5 w-5" />
            Device Control
          </span>
          <Badge 
            variant={device.status === 'online' ? 'default' : 'destructive'}
            className={device.status === 'online' ? 'bg-emerald-500/20 text-emerald-400' : ''}
          >
            {device.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* System Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-accent/50">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Cpu className="h-3 w-3" />
              CPU Usage
            </div>
            <div className="text-lg font-semibold">{systemStats.cpuUsage}%</div>
          </div>
          <div className="p-3 rounded-lg bg-accent/50">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <HardDrive className="h-3 w-3" />
              Memory
            </div>
            <div className="text-lg font-semibold">{systemStats.memoryUsage}%</div>
          </div>
          <div className="p-3 rounded-lg bg-accent/50">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Thermometer className="h-3 w-3" />
              Temperature
            </div>
            <div className="text-lg font-semibold">{systemStats.temperature}°C</div>
          </div>
          <div className="p-3 rounded-lg bg-accent/50">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock className="h-3 w-3" />
              Uptime
            </div>
            <div className="text-lg font-semibold">{systemStats.uptime}</div>
          </div>
        </div>

        {/* Storage Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">SD Card Storage</span>
            <span>{systemStats.storageUsed}% used</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${systemStats.storageUsed}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            87.04 GB / 128 GB
          </p>
        </div>

        {/* Device Info */}
        <div className="space-y-2 pt-4 border-t border-border">
          <div className="flex justify-between text-sm gap-2">
            <span className="text-muted-foreground shrink-0">Plant</span>
            <span className="font-medium text-right truncate" title={plantName || device.plantId || 'PL01'}>
              {plantName || device.plantId || 'PL01'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Model</span>
            <span className="font-medium">{device.model}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Firmware</span>
            <span className="font-mono">v{device.firmware}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">MAC Address</span>
            <span className="font-mono text-xs">{device.macAddress}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last Seen</span>
            <span>{formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleOpenWebUI}
            className="w-full"
            disabled={device.status !== 'online'}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Camera Web UI
          </Button>

          {onEditDevice && (
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-primary/40 hover:bg-primary/10 text-primary"
              onClick={() => onEditDevice(device)}
              disabled={isLoading}
            >
              <Pencil className="h-4 w-4" />
              <span>Edit Device Configuration</span>
            </Button>
          )}

          {onToggleDashboard && (
            <Button
              variant="outline"
              className={`w-full flex items-center justify-center gap-2 ${
                device.showOnDashboard !== false
                  ? 'border-sky-500/40 bg-sky-950/20 text-sky-400 hover:bg-sky-900/30'
                  : 'border-border text-foreground hover:bg-accent'
              }`}
              onClick={() => onToggleDashboard(device.id, !(device.showOnDashboard !== false))}
              disabled={isLoading}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>
                {device.showOnDashboard !== false
                  ? 'Remove from Operations Dashboard'
                  : 'Pin to Operations Dashboard'}
              </span>
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={onReboot}
            disabled={isLoading || device.status !== 'online'}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Reboot Device
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => onExportConfig?.(device)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Configuration
          </Button>

          {onDeleteDevice && (
            <Button
              variant="ghost"
              className="w-full text-destructive hover:bg-destructive/10"
              onClick={() => onDeleteDevice(device.id)}
            >
              Remove Device
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
