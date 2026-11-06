import fs from 'fs';
import path from 'path';
import { sampleLabReports, samplePatientReviews, sampleAuditLogs } from '../../database/mongodb/seed.js';

const DATA_FILE = path.resolve('database/mongodb/data.json');

interface MongoStorage {
  lab_reports: any[];
  patient_reviews: any[];
  audit_logs: any[];
}

let memoryStorage: MongoStorage = {
  lab_reports: [],
  patient_reviews: [],
  audit_logs: []
};

function ensureInitialized() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      memoryStorage = JSON.parse(content);
    } else {
      memoryStorage = {
        lab_reports: [...sampleLabReports],
        patient_reviews: [...samplePatientReviews],
        audit_logs: [...sampleAuditLogs]
      };
      saveToDisk();
    }
  } catch (err) {
    console.error('Error reading MongoDB local storage:', err);
    memoryStorage = {
      lab_reports: [...sampleLabReports],
      patient_reviews: [...samplePatientReviews],
      audit_logs: [...sampleAuditLogs]
    };
  }
}

function saveToDisk() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryStorage, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving MongoDB local storage to disk:', err);
  }
}

// Ensure loaded at module import
ensureInitialized();

/**
 * MongoDB-compatible Collection class
 */
class MongoCollection {
  private collectionName: keyof MongoStorage;

  constructor(collectionName: keyof MongoStorage) {
    this.collectionName = collectionName;
  }

  async find(filter: Record<string, any> = {}): Promise<any[]> {
    ensureInitialized();
    const items = memoryStorage[this.collectionName] || [];
    return items.filter(item => {
      for (const [key, val] of Object.entries(filter)) {
        if (item[key] !== val) return false;
      }
      return true;
    });
  }

  async findOne(filter: Record<string, any>): Promise<any | null> {
    const results = await this.find(filter);
    return results.length > 0 ? results[0] : null;
  }

  async insertOne(doc: Record<string, any>): Promise<{ insertedId: string; acknowledged: boolean }> {
    ensureInitialized();
    const docWithId = { ...doc };
    if (!docWithId._id) {
      docWithId._id = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }
    memoryStorage[this.collectionName].unshift(docWithId);
    saveToDisk();
    return { insertedId: docWithId._id, acknowledged: true };
  }

  async updateOne(filter: Record<string, any>, update: { $set?: Record<string, any> }): Promise<{ modifiedCount: number }> {
    ensureInitialized();
    const items = memoryStorage[this.collectionName] || [];
    let modifiedCount = 0;
    for (let i = 0; i < items.length; i++) {
      let match = true;
      for (const [k, v] of Object.entries(filter)) {
        if (items[i][k] !== v) {
          match = false;
          break;
        }
      }
      if (match) {
        if (update.$set) {
          items[i] = { ...items[i], ...update.$set, updated_at: new Date().toISOString() };
        }
        modifiedCount++;
        break;
      }
    }
    if (modifiedCount > 0) {
      saveToDisk();
    }
    return { modifiedCount };
  }

  async deleteOne(filter: Record<string, any>): Promise<{ deletedCount: number }> {
    ensureInitialized();
    const items = memoryStorage[this.collectionName] || [];
    const initialLength = items.length;
    memoryStorage[this.collectionName] = items.filter(item => {
      for (const [k, v] of Object.entries(filter)) {
        if (item[k] === v) return false;
      }
      return true;
    });
    const deletedCount = initialLength - memoryStorage[this.collectionName].length;
    if (deletedCount > 0) {
      saveToDisk();
    }
    return { deletedCount };
  }

  async countDocuments(filter: Record<string, any> = {}): Promise<number> {
    const results = await this.find(filter);
    return results.length;
  }
}

export const labReportsCollection = new MongoCollection('lab_reports');
export const patientReviewsCollection = new MongoCollection('patient_reviews');
export const auditLogsCollection = new MongoCollection('audit_logs');

/**
 * Helper to record an audit log in MongoDB
 */
export async function logAuditEvent(
  userId: string,
  role: string,
  action: string,
  target: string,
  recordId: any,
  details: any = null
) {
  try {
    await auditLogsCollection.insertOne({
      log_id: 'AUD-' + Date.now(),
      user_id: userId,
      role,
      action,
      collection_or_table: target,
      record_id: recordId,
      timestamp: new Date().toISOString(),
      additional_details: details
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}
