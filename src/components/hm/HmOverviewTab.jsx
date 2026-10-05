import React, { useMemo } from 'react';
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
  ArrowLeftRight,
  UserCheck,
} from 'lucide-react';

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

  // Academic session (truthful: derived from summary or school metadata, never hardcoded)
  const academicSession = summary?.school?.academicSession || summary?.academicYear || null;

  // Real KPI calculations from Redux summary state
  const totalStudents = summary?.metrics?.totalStudents ?? 0;
  const teachingStaffCount = summary?.metrics?.teachingStaff ?? 0;
  const attendancePercentage = summary?.metrics?.todayAttendance?.attendancePercentage;
  const totalSections = summary?.metrics?.totalSections ?? 0;
  const submittedSections = summary?.metrics?.todaySubmittedSections ?? 0;

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
  const totalPendingActions =
    summary?.metrics?.pendingQueues?.totalPendingActions ??
    (pendingTransfersCount + pendingParentClaimsCount + pendingStaffCount + pendingStudentsCount);

  // School metadata
  const schoolName = summary?.school?.name || user?.schoolId?.name || 'Assigned Municipal School';
  const schoolCode = summary?.school?.code || '—';
  const schoolType = summary?.school?.schoolType || 'MUNICIPAL';
  const schoolStatus = summary?.school?.status || 'Active';
  const headMasterName = user?.fullName || 'Head Master';
  const designationLabel = user?.designation
    ? user.designation.replace(/\s*\(Break-Glass Recovery\)/i, '')
    : 'Head Master · BPS-17';

  return (
    <div className="space-y-6">
      {/* ── 1. Page Header (Dynamic Greeting, Institutional Identity, Status) ── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span>{formattedDate}</span>
            {academicSession && (
              <>
                <span>•</span>
                <span>Session {academicSession}</span>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {greeting}, {headMasterName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            {schoolName} <span className="text-slate-400">|</span> {designationLabel}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Truthful School Operational Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <span>School status: {schoolStatus}</span>
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#006AC7]"
            title="Refresh dashboard metrics"
            aria-label="Refresh dashboard metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 2. Primary KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Students */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Students
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
                {summaryLoading ? '—' : totalStudents}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#006AC7] border border-blue-200/60">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {totalStudents === 0 ? '0 active students' : `${totalStudents} active students`}
            </span>
            <button
              type="button"
              onClick={() => onSelectTab('students')}
              className="text-[#006AC7] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              View students <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI: Teaching Staff */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Teaching staff
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
                {summaryLoading ? '—' : teachingStaffCount}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {teacherAttendanceSubmitted
                ? `${teachersPresentCount} / ${teachingStaffCount} present today`
                : `${teachingStaffCount} assigned teachers`}
            </span>
            <button
              type="button"
              onClick={() => onSelectTab('faculty')}
              className="text-[#006AC7] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              View faculty <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI: Today's Attendance */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Today's attendance
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
                {summaryLoading
                  ? '—'
                  : attendancePercentage != null
                  ? `${attendancePercentage}%`
                  : 'Pending'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {totalSections > 0 && submittedSections === totalSections
                ? 'All sections submitted'
                : `${submittedSections} of ${totalSections} sections submitted`}
            </span>
            <button
              type="button"
              onClick={() => onSelectTab('attendance')}
              className="text-[#006AC7] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              View attendance <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI: Needs Your Attention */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Needs your attention
              </span>
              <span
                className={`text-2xl sm:text-3xl font-extrabold mt-1 block ${
                  totalPendingActions > 0 ? 'text-amber-600' : 'text-slate-900'
                }`}
              >
                {summaryLoading ? '—' : totalPendingActions}
              </span>
            </div>
            <div
              className={`p-2.5 rounded-xl border ${
                totalPendingActions > 0
                  ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                  : 'bg-slate-50 text-slate-600 border-slate-200/60'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {totalPendingActions === 0
                ? "You're all caught up"
                : `${totalPendingActions} pending requests require review`}
            </span>
            <button
              type="button"
              onClick={() => onSelectTab('approvals')}
              className="text-[#006AC7] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Review items <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Two-Column Operational Hero: Today's Operations + Needs Your Attention ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Today's Operations */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#006AC7]" />
              Today's operations
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              Daily operational summary
            </span>
          </div>

          <div className="space-y-4">
            {/* Attendance Progress Row (Progress bar rendered ONLY when percentage is non-null) */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Student attendance</span>
                <span className="font-bold text-slate-900">
                  {attendancePercentage != null ? `${attendancePercentage}%` : 'Pending recording'}
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
                <span className="text-xs font-semibold text-slate-700 block">Teaching staff on duty</span>
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
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-700 block">School operating schedule</span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  {summary?.school?.timings?.startTime && summary?.school?.timings?.endTime
                    ? `${summary.school.timings.startTime} – ${summary.school.timings.endTime}`
                    : 'Standard municipal school hours'}
                </span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Operating
              </span>
            </div>
          </div>
        </div>

        {/* Right: Needs Your Attention (Action Queue) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Needs your attention
            </h2>
            <span className="text-xs font-bold text-amber-700 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
              {totalPendingActions} pending
            </span>
          </div>

          {/* If there are NO pending items anywhere, render the authoritative empty state */}
          {totalPendingActions === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">You're all caught up</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  There are no pending requests requiring your review.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 1. Pending Incoming Transfers */}
              {pendingIncomingTransfers.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900">
                        Student transfer
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {pendingIncomingTransfers[0]?.studentName || 'Student transfer application'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {pendingIncomingTransfers.length > 1
                        ? `${pendingIncomingTransfers.length} incoming transfer requests awaiting review`
                        : `Transfer from ${pendingIncomingTransfers[0]?.fromSchoolName || 'former school'}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenTransfer && pendingIncomingTransfers[0]) {
                        onOpenTransfer(pendingIncomingTransfers[0]);
                      } else {
                        onSelectTab('transfers');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition shrink-0 cursor-pointer shadow-2xs"
                  >
                    Review transfer
                  </button>
                </div>
              )}

              {/* 2. Pending Parent Verification Claims */}
              {pendingParentClaimsCount > 0 && (
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-200/80 text-blue-900">
                        Parent claim
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        B-Form guardian verification
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {pendingParentClaimsCount} parent-student linkage requests awaiting verification
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectTab('approvals')}
                    className="px-3 py-1.5 rounded-xl bg-[#006AC7] text-white text-xs font-semibold hover:bg-[#005299] transition shrink-0 cursor-pointer shadow-2xs"
                  >
                    Verify claim
                  </button>
                </div>
              )}

              {/* 3. Pending Staff Approvals */}
              {pendingStaffCount > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                        Staff request
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        Faculty registration
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {pendingStaffCount} new staff applications awaiting approval
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectTab('approvals')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition shrink-0 cursor-pointer shadow-2xs"
                  >
                    Review request
                  </button>
                </div>
              )}

              {/* 4. Pending Student Admissions */}
              {pendingStudentsCount > 0 && (
                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-200/80 text-indigo-900">
                        Student admission
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        Admission application
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {pendingStudentsCount} student admission requests awaiting decision
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectTab('approvals')}
                    className="px-3 py-1.5 rounded-xl bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 transition shrink-0 cursor-pointer shadow-2xs"
                  >
                    Review admission
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Compact School Profile & Access Card ── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-[#006AC7]" />
            <h2 className="text-base font-bold text-slate-900">School profile</h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-[#006AC7] border border-blue-200 font-semibold">
            {schoolType}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
              Institution name
            </span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">
              {schoolName}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
              School code
            </span>
            <span className="font-mono font-bold text-[#006AC7] text-sm mt-0.5 block">
              {schoolCode}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
              Head Master
            </span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">
              {headMasterName}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
              School access
            </span>
            <span className="font-semibold text-emerald-700 text-sm mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Active jurisdiction
            </span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
          <span>
            Education Department, Liaquatabad Town Centre • Government of Sindh
          </span>
          <button
            type="button"
            onClick={() => onSelectTab('profile')}
            className="text-[#006AC7] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            View complete school profile <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HmOverviewTab;
