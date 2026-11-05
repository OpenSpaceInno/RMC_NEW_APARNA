import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMaintenanceScheduler } from "@/hooks/useMaintenanceScheduler";
import { MaintenanceFormDialog } from "@/components/maintenance/MaintenanceFormDialog";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { Wrench, Calendar, AlertTriangle, Package, CheckCircle, Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { MaintenanceTask } from "@/types/maintenance";

const priorityColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "warning" | "success"> = { low: "secondary", medium: "default", high: "warning", critical: "destructive" };
const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "warning" | "success"> = { scheduled: "secondary", in_progress: "default", completed: "success", cancelled: "outline", overdue: "destructive" };

export default function MaintenanceScheduler() {
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<MaintenanceTask | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [searchTask, setSearchTask] = useState<string>("");

  const { 
    tasks, 
    schedules, 
    parts, 
    stats, 
    getUpcomingMaintenance, 
    getLowStockParts, 
    updateTaskStatus, 
    createTask, 
    updateTask, 
    deleteTask,
    updatePartStock 
  } = useMaintenanceScheduler();

  const upcomingMaintenance = getUpcomingMaintenance(30);
  const lowStockParts = getLowStockParts();

  const handleEdit = (task: MaintenanceTask) => {
    setEditTask(task);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (editTask) {
      await updateTask(editTask.id, {
        title: data.title,
        description: data.description,
        priority: data.priority,
        scheduledDate: data.scheduledDate,
        estimatedCost: data.estimatedCost,
        technician: data.technician,
        notes: data.notes,
      });
    } else {
      await createTask(data);
    }
    setEditTask(null);
  };

  const handleConfirmDelete = async () => {
    if (deleteTaskId) {
      await deleteTask(deleteTaskId);
      setDeleteTaskId(null);
    }
  };

  const handleScheduleFromUpcoming = (schedule: any) => {
    createTask({
      vehicleId: schedule.vehicleRegNo,
      type: "preventive",
      title: schedule.taskName,
      description: `Preventive service automatically converted from periodic schedule ${schedule.taskName}`,
      priority: schedule.isOverdue ? "critical" : "medium",
      scheduledDate: schedule.nextDueDate.split('T')[0],
      estimatedCost: 6500,
      technician: "Workshop Duty Tech",
      notes: `Due within ${schedule.daysUntilDue} days`,
    });
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTask.toLowerCase()) ||
                          t.vehicleRegNo.toLowerCase().includes(searchTask.toLowerCase()) ||
                          (t.technician && t.technician.toLowerCase().includes(searchTask.toLowerCase()));
    if (taskFilter === "all") return matchesSearch;
    return matchesSearch && t.status === taskFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Maintenance Scheduler</h1>
          <p className="text-muted-foreground">Preventive maintenance, service history & parts inventory</p>
        </div>
        <Button onClick={() => { setEditTask(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Schedule Maintenance
        </Button>
      </div>

      <MaintenanceFormDialog
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditTask(null); }}
        onSubmit={handleFormSubmit}
        editTask={editTask}
      />

      <ConfirmDeleteDialog
        open={!!deleteTaskId}
        onOpenChange={(open) => !open && setDeleteTaskId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Maintenance Task"
        description="Are you sure you want to delete this maintenance task? This action cannot be undone."
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Tasks</CardTitle><Wrench className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalTasks}</div><p className="text-xs text-muted-foreground">{stats.inProgress} currently in progress</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Overdue</CardTitle><AlertTriangle className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{stats.overdue}</div><p className="text-xs text-muted-foreground">Requires immediate attention</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Cost</CardTitle><CheckCircle className="h-4 w-4 text-success" /></CardHeader><CardContent><div className="text-2xl font-bold">₹{stats.totalCost.toLocaleString()}</div><p className="text-xs text-muted-foreground">{stats.completed} tasks completed</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Low Stock Parts</CardTitle><Package className="h-4 w-4 text-amber-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-amber-500">{stats.lowStockParts}</div><p className="text-xs text-muted-foreground">Need warehouse reorder</p></CardContent></Card>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="schedules">Schedules ({upcomingMaintenance.length})</TabsTrigger>
          <TabsTrigger value="parts">Parts Inventory ({parts.length})</TabsTrigger>
        </TabsList>
        
        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              {['all', 'scheduled', 'in_progress', 'completed', 'overdue'].map((tab) => (
                <Button 
                  key={tab}
                  variant={taskFilter === tab ? 'default' : 'outline'} 
                  size="sm"
                  className="h-8 text-xs capitalize"
                  onClick={() => setTaskFilter(tab)}
                >
                  {tab.replace('_', ' ')}
                </Button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Search tasks, vehicles, techs..."
              value={searchTask}
              onChange={(e) => setSearchTask(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-md border bg-background w-full sm:w-64"
            />
          </div>

          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm border rounded-lg bg-card">
                No maintenance tasks match the selected criteria.
              </div>
            ) : (
              filteredTasks.map((task) => (
                <Card key={task.id} className="hover:border-primary/40 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                          <Wrench className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{task.vehicleRegNo}</span> • <span className="capitalize">{task.type}</span> {task.technician ? `• Tech: ${task.technician}` : ''}
                          </p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 justify-between md:justify-end">
                        <div className="flex items-center gap-2">
                          <Badge variant={priorityColors[task.priority]}>{task.priority}</Badge>
                          <Badge variant={statusColors[task.status]}>{task.status.replace('_', ' ')}</Badge>
                        </div>

                        <div className="text-left md:text-right min-w-[100px]">
                          <p className="text-xs font-medium">{format(new Date(task.scheduledDate), 'dd MMM yyyy')}</p>
                          <p className="text-xs text-muted-foreground">
                            {task.actualCost ? `Actual: ₹${task.actualCost.toLocaleString()}` : `Est: ₹${task.estimatedCost.toLocaleString()}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {task.status === 'scheduled' && (
                            <Button size="sm" className="h-8 text-xs" onClick={() => updateTaskStatus(task.id, 'in_progress')}>
                              Start Service
                            </Button>
                          )}
                          {task.status === 'in_progress' && (
                            <Button size="sm" variant="default" className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => updateTaskStatus(task.id, 'completed')}>
                              Complete
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(task)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteTaskId(task.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-4">
          <div className="space-y-3">
            {upcomingMaintenance.map((schedule) => (
              <Card key={schedule.id} className={schedule.isOverdue ? 'border-destructive/60 bg-destructive/5' : ''}>
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-full ${schedule.isOverdue ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{schedule.taskName}</p>
                      <p className="text-xs text-muted-foreground">
                        Vehicle: <span className="font-medium text-foreground">{schedule.vehicleRegNo}</span>
                        {schedule.intervalDays ? ` • Interval: ${schedule.intervalDays} days` : ''}
                        {schedule.intervalKm ? ` • ${schedule.intervalKm.toLocaleString()} km` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-xs font-medium">Due: {format(new Date(schedule.nextDueDate), 'dd MMM yyyy')}</p>
                      <Badge variant={schedule.isOverdue ? 'destructive' : 'secondary'} className="mt-0.5">
                        {schedule.isOverdue ? `Overdue by ${Math.abs(schedule.daysUntilDue)} days` : `In ${schedule.daysUntilDue} days`}
                      </Badge>
                    </div>

                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 text-xs shrink-0"
                      onClick={() => handleScheduleFromUpcoming(schedule)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Create Task
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Parts Tab */}
        <TabsContent value="parts" className="space-y-4">
          <div className="space-y-3">
            {parts.map((part) => (
              <Card key={part.id} className={part.isLowStock ? 'border-amber-500/60 bg-amber-500/5' : ''}>
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-full ${part.isLowStock ? 'bg-amber-500/20 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{part.name}</p>
                        {part.isLowStock && <Badge variant="warning">Low Stock</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        SKU: {part.partNumber} • Category: {part.category} • Supplier: {part.supplier}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-center sm:text-right">
                      <p className="text-sm font-bold text-foreground">{part.quantity} units</p>
                      <p className="text-xs text-muted-foreground">Threshold: Min {part.minStock}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold">₹{part.unitCost.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">per unit</p>
                    </div>

                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 text-xs"
                      onClick={() => updatePartStock(part.id, 5)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Restock (+5)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
