-- ============================================================================
-- PES UNIVERSITY - DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
-- COURSE: DATABASE MANAGEMENT SYSTEMS (DBMS MINI-PROJECT)
-- FILE: seed.sql (Comprehensive Realistic Seed Data)
-- ============================================================================

USE healthcare_db;

-- ----------------------------------------------------------------------------
-- 1. SEED: User_Auth (Bcrypt hashed password: 'Password@123')
-- Hash: $2b$10$wO3C4j/X19l0hX5fI03e9ep4YlJ9qGqNq/P5H03n8J1yC0o2J0k2G or standard bcrypt
-- We will also seed default demo users:
-- Admin: admin@pes.edu
-- Doctors: doc1@pes.edu to doc8@pes.edu
-- Patients: pat1@pes.edu to pat12@pes.edu
-- ----------------------------------------------------------------------------
INSERT INTO User_Auth (email, password_hash, role, ref_id) VALUES
('admin@pes.edu', '$2b$10$G0N3O9vY1pA8g5Q7Z3g6se7bM5gL7m.Uo3H7b0x9k8G1n6q2J0k2G', 'admin', 'ADM001'),
('rajesh.sharma@pes.edu', '$2b$10$G0N3O9vY1pA8g5Q7Z3g6se7bM5gL7m.Uo3H7b0x9k8G1n6q2J0k2G', 'doctor', 'DOC001'),
('priya.nair@pes.edu', '$2b$10$G0N3O9vY1pA8g5Q7Z3g6se7bM5gL7m.Uo3H7b0x9k8G1n6q2J0k2G', 'doctor', 'DOC002'),
('arun.kumar@pes.edu', '$2b$10$G0N3O9vY1pA8g5Q7Z3g6se7bM5gL7m.Uo3H7b0x9k8G1n6q2J0k2G', 'doctor', 'DOC003'),
('ananya.deshmukh@pes.edu', '$2b$10$G0N3O9vY1pA8g5Q7Z3g6se7bM5gL7m.Uo3H7b0x9k8G1n6q2J0k2G', 'doctor', 'DOC004'),
('vikram.reddy@pes.edu', '$2b$10$G0N3O9vY1pA8g5Q7Z3g6se7bM5gL7m.Uo3H7b0x9k8G1n6q2J0k2G', 'doctor', 'DOC005'),
('sneha.patel@pes.edu', '$2b$10$G0N3O9vY1pA8g5Q7Z3g6se7bM5gL7m.Uo3H7b0x9k8G1n6q2J0k2G', 'doctor', 'DOC006'),
('kavita.iyer@pes.edu', '$2b$10$G0N3O9vY1pA8g5Q7Z3g6se7bM5gL7m.Uo3H7b0x9k8G1n6q2J0k2G', 'doctor', 'DOC007'),
('suresh.menon@pes.edu', '$2b$10$G0N3O9vY1pA8g5Q7Z3g6se7bM5gL7m.Uo3H7b0x9k8G1n6q2J0k2G', 'doctor', 'DOC008'),
('rohit.verma@gmail.com', '$2b$10$G0N3O9vY1pA8g5Q7Z3g6se7bM5gL7m.Uo3H7b0x9k8G1n6q2J0k2G', 'patient', 'PAT001'),
('meera.rao@gmail.com', '$2b$10$G0N3O9vY1pA8g5Q7Z3g6se7bM5gL7m.Uo3H7b0x9k8G1n6q2J0k2G', 'patient', 'PAT002'),
('karthik.s@gmail.com', '$2b$10$G0N3O9vY1pA8g5Q7Z3g6se7bM5gL7m.Uo3H7b0x9k8G1n6q2J0k2G', 'patient', 'PAT003'),
('divya.gowda@gmail.com', '$2b$10$G0N3O9vY1pA8g5Q7Z3g6se7bM5gL7m.Uo3H7b0x9k8G1n6q2J0k2G', 'patient', 'PAT004'),
('rahul.singh@gmail.com', '$2b$10$G0N3O9vY1pA8g5Q7Z3g6se7bM5gL7m.Uo3H7b0x9k8G1n6q2J0k2G', 'patient', 'PAT005'),
('pooja.hegde@gmail.com', '$2b$10$G0N3O9vY1pA8g5Q7Z3g6se7bM5gL7m.Uo3H7b0x9k8G1n6q2J0k2G', 'patient', 'PAT006'),
('manoj.kulkarni@gmail.com', '$2b$10$G0N3O9vY1pA8g5Q7Z3g6se7bM5gL7m.Uo3H7b0x9k8G1n6q2J0k2G', 'patient', 'PAT007'),
('swathi.bhat@gmail.com', '$2b$10$G0N3O9vY1pA8g5Q7Z3g6se7bM5gL7m.Uo3H7b0x9k8G1n6q2J0k2G', 'patient', 'PAT008'),
('deepak.joshi@gmail.com', '$2b$10$G0N3O9vY1pA8g5Q7Z3g6se7bM5gL7m.Uo3H7b0x9k8G1n6q2J0k2G', 'patient', 'PAT009'),
('aishwarya.pai@gmail.com', '$2b$10$G0N3O9vY1pA8g5Q7Z3g6se7bM5gL7m.Uo3H7b0x9k8G1n6q2J0k2G', 'patient', 'PAT010'),
('nikhil.nayak@gmail.com', '$2b$10$G0N3O9vY1pA8g5Q7Z3g6se7bM5gL7m.Uo3H7b0x9k8G1n6q2J0k2G', 'patient', 'PAT011'),
('tanvi.shah@gmail.com', '$2b$10$G0N3O9vY1pA8g5Q7Z3g6se7bM5gL7m.Uo3H7b0x9k8G1n6q2J0k2G', 'patient', 'PAT012');

