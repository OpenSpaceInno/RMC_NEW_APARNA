import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Incident, IncidentStatus } from "@/types/incident";
import { 
  Clock, User, MapPin, FileText, Image, MessageSquare, 
  CheckCircle, UserPlus, Send, AlertTriangle 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface IncidentDetailsDialogProps {
  incident: Incident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (incidentId: string, status: IncidentStatus) => void;
  onAssign: (incidentId: string, assignedTo: string) => void;
  onAddComment: (incidentId: string, comment: string) => void;
  onResolve: (incidentId: string, resolution: string) => void;
  onUpdateNotes: (incidentId: string, notes: string) => void;
}

export const IncidentDetailsDialog = ({
  incident,
  open,
  onOpenChange,
  onUpdateStatus,
  onAssign,
  onAddComment,
  onResolve,
  onUpdateNotes,
}: IncidentDetailsDialogProps) => {
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [resolution, setResolution] = useState('');
  const [investigationNotes, setInvestigationNotes] = useState(incident?.investigationNotes || '');

  if (!incident) return null;

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    onAddComment(incident.id, newComment);
    setNewComment('');
    toast({ title: "Comment Added", description: "Your comment has been added to the incident" });
  };

  const handleAssign = () => {
    if (!assignTo.trim()) return;
    onAssign(incident.id, assignTo);
    setAssignTo('');
    toast({ title: "Incident Assigned", description: `Incident assigned to ${assignTo}` });
  };

  const handleResolve = () => {
    if (!resolution.trim()) return;
    onResolve(incident.id, resolution);
    toast({ title: "Incident Resolved", description: "Incident has been marked as resolved" });
  };

  const handleUpdateNotes = () => {
    onUpdateNotes(incident.id, investigationNotes);
    toast({ title: "Notes Updated", description: "Investigation notes have been updated" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl">{incident.title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{incident.id}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{incident.type}</Badge>
              <Badge variant={incident.severity === 'critical' ? 'destructive' : 'default'}>
                {incident.severity}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status and Actions */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Status</Label>
              <Select
                value={incident.status}
                onValueChange={(value: IncidentStatus) => {
                  onUpdateStatus(incident.id, value);
                  toast({ title: "Status Updated", description: `Incident status changed to ${value}` });
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reported">Reported</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{incident.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">
                {new Date(incident.reportedAt).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{incident.reportedBy}</span>
            </div>
            {incident.vehicleRegNo && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{incident.vehicleRegNo}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground">{incident.description}</p>
          </div>

          <Separator />

          {/* Assignment */}
          {!incident.assignedTo && incident.status !== 'resolved' && incident.status !== 'closed' && (
            <div className="space-y-2">
              <Label htmlFor="assign">Assign To</Label>
              <div className="flex gap-2">
                <Input
                  id="assign"
                  placeholder="Enter name or email"
                  value={assignTo}
                  onChange={(e) => setAssignTo(e.target.value)}
                />
                <Button onClick={handleAssign}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign
                </Button>
              </div>
            </div>
          )}

          {incident.assignedTo && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
              <UserPlus className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Assigned To</p>
                <p className="text-sm text-muted-foreground">{incident.assignedTo}</p>
              </div>
            </div>
          )}

          {/* Investigation Notes */}
          {incident.status === 'investigating' && (
            <div className="space-y-2">
              <Label htmlFor="notes">Investigation Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add investigation findings and notes..."
                value={investigationNotes}
                onChange={(e) => setInvestigationNotes(e.target.value)}
                rows={4}
              />
              <Button onClick={handleUpdateNotes} size="sm">
                Save Notes
              </Button>
            </div>
          )}

          {/* Evidence */}
          {incident.evidence.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Image className="h-4 w-4" />
                Evidence ({incident.evidence.length})
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {incident.evidence.map((ev) => (
                  <div key={ev.id} className="border rounded-lg p-3 space-y-2">
                    {ev.type === 'image' ? (
                      <img 
                        src={ev.url} 
                        alt={ev.fileName} 
                        className="w-full h-32 object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium truncate">{ev.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ev.uploadedAt).toLocaleDateString()}
                      </p>
                      {ev.description && (
                        <p className="text-xs text-muted-foreground mt-1">{ev.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolution */}
          {incident.status === 'investigating' && (
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution</Label>
              <Textarea
                id="resolution"
                placeholder="Describe how this incident was resolved..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={3}
              />
              <Button onClick={handleResolve} className="bg-success text-success-foreground hover:bg-success/90">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Resolved
              </Button>
            </div>
          )}

          {incident.resolution && (
            <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
              <h3 className="font-semibold text-success mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Resolution
              </h3>
              <p className="text-sm text-foreground">{incident.resolution}</p>
              {incident.resolvedAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  Resolved on {new Date(incident.resolvedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          <Separator />

          {/* Comments */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments ({incident.comments.length})
            </h3>
            <div className="space-y-3 mb-4">
              {incident.comments.map((comment) => (
                <div key={comment.id} className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{comment.userName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{comment.comment}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
              />
              <Button onClick={handleAddComment}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
