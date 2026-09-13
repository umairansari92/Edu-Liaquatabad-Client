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
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-[#4B7F3A]">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#102033]">Official Municipal Ledger Exports (CSV)</h3>
            <p className="text-xs text-[#526477]">
              Download UTF-8 Excel-compliant CSV exports with ISO-stamped filenames and comprehensive schemas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Schools CSV Card */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 flex flex-col justify-between space-y-4 hover:border-emerald-300 hover:shadow-sm transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold text-[#102033] text-sm">
                  <School className="h-4 w-4 text-[#4B7F3A]" />
                  Municipal Schools Registry
                </span>
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-mono text-[#4B7F3A]">
                  institutions.csv
                </span>
              </div>
              <p className="text-xs text-[#526477]">
                Exports all registered schools: name, schoolCode, emisCode, type, gender, address, contactPhone, and contactEmail.
              </p>
              <div className="rounded-lg bg-white p-2 text-[11px] font-mono text-[#526477] border border-slate-200">
                Format: <span className="text-[#4B7F3A] font-bold">schools_YYYY-MM-DD.csv</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportSchoolsCsv}
              disabled={isExportingSchools}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#4B7F3A] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#3d682f] transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download className={`h-4 w-4 ${isExportingSchools ? 'animate-bounce' : ''}`} />
              <span>{isExportingSchools ? 'Generating Export...' : 'Download Schools CSV'}</span>
            </button>
          </div>

          {/* Users CSV Card */}
          
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 flex flex-col justify-between space-y-4 hover:border-blue-300 hover:shadow-sm transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold text-[#102033] text-sm">
                  <Users className="h-4 w-4 text-[#006AC7]" />
                  Platform Personnel Directory
                </span>
                <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-mono text-[#006AC7]">
                  personnel.csv
                </span>
              </div>
              <p className="text-xs text-[#526477]">
                Exports user directory: fullName, email, role, status, townId, designation, and assigned school (sensitive hashes excluded).
              </p>
              <div className="rounded-lg bg-white p-2 text-[11px] font-mono text-[#526477] border border-slate-200">
                Format: <span className="text-[#006AC7] font-bold">users_YYYY-MM-DD.csv</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportUsersCsv}
              disabled={isExportingUsers}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#006AC7] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#00529B] transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download className={`h-4 w-4 ${isExportingUsers ? 'animate-bounce' : ''}`} />
              <span>{isExportingUsers ? 'Generating Export...' : 'Download Personnel CSV'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: SYSTEM HEALTH & SERVER TELEMETRY ─── */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-2 text-purple-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#102033]">Live Gateway & Infrastructure Telemetry</h3>
              <p className="text-xs text-[#526477]">
                Real-time operational health extracted directly from <code className="text-purple-600 font-mono">/api/v1/health</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <span className="text-[11px] text-[#8094A8] font-mono hidden sm:inline">
                Polled: {lastRefreshed}
              </span>
            )}
            <button
              type="button"
              onClick={fetchHealthMetrics}
              disabled={isHealthLoading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-[#526477] hover:text-[#102033] hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isHealthLoading ? 'animate-spin' : ''}`} />
              <span>Ping Gateway</span>
            </button>
          </div>
        </div>

        {/* Health Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status & Service */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-[#8094A8]">Gateway Status</span>
              <Server className="h-4 w-4 text-[#4B7F3A]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#4B7F3A] animate-pulse" />
              <span className="text-lg font-black text-[#102033]">
                {healthData?.status || 'ONLINE'}
              </span>
            </div>
            <p className="text-[11px] text-[#8094A8] font-mono truncate">
              Node {healthData?.nodeVersion || 'v20.x'} • {healthData?.platform || 'win32'}
            </p>
          </div>

          {/* Uptime */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-[#8094A8]">Process Uptime</span>
              <Clock className="h-4 w-4 text-[#006AC7]" />
            </div>
            <div className="text-lg font-black text-[#102033] font-mono">
              {healthData?.uptimeFormatted || 'Calculating...'}
            </div>
            <p className="text-[11px] text-[#8094A8] font-mono">
              {healthData?.uptime ? `${healthData.uptime.toLocaleString()} seconds active` : 'Active'}
            </p>
          </div>

          {/* Memory Heap */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-[#8094A8]">V8 Heap Allocation</span>
              <HardDrive className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-lg font-black text-[#102033] font-mono">
              {healthData?.memory?.heapUsedMB ? `${healthData.memory.heapUsedMB} MB` : 'N/A'}
            </div>
            <p className="text-[11px] text-[#8094A8] font-mono">
              Total: {healthData?.memory?.heapTotalMB || '0'} MB • RSS: {healthData?.memory?.rssMB || '0'} MB
            </p>
          </div>

          {/* Database State */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-[#8094A8]">MongoDB Replica</span>
              <Database className="h-4 w-4 text-[#006AC7]" />
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#4B7F3A]" />
              <span className="text-lg font-black text-[#102033]">
                {healthData?.database?.status || 'CONNECTED'}
              </span>
            </div>
            <p className="text-[11px] text-[#8094A8] font-mono truncate">
              Catalog: {healthData?.database?.name || 'school_db'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportingHealthTab;
