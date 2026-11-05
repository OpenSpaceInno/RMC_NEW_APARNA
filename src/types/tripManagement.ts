import { GPSLocation } from './trip';

export type TripStatus = 'scheduled' | 'dispatched' | 'in_transit' | 'at_destination' | 'unloading' | 'completed' | 'cancelled' | 'delayed';

export interface TripWaypoint {
  id: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  sequenceOrder: number;
  eta?: string;
  actualArrival?: string;
  status: 'pending' | 'reached' | 'skipped';
}

export interface GPSConfig {
  deviceId?: string;
  isEnabled: boolean;
  trackingInterval: number; // seconds
  lastPing?: string;
  signalStrength?: 'strong' | 'moderate' | 'weak' | 'offline';
}

export interface Trip {
  id: string;
  tripNumber: string;
  vehicleId: string;
  vehicleRegNo: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  customerId: string;
  customerName: string;
  customerContact?: string;
  material: string;
  quantity: number; // in kg
  unit: 'kg' | 'tons' | 'cubic_meters';
  origin: {
    name: string;
    address: string;
    location: { latitude: number; longitude: number };
  };
  destination: {
    name: string;
    address: string;
    location: { latitude: number; longitude: number };
  };
  waypoints: TripWaypoint[];
  scheduledStartTime: string;
  actualStartTime?: string;
  estimatedArrival: string;
  actualArrival?: string;
  completedAt?: string;
  status: TripStatus;
  totalDistance: number; // km
  distanceCovered: number; // km
  distanceRemaining: number; // km
  currentLocation?: GPSLocation;
  gpsConfig: GPSConfig;
  notes?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

export interface TripEvent {
  id: string;
  tripId: string;
  type: 'created' | 'dispatched' | 'started' | 'waypoint_reached' | 'delay_detected' | 'arrived' | 'unloading_started' | 'completed' | 'cancelled' | 'note_added' | 'gps_update';
  timestamp: string;
  location?: GPSLocation;
  description: string;
  metadata?: Record<string, any>;
  createdBy?: string;
}

export interface TripFormData {
  vehicleId: string;
  vehicleRegNo?: string;
  driverId: string;
  driverName?: string;
  driverPhone?: string;
  customerId: string;
  customerName: string;
  customerContact?: string;
  material: string;
  quantity: number;
  unit: 'kg' | 'tons' | 'cubic_meters';
  origin: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  destination: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  scheduledStartTime: string;
  estimatedDistance: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  enableGPS: boolean;
  gpsDeviceId?: string;
}

export interface TripFilters {
  status?: TripStatus[];
  dateRange?: { start: string; end: string };
  vehicleId?: string;
  driverId?: string;
  customerId?: string;
  priority?: Trip['priority'][];
}

export interface TripStats {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  delayed: number;
  avgDeliveryTime: number; // minutes
  onTimeDeliveryRate: number; // percentage
}
