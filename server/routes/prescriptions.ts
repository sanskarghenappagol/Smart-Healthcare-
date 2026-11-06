import { Router, Response } from 'express';
import { query, queryOne, getTransactionConnection } from '../db/mysql.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from './auth.js';
import { logAuditEvent } from '../db/mongodb.js';

export const prescriptionsRouter = Router();

/**
 * GET /api/prescriptions
 * Patient sees their prescriptions; Doctor sees their issued prescriptions; Admin sees all
 */
prescriptionsRouter.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let sql = `
      SELECT 
        pr.pers_id,
        pr.appointment_id,
        pr.symptoms,
        pr.diagnosis,
        pr.prescribed_date,
        pr.follow_up_date,
        a.p_id,
        CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
        p.gender AS patient_gender,
        fn_calculate_patient_age(p.dob) AS patient_age,
        a.doctor_id,
        CONCAT(d.f_name, ' ', d.l_name) AS doctor_name,
        d.qualification AS doctor_qualification,
        b.bill_id,
        b.amount AS bill_amount,
        b.status AS bill_status
      FROM Prescription pr
      JOIN Appointment a ON pr.appointment_id = a.appointment_id
      JOIN Patient p ON a.p_id = p.p_id
      JOIN Doctor d ON a.doctor_id = d.id
      LEFT JOIN Bill b ON a.appointment_id = b.appointment_id
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

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY pr.prescribed_date DESC';

    const prescriptions = await query<any>(sql, params);

    // Fetch prescribed medicines for all retrieved prescriptions
    for (const pr of prescriptions) {
      const meds = await query(
        `SELECT pm.medicine_id, m.name, m.category, m.price, pm.dosage, pm.frequency, pm.duration_days, pm.instruction
         FROM Prescription_Medicine pm
         JOIN Medicine m ON pm.medicine_id = m.id
         WHERE pm.pers_id = ?`,
        [pr.pers_id]
      );
      pr.medicines = meds;
    }

    return res.json(prescriptions);
  } catch (error: any) {
    console.error('Fetch prescriptions error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/prescriptions/:id
 */
prescriptionsRouter.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const pr = await queryOne<any>(
      `SELECT 
        pr.pers_id, pr.appointment_id, pr.symptoms, pr.diagnosis, pr.prescribed_date, pr.follow_up_date,
        a.p_id, CONCAT(p.f_name, ' ', p.l_name) AS patient_name, fn_calculate_patient_age(p.dob) AS patient_age,
        a.doctor_id, CONCAT(d.f_name, ' ', d.l_name) AS doctor_name, d.qualification AS doctor_qualification
       FROM Prescription pr
       JOIN Appointment a ON pr.appointment_id = a.appointment_id
       JOIN Patient p ON a.p_id = p.p_id
       JOIN Doctor d ON a.doctor_id = d.id
       WHERE pr.pers_id = ?`,
      [id]
    );

    if (!pr) {
      return res.status(404).json({ error: 'Prescription not found.' });
    }

    const meds = await query(
      `SELECT pm.medicine_id, m.name, m.category, m.price, pm.dosage, pm.frequency, pm.duration_days, pm.instruction
       FROM Prescription_Medicine pm
       JOIN Medicine m ON pm.medicine_id = m.id
       WHERE pm.pers_id = ?`,
      [id]
    );
    pr.medicines = meds;

    return res.json(pr);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/prescriptions
 * Doctor or Admin creating prescription with medicines
 */
prescriptionsRouter.post('/', authenticateToken, requireRole('doctor', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
  const conn = await getTransactionConnection();
  try {
    await conn.beginTransaction();

    const { appointment_id, symptoms, diagnosis, follow_up_date, medicines } = req.body;

    if (!appointment_id || !symptoms || !diagnosis) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: 'Appointment ID, symptoms, and diagnosis are mandatory.' });
    }

    // Verify appointment exists
    const [appts]: any = await conn.query('SELECT doctor_id, status FROM Appointment WHERE appointment_id = ?', [appointment_id]);
    if (!appts || appts.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    if (req.user?.role === 'doctor' && appts[0].doctor_id !== req.user.ref_id) {
      await conn.rollback();
      conn.release();
      return res.status(403).json({ error: 'Doctors may only write prescriptions for their own appointments.' });
    }

    // Check 1-to-1 uniqueness: only 1 prescription per appointment
    const [existing]: any = await conn.query('SELECT pers_id FROM Prescription WHERE appointment_id = ?', [appointment_id]);
    if (existing && existing.length > 0) {
      await conn.rollback();
      conn.release();
      return res.status(409).json({ error: 'A prescription already exists for this appointment.' });
    }

    // Insert Prescription
    const [prescResult]: any = await conn.query(
      `INSERT INTO Prescription (appointment_id, symptoms, diagnosis, prescribed_date, follow_up_date)
       VALUES (?, ?, ?, CURDATE(), ?)`,
      [appointment_id, symptoms, diagnosis, follow_up_date || null]
    );

    const pers_id = prescResult.insertId;

    // Insert prescribed medicines into junction table Prescription_Medicine
    if (Array.isArray(medicines) && medicines.length > 0) {
      for (const item of medicines) {
        if (!item.medicine_id) continue;

        // Check stock availability
        const [medRows]: any = await conn.query('SELECT in_stock, name FROM Medicine WHERE id = ?', [item.medicine_id]);
        if (!medRows || medRows.length === 0) {
          throw new Error(`Medicine with ID ${item.medicine_id} not found.`);
        }
        if (medRows[0].in_stock <= 0) {
          throw new Error(`Medicine "${medRows[0].name}" is currently out of stock.`);
        }

        // Inserting triggers the MySQL trigger `trg_after_presc_med_insert` which decrements in_stock!
        await conn.query(
          `INSERT INTO Prescription_Medicine (pers_id, medicine_id, dosage, frequency, duration_days, instruction)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            pers_id,
            item.medicine_id,
            item.dosage || 'Standard dose',
            item.frequency || 'Once daily',
            Number(item.duration_days) || 3,
            item.instruction || 'As advised'
          ]
        );
      }
    }

    // Mark appointment as Completed if not already
    await conn.query('UPDATE Appointment SET status = "Completed" WHERE appointment_id = ?', [appointment_id]);

    await conn.commit();
    conn.release();

    // Now recalculate/generate bill through stored procedure `sp_generate_bill`
    await query('CALL sp_generate_bill(?, 0.00, @b_id, @tot, @code, @msg)', [appointment_id]);

    await logAuditEvent(req.user?.email || 'doctor', req.user?.role || 'doctor', 'INSERT', 'Prescription', pers_id, {
      appointment_id,
      medicine_count: Array.isArray(medicines) ? medicines.length : 0
    });

    return res.status(201).json({
      message: 'Prescription created successfully and medicines dispensed.',
      pers_id
    });
  } catch (error: any) {
    await conn.rollback();
    conn.release();
    console.error('Prescription create error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create prescription.' });
  }
});
