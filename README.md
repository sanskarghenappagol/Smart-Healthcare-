# Smart Healthcare & Doctor Appointment Management System
### PES University · Department of Computer Science and Engineering
**Course:** Database Management Systems (DBMS Mini-Project)  
**Academic Session:** Aug - Dec 2026  
**Level:** Experiential Learning Level 3 Mini-Project (50 Marks)  

---

## 1. Project Overview & Objectives
The **Smart Healthcare & Doctor Appointment Management System** is a full-stack, dual-database web application designed to manage the clinical lifecycle of hospital operations—from patient self-registration and doctor discovery, to atomic appointment booking, clinical consultation, dynamic prescription issuing with medicine inventory control, automated billing, simulated multi-method payments, and flexible NoSQL diagnostic lab records.

### Key Highlights
- **10 Relational MySQL Tables (InnoDB):** Strict Third Normal Form (3NF/BCNF), composite primary keys, foreign key cascading, and unique constraints.
- **Dynamic Age Derivation:** The `Patient` table adheres strictly to the database design rule storing `dob DATE` without a redundant age column; age is dynamically computed using the deterministic function `fn_calculate_patient_age()`.
- **Advanced Stored Procedures & Triggers:** Automated appointment validation and slot booking (`sp_book_appointment`), consolidated consultation and medicine billing (`sp_generate_bill`), and safe inventory updates (`sp_update_medicine_stock`) accompanied by inventory triggers preventing negative stock.
- **ACID Transaction & Rollback Visualizer:** A live administrative demonstration feature executing multi-table operations over a single dedicated MySQL connection to prove Atomicity, Consistency, Isolation, and Durability under simulated failures.
- **MongoDB NoSQL Integration (15%):** Flexible document store for polymorphic lab test reports (CBC, Lipid profiles, Thyroid, MRI), patient reviews, and audit trails.
- **Three Authenticated User Roles:** Secure bcrypt hashing, JWT session authorization, and server-side RBAC for **Admin**, **Doctor**, and **Patient**.

---

## 2. Technology Stack & Dual-Database Justification

| Layer | Technology | Purpose |
|---|---|---|
| **Primary Database (85%)** | MySQL / MariaDB (InnoDB Engine) | Relational core, foreign keys, ACID transactions, stored procedures, triggers, CTEs, financial billing. |
| **Secondary Database (15%)** | MongoDB Document Store | Semi-structured polymorphic lab test biomarkers, clinical ratings, and append-only audit trail. |
| **Backend Runtime** | Node.js, Express, `mysql2/promise` | REST API route handlers, parameterized SQL query protection, JWT auth, and transaction control. |
| **Frontend Framework** | React 19, TypeScript, Vite | Modular components, typed data contracts, accessible interactive UI. |
| **Styling** | Tailwind CSS v4, Lucide React Icons | Medical UI design system, clean typography, tabular data figures. |

### Technology Justification (DBMS Mini-Project Criterion):
- **Why MySQL for 85%?** Clinical scheduling, pharmacy stock management, and billing require strict relational constraints, referential integrity, and ACID guarantees. A patient appointment cannot point to a non-existent doctor, and financial payments must either commit completely or roll back entirely.
- **Why MongoDB for 15%?** Clinical lab tests (Complete Blood Count, Lipid Profile, Thyroid Panel, HbA1c, and X-Ray) exhibit radically diverse JSON structures that cannot fit into a rigid relational table without sparse null columns. MongoDB provides polymorphic flexibility while AuditLogs benefit from an append-only document structure.

---

## 3. Relational Database Design – 10 Tables

### TABLE 1: Patient
```sql
Patient(
    p_id VARCHAR(20) PRIMARY KEY,
    f_name VARCHAR(50) NOT NULL,
    l_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    blood_group VARCHAR(5) NOT NULL,
    dob DATE NOT NULL,
    street VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    pincode VARCHAR(10) NOT NULL
);
```
*Rule:* Age is calculated dynamically via `fn_calculate_patient_age(p.dob)`. No redundant age column is stored.

### TABLE 2: Doctor
```sql
Doctor(
    id VARCHAR(20) PRIMARY KEY,
    f_name VARCHAR(50) NOT NULL,
    l_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    qualification VARCHAR(100) NOT NULL,
    experience INT NOT NULL CHECK (experience >= 0),
    consult_fee DECIMAL(10,2) NOT NULL CHECK (consult_fee >= 0.00),
    city VARCHAR(50) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active'
);
```