-- ----------------------------------------------------------------------------
-- 2. SEED: Patient (12 realistic patients with varied DOBs, blood groups, addresses)
-- ----------------------------------------------------------------------------
INSERT INTO Patient (p_id, f_name, l_name, email, gender, blood_group, dob, street, city, pincode) VALUES
('PAT001', 'Rohit', 'Verma', 'rohit.verma@gmail.com', 'Male', 'O+', '1995-04-12', '14 Ring Road, Banashankari 3rd Stage', 'Bengaluru', '560085'),
('PAT002', 'Meera', 'Rao', 'meera.rao@gmail.com', 'Female', 'A+', '1988-11-23', '201 Green Glen Layout, Bellandur', 'Bengaluru', '560103'),
('PAT003', 'Karthik', 'Sundaram', 'karthik.s@gmail.com', 'Male', 'B+', '2001-08-05', '45 PES Campus Road, BSK', 'Bengaluru', '560085'),
('PAT004', 'Divya', 'Gowda', 'divya.gowda@gmail.com', 'Female', 'AB+', '1992-02-18', '77 100ft Road, Indiranagar', 'Bengaluru', '560038'),
('PAT005', 'Rahul', 'Singh', 'rahul.singh@gmail.com', 'Male', 'O-', '1982-06-30', '12 MG Road', 'Mysuru', '570001'),
('PAT006', 'Pooja', 'Hegde', 'pooja.hegde@gmail.com', 'Female', 'B-', '1999-09-14', '88 Malleshwaram 8th Cross', 'Bengaluru', '560003'),
('PAT007', 'Manoj', 'Kulkarni', 'manoj.kulkarni@gmail.com', 'Male', 'A-', '1976-12-01', '52 Vidyanagar', 'Hubballi', '580021'),
('PAT008', 'Swathi', 'Bhat', 'swathi.bhat@gmail.com', 'Female', 'O+', '1996-03-25', '19 Jayanagar 4th Block', 'Bengaluru', '560011'),
('PAT009', 'Deepak', 'Joshi', 'deepak.joshi@gmail.com', 'Male', 'AB-', '1985-07-19', '302 Whitefield Main Rd', 'Bengaluru', '560066'),
('PAT010', 'Aishwarya', 'Pai', 'aishwarya.pai@gmail.com', 'Female', 'A+', '2003-01-10', '11 Brigade Rd', 'Bengaluru', '560001'),
('PAT011', 'Nikhil', 'Nayak', 'nikhil.nayak@gmail.com', 'Male', 'B+', '1990-10-08', '24 Hampankatta', 'Mangaluru', '575001'),
('PAT012', 'Tanvi', 'Shah', 'tanvi.shah@gmail.com', 'Female', 'O+', '1997-05-16', '60 Koramangala 5th Block', 'Bengaluru', '560095');

