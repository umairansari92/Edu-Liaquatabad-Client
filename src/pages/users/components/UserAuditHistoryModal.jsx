import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  User,
} from 'lucide-react';
import apiClient from '../../../services/apiClient.js';
import toast from 'react-hot-toast';

export const UserAuditHistoryModal = ({ isOpen, onClose, targetUser }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !targetUser) return;
    const fetchAuditHistory = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get(`/users/${targetUser._id}/audit-history`);
        if (response.data?.success) {
          setAuditLogs(response.data.data?.auditHistory || response.data.data || []);
        }
      } catch (error) {
        toast.error('Unable to retrieve user audit history.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAuditHistory();
  }, [isOpen, targetUser]);

  if (!isOpen || !targetUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#006AC7]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#102033]">User Audit History</h2>
              <p className="text-[11px] text-[#526477]">
                Chronological immutable governance log for {targetUser.fullName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#102033] hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-[#526477]">
          {isLoading ? (
            <div className="py-12 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-[#006AC7] mx-auto mb-2" />
              <p className="font-medium text-[#526477]">Loading audit history...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-[#102033]">No audit history found</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                No recorded state modifications for this user account.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => {
                const isSuccess = log.result === 'SUCCESS';
                return (
                  <div
                    key={log._id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2 hover:bg-white transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`p-1 rounded-md ${
                            isSuccess
                              ? 'bg-emerald-50 text-[#4B7F3A]'
                              : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {isSuccess ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                        </span>
                        <span className="font-mono font-bold text-[#102033] text-[11px]">
                          {log.action}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#526477]">
                      <strong>Actor:</strong> {log.actorName || log.actorId} ({log.actorRole || 'N/A'})
                    </div>

                    {log.reason && (
                      <div className="text-[11px] text-[#102033] bg-white p-2 rounded-lg border border-slate-200/60">
                        <strong>Reason:</strong> {log.reason}
                      </div>
                    )}

                    {(log.previousState || log.newState) && (
                      <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                        {log.previousState && Object.keys(log.previousState).length > 0 && (
                          <div className="p-2 bg-rose-50/50 border border-rose-100 rounded-lg text-rose-900 font-mono">
                            <div className="font-bold text-rose-700 mb-0.5">BEFORE:</div>
                            <pre className="whitespace-pre-wrap break-all text-[9px]">
                              {JSON.stringify(log.previousState, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.newState && Object.keys(log.newState).length > 0 && (
                          <div className="p-2 bg-emerald-50/50 border border-emerald-100 rounded-lg text-emerald-900 font-mono">
                            <div className="font-bold text-emerald-700 mb-0.5">AFTER:</div>
                            <pre className="whitespace-pre-wrap break-all text-[9px]">
                              {JSON.stringify(log.newState, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-[#526477] hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserAuditHistoryModal;
