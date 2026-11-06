-- ============================================================================
-- PES UNIVERSITY - DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
-- COURSE: DATABASE MANAGEMENT SYSTEMS (DBMS MINI-PROJECT)
-- PROJECT: SMART HEALTHCARE & DOCTOR APPOINTMENT MANAGEMENT SYSTEM
-- FILE: schema.sql (10 Relational Tables, Constraints, Indexes & Foreign Keys)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS healthcare_db;
USE healthcare_db;

-- Drop tables in reverse foreign-key dependency order for clean recreation
DROP TABLE IF EXISTS Payment;
DROP TABLE IF EXISTS Bill;
DROP TABLE IF EXISTS Prescription_Medicine;
DROP TABLE IF EXISTS Medicine;
DROP TABLE IF EXISTS Prescription;
DROP TABLE IF EXISTS Appointment;
DROP TABLE IF EXISTS Doctor_Availability;
DROP TABLE IF EXISTS Doctor_Phone;
DROP TABLE IF EXISTS Doctor;
DROP TABLE IF EXISTS Patient;
DROP TABLE IF EXISTS User_Auth;

-- ============================================================================
-- TABLE 0: User_Auth (System Authentication & Role-Based Access Control)
-- ============================================================================
CREATE TABLE User_Auth (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'doctor', 'patient') NOT NULL DEFAULT 'patient',
    ref_id VARCHAR(50) NULL, -- Stores p_id or doctor_id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 1: Patient
