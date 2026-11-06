/**
 * PES UNIVERSITY - DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
 * COURSE: DATABASE MANAGEMENT SYSTEMS (DBMS MINI-PROJECT)
 * PROJECT: SMART HEALTHCARE & DOCTOR APPOINTMENT MANAGEMENT SYSTEM
 */

import React, { useState, useEffect } from 'react';
import { User } from './types';
import { api, getAuthToken, clearAuthToken } from './lib/api';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { DoctorBrowser } from './components/DoctorBrowser';
import { PatientPortal } from './components/PatientPortal';
import { DoctorPortal } from './components/DoctorPortal';
import { AdminPortal } from './components/AdminPortal';
import { AcidSimulator } from './components/AcidSimulator';
import { DbmsQueryLab } from './components/DbmsQueryLab';
import { AuthModal } from './components/AuthModal';
import { ErDiagramModal } from './components/ErDiagramModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isErDiagramOpen, setIsErDiagramOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Restore session from JWT
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.getMe()
        .then(res => {
          if (res.user) {
            setCurrentUser(res.user);
          }
        })
        .catch(() => {
          clearAuthToken();
          setCurrentUser(null);
        })
        .finally(() => setInitialLoading(false));
    } else {
      setInitialLoading(false);
    }
  }, []);

  const handleLogout = () => {
    clearAuthToken();
    setCurrentUser(null);
    setCurrentTab('home');
  };

  const handleSwitchDemo = async (role: 'admin' | 'doctor' | 'patient') => {
    try {
      const res = await api.switchDemoRole(role);
      localStorage.setItem('pes_healthcare_token', res.token);
      setCurrentUser(res.user);
      setCurrentTab('dashboard');
    } catch (err) {
      console.error('Demo switch error:', err);
    }
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentTab('dashboard');
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <span className="text-xs font-semibold text-slate-600 font-mono block">
            Connecting to PES Healthcare Database...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-800 antialiased selection:bg-sky-100 selection:text-sky-900">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onSwitchDemo={handleSwitchDemo}
        onOpenErDiagram={() => setIsErDiagramOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <LandingPage
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onSwitchDemo={handleSwitchDemo}
            onNavigateToDoctors={() => setCurrentTab('doctors')}
            onNavigateToTab={setCurrentTab}
            onOpenErDiagram={() => setIsErDiagramOpen(true)}
          />
        )}

        {currentTab === 'doctors' && (
          <DoctorBrowser
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onAppointmentBooked={() => {
              if (currentUser?.role === 'patient') {
                setCurrentTab('dashboard');
              }
            }}
          />
        )}

        {currentTab === 'dashboard' && currentUser && (
          <>
            {currentUser.role === 'admin' && <AdminPortal currentUser={currentUser} />}
            {currentUser.role === 'doctor' && <DoctorPortal currentUser={currentUser} />}
            {currentUser.role === 'patient' && (
              <PatientPortal
                currentUser={currentUser}
                onNavigateToDoctors={() => setCurrentTab('doctors')}
              />
            )}
          </>
        )}

        {currentTab === 'acid_demo' && <AcidSimulator />}

        {currentTab === 'query_lab' && <DbmsQueryLab />}
      </main>

      {/* Academic Footer */}
      <Footer
        onOpenErDiagram={() => setIsErDiagramOpen(true)}
        onNavigate={setCurrentTab}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* 10-Table Schema & ER Diagram Modal */}
      <ErDiagramModal
        isOpen={isErDiagramOpen}
        onClose={() => setIsErDiagramOpen(false)}
      />
    </div>
  );
}
