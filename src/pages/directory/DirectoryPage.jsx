import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  Heart,
  Search,
  Download,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  CalendarDays,
  IdCard,
  Hash,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldAlert,
  ArrowRightLeft,
  UserX,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  UserCheck,
  RotateCcw,
} from 'lucide-react';
import apiClient from '../../services/apiClient.js';
import PageContainer from '../../components/layout/PageContainer.jsx';
import toast from 'react-hot-toast';

// ── Formatters & Badges ──────────────────────────────────────────────────────

const formatDisplayDate = (dateValue) => {
  if (!dateValue) return '—';
  try {
    return new Date(dateValue).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateValue);
  }
};

const renderRoleBadge = (userRole) => {
  const roleColorStyles = {
    ROOT_ADMIN:  'bg-purple-50 border-purple-200 text-purple-700',
    SUPER_ADMIN: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    ADMIN:       'bg-blue-50 border-blue-200 text-[#006AC7]',
    SUPERVISOR:  'bg-teal-50 border-teal-200 text-teal-700',
    HM:          'bg-emerald-50 border-emerald-200 text-[#4B7F3A]',
    TEACHER:     'bg-cyan-50 border-cyan-200 text-cyan-700',
    PEON:        'bg-slate-100 border-slate-200 text-slate-700',
    STUDENT:     'bg-sky-50 border-sky-200 text-sky-700',
    PARENT:      'bg-rose-50 border-rose-200 text-rose-700',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono tracking-wide ${
        roleColorStyles[userRole] || 'bg-slate-100 border-slate-200 text-slate-700'
      }`}
    >
      {userRole}
    </span>
  );
};

const renderStatusBadge = (entityStatus) => {
  const statusConfig = {
    ACTIVE:              { label: 'Active',         icon: CheckCircle2, color: 'text-[#4B7F3A] bg-emerald-50 border-emerald-200' },
    ENROLLED:            { label: 'Enrolled',       icon: CheckCircle2, color: 'text-[#4B7F3A] bg-emerald-50 border-emerald-200' },
    PENDING_APPROVAL:    { label: 'Pending',        icon: Clock,        color: 'text-amber-700 bg-amber-50 border-amber-200' },
    REQUIRES_CORRECTION: { label: 'Needs Fix',      icon: AlertCircle,  color: 'text-orange-700 bg-orange-50 border-orange-200' },
    SUSPENDED:           { label: 'Suspended',      icon: ShieldAlert,  color: 'text-rose-700 bg-rose-50 border-rose-200' },
    TRANSFERRED:         { label: 'Transferred',    icon: ArrowRightLeft,color: 'text-[#006AC7] bg-blue-50 border-blue-200' },
    GRADUATED:           { label: 'Graduated',      icon: GraduationCap,color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
    WITHDRAWN:           { label: 'Withdrawn',      icon: UserX,        color: 'text-slate-600 bg-slate-100 border-slate-200' },
    DROPPED_OUT:         { label: 'Dropped Out',    icon: UserX,        color: 'text-slate-600 bg-slate-100 border-slate-200' },
    STRUCK_OFF:          { label: 'Struck Off',     icon: UserX,        color: 'text-rose-700 bg-rose-50 border-rose-200' },
    INACTIVE:            { label: 'Inactive',       icon: UserX,        color: 'text-slate-600 bg-slate-100 border-slate-200' },
    RETIRED:             { label: 'Retired',        icon: CheckCircle2, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  };
  const resolvedKey = entityStatus ? String(entityStatus).toUpperCase() : 'UNKNOWN';
  const config = statusConfig[resolvedKey] || {
    label: entityStatus || 'Unknown',
    icon: AlertCircle,
    color: 'text-slate-600 bg-slate-100 border-slate-200',
  };
  const StatusIconComponent = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${config.color}`}>
      <StatusIconComponent className="h-3 w-3" />
      {config.label}
    </span>
  );
};

const TableCell = ({ children, className = '' }) => (
  <td className={`px-4 py-3.5 align-middle ${className}`}>{children}</td>
);

const LoadingSkeletonRow = ({ columnsCount, message = 'Loading records from municipal directory...' }) => (
  <tr>
    <td colSpan={columnsCount} className="py-12 text-center text-[#526477]">
      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#006AC7]" />
      <span className="text-xs font-medium">{message}</span>
    </td>
  </tr>
);

const EmptyStateRow = ({ columnsCount, title = 'No matching records found.', description = 'Try clearing or adjusting search filters.' }) => (
  <tr>
    <td colSpan={columnsCount} className="py-12 text-center text-[#526477]">
      <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
      <p className="text-xs font-bold text-[#102033]">{title}</p>
      <p className="text-[11px] text-[#8094A8] mt-0.5">{description}</p>
    </td>
  </tr>
);

