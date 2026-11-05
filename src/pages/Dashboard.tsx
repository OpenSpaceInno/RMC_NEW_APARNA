import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Truck, Package, AlertCircle, Factory, TrendingUp } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { StatCard } from "@/components/dashboard/StatCard";
import { OperationsChart } from "@/components/dashboard/OperationsChart";
import { BayUtilizationChart } from "@/components/dashboard/BayUtilizationChart";
import { ActiveTripsMonitor } from "@/components/dashboard/ActiveTripsMonitor";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { stats, operationalData, bayUtilizationData } = useDashboard();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Operations Dashboard</h1>
          <p className="text-muted-foreground">Real-time KPIs, alerts, and live feeds</p>
        </div>
      </div>

      {/* Main Statistics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Vehicles"
          value={stats.activeVehicles}
          icon={Truck}
          badge={<Badge variant="secondary">In Plant</Badge>}
          description="Vehicles currently in operations"
        />

        <StatCard
          title="Today's Dispatches"
          value={stats.todayDispatches}
          icon={Package}
          badge={<Badge className="bg-success text-success-foreground">+12% vs yesterday</Badge>}
          description="Total dispatches completed today"
        />

        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={AlertCircle}
          badge={<Badge className="bg-warning text-warning-foreground">Requires Action</Badge>}
          onClick={() => navigate('/dispatch')}
          description="Click to review pending approvals"
        />

        <StatCard
          title="Active Alerts"
          value={stats.activeAlerts}
          icon={AlertCircle}
          badge={stats.activeAlerts > 0 ? <Badge variant="destructive">Critical</Badge> : <Badge variant="secondary">All Clear</Badge>}
          description="System alerts and warnings"
        />
      </div>

      {/* Secondary Statistics */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Active Trips"
          value={stats.activeTrips}
          icon={TrendingUp}
          badge={<Badge variant="secondary">{stats.delayedTrips} delayed</Badge>}
          onClick={() => navigate('/trip-tracking')}
          description="Click to view trip tracking"
        />

        <StatCard
          title="Loading Bays"
          value={`${stats.baysLoading}/${stats.totalBays}`}
          icon={Factory}
          badge={<Badge variant="secondary">{stats.bayUtilization}% utilized</Badge>}
          onClick={() => navigate('/loading')}
          description="Click to view loading console"
        />

        <StatCard
          title="Completed Trips"
          value={stats.completedTrips}
          icon={Package}
          badge={<Badge className="bg-success text-success-foreground">Today</Badge>}
          description="Successfully completed deliveries"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <OperationsChart data={operationalData} />
        <BayUtilizationChart data={bayUtilizationData} />
      </div>

      {/* Active Trips Monitor */}
      <ActiveTripsMonitor />
    </div>
  );
};


export default Dashboard;
