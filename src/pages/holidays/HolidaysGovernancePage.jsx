import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Calendar,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Building2,
  Palmtree,
  Snowflake,
  Moon,
  CloudRain,
  Trash2,
  Info,
  CalendarDays,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient.js';
import PageContainer from '../../components/layout/PageContainer.jsx';

export const HolidaysGovernancePage = () => {
  const { user } = useSelector((state) => state.auth);
  const [holidays, setHolidays] = useState([]);
  const [weeklyOffs, setWeeklyOffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  // Modal State for Custom Holiday / Closure
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [isWeeklyOffModalOpen, setIsWeeklyOffModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTownAdmin = ['ROOT_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(user?.role);
  const isHm = user?.role === 'HM';

  // Holiday Form State
  const [holidayForm, setHolidayForm] = useState({
    title: '',
    reason: '',
    holidayType: 'GAZETTED',
    startDate: '',
    endDate: '',
    scopeType: isHm ? 'SCHOOL' : 'TOWN',
    schoolId: user?.schoolId?._id || user?.schoolId || '',
    showInBanner: true,
  });

  // Weekly-Off Form State
  const [weeklyOffForm, setWeeklyOffForm] = useState({
    offDays: [0, 6], // Saturday & Sunday default
    reason: 'Sindh Government School Education Department Notification (Saturday & Sunday Weekly Off)',
    effectiveFrom: new Date().toISOString().split('T')[0],
  });

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [holidaysRes, weeklyOffRes] = await Promise.all([
        apiClient.get('/holidays'),
        apiClient.get('/weekly-off'),
      ]);
      if (holidaysRes.data?.success) {
        setHolidays(holidaysRes.data.data?.holidays || []);
      }
      if (weeklyOffRes.data?.success) {
        setWeeklyOffs(weeklyOffRes.data.data?.patterns || []);
      }
    } catch (error) {
      console.error('Failed to load holidays:', error);
      toast.error(error.response?.data?.message || 'Unable to retrieve holiday schedule.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Preset Holiday Trigger (Admins only)
  const handleApplyPreset = (presetKey) => {
    const currentYear = new Date().getFullYear();
    if (presetKey === 'SUMMER_VACATION') {
      setHolidayForm({
        title: `Summer Vacation ${currentYear}`,
        reason: 'Annual Summer Vacation notified by School Education & Literacy Department, Government of Sindh.',
        holidayType: 'SUMMER_BREAK',
        startDate: `${currentYear}-06-01`,
        endDate: `${currentYear}-07-31`,
        scopeType: 'TOWN',
        schoolId: '',
        showInBanner: true,
      });
    } else if (presetKey === 'WINTER_VACATION') {
      setHolidayForm({
        title: `Winter Vacation ${currentYear}`,
        reason: 'Annual Winter Vacation notified by Education Department for all public and private municipal schools.',
        holidayType: 'WINTER_BREAK',
        startDate: `${currentYear}-12-22`,
        endDate: `${currentYear}-12-31`,
        scopeType: 'TOWN',
        schoolId: '',
        showInBanner: true,
      });
    } else if (presetKey === 'EID_FITR') {
      const today = new Date().toISOString().split('T')[0];
      setHolidayForm({
        title: 'Eid-ul-Fitr Gazetted Holidays',
        reason: 'Official Federal & Provincial Gazetted Holiday on the auspicious occasion of Eid-ul-Fitr.',
        holidayType: 'GAZETTED',
        startDate: today,
        endDate: today,
        scopeType: 'TOWN',
        schoolId: '',
        showInBanner: true,
      });
    } else if (presetKey === 'RAIN_EMERGENCY') {
      const today = new Date().toISOString().split('T')[0];
      setHolidayForm({
        title: 'Emergency Rain Closure',
        reason: 'Severe weather alert and urban flooding warning issued by Provincial Disaster Management Authority (PDMA).',
        holidayType: 'RAIN_EMERGENCY',
        startDate: today,
        endDate: today,
        scopeType: 'TOWN',
        schoolId: '',
        showInBanner: true,
      });
    }
    setIsHolidayModalOpen(true);
  };

  // Handle Holiday Submit
  const handleHolidaySubmit = async (submitEvent) => {
    submitEvent.preventDefault();
    if (holidayForm.reason.trim().length < 10) {
      toast.error('Justification must be at least 10 characters long.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        title: holidayForm.title.trim(),
        reason: holidayForm.reason.trim(),
        holidayType: holidayForm.holidayType,
        startDate: holidayForm.startDate,
        endDate: holidayForm.endDate,
        scopeType: isHm ? 'SCHOOL' : holidayForm.scopeType,
        schoolId: isHm ? (user.schoolId?._id || user.schoolId) : holidayForm.schoolId || undefined,
        showInBanner: holidayForm.showInBanner,
      };

      const createResponse = await apiClient.post('/holidays', payload);
      if (createResponse.data?.success) {
        toast.success(`"${holidayForm.title}" declared successfully!`);
        setIsHolidayModalOpen(false);
        fetchData();
      }
    } catch (holidayError) {
      console.error('Failed to create holiday:', holidayError);
      toast.error(holidayError.response?.data?.message || 'Failed to declare holiday.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Weekly Off Submit
  const handleWeeklyOffSubmit = async (submitEvent) => {
    submitEvent.preventDefault();
    if (weeklyOffForm.reason.trim().length < 10) {
      toast.error('Justification must be at least 10 characters long.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        offDays: weeklyOffForm.offDays,
        reason: weeklyOffForm.reason.trim(),
        effectiveFrom: weeklyOffForm.effectiveFrom,
        scopeType: 'TOWN',
      };
      const weeklyOffResponse = await apiClient.post('/weekly-off', payload);
      if (weeklyOffResponse.data?.success) {
        toast.success('Weekly-off policy updated town-wide!');
        setIsWeeklyOffModalOpen(false);
        fetchData();
      }
    } catch (weeklyOffError) {
      console.error('Failed to update weekly off:', weeklyOffError);
      toast.error(weeklyOffError.response?.data?.message || 'Failed to update weekly off pattern.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Holiday Cancellation
  const handleCancelHoliday = async (id, title) => {
    const reason = window.prompt(`Please provide a formal cancellation reason for "${title}" (minimum 5 characters):`);
    if (!reason || reason.trim().length < 5) {
      if (reason !== null) toast.error('A cancellation reason of at least 5 characters is required.');
      return;
    }

    try {
      const cancelResponse = await apiClient.patch(`/holidays/${id}/cancel`, { reason: reason.trim() });
      if (cancelResponse.data?.success) {
        toast.success(`Holiday "${title}" cancelled.`);
        fetchData();
      }
    } catch (cancelError) {
      console.error('Failed to cancel holiday:', cancelError);
      toast.error(cancelError.response?.data?.message || 'Failed to cancel holiday.');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const activeTodayHoliday = holidays.find(
    (holidayItem) => holidayItem.status === 'ACTIVE' && todayStr >= holidayItem.startDate && todayStr <= holidayItem.endDate
  );
  const activeWeeklyPattern = weeklyOffs.find((patternItem) => patternItem.status === 'ACTIVE');

  return (
    <PageContainer>
      <div className="space-y-6 text-slate-100">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              <Building2 className="h-4 w-4" />
              <span>Municipal Institutional Governance</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">Calendar &amp; Holiday Governance</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              1-Click Town-wide breaks, Sindh weekend notifications, and Headmaster emergency closures
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {isTownAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setIsWeeklyOffModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>Weekend Policy</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHolidayForm({
                      title: '',
                      reason: '',
                      holidayType: 'GAZETTED',
                      startDate: todayStr,
                      endDate: todayStr,
                      scopeType: 'TOWN',
                      schoolId: '',
                      showInBanner: true,
                    });
                    setIsHolidayModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-emerald-500 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Declare Custom Break</span>
                </button>
              </>
            )}

            {isHm && (
              <button
                type="button"
                onClick={() => {
                  setHolidayForm({
                    title: '',
                    reason: '',
                    holidayType: 'EMERGENCY_CLOSURE',
                    startDate: todayStr,
                    endDate: todayStr,
                    scopeType: 'SCHOOL',
                    schoolId: user.schoolId?._id || user.schoolId,
                    showInBanner: true,
                  });
                  setIsHolidayModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-rose-500 transition"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Declare Emergency Closure</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Status Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Today's Status */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's Operating Status</span>
            <div className="mt-2 flex items-center gap-3">
              {activeTodayHoliday ? (
                <>
                  <div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-400 border border-amber-500/20">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-300">{activeTodayHoliday.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{activeTodayHoliday.reason}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Schools In Session</h3>
                    <p className="text-xs text-slate-400">Regular academic operations active in Liaquatabad</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Card 2: Weekend Policy */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Weekend Pattern</span>
            <div className="mt-2 flex items-center gap-3">
              <div className="rounded-lg bg-cyan-500/10 p-2.5 text-cyan-400 border border-cyan-500/20">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {activeWeeklyPattern?.offDays?.includes(6) ? 'Saturday & Sunday Off' : 'Sunday Only Off'}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-1">
                  {activeWeeklyPattern?.reason || 'Standard Government Weekend Schedule'}
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Jurisdiction Scope */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Administrative Scope</span>
            <div className="mt-2 flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2.5 text-purple-400 border border-purple-500/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Liaquatabad Town Centre</h3>
                <p className="text-xs text-purple-300 font-mono">
                  {user?.role} • {isHm ? 'Single School Authority' : 'Town-Wide Municipal Authority'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 1-Click Town-Wide Rapid Presets (Admins Only) */}
        {isTownAdmin && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  1-Click Rapid Break Presets (Town-Wide Coverage)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">Zero per-register manual entry required</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Summer Vacation */}
              <button
                type="button"
                onClick={() => handleApplyPreset('SUMMER_VACATION')}
                className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 text-left transition hover:border-amber-400 hover:bg-amber-900/30 group"
              >
                <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400 group-hover:scale-105 transition">
                  <Palmtree className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-200">Summer Vacation</h4>
                  <p className="text-[10px] text-amber-400/80">June 01 – July 31 (2 Months)</p>
                </div>
              </button>

              {/* Winter Vacation */}
              <button
                type="button"
                onClick={() => handleApplyPreset('WINTER_VACATION')}
                className="flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3.5 text-left transition hover:border-cyan-400 hover:bg-cyan-900/30 group"
              >
                <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 group-hover:scale-105 transition">
                  <Snowflake className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-cyan-200">Winter Vacation</h4>
                  <p className="text-[10px] text-cyan-400/80">Dec 22 – Dec 31 (Last 10 Days)</p>
                </div>
              </button>

              {/* Eid-ul-Fitr */}
              <button
                type="button"
                onClick={() => handleApplyPreset('EID_FITR')}
                className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-left transition hover:border-emerald-400 hover:bg-emerald-900/30 group"
              >
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 group-hover:scale-105 transition">
                  <Moon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-200">Eid-ul-Fitr</h4>
                  <p className="text-[10px] text-emerald-400/80">3-Day Gazetted Break</p>
                </div>
              </button>

              {/* Rain Emergency */}
              <button
                type="button"
                onClick={() => handleApplyPreset('RAIN_EMERGENCY')}
                className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3.5 text-left transition hover:border-rose-400 hover:bg-rose-900/30 group"
              >
                <div className="rounded-lg bg-rose-500/10 p-2 text-rose-400 group-hover:scale-105 transition">
                  <CloudRain className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-200">Rain Emergency</h4>
                  <p className="text-[10px] text-rose-400/80">Monsoon Weather Alert</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Headmaster Notice */}
        {isHm && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-300">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Headmaster Bounded Closure Policy</p>
              <p className="mt-0.5 text-amber-200/90">
                You may declare single-school emergency closures exclusively for your verified school assignment.
                Town-wide breaks are managed by the Liaquatabad DMC Directorate. Backdating is strictly blocked.
              </p>
            </div>
          </div>
        )}

        {/* Scheduled Holidays & Breaks List */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl backdrop-blur-md overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Scheduled Breaks &amp; Official Closures</h3>
            </div>
            <div className="flex items-center gap-2">
              {['ALL', 'ACTIVE', 'CANCELLED'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    activeTab === tab
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Announcement / Title</th>
                  <th className="px-6 py-3.5">Scope</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Date Range</th>
                  <th className="px-6 py-3.5">Declared By</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {holidays.filter((holidayItem) => activeTab === 'ALL' || holidayItem.status === activeTab).length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                      No breaks or closures found matching filter.
                    </td>
                  </tr>
                ) : (
                  holidays
                    .filter((holidayItem) => activeTab === 'ALL' || holidayItem.status === activeTab)
                    .map((holidayItem) => (
                      <tr key={holidayItem._id} className="hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white">{holidayItem.title}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{holidayItem.reason}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                              h.scopeType === 'TOWN'
                                ? 'bg-purple-950/80 text-purple-300 border-purple-800/50'
                                : 'bg-amber-950/80 text-amber-300 border-amber-800/50'
                            }`}
                          >
                            {h.scopeType === 'TOWN' ? 'Town-Wide' : h.schoolId?.name || 'Single School'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-cyan-400">{h.holidayType}</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-200">
                          {h.startDate} {h.startDate !== h.endDate ? `to ${h.endDate}` : ''}
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {h.declaredBy?.fullName || 'Municipal Authority'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              h.status === 'ACTIVE'
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {h.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {h.status === 'ACTIVE' && (isTownAdmin || isHm) && (
                            <button
                              type="button"
                              onClick={() => handleCancelHoliday(h._id, h.title)}
                              className="rounded p-1 text-slate-400 hover:bg-rose-950/60 hover:text-rose-400 transition"
                              title="Revoke / Cancel Holiday"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Declare Holiday / Emergency Closure */}
        {isHolidayModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="relative w-full max-w-lg rounded-2xl border border-emerald-500/40 bg-slate-900 p-6 shadow-2xl space-y-4 text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {isHm ? 'Declare School Emergency Closure' : 'Declare Holiday / Vacation Break'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isHm
                        ? 'Applies only to your assigned school'
                        : 'Applies town-wide across all municipal schools'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleHolidaySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Title *</label>
                  <input
                    type="text"
                    required
                    value={holidayForm.title}
                    onChange={(inputChangeEvent) => setHolidayForm({ ...holidayForm, title: inputChangeEvent.target.value })}
                    placeholder="e.g. Summer Vacation / Monsoon Rain Emergency"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Start Date *</label>
                    <input
                      type="date"
                      required
                      min={isHm ? todayStr : undefined}
                      value={holidayForm.startDate}
                      onChange={(inputChangeEvent) => setHolidayForm({ ...holidayForm, startDate: inputChangeEvent.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">End Date *</label>
                    <input
                      type="date"
                      required
                      min={holidayForm.startDate || todayStr}
                      value={holidayForm.endDate}
                      onChange={(inputChangeEvent) => setHolidayForm({ ...holidayForm, endDate: inputChangeEvent.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Category *</label>
                    <select
                      value={holidayForm.holidayType}
                      onChange={(selectChangeEvent) => setHolidayForm({ ...holidayForm, holidayType: selectChangeEvent.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="GAZETTED">Gazetted Holiday</option>
                      <option value="SUMMER_BREAK">Summer Break</option>
                      <option value="WINTER_BREAK">Winter Break</option>
                      <option value="RAIN_EMERGENCY">Rain Emergency</option>
                      <option value="EMERGENCY_CLOSURE">Emergency Closure</option>
                      <option value="OTHER">Other Official Break</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Scope</label>
                    <input
                      type="text"
                      disabled
                      value={isHm ? 'Single School Only' : 'Town-Wide (All Schools)'}
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-800/50 px-3 py-2 text-xs font-mono text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Official Justification / Reason * <span className="text-slate-500">(minimum 10 characters)</span>
                  </label>
                  <textarea
                    required
                    rows="3"
                    value={holidayForm.reason}
                    onChange={(textareaChangeEvent) => setHolidayForm({ ...holidayForm, reason: textareaChangeEvent.target.value })}
                    placeholder="Provide specific notification number, weather warning, or infrastructure breakdown details..."
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsHolidayModalOpen(false)}
                    disabled={isSubmitting}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Enforce Announcement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Configure Weekend Policy (Admins Only) */}
        {isWeeklyOffModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="relative w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-slate-900 p-6 shadow-2xl space-y-4 text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Town-Wide Weekend Policy</h3>
                    <p className="text-xs text-slate-400">Configure recurring weekly off days for Liaquatabad</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWeeklyOffModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleWeeklyOffSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Policy Mode *</label>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setWeeklyOffForm({ ...weeklyOffForm, offDays: [0, 6] })}
                      className={`rounded-xl border p-3 text-left transition ${
                        weeklyOffForm.offDays.includes(6)
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                          : 'border-slate-800 bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <div className="font-bold text-xs">Saturday &amp; Sunday Off</div>
                      <div className="text-[10px] mt-0.5 opacity-80">Sindh Govt 2-Day Weekend</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWeeklyOffForm({ ...weeklyOffForm, offDays: [0] })}
                      className={`rounded-xl border p-3 text-left transition ${
                        !weeklyOffForm.offDays.includes(6)
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                          : 'border-slate-800 bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <div className="font-bold text-xs">Sunday Only Off</div>
                      <div className="text-[10px] mt-0.5 opacity-80">Saturday Open as Working Day</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">Effective From Date *</label>
                  <input
                    type="date"
                    required
                    value={weeklyOffForm.effectiveFrom}
                    onChange={(inputChangeEvent) => setWeeklyOffForm({ ...weeklyOffForm, effectiveFrom: inputChangeEvent.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Official Justification * <span className="text-slate-500">(minimum 10 characters)</span>
                  </label>
                  <textarea
                    required
                    rows="3"
                    value={weeklyOffForm.reason}
                    onChange={(textareaChangeEvent) => setWeeklyOffForm({ ...weeklyOffForm, reason: textareaChangeEvent.target.value })}
                    placeholder="Enter government notification reference or administrative justification..."
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsWeeklyOffModalOpen(false)}
                    disabled={isSubmitting}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-cyan-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-cyan-500 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Apply Weekend Policy'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default HolidaysGovernancePage;