const downloadCsvFile = async (endpointUrl, targetFilename, queryParameters, setExportingState) => {
  setExportingState(true);
  try {
    const queryString = new URLSearchParams(queryParameters).toString();
    const fullRequestUrl = `${endpointUrl}${queryString ? '?' + queryString : ''}`;
    const apiResponse = await apiClient.get(fullRequestUrl, { responseType: 'blob' });
    const fileBlob = new Blob([apiResponse.data], { type: 'text/csv;charset=utf-8;' });
    const downloadAnchorElement = document.createElement('a');
    downloadAnchorElement.href = URL.createObjectURL(fileBlob);
    downloadAnchorElement.download = targetFilename;
    document.body.appendChild(downloadAnchorElement);
    downloadAnchorElement.click();
    downloadAnchorElement.removeChild(downloadAnchorElement);
    URL.revokeObjectURL(downloadAnchorElement.href);
    toast.success(`${targetFilename} downloaded successfully.`);
  } catch (downloadError) {
    const errorMessage = downloadError.response?.data?.message || 'Export failed. Please verify administrative permissions.';
    toast.error(errorMessage);
  } finally {
    setExportingState(false);
  }
};

// ── Search & Filter Controls ─────────────────────────────────────────────────

const SearchInputField = ({ value, onChange, placeholderText, focusBorderColorClass }) => (
  <div className="relative flex-1 min-w-[200px] max-w-sm">
    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholderText}
      className={`w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-8 text-xs font-medium text-[#102033] placeholder-slate-400 focus:bg-white focus:outline-none ${focusBorderColorClass}`}
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
        title="Clear search"
      >
        <X className="h-3 w-3" />
      </button>
    )}
  </div>
);

const FilterDropdownSelect = ({ value, onChange, focusBorderColorClass, children, label }) => (
  <select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    aria-label={label}
    className={`rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-bold text-[#526477] focus:bg-white focus:outline-none cursor-pointer ${focusBorderColorClass}`}
  >
    {children}
  </select>
);

