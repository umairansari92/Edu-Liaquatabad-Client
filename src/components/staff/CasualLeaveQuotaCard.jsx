import React, { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
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
  PlusCircle,
  Loader2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient.js';
import { fetchProfileLeaveSummary } from '../../store/slices/staffProfileSlice.js';
import { getErrorMessage } from '../../utils/errorUtils.js';

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
  const dispatch = useDispatch();
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('CASUAL_LEAVE');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clBalance = leaveSummary?.clBalance;
  const hasClData = Boolean(
    clBalance &&
    (clBalance.entitlementDays !== undefined || clBalance.totalQuota !== undefined)
  );

  const leaveRequests = leaveSummary?.leaveRequests || [];

  const totalQuota = hasClData
    ? (clBalance.entitlementDays ?? clBalance.totalQuota ?? 0)
    : null;
  const usedDays = hasClData ? (clBalance.usedDays ?? 0) : 0;
  const pendingDays = hasClData ? (clBalance.pendingDays ?? 0) : 0;
  const remainingBalance = hasClData
    ? (clBalance.remainingDays ?? clBalance.remainingBalance ?? Math.max(0, (totalQuota ?? 0) - usedDays))
    : null;
  const usedPercentage =
    hasClData && totalQuota && totalQuota > 0
      ? Math.min(100, Math.round((usedDays / totalQuota) * 100))
      : 0;

  const calculatedLeaveDays = useMemo(() => {
    if (!leaveStartDate || !leaveEndDate) return 0;
    const start = new Date(leaveStartDate);
    const end = new Date(leaveEndDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [leaveStartDate, leaveEndDate]);

  const handleSubmitLeave = async (submitEvent) => {
    submitEvent.preventDefault();
    if (!leaveStartDate || !leaveEndDate || !leaveReason?.trim()) {
      toast.error('Please fill all required leave application fields.');
      return;
    }
    if (leaveReason.trim().length < 5) {
      toast.error('Please provide a meaningful reason (minimum 5 characters).');
      return;
    }
    if (leaveType === 'CASUAL_LEAVE' && calculatedLeaveDays > 3) {
      toast.error('Casual Leave (CL) cannot exceed 3 consecutive calendar days under municipal regulations. Please select Earned Leave (EL).');
      return;
    }
    if (leaveType === 'CASUAL_LEAVE' && remainingBalance !== null && calculatedLeaveDays > remainingBalance) {
      toast.error(`Requested ${calculatedLeaveDays} day(s) exceeds your remaining CL balance of ${remainingBalance} day(s).`);
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.post('/leave/submit', {
        leaveType,
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        reason: leaveReason.trim(),
      });
      toast.success('Leave application submitted successfully. Pending Head Master approval.');
      setIsLeaveModalOpen(false);
      setLeaveReason('');
      dispatch(fetchProfileLeaveSummary());
    } catch (errorObject) {
      toast.error(getErrorMessage(errorObject, 'Failed to submit leave application.'));
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <button
            type="button"
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setLeaveStartDate(today);
              setLeaveEndDate(today);
              setLeaveReason('');
              setLeaveType('CASUAL_LEAVE');
              setIsLeaveModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#006AC7] hover:bg-[#005299] text-white text-xs font-bold transition-all shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Apply for Leave</span>
          </button>
        )}
      </div>

      {/* Quota Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold text-[#526477] uppercase block tracking-wider">
            Annual Quota ({clBalance?.year || new Date().getFullYear()})
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#102033]">
              {hasClData ? totalQuota : '—'}
            </span>
            <span className="text-xs text-[#526477] font-semibold">Days</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Resets January 1 &bull; Non-cumulative</span>
        </div>

        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
          <span className="text-[10px] font-bold text-[#006AC7] uppercase block tracking-wider">
            Availed / Used
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#006AC7]">
              {hasClData ? usedDays : '—'}
            </span>
            <span className="text-xs text-[#006AC7] font-semibold">Days</span>
          </div>
          <span className="text-[10px] text-[#006AC7]/70 block">
            {hasClData ? `${usedPercentage}% of quota consumed` : 'Awaiting policy record'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
          <span className="text-[10px] font-bold text-amber-800 uppercase block tracking-wider">
            Pending Approval
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-700">
              {hasClData ? pendingDays : '—'}
            </span>
            <span className="text-xs text-amber-800 font-semibold">Days</span>
          </div>
          <span className="text-[10px] text-amber-700/80 block">Awaiting Head Master review</span>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
          <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">
            Remaining Balance
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-700">
              {hasClData ? remainingBalance : '—'}
            </span>
            <span className="text-xs text-emerald-800 font-semibold">Days</span>
          </div>
          <span className="text-[10px] text-emerald-700/80 block">Available for active utilization</span>
        </div>
      </div>

      {!hasClData && !loading && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#526477] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>Official Casual Leave quota data has not been initialized for this employee account in the institutional leave ledger.</span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between items-center text-xs text-[#526477]">
          <span className="font-medium text-[11px]">Quota Utilization Progress</span>
          <span className="font-bold text-[#102033] font-mono text-[11px]">
            {hasClData ? `${remainingBalance} Days Available` : 'Policy Ledger Uninitialized'}
          </span>
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

      {/* ── Leave Application Modal (In-Profile) ─────────────────────────── */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !isSubmitting && setIsLeaveModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-[#006AC7]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#102033]">Apply for Casual / Medical Leave</h3>
                  <p className="text-[11px] text-[#526477]">Institutional Leave Application &bull; Liaquatabad Town</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setIsLeaveModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitLeave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#526477] mb-1">Leave Category *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                >
                  <option value="CASUAL_LEAVE">Casual Leave (CL) &mdash; Max 3 Consecutive Days</option>
                  <option value="EARNED_LEAVE">Earned Leave (EL) &mdash; Extended / Sanction Required</option>
                  <option value="MEDICAL_LEAVE">Medical Leave (Medical Certificate Required)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#526477] mb-1">From Date *</label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#526477] mb-1">To Date *</label>
                  <input
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                  />
                </div>
              </div>

              {calculatedLeaveDays > 0 && (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#526477]">Requested Duration:</span>
                  <span className="font-bold text-[#006AC7]">
                    {calculatedLeaveDays} calendar day(s)
                    {leaveType === 'CASUAL_LEAVE' && remainingBalance !== null && (
                      <span className="text-[#526477] font-normal ml-1">
                        (Remaining Balance: {remainingBalance} days)
                      </span>
                    )}
                  </span>
                </div>
              )}

              <div>
                <label className="block font-bold text-[#526477] mb-1">Reason / Institutional Justification *</label>
                <textarea
                  rows="3"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Explain the reason for leave request (minimum 5 characters)..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (leaveType === 'CASUAL_LEAVE' && (calculatedLeaveDays > 3 || (remainingBalance !== null && calculatedLeaveDays > remainingBalance)))
                  }
                  className="px-5 py-2 rounded-xl bg-[#006AC7] hover:bg-[#00529B] disabled:opacity-50 text-white font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit Application
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CasualLeaveQuotaCard;
