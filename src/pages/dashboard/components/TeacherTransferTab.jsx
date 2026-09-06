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
  const selectedTeacher = teachersList.find((t) => t._id === formData.teacherId);
  const currentSchoolName = selectedTeacher?.schoolId?.name || (
    schoolsList.find((s) => s._id === (selectedTeacher?.schoolId?._id || selectedTeacher?.schoolId))?.name || 'Unassigned / Global Pool'
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

  const handleSubmitTransfer = async (e) => {
    e.preventDefault();
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
  const filteredTransfers = transfers.filter((t) => {
    const teacherName = t.userId?.fullName || '';
    const fromName = t.currentSchoolId?.name || '';
    const toName = t.destinationSchoolId?.name || '';
    const query = searchQuery.toLowerCase();
    return (
      teacherName.toLowerCase().includes(query) ||
      fromName.toLowerCase().includes(query) ||
      toName.toLowerCase().includes(query) ||
      (t.reason && t.reason.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-5">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 p-2 text-teal-400">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Faculty Transfer & Deployment Office</h3>
            <p className="text-xs text-slate-400">
              Manage inter-school teacher reassignments with automated schoolId updating and immutable audit trails
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-500 transition shadow cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Initiate Teacher Transfer</span>
          </button>
          <button
            type="button"
            onClick={fetchTransfers}
            className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            title="Refresh Transfer Log"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-3 backdrop-blur-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by teacher name, school, or justification..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-teal-500 focus:outline-none"
          >
            <option value="">All Statuses ({transfers.length})</option>
            <option value="APPROVED">APPROVED</option>
            <option value="PENDING">PENDING</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* Transfer History Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl backdrop-blur-md">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Faculty Member</th>
              <th className="px-4 py-3.5">Originating Institution</th>
              <th className="px-4 py-3.5">Destination School</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Reason / Justification</th>
              <th className="px-4 py-3.5 text-right">Date Executed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-teal-400" />
                  <p className="mt-2 text-xs">Querying faculty transfer ledger...</p>
                </td>
              </tr>
            ) : filteredTransfers.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">
                  <ArrowRightLeft className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No transfer records found</p>
                  <p className="text-xs text-slate-500 mt-1">Initiate a transfer to reassign faculty between schools.</p>
                </td>
              </tr>
            ) : (
              filteredTransfers.map((item) => (
                <tr key={item._id} className="transition hover:bg-slate-800/40">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-950/30 font-bold text-teal-400">
                        {item.userId?.fullName?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <p className="font-bold text-white">{item.userId?.fullName || 'Faculty Member'}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{item.userId?.email || 'N/A'}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-500" />
                      <span className="font-medium text-slate-300">{item.currentSchoolId?.name || 'Previous School'}</span>
                    </div>
                    {item.currentSchoolId?.schoolCode && (
                      <span className="text-[10px] text-slate-500 font-mono ml-5">
                        Code: {item.currentSchoolId.schoolCode}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-teal-300">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-teal-400" />
                      <span className="font-semibold text-teal-300">{item.destinationSchoolId?.name || 'Target School'}</span>
                    </div>
                    {item.destinationSchoolId?.schoolCode && (
                      <span className="text-[10px] text-teal-500 font-mono ml-5">
                        Code: {item.destinationSchoolId.schoolCode}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        item.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : item.status === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-red-500/20 text-red-400 border border-red-500/40'
                      }`}
                    >
                      {item.status === 'APPROVED' && <CheckCircle2 className="h-3 w-3" />}
                      {item.status === 'PENDING' && <Clock className="h-3 w-3" />}
                      {item.status === 'REJECTED' && <XCircle className="h-3 w-3" />}
                      {item.status}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-slate-300 max-w-xs truncate" title={item.reason}>
                    {item.reason || 'Administrative reassignment'}
                  </td>

                  <td className="px-4 py-4 text-right text-slate-400 font-mono text-[11px]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl border border-teal-500/40 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-teal-400" />
                <h4 className="text-base font-bold text-white">Initiate Faculty Transfer</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTransfer} className="space-y-4 text-xs">
              {/* Select Faculty Member */}
              <div>
                <label className="block font-semibold text-slate-300">Select Teacher to Transfer *</label>
                <select
                  required
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                >
                  <option value="">-- Choose Teacher --</option>
                  {teachersList.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.fullName} ({t.designation || 'Teacher'}) — {t.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Institution Info (Auto-populated) */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="text-[11px] font-medium text-slate-400">Current Assigned Institution:</span>
                <p className="mt-0.5 font-bold text-amber-300">
                  {currentSchoolName}
                </p>
              </div>

              {/* Destination School */}
              <div>
                <label className="block font-semibold text-slate-300">Target Destination School *</label>
                <select
                  required
                  value={formData.destinationSchoolId}
                  onChange={(e) => setFormData({ ...formData, destinationSchoolId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                >
                  <option value="">-- Select Destination Municipal School --</option>
                  {schoolsList
                    .filter((s) => s._id !== currentSchoolId)
                    .map((school) => (
                      <option key={school._id} value={school._id}>
                        {school.name} ({school.schoolCode || 'NO-CODE'})
                      </option>
                    ))}
                </select>
              </div>

              {/* Justification Reason */}
              <div>
                <label className="block font-semibold text-slate-300">Mandatory Justification / Order Reference *</label>
                <textarea
                  required
                  rows={3}
                  minLength={5}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Official transfer order reference, rationalization of staff, or administrative need..."
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-5 py-2 font-semibold text-white hover:bg-teal-500 cursor-pointer disabled:opacity-50"
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
