-- ============================================================================
-- PES UNIVERSITY - DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
-- COURSE: DATABASE MANAGEMENT SYSTEMS (DBMS MINI-PROJECT)
-- FILE: triggers.sql (Business Integrity and Stock Triggers)
-- ============================================================================

USE healthcare_db;

DROP TRIGGER IF EXISTS trg_after_presc_med_insert;
DROP TRIGGER IF EXISTS trg_before_medicine_stock_check;
DROP TRIGGER IF EXISTS trg_after_appointment_cancelled;

DELIMITER $$

-- ============================================================================
-- TRIGGER 1: trg_after_presc_med_insert
-- Requirement: Automatically update medicine inventory when medicine is dispensed.
-- ============================================================================
CREATE TRIGGER trg_after_presc_med_insert
AFTER INSERT ON Prescription_Medicine
FOR EACH ROW
BEGIN
    -- Deduct 1 unit (or standard prescription course) safely from inventory
    UPDATE Medicine
    SET in_stock = in_stock - 1
    WHERE id = NEW.medicine_id
      AND in_stock > 0;
END$$

-- ============================================================================
-- TRIGGER 2: trg_before_medicine_stock_check
-- Requirement: Prevent negative medicine stock
-- ============================================================================
CREATE TRIGGER trg_before_medicine_stock_check
BEFORE UPDATE ON Medicine
FOR EACH ROW
BEGIN
    IF NEW.in_stock < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Integrity violation: Medicine inventory cannot be negative.';
    END IF;
END$$

-- ============================================================================
-- TRIGGER 3: trg_after_appointment_cancelled
-- Requirement: When an appointment is cancelled, free up doctor availability slot
-- ============================================================================
CREATE TRIGGER trg_after_appointment_cancelled
AFTER UPDATE ON Appointment
FOR EACH ROW
BEGIN
    IF NEW.status = 'Cancelled' AND OLD.status != 'Cancelled' THEN
        UPDATE Doctor_Availability
        SET status = 'Available'
        WHERE doctor_id = NEW.doctor_id
          AND date = DATE(NEW.appointment_date)
          AND TIME(NEW.appointment_date) >= st_time
          AND TIME(NEW.appointment_date) < end_time
          AND status = 'Booked'
        LIMIT 1;
    END IF;
END$$

DELIMITER ;
