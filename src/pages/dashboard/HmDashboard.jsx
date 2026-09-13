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
    emerald: 'bg-emerald-50 text-[#4B7F3A] border-emerald-200',
    teal:    'bg-blue-50 text-[#006AC7] border-blue-200',
    cyan:    'bg-sky-50 text-sky-700 border-sky-200',
    amber:   'bg-amber-50 text-amber-700 border-amber-200',
    purple:  'bg-purple-50 text-purple-700 border-purple-200',
    rose:    'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase text-[#8094A8] tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg border ${colors[color] || colors.emerald}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-slate-100 animate-pulse rounded" />
      ) : (
        <p className="text-3xl font-bold text-[#102033]">{value ?? '—'}</p>
      )}
    </div>
  );
};

// ─── Tab Button ───────────────────────────────────────────────────────────────
const TabBtn = ({ label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
      active
        ? 'bg-[#006AC7] text-white shadow-sm'
        : 'bg-white border border-slate-200 text-[#526477] hover:bg-slate-50 hover:text-[#102033]'
    }`}
  >
    {label}
    {badge != null && badge > 0 && (
      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/20 text-white' : 'bg-rose-600 text-white'}`}>
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
      const res = await apiClient.get('/users?role=TEACHER');
      setTeachers(res.data?.data?.users || []);
    } catch {
      toast.error('Failed to load teachers.');
    } finally {
      setTeachersLoading(false);
    }
  }, []);

  // ── Attendance analytics & today's sections ─────────────────────────────────
  const loadAttendance = useCallback(async () => {
    setAttendanceLoading(true);
    try {
      const [analyticsRes, sectionsRes] = await Promise.all([
        apiClient.get('/attendance/analytics/school'),
        apiClient.get('/attendance/sections/today'),
      ]);
      setSchoolAnalytics(analyticsRes.data?.data || null);
      setAttendanceSections(sectionsRes.data?.data?.sections || []);
    } catch {
      toast.error('Failed to load attendance.');
    } finally {
      setAttendanceLoading(false);
    }
  }, []);

  // ── Approvals (school-scoped) ────────────────────────────────────────────────
  const loadApprovals = useCallback(async () => {
    setApprovalsLoading(true);
    try {
      const res = await apiClient.get('/approvals?status=PENDING');
      setApprovals(res.data?.data?.approvals || []);
    } catch {
      toast.error('Failed to load approvals.');
    } finally {
      setApprovalsLoading(false);
    }
  }, []);

  // ── Homework (school-scoped) ─────────────────────────────────────────────────
  const loadHomework = useCallback(async () => {
    setHomeworkLoading(true);
    try {
      const res = await apiClient.get('/homework/school');
      setHomework(res.data?.data?.homework || []);
    } catch {
      toast.error('Failed to load homework.');
    } finally {
      setHomeworkLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (activeTab === 'teachers')   loadTeachers();
    if (activeTab === 'attendance') loadAttendance();
    if (activeTab === 'approvals')  loadApprovals();
    if (activeTab === 'homework')   loadHomework();
  }, [activeTab, loadTeachers, loadAttendance, loadApprovals, loadHomework]);

  const handleApprovalAction = async (approvalId, action) => {
    try {
      await apiClient.patch(`/approvals/${approvalId}`, { action });
      toast.success(`Request ${action}d.`);
      loadApprovals();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} request.`);
    }
  };

  return (
    <PageContainer
      title="HEAD MASTER COMMAND CENTER"
      subtitle={`Education Department Liaquatabad Town Centre (DMC) • ${user?.schoolId?.name || 'School Dashboard'}`}
      actions={
        <button
          onClick={loadStats}
          className="p-2 rounded-xl bg-white border border-slate-200 text-[#526477] hover:text-[#102033] hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
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

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <h3 className="text-base font-bold text-[#102033] mb-4 flex items-center gap-2">
              <School className="w-4 h-4 text-[#4B7F3A]" />
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
                <div key={teacherItem._id} className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#102033] text-sm">{teacherItem.fullName}</p>
                    <p className="text-xs text-[#526477]">{teacherItem.designation || 'Teacher'} • {teacherItem.email}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    teacherItem.status === 'ACTIVE' ? 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200' : 'bg-slate-100 text-[#526477]'
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
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#006AC7] uppercase tracking-wider">Current Month</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-[#006AC7] border border-blue-200 font-semibold">
                          School Aggregate
                        </span>
                      </div>
                      <div className="text-3xl font-extrabold text-[#102033]">
                        {schoolAnalytics.aggregates?.currentMonthPct || 0}%
                      </div>
                      <p className="text-xs text-[#526477] mt-1">Present percentage across all sections</p>
                    </div>

                    {/* Last Month */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Last Month</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                          Previous
                        </span>
                      </div>
                      <div className="text-3xl font-extrabold text-[#102033]">
                        {schoolAnalytics.aggregates?.lastMonthPct || 0}%
                      </div>
                      <p className="text-xs text-[#526477] mt-1">Previous month benchmark</p>
                    </div>

                    {/* Overall Academic Session */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Academic Session</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                          {schoolAnalytics.academicSession || 'Session'}
                        </span>
                      </div>
                      <div className="text-3xl font-extrabold text-[#102033]">
                        {schoolAnalytics.aggregates?.overallSessionPct || 0}%
                      </div>
                      <p className="text-xs text-[#526477] mt-1">Cumulative session average</p>
                    </div>
                  </div>

                  {/* Low Attendance Alert Banner */}
                  {schoolAnalytics.lowAttendanceCount > 0 && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-amber-900">
                            {schoolAnalytics.lowAttendanceCount} Students Flagged for Chronic Absenteeism (&lt; 75%)
                          </p>
                          <p className="text-xs text-[#526477]">
                            Intervention recommended to meet Department of Education standards.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section-by-Section Comparison Table */}
                  {schoolAnalytics.sectionBreakdown?.length > 0 && (
                    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                      <h4 className="text-sm font-bold text-[#102033] mb-4 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-[#006AC7]" />
                        Section-Wise Attendance Breakdown
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-[#526477]">
                          <thead>
                            <tr className="border-b border-slate-200/80 bg-[#F0F8FF]/80 text-[#526477] uppercase text-[11px] font-bold">
                              <th className="py-2.5 px-3">Class / Section</th>
                              <th className="py-2.5 px-3 text-center">Current Month</th>
                              <th className="py-2.5 px-3 text-center">Last Month</th>
                              <th className="py-2.5 px-3 text-center">Overall Session</th>
                              <th className="py-2.5 px-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {schoolAnalytics.sectionBreakdown.map((sec, idx) => (
                              <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                                <td className="py-3 px-3 font-semibold text-[#102033]">
                                  {sec.class} — {sec.name}
                                </td>
                                <td className="py-3 px-3 text-center font-mono font-semibold text-[#006AC7]">
                                  {sec.currentMonthPct}%
                                </td>
                                <td className="py-3 px-3 text-center font-mono text-[#526477]">
                                  {sec.lastMonthPct}%
                                </td>
                                <td className="py-3 px-3 text-center font-mono font-bold text-amber-700">
                                  {sec.overallSessionPct}%
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <span className={`px-2 py-0.5 rounded-full font-semibold ${
                                    sec.overallSessionPct >= 85 ? 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200' :
                                    sec.overallSessionPct >= 75 ? 'bg-blue-50 text-[#006AC7] border border-blue-200' :
                                    'bg-rose-50 text-rose-700 border border-rose-200'
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
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <h3 className="text-base font-bold text-[#102033] mb-4 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#006AC7]" />
                  Today's Attendance Status
                </h3>
                {attendanceSections.length === 0 ? (
                  <EmptyState label="No attendance submission records for today yet." />
                ) : (
                  attendanceSections.map((s, i) => (
                    <AttendanceSectionRow key={i} section={s} />
                  ))
                )}
                <p className="text-xs text-[#8094A8] mt-4">
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
            <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center">
              <CheckCircle2 className="w-10 h-10 text-[#4B7F3A] mx-auto mb-3" />
              <p className="text-[#102033] font-medium">All clear! No pending approvals.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {approvals.map((req) => (
                <div key={req._id} className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[#102033] text-sm">
                        {req.userId?.fullName || req.targetName || 'Unknown'}
                      </p>
                      <p className="text-xs text-[#526477] mt-0.5">
                        {req.requestType} • {req.userId?.designation || req.role || '—'}
                      </p>
                      <p className="text-xs text-[#8094A8] mt-1">
                        {new Date(req.createdAt).toLocaleDateString('en-PK')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprovalAction(req._id, 'approve')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#4B7F3A] hover:bg-[#3d682f] text-white transition-colors cursor-pointer shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprovalAction(req._id, 'reject')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
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
                <div key={hw._id} className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#102033] text-sm truncate">{hw.title}</p>
                      <p className="text-xs text-[#526477] mt-0.5">
                        {hw.classId?.name} — {hw.sectionId?.name} • {hw.subjectId?.name}
                      </p>
                      <p className="text-xs text-[#8094A8] mt-0.5">
                        Teacher: {hw.teacherId?.fullName || '—'} • Due: {new Date(hw.dueDate).toLocaleDateString('en-PK')}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${
                      new Date(hw.dueDate) < new Date()
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
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
  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/80">
    <span className="text-[#526477]">{label}</span>
    <span className={`font-semibold ${highlight ? 'text-[#4B7F3A] font-mono' : 'text-[#102033]'}`}>{value || '—'}</span>
  </div>
);

const LoadingSpinner = ({ label }) => (
  <div className="flex items-center gap-3 p-6 text-[#526477]">
    <Loader2 className="w-5 h-5 animate-spin text-[#006AC7]" />
    <span>{label}</span>
  </div>
);

const EmptyState = ({ label }) => (
  <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center text-[#526477]">
    <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-slate-400" />
    <p>{label}</p>
  </div>
);

const AttendanceSectionRow = ({ section }) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/80">
    <div>
      <p className="text-sm font-medium text-[#102033]">{section.section?.name || '—'}</p>
      <p className="text-xs text-[#526477]">{section.date}</p>
    </div>
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
      section.submitted
        ? section.status === 'VERIFIED' ? 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
        : 'bg-rose-50 text-rose-700 border border-rose-200'
    }`}>
      {section.submitted ? section.status : 'NOT SUBMITTED'}
    </span>
  </div>
);

export default HmDashboard;
