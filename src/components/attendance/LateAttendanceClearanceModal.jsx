import React, { useState } from 'react';
import { Clock, ShieldAlert, Send, X, AlertTriangle } from 'lucide-react';

export const LateAttendanceClearanceModal = ({
  isOpen,
  onClose,
  sectionName,
  className,
  attendanceDate,
  onSubmit,
  isSubmitting = false,
  error = null,
}) => {
  const [reason, setReason] = useState('');
  const [localError, setLocalError] = useState('');

  if (!isOpen) return null;

  const trimmedReason = reason.trim();
  const isValidLength = trimmedReason.length >= 5 && trimmedReason.length <= 500;

  const handleSubmit = (event) => {
    event.preventDefault();
    setLocalError('');

    if (!isValidLength) {
      setLocalError('Justification reason must be between 5 and 500 characters.');
      return;
    }

    onSubmit(trimmedReason);
  };

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-[#102033] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-700 border border-amber-200">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Request Late Attendance Clearance</h3>
              <p className="text-xs text-slate-500">
                Official Head Master clearance request for late classroom attendance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scope Context Card */}
        <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <span className="text-[11px] text-slate-500 block">Class & Section:</span>
            <strong className="text-slate-900 font-semibold">{className} — {sectionName}</strong>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Attendance Date:</span>
            <strong className="font-mono text-slate-900">{attendanceDate}</strong>
          </div>
        </div>

        {/* Institutional Governance Notice */}
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
          <p className="leading-relaxed">
            Attendance submission is gated by Pakistan Standard Time (PKT). Submitting this request sends an instant
            notification to your <strong>Head Master</strong>. Once cleared, you will be able to submit attendance for today.
          </p>
        </div>

        {displayError && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{displayError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Mandatory Justification Reason *
              <span className="font-normal text-slate-500 ml-1.5">(minimum 5 characters)</span>
            </label>
            <textarea
              required
              rows={3}
              minLength={5}
              maxLength={500}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (localError) setLocalError('');
              }}
              placeholder="e.g. Power outage / internet disruption during morning schedule; delayed student assembly."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-[#006AC7] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>This statement will be audited and displayed to the Head Master.</span>
              <span className={trimmedReason.length >= 5 ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                {trimmedReason.length}/500 chars (min. 5)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValidLength || isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#006AC7] hover:bg-[#005299] px-5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Sending Request...' : 'Send Request to HM'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LateAttendanceClearanceModal;
