import { useMemo } from 'react';
import { Trip } from '@/types/tripManagement';
import { TripAnalytics } from '@/types/gps';
import { subDays, format, startOfDay, getHours } from 'date-fns';

export const useTripAnalytics = (trips: Trip[]) => {
  const generateAnalytics = useMemo(() => {
    return (period: 'day' | 'week' | 'month'): TripAnalytics => {
      const now = new Date();
      const periodDays = period === 'day' ? 1 : period === 'week' ? 7 : 30;
      const startDate = subDays(now, periodDays);

      const periodTrips = trips.filter(t => 
        new Date(t.createdAt) >= startDate
      );

      const completedTrips = periodTrips.filter(t => t.status === 'completed');
      const cancelledTrips = periodTrips.filter(t => t.status === 'cancelled');
      const delayedTrips = periodTrips.filter(t => t.status === 'delayed');

      // Calculate on-time delivery rate
      const onTimeTrips = completedTrips.filter(t => {
        if (!t.actualArrival) return false;
        const actual = new Date(t.actualArrival).getTime();
        const estimated = new Date(t.estimatedArrival).getTime();
        return actual <= estimated + 15 * 60000; // 15 min buffer
      });
      const onTimeDeliveryRate = completedTrips.length > 0 
        ? (onTimeTrips.length / completedTrips.length) * 100 
        : 100;

      // Calculate average delivery time
      const avgDeliveryTime = completedTrips.length > 0
        ? completedTrips.reduce((sum, t) => {
            if (!t.actualStartTime || !t.completedAt) return sum;
            const start = new Date(t.actualStartTime).getTime();
            const end = new Date(t.completedAt).getTime();
            return sum + (end - start) / 60000;
          }, 0) / completedTrips.length
        : 0;

      // Calculate total distance
      const totalDistance = completedTrips.reduce((sum, t) => sum + t.totalDistance, 0);

      // Calculate average speed
      const avgSpeed = completedTrips.length > 0 && avgDeliveryTime > 0
        ? (totalDistance / completedTrips.length) / (avgDeliveryTime / 60)
        : 0;

      // Driver metrics
      const driverMap = new Map<string, {
        driverId: string;
        driverName: string;
        trips: Trip[];
      }>();

      periodTrips.forEach(t => {
        if (!driverMap.has(t.driverId)) {
          driverMap.set(t.driverId, {
            driverId: t.driverId,
            driverName: t.driverName,
            trips: [],
          });
        }
        driverMap.get(t.driverId)!.trips.push(t);
      });

      const driverMetrics = Array.from(driverMap.values()).map(driver => {
        const completed = driver.trips.filter(t => t.status === 'completed');
        const onTime = completed.filter(t => {
          if (!t.actualArrival) return false;
          const actual = new Date(t.actualArrival).getTime();
          const estimated = new Date(t.estimatedArrival).getTime();
          return actual <= estimated + 15 * 60000;
        });
        
        const driverAvgTime = completed.length > 0
          ? completed.reduce((sum, t) => {
              if (!t.actualStartTime || !t.completedAt) return sum;
              const start = new Date(t.actualStartTime).getTime();
              const end = new Date(t.completedAt).getTime();
              return sum + (end - start) / 60000;
            }, 0) / completed.length
          : 0;

        return {
          driverId: driver.driverId,
          driverName: driver.driverName,
          tripsCompleted: completed.length,
          avgDeliveryTime: Math.round(driverAvgTime),
          onTimeRate: completed.length > 0 ? (onTime.length / completed.length) * 100 : 100,
          totalDistance: completed.reduce((sum, t) => sum + t.totalDistance, 0),
        };
      }).sort((a, b) => b.tripsCompleted - a.tripsCompleted);

      // Daily stats
      const dailyMap = new Map<string, {
        date: string;
        trips: number;
        completed: number;
        delayed: number;
        totalTime: number;
        completedCount: number;
      }>();

      for (let i = 0; i < periodDays; i++) {
        const day = format(subDays(now, i), 'yyyy-MM-dd');
        dailyMap.set(day, { date: day, trips: 0, completed: 0, delayed: 0, totalTime: 0, completedCount: 0 });
      }

      periodTrips.forEach(t => {
        const day = format(new Date(t.createdAt), 'yyyy-MM-dd');
        const stat = dailyMap.get(day);
        if (stat) {
          stat.trips++;
          if (t.status === 'completed') {
            stat.completed++;
            if (t.actualStartTime && t.completedAt) {
              stat.totalTime += (new Date(t.completedAt).getTime() - new Date(t.actualStartTime).getTime()) / 60000;
              stat.completedCount++;
            }
          }
          if (t.status === 'delayed') stat.delayed++;
        }
      });

      const dailyStats = Array.from(dailyMap.values())
        .map(s => ({
          date: s.date,
          trips: s.trips,
          completed: s.completed,
          delayed: s.delayed,
          avgTime: s.completedCount > 0 ? Math.round(s.totalTime / s.completedCount) : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Hourly distribution
      const hourlyMap = new Map<number, number>();
      for (let h = 0; h < 24; h++) {
        hourlyMap.set(h, 0);
      }

      periodTrips.forEach(t => {
        const hour = getHours(new Date(t.scheduledStartTime));
        hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
      });

      const hourlyDistribution = Array.from(hourlyMap.entries())
        .map(([hour, trips]) => ({ hour, trips }))
        .sort((a, b) => a.hour - b.hour);

      return {
        period,
        totalTrips: periodTrips.length,
        completedTrips: completedTrips.length,
        cancelledTrips: cancelledTrips.length,
        delayedTrips: delayedTrips.length,
        onTimeDeliveryRate: Math.round(onTimeDeliveryRate),
        avgDeliveryTime: Math.round(avgDeliveryTime),
        totalDistance: Math.round(totalDistance),
        avgSpeed: Math.round(avgSpeed),
        driverMetrics,
        dailyStats,
        hourlyDistribution,
      };
    };
  }, [trips]);

  return { generateAnalytics };
};
