import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Search,
  Filter,
  Sparkles,
  CheckCircle,
  AlertCircle,
  X,
  Share2,
  Bookmark,
  Calendar as CalendarIcon,
  BellRing,
  Award,
  ChevronLeft,
  ChevronRight,
  Heart,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CampusEvent, EventCategory, UserProfile } from '../types';
import {
  db,
  collection,
  onSnapshot,
  isUserRegisteredForEvent,
  toggleEventRegistration,
} from '../services/mockFirebase';

interface CampusEventsProps {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
}

const CATEGORIES: EventCategory[] = ['Technical', 'Clubs', 'Cultural', 'Sports'];

export const CampusEvents: React.FC<CampusEventsProps> = ({ currentUser, onOpenAuth }) => {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventModal, setSelectedEventModal] = useState<CampusEvent | null>(null);

  // Calendar filter state
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Subscribe to live events in mock Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'events'), snapshot => {
      const list: CampusEvent[] = snapshot.docs.map(d => d.data() as CampusEvent);
      setEvents(list);
    });
    return () => unsub();
  }, []);

  const userEmail = currentUser?.email || 'student@campus.edu';

  const handleToggleRegister = (event: CampusEvent) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const wasRegistered = isUserRegisteredForEvent(event.id, userEmail);
    const nowRegistered = toggleEventRegistration(event.id, userEmail);

    if (nowRegistered && !wasRegistered) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }

    // Refresh modal if open
    if (selectedEventModal && selectedEventModal.id === event.id) {
      setSelectedEventModal({
        ...selectedEventModal,
        registeredCount: nowRegistered
          ? selectedEventModal.registeredCount + 1
          : Math.max(0, selectedEventModal.registeredCount - 1),
      });
    }
  };

  // Filter events
  const filteredEvents = events.filter(e => {
    if (selectedCategory !== 'All' && e.category !== selectedCategory) return false;
    if (selectedCalendarDate && e.date !== selectedCalendarDate) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        e.title.toLowerCase().includes(q) ||
        e.organizer.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.shortDescription.toLowerCase().includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Sections
  const happeningSoonEvents = events.filter(e => e.isUrgent);
  const myEvents = events.filter(e => isUserRegisteredForEvent(e.id, userEmail));

  // Calendar setup for current month: October 2026
  const eventDates = new Set(events.map(e => e.date));
  const daysInOctober = Array.from({ length: 31 }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `2026-10-${dayNum < 10 ? '0' : ''}${dayNum}`;
    return {
      day: dayNum,
      dateStr,
      hasEvent: eventDates.has(dateStr),
    };
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Header & Philosophy */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              Module 3
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Discover • View Details • Register • Remember
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Campus Events
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            National hackathons, tech workshops, cultural fests, sports tournaments, and club activities at Sapthagiri NPS University.
          </p>
        </div>

        {/* Registered events count pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 w-fit">
          <Award className="w-4 h-4 text-indigo-500" />
          <span>My Passes: {myEvents.length} Active</span>
        </div>
      </div>

      {/* Search Bar and Category Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search events by name, organizing club, tags (e.g. Hackathon, AI, Music)..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-rose-500"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Category:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === 'All'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All Events
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {selectedCalendarDate && (
            <button
              type="button"
              onClick={() => setSelectedCalendarDate(null)}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <span>Clear Date Filter ({selectedCalendarDate})</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: 🔔 HAPPENING SOON (Urgent Events) */}
      {happeningSoonEvents.length > 0 && !selectedCalendarDate && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <BellRing className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                🔔 Happening Soon
              </h2>
              <p className="text-xs text-slate-500">
                Imminent registration deadlines and 24-hour campus alerts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {happeningSoonEvents.map(evt => {
              const isRegistered = isUserRegisteredForEvent(evt.id, userEmail);
              return (
                <div
                  key={evt.id}
                  className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 p-6 shadow-xl flex flex-col justify-between"
                >
                  {/* Glowing banner accent */}
                  <div
                    className={`absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r ${evt.bannerGradient}`}
                  />

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        <Sparkles className="w-3 h-3 text-rose-400" />
                        {evt.urgentBadge}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {evt.category}
                      </span>
                    </div>

                    <h3 className="text-lg font-black tracking-tight mb-2">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                      {evt.shortDescription}
                    </p>

                    <div className="space-y-1.5 text-xs text-slate-300 mb-6">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{evt.date} • {evt.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedEventModal(evt)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleRegister(evt)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                        isRegistered
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                      }`}
                    >
                      {isRegistered ? '✅ Registered' : 'REGISTER'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 2: 📅 UPCOMING EVENTS (Clean Cards) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              📅 Upcoming Events
            </h2>
            <p className="text-xs text-slate-500">
              Browse, examine schedule specifics, and reserve attendee badges.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {filteredEvents.length} events listed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(evt => {
            const isRegistered = isUserRegisteredForEvent(evt.id, userEmail);
            return (
              <div
                key={evt.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
              >
                {/* Banner header with gradient */}
                <div className={`h-24 bg-gradient-to-r ${evt.bannerGradient} p-4 flex items-start justify-between text-white relative`}>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/30 backdrop-blur-xs border border-white/20">
                    {evt.category}
                  </span>
                  {isRegistered && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-xs">
                      Registered
                    </span>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 mb-1.5">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {evt.shortDescription}
                    </p>

                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{evt.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{evt.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">Organized by {evt.organizer}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedEventModal(evt)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleRegister(evt)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isRegistered
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                      }`}
                    >
                      {isRegistered ? '✅ Registered' : 'REGISTER'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: 📆 EVENT CALENDAR */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              📆 Event Calendar — October 2026
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Click any highlighted date to filter events
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="font-bold text-slate-400 py-1 uppercase text-[10px]">
              {d}
            </div>
          ))}

          {/* Empty offset days for Oct 1 2026 (Thursday = 4 empty cells) */}
          <div />
          <div />
          <div />
          <div />

          {daysInOctober.map(item => {
            const isSelected = selectedCalendarDate === item.dateStr;
            return (
              <button
                key={item.day}
                type="button"
                onClick={() => {
                  if (item.hasEvent) {
                    setSelectedCalendarDate(isSelected ? null : item.dateStr);
                  }
                }}
                disabled={!item.hasEvent}
                className={`h-11 rounded-xl flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-rose-600 text-white font-bold ring-2 ring-rose-400'
                    : item.hasEvent
                    ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-800 hover:scale-105 cursor-pointer'
                    : 'text-slate-400 dark:text-slate-600 opacity-60 cursor-default'
                }`}
              >
                <span>{item.day}</span>
                {item.hasEvent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 4: ⭐ MY EVENTS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              ⭐ My Events ({myEvents.length})
            </h2>
            <p className="text-xs text-slate-500">
              Events registered under your account: {currentUser?.displayName || 'Student'}.
            </p>
          </div>
        </div>

        {myEvents.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            You haven't registered for any events yet. Click [REGISTER] on any card above!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myEvents.map(evt => (
              <div
                key={evt.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Confirmed Attendee
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-1">
                    {evt.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    📅 {evt.date} • {evt.venue}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleRegister(evt)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 shrink-0"
                >
                  Cancel Pass
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Event Details Modal */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedEventModal(null)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {selectedEventModal.category}
            </span>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2 mb-2">
              {selectedEventModal.title}
            </h2>

            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300 my-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <strong>📅 Date:</strong> {selectedEventModal.date}
              </div>
              <div>
                <strong>⏰ Time:</strong> {selectedEventModal.time}
              </div>
              <div>
                <strong>📍 Venue:</strong> {selectedEventModal.venue}
              </div>
              <div>
                <strong>👥 Host:</strong> {selectedEventModal.organizer}
              </div>
              <div>
                <strong>🎟️ Capacity:</strong> {selectedEventModal.registeredCount} / {selectedEventModal.maxCapacity}
              </div>
              <div>
                <strong>✉️ Contact:</strong> {selectedEventModal.contactEmail}
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[11px] tracking-wider">
                Event Description &amp; Highlights:
              </h4>
              <p>{selectedEventModal.fullDescription}</p>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {selectedEventModal.tags.map(t => (
                  <span
                    key={t}
                    className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-medium"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedEventModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleToggleRegister(selectedEventModal)}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                  isUserRegisteredForEvent(selectedEventModal.id, userEmail)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                }`}
              >
                {isUserRegisteredForEvent(selectedEventModal.id, userEmail)
                  ? '✅ Registered (Click to Cancel)'
                  : 'REGISTER FOR EVENT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
