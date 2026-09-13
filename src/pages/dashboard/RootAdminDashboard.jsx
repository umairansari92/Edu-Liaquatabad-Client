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
    const currentPath = window.location.pathname;
    if (currentPath === '/schools') return 'schools';
    if (currentPath === '/users') return 'users';
    if (currentPath === '/transfers') return 'transfers';
    if (currentPath === '/audit-logs') return 'audit';
    if (currentPath === '/attendance' || currentPath === '/exams') return 'academic';
    if (currentPath === '/documents') return 'reports';
    return 'schools';
  });

  // Sync tab when sidebar link is clicked
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath === '/schools') setActiveTab('schools');
    else if (currentPath === '/users') setActiveTab('users');
    else if (currentPath === '/transfers') setActiveTab('transfers');
    else if (currentPath === '/audit-logs') setActiveTab('audit');
    else if (currentPath === '/attendance' || currentPath === '/exams') setActiveTab('academic');
    else if (currentPath === '/documents') setActiveTab('reports');
    else if (currentPath === '/dashboard') setActiveTab('schools');
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
    } catch (statusError) {
      console.warn('[KillSwitch] Failed to fetch system status:', statusError.message);
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
    } catch (toggleError) {
      toast.error(toggleError.response?.data?.message || 'Failed to toggle kill switch.');
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
      .filter((userItem) => userItem.role !== 'ROOT_ADMIN')
      .map((userItem) => userItem._id);
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
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="absolute right-0 top-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-blue-50/60 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 -mb-8 h-48 w-48 rounded-full bg-emerald-50/40 blur-3xl pointer-events-none" />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-800">
                  <Crown className="h-3.5 w-3.5 text-amber-600" />
                  <span>
                    {authenticatedUser?.role === 'ROOT_ADMIN'
                      ? 'Root Administration • Platform-wide Authority'
                      : 'Executive Administration • Town Command'}
                  </span>
                </div>
                {authenticatedUser?.fullName && (
                  <div className="flex items-center gap-1.5 text-xs text-[#526477] border-l border-slate-200 pl-3">
                    <span>Officer:</span>
                    <span className="font-semibold text-[#102033]">{authenticatedUser.fullName}</span>
                    {authenticatedUser.designation && (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-[#102033]">
                        {authenticatedUser.designation.replace(/\s*\(Break-Glass Recovery\)/i, '')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-[#102033] sm:text-4xl">
                Liaquatabad Town Education Command Center
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-[#526477]">
                Education Department Liaquatabad Town Centre (DMC) — Municipal schools, authority management, and civic audit.
              </p>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsRegisterSchoolModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-[#4B7F3A] hover:bg-[#38662D] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-95 cursor-pointer"
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
                className="flex items-center gap-2 rounded-xl bg-[#006AC7] hover:bg-[#005299] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-95 cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Authorize Super Admin</span>
              </button>

              {authenticatedUser?.role === 'ROOT_ADMIN' && (
                <button
                  type="button"
                  onClick={() => setIsKillSwitchModalOpen(true)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition active:scale-95 cursor-pointer ${killSwitchStatus.isSuspended
                      ? 'border-red-500 bg-red-600 text-white animate-pulse'
                      : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                    }`}
                  title="Emergency Infrastructure Outage Control"
                >
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                  <span>{killSwitchStatus.isSuspended ? 'Outage Active (503)' : 'Emergency Switch'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={synchronizeAllTelemetry}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-[#526477] transition hover:bg-slate-50 hover:text-[#102033] active:scale-95 cursor-pointer shadow-sm"
                title="Synchronize Live Telemetry"
              >
                <RefreshCw className={`h-4 w-4 ${isOverviewLoading ? 'animate-spin text-[#006AC7]' : ''}`} />
                <span>Sync</span>
              </button>
            </div>
          </div>

          {/* ─── LIVE INFRASTRUCTURE VITALS HUD BAR ─── */}
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 text-xs sm:grid-cols-4 lg:grid-cols-4">
            <div className="flex items-center gap-2 text-[#526477]">
              <Server className="h-4 w-4 text-[#4B7F3A] shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-semibold text-[#8094A8]">Database Shard</p>
                <p className="font-medium text-[#4B7F3A]">Atlas Cluster • Connected</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[#526477]">
              <ShieldCheck className="h-4 w-4 text-[#006AC7] shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-semibold text-[#8094A8]">Security Architecture</p>
                <p className="font-medium text-[#006AC7]">Triple-Lock v7.0 Active</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[#526477]">
              <Globe className="h-4 w-4 text-amber-600 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-semibold text-[#8094A8]">Administrative Scope</p>
                <p className="font-medium text-amber-700">Platform-wide (Root Authority)</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[#526477]">
              <MapPin className="h-4 w-4 text-purple-600 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-semibold text-[#8094A8]">Jurisdiction</p>
                <p className="font-medium text-purple-700">Liaquatabad Town Centre</p>
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
              className={`rounded-xl border p-4 transition shadow-sm ${hasAttentionItems
                  ? 'border-amber-200 bg-amber-50/90'
                  : 'border-emerald-200 bg-emerald-50/90'
                }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-lg p-2 shrink-0 ${hasAttentionItems ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-[#4B7F3A]'
                      }`}
                  >
                    {hasAttentionItems ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#102033]">
                      {hasAttentionItems ? 'Operational Attention Required' : 'All Municipal Systems Operational'}
                    </h4>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#526477]">
                      {pendingCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('approvals')}
                          className="flex items-center gap-1 text-amber-700 hover:underline cursor-pointer font-medium"
                        >
                          <span>⚠ {pendingCount} user registration{pendingCount > 1 ? 's' : ''} awaiting approval</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                      {schoolCount === 0 && (
                        <button
                          type="button"
                          onClick={() => setIsRegisterSchoolModalOpen(true)}
                          className="flex items-center gap-1 text-[#006AC7] hover:underline cursor-pointer font-medium"
                        >
                          <span>ℹ 0 municipal schools registered — begin by registering first school</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                      {lockoutCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('operations')}
                          className="flex items-center gap-1 text-red-600 hover:underline cursor-pointer font-medium"
                        >
                          <span>⚠ {lockoutCount} active security lockout{lockoutCount > 1 ? 's' : ''}</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                      {!hasAttentionItems && (
                        <span className="text-[#4B7F3A] font-medium">Zero security alerts, no pending approvals, municipal database synced.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-[#8094A8] shrink-0">
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
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#006AC7]/40 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8094A8]">Schools</span>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-[#4B7F3A] group-hover:scale-110 transition">
                <SchoolIcon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[#102033]">
                {isOverviewLoading ? '...' : (overviewData?.activeSchools ?? schoolsList.length)}
              </span>
              <span className="text-[10px] font-medium text-[#4B7F3A]">Institutions</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-[#526477]">
              <span className="truncate">Liaquatabad</span>
              <span className="text-[#006AC7] font-semibold flex items-center">
                Manage <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Platform Personnel Card */}
          <div
            onClick={() => setActiveTab('users')}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#006AC7]/40 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8094A8]">Platform Users</span>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-1.5 text-[#006AC7] group-hover:scale-110 transition">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[#102033]">
                {isOverviewLoading ? '...' : (overviewData?.totalUsers ?? usersTotalCount)}
              </span>
              <span className="text-[10px] font-medium text-[#006AC7]">Accounts</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-[#526477]">
              <span>Active Accounts</span>
              <span className="text-[#006AC7] font-semibold flex items-center">
                Directory <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Total Students Enrolled Card */}
          <div
            onClick={() => setActiveTab('academic')}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8094A8]">Students</span>
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-1.5 text-indigo-600 group-hover:scale-110 transition">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[#102033]">
                {isOverviewLoading ? '...' : (overviewData?.totalStudents != null ? overviewData.totalStudents.toLocaleString() : (overviewData?.roleDistribution?.students ?? '—'))}
              </span>
              <span className="text-[10px] font-medium text-indigo-600">Enrolled</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-[#526477]">
              <span>Enrolled (from DB)</span>
              <span className="text-indigo-600 font-semibold flex items-center">
                Academic <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Active Faculty / Teachers Card */}
          <div
            onClick={() => setActiveTab('transfers')}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8094A8]">Faculty</span>
              <div className="rounded-lg border border-teal-200 bg-teal-50 p-1.5 text-teal-600 group-hover:scale-110 transition">
                <ArrowRightLeft className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[#102033]">
                {isOverviewLoading ? '...' : (overviewData?.roleDistribution?.teachers ?? usersList.filter((userItem) => userItem.role === 'TEACHER').length)}
              </span>
              <span className="text-[10px] font-medium text-teal-600">Teachers</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-[#526477]">
              <span>Registered Teachers</span>
              <span className="text-teal-600 font-semibold flex items-center">
                Transfers <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Pending Approvals Card */}
          <div
            onClick={() => setActiveTab('approvals')}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8094A8]">Approvals</span>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-1.5 text-amber-600 group-hover:scale-110 transition">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[#102033]">
                {isOverviewLoading ? '...' : (overviewData?.pendingApprovals ?? pendingUsersList.length)}
              </span>
              <span className="text-[10px] font-medium text-amber-600">Pending</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-[#526477]">
              <span>Verification</span>
              <span className="text-amber-600 font-semibold flex items-center">
                Review <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* System Security Audit Stream Card */}
          <div
            onClick={() => setActiveTab('audit')}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8094A8]">Audit Stream</span>
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-1.5 text-purple-600 group-hover:scale-110 transition">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[#102033]">
                {isOverviewLoading ? '...' : (overviewData?.totalAuditEvents ?? auditLogsList.length)}
              </span>
              <span className="text-[10px] font-medium text-purple-600">Events</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-[#526477]">
              <span>Logged Events</span>
              <span className="text-purple-600 font-semibold flex items-center">
                Audits <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Data Freshness & Sync Row */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[#526477] px-1">
          <span>Platform Data Freshness: {overviewData?.systemHealth?.timestamp ? new Date(overviewData.systemHealth.timestamp).toLocaleString() : 'Connected to live database'}</span>
          <button
            type="button"
            onClick={synchronizeAllTelemetry}
            className="flex items-center gap-1.5 text-[#006AC7] hover:text-[#005299] transition cursor-pointer font-medium"
          >
            <RefreshCw className={`h-3 w-3 ${isOverviewLoading ? 'animate-spin' : ''}`} />
            <span>Sync Fresh Telemetry</span>
          </button>
        </div>

        {/* ─── 3. INTERACTIVE TELEMETRY & ANALYTICS SECTION ─── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Municipal Attendance Telemetry (AreaChart) */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#4B7F3A]" />
                  <h3 className="font-bold text-[#102033]">Town-wide Attendance Overview</h3>
                </div>
                <p className="text-xs text-[#526477]">Daily attendance rate across registered municipal schools</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-[#4B7F3A] font-medium">
                  <span className="h-2 w-2 rounded-full bg-[#4B7F3A]" /> {analyticsData?.infrastructureVitals?.averageAttendance ? `Town Avg: ${analyticsData.infrastructureVitals.averageAttendance}` : 'Town Avg: —'}
                </span>
                <span className="flex items-center gap-1 text-[#006AC7] font-medium">
                  <span className="h-2 w-2 rounded-full bg-[#006AC7]" /> Boys
                </span>
                <span className="flex items-center gap-1 text-pink-600 font-medium">
                  <span className="h-2 w-2 rounded-full bg-pink-500" /> Girls
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
                        <stop offset="5%" stopColor="#4B7F3A" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4B7F3A" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="girlsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="day" stroke="#94A3B8" tick={{ fill: '#64748B', fontSize: 11 }} />
                    <YAxis domain={[80, 100]} stroke="#94A3B8" tick={{ fill: '#64748B', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E2E8F0',
                        borderRadius: '0.75rem',
                        color: '#102033',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                      }}
                    />
                    <Area type="monotone" dataKey="overallRate" name="Overall Rate (%)" stroke="#4B7F3A" strokeWidth={2.5} fillOpacity={1} fill="url(#overallGrad)" />
                    <Area type="monotone" dataKey="girlsRate" name="Girls Schools (%)" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#girlsGrad)" />
                    <Area type="monotone" dataKey="boysRate" name="Boys Schools (%)" stroke="#006AC7" strokeWidth={1.5} fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[#8094A8] text-xs text-center p-4">
                  <TrendingUp className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="font-semibold text-[#526477]">No attendance records logged yet</p>
                  <p className="mt-1 text-[#8094A8] max-w-sm">Trend data populates in real-time as registered municipal schools submit their daily morning roll calls.</p>
                </div>
              )}
            </div>
            <div className="mt-2 text-[10px] text-[#8094A8] font-mono text-right">
              Source: Municipal Institutional Morning Roll Calls
            </div>
          </div>

          {/* Granted Technical Authority Distribution (BarChart) */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-amber-600" />
                <h3 className="font-bold text-[#102033]">Granted Authority Distribution</h3>
              </div>
              <p className="text-xs text-[#526477]">Users grouped by current granted technical authority</p>
            </div>

            <div className="mt-3 h-64 w-full">
              {analyticsData?.authorityPyramid && analyticsData.authorityPyramid.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.authorityPyramid}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                    <XAxis type="number" stroke="#94A3B8" tick={{ fill: '#64748B', fontSize: 10 }} />
                    <YAxis type="category" dataKey="label" stroke="#94A3B8" tick={{ fill: '#64748B', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E2E8F0',
                        borderRadius: '0.75rem',
                        color: '#102033',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {analyticsData.authorityPyramid.map((entry, entryIndex) => (
                        <Cell key={`bar-cell-${entryIndex}`} fill={entry.fill || '#006AC7'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[#8094A8] text-xs text-center p-4">
                  <BarChart3 className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="font-semibold text-[#526477]">No authority records found</p>
                  <p className="mt-1 text-[#8094A8]">Distribution updates as accounts are provisioned and authorized.</p>
                </div>
              )}
            </div>
            <div className="mt-2 text-[10px] text-[#8094A8] font-mono text-right">
              Civil Designations are tracked separately
            </div>
          </div>
        </div>

        {/* ─── 4. CENTRAL PLATFORM COMMAND TABS ─── */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('schools')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${activeTab === 'schools'
                ? 'bg-[#F0F8FF] text-[#006AC7] border border-blue-200 shadow-sm'
                : 'text-[#526477] hover:text-[#102033] hover:bg-slate-100'
              }`}
          >
            <SchoolIcon className="h-4 w-4" />
            <span>Municipal Schools</span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-[#006AC7] font-mono font-bold">
              {schoolsList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('academic')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${activeTab === 'academic'
                ? 'bg-[#F0F8FF] text-[#006AC7] border border-blue-200 shadow-sm'
                : 'text-[#526477] hover:text-[#102033] hover:bg-slate-100'
              }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Academic Control</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transfers')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${activeTab === 'transfers'
                ? 'bg-[#F0F8FF] text-[#006AC7] border border-blue-200 shadow-sm'
                : 'text-[#526477] hover:text-[#102033] hover:bg-slate-100'
              }`}
          >
            <ArrowRightLeft className="h-4 w-4" />
            <span>Teacher Transfers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${activeTab === 'users'
                ? 'bg-[#F0F8FF] text-[#006AC7] border border-blue-200 shadow-sm'
                : 'text-[#526477] hover:text-[#102033] hover:bg-slate-100'
              }`}
          >
            <Users className="h-4 w-4" />
            <span>Personnel Directory</span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-[#006AC7] font-mono font-bold">
              {usersTotalCount || usersList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('governance')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${activeTab === 'governance'
                ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-sm'
                : 'text-[#526477] hover:text-[#102033] hover:bg-slate-100'
              }`}
          >
            <Crown className="h-4 w-4" />
            <span>Authority & Governance</span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 font-mono font-bold">
              {superAdminsList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${activeTab === 'approvals'
                ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-sm'
                : 'text-[#526477] hover:text-[#102033] hover:bg-slate-100'
              }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Clearance & Approvals</span>
            {pendingUsersList.length > 0 && (
              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs text-amber-900 font-bold animate-pulse">
                {pendingUsersList.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('operations')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${activeTab === 'operations'
                ? 'bg-purple-50 text-purple-800 border border-purple-200 shadow-sm'
                : 'text-[#526477] hover:text-[#102033] hover:bg-slate-100'
              }`}
          >
            <Zap className="h-4 w-4" />
            <span>Command Ops & Emergency</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${activeTab === 'audit'
                ? 'bg-purple-50 text-purple-800 border border-purple-200 shadow-sm'
                : 'text-[#526477] hover:text-[#102033] hover:bg-slate-100'
              }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Audit Stream</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${activeTab === 'reports'
                ? 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200 shadow-sm'
                : 'text-[#526477] hover:text-[#102033] hover:bg-slate-100'
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
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8094A8]" />
                  <input
                    type="text"
                    value={schoolSearchQuery}
                    onChange={(eventObject) => setSchoolSearchQuery(eventObject.target.value)}
                    placeholder="Search by school name, MMHA code, EMIS, or area..."
                    className="w-full rounded-lg border border-slate-200 bg-[#F8FBFD] py-2 pl-9 pr-4 text-xs text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:bg-white focus:outline-none"
                  />
                </div>

                <select
                  value={schoolTypeFilter}
                  onChange={(eventObject) => setSchoolTypeFilter(eventObject.target.value)}
                  className="rounded-lg border border-slate-200 bg-[#F8FBFD] px-3 py-2 text-xs text-[#102033] focus:border-[#006AC7] focus:bg-white focus:outline-none"
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
                  className="rounded-lg border border-slate-200 bg-[#F8FBFD] px-3 py-2 text-xs text-[#102033] focus:border-[#006AC7] focus:bg-white focus:outline-none"
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
                  className="flex items-center gap-1.5 rounded-lg bg-[#4B7F3A] hover:bg-[#38662D] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Register School</span>
                </button>
              </div>
            </div>

            {/* Schools Grid */}
            {isSchoolsLoading ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white p-12 text-[#526477]">
                <RefreshCw className="h-8 w-8 animate-spin text-[#006AC7]" />
                <p className="mt-3 text-sm">Querying municipal school infrastructure...</p>
              </div>
            ) : schoolsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <SchoolIcon className="h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-base font-bold text-[#102033]">No Municipal Schools Registered Yet</h3>
                <p className="mt-1 max-w-md text-xs text-[#526477]">
                  As Root Administrator, you can register the first municipal school directly or use the quick action button above.
                </p>
                <button
                  type="button"
                  onClick={() => setIsRegisterSchoolModalOpen(true)}
                  className="mt-4 flex items-center gap-2 rounded-xl bg-[#4B7F3A] hover:bg-[#38662D] px-4 py-2 text-xs font-semibold text-white shadow-sm transition cursor-pointer"
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
                    className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-[#006AC7]/40 hover:shadow-md"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            {schoolRecord.schoolCode && (
                              <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-mono font-bold text-[#006AC7]">
                                {schoolRecord.schoolCode}
                              </span>
                            )}
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-[#526477]">
                              EMIS: {schoolRecord.emisCode || 'Unassigned'}
                            </span>
                          </div>
                          <h4 className="mt-2 text-sm font-bold text-[#102033] leading-snug">{schoolRecord.name}</h4>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${schoolRecord.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                        >
                          {schoolRecord.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-[#526477] border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-2 text-[#8094A8]">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{schoolRecord.address}</span>
                        </div>
                        <div className="flex items-center justify-between text-[#526477]">
                          <span className="text-[#8094A8]">Category:</span>
                          <span className="font-medium text-[#102033]">{schoolRecord.schoolType} • {schoolRecord.genderType}</span>
                        </div>
                        <div className="flex items-center justify-between text-[#526477]">
                          <span className="text-[#8094A8]">Head Master:</span>
                          <span className="font-medium text-[#102033]">{schoolRecord.headMaster || 'Not Appointed'}</span>
                        </div>
                        <div className="flex items-center justify-between text-[#526477]">
                          <span className="text-[#8094A8]">Active Faculty:</span>
                          <span className="font-semibold text-[#4B7F3A]">{schoolRecord.facultyCount || 0} Certified</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSchoolForEdit(schoolRecord);
                          setIsEditSchoolModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#006AC7] hover:bg-blue-100 transition cursor-pointer"
                      >
                        <Edit2 className="h-3 w-3 text-[#006AC7]" />
                        <span>Edit School</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {schoolRecord.contactPhone && (
                          <a
                            href={`tel:${schoolRecord.contactPhone}`}
                            className="flex items-center gap-1 text-[#8094A8] hover:text-[#102033] transition"
                            title={schoolRecord.contactPhone}
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {schoolRecord.contactEmail && (
                          <a
                            href={`mailto:${schoolRecord.contactEmail}`}
                            className="flex items-center gap-1 text-[#8094A8] hover:text-[#102033] transition"
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
            teachersList={usersList.filter((userItem) => userItem.role === 'TEACHER')}
          />
        )}

        {/* ─── TAB 2: GLOBAL PERSONNEL & IDENTITY DIRECTORY (8 ROLES) ─── */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8094A8]" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(eventObject) => setUserSearchQuery(eventObject.target.value)}
                    placeholder="Search by full name, email address, or designation..."
                    className="w-full rounded-lg border border-slate-200 bg-[#F8FBFD] py-2 pl-9 pr-4 text-xs text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:bg-white focus:outline-none"
                  />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(eventObject) => setUserRoleFilter(eventObject.target.value)}
                  className="rounded-lg border border-slate-200 bg-[#F8FBFD] px-3 py-2 text-xs text-[#102033] focus:border-[#006AC7] focus:bg-white focus:outline-none"
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
                  className="rounded-lg border border-slate-200 bg-[#F8FBFD] px-3 py-2 text-xs text-[#102033] focus:border-[#006AC7] focus:bg-white focus:outline-none"
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
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-[#526477] hover:bg-slate-50 hover:text-[#102033] transition cursor-pointer shadow-sm"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isUsersLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Bulk Actions Banner */}
            {selectedUserIds.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/90 p-3 shadow-sm animate-fadeIn">
                <div className="flex items-center gap-2 text-xs font-bold text-[#006AC7]">
                  <CheckSquare className="h-4 w-4 text-[#006AC7]" />
                  <span>{selectedUserIds.length} personnel selected for bulk governance</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBulkUserAction('APPROVE')}
                    disabled={isBulkOperating}
                    className="flex items-center gap-1.5 rounded-lg bg-[#4B7F3A] hover:bg-[#38662D] px-3 py-1.5 text-xs font-semibold text-white transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Bulk Approve (Activate)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkUserAction('SUSPEND')}
                    disabled={isBulkOperating}
                    className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Bulk Suspend</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUserIds([])}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-[#526477] hover:bg-slate-50 cursor-pointer shadow-sm"
                  >
                    Deselect
                  </button>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#526477]">
                  <thead className="border-b border-slate-200 bg-[#F0F8FF]/80 text-[11px] uppercase font-bold text-[#526477] tracking-wider">
                    <tr>
                      <th className="w-10 px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={
                            usersList.filter((userItem) => userItem.role !== 'ROOT_ADMIN').length > 0 &&
                            selectedUserIds.length === usersList.filter((userItem) => userItem.role !== 'ROOT_ADMIN').length
                          }
                          onChange={handleSelectAllVisibleUsers}
                          className="rounded border-slate-300 bg-white text-[#006AC7] focus:ring-[#006AC7] cursor-pointer"
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
                  <tbody className="divide-y divide-slate-100">
                    {isUsersLoading ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-[#8094A8]">
                          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#006AC7]" />
                          <p className="mt-2 text-xs">Querying personnel registry...</p>
                        </td>
                      </tr>
                    ) : usersList.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-[#8094A8]">
                          <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                          <p className="text-sm font-semibold text-[#102033]">No personnel records found</p>
                          <p className="text-xs text-[#8094A8] mt-1">Adjust your filters or register new users.</p>
                        </td>
                      </tr>
                    ) : (
                      usersList.map((userRecord) => (
                        <tr key={userRecord._id} className="transition hover:bg-blue-50/30">
                          <td className="w-10 px-4 py-4 text-center">
                            {userRecord.role === 'ROOT_ADMIN' ? (
                              <span title="Root Admin account is protected from bulk actions">
                                <Lock className="h-3.5 w-3.5 text-slate-400 mx-auto" />
                              </span>
                            ) : (
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(userRecord._id)}
                                onChange={() => handleToggleSelectUser(userRecord._id)}
                                className="rounded border-slate-300 bg-white text-[#006AC7] focus:ring-[#006AC7] cursor-pointer"
                              />
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-xs font-bold text-[#006AC7]">
                                {userRecord.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-[#102033]">{userRecord.fullName}</p>
                                <p className="text-[11px] text-[#8094A8] font-mono">{userRecord.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-[#102033] font-medium">
                            {userRecord.designation || 'Civic Official'}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-mono font-bold ${userRecord.role === 'ROOT_ADMIN'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : userRecord.role === 'SUPER_ADMIN'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : userRecord.role === 'ADMIN'
                                      ? 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200'
                                      : userRecord.role === 'HM'
                                        ? 'bg-blue-50 text-[#006AC7] border border-blue-200'
                                        : 'bg-slate-100 text-[#526477] border border-slate-200'
                                }`}
                            >
                              {userRecord.role}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-[#526477]">
                            {userRecord.schoolId?.name ? (
                              <span className="truncate max-w-xs block" title={userRecord.schoolId.name}>
                                {userRecord.schoolId.name}
                              </span>
                            ) : (
                              <span className="text-[#8094A8] italic">District Level / Global</span>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${userRecord.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200'
                                  : userRecord.status === 'PENDING_APPROVAL'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
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
                                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-[#4B7F3A] hover:bg-emerald-100 transition cursor-pointer"
                                >
                                  Approve
                                </button>
                              )}
                              {userRecord.status === 'ACTIVE' && userRecord.role !== 'ROOT_ADMIN' && (
                                <button
                                  type="button"
                                  onClick={() => handleProcessUserLifecycle(userRecord._id, 'SUSPENDED', 'Administrative suspension by Root Admin')}
                                  disabled={actionProcessingUserId === userRecord._id}
                                  className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition cursor-pointer"
                                >
                                  Suspend
                                </button>
                              )}
                              {userRecord.status === 'SUSPENDED' && (
                                <button
                                  type="button"
                                  onClick={() => handleProcessUserLifecycle(userRecord._id, 'ACTIVE', 'Reinstatement by Root Admin')}
                                  disabled={actionProcessingUserId === userRecord._id}
                                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-[#4B7F3A] hover:bg-emerald-100 transition cursor-pointer"
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
                                className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#006AC7] hover:bg-blue-100 transition cursor-pointer flex items-center gap-1"
                                title="Manage Civil Designation & Technical System Authority"
                              >
                                <Shield className="w-3 h-3" />
                                <span>Authority</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

            {/* ─── TAB 3: SUPER ADMIN GOVERNANCE ─── */}
            {activeTab === 'governance' && (
                              <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
                                  <div>
                                    <h3 className="text-base font-bold text-[#102033]">Authorized Super Administrators (Level 90)</h3>
                                    <p className="text-xs text-[#526477]">
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
                                    className="flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition cursor-pointer"
                                  >
                                    <ShieldCheck className="h-4 w-4" />
                                    <span>Authorize Super Admin</span>
                                  </button>
                                </div>

                                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-[#526477]">
                                      <thead className="border-b border-slate-200 bg-[#F0F8FF]/80 text-[11px] uppercase font-bold text-[#526477] tracking-wider">
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
                                      <tbody className="divide-y divide-slate-100">
                                        {isSuperAdminsLoading ? (
                                          <tr>
                                            <td colSpan="7" className="py-12 text-center text-[#8094A8]">
                                              <RefreshCw className="mx-auto h-6 w-6 animate-spin text-amber-600" />
                                              <p className="mt-2 text-xs">Querying Super Admin roster...</p>
                                            </td>
                                          </tr>
                                        ) : superAdminsList.length === 0 ? (
                                          <tr>
                                            <td colSpan="7" className="py-12 text-center text-[#8094A8]">
                                              <Crown className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                              <p className="text-sm font-semibold text-[#102033]">No Super Admin Accounts Provisioned</p>
                                            </td>
                                          </tr>
                                        ) : (
                                          superAdminsList.map((adminRecord) => (
                                            <tr key={adminRecord._id} className="transition hover:bg-blue-50/30">
                                              <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-xs font-bold text-amber-800">
                                                    {adminRecord.fullName.charAt(0).toUpperCase()}
                                                  </div>
                                                  <div>
                                                    <p className="font-bold text-[#102033]">{adminRecord.fullName}</p>
                                                    <p className="text-[11px] text-[#8094A8] font-mono">{adminRecord.email}</p>
                                                  </div>
                                                </div>
                                              </td>

                                              <td className="px-4 py-4 font-medium text-[#102033]">
                                                {adminRecord.designation || 'Town Chairman'}
                                              </td>

                                              <td className="px-4 py-4">
                                                <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-mono font-bold text-amber-800">
                                                  SUPER_ADMIN (90)
                                                </span>
                                              </td>

                                              <td className="px-4 py-4">
                                                <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-mono font-bold text-[#006AC7]">
                                                  {adminRecord.scope || 'GLOBAL'}
                                                </span>
                                              </td>

                                              <td className="px-4 py-4">
                                                <span
                                                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${adminRecord.status === 'ACTIVE'
                                                      ? 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200'
                                                      : 'bg-red-50 text-red-700 border border-red-200'
                                                    }`}
                                                >
                                                  {adminRecord.status}
                                                </span>
                                              </td>

                                              <td className="px-4 py-4 text-[#8094A8] font-mono text-[11px]">
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
                                                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition cursor-pointer"
                                                  >
                                                    Disable Account
                                                  </button>
                                                ) : (
                                                  <span className="text-[#8094A8] italic text-xs">Disabled</span>
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
                                <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
                                  <h3 className="text-base font-bold text-[#102033]">Personnel Clearance & Approval Queue</h3>
                                  <p className="text-xs text-[#526477]">
                                    Staff and faculty awaiting civil verification and system activation.
                                  </p>
                                </div>

                                {isPendingUsersLoading ? (
                                  <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white p-12 text-[#526477]">
                                    <RefreshCw className="h-6 w-6 animate-spin text-amber-600" />
                                    <p className="mt-2 text-xs">Querying pending approval roster...</p>
                                  </div>
                                ) : pendingUsersList.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
                                    <CheckCircle2 className="h-12 w-12 text-[#4B7F3A] mb-3" />
                                    <h4 className="text-base font-bold text-[#102033]">Clearance Roster Up To Date</h4>
                                    <p className="mt-1 text-xs text-[#526477]">There are no pending registrations requiring review at this time.</p>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {pendingUsersList.map((pendingUser) => (
                                      <div
                                        key={pendingUser._id}
                                        className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition"
                                      >
                                        <div className="space-y-3">
                                          <div className="flex items-start justify-between gap-2">
                                            <div>
                                              <h4 className="font-bold text-[#102033] text-base">{pendingUser.fullName}</h4>
                                              <p className="text-xs text-[#8094A8] font-mono">{pendingUser.email}</p>
                                            </div>
                                            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-mono font-bold text-amber-800">
                                              {pendingUser.role}
                                            </span>
                                          </div>

                                          <div className="space-y-1 text-xs text-[#526477] border-t border-slate-100 pt-3">
                                            <p><span className="text-[#8094A8]">Proposed Title:</span> {pendingUser.designation || 'Teacher / Staff'}</p>
                                            <p><span className="text-[#8094A8]">Target School:</span> {pendingUser.schoolId?.name || 'District Assignment'}</p>
                                            <p><span className="text-[#8094A8]">Registered:</span> {new Date(pendingUser.createdAt).toLocaleString()}</p>
                                          </div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                                          <button
                                            type="button"
                                            onClick={() => handleProcessUserLifecycle(pendingUser._id, 'INACTIVE', 'Registration rejected by Root Admin')}
                                            disabled={actionProcessingUserId === pendingUser._id}
                                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition cursor-pointer"
                                          >
                                            Reject
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleProcessUserLifecycle(pendingUser._id, 'ACTIVE', 'Approved directly by Root Administrator')}
                                            disabled={actionProcessingUserId === pendingUser._id}
                                            className="rounded-lg bg-[#4B7F3A] hover:bg-[#38662D] px-4 py-1.5 text-xs font-semibold text-white transition shadow-sm cursor-pointer"
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
                                <div className="rounded-xl border border-amber-200 bg-white p-6 shadow-sm space-y-4 flex flex-col justify-between">
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-700">
                                        <Key className="h-5 w-5" />
                                      </div>
                                      <div>
                                        <h3 className="font-bold text-[#102033] text-base">Break-Glass Protocol</h3>
                                        <p className="text-xs text-[#526477]">Disaster recovery for lost Super Admin access</p>
                                      </div>
                                    </div>

                                    <p className="text-xs text-[#526477] leading-relaxed">
                                      ROOT_ADMIN holds platform-wide technical governance authority. In disaster scenarios where Super Admins are locked out or compromised, execute the emergency CLI command on the server host:
                                    </p>

                                    <div className="rounded-lg bg-slate-50 p-3 text-xs font-mono text-slate-800 border border-slate-200 break-all">
                                      node scripts/breakGlassRecovery.js &lt;email&gt; &lt;new_password&gt;
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 text-xs text-[#526477] pt-2 border-t border-slate-100">
                                    <CheckCircle2 className="h-4 w-4 text-[#4B7F3A] shrink-0" />
                                    <span>Triple-Lock v7.0 Cryptographic Guard Active</span>
                                  </div>
                                </div>

                                {/* Security Lockout Flush Console */}
                                <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm space-y-4 flex flex-col justify-between">
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                      <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600">
                                        <Unlock className="h-5 w-5" />
                                      </div>
                                      <div>
                                        <h3 className="font-bold text-[#102033] text-base">Platform Lockout Operations</h3>
                                        <p className="text-xs text-[#526477]">Unblock brute-force trapped IPs and accounts</p>
                                      </div>
                                    </div>

                                    <p className="text-xs text-[#526477] leading-relaxed">
                                      The Triple-Lock rate limiter automatically strikes and locks out IPs with abnormal request patterns. Root Admins can purge all active locks with zero downtime.
                                    </p>

                                    <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                                      ⚠ Purging lockouts will immediately restore access to all currently restricted client IP addresses.
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-slate-100">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFlushLockoutReason('');
                                        setFlushLockoutConfirmed(false);
                                        setIsFlushLockoutModalOpen(true);
                                      }}
                                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition cursor-pointer"
                                    >
                                      <Unlock className="h-4 w-4" />
                                      <span>Flush Security Lockouts</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Emergency District Broadcast Console */}
                                <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-sm space-y-4 flex flex-col justify-between">
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-[#006AC7]">
                                        <Radio className="h-5 w-5" />
                                      </div>
                                      <div>
                                        <h3 className="font-bold text-[#102033] text-base">Civic Emergency Broadcast</h3>
                                        <p className="text-xs text-[#526477]">Publish alerts across all platform portals</p>
                                      </div>
                                    </div>

                                    <p className="text-xs text-[#526477] leading-relaxed">
                                      Publish high-priority administrative bulletins, weather advisories, or town-wide alerts. Broadcast banners appear instantly on HM, Teacher, and Student portals.
                                    </p>

                                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-[#006AC7]">
                                      ℹ Broadcasts are logged in the immutable audit ledger with severity level and issuing actor identity.
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-slate-100">
                                    <button
                                      type="button"
                                      onClick={() => setIsBroadcastModalOpen(true)}
                                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#006AC7] hover:bg-[#005299] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition cursor-pointer"
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
                                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
                                  <div className="flex flex-1 items-center gap-3">
                                    <div className="relative flex-1 max-w-md">
                                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8094A8]" />
                                      <input
                                        type="text"
                                        value={auditSearchQuery}
                                        onChange={(eventObject) => setAuditSearchQuery(eventObject.target.value)}
                                        placeholder="Search audit action (e.g. BREAK_GLASS, CREATED)..."
                                        className="w-full rounded-lg border border-slate-200 bg-[#F8FBFD] py-2 pl-9 pr-4 text-xs text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:bg-white focus:outline-none"
                                      />
                                    </div>

                                    <select
                                      value={auditResultFilter}
                                      onChange={(eventObject) => setAuditResultFilter(eventObject.target.value)}
                                      className="rounded-lg border border-slate-200 bg-[#F8FBFD] px-3 py-2 text-xs text-[#102033] focus:border-[#006AC7] focus:bg-white focus:outline-none"
                                    >
                                      <option value="">All Results</option>
                                      <option value="SUCCESS">Success</option>
                                      <option value="FAILURE">Failure</option>
                                    </select>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={fetchAuditLogs}
                                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-[#526477] hover:bg-slate-50 hover:text-[#102033] transition cursor-pointer shadow-sm"
                                  >
                                    <RefreshCw className={`h-3.5 w-3.5 ${isAuditLogsLoading ? 'animate-spin' : ''}`} />
                                    <span>Refresh Stream</span>
                                  </button>
                                </div>

                                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 font-mono text-xs shadow-sm">
                                  <div className="space-y-2">
                                    {isAuditLogsLoading ? (
                                      <div className="py-8 text-center text-[#8094A8]">
                                        <RefreshCw className="mx-auto h-5 w-5 animate-spin text-[#006AC7]" />
                                        <p className="mt-2 text-xs">Streaming audit ledger records...</p>
                                      </div>
                                    ) : auditLogsList.length === 0 ? (
                                      <div className="py-8 text-center text-[#8094A8]">
                                        <p>No matching audit records in current view.</p>
                                      </div>
                                    ) : (
                                      auditLogsList.map((auditRecord) => (
                                        <div
                                          key={auditRecord._id}
                                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2 text-[#526477] transition hover:bg-blue-50/20 p-2 rounded"
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-[#8094A8]">
                                              {new Date(auditRecord.createdAt).toLocaleTimeString()}
                                            </span>
                                            <span
                                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${auditRecord.result === 'SUCCESS' ? 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                                                }`}
                                            >
                                              {auditRecord.result}
                                            </span>
                                            <span className="font-bold text-[#006AC7]">{auditRecord.action}</span>
                                            <span className="text-[#526477] truncate max-w-xs">
                                              by {auditRecord.actorRole} ({auditRecord.actorName || 'System'})
                                            </span>
                                          </div>
                                          <div className="text-[11px] text-[#8094A8]">
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
                              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                                <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div className="flex items-center gap-2.5">
                                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-[#4B7F3A]">
                                        <SchoolIcon className="h-5 w-5" />
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-extrabold text-[#102033]">Register School</h3>
                                        <p className="text-xs text-[#526477]">Add a new educational entity to Liaquatabad Town Centre</p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setIsRegisterSchoolModalOpen(false)}
                                      className="rounded-lg p-1.5 text-[#8094A8] hover:bg-slate-100 hover:text-[#102033] cursor-pointer"
                                    >
                                      <XCircle className="h-5 w-5" />
                                    </button>
                                  </div>

                                  <form onSubmit={handleRegisterSchoolSubmit} className="space-y-4">
                                    <div>
                                      <label className="block text-xs font-semibold text-[#102033]">Official School Name *</label>
                                      <input
                                        type="text"
                                        required
                                        value={registerSchoolFormData.name}
                                        onChange={(eventObject) => setRegisterSchoolFormData({ ...registerSchoolFormData, name: eventObject.target.value })}
                                        placeholder="e.g. Molana Muhammad Hussain Azad Govt. Boys Secondary School"
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-[#F8FBFD] px-3 py-2 text-xs text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:bg-white focus:outline-none"
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-semibold text-[#102033]">School Code (Prefix) *</label>
                                        <input
                                          type="text"
                                          value={registerSchoolFormData.schoolCode}
                                          onChange={(eventObject) => setRegisterSchoolFormData({ ...registerSchoolFormData, schoolCode: eventObject.target.value.toUpperCase() })}
                                          placeholder="e.g. MMHA, GGSS"
                                          className="mt-1 w-full rounded-lg border border-slate-200 bg-[#F8FBFD] px-3 py-2 text-xs text-[#102033] uppercase font-mono placeholder-slate-400 focus:border-[#006AC7] focus:bg-white focus:outline-none"
                                        />
                                        <p className="mt-1 text-[10px] text-[#8094A8]">Prefix for student IDs (2-10 chars)</p>
                                      </div>

                                      <div>
                                        <label className="block text-xs font-semibold text-[#102033]">EMIS Code</label>
                                        <input
                                          type="text"
                                          value={registerSchoolFormData.emisCode}
                                          onChange={(eventObject) => setRegisterSchoolFormData({ ...registerSchoolFormData, emisCode: eventObject.target.value })}
                                          placeholder="e.g. 408090123"
                                          className="mt-1 w-full rounded-lg border border-slate-200 bg-[#F8FBFD] px-3 py-2 text-xs text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:bg-white focus:outline-none"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-semibold text-[#102033]">School Category *</label>
                                        <select
                                          value={registerSchoolFormData.schoolType}
                                          onChange={(eventObject) => setRegisterSchoolFormData({ ...registerSchoolFormData, schoolType: eventObject.target.value })}
                                          className="mt-1 w-full rounded-lg border border-slate-200 bg-[#F8FBFD] px-3 py-2 text-xs text-[#102033] focus:border-[#006AC7] focus:bg-white focus:outline-none"
                                        >
                                          <option value="SECONDARY">Secondary (Class 6–10)</option>
                                          <option value="PRIMARY">Primary (Class 1–5)</option>
                                          <option value="ELEMENTARY">Elementary (Class 1–8)</option>
                                          <option value="HIGHER_SECONDARY">Higher Secondary (Class 6–12)</option>
                                        </select>
                                      </div>

                                      <div>
                                        <label className="block text-xs font-semibold text-[#102033]">Gender Orientation *</label>
                                        <select
                                          value={registerSchoolFormData.genderType}
                                          onChange={(eventObject) => setRegisterSchoolFormData({ ...registerSchoolFormData, genderType: eventObject.target.value })}
                                          className="mt-1 w-full rounded-lg border border-slate-200 bg-[#F8FBFD] px-3 py-2 text-xs text-[#102033] focus:border-[#006AC7] focus:bg-white focus:outline-none"
                                        >
                                          <option value="BOYS">Boys</option>
                                          <option value="GIRLS">Girls</option>
                                          <option value="CO_EDUCATION">Co-Education</option>
                                        </select>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-xs font-semibold text-[#102033]">Institutional Address *</label>
                                      <input
                                        type="text"
                                        required
                                        value={registerSchoolFormData.address}
                                        onChange={(eventObject) => setRegisterSchoolFormData({ ...registerSchoolFormData, address: eventObject.target.value })}
                                        placeholder="e.g. Near Super Market, Liaquatabad No. 4, Karachi"
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-[#F8FBFD] px-3 py-2 text-xs text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:bg-white focus:outline-none"
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-semibold text-[#102033]">Official Phone</label>
                                        <input
                                          type="text"
                                          value={registerSchoolFormData.contactPhone}
                                          onChange={(eventObject) => setRegisterSchoolFormData({ ...registerSchoolFormData, contactPhone: eventObject.target.value })}
                                          placeholder="e.g. 021-34981234"
                                          className="mt-1 w-full rounded-lg border border-slate-200 bg-[#F8FBFD] px-3 py-2 text-xs text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:bg-white focus:outline-none"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs font-semibold text-[#102033]">Official Email</label>
                                        <input
                                          type="email"
                                          value={registerSchoolFormData.contactEmail}
                                          onChange={(eventObject) => setRegisterSchoolFormData({ ...registerSchoolFormData, contactEmail: eventObject.target.value })}
                                          placeholder="e.g. mmha.boys@liaquatabad.gov.pk"
                                          className="mt-1 w-full rounded-lg border border-slate-200 bg-[#F8FBFD] px-3 py-2 text-xs text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:bg-white focus:outline-none"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                                      <button
                                        type="button"
                                        onClick={() => setIsRegisterSchoolModalOpen(false)}
                                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-[#526477] hover:bg-slate-50 cursor-pointer shadow-sm"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        disabled={isRegisteringSchoolSubmitting}
                                        className="flex items-center gap-2 rounded-lg bg-[#4B7F3A] hover:bg-[#38662D] px-5 py-2 text-xs font-semibold text-white transition shadow-sm cursor-pointer disabled:opacity-50"
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
                              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                                <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div className="flex items-center gap-2.5">
                                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-700">
                                        <ShieldCheck className="h-5 w-5" />
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-extrabold text-[#102033]">Authorize Super Administrator</h3>
                                        <p className="text-xs text-[#526477]">Grant operational platform authority to an existing personnel account</p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setIsAuthorizeModalOpen(false)}
                                      className="rounded-lg p-1.5 text-[#8094A8] hover:bg-slate-100 hover:text-[#102033] cursor-pointer"
                                    >
                                      <XCircle className="h-5 w-5" />
                                    </button>
                                  </div>

                                  {/* Informational Callout */}
                                  <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 leading-relaxed space-y-1">
                                    <p className="font-semibold text-amber-800">RBAC Architectural Invariants:</p>
                                    <ul className="list-disc pl-4 space-y-0.5 text-[#526477]">
                                      <li>Civil Service Designation (<span className="text-amber-800 font-mono">user.designation</span>) remains 100% unchanged.</li>
                                      <li>Base Registration Category (<span className="text-amber-800 font-mono">user.baseRole</span>) remains 100% unchanged.</li>
                                      <li>Active sessions will be revoked immediately via security token version rotation.</li>
                                    </ul>
                                  </div>

                                  <form onSubmit={handleAuthorizeSuperAdminSubmit} className="space-y-4">
                                    {/* Step 1: Select Existing Personnel */}
                                    <div>
                                      <label className="block text-xs font-semibold text-[#102033] mb-1">
                                        Select Existing Personnel Account *
                                      </label>

                                      {/* Search input for filtering */}
                                      <div className="relative mb-2">
                                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8094A8]" />
                                        <input
                                          type="text"
                                          value={authorizeUserSearch}
                                          onChange={(inputChangeEvent) => setAuthorizeUserSearch(inputChangeEvent.target.value)}
                                          placeholder="Filter by name, email, or civil title..."
                                          className="w-full rounded-lg border border-slate-200 bg-[#F8FBFD] py-1.5 pl-9 pr-3 text-xs text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:bg-white focus:outline-none"
                                        />
                                      </div>

                                      {/* Scrollable User Selector Roster */}
                                      <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-[#F8FBFD] divide-y divide-slate-100">
                                        {(() => {
                                          const candidateUsers = usersList.filter((candidateUser) => {
                                            if (candidateUser.role === 'ROOT_ADMIN' || candidateUser.role === 'SUPER_ADMIN') return false;
                                            if (!authorizeUserSearch.trim()) return true;
                                            const queryNormalized = authorizeUserSearch.toLowerCase();
                                            return (
                                              candidateUser.fullName?.toLowerCase().includes(queryNormalized) ||
                                              candidateUser.email?.toLowerCase().includes(queryNormalized) ||
                                              candidateUser.designation?.toLowerCase().includes(queryNormalized)
                                            );
                                          });

                                          if (candidateUsers.length === 0) {
                                            return (
                                              <div className="p-4 text-center text-xs text-[#8094A8]">
                                                No eligible personnel found matching "{authorizeUserSearch}".
                                              </div>
                                            );
                                          }

                                          return candidateUsers.map((candidateUser) => {
                                            const isSelected = authorizeFormData.userId === candidateUser._id;
                                            return (
                                              <div
                                                key={candidateUser._id}
                                                onClick={() => setAuthorizeFormData({ ...authorizeFormData, userId: candidateUser._id })}
                                                className={`flex items-center justify-between p-2.5 text-xs transition cursor-pointer ${isSelected
                                                    ? 'bg-amber-50 border-l-4 border-amber-600'
                                                    : 'hover:bg-slate-100/60'
                                                  }`}
                                              >
                                                <div className="flex items-center gap-2.5 truncate">
                                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-[11px] font-bold text-[#102033]">
                                                    {candidateUser.fullName?.charAt(0).toUpperCase()}
                                                  </div>
                                                  <div className="truncate">
                                                    <p className="font-bold text-[#102033] truncate">{candidateUser.fullName}</p>
                                                    <p className="text-[10px] text-[#8094A8] font-mono truncate">{candidateUser.email}</p>
                                                  </div>
                                                </div>
                                                <div className="text-right shrink-0 ml-2">
                                                  <span className="text-[10px] text-[#526477] font-medium block">
                                                    {candidateUser.designation || 'Staff'}
                                                  </span>
                                                  <span className="text-[9px] font-mono text-amber-700 uppercase">
                                                    Current: {candidateUser.role}
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
                                      const selectedCandidateUser = usersList.find((userItem) => userItem._id === authorizeFormData.userId);
                                      if (!selectedCandidateUser) return null;
                                      return (
                                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-2.5 text-xs flex items-center justify-between">
                                          <div>
                                            <span className="text-[#4B7F3A] font-bold block">Selected Candidate:</span>
                                            <span className="text-[#102033] font-medium">{selectedCandidateUser.fullName} ({selectedCandidateUser.email})</span>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-[#526477] text-[10px] block">Title: {selectedCandidateUser.designation || 'Staff'}</span>
                                            <span className="text-[#4B7F3A] font-mono text-[10px] uppercase">Base: {selectedCandidateUser.baseRole || 'TEACHER'}</span>
                                          </div>
                                        </div>
                                      );
                                    })()}

                                    {/* Authority & Scope Selection */}
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-semibold text-[#102033]">Target Authority</label>
                                        <div className="mt-1 w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 font-mono flex items-center gap-2">
                                          <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                                          <span>SUPER_ADMIN (Level 90)</span>
                                        </div>
                                      </div>

                                      <div>
                                        <label className="block text-xs font-semibold text-[#102033]">Operational Scope *</label>
                                        <select
                                          value={authorizeFormData.scope}
                                          onChange={(selectChangeEvent) => setAuthorizeFormData({ ...authorizeFormData, scope: selectChangeEvent.target.value })}
                                          className="mt-1 w-full rounded-lg border border-slate-200 bg-[#F8FBFD] px-3 py-2 text-xs text-[#102033] focus:border-[#006AC7] focus:bg-white focus:outline-none"
                                        >
                                          <option value="GLOBAL">GLOBAL (Platform-wide Authority)</option>
                                          <option value="TOWN">TOWN (Town Administrative Scope)</option>
                                        </select>
                                      </div>
                                    </div>

                                    {/* Mandatory Justification Reason */}
                                    <div>
                                      <label className="block text-xs font-semibold text-[#102033]">Mandatory Justification Reason *</label>
                                      <textarea
                                        required
                                        rows={2}
                                        minLength={5}
                                        value={authorizeFormData.reason}
                                        onChange={(textareaChangeEvent) => setAuthorizeFormData({ ...authorizeFormData, reason: textareaChangeEvent.target.value })}
                                        placeholder="Provide explicit operational justification for granting Super Admin authority..."
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-[#F8FBFD] p-2.5 text-xs text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:bg-white focus:outline-none"
                                      />
                                    </div>

                                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                                      <button
                                        type="button"
                                        onClick={() => setIsAuthorizeModalOpen(false)}
                                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-[#526477] hover:bg-slate-50 cursor-pointer shadow-sm"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        disabled={isAuthorizingSubmitting || !authorizeFormData.userId}
                                        className="flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-700 px-5 py-2 text-xs font-semibold text-white transition shadow-sm cursor-pointer disabled:opacity-50"
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
                              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                                <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
                                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600">
                                      <AlertTriangle className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <h3 className="text-base font-bold text-[#102033]">Disable Super Administrator</h3>
                                      <p className="text-xs text-[#526477]">Revokes all active sessions immediately</p>
                                    </div>
                                  </div>

                                  <p className="text-xs text-[#526477] leading-relaxed">
                                    You are disabling <strong className="text-[#102033]">{selectedSuperAdminToDisable.fullName}</strong> ({selectedSuperAdminToDisable.email}). All active JWT tokens will be revoked via tokenVersion increment.
                                  </p>

                                  <form onSubmit={handleDisableSuperAdminSubmit} className="space-y-4">
                                    <div>
                                      <label className="block text-xs font-semibold text-[#102033]">Mandatory Justification Reason *</label>
                                      <textarea
                                        required
                                        rows={3}
                                        value={disableReasonText}
                                        onChange={(eventObject) => setDisableReasonText(eventObject.target.value)}
                                        placeholder="Enter explicit administrative or disciplinary reason..."
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-[#F8FBFD] p-2.5 text-xs text-[#102033] placeholder-slate-400 focus:border-red-500 focus:bg-white focus:outline-none"
                                      />
                                    </div>

                                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                                      <button
                                        type="button"
                                        onClick={() => setIsDisableModalOpen(false)}
                                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-[#526477] hover:bg-slate-50 cursor-pointer shadow-sm"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        disabled={isDisablingSubmitting}
                                        className="rounded-lg bg-red-600 hover:bg-red-700 px-5 py-2 text-xs font-semibold text-white transition shadow-sm cursor-pointer disabled:opacity-50"
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
                              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                                <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div className="flex items-center gap-2.5">
                                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-[#006AC7]">
                                        <Radio className="h-5 w-5" />
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-extrabold text-[#102033]">Issue District Broadcast</h3>
                                        <p className="text-xs text-[#526477]">Publish high-priority alert across all platform dashboards</p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setIsBroadcastModalOpen(false)}
                                      className="rounded-lg p-1.5 text-[#8094A8] hover:bg-slate-100 hover:text-[#102033] cursor-pointer"
                                    >
                                      <XCircle className="h-5 w-5" />
                                    </button>
                                  </div>

                                  <form onSubmit={handleBroadcastSubmit} className="space-y-4">
                                    <div>
                                      <label className="block text-xs font-semibold text-[#102033]">Broadcast Headline *</label>
                                      <input
                                        type="text"
                                        required
                                        value={broadcastFormData.title}
                                        onChange={(eventObject) => setBroadcastFormData({ ...broadcastFormData, title: eventObject.target.value })}
                                        placeholder="e.g. Extreme Weather Advisory: School Timings Adjusted"
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-[#F8FBFD] px-3 py-2 text-xs text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:bg-white focus:outline-none"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-xs font-semibold text-[#102033]">Severity Tier *</label>
                                      <select
                                        value={broadcastFormData.severity}
                                        onChange={(eventObject) => setBroadcastFormData({ ...broadcastFormData, severity: eventObject.target.value })}
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-[#F8FBFD] px-3 py-2 text-xs text-[#102033] focus:border-[#006AC7] focus:bg-white focus:outline-none"
                                      >
                                        <option value="INFO">Informational (Blue)</option>
                                        <option value="WARNING">Administrative Warning (Amber)</option>
                                        <option value="CRITICAL">Emergency / Critical Alert (Red)</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-xs font-semibold text-[#102033]">Official Directive Content *</label>
                                      <textarea
                                        required
                                        rows={4}
                                        value={broadcastFormData.message}
                                        onChange={(eventObject) => setBroadcastFormData({ ...broadcastFormData, message: eventObject.target.value })}
                                        placeholder="Detailed instruction or municipal circular text..."
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-[#F8FBFD] p-2.5 text-xs text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:bg-white focus:outline-none"
                                      />
                                    </div>

                                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                                      <button
                                        type="button"
                                        onClick={() => setIsBroadcastModalOpen(false)}
                                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-[#526477] hover:bg-slate-50 cursor-pointer shadow-sm"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        disabled={isBroadcastSubmitting}
                                        className="flex items-center gap-2 rounded-lg bg-[#006AC7] hover:bg-[#005299] px-5 py-2 text-xs font-semibold text-white transition shadow-sm cursor-pointer disabled:opacity-50"
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
                              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                                <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div className="flex items-center gap-2.5">
                                      <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600">
                                        <Unlock className="h-5 w-5" />
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-extrabold text-[#102033]">Flush Security Lockout Store</h3>
                                        <p className="text-xs text-[#526477]">Critical Infrastructure Operation • Administrative Purge</p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setIsFlushLockoutModalOpen(false)}
                                      className="rounded-lg p-1.5 text-[#8094A8] hover:bg-slate-100 hover:text-[#102033] cursor-pointer"
                                    >
                                      <XCircle className="h-5 w-5" />
                                    </button>
                                  </div>

                                  <div className="rounded-lg bg-red-50 border border-red-200 p-3.5 text-xs text-red-800 space-y-1 leading-relaxed">
                                    <p className="font-bold flex items-center gap-1.5 text-red-700">
                                      <AlertTriangle className="h-4 w-4 shrink-0" />
                                      High-Impact Security Warning
                                    </p>
                                    <p>
                                      Purging the security lockout store will immediately clear all active IP bans and reset failed authentication rate-limit strikes. All restricted IP addresses will regain access to platform endpoints immediately.
                                    </p>
                                  </div>

                                  <form onSubmit={handleFlushLockoutsSubmit} className="space-y-4">
                                    <div>
                                      <label className="block text-xs font-semibold text-[#102033]">
                                        Mandatory Justification Reason * <span className="text-[#8094A8] font-normal">(Recorded in immutable audit ledger)</span>
                                      </label>
                                      <textarea
                                        required
                                        rows={3}
                                        value={flushLockoutReason}
                                        onChange={(eventObject) => setFlushLockoutReason(eventObject.target.value)}
                                        placeholder="Enter explicit administrative or operational justification for purging IP lockouts..."
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-[#F8FBFD] p-2.5 text-xs text-[#102033] placeholder-slate-400 focus:border-red-500 focus:bg-white focus:outline-none"
                                      />
                                      <span className="text-[10px] text-[#8094A8]">Minimum 5 characters required.</span>
                                    </div>

                                    <div className="rounded-lg border border-slate-200 bg-[#F8FBFD] p-3">
                                      <label className="flex items-start gap-2.5 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          required
                                          checked={flushLockoutConfirmed}
                                          onChange={(eventObject) => setFlushLockoutConfirmed(eventObject.target.checked)}
                                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                                        />
                                        <span className="text-xs text-[#526477] select-none">
                                          I explicitly confirm and authorize the immediate purge of all security IP lockouts and rate-limiting strike records across the platform.
                                        </span>
                                      </label>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                                      <button
                                        type="button"
                                        onClick={() => setIsFlushLockoutModalOpen(false)}
                                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-[#526477] hover:bg-slate-50 cursor-pointer shadow-sm"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        disabled={isFlushingLockoutsSubmitting}
                                        className="flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 px-5 py-2 text-xs font-semibold text-white transition shadow-sm cursor-pointer disabled:opacity-50"
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
                              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                                <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                  {/* Header */}
                                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600">
                                        <ShieldAlert className="h-5 w-5" />
                                      </div>
                                      <div>
                                        <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                                          Emergency Outage Gate
                                          <span className="rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-mono text-red-700">
                                            ROOT OVERRIDE
                                          </span>
                                        </h3>
                                        <p className="text-xs text-[#526477]">
                                          Simulate unexpected cluster failure (HTTP 503) for non-root users.
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setIsKillSwitchModalOpen(false)}
                                      className="rounded-lg p-1 text-[#8094A8] hover:bg-slate-100 hover:text-[#102033] cursor-pointer"
                                    >
                                      <XCircle className="h-5 w-5" />
                                    </button>
                                  </div>

                                  <div className="p-6 space-y-5">
                                    {/* Live Status Badge */}
                                    <div
                                      className={`rounded-xl border p-4 flex items-center justify-between ${killSwitchStatus.isSuspended
                                          ? 'border-red-200 bg-red-50 text-red-800'
                                          : 'border-emerald-200 bg-emerald-50 text-[#4B7F3A]'
                                        }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="relative flex h-3.5 w-3.5">
                                          {killSwitchStatus.isSuspended && (
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                          )}
                                          <span
                                            className={`relative inline-flex rounded-full h-3.5 w-3.5 ${killSwitchStatus.isSuspended ? 'bg-red-500' : 'bg-[#4B7F3A]'
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
                                    <div className="rounded-xl border border-slate-200 bg-[#F8FBFD] p-3.5 text-xs text-[#526477] space-y-2">
                                      <div className="flex items-center gap-2 text-[#102033] font-semibold">
                                        <Lock className="h-3.5 w-3.5 text-amber-600" />
                                        <span>Stealth Operation Guarantee:</span>
                                      </div>
                                      <p className="leading-relaxed">
                                        Users will <strong>NOT</strong> be told the platform was shut down or suspended. They will see a standard technical error code (e.g. replica failure or connection timeout) so it appears as an unexpected hosting or database crash.
                                      </p>
                                      <p className="text-[#102033] font-medium">
                                        ⚡ Only your <strong>Root Admin</strong> session will continue working normally, and you can restore full platform operations with 1 click anytime.
                                      </p>
                                    </div>

                                    {/* Custom Simulated Error Message Input */}
                                    <div className="space-y-2">
                                      <label className="text-xs font-medium text-[#102033]">
                                        Simulated Technical Error Message (Returned in HTTP 503 Response):
                                      </label>
                                      <textarea
                                        rows={2}
                                        value={customOutageMessage}
                                        onChange={(textareaChangeEvent) => setCustomOutageMessage(textareaChangeEvent.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-[#F8FBFD] p-2.5 text-xs text-[#102033] placeholder-slate-400 focus:border-red-500 focus:bg-white focus:outline-none"
                                        placeholder="Enter technical database error message..."
                                      />
                                      <div className="flex flex-wrap gap-1.5 pt-1">
                                        <span className="text-[10px] text-[#8094A8] mr-1 self-center">Presets:</span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setCustomOutageMessage(
                                              'Database connection pool exhausted: Connection timed out to primary replica cluster (Error: 0x80040154_DB_CLUSTER_FAIL).'
                                            )
                                          }
                                          className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] text-[#526477] hover:bg-slate-200 cursor-pointer"
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
                                          className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] text-[#526477] hover:bg-slate-200 cursor-pointer"
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
                                          className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] text-[#526477] hover:bg-slate-200 cursor-pointer"
                                        >
                                          ECONNREFUSED
                                        </button>
                                      </div>
                                    </div>

                                    {/* Confirmation Checkbox for Activation */}
                                    {!killSwitchStatus.isSuspended && (
                                      <div className="rounded-lg border border-red-200 bg-red-50/70 p-3">
                                        <label className="flex items-start gap-2.5 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={killSwitchConfirmed}
                                            onChange={(checkboxChangeEvent) => setKillSwitchConfirmed(checkboxChangeEvent.target.checked)}
                                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                                          />
                                          <span className="text-xs text-[#526477] select-none">
                                            I confirm that I want to simulate an unexpected infrastructure outage and block all non-root user traffic.
                                          </span>
                                        </label>
                                      </div>
                                    )}

                                    {/* Modal Footer Actions */}
                                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                                      <button
                                        type="button"
                                        onClick={() => setIsKillSwitchModalOpen(false)}
                                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-[#526477] hover:bg-slate-50 cursor-pointer shadow-sm"
                                      >
                                        Close
                                      </button>

                                      {killSwitchStatus.isSuspended ? (
                                        <button
                                          type="button"
                                          disabled={isKillSwitchToggling}
                                          onClick={() => handleToggleKillSwitch(false)}
                                          className="flex items-center gap-2 rounded-lg bg-[#4B7F3A] hover:bg-[#38662D] px-5 py-2 text-xs font-semibold text-white transition shadow-sm cursor-pointer disabled:opacity-50"
                                        >
                                          <CheckCircle2 className="h-4 w-4" />
                                          <span>{isKillSwitchToggling ? 'Restoring Services...' : 'Restore Normal Operations'}</span>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          disabled={!killSwitchConfirmed || isKillSwitchToggling}
                                          onClick={() => handleToggleKillSwitch(true)}
                                          className="flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 px-5 py-2 text-xs font-semibold text-white transition shadow-sm cursor-pointer disabled:opacity-50"
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
