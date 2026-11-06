import React, { useState } from 'react';
import { api } from '../lib/api';
import { Database, Play, CheckCircle2, AlertTriangle, RefreshCw, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';

export const AcidSimulator: React.FC = () => {
  const [mode, setMode] = useState<'commit' | 'rollback'>('rollback');
  const [patientId, setPatientId] = useState('PAT001');
  const [doctorId, setDoctorId] = useState('DOC001');
  const [customAmount, setCustomAmount] = useState(850);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.simulateAcidTransaction({
        mode,
        patient_id: patientId,
        doctor_id: doctorId,
        custom_amount: Number(customAmount)
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Transaction simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-sky-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold">
              <Cpu className="w-3.5 h-3.5" />
              <span>PES University CSE · Evaluation Feature #11</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              MySQL ACID Transaction &amp; Rollback Simulator
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Demonstrates atomic transaction execution, InnoDB buffer management, and automatic rollback on a single dedicated MySQL connection. Proves that multi-table clinical inserts remain strictly all-or-nothing.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-1 bg-slate-800 rounded-xl flex items-center text-xs font-semibold">
              <button
                onClick={() => setMode('commit')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  mode === 'commit'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mode 1: Commit (Success)
              </button>
              <button
                onClick={() => setMode('rollback')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  mode === 'rollback'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mode 2: Rollback (Failure)
              </button>
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-sm transition-all ${
                loading
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : mode === 'commit'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : 'bg-rose-500 hover:bg-rose-400 text-white'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing Transaction...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Live {mode === 'commit' ? 'COMMIT' : 'ROLLBACK'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Control Configuration Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4 items-center text-xs">
        <div>
          <label className="block text-slate-500 font-medium mb-1">Patient ID (Foreign Key)</label>
          <select
            value={patientId}
            onChange={e => setPatientId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="PAT001">PAT001 (Rohit Verma)</option>
            <option value="PAT002">PAT002 (Meera Rao)</option>
            <option value="PAT003">PAT003 (Karthik Sundaram)</option>
            <option value="PAT004">PAT004 (Divya Gowda)</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-medium mb-1">Doctor ID (Foreign Key)</label>
          <select
            value={doctorId}
            onChange={e => setDoctorId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="DOC001">DOC001 (Dr. Rajesh Sharma · Cardiology)</option>
            <option value="DOC002">DOC002 (Dr. Priya Nair · Orthopedics)</option>
            <option value="DOC003">DOC003 (Dr. Arun Kumar · General Med)</option>
            <option value="DOC005">DOC005 (Dr. Vikram Reddy · Neurology)</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-medium mb-1">Consultation &amp; Bill Amount (Rs.)</label>
          <input
            type="number"
            value={customAmount}
            onChange={e => setCustomAmount(Number(e.target.value))}
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-slate-500 font-medium mb-1">Transaction Scenario</label>
          <div className="font-semibold text-slate-700 py-1">
            {mode === 'commit'
              ? 'Multi-Step Atomic Insertion with COMMIT'
              : 'Controlled Gateway Crash with full ROLLBACK'}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Transaction Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary Alert */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
              result.mode === 'commit'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-3">
              {result.mode === 'commit' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <span>{result.summary}</span>
            </div>
            <span className="font-mono font-bold uppercase tracking-wider text-[11px] px-2.5 py-1 rounded bg-white/70">
              {result.mode === 'commit' ? 'Status: COMMITTED' : 'Status: ROLLED BACK'}
            </span>
          </div>

          {/* Before vs After Database State Snapshot */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-600" />
                <span>Live MySQL Database State Comparison (Before vs. After)</span>
              </h3>
              <span className="text-xs text-slate-500">
                Record Persisted on Disk:{' '}
                <strong className={result.recordPersisted ? 'text-emerald-600' : 'text-rose-600 font-mono'}>
                  {result.recordPersisted ? 'YES (Written to Tablespace)' : 'NO (Completely Erased)'}
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 p-6 text-center">
              {/* Appointments */}
              <div className="p-4 space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Table: Appointment
                </span>
                <div className="flex items-center justify-center gap-4 text-slate-800">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Before</span>
                    <span className="text-2xl font-bold font-mono">{result.beforeState.appointments}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <div className="text-left">
                    <span className="text-xs text-slate-400 block">After</span>
                    <span
                      className={`text-2xl font-bold font-mono ${
                        result.mode === 'commit' ? 'text-emerald-600' : 'text-slate-800'
                      }`}
                    >
                      {result.afterState.appointments}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  {result.mode === 'commit' ? '+1 row committed' : 'Net change: 0 (No phantom row)'}
                </div>
              </div>

              {/* Bills */}
              <div className="p-4 space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Table: Bill
                </span>
                <div className="flex items-center justify-center gap-4 text-slate-800">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Before</span>
                    <span className="text-2xl font-bold font-mono">{result.beforeState.bills}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <div className="text-left">
                    <span className="text-xs text-slate-400 block">After</span>
                    <span
                      className={`text-2xl font-bold font-mono ${
                        result.mode === 'commit' ? 'text-emerald-600' : 'text-slate-800'
                      }`}
                    >
                      {result.afterState.bills}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  {result.mode === 'commit' ? '+1 row committed' : 'Net change: 0 (No orphan bill)'}
                </div>
              </div>

              {/* Payments */}
              <div className="p-4 space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Table: Payment
                </span>
                <div className="flex items-center justify-center gap-4 text-slate-800">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Before</span>
                    <span className="text-2xl font-bold font-mono">{result.beforeState.payments}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <div className="text-left">
                    <span className="text-xs text-slate-400 block">After</span>
                    <span
                      className={`text-2xl font-bold font-mono ${
                        result.mode === 'commit' ? 'text-emerald-600' : 'text-slate-800'
                      }`}
                    >
                      {result.afterState.payments}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  {result.mode === 'commit' ? '+1 row committed' : 'Net change: 0 (No partial payment)'}
                </div>
              </div>
            </div>
          </div>

          {/* Step-by-Step Execution Timeline */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Single-Connection Transaction Execution Log
            </h3>

            <div className="space-y-3 font-mono text-xs">
              {result.steps?.map((step: any) => (
                <div
                  key={step.step}
                  className={`p-3 rounded-lg border flex flex-col gap-1.5 ${
                    step.status === 'SUCCESS'
                      ? 'bg-slate-50 border-slate-200 text-slate-800'
                      : step.status === 'FAILED'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600 font-sans">
                      Step {step.step}: {step.status}
                    </span>
                    {step.executionTimeMs !== undefined && (
                      <span className="text-[11px] text-slate-400">
                        {step.executionTimeMs} ms
                      </span>
                    )}
                  </div>
                  <pre className="text-[11px] bg-slate-900 text-sky-300 p-2 rounded overflow-x-auto">
                    {step.statement}
                  </pre>
                  <span className="text-[11px] text-slate-600 font-sans">
                    {step.details}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Academic ACID Principles Explanation for Viva */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-sky-700">
            A · Atomicity
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            All database operations in the transaction (Appointment, Bill, Payment) succeed together or fail together. If any failure occurs, MySQL applies undo logs to completely revert uncommitted changes.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            C · Consistency
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Database state transitions only between valid states. Foreign key integrity between Patient(p_id), Doctor(id), Bill(appointment_id), and Payment(bill_id) is strictly preserved.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700">
            I · Isolation
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            InnoDB uses REPEATABLE READ isolation. Concurrent transactions cannot see uncommitted appointment or bill insertions (preventing dirty reads and non-repeatable reads).
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700">
            D · Durability
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Once a transaction is committed, changes are written to the InnoDB write-ahead log (WAL) and tablespace files on disk, ensuring persistence even in the event of an unexpected server shutdown.
          </p>
        </div>
      </div>
    </div>
  );
};
