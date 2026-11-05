import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateIncidentInput, IncidentType, IncidentSeverity } from "@/types/incident";
import { useToast } from "@/hooks/use-toast";

interface CreateIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateIncident: (input: CreateIncidentInput) => void;
}

export const CreateIncidentDialog = ({ open, onOpenChange, onCreateIncident }: CreateIncidentDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<CreateIncidentInput>({
    title: '',
    description: '',
    type: 'operational',
    severity: 'medium',
    location: '',
    vehicleRegNo: '',
    tags: [],
  });

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.location.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    onCreateIncident(formData);
    toast({
      title: "Incident Reported",
      description: `Incident "${formData.title}" has been created successfully`,
    });
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      type: 'operational',
      severity: 'medium',
      location: '',
      vehicleRegNo: '',
      tags: [],
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report New Incident</DialogTitle>
          <DialogDescription>
            Create a detailed incident report with all relevant information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Brief description of the incident"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Detailed description of what happened"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Incident Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: IncidentType) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="quality">Quality</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="environmental">Environmental</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity *</Label>
              <Select
                value={formData.severity}
                onValueChange={(value: IncidentSeverity) => setFormData(prev => ({ ...prev, severity: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              placeholder="e.g., Main Gate, Loading Bay 2, Weighbridge Station"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicleRegNo">Vehicle Registration (Optional)</Label>
            <Input
              id="vehicleRegNo"
              placeholder="e.g., KA-01-AB-1234"
              value={formData.vehicleRegNo}
              onChange={(e) => setFormData(prev => ({ ...prev, vehicleRegNo: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (Optional)</Label>
            <Input
              id="tags"
              placeholder="Comma-separated tags (e.g., urgent, safety, maintenance)"
              onChange={(e) => {
                const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                setFormData(prev => ({ ...prev, tags }));
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Report Incident
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
