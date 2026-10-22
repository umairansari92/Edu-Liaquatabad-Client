import React from 'react';
import {
  ArrowRightLeft,
  Building2,
  Calendar,
  FileCheck,
  CheckCircle2,
  Clock,
  Briefcase,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

/**
 * 🏛️ TransferTimelineCard
 * Renders the employee's posting and relocation history as specified in the reference sketch.
 * Shows previous schools, effective dates, official order numbers, and current posting status.
 */
export const TransferTimelineCard = ({
  transferHistory = [],
  currentSchool = null,
  appointmentDate = null,
  joiningDate = null,
  employeeId = 'N/A',
}) => {
  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    try {
      return new Date(dateValue).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(dateValue);
    }
  };

  // Build the unified posting chronological sequence
  const hasHistory = Array.isArray(transferHistory) && transferHistory.length > 0;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#006AC7]">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#102033]">
              Transfer &amp; Posting Details
            </h3>
            <p className="text-xs text-[#526477]">
              Official civil service posting trajectory and institutional relocation history
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-50 text-[#526477] border border-slate-200 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-[#006AC7]" />
            <span>{hasHistory ? `${transferHistory.length + 1} Postings on File` : 'Initial Posting'}</span>
          </span>
        </div>
      </div>

      {/* Visual Timeline Section */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {/* Historical Transfers (if any) */}
        {hasHistory &&
          transferHistory.map((transferItem, index) => {
            const fromName = transferItem.fromSchool?.name || 'Previous School';
            const toName = transferItem.toSchool?.name || 'Destination School';
            const orderNo = transferItem.orderReferenceNumber || `Transfer Directive #${index + 1}`;
            const startDateFormatted = formatDate(transferItem.joiningDate || appointmentDate);
            const endDateFormatted = formatDate(transferItem.relievedDate);

            return (
              <div key={index} className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-slate-400 flex items-center justify-center text-slate-500 shadow-xs group-hover:border-[#006AC7] group-hover:text-[#006AC7] transition-colors">
                  <span className="text-[10px] font-bold">{index + 1}</span>
                </div>

                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 hover:border-slate-300 transition-all space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-bold text-xs text-[#102033]">
                      {fromName}
                    </span>
                    <span className="font-mono text-[11px] text-[#526477] bg-white px-2 py-0.5 rounded border border-slate-200 self-start sm:self-auto">
                      {startDateFormatted} &mdash; {endDateFormatted}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#526477]">
                    <span className="flex items-center gap-1">
                      <FileCheck className="w-3 h-3 text-[#006AC7]" />
                      Order Ref: <strong className="font-mono text-[#102033]">{orderNo}</strong>
                    </span>
                    <span>&bull;</span>
                    <span className="text-slate-500">
                      Relieved on: {endDateFormatted}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

        {/* Current Active Posting Node */}
        <div className="relative group">
          {/* Timeline node with vibrant indicator */}
          <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-md ring-2 ring-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>

          <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-4.5 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-[#102033]">
                    {currentSchool?.name || 'Central Administrative Office / Unassigned'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                    Current Posting
                  </span>
                </div>
                {currentSchool?.code && (
                  <p className="text-[11px] font-mono text-[#526477]">
                    SEMIS Code: {currentSchool.code} {currentSchool.district ? `• ${currentSchool.district}` : ''}
                  </p>
                )}
              </div>

              <span className="font-mono text-xs font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs self-start sm:self-auto">
                {hasHistory && transferHistory[transferHistory.length - 1]?.joiningDate
                  ? formatDate(transferHistory[transferHistory.length - 1].joiningDate)
                  : formatDate(joiningDate || appointmentDate)}{' '}
                &mdash; Present
              </span>
            </div>

            <div className="pt-2 border-t border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-xs text-[#526477]">
              <span className="flex items-center gap-1.5 text-emerald-800 font-medium text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Authoritative Government Deployment • Full Institutional Roster Authority
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                Staff ID: {employeeId}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferTimelineCard;
