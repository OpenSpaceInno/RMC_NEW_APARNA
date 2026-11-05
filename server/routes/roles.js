import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

export const normalizeColor = (color) => {
  const COLOR_MAP = {
    purple: '#8b5cf6',
    blue: '#3b82f6',
    emerald: '#10b981',
    amber: '#f59e0b',
    teal: '#06b6d4',
    sky: '#0284c7',
    rose: '#f43f5e',
    indigo: '#6366f1',
    green: '#10b981',
    red: '#ef4444',
    yellow: '#eab308'
  };
  return COLOR_MAP[color?.toLowerCase()] || color || '#3b82f6';
};

export const formatRole = (r) => ({
  id: r.id,
  name: r.name,
  description: r.description,
  color: normalizeColor(r.color),
  modules: typeof r.modules === 'string' ? JSON.parse(r.modules) : (r.modules || []),
  permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : (r.permissions || []),
  isSystem: Boolean(r.is_system),
  userCount: Number(r.user_count || 0),
  createdAt: r.created_at,
  updatedAt: r.updated_at
});

// GET /api/roles
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, COUNT(u.id) as user_count 
      FROM roles r 
      LEFT JOIN users u ON r.id = u.role_id 
      WHERE r.id IN ('admin', 'weighbridge_operator')
      GROUP BY r.id 
      ORDER BY r.is_system DESC, r.name ASC
    `);
    res.json(rows.map(formatRole));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/roles/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, COUNT(u.id) as user_count 
       FROM roles r 
       LEFT JOIN users u ON r.id = u.role_id 
       WHERE r.id = ? 
       GROUP BY r.id`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Role not found' });
    res.json(formatRole(rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/roles
router.post('/', async (req, res) => {
  try {
    const r = req.body;
    const id = r.id || r.name.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const [existing] = await pool.query('SELECT id FROM roles WHERE id = ?', [id]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'A role with this ID or identifier already exists' });
    }

    await pool.query(
      `INSERT INTO roles (id, name, description, color, modules, permissions, is_system)
       VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
      [
        id,
        r.name,
        r.description || '',
        r.color || 'blue',
        JSON.stringify(r.modules || ['/']),
        JSON.stringify(r.permissions || [])
      ]
    );

    const [created] = await pool.query('SELECT *, 0 as user_count FROM roles WHERE id = ?', [id]);
    res.status(201).json(formatRole(created[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/roles/:id
router.put('/:id', async (req, res) => {
  try {
    const r = req.body;
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Role not found' });

    await pool.query(
      `UPDATE roles SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        color = COALESCE(?, color),
        modules = COALESCE(?, modules),
        permissions = COALESCE(?, permissions)
      WHERE id = ?`,
      [
        r.name,
        r.description,
        r.color,
        r.modules ? JSON.stringify(r.modules) : null,
        r.permissions ? JSON.stringify(r.permissions) : null,
        id
      ]
    );

    // If role name changed, sync to users table
    if (r.name && r.name !== existing[0].name) {
      await pool.query('UPDATE users SET role_name = ? WHERE role_id = ?', [r.name, id]);
    }

    const [updated] = await pool.query(
      `SELECT r.*, COUNT(u.id) as user_count 
       FROM roles r 
       LEFT JOIN users u ON r.id = u.role_id 
       WHERE r.id = ? 
       GROUP BY r.id`,
      [id]
    );
    res.json(formatRole(updated[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/roles/:id
router.delete('/:id', async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM roles WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Role not found' });

    if (existing[0].is_system) {
      return res.status(400).json({ error: 'System roles are protected and cannot be deleted.' });
    }

    const [users] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role_id = ?', [req.params.id]);
    if (users[0].count > 0) {
      return res.status(400).json({ 
        error: `Cannot delete role. There are ${users[0].count} user(s) currently assigned to this role.` 
      });
    }

    await pool.query('DELETE FROM roles WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
