import { pool } from '../db.js';
import { hashPassword } from '../auth-security.js';

export const initialRoles = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Global enterprise administrator with full access to all modules across all plants, plant creation, user management, and device configuration.',
    color: 'purple',
    modules: [
      '*', '/', '/gate-monitor', '/weighbridge', '/plants', '/users', '/device-config',
      '/loading', '/dispatch', '/trips', '/trip-tracking', '/trip-analytics',
      '/exit-verification', '/incidents', '/audit-logs', '/vehicles', '/drivers',
      '/fuel', '/maintenance', '/billing', '/inventory', '/reports', '/customer-portal',
      '/database-setup', '/roles'
    ],
    permissions: ['*', 'all:manage', 'plants:manage', 'users:manage', 'roles:manage', 'config:manage', 'reports:export', 'override:approve'],
    is_system: true
  },
  {
    id: 'plant_user',
    name: 'Plant User',
    description: 'Plant-scoped manager with access to Gate Monitor, Weighbridge, and Plant User Management (Weighbridge role creation only) for their assigned plant.',
    color: 'blue',
    modules: ['/', '/gate-monitor', '/weighbridge', '/users'],
    permissions: ['gate:read', 'weighbridge:capture', 'weighbridge:tare', 'weighbridge:gross', 'users:manage_plant'],
    is_system: true
  },
  {
    id: 'admin',
    name: 'Plant Head / Admin',
    description: 'Legacy global administrator role with multi-plant visibility and configuration access.',
    color: 'purple',
    modules: [
      '*', '/', '/gate-monitor', '/weighbridge', '/plants', '/users', '/device-config',
      '/loading', '/dispatch', '/trips', '/trip-tracking', '/trip-analytics',
      '/exit-verification', '/incidents', '/audit-logs', '/vehicles', '/drivers',
      '/fuel', '/maintenance', '/billing', '/inventory', '/reports', '/customer-portal',
      '/database-setup', '/roles'
    ],
    permissions: ['*', 'all:manage', 'users:manage', 'roles:manage', 'config:manage', 'reports:export', 'override:approve'],
    is_system: true
  },
  {
    id: 'gate_operator',
    name: 'Gate Monitor / Security Officer',
    description: 'Manages entry/exit ANPR barriers, physical delivery note scans, vehicle entry verification, and emergency barrier overrides.',
    color: 'emerald',
    modules: ['/', '/gate-monitor', '/exit-verification', '/incidents', '/vehicles', '/drivers'],
    permissions: ['gate:read', 'gate:override', 'exit:verify', 'incidents:create', 'vehicles:view', 'drivers:view'],
    is_system: true
  },
  {
    id: 'weighbridge_operator',
    name: 'Weighbridge In-charge / Operator',
    description: 'Performs precision tare and gross weighment captures, calibration checks, scale zeroing, and gate monitoring for their assigned plant.',
    color: 'emerald',
    modules: ['/', '/weighbridge', '/gate-monitor'],
    permissions: ['weighbridge:capture', 'weighbridge:tare', 'weighbridge:gross', 'gate:read'],
    is_system: true
  },
  {
    id: 'batching_operator',
    name: 'Batching Plant Supervisor',
    description: 'Operates mixing bay consoles, controls raw material batch dispensing (cement, sand, aggregates, admixtures), and monitors silo levels.',
    color: 'amber',
    modules: ['/', '/loading', '/inventory', '/reports'],
    permissions: ['loading:dispense', 'loading:session', 'inventory:view', 'inventory:movements', 'reports:read'],
    is_system: true
  },
  {
    id: 'qc_inspector',
    name: 'Quality Control Lead',
    description: 'Performs slump retention tests, temperature readings, water-cement ratio verification, and approves dispatch dockets.',
    color: 'teal',
    modules: ['/', '/loading', '/dispatch', '/incidents', '/reports'],
    permissions: ['qc:verify', 'dispatch:approve', 'dispatch:reject', 'incidents:create', 'incidents:resolve', 'reports:read'],
    is_system: true
  },
  {
    id: 'dispatch_officer',
    name: 'Dispatch & Logistics Officer',
    description: 'Reviews transit mixer delivery dockets, manages driver assignments, tracks GPS telematics routes, and monitors delay slippage.',
    color: 'sky',
    modules: ['/', '/dispatch', '/trips', '/trip-tracking', '/trip-analytics'],
    permissions: ['dispatch:approve', 'trips:manage', 'tracking:view', 'analytics:view'],
    is_system: true
  },
  {
    id: 'fleet_manager',
    name: 'Fleet & Workshop Manager',
    description: 'Supervises transit mixer health, fitness certifications, driver licences, fuel consumption economy, and maintenance bay schedules.',
    color: 'rose',
    modules: ['/', '/vehicles', '/drivers', '/fuel', '/maintenance', '/incidents', '/reports'],
    permissions: ['vehicles:manage', 'drivers:manage', 'fuel:manage', 'maintenance:manage', 'reports:read'],
    is_system: true
  },
  {
    id: 'accounts_manager',
    name: 'Commercial & Accounts Lead',
    description: 'Generates GST tax invoices, logs client bank payments, verifies customer statements, and tracks material inventory costs.',
    color: 'indigo',
    modules: ['/', '/billing', '/customer-portal', '/inventory', '/reports'],
    permissions: ['billing:invoices', 'billing:payments', 'customers:view', 'inventory:view', 'reports:export'],
    is_system: true
  }
];

