import React, { useState, useEffect, useCallback } from 'react';
import {
  Terminal,
  Search,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient.js';
import PageContainer from '../../components/layout/PageContainer.jsx';

export const AuditLogsPage = () => {
  const [logsList, setLogsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/admin/super-admins/audit-logs');
      if (response.data?.success) {
        setLogsList(response.data.data?.auditLogs || []);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      toast.error(error.response?.data?.message || 'Unable to retrieve audit ledger.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logsList.filter((log) => {
    const searchNormalized = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      log.action?.toLowerCase().includes(searchNormalized) ||
      log.actorName?.toLowerCase().includes(searchNormalized) ||
      log.actorRole?.toLowerCase().includes(searchNormalized) ||
      log.targetName?.toLowerCase().includes(searchNormalized) ||
      log.reason?.toLowerCase().includes(searchNormalized);

    const matchesResult = !resultFilter || log.result === resultFilter;
    return matchesSearch && matchesResult;
  });

  return (
    <PageContainer
      title="Platform Security & Immutable Audit Stream"
      subtitle="Education Department Liaquatabad Town Centre (DMC) — Cryptographic audit trail, administrative role mutations, and security events"
      actions={
        <button
          type="button"
          onClick={fetchLogs}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur-md">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(inputChangeEvent) => setSearchQuery(inputChangeEvent.target.value)}
                placeholder="Search by action (e.g. USER_ROLE_ASSIGNED, BREAK_GLASS), actor, reason..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800/90 py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <select
              value={resultFilter}
              onChange={(selectChangeEvent) => setResultFilter(selectChangeEvent.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
            >
              <option value="">All Results</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILURE">Failure</option>
              <option value="DENIED">Denied</option>
            </select>
          </div>

          <div className="text-xs text-slate-400 font-mono text-right">
            Total Ledger Entries: <span className="font-bold text-white">{filteredLogs.length}</span>
          </div>
        </div>

        {/* Audit Stream Feed */}
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs shadow-2xl space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="mx-auto h-6 w-6 animate-spin text-purple-400" />
              <p className="mt-2 text-xs">Streaming immutable audit records...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Terminal className="mx-auto h-8 w-8 text-slate-600 mb-2" />
              <p className="font-semibold text-slate-400">No matching audit events</p>
              <p className="mt-1 text-slate-600">Events appear as administrative actions and logins occur.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log._id;

              return (
                <div
                  key={log._id}
                  className="rounded-lg border border-slate-900 bg-slate-900/50 p-3 transition hover:bg-slate-900/80 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[10px] text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>

                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          log.result === 'SUCCESS'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                            : log.result === 'DENIED'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                            : 'bg-red-950 text-red-400 border border-red-800/50'
                        }`}
                      >
                        {log.result}
                      </span>

                      <span className="font-bold text-amber-300">{log.action}</span>

                      <span className="text-slate-400 text-xs">
                        Actor: <strong className="text-white">{log.actorName || 'System'}</strong> ({log.actorRole}
                        {log.actorDesignation ? ` • ${log.actorDesignation}` : ''})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                      <button
                        type="button"
                        onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                        className="text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide' : 'Details'}</span>
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>

                  {log.reason && (
                    <div className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-900">
                      <span className="text-slate-500">Reason: </span>
                      <span>{log.reason}</span>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="mt-2 space-y-2 border-t border-slate-800/80 pt-2 text-[11px]">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-slate-500 font-semibold mb-1">Previous State Snapshot</p>
                          <pre className="rounded bg-slate-950 p-2 text-rose-300 overflow-x-auto text-[10px]">
                            {JSON.stringify(log.previousState, null, 2) || 'null'}
                          </pre>
                        </div>
                        <div>
                          <p className="text-slate-500 font-semibold mb-1">New State Snapshot</p>
                          <pre className="rounded bg-slate-950 p-2 text-emerald-300 overflow-x-auto text-[10px]">
                            {JSON.stringify(log.newState, null, 2) || 'null'}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default AuditLogsPage;
