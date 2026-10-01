import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Building2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  BookOpen,
  Coffee,
  Sun,
  AlertTriangle,
  CheckCircle2,
  Users,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import LivePeriodBadge from './LivePeriodBadge.jsx';
import { fetchTownLiveMonitor } from '../../store/slices/timetableSlice.js';

export const TownLiveMonitorView = () => {
  const dispatch = useDispatch();
  const { townLiveMonitor, isLoading } = useSelector((state) => state.timetable);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE_TEACHING' | 'RECESS' | 'NO_TIMETABLE'

  useEffect(() => {
    dispatch(fetchTownLiveMonitor());
  }, [dispatch]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = townLiveMonitor.length;
    const withTimetable = townLiveMonitor.filter((schoolRecord) => schoolRecord.hasTimetable).length;
    const teachingRightNow = townLiveMonitor.filter(
      (schoolRecord) => schoolRecord.liveStatus?.status === 'ACTIVE_TEACHING'
    ).length;
    const recessOrAssembly = townLiveMonitor.filter((schoolRecord) =>
      ['RECESS', 'ASSEMBLY'].includes(schoolRecord.liveStatus?.status)
    ).length;

    const totalOngoingClasses = townLiveMonitor.reduce((sum, schoolRecord) => {
      return sum + (schoolRecord.activePeriodsSummary?.totalOngoingClasses || 0);
    }, 0);

    return {
      total,
      withTimetable,
      coveragePercent: total > 0 ? Math.round((withTimetable / total) * 100) : 0,
      teachingRightNow,
      recessOrAssembly,
      totalOngoingClasses,
    };
  }, [townLiveMonitor]);

  // Filtered Schools
  const filteredSchools = useMemo(() => {
    return townLiveMonitor.filter((school) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        school.schoolName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.schoolCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.emisCode?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'NO_TIMETABLE') return !school.hasTimetable;
      if (statusFilter === 'ACTIVE_TEACHING') return school.liveStatus?.status === 'ACTIVE_TEACHING';
      if (statusFilter === 'RECESS') return ['RECESS', 'ASSEMBLY'].includes(school.liveStatus?.status);

      return true;
    });
  }, [townLiveMonitor, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* ─── Top KPI HUD ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-[#8094A8] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Monitored Schools</span>
            <Building2 className="w-4 h-4 text-[#006AC7]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#102033]">{metrics.total}</div>
          <div className="text-xs text-[#526477] font-medium mt-1">
            {metrics.withTimetable} schools with published timetables ({metrics.coveragePercent}%)
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-[#8094A8] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Live Classes Running</span>
            <BookOpen className="w-4 h-4 text-[#4B7F3A]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#4B7F3A]">
            {metrics.totalOngoingClasses}
          </div>
          <div className="text-xs text-[#526477] font-medium mt-1">
            Active class sessions currently in progress
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-[#8094A8] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Teaching in Session</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#102033]">
            {metrics.teachingRightNow}
          </div>
          <div className="text-xs text-[#526477] font-medium mt-1">Schools in teaching period right now</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-[#8094A8] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Recess / Assembly</span>
            <Coffee className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700">{metrics.recessOrAssembly}</div>
          <div className="text-xs text-[#526477] font-medium mt-1">Schools in break or morning assembly</div>
        </div>
      </div>

      {/* ─── Filter Bar ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8094A8]" />
          <input
            type="text"
            placeholder="Search school name, code, SEMIS..."
            value={searchQuery}
            onChange={(changeEvent) => setSearchQuery(changeEvent.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-[#102033]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(changeEvent) => setStatusFilter(changeEvent.target.value)}
            className="p-2 rounded-xl border border-slate-200 text-xs font-bold text-[#102033] bg-white flex-1 sm:flex-none"
          >
            <option value="ALL">All Schools Status</option>
            <option value="ACTIVE_TEACHING">Active Teaching Period</option>
            <option value="RECESS">Recess / Assembly</option>
            <option value="NO_TIMETABLE">No Timetable Configured</option>
          </select>

          <button
            onClick={() => dispatch(fetchTownLiveMonitor())}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 text-[#526477] hover:bg-slate-50 transition cursor-pointer"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── School Monitoring Cards Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchools.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[#8094A8] bg-white rounded-2xl border border-slate-200/80">
            No municipal schools found matching your search criteria.
          </div>
        ) : (
          filteredSchools.map((school) => {
            const hasActiveClasses = Boolean(school.activePeriodsSummary?.totalOngoingClasses);

            return (
              <div
                key={school.schoolId}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow transition space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#102033] line-clamp-1">{school.schoolName}</h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8094A8]">
                      {school.schoolCode && (
                        <span className="font-mono font-bold text-[#006AC7]">
                          Code: {school.schoolCode}
                        </span>
                      )}
                      {school.emisCode && (
                        <span>• SEMIS: {school.emisCode}</span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      school.hasTimetable
                        ? 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {school.hasTimetable ? 'ACTIVE' : 'PENDING'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <LivePeriodBadge liveStatus={school.liveStatus} />

                  {school.activePeriodsSummary && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="text-[#526477] font-medium">Ongoing Classes Right Now</span>
                      <span className="font-black text-[#4B7F3A] font-mono">
                        {school.activePeriodsSummary.totalOngoingClasses} Active
                      </span>
                    </div>
                  )}

                  {!school.hasTimetable && (
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>Timetable has not yet been published by the Head Master.</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TownLiveMonitorView;
