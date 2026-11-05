import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

export const formatFuel = (row) => ({
  id: row.id,
  vehicleId: row.vehicle_id,
  vehicleRegNo: row.vehicle_reg_no,
  driverId: row.driver_id,
  driverName: row.driver_name,
  tripId: row.trip_id,
  tripNumber: row.trip_number,
  fuelType: row.fuel_type,
  quantity: Number(row.quantity),
  pricePerUnit: Number(row.price_per_unit),
  totalCost: Number(row.total_cost),
  odometerReading: Number(row.odometer_reading),
  fuelStation: row.fuel_station,
  location: row.location,
  receiptNumber: row.receipt_number,
  date: row.date ? row.date.toISOString().split('T')[0] : null,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// GET /api/fuel/records
router.get('/records', async (req, res) => {
  try {
    const { vehicleId } = req.query;
    let query = 'SELECT * FROM fuel_records WHERE 1=1';
    const params = [];
    if (vehicleId) { query += ' AND vehicle_id = ?'; params.push(vehicleId); }
    query += ' ORDER BY date DESC, created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows.map(formatFuel));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/fuel/records
router.post('/records', async (req, res) => {
  try {
    const f = req.body;
    const id = f.id || `fuel_${Date.now()}`;
    const totalCost = f.totalCost || (Number(f.quantity) * Number(f.pricePerUnit));
    await pool.query(
      `INSERT INTO fuel_records (id, vehicle_id, vehicle_reg_no, driver_id, driver_name, trip_id, trip_number, fuel_type, quantity, price_per_unit, total_cost, odometer_reading, fuel_station, location, receipt_number, date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, f.vehicleId, f.vehicleRegNo, f.driverId || null, f.driverName || null,
        f.tripId || null, f.tripNumber || null, f.fuelType || 'diesel',
        f.quantity, f.pricePerUnit, totalCost, f.odometerReading || 0,
        f.fuelStation || 'Plant Fuel Station', f.location || null, f.receiptNumber || null,
        f.date || new Date().toISOString().split('T')[0], f.notes || null
      ]
    );

    const [created] = await pool.query('SELECT * FROM fuel_records WHERE id = ?', [id]);
    res.status(201).json(formatFuel(created[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/fuel/records/:id
router.delete('/records/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM fuel_records WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
