import React from 'react';
import {
  Users,
  Mail,
  Shield,
  ShieldCheck,
  School,
  Lock,
  Eye,
  UserCheck,
  UserX,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const AllAccountsTable = ({
  accountsList = [],
  isLoading = false,
  authenticatedUser,
  actionProcessingUserId,
  onProcessLifecycle,
  onOpenAuthorityModal,
  onOpenProfileDrawer,
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#526477]">
          <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-[#526477]">
            <tr>
              <th className="px-4 py-3.5">Account Identity</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">System Role</th>
              <th className="px-4 py-3.5">Civil Designation</th>
              <th className="px-4 py-3.5">Assigned School</th>
              <th className="px-4 py-3.5">Scope</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#526477]">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#006AC7]" />
                  <p className="mt-2 font-medium">Retrieving global accounts...</p>
                </td>
              </tr>
            ) : accountsList.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#526477]">
                  <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="font-bold text-[#102033]">No accounts found</p>
                  <p className="mt-1 text-xs text-[#8094A8]">
                    Try adjusting filter parameters.
                  </p>
                </td>
              </tr>
            ) : (
              accountsList.map((account) => {
                const isProtectedRoot = account.role === 'ROOT_ADMIN';
                const isSelf = String(account._id) === String(authenticatedUser?._id);
                const isProcessing = actionProcessingUserId === account._id;

                const isEmployee = !['STUDENT', 'PARENT'].includes(account.role);
                const isStudent = account.role === 'STUDENT';
                const isParent = account.role === 'PARENT';

                return (
                  <tr key={account._id} className="transition hover:bg-blue-50/40">
                    {/* Identity */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-[#102033]">{account.fullName}</div>
                      <div className="text-[11px] text-[#526477] font-medium flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <span>{account.email}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                          isEmployee
                            ? 'bg-blue-50 text-[#006AC7] border-blue-200'
                            : isStudent
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-emerald-50 text-[#4B7F3A] border-emerald-200'
                        }`}
                      >
                        {isEmployee ? 'EMPLOYEE' : isStudent ? 'STUDENT' : 'PARENT'}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold font-mono text-[10px] ${
                          account.role === 'ROOT_ADMIN'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : account.role === 'SUPER_ADMIN'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : account.role === 'ADMIN'
                            ? 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <Shield className="h-3 w-3" />
                        <span>{account.role}</span>
                      </span>
                    </td>

                    {/* Civil Designation */}
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-amber-700">
                        {account.designation || '—'}
                      </span>
                    </td>

                    {/* Assigned School */}
                    <td className="px-4 py-3.5">
                      {account.schoolId ? (
                        <div className="line-clamp-1 font-semibold text-[#102033]">
                          {account.schoolId.name}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>

                    {/* Scope */}
                    <td className="px-4 py-3.5 font-mono text-[11px] text-[#526477]">
                      {account.scope || 'TOWN'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-bold text-[10px] border ${
                          account.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-[#4B7F3A] border-emerald-200'
                            : account.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {account.status}
                      </span>
                    </td>

                    {/* Operations */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenProfileDrawer(account)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-[#006AC7] hover:bg-blue-50 transition"
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {isProtectedRoot ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700 select-none"
                            title="Protected Root"
                          >
                            <Lock className="h-3 w-3" />
                            <span>Root</span>
                          </span>
                        ) : (
                          <>
                            {account.status === 'PENDING_APPROVAL' && (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() =>
                                  onProcessLifecycle(
                                    account._id,
                                    'ACTIVE',
                                    'Administrative onboarding approval'
                                  )
                                }
                                className="rounded-lg p-1.5 text-[#4B7F3A] hover:bg-emerald-50"
                                title="Approve"
                              >
                                <UserCheck className="h-4 w-4" />
                              </button>
                            )}

                            {account.status === 'ACTIVE' && (
                              <button
                                type="button"
                                disabled={isProcessing || isSelf}
                                onClick={() =>
                                  onProcessLifecycle(
                                    account._id,
                                    'SUSPENDED',
                                    'Administrative suspension'
                                  )
                                }
                                className={`rounded-lg p-1.5 ${
                                  isSelf
                                    ? 'text-slate-300 cursor-not-allowed opacity-50'
                                    : 'text-rose-600 hover:bg-rose-50'
                                }`}
                                title={isSelf ? 'Self-suspension prohibited' : 'Suspend'}
                              >
                                <UserX className="h-4 w-4" />
                              </button>
                            )}

                            {account.status === 'SUSPENDED' && (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() =>
                                  onProcessLifecycle(
                                    account._id,
                                    'ACTIVE',
                                    'Reinstated by administrator'
                                  )
                                }
                                className="rounded-lg p-1.5 text-[#4B7F3A] hover:bg-emerald-50"
                                title="Reactivate"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                            )}

                            {/* Change Authority (only for staff/employees) */}
                            {isEmployee && (
                              <button
                                type="button"
                                disabled={isSelf}
                                onClick={() => onOpenAuthorityModal(account)}
                                className={`rounded-lg p-1.5 ${
                                  isSelf
                                    ? 'text-slate-300 cursor-not-allowed opacity-50'
                                    : 'text-slate-400 hover:text-[#102033] hover:bg-slate-100'
                                }`}
                                title="Manage Authority"
                              >
                                <ShieldCheck className="h-4 w-4" />
                              </button>
                            )}
                          </>
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

export default AllAccountsTable;
