import React, { useState, useEffect } from 'react';
import { Doctor, User } from '../types';
import { api } from '../lib/api';
import {
  Search, Filter, Calendar, Clock, Stethoscope, CheckCircle2,
  AlertCircle, RefreshCw, ChevronRight, Phone
} from 'lucide-react';

interface DoctorBrowserProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onAppointmentBooked?: () => void;
}

export const DoctorBrowser: React.FC<DoctorBrowserProps> = ({
  currentUser,
  onOpenAuth,
  onAppointmentBooked
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState('');
  const [qualification, setQualification] = useState('');
  const [city, setCity] = useState('');
  const [maxFee, setMaxFee] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);

  // Booking Modal / Drawer state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlotDate, setSelectedSlotDate] = useState<string>('');
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (qualification) params.qualification = qualification;
      if (city) params.city = city;
      if (maxFee) params.max_fee = String(maxFee);

      const docs = await api.getDoctors(params);
      setDoctors(docs);
    } catch (err: any) {
      console.error('Fetch doctors error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [search, qualification, city, maxFee]);

  const handleOpenBooking = async (doc: Doctor) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    const fullDoc = await api.getDoctor(doc.id);
    setSelectedDoctor(fullDoc);
    setBookingSuccess(null);
    setBookingError(null);

    // Pre-select first available slot if any
    if (fullDoc.available_slots && fullDoc.available_slots.length > 0) {
      const firstAvailable = fullDoc.available_slots.find((s: any) => s.status === 'Available');
      if (firstAvailable) {
        setSelectedSlotDate(firstAvailable.date);
        setSelectedSlotTime(firstAvailable.st_time);
      }
    } else {
      // Default to tomorrow 10am
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      setSelectedSlotDate(tomorrow);
      setSelectedSlotTime('10:00:00');
    }
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !currentUser) return;

    setBookingLoading(true);
    setBookingError(null);

    try {
      const dateTimeStr = `${selectedSlotDate} ${selectedSlotTime}`;
      const res = await api.bookAppointment({
        doctor_id: selectedDoctor.id,
        appointment_date: dateTimeStr
      });

      setBookingSuccess(res.message || 'Appointment booked successfully.');
      if (onAppointmentBooked) onAppointmentBooked();
    } catch (err: any) {
      setBookingError(err.message || 'Failed to book appointment.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider block">
          Clinical Directory &amp; Scheduling
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">
          Find Doctors &amp; Check Availability
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time appointment scheduling backed by MySQL stored procedure <code>sp_book_appointment</code> with automated slot status updates.
        </p>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-6 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or keyword..."
              className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <select
              value={qualification}
              onChange={e => setQualification(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white text-xs text-slate-800"
            >
              <option value="">All Specialties</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="General Medicine">General Medicine</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Neurology">Neurology</option>
              <option value="Dermatology">Dermatology</option>
              <option value="ENT">ENT</option>
              <option value="Pulmonology">Pulmonology</option>
            </select>
          </div>

          <div>
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white text-xs text-slate-800"
            >
              <option value="">All Cities</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Mysuru">Mysuru</option>
              <option value="Hubballi">Hubballi</option>
              <option value="Mangaluru">Mangaluru</option>
            </select>
          </div>

          <div>
            <input
              type="number"
              value={maxFee}
              onChange={e => setMaxFee(e.target.value ? Number(e.target.value) : '')}
              placeholder="Max Consult Fee (Rs.)"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white text-xs text-slate-800 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Doctor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map(doctor => (
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
                  <span className="text-xs font-semibold text-sky-700 block">
                    {doctor.qualification}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 font-mono">
                  {doctor.experience} Yrs Exp
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Consultation Fee:</span>
                  <strong className="text-slate-900 font-mono font-bold">Rs. {doctor.consult_fee}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span>{doctor.city} ({doctor.pincode})</span>
                </div>
                {doctor.phone_numbers && (
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-400 font-sans">Contact:</span>
                    <span className="text-slate-700 truncate max-w-[170px]">
                      {Array.isArray(doctor.phone_numbers) ? doctor.phone_numbers[0] : doctor.phone_numbers}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-400 font-sans">Consultations to Date:</span>
                  <span className="font-bold text-slate-800">{doctor.total_consultations || 0}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">Doctor ID: {doctor.id}</span>
              <button
                onClick={() => handleOpenBooking(doctor)}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Book Slot</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Dialog Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900">
                  Book with Dr. {selectedDoctor.f_name} {selectedDoctor.l_name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {selectedDoctor.qualification} · Fee: Rs. {selectedDoctor.consult_fee}
                </p>
              </div>
              <button onClick={() => setSelectedDoctor(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                ✕
              </button>
            </div>

            {bookingSuccess ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-900">{bookingSuccess}</h4>
                <p className="text-xs text-slate-500">
                  Appointment written to MySQL <code>Appointment</code> table. Stored procedure validated doctor availability.
                </p>
                <button
                  onClick={() => setSelectedDoctor(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="p-6 space-y-4 text-xs">
                {/* Available Slots Preview */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block">
                    Pre-Registered Doctor Availability Slots (Table: Doctor_Availability)
                  </label>
                  {selectedDoctor.available_slots && selectedDoctor.available_slots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 border rounded-lg bg-slate-50 font-mono text-[11px]">
                      {selectedDoctor.available_slots.map(slot => (
                        <button
                          key={slot.availability_id}
                          type="button"
                          disabled={slot.status !== 'Available'}
                          onClick={() => {
                            setSelectedSlotDate(slot.date);
                            setSelectedSlotTime(slot.st_time);
                          }}
                          className={`p-2 rounded-lg border text-left transition-colors ${
                            selectedSlotDate === slot.date && selectedSlotTime === slot.st_time
                              ? 'border-sky-500 bg-sky-50 text-sky-800 font-bold'
                              : slot.status === 'Available'
                              ? 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                              : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <div className="block font-bold">{slot.date}</div>
                          <div className="text-[10px] text-slate-500">{slot.st_time} ({slot.status})</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      No pre-scheduled slots found. You may pick custom date &amp; time below.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 block mb-1">Appointment Date *</label>
                    <input
                      type="date"
                      required
                      value={selectedSlotDate}
                      onChange={e => setSelectedSlotDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">Time Slot *</label>
                    <input
                      type="time"
                      required
                      value={selectedSlotTime.slice(0, 5)}
                      onChange={e => setSelectedSlotTime(e.target.value + ':00')}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                {bookingError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    {bookingLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Invoking sp_book_appointment...</span>
                      </>
                    ) : (
                      <span>Confirm Consultation Booking</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