-- ----------------------------------------------------------------------------
-- 3. SEED: Doctor (8 realistic doctors across specialties)
-- ----------------------------------------------------------------------------
INSERT INTO Doctor (id, f_name, l_name, email, qualification, experience, consult_fee, city, pincode, status) VALUES
('DOC001', 'Rajesh', 'Sharma', 'rajesh.sharma@pes.edu', 'MBBS, MD (Cardiology)', 15, 800.00, 'Bengaluru', '560085', 'Active'),
('DOC002', 'Priya', 'Nair', 'priya.nair@pes.edu', 'MBBS, MS (Orthopedics)', 11, 700.00, 'Bengaluru', '560011', 'Active'),
('DOC003', 'Arun', 'Kumar', 'arun.kumar@pes.edu', 'MBBS, MD (General Medicine)', 9, 500.00, 'Bengaluru', '560038', 'Active'),
('DOC004', 'Ananya', 'Deshmukh', 'ananya.deshmukh@pes.edu', 'MBBS, DCH, MD (Pediatrics)', 12, 650.00, 'Bengaluru', '560003', 'Active'),
('DOC005', 'Vikram', 'Reddy', 'vikram.reddy@pes.edu', 'MBBS, MD (Neurology)', 18, 1000.00, 'Bengaluru', '560066', 'Active'),
('DOC006', 'Sneha', 'Patel', 'sneha.patel@pes.edu', 'MBBS, DVD (Dermatology)', 8, 600.00, 'Bengaluru', '560095', 'Active'),
('DOC007', 'Kavita', 'Iyer', 'kavita.iyer@pes.edu', 'MBBS, MS (ENT)', 10, 550.00, 'Mysuru', '570001', 'Active'),
('DOC008', 'Suresh', 'Menon', 'suresh.menon@pes.edu', 'MBBS, MD (Pulmonology)', 14, 750.00, 'Hubballi', '580021', 'Active');

-- ----------------------------------------------------------------------------
-- 4. SEED: Doctor_Phone (Multiple phone numbers per doctor)
-- ----------------------------------------------------------------------------
INSERT INTO Doctor_Phone (doctor_id, phone_no) VALUES
('DOC001', '+91 9845012345'),
('DOC001', '+91 8028521001'),
('DOC002', '+91 9845023456'),
('DOC002', '+91 8026589922'),
('DOC003', '+91 9845034567'),
('DOC004', '+91 9845045678'),
('DOC004', '+91 8023490011'),
('DOC005', '+91 9845056789'),
('DOC006', '+91 9845067890'),
('DOC007', '+91 9845078901'),
('DOC008', '+91 9845089012');

