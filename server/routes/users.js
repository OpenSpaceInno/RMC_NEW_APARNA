import express from 'express';
import { pool } from '../db.js';
import { normalizeColor } from './roles.js';
import { hashPassword, getRequestUser, isSuperAdminUser } from '../auth-security.js';

const router = express.Router();

export const formatUser = (u) => {
  const isGlobal = u.role_id === 'super_admin' || (u.role_id === 'admin' && (!u.plant_id || u.plant_id === 'all'));
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    roleId: u.role_id,
    roleName: u.role_name_actual || u.role_name,
    roleColor: normalizeColor(u.role_color),
    plantId: isGlobal ? 'all' : (u.plant_id || 'PL01'),
    plantName: isGlobal ? 'All Plants (Super Admin)' : (u.plant_name || 'Plant 01 • Shamshabad Central'),
    phone: u.phone,
    department: u.department,
    shift: u.shift,
    status: u.status,
    avatar: u.avatar,
    lastLogin: u.last_login,
    createdAt: u.created_at,
    updatedAt: u.updated_at
  };
};

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const caller = await getRequestUser(req);
    const { roleId, status, department, plantId, search } = req.query;
    let query = `
      SELECT u.*, r.color as role_color, r.name as role_name_actual 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE 1=1
    `;
    const params = [];

    if (caller && !isSuperAdminUser(caller)) {
      // Plant Users strictly see users belonging to their own plant (never global super admins or other plants)
      const callerPlantId = caller.plant_id || 'PL01';
      query += ` AND u.plant_id = ? AND u.role_id NOT IN ('super_admin', 'admin')`;
      params.push(callerPlantId);
    } else if (plantId && plantId !== 'all') {
      query += ' AND u.plant_id = ?';
      params.push(plantId);
    }

    if (roleId && roleId !== 'all') { query += ' AND u.role_id = ?'; params.push(roleId); }
    if (status && status !== 'all') { query += ' AND u.status = ?'; params.push(status); }
    if (department && department !== 'all') { query += ' AND u.department = ?'; params.push(department); }
    if (search) {
      query += ' AND (u.name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    query += ' ORDER BY u.created_at ASC';

    const [rows] = await pool.query(query, params);
    res.json(rows.map(formatUser));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.*, r.color as role_color FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(formatUser(rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users
router.post('/', async (req, res) => {
  try {
    const caller = await getRequestUser(req);
    const u = req.body;
    const id = u.id || `USR-${String(Math.floor(100 + Math.random() * 900))}`;

    let requestedRoleId = u.roleId || 'weighbridge_operator';
    let requestedPlantId = u.plantId;

    if (caller && !isSuperAdminUser(caller)) {
      if (caller.role_id !== 'plant_user') {
        return res.status(403).json({ error: 'You do not have permission to create users.' });
      }
      if (requestedRoleId !== 'weighbridge_operator') {
        return res.status(403).json({ error: 'Plant users can only create users with the Weighbridge Operator role.' });
      }
      requestedPlantId = caller.plant_id || 'PL01';
    }

    // Check role
    const [roleRows] = await pool.query('SELECT * FROM roles WHERE id = ?', [requestedRoleId]);
    const roleName = roleRows.length > 0 ? roleRows[0].name : (u.roleName || 'Operator');
    const roleId = roleRows.length > 0 ? roleRows[0].id : requestedRoleId;

    const cleanUsername = (u.username || '').trim();
    const cleanEmail = (u.email && u.email.trim()) ? u.email.trim() : `${cleanUsername}@aparna-rmc.com`;

    // Check unique username and email
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ? OR email = ?', [cleanUsername, cleanEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists in system' });
    }

    const initialPassword = u.password || 'SecurePassword@2026';
    const pwdHash = hashPassword(initialPassword);
    const isGlobalRole = roleId === 'super_admin' || (roleId === 'admin' && requestedPlantId === 'all');
    const plantId = isGlobalRole && (!requestedPlantId || requestedPlantId === 'all')
      ? 'all'
      : (requestedPlantId && requestedPlantId !== 'all' ? requestedPlantId : 'PL01');

    let plantName = u.plantName;
    if (plantId === 'all') {
      plantName = 'All Plants (Super Admin)';
    } else {
      const [pRows] = await pool.query('SELECT name FROM plants WHERE id = ? LIMIT 1', [plantId]).catch(() => [[]]);
      if (pRows && pRows.length > 0) {
        plantName = pRows[0].name;
      } else if (!plantName) {
        plantName = 'Plant 01 • Shamshabad Central';
      }
    }

    await pool.query(
      `INSERT INTO users (id, username, name, email, password_hash, role_id, role_name, plant_id, plant_name, phone, department, shift, status, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        cleanUsername,
        u.name,
        cleanEmail,
        pwdHash,
        roleId,
        roleName,
        plantId,
        plantName,
        u.phone || null,
        u.department || 'Operations',
        u.shift || 'General Shift',
        u.status || 'active',
        u.avatar || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000)}?w=150`
      ]
    );

    // Audit logging for user creation
    await pool.query(
      `INSERT INTO audit_logs (id, module, action, entity_id, entity_type, performed_by, details, severity)
       VALUES (?, 'USERS', 'USER_CREATED', ?, 'USER', ?, ?, 'info')`,
      [
        `AUD-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        id,
        JSON.stringify({ userId: caller?.id || 'ADMIN', username: caller?.username || 'superadmin' }),
        `Operator account '${cleanUsername}' (${u.name}) registered with role '${roleName}' at plant '${plantName}'`
      ]
    ).catch(e => console.warn('Audit log write error:', e.message));

    const [created] = await pool.query(
      `SELECT u.*, r.color as role_color, r.name as role_name_actual FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      [id]
    );
    res.status(201).json(formatUser(created[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  try {
    const caller = await getRequestUser(req);
    const u = req.body;
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'User not found' });

    if (caller && !isSuperAdminUser(caller)) {
      if (caller.role_id !== 'plant_user') {
        return res.status(403).json({ error: 'You do not have permission to update users.' });
      }
      if (existing[0].plant_id !== caller.plant_id || existing[0].role_id !== 'weighbridge_operator') {
        return res.status(403).json({ error: 'Plant users can only manage Weighbridge Operators within their own plant.' });
      }
      if (u.roleId && u.roleId !== 'weighbridge_operator') {
        return res.status(403).json({ error: 'Plant users can only assign the Weighbridge Operator role.' });
      }
      u.roleId = 'weighbridge_operator';
      u.plantId = caller.plant_id;
    }

    let roleName = existing[0].role_name;
    if (u.roleId) {
      const [roleRows] = await pool.query('SELECT name FROM roles WHERE id = ?', [u.roleId]);
      if (roleRows.length > 0) roleName = roleRows[0].name;
    }

    let resolvedPlantName = u.plantName;
    if (u.plantId === 'all') {
      resolvedPlantName = 'All Plants (Super Admin)';
    } else if (u.plantId) {
      const [pRows] = await pool.query('SELECT name FROM plants WHERE id = ? LIMIT 1', [u.plantId]).catch(() => [[]]);
      if (pRows && pRows.length > 0) resolvedPlantName = pRows[0].name;
    }

    let passwordClause = '';
    const extraParams = [];
    if (u.password && typeof u.password === 'string' && u.password.trim()) {
      passwordClause = ', password_hash = ?';
      extraParams.push(hashPassword(u.password.trim()));
    }

    await pool.query(
      `UPDATE users SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        department = COALESCE(?, department),
        shift = COALESCE(?, shift),
        role_id = COALESCE(?, role_id),
        role_name = COALESCE(?, role_name),
        plant_id = COALESCE(?, plant_id),
        plant_name = COALESCE(?, plant_name),
        status = COALESCE(?, status)
        ${passwordClause}
      WHERE id = ?`,
      [
        u.name,
        u.email,
        u.phone,
        u.department,
        u.shift,
        u.roleId,
        roleName,
        u.plantId,
        resolvedPlantName,
        u.status,
        ...extraParams,
        id
      ]
    );

    // Audit logging for user updates
    await pool.query(
      `INSERT INTO audit_logs (id, module, action, entity_id, entity_type, performed_by, details, severity)
       VALUES (?, 'USERS', 'USER_UPDATED', ?, 'USER', ?, ?, 'info')`,
      [
        `AUD-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        id,
        JSON.stringify({ userId: caller?.id || 'ADMIN', username: caller?.username || 'superadmin' }),
        `Operator profile '${existing[0].username}' (${u.name || existing[0].name}) updated${u.password ? ' (Password changed)' : ''}`
      ]
    ).catch(e => console.warn('Audit log write error:', e.message));

    const [updated] = await pool.query(
      `SELECT u.*, r.color as role_color, r.name as role_name_actual FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      [id]
    );
    res.json(formatUser(updated[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const caller = await getRequestUser(req);
    const { status } = req.body;
    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const [existing] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'User not found' });

    if (caller && !isSuperAdminUser(caller)) {
      if (caller.role_id !== 'plant_user' || existing[0].plant_id !== caller.plant_id || existing[0].role_id !== 'weighbridge_operator') {
        return res.status(403).json({ error: 'Plant users can only change status of Weighbridge Operators in their own plant.' });
      }
    }

    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    const [updated] = await pool.query(
      `SELECT u.*, r.color as role_color, r.name as role_name_actual FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      [req.params.id]
    );
    res.json(formatUser(updated[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const caller = await getRequestUser(req);
    if (req.params.id === 'USR-001' || req.params.id === 'USR-SUPER-001') {
      return res.status(400).json({ error: 'Root administrator account cannot be deleted.' });
    }

    if (caller && !isSuperAdminUser(caller)) {
      const [existing] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
      if (existing.length === 0) return res.status(404).json({ error: 'User not found' });
      if (caller.role_id !== 'plant_user' || existing[0].plant_id !== caller.plant_id || existing[0].role_id !== 'weighbridge_operator') {
        return res.status(403).json({ error: 'Plant users can only delete Weighbridge Operators in their own plant.' });
      }
    }

    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
