import { Router, Response } from 'express';
import { query, queryOne, getTransactionConnection } from '../db/mysql.js';
import { authenticateToken, AuthenticatedRequest } from './auth.js';
import { logAuditEvent } from '../db/mongodb.js';

export const appointmentsRouter = Router();

/**
 * GET /api/appointments
 * Scoped by role:
 * - Patient only sees their own appointments
 * - Doctor only sees appointments assigned to them
 * - Admin sees all appointments
 */
appointmentsRouter.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, date } = req.query;
    let sql = `
      SELECT 
        a.appointment_id,
        a.p_id,
        CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
        p.gender AS patient_gender,
        p.blood_group AS patient_blood_group,
        fn_calculate_patient_age(p.dob) AS patient_age,
        a.doctor_id,
        CONCAT(d.f_name, ' ', d.l_name) AS doctor_name,
        d.qualification AS doctor_qualification,
        d.consult_fee,
        a.appointment_date,
        a.status,
        a.created_at,
        pr.pers_id,
        b.bill_id,
        b.amount AS bill_amount,
        b.status AS bill_status
      FROM Appointment a
      JOIN Patient p ON a.p_id = p.p_id
      JOIN Doctor d ON a.doctor_id = d.id
      LEFT JOIN Prescription pr ON a.appointment_id = pr.appointment_id
      LEFT JOIN Bill b ON a.appointment_id = b.appointment_id
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    // Role-based scope
    if (req.user?.role === 'patient') {
      conditions.push('a.p_id = ?');
      params.push(req.user.ref_id);
    } else if (req.user?.role === 'doctor') {
      conditions.push('a.doctor_id = ?');
      params.push(req.user.ref_id);
    }

    if (status) {
      conditions.push('a.status = ?');
      params.push(status);
    }
    if (date) {
      conditions.push('DATE(a.appointment_date) = ?');
      params.push(date);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY a.appointment_date DESC';

    const appointments = await query(sql, params);
    return res.json(appointments);
  } catch (error: any) {
    console.error('Fetch appointments error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/appointments/:id
 */
appointmentsRouter.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const appointment = await queryOne(
      `SELECT 
        a.appointment_id,
        a.p_id,
        CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
        p.email AS patient_email,
        p.blood_group AS patient_blood_group,
        p.city AS patient_city,
        fn_calculate_patient_age(p.dob) AS patient_age,
        a.doctor_id,
        CONCAT(d.f_name, ' ', d.l_name) AS doctor_name,
        d.qualification AS doctor_qualification,
        d.consult_fee,
        a.appointment_date,
        a.status,
        a.created_at,
        pr.pers_id,
        pr.symptoms,
        pr.diagnosis,
        b.bill_id,
        b.amount AS bill_amount,
        b.discount AS bill_discount,
        b.status AS bill_status
       FROM Appointment a
       JOIN Patient p ON a.p_id = p.p_id
       JOIN Doctor d ON a.doctor_id = d.id
       LEFT JOIN Prescription pr ON a.appointment_id = pr.appointment_id
       LEFT JOIN Bill b ON a.appointment_id = b.appointment_id
       WHERE a.appointment_id = ?`,
      [id]
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    // Role check
    if (req.user?.role === 'patient' && appointment.p_id !== req.user.ref_id) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }
    if (req.user?.role === 'doctor' && appointment.doctor_id !== req.user.ref_id) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    return res.json(appointment);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/appointments (Book Appointment)
 * Uses Stored Procedure `sp_book_appointment` for database atomicity, validation, and conflict prevention!
 */
appointmentsRouter.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let { p_id, doctor_id, appointment_date } = req.body;

    // If patient is booking, enforce their own p_id
    if (req.user?.role === 'patient') {
      p_id = req.user.ref_id;
    }

    if (!p_id || !doctor_id || !appointment_date) {
      return res.status(400).json({ error: 'Patient ID, Doctor ID, and appointment date/time are required.' });
    }

    // Format date string for MySQL DATETIME
    const formattedDate = new Date(appointment_date).toISOString().slice(0, 19).replace('T', ' ');

    // Call stored procedure: CALL sp_book_appointment(?, ?, ?, @app_id, @code, @msg)
    await query('CALL sp_book_appointment(?, ?, ?, @app_id, @code, @msg)', [
      p_id,
      doctor_id,
      formattedDate
    ]);

    const outResult = await queryOne<any>('SELECT @app_id AS appointment_id, @code AS status_code, @msg AS message');

    if (outResult && outResult.status_code !== 200) {
      return res.status(outResult.status_code || 400).json({ error: outResult.message });
    }

    const apptId = outResult.appointment_id;

    await logAuditEvent(req.user?.email || 'patient', req.user?.role || 'patient', 'INSERT', 'Appointment', apptId, {
      patient_id: p_id,
      doctor_id,
      date: formattedDate
    });

    return res.status(201).json({
      message: outResult.message || 'Appointment booked successfully.',
      appointment_id: apptId
    });
  } catch (error: any) {
    console.error('Booking error:', error);
    return res.status(500).json({ error: error.message || 'Appointment booking failed.' });
  }
});

/**
 * PUT /api/appointments/:id/status
 * Update status: 'Scheduled', 'In-Progress', 'Completed', 'Cancelled'
 */
appointmentsRouter.put('/:id/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Scheduled', 'In-Progress', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid appointment status.' });
    }

    const currentAppt = await queryOne<any>('SELECT p_id, doctor_id, status FROM Appointment WHERE appointment_id = ?', [id]);
    if (!currentAppt) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    // Patients can only cancel their own scheduled appointment
    if (req.user?.role === 'patient') {
      if (currentAppt.p_id !== req.user.ref_id) {
        return res.status(403).json({ error: 'Unauthorized.' });
      }
      if (status !== 'Cancelled') {
        return res.status(403).json({ error: 'Patients can only cancel appointments.' });
      }
    }

    // Update appointment status (triggers will fire if cancelled)
    await query('UPDATE Appointment SET status = ? WHERE appointment_id = ?', [status, id]);

    // If marked Completed, generate a preliminary bill using `sp_generate_bill` if not yet existing
    if (status === 'Completed') {
      const existingBill = await queryOne('SELECT bill_id FROM Bill WHERE appointment_id = ?', [id]);
      if (!existingBill) {
        await query('CALL sp_generate_bill(?, 0.00, @b_id, @tot, @b_code, @b_msg)', [id]);
      }
    }

    await logAuditEvent(req.user?.email || 'system', req.user?.role || 'user', 'UPDATE', 'Appointment', id, {
      old_status: currentAppt.status,
      new_status: status
    });

    return res.json({ message: `Appointment status updated to ${status}.` });
  } catch (error: any) {
    console.error('Status update error:', error);
    return res.status(500).json({ error: error.message });
  }
});