### TABLE 3: Doctor_Phone
```sql
Doctor_Phone(
    doctor_id VARCHAR(20) NOT NULL,
    phone_no VARCHAR(20) NOT NULL,
    PRIMARY KEY (doctor_id, phone_no),
    FOREIGN KEY (doctor_id) REFERENCES Doctor(id) ON DELETE CASCADE
);
```

### TABLE 4: Doctor_Availability
```sql
Doctor_Availability(
    availability_id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    st_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('Available', 'Booked', 'Unavailable') DEFAULT 'Available',
    FOREIGN KEY (doctor_id) REFERENCES Doctor(id) ON DELETE CASCADE
);
```

### TABLE 5: Appointment
```sql
Appointment(
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    p_id VARCHAR(20) NOT NULL,
    doctor_id VARCHAR(20) NOT NULL,
    appointment_date DATETIME NOT NULL,
    status ENUM('Scheduled', 'Completed', 'Cancelled', 'In-Progress') DEFAULT 'Scheduled',
    FOREIGN KEY (p_id) REFERENCES Patient(p_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES Doctor(id) ON DELETE CASCADE
);
```

### TABLE 6: Prescription
```sql
Prescription(
    pers_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL UNIQUE,
    symptoms TEXT NOT NULL,
    diagnosis TEXT NOT NULL,
    prescribed_date DATE NOT NULL,
    follow_up_date DATE NULL,
    FOREIGN KEY (appointment_id) REFERENCES Appointment(appointment_id) ON DELETE CASCADE
);
```

### TABLE 7: Medicine
```sql
Medicine(
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0.00),
    in_stock INT NOT NULL CHECK (in_stock >= 0)
);
```

### TABLE 8: Prescription_Medicine (M:N Junction Table)
```sql
Prescription_Medicine(
    pers_id INT NOT NULL,
    medicine_id INT NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    duration_days INT NOT NULL CHECK (duration_days > 0),
    instruction VARCHAR(255) NOT NULL,
    PRIMARY KEY (pers_id, medicine_id),
    FOREIGN KEY (pers_id) REFERENCES Prescription(pers_id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES Medicine(id) ON DELETE RESTRICT
);
```

### TABLE 9: Bill
```sql
Bill(
    bill_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL UNIQUE,
    bill_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0.00),
    discount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0.00),
    status ENUM('Pending', 'Paid', 'Partially Paid', 'Cancelled') DEFAULT 'Pending',
    FOREIGN KEY (appointment_id) REFERENCES Appointment(appointment_id) ON DELETE CASCADE
);
```

### TABLE 10: Payment
```sql
Payment(
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    utr VARCHAR(50) NOT NULL UNIQUE,
    method ENUM('UPI', 'Card', 'Net Banking') NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0.00),
    status ENUM('Success', 'Pending', 'Failed') DEFAULT 'Success',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES Bill(bill_id) ON DELETE CASCADE
);
```

---

## 4. Database Cardinalities & Relationships
1. **Patient to Appointment:** One-to-Many ($1:N$). A patient may have multiple historical and scheduled appointments.
2. **Doctor to Appointment:** One-to-Many ($1:N$). A doctor attends to multiple patient consultations.
3. **Doctor to Doctor_Phone:** One-to-Many ($1:N$). Supports multiple contact numbers per doctor with composite primary key `(doctor_id, phone_no)`.
4. **Doctor to Doctor_Availability:** One-to-Many ($1:N$). Doctor defines date and time blocks for booking.
5. **Appointment to Prescription:** One-to-One ($1:1$). Enforced by `appointment_id INT UNIQUE` in `Prescription`.
6. **Appointment to Bill:** One-to-One ($1:1$). Enforced by `appointment_id INT UNIQUE` in `Bill`.
7. **Prescription to Medicine:** Many-to-Many ($M:N$). Modeled through junction table `Prescription_Medicine` with dosage, frequency, and duration.
8. **Bill to Payment:** One-to-Many ($1:N$). Enables partial payments toward an outstanding invoice.

---

## 5. Advanced DBMS Features

