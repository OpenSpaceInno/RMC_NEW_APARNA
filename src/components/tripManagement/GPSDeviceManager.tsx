import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Satellite, 
  Plus, 
  Trash2, 
  Wifi,
  WifiOff,
  Settings,
  RefreshCw,
  Check,
  X,
  Radio,
  Webhook,
  Loader2,
  Copy,
  ExternalLink
} from "lucide-react";
import { GPSDevice } from "@/types/gps";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface GPSDeviceManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devices: GPSDevice[];
  isConnecting: boolean;
  onRegisterDevice: (device: Omit<GPSDevice, 'id' | 'status' | 'lastSeen'>) => Promise<GPSDevice>;
  onDeleteDevice: (deviceId: string) => void;
  onTestConnection: (deviceId: string) => Promise<boolean>;
}

const GPSDeviceManager = ({
  open,
  onOpenChange,
  devices,
  isConnecting,
  onRegisterDevice,
  onDeleteDevice,
  onTestConnection,
}: GPSDeviceManagerProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("devices");
  const [isAdding, setIsAdding] = useState(false);
  const [testingDeviceId, setTestingDeviceId] = useState<string | null>(null);
  const [newDevice, setNewDevice] = useState({
    deviceId: '',
    name: '',
    type: 'traccar' as GPSDevice['type'],
    apiUrl: '',
    apiKey: '',
    updateInterval: '30',
  });

  const webhookUrl = `${window.location.origin}/api/gps/webhook`;

  const handleAddDevice = async () => {
    if (!newDevice.deviceId || !newDevice.name) return;

    await onRegisterDevice({
      deviceId: newDevice.deviceId,
      name: newDevice.name,
      type: newDevice.type,
      configuration: {
        apiUrl: newDevice.apiUrl || undefined,
        apiKey: newDevice.apiKey || undefined,
        updateInterval: parseInt(newDevice.updateInterval),
      },
    });

    setNewDevice({
      deviceId: '',
      name: '',
      type: 'traccar',
      apiUrl: '',
      apiKey: '',
      updateInterval: '30',
    });
    setIsAdding(false);
  };

  const handleTestConnection = async (deviceId: string) => {
    setTestingDeviceId(deviceId);
    await onTestConnection(deviceId);
    setTestingDeviceId(null);
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: 'Copied',
      description: 'Webhook URL copied to clipboard',
    });
  };

  const getStatusIcon = (status: GPSDevice['status']) => {
    switch (status) {
      case 'online': return <Wifi className="h-4 w-4 text-green-500" />;
      case 'idle': return <Radio className="h-4 w-4 text-amber-500" />;
      case 'offline': return <WifiOff className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeIcon = (type: GPSDevice['type']) => {
    switch (type) {
      case 'traccar': return <Satellite className="h-4 w-4" />;
      case 'webhook': return <Webhook className="h-4 w-4" />;
      case 'manual': return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Satellite className="h-5 w-5 text-primary" />
            GPS Device Management
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="devices">
              Devices ({devices.length})
            </TabsTrigger>
            <TabsTrigger value="webhook">
              Webhook Integration
            </TabsTrigger>
            <TabsTrigger value="traccar">
              Traccar Setup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="mt-4">
            <div className="space-y-4">
              {!isAdding ? (
                <Button onClick={() => setIsAdding(true)} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Register New Device
                </Button>
              ) : (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">New GPS Device</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Device ID</Label>
                        <Input
                          value={newDevice.deviceId}
                          onChange={(e) => setNewDevice(prev => ({ ...prev, deviceId: e.target.value }))}
                          placeholder="GPS-001"
                        />
                      </div>
                      <div>
                        <Label>Device Name</Label>
                        <Input
                          value={newDevice.name}
                          onChange={(e) => setNewDevice(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Tracker Alpha"
                        />
                      </div>
                      <div>
                        <Label>Device Type</Label>
                        <Select
                          value={newDevice.type}
                          onValueChange={(value) => setNewDevice(prev => ({ ...prev, type: value as GPSDevice['type'] }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="traccar">Traccar</SelectItem>
                            <SelectItem value="webhook">Webhook</SelectItem>
                            <SelectItem value="manual">Manual Entry</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Update Interval (sec)</Label>
                        <Input
                          type="number"
                          value={newDevice.updateInterval}
                          onChange={(e) => setNewDevice(prev => ({ ...prev, updateInterval: e.target.value }))}
                        />
                      </div>
                      {newDevice.type === 'traccar' && (
                        <>
                          <div className="col-span-2">
                            <Label>Traccar API URL</Label>
                            <Input
                              value={newDevice.apiUrl}
                              onChange={(e) => setNewDevice(prev => ({ ...prev, apiUrl: e.target.value }))}
                              placeholder="https://your-traccar-server.com"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleAddDevice} disabled={!newDevice.deviceId || !newDevice.name || isConnecting}>
                        {isConnecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Register Device
                      </Button>
                      <Button variant="outline" onClick={() => setIsAdding(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {devices.map(device => (
                    <Card key={device.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-full",
                              device.status === 'online' ? 'bg-green-500/10' : 
                              device.status === 'idle' ? 'bg-amber-500/10' : 'bg-muted'
                            )}>
                              {getTypeIcon(device.type)}
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {device.name}
                                {getStatusIcon(device.status)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                ID: {device.deviceId} • {device.type.charAt(0).toUpperCase() + device.type.slice(1)}
                              </div>
                              {device.lastSeen && (
                                <div className="text-xs text-muted-foreground">
                                  Last seen: {format(new Date(device.lastSeen), 'PPpp')}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTestConnection(device.id)}
                              disabled={testingDeviceId === device.id}
                            >
                              {testingDeviceId === device.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => onDeleteDevice(device.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {devices.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Satellite className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No GPS devices registered</p>
                      <p className="text-sm">Register a device to start tracking</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="webhook" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Webhook className="h-4 w-4" />
                  Webhook Endpoint
                </CardTitle>
                <CardDescription>
                  Configure your GPS device to send position updates to this URL
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">Expected Payload Format</h4>
                  <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`{
  "deviceId": "GPS-001",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "speed": 45,
  "heading": 180,
  "timestamp": "2024-01-01T12:00:00Z",
  "tripId": "trip-001" // optional
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Include the following header in your webhook requests:
                </p>
                <pre className="text-xs bg-muted p-3 rounded mt-2">
                  X-Webhook-Secret: your-webhook-secret
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="traccar" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Satellite className="h-4 w-4" />
                  Traccar Integration
                </CardTitle>
                <CardDescription>
                  Connect to your Traccar GPS tracking server
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border-l-4 border-primary bg-primary/5 rounded">
                  <h4 className="font-medium">Prerequisites</h4>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                    <li>A running Traccar server instance</li>
                    <li>API access enabled on your Traccar server</li>
                    <li>Valid authentication credentials</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Traccar Server URL</Label>
                    <Input placeholder="https://your-traccar-server.com" />
                  </div>
                  <div>
                    <Label>Username</Label>
                    <Input placeholder="admin@example.com" />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                </div>

                <Button className="w-full" disabled={isConnecting}>
                  {isConnecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Connect to Traccar
                </Button>

                <div className="text-center">
                  <a 
                    href="https://www.traccar.org/documentation/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Traccar Documentation
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default GPSDeviceManager;
