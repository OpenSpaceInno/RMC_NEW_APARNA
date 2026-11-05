import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

export const formatItem = (row) => ({
  id: row.id,
  name: row.name,
  sku: row.sku,
  category: row.category,
  unit: row.unit,
  currentStock: Number(row.current_stock),
  minStock: Number(row.min_stock),
  maxStock: Number(row.max_stock),
  reorderLevel: Number(row.reorder_level),
  reorderQuantity: Number(row.reorder_quantity),
  unitCost: Number(row.unit_cost),
  totalValue: Number(row.total_value),
  location: row.location,
  supplier: row.supplier,
  supplierContact: row.supplier_contact,
  lastReceived: row.last_received ? row.last_received.toISOString().split('T')[0] : null,
  lastConsumed: row.last_consumed ? row.last_consumed.toISOString().split('T')[0] : null,
  expiryDate: row.expiry_date ? row.expiry_date.toISOString().split('T')[0] : null,
  isLowStock: Number(row.current_stock) < Number(row.reorder_level),
  isOverstock: Number(row.current_stock) > Number(row.max_stock),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// GET /api/inventory/items
router.get('/items', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM inventory_items WHERE 1=1';
    const params = [];
    if (category) { query += ' AND category = ?'; params.push(category); }
    query += ' ORDER BY name ASC';

    const [rows] = await pool.query(query, params);
    res.json(rows.map(formatItem));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/inventory/items
router.post('/items', async (req, res) => {
  try {
    const it = req.body;
    const id = it.id || `inv_${Date.now()}`;
    const totalValue = Number(it.currentStock || 0) * Number(it.unitCost || 0);

    await pool.query(
      `INSERT INTO inventory_items (id, name, sku, category, unit, current_stock, min_stock, max_stock, reorder_level, reorder_quantity, unit_cost, total_value, location, supplier, supplier_contact)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, it.name, it.sku || `SKU-${Date.now().toString().slice(-5)}`, it.category || 'cement',
        it.unit || 'tons', it.currentStock || 0, it.minStock || 0, it.maxStock || 1000,
        it.reorderLevel || 0, it.reorderQuantity || 0, it.unitCost || 0, totalValue,
        it.location || 'Silo', it.supplier || null, it.supplierContact || null
      ]
    );

    const [created] = await pool.query('SELECT * FROM inventory_items WHERE id = ?', [id]);
    res.status(201).json(formatItem(created[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/inventory/movements
router.post('/movements', async (req, res) => {
  try {
    const m = req.body;
    const id = m.id || `mov_${Date.now()}`;
    const [existing] = await pool.query('SELECT * FROM inventory_items WHERE id = ?', [m.itemId]);
    if (existing.length === 0) return res.status(404).json({ error: 'Item not found' });

    const prev = Number(existing[0].current_stock);
    const qty = Number(m.quantity);
    let next = prev;
    if (m.type === 'receipt' || m.type === 'return') next = prev + qty;
    else if (m.type === 'consumption' || m.type === 'adjustment') next = Math.max(0, prev - qty);

    const unitCost = Number(m.unitCost || existing[0].unit_cost);
    const totalCost = qty * unitCost;

    await pool.query(
      `INSERT INTO stock_movements (id, item_id, item_name, item_sku, type, quantity, previous_stock, new_stock, unit_cost, total_cost, reference_number, notes, performed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, m.itemId, existing[0].name, existing[0].sku, m.type, qty, prev, next, unitCost, totalCost,
        m.referenceNumber || null, m.notes || null, m.performedBy || 'Inventory Staff'
      ]
    );

    // Update stock in inventory_items
    await pool.query('UPDATE inventory_items SET current_stock = ?, total_value = ? * unit_cost WHERE id = ?', [next, next, m.itemId]);

    res.status(201).json({ success: true, movementId: id, newStock: next });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inventory/movements
router.get('/movements', async (req, res) => {
  try {
    const { itemId } = req.query;
    let query = 'SELECT * FROM stock_movements WHERE 1=1';
    const params = [];
    if (itemId) { query += ' AND item_id = ?'; params.push(itemId); }
    query += ' ORDER BY created_at DESC LIMIT 100';

    const [rows] = await pool.query(query, params);
    const mapped = rows.map((r) => ({
      id: r.id,
      itemId: r.item_id,
      itemName: r.item_name,
      itemSku: r.item_sku,
      type: r.type,
      quantity: Number(r.quantity),
      previousStock: Number(r.previous_stock),
      newStock: Number(r.new_stock),
      unitCost: Number(r.unit_cost),
      totalCost: Number(r.total_cost),
      referenceNumber: r.reference_number,
      notes: r.notes,
      performedBy: r.performed_by,
      date: r.created_at ? r.created_at.toISOString() : new Date().toISOString()
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/inventory/items/:id
router.put('/items/:id', async (req, res) => {
  try {
    const it = req.body;
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM inventory_items WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Item not found' });

    const currentStock = it.currentStock !== undefined ? Number(it.currentStock) : Number(existing[0].current_stock);
    const unitCost = it.unitCost !== undefined ? Number(it.unitCost) : Number(existing[0].unit_cost);
    const totalValue = currentStock * unitCost;

    await pool.query(
      `UPDATE inventory_items SET
        name = COALESCE(?, name),
        sku = COALESCE(?, sku),
        category = COALESCE(?, category),
        unit = COALESCE(?, unit),
        current_stock = ?,
        min_stock = COALESCE(?, min_stock),
        max_stock = COALESCE(?, max_stock),
        reorder_level = COALESCE(?, reorder_level),
        reorder_quantity = COALESCE(?, reorder_quantity),
        unit_cost = ?,
        total_value = ?,
        location = COALESCE(?, location),
        supplier = COALESCE(?, supplier),
        supplier_contact = COALESCE(?, supplier_contact)
      WHERE id = ?`,
      [
        it.name, it.sku, it.category, it.unit,
        currentStock, it.minStock, it.maxStock, it.reorderLevel, it.reorderQuantity,
        unitCost, totalValue, it.location, it.supplier, it.supplierContact,
        id
      ]
    );

    const [updated] = await pool.query('SELECT * FROM inventory_items WHERE id = ?', [id]);
    res.json(formatItem(updated[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/inventory/items/:id
router.delete('/items/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM inventory_items WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inventory/reorder-alerts
router.get('/reorder-alerts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM inventory_items WHERE current_stock <= reorder_level');
    const alerts = rows.map((r) => ({
      id: `alert_${r.id}`,
      itemId: r.id,
      itemName: r.name,
      itemSku: r.sku,
      currentStock: Number(r.current_stock),
      reorderLevel: Number(r.reorder_level),
      reorderQuantity: Number(r.reorder_quantity),
      supplier: r.supplier,
      priority: Number(r.current_stock) <= Number(r.min_stock) ? 'critical' : 'high',
      status: 'pending'
    }));
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
