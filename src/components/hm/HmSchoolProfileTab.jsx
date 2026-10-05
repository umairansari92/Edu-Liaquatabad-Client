import React from 'react';
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
} from 'lucide-react';

export const HmSchoolProfileTab = ({ summary, user, onEditSchoolCode }) => {
  const school = summary?.school || user?.schoolId || {};
  const schoolName = school?.name || 'Assigned Municipal School';
  const schoolCode = school?.code || school?.schoolCode || '—';
  const schoolType = school?.schoolType || 'MUNICIPAL';
  const dmcRegion = school?.dmcRegion || 'Liaquatabad Town Centre';
  const gradeRange = school?.gradeRange
    ? `Grades ${school.gradeRange.lowestGrade ?? 1} to ${school.gradeRange.highestGrade ?? 8}`
    : 'Primary to Elementary';
  const timings = school?.timings?.startTime && school?.timings?.endTime
    ? `${school.timings.startTime} – ${school.timings.endTime}`
    : '08:00 AM – 01:30 PM (Standard Municipal Hours)';

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-50 text-[#006AC7] border border-blue-200/60">
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
              <span className="font-mono font-bold text-[#006AC7]">{schoolCode}</span>
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
                {timings}
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
              <span className="text-xs text-slate-500 block">Jurisdiction boundary</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Active municipal school boundary
              </span>
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
    </div>
  );
};

export default HmSchoolProfileTab;
