import React, { useState } from 'react';
import {
  CalendarCheck2,
  Calendar,
  CheckCircle2,
  Clock,
  Clock3,
  AlertCircle,
  AlertTriangle,
  FileText,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Loader2,
  Info,
  X,
  User,
  Shield,
} from 'lucide-react';

/**
 * 📅 MonthlyAttendanceCard
 * Renders "My Attendance Record — Monthly attendance recorded by your Head Master / Office Terminal"
 * Shows monthly muster statistics, punctuality, interactive daily status chips,
 * and exact submission / approval timestamps formatted in Pakistan Standard Time (PKT).
 */
export const MonthlyAttendanceCard = ({
  attendanceData = null,
  loading = false,
  onMonthChange,
  isTeachingStaff = true,
  schoolName = 'Assigned School',
}) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedDayRecord, setSelectedDayRecord] = useState(null);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const handleMonthSelect = (event) => {
    const monthNum = parseInt(event.target.value, 10);
    setSelectedMonth(monthNum);
    setSelectedDayRecord(null);
    if (onMonthChange) {
      onMonthChange(monthNum, selectedYear);
    }
  };

  const handleYearSelect = (event) => {
    const yearNum = parseInt(event.target.value, 10);
    setSelectedYear(yearNum);
    setSelectedDayRecord(null);
    if (onMonthChange) {
      onMonthChange(selectedMonth, yearNum);
    }
  };

  const summary = attendanceData?.summary || {
    totalMarkedDays: 0,
    presentCount: 0,
    lateCount: 0,
    leaveCount: 0,
    absentCount: 0,
    pendingCount: 0,
    attendancePercentage: 0,
  };

  // Support both history array (from teacher self-attendance endpoint) and records array (from staff-attendance history)
  const history = attendanceData?.history || attendanceData?.records?.map((recordItem) => ({
    date: recordItem.attendanceDate ? recordItem.attendanceDate.split('T')[0] : '',
    status: recordItem.approvalStatus === 'APPROVED'
      ? 'PRESENT'
      : (recordItem.approvalStatus === 'REJECTED' ? 'ABSENT' : 'PENDING'),
    remarks: recordItem.remarks || '',
    submittedAt: recordItem.submittedAt,
    approvedAt: recordItem.approvedAt,
    approvedBy: recordItem.approvedBy,
    rejectedAt: recordItem.rejectedAt,
    rejectedBy: recordItem.rejectedBy,
    approvalStatus: recordItem.approvalStatus,
    lateApprovalReason: recordItem.lateApprovalReason,
    rejectionReason: recordItem.rejectionReason,
    entryMode: recordItem.entryMode,
  })) || [];

  const formatTimePKT = (isoDate) => {
    if (!isoDate) return null;
    try {
      return new Date(isoDate).toLocaleTimeString('en-US', {
        timeZone: 'Asia/Karachi',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return null;
    }
  };

  const formatDatePKT = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parsedDate = new Date(`${dateStr}T12:00:00Z`);
      return parsedDate.toLocaleDateString('en-US', {
        timeZone: 'Asia/Karachi',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status, approvalStatus) => {
    const normalizedStatus = String(status || '').toUpperCase();
    const normalizedApproval = String(approvalStatus || '').toUpperCase();

    if (normalizedApproval === 'PENDING_APPROVAL' || normalizedStatus === 'PENDING') {
      return {
        label: '⏳',
        fullName: 'Pending HM Approval',
        className: 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-400/40',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
        icon: Clock3,
      };
    }

    switch (normalizedStatus) {
      case 'PRESENT':
        return {
          label: 'P',
          fullName: 'Present',
          className: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: CheckCircle2,
        };
      case 'LATE':
        return {
          label: 'L',
          fullName: 'Late Arrival',
          className: 'bg-amber-50 text-amber-800 border-amber-300',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: AlertTriangle,
        };
      case 'LEAVE':
        return {
          label: 'LV',
          fullName: 'Casual Leave',
          className: 'bg-blue-50 text-blue-800 border-blue-300',
          badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: Calendar,
        };
      case 'ABSENT':
        return {
          label: 'A',
          fullName: 'Absent',
          className: 'bg-rose-50 text-rose-800 border-rose-300',
          badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: AlertCircle,
        };
      default:
        return {
          label: '-',
          fullName: status || 'Unrecorded',
          className: 'bg-slate-50 text-slate-600 border-slate-200',
          badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: Info,
        };
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
      {/* Header and Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#102033]">
              My Attendance Record
            </h3>
            <p className="text-xs text-[#526477]">
              Authoritative Muster Roll &bull; {schoolName} &bull; Pakistan Standard Time (PKT)
            </p>
          </div>
        </div>

        {/* Month & Year Selectors */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={selectedMonth}
            onChange={handleMonthSelect}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-[#102033] focus:outline-hidden focus:ring-2 focus:ring-[#006AC7]/30 cursor-pointer"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={handleYearSelect}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-[#102033] focus:outline-hidden focus:ring-2 focus:ring-[#006AC7]/30 cursor-pointer"
          >
            {[2024, 2025, 2026, 2027].map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#006AC7]" />
          <p className="text-xs font-medium">Loading authoritative muster register...</p>
        </div>
      ) : history.length === 0 && summary.totalMarkedDays === 0 ? (
        <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <Clock className="w-6 h-6 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-[#102033]">
            No attendance entries recorded for {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
          </p>
          <p className="text-[11px] text-[#526477] max-w-md mx-auto">
            No daily attendance rolls have been recorded or submitted for this period yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Quick HUD Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
              <span className="text-[10px] font-bold text-[#526477] uppercase block">Total Marked</span>
              <span className="text-lg font-black text-[#102033]">{summary.totalMarkedDays}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Present</span>
              <span className="text-lg font-black text-emerald-700">{summary.presentCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-center">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Late</span>
              <span className="text-lg font-black text-amber-700">{summary.lateCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-center">
              <span className="text-[10px] font-bold text-blue-800 uppercase block">Leaves</span>
              <span className="text-lg font-black text-blue-700">{summary.leaveCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-center">
              <span className="text-[10px] font-bold text-rose-800 uppercase block">Absent</span>
              <span className="text-lg font-black text-rose-700">{summary.absentCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-[#006AC7] uppercase block">Compliance %</span>
              <span className="text-lg font-black text-[#006AC7]">{summary.attendancePercentage}%</span>
            </div>
          </div>

          {/* Daily Muster Strip (Day Chips) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-[#526477] uppercase tracking-wider flex items-center gap-1.5">
                Daily Muster Roll Record
                <span className="text-[10px] font-normal text-slate-400 capitalize">(Click any day to inspect exact timestamps)</span>
              </h4>
              {selectedDayRecord && (
                <button
                  type="button"
                  onClick={() => setSelectedDayRecord(null)}
                  className="text-[11px] font-bold text-[#006AC7] hover:underline flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear Inspection
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {history.map((dayItem, idx) => {
                const badge = getStatusBadge(dayItem.status, dayItem.approvalStatus);
                const dayNum = dayItem.date ? dayItem.date.split('-')[2] : idx + 1;
                const isSelected = selectedDayRecord && selectedDayRecord.date === dayItem.date;
                const submittedTimeStr = formatTimePKT(dayItem.submittedAt);
                const approvedTimeStr = formatTimePKT(dayItem.approvedAt);

                return (
                  <button
                    type="button"
                    key={dayItem.date || idx}
                    onClick={() => setSelectedDayRecord(dayItem)}
                    title={`${dayItem.date}: ${badge.fullName}${submittedTimeStr ? ` • Marked: ${submittedTimeStr} PKT` : ''}${approvedTimeStr ? ` • Approved: ${approvedTimeStr} PKT` : ''}`}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer relative ${badge.className} ${
                      isSelected ? 'ring-2 ring-[#006AC7] shadow-md scale-[1.03]' : 'hover:shadow-xs hover:scale-[1.01]'
                    }`}
                  >
                    <div className="text-[10px] text-slate-500 font-mono font-bold">
                      Day {dayNum}
                    </div>
                    <div className="text-sm font-black mt-0.5">
                      {badge.label}
                    </div>
                    <div className="text-[9px] font-bold uppercase truncate mt-0.5">
                      {badge.fullName}
                    </div>
                    {/* Timestamp Dot Indicator */}
                    {dayItem.submittedAt && (
                      <span
                        className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500"
                        title="Submission timestamp recorded"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Day Inspection Card */}
          {selectedDayRecord && (() => {
            const badge = getStatusBadge(selectedDayRecord.status, selectedDayRecord.approvalStatus);
            const StatusIcon = badge.icon;
            const submittedTimeStr = formatTimePKT(selectedDayRecord.submittedAt);
            const approvedTimeStr = formatTimePKT(selectedDayRecord.approvedAt);
            const rejectedTimeStr = formatTimePKT(selectedDayRecord.rejectedAt);
            const formattedDate = formatDatePKT(selectedDayRecord.date);

            return (
              <div className="mt-4 p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 shadow-xs space-y-4 animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${badge.badgeBg}`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-[#102033]">
                        {formattedDate || selectedDayRecord.date}
                      </h4>
                      <p className="text-xs text-[#526477]">
                        Muster Status: <strong className="font-bold text-[#102033]">{badge.fullName}</strong>
                      </p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto ${badge.badgeBg}`}>
                    {badge.fullName}
                  </span>
                </div>

                {/* Exact Timestamps Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {/* Submission Time */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-[#8094A8] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#006AC7]" /> Submission Time
                    </span>
                    <p className="font-bold text-[#102033] text-sm">
                      {submittedTimeStr ? `${submittedTimeStr} PKT` : 'Authoritative Sheet Record'}
                    </p>
                    <p className="text-[10px] text-[#526477]">
                      {selectedDayRecord.submittedAt
                        ? 'Time attendance was submitted by staff'
                        : 'Recorded on official school physical register'}
                    </p>
                  </div>

                  {/* Approval Time */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-[#8094A8] flex items-center gap-1">
                      <Shield className="w-3 h-3 text-emerald-600" /> Approval Status
                    </span>
                    <p className="font-bold text-[#102033] text-sm">
                      {approvedTimeStr ? `${approvedTimeStr} PKT` : (selectedDayRecord.approvalStatus === 'PENDING_APPROVAL' ? 'Pending Approval' : (rejectedTimeStr ? `Rejected at ${rejectedTimeStr} PKT` : 'Verified on Register'))}
                    </p>
                    <p className="text-[10px] text-[#526477]">
                      {selectedDayRecord.approvedBy?.fullName
                        ? `Approved by ${selectedDayRecord.approvedBy.fullName} (${selectedDayRecord.approvedBy.designation || 'Head Master'})`
                        : (selectedDayRecord.approvalStatus === 'PENDING_APPROVAL' ? 'Awaiting Head Master verification' : 'Verified by institutional authority')}
                    </p>
                  </div>

                  {/* Entry Mode / Origin */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-[#8094A8] flex items-center gap-1">
                      <User className="w-3 h-3 text-purple-600" /> Origin Mode
                    </span>
                    <p className="font-bold text-[#102033] text-sm">
                      {selectedDayRecord.entryMode === 'STAFF_SELF'
                        ? 'Self-Marked at School'
                        : (selectedDayRecord.entryMode === 'SUPER_ADMIN_PANEL'
                          ? 'Super Admin Office Terminal'
                          : (selectedDayRecord.entryMode === 'HM_SELF' ? 'HM Direct Attendance' : 'Institutional Register'))}
                    </p>
                    <p className="text-[10px] text-[#526477]">
                      Institutional operational channel
                    </p>
                  </div>
                </div>

                {/* Late Approval / Rejection Notes Callouts */}
                {selectedDayRecord.lateApprovalReason && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-0.5">
                    <span className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Late Approval Explanation (&gt;5 min delay recorded):
                    </span>
                    <p className="text-amber-800 italic">
                      &ldquo;{selectedDayRecord.lateApprovalReason}&rdquo;
                    </p>
                  </div>
                )}

                {selectedDayRecord.rejectionReason && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-xs text-rose-900 space-y-0.5">
                    <span className="font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      Rejection Justification:
                    </span>
                    <p className="text-rose-800 italic">
                      &ldquo;{selectedDayRecord.rejectionReason}&rdquo;
                    </p>
                  </div>
                )}

                {selectedDayRecord.remarks && !selectedDayRecord.rejectionReason && (
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-800 space-y-0.5">
                    <span className="font-bold">Official Remarks:</span>
                    <p className="text-slate-700 italic">
                      &ldquo;{selectedDayRecord.remarks}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default MonthlyAttendanceCard;
