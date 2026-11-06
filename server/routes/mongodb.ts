import { Router, Response } from 'express';
import { labReportsCollection, patientReviewsCollection, auditLogsCollection, logAuditEvent } from '../db/mongodb.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from './auth.js';

export const mongoRouter = Router();

// ============================================================================
// 1. LAB REPORTS (MongoDB Collection: LabReports)
// ============================================================================

/**
 * GET /api/mongodb/lab-reports
 */
mongoRouter.get('/lab-reports', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patient_id, report_type } = req.query;
    const filter: Record<string, any> = {};

    if (req.user?.role === 'patient') {
      filter.patient_id = req.user.ref_id;
    } else if (patient_id) {
      filter.patient_id = patient_id;
    }

    if (report_type) {
      filter.report_type = report_type;
    }

    const reports = await labReportsCollection.find(filter);
    return res.json(reports);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/mongodb/lab-reports (Create Lab Report)
 */
mongoRouter.post('/lab-reports', authenticateToken, requireRole('doctor', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patient_id, appointment_id, report_type, test_results, doctor_comments, report_status } = req.body;

    if (!patient_id || !report_type || !test_results) {
      return res.status(400).json({ error: 'patient_id, report_type, and test_results are required.' });
    }

    const newReport = {
      report_id: 'LAB-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      patient_id,
      appointment_id: appointment_id ? Number(appointment_id) : null,
      report_type,
      uploaded_date: new Date().toISOString(),
      test_results,
      doctor_comments: doctor_comments || 'Under clinical review',
      report_status: report_status || 'Normal',
      file_url: `/reports/${report_type.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`
    };

    const result = await labReportsCollection.insertOne(newReport);

    await logAuditEvent(req.user?.email || 'doctor', req.user?.role || 'doctor', 'INSERT', 'LabReports (MongoDB)', newReport.report_id, {
      patient_id,
      report_type
    });

    return res.status(201).json({
      message: 'Lab report uploaded successfully to MongoDB.',
      report_id: newReport.report_id,
      document_id: result.insertedId
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/mongodb/lab-reports/:reportId (Update Lab Report)
 */
mongoRouter.put('/lab-reports/:reportId', authenticateToken, requireRole('doctor', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    const { doctor_comments, report_status, test_results } = req.body;

    const updateFields: Record<string, any> = {};
    if (doctor_comments !== undefined) updateFields.doctor_comments = doctor_comments;
    if (report_status !== undefined) updateFields.report_status = report_status;
    if (test_results !== undefined) updateFields.test_results = test_results;

    const result = await labReportsCollection.updateOne({ report_id: reportId }, { $set: updateFields });

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Lab report not found or unchanged.' });
    }

    await logAuditEvent(req.user?.email || 'admin', req.user?.role || 'admin', 'UPDATE', 'LabReports (MongoDB)', reportId, updateFields);

    return res.json({ message: 'Lab report updated successfully.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/mongodb/lab-reports/:reportId (Delete Lab Report)
 */
mongoRouter.delete('/lab-reports/:reportId', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    const result = await labReportsCollection.deleteOne({ report_id: reportId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Lab report not found.' });
    }

    await logAuditEvent(req.user?.email || 'admin', 'admin', 'DELETE', 'LabReports (MongoDB)', reportId, {
      reason: 'Administrative deletion'
    });

    return res.json({ message: 'Lab report deleted successfully.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 2. PATIENT REVIEWS (MongoDB Collection: PatientReviews)
// ============================================================================

/**
 * GET /api/mongodb/reviews
 */
mongoRouter.get('/reviews', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { doctor_id, patient_id } = req.query;
    const filter: Record<string, any> = {};
    if (doctor_id) filter.doctor_id = doctor_id;
    if (patient_id) filter.patient_id = patient_id;

    const reviews = await patientReviewsCollection.find(filter);
    return res.json(reviews);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/mongodb/reviews (Submit Review)
 */
mongoRouter.post('/reviews', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { doctor_id, rating, comment } = req.body;
    let patient_id = req.body.patient_id;

    if (req.user?.role === 'patient') {
      patient_id = req.user.ref_id;
    }

    if (!doctor_id || !patient_id || !rating || !comment) {
      return res.status(400).json({ error: 'Doctor ID, rating (1-5), and review comment are required.' });
    }

    const reviewDoc = {
      review_id: 'REV-' + Math.floor(100 + Math.random() * 900),
      patient_id,
      doctor_id,
      rating: Math.max(1, Math.min(5, Number(rating))),
      comment,
      created_at: new Date().toISOString()
    };

    await patientReviewsCollection.insertOne(reviewDoc);

    await logAuditEvent(req.user?.email || 'patient', req.user?.role || 'patient', 'INSERT', 'PatientReviews (MongoDB)', reviewDoc.review_id, {
      doctor_id,
      rating: reviewDoc.rating
    });

    return res.status(201).json({ message: 'Review submitted successfully!', review: reviewDoc });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/mongodb/reviews/:reviewId
 */
mongoRouter.delete('/reviews/:reviewId', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    await patientReviewsCollection.deleteOne({ review_id: reviewId });
    return res.json({ message: 'Review deleted.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 3. AUDIT LOGS (MongoDB Collection: AuditLogs)
// ============================================================================

/**
 * GET /api/mongodb/audit-logs (Admin only)
 */
mongoRouter.get('/audit-logs', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, action, search } = req.query;
    let logs = await auditLogsCollection.find({});

    if (role) {
      logs = logs.filter(l => l.role === role);
    }
    if (action) {
      logs = logs.filter(l => l.action === action);
    }
    if (search) {
      const term = String(search).toLowerCase();
      logs = logs.filter(l =>
        (l.user_id && l.user_id.toLowerCase().includes(term)) ||
        (l.collection_or_table && l.collection_or_table.toLowerCase().includes(term)) ||
        (l.action && l.action.toLowerCase().includes(term))
      );
    }

    // Sort descending by timestamp
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.json(logs);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});
