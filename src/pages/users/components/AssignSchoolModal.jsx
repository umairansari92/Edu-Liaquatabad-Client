import React, { useState } from 'react';
import {
  X,
  School,
  Building2,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import apiClient from '../../../services/apiClient.js';
import toast from 'react-hot-toast';

export const AssignSchoolModal = ({
  isOpen,
  onClose,
  targetEmployee,
  schoolsList = [],
  onAssigned,
}) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [designation, setDesignation] = useState(targetEmployee?.designation || '');
  const [assignmentReason, setAssignmentReason] = useState('Initial municipal school placement');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !targetEmployee) return null;

  const currentSchool = targetEmployee.schoolId?.name || 'Unassigned';
  const filteredSchools = schoolsList.filter((s) => {
    const q = schoolSearch.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.schoolCode?.toLowerCase().includes(q) ||
      s.emisCode?.toLowerCase().includes(q)
    );
  });

  const selectedSchool = schoolsList.find((s) => String(s._id) === String(selectedSchoolId));

  const handleExecuteAssignment = async () => {
    if (!selectedSchoolId) {
      toast.error('Please select a destination municipal school.');
      return;
    }
    if (!assignmentReason.trim()) {
      toast.error('Please enter a valid assignment reason.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.patch(`/users/${targetEmployee._id}/assign-school`, {
        schoolId: selectedSchoolId,
        designation: designation.trim() || undefined,
        reason: assignmentReason.trim(),
        effectiveDate,
      });

      if (response.data?.success) {
        toast.success(
          response.data.message ||
            `Successfully assigned ${targetEmployee.fullName} to ${selectedSchool?.name || 'school'}.`
        );
        onAssigned?.();
        handleClose();
      } else {
        toast.error(response.data?.message || 'Failed to assign school.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Server error assigning school.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedSchoolId('');
    setSchoolSearch('');
    setShowConfirmation(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200/80 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#006AC7]">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#102033]">Assign Municipal School</h2>
              <p className="text-[11px] text-[#526477]">
                Education Department Liaquatabad Town Centre (DMC)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#102033] hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-[#526477]">
          {/* Target Employee Summary Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#526477] uppercase tracking-wider">
                Employee
              </span>
              <div className="font-bold text-[#102033] text-sm mt-0.5">
                {targetEmployee.fullName}
              </div>
              <div className="text-[11px] text-[#526477]">
                {targetEmployee.email} • ID:{' '}
                {targetEmployee.teacherProfile?.employeeId || targetEmployee._id?.slice(-6).toUpperCase()}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-[#526477] uppercase tracking-wider">
                Current School
              </span>
              <div className="mt-0.5 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full inline-block text-[11px]">
                {currentSchool}
              </div>
            </div>
          </div>

          {!showConfirmation ? (
            <div className="space-y-4">
              {/* School Search & Selection */}
              <div>
                <label className="block font-bold text-[#102033] mb-1.5">
                  Select Municipal School <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={schoolSearch}
                    onChange={(e) => setSchoolSearch(e.target.value)}
                    placeholder="Type school name or code to filter..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-[#102033] focus:border-[#006AC7] focus:bg-white focus:outline-none"
                  />
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    size={4}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-[#102033] focus:border-[#006AC7] focus:outline-none overflow-y-auto"
                  >
                    <option value="" disabled className="text-slate-400 py-1">
                      -- Choose from {filteredSchools.length} registered schools --
                    </option>
                    {filteredSchools.map((s) => (
                      <option key={s._id} value={s._id} className="py-1 px-1.5 rounded hover:bg-blue-50">
                        {s.name} {s.schoolCode ? `(${s.schoolCode})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Designation Override (Optional) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#102033] mb-1">Civil Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Teacher / PST"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-[#102033] focus:border-[#006AC7] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#102033] mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-[#102033] focus:border-[#006AC7] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Assignment Justification */}
              <div>
                <label className="block font-bold text-[#102033] mb-1">
                  Assignment Reason / Official Order <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={assignmentReason}
                  onChange={(e) => setAssignmentReason(e.target.value)}
                  rows={2}
                  placeholder="Official justification for this school assignment..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-[#102033] focus:border-[#006AC7] focus:bg-white focus:outline-none resize-none"
                />
              </div>
            </div>
          ) : (
            /* Confirmation Step */
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-3">
              <div className="flex items-center gap-2 text-[#006AC7] font-bold text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Confirm Institutional Assignment</span>
              </div>
              <p className="text-xs text-[#102033]">
                Are you sure you want to assign <strong>{targetEmployee.fullName}</strong> to{' '}
                <strong>{selectedSchool?.name}</strong>?
              </p>
              <div className="text-[11px] text-[#526477] bg-white p-2.5 rounded-lg border border-blue-100 space-y-1">
                <div>• Designation: <strong>{designation || targetEmployee.designation}</strong></div>
                <div>• Effective Date: <strong>{effectiveDate}</strong></div>
                <div>• Reason: <strong>{assignmentReason}</strong></div>
                <div className="text-amber-700 font-semibold mt-1">
                  * This assignment will update official school personnel rosters and write an immutable audit log.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            onClick={showConfirmation ? () => setShowConfirmation(false) : handleClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#526477] hover:bg-slate-100 transition"
          >
            {showConfirmation ? 'Back' : 'Cancel'}
          </button>

          {!showConfirmation ? (
            <button
              type="button"
              disabled={!selectedSchoolId || !assignmentReason.trim()}
              onClick={() => setShowConfirmation(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#006AC7] px-4 py-2 text-xs font-bold text-white hover:bg-[#005299] disabled:opacity-50 transition shadow-sm"
            >
              <span>Continue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleExecuteAssignment}
              className="flex items-center gap-1.5 rounded-xl bg-[#4B7F3A] px-4 py-2 text-xs font-bold text-white hover:bg-[#3D692F] disabled:opacity-50 transition shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Assigning...' : 'Confirm Assignment'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignSchoolModal;
