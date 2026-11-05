import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Video, Image as ImageIcon } from "lucide-react";
import { Evidence } from "@/types/weighbridge";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EvidenceCaptureProps {
  evidence: Evidence[];
  onCapture: (angle: Evidence['angle']) => void;
}

const ANGLES: Array<{ angle: Evidence['angle']; label: string; color: string }> = [
  { angle: 'front', label: 'Front View', color: 'bg-blue-500' },
  { angle: 'side', label: 'Side View', color: 'bg-green-500' },
  { angle: 'rear', label: 'Rear View', color: 'bg-purple-500' },
  { angle: 'top', label: 'Top View', color: 'bg-orange-500' },
  { angle: 'load', label: 'Load View', color: 'bg-pink-500' },
];

const EvidenceCapture = ({ evidence, onCapture }: EvidenceCaptureProps) => {
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Evidence Capture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {ANGLES.map(({ angle, label }) => {
              const captured = evidence.find(e => e.angle === angle);
              return (
                <Button
                  key={angle}
                  variant={captured ? "default" : "outline"}
                  size="sm"
                  onClick={() => onCapture(angle)}
                  className="flex flex-col h-auto py-3"
                >
                  {captured ? <ImageIcon className="h-4 w-4 mb-1" /> : <Camera className="h-4 w-4 mb-1" />}
                  <span className="text-xs">{label}</span>
                </Button>
              );
            })}
          </div>

          {evidence.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Captured Evidence ({evidence.length})</div>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {evidence.map((item) => {
                  const angleConfig = ANGLES.find(a => a.angle === item.angle);
                  return (
                    <div
                      key={item.id}
                      className="relative aspect-video rounded-lg overflow-hidden border-2 border-primary cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedEvidence(item)}
                    >
                      <img
                        src={item.url}
                        alt={item.angle}
                        className="w-full h-full object-cover"
                      />
                      <Badge 
                        className={`absolute top-1 left-1 text-xs ${angleConfig?.color}`}
                      >
                        {item.angle}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedEvidence} onOpenChange={() => setSelectedEvidence(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="capitalize">{selectedEvidence?.angle} View</DialogTitle>
          </DialogHeader>
          {selectedEvidence && (
            <div className="space-y-2">
              <img
                src={selectedEvidence.url}
                alt={selectedEvidence.angle}
                className="w-full rounded-lg"
              />
              <div className="text-sm text-muted-foreground">
                Captured: {new Date(selectedEvidence.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EvidenceCapture;
