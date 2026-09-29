import React from 'react';
import {
  Users,
  Mail,
  Shield,
  ShieldCheck,
  School,
  ArrowLeftRight,
  UserCheck,
  UserX,
  CheckCircle2,
  Lock,
  History,
  Eye,
  CheckSquare,
  Square,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';

export const EmployeesTable = ({
  usersList = [],
  isLoading = false,
  selectedUserIds = [],
  onToggleSelect,
  onSelectAll,
  authenticatedUser,
  actionProcessingUserId,
  onProcessLifecycle,
  onOpenAuthorityModal,
  onOpenAssignSchoolModal,
  onOpenTransferModal,
  onOpenProfileDrawer,
  onOpenAuditModal,
}) => {
  const isUserBulkEligible = (u) =>
    u.role !== 'ROOT_ADMIN' && String(u._id) !== String(authenticatedUser?._id);

  const eligibleUsers = usersList.filter(isUserBulkEligible);
  const isAllSelected =
    eligibleUsers.length > 0 && selectedUserIds.length >= eligibleUsers.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#526477]">
          <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-[#526477]">
            <tr>
              <th className="w-10 px-4 py-3.5">
                <button
                  type="button"
                  onClick={onSelectAll}
                  className="text-slate-400 hover:text-[#102033]"
                  title="Select All Eligible Employees"
                >
                  {isAllSelected ? (
                    <CheckSquare className="h-4 w-4 text-[#006AC7]" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3.5">Employee Identity</th>
              <th className="px-4 py-3.5">Civil Designation</th>
              <th className="px-4 py-3.5">Base Role</th>
              <th className="px-4 py-3.5">System Authority</th>
              <th className="px-4 py-3.5">Assigned School</th>
              <th className="px-4 py-3.5">Scope</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-[#526477]">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#006AC7]" />
                  <p className="mt-2 font-medium">Retrieving employee roster...</p>
                </td>
              </tr>
            ) : usersList.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-[#526477]">
                  <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="font-bold text-[#102033]">No employee records found</p>
                  <p className="mt-1 text-xs text-[#8094A8]">
                    No department faculty or administrative staff match active criteria.
                  </p>
                </td>
              </tr>
            ) : (
              usersList.map((employee) => {
                const isSelected = selectedUserIds.includes(employee._id);
                const isProcessing = actionProcessingUserId === employee._id;
                const isProtectedRoot = employee.role === 'ROOT_ADMIN';
                const isSelf = String(employee._id) === String(authenticatedUser?._id);
                const isEligible = !isProtectedRoot && !isSelf;

                const employeeId =
                  employee.teacherProfile?.employeeId ||
                  `EMP-${employee._id?.slice(-6).toUpperCase()}`;

                const isUnassigned = !employee.schoolId;

                return (
                  <tr
                    key={employee._id}
                    className={`transition hover:bg-blue-50/40 ${isSelected ? 'bg-blue-50/60' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3.5">
                      {isEligible ? (
                        <button
                          type="button"
                          onClick={() => onToggleSelect(employee)}
                          className="text-slate-400 hover:text-[#102033]"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-[#006AC7]" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      ) : (
                        <span
                          className="text-slate-300 cursor-not-allowed"
                          title={
                            isProtectedRoot
                              ? 'Root Admin accounts are exempt from bulk actions'
                              : 'Self-selection is prohibited'
                          }
                        >
                          <Square className="h-4 w-4 opacity-35" />
                        </span>
                      )}
                    </td>

                    {/* Employee Identity */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-bold text-[#102033] flex items-center gap-1.5">
                            <span>{employee.fullName}</span>
                          </div>
                          <div className="text-[11px] text-[#526477] font-medium flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <span>{employee.email}</span>
                          </div>
                          <div className="text-[10px] font-mono text-[#006AC7] mt-0.5">
                            {employeeId}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Civil Designation */}
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-amber-700 bg-amber-50/70 border border-amber-200/60 px-2 py-0.5 rounded-md text-[11px]">
                        {employee.designation || 'Civic Official'}
                      </span>
                    </td>

                    {/* Base Role */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[#006AC7] font-semibold text-[11px]">
                        {employee.baseRole || 'TEACHER'}
                      </span>
                    </td>

                    {/* System Authority */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold font-mono text-[10px] ${
                          employee.role === 'ROOT_ADMIN'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : employee.role === 'SUPER_ADMIN'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : employee.role === 'ADMIN'
                            ? 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200'
                            : employee.role === 'HM'
                            ? 'bg-blue-50 text-[#006AC7] border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <Shield className="h-3 w-3" />
                        <span>{employee.role}</span>
                      </span>
                    </td>

                    {/* Assigned School */}
                    <td className="px-4 py-3.5">
                      {isUnassigned ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px]">
                            Unassigned
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenAssignSchoolModal(employee)}
                            className="p-1 rounded-md text-[#006AC7] hover:bg-blue-50 transition"
                            title="Assign to School"
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-[#102033] line-clamp-1">
                            {employee.schoolId.name}
                          </div>
                          {employee.schoolId.schoolCode && (
                            <div className="text-[10px] font-mono text-[#526477]">
                              {employee.schoolId.schoolCode}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Scope */}
                    <td className="px-4 py-3.5 font-mono text-[11px] text-[#526477]">
                      {employee.scope || 'TOWN'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-bold text-[10px] border ${
                          employee.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-[#4B7F3A] border-emerald-200'
                            : employee.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {employee.status}
                      </span>
                    </td>

                    {/* Operations */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Profile Drawer */}
                        <button
                          type="button"
                          onClick={() => onOpenProfileDrawer(employee)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-[#006AC7] hover:bg-blue-50 transition"
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Assign School */}
                        <button
                          type="button"
                          onClick={() => onOpenAssignSchoolModal(employee)}
                          className={`rounded-lg p-1.5 ${
                            isUnassigned
                              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 font-bold'
                              : 'text-slate-400 hover:text-[#006AC7] hover:bg-blue-50'
                          } transition`}
                          title={isUnassigned ? 'Assign School (Pending)' : 'Change School'}
                        >
                          <School className="h-4 w-4" />
                        </button>

                        {/* Transfer Employee */}
                        {!isUnassigned && (
                          <button
                            type="button"
                            onClick={() => onOpenTransferModal(employee)}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-[#006AC7] hover:bg-blue-50 transition"
                            title="Transfer Employee"
                          >
                            <ArrowLeftRight className="h-4 w-4" />
                          </button>
                        )}

                        {/* Change Designation & Authority */}
                        <button
                          type="button"
                          disabled={isSelf || isProtectedRoot}
                          onClick={() => onOpenAuthorityModal(employee)}
                          className={`rounded-lg p-1.5 ${
                            isSelf || isProtectedRoot
                              ? 'text-slate-300 cursor-not-allowed opacity-50'
                              : 'text-slate-400 hover:text-[#102033] hover:bg-slate-100'
                          } transition`}
                          title="Change Designation & Authority"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </button>

                        {/* Lifecycle Action */}
                        {!isProtectedRoot && (
                          <>
                            {employee.status === 'PENDING_APPROVAL' && (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() =>
                                  onProcessLifecycle(
                                    employee._id,
                                    'ACTIVE',
                                    'Administrative onboarding approval'
                                  )
                                }
                                className="rounded-lg p-1.5 text-[#4B7F3A] hover:bg-emerald-50 transition"
                                title="Approve Employee"
                              >
                                <UserCheck className="h-4 w-4" />
                              </button>
                            )}

                            {employee.status === 'ACTIVE' && (
                              <button
                                type="button"
                                disabled={isProcessing || isSelf}
                                onClick={() =>
                                  onProcessLifecycle(
                                    employee._id,
                                    'SUSPENDED',
                                    'Administrative suspension'
                                  )
                                }
                                className={`rounded-lg p-1.5 ${
                                  isSelf
                                    ? 'text-slate-300 cursor-not-allowed opacity-50'
                                    : 'text-rose-600 hover:bg-rose-50'
                                } transition`}
                                title={isSelf ? 'Self-suspension is prohibited' : 'Suspend Account'}
                              >
                                <UserX className="h-4 w-4" />
                              </button>
                            )}

                            {employee.status === 'SUSPENDED' && (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() =>
                                  onProcessLifecycle(
                                    employee._id,
                                    'ACTIVE',
                                    'Reinstated by administrator'
                                  )
                                }
                                className="rounded-lg p-1.5 text-[#4B7F3A] hover:bg-emerald-50 transition"
                                title="Reactivate Account"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}

                        {/* Audit History */}
                        <button
                          type="button"
                          onClick={() => onOpenAuditModal(employee)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-[#102033] hover:bg-slate-100 transition"
                          title="View Audit History"
                        >
                          <History className="h-4 w-4" />
                        </button>
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

export default EmployeesTable;
