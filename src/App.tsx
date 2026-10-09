/**
 * CampusOne - One campus. One platform. Smarter operations.
 * Sapthagiri NPS University Hackathon Prototype
 * Designed & Developed by Jathin.V
 */

import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import {
  auth,
  onAuthStateChanged,
  signOut,
} from './services/mockFirebase';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LoginScreen } from './components/LoginScreen';
import { AdminSuggestionsModal } from './components/AdminSuggestionsModal';
import { MaintenanceHub } from './pages/MaintenanceHub';
import { AcademicVault } from './pages/AcademicVault';
import { CampusEvents } from './pages/CampusEvents';
import { DigitalAttendance } from './pages/DigitalAttendance';
import { runAutomatedTests } from './utils/testRunner';
import { safeGetItem, safeSetItem } from './utils/safeStorage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'maintenance' | 'vault' | 'events' | 'attendance'>('maintenance');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => auth.currentUser);
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);

  // TESTING FIX: Run automated test suite silently on application page load
  useEffect(() => {
    runAutomatedTests();
  }, []);

  // Requirement 1: Robust dark mode loaded from and saved to localStorage with safeStorage
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = safeGetItem('campusone_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Dark mode effect toggling .dark class on root document
  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        safeSetItem('campusone_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        safeSetItem('campusone_theme', 'light');
      }
    } catch (e) {
      console.error('Theme sync error', e);
    }
  }, [isDark]);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const toggleDarkMode = () => {
    setIsDark(prev => !prev);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  // Requirement 7: STRICT AUTH GUARD
  // If unauthenticated, the entire navbar and all 4 pages are completely hidden behind the mandatory login screen!
  if (!currentUser) {
    return (
      <LoginScreen
        onSuccess={() => {
          // Auth listener automatically updates currentUser state
        }}
        isDark={isDark}
        toggleDarkMode={toggleDarkMode}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Navigation Bar */}
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        currentUser={currentUser}
        onOpenAuth={() => {}}
        onSignOut={handleSignOut}
        isDark={isDark}
        toggleDarkMode={toggleDarkMode}
        onOpenSuggestions={() => setIsSuggestionsModalOpen(true)}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        {currentPage === 'maintenance' && (
          <MaintenanceHub
            currentUser={currentUser}
            onOpenAuth={() => {}}
          />
        )}
        {currentPage === 'vault' && (
          <AcademicVault
            currentUser={currentUser}
            onOpenAuth={() => {}}
          />
        )}
        {currentPage === 'events' && (
          <CampusEvents
            currentUser={currentUser}
            onOpenAuth={() => {}}
          />
        )}
        {currentPage === 'attendance' && (
          <DigitalAttendance
            currentUser={currentUser}
            onOpenAuth={() => {}}
          />
        )}
      </main>

      {/* Universal Footer */}
      <Footer
        onNavigate={setCurrentPage}
        currentUser={currentUser}
      />

      {/* Requirement 6: Admin View for Suggestions Modal */}
      {currentUser.role === 'Admin' && (
        <AdminSuggestionsModal
          isOpen={isSuggestionsModalOpen}
          onClose={() => setIsSuggestionsModalOpen(false)}
        />
      )}
    </div>
  );
}
