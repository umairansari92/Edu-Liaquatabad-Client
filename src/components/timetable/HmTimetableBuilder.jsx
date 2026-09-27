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

  const [activeViewMode, setActiveViewMode] = useState('LIVE_MONITOR'); // 'LIVE_MONITOR' | 'BUILDER'
  const [selectedDay, setSelectedDay] = useState(() => {
    const todayIndex = new Date().getDay(); // 0 is Sun, 1 is Mon...
    const dayMap = { 1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY', 4: 'THURSDAY', 5: 'FRIDAY', 6: 'SATURDAY' };
    return dayMap[todayIndex] || 'MONDAY';
  });

  const [academicYear, setAcademicYear] = useState('2025-2026');

  // Builder local editable state
  const [editableSlots, setEditableSlots] = useState([]);
  const [editableSchedule, setEditableSchedule] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  // Cell edit modal
  const [cellModalOpen, setCellModalOpen] = useState(false);
  const [activeCellTarget, setActiveCellTarget] = useState(null); // { dayOfWeek, periodNumber }
  const [cellSubjectId, setCellSubjectId] = useState('');
  const [cellTeacherId, setCellTeacherId] = useState('');
  const [cellRoomNumber, setCellRoomNumber] = useState('');

  // Slot editor modal
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [newSlotNumber, setNewSlotNumber] = useState(1);
  const [newSlotType, setNewSlotType] = useState('TEACHING');
  const [newSlotLabel, setNewSlotLabel] = useState('');
  const [newSlotStartTime, setNewSlotStartTime] = useState('08:00');
  const [newSlotEndTime, setNewSlotEndTime] = useState('08:45');

  // Load timetable on mount or when school changes
  useEffect(() => {
    if (schoolId) {
      dispatch(fetchSchoolTimetable({ schoolId, academicYear }));
    }
  }, [dispatch, schoolId, academicYear]);

  // Synchronize local editable state when schoolTimetable is loaded
  useEffect(() => {
    if (schoolTimetable) {
      setEditableSlots(schoolTimetable.periodSlots || []);
      setEditableSchedule(schoolTimetable.schedule || []);
    } else {
      // Default slots template if none configured
      const defaultSlots = [
        { periodNumber: 0, slotType: 'ASSEMBLY', label: 'Morning Assembly', startTime: '08:00', endTime: '08:20' },
        { periodNumber: 1, slotType: 'TEACHING', label: 'Period 1', startTime: '08:20', endTime: '09:05' },
        { periodNumber: 2, slotType: 'TEACHING', label: 'Period 2', startTime: '09:05', endTime: '09:50' },
        { periodNumber: 3, slotType: 'RECESS', label: 'Recess / Interval', startTime: '10:30', endTime: '11:00' },
        { periodNumber: 4, slotType: 'TEACHING', label: 'Period 3', startTime: '11:00', endTime: '11:45' },
        { periodNumber: 5, slotType: 'TEACHING', label: 'Period 4', startTime: '11:45', endTime: '12:30' },
      ];
      setEditableSlots(defaultSlots);
      setEditableSchedule([]);
    }
  }, [schoolTimetable]);

  // Handle save success / error
  useEffect(() => {
    if (saveSuccess) {
      toast.success('Timetable published & live monitor updated successfully!');
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

  // Sections filtered by selected class
  const availableSections = useMemo(() => {
    if (!selectedClassId) return sections;
    return sections.filter((sec) => String(sec.classId?._id || sec.classId) === String(selectedClassId));
  }, [sections, selectedClassId]);

  // Auto-select first class & section if none selected
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0]._id);
    }
  }, [classes, selectedClassId]);

  useEffect(() => {
    if (availableSections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(availableSections[0]._id);
    }
  }, [availableSections, selectedSectionId]);

  // Helper: Find entry in schedule for a specific day, period, section
  const findScheduleEntry = useCallback(
    (day, periodNum, secId) => {
      return editableSchedule.find(
        (item) =>
          item.dayOfWeek === day &&
          item.periodNumber === periodNum &&
          String(item.sectionId?._id || item.sectionId) === String(secId)
      );
    },
    [editableSchedule]
  );

  // Helper: Open Cell Editor
  const handleOpenCellEditor = (day, periodNum) => {
    const slot = editableSlots.find((s) => s.periodNumber === periodNum);
    if (slot && ['ASSEMBLY', 'RECESS'].includes(slot.slotType)) {
      toast.error(`Cannot assign classes to non-teaching slot: ${slot.label}`);
      return;
    }

    const existing = findScheduleEntry(day, periodNum, selectedSectionId);
    setActiveCellTarget({ dayOfWeek: day, periodNumber: periodNum });
    setCellSubjectId(existing?.subjectId?._id || existing?.subjectId || '');
    setCellTeacherId(existing?.teacherId?._id || existing?.teacherId || '');
    setCellRoomNumber(existing?.roomNumber || '');
    setCellModalOpen(true);
  };

  // Helper: Save Cell Edit
  const handleSaveCellAllocation = () => {
    if (!activeCellTarget || !selectedClassId || !selectedSectionId) return;

    if (!cellSubjectId) {
      toast.error('Subject is required for teaching period.');
      return;
    }
    if (!cellTeacherId) {
      toast.error('Teacher is required for teaching period.');
      return;
    }

    // Verify if teacher is authorized via TeachingAssignment
    const isAssigned = assignments.some(
      (asg) =>
        String(asg.teacherId?._id || asg.teacherId) === String(cellTeacherId) &&
        String(asg.classId?._id || asg.classId) === String(selectedClassId) &&
        String(asg.sectionId?._id || asg.sectionId) === String(selectedSectionId) &&
        String(asg.subjectId?._id || asg.subjectId) === String(cellSubjectId) &&
        asg.status === 'ACTIVE'
    );

    if (!isAssigned) {
      toast.error(
        'Warning: Selected faculty does not hold an active TeachingAssignment for this subject & section. Server validation requires an active assignment.'
      );
    }

    // Check teacher clash in local state
    const teacherClash = editableSchedule.find(
      (item) =>
        item.dayOfWeek === activeCellTarget.dayOfWeek &&
        item.periodNumber === activeCellTarget.periodNumber &&
        String(item.teacherId?._id || item.teacherId) === String(cellTeacherId) &&
        String(item.sectionId?._id || item.sectionId) !== String(selectedSectionId)
    );

    if (teacherClash) {
      toast.error(
        `Clash detected: Selected teacher is already teaching another section on ${activeCellTarget.dayOfWeek} period ${activeCellTarget.periodNumber}.`
      );
      return;
    }

    // Remove old entry for this day+period+section
    const filtered = editableSchedule.filter(
      (item) =>
        !(
          item.dayOfWeek === activeCellTarget.dayOfWeek &&
          item.periodNumber === activeCellTarget.periodNumber &&
          String(item.sectionId?._id || item.sectionId) === String(selectedSectionId)
        )
    );

    // Append updated entry
    const newEntry = {
      dayOfWeek: activeCellTarget.dayOfWeek,
      periodNumber: activeCellTarget.periodNumber,
      classId: selectedClassId,
      sectionId: selectedSectionId,
      subjectId: cellSubjectId,
      teacherId: cellTeacherId,
      roomNumber: cellRoomNumber.trim(),
    };

    setEditableSchedule([...filtered, newEntry]);
    setCellModalOpen(false);
    toast.success('Period allocated.');
  };

  // Helper: Clear Cell
  const handleClearCellAllocation = () => {
    if (!activeCellTarget || !selectedSectionId) return;
    const filtered = editableSchedule.filter(
      (item) =>
        !(
          item.dayOfWeek === activeCellTarget.dayOfWeek &&
          item.periodNumber === activeCellTarget.periodNumber &&
          String(item.sectionId?._id || item.sectionId) === String(selectedSectionId)
        )
    );
    setEditableSchedule(filtered);
    setCellModalOpen(false);
    toast.success('Period assignment cleared.');
  };

  // Helper: Add Period Slot
  const handleAddSlot = () => {
    if (newSlotStartTime >= newSlotEndTime) {
      toast.error('Slot end time must be after start time.');
      return;
    }
    if (editableSlots.some((s) => s.periodNumber === Number(newSlotNumber))) {
      toast.error(`Period number ${newSlotNumber} already exists.`);
      return;
    }

    const newSlot = {
      periodNumber: Number(newSlotNumber),
      slotType: newSlotType,
      label: newSlotLabel.trim() || `Period ${newSlotNumber}`,
      startTime: newSlotStartTime,
      endTime: newSlotEndTime,
    };

    const updated = [...editableSlots, newSlot].sort((a, b) => a.startTime.localeCompare(b.startTime));
    setEditableSlots(updated);
    setSlotModalOpen(false);
    toast.success('Period slot added.');
  };

  // Helper: Remove Period Slot
  const handleRemoveSlot = (periodNum) => {
    if (editableSchedule.some((item) => item.periodNumber === periodNum)) {
      if (!window.confirm('Deleting this slot will also remove all scheduled classes in this period. Proceed?')) {
        return;
      }
    }
    setEditableSlots(editableSlots.filter((s) => s.periodNumber !== periodNum));
    setEditableSchedule(editableSchedule.filter((item) => item.periodNumber !== periodNum));
  };

  // Helper: Save Entire Timetable to Server
  const handleSaveToServer = () => {
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
      schedule: editableSchedule.map((entry) => ({
        dayOfWeek: entry.dayOfWeek,
        periodNumber: entry.periodNumber,
        classId: entry.classId?._id || entry.classId,
        sectionId: entry.sectionId?._id || entry.sectionId,
        subjectId: entry.subjectId?._id || entry.subjectId || null,
        teacherId: entry.teacherId?._id || entry.teacherId || null,
        roomNumber: entry.roomNumber || '',
      })),
    };

    dispatch(saveTimetable(payload));
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Control Header & Live Period HUD ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#006AC7]" />
            <h2 className="text-lg font-bold text-[#102033]">School Timetable & Real-Time Monitor</h2>
          </div>
          <p className="text-xs text-[#526477]">
            Persistent baseline schedule. Changes update the town live monitoring matrix instantly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <LivePeriodBadge liveStatus={liveStatus} />

          <button
            onClick={() => dispatch(fetchSchoolTimetable({ schoolId, academicYear }))}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#526477] transition shadow-sm cursor-pointer"
            title="Refresh Timetable"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Mode Selector & Sub-controls ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-slate-100 border border-slate-200/60">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveViewMode('LIVE_MONITOR')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeViewMode === 'LIVE_MONITOR'
                ? 'bg-[#006AC7] text-white shadow-sm'
                : 'text-[#526477] hover:text-[#102033] hover:bg-white/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Today Live Monitor</span>
          </button>

          <button
            onClick={() => setActiveViewMode('BUILDER')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeViewMode === 'BUILDER'
                ? 'bg-[#006AC7] text-white shadow-sm'
                : 'text-[#526477] hover:text-[#102033] hover:bg-white/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Timetable Builder & Editor</span>
          </button>
        </div>

        {activeViewMode === 'BUILDER' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSlotModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#102033] hover:bg-slate-50 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#006AC7]" />
              <span>Configure Slots</span>
            </button>

            <button
              onClick={handleSaveToServer}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#4B7F3A] hover:bg-[#3D682F] text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Publishing...' : 'Save & Publish Timetable'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODE 1: LIVE CLASSROOM MONITOR MATRIX                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeViewMode === 'LIVE_MONITOR' && (
        <div className="space-y-4">
          {/* Day Selector Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8094A8] mr-2">Day:</span>
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDay === day;
              const isToday = liveStatus?.currentDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#102033] text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-[#526477] hover:bg-slate-50'
                  }`}
                >
                  <span>{day}</span>
                  {isToday && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Today in Karachi" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-[#8094A8] uppercase tracking-wider">
                  <th className="py-3 px-4 w-48 sticky left-0 bg-slate-50 z-10 border-r border-slate-200/80">
                    Class & Section
                  </th>
                  {editableSlots.map((slot) => {
                    const isLiveSlot =
                      liveStatus?.currentDay === selectedDay &&
                      liveStatus?.activeSlot?.periodNumber === slot.periodNumber;

                    return (
                      <th
                        key={slot.periodNumber}
                        className={`py-3 px-3 text-center border-r border-slate-200/60 last:border-r-0 ${
                          isLiveSlot ? 'bg-emerald-500/15 border-b-2 border-b-emerald-500' : ''
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span className={`font-bold ${isLiveSlot ? 'text-emerald-800' : 'text-[#102033]'}`}>
                            {slot.label}
                          </span>
                          <span className="text-[10px] font-mono text-[#8094A8]">
                            {slot.startTime}–{slot.endTime}
                          </span>
                          {isLiveSlot && (
                            <span className="mt-1 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-600 text-white animate-pulse">
                              LIVE NOW
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {sections.length === 0 ? (
                  <tr>
                    <td colSpan={editableSlots.length + 1} className="py-12 text-center text-[#8094A8]">
                      No active classes or sections configured in this school.
                    </td>
                  </tr>
                ) : (
                  sections.map((sectionItem) => {
                    const classItem = classes.find(
                      (c) => String(c._id) === String(sectionItem.classId?._id || sectionItem.classId)
                    );
                    const classLabel = `${classItem?.name || 'Class'} - ${sectionItem.name}`;

                    return (
                      <tr key={sectionItem._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-bold text-[#102033] sticky left-0 bg-white border-r border-slate-200/80 z-10">
                          <div>{classLabel}</div>
                          {sectionItem.roomNumber && (
                            <span className="text-[10px] text-[#8094A8] font-normal">
                              Room {sectionItem.roomNumber}
                            </span>
                          )}
                        </td>

                        {editableSlots.map((slot) => {
                          const isLiveSlot =
                            liveStatus?.currentDay === selectedDay &&
                            liveStatus?.activeSlot?.periodNumber === slot.periodNumber;

                          if (['ASSEMBLY', 'RECESS'].includes(slot.slotType)) {
                            return (
                              <td
                                key={slot.periodNumber}
                                className={`py-2 px-2 text-center border-r border-slate-200/40 last:border-r-0 ${
                                  isLiveSlot ? 'bg-emerald-500/5' : 'bg-slate-50/50'
                                }`}
                              >
                                <span className="inline-block px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-100 text-[#526477]">
                                  {slot.label}
                                </span>
                              </td>
                            );
                          }

                          const entry = findScheduleEntry(selectedDay, slot.periodNumber, sectionItem._id);
                          const subjectObj = subjects.find(
                            (sub) => String(sub._id) === String(entry?.subjectId?._id || entry?.subjectId)
                          );
                          const teacherObj = faculty.find(
                            (fac) => String(fac._id) === String(entry?.teacherId?._id || entry?.teacherId)
                          );

                          return (
                            <td
                              key={slot.periodNumber}
                              className={`py-2 px-2 border-r border-slate-200/40 last:border-r-0 text-center ${
                                isLiveSlot ? 'bg-emerald-500/10' : ''
                              }`}
                            >
                              {entry && subjectObj ? (
                                <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-200/60 text-left">
                                  <div className="font-bold text-[#006AC7] truncate text-[11px]">
                                    {subjectObj.name}
                                  </div>
                                  <div className="text-[10px] text-[#102033] font-medium truncate flex items-center gap-1 mt-0.5">
                                    <User className="w-2.5 h-2.5 text-[#8094A8]" />
                                    <span>{teacherObj?.fullName || 'Assigned Faculty'}</span>
                                  </div>
                                  {entry.roomNumber && (
                                    <div className="text-[9px] text-[#8094A8] font-mono mt-0.5">
                                      Room: {entry.roomNumber}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-300 font-medium">—</span>
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
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODE 2: INTERACTIVE TIMETABLE BUILDER & IN-PLACE ALLOCATOR          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeViewMode === 'BUILDER' && (
        <div className="space-y-5">
          {/* Class and Section Filter */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8094A8] mb-1">
                Select Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedSectionId('');
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#102033] bg-white"
              >
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name} (Grade {cls.numericGrade})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8094A8] mb-1">
                Select Section
              </label>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#102033] bg-white"
              >
                {availableSections.map((sec) => (
                  <option key={sec._id} value={sec._id}>
                    Section {sec.name} {sec.medium ? `(${sec.medium})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-40">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8094A8] mb-1">
                Academic Session
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-[#102033] bg-white"
              />
            </div>
          </div>

          {/* Builder Weekly Allocation Grid */}
          <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-[#8094A8] uppercase tracking-wider">
                  <th className="py-3 px-4 w-32 border-r border-slate-200">Day</th>
                  {editableSlots.map((slot) => (
                    <th key={slot.periodNumber} className="py-3 px-3 text-center border-r border-slate-200 last:border-r-0">
                      <div>{slot.label}</div>
                      <div className="text-[10px] font-mono text-[#8094A8]">
                        {slot.startTime}–{slot.endTime}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {DAYS_OF_WEEK.map((day) => (
                  <tr key={day} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-bold text-[#102033] border-r border-slate-200 bg-slate-50/30">
                      {day}
                    </td>

                    {editableSlots.map((slot) => {
                      if (['ASSEMBLY', 'RECESS'].includes(slot.slotType)) {
                        return (
                          <td
                            key={slot.periodNumber}
                            className="py-2 px-2 text-center border-r border-slate-200/40 bg-slate-50/80 text-[#8094A8] text-[10px] font-semibold"
                          >
                            {slot.label}
                          </td>
                        );
                      }

                      const entry = findScheduleEntry(day, slot.periodNumber, selectedSectionId);
                      const subjectObj = subjects.find(
                        (sub) => String(sub._id) === String(entry?.subjectId?._id || entry?.subjectId)
                      );
                      const teacherObj = faculty.find(
                        (fac) => String(fac._id) === String(entry?.teacherId?._id || entry?.teacherId)
                      );

                      return (
                        <td
                          key={slot.periodNumber}
                          onClick={() => handleOpenCellEditor(day, slot.periodNumber)}
                          className="py-2 px-2 border-r border-slate-200/40 last:border-r-0 cursor-pointer hover:bg-blue-50/40 transition group"
                        >
                          {entry && subjectObj ? (
                            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200/70 group-hover:border-[#006AC7] transition">
                              <div className="font-bold text-[#006AC7] text-[11px] truncate">
                                {subjectObj.name}
                              </div>
                              <div className="text-[10px] text-[#102033] truncate mt-0.5">
                                {teacherObj?.fullName || 'Assigned Teacher'}
                              </div>
                              {entry.roomNumber && (
                                <div className="text-[9px] text-[#8094A8] font-mono mt-0.5">
                                  {entry.roomNumber}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-14 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-[#8094A8] group-hover:border-[#006AC7] group-hover:text-[#006AC7] transition">
                              + Assign
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Cell Allocation Modal ─── */}
      {cellModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-[#102033] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#006AC7]" />
                Period Allocation ({activeCellTarget?.dayOfWeek}, Slot {activeCellTarget?.periodNumber})
              </h3>
              <button
                onClick={() => setCellModalOpen(false)}
                className="p-1 rounded-lg text-[#8094A8] hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#526477] uppercase tracking-wider mb-1">
                  Subject *
                </label>
                <select
                  value={cellSubjectId}
                  onChange={(e) => setCellSubjectId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-[#102033] bg-white"
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name} {sub.code ? `(${sub.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#526477] uppercase tracking-wider mb-1">
                  Assigned Teacher *
                </label>
                <select
                  value={cellTeacherId}
                  onChange={(e) => setCellTeacherId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-[#102033] bg-white"
                >
                  <option value="">-- Choose Faculty --</option>
                  {faculty.map((fac) => (
                    <option key={fac._id} value={fac._id}>
                      {fac.fullName} ({fac.designation || 'Teacher'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#526477] uppercase tracking-wider mb-1">
                  Room Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 14, Hall B"
                  value={cellRoomNumber}
                  onChange={(e) => setCellRoomNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-[#102033]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClearCellAllocation}
                className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition cursor-pointer"
              >
                Clear Allocation
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
                  Apply to Period
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Period Slot Configuration Modal ─── */}
      {slotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-[#102033] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#006AC7]" />
                Configure School Period Slots
              </h3>
              <button
                onClick={() => setSlotModalOpen(false)}
                className="p-1 rounded-lg text-[#8094A8] hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* List of current slots */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
              {editableSlots.map((slot) => (
                <div
                  key={slot.periodNumber}
                  className="p-2.5 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50/60"
                >
                  <div>
                    <span className="font-bold text-[#102033]">{slot.label}</span>
                    <span className="ml-2 font-mono text-[#8094A8]">
                      ({slot.startTime}–{slot.endTime})
                    </span>
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-[#006AC7] font-semibold">
                      {slot.slotType}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveSlot(slot.periodNumber)}
                    className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                    title="Delete Slot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Slot Form */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
              <div className="font-bold text-[#102033]">Add New Period Slot</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#526477] mb-1">Period Number</label>
                  <input
                    type="number"
                    value={newSlotNumber}
                    onChange={(e) => setNewSlotNumber(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#526477] mb-1">Slot Type</label>
                  <select
                    value={newSlotType}
                    onChange={(e) => setNewSlotType(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="TEACHING">Teaching Period</option>
                    <option value="ASSEMBLY">Morning Assembly</option>
                    <option value="RECESS">Recess / Break</option>
                    <option value="ZERO_PERIOD">Zero Period</option>
                    <option value="SPECIAL_ACTIVITY">Special Activity</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#526477] mb-1">Label</label>
                <input
                  type="text"
                  placeholder="e.g. Period 5, Science Lab"
                  value={newSlotLabel}
                  onChange={(e) => setNewSlotLabel(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#526477] mb-1">Start Time (24h)</label>
                  <input
                    type="text"
                    placeholder="08:00"
                    value={newSlotStartTime}
                    onChange={(e) => setNewSlotStartTime(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#526477] mb-1">End Time (24h)</label>
                  <input
                    type="text"
                    placeholder="08:45"
                    value={newSlotEndTime}
                    onChange={(e) => setNewSlotEndTime(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white font-mono"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddSlot}
                className="w-full py-2 rounded-xl bg-[#102033] hover:bg-black text-white font-bold text-xs transition cursor-pointer"
              >
                + Add Slot to Schedule
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSlotModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-[#526477] hover:bg-slate-50 font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HmTimetableBuilder;
