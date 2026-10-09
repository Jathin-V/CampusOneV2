import React, { useState, useEffect } from 'react';
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  RotateCcw,
  Camera,
  ShieldAlert,
  HardHat,
  Filter,
  Search,
  PlusCircle,
  FileCheck,
  Zap,
  Info,
  Check,
  X,
  History,
} from 'lucide-react';
import {
  MaintenanceTicket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  UserProfile,
} from '../types';
import {
  db,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
} from '../services/mockFirebase';
import {
  simulateGeminiCategorize,
  checkAntiSpamDuplicate,
  generateTechnicianActionPlan,
} from '../services/geminiMock';

interface MaintenanceHubProps {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
}

export const MaintenanceHub: React.FC<MaintenanceHubProps> = ({
  currentUser,
  onOpenAuth,
}) => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<TicketCategory>('Classroom Utilities');
  const [priority, setPriority] = useState<TicketPriority>('Normal');
  const [description, setDescription] = useState('');
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  // AI states
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [aiRawOutput, setAiRawOutput] = useState<string | null>(null);
  const [actionPlanLoadingId, setActionPlanLoadingId] = useState<string | null>(null);

  // Resolution modal state (Technician & Admin)
  const [resolveTicketModal, setResolveTicketModal] = useState<MaintenanceTicket | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [simulatedPhotoName, setSimulatedPhotoName] = useState<string | null>(null);

  // Reopen modal state (Student / Teacher / Lab Instructor)
  const [reopenTicketModal, setReopenTicketModal] = useState<MaintenanceTicket | null>(null);
  const [reopenReason, setReopenReason] = useState('');

  // Subscribe to live tickets in mock Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tickets'), snapshot => {
      const list: MaintenanceTicket[] = snapshot.docs.map(d => d.data() as MaintenanceTicket);
      setTickets(list);
    });
    return () => unsub();
  }, []);

  const userRole = currentUser?.role || 'Student';

  // Role permissions
  const canSubmitTicket = userRole === 'Student' || userRole === 'Teacher' || userRole === 'Lab Instructor';
  const isTechnician = userRole === 'Technician';
  const isAdmin = userRole === 'Admin';
  // RBAC Security Enforcement: ONLY Technicians get the Action Plan feature. Admins must NOT see it!
  const canAccessActionPlan = isTechnician && !isAdmin;
  const canResolve = isTechnician || isAdmin;
  const canReopen = userRole === 'Student' || userRole === 'Teacher' || userRole === 'Lab Instructor';

  // Metrics
  const activeIssues = tickets.filter(t => t.status !== 'Resolved').length;
  const extremeIssues = tickets.filter(t => t.priority === 'Extreme' && t.status !== 'Resolved').length;
  const totalSolved = tickets.filter(t => t.status === 'Resolved').length;
  const avgResolutionHours = '3.8 hrs';

  // AI Auto-Categorize & Prioritize
  const handleAutoCategorize = async () => {
    if (!title && !description) {
      alert('Please enter at least a brief title or description for Gemini AI to analyze.');
      return;
    }
    setIsCategorizing(true);
    setAiRawOutput(null);
    try {
      const result = await simulateGeminiCategorize(title, description, location);
      setCategory(result.category);
      setPriority(result.priority);
      setAiRawOutput(result.rawJson);
    } catch {
      alert('Error running AI categorization.');
    } finally {
      setIsCategorizing(false);
    }
  };

  // Submit Ticket with Anti-Spam AI
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!canSubmitTicket) {
      alert('Technicians cannot submit new maintenance tickets. Please sign in as Faculty or Student.');
      return;
    }

    setFormValidationError(null);
    if (!title.trim() || title.trim().length < 3) {
      setFormValidationError('Please enter a descriptive title (at least 3 characters).');
      return;
    }
    if (!location.trim()) {
      setFormValidationError('Please enter the location or room code (e.g. A102, B204).');
      return;
    }
    if (!description.trim() || description.trim().length < 8) {
      setFormValidationError('Please enter detailed issue descriptions (at least 8 characters).');
      return;
    }

    // REQUIREMENT: Anti-Spam AI on submit
    const duplicateMatch = await checkAntiSpamDuplicate(title, description, location, tickets);
    if (duplicateMatch) {
      // Increment upvote on existing ticket
      const newUpvoteCount = (duplicateMatch.upvoteCount || 1) + 1;
      await updateDoc(doc(db, 'tickets', duplicateMatch.id), {
        upvoteCount: newUpvoteCount,
      });

      alert(
        `🛡️ Anti-Spam AI Detection:\nSimilar issue already reported (#${duplicateMatch.id}: "${duplicateMatch.title}").\nUpvoted to boost priority to #${newUpvoteCount}!`
      );
      setShowCreateForm(false);
      resetForm();
      return;
    }

    // Fresh ticket creation
    const newTicket: Partial<MaintenanceTicket> = {
      id: `TICK-${Math.floor(100 + Math.random() * 900)}`,
      title: title.trim(),
      location: location.trim().toUpperCase(),
      category,
      priority,
      description: description.trim(),
      status: 'Pending',
      reportedBy: currentUser.displayName,
      reportedByEmail: currentUser.email,
      reportedByRole: currentUser.role,
      createdAt: new Date().toISOString(),
      upvoteCount: 1,
      reopenCount: 0,
      reopenHistory: [],
    };

    await addDoc(collection(db, 'tickets'), newTicket);
    setShowCreateForm(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setLocation('');
    setDescription('');
    setCategory('Classroom Utilities');
    setPriority('Normal');
    setAiRawOutput(null);
    setFormValidationError(null);
  };

  // Technician Action Plan generation
  const handleGenerateActionPlan = async (ticket: MaintenanceTicket) => {
    // CRITICAL RBAC FIX: Action Plan is strictly restricted to Technicians. Admins are blocked!
    if (!canAccessActionPlan || currentUser?.role !== 'Technician') {
      alert('Security Violation: Only Technicians are authorized to generate action plans.');
      return;
    }

    setActionPlanLoadingId(ticket.id);
    try {
      const plan = await generateTechnicianActionPlan(ticket);
      await updateDoc(doc(db, 'tickets', ticket.id), {
        actionPlan: plan,
        status: ticket.status === 'Pending' ? 'In Progress' : ticket.status,
      });
    } finally {
      setActionPlanLoadingId(null);
    }
  };

  // Confirm Resolve (Technician / Admin)
  const handleConfirmResolve = async () => {
    if (!resolveTicketModal) return;

    await updateDoc(doc(db, 'tickets', resolveTicketModal.id), {
      status: 'Resolved',
      resolutionNotes: resolutionNotes || 'Issue verified and repaired to university specifications.',
      resolvedAt: new Date().toISOString(),
      resolvedBy: `${currentUser?.displayName} (${currentUser?.role})`,
      resolutionPhotoUrl: simulatedPhotoName
        ? `mock://storage.campusone.internal/${simulatedPhotoName}`
        : 'mock://storage.campusone.internal/work_order_done.jpg',
    });

    setResolveTicketModal(null);
    setResolutionNotes('');
    setSimulatedPhotoName(null);
  };

  // Confirm Reopen with mandatory reason
  const handleConfirmReopen = async () => {
    if (!reopenTicketModal) return;
    if (!reopenReason.trim()) {
      alert('A detailed explanation is mandatory to reopen a resolved ticket.');
      return;
    }

    const auditItem = {
      reopenedAt: new Date().toISOString(),
      reopenedBy: currentUser?.displayName || 'Campus User',
      reopenedByRole: currentUser?.role || 'Student',
      reason: reopenReason.trim(),
    };

    const newHistory = [...(reopenTicketModal.reopenHistory || []), auditItem];

    await updateDoc(doc(db, 'tickets', reopenTicketModal.id), {
      status: 'In Progress',
      reopenCount: (reopenTicketModal.reopenCount || 0) + 1,
      reopenHistory: newHistory,
    });

    setReopenTicketModal(null);
    setReopenReason('');
  };

  // Upvote ticket
  const handleUpvote = async (ticket: MaintenanceTicket) => {
    await updateDoc(doc(db, 'tickets', ticket.id), {
      upvoteCount: (ticket.upvoteCount || 1) + 1,
    });
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
    if (selectedStatus === 'Active' && t.status === 'Resolved') return false;
    if (selectedStatus !== 'All' && selectedStatus !== 'Active' && t.status !== selectedStatus)
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="min-w-0 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Page Title & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Module 1
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Sapthagiri NPS University Facilities &amp; Infrastructure
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Maintenance Hub
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            AI-powered triage, smart duplicate suppression, work order dispatch, and technician action plans.
          </p>
        </div>

        {/* Submit Ticket Action */}
        <div>
          {canSubmitTicket ? (
            <button
              type="button"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{showCreateForm ? 'Close Report Form' : 'Report New Issue'}</span>
            </button>
          ) : isTechnician ? (
            <div className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-2">
              <HardHat className="w-4 h-4 shrink-0" />
              <span>Technician Mode: Direct work order execution &amp; action plan generation enabled.</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* 4 Metric Cards (Clickable & Expandable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Issues */}
        <div
          onClick={() => {
            setExpandedMetric(expandedMetric === 'active' ? null : 'active');
            setSelectedStatus('Active');
          }}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            expandedMetric === 'active'
              ? 'ring-2 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700'
              : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Active Issues
            </span>
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {activeIssues}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Pending triage or in progress</span>
            {expandedMetric === 'active' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
          {expandedMetric === 'active' && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              Showing all non-resolved incidents across Campus A/B/C blocks.
            </div>
          )}
        </div>

        {/* Metric 2: Critical / Extreme */}
        <div
          onClick={() => {
            setExpandedMetric(expandedMetric === 'extreme' ? null : 'extreme');
            setSelectedStatus('All');
          }}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            expandedMetric === 'extreme'
              ? 'ring-2 ring-rose-500 bg-rose-50/50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700'
              : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              2. Critical Issues
            </span>
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {extremeIssues}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Extreme severity priority</span>
            {expandedMetric === 'extreme' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
          {expandedMetric === 'extreme' && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              Requires immediate facility containment within 2 hours.
            </div>
          )}
        </div>

        {/* Metric 3: Avg Resolution Time */}
        <div
          onClick={() => setExpandedMetric(expandedMetric === 'time' ? null : 'time')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            expandedMetric === 'time'
              ? 'ring-2 ring-amber-500 bg-amber-50/50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700'
              : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              3. Avg Resolution Time
            </span>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {avgResolutionHours}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>SLA benchmark: 6.0 hrs</span>
            {expandedMetric === 'time' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
          {expandedMetric === 'time' && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              Down 42% this semester due to automated AI tooling dispatch.
            </div>
          )}
        </div>

        {/* Metric 4: Total Solved Problems */}
        <div
          onClick={() => {
            setExpandedMetric(expandedMetric === 'solved' ? null : 'solved');
            setSelectedStatus('Resolved');
          }}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            expandedMetric === 'solved'
              ? 'ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
              : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              4. Total Solved Problems
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {totalSolved}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Verified with photographic proof</span>
            {expandedMetric === 'solved' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
          {expandedMetric === 'solved' && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              Fully verified work orders signed off by campus facility crew.
            </div>
          )}
        </div>
      </div>

      {/* Issue Reporting Form */}
      {showCreateForm && canSubmitTicket && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Log a Campus Facility Incident
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Anti-spam AI automatically matches existing tickets in your room to prevent duplicates.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmitTicket} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Issue Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Overhead projector blinking black screen"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Location / Room Code *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. A102 or B204"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-mono uppercase"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Detailed Description *
                </label>

                {/* Gemini AI Auto-Categorize & Prioritize Button */}
                <button
                  type="button"
                  onClick={handleAutoCategorize}
                  disabled={isCategorizing}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isCategorizing ? 'Analyzing with Gemini...' : 'Auto-Categorize & Prioritize'}</span>
                </button>
              </div>
              <textarea
                required
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe symptoms, noise, sparking, water overflow, or affected equipment..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* AI Output Preview Badge (stripping markdown fences) */}
            {aiRawOutput && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs space-y-1 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Gemini AI Auto-Classification Result</span>
                </div>
                <pre className="text-[11px] font-mono bg-white dark:bg-slate-900 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/60 text-slate-700 dark:text-slate-300 overflow-x-auto">
                  {aiRawOutput}
                </pre>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category Dropdown
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as TicketCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="Electrical">Electrical (Power, Lights, Outlets)</option>
                  <option value="Plumbing">Plumbing (Pipes, Taps, Washrooms)</option>
                  <option value="IT">IT (Wi-Fi, Fiber, Switches, LAN)</option>
                  <option value="Classroom Utilities">Classroom Utilities (Projector, AC, Desks)</option>
                  <option value="Lab Utilities">Lab Utilities (Instruments, Benches, Fumes)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as TicketPriority)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="Normal">Normal (Standard Schedule)</option>
                  <option value="Medium">Medium (Attention within 24h)</option>
                  <option value="Extreme">Extreme (Immediate Hazard / Exam Disruption)</option>
                </select>
              </div>
            </div>

            {formValidationError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{formValidationError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Submit Ticket (with Anti-Spam Check)
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tickets by ID, room, keywords..."
            className="w-full pl-10 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="All">All Categories</option>
            <option value="Electrical">Electrical</option>
            <option value="Plumbing">Plumbing</option>
            <option value="IT">IT</option>
            <option value="Classroom Utilities">Classroom Utilities</option>
            <option value="Lab Utilities">Lab Utilities</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="All">All Statuses</option>
            <option value="Active">All Active (Non-resolved)</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <Info className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No tickets found matching current filters
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Try adjusting your search query or category dropdowns.
            </p>
          </div>
        ) : (
          filteredTickets.map(ticket => {
            const isResolved = ticket.status === 'Resolved';
            const isExtreme = ticket.priority === 'Extreme';

            return (
              <div
                key={ticket.id}
                className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 sm:p-6 transition-all ${
                  isExtreme && !isResolved
                    ? 'border-rose-300 dark:border-rose-900/60 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      #{ticket.id}
                    </span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      📍 {ticket.location}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {ticket.category}
                    </span>

                    {/* Priority badge */}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        ticket.priority === 'Extreme'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                          : ticket.priority === 'Medium'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {ticket.priority}
                    </span>

                    {/* Status badge */}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        ticket.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : ticket.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  {/* Upvote & Reporter Info */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpvote(ticket)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                      title="Upvote to signal priority to facility teams"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{ticket.upvoteCount || 1}</span>
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                  {ticket.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {ticket.description}
                </p>

                {/* Reporter attribution */}
                <div className="text-[11px] text-slate-400 dark:text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                  <span>Reported by: <strong className="text-slate-700 dark:text-slate-300">{ticket.reportedBy}</strong> ({ticket.reportedByRole})</span>
                  <span>•</span>
                  <span>{new Date(ticket.createdAt).toLocaleDateString()} at {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {ticket.reopenCount > 0 && (
                    <span className="text-rose-500 font-bold">
                      • Reopened {ticket.reopenCount} time(s)
                    </span>
                  )}
                </div>

                {/* Resolution Details Card if Resolved */}
                {ticket.status === 'Resolved' && (
                  <div className="mb-4 p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Resolution Verified: {ticket.resolvedBy}</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                        {ticket.resolvedAt && new Date(ticket.resolvedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-emerald-900 dark:text-emerald-200 leading-relaxed">
                      {ticket.resolutionNotes}
                    </p>
                    {ticket.resolutionPhotoUrl && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-300 dark:border-emerald-700">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Photographic proof attached: work_completed_verified.jpg</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Technician On-Demand Action Plan: Strictly visible ONLY to Technicians (Admins blocked) */}
                {canAccessActionPlan && ticket.actionPlan && (
                  <div className="mb-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-900/60">
                      <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                        <HardHat className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>Technician AI Action Plan</span>
                      </div>
                      <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                        ⏱️ Est: {ticket.actionPlan.estimatedTime}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-100/70 dark:bg-amber-900/40 text-amber-950 dark:text-amber-200 text-xs font-medium border border-amber-300/80 dark:border-amber-800">
                      {ticket.actionPlan.safetyCaution}
                    </div>

                    <div>
                      <span className="font-bold text-amber-900 dark:text-amber-200 text-[11px] uppercase tracking-wider">
                        Suggested Tools:
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {ticket.actionPlan.suggestedTools.map((tool, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-[11px] font-medium"
                          >
                            🔧 {tool}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-amber-900 dark:text-amber-200 text-[11px] uppercase tracking-wider">
                        Step-by-Step Procedure:
                      </span>
                      <ol className="list-decimal list-inside space-y-1 mt-1 text-slate-700 dark:text-slate-300">
                        {ticket.actionPlan.actionSteps.map((step, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}

                {/* Audit History: Display full reopen timeline clearly */}
                {ticket.reopenHistory && ticket.reopenHistory.length > 0 && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400 mb-2">
                      <History className="w-3.5 h-3.5" />
                      <span>Audit Trail: Reopen Timeline ({ticket.reopenHistory.length})</span>
                    </div>
                    <div className="space-y-2">
                      {ticket.reopenHistory.map((item, idx) => (
                        <div
                          key={idx}
                          className="pl-3 border-l-2 border-rose-400 dark:border-rose-600 text-[11px] space-y-0.5"
                        >
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                            <span>
                              <strong>{item.reopenedBy}</strong> ({item.reopenedByRole})
                            </span>
                            <span>{new Date(item.reopenedAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 italic font-medium">
                            "{item.reason}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-2">
                    {/* CRITICAL RBAC FIX: Action Plan button MUST ONLY be visible to Technicians. Admins strictly cannot see it! */}
                    {canAccessActionPlan && !isResolved && (
                      <button
                        type="button"
                        onClick={() => handleGenerateActionPlan(ticket)}
                        disabled={actionPlanLoadingId === ticket.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <HardHat className="w-3.5 h-3.5" />
                        <span>
                          {actionPlanLoadingId === ticket.id
                            ? 'Analyzing Tools with AI...'
                            : ticket.actionPlan
                            ? 'Regenerate Plan'
                            : '🛠️ Generate Action Plan'}
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Resolve button: Technician OR Admin can mark resolved */}
                    {canResolve && !isResolved && (
                      <button
                        type="button"
                        onClick={() => setResolveTicketModal(ticket)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Resolve Ticket</span>
                      </button>
                    )}

                    {/* Reopen button: Student / Teacher / Lab Instructor can reopen resolved tickets */}
                    {canReopen && isResolved && (
                      <button
                        type="button"
                        onClick={() => setReopenTicketModal(ticket)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reopen Ticket</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Technician / Admin Resolve Modal with Photo Verification */}
      {resolveTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl">
            <button
              type="button"
              onClick={() => setResolveTicketModal(null)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Mark Ticket Resolved #{resolveTicketModal.id}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Room: {resolveTicketModal.location} • Category: {resolveTicketModal.category}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Resolution Work Summary *
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Cleared drainage union, replaced PIR lighting controller, confirmed 4K HDMI loop."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Photo Verification simulation */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 text-center">
                <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {simulatedPhotoName ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      ✅ {simulatedPhotoName} attached
                    </span>
                  ) : (
                    'Attach Photographic Verification (Simulated Proof)'
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSimulatedPhotoName(`repair_evidence_room_${resolveTicketModal.location.toLowerCase()}.jpg`)
                  }
                  className="mt-2 px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300"
                >
                  {simulatedPhotoName ? 'Take New Photo' : 'Capture / Upload Photo'}
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolveTicketModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResolve}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  Sign Off &amp; Mark Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Reason Reopen Modal */}
      {reopenTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl">
            <button
              type="button"
              onClick={() => setReopenTicketModal(null)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Reopen Ticket #{reopenTicketModal.id}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mandatory justification required for audit history.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Reopening *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reopenReason}
                  onChange={e => setReopenReason(e.target.value)}
                  placeholder="Explain why the issue persists (e.g. Projector resumed flickering after 15 minutes of use)."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReopenTicketModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReopen}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
                >
                  Confirm Reopen &amp; Log to Audit Trail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
