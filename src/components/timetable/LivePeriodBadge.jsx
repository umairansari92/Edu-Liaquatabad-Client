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
      bg: isDark ? 'bg-emerald-500/20 backdrop-blur-xs' : 'bg-emerald-500/10',
      border: isDark ? 'border-emerald-400/40' : 'border-emerald-500/30',
      text: isDark ? 'text-emerald-300' : 'text-emerald-700',
      pulse: 'bg-emerald-400',
      icon: BookOpen,
      title: activeSlot?.label || 'Teaching Class in Session',
    },
    ASSEMBLY: {
      bg: isDark ? 'bg-indigo-500/20 backdrop-blur-xs' : 'bg-indigo-500/10',
      border: isDark ? 'border-indigo-400/40' : 'border-indigo-500/30',
      text: isDark ? 'text-indigo-200' : 'text-indigo-700',
      pulse: 'bg-indigo-400',
      icon: Sun,
      title: 'Morning Assembly',
    },
    RECESS: {
      bg: isDark ? 'bg-amber-500/20 backdrop-blur-xs' : 'bg-amber-500/10',
      border: isDark ? 'border-amber-400/40' : 'border-amber-500/30',
      text: isDark ? 'text-amber-200' : 'text-amber-700',
      pulse: 'bg-amber-400',
      icon: Coffee,
      title: 'Recess / Interval',
    },
    INTERVAL: {
      bg: isDark ? 'bg-teal-500/20 backdrop-blur-xs' : 'bg-teal-500/10',
      border: isDark ? 'border-teal-400/40' : 'border-teal-500/30',
      text: isDark ? 'text-teal-200' : 'text-teal-700',
      pulse: 'bg-teal-400',
      icon: Clock,
      title: 'Passing Period / Bell Break',
    },
    BEFORE_SCHOOL: {
      bg: isDark ? 'bg-emerald-500/15 backdrop-blur-xs' : 'bg-emerald-50',
      border: isDark ? 'border-emerald-400/30' : 'border-emerald-200',
      text: isDark ? 'text-emerald-300' : 'text-emerald-800',
      pulse: null,
      icon: Sun,
      title: 'Before School Hours',
    },
    AFTER_SCHOOL: {
      bg: isDark ? 'bg-slate-500/20 backdrop-blur-xs' : 'bg-slate-500/10',
      border: isDark ? 'border-slate-400/30' : 'border-slate-500/30',
      text: isDark ? 'text-slate-200' : 'text-slate-700',
      pulse: null,
      icon: Moon,
      title: 'School Hours Concluded',
    },
    OFF_DAY: {
      bg: isDark ? 'bg-slate-500/20 backdrop-blur-xs' : 'bg-slate-500/10',
      border: isDark ? 'border-slate-400/30' : 'border-slate-500/30',
      text: isDark ? 'text-slate-200' : 'text-slate-600',
      pulse: null,
      icon: AlertCircle,
      title: 'Weekly Off (Sunday)',
    },
    UNCONFIGURED: {
      bg: isDark ? 'bg-slate-500/20 backdrop-blur-xs' : 'bg-slate-500/10',
      border: isDark ? 'border-slate-400/30' : 'border-slate-500/30',
      text: isDark ? 'text-slate-200' : 'text-slate-600',
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
            isDark ? 'text-white/85 border-white/20' : 'text-[#526477] border-slate-300'
          }`}
        >
          Next:{' '}
          <strong className={isDark ? 'text-white font-bold' : 'text-slate-900 font-bold'}>
            {nextSlot.label}
          </strong>{' '}
          <span className={isDark ? 'text-emerald-200 font-medium' : 'text-slate-600'}>
            ({nextSlot.startTime})
          </span>
        </span>
      )}

      {currentTime && (
        <span
          className={`text-[11px] font-mono px-2 py-0.5 rounded-lg border font-semibold ${
            isDark
              ? 'bg-white/15 text-white border-white/25 backdrop-blur-xs'
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
