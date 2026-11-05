import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Bell, 
  BellOff, 
  CheckCircle,
  Circle,
  AlertTriangle,
  Settings2,
  ArrowRightCircle,
  ArrowLeftCircle
} from "lucide-react";
import { Geofence, GeofenceAlert } from "@/types/gps";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface GeofenceManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  geofences: Geofence[];
  alerts: GeofenceAlert[];
  onCreateGeofence: (geofence: Omit<Geofence, 'id' | 'createdAt'>) => void;
  onUpdateGeofence: (id: string, updates: Partial<Geofence>) => void;
  onDeleteGeofence: (id: string) => void;
  onAcknowledgeAlert: (alertId: string) => void;
  onAcknowledgeAllAlerts: () => void;
}

const GeofenceManager = ({
  open,
  onOpenChange,
  geofences,
  alerts,
  onCreateGeofence,
  onUpdateGeofence,
  onDeleteGeofence,
  onAcknowledgeAlert,
  onAcknowledgeAllAlerts,
}: GeofenceManagerProps) => {
  const [activeTab, setActiveTab] = useState("geofences");
  const [isCreating, setIsCreating] = useState(false);
  const [newGeofence, setNewGeofence] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radius: '500',
    alertOnEntry: true,
    alertOnExit: true,
    color: '#3b82f6',
  });

  const unacknowledgedCount = alerts.filter(a => !a.isAcknowledged).length;

  const handleCreate = () => {
    if (!newGeofence.name || !newGeofence.latitude || !newGeofence.longitude) return;

    onCreateGeofence({
      name: newGeofence.name,
      type: 'circle',
      center: {
        latitude: parseFloat(newGeofence.latitude),
        longitude: parseFloat(newGeofence.longitude),
      },
      radius: parseInt(newGeofence.radius),
      color: newGeofence.color,
      alertOnEntry: newGeofence.alertOnEntry,
      alertOnExit: newGeofence.alertOnExit,
      isActive: true,
      linkedTripIds: [],
    });

    setNewGeofence({
      name: '',
      latitude: '',
      longitude: '',
      radius: '500',
      alertOnEntry: true,
      alertOnExit: true,
      color: '#3b82f6',
    });
    setIsCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Geofence Management
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="geofences" className="flex items-center gap-2">
              <Circle className="h-4 w-4" />
              Geofences ({geofences.length})
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alerts
              {unacknowledgedCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unacknowledgedCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geofences" className="mt-4">
            <div className="space-y-4">
              {!isCreating ? (
                <Button onClick={() => setIsCreating(true)} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Geofence
                </Button>
              ) : (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">New Geofence</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label>Name</Label>
                        <Input
                          value={newGeofence.name}
                          onChange={(e) => setNewGeofence(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Warehouse Zone"
                        />
                      </div>
                      <div>
                        <Label>Center Latitude</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          value={newGeofence.latitude}
                          onChange={(e) => setNewGeofence(prev => ({ ...prev, latitude: e.target.value }))}
                          placeholder="19.0760"
                        />
                      </div>
                      <div>
                        <Label>Center Longitude</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          value={newGeofence.longitude}
                          onChange={(e) => setNewGeofence(prev => ({ ...prev, longitude: e.target.value }))}
                          placeholder="72.8777"
                        />
                      </div>
                      <div>
                        <Label>Radius (meters)</Label>
                        <Input
                          type="number"
                          value={newGeofence.radius}
                          onChange={(e) => setNewGeofence(prev => ({ ...prev, radius: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Color</Label>
                        <Input
                          type="color"
                          value={newGeofence.color}
                          onChange={(e) => setNewGeofence(prev => ({ ...prev, color: e.target.value }))}
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={newGeofence.alertOnEntry}
                          onCheckedChange={(checked) => setNewGeofence(prev => ({ ...prev, alertOnEntry: checked }))}
                        />
                        <Label>Alert on Entry</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={newGeofence.alertOnExit}
                          onCheckedChange={(checked) => setNewGeofence(prev => ({ ...prev, alertOnExit: checked }))}
                        />
                        <Label>Alert on Exit</Label>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleCreate} disabled={!newGeofence.name || !newGeofence.latitude || !newGeofence.longitude}>
                        Create Geofence
                      </Button>
                      <Button variant="outline" onClick={() => setIsCreating(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {geofences.map(geofence => (
                    <Card key={geofence.id} className="relative">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full border-2"
                              style={{ backgroundColor: geofence.color, borderColor: geofence.color }}
                            />
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {geofence.name}
                                <Badge variant={geofence.isActive ? 'default' : 'secondary'}>
                                  {geofence.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {geofence.type === 'circle' && geofence.center && (
                                  <>
                                    {geofence.center.latitude.toFixed(4)}, {geofence.center.longitude.toFixed(4)} • {geofence.radius}m radius
                                  </>
                                )}
                              </div>
                              <div className="flex gap-2 mt-1">
                                {geofence.alertOnEntry && (
                                  <Badge variant="outline" className="text-xs">
                                    <ArrowRightCircle className="h-3 w-3 mr-1" />
                                    Entry
                                  </Badge>
                                )}
                                {geofence.alertOnExit && (
                                  <Badge variant="outline" className="text-xs">
                                    <ArrowLeftCircle className="h-3 w-3 mr-1" />
                                    Exit
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onUpdateGeofence(geofence.id, { isActive: !geofence.isActive })}
                            >
                              {geofence.isActive ? (
                                <BellOff className="h-4 w-4" />
                              ) : (
                                <Bell className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => onDeleteGeofence(geofence.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {geofences.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No geofences configured</p>
                      <p className="text-sm">Create one to start monitoring zones</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="mt-4">
            <div className="space-y-4">
              {unacknowledgedCount > 0 && (
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {unacknowledgedCount} unacknowledged alert{unacknowledgedCount !== 1 ? 's' : ''}
                  </p>
                  <Button variant="outline" size="sm" onClick={onAcknowledgeAllAlerts}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Acknowledge All
                  </Button>
                </div>
              )}

              <ScrollArea className="h-[450px]">
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <Card
                      key={alert.id}
                      className={cn(
                        "transition-colors",
                        !alert.isAcknowledged && "border-destructive/50 bg-destructive/5"
                      )}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "p-2 rounded-full",
                              alert.eventType === 'entry' ? 'bg-green-500/10' : 'bg-amber-500/10'
                            )}>
                              {alert.eventType === 'entry' ? (
                                <ArrowRightCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <ArrowLeftCircle className="h-4 w-4 text-amber-500" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {alert.vehicleRegNo}
                                <Badge variant={alert.eventType === 'entry' ? 'default' : 'secondary'}>
                                  {alert.eventType === 'entry' ? 'Entered' : 'Exited'}
                                </Badge>
                                {!alert.isAcknowledged && (
                                  <Badge variant="destructive">New</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {alert.geofenceName}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Trip: {alert.tripNumber} • Driver: {alert.driverName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(alert.timestamp), 'PPpp')}
                              </div>
                            </div>
                          </div>
                          {!alert.isAcknowledged && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onAcknowledgeAlert(alert.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Acknowledge
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {alerts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No alerts</p>
                      <p className="text-sm">Alerts will appear when vehicles enter or exit geofences</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default GeofenceManager;
