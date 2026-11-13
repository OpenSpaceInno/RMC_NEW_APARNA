import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { User, Role, DemoUser, LoginCredentials } from '@/types/auth';
import { Plant, DEFAULT_PLANTS } from '@/types/plant';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  token: string | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isPlantUser: boolean;
  isLoading: boolean;
  demoUsers: DemoUser[];
  roles: Role[];
  plants: Plant[];
  activePlant: Plant;
  switchPlant: (plantId: string) => void;
  refreshPlants: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  switchRole: (roleId: string) => Promise<boolean>;
  logout: () => void;
  hasAccess: (path: string) => boolean;
  hasPermission: (permission: string) => boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'rmc_auth_user';
const AUTH_TOKEN_KEY = 'rmc_auth_token';
const AUTH_PLANT_KEY = 'rmc_active_plant';

export const ALL_PLANTS_OPTION: Plant = {
  id: 'all',
  code: 'ALL',
  name: 'All Plants',
  location: 'All Plant Terminals',
  city: 'Enterprise',
  capacityPerHour: 0,
  status: 'active',
};

// Fallback initial Super Admin role
const DEFAULT_ADMIN_ROLE: Role = {
  id: 'super_admin',
  name: 'Super Admin',
  description: 'Global enterprise control over all plants, Gate Monitor, Weighbridge, Plant Management, User Management, and Device Configuration',
  color: '#8b5cf6',
  modules: ['/gate-monitor', '/weighbridge', '/plants', '/users', '/device-config', '*'],
  permissions: ['*'],
  isSystem: true,
};

const DEFAULT_ADMIN_USER: User = {
  id: 'USR-SUPER-001',
  username: 'superadmin',
  name: 'Super Admin',
  email: 'superadmin@aparnarmc.com',
  roleId: 'super_admin',
  roleName: 'Super Admin',
  roleColor: '#8b5cf6',
  department: 'Corporate Administration',
  shift: 'All Shifts',
  status: 'active',
  plantId: 'all',
  plantName: 'All Plants (Super Admin)',
  role: DEFAULT_ADMIN_ROLE,
};

