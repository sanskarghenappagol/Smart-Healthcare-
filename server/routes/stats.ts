import { Router, Response } from 'express';
import { query, queryOne } from '../db/mysql.js';
import { labReportsCollection } from '../db/mongodb.js';
import { authenticateToken, AuthenticatedRequest } from './auth.js';

export const statsRouter = Router();

/**
 * GET /api/stats/overview
 * Real-time database metrics computed live from MySQL and MongoDB
 */
statsRouter.get('/overview', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = req.user?.role || 'admin';
    const refId = req.user?.ref_id;

    if (role === 'admin') {
      const [totalPatients]: any = await query('SELECT COUNT(*) as c FROM Patient');
      const [totalDoctors]: any = await query('SELECT COUNT(*) as c FROM Doctor');
      const [totalAppointments]: any = await query('SELECT COUNT(*) as c FROM Appointment');
      const [completedAppointments]: any = await query('SELECT COUNT(*) as c FROM Appointment WHERE status = "Completed"');
      const [cancelledAppointments]: any = await query('SELECT COUNT(*) as c FROM Appointment WHERE status = "Cancelled"');
      const [scheduledAppointments]: any = await query('SELECT COUNT(*) as c FROM Appointment WHERE status = "Scheduled"');
      
      const [totalRevenue]: any = await query('SELECT COALESCE(SUM(amount), 0.00) as rev FROM Payment WHERE status = "Success"');
      const [pendingBilling]: any = await query('SELECT COALESCE(SUM(amount - discount), 0.00) as pending FROM Bill WHERE status IN ("Pending", "Partially Paid")');
      const [lowStockMeds]: any = await query('SELECT COUNT(*) as c FROM Medicine WHERE in_stock <= 50');
      const [totalPrescriptions]: any = await query('SELECT COUNT(*) as c FROM Prescription');

      // Top specialties count
      const specialties = await query(
        `SELECT qualification, COUNT(id) as doctor_count 
         FROM Doctor 
         GROUP BY qualification 
         ORDER BY doctor_count DESC 
         LIMIT 5`
      );

      // Appointments by status
      const appointmentsByStatus = await query(
        `SELECT status, COUNT(*) as count FROM Appointment GROUP BY status`
      );

      // MongoDB count
      const mongoReportCount = await labReportsCollection.countDocuments({});

      return res.json({
        role: 'admin',
        totalPatients: totalPatients[0].c,
        totalDoctors: totalDoctors[0].c,
        totalAppointments: totalAppointments[0].c,
        completedAppointments: completedAppointments[0].c,
        cancelledAppointments: cancelledAppointments[0].c,
        scheduledAppointments: scheduledAppointments[0].c,
        totalRevenue: Number(totalRevenue[0].rev),
        pendingBilling: Number(pendingBilling[0].pending),
        lowStockMedicines: lowStockMeds[0].c,
        totalPrescriptions: totalPrescriptions[0].c,
        mongoReportCount,
        specialties,
        appointmentsByStatus
      });
    }

    if (role === 'doctor') {
      const [totalPatients]: any = await query(
        'SELECT COUNT(DISTINCT p_id) as c FROM Appointment WHERE doctor_id = ?',
        [refId]
      );
      const [todayAppointments]: any = await query(
        'SELECT COUNT(*) as c FROM Appointment WHERE doctor_id = ? AND DATE(appointment_date) = CURDATE()',
        [refId]
      );
      const [upcomingAppointments]: any = await query(
        'SELECT COUNT(*) as c FROM Appointment WHERE doctor_id = ? AND appointment_date >= NOW() AND status = "Scheduled"',
        [refId]
      );
      const [completedAppointments]: any = await query(
        'SELECT COUNT(*) as c FROM Appointment WHERE doctor_id = ? AND status = "Completed"',
        [refId]
      );
      const [totalPrescriptions]: any = await query(
        `SELECT COUNT(pr.pers_id) as c 
         FROM Prescription pr 
         JOIN Appointment a ON pr.appointment_id = a.appointment_id 
         WHERE a.doctor_id = ?`,
        [refId]
      );

      return res.json({
        role: 'doctor',
        totalPatients: totalPatients[0].c,
        todayAppointments: todayAppointments[0].c,
        upcomingAppointments: upcomingAppointments[0].c,
        completedAppointments: completedAppointments[0].c,
        totalPrescriptions: totalPrescriptions[0].c
      });
    }

    if (role === 'patient') {
      const [upcomingAppointments]: any = await query(
        'SELECT COUNT(*) as c FROM Appointment WHERE p_id = ? AND appointment_date >= NOW() AND status = "Scheduled"',
        [refId]
      );
      const [completedAppointments]: any = await query(
        'SELECT COUNT(*) as c FROM Appointment WHERE p_id = ? AND status = "Completed"',
        [refId]
      );
      const [totalPrescriptions]: any = await query(
        `SELECT COUNT(pr.pers_id) as c 
         FROM Prescription pr 
         JOIN Appointment a ON pr.appointment_id = a.appointment_id 
         WHERE a.p_id = ?`,
        [refId]
      );
      const [pendingBills]: any = await query(
        `SELECT COUNT(b.bill_id) as c, COALESCE(SUM(b.amount - b.discount), 0.00) as sum_pending
         FROM Bill b
         JOIN Appointment a ON b.appointment_id = a.appointment_id
         WHERE a.p_id = ? AND b.status IN ("Pending", "Partially Paid")`,
        [refId]
      );

      const mongoReportsCount = await labReportsCollection.countDocuments({ patient_id: refId });

      return res.json({
        role: 'patient',
        upcomingAppointments: upcomingAppointments[0].c,
        completedAppointments: completedAppointments[0].c,
        totalPrescriptions: totalPrescriptions[0].c,
        pendingBillsCount: pendingBills[0].c,
        pendingBillsAmount: Number(pendingBills[0].sum_pending),
        labReportsCount: mongoReportsCount
      });
    }

    return res.json({ role: 'guest' });
  } catch (error: any) {
    console.error('Stats error:', error);
    return res.status(500).json({ error: error.message });
  }
});
