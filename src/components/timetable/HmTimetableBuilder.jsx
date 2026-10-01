import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CalendarDays,
  Clock,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Sparkles,
  BookOpen,
  User,
  Building,
  Settings,
  ShieldAlert,
  Printer,
  Copy,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import LivePeriodBadge from './LivePeriodBadge.jsx';
import {
  fetchSchoolTimetable,
  saveTimetable,
  clearTimetableError,
  resetSaveSuccess,
} from '../../store/slices/timetableSlice.js';

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

// Standard Sindh DMC Government School 7-Period + Break Baseline
const DEFAULT_GOVERNMENT_PERIOD_SLOTS = [
  { periodNumber: 1, slotType: 'TEACHING', label: '1st', startTime: '08:00', endTime: '08:35' },
  { periodNumber: 2, slotType: 'TEACHING', label: '2nd', startTime: '08:35', endTime: '09:10' },
  { periodNumber: 3, slotType: 'TEACHING', label: '3rd', startTime: '09:10', endTime: '09:45' },
  { periodNumber: 4, slotType: 'TEACHING', label: '4th', startTime: '09:45', endTime: '10:15' },
  { periodNumber: 0, slotType: 'RECESS', label: 'BREAK', startTime: '10:15', endTime: '10:35' },
  { periodNumber: 5, slotType: 'TEACHING', label: '5th', startTime: '10:35', endTime: '11:10' },
  { periodNumber: 6, slotType: 'TEACHING', label: '6th', startTime: '11:10', endTime: '11:45' },
  { periodNumber: 7, slotType: 'TEACHING', label: '7th', startTime: '11:45', endTime: '12:20' },
];

