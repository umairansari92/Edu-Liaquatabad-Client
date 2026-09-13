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
          className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-bold text-[#526477] hover:text-[#102033] hover:bg-slate-50 shadow-sm transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(inputChangeEvent) => setSearchQuery(inputChangeEvent.target.value)}
                placeholder="Search by action (e.g. USER_ROLE_ASSIGNED, BREAK_GLASS), actor, reason..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs font-medium text-[#102033] placeholder-slate-400 focus:bg-white focus:border-[#006AC7] focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
              />
            </div>

            <select
              value={resultFilter}
              onChange={(selectChangeEvent) => setResultFilter(selectChangeEvent.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-[#526477] focus:bg-white focus:border-[#006AC7] focus:outline-none"
            >
              <option value="">All Results</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILURE">Failure</option>
              <option value="DENIED">Denied</option>
            </select>
          </div>

          <div className="text-xs text-[#526477] font-medium text-right">
            Total Ledger Entries: <span className="font-bold text-[#102033]">{filteredLogs.length}</span>
          </div>
        </div>

        {/* Audit Stream Feed */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 font-mono text-xs shadow-sm space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-[#526477]">
              <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#006AC7]" />
              <p className="mt-2 text-xs font-medium">Streaming immutable audit records...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-[#526477]">
              <Terminal className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="font-bold text-[#102033]">No matching audit events</p>
              <p className="mt-1 text-slate-400">Events appear as administrative actions and logins occur.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log._id;

              return (
                <div
                  key={log._id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition hover:bg-blue-50/30 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[10px] text-[#8094A8]">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                          log.result === 'SUCCESS'
                            ? 'bg-emerald-50 text-[#4B7F3A] border-emerald-200'
                            : log.result === 'DENIED'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {log.result}
                      </span>

                      <span className="font-bold text-[#006AC7]">{log.action}</span>

                      <span className="text-[#526477] text-xs">
                        Actor: <strong className="text-[#102033]">{log.actorName || 'System'}</strong> ({log.actorRole}
                        {log.actorDesignation ? ` • ${log.actorDesignation}` : ''})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#526477]">
                      <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                      <button
                        type="button"
                        onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                        className="text-[#006AC7] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide' : 'Details'}</span>
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>

                  {log.reason && (
                    <div className="text-xs text-[#102033] bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[#526477] font-medium">Reason: </span>
                      <span>{log.reason}</span>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="mt-2 space-y-2 border-t border-slate-200 pt-2 text-[11px]">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[#526477] font-bold mb-1">Previous State Snapshot</p>
                          <pre className="rounded-lg bg-slate-100 p-2 text-rose-800 border border-slate-200 overflow-x-auto text-[10px]">
                            {JSON.stringify(log.previousState, null, 2) || 'null'}
                          </pre>
                        </div>
                        <div>
                          <p className="text-[#526477] font-bold mb-1">New State Snapshot</p>
                          <pre className="rounded-lg bg-slate-100 p-2 text-emerald-800 border border-slate-200 overflow-x-auto text-[10px]">
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
