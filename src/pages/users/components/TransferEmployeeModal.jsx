import React, { useState } from 'react';
import {
  X,
  ArrowLeftRight,
  School,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Calendar,
} from 'lucide-react';
import apiClient from '../../../services/apiClient.js';
import toast from 'react-hot-toast';

export const TransferEmployeeModal = ({
  isOpen,
  onClose,
  targetEmployee,
  schoolsList = [],
  currentUser,
  onTransferInitiated,
}) => {
  const [destinationSchoolId, setDestinationSchoolId] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [reason, setReason] = useState('');
  const [officialOrderNumber, setOfficialOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [isEmergencyOverride, setIsEmergencyOverride] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !targetEmployee) return null;

  const currentSchoolId = targetEmployee.schoolId?._id || targetEmployee.schoolId;
  const currentSchoolName = targetEmployee.schoolId?.name || 'Unassigned';

  // Filter out current school from destination choices
  const availableSchools = schoolsList.filter((schoolItem) => {
    const isDifferent = String(schoolItem._id) !== String(currentSchoolId);
    const searchQuery = schoolSearch.toLowerCase();
    const matchesSearch =
      schoolItem.name?.toLowerCase().includes(searchQuery) ||
      schoolItem.schoolCode?.toLowerCase().includes(searchQuery) ||
      schoolItem.emisCode?.toLowerCase().includes(searchQuery);
    return isDifferent && matchesSearch;
  });

  const isPrivilegedAdmin = ['ROOT_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(currentUser?.role);

  const handleSubmitTransfer = async (submitEvent) => {
    submitEvent.preventDefault();
    if (!destinationSchoolId) {
      toast.error('Please select a destination municipal school.');
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      toast.error('Transfer reason must be at least 5 characters.');
      return;
    }
    if (isEmergencyOverride && (!overrideJustification.trim() || overrideJustification.trim().length < 10)) {
      toast.error('Emergency override requires at least 10 characters justification.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/transfers', {
        teacherUserId: targetEmployee._id,
        targetSchoolId: destinationSchoolId,
        teacherId: targetEmployee._id,
        destinationSchoolId,
        reason: reason.trim(),
        officialOrderNumber: officialOrderNumber.trim() || undefined,
        orderDate: orderDate || undefined,
        isEmergencyOverride: isEmergencyOverride || undefined,
        overrideJustification: isEmergencyOverride ? overrideJustification.trim() : undefined,
      });

      if (response.data?.success) {
        const destSchoolObj = schoolsList.find((schoolItem) => String(schoolItem._id) === String(destinationSchoolId));
        const destSchoolName = destSchoolObj?.name || 'Target School';
        toast.success(
          isEmergencyOverride
            ? (response.data.message || `Emergency transfer executed for ${targetEmployee.fullName}.`)
            : `Transfer request sent to ${destSchoolName} HM for approval.`
        );
        onTransferInitiated?.();
        handleClose();
      } else {
        toast.error(response.data?.message || 'Transfer initiation failed.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Server error initiating faculty transfer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDestinationSchoolId('');
    setSchoolSearch('');
    setReason('');
    setOfficialOrderNumber('');
    setIsEmergencyOverride(false);
    setOverrideJustification('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200/80 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#006AC7]">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#102033]">Initiate Faculty Transfer</h2>
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

        <form onSubmit={handleSubmitTransfer} className="p-6 space-y-4 text-xs text-[#526477]">
          {/* Faculty Summary Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#526477] uppercase tracking-wider">
                Faculty Member
              </span>
              <div className="font-bold text-[#102033] text-sm mt-0.5">
                {targetEmployee.fullName}
              </div>
              <div className="text-[11px] text-[#526477]">
                {targetEmployee.designation || 'Teacher'} • {targetEmployee.email}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-[#526477] uppercase tracking-wider">
                Source School
              </span>
              <div className="mt-0.5 font-bold text-[#006AC7] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full inline-block text-[11px]">
                {currentSchoolName}
              </div>
            </div>
          </div>

          {/* Destination School Selector */}
          <div>
            <label className="block font-bold text-[#102033] mb-1.5">
              Destination Municipal School <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={schoolSearch}
                onChange={(changeEvent) => setSchoolSearch(changeEvent.target.value)}
                placeholder="Search target school by name or code..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-[#102033] focus:border-[#006AC7] focus:bg-white focus:outline-none"
              />
              <select
                value={destinationSchoolId}
                onChange={(changeEvent) => setDestinationSchoolId(changeEvent.target.value)}
                size={4}
                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-[#102033] focus:border-[#006AC7] focus:outline-none overflow-y-auto"
              >
                <option value="" disabled className="text-slate-400 py-1">
                  -- Select target destination school --
                </option>
                {availableSchools.map((schoolItem) => (
                  <option key={schoolItem._id} value={schoolItem._id} className="py-1 px-1.5 rounded hover:bg-blue-50">
                    {schoolItem.name} {schoolItem.schoolCode ? `(${schoolItem.schoolCode})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#102033] mb-1">
                Official Order No. (Optional)
              </label>
              <input
                type="text"
                value={officialOrderNumber}
                onChange={(changeEvent) => setOfficialOrderNumber(changeEvent.target.value)}
                placeholder="e.g. DMC/LTC/ED/2026/891"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-[#102033] focus:border-[#006AC7] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-[#102033] mb-1">Order Date</label>
              <input
                type="date"
                value={orderDate}
                onChange={(changeEvent) => setOrderDate(changeEvent.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-[#102033] focus:border-[#006AC7] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Transfer Reason */}
          <div>
            <label className="block font-bold text-[#102033] mb-1">
              Transfer Reason & Administrative Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(changeEvent) => setReason(changeEvent.target.value)}
              rows={2}
              placeholder="Provide official justification for faculty transfer..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-[#102033] focus:border-[#006AC7] focus:bg-white focus:outline-none resize-none"
            />
          </div>

          {/* Emergency Override (Privileged Super/Root Admin Only) */}
          {isPrivilegedAdmin && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900 text-xs">
                <input
                  type="checkbox"
                  checked={isEmergencyOverride}
                  onChange={(changeEvent) => setIsEmergencyOverride(changeEvent.target.checked)}
                  className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                />
                <span>Executive Emergency Override (Direct Placement)</span>
              </label>
              {isEmergencyOverride && (
                <div>
                  <textarea
                    value={overrideJustification}
                    onChange={(changeEvent) => setOverrideJustification(changeEvent.target.value)}
                    rows={2}
                    placeholder="Mandatory administrative justification for bypassing standard HM review (minimum 10 chars)..."
                    className="w-full rounded-lg border border-amber-300 bg-white p-2 text-xs text-[#102033] focus:outline-none resize-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#526477] hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !destinationSchoolId || reason.trim().length < 5}
              className="flex items-center gap-1.5 rounded-xl bg-[#006AC7] px-4 py-2 text-xs font-bold text-white hover:bg-[#005299] disabled:opacity-50 transition shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Initiating...' : 'Submit Transfer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferEmployeeModal;
