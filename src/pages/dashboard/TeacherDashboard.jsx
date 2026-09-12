import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import apiClient from '../../services/apiClient.js';
import PageContainer from '../../components/layout/PageContainer.jsx';
import {
  GraduationCap, Users, ClipboardList, CheckCircle2, XCircle,
  AlertCircle, Clock, BookOpen, FileText, ArrowLeftRight,
  RefreshCw, Loader2, AlertTriangle, Info,
  CalendarDays, School, TrendingUp,
} from 'lucide-react';

// ─── Utility ─────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  const dt = d ? new Date(d) : new Date();
  return dt.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Attendance Status Chip ───────────────────────────────────────────────────
const AttendanceChip = ({ status }) => {
  const map = {
    NOT_SUBMITTED:        { bg: 'bg-rose-950/60',    border: 'border-rose-700/50',    text: 'text-rose-300',    dot: 'bg-rose-400',    label: 'Not Submitted' },
    PENDING_VERIFICATION: { bg: 'bg-amber-950/60',   border: 'border-amber-700/50',   text: 'text-amber-300',   dot: 'bg-amber-400',   label: 'Pending Verification' },
    VERIFIED:             { bg: 'bg-emerald-950/60', border: 'border-emerald-700/50', text: 'text-emerald-300', dot: 'bg-emerald-400', label: 'Verified' },
  };
  const s = map[status] || map.NOT_SUBMITTED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${s.bg} ${s.border} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`} />
      {s.label}
    </span>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, accent, sub }) => (
  <div className="relative p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow overflow-hidden">
    <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-5 pointer-events-none`} />
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
      <div className="p-2 rounded-xl bg-slate-800/80"><Icon className="w-4 h-4 text-slate-300" /></div>
    </div>
    <p className="text-3xl font-black text-white">{value}</p>
    {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
  </div>
);

