import React from 'react';
import {
  TrendingUp,
  FileSpreadsheet,
  Printer,
  GraduationCap,
  Users,
  ClipboardCheck,
  Award,
  ArrowRight,
} from 'lucide-react';

export const HmReportsTab = ({ summary, attendanceAnalytics, exams, onSelectTab }) => {
  const totalStudents = summary?.metrics?.totalStudents ?? 0;
  const teachingStaff = summary?.metrics?.teachingStaff ?? 0;
  const nonTeachingStaff = summary?.metrics?.nonTeachingStaff ?? 0;
  const totalSections = summary?.metrics?.totalSections ?? 0;
  const attendancePercentage = summary?.metrics?.todayAttendance?.attendancePercentage;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-50 text-[#006AC7] border border-blue-200/60">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Institutional reports & analytics</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Summary analytics, attendance records and official academic gazettes
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer shadow-2xs"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          Print summary
        </button>
      </div>

      {/* ── Reports Quick Links & Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Attendance Report */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
              <ClipboardCheck className="w-5 h-5" />
              <span>Attendance register report</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Review daily section-wise student attendance submissions, absence rates, and monthly attendance heatmaps.
            </p>
            <div className="text-xs font-semibold text-slate-900 pt-1">
              Current attendance rate: {attendancePercentage != null ? `${attendancePercentage}%` : 'Pending'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('attendance')}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200 transition cursor-pointer"
          >
            Open attendance register <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Student Enrollment Statistics */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
              <GraduationCap className="w-5 h-5" />
              <span>Student enrollment report</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Complete student directory breakdown with active GR numbers, Global Student IDs, and class allocations.
            </p>
            <div className="text-xs font-semibold text-slate-900 pt-1">
              {totalStudents} active students in {totalSections} sections
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('students')}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200 transition cursor-pointer"
          >
            Open student directory <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Examination Gazette & Tabulation */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
              <Award className="w-5 h-5" />
              <span>DMC examination gazette</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Official school tabulation sheets, student marksheets with municipal seal, and session gazette publication.
            </p>
            <div className="text-xs font-semibold text-slate-900 pt-1">
              {exams?.length || 0} examination sessions registered
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('exams')}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200 transition cursor-pointer"
          >
            View exams & gazette <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HmReportsTab;
