import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, Filter } from "lucide-react";
import { useIncidents } from "@/hooks/useIncidents";
import { IncidentCard } from "@/components/incident/IncidentCard";
import { CreateIncidentDialog } from "@/components/incident/CreateIncidentDialog";
import { IncidentDetailsDialog } from "@/components/incident/IncidentDetailsDialog";
import { Skeleton } from "@/components/ui/skeleton";

const IncidentManagement = () => {
  const {
    incidents,
    loading,
    selectedIncident,
    setSelectedIncident,
    createIncident,
    updateIncidentStatus,
    assignIncident,
    addComment,
    resolveIncident,
    updateInvestigationNotes,
  } = useIncidents();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const handleIncidentClick = (incident: typeof incidents[0]) => {
    setSelectedIncident(incident);
    setDetailsDialogOpen(true);
  };

  const filterIncidents = (status?: string) => {
    if (status === 'all') return incidents;
    return incidents.filter(inc => inc.status === status);
  };

  const reportedCount = incidents.filter(i => i.status === 'reported').length;
  const investigatingCount = incidents.filter(i => i.status === 'investigating').length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved').length;
  const criticalCount = incidents.filter(i => i.severity === 'critical').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Incident Management</h1>
            <p className="text-muted-foreground">Track, investigate, and resolve operational incidents</p>
          </div>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Report Incident
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Incidents</CardDescription>
            <CardTitle className="text-3xl">{incidents.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">All Time</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Reported</CardDescription>
            <CardTitle className="text-3xl">{reportedCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-warning text-warning-foreground">Needs Action</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Investigating</CardDescription>
            <CardTitle className="text-3xl">{investigatingCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-info text-info-foreground">In Progress</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Critical Issues</CardDescription>
            <CardTitle className="text-3xl">{criticalCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="destructive">High Priority</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Incidents List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Incident Reports</CardTitle>
              <CardDescription>View and manage all operational incidents</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">
                All ({incidents.length})
              </TabsTrigger>
              <TabsTrigger value="reported">
                Reported ({reportedCount})
              </TabsTrigger>
              <TabsTrigger value="investigating">
                Investigating ({investigatingCount})
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resolved ({resolvedCount})
              </TabsTrigger>
              <TabsTrigger value="closed">
                Closed
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : filterIncidents(activeTab).length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No incidents found in this category</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filterIncidents(activeTab).map((incident) => (
                    <IncidentCard
                      key={incident.id}
                      incident={incident}
                      onClick={() => handleIncidentClick(incident)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateIncidentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateIncident={createIncident}
      />

      <IncidentDetailsDialog
        incident={selectedIncident}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onUpdateStatus={updateIncidentStatus}
        onAssign={assignIncident}
        onAddComment={addComment}
        onResolve={resolveIncident}
        onUpdateNotes={updateInvestigationNotes}
      />
    </div>
  );
};


export default IncidentManagement;
