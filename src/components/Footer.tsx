import React from 'react';
import { Database, ShieldCheck, FileSpreadsheet, GitBranch, Terminal } from 'lucide-react';

interface FooterProps {
  onOpenErDiagram: () => void;
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenErDiagram, onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Institution & Project */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm tracking-tight">
              PES University CSE Mini-Project
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Smart Healthcare &amp; Doctor Appointment Management System developed for the Database Management Systems (DBMS) Course evaluation.
            </p>
            <div className="text-[11px] text-slate-500 space-y-1">
              <div>Faculty Evaluation: Aug-Dec 2026</div>
              <div>Rubric: 50 Marks (DDL, DML, CTE, ACID, MongoDB)</div>
            </div>
          </div>

          {/* Column 2: RDBMS Core (MySQL) */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-sm tracking-tight flex items-center gap-1.5">
              <Database className="w-4 h-4 text-sky-400" />
              <span>MySQL Relational Core (85%)</span>
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>10 Normalized Relational Tables (InnoDB)</li>
              <li>Foreign Key Constraints &amp; Cascade Rules</li>
              <li>Stored Procedures (sp_book_appointment, sp_generate_bill)</li>
              <li>SQL Triggers (Inventory stock deduction)</li>
              <li>SQL Functions (fn_calculate_patient_age)</li>
              <li>Complex Joins &amp; Window CTE Queries</li>
            </ul>
          </div>

          {/* Column 3: NoSQL Document Store (MongoDB) */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-sm tracking-tight flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>MongoDB Collections (15%)</span>
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>Polymorphic Lab Reports (Dynamic JSON)</li>
              <li>Unstructured Patient Reviews &amp; Ratings</li>
              <li>Append-only Audit Logs &amp; Security Trail</li>
              <li>Full CRUD (Create, Read, Update, Delete)</li>
            </ul>
          </div>

          {/* Column 4: Quick Evaluation Links */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-sm tracking-tight">
              Live Evaluation Tools
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('acid_demo')}
                className="w-full text-left px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 font-medium transition-colors flex items-center justify-between"
              >
                <span>ACID Transaction Visualizer</span>
                <span className="text-[10px] bg-sky-900/50 text-sky-300 px-1.5 py-0.5 rounded">Live Demo</span>
              </button>
              <button
                onClick={() => onNavigate('query_lab')}
                className="w-full text-left px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-medium transition-colors flex items-center justify-between"
              >
                <span>DBMS Query Lab (CTEs &amp; Joins)</span>
                <span className="text-[10px] bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded">Live SQL</span>
              </button>
              <button
                onClick={onOpenErDiagram}
                className="w-full text-left px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
              >
                View 10-Table ER Diagram
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© 2026 PES University · Department of Computer Science and Engineering</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 font-mono">Status: Connected to MariaDB 10.11 &amp; MongoDB</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
