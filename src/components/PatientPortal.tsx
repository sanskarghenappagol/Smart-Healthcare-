import React, { useState, useEffect } from 'react';
import { User, Appointment, Prescription, Bill, LabReport, Doctor } from '../types';
import { api } from '../lib/api';
import { PaymentModal } from './PaymentModal';
import { LabReportModal } from './LabReportModal';
import {
  Calendar, Clock, FileText, Receipt, Activity, User as UserIcon,
  CheckCircle, AlertCircle, Plus, Search, ChevronRight, Stethoscope, RefreshCw
} from 'lucide-react';

interface PatientPortalProps {
  currentUser: User;
  onNavigateToDoctors: () => void;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({ currentUser, onNavigateToDoctors }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'prescriptions' | 'bills' | 'labs' | 'profile'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Modals
  const [selectedBillForPay, setSelectedBillForPay] = useState<Bill | null>(null);
  const [selectedLabReport, setSelectedLabReport] = useState<LabReport | null>(null);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [st, appts, prescs, bls, labs] = await Promise.all([
        api.getOverviewStats(),
        api.getAppointments(),
        api.getPrescriptions(),
        api.getBills(),
        api.getLabReports(currentUser.ref_id ? { patient_id: currentUser.ref_id } : undefined)
      ]);

      setStats(st);
      setAppointments(appts);
      setPrescriptions(prescs);
      setBills(bls);
      setLabReports(labs);

      if (currentUser.ref_id) {
        const prof = await api.getPatient(currentUser.ref_id);
        setPatientProfile(prof);
      }
    } catch (err: any) {
      console.error('Patient portal load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleCancelAppointment = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this scheduled appointment?')) return;
    try {
      await api.updateAppointmentStatus(id, 'Cancelled');
      setActionMsg('Appointment cancelled successfully. Availability slot released via trigger.');
      loadData();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider block">
            Patient Portal · PES University Healthcare
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Welcome back, {patientProfile ? `${patientProfile.f_name} ${patientProfile.l_name}` : currentUser.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Patient ID: <strong className="font-mono text-slate-700">{currentUser.ref_id}</strong> · Dynamic Age: <strong className="text-slate-700">{patientProfile?.age || '28'} yrs</strong> · Blood Group: <strong className="text-slate-700">{patientProfile?.blood_group || 'O+'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToDoctors}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Book New Appointment</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'overview' ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'appointments' ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>My Appointments ({appointments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'prescriptions' ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Prescriptions ({prescriptions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('bills')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'bills' ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Bills &amp; Payments ({bills.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('labs')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'labs' ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-emerald-600" />
          <span>MongoDB Lab Reports ({labReports.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'profile' ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Profile Details</span>
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Upcoming Visits</span>
              <span className="text-2xl font-bold font-mono text-sky-700 mt-1 block">
                {stats?.upcomingAppointments ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Scheduled consultations</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Past Visits</span>
              <span className="text-2xl font-bold font-mono text-emerald-700 mt-1 block">
                {stats?.completedAppointments ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Completed checkups</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Pending Bills</span>
              <span className="text-2xl font-bold font-mono text-amber-700 mt-1 block">
                Rs. {stats?.pendingBillsAmount ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {stats?.pendingBillsCount ?? 0} bill(s) awaiting payment
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Diagnostic Reports</span>
              <span className="text-2xl font-bold font-mono text-purple-700 mt-1 block">
                {labReports.length}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">In MongoDB collections</span>
            </div>
          </div>

          {/* Quick Schedule Preview & Recent Prescriptions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Appointments */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-xs">Upcoming Appointments</h3>
                <button
                  onClick={() => setActiveTab('appointments')}
                  className="text-sky-600 hover:underline text-[11px] font-semibold"
                >
                  View All
                </button>
              </div>

              {appointments.filter(a => a.status === 'Scheduled').length > 0 ? (
                <div className="space-y-2">
                  {appointments
                    .filter(a => a.status === 'Scheduled')
                    .slice(0, 3)
                    .map(a => (
                      <div
                        key={a.appointment_id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                      >
                        <div>
                          <strong className="text-xs text-slate-900 block">{a.doctor_name}</strong>
                          <span className="text-[11px] text-slate-500">{a.doctor_qualification}</span>
                          <span className="text-[11px] text-sky-700 font-mono block mt-1">
                            {new Date(a.appointment_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 uppercase">
                          {a.status}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No upcoming appointments scheduled.
                </div>
              )}
            </div>

            {/* Pending Bills for Payment */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-xs">Outstanding Hospital Bills</h3>
                <button
                  onClick={() => setActiveTab('bills')}
                  className="text-sky-600 hover:underline text-[11px] font-semibold"
                >
                  Billing Ledger
                </button>
              </div>

              {bills.filter(b => b.status === 'Pending' || b.status === 'Partially Paid').length > 0 ? (
                <div className="space-y-2">
                  {bills
                    .filter(b => b.status === 'Pending' || b.status === 'Partially Paid')
                    .map(b => (
                      <div
                        key={b.bill_id}
                        className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80 flex items-center justify-between"
                      >
                        <div>
                          <strong className="text-xs text-slate-900 block">Bill #{b.bill_id} · {b.doctor_name}</strong>
                          <span className="text-[11px] text-slate-500">Date: {b.bill_date}</span>
                          <span className="text-xs font-bold text-amber-800 block mt-1 font-mono">
                            Payable: Rs. {Math.max(0, b.amount - b.discount - (b.total_paid || 0))}
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedBillForPay(b)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                        >
                          Pay Now (Simulated)
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  All hospital bills are settled in full!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* APPOINTMENTS TAB */}
      {activeTab === 'appointments' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs">Appointments History (MySQL Table: Appointment)</h3>
            <span className="text-[11px] text-slate-500 font-mono">Count: {appointments.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-4">Appt ID</th>
                  <th className="py-2.5 px-4">Doctor &amp; Specialty</th>
                  <th className="py-2.5 px-4">Date &amp; Time</th>
                  <th className="py-2.5 px-4">Consult Fee</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map(a => (
                  <tr key={a.appointment_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">#{a.appointment_id}</td>
                    <td className="py-3 px-4">
                      <strong className="text-slate-900 block">{a.doctor_name}</strong>
                      <span className="text-[11px] text-slate-500">{a.doctor_qualification}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                      {new Date(a.appointment_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4 font-mono">Rs. {a.consult_fee}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          a.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : a.status === 'Scheduled'
                            ? 'bg-sky-100 text-sky-800'
                            : a.status === 'In-Progress'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {a.status === 'Scheduled' && (
                        <button
                          onClick={() => handleCancelAppointment(a.appointment_id)}
                          className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors font-medium"
                        >
                          Cancel Appointment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRESCRIPTIONS TAB */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs">
              Prescriptions &amp; Prescribed Medicines (Tables: Prescription &amp; Prescription_Medicine)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prescriptions.map(p => (
              <div key={p.pers_id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{p.doctor_name}</span>
                    <span className="text-[11px] text-slate-500">{p.doctor_qualification}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">Prescription #{p.pers_id}</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="font-semibold text-slate-500 text-[11px] block">Diagnosis:</span>
                    <span className="text-slate-900 font-medium">{p.diagnosis}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 text-[11px] block">Symptoms:</span>
                    <span className="text-slate-700">{p.symptoms}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>Prescribed: {p.prescribed_date}</span>
                    {p.follow_up_date && <span className="font-semibold text-sky-700">Follow-up: {p.follow_up_date}</span>}
                  </div>
                </div>

                {/* Prescribed Medicines list */}
                {p.medicines && p.medicines.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Prescribed Medicines ({p.medicines.length})
                    </span>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      {p.medicines.map((m, mIdx) => (
                        <div key={mIdx} className="flex justify-between items-start border-b border-slate-200/50 pb-1">
                          <div>
                            <strong className="text-slate-900 font-sans block">{m.name}</strong>
                            <span className="text-slate-500 text-[10px]">{m.dosage} · {m.frequency} · {m.duration_days} days</span>
                            <span className="text-[10px] text-slate-400 italic block">{m.instruction}</span>
                          </div>
                          <span className="text-slate-700">Rs. {m.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BILLS TAB */}
      {activeTab === 'bills' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs">
              Billing Ledger &amp; Payments (Tables: Bill &amp; Payment)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-4">Bill ID</th>
                  <th className="py-2.5 px-4">Doctor</th>
                  <th className="py-2.5 px-4">Bill Date</th>
                  <th className="py-2.5 px-4">Gross Amount</th>
                  <th className="py-2.5 px-4">Discount</th>
                  <th className="py-2.5 px-4">Net Payable</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map(b => {
                  const net = Math.max(0, b.amount - b.discount);
                  const isPaid = b.status === 'Paid';
                  return (
                    <tr key={b.bill_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">#{b.bill_id}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{b.doctor_name}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{b.bill_date}</td>
                      <td className="py-3 px-4 font-mono">Rs. {b.amount}</td>
                      <td className="py-3 px-4 font-mono text-emerald-600">- Rs. {b.discount}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">Rs. {net}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isPaid && (
                          <button
                            onClick={() => setSelectedBillForPay(b)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-2xs"
                          >
                            Pay Bill
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LAB REPORTS (MONGODB) */}
      {activeTab === 'labs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-xs">
                Clinical Lab Reports (Stored in MongoDB NoSQL Collection: LabReports)
              </h3>
              <p className="text-[11px] text-slate-500">
                Demonstrates dynamic, semi-structured document storage with varying medical test biomarkers.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedLabReport(null);
                setIsLabModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload / Add Report</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {labReports.map(report => (
              <div
                key={report.report_id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 cursor-pointer hover:border-emerald-400 transition-colors"
                onClick={() => {
                  setSelectedLabReport(report);
                  setIsLabModalOpen(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    {report.report_id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      report.report_status === 'Normal'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {report.report_status}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900">{report.report_type}</h4>
                  <span className="text-[11px] text-slate-400">
                    Uploaded: {new Date(report.uploaded_date).toLocaleDateString()}
                  </span>
                </div>

                {report.doctor_comments && (
                  <p className="text-[11px] text-slate-600 line-clamp-2 italic bg-slate-50 p-2 rounded">
                    "{report.doctor_comments}"
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-sky-600 font-semibold">
                  <span>View Test Biomarkers (JSON)</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === 'profile' && patientProfile && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-2xl space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Patient Demographic Details (Table: Patient)</h3>
          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 font-sans block text-[11px]">Patient ID:</span>
              <span className="font-bold text-slate-800">{patientProfile.p_id}</span>
            </div>
            <div>
              <span className="text-slate-400 font-sans block text-[11px]">Full Name:</span>
              <span className="font-bold text-slate-800">{patientProfile.f_name} {patientProfile.l_name}</span>
            </div>
            <div>
              <span className="text-slate-400 font-sans block text-[11px]">Date of Birth (DOB):</span>
              <span className="text-slate-800">{patientProfile.dob}</span>
            </div>
            <div>
              <span className="text-slate-400 font-sans block text-[11px]">Calculated Dynamic Age:</span>
              <span className="font-bold text-emerald-700">{patientProfile.age} Years (fn_calculate_patient_age)</span>
            </div>
            <div>
              <span className="text-slate-400 font-sans block text-[11px]">Blood Group:</span>
              <span className="font-bold text-slate-800">{patientProfile.blood_group}</span>
            </div>
            <div>
              <span className="text-slate-400 font-sans block text-[11px]">Gender:</span>
              <span className="text-slate-800">{patientProfile.gender}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 font-sans block text-[11px]">Residential Address:</span>
              <span className="text-slate-800 font-sans">{patientProfile.street}, {patientProfile.city} - {patientProfile.pincode}</span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Simulation Modal */}
      <PaymentModal
        bill={selectedBillForPay}
        isOpen={!!selectedBillForPay}
        onClose={() => setSelectedBillForPay(null)}
        onPaymentSuccess={() => {
          loadData();
          setActionMsg('Payment processed successfully. Payment and Bill tables updated.');
          setTimeout(() => setActionMsg(null), 4000);
        }}
      />

      {/* Lab Report Modal */}
      <LabReportModal
        report={selectedLabReport}
        isOpen={isLabModalOpen}
        onClose={() => setIsLabModalOpen(false)}
        onSuccess={() => {
          loadData();
          setActionMsg('MongoDB lab report saved successfully.');
          setTimeout(() => setActionMsg(null), 4000);
        }}
      />
    </div>
  );
};