export const HmTimetableBuilder = ({
  schoolId,
  classes = [],
  sections = [],
  subjects = [],
  assignments = [],
  faculty = [],
}) => {
  const dispatch = useDispatch();
  const { schoolTimetable, liveStatus, isLoading, isSaving, error, saveSuccess } = useSelector(
    (state) => state.timetable
  );

  const [activeViewMode, setActiveViewMode] = useState('MASTER_GRID'); // 'MASTER_GRID' | 'PRINT_PREVIEW'
  const [selectedDay, setSelectedDay] = useState(() => {
    const todayIndex = new Date().getDay();
    const dayMap = { 1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY', 4: 'THURSDAY', 5: 'FRIDAY', 6: 'SATURDAY' };
    return dayMap[todayIndex] || 'MONDAY';
  });

  const [academicYear, setAcademicYear] = useState('2025-2026');

  // Local editable timetable state
  const [editableSlots, setEditableSlots] = useState([]);
  const [editableSchedule, setEditableSchedule] = useState([]);

  // Cell allocation modal state
  const [cellModalOpen, setCellModalOpen] = useState(false);
  const [activeCellTarget, setActiveCellTarget] = useState(null); // { classId, dayOfWeek, periodNumber }
  const [cellSubjectId, setCellSubjectId] = useState('');
  const [cellTeacherId, setCellTeacherId] = useState('');
  const [cellRoomNumber, setCellRoomNumber] = useState('');

  // Class In-charge quick assign modal
  const [inchargeModalOpen, setInchargeModalOpen] = useState(false);
  const [activeInchargeClass, setActiveInchargeClass] = useState(null);
  const [selectedInchargeTeacherId, setSelectedInchargeTeacherId] = useState('');

  // Slot editor modal state
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [newSlotNumber, setNewSlotNumber] = useState(1);
  const [newSlotType, setNewSlotType] = useState('TEACHING');
  const [newSlotLabel, setNewSlotLabel] = useState('');
  const [newSlotStartTime, setNewSlotStartTime] = useState('08:00');
  const [newSlotEndTime, setNewSlotEndTime] = useState('08:45');

  // Sorted classes (strictly by numericGrade, clean names without sections)
  const sortedClasses = useMemo(() => {
    return [...classes].sort(
      (firstClass, secondClass) => (Number(firstClass.numericGrade) || 0) - (Number(secondClass.numericGrade) || 0)
    );
  }, [classes]);

  // Primary section lookup map per class (for database foreign key integrity)
  const primarySectionByClassId = useMemo(() => {
    const map = new Map();
    for (const classRecord of classes) {
      const classRecordId = String(classRecord._id);
      const match = sections.find(
        (sectionRecord) => String(sectionRecord.classId?._id || sectionRecord.classId) === classRecordId
      );
      if (match) {
        map.set(classRecordId, match);
      }
    }
    return map;
  }, [classes, sections]);

  // Fetch school timetable on mount
  useEffect(() => {
    if (schoolId) {
      dispatch(fetchSchoolTimetable({ schoolId, academicYear }));
    }
  }, [dispatch, schoolId, academicYear]);

  // Synchronize local editable state when loaded from server
  useEffect(() => {
    if (schoolTimetable && Array.isArray(schoolTimetable.periodSlots) && schoolTimetable.periodSlots.length > 0) {
      setEditableSlots(schoolTimetable.periodSlots);
      setEditableSchedule(schoolTimetable.schedule || []);
    } else {
      setEditableSlots(DEFAULT_GOVERNMENT_PERIOD_SLOTS);
      setEditableSchedule([]);
    }
  }, [schoolTimetable]);

  // Handle save success
  useEffect(() => {
    if (saveSuccess) {
      toast.success('Official Timetable posted & published! It is now live on all Teachers and Students dashboards.');
      dispatch(resetSaveSuccess());
      dispatch(fetchSchoolTimetable({ schoolId, academicYear }));
    }
  }, [saveSuccess, dispatch, schoolId, academicYear]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearTimetableError());
    }
  }, [error, dispatch]);

  // Chronologically sorted slots
  const sortedSlots = useMemo(() => {
    return [...editableSlots].sort(
      (firstSlot, secondSlot) => firstSlot.startTime.localeCompare(secondSlot.startTime)
    );
  }, [editableSlots]);

  // Teaching slots only (for free periods calculation)
  const teachingSlots = useMemo(() => {
    return sortedSlots.filter((slot) => slot.slotType === 'TEACHING');
  }, [sortedSlots]);

  // Helper: Find schedule entry for given class, day, and period
  const getEntryForCell = useCallback(
    (classId, day, periodNum) => {
      return editableSchedule.find(
        (scheduleEntry) =>
          String(scheduleEntry.classId?._id || scheduleEntry.classId) === String(classId) &&
          scheduleEntry.dayOfWeek === day &&
          scheduleEntry.periodNumber === periodNum
      );
    },
    [editableSchedule]
  );

  // Helper: Check if an early grade class (e.g. Grades 1-3) has "All Subjects" assigned to a single teacher
  const getSingleTeacherForEarlyClass = useCallback(
    (classItem, day) => {
      if ((classItem.numericGrade || 0) > 3) return null;
      const classTeachingEntries = teachingSlots
        .map((slot) => getEntryForCell(classItem._id, day, slot.periodNumber))
        .filter(Boolean);

      if (classTeachingEntries.length === 0) return null;

      const firstTeacherId = String(
        classTeachingEntries[0].teacherId?._id || classTeachingEntries[0].teacherId || ''
      );
      if (!firstTeacherId) return null;

      const allMatch = classTeachingEntries.every(
        (entry) => String(entry.teacherId?._id || entry.teacherId || '') === firstTeacherId
      );

      if (allMatch && classTeachingEntries.length >= Math.min(3, teachingSlots.length)) {
        const teacherObj = faculty.find(
          (facultyMember) => String(facultyMember._id) === firstTeacherId
        );
        return teacherObj || { fullName: 'Assigned Class Teacher' };
      }
      return null;
    },
    [teachingSlots, getEntryForCell, faculty]
  );

  // Dynamic Real-Time Teacher Free Periods Register (Matching Image 2 footer)
  const teacherFreePeriodsSummary = useMemo(() => {
    return faculty.map((teacher) => {
      const assignedPeriods = new Set(
        editableSchedule
          .filter(
            (entry) =>
              entry.dayOfWeek === selectedDay &&
              String(entry.teacherId?._id || entry.teacherId) === String(teacher._id)
          )
          .map((entry) => entry.periodNumber)
      );

      const freeSlotNumbers = teachingSlots
        .filter((slot) => !assignedPeriods.has(slot.periodNumber))
        .map((slot) => slot.periodNumber)
        .sort((firstPeriodNumber, secondPeriodNumber) => firstPeriodNumber - secondPeriodNumber);

      const formatted = freeSlotNumbers
        .map((periodNumber) => String(periodNumber).padStart(2, '0'))
        .join(', ');

      return {
        teacherId: teacher._id,
        fullName: teacher.fullName,
        designation: teacher.designation || 'Teacher',
        freePeriods: freeSlotNumbers,
        formatted: formatted || 'None (Fully Booked)',
        totalAssigned: assignedPeriods.size,
        totalFree: freeSlotNumbers.length,
      };
    });
  }, [faculty, editableSchedule, selectedDay, teachingSlots]);

  // Open Cell Editor
  const handleOpenCellEditor = (classItem, periodSlot) => {
    if (['ASSEMBLY', 'RECESS'].includes(periodSlot.slotType)) {
      toast.error(`Cannot assign subject during ${periodSlot.label} (${periodSlot.slotType})`);
      return;
    }

    const existingEntry = getEntryForCell(classItem._id, selectedDay, periodSlot.periodNumber);
    setActiveCellTarget({
      classItem,
      dayOfWeek: selectedDay,
      periodSlot,
    });
    setCellSubjectId(existingEntry?.subjectId?._id || existingEntry?.subjectId || '');
    setCellTeacherId(existingEntry?.teacherId?._id || existingEntry?.teacherId || '');
    setCellRoomNumber(existingEntry?.roomNumber || '');
    setCellModalOpen(true);
  };

  // Save Cell Allocation
  const handleSaveCellAllocation = () => {
    if (!activeCellTarget) return;
    const { classItem, dayOfWeek, periodSlot } = activeCellTarget;

    if (!cellSubjectId) {
      toast.error('Subject is required for this teaching period.');
      return;
    }
    if (!cellTeacherId) {
      toast.error('Teacher is required for this teaching period.');
      return;
    }

    // Teacher clash check in local schedule
    const clash = editableSchedule.find(
      (scheduleEntry) =>
        scheduleEntry.dayOfWeek === dayOfWeek &&
        scheduleEntry.periodNumber === periodSlot.periodNumber &&
        String(scheduleEntry.teacherId?._id || scheduleEntry.teacherId) === String(cellTeacherId) &&
        String(scheduleEntry.classId?._id || scheduleEntry.classId) !== String(classItem._id)
    );

    if (clash) {
      const clashClass = classes.find(
        (classCandidate) => String(classCandidate._id) === String(clash.classId?._id || clash.classId)
      );
      toast.error(
        `Clash Detected: Selected teacher is already teaching ${clashClass?.name || 'another class'} in ${periodSlot.label} on ${dayOfWeek}.`
      );
      return;
    }

    // Primary section for database FK
    const primarySection = primarySectionByClassId.get(String(classItem._id));
    const sectionId = primarySection?._id || sections[0]?._id;

    // Filter out previous entry for this class+day+period
    const updatedSchedule = editableSchedule.filter(
      (scheduleEntry) =>
        !(
          String(scheduleEntry.classId?._id || scheduleEntry.classId) === String(classItem._id) &&
          scheduleEntry.dayOfWeek === dayOfWeek &&
          scheduleEntry.periodNumber === periodSlot.periodNumber
        )
    );

    const newEntry = {
      classId: classItem._id,
      sectionId,
      dayOfWeek,
      periodNumber: periodSlot.periodNumber,
      subjectId: cellSubjectId,
      teacherId: cellTeacherId,
      roomNumber: cellRoomNumber.trim(),
    };

    setEditableSchedule([...updatedSchedule, newEntry]);
    setCellModalOpen(false);
    toast.success(`Period ${periodSlot.label} allocated for ${classItem.name}.`);
  };

  // Clear single cell
  const handleClearCellAllocation = () => {
    if (!activeCellTarget) return;
    const { classItem, dayOfWeek, periodSlot } = activeCellTarget;

    const updatedSchedule = editableSchedule.filter(
      (scheduleEntry) =>
        !(
          String(scheduleEntry.classId?._id || scheduleEntry.classId) === String(classItem._id) &&
          scheduleEntry.dayOfWeek === dayOfWeek &&
          scheduleEntry.periodNumber === periodSlot.periodNumber
        )
    );
    setEditableSchedule(updatedSchedule);
    setCellModalOpen(false);
    toast.success(`Period ${periodSlot.label} cleared for ${classItem.name}.`);
  };

  // Assign All Subjects to Single Teacher (For Early Grades 1-3 / KG - Exactly as in Image 2)
  const handleAssignAllSubjectsToTeacher = (classItem, teacherId) => {
    if (!teacherId) {
      toast.error('Please select a teacher.');
      return;
    }

    // Default early subject e.g. General Knowledge or General
    const defaultSubject =
      subjects.find(
        (subjectCandidate) =>
          subjectCandidate.name.toLowerCase().includes('general') ||
          subjectCandidate.name.toLowerCase().includes('english')
      ) || subjects[0];

    const primarySection = primarySectionByClassId.get(String(classItem._id));
    const sectionId = primarySection?._id || sections[0]?._id;

    // Remove existing entries for this class on selectedDay
    const filtered = editableSchedule.filter(
      (scheduleEntry) =>
        !(String(scheduleEntry.classId?._id || scheduleEntry.classId) === String(classItem._id) && scheduleEntry.dayOfWeek === selectedDay)
    );

    // Create entries for all teaching slots on selectedDay
    const newEntries = teachingSlots.map((slot) => ({
      classId: classItem._id,
      sectionId,
      dayOfWeek: selectedDay,
      periodNumber: slot.periodNumber,
      subjectId: defaultSubject?._id,
      teacherId,
      roomNumber: '',
    }));

    setEditableSchedule([...filtered, ...newEntries]);
    toast.success(`Assigned "ALL SUBJECTS" in ${classItem.name} to designated Class Teacher.`);
  };

  // Copy Current Day's Schedule to All Weekdays (Mon-Sat)
  const handleCopyDayToAllWeekdays = () => {
    const currentDayEntries = editableSchedule.filter((scheduleEntry) => scheduleEntry.dayOfWeek === selectedDay);
    if (currentDayEntries.length === 0) {
      toast.error(`No timetable entries configured on ${selectedDay} to copy.`);
      return;
    }

    const otherDays = DAYS_OF_WEEK.filter((day) => day !== selectedDay);
    const retainedEntries = editableSchedule.filter((scheduleEntry) => scheduleEntry.dayOfWeek === selectedDay);

    const duplicatedEntries = [];
    for (const targetDay of otherDays) {
      for (const entry of currentDayEntries) {
        duplicatedEntries.push({
          ...entry,
          dayOfWeek: targetDay,
        });
      }
    }

    setEditableSchedule([...retainedEntries, ...duplicatedEntries]);
    toast.success(`Copied ${selectedDay}'s routine across all working days (Mon–Sat) successfully!`);
  };

  // Reset to Standard DMC Liaquatabad Period Slots
  const handleResetToStandardSlots = () => {
    if (window.confirm('Reset period slots to standard 7-period + Break DMC timing (08:00 to 12:20)?')) {
      setEditableSlots(DEFAULT_GOVERNMENT_PERIOD_SLOTS);
      toast.success('Period slots reset to standard government school timings.');
    }
  };

  // Save & Publish Timetable to Server
  const handlePostTimetable = () => {
    if (editableSlots.length === 0) {
      toast.error('At least one period slot is required.');
      return;
    }

    const payload = {
      schoolId,
      academicYear,
      status: 'ACTIVE', // Sets timetable as published & authoritative
      version: schoolTimetable?.version,
      periodSlots: editableSlots,
      schedule: editableSchedule.map((entry) => ({
        dayOfWeek: entry.dayOfWeek,
        periodNumber: entry.periodNumber,
        classId: entry.classId?._id || entry.classId,
        sectionId:
          entry.sectionId?._id ||
          entry.sectionId ||
          primarySectionByClassId.get(String(entry.classId?._id || entry.classId))?._id,
        subjectId: entry.subjectId?._id || entry.subjectId || null,
        teacherId: entry.teacherId?._id || entry.teacherId || null,
        roomNumber: entry.roomNumber || '',
      })),
    };

    dispatch(saveTimetable(payload));
  };

  // Subjects filtered for active class grade level in modal
  const eligibleSubjectsForCell = useMemo(() => {
    if (!activeCellTarget?.classItem) return subjects;
    const grade = Number(activeCellTarget.classItem.numericGrade) || 1;
    return subjects.filter((subjectDefinition) => {
      if (Array.isArray(subjectDefinition.gradeLevels) && subjectDefinition.gradeLevels.length > 0) {
        return subjectDefinition.gradeLevels.includes(grade);
      }
      return true;
    });
  }, [subjects, activeCellTarget]);

  return (
    <div className="space-y-6">
      {/* ─── OFFICIAL GOVERNMENT INSTITUTIONAL BANNER (MATCHING IMAGE 2) ─── */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0d1f33] via-[#102033] to-[#1c324b] text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#006AC7] text-white">
                DMC LIAQUATABAD TOWN CENTRE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white/80">
                EDUCATION DEPARTMENT
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ● OFFICIAL MASTER TIMETABLE REGISTER
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">
              {schoolTimetable?.schoolDetails?.name || 'BABA-E-URDU MOLVI ABDUL HAQ BOYS ELEMENTARY LT-11 E & ENGLISH MEDIUM SCHOOL'}
            </h1>

            <p className="text-xs text-slate-300 font-medium max-w-3xl">
              Official municipal teaching allocation matrix • Unified class routine (Single cohort per grade — No section silos) • Academic Session {academicYear}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <LivePeriodBadge liveStatus={liveStatus} />

            <button
              onClick={() => dispatch(fetchSchoolTimetable({ schoolId, academicYear }))}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white transition shadow-sm cursor-pointer"
              title="Refresh Timetable from Server"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition cursor-pointer"
              title="Print Master Timetable"
            >
              <Printer className="w-4 h-4 text-blue-300" />
              <span>Print Sheet</span>
            </button>

            <button
              onClick={handlePostTimetable}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-900/40 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Posting...' : 'Post / Publish Timetable'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── ACTION TOOLBAR & CONTROLS ─── */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Day Selector Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-[#8094A8] mr-1">Active Day:</span>
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDay === day;
            const isToday = liveStatus?.currentDay === day;
            const dayEntryCount = editableSchedule.filter((scheduleEntry) => scheduleEntry.dayOfWeek === day).length;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#102033] text-white shadow-md'
                    : 'bg-slate-50 border border-slate-200 text-[#526477] hover:bg-slate-100'
                }`}
              >
                <span>{day}</span>
                {isToday && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Today in Karachi" />
                )}
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-[#526477]'
                  }`}
                >
                  {dayEntryCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Utilities */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyDayToAllWeekdays}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100/80 text-[#006AC7] text-xs font-bold transition cursor-pointer"
            title="Copy current day's routine to Tuesday-Saturday"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy {selectedDay} to All Days</span>
          </button>

          <button
            onClick={handleResetToStandardSlots}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[#526477] text-xs font-bold transition cursor-pointer"
            title="Reset period timing to 08:00 - 12:20 standard government slots"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Standard Slots</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MASTER GOVERNMENT TIMETABLE MATRIX (EXACTLY AS IN IMAGE 2)          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="overflow-x-auto rounded-3xl bg-white border border-slate-200/90 shadow-sm print:border-none print:shadow-none">
        <table className="w-full text-left border-collapse min-w-[980px]">
          {/* Header Row 1: Period Numbers */}
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-xs font-black text-[#102033] uppercase">
              <th className="py-3 px-4 w-52 sticky left-0 bg-slate-100 z-20 border-r border-slate-300">
                <div className="flex flex-col">
                  <span className="tracking-wider">PERIODS</span>
                  <span className="text-[10px] font-normal text-[#526477] lowercase">classes & in-charge teacher</span>
                </div>
              </th>

              {sortedSlots.map((slot) => {
                const isBreak = ['RECESS', 'BREAK'].includes(slot.slotType) || slot.periodNumber === 0;
                const isLiveSlot =
                  liveStatus?.currentDay === selectedDay &&
                  liveStatus?.activeSlot?.periodNumber === slot.periodNumber;

                if (isBreak) {
                  return (
                    <th
                      key="break_slot"
                      className="py-3 px-3 text-center w-24 bg-amber-50/80 border-r border-amber-200 text-amber-900 font-black tracking-widest text-[11px]"
                    >
                      BREAK
                    </th>
                  );
                }

                return (
                  <th
                    key={slot.periodNumber}
                    className={`py-3 px-3 text-center border-r border-slate-200 last:border-r-0 ${
                      isLiveSlot ? 'bg-emerald-500/15 border-b-2 border-b-emerald-600' : ''
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className={`text-sm font-black ${isLiveSlot ? 'text-emerald-800' : 'text-[#102033]'}`}>
                        {slot.label}
                      </span>
                      {isLiveSlot && (
                        <span className="mt-0.5 px-1.5 py-0.2 rounded text-[8px] font-black bg-emerald-600 text-white animate-pulse">
                          LIVE NOW
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>

            {/* Header Row 2: Standard Timing Slots */}
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono font-bold text-[#526477]">
              <th className="py-2 px-4 sticky left-0 bg-slate-50 z-20 border-r border-slate-300 text-left font-sans">
                Time (PKT)
              </th>
              {sortedSlots.map((slot) => {
                const isBreak = ['RECESS', 'BREAK'].includes(slot.slotType) || slot.periodNumber === 0;
                return (
                  <th
                    key={`time_${slot.periodNumber}`}
                    className={`py-2 px-2 text-center border-r border-slate-200 last:border-r-0 ${
                      isBreak ? 'bg-amber-50/50 border-r-amber-200 text-amber-800 text-[10px]' : ''
                    }`}
                  >
                    {slot.startTime}–{slot.endTime}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Matrix Rows: One Clean Row Per Class (No ABCD Sections!) */}
          <tbody className="divide-y divide-slate-200 text-xs">
            {sortedClasses.length === 0 ? (
              <tr>
                <td colSpan={sortedSlots.length + 1} className="py-16 text-center text-[#8094A8]">
                  No classes configured in this school.
                </td>
              </tr>
            ) : (
              sortedClasses.map((classItem) => {
                const isEarlyClass = (classItem.numericGrade || 0) <= 3;
                const earlyClassSingleTeacher = getSingleTeacherForEarlyClass(classItem, selectedDay);
                const primarySection = primarySectionByClassId.get(String(classItem._id));
                const inchargeTeacher = primarySection?.classTeacherId;

                return (
                  <tr key={classItem._id} className="hover:bg-slate-50/70 transition">
                    {/* Class & In-charge Column */}
                    <td className="py-3 px-4 font-bold text-[#102033] sticky left-0 bg-white border-r border-slate-300 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-black text-[#102033]">{classItem.name}</div>
                          <div className="text-[11px] font-medium text-[#526477] flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3 text-[#8094A8]" />
                            <span>{inchargeTeacher?.fullName || 'Teacher: Not assigned'}</span>
                          </div>
                        </div>

                        {/* Early Grade Quick Assign "All Subjects" Button */}
                        {isEarlyClass && (
                          <button
                            type="button"
                            onClick={() => {
                              const promptTeacher = faculty.find(
                                (facultyMember) => String(facultyMember._id) === String(inchargeTeacher?._id || '')
                              );
                              if (promptTeacher) {
                                handleAssignAllSubjectsToTeacher(classItem, promptTeacher._id);
                              } else if (faculty.length > 0) {
                                handleAssignAllSubjectsToTeacher(classItem, faculty[0]._id);
                              } else {
                                toast.error('No faculty members available to assign.');
                              }
                            }}
                            className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#006AC7] text-[10px] font-bold cursor-pointer"
                            title="Assign Single Teacher to All Subjects"
                          >
                            All Subj
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Period Allocation Cells */}
                    {sortedSlots.map((slot) => {
                      const isBreak = ['RECESS', 'BREAK'].includes(slot.slotType) || slot.periodNumber === 0;
                      const isLiveSlot =
                        liveStatus?.currentDay === selectedDay &&
                        liveStatus?.activeSlot?.periodNumber === slot.periodNumber;

                      // Break Column (Vertical Spanning Banner)
                      if (isBreak) {
                        return (
                          <td
                            key="cell_break"
                            className="py-2 px-1 text-center bg-amber-50/40 border-r border-amber-200 text-amber-700 font-mono text-[10px] font-bold tracking-widest select-none"
                          >
                            <span className="block writing-vertical-lr text-amber-800 font-bold uppercase text-[9px]">
                              BREAK
                            </span>
                          </td>
                        );
                      }

                      // Check if Early Class has All Subjects assigned
                      const entry = getEntryForCell(classItem._id, selectedDay, slot.periodNumber);
                      const subjectObj = subjects.find(
                        (subjectDefinition) =>
                          String(subjectDefinition._id) === String(entry?.subjectId?._id || entry?.subjectId)
                      );
                      const teacherObj = faculty.find(
                        (facultyMember) =>
                          String(facultyMember._id) === String(entry?.teacherId?._id || entry?.teacherId)
                      );

                      const isAllocated = Boolean(entry && (subjectObj || teacherObj));

                      return (
                        <td
                          key={slot.periodNumber}
                          onClick={() => handleOpenCellEditor(classItem, slot)}
                          className={`py-2 px-2 border-r border-slate-200 last:border-r-0 cursor-pointer transition group ${
                            isLiveSlot ? 'bg-emerald-500/10' : 'hover:bg-blue-50/40'
                          }`}
                        >
                          {isAllocated ? (
                            <div className="p-2 rounded-xl bg-blue-50/90 border border-blue-200/80 group-hover:border-[#006AC7] transition space-y-0.5">
                              {/* Subject Name in Bold Uppercase (Matching Image 2) */}
                              <div className="font-black text-xs text-[#006AC7] uppercase tracking-wide truncate">
                                {subjectObj?.name || 'ALL SUBJECTS'}
                              </div>

                              {/* Teacher Name in Second Line (Matching Image 2) */}
                              <div className="text-[11px] font-bold text-[#102033] uppercase truncate flex items-center gap-1">
                                <span>{teacherObj?.fullName || 'Assigned Faculty'}</span>
                              </div>

                              {entry?.roomNumber && (
                                <div className="text-[9px] font-mono text-[#8094A8]">
                                  R: {entry.roomNumber}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-12 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-[10px] font-bold text-[#8094A8] group-hover:border-[#006AC7] group-hover:text-[#006AC7] group-hover:bg-white transition">
                              + Assign
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TEACHER FREE PERIODS REGISTER FOOTER (MATCHING IMAGE 2 EXACTLY)      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-[#006AC7]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#102033] uppercase tracking-wider">
                Teacher Free Periods / Off-Duty Register ({selectedDay})
              </h3>
              <p className="text-xs text-[#526477]">
                Deterministic substitute duty & proxy allocation intelligence — automatically calculated from active timetable.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-[#526477] bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span>Total Faculty: {faculty.length}</span>
            <span>•</span>
            <span className="text-emerald-700">Teaching Slots: {teachingSlots.length}</span>
          </div>
        </div>

        {/* Free Periods Grid Display (Identical to Image 2 footer) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {teacherFreePeriodsSummary.map((teacherSummary) => (
            <div
              key={teacherSummary.teacherId}
              className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-[#006AC7]/60 hover:shadow-sm transition flex items-center justify-between gap-3"
            >
              <div>
                <div className="text-xs font-black text-[#102033] uppercase">
                  {teacherSummary.fullName}
                </div>
                <div className="text-[10px] text-[#8094A8] font-medium">
                  {teacherSummary.designation}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#526477]">
                  FREE PERIODS
                </div>
                <div className="text-xs font-mono font-black text-[#006AC7] mt-0.5">
                  {item.freePeriods.length > 0 ? (
                    <span className="px-2 py-0.5 rounded-lg bg-blue-100/80 text-blue-900 border border-blue-200">
                      {item.formatted}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[10px]">None (Full Load)</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CELL ALLOCATION MODAL ─── */}
      {cellModalOpen && activeCellTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-[#102033] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#006AC7]" />
                  <span>Period Allocation</span>
                </h3>
                <p className="text-xs text-[#526477] mt-0.5">
                  {activeCellTarget.classItem.name} • {activeCellTarget.periodSlot.label} ({activeCellTarget.periodSlot.startTime}–{activeCellTarget.periodSlot.endTime}) • {activeCellTarget.dayOfWeek}
                </p>
              </div>
              <button
                onClick={() => setCellModalOpen(false)}
                className="p-1 rounded-lg text-[#8094A8] hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#526477] uppercase tracking-wider mb-1.5">
                  Teaching Subject *
                </label>
                <select
                  value={cellSubjectId}
                  onChange={(changeEvent) => setCellSubjectId(changeEvent.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-[#102033] bg-white"
                >
                  <option value="">-- Choose Subject --</option>
                  {eligibleSubjectsForCell.map((subjectDefinition) => (
                    <option key={subjectDefinition._id} value={subjectDefinition._id}>
                      {subjectDefinition.name} {subjectDefinition.code ? `(${subjectDefinition.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#526477] uppercase tracking-wider mb-1.5">
                  Assigned Teacher *
                </label>
                <select
                  value={cellTeacherId}
                  onChange={(changeEvent) => setCellTeacherId(changeEvent.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-[#102033] bg-white"
                >
                  <option value="">-- Choose Faculty Member --</option>
                  {faculty.map((facultyMember) => (
                    <option key={facultyMember._id} value={facultyMember._id}>
                      {facultyMember.fullName} ({facultyMember.designation || 'Teacher'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#526477] uppercase tracking-wider mb-1.5">
                  Room / Classroom (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 101, Lab A"
                  value={cellRoomNumber}
                  onChange={(changeEvent) => setCellRoomNumber(changeEvent.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-[#102033] bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClearCellAllocation}
                className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition cursor-pointer"
              >
                Clear Period
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCellModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-[#526477] hover:bg-slate-50 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCellAllocation}
                  className="px-4 py-2 rounded-xl bg-[#006AC7] hover:bg-[#005299] text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  Apply Allocation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HmTimetableBuilder;
