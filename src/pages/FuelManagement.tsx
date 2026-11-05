import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFuelManagement } from "@/hooks/useFuelManagement";
import { useVehicleManagement } from "@/hooks/useVehicleManagement";
import { useDriverManagement } from "@/hooks/useDriverManagement";
import { FuelRecord, FuelFormData } from "@/types/fuel";
import { 
  Fuel, 
  TrendingUp, 
  DollarSign, 
  Gauge, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Download, 
  Filter, 
  MapPin, 
  User, 
  Calendar, 
  Receipt,
  Truck,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar 
} from "recharts";
import { format } from "date-fns";
import { toast } from "sonner";

export default function FuelManagement() {
  const { 
    records, 
    stats, 
    addRecord, 
    updateRecord, 
    deleteRecord, 
    getFuelTrend 
  } = useFuelManagement();

  const { allVehicles } = useVehicleManagement();
  const { drivers } = useDriverManagement();

  const [searchTerm, setSearchTerm] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [fuelTypeFilter, setFuelTypeFilter] = useState("all");
  const [trendDays, setTrendDays] = useState<number>(14);

  // Modal states
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FuelRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<FuelFormData>({
    vehicleId: 'v1',
    driverId: '',
    fuelType: 'diesel',
    quantity: 100,
    pricePerUnit: 89.50,
    odometerReading: 125000,
    fuelStation: 'Indian Oil - Hadapsar',
    location: 'Pune',
    receiptNumber: '',
    date: new Date().toISOString().slice(0, 16),
    notes: '',
  });

  const fuelTrend = getFuelTrend(trendDays);

  // Filter records
  const displayedRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = 
        r.vehicleRegNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.fuelStation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.driverName && r.driverName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.receiptNumber && r.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesVehicle = vehicleFilter === 'all' || r.vehicleId === vehicleFilter || r.vehicleRegNo === vehicleFilter;
      const matchesType = fuelTypeFilter === 'all' || r.fuelType === fuelTypeFilter;

      return matchesSearch && matchesVehicle && matchesType;
    });
  }, [records, searchTerm, vehicleFilter, fuelTypeFilter]);

  // Open add modal
  const handleOpenAdd = () => {
    setEditingRecord(null);
    const defaultVehicle = allVehicles[0];
    const defaultDriver = drivers.find(d => d.assignedVehicle === defaultVehicle?.registrationNo);

    setFormData({
      vehicleId: defaultVehicle?.id || 'v1',
      driverId: defaultDriver?.id || '',
      fuelType: (defaultVehicle?.fuelType === 'cng' ? 'cng' : 'diesel') as FuelFormData['fuelType'],
      quantity: 110,
      pricePerUnit: defaultVehicle?.fuelType === 'cng' ? 76.50 : 89.50,
      odometerReading: defaultVehicle?.odometer || 125000,
      fuelStation: 'Indian Oil - Hadapsar',
      location: 'Pune',
      receiptNumber: `RCP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().slice(0, 16),
      notes: '',
    });
    setIsFormDialogOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (rec: FuelRecord) => {
    setEditingRecord(rec);
    setFormData({
      vehicleId: rec.vehicleId,
      driverId: rec.driverId || '',
      fuelType: rec.fuelType,
      quantity: rec.quantity,
      pricePerUnit: rec.pricePerUnit,
      odometerReading: rec.odometerReading,
      fuelStation: rec.fuelStation,
      location: rec.location || 'Pune',
      receiptNumber: rec.receiptNumber || '',
      date: rec.date.slice(0, 16),
      notes: rec.notes || '',
    });
    setIsFormDialogOpen(true);
  };

  // When vehicle changes in form, auto-fill relevant defaults
  const handleVehicleChange = (vId: string) => {
    const selVehicle = allVehicles.find(v => v.id === vId);
    const assignedDriver = drivers.find(d => d.assignedVehicle === selVehicle?.registrationNo);
    const isCNG = selVehicle?.fuelType === 'cng';

    setFormData(prev => ({
      ...prev,
      vehicleId: vId,
      driverId: assignedDriver?.id || prev.driverId,
      fuelType: (isCNG ? 'cng' : 'diesel') as FuelFormData['fuelType'],
      pricePerUnit: isCNG ? 76.50 : 89.50,
      odometerReading: selVehicle?.odometer || prev.odometerReading,
    }));
  };

  // Submit Add or Edit
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId) {
      toast.error('Please select a vehicle');
      return;
    }
    if (!formData.quantity || formData.quantity <= 0) {
      toast.error('Please enter a valid fuel quantity');
      return;
    }
    if (!formData.pricePerUnit || formData.pricePerUnit <= 0) {
      toast.error('Please enter a valid price per unit');
      return;
    }

    if (editingRecord) {
      updateRecord(editingRecord.id, {
        vehicleId: formData.vehicleId,
        driverId: formData.driverId || undefined,
        fuelType: formData.fuelType,
        quantity: Number(formData.quantity),
        pricePerUnit: Number(formData.pricePerUnit),
        odometerReading: Number(formData.odometerReading),
        fuelStation: formData.fuelStation,
        location: formData.location,
        receiptNumber: formData.receiptNumber,
        date: new Date(formData.date).toISOString(),
        notes: formData.notes,
      });
      toast.success('Fuel record updated successfully');
    } else {
      addRecord({
        ...formData,
        date: new Date(formData.date).toISOString(),
      });
      toast.success('Fuel entry recorded successfully');
    }

    setIsFormDialogOpen(false);
  };

  // Delete record
  const handleDeleteConfirm = () => {
    if (deletingId) {
      deleteRecord(deletingId);
      toast.success('Fuel record deleted');
      setDeletingId(null);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (displayedRecords.length === 0) {
      toast.error('No records available to export');
      return;
    }

    const headers = [
      'Record ID',
      'Vehicle Reg No',
      'Date',
      'Fuel Type',
      'Quantity (L/kg)',
      'Price Per Unit (INR)',
      'Total Cost (INR)',
      'Odometer (km)',
      'Fuel Station',
      'Location',
      'Driver Name',
      'Receipt No',
      'Notes'
    ];

    const rows = displayedRecords.map(r => [
      r.id,
      r.vehicleRegNo,
      format(new Date(r.date), 'yyyy-MM-dd HH:mm'),
      r.fuelType.toUpperCase(),
      r.quantity,
      r.pricePerUnit.toFixed(2),
      r.totalCost.toFixed(2),
      r.odometerReading,
      `"${(r.fuelStation || '').replace(/"/g, '""')}"`,
      `"${(r.location || '').replace(/"/g, '""')}"`,
      `"${(r.driverName || 'Unassigned').replace(/"/g, '""')}"`,
      `"${(r.receiptNumber || '').replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rmc_fuel_records_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${displayedRecords.length} fuel logs to CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Fuel className="h-8 w-8 text-primary" />
            Fuel Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Track fuel consumption, expense logs, and fleet refuel efficiency
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleOpenAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Fuel Record
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Fuel Consumed</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Fuel className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFuelConsumed.toLocaleString()} L</div>
            <p className="text-xs text-muted-foreground mt-1">
              Logged across <span className="font-semibold text-foreground">{stats.totalRecords}</span> refill sessions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Fleet Fuel Cost</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Fleet weighted average ₹<span className="font-semibold text-foreground">{stats.avgCostPerLiter.toFixed(2)}</span> / L
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Fleet Mileage</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Gauge className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgKmPerLiter} km/L</div>
            <p className="text-xs text-muted-foreground mt-1">
              Benchmark for transit mixers: 4.0 - 4.8 km/L
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top Efficient Mixer</CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10">
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.mostEfficientVehicle?.vehicleRegNo || 'MH12AB1234'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Delivering <span className="font-semibold text-emerald-600">{stats.mostEfficientVehicle?.avgKmPerLiter.toFixed(1) || '4.5'} km/L</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Consumption Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Fuel Consumption Trend</CardTitle>
              <CardDescription>Daily fuel pumped across active fleet mixers</CardDescription>
            </div>
            <Tabs value={String(trendDays)} onValueChange={(v) => setTrendDays(Number(v))}>
              <TabsList className="h-8">
                <TabsTrigger value="7" className="text-xs px-2.5">7D</TabsTrigger>
                <TabsTrigger value="14" className="text-xs px-2.5">14D</TabsTrigger>
                <TabsTrigger value="30" className="text-xs px-2.5">30D</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fuelTrend}>
                <defs>
                  <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(v) => {
                    try {
                      return format(new Date(v), 'dd MMM');
                    } catch {
                      return v;
                    }
                  }} 
                  fontSize={11}
                />
                <YAxis unit=" L" fontSize={11} />
                <Tooltip 
                  formatter={(val: number) => [`${val} Liters`, 'Quantity']}
                  labelFormatter={(lbl) => format(new Date(lbl), 'EEE, dd MMM yyyy')}
                />
                <Area 
                  type="monotone" 
                  dataKey="quantity" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#colorFuel)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Fuel Expenditure Trend</CardTitle>
              <CardDescription>Daily fuel expense disbursements (₹)</CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              Last {trendDays} Days
            </Badge>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fuelTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(v) => {
                    try {
                      return format(new Date(v), 'dd MMM');
                    } catch {
                      return v;
                    }
                  }} 
                  fontSize={11}
                />
                <YAxis unit=" ₹" fontSize={11} />
                <Tooltip 
                  formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Total Cost']}
                  labelFormatter={(lbl) => format(new Date(lbl), 'EEE, dd MMM yyyy')}
                />
                <Bar 
                  dataKey="cost" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Fuel Records Table & Filters */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold">Fuel Log History</CardTitle>
              <CardDescription>
                Showing {displayedRecords.length} of {records.length} refuel entries
              </CardDescription>
            </div>
            
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vehicle, pump, driver..."
                  className="pl-9 h-9 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Vehicle Filter */}
              <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                <SelectTrigger className="w-40 h-9 text-xs">
                  <SelectValue placeholder="All Vehicles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {allVehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.registrationNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Fuel Type Filter */}
              <Select value={fuelTypeFilter} onValueChange={setFuelTypeFilter}>
                <SelectTrigger className="w-32 h-9 text-xs">
                  <SelectValue placeholder="Fuel Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fuel</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="cng">CNG</SelectItem>
                  <SelectItem value="petrol">Petrol</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {displayedRecords.length === 0 ? (
            <div className="py-12 text-center">
              <Fuel className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-40" />
              <h3 className="text-base font-semibold text-foreground">No fuel records found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm || vehicleFilter !== 'all' || fuelTypeFilter !== 'all'
                  ? 'Try resetting your search or filter parameters'
                  : 'Add your first refuel entry to begin tracking fleet costs'}
              </p>
              <Button size="sm" className="mt-4" onClick={handleOpenAdd}>
                <Plus className="h-4 w-4 mr-1.5" />
                Add Record
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedRecords.map((record) => {
                const isDiesel = record.fuelType === 'diesel';
                const isCNG = record.fuelType === 'cng';

                return (
                  <div
                    key={record.id}
                    className="flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-lg border border-border/60 hover:border-primary/40 transition-all bg-card/60 gap-4"
                  >
                    {/* Left: Vehicle & Fuel Station */}
                    <div className="flex items-start sm:items-center gap-3 min-w-[260px]">
                      <div className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 ${
                        isDiesel ? 'bg-primary/10 text-primary' : isCNG ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        <Fuel className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base text-foreground tracking-tight">
                            {record.vehicleRegNo}
                          </span>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                            {record.fuelType}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {record.fuelStation} • {record.location || 'Pune'}
                        </p>
                      </div>
                    </div>

                    {/* Middle Info: Driver & Receipt & Odometer */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-muted-foreground flex-1">
                      <div>
                        <span className="block text-[11px] font-medium text-foreground flex items-center gap-1">
                          <User className="h-3 w-3 text-primary" />
                          {record.driverName || 'Self / Operator'}
                        </span>
                        <span className="text-[11px]">
                          Rcpt: {record.receiptNumber || 'N/A'}
                        </span>
                      </div>

                      <div>
                        <span className="block font-medium text-foreground">
                          {record.odometerReading ? `${record.odometerReading.toLocaleString()} km` : 'Odometer N/A'}
                        </span>
                        <span className="text-[11px] flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(record.date), 'dd MMM yyyy, HH:mm')}
                        </span>
                      </div>

                      {record.notes && (
                        <div className="col-span-2 sm:col-span-1 truncate text-[11px] italic bg-muted/40 p-1.5 rounded">
                          "{record.notes}"
                        </div>
                      )}
                    </div>

                    {/* Right: Quantities & Cost & Actions */}
                    <div className="flex items-center justify-between lg:justify-end gap-5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/40">
                      <div className="text-right">
                        <div className="text-base font-bold text-foreground">
                          {record.quantity} {isCNG ? 'kg' : 'L'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          @ ₹{record.pricePerUnit.toFixed(2)}/L
                        </div>
                      </div>

                      <div className="text-right min-w-[90px]">
                        <div className="text-base font-bold text-emerald-600">
                          ₹{record.totalCost.toLocaleString()}
                        </div>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                          Paid
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenEdit(record)}
                          title="Edit fuel entry"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeletingId(record.id)}
                          title="Delete entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5 text-primary" />
              {editingRecord ? 'Edit Fuel Record' : 'Log New Fleet Fuel Refill'}
            </DialogTitle>
            <DialogDescription>
              Record diesel/CNG dispense details, meter readings, and vendor receipts for audit tracking.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRecord} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Vehicle Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="vehicleSelect">Vehicle *</Label>
                <Select
                  value={formData.vehicleId}
                  onValueChange={handleVehicleChange}
                >
                  <SelectTrigger id="vehicleSelect">
                    <SelectValue placeholder="Select fleet mixer" />
                  </SelectTrigger>
                  <SelectContent>
                    {allVehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.registrationNo} ({v.make} {v.model})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Driver Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="driverSelect">Driver In-Charge</Label>
                <Select
                  value={formData.driverId || 'unassigned'}
                  onValueChange={(val) => setFormData(p => ({ ...p, driverId: val === 'unassigned' ? '' : val }))}
                >
                  <SelectTrigger id="driverSelect">
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">-- No Driver Assigned --</SelectItem>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} ({d.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Fuel Type */}
              <div className="space-y-1.5">
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Select
                  value={formData.fuelType}
                  onValueChange={(val: any) => setFormData(p => ({ ...p, fuelType: val }))}
                >
                  <SelectTrigger id="fuelType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="cng">CNG</SelectItem>
                    <SelectItem value="petrol">Petrol</SelectItem>
                    <SelectItem value="electric">Electric (kWh)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <Label htmlFor="qty">Quantity ({formData.fuelType === 'cng' ? 'kg' : 'L'}) *</Label>
                <Input
                  id="qty"
                  type="number"
                  step="0.1"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(p => ({ ...p, quantity: Number(e.target.value) }))}
                  required
                />
              </div>

              {/* Price Per Unit */}
              <div className="space-y-1.5">
                <Label htmlFor="price">Price/Unit (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.05"
                  min="1"
                  value={formData.pricePerUnit}
                  onChange={(e) => setFormData(p => ({ ...p, pricePerUnit: Number(e.target.value) }))}
                  required
                />
              </div>
            </div>

            {/* Total Cost Highlight Banner */}
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Computed Total Cost</p>
                <p className="text-xl font-extrabold text-foreground">
                  ₹{(formData.quantity * formData.pricePerUnit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30">
                {formData.fuelType.toUpperCase()} REFUEL
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Odometer */}
              <div className="space-y-1.5">
                <Label htmlFor="odometer">Odometer Reading (km)</Label>
                <Input
                  id="odometer"
                  type="number"
                  placeholder="e.g. 125300"
                  value={formData.odometerReading || ''}
                  onChange={(e) => setFormData(p => ({ ...p, odometerReading: Number(e.target.value) }))}
                />
              </div>

              {/* Date & Time */}
              <div className="space-y-1.5">
                <Label htmlFor="recordDate">Date & Time</Label>
                <Input
                  id="recordDate"
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Station Name */}
              <div className="space-y-1.5">
                <Label htmlFor="station">Dispenser / Station Name</Label>
                <Input
                  id="station"
                  placeholder="e.g. Indian Oil - Hadapsar"
                  value={formData.fuelStation}
                  onChange={(e) => setFormData(p => ({ ...p, fuelStation: e.target.value }))}
                />
              </div>

              {/* Receipt Number */}
              <div className="space-y-1.5">
                <Label htmlFor="rcpt">Receipt / Bill Voucher #</Label>
                <Input
                  id="rcpt"
                  placeholder="e.g. RCP-2026-104"
                  value={formData.receiptNumber}
                  onChange={(e) => setFormData(p => ({ ...p, receiptNumber: e.target.value }))}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Refuel Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Transit route refuel, full tank calibration, batch prep..."
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingRecord ? 'Update Record' : 'Save Fuel Log'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Fuel Log
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this fuel record? This will permanently remove the log from fleet analytics and dispatch a warning to the audit trail.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Yes, Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
