import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  ClipboardCheck,
  Calendar,
  Search,
  RefreshCw,
  School,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Filter,
  AlertTriangle,
  Loader2,
  GraduationCap,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient.js';
import PageContainer from '../../components/layout/PageContainer.jsx';

// ─── Teacher Attendance Workspace Component ──────────────────────────────────
const TeacherAttendanceWorkspace = ({ user }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeModalSection, setActiveModalSection] = useState(null);
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [windowStatus, setWindowStatus] = useState(null);
  const [isLateOverride, setIsLateOverride] = useState(false);
  const [lateReason, setLateReason] = useState('');

  const fetchTeacherSections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/academic/teacher-summary');
      if (res.data?.data) {
        setSections(res.data.data.sections || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assigned sections.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeacherSections();
  }, [fetchTeacherSections]);

  const openMarkModal = async (sec) => {
    setActiveModalSection(sec);
    setRosterLoading(true);
    setRosterError(null);
    setSubmissionSuccess(null);
    setIsLateOverride(false);
    setLateReason('');
    try {
      const res = await apiClient.get('/attendance/sheet', {
        params: { sectionId: sec._id, date: selectedDate },
      });
      setRoster(res.data?.data?.roster || []);
      setWindowStatus(res.data?.data?.windowStatus || null);
    } catch (err) {
      setRosterError(err.response?.data?.message || 'Failed to load student roster for this section.');
    } finally {
      setRosterLoading(false);
    }
  };

  const toggleStatus = (studentProfileId) => {
    setRoster((prev) =>
      prev.map((r) => {
        if (String(r.studentProfileId) !== String(studentProfileId)) return r;
        const cycle = { PRESENT: 'ABSENT', ABSENT: 'LEAVE', LEAVE: 'PRESENT' };
        return { ...r, currentStatus: cycle[r.currentStatus] || 'PRESENT' };
      })
    );
  };

  const markAll = (status) => {
    setRoster((prev) => prev.map((r) => ({ ...r, currentStatus: status })));
  };

  const handleSubmitAttendance = async () => {
    if (!activeModalSection) return;

    if (windowStatus && !windowStatus.allowed && !isLateOverride) {
      setRosterError(windowStatus.reason || 'Attendance submission window is closed.');
      return;
    }

    if (isLateOverride && (!lateReason || lateReason.trim().length < 5)) {
      setRosterError('A specific justification (minimum 5 characters) is required for emergency late clearance.');
      return;
    }

    setSubmitting(true);
    setRosterError(null);
    try {
      const absentStudentProfileIds = roster
        .filter((r) => r.currentStatus === 'ABSENT')
        .map((r) => r.studentProfileId);
      const leaveStudentProfileIds = roster
        .filter((r) => r.currentStatus === 'LEAVE')
        .map((r) => r.studentProfileId);

      const payload = {
        sectionId: activeModalSection._id,
        date: selectedDate,
        absentStudentProfileIds,
        leaveStudentProfileIds,
        records: roster.map((r) => ({
          studentProfileId: r.studentProfileId,
          status: r.currentStatus,
          remarks: r.remarks || '',
        })),
        isLateOverride: Boolean(isLateOverride),
        lateReason: isLateOverride ? lateReason.trim() : undefined,
      };
      const res = await apiClient.post('/attendance/submit', payload);
      setSubmissionSuccess(`Attendance submitted successfully for ${res.data?.data?.totalRecords || roster.length} students.`);
      fetchTeacherSections();
    } catch (err) {
      setRosterError(err.response?.data?.message || 'Failed to submit attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  const schoolName = user?.schoolId?.name || 'Assigned Institution';

  return (
    <PageContainer
      title="Classroom Attendance Portal"
      subtitle={`Daily Attendance Register · ${schoolName} · Educator: ${user?.fullName || 'Teacher'}`}
      actions={
        <div className="flex items-center gap-2">
          <input
            type="date"
            max={new Date().toISOString().split('T')[0]}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={fetchTeacherSections}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-sm">Loading your assigned class sections…</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 flex-shrink-0" />
          <p>{error}</p>
        </div>
      ) : sections.length === 0 ? (
        <div className="p-10 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <School className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Assigned Sections</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            You are not currently assigned as the Class Teacher for any section in this institution.
          </p>
          <div className="mt-4 p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 text-xs text-amber-300 max-w-md mx-auto text-left">
            <strong>Institutional Policy:</strong> Daily classroom attendance marking is authorized for designated Class Teachers. Subject-teacher assignment models are scheduled in the academic roadmap.
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sections.map((sec) => {
              const att = sec.todayAttendance || {};
              const isSubmitted = att.submitted;
              return (
                <div key={String(sec._id)} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-400 uppercase">{sec.class?.name || 'Class'}</span>
                      <h4 className="text-lg font-bold text-white">Section {sec.name}</h4>
                      {sec.roomNumber && <p className="text-xs text-slate-500">Room: {sec.roomNumber}</p>}
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        isSubmitted
                          ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-300'
                          : 'bg-rose-950/60 border-rose-700/50 text-rose-300'
                      }`}
                    >
                      {isSubmitted ? 'Submitted' : 'Pending'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                    <span>Enrolled Students:</span>
                    <span className="font-bold text-white">{sec.studentCount}</span>
                  </div>

                  {isSubmitted && (
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/30">
                        <p className="font-bold text-emerald-400">{att.presentCount ?? 0}</p>
                        <p className="text-[10px] text-slate-500">Present</p>
                      </div>
                      <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-800/30">
                        <p className="font-bold text-rose-400">{att.absentCount ?? 0}</p>
                        <p className="text-[10px] text-slate-500">Absent</p>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/30">
                        <p className="font-bold text-amber-400">{att.leaveCount ?? 0}</p>
                        <p className="text-[10px] text-slate-500">Leave</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => openMarkModal(sec)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    {isSubmitted ? 'Review / Update Register' : 'Mark Daily Attendance'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {activeModalSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setActiveModalSection(null)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Daily Attendance Register</h3>
                <p className="text-xs text-slate-400">
                  {activeModalSection.class?.name} — Section {activeModalSection.name} · Date: {selectedDate}
                </p>
              </div>
              <button
                onClick={() => setActiveModalSection(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 text-xs">
              <div className="flex gap-3">
                <span className="text-emerald-400 font-semibold">
                  ✓ {roster.filter((r) => r.currentStatus === 'PRESENT').length} Present
                </span>
                <span className="text-rose-400 font-semibold">
                  ✗ {roster.filter((r) => r.currentStatus === 'ABSENT').length} Absent
                </span>
                <span className="text-amber-400 font-semibold">
                  ◌ {roster.filter((r) => r.currentStatus === 'LEAVE').length} Leave
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => markAll('PRESENT')}
                  className="px-2 py-1 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[11px]"
                >
                  All Present
                </button>
                <button
                  type="button"
                  onClick={() => markAll('ABSENT')}
                  className="px-2 py-1 rounded bg-rose-950/80 border border-rose-700/60 text-rose-300 text-[11px]"
                >
                  All Absent
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {/* Stage 1: School Closure Alert */}
              {windowStatus?.isClosed && (
                <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-200 flex items-start gap-2.5">
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">School Closed Today: {windowStatus.closureReason || 'Official Holiday / Off Day'}</p>
                    <p className="text-[11px] text-rose-300 mt-0.5">
                      Attendance submissions are suspended while school closure is officially active.
                    </p>
                  </div>
                </div>
              )}

              {/* Stage 2: Early Window Alert */}
              {!windowStatus?.isClosed && !windowStatus?.allowed && windowStatus?.code === 'WINDOW_NOT_OPENED' && (
                <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-800/60 text-xs text-amber-200 flex items-start gap-2.5">
                  <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Attendance Window Not Yet Open</p>
                    <p className="text-[11px] text-amber-300 mt-0.5">
                      {windowStatus.reason || `Window opens at ${windowStatus.schedule?.attendanceWindowStart} PKT.`}
                    </p>
                  </div>
                </div>
              )}

              {/* Stage 3: Window Closed Gate & HM Late Clearance Form */}
              {!windowStatus?.isClosed && !windowStatus?.allowed && windowStatus?.code === 'WINDOW_CLOSED' && (
                windowStatus?.canOverride ? (
                  <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-950/30 text-xs space-y-3">
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-amber-300 text-sm">Headmaster Same-Day Emergency Late Clearance</h4>
                        <p className="text-slate-300 mt-0.5 text-[11px]">
                          Regular cutoff has passed ({windowStatus.schedule?.attendanceWindowEnd} PKT). As Head Master, you are authorized to clear same-day attendance due to verified power or internet disruptions until 23:59 PKT.
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-white pt-1">
                      <input
                        type="checkbox"
                        checked={isLateOverride}
                        onChange={(e) => setIsLateOverride(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-400"
                      />
                      <span>Apply Same-Day Emergency Clearance Override</span>
                    </label>

                    {isLateOverride && (
                      <div className="space-y-1.5 pt-1">
                        <label className="block text-[11px] font-semibold text-amber-300">
                          Mandatory Operational Justification (minimum 5 characters) *
                        </label>
                        <textarea
                          rows="2"
                          required
                          value={lateReason}
                          onChange={(e) => setLateReason(e.target.value)}
                          placeholder="e.g. Electrical feeder trip & internet outage resolved at 14:45 PKT"
                          className="w-full rounded-lg border border-amber-500/50 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-200 flex items-start gap-2.5">
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white">Attendance Submission Window Closed</p>
                      <p className="text-[11px] text-rose-300 mt-0.5">
                        {windowStatus.reason || `Cutoff was at ${windowStatus.schedule?.attendanceWindowEnd} PKT. Contact your Head Master for emergency clearance.`}
                      </p>
                    </div>
                  </div>
                )
              )}

              {rosterLoading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                  <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
                  <p className="text-xs">Loading verified student roster…</p>
                </div>
              )}
              {!rosterLoading && rosterError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {rosterError}
                </div>
              )}
              {!rosterLoading && !rosterError && roster.length === 0 && (
                <p className="text-center py-8 text-slate-500 text-xs">No active students enrolled in this section.</p>
              )}
              {!rosterLoading &&
                !rosterError &&
                roster.map((st) => (
                  <button
                    key={String(st.studentProfileId)}
                    type="button"
                    onClick={() => toggleStatus(st.studentProfileId)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                        {(st.fullName || 'S')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{st.fullName}</p>
                        <p className="text-[10px] text-slate-500">GR: {st.grNumber} · ID: {st.globalStudentId}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        st.currentStatus === 'PRESENT'
                          ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                          : st.currentStatus === 'ABSENT'
                          ? 'bg-rose-950 border-rose-700 text-rose-300'
                          : 'bg-amber-950 border-amber-700 text-amber-300'
                      }`}
                    >
                      {st.currentStatus}
                    </span>
                  </button>
                ))}
            </div>

            <div className="p-4 border-t border-slate-800">
              {submissionSuccess ? (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/50 text-emerald-300 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> {submissionSuccess}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveModalSection(null)}
                    className="px-3 py-1 rounded bg-emerald-600 text-white font-bold text-xs"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitAttendance}
                  disabled={
                    submitting ||
                    roster.length === 0 ||
                    (windowStatus && !windowStatus.allowed && !isLateOverride)
                  }
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 ${
                    isLateOverride
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg'
                      : 'bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white'
                  }`}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {submitting
                    ? 'Submitting Register…'
                    : isLateOverride
                    ? `Confirm & Submit Emergency Late Clearance (${roster.length} students)`
                    : windowStatus && !windowStatus.allowed
                    ? `Window Closed (${windowStatus.reason || 'Closed'})`
                    : `Confirm & Submit Register (${roster.length} students)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export const AttendancePage = () => {
  const { user } = useSelector((state) => state.auth);

  // If user is TEACHER, show dedicated operational teacher workspace
  if (user?.role === 'TEACHER') {
    return <TeacherAttendanceWorkspace user={user} />;
  }

  const [schoolsList, setSchoolsList] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSchoolsLoading, setIsSchoolsLoading] = useState(false);

  // Weekly cluster trend telemetry
  // NOTE: These figures are representative/sample averages from the analytics controller.
  // A real-time per-day API is not yet implemented; these are system reference baselines.
  const attendanceTrends = [
    { day: 'Monday', rate: '93.4%', boys: '92.4%', girls: '94.8%' },
    { day: 'Tuesday', rate: '94.1%', boys: '93.1%', girls: '95.2%' },
    { day: 'Wednesday', rate: '92.8%', boys: '91.8%', girls: '94.1%' },
    { day: 'Thursday', rate: '91.5%', boys: '90.5%', girls: '93.2%' },
    { day: 'Friday', rate: '89.2%', boys: '88.2%', girls: '91.0%' },
    { day: 'Saturday', rate: '86.7%', boys: '85.9%', girls: '88.4%' },
  ];

  const fetchSchools = async () => {
    setIsSchoolsLoading(true);
    try {
      const response = await apiClient.get('/schools');
      if (response.data?.success) {
        const list = response.data.data?.schools || response.data.data || [];
        setSchoolsList(list);
        if (list.length > 0) setSelectedSchoolId(list[0]._id);
      }
    } catch (err) {
      console.error('Failed to load schools:', err);
      toast.error('Unable to retrieve municipal school list.');
    } finally {
      setIsSchoolsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageContainer
      title="Municipal Digital Attendance Telemetry"
      subtitle="Education Department Liaquatabad Town Centre (DMC) — Daily attendance tracking, student rosters, and school-level analytics"
      actions={
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={fetchSchools}
            disabled={isSchoolsLoading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSchoolsLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Town Attendance Rate</span>
              <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-white">91.8%</p>
            <p className="mt-1 text-[11px] text-slate-500 font-medium">Sample baseline (analytics)</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Boys Attendance</span>
              <div className="rounded-lg bg-blue-500/10 p-1.5 text-blue-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-white">90.3%</p>
            <p className="mt-1 text-[11px] text-slate-500">Sample — boys schools baseline</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Girls Attendance</span>
              <div className="rounded-lg bg-pink-500/10 p-1.5 text-pink-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-white">93.3%</p>
            <p className="mt-1 text-[11px] text-slate-500">Sample — girls schools baseline</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Reporting Schools</span>
              <div className="rounded-lg bg-teal-500/10 p-1.5 text-teal-400">
                <School className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-white">{schoolsList.length}</p>
            <p className="mt-1 text-[11px] text-teal-400">Municipal schools registered</p>
          </div>
        </div>

        {/* Weekly Trend Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Municipal Weekly Attendance Trends</h3>
              <p className="text-xs text-slate-400">Aggregated cluster rates for Liaquatabad Town institutions</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {attendanceTrends.map((trend) => (
              <div
                key={trend.day}
                className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 text-center space-y-1.5"
              >
                <p className="text-xs font-semibold text-slate-400">{trend.day}</p>
                <p className="text-xl font-extrabold text-white">{trend.rate}</p>
                <div className="flex justify-between text-[10px] text-slate-500 border-t border-slate-800/80 pt-1">
                  <span>B: {trend.boys}</span>
                  <span>G: {trend.girls}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Institution Filter & Instructions */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Classroom Attendance Register</h4>
              <p className="text-xs text-slate-400">Select a municipal school to view live class-section logs</p>
            </div>
          </div>

          <select
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none min-w-[240px]"
          >
            {schoolsList.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.schoolCode})
              </option>
            ))}
          </select>
        </div>
      </div>
    </PageContainer>
  );
};

export default AttendancePage;
