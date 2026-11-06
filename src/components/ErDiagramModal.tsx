import React from 'react';
import { X, Key, Link2, Database, Layers, CheckCircle } from 'lucide-react';

interface ErDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ErDiagramModal: React.FC<ErDiagramModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-sky-600" />
              <span>PES University · 10-Table Relational Schema &amp; ER Architecture</span>
            </h2>
            <p className="text-xs text-slate-500">
              Department of Computer Science &amp; Engineering · DBMS Mini-Project Evaluation Criteria #1 &amp; #2
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Legend & Relational Rules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-sky-50/60 border border-sky-100 rounded-xl text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-500 shrink-0"></span>
              <span><strong>PK:</strong> Primary Key</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-sky-500 shrink-0"></span>
              <span><strong>FK:</strong> Foreign Key with Referential Integrity</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-500 shrink-0"></span>
              <span><strong>Dynamic Age:</strong> Derived via fn_calculate_patient_age(dob)</span>
            </div>
          </div>

          {/* Relational Tables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Table 1: Patient */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="px-3 py-2 bg-slate-900 text-white font-bold text-xs flex items-center justify-between">
                <span>1. Patient</span>
                <span className="text-[10px] bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded">InnoDB</span>
              </div>
              <div className="p-3 space-y-1 font-mono text-[11px] divide-y divide-slate-100">
                <div className="text-amber-700 font-bold flex items-center justify-between py-0.5">
                  <span>p_id VARCHAR(20)</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded">PK</span>
                </div>
                <div className="text-slate-700 py-0.5">f_name VARCHAR(50) NOT NULL</div>
                <div className="text-slate-700 py-0.5">l_name VARCHAR(50) NOT NULL</div>
                <div className="text-slate-700 py-0.5 flex items-center justify-between">
                  <span>email VARCHAR(100)</span>
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded">UNIQUE</span>
                </div>
                <div className="text-slate-700 py-0.5">gender ENUM('Male','Female')</div>
                <div className="text-slate-700 py-0.5">blood_group VARCHAR(5)</div>
                <div className="text-emerald-700 font-medium py-0.5 flex items-center justify-between">
                  <span>dob DATE NOT NULL</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded">No Age Col!</span>
                </div>
                <div className="text-slate-500 py-0.5">street, city, pincode</div>
              </div>
            </div>

            {/* Table 2: Doctor */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="px-3 py-2 bg-slate-900 text-white font-bold text-xs flex items-center justify-between">
                <span>2. Doctor</span>
                <span className="text-[10px] bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded">InnoDB</span>
              </div>
              <div className="p-3 space-y-1 font-mono text-[11px] divide-y divide-slate-100">
                <div className="text-amber-700 font-bold flex items-center justify-between py-0.5">
                  <span>id VARCHAR(20)</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded">PK</span>
                </div>
                <div className="text-slate-700 py-0.5">f_name, l_name VARCHAR(50)</div>
                <div className="text-slate-700 py-0.5 flex items-center justify-between">
                  <span>email VARCHAR(100)</span>
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded">UNIQUE</span>
                </div>
                <div className="text-slate-700 py-0.5">qualification VARCHAR(100)</div>
                <div className="text-slate-700 py-0.5">experience INT CHECK (&gt;=0)</div>
                <div className="text-slate-700 py-0.5">consult_fee DECIMAL(10,2)</div>
                <div className="text-slate-500 py-0.5">city, pincode, status</div>
              </div>
            </div>

            {/* Table 3: Doctor_Phone */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="px-3 py-2 bg-slate-900 text-white font-bold text-xs flex items-center justify-between">
                <span>3. Doctor_Phone</span>
                <span className="text-[10px] bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded">1-to-N</span>
              </div>
              <div className="p-3 space-y-1 font-mono text-[11px] divide-y divide-slate-100">
                <div className="text-amber-700 font-bold flex items-center justify-between py-0.5">
                  <span>doctor_id VARCHAR(20)</span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-1 rounded">PK / FK</span>
                </div>
                <div className="text-amber-700 font-bold flex items-center justify-between py-0.5">
                  <span>phone_no VARCHAR(20)</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded">PK</span>
                </div>
                <div className="text-slate-500 text-[10px] pt-1">
                  Composite Primary Key (doctor_id, phone_no). References Doctor(id) CASCADE.
                </div>
              </div>
            </div>

            {/* Table 4: Doctor_Availability */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="px-3 py-2 bg-slate-900 text-white font-bold text-xs flex items-center justify-between">
                <span>4. Doctor_Availability</span>
                <span className="text-[10px] bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded">1-to-N</span>
              </div>
              <div className="p-3 space-y-1 font-mono text-[11px] divide-y divide-slate-100">
                <div className="text-amber-700 font-bold flex items-center justify-between py-0.5">
                  <span>availability_id INT</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded">PK (AI)</span>
                </div>
                <div className="text-sky-700 py-0.5 flex items-center justify-between">
                  <span>doctor_id VARCHAR(20)</span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-1 rounded">FK</span>
                </div>
                <div className="text-slate-700 py-0.5">date DATE NOT NULL</div>
                <div className="text-slate-700 py-0.5">st_time, end_time TIME</div>
                <div className="text-slate-700 py-0.5">status ENUM('Available','Booked')</div>
              </div>
            </div>

            {/* Table 5: Appointment */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="px-3 py-2 bg-slate-900 text-white font-bold text-xs flex items-center justify-between">
                <span>5. Appointment</span>
                <span className="text-[10px] bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded">Hub Table</span>
              </div>
              <div className="p-3 space-y-1 font-mono text-[11px] divide-y divide-slate-100">
                <div className="text-amber-700 font-bold flex items-center justify-between py-0.5">
                  <span>appointment_id INT</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded">PK (AI)</span>
                </div>
                <div className="text-sky-700 py-0.5 flex items-center justify-between">
                  <span>p_id VARCHAR(20)</span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-1 rounded">FK Patient</span>
                </div>
                <div className="text-sky-700 py-0.5 flex items-center justify-between">
                  <span>doctor_id VARCHAR(20)</span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-1 rounded">FK Doctor</span>
                </div>
                <div className="text-slate-700 py-0.5">appointment_date DATETIME</div>
                <div className="text-slate-700 py-0.5">status ENUM('Scheduled','Completed'..)</div>
              </div>
            </div>

            {/* Table 6: Prescription */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="px-3 py-2 bg-slate-900 text-white font-bold text-xs flex items-center justify-between">
                <span>6. Prescription</span>
                <span className="text-[10px] bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded">1-to-1</span>
              </div>
              <div className="p-3 space-y-1 font-mono text-[11px] divide-y divide-slate-100">
                <div className="text-amber-700 font-bold flex items-center justify-between py-0.5">
                  <span>pers_id INT</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded">PK (AI)</span>
                </div>
                <div className="text-sky-700 font-semibold py-0.5 flex items-center justify-between">
                  <span>appointment_id INT</span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-1 rounded">UNIQUE FK</span>
                </div>
                <div className="text-slate-700 py-0.5">symptoms TEXT</div>
                <div className="text-slate-700 py-0.5">diagnosis TEXT</div>
                <div className="text-slate-700 py-0.5">prescribed_date, follow_up_date</div>
              </div>
            </div>

            {/* Table 7: Medicine */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="px-3 py-2 bg-slate-900 text-white font-bold text-xs flex items-center justify-between">
                <span>7. Medicine</span>
                <span className="text-[10px] bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded">Inventory</span>
              </div>
              <div className="p-3 space-y-1 font-mono text-[11px] divide-y divide-slate-100">
                <div className="text-amber-700 font-bold flex items-center justify-between py-0.5">
                  <span>id INT</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded">PK (AI)</span>
                </div>
                <div className="text-slate-700 py-0.5">name VARCHAR(100) NOT NULL</div>
                <div className="text-slate-700 py-0.5">category VARCHAR(50)</div>
                <div className="text-slate-700 py-0.5">price DECIMAL(10,2)</div>
                <div className="text-emerald-700 font-medium py-0.5 flex items-center justify-between">
                  <span>in_stock INT</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded">CHECK &gt;= 0</span>
                </div>
              </div>
            </div>

            {/* Table 8: Prescription_Medicine */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="px-3 py-2 bg-slate-900 text-white font-bold text-xs flex items-center justify-between">
                <span>8. Prescription_Medicine</span>
                <span className="text-[10px] bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded">M-to-N Junction</span>
              </div>
              <div className="p-3 space-y-1 font-mono text-[11px] divide-y divide-slate-100">
                <div className="text-amber-700 font-bold flex items-center justify-between py-0.5">
                  <span>pers_id INT</span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-1 rounded">PK / FK</span>
                </div>
                <div className="text-amber-700 font-bold flex items-center justify-between py-0.5">
                  <span>medicine_id INT</span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-1 rounded">PK / FK</span>
                </div>
                <div className="text-slate-700 py-0.5">dosage VARCHAR(50)</div>
                <div className="text-slate-700 py-0.5">frequency, duration_days</div>
                <div className="text-slate-700 py-0.5">instruction VARCHAR(255)</div>
              </div>
            </div>

            {/* Table 9: Bill */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="px-3 py-2 bg-slate-900 text-white font-bold text-xs flex items-center justify-between">
                <span>9. Bill</span>
                <span className="text-[10px] bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded">1-to-1</span>
              </div>
              <div className="p-3 space-y-1 font-mono text-[11px] divide-y divide-slate-100">
                <div className="text-amber-700 font-bold flex items-center justify-between py-0.5">
                  <span>bill_id INT</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded">PK (AI)</span>
                </div>
                <div className="text-sky-700 font-semibold py-0.5 flex items-center justify-between">
                  <span>appointment_id INT</span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-1 rounded">UNIQUE FK</span>
                </div>
                <div className="text-slate-700 py-0.5">bill_date DATE</div>
                <div className="text-slate-700 py-0.5">amount, discount DECIMAL(10,2)</div>
                <div className="text-slate-700 py-0.5">status ENUM('Pending','Paid'..)</div>
              </div>
            </div>

            {/* Table 10: Payment */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="px-3 py-2 bg-slate-900 text-white font-bold text-xs flex items-center justify-between">
                <span>10. Payment</span>
                <span className="text-[10px] bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded">1-to-N with Bill</span>
              </div>
              <div className="p-3 space-y-1 font-mono text-[11px] divide-y divide-slate-100">
                <div className="text-amber-700 font-bold flex items-center justify-between py-0.5">
                  <span>payment_id INT</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded">PK (AI)</span>
                </div>
                <div className="text-sky-700 py-0.5 flex items-center justify-between">
                  <span>bill_id INT</span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-1 rounded">FK Bill</span>
                </div>
                <div className="text-slate-700 py-0.5 flex items-center justify-between">
                  <span>utr VARCHAR(50)</span>
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded">UNIQUE</span>
                </div>
                <div className="text-slate-700 py-0.5">method ENUM('UPI','Card'..)</div>
                <div className="text-slate-700 py-0.5">amount DECIMAL(10,2), status</div>
              </div>
            </div>

            {/* MongoDB Document Store Card */}
            <div className="border border-emerald-300 rounded-xl overflow-hidden bg-emerald-50/40 shadow-xs md:col-span-2">
              <div className="px-3 py-2 bg-emerald-900 text-white font-bold text-xs flex items-center justify-between">
                <span>MongoDB Collections (NoSQL 15%)</span>
                <span className="text-[10px] bg-emerald-800 text-emerald-200 px-1.5 py-0.5 rounded">Polymorphic Docs</span>
              </div>
              <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
                <div className="space-y-1">
                  <strong className="text-emerald-950 font-sans block text-xs">1. LabReports</strong>
                  <div className="text-slate-600">report_id, patient_id</div>
                  <div className="text-emerald-700 font-bold">test_results: JSON (dynamic)</div>
                  <div className="text-slate-500">CBC, Lipid, HbA1c, Thyroid</div>
                </div>
                <div className="space-y-1">
                  <strong className="text-emerald-950 font-sans block text-xs">2. PatientReviews</strong>
                  <div className="text-slate-600">review_id, patient_id, doctor_id</div>
                  <div className="text-slate-600">rating (1-5), comment, date</div>
                </div>
                <div className="space-y-1">
                  <strong className="text-emerald-950 font-sans block text-xs">3. AuditLogs</strong>
                  <div className="text-slate-600">log_id, user_id, role, action</div>
                  <div className="text-slate-600">collection_or_table, details</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-2xl">
          <span className="text-[11px] text-slate-500">
            PES University Department of CSE · Full Relational Normalization (3NF &amp; BCNF)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close Schema Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
