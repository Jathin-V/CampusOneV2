import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Save,
  RotateCcw,
  History,
  FileSpreadsheet,
  AlertTriangle,
  Building,
  GraduationCap,
  Calendar,
  Clock,
  Sparkles,
  Check,
  X,
  Edit2,
  FileText,
  Eye,
} from 'lucide-react';
import {
  AttendanceSession,
  StudentAttendanceStatus,
  UserProfile,
} from '../types';
import { parseRoomCode, parseClassCode } from '../utils/parsers';
import {
  db,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
} from '../services/mockFirebase';

interface DigitalAttendanceProps {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
}

// Requirement 2: Generic student placeholders (Student 01, Student 02, etc.)
const DEFAULT_DEMO_STUDENTS: StudentAttendanceStatus[] = [
  { studentRoll: '01', studentName: 'Student 01', isPresent: true },
  { studentRoll: '02', studentName: 'Student 02', isPresent: true },
  { studentRoll: '03', studentName: 'Student 03', isPresent: false },
  { studentRoll: '04', studentName: 'Student 04', isPresent: true },
  { studentRoll: '05', studentName: 'Student 05', isPresent: true },
  { studentRoll: '06', studentName: 'Student 06', isPresent: true },
  { studentRoll: '07', studentName: 'Student 07', isPresent: true },
  { studentRoll: '08', studentName: 'Student 08', isPresent: false },
  { studentRoll: '09', studentName: 'Student 09', isPresent: true },
  { studentRoll: '10', studentName: 'Student 10', isPresent: true },
  { studentRoll: '11', studentName: 'Student 11', isPresent: true },
  { studentRoll: '12', studentName: 'Student 12', isPresent: true },
  { studentRoll: '13', studentName: 'Student 13', isPresent: true },
  { studentRoll: '14', studentName: 'Student 14', isPresent: false },
  { studentRoll: '15', studentName: 'Student 15', isPresent: true },
];

