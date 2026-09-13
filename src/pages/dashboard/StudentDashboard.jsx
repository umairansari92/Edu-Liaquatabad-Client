import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  BookOpen,
  ClipboardCheck,
  CalendarDays,
  GraduationCap,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Clock,
  FileText,
  ChevronRight,
  BookMarked,
  Paperclip,
  RefreshCw,
  School,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient.js';
import PageContainer from '../../components/layout/PageContainer.jsx';

// ─── Tab Button ───────────────────────────────────────────────────────────────
const TabBtn = ({ label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
      active
        ? 'bg-teal-600 text-white shadow-md'
        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
    }`}
  >
    {label}
    {badge != null && badge > 0 && (
      <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-amber-600 text-white">
        {badge}
      </span>
    )}
  </button>
);

// ─── StudentDashboard ─────────────────────────────────────────────────────────
const StudentDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('overview');
  const [homework, setHomework]   = useState([]);
  const [hwLoading, setHwLoading] = useState(false);
  const [hwLoaded, setHwLoaded]   = useState(false);
  const [attendance, setAttendance] = useState(null);
  const [attLoading, setAttLoading] = useState(false);
  const [attLoaded, setAttLoaded]   = useState(false);

  /**
   * SECURITY: Both homework and attendance queries use the server's authenticated
   * req.user identity. The server derives the student's class/section/school from
   * the StudentProfile record — NOT from any query parameter we send.
   * A student CANNOT see homework for other classes even by manipulating this request.
   */
  const loadHomework = useCallback(async () => {
    setHwLoading(true);
    try {
      const homeworkResponse = await apiClient.get('/homework/student');
      setHomework(homeworkResponse.data?.data?.homework || []);
    } catch (homeworkError) {
      toast.error('Failed to load homework. Please try again.');
    } finally {
      setHwLoading(false);
      setHwLoaded(true);
    }
  }, []);

  const loadAttendance = useCallback(async () => {
    setAttLoading(true);
    try {
      const attendanceResponse = await apiClient.get('/attendance/analytics/student');
      setAttendance(attendanceResponse.data?.data || null);
    } catch (attendanceError) {
      toast.error('Could not load attendance analytics.');
      setAttendance(null);
    } finally {
      setAttLoading(false);
      setAttLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'homework' && !hwLoaded) loadHomework();
    if (activeTab === 'attendance' && !attLoaded) loadAttendance();
  }, [activeTab, hwLoaded, attLoaded, loadHomework, loadAttendance]);

  // ── Due-soon + overdue counters for badge ─────────────────────────────────
  const dueSoon  = homework.filter((homeworkItem) => {
    const timeRemainingMs = new Date(homeworkItem.dueDate) - new Date();
    return timeRemainingMs > 0 && timeRemainingMs < 2 * 24 * 60 * 60 * 1000; // within 48 hours
  });
  const overdue  = homework.filter((homeworkItem) => new Date(homeworkItem.dueDate) < new Date());

  return (
    <PageContainer
      title="Student Dashboard"
      subtitle={`${user?.fullName} • ${user?.schoolId?.name || 'Your School'} • Liaquatabad Town Centre`}
      actions={
        <button
          onClick={() => { setHwLoaded(false); loadHomework(); }}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      }
    >
      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6">
        <TabBtn label="Overview"   active={activeTab === 'overview'}   onClick={() => setActiveTab('overview')} />
        <TabBtn
          label="My Homework"
          active={activeTab === 'homework'}
          onClick={() => setActiveTab('homework')}
          badge={dueSoon.length + overdue.length}
        />
        <TabBtn label="Attendance" active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} />
      </div>

      {/* ── OVERVIEW ───────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Profile card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-teal-400" />
              My Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <InfoRow label="Full Name"   value={user?.fullName} />
              <InfoRow label="Email"       value={user?.email} />
              <InfoRow label="Role"        value={user?.role} highlight />
              <InfoRow label="School"      value={user?.schoolId?.name || '—'} />
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-teal-950 text-teal-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-xs uppercase text-slate-400 font-semibold tracking-wide">Active Homework</span>
              </div>
              <p className="text-3xl font-bold text-white">{hwLoaded ? homework.length : '—'}</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-amber-950 text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-xs uppercase text-slate-400 font-semibold tracking-wide">Due Soon (48h)</span>
              </div>
              <p className="text-3xl font-bold text-white">{hwLoaded ? dueSoon.length : '—'}</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-rose-950 text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span className="text-xs uppercase text-slate-400 font-semibold tracking-wide">Overdue</span>
              </div>
              <p className="text-3xl font-bold text-white">{hwLoaded ? overdue.length : '—'}</p>
            </div>
          </div>

          {/* Overdue alert */}
          {hwLoaded && overdue.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 flex items-start gap-3 text-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
              <span>
                You have <strong>{overdue.length}</strong> overdue homework assignment{overdue.length > 1 ? 's' : ''}.
                Check the Homework tab for details.
              </span>
            </div>
          )}

          <div className="p-5 rounded-2xl bg-teal-950/20 border border-teal-800/30 text-teal-300 text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-teal-400" />
            <span>
              Your homework is filtered to your class and section only. You cannot see homework assigned to other students.
            </span>
          </div>
        </div>
      )}

      {/* ── HOMEWORK ───────────────────────────────────────────────────────── */}
      {activeTab === 'homework' && (
        <div className="space-y-4">
          {hwLoading ? (
            <LoadingSpinner label="Loading your homework..." />
          ) : homework.length === 0 ? (
            <div className="p-10 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <CheckCircle2 className="w-10 h-10 text-teal-400 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">All caught up! No active homework.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {homework.map((hw) => {
                const due        = new Date(hw.dueDate);
                const now        = new Date();
                const isOverdue  = due < now;
                const msLeft     = due - now;
                const isDueSoon  = !isOverdue && msLeft < 2 * 24 * 60 * 60 * 1000;

                return (
                  <div key={hw._id} className={`p-5 rounded-2xl border ${
                    isOverdue  ? 'bg-rose-950/20 border-rose-800/40' :
                    isDueSoon  ? 'bg-amber-950/20 border-amber-800/40' :
                                  'bg-slate-900 border-slate-800'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm mb-1 truncate">{hw.title}</p>
                        {hw.description && (
                          <p className="text-xs text-slate-300 mb-2 line-clamp-2">{hw.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 font-medium">
                            {hw.subjectId?.name || 'Subject'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                            By: {hw.teacherId?.fullName || 'Teacher'}
                          </span>
                          {hw.attachments?.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              {hw.attachments.length} file{hw.attachments.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          isOverdue  ? 'bg-rose-600 text-white' :
                          isDueSoon  ? 'bg-amber-600 text-white' :
                                        'bg-slate-700 text-slate-300'
                        }`}>
                          {isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : 'Active'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {due.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Attachments list */}
                    {hw.attachments?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-1.5">
                        {hw.attachments.map((att, i) => (
                          <a
                            key={i}
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            <span className="truncate">{att.fileName || 'Attachment'}</span>
                            <span className="text-slate-600">({att.fileType})</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ATTENDANCE ANALYTICS ───────────────────────────────────────────── */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-teal-400" />
              Attendance Intelligence
            </h3>
            <button
              onClick={loadAttendance}
              disabled={attLoading}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${attLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {attLoading && !attendance ? (
            <LoadingSpinner label="Calculating attendance intelligence..." />
          ) : !attendance ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p>Attendance records not yet initialized for your profile.</p>
            </div>
          ) : (
            <>
              {/* 3 Core Intelligence Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Current Month */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-950/40 via-slate-900 to-slate-900 border border-teal-800/40 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Current Month</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-teal-900/60 text-teal-300 border border-teal-700/40">
                      {attendance.currentMonth?.monthLabel || 'This Month'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-extrabold text-white">
                      {attendance.currentMonth?.percentage}%
                    </span>
                    <span className="text-xs text-slate-400">
                      ({attendance.currentMonth?.present}/{attendance.currentMonth?.workingDays} days)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/80 text-center text-xs">
                    <div className="p-1 rounded bg-slate-950/60">
                      <span className="text-emerald-400 font-bold">{attendance.currentMonth?.present || 0}</span>
                      <p className="text-[10px] text-slate-500">Present</p>
                    </div>
                    <div className="p-1 rounded bg-slate-950/60">
                      <span className="text-rose-400 font-bold">{attendance.currentMonth?.absent || 0}</span>
                      <p className="text-[10px] text-slate-500">Absent</p>
                    </div>
                    <div className="p-1 rounded bg-slate-950/60">
                      <span className="text-amber-400 font-bold">{attendance.currentMonth?.leave || 0}</span>
                      <p className="text-[10px] text-slate-500">Leave</p>
                    </div>
                  </div>
                </div>

                {/* 2. Last Month */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-800/40 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Last Month</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/40">
                      {attendance.lastMonth?.monthLabel || 'Previous Month'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-extrabold text-white">
                      {attendance.lastMonth?.percentage}%
                    </span>
                    <span className="text-xs text-slate-400">
                      ({attendance.lastMonth?.present}/{attendance.lastMonth?.workingDays} days)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/80 text-center text-xs">
                    <div className="p-1 rounded bg-slate-950/60">
                      <span className="text-emerald-400 font-bold">{attendance.lastMonth?.present || 0}</span>
                      <p className="text-[10px] text-slate-500">Present</p>
                    </div>
                    <div className="p-1 rounded bg-slate-950/60">
                      <span className="text-rose-400 font-bold">{attendance.lastMonth?.absent || 0}</span>
                      <p className="text-[10px] text-slate-500">Absent</p>
                    </div>
                    <div className="p-1 rounded bg-slate-950/60">
                      <span className="text-amber-400 font-bold">{attendance.lastMonth?.leave || 0}</span>
                      <p className="text-[10px] text-slate-500">Leave</p>
                    </div>
                  </div>
                </div>

                {/* 3. Academic Year Overall */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-800/40 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Academic Session</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 border border-amber-700/40">
                      {attendance.academicSession || 'Session'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-extrabold text-white">
                      {attendance.academicYear?.percentage}%
                    </span>
                    <span className="text-xs text-slate-400">
                      ({attendance.academicYear?.present}/{attendance.academicYear?.totalWorkingDays} days)
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-500/90 mb-3">
                    Calculated from admission date: {attendance.academicYear?.calculatedFromAdmissionDate || 'N/A'}
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/80 text-center text-xs">
                    <div className="p-1 rounded bg-slate-950/60">
                      <span className="text-emerald-400 font-bold">{attendance.academicYear?.present || 0}</span>
                      <p className="text-[10px] text-slate-500">Total P</p>
                    </div>
                    <div className="p-1 rounded bg-slate-950/60">
                      <span className="text-rose-400 font-bold">{attendance.academicYear?.absent || 0}</span>
                      <p className="text-[10px] text-slate-500">Total A</p>
                    </div>
                    <div className="p-1 rounded bg-slate-950/60">
                      <span className="text-amber-400 font-bold">{attendance.academicYear?.leave || 0}</span>
                      <p className="text-[10px] text-slate-500">Total L</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Progression History */}
              {attendance.monthlyHistory?.length > 0 && (
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-400" />
                    Session Attendance History
                  </h4>
                  <div className="space-y-3">
                    {attendance.monthlyHistory.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800/60">
                        <span className="w-14 text-xs font-bold text-slate-300">{m.monthLabel}</span>
                        <div className="flex-1">
                          <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                m.percentage >= 85 ? 'bg-emerald-500' :
                                m.percentage >= 75 ? 'bg-teal-500' :
                                'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, m.percentage)}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right w-24">
                          <span className="text-xs font-bold text-white">{m.percentage}%</span>
                          <span className="text-[10px] text-slate-500 block">({m.presentDays}/{m.totalWorkingDays} d)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </PageContainer>
  );
};

// ─── Helper components ────────────────────────────────────────────────────────
const InfoRow = ({ label, value, highlight }) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/60">
    <span className="text-slate-400">{label}</span>
    <span className={`font-semibold ${highlight ? 'text-teal-400 font-mono' : 'text-white'}`}>{value || '—'}</span>
  </div>
);

const LoadingSpinner = ({ label }) => (
  <div className="flex items-center gap-3 p-6 text-slate-400">
    <Loader2 className="w-5 h-5 animate-spin" />
    <span>{label}</span>
  </div>
);

export default StudentDashboard;
