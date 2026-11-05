import { useState, useEffect, useCallback } from "react";
import { ANPREvent } from "@/types/anpr";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Real-time ANPR events with database integration
export const useANPREvents = () => {
  const [events, setEvents] = useState<ANPREvent[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [loading, setLoading] = useState(true);

  // Load events from database
  const loadEvents = useCallback(async () => {
    try {
      const data = await api.getANPREvents({ limit: 50 });
      
      // Transform database format to frontend format
      const transformedEvents: ANPREvent[] = data.map((event: any) => ({
        eventId: event.event_id,
        type: 'ANPR_READ' as const,
        timestamp: event.timestamp,
        plantId: event.plant_id,
        cameraId: event.camera_id,
        vehicleRegNo: event.vehicle_reg_no,
        confidence: parseFloat(event.confidence),
        source: event.source,
        evidence: event.evidence || [],
        status: event.status as 'pending' | 'confirmed' | 'rejected' | 'manual_override',
        operatorNote: event.operator_note,
      }));
      
      setEvents(transformedEvents);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to load ANPR events:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Poll for new events every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadEvents();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadEvents]);

  // NOTE: Mock event generation disabled - using live camera feed only
  // Events are now created by LiveANPRDetector component when plates are detected from video

  const confirmEvent = useCallback(async (eventId: string, note?: string) => {
    try {
      await api.updateANPREvent(eventId, {
        status: 'confirmed',
        operator_note: note,
      });
      
      setEvents((prev) =>
        prev.map((event) =>
          event.eventId === eventId
            ? { ...event, status: "confirmed" as const, operatorNote: note }
            : event
        )
      );
      
      toast.success("Vehicle Entry Confirmed", {
        description: "Data pushed to ERP system",
      });
    } catch (error) {
      toast.error("Failed to confirm event", {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, []);

  const rejectEvent = useCallback(async (eventId: string, note: string) => {
    try {
      await api.updateANPREvent(eventId, {
        status: 'rejected',
        operator_note: note,
      });
      
      setEvents((prev) =>
        prev.map((event) =>
          event.eventId === eventId
            ? { ...event, status: "rejected" as const, operatorNote: note }
            : event
        )
      );
      
      toast.error("Vehicle Entry Rejected", {
        description: note,
      });
    } catch (error) {
      toast.error("Failed to reject event", {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, []);

  const overrideEvent = useCallback(async (eventId: string, newPlateNo: string, note: string) => {
    try {
      await api.updateANPREvent(eventId, {
        status: 'manual_override',
        vehicle_reg_no: newPlateNo,
        operator_note: note,
      });
      
      setEvents((prev) =>
        prev.map((event) =>
          event.eventId === eventId
            ? {
                ...event,
                vehicleRegNo: newPlateNo,
                status: "manual_override" as const,
                operatorNote: note,
              }
            : event
        )
      );
      
      toast.warning("Manual Override Applied", {
        description: `Plate corrected to ${newPlateNo}`,
      });
    } catch (error) {
      toast.error("Failed to override event", {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, []);

  return {
    events,
    isConnected,
    loading,
    confirmEvent,
    rejectEvent,
    overrideEvent,
    refreshEvents: loadEvents,
  };
};
