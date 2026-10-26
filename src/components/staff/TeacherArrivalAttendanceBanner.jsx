import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building,
  Sparkles,
  Calendar,
  UserCheck,
  RefreshCw,
  FileSpreadsheet,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

const formatTimePKT = (isoDateString) => {
  if (!isoDateString) return '—';
  try {
    return new Date(isoDateString).toLocaleTimeString('en-US', {
      timeZone: 'Asia/Karachi',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (_) {
    return '—';
  }
};

const formatDatePKT = (isoDateString) => {
  if (!isoDateString) return '';
  try {
    return new Date(isoDateString).toLocaleDateString('en-GB', {
      timeZone: 'Asia/Karachi',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (_) {
    return '';
  }
};

/**
 * 🏫 TeacherArrivalAttendanceBanner
 *
 * Institutional Arrival Check-in Banner for School Staff (Teachers & Peons).
 * Clearly reflects:
 * 1. UNMARKED: Prompt to record arrival on school campus.
 * 2. PENDING_APPROVAL: Submission timestamp with live waiting indicator for Head Master.
 * 3. APPROVED: Verified arrival timestamp, approval timestamp, and Head Master identity.
 * 4. REJECTED: Submission timestamp, rejection timestamp, and Head Master remarks.
 */
export const TeacherArrivalAttendanceBanner = ({
  record,
  loading = false,
  submitting = false,
  onMarkAttendance,
  onRefresh,
  onViewMusterRoll,
  schoolName = 'Assigned School',
}) => {
  const approvalStatus = record?.approvalStatus || (record?.status === 'PENDING' ? 'PENDING_APPROVAL' : null);
  const isMarkedToday = Boolean(record);
  const isPending = approvalStatus === 'PENDING_APPROVAL';
  const isApproved = approvalStatus === 'APPROVED' || record?.status === 'PRESENT' || record?.status === 'LATE';
  const isRejected = approvalStatus === 'REJECTED';

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    timeZone: 'Asia/Karachi',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-xs mb-6">
      {/* ─── STATE 1: LOADING ─── */}
      {loading && !record && (
        <div className="bg-slate-50 border-slate-200/80 p-5 flex items-center justify-center gap-3 text-sm text-[#526477]">
          <Loader2 className="w-5 h-5 animate-spin text-[#006AC7]" />
          <span>Verifying today's campus arrival attendance status...</span>
        </div>
      )}

      {/* ─── STATE 2: UNMARKED (Ready for check-in) ─── */}
      {!loading && !isMarkedToday && (
        <div className="bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/50 border-blue-200/70 p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100/90 text-[#006AC7] border border-blue-200">
                  <Building className="w-3.5 h-3.5" /> Campus Physical Arrival
                </span>
                <span className="text-xs text-[#526477] font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> {todayFormatted}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#102033] tracking-tight">
                Mark Your Daily Arrival Attendance Today
              </h3>
              <p className="text-xs sm:text-sm text-[#526477] leading-relaxed">
                As school teaching and non-teaching faculty, please mark your attendance upon arrival at{' '}
                <strong className="text-[#102033] font-semibold">{schoolName}</strong>. Your arrival time is digitally timestamped and dispatched directly to the Head Master's portal for verification.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {onViewMusterRoll && (
                <button
                  type="button"
                  onClick={onViewMusterRoll}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#526477] hover:text-[#102033] transition flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                  Muster Roll
                </button>
              )}
              <button
                type="button"
                onClick={onMarkAttendance}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#006AC7] to-[#00529B] hover:from-[#0058A8] hover:to-[#004077] disabled:opacity-60 text-white text-xs sm:text-sm font-black transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Recording Arrival...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Mark My Attendance Today
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STATE 3: PENDING HEAD MASTER APPROVAL ─── */}
      {!loading && isPending && (
        <div className="bg-gradient-to-r from-amber-50/90 via-white to-amber-50/50 border-amber-200/80 p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                  <Clock className="w-3.5 h-3.5 animate-pulse text-amber-700" /> ⏳ Awaiting Head Master Approval
                </span>
                <span className="text-xs text-[#526477] font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> {todayFormatted}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#102033] tracking-tight">
                Arrival Recorded at {formatTimePKT(record.submittedAt)} PKT
              </h3>
              <p className="text-xs sm:text-sm text-[#526477] leading-relaxed">
                Your campus check-in was successfully logged at{' '}
                <strong className="text-[#102033] font-bold">{formatTimePKT(record.submittedAt)} PKT</strong>. It is currently in the Head Master's verification queue. Once approved, your daily status will update to Present.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="px-3.5 py-2 rounded-xl border border-amber-200/80 bg-white hover:bg-amber-50 text-xs font-bold text-amber-800 transition flex items-center gap-1.5 cursor-pointer"
                  title="Check if Head Master has approved"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Check Status
                </button>
              )}
              {onViewMusterRoll && (
                <button
                  type="button"
                  onClick={onViewMusterRoll}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#526477] hover:text-[#102033] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                  Muster Roll
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── STATE 4: APPROVED BY HEAD MASTER ─── */}
      {!loading && isApproved && (
        <div className="bg-gradient-to-r from-emerald-50/90 via-white to-emerald-50/50 border-emerald-200/80 p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> ✅ Verified & Approved
                </span>
                <span className="text-xs text-[#526477] font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> {todayFormatted}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Status: {record.status || record.approvalStatus || 'PRESENT'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#102033] tracking-tight">
                Arrival Attendance Authoritatively Verified
              </h3>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#526477] pt-0.5">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Marked: <strong className="text-[#102033] font-bold">{formatTimePKT(record.submittedAt)} PKT</strong></span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Approved: <strong className="text-[#102033] font-bold">{formatTimePKT(record.approvedAt)} PKT</strong></span>
                </div>
                {record.approvedBy?.fullName && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>By: <strong className="text-[#102033] font-bold">{record.approvedBy.fullName}</strong> ({record.approvedBy.designation || 'Head Master'})</span>
                    </div>
                  </>
                )}
              </div>

              {record.lateApprovalReason && (
                <div className="mt-2 text-xs bg-white/80 p-2.5 rounded-xl border border-emerald-200/60 text-slate-700">
                  <strong className="text-emerald-800 font-semibold">Head Master Note:</strong> {record.lateApprovalReason}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {onViewMusterRoll && (
                <button
                  type="button"
                  onClick={onViewMusterRoll}
                  className="px-4 py-2 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 text-xs font-bold text-emerald-800 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  View Muster Roll
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── STATE 5: REJECTED BY HEAD MASTER ─── */}
      {!loading && isRejected && (
        <div className="bg-gradient-to-r from-rose-50/90 via-white to-rose-50/50 border-rose-200/80 p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                  <XCircle className="w-3.5 h-3.5 text-rose-700" /> ❌ Submission Rejected
                </span>
                <span className="text-xs text-[#526477] font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> {todayFormatted}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#102033] tracking-tight">
                Arrival Attendance Not Accepted by Head Master
              </h3>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#526477] pt-0.5">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  <span>Submitted: <strong className="text-[#102033] font-bold">{formatTimePKT(record.submittedAt)} PKT</strong></span>
                </div>
                {record.rejectedBy?.fullName && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-rose-600" />
                      <span>Rejected By: <strong className="text-[#102033] font-bold">{record.rejectedBy.fullName}</strong></span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-2 text-xs bg-white p-3 rounded-xl border border-rose-200 text-rose-800">
                <strong className="font-bold">Rejection Reason:</strong> {record.rejectionReason || 'No specific explanation provided by administration.'}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {onViewMusterRoll && (
                <button
                  type="button"
                  onClick={onViewMusterRoll}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#526477] hover:text-[#102033] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                  Muster Roll
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherArrivalAttendanceBanner;
