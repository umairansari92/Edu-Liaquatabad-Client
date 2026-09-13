import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient.js';

export const TeacherTransferTab = ({ schoolsList = [], teachersList = [] }) => {
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Transfer Initiation Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    teacherId: '',
    destinationSchoolId: '',
    reason: '',
  });

  // Fetch Transfers
  const fetchTransfers = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter) queryParams.append('status', statusFilter);

      const response = await apiClient.get(`/transfers?${queryParams.toString()}`);
      if (response.data?.success) {
        setTransfers(response.data.data?.transfers || []);
      }
    } catch (error) {
      console.error('Failed to load transfers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  // Selected teacher's current school
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

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/transfers', {
        teacherId: formData.teacherId,
        destinationSchoolId: formData.destinationSchoolId,
        reason: formData.reason.trim(),
      });

      if (response.data?.success) {
        toast.success(`Teacher transferred successfully! School assignment updated.`);
        setIsModalOpen(false);
        fetchTransfers();
      } else {
        toast.error(response.data?.message || 'Transfer request failed.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Server error initiating faculty transfer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter transfers
  const filteredTransfers = transfers.filter((transferRecord) => {
    const teacherName = transferRecord.userId?.fullName || '';
    const fromName = transferRecord.currentSchoolId?.name || '';
    const toName = transferRecord.destinationSchoolId?.name || '';
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
            <h3 className="text-sm font-bold text-[#102033]">Faculty Transfer & Deployment Office</h3>
            <p className="text-xs text-[#526477]">
              Manage inter-school teacher reassignments with automated schoolId updating and immutable audit trails
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 rounded-lg bg-[#006AC7] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#00529B] transition shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Initiate Teacher Transfer</span>
          </button>
          <button
            type="button"
            onClick={fetchTransfers}
            className="rounded-lg border border-slate-300 bg-white p-2 text-[#526477] hover:text-[#102033] hover:bg-slate-50 transition cursor-pointer"
            title="Refresh Transfer Log"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8094A8]" />
          <input
            type="text"
            placeholder="Search by teacher name, school, or justification..."
            value={searchQuery}
            onChange={(inputChangeEvent) => setSearchQuery(inputChangeEvent.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-[#526477]">Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(selectChangeEvent) => setStatusFilter(selectChangeEvent.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-[#102033] focus:border-[#006AC7] focus:outline-none"
          >
            <option value="">All Statuses ({transfers.length})</option>
            <option value="APPROVED">APPROVED</option>
            <option value="PENDING">PENDING</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* Transfer History Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <table className="w-full text-left text-xs text-[#526477]">
          <thead className="border-b border-slate-200/80 bg-[#F0F8FF]/80 text-[11px] uppercase font-bold text-[#526477] tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Faculty Member</th>
              <th className="px-4 py-3.5">Originating Institution</th>
              <th className="px-4 py-3.5">Destination School</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Reason / Justification</th>
              <th className="px-4 py-3.5 text-right">Date Executed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-[#526477]">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#006AC7]" />
                  <p className="mt-2 text-xs">Querying faculty transfer ledger...</p>
                </td>
              </tr>
            ) : filteredTransfers.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">
                  <ArrowRightLeft className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-[#102033]">No transfer records found</p>
                  <p className="text-xs text-[#8094A8] mt-1">Initiate a transfer to reassign faculty between schools.</p>
                </td>
              </tr>
            ) : (
              filteredTransfers.map((item) => (
                <tr key={item._id} className="transition hover:bg-blue-50/40">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 font-bold text-[#006AC7]">
                        {item.userId?.fullName?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <p className="font-bold text-[#102033]">{item.userId?.fullName || 'Faculty Member'}</p>
                        <p className="text-[11px] text-[#8094A8] font-mono">{item.userId?.email || 'N/A'}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-[#526477]">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-medium text-[#102033]">{item.currentSchoolId?.name || 'Previous School'}</span>
                    </div>
                    {item.currentSchoolId?.schoolCode && (
                      <span className="text-[10px] text-[#8094A8] font-mono ml-5">
                        Code: {item.currentSchoolId.schoolCode}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-[#006AC7]">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-[#006AC7]" />
                      <span className="font-semibold text-[#006AC7]">{item.destinationSchoolId?.name || 'Target School'}</span>
                    </div>
                    {item.destinationSchoolId?.schoolCode && (
                      <span className="text-[10px] text-blue-500 font-mono ml-5">
                        Code: {item.destinationSchoolId.schoolCode}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        item.status === 'APPROVED'
                          ? 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200'
                          : item.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {item.status === 'APPROVED' && <CheckCircle2 className="h-3 w-3" />}
                      {item.status === 'PENDING' && <Clock className="h-3 w-3" />}
                      {item.status === 'REJECTED' && <XCircle className="h-3 w-3" />}
                      {item.status}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-[#526477] max-w-xs truncate" title={item.reason}>
                    {item.reason || 'Administrative reassignment'}
                  </td>

                  <td className="px-4 py-4 text-right text-[#8094A8] font-mono text-[11px]">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL: INITIATE TEACHER TRANSFER --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-modal-backdrop">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-[#102033] animate-modal-card">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-[#006AC7]" />
                <h4 className="text-base font-bold text-[#102033]">Initiate Faculty Transfer</h4>
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
              {/* Select Faculty Member */}
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

              {/* Current Institution Info (Auto-populated) */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-[11px] font-medium text-[#526477]">Current Assigned Institution:</span>
                <p className="mt-0.5 font-bold text-[#006AC7]">
                  {currentSchoolName}
                </p>
              </div>

              {/* Destination School */}
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

              {/* Justification Reason */}
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
                  {isSubmitting ? 'Executing Transfer...' : 'Confirm & Execute Transfer'}
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
