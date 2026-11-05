import { useState, useEffect, useCallback } from 'react';
import { Geofence, GeofenceAlert, GPSPosition } from '@/types/gps';
import { Trip } from '@/types/tripManagement';
import { useToast } from '@/hooks/use-toast';

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Check if point is inside polygon using ray casting
const isPointInPolygon = (
  point: { latitude: number; longitude: number },
  polygon: Array<{ latitude: number; longitude: number }>
): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    if (
      yi > point.latitude !== yj > point.latitude &&
      point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
};

const mockGeofences: Geofence[] = [
  {
    id: 'geo-001',
    name: 'RMC Plant Thane',
    type: 'circle',
    center: { latitude: 19.1000, longitude: 72.9000 },
    radius: 500,
    color: '#22c55e',
    alertOnEntry: true,
    alertOnExit: true,
    isActive: true,
    linkedTripIds: [],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60000).toISOString(),
  },
  {
    id: 'geo-002',
    name: 'Mumbai Central Zone',
    type: 'circle',
    center: { latitude: 19.0760, longitude: 72.8777 },
    radius: 2000,
    color: '#3b82f6',
    alertOnEntry: true,
    alertOnExit: false,
    isActive: true,
    linkedTripIds: [],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60000).toISOString(),
  },
  {
    id: 'geo-003',
    name: 'Restricted Construction Site',
    type: 'circle',
    center: { latitude: 19.0596, longitude: 72.8295 },
    radius: 300,
    color: '#ef4444',
    alertOnEntry: true,
    alertOnExit: true,
    isActive: true,
    linkedTripIds: ['trip-001'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(),
  },
];

const mockAlerts: GeofenceAlert[] = [
  {
    id: 'alert-001',
    geofenceId: 'geo-001',
    geofenceName: 'RMC Plant Thane',
    tripId: 'trip-001',
    tripNumber: 'TRP241228-001',
    vehicleRegNo: 'MH12AB1234',
    driverName: 'Rajesh Kumar',
    eventType: 'exit',
    timestamp: new Date(Date.now() - 55 * 60000).toISOString(),
    location: { latitude: 19.0980, longitude: 72.8990 },
    isAcknowledged: true,
  },
  {
    id: 'alert-002',
    geofenceId: 'geo-002',
    geofenceName: 'Mumbai Central Zone',
    tripId: 'trip-001',
    tripNumber: 'TRP241228-001',
    vehicleRegNo: 'MH12AB1234',
    driverName: 'Rajesh Kumar',
    eventType: 'entry',
    timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
    location: { latitude: 19.0780, longitude: 72.8800 },
    isAcknowledged: false,
  },
];

