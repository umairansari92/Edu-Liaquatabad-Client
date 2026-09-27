import React from 'react';
import { Clock, Radio, Coffee, BookOpen, Sun, Moon, AlertCircle } from 'lucide-react';

/**
 * Modern Live Period Status Badge & HUD
 * Displays real-time operational status computed deterministically from Karachi time.
 */
export const LivePeriodBadge = ({ liveStatus }) => {
  if (!liveStatus) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-[#526477]">
        <Clock className="w-3.5 h-3.5" />
        <span>No Live Timetable Active</span>
      </div>
    );
  }

  const { status, currentTime, currentDay, activeSlot, nextSlot, message } = liveStatus;

  const STATUS_CONFIGS = {
    ACTIVE_TEACHING: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      pulse: 'bg-emerald-500',
      icon: BookOpen,
      title: activeSlot?.label || 'Teaching Class in Session',
    },
    ASSEMBLY: {
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/30',
      text: 'text-indigo-700 dark:text-indigo-400',
      pulse: 'bg-indigo-500',
      icon: Sun,
      title: 'Morning Assembly',
    },
    RECESS: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-700 dark:text-amber-400',
      pulse: 'bg-amber-500',
      icon: Coffee,
      title: 'Recess / Interval',
    },
    INTERVAL: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-700 dark:text-blue-400',
      pulse: 'bg-blue-500',
      icon: Clock,
      title: 'Passing Period / Bell Break',
    },
    BEFORE_SCHOOL: {
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/30',
      text: 'text-sky-700 dark:text-sky-400',
      pulse: null,
      icon: Sun,
      title: 'Before School Hours',
    },
    AFTER_SCHOOL: {
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/30',
      text: 'text-slate-700 dark:text-slate-400',
      pulse: null,
      icon: Moon,
      title: 'School Hours Concluded',
    },
    OFF_DAY: {
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/30',
      text: 'text-slate-600 dark:text-slate-400',
      pulse: null,
      icon: AlertCircle,
      title: 'Weekly Off (Sunday)',
    },
    UNCONFIGURED: {
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/30',
      text: 'text-slate-600',
      pulse: null,
      icon: AlertCircle,
      title: 'Schedule Unconfigured',
    },
  };

  const currentConfig = STATUS_CONFIGS[status] || STATUS_CONFIGS.UNCONFIGURED;
  const StatusIcon = currentConfig.icon;

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-3 px-3.5 py-2 rounded-2xl border ${currentConfig.bg} ${currentConfig.border} transition-all`}
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
        <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 border-l border-slate-300 dark:border-slate-700 pl-3">
          {activeSlot.startTime} – {activeSlot.endTime}
        </span>
      )}

      {nextSlot && (
        <span className="hidden sm:inline-block text-[11px] text-[#526477] border-l border-slate-300 dark:border-slate-700 pl-3">
          Next: <strong className="text-slate-800 dark:text-slate-200">{nextSlot.label}</strong> ({nextSlot.startTime})
        </span>
      )}

      {currentTime && (
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-white/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border border-slate-200/50">
          PKT {currentTime}
        </span>
      )}
    </div>
  );
};

export default LivePeriodBadge;
