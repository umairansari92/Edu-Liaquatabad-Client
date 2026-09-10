import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardCheck,
  Calendar,
  Search,
  RefreshCw,
  School,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient.js';
import PageContainer from '../../components/layout/PageContainer.jsx';

export const AttendancePage = () => {
  const [schoolsList, setSchoolsList] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSchoolsLoading, setIsSchoolsLoading] = useState(false);

  // Weekly cluster trend telemetry
  // NOTE: These figures are representative/sample averages from the analytics controller.
  // A real-time per-day API is not yet implemented; these are system reference baselines.
  const attendanceTrends = [
    { day: 'Monday', rate: '93.4%', boys: '92.4%', girls: '94.8%' },
    { day: 'Tuesday', rate: '94.1%', boys: '93.1%', girls: '95.2%' },
    { day: 'Wednesday', rate: '92.8%', boys: '91.8%', girls: '94.1%' },
    { day: 'Thursday', rate: '91.5%', boys: '90.5%', girls: '93.2%' },
    { day: 'Friday', rate: '89.2%', boys: '88.2%', girls: '91.0%' },
    { day: 'Saturday', rate: '86.7%', boys: '85.9%', girls: '88.4%' },
  ];

  const fetchSchools = async () => {
    setIsSchoolsLoading(true);
    try {
      const response = await apiClient.get('/schools');
      if (response.data?.success) {
        const list = response.data.data?.schools || response.data.data || [];
        setSchoolsList(list);
        if (list.length > 0) setSelectedSchoolId(list[0]._id);
      }
    } catch (err) {
      console.error('Failed to load schools:', err);
      toast.error('Unable to retrieve municipal school list.');
    } finally {
      setIsSchoolsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageContainer
      title="Municipal Digital Attendance Telemetry"
      subtitle="Education Department Liaquatabad Town Centre (DMC) — Daily attendance tracking, student rosters, and school-level analytics"
      actions={
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={fetchSchools}
            disabled={isSchoolsLoading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSchoolsLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Town Attendance Rate</span>
              <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-white">91.8%</p>
            <p className="mt-1 text-[11px] text-slate-500 font-medium">Sample baseline (analytics)</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Boys Attendance</span>
              <div className="rounded-lg bg-blue-500/10 p-1.5 text-blue-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-white">90.3%</p>
            <p className="mt-1 text-[11px] text-slate-500">Sample — boys schools baseline</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Girls Attendance</span>
              <div className="rounded-lg bg-pink-500/10 p-1.5 text-pink-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-white">93.3%</p>
            <p className="mt-1 text-[11px] text-slate-500">Sample — girls schools baseline</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Reporting Schools</span>
              <div className="rounded-lg bg-teal-500/10 p-1.5 text-teal-400">
                <School className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-white">{schoolsList.length}</p>
            <p className="mt-1 text-[11px] text-teal-400">Municipal schools registered</p>
          </div>
        </div>

        {/* Weekly Trend Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Municipal Weekly Attendance Trends</h3>
              <p className="text-xs text-slate-400">Aggregated cluster rates for Liaquatabad Town institutions</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {attendanceTrends.map((trend) => (
              <div
                key={trend.day}
                className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 text-center space-y-1.5"
              >
                <p className="text-xs font-semibold text-slate-400">{trend.day}</p>
                <p className="text-xl font-extrabold text-white">{trend.rate}</p>
                <div className="flex justify-between text-[10px] text-slate-500 border-t border-slate-800/80 pt-1">
                  <span>B: {trend.boys}</span>
                  <span>G: {trend.girls}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Institution Filter & Instructions */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Classroom Attendance Register</h4>
              <p className="text-xs text-slate-400">Select a municipal school to view live class-section logs</p>
            </div>
          </div>

          <select
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none min-w-[240px]"
          >
            {schoolsList.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.schoolCode})
              </option>
            ))}
          </select>
        </div>
      </div>
    </PageContainer>
  );
};

export default AttendancePage;
