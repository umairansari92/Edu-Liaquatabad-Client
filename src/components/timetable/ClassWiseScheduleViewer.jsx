import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  BookOpen,
  User,
  UserCheck,
  Building,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldAlert,
  Coffee,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import LivePeriodBadge from './LivePeriodBadge.jsx';

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export const ClassWiseScheduleViewer = ({
  classes = [],
  sections = [],
  timetable = null,
  assignments = [],
  faculty = [],
  initialClassId = null,
  onNavigateToBuilder = null,
}) => {
  // Sort classes by numeric grade
  const sortedClasses = useMemo(() => {
    return [...classes].sort(
      (a, b) => (Number(a.numericGrade) || 0) - (Number(b.numericGrade) || 0)
    );
  }, [classes]);

  const [selectedClassId, setSelectedClassId] = useState(
    initialClassId || sortedClasses[0]?._id || ''
  );

  useEffect(() => {
    if (!selectedClassId && sortedClasses.length > 0) {
      setSelectedClassId(sortedClasses[0]._id);
    }
  }, [sortedClasses, selectedClassId]);

  const [selectedDay, setSelectedDay] = useState(() => {
    const todayIndex = new Date().getDay();
    const dayMap = { 1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY', 4: 'THURSDAY', 5: 'FRIDAY', 6: 'SATURDAY' };
    return dayMap[todayIndex] || 'MONDAY';
  });

  const selectedClass = useMemo(() => {
    return sortedClasses.find((cls) => String(cls._id) === String(selectedClassId));
  }, [sortedClasses, selectedClassId]);

  // Find sections for this class
  const classSections = useMemo(() => {
    return sections.filter(
      (sec) => String(sec.classId?._id || sec.classId) === String(selectedClassId)
    );
  }, [sections, selectedClassId]);

  const primarySection = classSections[0] || null;
  const designatedClassTeacher = primarySection?.classTeacherId || null;

  // Timetable period slots
  const periodSlots = useMemo(() => {
    if (timetable?.periodSlots && timetable.periodSlots.length > 0) {
      return [...timetable.periodSlots].sort((a, b) => a.periodNumber - b.periodNumber);
    }
    // Sindh Government Standard baseline fallback
    return [
      { periodNumber: 1, slotType: 'TEACHING', label: '1st', startTime: '08:00', endTime: '08:35' },
      { periodNumber: 2, slotType: 'TEACHING', label: '2nd', startTime: '08:35', endTime: '09:10' },
      { periodNumber: 3, slotType: 'TEACHING', label: '3rd', startTime: '09:10', endTime: '09:45' },
      { periodNumber: 4, slotType: 'TEACHING', label: '4th', startTime: '09:45', endTime: '10:15' },
      { periodNumber: 0, slotType: 'RECESS', label: 'BREAK', startTime: '10:15', endTime: '10:35' },
      { periodNumber: 5, slotType: 'TEACHING', label: '5th', startTime: '10:35', endTime: '11:10' },
      { periodNumber: 6, slotType: 'TEACHING', label: '6th', startTime: '11:10', endTime: '11:45' },
      { periodNumber: 7, slotType: 'TEACHING', label: '7th', startTime: '11:45', endTime: '12:20' },
    ];
  }, [timetable]);

  // Timetable schedule entries for the selected class and day
  const classScheduleEntries = useMemo(() => {
    if (!timetable?.schedule || !selectedClassId) return [];
    return timetable.schedule.filter(
      (entry) =>
        String(entry.classId?._id || entry.classId) === String(selectedClassId) &&
        entry.dayOfWeek === selectedDay
    );
  }, [timetable, selectedClassId, selectedDay]);

  // Active teaching assignments for this class
  const activeClassAssignments = useMemo(() => {
    const list = assignments?.activeAssignments || assignments || [];
    return list.filter(
      (item) => String(item.classId?._id || item.classId) === String(selectedClassId)
    );
  }, [assignments, selectedClassId]);

  return (
    <div className="space-y-6">
      {/* ── 1. Class Selector & Day Tabs ── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-sm font-bold text-[#102033] flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#006AC7]" />
              Class-Wise Timetable & Period Schedule (کلاس شیڈول اور پیریڈز)
            </h4>
            <p className="text-xs text-[#526477] mt-0.5">
              Select any class to inspect daily periods, assigned subject teachers, and classroom locations.
            </p>
          </div>

          {onNavigateToBuilder && (
            <button
              onClick={onNavigateToBuilder}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-[#006AC7] hover:bg-blue-100 border border-blue-200 transition cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" /> Configure Timetable Matrix
            </button>
          )}
        </div>

        {/* Class Pills */}
        <div>
          <label className="text-[11px] font-bold text-[#8094A8] uppercase tracking-wider block mb-2">
            Select Class Cohort:
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {sortedClasses.map((cls) => {
              const isSelected = String(cls._id) === String(selectedClassId);
              return (
                <button
                  key={cls._id}
                  onClick={() => setSelectedClassId(cls._id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#006AC7] text-white shadow-sm ring-2 ring-[#006AC7]/20'
                      : 'bg-slate-100 text-[#526477] hover:bg-slate-200 hover:text-[#102033]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  {cls.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Pills */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#102033] flex items-center gap-1 mr-2">
              <Calendar className="w-3.5 h-3.5 text-[#006AC7]" /> Day:
            </span>
            {DAYS_OF_WEEK.map((dayName) => {
              const isSelectedDay = dayName === selectedDay;
              return (
                <button
                  key={dayName}
                  onClick={() => setSelectedDay(dayName)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isSelectedDay
                      ? 'bg-[#102033] text-white shadow-xs'
                      : 'bg-slate-100 text-[#526477] hover:bg-slate-200'
                  }`}
                >
                  {dayName.slice(0, 3)}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-[#526477]">
            Active Day: <span className="font-bold text-[#102033]">{selectedDay}</span>
          </div>
        </div>
      </div>

      {/* ── 2. Class Overview Banner (Class In-Charge vs Subject Teachers) ── */}
      {selectedClass && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-slate-50 to-white border border-blue-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="text-base font-black text-[#102033]">
                {selectedClass.name}
                {primarySection ? ` — Section ${primarySection.name}` : ''}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#006AC7]">
                Room {primarySection?.roomNumber || 'R-101'}
              </span>
            </div>
            <p className="text-xs text-[#526477]">
              Capacity: {primarySection?.capacity || 45} students • Official Curriculum Schedule
            </p>
          </div>

          {/* Designated Class Teacher Card */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${designatedClassTeacher ? 'bg-emerald-50 text-[#4B7F3A]' : 'bg-amber-50 text-amber-700'}`}>
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8094A8]">
                  Designated Class In-Charge:
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                  designatedClassTeacher
                    ? 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {designatedClassTeacher ? '1 Section Max Rule' : 'Unassigned'}
                </span>
              </div>
              <p className="text-xs font-bold text-[#102033]">
                {designatedClassTeacher?.fullName || designatedClassTeacher || 'No Class Teacher Designated'}
              </p>
              <p className="text-[11px] text-[#526477]">
                {designatedClassTeacher?.designation || 'Routine morning attendance & section ledger'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Period by Period Schedule Grid ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-[#102033] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#006AC7]" />
            Daily Period Breakdown ({selectedDay})
          </h4>
          <span className="text-xs text-[#526477]">
            {periodSlots.length} Scheduled Slots
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {periodSlots.map((slot) => {
            const isRecess = slot.slotType === 'RECESS';

            // Find matching schedule entry for this period
            const matchingEntry = classScheduleEntries.find(
              (entry) => Number(entry.periodNumber) === Number(slot.periodNumber)
            );

            // Fallback: If no direct timetable entry, check if subject assignment maps
            const matchingAssignment = !matchingEntry && activeClassAssignments[slot.periodNumber - 1];

            const subjectName = matchingEntry?.subjectId?.name || (matchingAssignment ? matchingAssignment.subjectId?.name : null);
            const subjectCode = matchingEntry?.subjectId?.code || (matchingAssignment ? matchingAssignment.subjectId?.code : '');
            const teacherName = matchingEntry?.teacherId?.fullName || (matchingAssignment ? matchingAssignment.teacherId?.fullName : null);
            const teacherDesignation = matchingEntry?.teacherId?.designation || (matchingAssignment ? matchingAssignment.teacherId?.designation : 'Teacher');
            const roomNumber = matchingEntry?.roomNumber || primarySection?.roomNumber || `R-${selectedClass?.numericGrade || 1}01`;

            // Check if teacher is Class Teacher for this section
            const isThisClassTeacher =
              teacherName &&
              designatedClassTeacher &&
              (String(designatedClassTeacher.fullName) === String(teacherName) ||
                String(designatedClassTeacher._id || designatedClassTeacher) === String(matchingEntry?.teacherId?._id || matchingAssignment?.teacherId?._id));

            if (isRecess) {
              return (
                <div
                  key="recess-break"
                  className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 flex flex-col justify-between space-y-2 lg:col-span-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-amber-700" />
                      RECESS / BREAK (تفریح)
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-800">
                      {slot.startTime} – {slot.endTime}
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/80">
                    Mid-day student refreshment and faculty rest interval.
                  </p>
                </div>
              );
            }

            return (
              <div
                key={slot.periodNumber}
                className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 ${
                  subjectName
                    ? 'border-slate-200 bg-white hover:border-[#006AC7]/40 shadow-xs'
                    : 'border-dashed border-slate-200 bg-slate-50/50'
                }`}
              >
                {/* Slot Timing Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-[#102033]">
                    PERIOD {slot.periodNumber}
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-[#526477]">
                    {slot.startTime} – {slot.endTime}
                  </span>
                </div>

                {/* Subject & Teacher Info */}
                {subjectName ? (
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-sm font-bold text-[#102033] line-clamp-1">
                        {subjectName}
                      </span>
                      {subjectCode && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-[#006AC7] font-semibold">
                          {subjectCode}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#526477]">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-[#102033] truncate">{teacherName}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 pl-5 truncate">{teacherDesignation}</p>

                    <div className="pt-2 flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        isThisClassTeacher
                          ? 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200'
                          : 'bg-blue-50 text-[#006AC7] border border-blue-200'
                      }`}>
                        {isThisClassTeacher ? (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5" /> Class Teacher
                          </>
                        ) : (
                          'Subject Teacher'
                        )}
                      </span>

                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Building className="w-3 h-3" /> {roomNumber}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-[#8094A8] italic space-y-1">
                    <p>Free / Unassigned Period</p>
                    <p className="text-[10px] not-italic text-slate-400">No teacher mapped for this slot</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. Subject Allocation Directory for this Class ── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div>
          <h4 className="text-sm font-bold text-[#102033] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#006AC7]" />
            Faculty Subject Allocations for {selectedClass?.name} ({activeClassAssignments.length} Active Duties)
          </h4>
          <p className="text-xs text-[#526477] mt-0.5">
            Complete roster of teachers holding active curriculum responsibilities for this class.
          </p>
        </div>

        {activeClassAssignments.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#8094A8] bg-slate-50 rounded-xl">
            No specific subject assignments allocated for this class yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-[#8094A8] uppercase text-[10px] font-bold">
                  <th className="py-2 px-3">Subject</th>
                  <th className="py-2 px-3">Teacher</th>
                  <th className="py-2 px-3">Institutional Role</th>
                  <th className="py-2 px-3">Session</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeClassAssignments.map((assignmentItem) => {
                  const isClassTeacher =
                    designatedClassTeacher &&
                    (String(designatedClassTeacher._id || designatedClassTeacher) ===
                      String(assignmentItem.teacherId?._id || assignmentItem.teacherId) ||
                      String(designatedClassTeacher.fullName) === String(assignmentItem.teacherId?.fullName));

                  return (
                    <tr key={assignmentItem._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-2.5 px-3 font-bold text-[#006AC7]">
                        {assignmentItem.subjectId?.name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-[#102033]">
                          {assignmentItem.teacherId?.fullName}
                        </span>
                        <span className="text-[10px] text-[#8094A8] block">
                          {assignmentItem.teacherId?.designation || 'Teacher'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {isClassTeacher ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#4B7F3A] border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Class Teacher
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                            Subject Teacher
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {assignmentItem.academicSession}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassWiseScheduleViewer;