### A. Stored Procedures
- `sp_book_appointment(p_patient_id, p_doctor_id, p_appt_date, OUT p_appointment_id, OUT p_status_code, OUT p_message)`: Atomically checks for scheduling conflicts, inserts appointment, and updates doctor availability slot status.
- `sp_generate_bill(p_appointment_id, p_discount, OUT p_bill_id, OUT p_total_amount, OUT p_status_code, OUT p_message)`: Retrieves doctor consult fee, aggregates prescribed medicine prices, applies discount, and generates/updates `Bill`.
- `sp_update_medicine_stock(p_medicine_id, p_quantity_change, OUT p_new_stock, OUT p_status_code, OUT p_message)`: Modifies pharmacy inventory with strict boundary checks preventing negative stock.

### B. SQL Functions
- `fn_calculate_patient_age(p_dob DATE) RETURNS INT`: Computes dynamic patient age in years using `TIMESTAMPDIFF(YEAR, p_dob, CURDATE())`.
- `fn_calculate_bill_total(p_amount DECIMAL(10,2), p_discount DECIMAL(10,2)) RETURNS DECIMAL(10,2)`: Deterministically calculates `GREATEST(0, amount - discount)`.

### C. SQL Triggers
- `trg_after_presc_med_insert`: Automatically decrements `Medicine.in_stock` when a medicine is prescribed to a patient.
- `trg_before_medicine_stock_check`: Throws SQLSTATE '45000' if an update attempts to drive `in_stock` below zero.
- `trg_after_appointment_cancelled`: Automatically releases the doctor availability slot back to 'Available' when an appointment is cancelled.

### D. Common Table Expressions (CTEs) & Window Functions
- **CTE 1:** Doctors Ranked by Consultation Volume using `DENSE_RANK() OVER (ORDER BY total_appointments DESC)`.
- **CTE 2:** Patient Prioritization & Total Spending using `ROW_NUMBER() OVER (ORDER BY total_visits DESC)`.
- **CTE 3:** Monthly Appointment Statistics, Realized Revenue, and Completion Rates.
- **CTE 4:** Medicine Demand Analysis & Critical Inventory Health Status.

---

## 6. Live ACID Transaction & Rollback Simulator (Feature #11)
Located under the **ACID Simulator** tab in the navigation bar:
- **Single Dedicated Connection:** Uses `getTransactionConnection()` to issue `START TRANSACTION`, run multiple insertions, and either execute `COMMIT` or `ROLLBACK`.
- **Mode 1 (Success):** Inserts Appointment $\rightarrow$ Inserts Bill $\rightarrow$ Inserts Payment $\rightarrow$ `COMMIT`. All records persist.
- **Mode 2 (Failure):** Inserts Appointment $\rightarrow$ Inserts Bill $\rightarrow$ Triggers controlled socket timeout / constraint failure $\rightarrow$ `ROLLBACK`.
- **Telemetry Verification:** Compares before vs. after row counts live from the database to prove zero ghost rows exist after rollback.

---

## 7. Faculty Demonstration & Viva Test Accounts

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin** | `admin@pes.edu` | `Password@123` | Full administrative control, inventory management, ACID demonstrator, MongoDB hub. |
| **Doctor** | `rajesh.sharma@pes.edu` | `Password@123` | Dr. Rajesh Sharma, MD (Cardiology). Prescribe medicines, manage slots. |
| **Patient** | `rohit.verma@gmail.com` | `Password@123` | Rohit Verma, Banashankari. Book visits, pay bills via simulated UPI, view lab results. |

*Quick Evaluator Mode:* Click any role button in the top navigation bar ("Test As: Admin / Doctor / Patient") for instantaneous 1-click authentication without typing!

---

## 8. Database Scripts Directory
All raw database scripts are structured in the repository:
```
database/
  mysql/
    schema.sql            # 10 Tables, Constraints, Foreign Keys & Indexes
    procedures.sql        # sp_book_appointment, sp_generate_bill, sp_update_medicine_stock
    functions.sql         # fn_calculate_patient_age, fn_calculate_bill_total
    triggers.sql          # Inventory triggers & cancellation slot release
    seed.sql              # Realistic seed data (12 patients, 8 doctors, 16 appointments, medicines)
    advanced_queries.sql  # CTEs, Window functions, Joins, Correlated subqueries
  mongodb/
    collections.js        # NoSQL collection validation & technology justification
    seed.js               # Polymorphic lab reports, patient reviews, audit logs
```