export const useGeofencing = (trips: Trip[]) => {
  const { toast } = useToast();
  const [geofences, setGeofences] = useState<Geofence[]>(mockGeofences);
  const [alerts, setAlerts] = useState<GeofenceAlert[]>(mockAlerts);
  const [vehiclePositions, setVehiclePositions] = useState<Map<string, { inside: Set<string> }>>(new Map());

  // Check if a position is inside a geofence
  const isInsideGeofence = useCallback((
    position: { latitude: number; longitude: number },
    geofence: Geofence
  ): boolean => {
    if (geofence.type === 'circle' && geofence.center && geofence.radius) {
      const distance = calculateDistance(
        position.latitude,
        position.longitude,
        geofence.center.latitude,
        geofence.center.longitude
      );
      return distance <= geofence.radius;
    } else if (geofence.type === 'polygon' && geofence.coordinates) {
      return isPointInPolygon(position, geofence.coordinates);
    }
    return false;
  }, []);

  // Process GPS position update and check geofences
  const processPositionUpdate = useCallback((trip: Trip, position: GPSPosition) => {
    if (!position) return;

    const tripKey = trip.id;
    const currentState = vehiclePositions.get(tripKey) || { inside: new Set<string>() };
    const newInside = new Set<string>();

    geofences.filter(g => g.isActive).forEach(geofence => {
      const wasInside = currentState.inside.has(geofence.id);
      const isNowInside = isInsideGeofence(
        { latitude: position.latitude, longitude: position.longitude },
        geofence
      );

      if (isNowInside) {
        newInside.add(geofence.id);
      }

      // Detect entry
      if (!wasInside && isNowInside && geofence.alertOnEntry) {
        const alert: GeofenceAlert = {
          id: `alert-${Date.now()}`,
          geofenceId: geofence.id,
          geofenceName: geofence.name,
          tripId: trip.id,
          tripNumber: trip.tripNumber,
          vehicleRegNo: trip.vehicleRegNo,
          driverName: trip.driverName,
          eventType: 'entry',
          timestamp: new Date().toISOString(),
          location: { latitude: position.latitude, longitude: position.longitude },
          isAcknowledged: false,
        };
        setAlerts(prev => [alert, ...prev]);
        toast({
          title: 'Geofence Entry Alert',
          description: `${trip.vehicleRegNo} entered ${geofence.name}`,
        });
      }

      // Detect exit
      if (wasInside && !isNowInside && geofence.alertOnExit) {
        const alert: GeofenceAlert = {
          id: `alert-${Date.now()}`,
          geofenceId: geofence.id,
          geofenceName: geofence.name,
          tripId: trip.id,
          tripNumber: trip.tripNumber,
          vehicleRegNo: trip.vehicleRegNo,
          driverName: trip.driverName,
          eventType: 'exit',
          timestamp: new Date().toISOString(),
          location: { latitude: position.latitude, longitude: position.longitude },
          isAcknowledged: false,
        };
        setAlerts(prev => [alert, ...prev]);
        toast({
          title: 'Geofence Exit Alert',
          description: `${trip.vehicleRegNo} exited ${geofence.name}`,
          variant: 'destructive',
        });
      }
    });

    setVehiclePositions(prev => new Map(prev).set(tripKey, { inside: newInside }));
  }, [geofences, vehiclePositions, isInsideGeofence, toast]);

  // Monitor active trips
  useEffect(() => {
    const activeTrips = trips.filter(t => 
      ['in_transit', 'dispatched', 'delayed'].includes(t.status) && t.currentLocation
    );

    activeTrips.forEach(trip => {
      if (trip.currentLocation) {
        const position: GPSPosition = {
          deviceId: trip.gpsConfig.deviceId || '',
          tripId: trip.id,
          latitude: trip.currentLocation.latitude,
          longitude: trip.currentLocation.longitude,
          speed: trip.currentLocation.speed,
          heading: trip.currentLocation.heading,
          timestamp: trip.currentLocation.timestamp,
        };
        processPositionUpdate(trip, position);
      }
    });
  }, [trips, processPositionUpdate]);

  const createGeofence = useCallback((geofence: Omit<Geofence, 'id' | 'createdAt'>) => {
    const newGeofence: Geofence = {
      ...geofence,
      id: `geo-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setGeofences(prev => [...prev, newGeofence]);
    toast({
      title: 'Geofence Created',
      description: `${geofence.name} has been created`,
    });
    return newGeofence;
  }, [toast]);

  const updateGeofence = useCallback((id: string, updates: Partial<Geofence>) => {
    setGeofences(prev => 
      prev.map(g => g.id === id ? { ...g, ...updates } : g)
    );
    toast({
      title: 'Geofence Updated',
      description: 'Geofence settings have been updated',
    });
  }, [toast]);

  const deleteGeofence = useCallback((id: string) => {
    setGeofences(prev => prev.filter(g => g.id !== id));
    toast({
      title: 'Geofence Deleted',
      description: 'Geofence has been removed',
    });
  }, [toast]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev =>
      prev.map(a => a.id === alertId ? { ...a, isAcknowledged: true } : a)
    );
  }, []);

  const acknowledgeAllAlerts = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, isAcknowledged: true })));
  }, []);

  const getUnacknowledgedAlerts = useCallback(() => {
    return alerts.filter(a => !a.isAcknowledged);
  }, [alerts]);

  return {
    geofences,
    alerts,
    createGeofence,
    updateGeofence,
    deleteGeofence,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    getUnacknowledgedAlerts,
    isInsideGeofence,
  };
};