export const DEFAULT_WEIGHBRIDGE_USER: User = {
  id: 'usr_weighbridge',
  username: 'weigh_op',
  name: 'Ramesh Kulkarni (Weighbridge In-charge)',
  email: 'weighbridge@aparna-rmc.com',
  roleId: 'weighbridge_operator',
  roleName: 'Weighbridge In-charge / Operator',
  roleColor: '#10b981',
  department: 'Weighbridge Terminal',
  shift: 'General (08:00 - 18:00)',
  status: 'active',
  plantId: 'PL01',
  plantName: 'Plant 01 • Shamshabad Central',
  role: {
    id: 'weighbridge_operator',
    name: 'Weighbridge In-charge / Operator',
    description: 'Operational terminal access: Gate Monitor and Weighbridge live feeds and tare/gross capture',
    color: '#10b981',
    modules: ['/gate-monitor', '/weighbridge', '/'],
    permissions: ['weighbridge:capture', 'gate:read'],
    isSystem: true,
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse cached user:', e);
    }
    // Default to admin for seamless first load
    return DEFAULT_ADMIN_USER;
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY) || 'demo_token_admin';
    } catch (e) {
      return 'demo_token_admin';
    }
  });

  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [activePlant, setActivePlant] = useState<Plant>(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_USER_KEY);
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const storedPlant = localStorage.getItem(AUTH_PLANT_KEY);
      if (storedPlant) {
        const parsedPlant = JSON.parse(storedPlant);
        if (parsedUser && parsedUser.plantId && parsedUser.plantId !== 'all' && parsedPlant.id === 'all') {
          return DEFAULT_PLANTS[0];
        }
        return parsedPlant;
      }
    } catch (e) {}
    return ALL_PLANTS_OPTION;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync token and user to localStorage
  const saveAuthSession = (newUser: User | null, newToken: string | null) => {
    if (newUser && newToken) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
      localStorage.setItem(AUTH_TOKEN_KEY, newToken);
      setUser(newUser);
      setToken(newToken);
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setUser(null);
      setToken(null);
    }
  };

  const refreshPlants = useCallback(async () => {
    try {
      const plantsData = await api.getPlants();
      if (Array.isArray(plantsData) && plantsData.length > 0) {
        setPlants(plantsData);
        if (activePlant.id === 'all') {
          return;
        }
        const found = plantsData.find(p => p.id === activePlant.id);
        if (found) {
          setActivePlant(found);
          localStorage.setItem(AUTH_PLANT_KEY, JSON.stringify(found));
        }
      }
    } catch (e) {
      console.warn('Could not refresh plants from API, using cached state:', e);
    }
  }, [activePlant.id]);

  const switchPlant = useCallback((plantId: string) => {
    if (plantId === 'all') {
      setActivePlant(ALL_PLANTS_OPTION);
      localStorage.setItem(AUTH_PLANT_KEY, JSON.stringify(ALL_PLANTS_OPTION));
      toast.success(`Plant Filter Switched`, {
        description: `Now viewing All Plants`,
      });
      return;
    }
    const target = plants.find(p => p.id === plantId);
    if (target) {
      setActivePlant(target);
      localStorage.setItem(AUTH_PLANT_KEY, JSON.stringify(target));
      toast.success(`Plant Terminal Switched`, {
        description: `Now monitoring ${target.name} (${target.code})`,
      });
    }
  }, [plants]);

  // Fetch demo users, roles & plants on load
  useEffect(() => {
    let mounted = true;
    async function loadInitialData() {
      try {
        const [demoData, rolesData, plantsData] = await Promise.allSettled([
          api.getDemoUsers(),
          api.getRoles(),
          api.getPlants(),
        ]);

        if (mounted) {
          const allowedRoles = ['super_admin', 'plant_user', 'admin', 'weighbridge_operator'];
          if (demoData.status === 'fulfilled' && Array.isArray(demoData.value)) {
            const filteredDemos = demoData.value.filter(u => allowedRoles.includes(u.roleId));
            setDemoUsers(filteredDemos);
          }
          if (rolesData.status === 'fulfilled' && Array.isArray(rolesData.value)) {
            setRoles(rolesData.value);
          }
          if (plantsData.status === 'fulfilled' && Array.isArray(plantsData.value) && plantsData.value.length > 0) {
            setPlants(plantsData.value);
            if (user?.plantId && user.plantId !== 'all') {
              const assigned = plantsData.value.find(p => p.id === user.plantId) || plantsData.value[0];
              setActivePlant(assigned);
              localStorage.setItem(AUTH_PLANT_KEY, JSON.stringify(assigned));
            } else if (activePlant.id === 'all') {
              setActivePlant(ALL_PLANTS_OPTION);
              localStorage.setItem(AUTH_PLANT_KEY, JSON.stringify(ALL_PLANTS_OPTION));
            } else {
              const current = plantsData.value.find(p => p.id === activePlant.id) || ALL_PLANTS_OPTION;
              setActivePlant(current);
              localStorage.setItem(AUTH_PLANT_KEY, JSON.stringify(current));
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch initial roles or demo users from API:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadInitialData();
    return () => {
      mounted = false;
    };
  }, []);

  const refreshUserData = useCallback(async () => {
    try {
      const res = await api.getMe();
      const userProfile = res?.user || ((res as any)?.id ? (res as any) : null);
      if (userProfile) {
        saveAuthSession(userProfile, token || 'demo_token');
      }
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    }
  }, [token]);

  // Login with credentials or roleId
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      if (res?.success && res.user) {
        const isGlobal =
          res.user.roleId === 'super_admin' ||
          (res.user.roleId === 'admin' && (!res.user.plantId || res.user.plantId === 'all'));

        if (isGlobal) {
          res.user.plantId = 'all';
          res.user.plantName = 'All Plants (Super Admin)';
          const targetPlant =
            credentials.plantId && credentials.plantId !== 'all'
              ? (plants.find(p => p.id === credentials.plantId) || ALL_PLANTS_OPTION)
              : ALL_PLANTS_OPTION;
          setActivePlant(targetPlant);
          localStorage.setItem(AUTH_PLANT_KEY, JSON.stringify(targetPlant));
        } else {
          // Bind Plant User / Weighbridge Operator strictly to their assigned plant
          const designatedPlantId = res.user.plantId || credentials.plantId || 'PL01';
          const match = plants.find(p => p.id === designatedPlantId) || plants[0];
          if (match) {
            setActivePlant(match);
            localStorage.setItem(AUTH_PLANT_KEY, JSON.stringify(match));
            res.user.plantId = match.id;
            res.user.plantName = match.name;
          }
        }

        saveAuthSession(res.user, res.token);
        toast.success(`Welcome, ${res.user.name}!`, {
          description: isGlobal
            ? 'Global Terminal: All Plants Access Enabled'
            : `Operating Terminal: ${res.user.plantName || activePlant.name}`,
        });
        return true;
      } else {
        const errorMsg = res?.message || 'Invalid login details';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error(err?.message || 'Invalid login details');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // One-click switch role
  const switchRole = async (roleId: string): Promise<boolean> => {
    return login({ roleId });
  };

  // Logout
  const logout = () => {
    saveAuthSession(null, null);
    toast.info('Logged out', {
      description: 'You have been signed out of Aparna RMC operations',
    });
  };

  const isSuperAdmin = Boolean(
    user &&
      (user.roleId === 'super_admin' ||
        (user.roleId === 'admin' && (!user.plantId || user.plantId === 'all')))
  );
  const isPlantUser = Boolean(
    user &&
      (user.roleId === 'plant_user' ||
        (user.roleId === 'admin' && user.plantId && user.plantId !== 'all'))
  );

  // Keep activePlant strictly locked to user's assigned plant for non-Super-Admin users
  useEffect(() => {
    if (!user || isSuperAdmin) return;
    if (user.plantId && user.plantId !== 'all' && activePlant.id !== user.plantId) {
      const match = plants.find(p => p.id === user.plantId);
      if (match) {
        setActivePlant(match);
        localStorage.setItem(AUTH_PLANT_KEY, JSON.stringify(match));
      }
    }
  }, [user, isSuperAdmin, plants, activePlant.id]);

  // Check if current user has access to a given route URL
  const hasAccess = useCallback((path: string): boolean => {
    if (!user) return false;
    const userRole = user.role;
    const roleId = user.roleId || userRole?.id;

    // 1. Super Admin (or legacy global admin with plantId === 'all') has full access
    if (isSuperAdmin) {
      return true;
    }

    // 2. Plant User: strictly allowed Gate Monitor, Weighbridge, and User Management of their own plant ONLY
    if (roleId === 'plant_user' || isPlantUser) {
      return (
        path === '/' ||
        path === '/gate-monitor' ||
        path === '/weighbridge' ||
        path === '/users'
      );
    }

    // 3. Weighbridge Role: strictly allowed ONLY Gate Monitor and Weighbridge (NO Device Config, NO Plants, NO Users)
    if (roleId === 'weighbridge_operator' || roleId === 'weighbridge') {
      return path === '/gate-monitor' || path === '/weighbridge' || path === '/';
    }

    if (userRole?.modules?.includes('*')) {
      return true;
    }

    if (!userRole?.modules || !Array.isArray(userRole.modules)) {
      return false;
    }

    const modules = userRole.modules;

    // Exact root match
    if (path === '/') {
      return modules.includes('/');
    }

    // Match exact path or subpath
    return modules.some((m) => {
      if (m === '*') return true;
      if (m === path) return true;
      if (m !== '/' && path.startsWith(m)) return true;
      return false;
    });
  }, [user, isSuperAdmin, isPlantUser]);

  // Check specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    const userRole = user.role;
    if (isSuperAdmin || userRole?.permissions?.includes('*')) {
      return true;
    }
    return userRole?.permissions?.includes(permission) || false;
  }, [user, isSuperAdmin]);

  const value: AuthContextType = {
    user,
    role: user?.role || null,
    token,
    isAuthenticated: !!user,
    isSuperAdmin,
    isPlantUser,
    isLoading,
    demoUsers,
    roles,
    plants,
    activePlant,
    switchPlant,
    refreshPlants,
    login,
    switchRole,
    logout,
    hasAccess,
    hasPermission,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
