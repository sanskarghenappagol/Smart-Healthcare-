import React, { useState } from 'react';
import { LabReport } from '../types';
import { api } from '../lib/api';
import { X, FileText, CheckCircle2, AlertTriangle, Plus, RefreshCw } from 'lucide-react';

interface LabReportModalProps {
  report: LabReport | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LabReportModal: React.FC<LabReportModalProps> = ({
  report,
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!isOpen) return null;

  const [isEditing, setIsEditing] = useState(!report);
  const [patientId, setPatientId] = useState(report?.patient_id || 'PAT001');
  const [reportType, setReportType] = useState(report?.report_type || 'Complete Blood Count (CBC)');
  const [reportStatus, setReportStatus] = useState<any>(report?.report_status || 'Normal');
  const [doctorComments, setDoctorComments] = useState(report?.doctor_comments || '');
  const [jsonText, setJsonText] = useState(
    report?.test_results ? JSON.stringify(report.test_results, null, 2) : JSON.stringify({
      hemoglobin: { value: 14.2, unit: "g/dL", normal: "13.0 - 17.0" },
      wbc: { value: 7800, unit: "cells/mcL", normal: "4000 - 11000" },
      platelets: { value: 250000, unit: "mcL", normal: "150000 - 450000" }
    }, null, 2)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let parsedResults: any;
    try {
      parsedResults = JSON.parse(jsonText);
    } catch (err) {
      setError('Invalid JSON syntax for test_results. Please check format.');
      return;
    }

    setLoading(true);
    try {
      if (report && report.report_id) {
        await api.updateLabReport(report.report_id, {
          doctor_comments: doctorComments,
          report_status: reportStatus,
          test_results: parsedResults
        });
      } else {
        await api.createLabReport({
          patient_id: patientId,
          report_type: reportType,
          test_results: parsedResults,
          doctor_comments: doctorComments,
          report_status: reportStatus
        });
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save MongoDB document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                {report ? `MongoDB Lab Report · ${report.report_id}` : 'Create Flexible NoSQL Lab Report'}
              </h3>
              <p className="text-[11px] text-emerald-300 font-mono">
                Collection: LabReports (Polymorphic Document Structure)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-emerald-300 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Patient ID (FK to Patient.p_id)</label>
              <input
                type="text"
                value={patientId}
                disabled={!!report}
                onChange={e => setPatientId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-xs text-slate-800 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Diagnostic Report Type</label>
              <select
                value={reportType}
                disabled={!!report}
                onChange={e => setReportType(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 disabled:bg-slate-100"
              >
                <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                <option value="Lipid Profile Panel">Lipid Profile Panel</option>
                <option value="Fasting Blood Glucose & HbA1c">Fasting Blood Glucose &amp; HbA1c</option>
                <option value="Thyroid Function Test (TFT)">Thyroid Function Test (TFT)</option>
                <option value="Digital X-Ray / MRI Scan">Digital X-Ray / MRI Scan</option>
                <option value="Liver Function Test (LFT)">Liver Function Test (LFT)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Diagnostic Status</label>
              <select
                value={reportStatus}
                onChange={e => setReportStatus(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
              >
                <option value="Normal">Normal</option>
                <option value="Abnormal">Abnormal</option>
                <option value="Critical">Critical</option>
                <option value="Borderline">Borderline</option>
                <option value="Pending Review">Pending Review</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Doctor / Pathologist Comments</label>
              <input
                type="text"
                value={doctorComments}
                onChange={e => setDoctorComments(e.target.value)}
                placeholder="Clinical remarks or medication advice..."
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Flexible Polymorphic JSON test_results Editor */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span>Dynamic Test Biomarkers (test_results JSON)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.5 rounded">
                  No Fixed Schema
                </span>
              </label>
              <span className="text-[10px] text-slate-400">Valid JSON Object</span>
            </div>
            <textarea
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              rows={8}
              className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-300 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors flex items-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving to MongoDB...</span>
                </>
              ) : (
                <span>{report ? 'Update Lab Document' : 'Insert MongoDB Record'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
