import { useState, useEffect } from 'react';
import { CameraDevice } from '@/types/deviceConfig';
import { Plant, DEFAULT_PLANTS } from '@/types/plant';
import { usePlantFtpFolders } from '@/hooks/usePlantFtpFolders';
import { EditDeviceDialog } from '@/components/device/EditDeviceDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Camera, RefreshCw, Wifi, WifiOff, Settings, Plus, LayoutDashboard, Pencil, Factory } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface DeviceListProps {
  devices: CameraDevice[];
  plants?: Plant[];
  selectedPlantId?: string;
  selectedDevice: CameraDevice | null;
  onSelectDevice: (device: CameraDevice) => void;
  onRefresh: () => void;
  onAddDevice?: (device: Omit<CameraDevice, 'lastSeen' | 'status'>) => Promise<void>;
  onUpdateDevice?: (device: CameraDevice) => Promise<void>;
  onToggleDashboard?: (deviceId: string, show: boolean) => Promise<void>;
  isLoading: boolean;
}

export function DeviceList({
  devices,
  plants = DEFAULT_PLANTS,
  selectedPlantId = 'all',
  selectedDevice,
  onSelectDevice,
  onRefresh,
  onAddDevice,
  onUpdateDevice,
  onToggleDashboard,
  isLoading,
}: DeviceListProps) {
  const plantOptions = plants.length > 0 ? plants : DEFAULT_PLANTS;
  const defaultPlantForNew =
    selectedPlantId && selectedPlantId !== 'all'
      ? selectedPlantId
      : (plantOptions[0]?.id || 'PL01');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newModel, setNewModel] = useState('GV-DNC564-MV');
  const [newLocation, setNewLocation] = useState<string>('entry');
  const [newPlantId, setNewPlantId] = useState(defaultPlantForNew);
  const [newIp, setNewIp] = useState('192.168.0.175');
  const [newMac, setNewMac] = useState('AA:BB:CC:DD:EE:05');
  const [newShowOnDashboard, setNewShowOnDashboard] = useState(true);

  const { folders: ftpFolders, plantFolder, loading: loadingFolders } = usePlantFtpFolders(newPlantId, isAddOpen);

  useEffect(() => {
    if (ftpFolders.length > 0 && !ftpFolders.some((f) => f.value === newLocation)) {
      setNewLocation(ftpFolders[0].value);
    }
  }, [ftpFolders, newLocation]);

  // Edit Device State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<CameraDevice | null>(null);

  const getStatusColor = (status: CameraDevice['status']) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'offline':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'configuring':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'error':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getLocationLabel = (location: CameraDevice['location']) => {
    switch (location) {
      case 'entry':
        return 'Entry Gate';
      case 'exit':
        return 'Exit Gate';
      case 'weighbridge':
        return 'Weighbridge';
      default:
        return location;
    }
  };

  const getPlantLabel = (plantId?: string) => {
    const id = plantId && plantId !== 'all' ? plantId : 'PL01';
    const match = plantOptions.find((p) => p.id === id);
    return match ? match.name : id;
  };

  const handleOpenAdd = () => {
    setNewPlantId(defaultPlantForNew);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (dev: CameraDevice, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingDevice(dev);
    setIsEditOpen(true);
  };

  const handleAddSubmit = async () => {
    if (!newName.trim() || !onAddDevice) return;
    const finalId = newId.trim() || `cam_${Date.now().toString(36)}`;
    await onAddDevice({
      id: finalId,
      name: newName.trim(),
      model: newModel.trim() || 'GV-DNC564-MV',
      location: newLocation,
      plantId: newPlantId,
      ipAddress: newIp.trim() || '192.168.0.175',
      macAddress: newMac.trim() || 'AA:BB:CC:DD:EE:05',
      firmware: '2.3.1',
      showOnDashboard: newShowOnDashboard,
    });
    setIsAddOpen(false);
    setNewId('');
    setNewName('');
    setNewShowOnDashboard(true);
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" />
            ANPR Cameras
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {onAddDevice && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={handleOpenAdd}
                title="Register New Camera"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh Camera Status"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {devices.map((device) => (
            <div
              key={device.id}
              onClick={() => onSelectDevice(device)}
              className={cn(
                "p-3.5 rounded-lg border cursor-pointer transition-all duration-200",
                "hover:border-primary/50 hover:bg-accent/50",
                selectedDevice?.id === device.id
                  ? "border-primary bg-accent"
                  : "border-border bg-card"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  {device.status === 'online' ? (
                    <Wifi className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="font-medium text-foreground text-sm truncate">{device.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {onUpdateDevice && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted"
                      onClick={(e) => handleOpenEdit(device, e)}
                      title="Edit Camera Configuration"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                  <Badge className={getStatusColor(device.status)}>
                    {device.status}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between gap-2">
                  <span className="flex items-center gap-1 shrink-0">
                    <Factory className="h-3 w-3 text-amber-400/80" /> Plant:
                  </span>
                  <span className="text-foreground truncate text-right" title={getPlantLabel(device.plantId)}>
                    {getPlantLabel(device.plantId)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Model:</span>
                  <span className="text-foreground">{device.model}</span>
                </div>
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span className="text-foreground">{getLocationLabel(device.location)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IP Address:</span>
                  <span className="font-mono text-foreground">{device.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span>Firmware:</span>
                  <span className="text-foreground">v{device.firmware}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Seen:</span>
                  <span className="text-foreground">
                    {formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-border/40">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <LayoutDashboard className="h-3 w-3 text-primary/70" /> Dashboard:
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleDashboard?.(device.id, !(device.showOnDashboard !== false));
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                      device.showOnDashboard !== false
                        ? 'border-sky-500/40 text-sky-400 bg-sky-950/30 hover:bg-sky-900/50'
                        : 'border-border text-muted-foreground bg-muted/40 hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    {device.showOnDashboard !== false ? '● Visible on Wall' : '+ Add to Wall'}
                  </button>
                </div>
              </div>

              {selectedDevice?.id === device.id && (
                <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-center">
                  <Settings className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  <span className="text-xs text-primary font-medium">Configuring</span>
                </div>
              )}
            </div>
          ))}

          {devices.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Camera className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">
                {selectedPlantId !== 'all' ? 'No cameras in this plant' : 'No devices found'}
              </p>
              <p className="text-xs">Click refresh or + to register a camera</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Camera Modal Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register New ANPR Camera</DialogTitle>
            <DialogDescription>
              Connect an RTSP/ONVIF camera to the gate surveillance network.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label htmlFor="cam-name" className="text-xs">Camera Name *</Label>
              <Input
                id="cam-name"
                placeholder="e.g. Exit Gate Bay 2"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Assigned Plant *</Label>
              <Select value={newPlantId} onValueChange={setNewPlantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Plant" />
                </SelectTrigger>
                <SelectContent>
                  {plantOptions.map((plant) => (
                    <SelectItem key={plant.id} value={plant.id}>
                      {plant.name} ({plant.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cam-id" className="text-xs">Device ID</Label>
                <Input
                  id="cam-id"
                  placeholder="cam_exit_2"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Location (FTP Folder) *</Label>
                <Select value={newLocation} onValueChange={setNewLocation} disabled={loadingFolders}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingFolders ? 'Loading FTP folders...' : 'Select Location Folder'} />
                  </SelectTrigger>
                  <SelectContent>
                    {ftpFolders.map((folder) => (
                      <SelectItem key={folder.value} value={folder.value}>
                        {folder.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {plantFolder && (
              <div className="px-2.5 py-1.5 rounded bg-muted/50 border border-border/60 text-[11px] font-mono text-muted-foreground truncate">
                FTP Folder: /{plantFolder}/{ftpFolders.find((f) => f.value === newLocation)?.folderName || 'Entry Gate'}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cam-ip" className="text-xs">IP Address *</Label>
                <Input
                  id="cam-ip"
                  placeholder="192.168.0.175"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="cam-mac" className="text-xs">MAC Address</Label>
                <Input
                  id="cam-mac"
                  placeholder="AA:BB:CC:DD:EE:05"
                  value={newMac}
                  onChange={(e) => setNewMac(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="cam-model" className="text-xs">Camera Model</Label>
              <Input
                id="cam-model"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-accent/30">
              <div className="space-y-0.5">
                <Label htmlFor="cam-dashboard" className="text-xs font-semibold flex items-center gap-1.5">
                  <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
                  Add to Operations Dashboard
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Stream live on the real-time CCTV surveillance wall
                </p>
              </div>
              <Switch
                id="cam-dashboard"
                checked={newShowOnDashboard}
                onCheckedChange={setNewShowOnDashboard}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSubmit} disabled={!newName.trim()}>
              Save Camera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Camera Modal Dialog */}
      {onUpdateDevice && (
        <EditDeviceDialog
          device={editingDevice}
          plants={plantOptions}
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setEditingDevice(null);
          }}
          onSave={onUpdateDevice}
        />
      )}
    </>
  );
}
