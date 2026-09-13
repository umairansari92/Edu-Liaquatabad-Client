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
const fmtDate = (dateValue) => {
  const dateObj = dateValue ? new Date(dateValue) : new Date();
  return dateObj.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Attendance Status Chip ───────────────────────────────────────────────────
const AttendanceChip = ({ status }) => {
  const map = {
    NOT_SUBMITTED:        { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700',    dot: 'bg-rose-500',    label: 'Not Submitted' },
    PENDING_VERIFICATION: { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-500',   label: 'Pending Verification' },
    VERIFIED:             { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Verified' },
  };
  const chipStyle = map[status] || map.NOT_SUBMITTED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${chipStyle.bg} ${chipStyle.border} ${chipStyle.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${chipStyle.dot} animate-pulse`} />
      {chipStyle.label}
    </span>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, sub, iconColor = 'text-[#006AC7]', iconBg = 'bg-blue-50' }) => (
  <div className="relative p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition-all">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-bold uppercase tracking-widest text-[#526477]">{label}</span>
      <div className={`p-2.5 rounded-xl ${iconBg}`}><Icon className={`w-4 h-4 ${iconColor}`} /></div>
    </div>
    <p className="text-3xl font-black text-[#102033] tracking-tight">{value}</p>
    {sub && <p className="text-xs text-[#8094A8] mt-1 font-medium">{sub}</p>}
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
      .then((sheetResponse) => { if (mounted) setRoster(sheetResponse.data?.data?.roster || []); })
      .catch((rosterError) => { if (mounted) setError(rosterError.response?.data?.message || 'Failed to load roster.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [section._id]);

  const toggle = (studentProfileId) => setRoster((prevRoster) => prevRoster.map((rosterItem) => {
    if (String(rosterItem.studentProfileId) !== String(studentProfileId)) return rosterItem;
    const cycle = { PRESENT: 'ABSENT', ABSENT: 'LEAVE', LEAVE: 'PRESENT' };
    return { ...rosterItem, currentStatus: cycle[rosterItem.currentStatus] || 'PRESENT' };
  }));

  const markAll = (targetStatus) => setRoster((prevRoster) => prevRoster.map((rosterItem) => ({ ...rosterItem, currentStatus: targetStatus })));

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
    PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ABSENT: 'bg-rose-50 text-rose-700 border-rose-200',
    LEAVE: 'bg-amber-50 text-amber-700 border-amber-200',
  }[attendanceStatus] || 'bg-slate-50 text-slate-700 border-slate-200');

  const presentCount = roster.filter((rosterRecord) => rosterRecord.currentStatus === 'PRESENT').length;
  const absentCount  = roster.filter((rosterRecord) => rosterRecord.currentStatus === 'ABSENT').length;
  const leaveCount   = roster.filter((rosterRecord) => rosterRecord.currentStatus === 'LEAVE').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-[#102033]">Mark Attendance</h3>
            <p className="text-sm text-[#526477]">{section.class?.name} — Section {section.name} · {fmtDate()}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-3 px-6 py-3 bg-slate-50 border-b border-slate-200/80 text-sm font-semibold">
          <span className="text-emerald-700">✓ {presentCount} Present</span>
          <span className="text-rose-700">✗ {absentCount} Absent</span>
          <span className="text-amber-700">◌ {leaveCount} Leave</span>
          <div className="ml-auto flex gap-2">
            {['PRESENT', 'ABSENT', 'LEAVE'].map((statusOption) => (
              <button
                key={statusOption}
                onClick={() => markAll(statusOption)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${getStatusChipClass(statusOption)}`}
              >
                {statusOption[0] + statusOption.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {loading && <div className="flex flex-col items-center py-12 gap-3 text-slate-400"><Loader2 className="w-8 h-8 animate-spin text-[#006AC7]" /><span className="text-sm">Loading roster…</span></div>}
          {!loading && error && <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />{error}</div>}
          {!loading && !error && roster.length === 0 && <p className="text-center py-10 text-[#8094A8] text-sm">No active students in this section.</p>}
          {!loading && !error && roster.map((student) => (
            <button key={String(student.studentProfileId)} onClick={() => toggle(student.studentProfileId)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white hover:bg-blue-50/40 border border-slate-200/80 transition-all text-left">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-[#006AC7]">
                {(student.fullName||'S')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#102033] truncate">{student.fullName}</p>
                <p className="text-xs text-[#526477]">GR: {student.grNumber} · {student.gender}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusChipClass(student.currentStatus)}`}>{student.currentStatus}</span>
            </button>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          {successMsg && <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />{successMsg}</div>}
          {!successMsg && <button onClick={submit} disabled={submitting || roster.length === 0}
            className="w-full py-3 rounded-xl bg-[#4B7F3A] hover:bg-[#3D692F] disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm">
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
    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-[#006AC7]/40 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <School className="w-4 h-4 text-[#006AC7]" />
            <span className="text-xs text-[#006AC7] font-bold uppercase tracking-wide">{section.class?.name || 'Class'}</span>
          </div>
          <h3 className="text-lg font-black text-[#102033]">Section {section.name}</h3>
          {section.roomNumber && <p className="text-xs text-[#8094A8] mt-0.5">Room {section.roomNumber}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <AttendanceChip status={attStatus} />
          <span className="text-xs text-[#526477] font-medium">{section.studentCount} students</span>
        </div>
      </div>
      {att.submitted && (
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Present', val: att.presentCount, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
            { label: 'Absent',  val: att.absentCount,  bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700' },
            { label: 'Leave',   val: att.leaveCount,   bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700' },
          ].map((item) => (
            <div key={item.label} className={`py-2 rounded-xl ${item.bg} border ${item.border}`}>
              <p className={`text-lg font-black ${item.text}`}>{item.val ?? '—'}</p>
              <p className="text-xs text-[#526477] font-medium">{item.label}</p>
            </div>
          ))}
        </div>
      )}
      {att.submitted && att.submittedAt && <p className="text-xs text-[#8094A8] mb-4 font-medium">Submitted: {fmtDate(att.submittedAt)}</p>}
      <button onClick={() => onMark(section)}
        className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-[#006AC7] border border-slate-200 hover:border-[#006AC7] text-sm font-bold text-[#102033] hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm">
        <ClipboardList className="w-4 h-4" />
        {att.submitted ? 'Update Attendance' : 'Mark Attendance'}
      </button>
    </div>
  );
};

// ─── Info Panel (Roadmap / Unavailable feature) ───────────────────────────────
const InfoPanel = ({ icon: Icon, iconColor, title, message }) => (
  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
    <h3 className="text-sm font-bold text-[#102033] flex items-center gap-2 mb-3">
      <Icon className={`w-4 h-4 ${iconColor}`} />{title}
    </h3>
    <div className="text-center py-4">
      <Icon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
      <p className="text-xs text-[#526477] font-medium">{message}</p>
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
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-[#526477]">
        <Loader2 className="w-10 h-10 animate-spin text-[#006AC7]" />
        <p className="text-sm font-medium">Loading your operational workspace…</p>
      </div>
    </PageContainer>
  );

  if (error) return (
    <PageContainer title="TEACHER WORKSPACE" subtitle="Education Department Liaquatabad Town Centre (DMC)">
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <p className="text-rose-700 text-sm font-medium max-w-md text-center">{error}</p>
        <button onClick={refresh} className="mt-2 px-5 py-2.5 rounded-xl bg-[#006AC7] hover:bg-[#00529B] text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    </PageContainer>
  );

  const activeSummary = summary || {};
  const sections = activeSummary.sections || [];
  const pending  = activeSummary.summary?.pendingAttendanceCount ?? 0;
  const total    = activeSummary.summary?.totalAssignedStudents   ?? 0;
  const secCount = activeSummary.summary?.assignedSectionCount    ?? 0;

  return (
    <>
      {modal && <AttendanceModal section={modal} onClose={() => setModal(null)} onSubmitted={() => { setModal(null); refresh(); }} />}

      <PageContainer
        title="TEACHER WORKSPACE"
        subtitle={`Education Department Liaquatabad Town Centre (DMC) · ${dayName}, ${fmtDate()}`}
        actions={
          <div className="flex items-center gap-3">
            {pending > 0 && (
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                {pending} Attendance Pending
              </span>
            )}
            <button onClick={refresh} className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-[#526477] hover:text-[#102033] shadow-sm transition-colors" title="Refresh Telemetry">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        }
      >
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard icon={School}       label="Assigned Sections" value={secCount} iconColor="text-[#006AC7]" iconBg="bg-blue-50" sub="Class teacher assignments" />
          <KpiCard icon={Users}        label="Total Students"    value={total}    iconColor="text-teal-600"   iconBg="bg-teal-50" sub="Active enrollment" />
          <KpiCard icon={ClipboardList}label="Attendance Pending"value={pending}  iconColor={pending > 0 ? 'text-rose-600' : 'text-[#4B7F3A]'} iconBg={pending > 0 ? 'bg-rose-50' : 'bg-emerald-50'} sub={pending === 0 ? 'All submitted today ✓' : 'Sections needing submission'} />
          <KpiCard icon={CalendarDays} label="Today"             value={today.getDate()} iconColor="text-indigo-600" iconBg="bg-indigo-50" sub={`${dayName}, ${today.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}`} />
        </div>

        {/* Assignment disclosure */}
        {activeSummary.teacherContext?.assignmentNote && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800 mb-0.5">Assignment Model Note</p>
              <p className="text-xs text-amber-700">{activeSummary.teacherContext.assignmentNote}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Sections */}
          <div className="xl:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#102033] flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#006AC7]" />
                My Class Sections
              </h2>
              <span className="text-xs text-[#8094A8] font-medium">{fmtDate()}</span>
            </div>

            {sections.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center">
                <School className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-[#102033] font-bold mb-2">No Class Sections Assigned</p>
                <p className="text-sm text-[#526477] max-w-sm mx-auto">
                  You have not been assigned as class teacher for any section yet. Contact your Head Master.
                </p>
                <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 text-left">
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
            <InfoPanel icon={BookOpen}      iconColor="text-teal-600"   title="Timetable"              message={activeSummary.timetable?.message || 'Timetable not available.'} />
            <InfoPanel icon={FileText}      iconColor="text-indigo-600" title="Homework / Lesson Work"  message={activeSummary.homework?.message  || 'Homework management coming soon.'} />
            <InfoPanel icon={ArrowLeftRight}iconColor="text-amber-600"  title="Leave & Transfer Status" message={activeSummary.leave?.message     || 'Leave management coming soon.'} />

            {/* Session Context */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <h3 className="text-sm font-bold text-[#102033] flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-[#006AC7]" />Your Session Context
              </h3>
              <div className="space-y-2.5 text-xs">
                {[
                  { label: 'Full Name',   value: authenticatedUser?.fullName || '—',          color: 'text-[#102033] font-bold' },
                  { label: 'Designation', value: authenticatedUser?.designation || 'Teacher', color: 'text-[#526477] font-medium' },
                  { label: 'System Role', value: authenticatedUser?.role || '—',              color: 'text-[#006AC7] font-mono font-bold' },
                  { label: 'Data Scope',  value: authenticatedUser?.scope || '—',             color: 'text-purple-700 font-mono font-bold' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-[#526477]">{label}</span>
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