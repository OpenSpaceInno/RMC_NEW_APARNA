import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Clock, Truck } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface RoutePoint {
  name: string;
  lat: number;
  lng: number;
}

interface RouteMapAssignmentProps {
  vehicleRegNo: string;
  orderNumber: string;
  origin: string;
  destination: string;
  onAssign: (routeData: any) => void;
}

const RouteMapAssignment = ({ 
  vehicleRegNo, 
  orderNumber, 
  origin, 
  destination,
  onAssign 
}: RouteMapAssignmentProps) => {
  const { toast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);
  
  const [waypoints, setWaypoints] = useState<RoutePoint[]>([
    { name: origin, lat: 19.0760, lng: 72.8777 },
    { name: destination, lat: 19.2183, lng: 72.9781 },
  ]);
  const [newWaypoint, setNewWaypoint] = useState({ name: '', lat: '', lng: '' });
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const mapCenter: [number, number] = [
      (waypoints[0].lat + waypoints[waypoints.length - 1].lat) / 2,
      (waypoints[0].lng + waypoints[waypoints.length - 1].lng) / 2,
    ];

    mapRef.current = L.map(mapContainerRef.current).setView(mapCenter, 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers and polyline when waypoints change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers and polyline
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    // Add polyline
    const routeCoordinates: [number, number][] = waypoints.map(wp => [wp.lat, wp.lng]);
    polylineRef.current = L.polyline(routeCoordinates, {
      color: '#3b82f6',
      weight: 4,
      opacity: 0.7
    }).addTo(mapRef.current);

    // Add markers
    waypoints.forEach((waypoint, index) => {
      const marker = L.marker([waypoint.lat, waypoint.lng]).addTo(mapRef.current!);
      marker.bindPopup(`
        <div style="font-size: 14px;">
          <p style="font-weight: 600; margin: 0 0 4px 0;">${waypoint.name}</p>
          <p style="font-size: 12px; color: #666; margin: 0;">
            ${index === 0 ? 'Origin' : index === waypoints.length - 1 ? 'Destination' : 'Waypoint'}
          </p>
        </div>
      `);
      markersRef.current.push(marker);
    });

    // Fit bounds
    if (routeCoordinates.length > 0) {
      const bounds = L.latLngBounds(routeCoordinates);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [waypoints]);

  const addWaypoint = () => {
    if (newWaypoint.name && newWaypoint.lat && newWaypoint.lng) {
      const insertIndex = waypoints.length - 1; // Insert before destination
      const updated = [...waypoints];
      updated.splice(insertIndex, 0, {
        name: newWaypoint.name,
        lat: parseFloat(newWaypoint.lat),
        lng: parseFloat(newWaypoint.lng),
      });
      setWaypoints(updated);
      setNewWaypoint({ name: '', lat: '', lng: '' });
      
      toast({
        title: "Waypoint added",
        description: `${newWaypoint.name} added to route`,
      });
    }
  };

  const removeWaypoint = (index: number) => {
    if (index === 0 || index === waypoints.length - 1) return; // Can't remove origin or destination
    const updated = waypoints.filter((_, i) => i !== index);
    setWaypoints(updated);
  };

  const calculateDistance = () => {
    // Rough calculation using Haversine formula
    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const R = 6371; // Earth's radius in km
      const dLat = (waypoints[i + 1].lat - waypoints[i].lat) * Math.PI / 180;
      const dLon = (waypoints[i + 1].lng - waypoints[i].lng) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(waypoints[i].lat * Math.PI / 180) *
        Math.cos(waypoints[i + 1].lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }
    return totalDistance.toFixed(2);
  };

  const calculateETA = () => {
    const distance = parseFloat(calculateDistance());
    const avgSpeed = 40; // km/h
    const hours = distance / avgSpeed;
    return hours.toFixed(1);
  };

  const handleAssignRoute = () => {
    if (!driverName || !driverPhone) {
      toast({
        title: "Missing information",
        description: "Please provide driver name and phone number",
        variant: "destructive",
      });
      return;
    }

    const routeData = {
      routeId: `route-${Date.now()}`,
      destination: waypoints[waypoints.length - 1].name,
      distance: parseFloat(calculateDistance()),
      estimatedTime: parseFloat(calculateETA()),
      driver: driverName,
      driverPhone: driverPhone,
      waypoints: waypoints.map((wp, index) => ({
        id: `wp-${index}`,
        name: wp.name,
        location: {
          latitude: wp.lat,
          longitude: wp.lng,
          timestamp: new Date().toISOString(),
          speed: 0,
          heading: 0,
        },
        eta: new Date(Date.now() + (index + 1) * 30 * 60 * 1000).toISOString(),
        reached: false,
      })),
    };

    onAssign(routeData);
    
    toast({
      title: "Route assigned",
      description: `Route assigned to ${vehicleRegNo} with driver ${driverName}`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Route Assignment
          </CardTitle>
          <CardDescription>
            Plan and assign route for {vehicleRegNo} - Order {orderNumber}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Map */}
          <div className="h-[400px] rounded-lg overflow-hidden border border-border">
            <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
          </div>

          <Separator />

          {/* Route Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Navigation className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Distance</p>
                <p className="text-lg font-semibold">{calculateDistance()} km</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Time</p>
                <p className="text-lg font-semibold">{calculateETA()} hours</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Waypoints List */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Route Waypoints
            </h4>
            <div className="space-y-2">
              {waypoints.map((waypoint, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={index === 0 ? "default" : index === waypoints.length - 1 ? "secondary" : "outline"}>
                      {index === 0 ? 'Start' : index === waypoints.length - 1 ? 'End' : `Stop ${index}`}
                    </Badge>
                    <div>
                      <p className="font-medium">{waypoint.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {waypoint.lat.toFixed(4)}, {waypoint.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  {index !== 0 && index !== waypoints.length - 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWaypoint(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add Waypoint */}
          <div className="space-y-3">
            <h4 className="font-semibold">Add Waypoint</h4>
            <div className="grid gap-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="waypoint-name">Name</Label>
                  <Input
                    id="waypoint-name"
                    placeholder="Stop name"
                    value={newWaypoint.name}
                    onChange={(e) => setNewWaypoint({ ...newWaypoint, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="waypoint-lat">Latitude</Label>
                  <Input
                    id="waypoint-lat"
                    type="number"
                    step="0.0001"
                    placeholder="19.0760"
                    value={newWaypoint.lat}
                    onChange={(e) => setNewWaypoint({ ...newWaypoint, lat: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="waypoint-lng">Longitude</Label>
                  <Input
                    id="waypoint-lng"
                    type="number"
                    step="0.0001"
                    placeholder="72.8777"
                    value={newWaypoint.lng}
                    onChange={(e) => setNewWaypoint({ ...newWaypoint, lng: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={addWaypoint} variant="outline" className="w-full">
                <MapPin className="h-4 w-4 mr-2" />
                Add Waypoint
              </Button>
            </div>
          </div>

          <Separator />

          {/* Driver Assignment */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Assign Driver
            </h4>
            <div className="grid gap-3">
              <div className="space-y-1">
                <Label htmlFor="driver-name">Driver Name</Label>
                <Input
                  id="driver-name"
                  placeholder="Enter driver name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="driver-phone">Driver Phone</Label>
                <Input
                  id="driver-phone"
                  type="tel"
                  placeholder="+91-9876543210"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Button onClick={handleAssignRoute} className="w-full">
            Assign Route to {vehicleRegNo}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteMapAssignment;
