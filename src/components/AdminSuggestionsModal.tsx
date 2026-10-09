import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  X,
  CheckCircle,
  Clock,
  Filter,
  CheckCircle2,
  Calendar,
  User,
  Mail,
  Tag,
  Sparkles,
} from 'lucide-react';
import { SuggestionItem } from '../types';
import { db, collection, onSnapshot, updateDoc, doc } from '../services/mockFirebase';

interface AdminSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSuggestionsModal: React.FC<AdminSuggestionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    if (!isOpen) return;
    const unsub = onSnapshot(collection(db, 'suggestions'), snapshot => {
      const list = snapshot.docs.map(d => d.data() as SuggestionItem);
      setSuggestions(list);
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateStatus = async (id: string, newStatus: SuggestionItem['status']) => {
    await updateDoc(doc(db, 'suggestions', id), {
      status: newStatus,
    });
  };

  const filteredSuggestions = suggestions.filter(s => {
    if (selectedStatus !== 'All' && s.status !== selectedStatus) return false;
    if (selectedCategory !== 'All' && s.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Campus Improvement Suggestions
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 uppercase tracking-wider">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inbox of ideas submitted by students and faculty via the CampusOne suggestion box.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
              Status:
            </span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="Under Consideration">Under Consideration</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Implemented">Implemented</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
              Category:
            </span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="All">All Categories</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Academics">Academics</option>
              <option value="Events">Events</option>
              <option value="Canteen & Campus">Canteen &amp; Campus</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="text-slate-500 font-semibold">
            Total: {filteredSuggestions.length}
          </div>
        </div>

        {/* Suggestions List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredSuggestions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No suggestions found for current filter.
            </div>
          ) : (
            filteredSuggestions.map(item => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      #{item.id}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {item.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        item.status === 'Implemented'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                          : item.status === 'Under Consideration'
                          ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  "{item.idea}"
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                  <div className="text-slate-500">
                    Author: <strong>{item.authorName}</strong> ({item.authorEmail})
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      Set Status:
                    </span>
                    {(['Reviewed', 'Under Consideration', 'Implemented'] as SuggestionItem['status'][]).map(
                      st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleUpdateStatus(item.id, st)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors ${
                            item.status === st
                              ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {st}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