export const initialUsers = [
  {
    id: 'USR-SUPER-001',
    username: 'superadmin',
    name: 'Super Admin',
    email: 'superadmin@aparnarmc.com',
    password_hash: hashPassword('superadmin123'),
    role_id: 'super_admin',
    role_name: 'Super Admin',
    plant_id: 'all',
    plant_name: 'All Plants (Super Admin)',
    phone: '+91 98200 00001',
    department: 'Corporate Administration',
    shift: 'All Shifts',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  },
  {
    id: 'USR-PLANT-001',
    username: 'plant_pl01',
    name: 'Shamshabad Plant User',
    email: 'plant.pl01@aparnarmc.com',
    password_hash: hashPassword('plant123'),
    role_id: 'plant_user',
    role_name: 'Plant User',
    plant_id: 'PL01',
    plant_name: 'Plant 01 • Shamshabad Central',
    phone: '+91 98200 10002',
    department: 'Plant Operations Management',
    shift: 'General Shift (08:00 - 18:00)',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
  },
  {
    id: 'USR-PLANT-002',
    username: 'op_miyapur',
    name: 'Miyapur Plant User',
    email: 'miyapur@aparnarmc.com',
    password_hash: hashPassword('plant123'),
    role_id: 'plant_user',
    role_name: 'Plant User',
    plant_id: 'PL02',
    plant_name: 'Plant 02 • Miyapur Metro',
    phone: '+91 98200 10003',
    department: 'Plant Operations Management',
    shift: 'General Shift (08:00 - 18:00)',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'
  },
  {
    id: 'USR-WEIGH-001',
    username: 'weigh_op',
    name: 'Ramesh Kulkarni (Weighbridge)',
    email: 'weigh.op@aparnarmc.com',
    password_hash: hashPassword('weigh123'),
    role_id: 'weighbridge_operator',
    role_name: 'Weighbridge In-charge / Operator',
    plant_id: 'PL01',
    plant_name: 'Plant 01 • Shamshabad Central',
    phone: '+91 98200 30001',
    department: 'Weighbridge Operations',
    shift: 'Morning Shift (06:00 - 14:00)',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
  },
  {
    id: 'USR-001',
    username: 'admin',
    name: 'Rajesh Sharma',
    email: 'admin@aparnarmc.com',
    password_hash: 'admin123', // Demo login password
    role_id: 'super_admin',
    role_name: 'Super Admin',
    plant_id: 'all',
    plant_name: 'All Plants (Super Admin)',
    phone: '+91 98200 10001',
    department: 'Plant Operations Management',
    shift: 'General Shift (08:00 - 18:00)',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  },
  {
    id: 'USR-002',
    username: 'gate.security',
    name: 'Mahesh Patil',
    email: 'security@aparnarmc.com',
    password_hash: 'gate123',
    role_id: 'gate_operator',
    role_name: 'Gate Security Supervisor',
    phone: '+91 98200 20002',
    department: 'Security & Gate Control',
    shift: 'Morning Shift (06:00 - 14:00)',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
  },
  {
    id: 'USR-003',
    username: 'weighbridge.op',
    name: 'Ramesh Kulkarni',
    email: 'weighbridge@aparnarmc.com',
    password_hash: 'scale123',
    role_id: 'weighbridge_operator',
    role_name: 'Weighbridge Scale Operator',
    phone: '+91 98200 30003',
    department: 'Weighbridge Operations',
    shift: 'Morning Shift (06:00 - 14:00)',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
  },
  {
    id: 'USR-004',
    username: 'batching.supv',
    name: 'Anil Desai',
    email: 'batching@aparnarmc.com',
    password_hash: 'batch123',
    role_id: 'batching_operator',
    role_name: 'Batching Plant Supervisor',
    phone: '+91 98200 40004',
    department: 'Concrete Batching & Loading',
    shift: 'Day Shift (08:00 - 17:00)',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
  },
  {
    id: 'USR-005',
    username: 'qc.inspector',
    name: 'Vikram Joshi',
    email: 'qc@aparnarmc.com',
    password_hash: 'qc123',
    role_id: 'qc_inspector',
    role_name: 'Quality Control Lead',
    phone: '+91 98200 50005',
    department: 'Quality Assurance & Lab',
    shift: 'General Shift (08:00 - 17:00)',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'
  },
  {
    id: 'USR-006',
    username: 'dispatch.lead',
    name: 'Amitabh Verma',
    email: 'dispatch@aparnarmc.com',
    password_hash: 'dispatch123',
    role_id: 'dispatch_officer',
    role_name: 'Dispatch & Logistics Officer',
    phone: '+91 98200 60006',
    department: 'Logistics & Dispatch Control',
    shift: 'General Shift (08:00 - 18:00)',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150'
  },
  {
    id: 'USR-007',
    username: 'fleet.mgr',
    name: 'Sunil Shinde',
    email: 'fleet@aparnarmc.com',
    password_hash: 'fleet123',
    role_id: 'fleet_manager',
    role_name: 'Fleet & Workshop Manager',
    phone: '+91 98200 70007',
    department: 'Fleet & Mechanical Workshop',
    shift: 'Day Shift (08:30 - 18:00)',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150'
  },
  {
    id: 'USR-008',
    username: 'billing.acc',
    name: 'Pooja Hegde',
    email: 'billing@aparnarmc.com',
    password_hash: 'billing123',
    role_id: 'accounts_manager',
    role_name: 'Commercial & Accounts Lead',
    phone: '+91 98200 80008',
    department: 'Finance & Commercial Billing',
    shift: 'General Shift (09:00 - 18:00)',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
  }
];

