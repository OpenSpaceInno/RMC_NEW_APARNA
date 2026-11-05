import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ANPREvent } from "@/types/anpr";
import { CheckCircle, XCircle, Edit3, Zap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const overrideSchema = z.object({
  plateNumber: z.string()
    .trim()
    .min(1, "Plate number is required")
    .max(20, "Plate number too long")
    .regex(/^[A-Z0-9]+$/, "Only uppercase letters and numbers allowed"),
  note: z.string()
    .trim()
    .min(5, "Please provide a reason (min 5 characters)")
    .max(200, "Note too long (max 200 characters)"),
});

type OverrideFormValues = z.infer<typeof overrideSchema>;

interface PlateInputCardProps {
  event: ANPREvent | null;
  onConfirm: (eventId: string, note?: string) => void;
  onReject: (eventId: string, note: string) => void;
  onOverride: (eventId: string, newPlateNo: string, note: string) => void;
}

export function PlateInputCard({ event, onConfirm, onReject, onOverride }: PlateInputCardProps) {
  const [isOverriding, setIsOverriding] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const form = useForm<OverrideFormValues>({
    resolver: zodResolver(overrideSchema),
    defaultValues: {
      plateNumber: event?.vehicleRegNo.toUpperCase() || "",
      note: "",
    },
  });

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.92) return "bg-success text-success-foreground";
    if (confidence >= 0.85) return "bg-warning text-warning-foreground";
    return "bg-destructive text-destructive-foreground";
  };

  const handleOverrideSubmit = (values: OverrideFormValues) => {
    if (event) {
      onOverride(event.eventId, values.plateNumber, values.note);
      setIsOverriding(false);
      form.reset();
    }
  };

  const handleReject = () => {
    if (event && rejectNote.trim().length >= 5) {
      onReject(event.eventId, rejectNote);
      setRejectNote("");
    }
  };

  if (!event) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Detection</CardTitle>
          <CardDescription>Waiting for ANPR event...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-3 animate-pulse" />
            <p>Monitoring gate entry for vehicles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (event.status !== "pending") {
    return null;
  }

  return (
    <Card className="border-primary/50 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Vehicle Detected</CardTitle>
            <CardDescription>Event ID: {event.eventId}</CardDescription>
          </div>
          <Badge className={getConfidenceColor(event.confidence)}>
            {(event.confidence * 100).toFixed(1)}% Confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isOverriding ? (
          <>
            <div className="space-y-2">
              <Label>Vehicle Registration Number</Label>
              <div className="flex gap-2">
                <Input
                  value={event.vehicleRegNo}
                  readOnly
                  className="font-mono text-lg font-semibold bg-muted"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsOverriding(true)}
                  title="Manual Override"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Auto-detected by {event.source} at {new Date(event.timestamp).toLocaleTimeString()}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => onConfirm(event.eventId)}
                className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Entry
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  const note = prompt("Reason for rejection:");
                  if (note && note.trim().length >= 5) {
                    onReject(event.eventId, note);
                  }
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>

            {event.confidence < 0.92 && (
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-md">
                <p className="text-sm text-warning-foreground">
                  ⚠️ Confidence below auto-confirm threshold (92%). Please verify manually.
                </p>
              </div>
            )}
          </>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleOverrideSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="plateNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corrected Plate Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="KA05AB1234"
                        className="font-mono text-lg uppercase"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the correct vehicle registration number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Override</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="e.g., Plate was partially obscured, OCR misread characters..."
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Required for audit trail (min 5 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-warning hover:bg-warning/90 text-warning-foreground">
                  Apply Override
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsOverriding(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
