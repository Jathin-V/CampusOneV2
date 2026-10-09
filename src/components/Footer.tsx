import React, { useState } from 'react';
import {
  Lightbulb,
  Mail,
  Phone,
  MapPin,
  Heart,
  Send,
  CheckCircle2,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '../types';
import { isValidEmail, validateRequiredField } from '../utils/parsers';
import { addDoc, collection, db } from '../services/mockFirebase';

interface FooterProps {
  onNavigate: (page: 'maintenance' | 'vault' | 'events' | 'attendance') => void;
  currentUser: UserProfile | null;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, currentUser }) => {
  const [suggestionModalOpen, setSuggestionModalOpen] = useState(false);
  const [suggestionName, setSuggestionName] = useState(currentUser?.displayName || '');
  const [suggestionEmail, setSuggestionEmail] = useState(currentUser?.email || '');
  const [suggestionCategory, setSuggestionCategory] = useState<'Infrastructure' | 'Academics' | 'Events' | 'Canteen & Campus' | 'Other'>('Infrastructure');
  const [suggestionIdea, setSuggestionIdea] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!validateRequiredField(suggestionName)) {
      setValidationError('Please provide your name or role title.');
      return;
    }
    if (!validateRequiredField(suggestionEmail)) {
      setValidationError('Please provide your official email address.');
      return;
    }
    if (!isValidEmail(suggestionEmail)) {
      setValidationError('Please enter a valid institutional email format.');
      return;
    }
    if (!validateRequiredField(suggestionIdea, 5)) {
      setValidationError('Please describe your idea with at least 5 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'suggestions'), {
        authorName: suggestionName.trim() || 'Anonymous Scholar',
        authorEmail: suggestionEmail.trim() || 'student@campus.edu',
        category: suggestionCategory,
        idea: suggestionIdea.trim(),
        createdAt: new Date().toISOString(),
        status: 'Reviewed',
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setSuggestionModalOpen(false);
        setSuggestionIdea('');
        setValidationError(null);
      }, 1600);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="w-full bg-slate-900 text-slate-300 border-t border-slate-800 transition-colors">
      {/* Top Banner: Campus Suggestion Callout */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/60 to-slate-900 border-b border-indigo-950/60 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center md:text-left">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Lightbulb className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white tracking-tight">
                Have an idea to improve the campus?
              </h4>
              <p className="text-xs text-indigo-200/80">
                Submit academic, infrastructure, or operational proposals directly to the administration.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (currentUser) {
                setSuggestionName(currentUser.displayName);
                setSuggestionEmail(currentUser.email);
              }
              setSuggestionModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 hover:scale-102 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Share a Suggestion</span>
          </button>
        </div>
      </div>

      {/* Main Footer Links & University Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* University Identity */}
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                Institution
              </span>
              <h3 className="text-lg font-black text-white tracking-tight mt-1">
                SAPTHAGIRI NPS UNIVERSITY
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Empowering technological innovation, research brilliance, and sustainable engineering leadership.
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>14/5, Chikkasandra, Hesaraghatta Main Road, Bengaluru, Karnataka 560057</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <a href="mailto:info@sapthagiri.edu.in" className="hover:text-white transition-colors">
                  info@sapthagiri.edu.in
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                <a href="tel:+918028372800" className="hover:text-white transition-colors">
                  +91 80 2837 2800
                </a>
              </div>
            </div>
          </div>

          {/* Quick Platform Modules */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Platform Modules
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('maintenance')}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Maintenance Hub
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('vault')}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Academic Vault
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('events')}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Campus Events
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('attendance')}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Digital Attendance
                </button>
              </li>
            </ul>
          </div>

          {/* Institutional Links & Policies */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Governance & Policies
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a href="#contact" onClick={e => { e.preventDefault(); alert('Official university contact desk: info@sapthagiri.edu.in'); }} className="hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#privacy" onClick={e => { e.preventDefault(); alert('CampusOne Privacy Policy: All student USNs and faculty credentials are encrypted in local university storage.'); }} className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" onClick={e => { e.preventDefault(); alert('CampusOne Terms of Use: Strictly for authenticated Sapthagiri NPS University scholars, staff, and facilities personnel.'); }} className="hover:text-white transition-colors">
                  Terms of Use
                </a>
              </li>
              <li>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800">
                  Campus Service Status: 100% Operational
                </span>
              </li>
            </ul>
          </div>

          {/* Social Channels & Connect */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Connect With Us
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Stay updated with academic symposiums, hackathon broadcasts, and placements.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 border border-slate-700"
              >
                <span>LinkedIn</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 border border-slate-700"
              >
                <span>Instagram</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 border border-slate-700"
              >
                <span>YouTube</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            © 2026 Sapthagiri NPS University. All rights reserved.
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <span>Designed &amp; Developed by</span>
            <span className="text-indigo-400 font-bold bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/80">
              Jathin.V
            </span>
          </div>
        </div>
      </div>

      {/* Suggestion Box Modal */}
      {suggestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-200">
            <button
              type="button"
              onClick={() => setSuggestionModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Share a Campus Suggestion</h3>
                <p className="text-xs text-slate-400">
                  Help make Sapthagiri NPS University smarter and more efficient.
                </p>
              </div>
            </div>

            {submitted ? (
              <div className="py-10 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Suggestion Recorded!</h4>
                <p className="text-xs text-slate-400">
                  Thank you for contributing to campus advancement.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitSuggestion} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={suggestionName}
                      onChange={e => setSuggestionName(e.target.value)}
                      placeholder="e.g. Student or Faculty"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Official Email
                    </label>
                    <input
                      type="email"
                      required
                      value={suggestionEmail}
                      onChange={e => setSuggestionEmail(e.target.value)}
                      placeholder="student@campus.edu"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Suggestion Domain
                  </label>
                  <select
                    value={suggestionCategory}
                    onChange={e => setSuggestionCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Infrastructure">Infrastructure &amp; Smart Facilities</option>
                    <option value="Academics">Academics &amp; Curriculum Resources</option>
                    <option value="Events">Hackathons &amp; Campus Events</option>
                    <option value="Canteen & Campus">Canteen, Sports &amp; Transport</option>
                    <option value="Other">Other Operational Enhancements</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Describe Your Idea / Proposal
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={suggestionIdea}
                    onChange={e => setSuggestionIdea(e.target.value)}
                    placeholder="Provide clear details on what should be added or upgraded..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 resize-none"
                  />
                </div>

                {validationError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
                    {validationError}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSuggestionModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md disabled:opacity-60"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Submitting...' : 'Send Suggestion'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </footer>
  );
};
