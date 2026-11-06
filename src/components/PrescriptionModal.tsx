import React, { useState, useEffect } from 'react';
import { Appointment, Medicine } from '../types';
import { api } from '../lib/api';
import { X, Plus, Trash2, Pill, Stethoscope, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface PrescriptionModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!isOpen || !appointment) return null;

  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medicinesList, setMedicinesList] = useState<Medicine[]>([]);
  const [prescribedMeds, setPrescribedMeds] = useState<
    Array<{
      medicine_id: number;
      dosage: string;
      frequency: string;
      duration_days: number;
      instruction: string;
    }>
  >([
    {
      medicine_id: 1,
      dosage: '650 mg',
      frequency: 'Twice daily after food',
      duration_days: 5,
      instruction: 'Take with warm water'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getMedicines().then(data => setMedicinesList(data)).catch(console.error);
  }, []);

  const handleAddMedicineRow = () => {
    const firstMedId = medicinesList.length > 0 ? medicinesList[0].id : 1;
    setPrescribedMeds(prev => [
      ...prev,
      {
        medicine_id: firstMedId,
        dosage: '1 tablet',
        frequency: 'Once daily',
        duration_days: 3,
        instruction: 'As directed'
      }
    ]);
  };

  const handleRemoveMedicineRow = (index: number) => {
    setPrescribedMeds(prev => prev.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, field: string, value: any) => {
    setPrescribedMeds(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim() || !diagnosis.trim()) {
      setError('Please provide patient symptoms and clinical diagnosis.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.createPrescription({
        appointment_id: appointment.appointment_id,
        symptoms,
        diagnosis,
        follow_up_date: followUpDate || null,
        medicines: prescribedMeds
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save prescription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-sky-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Write Clinical Prescription · Appointment #{appointment.appointment_id}
              </h3>
              <p className="text-[11px] text-slate-500">
                Patient: {appointment.patient_name} · Age: {appointment.patient_age} yrs · Blood: {appointment.patient_blood_group}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Symptoms & Diagnosis */}
          <div className="space-y-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Patient Symptoms &amp; Presenting Complaints *
              </label>
              <textarea
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
                required
                rows={2}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="e.g. Fever with chills, persistent dry cough for 3 days, mild headache..."
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Clinical Diagnosis &amp; Evaluation *
              </label>
              <textarea
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
                required
                rows={2}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="e.g. Acute Viral Upper Respiratory Infection, Stage 1 Hypertension..."
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Recommended Follow-up Date (Optional)
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={e => setFollowUpDate(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Medicines Junction Table: Prescription_Medicine */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-emerald-600" />
                  <span>Prescribe Medicines (Junction: Prescription_Medicine)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Deducts stock via MySQL trigger and auto-computes medicine charges.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddMedicineRow}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medicine</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {prescribedMeds.map((med, idx) => {
                const selectedMedObj = medicinesList.find(m => m.id === med.medicine_id);
                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-0.5">Medicine Name</label>
                        <select
                          value={med.medicine_id}
                          onChange={e => handleMedicineChange(idx, 'medicine_id', Number(e.target.value))}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:ring-1 focus:ring-sky-500"
                        >
                          {medicinesList.map(m => (
                            <option key={m.id} value={m.id} disabled={m.in_stock <= 0}>
                              {m.name} ({m.category}) — Rs. {m.price} [Stock: {m.in_stock}]
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-500 block mb-0.5">Dosage</label>
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={e => handleMedicineChange(idx, 'dosage', e.target.value)}
                          placeholder="e.g. 500 mg / 1 tablet"
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-0.5">Frequency</label>
                        <input
                          type="text"
                          value={med.frequency}
                          onChange={e => handleMedicineChange(idx, 'frequency', e.target.value)}
                          placeholder="e.g. Twice daily"
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-500 block mb-0.5">Duration (Days)</label>
                        <input
                          type="number"
                          min={1}
                          value={med.duration_days}
                          onChange={e => handleMedicineChange(idx, 'duration_days', Number(e.target.value))}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-500 block mb-0.5">Special Instruction</label>
                        <input
                          type="text"
                          value={med.instruction}
                          onChange={e => handleMedicineChange(idx, 'instruction', e.target.value)}
                          placeholder="e.g. After food with water"
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-800"
                        />
                      </div>
                    </div>

                    {prescribedMeds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicineRow(idx)}
                        className="text-rose-500 hover:text-rose-700 text-[11px] flex items-center gap-1 mt-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove this medicine</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors flex items-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving &amp; Dispensing...</span>
                </>
              ) : (
                <span>Issue Prescription &amp; Generate Bill</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
