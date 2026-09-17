import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Users,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  Clock,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  School,
  CheckSquare,
  Square,
  ChevronRight,
  Filter,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient.js';
import PageContainer from '../../components/layout/PageContainer.jsx';
import UserAuthorityModal from '../../components/common/UserAuthorityModal.jsx';

export const UsersPage = () => {
  const { user: authenticatedUser } = useSelector((state) => state.auth);

  const [usersList, setUsersList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Debounce search input by 300ms to prevent per-keystroke API hammering
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Bulk Selection State
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isBulkOperating, setIsBulkOperating] = useState(false);

  // Authority & Designation Management Modal
  const [isAuthorityModalOpen, setIsAuthorityModalOpen] = useState(false);
  const [selectedUserForAuthority, setSelectedUserForAuthority] = useState(null);

  // Action processing indicator
  const [actionProcessingUserId, setActionProcessingUserId] = useState(null);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (roleFilter) queryParams.append('role', roleFilter);
      if (statusFilter) queryParams.append('status', statusFilter);
      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      queryParams.append('limit', '50');

      const response = await apiClient.get(`/users?${queryParams.toString()}`);
      if (response.data?.success) {
        setUsersList(response.data.data?.users || []);
        setTotalCount(response.data.data?.total || response.data.data?.users?.length || 0);
      }
    } catch (error) {
      console.error('Failed to load personnel:', error);
      toast.error(error.response?.data?.message || 'Unable to retrieve personnel directory.');
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Bulk Selection Handlers (Secured against Root Admin & Self mutations)
  const isUserBulkEligible = (u) =>
    u.role !== 'ROOT_ADMIN' && String(u._id) !== String(authenticatedUser?._id);

  const handleToggleSelectUser = (userRecord) => {
    if (!isUserBulkEligible(userRecord)) {
      toast.error('Privileged Root Admin accounts and self-modifications are exempt from bulk actions.');
      return;
    }
    setSelectedUserIds((prev) =>
      prev.includes(userRecord._id)
        ? prev.filter((id) => id !== userRecord._id)
        : [...prev, userRecord._id]
    );
  };

  const handleSelectAllOnPage = () => {
    const eligibleUsers = usersList.filter(isUserBulkEligible);
    if (selectedUserIds.length > 0 && selectedUserIds.length >= eligibleUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(eligibleUsers.map((userItem) => userItem._id));
    }
  };

  // Bulk Lifecycle Execution
  const handleExecuteBulkAction = async (actionType) => {
    const sanitizedUserIds = selectedUserIds.filter((id) => {
      const matched = usersList.find((u) => String(u._id) === String(id));
      return matched && isUserBulkEligible(matched);
    });
    if (sanitizedUserIds.length === 0) {
      toast.error('No eligible users selected for bulk action.');
      return;
    }
    setIsBulkOperating(true);
    try {
      const response = await apiClient.post('/users/bulk', {
        action: actionType,
        userIds: sanitizedUserIds,
        reason: `Bulk ${actionType} executed by ${authenticatedUser?.role} (${authenticatedUser?.fullName})`,
      });
      if (response.data?.success) {
        toast.success(response.data.message || `Bulk ${actionType} completed.`);
        setSelectedUserIds([]);
        fetchUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to execute bulk ${actionType}.`);
    } finally {
      setIsBulkOperating(false);
    }
  };

  // Single User Lifecycle State Transition
  const handleProcessUserLifecycle = async (targetUserId, newStatus, reason) => {
    setActionProcessingUserId(targetUserId);
    try {
      const response = await apiClient.patch(`/users/${targetUserId}/lifecycle`, {
        status: newStatus,
        reason,
      });
      if (response.data?.success) {
        toast.success(`User status updated to ${newStatus}.`);
        fetchUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Status transition failed.');
    } finally {
      setActionProcessingUserId(null);
    }
  };

  return (
    <PageContainer
      title="Global Personnel & Faculty Directory"
      subtitle="Education Department Liaquatabad Town Centre (DMC) — Staff roster, civil service designations, and authority governance"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchUsers}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-bold text-[#526477] hover:text-[#102033] hover:bg-slate-50 shadow-sm transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(inputChangeEvent) => setSearchQuery(inputChangeEvent.target.value)}
                placeholder="Search by full name, email, or civil designation..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs font-medium text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(selectChangeEvent) => setRoleFilter(selectChangeEvent.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-[#526477] focus:border-[#006AC7] focus:bg-white focus:outline-none"
            >
              <option value="">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin / DDO</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="HM">Head Master</option>
              <option value="TEACHER">Teacher</option>
              <option value="PEON">Peon / Staff</option>
              <option value="STUDENT">Student</option>
            </select>

            <select
              value={statusFilter}
              onChange={(selectChangeEvent) => setStatusFilter(selectChangeEvent.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-[#526477] focus:border-[#006AC7] focus:bg-white focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div className="text-xs text-[#526477] font-medium text-right">
            Total Accounts: <span className="font-bold text-[#102033]">{totalCount}</span>
          </div>
        </div>

        {/* Bulk Actions Command Strip */}
        {selectedUserIds.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-[#102033] shadow-sm">
            <span className="font-bold text-[#006AC7]">
              {selectedUserIds.length} user{selectedUserIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleExecuteBulkAction('APPROVE')}
                disabled={isBulkOperating}
                className="flex items-center gap-1 rounded-xl bg-[#4B7F3A] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#3D692F] disabled:opacity-50 transition shadow-sm"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Bulk Approve</span>
              </button>
              <button
                type="button"
                onClick={() => handleExecuteBulkAction('SUSPEND')}
                disabled={isBulkOperating}
                className="flex items-center gap-1 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition shadow-sm"
              >
                <UserX className="h-3.5 w-3.5" />
                <span>Bulk Suspend</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedUserIds([])}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#526477] hover:bg-slate-50 transition"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#526477]">
              <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-[#526477]">
                <tr>
                  <th className="w-10 px-4 py-3.5">
                    <button
                      type="button"
                      onClick={handleSelectAllOnPage}
                      className="text-slate-400 hover:text-[#102033]"
                      title="Select All"
                    >
                      {selectedUserIds.length > 0 && selectedUserIds.length === usersList.length ? (
                        <CheckSquare className="h-4 w-4 text-[#006AC7]" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3.5">Personnel Identity</th>
                  <th className="px-4 py-3.5">Civil Designation</th>
                  <th className="px-4 py-3.5">Base Role</th>
                  <th className="px-4 py-3.5">System Authority</th>
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
                      <p className="mt-2 font-medium">Retrieving personnel records...</p>
                    </td>
                  </tr>
                ) : usersList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#526477]">
                      <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                      <p className="font-bold text-[#102033]">No personnel records found</p>
                      <p className="mt-1 text-xs text-[#8094A8]">Try modifying active role or status filters.</p>
                    </td>
                  </tr>
                ) : (
                  usersList.map((userRecord) => {
                    const isSelected = selectedUserIds.includes(userRecord._id);
                    const isProcessing = actionProcessingUserId === userRecord._id;
                    const isProtectedRoot = userRecord.role === 'ROOT_ADMIN';
                    const isSelf = String(userRecord._id) === String(authenticatedUser?._id);
                    const isEligible = !isProtectedRoot && !isSelf;

                    return (
                      <tr
                        key={userRecord._id}
                        className={`transition hover:bg-blue-50/40 ${isSelected ? 'bg-blue-50/60' : ''}`}
                      >
                        <td className="px-4 py-3.5">
                          {isEligible ? (
                            <button
                              type="button"
                              onClick={() => handleToggleSelectUser(userRecord)}
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

                        <td className="px-4 py-3.5">
                          <div className="font-bold text-[#102033]">{userRecord.fullName}</div>
                          <div className="text-[11px] text-[#526477] font-medium flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span>{userRecord.email}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-medium text-amber-700">
                            {userRecord.designation || 'Civic Official'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-mono text-[#006AC7] font-semibold">
                            {userRecord.baseRole || 'TEACHER'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold font-mono text-[10px] ${
                              userRecord.role === 'ROOT_ADMIN'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : userRecord.role === 'SUPER_ADMIN'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : userRecord.role === 'ADMIN'
                                ? 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <Shield className="h-3 w-3" />
                            <span>{userRecord.role}</span>
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-[11px] text-[#526477]">
                          {userRecord.scope || 'TOWN'}
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 font-bold text-[10px] border ${
                              userRecord.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-[#4B7F3A] border-emerald-200'
                                : userRecord.status === 'PENDING_APPROVAL'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {userRecord.status}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isProtectedRoot ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-[10px] font-bold text-rose-700 select-none"
                                title="Supreme ROOT_ADMIN accounts cannot be modified or suspended via web API (SEC-CRIT-01)"
                              >
                                <Lock className="h-3 w-3" />
                                <span>Protected Root</span>
                              </span>
                            ) : (
                              <>
                                {userRecord.status === 'PENDING_APPROVAL' && (
                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() =>
                                      handleProcessUserLifecycle(
                                        userRecord._id,
                                        'ACTIVE',
                                        'Administrative onboarding approval'
                                      )
                                    }
                                    className="rounded-lg p-1.5 text-[#4B7F3A] hover:bg-emerald-50"
                                    title="Approve Registration"
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </button>
                                )}

                                {userRecord.status === 'ACTIVE' && (
                                  <button
                                    type="button"
                                    disabled={isProcessing || isSelf}
                                    onClick={() =>
                                      handleProcessUserLifecycle(
                                        userRecord._id,
                                        'SUSPENDED',
                                        'Administrative suspension'
                                      )
                                    }
                                    className={`rounded-lg p-1.5 ${
                                      isSelf
                                        ? 'text-slate-300 cursor-not-allowed opacity-50'
                                        : 'text-rose-600 hover:bg-rose-50'
                                    }`}
                                    title={isSelf ? 'Self-suspension is prohibited' : 'Suspend Account'}
                                  >
                                    <UserX className="h-4 w-4" />
                                  </button>
                                )}

                                {userRecord.status === 'SUSPENDED' && (
                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() =>
                                      handleProcessUserLifecycle(
                                        userRecord._id,
                                        'ACTIVE',
                                        'Reinstated by administrator'
                                      )
                                    }
                                    className="rounded-lg p-1.5 text-[#4B7F3A] hover:bg-emerald-50"
                                    title="Reactivate Account"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  disabled={isSelf}
                                  onClick={() => {
                                    setSelectedUserForAuthority(userRecord);
                                    setIsAuthorityModalOpen(true);
                                  }}
                                  className={`rounded-lg p-1.5 ${
                                    isSelf
                                      ? 'text-slate-300 cursor-not-allowed opacity-50'
                                      : 'text-slate-400 hover:text-[#102033] hover:bg-slate-100'
                                  }`}
                                  title={isSelf ? 'Self-role alteration is prohibited' : 'Manage Designation & Authority'}
                                >
                                  <ShieldCheck className="h-4 w-4" />
                                </button>
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

        {/* Modal: User Authority & Designation Management */}
        <UserAuthorityModal
          isOpen={isAuthorityModalOpen}
          onClose={() => {
            setIsAuthorityModalOpen(false);
            setSelectedUserForAuthority(null);
          }}
          targetUser={selectedUserForAuthority}
          currentUser={authenticatedUser}
          onAuthorityUpdated={() => {
            fetchUsers();
          }}
        />
      </div>
    </PageContainer>
  );
};

export default UsersPage;
