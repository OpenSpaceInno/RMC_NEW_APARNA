import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

export const formatDriver = (row) => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  email: row.email,
  dateOfBirth: row.date_of_birth ? row.date_of_birth.toISOString().split('T')[0] : null,
  address: row.address,
  employeeId: row.employee_id,
  dateOfJoining: row.date_of_joining ? row.date_of_joining.toISOString().split('T')[0] : null,
  status: row.status,
  photo: row.photo,
  emergencyContact: typeof row.emergency_contact === 'string' ? JSON.parse(row.emergency_contact) : row.emergency_contact,
  license: typeof row.license === 'string' ? JSON.parse(row.license) : row.license,
  assignedVehicle: row.assigned_vehicle,
  rating: Number(row.rating),
  totalTrips: Number(row.total_trips),
  totalDistance: Number(row.total_distance),
  currentTripId: row.current_trip_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// GET /api/drivers
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM drivers WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY name ASC';

    const [rows] = await pool.query(query, params);
    res.json(rows.map(formatDriver));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/drivers/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM drivers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Driver not found' });
    res.json(formatDriver(rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/drivers
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const id = d.id || `drv_${Date.now()}`;
    await pool.query(
      `INSERT INTO drivers (id, name, phone, email, date_of_birth, address, employee_id, date_of_joining, status, photo, emergency_contact, license, assigned_vehicle, rating, total_trips, total_distance, current_trip_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, d.name, d.phone, d.email || null, d.dateOfBirth || null, d.address || null,
        d.employeeId || `EMP-${Date.now().toString().slice(-4)}`, d.dateOfJoining || new Date().toISOString().split('T')[0],
        d.status || 'available', d.photo || null,
        JSON.stringify(d.emergencyContact || {}), JSON.stringify(d.license || {}),
        d.assignedVehicle || null, d.rating || 5.0, d.totalTrips || 0, d.totalDistance || 0, d.currentTripId || null
      ]
    );

    const [created] = await pool.query('SELECT * FROM drivers WHERE id = ?', [id]);
    res.status(201).json(formatDriver(created[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/drivers/:id
router.put('/:id', async (req, res) => {
  try {
    const d = req.body;
    const updates = [];
    const params = [];

    const fieldMap = {
      name: 'name',
      phone: 'phone',
      email: 'email',
      dateOfBirth: 'date_of_birth',
      address: 'address',
      employeeId: 'employee_id',
      dateOfJoining: 'date_of_joining',
      status: 'status',
      photo: 'photo',
      assignedVehicle: 'assigned_vehicle',
      rating: 'rating',
      totalTrips: 'total_trips',
      totalDistance: 'total_distance',
      currentTripId: 'current_trip_id'
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (d[key] !== undefined) {
        updates.push(`${col} = ?`);
        params.push(d[key]);
      }
    }

    if (d.emergencyContact) {
      updates.push('emergency_contact = ?');
      params.push(JSON.stringify(d.emergencyContact));
    }
    if (d.license) {
      updates.push('license = ?');
      params.push(JSON.stringify(d.license));
    }

    if (updates.length > 0) {
      params.push(req.params.id);
      await pool.query(`UPDATE drivers SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const [updated] = await pool.query('SELECT * FROM drivers WHERE id = ?', [req.params.id]);
    if (updated.length === 0) return res.status(404).json({ error: 'Driver not found' });
    res.json(formatDriver(updated[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/drivers/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM drivers WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Driver deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
