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
  UserX,
  MessageSquare,
  LayoutGrid,
  Table as TableIcon,
  Search,
  ChevronDown,
  ChevronUp,
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
  classes = [],
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

  // Absence & Leave Reason Modal State
  const [selectedRemarkDetail, setSelectedRemarkDetail] = useState(null);

  // Mobile View & Filter State: 'CARDS' (mobile roster card view) vs 'TABLE' (official ledger table)
  const [displayMode, setDisplayMode] = useState('CARDS');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  // Keyboard shortcut listener to close reason modal on Escape
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedRemarkDetail(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync sectionId from props
  useEffect(() => {
    if (initialSectionId) {
      setActiveSectionId(initialSectionId);
    } else if (sections.length > 0) {
      const exists = sections.some((s) => String(s._id) === String(activeSectionId));
      if (!activeSectionId || !exists) {
        setActiveSectionId(String(sections[0]._id));
      }
    }
  }, [initialSectionId, sections, activeSectionId]);

  // Section switcher handler
  const handleSectionSelect = (newSectionId) => {
    setActiveSectionId(newSectionId);
    if (onSectionChange) {
      onSectionChange(newSectionId);
    }
  };

  // Available classes: provided prop or derived from sections
  const availableClasses = useMemo(() => {
    if (classes && classes.length > 0) {
      return [...classes].sort((a, b) => (Number(a.numericGrade) || 0) - (Number(b.numericGrade) || 0));
    }
    const classMap = new Map();
    for (const sec of sections) {
      const cls = sec.classId || sec.class;
      if (cls && typeof cls === 'object' && cls._id) {
        if (!classMap.has(String(cls._id))) {
          classMap.set(String(cls._id), cls);
        }
      }
    }
    return Array.from(classMap.values()).sort((a, b) => (Number(a.numericGrade) || 0) - (Number(b.numericGrade) || 0));
  }, [classes, sections]);

  // Currently selected section object
  const currentSection = useMemo(() => {
    return sections.find((sec) => String(sec._id) === String(activeSectionId)) || (sections.length > 0 ? sections[0] : null);
  }, [sections, activeSectionId]);

  // Active class ID derived from currently active section or first available class
  const activeClassId = useMemo(() => {
    if (currentSection) {
      const cls = currentSection.classId || currentSection.class;
      if (cls) return String(cls._id || cls);
    }
    if (availableClasses.length > 0) return String(availableClasses[0]._id);
    return '';
  }, [currentSection, availableClasses]);

  // Sections filtered for active class
  const sectionsForActiveClass = useMemo(() => {
    if (!activeClassId) return sections;
    const filtered = sections.filter((sec) => {
      const cls = sec.classId || sec.class;
      const cId = cls ? String(cls._id || cls) : '';
      return cId === String(activeClassId);
    });
    return filtered.length > 0 ? filtered : sections;
  }, [sections, activeClassId]);

  // When class changes, switch to the first section of that class
  const handleClassSelect = (newClassId) => {
    const matchingSections = sections.filter((sec) => {
      const cls = sec.classId || sec.class;
      return String(cls?._id || cls) === String(newClassId);
    });
    if (matchingSections.length > 0) {
      handleSectionSelect(String(matchingSections[0]._id));
    }
  };

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

  // Filtered student list for responsive card search & filtering
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase().trim();
    return students.filter((student) =>
      student.fullName?.toLowerCase().includes(query) ||
      String(student.grNumber || '').toLowerCase().includes(query) ||
      String(student.rollNumber || '').toLowerCase().includes(query) ||
      String(student.srNo || '').includes(query)
    );
  }, [students, searchQuery]);

  const schoolName = registerData?.school?.name || user?.schoolId?.name || 'School';
  const schoolCode = registerData?.school?.schoolCode || user?.schoolId?.schoolCode || 'LT';
  const sectionName = registerData?.section?.name || 'Section';
  const className = registerData?.section?.classId?.name || registerData?.section?.class?.name || 'Class';

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
            {/* Class & Section Selectors */}
            {availableClasses.length > 1 && (
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] font-bold text-[#526477] uppercase tracking-wider hidden sm:inline">
                  Class:
                </label>
                <select
                  value={activeClassId}
                  onChange={(e) => handleClassSelect(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-[#102033] bg-white focus:outline-none focus:ring-2 focus:ring-[#4B7F3A] cursor-pointer"
                  title="Select Class"
                >
                  {availableClasses.map((cls) => (
                    <option key={String(cls._id)} value={String(cls._id)}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {sections.length > 1 && (
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] font-bold text-[#526477] uppercase tracking-wider hidden sm:inline">
                  Section:
                </label>
                <select
                  value={activeSectionId}
                  onChange={(e) => handleSectionSelect(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-[#102033] bg-white focus:outline-none focus:ring-2 focus:ring-[#4B7F3A] cursor-pointer"
                  title="Select Section"
                >
                  {sectionsForActiveClass.map((sec) => (
                    <option key={String(sec._id)} value={String(sec._id)}>
                      {availableClasses.length <= 1
                        ? `${sec.classId?.name || sec.class?.name || ''} - ${sec.name || 'Section'}`.replace(/^[ -]+/, '')
                        : sec.name || 'Whole Class'}
                    </option>
                  ))}
                </select>
              </div>
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
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#4B7F3A]' : ''}`} />
            </button>

            {/* View Mode Toggle: Cards vs Ledger Table */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 print:hidden">
              <button
                type="button"
                onClick={() => setDisplayMode('CARDS')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  displayMode === 'CARDS'
                    ? 'bg-white text-[#38662D] shadow-xs border border-[#C9DFBC]'
                    : 'text-[#526477] hover:text-[#102033]'
                }`}
                title="Student Roster Card View (Best for Mobile)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('TABLE')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  displayMode === 'TABLE'
                    ? 'bg-white text-[#38662D] shadow-xs border border-[#C9DFBC]'
                    : 'text-[#526477] hover:text-[#102033]'
                }`}
                title="Full Matrix Attendance Ledger (Official Table)"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Ledger</span>
              </button>
            </div>

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
            <div className="p-2.5 rounded-xl bg-[#F2F8EF] border border-[#C9DFBC] text-center">
              <span className="text-[10px] font-bold text-[#38662D] uppercase block">Total Work Days</span>
              <span className="text-base font-black text-[#38662D]">{registerData.totalWorkingDays}</span>
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
            <Loader2 className="w-8 h-8 animate-spin text-[#4B7F3A]" />
            <p className="text-xs font-bold">Assembling monthly attendance ledger…</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <ShieldAlert className="w-8 h-8 text-rose-600 mx-auto" />
            <p className="text-sm font-bold text-rose-700">{error}</p>
            <button
              type="button"
              onClick={fetchRegister}
              className="px-4 py-2 rounded-xl bg-[#4B7F3A] hover:bg-[#38662D] text-white text-xs font-bold cursor-pointer transition shadow-xs"
            >
              Try Again
            </button>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No active students enrolled in this section for the selected month.
          </div>
        ) : (
          <>
            {/* ─── Responsive View 1: Mobile-Optimized Roster Cards View (Active when displayMode === 'CARDS') ─── */}
            <div className={`p-4 space-y-4 print:hidden ${displayMode === 'CARDS' ? 'block' : 'hidden'}`}>
              {/* Quick Search & Summary Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search student by name, roll #, or GR #..."
                    className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-[#102033] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4B7F3A] font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-slate-500 font-medium">
                  <span>Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> students</span>
                  <button
                    type="button"
                    onClick={() => setDisplayMode('TABLE')}
                    className="text-xs font-bold text-[#38662D] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <TableIcon className="w-3.5 h-3.5" /> Switch to Full Ledger
                  </button>
                </div>
              </div>

              {/* Cards List */}
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No students match "{searchQuery}".
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredStudents.map((student) => {
                    const pct = parseFloat(student.attendancePercentage || 0);
                    const isGood = pct >= 75;
                    const isAverage = pct >= 60 && pct < 75;

                    const badgeClass = isGood
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : isAverage
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200';

                    const progressColor = isGood ? 'bg-emerald-500' : isAverage ? 'bg-amber-500' : 'bg-rose-500';
                    const isExpanded = expandedStudentId === student.userId;

                    return (
                      <div
                        key={String(student.userId)}
                        className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-3"
                      >
                        {/* Top: Identity & Attendance % */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-[#F2F8EF] border border-[#C9DFBC] text-[#38662D] font-bold text-xs flex items-center justify-center shrink-0">
                              {student.srNo}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-[#102033] truncate">
                                {student.fullName}
                              </h4>
                              <p className="text-[11px] font-mono text-slate-500">
                                G.R. No: <strong className="text-slate-700">{student.grNumber || '—'}</strong>
                                {student.rollNumber ? ` • Roll #${student.rollNumber}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black border ${badgeClass}`}>
                              {student.attendancePercentage}
                            </span>
                            <span className="block text-[9.5px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
                              {isGood ? 'Satisfactory' : isAverage ? 'Warning' : 'Critical'}
                            </span>
                          </div>
                        </div>

                        {/* Attendance Progress Bar */}
                        <div className="space-y-1">
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>

                        {/* 4 Mini Stat Boxes */}
                        <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                          <div className="p-1.5 rounded-xl bg-emerald-50/80 border border-emerald-100">
                            <span className="text-[9.5px] font-bold text-emerald-800 uppercase block">Present</span>
                            <span className="text-sm font-black text-emerald-700">{student.totals?.P ?? 0}</span>
                          </div>
                          <div className="p-1.5 rounded-xl bg-rose-50/80 border border-rose-100">
                            <span className="text-[9.5px] font-bold text-rose-800 uppercase block">Absent</span>
                            <span className="text-sm font-black text-rose-700">{student.totals?.A ?? 0}</span>
                          </div>
                          <div className="p-1.5 rounded-xl bg-amber-50/80 border border-amber-100">
                            <span className="text-[9.5px] font-bold text-amber-800 uppercase block">Leave</span>
                            <span className="text-sm font-black text-amber-700">{student.totals?.L ?? 0}</span>
                          </div>
                          <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-[9.5px] font-bold text-slate-600 uppercase block">Ratio</span>
                            <span className="text-xs font-black text-[#102033] leading-tight block mt-0.5">
                              {student.totals?.P ?? 0}/{student.workingDaysRecorded ?? 0}
                            </span>
                          </div>
                        </div>

                        {/* Expandable Daily Calendar Chips */}
                        <div className="pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setExpandedStudentId(isExpanded ? null : student.userId)}
                            className="w-full py-1 text-xs font-bold text-[#38662D] hover:text-[#294D22] flex items-center justify-center gap-1 transition cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide Month Breakdown' : 'View Month Days Breakdown'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {isExpanded && (
                            <div className="pt-2.5 pb-1 animate-in fade-in-50 duration-200">
                              <p className="text-[10.5px] font-bold text-slate-500 mb-2 uppercase tracking-wide">
                                Monthly Ledger Breakdown ({calendarDays.length} Days) · Tap Red/Amber for remarks:
                              </p>
                              <div className="grid grid-cols-7 sm:grid-cols-10 gap-1">
                                {calendarDays.map((calDay) => {
                                  const dateStr = calDay.date;
                                  const status = student.attendance?.[dateStr];
                                  const isClosed = calDay.isClosed;
                                  const isSunday = calDay.dayOfWeek === 0;
                                  const isSaturday = calDay.dayOfWeek === 6;
                                  const isHoliday = calDay.dayType === 'HOLIDAY';
                                  const studentRemark = student.attendanceRemarks?.[dateStr] || student.dailyStatus?.[dateStr]?.remarks || '';

                                  let pillBg = 'bg-slate-50 text-slate-400 border-slate-200';
                                  let label = '—';

                                  if (status === 'PRESENT') {
                                    pillBg = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
                                    label = 'P';
                                  } else if (status === 'ABSENT') {
                                    pillBg = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
                                    label = 'A';
                                  } else if (status === 'LEAVE') {
                                    pillBg = 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
                                    label = 'L';
                                  } else if (isHoliday) {
                                    pillBg = 'bg-rose-50 text-rose-600 border-rose-200';
                                    label = 'H';
                                  } else if (isSunday) {
                                    pillBg = 'bg-amber-50 text-amber-700 border-amber-200';
                                    label = 'S';
                                  } else if (isSaturday) {
                                    pillBg = 'bg-orange-50 text-orange-700 border-orange-200';
                                    label = 'Sat';
                                  }

                                  const isClickable = (status === 'ABSENT' || status === 'LEAVE');

                                  return (
                                    <button
                                      key={dateStr}
                                      type="button"
                                      disabled={!isClickable}
                                      onClick={() => {
                                        if (isClickable) {
                                          setSelectedRemarkDetail({
                                            student,
                                            dateStr,
                                            dayNameFull: calDay.dayNameFull || calDay.dayNameShort || '',
                                            status,
                                            remarks: studentRemark,
                                          });
                                        }
                                      }}
                                      className={`p-1 text-center rounded-lg border text-[10px] transition ${pillBg} ${
                                        isClickable ? 'cursor-pointer hover:ring-2 hover:ring-rose-400' : 'cursor-default'
                                      }`}
                                      title={`${calDay.date} (${calDay.dayName}): ${status || (isClosed ? 'Holiday / Off' : 'Not Taken')}`}
                                    >
                                      <span className="block text-[8px] opacity-70 leading-none">{calDay.dayNumber}</span>
                                      <span className="block font-black leading-tight">{label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ─── Responsive View 2: Official Full Matrix Ledger (Table) (Active when displayMode === 'TABLE' or in Print) ─── */}
            <div className={`overflow-x-auto print:overflow-visible ${displayMode === 'CARDS' ? 'hidden print:block' : 'block'}`}>
              {/* Mobile Swipe Hint Banner */}
              <div className="lg:hidden p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-medium select-none print:hidden">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <span>👉 Swipe horizontally to view days 1–31 and totals</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDisplayMode('CARDS')}
                  className="font-bold text-[#38662D] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <LayoutGrid className="w-3 h-3" /> Switch to Cards
                </button>
              </div>

              <table className="w-full text-center text-[11px] border-collapse min-w-[1200px]">
                {/* Table Header */}
                <thead>
                  <tr className="bg-slate-100 text-[#102033] border-b border-slate-300 font-bold">
                    {/* Identity Columns */}
                    <th className="hidden md:table-cell py-2.5 px-2 w-10 border-r border-slate-300 sticky left-0 z-20 bg-slate-100 text-center">
                      Sr.
                    </th>
                    <th className="hidden md:table-cell py-2.5 px-2 w-14 border-r border-slate-300 sticky left-10 z-20 bg-slate-100 text-center">
                      G.R.
                    </th>
                    <th className="py-2.5 px-2.5 w-36 md:w-auto min-w-[140px] md:min-w-[170px] max-w-[160px] md:max-w-[200px] border-r border-slate-300 sticky left-0 md:left-24 z-20 bg-slate-100 text-left shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                      <span className="md:hidden">Student</span>
                      <span className="hidden md:inline">Student's Name</span>
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

                    {/* Summary Columns: Sticky ONLY on lg: screens to avoid crushing mobile viewports */}
                    <th className="py-2.5 px-1 w-9 min-w-9 border-r border-slate-300 bg-emerald-100 text-emerald-950 lg:sticky lg:right-[166px] z-20 lg:shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                      P
                    </th>
                    <th className="py-2.5 px-1 w-9 min-w-9 border-r border-slate-300 bg-rose-100 text-rose-950 lg:sticky lg:right-[130px] z-20">
                      A
                    </th>
                    <th className="py-2.5 px-1 w-9 min-w-9 border-r border-slate-300 bg-amber-100 text-amber-950 lg:sticky lg:right-[94px] z-20">
                      L
                    </th>
                    <th className="py-2.5 px-1.5 w-13 min-w-13 border-r border-slate-300 bg-slate-200 text-[#102033] lg:sticky lg:right-[42px] z-20">
                      Total
                    </th>
                    <th className="py-2.5 px-1.5 w-11 min-w-11 bg-indigo-100 text-indigo-950 lg:sticky lg:right-0 z-20">
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
                        {/* Identity: Sr. No (Hidden on mobile) */}
                        <td className={`hidden md:table-cell py-2 px-1 text-center font-bold text-slate-500 border-r border-slate-300 sticky left-0 z-10 ${rowBg}`}>
                          {student.srNo}
                        </td>

                        {/* Identity: G.R. Number (Hidden on mobile) */}
                        <td className={`hidden md:table-cell py-2 px-1 text-center font-mono font-bold text-slate-700 border-r border-slate-300 sticky left-10 z-10 ${rowBg}`}>
                          {student.grNumber || '—'}
                        </td>

                        {/* Identity: Full Name (On mobile, includes GR & Roll # to avoid multi-column freezing) */}
                        <td className={`py-2 px-2.5 text-left font-bold text-[#102033] border-r border-slate-300 sticky left-0 md:left-24 z-10 ${rowBg} shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] w-36 md:w-auto min-w-[140px] md:min-w-[170px] max-w-[160px] md:max-w-[200px]`}>
                          <div className="font-bold text-xs truncate">{student.fullName}</div>
                          <div className="md:hidden text-[10px] text-slate-500 font-mono font-normal">GR: {student.grNumber || '—'} • #{student.srNo}</div>
                        </td>

                        {/* Daily Attendance Cells */}
                        {calendarDays.map((calDay) => {
                          const dateStr = calDay.date;
                          const status = student.attendance?.[dateStr];
                          const isClosed = calDay.isClosed;
                          const hasRecordedAttendance = Boolean(calDay.hasRecordedAttendance || calDay.isAttendanceTaken);

                          if (isClosed && !hasRecordedAttendance) {
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
                            return null;
                          }

                          const isMissed = calDay.status === 'NOT_TAKEN';
                          const isFuture = calDay.isFutureDate;

                          let cellContent = '—';
                          let cellClass = 'text-slate-300';
                          const isException = status === 'ABSENT' || status === 'LEAVE';
                          const studentRemark = student.attendanceRemarks?.[dateStr] || student.dailyStatus?.[dateStr]?.remarks || '';

                          let cellTitle = `${student.fullName} on ${dateStr}: ${status || calDay.closureLabel || calDay.status}`;

                          if (status === 'PRESENT') {
                            cellContent = 'P';
                            cellClass = 'text-emerald-700 font-black bg-emerald-50/40';
                          } else if (status === 'ABSENT') {
                            cellContent = 'A';
                            cellClass = 'text-rose-700 font-black bg-rose-50/60';
                            cellTitle = `${student.fullName} (Roll #${student.rollNumber || '—'}, GR: ${student.grNumber || '—'})\nStatus: ABSENT on ${dateStr} (${calDay.dayNameFull || calDay.dayNameShort})\n` +
                              (studentRemark
                                ? `Reason / Remarks: "${studentRemark}"\n(Click to view details)`
                                : `Reason: No specific remarks recorded by teacher.\n(Click to view details)`);
                          } else if (status === 'LEAVE') {
                            cellContent = 'L';
                            cellClass = 'text-amber-700 font-black bg-amber-50/40';
                            cellTitle = `${student.fullName} (Roll #${student.rollNumber || '—'}, GR: ${student.grNumber || '—'})\nStatus: LEAVE on ${dateStr} (${calDay.dayNameFull || calDay.dayNameShort})\n` +
                              (studentRemark
                                ? `Reason / Remarks: "${studentRemark}"\n(Click to view details)`
                                : `Reason: Approved leave (no extra remarks recorded).\n(Click to view details)`);
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
                              title={cellTitle}
                            >
                              {isException ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedRemarkDetail({
                                    student,
                                    dateStr,
                                    dayNameFull: calDay.dayNameFull || calDay.dayNameShort || '',
                                    status,
                                    remarks: studentRemark,
                                  })}
                                  className={`inline-flex items-center justify-center relative w-full h-full min-h-[22px] cursor-pointer group focus:outline-none transition-all rounded-xs ${
                                    status === 'ABSENT'
                                      ? 'hover:bg-rose-100/90 text-rose-700'
                                      : 'hover:bg-amber-100/90 text-amber-700'
                                  }`}
                                >
                                  <span className="font-black underline decoration-dotted underline-offset-2 group-hover:scale-110 transition-transform">
                                    {cellContent}
                                  </span>
                                  {studentRemark ? (
                                    <span
                                      className={`absolute top-0 right-0 w-1.5 h-1.5 rounded-full ring-1 ring-white print:hidden ${
                                        status === 'ABSENT' ? 'bg-rose-600' : 'bg-amber-600'
                                      }`}
                                      title="Teacher remark attached"
                                    />
                                  ) : null}
                                </button>
                              ) : (
                                cellContent
                              )}
                            </td>
                          );
                        })}

                        {/* Summary Columns: Sticky only on lg: screens */}
                        <td className="w-9 min-w-9 py-2 px-1 text-center font-black text-emerald-800 border-r border-slate-300 lg:sticky lg:right-[166px] z-10 bg-emerald-50 lg:shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                          {student.totals.P}
                        </td>
                        <td className="w-9 min-w-9 py-2 px-1 text-center font-black text-rose-800 border-r border-slate-300 lg:sticky lg:right-[130px] z-10 bg-rose-50">
                          {student.totals.A}
                        </td>
                        <td className="w-9 min-w-9 py-2 px-1 text-center font-black text-amber-800 border-r border-slate-300 lg:sticky lg:right-[94px] z-10 bg-amber-50">
                          {student.totals.L}
                        </td>
                        <td className="w-13 min-w-13 py-2 px-1 text-center font-bold text-[#102033] border-r border-slate-300 lg:sticky lg:right-[42px] z-10 bg-slate-100">
                          {student.totals.P} / {student.workingDaysRecorded}
                        </td>
                        <td className="w-11 min-w-11 py-2 px-1 text-center font-black text-indigo-700 lg:sticky lg:right-0 z-10 bg-indigo-50">
                          {student.attendancePercentage}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Table Footer: Daily Attendance Totals */}
                <tfoot>
                  <tr className="bg-slate-100 font-black text-[#102033] border-t-2 border-slate-300">
                    <td colSpan={1} className="md:hidden py-2.5 px-2 text-right border-r border-slate-300 sticky left-0 z-20 bg-slate-100 text-[10px] font-bold">
                      Total P:
                    </td>
                    <td colSpan={3} className="hidden md:table-cell py-2.5 px-3 text-right border-r border-slate-300 sticky left-0 z-20 bg-slate-100">
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
                    <td colSpan={5} className="py-2.5 px-2 bg-slate-100 lg:sticky lg:right-0 z-20 text-center text-xs">
                      Class Avg: <strong className="text-indigo-700">{registerData?.classAggregatePct || 'N/A'}</strong>
                    </td>
                  </tr>

                  <tr className="bg-slate-50 font-bold text-slate-600 border-t border-slate-200">
                    <td colSpan={1} className="md:hidden py-2 px-2 text-right border-r border-slate-300 sticky left-0 z-20 bg-slate-50 text-[10px] font-bold">
                      Total A:
                    </td>
                    <td colSpan={3} className="hidden md:table-cell py-2 px-3 text-right border-r border-slate-300 sticky left-0 z-20 bg-slate-50">
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
                    <td colSpan={5} className="bg-slate-50 lg:sticky lg:right-0 z-20"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
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
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#4B7F3A]"
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
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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

      {/* ─── Reason / Remarks Details Modal ─────────────────────────────── */}
      {selectedRemarkDetail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden animate-in fade-in duration-150"
          onClick={() => setSelectedRemarkDetail(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-md w-full overflow-hidden transition-all transform scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`p-5 border-b flex items-start justify-between gap-3 ${
              selectedRemarkDetail.status === 'ABSENT'
                ? 'bg-rose-50/50 border-rose-100'
                : 'bg-amber-50/50 border-amber-100'
            }`}>
              <div className="flex items-center gap-3">
                <span className={`p-2.5 rounded-xl border shadow-xs ${
                  selectedRemarkDetail.status === 'ABSENT'
                    ? 'bg-rose-100 text-rose-700 border-rose-200'
                    : 'bg-amber-100 text-amber-700 border-amber-200'
                }`}>
                  {selectedRemarkDetail.status === 'ABSENT' ? (
                    <UserX className="w-5 h-5" />
                  ) : (
                    <Calendar className="w-5 h-5" />
                  )}
                </span>
                <div>
                  <h3 className="text-base font-black text-[#102033] tracking-tight">
                    {selectedRemarkDetail.status === 'ABSENT' ? 'Absence Record & Reason' : 'Approved Leave Record & Reason'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Daily Attendance Register • {schoolName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRemarkDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Student Metadata Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Student Name</span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Roll #{selectedRemarkDetail.student.rollNumber || '—'}
                  </span>
                </div>
                <p className="text-base font-black text-[#102033]">
                  {selectedRemarkDetail.student.fullName}
                </p>
                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">G.R. Number</span>
                    <span className="font-mono font-bold text-slate-700">
                      {selectedRemarkDetail.student.grNumber || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Class & Section</span>
                    <span className="font-bold text-slate-700">
                      {className} — {sectionName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Date & Status Strip */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Record Date</span>
                  <span className="text-xs font-bold text-[#102033]">
                    {selectedRemarkDetail.dayNameFull ? `${selectedRemarkDetail.dayNameFull}, ` : ''}{selectedRemarkDetail.dateStr}
                  </span>
                </div>
                <div>
                  {selectedRemarkDetail.status === 'ABSENT' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1.5 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                      [A] Marked Absent
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                      [L] Approved Leave
                    </span>
                  )}
                </div>
              </div>

              {/* Teacher Remarks / Reason Box */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>Teacher's Recorded Reason / Remarks:</span>
                </div>

                {selectedRemarkDetail.remarks ? (
                  <div className={`p-4 rounded-xl border-l-4 shadow-xs ${
                    selectedRemarkDetail.status === 'ABSENT'
                      ? 'bg-rose-50/60 border-l-rose-500 border border-rose-200/80 text-rose-950'
                      : 'bg-amber-50/60 border-l-amber-500 border border-amber-200/80 text-amber-950'
                  }`}>
                    <p className="text-sm font-semibold italic leading-relaxed whitespace-pre-wrap">
                      "{selectedRemarkDetail.remarks}"
                    </p>
                    <p className="mt-2 text-[10px] text-slate-500 font-medium">
                      Official note recorded during daily attendance roll call.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-start gap-2">
                    <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-700">No specific remarks recorded</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        The class teacher marked this student as {selectedRemarkDetail.status === 'ABSENT' ? 'Absent' : 'Leave'} without specifying an additional written reason.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedRemarkDetail(null)}
                className="px-5 py-2 rounded-xl bg-[#102033] hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartAttendanceRegister;
