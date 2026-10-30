import React, { useState } from 'react';
import { UserCheck, ShieldAlert, ArrowRight, X, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

/**
 * 🛡️ TeacherProxyAttendanceModal
 * Enables a verified teacher to record student attendance as a proxy for an absent or on-leave colleague
 * within the same municipal school (DMC Liaquatabad Town Education Department standard).
 */
export const TeacherProxyAttendanceModal = ({
  isOpen,
  onClose,
  eligibleSections = [],
  loading = false,
  attendanceDate,
  onConfirmProxy,
}) => {
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [proxyReason, setProxyReason] = useState('');
  const [localError, setLocalError] = useState('');

  if (!isOpen) return null;

  const selectedSection = eligibleSections.find(
    (sec) => String(sec._id) === String(selectedSectionId)
  );

  const trimmedReason = proxyReason.trim();
  const isValidReason = trimmedReason.length >= 5 && trimmedReason.length <= 500;

  const handleProceed = (event) => {
    event.preventDefault();
    setLocalError('');

    if (!selectedSectionId) {
      setLocalError('Please select a class/section to cover.');
      return;
    }

    if (!isValidReason) {
      setLocalError('Justification reason must be between 5 and 500 characters.');
      return;
    }

    onConfirmProxy({
      sectionId: selectedSectionId,
      section: selectedSection,
      reason: trimmedReason,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-[#102033] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-700 border border-amber-200">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Take Proxy Student Attendance</h3>
              <p className="text-xs text-slate-500">
                Institutional colleague coverage for absent or on-leave teaching staff
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Institutional Governance Notice */}
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 text-xs text-amber-950 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold">Official Proxy Protocol:</strong> You may record attendance for another class ONLY if the assigned class teacher is on Casual/Earned Leave or marked Absent today. Your name and reason are immutably preserved in the municipal audit trail.
          </div>
        </div>

        {/* Attendance Date Badge */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <span className="text-slate-500 font-medium">Attendance Date:</span>
          <span className="font-mono font-bold text-slate-800">{attendanceDate}</span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-[#4B7F3A]" />
            <span className="text-xs">Checking school staff leave and absence records...</span>
          </div>
        ) : eligibleSections.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">No Uncovered Classrooms Today</h4>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              All assigned class teachers in your school are marked present on duty, or no active classes require proxy coverage today.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Return to My Classes
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleProceed} className="space-y-4">
            {/* Class & Section Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Class & Section to Cover <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedSectionId}
                onChange={(e) => {
                  setSelectedSectionId(e.target.value);
                  setLocalError('');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4B7F3A]"
              >
                <option value="">-- Choose Absent/On-Leave Teacher's Class --</option>
                {eligibleSections.map((sec) => {
                  const className = sec.class?.name || 'Class';
                  const secName = sec.name && sec.name !== 'null' ? `Section ${sec.name}` : 'Whole Class';
                  const teacherName = sec.classTeacher?.fullName || 'Assigned Teacher';
                  const reasonInfo = sec.proxyReasonInfo || 'Colleague Absent';
                  return (
                    <option key={String(sec._id)} value={String(sec._id)}>
                      {className} - {secName} ({teacherName} · {reasonInfo})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Selected Colleague Summary Card */}
            {selectedSection && (
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-xs space-y-1">
                <div className="font-bold text-emerald-950 flex items-center justify-between">
                  <span>Covering: {selectedSection.classTeacher?.fullName || 'Class Teacher'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {selectedSection.proxyReasonInfo || 'Absence Verified'}
                  </span>
                </div>
                <div className="text-emerald-800 text-[11px]">
                  Class: <strong>{selectedSection.class?.name} - {selectedSection.name || 'A'}</strong>
                </div>
              </div>
            )}

            {/* Mandatory Reason Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mandatory Proxy Justification <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={proxyReason}
                onChange={(e) => {
                  setProxyReason(e.target.value);
                  setLocalError('');
                }}
                rows={3}
                placeholder="e.g., Covering for Sir Rashid who is on Casual Leave today as authorized by HM."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4B7F3A] resize-none"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                <span>Minimum 5 characters required</span>
                <span className={trimmedReason.length < 5 ? 'text-rose-500' : 'text-emerald-600'}>
                  {trimmedReason.length}/500
                </span>
              </div>
            </div>

            {/* Error Display */}
            {localError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{localError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedSectionId || !isValidReason}
                className="px-4 py-2 rounded-xl bg-[#4B7F3A] hover:bg-[#3d692e] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Proceed to Mark Attendance</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TeacherProxyAttendanceModal;

