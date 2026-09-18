import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Building2,
  Users,
  GraduationCap,
  Clock,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRightLeft,
  Activity,
  Layers,
  School as SchoolIcon,
  ShieldCheck,
  Shield,
  Key,
  Lock,
  UserX,
  UserCheck,
  Zap,
  TrendingDown,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageContainer from '../../components/layout/PageContainer.jsx';
import EditSchoolModal from './components/EditSchoolModal.jsx';
import AcademicManagementTab from './components/AcademicManagementTab.jsx';
import TeacherTransferTab from './components/TeacherTransferTab.jsx';
import ReportingHealthTab from './components/ReportingHealthTab.jsx';
import UserAuthorityModal from '../../components/common/UserAuthorityModal.jsx';
import {
  fetchAdminOverview,
  fetchAdminAnalytics,
  fetchSuperAdminsList,
  disableSuperAdminAccount,
  demoteSuperAdminAccount,
  fetchAdminUsersList,
  fetchAdminSchoolsList,
  fetchPendingApprovalsList,
  fetchSystemAuditLogs,
  updateUserLifecycleState,
} from '../../store/slices/adminSlice.js';

export const SuperAdminDashboard = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const { user: authenticatedUser } = useSelector((state) => state.auth);
  const {
    overview,
    isOverviewLoading,
    superAdmins,
    isSuperAdminsLoading,
    users: personnelList,
    usersTotal,
    isUsersLoading,
    schools: schoolsList,
    isSchoolsLoading,
    pendingUsers: pendingList,
    isPendingUsersLoading,
    auditLogs: auditList,
    auditTotalRecords,
    isAuditLogsLoading,
    actionInProgress,
  } = useSelector((state) => state.admin);

  // Tab State
  const [activeTab, setActiveTab] = useState(() => {
    const currentPath = window.location.pathname;
    if (currentPath === '/schools') return 'schools';
    if (currentPath === '/users') return 'users';
    if (currentPath === '/transfers') return 'transfers';
    if (currentPath === '/audit-logs') return 'audit';
    if (currentPath === '/attendance' || currentPath === '/exams') return 'academic';
    if (currentPath === '/documents') return 'reports';
    return 'overview';
  });

  // Filter & Search states
  const [personnelSearch, setPersonnelSearch] = useState('');
  const [personnelRoleFilter, setPersonnelRoleFilter] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // Modals state
  const [selectedUserForAuthority, setSelectedUserForAuthority] = useState(null);
  const [isAuthorityModalOpen, setIsAuthorityModalOpen] = useState(false);

  // Super Admin Action Modal (Suspend / Demote)
  const [targetSuperAdminAction, setTargetSuperAdminAction] = useState(null); // { admin, type: 'SUSPEND' | 'DEMOTE' | 'SELF_SUSPEND' | 'SELF_DEMOTE' }
  const [actionReason, setActionReason] = useState('');

  // Initial Data Fetching
  const refreshAllData = useCallback(() => {
    dispatch(fetchAdminOverview());
    dispatch(fetchSuperAdminsList());
    dispatch(fetchAdminSchoolsList());
    dispatch(fetchAdminUsersList({ limit: 50 }));
    dispatch(fetchPendingApprovalsList());
    dispatch(fetchSystemAuditLogs({ limit: 50 }));
  }, [dispatch]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Sync tab with URL
  useEffect(() => {
    const path = location.pathname;
    if (path === '/schools') setActiveTab('schools');
    else if (path === '/users') setActiveTab('users');
    else if (path === '/transfers') setActiveTab('transfers');
    else if (path === '/audit-logs') setActiveTab('audit');
    else if (path === '/attendance' || path === '/exams') setActiveTab('academic');
    else if (path === '/documents') setActiveTab('reports');
  }, [location.pathname]);

  // Handle Search in Personnel
  const handleSearchPersonnel = (e) => {
    e.preventDefault();
    dispatch(fetchAdminUsersList({ search: personnelSearch, role: personnelRoleFilter || undefined, limit: 50 }));
  };

  // Handle Super Admin Action Execution
  const handleExecuteSuperAdminAction = async () => {
    if (!targetSuperAdminAction || actionReason.trim().length < 10) {
      toast.error('Justification reason must be at least 10 characters long.');
      return;
    }

    const { admin, type } = targetSuperAdminAction;

    try {
      if (type === 'SUSPEND' || type === 'SELF_SUSPEND') {
        const resultAction = await dispatch(disableSuperAdminAccount({ id: admin._id, reason: actionReason.trim() }));
        if (disableSuperAdminAccount.fulfilled.match(resultAction)) {
          toast.success(`Super Admin ${admin.fullName} suspended successfully.`);
          if (type === 'SELF_SUSPEND') {
            toast('Your session was revoked due to self-suspension. Logging out...');
            setTimeout(() => {
              window.location.href = '/login';
            }, 1500);
          }
        } else {
          toast.error(resultAction.payload || 'Failed to suspend Super Admin account.');
        }
      } else if (type === 'DEMOTE' || type === 'SELF_DEMOTE') {
        const resultAction = await dispatch(demoteSuperAdminAccount({ id: admin._id, reason: actionReason.trim() }));
        if (demoteSuperAdminAccount.fulfilled.match(resultAction)) {
          toast.success(`Super Admin ${admin.fullName} demoted to Town Admin.`);
          if (type === 'SELF_DEMOTE') {
            toast('Your session was updated. Redirecting...');
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 1500);
          }
        } else {
          toast.error(resultAction.payload || 'Failed to demote Super Admin account.');
        }
      }
      setTargetSuperAdminAction(null);
      setActionReason('');
    } catch (err) {
      toast.error('An unexpected error occurred.');
    }
  };

  // User Lifecycle Handler
  const handleUpdateStatus = async (userId, newStatus) => {
    const reason = prompt(`Enter reason for updating user lifecycle state to ${newStatus}:`);
    if (!reason || reason.trim().length < 3) {
      toast.error('A justification of at least 3 characters is required.');
      return;
    }
    const res = await dispatch(updateUserLifecycleState({ id: userId, status: newStatus, reason: reason.trim() }));
    if (updateUserLifecycleState.fulfilled.match(res)) {
      toast.success(`User status updated to ${newStatus}.`);
    } else {
      toast.error(res.payload || 'Failed to update user status.');
    }
  };

  return (
    <PageContainer
      title="SUPER ADMIN COMMAND CENTER"
      subtitle="Education Department Liaquatabad Town Centre (DMC) • Primary Operational Authority (Level 90)"
      actions={
        <div className="flex items-center gap-3">
          <button
            onClick={refreshAllData}
            disabled={isOverviewLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-slate-200 text-[#102033] hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isOverviewLoading ? 'animate-spin text-[#006AC7]' : ''}`} />
            Refresh Telemetry
          </button>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 border border-purple-200 text-purple-700 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Super Admin Scope: Global / Town
          </span>
        </div>
      }
    >
      {/* ─── Top KPI Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#526477] tracking-wider">Registered Schools</span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#006AC7]">
              <SchoolIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#102033] mt-2">
            {isOverviewLoading ? '...' : (overview?.activeSchools || schoolsList.length || 0)}
          </p>
          <p className="text-[11px] text-[#526477] mt-0.5">Municipal Registry</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#526477] tracking-wider">Active Faculty</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-[#4B7F3A]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#102033] mt-2">
            {isOverviewLoading ? '...' : (overview?.roleDistribution?.teachers || 0)}
          </p>
          <p className="text-[11px] text-[#4B7F3A] mt-0.5">Teaching Faculty</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#526477] tracking-wider">Super Admins</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#102033] mt-2">
            {isSuperAdminsLoading ? '...' : superAdmins.length}
          </p>
          <p className="text-[11px] text-purple-700 mt-0.5">Active Operational Peers</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#526477] tracking-wider">Pending Approvals</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#102033] mt-2">
            {isPendingUsersLoading ? '...' : pendingList.length}
          </p>
          <p className="text-[11px] text-amber-600 mt-0.5">Staff Onboarding Queue</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#526477] tracking-wider">Audit Events</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#102033] mt-2">
            {isAuditLogsLoading ? '...' : (overview?.totalAuditEvents || auditTotalRecords || 0)}
          </p>
          <p className="text-[11px] text-indigo-600 mt-0.5">Immutable Logs</p>
        </div>
      </div>

      {/* ─── Navigation Tabs ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 border-b border-slate-200 text-xs font-bold">
        {[
          { id: 'overview', label: 'Overview & Governance', icon: Activity },
          { id: 'superAdmins', label: 'Super Admin Governance', icon: ShieldCheck },
          { id: 'users', label: 'People & Access', icon: Users },
          { id: 'schools', label: 'Schools Registry', icon: Building2 },
          { id: 'transfers', label: 'Teacher Transfers', icon: ArrowRightLeft },
          { id: 'academic', label: 'Academic & Exams', icon: GraduationCap },
          { id: 'audit', label: 'System Audit Trail', icon: FileSpreadsheet },
          { id: 'reports', label: 'Reporting & Health', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#102033] text-white shadow-sm'
                  : 'bg-white text-[#526477] hover:bg-slate-100 hover:text-[#102033]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-purple-300' : 'text-[#8094A8]'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: OVERVIEW & GOVERNANCE ──────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                Super Admin Operational Mandate & Policies
              </h3>
              <p className="text-xs text-[#526477] leading-relaxed">
                As a primary operational platform administrator, you possess comprehensive system authority across municipal school institutions, academic registries, teacher appointments, and staff lifecycle operations.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 text-xs space-y-1">
                  <p className="font-bold text-purple-900">Peer Super Admin Authority</p>
                  <p className="text-purple-700 text-[11px]">
                    You can view, authorize, suspend, or demote other Super Admins. You may also self-suspend or self-demote provided at least one active administrator remains.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs space-y-1">
                  <p className="font-bold text-[#006AC7]">Admin Account Management</p>
                  <p className="text-blue-700 text-[11px]">
                    You can assign, promote, and configure municipal town Admins across towns in DMC Liaquatabad.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs space-y-1">
                  <p className="font-bold text-[#4B7F3A]">Non-Collapsing Roles</p>
                  <p className="text-emerald-700 text-[11px]">
                    Civil service designations (BPS grades) and onboarding baseRoles are never altered when updating system authority.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100 text-xs space-y-1">
                  <p className="font-bold text-amber-900">Root Admin Protection</p>
                  <p className="text-amber-700 text-[11px]">
                    Root Admin identity is protected and invisible from administrative listings, ensuring platform foundation security.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Quick Actions
              </h3>
              <div className="space-y-2.5">
                <button
                  onClick={() => setActiveTab('superAdmins')}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-purple-50/60 border border-slate-200 transition-colors text-xs font-bold text-[#102033] flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    Manage Super Admins
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    {superAdmins.length} Active
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 transition-colors text-xs font-bold text-[#102033] flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#006AC7]" />
                    Assign Privileged Authority
                  </span>
                  <span className="text-[10px] text-[#526477]">Role Grant</span>
                </button>
                <button
                  onClick={() => setActiveTab('transfers')}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 transition-colors text-xs font-bold text-[#102033] flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-[#4B7F3A]" />
                    Review Teacher Transfers
                  </span>
                  <span className="text-[10px] text-[#526477]">Approval Queue</span>
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 transition-colors text-xs font-bold text-[#102033] flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    Inspect Audit Logs
                  </span>
                  <span className="text-[10px] text-[#526477]">Immutable Records</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: SUPER ADMIN GOVERNANCE ─────────────────────────────────── */}
      {activeTab === 'superAdmins' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#102033] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                  Super Admin Account Roster
                </h3>
                <p className="text-xs text-[#526477] mt-0.5">
                  View and manage peer Super Admin operational authorities. Credentials are strictly protected.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedUserForAuthority(null);
                  setIsAuthorityModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-2"
              >
                <Key className="w-4 h-4" />
                Authorize New Super Admin
              </button>
            </div>

            {/* Roster Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[#526477] font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <th className="py-3 px-4">Authority / Name</th>
                    <th className="py-3 px-4">Civil Service Title</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Jurisdiction</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isSuperAdminsLoading ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-600" />
                        Loading Super Admin accounts...
                      </td>
                    </tr>
                  ) : superAdmins.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        No Super Admin accounts registered.
                      </td>
                    </tr>
                  ) : (
                    superAdmins.map((admin) => {
                      const isSelf = String(admin._id) === String(authenticatedUser?._id);
                      return (
                        <tr key={admin._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-bold text-[#102033]">
                            <div className="flex items-center gap-2">
                              <span>{admin.fullName}</span>
                              {isSelf && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                                  You
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#526477]">{admin.designation || 'None'}</td>
                          <td className="py-3 px-4 text-[#526477] font-mono">{admin.email}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {admin.scope || 'GLOBAL'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                admin.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {admin.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {admin.status === 'ACTIVE' && (
                                <>
                                  <button
                                    onClick={() =>
                                      setTargetSuperAdminAction({
                                        admin,
                                        type: isSelf ? 'SELF_DEMOTE' : 'DEMOTE',
                                      })
                                    }
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
                                  >
                                    {isSelf ? 'Self-Demote' : 'Demote to Admin'}
                                  </button>
                                  <button
                                    onClick={() =>
                                      setTargetSuperAdminAction({
                                        admin,
                                        type: isSelf ? 'SELF_SUSPEND' : 'SUSPEND',
                                      })
                                    }
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                                  >
                                    {isSelf ? 'Self-Suspend' : 'Suspend'}
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

          {/* Danger Zone: Self-Governance */}
          <div className="p-6 rounded-2xl bg-rose-50/40 border border-rose-200/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Self-Governance Danger Zone
            </div>
            <p className="text-xs text-rose-700 leading-relaxed">
              Platform governance permits Super Admins to self-suspend or demote their authority to Town Admin. An emergency safety check enforces that at least one other active platform administrator remains. When self-action is executed, all active sessions are instantly revoked.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() =>
                  setTargetSuperAdminAction({
                    admin: authenticatedUser,
                    type: 'SELF_DEMOTE',
                  })
                }
                className="px-3.5 py-1.5 rounded-xl bg-white border border-rose-300 text-rose-800 hover:bg-rose-50 text-xs font-bold transition-colors shadow-sm"
              >
                Demote My Authority to Admin
              </button>
              <button
                onClick={() =>
                  setTargetSuperAdminAction({
                    admin: authenticatedUser,
                    type: 'SELF_SUSPEND',
                  })
                }
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm"
              >
                Suspend My Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: PEOPLE & ACCESS ────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#102033] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#006AC7]" />
                  Personnel Directory & Privilege Governance
                </h3>
                <p className="text-xs text-[#526477]">
                  Manage staff, grant authorities, and control lifecycle states. Root Admin accounts remain invisible.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedUserForAuthority(null);
                  setIsAuthorityModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#006AC7] hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-2"
              >
                <Key className="w-4 h-4" />
                Assign Authority
              </button>
            </div>

            {/* Filter Bar */}
            <form onSubmit={handleSearchPersonnel} className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or designation..."
                  value={personnelSearch}
                  onChange={(e) => setPersonnelSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20"
                />
              </div>
              <select
                value={personnelRoleFilter}
                onChange={(e) => setPersonnelRoleFilter(e.target.value)}
                className="py-2 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20"
              >
                <option value="">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="HM">Head Master (HM)</option>
                <option value="TEACHER">Teacher</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#102033] text-xs font-bold transition-colors"
              >
                Filter
              </button>
            </form>

            {/* Personnel Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[#526477] font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Base Role</th>
                    <th className="py-3 px-4">Granted Authority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isUsersLoading ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#006AC7]" />
                        Loading personnel directory...
                      </td>
                    </tr>
                  ) : personnelList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        No personnel records matched your query.
                      </td>
                    </tr>
                  ) : (
                    personnelList.map((usr) => (
                      <tr key={usr._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#102033]">{usr.fullName}</p>
                          <p className="text-[11px] text-[#526477] font-mono">{usr.email}</p>
                        </td>
                        <td className="py-3 px-4 text-[#526477]">{usr.designation || 'None'}</td>
                        <td className="py-3 px-4 font-bold text-blue-700">{usr.baseRole || 'TEACHER'}</td>
                        <td className="py-3 px-4 font-bold text-purple-700">{usr.role}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              usr.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {usr.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedUserForAuthority(usr);
                                setIsAuthorityModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors"
                            >
                              Grant Role
                            </button>
                            {usr.status === 'ACTIVE' ? (
                              <button
                                onClick={() => handleUpdateStatus(usr._id, 'SUSPENDED')}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateStatus(usr._id, 'ACTIVE')}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: SCHOOLS REGISTRY ───────────────────────────────────────── */}
      {activeTab === 'schools' && (
        <div className="space-y-6">
          <AcademicManagementTab schoolsList={schoolsList} />
        </div>
      )}

      {/* ─── TAB 5: TEACHER TRANSFERS ──────────────────────────────────────── */}
      {activeTab === 'transfers' && (
        <div className="space-y-6">
          <TeacherTransferTab
            schoolsList={schoolsList}
            teachersList={personnelList.filter((u) => u.role === 'TEACHER')}
          />
        </div>
      )}

      {/* ─── TAB 6: ACADEMIC & EXAMINATIONS ────────────────────────────────── */}
      {activeTab === 'academic' && (
        <div className="space-y-6">
          <AcademicManagementTab schoolsList={schoolsList} />
        </div>
      )}

      {/* ─── TAB 7: SYSTEM AUDIT TRAIL ─────────────────────────────────────── */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#102033] flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  Real-time Platform Audit Log
                </h3>
                <p className="text-xs text-[#526477]">
                  Immutable ledger of all consequential governance operations. Routine logins/views are excluded by policy.
                </p>
              </div>
              <button
                onClick={() => dispatch(fetchSystemAuditLogs({ limit: 50 }))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-[#102033] flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Logs
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[#526477] font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Target</th>
                    <th className="py-3 px-4">Result</th>
                    <th className="py-3 px-4">Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isAuditLogsLoading ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                        Loading immutable audit trail...
                      </td>
                    </tr>
                  ) : auditList.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        No audit events recorded.
                      </td>
                    </tr>
                  ) : (
                    auditList.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 text-[#526477] whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#102033]">{log.action}</td>
                        <td className="py-3 px-4 font-medium text-[#102033]">{log.actorName}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                            {log.actorRole}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#526477]">{log.targetName || log.targetId || 'N/A'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              log.result === 'SUCCESS'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {log.result}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#526477] max-w-[250px] truncate" title={log.reason}>
                          {log.reason || 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 8: REPORTING & HEALTH ─────────────────────────────────────── */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <ReportingHealthTab />
        </div>
      )}

      {/* ─── SUPER ADMIN ACTION JUSTIFICATION MODAL ────────────────────────── */}
      {targetSuperAdminAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-base">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Confirm Governance Action
            </div>
            <p className="text-xs text-[#526477] leading-relaxed">
              You are about to{' '}
              <strong className="text-[#102033] font-bold uppercase">
                {targetSuperAdminAction.type.replace('_', ' ')}
              </strong>{' '}
              the account for <strong className="text-[#102033] font-bold">{targetSuperAdminAction.admin.fullName}</strong>.
              All active sessions will be invalidated.
            </p>
            <div>
              <label className="block text-xs font-bold text-[#102033] mb-1">
                Mandatory Justification Reason (min 10 chars):
              </label>
              <textarea
                rows="3"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Specify official governance rationale..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setTargetSuperAdminAction(null);
                  setActionReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#526477] hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteSuperAdminAction}
                disabled={actionInProgress || actionReason.trim().length < 10}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {actionInProgress ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── USER PRIVILEGED AUTHORITY MODAL ───────────────────────────────── */}
      {isAuthorityModalOpen && (
        <UserAuthorityModal
          isOpen={isAuthorityModalOpen}
          onClose={() => {
            setIsAuthorityModalOpen(false);
            setSelectedUserForAuthority(null);
          }}
          targetUser={selectedUserForAuthority}
          currentUser={authenticatedUser}
          onAuthorityUpdated={() => {
            refreshAllData();
            setIsAuthorityModalOpen(false);
            setSelectedUserForAuthority(null);
          }}
        />
      )}
    </PageContainer>
  );
};

export default SuperAdminDashboard;
