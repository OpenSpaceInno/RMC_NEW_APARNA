import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RouteAssignment } from "@/types/dispatch";
import RouteMapAssignment from "./RouteMapAssignment";
import { MapPin, Navigation, Clock, User, Phone, Map } from "lucide-react";

interface RouteAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (route: RouteAssignment) => void;
  vehicleRegNo?: string;
  orderNumber?: string;
}

const RouteAssignmentDialog = ({ 
  open, 
  onOpenChange, 
  onAssign,
  vehicleRegNo = "",
  orderNumber = ""
}: RouteAssignmentDialogProps) => {
  const [routeData, setRouteData] = useState({
    destination: "",
    distance: "",
    estimatedTime: "",
    driver: "",
    driverPhone: "",
  });

  const handleQuickAssign = () => {
    const route: RouteAssignment = {
      routeId: `route-${Date.now()}`,
      destination: routeData.destination,
      distance: parseFloat(routeData.distance),
      estimatedTime: parseFloat(routeData.estimatedTime),
      driver: routeData.driver,
      driverPhone: routeData.driverPhone,
    };

    onAssign(route);
    onOpenChange(false);
    
    // Reset form
    setRouteData({
      destination: "",
      distance: "",
      estimatedTime: "",
      driver: "",
      driverPhone: "",
    });
  };

  const handleMapAssign = (routeDataFromMap: any) => {
    onAssign(routeDataFromMap);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Assign Route {vehicleRegNo && `- ${vehicleRegNo}`}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="map" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="map" className="gap-2">
              <Map className="h-4 w-4" />
              Map View
            </TabsTrigger>
            <TabsTrigger value="quick" className="gap-2">
              <Navigation className="h-4 w-4" />
              Quick Assign
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map">
            <RouteMapAssignment
              vehicleRegNo={vehicleRegNo}
              orderNumber={orderNumber}
              origin="Plant A - Warehouse 1"
              destination="Construction Site, Downtown"
              onAssign={handleMapAssign}
            />
          </TabsContent>

          <TabsContent value="quick" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="destination" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Destination
              </Label>
              <Input
                id="destination"
                placeholder="e.g., Construction Site, Sector 5"
                value={routeData.destination}
                onChange={(e) => setRouteData({ ...routeData, destination: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="distance" className="flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  Distance (km)
                </Label>
                <Input
                  id="distance"
                  type="number"
                  placeholder="45"
                  value={routeData.distance}
                  onChange={(e) => setRouteData({ ...routeData, distance: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Est. Time (hours)
                </Label>
                <Input
                  id="time"
                  type="number"
                  step="0.1"
                  placeholder="2.5"
                  value={routeData.estimatedTime}
                  onChange={(e) => setRouteData({ ...routeData, estimatedTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Driver Name
              </Label>
              <Input
                id="driver"
                placeholder="e.g., Rajesh Kumar"
                value={routeData.driver}
                onChange={(e) => setRouteData({ ...routeData, driver: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Driver Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91-9876543210"
                value={routeData.driverPhone}
                onChange={(e) => setRouteData({ ...routeData, driverPhone: e.target.value })}
              />
            </div>

            <Button onClick={handleQuickAssign} className="w-full">
              Assign Route
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default RouteAssignmentDialog;