export async function seedUsersAndRoles() {
  console.log('🌱 Seeding roles and initial users...');

  // 1. Seed Roles
  for (const role of initialRoles) {
    const [existing] = await pool.query('SELECT id FROM roles WHERE id = ?', [role.id]);
    if (existing.length === 0) {
      await pool.query(
        `INSERT INTO roles (id, name, description, color, modules, permissions, is_system)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          role.id,
          role.name,
          role.description,
          role.color,
          JSON.stringify(role.modules),
          JSON.stringify(role.permissions),
          role.is_system
        ]
      );
    } else {
      // Keep modules and permissions up to date
      await pool.query(
        `UPDATE roles SET name = ?, description = ?, color = ?, modules = ?, permissions = ? WHERE id = ?`,
        [
          role.name,
          role.description,
          role.color,
          JSON.stringify(role.modules),
          JSON.stringify(role.permissions),
          role.id
        ]
      );
    }
  }

  // 2. Seed Users
  for (const user of initialUsers) {
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE id = ? OR username = ?',
      [user.id, user.username]
    );
    if (existing.length === 0) {
      await pool.query(
        `INSERT INTO users (id, username, name, email, password_hash, role_id, role_name, plant_id, plant_name, phone, department, shift, status, avatar)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.username,
          user.name,
          user.email,
          user.password_hash,
          user.role_id,
          user.role_name,
          user.plant_id || (user.role_id === 'super_admin' || user.role_id === 'admin' ? 'all' : 'PL01'),
          user.plant_name || (user.role_id === 'super_admin' || user.role_id === 'admin' ? 'All Plants (Super Admin)' : 'Plant 01 • Shamshabad Central'),
          user.phone,
          user.department,
          user.shift,
          user.status,
          user.avatar
        ]
      );
    }
  }

  // Ensure USR-001 / superadmin maintain global 'all' plant scope if previously defaulted to PL01
  await pool.query(
    `UPDATE users SET plant_id = 'all', plant_name = 'All Plants (Super Admin)' WHERE role_id = 'super_admin'`
  ).catch(() => {});

  console.log('✅ Roles and users successfully seeded!');
}
