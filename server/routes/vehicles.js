import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Helper to format vehicle row to camelCase matching frontend interface
export const formatVehicle = (row) => ({
  id: row.id,
  registrationNo: row.registration_no,
  type: row.type,
  make: row.make,
  model: row.model,
  year: row.year,
  capacity: Number(row.capacity),
  capacityUnit: row.capacity_unit,
  fuelType: row.fuel_type,
  status: row.status,
  currentDriver: row.current_driver,
  currentDriverPhone: row.current_driver_phone,
  lastMaintenance: row.last_maintenance ? row.last_maintenance.toISOString().split('T')[0] : null,
  nextMaintenance: row.next_maintenance ? row.next_maintenance.toISOString().split('T')[0] : null,
  insuranceExpiry: row.insurance_expiry ? row.insurance_expiry.toISOString().split('T')[0] : null,
  fitnessExpiry: row.fitness_expiry ? row.fitness_expiry.toISOString().split('T')[0] : null,
  permitExpiry: row.permit_expiry ? row.permit_expiry.toISOString().split('T')[0] : null,
  odometer: Number(row.odometer),
  fuelEfficiency: Number(row.fuel_efficiency),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// GET /api/vehicles
router.get('/', async (req, res) => {
  try {
    const { status, type } = req.query;
    let query = 'SELECT * FROM vehicles WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (type) { query += ' AND type = ?'; params.push(type); }
    query += ' ORDER BY registration_no ASC';

    const [rows] = await pool.query(query, params);
    res.json(rows.map(formatVehicle));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/vehicles/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });

    const [maintenance] = await pool.query('SELECT * FROM vehicle_maintenance WHERE vehicle_id = ? ORDER BY performed_at DESC', [req.params.id]);
    const [documents] = await pool.query('SELECT * FROM vehicle_documents WHERE vehicle_id = ? ORDER BY expires_at ASC', [req.params.id]);

    res.json({
      ...formatVehicle(rows[0]),
      maintenanceHistory: maintenance,
      documents
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/vehicles
router.post('/', async (req, res) => {
  try {
    const v = req.body;
    const id = v.id || `v_${Date.now()}`;
    await pool.query(
      `INSERT INTO vehicles (id, registration_no, type, make, model, year, capacity, capacity_unit, fuel_type, status, current_driver, current_driver_phone, last_maintenance, next_maintenance, insurance_expiry, fitness_expiry, permit_expiry, odometer, fuel_efficiency)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, v.registrationNo, v.type, v.make, v.model, v.year || new Date().getFullYear(),
        v.capacity || 0, v.capacityUnit || 'ton', v.fuelType || 'diesel', v.status || 'available',
        v.currentDriver || null, v.currentDriverPhone || null, v.lastMaintenance || null, v.nextMaintenance || null,
        v.insuranceExpiry || null, v.fitnessExpiry || null, v.permitExpiry || null,
        v.odometer || 0, v.fuelEfficiency || 0
      ]
    );

    const [created] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [id]);
    res.status(201).json(formatVehicle(created[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/vehicles/:id
router.put('/:id', async (req, res) => {
  try {
    const v = req.body;
    const updates = [];
    const params = [];

    const fieldMap = {
      registrationNo: 'registration_no',
      type: 'type',
      make: 'make',
      model: 'model',
      year: 'year',
      capacity: 'capacity',
      capacityUnit: 'capacity_unit',
      fuelType: 'fuel_type',
      status: 'status',
      currentDriver: 'current_driver',
      currentDriverPhone: 'current_driver_phone',
      lastMaintenance: 'last_maintenance',
      nextMaintenance: 'next_maintenance',
      insuranceExpiry: 'insurance_expiry',
      fitnessExpiry: 'fitness_expiry',
      permitExpiry: 'permit_expiry',
      odometer: 'odometer',
      fuelEfficiency: 'fuel_efficiency'
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (v[key] !== undefined) {
        updates.push(`${col} = ?`);
        params.push(v[key]);
      }
    }

    if (updates.length > 0) {
      params.push(req.params.id);
      await pool.query(`UPDATE vehicles SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const [updated] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    if (updated.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(formatVehicle(updated[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/vehicles/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM vehicles WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/vehicles/:id/assign-driver
router.post('/:id/assign-driver', async (req, res) => {
  try {
    const { driverName, driverPhone } = req.body;
    await pool.query('UPDATE vehicles SET current_driver = ?, current_driver_phone = ? WHERE id = ?', [driverName, driverPhone, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/vehicles/:id/unassign-driver
router.post('/:id/unassign-driver', async (req, res) => {
  try {
    await pool.query('UPDATE vehicles SET current_driver = NULL, current_driver_phone = NULL WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
