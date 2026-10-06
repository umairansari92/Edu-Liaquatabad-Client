
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import {
  GraduationCap,
  Users,
  ClipboardCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Building,
  RefreshCw,
  CheckCircle2,
  BookOpen,
  UserCheck,
  BookMarked,
  FileText,
  CalendarDays,
  Award,
  ArrowLeftRight,
  Sparkles,
  Info,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';

/**
 * Custom Chart Tooltip Component
 * Provides clean, high-contrast dark card tooltips for Recharts.
 */
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-xs text-white text-xs rounded-xl py-2 px-3 shadow-lg border border-slate-800 space-y-1">
        <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="flex items-center gap-2 font-mono">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="text-slate-300 capitalize">{entry.name}:</span>
            <span className="font-bold text-white">
              {entry.value}
              {entry.name === 'percentage' || entry.name === 'Attendance Rate' ? '%' : ''}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * Container & Item Animation Variants (Motion)
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const HmOverviewTab = ({
  user,
  summary,
  summaryLoading,
  pendingIncomingTransfers = [],
  parentClaims = [],
  staffApprovals = [],
  studentApprovals = [],
  teacherAttendance,
  onSelectTab,
  onRefresh,
  onOpenTransfer,
  onOpenParentClaim,
  onOpenApproval,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dynamic time-based greeting using local runtime hours
  const greeting = useMemo(() => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return 'Good morning';
    if (currentHour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Dynamically formatted date string
  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-PK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  // Academic session (truthful: derived from summary or school metadata)
  const academicSession = summary?.school?.academicSession || summary?.academicYear || null;

  // Real KPI calculations from Redux summary state
  const totalStudents = summary?.metrics?.totalStudents ?? 0;
  const teachingStaffCount = summary?.metrics?.teachingStaff ?? 0;
  const attendancePercentage = summary?.metrics?.todayAttendance?.attendancePercentage;
  const totalSections = summary?.metrics?.totalSections ?? 0;
  const submittedSections = summary?.metrics?.todaySubmittedSections ?? 0;
  const unsubmittedSections = summary?.metrics?.unsubmittedSections ?? Math.max(0, totalSections - submittedSections);

  // Teaching coverage metrics
  const teachingCoverage = summary?.teachingCoverage;
  const sectionsWithCt = teachingCoverage?.sectionsWithClassTeacher ?? 0;
  const unassignedCtSections = teachingCoverage?.unassignedSections ?? Math.max(0, totalSections - sectionsWithCt);
  const activeAssignmentsCount = teachingCoverage?.activeAssignmentsCount ?? 0;

  // Teaching staff attendance helper
  const teacherAttendanceSubmitted = Boolean(
    teacherAttendance?.records?.length > 0 ||
    teacherAttendance?.roster?.some((rosterEntry) => rosterEntry.status)
  );
  const teachersPresentCount = useMemo(() => {
    if (!teacherAttendance?.roster) return 0;
    return teacherAttendance.roster.filter((rosterEntry) => rosterEntry.status === 'PRESENT').length;
  }, [teacherAttendance]);

  // Aggregate pending items count
  const pendingTransfersCount = pendingIncomingTransfers.length;
  const pendingParentClaimsCount = (parentClaims || []).filter(
    (claimItem) => claimItem.status === 'PENDING_HM_APPROVAL'
  ).length;
  const pendingStaffCount = (staffApprovals || []).length;
  const pendingStudentsCount = (studentApprovals || []).length;
  const unverifiedAttendanceCount = summary?.metrics?.pendingQueues?.unverifiedAttendance ?? 0;

  const totalPendingActions =
    summary?.metrics?.pendingQueues?.totalPendingActions ??
    (pendingTransfersCount + pendingParentClaimsCount + pendingStaffCount + pendingStudentsCount + unverifiedAttendanceCount);

  // School metadata
  const schoolName = summary?.school?.name || user?.schoolId?.name || 'Assigned Municipal School';
  const schoolCode = summary?.school?.code || '—';
  const schoolType = summary?.school?.schoolType || 'MUNICIPAL';
  const headMasterName = user?.fullName || 'Head Master';
  const designationLabel = user?.designation
    ? user.designation.replace(/\s*\(Break-Glass Recovery\)/i, '')
    : 'Head Master · BPS-17';

  // Real operational status pill derived from data (no fake motivational text)
  const operationalStatus = useMemo(() => {
    if (totalPendingActions === 0 && unsubmittedSections === 0) {
      return {
        label: 'All daily operations on track',
        isHealthy: true,
      };
    }
    const issues = [];
    if (unsubmittedSections > 0) issues.push(`${unsubmittedSections} unsubmitted section${unsubmittedSections > 1 ? 's' : ''}`);
    if (totalPendingActions > 0) issues.push(`${totalPendingActions} pending action${totalPendingActions > 1 ? 's' : ''}`);
    return {
      label: issues.join(' • '),
      isHealthy: false,
    };
  }, [totalPendingActions, unsubmittedSections]);

  // Attendance Trend Data & Historical Validation
  const attendanceTrendData = useMemo(() => {
    const list = summary?.attendanceTrend || [];
    return list.map((entry) => ({
      ...entry,
      percentage: entry.percentage != null ? entry.percentage : null,
    }));
  }, [summary?.attendanceTrend]);

  const hasAttendanceData = useMemo(() => {
    return attendanceTrendData.some((entry) => entry.total > 0 || entry.percentage != null);
  }, [attendanceTrendData]);

  // Average attendance calculation from real trend records
  const calculatedAverageAttendance = useMemo(() => {
    const validEntries = attendanceTrendData.filter((entry) => entry.percentage != null);
    if (validEntries.length === 0) return null;
    const sum = validEntries.reduce((acc, curr) => acc + curr.percentage, 0);
    return Number((sum / validEntries.length).toFixed(1));
  }, [attendanceTrendData]);

  // Student Distribution Data
  const studentDistributionData = useMemo(() => {
    return (summary?.studentDistribution || []).map((cls) => ({
      name: cls.className || `Grade ${cls.numericGrade}`,
      students: cls.studentCount,
      numericGrade: cls.numericGrade,
    }));
  }, [summary?.studentDistribution]);

  const hasStudentDistribution = useMemo(() => {
    return studentDistributionData.some((item) => item.students > 0);
  }, [studentDistributionData]);

  // Today's Timetable Schedule
  const todaySchedule = summary?.todaySchedule || [];
  const hasSchedule = todaySchedule.length > 0;

  // Recent School Activity Audit Records
  const recentActivity = summary?.recentActivity || [];
  const hasRecentActivity = recentActivity.length > 0;

  // Needs Attention items (from backend or merged fallback)
  const needsAttentionList = useMemo(() => {
    if (Array.isArray(summary?.needsAttention) && summary.needsAttention.length > 0) {
      return summary.needsAttention;
    }
    const fallbackList = [];
    if (unsubmittedSections > 0) {
      fallbackList.push({
        id: 'daily-attendance-pending',
        type: 'ATTENDANCE',
        priority: 'HIGH',
        title: 'Daily Attendance Pending',
        description: `${unsubmittedSections} of ${totalSections} sections have not submitted attendance today.`,
        actionTab: 'attendance',
        actionLabel: 'Record Attendance',
      });
    }
    if (unassignedCtSections > 0) {
      fallbackList.push({
        id: 'unassigned-class-teachers',
        type: 'CLASS_TEACHER',
        priority: 'MEDIUM',
        title: 'Unassigned Class Teachers',
        description: `${unassignedCtSections} section${unassignedCtSections > 1 ? 's do' : ' does'} not have a designated Class Teacher.`,
        actionTab: 'assignments',
        actionLabel: 'Assign Class Teacher',
      });
    }
    if (pendingTransfersCount > 0) {
      fallbackList.push({
        id: 'incoming-transfers',
        type: 'TRANSFER',
        priority: 'HIGH',
        title: 'Incoming Staff Joining',
        description: `${pendingTransfersCount} teacher transfer order${pendingTransfersCount > 1 ? 's' : ''} awaiting physical joining approval.`,
        actionTab: 'transfers',
        actionLabel: 'Review Joining',
      });
    }
    if (pendingParentClaimsCount > 0) {
      fallbackList.push({
        id: 'parent-claims',
        type: 'PARENT_CLAIM',
        priority: 'MEDIUM',
        title: 'Guardian Verification Claims',
        description: `${pendingParentClaimsCount} parent-student linkage claim${pendingParentClaimsCount > 1 ? 's' : ''} awaiting document verification.`,
        actionTab: 'approvals',
        actionLabel: 'Verify Claims',
      });
    }
    if (pendingStaffCount > 0) {
      fallbackList.push({
        id: 'staff-approvals',
        type: 'APPROVAL',
        priority: 'MEDIUM',
        title: 'Staff Registration Approvals',
        description: `${pendingStaffCount} new staff registration${pendingStaffCount > 1 ? 's' : ''} awaiting verification.`,
        actionTab: 'approvals',
        actionLabel: 'Review Staff',
      });
    }
    if (pendingStudentsCount > 0) {
      fallbackList.push({
        id: 'student-admissions',
        type: 'APPROVAL',
        priority: 'LOW',
        title: 'Student Admissions Pending',
        description: `${pendingStudentsCount} student admission application${pendingStudentsCount > 1 ? 's' : ''} awaiting decision.`,
        actionTab: 'approvals',
        actionLabel: 'Review Admissions',
      });
    }
    if (unverifiedAttendanceCount > 0) {
      fallbackList.push({
        id: 'unverified-attendance',
        type: 'ATTENDANCE_VERIFICATION',
        priority: 'MEDIUM',
        title: 'Attendance Verification Required',
        description: `${unverifiedAttendanceCount} attendance register${unverifiedAttendanceCount > 1 ? 's require' : ' requires'} Head Master verification stamp.`,
        actionTab: 'attendance',
        actionLabel: 'Verify Records',
      });
    }
    return fallbackList;
  }, [
    summary?.needsAttention,
    unsubmittedSections,
    totalSections,
    unassignedCtSections,
    pendingTransfersCount,
    pendingParentClaimsCount,
    pendingStaffCount,
    pendingStudentsCount,
    unverifiedAttendanceCount,
  ]);

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Humanize Audit Log Action names with institutional phrasing
  const humanizeAction = (actionStr) => {
    if (!actionStr) return 'Activity Recorded';
    const actionMap = {
      STUDENT_ATTENDANCE_RECORDED: 'Student Attendance Marked',
      STUDENT_ATTENDANCE_VERIFIED: 'Attendance Register Verified',
      SECTION_CLASS_TEACHER_DESIGNATED: 'Class Teacher Assigned',
      TEACHING_ASSIGNMENT_CREATED: 'Teaching Duty Assigned',
      TEACHING_ASSIGNMENT_TERMINATED: 'Teaching Duty Concluded',
      TEACHER_TRANSFER_JOINING_APPROVED: 'Incoming Staff Joining Approved',
      TEACHER_TRANSFER_RELIEVED: 'Staff Clearance & Relieving Issued',
      TEACHER_TRANSFER_REJECTED: 'Staff Joining Rejected',
      STUDENT_ENROLLED: 'New Student Admitted',
      STUDENT_STRUCK_OFF: 'Student Strike-Off Recorded',
      EXAM_CREATED: 'School Examination Scheduled',
      EXAM_MARKS_SUBMITTED: 'Exam Marks Submitted',
      EXAM_MARKS_VERIFIED: 'Exam Results Verified by HM',
      EXAM_GAZETTE_PUBLISHED: 'Exam Gazette Published',
      DOCUMENT_PUBLISHED: 'School Notice Published',
      DOCUMENT_ARCHIVED: 'School Notice Archived',
      PARENT_LINK_VERIFIED: 'Parent Linkage Claim Verified',
      PARENT_LINK_REJECTED: 'Parent Linkage Claim Rejected',
    };
    if (actionMap[actionStr]) return actionMap[actionStr];
    return actionStr
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (character) => character.toUpperCase());
  };

  // Skeleton Loader for initial or refreshing state
  if (summaryLoading && !summary) {
    return (
      <div className="space-y-6 animate-pulse" aria-label="Loading dashboard metrics">
        {/* Header Skeleton */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-4 w-48 bg-slate-200 rounded-md" />
            <div className="h-7 w-64 bg-slate-300 rounded-lg" />
            <div className="h-4 w-56 bg-slate-200 rounded-md" />
          </div>
          <div className="h-8 w-40 bg-slate-200 rounded-full" />
        </div>

        {/* 5 KPI Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-slate-200 rounded-md" />
                <div className="w-8 h-8 rounded-xl bg-slate-100" />
              </div>
              <div className="h-8 w-16 bg-slate-300 rounded-lg" />
              <div className="h-3 w-28 bg-slate-200 rounded-md pt-2" />
            </div>
          ))}
        </div>

        {/* Analytics Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs h-72 space-y-4">
            <div className="h-5 w-44 bg-slate-200 rounded-md" />
            <div className="h-48 w-full bg-slate-100 rounded-xl" />
          </div>
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs h-72 space-y-4">
            <div className="h-5 w-44 bg-slate-200 rounded-md" />
            <div className="h-48 w-full bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION A: COMPACT WELCOME & OPERATIONAL STATUS HEADER              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={itemVariants}
        className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>{formattedDate}</span>
            {academicSession && (
              <>
                <span className="text-slate-300">•</span>
                <span>Session {academicSession}</span>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {greeting}, {headMasterName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            {schoolName} <span className="text-slate-300">|</span> {designationLabel}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Truthful Operational Status Pill */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-2xs ${
              operationalStatus.isHealthy
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                operationalStatus.isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'
              }`}
              aria-hidden="true"
            />
            <span>{operationalStatus.label}</span>
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#006AC7] disabled:opacity-50"
            title="Refresh dashboard metrics"
            aria-label="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#006AC7]' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION B: 5 POLISHED KPI SUMMARY CARDS                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Students */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Students
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block tracking-tight">
                {totalStudents}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#006AC7] border border-blue-200/60">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 truncate mr-1">
              {totalStudents === 0 ? '0 active enrolled' : `${totalStudents} active students`}
            </span>
            <button
              type="button"
              onClick={() => onSelectTab('students')}
              className="text-[#006AC7] font-semibold hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              Directory <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>

        {/* KPI 2: Teaching Staff */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Teaching Staff
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block tracking-tight">
                {teachingStaffCount}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 truncate mr-1">
              {teacherAttendanceSubmitted
                ? `${teachersPresentCount}/${teachingStaffCount} on duty`
                : `${teachingStaffCount} active faculty`}
            </span>
            <button
              type="button"
              onClick={() => onSelectTab('faculty')}
              className="text-[#006AC7] font-semibold hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              Faculty <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>

        {/* KPI 3: Today's Attendance */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Today's Attendance
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block tracking-tight">
                {attendancePercentage != null ? `${attendancePercentage}%` : 'Pending'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 truncate mr-1">
              {totalSections > 0 && submittedSections === totalSections
                ? 'All sections marked'
                : `${submittedSections}/${totalSections} marked`}
            </span>
            <button
              type="button"
              onClick={() => onSelectTab('attendance')}
              className="text-[#006AC7] font-semibold hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              Register <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>

        {/* KPI 4: Class Teacher Coverage */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Class Teachers
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block tracking-tight">
                {totalSections > 0 ? `${sectionsWithCt}/${totalSections}` : `${sectionsWithCt}`}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/60">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 truncate mr-1">
              {unassignedCtSections === 0
                ? 'All sections assigned'
                : `${unassignedCtSections} section${unassignedCtSections > 1 ? 's' : ''} unassigned`}
            </span>
            <button
              type="button"
              onClick={() => onSelectTab('assignments')}
              className="text-[#006AC7] font-semibold hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              Duties <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>

        {/* KPI 5: Needs Attention */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Needs Attention
              </span>
              <span
                className={`text-2xl sm:text-3xl font-extrabold mt-1 block tracking-tight ${
                  totalPendingActions > 0 ? 'text-amber-600' : 'text-slate-900'
                }`}
              >
                {totalPendingActions}
              </span>
            </div>
            <div
              className={`p-2.5 rounded-xl border ${
                totalPendingActions > 0
                  ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
              }`}
            >
              {totalPendingActions > 0 ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 truncate mr-1">
              {totalPendingActions === 0 ? "You're all caught up" : `${totalPendingActions} pending action${totalPendingActions > 1 ? 's' : ''}`}
            </span>
            <button
              type="button"
              onClick={() => onSelectTab('approvals')}
              className="text-[#006AC7] font-semibold hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              Review <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION C: MAIN ANALYTICS AREA (RECHARTS AREA & BAR CHARTS)        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: 14-DAY ATTENDANCE TREND */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-[#006AC7]" />
                14-Day Attendance Trend
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily student attendance rates across all classes
              </p>
            </div>
            {calculatedAverageAttendance != null && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-[#006AC7] border border-blue-200 font-mono">
                Avg {calculatedAverageAttendance}%
              </span>
            )}
          </div>

          {hasAttendanceData ? (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#006AC7" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#006AC7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="label"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="percentage"
                    name="Attendance Rate"
                    stroke="#006AC7"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#attendanceGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-6 px-4 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Calendar className="w-8 h-8 text-slate-300 mb-1.5" />
              <h3 className="text-sm font-bold text-slate-800">
                No attendance records yet
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mt-0.5">
                Start today's attendance to build the 14-day trend.
              </p>
              <button
                type="button"
                onClick={() => onSelectTab('attendance')}
                className="mt-3 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#006AC7] hover:bg-blue-50 transition cursor-pointer shadow-2xs"
              >
                Record Attendance
              </button>
            </div>
          )}
        </motion.div>

        {/* CHART 2: STUDENT DISTRIBUTION ACROSS CLASSES */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                Student Enrollment by Grade
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Active student count distributed across registered classes
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
              {totalStudents} Total
            </span>
          </div>

          {hasStudentDistribution ? (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="name"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar
                    dataKey="students"
                    name="Students"
                    fill="#4F46E5"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-6 px-4 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <BookOpen className="w-8 h-8 text-slate-300 mb-1.5" />
              <h3 className="text-sm font-bold text-slate-800">
                No enrolled students across classes
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mt-0.5">
                Enroll students to see grade distribution.
              </p>
              <button
                type="button"
                onClick={() => onSelectTab('students')}
                className="mt-3 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition cursor-pointer shadow-2xs"
              >
                Enroll New Student
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION D: TODAY'S OPERATIONS & SCHEDULE                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: TODAY'S OPERATIONAL OVERVIEW */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#006AC7]" />
              Today's Operational Summary
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              Live School Status
            </span>
          </div>

          <div className="space-y-4">
            {/* Attendance Progress Row */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Student Attendance Progress</span>
                <span className="font-bold text-slate-900 font-mono">
                  {attendancePercentage != null ? `${attendancePercentage}%` : 'Pending'}
                </span>
              </div>
              {attendancePercentage != null && (
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#006AC7] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, attendancePercentage))}%` }}
                  />
                </div>
              )}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>
                  {submittedSections} of {totalSections} sections submitted
                </span>
                <button
                  type="button"
                  onClick={() => onSelectTab('attendance')}
                  className="text-[#006AC7] font-semibold hover:underline cursor-pointer"
                >
                  Record attendance →
                </button>
              </div>
            </div>

            {/* Teaching Faculty Row */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-700 block">Teaching Staff on Duty</span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  {teacherAttendanceSubmitted
                    ? `${teachersPresentCount} of ${teachingStaffCount} faculty members checked in`
                    : `${teachingStaffCount} assigned faculty members`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('faculty')}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                View faculty
              </button>
            </div>

            {/* Operating Hours / Session Status */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-700 block">Operating Hours</span>
                <span className="text-xs text-slate-600 mt-0.5 block font-mono">
                  {summary?.school?.timings?.regular?.startTime && summary?.school?.timings?.regular?.endTime
                    ? `${summary.school.timings.regular.startTime} – ${summary.school.timings.regular.endTime}`
                    : summary?.school?.timings?.startTime && summary?.school?.timings?.endTime
                    ? `${summary.school.timings.startTime} – ${summary.school.timings.endTime}`
                    : '08:00 – 13:30 (Regular Hours)'}
                </span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Operating
              </span>
            </div>

            {/* Class Teacher Policy Explanatory Note */}
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/70 text-xs text-slate-700 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#006AC7] shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed text-slate-600 font-medium">
                Each section has one primary Class Teacher. When a timetable is used, the Period 1 teacher becomes the Class Teacher automatically.
              </p>
            </div>
          </div>
        </motion.div>

        {/* RIGHT: TODAY'S PERIOD TIMETABLE SCHEDULE */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#006AC7]" />
                Today's Schedule
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Active timetable periods and teacher assignments
              </p>
            </div>
            {hasSchedule && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono">
                {todaySchedule.length} Periods
              </span>
            )}
          </div>

          {hasSchedule ? (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {todaySchedule.map((slot, index) => (
                <div
                  key={index}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-blue-100 text-[#006AC7] font-bold flex items-center justify-center shrink-0 text-xs">
                      {slot.periodNumber}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{slot.label || `Period ${slot.periodNumber}`}</span>
                        {slot.subjectName && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-xs">
                            {slot.subjectName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {slot.teacherName ? `Teacher: ${slot.teacherName}` : 'No teacher assigned'}
                        {slot.className ? ` • ${slot.className}` : ''}
                        {slot.roomNumber ? ` • Room ${slot.roomNumber}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-slate-500 text-xs shrink-0 font-medium">
                    {slot.startTime} – {slot.endTime}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 px-4 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Clock className="w-8 h-8 text-slate-300 mb-1.5" />
              <h3 className="text-sm font-bold text-slate-800">
                No timetable scheduled for today
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mt-0.5">
                Set up the school timetable to see today's periods here.
              </p>
              <button
                type="button"
                onClick={() => onSelectTab('timetable')}
                className="mt-3 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#006AC7] hover:bg-blue-50 transition cursor-pointer shadow-2xs"
              >
                Open Timetable
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION E: NEEDS ATTENTION (ACTIONABLE QUEUE)                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={itemVariants}
        className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${totalPendingActions > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
            <h2 className="text-base font-bold text-slate-900">Needs Your Attention</h2>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              totalPendingActions > 0
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {totalPendingActions > 0 ? `${totalPendingActions} pending` : 'All caught up'}
          </span>
        </div>

        {needsAttentionList.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">You're all caught up</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No pending attendance registers, transfers, admissions, or approvals require your action.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {needsAttentionList.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 transition flex flex-col justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        item.priority === 'HIGH'
                          ? 'bg-rose-100 text-rose-800'
                          : item.priority === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {item.priority || 'Notice'}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{item.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 pt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200/50 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (item.actionTab === 'transfers' && pendingIncomingTransfers[0] && onOpenTransfer) {
                        onOpenTransfer(pendingIncomingTransfers[0]);
                      } else {
                        onSelectTab(item.actionTab || 'approvals');
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#006AC7] text-white text-xs font-semibold hover:bg-[#005299] transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <span>{item.actionLabel || 'Review'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION F: QUICK ACTIONS (STRICTLY AUTHORIZED HM WORKFLOWS)         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={itemVariants}
        className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#006AC7]" />
              Head Master Quick Actions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized municipal workflows and daily school operations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              id: 'students',
              label: 'Student Directory',
              desc: 'Students and records',
              icon: GraduationCap,
              color: 'text-blue-600 bg-blue-50 border-blue-200/60',
              tab: 'students',
            },
            {
              id: 'faculty',
              label: 'Teaching Staff',
              desc: 'Staff roster and status',
              icon: Users,
              color: 'text-emerald-600 bg-emerald-50 border-emerald-200/60',
              tab: 'faculty',
            },
            {
              id: 'attendance',
              label: 'Record Attendance',
              desc: "Today's student attendance",
              icon: ClipboardCheck,
              color: 'text-indigo-600 bg-indigo-50 border-indigo-200/60',
              tab: 'attendance',
            },
            {
              id: 'assignments',
              label: 'Teaching Duties',
              desc: 'Class teachers and subjects',
              icon: UserCheck,
              color: 'text-purple-600 bg-purple-50 border-purple-200/60',
              tab: 'assignments',
            },
            {
              id: 'transfers',
              label: 'Incoming Staff',
              desc: 'Joining and relieving reviews',
              icon: ArrowLeftRight,
              color: 'text-amber-600 bg-amber-50 border-amber-200/60',
              tab: 'transfers',
            },
            {
              id: 'exams',
              label: 'Exams & Results',
              desc: 'School exams and marksheets',
              icon: Award,
              color: 'text-rose-600 bg-rose-50 border-rose-200/60',
              tab: 'exams',
            },
            {
              id: 'notices',
              label: 'Circulars & Notices',
              desc: 'School notices and orders',
              icon: FileText,
              color: 'text-teal-600 bg-teal-50 border-teal-200/60',
              tab: 'notices',
            },
            {
              id: 'timetable',
              label: 'School Timetable',
              desc: 'Daily period schedule',
              icon: CalendarDays,
              color: 'text-sky-600 bg-sky-50 border-sky-200/60',
              tab: 'timetable',
            },
          ].map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onSelectTab(action.tab)}
              className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:bg-slate-100/70 hover:border-slate-300 transition text-left cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg border ${action.color}`}>
                  <action.icon className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition" />
              </div>
              <div>
                <span className="font-bold text-xs sm:text-sm text-slate-900 block group-hover:text-[#006AC7] transition">
                  {action.label}
                </span>
                <span className="text-xs text-slate-500 block mt-0.5 truncate">
                  {action.desc}
                </span>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION G & H: RECENT ACTIVITY & SCHOOL PROFILE (TWO COLUMNS)      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RECENT ACTIVITY TIMELINE */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#006AC7]" />
                Recent School Activity
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official municipal audit events logged for this school
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('activity')}
              className="text-xs text-[#006AC7] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Full log <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {hasRecentActivity ? (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {recentActivity.map((log) => (
                <div
                  key={log._id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block">
                      {humanizeAction(log.action)}
                    </span>
                    <p className="text-xs text-slate-600">
                      by <span className="font-semibold">{log.actorName}</span>
                      {log.actorRole ? ` (${log.actorRole})` : ''}
                      {log.targetName ? ` • ${log.targetName}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 font-mono shrink-0">
                    {new Date(log.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 px-4 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <FileText className="w-8 h-8 text-slate-300 mb-1.5" />
              <h3 className="text-sm font-bold text-slate-800">
                No recent activity recorded yet
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mt-0.5">
                Official school administration actions will generate records here.
              </p>
            </div>
          )}
        </motion.div>

        {/* SCHOOL PROFILE / ACCESS CARD */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-[#006AC7]" />
                <h2 className="text-base font-bold text-slate-900">School Profile</h2>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-[#006AC7] border border-blue-200 font-semibold font-mono">
                {schoolCode}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                  Institution Name
                </span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block truncate">
                  {schoolName}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                  School Type
                </span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                  {schoolType}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                  Head Master
                </span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block truncate">
                  {headMasterName}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                  School Status
                </span>
                <span className="font-semibold text-emerald-700 text-xs mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-xs text-slate-500 truncate mr-2">
              DMC Liaquatabad Town Centre • Government of Sindh
            </span>
            <button
              type="button"
              onClick={() => onSelectTab('profile')}
              className="text-[#006AC7] font-semibold hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              View profile <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default HmOverviewTab;
