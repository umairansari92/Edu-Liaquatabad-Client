import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Users,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  Briefcase,
  GraduationCap,
  Users2,
  ListFilter,
  CheckSquare,
  Square,
  Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient.js';
import PageContainer from '../../components/layout/PageContainer.jsx';

// Common & Modular Components
import UserAuthorityModal from '../../components/common/UserAuthorityModal.jsx';
import AssignSchoolModal from './components/AssignSchoolModal.jsx';
import TransferEmployeeModal from './components/TransferEmployeeModal.jsx';
import EmployeeProfileDrawer from './components/EmployeeProfileDrawer.jsx';
import UserAuditHistoryModal from './components/UserAuditHistoryModal.jsx';
import CategoryKpiCards from './components/CategoryKpiCards.jsx';

// Tables
import EmployeesTable from './components/EmployeesTable.jsx';
import StudentsTable from './components/StudentsTable.jsx';
import ParentsTable from './components/ParentsTable.jsx';
import AllAccountsTable from './components/AllAccountsTable.jsx';

export const UsersPage = () => {
  const { user: authenticatedUser } = useSelector((state) => state.auth);

  // Active Category Tab
  const [activeCategory, setActiveCategory] = useState('EMPLOYEES'); // 'EMPLOYEES' | 'STUDENTS' | 'PARENTS' | 'ALL'

  // Data & Pagination
  const [usersList, setUsersList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Live Summary Counts from Backend
  const [summaryCounts, setSummaryCounts] = useState({
    totalAccounts: 0,
    totalEmployees: 0,
    totalTeachers: 0,
    totalHMs: 0,
    totalAdminStaff: 0,
    totalStudents: 0,
    totalParents: 0,
  });

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [schoolsList, setSchoolsList] = useState([]);

  // Bulk Selection (Employees Tab)
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isBulkOperating, setIsBulkOperating] = useState(false);

  // Modals & Drawers State
  const [selectedUserForAuthority, setSelectedUserForAuthority] = useState(null);
  const [isAuthorityModalOpen, setIsAuthorityModalOpen] = useState(false);

  const [selectedEmployeeForAssignment, setSelectedEmployeeForAssignment] = useState(null);
  const [isAssignSchoolModalOpen, setIsAssignSchoolModalOpen] = useState(false);

  const [selectedEmployeeForTransfer, setSelectedEmployeeForTransfer] = useState(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const [selectedUserForProfile, setSelectedUserForProfile] = useState(null);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  const [selectedUserForAudit, setSelectedUserForAudit] = useState(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Action processing indicator
  const [actionProcessingUserId, setActionProcessingUserId] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page and selection when category changes
  const handleTabChange = (newCategory) => {
    setActiveCategory(newCategory);
    setPage(1);
    setRoleFilter('');
    setStatusFilter('');
    setSchoolFilter('');
    setSearchQuery('');
    setSelectedUserIds([]);
  };

  // Fetch Auxiliary Municipal Schools List
  useEffect(() => {
    const loadSchools = async () => {
      try {
        const response = await apiClient.get('/schools');
        if (response.data?.success) {
          setSchoolsList(response.data.data?.schools || response.data.data || []);
        }
      } catch (errorObject) {
        console.error('Failed to load schools list:', errorObject);
      }
    };
    loadSchools();
  }, []);

  // Fetch Live Summary Counts
  const fetchSummaryCounts = useCallback(async () => {
    try {
      const response = await apiClient.get('/users/summary-counts');
      if (response.data?.success) {
        setSummaryCounts(response.data.data);
      }
    } catch (errorObject) {
      console.error('Failed to load user summary counts:', errorObject);
    }
  }, []);

  useEffect(() => {
    fetchSummaryCounts();
  }, [fetchSummaryCounts]);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (activeCategory !== 'ALL') {
        // Singular backend category: EMPLOYEE, STUDENT, PARENT
        const backendCat =
          activeCategory === 'EMPLOYEES'
            ? 'EMPLOYEE'
            : activeCategory === 'STUDENTS'
            ? 'STUDENT'
            : 'PARENT';
        queryParams.append('category', backendCat);
      }

      if (roleFilter) queryParams.append('role', roleFilter);
      if (statusFilter) queryParams.append('status', statusFilter);
      if (schoolFilter) queryParams.append('schoolId', schoolFilter);
      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      queryParams.append('page', String(page));
      queryParams.append('limit', '50');

      const response = await apiClient.get(`/users?${queryParams.toString()}`);
      if (response.data?.success) {
        setUsersList(response.data.data?.users || []);
        setTotalCount(response.data.data?.total || response.data.data?.users?.length || 0);
        setTotalPages(response.data.data?.totalPages || 1);
      }
    } catch (personnelFetchError) {
      console.error('Failed to load personnel:', personnelFetchError);
      toast.error(personnelFetchError.response?.data?.message || 'Unable to retrieve personnel directory.');
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, roleFilter, statusFilter, schoolFilter, debouncedSearch, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Refresh both list and counts
  const handleFullRefresh = () => {
    fetchUsers();
    fetchSummaryCounts();
  };

  // Bulk Selection Handlers
  const isUserBulkEligible = (targetUser) =>
    targetUser.role !== 'ROOT_ADMIN' && String(targetUser._id) !== String(authenticatedUser?._id);

  const handleToggleSelectUser = (userRecord) => {
    if (!isUserBulkEligible(userRecord)) {
      toast.error('Privileged Root Admin accounts and self-modifications are exempt from bulk actions.');
      return;
    }
    setSelectedUserIds((prev) =>
      prev.includes(userRecord._id)
        ? prev.filter((selectedId) => selectedId !== userRecord._id)
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
    const sanitizedUserIds = selectedUserIds.filter((selectedId) => {
      const matched = usersList.find((userItem) => String(userItem._id) === String(selectedId));
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
        handleFullRefresh();
      }
    } catch (bulkUserActionError) {
      toast.error(bulkUserActionError.response?.data?.message || `Failed to execute bulk ${actionType}.`);
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
        handleFullRefresh();
      }
    } catch (lifecycleTransitionError) {
      toast.error(lifecycleTransitionError.response?.data?.message || 'Status transition failed.');
    } finally {
      setActionProcessingUserId(null);
    }
  };

  // Check if caller can see All Accounts view
  const canViewAllAccounts = ['ROOT_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(
    authenticatedUser?.role
  );

  // Dynamic Headings & Subtitles based on active tab
  const getTabHeaders = () => {
    switch (activeCategory) {
      case 'EMPLOYEES':
        return {
          title: 'Employee Directory',
          subtitle:
            'Education Department Liaquatabad Town Centre (DMC) — Staff roster, civil service designations, and authority governance',
        };
      case 'STUDENTS':
        return {
          title: 'Student Directory',
          subtitle:
            'Enrolled students, academic placement, class/section records, and parent linkages',
        };
      case 'PARENTS':
        return {
          title: 'Parent Directory',
          subtitle:
            'Verified parents and legal guardians with institutional child linkages',
        };
      case 'ALL':
      default:
        return {
          title: 'Global Account Directory',
          subtitle:
            'Complete multi-role system inventory and administrative governance ledger',
        };
    }
  };

  const { title, subtitle } = getTabHeaders();

  return (
    <PageContainer
      title={title}
      subtitle={subtitle}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFullRefresh}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-bold text-[#526477] hover:text-[#102033] hover:bg-slate-50 shadow-xs transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Category Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 pt-2 rounded-t-2xl shadow-xs">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* EMPLOYEES TAB */}
            <button
              type="button"
              onClick={() => handleTabChange('EMPLOYEES')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition ${
                activeCategory === 'EMPLOYEES'
                  ? 'border-[#006AC7] text-[#006AC7]'
                  : 'border-transparent text-[#526477] hover:text-[#102033] hover:border-slate-300'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Employees</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  activeCategory === 'EMPLOYEES'
                    ? 'bg-blue-100/70 text-[#006AC7]'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {summaryCounts.totalEmployees}
              </span>
            </button>

            {/* STUDENTS TAB */}
            <button
              type="button"
              onClick={() => handleTabChange('STUDENTS')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition ${
                activeCategory === 'STUDENTS'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-[#526477] hover:text-[#102033] hover:border-slate-300'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Students</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  activeCategory === 'STUDENTS'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {summaryCounts.totalStudents}
              </span>
            </button>

            {/* PARENTS TAB */}
            <button
              type="button"
              onClick={() => handleTabChange('PARENTS')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition ${
                activeCategory === 'PARENTS'
                  ? 'border-[#4B7F3A] text-[#4B7F3A]'
                  : 'border-transparent text-[#526477] hover:text-[#102033] hover:border-slate-300'
              }`}
            >
              <Users2 className="w-4 h-4" />
              <span>Parents</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  activeCategory === 'PARENTS'
                    ? 'bg-emerald-100 text-[#4B7F3A]'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {summaryCounts.totalParents}
              </span>
            </button>

            {/* ALL ACCOUNTS TAB (Privileged View) */}
            {canViewAllAccounts && (
              <button
                type="button"
                onClick={() => handleTabChange('ALL')}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition ${
                  activeCategory === 'ALL'
                    ? 'border-slate-800 text-[#102033]'
                    : 'border-transparent text-[#526477] hover:text-[#102033] hover:border-slate-300'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>All Accounts</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    activeCategory === 'ALL'
                      ? 'bg-slate-200 text-[#102033]'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {summaryCounts.totalAccounts}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Live Category Summary KPI Cards */}
        <CategoryKpiCards
          activeCategory={activeCategory}
          summaryCounts={summaryCounts}
        />

        {/* Search & Multi-Criteria Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(changeEvent) => setSearchQuery(changeEvent.target.value)}
                placeholder={
                  activeCategory === 'EMPLOYEES'
                    ? 'Search employee name, email, or designation...'
                    : activeCategory === 'STUDENTS'
                    ? 'Search student name, B-Form, or roll no...'
                    : activeCategory === 'PARENTS'
                    ? 'Search parent name, phone, or email...'
                    : 'Search across all accounts...'
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs font-medium text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
              />
            </div>

            {/* Role Filter (Contextual) */}
            {activeCategory === 'EMPLOYEES' && (
              <select
                value={roleFilter}
                onChange={(changeEvent) => setRoleFilter(changeEvent.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-[#526477] focus:border-[#006AC7] focus:bg-white focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value="TEACHER">Teacher</option>
                <option value="HM">Head Master</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ADMIN">Admin / DDO</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="PEON">Peon / Staff</option>
              </select>
            )}

            {activeCategory === 'ALL' && (
              <select
                value={roleFilter}
                onChange={(changeEvent) => setRoleFilter(changeEvent.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-[#526477] focus:border-[#006AC7] focus:bg-white focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value="TEACHER">Teacher</option>
                <option value="HM">Head Master</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="STUDENT">Student</option>
                <option value="PARENT">Parent</option>
                <option value="PEON">Peon</option>
              </select>
            )}

            {/* School Filter */}
            <select
              value={schoolFilter}
              onChange={(changeEvent) => setSchoolFilter(changeEvent.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-[#526477] focus:border-[#006AC7] focus:bg-white focus:outline-none max-w-[200px]"
            >
              <option value="">All Schools</option>
              {schoolsList.map((schoolItem) => (
                <option key={schoolItem._id} value={schoolItem._id}>
                  {schoolItem.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(changeEvent) => setStatusFilter(changeEvent.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-[#526477] focus:border-[#006AC7] focus:bg-white focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div className="text-xs text-[#526477] font-medium text-right flex-shrink-0">
            Records Shown: <span className="font-bold text-[#102033]">{totalCount}</span>
          </div>
        </div>

        {/* Bulk Actions Command Strip (Employees Tab Only) */}
        {activeCategory === 'EMPLOYEES' && selectedUserIds.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-[#102033] shadow-xs">
            <span className="font-bold text-[#006AC7]">
              {selectedUserIds.length} employee{selectedUserIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleExecuteBulkAction('APPROVE')}
                disabled={isBulkOperating}
                className="flex items-center gap-1 rounded-xl bg-[#4B7F3A] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#3D692F] disabled:opacity-50 transition shadow-xs"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Bulk Approve</span>
              </button>
              <button
                type="button"
                onClick={() => handleExecuteBulkAction('SUSPEND')}
                disabled={isBulkOperating}
                className="flex items-center gap-1 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition shadow-xs"
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

        {/* Category Table Render */}
        {activeCategory === 'EMPLOYEES' && (
          <EmployeesTable
            usersList={usersList}
            isLoading={isLoading}
            selectedUserIds={selectedUserIds}
            onToggleSelect={handleToggleSelectUser}
            onSelectAll={handleSelectAllOnPage}
            authenticatedUser={authenticatedUser}
            actionProcessingUserId={actionProcessingUserId}
            onProcessLifecycle={handleProcessUserLifecycle}
            onOpenAuthorityModal={(emp) => {
              setSelectedUserForAuthority(emp);
              setIsAuthorityModalOpen(true);
            }}
            onOpenAssignSchoolModal={(emp) => {
              setSelectedEmployeeForAssignment(emp);
              setIsAssignSchoolModalOpen(true);
            }}
            onOpenTransferModal={(emp) => {
              setSelectedEmployeeForTransfer(emp);
              setIsTransferModalOpen(true);
            }}
            onOpenProfileDrawer={(emp) => {
              setSelectedUserForProfile(emp);
              setIsProfileDrawerOpen(true);
            }}
            onOpenAuditModal={(emp) => {
              setSelectedUserForAudit(emp);
              setIsAuditModalOpen(true);
            }}
          />
        )}

        {activeCategory === 'STUDENTS' && (
          <StudentsTable
            studentsList={usersList}
            isLoading={isLoading}
            actionProcessingUserId={actionProcessingUserId}
            onProcessLifecycle={handleProcessUserLifecycle}
            onOpenProfileDrawer={(stu) => {
              setSelectedUserForProfile(stu);
              setIsProfileDrawerOpen(true);
            }}
          />
        )}

        {activeCategory === 'PARENTS' && (
          <ParentsTable
            parentsList={usersList}
            isLoading={isLoading}
            actionProcessingUserId={actionProcessingUserId}
            onProcessLifecycle={handleProcessUserLifecycle}
            onOpenProfileDrawer={(par) => {
              setSelectedUserForProfile(par);
              setIsProfileDrawerOpen(true);
            }}
          />
        )}

        {activeCategory === 'ALL' && (
          <AllAccountsTable
            accountsList={usersList}
            isLoading={isLoading}
            authenticatedUser={authenticatedUser}
            actionProcessingUserId={actionProcessingUserId}
            onProcessLifecycle={handleProcessUserLifecycle}
            onOpenAuthorityModal={(acc) => {
              setSelectedUserForAuthority(acc);
              setIsAuthorityModalOpen(true);
            }}
            onOpenProfileDrawer={(acc) => {
              setSelectedUserForProfile(acc);
              setIsProfileDrawerOpen(true);
            }}
          />
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200/80 pt-4 text-xs text-[#526477]">
            <div>
              Page <span className="font-bold text-[#102033]">{page}</span> of{' '}
              <span className="font-bold text-[#102033]">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((currentPageNumber) => Math.max(currentPageNumber - 1, 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((currentPageNumber) => Math.min(currentPageNumber + 1, totalPages))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Modal: Assign School */}
        <AssignSchoolModal
          isOpen={isAssignSchoolModalOpen}
          onClose={() => {
            setIsAssignSchoolModalOpen(false);
            setSelectedEmployeeForAssignment(null);
          }}
          targetEmployee={selectedEmployeeForAssignment}
          schoolsList={schoolsList}
          onAssigned={handleFullRefresh}
        />

        {/* Modal: Transfer Employee */}
        <TransferEmployeeModal
          isOpen={isTransferModalOpen}
          onClose={() => {
            setIsTransferModalOpen(false);
            setSelectedEmployeeForTransfer(null);
          }}
          targetEmployee={selectedEmployeeForTransfer}
          schoolsList={schoolsList}
          currentUser={authenticatedUser}
          onTransferInitiated={handleFullRefresh}
        />

        {/* Drawer: Detailed Employee Profile */}
        <EmployeeProfileDrawer
          isOpen={isProfileDrawerOpen}
          onClose={() => {
            setIsProfileDrawerOpen(false);
            setSelectedUserForProfile(null);
          }}
          employee={selectedUserForProfile}
          onAssignSchool={(emp) => {
            setSelectedEmployeeForAssignment(emp);
            setIsAssignSchoolModalOpen(true);
          }}
          onTransfer={(emp) => {
            setSelectedEmployeeForTransfer(emp);
            setIsTransferModalOpen(true);
          }}
          onManageAuthority={(emp) => {
            setSelectedUserForAuthority(emp);
            setIsAuthorityModalOpen(true);
          }}
          onViewAudit={(emp) => {
            setSelectedUserForAudit(emp);
            setIsAuditModalOpen(true);
          }}
        />

        {/* Modal: User Audit History */}
        <UserAuditHistoryModal
          isOpen={isAuditModalOpen}
          onClose={() => {
            setIsAuditModalOpen(false);
            setSelectedUserForAudit(null);
          }}
          targetUser={selectedUserForAudit}
        />

        {/* Modal: User Authority & Designation Management */}
        <UserAuthorityModal
          isOpen={isAuthorityModalOpen}
          onClose={() => {
            setIsAuthorityModalOpen(false);
            setSelectedUserForAuthority(null);
          }}
          targetUser={selectedUserForAuthority}
          currentUser={authenticatedUser}
          onAuthorityUpdated={handleFullRefresh}
        />
      </div>
    </PageContainer>
  );
};

export default UsersPage;
