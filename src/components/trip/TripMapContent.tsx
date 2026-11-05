import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ActiveTrip } from '@/types/trip';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom vehicle icon
const createVehicleIcon = (status: string) => {
  const color = status === 'delayed' ? '#ef4444' : status === 'completed' ? '#22c55e' : '#3b82f6';
  
  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Waypoint icon
const createWaypointIcon = (reached: boolean) => {
  return L.divIcon({
    className: 'custom-waypoint-marker',
    html: `
      <div style="
        background: ${reached ? '#22c55e' : '#f59e0b'};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

interface TripMapContentProps {
  trip: ActiveTrip;
}

const TripMapContent = ({ trip }: TripMapContentProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylinesRef = useRef<L.Polyline[]>([]);

  const lastTripIdRef = useRef<string | null>(null);

  // Helper to re-fit map to route bounds
  const handleRecenter = () => {
    if (!mapRef.current || trip.route.length === 0) return;
    const coords: [number, number][] = trip.route.map(w => [w.location.latitude, w.location.longitude]);
    const bounds = L.latLngBounds(coords);
    if (trip.currentLocation) {
      bounds.extend([trip.currentLocation.latitude, trip.currentLocation.longitude]);
    }
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const mapCenter: [number, number] = trip.currentLocation
      ? [trip.currentLocation.latitude, trip.currentLocation.longitude]
      : trip.route.length > 0
      ? [trip.route[0].location.latitude, trip.route[0].location.longitude]
      : [19.0760, 72.8777];

    mapRef.current = L.map(mapContainerRef.current).setView(mapCenter, 13);

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

  // Update map when trip changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers and polylines
    markersRef.current.forEach(m => m.remove());
    polylinesRef.current.forEach(p => p.remove());
    markersRef.current = [];
    polylinesRef.current = [];

    // Get route coordinates
    const routeCoordinates: [number, number][] = trip.route.map(waypoint => [
      waypoint.location.latitude,
      waypoint.location.longitude,
    ]);

    // Draw route polyline
    if (routeCoordinates.length > 1) {
      const routeLine = L.polyline(routeCoordinates, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10'
      }).addTo(mapRef.current);
      polylinesRef.current.push(routeLine);
    }

    // Draw completed route segments
    trip.route.forEach((waypoint, index) => {
      if (index === 0 || !waypoint.reached) return;
      const prevWaypoint = trip.route[index - 1];
      if (!prevWaypoint.reached) return;
      
      const completedLine = L.polyline([
        [prevWaypoint.location.latitude, prevWaypoint.location.longitude],
        [waypoint.location.latitude, waypoint.location.longitude],
      ], {
        color: '#22c55e',
        weight: 4,
        opacity: 0.9
      }).addTo(mapRef.current!);
      polylinesRef.current.push(completedLine);
    });

    // Add waypoint markers
    trip.route.forEach(waypoint => {
      const marker = L.marker(
        [waypoint.location.latitude, waypoint.location.longitude],
        { icon: createWaypointIcon(waypoint.reached) }
      ).addTo(mapRef.current!);
      
      marker.bindPopup(`
        <div style="font-size: 14px;">
          <p style="font-weight: 600; margin: 0 0 4px 0;">${waypoint.name}</p>
          <p style="font-size: 12px; color: #666; margin: 0;">
            ${waypoint.reached
              ? `Reached at ${new Date(waypoint.reachedAt!).toLocaleTimeString()}`
              : `ETA: ${new Date(waypoint.eta).toLocaleTimeString()}`
            }
          </p>
        </div>
      `);
      
      markersRef.current.push(marker);
    });

    // Add vehicle marker
    if (trip.currentLocation) {
      const vehicleMarker = L.marker(
        [trip.currentLocation.latitude, trip.currentLocation.longitude],
        { icon: createVehicleIcon(trip.status) }
      ).addTo(mapRef.current);
      
      vehicleMarker.bindPopup(`
        <div style="font-size: 14px;">
          <p style="font-weight: 600; margin: 0 0 4px 0;">${trip.vehicleRegNo}</p>
          <p style="font-size: 12px; margin: 0 0 4px 0;">${trip.driverName}</p>
          <p style="font-size: 12px; color: #666; margin: 0;">Speed: ${trip.currentLocation.speed} km/h</p>
          <p style="font-size: 12px; color: #666; margin: 0;">Last update: ${new Date(trip.currentLocation.timestamp).toLocaleTimeString()}</p>
        </div>
      `);
      
      markersRef.current.push(vehicleMarker);
    }

    // Only fit bounds on trip selection switch, not every 4s GPS tick
    if (routeCoordinates.length > 0 && lastTripIdRef.current !== trip.tripId) {
      lastTripIdRef.current = trip.tripId;
      const bounds = L.latLngBounds(routeCoordinates);
      if (trip.currentLocation) {
        bounds.extend([trip.currentLocation.latitude, trip.currentLocation.longitude]);
      }
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [trip]);

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden border border-border">
      <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg z-[1000]">
        <p className="text-xs font-semibold mb-2">Legend</p>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span>Active Vehicle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
            <span>Pending Waypoint</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span>Delayed</span>
          </div>
        </div>
      </div>

      {/* Trip Status Badge */}
      <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg z-[1000]">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            trip.status === 'completed' ? 'bg-green-600' :
            trip.status === 'delayed' ? 'bg-red-600' :
            'bg-blue-600 animate-pulse'
          }`}></div>
          <span className="text-sm font-medium capitalize">{trip.status.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Recenter button */}
      <button
        onClick={handleRecenter}
        type="button"
        className="absolute top-4 right-4 bg-background/95 hover:bg-background text-xs font-medium px-3 py-1.5 rounded-lg border border-border shadow-md z-[1000] transition-colors"
      >
        Recenter Route
      </button>
    </div>
  );
};

export default TripMapContent;
