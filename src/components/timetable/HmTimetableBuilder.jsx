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
  Eye,
  Info,
  Sliders,
  Edit2,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import LivePeriodBadge from './LivePeriodBadge.jsx';
import ConfirmModal from '../common/ConfirmModal.jsx';
import TimetablePrintPreviewModal from './TimetablePrintPreviewModal.jsx';
import TimingSyncPreviewModal from './TimingSyncPreviewModal.jsx';
import {
  fetchSchoolTimetable,
  saveTimetable,
  clearTimetableError,
  resetSaveSuccess,
} from '../../store/slices/timetableSlice.js';

// Calendar Days definitions (Zero hardcoding: off-days and active days are derived dynamically from DB)
export const ALL_CALENDAR_DAYS = [
  { key: 'MONDAY', dayNumber: 1, label: 'Monday', short: 'Mon' },
  { key: 'TUESDAY', dayNumber: 2, label: 'Tuesday', short: 'Tue' },
  { key: 'WEDNESDAY', dayNumber: 3, label: 'Wednesday', short: 'Wed' },
  { key: 'THURSDAY', dayNumber: 4, label: 'Thursday', short: 'Thu' },
  { key: 'FRIDAY', dayNumber: 5, label: 'Friday', short: 'Fri' },
  { key: 'SATURDAY', dayNumber: 6, label: 'Saturday', short: 'Sat' },
  { key: 'SUNDAY', dayNumber: 0, label: 'Sunday', short: 'Sun' },
];

export const DAY_TO_NUMBER_MAP = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const getOrdinalSuffix = (num) => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
};

/**
 * Deterministic helper to generate balanced instructional slots and recess
 * dynamically matching the exact start and closing hours configured for this school.
 * Zero static hardcoded period arrays.
 */
