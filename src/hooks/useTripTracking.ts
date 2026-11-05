import { useState, useEffect, useCallback, useRef } from 'react';
import { ActiveTrip, GPSLocation, DeliveryEvent } from '@/types/trip';
import { useToast } from '@/hooks/use-toast';

export const useTripTracking = () => {
  const { toast } = useToast();
  const [activeTrips, setActiveTrips] = useState<ActiveTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<ActiveTrip | null>(null);
  const [isSimulating, setIsSimulating] = useState(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);

  // Keep ref to selectedTripId so simulation loop doesn't read stale state
  const selectedTripIdRef = useRef<string | null>(null);

  // Initialize with rich mock trips representing real-time RMC scenarios
  useEffect(() => {
    const now = Date.now();
    const mockTrips: ActiveTrip[] = [
      {
        tripId: 'TRIP-001',
        vehicleRegNo: 'MH12AB1234',
        driverName: 'Rajesh Kumar',
        driverPhone: '+91 98765 43210',
        material: 'M25 RMC',
        quantity: 18500,
        customer: 'ABC Construction Ltd',
        destination: 'Bandra Site, Mumbai',
        startTime: new Date(now - 45 * 60000).toISOString(),
        estimatedArrival: new Date(now + 15 * 60000).toISOString(),
        batchTime: new Date(now - 50 * 60000).toISOString(),
        maxTransitMinutes: 90,
        drumRpm: 12,
        currentLocation: {
          latitude: 19.0760,
          longitude: 72.8777,
          timestamp: new Date().toISOString(),
          speed: 35,
          heading: 225,
        },
        route: [
          {
            id: 'wp1',
            name: 'Plant Exit Gate',
            location: { latitude: 19.1000, longitude: 72.9000, timestamp: '', speed: 0, heading: 0 },
            eta: new Date(now - 45 * 60000).toISOString(),
            reached: true,
            reachedAt: new Date(now - 45 * 60000).toISOString(),
          },
          {
            id: 'wp2',
            name: 'Sion Highway Junction',
            location: { latitude: 19.0400, longitude: 72.8600, timestamp: '', speed: 0, heading: 0 },
            eta: new Date(now - 15 * 60000).toISOString(),
            reached: true,
            reachedAt: new Date(now - 15 * 60000).toISOString(),
          },
          {
            id: 'wp3',
            name: 'Bandra Reclamation Site',
            location: { latitude: 19.0500, longitude: 72.8300, timestamp: '', speed: 0, heading: 0 },
            eta: new Date(now + 15 * 60000).toISOString(),
            reached: false,
          },
        ],
        events: [
          {
            id: 'evt1',
            type: 'dispatched',
            timestamp: new Date(now - 45 * 60000).toISOString(),
            location: { latitude: 19.1000, longitude: 72.9000, timestamp: '', speed: 0, heading: 0 },
            description: 'Vehicle dispatched from plant with quality pass docket',
          },
          {
            id: 'evt2',
            type: 'in_transit',
            timestamp: new Date(now - 30 * 60000).toISOString(),
            location: { latitude: 19.0760, longitude: 72.8777, timestamp: '', speed: 35, heading: 225 },
            description: 'En route to Bandra Site. Drum rotating at 12 RPM.',
          },
        ],
        status: 'active',
        distanceRemaining: 7.2,
        distanceCovered: 17.8,
        totalDistance: 25.0,
      },
      {
        tripId: 'TRIP-002',
        vehicleRegNo: 'MH14CD5678',
        driverName: 'Suresh Patil',
        driverPhone: '+91 98765 43211',
        material: 'M30 RMC',
        quantity: 20000,
        customer: 'XYZ Developers',
        destination: 'Andheri Project, Mumbai',
        startTime: new Date(now - 25 * 60000).toISOString(),
        estimatedArrival: new Date(now + 35 * 60000).toISOString(),
        batchTime: new Date(now - 30 * 60000).toISOString(),
        maxTransitMinutes: 90,
        drumRpm: 14,
        currentLocation: {
          latitude: 19.1197,
          longitude: 72.8464,
          timestamp: new Date().toISOString(),
          speed: 42,
          heading: 280,
        },
        route: [
          {
            id: 'wp1',
            name: 'Plant Exit Gate',
            location: { latitude: 19.1000, longitude: 72.9000, timestamp: '', speed: 0, heading: 0 },
            eta: new Date(now - 25 * 60000).toISOString(),
            reached: true,
            reachedAt: new Date(now - 25 * 60000).toISOString(),
          },
          {
            id: 'wp2',
            name: 'Jogeshwari Link Rd',
            location: { latitude: 19.1300, longitude: 72.8700, timestamp: '', speed: 0, heading: 0 },
            eta: new Date(now + 10 * 60000).toISOString(),
            reached: false,
          },
          {
            id: 'wp3',
            name: 'Andheri Project Site',
            location: { latitude: 19.1200, longitude: 72.8350, timestamp: '', speed: 0, heading: 0 },
            eta: new Date(now + 35 * 60000).toISOString(),
            reached: false,
          },
        ],
        events: [
          {
            id: 'evt1',
            type: 'dispatched',
            timestamp: new Date(now - 25 * 60000).toISOString(),
            location: { latitude: 19.1000, longitude: 72.9000, timestamp: '', speed: 0, heading: 0 },
            description: 'Dispatched with 20m³ M30 batch mix',
          },
        ],
        status: 'active',
        distanceRemaining: 12.3,
        distanceCovered: 8.7,
        totalDistance: 21.0,
      },
      {
        tripId: 'TRIP-003',
        vehicleRegNo: 'MH01GH3456',
        driverName: 'Pradeep Singh',
        driverPhone: '+91 98765 43213',
        material: 'M35 RMC',
        quantity: 22000,
        customer: 'Prime Tower Infra',
        destination: 'Worli Site, Mumbai',
        startTime: new Date(now - 80 * 60000).toISOString(),
        estimatedArrival: new Date(now - 10 * 60000).toISOString(),
        batchTime: new Date(now - 85 * 60000).toISOString(),
        maxTransitMinutes: 90,
        drumRpm: 4,
        currentLocation: {
          latitude: 19.0250,
          longitude: 72.8250,
          timestamp: new Date().toISOString(),
          speed: 12,
          heading: 190,
        },
        route: [
          {
            id: 'wp1',
            name: 'Plant Exit Gate',
            location: { latitude: 19.1000, longitude: 72.9000, timestamp: '', speed: 0, heading: 0 },
            eta: new Date(now - 80 * 60000).toISOString(),
            reached: true,
            reachedAt: new Date(now - 80 * 60000).toISOString(),
          },
          {
            id: 'wp2',
            name: 'Dadar Western Express Flyover',
            location: { latitude: 19.0300, longitude: 72.8400, timestamp: '', speed: 0, heading: 0 },
            eta: new Date(now - 30 * 60000).toISOString(),
            reached: true,
            reachedAt: new Date(now - 30 * 60000).toISOString(),
          },
          {
            id: 'wp3',
            name: 'Worli Sea Face Tower Site',
            location: { latitude: 19.0150, longitude: 72.8180, timestamp: '', speed: 0, heading: 0 },
            eta: new Date(now + 15 * 60000).toISOString(),
            reached: false,
          },
        ],
        events: [
          {
            id: 'evt1',
            type: 'dispatched',
            timestamp: new Date(now - 80 * 60000).toISOString(),
            location: { latitude: 19.1000, longitude: 72.9000, timestamp: '', speed: 0, heading: 0 },
            description: 'Mixer dispatched from plant',
          },
          {
            id: 'evt2',
            type: 'delayed',
            timestamp: new Date(now - 20 * 60000).toISOString(),
            location: { latitude: 19.0250, longitude: 72.8250, timestamp: '', speed: 12, heading: 190 },
            description: 'Severe traffic congestion on Western Express Flyover. Slump loss alert flagged.',
          },
        ],
        status: 'delayed',
        distanceRemaining: 4.5,
        distanceCovered: 23.5,
        totalDistance: 28.0,
      },
      {
        tripId: 'TRIP-004',
        vehicleRegNo: 'MH04EF9012',
        driverName: 'Amit Sharma',
        driverPhone: '+91 98765 43212',
        material: 'M20 RMC',
        quantity: 15000,
        customer: 'Metro Builders Corp',
        destination: 'Powai Site, Mumbai',
        startTime: new Date(now - 55 * 60000).toISOString(),
        estimatedArrival: new Date(now - 10 * 60000).toISOString(),
        batchTime: new Date(now - 60 * 60000).toISOString(),
        maxTransitMinutes: 90,
        drumRpm: 16,
        currentLocation: {
          latitude: 19.1176,
          longitude: 72.9060,
          timestamp: new Date().toISOString(),
          speed: 0,
          heading: 0,
        },
        route: [
          {
            id: 'wp1',
            name: 'Plant Exit Gate',
            location: { latitude: 19.1000, longitude: 72.9000, timestamp: '', speed: 0, heading: 0 },
            eta: new Date(now - 55 * 60000).toISOString(),
            reached: true,
            reachedAt: new Date(now - 55 * 60000).toISOString(),
          },
          {
            id: 'wp2',
            name: 'Powai Site Pump #1',
            location: { latitude: 19.1176, longitude: 72.9060, timestamp: '', speed: 0, heading: 0 },
            eta: new Date(now - 10 * 60000).toISOString(),
            reached: true,
            reachedAt: new Date(now - 10 * 60000).toISOString(),
          },
        ],
        events: [
          {
            id: 'evt1',
            type: 'dispatched',
            timestamp: new Date(now - 55 * 60000).toISOString(),
            location: { latitude: 19.1000, longitude: 72.9000, timestamp: '', speed: 0, heading: 0 },
            description: 'Dispatched for slab pour #4',
          },
          {
            id: 'evt2',
            type: 'arrival',
            timestamp: new Date(now - 10 * 60000).toISOString(),
            location: { latitude: 19.1176, longitude: 72.9060, timestamp: '', speed: 0, heading: 0 },
            description: 'Arrived at site pump. Slump test approved (150mm).',
          },
          {
            id: 'evt3',
            type: 'unloading',
            timestamp: new Date(now - 5 * 60000).toISOString(),
            location: { latitude: 19.1176, longitude: 72.9060, timestamp: '', speed: 0, heading: 0 },
            description: 'Concrete discharging into pump hopper.',
          },
        ],
        status: 'active',
        distanceRemaining: 0,
        distanceCovered: 12.0,
        totalDistance: 12.0,
      },
    ];

    setActiveTrips(mockTrips);
    setSelectedTrip(mockTrips[0]);
    selectedTripIdRef.current = mockTrips[0].tripId;
  }, []);

  // Update selected trip ref whenever it changes
  useEffect(() => {
    selectedTripIdRef.current = selectedTrip?.tripId || null;
  }, [selectedTrip]);

  // Stable GPS simulation loop that avoids closure recreation
  useEffect(() => {
    if (!isSimulating) return;

    const intervalTime = Math.max(1000, Math.round(4000 / simSpeed));
    const interval = setInterval(() => {
      setActiveTrips(prevTrips => {
        const nextTrips = prevTrips.map(trip => {
          if (trip.status !== 'active' && trip.status !== 'delayed') return trip;
          if (trip.distanceRemaining <= 0) return trip; // Already at destination

          // Simulate micro GPS movement along route
          const latJitter = (Math.random() - 0.48) * 0.002 * simSpeed;
          const lngJitter = (Math.random() - 0.48) * 0.002 * simSpeed;
          const newSpeed = Math.max(10, Math.min(65, trip.currentLocation.speed + (Math.random() - 0.5) * 6));

          const newLocation: GPSLocation = {
            ...trip.currentLocation,
            latitude: trip.currentLocation.latitude + latJitter,
            longitude: trip.currentLocation.longitude + lngJitter,
            timestamp: new Date().toISOString(),
            speed: Math.round(newSpeed),
          };

          const distanceIncrement = Math.min(0.2, (newLocation.speed / 3600) * (intervalTime / 1000) * simSpeed);
          const newDistanceCovered = Math.min(trip.totalDistance, trip.distanceCovered + distanceIncrement);
          const newDistanceRemaining = Math.max(0, trip.totalDistance - newDistanceCovered);

          return {
            ...trip,
            currentLocation: newLocation,
            distanceCovered: Number(newDistanceCovered.toFixed(2)),
            distanceRemaining: Number(newDistanceRemaining.toFixed(2)),
          };
        });

        // Sync selected trip with updated data
        const currentSelectedId = selectedTripIdRef.current;
        if (currentSelectedId) {
          const freshSelected = nextTrips.find(t => t.tripId === currentSelectedId);
          if (freshSelected) {
            setSelectedTrip(freshSelected);
          }
        }

        return nextTrips;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isSimulating, simSpeed]);

  const selectTrip = useCallback((tripId: string) => {
    selectedTripIdRef.current = tripId;
    setActiveTrips(current => {
      const found = current.find(t => t.tripId === tripId);
      if (found) setSelectedTrip(found);
      return current;
    });
  }, []);

  const addEvent = useCallback((tripId: string, event: Omit<DeliveryEvent, 'id'>) => {
    const newEvent: DeliveryEvent = {
      ...event,
      id: `evt-${Date.now()}`,
    };

    setActiveTrips(prev =>
      prev.map(trip => {
        if (trip.tripId !== tripId) return trip;
        return {
          ...trip,
          events: [...trip.events, newEvent],
        };
      })
    );

    // Also update selectedTrip if it's the target
    setSelectedTrip(prev => {
      if (!prev || prev.tripId !== tripId) return prev;
      return { ...prev, events: [...prev.events, newEvent] };
    });

    // Log to Audit Trail
    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'tracking',
        action: 'STATUS_CHANGE',
        entityId: tripId,
        entityType: 'Trip Delivery',
        details: `${event.type.toUpperCase()}: ${event.description}`,
        severity: event.type === 'delayed' ? 'warning' : 'info',
        performedBy: { id: 'GPS-DISP', name: 'Fleet Dispatcher', role: 'Operator' }
      }
    }));
  }, []);

  const advanceWaypoint = useCallback((tripId: string) => {
    setActiveTrips(prev =>
      prev.map(trip => {
        if (trip.tripId !== tripId) return trip;
        const unreachedIndex = trip.route.findIndex(w => !w.reached);
        if (unreachedIndex === -1) {
          toast({ title: 'All Waypoints Reached', description: 'Vehicle has reached the final destination' });
          return trip;
        }

        const now = new Date().toISOString();
        const updatedRoute = trip.route.map((w, idx) =>
          idx === unreachedIndex ? { ...w, reached: true, reachedAt: now } : w
        );
        const reachedName = updatedRoute[unreachedIndex].name;

        toast({
          title: `Waypoint Cleared: ${reachedName}`,
          description: `Vehicle ${trip.vehicleRegNo} recorded arrival at ${reachedName}`,
        });

        const isLast = unreachedIndex === updatedRoute.length - 1;
        const newStatus = isLast ? 'completed' : trip.status;

        const updatedTrip: ActiveTrip = {
          ...trip,
          route: updatedRoute,
          status: newStatus as ActiveTrip['status'],
          distanceRemaining: isLast ? 0 : Math.max(1, trip.distanceRemaining - 5),
          distanceCovered: isLast ? trip.totalDistance : trip.distanceCovered + 5,
        };

        if (selectedTripIdRef.current === tripId) {
          setSelectedTrip(updatedTrip);
        }

        return updatedTrip;
      })
    );
  }, [toast]);

  const reportTripDelay = useCallback((tripId: string, reason: string) => {
    setActiveTrips(prev =>
      prev.map(trip => {
        if (trip.tripId !== tripId) return trip;
        const now = new Date().toISOString();
        const delayEvent: DeliveryEvent = {
          id: `evt-delay-${Date.now()}`,
          type: 'delayed',
          timestamp: now,
          location: trip.currentLocation,
          description: `Traffic delay reported: ${reason}. Slump retention alert triggered.`,
        };

        const updatedTrip: ActiveTrip = {
          ...trip,
          status: 'delayed',
          events: [...trip.events, delayEvent],
        };

        if (selectedTripIdRef.current === tripId) {
          setSelectedTrip(updatedTrip);
        }

        toast({
          title: 'Delay Logged',
          description: `${trip.vehicleRegNo} marked as delayed: ${reason}`,
          variant: 'destructive',
        });

        // Audit log
        window.dispatchEvent(new CustomEvent('rmc-audit-event', {
          detail: {
            module: 'tracking',
            action: 'ANOMALY_DETECTED',
            entityId: tripId,
            entityType: 'Trip Tracking',
            details: `Delay reported for ${trip.vehicleRegNo}: ${reason}`,
            severity: 'warning',
            performedBy: { id: 'DISP-01', name: 'Traffic Monitoring', role: 'Dispatcher' }
          }
        }));

        return updatedTrip;
      })
    );
  }, [toast]);

  const markTripCompleted = useCallback((tripId: string) => {
    setActiveTrips(prev =>
      prev.map(trip => {
        if (trip.tripId !== tripId) return trip;
        const now = new Date().toISOString();
        const completedEvent: DeliveryEvent = {
          id: `evt-comp-${Date.now()}`,
          type: 'completed',
          timestamp: now,
          location: trip.currentLocation,
          description: 'Pour completed. Customer delivery docket signed electronically.',
        };

        const updatedTrip: ActiveTrip = {
          ...trip,
          status: 'completed',
          distanceRemaining: 0,
          distanceCovered: trip.totalDistance,
          events: [...trip.events, completedEvent],
        };

        if (selectedTripIdRef.current === tripId) {
          setSelectedTrip(updatedTrip);
        }

        toast({
          title: 'Delivery Completed',
          description: `Trip ${tripId} marked successfully delivered`,
        });

        // Audit log
        window.dispatchEvent(new CustomEvent('rmc-audit-event', {
          detail: {
            module: 'tracking',
            action: 'VERIFICATION_PASSED',
            entityId: tripId,
            entityType: 'Trip Delivery',
            details: `Trip ${tripId} (${trip.vehicleRegNo}) delivery completed and verified at ${trip.destination}`,
            severity: 'info',
            performedBy: { id: 'SITE-01', name: 'Site Incharge', role: 'Customer QA' }
          }
        }));

        return updatedTrip;
      })
    );
  }, [toast]);

  return {
    activeTrips,
    selectedTrip,
    selectTrip,
    addEvent,
    advanceWaypoint,
    reportTripDelay,
    markTripCompleted,
    isSimulating,
    setIsSimulating,
    simSpeed,
    setSimSpeed,
  };
};
