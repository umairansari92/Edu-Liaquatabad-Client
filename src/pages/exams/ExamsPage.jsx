import React, { useState } from 'react';
import {
  Award,
  Calendar,
  BookOpen,
  FileCheck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  GraduationCap,
} from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer.jsx';

export const ExamsPage = () => {
  const [activeTerm, setActiveTerm] = useState('ANNUAL_2026');

  const terms = [
    { id: 'ANNUAL_2026', label: 'Annual Board Assessment 2026', status: 'UPCOMING', date: 'March 2026' },
    { id: 'MID_TERM_2025', label: 'Mid-Term Examination 2025', status: 'COMPLETED', date: 'November 2025' },
    { id: 'DIAGNOSTIC_2025', label: 'Quarterly Diagnostic Tests', status: 'COMPLETED', date: 'September 2025' },
  ];

  const gradingBands = [
    { grade: 'A-1', range: '80% — 100%', remarks: 'Outstanding / Exceptional Merit' },
    { grade: 'A', range: '70% — 79%', remarks: 'Excellent Performance' },
    { grade: 'B', range: '60% — 69%', remarks: 'Very Good Standard' },
    { grade: 'C', range: '50% — 59%', remarks: 'Satisfactory / Average' },
    { grade: 'D', range: '40% — 49%', remarks: 'Pass Standard' },
    { grade: 'F', range: 'Below 40%', remarks: 'Needs Improvement / Remedial Required' },
  ];

  return (
    <PageContainer
      title="Exams, Curriculum & Student Results"
      subtitle="Education Department Liaquatabad Town Centre (DMC) — Municipal assessment cycles, grading standards, and academic marks transcripts"
    >
      <div className="space-y-6">
        {/* Term Selector Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {terms.map((termItem) => (
            <div
              key={termItem.id}
              onClick={() => setActiveTerm(termItem.id)}
              className={`cursor-pointer rounded-2xl border p-5 transition shadow-sm ${
                activeTerm === termItem.id
                  ? 'border-[#006AC7] bg-blue-50/40 ring-1 ring-[#006AC7]'
                  : 'border-slate-200/80 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                    termItem.status === 'UPCOMING'
                      ? 'bg-blue-50 text-[#006AC7] border-blue-200'
                      : 'bg-emerald-50 text-[#4B7F3A] border-emerald-200'
                  }`}
                >
                  {termItem.status}
                </span>
                <span className="text-xs text-[#8094A8] font-medium">{termItem.date}</span>
              </div>
              <h4 className="mt-3 font-bold text-[#102033] text-sm">{termItem.label}</h4>
              <p className="mt-1 text-xs text-[#526477]">Liaquatabad Town DMC Jurisdiction</p>
            </div>
          ))}
        </div>

        {/* Grading Structure Matrix */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-blue-50 p-2.5 text-[#006AC7]">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#102033]">Board & Municipal Standard Grading Policy</h3>
              <p className="text-xs text-[#526477]">Standardized evaluation matrix across all primary and secondary municipal schools</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
            {gradingBands.map((band) => (
              <div
                key={band.grade}
                className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-center space-y-1"
              >
                <span className="text-xl font-black text-[#006AC7] font-mono">{band.grade}</span>
                <p className="text-xs font-bold text-[#102033]">{band.range}</p>
                <p className="text-[10px] text-[#8094A8] line-clamp-1">{band.remarks}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Notice */}
        <div className="rounded-2xl border border-blue-100 bg-[#F0F8FF]/80 p-5 text-xs text-[#102033] flex items-start gap-3 shadow-sm">
          <BookOpen className="h-5 w-5 text-[#006AC7] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-[#102033]">Academic Assessment Instructions</p>
            <p className="text-[#526477] leading-relaxed">
              Subject teachers enter marks directly through their assigned section rosters. Head Masters (HM) and Supervisors have verified review authority before final publication. To configure subjects and courses, visit the Academic Management module.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ExamsPage;
