import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Role, User } from '@/types/auth';
import { 
  ShieldCheck, 
  Shield, 
  Plus, 
  RefreshCw, 
  Users, 
  Check, 
  Edit3, 
  Trash2, 
  Lock, 
  Layers, 
  Sparkles,
  LayoutDashboard,
  LogIn,
  Scale,
  Package,
  CheckCircle,
  Route,
  Navigation,
  BarChart3,
  LogOut,
  AlertTriangle,
  Truck,
  UserCircle,
  Fuel,
  Wrench,
  Receipt,
  Warehouse,
  FileText,
  Settings,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// All available system modules in sidebar navigation
export const ALL_SYSTEM_MODULES = [
  { path: '/', label: 'Operations Dashboard', group: 'Operations', icon: LayoutDashboard },
  { path: '/gate-monitor', label: 'Gate Monitor & Cameras', group: 'Operations', icon: LogIn },
  { path: '/weighbridge', label: 'Weighbridge Console', group: 'Operations', icon: Scale },
  { path: '/loading', label: 'Loading Console', group: 'Operations', icon: Package },
  { path: '/dispatch', label: 'Dispatch Approval', group: 'Operations', icon: CheckCircle },

  { path: '/trips', label: 'Trip Management', group: 'Tracking', icon: Navigation },
  { path: '/trip-tracking', label: 'Live GPS Tracking', group: 'Tracking', icon: Route },
  { path: '/trip-analytics', label: 'Trip Analytics', group: 'Tracking', icon: BarChart3 },
  { path: '/exit-verification', label: 'Exit Verification', group: 'Tracking', icon: LogOut },
  { path: '/incidents', label: 'Incident Management', group: 'Tracking', icon: AlertTriangle },
  { path: '/audit-logs', label: 'Audit Trail', group: 'Tracking', icon: ShieldCheck },

  { path: '/vehicles', label: 'Vehicle Management', group: 'Fleet', icon: Truck },
  { path: '/drivers', label: 'Driver Management', group: 'Fleet', icon: UserCircle },
  { path: '/fuel', label: 'Fuel Management', group: 'Fleet', icon: Fuel },
  { path: '/maintenance', label: 'Maintenance Scheduler', group: 'Fleet', icon: Wrench },

  { path: '/customer-portal', label: 'Customer Portal', group: 'Commercial', icon: Users },
  { path: '/billing', label: 'Billing & Invoicing', group: 'Commercial', icon: Receipt },
  { path: '/inventory', label: 'Raw Material Inventory', group: 'Commercial', icon: Warehouse },
  { path: '/reports', label: 'Operational Reports', group: 'Commercial', icon: FileText },
  { path: '/device-config', label: 'Device & Camera Config', group: 'Admin', icon: Settings },
  { path: '/users', label: 'User Management', group: 'Admin', icon: Users },
  { path: '/roles', label: 'Role Management', group: 'Admin', icon: ShieldCheck },
];

const PRESET_COLORS = [
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#6366f1', // Indigo
  '#f43f5e', // Rose
  '#14b8a6', // Teal
];

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    color: '#3b82f6',
    modules: [] as string[],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesData, usersData] = await Promise.all([
        api.getRoles(),
        api.getUsers(),
      ]);
      setRoles(rolesData || []);
      setUsers(usersData || []);
    } catch (err: any) {
      toast.error('Failed to load role definitions', {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddDialog = () => {
    setEditingRole(null);
    setFormData({
      id: '',
      name: '',
      description: '',
      color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
      modules: ['/', '/trips'],
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (role: Role) => {
    setEditingRole(role);
    setFormData({
      id: role.id,
      name: role.name,
      description: role.description || '',
      color: role.color || '#3b82f6',
      modules: role.modules || [],
    });
    setDialogOpen(true);
  };

  const handleToggleModule = (modulePath: string) => {
    setFormData((prev) => {
      const exists = prev.modules.includes(modulePath);
      let updated: string[];
      if (exists) {
        updated = prev.modules.filter((m) => m !== modulePath);
      } else {
        updated = [...prev.modules, modulePath];
      }
      return { ...prev, modules: updated };
    });
  };

  const handleSelectAllModules = () => {
    setFormData((prev) => ({
      ...prev,
      modules: ALL_SYSTEM_MODULES.map((m) => m.path),
    }));
  };

  const handleClearModules = () => {
    setFormData((prev) => ({
      ...prev,
      modules: ['/'], // keep dashboard by default
    }));
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Role name is required');
      return;
    }

    try {
      if (editingRole) {
        await api.updateRole(editingRole.id, {
          name: formData.name,
          description: formData.description,
          color: formData.color,
          modules: formData.modules,
        });
        toast.success(`Role ${formData.name} updated successfully`);
      } else {
        const slug = formData.id.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        await api.createRole({
          id: slug,
          name: formData.name,
          description: formData.description,
          color: formData.color,
          modules: formData.modules,
          permissions: ['read', 'write'],
        });
        toast.success(`Role ${formData.name} created successfully`);
      }

      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Failed to save role', {
        description: err.message,
      });
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      await api.deleteRole(roleToDelete.id);
      toast.success(`Role ${roleToDelete.name} deleted`);
      setDeleteConfirmOpen(false);
      setRoleToDelete(null);
      fetchData();
    } catch (err: any) {
      toast.error('Failed to delete role', {
        description: err.message,
      });
    }
  };

  // Group modules by category for the permissions editor
  const modulesByGroup = ALL_SYSTEM_MODULES.reduce<Record<string, typeof ALL_SYSTEM_MODULES>>((acc, m) => {
    acc[m.group] = acc[m.group] || [];
    acc[m.group].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Role & Permission Management
            </h1>
            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/20">
              Access Matrix
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define plant operator roles, assign navigation visibility, and configure functional permission scopes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
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
            Create Custom Role
          </Button>
        </div>
      </div>

      <Tabs defaultValue="cards" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="cards" className="text-xs">
              Role Cards ({roles.length})
            </TabsTrigger>
            <TabsTrigger value="matrix" className="text-xs">
              Permission Matrix View
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: ROLE CARDS */}
        <TabsContent value="cards" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roles.map((role) => {
              const assignedUserCount = users.filter((u) => u.roleId === role.id).length;
              const isWildcard = role.modules?.includes('*');
              const moduleCount = isWildcard ? ALL_SYSTEM_MODULES.length : (role.modules?.length || 0);

              return (
                <Card 
                  key={role.id} 
                  className="bg-card/80 border-border/80 flex flex-col justify-between overflow-hidden relative shadow-sm hover:border-border transition-all"
                >
                  <div 
                    className="absolute top-0 left-0 right-0 h-1" 
                    style={{ backgroundColor: role.color }} 
                  />

                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="h-9 w-9 rounded-lg flex items-center justify-center font-bold text-white shadow-sm"
                          style={{ backgroundColor: `${role.color}25`, border: `1px solid ${role.color}50` }}
                        >
                          <Shield className="h-5 w-5" style={{ color: role.color }} />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold text-foreground">
                            {role.name}
                          </CardTitle>
                          <div className="text-xs text-muted-foreground font-mono">
                            ID: {role.id}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {role.isSystem ? (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground">
                            System
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-500/40 text-blue-400">
                            Custom
                          </Badge>
                        )}
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {assignedUserCount} {assignedUserCount === 1 ? 'user' : 'users'}
                        </span>
                      </div>
                    </div>

                    <CardDescription className="text-xs text-muted-foreground mt-2 min-h-[34px] line-clamp-2">
                      {role.description || 'No description provided.'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 pb-3 flex-1">
                    <div className="border-t border-border/60 pt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Accessible Modules</span>
                        <Badge 
                          variant="outline" 
                          className="text-[10px] px-1.5 py-0"
                          style={{ borderColor: `${role.color}60`, color: role.color }}
                        >
                          {isWildcard ? 'All Modules (22)' : `${moduleCount} of 22`}
                        </Badge>
                      </div>

                      {/* Sample module chips */}
                      <div className="flex flex-wrap gap-1 pt-1 max-h-24 overflow-y-auto">
                        {isWildcard ? (
                          <Badge variant="secondary" className="text-[11px] bg-primary/10 text-primary border-primary/20">
                            ★ Full System Super-Access (*)
                          </Badge>
                        ) : (
                          role.modules?.slice(0, 6).map((mPath) => {
                            const mod = ALL_SYSTEM_MODULES.find((m) => m.path === mPath);
                            return (
                              <Badge 
                                key={mPath} 
                                variant="secondary" 
                                className="text-[10px] px-1.5 py-0 font-normal bg-muted/70 text-foreground/80"
                              >
                                {mod?.label || mPath}
                              </Badge>
                            );
                          })
                        )}
                        {!isWildcard && (role.modules?.length || 0) > 6 && (
                          <span className="text-[10px] text-muted-foreground self-center px-1">
                            +{role.modules.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditDialog(role)}
                      className="text-xs gap-1.5 flex-1"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Configure Modules
                    </Button>

                    {!role.isSystem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRoleToDelete(role);
                          setDeleteConfirmOpen(true);
                        }}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                        title="Delete Role"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 2: PERMISSION MATRIX VIEW */}
        <TabsContent value="matrix" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
          <Card className="border-border/70 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    <th className="p-3 font-semibold text-foreground min-w-[200px]">System Module</th>
                    <th className="p-3 font-semibold text-muted-foreground">Category</th>
                    {roles.map((r) => (
                      <th key={r.id} className="p-3 font-semibold text-center min-w-[120px]">
                        <div className="flex flex-col items-center gap-1">
                          <span 
                            className="h-2 w-2 rounded-full" 
                            style={{ backgroundColor: r.color }} 
                          />
                          <span className="truncate max-w-[110px]" title={r.name}>{r.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {ALL_SYSTEM_MODULES.map((m) => {
                    const ModIcon = m.icon;
                    return (
                      <tr key={m.path} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium text-foreground flex items-center gap-2">
                          <ModIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>{m.label}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">({m.path})</span>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {m.group}
                          </Badge>
                        </td>
                        {roles.map((r) => {
                          const has = r.modules?.includes('*') || r.modules?.includes(m.path);
                          return (
                            <td key={r.id} className="p-3 text-center">
                              {has ? (
                                <div 
                                  className="h-5 w-5 rounded-full mx-auto flex items-center justify-center text-white"
                                  style={{ backgroundColor: r.color }}
                                >
                                  <Check className="h-3 w-3 stroke-[3]" />
                                </div>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ADD / EDIT ROLE DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {editingRole ? `Configure Role: ${editingRole.name}` : 'Create New Operational Role'}
            </DialogTitle>
            <DialogDescription>
              Select the modules accessible in the sidebar when an operator logs in with this role.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRole} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="r-name" className="text-xs">Role Name *</Label>
                <Input
                  id="r-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Silo Maintenance Supervisor"
                  required
                />
              </div>

              {!editingRole && (
                <div className="space-y-1.5">
                  <Label htmlFor="r-id" className="text-xs">Role Identifier Slug</Label>
                  <Input
                    id="r-id"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="e.g. silo_supervisor (optional)"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="r-desc" className="text-xs">Description</Label>
              <Input
                id="r-desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Operational purpose, terminal duties, responsibilities..."
              />
            </div>

            {/* Accent Color Picker */}
            <div className="space-y-1.5">
              <Label className="text-xs">Badge Accent Color</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: col })}
                    className={`h-7 w-7 rounded-full transition-all border-2 flex items-center justify-center ${
                      formData.color === col ? 'scale-110 border-white' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: col }}
                  >
                    {formData.color === col && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Module Access Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold">Sidebar Module Permissions</Label>
                  <p className="text-xs text-muted-foreground">
                    Selected modules will appear in this role's sidebar menu.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleSelectAllModules}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleClearModules}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="space-y-4 max-h-72 overflow-y-auto pr-2 border border-border/80 rounded-lg p-3 bg-muted/20">
                {Object.entries(modulesByGroup).map(([groupName, groupModules]) => (
                  <div key={groupName} className="space-y-2">
                    <div className="text-xs font-semibold text-primary uppercase tracking-wider">
                      {groupName} Group
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {groupModules.map((m) => {
                        const Icon = m.icon;
                        const isChecked = formData.modules.includes('*') || formData.modules.includes(m.path);

                        return (
                          <label
                            key={m.path}
                            className={`flex items-center gap-2.5 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                              isChecked 
                                ? 'bg-primary/10 border-primary/40 text-foreground' 
                                : 'bg-card border-border/60 text-muted-foreground hover:bg-muted/40'
                            }`}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => handleToggleModule(m.path)}
                            />
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate flex-1 font-medium">{m.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingRole ? 'Update Role Permissions' : 'Create Operational Role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirm Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete role <strong>{roleToDelete?.name}</strong>? Users assigned to this role will lose their permission scope.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRole}>
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
