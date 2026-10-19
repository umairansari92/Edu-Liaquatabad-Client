import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  X,
  Sparkles,
  Info,
} from 'lucide-react';

/**
 * TimingSyncPreviewModal
 * Comprehensive interactive preview & explicit confirmation modal
 * for synchronizing school operational hours with timetable period slots.
 * Supports separate Regular and Friday Jummah bell schedules.
 */
export const TimingSyncPreviewModal = ({
  isOpen,
  onClose,
  schoolName = '',
  mismatchAnalysis,
  onApplySync,
}) => {
  const [activeTab, setActiveTab] = useState('REGULAR'); // 'REGULAR' | 'FRIDAY'

  if (!isOpen || !mismatchAnalysis) return null;

  const {
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
  } = mismatchAnalysis;

  const isRegular = activeTab === 'REGULAR';
  const schoolStart = isRegular ? regSchoolStart : friSchoolStart;
  const schoolEnd = isRegular ? regSchoolEnd : friSchoolEnd;
  const currentStart = isRegular ? regCurrentStart : friCurrentStart;
  const currentEnd = isRegular ? regCurrentEnd : friCurrentEnd;
  const isMismatch = isRegular ? regularMismatch : fridayMismatch;
  const proposedSlots = isRegular ? proposedRegularSlots : proposedFridaySlots;
  const currentTeachingCount = isRegular ? currentRegTeachingCount : currentFriTeachingCount;
  const proposedTeachingCount = isRegular ? proposedRegTeachingCount : proposedFriTeachingCount;
  const affectedEntries = isRegular ? affectedRegEntries : affectedFriEntries;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="timing-sync-title"
    >
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* ── Modal Header ── */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0a1829] via-[#102033] to-[#162a42] text-white flex items-start justify-between gap-4 border-b border-white/10 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#006AC7] text-white">
                TIMING SYNCHRONIZATION
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                PREVIEW &amp; CONFIRMATION
              </span>
            </div>
            <h2 id="timing-sync-title" className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
              Synchronize School Bell Timings with Timetable
            </h2>
            <p className="text-xs text-slate-300 line-clamp-1">
              {schoolName || 'Official Municipal School Timings & Master Grid Harmonization'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Close timing preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Schedule Tab Switcher ── */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100 bg-slate-50/60 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('REGULAR')}
            className={`pb-3 px-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'REGULAR'
                ? 'border-[#006AC7] text-[#006AC7]'
                : 'border-transparent text-[#526477] hover:text-[#102033]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Regular Days (Mon–Thu, Sat)</span>
            {regularMismatch ? (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                Mismatch
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                In Sync
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FRIDAY')}
            className={`pb-3 px-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'FRIDAY'
                ? 'border-[#006AC7] text-[#006AC7]'
                : 'border-transparent text-[#526477] hover:text-[#102033]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Friday Schedule (Jummah)</span>
            {fridayMismatch ? (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                Mismatch
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                In Sync
              </span>
            )}
          </button>
        </div>

        {/* ── Scrollable Body Content ── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-[#102033]">
          {/* Comparison Cards: School Configured vs Timetable Active */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: School Operational Policy */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#006AC7]">
                  Configured School Operational Hours
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-200/80 text-blue-900">
                  Target Authority
                </span>
              </div>
              <div className="text-xl font-mono font-black text-[#102033] flex items-center gap-2">
                <span>{schoolStart}</span>
                <span className="text-[#8094A8] font-sans">to</span>
                <span>{schoolEnd}</span>
              </div>
              <p className="text-[11px] text-[#526477]">
                Configured in School Profile for {isRegular ? 'regular working days' : 'Friday short schedule (Jummah)'}.
              </p>
            </div>

            {/* Card 2: Current Timetable Period Slots */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              isMismatch ? 'bg-amber-50/70 border-amber-200/80' : 'bg-emerald-50/70 border-emerald-200/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider ${
                  isMismatch ? 'text-amber-800' : 'text-emerald-800'
                }`}>
                  Current Timetable Active Slots
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  isMismatch ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
                }`}>
                  {isMismatch ? 'Out of Sync' : 'Synchronized'}
                </span>
              </div>
              <div className="text-xl font-mono font-black text-[#102033] flex items-center gap-2">
                <span>{currentStart || 'Unset'}</span>
                <span className="text-[#8094A8] font-sans">to</span>
                <span>{currentEnd || 'Unset'}</span>
              </div>
              <p className="text-[11px] text-[#526477]">
                {isMismatch
                  ? `Timetable ends at ${currentEnd || 'earlier'}, diverging from configured closing time ${schoolEnd}.`
                  : 'Timetable period slots perfectly match official school operational hours.'}
              </p>
            </div>
          </div>

          {/* Friday Specific Context Notice */}
          {!isRegular && (
            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold text-xs">Friday (Jummah) Special Early Dismissal Schedule</div>
                <div className="text-[11px] text-indigo-800/90 leading-relaxed">
                  Friday has an official early dismissal at {schoolEnd} to accommodate Friday congregational prayers. Period durations are adjusted proportionately with a shorter recess so students complete essential coursework before dismissal.
                </div>
              </div>
            </div>
          )}

          {/* Proposed Synchronized Slots Breakdown Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black uppercase tracking-wider text-xs text-[#102033] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#006AC7]" />
                <span>Proposed Synchronized Period Slots Breakdown</span>
              </h3>
              <span className="text-[11px] font-bold text-[#526477]">
                Total Slots: {proposedSlots.length} ({proposedTeachingCount} Teaching + 1 Recess)
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-black uppercase text-[#526477]">
                    <th className="py-2.5 px-3">Slot #</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Label</th>
                    <th className="py-2.5 px-3">Start Time</th>
                    <th className="py-2.5 px-3">End Time</th>
                    <th className="py-2.5 px-3 text-right">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proposedSlots.map((slot) => {
                    const isRecess = slot.slotType === 'RECESS';
                    const [sH, sM] = slot.startTime.split(':').map(Number);
                    const [eH, eM] = slot.endTime.split(':').map(Number);
                    const durationMins = (eH * 60 + eM) - (sH * 60 + sM);

                    return (
                      <tr
                        key={`${slot.periodNumber}-${slot.startTime}`}
                        className={isRecess ? 'bg-amber-50/60 font-bold text-amber-900' : 'hover:bg-slate-50'}
                      >
                        <td className="py-2 px-3 font-mono">
                          {isRecess ? 'BREAK' : `P${slot.periodNumber}`}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isRecess
                                ? 'bg-amber-200 text-amber-900'
                                : 'bg-blue-100 text-blue-900'
                            }`}
                          >
                            {slot.slotType}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold">{slot.label}</td>
                        <td className="py-2 px-3 font-mono font-bold">{slot.startTime}</td>
                        <td className="py-2 px-3 font-mono font-bold">{slot.endTime}</td>
                        <td className="py-2 px-3 text-right font-mono text-[#526477]">
                          {durationMins} mins
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Allocation & Safety Verification Analysis */}
          <div className="space-y-3">
            <h3 className="font-black uppercase tracking-wider text-xs text-[#102033] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Assignment Preservation &amp; Conflict Impact Analysis</span>
            </h3>

            {affectedEntries.length === 0 ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
                <div className="font-black text-xs flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Zero Data Loss — All Existing Allocations Fully Preserved!</span>
                </div>
                <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                  Proposed synchronized schedule provides {proposedTeachingCount} teaching periods (vs {currentTeachingCount} currently). All existing subject, teacher, and classroom assignments across Grades 1–5 will automatically map to the new bell slots without disruption or loss of routine.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
                <div className="font-black text-xs flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Caution: {affectedEntries.length} Period Allocations Exceed Proposed Slots</span>
                </div>
                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                  Proposed schedule has {proposedTeachingCount} teaching periods, but current schedule has {affectedEntries.length} entries assigned to higher period numbers. Please verify these entries before publishing.
                </p>
              </div>
            )}
          </div>

          {/* Architectural Draft Protection Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-xs text-[#102033] flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#006AC7]" />
              <span>Two-Stage Safeguard: Draft Updates First, Publishing Requires Explicit Action</span>
            </div>
            <p className="text-[11px] text-[#526477] leading-relaxed">
              Clicking <strong>&ldquo;Apply Proposed Timings to Draft&rdquo;</strong> will update your active in-memory timetable draft and show the updated grid. The official published timetable will <strong>NOT</strong> change until you review the full grid and click <strong>&ldquo;Post / Publish Timetable&rdquo;</strong>.
            </p>
          </div>
        </div>

        {/* ── Modal Footer Controls ── */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-[#526477] hover:bg-white hover:border-slate-300 font-bold text-xs transition cursor-pointer"
          >
            Cancel / Keep Current Schedule
          </button>

          <button
            type="button"
            onClick={onApplySync}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#006AC7] hover:bg-[#005299] text-white font-black text-xs uppercase tracking-wider transition shadow-md shadow-blue-900/20 cursor-pointer active:scale-98"
          >
            <Sparkles className="w-4 h-4" />
            <span>Apply Proposed Timings to Draft</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimingSyncPreviewModal;
