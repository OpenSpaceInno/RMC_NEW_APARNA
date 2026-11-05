import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Evidence } from "@/types/anpr";
import { Image as ImageIcon, Video, Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EvidenceGalleryProps {
  evidence: Evidence[];
  eventId: string;
}

export function EvidenceGallery({ evidence, eventId }: EvidenceGalleryProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);

  const getAngleBadgeColor = (angle: string) => {
    switch (angle) {
      case "front":
        return "bg-info text-info-foreground";
      case "plate":
        return "bg-primary text-primary-foreground";
      case "side":
        return "bg-secondary text-secondary-foreground";
      case "rear":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Evidence Gallery</CardTitle>
          <CardDescription>
            {evidence.length} captured images • Event: {eventId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {evidence.map((item, index) => (
              <div
                key={index}
                className="group relative rounded-lg overflow-hidden border border-border hover:border-primary transition-all cursor-pointer"
                onClick={() => setSelectedEvidence(item)}
              >
                <div className="aspect-video bg-muted relative">
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={`${item.angle} view`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <Maximize2 className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge className={getAngleBadgeColor(item.angle)} variant="secondary">
                      {item.angle}
                    </Badge>
                    {item.type === "video" ? (
                      <Video className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ImageIcon className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedEvidence} onOpenChange={() => setSelectedEvidence(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Evidence View
              {selectedEvidence && (
                <Badge className={getAngleBadgeColor(selectedEvidence.angle)}>
                  {selectedEvidence.angle}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedEvidence && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border border-border">
                <img
                  src={selectedEvidence.url}
                  alt={`${selectedEvidence.angle} view`}
                  className="w-full h-auto"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Type: {selectedEvidence.type}</p>
                <p>Timestamp: {new Date(selectedEvidence.timestamp).toLocaleString()}</p>
                <p>Angle: {selectedEvidence.angle}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
