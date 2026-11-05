export interface GPSDevice {
  id: string;
  deviceId: string;
  name: string;
  type: 'traccar' | 'webhook' | 'manual';
  status: 'online' | 'offline' | 'idle';
  lastSeen?: string;
  configuration: {
    apiUrl?: string;
    apiKey?: string;
    webhookSecret?: string;
    updateInterval: number; // seconds
  };
}

export interface GPSPosition {
  deviceId: string;
  tripId?: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  speed: number; // km/h
  heading: number; // degrees
  accuracy?: number; // meters
  timestamp: string;
  attributes?: Record<string, any>;
}

export interface Geofence {
  id: string;
  name: string;
  type: 'circle' | 'polygon';
  center?: { latitude: number; longitude: number };
  radius?: number; // meters for circle
  coordinates?: Array<{ latitude: number; longitude: number }>; // for polygon
  color: string;
  alertOnEntry: boolean;
  alertOnExit: boolean;
  isActive: boolean;
  linkedTripIds: string[];
  createdAt: string;
}

export interface GeofenceAlert {
  id: string;
  geofenceId: string;
  geofenceName: string;
  tripId: string;
  tripNumber: string;
  vehicleRegNo: string;
  driverName: string;
  eventType: 'entry' | 'exit';
  timestamp: string;
  location: { latitude: number; longitude: number };
  isAcknowledged: boolean;
}

export interface RouteOptimization {
  tripId: string;
  originalRoute: Array<{ latitude: number; longitude: number }>;
  optimizedRoute: Array<{ latitude: number; longitude: number }>;
  originalDistance: number; // km
  optimizedDistance: number; // km
  originalDuration: number; // minutes
  optimizedDuration: number; // minutes
  trafficConditions: 'light' | 'moderate' | 'heavy';
  alternativeRoutes?: Array<{
    route: Array<{ latitude: number; longitude: number }>;
    distance: number;
    duration: number;
    description: string;
  }>;
  calculatedAt: string;
}

export interface TripAnalytics {
  period: 'day' | 'week' | 'month';
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  delayedTrips: number;
  onTimeDeliveryRate: number;
  avgDeliveryTime: number; // minutes
  totalDistance: number; // km
  avgSpeed: number; // km/h
  driverMetrics: Array<{
    driverId: string;
    driverName: string;
    tripsCompleted: number;
    avgDeliveryTime: number;
    onTimeRate: number;
    totalDistance: number;
  }>;
  dailyStats: Array<{
    date: string;
    trips: number;
    completed: number;
    delayed: number;
    avgTime: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    trips: number;
  }>;
}
