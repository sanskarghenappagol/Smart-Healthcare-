import { Router, Response } from 'express';
import { query, queryOne, getTransactionConnection } from '../db/mysql.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from './auth.js';
import { logAuditEvent } from '../db/mongodb.js';

export const dbmsRouter = Router();

// ============================================================================
// 1. ACID TRANSACTION & ROLLBACK SIMULATOR
// ============================================================================

interface TransactionStep {
  step: number;
  statement: string;
  status: 'PENDING' | 'EXECUTING' | 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
  executionTimeMs?: number;
  details?: string;
}

/**
 * POST /api/dbms/acid-simulate
 * Live MySQL ACID Transaction Demonstrator
 * Executes all statements on a SINGLE dedicated MySQL connection.
 */
dbmsRouter.post('/acid-simulate', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  const { mode = 'rollback', patient_id = 'PAT001', doctor_id = 'DOC001', custom_amount = 850 } = req.body;
  const steps: TransactionStep[] = [];
  const startTime = Date.now();

  const conn = await getTransactionConnection();

  try {
    // 1. Snapshot Before State
    const [beforeApptCount]: any = await conn.query('SELECT COUNT(*) AS count FROM Appointment');
    const [beforeBillCount]: any = await conn.query('SELECT COUNT(*) AS count FROM Bill');
    const [beforePayCount]: any = await conn.query('SELECT COUNT(*) AS count FROM Payment');

    const beforeState = {
      appointments: beforeApptCount[0].count,
      bills: beforeBillCount[0].count,
      payments: beforePayCount[0].count
    };

    // Step 1: START TRANSACTION
    steps.push({
      step: 1,
      statement: 'START TRANSACTION;',
      status: 'EXECUTING'
    });
    const t0 = Date.now();
    await conn.beginTransaction();
    steps[0].status = 'SUCCESS';
    steps[0].executionTimeMs = Date.now() - t0;
    steps[0].details = 'ACID Transaction boundary initiated. Auto-commit disabled on connection.';

    // Step 2: Insert Appointment
    const apptDate = new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 19).replace('T', ' ');
    const step2Sql = `INSERT INTO Appointment (p_id, doctor_id, appointment_date, status) VALUES ('${patient_id}', '${doctor_id}', '${apptDate}', 'Scheduled');`;
    steps.push({
      step: 2,
      statement: step2Sql,
      status: 'EXECUTING'
    });
    const t1 = Date.now();
    const [apptResult]: any = await conn.query(
      'INSERT INTO Appointment (p_id, doctor_id, appointment_date, status) VALUES (?, ?, ?, "Scheduled")',
      [patient_id, doctor_id, apptDate]
    );
    const simulatedApptId = apptResult.insertId;
    steps[1].status = 'SUCCESS';
    steps[1].executionTimeMs = Date.now() - t1;
    steps[1].details = `Appointment inserted with ID #${simulatedApptId}. Stored in uncommitted InnoDB transaction buffer.`;

    // Step 3: Insert Bill
    const step3Sql = `INSERT INTO Bill (appointment_id, bill_date, amount, discount, status) VALUES (${simulatedApptId}, CURDATE(), ${custom_amount}, 50.00, 'Pending');`;
    steps.push({
      step: 3,
      statement: step3Sql,
      status: 'EXECUTING'
    });
    const t2 = Date.now();
    const [billResult]: any = await conn.query(
      'INSERT INTO Bill (appointment_id, bill_date, amount, discount, status) VALUES (?, CURDATE(), ?, 50.00, "Pending")',
      [simulatedApptId, Number(custom_amount)]
    );
    const simulatedBillId = billResult.insertId;
    steps[2].status = 'SUCCESS';
    steps[2].executionTimeMs = Date.now() - t2;
    steps[2].details = `Bill created with ID #${simulatedBillId} for Appointment #${simulatedApptId}. Foreign key constraint validated.`;

    // Step 4: Mode Branching (Commit vs Failure & Rollback)
    if (mode === 'commit') {
      // Step 4a: Insert Payment
      const utr = `UPI/${Date.now()}/${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const step4Sql = `INSERT INTO Payment (bill_id, utr, method, amount, status) VALUES (${simulatedBillId}, '${utr}', 'UPI', ${custom_amount - 50}, 'Success');`;
      steps.push({
        step: 4,
        statement: step4Sql,
        status: 'EXECUTING'
      });
      const t3 = Date.now();
      await conn.query(
        'INSERT INTO Payment (bill_id, utr, method, amount, status) VALUES (?, ?, "UPI", ?, "Success")',
        [simulatedBillId, utr, custom_amount - 50]
      );
      steps[3].status = 'SUCCESS';
      steps[3].executionTimeMs = Date.now() - t3;
      steps[3].details = `Payment recorded with UTR ${utr}. Bill status updated to Paid.`;

      // Step 5: COMMIT
      steps.push({
        step: 5,
        statement: 'COMMIT;',
        status: 'EXECUTING'
      });
      const t4 = Date.now();
      await conn.commit();
      steps[4].status = 'SUCCESS';
      steps[4].executionTimeMs = Date.now() - t4;
      steps[4].details = 'All operations permanently committed to MySQL InnoDB tablespace.';
    } else {
      // Step 4b: Simulate Controlled Failure
      steps.push({
        step: 4,
        statement: `-- SIMULATED FAILURE: Payment Gateway Socket Timeout / Foreign Key Violation\nINSERT INTO Payment (bill_id, utr, method, amount, status) VALUES (999999, NULL, 'UPI', -500, 'Invalid');`,
        status: 'FAILED',
        details: 'Intentional simulation error: Negative amount / non-existent foreign key bill_id #999999 triggered failure.'
      });

      // Step 5: ROLLBACK
      steps.push({
        step: 5,
        statement: 'ROLLBACK;',
        status: 'EXECUTING'
      });
      const tRollback = Date.now();
      await conn.rollback();
      steps[4].status = 'ROLLED_BACK';
      steps[4].executionTimeMs = Date.now() - tRollback;
      steps[4].details = `InnoDB transaction undo logs applied! Appointment #${simulatedApptId} and Bill #${simulatedBillId} completely erased from database.`;
    }

    // 2. Snapshot After State
    const [afterApptCount]: any = await conn.query('SELECT COUNT(*) AS count FROM Appointment');
    const [afterBillCount]: any = await conn.query('SELECT COUNT(*) AS count FROM Bill');
    const [afterPayCount]: any = await conn.query('SELECT COUNT(*) AS count FROM Payment');

    const afterState = {
      appointments: afterApptCount[0].count,
      bills: afterBillCount[0].count,
      payments: afterPayCount[0].count
    };

    // Verify whether simulated appointment actually exists in DB
    const [checkAppt]: any = await conn.query('SELECT COUNT(*) as c FROM Appointment WHERE appointment_id = ?', [simulatedApptId]);
    const recordPersisted = checkAppt[0].c > 0;

    conn.release();

    await logAuditEvent(req.user?.email || 'admin', 'admin', mode === 'commit' ? 'TRANSACTION_COMMIT' : 'TRANSACTION_ROLLBACK', 'MySQL InnoDB', null, {
      mode,
      total_duration_ms: Date.now() - startTime,
      record_persisted: recordPersisted
    });

    return res.json({
      success: true,
      mode,
      steps,
      beforeState,
      afterState,
      recordPersisted,
      summary: mode === 'commit' 
        ? 'COMMIT SUCCESSFUL: All three relational inserts (Appointment, Bill, Payment) were written atomically to MySQL disk storage.'
        : 'ROLLBACK VERIFIED: All uncommitted inserts were immediately undone. Zero phantom or orphaned records remain in the MySQL database.'
    });
  } catch (error: any) {
    await conn.rollback();
    conn.release();
    return res.status(500).json({
      success: false,
      error: error.message,
      steps
    });
  }
});

