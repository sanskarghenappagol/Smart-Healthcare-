import React, { useState, useEffect } from 'react';
import { Doctor } from '../types';
import { api } from '../lib/api';
import {
  Stethoscope, Calendar, ShieldCheck, Database, Terminal, Search, Clock,
  ArrowRight, CheckCircle2, FileText, ChevronRight, Sparkles, Building, Layers, FileSpreadsheet
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: () => void;
  onSwitchDemo: (role: 'admin' | 'doctor' | 'patient') => void;
  onNavigateToDoctors: () => void;
  onNavigateToTab: (tab: string) => void;
  onOpenErDiagram: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onSwitchDemo,
  onNavigateToDoctors,
  onNavigateToTab,
  onOpenErDiagram
}) => {
  const [featuredDoctors, setFeaturedDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    api.getDoctors().then(docs => {
      setFeaturedDoctors(docs.slice(0, 6));
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-16 py-8">
      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-b from-sky-50/60 to-white border border-sky-100 rounded-3xl p-8 sm:p-12 shadow-sm text-center space-y-6">
          {/* Institutional Credential Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-100/80 text-sky-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-sky-600"></span>
            <span>PES University · Department of Computer Science &amp; Engineering</span>
            <span className="text-slate-400">·</span>
            <span>DBMS Mini-Project 2026</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight" style={{ textWrap: 'balance' }}>
            Smart Healthcare &amp; Doctor Appointment Management System
          </h1>

          <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A complete, production-grade full-stack healthcare platform engineered with a normalized 10-table MySQL relational core, MongoDB polymorphic document store, stored procedures, triggers, CTEs, and a real ACID transaction visualizer.
          </p>

          {/* Quick Evaluator Access Bar */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm max-w-2xl mx-auto space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>Faculty Evaluation Quick Launcher (1-Click Test Accounts):</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Aug-Dec 2026</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => onSwitchDemo('admin')}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-center shadow-xs transition-colors flex flex-col items-center"
              >
                <span>Launch as Admin</span>
                <span className="text-[10px] text-sky-300 font-normal">Full Hospital Control &amp; ACID</span>
              </button>
              <button
                onClick={() => onSwitchDemo('doctor')}
                className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-center shadow-xs transition-colors flex flex-col items-center"
              >
                <span>Launch as Doctor</span>
                <span className="text-[10px] text-sky-100 font-normal">Dr. Rajesh Sharma (Cardiology)</span>
              </button>
              <button
                onClick={() => onSwitchDemo('patient')}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center shadow-xs transition-colors flex flex-col items-center"
              >
                <span>Launch as Patient</span>
                <span className="text-[10px] text-emerald-100 font-normal">Rohit Verma (Booking &amp; Pay)</span>
              </button>
            </div>
          </div>

          {/* Core Technical Highlights Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-4 text-xs font-mono">
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <strong className="text-base text-slate-900 block font-bold">10 Tables</strong>
              <span className="text-[11px] text-slate-500 font-sans">MySQL Relational Schema</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <strong className="text-base text-sky-600 block font-bold">3 SPs + Triggers</strong>
              <span className="text-[11px] text-slate-500 font-sans">Automated Stock &amp; Bills</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <strong className="text-base text-emerald-600 block font-bold">Live ACID Engine</strong>
              <span className="text-[11px] text-slate-500 font-sans">Single-Conn Rollback Demo</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <strong className="text-base text-purple-600 block font-bold">MongoDB NoSQL</strong>
              <span className="text-[11px] text-slate-500 font-sans">Flexible Lab &amp; Audit Docs</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LIVE DOCTOR AVAILABILITY BROWSER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider block">
              Patient Scheduling
            </span>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Browse Available Specialists &amp; Book Consultations
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Doctors, consultation fees, and real-time open slots managed in <code>Doctor_Availability</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToDoctors}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>View All 8 Specialists</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Doctor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredDoctors.map(doctor => (
            <div
              key={doctor.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-sky-300 transition-all space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Dr. {doctor.f_name} {doctor.l_name}
                    </h3>
                    <span className="text-xs font-medium text-sky-700 block">
                      {doctor.qualification}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 font-mono">
                    {doctor.experience} Yrs Exp
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Consultation Fee:</span>
                    <strong className="text-slate-900 font-mono font-bold">Rs. {doctor.consult_fee}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span>{doctor.city} ({doctor.pincode})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Doctor ID:</span>
                    <span className="font-mono">{doctor.id}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  {doctor.available_slots ? `${doctor.available_slots.length} open slots` : 'Available for booking'}
                </span>
                <button
                  onClick={onNavigateToDoctors}
                  className="px-3.5 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold text-xs transition-colors"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FOUR-STEP CLINICAL WORKFLOW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-sm space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block">
              End-to-End Clinical Lifecycle
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              How the System Preserves Relational Integrity
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every stage maps to specific constraints, foreign keys, stored procedures, and triggers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-sky-600/30 text-sky-400 flex items-center justify-center font-bold text-sm font-mono">
                01
              </div>
              <h3 className="text-sm font-bold">1. Slot Reservation</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Patient selects a time slot. Stored procedure <code>sp_book_appointment</code> verifies absence of conflicting bookings, inserts the row, and updates slot status atomically.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-sky-600/30 text-sky-400 flex items-center justify-center font-bold text-sm font-mono">
                02
              </div>
              <h3 className="text-sm font-bold">2. Clinical Consultation</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Doctor reviews patient records and records symptoms and diagnosis in table <code>Prescription</code> (enforcing 1-to-1 uniqueness with Appointment).
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-sky-600/30 text-sky-400 flex items-center justify-center font-bold text-sm font-mono">
                03
              </div>
              <h3 className="text-sm font-bold">3. Medicine Dispensing</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Medicines added to junction table <code>Prescription_Medicine</code> trigger inventory deductions and automatic bill generation via <code>sp_generate_bill</code>.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-sky-600/30 text-sky-400 flex items-center justify-center font-bold text-sm font-mono">
                04
              </div>
              <h3 className="text-sm font-bold">4. Simulated Payment</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Patient settles bill using simulated UPI, Card, or Net Banking. Payment is logged in table <code>Payment</code> with unique UTR, and Bill status becomes Paid.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TECHNOLOGY JUSTIFICATION: MYSQL 85% vs MONGODB 15% */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider block">
            Dual-Database Architecture
          </span>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Why MySQL (RDBMS) alongside MongoDB (NoSQL)?
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            PES University evaluation criterion: "Technology justification (1 mark)"
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* MySQL Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm">MySQL Relational Engine (85%)</h3>
              </div>
              <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full">
                Structured &amp; ACID
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Healthcare scheduling, billing, and pharmacy operations demand strict referential integrity, foreign key cascading, and ACID consistency:
            </p>

            <ul className="space-y-2 text-xs text-slate-700 font-mono">
              <li className="flex items-start gap-2">
                <span className="text-sky-600">✓</span>
                <span><strong>10 Normalized Tables:</strong> 3NF and BCNF compliant relational schema.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-600">✓</span>
                <span><strong>Single-Connection ACID:</strong> Atomicity guarantees zero orphaned appointments or bills.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-600">✓</span>
                <span><strong>Integrity Triggers:</strong> Hardware stock checked and decremented safely.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-600">✓</span>
                <span><strong>Complex Analytical Queries:</strong> Window ranking functions and CTEs.</span>
              </li>
            </ul>
          </div>

          {/* MongoDB Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">MongoDB Document Store (15%)</h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                Polymorphic &amp; Flexible
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Clinical diagnostic reports, patient feedback, and security audit logs are semi-structured or polymorphic by nature:
            </p>

            <ul className="space-y-2 text-xs text-slate-700 font-mono">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600">✓</span>
                <span><strong>Dynamic Lab Biomarkers:</strong> CBC blood tests, Lipid profiles, Thyroid panels, and MRI text have completely different field structures.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600">✓</span>
                <span><strong>Unstructured Feedback:</strong> Flexible patient doctor reviews with star ratings and comments.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600">✓</span>
                <span><strong>Append-Only Audit Trail:</strong> High-throughput polymorphic security and operational event logs.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. PES UNIVERSITY RUBRIC SUMMARY (50 MARKS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-bold text-slate-900 text-sm">
                PES University CSE Experiential Learning Level 3 MiniProject Rubric
              </h3>
              <p className="text-xs text-slate-500">
                Evaluation Criteria (50 Marks) — All components fully implemented and verifiable in this application
              </p>
            </div>
            <button
              onClick={onOpenErDiagram}
              className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Inspect ER Schema
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Item 1 (5 Marks)</span>
              <strong className="text-slate-900 block text-xs">Database Design</strong>
              <span className="text-[11px] text-emerald-600 font-medium">10 Tables + Constraints</span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Item 2 (9 Marks)</span>
              <strong className="text-slate-900 block text-xs">Creation &amp; NoSQL</strong>
              <span className="text-[11px] text-emerald-600 font-medium">DDL + MongoDB</span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Item 3 (8 Marks)</span>
              <strong className="text-slate-900 block text-xs">SQL &amp; Joins</strong>
              <span className="text-[11px] text-emerald-600 font-medium">Nested &amp; Joins</span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Item 4 (13 Marks)</span>
              <strong className="text-slate-900 block text-xs">Advanced DBMS</strong>
              <span className="text-[11px] text-emerald-600 font-medium">SP, Trigger, CTE, RUD</span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Item 5 (5 Marks)</span>
              <strong className="text-slate-900 block text-xs">Web Interface</strong>
              <span className="text-[11px] text-emerald-600 font-medium">React + REST APIs</span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Item 6 (4 Marks)</span>
              <strong className="text-slate-900 block text-xs">Auth &amp; RBAC</strong>
              <span className="text-[11px] text-emerald-600 font-medium">3 Database Roles</span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Item 7 (6 Marks)</span>
              <strong className="text-slate-900 block text-xs">Testing &amp; Viva</strong>
              <span className="text-[11px] text-emerald-600 font-medium">ACID Simulator</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
