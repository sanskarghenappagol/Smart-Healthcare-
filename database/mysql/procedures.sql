-- ============================================================================
-- PES UNIVERSITY - DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
-- COURSE: DATABASE MANAGEMENT SYSTEMS (DBMS MINI-PROJECT)
-- FILE: procedures.sql (Advanced Stored Procedures for Transactional Operations)
-- ============================================================================

USE healthcare_db;

DROP PROCEDURE IF EXISTS sp_book_appointment;
DROP PROCEDURE IF EXISTS sp_generate_bill;
DROP PROCEDURE IF EXISTS sp_update_medicine_stock;

DELIMITER $$

-- ============================================================================
-- PROCEDURE 1: sp_book_appointment
-- Description: Books an appointment with validation, conflict prevention,
-- and slot status synchronization within an atomic transaction.
-- ============================================================================
CREATE PROCEDURE sp_book_appointment(
    IN p_patient_id VARCHAR(20),
    IN p_doctor_id VARCHAR(20),
    IN p_appt_date DATETIME,
    OUT p_appointment_id INT,
    OUT p_status_code INT,
    OUT p_message VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_patient_exists INT DEFAULT 0;
    DECLARE v_doctor_exists INT DEFAULT 0;
    DECLARE v_conflict_count INT DEFAULT 0;
    DECLARE v_avail_id INT DEFAULT NULL;

    -- Exit handler for unexpected SQLEXCEPTION
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_appointment_id = 0;
        SET p_status_code = 500;
        SET p_message = 'Database error: Transaction rolled back during appointment booking.';
    END;

    START TRANSACTION;

    -- 1. Validate Patient
    SELECT COUNT(*) INTO v_patient_exists FROM Patient WHERE p_id = p_patient_id;
    IF v_patient_exists = 0 THEN
        ROLLBACK;
        SET p_appointment_id = 0;
        SET p_status_code = 404;
        SET p_message = 'Booking failed: Patient ID does not exist.';
        LEAVE proc_label;
    END IF;

    -- 2. Validate Doctor
    SELECT COUNT(*) INTO v_doctor_exists FROM Doctor WHERE id = p_doctor_id AND status = 'Active';
    IF v_doctor_exists = 0 THEN
        ROLLBACK;
        SET p_appointment_id = 0;
        SET p_status_code = 404;
        SET p_message = 'Booking failed: Active Doctor ID does not exist.';
        LEAVE proc_label;
    END IF;

    -- 3. Check for Conflicting Appointment for the same doctor at the same date/time
    SELECT COUNT(*) INTO v_conflict_count
    FROM Appointment
    WHERE doctor_id = p_doctor_id
      AND appointment_date = p_appt_date
      AND status NOT IN ('Cancelled');

    IF v_conflict_count > 0 THEN
        ROLLBACK;
        SET p_appointment_id = 0;
        SET p_status_code = 409;
        SET p_message = 'Booking conflict: Doctor already has an active appointment at this time.';
        LEAVE proc_label;
    END IF;

    -- 4. Insert Appointment
    INSERT INTO Appointment (p_id, doctor_id, appointment_date, status)
    VALUES (p_patient_id, p_doctor_id, p_appt_date, 'Scheduled');

    SET p_appointment_id = LAST_INSERT_ID();

    -- 5. Mark doctor availability slot as Booked if matching date & time exists
    SELECT availability_id INTO v_avail_id
    FROM Doctor_Availability
    WHERE doctor_id = p_doctor_id
      AND date = DATE(p_appt_date)
      AND TIME(p_appt_date) >= st_time
      AND TIME(p_appt_date) < end_time
      AND status = 'Available'
    LIMIT 1;

    IF v_avail_id IS NOT NULL THEN
        UPDATE Doctor_Availability
        SET status = 'Booked'
        WHERE availability_id = v_avail_id;
    END IF;

    COMMIT;
    SET p_status_code = 200;
    SET p_message = 'Appointment booked successfully.';
END$$

-- ============================================================================
-- PROCEDURE 2: sp_generate_bill
-- Description: Computes doctor consultation fee + medicine cost, applies
-- discount, and creates or updates a bill record.
-- ============================================================================
CREATE PROCEDURE sp_generate_bill(
    IN p_appointment_id INT,
    IN p_discount DECIMAL(10,2),
    OUT p_bill_id INT,
    OUT p_total_amount DECIMAL(10,2),
    OUT p_status_code INT,
    OUT p_message VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_consult_fee DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_medicine_cost DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_gross_amount DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_final_amount DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_pres_id INT DEFAULT NULL;
    DECLARE v_existing_bill_id INT DEFAULT NULL;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_bill_id = 0;
        SET p_total_amount = 0.00;
        SET p_status_code = 500;
        SET p_message = 'Database error: Transaction rolled back during bill generation.';
    END;

    START TRANSACTION;

    -- 1. Fetch Doctor Consultation Fee for this appointment
    SELECT d.consult_fee INTO v_consult_fee
    FROM Appointment a
    JOIN Doctor d ON a.doctor_id = d.id
    WHERE a.appointment_id = p_appointment_id;

    IF v_consult_fee IS NULL THEN
        ROLLBACK;
        SET p_bill_id = 0;
        SET p_total_amount = 0.00;
        SET p_status_code = 404;
        SET p_message = 'Appointment not found.';
        LEAVE proc_label;
    END IF;

    -- 2. Find Prescription if exists
    SELECT pers_id INTO v_pres_id
    FROM Prescription
    WHERE appointment_id = p_appointment_id
    LIMIT 1;

    -- 3. Calculate Prescribed Medicine Cost
    IF v_pres_id IS NOT NULL THEN
        SELECT COALESCE(SUM(m.price), 0.00) INTO v_medicine_cost
        FROM Prescription_Medicine pm
        JOIN Medicine m ON pm.medicine_id = m.id
        WHERE pm.pers_id = v_pres_id;
    END IF;

    -- 4. Calculate Gross and Net Bill Amount
    SET v_gross_amount = v_consult_fee + v_medicine_cost;
    SET v_final_amount = GREATEST(0.00, v_gross_amount - COALESCE(p_discount, 0.00));

    -- 5. Insert or Update Bill
    SELECT bill_id INTO v_existing_bill_id
    FROM Bill
    WHERE appointment_id = p_appointment_id
    LIMIT 1;

    IF v_existing_bill_id IS NOT NULL THEN
        UPDATE Bill
        SET amount = v_final_amount,
            discount = COALESCE(p_discount, 0.00),
            bill_date = CURDATE()
        WHERE bill_id = v_existing_bill_id;
        SET p_bill_id = v_existing_bill_id;
    ELSE
        INSERT INTO Bill (appointment_id, bill_date, amount, discount, status)
        VALUES (p_appointment_id, CURDATE(), v_final_amount, COALESCE(p_discount, 0.00), 'Pending');
        SET p_bill_id = LAST_INSERT_ID();
    END IF;

    COMMIT;
    SET p_total_amount = v_final_amount;
    SET p_status_code = 200;
    SET p_message = 'Bill generated successfully.';
END$$

-- ============================================================================
-- PROCEDURE 3: sp_update_medicine_stock
-- Description: Updates stock with validation against negative inventory.
-- ============================================================================
CREATE PROCEDURE sp_update_medicine_stock(
    IN p_medicine_id INT,
    IN p_quantity_change INT, -- Positive to add stock, negative to consume
    OUT p_new_stock INT,
    OUT p_status_code INT,
    OUT p_message VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_current_stock INT DEFAULT 0;
    DECLARE v_med_exists INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_new_stock = -1;
        SET p_status_code = 500;
        SET p_message = 'Database error: Transaction rolled back during stock update.';
    END;

    START TRANSACTION;

    SELECT COUNT(*), COALESCE(MAX(in_stock), 0)
    INTO v_med_exists, v_current_stock
    FROM Medicine
    WHERE id = p_medicine_id;

    IF v_med_exists = 0 THEN
        ROLLBACK;
        SET p_new_stock = -1;
        SET p_status_code = 404;
        SET p_message = 'Medicine ID not found.';
        LEAVE proc_label;
    END IF;

    IF (v_current_stock + p_quantity_change) < 0 THEN
        ROLLBACK;
        SET p_new_stock = v_current_stock;
        SET p_status_code = 400;
        SET p_message = 'Insufficient inventory: Stock cannot drop below zero.';
        LEAVE proc_label;
    END IF;

    UPDATE Medicine
    SET in_stock = in_stock + p_quantity_change
    WHERE id = p_medicine_id;

    SET p_new_stock = v_current_stock + p_quantity_change;
    COMMIT;
    SET p_status_code = 200;
    SET p_message = 'Medicine stock updated successfully.';
END$$

DELIMITER ;
