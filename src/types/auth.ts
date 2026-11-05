export interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  modules: string[];
  permissions: string[];
  isSystem: boolean;
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  roleColor?: string;
  phone?: string;
  department?: string;
  shift?: string;
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  plantId?: string;
  plantName?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  role?: Role;
}

export interface DemoUser {
  id: string;
  username: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  roleColor: string;
  roleDescription: string;
  department?: string;
  shift?: string;
  avatar?: string;
  plantId?: string;
  plantName?: string;
  moduleCount: number;
}

export interface LoginCredentials {
  username?: string;
  password?: string;
  roleId?: string;
  plantId?: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  message?: string;
}
