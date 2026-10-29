import React, { useState } from 'react';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Layers,
  FileText,
  ShieldCheck,
  Edit3,
  Calendar,
  Sliders,
} from 'lucide-react';
import HmAdjustTimingsModal from './HmAdjustTimingsModal.jsx';

export const HmSchoolProfileTab = ({ summary, user, onEditSchoolCode }) => {
  const [isTimingsModalOpen, setIsTimingsModalOpen] = useState(false);

  const school = summary?.school || user?.schoolId || {};
  const schoolName = school?.name || 'Assigned Municipal School';
  const schoolCode = school?.code || school?.schoolCode || '—';
  const schoolType = school?.schoolType || 'MUNICIPAL';
  const dmcRegion = school?.dmcRegion || 'Liaquatabad Town Centre';
  const gradeRange = school?.gradeRange
    ? `Grades ${school.gradeRange.lowestGrade ?? 1} to ${school.gradeRange.highestGrade ?? 8}`
    : 'Primary to Elementary';

  const regularGate = school?.timings?.regular
    ? `${school.timings.regular.startTime} – ${school.timings.regular.endTime}`
    : '08:00 – 13:30';
  const regularWindow = school?.timings?.regular
    ? `${school.timings.regular.attendanceWindowStart} – ${school.timings.regular.attendanceWindowEnd}`
    : '07:45 – 14:00';

  const fridayGate = school?.timings?.friday
    ? `${school.timings.friday.startTime} – ${school.timings.friday.endTime}`
    : '07:30 – 12:00';
  const fridayWindow = school?.timings?.friday
    ? `${school.timings.friday.attendanceWindowStart} – ${school.timings.friday.attendanceWindowEnd}`
    : '07:15 – 12:30';

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#F2F8EF] text-[#38662D] border border-[#C9DFBC]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{schoolName}</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Institutional Profile • Education Department, {dmcRegion}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Status: {school?.status || 'Active'}
          </span>
          {onEditSchoolCode && (
            <button
              type="button"
              onClick={onEditSchoolCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Configure code
            </button>
          )}
        </div>
      </div>

      {/* ── Metadata Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: School Identity */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Institutional registration
          </h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-xs text-slate-500 block">SEMIS / School code</span>
              <span className="font-mono font-bold text-[#38662D]">{schoolCode}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Institution category</span>
              <span className="font-medium text-slate-900">{schoolType}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Administrative region</span>
              <span className="font-medium text-slate-900">{dmcRegion}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Academic Scope */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Academic structure
          </h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Grade levels</span>
              <span className="font-medium text-slate-900 flex items-center gap-1.5 mt-0.5">
                <Layers className="w-4 h-4 text-slate-400" />
                {gradeRange}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Daily schedule</span>
              <span className="font-medium text-slate-900 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-4 h-4 text-slate-400" />
                {regularGate}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Total registered sections</span>
              <span className="font-medium text-slate-900">
                {summary?.metrics?.totalSections ?? 0} active sections
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Administrative Head & Access */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            School administration
          </h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Head Master in charge</span>
              <span className="font-bold text-slate-900">{user?.fullName || 'Assigned Head Master'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Designation</span>
              <span className="font-medium text-slate-700">
                {user?.designation
                  ? user.designation.replace(/\s*\(Break-Glass Recovery\)/i, '')
                  : 'Head Master · BPS-17'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Municipal area</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Assigned school boundary
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Operational Timings & Attendance Window Panel ── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#F2F8EF] text-[#38662D] border border-[#C9DFBC]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Operational Timings & Attendance Windows</h2>
              <p className="text-xs text-slate-500">
                Enforced in Pakistan Standard Time (Asia/Karachi PKT, UTC+5)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsTimingsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4B7F3A] hover:bg-[#38662D] text-white text-xs font-semibold shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <Sliders className="w-3.5 h-3.5" />
            Adjust attendance windows
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Regular Schedule */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#4B7F3A]" />
                Regular days (Mon – Thu, Sat)
              </span>
              <span className="text-[11px] font-semibold text-slate-500">Normal Shift</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">School hours</span>
                <span className="font-mono font-semibold text-slate-900 mt-0.5 block">{regularGate}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-emerald-200/80">
                <span className="text-[11px] text-emerald-700 block font-medium">Attendance window</span>
                <span className="font-mono font-bold text-emerald-800 mt-0.5 block">{regularWindow}</span>
              </div>
            </div>
          </div>

          {/* Friday Schedule */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#4B7F3A]" />
                Friday special (Jummah)
              </span>
              <span className="text-[11px] font-semibold text-[#38662D]">Auto-applied</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">School hours</span>
                <span className="font-mono font-semibold text-slate-900 mt-0.5 block">{fridayGate}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-[#C9DFBC]">
                <span className="text-[11px] text-[#38662D] block font-medium">Attendance window</span>
                <span className="font-mono font-bold text-[#38662D] mt-0.5 block">{fridayWindow}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Official Institutional Notice Card ── */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          This institutional profile is certified under the official municipal records of the Education Department,
          Liaquatabad Town Centre (DMC). All student admissions, staff duties, and examination records generated in this
          workspace are legally bound to this institution's registered code.
        </p>
      </div>

      {/* Timing Adjustment Modal */}
      <HmAdjustTimingsModal
        isOpen={isTimingsModalOpen}
        onClose={() => setIsTimingsModalOpen(false)}
        school={school}
      />
    </div>
  );
};

export default HmSchoolProfileTab;
