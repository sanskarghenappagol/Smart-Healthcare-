import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../db/mysql.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from './auth.js';
import { logAuditEvent } from '../db/mongodb.js';

export const doctorsRouter = Router();

/**
 * GET /api/doctors
 * Public / Authenticated search
 */
doctorsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { search, qualification, city, max_fee, status } = req.query;

    let sql = `
      SELECT 
        d.id, 
        d.f_name, 
        d.l_name, 
        d.email, 
        d.qualification, 
        d.experience, 
        d.consult_fee, 
        d.city, 
        d.pincode, 
        d.status,
        d.created_at,
        GROUP_CONCAT(dp.phone_no SEPARATOR ', ') AS phone_numbers,
        COUNT(DISTINCT a.appointment_id) AS total_consultations
      FROM Doctor d
      LEFT JOIN Doctor_Phone dp ON d.id = dp.doctor_id
      LEFT JOIN Appointment a ON d.id = a.doctor_id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (status) {
      conditions.push('d.status = ?');
      params.push(status);
    } else {
      conditions.push("d.status = 'Active'");
    }

    if (search) {
      conditions.push('(d.f_name LIKE ? OR d.l_name LIKE ? OR d.qualification LIKE ? OR d.city LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }
    if (qualification) {
      conditions.push('d.qualification LIKE ?');
      params.push(`%${qualification}%`);
    }
    if (city) {
      conditions.push('d.city = ?');
      params.push(city);
    }
    if (max_fee) {
      conditions.push('d.consult_fee <= ?');
      params.push(Number(max_fee));
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' GROUP BY d.id ORDER BY d.experience DESC';

    const doctors = await query(sql, params);
    return res.json(doctors);
  } catch (error: any) {
    console.error('Fetch doctors error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/doctors/:id
 * Detailed doctor profile with phones and availability
 */
doctorsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const doctor = await queryOne(
      `SELECT d.id, d.f_name, d.l_name, d.email, d.qualification, d.experience, d.consult_fee, d.city, d.pincode, d.status
       FROM Doctor d WHERE d.id = ?`,
      [id]
    );

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    const phones = await query<any>('SELECT phone_no FROM Doctor_Phone WHERE doctor_id = ?', [id]);
    const slots = await query<any>(
      `SELECT availability_id, date, st_time, end_time, status 
       FROM Doctor_Availability 
       WHERE doctor_id = ? AND date >= CURDATE()
       ORDER BY date ASC, st_time ASC`,
      [id]
    );

    return res.json({
      ...doctor,
      phone_numbers: phones.map(p => p.phone_no),
      available_slots: slots
    });
  } catch (error: any) {
    console.error('Fetch doctor error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/doctors (Admin only)
 * Creates new doctor, adds doctor phones, and creates auth credentials
 */
doctorsRouter.post('/', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { f_name, l_name, email, password, qualification, experience, consult_fee, city, pincode, phone_numbers } = req.body;

    if (!f_name || !l_name || !email || !qualification || consult_fee === undefined) {
      return res.status(400).json({ error: 'Missing required doctor fields.' });
    }

    // Check email uniqueness
    const existing = await queryOne('SELECT email FROM Doctor WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ error: 'Doctor email already registered.' });
    }

    // Generate doctor ID
    const lastDoc = await queryOne<any>('SELECT id FROM Doctor ORDER BY id DESC LIMIT 1');
    let nextNum = 9;
    if (lastDoc && lastDoc.id.startsWith('DOC')) {
      const num = parseInt(lastDoc.id.replace('DOC', ''), 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
    const newDocId = `DOC${String(nextNum).padStart(3, '0')}`;

    await query(
      `INSERT INTO Doctor (id, f_name, l_name, email, qualification, experience, consult_fee, city, pincode, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [newDocId, f_name, l_name, email, qualification, Number(experience) || 0, Number(consult_fee), city, pincode]
    );

    // Insert phone numbers
    if (Array.isArray(phone_numbers) && phone_numbers.length > 0) {
      for (const phone of phone_numbers) {
        if (phone && phone.trim()) {
          await query('INSERT INTO Doctor_Phone (doctor_id, phone_no) VALUES (?, ?)', [newDocId, phone.trim()]);
        }
      }
    }

    // Auth record
    const pass = password || 'Password@123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(pass, salt);
    await query('INSERT INTO User_Auth (email, password_hash, role, ref_id) VALUES (?, ?, "doctor", ?)', [email, hash, newDocId]);

    await logAuditEvent(req.user?.email || 'admin', 'admin', 'INSERT', 'Doctor', newDocId, {
      name: `${f_name} ${l_name}`,
      specialty: qualification
    });

    return res.status(201).json({
      message: 'Doctor account created successfully.',
      doctor_id: newDocId
    });
  } catch (error: any) {
    console.error('Create doctor error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/doctors/:id
 */
doctorsRouter.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (req.user?.role !== 'admin' && !(req.user?.role === 'doctor' && req.user.ref_id === id)) {
      return res.status(403).json({ error: 'Unauthorized to modify doctor profile.' });
    }

    const { f_name, l_name, qualification, experience, consult_fee, city, pincode, status, phone_numbers } = req.body;

    await query(
      `UPDATE Doctor
       SET f_name = COALESCE(?, f_name),
           l_name = COALESCE(?, l_name),
           qualification = COALESCE(?, qualification),
           experience = COALESCE(?, experience),
           consult_fee = COALESCE(?, consult_fee),
           city = COALESCE(?, city),
           pincode = COALESCE(?, pincode),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [f_name, l_name, qualification, experience, consult_fee, city, pincode, status, id]
    );

    if (Array.isArray(phone_numbers)) {
      await query('DELETE FROM Doctor_Phone WHERE doctor_id = ?', [id]);
      for (const phone of phone_numbers) {
        if (phone && phone.trim()) {
          await query('INSERT INTO Doctor_Phone (doctor_id, phone_no) VALUES (?, ?)', [id, phone.trim()]);
        }
      }
    }

    await logAuditEvent(req.user?.email || 'user', req.user?.role || 'doctor', 'UPDATE', 'Doctor', id, {
      updatedFields: { f_name, l_name, consult_fee, status }
    });

    return res.json({ message: 'Doctor details updated successfully.' });
  } catch (error: any) {
    console.error('Update doctor error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Doctor Availability Sub-router
 * GET /api/doctors/:id/availability
 */
doctorsRouter.get('/:id/availability', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const slots = await query(
      `SELECT availability_id, doctor_id, date, st_time, end_time, status
       FROM Doctor_Availability
       WHERE doctor_id = ?
       ORDER BY date ASC, st_time ASC`,
      [id]
    );
    return res.json(slots);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/doctors/:id/availability (Doctor or Admin)
 */
doctorsRouter.post('/:id/availability', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (req.user?.role !== 'admin' && !(req.user?.role === 'doctor' && req.user.ref_id === id)) {
      return res.status(403).json({ error: 'Unauthorized to manage availability for this doctor.' });
    }

    const { date, st_time, end_time } = req.body;
    if (!date || !st_time || !end_time) {
      return res.status(400).json({ error: 'Date, start time, and end time are required.' });
    }

    const result: any = await query(
      `INSERT INTO Doctor_Availability (doctor_id, date, st_time, end_time, status)
       VALUES (?, ?, ?, ?, 'Available')`,
      [id, date, st_time, end_time]
    );

    return res.status(201).json({
      message: 'Availability slot registered successfully.',
      availability_id: result.insertId
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/doctors/:id/availability/:slotId
 */
doctorsRouter.delete('/:id/availability/:slotId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, slotId } = req.params;
    if (req.user?.role !== 'admin' && !(req.user?.role === 'doctor' && req.user.ref_id === id)) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    await query('DELETE FROM Doctor_Availability WHERE availability_id = ? AND doctor_id = ?', [slotId, id]);
    return res.json({ message: 'Slot deleted successfully.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});
