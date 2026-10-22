import React, { useState } from 'react';
import {
  CalendarCheck2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Loader2,
} from 'lucide-react';

/**
 * 📅 MonthlyAttendanceCard
 * Renders "My Attendance Record — Monthly attendance recorded by your Head Master"
 * from the hand-drawn sketch.
 * Shows monthly muster statistics, punctuality, and daily status chips.
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
    if (onMonthChange) {
      onMonthChange(monthNum, selectedYear);
    }
  };

  const handleYearSelect = (event) => {
    const yearNum = parseInt(event.target.value, 10);
    setSelectedYear(yearNum);
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
    attendancePercentage: 0,
  };

  const history = attendanceData?.history || [];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PRESENT':
        return {
          label: 'P',
          fullName: 'Present',
          className: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        };
      case 'LATE':
        return {
          label: 'L',
          fullName: 'Late Arrival',
          className: 'bg-amber-50 text-amber-800 border-amber-300',
        };
      case 'LEAVE':
        return {
          label: 'LV',
          fullName: 'Casual Leave',
          className: 'bg-blue-50 text-blue-800 border-blue-300',
        };
      case 'ABSENT':
        return {
          label: 'A',
          fullName: 'Absent',
          className: 'bg-rose-50 text-rose-800 border-rose-300',
        };
      default:
        return {
          label: '-',
          fullName: status || 'Unknown',
          className: 'bg-slate-50 text-slate-600 border-slate-200',
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
              Monthly attendance recorded by your Head Master &bull; {schoolName}
            </p>
          </div>
        </div>

        {/* Month & Year Selectors */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={selectedMonth}
            onChange={handleMonthSelect}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-[#102033] focus:outline-hidden focus:ring-2 focus:ring-[#006AC7]/30"
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
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-[#102033] focus:outline-hidden focus:ring-2 focus:ring-[#006AC7]/30"
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
      ) : summary.totalMarkedDays === 0 ? (
        <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <Clock className="w-6 h-6 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-[#102033]">
            No attendance entries recorded for {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
          </p>
          <p className="text-[11px] text-[#526477] max-w-md mx-auto">
            The Head Master has not submitted daily attendance rolls for this period yet, or school sessions were closed.
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
            <h4 className="text-xs font-bold text-[#526477] uppercase tracking-wider mb-2.5">
              Daily Muster Roll Record
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {history.map((dayItem, idx) => {
                const badge = getStatusBadge(dayItem.status);
                const dayNum = dayItem.date ? dayItem.date.split('-')[2] : idx + 1;

                return (
                  <div
                    key={idx}
                    title={`${dayItem.date}: ${badge.fullName}${dayItem.remarks ? ` (${dayItem.remarks})` : ''}`}
                    className={`p-2 rounded-xl border text-center transition-all ${badge.className}`}
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
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyAttendanceCard;
