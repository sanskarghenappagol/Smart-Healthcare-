import React, { useState, useEffect } from 'react';
import { User, Patient, Doctor, Appointment, Medicine, Bill, LabReport, AuditLog } from '../types';
import { api } from '../lib/api';
import { AcidSimulator } from './AcidSimulator';
import { DbmsQueryLab } from './DbmsQueryLab';
import { LabReportModal } from './LabReportModal';
import {
  Users, Stethoscope, Calendar, Pill, Receipt, Database, Terminal, FileSpreadsheet,
  Plus, Search, Edit2, Trash2, CheckCircle2, AlertTriangle, RefreshCw, Layers, ShieldCheck
} from 'lucide-react';

interface AdminPortalProps {
  currentUser: User;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'patients' | 'doctors' | 'appointments' | 'medicines' | 'billing' | 'mongodb' | 'acid' | 'queries'
  >('overview');

  const [stats, setStats] = useState<any>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // New Doctor Modal/Form State
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [docFName, setDocFName] = useState('');
  const [docLName, setDocLName] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docQual, setDocQual] = useState('MBBS, MD');
  const [docExp, setDocExp] = useState(10);
  const [docFee, setDocFee] = useState(600);
  const [docCity, setDocCity] = useState('Bengaluru');
  const [docPincode, setDocPincode] = useState('560085');
  const [docPhones, setDocPhones] = useState('+91 9845012399');

  // New Medicine Form State
  const [showAddMed, setShowAddMed] = useState(false);
  const [medName, setMedName] = useState('');
  const [medCategory, setMedCategory] = useState('Antibiotic');
  const [medPrice, setMedPrice] = useState(80);
  const [medStock, setMedStock] = useState(100);

  // Stock Adjust Modal
  const [selectedMedForStock, setSelectedMedForStock] = useState<Medicine | null>(null);
  const [stockDelta, setStockDelta] = useState<number>(10);

  // Lab Report Modal
  const [selectedLabReport, setSelectedLabReport] = useState<LabReport | null>(null);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [st, pts, dcs, apts, mds, bls, lbs, auds] = await Promise.all([
        api.getOverviewStats(),
        api.getPatients(),
        api.getDoctors(),
        api.getAppointments(),
        api.getMedicines(),
        api.getBills(),
        api.getLabReports(),
        api.getAuditLogs()
      ]);

      setStats(st);
      setPatients(pts);
      setDoctors(dcs);
      setAppointments(apts);
      setMedicines(mds);
      setBills(bls);
      setLabReports(lbs);
      setAuditLogs(auds);
    } catch (err: any) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDoctor({
        f_name: docFName,
        l_name: docLName,
        email: docEmail,
        qualification: docQual,
        experience: Number(docExp),
        consult_fee: Number(docFee),
        city: docCity,
        pincode: docPincode,
        phone_numbers: docPhones.split(',').map(s => s.trim()).filter(Boolean)
      });
      setShowAddDoctor(false);
      setActionMsg('New Doctor account created with Doctor_Phone records.');
      loadAll();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to create doctor.');
    }
  };

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMedicine({
        name: medName,
        category: medCategory,
        price: Number(medPrice),
        in_stock: Number(medStock)
      });
      setShowAddMed(false);
      setActionMsg('New medicine added to pharmacy inventory.');
      loadAll();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to create medicine.');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedForStock) return;
    try {
      await api.adjustStock(selectedMedForStock.id, Number(stockDelta));
      setSelectedMedForStock(null);
      setActionMsg('Stock updated via stored procedure sp_update_medicine_stock.');
      loadAll();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Stock adjustment failed.');
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (!confirm(`Delete patient ${id}? This cascades to appointments & bills.`)) return;
    try {
      await api.deletePatient(id);
      setActionMsg(`Patient ${id} deleted.`);
      loadAll();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete patient.');
    }
  };

  const handleDeleteLabReport = async (reportId: string) => {
    if (!confirm(`Delete MongoDB lab report ${reportId}?`)) return;
    try {
      await api.deleteLabReport(reportId);
      setActionMsg(`MongoDB document ${reportId} removed.`);
      loadAll();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete report.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block">
            Administrative Control Hub · PES University DBMS Evaluation
          </span>
          <h1 className="text-xl font-bold tracking-tight mt-1">
            Hospital System Administration &amp; Database Governance
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            10-Table MySQL Relational Schema · MongoDB NoSQL Collections · Stored Procedures &amp; Triggers · Real ACID Simulator
          </p>
        </div>

        <button
          onClick={loadAll}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Live Tables</span>
        </button>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Main Administrative Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'overview' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          System Overview
        </button>
        <button
          onClick={() => setActiveTab('patients')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
            activeTab === 'patients' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Patients ({patients.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('doctors')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
            activeTab === 'doctors' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Doctors ({doctors.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
            activeTab === 'appointments' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Appointments ({appointments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('medicines')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
            activeTab === 'medicines' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Pill className="w-3.5 h-3.5" />
          <span>Medicines ({medicines.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
            activeTab === 'billing' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Billing &amp; Revenue ({bills.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('mongodb')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
            activeTab === 'mongodb' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>MongoDB Hub ({labReports.length + auditLogs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('acid')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
            activeTab === 'acid' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-sky-600" />
          <span>ACID Simulator</span>
        </button>
        <button
          onClick={() => setActiveTab('queries')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
            activeTab === 'queries' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-600" />
          <span>DBMS Query Lab</span>
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Matrix */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Patients</span>
              <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
                {stats?.totalPatients ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Dynamic age derived via DOB</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Practicing Doctors</span>
              <span className="text-2xl font-bold font-mono text-sky-700 mt-1 block">
                {stats?.totalDoctors ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Across 8 medical specialties</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Hospital Revenue</span>
              <span className="text-2xl font-bold font-mono text-emerald-700 mt-1 block">
                Rs. {stats?.totalRevenue ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Collected via UPI &amp; Cards</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Low Stock Alerts</span>
              <span className="text-2xl font-bold font-mono text-amber-700 mt-1 block">
                {stats?.lowStockMedicines ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Inventory &le; 50 units</span>
            </div>
          </div>

          {/* Quick Shortcuts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              onClick={() => setActiveTab('acid')}
              className="bg-gradient-to-br from-slate-900 to-sky-950 text-white rounded-xl p-5 shadow-xs cursor-pointer hover:border-sky-400 border border-transparent transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <Database className="w-6 h-6 text-sky-400" />
                <span className="text-[10px] bg-sky-500/20 text-sky-300 font-bold px-2 py-0.5 rounded">
                  Viva Feature #11
                </span>
              </div>
              <h3 className="font-bold text-sm">ACID Transaction &amp; Rollback Simulator</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Test real-time COMMIT and controlled failure with ROLLBACK on a single connection. Observe before vs. after row counts.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('queries')}
              className="bg-slate-900 text-white rounded-xl p-5 shadow-xs cursor-pointer hover:border-emerald-400 border border-transparent transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <Terminal className="w-6 h-6 text-emerald-400" />
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded">
                  Viva Feature #10
                </span>
              </div>
              <h3 className="font-bold text-sm">DBMS Query Lab (CTEs &amp; Joins)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Execute live CTE queries with DENSE_RANK(), multi-table relational joins, correlated subqueries, and deterministic SQL functions.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('mongodb')}
              className="bg-slate-900 text-white rounded-xl p-5 shadow-xs cursor-pointer hover:border-purple-400 border border-transparent transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <FileSpreadsheet className="w-6 h-6 text-purple-400" />
                <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded">
                  NoSQL 15%
                </span>
              </div>
              <h3 className="font-bold text-sm">MongoDB Polymorphic Documents</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Inspect dynamic semi-structured LabReports, PatientReviews, and Security AuditLogs with full CRUD capabilities.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PATIENTS TAB */}
      {activeTab === 'patients' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-4 p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-xs">
                Patient Records (Table 1: Patient · No Age Column, Derived via DOB)
              </h3>
              <p className="text-[11px] text-slate-500">
                Age dynamically computed using <code>fn_calculate_patient_age(p.dob)</code>
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Patient ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Gender / Blood</th>
                  <th className="py-2.5 px-3">DOB</th>
                  <th className="py-2.5 px-3">Dynamic Age</th>
                  <th className="py-2.5 px-3">City / Pin</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {patients.map(p => (
                  <tr key={p.p_id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-bold text-slate-800">{p.p_id}</td>
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-900">{p.f_name} {p.l_name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{p.email}</td>
                    <td className="py-2.5 px-3 font-sans">{p.gender} · <strong className="text-slate-800">{p.blood_group}</strong></td>
                    <td className="py-2.5 px-3 text-slate-600">{p.dob}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">{p.age} yrs</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600">{p.city} ({p.pincode})</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleDeletePatient(p.p_id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Delete patient"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DOCTORS TAB */}
      {activeTab === 'doctors' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-4 p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-xs">
                Doctor Registry (Table 2: Doctor &amp; Table 3: Doctor_Phone)
              </h3>
              <p className="text-[11px] text-slate-500">1-to-Many phone relationships</p>
            </div>
            <button
              onClick={() => setShowAddDoctor(!showAddDoctor)}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Doctor</span>
            </button>
          </div>

          {showAddDoctor && (
            <form onSubmit={handleCreateDoctor} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
              <h4 className="font-bold text-slate-900">Register New Doctor Account</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="First Name"
                  value={docFName}
                  onChange={e => setDocFName(e.target.value)}
                  className="border border-slate-300 rounded-lg p-2 bg-white"
                />
                <input
                  type="text"
                  required
                  placeholder="Last Name"
                  value={docLName}
                  onChange={e => setDocLName(e.target.value)}
                  className="border border-slate-300 rounded-lg p-2 bg-white"
                />
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={docEmail}
                  onChange={e => setDocEmail(e.target.value)}
                  className="border border-slate-300 rounded-lg p-2 bg-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Qualification e.g. MBBS, MD (Cardiology)"
                  value={docQual}
                  onChange={e => setDocQual(e.target.value)}
                  className="border border-slate-300 rounded-lg p-2 bg-white"
                />
                <input
                  type="number"
                  placeholder="Experience (Yrs)"
                  value={docExp}
                  onChange={e => setDocExp(Number(e.target.value))}
                  className="border border-slate-300 rounded-lg p-2 bg-white font-mono"
                />
                <input
                  type="number"
                  placeholder="Consult Fee (Rs.)"
                  value={docFee}
                  onChange={e => setDocFee(Number(e.target.value))}
                  className="border border-slate-300 rounded-lg p-2 bg-white font-mono"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  value={docCity}
                  onChange={e => setDocCity(e.target.value)}
                  className="border border-slate-300 rounded-lg p-2 bg-white"
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  value={docPincode}
                  onChange={e => setDocPincode(e.target.value)}
                  className="border border-slate-300 rounded-lg p-2 bg-white font-mono"
                />
                <input
                  type="text"
                  placeholder="Phone Numbers (comma-separated)"
                  value={docPhones}
                  onChange={e => setDocPhones(e.target.value)}
                  className="border border-slate-300 rounded-lg p-2 bg-white font-mono"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDoctor(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 text-white rounded-lg font-semibold"
                >
                  Save Doctor
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Doctor ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Qualification</th>
                  <th className="py-2.5 px-3">Fee</th>
                  <th className="py-2.5 px-3">Experience</th>
                  <th className="py-2.5 px-3">Phone Numbers (1-to-N)</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{d.id}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">Dr. {d.f_name} {d.l_name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{d.qualification}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">Rs. {d.consult_fee}</td>
                    <td className="py-2.5 px-3 font-mono">{d.experience} yrs</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-sky-700">
                      {Array.isArray(d.phone_numbers) ? d.phone_numbers.join(', ') : d.phone_numbers || 'None'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{d.city}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPOINTMENTS TAB */}
      {activeTab === 'appointments' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-4 p-6">
          <h3 className="font-bold text-slate-900 text-xs">
            Global Appointment Schedule (Table 5: Appointment)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Appt ID</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Doctor</th>
                  <th className="py-2.5 px-3">Date &amp; Time</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Bill ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map(a => (
                  <tr key={a.appointment_id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono font-bold">#{a.appointment_id}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{a.patient_name}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{a.doctor_name}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                      {new Date(a.appointment_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          a.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : a.status === 'Scheduled'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {a.bill_id ? `Bill #${a.bill_id}` : 'None'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MEDICINES TAB */}
      {activeTab === 'medicines' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-4 p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-xs">
                Pharmacy Medicine Inventory (Table 7: Medicine &amp; Triggers)
              </h3>
              <p className="text-[11px] text-slate-500">
                Trigger <code>trg_before_medicine_stock_check</code> prevents negative stock; <code>sp_update_medicine_stock</code> updates safely.
              </p>
            </div>
            <button
              onClick={() => setShowAddMed(!showAddMed)}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Medicine</span>
            </button>
          </div>

          {showAddMed && (
            <form onSubmit={handleCreateMedicine} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
              <h4 className="font-bold text-slate-900">Add Medicine to Formulary</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Medicine Name (e.g. Paracetamol 650mg)"
                  value={medName}
                  onChange={e => setMedName(e.target.value)}
                  className="border border-slate-300 rounded-lg p-2 bg-white"
                />
                <input
                  type="text"
                  required
                  placeholder="Category"
                  value={medCategory}
                  onChange={e => setMedCategory(e.target.value)}
                  className="border border-slate-300 rounded-lg p-2 bg-white"
                />
                <input
                  type="number"
                  placeholder="Unit Price (Rs.)"
                  value={medPrice}
                  onChange={e => setMedPrice(Number(e.target.value))}
                  className="border border-slate-300 rounded-lg p-2 bg-white font-mono"
                />
                <input
                  type="number"
                  placeholder="Initial Stock"
                  value={medStock}
                  onChange={e => setMedStock(Number(e.target.value))}
                  className="border border-slate-300 rounded-lg p-2 bg-white font-mono"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMed(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-sky-600 text-white rounded-lg font-semibold">
                  Save Medicine
                </button>
              </div>
            </form>
          )}

          {/* Stock Adjustment Dialog */}
          {selectedMedForStock && (
            <form onSubmit={handleAdjustStock} className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-amber-900">
                  Update Stock via Stored Procedure: {selectedMedForStock.name} (Current: {selectedMedForStock.in_stock})
                </h4>
                <button type="button" onClick={() => setSelectedMedForStock(null)} className="text-amber-800">
                  Cancel
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={stockDelta}
                  onChange={e => setStockDelta(Number(e.target.value))}
                  className="border border-amber-300 rounded-lg p-2 bg-white font-mono w-48"
                  placeholder="+Add or -Deduct"
                />
                <button type="submit" className="px-4 py-2 bg-amber-700 text-white rounded-lg font-semibold">
                  Execute sp_update_medicine_stock
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Med ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Price</th>
                  <th className="py-2.5 px-3">In Stock</th>
                  <th className="py-2.5 px-3">Stock Status</th>
                  <th className="py-2.5 px-3 text-right">Adjust Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicines.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono font-bold">#{m.id}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{m.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{m.category}</td>
                    <td className="py-2.5 px-3 font-mono">Rs. {m.price}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{m.in_stock}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          m.in_stock < 40
                            ? 'bg-rose-100 text-rose-800'
                            : m.in_stock < 75
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {m.in_stock < 40 ? 'CRITICAL' : m.in_stock < 75 ? 'LOW' : 'ADEQUATE'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedMedForStock(m);
                          setStockDelta(20);
                        }}
                        className="px-2 py-1 text-xs text-sky-700 hover:bg-sky-50 border border-sky-200 rounded font-semibold"
                      >
                        Adjust Stock (SP)
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BILLING TAB */}
      {activeTab === 'billing' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-4 p-6">
          <h3 className="font-bold text-slate-900 text-xs">
            Billing &amp; Payment Transactions (Tables: Bill &amp; Payment)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Bill ID</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Doctor</th>
                  <th className="py-2.5 px-3">Gross</th>
                  <th className="py-2.5 px-3">Discount</th>
                  <th className="py-2.5 px-3">Net Payable</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {bills.map(b => (
                  <tr key={b.bill_id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-bold text-slate-800">#{b.bill_id}</td>
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-900">{b.patient_name}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-700">{b.doctor_name}</td>
                    <td className="py-2.5 px-3">Rs. {b.amount}</td>
                    <td className="py-2.5 px-3 text-emerald-600">- Rs. {b.discount}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      Rs. {Math.max(0, b.amount - b.discount)}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MONGODB MANAGEMENT HUB */}
      {activeTab === 'mongodb' && (
        <div className="space-y-6">
          {/* LabReports CRUD */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>MongoDB Collection 1: LabReports (Polymorphic NoSQL Documents)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Full CRUD: Create, Read, Update, Delete with variable biomarker schemas.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedLabReport(null);
                  setIsLabModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Lab Report</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {labReports.map(report => (
                <div
                  key={report.report_id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                      {report.report_id}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white border">
                        {report.report_status}
                      </span>
                      <button
                        onClick={() => handleDeleteLabReport(report.report_id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Delete from MongoDB"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <strong className="block text-slate-900 font-sans">{report.report_type}</strong>
                  <span className="text-[11px] text-slate-500 font-mono block">Patient ID: {report.patient_id}</span>

                  <button
                    onClick={() => {
                      setSelectedLabReport(report);
                      setIsLabModalOpen(true);
                    }}
                    className="w-full mt-2 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-emerald-700 font-semibold text-[11px] transition-colors"
                  >
                    View / Edit Dynamic JSON
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* AuditLogs Collection */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>MongoDB Collection 2: AuditLogs (Append-Only Event Trail)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">Log ID</th>
                    <th className="py-2.5 px-3">User &amp; Role</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Target Table/Col</th>
                    <th className="py-2.5 px-3">Record ID</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.slice(0, 8).map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{log.log_id}</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="font-bold text-slate-900">{log.user_id}</span>
                        <span className="text-slate-400 text-[10px] block">[{log.role}]</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.action === 'INSERT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.action === 'TRANSACTION_ROLLBACK'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{log.collection_or_table}</td>
                      <td className="py-2.5 px-3 text-slate-500">#{log.record_id ?? 'N/A'}</td>
                      <td className="py-2.5 px-3 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ACID SIMULATOR TAB */}
      {activeTab === 'acid' && <AcidSimulator />}

      {/* DBMS QUERY LAB TAB */}
      {activeTab === 'queries' && <DbmsQueryLab />}

      {/* Lab Report Modal */}
      <LabReportModal
        report={selectedLabReport}
        isOpen={isLabModalOpen}
        onClose={() => setIsLabModalOpen(false)}
        onSuccess={() => {
          loadAll();
          setActionMsg('MongoDB lab report saved.');
          setTimeout(() => setActionMsg(null), 3000);
        }}
      />
    </div>
  );
};