const DirectoryFilterToolbar = ({
  children,
  totalRecordsCount,
  entityLabelSingular,
  onRefreshTriggered,
  isLoadingData,
  onExportTriggered,
  isExportingData,
  hasActiveFilters,
  onResetFilters,
}) => (
  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
    <div className="flex flex-wrap items-center gap-2 flex-1">
      {children}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          title="Reset all filters"
        >
          <RotateCcw className="h-3 w-3 text-slate-400" />
          <span>Reset</span>
        </button>
      )}
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-xs text-[#526477] font-medium whitespace-nowrap">
        <span className="text-[#102033] font-bold">{totalRecordsCount}</span> {entityLabelSingular}
      </span>
      <button
        type="button"
        onClick={onRefreshTriggered}
        disabled={isLoadingData}
        className="rounded-xl border border-slate-200 bg-white p-2 text-[#526477] hover:text-[#102033] hover:bg-slate-50 shadow-sm transition cursor-pointer disabled:opacity-50"
        title="Refresh Records"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isLoadingData ? 'animate-spin text-[#006AC7]' : ''}`} />
      </button>
      <button
        type="button"
        onClick={onExportTriggered}
        disabled={isExportingData}
        className="flex items-center gap-1.5 rounded-xl bg-[#006AC7] hover:bg-[#00529B] disabled:opacity-50 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition cursor-pointer"
      >
        <Download className="h-3.5 w-3.5" />
        {isExportingData ? 'Exporting...' : 'Export CSV'}
      </button>
    </div>
  </div>
);

// ── Student Record Details Modal ─────────────────────────────────────────────

const StudentRecordDetailsModal = ({ studentRecord, onClose }) => {
  if (!studentRecord) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-record-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs transition-opacity"
      onClick={(clickEvent) => {
        if (clickEvent.target === clickEvent.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2.5 bg-blue-50 text-[#006AC7] border border-blue-200/70">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 id="student-record-title" className="text-base font-bold text-slate-900 leading-snug">
                {studentRecord.studentName}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {studentRecord.globalStudentId || `GR-${studentRecord.grNumber}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">General Register No</span>
            <span className="font-mono font-bold text-amber-700 text-sm mt-0.5 block">
              #{studentRecord.grNumber || '—'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Enrollment Status</span>
            <div className="mt-1">
              {renderStatusBadge(studentRecord.lifecycleStatus)}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Class &amp; Section</span>
            <span className="font-semibold text-slate-900 mt-0.5 block">
              {studentRecord.className || '—'} {studentRecord.sectionName ? `/ ${studentRecord.sectionName}` : ''}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Gender</span>
            <span className="font-semibold text-slate-900 mt-0.5 block">
              {studentRecord.gender || '—'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Father / Guardian</span>
            <span className="font-semibold text-slate-900 mt-0.5 block">
              {studentRecord.guardianName || '—'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Guardian Contact</span>
            <span className="font-mono text-slate-800 mt-0.5 block">
              {studentRecord.guardianContact || '—'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Admission Date</span>
            <span className="font-medium text-slate-800 mt-0.5 block">
              {formatDisplayDate(studentRecord.admissionDate)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Admission Type</span>
            <span className="font-mono text-slate-700 mt-0.5 block">
              {studentRecord.admissionType || 'REGULAR'}
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

// ── View 1: Student Records (Authoritative School Student Roster) ────────────

const StudentRecordsView = ({ municipalSchoolsList, initialSearch = '', authenticatedUser }) => {
  const isHM = authenticatedUser?.role === 'HM';
  const userSchoolId = authenticatedUser?.schoolId?._id || authenticatedUser?.schoolId || '';

  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ totalRecords: 0, page: 1, limit: 20, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedSchoolId, setSelectedSchoolId] = useState(isHM ? String(userSchoolId) : '');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Academic Dropdown Data
  const [classesList, setClassesList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);

  // Inspection Modal State
  const [viewingStudent, setViewingStudent] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load classes for the active school
  useEffect(() => {
    const effectiveSchoolId = isHM ? String(userSchoolId) : selectedSchoolId;
    const fetchClasses = async () => {
      try {
        const queryParams = effectiveSchoolId ? `?schoolId=${effectiveSchoolId}` : '';
        const response = await apiClient.get(`/academic/classes${queryParams}`);
        if (response.data?.success) {
          setClassesList(response.data.data?.classes || []);
        }
      } catch {
        setClassesList([]);
      }
    };
    fetchClasses();
  }, [isHM, userSchoolId, selectedSchoolId]);

  // Load sections when class changes
  useEffect(() => {
    if (!selectedClassId) {
      setSectionsList([]);
      setSelectedSectionId('');
      return;
    }
    const fetchSections = async () => {
      try {
        const response = await apiClient.get(`/academic/sections?classId=${selectedClassId}`);
        if (response.data?.success) {
          setSectionsList(response.data.data?.sections || []);
        }
      } catch {
        setSectionsList([]);
      }
    };
    fetchSections();
  }, [selectedClassId]);

  // Authoritative API Call: GET /students/school
  const fetchStudentRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParameters = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
      });

      if (debouncedSearch.trim()) queryParameters.append('search', debouncedSearch.trim());
      if (selectedClassId) queryParameters.append('classId', selectedClassId);
      if (selectedSectionId) queryParameters.append('sectionId', selectedSectionId);
      if (selectedGender) queryParameters.append('gender', selectedGender);
      if (selectedStatus) queryParameters.append('lifecycleStatus', selectedStatus);

      // Only pass schoolId if not HM (server strictly scopes HM to their own school)
      if (!isHM && selectedSchoolId) {
        queryParameters.append('schoolId', selectedSchoolId);
      }

      const response = await apiClient.get(`/students/school?${queryParameters.toString()}`);
      if (response.data?.success) {
        setStudents(response.data.data?.students || []);
        setPagination(
          response.data.data?.pagination || {
            totalRecords: response.data.data?.students?.length || 0,
            page: currentPage,
            limit: 20,
            totalPages: 1,
          }
        );
      }
    } catch (fetchError) {
      console.error('Failed to load student records:', fetchError);
      toast.error(fetchError.response?.data?.message || 'Failed to retrieve student records.');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedClassId, selectedSectionId, selectedGender, selectedStatus, currentPage, isHM, selectedSchoolId]);

  useEffect(() => {
    fetchStudentRecords();
  }, [fetchStudentRecords]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedClassId('');
    setSelectedSectionId('');
    setSelectedGender('');
    setSelectedStatus('');
    if (!isHM) setSelectedSchoolId('');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedClassId ||
    selectedSectionId ||
    selectedGender ||
    selectedStatus ||
    (!isHM && selectedSchoolId)
  );

  const handleExportStudentsCsv = () => {
    const exportParameters = {};
    if (debouncedSearch.trim()) exportParameters.search = debouncedSearch.trim();
    if (selectedClassId) exportParameters.classId = selectedClassId;
    if (selectedSectionId) exportParameters.sectionId = selectedSectionId;
    if (selectedStatus) exportParameters.status = selectedStatus;
    if (!isHM && selectedSchoolId) exportParameters.schoolId = selectedSchoolId;

    downloadCsvFile(
      '/exports/students.csv',
      `student_records_${formatDisplayDate(new Date())}.csv`,
      exportParameters,
      setIsExporting
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Toolbar */}
      <DirectoryFilterToolbar
        totalRecordsCount={pagination.totalRecords}
        entityLabelSingular="students"
        onRefreshTriggered={fetchStudentRecords}
        isLoadingData={isLoading}
        onExportTriggered={handleExportStudentsCsv}
        isExportingData={isExporting}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      >
        <SearchInputField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholderText="Search by student name, GR No, or Global ID..."
          focusBorderColorClass="focus:border-[#006AC7]"
        />

        {!isHM && (
          <FilterDropdownSelect
            value={selectedSchoolId}
            onChange={(val) => {
              setSelectedSchoolId(val);
              setCurrentPage(1);
            }}
            focusBorderColorClass="focus:border-[#006AC7]"
            label="School filter"
          >
            <option value="">All Schools</option>
            {municipalSchoolsList.map((schoolItem) => (
              <option key={schoolItem._id} value={schoolItem._id}>
                {schoolItem.name}
              </option>
            ))}
          </FilterDropdownSelect>
        )}

        <FilterDropdownSelect
          value={selectedClassId}
          onChange={(val) => {
            setSelectedClassId(val);
            setSelectedSectionId('');
            setCurrentPage(1);
          }}
          focusBorderColorClass="focus:border-[#006AC7]"
          label="Class filter"
        >
          <option value="">All Classes</option>
          {classesList.map((classItem) => (
            <option key={classItem._id} value={classItem._id}>
              {classItem.name}
            </option>
          ))}
        </FilterDropdownSelect>

        {selectedClassId && sectionsList.length > 0 && (
          <FilterDropdownSelect
            value={selectedSectionId}
            onChange={(val) => {
              setSelectedSectionId(val);
              setCurrentPage(1);
            }}
            focusBorderColorClass="focus:border-[#006AC7]"
            label="Section filter"
          >
            <option value="">All Sections</option>
            {sectionsList.map((sectionItem) => (
              <option key={sectionItem._id} value={sectionItem._id}>
                Section {sectionItem.name}
              </option>
            ))}
          </FilterDropdownSelect>
        )}

        <FilterDropdownSelect
          value={selectedGender}
          onChange={(val) => {
            setSelectedGender(val);
            setCurrentPage(1);
          }}
          focusBorderColorClass="focus:border-[#006AC7]"
          label="Gender filter"
        >
          <option value="">All Genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </FilterDropdownSelect>

        <FilterDropdownSelect
          value={selectedStatus}
          onChange={(val) => {
            setSelectedStatus(val);
            setCurrentPage(1);
          }}
          focusBorderColorClass="focus:border-[#006AC7]"
          label="Status filter"
        >
          <option value="">All Statuses</option>
          <option value="ENROLLED">Enrolled</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="STRUCK_OFF">Struck Off</option>
          <option value="TRANSFERRED">Transferred</option>
          <option value="GRADUATED">Graduated</option>
          <option value="WITHDRAWN">Withdrawn</option>
        </FilterDropdownSelect>
      </DirectoryFilterToolbar>

      {/* Student Records Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#526477]">
            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-[#526477]">
              <tr>
                <th className="px-4 py-3.5">Student Name</th>
                <th className="px-4 py-3.5">GR No</th>
                <th className="px-4 py-3.5">Class / Section</th>
                <th className="px-4 py-3.5">Gender</th>
                <th className="px-4 py-3.5">Guardian</th>
                <th className="px-4 py-3.5">Admission</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <LoadingSkeletonRow columnsCount={8} message="Loading official student records from municipal register..." />
              ) : students.length === 0 ? (
                <EmptyStateRow
                  columnsCount={8}
                  title={hasActiveFilters ? 'No matching student records found.' : 'No students registered in this school roster yet.'}
                  description={hasActiveFilters ? 'Try adjusting your search query or clearing active dropdown filters.' : 'Newly enrolled students will appear here.'}
                />
              ) : (
                students.map((studentRecord) => (
                  <tr key={studentRecord._id} className="hover:bg-blue-50/40 transition">
                    <TableCell>
                      <div className="font-bold text-[#102033] text-xs">
                        {studentRecord.studentName}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] font-semibold text-[#006AC7] bg-blue-50 border border-blue-200/70 px-1.5 py-0.2 rounded">
                          {studentRecord.globalStudentId || `GR-${studentRecord.grNumber}`}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="inline-flex items-center gap-1 font-mono text-amber-700 font-bold bg-amber-50/70 border border-amber-200/70 px-2 py-0.5 rounded-lg text-xs">
                        <Hash className="h-3 w-3 text-amber-600" />
                        {studentRecord.grNumber ?? '—'}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 text-[#102033] font-medium">
                        <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{studentRecord.className || '—'}</span>
                        {studentRecord.sectionName && studentRecord.sectionName !== '—' && (
                          <span className="text-[#526477] font-semibold ml-0.5">/ {studentRecord.sectionName}</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span
                        className={`font-bold text-[11px] ${
                          studentRecord.gender === 'MALE'
                            ? 'text-[#006AC7]'
                            : studentRecord.gender === 'FEMALE'
                            ? 'text-pink-600'
                            : 'text-[#526477]'
                        }`}
                      >
                        {studentRecord.gender || '—'}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="truncate max-w-[140px] text-[#102033] font-medium">
                        {studentRecord.guardianName || '—'}
                      </div>
                      {studentRecord.guardianContact && studentRecord.guardianContact !== '—' && (
                        <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#526477] font-mono">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {studentRecord.guardianContact}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 text-[#526477]">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDisplayDate(studentRecord.admissionDate)}</span>
                      </div>
                      {studentRecord.admissionType && (
                        <div className="text-[10px] text-[#8094A8] font-mono mt-0.5 uppercase">
                          {studentRecord.admissionType}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>{renderStatusBadge(studentRecord.lifecycleStatus)}</TableCell>

                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={() => setViewingStudent(studentRecord)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[#006AC7] hover:bg-blue-50 hover:border-blue-200 transition text-[11px] font-bold cursor-pointer"
                        title="View Student Record Particulars"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </button>
                    </TableCell>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/50">
            <div>
              Showing <span className="font-bold text-slate-900">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-bold text-slate-900">
                {Math.min(pagination.page * pagination.limit, pagination.totalRecords)}
              </span>{' '}
              of <span className="font-bold text-slate-900">{pagination.totalRecords}</span> student records
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={pagination.page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>
              <span className="font-bold text-slate-700 px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Details Inspection Modal */}
      <StudentRecordDetailsModal
        studentRecord={viewingStudent}
        onClose={() => setViewingStudent(null)}
      />
    </div>
  );
};

