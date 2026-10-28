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

/**
 * 🎫 CompactArrivalAttendanceCard
 *
 * Space-efficient, contextually appropriate attendance verification card.
 * Relocated from oversized dashboard hero space into dashboard overview.
 * Preserves 100% authoritative data:
 * - Marked time (PKT)
 * - Approved time (PKT)
 * - Approver name & civil designation (Head Master)
 * - Muster roll action link & live check-in trigger
 */
export const CompactArrivalAttendanceCard = ({
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

  if (loading && !record) {
    return (
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-[#526477]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#4B7F3A]" />
          <span>Verifying campus arrival attendance record...</span>
        </div>
      </div>
    );
  }

  // ─── STATE 1: UNMARKED (Ready for check-in) ──────────────────────────────────
  if (!isMarkedToday) {
    return (
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#F2F8EF] via-white to-[#F2F8EF]/70 border border-[#C9DFBC]/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#E3F0DC] text-[#38662D] shrink-0">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#E3F0DC] text-[#38662D] px-2 py-0.5 rounded-full border border-[#C9DFBC]">
                Campus Arrival
              </span>
              <span className="text-xs font-bold text-[#102033]">
                Mark Your Daily Arrival Attendance Today
              </span>
            </div>
            <p className="text-[11px] text-[#526477] mt-0.5">
              Record campus arrival at <strong className="text-[#102033] font-semibold">{schoolName}</strong>. Dispatches timestamp to Head Master.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {onViewMusterRoll && (
            <button
              type="button"
              onClick={onViewMusterRoll}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#526477] transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              Muster Roll
            </button>
          )}
          <button
            type="button"
            onClick={onMarkAttendance}
            disabled={submitting}
            className="px-4 py-1.5 rounded-xl bg-[#4B7F3A] hover:bg-[#38662D] disabled:opacity-60 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Recording...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Mark Attendance
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ─── STATE 2: PENDING HEAD MASTER APPROVAL ──────────────────────────────────
  if (isPending) {
    return (
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-50/90 via-white to-amber-50/50 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
            <Clock className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                ⏳ Awaiting HM Approval
              </span>
              <span className="text-xs font-bold text-[#102033]">
                Arrival Logged at {formatTimePKT(record.submittedAt)} PKT
              </span>
            </div>
            <p className="text-[11px] text-[#526477] mt-0.5">
              In Head Master verification queue. Daily status will update to Present once authorized.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-xl border border-amber-200/80 bg-white hover:bg-amber-50 text-xs font-bold text-amber-800 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Check Status
            </button>
          )}
          {onViewMusterRoll && (
            <button
              type="button"
              onClick={onViewMusterRoll}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#526477] transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" /> Muster Roll
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── STATE 3: APPROVED BY HEAD MASTER ────────────────────────────────────────
  if (isApproved) {
    return (
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-white to-emerald-50/50 border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                ✅ Verified &amp; Approved
              </span>
              <span className="text-xs font-bold text-[#102033]">
                Daily Arrival Authoritatively Verified
              </span>
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded">
                {record.status || 'PRESENT'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-[#526477] mt-1">
              <span>Marked: <strong className="text-[#102033] font-bold">{formatTimePKT(record.submittedAt)} PKT</strong></span>
              <span>•</span>
              <span>Approved: <strong className="text-[#102033] font-bold">{formatTimePKT(record.approvedAt)} PKT</strong></span>
              {record.approvedBy?.fullName && (
                <>
                  <span>•</span>
                  <span>By: <strong className="text-[#102033] font-bold">{record.approvedBy.fullName}</strong> ({record.approvedBy.designation || 'Head Master'})</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {onViewMusterRoll && (
            <button
              type="button"
              onClick={onViewMusterRoll}
              className="px-3.5 py-1.5 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 text-xs font-bold text-emerald-800 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              View Muster Roll
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── STATE 4: REJECTED BY HEAD MASTER ────────────────────────────────────────
  if (isRejected) {
    return (
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-50/90 via-white to-rose-50/50 border border-rose-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-800 shrink-0">
            <XCircle className="w-4 h-4 text-rose-700" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                ❌ Arrival Rejected
              </span>
              <span className="text-xs font-bold text-rose-900">
                Check-in not approved by Head Master
              </span>
            </div>
            {record.rejectionReason && (
              <p className="text-[11px] text-rose-800 mt-0.5">
                Remarks: {record.rejectionReason}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {onViewMusterRoll && (
            <button
              type="button"
              onClick={onViewMusterRoll}
              className="px-3.5 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-xs font-bold text-rose-800 transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-rose-600" /> Muster Roll
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default CompactArrivalAttendanceCard;

