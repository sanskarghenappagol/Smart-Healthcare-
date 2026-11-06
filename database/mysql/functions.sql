-- ============================================================================
-- PES UNIVERSITY - DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
-- COURSE: DATABASE MANAGEMENT SYSTEMS (DBMS MINI-PROJECT)
-- FILE: functions.sql (Deterministic SQL Functions)
-- ============================================================================

USE healthcare_db;

DROP FUNCTION IF EXISTS fn_calculate_patient_age;
DROP FUNCTION IF EXISTS fn_calculate_bill_total;

DELIMITER $$

-- ============================================================================
-- FUNCTION 1: fn_calculate_patient_age
-- Requirement: Age must be calculated dynamically using DOB.
-- Never store age as a separate column!
-- ============================================================================
CREATE FUNCTION fn_calculate_patient_age(p_dob DATE)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_age INT;
    IF p_dob IS NULL THEN
        RETURN 0;
    END IF;
    SET v_age = TIMESTAMPDIFF(YEAR, p_dob, CURDATE());
    RETURN GREATEST(0, v_age);
END$$

-- ============================================================================
-- FUNCTION 2: fn_calculate_bill_total
-- Requirement: Calculate final bill amount after discount
-- ============================================================================
CREATE FUNCTION fn_calculate_bill_total(p_amount DECIMAL(10,2), p_discount DECIMAL(10,2))
RETURNS DECIMAL(10,2)
DETERMINISTIC
NO SQL
BEGIN
    DECLARE v_final DECIMAL(10,2);
    SET v_final = COALESCE(p_amount, 0.00) - COALESCE(p_discount, 0.00);
    RETURN GREATEST(0.00, v_final);
END$$

DELIMITER ;