-- Requirements:
-- - p_id is primary key
-- - email is UNIQUE
-- - Age is calculated dynamically using DOB (No age column!)
-- ============================================================================
CREATE TABLE Patient (
    p_id VARCHAR(20) PRIMARY KEY,
    f_name VARCHAR(50) NOT NULL,
    l_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    blood_group VARCHAR(5) NOT NULL,
    dob DATE NOT NULL,
    street VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_patient_name (f_name, l_name),
    INDEX idx_patient_city (city),
    INDEX idx_patient_dob (dob)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 2: Doctor
-- Requirements:
-- - id is primary key
-- - email is UNIQUE
-- - consult_fee with proper DECIMAL monetary type
-- ============================================================================
CREATE TABLE Doctor (
    id VARCHAR(20) PRIMARY KEY,
    f_name VARCHAR(50) NOT NULL,
    l_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    qualification VARCHAR(100) NOT NULL,
    experience INT NOT NULL CHECK (experience >= 0),
    consult_fee DECIMAL(10,2) NOT NULL CHECK (consult_fee >= 0.00),
    city VARCHAR(50) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_doctor_name (f_name, l_name),
    INDEX idx_doctor_qualification (qualification),
    INDEX idx_doctor_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 3: Doctor_Phone
-- Requirements:
-- - Composite Primary Key (doctor_id, phone_no)
-- - Foreign key referencing Doctor(id)
-- - Doctor can have multiple phone numbers (1-to-Many)
-- ============================================================================
CREATE TABLE Doctor_Phone (
    doctor_id VARCHAR(20) NOT NULL,
    phone_no VARCHAR(20) NOT NULL,
    PRIMARY KEY (doctor_id, phone_no),
    CONSTRAINT fk_doctor_phone_doctor
        FOREIGN KEY (doctor_id) REFERENCES Doctor(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 4: Doctor_Availability
-- Requirements:
-- - availability_id is primary key
-- - Foreign key referencing Doctor(id)
-- - Store available dates and start/end time slots
-- ============================================================================
CREATE TABLE Doctor_Availability (
    availability_id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    st_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('Available', 'Booked', 'Unavailable') NOT NULL DEFAULT 'Available',
    CONSTRAINT fk_doctor_avail_doctor
        FOREIGN KEY (doctor_id) REFERENCES Doctor(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_avail_date_time (doctor_id, date, st_time),
    INDEX idx_avail_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 5: Appointment
-- Requirements:
-- - appointment_id is primary key
-- - Foreign key referencing Patient(p_id)
-- - Foreign key referencing Doctor(id)
-- - Supports Scheduled, Completed, Cancelled, and In-Progress statuses
-- ============================================================================
CREATE TABLE Appointment (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    p_id VARCHAR(20) NOT NULL,
    doctor_id VARCHAR(20) NOT NULL,
    appointment_date DATETIME NOT NULL,
    status ENUM('Scheduled', 'Completed', 'Cancelled', 'In-Progress') NOT NULL DEFAULT 'Scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appointment_patient
        FOREIGN KEY (p_id) REFERENCES Patient(p_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_appointment_doctor
        FOREIGN KEY (doctor_id) REFERENCES Doctor(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_appt_date (appointment_date),
    INDEX idx_appt_status (status),
    INDEX idx_appt_doctor_date (doctor_id, appointment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 6: Prescription
-- Requirements:
-- - pers_id is primary key
-- - appointment_id is UNIQUE and FOREIGN KEY referencing Appointment(appointment_id)
-- - One appointment can have at most one prescription (1-to-1)
-- ============================================================================
CREATE TABLE Prescription (
    pers_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL UNIQUE,
    symptoms TEXT NOT NULL,
    diagnosis TEXT NOT NULL,
    prescribed_date DATE NOT NULL,
    follow_up_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prescription_appointment
        FOREIGN KEY (appointment_id) REFERENCES Appointment(appointment_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_presc_date (prescribed_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 7: Medicine
-- Requirements:
-- - id is primary key
-- - price is DECIMAL monetary value
-- - in_stock with CHECK constraint (in_stock >= 0)
-- ============================================================================
CREATE TABLE Medicine (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0.00),
    in_stock INT NOT NULL CHECK (in_stock >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_medicine_name (name),
    INDEX idx_medicine_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 8: Prescription_Medicine
-- Requirements:
-- - Junction table for many-to-many relationship
-- - Composite primary key (pers_id, medicine_id)
-- - Foreign key referencing Prescription(pers_id)
-- - Foreign key referencing Medicine(id)
-- ============================================================================
CREATE TABLE Prescription_Medicine (
    pers_id INT NOT NULL,
    medicine_id INT NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    duration_days INT NOT NULL CHECK (duration_days > 0),
    instruction VARCHAR(255) NOT NULL,
    PRIMARY KEY (pers_id, medicine_id),
    CONSTRAINT fk_presc_med_prescription
        FOREIGN KEY (pers_id) REFERENCES Prescription(pers_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_presc_med_medicine
        FOREIGN KEY (medicine_id) REFERENCES Medicine(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 9: Bill
-- Requirements:
-- - bill_id is primary key
-- - appointment_id is UNIQUE and FOREIGN KEY referencing Appointment(appointment_id)
-- - 1-to-1 relationship with Appointment
-- - amount and discount with DECIMAL monetary values
-- ============================================================================
CREATE TABLE Bill (
    bill_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL UNIQUE,
    bill_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0.00),
    discount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0.00),
    status ENUM('Pending', 'Paid', 'Partially Paid', 'Cancelled') NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bill_appointment
        FOREIGN KEY (appointment_id) REFERENCES Appointment(appointment_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_bill_status (status),
    INDEX idx_bill_date (bill_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 10: Payment
-- Requirements:
-- - payment_id is primary key
-- - bill_id is FOREIGN KEY referencing Bill(bill_id) (1-to-many for partial payments)
-- - utr is UNIQUE
-- - method: UPI, Card, Net Banking
-- ============================================================================
CREATE TABLE Payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    utr VARCHAR(50) NOT NULL UNIQUE,
    method ENUM('UPI', 'Card', 'Net Banking') NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0.00),
    status ENUM('Success', 'Pending', 'Failed') NOT NULL DEFAULT 'Success',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_bill
        FOREIGN KEY (bill_id) REFERENCES Bill(bill_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_payment_utr (utr),
    INDEX idx_payment_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
