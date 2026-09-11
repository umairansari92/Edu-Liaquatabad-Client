import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Crown,
  ShieldCheck,
  Building2,
  Users,
  GraduationCap,
  ShieldAlert,
  Clock,
  RefreshCw,
  Plus,
  UserCheck,
  UserX,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Key,
  Server,
  Lock,
  Unlock,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Activity,
  Terminal,
  Zap,
  Radio,
  TrendingUp,
  BarChart3,
  Globe,
  MapPin,
  Mail,
  Phone,
  Check,
  Copy,
  Layers,
  School as SchoolIcon,
  Shield,
  FileSpreadsheet,
  Edit2,
  ArrowRightLeft,
  Download,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient.js';
import PageContainer from '../../components/layout/PageContainer.jsx';
import EditSchoolModal from './components/EditSchoolModal.jsx';
import AcademicManagementTab from './components/AcademicManagementTab.jsx';
import TeacherTransferTab from './components/TeacherTransferTab.jsx';
import ReportingHealthTab from './components/ReportingHealthTab.jsx';
import UserAuthorityModal from '../../components/common/UserAuthorityModal.jsx';

export const RootAdminDashboard = () => {
  const { user: authenticatedUser } = useSelector((state) => state.auth);


  const location = useLocation();
  const navigate = useNavigate();

  // Active command center tab (synchronized with sidebar routes)
  const [activeTab, setActiveTab] = useState(() => {
    const p = window.location.pathname;
    if (p === '/schools') return 'schools';
    if (p === '/users') return 'users';
    if (p === '/transfers') return 'transfers';
    if (p === '/audit-logs') return 'audit';
    if (p === '/attendance' || p === '/exams') return 'academic';
    if (p === '/documents') return 'reports';
    return 'schools';
  });

  // Sync tab when sidebar link is clicked
  useEffect(() => {
    const p = location.pathname;
    if (p === '/schools') setActiveTab('schools');
    else if (p === '/users') setActiveTab('users');
    else if (p === '/transfers') setActiveTab('transfers');
    else if (p === '/audit-logs') setActiveTab('audit');
    else if (p === '/attendance' || p === '/exams') setActiveTab('academic');
    else if (p === '/documents') setActiveTab('reports');
    else if (p === '/dashboard') setActiveTab('schools');
  }, [location.pathname]);

  // Overview & Telemetry State
  const [overviewData, setOverviewData] = useState(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);

  // Analytics & Visual Metrics State
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  // Municipal Schools Directory State
  const [schoolsList, setSchoolsList] = useState([]);
  const [isSchoolsLoading, setIsSchoolsLoading] = useState(false);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [schoolTypeFilter, setSchoolTypeFilter] = useState('');
  const [schoolGenderFilter, setSchoolGenderFilter] = useState('');

  // Global Personnel & User Directory State
  const [usersList, setUsersList] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [usersTotalCount, setUsersTotalCount] = useState(0);

  // Super Admins Roster State
  const [superAdminsList, setSuperAdminsList] = useState([]);
  const [isSuperAdminsLoading, setIsSuperAdminsLoading] = useState(false);

  // Pending Approvals State
  const [pendingUsersList, setPendingUsersList] = useState([]);
  const [isPendingUsersLoading, setIsPendingUsersLoading] = useState(false);

  // Audit Logs State
  const [auditLogsList, setAuditLogsList] = useState([]);
  const [isAuditLogsLoading, setIsAuditLogsLoading] = useState(false);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditResultFilter, setAuditResultFilter] = useState('');

  // Register School Modal State
  const [isRegisterSchoolModalOpen, setIsRegisterSchoolModalOpen] = useState(false);
  const [registerSchoolFormData, setRegisterSchoolFormData] = useState({
    name: '',
    schoolCode: '',
    emisCode: '',
    schoolType: 'SECONDARY',
    genderType: 'BOYS',
    address: '',
    contactPhone: '',
    contactEmail: '',
  });
  const [isRegisteringSchoolSubmitting, setIsRegisteringSchoolSubmitting] = useState(false);

  // Authorize Super Admin Modal State (Existing User Grant Workflow)
  const [isAuthorizeModalOpen, setIsAuthorizeModalOpen] = useState(false);
  const [authorizeFormData, setAuthorizeFormData] = useState({
    userId: '',
    authority: 'SUPER_ADMIN',
    scope: 'GLOBAL',
    reason: '',
  });
  const [authorizeUserSearch, setAuthorizeUserSearch] = useState('');
  const [isAuthorizingSubmitting, setIsAuthorizingSubmitting] = useState(false);


  // Disable Super Admin Modal State
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [selectedSuperAdminToDisable, setSelectedSuperAdminToDisable] = useState(null);
  const [disableReasonText, setDisableReasonText] = useState('');
  const [isDisablingSubmitting, setIsDisablingSubmitting] = useState(false);

  // Emergency Broadcast Modal State
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastFormData, setBroadcastFormData] = useState({
    title: '',
    message: '',
    severity: 'INFO',
  });
  const [isBroadcastSubmitting, setIsBroadcastSubmitting] = useState(false);

  // Edit Municipal School Modal State
  const [isEditSchoolModalOpen, setIsEditSchoolModalOpen] = useState(false);
  const [selectedSchoolForEdit, setSelectedSchoolForEdit] = useState(null);

  // Authority & Designation Management Modal State
  const [isAuthorityModalOpen, setIsAuthorityModalOpen] = useState(false);
  const [selectedUserForAuthority, setSelectedUserForAuthority] = useState(null);

  // Bulk Personnel Directory Selection State
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isBulkOperating, setIsBulkOperating] = useState(false);

  // General Processing Indicator
  const [actionProcessingUserId, setActionProcessingUserId] = useState(null);
  const [isFlushLockoutModalOpen, setIsFlushLockoutModalOpen] = useState(false);
  const [flushLockoutReason, setFlushLockoutReason] = useState('');
  const [flushLockoutConfirmed, setFlushLockoutConfirmed] = useState(false);
  const [isFlushingLockoutsSubmitting, setIsFlushingLockoutsSubmitting] = useState(false);

  // Emergency Kill Switch / Outage Control State (ROOT_ADMIN only)
  const [isKillSwitchModalOpen, setIsKillSwitchModalOpen] = useState(false);
  const [killSwitchStatus, setKillSwitchStatus] = useState({
    isSuspended: false,
    errorMessage: 'Database connection pool exhausted: Connection timed out to primary replica cluster (Error: 0x80040154_DB_CLUSTER_FAIL).',
  });
  const [customOutageMessage, setCustomOutageMessage] = useState(
    'Database connection pool exhausted: Connection timed out to primary replica cluster (Error: 0x80040154_DB_CLUSTER_FAIL).'
  );
  const [isKillSwitchToggling, setIsKillSwitchToggling] = useState(false);
  const [killSwitchConfirmed, setKillSwitchConfirmed] = useState(false);

  const fetchKillSwitchStatus = useCallback(async () => {
    if (authenticatedUser?.role !== 'ROOT_ADMIN') return;
    try {
      const response = await apiClient.get('/system-control/status');
      if (response.data?.success && response.data?.data) {
        setKillSwitchStatus(response.data.data);
        if (response.data.data.errorMessage) {
          setCustomOutageMessage(response.data.data.errorMessage);
        }
      }
    } catch (err) {
      console.warn('[KillSwitch] Failed to fetch system status:', err.message);
    }
  }, [authenticatedUser?.role]);

  const handleToggleKillSwitch = async (targetState) => {
    setIsKillSwitchToggling(true);
    try {
      const response = await apiClient.post('/system-control/toggle', {
        isSuspended: targetState,
        errorMessage: customOutageMessage,
      });
      if (response.data?.success && response.data?.data) {
        setKillSwitchStatus(response.data.data);
        toast.success(
          targetState
            ? '🚨 Outage simulation is now ACTIVE. Non-root users will receive HTTP 503 cluster timeout.'
            : '✅ System operations restored. All users can access normally.'
        );
        setIsKillSwitchModalOpen(false);
        setKillSwitchConfirmed(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle kill switch.');
    } finally {
      setIsKillSwitchToggling(false);
    }
  };

  // Bulk Selection Handlers
  const handleToggleSelectUser = (userId) => {
    setSelectedUserIds((previous) =>
      previous.includes(userId) ? previous.filter((id) => id !== userId) : [...previous, userId]
    );
  };

  const handleSelectAllVisibleUsers = () => {
    const selectableUsers = usersList
      .filter((u) => u.role !== 'ROOT_ADMIN')
      .map((u) => u._id);
    if (selectedUserIds.length === selectableUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(selectableUsers);
    }
  };

  const handleBulkUserAction = async (action) => {
    if (selectedUserIds.length === 0) return;
    const actionLabel = action === 'APPROVE' ? 'Approve (Activate)' : 'Suspend';
    if (!window.confirm(`Perform bulk ${actionLabel} on ${selectedUserIds.length} selected personnel record(s)?`)) {
      return;
    }

    setIsBulkOperating(true);
    try {
      const response = await apiClient.post('/users/bulk', {
        userIds: selectedUserIds,
        action,
        reason: `Root Admin bulk ${action} operation executed from command dashboard`,
      });

      if (response.data?.success) {
        toast.success(response.data.message || `Bulk ${action} completed successfully.`);
        setSelectedUserIds([]);
        fetchGlobalUsers();
        fetchPendingUsers();
      } else {
        toast.error(response.data?.message || 'Bulk operation encountered errors.');
      }
    } catch (error) {
      console.error('Bulk user action failed:', error);
      toast.error(error.response?.data?.message || 'Bulk user operation failed.');
    } finally {
      setIsBulkOperating(false);
    }
  };

  // ─── Data Fetching Handlers ──────────────────────────────────────────────────


  // Fetch Platform Overview Metrics
  const fetchPlatformOverview = useCallback(async () => {
    setIsOverviewLoading(true);
    try {
      const response = await apiClient.get('/admin/super-admins/overview');
      if (response.data?.success && response.data?.data) {
        setOverviewData(response.data.data.overview);
      }
    } catch (overviewFetchError) {
      console.error('Failed to load platform overview:', overviewFetchError);
    } finally {
      setIsOverviewLoading(false);
    }
  }, []);

  // Fetch 2026 SaaS Analytics & Visual Telemetry
  const fetchPlatformAnalytics = useCallback(async () => {
    setIsAnalyticsLoading(true);
    try {
      const response = await apiClient.get('/admin/super-admins/analytics');
      if (response.data?.success && response.data?.data) {
        setAnalyticsData(response.data.data.analytics);
      }
    } catch (analyticsFetchError) {
      console.error('Failed to load platform analytics:', analyticsFetchError);
    } finally {
      setIsAnalyticsLoading(false);
    }
  }, []);

  // Fetch Municipal Schools Directory
  const fetchMunicipalSchools = useCallback(async () => {
    setIsSchoolsLoading(true);
    try {
      const queryParameters = new URLSearchParams();
      if (schoolSearchQuery) queryParameters.append('search', schoolSearchQuery);
      if (schoolTypeFilter) queryParameters.append('schoolType', schoolTypeFilter);
      if (schoolGenderFilter) queryParameters.append('genderType', schoolGenderFilter);

      const response = await apiClient.get(`/schools?${queryParameters.toString()}`);
      if (response.data?.success && response.data?.data) {
        setSchoolsList(response.data.data.schools || []);
      }
    } catch (schoolsFetchError) {
      console.error('Failed to load municipal schools:', schoolsFetchError);
    } finally {
      setIsSchoolsLoading(false);
    }
  }, [schoolSearchQuery, schoolTypeFilter, schoolGenderFilter]);

  // Fetch Global Users Directory (8 Roles)
  const fetchGlobalUsers = useCallback(async () => {
    setIsUsersLoading(true);
    try {
      const queryParameters = new URLSearchParams();
      if (userSearchQuery) queryParameters.append('search', userSearchQuery);
      if (userRoleFilter) queryParameters.append('role', userRoleFilter);
      if (userStatusFilter) queryParameters.append('status', userStatusFilter);

      const response = await apiClient.get(`/users?${queryParameters.toString()}`);
      if (response.data?.success && response.data?.data) {
        setUsersList(response.data.data.users || []);
        setUsersTotalCount(response.data.data.total || 0);
      }
    } catch (usersFetchError) {
      console.error('Failed to load users directory:', usersFetchError);
    } finally {
      setIsUsersLoading(false);
    }
  }, [userSearchQuery, userRoleFilter, userStatusFilter]);

  // Fetch Super Admins List
  const fetchSuperAdmins = useCallback(async () => {
    setIsSuperAdminsLoading(true);
    try {
      const response = await apiClient.get('/admin/super-admins');
      if (response.data?.success && response.data?.data) {
        setSuperAdminsList(response.data.data.superAdmins || []);
      }
    } catch (superAdminFetchError) {
      console.error('Failed to load Super Admins list:', superAdminFetchError);
    } finally {
      setIsSuperAdminsLoading(false);
    }
  }, []);

  // Fetch Pending Approvals
  const fetchPendingUsers = useCallback(async () => {
    setIsPendingUsersLoading(true);
    try {
      const response = await apiClient.get('/admin/super-admins/pending-users');
      if (response.data?.success && response.data?.data) {
        setPendingUsersList(response.data.data.pendingUsers || []);
      }
    } catch (pendingFetchError) {
      console.error('Failed to load pending users:', pendingFetchError);
    } finally {
      setIsPendingUsersLoading(false);
    }
  }, []);

  // Fetch Immutable Audit Trail
  const fetchAuditLogs = useCallback(async () => {
    setIsAuditLogsLoading(true);
    try {
      const queryParameters = new URLSearchParams();
      if (auditSearchQuery) queryParameters.append('action', auditSearchQuery);
      if (auditResultFilter) queryParameters.append('result', auditResultFilter);

      const response = await apiClient.get(`/admin/super-admins/audit-logs?${queryParameters.toString()}`);
      if (response.data?.success && response.data?.data) {
        setAuditLogsList(response.data.data.auditLogs || []);
      }
    } catch (auditFetchError) {
      console.error('Failed to load audit logs:', auditFetchError);
    } finally {
      setIsAuditLogsLoading(false);
    }
  }, [auditSearchQuery, auditResultFilter]);

  // Synchronize All Telemetry
  const synchronizeAllTelemetry = useCallback(() => {
    fetchPlatformOverview();
    fetchPlatformAnalytics();
    fetchMunicipalSchools();
    fetchGlobalUsers();
    fetchSuperAdmins();
    fetchPendingUsers();
    fetchAuditLogs();
    fetchKillSwitchStatus();
    toast.success('Platform telemetry synchronized in real time.');
  }, [
    fetchPlatformOverview,
    fetchPlatformAnalytics,
    fetchMunicipalSchools,
    fetchGlobalUsers,
    fetchSuperAdmins,
    fetchPendingUsers,
    fetchAuditLogs,
    fetchKillSwitchStatus,
  ]);

  // Initial Load
  useEffect(() => {
    fetchPlatformOverview();
    fetchPlatformAnalytics();
    fetchMunicipalSchools();
    fetchKillSwitchStatus();
  }, [fetchPlatformOverview, fetchPlatformAnalytics, fetchMunicipalSchools, fetchKillSwitchStatus]);

  // Lazy tab loader
  useEffect(() => {
    if (activeTab === 'schools') fetchMunicipalSchools();
    if (activeTab === 'users') fetchGlobalUsers();
    if (activeTab === 'governance') fetchSuperAdmins();
    if (activeTab === 'approvals') fetchPendingUsers();
    if (activeTab === 'audit') fetchAuditLogs();
    if (activeTab === 'analytics') fetchPlatformAnalytics();
  }, [activeTab, fetchMunicipalSchools, fetchGlobalUsers, fetchSuperAdmins, fetchPendingUsers, fetchAuditLogs, fetchPlatformAnalytics]);

  // ─── Actions & Mutation Handlers ───────────────────────────────────────────

  // Register School
  const handleRegisterSchoolSubmit = async (eventObject) => {
    eventObject.preventDefault();
    setIsRegisteringSchoolSubmitting(true);
    try {
      const payload = {
        name: registerSchoolFormData.name.trim(),
        schoolCode: registerSchoolFormData.schoolCode ? registerSchoolFormData.schoolCode.toUpperCase().trim() : undefined,
        emisCode: registerSchoolFormData.emisCode.trim() || undefined,
        schoolType: registerSchoolFormData.schoolType,
        genderType: registerSchoolFormData.genderType,
        address: registerSchoolFormData.address.trim(),
        contactPhone: registerSchoolFormData.contactPhone.trim(),
        contactEmail: registerSchoolFormData.contactEmail.trim(),
        status: 'ACTIVE',
      };

      const response = await apiClient.post('/schools', payload);
      if (response.data?.success) {
        toast.success(`Municipal school "${registerSchoolFormData.name}" registered successfully!`);
        setIsRegisterSchoolModalOpen(false);
        setRegisterSchoolFormData({
          name: '',
          schoolCode: '',
          emisCode: '',
          schoolType: 'SECONDARY',
          genderType: 'BOYS',
          address: '',
          contactPhone: '',
          contactEmail: '',
        });
        fetchMunicipalSchools();
        fetchPlatformOverview();
      }
    } catch (registrationError) {
      const errorResponse = registrationError.response?.data?.message || 'Failed to register school.';
      toast.error(errorResponse);
    } finally {
      setIsRegisteringSchoolSubmitting(false);
    }
  };

  // Authorize Super Admin on Existing Personnel Account
  const handleAuthorizeSuperAdminSubmit = async (eventObject) => {
    eventObject.preventDefault();
    if (!authorizeFormData.userId) {
      toast.error('Please select an existing personnel account to authorize.');
      return;
    }
    if (!authorizeFormData.reason || authorizeFormData.reason.trim().length < 5) {
      toast.error('A mandatory justification reason (minimum 5 characters) is required.');
      return;
    }
    setIsAuthorizingSubmitting(true);
    try {
      const response = await apiClient.post(`/admin/users/${authorizeFormData.userId}/authority`, {
        authority: 'SUPER_ADMIN',
        reason: authorizeFormData.reason.trim(),
        scope: authorizeFormData.scope || 'GLOBAL',
      });

      if (response.data?.success) {
        toast.success(response.data?.message || 'Super Admin authority granted successfully.');
        setIsAuthorizeModalOpen(false);
        setAuthorizeFormData({
          userId: '',
          authority: 'SUPER_ADMIN',
          scope: 'GLOBAL',
          reason: '',
        });
        setAuthorizeUserSearch('');
        fetchSuperAdmins();
        fetchPlatformOverview();
        fetchGlobalUsers();
        fetchPendingUsers();
      }
    } catch (authError) {
      const errorResponse = authError.response?.data?.message || 'Failed to grant Super Admin authority.';
      toast.error(errorResponse);
    } finally {
      setIsAuthorizingSubmitting(false);
    }
  };


  // Disable Super Admin Account
  const handleDisableSuperAdminSubmit = async (eventObject) => {
    eventObject.preventDefault();
    if (!selectedSuperAdminToDisable) return;

    if (!disableReasonText || disableReasonText.trim().length < 5) {
      toast.error('A mandatory justification reason (minimum 5 characters) is required.');
      return;
    }

    setIsDisablingSubmitting(true);
    try {
      const response = await apiClient.patch(
        `/admin/super-admins/${selectedSuperAdminToDisable._id}/disable`,
        { reason: disableReasonText.trim() }
      );

      if (response.data?.success) {
        toast.success(`Super Admin "${selectedSuperAdminToDisable.fullName}" disabled. Active sessions revoked.`);
        setIsDisableModalOpen(false);
        setSelectedSuperAdminToDisable(null);
        setDisableReasonText('');
        fetchSuperAdmins();
        fetchPlatformOverview();
      }
    } catch (disableError) {
      const errorResponse = disableError.response?.data?.message || 'Failed to disable Super Admin account.';
      toast.error(errorResponse);
    } finally {
      setIsDisablingSubmitting(false);
    }
  };

  // Flush Security Lockouts (Hardened with mandatory justification reason & confirmation)
  const handleFlushLockoutsSubmit = async (eventObject) => {
    eventObject.preventDefault();
    if (!flushLockoutReason || flushLockoutReason.trim().length < 5) {
      toast.error('A mandatory justification reason (minimum 5 characters) is required.');
      return;
    }
    if (!flushLockoutConfirmed) {
      toast.error('Explicit confirmation is required before flushing lockouts.');
      return;
    }

    setIsFlushingLockoutsSubmitting(true);
    try {
      const response = await apiClient.post('/admin/super-admins/flush-lockouts', {
        reason: flushLockoutReason.trim(),
        confirmed: true,
      });
      if (response.data?.success) {
        toast.success(response.data.message || 'Security lockouts flushed successfully.');
        setIsFlushLockoutModalOpen(false);
        setFlushLockoutReason('');
        setFlushLockoutConfirmed(false);
        fetchPlatformOverview();
        fetchAuditLogs();
      }
    } catch (flushError) {
      toast.error(flushError.response?.data?.message || 'Failed to flush security lockouts.');
    } finally {
      setIsFlushingLockoutsSubmitting(false);
    }
  };

  // Broadcast Emergency Announcement
  const handleBroadcastSubmit = async (eventObject) => {
    eventObject.preventDefault();
    setIsBroadcastSubmitting(true);
    try {
      const response = await apiClient.post('/admin/super-admins/broadcast', broadcastFormData);
      if (response.data?.success) {
        toast.success('Emergency broadcast announced across platform instances.');
        setIsBroadcastModalOpen(false);
        setBroadcastFormData({ title: '', message: '', severity: 'INFO' });
        fetchAuditLogs();
      }
    } catch (broadcastError) {
      toast.error(broadcastError.response?.data?.message || 'Failed to publish emergency broadcast.');
    } finally {
      setIsBroadcastSubmitting(false);
    }
  };

  // Approve / Reject User Lifecycle Transition
  const handleProcessUserLifecycle = async (targetUserId, newLifecycleStatus, defaultReason) => {
    setActionProcessingUserId(targetUserId);
    try {
      const response = await apiClient.patch(`/users/${targetUserId}/lifecycle`, {
        status: newLifecycleStatus,
        reason: defaultReason,
      });

      if (response.data?.success) {
        toast.success(`User status transitioned to ${newLifecycleStatus}.`);
        fetchPendingUsers();
        fetchGlobalUsers();
        fetchPlatformOverview();
      }
    } catch (lifecycleError) {
      toast.error(lifecycleError.response?.data?.message || 'Status transition failed.');
    } finally {
      setActionProcessingUserId(null);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6 pb-12">
        {/* ─── 1. SUPREME GOVERNANCE HEADER & HUD ─── */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/20 p-6 shadow-2xl backdrop-blur-xl">
          <div className="absolute right-0 top-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 -mb-8 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
                  <Crown className="h-3.5 w-3.5" />
                  <span>
                    {authenticatedUser?.role === 'ROOT_ADMIN'
                      ? 'Root Administration • Platform-wide Authority'
                      : 'Executive Administration • Town Command'}
                  </span>
                </div>
                {authenticatedUser?.fullName && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 border-l border-slate-700/60 pl-3">
                    <span>Officer:</span>
                    <span className="font-semibold text-slate-200">{authenticatedUser.fullName}</span>
                    {authenticatedUser.designation && (
                      <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[11px] font-medium text-amber-300">
                        {authenticatedUser.designation.replace(/\s*\(Break-Glass Recovery\)/i, '')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Liaquatabad Town Education Command Center
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
                Education Department Liaquatabad Town Centre (DMC) — Municipal schools, authority management, and civic audit.
              </p>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsRegisterSchoolModalOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/40 transition hover:brightness-110 active:scale-95 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Register School</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthorizeFormData({ userId: '', authority: 'SUPER_ADMIN', scope: 'GLOBAL', reason: '' });
                  setAuthorizeUserSearch('');
                  setIsAuthorizeModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-950/40 transition hover:brightness-110 active:scale-95 cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Authorize Super Admin</span>
              </button>

              {authenticatedUser?.role === 'ROOT_ADMIN' && (
                <button
                  type="button"
                  onClick={() => setIsKillSwitchModalOpen(true)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-lg transition active:scale-95 cursor-pointer ${
                    killSwitchStatus.isSuspended
                      ? 'border-red-500 bg-red-600 text-white animate-pulse shadow-red-950/60'
                      : 'border-red-900/60 bg-red-950/40 text-red-300 hover:bg-red-900/50 hover:text-white'
                  }`}
                  title="Emergency Infrastructure Outage Control"
                >
                  <ShieldAlert className="h-4 w-4 text-red-400" />
                  <span>{killSwitchStatus.isSuspended ? 'Outage Active (503)' : 'Emergency Switch'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={synchronizeAllTelemetry}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white active:scale-95 cursor-pointer"
                title="Synchronize Live Telemetry"
              >
                <RefreshCw className={`h-4 w-4 ${isOverviewLoading ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            </div>
          </div>

          {/* ─── LIVE INFRASTRUCTURE VITALS HUD BAR ─── */}
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-5 text-xs sm:grid-cols-4 lg:grid-cols-4">
            <div className="flex items-center gap-2 text-slate-300">
              <Server className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">Database Shard</p>
                <p className="font-medium text-emerald-400">Atlas Cluster • Connected</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">Security Architecture</p>
                <p className="font-medium text-cyan-400">Triple-Lock v7.0 Active</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <Globe className="h-4 w-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">Administrative Scope</p>
                <p className="font-medium text-amber-300">Platform-wide (Root Authority)</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="h-4 w-4 text-purple-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">Jurisdiction</p>
                <p className="font-medium text-purple-300">Liaquatabad Town Centre</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── ATTENTION REQUIRED COMMAND BANNER (DYNAMIC CIVIC RADAR) ─── */}
        {(() => {
          const pendingCount = overviewData?.pendingApprovals ?? pendingUsersList.length;
          const lockoutCount = overviewData?.activeSecurityLockouts ?? 0;
          const schoolCount = overviewData?.activeSchools ?? schoolsList.length;
          const hasAttentionItems = pendingCount > 0 || lockoutCount > 0 || schoolCount === 0;

          return (
            <div
              className={`rounded-xl border p-4 backdrop-blur-md transition shadow-md ${
                hasAttentionItems
                  ? 'border-amber-500/30 bg-amber-950/20'
                  : 'border-emerald-500/30 bg-emerald-950/20'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-lg p-2 shrink-0 ${
                      hasAttentionItems ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {hasAttentionItems ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {hasAttentionItems ? 'Operational Attention Required' : 'All Municipal Systems Operational'}
                    </h4>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                      {pendingCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('approvals')}
                          className="flex items-center gap-1 text-amber-300 hover:underline cursor-pointer font-medium"
                        >
                          <span>⚠ {pendingCount} user registration{pendingCount > 1 ? 's' : ''} awaiting approval</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                      {schoolCount === 0 && (
                        <button
                          type="button"
                          onClick={() => setIsRegisterSchoolModalOpen(true)}
                          className="flex items-center gap-1 text-teal-300 hover:underline cursor-pointer font-medium"
                        >
                          <span>ℹ 0 municipal schools registered — begin by registering first school</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                      {lockoutCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('operations')}
                          className="flex items-center gap-1 text-red-400 hover:underline cursor-pointer font-medium"
                        >
                          <span>⚠ {lockoutCount} active security lockout{lockoutCount > 1 ? 's' : ''}</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                      {!hasAttentionItems && (
                        <span className="text-emerald-400">Zero security alerts, no pending approvals, municipal database synced.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-400 shrink-0">
                  <span>Synced: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          );
        })()}


        {/* ─── 2. EXECUTIVE KPI PULSE CARDS (6 METRIC OVERVIEW) ─── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* Municipal Schools Card */}
          <div
            onClick={() => setActiveTab('schools')}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:border-emerald-500/50 hover:bg-slate-900/90"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Schools</span>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-1.5 text-emerald-400 group-hover:scale-110 transition">
                <SchoolIcon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white">
                {isOverviewLoading ? '...' : (overviewData?.activeSchools ?? schoolsList.length)}
              </span>
              <span className="text-[10px] font-medium text-emerald-400">Institutions</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
              <span className="truncate">Liaquatabad</span>
              <span className="text-emerald-400 font-semibold flex items-center">
                Manage <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Platform Personnel Card */}
          <div
            onClick={() => setActiveTab('users')}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:border-blue-500/50 hover:bg-slate-900/90"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Platform Users</span>
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-1.5 text-blue-400 group-hover:scale-110 transition">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white">
                {isOverviewLoading ? '...' : (overviewData?.totalUsers ?? usersTotalCount)}
              </span>
              <span className="text-[10px] font-medium text-blue-400">Accounts</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
              <span>Active Accounts</span>
              <span className="text-blue-400 font-semibold flex items-center">
                Directory <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Total Students Enrolled Card */}
          <div
            onClick={() => setActiveTab('academic')}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:border-indigo-500/50 hover:bg-slate-900/90"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Students</span>
              <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-1.5 text-indigo-400 group-hover:scale-110 transition">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white">
                {isOverviewLoading ? '...' : (overviewData?.totalStudents != null ? overviewData.totalStudents.toLocaleString() : (overviewData?.roleDistribution?.students ?? '—'))}
              </span>
              <span className="text-[10px] font-medium text-indigo-400">Enrolled</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
              <span>Enrolled (from DB)</span>
              <span className="text-indigo-400 font-semibold flex items-center">
                Academic <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Active Faculty / Teachers Card */}
          <div
            onClick={() => setActiveTab('transfers')}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:border-teal-500/50 hover:bg-slate-900/90"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Faculty</span>
              <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 p-1.5 text-teal-400 group-hover:scale-110 transition">
                <ArrowRightLeft className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white">
                {isOverviewLoading ? '...' : (overviewData?.roleDistribution?.teachers ?? usersList.filter((u) => u.role === 'TEACHER').length)}
              </span>
              <span className="text-[10px] font-medium text-teal-400">Teachers</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
              <span>Registered Teachers</span>
              <span className="text-teal-400 font-semibold flex items-center">
                Transfers <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Pending Approvals Card */}
          <div
            onClick={() => setActiveTab('approvals')}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:border-amber-500/50 hover:bg-slate-900/90"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Approvals</span>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-1.5 text-amber-400 group-hover:scale-110 transition">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white">
                {isOverviewLoading ? '...' : (overviewData?.pendingApprovals ?? pendingUsersList.length)}
              </span>
              <span className="text-[10px] font-medium text-amber-400">Pending</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
              <span>Verification</span>
              <span className="text-amber-400 font-semibold flex items-center">
                Review <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Immutable Audit Records Card */}
          <div
            onClick={() => setActiveTab('audit')}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:border-purple-500/50 hover:bg-slate-900/90"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Audit Stream</span>
              <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-1.5 text-purple-400 group-hover:scale-110 transition">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white">
                {isOverviewLoading ? '...' : (overviewData?.totalAuditEvents ?? auditLogsList.length)}
              </span>
              <span className="text-[10px] font-medium text-purple-400">Events</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
              <span>Logged Events</span>
              <span className="text-purple-400 font-semibold flex items-center">
                Audits <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Data Freshness & Sync Row */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1">
          <span>Platform Data Freshness: {overviewData?.systemHealth?.timestamp ? new Date(overviewData.systemHealth.timestamp).toLocaleString() : 'Connected to live database'}</span>
          <button
            type="button"
            onClick={synchronizeAllTelemetry}
            className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition cursor-pointer font-medium"
          >
            <RefreshCw className={`h-3 w-3 ${isOverviewLoading ? 'animate-spin' : ''}`} />
            <span>Sync Fresh Telemetry</span>
          </button>
        </div>



        {/* ─── 3. INTERACTIVE TELEMETRY & ANALYTICS SECTION ─── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Municipal Attendance Telemetry (AreaChart) */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <h3 className="font-bold text-white">Town-wide Attendance Overview</h3>
                </div>
                <p className="text-xs text-slate-400">Daily attendance rate across registered municipal schools</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> {analyticsData?.infrastructureVitals?.averageAttendance ? `Town Avg: ${analyticsData.infrastructureVitals.averageAttendance}` : 'Town Avg: —'}
                </span>
                <span className="flex items-center gap-1 text-blue-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-blue-400" /> Boys
                </span>
                <span className="flex items-center gap-1 text-pink-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-pink-400" /> Girls
                </span>
              </div>
            </div>

            <div className="mt-4 h-64 w-full">
              {analyticsData?.weeklyAttendanceTrends && analyticsData.weeklyAttendanceTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={analyticsData.weeklyAttendanceTrends}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="overallGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="girlsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="day" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis domain={[80, 100]} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Area type="monotone" dataKey="overallRate" name="Overall Rate (%)" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#overallGrad)" />
                    <Area type="monotone" dataKey="girlsRate" name="Girls Schools (%)" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#girlsGrad)" />
                    <Area type="monotone" dataKey="boysRate" name="Boys Schools (%)" stroke="#3b82f6" strokeWidth={1.5} fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs text-center p-4">
                  <TrendingUp className="h-8 w-8 text-slate-600 mb-2" />
                  <p className="font-semibold text-slate-300">No attendance records logged yet</p>
                  <p className="mt-1 text-slate-500 max-w-sm">Trend data populates in real-time as registered municipal schools submit their daily morning roll calls.</p>
                </div>
              )}
            </div>
            <div className="mt-2 text-[10px] text-slate-500 font-mono text-right">
              Source: Municipal Institutional Morning Roll Calls
            </div>
          </div>

          {/* Granted Technical Authority Distribution (BarChart) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-amber-400" />
                <h3 className="font-bold text-white">Granted Authority Distribution</h3>
              </div>
              <p className="text-xs text-slate-400">Users grouped by current granted technical authority</p>
            </div>

            <div className="mt-3 h-64 w-full">
              {analyticsData?.authorityPyramid && analyticsData.authorityPyramid.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.authorityPyramid}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis type="category" dataKey="label" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {analyticsData.authorityPyramid.map((entry, entryIndex) => (
                        <Cell key={`bar-cell-${entryIndex}`} fill={entry.fill || '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs text-center p-4">
                  <BarChart3 className="h-8 w-8 text-slate-600 mb-2" />
                  <p className="font-semibold text-slate-300">No authority records found</p>
                  <p className="mt-1 text-slate-500">Distribution updates as accounts are provisioned and authorized.</p>
                </div>
              )}
            </div>
            <div className="mt-2 text-[10px] text-slate-500 font-mono text-right">
              Civil Designations are tracked separately
            </div>
          </div>
        </div>

        {/* ─── 4. CENTRAL PLATFORM COMMAND TABS ─── */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('schools')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${
              activeTab === 'schools'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <SchoolIcon className="h-4 w-4" />
            <span>Municipal Schools</span>
            <span className="rounded-full bg-emerald-950/80 px-2 py-0.5 text-xs text-emerald-300 font-mono">
              {schoolsList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('academic')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${
              activeTab === 'academic'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Academic Control</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transfers')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${
              activeTab === 'transfers'
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ArrowRightLeft className="h-4 w-4" />
            <span>Teacher Transfers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${
              activeTab === 'users'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Personnel Directory</span>
            <span className="rounded-full bg-blue-950/80 px-2 py-0.5 text-xs text-blue-300 font-mono">
              {usersTotalCount || usersList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('governance')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${
              activeTab === 'governance'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Crown className="h-4 w-4" />
            <span>Authority & Governance</span>
            <span className="rounded-full bg-amber-950/80 px-2 py-0.5 text-xs text-amber-300 font-mono">
              {superAdminsList.length}
            </span>
          </button>


          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Clearance & Approvals</span>
            {pendingUsersList.length > 0 && (
              <span className="rounded-full bg-amber-500/30 px-2 py-0.5 text-xs text-amber-300 font-bold animate-pulse">
                {pendingUsersList.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('operations')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${
              activeTab === 'operations'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>Command Ops & Emergency</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Audit Stream</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Exports & System Health</span>
          </button>
        </div>


        {/* ─── TAB 1: MUNICIPAL SCHOOLS MATRIX ─── */}
        {activeTab === 'schools' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={schoolSearchQuery}
                    onChange={(eventObject) => setSchoolSearchQuery(eventObject.target.value)}
                    placeholder="Search by school name, MMHA code, EMIS, or area..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/90 py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <select
                  value={schoolTypeFilter}
                  onChange={(eventObject) => setSchoolTypeFilter(eventObject.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">All Categories</option>
                  <option value="SECONDARY">Secondary</option>
                  <option value="PRIMARY">Primary</option>
                  <option value="ELEMENTARY">Elementary</option>
                  <option value="HIGHER_SECONDARY">Higher Secondary</option>
                </select>

                <select
                  value={schoolGenderFilter}
                  onChange={(eventObject) => setSchoolGenderFilter(eventObject.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">All Orientations</option>
                  <option value="BOYS">Boys</option>
                  <option value="GIRLS">Girls</option>
                  <option value="CO_EDUCATION">Co-Education</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterSchoolModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-500 transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Register School</span>
                </button>
              </div>
            </div>

            {/* Schools Grid */}
            {isSchoolsLoading ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-slate-400">
                <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
                <p className="mt-3 text-sm">Querying municipal school infrastructure...</p>
              </div>
            ) : schoolsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 border-dashed bg-slate-900/40 p-12 text-center">
                <SchoolIcon className="h-12 w-12 text-slate-500 mb-3" />
                <h3 className="text-base font-bold text-white">No Municipal Schools Registered Yet</h3>
                <p className="mt-1 max-w-md text-xs text-slate-400">
                  As Root Administrator, you can register the first municipal school directly or use the quick action button above.
                </p>
                <button
                  type="button"
                  onClick={() => setIsRegisterSchoolModalOpen(true)}
                  className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-500 transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Register School</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {schoolsList.map((schoolRecord) => (
                  <div
                    key={schoolRecord._id}
                    className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm transition hover:border-slate-700 hover:bg-slate-900"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            {schoolRecord.schoolCode && (
                              <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs font-mono font-bold text-emerald-400">
                                {schoolRecord.schoolCode}
                              </span>
                            )}
                            <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                              EMIS: {schoolRecord.emisCode || 'Unassigned'}
                            </span>
                          </div>
                          <h4 className="mt-2 text-sm font-bold text-white leading-snug">{schoolRecord.name}</h4>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            schoolRecord.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-red-500/20 text-red-400 border border-red-500/40'
                          }`}
                        >
                          {schoolRecord.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                        <div className="flex items-center gap-2 text-slate-400">
                          <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{schoolRecord.address}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">Category:</span>
                          <span className="font-medium text-amber-300">{schoolRecord.schoolType} • {schoolRecord.genderType}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">Head Master:</span>
                          <span className="font-medium text-slate-200">{schoolRecord.headMaster || 'Not Appointed'}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">Active Faculty:</span>
                          <span className="font-semibold text-emerald-400">{schoolRecord.facultyCount || 0} Certified</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSchoolForEdit(schoolRecord);
                          setIsEditSchoolModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40 transition cursor-pointer"
                      >
                        <Edit2 className="h-3 w-3 text-emerald-400" />
                        <span>Edit School</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {schoolRecord.contactPhone && (
                          <a
                            href={`tel:${schoolRecord.contactPhone}`}
                            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition"
                            title={schoolRecord.contactPhone}
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {schoolRecord.contactEmail && (
                          <a
                            href={`mailto:${schoolRecord.contactEmail}`}
                            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition"
                            title={schoolRecord.contactEmail}
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: ACADEMIC MANAGEMENT (CASCADING SCHOOL -> CLASS -> SECTION) ─── */}
        {activeTab === 'academic' && (
          <AcademicManagementTab schoolsList={schoolsList} />
        )}

        {/* ─── TAB: TEACHER TRANSFERS & DEPLOYMENT ─── */}
        {activeTab === 'transfers' && (
          <TeacherTransferTab
            schoolsList={schoolsList}
            teachersList={usersList.filter((u) => u.role === 'TEACHER')}
          />
        )}

        {/* ─── TAB 2: GLOBAL PERSONNEL & IDENTITY DIRECTORY (8 ROLES) ─── */}
        {activeTab === 'users' && (

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(eventObject) => setUserSearchQuery(eventObject.target.value)}
                    placeholder="Search by full name, email address, or designation..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/90 py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(eventObject) => setUserRoleFilter(eventObject.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">All 8 Roles</option>
                  <option value="ROOT_ADMIN">Root Admin (100)</option>
                  <option value="SUPER_ADMIN">Super Admin (90)</option>
                  <option value="ADMIN">Admin / DDO (80)</option>
                  <option value="SUPERVISOR">Supervisor (60)</option>
                  <option value="HM">Head Master (50)</option>
                  <option value="TEACHER">Teacher (30)</option>
                  <option value="STUDENT">Student (10)</option>
                  <option value="PARENT">Parent (10)</option>
                </select>

                <select
                  value={userStatusFilter}
                  onChange={(eventObject) => setUserStatusFilter(eventObject.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="RETIRED">Retired</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchGlobalUsers}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isUsersLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Bulk Actions Banner */}
            {selectedUserIds.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-500/40 bg-blue-950/40 p-3 shadow-lg backdrop-blur-md animate-fadeIn">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-200">
                  <CheckSquare className="h-4 w-4 text-blue-400" />
                  <span>{selectedUserIds.length} personnel selected for bulk governance</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBulkUserAction('APPROVE')}
                    disabled={isBulkOperating}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Bulk Approve (Activate)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkUserAction('SUSPEND')}
                    disabled={isBulkOperating}
                    className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition shadow cursor-pointer disabled:opacity-50"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Bulk Suspend</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUserIds([])}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Deselect
                  </button>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    <tr>
                      <th className="w-10 px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={
                            usersList.filter((u) => u.role !== 'ROOT_ADMIN').length > 0 &&
                            selectedUserIds.length === usersList.filter((u) => u.role !== 'ROOT_ADMIN').length
                          }
                          onChange={handleSelectAllVisibleUsers}
                          className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          title="Select all non-root accounts"
                        />
                      </th>
                      <th className="px-5 py-3.5">User Identity</th>
                      <th className="px-4 py-3.5">Civil Designation</th>
                      <th className="px-4 py-3.5">System Role</th>
                      <th className="px-4 py-3.5">Assigned Institution</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {isUsersLoading ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-slate-400">
                          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-blue-400" />
                          <p className="mt-2 text-xs">Querying personnel registry...</p>
                        </td>
                      </tr>
                    ) : usersList.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-slate-400">
                          <Users className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                          <p className="text-sm font-semibold text-slate-300">No personnel records found</p>
                          <p className="text-xs text-slate-500 mt-1">Adjust your filters or register new users.</p>
                        </td>
                      </tr>
                    ) : (
                      usersList.map((userRecord) => (
                        <tr key={userRecord._id} className="transition hover:bg-slate-800/40">
                          <td className="w-10 px-4 py-4 text-center">
                            {userRecord.role === 'ROOT_ADMIN' ? (
                              <span title="Root Admin account is protected from bulk actions">
                                <Lock className="h-3.5 w-3.5 text-slate-600 mx-auto" />
                              </span>
                            ) : (
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(userRecord._id)}
                                onChange={() => handleToggleSelectUser(userRecord._id)}
                                className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-xs font-bold text-slate-200">
                                {userRecord.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-white">{userRecord.fullName}</p>
                                <p className="text-[11px] text-slate-400 font-mono">{userRecord.email}</p>
                              </div>
                            </div>
                          </td>


                          <td className="px-4 py-4 text-slate-200 font-medium">
                            {userRecord.designation || 'Civic Official'}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-mono font-bold ${
                                userRecord.role === 'ROOT_ADMIN'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                  : userRecord.role === 'SUPER_ADMIN'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                  : userRecord.role === 'ADMIN'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : userRecord.role === 'HM'
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {userRecord.role}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-slate-300">
                            {userRecord.schoolId?.name ? (
                              <span className="truncate max-w-xs block" title={userRecord.schoolId.name}>
                                {userRecord.schoolId.name}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic">District Level / Global</span>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                userRecord.status === 'ACTIVE'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : userRecord.status === 'PENDING_APPROVAL'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/40'
                              }`}
                            >
                              {userRecord.status}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {userRecord.status === 'PENDING_APPROVAL' && (
                                <button
                                  type="button"
                                  onClick={() => handleProcessUserLifecycle(userRecord._id, 'ACTIVE', 'Direct Root Admin verification')}
                                  disabled={actionProcessingUserId === userRecord._id}
                                  className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-900/50 transition cursor-pointer"
                                >
                                  Approve
                                </button>
                              )}
                              {userRecord.status === 'ACTIVE' && userRecord.role !== 'ROOT_ADMIN' && (
                                <button
                                  type="button"
                                  onClick={() => handleProcessUserLifecycle(userRecord._id, 'SUSPENDED', 'Administrative suspension by Root Admin')}
                                  disabled={actionProcessingUserId === userRecord._id}
                                  className="rounded-lg border border-red-500/30 bg-red-950/30 px-2.5 py-1 text-xs font-semibold text-red-300 hover:bg-red-900/40 transition cursor-pointer"
                                >
                                  Suspend
                                </button>
                              )}
                              {userRecord.status === 'SUSPENDED' && (
                                <button
                                  type="button"
                                  onClick={() => handleProcessUserLifecycle(userRecord._id, 'ACTIVE', 'Reinstatement by Root Admin')}
                                  disabled={actionProcessingUserId === userRecord._id}
                                  className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-900/50 transition cursor-pointer"
                                >
                                  Reactivate
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUserForAuthority(userRecord);
                                  setIsAuthorityModalOpen(true);
                                }}
                                className="rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-2.5 py-1 text-xs font-semibold text-cyan-400 hover:bg-cyan-900/50 transition cursor-pointer flex items-center gap-1"
                                title="Manage Civil Designation & Technical System Authority"
                              >
                                <Shield className="w-3 h-3" />
                                <span>Authority</span>
                              </button>
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

        {/* ─── TAB 3: SUPER ADMIN GOVERNANCE ─── */}
        {activeTab === 'governance' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
              <div>
                <h3 className="text-base font-bold text-white">Authorized Super Administrators (Level 90)</h3>
                <p className="text-xs text-slate-400">
                  Super Admins govern operational workflows, faculty onboarding, circulars, and municipal schools across Liaquatabad Town.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAuthorizeFormData({ userId: '', authority: 'SUPER_ADMIN', scope: 'GLOBAL', reason: '' });
                  setAuthorizeUserSearch('');
                  setIsAuthorizeModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:brightness-110 cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Authorize Super Admin</span>
              </button>
            </div>


            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Administrator Name</th>
                      <th className="px-4 py-3.5">Civil Designation</th>
                      <th className="px-4 py-3.5">System Role</th>
                      <th className="px-4 py-3.5">Scope</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Created Date</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {isSuperAdminsLoading ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-slate-400">
                          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-amber-400" />
                          <p className="mt-2 text-xs">Querying Super Admin roster...</p>
                        </td>
                      </tr>
                    ) : superAdminsList.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-slate-400">
                          <Crown className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                          <p className="text-sm font-semibold text-slate-300">No Super Admin Accounts Provisioned</p>
                        </td>
                      </tr>
                    ) : (
                      superAdminsList.map((adminRecord) => (
                        <tr key={adminRecord._id} className="transition hover:bg-slate-800/40">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-400">
                                {adminRecord.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-white">{adminRecord.fullName}</p>
                                <p className="text-[11px] text-slate-400 font-mono">{adminRecord.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 font-medium text-slate-200">
                            {adminRecord.designation || 'Town Chairman'}
                          </td>

                          <td className="px-4 py-4">
                            <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-mono font-bold text-amber-400">
                              SUPER_ADMIN (90)
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-400">
                              {adminRecord.scope || 'GLOBAL'}
                            </span>
                          </td>


                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                adminRecord.status === 'ACTIVE'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/40'
                              }`}
                            >
                              {adminRecord.status}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-slate-400 font-mono text-[11px]">
                            {new Date(adminRecord.createdAt).toLocaleDateString()}
                          </td>

                          <td className="px-4 py-4 text-right">
                            {adminRecord.status === 'ACTIVE' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSuperAdminToDisable(adminRecord);
                                  setIsDisableModalOpen(true);
                                }}
                                className="rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-900/50 transition cursor-pointer"
                              >
                                Disable Account
                              </button>
                            ) : (
                              <span className="text-slate-500 italic text-xs">Disabled</span>
                            )}
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

        {/* ─── TAB 4: CLEARANCE & APPROVALS ROSTER ─── */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
              <h3 className="text-base font-bold text-white">Personnel Clearance & Approval Queue</h3>
              <p className="text-xs text-slate-400">
                Staff and faculty awaiting civil verification and system activation.
              </p>
            </div>

            {isPendingUsersLoading ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-slate-400">
                <RefreshCw className="h-6 w-6 animate-spin text-amber-400" />
                <p className="mt-2 text-xs">Querying pending approval roster...</p>
              </div>
            ) : pendingUsersList.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-3" />
                <h4 className="text-base font-bold text-white">Clearance Roster Up To Date</h4>
                <p className="mt-1 text-xs text-slate-400">There are no pending registrations requiring review at this time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingUsersList.map((pendingUser) => (
                  <div
                    key={pendingUser._id}
                    className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-white text-base">{pendingUser.fullName}</h4>
                          <p className="text-xs text-slate-400 font-mono">{pendingUser.email}</p>
                        </div>
                        <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-mono font-bold text-amber-400">
                          {pendingUser.role}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                        <p><span className="text-slate-400">Proposed Title:</span> {pendingUser.designation || 'Teacher / Staff'}</p>
                        <p><span className="text-slate-400">Target School:</span> {pendingUser.schoolId?.name || 'District Assignment'}</p>
                        <p><span className="text-slate-400">Registered:</span> {new Date(pendingUser.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-800/80 pt-3">
                      <button
                        type="button"
                        onClick={() => handleProcessUserLifecycle(pendingUser._id, 'INACTIVE', 'Registration rejected by Root Admin')}
                        disabled={actionProcessingUserId === pendingUser._id}
                        className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-900/40 transition cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProcessUserLifecycle(pendingUser._id, 'ACTIVE', 'Approved directly by Root Administrator')}
                        disabled={actionProcessingUserId === pendingUser._id}
                        className="rounded-lg border border-emerald-500/40 bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow cursor-pointer"
                      >
                        Approve & Activate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 5: COMMAND OPS & EMERGENCY ─── */}
        {activeTab === 'operations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Break Glass Architecture */}
            <div className="rounded-xl border border-amber-500/30 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-amber-400">
                    <Key className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Break-Glass Protocol</h3>
                    <p className="text-xs text-slate-400">Disaster recovery for lost Super Admin access</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  ROOT_ADMIN holds platform-wide technical governance authority. In disaster scenarios where Super Admins are locked out or compromised, execute the emergency CLI command on the server host:
                </p>

                <div className="rounded-lg bg-slate-950 p-3 text-xs font-mono text-amber-300 border border-slate-800 break-all">
                  node scripts/breakGlassRecovery.js &lt;email&gt; &lt;new_password&gt;
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Triple-Lock v7.0 Cryptographic Guard Active</span>
              </div>
            </div>

            {/* Security Lockout Flush Console */}
            <div className="rounded-xl border border-red-500/30 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-red-400">
                    <Unlock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Platform Lockout Operations</h3>
                    <p className="text-xs text-slate-400">Unblock brute-force trapped IPs and accounts</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  The Triple-Lock rate limiter automatically strikes and locks out IPs with abnormal request patterns. Root Admins can purge all active locks with zero downtime.
                </p>

                <div className="rounded-lg bg-red-950/20 border border-red-500/20 p-3 text-xs text-red-300">
                  ⚠ Purging lockouts will immediately restore access to all currently restricted client IP addresses.
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setFlushLockoutReason('');
                    setFlushLockoutConfirmed(false);
                    setIsFlushLockoutModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg hover:bg-red-500 transition cursor-pointer"
                >
                  <Unlock className="h-4 w-4" />
                  <span>Flush Security Lockouts</span>
                </button>
              </div>
            </div>

            {/* Emergency District Broadcast Console */}
            <div className="rounded-xl border border-blue-500/30 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 p-2 text-blue-400">
                    <Radio className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Civic Emergency Broadcast</h3>
                    <p className="text-xs text-slate-400">Publish alerts across all platform portals</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Publish high-priority administrative bulletins, weather advisories, or town-wide alerts. Broadcast banners appear instantly on HM, Teacher, and Student portals.
                </p>

                <div className="rounded-lg bg-blue-950/20 border border-blue-500/20 p-3 text-xs text-blue-300">
                  ℹ Broadcasts are logged in the immutable audit ledger with severity level and issuing actor identity.
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-blue-500/40 bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg hover:bg-blue-500 transition cursor-pointer"
                >
                  <Radio className="h-4 w-4" />
                  <span>Issue Emergency Broadcast</span>
                </button>
              </div>
            </div>
          </div>
        )}


        {/* ─── TAB 6: IMMUTABLE AUDIT STREAM ─── */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={auditSearchQuery}
                    onChange={(eventObject) => setAuditSearchQuery(eventObject.target.value)}
                    placeholder="Search audit action (e.g. BREAK_GLASS, CREATED)..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/90 py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <select
                  value={auditResultFilter}
                  onChange={(eventObject) => setAuditResultFilter(eventObject.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
                >
                  <option value="">All Results</option>
                  <option value="SUCCESS">Success</option>
                  <option value="FAILURE">Failure</option>
                </select>
              </div>

              <button
                type="button"
                onClick={fetchAuditLogs}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isAuditLogsLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Stream</span>
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs shadow-2xl">
              <div className="space-y-2">
                {isAuditLogsLoading ? (
                  <div className="py-8 text-center text-slate-400">
                    <RefreshCw className="mx-auto h-5 w-5 animate-spin text-purple-400" />
                    <p className="mt-2 text-xs">Streaming audit ledger records...</p>
                  </div>
                ) : auditLogsList.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    <p>No matching audit records in current view.</p>
                  </div>
                ) : (
                  auditLogsList.map((auditRecord) => (
                    <div
                      key={auditRecord._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2 text-slate-300 transition hover:bg-slate-900/60 p-2 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-500">
                          {new Date(auditRecord.createdAt).toLocaleTimeString()}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            auditRecord.result === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                          }`}
                        >
                          {auditRecord.result}
                        </span>
                        <span className="font-bold text-amber-400">{auditRecord.action}</span>
                        <span className="text-slate-400 truncate max-w-xs">
                          by {auditRecord.actorRole} ({auditRecord.actorName || 'System'})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Target: {auditRecord.targetName || auditRecord.targetModel || 'Global'} • {auditRecord.ipAddress || 'Internal'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: EXPORTS & SYSTEM HEALTH ─── */}
        {activeTab === 'reports' && (
          <ReportingHealthTab />
        )}

        {/* ─── MODAL: REGISTER SCHOOL ─── */}
        {isRegisterSchoolModalOpen && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="relative w-full max-w-xl rounded-2xl border border-emerald-500/40 bg-slate-900 p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-400">
                    <SchoolIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white">Register School</h3>
                    <p className="text-xs text-slate-400">Add a new educational entity to Liaquatabad Town Centre</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRegisterSchoolModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleRegisterSchoolSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Official School Name *</label>
                  <input
                    type="text"
                    required
                    value={registerSchoolFormData.name}
                    onChange={(eventObject) => setRegisterSchoolFormData({ ...registerSchoolFormData, name: eventObject.target.value })}
                    placeholder="e.g. Molana Muhammad Hussain Azad Govt. Boys Secondary School"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">School Code (Prefix) *</label>
                    <input
                      type="text"
                      value={registerSchoolFormData.schoolCode}
                      onChange={(eventObject) => setRegisterSchoolFormData({ ...registerSchoolFormData, schoolCode: eventObject.target.value.toUpperCase() })}
                      placeholder="e.g. MMHA, GGSS"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white uppercase font-mono placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                    <p className="mt-1 text-[10px] text-slate-500">Prefix for student IDs (2-10 chars)</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300">EMIS Code</label>
                    <input
                      type="text"
                      value={registerSchoolFormData.emisCode}
                      onChange={(eventObject) => setRegisterSchoolFormData({ ...registerSchoolFormData, emisCode: eventObject.target.value })}
                      placeholder="e.g. 408090123"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">School Category *</label>
                    <select
                      value={registerSchoolFormData.schoolType}
                      onChange={(eventObject) => setRegisterSchoolFormData({ ...registerSchoolFormData, schoolType: eventObject.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="SECONDARY">Secondary (Class 6–10)</option>
                      <option value="PRIMARY">Primary (Class 1–5)</option>
                      <option value="ELEMENTARY">Elementary (Class 1–8)</option>
                      <option value="HIGHER_SECONDARY">Higher Secondary (Class 6–12)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Gender Orientation *</label>
                    <select
                      value={registerSchoolFormData.genderType}
                      onChange={(eventObject) => setRegisterSchoolFormData({ ...registerSchoolFormData, genderType: eventObject.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="BOYS">Boys</option>
                      <option value="GIRLS">Girls</option>
                      <option value="CO_EDUCATION">Co-Education</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">Institutional Address *</label>
                  <input
                    type="text"
                    required
                    value={registerSchoolFormData.address}
                    onChange={(eventObject) => setRegisterSchoolFormData({ ...registerSchoolFormData, address: eventObject.target.value })}
                    placeholder="e.g. Near Super Market, Liaquatabad No. 4, Karachi"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Official Phone</label>
                    <input
                      type="text"
                      value={registerSchoolFormData.contactPhone}
                      onChange={(eventObject) => setRegisterSchoolFormData({ ...registerSchoolFormData, contactPhone: eventObject.target.value })}
                      placeholder="e.g. 021-34981234"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Official Email</label>
                    <input
                      type="email"
                      value={registerSchoolFormData.contactEmail}
                      onChange={(eventObject) => setRegisterSchoolFormData({ ...registerSchoolFormData, contactEmail: eventObject.target.value })}
                      placeholder="e.g. mmha.boys@liaquatabad.gov.pk"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsRegisterSchoolModalOpen(false)}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRegisteringSchoolSubmitting}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow cursor-pointer disabled:opacity-50"
                  >
                    {isRegisteringSchoolSubmitting ? 'Registering...' : 'Confirm Registration'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── MODAL: AUTHORIZE SUPER ADMIN (EXISTING USER WORKFLOW) ─── */}
        {isAuthorizeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="relative w-full max-w-xl rounded-2xl border border-amber-500/40 bg-slate-900 p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-amber-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white">Authorize Super Administrator</h3>
                    <p className="text-xs text-slate-400">Grant operational platform authority to an existing personnel account</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAuthorizeModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Informational Callout */}
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300/90 leading-relaxed space-y-1">
                <p className="font-semibold text-amber-300">RBAC Architectural Invariants:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                  <li>Civil Service Designation (<span className="text-amber-300 font-mono">user.designation</span>) remains 100% unchanged.</li>
                  <li>Base Registration Category (<span className="text-amber-300 font-mono">user.baseRole</span>) remains 100% unchanged.</li>
                  <li>Active sessions will be revoked immediately via security token version rotation.</li>
                </ul>
              </div>

              <form onSubmit={handleAuthorizeSuperAdminSubmit} className="space-y-4">
                {/* Step 1: Select Existing Personnel */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Existing Personnel Account *
                  </label>
                  
                  {/* Search input for filtering */}
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={authorizeUserSearch}
                      onChange={(e) => setAuthorizeUserSearch(e.target.value)}
                      placeholder="Filter by name, email, or civil title..."
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/90 py-1.5 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Scrollable User Selector Roster */}
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-700 bg-slate-950/60 divide-y divide-slate-800/80">
                    {(() => {
                      const candidateUsers = usersList.filter((u) => {
                        if (u.role === 'ROOT_ADMIN' || u.role === 'SUPER_ADMIN') return false;
                        if (!authorizeUserSearch.trim()) return true;
                        const q = authorizeUserSearch.toLowerCase();
                        return (
                          u.fullName?.toLowerCase().includes(q) ||
                          u.email?.toLowerCase().includes(q) ||
                          u.designation?.toLowerCase().includes(q)
                        );
                      });

                      if (candidateUsers.length === 0) {
                        return (
                          <div className="p-4 text-center text-xs text-slate-500">
                            No eligible personnel found matching "{authorizeUserSearch}".
                          </div>
                        );
                      }

                      return candidateUsers.map((u) => {
                        const isSelected = authorizeFormData.userId === u._id;
                        return (
                          <div
                            key={u._id}
                            onClick={() => setAuthorizeFormData({ ...authorizeFormData, userId: u._id })}
                            className={`flex items-center justify-between p-2.5 text-xs transition cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/20 border-l-4 border-amber-500'
                                : 'hover:bg-slate-800/50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-[11px] font-bold text-slate-200">
                                {u.fullName?.charAt(0).toUpperCase()}
                              </div>
                              <div className="truncate">
                                <p className="font-bold text-white truncate">{u.fullName}</p>
                                <p className="text-[10px] text-slate-400 font-mono truncate">{u.email}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <span className="text-[10px] text-slate-300 font-medium block">
                                {u.designation || 'Staff'}
                              </span>
                              <span className="text-[9px] font-mono text-amber-400 uppercase">
                                Current: {u.role}
                              </span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Selected User Confirmation Card */}
                {authorizeFormData.userId && (() => {
                  const picked = usersList.find((u) => u._id === authorizeFormData.userId);
                  if (!picked) return null;
                  return (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5 text-xs flex items-center justify-between">
                      <div>
                        <span className="text-emerald-400 font-bold block">Selected Candidate:</span>
                        <span className="text-white font-medium">{picked.fullName} ({picked.email})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] block">Title: {picked.designation || 'Staff'}</span>
                        <span className="text-emerald-400 font-mono text-[10px] uppercase">Base: {picked.baseRole || 'TEACHER'}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Authority & Scope Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Target Authority</label>
                    <div className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-amber-400 font-mono flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>SUPER_ADMIN (Level 90)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Operational Scope *</label>
                    <select
                      value={authorizeFormData.scope}
                      onChange={(e) => setAuthorizeFormData({ ...authorizeFormData, scope: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="GLOBAL">GLOBAL (Platform-wide Authority)</option>
                      <option value="TOWN">TOWN (Town Administrative Scope)</option>
                    </select>
                  </div>
                </div>

                {/* Mandatory Justification Reason */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Mandatory Justification Reason *</label>
                  <textarea
                    required
                    rows={2}
                    minLength={5}
                    value={authorizeFormData.reason}
                    onChange={(e) => setAuthorizeFormData({ ...authorizeFormData, reason: e.target.value })}
                    placeholder="Provide explicit operational justification for granting Super Admin authority..."
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAuthorizeModalOpen(false)}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAuthorizingSubmitting || !authorizeFormData.userId}
                    className="flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-xs font-semibold text-white hover:bg-amber-500 transition shadow cursor-pointer disabled:opacity-50"
                  >
                    {isAuthorizingSubmitting ? 'Authorizing...' : 'Grant Super Admin Authority'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


        {/* ─── MODAL: DISABLE SUPER ADMIN ─── */}
        {isDisableModalOpen && selectedSuperAdminToDisable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="relative w-full max-w-md rounded-2xl border border-red-500/40 bg-slate-900 p-6 shadow-2xl space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Disable Super Administrator</h3>
                  <p className="text-xs text-slate-400">Revokes all active sessions immediately</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                You are disabling <strong className="text-white">{selectedSuperAdminToDisable.fullName}</strong> ({selectedSuperAdminToDisable.email}). All active JWT tokens will be revoked via tokenVersion increment.
              </p>

              <form onSubmit={handleDisableSuperAdminSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Mandatory Justification Reason *</label>
                  <textarea
                    required
                    rows={3}
                    value={disableReasonText}
                    onChange={(eventObject) => setDisableReasonText(eventObject.target.value)}
                    placeholder="Enter explicit administrative or disciplinary reason..."
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsDisableModalOpen(false)}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDisablingSubmitting}
                    className="rounded-lg bg-red-600 px-5 py-2 text-xs font-semibold text-white hover:bg-red-500 transition shadow cursor-pointer disabled:opacity-50"
                  >
                    {isDisablingSubmitting ? 'Disabling...' : 'Confirm Disable'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── MODAL: EMERGENCY BROADCAST ─── */}
        {isBroadcastModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="relative w-full max-w-lg rounded-2xl border border-blue-500/40 bg-slate-900 p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-2 text-blue-400">
                    <Radio className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white">Issue District Broadcast</h3>
                    <p className="text-xs text-slate-400">Publish high-priority alert across all platform dashboards</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleBroadcastSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Broadcast Headline *</label>
                  <input
                    type="text"
                    required
                    value={broadcastFormData.title}
                    onChange={(eventObject) => setBroadcastFormData({ ...broadcastFormData, title: eventObject.target.value })}
                    placeholder="e.g. Extreme Weather Advisory: School Timings Adjusted"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">Severity Tier *</label>
                  <select
                    value={broadcastFormData.severity}
                    onChange={(eventObject) => setBroadcastFormData({ ...broadcastFormData, severity: eventObject.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="INFO">Informational (Blue)</option>
                    <option value="WARNING">Administrative Warning (Amber)</option>
                    <option value="CRITICAL">Emergency / Critical Alert (Red)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">Official Directive Content *</label>
                  <textarea
                    required
                    rows={4}
                    value={broadcastFormData.message}
                    onChange={(eventObject) => setBroadcastFormData({ ...broadcastFormData, message: eventObject.target.value })}
                    placeholder="Detailed instruction or municipal circular text..."
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsBroadcastModalOpen(false)}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isBroadcastSubmitting}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition shadow cursor-pointer disabled:opacity-50"
                  >
                    {isBroadcastSubmitting ? 'Publishing...' : 'Dispatch Broadcast'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── MODAL: FLUSH SECURITY LOCKOUTS (HARDENED WITH TYPED REASON & CONFIRMATION) ─── */}
        {isFlushLockoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="relative w-full max-w-lg rounded-2xl border border-red-500/40 bg-slate-900 p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-400">
                    <Unlock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white">Flush Security Lockout Store</h3>
                    <p className="text-xs text-slate-400">Critical Infrastructure Operation • Administrative Purge</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFlushLockoutModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="rounded-lg bg-red-950/30 border border-red-500/30 p-3.5 text-xs text-red-300 space-y-1 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 text-red-200">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  High-Impact Security Warning
                </p>
                <p>
                  Purging the security lockout store will immediately clear all active IP bans and reset failed authentication rate-limit strikes. All restricted IP addresses will regain access to platform endpoints immediately.
                </p>
              </div>

              <form onSubmit={handleFlushLockoutsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Mandatory Justification Reason * <span className="text-slate-500 font-normal">(Recorded in immutable audit ledger)</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={flushLockoutReason}
                    onChange={(eventObject) => setFlushLockoutReason(eventObject.target.value)}
                    placeholder="Enter explicit administrative or operational justification for purging IP lockouts..."
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Minimum 5 characters required.</span>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={flushLockoutConfirmed}
                      onChange={(eventObject) => setFlushLockoutConfirmed(eventObject.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-800 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-xs text-slate-300 select-none">
                      I explicitly confirm and authorize the immediate purge of all security IP lockouts and rate-limiting strike records across the platform.
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsFlushLockoutModalOpen(false)}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isFlushingLockoutsSubmitting}
                    className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-xs font-semibold text-white hover:bg-red-500 transition shadow cursor-pointer disabled:opacity-50"
                  >
                    <Unlock className="h-4 w-4" />
                    <span>{isFlushingLockoutsSubmitting ? 'Purging Lockout Records...' : 'Authorize & Flush Lockouts'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── MODAL: EDIT MUNICIPAL SCHOOL ─── */}
        <EditSchoolModal
          isOpen={isEditSchoolModalOpen}
          onClose={() => setIsEditSchoolModalOpen(false)}
          school={selectedSchoolForEdit}
          onSchoolUpdated={fetchMunicipalSchools}
        />

        {/* ─── MODAL: USER AUTHORITY & DESIGNATION MANAGEMENT ─── */}
        <UserAuthorityModal
          isOpen={isAuthorityModalOpen}
          onClose={() => {
            setIsAuthorityModalOpen(false);
            setSelectedUserForAuthority(null);
          }}
          targetUser={selectedUserForAuthority}
          currentUser={authenticatedUser}
          onAuthorityUpdated={(updatedUser) => {
            fetchGlobalUsers();
            fetchSuperAdmins();
            fetchPlatformOverview();
          }}
        />

        {/* ─── MODAL: EMERGENCY OUTAGE & INFRASTRUCTURE GATE (ROOT_ADMIN ONLY) ─── */}
        {isKillSwitchModalOpen && authenticatedUser?.role === 'ROOT_ADMIN' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-xl rounded-2xl border border-red-500/30 bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Emergency Outage Gate
                      <span className="rounded-md border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-mono text-red-400">
                        ROOT OVERRIDE
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Simulate unexpected cluster failure (HTTP 503) for non-root users.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsKillSwitchModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Live Status Badge */}
                <div
                  className={`rounded-xl border p-4 flex items-center justify-between ${
                    killSwitchStatus.isSuspended
                      ? 'border-red-500/50 bg-red-950/30 text-red-300'
                      : 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3.5 w-3.5">
                      {killSwitchStatus.isSuspended && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      )}
                      <span
                        className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                          killSwitchStatus.isSuspended ? 'bg-red-500' : 'bg-emerald-500'
                        }`}
                      ></span>
                    </span>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider">
                        {killSwitchStatus.isSuspended
                          ? 'Outage Simulation Active (HTTP 503)'
                          : 'Platform Normal & Operational (200 OK)'}
                      </div>
                      <div className="text-[11px] opacity-80 mt-0.5">
                        {killSwitchStatus.isSuspended
                          ? 'All teachers, students, super admins, and public visitors receive an unexpected cluster error.'
                          : 'All municipal services, portals, logins, and API routes are running normally.'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Explanation Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 text-xs text-slate-400 space-y-2">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold">
                    <Lock className="h-3.5 w-3.5 text-amber-400" />
                    <span>Stealth Operation Guarantee:</span>
                  </div>
                  <p className="leading-relaxed">
                    Users will <strong>NOT</strong> be told the platform was shut down or suspended. They will see a standard technical error code (e.g. replica failure or connection timeout) so it appears as an unexpected hosting or database crash.
                  </p>
                  <p className="text-slate-300 font-medium">
                    ⚡ Only your <strong>Root Admin</strong> session will continue working normally, and you can restore full platform operations with 1 click anytime.
                  </p>
                </div>

                {/* Custom Simulated Error Message Input */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300">
                    Simulated Technical Error Message (Returned in HTTP 503 Response):
                  </label>
                  <textarea
                    rows={2}
                    value={customOutageMessage}
                    onChange={(e) => setCustomOutageMessage(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
                    placeholder="Enter technical database error message..."
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500 mr-1 self-center">Presets:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomOutageMessage(
                          'Database connection pool exhausted: Connection timed out to primary replica cluster (Error: 0x80040154_DB_CLUSTER_FAIL).'
                        )
                      }
                      className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700 cursor-pointer"
                    >
                      Replica Cluster Timeout
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomOutageMessage(
                          '503 Service Unavailable: Liaquatabad Municipal Cloud node unreachable. Gateway timed out.'
                        )
                      }
                      className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700 cursor-pointer"
                    >
                      Gateway 503
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomOutageMessage(
                          'Network Error: ECONNREFUSED 127.0.0.1:27017. Remote host actively refused connection.'
                        )
                      }
                      className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700 cursor-pointer"
                    >
                      ECONNREFUSED
                    </button>
                  </div>
                </div>

                {/* Confirmation Checkbox for Activation */}
                {!killSwitchStatus.isSuspended && (
                  <div className="rounded-lg border border-red-900/40 bg-red-950/20 p-3">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={killSwitchConfirmed}
                        onChange={(e) => setKillSwitchConfirmed(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-800 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-xs text-slate-300 select-none">
                        I confirm that I want to simulate an unexpected infrastructure outage and block all non-root user traffic.
                      </span>
                    </label>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsKillSwitchModalOpen(false)}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Close
                  </button>

                  {killSwitchStatus.isSuspended ? (
                    <button
                      type="button"
                      disabled={isKillSwitchToggling}
                      onClick={() => handleToggleKillSwitch(false)}
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{isKillSwitchToggling ? 'Restoring Services...' : 'Restore Normal Operations'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!killSwitchConfirmed || isKillSwitchToggling}
                      onClick={() => handleToggleKillSwitch(true)}
                      className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-xs font-semibold text-white hover:bg-red-500 transition shadow cursor-pointer disabled:opacity-50"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      <span>{isKillSwitchToggling ? 'Triggering Outage...' : 'Simulate Cluster Outage (503)'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>

  );
};

export default RootAdminDashboard;
