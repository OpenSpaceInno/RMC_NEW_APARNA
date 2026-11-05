import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Driver, TripAssignment } from "@/types/driver";
import { 
  User, Phone, Mail, MapPin, Calendar, Star, Truck, 
  CreditCard, Shield, Clock, Route, CheckCircle, XCircle
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DriverDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: Driver | null;
  assignments: TripAssignment[];
}

const statusConfig = {
  available: { label: 'Available', className: 'bg-green-500/10 text-green-600' },
  on_trip: { label: 'On Trip', className: 'bg-blue-500/10 text-blue-600' },
  on_leave: { label: 'On Leave', className: 'bg-amber-500/10 text-amber-600' },
  suspended: { label: 'Suspended', className: 'bg-red-500/10 text-red-600' },
  inactive: { label: 'Inactive', className: 'bg-muted text-muted-foreground' },
};

const assignmentStatusConfig = {
  assigned: { label: 'Assigned', className: 'bg-amber-500/10 text-amber-600' },
  in_progress: { label: 'In Progress', className: 'bg-blue-500/10 text-blue-600' },
  completed: { label: 'Completed', className: 'bg-green-500/10 text-green-600' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/10 text-red-600' },
};

export function DriverDetailsDialog({ open, onOpenChange, driver, assignments }: DriverDetailsDialogProps) {
  if (!driver) return null;

  const statusInfo = statusConfig[driver.status];
  const daysUntilExpiry = differenceInDays(new Date(driver.license.expiryDate), new Date());
  const completedTrips = assignments.filter(a => a.status === 'completed');
  const avgRating = completedTrips.length > 0 
    ? completedTrips.reduce((sum, a) => sum + (a.rating || 0), 0) / completedTrips.filter(a => a.rating).length
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Driver Details</DialogTitle>
            <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="license">License & Documents</TabsTrigger>
            <TabsTrigger value="history">Assignment History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* Profile Header */}
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-10 w-10 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">{driver.name}</h2>
                <p className="text-muted-foreground">{driver.employeeId}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="font-semibold">{driver.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{driver.totalTrips} trips</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{(driver.totalDistance / 1000).toFixed(1)}k km</span>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-foreground">{driver.totalTrips}</div>
                  <p className="text-xs text-muted-foreground">Total Trips</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-foreground">{(driver.totalDistance / 1000).toFixed(1)}k</div>
                  <p className="text-xs text-muted-foreground">Km Driven</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-foreground">{driver.rating.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">Avg Rating</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-foreground">
                    {completedTrips.filter(t => t.rating && t.rating >= 4).length}
                  </div>
                  <p className="text-xs text-muted-foreground">5-Star Trips</p>
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{driver.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{driver.email}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{driver.address}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{driver.emergencyContact.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{driver.emergencyContact.relation}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{driver.emergencyContact.phone}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Employment Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Employment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Date of Birth</p>
                    <p className="text-sm font-medium">{format(new Date(driver.dateOfBirth), 'dd MMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date of Joining</p>
                    <p className="text-sm font-medium">{format(new Date(driver.dateOfJoining), 'dd MMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned Vehicle</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      {driver.assignedVehicle ? (
                        <>
                          <Truck className="h-3 w-3" />
                          {driver.assignedVehicle}
                        </>
                      ) : (
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="license" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Driving License
                  </CardTitle>
                  <Badge 
                    variant={driver.license.status === 'valid' ? 'default' : 'destructive'}
                    className={driver.license.status === 'valid' ? 'bg-green-500' : driver.license.status === 'expiring_soon' ? 'bg-amber-500' : ''}
                  >
                    {driver.license.status === 'expiring_soon' ? `Expires in ${daysUntilExpiry} days` : driver.license.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">License Number</p>
                    <p className="text-sm font-mono font-medium">{driver.license.number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">License Type</p>
                    <p className="text-sm font-medium">{driver.license.type}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Issue Date</p>
                    <p className="text-sm font-medium">{format(new Date(driver.license.issueDate), 'dd MMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expiry Date</p>
                    <p className="text-sm font-medium">{format(new Date(driver.license.expiryDate), 'dd MMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Issuing Authority</p>
                    <p className="text-sm font-medium">{driver.license.issuingAuthority}</p>
                  </div>
                </div>

                {/* License Validity Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">License Validity</span>
                    <span className="text-muted-foreground">
                      {daysUntilExpiry > 0 ? `${daysUntilExpiry} days remaining` : 'Expired'}
                    </span>
                  </div>
                  <Progress 
                    value={Math.max(0, Math.min(100, (daysUntilExpiry / 3650) * 100))} 
                    className="h-2"
                  />
                </div>

                {driver.license.endorsements.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Endorsements</p>
                    <div className="flex flex-wrap gap-2">
                      {driver.license.endorsements.map((endorsement, index) => (
                        <Badge key={index} variant="outline">{endorsement}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  Assignment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {assignments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No assignment history available
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assignments.map((assignment) => (
                        <div 
                          key={assignment.id} 
                          className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-foreground">{assignment.tripId}</p>
                              <p className="text-sm text-muted-foreground">{assignment.customer}</p>
                            </div>
                            <Badge className={assignmentStatusConfig[assignment.status].className}>
                              {assignmentStatusConfig[assignment.status].label}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                            <div className="flex items-center gap-1">
                              <Truck className="h-3 w-3 text-muted-foreground" />
                              <span>{assignment.vehicleRegNo}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate">{assignment.destination}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span>{format(new Date(assignment.assignedAt), 'dd MMM yyyy')}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <span className="text-muted-foreground">
                                {assignment.material} • {(assignment.quantity / 1000).toFixed(1)} tons
                              </span>
                              <span className="text-muted-foreground">
                                {assignment.distance} km
                              </span>
                              {assignment.duration && (
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {assignment.duration} min
                                </span>
                              )}
                            </div>
                            {assignment.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                <span className="font-medium">{assignment.rating}</span>
                              </div>
                            )}
                          </div>

                          {assignment.feedback && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              "{assignment.feedback}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
