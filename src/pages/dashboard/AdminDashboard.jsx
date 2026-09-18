import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
  Building2,
  Users,
  GraduationCap,
  ClipboardCheck,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  ArrowRightLeft,
  Activity,
  Layers,
  School as SchoolIcon,
  Shield,
  Clock,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageContainer from '../../components/layout/PageContainer.jsx';
import AcademicManagementTab from './components/AcademicManagementTab.jsx';
import TeacherTransferTab from './components/TeacherTransferTab.jsx';
import ReportingHealthTab from './components/ReportingHealthTab.jsx';
import {
  fetchAdminOverview,
  fetchAdminSchoolsList,
  fetchAdminUsersList,
  updateUserLifecycleState,
} from '../../store/slices/adminSlice.js';

export const AdminDashboard = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const { user: authenticatedUser } = useSelector((state) => state.auth);
  const {
    overview,
    isOverviewLoading,
    users: personnelList,
    isUsersLoading,
    schools: schoolsList,
    isSchoolsLoading,
  } = useSelector((state) => state.admin);

  // Tab State
  const [activeTab, setActiveTab] = useState(() => {
    const currentPath = window.location.pathname;
    if (currentPath === '/schools') return 'schools';
    if (currentPath === '/users') return 'users';
    if (currentPath === '/transfers') return 'transfers';
    if (currentPath === '/attendance' || currentPath === '/exams') return 'academic';
    if (currentPath === '/documents') return 'reports';
    return 'overview';
  });

  // Filter & Search states
  const [personnelSearch, setPersonnelSearch] = useState('');
  const [personnelRoleFilter, setPersonnelRoleFilter] = useState('');

  // Initial Data Fetching
  const refreshTownData = useCallback(() => {
    dispatch(fetchAdminOverview());
    dispatch(fetchAdminSchoolsList());
    dispatch(fetchAdminUsersList({ limit: 50 }));
  }, [dispatch]);

  useEffect(() => {
    refreshTownData();
  }, [refreshTownData]);

  // Sync tab with URL
  useEffect(() => {
    const path = location.pathname;
    if (path === '/schools') setActiveTab('schools');
    else if (path === '/users') setActiveTab('users');
    else if (path === '/transfers') setActiveTab('transfers');
    else if (path === '/attendance' || path === '/exams') setActiveTab('academic');
    else if (path === '/documents') setActiveTab('reports');
  }, [location.pathname]);

  // Handle Search in Personnel
  const handleSearchPersonnel = (e) => {
    e.preventDefault();
    dispatch(fetchAdminUsersList({ search: personnelSearch, role: personnelRoleFilter || undefined, limit: 50 }));
  };

  // User Lifecycle Handler for Subordinate Staff (Teachers, HMs, Supervisors)
  const handleUpdateStatus = async (userId, newStatus) => {
    const reason = prompt(`Enter reason for updating staff lifecycle state to ${newStatus}:`);
    if (!reason || reason.trim().length < 3) {
      toast.error('A justification of at least 3 characters is required.');
      return;
    }
    const res = await dispatch(updateUserLifecycleState({ id: userId, status: newStatus, reason: reason.trim() }));
    if (updateUserLifecycleState.fulfilled.match(res)) {
      toast.success(`Staff status updated to ${newStatus}.`);
    } else {
      toast.error(res.payload || 'Failed to update staff status.');
    }
  };

  const townName = authenticatedUser?.townId?.name || 'Liaquatabad Town Centre';

  return (
    <PageContainer
      title="TOWN ADMIN COMMAND CENTER"
      subtitle={`Education Department ${townName} (DMC) • Municipal Jurisdiction (Level 80)`}
      actions={
        <div className="flex items-center gap-3">
          <button
            onClick={refreshTownData}
            disabled={isOverviewLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-slate-200 text-[#102033] hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isOverviewLoading ? 'animate-spin text-[#006AC7]' : ''}`} />
            Refresh Town Telemetry
          </button>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 border border-blue-200 text-[#006AC7] flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Town Scope: {authenticatedUser?.scope || 'TOWN'}
          </span>
        </div>
      }
    >
      {/* ─── Top KPI Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#526477] tracking-wider">Town Schools</span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#006AC7]">
              <SchoolIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#102033] mt-2">
            {isOverviewLoading ? '...' : (schoolsList.length || overview?.activeSchools || 0)}
          </p>
          <p className="text-[11px] text-[#526477] mt-0.5">Assigned Jurisdiction</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#526477] tracking-wider">Town Faculty</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-[#4B7F3A]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#102033] mt-2">
            {isOverviewLoading ? '...' : (overview?.roleDistribution?.teachers || 0)}
          </p>
          <p className="text-[11px] text-[#4B7F3A] mt-0.5">Active Teachers</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#526477] tracking-wider">Town Students</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#102033] mt-2">
            {isOverviewLoading ? '...' : (overview?.roleDistribution?.students || 0)}
          </p>
          <p className="text-[11px] text-indigo-600 mt-0.5">Municipal Enrollment</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#526477] tracking-wider">Attendance Rate</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#102033] mt-2">98.4%</p>
          <p className="text-[11px] text-amber-600 mt-0.5">Town Average</p>
        </div>
      </div>

      {/* ─── Navigation Tabs ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 border-b border-slate-200 text-xs font-bold">
        {[
          { id: 'overview', label: 'Town Overview', icon: Activity },
          { id: 'schools', label: 'Municipal Schools', icon: Building2 },
          { id: 'users', label: 'Faculty & Staff', icon: Users },
          { id: 'transfers', label: 'Teacher Transfers', icon: ArrowRightLeft },
          { id: 'academic', label: 'Academic Operations', icon: GraduationCap },
          { id: 'reports', label: 'Reports & Circulars', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#006AC7] text-white shadow-sm'
                  : 'bg-white text-[#526477] hover:bg-slate-100 hover:text-[#102033]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-200' : 'text-[#8094A8]'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: TOWN OVERVIEW ──────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#006AC7]" />
                Town Admin Governance Scope & Boundaries
              </h3>
              <p className="text-xs text-[#526477] leading-relaxed">
                As Town Administrator for <strong>{townName}</strong>, you manage operational academic institutions, teachers, and student rosters within your municipal boundaries.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs space-y-1">
                  <p className="font-bold text-[#006AC7]">Institutional Supervision</p>
                  <p className="text-blue-700 text-[11px]">
                    Direct municipal oversight over elementary and secondary schools, teachers, attendance registries, and local transfers.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100 text-xs space-y-1">
                  <p className="font-bold text-amber-900">Privilege Delegation Policy</p>
                  <p className="text-amber-700 text-[11px]">
                    Town Admins manage subordinate personnel (HMs, Supervisors, Teachers, Peons). Lateral creation or modification of other Admins is strictly prohibited by platform policy.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs space-y-1">
                  <p className="font-bold text-[#4B7F3A]">Identity Protection Enforcement</p>
                  <p className="text-emerald-700 text-[11px]">
                    Root Admin identity is protected and invisible from search and management listings to maintain platform security.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 text-xs space-y-1">
                  <p className="font-bold text-purple-900">Academic & Exam Oversight</p>
                  <p className="text-purple-700 text-[11px]">
                    Full access to syllabus monitoring, examination scheduling, and school performance telemetry within your town.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Navigation Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Town Operations
              </h3>
              <div className="space-y-2.5">
                <button
                  onClick={() => setActiveTab('schools')}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 transition-colors text-xs font-bold text-[#102033] flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#006AC7]" />
                    Inspect Municipal Schools
                  </span>
                  <span className="text-[10px] text-[#526477]">Town Registry</span>
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 transition-colors text-xs font-bold text-[#102033] flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600" />
                    Manage Town Faculty & Staff
                  </span>
                  <span className="text-[10px] text-[#526477]">Roster</span>
                </button>
                <button
                  onClick={() => setActiveTab('transfers')}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 transition-colors text-xs font-bold text-[#102033] flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-[#4B7F3A]" />
                    Review Teacher Transfers
                  </span>
                  <span className="text-[10px] text-[#526477]">Jurisdiction</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: MUNICIPAL SCHOOLS ──────────────────────────────────────── */}
      {activeTab === 'schools' && (
        <div className="space-y-6">
          <AcademicManagementTab schoolsList={schoolsList} />
        </div>
      )}

      {/* ─── TAB 3: FACULTY & STAFF ────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#102033] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#006AC7]" />
                  Town Faculty & Staff Directory
                </h3>
                <p className="text-xs text-[#526477]">
                  Manage teaching and non-teaching personnel assigned within {townName}.
                </p>
              </div>
            </div>

            {/* Filter Bar */}
            <form onSubmit={handleSearchPersonnel} className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search faculty by name, email, or designation..."
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
                <option value="">All Town Staff</option>
                <option value="HM">Head Master (HM)</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="TEACHER">Teacher</option>
                <option value="PEON">Support Staff</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#102033] text-xs font-bold transition-colors"
              >
                Search
              </button>
            </form>

            {/* Personnel Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[#526477] font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Civil Service Designation</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Assigned School</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Lifecycle Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isUsersLoading ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#006AC7]" />
                        Loading town faculty...
                      </td>
                    </tr>
                  ) : personnelList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        No faculty members matched your criteria.
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
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#006AC7]">
                            {usr.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#526477]">
                          {usr.schoolId?.name || 'Unassigned'}
                        </td>
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

      {/* ─── TAB 4: TEACHER TRANSFERS ──────────────────────────────────────── */}
      {activeTab === 'transfers' && (
        <div className="space-y-6">
          <TeacherTransferTab
            schoolsList={schoolsList}
            teachersList={personnelList.filter((u) => u.role === 'TEACHER')}
          />
        </div>
      )}

      {/* ─── TAB 5: ACADEMIC OPERATIONS ────────────────────────────────────── */}
      {activeTab === 'academic' && (
        <div className="space-y-6">
          <AcademicManagementTab schoolsList={schoolsList} />
        </div>
      )}

      {/* ─── TAB 6: REPORTS & CIRCULARS ────────────────────────────────────── */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <ReportingHealthTab />
        </div>
      )}
    </PageContainer>
  );
};

export default AdminDashboard;
