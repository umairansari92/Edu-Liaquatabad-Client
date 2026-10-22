import React from 'react';
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  PieChart,
  ShieldCheck,
  Award,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * 🏖️ CasualLeaveQuotaCard
 * Renders "Casual Leave (CL) Quota & Applications — Education Department Liaquatabad Town Centre"
 * from the hand-drawn sketch.
 * Shows annual entitlement (24 days/year), utilization, pending applications, and recent ledger.
 */
export const CasualLeaveQuotaCard = ({
  leaveSummary = { clBalance: null, leaveRequests: [] },
  loading = false,
  isOwner = false,
}) => {
  const clBalance = leaveSummary?.clBalance || {
    totalQuota: 24,
    usedDays: 0,
    pendingDays: 0,
    remainingBalance: 24,
    year: new Date().getFullYear(),
  };

  const leaveRequests = leaveSummary?.leaveRequests || [];

  const totalQuota = clBalance.totalQuota || 24;
  const usedDays = clBalance.usedDays || 0;
  const pendingDays = clBalance.pendingDays || 0;
  const remainingBalance = clBalance.remainingBalance ?? (totalQuota - usedDays);
  const usedPercentage = Math.min(100, Math.round((usedDays / totalQuota) * 100));

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return {
          icon: CheckCircle2,
          className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          label: 'Approved',
        };
      case 'PENDING':
        return {
          icon: Clock,
          className: 'bg-amber-50 text-amber-800 border-amber-200',
          label: 'Pending HM Approval',
        };
      case 'REJECTED':
        return {
          icon: XCircle,
          className: 'bg-rose-50 text-rose-800 border-rose-200',
          label: 'Rejected',
        };
      default:
        return {
          icon: AlertCircle,
          className: 'bg-slate-50 text-slate-700 border-slate-200',
          label: status || 'Under Review',
        };
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    try {
      return new Date(dateValue).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(dateValue);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#006AC7]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#102033]">
              Casual Leave (CL) Quota &amp; Applications
            </h3>
            <p className="text-xs text-[#526477]">
              Education Department Liaquatabad Town Centre &bull; Annual Casual Leave Entitlement
            </p>
          </div>
        </div>

        {isOwner && (
          <Link
            to="/dashboard?tab=service"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#006AC7] hover:bg-[#005299] text-white text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Leave Application</span>
          </Link>
        )}
      </div>

      {/* Quota Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold text-[#526477] uppercase block tracking-wider">
            Annual Quota ({clBalance.year || new Date().getFullYear()})
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#102033]">{totalQuota}</span>
            <span className="text-xs text-[#526477] font-semibold">Days</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Resets January 1 &bull; Non-cumulative</span>
        </div>

        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
          <span className="text-[10px] font-bold text-[#006AC7] uppercase block tracking-wider">
            Availed / Used
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#006AC7]">{usedDays}</span>
            <span className="text-xs text-[#006AC7] font-semibold">Days</span>
          </div>
          <span className="text-[10px] text-[#006AC7]/70 block">{usedPercentage}% of quota consumed</span>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
          <span className="text-[10px] font-bold text-amber-800 uppercase block tracking-wider">
            Pending Approval
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-700">{pendingDays}</span>
            <span className="text-xs text-amber-800 font-semibold">Days</span>
          </div>
          <span className="text-[10px] text-amber-700/80 block">Awaiting Head Master review</span>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
          <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">
            Remaining Balance
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-700">{remainingBalance}</span>
            <span className="text-xs text-emerald-800 font-semibold">Days</span>
          </div>
          <span className="text-[10px] text-emerald-700/80 block">Available for active utilization</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between items-center text-xs text-[#526477]">
          <span className="font-medium text-[11px]">Quota Utilization Progress</span>
          <span className="font-bold text-[#102033] font-mono text-[11px]">{remainingBalance} Days Available</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${usedPercentage}%` }}
            className="bg-[#006AC7] transition-all duration-300"
            title={`Availed: ${usedDays} Days`}
          />
          {pendingDays > 0 && (
            <div
              style={{ width: `${Math.min(100 - usedPercentage, Math.round((pendingDays / totalQuota) * 100))}%` }}
              className="bg-amber-400 transition-all duration-300"
              title={`Pending: ${pendingDays} Days`}
            />
          )}
        </div>
      </div>

      {/* Recent Leave Applications Ledger */}
      <div className="pt-2">
        <h4 className="text-xs font-bold text-[#526477] uppercase tracking-wider mb-2.5">
          Recent Leave Applications &amp; Decisions
        </h4>

        {leaveRequests.length === 0 ? (
          <div className="p-5 text-center rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#526477]">
            No leave applications submitted on official file for this calendar year.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
            {leaveRequests.map((req, idx) => {
              const badge = getStatusBadge(req.status);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={req._id || idx}
                  className="p-3.5 bg-white hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#102033]">
                        {req.leaveType === 'EARNED' ? 'Earned Leave (EL)' : 'Casual Leave (CL)'}
                      </span>
                      <span className="font-mono text-[11px] text-[#526477]">
                        ({req.durationDays} {req.durationDays === 1 ? 'day' : 'days'})
                      </span>
                    </div>

                    <div className="text-[11px] text-[#526477] flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span>
                        {formatDate(req.startDate)} &mdash; {formatDate(req.endDate)}
                      </span>
                      <span>&bull;</span>
                      <span className="italic text-slate-500 truncate max-w-xs">
                        "{req.reason || 'Personal reasons'}"
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border self-start sm:self-auto ${badge.className}`}
                  >
                    <BadgeIcon className="w-3.5 h-3.5" />
                    <span>{badge.label}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CasualLeaveQuotaCard;