export const DigitalAttendance: React.FC<DigitalAttendanceProps> = ({ currentUser, onOpenAuth }) => {
  const [activeTab, setActiveTab] = useState<'take' | 'history' | 'report'>('take');

  // Input Codes
  const [roomInput, setRoomInput] = useState('A102');
  const [classInput, setClassInput] = useState('01ECE02');
  const [selectedSubject, setSelectedSubject] = useState('Basic Electronics (26ELN102)');
  const [selectedPeriod, setSelectedPeriod] = useState('Period 1 (09:00 - 10:00 AM)');
  const [sessionDate, setSessionDate] = useState('2026-10-08');

  // Active student list
  const [studentsList, setStudentsList] = useState<StudentAttendanceStatus[]>(DEFAULT_DEMO_STUDENTS);
  const [focusedStudentIndex, setFocusedStudentIndex] = useState<number>(0);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Firestore records
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceSession[]>([]);

  // History Edit Modal
  const [editingSession, setEditingSession] = useState<AttendanceSession | null>(null);

  // Student Semester Report State
  const [reportStudentRoll, setReportStudentRoll] = useState('01');
  // Requirement 5: On-screen attendance report modal
  const [showOnScreenReportModal, setShowOnScreenReportModal] = useState(false);

  // Parse codes
  const roomParsed = parseRoomCode(roomInput);
  const classParsed = parseClassCode(classInput);

  // Subscribe to live attendance records
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'attendance_records'), snapshot => {
      const list: AttendanceSession[] = snapshot.docs.map(d => d.data() as AttendanceSession);
      setAttendanceRecords(list);
    });
    return () => unsub();
  }, []);

  // Keyboard shortcut listener for desktop: '1' for Present, '2' for Absent
  useEffect(() => {
    if (activeTab !== 'take') return;

    function handleKeyDown(e: KeyboardEvent) {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === '1') {
        setStudentsList(prev => {
          const next = [...prev];
          if (next[focusedStudentIndex]) {
            next[focusedStudentIndex] = { ...next[focusedStudentIndex], isPresent: true };
          }
          return next;
        });
        setFocusedStudentIndex(idx => (idx + 1) % studentsList.length);
      } else if (e.key === '2') {
        setStudentsList(prev => {
          const next = [...prev];
          if (next[focusedStudentIndex]) {
            next[focusedStudentIndex] = { ...next[focusedStudentIndex], isPresent: false };
          }
          return next;
        });
        setFocusedStudentIndex(idx => (idx + 1) % studentsList.length);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, focusedStudentIndex, studentsList.length]);

  // Live Summary counters
  const totalStudents = studentsList.length;
  const presentCount = studentsList.filter(s => s.isPresent).length;
  const absentCount = totalStudents - presentCount;
  const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  const setStudentStatus = (index: number, isPresent: boolean) => {
    setStudentsList(prev => {
      const next = [...prev];
      next[index] = { ...next[index], isPresent };
      return next;
    });
    setFocusedStudentIndex(index);
  };

  const handleMarkAllPresent = () => {
    setStudentsList(prev => prev.map(s => ({ ...s, isPresent: true })));
  };

  const handleClearAll = () => {
    setStudentsList(prev => prev.map(s => ({ ...s, isPresent: false })));
  };

  const handleSaveAttendance = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!roomParsed.valid) {
      alert('Please enter a valid room code (e.g. A102).');
      return;
    }

    if (!classParsed.valid) {
      alert('Please enter a valid class code (e.g. 01ECE02).');
      return;
    }

    const session: AttendanceSession = {
      id: `ATT-${Date.now()}`,
      roomCode: roomInput.trim().toUpperCase(),
      roomDecoded: roomParsed.decoded,
      classCode: classInput.trim().toUpperCase(),
      classDecoded: classParsed.decoded,
      subject: selectedSubject,
      period: selectedPeriod,
      date: sessionDate,
      teacherEmail: currentUser.email,
      teacherName: currentUser.displayName,
      students: studentsList,
      totalStudents,
      presentCount,
      absentCount,
      createdAt: new Date().toISOString(),
    };

    await addDoc(collection(db, 'attendance_records'), session);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const handleUpdatePastRecord = async () => {
    if (!editingSession) return;
    const newPresent = editingSession.students.filter(s => s.isPresent).length;
    const newAbsent = editingSession.students.length - newPresent;

    await updateDoc(doc(db, 'attendance_records', editingSession.id), {
      students: editingSession.students,
      presentCount: newPresent,
      absentCount: newAbsent,
    });

    setEditingSession(null);
  };

  const selectedStudentObj = DEFAULT_DEMO_STUDENTS.find(s => s.studentRoll === reportStudentRoll) || DEFAULT_DEMO_STUDENTS[0];

  const subjectBreakdown = [
    { code: '26ELN102', name: 'Basic Electronics', totalPeriods: 28, attended: 26 },
    { code: '26PHY101', name: 'Engineering Physics', totalPeriods: 24, attended: 21 },
    { code: '26MAT101', name: 'Calculus & Linear Algebra', totalPeriods: 32, attended: 23 },
    { code: '26CSL104', name: 'C Programming Lab', totalPeriods: 16, attended: 15 },
    { code: '26CIV103', name: 'Elements of Civil Engg', totalPeriods: 20, attended: 18 },
  ];

  if (['03', '08', '14'].includes(reportStudentRoll)) {
    subjectBreakdown[2].attended = 14;
    subjectBreakdown[0].attended = 19;
  }

  const overallTotalPeriods = subjectBreakdown.reduce((sum, s) => sum + s.totalPeriods, 0);
  const overallAttendedPeriods = subjectBreakdown.reduce((sum, s) => sum + s.attended, 0);
  const overallPercentage = Math.round((overallAttendedPeriods / overallTotalPeriods) * 100);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Module 4
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Room Code → Class Code → Auto Roster → Real-Time Roll Call
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Digital Attendance
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Streamlined for smartphone roll call by standing lecturers: instant room/class decoding, rapid tap toggles, and on-screen semester eligibility reports.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('take')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'take'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Take Roll Call</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History &amp; Edit</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'report'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Semester Report</span>
          </button>
        </div>
      </div>

      {activeTab === 'take' && (
        <div className="space-y-6">
          {/* Room & Class Code Parser Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Room Code with Instant Parser */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-500" />
                  Room Code (e.g. A102) *
                </label>
                <input
                  type="text"
                  value={roomInput}
                  onChange={e => setRoomInput(e.target.value.toUpperCase())}
                  placeholder="A102"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-hidden focus:border-emerald-500"
                />
                <div
                  className={`mt-1.5 text-[11px] font-semibold leading-tight ${
                    roomParsed.valid
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-500'
                  }`}
                >
                  📍 {roomParsed.decoded}
                </div>
              </div>

              {/* Class Code with Instant Parser */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                  Class Code (e.g. 01ECE02) *
                </label>
                <input
                  type="text"
                  value={classInput}
                  onChange={e => setClassInput(e.target.value.toUpperCase())}
                  placeholder="01ECE02"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-hidden focus:border-emerald-500"
                />
                <div
                  className={`mt-1.5 text-[11px] font-semibold leading-tight ${
                    classParsed.valid
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-500'
                  }`}
                >
                  🎓 {classParsed.decoded}
                </div>
              </div>

              {/* Period Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  Period *
                </label>
                <select
                  value={selectedPeriod}
                  onChange={e => setSelectedPeriod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="Period 1 (09:00 - 10:00 AM)">Period 1 (09:00 - 10:00 AM)</option>
                  <option value="Period 2 (10:00 - 11:00 AM)">Period 2 (10:00 - 11:00 AM)</option>
                  <option value="Period 3 (11:15 - 12:15 PM)">Period 3 (11:15 - 12:15 PM)</option>
                  <option value="Period 4 (01:15 - 02:15 PM)">Period 4 (01:15 - 02:15 PM)</option>
                  <option value="Period 5 (02:15 - 03:15 PM)">Period 5 (02:15 - 03:15 PM)</option>
                  <option value="Period 6 (03:15 - 04:15 PM)">Period 6 (03:15 - 04:15 PM)</option>
                </select>
              </div>

              {/* Date Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  Date *
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={e => setSessionDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Desktop Keyboard Helper Banner */}
            <div className="hidden lg:flex items-center justify-between p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <strong>Desktop Rapid Mode:</strong> Press <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border font-mono font-bold">1</kbd> for Present, <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border font-mono font-bold">2</kbd> for Absent (auto-advances to next student).
              </span>
              <span className="text-[11px] opacity-80">
                Lecturer: {currentUser?.displayName || 'Teacher'}
              </span>
            </div>
          </div>

          {/* Live Summary Counters & Batch Actions Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400">Total:</span>
                <span className="font-bold text-slate-900 dark:text-white text-base">
                  {totalStudents}
                </span>
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Present:</span>
                <span className="font-bold text-base">{presentCount}</span>
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <XCircle className="w-4 h-4" />
                <span>Absent:</span>
                <span className="font-bold text-base">{absentCount}</span>
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="font-bold text-slate-900 dark:text-white">
                {attendancePercentage}%
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={handleSaveAttendance}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>SAVE ATTENDANCE</span>
              </button>
            </div>
          </div>

          {saveSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Attendance session successfully committed to University Firestore!</span>
            </div>
          )}

          {/* Student Roster List: Mobile-optimized with large tap buttons */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 pb-1">
              Enrolled Students ({studentsList.length} Roster — 01ECE02)
            </div>

            <div className="space-y-2">
              {studentsList.map((st, idx) => {
                const isFocused = focusedStudentIndex === idx;
                return (
                  <div
                    key={st.studentRoll}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl border transition-all gap-3 ${
                      isFocused
                        ? 'ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20'
                        : st.isPresent
                        ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10'
                        : 'border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {st.studentRoll}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {st.studentName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Roll #{st.studentRoll} • USN: 1SG23EC0{st.studentRoll}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setStudentStatus(idx, true)}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          st.isPresent
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>PRESENT</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStudentStatus(idx, false)}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          !st.isPresent
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-700'
                        }`}
                      >
                        <X className="w-4 h-4" />
                        <span>ABSENT</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: History & Edit Past Records */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Past Attendance Logs ({attendanceRecords.length})
              </h2>
              <p className="text-xs text-slate-500">
                View saved classroom registers and edit attendance status in past sessions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attendanceRecords.map(rec => (
              <div
                key={rec.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {rec.classCode}
                    </span>
                    <span className="text-xs text-slate-400">
                      📅 {rec.date}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {rec.subject}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {rec.roomDecoded} • {rec.period}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Recorded by: {rec.teacherName}
                  </div>

                  <div className="flex items-center gap-2 mt-4 text-xs font-semibold">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      ✅ {rec.presentCount} Present
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      ❌ {rec.absentCount} Absent
                    </span>
                    <span className="text-slate-400 text-xs">
                      ({Math.round((rec.presentCount / rec.totalStudents) * 100)}%)
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingSession(JSON.parse(JSON.stringify(rec)))}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>View &amp; Edit Roster</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Student Semester Report */}
      {activeTab === 'report' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Student Semester Attendance Analytics
              </h2>
              <p className="text-xs text-slate-500">
                Calculated on Total Periods vs Periods Attended (VTU / Autonomous University Mandate).
              </p>
            </div>

            {/* Requirement 5: Generate on-screen report button (NO file download) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowOnScreenReportModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-indigo-200" />
                <span>Generate On-Screen Report</span>
              </button>
            </div>
          </div>

          {/* Student Selector */}
          <div className="max-w-xs">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Student to Audit:
            </label>
            <select
              value={reportStudentRoll}
              onChange={e => setReportStudentRoll(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
            >
              {DEFAULT_DEMO_STUDENTS.map(st => (
                <option key={st.studentRoll} value={st.studentRoll}>
                  Roll #{st.studentRoll} — {st.studentName}
                </option>
              ))}
            </select>
          </div>

          {/* Student Header Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                1SG23EC0{selectedStudentObj.studentRoll} • Section 02
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {selectedStudentObj.studentName}
              </h3>
              <p className="text-xs text-slate-500">
                Sapthagiri NPS University • B.Tech Electronics &amp; Communication Engg.
              </p>
            </div>

            {/* Overall Attendance Metric */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-slate-400">Overall Periods</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {overallAttendedPeriods} / {overallTotalPeriods} Periods
                </div>
              </div>
              <div
                className={`text-2xl font-black px-4 py-2 rounded-2xl border ${
                  overallPercentage >= 75
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {overallPercentage}%
              </div>
            </div>
          </div>

          {/* 75% Eligibility Banner */}
          {overallPercentage < 75 ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <strong>⚠️ Condonation / Detention Warning:</strong> Attendance is below the mandatory 75% university requirement. Student is at risk of exam hall ticket withholding without medical clearance.
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong>✅ Semester Exam Eligible:</strong> Student maintains above 75% aggregate period attendance across engineering subjects.
              </div>
            </div>
          )}

          {/* Subject-Wise % Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-3">Subject Code</th>
                  <th className="p-3">Course Title</th>
                  <th className="p-3 text-center">Total Periods</th>
                  <th className="p-3 text-center">Periods Attended</th>
                  <th className="p-3">Attendance %</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subjectBreakdown.map(subj => {
                  const pct = Math.round((subj.attended / subj.totalPeriods) * 100);
                  const isEligible = pct >= 75;
                  return (
                    <tr key={subj.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {subj.code}
                      </td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">
                        {subj.name}
                      </td>
                      <td className="p-3 text-center text-slate-600 dark:text-slate-400">
                        {subj.totalPeriods}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200">
                        {subj.attended}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${
                                isEligible ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isEligible
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {isEligible ? 'Eligible' : 'Shortage'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Requirement 5: Clean On-Screen Student Attendance Report Modal (NO file download triggered!) */}
      {showOnScreenReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowOnScreenReportModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {/* University Letterhead Header */}
            <div className="text-center pb-5 border-b border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                SAPTHAGIRI NPS UNIVERSITY • OFFICE OF THE REGISTRAR
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                Student Attendance &amp; Hall Ticket Eligibility Transcript
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official Period-Wise Attendance Audit • Academic Year 2026
              </p>
            </div>

            {/* Student Particulars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Student Name</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedStudentObj.studentName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Roll / USN</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">1SG23EC0{selectedStudentObj.studentRoll}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Class / Section</span>
                <span className="font-bold text-slate-900 dark:text-white">Sem 1 • Sec 02</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Aggregate Attendance</span>
                <span className={`font-black text-sm ${overallPercentage >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {overallPercentage}% ({overallAttendedPeriods}/{overallTotalPeriods} Periods)
                </span>
              </div>
            </div>

            {/* Eligibility Verdict Banner */}
            <div
              className={`p-3.5 rounded-2xl border text-xs font-bold mb-5 flex items-center gap-2 ${
                overallPercentage >= 75
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {overallPercentage >= 75 ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>ELIGIBLE: Student satisfies the minimum 75% attendance threshold. Hall ticket approved.</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>ATTENDANCE SHORTAGE: Student requires Departmental Condonation approval.</span>
                </>
              )}
            </div>

            {/* Subject-Wise Summary Table */}
            <div className="space-y-2 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Course-Wise Attendance Breakdown:
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                {subjectBreakdown.map(subj => {
                  const pct = Math.round((subj.attended / subj.totalPeriods) * 100);
                  return (
                    <div
                      key={subj.code}
                      className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <div>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mr-2">
                          {subj.code}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {subj.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <span className="text-slate-500">
                          {subj.attended} / {subj.totalPeriods} Periods
                        </span>
                        <span
                          className={`font-black w-12 ${
                            pct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowOnScreenReportModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Close Report View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Past Session Modal */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl max-h-[85vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEditingSession(null)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Edit Past Session Roster #{editingSession.id}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {editingSession.classDecoded} • {editingSession.date} ({editingSession.period})
            </p>

            <div className="space-y-2 mb-6">
              {editingSession.students.map((st, idx) => (
                <div
                  key={st.studentRoll}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <span className="font-bold">
                    #{st.studentRoll} — {st.studentName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...editingSession.students];
                      updated[idx].isPresent = !updated[idx].isPresent;
                      setEditingSession({ ...editingSession, students: updated });
                    }}
                    className={`px-3 py-1 rounded-lg font-bold ${
                      st.isPresent
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {st.isPresent ? 'Present' : 'Absent'}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdatePastRecord}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25"
              >
                Save Record Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
