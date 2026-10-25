import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Building,
  GraduationCap,
  FileSpreadsheet,
  Info,
  ShieldAlert,
  Loader2,
  Check,
  X,
  PlusCircle,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorUtils.js';
import {
  fetchAttendanceRegister,
  clearMissedAttendance,
  selectAttendanceRegister,
  selectAttendanceRegisterLoading,
  selectAttendanceRegisterError,
  selectClearMissedSubmitting,
} from '../../store/slices/teacherSlice.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * 📖 Smart Attendance Register
 * Digital reproduction of the official Physical School Attendance Register
 * (Sindh Municipal Education Department / DMC Liaquatabad Town standard).
 */
export const SmartAttendanceRegister = ({
  sectionId: initialSectionId = '',
  sections = [],
  user = {},
  canClearMissed = false,
  onSectionChange = null,
}) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [activeSectionId, setActiveSectionId] = useState(initialSectionId);

  const dispatch = useDispatch();
  const registerData = useSelector(selectAttendanceRegister);
  const loading = useSelector(selectAttendanceRegisterLoading);
  const error = useSelector(selectAttendanceRegisterError);
  const clearanceSubmitting = useSelector(selectClearMissedSubmitting);

  // HM Missed Clearance Modal State
  const [missedClearanceModalOpen, setMissedClearanceModalOpen] = useState(false);
  const [selectedMissedDate, setSelectedMissedDate] = useState(null);
  const [clearanceReason, setClearanceReason] = useState('');
  const [clearanceRoster, setClearanceRoster] = useState([]);

  // Sync sectionId from props
  useEffect(() => {
    if (initialSectionId) {
      setActiveSectionId(initialSectionId);
    } else if (sections.length > 0 && !activeSectionId) {
      setActiveSectionId(String(sections[0]._id));
    }
  }, [initialSectionId, sections, activeSectionId]);

  // Fetch register data through Redux thunk
  const fetchRegister = useCallback(() => {
    if (!activeSectionId) return;
    dispatch(fetchAttendanceRegister({
      sectionId: activeSectionId,
      month: selectedMonth,
      year: selectedYear,
    }));
  }, [dispatch, activeSectionId, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchRegister();
  }, [fetchRegister]);

  // Section switcher handler
  const handleSectionSelect = (newSectionId) => {
    setActiveSectionId(newSectionId);
    if (onSectionChange) {
      onSectionChange(newSectionId);
    }
  };

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  // Open missed clearance modal for a specific past unrecorded day
  const handleOpenMissedClearance = (calDay) => {
    if (!canClearMissed) return;
    if (calDay.status !== 'NOT_TAKEN') return;

    setSelectedMissedDate(calDay);
    setClearanceReason('');
    if (registerData?.students) {
      setClearanceRoster(
        registerData.students.map((student) => ({
          studentProfileId: student.userId,
          fullName: student.fullName,
          grNumber: student.grNumber,
          rollNumber: student.rollNumber,
          status: 'PRESENT',
        }))
      );
    }
    setMissedClearanceModalOpen(true);
  };

  const handleToggleClearanceStatus = (studentProfileId, status) => {
    setClearanceRoster((prev) =>
      prev.map((student) =>
        student.studentProfileId === studentProfileId ? { ...student, status } : student
      )
    );
  };

  // Submit missed attendance clearance
  const handleSubmitMissedClearance = async () => {
    if (!clearanceReason || clearanceReason.trim().length < 10) {
      toast.error('A mandatory justification reason (minimum 10 characters) is required.');
      return;
    }

    try {
      const absentStudentProfileIds = clearanceRoster
        .filter((student) => student.status === 'ABSENT')
        .map((student) => student.studentProfileId);
      const leaveStudentProfileIds = clearanceRoster
        .filter((student) => student.status === 'LEAVE')
        .map((student) => student.studentProfileId);

      const payload = {
        sectionId: activeSectionId,
        date: selectedMissedDate.date,
        absentStudentProfileIds,
        leaveStudentProfileIds,
        records: clearanceRoster.map((student) => ({
          studentProfileId: student.studentProfileId,
          status: student.status,
        })),
        reason: clearanceReason.trim(),
      };

      const resultAction = await dispatch(clearMissedAttendance(payload));
      if (clearMissedAttendance.fulfilled.match(resultAction)) {
        toast.success(`Missed attendance for ${selectedMissedDate.date} cleared successfully!`);
        setMissedClearanceModalOpen(false);
        fetchRegister();
      } else {
        toast.error(resultAction.payload || 'Failed to clear missed attendance.');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to clear missed attendance.'));
    }
  };

  // Handle print mode lifecycle via beforeprint and afterprint
  useEffect(() => {
    const handleBeforePrint = () => {
      document.body.classList.add('print-register-mode');
    };
    const handleAfterPrint = () => {
      document.body.classList.remove('print-register-mode');
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      document.body.classList.remove('print-register-mode');
    };
  }, []);

  // Print register with dedicated Legal Landscape print mode
  const handlePrint = () => {
    document.body.classList.add('print-register-mode');
    setTimeout(() => {
      window.print();
    }, 80);
  };

  // Derive register columns & summaries
  const calendarDays = useMemo(() => registerData?.calendarDays || [], [registerData]);
  const students = useMemo(() => registerData?.students || [], [registerData]);
  const schoolName = registerData?.school?.name || user?.schoolId?.name || 'School';
  const schoolCode = registerData?.school?.schoolCode || user?.schoolId?.schoolCode || 'LT';
  const sectionName = registerData?.section?.name || 'Section';
  const className = registerData?.section?.class?.name || 'Class';

  // Compute daily totals for the bottom summary row
  const dailyTotals = useMemo(() => {
    if (!calendarDays.length || !students.length) return {};

    const totals = {};
    for (const calDay of calendarDays) {
      const dateStr = calDay.date;
      let present = 0;
      let absent = 0;
      let leave = 0;

      for (const student of students) {
        const st = student.attendance?.[dateStr];
        if (st === 'PRESENT') present++;
        else if (st === 'ABSENT') absent++;
        else if (st === 'LEAVE') leave++;
      }

      totals[dateStr] = { present, absent, leave };
    }
    return totals;
  }, [calendarDays, students]);

  return (
    <div className="space-y-6 smart-register-root">
      {/* ─── Top Controls & Header ─────────────────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-black text-[#102033] tracking-tight">
                  Smart Monthly Attendance Register
                </h2>
                <p className="text-xs text-[#526477]">
                  Authoritative monthly P/A/L ledger · {schoolName} ({schoolCode}) · {className} - {sectionName}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons & Selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Section Switcher (if multiple available) */}
            {sections.length > 1 && (
              <select
                value={activeSectionId}
                onChange={(e) => handleSectionSelect(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-[#102033] bg-white focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
              >
                {sections.map((sec) => (
                  <option key={String(sec._id)} value={String(sec._id)}>
                    {sec.class?.name} - {sec.name || 'Whole Class'}
                  </option>
                ))}
              </select>
            )}

            {/* Month & Year Navigator */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-lg text-slate-600 hover:text-[#102033] hover:bg-white transition cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-black text-[#102033]">
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-lg text-slate-600 hover:text-[#102033] hover:bg-white transition cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={fetchRegister}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-[#102033] hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
              title="Refresh Register Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#006AC7]' : ''}`} />
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="Print Physical-Register Format"
            >
              <Printer className="w-4 h-4" />
              Print Register
            </button>
          </div>
        </div>

        {/* Register Summary KPIs */}
        {registerData && (
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 pt-3 border-t border-slate-100">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
              <span className="text-[10px] font-bold text-[#8094A8] uppercase block">Total Students</span>
              <span className="text-base font-black text-[#102033]">{registerData.totalStudents}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-center">
              <span className="text-[10px] font-bold text-[#006AC7] uppercase block">Total Work Days</span>
              <span className="text-base font-black text-[#006AC7]">{registerData.totalWorkingDays}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Recorded Days</span>
              <span className="text-base font-black text-emerald-700">{registerData.recordedWorkingDays}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Missed Days</span>
              <span className="text-base font-black text-amber-700">{registerData.missedWorkingDays}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-center">
              <span className="text-[10px] font-bold text-purple-800 uppercase block">Holidays</span>
              <span className="text-base font-black text-purple-700">{registerData.totalHolidays + registerData.totalSundays}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
              <span className="text-[10px] font-bold text-indigo-800 uppercase block">Class Avg %</span>
              <span className="text-base font-black text-indigo-700">{registerData.classAggregatePct}</span>
            </div>
          </div>
        )}
      </div>

      {/* Legal Landscape Print Configuration */}
      <style>{`
        @media print {
          @page {
            size: legal landscape;
            margin: 6mm 5mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
          }
          .printable-attendance-register {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ─── Official Physical Register Header (Printed and Visual) ─────────── */}
      <div className="printable-attendance-register bg-white border border-slate-300 rounded-2xl shadow-sm overflow-hidden print:border-none print:shadow-none print:m-0 print:p-0">
        {/* Printable Official Government Header */}
        <div className="p-6 print:py-2 print:px-4 border-b border-slate-300 bg-linear-to-r from-slate-50 via-white to-slate-50 print:bg-white text-center space-y-1 print:space-y-0.5">
          <p className="text-[11px] print:text-[9.5px] font-bold uppercase tracking-widest text-slate-500">
            Education Department · Liaquatabad Town Centre (DMC) · Karachi
          </p>
          <h1 className="text-lg sm:text-xl print:text-base font-black text-[#102033] uppercase tracking-wide">
            {schoolName}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-4 print:gap-3 text-xs print:text-[10px] font-semibold text-slate-700 pt-1 print:pt-0.5">
            <span><strong>School Code:</strong> {schoolCode}</span>
            <span>•</span>
            <span><strong>Standard / Class:</strong> {className}</span>
            <span>•</span>
            <span><strong>Section:</strong> {sectionName}</span>
            <span>•</span>
            <span><strong>Month:</strong> {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</span>
          </div>
        </div>

        {/* ─── Register Table Container ─────────────────────────────────────── */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-[#006AC7]" />
            <p className="text-xs font-bold">Assembling monthly attendance ledger…</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <ShieldAlert className="w-8 h-8 text-rose-600 mx-auto" />
            <p className="text-sm font-bold text-rose-700">{error}</p>
            <button
              type="button"
              onClick={fetchRegister}
              className="px-4 py-2 rounded-xl bg-[#006AC7] text-white text-xs font-bold cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No active students enrolled in this section for the selected month.
          </div>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-center text-[11px] border-collapse min-w-[1200px]">
              {/* Table Header */}
              <thead>
                <tr className="bg-slate-100 text-[#102033] border-b border-slate-300 font-bold">
                  {/* Sticky Pinned Identity Columns */}
                  <th className="py-2.5 px-2 w-10 border-r border-slate-300 sticky left-0 z-20 bg-slate-100 text-center">
                    Sr.
                  </th>
                  <th className="py-2.5 px-2 w-14 border-r border-slate-300 sticky left-10 z-20 bg-slate-100 text-center">
                    G.R.
                  </th>
                  <th className="py-2.5 px-3 min-w-[170px] max-w-[200px] border-r border-slate-300 sticky left-24 z-20 bg-slate-100 text-left shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                    Student's Name
                  </th>

                  {/* Day Columns 1 to N */}
                  {calendarDays.map((calDay) => {
                    const isSunday = calDay.dayOfWeek === 0;
                    const isSaturday = calDay.dayOfWeek === 6;
                    const isWeeklyOff = calDay.dayType === 'WEEKLY_OFF' || calDay.isWeeklyOff;
                    const isHoliday = calDay.dayType === 'HOLIDAY';
                    const isMissed = calDay.status === 'NOT_TAKEN';
                    const isToday = calDay.isToday;

                    let bgClass = 'bg-slate-50 text-slate-700';
                    if (isHoliday) {
                      bgClass = 'bg-rose-100 text-rose-950 border-r border-rose-300';
                    } else if (isSunday) {
                      bgClass = 'bg-amber-100 text-amber-950 border-r border-amber-300';
                    } else if (isWeeklyOff || isSaturday) {
                      bgClass = 'bg-orange-100 text-orange-950 border-r border-orange-300';
                    } else if (isMissed) {
                      bgClass = 'bg-amber-50 text-amber-900 border-amber-300';
                    } else if (isToday) {
                      bgClass = 'bg-blue-100 text-[#006AC7] font-black ring-1 ring-[#006AC7]';
                    }

                    return (
                      <th
                        key={calDay.date}
                        className={`py-1.5 px-0.5 w-8 min-w-8 border-r border-slate-200 transition-colors ${bgClass}`}
                        title={`${calDay.date} (${calDay.dayNameFull}) — ${calDay.closureLabel || calDay.status}`}
                      >
                        <div className="text-[12px] font-black leading-tight">{String(calDay.dayNumber).padStart(2, '0')}</div>
                        <div className="text-[9px] uppercase tracking-tighter opacity-80">{calDay.dayName}</div>
                        {isMissed && canClearMissed && (
                          <button
                            type="button"
                            onClick={() => handleOpenMissedClearance(calDay)}
                            className="mt-0.5 text-[8px] font-black px-1 rounded bg-amber-600 text-white hover:bg-amber-700 cursor-pointer print:hidden block mx-auto shadow-xs"
                            title="Head Master: Click to clear missed attendance"
                          >
                            Clear
                          </button>
                        )}
                      </th>
                    );
                  })}

                  {/* Sticky Right Summary Columns */}
                  <th className="py-2.5 px-1 w-9 min-w-9 border-r border-slate-300 bg-emerald-100 text-emerald-950 sticky right-[166px] z-20 shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                    P
                  </th>
                  <th className="py-2.5 px-1 w-9 min-w-9 border-r border-slate-300 bg-rose-100 text-rose-950 sticky right-[130px] z-20">
                    A
                  </th>
                  <th className="py-2.5 px-1 w-9 min-w-9 border-r border-slate-300 bg-amber-100 text-amber-950 sticky right-[94px] z-20">
                    L
                  </th>
                  <th className="py-2.5 px-1.5 w-13 min-w-13 border-r border-slate-300 bg-slate-200 text-[#102033] sticky right-[42px] z-20">
                    Total
                  </th>
                  <th className="py-2.5 px-1.5 w-11 min-w-11 bg-indigo-100 text-indigo-950 sticky right-0 z-20">
                    %
                  </th>
                </tr>
              </thead>

              {/* Table Body: Student Rows */}
              <tbody className="divide-y divide-slate-200 bg-white">
                {students.map((student, studentIndex) => {
                  const isEven = studentIndex % 2 === 0;
                  const rowBg = isEven ? 'bg-white' : 'bg-slate-50/50';

                  return (
                    <tr key={String(student.userId)} className={`hover:bg-blue-50/40 transition ${rowBg}`}>
                      {/* Identity: Sr. No */}
                      <td className={`py-2 px-1 text-center font-bold text-slate-500 border-r border-slate-300 sticky left-0 z-10 ${rowBg}`}>
                        {student.srNo}
                      </td>

                      {/* Identity: G.R. Number */}
                      <td className={`py-2 px-1 text-center font-mono font-bold text-slate-700 border-r border-slate-300 sticky left-10 z-10 ${rowBg}`}>
                        {student.grNumber || '—'}
                      </td>

                      {/* Identity: Full Name */}
                      <td className={`py-2 px-3 text-left font-bold text-[#102033] truncate border-r border-slate-300 sticky left-24 z-10 ${rowBg} shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]`}>
                        {student.fullName}
                      </td>

                      {/* Daily Attendance Cells */}
                      {calendarDays.map((calDay) => {
                        const dateStr = calDay.date;
                        const status = student.attendance?.[dateStr];
                        const isClosed = calDay.isClosed;
                        const hasRecordedAttendance = Boolean(calDay.hasRecordedAttendance || calDay.isAttendanceTaken);

                        // If this day is an official non-working closure (Sunday, Saturday weekly off, Gazetted Holiday)
                        // and has NO recorded attendance, render a continuous vertical column band spanning all student rows!
                        if (isClosed && !hasRecordedAttendance) {
                          // Only render the <td> on the first student row (studentIndex === 0) with rowSpan!
                          if (studentIndex === 0) {
                            const isHoliday = calDay.dayType === 'HOLIDAY';
                            const isSunday = calDay.dayOfWeek === 0;
                            const isSaturday = calDay.dayOfWeek === 6;

                            let bandBg = 'bg-amber-100/90 text-amber-950 border-r border-amber-300';
                            let bandText = 'SUNDAY';

                            if (isHoliday) {
                              bandBg = 'bg-rose-100/90 text-rose-950 border-r border-rose-300';
                              bandText = (calDay.holidayTitle || calDay.closureLabel || 'HOLIDAY').toUpperCase();
                            } else if (isSunday) {
                              bandBg = 'bg-amber-100/90 text-amber-950 border-r border-amber-300';
                              bandText = 'SUNDAY';
                            } else {
                              // Saturday or custom weekly off
                              bandBg = 'bg-orange-100/90 text-orange-950 border-r border-orange-300';
                              bandText = calDay.closureLabel ? calDay.closureLabel.toUpperCase() : (isSaturday ? 'SATURDAY' : 'OFF DAY');
                            }

                            const fontClass = bandText.length > 20
                              ? 'text-[8.5px] tracking-wider'
                              : bandText.length > 14
                                ? 'text-[9.5px] tracking-wide'
                                : 'text-[11px] tracking-widest';

                            return (
                              <td
                                key={dateStr}
                                rowSpan={students.length}
                                className={`register-closure-band select-none ${bandBg}`}
                                title={`${calDay.date} (${calDay.dayNameFull}) — ${calDay.closureLabel || calDay.status}`}
                              >
                                <div className="h-full min-h-[140px] print:min-h-0 print:py-1 flex items-center justify-center py-4 px-0.5">
                                  <span className={`register-vertical-band font-black ${fontClass}`}>
                                    {bandText}
                                  </span>
                                </div>
                              </td>
                            );
                          }

                          // On subsequent student rows (studentIndex > 0), return null because the rowSpan cell covers it!
                          return null;
                        }

                        // Otherwise, render normal individual student cell (working days, or closures with recorded attendance)
                        const isMissed = calDay.status === 'NOT_TAKEN';
                        const isFuture = calDay.isFutureDate;

                        let cellContent = '—';
                        let cellClass = 'text-slate-300';

                        if (status === 'PRESENT') {
                          cellContent = 'P';
                          cellClass = 'text-emerald-700 font-black bg-emerald-50/40';
                        } else if (status === 'ABSENT') {
                          cellContent = 'A';
                          cellClass = 'text-rose-700 font-black bg-rose-50/60';
                        } else if (status === 'LEAVE') {
                          cellContent = 'L';
                          cellClass = 'text-amber-700 font-black bg-amber-50/40';
                        } else if (isMissed) {
                          cellContent = '—';
                          cellClass = 'text-amber-600/80 font-bold bg-amber-50/40';
                        } else if (isFuture) {
                          cellContent = '·';
                          cellClass = 'text-slate-200';
                        }

                        return (
                          <td
                            key={dateStr}
                            className={`py-2 px-0.5 border-r border-slate-200 text-center font-mono ${cellClass}`}
                            title={`${student.fullName} on ${dateStr}: ${status || calDay.closureLabel || calDay.status}`}
                          >
                            {cellContent}
                          </td>
                        );
                      })}

                      {/* Summary Columns */}
                      <td className="w-9 min-w-9 py-2 px-1 text-center font-black text-emerald-800 border-r border-slate-300 sticky right-[166px] z-10 bg-emerald-50 shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                        {student.totals.P}
                      </td>
                      <td className="w-9 min-w-9 py-2 px-1 text-center font-black text-rose-800 border-r border-slate-300 sticky right-[130px] z-10 bg-rose-50">
                        {student.totals.A}
                      </td>
                      <td className="w-9 min-w-9 py-2 px-1 text-center font-black text-amber-800 border-r border-slate-300 sticky right-[94px] z-10 bg-amber-50">
                        {student.totals.L}
                      </td>
                      <td className="w-13 min-w-13 py-2 px-1 text-center font-bold text-[#102033] border-r border-slate-300 sticky right-[42px] z-10 bg-slate-100">
                        {student.totals.P} / {student.workingDaysRecorded}
                      </td>
                      <td className="w-11 min-w-11 py-2 px-1 text-center font-black text-indigo-700 sticky right-0 z-10 bg-indigo-50">
                        {student.attendancePercentage}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Table Footer: Daily Attendance Totals */}
              <tfoot>
                <tr className="bg-slate-100 font-black text-[#102033] border-t-2 border-slate-300">
                  <td colSpan={3} className="py-2.5 px-3 text-right border-r border-slate-300 sticky left-0 z-20 bg-slate-100">
                    Total Present Students:
                  </td>
                  {calendarDays.map((calDay) => {
                    const t = dailyTotals[calDay.date];
                    const isClosed = calDay.isClosed;
                    return (
                      <td
                        key={calDay.date}
                        className={`py-2.5 px-0.5 border-r border-slate-200 text-center font-mono ${isClosed ? 'text-slate-400 bg-slate-100' : 'text-emerald-700 font-bold bg-emerald-50/30'
                          }`}
                      >
                        {isClosed ? '—' : t?.present ?? 0}
                      </td>
                    );
                  })}
                  <td colSpan={5} className="py-2.5 px-2 bg-slate-100 sticky right-0 z-20 text-center text-xs">
                    Class Avg: <strong className="text-indigo-700">{registerData?.classAggregatePct || 'N/A'}</strong>
                  </td>
                </tr>

                <tr className="bg-slate-50 font-bold text-slate-600 border-t border-slate-200">
                  <td colSpan={3} className="py-2 px-3 text-right border-r border-slate-300 sticky left-0 z-20 bg-slate-50">
                    Total Absent Students:
                  </td>
                  {calendarDays.map((calDay) => {
                    const t = dailyTotals[calDay.date];
                    const isClosed = calDay.isClosed;
                    return (
                      <td
                        key={calDay.date}
                        className={`py-2 px-0.5 border-r border-slate-200 text-center font-mono ${isClosed ? 'text-slate-300 bg-slate-50' : 'text-rose-700 bg-rose-50/30'
                          }`}
                      >
                        {isClosed ? '—' : t?.absent ?? 0}
                      </td>
                    );
                  })}
                  <td colSpan={5} className="bg-slate-50 sticky right-0 z-20"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ─── Official Physical Register Footer / Statistics Block ──────────── */}
        <div className="p-6 print:p-2.5 bg-slate-50 print:bg-white border-t border-slate-300 text-xs text-slate-700 space-y-6 print:space-y-2">
          {/* Enrollment Reconciliation Box (Image 2 Section - 2 Columns) */}
          <div className="p-4 print:p-2 rounded-xl print:rounded-lg bg-white border border-slate-300 space-y-2 print:space-y-1">
            <h4 className="font-black text-[#102033] uppercase text-[11px] print:text-[10px] tracking-wider border-b border-slate-200 pb-1.5 print:pb-1">
              Monthly Enrollment & Attendance Statistics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-8 gap-y-1.5 print:gap-x-8 print:gap-y-0.5 text-[11px] print:text-[9.5px]">
              {/* Column 1: Enrollment Counts (Items 1 to 4) */}
              <ul className="space-y-1.5 print:space-y-0.5">
                <li className="flex justify-between items-center py-0.5 border-b border-slate-100">
                  <span>1. Number of students on roll at start of month:</span>
                  <strong className="font-mono text-slate-900">{students.length}</strong>
                </li>
                <li className="flex justify-between items-center py-0.5 border-b border-slate-100">
                  <span>2. Number of students admitted during the month:</span>
                  <strong className="font-mono text-slate-900">0</strong>
                </li>
                <li className="flex justify-between items-center py-0.5 border-b border-slate-100">
                  <span>3. Number of students struck off / transferred:</span>
                  <strong className="font-mono text-slate-900">0</strong>
                </li>
                <li className="flex justify-between items-center py-0.5">
                  <span>4. Number of students on roll at end of month:</span>
                  <strong className="font-mono text-slate-900">{students.length}</strong>
                </li>
              </ul>

              {/* Column 2: Working Days & Aggregate Percentages (Items 5 to 8) */}
              <ul className="space-y-1.5 print:space-y-0.5">
                <li className="flex justify-between items-center py-0.5 border-b border-slate-100">
                  <span>5. Total days of school work during month:</span>
                  <strong className="font-mono text-slate-900">{registerData?.totalWorkingDays || 0}</strong>
                </li>
                <li className="flex justify-between items-center py-0.5 border-b border-slate-100">
                  <span>6. Total days attendance officially recorded:</span>
                  <strong className="font-mono text-emerald-700 font-bold">{registerData?.recordedWorkingDays || 0}</strong>
                </li>
                <li className="flex justify-between items-center py-0.5 border-b border-slate-100">
                  <span>7. Unrecorded working days (Not Taken):</span>
                  <strong className="font-mono text-amber-700 font-bold">{registerData?.missedWorkingDays || 0}</strong>
                </li>
                <li className="flex justify-between items-center py-0.5">
                  <span>8. Monthly class aggregate attendance:</span>
                  <strong className="font-mono text-indigo-700 font-bold">{registerData?.classAggregatePct || 'N/A'}</strong>
                </li>
              </ul>
            </div>
          </div>

          {/* Attendance Legend & Municipal Instructions (Screen Only, Hidden in Print) */}
          <div className="p-4 rounded-xl bg-white border border-slate-300 space-y-2 print:hidden">
            <h4 className="font-black text-[#102033] uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1.5">
              Register Code Legend & Legal Instructions
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded flex items-center justify-center font-black bg-emerald-100 text-emerald-800">P</span>
                <span>Present</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded flex items-center justify-center font-black bg-rose-100 text-rose-800">A</span>
                <span>Absent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded flex items-center justify-center font-black bg-amber-100 text-amber-800">L</span>
                <span>Approved Leave</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded flex items-center justify-center font-black bg-amber-200 text-amber-900">S</span>
                <span>Sunday Weekly Off</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded flex items-center justify-center font-black bg-orange-200 text-orange-900">Sat</span>
                <span>Saturday Weekly Off</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded flex items-center justify-center font-black bg-rose-200 text-rose-900">H</span>
                <span>Gazetted Holiday</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded flex items-center justify-center font-black bg-slate-100 text-slate-500">—</span>
                <span>Attendance Not Taken</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic pt-2 border-t border-slate-100">
              Rule 14: All unrecorded working days are explicitly designated as "Attendance Not Taken". Students are never inferred absent. Retrospective clearance requires recorded Head Master justification under municipal ordinance.
            </p>
          </div>

          {/* Official Signatures Block */}
          <div className="grid grid-cols-3 gap-6 pt-6 print:pt-3 text-center text-xs print:text-[10px] font-bold text-slate-600 print:text-slate-800">
            <div className="space-y-8 print:space-y-4">
              <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
              <p>Signature of Class Teacher</p>
            </div>
            <div className="space-y-8 print:space-y-4">
              <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
              <p>Signature of Head Master / Head Mistress</p>
            </div>
            <div className="space-y-8 print:space-y-4">
              <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
              <p>Signature Of The<br />Deputy Director Of Education (DDE)</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Head Master Missed Attendance Clearance Modal ─────────────────── */}
      {missedClearanceModalOpen && selectedMissedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-amber-50/70 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-amber-950 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Head Master Authorized Missed-Attendance Clearance
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Clearing unrecorded attendance for past working day: <strong>{selectedMissedDate.date} ({selectedMissedDate.dayNameFull})</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMissedClearanceModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Mandatory Reason Input */}
              <div className="space-y-1">
                <label className="font-bold text-[#102033] flex items-center gap-1.5">
                  <span>Mandatory Administrative Justification Reason:</span>
                  <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  value={clearanceReason}
                  onChange={(e) => setClearanceReason(e.target.value)}
                  placeholder="State official reason for late clearance (e.g., Severe local power outage and internet disruption on 12th Oct prevented timely register submission by class teacher)..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Must be a formal administrative justification</span>
                  <span className={clearanceReason.trim().length >= 10 ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                    {clearanceReason.trim().length}/10 chars minimum
                  </span>
                </div>
              </div>

              {/* Student Exceptions List */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#102033]">
                    Student Roster ({clearanceRoster.length} Enrolled)
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    All default to <strong>Present (P)</strong>. Mark exceptions below.
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                  {clearanceRoster.map((student, idx) => (
                    <div
                      key={String(student.studentProfileId)}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 text-center font-mono font-bold text-slate-400">
                          #{student.rollNumber || idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-[#102033]">{student.fullName}</p>
                          <p className="text-[10px] text-slate-400">GR: {student.grNumber || '—'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleToggleClearanceStatus(student.studentProfileId, 'PRESENT')}
                          className={`px-2.5 py-1 rounded text-xs font-black transition cursor-pointer ${student.status === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                        >
                          P
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleClearanceStatus(student.studentProfileId, 'ABSENT')}
                          className={`px-2.5 py-1 rounded text-xs font-black transition cursor-pointer ${student.status === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                            }`}
                        >
                          A
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleClearanceStatus(student.studentProfileId, 'LEAVE')}
                          className={`px-2.5 py-1 rounded text-xs font-black transition cursor-pointer ${student.status === 'LEAVE'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                            }`}
                        >
                          L
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Action will be permanently recorded in municipal audit logs.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMissedClearanceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitMissedClearance}
                  disabled={clearanceSubmitting || clearanceReason.trim().length < 10}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {clearanceSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {clearanceSubmitting ? 'Clearing…' : 'Authorize & Clear Missed Attendance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartAttendanceRegister;
