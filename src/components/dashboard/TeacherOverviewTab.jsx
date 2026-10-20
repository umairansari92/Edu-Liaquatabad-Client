import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  BookOpen,
  Users,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Award,
  FileText,
  School,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Download,
  PlusCircle,
  FileSpreadsheet,
  IdCard,
  Building,
  CalendarCheck,
} from 'lucide-react';
import LivePeriodBadge from '../timetable/LivePeriodBadge.jsx';
import { fetchMySchedule } from '../../store/slices/timetableSlice.js';
import {
  selectTeacherSummary,
  selectTeacherSummaryLoading,
  selectTeacherCirculars,
  selectTeacherSections,
  selectTeacherUniqueSubjectsCount,
  selectTeacherPendingAttendanceCount,
  selectTeacherClassTeacherSectionCount,
} from '../../store/slices/teacherSlice.js';

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export const TeacherOverviewTab = ({
  onNavigateTab,
  onSelectAttendanceSection,
  onOpenHomeworkModal,
  onOpenLeaveModal,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const summary = useSelector(selectTeacherSummary);
  const summaryLoading = useSelector(selectTeacherSummaryLoading);
  const circularsList = useSelector(selectTeacherCirculars);
  const assignedSections = useSelector(selectTeacherSections);
  const uniqueSubjectsCount = useSelector(selectTeacherUniqueSubjectsCount);
  const pendingAttendanceCount = useSelector(selectTeacherPendingAttendanceCount);
  const classTeacherSectionCount = useSelector(selectTeacherClassTeacherSectionCount);
  const { personalScheduleData, isLoading: timetableLoading } = useSelector((state) => state.timetable);

  // Fetch timetable schedule on mount if not yet loaded
  useEffect(() => {
    if (!personalScheduleData) {
      dispatch(fetchMySchedule());
    }
  }, [dispatch, personalScheduleData]);

  // Derive Today's Day of Week
  const todayDayName = useMemo(() => {
    const todayIndex = new Date().getDay();
    const dayMap = { 1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY', 4: 'THURSDAY', 5: 'FRIDAY', 6: 'SATURDAY' };
    return dayMap[todayIndex] || 'MONDAY';
  }, []);

  const liveStatus = personalScheduleData?.liveStatus;
  const periodSlots = personalScheduleData?.periodSlots || [];
  const scheduleList = personalScheduleData?.mySchedule || [];

  // Filter lessons for today
  const todayLessons = useMemo(() => {
    const lessons = scheduleList.filter((item) => item.dayOfWeek === todayDayName);
    return [...lessons].sort((firstLesson, secondLesson) => {
      const firstSlot = periodSlots.find((slotItem) => slotItem.periodNumber === firstLesson.periodNumber);
      const secondSlot = periodSlots.find((slotItem) => slotItem.periodNumber === secondLesson.periodNumber);
      if (!firstSlot || !secondSlot) return firstLesson.periodNumber - secondLesson.periodNumber;
      return (firstSlot.startTime || '').localeCompare(secondSlot.startTime || '');
    });
  }, [scheduleList, todayDayName, periodSlots]);

  // Summary Metrics
  const summaryData = summary?.summary || {};
  const totalAssignedStudents = summaryData.totalAssignedStudents || 0;
  const assignedSectionCount = summaryData.assignedSectionCount || 0;
  const activeHomeworkCount = summaryData.activeHomeworkCount || 0;

  // Primary Class In-Charge Section (where teacher is Class Teacher)
  const primarySection = useMemo(
    () => assignedSections.find((s) => s.isClassTeacher) || null,
    [assignedSections]
  );

  return (
    <div className="space-y-6">
      {/* ─── 1. Live Schedule & Period Status Hero HUD ─── */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 via-[#006AC7] to-[#00529B] text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs">
                Today · {todayDayName}
              </span>
              <span className="text-xs text-blue-100 font-medium">
                Academic Year {personalScheduleData?.academicYear || '2025-2026'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              {liveStatus?.status === 'ACTIVE_TEACHING'
                ? `Active Class: ${liveStatus.activeSlot?.label || 'Period'} (${liveStatus.activeSlot?.startTime} – ${liveStatus.activeSlot?.endTime})`
                : liveStatus?.message || "Welcome to your Teacher Dashboard"}
            </h2>

            <p className="text-xs text-blue-100 max-w-xl">
              {todayLessons.length > 0
                ? `You have ${todayLessons.length} teaching period${todayLessons.length > 1 ? 's' : ''} scheduled for today across your assigned classrooms.`
                : 'No scheduled teaching periods for today on the official school timetable.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {liveStatus && <LivePeriodBadge liveStatus={liveStatus} />}
            <button
              type="button"
              onClick={() => onNavigateTab('TIMETABLE')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition flex items-center gap-1.5 cursor-pointer backdrop-blur-xs shadow-xs"
            >
              <CalendarDays className="w-3.5 h-3.5" /> Full Timetable
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. Top Accurate Contextual KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Assigned Classes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#526477]">My Classes</span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#006AC7]">
              <School className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#102033] tracking-tight">{assignedSectionCount}</p>
          <p className="text-xs text-[#8094A8] mt-1 font-medium">
            {classTeacherSectionCount > 0 ? `${classTeacherSectionCount} In-Charge · ` : ''}
            {assignedSectionCount - classTeacherSectionCount} Subject Allocations
          </p>
        </div>

        {/* KPI 2: Total Students */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#526477]">Total Students</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-[#4B7F3A]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#102033] tracking-tight">{totalAssignedStudents}</p>
          <p className="text-xs text-[#8094A8] mt-1 font-medium">Enrolled learners in your classes</p>
        </div>

        {/* KPI 3: Today's Attendance Duty */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#526477]">Class Attendance</span>
            <div className={`p-2 rounded-xl ${classTeacherSectionCount === 0 ? 'bg-slate-100 text-slate-600' : pendingAttendanceCount > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-[#4B7F3A]'}`}>
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-[#102033]">
            {classTeacherSectionCount === 0
              ? 'No Class Duty'
              : pendingAttendanceCount === 0
              ? 'All Done ✓'
              : `${pendingAttendanceCount} Pending`}
          </p>
          <p className="text-xs text-[#8094A8] mt-1 font-medium">
            {classTeacherSectionCount === 0
              ? 'Managed by assigned Class Teachers'
              : pendingAttendanceCount === 0
              ? 'Assigned class attendance marked'
              : 'Daily morning roll call required'}
          </p>
        </div>

        {/* KPI 4: Assigned Subjects */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#526477]">Assigned Subjects</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#102033] tracking-tight">{uniqueSubjectsCount}</p>
          <p className="text-xs text-[#8094A8] mt-1 font-medium">
            Active teaching subject discipline{uniqueSubjectsCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ─── 3. Actionable Priority Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Attendance Action Priority Card (Left Col) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#006AC7] flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4" /> Morning Attendance Duty
              </span>
              {primarySection && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Class Teacher
                </span>
              )}
            </div>

            {primarySection ? (
              primarySection.todayAttendance?.submitted ? (
                <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-1 mb-4">
                  <div className="font-bold text-emerald-800 flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Attendance Complete
                  </div>
                  <p className="text-emerald-700">
                    {primarySection.class?.name || 'Class'} ({primarySection.name ? `Section ${primarySection.name}` : 'Main'}) marked today: {primarySection.todayAttendance.presentCount} Present, {primarySection.todayAttendance.absentCount} Absent.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-xs space-y-1 mb-4">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Morning Duty Pending
                  </div>
                  <p className="text-amber-800">
                    Your assigned class <strong>{primarySection.class?.name || 'Class'} {primarySection.name ? `Section ${primarySection.name}` : ''}</strong> ({primarySection.studentCount} students) requires morning attendance.
                  </p>
                </div>
              )
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-[#526477] mb-4">
                <p className="font-semibold text-slate-800 mb-0.5">Subject Teacher Schedule</p>
                <p>You have no primary Class Teacher attendance duty. Class attendance is recorded by appointed Class Teachers.</p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            {primarySection ? (
              <button
                type="button"
                onClick={() => {
                  if (onSelectAttendanceSection) onSelectAttendanceSection(String(primarySection._id));
                  onNavigateTab('ATTENDANCE');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#006AC7] hover:bg-[#00529B] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <ClipboardList className="w-4 h-4" />
                {primarySection.todayAttendance?.submitted ? 'Review Attendance Sheet' : 'Take Attendance Now'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigateTab('CLASSES')}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200/80 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-slate-500" /> View My Classes
              </button>
            )}
          </div>
        </div>

        {/* Today's Lessons Schedule Preview (Middle Col) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#526477] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#006AC7]" /> Today's Classes ({todayDayName})
              </span>
              <span className="text-[11px] font-bold text-[#8094A8]">
                {todayLessons.length} Period{todayLessons.length !== 1 ? 's' : ''}
              </span>
            </div>

            {todayLessons.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8094A8]">
                No teaching periods scheduled on timetable for today.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {todayLessons.slice(0, 4).map((lesson, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-[#102033] flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-blue-100 text-[#006AC7] text-[10px] font-black flex items-center justify-center">
                          P{lesson.periodNumber}
                        </span>
                        {lesson.subject?.name || 'Subject'}
                      </div>
                      <div className="text-[11px] text-[#8094A8] mt-0.5">
                        {lesson.class?.name || 'Class'} {lesson.section?.name ? `(${lesson.section.name})` : ''} · Room {lesson.roomNumber || '—'}
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {lesson.startTime || ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNavigateTab('TIMETABLE')}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              View Full Weekly Schedule <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Actions Launcher (Right Col) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#526477] block mb-3">
              Contextual Quick Actions
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => navigate('/my-classes')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 hover:border-blue-200 border border-slate-200/70 text-left transition group cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-[#006AC7] mb-1.5" />
                <div className="text-xs font-bold text-[#102033] group-hover:text-[#006AC7]">My Classes</div>
                <div className="text-[10px] text-[#8094A8]">Rosters &amp; Allocations</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('ATTENDANCE')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/70 hover:border-emerald-200 border border-slate-200/70 text-left transition group cursor-pointer"
              >
                <ClipboardList className="w-4 h-4 text-[#4B7F3A] mb-1.5" />
                <div className="text-xs font-bold text-[#102033] group-hover:text-[#4B7F3A]">Attendance</div>
                <div className="text-[10px] text-[#8094A8]">Daily register</div>
              </button>

              <button
                type="button"
                onClick={onOpenHomeworkModal}
                className="p-3 rounded-xl bg-slate-50 hover:bg-purple-50/70 hover:border-purple-200 border border-slate-200/70 text-left transition group cursor-pointer"
              >
                <FileText className="w-4 h-4 text-purple-600 mb-1.5" />
                <div className="text-xs font-bold text-[#102033] group-hover:text-purple-700">Homework</div>
                <div className="text-[10px] text-[#8094A8]">Assign to section</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('EXAMS')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-amber-50/70 hover:border-amber-200 border border-slate-200/70 text-left transition group cursor-pointer"
              >
                <Award className="w-4 h-4 text-amber-600 mb-1.5" />
                <div className="text-xs font-bold text-[#102033] group-hover:text-amber-700">Exam Marks</div>
                <div className="text-[10px] text-[#8094A8]">Subject gradebook</div>
              </button>

              <button
                type="button"
                onClick={onOpenLeaveModal}
                className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/70 hover:border-indigo-200 border border-slate-200/70 text-left transition group cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4 text-indigo-600 mb-1.5" />
                <div className="text-xs font-bold text-[#102033] group-hover:text-indigo-700">Apply Leave</div>
                <div className="text-[10px] text-[#8094A8]">CL application</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('SERVICE')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-left transition group cursor-pointer"
              >
                <IdCard className="w-4 h-4 text-slate-600 mb-1.5" />
                <div className="text-xs font-bold text-[#102033]">Service Record</div>
                <div className="text-[10px] text-[#8094A8]">Punch history</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. Recent Official Notices & Circulars ─── */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#006AC7]" />
            <h3 className="text-sm font-bold text-[#102033]">Recent Official Notices &amp; Department Circulars</h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('CIRCULARS')}
            className="text-xs font-bold text-[#006AC7] hover:underline flex items-center gap-1 cursor-pointer"
          >
            All Notices ({circularsList.length}) <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {circularsList.length === 0 ? (
          <div className="py-4 text-center text-xs text-[#8094A8]">
            No unread circulars or municipal orders posted for your school.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {circularsList.slice(0, 3).map((circularItem) => (
              <div
                key={String(circularItem._id)}
                className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col justify-between hover:bg-slate-50 transition"
              >
                <div>
                  <span className="text-[10px] font-bold text-[#006AC7] uppercase tracking-wider">
                    {circularItem.category || 'Official Circular'}
                  </span>
                  <h4 className="text-xs font-bold text-[#102033] mt-1 line-clamp-1">{circularItem.title}</h4>
                  <p className="text-[11px] text-[#526477] mt-1 line-clamp-2">{circularItem.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-200/50 text-[10px] text-[#8094A8]">
                  <span>{new Date(circularItem.createdAt).toLocaleDateString('en-PK')}</span>
                  {circularItem.fileUrl && (
                    <a
                      href={circularItem.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#006AC7] hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherOverviewTab;
