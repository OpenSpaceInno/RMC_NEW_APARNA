import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Incident } from "@/types/incident";
import { Clock, User, MapPin, AlertTriangle, CheckCircle, FileText } from "lucide-react";

interface IncidentCardProps {
  incident: Incident;
  onClick: () => void;
}

const getSeverityColor = (severity: Incident['severity']) => {
  switch (severity) {
    case 'critical': return 'destructive';
    case 'high': return 'default';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
  }
};

const getStatusColor = (status: Incident['status']) => {
  switch (status) {
    case 'reported': return 'bg-warning text-warning-foreground';
    case 'investigating': return 'bg-info text-info-foreground';
    case 'resolved': return 'bg-success text-success-foreground';
    case 'closed': return 'bg-muted text-muted-foreground';
  }
};

const getTypeIcon = (type: Incident['type']) => {
  switch (type) {
    case 'safety': return '🛡️';
    case 'quality': return '✓';
    case 'operational': return '⚙️';
    case 'security': return '🔒';
    case 'environmental': return '🌱';
    case 'equipment': return '🔧';
  }
};

export const IncidentCard = ({ incident, onClick }: IncidentCardProps) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <span className="text-2xl">{getTypeIcon(incident.type)}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground">{incident.title}</h3>
                <Badge variant={getSeverityColor(incident.severity)}>
                  {incident.severity}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {incident.description}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(incident.status)}>
            {incident.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{incident.id}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{new Date(incident.reportedAt).toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{incident.location}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="truncate">{incident.reportedBy.split(' - ')[1] || incident.reportedBy}</span>
          </div>
        </div>

        {incident.assignedTo && (
          <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
            <User className="h-4 w-4 text-primary" />
            <span className="text-foreground">Assigned to: {incident.assignedTo}</span>
          </div>
        )}

        {incident.vehicleRegNo && (
          <Badge variant="outline">{incident.vehicleRegNo}</Badge>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span>{incident.evidence.length} evidence</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>{incident.comments.length} comments</span>
          </div>
        </div>

        {incident.tags && incident.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {incident.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
