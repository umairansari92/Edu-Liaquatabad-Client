import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  Calendar,
  Clock,
  School,
  Building,
  User,
  CheckCircle2,
  FileText,
  Download,
  Eye,
  Layers,
} from 'lucide-react';

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

/**
 * TimetablePrintPreviewModal
 * Provides an authentic A4 Landscape tabular print preview inside the portal
 * and formats the exact printable sheet for native browser printing (window.print).
 */
export const TimetablePrintPreviewModal = ({
  isOpen,
  onClose,
  schoolName = '',
  academicYear = '2025-2026',
  classes = [],
  slots = [],
  fridaySlots = [],
  schedule = [],
  subjects = [],
  faculty = [],
  primarySectionByClassId = new Map(),
  initialDay = 'MONDAY',
}) => {
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [viewScope, setViewScope] = useState('SINGLE_DAY'); // 'SINGLE_DAY' | 'ALL_DAYS'

  useEffect(() => {
    if (initialDay && DAYS_OF_WEEK.includes(initialDay)) {
      setSelectedDay(initialDay);
    }
  }, [initialDay]);

  // Handle Escape key dismissal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Chronologically sorted slots
  const sortedSlots = useMemo(() => {
    return [...slots].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [slots]);

  // Sort classes by numeric grade
  const sortedClasses = useMemo(() => {
    return [...classes].sort(
      (a, b) => (Number(a.numericGrade) || 0) - (Number(b.numericGrade) || 0)
    );
  }, [classes]);

  // Subject resolver
  const resolveSubjectName = useCallback(
    (subjectRef) => {
      if (!subjectRef) return '';
      if (typeof subjectRef === 'object' && subjectRef.name) return subjectRef.name;
      const match = subjects.find((s) => String(s._id) === String(subjectRef));
      return match?.name || '';
    },
    [subjects]
  );

  // Teacher resolver
  const resolveTeacherName = useCallback(
    (teacherRef) => {
      if (!teacherRef) return '';
      if (typeof teacherRef === 'object' && teacherRef.fullName) return teacherRef.fullName;
      const match = faculty.find(
        (f) => String(f.userId || f._id) === String(teacherRef)
      );
      return match?.fullName || '';
    },
    [faculty]
  );

  // Class in-charge resolver
  const resolveClassIncharge = useCallback(
    (classItem) => {
      if (!classItem) return '—';
      const classIdStr = String(classItem._id);
      const section = primarySectionByClassId?.get(classIdStr);
      if (section?.classTeacherId) {
        if (typeof section.classTeacherId === 'object' && section.classTeacherId.fullName) {
          return section.classTeacherId.fullName;
        }
        const match = faculty.find(
          (f) => String(f.userId || f._id) === String(section.classTeacherId)
        );
        if (match?.fullName) return match.fullName;
      }
      return 'Not Assigned';
    },
    [primarySectionByClassId, faculty]
  );

  // Helper to find entry for cell
  const getEntry = useCallback(
    (classId, day, periodNum) => {
      return schedule.find(
        (entry) =>
          String(entry.classId?._id || entry.classId) === String(classId) &&
          entry.dayOfWeek === day &&
          entry.periodNumber === periodNum
      );
    },
    [schedule]
  );

  // Native Print Handler with dedicated print mode class
  const handleTriggerPrint = () => {
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

    // Give browser renderer 100ms to paint print-timetable-mode styles
    setTimeout(() => {
      window.print();
      // Fallback cleanup in case afterprint does not fire
      setTimeout(cleanupPrint, 4000);
    }, 100);
  };

  if (!isOpen) return null;

  // Render Single Day Table
  const renderDayTable = (dayName) => {
    const dayEntryCount = schedule.filter((s) => s.dayOfWeek === dayName).length;
    const daySlots = (dayName === 'FRIDAY' && Array.isArray(fridaySlots) && fridaySlots.length > 0)
      ? [...fridaySlots].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
      : sortedSlots;

    const shiftText = daySlots.length > 0
      ? `SHIFT: ${daySlots[0].startTime} – ${daySlots[daySlots.length - 1].endTime}`
      : (dayName === 'FRIDAY' ? 'SHIFT: 07:30 AM – 12:00 PM' : 'SHIFT: 08:00 AM – 12:20 PM');

    return (
      <div key={dayName} className="a4-sheet-page bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-300 text-slate-900 my-4 printable-timetable-sheet">
        {/* ── Institutional Header ── */}
        <div className="border-b-2 border-slate-900 pb-3 mb-3 text-center relative">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="text-left">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-900 text-white print:border print:border-black">
                DMC LIAQUATABAD TOWN CENTRE
              </span>
              <p className="text-[10px] text-slate-600 font-bold uppercase mt-0.5">
                EDUCATION DEPARTMENT • DISTRICT CENTRAL
              </p>
            </div>

            <div className="text-center flex-1 px-2">
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 leading-tight">
                {schoolName || 'GOVERNMENT ELEMENTARY & ENGLISH MEDIUM SCHOOL'}
              </h2>
              <p className="text-xs font-extrabold uppercase tracking-widest text-[#006AC7] mt-0.5">
                OFFICIAL MASTER TIMETABLE &amp; TEACHER ALLOCATION MATRIX
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 border border-blue-200 text-[#006AC7]">
                SESSION {academicYear}
              </span>
              <p className="text-[10px] font-bold text-slate-700 mt-0.5">
                {shiftText}
              </p>
            </div>
          </div>

          {/* Day & Meta Banner */}
          <div className="bg-slate-100 border border-slate-300 py-1 px-3 rounded-lg flex items-center justify-between text-xs font-bold text-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">SCHEDULE DAY:</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[11px] font-black uppercase">
                {dayName}
              </span>
            </div>
            <div className="text-[11px] text-slate-600">
              Total Allocations: <span className="text-slate-900 font-extrabold">{dayEntryCount} periods scheduled</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              STATUS: PUBLISHED &amp; ACTIVE
            </div>
          </div>
        </div>

        {/* ── Table Grid ── */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-900 text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white border-b border-slate-900">
                <th className="p-2 border border-slate-900 font-black uppercase text-center w-24">
                  Class / Grade
                </th>
                <th className="p-2 border border-slate-900 font-black uppercase text-center w-28">
                  Class Incharge
                </th>
                {daySlots.map((slot) => (
                  <th
                    key={`${slot.periodNumber}-${slot.startTime}`}
                    className={`p-2 border border-slate-900 text-center ${
                      slot.slotType === 'RECESS'
                        ? 'bg-amber-100 text-amber-900 font-black w-20'
                        : 'bg-slate-800 text-white font-bold'
                    }`}
                  >
                    <div className="text-[11px] font-extrabold uppercase">
                      {slot.slotType === 'RECESS' ? 'BREAK' : slot.label || `${slot.periodNumber}th`}
                    </div>
                    <div className="text-[9px] font-mono opacity-80 mt-0.5">
                      {slot.startTime}–{slot.endTime}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedClasses.length === 0 ? (
                <tr>
                  <td
                    colSpan={daySlots.length + 2}
                    className="p-8 text-center text-slate-500 italic"
                  >
                    No classes enrolled for this school.
                  </td>
                </tr>
              ) : (
                sortedClasses.map((classItem, rowIndex) => {
                  const classId = String(classItem._id);
                  const inchargeName = resolveClassIncharge(classItem);

                  return (
                    <tr
                      key={classId}
                      className={`border-b border-slate-400 ${
                        rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                      }`}
                    >
                      {/* Class Name */}
                      <td className="p-2 border border-slate-400 font-black text-slate-900 text-center whitespace-nowrap bg-slate-100/80">
                        {classItem.name || `Class ${classItem.numericGrade}`}
                      </td>

                      {/* Class Incharge */}
                      <td className="p-2 border border-slate-400 text-center text-[10px] font-semibold text-slate-700 bg-slate-50/50">
                        {inchargeName}
                      </td>

                      {/* Period Cells */}
                      {daySlots.map((slot) => {
                        if (slot.slotType === 'RECESS') {
                          return (
                            <td
                              key={`recess-${classId}-${slot.startTime}`}
                              className="p-1.5 border border-slate-400 text-center bg-amber-50/80 text-amber-900 font-bold text-[10px]"
                            >
                              RECESS
                            </td>
                          );
                        }

                        const entry = getEntry(classId, dayName, slot.periodNumber);
                        const subjectName = entry ? resolveSubjectName(entry.subjectId) : '';
                        const teacherName = entry ? resolveTeacherName(entry.teacherId) : '';
                        const room = entry?.roomNumber;

                        return (
                          <td
                            key={`cell-${classId}-${slot.periodNumber}`}
                            className={`p-1.5 border border-slate-400 text-center align-middle ${
                              entry ? 'bg-blue-50/30' : 'bg-white'
                            }`}
                          >
                            {entry ? (
                              <div className="space-y-0.5">
                                <div className="text-[11px] font-black text-slate-900 leading-tight">
                                  {subjectName || 'Assigned Subject'}
                                </div>
                                <div className="text-[10px] font-bold text-[#006AC7] leading-tight">
                                  {teacherName || 'Faculty Assigned'}
                                </div>
                                {room && (
                                  <div className="text-[8px] font-mono text-slate-500">
                                    {room}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-300 italic font-mono">
                                —
                              </span>
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

        {/* ── Signatures & Authorization Seals (Mandatory DMC Administrative Standard) ── */}
        <div className="mt-8 pt-6 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center text-xs">
          <div>
            <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
            <p className="font-extrabold text-slate-900 uppercase">Prepared By</p>
            <p className="text-[10px] text-slate-500 font-medium">Time Table Incharge / Senior Faculty</p>
          </div>

          <div>
            <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
            <p className="font-extrabold text-slate-900 uppercase">Verified &amp; Checked</p>
            <p className="text-[10px] text-slate-500 font-medium">Academic Supervisor / Town Inspecting Officer</p>
          </div>

          <div>
            <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
            <p className="font-extrabold text-slate-900 uppercase">Countersigned &amp; Approved</p>
            <p className="text-[10px] text-slate-500 font-medium">Head Master / Head Mistress (DDO Seal)</p>
          </div>
        </div>

        {/* Footnote */}
        <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-mono">
          <span>Official DMC Liaquatabad Town Education Governance Engine</span>
          <span>Printed on: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    );
  };

  const modalContent = (
    <div
      onClick={(clickEvent) => {
        if (clickEvent.target === clickEvent.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[100] flex flex-col bg-slate-950/80 p-2 sm:p-4 backdrop-blur-md overflow-hidden text-[#102033]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="timetable-preview-title"
    >
      {/* ── Modal Top Toolbar (Non-printable) ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 mb-3 flex flex-wrap items-center justify-between gap-3 text-white shadow-xl no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600 text-white">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h3 id="timetable-preview-title" className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-2">
              A4 Print &amp; Portal Timetable Preview
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                A4 Landscape Table
              </span>
            </h3>
            <p className="text-[11px] text-slate-300">
              High-resolution tabular view formatted for standard A4 landscape paper &amp; municipal gazette.
            </p>
          </div>
        </div>

        {/* Day Filters */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDay === day && viewScope === 'SINGLE_DAY';
            return (
              <button
                key={day}
                onClick={() => {
                  setSelectedDay(day);
                  setViewScope('SINGLE_DAY');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#006AC7] text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            );
          })}
          <div className="w-px h-5 bg-slate-700 mx-1" />
          <button
            onClick={() => setViewScope('ALL_DAYS')}
            className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
              viewScope === 'ALL_DAYS'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            All Days (Binder)
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTriggerPrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#006AC7] hover:bg-[#005299] text-white text-xs font-bold transition shadow-md cursor-pointer"
            title="Print A4 Timetable (Microsoft Print to PDF or Printer)"
          >
            <Printer className="w-4 h-4" />
            <span>Print Sheet (A4)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            aria-label="Close timetable preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Scrollable Document Preview Area ── */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-6 flex justify-center bg-slate-900/40 rounded-2xl border border-slate-800/60">
        <div className="w-full max-w-6xl space-y-8">
          {viewScope === 'ALL_DAYS' ? (
            DAYS_OF_WEEK.map((dayName) => renderDayTable(dayName))
          ) : (
            renderDayTable(selectedDay)
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default TimetablePrintPreviewModal;
