import { useState, useCallback } from 'react';
import { RouteOptimization } from '@/types/gps';
import { Trip } from '@/types/tripManagement';
import { useToast } from '@/hooks/use-toast';

// Haversine formula for calculating distance between two coordinates
const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
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

// Generate interpolated route points between origin and destination
const generateRoutePoints = (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  numPoints: number = 10
): Array<{ latitude: number; longitude: number }> => {
  const points: Array<{ latitude: number; longitude: number }> = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Add some realistic road-like curvature
    const latOffset = Math.sin(t * Math.PI) * 0.01 * (Math.random() - 0.5);
    const lonOffset = Math.sin(t * Math.PI * 2) * 0.005 * (Math.random() - 0.5);
    
    points.push({
      latitude: origin.latitude + (destination.latitude - origin.latitude) * t + latOffset,
      longitude: origin.longitude + (destination.longitude - origin.longitude) * t + lonOffset,
    });
  }
  
  return points;
};

// Calculate route distance from array of points
const calculateRouteDistance = (points: Array<{ latitude: number; longitude: number }>): number => {
  let distance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    distance += haversineDistance(
      points[i].latitude,
      points[i].longitude,
      points[i + 1].latitude,
      points[i + 1].longitude
    );
  }
  return distance;
};

// Simulate traffic conditions based on time of day
const getTrafficConditions = (): 'light' | 'moderate' | 'heavy' => {
  const hour = new Date().getHours();
  if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
    return Math.random() > 0.3 ? 'heavy' : 'moderate';
  } else if ((hour >= 7 && hour <= 11) || (hour >= 16 && hour <= 21)) {
    return Math.random() > 0.5 ? 'moderate' : 'light';
  }
  return 'light';
};

// Calculate estimated duration based on distance and traffic
const calculateDuration = (
  distance: number,
  trafficConditions: 'light' | 'moderate' | 'heavy'
): number => {
  const baseSpeed = 40; // km/h base speed
  const trafficMultiplier = {
    light: 1.0,
    moderate: 1.3,
    heavy: 1.8,
  };
  
  const effectiveSpeed = baseSpeed / trafficMultiplier[trafficConditions];
  return (distance / effectiveSpeed) * 60; // minutes
};

export const useRouteOptimization = () => {
  const { toast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizations, setOptimizations] = useState<Map<string, RouteOptimization>>(new Map());

  const optimizeRoute = useCallback(async (trip: Trip): Promise<RouteOptimization | null> => {
    setIsOptimizing(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const trafficConditions = getTrafficConditions();
      
      // Generate original route
      const originalRoute = generateRoutePoints(
        trip.origin.location,
        trip.destination.location,
        8
      );
      const originalDistance = calculateRouteDistance(originalRoute);
      const originalDuration = calculateDuration(originalDistance, trafficConditions);

      // Generate optimized route (usually shorter or faster)
      const optimizedRoute = generateRoutePoints(
        trip.origin.location,
        trip.destination.location,
        6 // Fewer points = more direct
      );
      const optimizedDistance = calculateRouteDistance(optimizedRoute) * 0.92; // 8% shorter
      const optimizedDuration = calculateDuration(optimizedDistance, trafficConditions) * 0.85; // 15% faster

      // Generate alternative routes
      const alternativeRoutes = [
        {
          route: generateRoutePoints(trip.origin.location, trip.destination.location, 12),
          distance: Math.round(originalDistance * 1.15),
          duration: Math.round(originalDuration * 0.9),
          description: 'Highway route - longer but faster during off-peak',
        },
        {
          route: generateRoutePoints(trip.origin.location, trip.destination.location, 10),
          distance: Math.round(originalDistance * 0.95),
          duration: Math.round(originalDuration * 1.1),
          description: 'Scenic route - slightly shorter but slower',
        },
      ];

      const optimization: RouteOptimization = {
        tripId: trip.id,
        originalRoute,
        optimizedRoute,
        originalDistance: Math.round(originalDistance * 10) / 10,
        optimizedDistance: Math.round(optimizedDistance * 10) / 10,
        originalDuration: Math.round(originalDuration),
        optimizedDuration: Math.round(optimizedDuration),
        trafficConditions,
        alternativeRoutes,
        calculatedAt: new Date().toISOString(),
      };

      setOptimizations(prev => new Map(prev).set(trip.id, optimization));
      
      toast({
        title: 'Route Optimized',
        description: `Saved ${Math.round(originalDistance - optimizedDistance)} km and ${Math.round(originalDuration - optimizedDuration)} min`,
      });

      return optimization;
    } catch (error) {
      console.error('Route optimization failed:', error);
      toast({
        title: 'Optimization Failed',
        description: 'Could not optimize route. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsOptimizing(false);
    }
  }, [toast]);

  const getOptimization = useCallback((tripId: string): RouteOptimization | undefined => {
    return optimizations.get(tripId);
  }, [optimizations]);

  const clearOptimization = useCallback((tripId: string) => {
    setOptimizations(prev => {
      const next = new Map(prev);
      next.delete(tripId);
      return next;
    });
  }, []);

  return {
    isOptimizing,
    optimizeRoute,
    getOptimization,
    clearOptimization,
    optimizations: Array.from(optimizations.values()),
  };
};
