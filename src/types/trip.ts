export interface GPSLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed: number; // km/h
  heading: number; // degrees
}

export interface RouteWaypoint {
  id: string;
  name: string;
  location: GPSLocation;
  eta: string;
  reached: boolean;
  reachedAt?: string;
}

export interface DeliveryEvent {
  id: string;
  type: 'dispatched' | 'in_transit' | 'arrival' | 'unloading' | 'completed' | 'delayed';
  timestamp: string;
  location: GPSLocation;
  description: string;
  evidence?: string[]; // URLs to photos/videos
}

export interface ActiveTrip {
  tripId: string;
  vehicleRegNo: string;
  driverName: string;
  driverPhone: string;
  material: string;
  quantity: number;
  customer: string;
  destination: string;
  startTime: string;
  estimatedArrival: string;
  currentLocation: GPSLocation;
  route: RouteWaypoint[];
  events: DeliveryEvent[];
  status: 'active' | 'delayed' | 'completed' | 'cancelled';
  distanceRemaining: number; // km
  distanceCovered: number; // km
  totalDistance: number; // km
  batchTime?: string;
  maxTransitMinutes?: number;
  drumRpm?: number;
}
