import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

export const formatInvoice = (row) => ({
  id: row.id,
  invoiceNumber: row.invoice_number,
  customerId: row.customer_id,
  customerName: row.customer_name,
  customerAddress: row.customer_address,
  customerEmail: row.customer_email,
  customerPhone: row.customer_phone,
  customerGST: row.customer_gst,
  tripIds: typeof row.trip_ids === 'string' ? JSON.parse(row.trip_ids) : (row.trip_ids || []),
  items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
  subtotal: Number(row.subtotal),
  taxAmount: Number(row.tax_amount),
  discountAmount: Number(row.discount_amount),
  totalAmount: Number(row.total_amount),
  paidAmount: Number(row.paid_amount),
  balanceAmount: Number(row.balance_amount),
  status: row.status,
  issueDate: row.issue_date ? row.issue_date.toISOString().split('T')[0] : null,
  dueDate: row.due_date ? row.due_date.toISOString().split('T')[0] : null,
  paidDate: row.paid_date ? row.paid_date.toISOString().split('T')[0] : null,
  notes: row.notes,
  terms: row.terms,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// GET /api/billing/invoices
router.get('/invoices', async (req, res) => {
  try {
    const { status, customerId } = req.query;
    let query = 'SELECT * FROM invoices WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (customerId) { query += ' AND customer_id = ?'; params.push(customerId); }
    query += ' ORDER BY issue_date DESC, created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows.map(formatInvoice));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/billing/invoices
router.post('/invoices', async (req, res) => {
  try {
    const inv = req.body;
    const id = inv.id || `inv_${Date.now()}`;
    const invoiceNumber = inv.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
    const subtotal = Number(inv.subtotal || 0);
    const tax = Number(inv.taxAmount || 0);
    const discount = Number(inv.discountAmount || 0);
    const total = inv.totalAmount !== undefined ? Number(inv.totalAmount) : (subtotal + tax - discount);
    const paid = Number(inv.paidAmount || 0);
    const balance = total - paid;

    await pool.query(
      `INSERT INTO invoices (id, invoice_number, customer_id, customer_name, customer_address, customer_email, customer_phone, customer_gst, trip_ids, items, subtotal, tax_amount, discount_amount, total_amount, paid_amount, balance_amount, status, issue_date, due_date, notes, terms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, invoiceNumber, inv.customerId, inv.customerName, inv.customerAddress || null,
        inv.customerEmail || null, inv.customerPhone || null, inv.customerGST || null,
        JSON.stringify(inv.tripIds || []), JSON.stringify(inv.items || []),
        subtotal, tax, discount, total, paid, balance,
        inv.status || 'draft', inv.issueDate || new Date().toISOString().split('T')[0],
        inv.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        inv.notes || null, inv.terms || null
      ]
    );

    const [created] = await pool.query('SELECT * FROM invoices WHERE id = ?', [id]);
    res.status(201).json(formatInvoice(created[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/billing/payments
router.post('/payments', async (req, res) => {
  try {
    const p = req.body;
    const id = p.id || `pay_${Date.now()}`;
    await pool.query(
      `INSERT INTO payments (id, invoice_id, invoice_number, customer_id, customer_name, amount, method, reference_number, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, p.invoiceId, p.invoiceNumber, p.customerId, p.customerName,
        p.amount, p.method || 'bank_transfer', p.referenceNumber || null, p.notes || null
      ]
    );

    // Update invoice balance and status
    if (p.invoiceId) {
      await pool.query(
        `UPDATE invoices 
         SET paid_amount = paid_amount + ?,
             balance_amount = GREATEST(0, total_amount - (paid_amount + ?)),
             status = CASE WHEN (total_amount - (paid_amount + ?)) <= 0 THEN 'paid' ELSE 'pending' END,
             paid_date = CASE WHEN (total_amount - (paid_amount + ?)) <= 0 THEN CURRENT_DATE ELSE paid_date END
         WHERE id = ?`,
        [p.amount, p.amount, p.amount, p.amount, p.invoiceId]
      );
    }

    res.status(201).json({ success: true, paymentId: id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
