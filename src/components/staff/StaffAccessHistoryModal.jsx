import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStaffAccessHistory } from '../../store/slices/staffProfileSlice.js';
import {
  History,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Download,
  Clock,
  X,
  Loader2,
} from 'lucide-react';

export const StaffAccessHistoryModal = ({ isOpen, onClose, targetId, staffName }) => {
  const dispatch = useDispatch();
  const { accessHistory, loadingAccessHistory } = useSelector(
    (state) => state.staffProfile
  );

  useEffect(() => {
    if (isOpen && targetId) {
      dispatch(fetchStaffAccessHistory(targetId));
    }
  }, [isOpen, targetId, dispatch]);

  if (!isOpen) return null;

  const getActionBadge = (action) => {
    switch (action) {
      case 'PROFILE_VIEWED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#006AC7] border border-blue-200 flex items-center gap-1">
            <Eye className="w-3 h-3" /> Profile Viewed
          </span>
        );
      case 'PROFILE_ACCESS_REQUESTED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <FileText className="w-3 h-3" /> PDF Access Requested
          </span>
        );
      case 'PROFILE_ACCESS_APPROVED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> PDF Consent Approved
          </span>
        );
      case 'PROFILE_ACCESS_DENIED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> PDF Consent Denied
          </span>
        );
      case 'PROFILE_PDF_DOWNLOADED':
      case 'PROFILE_PDF_GENERATED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
            <Download className="w-3 h-3" /> PDF Downloaded
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-[#006AC7]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#102033]">Access &amp; Download Audit Trail</h2>
              <p className="text-xs text-[#526477]">
                Official transparency history for {staffName || 'this staff member'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-3">
          {loadingAccessHistory ? (
            <div className="p-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#006AC7]" />
              <p className="text-xs">Retrieving audit trail logs...</p>
            </div>
          ) : accessHistory.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <History className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium text-slate-500">No profile access events logged yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/40">
              {accessHistory.map((item) => (
                <div key={item.id} className="p-4 bg-white hover:bg-slate-50/70 transition-colors space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getActionBadge(item.action)}
                      <span className="font-bold text-[#102033]">
                        {item.actorName || 'Official'}
                      </span>
                      {item.actorRole && (
                        <span className="text-[11px] text-slate-400">({item.actorRole})</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {item.purpose && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <strong className="text-slate-700">Official Purpose:</strong> {item.purpose}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Immutable audit logs logged by DMC Security Subsystem</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffAccessHistoryModal;