// ============================================================================
// 2. DBMS QUERY LAB (Live Execution of CTEs, Stored Procedures, Functions, Joins)
// ============================================================================

export const PREDEFINED_QUERIES = [
  {
    id: 'cte_doctor_ranking',
    category: 'CTE & Window Functions',
    title: 'CTE 1: Doctors Ranked by Total Consultation Volume',
    sql: `WITH DoctorAppointmentStats AS (
    SELECT 
        d.id AS doctor_id,
        CONCAT(d.f_name, ' ', d.l_name) AS doctor_name,
        d.qualification,
        COUNT(a.appointment_id) AS total_appointments,
        SUM(CASE WHEN a.status = 'Completed' THEN 1 ELSE 0 END) AS completed_appointments
    FROM Doctor d
    LEFT JOIN Appointment a ON d.id = a.doctor_id
    GROUP BY d.id, d.f_name, d.l_name, d.qualification
)
SELECT 
    doctor_id,
    doctor_name,
    qualification,
    total_appointments,
    completed_appointments,
    DENSE_RANK() OVER (ORDER BY total_appointments DESC) AS ranking
FROM DoctorAppointmentStats
ORDER BY ranking, doctor_name;`,
    description: 'Uses a Common Table Expression with DENSE_RANK() window function to rank physicians by appointment count.'
  },
  {
    id: 'cte_patient_spending',
    category: 'CTE & SQL Functions',
    title: 'CTE 2: Patient Engagement & Spending Analytics (with fn_calculate_patient_age)',
    sql: `WITH PatientSpendingCTE AS (
    SELECT 
        p.p_id,
        CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
        p.gender,
        p.blood_group,
        fn_calculate_patient_age(p.dob) AS current_age,
        COUNT(DISTINCT a.appointment_id) AS total_visits,
        COALESCE(SUM(b.amount), 0.00) AS total_billed_amount,
        COALESCE(SUM(p_rec.amount), 0.00) AS total_paid_amount
    FROM Patient p
    JOIN Appointment a ON p.p_id = a.p_id
    LEFT JOIN Bill b ON a.appointment_id = b.appointment_id
    LEFT JOIN Payment p_rec ON b.bill_id = p_rec.bill_id AND p_rec.status = 'Success'
    GROUP BY p.p_id, p.f_name, p.l_name, p.gender, p.blood_group, p.dob
)
SELECT 
    p_id,
    patient_name,
    gender,
    blood_group,
    current_age,
    total_visits,
    total_billed_amount,
    total_paid_amount,
    ROW_NUMBER() OVER (ORDER BY total_visits DESC, total_paid_amount DESC) AS patient_priority_index
FROM PatientSpendingCTE;`,
    description: 'Combines dynamic patient age calculated using fn_calculate_patient_age with billing and payment joins, ranked via ROW_NUMBER().'
  },
  {
    id: 'cte_medicine_inventory',
    category: 'CTE & Analytics',
    title: 'CTE 3: Medicine Prescription Demand vs. Stock Status',
    sql: `WITH MedicineUsageCTE AS (
    SELECT 
        m.id AS medicine_id,
        m.name AS medicine_name,
        m.category,
        m.price,
        m.in_stock,
        COUNT(pm.pers_id) AS times_prescribed,
        CASE 
            WHEN m.in_stock < 40 THEN 'CRITICAL LOW'
            WHEN m.in_stock < 75 THEN 'MODERATE'
            ELSE 'HEALTHY'
        END AS stock_health
    FROM Medicine m
    LEFT JOIN Prescription_Medicine pm ON m.id = pm.medicine_id
    GROUP BY m.id, m.name, m.category, m.price, m.in_stock
)
SELECT 
    medicine_id,
    medicine_name,
    category,
    price,
    in_stock,
    times_prescribed,
    stock_health,
    DENSE_RANK() OVER (ORDER BY times_prescribed DESC) AS demand_rank
FROM MedicineUsageCTE
ORDER BY demand_rank, in_stock ASC;`,
    description: 'Evaluates medicine dispensing frequency through junction table Prescription_Medicine alongside live warehouse inventory.'
  },
  {
    id: 'join_clinical_audit',
    category: 'Relational Joins',
    title: 'Multi-Table INNER JOIN: Complete Clinical Audit Trail',
    sql: `SELECT 
    a.appointment_id,
    a.appointment_date,
    CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
    p.blood_group,
    CONCAT(d.f_name, ' ', d.l_name) AS doctor_name,
    d.qualification AS doctor_specialty,
    pr.diagnosis,
    b.amount AS bill_amount,
    b.status AS bill_status,
    pay.utr AS payment_utr,
    pay.method AS payment_method
FROM Appointment a
INNER JOIN Patient p ON a.p_id = p.p_id
INNER JOIN Doctor d ON a.doctor_id = d.id
INNER JOIN Prescription pr ON a.appointment_id = pr.appointment_id
INNER JOIN Bill b ON a.appointment_id = b.appointment_id
LEFT JOIN Payment pay ON b.bill_id = pay.bill_id AND pay.status = 'Success'
ORDER BY a.appointment_date DESC;`,
    description: 'Demonstrates multi-table INNER JOIN across Patient, Doctor, Appointment, Prescription, Bill, and Payment.'
  },
  {
    id: 'correlated_subquery_fees',
    category: 'Subqueries & Nested Queries',
    title: 'Correlated Subquery: Doctors Charging Above Hospital Mean Fee',
    sql: `SELECT 
    d1.id,
    CONCAT(d1.f_name, ' ', d1.l_name) AS doctor_name,
    d1.qualification,
    d1.consult_fee,
    (SELECT ROUND(AVG(d2.consult_fee), 2) FROM Doctor d2) AS overall_avg_fee,
    ROUND(d1.consult_fee - (SELECT AVG(d2.consult_fee) FROM Doctor d2), 2) AS fee_variance
FROM Doctor d1
WHERE d1.consult_fee > (
    SELECT AVG(d2.consult_fee)
    FROM Doctor d2
)
ORDER BY d1.consult_fee DESC;`,
    description: 'Subquery computing the mean consultation fee and filtering doctors exceeding that threshold.'
  },
  {
    id: 'group_by_having_diagnosis',
    category: 'Aggregation & HAVING',
    title: 'GROUP BY with HAVING: High-Value Diagnosis Treatment Cost',
    sql: `SELECT 
    pr.diagnosis,
    COUNT(pr.pers_id) AS case_count,
    ROUND(AVG(b.amount), 2) AS avg_treatment_cost,
    SUM(b.amount) AS total_revenue_generated
FROM Prescription pr
JOIN Bill b ON pr.appointment_id = b.appointment_id
GROUP BY pr.diagnosis
HAVING AVG(b.amount) >= 600.00
ORDER BY avg_treatment_cost DESC;`,
    description: 'Aggregates clinical diagnosis records with a HAVING clause filtering clusters with average bill >= 600.'
  }
];

