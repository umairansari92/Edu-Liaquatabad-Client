import React from 'react';
import {
  Users2,
  Mail,
  Phone,
  School,
  GraduationCap,
  UserCheck,
  UserX,
  CheckCircle2,
  Eye,
  RefreshCw,
} from 'lucide-react';

export const ParentsTable = ({
  parentsList = [],
  isLoading = false,
  onProcessLifecycle,
  actionProcessingUserId,
  onOpenProfileDrawer,
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#526477]">
          <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-[#526477]">
            <tr>
              <th className="px-4 py-3.5">Parent / Guardian Identity</th>
              <th className="px-4 py-3.5">Contact Details</th>
              <th className="px-4 py-3.5">Linked Children (Wards)</th>
              <th className="px-4 py-3.5">Verification Status</th>
              <th className="px-4 py-3.5">Account Status</th>
              <th className="px-4 py-3.5 text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#526477]">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#006AC7]" />
                  <p className="mt-2 font-medium">Retrieving parent accounts...</p>
                </td>
              </tr>
            ) : parentsList.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#526477]">
                  <Users2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="font-bold text-[#102033]">No parent accounts found</p>
                  <p className="mt-1 text-xs text-[#8094A8]">
                    No registered parents match active criteria.
                  </p>
                </td>
              </tr>
            ) : (
              parentsList.map((parent) => {
                const isProcessing = actionProcessingUserId === parent._id;
                const linkedWards = parent.linkedWards || [];

                return (
                  <tr key={parent._id} className="transition hover:bg-blue-50/40">
                    {/* Parent Identity */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-[#102033]">{parent.fullName}</div>
                      <div className="text-[10px] font-mono text-[#006AC7] mt-0.5">
                        PAR-{parent._id?.slice(-6).toUpperCase()}
                      </div>
                    </td>

                    {/* Contact Details */}
                    <td className="px-4 py-3.5">
                      <div className="text-[11px] text-[#526477] font-medium flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <span>{parent.email}</span>
                      </div>
                      {parent.phoneNumber && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="h-2.5 w-2.5" />
                          <span>{parent.phoneNumber}</span>
                        </div>
                      )}
                    </td>

                    {/* Linked Children */}
                    <td className="px-4 py-3.5">
                      {linkedWards.length === 0 ? (
                        <span className="text-slate-400 italic text-[11px]">
                          No linked wards
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {linkedWards.map((link) => {
                            const student = link.studentProfileId;
                            const studentName = student?.studentFullName || 'Student';
                            const schoolName = link.schoolId?.name || '';
                            return (
                              <span
                                key={link._id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#006AC7] border border-blue-200/80 text-[10px] font-medium"
                                title={`${studentName} (${schoolName}) - Status: ${link.verificationStatus}`}
                              >
                                <GraduationCap className="w-3 h-3" />
                                <span className="font-bold">{studentName}</span>
                                <span className="text-[9px] text-[#526477]">
                                  ({link.relationship})
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    {/* Verification Status */}
                    <td className="px-4 py-3.5">
                      <span className="rounded-full px-2.5 py-0.5 font-bold text-[10px] border bg-emerald-50 text-[#4B7F3A] border-emerald-200">
                        VERIFIED
                      </span>
                    </td>

                    {/* Account Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-bold text-[10px] border ${
                          parent.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-[#4B7F3A] border-emerald-200'
                            : parent.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {parent.status}
                      </span>
                    </td>

                    {/* Operations */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenProfileDrawer(parent)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-[#006AC7] hover:bg-blue-50 transition"
                          title="View Parent Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {parent.status === 'PENDING_APPROVAL' && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() =>
                              onProcessLifecycle(
                                parent._id,
                                'ACTIVE',
                                'Parent registration approved'
                              )
                            }
                            className="rounded-lg p-1.5 text-[#4B7F3A] hover:bg-emerald-50"
                            title="Approve Parent"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}

                        {parent.status === 'ACTIVE' && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() =>
                              onProcessLifecycle(
                                parent._id,
                                'SUSPENDED',
                                'Parent account suspended'
                              )
                            }
                            className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                            title="Suspend Account"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        )}

                        {parent.status === 'SUSPENDED' && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() =>
                              onProcessLifecycle(
                                parent._id,
                                'ACTIVE',
                                'Parent reinstated by administrator'
                              )
                            }
                            className="rounded-lg p-1.5 text-[#4B7F3A] hover:bg-emerald-50"
                            title="Reactivate Account"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ParentsTable;