export const generateSynchronizedSlots = (startTime, endTime, isFriday = false) => {
  if (!startTime || !endTime) return [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const totalStart = startH * 60 + startM;
  const totalEnd = endH * 60 + endM;
  const totalMinutes = totalEnd - totalStart;

  if (totalMinutes < 120) return []; // Minimum threshold for valid instruction day

  const breakDuration = isFriday ? 15 : 20;
  const availableTeaching = totalMinutes - breakDuration;

  let numPeriods = Math.round(availableTeaching / 35);
  if (numPeriods < 4) numPeriods = 4;
  if (numPeriods > 8) numPeriods = 8;

  const basePeriodMinutes = Math.floor(availableTeaching / numPeriods);
  const extraMinutes = availableTeaching % numPeriods;
  const breakAfterPeriod = isFriday ? Math.min(4, Math.floor(numPeriods / 2)) : 4;

  const formatMin = (m) => {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const slots = [];
  let currentMinute = totalStart;
  let periodCounter = 1;

  for (let i = 1; i <= numPeriods; i++) {
    const thisPeriodMinutes = basePeriodMinutes + (i <= extraMinutes ? 1 : 0);
    const pStart = currentMinute;
    const pEnd = currentMinute + thisPeriodMinutes;

    slots.push({
      periodNumber: periodCounter,
      slotType: 'TEACHING',
      label: `${periodCounter}${getOrdinalSuffix(periodCounter)}`,
      startTime: formatMin(pStart),
      endTime: formatMin(pEnd),
    });

    currentMinute = pEnd;
    periodCounter++;

    if (i === breakAfterPeriod) {
      const bStart = currentMinute;
      const bEnd = currentMinute + breakDuration;
      slots.push({
        periodNumber: 0,
        slotType: 'RECESS',
        label: 'BREAK',
        startTime: formatMin(bStart),
        endTime: formatMin(bEnd),
      });
      currentMinute = bEnd;
    }
  }

  if (slots.length > 0) {
    slots[slots.length - 1].endTime = formatMin(totalEnd);
  }

  return slots;
};

export const HmTimetableBuilder = ({
  schoolId,
  school,
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

  const [selectedDay, setSelectedDay] = useState(() => {
    const todayIndex = new Date().getDay();
    const dayMap = { 0: 'SUNDAY', 1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY', 4: 'THURSDAY', 5: 'FRIDAY', 6: 'SATURDAY' };
    return dayMap[todayIndex] || 'MONDAY';
  });

  const [academicYear, setAcademicYear] = useState('2025-2026');

  // Local editable timetable state (draft)
  const [editableSlots, setEditableSlots] = useState([]);
  const [editableFridaySlots, setEditableFridaySlots] = useState([]);
  const [editableSchedule, setEditableSchedule] = useState([]);
  const [isDraftDirty, setIsDraftDirty] = useState(false);

  // Modals state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showPrintPreviewModal, setShowPrintPreviewModal] = useState(false);
  const [resetSlotsModalOpen, setResetSlotsModalOpen] = useState(false);
  const [slotManagerOpen, setSlotManagerOpen] = useState(false);

  // Slot Manager form state (for manual dynamic slot editing)
  const [managerTab, setManagerTab] = useState('REGULAR'); // 'REGULAR' | 'FRIDAY'
  const [newSlotNumber, setNewSlotNumber] = useState(8);
  const [newSlotType, setNewSlotType] = useState('TEACHING');
  const [newSlotLabel, setNewSlotLabel] = useState('8th');
  const [newSlotStartTime, setNewSlotStartTime] = useState('12:45');
  const [newSlotEndTime, setNewSlotEndTime] = useState('13:30');

  // Cell allocation modal state
  const [cellModalOpen, setCellModalOpen] = useState(false);
  const [activeCellTarget, setActiveCellTarget] = useState(null); // { classItem, dayOfWeek, periodSlot }
  const [cellSubjectId, setCellSubjectId] = useState('');
  const [cellTeacherId, setCellTeacherId] = useState('');
  const [cellRoomNumber, setCellRoomNumber] = useState('');

  // Operational Timings from School Profile (configured by Admin / HM with reason)
  const schoolTimings = useMemo(() => {
    return (
      schoolTimetable?.schoolDetails?.timings ||
      school?.timings || {
        regular: { startTime: '08:00', endTime: '13:30' },
        friday: { startTime: '07:30', endTime: '12:00' },
      }
    );
  }, [schoolTimetable, school]);

  // Weekly Off Pattern from town calendar configuration (e.g. [0] or [0, 6])
  const weeklyOffDays = useMemo(() => {
    return Array.isArray(schoolTimetable?.weeklyOffDays) && schoolTimetable.weeklyOffDays.length > 0
      ? schoolTimetable.weeklyOffDays
      : [0]; // Sunday default
  }, [schoolTimetable]);

  const isSaturdayOff = weeklyOffDays.includes(6);

  // Active instructional teaching days (dynamically filtered from weekly off configuration)
  const activeTeachingDays = useMemo(() => {
    return ALL_CALENDAR_DAYS.filter((dayItem) => !weeklyOffDays.includes(dayItem.dayNumber));
  }, [weeklyOffDays]);

  // Sorted classes (strictly by numericGrade, clean names without sections)
  const sortedClasses = useMemo(() => {
    return [...classes].sort(
      (firstClass, secondClass) => (Number(firstClass.numericGrade) || 0) - (Number(secondClass.numericGrade) || 0)
    );
  }, [classes]);

  // Normalized active teaching assignments list
  const activeAssignmentsList = useMemo(() => {
    if (Array.isArray(assignments)) return assignments;
    if (Array.isArray(assignments?.activeAssignments)) return assignments.activeAssignments;
    return [];
  }, [assignments]);

  // Primary section lookup map per class
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

  // Helper to resolve designated class teacher
  const getClassDesignatedTeacher = useCallback(
    (classItem) => {
      if (!classItem) return null;
      const classIdString = String(classItem._id);
      const primarySection = primarySectionByClassId.get(classIdString);

      if (primarySection?.classTeacherId) {
        const teacherIdString = String(
          primarySection.classTeacherId._id ||
          primarySection.classTeacherId.userId ||
          primarySection.classTeacherId
        );
        const matchedFaculty = faculty.find(
          (facultyMember) => String(facultyMember.userId || facultyMember._id) === teacherIdString
        );
        if (matchedFaculty) return matchedFaculty;
        if (typeof primarySection.classTeacherId === 'object' && primarySection.classTeacherId.fullName) {
          return primarySection.classTeacherId;
        }
      }

      const matchingAssignment = activeAssignmentsList.find(
        (assignmentRecord) =>
          String(assignmentRecord.classId?._id || assignmentRecord.classId) === classIdString
      );
      if (matchingAssignment) {
        const teacherIdString = String(
          matchingAssignment.teacherId?._id ||
          matchingAssignment.teacherId?.userId ||
          matchingAssignment.teacherId
        );
        const matchedFaculty = faculty.find(
          (facultyMember) => String(facultyMember.userId || facultyMember._id) === teacherIdString
        );
        if (matchedFaculty) return matchedFaculty;
        if (typeof matchingAssignment.teacherId === 'object' && matchingAssignment.teacherId?.fullName) {
          return matchingAssignment.teacherId;
        }
      }

      return null;
    },
    [primarySectionByClassId, activeAssignmentsList, faculty]
  );

  // Fetch school timetable on mount
  useEffect(() => {
    if (schoolId) {
      dispatch(fetchSchoolTimetable({ schoolId, academicYear }));
    }
  }, [dispatch, schoolId, academicYear]);

  // Synchronize local editable state when loaded from server (Zero hardcoded defaults)
  useEffect(() => {
    if (schoolTimetable && Array.isArray(schoolTimetable.periodSlots) && schoolTimetable.periodSlots.length > 0) {
      setEditableSlots(schoolTimetable.periodSlots);
      setEditableFridaySlots(
        Array.isArray(schoolTimetable.fridayPeriodSlots) && schoolTimetable.fridayPeriodSlots.length > 0
          ? schoolTimetable.fridayPeriodSlots
          : generateSynchronizedSlots(schoolTimings?.friday?.startTime, schoolTimings?.friday?.endTime, true)
      );
      setEditableSchedule(schoolTimetable.schedule || []);
      setIsDraftDirty(false);
    } else if (schoolTimings) {
      // 100% Dynamic: Period slots derived directly from this school's configured operational hours in MongoDB
      const dynamicRegular = generateSynchronizedSlots(
        schoolTimings?.regular?.startTime,
        schoolTimings?.regular?.endTime,
        false
      );
      const dynamicFriday = generateSynchronizedSlots(
        schoolTimings?.friday?.startTime,
        schoolTimings?.friday?.endTime,
        true
      );
      setEditableSlots(dynamicRegular);
      setEditableFridaySlots(dynamicFriday);
      setEditableSchedule([]);
      setIsDraftDirty(false);
    }
  }, [schoolTimetable, schoolTimings]);

  // Handle save success
  useEffect(() => {
    if (saveSuccess) {
      toast.success('Official Timetable posted & published! It is now live on all Teachers and Students dashboards.');
      setIsDraftDirty(false);
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

  // Timing Mismatch Analysis & Synchronization Planner
  const timingMismatchAnalysis = useMemo(() => {
    const regSchoolStart = schoolTimings?.regular?.startTime || '08:00';
    const regSchoolEnd = schoolTimings?.regular?.endTime || '13:30';
    const friSchoolStart = schoolTimings?.friday?.startTime || '07:30';
    const friSchoolEnd = schoolTimings?.friday?.endTime || '12:00';

    const regCurrentStart = editableSlots[0]?.startTime || '';
    const regCurrentEnd = editableSlots[editableSlots.length - 1]?.endTime || '';

    const friCurrentStart = editableFridaySlots[0]?.startTime || '';
    const friCurrentEnd = editableFridaySlots[editableFridaySlots.length - 1]?.endTime || '';

    const regularMismatch = Boolean(
      editableSlots.length > 0 &&
      (regCurrentStart !== regSchoolStart || regCurrentEnd !== regSchoolEnd)
    );

    const fridayMismatch = Boolean(
      editableFridaySlots.length === 0 ||
      (friCurrentStart && friCurrentEnd && (friCurrentStart !== friSchoolStart || friCurrentEnd !== friSchoolEnd))
    );

    const proposedRegularSlots = generateSynchronizedSlots(regSchoolStart, regSchoolEnd, false);
    const proposedFridaySlots = generateSynchronizedSlots(friSchoolStart, friSchoolEnd, true);

    const currentRegTeachingCount = editableSlots.filter((slot) => slot.slotType === 'TEACHING').length;
    const proposedRegTeachingCount = proposedRegularSlots.filter((slot) => slot.slotType === 'TEACHING').length;

    const currentFriTeachingCount = (editableFridaySlots.length > 0 ? editableFridaySlots : editableSlots).filter(
      (slot) => slot.slotType === 'TEACHING'
    ).length;
    const proposedFriTeachingCount = proposedFridaySlots.filter((slot) => slot.slotType === 'TEACHING').length;

    const affectedRegEntries = editableSchedule.filter((entry) => {
      if (entry.dayOfWeek === 'FRIDAY') return false;
      return entry.periodNumber > proposedRegTeachingCount;
    });

    const affectedFriEntries = editableSchedule.filter((entry) => {
      if (entry.dayOfWeek !== 'FRIDAY') return false;
      return entry.periodNumber > proposedFriTeachingCount;
    });

    return {
      isMismatch: regularMismatch || fridayMismatch,
      regularMismatch,
      fridayMismatch,
      regSchoolStart,
      regSchoolEnd,
      friSchoolStart,
      friSchoolEnd,
      regCurrentStart,
      regCurrentEnd,
      friCurrentStart,
      friCurrentEnd,
      proposedRegularSlots,
      proposedFridaySlots,
      currentRegTeachingCount,
      proposedRegTeachingCount,
      currentFriTeachingCount,
      proposedFriTeachingCount,
      affectedRegEntries,
      affectedFriEntries,
    };
  }, [schoolTimings, editableSlots, editableFridaySlots, editableSchedule]);

  // Handler to apply proposed synchronized slots to local draft (explicit confirmation)
  const handleApplySyncToDraft = () => {
    if (timingMismatchAnalysis.proposedRegularSlots.length > 0) {
      setEditableSlots(timingMismatchAnalysis.proposedRegularSlots);
    }
    if (timingMismatchAnalysis.proposedFridaySlots.length > 0) {
      setEditableFridaySlots(timingMismatchAnalysis.proposedFridaySlots);
    }
    setIsDraftDirty(true);
    setShowSyncModal(false);
    toast.success(
      'Synchronized bell schedule applied to draft! Review the grid below and click "Post / Publish Timetable" to commit.',
      { duration: 5000 }
    );
  };

  // Active Slots for the currently selected day (Friday uses Friday-specific slots)
  const activeSlots = useMemo(() => {
    if (selectedDay === 'FRIDAY' && editableFridaySlots.length > 0) {
      return editableFridaySlots;
    }
    return editableSlots;
  }, [selectedDay, editableFridaySlots, editableSlots]);

  // Chronologically sorted active slots
  const sortedSlots = useMemo(() => {
    return [...activeSlots].sort(
      (firstSlot, secondSlot) => firstSlot.startTime.localeCompare(secondSlot.startTime)
    );
  }, [activeSlots]);

  // Teaching slots only
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

  // Helper: Check if an early grade class (Grades 1-3) has "All Subjects" assigned to a single teacher
  const getSingleTeacherForEarlyClass = useCallback(
    (classItem, day) => {
      if ((classItem.numericGrade || 0) > 3) return null;
      const classTeachingEntries = teachingSlots
        .map((slot) => getEntryForCell(classItem._id, day, slot.periodNumber))
        .filter(Boolean);

      if (classTeachingEntries.length === 0) return null;

      const firstTeacherId = String(
        classTeachingEntries[0].teacherId?._id ||
        classTeachingEntries[0].teacherId?.userId ||
        classTeachingEntries[0].teacherId ||
        ''
      );
      if (!firstTeacherId) return null;

      const allMatch = classTeachingEntries.every(
        (entry) =>
          String(entry.teacherId?._id || entry.teacherId?.userId || entry.teacherId || '') ===
          firstTeacherId
      );

      if (allMatch && classTeachingEntries.length >= Math.min(3, teachingSlots.length)) {
        const teacherObj = faculty.find(
          (facultyMember) => String(facultyMember.userId || facultyMember._id) === firstTeacherId
        );
        return teacherObj || { fullName: 'Assigned Class Teacher' };
      }
      return null;
    },
    [teachingSlots, getEntryForCell, faculty]
  );

  // Dynamic Real-Time Teacher Free Periods Register
  const teacherFreePeriodsSummary = useMemo(() => {
    return faculty.map((teacher, teacherIndex) => {
      const teacherIdentifier = String(teacher.userId || teacher._id || `teacher_${teacherIndex}`);
      const assignedPeriods = new Set(
        editableSchedule
          .filter(
            (entry) =>
              entry.dayOfWeek === selectedDay &&
              String(entry.teacherId?._id || entry.teacherId?.userId || entry.teacherId) === teacherIdentifier
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
        teacherId: teacherIdentifier,
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
    if (['ASSEMBLY', 'RECESS', 'BREAK'].includes(periodSlot.slotType)) {
      toast.error(`Cannot assign subject during ${periodSlot.label} (${periodSlot.slotType})`);
      return;
    }

    const existingEntry = getEntryForCell(classItem._id, selectedDay, periodSlot.periodNumber);
    const designatedTeacher = getClassDesignatedTeacher(classItem);

    setActiveCellTarget({
      classItem,
      dayOfWeek: selectedDay,
      periodSlot,
    });
    setCellSubjectId(existingEntry?.subjectId?._id || existingEntry?.subjectId || '');
    setCellTeacherId(
      existingEntry?.teacherId?._id ||
      existingEntry?.teacherId?.userId ||
      existingEntry?.teacherId ||
      designatedTeacher?.userId ||
      designatedTeacher?._id ||
      ''
    );
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
        String(scheduleEntry.teacherId?._id || scheduleEntry.teacherId?.userId || scheduleEntry.teacherId) === String(cellTeacherId) &&
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

    const primarySection = primarySectionByClassId.get(String(classItem._id));
    const sectionId = primarySection?._id || sections[0]?._id;

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
    setIsDraftDirty(true);
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
    setIsDraftDirty(true);
    setCellModalOpen(false);
    toast.success(`Period ${periodSlot.label} cleared for ${classItem.name}.`);
  };

  // Assign All Subjects to Single Teacher (Early Grades 1-3)
  const handleAssignAllSubjectsToTeacher = (classItem, teacherId) => {
    if (!teacherId) {
      toast.error('Please select a teacher.');
      return;
    }

    const defaultSubject =
      subjects.find(
        (subjectCandidate) =>
          subjectCandidate.name.toLowerCase().includes('general') ||
          subjectCandidate.name.toLowerCase().includes('english')
      ) || subjects[0];

    const primarySection = primarySectionByClassId.get(String(classItem._id));
    const sectionId = primarySection?._id || sections[0]?._id;

    const filtered = editableSchedule.filter(
      (scheduleEntry) =>
        !(String(scheduleEntry.classId?._id || scheduleEntry.classId) === String(classItem._id) && scheduleEntry.dayOfWeek === selectedDay)
    );

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
    setIsDraftDirty(true);
    toast.success(`Assigned "ALL SUBJECTS" in ${classItem.name} to designated Class Teacher.`);
  };

  // Copy Current Day's Schedule across active working days dynamically
  const handleCopyDayToAllWeekdays = () => {
    const currentDayEntries = editableSchedule.filter((scheduleEntry) => scheduleEntry.dayOfWeek === selectedDay);
    if (currentDayEntries.length === 0) {
      toast.error(`No timetable entries configured on ${selectedDay} to copy.`);
      return;
    }

    // Filter target days to only active teaching days configured for this school
    const targetDays = activeTeachingDays
      .map((d) => d.key)
      .filter((dayKey) => dayKey !== selectedDay);

    const retainedEntries = editableSchedule.filter((scheduleEntry) => scheduleEntry.dayOfWeek === selectedDay);
    const duplicatedEntries = [];

    const fridaySlotNumbers = new Set(
      (editableFridaySlots.length > 0 ? editableFridaySlots : editableSlots)
        .filter((slot) => slot.slotType === 'TEACHING')
        .map((slot) => slot.periodNumber)
    );

    for (const targetDay of targetDays) {
      for (const entry of currentDayEntries) {
        // Guard Friday from orphan periods past its shorter closing time
        if (targetDay === 'FRIDAY' && !fridaySlotNumbers.has(entry.periodNumber)) {
          continue;
        }
        duplicatedEntries.push({
          ...entry,
          dayOfWeek: targetDay,
        });
      }
    }

    setEditableSchedule([...retainedEntries, ...duplicatedEntries]);
    setIsDraftDirty(true);
    toast.success(`Copied ${selectedDay}'s routine across active working days (${targetDays.join(', ')}) successfully!`);
  };

  // Regenerate period slots dynamically from school's configured timings
  const handleConfirmResetSlots = () => {
    const dynamicRegular = generateSynchronizedSlots(
      schoolTimings?.regular?.startTime,
      schoolTimings?.regular?.endTime,
      false
    );
    const dynamicFriday = generateSynchronizedSlots(
      schoolTimings?.friday?.startTime,
      schoolTimings?.friday?.endTime,
      true
    );
    setEditableSlots(dynamicRegular);
    setEditableFridaySlots(dynamicFriday);
    setIsDraftDirty(true);
    toast.success(
      `Period slots regenerated dynamically from school operational hours (${schoolTimings?.regular?.startTime || '08:00'}–${schoolTimings?.regular?.endTime || '13:30'} Regular, ${schoolTimings?.friday?.startTime || '07:30'}–${schoolTimings?.friday?.endTime || '12:00'} Friday).`
    );
    setResetSlotsModalOpen(false);
  };

  // Manual Custom Slot Management Handlers
  const handleAddCustomSlot = (e) => {
    e.preventDefault();
    const isFridayManager = managerTab === 'FRIDAY';
    const targetSlots = isFridayManager ? editableFridaySlots : editableSlots;

    const newSlot = {
      periodNumber: Number(newSlotNumber),
      slotType: newSlotType,
      label: newSlotLabel.trim() || `${newSlotNumber}${getOrdinalSuffix(newSlotNumber)}`,
      startTime: newSlotStartTime,
      endTime: newSlotEndTime,
    };

    // Sort by startTime
    const updated = [...targetSlots, newSlot].sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (isFridayManager) {
      setEditableFridaySlots(updated);
    } else {
      setEditableSlots(updated);
    }

    setIsDraftDirty(true);
    toast.success(`Slot "${newSlot.label}" added to ${managerTab} schedule!`);
  };

  const handleDeleteSlot = (periodNumber, isFridayManager) => {
    const targetSlots = isFridayManager ? editableFridaySlots : editableSlots;
    const updated = targetSlots.filter((s) => s.periodNumber !== periodNumber);

    if (isFridayManager) {
      setEditableFridaySlots(updated);
    } else {
      setEditableSlots(updated);
    }

    setIsDraftDirty(true);
    toast.success('Period slot removed from draft schedule.');
  };

  // Save & Publish Timetable to Server (Authoritative endpoint)
  const handlePostTimetable = () => {
    if (editableSlots.length === 0) {
      toast.error('At least one period slot is required.');
      return;
    }

    const payload = {
      schoolId,
      academicYear,
      status: 'ACTIVE',
      version: schoolTimetable?.version,
      periodSlots: editableSlots,
      fridayPeriodSlots: editableFridaySlots,
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
      {/* ─── OFFICIAL GOVERNMENT INSTITUTIONAL BANNER ─── */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#0a1829] via-[#102033] to-[#162a42] text-white shadow-xl border border-slate-800/80 relative overflow-hidden space-y-6">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/15 via-transparent to-transparent pointer-events-none" />

        {/* Institutional Authority Badges & Real-time Live HUD */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-white/10 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#006AC7] text-white shadow-xs">
              DMC LIAQUATABAD TOWN CENTRE
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white/90 border border-white/10">
              EDUCATION DEPARTMENT
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              OFFICIAL MASTER TIMETABLE REGISTER
            </span>
          </div>

          <div className="shrink-0">
            <LivePeriodBadge liveStatus={liveStatus} isDark={true} />
          </div>
        </div>

        {/* Main Row: School Title + Prominent Action Buttons */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 relative z-10">
          <div className="space-y-2 min-w-0 max-w-4xl">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase leading-snug drop-shadow-xs">
              {schoolTimetable?.schoolDetails?.name || 'BABA-E-URDU MOLVI ABDUL HAQ BOYS ELEMENTARY LT-11 E & ENGLISH MEDIUM SCHOOL'}
            </h1>
            <p className="text-xs md:text-sm text-slate-300/90 font-medium leading-relaxed">
              Official municipal teaching allocation matrix • Unified class routine • Academic Session <span className="font-bold text-white">{academicYear}</span>
            </p>
          </div>

          {/* Action Buttons Group */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 xl:pt-0">
            {isDraftDirty && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Unpublished Draft Edits
              </span>
            )}

            <button
              onClick={() => dispatch(fetchSchoolTimetable({ schoolId, academicYear }))}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Refresh Timetable from Server"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setShowPrintPreviewModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-white text-xs font-bold transition cursor-pointer shadow-sm active:scale-98"
              title="Open Official A4 Timetable Preview"
            >
              <Eye className="w-4 h-4 text-blue-200" />
              <span>A4 Preview</span>
            </button>

            <button
              onClick={() => {
                setShowPrintPreviewModal(true);
                let hasCleanedUp = false;
                const cleanupPrint = () => {
                  if (!hasCleanedUp) {
                    hasCleanedUp = true;
                    document.body.classList.remove('print-timetable-mode');
                    window.removeEventListener('afterprint', cleanupPrint);
                  }
                };
                window.addEventListener('afterprint', cleanupPrint);
                document.body.classList.add('print-timetable-mode');
                setTimeout(() => {
                  window.print();
                  setTimeout(cleanupPrint, 4000);
                }, 150);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition cursor-pointer shadow-sm active:scale-98"
              title="Print Master Timetable"
            >
              <Printer className="w-4 h-4 text-blue-300" />
              <span>Print Sheet</span>
            </button>

            <button
              onClick={handlePostTimetable}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-900/40 cursor-pointer disabled:opacity-50 active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Posting...' : 'Post / Publish Timetable'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── TIMING MISMATCH NOTICE BANNER & SYNC ACTION ─── */}
      {timingMismatchAnalysis.isMismatch && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-800 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-amber-950 uppercase tracking-tight">
                  School Timings &amp; Timetable Period Slots Mismatch Detected
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-200 text-amber-900 uppercase">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed max-w-4xl">
                Configured school hours are <strong>Regular: {timingMismatchAnalysis.regSchoolStart}–{timingMismatchAnalysis.regSchoolEnd}</strong> and <strong>Friday: {timingMismatchAnalysis.friSchoolStart}–{timingMismatchAnalysis.friSchoolEnd}</strong>, but timetable period slots span <strong>Regular: {timingMismatchAnalysis.regCurrentStart || '—'}–{timingMismatchAnalysis.regCurrentEnd || '—'}</strong>. Review synchronization to align bells, attendance windows, and periods without silently overwriting active teaching duties.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSyncModal(true)}
            className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-md shadow-amber-900/20 cursor-pointer active:scale-98"
          >
            <Sparkles className="w-4 h-4" />
            <span>Review &amp; Sync Timings</span>
          </button>
        </div>
      )}

      {/* ─── ACTION TOOLBAR & CONTROLS ─── */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Dynamic Day Selector Pills (Zero hardcoding: derived from calendar & weeklyOffDays) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-[#8094A8] mr-1">Active Day:</span>
          {ALL_CALENDAR_DAYS.map((dayItem) => {
            const day = dayItem.key;
            const isSelected = selectedDay === day;
            const isToday = liveStatus?.currentDay === day;
            const dayEntryCount = editableSchedule.filter((scheduleEntry) => scheduleEntry.dayOfWeek === day).length;
            const isFridayPill = day === 'FRIDAY';
            const isDayWeeklyOff = weeklyOffDays.includes(dayItem.dayNumber);

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#102033] text-white shadow-md'
                    : isDayWeeklyOff
                    ? 'bg-slate-100/70 border border-slate-200 text-slate-400 hover:bg-slate-100'
                    : 'bg-slate-50 border border-slate-200 text-[#526477] hover:bg-slate-100'
                }`}
              >
                <span>{day}</span>
                {isFridayPill && !isDayWeeklyOff && (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    isSelected ? 'bg-indigo-400/30 text-indigo-200' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    Jummah
                  </span>
                )}
                {isDayWeeklyOff && (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    isSelected ? 'bg-amber-400/30 text-amber-200' : 'bg-slate-200 text-slate-600'
                  }`}>
                    Off
                  </span>
                )}
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
            title="Copy current day's routine to all active working days"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy {selectedDay} to All Days</span>
          </button>

          <button
            onClick={() => setSlotManagerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100/80 text-indigo-700 text-xs font-bold transition cursor-pointer"
            title="Manage, add, or adjust custom period slots dynamically"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Manage Period Slots</span>
          </button>

          <button
            onClick={() => setShowSyncModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition cursor-pointer"
            title="Review school bell timings & synchronize period slots"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Sync Bell Schedule</span>
          </button>

          <button
            onClick={() => setResetSlotsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[#526477] text-xs font-bold transition cursor-pointer"
            title="Recalculate period slots dynamically from school's operational hours in DB"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Sync to School Hours</span>
          </button>
        </div>
      </div>

      {/* Weekly-Off Info Notice (Dynamic) */}
      {weeklyOffDays.includes(DAY_TO_NUMBER_MAP[selectedDay]) && (
        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 text-slate-800 flex items-center gap-3 animate-in fade-in">
          <Info className="w-5 h-5 text-slate-500 shrink-0" />
          <div className="text-xs">
            <strong>Official Weekly-Off Day:</strong> {selectedDay} is configured as a weekly holiday under this school's calendar policy. Routine instructional periods are optional or suspended.
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MASTER GOVERNMENT TIMETABLE MATRIX (FLUID RESPONSIVE FULL-WIDTH)    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="overflow-x-auto rounded-3xl bg-white border border-slate-200/90 shadow-sm print:border-none print:shadow-none">
        <table className="w-full text-left border-collapse min-w-[850px] lg:min-w-0 table-fixed">
          {/* Header Row 1: Period Numbers */}
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-xs font-black text-[#102033] uppercase">
              <th className="py-3 px-3 sm:px-4 w-40 sm:w-44 md:w-48 lg:w-48 xl:w-52 shrink-0 sticky left-0 bg-slate-100 z-20 border-r border-slate-300">
                <div className="flex flex-col">
                  <span className="tracking-wider">PERIODS</span>
                  <span className="text-[10px] font-normal text-[#526477] lowercase truncate">
                    classes &amp; in-charge
                  </span>
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
                      className="py-3 px-1 sm:px-2 text-center w-12 sm:w-14 md:w-16 shrink-0 bg-amber-50/80 border-r border-amber-200 text-amber-900 font-black tracking-widest text-[10px]"
                    >
                      BREAK
                    </th>
                  );
                }

                return (
                  <th
                    key={slot.periodNumber}
                    className={`py-3 px-2 text-center border-r border-slate-200 last:border-r-0 ${
                      isLiveSlot ? 'bg-emerald-500/15 border-b-2 border-b-emerald-600' : ''
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className={`text-xs sm:text-sm font-black ${isLiveSlot ? 'text-emerald-800' : 'text-[#102033]'}`}>
                        {slot.label}
                      </span>
                      {isLiveSlot && (
                        <span className="mt-0.5 px-1.5 py-0.2 rounded text-[8px] font-black bg-emerald-600 text-white animate-pulse">
                          LIVE
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>

            {/* Header Row 2: Standard Timing Slots */}
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono font-bold text-[#526477]">
              <th className="py-2 px-3 sm:px-4 w-40 sm:w-44 md:w-48 lg:w-48 xl:w-52 shrink-0 sticky left-0 bg-slate-50 z-20 border-r border-slate-300 text-left font-sans">
                Time (PKT)
              </th>
              {sortedSlots.map((slot) => {
                const isBreak = ['RECESS', 'BREAK'].includes(slot.slotType) || slot.periodNumber === 0;
                return (
                  <th
                    key={`time_${slot.periodNumber}`}
                    className={`py-2 px-1 sm:px-2 text-center border-r border-slate-200 last:border-r-0 ${
                      isBreak ? 'w-12 sm:w-14 md:w-16 shrink-0 bg-amber-50/50 border-r-amber-200 text-amber-800 text-[9px] sm:text-[10px]' : ''
                    }`}
                  >
                    <span className="truncate block">{slot.startTime}–{slot.endTime}</span>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Matrix Rows: One Clean Row Per Class */}
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
                const designatedTeacher = getClassDesignatedTeacher(classItem);
                const teacherDisplayName =
                  designatedTeacher?.fullName ||
                  earlyClassSingleTeacher?.fullName ||
                  'Teacher: Not assigned';

                return (
                  <tr key={classItem._id} className="hover:bg-slate-50/70 transition">
                    {/* Class & In-charge Column */}
                    <td className="py-3 px-3 sm:px-4 font-bold text-[#102033] w-40 sm:w-44 md:w-48 lg:w-48 xl:w-52 shrink-0 sticky left-0 bg-white border-r border-slate-300 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-black text-[#102033] truncate">{classItem.name}</div>
                          <div className="text-[10px] sm:text-[11px] font-medium text-[#526477] flex items-center gap-1 mt-0.5 min-w-0">
                            <User className="w-3 h-3 text-[#8094A8] shrink-0" />
                            <span
                              className={`truncate max-w-[100px] sm:max-w-[120px] lg:max-w-[130px] ${
                                designatedTeacher ? 'font-bold text-[#102033]' : 'text-[#8094A8]'
                              }`}
                              title={teacherDisplayName}
                            >
                              {teacherDisplayName}
                            </span>
                          </div>
                        </div>

                        {/* Early Grade Quick Assign Button */}
                        {isEarlyClass && (
                          <button
                            type="button"
                            onClick={() => {
                              const targetTeacher =
                                designatedTeacher ||
                                (faculty.length > 0 ? faculty[0] : null);
                              const targetTeacherId =
                                targetTeacher?.userId ||
                                targetTeacher?._id;

                              if (targetTeacherId) {
                                handleAssignAllSubjectsToTeacher(classItem, targetTeacherId);
                              } else {
                                toast.error('No faculty members available to assign.');
                              }
                            }}
                            className="p-1 sm:p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#006AC7] text-[9px] sm:text-[10px] font-bold cursor-pointer transition shrink-0 active:scale-95"
                            title="Assign Single Teacher to All Subjects"
                          >
                            All
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

                      if (isBreak) {
                        return (
                          <td
                            key="cell_break"
                            className="py-2 px-1 text-center w-12 sm:w-14 md:w-16 shrink-0 bg-amber-50/40 border-r border-amber-200 text-amber-700 font-mono text-[10px] font-bold tracking-widest select-none"
                          >
                            <span className="block writing-vertical-lr text-amber-800 font-bold uppercase text-[9px]">
                              BREAK
                            </span>
                          </td>
                        );
                      }

                      const entry = getEntryForCell(classItem._id, selectedDay, slot.periodNumber);
                      const subjectObj = subjects.find(
                        (subjectDefinition) =>
                          String(subjectDefinition._id) === String(entry?.subjectId?._id || entry?.subjectId)
                      );
                      const teacherObj = faculty.find(
                        (facultyMember) =>
                          String(facultyMember.userId || facultyMember._id) ===
                          String(entry?.teacherId?._id || entry?.teacherId?.userId || entry?.teacherId)
                      );

                      const isAllocated = Boolean(entry && (subjectObj || teacherObj));

                      return (
                        <td
                          key={slot.periodNumber}
                          onClick={() => handleOpenCellEditor(classItem, slot)}
                          className={`py-2 px-1.5 sm:px-2 border-r border-slate-200 last:border-r-0 cursor-pointer transition group ${
                            isLiveSlot ? 'bg-emerald-500/10' : 'hover:bg-blue-50/40'
                          }`}
                        >
                          {isAllocated ? (
                            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50/90 border border-blue-200/80 group-hover:border-[#006AC7] transition space-y-0.5">
                              <div className="font-black text-[11px] sm:text-xs text-[#006AC7] uppercase tracking-wide truncate">
                                {subjectObj?.name || 'ALL SUBJECTS'}
                              </div>

                              <div className="text-[10px] sm:text-[11px] font-bold text-[#102033] uppercase truncate flex items-center gap-1">
                                <span>{teacherObj?.fullName || 'Assigned Faculty'}</span>
                              </div>

                              {entry?.roomNumber && (
                                <div className="text-[8px] sm:text-[9px] font-mono text-[#8094A8]">
                                  R: {entry.roomNumber}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-11 sm:h-12 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-[10px] font-bold text-[#8094A8] group-hover:border-[#006AC7] group-hover:text-[#006AC7] group-hover:bg-white transition">
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
      {/* TEACHER FREE PERIODS REGISTER FOOTER                                */}
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
                Substitute duty &amp; proxy allocation intelligence calculated dynamically from active timetable slots.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-[#526477] bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span>Total Faculty: {faculty.length}</span>
            <span>•</span>
            <span className="text-emerald-700">Teaching Slots: {teachingSlots.length}</span>
          </div>
        </div>

        {/* Free Periods Grid Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {teacherFreePeriodsSummary.map((teacherSummary, summaryIndex) => (
            <div
              key={teacherSummary.teacherId || `teacher_summary_${summaryIndex}`}
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
                  {teacherSummary.freePeriods.length > 0 ? (
                    <span className="px-2 py-0.5 rounded-lg bg-blue-100/80 text-blue-900 border border-blue-200">
                      {teacherSummary.formatted}
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

      {/* ─── DYNAMIC PERIOD SLOTS MANAGER MODAL ─── */}
      {slotManagerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-[#102033] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#006AC7]" />
                  <span>Dynamic Period Slot Manager</span>
                </h3>
                <p className="text-xs text-[#526477] mt-0.5">
                  Customize, add, or remove period slots without hardcoded limits.
                </p>
              </div>
              <button
                onClick={() => setSlotManagerOpen(false)}
                className="p-1 rounded-lg text-[#8094A8] hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Manager Tabs: Regular Days vs Friday */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setManagerTab('REGULAR')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  managerTab === 'REGULAR'
                    ? 'bg-[#102033] text-white'
                    : 'bg-slate-100 text-[#526477] hover:bg-slate-200'
                }`}
              >
                Regular Days Slots ({editableSlots.length})
              </button>
              <button
                type="button"
                onClick={() => setManagerTab('FRIDAY')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  managerTab === 'FRIDAY'
                    ? 'bg-[#102033] text-white'
                    : 'bg-slate-100 text-[#526477] hover:bg-slate-200'
                }`}
              >
                Friday Jummah Slots ({editableFridaySlots.length})
              </button>
            </div>

            {/* Existing Slots Table */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#526477] uppercase tracking-wider">
                Current {managerTab} Period Slots:
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-[#526477] uppercase font-bold text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Slot #</th>
                      <th className="py-2 px-3">Label</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Start</th>
                      <th className="py-2 px-3">End</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(managerTab === 'FRIDAY' ? editableFridaySlots : editableSlots).map((slot) => (
                      <tr key={`${slot.periodNumber}-${slot.startTime}`} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold">
                          {slot.slotType === 'RECESS' ? 'BREAK' : slot.periodNumber}
                        </td>
                        <td className="py-2 px-3 font-bold">{slot.label}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            slot.slotType === 'RECESS' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {slot.slotType}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono">{slot.startTime}</td>
                        <td className="py-2 px-3 font-mono">{slot.endTime}</td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(slot.periodNumber, managerTab === 'FRIDAY')}
                            className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Remove this slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Custom Slot Form */}
            <form onSubmit={handleAddCustomSlot} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-[#102033] flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#006AC7]" />
                <span>Add Custom Period Slot to {managerTab}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-[#526477] uppercase mb-1">Period #</label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={newSlotNumber}
                    onChange={(e) => setNewSlotNumber(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#526477] uppercase mb-1">Label</label>
                  <input
                    type="text"
                    value={newSlotLabel}
                    onChange={(e) => setNewSlotLabel(e.target.value)}
                    placeholder="e.g. 8th, Library"
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#526477] uppercase mb-1">Type</label>
                  <select
                    value={newSlotType}
                    onChange={(e) => setNewSlotType(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    <option value="TEACHING">TEACHING</option>
                    <option value="RECESS">RECESS</option>
                    <option value="ASSEMBLY">ASSEMBLY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#526477] uppercase mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newSlotStartTime}
                    onChange={(e) => setNewSlotStartTime(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-mono font-bold bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#526477] uppercase mb-1">End Time</label>
                  <input
                    type="time"
                    value={newSlotEndTime}
                    onChange={(e) => setNewSlotEndTime(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-mono font-bold bg-white"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#006AC7] hover:bg-[#005299] text-white text-xs font-bold transition cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insert Slot</span>
                </button>
              </div>
            </form>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSlotManagerOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

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
                  {faculty.map((facultyMember, facultyIndex) => {
                    const memberIdentifier = String(
                      facultyMember.userId || facultyMember._id || `faculty_${facultyIndex}`
                    );
                    return (
                      <option key={memberIdentifier} value={memberIdentifier}>
                        {facultyMember.fullName} ({facultyMember.designation || 'Teacher'})
                      </option>
                    );
                  })}
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

      {/* Dynamic Reset to Configured School Hours Confirmation Dialog */}
      <ConfirmModal
        isOpen={resetSlotsModalOpen}
        title="Sync Period Slots to School Operating Hours"
        message={`Recalculate period slots dynamically to match this school's configured operational hours (Regular: ${schoolTimings?.regular?.startTime || '08:00'}–${schoolTimings?.regular?.endTime || '13:30'}, Friday: ${schoolTimings?.friday?.startTime || '07:30'}–${schoolTimings?.friday?.endTime || '12:00'})?`}
        note="This calculates instructional periods and recess dynamically from the school's configured operating hours in MongoDB without any static hardcoded assumptions."
        confirmText="Sync to School Hours"
        confirmVariant="warning"
        onConfirm={handleConfirmResetSlots}
        onCancel={() => setResetSlotsModalOpen(false)}
      />

      {/* Interactive Timing Synchronization Preview & Confirmation Modal */}
      <TimingSyncPreviewModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        schoolName={schoolTimetable?.schoolDetails?.name || ''}
        mismatchAnalysis={timingMismatchAnalysis}
        onApplySync={handleApplySyncToDraft}
      />

      {/* Official A4 Timetable Print & Portal Preview Modal */}
      <TimetablePrintPreviewModal
        isOpen={showPrintPreviewModal}
        onClose={() => setShowPrintPreviewModal(false)}
        schoolName={schoolTimetable?.schoolDetails?.name || ''}
        academicYear={academicYear}
        classes={classes}
        slots={sortedSlots}
        fridaySlots={editableFridaySlots}
        weeklyOffDays={weeklyOffDays}
        schedule={editableSchedule}
        subjects={subjects}
        faculty={faculty}
        primarySectionByClassId={primarySectionByClassId}
        initialDay={selectedDay}
      />
    </div>
  );
};

export default HmTimetableBuilder;
