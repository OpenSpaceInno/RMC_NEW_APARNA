import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Truck, 
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Target,
  Gauge,
  Route
} from "lucide-react";
import { useTripManagement } from "@/hooks/useTripManagement";
import { useTripAnalytics } from "@/hooks/useTripAnalytics";
import { format } from "date-fns";

const TripAnalytics = () => {
  const { trips } = useTripManagement();
  const { generateAnalytics } = useTripAnalytics(trips);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  
  const analytics = generateAnalytics(period);

  const pieData = [
    { name: 'Completed', value: analytics.completedTrips, color: 'hsl(var(--success))' },
    { name: 'Delayed', value: analytics.delayedTrips, color: 'hsl(var(--destructive))' },
    { name: 'Cancelled', value: analytics.cancelledTrips, color: 'hsl(var(--muted-foreground))' },
    { name: 'In Progress', value: analytics.totalTrips - analytics.completedTrips - analytics.delayedTrips - analytics.cancelledTrips, color: 'hsl(var(--primary))' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Trip Analytics</h1>
            <p className="text-muted-foreground">Delivery performance and driver efficiency metrics</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={period === 'day' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setPeriod('day')}
          >
            Today
          </Button>
          <Button 
            variant={period === 'week' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setPeriod('week')}
          >
            This Week
          </Button>
          <Button 
            variant={period === 'month' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setPeriod('month')}
          >
            This Month
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-3xl font-bold">{analytics.totalTrips}</div>
                <div className="text-sm text-muted-foreground">Total Trips</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Target className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <div className="text-3xl font-bold">{analytics.onTimeDeliveryRate}%</div>
                <div className="text-sm text-muted-foreground">On-Time Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <div className="text-3xl font-bold">{analytics.avgDeliveryTime}</div>
                <div className="text-sm text-muted-foreground">Avg Delivery (min)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <Route className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <div className="text-3xl font-bold">{analytics.totalDistance}</div>
                <div className="text-sm text-muted-foreground">Total Distance (km)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trip Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Trip Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Daily Trip Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                    className="text-muted-foreground"
                  />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'PPP')}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stackId="1"
                    stroke="hsl(var(--success))" 
                    fill="hsl(var(--success))"
                    fillOpacity={0.3}
                    name="Completed"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="delayed" 
                    stackId="1"
                    stroke="hsl(var(--destructive))" 
                    fill="hsl(var(--destructive))"
                    fillOpacity={0.3}
                    name="Delayed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Hourly Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Hourly Distribution
            </CardTitle>
            <CardDescription>
              Trip scheduling pattern by hour of day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(value) => `${value}:00`}
                    className="text-muted-foreground"
                  />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    labelFormatter={(value) => `${value}:00 - ${value}:59`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar 
                    dataKey="trips" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    name="Trips"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Driver Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Driver Performance
            </CardTitle>
            <CardDescription>
              Top performing drivers by completion rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {analytics.driverMetrics.map((driver, index) => (
                  <div key={driver.driverId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                          {index + 1}
                        </Badge>
                        <div>
                          <div className="font-medium text-sm">{driver.driverName}</div>
                          <div className="text-xs text-muted-foreground">
                            {driver.tripsCompleted} trips • {driver.totalDistance} km
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm text-green-500">
                          {driver.onTimeRate.toFixed(0)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {driver.avgDeliveryTime} min avg
                        </div>
                      </div>
                    </div>
                    <Progress value={driver.onTimeRate} className="h-2" />
                  </div>
                ))}

                {analytics.driverMetrics.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No driver data available</p>
                    <p className="text-sm">Complete some trips to see driver metrics</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{analytics.completedTrips}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-4 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
              <div className="text-2xl font-bold">{analytics.delayedTrips}</div>
              <div className="text-sm text-muted-foreground">Delayed</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <XCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{analytics.cancelledTrips}</div>
              <div className="text-sm text-muted-foreground">Cancelled</div>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <Gauge className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{analytics.avgSpeed} km/h</div>
              <div className="text-sm text-muted-foreground">Avg Speed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TripAnalytics;
