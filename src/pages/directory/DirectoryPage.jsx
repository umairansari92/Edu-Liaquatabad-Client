import React, { useState, useEffect, useCallback } from 'react';
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
    ROOT_ADMIN:  'bg-purple-950/70 border-purple-700/60 text-purple-300',
    SUPER_ADMIN: 'bg-indigo-950/70 border-indigo-700/60 text-indigo-300',
    ADMIN:       'bg-blue-950/70 border-blue-700/60 text-blue-300',
    SUPERVISOR:  'bg-teal-950/70 border-teal-700/60 text-teal-300',
    HM:          'bg-emerald-950/70 border-emerald-700/60 text-emerald-300',
    TEACHER:     'bg-cyan-950/70 border-cyan-700/60 text-cyan-300',
    PEON:        'bg-slate-800 border-slate-700 text-slate-300',
    STUDENT:     'bg-sky-950/70 border-sky-700/60 text-sky-300',
    PARENT:      'bg-rose-950/70 border-rose-700/60 text-rose-300',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono tracking-wide ${roleColorStyles[userRole] || 'bg-slate-800 border-slate-700 text-slate-300'}`}>
      {userRole}
    </span>
  );
};

const renderStatusBadge = (entityStatus) => {
  const statusConfig = {
    ACTIVE:             { label: 'Active',         icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-950/50 border-emerald-800/60' },
    PENDING_APPROVAL:   { label: 'Pending',        icon: Clock,        color: 'text-amber-400 bg-amber-950/50 border-amber-800/60' },
    REQUIRES_CORRECTION:{ label: 'Needs Fix',      icon: AlertCircle,  color: 'text-orange-400 bg-orange-950/50 border-orange-800/60' },
    SUSPENDED:          { label: 'Suspended',      icon: ShieldAlert,  color: 'text-rose-400 bg-rose-950/50 border-rose-800/60' },
    TRANSFERRED:        { label: 'Transferred',    icon: ArrowRightLeft,color:'text-blue-400 bg-blue-950/50 border-blue-800/60' },
    GRADUATED:          { label: 'Graduated',      icon: GraduationCap,color: 'text-cyan-400 bg-cyan-950/50 border-cyan-800/60' },
    DROPPED_OUT:        { label: 'Dropped Out',    icon: UserX,        color: 'text-slate-400 bg-slate-800 border-slate-700' },
    INACTIVE:           { label: 'Inactive',       icon: UserX,        color: 'text-slate-400 bg-slate-800 border-slate-700' },
    RETIRED:            { label: 'Retired',        icon: CheckCircle2, color: 'text-purple-400 bg-purple-950/50 border-purple-800/60' },
  };
  const config = statusConfig[entityStatus] || { label: entityStatus || 'Unknown', icon: AlertCircle, color: 'text-slate-400 bg-slate-800 border-slate-700' };
  const StatusIconComponent = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.color}`}>
      <StatusIconComponent className="h-3 w-3" />
      {config.label}
    </span>
  );
};

const TableCell = ({ children, className = '' }) => (
  <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>
);

const LoadingSkeletonRow = ({ columnsCount }) => (
  <tr>
    <td colSpan={columnsCount} className="py-12 text-center text-slate-500">
      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-600" />
      <span className="text-xs">Loading records from municipal directory...</span>
    </td>
  </tr>
);

const EmptyStateRow = ({ columnsCount }) => (
  <tr>
    <td colSpan={columnsCount} className="py-12 text-center text-slate-500">
      <Users className="h-8 w-8 mx-auto mb-2 text-slate-700" />
      <p className="text-xs font-medium">No matching records found.</p>
      <p className="text-[11px] text-slate-600 mt-0.5">Try clearing or adjusting search filters.</p>
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
    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholderText}
      className={`w-full rounded-lg border border-slate-700 bg-slate-800/90 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none ${focusBorderColorClass}`}
    />
  </div>
);

