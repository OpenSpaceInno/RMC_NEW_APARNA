import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ActiveTrip } from '@/types/trip';

// Lazy load the map component to avoid SSR issues with Leaflet
const TripMapContent = lazy(() => import('./TripMapContent'));

interface TripMapProps {
  trip: ActiveTrip;
}

const TripMap = ({ trip }: TripMapProps) => {
  return (
    <Suspense fallback={
      <div className="relative w-full h-[500px] rounded-lg overflow-hidden border border-border">
        <Skeleton className="w-full h-full" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    }>
      <TripMapContent trip={trip} />
    </Suspense>
  );
};

export default TripMap;
