import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  ArrowRightLeft,
  School,
  User,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Building2,
  Calendar,
  FileText,
  Eye,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient.js';

export const TeacherTransferTab = ({ schoolsList = [], teachersList = [] }) => {
  const { user } = useSelector((state) => state.auth);
  const isHM = user?.role === 'HM';
  const userSchoolId = String(user?.schoolId?._id || user?.schoolId || '');

  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState(isHM ? 'incoming' : 'all');

  // Transfer Initiation Modal (Admin / Super Admin only)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    teacherId: '',
    destinationSchoolId: '',
    reason: '',
  });

  // Action Modals for HM
  const [reviewModal, setReviewModal] = useState({ open: false, transfer: null });
  const [approveModal, setApproveModal] = useState({ open: false, transfer: null, joiningDate: new Date().toISOString().split('T')[0], remarks: '', isSubmitting: false });
  const [rejectModal, setRejectModal] = useState({ open: false, transfer: null, rejectionReason: '', isSubmitting: false });
  const [relieveModal, setRelieveModal] = useState({ open: false, transfer: null, relievingDate: new Date().toISOString().split('T')[0], relievingRemarks: '', relievingOrderNumber: '', clearanceCertified: false, isSubmitting: false });

  // Fetch Transfers
  const fetchTransfers = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter) queryParams.append('status', statusFilter);
      if (isHM && directionFilter) queryParams.append('direction', directionFilter);

      const response = await apiClient.get(`/transfers?${queryParams.toString()}`);
      if (response.data?.success) {
        setTransfers(response.data.data?.transfers || []);
      }
    } catch (transfersFetchError) {
      console.error('Failed to load transfers:', transfersFetchError);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, isHM, directionFilter]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  // Selected teacher's current school (for Admin transfer creation)
  const selectedTeacher = teachersList.find((teacherItem) => teacherItem._id === formData.teacherId);
  const currentSchoolName = selectedTeacher?.schoolId?.name || (
    schoolsList.find((schoolItem) => schoolItem._id === (selectedTeacher?.schoolId?._id || selectedTeacher?.schoolId))?.name || 'Unassigned / Global Pool'
  );
  const currentSchoolId = selectedTeacher?.schoolId?._id || selectedTeacher?.schoolId;

  const handleOpenModal = () => {
    setFormData({
      teacherId: teachersList[0]?._id || '',
      destinationSchoolId: '',
      reason: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmitTransfer = async (submitEvent) => {
    submitEvent.preventDefault();
    if (!formData.teacherId) {
      toast.error('Please select a teacher to transfer.');
      return;
    }
    if (!formData.destinationSchoolId) {
      toast.error('Please select a destination municipal school.');
      return;
    }
    if (formData.destinationSchoolId === currentSchoolId) {
      toast.error('Destination school must be different from current school.');
      return;
    }

    if (!formData.reason.trim() || formData.reason.trim().length < 5) {
      toast.error('Transfer reason must be at least 5 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/transfers', {
        teacherUserId: formData.teacherId,
        targetSchoolId: formData.destinationSchoolId,
        teacherId: formData.teacherId,
        destinationSchoolId: formData.destinationSchoolId,
        reason: formData.reason.trim(),
      });

      if (response.data?.success) {
        const destSchoolObj = schoolsList.find((schoolItem) => String(schoolItem._id) === String(formData.destinationSchoolId));
        const destSchoolName = destSchoolObj?.name || 'Target School';
        toast.success(`Transfer order issued for ${destSchoolName}. Awaiting destination HM review.`);
        setIsModalOpen(false);
        fetchTransfers();
      } else {
        toast.error(response.data?.message || 'Transfer request failed.');
      }
    } catch (transferSubmitError) {
      toast.error(transferSubmitError.response?.data?.message || 'Server error initiating faculty transfer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // HM Approve Joining Handler
  const handleApproveJoining = async (submitEvent) => {
    submitEvent.preventDefault();
    if (!approveModal.transfer?._id) return;

    setApproveModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      const response = await apiClient.patch(`/transfers/${approveModal.transfer._id}/approve-joining`, {
        joiningDate: approveModal.joiningDate,
        remarks: approveModal.remarks.trim(),
      });

      if (response.data?.success) {
        toast.success('Staff member joining approved. Added to school staff roster.');
        setApproveModal({ open: false, transfer: null, joiningDate: '', remarks: '', isSubmitting: false });
        fetchTransfers();
      } else {
        toast.error(response.data?.message || 'Failed to approve joining.');
      }
    } catch (approvalError) {
      toast.error(approvalError.response?.data?.message || 'Server error approving joining.');
    } finally {
      setApproveModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // HM Reject Joining Handler
  const handleRejectJoining = async (submitEvent) => {
    submitEvent.preventDefault();
    if (!rejectModal.transfer?._id) return;
    if (!rejectModal.rejectionReason.trim() || rejectModal.rejectionReason.trim().length < 5) {
      toast.error('Please provide a specific rejection reason of at least 5 characters.');
      return;
    }

    setRejectModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      const response = await apiClient.patch(`/transfers/${rejectModal.transfer._id}/reject`, {
        rejectionReason: rejectModal.rejectionReason.trim(),
      });

      if (response.data?.success) {
        toast.success('Staff joining request rejected and recorded.');
        setRejectModal({ open: false, transfer: null, rejectionReason: '', isSubmitting: false });
        fetchTransfers();
      } else {
        toast.error(response.data?.message || 'Failed to reject joining.');
      }
    } catch (rejectionError) {
      toast.error(rejectionError.response?.data?.message || 'Server error rejecting joining.');
    } finally {
      setRejectModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Source HM Relieving Handler
  const handleRelieveStaff = async (submitEvent) => {
    submitEvent.preventDefault();
    if (!relieveModal.transfer?._id) return;
    if (!relieveModal.clearanceCertified) {
      toast.error('You must verify clearance before relieving staff.');
      return;
    }

    setRelieveModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      const response = await apiClient.patch(`/transfers/${relieveModal.transfer._id}/relieve`, {
        relievingDate: relieveModal.relievingDate,
        relievingRemarks: relieveModal.relievingRemarks.trim(),
        relievingOrderNumber: relieveModal.relievingOrderNumber.trim(),
        clearanceCertified: true,
      });

      if (response.data?.success) {
        toast.success('Staff member formally relieved from school duties.');
        setRelieveModal({ open: false, transfer: null, relievingDate: '', relievingRemarks: '', relievingOrderNumber: '', clearanceCertified: false, isSubmitting: false });
        fetchTransfers();
      } else {
        toast.error(response.data?.message || 'Failed to relieve staff.');
      }
    } catch (relieveError) {
      toast.error(relieveError.response?.data?.message || 'Server error relieving staff.');
    } finally {
      setRelieveModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Filter transfers
  const filteredTransfers = transfers.filter((transferRecord) => {
    const teacherName = transferRecord.teacherUserId?.fullName || transferRecord.userId?.fullName || '';
    const fromName = transferRecord.fromSchoolId?.name || transferRecord.currentSchoolId?.name || '';
    const toName = transferRecord.toSchoolId?.name || transferRecord.destinationSchoolId?.name || '';
    const query = searchQuery.toLowerCase();
    return (
      teacherName.toLowerCase().includes(query) ||
      fromName.toLowerCase().includes(query) ||
      toName.toLowerCase().includes(query) ||
      (transferRecord.reason && transferRecord.reason.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-5 animate-tab-content">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-[#006AC7]">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#102033]">
              {isHM ? 'Staff Joining Requests' : 'Faculty Transfer & Deployment Office'}
            </h3>
            <p className="text-xs text-[#526477]">
              {isHM
                ? 'Review staff members assigned to this school by the education administration.'
                : 'Manage inter-school teacher reassignments with automated school updating and immutable audit trails.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isHM && (
            <button
              type="button"
              onClick={handleOpenModal}
              className="flex items-center gap-1.5 rounded-lg bg-[#006AC7] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#00529B] transition shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Initiate Staff Transfer</span>
            </button>
          )}
          <button
            type="button"
            onClick={fetchTransfers}
            className="rounded-lg border border-slate-300 bg-white p-2 text-[#526477] hover:text-[#102033] hover:bg-slate-50 transition cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* HM Direction Navigation Pills */}
      {isHM && (
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setDirectionFilter('incoming')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              directionFilter === 'incoming'
                ? 'bg-white text-[#006AC7] shadow-sm'
                : 'text-[#526477] hover:text-[#102033]'
            }`}
          >
            <span>Incoming Staff (Joining Requests)</span>
          </button>
          <button
            type="button"
            onClick={() => setDirectionFilter('outgoing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              directionFilter === 'outgoing'
                ? 'bg-white text-[#006AC7] shadow-sm'
                : 'text-[#526477] hover:text-[#102033]'
            }`}
          >
            <span>Departing Staff (Clearance & Relieving)</span>
          </button>
          <button
            type="button"
            onClick={() => setDirectionFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              directionFilter === 'all'
                ? 'bg-white text-[#006AC7] shadow-sm'
                : 'text-[#526477] hover:text-[#102033]'
            }`}
          >
            <span>All School Transfers</span>
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8094A8]" />
          <input
            type="text"
            placeholder="Search by staff name, school, or justification..."
            value={searchQuery}
            onChange={(inputChangeEvent) => setSearchQuery(inputChangeEvent.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-[#526477]">Status:</label>
          <select
            value={statusFilter}
            onChange={(selectChangeEvent) => setStatusFilter(selectChangeEvent.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-[#102033] focus:border-[#006AC7] focus:outline-none"
          >
            <option value="">All Statuses ({transfers.length})</option>
            <option value="APPROVED">APPROVED / JOINED</option>
            <option value="PENDING_TARGET_HM_APPROVAL">AWAITING HM APPROVAL</option>
            <option value="RELIEVED">RELIEVED / EN ROUTE</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* Transfer History Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <table className="w-full text-left text-xs text-[#526477]">
          <thead className="border-b border-slate-200/80 bg-[#F0F8FF]/80 text-[11px] uppercase font-bold text-[#526477] tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Staff Member</th>
              <th className="px-4 py-3.5">Originating School</th>
              <th className="px-4 py-3.5">Destination School</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Reason / Justification</th>
              <th className="px-4 py-3.5">Date Received</th>
              {isHM && <th className="px-4 py-3.5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={isHM ? 7 : 6} className="py-12 text-center text-[#526477]">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#006AC7]" />
                  <p className="mt-2 text-xs">Loading staff transfers...</p>
                </td>
              </tr>
            ) : filteredTransfers.length === 0 ? (
              <tr>
                <td colSpan={isHM ? 7 : 6} className="py-12 text-center text-slate-400">
                  <ArrowRightLeft className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-[#102033]">No transfer records found</p>
                  <p className="text-xs text-[#8094A8] mt-1">
                    {isHM
                      ? 'No pending staff joining requests for your school.'
                      : 'Transfer orders issued by administration will appear here.'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredTransfers.map((transferRecord) => {
                const teacherRecord = transferRecord.teacherUserId || transferRecord.userId;
                const fromSchoolRecord = transferRecord.fromSchoolId || transferRecord.currentSchoolId;
                const toSchoolRecord = transferRecord.toSchoolId || transferRecord.destinationSchoolId;

                const destSchoolId = String(toSchoolRecord?._id || toSchoolRecord || '');
                const sourceSchoolId = String(fromSchoolRecord?._id || fromSchoolRecord || '');

                const isDestinationHM = isHM && userSchoolId === destSchoolId;
                const isSourceHM = isHM && userSchoolId === sourceSchoolId;

                const canApprove =
                  isDestinationHM &&
                  ['PENDING_TARGET_HM_APPROVAL', 'TRANSFER_REQUESTED', 'RELIEVED', 'AWAITING_DESTINATION_HM'].includes(
                    transferRecord.status
                  );
                const canReject =
                  isDestinationHM &&
                  ['PENDING_TARGET_HM_APPROVAL', 'TRANSFER_REQUESTED', 'RELIEVED', 'AWAITING_DESTINATION_HM'].includes(
                    transferRecord.status
                  );
                const canRelieve =
                  isSourceHM &&
                  ['APPROVED', 'INITIATED', 'TRANSFER_REQUESTED', 'PENDING_TARGET_HM_APPROVAL'].includes(
                    transferRecord.status
                  );

                return (
                  <tr key={transferRecord._id} className="transition hover:bg-blue-50/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 font-bold text-[#006AC7]">
                          {teacherRecord?.fullName?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-[#102033]">{teacherRecord?.fullName || 'Staff Member'}</p>
                          <p className="text-[11px] text-[#8094A8]">{teacherRecord?.designation || teacherRecord?.role || 'Staff'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{teacherRecord?.email || ''}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-[#526477]">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-medium text-[#102033]">{fromSchoolRecord?.name || 'Previous School'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-[#006AC7]">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-[#006AC7]" />
                        <span className="font-semibold text-[#006AC7]">{toSchoolRecord?.name || 'Assigned School'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          transferRecord.status === 'APPROVED' || transferRecord.status === 'JOINED' || transferRecord.status === 'JOINING_APPROVED'
                            ? 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200'
                            : transferRecord.status === 'PENDING' || transferRecord.status === 'PENDING_TARGET_HM_APPROVAL' || transferRecord.status === 'TRANSFER_REQUESTED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : transferRecord.status === 'RELIEVED' || transferRecord.status === 'AWAITING_DESTINATION_HM'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {(transferRecord.status === 'APPROVED' || transferRecord.status === 'JOINED' || transferRecord.status === 'JOINING_APPROVED') && <CheckCircle2 className="h-3 w-3" />}
                        {(transferRecord.status === 'PENDING' || transferRecord.status === 'PENDING_TARGET_HM_APPROVAL' || transferRecord.status === 'TRANSFER_REQUESTED') && <Clock className="h-3 w-3" />}
                        {(transferRecord.status === 'REJECTED' || transferRecord.status === 'REJECTED_BY_HM') && <XCircle className="h-3 w-3" />}
                        {transferRecord.status === 'PENDING_TARGET_HM_APPROVAL'
                          ? 'Awaiting HM Review'
                          : transferRecord.status === 'JOINED' || transferRecord.status === 'JOINING_APPROVED'
                          ? 'Joined'
                          : transferRecord.status === 'REJECTED_BY_HM'
                          ? 'Rejected by HM'
                          : transferRecord.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-[#526477] max-w-xs truncate" title={transferRecord.reason}>
                      {transferRecord.reason || 'Administrative transfer'}
                    </td>

                    <td className="px-4 py-4 text-[#8094A8] font-mono text-[11px]">
                      {new Date(transferRecord.createdAt).toLocaleDateString()}
                    </td>

                    {isHM && (
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setReviewModal({ open: true, transfer: transferRecord })}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-[#526477] hover:text-[#102033] hover:bg-slate-50 transition cursor-pointer"
                          >
                            Review
                          </button>
                          {canApprove && (
                            <button
                              type="button"
                              onClick={() =>
                                setApproveModal({
                                  open: true,
                                  transfer: transferRecord,
                                  joiningDate: new Date().toISOString().split('T')[0],
                                  remarks: '',
                                  isSubmitting: false,
                                })
                              }
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#4B7F3A] hover:bg-[#3d682f] text-white transition cursor-pointer shadow-xs"
                            >
                              Approve joining
                            </button>
                          )}
                          {canReject && (
                            <button
                              type="button"
                              onClick={() =>
                                setRejectModal({
                                  open: true,
                                  transfer: transferRecord,
                                  rejectionReason: '',
                                  isSubmitting: false,
                                })
                              }
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                            >
                              Reject
                            </button>
                          )}
                          {canRelieve && (
                            <button
                              type="button"
                              onClick={() =>
                                setRelieveModal({
                                  open: true,
                                  transfer: transferRecord,
                                  relievingDate: new Date().toISOString().split('T')[0],
                                  relievingRemarks: '',
                                  relievingOrderNumber: transferRecord.officialOrderNumber || '',
                                  clearanceCertified: false,
                                  isSubmitting: false,
                                })
                              }
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#006AC7] hover:bg-[#005299] text-white transition cursor-pointer shadow-xs"
                            >
                              Relieve staff
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL: REVIEW TRANSFER ORDER DETAILS --- */}
      {reviewModal.open && reviewModal.transfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-modal-backdrop">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-[#102033] animate-modal-card">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#006AC7]" />
                <h4 className="text-base font-bold text-[#102033]">Transfer Order Details</h4>
              </div>
              <button
                type="button"
                onClick={() => setReviewModal({ open: false, transfer: null })}
                className="text-slate-400 hover:text-[#102033] cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Staff Member</span>
                <p className="text-sm font-bold text-[#102033]">
                  {reviewModal.transfer.teacherUserId?.fullName || reviewModal.transfer.userId?.fullName || 'Staff Member'}
                </p>
                <p className="text-slate-500 font-mono text-[11px]">
                  {reviewModal.transfer.teacherUserId?.email || 'N/A'} • Designation: {reviewModal.transfer.teacherUserId?.designation || 'Staff'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 p-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">From School</span>
                  <p className="font-bold text-[#102033] mt-0.5">
                    {reviewModal.transfer.fromSchoolId?.name || 'Previous School'}
                  </p>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">
                  <span className="text-[11px] font-bold text-[#006AC7] uppercase">Destination School</span>
                  <p className="font-bold text-[#006AC7] mt-0.5">
                    {reviewModal.transfer.toSchoolId?.name || 'Destination School'}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Transfer Reason / Directive</span>
                <p className="mt-1 text-[#526477]">{reviewModal.transfer.reason || 'Official transfer order'}</p>
              </div>

              {reviewModal.transfer.officialOrderNumber && (
                <div className="rounded-xl border border-slate-200 p-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Order Reference Number</span>
                  <p className="mt-1 font-mono font-bold text-[#102033]">{reviewModal.transfer.officialOrderNumber}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-500 pt-2 border-t border-slate-100">
                <span>Status: <strong className="text-[#102033]">{reviewModal.transfer.status}</strong></span>
                <span>Date: {new Date(reviewModal.transfer.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setReviewModal({ open: false, transfer: null })}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-[#526477] hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: APPROVE JOINING --- */}
      {approveModal.open && approveModal.transfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-modal-backdrop">
          <form onSubmit={handleApproveJoining} className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-[#102033] animate-modal-card">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <CheckCircle2 className="h-5 w-5 text-[#4B7F3A]" />
              <h4 className="text-base font-bold text-[#102033]">Approve Staff Joining</h4>
            </div>

            <p className="text-xs text-[#526477]">
              Confirm arrival and joining for <strong>{approveModal.transfer.teacherUserId?.fullName || 'Staff Member'}</strong>.
              This will officially register the staff member as active faculty at your school.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#526477] mb-1">Effective Joining Date *</label>
                <input
                  type="date"
                  required
                  value={approveModal.joiningDate}
                  onChange={(dateEvent) => setApproveModal({ ...approveModal, joiningDate: dateEvent.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-[#102033] focus:border-[#006AC7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#526477] mb-1">HM Remarks (Optional)</label>
                <textarea
                  rows={2}
                  value={approveModal.remarks}
                  onChange={(textEvent) => setApproveModal({ ...approveModal, remarks: textEvent.target.value })}
                  placeholder="e.g. Reported for duty with official joining report..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-[#102033] focus:border-[#006AC7] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApproveModal({ open: false, transfer: null, joiningDate: '', remarks: '', isSubmitting: false })}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#526477] hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={approveModal.isSubmitting}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#4B7F3A] hover:bg-[#3d682f] text-white cursor-pointer shadow-xs disabled:opacity-50"
              >
                {approveModal.isSubmitting ? 'Confirming...' : 'Confirm joining'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL: REJECT JOINING --- */}
      {rejectModal.open && rejectModal.transfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-modal-backdrop">
          <form onSubmit={handleRejectJoining} className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-[#102033] animate-modal-card">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              <h4 className="text-base font-bold text-[#102033]">Reject Joining Request</h4>
            </div>

            <p className="text-xs text-[#526477]">
              Please state why <strong>{rejectModal.transfer.teacherUserId?.fullName || 'Staff Member'}</strong> cannot join this school. This reason will be logged for administrative review.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#526477] mb-1">Rejection Reason * (minimum 5 characters)</label>
                <textarea
                  required
                  rows={3}
                  minLength={5}
                  value={rejectModal.rejectionReason}
                  onChange={(textEvent) => setRejectModal({ ...rejectModal, rejectionReason: textEvent.target.value })}
                  placeholder="e.g. No sanctioned post vacancy available, or subject mismatch..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-[#102033] focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectModal({ open: false, transfer: null, rejectionReason: '', isSubmitting: false })}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#526477] hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rejectModal.isSubmitting}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs disabled:opacity-50"
              >
                {rejectModal.isSubmitting ? 'Rejecting...' : 'Confirm rejection'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL: RELIEVE STAFF (SOURCE HM) --- */}
      {relieveModal.open && relieveModal.transfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-modal-backdrop">
          <form onSubmit={handleRelieveStaff} className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-[#102033] animate-modal-card">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ArrowRightLeft className="h-5 w-5 text-[#006AC7]" />
              <h4 className="text-base font-bold text-[#102033]">Relieve Departing Staff Member</h4>
            </div>

            <p className="text-xs text-[#526477]">
              Certify clearance and relieve <strong>{relieveModal.transfer.teacherUserId?.fullName || 'Staff Member'}</strong> to join {relieveModal.transfer.toSchoolId?.name || 'new school'}.
              All active teaching assignments at this school will be concluded.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#526477] mb-1">Relieving Date *</label>
                <input
                  type="date"
                  required
                  value={relieveModal.relievingDate}
                  onChange={(dateEvent) => setRelieveModal({ ...relieveModal, relievingDate: dateEvent.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-[#102033] focus:border-[#006AC7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#526477] mb-1">Official Relieving Order Number</label>
                <input
                  type="text"
                  value={relieveModal.relievingOrderNumber}
                  onChange={(textEvent) => setRelieveModal({ ...relieveModal, relievingOrderNumber: textEvent.target.value })}
                  placeholder="e.g. DMC/EDU/REL/2026/042"
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-[#102033] focus:border-[#006AC7] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#526477] mb-1">Clearance Remarks</label>
                <textarea
                  rows={2}
                  value={relieveModal.relievingRemarks}
                  onChange={(textEvent) => setRelieveModal({ ...relieveModal, relievingRemarks: textEvent.target.value })}
                  placeholder="e.g. All textbooks, register duties, and equipment returned in good order..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-[#102033] focus:border-[#006AC7] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                <input
                  type="checkbox"
                  id="clearanceCheck"
                  checked={relieveModal.clearanceCertified}
                  onChange={(checkEvent) => setRelieveModal({ ...relieveModal, clearanceCertified: checkEvent.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#006AC7] focus:ring-[#006AC7]"
                />
                <label htmlFor="clearanceCheck" className="text-xs font-semibold text-[#102033] cursor-pointer">
                  I certify that this staff member has cleared all institutional dues and handed over duties.
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRelieveModal({ open: false, transfer: null, relievingDate: '', relievingRemarks: '', relievingOrderNumber: '', clearanceCertified: false, isSubmitting: false })}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#526477] hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={relieveModal.isSubmitting || !relieveModal.clearanceCertified}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#006AC7] hover:bg-[#005299] text-white cursor-pointer shadow-xs disabled:opacity-50"
              >
                {relieveModal.isSubmitting ? 'Relieving...' : 'Confirm relieving'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL: INITIATE TEACHER TRANSFER (ADMIN ONLY) --- */}
      {isModalOpen && !isHM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-modal-backdrop">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-[#102033] animate-modal-card">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-[#006AC7]" />
                <h4 className="text-base font-bold text-[#102033]">Initiate Staff Transfer</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-[#102033] cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTransfer} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#526477]">Select Teacher to Transfer *</label>
                <select
                  required
                  value={formData.teacherId}
                  onChange={(selectChangeEvent) => setFormData({ ...formData, teacherId: selectChangeEvent.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[#102033] focus:border-[#006AC7] focus:outline-none"
                >
                  <option value="">-- Choose Teacher --</option>
                  {teachersList.map((teacherItem) => (
                    <option key={teacherItem._id} value={teacherItem._id}>
                      {teacherItem.fullName} ({teacherItem.designation || 'Teacher'}) — {teacherItem.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-[11px] font-medium text-[#526477]">Current Assigned Institution:</span>
                <p className="mt-0.5 font-bold text-[#006AC7]">
                  {currentSchoolName}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-[#526477]">Target Destination School *</label>
                <select
                  required
                  value={formData.destinationSchoolId}
                  onChange={(selectChangeEvent) => setFormData({ ...formData, destinationSchoolId: selectChangeEvent.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[#102033] focus:border-[#006AC7] focus:outline-none"
                >
                  <option value="">-- Select Destination Municipal School --</option>
                  {schoolsList
                    .filter((schoolItem) => schoolItem._id !== currentSchoolId)
                    .map((schoolItem) => (
                      <option key={schoolItem._id} value={schoolItem._id}>
                        {schoolItem.name} ({schoolItem.schoolCode || 'NO-CODE'})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#526477]">Mandatory Justification / Order Reference *</label>
                <textarea
                  required
                  rows={3}
                  minLength={5}
                  value={formData.reason}
                  onChange={(textareaChangeEvent) => setFormData({ ...formData, reason: textareaChangeEvent.target.value })}
                  placeholder="Official transfer order reference, rationalization of staff, or administrative need..."
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-[#526477] hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-lg bg-[#006AC7] px-5 py-2 font-semibold text-white hover:bg-[#00529B] cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting Transfer Request...' : 'Send Transfer Request For HM Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherTransferTab;
