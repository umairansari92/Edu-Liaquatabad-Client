import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  BookMarked,
  CalendarDays,
  TrendingUp,
  RefreshCw,
  Award,
  ArrowLeftRight,
  FileText,
  PlusCircle,
  ShieldCheck,
  Send,
  Eye,
  Check,
  X,
  Building,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageContainer from '../../components/layout/PageContainer.jsx';
import {
  fetchHmSummary,
  fetchPendingApprovals,
  submitApprovalDecision,
  fetchAcademicClasses,
  createAcademicClass,
  fetchAcademicSections,
  createAcademicSection,
  fetchAcademicSubjects,
  createAcademicSubject,
  fetchTeachingAssignments,
  assignTeachingDuty,
  terminateTeachingDuty,
  fetchAttendanceAnalytics,
  verifyAttendanceRecord,
  fetchExamsList,
  scheduleExam,
  fetchExamResults,
  verifyStudentResult,
  publishExamGazette,
  fetchIncomingTransfers,
  approveTransferJoining,
  fetchSchoolNotices,
  publishSchoolNotice,
} from '../../store/slices/hmSlice.js';

// ─── Stat Card Component ──────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, subtext, color = 'emerald', loading }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-[#4B7F3A] border-emerald-200',
    blue:    'bg-blue-50 text-[#006AC7] border-blue-200',
    indigo:  'bg-indigo-50 text-indigo-700 border-indigo-200',
    amber:   'bg-amber-50 text-amber-700 border-amber-200',
    purple:  'bg-purple-50 text-purple-700 border-purple-200',
    rose:    'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm transition hover:shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase text-[#8094A8] tracking-wider">{label}</span>
        <div className={`p-2.5 rounded-xl border ${colors[color] || colors.emerald}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-20 bg-slate-100 animate-pulse rounded my-1" />
      ) : (
        <p className="text-2xl font-black text-[#102033]">{value ?? '—'}</p>
      )}
      {subtext && <p className="text-xs text-[#526477] font-medium mt-1">{subtext}</p>}
    </div>
  );
};

// ─── Tab Button Component ─────────────────────────────────────────────────────
const TabBtn = ({ label, active, onClick, badge, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
      active
        ? 'bg-[#006AC7] text-white shadow-sm'
        : 'bg-white border border-slate-200/80 text-[#526477] hover:bg-slate-50 hover:text-[#102033]'
    }`}
  >
    {Icon && <Icon className="w-4 h-4" />}
    {label}
    {badge != null && badge > 0 && (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/20 text-white' : 'bg-rose-600 text-white'}`}>
        {badge}
      </span>
    )}
  </button>
);

