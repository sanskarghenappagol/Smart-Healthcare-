import { Router, Response } from 'express';
import { query, queryOne } from '../db/mysql.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from './auth.js';
import { logAuditEvent } from '../db/mongodb.js';

export const patientsRouter = Router();

/**
 * GET /api/patients
 * Accessible by Admin, or Doctor
 */
patientsRouter.get('/', authenticateToken, requireRole('admin', 'doctor'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, blood_group } = req.query;
    let sql = `
      SELECT 
        p.p_id, 
        p.f_name, 
        p.l_name, 
        p.email, 
        p.gender, 
        p.blood_group, 
        p.dob, 
        fn_calculate_patient_age(p.dob) AS age,
        p.street, 
        p.city, 
        p.pincode,
        p.created_at,
        COUNT(a.appointment_id) AS appointment_count
      FROM Patient p
      LEFT JOIN Appointment a ON p.p_id = a.p_id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (search) {
      conditions.push('(p.f_name LIKE ? OR p.l_name LIKE ? OR p.p_id LIKE ? OR p.email LIKE ? OR p.city LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }
    if (blood_group) {
      conditions.push('p.blood_group = ?');
      params.push(blood_group);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' GROUP BY p.p_id ORDER BY p.p_id ASC';

    const patients = await query(sql, params);
    return res.json(patients);
  } catch (error: any) {
    console.error('Fetch patients error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/patients/:id
 */
patientsRouter.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    // Check authorization: Admin or the patient themselves, or a doctor
    if (req.user?.role === 'patient' && req.user.ref_id !== id) {
      return res.status(403).json({ error: 'Forbidden: You may only view your own patient profile.' });
    }

    const patient = await queryOne(
      `SELECT 
        p.p_id, p.f_name, p.l_name, p.email, p.gender, p.blood_group, p.dob, 
        fn_calculate_patient_age(p.dob) AS age,
        p.street, p.city, p.pincode, p.created_at
       FROM Patient p
       WHERE p.p_id = ?`,
      [id]
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    return res.json(patient);
  } catch (error: any) {
    console.error('Fetch patient error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/patients/:id
 */
patientsRouter.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (req.user?.role === 'patient' && req.user.ref_id !== id) {
      return res.status(403).json({ error: 'Forbidden: You may only update your own patient profile.' });
    }

    const { f_name, l_name, gender, blood_group, dob, street, city, pincode } = req.body;

    await query(
      `UPDATE Patient 
       SET f_name = COALESCE(?, f_name),
           l_name = COALESCE(?, l_name),
           gender = COALESCE(?, gender),
           blood_group = COALESCE(?, blood_group),
           dob = COALESCE(?, dob),
           street = COALESCE(?, street),
           city = COALESCE(?, city),
           pincode = COALESCE(?, pincode)
       WHERE p_id = ?`,
      [f_name, l_name, gender, blood_group, dob, street, city, pincode, id]
    );

    await logAuditEvent(req.user?.email || 'system', req.user?.role || 'user', 'UPDATE', 'Patient', id, {
      updatedFields: { f_name, l_name, city, blood_group }
    });

    return res.json({ message: 'Patient profile updated successfully.' });
  } catch (error: any) {
    console.error('Update patient error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/patients/:id (Admin only)
 */
patientsRouter.delete('/:id', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Patient WHERE p_id = ?', [id]);
    await logAuditEvent(req.user?.email || 'admin', 'admin', 'DELETE', 'Patient', id, {
      reason: 'Administrative deletion'
    });
    return res.json({ message: `Patient ${id} removed successfully.` });
  } catch (error: any) {
    console.error('Delete patient error:', error);
    return res.status(500).json({ error: error.message });
  }
});