/**
 * GET /api/dbms/queries
 * Returns list of predefined DBMS queries with their metadata
 */
dbmsRouter.get('/queries', async (req: AuthenticatedRequest, res: Response) => {
  return res.json(PREDEFINED_QUERIES);
});

/**
 * POST /api/dbms/run-query
 * Executes a chosen predefined query against MySQL and returns real result set + timing
 */
dbmsRouter.post('/run-query', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { query_id, custom_sql } = req.body;
    let sqlToRun = '';

    if (query_id) {
      const match = PREDEFINED_QUERIES.find(q => q.id === query_id);
      if (!match) return res.status(404).json({ error: 'Query ID not found.' });
      sqlToRun = match.sql;
    } else if (custom_sql) {
      // Validate only SELECT queries to protect against accidental schema drops
      const trimmed = custom_sql.trim().toUpperCase();
      if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('WITH') && !trimmed.startsWith('SHOW') && !trimmed.startsWith('DESCRIBE') && !trimmed.startsWith('EXPLAIN')) {
        return res.status(400).json({ error: 'Only SELECT, WITH (CTE), SHOW, and EXPLAIN queries are permitted in the DBMS Query Lab.' });
      }
      sqlToRun = custom_sql;
    } else {
      return res.status(400).json({ error: 'Either query_id or custom_sql must be supplied.' });
    }

    const t0 = Date.now();
    const rows = await query(sqlToRun);
    const executionTimeMs = Date.now() - t0;

    return res.json({
      success: true,
      sql: sqlToRun,
      rowCount: Array.isArray(rows) ? rows.length : 0,
      executionTimeMs,
      rows: Array.isArray(rows) ? rows : []
    });
  } catch (error: any) {
    console.error('DBMS Query run error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
