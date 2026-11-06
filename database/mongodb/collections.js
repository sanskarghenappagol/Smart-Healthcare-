/**
 * PES UNIVERSITY - DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
 * COURSE: DATABASE MANAGEMENT SYSTEMS (DBMS MINI-PROJECT)
 * FILE: collections.js (MongoDB Schema and Validation Rules)
 * 
 * Justification for MongoDB (NoSQL) alongside MySQL (RDBMS):
 * While MySQL handles 85% of structured transactional healthcare data (relational
 * integrity, ACID consistency, 10 foreign-key tables), MongoDB provides the ideal
 * flexible, semi-structured document store for:
 * 1. LabReports: Different medical tests (Complete Blood Count, Lipid Profile,
 *    Thyroid Function, Glycated Hemoglobin) possess radically distinct result
 *    structures and dynamic key-value parameters that cannot fit a rigid SQL table.
 * 2. PatientReviews: Flexible unstructured clinical feedback, star ratings, and tags.
 * 3. AuditLogs: Append-only polymorphic access logs capturing schema modifications,
 *    login events, and transaction operations.
 */

export const LabReportSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["report_id", "patient_id", "report_type", "uploaded_date", "test_results", "report_status"],
      properties: {
        report_id: { bsonType: "string", description: "Unique report identifier" },
        patient_id: { bsonType: "string", description: "Reference to Patient p_id" },
        appointment_id: { bsonType: ["int", "null"], description: "Optional reference to Appointment" },
        report_type: { bsonType: "string", description: "Type of test (CBC, Lipid, HbA1c, Thyroid, Urine)" },
        uploaded_date: { bsonType: "string", description: "ISO date string" },
        test_results: { bsonType: "object", description: "Dynamic JSON document holding test-specific biomarkers" },
        doctor_comments: { bsonType: ["string", "null"], description: "Clinical observation by consulting physician" },
        report_status: { enum: ["Normal", "Abnormal", "Critical", "Pending Review"], description: "Diagnostic status" },
        file_url: { bsonType: ["string", "null"], description: "URL or metadata pointer to PDF lab sheet" }
      }
    }
  }
};

export const PatientReviewSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["review_id", "patient_id", "doctor_id", "rating", "comment", "created_at"],
      properties: {
        review_id: { bsonType: "string" },
        patient_id: { bsonType: "string" },
        doctor_id: { bsonType: "string" },
        rating: { bsonType: "int", minimum: 1, maximum: 5 },
        comment: { bsonType: "string" },
        created_at: { bsonType: "string" }
      }
    }
  }
};

export const AuditLogSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["log_id", "user_id", "role", "action", "collection_or_table", "timestamp"],
      properties: {
        log_id: { bsonType: "string" },
        user_id: { bsonType: "string" },
        role: { bsonType: "string" },
        action: { enum: ["INSERT", "UPDATE", "DELETE", "LOGIN", "TRANSACTION_COMMIT", "TRANSACTION_ROLLBACK", "READ"] },
        collection_or_table: { bsonType: "string" },
        record_id: { bsonType: ["string", "int", "null"] },
        timestamp: { bsonType: "string" },
        additional_details: { bsonType: ["object", "string", "null"] }
      }
    }
  }
};
