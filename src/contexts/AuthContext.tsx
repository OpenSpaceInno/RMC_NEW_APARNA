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

// Fallback initial admin role
const DEFAULT_ADMIN_ROLE: Role = {
  id: 'admin',
  name: 'Admin / Plant Manager',
  description: 'Executive control over Plant Operations, User Management, Gate Monitor, Weighbridge, and Device Configuration',
  color: '#8b5cf6',
  modules: ['/gate-monitor', '/weighbridge', '/plants', '/users', '/device-config', '*'],
  permissions: ['*'],
  isSystem: true,
};

const DEFAULT_ADMIN_USER: User = {
  id: 'usr_admin',
  username: 'admin',
  name: 'Rajesh Sharma (Admin / Plant Manager)',
  email: 'plantmanager@aparna-rmc.com',
  roleId: 'admin',
  roleName: 'Admin / Plant Manager',
  roleColor: '#8b5cf6',
  department: 'Plant Management',
  shift: 'All Shifts',
  status: 'active',
  plantId: 'all',
  plantName: 'All Plants (Global Admin)',
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
  const [plants, setPlants] = useState<Plant[]>(DEFAULT_PLANTS);
  const [activePlant, setActivePlant] = useState<Plant>(() => {
    try {
      const stored = localStorage.getItem(AUTH_PLANT_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return DEFAULT_PLANTS[0];
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
        // If current active plant is in list, sync its details
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
          const allowedRoles = ['admin', 'weighbridge_operator'];
          if (demoData.status === 'fulfilled' && Array.isArray(demoData.value)) {
            const filteredDemos = demoData.value.filter(u => allowedRoles.includes(u.roleId));
            setDemoUsers(filteredDemos.map(u => ({
              ...u,
              roleName: u.roleId === 'admin' ? 'Admin / Plant Manager' : 'Weighbridge In-charge / Operator',
              name: u.roleId === 'admin' ? 'Rajesh Sharma (Admin / Plant Manager)' : 'Ramesh Kulkarni (Weighbridge In-charge)',
              plantId: u.roleId === 'admin' ? 'all' : 'PL01',
              plantName: u.roleId === 'admin' ? 'All Plants (Global Admin)' : 'Plant 01 • Shamshabad Central',
            })));
          }
          if (rolesData.status === 'fulfilled' && Array.isArray(rolesData.value)) {
            const filteredRoles = rolesData.value.filter(r => allowedRoles.includes(r.id));
            setRoles(filteredRoles);
          }
          if (plantsData.status === 'fulfilled' && Array.isArray(plantsData.value) && plantsData.value.length > 0) {
            setPlants(plantsData.value);
            // Default active plant if not set or found
            const current = plantsData.value.find(p => p.id === activePlant.id) || plantsData.value[0];
            setActivePlant(current);
            localStorage.setItem(AUTH_PLANT_KEY, JSON.stringify(current));
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
        if (res.user.roleId === 'admin') {
          res.user.roleName = 'Admin / Plant Manager';
          res.user.plantId = res.user.plantId || 'all';
          res.user.plantName = res.user.plantName || 'All Plants (Global Admin)';
          if (res.user.role) res.user.role.name = 'Admin / Plant Manager';
        } else if (res.user.roleId === 'weighbridge_operator') {
          res.user.roleName = 'Weighbridge In-charge / Operator';
          res.user.plantId = res.user.plantId || 'PL01';
          res.user.plantName = res.user.plantName || 'Plant 01 • Shamshabad Central';
          if (res.user.role) res.user.role.name = 'Weighbridge In-charge / Operator';
        }

        // Set active plant based on user login
        const chosenPlantId = credentials.plantId || res.user.plantId;
        if (chosenPlantId && chosenPlantId !== 'all') {
          const match = plants.find(p => p.id === chosenPlantId);
          if (match) {
            setActivePlant(match);
            localStorage.setItem(AUTH_PLANT_KEY, JSON.stringify(match));
          }
        }

        saveAuthSession(res.user, res.token);
        toast.success(`Welcome, ${res.user.name}!`, {
          description: `Logged in as ${res.user.roleName || res.user.role?.name} at ${res.user.plantName || 'Plant Terminal'}`,
        });
        return true;
      } else {
        toast.error('Authentication failed', {
          description: res?.message || 'Invalid credentials',
        });
        return false;
      }
    } catch (err: any) {
      // Offline fallback demo authentication for the 2 allowed roles
      const isWeighRole = credentials.roleId === 'weighbridge_operator' || credentials.username === 'weigh_op';
      const targetUser = isWeighRole ? DEFAULT_WEIGHBRIDGE_USER : DEFAULT_ADMIN_USER;
      const targetToken = isWeighRole ? 'demo_token_weigh' : 'demo_token_admin';

      const chosenPlantId = credentials.plantId || (isWeighRole ? 'PL01' : 'PL01');
      const match = plants.find(p => p.id === chosenPlantId) || plants[0] || DEFAULT_PLANTS[0];
      setActivePlant(match);
      localStorage.setItem(AUTH_PLANT_KEY, JSON.stringify(match));

      saveAuthSession(targetUser, targetToken);
      toast.success(`Welcome, ${targetUser.name}!`, {
        description: `Logged in as ${targetUser.roleName} • ${match.name}`,
      });
      return true;
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

  // Check if current user has access to a given route URL
  const hasAccess = useCallback((path: string): boolean => {
    if (!user) return false;
    const userRole = user.role;
    const roleId = user.roleId || userRole?.id;

    // 1. Admin / Plant Manager has full access to all terminals: Gate Monitor, Weighbridge, Plants, Users, Device Config
    if (roleId === 'admin' || userRole?.modules?.includes('*')) {
      return true;
    }

    // 2. Weighbridge Role: strictly allowed ONLY Gate Monitor and Weighbridge (NO Device Config, NO Plants, NO Users)
    if (roleId === 'weighbridge_operator' || roleId === 'weighbridge') {
      return path === '/gate-monitor' || path === '/weighbridge' || path === '/';
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
  }, [user]);

  // Check specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    const userRole = user.role;
    if (user.roleId === 'admin' || userRole?.permissions?.includes('*')) {
      return true;
    }
    return userRole?.permissions?.includes(permission) || false;
  }, [user]);

  const value: AuthContextType = {
    user,
    role: user?.role || null,
    token,
    isAuthenticated: !!user,
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
