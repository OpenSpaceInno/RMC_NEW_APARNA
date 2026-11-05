import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ANPREvent } from "@/types/anpr";
import { CheckCircle, XCircle, Edit3, Clock } from "lucide-react";

interface EventHistoryListProps {
  events: ANPREvent[];
  onSelectEvent: (event: ANPREvent) => void;
  selectedEventId?: string;
}

export function EventHistoryList({ events, onSelectEvent, selectedEventId }: EventHistoryListProps) {
  const getStatusIcon = (status: ANPREvent["status"]) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "manual_override":
        return <Edit3 className="h-4 w-4 text-warning" />;
      case "pending":
        return <Clock className="h-4 w-4 text-info" />;
    }
  };

  const getStatusBadge = (status: ANPREvent["status"]) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-success text-success-foreground">Confirmed</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "manual_override":
        return <Badge className="bg-warning text-warning-foreground">Override</Badge>;
      case "pending":
        return <Badge className="bg-info text-info-foreground">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event History</CardTitle>
        <CardDescription>Recent ANPR detections and actions</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.eventId}
                onClick={() => onSelectEvent(event)}
                className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                  selectedEventId === event.eventId
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(event.status)}
                    <span className="font-mono font-semibold">{event.vehicleRegNo}</span>
                  </div>
                  {getStatusBadge(event.status)}
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    Confidence: <span className="font-medium">{(event.confidence * 100).toFixed(1)}%</span>
                  </p>
                  <p>{new Date(event.timestamp).toLocaleString()}</p>
                  {event.operatorNote && (
                    <p className="text-xs italic mt-2 text-foreground/70">
                      Note: {event.operatorNote}
                    </p>
                  )}
                </div>
                <div className="mt-2 flex gap-1">
                  {event.evidence.slice(0, 3).map((evidence, idx) => (
                    <div
                      key={idx}
                      className="h-12 w-16 rounded border border-border overflow-hidden"
                    >
                      <img
                        src={evidence.thumbnailUrl || evidence.url}
                        alt={evidence.angle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
