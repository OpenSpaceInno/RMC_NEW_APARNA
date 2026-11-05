import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, TrendingUp, Clock } from "lucide-react";
import { useDispatchApproval } from "@/hooks/useDispatchApproval";
import { useToast } from "@/hooks/use-toast";
import ApprovalCard from "@/components/dispatch/ApprovalCard";
import RouteAssignmentDialog from "@/components/dispatch/RouteAssignmentDialog";
import DispatchDetailsDialog from "@/components/dispatch/DispatchDetailsDialog";
import { PendingDispatch, RouteAssignment } from "@/types/dispatch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DispatchApproval = () => {
  const { pendingDispatches, approveDispatch, assignRoute, verifyDocument } = useDispatchApproval();
  const { toast } = useToast();
  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<PendingDispatch | null>(null);

  const handleApprove = (id: string) => {
    approveDispatch({ dispatchId: id, action: 'approve' });
    toast({
      title: "Dispatch Approved",
      description: "Vehicle has been approved for dispatch",
    });
  };

  const handleReject = (id: string, reason: string) => {
    approveDispatch({ dispatchId: id, action: 'reject', reason });
    toast({
      title: "Dispatch Rejected",
      description: reason,
      variant: "destructive",
    });
  };

  const handleViewDetails = (dispatch: PendingDispatch) => {
    setSelectedDispatch(dispatch);
    setDetailsDialogOpen(true);
  };

  const handleAssignRoute = (route: RouteAssignment) => {
    if (selectedDispatch) {
      assignRoute(selectedDispatch.id, route);
      toast({
        title: "Route Assigned",
        description: `Route to ${route.destination} assigned successfully`,
      });
    }
  };

  const openRouteDialog = () => {
    setDetailsDialogOpen(false);
    setRouteDialogOpen(true);
  };

  const pendingCount = pendingDispatches.filter(d => d.status === 'pending').length;
  const approvedCount = pendingDispatches.filter(d => d.status === 'approved').length;
  const rejectedCount = pendingDispatches.filter(d => d.status === 'rejected').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dispatch Approval</h1>
          <p className="text-muted-foreground">Review documentation, assign routes, approve/reject dispatch</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Ready for dispatch</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Dispatch List */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingDispatches.filter(d => d.status === 'pending').length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending approvals
              </CardContent>
            </Card>
          ) : (
            pendingDispatches
              .filter(d => d.status === 'pending')
              .map(dispatch => (
                <ApprovalCard
                  key={dispatch.id}
                  dispatch={dispatch}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onViewDetails={handleViewDetails}
                />
              ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {pendingDispatches.filter(d => d.status === 'approved').length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No approved dispatches
              </CardContent>
            </Card>
          ) : (
            pendingDispatches
              .filter(d => d.status === 'approved')
              .map(dispatch => (
                <ApprovalCard
                  key={dispatch.id}
                  dispatch={dispatch}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onViewDetails={handleViewDetails}
                />
              ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {pendingDispatches.filter(d => d.status === 'rejected').length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No rejected dispatches
              </CardContent>
            </Card>
          ) : (
            pendingDispatches
              .filter(d => d.status === 'rejected')
              .map(dispatch => (
                <ApprovalCard
                  key={dispatch.id}
                  dispatch={dispatch}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onViewDetails={handleViewDetails}
                />
              ))
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <RouteAssignmentDialog
        open={routeDialogOpen}
        onOpenChange={setRouteDialogOpen}
        vehicleRegNo={selectedDispatch?.vehicleRegNo}
        orderNumber={selectedDispatch?.id}
        onAssign={handleAssignRoute}
      />

      <DispatchDetailsDialog
        dispatch={selectedDispatch}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onAssignRoute={openRouteDialog}
      />
    </div>
  );
};

export default DispatchApproval;
