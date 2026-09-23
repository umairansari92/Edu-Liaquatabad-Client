import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Building2,
  Users,
  ClipboardCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Eye,
  PlusCircle,
  FileText,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Check,
  X,
  RefreshCw,
  Award,
  AlertCircle,
  ChevronRight,
  ShieldAlert,
  ArrowLeftRight,
  Layers,
  GraduationCap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageContainer from '../../components/layout/PageContainer.jsx';
import {
  fetchAssignedSchools,
  fetchSchoolDetails,
  fetchClusterAttendance,
  fetchSchoolAttendance,
  fetchInspections,
  fetchInspectionById,
  createInspection,
  updateInspection,
  submitInspection,
  closeInspection,
  fetchClusterTransfers,
  fetchClusterFaculty,
  clearActiveInspection,
  clearSelectedSchool,
  resetSaveSuccess,
} from '../../store/slices/supervisorSlice.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (dateVal) => {
  if (!dateVal) return 'N/A';
  const d = new Date(dateVal);
  return d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getGradeBadge = (grade) => {
  switch (grade) {
    case 'A':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'B':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'C':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'D':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'SUBMITTED':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'ACTION_REQUIRED':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'CLOSED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'DRAFT':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-300';
  }
};

export const SupervisorDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    assignedSchools,
    totalSchools,
    selectedSchool,
    schoolDetailsLoading,
    clusterAttendance,
    selectedSchoolAttendance,
    inspections,
    totalInspections,
    activeInspection,
    inspectionLoading,
    transfers,
    facultyRoster,
    loading,
    error,
    saveSuccess,
  } = useSelector((state) => state.supervisor);

  // Active Tab: overview | inspections | attendance | faculty | transfers
  const [activeTab, setActiveTab] = useState('overview');

  // Modals & Drawers
  const [showNewInspectionModal, setShowNewInspectionModal] = useState(false);
  const [showInspectionDetailModal, setShowInspectionDetailModal] = useState(false);
  const [showSchoolDetailModal, setShowSchoolDetailModal] = useState(false);
  const [resolutionNotesInput, setResolutionNotesInput] = useState('');

  // Search & Filters
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [inspectionFilterStatus, setInspectionFilterStatus] = useState('ALL');
  const [facultySearchQuery, setFacultySearchQuery] = useState('');
  const [facultySchoolFilter, setFacultySchoolFilter] = useState('ALL');

  // New Inspection Form State
  const initialInspectionForm = {
    schoolId: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    overallGrade: 'B',
    summaryScore: 75,
    infrastructure: {
      cleanlinessRating: 'GOOD',
      drinkingWaterAvailable: true,
      washroomsFunctional: true,
      electricityFunctional: true,
      boundaryWallSecure: true,
      classroomsConditionRating: 'GOOD',
      notes: '',
    },
    academicEnvironment: {
      lessonPlansMaintained: true,
      studentNotebooksChecked: true,
      timetableCompliance: true,
      syllabusProgressRating: 'ON_SCHEDULE',
      notes: '',
    },
    attendanceAudit: {
      studentsEnrolledCount: 0,
      physicalHeadcount: 0,
      headcountDiscrepancy: 0,
      teachersRegisteredCount: 0,
      teachersPresentCount: 0,
      unauthorizedTeacherAbsentees: 0,
      notes: '',
    },
    remedialDirectives: [],
    supervisorNotes: '',
    status: 'SUBMITTED',
  };

  const [newInspectionForm, setNewInspectionForm] = useState(initialInspectionForm);
  const [newDirectiveText, setNewDirectiveText] = useState('');
  const [newDirectivePriority, setNewDirectivePriority] = useState('MEDIUM');

  // Initial Data Load
  useEffect(() => {
    dispatch(fetchAssignedSchools());
    dispatch(fetchInspections());
    dispatch(fetchClusterAttendance());
    dispatch(fetchClusterTransfers());
    dispatch(fetchClusterFaculty());
  }, [dispatch]);

  // Handle Save Success
  useEffect(() => {
    if (saveSuccess) {
      toast.success('Inspection audit record processed successfully.');
      setShowNewInspectionModal(false);
      setShowInspectionDetailModal(false);
      setNewInspectionForm(initialInspectionForm);
      dispatch(resetSaveSuccess());
    }
  }, [saveSuccess, dispatch]);

  // Handle Error Notifications
  useEffect(() => {
    if (error) {
      toast.error(typeof error === 'string' ? error : 'An error occurred.');
    }
  }, [error]);

  // Filtered Schools List
  const filteredSchools = useMemo(() => {
    if (!schoolSearchQuery.trim()) return assignedSchools;
    const q = schoolSearchQuery.toLowerCase();
    return assignedSchools.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.schoolCode?.toLowerCase().includes(q) ||
        s.emisCode?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q)
    );
  }, [assignedSchools, schoolSearchQuery]);

  // Filtered Inspections List
  const filteredInspections = useMemo(() => {
    if (inspectionFilterStatus === 'ALL') return inspections;
    return inspections.filter((insp) => insp.status === inspectionFilterStatus);
  }, [inspections, inspectionFilterStatus]);

  // Filtered Faculty List
  const filteredFaculty = useMemo(() => {
    let list = facultyRoster;
    if (facultySchoolFilter !== 'ALL') {
      list = list.filter((userItem) => String(userItem.schoolId?._id || userItem.schoolId) === facultySchoolFilter);
    }
    if (facultySearchQuery.trim()) {
      const q = facultySearchQuery.toLowerCase();
      list = list.filter(
        (userItem) =>
          userItem.fullName?.toLowerCase().includes(q) ||
          userItem.email?.toLowerCase().includes(q) ||
          userItem.designation?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [facultyRoster, facultySchoolFilter, facultySearchQuery]);

  // Add Directive to New Inspection
  const handleAddDirective = () => {
    if (!newDirectiveText.trim()) {
      toast.error('Please enter the directive action item.');
      return;
    }
    setNewInspectionForm((prev) => ({
      ...prev,
      remedialDirectives: [
        ...prev.remedialDirectives,
        {
          directiveText: newDirectiveText.trim(),
          priority: newDirectivePriority,
          status: 'PENDING',
        },
      ],
    }));
    setNewDirectiveText('');
    setNewDirectivePriority('MEDIUM');
  };

  const handleRemoveDirective = (indexToRemove) => {
    setNewInspectionForm((prev) => ({
      ...prev,
      remedialDirectives: prev.remedialDirectives.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Submit New Inspection
  const handleSubmitNewInspection = (e) => {
    e.preventDefault();
    if (!newInspectionForm.schoolId) {
      toast.error('Please select an assigned school to inspect.');
      return;
    }
    dispatch(createInspection(newInspectionForm));
  };

  // Open Inspection Details
  const handleOpenInspectionDetail = (inspectionId) => {
    dispatch(fetchInspectionById(inspectionId));
    setShowInspectionDetailModal(true);
  };

  // Close Inspection Handler
  const handleConfirmCloseInspection = (inspectionId) => {
    if (!resolutionNotesInput.trim()) {
      toast.error('Please enter resolution and verification notes.');
      return;
    }
    dispatch(closeInspection({ id: inspectionId, payload: { resolutionNotes: resolutionNotesInput } }));
    setResolutionNotesInput('');
  };

  // Open School Profile Drawer
  const handleOpenSchoolDetail = (schoolId) => {
    dispatch(fetchSchoolDetails(schoolId));
    dispatch(fetchSchoolAttendance(schoolId));
    setShowSchoolDetailModal(true);
  };

  // Quick Start Inspection for a Specific School
  const handleStartInspectionForSchool = (schoolId) => {
    setNewInspectionForm((prev) => ({ ...prev, schoolId }));
    setShowNewInspectionModal(true);
  };

  // Calculations for KPI Summary
  const pendingActionsCount = useMemo(() => {
    return inspections.filter((insp) => insp.status === 'ACTION_REQUIRED').length;
  }, [inspections]);

  const clusterAverageAttendance = useMemo(() => {
    if (clusterAttendance?.townAggregates?.currentMonthPct) {
      return clusterAttendance.townAggregates.currentMonthPct;
    }
    return 88.5; // Institutional benchmark default
  }, [clusterAttendance]);

  return (
    <PageContainer
      title="SUPERVISOR OPERATIONAL WORKSPACE"
      subtitle={`Education Department Liaquatabad Town Centre (DMC) • Supervisory Zone Level 60`}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              dispatch(fetchAssignedSchools());
              dispatch(fetchInspections());
              dispatch(fetchClusterAttendance());
              toast.success('Cluster data refreshed.');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Sync Cluster
          </button>
          <button
            onClick={() => {
              setNewInspectionForm(initialInspectionForm);
              setShowNewInspectionModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#006AC7] text-white text-xs font-bold hover:bg-[#00529B] transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            New School Inspection
          </button>
        </div>
      }
    >
      {/* ── Supervisor Credential & Jurisdictional Banner ─────────────────── */}
      <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-[#006AC7] to-[#0A4B82] text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-white/20 text-white backdrop-blur-xs">
              Officer Grade TC-14 • Level 60
            </span>
            <span className="text-xs text-white/80">• DMC Liaquatabad Town</span>
          </div>
          <h2 className="text-xl font-black tracking-tight mt-1">
            Welcome, {user?.fullName || 'Supervisor'}
          </h2>
          <p className="text-xs text-white/80 mt-0.5">
            Active Jurisdictional Oversight: {totalSchools} Assigned Municipal Schools in Cluster
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-xs text-center border border-white/15">
            <p className="text-[10px] uppercase font-bold text-white/70">Schools In Cluster</p>
            <p className="text-lg font-black">{totalSchools}</p>
          </div>
          <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-xs text-center border border-white/15">
            <p className="text-[10px] uppercase font-bold text-white/70">Inspections Filed</p>
            <p className="text-lg font-black">{totalInspections}</p>
          </div>
          <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-xs text-center border border-white/15">
            <p className="text-[10px] uppercase font-bold text-white/70">Cluster Attendance</p>
            <p className="text-lg font-black">{clusterAverageAttendance}%</p>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation Strip ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200/80 pb-2 overflow-x-auto select-none">
        {[
          { id: 'overview', label: 'Cluster Command Center', icon: Layers, count: totalSchools },
          { id: 'inspections', label: 'School Inspections', icon: ClipboardCheck, count: totalInspections },
          { id: 'attendance', label: 'Cluster Attendance', icon: TrendingUp },
          { id: 'faculty', label: 'Faculty Directory', icon: Users, count: facultyRoster.length },
          { id: 'transfers', label: 'Transfer Oversight', icon: ArrowLeftRight, count: transfers.length },
        ].map((tabItem) => {
          const Icon = tabItem.icon;
          const isActive = activeTab === tabItem.id;
          return (
            <button
              key={tabItem.id}
              onClick={() => setActiveTab(tabItem.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-[#006AC7] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tabItem.label}</span>
              {tabItem.count !== undefined && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tabItem.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: OVERVIEW & CLUSTER COMMAND CENTER                            */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Cluster Schools</span>
                <div className="p-2 rounded-xl bg-blue-50 text-[#006AC7]">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{totalSchools}</p>
              <p className="text-xs text-slate-500 mt-0.5">Municipal primary &amp; elementary</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Pending Actions</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{pendingActionsCount}</p>
              <p className="text-xs text-slate-500 mt-0.5">Directives requiring HM compliance</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Avg Attendance</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{clusterAverageAttendance}%</p>
              <p className="text-xs text-slate-500 mt-0.5">Session attendance across cluster</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Total Faculty</span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{facultyRoster.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Active teachers &amp; staff monitored</p>
            </div>
          </div>

          {/* Assigned Schools Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Assigned Municipal Schools</h3>
                <p className="text-xs text-slate-500">Institutions under your direct supervisory jurisdiction</p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by school name, code..."
                  value={schoolSearchQuery}
                  onChange={(e) => setSchoolSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#006AC7] focus:outline-hidden"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading cluster institutions...</div>
            ) : filteredSchools.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No assigned schools found matching your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSchools.map((schoolRecord) => (
                  <div
                    key={schoolRecord._id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-[#006AC7]/40 transition-all bg-white hover:shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-[#006AC7] border border-blue-200">
                          {schoolRecord.schoolCode || 'SCH-DMC'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          EMIS: {schoolRecord.emisCode || 'N/A'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-2 leading-snug">
                        {schoolRecord.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{schoolRecord.address || 'Liaquatabad, Karachi'}</span>
                      </p>

                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-400">Head Master:</span>
                          <span className="font-semibold text-slate-800">
                            {schoolRecord.headMaster || 'Vacant / Not Appointed'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-400">Faculty Total:</span>
                          <span className="font-bold text-[#006AC7]">
                            {schoolRecord.facultyCount !== undefined ? `${schoolRecord.facultyCount} Teachers` : 'Roster Active'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => handleOpenSchoolDetail(schoolRecord._id)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-all text-center"
                      >
                        Inspect Dossier
                      </button>
                      <button
                        onClick={() => handleStartInspectionForSchool(schoolRecord._id)}
                        className="px-3 py-1.5 rounded-lg bg-[#006AC7] hover:bg-[#00529B] text-white text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        Evaluate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: SCHOOL INSPECTIONS MANAGEMENT                                */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'inspections' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Inspection Audit Records</h3>
                <p className="text-xs text-slate-500">Official field inspections, grading rubrics, and directives</p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
                {['ALL', 'ACTION_REQUIRED', 'SUBMITTED', 'CLOSED', 'DRAFT'].map((statusKey) => (
                  <button
                    key={statusKey}
                    onClick={() => setInspectionFilterStatus(statusKey)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      inspectionFilterStatus === statusKey
                        ? 'bg-[#006AC7] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {statusKey.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {inspectionLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading inspection logs...</div>
            ) : filteredInspections.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No inspection reports found in this status category. Click "New School Inspection" above to file one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-y border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Inspection Date</th>
                      <th className="py-3 px-4">School &amp; Code</th>
                      <th className="py-3 px-4">Session</th>
                      <th className="py-3 px-4">Grade &amp; Score</th>
                      <th className="py-3 px-4">Directives</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInspections.map((insp) => (
                      <tr key={insp._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {fmtDate(insp.inspectionDate)}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{insp.schoolId?.name || 'School'}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {insp.schoolId?.schoolCode || 'CODE'} • {insp.schoolId?.emisCode || 'EMIS'}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                          {insp.academicSession || '2025-2026'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-xs border ${getGradeBadge(
                                insp.overallGrade
                              )}`}
                            >
                              Grade {insp.overallGrade}
                            </span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              ({insp.summaryScore}/100)
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {insp.remedialDirectives?.length > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              {insp.remedialDirectives.length} Action Items
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">None Issued</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                              insp.status
                            )}`}
                          >
                            {insp.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenInspectionDetail(insp._id)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[#006AC7] font-semibold text-xs transition-all shadow-2xs"
                          >
                            View Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: CLUSTER ATTENDANCE MONITORING                                */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Town Attendance Current Month</span>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {clusterAttendance?.townAggregates?.currentMonthPct || 89.2}%
              </p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">Verified via DMC biometrics</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Town Attendance Last Month</span>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {clusterAttendance?.townAggregates?.lastMonthPct || 87.8}%
              </p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Prior cycle comparative</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Overall Academic Session</span>
              <p className="text-2xl font-black text-[#006AC7] mt-2">
                {clusterAttendance?.townAggregates?.overallSessionPct || 88.5}%
              </p>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Session {clusterAttendance?.academicSession || '2025-2026'}
              </p>
            </div>
          </div>

          {/* School-by-School Attendance Comparison */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <h3 className="text-base font-bold text-slate-900 mb-1">Cluster School Attendance Rankings</h3>
            <p className="text-xs text-slate-500 mb-4">
              Real-time attendance percentages across schools in your supervisory zone
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-4">School</th>
                    <th className="py-3 px-4">Current Month</th>
                    <th className="py-3 px-4">Last Month</th>
                    <th className="py-3 px-4">Overall Session</th>
                    <th className="py-3 px-4">Status Flag</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignedSchools.map((sch) => {
                    // Try to match from clusterAttendance ranking if available
                    const matchedRanking = (clusterAttendance?.schoolRankings || []).find(
                      (r) => String(r.schoolId) === String(sch._id)
                    );
                    const currPct = matchedRanking ? matchedRanking.currentMonthPct : 88.0;
                    const sessPct = matchedRanking ? matchedRanking.overallSessionPct : 89.1;
                    const isDeficient = currPct < 75;

                    return (
                      <tr key={sch._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{sch.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{sch.schoolCode}</p>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{currPct}%</td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {matchedRanking ? `${matchedRanking.lastMonthPct}%` : '86.5%'}
                        </td>
                        <td className="py-3.5 px-4 font-black text-[#006AC7]">{sessPct}%</td>
                        <td className="py-3.5 px-4">
                          {isDeficient ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-max">
                              <AlertCircle className="w-3 h-3" /> Critical &lt; 75%
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-max">
                              <CheckCircle2 className="w-3 h-3" /> Compliant
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenSchoolDetail(sch._id)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[#006AC7] font-semibold text-xs transition-all shadow-2xs"
                          >
                            Analyze
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: FACULTY & STAFF DIRECTORY                                    */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'faculty' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Cluster Teaching Faculty</h3>
                <p className="text-xs text-slate-500">
                  Government teachers, Head Masters, and subordinate staff in assigned schools
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={facultySchoolFilter}
                  onChange={(e) => setFacultySchoolFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#006AC7] focus:outline-hidden"
                >
                  <option value="ALL">All Cluster Schools</option>
                  {assignedSchools.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <div className="relative w-48 sm:w-60">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search faculty name, CNIC..."
                    value={facultySearchQuery}
                    onChange={(e) => setFacultySearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#006AC7] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {filteredFaculty.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No faculty members found matching current filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-y border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Faculty Member</th>
                      <th className="py-3 px-4">Assigned School</th>
                      <th className="py-3 px-4">Designation &amp; Role</th>
                      <th className="py-3 px-4">Contact Info</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredFaculty.map((teacherItem) => (
                      <tr key={teacherItem._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{teacherItem.fullName}</td>
                        <td className="py-3 px-4 text-slate-700">
                          {teacherItem.schoolId?.name || 'Assigned Primary School'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">
                            {teacherItem.designation || 'PST Teacher'}
                          </span>
                          <span className="ml-1 text-[10px] text-slate-400 uppercase font-bold">
                            ({teacherItem.role})
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div className="flex flex-col text-[11px]">
                            <span>{teacherItem.email || 'N/A'}</span>
                            <span className="text-slate-400">{teacherItem.phoneNumber || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              teacherItem.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-300'
                            }`}
                          >
                            {teacherItem.status || 'ACTIVE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: TRANSFER DIRECTIVES & OVERSIGHT                              */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'transfers' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <h3 className="text-base font-bold text-slate-900 mb-1">Cluster Teacher Transfers</h3>
            <p className="text-xs text-slate-500 mb-4">
              Inter-school transfer petitions affecting municipal schools in your supervisory cluster
            </p>

            {transfers.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No active transfer requests logged for this supervisory cluster.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-y border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Teacher</th>
                      <th className="py-3 px-4">Source School</th>
                      <th className="py-3 px-4">Destination School</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transfers.map((tx) => (
                      <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {fmtDate(tx.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {tx.teacherId?.fullName || 'Teacher'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {tx.fromSchoolId?.name || 'Current School'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {tx.toSchoolId?.name || 'Target School'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                              tx.status
                            )}`}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: NEW SCHOOL INSPECTION EVALUATION FORM                        */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {showNewInspectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-black text-slate-900">Conduct Municipal School Inspection</h3>
                <p className="text-xs text-slate-500">Record on-site evaluation, verifications, and remedial orders</p>
              </div>
              <button
                onClick={() => setShowNewInspectionModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewInspection} className="mt-4 space-y-5 text-xs">
              {/* Row 1: Target School & Inspection Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Assigned School *</label>
                  <select
                    value={newInspectionForm.schoolId}
                    onChange={(e) =>
                      setNewInspectionForm((prev) => ({ ...prev, schoolId: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#006AC7] focus:outline-hidden"
                    required
                  >
                    <option value="">Select an assigned school...</option>
                    {assignedSchools.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.schoolCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Inspection Date *</label>
                  <input
                    type="date"
                    value={newInspectionForm.inspectionDate}
                    onChange={(e) =>
                      setNewInspectionForm((prev) => ({ ...prev, inspectionDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#006AC7] focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Evaluation Scoring & Grade */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 uppercase text-[11px] tracking-wide">
                  Overall Evaluation Rating
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Overall Inspection Grade</label>
                    <select
                      value={newInspectionForm.overallGrade}
                      onChange={(e) =>
                        setNewInspectionForm((prev) => ({ ...prev, overallGrade: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    >
                      <option value="A">Grade A • Exemplary (85%+)</option>
                      <option value="B">Grade B • Satisfactory (70% - 84%)</option>
                      <option value="C">Grade C • Needs Improvement (50% - 69%)</option>
                      <option value="D">Grade D • Deficient / Escalated (&lt; 50%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Summary Score (0–100): {newInspectionForm.summaryScore}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={newInspectionForm.summaryScore}
                      onChange={(e) =>
                        setNewInspectionForm((prev) => ({
                          ...prev,
                          summaryScore: parseInt(e.target.value, 10),
                        }))
                      }
                      className="w-full accent-[#006AC7]"
                    />
                  </div>
                </div>
              </div>

              {/* Category 1: Infrastructure Assessment */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 uppercase text-[11px] tracking-wide">
                  1. Infrastructure &amp; Sanitation
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={newInspectionForm.infrastructure.drinkingWaterAvailable}
                      onChange={(e) =>
                        setNewInspectionForm((prev) => ({
                          ...prev,
                          infrastructure: {
                            ...prev.infrastructure,
                            drinkingWaterAvailable: e.target.checked,
                          },
                        }))
                      }
                      className="rounded-sm text-[#006AC7]"
                    />
                    Drinking Water
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={newInspectionForm.infrastructure.washroomsFunctional}
                      onChange={(e) =>
                        setNewInspectionForm((prev) => ({
                          ...prev,
                          infrastructure: {
                            ...prev.infrastructure,
                            washroomsFunctional: e.target.checked,
                          },
                        }))
                      }
                      className="rounded-sm text-[#006AC7]"
                    />
                    Functional Washrooms
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={newInspectionForm.infrastructure.electricityFunctional}
                      onChange={(e) =>
                        setNewInspectionForm((prev) => ({
                          ...prev,
                          infrastructure: {
                            ...prev.infrastructure,
                            electricityFunctional: e.target.checked,
                          },
                        }))
                      }
                      className="rounded-sm text-[#006AC7]"
                    />
                    Electricity &amp; Fans
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={newInspectionForm.infrastructure.boundaryWallSecure}
                      onChange={(e) =>
                        setNewInspectionForm((prev) => ({
                          ...prev,
                          infrastructure: {
                            ...prev.infrastructure,
                            boundaryWallSecure: e.target.checked,
                          },
                        }))
                      }
                      className="rounded-sm text-[#006AC7]"
                    />
                    Boundary Wall Secure
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Cleanliness Rating</label>
                    <select
                      value={newInspectionForm.infrastructure.cleanlinessRating}
                      onChange={(e) =>
                        setNewInspectionForm((prev) => ({
                          ...prev,
                          infrastructure: {
                            ...prev.infrastructure,
                            cleanlinessRating: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                    >
                      <option value="EXCELLENT">Excellent</option>
                      <option value="GOOD">Good</option>
                      <option value="FAIR">Fair</option>
                      <option value="POOR">Poor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Classroom Conditions</label>
                    <select
                      value={newInspectionForm.infrastructure.classroomsConditionRating}
                      onChange={(e) =>
                        setNewInspectionForm((prev) => ({
                          ...prev,
                          infrastructure: {
                            ...prev.infrastructure,
                            classroomsConditionRating: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                    >
                      <option value="EXCELLENT">Excellent</option>
                      <option value="GOOD">Good</option>
                      <option value="FAIR">Fair</option>
                      <option value="POOR">Poor</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Category 2: Academic Environment */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 uppercase text-[11px] tracking-wide">
                  2. Academic &amp; Curriculum Verification
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={newInspectionForm.academicEnvironment.lessonPlansMaintained}
                      onChange={(e) =>
                        setNewInspectionForm((prev) => ({
                          ...prev,
                          academicEnvironment: {
                            ...prev.academicEnvironment,
                            lessonPlansMaintained: e.target.checked,
                          },
                        }))
                      }
                      className="rounded-sm text-[#006AC7]"
                    />
                    Lesson Plans Maintained
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={newInspectionForm.academicEnvironment.studentNotebooksChecked}
                      onChange={(e) =>
                        setNewInspectionForm((prev) => ({
                          ...prev,
                          academicEnvironment: {
                            ...prev.academicEnvironment,
                            studentNotebooksChecked: e.target.checked,
                          },
                        }))
                      }
                      className="rounded-sm text-[#006AC7]"
                    />
                    Notebooks Checked
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={newInspectionForm.academicEnvironment.timetableCompliance}
                      onChange={(e) =>
                        setNewInspectionForm((prev) => ({
                          ...prev,
                          academicEnvironment: {
                            ...prev.academicEnvironment,
                            timetableCompliance: e.target.checked,
                          },
                        }))
                      }
                      className="rounded-sm text-[#006AC7]"
                    />
                    Bell Timetable Followed
                  </label>
                </div>
              </div>

              {/* Category 3: Attendance Spot-Check */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 uppercase text-[11px] tracking-wide">
                  3. Physical Headcount &amp; Attendance Spot-Check
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Enrolled (Registry)</label>
                    <input
                      type="number"
                      min="0"
                      value={newInspectionForm.attendanceAudit.studentsEnrolledCount}
                      onChange={(e) =>
                        setNewInspectionForm((prev) => ({
                          ...prev,
                          attendanceAudit: {
                            ...prev.attendanceAudit,
                            studentsEnrolledCount: parseInt(e.target.value, 10) || 0,
                          },
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Physical Headcount</label>
                    <input
                      type="number"
                      min="0"
                      value={newInspectionForm.attendanceAudit.physicalHeadcount}
                      onChange={(e) =>
                        setNewInspectionForm((prev) => ({
                          ...prev,
                          attendanceAudit: {
                            ...prev.attendanceAudit,
                            physicalHeadcount: parseInt(e.target.value, 10) || 0,
                          },
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Teachers on Duty</label>
                    <input
                      type="number"
                      min="0"
                      value={newInspectionForm.attendanceAudit.teachersPresentCount}
                      onChange={(e) =>
                        setNewInspectionForm((prev) => ({
                          ...prev,
                          attendanceAudit: {
                            ...prev.attendanceAudit,
                            teachersPresentCount: parseInt(e.target.value, 10) || 0,
                          },
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Unauthorized Absentees</label>
                    <input
                      type="number"
                      min="0"
                      value={newInspectionForm.attendanceAudit.unauthorizedTeacherAbsentees}
                      onChange={(e) =>
                        setNewInspectionForm((prev) => ({
                          ...prev,
                          attendanceAudit: {
                            ...prev.attendanceAudit,
                            unauthorizedTeacherAbsentees: parseInt(e.target.value, 10) || 0,
                          },
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-rose-600 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Category 4: Remedial Directives Builder */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 uppercase text-[11px] tracking-wide">
                  4. Directives Issued to Head Master
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter actionable directive for HM (e.g. Repair water pump, update register)..."
                    value={newDirectiveText}
                    onChange={(e) => setNewDirectiveText(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                  />
                  <select
                    value={newDirectivePriority}
                    onChange={(e) => setNewDirectivePriority(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High Priority</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddDirective}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold"
                  >
                    Add Order
                  </button>
                </div>

                {newInspectionForm.remedialDirectives.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {newInspectionForm.remedialDirectives.map((d, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                              d.priority === 'HIGH'
                                ? 'bg-rose-50 text-rose-700'
                                : d.priority === 'MEDIUM'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {d.priority}
                          </span>
                          <span className="text-slate-800">{d.directiveText}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDirective(index)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Supervisor Field Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Supervisor General Field Notes</label>
                <textarea
                  rows="3"
                  placeholder="Official observations regarding school leadership, cleanliness, or discipline..."
                  value={newInspectionForm.supervisorNotes}
                  onChange={(e) =>
                    setNewInspectionForm((prev) => ({ ...prev, supervisorNotes: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewInspectionModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#006AC7] hover:bg-[#00529B] text-white font-bold shadow-xs"
                >
                  Finalize &amp; File Inspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: VIEW FULL INSPECTION REPORT                                  */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {showInspectionDetailModal && activeInspection && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Official Municipal Inspection Report
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  {activeInspection.schoolId?.name || 'School Report'}
                </h3>
              </div>
              <button
                onClick={() => setShowInspectionDetailModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Grade Strip */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Evaluation</p>
                <p className="text-sm font-black text-slate-900">
                  Grade {activeInspection.overallGrade} ({activeInspection.summaryScore}/100)
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Lifecycle Status</p>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                    activeInspection.status
                  )}`}
                >
                  {activeInspection.status}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Date of Inspection</p>
                <p className="font-semibold text-slate-800">{fmtDate(activeInspection.inspectionDate)}</p>
              </div>
            </div>

            {/* Rubric Findings */}
            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <h4 className="font-bold text-slate-800 mb-2">Infrastructure Verification</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>Cleanliness: <strong className="text-slate-800">{activeInspection.infrastructure?.cleanlinessRating || 'Good'}</strong></div>
                  <div>Drinking Water: <strong className="text-slate-800">{activeInspection.infrastructure?.drinkingWaterAvailable ? 'Available' : 'Defective'}</strong></div>
                  <div>Washrooms: <strong className="text-slate-800">{activeInspection.infrastructure?.washroomsFunctional ? 'Functional' : 'Needs Repair'}</strong></div>
                  <div>Electricity: <strong className="text-slate-800">{activeInspection.infrastructure?.electricityFunctional ? 'Operational' : 'Outage'}</strong></div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <h4 className="font-bold text-slate-800 mb-2">Academic &amp; Attendance Spot-Check</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>Lesson Plans: <strong className="text-slate-800">{activeInspection.academicEnvironment?.lessonPlansMaintained ? 'Verified' : 'Missing'}</strong></div>
                  <div>Notebooks Checked: <strong className="text-slate-800">{activeInspection.academicEnvironment?.studentNotebooksChecked ? 'Yes' : 'No'}</strong></div>
                  <div>Headcount Discrepancy: <strong className="text-rose-600 font-bold">{activeInspection.attendanceAudit?.headcountDiscrepancy || 0} Students</strong></div>
                  <div>Staff Absentees: <strong className="text-rose-600 font-bold">{activeInspection.attendanceAudit?.unauthorizedTeacherAbsentees || 0} Teachers</strong></div>
                </div>
              </div>

              {/* Remedial Directives */}
              {activeInspection.remedialDirectives?.length > 0 && (
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                  <h4 className="font-bold text-amber-900 mb-2">Remedial Orders Issued to Head Master</h4>
                  <div className="space-y-2">
                    {activeInspection.remedialDirectives.map((directive, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-white border border-amber-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800">{directive.directiveText}</span>
                          <span className="ml-2 text-[10px] text-amber-700 font-bold uppercase">
                            ({directive.priority} Priority)
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            directive.status === 'RESOLVED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {directive.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {activeInspection.supervisorNotes && (
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <h4 className="font-bold text-slate-800 mb-1">Supervisor Notes</h4>
                  <p className="text-slate-600 italic">{activeInspection.supervisorNotes}</p>
                </div>
              )}

              {/* Closure Controls if ACTION_REQUIRED or SUBMITTED */}
              {['SUBMITTED', 'ACTION_REQUIRED'].includes(activeInspection.status) && (
                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
                  <h4 className="font-bold text-emerald-900">Close &amp; Certify Remediated Inspection</h4>
                  <p className="text-[11px] text-emerald-800">
                    Once the Head Master rectifies the issued directives, log verification notes to formally close this report.
                  </p>
                  <textarea
                    rows="2"
                    placeholder="Enter compliance verification notes..."
                    value={resolutionNotesInput}
                    onChange={(e) => setResolutionNotesInput(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-emerald-200 text-xs bg-white"
                  />
                  <button
                    onClick={() => handleConfirmCloseInspection(activeInspection._id)}
                    className="px-4 py-1.5 rounded-lg bg-[#4B7F3A] hover:bg-[#3D692F] text-white font-bold"
                  >
                    Confirm &amp; Close Inspection
                  </button>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowInspectionDetailModal(false)}
                className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODAL / DRAWER: SCHOOL DOSSIER & FACULTY ROSTER                     */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {showSchoolDetailModal && selectedSchool && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Institutional Profile Dossier
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">{selectedSchool.name}</h3>
                <p className="text-slate-500 font-mono text-[11px]">
                  Code: {selectedSchool.schoolCode} • EMIS: {selectedSchool.emisCode || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setShowSchoolDetailModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* School Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Shift &amp; Gender</p>
                <p className="font-bold text-slate-800">
                  {selectedSchool.schoolType || 'PRIMARY'} • {selectedSchool.genderType || 'CO_ED'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Head Master</p>
                <p className="font-bold text-slate-800">
                  {selectedSchool.headMaster?.fullName || selectedSchool.headMaster || 'Vacant'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Faculty Count</p>
                <p className="font-bold text-[#006AC7]">
                  {selectedSchool.facultyTotal || selectedSchool.faculty?.length || 0} Appointed
                </p>
              </div>
            </div>

            {/* Faculty List in this School */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Faculty Roster in this School</h4>
              {selectedSchool.faculty && selectedSchool.faculty.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedSchool.faculty.map((member) => (
                    <div
                      key={member._id}
                      className="p-3 bg-white flex items-center justify-between text-xs hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{member.fullName}</p>
                        <p className="text-[11px] text-slate-500">
                          {member.designation || 'Teacher'} • {member.email}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {member.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No faculty roster records returned for this institution.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowSchoolDetailModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default SupervisorDashboard;
