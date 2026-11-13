import React, { useState, useEffect } from 'react';
import { CameraDevice } from '@/types/deviceConfig';
import { Plant, DEFAULT_PLANTS } from '@/types/plant';
import { usePlantFtpFolders } from '@/hooks/usePlantFtpFolders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Pencil, LayoutDashboard } from 'lucide-react';

interface EditDeviceDialogProps {
  device: CameraDevice | null;
  plants?: Plant[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (device: CameraDevice) => Promise<void>;
}

export function EditDeviceDialog({
  device,
  plants = DEFAULT_PLANTS,
  isOpen,
  onClose,
  onSave,
}: EditDeviceDialogProps) {
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [location, setLocation] = useState<string>('entry');
  const [plantId, setPlantId] = useState('PL01');
  const [ipAddress, setIpAddress] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [firmware, setFirmware] = useState('');
  const [showOnDashboard, setShowOnDashboard] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { folders: ftpFolders, plantFolder, loading: loadingFolders } = usePlantFtpFolders(plantId, isOpen);

  useEffect(() => {
    if (ftpFolders.length > 0 && !ftpFolders.some((f) => f.value === location)) {
      setLocation(ftpFolders[0].value);
    }
  }, [ftpFolders, location]);

  const plantOptions = plants.length > 0 ? plants : DEFAULT_PLANTS;

  const defaultPlantId = plantOptions[0]?.id || 'PL01';

  useEffect(() => {
    if (device) {
      setName(device.name || '');
      setModel(device.model || 'GV-DNC564-MV');
      setLocation(device.location || 'entry');
      setPlantId(device.plantId && device.plantId !== 'all' ? device.plantId : defaultPlantId);
      setIpAddress(device.ipAddress || '');
      setMacAddress(device.macAddress || '');
      setFirmware(device.firmware || '2.3.1');
      setShowOnDashboard(device.showOnDashboard !== false);
    }
  }, [device, isOpen, defaultPlantId]);

  const handleSubmit = async () => {
    if (!device || !name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSave({
        ...device,
        name: name.trim(),
        model: model.trim() || device.model,
        location,
        plantId,
        ipAddress: ipAddress.trim() || device.ipAddress,
        macAddress: macAddress.trim() || device.macAddress,
        firmware: firmware.trim() || device.firmware,
        showOnDashboard,
      });
      onClose();
    } catch (e) {
      console.error('Failed to save device updates:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" />
            Edit Camera Configuration
          </DialogTitle>
          <DialogDescription>
            Update hardware parameters, location, and operations dashboard visibility.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-2">
          <div className="space-y-1">
            <Label htmlFor="dlg-cam-id" className="text-xs text-muted-foreground">
              Device Identifier (Read-Only)
            </Label>
            <Input
              id="dlg-cam-id"
              value={device?.id || ''}
              disabled
              className="bg-muted/50 font-mono text-xs cursor-not-allowed"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="dlg-cam-name" className="text-xs font-medium">
              Camera Name *
            </Label>
            <Input
              id="dlg-cam-name"
              placeholder="e.g. Weighbridge Bay 2 ANPR"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">Assigned Plant</Label>
            <Select value={plantId} onValueChange={setPlantId}>
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
              <Label className="text-xs font-medium">Location (FTP Folder)</Label>
              <Select value={location} onValueChange={setLocation} disabled={loadingFolders}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingFolders ? 'Loading...' : 'Select Location Folder'} />
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

            <div className="space-y-1">
              <Label htmlFor="dlg-cam-model" className="text-xs">Camera Model</Label>
              <Input
                id="dlg-cam-model"
                placeholder="GV-DNC564-MV"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>
          </div>

          {plantFolder && (
            <div className="px-2.5 py-1.5 rounded bg-muted/50 border border-border/60 text-[11px] font-mono text-muted-foreground truncate">
              FTP Folder: /{plantFolder}/{ftpFolders.find((f) => f.value === location)?.folderName || 'Entry Gate'}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="dlg-cam-ip" className="text-xs font-medium">IP Address *</Label>
              <Input
                id="dlg-cam-ip"
                placeholder="192.168.0.101"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="dlg-cam-mac" className="text-xs">MAC Address</Label>
              <Input
                id="dlg-cam-mac"
                placeholder="AA:BB:CC:DD:EE:05"
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="dlg-cam-firmware" className="text-xs">Firmware Version</Label>
            <Input
              id="dlg-cam-firmware"
              placeholder="e.g. 2.3.1"
              value={firmware}
              onChange={(e) => setFirmware(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-accent/30">
            <div className="space-y-0.5">
              <Label htmlFor="dlg-cam-dashboard" className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
                Show on Operations Dashboard
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Stream live feed on the real-time CCTV surveillance wall
              </p>
            </div>
            <Switch
              id="dlg-cam-dashboard"
              checked={showOnDashboard}
              onCheckedChange={setShowOnDashboard}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
