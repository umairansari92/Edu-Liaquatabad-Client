import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CalendarDays,
  Clock,
  BookOpen,
  User,
  Building,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import LivePeriodBadge from './LivePeriodBadge.jsx';
import { fetchMySchedule } from '../../store/slices/timetableSlice.js';

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export const PersonalScheduleView = ({ role = 'TEACHER', studentId = null }) => {
  const dispatch = useDispatch();
  const { personalScheduleData, isLoading } = useSelector((state) => state.timetable);

  const [selectedDay, setSelectedDay] = useState(() => {
    const todayIndex = new Date().getDay();
    const dayMap = { 1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY', 4: 'THURSDAY', 5: 'FRIDAY', 6: 'SATURDAY' };
    return dayMap[todayIndex] || 'MONDAY';
  });

  useEffect(() => {
    dispatch(fetchMySchedule(studentId ? { studentId } : {}));
  }, [dispatch, studentId]);

  const scheduleList = useMemo(() => {
    if (!personalScheduleData) return [];
    return personalScheduleData.mySchedule || personalScheduleData.wardSchedule || [];
  }, [personalScheduleData]);

  const periodSlots = useMemo(() => {
    return personalScheduleData?.periodSlots || [];
  }, [personalScheduleData]);

  const liveStatus = personalScheduleData?.liveStatus;

  // Filter lessons for selected day and sort chronologically
  const dayLessons = useMemo(() => {
    const lessonsForDay = scheduleList.filter((item) => item.dayOfWeek === selectedDay);

    return [...lessonsForDay].sort((a, b) => {
      const slotA = periodSlots.find((s) => s.periodNumber === a.periodNumber);
      const slotB = periodSlots.find((s) => s.periodNumber === b.periodNumber);
      if (!slotA || !slotB) return a.periodNumber - b.periodNumber;
      return slotA.startTime.localeCompare(slotB.startTime);
    });
  }, [scheduleList, selectedDay, periodSlots]);

  return (
    <div className="space-y-6">
      {/* ─── Hero Header & Live Period HUD ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#006AC7]" />
            <h2 className="text-lg font-bold text-[#102033]">
              {role === 'TEACHER' ? 'My Teaching Schedule & Classes' : 'My Class Timetable'}
            </h2>
          </div>
          <p className="text-xs text-[#526477]">
            Session {personalScheduleData?.academicYear || '2025-2026'} • Synchronized with school master schedule.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <LivePeriodBadge liveStatus={liveStatus} />

          <button
            onClick={() => dispatch(fetchMySchedule(studentId ? { studentId } : {}))}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#526477] transition shadow-sm cursor-pointer"
            title="Refresh Schedule"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Today Live Activity Callout ─── */}
      {liveStatus?.currentDay && liveStatus.currentDay !== 'SUNDAY' && (
        <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-[#006AC7]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#006AC7] uppercase tracking-wider">
                Current Operational Status
              </div>
              <div className="text-sm font-bold text-[#102033]">
                {liveStatus.status === 'ACTIVE_TEACHING'
                  ? `Active Period: ${liveStatus.activeSlot?.label} (${liveStatus.activeSlot?.startTime} – ${liveStatus.activeSlot?.endTime})`
                  : liveStatus.message}
              </div>
            </div>
          </div>

          {liveStatus.nextSlot && (
            <div className="text-xs text-[#526477] font-medium bg-white/70 px-3 py-1.5 rounded-xl border border-blue-100">
              Up Next: <strong className="text-[#102033]">{liveStatus.nextSlot.label}</strong> at {liveStatus.nextSlot.startTime}
            </div>
          )}
        </div>
      )}

      {/* ─── Teacher Free Periods Callout ─── */}
      {role === 'TEACHER' && personalScheduleData?.myFreePeriodsToday && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-amber-950">
                Your Free Periods Today ({liveStatus?.currentDay || 'TODAY'}):
              </div>
              <div className="font-mono font-bold text-amber-800 mt-0.5">
                {personalScheduleData.myFreePeriodsToday.length > 0
                  ? personalScheduleData.myFreePeriodsToday.map((p) => `Period ${p}`).join(', ')
                  : 'None (Full Teaching Schedule Today)'}
              </div>
            </div>
          </div>
          <span className="text-[11px] font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-3 py-1 rounded-xl self-start sm:self-auto">
            Available for Proxy Duties
          </span>
        </div>
      )}

      {/* ─── Day Selector Pills ─── */}
      <div className="flex flex-wrap items-center gap-2">
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = selectedDay === day;
          const isToday = liveStatus?.currentDay === day;
          const count = scheduleList.filter((item) => item.dayOfWeek === day).length;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-[#102033] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-[#526477] hover:bg-slate-50'
              }`}
            >
              <span>{day}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#526477]'
                }`}
              >
                {count}
              </span>
              {isToday && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Today" />
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Period-by-Period Timeline Cards ─── */}
      <div className="space-y-3">
        {dayLessons.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 p-6 space-y-2">
            <CalendarDays className="w-8 h-8 text-[#8094A8] mx-auto opacity-50" />
            <div className="font-bold text-[#102033] text-sm">No Classes Scheduled for {selectedDay}</div>
            <div className="text-xs text-[#8094A8]">
              You have no allocated periods on this day in the active school timetable.
            </div>
          </div>
        ) : (
          dayLessons.map((lesson) => {
            const slot = periodSlots.find((s) => s.periodNumber === lesson.periodNumber);
            const isLiveNow =
              liveStatus?.currentDay === selectedDay &&
              liveStatus?.activeSlot?.periodNumber === lesson.periodNumber;

            return (
              <div
                key={`${lesson.dayOfWeek}_${lesson.periodNumber}`}
                className={`p-4 rounded-2xl bg-white border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isLiveNow
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/10'
                    : 'border-slate-200/80 shadow-sm hover:shadow'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-mono shrink-0 ${
                      isLiveNow
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-50 text-[#006AC7] border border-blue-100'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase leading-none">P</span>
                    <span className="text-base font-black leading-none mt-0.5">
                      {lesson.periodNumber}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-[#102033]">
                        {lesson.subjectId?.name || 'Class Session'}
                      </h3>
                      {lesson.subjectId?.code && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-[#526477]">
                          {lesson.subjectId.code}
                        </span>
                      )}
                      {isLiveNow && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white animate-pulse">
                          IN SESSION NOW
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#526477]">
                      {lesson.classId?.name && (
                        <span className="font-bold text-[#102033] px-2 py-0.5 rounded-md bg-slate-100">
                          {lesson.classId.name}
                        </span>
                      )}

                      {lesson.teacherId?.fullName && role !== 'TEACHER' && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-[#8094A8]" />
                          <span>{lesson.teacherId.fullName}</span>
                        </span>
                      )}

                      {lesson.roomNumber && (
                        <span className="flex items-center gap-1 font-mono text-[#8094A8]">
                          <Building className="w-3.5 h-3.5" />
                          <span>Room: {lesson.roomNumber}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {slot && (
                  <div className="text-right sm:border-l sm:border-slate-100 sm:pl-4">
                    <div className="text-xs font-mono font-bold text-[#102033]">
                      {slot.startTime} – {slot.endTime}
                    </div>
                    <div className="text-[10px] text-[#8094A8] font-medium">{slot.label}</div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PersonalScheduleView;
