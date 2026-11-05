import express from 'express';
import { pool } from '../db.js';
import { normalizeColor } from './roles.js';
import { hashPassword } from '../auth-security.js';

const router = express.Router();

export const formatUser = (u) => ({
  id: u.id,
  username: u.username,
  name: u.name,
  email: u.email,
  roleId: u.role_id,
  roleName: u.role_name_actual || u.role_name,
  roleColor: normalizeColor(u.role_color),
  plantId: u.plant_id || (u.role_id === 'admin' ? 'all' : 'PL01'),
  plantName: u.plant_name || (u.role_id === 'admin' ? 'All Plants (Global Admin)' : 'Plant 01 • Shamshabad Central'),
  phone: u.phone,
  department: u.department,
  shift: u.shift,
  status: u.status,
  avatar: u.avatar,
  lastLogin: u.last_login,
  createdAt: u.created_at,
  updatedAt: u.updated_at
});

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const { roleId, status, department, plantId, search } = req.query;
    let query = `
      SELECT u.*, r.color as role_color, r.name as role_name_actual 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE 1=1
    `;
    const params = [];

    if (roleId && roleId !== 'all') { query += ' AND u.role_id = ?'; params.push(roleId); }
    if (status && status !== 'all') { query += ' AND u.status = ?'; params.push(status); }
    if (department && department !== 'all') { query += ' AND u.department = ?'; params.push(department); }
    if (plantId && plantId !== 'all') { query += ' AND (u.plant_id = ? OR u.plant_id = "all")'; params.push(plantId); }
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
    const u = req.body;
    const id = u.id || `USR-${String(Math.floor(100 + Math.random() * 900))}`;
    
    // Check role
    const [roleRows] = await pool.query('SELECT * FROM roles WHERE id = ?', [u.roleId || 'gate_operator']);
    const roleName = roleRows.length > 0 ? roleRows[0].name : (u.roleName || 'Operator');
    const roleId = roleRows.length > 0 ? roleRows[0].id : (u.roleId || 'gate_operator');

    // Check unique username and email
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ? OR email = ?', [u.username, u.email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists in system' });
    }

    const initialPassword = u.password || 'SecurePassword@2026';
    const pwdHash = hashPassword(initialPassword);
    const plantId = u.plantId || (roleId === 'admin' ? 'all' : 'PL01');
    const plantName = u.plantName || (plantId === 'all' ? 'All Plants (Global Admin)' : 'Plant 01 • Shamshabad Central');

    await pool.query(
      `INSERT INTO users (id, username, name, email, password_hash, role_id, role_name, plant_id, plant_name, phone, department, shift, status, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        u.username,
        u.name,
        u.email,
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
        JSON.stringify({ userId: 'ADMIN', username: 'admin' }),
        `Operator account '${u.username}' (${u.name}) registered with role '${roleName}' at plant '${plantName}'`
      ]
    ).catch(e => console.warn('Audit log write error:', e.message));

    const [created] = await pool.query(
      `SELECT u.*, r.color as role_color FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
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
    const u = req.body;
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'User not found' });

    let roleName = existing[0].role_name;
    if (u.roleId) {
      const [roleRows] = await pool.query('SELECT name FROM roles WHERE id = ?', [u.roleId]);
      if (roleRows.length > 0) roleName = roleRows[0].name;
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
        u.plantName,
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
        JSON.stringify({ userId: 'ADMIN', username: 'admin' }),
        `Operator profile '${existing[0].username}' (${u.name || existing[0].name}) updated${u.password ? ' (Password changed)' : ''}`
      ]
    ).catch(e => console.warn('Audit log write error:', e.message));

    const [updated] = await pool.query(
      `SELECT u.*, r.color as role_color FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
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
    const { status } = req.body;
    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    const [updated] = await pool.query(
      `SELECT u.*, r.color as role_color FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
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
    if (req.params.id === 'USR-001') {
      return res.status(400).json({ error: 'Root administrator account cannot be deleted.' });
    }
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
