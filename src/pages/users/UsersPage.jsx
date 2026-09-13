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
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
      if (searchQuery.trim()) queryParams.append('search', searchQuery.trim());
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
  }, [roleFilter, statusFilter, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Bulk Selection Handlers
  const handleToggleSelectUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllOnPage = () => {
    if (selectedUserIds.length === usersList.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(usersList.map((userItem) => userItem._id));
    }
  };

  // Bulk Lifecycle Execution
  const handleExecuteBulkAction = async (actionType) => {
    if (selectedUserIds.length === 0) return;
    setIsBulkOperating(true);
    try {
      const response = await apiClient.post('/users/bulk', {
        action: actionType,
        userIds: selectedUserIds,
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
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur-md">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(inputChangeEvent) => setSearchQuery(inputChangeEvent.target.value)}
                placeholder="Search by full name, email, or civil designation..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800/90 py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(selectChangeEvent) => setRoleFilter(selectChangeEvent.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
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
              className="rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div className="text-xs text-slate-400 font-mono text-right">
            Total Accounts: <span className="font-bold text-white">{totalCount}</span>
          </div>
        </div>

        {/* Bulk Actions Command Strip */}
        {selectedUserIds.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-blue-500/30 bg-blue-950/20 p-3 text-xs text-slate-300">
            <span className="font-semibold text-blue-400">
              {selectedUserIds.length} user{selectedUserIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleExecuteBulkAction('APPROVE')}
                disabled={isBulkOperating}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Bulk Approve</span>
              </button>
              <button
                type="button"
                onClick={() => handleExecuteBulkAction('SUSPEND')}
                disabled={isBulkOperating}
                className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition"
              >
                <UserX className="h-3.5 w-3.5" />
                <span>Bulk Suspend</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedUserIds([])}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="w-10 px-4 py-3.5">
                    <button
                      type="button"
                      onClick={handleSelectAllOnPage}
                      className="text-slate-400 hover:text-white"
                      title="Select All"
                    >
                      {selectedUserIds.length > 0 && selectedUserIds.length === usersList.length ? (
                        <CheckSquare className="h-4 w-4 text-blue-400" />
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
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <RefreshCw className="mx-auto h-6 w-6 animate-spin text-blue-400" />
                      <p className="mt-2 font-medium">Retrieving personnel records...</p>
                    </td>
                  </tr>
                ) : usersList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <Users className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                      <p className="font-semibold text-slate-400">No personnel records found</p>
                      <p className="mt-1 text-xs text-slate-600">Try modifying active role or status filters.</p>
                    </td>
                  </tr>
                ) : (
                  usersList.map((userRecord) => {
                    const isSelected = selectedUserIds.includes(userRecord._id);
                    const isProcessing = actionProcessingUserId === userRecord._id;

                    return (
                      <tr
                        key={userRecord._id}
                        className={`transition hover:bg-slate-800/40 ${isSelected ? 'bg-blue-950/20' : ''}`}
                      >
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectUser(userRecord._id)}
                            className="text-slate-400 hover:text-white"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-blue-400" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-white">{userRecord.fullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 text-slate-500" />
                            <span>{userRecord.email}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-medium text-amber-300">
                            {userRecord.designation || 'Civic Official'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-mono text-cyan-400 font-medium">
                            {userRecord.baseRole || 'TEACHER'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold font-mono text-[10px] ${
                              userRecord.role === 'ROOT_ADMIN'
                                ? 'bg-red-950 text-red-400 border border-red-800'
                                : userRecord.role === 'SUPER_ADMIN'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : userRecord.role === 'ADMIN'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            <Shield className="h-3 w-3" />
                            <span>{userRecord.role}</span>
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                          {userRecord.scope || 'TOWN'}
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`rounded px-2 py-0.5 font-bold text-[10px] ${
                              userRecord.status === 'ACTIVE'
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                                : userRecord.status === 'PENDING_APPROVAL'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                                : 'bg-red-950/80 text-red-400 border border-red-800/50'
                            }`}
                          >
                            {userRecord.status}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
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
                                className="rounded p-1 text-emerald-400 hover:bg-emerald-950/50 hover:text-emerald-300"
                                title="Approve Registration"
                              >
                                <UserCheck className="h-4 w-4" />
                              </button>
                            )}

                            {userRecord.status === 'ACTIVE' && userRecord.role !== 'ROOT_ADMIN' && (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() =>
                                  handleProcessUserLifecycle(
                                    userRecord._id,
                                    'SUSPENDED',
                                    'Administrative suspension'
                                  )
                                }
                                className="rounded p-1 text-red-400 hover:bg-red-950/50 hover:text-red-300"
                                title="Suspend Account"
                              >
                                <UserX className="h-4 w-4" />
                              </button>
                            )}

                            {userRecord.status === 'SUSPENDED' && userRecord.role !== 'ROOT_ADMIN' && (
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
                                className="rounded p-1 text-emerald-400 hover:bg-emerald-950/50 hover:text-emerald-300"
                                title="Reactivate Account"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                            )}

                            {userRecord.role !== 'ROOT_ADMIN' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUserForAuthority(userRecord);
                                  setIsAuthorityModalOpen(true);
                                }}
                                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                                title="Manage Designation & Authority"
                              >
                                <ShieldCheck className="h-4 w-4" />
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
