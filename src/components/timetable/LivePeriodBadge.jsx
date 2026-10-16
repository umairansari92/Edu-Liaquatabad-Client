import React from 'react';
import { Clock, Radio, Coffee, BookOpen, Sun, Moon, AlertCircle } from 'lucide-react';

/**
 * Modern Live Period Status Badge & HUD
 * Displays real-time operational status computed deterministically from Karachi time.
 */
export const LivePeriodBadge = ({ liveStatus, isDark = false }) => {
  if (!liveStatus) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs ${
          isDark
            ? 'bg-white/10 border border-white/15 text-slate-300'
            : 'bg-slate-100 border border-slate-200 text-[#526477]'
        }`}
      >
        <Clock className="w-3.5 h-3.5" />
        <span>No Live Timetable Active</span>
      </div>
    );
  }

  const { status, currentTime, currentDay, activeSlot, nextSlot, message } = liveStatus;

  const STATUS_CONFIGS = {
    ACTIVE_TEACHING: {
      bg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-500/10',
      border: isDark ? 'border-emerald-400/40' : 'border-emerald-500/30',
      text: isDark ? 'text-emerald-300' : 'text-emerald-700',
      pulse: 'bg-emerald-500',
      icon: BookOpen,
      title: activeSlot?.label || 'Teaching Class in Session',
    },
    ASSEMBLY: {
      bg: isDark ? 'bg-indigo-500/20' : 'bg-indigo-500/10',
      border: isDark ? 'border-indigo-400/40' : 'border-indigo-500/30',
      text: isDark ? 'text-indigo-300' : 'text-indigo-700',
      pulse: 'bg-indigo-500',
      icon: Sun,
      title: 'Morning Assembly',
    },
    RECESS: {
      bg: isDark ? 'bg-amber-500/20' : 'bg-amber-500/10',
      border: isDark ? 'border-amber-400/40' : 'border-amber-500/30',
      text: isDark ? 'text-amber-300' : 'text-amber-700',
      pulse: 'bg-amber-500',
      icon: Coffee,
      title: 'Recess / Interval',
    },
    INTERVAL: {
      bg: isDark ? 'bg-blue-500/20' : 'bg-blue-500/10',
      border: isDark ? 'border-blue-400/40' : 'border-blue-500/30',
      text: isDark ? 'text-blue-300' : 'text-blue-700',
      pulse: 'bg-blue-500',
      icon: Clock,
      title: 'Passing Period / Bell Break',
    },
    BEFORE_SCHOOL: {
      bg: isDark ? 'bg-sky-500/20' : 'bg-sky-500/10',
      border: isDark ? 'border-sky-400/40' : 'border-sky-500/30',
      text: isDark ? 'text-sky-300' : 'text-sky-700',
      pulse: null,
      icon: Sun,
      title: 'Before School Hours',
    },
    AFTER_SCHOOL: {
      bg: isDark ? 'bg-slate-500/20' : 'bg-slate-500/10',
      border: isDark ? 'border-slate-400/30' : 'border-slate-500/30',
      text: isDark ? 'text-slate-300' : 'text-slate-700',
      pulse: null,
      icon: Moon,
      title: 'School Hours Concluded',
    },
    OFF_DAY: {
      bg: isDark ? 'bg-slate-500/20' : 'bg-slate-500/10',
      border: isDark ? 'border-slate-400/30' : 'border-slate-500/30',
      text: isDark ? 'text-slate-300' : 'text-slate-600',
      pulse: null,
      icon: AlertCircle,
      title: 'Weekly Off (Sunday)',
    },
    UNCONFIGURED: {
      bg: isDark ? 'bg-slate-500/20' : 'bg-slate-500/10',
      border: isDark ? 'border-slate-400/30' : 'border-slate-500/30',
      text: isDark ? 'text-slate-300' : 'text-slate-600',
      pulse: null,
      icon: AlertCircle,
      title: 'Schedule Unconfigured',
    },
  };

  const currentConfig = STATUS_CONFIGS[status] || STATUS_CONFIGS.UNCONFIGURED;
  const StatusIcon = currentConfig.icon;

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-2.5 sm:gap-3 px-3.5 py-2 rounded-2xl border ${currentConfig.bg} ${currentConfig.border} shadow-xs transition-all`}
    >
      <div className="flex items-center gap-2">
        {currentConfig.pulse ? (
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentConfig.pulse}`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${currentConfig.pulse}`}
            />
          </span>
        ) : (
          <StatusIcon className={`w-4 h-4 ${currentConfig.text}`} />
        )}
        <span className={`text-xs font-bold uppercase tracking-wider ${currentConfig.text}`}>
          {currentConfig.title}
        </span>
      </div>

      {activeSlot && (
        <span
          className={`text-xs font-mono font-semibold pl-3 border-l ${
            isDark ? 'text-white border-white/20' : 'text-slate-700 border-slate-300'
          }`}
        >
          {activeSlot.startTime} – {activeSlot.endTime}
        </span>
      )}

      {nextSlot && (
        <span
          className={`hidden md:inline-block text-[11px] pl-3 border-l ${
            isDark ? 'text-slate-300 border-white/20' : 'text-[#526477] border-slate-300'
          }`}
        >
          Next: <strong className={isDark ? 'text-white font-bold' : 'text-slate-900 font-bold'}>{nextSlot.label}</strong> ({nextSlot.startTime})
        </span>
      )}

      {currentTime && (
        <span
          className={`text-[11px] font-mono px-2 py-0.5 rounded-lg border ${
            isDark
              ? 'bg-white/15 text-white border-white/20'
              : 'bg-white text-slate-700 border-slate-200'
          }`}
        >
          PKT {currentTime}
        </span>
      )}
    </div>
  );
};

export default LivePeriodBadge;
