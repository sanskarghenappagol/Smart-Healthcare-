import { Router, Response } from 'express';
import { query, queryOne, getTransactionConnection } from '../db/mysql.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from './auth.js';
import { logAuditEvent } from '../db/mongodb.js';

export const billingRouter = Router();

/**
 * GET /api/bills
 * Scoped by role:
 * - Patient: Only their bills
 * - Doctor: Bills for their appointments
 * - Admin: All bills
 */
billingRouter.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT 
        b.bill_id,
        b.appointment_id,
        b.bill_date,
        b.amount,
        b.discount,
        b.status AS bill_status,
        b.created_at,
        fn_calculate_bill_total(b.amount, b.discount) AS final_payable,
        a.p_id,
        CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
        p.email AS patient_email,
        a.doctor_id,
        CONCAT(d.f_name, ' ', d.l_name) AS doctor_name,
        d.consult_fee,
        d.qualification,
        COALESCE(SUM(pay.amount), 0.00) AS total_paid
      FROM Bill b
      JOIN Appointment a ON b.appointment_id = a.appointment_id
      JOIN Patient p ON a.p_id = p.p_id
      JOIN Doctor d ON a.doctor_id = d.id
      LEFT JOIN Payment pay ON b.bill_id = pay.bill_id AND pay.status = 'Success'
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (req.user?.role === 'patient') {
      conditions.push('a.p_id = ?');
      params.push(req.user.ref_id);
    } else if (req.user?.role === 'doctor') {
      conditions.push('a.doctor_id = ?');
      params.push(req.user.ref_id);
    }

    if (status) {
      conditions.push('b.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' GROUP BY b.bill_id ORDER BY b.bill_date DESC';

    const bills = await query(sql, params);
    return res.json(bills);
  } catch (error: any) {
    console.error('Fetch bills error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bills/:id
 */
billingRouter.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const bill = await queryOne<any>(
      `SELECT 
        b.bill_id, b.appointment_id, b.bill_date, b.amount, b.discount, b.status AS bill_status,
        fn_calculate_bill_total(b.amount, b.discount) AS final_payable,
        a.p_id, CONCAT(p.f_name, ' ', p.l_name) AS patient_name, p.email AS patient_email,
        a.doctor_id, CONCAT(d.f_name, ' ', d.l_name) AS doctor_name, d.consult_fee
       FROM Bill b
       JOIN Appointment a ON b.appointment_id = a.appointment_id
       JOIN Patient p ON a.p_id = p.p_id
       JOIN Doctor d ON a.doctor_id = d.id
       WHERE b.bill_id = ?`,
      [id]
    );

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found.' });
    }

    // Role check
    if (req.user?.role === 'patient' && bill.p_id !== req.user.ref_id) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const payments = await query(
      'SELECT payment_id, utr, method, amount, status, payment_date FROM Payment WHERE bill_id = ? ORDER BY payment_date DESC',
      [id]
    );
    bill.payments = payments;

    return res.json(bill);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments (Simulate Payment)
 * Processes UPI, Card, or Net Banking payment for a bill
 */
billingRouter.post('/pay', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const conn = await getTransactionConnection();
  try {
    await conn.beginTransaction();

    const { bill_id, method, amount } = req.body;

    if (!bill_id || !method || !amount) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: 'Bill ID, payment method, and amount are required.' });
    }

    if (!['UPI', 'Card', 'Net Banking'].includes(method)) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: 'Supported payment methods: UPI, Card, Net Banking.' });
    }

    // Fetch bill
    const [bills]: any = await conn.query(
      `SELECT b.bill_id, b.amount, b.discount, b.status, a.p_id 
       FROM Bill b 
       JOIN Appointment a ON b.appointment_id = a.appointment_id 
       WHERE b.bill_id = ? FOR UPDATE`,
      [bill_id]
    );

    if (!bills || bills.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Bill record not found.' });
    }

    const bill = bills[0];

    // Authorization
    if (req.user?.role === 'patient' && bill.p_id !== req.user.ref_id) {
      await conn.rollback();
      conn.release();
      return res.status(403).json({ error: 'Unauthorized to pay another patient\'s bill.' });
    }

    if (bill.status === 'Paid') {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: 'This bill has already been fully paid.' });
    }

    // Generate unique UTR
    const timestampStr = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const utr = `${method.toUpperCase().replace(/\s+/g, '')}/${timestampStr}/${randomHex}`;

    // Insert Payment record
    const [payResult]: any = await conn.query(
      `INSERT INTO Payment (bill_id, utr, method, amount, status)
       VALUES (?, ?, ?, ?, 'Success')`,
      [bill_id, utr, method, Number(amount)]
    );

    // Calculate total payments so far
    const [totalPayRows]: any = await conn.query(
      'SELECT COALESCE(SUM(amount), 0.00) as paid_sum FROM Payment WHERE bill_id = ? AND status = "Success"',
      [bill_id]
    );
    const paidSum = Number(totalPayRows[0].paid_sum);
    const netBillAmount = Math.max(0, Number(bill.amount) - Number(bill.discount));

    // Update Bill status
    const newStatus = paidSum >= netBillAmount ? 'Paid' : 'Partially Paid';
    await conn.query('UPDATE Bill SET status = ? WHERE bill_id = ?', [newStatus, bill_id]);

    await conn.commit();
    conn.release();

    await logAuditEvent(req.user?.email || 'patient', req.user?.role || 'patient', 'INSERT', 'Payment', payResult.insertId, {
      bill_id,
      utr,
      method,
      amount: Number(amount),
      bill_status: newStatus
    });

    return res.status(201).json({
      message: 'Payment processed successfully.',
      payment_id: payResult.insertId,
      utr,
      bill_status: newStatus,
      amount_paid: Number(amount)
    });
  } catch (error: any) {
    await conn.rollback();
    conn.release();
    console.error('Payment error:', error);
    return res.status(500).json({ error: error.message || 'Payment processing failed.' });
  }
});
