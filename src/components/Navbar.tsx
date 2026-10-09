import React, { useState, useRef, useEffect } from 'react';
import {
  Wrench,
  BookOpen,
  CalendarDays,
  UserCheck,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
  LogIn,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Building2,
  Check,
  Lightbulb,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { MASTER_ADMIN_EMAIL, switchActiveUserRole } from '../services/mockFirebase';

interface NavbarProps {
  currentPage: 'maintenance' | 'vault' | 'events' | 'attendance';
  setCurrentPage: (page: 'maintenance' | 'vault' | 'events' | 'attendance') => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  isDark: boolean;
  toggleDarkMode: () => void;
  onOpenSuggestions?: () => void;
}

const PAGES_INFO = [
  {
    id: 'maintenance' as const,
    name: 'Maintenance Hub',
    tagline: 'AI triage, incident tracking & facility dispatch',
    icon: Wrench,
    badgeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  {
    id: 'vault' as const,
    name: 'Academic Vault',
    tagline: 'Engineering cycles, notes & digital library',
    icon: BookOpen,
    badgeColor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
  },
  {
    id: 'events' as const,
    name: 'Campus Events',
    tagline: 'Hackathons, fests, workshops & registrations',
    icon: CalendarDays,
    badgeColor: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  },
  {
    id: 'attendance' as const,
    name: 'Digital Attendance',
    tagline: 'Smart room parser, instant registry & reports',
    icon: UserCheck,
    badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  },
];

const AVAILABLE_ROLES: UserRole[] = ['Admin', 'Teacher', 'Lab Instructor', 'Technician', 'Student'];

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  setCurrentPage,
  currentUser,
  onOpenAuth,
  onSignOut,
  isDark,
  toggleDarkMode,
  onOpenSuggestions,
}) => {
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const pageRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pageRef.current && !pageRef.current.contains(e.target as Node)) {
        setPageDropdownOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activePageInfo = PAGES_INFO.find(p => p.id === currentPage) || PAGES_INFO[0];
  const PageIcon = activePageInfo.icon;

  // STRICT SECURITY REQUIREMENT:
  // Role Switcher Dropdown MUST strictly be hidden from Technicians!
  // Only accessible when Master Admin is active AND current role is NOT Technician.
  const isTechnician = currentUser?.role === 'Technician';
  const isMasterAdmin = currentUser?.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
  const canSwitchRole = isMasterAdmin && !isTechnician;

  const getRoleBadgeClasses = (role?: UserRole) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Teacher':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Lab Instructor':
        return 'bg-teal-100 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      case 'Technician':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'Student':
      default:
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'CO';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    // REQUIREMENT: Under 1024px, navbar MUST scroll naturally with page content (relative) instead of permanently fixed!
    <header className="relative lg:sticky lg:top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 lg:h-20 gap-3">
          {/* Logo & University Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              onClick={() => setCurrentPage('maintenance')}
              className="cursor-pointer flex items-center gap-2.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                    Campus<span className="text-indigo-600 dark:text-indigo-400">One</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    SNPSU
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight truncate max-w-[200px] sm:max-w-xs">
                  One campus. One platform. Smarter operations.
                </span>
              </div>
            </div>

            {/* Dedicated 4-Page Navigation Dropdown Menu */}
            <div className="relative ml-2 sm:ml-4" ref={pageRef}>
              <button
                type="button"
                onClick={() => setPageDropdownOpen(!pageDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300/60 dark:border-slate-700/80 shadow-xs transition-all"
                aria-expanded={pageDropdownOpen}
              >
                <PageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="truncate max-w-[130px] sm:max-w-none">{activePageInfo.name}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    pageDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {pageDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    CampusOne Modules (4 Pages)
                  </div>
                  <div className="space-y-1">
                    {PAGES_INFO.map(page => {
                      const Icon = page.icon;
                      const isSelected = page.id === currentPage;
                      return (
                        <button
                          key={page.id}
                          type="button"
                          onClick={() => {
                            setCurrentPage(page.id);
                            setPageDropdownOpen(false);
                          }}
                          className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/60'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-lg border ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-transparent'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold truncate">{page.name}</span>
                              {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {page.tagline}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Admin-Only View Suggestions Button (Requirement 6) */}
            {currentUser?.role === 'Admin' && onOpenSuggestions && (
              <button
                type="button"
                onClick={onOpenSuggestions}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                title="View Campus Suggestions (Admin Only)"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">View Suggestions</span>
              </button>
            )}

            {/* Master Admin ONLY Role Switcher Dropdown (Strictly hidden from Technicians) */}
            {canSwitchRole && (
              <div className="relative" ref={roleRef}>
                <button
                  type="button"
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors"
                  title="Master Admin Super Role Switcher"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-spin-slow" />
                  <span className="hidden sm:inline">Role:</span>
                  <span className="font-bold underline decoration-dotted">{currentUser.role}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {roleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50">
                    <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Master Admin Simulator
                    </div>
                    <p className="px-3 pb-2 text-[11px] text-slate-500 dark:text-slate-400">
                      Switch active role to test RBAC permissions instantly:
                    </p>
                    <div className="space-y-1">
                      {AVAILABLE_ROLES.map(role => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => {
                            switchActiveUserRole(role);
                            setRoleDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                            currentUser.role === role
                              ? 'bg-purple-600 text-white'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span>{role}</span>
                          {currentUser.role === role && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile & Auth */}
            {currentUser ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {getInitials(currentUser.displayName)}
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                      {currentUser.displayName}
                    </span>
                    <span
                      className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded-md border w-fit ${getRoleBadgeClasses(
                        currentUser.role
                      )}`}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-3 z-50">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center">
                        {getInitials(currentUser.displayName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                          {currentUser.displayName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {currentUser.email}
                        </div>
                        <div className="mt-1">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${getRoleBadgeClasses(
                              currentUser.role
                            )}`}
                          >
                            {currentUser.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 px-1 py-1">
                      {currentUser.department && <div>🏛️ {currentUser.department}</div>}
                      {currentUser.studentId && <div>🎓 USN: {currentUser.studentId}</div>}
                      {currentUser.employeeId && <div>💼 ID: {currentUser.employeeId}</div>}
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          onSignOut();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
