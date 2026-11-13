import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { User, Role } from '@/types/auth';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Phone, 
  Mail, 
  Building2, 
  Clock, 
  Key,
  KeyRound,
  Factory
} from 'lucide-react';
import { Plant, DEFAULT_PLANTS } from '@/types/plant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function UserManagement() {
  const { user: currentUser, plants: contextPlants, activePlant, isSuperAdmin } = useAuth();
  const plants = (contextPlants && contextPlants.length > 0) ? contextPlants : DEFAULT_PLANTS;
  const userPlantId = (currentUser?.plantId && currentUser.plantId !== 'all')
    ? currentUser.plantId
    : (activePlant?.id || plants[0]?.id || 'PL01');
  const userPlantObj = plants.find(p => p.id === userPlantId);
  const userPlantName = userPlantObj?.name || currentUser?.plantName || activePlant?.name || 'Plant 01 • Shamshabad Central';

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedPlantFilter, setSelectedPlantFilter] = useState<string>(isSuperAdmin ? 'all' : userPlantId);

  // Modal dialog states
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    roleId: 'weighbridge_operator',
    plantId: userPlantId,
    plantName: userPlantName,
    department: 'Operations',
    shift: 'General (09:00 - 18:00)',
    status: 'active' as 'active' | 'inactive' | 'suspended',
    password: '',
  });

  useEffect(() => {
    setSelectedPlantFilter(isSuperAdmin ? (activePlant?.id || 'all') : userPlantId);
  }, [isSuperAdmin, activePlant?.id, userPlantId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        api.getUsers(isSuperAdmin ? undefined : { plantId: userPlantId }),
        api.getRoles(),
      ]);
      const rawUsers = usersData || [];
      const scopedUsers = isSuperAdmin
        ? rawUsers
        : rawUsers.filter(
            (u) => u.plantId === userPlantId && u.roleId !== 'super_admin' && u.roleId !== 'admin'
          );
      setUsers(scopedUsers);
      setRoles(rolesData || []);
    } catch (err: any) {
      toast.error('Failed to load user management data', {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isSuperAdmin, userPlantId]);

  const handleOpenAddDialog = () => {
    const defaultRole = 'weighbridge_operator';
    const defaultPlantId = isSuperAdmin ? (plants[0]?.id || 'PL01') : userPlantId;
    const defaultPlantName = plants.find(p => p.id === defaultPlantId)?.name || userPlantName;
    setEditingUser(null);
    setFormData({
      username: '',
      name: '',
      email: '',
      phone: '',
      roleId: defaultRole,
      plantId: defaultPlantId,
      plantName: defaultPlantName,
      department: 'Quality & Weighment',
      shift: 'General (09:00 - 18:00)',
      status: 'active',
      password: '',
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (user: User) => {
    setEditingUser(user);
    const resolvedPlantId = isSuperAdmin
      ? (user.plantId || (user.roleId === 'super_admin' || user.roleId === 'admin' ? 'all' : 'PL01'))
      : userPlantId;
    const resolvedPlantName = resolvedPlantId === 'all'
      ? 'All Plants (Super Admin)'
      : (plants.find(p => p.id === resolvedPlantId)?.name || user.plantName || userPlantName);
    setFormData({
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      roleId: isSuperAdmin ? user.roleId : 'weighbridge_operator',
      plantId: resolvedPlantId,
      plantName: resolvedPlantName,
      department: user.department || 'Operations',
      shift: user.shift || 'General',
      status: user.status,
      password: '', // blank unless updating
    });
    setDialogOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.username) {
      toast.error('Name and username are required');
      return;
    }

    try {
      if (editingUser) {
        // Update user
        const payload: any = {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          roleId: formData.roleId,
          plantId: formData.plantId,
          plantName: formData.plantName,
          department: formData.department,
          shift: formData.shift,
          status: formData.status,
        };
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }

        await api.updateUser(editingUser.id, payload);
        toast.success(`User ${formData.name} updated successfully`);
      } else {
        // Create user
        if (!formData.password) {
          toast.error('Password is required for new users');
          return;
        }

        await api.createUser(formData);
        toast.success(`User ${formData.name} created successfully`);
      }

      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Failed to save user', {
        description: err.message,
      });
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateUserStatus(user.id, newStatus);
      toast.success(`Status updated for ${user.name}`, {
        description: `Set to ${newStatus}`,
      });
      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      toast.error('Failed to update status', {
        description: err.message,
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await api.deleteUser(userToDelete.id);
      toast.success(`User ${userToDelete.name} deleted`);
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      fetchData();
    } catch (err: any) {
      toast.error('Failed to delete user', {
        description: err.message,
      });
    }
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.phone && u.phone.includes(searchQuery)) ||
      (u.plantName && u.plantName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = selectedRoleFilter === 'all' || u.roleId === selectedRoleFilter;
    const matchesStatus = selectedStatusFilter === 'all' || u.status === selectedStatusFilter;
    const matchesPlant = isSuperAdmin
      ? (selectedPlantFilter === 'all' || u.plantId === selectedPlantFilter)
      : u.plantId === userPlantId;

    return matchesSearch && matchesRole && matchesStatus && matchesPlant;
  });

  // Stats calculation
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const totalRolesCount = roles.length;
  const departmentsCount = new Set(users.map(u => u.department).filter(Boolean)).size;
  const visiblePlantsCount = isSuperAdmin ? plants.length : 1;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              User Management
            </h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              RBAC Enabled
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure plant operators, operational shift rosters, role authorizations, and terminal credentials.
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
            <UserPlus className="h-4 w-4" />
            Add Plant Operator
          </Button>
        </div>
      </div>

      {/* KPI Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/70 border-border/70 backdrop-blur-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Plant Users</span>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Configured accounts</p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/70 backdrop-blur-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Operators</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-400">{activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Authorized for plant operations</p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/70 backdrop-blur-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Operational Plants</span>
            <Factory className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-amber-400">{visiblePlantsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isSuperAdmin ? 'RMC plant terminals network' : userPlantName}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/70 backdrop-blur-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Departments</span>
            <Building2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-purple-400">{departmentsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Plant operational wings</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-card/50 border-border/70">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
              <Input
                placeholder="Search by operator name, username, email, plant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/80"
              />
            </div>

            {/* Plant Filter */}
            {isSuperAdmin ? (
              <div className="w-full md:w-52">
                <Select value={selectedPlantFilter} onValueChange={setSelectedPlantFilter}>
                  <SelectTrigger className="bg-background/80">
                    <SelectValue placeholder="Filter by Plant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plants ({plants.length})</SelectItem>
                    {plants.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name.split('•')[0]?.trim()} ({p.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border/70 bg-muted/40 text-xs font-medium text-foreground">
                <Factory className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="truncate max-w-[180px]">{userPlantName}</span>
              </div>
            )}

            {/* Role Filter */}
            <div className="w-full md:w-48">
              <Select value={selectedRoleFilter} onValueChange={setSelectedRoleFilter}>
                <SelectTrigger className="bg-background/80">
                  <SelectValue placeholder="Filter by Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles ({users.length})</SelectItem>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-40">
              <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                <SelectTrigger className="bg-background/80">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Table */}
      <Card className="border-border/70 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[220px]">Operator Name</TableHead>
                <TableHead>Assigned Role</TableHead>
                <TableHead>Operating Plant</TableHead>
                <TableHead>Department & Shift</TableHead>
                <TableHead>Contact Information</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading plant users...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No operators match the selected criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const roleObj = user.role || roles.find(r => r.id === user.roleId);
                  const roleColor = user.roleColor || roleObj?.color || '#3b82f6';
                  const roleName = user.roleName || roleObj?.name || user.roleId;

                  return (
                    <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                      {/* Name & Username */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div 
                            className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0"
                            style={{ backgroundColor: roleColor }}
                          >
                            {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                              {user.name}
                              {user.id === currentUser?.id && (
                                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                  You
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Assigned Role */}
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className="text-xs font-medium border"
                          style={{ 
                            borderColor: `${roleColor}50`, 
                            color: roleColor,
                            backgroundColor: `${roleColor}10`
                          }}
                        >
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          {roleName}
                        </Badge>
                      </TableCell>

                      {/* Assigned Plant */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <Factory className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span className="truncate max-w-[170px]" title={user.plantName || 'Plant 01'}>
                            {user.plantId === 'all' ? (
                              <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30">
                                All Plants (Global)
                              </Badge>
                            ) : (
                              user.plantName || 'Plant 01 • Shamshabad'
                            )}
                          </span>
                        </div>
                      </TableCell>

                      {/* Department & Shift */}
                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          <div className="font-medium text-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {user.department || 'Operations'}
                          </div>
                          <div className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {user.shift || 'General'}
                          </div>
                        </div>
                      </TableCell>

                      {/* Contact Info */}
                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          <div className="text-muted-foreground flex items-center gap-1.5 truncate max-w-[190px]">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{user.email || '—'}</span>
                          </div>
                          {user.phone && (
                            <div className="text-muted-foreground flex items-center gap-1.5">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {(() => {
                          const canManageRow =
                            isSuperAdmin ||
                            (user.roleId === 'weighbridge_operator' && user.plantId === userPlantId);
                          return (
                            <button
                              onClick={() => canManageRow && handleToggleStatus(user)}
                              disabled={!canManageRow}
                              title={canManageRow ? 'Click to toggle status' : 'Status managed by Super Admin'}
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                                canManageRow ? 'hover:opacity-80 cursor-pointer' : 'opacity-80 cursor-default'
                              }`}
                              style={{
                                backgroundColor: 
                                  user.status === 'active' ? 'rgba(16, 185, 129, 0.15)' :
                                  user.status === 'suspended' ? 'rgba(239, 68, 68, 0.15)' :
                                  'rgba(148, 163, 184, 0.15)',
                                color: 
                                  user.status === 'active' ? '#10b981' :
                                  user.status === 'suspended' ? '#ef4444' :
                                  '#94a3b8',
                              }}
                            >
                              <span 
                                className="h-1.5 w-1.5 rounded-full" 
                                style={{ 
                                  backgroundColor: 
                                    user.status === 'active' ? '#10b981' :
                                    user.status === 'suspended' ? '#ef4444' :
                                    '#94a3b8' 
                                }} 
                              />
                              <span className="capitalize">{user.status}</span>
                            </button>
                          );
                        })()}
                      </TableCell>

                      {/* Last Activity */}
                      <TableCell className="text-xs text-muted-foreground">
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Never'}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        {(() => {
                          const canManageRow =
                            isSuperAdmin ||
                            (user.roleId === 'weighbridge_operator' && user.plantId === userPlantId);
                          const isProtectedRoot =
                            user.id === 'usr_admin' ||
                            user.id === 'USR-001' ||
                            user.id === 'USR-SUPER-001' ||
                            user.id === currentUser?.id;
                          return (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!canManageRow}
                                onClick={() => handleOpenEditDialog(user)}
                                className="h-8 w-8 p-0"
                                title={canManageRow ? 'Edit User' : 'Only Weighbridge Operators in your plant can be edited'}
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!canManageRow || isProtectedRoot}
                                onClick={() => {
                                  setUserToDelete(user);
                                  setDeleteConfirmOpen(true);
                                }}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                                title={canManageRow ? 'Delete User' : 'Cannot delete this account'}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ADD / EDIT USER DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              {editingUser ? 'Edit Plant Operator' : 'Add New Plant Operator'}
            </DialogTitle>
            <DialogDescription>
              {editingUser 
                ? 'Update operator credentials, operational role assignment, and shift.'
                : 'Create an operator account and provision terminal access permissions.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveUser} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="u-name" className="text-xs">Full Name *</Label>
                <Input
                  id="u-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Reddy"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="u-username" className="text-xs">Username *</Label>
                <Input
                  id="u-username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. ramesh_op"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="u-email" className="text-xs">Email</Label>
                <Input
                  id="u-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ramesh@aparna-rmc.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="u-phone" className="text-xs">Phone</Label>
                <Input
                  id="u-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="u-role" className="text-xs">Operational Role *</Label>
                <Select 
                  value={isSuperAdmin ? formData.roleId : 'weighbridge_operator'}
                  disabled={!isSuperAdmin}
                  onValueChange={(val) => {
                    const fallbackPlantId = plants[0]?.id || 'PL01';
                    const newPlantId = val === 'super_admin'
                      ? 'all'
                      : (formData.plantId === 'all' ? fallbackPlantId : formData.plantId);
                    const foundPlant = plants.find(p => p.id === newPlantId);
                    setFormData({ 
                      ...formData, 
                      roleId: val,
                      plantId: newPlantId,
                      plantName: val === 'super_admin' && newPlantId === 'all'
                        ? 'All Plants (Super Admin)'
                        : (foundPlant?.name || 'Plant 01 • Shamshabad Central')
                    });
                  }}
                >
                  <SelectTrigger id="u-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {isSuperAdmin && (
                      <>
                        <SelectItem value="super_admin">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                            <span>Super Admin</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="plant_user">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                            <span>Plant User</span>
                          </div>
                        </SelectItem>
                      </>
                    )}
                    <SelectItem value="weighbridge_operator">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                        <span>Weighbridge In-charge / Operator</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {!isSuperAdmin && (
                  <p className="text-[11px] text-muted-foreground">
                    Plant users can only create Weighbridge Operator accounts.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="u-plant" className="text-xs">Assigned Plant *</Label>
                <Select 
                  value={isSuperAdmin ? formData.plantId : userPlantId}
                  disabled={!isSuperAdmin}
                  onValueChange={(val) => {
                    const selectedPlant = plants.find(p => p.id === val);
                    setFormData({ 
                      ...formData, 
                      plantId: val,
                      plantName: val === 'all' ? 'All Plants (Super Admin)' : (selectedPlant?.name || 'Plant 01 • Shamshabad Central')
                    });
                  }}
                >
                  <SelectTrigger id="u-plant">
                    <SelectValue placeholder="Select plant" />
                  </SelectTrigger>
                  <SelectContent>
                    {isSuperAdmin && formData.roleId === 'super_admin' && (
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Factory className="h-3 w-3 text-purple-400" />
                          <span>All Plants (Global)</span>
                        </div>
                      </SelectItem>
                    )}
                    {plants.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <Factory className="h-3 w-3 text-amber-500" />
                          <span>{p.name.split('•')[0]?.trim()} ({p.code})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="u-dept" className="text-xs">Department</Label>
                <Select 
                  value={formData.department} 
                  onValueChange={(val) => setFormData({ ...formData, department: val })}
                >
                  <SelectTrigger id="u-dept">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Security & Logistics">Security & Logistics</SelectItem>
                    <SelectItem value="Quality & Weighment">Quality & Weighment</SelectItem>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="Quality Assurance">Quality Assurance</SelectItem>
                    <SelectItem value="Dispatch Operations">Dispatch Operations</SelectItem>
                    <SelectItem value="Fleet & Equipment">Fleet & Equipment</SelectItem>
                    <SelectItem value="Finance & Accounts">Finance & Accounts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="u-shift" className="text-xs">Shift Roster</Label>
                <Select 
                  value={formData.shift} 
                  onValueChange={(val) => setFormData({ ...formData, shift: val })}
                >
                  <SelectTrigger id="u-shift">
                    <SelectValue placeholder="Select Shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Morning (06:00 - 14:00)">Morning (06:00 - 14:00)</SelectItem>
                    <SelectItem value="General (09:00 - 18:00)">General (09:00 - 18:00)</SelectItem>
                    <SelectItem value="Afternoon (14:00 - 22:00)">Afternoon (14:00 - 22:00)</SelectItem>
                    <SelectItem value="Night (22:00 - 06:00)">Night (22:00 - 06:00)</SelectItem>
                    <SelectItem value="All Shifts">All Shifts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="u-status" className="text-xs">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger id="u-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="u-pass" className="text-xs">
                  {editingUser ? 'New Password (Optional)' : 'Password *'}
                </Label>
                <Input
                  id="u-pass"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? 'Leave blank to keep' : '••••••••'}
                  required={!editingUser}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingUser ? 'Update Operator' : 'Create Operator'}
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
              <AlertCircle className="h-5 w-5" />
              Confirm Delete
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete operator <strong>{userToDelete?.name}</strong> (@{userToDelete?.username})?
              This will revoke all system terminal access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete Operator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
