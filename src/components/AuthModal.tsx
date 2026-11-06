import React, { useState } from 'react';
import { api, setAuthToken } from '../lib/api';
import { User } from '../types';
import { X, Lock, Mail, UserPlus, LogIn, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Patient registration fields
  const [fName, setFName] = useState('');
  const [lName, setLName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [dob, setDob] = useState('1998-05-15');
  const [street, setStreet] = useState('100 Feet Road, Indiranagar');
  const [city, setCity] = useState('Bengaluru');
  const [pincode, setPincode] = useState('560038');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login({ email, password });
      setAuthToken(res.token);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.registerPatient({
        f_name: fName,
        l_name: lName,
        email,
        password,
        gender,
        blood_group: bloodGroup,
        dob,
        street,
        city,
        pincode
      });
      setAuthToken(res.token);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'admin' | 'doctor' | 'patient') => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.switchDemoRole(role);
      setAuthToken(res.token);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-sky-600" />
              <span>
                {mode === 'login'
                  ? 'Sign in to PES Healthcare'
                  : mode === 'register'
                  ? 'Patient Registration (MySQL Patient)'
                  : 'Account Recovery'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Role-Based Access Control · BCrypt &amp; JWT Verification
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Evaluation Quick-Access Box */}
        <div className="px-6 pt-4 pb-2 bg-sky-50/50 border-b border-sky-100">
          <span className="text-[11px] font-semibold text-sky-800 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Faculty Quick Demonstration Accounts:</span>
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="py-1.5 px-2 rounded-lg bg-white border border-sky-200 text-sky-900 text-[11px] font-bold hover:bg-sky-100 shadow-2xs transition-colors"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('doctor')}
              className="py-1.5 px-2 rounded-lg bg-white border border-sky-200 text-sky-900 text-[11px] font-bold hover:bg-sky-100 shadow-2xs transition-colors"
            >
              Doctor
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('patient')}
              className="py-1.5 px-2 rounded-lg bg-white border border-sky-200 text-sky-900 text-[11px] font-bold hover:bg-sky-100 shadow-2xs transition-colors"
            >
              Patient
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto text-xs space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. admin@pes.edu, rajesh.sharma@pes.edu, rohit.verma@gmail.com"
                    className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Demo Password: Password@123"
                    className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-sky-600 hover:underline"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-sky-600 font-semibold hover:underline"
                >
                  New Patient? Register here
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                <span>Log In</span>
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">First Name *</label>
                  <input
                    type="text"
                    required
                    value={fName}
                    onChange={e => setFName(e.target.value)}
                    placeholder="Rohit"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lName}
                    onChange={e => setLName(e.target.value)}
                    placeholder="Verma"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@gmail.com"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Password *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Gender *</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Blood Group *</label>
                  <select
                    value={bloodGroup}
                    onChange={e => setBloodGroup(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Street Address *</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  placeholder="e.g. 14 Ring Road, Banashankari"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Bengaluru"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={e => setPincode(e.target.value)}
                    placeholder="560085"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-800 text-[11px]">
                Note: Age is calculated dynamically from DOB via MySQL function <code>fn_calculate_patient_age()</code>. No age column is stored in table.
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sky-600 hover:underline"
                >
                  Already registered? Sign in
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>Register &amp; Create Account</span>
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed">
                In this DBMS mini-project demonstration, all test accounts share the default demo password:
                <strong className="block font-mono text-sky-700 text-sm mt-1">Password@123</strong>
              </p>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full py-2 rounded-xl bg-slate-900 text-white font-semibold"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