-- ----------------------------------------------------------------------------
-- 5. SEED: Doctor_Availability (Slots for current & upcoming days)
-- ----------------------------------------------------------------------------
INSERT INTO Doctor_Availability (doctor_id, date, st_time, end_time, status) VALUES
('DOC001', CURDATE(), '09:00:00', '10:00:00', 'Booked'),
('DOC001', CURDATE(), '10:00:00', '11:00:00', 'Available'),
('DOC001', CURDATE(), '11:00:00', '12:00:00', 'Available'),
('DOC001', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', '10:00:00', 'Available'),
('DOC001', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', '11:00:00', 'Available'),
('DOC002', CURDATE(), '14:00:00', '15:00:00', 'Booked'),
('DOC002', CURDATE(), '15:00:00', '16:00:00', 'Available'),
('DOC002', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', '15:00:00', 'Available'),
('DOC003', CURDATE(), '09:30:00', '10:30:00', 'Booked'),
('DOC003', CURDATE(), '11:00:00', '12:00:00', 'Available'),
('DOC003', DATE_ADD(CURDATE(), INTERVAL 2 DAY), '16:00:00', '17:00:00', 'Available'),
('DOC004', CURDATE(), '10:00:00', '11:00:00', 'Available'),
('DOC004', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', '11:00:00', 'Available'),
('DOC005', CURDATE(), '11:00:00', '12:00:00', 'Booked'),
('DOC005', DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:00:00', '12:00:00', 'Available'),
('DOC006', CURDATE(), '15:30:00', '16:30:00', 'Available'),
('DOC007', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', '10:00:00', 'Available'),
('DOC008', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:30:00', '11:30:00', 'Available');

-- ----------------------------------------------------------------------------
-- 6. SEED: Medicine (16 realistic medicines with categories, prices, in_stock)
-- ----------------------------------------------------------------------------
INSERT INTO Medicine (name, category, price, in_stock) VALUES
('Paracetamol 650mg', 'Analgesic / Antipyretic', 35.00, 150),
('Amoxicillin 500mg', 'Antibiotic', 120.00, 85),
('Azithromycin 500mg', 'Antibiotic', 145.00, 60),
('Pantoprazole 40mg', 'Antacid / PPI', 95.00, 110),
('Telmisartan 40mg', 'Antihypertensive', 110.00, 90),
('Atorvastatin 10mg', 'Cardiovascular', 160.00, 75),
('Metformin 500mg', 'Antidiabetic', 65.00, 130),
('Cetirizine 10mg', 'Antihistamine', 40.00, 140),
('Montelukast 10mg', 'Respiratory', 135.00, 50),
('Ibuprofen 400mg', 'NSAID / Pain Relief', 55.00, 95),
('Diclofenac Gel 30g', 'Topical Analgesic', 85.00, 40),
('Cough Syrup 100ml', 'Cough & Cold', 90.00, 45),
('Multivitamin Zinc', 'Nutritional Supplement', 180.00, 120),
('Calcium + Vit D3', 'Nutritional Supplement', 150.00, 80),
('Omeprazole 20mg', 'Antacid', 50.00, 70),
('Salbutamol Inhaler', 'Bronchodilator', 220.00, 25);

-- ----------------------------------------------------------------------------
-- 7. SEED: Appointment (16 appointments across scheduled, completed, cancelled)
-- ----------------------------------------------------------------------------
INSERT INTO Appointment (appointment_id, p_id, doctor_id, appointment_date, status) VALUES
(1, 'PAT001', 'DOC001', DATE_SUB(NOW(), INTERVAL 5 DAY), 'Completed'),
(2, 'PAT002', 'DOC002', DATE_SUB(NOW(), INTERVAL 4 DAY), 'Completed'),
(3, 'PAT003', 'DOC003', DATE_SUB(NOW(), INTERVAL 3 DAY), 'Completed'),
(4, 'PAT004', 'DOC004', DATE_SUB(NOW(), INTERVAL 2 DAY), 'Completed'),
(5, 'PAT005', 'DOC005', DATE_SUB(NOW(), INTERVAL 1 DAY), 'Completed'),
(6, 'PAT006', 'DOC001', DATE_ADD(NOW(), INTERVAL 1 DAY), 'Scheduled'),
(7, 'PAT007', 'DOC003', DATE_ADD(NOW(), INTERVAL 1 DAY), 'Scheduled'),
(8, 'PAT008', 'DOC002', DATE_ADD(NOW(), INTERVAL 2 DAY), 'Scheduled'),
(9, 'PAT009', 'DOC006', DATE_ADD(NOW(), INTERVAL 2 DAY), 'Scheduled'),
(10, 'PAT010', 'DOC004', DATE_ADD(NOW(), INTERVAL 3 DAY), 'Scheduled'),
(11, 'PAT001', 'DOC005', DATE_SUB(NOW(), INTERVAL 10 DAY), 'Completed'),
(12, 'PAT002', 'DOC001', DATE_SUB(NOW(), INTERVAL 8 DAY), 'Completed'),
(13, 'PAT003', 'DOC002', DATE_SUB(NOW(), INTERVAL 6 DAY), 'Cancelled'),
(14, 'PAT011', 'DOC007', DATE_ADD(NOW(), INTERVAL 4 DAY), 'Scheduled'),
(15, 'PAT012', 'DOC008', DATE_ADD(NOW(), INTERVAL 4 DAY), 'Scheduled'),
(16, 'PAT004', 'DOC003', DATE_SUB(NOW(), INTERVAL 12 DAY), 'Completed');

-- ----------------------------------------------------------------------------
-- 8. SEED: Prescription (For completed appointments)
-- ----------------------------------------------------------------------------
INSERT INTO Prescription (pers_id, appointment_id, symptoms, diagnosis, prescribed_date, follow_up_date) VALUES
(1, 1, 'Chest tightness during exertion, mild palpitation', 'Mild Essential Hypertension Stage 1', DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 25 DAY)),
(2, 2, 'Right knee pain, swelling after marathon run', 'Right Patellofemoral Pain Syndrome / Ligament Strain', DATE_SUB(CURDATE(), INTERVAL 4 DAY), DATE_ADD(CURDATE(), INTERVAL 14 DAY)),
(3, 3, 'High grade fever with chills, body ache, dry cough', 'Acute Viral Upper Respiratory Tract Infection', DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL 7 DAY)),
(4, 4, 'Runny nose, persistent night cough, low appetite', 'Pediatric Allergic Rhinitis', DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 10 DAY)),
(5, 5, 'Throbbing unilateral headache, nausea, photo-sensitivity', 'Migraine without aura', DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 30 DAY)),
(6, 11, 'Persistent dizziness and cervical stiffness', 'Cervical Spondylosis with Muscle Spasm', DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 20 DAY)),
(7, 12, 'Elevated fasting lipid numbers, mild dyspnea', 'Hyperlipidemia & Preventive Cardiac Care', DATE_SUB(CURDATE(), INTERVAL 8 DAY), DATE_ADD(CURDATE(), INTERVAL 60 DAY)),
(8, 16, 'Acid reflux, epigastric burning post meals', 'Gastroesophageal Reflux Disease (GERD)', DATE_SUB(CURDATE(), INTERVAL 12 DAY), DATE_ADD(CURDATE(), INTERVAL 18 DAY));

-- ----------------------------------------------------------------------------
-- 9. SEED: Prescription_Medicine (Many-to-Many junction)
-- ----------------------------------------------------------------------------
INSERT INTO Prescription_Medicine (pers_id, medicine_id, dosage, frequency, duration_days, instruction) VALUES
(1, 5, '40 mg', 'Once daily in the morning', 30, 'Take before breakfast with water'),
(1, 6, '10 mg', 'Once daily at bedtime', 30, 'Avoid grapefruit juice'),
(2, 10, '400 mg', 'Twice daily after food', 5, 'Stop if stomach irritation occurs'),
(2, 11, 'Topical application', 'Apply 3 times daily', 7, 'Gently rub on affected knee area'),
(3, 1, '650 mg', 'Every 6 hours if fever > 100 F', 4, 'Max 4 tablets in 24 hours'),
(3, 3, '500 mg', 'Once daily 1 hour before meal', 3, 'Complete full 3-day course'),
(4, 8, '5 mg (Half tab)', 'Once daily before sleep', 5, 'May cause slight drowsiness'),
(4, 12, '5 ml', 'Twice daily', 5, 'Shake bottle well before use'),
(5, 1, '650 mg', 'At onset of headache', 3, 'Rest in a quiet dark room'),
(6, 10, '400 mg', 'Twice daily after food', 5, 'Take with a glass of water'),
(7, 6, '10 mg', 'Once daily after dinner', 60, 'Periodic lipid profile test recommended'),
(8, 4, '40 mg', 'Once daily 30 mins before breakfast', 14, 'Swallow whole, do not crush');

-- ----------------------------------------------------------------------------
-- 10. SEED: Bill (1-to-1 with appointments)
-- Consult fee + medicine fee - discount
-- ----------------------------------------------------------------------------
INSERT INTO Bill (bill_id, appointment_id, bill_date, amount, discount, status) VALUES
(1, 1, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 1020.00, 50.00, 'Paid'),
(2, 2, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 800.00, 40.00, 'Paid'),
(3, 3, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 640.00, 40.00, 'Paid'),
(4, 4, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 750.00, 30.00, 'Pending'),
(5, 5, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1010.00, 25.00, 'Paid'),
(6, 11, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 1030.00, 25.00, 'Paid'),
(7, 12, DATE_SUB(CURDATE(), INTERVAL 8 DAY), 910.00, 50.00, 'Paid'),
(8, 16, DATE_SUB(CURDATE(), INTERVAL 12 DAY), 560.00, 35.00, 'Paid');

-- ----------------------------------------------------------------------------
-- 11. SEED: Payment (Simulated UPI, Card, Net Banking records)
-- ----------------------------------------------------------------------------
INSERT INTO Payment (bill_id, utr, method, amount, status, payment_date) VALUES
(1, 'UPI/20261101/984512019921', 'UPI', 1020.00, 'Success', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 'CARD/20261102/411122334455', 'Card', 800.00, 'Success', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(3, 'NET/20261103/HDFC000192837', 'Net Banking', 640.00, 'Success', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(5, 'UPI/20261105/984519928374', 'UPI', 1010.00, 'Success', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(6, 'CARD/20261027/550011223344', 'Card', 1030.00, 'Success', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(7, 'UPI/20261029/984523746199', 'UPI', 910.00, 'Success', DATE_SUB(NOW(), INTERVAL 8 DAY)),
(8, 'UPI/20261025/984566778899', 'UPI', 560.00, 'Success', DATE_SUB(NOW(), INTERVAL 12 DAY));
