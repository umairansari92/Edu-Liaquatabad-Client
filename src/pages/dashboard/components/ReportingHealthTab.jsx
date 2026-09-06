import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Download,
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  School,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient.js';

export const ReportingHealthTab = () => {
  const [healthData, setHealthData] = useState(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [isExportingSchools, setIsExportingSchools] = useState(false);
  const [isExportingUsers, setIsExportingUsers] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Fetch System Health Telemetry
  const fetchHealthMetrics = useCallback(async () => {
    setIsHealthLoading(true);
    try {
      const response = await apiClient.get('/health');
      if (response.data?.success && response.data?.data) {
        setHealthData(response.data.data);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Failed to fetch health telemetry:', error);
      toast.error('Unable to retrieve real-time system metrics.');
    } finally {
      setIsHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthMetrics();
    const interval = setInterval(fetchHealthMetrics, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [fetchHealthMetrics]);

  // Export Municipal Schools CSV
  const handleExportSchoolsCsv = async () => {
    setIsExportingSchools(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const filename = `schools_${today}.csv`;

      const response = await apiClient.get('/exports/schools', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Schools exported: ${filename}`);
    } catch (error) {
      console.error('Schools export error:', error);
      toast.error('Failed to export municipal schools CSV.');
    } finally {
      setIsExportingSchools(false);
    }
  };

  // Export Personnel Directory CSV
  const handleExportUsersCsv = async () => {
    setIsExportingUsers(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const filename = `users_${today}.csv`;

      const response = await apiClient.get('/exports/users', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Personnel directory exported: ${filename}`);
    } catch (error) {
      console.error('Users export error:', error);
      toast.error('Failed to export platform personnel CSV.');
    } finally {
      setIsExportingUsers(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── SECTION 1: DATA EXPORT HUB ─── */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-400">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Official Municipal Ledger Exports (CSV)</h3>
            <p className="text-xs text-slate-400">
              Download UTF-8 Excel-compliant CSV exports with ISO-stamped filenames and comprehensive schemas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Schools CSV Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold text-white text-sm">
                  <School className="h-4 w-4 text-emerald-400" />
                  Municipal Schools Registry
                </span>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                  institutions.csv
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Exports all registered schools: name, schoolCode, emisCode, type, gender, address, contactPhone, and contactEmail.
              </p>
              <div className="rounded-lg bg-slate-900/80 p-2 text-[11px] font-mono text-slate-400 border border-slate-800">
                Format: <span className="text-emerald-300">schools_YYYY-MM-DD.csv</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportSchoolsCsv}
              disabled={isExportingSchools}
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow cursor-pointer disabled:opacity-50"
            >
              <Download className={`h-4 w-4 ${isExportingSchools ? 'animate-bounce' : ''}`} />
              <span>{isExportingSchools ? 'Generating Export...' : 'Download Schools CSV'}</span>
            </button>
          </div>

          {/* Users CSV Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold text-white text-sm">
                  <Users className="h-4 w-4 text-blue-400" />
                  Platform Personnel Directory
                </span>
                <span className="rounded-md border border-blue-500/30 bg-blue-950/30 px-2 py-0.5 text-[10px] font-mono text-blue-300">
                  personnel.csv
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Exports user directory: fullName, email, role, status, townId, designation, and assigned school (sensitive hashes excluded).
              </p>
              <div className="rounded-lg bg-slate-900/80 p-2 text-[11px] font-mono text-slate-400 border border-slate-800">
                Format: <span className="text-blue-300">users_YYYY-MM-DD.csv</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportUsersCsv}
              disabled={isExportingUsers}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition shadow cursor-pointer disabled:opacity-50"
            >
              <Download className={`h-4 w-4 ${isExportingUsers ? 'animate-bounce' : ''}`} />
              <span>{isExportingUsers ? 'Generating Export...' : 'Download Personnel CSV'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: SYSTEM HEALTH & SERVER TELEMETRY ─── */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-2 text-purple-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live Gateway & Infrastructure Telemetry</h3>
              <p className="text-xs text-slate-400">
                Real-time operational health extracted directly from <code className="text-purple-300 font-mono">/api/v1/health</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                Polled: {lastRefreshed}
              </span>
            )}
            <button
              type="button"
              onClick={fetchHealthMetrics}
              disabled={isHealthLoading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isHealthLoading ? 'animate-spin' : ''}`} />
              <span>Ping Gateway</span>
            </button>
          </div>
        </div>

        {/* Health Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status & Service */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-slate-400">Gateway Status</span>
              <Server className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-lg font-black text-white">
                {healthData?.status || 'ONLINE'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono truncate">
              Node {healthData?.nodeVersion || 'v20.x'} • {healthData?.platform || 'win32'}
            </p>
          </div>

          {/* Uptime */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-slate-400">Process Uptime</span>
              <Clock className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-lg font-black text-white font-mono">
              {healthData?.uptimeFormatted || 'Calculating...'}
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              {healthData?.uptime ? `${healthData.uptime.toLocaleString()} seconds active` : 'Active'}
            </p>
          </div>

          {/* Memory Heap */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-slate-400">V8 Heap Allocation</span>
              <HardDrive className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-lg font-black text-white font-mono">
              {healthData?.memory?.heapUsedMB ? `${healthData.memory.heapUsedMB} MB` : 'N/A'}
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Total: {healthData?.memory?.heapTotalMB || '0'} MB • RSS: {healthData?.memory?.rssMB || '0'} MB
            </p>
          </div>

          {/* Database State */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-slate-400">MongoDB Replica</span>
              <Database className="h-4 w-4 text-teal-400" />
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-lg font-black text-white">
                {healthData?.database?.status || 'CONNECTED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono truncate">
              Catalog: {healthData?.database?.name || 'school_db'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportingHealthTab;
