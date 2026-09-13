import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  School,
  Users,
  GraduationCap,
  ClipboardCheck,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  UserCheck,
  ChevronRight,
  BookMarked,
  CalendarDays,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient.js';
import PageContainer from '../../components/layout/PageContainer.jsx';

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color = 'emerald', loading }) => {
  const colors = {
    emerald: 'bg-emerald-950 text-emerald-400 border-emerald-800/40',
    teal:    'bg-teal-950 text-teal-400 border-teal-800/40',
    cyan:    'bg-cyan-950 text-cyan-400 border-cyan-800/40',
    amber:   'bg-amber-950 text-amber-400 border-amber-800/40',
    purple:  'bg-purple-950 text-purple-400 border-purple-800/40',
    rose:    'bg-rose-950 text-rose-400 border-rose-800/40',
  };
  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-slate-800 animate-pulse rounded" />
      ) : (
        <p className="text-3xl font-bold text-white">{value ?? '—'}</p>
      )}
    </div>
  );
};

// ─── Tab Button ───────────────────────────────────────────────────────────────
const TabBtn = ({ label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
      active
        ? 'bg-emerald-600 text-white shadow-md'
        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
    }`}
  >
    {label}
    {badge != null && badge > 0 && (
      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-emerald-400/30 text-white' : 'bg-rose-600 text-white'}`}>
        {badge}
      </span>
    )}
  </button>
);

