-- ============================================================================
-- PES UNIVERSITY - DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
-- COURSE: DATABASE MANAGEMENT SYSTEMS (DBMS MINI-PROJECT)
-- FILE: advanced_queries.sql (CTEs, Window Functions, Joins, Subqueries)
-- ============================================================================

USE healthcare_db;

-- ============================================================================
-- 1. CTE 1: Doctors Ranked by Appointment Count (Window Function: DENSE_RANK)
-- Purpose: Evaluates doctor workload and demand using ranking partition
-- ============================================================================
WITH DoctorAppointmentStats AS (
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
ORDER BY ranking, doctor_name;

-- ============================================================================
-- 2. CTE 2: Patients with Highest Appointment Volume and Spending
-- Purpose: Patient analytics with dynamic age calculation (fn_calculate_patient_age)
-- ============================================================================
WITH PatientSpendingCTE AS (
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
FROM PatientSpendingCTE;

-- ============================================================================
-- 3. CTE 3: Monthly Appointment Trends and Realized Revenue
-- Purpose: Aggregation by year-month for hospital administrative planning
-- ============================================================================
WITH MonthlyTrendsCTE AS (
    SELECT 
        DATE_FORMAT(a.appointment_date, '%Y-%m') AS appointment_month,
        COUNT(a.appointment_id) AS total_booked,
        SUM(CASE WHEN a.status = 'Completed' THEN 1 ELSE 0 END) AS completed_count,
        SUM(CASE WHEN a.status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
        COALESCE(SUM(b.amount), 0.00) AS projected_revenue,
        COALESCE(SUM(pay.amount), 0.00) AS collected_revenue
    FROM Appointment a
    LEFT JOIN Bill b ON a.appointment_id = b.appointment_id
    LEFT JOIN Payment pay ON b.bill_id = pay.bill_id AND pay.status = 'Success'
    GROUP BY DATE_FORMAT(a.appointment_date, '%Y-%m')
)
SELECT 
    appointment_month,
    total_booked,
    completed_count,
    cancelled_count,
    projected_revenue,
    collected_revenue,
    ROUND((completed_count / NULLIF(total_booked, 0)) * 100, 1) AS completion_rate_pct
FROM MonthlyTrendsCTE
ORDER BY appointment_month DESC;

-- ============================================================================
-- 4. CTE 4: Medicine Utilization & Critical Stock Analytics
-- Purpose: Identifies most prescribed medicines and flags low inventory (< 50)
-- ============================================================================
WITH MedicineUsageCTE AS (
    SELECT 
        m.id AS medicine_id,
        m.name AS medicine_name,
        m.category,
        m.price,
        m.in_stock,
        COUNT(pm.pers_id) AS prescription_occurrences,
        CASE 
            WHEN m.in_stock < 40 THEN 'CRITICAL'
            WHEN m.in_stock < 70 THEN 'LOW'
            ELSE 'ADEQUATE'
        END AS stock_status
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
    prescription_occurrences,
    stock_status,
    DENSE_RANK() OVER (ORDER BY prescription_occurrences DESC) AS demand_rank
FROM MedicineUsageCTE
ORDER BY demand_rank, in_stock ASC;

-- ============================================================================
-- 5. INNER JOIN: Comprehensive Clinical Consultation Audit Trail
-- Links Patient -> Appointment -> Doctor -> Prescription -> Bill -> Payment
-- ============================================================================
SELECT 
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
ORDER BY a.appointment_date DESC;

-- ============================================================================
-- 6. LEFT OUTER JOIN: Doctor Availability & Unbooked Slots
-- Identifies doctors who have open consultation slots available for booking
-- ============================================================================
SELECT 
    d.id AS doctor_id,
    CONCAT(d.f_name, ' ', d.l_name) AS doctor_name,
    d.qualification,
    d.consult_fee,
    da.date AS slot_date,
    da.st_time AS slot_start,
    da.end_time AS slot_end,
    da.status AS slot_status
FROM Doctor d
LEFT JOIN Doctor_Availability da ON d.id = da.doctor_id AND da.status = 'Available'
WHERE d.status = 'Active'
ORDER BY d.id, da.date, da.st_time;

-- ============================================================================
-- 7. RIGHT OUTER JOIN: Inventory Coverage in Prescriptions
-- Shows all medicines, even those that have never been prescribed yet
-- ============================================================================
SELECT 
    m.id AS medicine_id,
    m.name AS medicine_name,
    m.category,
    m.in_stock,
    COUNT(pm.pers_id) AS times_prescribed
FROM Prescription_Medicine pm
RIGHT JOIN Medicine m ON pm.medicine_id = m.id
GROUP BY m.id, m.name, m.category, m.in_stock
ORDER BY times_prescribed ASC, m.name ASC;

-- ============================================================================
-- 8. CORRELATED SUBQUERY: Doctors Charging Above Department Average Fee
-- Demonstrates correlated subquery comparing each doctor against peer average
-- ============================================================================
SELECT 
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
ORDER BY d1.consult_fee DESC;

-- ============================================================================
-- 9. NESTED QUERY with GROUP BY & HAVING: High-Value Diagnosis Categories
-- Finds diagnosis groups where average bill exceeds Rs. 700 with >= 1 case
-- ============================================================================
SELECT 
    pr.diagnosis,
    COUNT(pr.pers_id) AS case_count,
    ROUND(AVG(b.amount), 2) AS avg_treatment_cost,
    SUM(b.amount) AS total_revenue_generated
FROM Prescription pr
JOIN Bill b ON pr.appointment_id = b.appointment_id
GROUP BY pr.diagnosis
HAVING AVG(b.amount) >= 600.00
ORDER BY avg_treatment_cost DESC;