// ─── Attendance Mark Modal ────────────────────────────────────────────────────
const AttendanceModal = ({ section, onClose, onSubmitted }) => {
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    let mounted = true;
    apiClient.get('/attendance/sheet', { params: { sectionId: section._id } })
      .then((res) => { if (mounted) setRoster(res.data?.data?.roster || []); })
      .catch((e) => { if (mounted) setError(e.response?.data?.message || 'Failed to load roster.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [section._id]);

  const toggle = (id) => setRoster((p) => p.map((r) => {
    if (String(r.studentProfileId) !== String(id)) return r;
    const cycle = { PRESENT: 'ABSENT', ABSENT: 'LEAVE', LEAVE: 'PRESENT' };
    return { ...r, currentStatus: cycle[r.currentStatus] || 'PRESENT' };
  }));

  const markAll = (s) => setRoster((p) => p.map((r) => ({ ...r, currentStatus: s })));

  const submit = async () => {
    setSubmitting(true); setError(null);
    try {
      const submitResponse = await apiClient.post('/attendance/submit', {
        sectionId: section._id,
        date: new Date().toISOString().split('T')[0],
        records: roster.map((rosterRecord) => ({
          studentProfileId: rosterRecord.studentProfileId,
          status: rosterRecord.currentStatus,
          remarks: rosterRecord.remarks || '',
        })),
      });
      setSuccessMsg(`Attendance submitted for ${submitResponse.data?.data?.totalRecords || roster.length} students.`);
      onSubmitted?.();
    } catch (submissionError) {
      setError(submissionError.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusChipClass = (attendanceStatus) => ({
    PRESENT: 'bg-emerald-500/20 text-emerald-300 border-emerald-700/40',
    ABSENT: 'bg-rose-500/20 text-rose-300 border-rose-700/40',
    LEAVE: 'bg-amber-500/20 text-amber-300 border-amber-700/40',
  }[attendanceStatus] || '');

  const presentCount = roster.filter((rosterRecord) => rosterRecord.currentStatus === 'PRESENT').length;
  const absentCount  = roster.filter((rosterRecord) => rosterRecord.currentStatus === 'ABSENT').length;
  const leaveCount   = roster.filter((rosterRecord) => rosterRecord.currentStatus === 'LEAVE').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-950 border border-slate-700 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Mark Attendance</h3>
            <p className="text-sm text-slate-400">{section.class?.name} — Section {section.name} · {fmtDate()}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-3 px-6 py-3 bg-slate-900/60 border-b border-slate-800 text-sm font-semibold">
          <span className="text-emerald-400">✓ {presentCount} Present</span>
          <span className="text-rose-400">✗ {absentCount} Absent</span>
          <span className="text-amber-400">◌ {leaveCount} Leave</span>
          <div className="ml-auto flex gap-2">
            {['PRESENT', 'ABSENT', 'LEAVE'].map((statusOption) => (
              <button
                key={statusOption}
                onClick={() => markAll(statusOption)}
                className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${getStatusChipClass(statusOption)}`}
              >
                {statusOption[0] + statusOption.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {loading && <div className="flex flex-col items-center py-12 gap-3 text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /><span className="text-sm">Loading roster…</span></div>}
          {!loading && error && <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}</div>}
          {!loading && !error && roster.length === 0 && <p className="text-center py-10 text-slate-500 text-sm">No active students in this section.</p>}
          {!loading && !error && roster.map((student) => (
            <button key={String(student.studentProfileId)} onClick={() => toggle(student.studentProfileId)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all text-left">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                {(student.fullName||'S')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{student.fullName}</p>
                <p className="text-xs text-slate-500">GR: {student.grNumber} · {student.gender}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusChipClass(student.currentStatus)}`}>{student.currentStatus}</span>
            </button>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-slate-800">
          {successMsg && <div className="mb-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/40 text-emerald-300 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />{successMsg}</div>}
          {!successMsg && <button onClick={submit} disabled={submitting || roster.length === 0}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {submitting ? 'Submitting…' : `Submit Attendance (${roster.length} students)`}
          </button>}
        </div>
      </div>
    </div>
  );
};

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard = ({ section, onMark }) => {
  const att = section.todayAttendance;
  const attStatus = att.submitted ? (att.status || 'PENDING_VERIFICATION') : 'NOT_SUBMITTED';
  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow hover:border-slate-600 transition-all">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <School className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wide">{section.class?.name || 'Class'}</span>
          </div>
          <h3 className="text-lg font-black text-white">Section {section.name}</h3>
          {section.roomNumber && <p className="text-xs text-slate-500 mt-0.5">Room {section.roomNumber}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <AttendanceChip status={attStatus} />
          <span className="text-xs text-slate-500">{section.studentCount} students</span>
        </div>
      </div>
      {att.submitted && (
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          {[['emerald', att.presentCount, 'Present'], ['rose', att.absentCount, 'Absent'], ['amber', att.leaveCount, 'Leave']].map(([c, v, l]) => (
            <div key={l} className={`py-2 rounded-xl bg-${c}-950/40 border border-${c}-800/30`}>
              <p className={`text-lg font-black text-${c}-400`}>{v ?? '—'}</p>
              <p className="text-xs text-slate-500">{l}</p>
            </div>
          ))}
        </div>
      )}
      {att.submitted && att.submittedAt && <p className="text-xs text-slate-600 mb-4">Submitted: {fmtDate(att.submittedAt)}</p>}
      <button onClick={() => onMark(section)}
        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-emerald-700 border border-slate-700 hover:border-emerald-600 text-sm font-semibold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2">
        <ClipboardList className="w-4 h-4" />
        {att.submitted ? 'Update Attendance' : 'Mark Attendance'}
      </button>
    </div>
  );
};

// ─── Info Panel (Roadmap / Unavailable feature) ───────────────────────────────
const InfoPanel = ({ icon: Icon, iconColor, title, message }) => (
  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
    <h3 className={`text-sm font-bold text-white flex items-center gap-2 mb-3`}>
      <Icon className={`w-4 h-4 ${iconColor}`} />{title}
    </h3>
    <div className="text-center py-4">
      <Icon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
      <p className="text-xs text-slate-400">{message}</p>
    </div>
  </div>
);

// ─── TeacherDashboard (Main) ──────────────────────────────────────────────────
const TeacherDashboard = () => {
  const { user: authenticatedUser } = useSelector((state) => state.auth);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modal, setModal] = useState(null);

  const fetchTeacherWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summaryResponse = await apiClient.get('/academic/teacher-summary');
      if (summaryResponse.data?.data) setSummary(summaryResponse.data.data);
    } catch (workspaceError) {
      setError(workspaceError.response?.data?.message || 'Could not load workspace. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeacherWorkspace();
  }, [fetchTeacherWorkspace, refreshKey]);

  const refresh = () => setRefreshKey((previousKey) => previousKey + 1);
  const today = new Date();
  const dayName = today.toLocaleDateString('en-PK', { weekday: 'long' });

  if (loading) return (
    <PageContainer title="TEACHER WORKSPACE" subtitle="Education Department Liaquatabad Town Centre (DMC)">
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-sm">Loading your operational workspace…</p>
      </div>
    </PageContainer>
  );

  if (error) return (
    <PageContainer title="TEACHER WORKSPACE" subtitle="Education Department Liaquatabad Town Centre (DMC)">
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <p className="text-rose-300 text-sm font-medium max-w-md text-center">{error}</p>
        <button onClick={refresh} className="mt-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold flex items-center gap-2 transition-colors">
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    </PageContainer>
  );

  const s = summary || {};
  const sections = s.sections || [];
  const pending  = s.summary?.pendingAttendanceCount ?? 0;
  const total    = s.summary?.totalAssignedStudents   ?? 0;
  const secCount = s.summary?.assignedSectionCount    ?? 0;

  return (
    <>
      {modal && <AttendanceModal section={modal} onClose={() => setModal(null)} onSubmitted={() => { setModal(null); refresh(); }} />}

      <PageContainer
        title="TEACHER WORKSPACE"
        subtitle={`Education Department Liaquatabad Town Centre (DMC) · ${dayName}, ${fmtDate()}`}
        actions={
          <div className="flex items-center gap-3">
            {pending > 0 && (
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-950/60 border border-rose-700/50 text-rose-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                {pending} Attendance Pending
              </span>
            )}
            <button onClick={refresh} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        }
      >
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard icon={School}       label="Assigned Sections" value={secCount} accent="from-emerald-900 to-transparent" sub="Class teacher assignments" />
          <KpiCard icon={Users}        label="Total Students"    value={total}    accent="from-cyan-900 to-transparent"    sub="Active enrollment" />
          <KpiCard icon={ClipboardList}label="Attendance Pending"value={pending}  accent={pending > 0 ? 'from-rose-900 to-transparent' : 'from-emerald-900 to-transparent'} sub={pending === 0 ? 'All submitted today ✓' : 'Sections needing submission'} />
          <KpiCard icon={CalendarDays} label="Today"             value={today.getDate()} accent="from-violet-900 to-transparent" sub={`${dayName}, ${today.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}`} />
        </div>

        {/* Assignment disclosure */}
        {s.teacherContext?.assignmentNote && (
          <div className="mb-6 p-4 rounded-xl bg-amber-950/20 border border-amber-800/30 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-300 mb-0.5">Assignment Model Note</p>
              <p className="text-xs text-amber-200/70">{s.teacherContext.assignmentNote}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Sections */}
          <div className="xl:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                My Class Sections
              </h2>
              <span className="text-xs text-slate-500">{fmtDate()}</span>
            </div>

            {sections.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <School className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-white font-semibold mb-2">No Class Sections Assigned</p>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  You have not been assigned as class teacher for any section yet. Contact your Head Master.
                </p>
                <div className="mt-4 p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 text-xs text-amber-300 text-left">
                  <strong>Note:</strong> Only sections where you are set as the designated Class Teacher appear here.
                  Subject-teacher assignments require a future TeacherSectionAssignment model.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sections.map((sec) => <SectionCard key={String(sec._id)} section={sec} onMark={setModal} />)}
              </div>
            )}
          </div>

          {/* Right Panels */}
          <div className="space-y-5">
            <InfoPanel icon={BookOpen}      iconColor="text-teal-400"   title="Timetable"              message={s.timetable?.message || 'Timetable not available.'} />
            <InfoPanel icon={FileText}      iconColor="text-violet-400" title="Homework / Lesson Work"  message={s.homework?.message  || 'Homework management coming soon.'} />
            <InfoPanel icon={ArrowLeftRight}iconColor="text-amber-400"  title="Leave & Transfer Status" message={s.leave?.message     || 'Leave management coming soon.'} />

            {/* Session Context */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-slate-500" />Your Session Context
              </h3>
              <div className="space-y-2.5 text-xs">
                {[
                  { label: 'Full Name',   value: user?.fullName || '—',          color: 'text-white' },
                  { label: 'Designation', value: user?.designation || 'Teacher', color: 'text-amber-400' },
                  { label: 'System Role', value: user?.role || '—',              color: 'text-emerald-400 font-mono' },
                  { label: 'Data Scope',  value: user?.scope || '—',             color: 'text-violet-400 font-mono' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-800/60 last:border-0">
                    <span className="text-slate-500">{label}</span>
                    <span className={color}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
};

export default TeacherDashboard;