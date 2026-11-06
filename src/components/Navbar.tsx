import React from 'react';
import { User } from '../types';
import { Stethoscope, ShieldCheck, UserCheck, LogOut, Database, Terminal, FileCode2 } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSwitchDemo: (role: 'admin' | 'doctor' | 'patient') => void;
  onOpenErDiagram: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentTab,
  setCurrentTab,
  onOpenAuth,
  onLogout,
  onSwitchDemo,
  onOpenErDiagram
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Top Academic Ribbon for PES University Evaluation */}
      <div className="bg-slate-900 text-slate-300 px-4 py-1.5 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2 tracking-wide font-medium">
          <span className="text-sky-400 font-semibold">PES University</span>
          <span>·</span>
          <span>Dept of Computer Science &amp; Engineering</span>
          <span>·</span>
          <span className="text-slate-400">DBMS Mini-Project (Aug-Dec 2026)</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenErDiagram}
            className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-medium transition-colors"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>10-Table Schema &amp; ER Diagram</span>
          </button>
          <span>·</span>
          <span className="text-emerald-400 font-mono text-[11px]">MySQL 85% + MongoDB 15%</span>
        </div>
      </div>

      {/* Main Top Bar Contract: 3 Zones */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-sm group-hover:bg-sky-700 transition-colors">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight leading-tight block">
                PES Healthcare
              </span>
              <span className="text-[11px] text-slate-500 font-medium tracking-tight block">
                Smart Doctor Appointment System
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setCurrentTab('home')}
            className={`whitespace-nowrap transition-colors ${
              currentTab === 'home' ? 'text-sky-600 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setCurrentTab('doctors')}
            className={`whitespace-nowrap transition-colors ${
              currentTab === 'doctors' ? 'text-sky-600 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Find Doctors
          </button>
          {currentUser && (
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`whitespace-nowrap transition-colors ${
                currentTab === 'dashboard' ? 'text-sky-600 font-semibold' : 'hover:text-slate-900'
              }`}
            >
              {currentUser.role === 'admin'
                ? 'Admin Control'
                : currentUser.role === 'doctor'
                ? 'Doctor Portal'
                : 'Patient Portal'}
            </button>
          )}
          <button
            onClick={() => setCurrentTab('acid_demo')}
            className={`whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              currentTab === 'acid_demo' ? 'text-sky-600 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-sky-500" />
            <span>ACID Simulator</span>
          </button>
          <button
            onClick={() => setCurrentTab('query_lab')}
            className={`whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              currentTab === 'query_lab' ? 'text-sky-600 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4 text-emerald-500" />
            <span>DBMS Query Lab</span>
          </button>
        </nav>

        {/* Zone 3: Actions & Quick Evaluator Role Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Evaluator Role Switcher for PES University Viva */}
          <div className="hidden lg:flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <span className="px-2 text-slate-600">Test As:</span>
            <button
              onClick={() => onSwitchDemo('admin')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                currentUser?.role === 'admin'
                  ? 'bg-white text-sky-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Admin role (Total hospital control, inventory, ACID demo, MongoDB logs)"
            >
              Admin
            </button>
            <button
              onClick={() => onSwitchDemo('doctor')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                currentUser?.role === 'doctor'
                  ? 'bg-white text-sky-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Doctor role (Dr. Rajesh Sharma, MD Cardiology - Write Prescriptions, Dispense Meds)"
            >
              Doctor
            </button>
            <button
              onClick={() => onSwitchDemo('patient')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                currentUser?.role === 'patient'
                  ? 'bg-white text-sky-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Patient role (Rohit Verma - Book appointments, Pay bills, View lab reports)"
            >
              Patient
            </button>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-semibold text-slate-800 block truncate max-w-[140px]">
                  {currentUser.name || currentUser.email}
                </span>
                <span className="text-[11px] text-sky-600 font-medium capitalize block">
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors whitespace-nowrap"
            >
              Sign In / Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