// ─── Main Head Master Operational Dashboard ───────────────────────────────────
export const HmDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    summary,
    summaryLoading,
    staffApprovals,
    studentApprovals,
    approvalsLoading,
    classes,
    sections,
    subjects,
    assignments,
    assignmentsLoading,
    attendanceAnalytics,
    attendanceLoading,
    exams,
    activeExamResults,
    examsLoading,
    transfers,
    transfersLoading,
    notices,
    noticesLoading,
  } = useSelector((state) => state.hm);

  const [activeTab, setActiveTab] = useState('overview');

  // Modal States
  const [approvalModal, setApprovalModal] = useState({ open: false, user: null, type: 'staff' });
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [newClassModal, setNewClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('');
  const [newSectionModal, setNewSectionModal] = useState(false);
  const [newSectionData, setNewSectionData] = useState({ classId: '', name: '', capacity: 40, roomNumber: '' });
  const [newSubjectModal, setNewSubjectModal] = useState(false);
  const [newSubjectData, setNewSubjectData] = useState({ classId: '', name: '', code: '', totalMarks: 100, passingMarks: 33 });
  const [assignDutyModal, setAssignDutyModal] = useState(false);
  const [dutyData, setDutyData] = useState({ teacherId: '', classId: '', sectionId: '', subjectId: '', academicSession: '2025-2026' });
  const [newExamModal, setNewExamModal] = useState(false);
  const [examData, setExamData] = useState({ title: '', examType: 'MID_TERM', academicYear: '2025-2026', startDate: '', endDate: '' });
  const [selectedExamId, setSelectedExamId] = useState('');
  const [joiningModal, setJoiningModal] = useState({ open: false, transfer: null, remarks: '', joiningDate: '' });
  const [newNoticeModal, setNewNoticeModal] = useState(false);
  const [noticeData, setNoticeData] = useState({ title: '', documentType: 'CIRCULAR', fileUrl: '', description: '', targetAudience: ['TEACHERS', 'STUDENTS', 'PARENTS'] });

  // Initial load
  useEffect(() => {
    dispatch(fetchHmSummary());
  }, [dispatch]);

  // Tab-specific data loading via Redux thunks
  useEffect(() => {
    if (activeTab === 'approvals') {
      dispatch(fetchPendingApprovals('staff'));
      dispatch(fetchPendingApprovals('student'));
    } else if (activeTab === 'academics') {
      dispatch(fetchAcademicClasses());
      dispatch(fetchAcademicSections());
      dispatch(fetchAcademicSubjects());
    } else if (activeTab === 'assignments') {
      dispatch(fetchTeachingAssignments());
      dispatch(fetchAcademicClasses());
      dispatch(fetchAcademicSections());
      dispatch(fetchAcademicSubjects());
    } else if (activeTab === 'attendance') {
      dispatch(fetchAttendanceAnalytics());
    } else if (activeTab === 'exams') {
      dispatch(fetchExamsList());
    } else if (activeTab === 'transfers') {
      dispatch(fetchIncomingTransfers());
    } else if (activeTab === 'notices') {
      dispatch(fetchSchoolNotices());
    }
  }, [activeTab, dispatch]);

  const handleRefreshAll = () => {
    dispatch(fetchHmSummary());
    toast.success('School command center updated.');
  };

  // ─── Approval Decision Handler ──────────────────────────────────────────────
  const handleProcessApproval = async (decision) => {
    if (!approvalModal.user) return;
    if ((decision === 'REJECT' || decision === 'REQUEST_CORRECTION') && !approvalRemarks.trim()) {
      toast.error('Remarks are mandatory when rejecting or requesting correction.');
      return;
    }

    try {
      await dispatch(
        submitApprovalDecision({
          userId: approvalModal.user.userId || approvalModal.user._id,
          decision,
          remarks: approvalRemarks.trim(),
          type: approvalModal.type,
        })
      ).unwrap();
      toast.success(`Application marked as ${decision}.`);
      setApprovalModal({ open: false, user: null, type: 'staff' });
      setApprovalRemarks('');
    } catch (err) {
      toast.error(err || 'Failed to process decision.');
    }
  };

  // ─── Academic Actions ───────────────────────────────────────────────────────
  const handleCreateClassSubmit = async (e) => {
    e.preventDefault();
    if (!newClassName || !newClassGrade) return;
    try {
      await dispatch(
        createAcademicClass({
          schoolId: user?.schoolId?._id || user?.schoolId,
          name: newClassName.trim(),
          numericGrade: parseInt(newClassGrade, 10),
        })
      ).unwrap();
      toast.success(`Class "${newClassName}" created.`);
      setNewClassName('');
      setNewClassGrade('');
      setNewClassModal(false);
    } catch (err) {
      toast.error(err || 'Failed to create class.');
    }
  };

  const handleCreateSectionSubmit = async (e) => {
    e.preventDefault();
    if (!newSectionData.classId || !newSectionData.name) return;
    try {
      await dispatch(
        createAcademicSection({
          schoolId: user?.schoolId?._id || user?.schoolId,
          ...newSectionData,
        })
      ).unwrap();
      toast.success(`Section "${newSectionData.name}" created.`);
      setNewSectionModal(false);
    } catch (err) {
      toast.error(err || 'Failed to create section.');
    }
  };

  const handleCreateSubjectSubmit = async (e) => {
    e.preventDefault();
    if (!newSubjectData.classId || !newSubjectData.name) return;
    try {
      await dispatch(
        createAcademicSubject({
          schoolId: user?.schoolId?._id || user?.schoolId,
          ...newSubjectData,
        })
      ).unwrap();
      toast.success(`Subject "${newSubjectData.name}" added.`);
      setNewSubjectModal(false);
    } catch (err) {
      toast.error(err || 'Failed to add subject.');
    }
  };

  // ─── Teaching Assignment Handler ───────────────────────────────────────────
  const handleAssignDutySubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        assignTeachingDuty({
          schoolId: user?.schoolId?._id || user?.schoolId,
          ...dutyData,
        })
      ).unwrap();
      toast.success('Teaching assignment allocated.');
      setAssignDutyModal(false);
    } catch (err) {
      toast.error(err || 'Failed to allocate assignment.');
    }
  };

  const handleEndDuty = async (assignmentId) => {
    const reason = window.prompt('Enter reason for concluding teaching assignment:');
    if (!reason || !reason.trim()) return;
    try {
      await dispatch(terminateTeachingDuty({ id: assignmentId, reason: reason.trim() })).unwrap();
      toast.success('Teaching duty archived.');
    } catch (err) {
      toast.error(err || 'Failed to end duty.');
    }
  };

  // ─── Transfer Joining Handler ───────────────────────────────────────────────
  const handleConfirmJoining = async () => {
    if (!joiningModal.transfer) return;
    try {
      await dispatch(
        approveTransferJoining({
          id: joiningModal.transfer._id,
          joiningDate: joiningModal.joiningDate || new Date().toISOString(),
          remarks: joiningModal.remarks.trim(),
        })
      ).unwrap();
      toast.success('Faculty physical joining verified and approved.');
      setJoiningModal({ open: false, transfer: null, remarks: '', joiningDate: '' });
    } catch (err) {
      toast.error(err || 'Failed to approve joining.');
    }
  };

  // ─── Exam Handlers ─────────────────────────────────────────────────────────
  const handleScheduleExamSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        scheduleExam({
          schoolId: user?.schoolId?._id || user?.schoolId,
          ...examData,
        })
      ).unwrap();
      toast.success('Examination scheduled.');
      setNewExamModal(false);
    } catch (err) {
      toast.error(err || 'Failed to schedule exam.');
    }
  };

  const handleSelectExam = (examId) => {
    setSelectedExamId(examId);
    dispatch(fetchExamResults({ examId }));
  };

  const handleVerifyMarks = async (resultId) => {
    try {
      await dispatch(verifyStudentResult({ resultId, examId: selectedExamId, remarks: 'Verified by HM' })).unwrap();
      toast.success('Marks verified.');
    } catch (err) {
      toast.error(err || 'Failed to verify marks.');
    }
  };

  const handlePublishGazette = async (examId) => {
    if (!window.confirm('Publish officially verified results for this examination?')) return;
    try {
      await dispatch(publishExamGazette(examId)).unwrap();
      toast.success('Exam gazette officially published.');
    } catch (err) {
      toast.error(err || 'Failed to publish gazette.');
    }
  };

  // ─── Notice Publishing Handler ──────────────────────────────────────────────
  const handlePublishNoticeSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        publishSchoolNotice({
          schoolId: user?.schoolId?._id || user?.schoolId,
          ...noticeData,
        })
      ).unwrap();
      toast.success('School circular published.');
      setNewNoticeModal(false);
    } catch (err) {
      toast.error(err || 'Failed to publish circular.');
    }
  };

  const totalPendingCount =
    (summary?.metrics?.pendingQueues?.totalPendingActions) ||
    ((staffApprovals?.length || 0) + (studentApprovals?.length || 0) + (transfers?.length || 0));

  return (
    <PageContainer
      title="HEAD MASTER OPERATIONAL COMMAND CENTER"
      subtitle={`Education Department Liaquatabad Town Centre (DMC) • ${user?.schoolId?.name || 'Assigned Municipal School'}`}
      actions={
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-[#4B7F3A]">
            School Jurisdiction: {user?.schoolId?.code || user?.schoolId?.schoolCode || 'Active'}
          </span>
          <button
            onClick={handleRefreshAll}
            className="p-2 rounded-xl bg-white border border-slate-200/80 text-[#526477] hover:text-[#102033] hover:bg-slate-50 transition shadow-sm cursor-pointer"
            title="Refresh Command Center"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      }
    >
      {/* ── Tabs Navigation ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6 pb-2 border-b border-slate-200/60">
        <TabBtn label="Command Center" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={School} />
        <TabBtn label="Approvals" active={activeTab === 'approvals'} onClick={() => setActiveTab('approvals')} badge={totalPendingCount} icon={UserCheck} />
        <TabBtn label="Academic Setup" active={activeTab === 'academics'} onClick={() => setActiveTab('academics')} icon={BookMarked} />
        <TabBtn label="Teaching Duties" active={activeTab === 'assignments'} onClick={() => setActiveTab('assignments')} icon={BookOpen} />
        <TabBtn label="Attendance" active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={ClipboardCheck} />
        <TabBtn label="Exams & Gazette" active={activeTab === 'exams'} onClick={() => setActiveTab('exams')} icon={Award} />
        <TabBtn label="Incoming Transfers" active={activeTab === 'transfers'} onClick={() => setActiveTab('transfers')} badge={transfers?.length || 0} icon={ArrowLeftRight} />
        <TabBtn label="School Circulars" active={activeTab === 'notices'} onClick={() => setActiveTab('notices')} icon={FileText} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: COMMAND CENTER (OVERVIEW)                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={GraduationCap}
              label="Enrolled Students"
              value={summary?.metrics?.totalStudents}
              subtext="Active in this school"
              color="blue"
              loading={summaryLoading}
            />
            <StatCard
              icon={Users}
              label="Teaching Faculty"
              value={summary?.metrics?.teachingStaff}
              subtext={`Plus ${summary?.metrics?.nonTeachingStaff ?? 0} support staff`}
              color="emerald"
              loading={summaryLoading}
            />
            <StatCard
              icon={ClipboardCheck}
              label="Today Attendance"
              value={summary?.metrics?.todayAttendance?.attendancePercentage != null ? `${summary.metrics.todayAttendance.attendancePercentage}%` : 'Pending'}
              subtext={`${summary?.metrics?.todaySubmittedSections ?? 0} of ${summary?.metrics?.totalSections ?? 0} sections submitted`}
              color="indigo"
              loading={summaryLoading}
            />
            <StatCard
              icon={AlertTriangle}
              label="Pending Actions"
              value={totalPendingCount}
              subtext="Staff, students & transfers"
              color={totalPendingCount > 0 ? 'rose' : 'emerald'}
              loading={summaryLoading}
            />
          </div>

          {/* Institutional Metadata & Authority Confirmation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#006AC7]" />
                  School Institutional Profile
                </h3>
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-[#006AC7] border border-blue-200 font-semibold">
                  {summary?.school?.schoolType || 'MUNICIPAL'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-xs text-[#8094A8] font-semibold uppercase block">Institution Name</span>
                  <span className="font-bold text-[#102033] text-sm">{summary?.school?.name || user?.schoolId?.name || '—'}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-xs text-[#8094A8] font-semibold uppercase block">SEMIS / School Code</span>
                  <span className="font-mono font-bold text-[#006AC7] text-sm">{summary?.school?.code || '—'}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-xs text-[#8094A8] font-semibold uppercase block">Administrative Head (HM)</span>
                  <span className="font-bold text-[#102033] text-sm">{user?.fullName}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-xs text-[#8094A8] font-semibold uppercase block">Jurisdiction Scope</span>
                  <span className="font-mono font-bold text-[#4B7F3A] text-sm">SCHOOL ({user?.schoolId?._id || user?.schoolId})</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#4B7F3A] font-medium flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0 text-[#4B7F3A]" />
                <span>
                  Authoritative school boundary active. Cross-school access and unauthorized escalations are blocked server-side.
                </span>
              </div>
            </div>

            {/* Quick Action Queue */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Action Queues
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                  <span className="text-[#526477] font-medium">Pending Staff Registrations</span>
                  <span className="font-bold font-mono px-2 py-0.5 rounded bg-blue-50 text-[#006AC7]">{summary?.metrics?.pendingQueues?.staffApprovals ?? 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                  <span className="text-[#526477] font-medium">Student Admission Queue</span>
                  <span className="font-bold font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">{summary?.metrics?.pendingQueues?.studentAdmissions ?? 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                  <span className="text-[#526477] font-medium">Transfers Awaiting Joining</span>
                  <span className="font-bold font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700">{summary?.metrics?.pendingQueues?.incomingTransfers ?? 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                  <span className="text-[#526477] font-medium">Unverified Attendance Records</span>
                  <span className="font-bold font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700">{summary?.metrics?.pendingQueues?.unverifiedAttendance ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: STAFF & STUDENT APPROVALS                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          {/* Staff Approvals Section */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#4B7F3A]" />
              Pending Teacher & Support Staff Registrations
            </h3>
            {approvalsLoading ? (
              <div className="flex items-center gap-2 p-6 text-sm text-[#526477]"><Loader2 className="w-4 h-4 animate-spin text-[#006AC7]" /> Loading applications...</div>
            ) : staffApprovals.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#8094A8] bg-slate-50 rounded-xl border border-slate-200/60">No pending staff applications for your school.</div>
            ) : (
              <div className="space-y-3">
                {staffApprovals.map((appItem) => (
                  <div key={appItem.userId || appItem._id} className="p-4 rounded-xl border border-slate-200/80 hover:bg-slate-50/60 transition flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#102033] text-sm">{appItem.fullName}</p>
                      <p className="text-xs text-[#526477] mt-0.5">{appItem.designation || 'Teacher'} • {appItem.email} • CNIC: {appItem.cnicMasked || 'Protected'}</p>
                    </div>
                    <button
                      onClick={() => setApprovalModal({ open: true, user: appItem, type: 'staff' })}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#006AC7] hover:bg-[#005299] text-white transition cursor-pointer"
                    >
                      Review Application
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Student Admission Approvals Section */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              Student Admission Verification Queue
            </h3>
            {studentApprovals.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#8094A8] bg-slate-50 rounded-xl border border-slate-200/60">No pending student admission records.</div>
            ) : (
              <div className="space-y-3">
                {studentApprovals.map((stuItem) => (
                  <div key={stuItem.userId || stuItem._id} className="p-4 rounded-xl border border-slate-200/80 hover:bg-slate-50/60 transition flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#102033] text-sm">{stuItem.fullName}</p>
                      <p className="text-xs text-[#526477] mt-0.5">Role: STUDENT • {stuItem.email}</p>
                    </div>
                    <button
                      onClick={() => setApprovalModal({ open: true, user: stuItem, type: 'student' })}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#006AC7] hover:bg-[#005299] text-white transition cursor-pointer"
                    >
                      Verify Admission
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: ACADEMIC SETUP                                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'academics' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-bold text-[#102033]">School Academic Structure</h3>
            <div className="flex gap-2">
              <button onClick={() => setNewClassModal(true)} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#006AC7] text-white flex items-center gap-1.5 shadow-sm cursor-pointer">
                <PlusCircle className="w-3.5 h-3.5" /> Add Class
              </button>
              <button onClick={() => setNewSectionModal(true)} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-[#102033] flex items-center gap-1.5 shadow-sm cursor-pointer">
                <PlusCircle className="w-3.5 h-3.5" /> Add Section
              </button>
              <button onClick={() => setNewSubjectModal(true)} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-[#102033] flex items-center gap-1.5 shadow-sm cursor-pointer">
                <PlusCircle className="w-3.5 h-3.5" /> Add Subject
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Classes Column */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase text-[#8094A8] tracking-wider">Classes ({classes.length})</h4>
              <div className="space-y-2">
                {classes.map((c) => (
                  <div key={c._id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#102033]">{c.name}</span>
                    <span className="font-mono text-[#006AC7]">{c.code}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sections Column */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase text-[#8094A8] tracking-wider">Sections ({sections.length})</h4>
              <div className="space-y-2">
                {sections.map((s) => (
                  <div key={s._id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#102033]">Section {s.name}</p>
                      <p className="text-[10px] text-[#8094A8]">Room: {s.roomNumber || '—'}</p>
                    </div>
                    <span className="text-xs text-[#526477]">Cap: {s.capacity || 40}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subjects Column */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase text-[#8094A8] tracking-wider">Curriculum Subjects ({subjects.length})</h4>
              <div className="space-y-2">
                {subjects.map((sub) => (
                  <div key={sub._id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#102033]">{sub.name}</span>
                    <span className="font-mono text-[#4B7F3A]">{sub.code || 'SUB'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: TEACHING ASSIGNMENTS (THE SECURITY ANCHOR)                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#102033]">Authoritative Faculty Teaching Assignments</h3>
              <p className="text-xs text-[#526477]">
                TeachingAssignment is the sole authorization anchor for marking attendance, entering homework, and inputting exam marks.
              </p>
            </div>
            <button
              onClick={() => setAssignDutyModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#006AC7] text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Allocate Assignment
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase text-[#8094A8] tracking-wider">
              Active Allocations ({assignments?.activeAssignments?.length || 0})
            </h4>
            {assignmentsLoading ? (
              <div className="flex items-center gap-2 text-sm text-[#526477]"><Loader2 className="w-4 h-4 animate-spin text-[#006AC7]" /> Loading allocations...</div>
            ) : (assignments?.activeAssignments?.length || 0) === 0 ? (
              <div className="p-6 text-center text-sm text-[#8094A8] bg-slate-50 rounded-xl">No active teaching allocations. Allocate duties above.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-[#8094A8] uppercase text-[11px] font-bold">
                      <th className="py-2.5 px-3">Faculty Teacher</th>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-3">Section</th>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3">Session</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assignments.activeAssignments.map((a) => (
                      <tr key={a._id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-3 font-bold text-[#102033]">{a.teacherId?.fullName}</td>
                        <td className="py-3 px-3">{a.classId?.name}</td>
                        <td className="py-3 px-3">{a.sectionId?.name}</td>
                        <td className="py-3 px-3 font-semibold text-[#006AC7]">{a.subjectId?.name}</td>
                        <td className="py-3 px-3 font-mono">{a.academicSession}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleEndDuty(a._id)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                          >
                            End Duty
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: DAILY ATTENDANCE OVERSIGHT                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#4B7F3A]" />
                Daily Attendance Verification & Intelligence
              </h3>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-[#4B7F3A] border border-emerald-200 font-bold">
                Level 50 Authority
              </span>
            </div>

            {attendanceLoading ? (
              <div className="flex items-center gap-2 text-sm text-[#526477]"><Loader2 className="w-4 h-4 animate-spin text-[#006AC7]" /> Loading attendance analytics...</div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-xs text-[#8094A8] font-bold uppercase block">Current Month Aggregate</span>
                    <span className="text-2xl font-black text-[#006AC7]">{attendanceAnalytics?.aggregates?.currentMonthPct ?? '—'}%</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-xs text-[#8094A8] font-bold uppercase block">Last Month Benchmark</span>
                    <span className="text-2xl font-black text-purple-700">{attendanceAnalytics?.aggregates?.lastMonthPct ?? '—'}%</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-xs text-[#8094A8] font-bold uppercase block">Academic Session Avg</span>
                    <span className="text-2xl font-black text-amber-700">{attendanceAnalytics?.aggregates?.overallSessionPct ?? '—'}%</span>
                  </div>
                </div>

                <p className="text-xs text-[#526477] leading-relaxed">
                  Head Masters verify paper-register uploads, evaluate late justification thresholds, and conduct institutional oversight. Daily classroom marking remains delegated to teachers with valid TeachingAssignments.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 6: EXAMINATIONS & GAZETTE                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#102033]">School Examinations & Results Gazette</h3>
              <p className="text-xs text-[#526477]">Documented lifecycle: DRAFT → SUBMITTED → VERIFIED_BY_HM → PUBLISHED</p>
            </div>
            <button
              onClick={() => setNewExamModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#006AC7] text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Schedule New Exam
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Exams list */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase text-[#8094A8] tracking-wider">Scheduled Exams ({exams.length})</h4>
              <div className="space-y-2">
                {exams.map((ex) => (
                  <div
                    key={ex._id}
                    onClick={() => handleSelectExam(ex._id)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer ${
                      selectedExamId === ex._id ? 'border-[#006AC7] bg-blue-50/40 ring-1 ring-[#006AC7]' : 'border-slate-200/60 bg-slate-50 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#102033]">{ex.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${ex.status === 'PUBLISHED' ? 'bg-emerald-50 text-[#4B7F3A]' : 'bg-blue-50 text-[#006AC7]'}`}>
                        {ex.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#526477] mt-1">{ex.examType} • {ex.academicYear}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Results Review Table */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase text-[#8094A8] tracking-wider">
                  Exam Results {activeExamResults?.exam?.title ? `— ${activeExamResults.exam.title}` : ''}
                </h4>
                {selectedExamId && (
                  <button
                    onClick={() => handlePublishGazette(selectedExamId)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#4B7F3A] hover:bg-[#3d682f] text-white transition cursor-pointer"
                  >
                    Publish Gazette
                  </button>
                )}
              </div>

              {!selectedExamId ? (
                <div className="p-8 text-center text-sm text-[#8094A8]">Select an examination on the left to review student marks.</div>
              ) : (activeExamResults?.results?.length || 0) === 0 ? (
                <div className="p-8 text-center text-sm text-[#8094A8]">No submitted student marks found for this examination.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/80 text-[#8094A8] uppercase text-[10px] font-bold">
                        <th className="py-2 px-2">Student</th>
                        <th className="py-2 px-2">Class</th>
                        <th className="py-2 px-2">Obtained / Total</th>
                        <th className="py-2 px-2">Percentage</th>
                        <th className="py-2 px-2">Grade</th>
                        <th className="py-2 px-2">Status</th>
                        <th className="py-2 px-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeExamResults.results.map((res) => (
                        <tr key={res._id} className="hover:bg-slate-50/60">
                          <td className="py-2 px-2 font-bold text-[#102033]">{res.studentId?.fullName}</td>
                          <td className="py-2 px-2">{res.classId?.name}</td>
                          <td className="py-2 px-2 font-mono">{res.totalObtainedMarks} / {res.totalMaxMarks}</td>
                          <td className="py-2 px-2 font-bold text-[#006AC7]">{res.percentage}%</td>
                          <td className="py-2 px-2 font-mono font-bold">{res.grade}</td>
                          <td className="py-2 px-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              res.status === 'PUBLISHED' ? 'bg-emerald-50 text-[#4B7F3A]' :
                              res.status === 'VERIFIED_BY_HM' ? 'bg-blue-50 text-[#006AC7]' :
                              'bg-amber-50 text-amber-700'
                            }`}>
                              {res.status}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right">
                            {res.status !== 'VERIFIED_BY_HM' && res.status !== 'PUBLISHED' && (
                              <button
                                onClick={() => handleVerifyMarks(res._id)}
                                className="px-2 py-1 rounded bg-[#006AC7] text-white text-[10px] font-bold hover:bg-[#005299] transition cursor-pointer"
                              >
                                Verify
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 7: INCOMING TRANSFERS                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'transfers' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-[#006AC7]" />
                  Incoming Faculty Transfers Awaiting Physical Arrival
                </h3>
                <p className="text-xs text-[#526477] mt-0.5">
                  Only the Destination Head Master can certify physical arrival and approve joining. Old teaching assignments expire automatically.
                </p>
              </div>
            </div>

            {transfersLoading ? (
              <div className="flex items-center gap-2 text-sm text-[#526477]"><Loader2 className="w-4 h-4 animate-spin text-[#006AC7]" /> Loading transfer directives...</div>
            ) : transfers.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#8094A8] bg-slate-50 rounded-xl">No pending incoming faculty transfers for your school.</div>
            ) : (
              <div className="space-y-3">
                {transfers.map((tr) => (
                  <div key={tr._id} className="p-4 rounded-xl border border-slate-200/80 hover:bg-slate-50/60 transition flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#102033] text-sm">{tr.teacherUserId?.fullName}</p>
                      <p className="text-xs text-[#526477] mt-0.5">
                        From: <span className="font-semibold">{tr.fromSchoolId?.name}</span> → Destination: <span className="font-semibold text-[#006AC7]">{tr.toSchoolId?.name}</span>
                      </p>
                      <p className="text-xs text-[#8094A8] mt-1">Reason: {tr.reason} • Status: <span className="font-mono font-bold text-amber-700">{tr.status}</span></p>
                    </div>
                    {tr.status === 'AWAITING_DESTINATION_HM' && (
                      <button
                        onClick={() => setJoiningModal({ open: true, transfer: tr, remarks: '', joiningDate: new Date().toISOString().split('T')[0] })}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#4B7F3A] hover:bg-[#3d682f] text-white transition cursor-pointer shadow-sm"
                      >
                        Approve Physical Joining
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 8: SCHOOL CIRCULARS & NOTICES                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'notices' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#102033]">School Internal Notices & Circulars</h3>
              <p className="text-xs text-[#526477]">Restricted strictly to your school's Teachers, Students, and Parents.</p>
            </div>
            <button
              onClick={() => setNewNoticeModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#006AC7] text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Publish Circular
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase text-[#8094A8] tracking-wider">Active Circulars ({notices.length})</h4>
            {noticesLoading ? (
              <div className="flex items-center gap-2 text-sm text-[#526477]"><Loader2 className="w-4 h-4 animate-spin text-[#006AC7]" /> Loading circulars...</div>
            ) : notices.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#8094A8] bg-slate-50 rounded-xl">No circulars published for your school yet.</div>
            ) : (
              <div className="space-y-3">
                {notices.map((doc) => (
                  <div key={doc._id} className="p-4 rounded-xl border border-slate-200/80 hover:bg-slate-50/60 transition flex items-start justify-between">
                    <div>
                      <p className="font-bold text-[#102033] text-sm">{doc.title}</p>
                      <p className="text-xs text-[#526477] mt-0.5">{doc.documentType} • Audience: {doc.targetAudience?.join(', ')}</p>
                      {doc.description && <p className="text-xs text-[#8094A8] mt-1">{doc.description}</p>}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-[#006AC7] font-bold">
                      {new Date(doc.createdAt).toLocaleDateString('en-PK')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODALS                                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* Approval Decision Modal */}
      {approvalModal.open && approvalModal.user && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#102033]">
              Review Application: {approvalModal.user.fullName}
            </h3>
            <div className="text-xs text-[#526477] space-y-1 bg-slate-50 p-3 rounded-xl border">
              <p><span className="font-semibold text-[#102033]">Role:</span> {approvalModal.user.role}</p>
              <p><span className="font-semibold text-[#102033]">Email:</span> {approvalModal.user.email}</p>
              <p><span className="font-semibold text-[#102033]">CNIC:</span> {approvalModal.user.cnicMasked || 'Protected'}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Administrative Remarks</label>
              <textarea
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                placeholder="Required when rejecting or requesting correction..."
                rows={3}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setApprovalModal({ open: false, user: null, type: 'staff' })}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#526477] hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleProcessApproval('REJECT')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer"
              >
                Reject
              </button>
              <button
                onClick={() => handleProcessApproval('APPROVE')}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#4B7F3A] hover:bg-[#3d682f] text-white cursor-pointer"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Class Modal */}
      {newClassModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateClassSubmit} className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#102033]">Add Academic Class</h3>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Class Name</label>
              <input
                type="text"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="e.g. Class 6"
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Numeric Grade Level (1 - 12)</label>
              <input
                type="number"
                min={1}
                max={12}
                value={newClassGrade}
                onChange={(e) => setNewClassGrade(e.target.value)}
                placeholder="e.g. 6"
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setNewClassModal(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#526477]">Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#006AC7] text-white">Create Class</button>
            </div>
          </form>
        </div>
      )}

      {/* New Section Modal */}
      {newSectionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateSectionSubmit} className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#102033]">Add Section</h3>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Select Class</label>
              <select
                value={newSectionData.classId}
                onChange={(e) => setNewSectionData({ ...newSectionData, classId: e.target.value })}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              >
                <option value="">-- Choose Class --</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Section Name</label>
              <input
                type="text"
                value={newSectionData.name}
                onChange={(e) => setNewSectionData({ ...newSectionData, name: e.target.value })}
                placeholder="e.g. A, B, Green"
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setNewSectionModal(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#526477]">Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#006AC7] text-white">Create Section</button>
            </div>
          </form>
        </div>
      )}

      {/* New Subject Modal */}
      {newSubjectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateSubjectSubmit} className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#102033]">Add Subject</h3>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Select Class</label>
              <select
                value={newSubjectData.classId}
                onChange={(e) => setNewSubjectData({ ...newSubjectData, classId: e.target.value })}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              >
                <option value="">-- Choose Class --</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Subject Name</label>
              <input
                type="text"
                value={newSubjectData.name}
                onChange={(e) => setNewSubjectData({ ...newSubjectData, name: e.target.value })}
                placeholder="e.g. Mathematics, Science"
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setNewSubjectModal(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#526477]">Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#006AC7] text-white">Add Subject</button>
            </div>
          </form>
        </div>
      )}

      {/* Assign Teaching Duty Modal */}
      {assignDutyModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAssignDutySubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#102033]">Allocate Teaching Assignment</h3>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Select Class</label>
              <select
                value={dutyData.classId}
                onChange={(e) => setDutyData({ ...dutyData, classId: e.target.value })}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              >
                <option value="">-- Choose Class --</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Select Section</label>
              <select
                value={dutyData.sectionId}
                onChange={(e) => setDutyData({ ...dutyData, sectionId: e.target.value })}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              >
                <option value="">-- Choose Section --</option>
                {sections
                  .filter((s) => !dutyData.classId || String(s.classId) === String(dutyData.classId) || String(s.classId?._id) === String(dutyData.classId))
                  .map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Select Subject</label>
              <select
                value={dutyData.subjectId}
                onChange={(e) => setDutyData({ ...dutyData, subjectId: e.target.value })}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              >
                <option value="">-- Choose Subject --</option>
                {subjects.map((sub) => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Teacher User ID</label>
              <input
                type="text"
                value={dutyData.teacherId}
                onChange={(e) => setDutyData({ ...dutyData, teacherId: e.target.value })}
                placeholder="24-character Teacher ObjectId"
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setAssignDutyModal(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#526477]">Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#006AC7] text-white">Confirm Assignment</button>
            </div>
          </form>
        </div>
      )}

      {/* Schedule Exam Modal */}
      {newExamModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleScheduleExamSubmit} className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#102033]">Schedule Examination</h3>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Exam Title</label>
              <input
                type="text"
                value={examData.title}
                onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                placeholder="e.g. Mid-Term Examination 2025"
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Exam Type</label>
              <select
                value={examData.examType}
                onChange={(e) => setExamData({ ...examData, examType: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              >
                <option value="MID_TERM">Mid-Term</option>
                <option value="FINAL_TERM">Final-Term</option>
                <option value="MONTHLY_TEST">Monthly Test</option>
                <option value="ASSESSMENT">Diagnostic Assessment</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Start Date</label>
              <input
                type="date"
                value={examData.startDate}
                onChange={(e) => setExamData({ ...examData, startDate: e.target.value })}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">End Date</label>
              <input
                type="date"
                value={examData.endDate}
                onChange={(e) => setExamData({ ...examData, endDate: e.target.value })}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setNewExamModal(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#526477]">Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#006AC7] text-white">Schedule</button>
            </div>
          </form>
        </div>
      )}

      {/* Transfer Joining Modal */}
      {joiningModal.open && joiningModal.transfer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#102033]">
              Confirm Faculty Arrival & Joining
            </h3>
            <div className="text-xs text-[#526477] bg-slate-50 p-3 rounded-xl border space-y-1">
              <p><span className="font-semibold text-[#102033]">Teacher:</span> {joiningModal.transfer.teacherUserId?.fullName}</p>
              <p><span className="font-semibold text-[#102033]">Source School:</span> {joiningModal.transfer.fromSchoolId?.name}</p>
              <p><span className="font-semibold text-[#102033]">Destination:</span> {joiningModal.transfer.toSchoolId?.name}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Confirmed Joining Date</label>
              <input
                type="date"
                value={joiningModal.joiningDate}
                onChange={(e) => setJoiningModal({ ...joiningModal, joiningDate: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Head Master Joining Remarks</label>
              <input
                type="text"
                value={joiningModal.remarks}
                onChange={(e) => setJoiningModal({ ...joiningModal, remarks: e.target.value })}
                placeholder="e.g. Physical report submitted and accepted"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setJoiningModal({ open: false, transfer: null, remarks: '', joiningDate: '' })} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#526477]">Cancel</button>
              <button onClick={handleConfirmJoining} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#4B7F3A] text-white">Approve Joining</button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Notice Modal */}
      {newNoticeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={handlePublishNoticeSubmit} className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#102033]">Publish School Circular</h3>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Circular Title</label>
              <input
                type="text"
                value={noticeData.title}
                onChange={(e) => setNoticeData({ ...noticeData, title: e.target.value })}
                placeholder="e.g. Winter Schedule Notice"
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Document Link / URL</label>
              <input
                type="url"
                value={noticeData.fileUrl}
                onChange={(e) => setNoticeData({ ...noticeData, fileUrl: e.target.value })}
                placeholder="https://..."
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Description (Optional)</label>
              <textarea
                value={noticeData.description}
                onChange={(e) => setNoticeData({ ...noticeData, description: e.target.value })}
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setNewNoticeModal(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#526477]">Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#006AC7] text-white">Publish Circular</button>
            </div>
          </form>
        </div>
      )}
    </PageContainer>
  );
};

export default HmDashboard;