// ── View 2: Staff Directory (All Teaching and Non-Teaching School Personnel) ──

const StaffDirectoryView = ({ municipalSchoolsList, initialSearch = '', authenticatedUser }) => {
  const isHM = authenticatedUser?.role === 'HM';
  const userSchoolId = authenticatedUser?.schoolId?._id || authenticatedUser?.schoolId || '';

  const [staffRecords, setStaffRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(initialSearch);
  const [selectedSchoolId, setSelectedSchoolId] = useState(isHM ? String(userSchoolId) : '');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchStaffData = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParameters = new URLSearchParams({ limit: '200' });
      if (debouncedSearchQuery.trim()) queryParameters.append('search', debouncedSearchQuery.trim());
      const effectiveSchoolId = isHM ? String(userSchoolId) : selectedSchoolId;
      if (effectiveSchoolId) queryParameters.append('schoolId', effectiveSchoolId);
      if (selectedRole) queryParameters.append('role', selectedRole);
      if (selectedStatus) queryParameters.append('status', selectedStatus);

      // Request employee category users
      queryParameters.append('category', 'EMPLOYEE');

      const response = await apiClient.get(`/users?${queryParameters.toString()}`);
      if (response.data?.success) {
        const filteredStaffList = (response.data.data?.users || []).filter(
          (userAccount) => !['STUDENT', 'PARENT'].includes(userAccount.baseRole)
        );
        setStaffRecords(filteredStaffList);
        setTotalCount(filteredStaffList.length);
      }
    } catch (fetchError) {
      console.error('Failed to load staff records:', fetchError);
      toast.error('Failed to retrieve staff directory records.');
      setStaffRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, selectedSchoolId, selectedRole, selectedStatus, isHM, userSchoolId]);

  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedRole('');
    setSelectedStatus('');
    if (!isHM) setSelectedSchoolId('');
  };

  const hasActiveFilters = Boolean(searchQuery || selectedRole || selectedStatus || (!isHM && selectedSchoolId));

  const handleExportStaffCsv = () => {
    const exportParameters = {};
    if (debouncedSearchQuery.trim()) exportParameters.search = debouncedSearchQuery.trim();
    const effectiveSchoolId = isHM ? String(userSchoolId) : selectedSchoolId;
    if (effectiveSchoolId) exportParameters.schoolId = effectiveSchoolId;
    if (selectedRole) exportParameters.role = selectedRole;
    if (selectedStatus) exportParameters.status = selectedStatus;

    downloadCsvFile(
      '/exports/staff.csv',
      `staff_directory_${formatDisplayDate(new Date())}.csv`,
      exportParameters,
      setIsExporting
    );
  };

  return (
    <div className="space-y-4">
      <DirectoryFilterToolbar
        totalRecordsCount={totalCount}
        entityLabelSingular="staff members"
        onRefreshTriggered={fetchStaffData}
        isLoadingData={isLoading}
        onExportTriggered={handleExportStaffCsv}
        isExportingData={isExporting}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      >
        <SearchInputField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholderText="Search staff by name or email..."
          focusBorderColorClass="focus:border-[#006AC7]"
        />

        {!isHM && (
          <FilterDropdownSelect
            value={selectedSchoolId}
            onChange={setSelectedSchoolId}
            focusBorderColorClass="focus:border-[#006AC7]"
            label="School filter"
          >
            <option value="">All Schools</option>
            {municipalSchoolsList.map((schoolItem) => (
              <option key={schoolItem._id} value={schoolItem._id}>
                {schoolItem.name}
              </option>
            ))}
          </FilterDropdownSelect>
        )}

        <FilterDropdownSelect
          value={selectedRole}
          onChange={setSelectedRole}
          focusBorderColorClass="focus:border-[#006AC7]"
          label="Role filter"
        >
          <option value="">All Roles</option>
          <option value="TEACHER">Teacher</option>
          <option value="PEON">Junior Clerk / Peon</option>
          <option value="HM">Head Master</option>
          <option value="SUPERVISOR">Supervisor</option>
          <option value="ADMIN">Town Administrator</option>
        </FilterDropdownSelect>

        <FilterDropdownSelect
          value={selectedStatus}
          onChange={setSelectedStatus}
          focusBorderColorClass="focus:border-[#006AC7]"
          label="Status filter"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="TRANSFERRED">Transferred</option>
          <option value="RETIRED">Retired</option>
          <option value="INACTIVE">Inactive</option>
        </FilterDropdownSelect>
      </DirectoryFilterToolbar>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#526477]">
            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-[#526477]">
              <tr>
                <th className="px-4 py-3.5">Full Name &amp; Email</th>
                <th className="px-4 py-3.5">Civil Designation</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Assigned School</th>
                <th className="px-4 py-3.5">Contact Phone</th>
                <th className="px-4 py-3.5">Account Status</th>
                <th className="px-4 py-3.5">Registered On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <LoadingSkeletonRow columnsCount={7} message="Loading school staff records..." />
              ) : staffRecords.length === 0 ? (
                <EmptyStateRow
                  columnsCount={7}
                  title="No matching staff records found."
                  description="Try adjusting your search criteria or clearing filters."
                />
              ) : (
                staffRecords.map((staffMember) => (
                  <tr key={staffMember._id} className="hover:bg-blue-50/40 transition">
                    <TableCell>
                      <div className="font-bold text-[#102033] text-xs">{staffMember.fullName}</div>
                      <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#526477] font-mono">
                        <Mail className="h-3 w-3 text-slate-400" />
                        {staffMember.email || '—'}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-amber-700 font-bold text-xs">{staffMember.designation || '—'}</span>
                    </TableCell>

                    <TableCell>{renderRoleBadge(staffMember.role)}</TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px] text-[#102033] font-medium">
                          {staffMember.schoolId?.name || '—'}
                        </span>
                      </div>
                      {staffMember.schoolId?.schoolCode && (
                        <div className="text-[11px] text-[#8094A8] font-mono mt-0.5">
                          {staffMember.schoolId.schoolCode}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {staffMember.phoneNumber ? (
                        <div className="flex items-center gap-1 text-[#526477] font-mono">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {staffMember.phoneNumber}
                        </div>
                      ) : (
                        <span className="text-[#8094A8]">—</span>
                      )}
                    </TableCell>

                    <TableCell>{renderStatusBadge(staffMember.status)}</TableCell>

                    <TableCell className="text-[#8094A8] font-mono whitespace-nowrap">
                      {formatDisplayDate(staffMember.createdAt)}
                    </TableCell>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── View 3: Guardians Directory (Admins Only) ────────────────────────────────

const GuardiansDirectoryView = () => {
  const [rawGuardians, setRawGuardians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchGuardiansData = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParameters = new URLSearchParams({ role: 'PARENT', limit: '500' });
      if (selectedStatus) queryParameters.append('status', selectedStatus);

      const response = await apiClient.get(`/users?${queryParameters.toString()}`);
      if (response.data?.success) {
        setRawGuardians(response.data.data?.users || []);
      }
    } catch {
      toast.error('Failed to retrieve guardians directory records.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchGuardiansData();
  }, [fetchGuardiansData]);

  const filteredGuardians = useMemo(() => {
    if (!searchQuery.trim()) return rawGuardians;
    const lowerQuery = searchQuery.trim().toLowerCase();
    return rawGuardians.filter(
      (guardian) =>
        (guardian.fullName || '').toLowerCase().includes(lowerQuery) ||
        (guardian.email || '').toLowerCase().includes(lowerQuery) ||
        (guardian.phoneNumber || '').includes(searchQuery.trim())
    );
  }, [rawGuardians, searchQuery]);

  const handleExportGuardiansCsv = () => {
    const exportParameters = {};
    if (searchQuery.trim()) exportParameters.search = searchQuery.trim();
    if (selectedStatus) exportParameters.status = selectedStatus;

    downloadCsvFile(
      '/exports/guardians.csv',
      `guardians_directory_${formatDisplayDate(new Date())}.csv`,
      exportParameters,
      setIsExporting
    );
  };

  const hasActiveFilters = Boolean(searchQuery || selectedStatus);

  return (
    <div className="space-y-4">
      <DirectoryFilterToolbar
        totalRecordsCount={filteredGuardians.length}
        entityLabelSingular="guardians"
        onRefreshTriggered={fetchGuardiansData}
        isLoadingData={isLoading}
        onExportTriggered={handleExportGuardiansCsv}
        isExportingData={isExporting}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={() => {
          setSearchQuery('');
          setSelectedStatus('');
        }}
      >
        <SearchInputField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholderText="Search guardian name, email, or phone..."
          focusBorderColorClass="focus:border-[#006AC7]"
        />

        <FilterDropdownSelect
          value={selectedStatus}
          onChange={setSelectedStatus}
          focusBorderColorClass="focus:border-[#006AC7]"
          label="Guardian status"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING_APPROVAL">Pending</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="INACTIVE">Inactive</option>
        </FilterDropdownSelect>
      </DirectoryFilterToolbar>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#526477]">
            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-[#526477]">
              <tr>
                <th className="px-4 py-3.5">Guardian Name</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Contact Phone</th>
                <th className="px-4 py-3.5">Linked Students</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Registered On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <LoadingSkeletonRow columnsCount={6} message="Loading guardian accounts..." />
              ) : filteredGuardians.length === 0 ? (
                <EmptyStateRow columnsCount={6} title="No matching guardian accounts found." description="Adjust your filters or search." />
              ) : (
                filteredGuardians.map((guardianAccount) => (
                  <tr key={guardianAccount._id} className="hover:bg-blue-50/40 transition">
                    <TableCell>
                      <div className="font-bold text-[#102033]">{guardianAccount.fullName}</div>
                    </TableCell>
                    <TableCell>
                      {guardianAccount.email ? (
                        <div className="flex items-center gap-1 font-mono text-[11px] text-[#526477]">
                          <Mail className="h-3 w-3 text-slate-400" />
                          {guardianAccount.email}
                        </div>
                      ) : (
                        <span className="text-[#8094A8]">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {guardianAccount.phoneNumber ? (
                        <div className="flex items-center gap-1 text-[#526477] font-mono">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {guardianAccount.phoneNumber}
                        </div>
                      ) : (
                        <span className="text-[#8094A8]">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] text-[#526477]">
                        <GraduationCap className="h-3 w-3 text-[#006AC7]" />
                        <span className="text-[#006AC7] font-bold">{guardianAccount.linkedStudentsCount ?? '?'}</span>
                        <span>linked</span>
                      </span>
                    </TableCell>
                    <TableCell>{renderStatusBadge(guardianAccount.status)}</TableCell>
                    <TableCell className="text-[#8094A8] font-mono whitespace-nowrap">
                      {formatDisplayDate(guardianAccount.createdAt)}
                    </TableCell>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Directory Page Main Component ─────────────────────────────────────────────

export const DirectoryPage = () => {
  const { user: authenticatedUser } = useSelector((state) => state.auth);
  const isPlatformAdministrator = ['ROOT_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(authenticatedUser?.role);
  const isHM = authenticatedUser?.role === 'HM';

  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamValue = searchParams.get('search') || '';
  const tabParamValue = searchParams.get('tab');

  // Authoritative active tab state: defaults to 'students' for HM, 'staff' for general
  const defaultTab = isHM ? 'students' : 'staff';
  const resolvedInitialTab =
    tabParamValue && ['students', 'staff', 'guardians'].includes(tabParamValue)
      ? tabParamValue
      : defaultTab;

  const [activeTabId, setActiveTabId] = useState(resolvedInitialTab);
  const [municipalSchoolsList, setMunicipalSchoolsList] = useState([]);

  // Sync state if URL query param changes via browser back/forward or sidebar click
  useEffect(() => {
    if (tabParamValue && ['students', 'staff', 'guardians'].includes(tabParamValue)) {
      if (tabParamValue !== activeTabId) {
        setActiveTabId(tabParamValue);
      }
    } else if (!tabParamValue) {
      // Direct URL entry without tab parameter: sync URL to explicit default
      setSearchParams({ tab: defaultTab }, { replace: true });
    }
  }, [tabParamValue, activeTabId, defaultTab, setSearchParams]);

  // Fetch school list for non-HM filters
  useEffect(() => {
    if (!isHM) {
      apiClient
        .get('/schools?limit=200')
        .then((response) => {
          if (response.data?.success) {
            setMunicipalSchoolsList(response.data.data?.schools || []);
          }
        })
        .catch(() => {});
    }
  }, [isHM]);

  const handleTabChange = (targetTabId) => {
    setActiveTabId(targetTabId);
    setSearchParams((prevParams) => {
      const nextParams = new URLSearchParams(prevParams);
      nextParams.set('tab', targetTabId);
      return nextParams;
    });
  };

  const schoolName = authenticatedUser?.schoolId?.name || authenticatedUser?.schoolName || 'School';

  // Dynamic Page Title & Plain-English Subtitle reflecting the selected category
  const getPageHeaderInfo = () => {
    if (activeTabId === 'students') {
      return {
        title: 'Student Records',
        subtitle: isHM
          ? `${schoolName} — Official student admission, class enrollment, and academic status records.`
          : 'Education Department Liaquatabad Town — Municipal student admission and academic records.',
      };
    }
    if (activeTabId === 'staff') {
      return {
        title: 'Staff Directory',
        subtitle: isHM
          ? `${schoolName} — School faculty and non-teaching administrative personnel records.`
          : 'Education Department Liaquatabad Town — Teaching faculty and institutional staff directory.',
      };
    }
    return {
      title: 'Guardians Directory',
      subtitle: 'Education Department Liaquatabad Town — Parent accounts and verified student link records.',
    };
  };

  const { title: pageTitle, subtitle: pageSubtitle } = getPageHeaderInfo();

  return (
    <PageContainer title={pageTitle} subtitle={pageSubtitle}>
      <div className="space-y-6">
        {/* Category Switcher Pill Toggle */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100/80 border border-slate-200/60 shadow-xs">
            <button
              type="button"
              onClick={() => handleTabChange('students')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTabId === 'students'
                  ? 'bg-white text-[#006AC7] shadow-sm'
                  : 'text-[#526477] hover:text-[#102033]'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Student Records</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('staff')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTabId === 'staff'
                  ? 'bg-white text-[#006AC7] shadow-sm'
                  : 'text-[#526477] hover:text-[#102033]'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Staff Directory</span>
            </button>

            {isPlatformAdministrator && (
              <button
                type="button"
                onClick={() => handleTabChange('guardians')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTabId === 'guardians'
                    ? 'bg-white text-[#006AC7] shadow-sm'
                    : 'text-[#526477] hover:text-[#102033]'
                }`}
              >
                <Heart className="h-4 w-4" />
                <span>Guardians Directory</span>
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate max-w-[200px]">{schoolName}</span>
          </div>
        </div>

        {/* Selected Category Content */}
        {activeTabId === 'students' && (
          <StudentRecordsView
            municipalSchoolsList={municipalSchoolsList}
            initialSearch={searchParamValue}
            authenticatedUser={authenticatedUser}
          />
        )}

        {activeTabId === 'staff' && (
          <StaffDirectoryView
            municipalSchoolsList={municipalSchoolsList}
            initialSearch={searchParamValue}
            authenticatedUser={authenticatedUser}
          />
        )}

        {activeTabId === 'guardians' && isPlatformAdministrator && (
          <GuardiansDirectoryView />
        )}
      </div>
    </PageContainer>
  );
};

export default DirectoryPage;
