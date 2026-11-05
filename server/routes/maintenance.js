import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

export const formatTask = (row) => ({
  id: row.id,
  vehicleId: row.vehicle_id,
  vehicleRegNo: row.vehicle_reg_no,
  type: row.type,
  title: row.title,
  description: row.description,
  status: row.status,
  priority: row.priority,
  scheduledDate: row.scheduled_date,
  completedDate: row.completed_date,
  estimatedCost: Number(row.estimated_cost),
  actualCost: row.actual_cost !== null ? Number(row.actual_cost) : undefined,
  technician: row.technician,
  parts: typeof row.parts === 'string' ? JSON.parse(row.parts) : (row.parts || []),
  notes: row.notes,
  nextDueDate: row.next_due_date ? row.next_due_date.toISOString().split('T')[0] : null,
  nextDueOdometer: row.next_due_odometer,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// GET /api/maintenance/tasks
router.get('/tasks', async (req, res) => {
  try {
    const { status, vehicleId } = req.query;
    let query = 'SELECT * FROM maintenance_tasks WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (vehicleId) { query += ' AND vehicle_id = ?'; params.push(vehicleId); }
    query += ' ORDER BY scheduled_date DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows.map(formatTask));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/maintenance/tasks
router.post('/tasks', async (req, res) => {
  try {
    const m = req.body;
    const id = m.id || `mt_${Date.now()}`;
    await pool.query(
      `INSERT INTO maintenance_tasks (id, vehicle_id, vehicle_reg_no, type, title, description, status, priority, scheduled_date, estimated_cost, technician, parts, notes, next_due_date, next_due_odometer)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, m.vehicleId, m.vehicleRegNo, m.type || 'preventive', m.title, m.description || null,
        m.status || 'scheduled', m.priority || 'medium', m.scheduledDate || new Date(),
        m.estimatedCost || 0, m.technician || null, JSON.stringify(m.parts || []),
        m.notes || null, m.nextDueDate || null, m.nextDueOdometer || null
      ]
    );

    const [created] = await pool.query('SELECT * FROM maintenance_tasks WHERE id = ?', [id]);
    res.status(201).json(formatTask(created[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/maintenance/tasks/:id
router.put('/tasks/:id', async (req, res) => {
  try {
    const m = req.body;
    const updates = [];
    const params = [];

    const fieldMap = {
      title: 'title',
      description: 'description',
      status: 'status',
      priority: 'priority',
      scheduledDate: 'scheduled_date',
      completedDate: 'completed_date',
      actualCost: 'actual_cost',
      technician: 'technician',
      notes: 'notes'
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (m[key] !== undefined) {
        updates.push(`${col} = ?`);
        params.push(m[key]);
      }
    }
    if (m.parts) {
      updates.push('parts = ?');
      params.push(JSON.stringify(m.parts));
    }

    if (updates.length > 0) {
      params.push(req.params.id);
      await pool.query(`UPDATE maintenance_tasks SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const [updated] = await pool.query('SELECT * FROM maintenance_tasks WHERE id = ?', [req.params.id]);
    res.json(formatTask(updated[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/maintenance/tasks/:id
router.delete('/tasks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM maintenance_tasks WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
