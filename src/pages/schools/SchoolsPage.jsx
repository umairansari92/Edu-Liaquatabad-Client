import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  School as SchoolIcon,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Users,
  GraduationCap,
  X,
  Filter,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageContainer from '../../components/layout/PageContainer.jsx';
import EditSchoolModal from '../dashboard/components/EditSchoolModal.jsx';
import SchoolTimingsModal from './components/SchoolTimingsModal.jsx';
import {
  fetchAdminSchoolsList,
  createSchoolEntity,
  selectAdminSchools,
  selectIsSchoolsLoading,
} from '../../store/slices/adminSlice.js';

/**
 * Municipal Schools Directory Page (2026 SaaS Standard)
 * Education Department Liaquatabad Town Centre (DMC)
 *
 * Implements strict RBAC action gating, responsive institutional layouts,
 * persistent teaching vs biometric gate windows disambiguation, and Redux data flow.
 */
export const SchoolsPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const rawSchoolsList = useSelector(selectAdminSchools);
  const isSchoolsLoading = useSelector(selectIsSchoolsLoading);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolTypeFilter, setSchoolTypeFilter] = useState('');
  const [schoolGenderFilter, setSchoolGenderFilter] = useState('');
  const [schoolStatusFilter, setSchoolStatusFilter] = useState('');

  // Register School Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerFormData, setRegisterFormData] = useState({
    name: '',
    schoolCode: '',
    emisCode: '',
    schoolType: 'SECONDARY',
    genderType: 'BOYS',
    lowestGrade: 6,
    highestGrade: 10,
    supportedMediums: ['URDU', 'ENGLISH'],
    address: '',
    contactPhone: '',
    contactEmail: '',
    timings: {
      regular: {
        startTime: '08:00',
        endTime: '13:30',
        attendanceWindowStart: '07:45',
        attendanceWindowEnd: '14:00',
      },
      friday: {
        startTime: '07:30',
        endTime: '12:00',
        attendanceWindowStart: '07:15',
        attendanceWindowEnd: '12:30',
      },
      allowHmLateOverride: true,
    },
  });

  // Edit School Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSchoolForEdit, setSelectedSchoolForEdit] = useState(null);

  // School Timings Modal State
  const [isTimingsModalOpen, setIsTimingsModalOpen] = useState(false);
  const [selectedSchoolForTimings, setSelectedSchoolForTimings] = useState(null);

  // Ensure schools array is always an array
  const schoolsList = useMemo(() => {
    return Array.isArray(rawSchoolsList) ? rawSchoolsList : [];
  }, [rawSchoolsList]);

  // Load municipal schools via Redux thunk
  const loadSchools = useCallback(() => {
    const queryParameters = {};
    if (schoolTypeFilter) queryParameters.schoolType = schoolTypeFilter;
    if (schoolGenderFilter) queryParameters.genderType = schoolGenderFilter;
    if (schoolStatusFilter) queryParameters.status = schoolStatusFilter;
    dispatch(fetchAdminSchoolsList(queryParameters));
  }, [dispatch, schoolTypeFilter, schoolGenderFilter, schoolStatusFilter]);

  useEffect(() => {
    loadSchools();
  }, [loadSchools]);

  // Role Permissions Checks
  const isAuthorizedToView = useMemo(() => {
    return user?.role && ['ROOT_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'HM', 'TEACHER'].includes(user.role);
  }, [user?.role]);

  const canRegisterSchool = useMemo(() => {
    return user?.role && ['ROOT_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(user.role);
  }, [user?.role]);

  const canEditSchool = useMemo(() => {
    return user?.role && ['ROOT_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(user.role);
  }, [user?.role]);

  const canConfigureTimings = useCallback(
    (targetSchool) => {
      if (!user?.role || !targetSchool) return false;
      if (['ROOT_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(user.role)) return true;
      if (user.role === 'HM') {
        const userSchoolId = user.schoolId?._id || user.schoolId;
        return Boolean(userSchoolId && String(userSchoolId) === String(targetSchool._id));
      }
      return false;
    },
    [user]
  );

  // Client-side and server-side combined filtering
  const filteredSchools = useMemo(() => {
    return schoolsList.filter((schoolRecord) => {
      if (searchQuery.trim()) {
        const normalizedQuery = searchQuery.trim().toLowerCase();
        const matchesName = schoolRecord.name?.toLowerCase().includes(normalizedQuery);
        const matchesCode = schoolRecord.schoolCode?.toLowerCase().includes(normalizedQuery);
        const matchesEmis = schoolRecord.emisCode?.toLowerCase().includes(normalizedQuery);
        const matchesAddress = schoolRecord.address?.toLowerCase().includes(normalizedQuery);
        const matchesHeadMaster = schoolRecord.headMaster?.toLowerCase().includes(normalizedQuery);
        if (!matchesName && !matchesCode && !matchesEmis && !matchesAddress && !matchesHeadMaster) {
          return false;
        }
      }

      if (schoolTypeFilter && schoolRecord.schoolType !== schoolTypeFilter) {
        return false;
      }

      if (schoolGenderFilter && schoolRecord.genderType !== schoolGenderFilter) {
        return false;
      }

      if (schoolStatusFilter && schoolRecord.status !== schoolStatusFilter) {
        return false;
      }

      return true;
    });
  }, [schoolsList, searchQuery, schoolTypeFilter, schoolGenderFilter, schoolStatusFilter]);

  // Quick summary statistics
  const directoryStats = useMemo(() => {
    const total = schoolsList.length;
    const active = schoolsList.filter((s) => s.status === 'ACTIVE').length;
    const totalTeachers = schoolsList.reduce((acc, s) => acc + (Number(s.facultyCount) || 0), 0);
    return { total, active, totalTeachers };
  }, [schoolsList]);

  // Handle Register School Submission via Redux
  const handleRegisterSchoolSubmit = async (submitEvent) => {
    submitEvent.preventDefault();
    if (!registerFormData.name.trim()) {
      toast.error('School name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: registerFormData.name.trim(),
        schoolCode: registerFormData.schoolCode.toUpperCase().trim() || undefined,
        emisCode: registerFormData.emisCode.trim() || undefined,
        schoolType: registerFormData.schoolType,
        genderType: registerFormData.genderType,
        lowestGrade: registerFormData.lowestGrade,
        highestGrade: registerFormData.highestGrade,
        supportedMediums:
          registerFormData.supportedMediums && registerFormData.supportedMediums.length > 0
            ? registerFormData.supportedMediums
            : ['URDU', 'ENGLISH'],
        address: registerFormData.address.trim(),
        contactPhone: registerFormData.contactPhone.trim(),
        contactEmail: registerFormData.contactEmail.trim().toLowerCase(),
        timings: registerFormData.timings,
      };

      const resultAction = await dispatch(createSchoolEntity(payload));
      if (createSchoolEntity.fulfilled.match(resultAction)) {
        toast.success(`School "${registerFormData.name}" registered successfully.`);
        setIsRegisterModalOpen(false);
        setRegisterFormData({
          name: '',
          schoolCode: '',
          emisCode: '',
          schoolType: 'SECONDARY',
          genderType: 'BOYS',
          lowestGrade: 6,
          highestGrade: 10,
          supportedMediums: ['URDU', 'ENGLISH'],
          address: '',
          contactPhone: '',
          contactEmail: '',
          timings: {
            regular: {
              startTime: '08:00',
              endTime: '13:30',
              attendanceWindowStart: '07:45',
              attendanceWindowEnd: '14:00',
            },
            friday: {
              startTime: '07:30',
              endTime: '12:00',
              attendanceWindowStart: '07:15',
              attendanceWindowEnd: '12:30',
            },
            allowHmLateOverride: true,
          },
        });
      } else {
        toast.error(resultAction.payload || 'Failed to register municipal school.');
      }
    } catch (registrationError) {
      console.error('Registration failed:', registrationError);
      toast.error('An unexpected error occurred during school registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSchoolTypeFilter('');
    setSchoolGenderFilter('');
    setSchoolStatusFilter('');
  };

  const hasActiveFilters = Boolean(searchQuery || schoolTypeFilter || schoolGenderFilter || schoolStatusFilter);

  // ── Access Denied Guard ───────────────────────────────────────────────────
  if (!isAuthorizedToView) {
    return (
      <PageContainer
        title="Schools Directory"
        subtitle="Town Municipal Corporation (TMC) • Education Department Liaquatabad Town"
      >
        <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-white p-12 text-center shadow-sm max-w-lg mx-auto mt-8">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4 shadow-xs">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[#102033]">403 — Unauthorized Resource</h3>
          <p className="mt-2 text-xs text-[#526477] leading-relaxed">
            Your authenticated role (<span className="font-mono font-semibold text-[#006AC7] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{user?.role || 'GUEST'}</span>) does not possess authority to browse the central Schools Directory.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#006AC7] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00529B] transition"
          >
            <span>Return to Authorized Dashboard</span>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Schools Directory"
      subtitle="Official institutional directory, academic grade ranges, operational timings, and administrative oversight"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSchools}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-bold text-[#526477] hover:text-[#102033] hover:bg-slate-50 shadow-xs transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSchoolsLoading ? 'animate-spin text-[#006AC7]' : ''}`} />
            <span>Refresh</span>
          </button>

          {canRegisterSchool && (
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#006AC7] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00529B] transition"
            >
              <Plus className="h-4 w-4" />
              <span>Register School</span>
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {/* Institutional Summary KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8094A8]">Total Institutions</p>
              <p className="text-xl font-black text-[#102033] mt-0.5">{directoryStats.total}</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-2.5 text-[#006AC7] border border-blue-100">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8094A8]">Active Status</p>
              <p className="text-xl font-black text-emerald-700 mt-0.5">{directoryStats.active}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8094A8]">Active Faculty</p>
              <p className="text-xl font-black text-[#006AC7] mt-0.5">{directoryStats.totalTeachers} Staff</p>
            </div>
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 border border-indigo-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
          <div className="flex flex-1 flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(inputChangeEvent) => setSearchQuery(inputChangeEvent.target.value)}
                placeholder="Search school name, code, SEMIS, HM, address..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-8 text-xs font-medium text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={schoolTypeFilter}
              onChange={(selectChangeEvent) => setSchoolTypeFilter(selectChangeEvent.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-bold text-[#526477] focus:border-[#006AC7] focus:bg-white focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="ECE">ECE (Nursery - KG-2)</option>
              <option value="PRIMARY">Primary (KG-1 - 5th)</option>
              <option value="ELEMENTARY">Elementary (KG-1 - 8th)</option>
              <option value="SECONDARY">Secondary (6th - 10th)</option>
            </select>

            <select
              value={schoolGenderFilter}
              onChange={(selectChangeEvent) => setSchoolGenderFilter(selectChangeEvent.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-bold text-[#526477] focus:border-[#006AC7] focus:bg-white focus:outline-none"
            >
              <option value="">All Orientations</option>
              <option value="BOYS">Boys</option>
              <option value="GIRLS">Girls</option>
              <option value="CO_EDUCATION">Co-Education</option>
            </select>

            <select
              value={schoolStatusFilter}
              onChange={(selectChangeEvent) => setSchoolStatusFilter(selectChangeEvent.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-bold text-[#526477] focus:border-[#006AC7] focus:bg-white focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-200 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="text-xs text-[#526477] font-medium text-right self-center shrink-0">
            Showing <span className="font-bold text-[#102033]">{filteredSchools.length}</span> of {schoolsList.length} institutions
          </div>
        </div>

        {/* Schools Directory Presentation */}
        {isSchoolsLoading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-16 text-[#526477] shadow-xs">
            <RefreshCw className="h-8 w-8 animate-spin text-[#006AC7] mb-3" />
            <p className="text-sm font-semibold text-[#102033]">Streaming municipal school directory...</p>
            <p className="text-xs text-[#8094A8] mt-1">Connecting to authoritative Liaquatabad Town institutional records</p>
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-14 text-center text-[#526477] shadow-xs">
            <Building2 className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-[#102033]">No Municipal Schools Found</h3>
            <p className="mt-1 max-w-sm text-xs text-[#526477]">
              {hasActiveFilters
                ? 'No institutions match the current search or filter criteria. Try resetting filters to display all schools.'
                : 'No schools are currently registered in the municipal database.'}
            </p>
            <div className="mt-4 flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#102033] hover:bg-slate-50 transition shadow-xs"
                >
                  Clear Active Filters
                </button>
              )}
              {canRegisterSchool && !hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#006AC7] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00529B] transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Register First Municipal School</span>
                </button>
              )}
            </div>
          </div>
        ) : filteredSchools.length === 1 ? (
          /* ── Balanced Single-School Layout ── */
          <div className="w-full">
            {filteredSchools.map((school) => {
              const hasTimingsAccess = canConfigureTimings(school);
              const hasEditAccess = canEditSchool;

              return (
                <div
                  key={school._id}
                  className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden"
                >
                  {/* Single School Header Ribbon */}
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-200/80 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-block rounded-full bg-blue-100/80 px-2.5 py-0.5 text-[10px] font-bold text-[#006AC7] border border-blue-200">
                          {school.schoolType || 'SECONDARY'} • {school.genderType || 'CO_EDUCATION'}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${school.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                        >
                          {school.status || 'ACTIVE'}
                        </span>
                        {school.gradeRange?.lowestGrade && school.gradeRange?.highestGrade && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                            Class {school.gradeRange.lowestGrade} to Class {school.gradeRange.highestGrade}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-[#102033] break-words leading-tight">
                        {school.name}
                      </h3>
                      <p className="text-xs text-[#526477] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{school.address || 'Address not listed on record'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {hasTimingsAccess && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSchoolForTimings(school);
                            setIsTimingsModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-[#006AC7] hover:bg-blue-100 transition shadow-xs"
                          title="Configure Operational Timings & Windows"
                        >
                          <Clock className="h-4 w-4" />
                          <span>Timings &amp; Gates</span>
                        </button>
                      )}

                      {hasEditAccess && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSchoolForEdit(school);
                            setIsEditModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#526477] hover:text-[#102033] hover:bg-slate-50 transition shadow-xs"
                          title="Edit School Registration Details"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span>Edit Details</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Single School Body Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 p-5 sm:p-6 gap-6">
                    {/* Column 1: Institutional Identifiers & Medium */}
                    <div className="space-y-3.5 pr-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8094A8]">
                        <Building2 className="w-4 h-4 text-[#006AC7]" />
                        <span>Registry Identifiers</span>
                      </div>
                      <div className="space-y-2 text-xs text-[#526477]">
                        <div className="flex items-center justify-between">
                          <span>School Code:</span>
                          <span className="font-mono font-bold text-[#102033] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {school.schoolCode || '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>SEMIS / EMIS Code:</span>
                          <span className="font-mono font-bold text-[#006AC7] bg-blue-50/70 px-2 py-0.5 rounded border border-blue-100">
                            {school.emisCode || '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Instructional Medium:</span>
                          <span className="font-semibold text-[#102033]">
                            {school.supportedMediums?.join(', ') || 'Urdu, English'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Town Jurisdiction:</span>
                          <span className="font-semibold text-slate-700">Liaquatabad Town Centre</span>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Leadership & Faculty */}
                    <div className="space-y-3.5 md:px-4 pt-4 md:pt-0">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8094A8]">
                        <Users className="w-4 h-4 text-[#4B7F3A]" />
                        <span>Leadership &amp; Faculty</span>
                      </div>
                      <div className="space-y-2 text-xs text-[#526477]">
                        <div className="flex items-center justify-between">
                          <span>Head Master:</span>
                          <span className="font-bold text-[#102033] text-right truncate max-w-[180px]">
                            {school.headMaster || 'Vacant / Not Appointed'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Active Faculty:</span>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {school.facultyCount !== undefined ? `${school.facultyCount} Teachers` : 'Active'}
                          </span>
                        </div>
                        {school.contactPhone && (
                          <div className="flex items-center justify-between">
                            <span>School Contact:</span>
                            <span className="font-mono text-[#526477]">{school.contactPhone}</span>
                          </div>
                        )}
                        {school.contactEmail && (
                          <div className="flex items-center justify-between">
                            <span>Official Email:</span>
                            <span className="text-[#006AC7] truncate max-w-[180px]">{school.contactEmail}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column 3: Operational Timings & Gate Windows */}
                    <div className="space-y-3.5 md:pl-4 pt-4 md:pt-0">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8094A8]">
                        <Clock className="w-4 h-4 text-[#006AC7]" />
                        <span>Timings &amp; Biometric Windows</span>
                      </div>
                      <div className="space-y-2.5 text-xs">
                        {/* Monday - Thursday, Saturday */}
                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                            <span>Teaching Hours (Mon–Sat):</span>
                            <span className="font-mono text-emerald-700 font-bold">
                              {school.timings?.regular?.startTime || '08:00'} – {school.timings?.regular?.endTime || '13:30'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-[#526477]">
                            <span>Biometric Gate Window:</span>
                            <span className="font-mono text-[#006AC7] font-semibold">
                              {school.timings?.regular?.attendanceWindowStart || '07:45'} – {school.timings?.regular?.attendanceWindowEnd || '14:00'}
                            </span>
                          </div>
                        </div>

                        {/* Friday */}
                        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-2.5 space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                            <span>Friday Schedule:</span>
                            <span className="font-mono text-emerald-700 font-bold">
                              {school.timings?.friday?.startTime || '07:30'} – {school.timings?.friday?.endTime || '12:00'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-[#526477]">
                            <span>Friday Gate Window:</span>
                            <span className="font-mono text-[#006AC7] font-semibold">
                              {school.timings?.friday?.attendanceWindowStart || '07:15'} – {school.timings?.friday?.attendanceWindowEnd || '12:30'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Multi-School Responsive Grid Layout ── */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredSchools.map((school) => {
              const hasTimingsAccess = canConfigureTimings(school);
              const hasEditAccess = canEditSchool;

              return (
                <div
                  key={school._id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-[#006AC7]/40 hover:shadow-md transition-all"
                >
                  <div className="space-y-3.5">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#006AC7] border border-blue-100">
                            {school.schoolType || 'SECONDARY'} • {school.genderType || 'CO_ED'}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${school.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                          >
                            {school.status || 'ACTIVE'}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-[#102033] group-hover:text-[#006AC7] transition break-words leading-snug">
                          {school.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {hasTimingsAccess && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSchoolForTimings(school);
                              setIsTimingsModalOpen(true);
                            }}
                            className="rounded-xl p-2 text-[#006AC7] hover:bg-blue-50 border border-transparent hover:border-blue-200 transition"
                            title="Configure Operational Timings & Windows"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                        )}

                        {hasEditAccess && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSchoolForEdit(school);
                              setIsEditModalOpen(true);
                            }}
                            className="rounded-xl p-2 text-slate-400 hover:text-[#102033] hover:bg-slate-100 border border-transparent hover:border-slate-200 transition"
                            title="Edit School Details"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Metadata & Persistent Enriched Values */}
                    <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-[#526477]">
                      <div className="flex items-center justify-between">
                        <span>School Code:</span>
                        <span className="font-mono font-bold text-[#102033]">{school.schoolCode || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>SEMIS / EMIS:</span>
                        <span className="font-mono font-bold text-[#006AC7]">{school.emisCode || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Head Master:</span>
                        <span className="font-bold text-[#102033] truncate max-w-[160px]">
                          {school.headMaster || 'Vacant / Not Appointed'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Teaching Faculty:</span>
                        <span className="font-semibold text-emerald-700">
                          {school.facultyCount !== undefined ? `${school.facultyCount} Teachers` : 'Active'}
                        </span>
                      </div>
                      {school.gradeRange?.lowestGrade && school.gradeRange?.highestGrade && (
                        <div className="flex items-center justify-between">
                          <span>Grade Range:</span>
                          <span className="font-medium text-slate-700">
                            Class {school.gradeRange.lowestGrade}–{school.gradeRange.highestGrade}
                          </span>
                        </div>
                      )}

                      {/* Timings Disambiguation Box */}
                      <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-2.5 space-y-1.5 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                            <Clock className="h-3 w-3 text-[#4B7F3A]" />
                            Teaching (Mon–Sat):
                          </span>
                          <span className="font-mono text-[11px] text-[#4B7F3A] font-bold">
                            {school.timings?.regular?.startTime || '08:00'} – {school.timings?.regular?.endTime || '13:30'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[11px] text-[#526477]">
                            <ShieldCheck className="h-3 w-3 text-[#006AC7]" />
                            Gate (Attendance):
                          </span>
                          <span className="font-mono text-[11px] text-[#006AC7] font-semibold">
                            {school.timings?.regular?.attendanceWindowStart || '07:45'} – {school.timings?.regular?.attendanceWindowEnd || '14:00'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-200/60 pt-1 text-[11px] text-[#526477]">
                          <span>Friday Hours:</span>
                          <span className="font-mono text-slate-700 font-semibold">
                            {school.timings?.friday?.startTime || '07:30'} – {school.timings?.friday?.endTime || '12:00'}
                          </span>
                        </div>
                      </div>

                      {school.contactPhone && (
                        <div className="flex items-center gap-2 text-[#526477]">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{school.contactPhone}</span>
                        </div>
                      )}

                      {school.address && (
                        <div className="flex items-start gap-2 text-[#526477]">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{school.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]">
                    <span className="text-[#8094A8] font-medium">Liaquatabad Town</span>
                    <span className="font-semibold text-[#006AC7] hover:underline cursor-pointer" title="Town Jurisdiction">
                      Education Dept
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Modal: Register School ───────────────────────────────────────── */}
        {isRegisterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-blue-50 p-2 text-[#006AC7] border border-blue-200">
                    <SchoolIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#102033]">Register School</h3>
                    <p className="text-xs text-[#526477]">Add institutional record to Liaquatabad Town registry</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRegisterSchoolSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#526477]">School Name *</label>
                  <input
                    type="text"
                    required
                    value={registerFormData.name}
                    onChange={(inputChangeEvent) =>
                      setRegisterFormData({ ...registerFormData, name: inputChangeEvent.target.value })
                    }
                    placeholder="e.g. Government Boys Secondary School Liaquatabad No. 4"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#526477]">School Code *</label>
                    <input
                      type="text"
                      required
                      value={registerFormData.schoolCode}
                      onChange={(inputChangeEvent) =>
                        setRegisterFormData({ ...registerFormData, schoolCode: inputChangeEvent.target.value })
                      }
                      placeholder="e.g. LQT-SEC-004"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#102033] uppercase focus:border-[#006AC7] focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#526477]">SEMIS / EMIS Code</label>
                    <input
                      type="text"
                      value={registerFormData.emisCode}
                      onChange={(inputChangeEvent) =>
                        setRegisterFormData({ ...registerFormData, emisCode: inputChangeEvent.target.value })
                      }
                      placeholder="e.g. 408010104"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#102033] focus:border-[#006AC7] focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#526477]">Category *</label>
                    <select
                      value={registerFormData.schoolType}
                      onChange={(selectChangeEvent) => {
                        const newType = selectChangeEvent.target.value;
                        let newLowest = 1;
                        let newHighest = 5;
                        if (newType === 'ECE') {
                          newLowest = 1;
                          newHighest = 2;
                        } else if (newType === 'PRIMARY') {
                          newLowest = 1;
                          newHighest = 5;
                        } else if (newType === 'ELEMENTARY') {
                          newLowest = 1;
                          newHighest = 8;
                        } else if (newType === 'SECONDARY') {
                          newLowest = 6;
                          newHighest = 10;
                        }
                        setRegisterFormData({
                          ...registerFormData,
                          schoolType: newType,
                          lowestGrade: newLowest,
                          highestGrade: newHighest,
                        });
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#102033] focus:border-[#006AC7] focus:outline-none"
                    >
                      <option value="ECE">Early Childhood Education (ECE: Nursery - KG-2)</option>
                      <option value="PRIMARY">Primary (1st - 5th)</option>
                      <option value="ELEMENTARY">Elementary (1st - 8th)</option>
                      <option value="SECONDARY">Secondary (6th - 10th)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#526477]">Orientation *</label>
                    <select
                      value={registerFormData.genderType}
                      onChange={(selectChangeEvent) =>
                        setRegisterFormData({ ...registerFormData, genderType: selectChangeEvent.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#102033] focus:border-[#006AC7] focus:outline-none"
                    >
                      <option value="BOYS">Boys</option>
                      <option value="GIRLS">Girls</option>
                      <option value="CO_EDUCATION">Co-Education</option>
                    </select>
                  </div>
                </div>

                {/* Grade Range Provisioning Matrix */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#006AC7]">
                      Grade Range Provisioning
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#006AC7]">
                      Class {registerFormData.lowestGrade} to Class {registerFormData.highestGrade}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-slate-500">Starting Grade</span>
                      <select
                        value={registerFormData.lowestGrade}
                        onChange={(selectChangeEvent) =>
                          setRegisterFormData({ ...registerFormData, lowestGrade: Number(selectChangeEvent.target.value) })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-[#102033]"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((gradeNumber) => (
                          <option key={gradeNumber} value={gradeNumber}>
                            Class {gradeNumber}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Ending Grade</span>
                      <select
                        value={registerFormData.highestGrade}
                        onChange={(selectChangeEvent) =>
                          setRegisterFormData({ ...registerFormData, highestGrade: Number(selectChangeEvent.target.value) })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-[#102033]"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((gradeNumber) => (
                          <option key={gradeNumber} value={gradeNumber}>
                            Class {gradeNumber}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#526477]">Address *</label>
                  <input
                    type="text"
                    required
                    value={registerFormData.address}
                    onChange={(inputChangeEvent) =>
                      setRegisterFormData({ ...registerFormData, address: inputChangeEvent.target.value })
                    }
                    placeholder="e.g. Sector 4, Block C, Liaquatabad, Karachi"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#526477]">Contact Phone</label>
                    <input
                      type="text"
                      value={registerFormData.contactPhone}
                      onChange={(inputChangeEvent) =>
                        setRegisterFormData({ ...registerFormData, contactPhone: inputChangeEvent.target.value })
                      }
                      placeholder="e.g. 021-39999999"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#102033] focus:border-[#006AC7] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#526477]">Contact Email</label>
                    <input
                      type="email"
                      value={registerFormData.contactEmail}
                      onChange={(inputChangeEvent) =>
                        setRegisterFormData({ ...registerFormData, contactEmail: inputChangeEvent.target.value })
                      }
                      placeholder="e.g. school@dmc.gov.pk"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#102033] focus:border-[#006AC7] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Initial Timings Setup */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#006AC7]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Initial Timings &amp; Gate Windows (PKT)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500">Regular Bell:</span>
                      <p className="font-mono font-semibold text-slate-800">08:00 – 13:30</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Biometric Window:</span>
                      <p className="font-mono font-semibold text-[#006AC7]">07:45 – 14:00</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(false)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-[#526477] hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 rounded-xl bg-[#006AC7] px-4 py-2 text-xs font-bold text-white hover:bg-[#00529B] disabled:opacity-50 shadow-xs transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{isSubmitting ? 'Registering...' : 'Confirm Registration'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Edit School Details ────────────────────────────────────── */}
        <EditSchoolModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          school={selectedSchoolForEdit}
          onSchoolUpdated={loadSchools}
        />

        {/* ── Modal: School Timings & Attendance Windows ─────────────────────── */}
        <SchoolTimingsModal
          isOpen={isTimingsModalOpen}
          onClose={() => setIsTimingsModalOpen(false)}
          school={selectedSchoolForTimings}
          onTimingsUpdated={loadSchools}
        />
      </div>
    </PageContainer>
  );
};

export default SchoolsPage;
