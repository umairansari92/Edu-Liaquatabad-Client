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
          {terms.map((t) => (
            <div
              key={t.id}
              onClick={() => setActiveTerm(t.id)}
              className={`cursor-pointer rounded-xl border p-4 transition backdrop-blur-md shadow-lg ${
                activeTerm === t.id
                  ? 'border-indigo-500/50 bg-indigo-950/20 shadow-indigo-950/30'
                  : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900/90'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    t.status === 'UPCOMING'
                      ? 'bg-indigo-950 text-indigo-400 border border-indigo-800/50'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                  }`}
                >
                  {t.status}
                </span>
                <span className="text-xs text-slate-400 font-mono">{t.date}</span>
              </div>
              <h4 className="mt-3 font-bold text-white text-sm">{t.label}</h4>
              <p className="mt-1 text-xs text-slate-400">Liaquatabad Town DMC Jurisdiction</p>
            </div>
          ))}
        </div>

        {/* Grading Structure Matrix */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Board & Municipal Standard Grading Policy</h3>
              <p className="text-xs text-slate-400">Standardized evaluation matrix across all primary and secondary municipal schools</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
            {gradingBands.map((band) => (
              <div
                key={band.grade}
                className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-center space-y-1"
              >
                <span className="text-xl font-black text-indigo-400 font-mono">{band.grade}</span>
                <p className="text-xs font-bold text-white">{band.range}</p>
                <p className="text-[10px] text-slate-400 line-clamp-1">{band.remarks}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Notice */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-xs text-slate-300 flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white">Academic Assessment Instructions</p>
            <p className="text-slate-400 leading-relaxed">
              Subject teachers enter marks directly through their assigned section rosters. Head Masters (HM) and Supervisors have verified review authority before final publication. To configure subjects and courses, visit the Academic Management module.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ExamsPage;
