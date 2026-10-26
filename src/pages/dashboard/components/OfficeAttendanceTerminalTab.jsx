import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  ShieldCheck,
  Sparkles,
  Calendar,
  Loader2,
  FileText,
  AlertCircle,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import staffAttendanceService from '../../../services/staffAttendanceService.js';
import { getErrorMessage } from '../../../utils/errorUtils.js';

const getKarachiTodayDateString = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
};

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

const formatDatePKT = (isoDateString) => {
  if (!isoDateString) return '';
  try {
    return new Date(isoDateString).toLocaleDateString('en-GB', {
      timeZone: 'Asia/Karachi',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (_) {
    return '';
  }
};

/**
 * 🏢 OfficeAttendanceTerminalTab
 *
 * Centralized Attendance Marking Terminal for DMC Town Centre Administrative Office Staff.
 * Governed strictly under municipal transparency policy:
 * - Office staff (Admins, Supervisors, Clerks, Peons) cannot mark attendance from mobile/home.
 * - Attendance is marked authoritatively on the Super Admin Office PC terminal.
 * - Super Admin marks their own attendance directly (self-approved).
 */
export const OfficeAttendanceTerminalTab = ({ authenticatedUser }) => {
  const [selectedDate, setSelectedDate] = useState(() => getKarachiTodayDateString());
  const [rosterData, setRosterData] = useState({ summary: {}, roster: [] });
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, UNMARKED, PRESENT, ABSENT, LEAVE

  // Super Admin Self-Attendance State
  const [superAdminRecord, setSuperAdminRecord] = useState(null);
  const [checkingSelfRecord, setCheckingSelfRecord] = useState(false);
  const [submittingSelfAttendance, setSubmittingSelfAttendance] = useState(false);

  // Terminal Action Modal State (for marking absent/leave with remarks)
  const [activeActionModal, setActiveActionModal] = useState(null); // { staffUser, actionType: 'PRESENT' | 'ABSENT' | 'LEAVE' }
  const [modalRemarks, setModalRemarks] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  // ─── Fetch Office Staff Roster ──────────────────────────────────────────────
  const loadOfficeRoster = useCallback(async () => {
    setLoadingRoster(true);
    try {
      const response = await staffAttendanceService.getOfficeStaffAttendanceRoster({ date: selectedDate });
      setRosterData({
        summary: response?.summary || {},
        roster: response?.roster || [],
      });
    } catch (apiError) {
      toast.error(getErrorMessage(apiError, 'Failed to load office attendance roster.'));
    } finally {
      setLoadingRoster(false);
    }
  }, [selectedDate]);

  // ─── Fetch Super Admin Self Record ──────────────────────────────────────────
  const loadSuperAdminSelfAttendance = useCallback(async () => {
    setCheckingSelfRecord(true);
    try {
      const response = await staffAttendanceService.getMyStaffAttendanceHistory({ limit: 5 });
      const records = response?.records || [];
      const foundRecord = records.find((rec) => {
        const recDate = rec.attendanceDate ? rec.attendanceDate.split('T')[0] : '';
        return recDate === selectedDate;
      });
      setSuperAdminRecord(foundRecord || null);
    } catch (_) {
      // Non-fatal probe
    } finally {
      setCheckingSelfRecord(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadOfficeRoster();
    loadSuperAdminSelfAttendance();
  }, [loadOfficeRoster, loadSuperAdminSelfAttendance]);

  // ─── Handler: Super Admin Self Attendance ───────────────────────────────────
  const handleMarkSuperAdminSelf = async () => {
    setSubmittingSelfAttendance(true);
    try {
      await staffAttendanceService.superAdminSelfAttendance({ attendanceDate: selectedDate });
      toast.success(`Super Admin daily attendance recorded and self-approved for ${selectedDate}.`);
      await loadSuperAdminSelfAttendance();
      await loadOfficeRoster();
    } catch (apiError) {
      toast.error(getErrorMessage(apiError, 'Failed to record Super Admin attendance.'));
    } finally {
      setSubmittingSelfAttendance(false);
    }
  };

  // ─── Handler: Quick Mark Present ────────────────────────────────────────────
  const handleQuickMarkPresent = async (staffUser) => {
    setActionInProgress(true);
    try {
      await staffAttendanceService.superAdminMarkOfficeStaff({
        staffUserId: staffUser._id,
        attendanceDate: selectedDate,
        status: 'PRESENT',
        remarks: 'Physical check-in at Town Centre Office terminal.',
      });
      toast.success(`Marked ${staffUser.fullName} as Present.`);
      await loadOfficeRoster();
    } catch (apiError) {
      toast.error(getErrorMessage(apiError, 'Failed to mark attendance.'));
    } finally {
      setActionInProgress(false);
    }
  };

  // ─── Handler: Open Remarks Modal ────────────────────────────────────────────
  const handleOpenActionModal = (staffUser, actionType) => {
    setActiveActionModal({ staffUser, actionType });
    setModalRemarks('');
  };

  // ─── Handler: Submit Remarks Modal ──────────────────────────────────────────
  const handleSubmitActionModal = async (submitEvent) => {
    submitEvent.preventDefault();
    if (!activeActionModal) return;

    const { staffUser, actionType } = activeActionModal;

    if (actionType !== 'PRESENT' && !modalRemarks.trim()) {
      toast.error('Please provide a reason or remarks for audit logging.');
      return;
    }

    setActionInProgress(true);
    try {
      await staffAttendanceService.superAdminMarkOfficeStaff({
        staffUserId: staffUser._id,
        attendanceDate: selectedDate,
        status: actionType,
        remarks: modalRemarks.trim() || undefined,
      });
      toast.success(`Marked ${staffUser.fullName} as ${actionType}.`);
      setActiveActionModal(null);
      setModalRemarks('');
      await loadOfficeRoster();
    } catch (apiError) {
      toast.error(getErrorMessage(apiError, 'Failed to submit office attendance.'));
    } finally {
      setActionInProgress(false);
    }
  };

  // ─── Filtered Roster ────────────────────────────────────────────────────────
  const filteredRoster = useMemo(() => {
    return (rosterData.roster || []).filter((staffItem) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const nameMatch = (staffItem.fullName || '').toLowerCase().includes(query);
        const emailMatch = (staffItem.email || '').toLowerCase().includes(query);
        const desigMatch = (staffItem.designation || '').toLowerCase().includes(query);
        if (!nameMatch && !emailMatch && !desigMatch) return false;
      }

      // Status
      if (statusFilter === 'UNMARKED') return !staffItem.isMarked;
      if (statusFilter === 'PRESENT') {
        return staffItem.isMarked && staffItem.attendance?.approvalStatus === 'APPROVED';
      }
      if (statusFilter === 'ABSENT') {
        return staffItem.isMarked && staffItem.attendance?.approvalStatus === 'REJECTED';
      }
      return true;
    });
  }, [rosterData.roster, searchQuery, statusFilter]);

  const summary = rosterData.summary || {};
  const isTodaySelected = selectedDate === getKarachiTodayDateString();

  return (
    <div className="space-y-6">
      {/* ─── ZONE 1: SUPER ADMIN SELF-ATTENDANCE TERMINAL CARD ─────────────── */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30">
                <ShieldCheck className="w-3.5 h-3.5" /> Super Admin Authority Terminal
              </span>
              <span className="text-xs text-slate-300 font-medium">
                DMC Liaquatabad Town Education Office
              </span>
            </div>

            <h3 className="text-xl font-black tracking-tight text-white">
              Super Admin Daily Attendance Check-In
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Under municipal transparency laws, Super Admin records their own attendance directly at the office terminal. Baqi tamaam office staff (Admins, Supervisors, Clerks, Support Staff) is terminal se mark kiye jaate hain.
            </p>

            {superAdminRecord ? (
              <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-purple-200">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Recorded & Self-Approved
                </span>
                <span>•</span>
                <span>Marked: <strong className="text-white font-bold">{formatTimePKT(superAdminRecord.submittedAt)} PKT</strong></span>
                <span>•</span>
                <span>Date: <strong className="text-white font-bold">{formatDatePKT(superAdminRecord.attendanceDate)}</strong></span>
              </div>
            ) : (
              <p className="text-xs text-amber-300 font-semibold pt-1 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Super Admin attendance has not yet been recorded for {selectedDate}.
              </p>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {!superAdminRecord && (
              <button
                type="button"
                onClick={handleMarkSuperAdminSelf}
                disabled={submittingSelfAttendance}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:opacity-60 text-white text-xs sm:text-sm font-black transition-all flex items-center gap-2 shadow-lg cursor-pointer transform hover:-translate-y-0.5"
              >
                {submittingSelfAttendance ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Recording Self-Attendance...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Record My Attendance (Today)
                  </>
                )}
              </button>
            )}
            {superAdminRecord && (
              <div className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Attendance Active
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── ZONE 2: OFFICE STAFF ROSTER TERMINAL ───────────────────────────── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-6">
        {/* Terminal Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-[#102033] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#006AC7]" />
              Town Office Staff Daily Attendance Roster
            </h3>
            <p className="text-xs text-[#526477] mt-0.5">
              Authoritative centralized marking terminal for municipal office personnel (Admins, Supervisors, Clerks, Support Staff).
            </p>
          </div>

          {/* Date Picker & Refresh Button */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-[#526477]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(changeEvent) => setSelectedDate(changeEvent.target.value)}
                className="bg-transparent text-xs font-bold text-[#102033] focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                loadOfficeRoster();
                loadSuperAdminSelfAttendance();
              }}
              disabled={loadingRoster}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#526477] transition cursor-pointer"
              title="Refresh Roster"
            >
              <RefreshCw className={`w-4 h-4 ${loadingRoster ? 'animate-spin text-[#006AC7]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Summary KPI Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#526477]">Total Office Personnel</span>
            <p className="text-2xl font-black text-[#102033] mt-0.5">{summary.totalStaff || 0}</p>
            <span className="text-[11px] text-[#8094A8]">Town Centre Staff</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Marked Present</span>
            <p className="text-2xl font-black text-emerald-700 mt-0.5">{summary.presentCount || 0}</p>
            <span className="text-[11px] text-emerald-600">Terminal Verified</span>
          </div>

          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Marked Absent</span>
            <p className="text-2xl font-black text-rose-700 mt-0.5">{summary.absentCount || 0}</p>
            <span className="text-[11px] text-rose-600">Official Record</span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Awaiting Entry</span>
            <p className="text-2xl font-black text-amber-700 mt-0.5">{summary.unmarkedCount || 0}</p>
            <span className="text-[11px] text-amber-600">Pending Marking</span>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search staff by name, email, or designation…"
              value={searchQuery}
              onChange={(changeEvent) => setSearchQuery(changeEvent.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#102033] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold self-start sm:self-auto overflow-x-auto">
            {[
              { id: 'ALL', label: 'All Personnel' },
              { id: 'UNMARKED', label: 'Unmarked' },
              { id: 'PRESENT', label: 'Present' },
              { id: 'ABSENT', label: 'Absent' },
            ].map((filterTab) => (
              <button
                key={filterTab.id}
                type="button"
                onClick={() => setStatusFilter(filterTab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === filterTab.id
                    ? 'bg-white text-[#006AC7] shadow-xs'
                    : 'text-[#526477] hover:text-[#102033]'
                }`}
              >
                {filterTab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Personnel Roster List / Table */}
        {loadingRoster ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-sm text-[#526477]">
            <Loader2 className="w-6 h-6 animate-spin text-[#006AC7]" />
            <span>Loading Town Office staff attendance roster...</span>
          </div>
        ) : filteredRoster.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#8094A8] bg-slate-50 rounded-2xl border border-slate-200/60">
            No office personnel matching the selected criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden">
            {filteredRoster.map((staffUser) => {
              const isMarked = staffUser.isMarked;
              const attendance = staffUser.attendance;
              const isApproved = attendance?.approvalStatus === 'APPROVED';
              const isRejected = attendance?.approvalStatus === 'REJECTED';

              return (
                <div
                  key={staffUser._id}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Staff Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-[#102033]">
                        {staffUser.fullName}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-[#526477]">
                        {staffUser.designation}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#006AC7] border border-blue-200/60">
                        {staffUser.role}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700">
                        Town Centre Office
                      </span>
                    </div>

                    <div className="text-xs text-[#526477] flex items-center gap-2 flex-wrap">
                      <span>{staffUser.email}</span>
                      {staffUser.phoneNumber && (
                        <>
                          <span>•</span>
                          <span>{staffUser.phoneNumber}</span>
                        </>
                      )}
                    </div>

                    {/* Attendance Details if marked */}
                    {isMarked && (
                      <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#526477]">
                        <span className="font-semibold text-slate-700">
                          Marked At: <strong className="text-[#102033] font-bold">{formatTimePKT(attendance.submittedAt)} PKT</strong>
                        </span>
                        <span>•</span>
                        <span>
                          By: <strong className="text-[#102033] font-semibold">{attendance.markedBy?.fullName || 'Super Admin'}</strong>
                        </span>
                        {attendance.remarks && (
                          <>
                            <span>•</span>
                            <span className="italic text-slate-600">"{attendance.remarks}"</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status Badge & Action Controls */}
                  <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    {/* Status Badge */}
                    {isMarked ? (
                      isApproved ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> PRESENT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-700" /> ABSENT
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> Awaiting Terminal Entry
                      </span>
                    )}

                    {/* Action Buttons for Super Admin */}
                    <div className="flex items-center gap-1.5">
                      {(!isMarked || isRejected) && (
                        <button
                          type="button"
                          onClick={() => handleQuickMarkPresent(staffUser)}
                          disabled={actionInProgress}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Present
                        </button>
                      )}

                      {(!isMarked || isApproved) && (
                        <button
                          type="button"
                          onClick={() => handleOpenActionModal(staffUser, 'ABSENT')}
                          disabled={actionInProgress}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Absent
                        </button>
                      )}

                      {!isMarked && (
                        <button
                          type="button"
                          onClick={() => handleOpenActionModal(staffUser, 'LEAVE')}
                          disabled={actionInProgress}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" /> Leave
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── REMARKS / JUSTIFICATION MODAL ──────────────────────────────────── */}
      {activeActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-[#102033] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#006AC7]" />
                Record Terminal Attendance
              </h3>
              <button
                type="button"
                onClick={() => setActiveActionModal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#526477]">
              Recording <strong className="text-[#102033] font-bold">{activeActionModal.staffUser.fullName}</strong> as{' '}
              <strong className={activeActionModal.actionType === 'ABSENT' ? 'text-rose-700' : 'text-amber-700'}>
                {activeActionModal.actionType}
              </strong>{' '}
              for date <strong className="text-[#102033] font-bold">{selectedDate}</strong>.
            </p>

            <form onSubmit={handleSubmitActionModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#526477] mb-1.5">
                  Official Reason / Remarks (Mandatory for Audit Trail)
                </label>
                <textarea
                  rows={3}
                  required
                  value={modalRemarks}
                  onChange={(changeEvent) => setModalRemarks(changeEvent.target.value)}
                  placeholder="e.g. Official Duty outside office / Medical emergency / Casual leave applied / Unauthorized absence..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#102033] focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveActionModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-[#526477] hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress || !modalRemarks.trim()}
                  className="px-5 py-2 rounded-xl bg-[#006AC7] hover:bg-[#00529B] disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {actionInProgress ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Save Terminal Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficeAttendanceTerminalTab;
