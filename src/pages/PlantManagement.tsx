import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Plant, DEFAULT_PLANTS } from '@/types/plant';
import { 
  Factory, 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Gauge, 
  Users, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Edit3, 
  Trash2, 
  RefreshCw,
  Building2,
  Check,
  Radio,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

export default function PlantManagement() {
  const { activePlant, switchPlant, refreshPlants } = useAuth();
  const [plants, setPlants] = useState<Plant[]>(DEFAULT_PLANTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [plantToDelete, setPlantToDelete] = useState<Plant | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    location: '',
    city: 'Hyderabad',
    capacityPerHour: 120,
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    status: 'active' as 'active' | 'maintenance' | 'inactive',
  });

  const fetchPlantsData = async () => {
    setLoading(true);
    try {
      const data = await api.getPlants();
      if (Array.isArray(data) && data.length > 0) {
        setPlants(data);
      }
    } catch (err: any) {
      toast.error('Failed to load plants from server', {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlantsData();
  }, []);

  const handleOpenAddDialog = () => {
    setEditingPlant(null);
    setFormData({
      code: `PLANT_00${plants.length + 1}`,
      name: `Plant 0${plants.length + 1} • `,
      location: '',
      city: 'Hyderabad',
      capacityPerHour: 120,
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
      status: 'active',
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (plant: Plant) => {
    setEditingPlant(plant);
    setFormData({
      code: plant.code,
      name: plant.name,
      location: plant.location,
      city: plant.city || 'Hyderabad',
      capacityPerHour: plant.capacityPerHour || 120,
      contactPerson: plant.contactPerson || '',
      contactPhone: plant.contactPhone || '',
      contactEmail: plant.contactEmail || '',
      status: plant.status,
    });
    setDialogOpen(true);
  };

  const handleSavePlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.location) {
      toast.error('Code, name, and location are required');
      return;
    }

    try {
      if (editingPlant) {
        await api.updatePlant(editingPlant.id, formData);
        toast.success(`Plant ${formData.name} updated successfully`);
      } else {
        await api.createPlant(formData);
        toast.success(`Plant ${formData.name} created successfully`);
      }

      setDialogOpen(false);
      fetchPlantsData();
      refreshPlants();
    } catch (err: any) {
      toast.error('Failed to save plant', {
        description: err.message,
      });
    }
  };

  const handleDeletePlant = async () => {
    if (!plantToDelete) return;
    try {
      await api.deletePlant(plantToDelete.id);
      toast.success(`Plant ${plantToDelete.name} removed`);
      setDeleteConfirmOpen(false);
      setPlantToDelete(null);
      fetchPlantsData();
      refreshPlants();
    } catch (err: any) {
      toast.error('Failed to delete plant', {
        description: err.message,
      });
    }
  };

  // Filtered plants
  const filteredPlants = plants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const totalPlants = plants.length;
  const activePlantsCount = plants.filter((p) => p.status === 'active').length;
  const totalCapacity = plants.reduce((sum, p) => sum + (Number(p.capacityPerHour) || 0), 0);
  const totalOperators = plants.reduce((sum, p) => sum + (p.userCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Factory className="h-6 w-6 text-primary" />
              Plant Management
            </h1>
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/20">
              Admin Terminal
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure RMC plants, production batching capacity, geographic locations, and active operator rosters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPlantsData}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleOpenAddDialog}
            className="gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Plant Terminal
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/70 border-border/70 backdrop-blur-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Plants</span>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">{totalPlants}</div>
            <p className="text-xs text-muted-foreground mt-1">Multi-location network</p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/70 backdrop-blur-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Production</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-400">{activePlantsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for weighment & batching</p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/70 backdrop-blur-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Combined Capacity</span>
            <Gauge className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-blue-400">{totalCapacity} <span className="text-sm font-normal text-slate-400">m³/hr</span></div>
            <p className="text-xs text-muted-foreground mt-1">Max rated output across all plants</p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/70 backdrop-blur-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Currently Monitored</span>
            <Radio className="h-4 w-4 text-amber-500 animate-pulse" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-base font-bold text-amber-300 truncate" title={activePlant?.name}>
              {activePlant?.code || 'PLANT_001'}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {activePlant?.name.split('•')[1]?.trim() || 'Shamshabad Central'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-card/50 border-border/70">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
              <Input
                placeholder="Search by plant code, name, city, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/80"
              />
            </div>

            <div className="w-full md:w-52">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background/80">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses ({plants.length})</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plants Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground flex items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading plant terminals...
          </div>
        ) : filteredPlants.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No plants found matching the search criteria.
          </div>
        ) : (
          filteredPlants.map((plant) => {
            const isCurrentActive = activePlant?.id === plant.id;

            return (
              <Card 
                key={plant.id} 
                className={`relative overflow-hidden transition-all duration-200 border ${
                  isCurrentActive 
                    ? 'border-amber-500/80 bg-amber-500/5 ring-1 ring-amber-500/50 shadow-md' 
                    : 'border-border/70 bg-card/70 hover:border-border'
                }`}
              >
                {/* Top status line */}
                <div 
                  className={`h-1.5 w-full ${
                    plant.status === 'active' 
                      ? 'bg-emerald-500' 
                      : plant.status === 'maintenance' 
                      ? 'bg-amber-500' 
                      : 'bg-slate-600'
                  }`} 
                />

                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs font-semibold px-2 py-0.5">
                          {plant.code}
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className={`text-[11px] capitalize ${
                            plant.status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : plant.status === 'maintenance' 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                              : 'bg-slate-500/10 text-slate-400'
                          }`}
                        >
                          {plant.status}
                        </Badge>
                        {isCurrentActive && (
                          <Badge className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0">
                            Active Terminal
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg font-bold text-foreground pt-1">
                        {plant.name}
                      </CardTitle>
                    </div>

                    <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Factory className="h-5 w-5" />
                    </div>
                  </div>

                  <CardDescription className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-red-400" />
                    <span className="truncate">{plant.location}, {plant.city}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-4">
                  {/* Plant Metrics */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border/50 text-xs">
                    <div className="space-y-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Gauge className="h-3.5 w-3.5 text-blue-400" />
                        Rated Capacity:
                      </span>
                      <span className="font-bold text-foreground text-sm">
                        {plant.capacityPerHour} m³/hr
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-purple-400" />
                        Assigned Users:
                      </span>
                      <span className="font-bold text-foreground text-sm">
                        {plant.userCount || 0} operators
                      </span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/50 pt-3">
                    {plant.contactPerson && (
                      <div className="flex items-center justify-between">
                        <span>Plant In-charge:</span>
                        <span className="font-medium text-foreground">{plant.contactPerson}</span>
                      </div>
                    )}
                    {plant.contactPhone && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> Phone:
                        </span>
                        <span className="font-mono text-foreground">{plant.contactPhone}</span>
                      </div>
                    )}
                    {plant.contactEmail && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> Email:
                        </span>
                        <span className="truncate max-w-[200px] text-foreground">{plant.contactEmail}</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0 border-t border-border/50 bg-muted/10 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant={isCurrentActive ? "secondary" : "outline"}
                    className="text-xs h-8 gap-1.5"
                    disabled={isCurrentActive}
                    onClick={() => switchPlant(plant.id)}
                  >
                    {isCurrentActive ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        Monitoring Plant
                      </>
                    ) : (
                      <>
                        <Radio className="h-3.5 w-3.5 text-amber-400" />
                        Set Active Plant
                      </>
                    )}
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs"
                      onClick={() => handleOpenEditDialog(plant)}
                      title="Edit Plant Configuration"
                    >
                      <Edit3 className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setPlantToDelete(plant);
                        setDeleteConfirmOpen(true);
                      }}
                      title="Delete Plant Terminal"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      {/* ADD / EDIT PLANT DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-primary" />
              {editingPlant ? 'Edit Plant Terminal' : 'Add New Plant Terminal'}
            </DialogTitle>
            <DialogDescription>
              {editingPlant 
                ? 'Update plant capacity, address, and operational telemetry details.'
                : 'Register a new ready-mix concrete plant terminal in the centralized network.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePlant} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-code" className="text-xs">Plant Code *</Label>
                <Input
                  id="p-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. PLANT_005"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-city" className="text-xs">City *</Label>
                <Input
                  id="p-city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Hyderabad"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-name" className="text-xs">Plant Full Name *</Label>
              <Input
                id="p-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Plant 05 • Uppal Industrial Hub"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-loc" className="text-xs">Physical Address / Location *</Label>
              <Input
                id="p-loc"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Plot 19, IDA Uppal, Warangal Highway"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-cap" className="text-xs">Rated Capacity (m³/hr)</Label>
                <Input
                  id="p-cap"
                  type="number"
                  min="10"
                  max="500"
                  value={formData.capacityPerHour}
                  onChange={(e) => setFormData({ ...formData, capacityPerHour: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-status" className="text-xs">Operational Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger id="p-status">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Operational)</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-contact" className="text-xs">Contact Person</Label>
                <Input
                  id="p-contact"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Plant Manager Name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-phone" className="text-xs">Contact Phone</Label>
                <Input
                  id="p-phone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+91 98490 00000"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-email" className="text-xs">Contact Email</Label>
              <Input
                id="p-email"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="plant.contact@aparna-rmc.com"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingPlant ? 'Update Plant Terminal' : 'Register Plant Terminal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Confirm Plant Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{plantToDelete?.name}</strong> ({plantToDelete?.code})?
              This will unbind all associated operators and terminals.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePlant}>
              Delete Plant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