// ─── HmDashboard ─────────────────────────────────────────────────────────────
const HmDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab]     = useState('overview');
  const [stats, setStats]             = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [teachers, setTeachers]       = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [attendanceSections, setAttendanceSections] = useState([]);
  const [schoolAnalytics, setSchoolAnalytics] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [approvals, setApprovals]     = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [homework, setHomework]       = useState([]);
  const [homeworkLoading, setHomeworkLoading] = useState(false);

  // ── Overview stats ──────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await apiClient.get('/academic/teacher-summary');
      setStats(res.data?.data || null);
    } catch {
      // silently fail — individual cards show —
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Teachers list (school-scoped — backend enforces schoolId from JWT) ──────
  const loadTeachers = useCallback(async () => {
    setTeachersLoading(true);
    try {
      const res = await apiClient.get('/users', { params: { role: 'TEACHER', limit: 100 } });
      setTeachers(res.data?.data?.users || []);
    } catch {
      toast.error('Failed to load teachers.');
    } finally {
      setTeachersLoading(false);
    }
  }, []);

  // ── Today attendance status & school analytics ────────────────────────────
  const loadAttendance = useCallback(async () => {
    setAttendanceLoading(true);
    try {
      const [statusRes, analyticsRes] = await Promise.allSettled([
        apiClient.get('/attendance/status', { params: { date: new Date().toISOString().split('T')[0] } }),
        apiClient.get('/attendance/analytics/school'),
      ]);

      if (statusRes.status === 'fulfilled' && statusRes.value.data?.data) {
        setAttendanceSections([statusRes.value.data.data]);
      } else {
        setAttendanceSections([]);
      }

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.data?.data) {
        setSchoolAnalytics(analyticsRes.value.data.data);
      }
    } catch {
      toast.error('Failed to load attendance intelligence.');
    } finally {
      setAttendanceLoading(false);
    }
  }, []);

  // ── Pending approvals ────────────────────────────────────────────────────
  const loadApprovals = useCallback(async () => {
    setApprovalsLoading(true);
    try {
      const res = await apiClient.get('/approvals', { params: { status: 'PENDING', limit: 50 } });
      setApprovals(res.data?.data?.requests || []);
    } catch {
      toast.error('Failed to load pending approvals.');
    } finally {
      setApprovalsLoading(false);
    }
  }, []);

  // ── Homework overview (school-scoped) ─────────────────────────────────────
  const loadHomework = useCallback(async () => {
    setHomeworkLoading(true);
    try {
      const res = await apiClient.get('/homework/school', { params: { status: 'ACTIVE' } });
      setHomework(res.data?.data?.homework || []);
    } catch {
      toast.error('Failed to load homework overview.');
    } finally {
      setHomeworkLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    if (activeTab === 'teachers'   && teachers.length === 0)          loadTeachers();
    if (activeTab === 'attendance' && attendanceSections.length === 0) loadAttendance();
    if (activeTab === 'approvals'  && approvals.length === 0)          loadApprovals();
    if (activeTab === 'homework'   && homework.length === 0)           loadHomework();
  }, [activeTab]);

  // ── Approve / Reject handler ─────────────────────────────────────────────
  const handleApprovalAction = async (requestId, action) => {
    try {
      await apiClient.patch(`/approvals/${requestId}/${action}`);
      toast.success(`Request ${action}d successfully.`);
      setApprovals((prevApprovals) => prevApprovals.filter((approvalRequest) => approvalRequest._id !== requestId));
    } catch (approvalError) {
      toast.error(approvalError.response?.data?.message || `Failed to ${action} request.`);
    }
  };

  return (
    <PageContainer
      title="Head Master Dashboard"
      subtitle={`${user?.designation || 'Head Master'} • ${user?.schoolId?.name || 'Your School'} • Liaquatabad Town Centre`}
      actions={
        <button
          onClick={loadStats}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Refresh stats"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      }
    >
      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6">
        <TabBtn label="Overview"    active={activeTab === 'overview'}    onClick={() => setActiveTab('overview')} />
        <TabBtn label="Teachers"    active={activeTab === 'teachers'}    onClick={() => setActiveTab('teachers')} />
        <TabBtn label="Attendance"  active={activeTab === 'attendance'}  onClick={() => setActiveTab('attendance')} />
        <TabBtn label="Approvals"   active={activeTab === 'approvals'}   onClick={() => setActiveTab('approvals')} badge={approvals.length} />
        <TabBtn label="Homework"    active={activeTab === 'homework'}    onClick={() => setActiveTab('homework')} />
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users}          label="Teaching Staff" value={stats?.totalTeachers}     color="emerald" loading={statsLoading} />
            <StatCard icon={GraduationCap}  label="Students"       value={stats?.totalStudents}      color="teal"    loading={statsLoading} />
            <StatCard icon={ClipboardCheck} label="Sections"        value={stats?.totalSections}      color="cyan"    loading={statsLoading} />
            <StatCard icon={BookOpen}       label="Active Homework" value={homework.length || '—'}   color="amber"   loading={homeworkLoading} />
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <School className="w-4 h-4 text-emerald-400" />
              School Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <InfoRow label="School Name"   value={user?.schoolId?.name || '—'} />
              <InfoRow label="School Code"   value={user?.schoolId?.code || user?.schoolId?.schoolCode || '—'} />
              <InfoRow label="Your Name"     value={user?.fullName} />
              <InfoRow label="Designation"   value={user?.designation || 'Head Master'} />
              <InfoRow label="System Role"   value={user?.role} highlight />
              <InfoRow label="Scope"         value={user?.scope || 'SCHOOL'} />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-800/30 text-emerald-300 text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
            <span>
              All data shown is scoped exclusively to your school. Unauthorized cross-school access is blocked at the API layer.
            </span>
          </div>
        </div>
      )}

      {/* ── TEACHERS ─────────────────────────────────────────────────────── */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          {teachersLoading ? (
            <LoadingSpinner label="Loading teachers..." />
          ) : teachers.length === 0 ? (
            <EmptyState label="No teachers found for your school." />
          ) : (
            <div className="space-y-2">
              {teachers.map((teacherItem) => (
                <div key={teacherItem._id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white text-sm">{teacherItem.fullName}</p>
                    <p className="text-xs text-slate-400">{teacherItem.designation || 'Teacher'} • {teacherItem.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    teacherItem.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {teacherItem.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ATTENDANCE INTELLIGENCE ─────────────────────────────────────── */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {attendanceLoading ? (
            <LoadingSpinner label="Loading attendance intelligence..." />
          ) : (
            <>
              {/* School Level Rollup Metrics */}
              {schoolAnalytics && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Current Month */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-950/40 via-slate-900 to-slate-900 border border-teal-800/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Current Month</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-900/60 text-teal-300">
                          School Aggregate
                        </span>
                      </div>
                      <div className="text-3xl font-extrabold text-white">
                        {schoolAnalytics.aggregates?.currentMonthPct || 0}%
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Present percentage across all sections</p>
                    </div>

                    {/* Last Month */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-800/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Last Month</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300">
                          Previous
                        </span>
                      </div>
                      <div className="text-3xl font-extrabold text-white">
                        {schoolAnalytics.aggregates?.lastMonthPct || 0}%
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Previous month benchmark</p>
                    </div>

                    {/* Overall Academic Session */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-800/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Academic Session</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300">
                          {schoolAnalytics.academicSession || 'Session'}
                        </span>
                      </div>
                      <div className="text-3xl font-extrabold text-white">
                        {schoolAnalytics.aggregates?.overallSessionPct || 0}%
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Cumulative session average</p>
                    </div>
                  </div>

                  {/* Low Attendance Alert Banner */}
                  {schoolAnalytics.lowAttendanceCount > 0 && (
                    <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-amber-200">
                            {schoolAnalytics.lowAttendanceCount} Students Flagged for Chronic Absenteeism (&lt; 75%)
                          </p>
                          <p className="text-xs text-slate-400">
                            Intervention recommended to meet Department of Education standards.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section-by-Section Comparison Table */}
                  {schoolAnalytics.sectionBreakdown?.length > 0 && (
                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                      <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-teal-400" />
                        Section-Wise Attendance Breakdown
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 uppercase">
                              <th className="py-2.5 px-3">Class / Section</th>
                              <th className="py-2.5 px-3 text-center">Current Month</th>
                              <th className="py-2.5 px-3 text-center">Last Month</th>
                              <th className="py-2.5 px-3 text-center">Overall Session</th>
                              <th className="py-2.5 px-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {schoolAnalytics.sectionBreakdown.map((sec, idx) => (
                              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                <td className="py-3 px-3 font-semibold text-white">
                                  {sec.class} — {sec.name}
                                </td>
                                <td className="py-3 px-3 text-center font-mono font-semibold text-teal-400">
                                  {sec.currentMonthPct}%
                                </td>
                                <td className="py-3 px-3 text-center font-mono text-slate-300">
                                  {sec.lastMonthPct}%
                                </td>
                                <td className="py-3 px-3 text-center font-mono font-bold text-amber-400">
                                  {sec.overallSessionPct}%
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <span className={`px-2 py-0.5 rounded-full font-semibold ${
                                    sec.overallSessionPct >= 85 ? 'bg-emerald-900/60 text-emerald-300' :
                                    sec.overallSessionPct >= 75 ? 'bg-teal-900/60 text-teal-300' :
                                    'bg-rose-900/60 text-rose-300'
                                  }`}>
                                    {sec.overallSessionPct >= 75 ? 'Good' : 'Needs Attention'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Today's Section Submission Status */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-teal-400" />
                  Today's Attendance Status
                </h3>
                {attendanceSections.length === 0 ? (
                  <EmptyState label="No attendance submission records for today yet." />
                ) : (
                  attendanceSections.map((s, i) => (
                    <AttendanceSectionRow key={i} section={s} />
                  ))
                )}
                <p className="text-xs text-slate-500 mt-4">
                  Teachers submit and update attendance records directly through their Class Register.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── APPROVALS ────────────────────────────────────────────────────── */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {approvalsLoading ? (
            <LoadingSpinner label="Loading pending approvals..." />
          ) : approvals.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">All clear! No pending approvals.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {approvals.map((req) => (
                <div key={req._id} className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white text-sm">
                        {req.userId?.fullName || req.targetName || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {req.requestType} • {req.userId?.designation || req.role || '—'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(req.createdAt).toLocaleDateString('en-PK')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprovalAction(req._id, 'approve')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprovalAction(req._id, 'reject')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-900 hover:bg-rose-800 text-rose-200 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── HOMEWORK ─────────────────────────────────────────────────────── */}
      {activeTab === 'homework' && (
        <div className="space-y-4">
          {homeworkLoading ? (
            <LoadingSpinner label="Loading homework..." />
          ) : homework.length === 0 ? (
            <EmptyState label="No active homework found for your school." />
          ) : (
            <div className="space-y-3">
              {homework.map((hw) => (
                <div key={hw._id} className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{hw.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {hw.classId?.name} — {hw.sectionId?.name} • {hw.subjectId?.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Teacher: {hw.teacherId?.fullName || '—'} • Due: {new Date(hw.dueDate).toLocaleDateString('en-PK')}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 text-xs px-2 py-1 rounded-full font-medium ${
                      new Date(hw.dueDate) < new Date()
                        ? 'bg-rose-950 text-rose-400'
                        : 'bg-amber-950 text-amber-400'
                    }`}>
                      {new Date(hw.dueDate) < new Date() ? 'Overdue' : 'Active'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};

// ─── Small helper components ──────────────────────────────────────────────────
const InfoRow = ({ label, value, highlight }) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/60">
    <span className="text-slate-400">{label}</span>
    <span className={`font-semibold ${highlight ? 'text-emerald-400 font-mono' : 'text-white'}`}>{value || '—'}</span>
  </div>
);

const LoadingSpinner = ({ label }) => (
  <div className="flex items-center gap-3 p-6 text-slate-400">
    <Loader2 className="w-5 h-5 animate-spin" />
    <span>{label}</span>
  </div>
);

const EmptyState = ({ label }) => (
  <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400">
    <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-slate-600" />
    <p>{label}</p>
  </div>
);

const AttendanceSectionRow = ({ section }) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/60">
    <div>
      <p className="text-sm font-medium text-white">{section.section?.name || '—'}</p>
      <p className="text-xs text-slate-400">{section.date}</p>
    </div>
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
      section.submitted
        ? section.status === 'VERIFIED' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
        : 'bg-rose-950 text-rose-400'
    }`}>
      {section.submitted ? section.status : 'NOT SUBMITTED'}
    </span>
  </div>
);

export default HmDashboard;
