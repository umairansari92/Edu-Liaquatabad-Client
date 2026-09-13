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
      const sectionsResponse = await apiClient.get('/academic/teacher-summary');
      if (sectionsResponse.data?.data) {
        setSections(sectionsResponse.data.data.sections || []);
      }
    } catch (sectionsError) {
      setError(sectionsError.response?.data?.message || 'Failed to load assigned sections.');
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
      const sheetResponse = await apiClient.get('/attendance/sheet', {
        params: { sectionId: sec._id, date: selectedDate },
      });
      setRoster(sheetResponse.data?.data?.roster || []);
      setWindowStatus(sheetResponse.data?.data?.windowStatus || null);
    } catch (sheetError) {
      setRosterError(sheetError.response?.data?.message || 'Failed to load student roster for this section.');
    } finally {
      setRosterLoading(false);
    }
  };

  const toggleStatus = (studentProfileId) => {
    setRoster((prev) =>
      prev.map((rosterItem) => {
        if (String(rosterItem.studentProfileId) !== String(studentProfileId)) return rosterItem;
        const cycle = { PRESENT: 'ABSENT', ABSENT: 'LEAVE', LEAVE: 'PRESENT' };
        return { ...rosterItem, currentStatus: cycle[rosterItem.currentStatus] || 'PRESENT' };
      })
    );
  };

  const markAll = (status) => {
    setRoster((prev) => prev.map((rosterItem) => ({ ...rosterItem, currentStatus: status })));
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
        .filter((rosterItem) => rosterItem.currentStatus === 'ABSENT')
        .map((rosterItem) => rosterItem.studentProfileId);
      const leaveStudentProfileIds = roster
        .filter((rosterItem) => rosterItem.currentStatus === 'LEAVE')
        .map((rosterItem) => rosterItem.studentProfileId);

      const payload = {
        sectionId: activeModalSection._id,
        date: selectedDate,
        absentStudentProfileIds,
        leaveStudentProfileIds,
        records: roster.map((rosterItem) => ({
          studentProfileId: rosterItem.studentProfileId,
          status: rosterItem.currentStatus,
          remarks: rosterItem.remarks || '',
        })),
        isLateOverride: Boolean(isLateOverride),
        lateReason: isLateOverride ? lateReason.trim() : undefined,
      };
      const submitResponse = await apiClient.post('/attendance/submit', payload);
      setSubmissionSuccess(`Attendance submitted successfully for ${submitResponse.data?.data?.totalRecords || roster.length} students.`);
      fetchTeacherSections();
    } catch (submitError) {
      setRosterError(submitError.response?.data?.message || 'Failed to submit attendance.');
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
            onChange={(inputChangeEvent) => setSelectedDate(inputChangeEvent.target.value)}
            className="rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-[#102033] focus:border-[#006AC7] focus:outline-none shadow-sm"
          />
          <button
            type="button"
            onClick={fetchTeacherSections}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-bold text-[#526477] hover:text-[#102033] hover:bg-slate-50 disabled:opacity-50 shadow-sm transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#526477] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#006AC7]" />
          <p className="text-sm font-medium">Loading your assigned class sections…</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 flex-shrink-0 text-rose-600" />
          <p>{error}</p>
        </div>
      ) : sections.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center space-y-3">
          <School className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-[#102033]">No Assigned Sections</h3>
          <p className="text-sm text-[#526477] max-w-md mx-auto">
            You are not currently assigned as the Class Teacher for any section in this institution.
          </p>
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 max-w-md mx-auto text-left">
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
                <div key={String(sec._id)} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4 hover:border-[#006AC7]/40 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#006AC7] uppercase">{sec.class?.name || 'Class'}</span>
                      <h4 className="text-lg font-bold text-[#102033]">Section {sec.name}</h4>
                      {sec.roomNumber && <p className="text-xs text-[#8094A8]">Room: {sec.roomNumber}</p>}
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        isSubmitted
                          ? 'bg-emerald-50 border-emerald-200 text-[#4B7F3A]'
                          : 'bg-rose-50 border-rose-200 text-rose-700'
                      }`}
                    >
                      {isSubmitted ? 'Submitted' : 'Pending'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs text-[#526477]">
                    <span>Enrolled Students:</span>
                    <span className="font-bold text-[#102033]">{sec.studentCount}</span>
                  </div>

                  {isSubmitted && (
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                        <p className="font-bold text-[#4B7F3A]">{att.presentCount ?? 0}</p>
                        <p className="text-[10px] text-[#526477]">Present</p>
                      </div>
                      <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
                        <p className="font-bold text-rose-700">{att.absentCount ?? 0}</p>
                        <p className="text-[10px] text-[#526477]">Absent</p>
                      </div>
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
                        <p className="font-bold text-amber-700">{att.leaveCount ?? 0}</p>
                        <p className="text-[10px] text-[#526477]">Leave</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => openMarkModal(sec)}
                    className="w-full py-2.5 rounded-xl bg-[#006AC7] hover:bg-[#00529B] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
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
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveModalSection(null)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#102033]">Daily Attendance Register</h3>
                <p className="text-xs text-[#526477]">
                  {activeModalSection.class?.name} — Section {activeModalSection.name} · Date: {selectedDate}
                </p>
              </div>
              <button
                onClick={() => setActiveModalSection(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#102033]"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-200/80 text-xs">
              <div className="flex gap-3">
                <span className="text-[#4B7F3A] font-bold">
                  ✓ {roster.filter((rosterItem) => rosterItem.currentStatus === 'PRESENT').length} Present
                </span>
                <span className="text-rose-700 font-bold">
                  ✗ {roster.filter((rosterItem) => rosterItem.currentStatus === 'ABSENT').length} Absent
                </span>
                <span className="text-amber-700 font-bold">
                  ◌ {roster.filter((rosterItem) => rosterItem.currentStatus === 'LEAVE').length} Leave
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => markAll('PRESENT')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[#4B7F3A] font-bold text-[11px]"
                >
                  All Present
                </button>
                <button
                  type="button"
                  onClick={() => markAll('ABSENT')}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[11px]"
                >
                  All Absent
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {/* Stage 1: School Closure Alert */}
              {windowStatus?.isClosed && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-rose-900">School Closed Today: {windowStatus.closureReason || 'Official Holiday / Off Day'}</p>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      Attendance submissions are suspended while school closure is officially active.
                    </p>
                  </div>
                </div>
              )}

              {/* Stage 2: Early Window Alert */}
              {!windowStatus?.isClosed && !windowStatus?.allowed && windowStatus?.code === 'WINDOW_NOT_OPENED' && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900">Attendance Window Not Yet Open</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      {windowStatus.reason || `Window opens at ${windowStatus.schedule?.attendanceWindowStart} PKT.`}
                    </p>
                  </div>
                </div>
              )}

              {/* Stage 3: Window Closed Gate & HM Late Clearance Form */}
              {!windowStatus?.isClosed && !windowStatus?.allowed && windowStatus?.code === 'WINDOW_CLOSED' && (
                windowStatus?.canOverride ? (
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-xs space-y-3">
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-amber-900 text-sm">Headmaster Same-Day Emergency Late Clearance</h4>
                        <p className="text-amber-800 mt-0.5 text-[11px]">
                          Regular cutoff has passed ({windowStatus.schedule?.attendanceWindowEnd} PKT). As Head Master, you are authorized to clear same-day attendance due to verified power or internet disruptions until 23:59 PKT.
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer font-bold text-[#102033] pt-1">
                      <input
                        type="checkbox"
                        checked={isLateOverride}
                        onChange={(checkboxChangeEvent) => setIsLateOverride(checkboxChangeEvent.target.checked)}
                        className="rounded border-slate-300 text-[#006AC7] focus:ring-[#006AC7]"
                      />
                      <span>Apply Same-Day Emergency Clearance Override</span>
                    </label>

                    {isLateOverride && (
                      <div className="space-y-1.5 pt-1">
                        <label className="block text-[11px] font-bold text-amber-900">
                          Mandatory Operational Justification (minimum 5 characters) *
                        </label>
                        <textarea
                          rows="2"
                          required
                          value={lateReason}
                          onChange={(textareaChangeEvent) => setLateReason(textareaChangeEvent.target.value)}
                          placeholder="e.g. Electrical feeder trip & internet outage resolved at 14:45 PKT"
                          className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-900">Attendance Submission Window Closed</p>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        {windowStatus.reason || `Cutoff was at ${windowStatus.schedule?.attendanceWindowEnd} PKT. Contact your Head Master for emergency clearance.`}
                      </p>
                    </div>
                  </div>
                )
              )}

              {rosterLoading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#526477]">
                  <Loader2 className="w-7 h-7 animate-spin text-[#006AC7]" />
                  <p className="text-xs font-medium">Loading verified student roster…</p>
                </div>
              )}
              {!rosterLoading && rosterError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  {rosterError}
                </div>
              )}
              {!rosterLoading && !rosterError && roster.length === 0 && (
                <p className="text-center py-8 text-[#8094A8] text-xs">No active students enrolled in this section.</p>
              )}
              {!rosterLoading &&
                !rosterError &&
                roster.map((st) => (
                  <button
                    key={String(st.studentProfileId)}
                    type="button"
                    onClick={() => toggleStatus(st.studentProfileId)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-[#006AC7]">
                        {(st.fullName || 'S')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#102033]">{st.fullName}</p>
                        <p className="text-[10px] text-[#526477]">GR: {st.grNumber} · ID: {st.globalStudentId}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        st.currentStatus === 'PRESENT'
                          ? 'bg-emerald-50 border-emerald-200 text-[#4B7F3A]'
                          : st.currentStatus === 'ABSENT'
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}
                    >
                      {st.currentStatus}
                    </span>
                  </button>
                ))}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              {submissionSuccess ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#4B7F3A] text-xs flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-[#4B7F3A]" /> {submissionSuccess}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveModalSection(null)}
                    className="px-3 py-1.5 rounded-lg bg-[#4B7F3A] text-white font-bold text-xs"
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
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                      : 'bg-[#006AC7] hover:bg-[#00529B] disabled:opacity-50 text-white shadow-sm'
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
    } catch (schoolsError) {
      console.error('Failed to load schools:', schoolsError);
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
            onChange={(inputChangeEvent) => setSelectedDate(inputChangeEvent.target.value)}
            className="rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-[#102033] focus:border-[#006AC7] focus:outline-none shadow-sm"
          />
          <button
            type="button"
            onClick={fetchSchools}
            disabled={isSchoolsLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-bold text-[#526477] hover:text-[#102033] hover:bg-slate-50 disabled:opacity-50 shadow-sm transition"
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
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#526477] text-xs font-bold uppercase tracking-wider">
              <span>Town Attendance Rate</span>
              <div className="rounded-xl bg-emerald-50 p-2 text-[#4B7F3A]">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black text-[#102033]">91.8%</p>
            <p className="mt-1 text-[11px] text-[#8094A8] font-medium">Sample baseline (analytics)</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#526477] text-xs font-bold uppercase tracking-wider">
              <span>Boys Attendance</span>
              <div className="rounded-xl bg-blue-50 p-2 text-[#006AC7]">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black text-[#102033]">90.3%</p>
            <p className="mt-1 text-[11px] text-[#8094A8] font-medium">Sample — boys schools baseline</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#526477] text-xs font-bold uppercase tracking-wider">
              <span>Girls Attendance</span>
              <div className="rounded-xl bg-pink-50 p-2 text-pink-600">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black text-[#102033]">93.3%</p>
            <p className="mt-1 text-[11px] text-[#8094A8] font-medium">Sample — girls schools baseline</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#526477] text-xs font-bold uppercase tracking-wider">
              <span>Reporting Schools</span>
              <div className="rounded-xl bg-teal-50 p-2 text-teal-600">
                <School className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black text-[#102033]">{schoolsList.length}</p>
            <p className="mt-1 text-[11px] text-teal-700 font-medium">Municipal schools registered</p>
          </div>
        </div>

        {/* Weekly Trend Table */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#102033]">Municipal Weekly Attendance Trends</h3>
              <p className="text-xs text-[#526477]">Aggregated cluster rates for Liaquatabad Town institutions</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {attendanceTrends.map((trend) => (
              <div
                key={trend.day}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-center space-y-1.5"
              >
                <p className="text-xs font-bold text-[#526477]">{trend.day}</p>
                <p className="text-xl font-black text-[#102033]">{trend.rate}</p>
                <div className="flex justify-between text-[10px] text-[#8094A8] font-medium border-t border-slate-200 pt-1">
                  <span>B: {trend.boys}</span>
                  <span>G: {trend.girls}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Institution Filter & Instructions */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-[#006AC7]">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#102033]">Classroom Attendance Register</h4>
              <p className="text-xs text-[#526477]">Select a municipal school to view live class-section logs</p>
            </div>
          </div>

          <select
            value={selectedSchoolId}
            onChange={(selectChangeEvent) => setSelectedSchoolId(selectChangeEvent.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-[#526477] focus:bg-white focus:border-[#006AC7] focus:outline-none min-w-[240px]"
          >
            {schoolsList.map((schoolItem) => (
              <option key={schoolItem._id} value={schoolItem._id}>
                {schoolItem.name} ({schoolItem.schoolCode})
              </option>
            ))}
          </select>
        </div>
      </div>
    </PageContainer>
  );
};

export default AttendancePage;
