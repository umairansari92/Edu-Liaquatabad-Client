import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Users, GraduationCap, Heart, Search, Download, RefreshCw,
  Building2, Mail, Phone, CalendarDays, IdCard, Hash,
  CheckCircle2, Clock, AlertCircle, ShieldAlert, ArrowRightLeft, UserX
} from 'lucide-react';
import apiClient from '../../services/apiClient.js';
import PageContainer from '../../components/layout/PageContainer.jsx';
import toast from 'react-hot-toast';

// ── Helpers & Badges ─────────────────────────────────────────────────────────

const formatDisplayDate = (dateValue) => {
  if (!dateValue) return '—';
  return new Date(dateValue).toLocaleDateString('en-PK', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
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
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono tracking-wide ${roleColorStyles[userRole] || 'bg-slate-100 border-slate-200 text-slate-700'}`}>
      {userRole}
    </span>
  );
};

const renderStatusBadge = (entityStatus) => {
  const statusConfig = {
    ACTIVE:             { label: 'Active',         icon: CheckCircle2, color: 'text-[#4B7F3A] bg-emerald-50 border-emerald-200' },
    PENDING_APPROVAL:   { label: 'Pending',        icon: Clock,        color: 'text-amber-700 bg-amber-50 border-amber-200' },
    REQUIRES_CORRECTION:{ label: 'Needs Fix',      icon: AlertCircle,  color: 'text-orange-700 bg-orange-50 border-orange-200' },
    SUSPENDED:          { label: 'Suspended',      icon: ShieldAlert,  color: 'text-rose-700 bg-rose-50 border-rose-200' },
    TRANSFERRED:        { label: 'Transferred',    icon: ArrowRightLeft,color:'text-[#006AC7] bg-blue-50 border-blue-200' },
    GRADUATED:          { label: 'Graduated',      icon: GraduationCap,color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
    DROPPED_OUT:        { label: 'Dropped Out',    icon: UserX,        color: 'text-slate-600 bg-slate-100 border-slate-200' },
    INACTIVE:           { label: 'Inactive',       icon: UserX,        color: 'text-slate-600 bg-slate-100 border-slate-200' },
    RETIRED:            { label: 'Retired',        icon: CheckCircle2, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  };
  const config = statusConfig[entityStatus] || { label: entityStatus || 'Unknown', icon: AlertCircle, color: 'text-slate-600 bg-slate-100 border-slate-200' };
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

const LoadingSkeletonRow = ({ columnsCount }) => (
  <tr>
    <td colSpan={columnsCount} className="py-12 text-center text-[#526477]">
      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#006AC7]" />
      <span className="text-xs font-medium">Loading records from municipal directory...</span>
    </td>
  </tr>
);

const EmptyStateRow = ({ columnsCount }) => (
  <tr>
    <td colSpan={columnsCount} className="py-12 text-center text-[#526477]">
      <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
      <p className="text-xs font-bold text-[#102033]">No matching records found.</p>
      <p className="text-[11px] text-[#8094A8] mt-0.5">Try clearing or adjusting search filters.</p>
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
    document.body.removeChild(downloadAnchorElement);
    URL.revokeObjectURL(downloadAnchorElement.href);
    toast.success(`${targetFilename} downloaded successfully.`);
  } catch (downloadError) {
    toast.error('Export failed. Please verify administrative permissions.');
  } finally {
    setExportingState(false);
  }
};

// ── Search & Filter Controls ─────────────────────────────────────────────────

const SearchInputField = ({ value, onChange, placeholderText, focusBorderColorClass }) => (
  <div className="relative flex-1 min-w-[180px] max-w-xs">
    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholderText}
      className={`w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs font-medium text-[#102033] placeholder-slate-400 focus:bg-white focus:outline-none ${focusBorderColorClass}`}
    />
  </div>
);

const FilterDropdownSelect = ({ value, onChange, focusBorderColorClass, children }) => (
  <select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className={`rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-bold text-[#526477] focus:bg-white focus:outline-none ${focusBorderColorClass}`}
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
  exportButtonColorClass,
}) => (
  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
    <div className="flex flex-wrap gap-2 flex-1">{children}</div>
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-xs text-[#526477] font-medium whitespace-nowrap">
        <span className="text-[#102033] font-bold">{totalRecordsCount}</span> {entityLabelSingular}
      </span>
      <button
        onClick={onRefreshTriggered}
        className="rounded-xl border border-slate-200 bg-white p-2 text-[#526477] hover:text-[#102033] hover:bg-slate-50 shadow-sm transition"
        title="Refresh Records"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
      </button>
      <button
        onClick={onExportTriggered}
        disabled={isExportingData}
        className={`flex items-center gap-1.5 rounded-xl ${exportButtonColorClass} disabled:opacity-50 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition`}
      >
        <Download className="h-3.5 w-3.5" />
        {isExportingData ? 'Exporting...' : 'Export CSV'}
      </button>
    </div>
  </div>
);

// ── Tab 1: Staff Directory ────────────────────────────────────────────────────

const StaffDirectoryTab = ({ municipalSchoolsList }) => {
  const [staffRecords, setStaffRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
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
      if (selectedSchoolId) queryParameters.append('schoolId', selectedSchoolId);
      if (selectedRole) queryParameters.append('role', selectedRole);
      if (selectedStatus) queryParameters.append('status', selectedStatus);

      const response = await apiClient.get(`/users?${queryParameters.toString()}`);
      if (response.data?.success) {
        const filteredStaffList = (response.data.data?.users || []).filter(
          (userAccount) => !['STUDENT', 'PARENT'].includes(userAccount.baseRole)
        );
        setStaffRecords(filteredStaffList);
        setTotalCount(filteredStaffList.length);
      }
    } catch (fetchError) {
      toast.error('Failed to retrieve staff directory records.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, selectedSchoolId, selectedRole, selectedStatus]);

  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  const handleExportStaffCsv = () => {
    const exportParameters = {};
    if (searchQuery.trim()) exportParameters.search = searchQuery.trim();
    if (selectedSchoolId) exportParameters.schoolId = selectedSchoolId;
    if (selectedRole) exportParameters.role = selectedRole;
    if (selectedStatus) exportParameters.status = selectedStatus;

    downloadCsvFile('/exports/staff.csv', `staff_directory_${formatDisplayDate(new Date())}.csv`, exportParameters, setIsExporting);
  };

  return (
    <div className="space-y-4">
      <DirectoryFilterToolbar
        totalRecordsCount={totalCount}
        entityLabelSingular="staff"
        onRefreshTriggered={fetchStaffData}
        isLoadingData={isLoading}
        onExportTriggered={handleExportStaffCsv}
        isExportingData={isExporting}
        exportButtonColorClass="bg-[#006AC7] hover:bg-[#00529B]"
      >
        <SearchInputField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholderText="Search name or email..."
          focusBorderColorClass="focus:border-[#006AC7]"
        />
        <FilterDropdownSelect
          value={selectedSchoolId}
          onChange={setSelectedSchoolId}
          focusBorderColorClass="focus:border-[#006AC7]"
        >
          <option value="">All Schools</option>
          {municipalSchoolsList.map((schoolItem) => (
            <option key={schoolItem._id} value={schoolItem._id}>
              {schoolItem.name}
            </option>
          ))}
        </FilterDropdownSelect>
        <FilterDropdownSelect
          value={selectedRole}
          onChange={setSelectedRole}
          focusBorderColorClass="focus:border-[#006AC7]"
        >
          <option value="">All Roles</option>
          {['ADMIN', 'SUPERVISOR', 'HM', 'TEACHER', 'PEON'].map((roleName) => (
            <option key={roleName} value={roleName}>
              {roleName}
            </option>
          ))}
        </FilterDropdownSelect>
        <FilterDropdownSelect
          value={selectedStatus}
          onChange={setSelectedStatus}
          focusBorderColorClass="focus:border-[#006AC7]"
        >
          <option value="">All Statuses</option>
          {['ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED', 'TRANSFERRED', 'RETIRED', 'INACTIVE'].map((statusName) => (
            <option key={statusName} value={statusName}>
              {statusName.replace(/_/g, ' ')}
            </option>
          ))}
        </FilterDropdownSelect>
      </DirectoryFilterToolbar>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#526477]">
            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-[#526477]">
              <tr>
                {['Full Name & Email', 'Designation', 'Role', 'School', 'Phone', 'Status', 'Registered'].map((headerTitle) => (
                  <th key={headerTitle} className="px-4 py-3.5">{headerTitle}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <LoadingSkeletonRow columnsCount={7} />
              ) : staffRecords.length === 0 ? (
                <EmptyStateRow columnsCount={7} />
              ) : (
                staffRecords.map((staffMember) => (
                  <tr key={staffMember._id} className="hover:bg-blue-50/40 transition">
                    <TableCell>
                      <div className="font-bold text-[#102033]">{staffMember.fullName}</div>
                      <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#526477] font-mono">
                        <Mail className="h-3 w-3 text-slate-400" />
                        {staffMember.email || '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-amber-700 font-bold">{staffMember.designation || '—'}</span>
                    </TableCell>
                    <TableCell>{renderRoleBadge(staffMember.role)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[160px] text-[#102033] font-medium">{staffMember.schoolId?.name || '—'}</span>
                      </div>
                      {staffMember.schoolId?.schoolCode && (
                        <div className="text-[11px] text-[#8094A8] font-mono mt-0.5">
                          {staffMember.schoolId.schoolCode}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {staffMember.phoneNumber ? (
                        <div className="flex items-center gap-1 text-[#526477]">
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

// ── Tab 2: Students Directory ─────────────────────────────────────────────────

const StudentsDirectoryTab = ({ municipalSchoolsList }) => {
  const [rawStudents, setRawStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchStudentsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParameters = new URLSearchParams({ role: 'STUDENT', limit: '500' });
      if (selectedSchoolId) queryParameters.append('schoolId', selectedSchoolId);
      if (selectedStatus) queryParameters.append('status', selectedStatus);

      const response = await apiClient.get(`/users?${queryParameters.toString()}`);
      if (response.data?.success) {
        setRawStudents(response.data.data?.users || []);
      }
    } catch (fetchError) {
      toast.error('Failed to retrieve students directory records.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSchoolId, selectedStatus]);

  useEffect(() => {
    fetchStudentsData();
  }, [fetchStudentsData]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return rawStudents;
    const lowerQuery = searchQuery.trim().toLowerCase();
    return rawStudents.filter(
      (student) =>
        (student.fullName || '').toLowerCase().includes(lowerQuery) ||
        (student.email || '').toLowerCase().includes(lowerQuery) ||
        (student.grNumber || '').toLowerCase().includes(lowerQuery) ||
        (student.globalStudentId || '').toLowerCase().includes(lowerQuery)
    );
  }, [rawStudents, searchQuery]);

  const handleExportStudentsCsv = () => {
    const exportParameters = {};
    if (searchQuery.trim()) exportParameters.search = searchQuery.trim();
    if (selectedSchoolId) exportParameters.schoolId = selectedSchoolId;
    if (selectedStatus) exportParameters.status = selectedStatus;

    downloadCsvFile('/exports/students.csv', `students_directory_${formatDisplayDate(new Date())}.csv`, exportParameters, setIsExporting);
  };

  return (
    <div className="space-y-4">
      <DirectoryFilterToolbar
        totalRecordsCount={filteredStudents.length}
        entityLabelSingular="students"
        onRefreshTriggered={fetchStudentsData}
        isLoadingData={isLoading}
        onExportTriggered={handleExportStudentsCsv}
        isExportingData={isExporting}
        exportButtonColorClass="bg-[#006AC7] hover:bg-[#00529B]"
      >
        <SearchInputField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholderText="Search student name, GR No..."
          focusBorderColorClass="focus:border-[#006AC7]"
        />
        <FilterDropdownSelect
          value={selectedSchoolId}
          onChange={setSelectedSchoolId}
          focusBorderColorClass="focus:border-[#006AC7]"
        >
          <option value="">All Schools</option>
          {municipalSchoolsList.map((schoolItem) => (
            <option key={schoolItem._id} value={schoolItem._id}>
              {schoolItem.name}
            </option>
          ))}
        </FilterDropdownSelect>
        <FilterDropdownSelect
          value={selectedStatus}
          onChange={setSelectedStatus}
          focusBorderColorClass="focus:border-[#006AC7]"
        >
          <option value="">All Statuses</option>
          {['ACTIVE', 'PENDING_APPROVAL', 'TRANSFERRED', 'GRADUATED', 'DROPPED_OUT', 'INACTIVE'].map((statusName) => (
            <option key={statusName} value={statusName}>
              {statusName.replace(/_/g, ' ')}
            </option>
          ))}
        </FilterDropdownSelect>
      </DirectoryFilterToolbar>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#526477]">
            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-[#526477]">
              <tr>
                {['Student', 'GR No', 'Global ID', 'School', 'Class/Section', 'Gender', 'Guardian', 'Admission', 'Status'].map(
                  (headerTitle) => (
                    <th key={headerTitle} className="px-4 py-3.5">{headerTitle}</th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <LoadingSkeletonRow columnsCount={9} />
              ) : filteredStudents.length === 0 ? (
                <EmptyStateRow columnsCount={9} />
              ) : (
                filteredStudents.map((studentAccount, index) => (
                  <tr key={studentAccount._id || index} className="hover:bg-blue-50/40 transition">
                    <TableCell>
                      <div className="font-bold text-[#102033]">{studentAccount.fullName || '—'}</div>
                      {studentAccount.email && (
                        <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#526477] font-mono">
                          <Mail className="h-3 w-3 text-slate-400" />
                          {studentAccount.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 font-mono text-amber-700 font-bold">
                        <Hash className="h-3 w-3" />
                        {studentAccount.grNumber || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {studentAccount.globalStudentId ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[#006AC7] font-bold text-[11px] bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
                          <IdCard className="h-3 w-3" />
                          {studentAccount.globalStudentId}
                        </span>
                      ) : (
                        <span className="text-[#8094A8]">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[140px] text-[#102033] font-medium">{studentAccount.schoolId?.name || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-[#102033]">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium">{studentAccount.classId?.name || '—'}</span>
                        {studentAccount.sectionId?.name && (
                          <span className="text-[#526477] ml-1">/ {studentAccount.sectionId.name}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-bold ${
                          studentAccount.gender === 'MALE'
                            ? 'text-[#006AC7]'
                            : studentAccount.gender === 'FEMALE'
                            ? 'text-pink-600'
                            : 'text-[#526477]'
                        }`}
                      >
                        {studentAccount.gender || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="truncate max-w-[120px] text-[#102033] font-medium">
                        {studentAccount.fatherOrGuardianName || '—'}
                      </div>
                      {studentAccount.guardianContactNumber && (
                        <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#526477]">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {studentAccount.guardianContactNumber}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-[#526477]">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                        {studentAccount.admissionDate ? formatDisplayDate(studentAccount.admissionDate) : '—'}
                      </div>
                      {studentAccount.admissionType && (
                        <div className="text-[10px] text-[#8094A8] font-mono mt-0.5">
                          {studentAccount.admissionType}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{renderStatusBadge(studentAccount.lifecycleStatus || studentAccount.status)}</TableCell>
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

// ── Tab 3: Guardians Directory ────────────────────────────────────────────────

const GuardiansDirectoryTab = () => {
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
    } catch (fetchError) {
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

    downloadCsvFile('/exports/guardians.csv', `guardians_directory_${formatDisplayDate(new Date())}.csv`, exportParameters, setIsExporting);
  };

  return (
    <div className="space-y-4">
      <DirectoryFilterToolbar
        totalRecordsCount={filteredGuardians.length}
        entityLabelSingular="guardians"
        onRefreshTriggered={fetchGuardiansData}
        isLoadingData={isLoading}
        onExportTriggered={handleExportGuardiansCsv}
        isExportingData={isExporting}
        exportButtonColorClass="bg-[#006AC7] hover:bg-[#00529B]"
      >
        <SearchInputField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholderText="Search name, email, or phone..."
          focusBorderColorClass="focus:border-[#006AC7]"
        />
        <FilterDropdownSelect
          value={selectedStatus}
          onChange={setSelectedStatus}
          focusBorderColorClass="focus:border-[#006AC7]"
        >
          <option value="">All Statuses</option>
          {['ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED', 'INACTIVE'].map((statusName) => (
            <option key={statusName} value={statusName}>
              {statusName.replace(/_/g, ' ')}
            </option>
          ))}
        </FilterDropdownSelect>
      </DirectoryFilterToolbar>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#526477]">
            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-[#526477]">
              <tr>
                {['Guardian', 'Email', 'Phone', 'Linked Students', 'Status', 'Registered'].map((headerTitle) => (
                  <th key={headerTitle} className="px-4 py-3.5">{headerTitle}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <LoadingSkeletonRow columnsCount={6} />
              ) : filteredGuardians.length === 0 ? (
                <EmptyStateRow columnsCount={6} />
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
                        <div className="flex items-center gap-1 text-[#526477]">
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
                      <p className="text-[10px] text-[#8094A8] mt-0.5">Full list available in CSV export</p>
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

const DIRECTORY_NAVIGATION_TABS = [
  { id: 'staff',     label: 'Staff Directory',     icon: Users,         requiresAdminRole: false },
  { id: 'students',  label: 'Students Directory',  icon: GraduationCap, requiresAdminRole: false },
  { id: 'guardians', label: 'Guardians Directory', icon: Heart,         requiresAdminRole: true  },
];

const TAB_ACCENT_STYLES = {
  staff: {
    activeStyle: 'border-[#006AC7] text-[#006AC7]',
    hoverStyle:  'hover:text-[#006AC7] hover:border-[#006AC7]/40',
  },
  students: {
    activeStyle: 'border-[#006AC7] text-[#006AC7]',
    hoverStyle:  'hover:text-[#006AC7] hover:border-[#006AC7]/40',
  },
  guardians: {
    activeStyle: 'border-[#006AC7] text-[#006AC7]',
    hoverStyle:  'hover:text-[#006AC7] hover:border-[#006AC7]/40',
  },
};

export const DirectoryPage = () => {
  const { user: authenticatedUser } = useSelector((state) => state.auth);
  const isPlatformAdministrator = ['ROOT_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(authenticatedUser?.role);
  const [activeTabId, setActiveTabId] = useState('staff');
  const [municipalSchoolsList, setMunicipalSchoolsList] = useState([]);

  useEffect(() => {
    apiClient
      .get('/schools?limit=200')
      .then((response) => {
        if (response.data?.success) {
          setMunicipalSchoolsList(response.data.data?.schools || []);
        }
      })
      .catch(() => {});
  }, []);

  const visibleTabsList = DIRECTORY_NAVIGATION_TABS.filter(
    (tabConfig) => !tabConfig.requiresAdminRole || isPlatformAdministrator
  );

  return (
    <PageContainer
      title="Institutional Directory"
      subtitle="Education Department Liaquatabad Town — Staff, Students & Guardian records with CSV export"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-0 border-b border-slate-200 overflow-x-auto">
          {visibleTabsList.map((tabConfig) => {
            const TabIconComponent = tabConfig.icon;
            const accentStyleConfig = TAB_ACCENT_STYLES[tabConfig.id];
            const isTabActive = activeTabId === tabConfig.id;
            return (
              <button
                key={tabConfig.id}
                type="button"
                onClick={() => setActiveTabId(tabConfig.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
                  isTabActive
                    ? accentStyleConfig.activeStyle
                    : `border-transparent text-[#526477] ${accentStyleConfig.hoverStyle}`
                }`}
              >
                <TabIconComponent className="h-4 w-4" />
                {tabConfig.label}
              </button>
            );
          })}
        </div>

        {activeTabId === 'staff' && <StaffDirectoryTab municipalSchoolsList={municipalSchoolsList} />}
        {activeTabId === 'students' && <StudentsDirectoryTab municipalSchoolsList={municipalSchoolsList} />}
        {activeTabId === 'guardians' && <GuardiansDirectoryTab />}
      </div>
    </PageContainer>
  );
};

export default DirectoryPage;