const FilterDropdownSelect = ({ value, onChange, focusBorderColorClass, children }) => (
  <select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className={`rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs text-slate-200 focus:outline-none ${focusBorderColorClass}`}
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
  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-3">
    <div className="flex flex-wrap gap-2 flex-1">{children}</div>
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
        <span className="text-white font-bold">{totalRecordsCount}</span> {entityLabelSingular}
      </span>
      <button
        onClick={onRefreshTriggered}
        className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 transition"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
      </button>
      <button
        onClick={onExportTriggered}
        disabled={isExportingData}
        className={`flex items-center gap-1.5 rounded-lg ${exportButtonColorClass} disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white transition`}
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
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchStaffData = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParameters = new URLSearchParams({ limit: '200' });
      if (searchQuery.trim()) queryParameters.append('search', searchQuery.trim());
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
  }, [searchQuery, selectedSchoolId, selectedRole, selectedStatus]);

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
        exportButtonColorClass="bg-emerald-700 hover:bg-emerald-600"
      >
        <SearchInputField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholderText="Search name or email..."
          focusBorderColorClass="focus:border-emerald-500"
        />
        <FilterDropdownSelect
          value={selectedSchoolId}
          onChange={setSelectedSchoolId}
          focusBorderColorClass="focus:border-emerald-500"
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
          focusBorderColorClass="focus:border-emerald-500"
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
          focusBorderColorClass="focus:border-emerald-500"
        >
          <option value="">All Statuses</option>
          {['ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED', 'TRANSFERRED', 'RETIRED', 'INACTIVE'].map((statusName) => (
            <option key={statusName} value={statusName}>
              {statusName.replace(/_/g, ' ')}
            </option>
          ))}
        </FilterDropdownSelect>
      </DirectoryFilterToolbar>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                {['Full Name & Email', 'Designation', 'Role', 'School', 'Phone', 'Status', 'Registered'].map((headerTitle) => (
                  <th key={headerTitle} className="px-4 py-3">{headerTitle}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <LoadingSkeletonRow columnsCount={7} />
              ) : staffRecords.length === 0 ? (
                <EmptyStateRow columnsCount={7} />
              ) : (
                staffRecords.map((staffMember) => (
                  <tr key={staffMember._id} className="hover:bg-slate-800/40 transition">
                    <TableCell>
                      <div className="font-semibold text-white">{staffMember.fullName}</div>
                      <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-500 font-mono">
                        <Mail className="h-3 w-3" />
                        {staffMember.email || '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-amber-300 font-medium">{staffMember.designation || '—'}</span>
                    </TableCell>
                    <TableCell>{renderRoleBadge(staffMember.role)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[160px]">{staffMember.schoolId?.name || '—'}</span>
                      </div>
                      {staffMember.schoolId?.schoolCode && (
                        <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                          {staffMember.schoolId.schoolCode}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {staffMember.phoneNumber ? (
                        <div className="flex items-center gap-1 text-slate-400">
                          <Phone className="h-3 w-3" />
                          {staffMember.phoneNumber}
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </TableCell>
                    <TableCell>{renderStatusBadge(staffMember.status)}</TableCell>
                    <TableCell className="text-slate-500 font-mono whitespace-nowrap">
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
  const [studentRecords, setStudentRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
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
        let studentsList = response.data.data?.users || [];
        if (searchQuery.trim()) {
          const lowerQuery = searchQuery.trim().toLowerCase();
          studentsList = studentsList.filter(
            (student) =>
              (student.fullName || '').toLowerCase().includes(lowerQuery) ||
              (student.email || '').toLowerCase().includes(lowerQuery)
          );
        }
        setStudentRecords(studentsList);
        setTotalCount(studentsList.length);
      }
    } catch (fetchError) {
      toast.error('Failed to retrieve students directory records.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedSchoolId, selectedStatus]);

  useEffect(() => {
    fetchStudentsData();
  }, [fetchStudentsData]);

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
        totalRecordsCount={totalCount}
        entityLabelSingular="students"
        onRefreshTriggered={fetchStudentsData}
        isLoadingData={isLoading}
        onExportTriggered={handleExportStudentsCsv}
        isExportingData={isExporting}
        exportButtonColorClass="bg-blue-700 hover:bg-blue-600"
      >
        <SearchInputField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholderText="Search student name, GR No..."
          focusBorderColorClass="focus:border-blue-500"
        />
        <FilterDropdownSelect
          value={selectedSchoolId}
          onChange={setSelectedSchoolId}
          focusBorderColorClass="focus:border-blue-500"
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
          focusBorderColorClass="focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          {['ACTIVE', 'PENDING_APPROVAL', 'TRANSFERRED', 'GRADUATED', 'DROPPED_OUT', 'INACTIVE'].map((statusName) => (
            <option key={statusName} value={statusName}>
              {statusName.replace(/_/g, ' ')}
            </option>
          ))}
        </FilterDropdownSelect>
      </DirectoryFilterToolbar>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                {['Student', 'GR No', 'Global ID', 'School', 'Class/Section', 'Gender', 'Guardian', 'Admission', 'Status'].map(
                  (headerTitle) => (
                    <th key={headerTitle} className="px-4 py-3">{headerTitle}</th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <LoadingSkeletonRow columnsCount={9} />
              ) : studentRecords.length === 0 ? (
                <EmptyStateRow columnsCount={9} />
              ) : (
                studentRecords.map((studentAccount, index) => (
                  <tr key={studentAccount._id || index} className="hover:bg-slate-800/40 transition">
                    <TableCell>
                      <div className="font-semibold text-white">{studentAccount.fullName || '—'}</div>
                      {studentAccount.email && (
                        <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-500 font-mono">
                          <Mail className="h-3 w-3" />
                          {studentAccount.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 font-mono text-amber-300 font-bold">
                        <Hash className="h-3 w-3" />
                        {studentAccount.grNumber || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {studentAccount.globalStudentId ? (
                        <span className="inline-flex items-center gap-1 font-mono text-cyan-400 text-[11px] bg-cyan-950/40 border border-cyan-800/40 rounded px-1.5 py-0.5">
                          <IdCard className="h-3 w-3" />
                          {studentAccount.globalStudentId}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[140px]">{studentAccount.schoolId?.name || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span>{studentAccount.classId?.name || '—'}</span>
                        {studentAccount.sectionId?.name && (
                          <span className="text-slate-400 ml-1">/ {studentAccount.sectionId.name}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-medium ${
                          studentAccount.gender === 'MALE'
                            ? 'text-blue-400'
                            : studentAccount.gender === 'FEMALE'
                            ? 'text-pink-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {studentAccount.gender || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="truncate max-w-[120px] text-slate-300">
                        {studentAccount.fatherOrGuardianName || '—'}
                      </div>
                      {studentAccount.guardianContactNumber && (
                        <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-500">
                          <Phone className="h-3 w-3" />
                          {studentAccount.guardianContactNumber}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-slate-400">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-600" />
                        {studentAccount.admissionDate ? formatDisplayDate(studentAccount.admissionDate) : '—'}
                      </div>
                      {studentAccount.admissionType && (
                        <div className="text-[10px] text-slate-600 font-mono mt-0.5">
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
  const [guardianRecords, setGuardianRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
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
        let guardiansList = response.data.data?.users || [];
        if (searchQuery.trim()) {
          const lowerQuery = searchQuery.trim().toLowerCase();
          guardiansList = guardiansList.filter(
            (guardian) =>
              (guardian.fullName || '').toLowerCase().includes(lowerQuery) ||
              (guardian.email || '').toLowerCase().includes(lowerQuery) ||
              (guardian.phoneNumber || '').includes(searchQuery.trim())
          );
        }
        setGuardianRecords(guardiansList);
        setTotalCount(guardiansList.length);
      }
    } catch (fetchError) {
      toast.error('Failed to retrieve guardians directory records.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedStatus]);

  useEffect(() => {
    fetchGuardiansData();
  }, [fetchGuardiansData]);

  const handleExportGuardiansCsv = () => {
    const exportParameters = {};
    if (searchQuery.trim()) exportParameters.search = searchQuery.trim();
    if (selectedStatus) exportParameters.status = selectedStatus;

    downloadCsvFile('/exports/guardians.csv', `guardians_directory_${formatDisplayDate(new Date())}.csv`, exportParameters, setIsExporting);
  };

  return (
    <div className="space-y-4">
      <DirectoryFilterToolbar
        totalRecordsCount={totalCount}
        entityLabelSingular="guardians"
        onRefreshTriggered={fetchGuardiansData}
        isLoadingData={isLoading}
        onExportTriggered={handleExportGuardiansCsv}
        isExportingData={isExporting}
        exportButtonColorClass="bg-rose-700 hover:bg-rose-600"
      >
        <SearchInputField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholderText="Search name, email, or phone..."
          focusBorderColorClass="focus:border-rose-500"
        />
        <FilterDropdownSelect
          value={selectedStatus}
          onChange={setSelectedStatus}
          focusBorderColorClass="focus:border-rose-500"
        >
          <option value="">All Statuses</option>
          {['ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED', 'INACTIVE'].map((statusName) => (
            <option key={statusName} value={statusName}>
              {statusName.replace(/_/g, ' ')}
            </option>
          ))}
        </FilterDropdownSelect>
      </DirectoryFilterToolbar>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                {['Guardian', 'Email', 'Phone', 'Linked Students', 'Status', 'Registered'].map((headerTitle) => (
                  <th key={headerTitle} className="px-4 py-3">{headerTitle}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <LoadingSkeletonRow columnsCount={6} />
              ) : guardianRecords.length === 0 ? (
                <EmptyStateRow columnsCount={6} />
              ) : (
                guardianRecords.map((guardianAccount) => (
                  <tr key={guardianAccount._id} className="hover:bg-slate-800/40 transition">
                    <TableCell>
                      <div className="font-semibold text-white">{guardianAccount.fullName}</div>
                    </TableCell>
                    <TableCell>
                      {guardianAccount.email ? (
                        <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                          <Mail className="h-3 w-3 text-slate-500" />
                          {guardianAccount.email}
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {guardianAccount.phoneNumber ? (
                        <div className="flex items-center gap-1 text-slate-400">
                          <Phone className="h-3 w-3 text-slate-500" />
                          {guardianAccount.phoneNumber}
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">
                        <GraduationCap className="h-3 w-3 text-amber-400" />
                        <span className="text-amber-300 font-semibold">{guardianAccount.linkedStudentsCount ?? '?'}</span>
                        <span>linked</span>
                      </span>
                      <p className="text-[10px] text-slate-600 mt-0.5">Full list available in CSV export</p>
                    </TableCell>
                    <TableCell>{renderStatusBadge(guardianAccount.status)}</TableCell>
                    <TableCell className="text-slate-500 font-mono whitespace-nowrap">
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
    activeStyle: 'border-emerald-500 text-emerald-400',
    hoverStyle:  'hover:text-emerald-400 hover:border-emerald-600/40',
  },
  students: {
    activeStyle: 'border-blue-500 text-blue-400',
    hoverStyle:  'hover:text-blue-400 hover:border-blue-600/40',
  },
  guardians: {
    activeStyle: 'border-rose-500 text-rose-400',
    hoverStyle:  'hover:text-rose-400 hover:border-rose-600/40',
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
        <div className="flex items-center gap-0 border-b border-slate-800 overflow-x-auto">
          {visibleTabsList.map((tabConfig) => {
            const TabIconComponent = tabConfig.icon;
            const accentStyleConfig = TAB_ACCENT_STYLES[tabConfig.id];
            const isTabActive = activeTabId === tabConfig.id;
            return (
              <button
                key={tabConfig.id}
                type="button"
                onClick={() => setActiveTabId(tabConfig.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                  isTabActive
                    ? accentStyleConfig.activeStyle
                    : `border-transparent text-slate-500 ${accentStyleConfig.hoverStyle}`
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
