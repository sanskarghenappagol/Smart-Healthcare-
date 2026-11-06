import React, { useState, useEffect } from 'react';
import { User, Appointment, Prescription, DoctorAvailability } from '../types';
import { api, apiRequest } from '../lib/api';
import { PrescriptionModal } from './PrescriptionModal';
import {
  Calendar, Clock, FileText, CheckCircle2, AlertCircle, Plus,
  Stethoscope, UserCheck, Play, Trash2, Check, RefreshCw
} from 'lucide-react';

interface DoctorPortalProps {
  currentUser: User;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'prescriptions' | 'availability'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [availabilitySlots, setAvailabilitySlots] = useState<DoctorAvailability[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // New slot form
  const [slotDate, setSlotDate] = useState(new Date().toISOString().slice(0, 10));
  const [stTime, setStTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');

  // Prescription Modal
  const [selectedApptForPrescription, setSelectedApptForPrescription] = useState<Appointment | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [st, appts, prescs] = await Promise.all([
        api.getOverviewStats(),
        api.getAppointments(),
        api.getPrescriptions()
      ]);

      setStats(st);
      setAppointments(appts);
      setPrescriptions(prescs);

      if (currentUser.ref_id) {
        const doc = await api.getDoctor(currentUser.ref_id);
        setDoctorProfile(doc);
        const slots = await apiRequest(`/doctors/${currentUser.ref_id}/availability`);
        setAvailabilitySlots(slots);
      }
    } catch (err: any) {
      console.error('Doctor portal load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleUpdateStatus = async (apptId: number, status: string) => {
    try {
      await api.updateAppointmentStatus(apptId, status);
      setActionMsg(`Appointment status updated to ${status}.`);
      loadData();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Status update failed.');
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.ref_id) return;
    try {
      await api.addAvailability(currentUser.ref_id, {
        date: slotDate,
        st_time: stTime + ':00',
        end_time: endTime + ':00'
      });
      setActionMsg('New availability slot registered.');
      loadData();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to add availability slot.');
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!currentUser.ref_id) return;
    try {
      await api.deleteAvailability(currentUser.ref_id, slotId);
      setActionMsg('Availability slot deleted.');
      loadData();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete slot.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider block">
            Doctor Clinical Portal · PES University Healthcare
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            {doctorProfile ? `Dr. ${doctorProfile.f_name} ${doctorProfile.l_name}` : currentUser.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Specialty: <strong className="text-slate-800">{doctorProfile?.qualification || 'Consultant Physician'}</strong> · Experience: <strong className="text-slate-800">{doctorProfile?.experience} yrs</strong> · Fee: <strong className="text-slate-800">Rs. {doctorProfile?.consult_fee}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
            Status: Active &amp; Practicing
          </span>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
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
          Clinical Overview
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'appointments' ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Patient Appointments ({appointments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'prescriptions' ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Prescription Records ({prescriptions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('availability')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'availability' ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Availability Slots ({availabilitySlots.length})</span>
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Today's Queue</span>
              <span className="text-2xl font-bold font-mono text-sky-700 mt-1 block">
                {stats?.todayAppointments ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Scheduled today</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Patients</span>
              <span className="text-2xl font-bold font-mono text-emerald-700 mt-1 block">
                {stats?.totalPatients ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Distinct individuals treated</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Completed Visits</span>
              <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
                {stats?.completedAppointments ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Consultations concluded</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Prescriptions Issued</span>
              <span className="text-2xl font-bold font-mono text-purple-700 mt-1 block">
                {stats?.totalPrescriptions ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">With dispensed medicines</span>
            </div>
          </div>

          {/* Today's Queue Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-xs">Active Patient Queue</h3>
            {appointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <th className="py-2.5 px-3">Appt ID</th>
                      <th className="py-2.5 px-3">Patient Name</th>
                      <th className="py-2.5 px-3">Age / Blood</th>
                      <th className="py-2.5 px-3">Date &amp; Time</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointments.slice(0, 5).map(a => (
                      <tr key={a.appointment_id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono font-bold">#{a.appointment_id}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{a.patient_name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{a.patient_age} yrs · {a.patient_blood_group}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                          {new Date(a.appointment_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              a.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : a.status === 'In-Progress'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1.5">
                          {a.status === 'Scheduled' && (
                            <button
                              onClick={() => handleUpdateStatus(a.appointment_id, 'In-Progress')}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded font-semibold text-[11px]"
                            >
                              Start
                            </button>
                          )}
                          {!a.pers_id && (
                            <button
                              onClick={() => setSelectedApptForPrescription(a)}
                              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded font-semibold text-[11px]"
                            >
                              Write Prescription
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No active appointments in queue.
              </div>
            )}
          </div>
        </div>
      )}

      {/* APPOINTMENTS TAB */}
      {activeTab === 'appointments' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs">All Doctor Appointments</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-4">Appt ID</th>
                  <th className="py-2.5 px-4">Patient</th>
                  <th className="py-2.5 px-4">Date &amp; Time</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Bill Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map(a => (
                  <tr key={a.appointment_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">#{a.appointment_id}</td>
                    <td className="py-3 px-4">
                      <strong className="text-slate-900 block">{a.patient_name}</strong>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Age: {a.patient_age} yrs · Blood: {a.patient_blood_group}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                      {new Date(a.appointment_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          a.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : a.status === 'In-Progress'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {a.bill_id ? `Bill #${a.bill_id} (${a.bill_status})` : 'Pending'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {a.status !== 'Completed' && (
                        <button
                          onClick={() => handleUpdateStatus(a.appointment_id, 'Completed')}
                          className="px-2.5 py-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg font-semibold"
                        >
                          Mark Completed
                        </button>
                      )}
                      {!a.pers_id && (
                        <button
                          onClick={() => setSelectedApptForPrescription(a)}
                          className="px-3 py-1 text-xs bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold shadow-2xs"
                        >
                          Write Prescription
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
          <h3 className="font-bold text-slate-900 text-xs">Prescription &amp; Medicine History</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prescriptions.map(p => (
              <div key={p.pers_id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <strong className="text-xs text-slate-900 block">{p.patient_name}</strong>
                    <span className="text-[11px] text-slate-500 font-mono">Age: {p.patient_age} yrs</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Prescription #{p.pers_id}</span>
                </div>

                <div className="space-y-1 text-xs">
                  <div>
                    <span className="font-semibold text-slate-500 text-[11px] block">Diagnosis:</span>
                    <span className="text-slate-900 font-medium">{p.diagnosis}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 text-[11px] block">Symptoms:</span>
                    <span className="text-slate-700">{p.symptoms}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Prescribed: {p.prescribed_date}
                  </div>
                </div>

                {p.medicines && p.medicines.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 border border-slate-100 font-mono text-[11px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans block">
                      Medicines Dispensed ({p.medicines.length})
                    </span>
                    {p.medicines.map((m, mIdx) => (
                      <div key={mIdx} className="flex justify-between border-b border-slate-200/50 pb-1">
                        <div>
                          <strong className="text-slate-800 font-sans">{m.name}</strong>
                          <span className="text-slate-500 text-[10px] block">{m.dosage} · {m.frequency} ({m.duration_days} days)</span>
                        </div>
                        <span className="text-slate-700">Rs. {m.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AVAILABILITY TAB */}
      {activeTab === 'availability' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Slot Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-600" />
              <span>Register New Availability Slot</span>
            </h3>

            <form onSubmit={handleAddSlot} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={slotDate}
                  onChange={e => setSlotDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 block mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={stTime}
                    onChange={e => setStTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold text-xs transition-colors"
              >
                Add Available Slot
              </button>
            </form>
          </div>

          {/* Slots List */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-xs">
              Active Consultation Slots (Table: Doctor_Availability)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availabilitySlots.map(slot => (
                <div
                  key={slot.availability_id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-slate-800 block">{slot.date}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {slot.st_time} — {slot.end_time}
                    </span>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        slot.status === 'Available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {slot.status}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteSlot(slot.availability_id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Prescription Modal */}
      <PrescriptionModal
        appointment={selectedApptForPrescription}
        isOpen={!!selectedApptForPrescription}
        onClose={() => setSelectedApptForPrescription(null)}
        onSuccess={() => {
          loadData();
          setActionMsg('Prescription recorded and inventory safely adjusted via MySQL trigger.');
          setTimeout(() => setActionMsg(null), 4000);
        }}
      />
    </div>
  );
};
