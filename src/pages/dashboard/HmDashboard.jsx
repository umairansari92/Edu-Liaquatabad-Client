import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  School,
  Users,
  GraduationCap,
  ClipboardCheck,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  UserCheck,
  BookMarked,
  CalendarDays,
  TrendingUp,
  RefreshCw,
  Award,
  ArrowLeftRight,
  FileText,
  PlusCircle,
  ShieldCheck,
  Send,
  Eye,
  Check,
  X,
  Building,
  Calendar,
  Search,
  Filter,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Hash,
  QrCode,
  IdCard,
  Lock,
  Pin,
  Trash2,
  Archive,
  ExternalLink,
  Paperclip,
  Download,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageContainer from '../../components/layout/PageContainer.jsx';
import HmAddStudentModal from '../../components/hm/HmAddStudentModal.jsx';
import {
  fetchHmSummary,
  fetchPendingApprovals,
  submitApprovalDecision,
  fetchAcademicClasses,
  createAcademicClass,
  fetchAcademicSections,
  createAcademicSection,
  fetchAcademicSubjects,
  createAcademicSubject,
  fetchTeachingAssignments,
  assignTeachingDuty,
  terminateTeachingDuty,
  fetchAttendanceAnalytics,
  verifyAttendanceRecord,
  fetchExamsList,
  scheduleExam,
  fetchExamResults,
  verifyStudentResult,
  batchVerifyStudentResults,
  publishExamGazette,
  fetchIncomingTransfers,
  approveTransferJoining,
  relieveTransferFaculty,
  rejectTransferJoining,
  fetchSchoolNotices,
  publishSchoolNotice,
  archiveSchoolNotice,
  deleteSchoolNotice,
  fetchSchoolStudents,
  updateSchoolCode,
  fetchSchoolFaculty,
  fetchTeacherDailyAttendance,
  saveTeacherDailyAttendance,
} from '../../store/slices/hmSlice.js';
import hmService from '../../services/hmService.js';


// ─── Stat Card Component ──────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, subtext, color = 'emerald', loading }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-[#4B7F3A] border-emerald-200',
    blue:    'bg-blue-50 text-[#006AC7] border-blue-200',
    indigo:  'bg-indigo-50 text-indigo-700 border-indigo-200',
    amber:   'bg-amber-50 text-amber-700 border-amber-200',
    purple:  'bg-purple-50 text-purple-700 border-purple-200',
    rose:    'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm transition hover:shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase text-[#8094A8] tracking-wider">{label}</span>
        <div className={`p-2.5 rounded-xl border ${colors[color] || colors.emerald}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-20 bg-slate-100 animate-pulse rounded my-1" />
      ) : (
        <p className="text-2xl font-black text-[#102033]">{value ?? '—'}</p>
      )}
      {subtext && <p className="text-xs text-[#526477] font-medium mt-1">{subtext}</p>}
    </div>
  );
};

// ─── Tab Button Component ─────────────────────────────────────────────────────
const TabBtn = ({ label, active, onClick, badge, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
      active
        ? 'bg-[#006AC7] text-white shadow-sm'
        : 'bg-white border border-slate-200/80 text-[#526477] hover:bg-slate-50 hover:text-[#102033]'
    }`}
  >
    {Icon && <Icon className="w-4 h-4" />}
    {label}
    {badge != null && badge > 0 && (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/20 text-white' : 'bg-rose-600 text-white'}`}>
        {badge}
      </span>
    )}
  </button>
);

// ─── Main Head Master Operational Dashboard ───────────────────────────────────
export const HmDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    summary,
    summaryLoading,
    staffApprovals,
    studentApprovals,
    approvalsLoading,
    students,
    studentsLoading,
    studentsPagination,
    classes,
    sections,
    subjects,
    assignments,
    assignmentsLoading,
    attendanceAnalytics,
    attendanceLoading,
    exams,
    activeExamResults,
    examsLoading,
    transfers,
    transfersLoading,
    notices,
    noticesLoading,
    faculty,
    facultyLoading,
    teacherAttendance,
    teacherAttendanceLoading,
    teacherAttendanceSaving,
  } = useSelector((state) => state.hm);

  const [activeTab, setActiveTab] = useState('overview');

  // Student Directory State
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('');
  const [studentSectionFilter, setStudentSectionFilter] = useState('');
  const [studentGenderFilter, setStudentGenderFilter] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [studentLimit, setStudentLimit] = useState(20);
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [schoolCodeModalOpen, setSchoolCodeModalOpen] = useState(false);
  const [newSchoolCodeInput, setNewSchoolCodeInput] = useState('');

  // Faculty Directory State
  const [facultySearchQuery, setFacultySearchQuery] = useState('');
  const [facultyStatusFilter, setFacultyStatusFilter] = useState('');

  // Daily Teacher Attendance State
  const [attendanceSubTab, setAttendanceSubTab] = useState('faculty'); // 'faculty' | 'analytics'
  const [teacherAttendanceDate, setTeacherAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [teacherAttendanceRecords, setTeacherAttendanceRecords] = useState([]);

  // Stale-request & race-condition cancellation refs
  const studentSearchAbortRef = useRef(null);
  const studentRequestIdRef = useRef(0);

  const loadStudents = useCallback((paramsOverride = {}) => {
    if (studentSearchAbortRef.current) {
      studentSearchAbortRef.current.abort();
    }
    const abortController = new AbortController();
    studentSearchAbortRef.current = abortController;
    const currentRequestId = ++studentRequestIdRef.current;

    const targetPage = paramsOverride.page !== undefined ? paramsOverride.page : studentPage;
    const targetLimit = paramsOverride.limit !== undefined ? paramsOverride.limit : studentLimit;
    const targetSearch = (paramsOverride.search !== undefined ? paramsOverride.search : studentSearchQuery).trim();
    const targetClass = paramsOverride.classId !== undefined ? paramsOverride.classId : studentClassFilter;
    const targetSection = paramsOverride.sectionId !== undefined ? paramsOverride.sectionId : studentSectionFilter;
    const targetGender = paramsOverride.gender !== undefined ? paramsOverride.gender : studentGenderFilter;
    const targetStatus = paramsOverride.lifecycleStatus !== undefined ? paramsOverride.lifecycleStatus : studentStatusFilter;

    const queryParams = {
      page: targetPage,
      limit: targetLimit,
      search: targetSearch || undefined,
      classId: targetClass || undefined,
      sectionId: targetSection || undefined,
      gender: targetGender || undefined,
      lifecycleStatus: targetStatus || undefined,
    };

    dispatch(fetchSchoolStudents({ ...queryParams, signal: abortController.signal }))
      .unwrap()
      .then(() => {
        if (currentRequestId !== studentRequestIdRef.current) return;
      })
      .catch((err) => {
        if (err === 'REQUEST_ABORTED') return;
      });
  }, [dispatch, studentPage, studentLimit, studentSearchQuery, studentClassFilter, studentSectionFilter, studentGenderFilter, studentStatusFilter]);

  // Modal States
  const [approvalModal, setApprovalModal] = useState({ open: false, user: null, type: 'staff' });
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [newClassModal, setNewClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('');
  const [newSectionModal, setNewSectionModal] = useState(false);
  const [newSectionData, setNewSectionData] = useState({ classId: '', name: '', capacity: 40, roomNumber: '' });
  const [newSubjectModal, setNewSubjectModal] = useState(false);
  const [newSubjectData, setNewSubjectData] = useState({ classId: '', name: '', code: '', totalMarks: 100, passingMarks: 33 });
  const [assignDutyModal, setAssignDutyModal] = useState(false);
  const [dutyData, setDutyData] = useState({ teacherId: '', classId: '', sectionId: '', subjectId: '', academicSession: '2025-2026' });
  const [newExamModal, setNewExamModal] = useState(false);
  const [examData, setExamData] = useState({ title: '', examType: 'MID_TERM', academicYear: '2025-2026', startDate: '', endDate: '' });
  const [selectedExamId, setSelectedExamId] = useState('');
  const [examClassFilter, setExamClassFilter] = useState('');
  const [examSectionFilter, setExamSectionFilter] = useState('');
  const [examViewMode, setExamViewMode] = useState('list'); // 'list' | 'tabulation'
  const [tabulationData, setTabulationData] = useState(null);
  const [tabulationLoading, setTabulationLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [joiningModal, setJoiningModal] = useState({ open: false, transfer: null, remarks: '', joiningDate: '' });
  const [transferViewDirection, setTransferViewDirection] = useState('incoming'); // 'incoming' | 'outgoing' | 'history'
  const [relieveModal, setRelieveModal] = useState({
    open: false,
    transfer: null,
    relievingDate: new Date().toISOString().split('T')[0],
    relievingRemarks: '',
    relievingOrderNumber: '',
    clearanceCertified: false,
  });
  const [rejectJoiningModal, setRejectJoiningModal] = useState({
    open: false,
    transfer: null,
    rejectionReason: '',
  });

  // School Circulars & Official Notice Board State
  const [newNoticeModal, setNewNoticeModal] = useState(false);
  const [noticeCategoryFilter, setNoticeCategoryFilter] = useState('all'); // 'all' | 'school' | 'department'
  const [noticeTypeFilter, setNoticeTypeFilter] = useState('');
  const [noticeSearchQuery, setNoticeSearchQuery] = useState('');
  const [selectedNoticeFile, setSelectedNoticeFile] = useState(null);
  const [noticeData, setNoticeData] = useState({
    title: '',
    referenceNumber: '',
    documentType: 'CIRCULAR',
    priority: 'NORMAL',
    description: '',
    targetAudience: ['TEACHERS', 'STUDENTS', 'PARENTS'],
  });

  const loadNotices = useCallback(() => {
    dispatch(
      fetchSchoolNotices({
        scopeCategory: noticeCategoryFilter,
        documentType: noticeTypeFilter || undefined,
        search: noticeSearchQuery.trim() || undefined,
      })
    );
  }, [dispatch, noticeCategoryFilter, noticeTypeFilter, noticeSearchQuery]);

  // Initial load
  useEffect(() => {
    dispatch(fetchHmSummary());
    dispatch(fetchSchoolFaculty());
  }, [dispatch]);

  // Sync Redux teacher attendance with local interactive state
  useEffect(() => {
    if (teacherAttendance?.roster) {
      setTeacherAttendanceRecords(
        teacherAttendance.roster.map((item) => ({
          userId: item.userId,
          fullName: item.fullName,
          employeeId: item.employeeId,
          designation: item.designation,
          status: item.status,
          remarks: item.remarks || '',
        }))
      );
    }
  }, [teacherAttendance]);

  // Tab-specific data loading via Redux thunks
  useEffect(() => {
    if (activeTab === 'students') {
      dispatch(fetchAcademicClasses());
      dispatch(fetchAcademicSections());
      loadStudents({ page: 1 });
    } else if (activeTab === 'faculty') {
      dispatch(fetchSchoolFaculty());
    } else if (activeTab === 'approvals') {
      dispatch(fetchPendingApprovals('staff'));
      dispatch(fetchPendingApprovals('student'));
    } else if (activeTab === 'academics') {
      dispatch(fetchAcademicClasses());
      dispatch(fetchAcademicSections());
      dispatch(fetchAcademicSubjects());
    } else if (activeTab === 'assignments') {
      dispatch(fetchTeachingAssignments());
      dispatch(fetchSchoolFaculty());
      dispatch(fetchAcademicClasses());
      dispatch(fetchAcademicSections());
      dispatch(fetchAcademicSubjects());
    } else if (activeTab === 'attendance') {
      dispatch(fetchTeacherDailyAttendance({ date: teacherAttendanceDate }));
      dispatch(fetchAttendanceAnalytics());
    } else if (activeTab === 'exams') {
      dispatch(fetchExamsList());
      dispatch(fetchAcademicClasses());
      dispatch(fetchAcademicSections());
    } else if (activeTab === 'transfers') {
      dispatch(fetchIncomingTransfers({ direction: transferViewDirection }));
    } else if (activeTab === 'notices') {
      loadNotices();
    }
  }, [activeTab, dispatch, teacherAttendanceDate, loadNotices, transferViewDirection]);

  // Teacher attendance date change trigger
  useEffect(() => {
    if (activeTab === 'attendance') {
      dispatch(fetchTeacherDailyAttendance({ date: teacherAttendanceDate }));
    }
  }, [teacherAttendanceDate, activeTab, dispatch]);

  // Debounced search trigger with cancellation for students tab
  useEffect(() => {
    if (activeTab !== 'students') return;
    const debounceTimer = setTimeout(() => {
      loadStudents({ page: 1 });
      setStudentPage(1);
    }, 350);

    return () => clearTimeout(debounceTimer);
  }, [studentSearchQuery, studentClassFilter, studentSectionFilter, studentGenderFilter, studentStatusFilter]);

  // Debounced search trigger for faculty tab
  useEffect(() => {
    if (activeTab !== 'faculty') return;
    const debounceTimer = setTimeout(() => {
      dispatch(
        fetchSchoolFaculty({
          search: facultySearchQuery.trim() || undefined,
          status: facultyStatusFilter || undefined,
        })
      );
    }, 350);

    return () => clearTimeout(debounceTimer);
  }, [facultySearchQuery, facultyStatusFilter, activeTab, dispatch]);

  // Debounced search trigger for notices tab
  useEffect(() => {
    if (activeTab !== 'notices') return;
    const debounceTimer = setTimeout(() => {
      loadNotices();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [activeTab, noticeCategoryFilter, noticeTypeFilter, noticeSearchQuery, loadNotices]);

  const handleUpdateSchoolCodeSubmit = async (e) => {
    e.preventDefault();
    if (!newSchoolCodeInput.trim()) return;
    const effectiveSchoolId = user?.schoolId?._id || user?.schoolId;
    try {
      await dispatch(updateSchoolCode({ schoolId: effectiveSchoolId, schoolCode: newSchoolCodeInput.trim().toUpperCase() })).unwrap();
      toast.success(`School code '${newSchoolCodeInput.trim().toUpperCase()}' set & student IDs updated.`);
      setSchoolCodeModalOpen(false);
      setNewSchoolCodeInput('');
      loadStudents({ page: 1 });
      dispatch(fetchHmSummary());
    } catch (err) {
      toast.error(err || 'Failed to update school code');
    }
  };

  const handleTeacherStatusChange = (userId, status) => {
    setTeacherAttendanceRecords((prev) =>
      prev.map((rec) => (rec.userId === userId ? { ...rec, status } : rec))
    );
  };

  const handleTeacherRemarksChange = (userId, remarks) => {
    setTeacherAttendanceRecords((prev) =>
      prev.map((rec) => (rec.userId === userId ? { ...rec, remarks } : rec))
    );
  };

  const handleMarkAllTeachersPresent = () => {
    setTeacherAttendanceRecords((prev) =>
      prev.map((rec) => ({ ...rec, status: 'PRESENT' }))
    );
    toast.success('All faculty members marked Present.');
  };

  const handleSaveTeacherAttendanceSubmit = async () => {
    if (teacherAttendanceRecords.length === 0) {
      toast.error('No faculty records available to record attendance.');
      return;
    }
    try {
      await dispatch(
        saveTeacherDailyAttendance({
          date: teacherAttendanceDate,
          records: teacherAttendanceRecords.map((r) => ({
            userId: r.userId,
            status: r.status,
            remarks: r.remarks,
          })),
        })
      ).unwrap();
      toast.success('Teacher daily attendance recorded & verified successfully.');
    } catch (err) {
      toast.error(err || 'Failed to record teacher attendance');
    }
  };

  const handleOpenAssignDutyForTeacher = (teacherId) => {
    setDutyData((prev) => ({ ...prev, teacherId }));
    setAssignDutyModal(true);
  };

  const handleRefreshAll = () => {
    dispatch(fetchHmSummary());
    dispatch(fetchSchoolFaculty());
    if (activeTab === 'attendance') {
      dispatch(fetchTeacherDailyAttendance({ date: teacherAttendanceDate }));
    }
    if (activeTab === 'notices') {
      loadNotices();
    }
    toast.success('School command center updated.');
  };

  // ─── Approval Decision Handler ──────────────────────────────────────────────
  const handleProcessApproval = async (decision) => {
    if (!approvalModal.user) return;
    if ((decision === 'REJECT' || decision === 'REQUEST_CORRECTION') && !approvalRemarks.trim()) {
      toast.error('Remarks are mandatory when rejecting or requesting correction.');
      return;
    }

    try {
      await dispatch(
        submitApprovalDecision({
          userId: approvalModal.user.userId || approvalModal.user._id,
          decision,
          remarks: approvalRemarks.trim(),
          type: approvalModal.type,
        })
      ).unwrap();
      toast.success(`Application marked as ${decision}.`);
      setApprovalModal({ open: false, user: null, type: 'staff' });
      setApprovalRemarks('');
    } catch (err) {
      toast.error(err || 'Failed to process decision.');
    }
  };

  // ─── Academic Actions ───────────────────────────────────────────────────────
  const handleCreateClassSubmit = async (e) => {
    e.preventDefault();
    if (!newClassName || !newClassGrade) return;
    try {
      await dispatch(
        createAcademicClass({
          schoolId: user?.schoolId?._id || user?.schoolId,
          name: newClassName.trim(),
          numericGrade: parseInt(newClassGrade, 10),
        })
      ).unwrap();
      toast.success(`Class "${newClassName}" created.`);
      setNewClassName('');
      setNewClassGrade('');
      setNewClassModal(false);
    } catch (err) {
      toast.error(err || 'Failed to create class.');
    }
  };

  const handleCreateSectionSubmit = async (e) => {
    e.preventDefault();
    if (!newSectionData.classId || !newSectionData.name) return;
    try {
      await dispatch(
        createAcademicSection({
          schoolId: user?.schoolId?._id || user?.schoolId,
          ...newSectionData,
        })
      ).unwrap();
      toast.success(`Section "${newSectionData.name}" created.`);
      setNewSectionModal(false);
    } catch (err) {
      toast.error(err || 'Failed to create section.');
    }
  };

  const handleCreateSubjectSubmit = async (e) => {
    e.preventDefault();
    if (!newSubjectData.classId || !newSubjectData.name) return;
    try {
      await dispatch(
        createAcademicSubject({
          schoolId: user?.schoolId?._id || user?.schoolId,
          ...newSubjectData,
        })
      ).unwrap();
      toast.success(`Subject "${newSubjectData.name}" added.`);
      setNewSubjectModal(false);
    } catch (err) {
      toast.error(err || 'Failed to add subject.');
    }
  };

  // ─── Teaching Assignment Handler ───────────────────────────────────────────
  const handleAssignDutySubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        assignTeachingDuty({
          schoolId: user?.schoolId?._id || user?.schoolId,
          ...dutyData,
        })
      ).unwrap();
      toast.success('Teaching assignment allocated.');
      setAssignDutyModal(false);
    } catch (err) {
      toast.error(err || 'Failed to allocate assignment.');
    }
  };

  const handleEndDuty = async (assignmentId) => {
    const reason = window.prompt('Enter reason for concluding teaching assignment:');
    if (!reason || !reason.trim()) return;
    try {
      await dispatch(terminateTeachingDuty({ id: assignmentId, reason: reason.trim() })).unwrap();
      toast.success('Teaching duty archived.');
    } catch (err) {
      toast.error(err || 'Failed to end duty.');
    }
  };

  // ─── Transfer Joining Handler ───────────────────────────────────────────────
  const handleConfirmJoining = async () => {
    if (!joiningModal.transfer) return;
    try {
      await dispatch(
        approveTransferJoining({
          id: joiningModal.transfer._id,
          joiningDate: joiningModal.joiningDate || new Date().toISOString(),
          remarks: joiningModal.remarks.trim(),
        })
      ).unwrap();
      toast.success('Faculty physical joining verified and approved.');
      setJoiningModal({ open: false, transfer: null, remarks: '', joiningDate: '' });
      dispatch(fetchIncomingTransfers({ direction: transferViewDirection }));
    } catch (err) {
      toast.error(err || 'Failed to approve joining.');
    }
  };

  // ─── Transfer Relieving Handler ─────────────────────────────────────────────
  const handleConfirmRelieving = async () => {
    if (!relieveModal.transfer) return;
    if (!relieveModal.clearanceCertified) {
      toast.error('You must certify institutional clearance before relieving faculty.');
      return;
    }
    try {
      await dispatch(
        relieveTransferFaculty({
          id: relieveModal.transfer._id,
          relievingDate: relieveModal.relievingDate || new Date().toISOString(),
          relievingRemarks: relieveModal.relievingRemarks.trim(),
          relievingOrderNumber: relieveModal.relievingOrderNumber.trim(),
          clearanceCertified: true,
        })
      ).unwrap();
      toast.success('Faculty member formally relieved. Old school assignments expired.');
      setRelieveModal({
        open: false,
        transfer: null,
        relievingDate: new Date().toISOString().split('T')[0],
        relievingRemarks: '',
        relievingOrderNumber: '',
        clearanceCertified: false,
      });
      dispatch(fetchIncomingTransfers({ direction: transferViewDirection }));
    } catch (err) {
      toast.error(err || 'Failed to relieve faculty member.');
    }
  };

  // ─── Transfer Rejection Handler ─────────────────────────────────────────────
  const handleConfirmRejectJoining = async () => {
    if (!rejectJoiningModal.transfer) return;
    if (!rejectJoiningModal.rejectionReason || rejectJoiningModal.rejectionReason.trim().length < 10) {
      toast.error('A detailed rejection reason of at least 10 characters is required.');
      return;
    }
    try {
      await dispatch(
        rejectTransferJoining({
          id: rejectJoiningModal.transfer._id,
          rejectionReason: rejectJoiningModal.rejectionReason.trim(),
        })
      ).unwrap();
      toast.success('Faculty arrival rejected. Referred for municipal administrative review.');
      setRejectJoiningModal({ open: false, transfer: null, rejectionReason: '' });
      dispatch(fetchIncomingTransfers({ direction: transferViewDirection }));
    } catch (err) {
      toast.error(err || 'Failed to reject joining.');
    }
  };

  // ─── Exam Handlers ─────────────────────────────────────────────────────────
  const handleScheduleExamSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        scheduleExam({
          schoolId: user?.schoolId?._id || user?.schoolId,
          ...examData,
        })
      ).unwrap();
      toast.success('Examination scheduled.');
      setNewExamModal(false);
    } catch (err) {
      toast.error(err || 'Failed to schedule exam.');
    }
  };

  const loadTabulationSheetData = useCallback(async (examId, classId, sectionId) => {
    if (!examId || !classId) {
      setTabulationData(null);
      return;
    }
    try {
      setTabulationLoading(true);
      const params = { classId };
      if (sectionId) params.sectionId = sectionId;
      const response = await hmService.getClassTabulationData(examId, params);
      setTabulationData(response?.data || response);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load tabulation data.';
      toast.error(msg);
      setTabulationData(null);
    } finally {
      setTabulationLoading(false);
    }
  }, []);

  const handleSelectExam = (examId) => {
    setSelectedExamId(examId);
    setExamClassFilter('');
    setExamSectionFilter('');
    setTabulationData(null);
    dispatch(fetchExamResults({ examId }));
  };

  const handleExamFilterChange = (newClassId, newSectionId) => {
    setExamClassFilter(newClassId);
    setExamSectionFilter(newSectionId);
    if (selectedExamId) {
      dispatch(
        fetchExamResults({
          examId: selectedExamId,
          params: {
            classId: newClassId || undefined,
            sectionId: newSectionId || undefined,
          },
        })
      );
      if (examViewMode === 'tabulation' && newClassId) {
        loadTabulationSheetData(selectedExamId, newClassId, newSectionId);
      }
    }
  };

  const handleDownloadStudentMarksheet = async (examId, studentId, studentName = 'Student') => {
    try {
      setDownloadingPdf(true);
      toast.loading(`Generating Official DMC Marksheet for ${studentName}...`, { id: 'marksheet-dl' });
      await hmService.downloadStudentMarksheetPdf(examId, studentId);
      toast.success('Marksheet downloaded successfully.', { id: 'marksheet-dl' });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to download marksheet.';
      toast.error(msg, { id: 'marksheet-dl' });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadClassTabulationSheet = async (examId, classId, sectionId) => {
    if (!examId || !classId) {
      toast.error('Please select an exam and a class to download the Tabulation Sheet.');
      return;
    }
    try {
      setDownloadingPdf(true);
      toast.loading('Generating Official Elementary Board Tabulation Sheet (Legal Landscape)...', { id: 'tab-dl' });
      await hmService.downloadClassTabulationPdf(examId, classId, sectionId);
      toast.success('Official Legal Tabulation Sheet downloaded successfully.', { id: 'tab-dl' });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to download tabulation sheet.';
      toast.error(msg, { id: 'tab-dl' });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleVerifyMarks = async (resultId) => {
    try {
      await dispatch(verifyStudentResult({ resultId, examId: selectedExamId, remarks: 'Verified by HM' })).unwrap();
      toast.success('Marks verified.');
    } catch (err) {
      toast.error(err || 'Failed to verify marks.');
    }
  };

  const handleBatchVerifyMarks = async () => {
    if (!selectedExamId) return;
    try {
      const response = await dispatch(
        batchVerifyStudentResults({
          examId: selectedExamId,
          classId: examClassFilter || undefined,
          sectionId: examSectionFilter || undefined,
          remarks: 'Batch verified by HM',
        })
      ).unwrap();
      toast.success(response?.message || 'Batch verification completed successfully.');
    } catch (err) {
      toast.error(err || 'Failed to batch verify results.');
    }
  };

  const handlePublishGazette = async (examId) => {
    if (!window.confirm('Publish officially verified results for this examination?')) return;
    try {
      await dispatch(publishExamGazette(examId)).unwrap();
      toast.success('Exam gazette officially published.');
    } catch (err) {
      toast.error(err || 'Failed to publish gazette.');
    }
  };

  // ─── Notice Board Handlers ──────────────────────────────────────────────────
  const handlePublishNoticeSubmit = async (e) => {
    e.preventDefault();
    if (!noticeData.title.trim()) {
      toast.error('Notice title is required.');
      return;
    }
    if (!noticeData.targetAudience || noticeData.targetAudience.length === 0) {
      toast.error('Select at least one audience group.');
      return;
    }

    try {
      const effectiveSchoolId = user?.schoolId?._id || user?.schoolId;
      const formData = new FormData();
      formData.append('title', noticeData.title.trim());
      if (noticeData.referenceNumber?.trim()) {
        formData.append('referenceNumber', noticeData.referenceNumber.trim());
      }
      formData.append('documentType', noticeData.documentType);
      formData.append('priority', noticeData.priority);
      if (noticeData.description?.trim()) {
        formData.append('description', noticeData.description.trim());
      }
      formData.append('schoolId', effectiveSchoolId);
      noticeData.targetAudience.forEach((aud) => formData.append('targetAudience[]', aud));
      if (selectedNoticeFile) {
        formData.append('file', selectedNoticeFile);
      }

      await dispatch(publishSchoolNotice(formData)).unwrap();
      toast.success('School circular published successfully.');
      setNewNoticeModal(false);
      setNoticeData({
        title: '',
        referenceNumber: '',
        documentType: 'CIRCULAR',
        priority: 'NORMAL',
        description: '',
        targetAudience: ['TEACHERS', 'STUDENTS', 'PARENTS'],
      });
      setSelectedNoticeFile(null);
      loadNotices();
    } catch (err) {
      toast.error(err || 'Failed to publish circular.');
    }
  };

  const handleArchiveNoticeSubmit = async (docId) => {
    if (!window.confirm('Archive this circular? It will be moved to archived records.')) return;
    try {
      await dispatch(archiveSchoolNotice(docId)).unwrap();
      toast.success('Circular moved to archive.');
      loadNotices();
    } catch (err) {
      toast.error(err || 'Failed to archive circular.');
    }
  };

  const handleDeleteNoticeSubmit = async (docId) => {
    if (!window.confirm('Permanently delete this circular? This will purge the document and any attached files. An audit record will be preserved.')) return;
    try {
      await dispatch(deleteSchoolNotice(docId)).unwrap();
      toast.success('Circular permanently deleted.');
      loadNotices();
    } catch (err) {
      toast.error(err || 'Failed to delete circular.');
    }
  };

  const handleViewNoticeAttachment = async (docId) => {
    try {
      const res = await hmService.getViewDocumentUrl(docId);
      const fileUrl = res?.data?.viewUrl || res?.viewUrl;
      if (fileUrl) {
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Document file URL is not available.');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Access denied or document not found.');
    }
  };

  const handleToggleAudience = (audienceRole) => {
    setNoticeData((prev) => {
      const exists = prev.targetAudience.includes(audienceRole);
      return {
        ...prev,
        targetAudience: exists
          ? prev.targetAudience.filter((r) => r !== audienceRole)
          : [...prev.targetAudience, audienceRole],
      };
    });
  };

  const totalPendingCount =
    (summary?.metrics?.pendingQueues?.totalPendingActions) ||
    ((staffApprovals?.length || 0) + (studentApprovals?.length || 0) + (transfers?.length || 0));

  return (
    <PageContainer
      title="HEAD MASTER OPERATIONAL COMMAND CENTER"
      subtitle={`Education Department Liaquatabad Town Centre (DMC) • ${user?.schoolId?.name || 'Assigned Municipal School'}`}
      actions={
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-[#4B7F3A]">
            School Jurisdiction: {user?.schoolId?.code || user?.schoolId?.schoolCode || 'Active'}
          </span>
          <button
            onClick={handleRefreshAll}
            className="p-2 rounded-xl bg-white border border-slate-200/80 text-[#526477] hover:text-[#102033] hover:bg-slate-50 transition shadow-sm cursor-pointer"
            title="Refresh Command Center"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      }
    >
      {/* ── Tabs Navigation ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6 pb-2 border-b border-slate-200/60">
        <TabBtn label="Command Center" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={School} />
        <TabBtn label="Student Directory" active={activeTab === 'students'} onClick={() => setActiveTab('students')} badge={studentsPagination?.totalRecords ?? summary?.metrics?.totalStudents} icon={GraduationCap} />
        <TabBtn label="Faculty Roster" active={activeTab === 'faculty'} onClick={() => setActiveTab('faculty')} badge={faculty?.length || summary?.metrics?.teachingStaff} icon={Users} />
        <TabBtn label="Approvals" active={activeTab === 'approvals'} onClick={() => setActiveTab('approvals')} badge={totalPendingCount} icon={UserCheck} />
        <TabBtn label="Academic Setup" active={activeTab === 'academics'} onClick={() => setActiveTab('academics')} icon={BookMarked} />
        <TabBtn label="Teaching Duties" active={activeTab === 'assignments'} onClick={() => setActiveTab('assignments')} icon={BookOpen} />
        <TabBtn label="Attendance" active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={ClipboardCheck} />
        <TabBtn label="Exams & Gazette" active={activeTab === 'exams'} onClick={() => setActiveTab('exams')} icon={Award} />
        <TabBtn label="Incoming Transfers" active={activeTab === 'transfers'} onClick={() => setActiveTab('transfers')} badge={transfers?.length || 0} icon={ArrowLeftRight} />
        <TabBtn label="School Circulars" active={activeTab === 'notices'} onClick={() => setActiveTab('notices')} icon={FileText} />
      </div>


      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: COMMAND CENTER (OVERVIEW)                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={GraduationCap}
              label="Enrolled Students"
              value={summary?.metrics?.totalStudents}
              subtext="Active in this school"
              color="blue"
              loading={summaryLoading}
            />
            <StatCard
              icon={Users}
              label="Teaching Faculty"
              value={summary?.metrics?.teachingStaff}
              subtext={`Plus ${summary?.metrics?.nonTeachingStaff ?? 0} support staff`}
              color="emerald"
              loading={summaryLoading}
            />
            <StatCard
              icon={ClipboardCheck}
              label="Today Attendance"
              value={summary?.metrics?.todayAttendance?.attendancePercentage != null ? `${summary.metrics.todayAttendance.attendancePercentage}%` : 'Pending'}
              subtext={`${summary?.metrics?.todaySubmittedSections ?? 0} of ${summary?.metrics?.totalSections ?? 0} sections submitted`}
              color="indigo"
              loading={summaryLoading}
            />
            <StatCard
              icon={AlertTriangle}
              label="Pending Actions"
              value={totalPendingCount}
              subtext="Staff, students & transfers"
              color={totalPendingCount > 0 ? 'rose' : 'emerald'}
              loading={summaryLoading}
            />
          </div>

          {/* Institutional Metadata & Authority Confirmation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#006AC7]" />
                  School Institutional Profile
                </h3>
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-[#006AC7] border border-blue-200 font-semibold">
                  {summary?.school?.schoolType || 'MUNICIPAL'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-xs text-[#8094A8] font-semibold uppercase block">Institution Name</span>
                  <span className="font-bold text-[#102033] text-sm">{summary?.school?.name || user?.schoolId?.name || '—'}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-xs text-[#8094A8] font-semibold uppercase block">SEMIS / School Code</span>
                  <span className="font-mono font-bold text-[#006AC7] text-sm">{summary?.school?.code || '—'}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-xs text-[#8094A8] font-semibold uppercase block">Administrative Head (HM)</span>
                  <span className="font-bold text-[#102033] text-sm">{user?.fullName}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-xs text-[#8094A8] font-semibold uppercase block">Jurisdiction Scope</span>
                  <span className="font-mono font-bold text-[#4B7F3A] text-sm">SCHOOL ({user?.schoolId?._id || user?.schoolId})</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#4B7F3A] font-medium flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0 text-[#4B7F3A]" />
                <span>
                  Authoritative school boundary active. Cross-school access and unauthorized escalations are blocked server-side.
                </span>
              </div>
            </div>

            {/* Quick Action Queue */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Action Queues
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                  <span className="text-[#526477] font-medium">Pending Staff Registrations</span>
                  <span className="font-bold font-mono px-2 py-0.5 rounded bg-blue-50 text-[#006AC7]">{summary?.metrics?.pendingQueues?.staffApprovals ?? 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                  <span className="text-[#526477] font-medium">Student Admission Queue</span>
                  <span className="font-bold font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">{summary?.metrics?.pendingQueues?.studentAdmissions ?? 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                  <span className="text-[#526477] font-medium">Transfers Awaiting Joining</span>
                  <span className="font-bold font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700">{summary?.metrics?.pendingQueues?.incomingTransfers ?? 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                  <span className="text-[#526477] font-medium">Unverified Attendance Records</span>
                  <span className="font-bold font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700">{summary?.metrics?.pendingQueues?.unverifiedAttendance ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: STUDENT DIRECTORY & ENROLLMENT (HM STEP 1)                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Header Card with Stats & Action */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#006AC7]">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#102033]">
                    Official Student Directory (طالب علم ڈائریکٹری)
                  </h3>
                  <p className="text-xs text-[#526477]">
                    Authoritative school register • Dual GR & lifelong Global Student ID tracking
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* School Code Badge / Action */}
              <button
                onClick={() => {
                  setNewSchoolCodeInput(user?.schoolId?.schoolCode || user?.schoolId?.code || '');
                  setSchoolCodeModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200/80 bg-slate-50 hover:bg-slate-100 text-[#102033] transition flex items-center gap-1.5 cursor-pointer"
                title="Configure school code prefix for Global Student IDs"
              >
                <QrCode className="w-3.5 h-3.5 text-[#006AC7]" />
                <span>Code: <strong>{user?.schoolId?.schoolCode || user?.schoolId?.code || 'Not Set'}</strong></span>
              </button>

              {/* Enroll Student Button */}
              <button
                onClick={() => setAddStudentModalOpen(true)}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#006AC7] hover:bg-[#005299] text-white transition shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Enroll Student (نئی داخلہ)
              </button>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Live Search Input with Debounce & Stale Protection */}
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 text-[#8094A8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="Search by GR No, Global ID (LMGA-0001), or Name..."
                  className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
                />
                {studentSearchQuery && (
                  <button
                    onClick={() => setStudentSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8094A8] hover:text-[#102033] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Class Filter */}
              <div>
                <select
                  value={studentClassFilter}
                  onChange={(e) => {
                    setStudentClassFilter(e.target.value);
                    setStudentSectionFilter('');
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
                >
                  <option value="">All Classes</option>
                  {classes.map((classItem) => (
                    <option key={classItem._id} value={classItem._id}>{classItem.name}</option>
                  ))}
                </select>
              </div>

              {/* Section Filter */}
              <div>
                <select
                  value={studentSectionFilter}
                  onChange={(e) => setStudentSectionFilter(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
                >
                  <option value="">All Sections</option>
                  {sections
                    .filter((sectionItem) => !studentClassFilter || String(sectionItem.classId?._id || sectionItem.classId) === String(studentClassFilter))
                    .map((sectionItem) => (
                      <option key={sectionItem._id} value={sectionItem._id}>{sectionItem.name}</option>
                    ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={studentStatusFilter}
                  onChange={(e) => setStudentStatusFilter(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active (فعال)</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="TRANSFERRED">Transferred</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                </select>
              </div>
            </div>

            {/* Active Filter Summary & Reset */}
            {(studentSearchQuery || studentClassFilter || studentSectionFilter || studentStatusFilter) && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-[#526477]">
                <span>
                  Filtering active • Found {studentsPagination?.totalRecords ?? students.length} matching students
                </span>
                <button
                  onClick={() => {
                    setStudentSearchQuery('');
                    setStudentClassFilter('');
                    setStudentSectionFilter('');
                    setStudentGenderFilter('');
                    setStudentStatusFilter('');
                  }}
                  className="text-[#006AC7] hover:underline font-semibold cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>

          {/* Students Directory Table */}
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold uppercase text-[#8094A8] tracking-wider">
                    <th className="py-3.5 px-4">GR No</th>
                    <th className="py-3.5 px-4">Global Student ID</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Class & Section</th>
                    <th className="py-3.5 px-4">Gender</th>
                    <th className="py-3.5 px-4">Father / Guardian</th>
                    <th className="py-3.5 px-4">Guardian Phone</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {studentsLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#526477]">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-[#006AC7]" />
                          <span className="text-xs font-semibold">Loading student records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#8094A8]">
                        <div className="max-w-sm mx-auto flex flex-col items-center gap-2">
                          <GraduationCap className="w-10 h-10 text-slate-300" />
                          <p className="font-bold text-[#102033] text-sm">No students found</p>
                          <p className="text-xs text-[#526477]">
                            {studentSearchQuery || studentClassFilter
                              ? 'No students matched your search criteria. Try adjusting your filters.'
                              : 'No students have been enrolled in this school yet. Click "Enroll Student" to get started.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    students.map((studentItem) => (
                      <tr key={studentItem._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#006AC7]">
                          {studentItem.grNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md font-mono text-xs font-semibold bg-blue-50 text-[#006AC7] border border-blue-200">
                            {studentItem.globalStudentId}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#102033]">
                          {studentItem.studentName}
                        </td>
                        <td className="py-3.5 px-4 text-[#526477]">
                          <span className="font-semibold text-[#102033]">{studentItem.className}</span>
                          {studentItem.sectionName !== '—' && (
                            <span className="ml-1 text-xs text-[#8094A8]">({studentItem.sectionName})</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[#526477]">
                          <span className="text-xs capitalize font-medium">{studentItem.gender?.toLowerCase()}</span>
                        </td>
                        <td className="py-3.5 px-4 text-[#526477]">
                          {studentItem.guardianName}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-[#526477]">
                          {studentItem.guardianContact}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            studentItem.lifecycleStatus === 'ACTIVE'
                              ? 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200'
                              : studentItem.lifecycleStatus === 'PENDING_APPROVAL'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-[#526477] border border-slate-200'
                          }`}>
                            {studentItem.lifecycleStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {studentsPagination && studentsPagination.totalRecords > 0 && (
              <div className="p-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#526477]">
                <div>
                  Showing {Math.min((studentsPagination.currentPage - 1) * studentsPagination.pageSize + 1, studentsPagination.totalRecords)} to {Math.min(studentsPagination.currentPage * studentsPagination.pageSize, studentsPagination.totalRecords)} of {studentsPagination.totalRecords} students
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newPage = Math.max(1, studentPage - 1);
                      setStudentPage(newPage);
                      loadStudents({ page: newPage });
                    }}
                    disabled={!studentsPagination.hasPreviousPage || studentsLoading}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-2 font-semibold text-[#102033]">
                    Page {studentsPagination.currentPage} of {studentsPagination.totalPages || 1}
                  </span>

                  <button
                    onClick={() => {
                      const newPage = studentPage + 1;
                      setStudentPage(newPage);
                      loadStudents({ page: newPage });
                    }}
                    disabled={!studentsPagination.hasNextPage || studentsLoading}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: STAFF & STUDENT APPROVALS                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          {/* Staff Approvals Section */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#4B7F3A]" />
              Pending Teacher & Support Staff Registrations
            </h3>
            {approvalsLoading ? (
              <div className="flex items-center gap-2 p-6 text-sm text-[#526477]"><Loader2 className="w-4 h-4 animate-spin text-[#006AC7]" /> Loading applications...</div>
            ) : staffApprovals.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#8094A8] bg-slate-50 rounded-xl border border-slate-200/60">No pending staff applications for your school.</div>
            ) : (
              <div className="space-y-3">
                {staffApprovals.map((appItem) => (
                  <div key={appItem.userId || appItem._id} className="p-4 rounded-xl border border-slate-200/80 hover:bg-slate-50/60 transition flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#102033] text-sm">{appItem.fullName}</p>
                      <p className="text-xs text-[#526477] mt-0.5">{appItem.designation || 'Teacher'} • {appItem.email} • CNIC: {appItem.cnicMasked || 'Protected'}</p>
                    </div>
                    <button
                      onClick={() => setApprovalModal({ open: true, user: appItem, type: 'staff' })}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#006AC7] hover:bg-[#005299] text-white transition cursor-pointer"
                    >
                      Review Application
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Student Admission Approvals Section */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              Student Admission Verification Queue
            </h3>
            {studentApprovals.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#8094A8] bg-slate-50 rounded-xl border border-slate-200/60">No pending student admission records.</div>
            ) : (
              <div className="space-y-3">
                {studentApprovals.map((stuItem) => (
                  <div key={stuItem.userId || stuItem._id} className="p-4 rounded-xl border border-slate-200/80 hover:bg-slate-50/60 transition flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#102033] text-sm">{stuItem.fullName}</p>
                      <p className="text-xs text-[#526477] mt-0.5">Role: STUDENT • {stuItem.email}</p>
                    </div>
                    <button
                      onClick={() => setApprovalModal({ open: true, user: stuItem, type: 'student' })}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#006AC7] hover:bg-[#005299] text-white transition cursor-pointer"
                    >
                      Verify Admission
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: FACULTY ROSTER (MUNICIPAL TEACHING CORPS)                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'faculty' && (
        <div className="space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#006AC7]" />
                Institutional Faculty Roster
              </h3>
              <p className="text-xs text-[#526477] mt-0.5">
                Official service records, government employee IDs, BPS scales, and teaching allocations.
              </p>
            </div>
            <button
              id="hm-faculty-allocate-duty-btn"
              onClick={() => {
                setDutyData({ teacherId: '', classId: '', sectionId: '', subjectId: '', academicSession: '2025-2026' });
                setAssignDutyModal(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#006AC7] hover:bg-[#005299] text-white flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Allocate Teaching Assignment
            </button>
          </div>

          {/* Search & Status Filters */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8094A8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="hm-faculty-search-input"
                type="text"
                placeholder="Search faculty by name, employee ID, or email..."
                value={facultySearchQuery}
                onChange={(e) => setFacultySearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200/80 bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-[#006AC7] focus:bg-white transition"
              />
            </div>
            <div className="flex gap-2">
              <select
                id="hm-faculty-status-filter"
                value={facultyStatusFilter}
                onChange={(e) => setFacultyStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs border border-slate-200/80 bg-slate-50/50 text-[#102033] focus:outline-none focus:ring-1 focus:ring-[#006AC7] transition"
              >
                <option value="">All Account Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="TRANSFERRED">Transferred</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
              <button
                onClick={() => {
                  setFacultySearchQuery('');
                  setFacultyStatusFilter('');
                  dispatch(fetchSchoolFaculty());
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-[#526477] bg-white border border-slate-200/80 hover:bg-slate-50 transition shadow-sm cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Faculty Roster Table */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-[#8094A8] tracking-wider">
                Assigned Faculty Members ({faculty?.length || 0})
              </h4>
              {facultyLoading && (
                <div className="flex items-center gap-1.5 text-xs text-[#006AC7]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating roster...
                </div>
              )}
            </div>

            {facultyLoading && faculty.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#8094A8]">
                <Loader2 className="w-6 h-6 animate-spin text-[#006AC7]" />
                <span className="text-xs">Loading faculty service records...</span>
              </div>
            ) : faculty.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#8094A8] bg-slate-50 rounded-xl">
                No faculty members match your query. Teachers approved for this school will appear here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-[#8094A8] uppercase text-[11px] font-bold">
                      <th className="py-3 px-3">Faculty Teacher</th>
                      <th className="py-3 px-3">Employee ID / Scale</th>
                      <th className="py-3 px-3">Civil Designation</th>
                      <th className="py-3 px-3">CNIC (Protected)</th>
                      <th className="py-3 px-3">Qualification</th>
                      <th className="py-3 px-3">Active Teaching Duties</th>
                      <th className="py-3 px-3">Account Status</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {faculty.map((member) => (
                      <tr key={member.userId} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-[#006AC7] font-bold text-xs flex items-center justify-center">
                              {member.fullName?.charAt(0) || 'T'}
                            </div>
                            <div>
                              <p className="font-bold text-[#102033]">{member.fullName}</p>
                              <p className="text-[11px] text-[#8094A8]">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-mono">
                          <span className="font-bold text-[#102033]">{member.employeeId || 'ID-PENDING'}</span>
                          <span className="block text-[10px] text-[#526477] font-sans">{member.bpsScale}</span>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-[#526477]">
                          {member.designation}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600">
                          {member.cnicMasked || '*****-*******-*'}
                        </td>
                        <td className="py-3.5 px-3 text-[#526477]">
                          {member.qualification || 'B.Ed / Master'}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 font-bold text-[#006AC7]">
                              <BookOpen className="w-3.5 h-3.5" />
                              {member.activeDutyCount} Active {member.activeDutyCount === 1 ? 'Duty' : 'Duties'}
                            </span>
                            {member.activeAssignments?.length > 0 && (
                              <div className="text-[10px] text-[#8094A8] space-y-0.5">
                                {member.activeAssignments.slice(0, 2).map((duty, idx) => (
                                  <span key={idx} className="block truncate max-w-[180px]">
                                    {duty.className} ({duty.sectionName}) • {duty.subjectName}
                                  </span>
                                ))}
                                {member.activeAssignments.length > 2 && (
                                  <span className="text-[#006AC7] font-medium">
                                    +{member.activeAssignments.length - 2} more...
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              member.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200'
                                : member.status === 'PENDING_APPROVAL'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-[#526477]'
                            }`}
                          >
                            {member.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            id={`assign-duty-btn-${member.userId}`}
                            onClick={() => handleOpenAssignDutyForTeacher(member.userId)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-[#006AC7] hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                          >
                            Assign Duty
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: ACADEMIC SETUP                                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'academics' && (

        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-bold text-[#102033]">School Academic Structure</h3>
            <div className="flex gap-2">
              <button onClick={() => setNewClassModal(true)} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#006AC7] text-white flex items-center gap-1.5 shadow-sm cursor-pointer">
                <PlusCircle className="w-3.5 h-3.5" /> Add Class
              </button>
              <button onClick={() => setNewSectionModal(true)} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-[#102033] flex items-center gap-1.5 shadow-sm cursor-pointer">
                <PlusCircle className="w-3.5 h-3.5" /> Add Section
              </button>
              <button onClick={() => setNewSubjectModal(true)} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-[#102033] flex items-center gap-1.5 shadow-sm cursor-pointer">
                <PlusCircle className="w-3.5 h-3.5" /> Add Subject
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Classes Column */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase text-[#8094A8] tracking-wider">Classes ({classes.length})</h4>
              <div className="space-y-2">
                {classes.map((c) => (
                  <div key={c._id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#102033]">{c.name}</span>
                    <span className="font-mono text-[#006AC7]">{c.code}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sections Column */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase text-[#8094A8] tracking-wider">Sections ({sections.length})</h4>
              <div className="space-y-2">
                {sections.map((s) => (
                  <div key={s._id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#102033]">Section {s.name}</p>
                      <p className="text-[10px] text-[#8094A8]">Room: {s.roomNumber || '—'}</p>
                    </div>
                    <span className="text-xs text-[#526477]">Cap: {s.capacity || 40}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subjects Column */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase text-[#8094A8] tracking-wider">Curriculum Subjects ({subjects.length})</h4>
              <div className="space-y-2">
                {subjects.map((sub) => (
                  <div key={sub._id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#102033]">{sub.name}</span>
                    <span className="font-mono text-[#4B7F3A]">{sub.code || 'SUB'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: TEACHING ASSIGNMENTS (THE SECURITY ANCHOR)                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#102033]">Authoritative Faculty Teaching Assignments</h3>
              <p className="text-xs text-[#526477]">
                TeachingAssignment is the sole authorization anchor for marking attendance, entering homework, and inputting exam marks.
              </p>
            </div>
            <button
              onClick={() => setAssignDutyModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#006AC7] text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Allocate Assignment
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase text-[#8094A8] tracking-wider">
              Active Allocations ({assignments?.activeAssignments?.length || 0})
            </h4>
            {assignmentsLoading ? (
              <div className="flex items-center gap-2 text-sm text-[#526477]"><Loader2 className="w-4 h-4 animate-spin text-[#006AC7]" /> Loading allocations...</div>
            ) : (assignments?.activeAssignments?.length || 0) === 0 ? (
              <div className="p-6 text-center text-sm text-[#8094A8] bg-slate-50 rounded-xl">No active teaching allocations. Allocate duties above.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-[#8094A8] uppercase text-[11px] font-bold">
                      <th className="py-2.5 px-3">Faculty Teacher</th>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-3">Section</th>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3">Session</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assignments.activeAssignments.map((a) => (
                      <tr key={a._id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-3 font-bold text-[#102033]">{a.teacherId?.fullName}</td>
                        <td className="py-3 px-3">{a.classId?.name}</td>
                        <td className="py-3 px-3">{a.sectionId?.name}</td>
                        <td className="py-3 px-3 font-semibold text-[#006AC7]">{a.subjectId?.name}</td>
                        <td className="py-3 px-3 font-mono">{a.academicSession}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleEndDuty(a._id)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                          >
                            End Duty
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: DAILY ATTENDANCE OVERSIGHT                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Header & Sub-Navigation Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#4B7F3A]" />
                School Attendance Governance Portal
              </h3>
              <p className="text-xs text-[#526477] mt-0.5">
                Daily faculty physical register sign-off and student section attendance analytics.
              </p>
            </div>
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start sm:self-auto">
              <button
                id="attendance-subtab-faculty-btn"
                onClick={() => setAttendanceSubTab('faculty')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  attendanceSubTab === 'faculty'
                    ? 'bg-white text-[#006AC7] shadow-sm'
                    : 'text-[#526477] hover:text-[#102033]'
                }`}
              >
                Faculty Daily Register
              </button>
              <button
                id="attendance-subtab-analytics-btn"
                onClick={() => setAttendanceSubTab('analytics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  attendanceSubTab === 'analytics'
                    ? 'bg-white text-[#006AC7] shadow-sm'
                    : 'text-[#526477] hover:text-[#102033]'
                }`}
              >
                Student Section Analytics
              </button>
            </div>
          </div>

          {/* Sub-Tab 1: Faculty Daily Register */}
          {attendanceSubTab === 'faculty' && (
            <div className="space-y-6">
              {/* Date Control & Summary KPI Pills */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-[#102033] flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#006AC7]" /> Attendance Date:
                    </label>
                    <input
                      id="hm-teacher-attendance-date-picker"
                      type="date"
                      value={teacherAttendanceDate}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setTeacherAttendanceDate(e.target.value)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
                    />
                    <button
                      onClick={() => setTeacherAttendanceDate(new Date().toISOString().split('T')[0])}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-[#526477] hover:bg-slate-200 font-semibold transition cursor-pointer"
                    >
                      Today
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      id="hm-teacher-attendance-mark-all-btn"
                      onClick={handleMarkAllTeachersPresent}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-[#4B7F3A] hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                    >
                      Mark All Present
                    </button>
                    <button
                      id="hm-teacher-attendance-save-btn"
                      disabled={teacherAttendanceSaving || teacherAttendanceRecords.length === 0}
                      onClick={handleSaveTeacherAttendanceSubmit}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#006AC7] hover:bg-[#005299] text-white shadow-sm flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                    >
                      {teacherAttendanceSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" /> Save & Verify Register
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Summary KPI Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-[11px] font-bold text-[#8094A8] uppercase block">Total Faculty</span>
                    <span className="text-xl font-black text-[#102033]">{teacherAttendanceRecords.length}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[11px] font-bold text-[#4B7F3A] uppercase block">Present</span>
                    <span className="text-xl font-black text-[#4B7F3A]">
                      {teacherAttendanceRecords.filter((r) => r.status === 'PRESENT').length}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="text-[11px] font-bold text-rose-700 uppercase block">Absent</span>
                    <span className="text-xl font-black text-rose-700">
                      {teacherAttendanceRecords.filter((r) => r.status === 'ABSENT').length}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-[11px] font-bold text-amber-700 uppercase block">Leave</span>
                    <span className="text-xl font-black text-amber-700">
                      {teacherAttendanceRecords.filter((r) => r.status === 'LEAVE').length}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200">
                    <span className="text-[11px] font-bold text-purple-700 uppercase block">Late</span>
                    <span className="text-xl font-black text-purple-700">
                      {teacherAttendanceRecords.filter((r) => r.status === 'LATE').length}
                    </span>
                  </div>
                </div>

                {teacherAttendance?.alreadySubmitted && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-[#4B7F3A]">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>
                      Daily teacher register is verified by Head Master for {teacherAttendance.date}. Changes can be made and re-saved below.
                    </span>
                  </div>
                )}
              </div>

              {/* Interactive Teacher Roster Table */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-[#8094A8] tracking-wider">
                    Faculty Attendance Roster ({teacherAttendanceRecords.length})
                  </h4>
                  {teacherAttendanceLoading && (
                    <div className="flex items-center gap-1.5 text-xs text-[#006AC7]">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading register...
                    </div>
                  )}
                </div>

                {teacherAttendanceLoading && teacherAttendanceRecords.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#8094A8]">
                    <Loader2 className="w-6 h-6 animate-spin text-[#006AC7]" />
                    <span className="text-xs">Loading faculty attendance records...</span>
                  </div>
                ) : teacherAttendanceRecords.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[#8094A8] bg-slate-50 rounded-xl">
                    No active faculty members found in school registry to mark attendance for.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200/80 text-[#8094A8] uppercase text-[11px] font-bold">
                          <th className="py-3 px-3">Faculty Member</th>
                          <th className="py-3 px-3">Employee ID</th>
                          <th className="py-3 px-3">Attendance Status</th>
                          <th className="py-3 px-3">Reason / Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {teacherAttendanceRecords.map((recordItem) => (
                          <tr key={recordItem.userId} className="hover:bg-slate-50/70 transition">
                            <td className="py-3.5 px-3">
                              <p className="font-bold text-[#102033]">{recordItem.fullName}</p>
                              <p className="text-[11px] text-[#8094A8]">{recordItem.designation || 'Teacher'}</p>
                            </td>
                            <td className="py-3.5 px-3 font-mono text-slate-700">
                              {recordItem.employeeId || 'ID-PENDING'}
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200/70 gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleTeacherStatusChange(recordItem.userId, 'PRESENT')}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    recordItem.status === 'PRESENT'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'text-[#526477] hover:text-[#102033]'
                                  }`}
                                >
                                  Present
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTeacherStatusChange(recordItem.userId, 'ABSENT')}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    recordItem.status === 'ABSENT'
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : 'text-[#526477] hover:text-[#102033]'
                                  }`}
                                >
                                  Absent
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTeacherStatusChange(recordItem.userId, 'LEAVE')}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    recordItem.status === 'LEAVE'
                                      ? 'bg-amber-600 text-white shadow-xs'
                                      : 'text-[#526477] hover:text-[#102033]'
                                  }`}
                                >
                                  Leave
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTeacherStatusChange(recordItem.userId, 'LATE')}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    recordItem.status === 'LATE'
                                      ? 'bg-purple-600 text-white shadow-xs'
                                      : 'text-[#526477] hover:text-[#102033]'
                                  }`}
                                >
                                  Late
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-3">
                              <input
                                type="text"
                                value={recordItem.remarks}
                                onChange={(e) => handleTeacherRemarksChange(recordItem.userId, e.target.value)}
                                placeholder={
                                  recordItem.status === 'LEAVE'
                                    ? 'Casual / Medical / Official leave reason...'
                                    : recordItem.status === 'LATE'
                                    ? 'Arrival delay reason / transit...'
                                    : 'Optional administrative remark...'
                                }
                                className="w-full max-w-sm px-3 py-1.5 rounded-lg text-xs border border-slate-200/80 bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-[#006AC7] focus:bg-white transition"
                              />
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

          {/* Sub-Tab 2: Student Section Analytics */}
          {attendanceSubTab === 'analytics' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-[#4B7F3A]" />
                  Classroom Section Attendance Intelligence
                </h3>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-[#4B7F3A] border border-emerald-200 font-bold">
                  Level 50 Authority
                </span>
              </div>

              {attendanceLoading ? (
                <div className="flex items-center gap-2 text-sm text-[#526477]"><Loader2 className="w-4 h-4 animate-spin text-[#006AC7]" /> Loading attendance analytics...</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                      <span className="text-xs text-[#8094A8] font-bold uppercase block">Current Month Aggregate</span>
                      <span className="text-2xl font-black text-[#006AC7]">{attendanceAnalytics?.aggregates?.currentMonthPct ?? '—'}%</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                      <span className="text-xs text-[#8094A8] font-bold uppercase block">Last Month Benchmark</span>
                      <span className="text-2xl font-black text-purple-700">{attendanceAnalytics?.aggregates?.lastMonthPct ?? '—'}%</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                      <span className="text-xs text-[#8094A8] font-bold uppercase block">Academic Session Avg</span>
                      <span className="text-2xl font-black text-amber-700">{attendanceAnalytics?.aggregates?.overallSessionPct ?? '—'}%</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#526477] leading-relaxed">
                    Head Masters verify paper-register uploads, evaluate late justification thresholds, and conduct institutional oversight. Daily classroom marking remains delegated to teachers with valid TeachingAssignments.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}


      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 6: EXAMINATIONS & GAZETTE                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#102033]">School Examinations & Results Gazette</h3>
              <p className="text-xs text-[#526477]">Documented lifecycle: DRAFT → SUBMITTED → VERIFIED_BY_HM → PUBLISHED</p>
            </div>
            <button
              onClick={() => setNewExamModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#006AC7] text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Schedule New Exam
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Exams list */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase text-[#8094A8] tracking-wider">Scheduled Exams ({exams.length})</h4>
              <div className="space-y-2">
                {exams.map((ex) => (
                  <div
                    key={ex._id}
                    onClick={() => handleSelectExam(ex._id)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer ${
                      selectedExamId === ex._id ? 'border-[#006AC7] bg-blue-50/40 ring-1 ring-[#006AC7]' : 'border-slate-200/60 bg-slate-50 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#102033]">{ex.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${ex.status === 'PUBLISHED' ? 'bg-emerald-50 text-[#4B7F3A]' : 'bg-blue-50 text-[#006AC7]'}`}>
                        {ex.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#526477] mt-1">{ex.examType} • {ex.academicYear}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Results Review Table */}
            {(() => {
              const selectedExam = exams.find((ex) => String(ex._id) === String(selectedExamId));
              const examResultsList = activeExamResults?.results || [];
              const totalCandidates = examResultsList.length;
              const passedCandidates = examResultsList.filter((res) => res.grade !== 'F').length;
              const failedCandidates = totalCandidates - passedCandidates;
              const passRate = totalCandidates > 0 ? ((passedCandidates / totalCandidates) * 100).toFixed(1) : '0.0';
              const avgScore = totalCandidates > 0
                ? (examResultsList.reduce((acc, res) => acc + (res.percentage || 0), 0) / totalCandidates).toFixed(1)
                : '0.0';
              const unverifiedCount = examResultsList.filter((res) => res.status === 'SUBMITTED').length;

              return (
                <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold uppercase text-[#8094A8] tracking-wider">
                        Exam Results {activeExamResults?.exam?.title ? `— ${activeExamResults.exam.title}` : ''}
                      </h4>
                      {selectedExam && (
                        <p className="text-[11px] text-[#526477] mt-0.5">
                          Session: <span className="font-semibold text-[#102033]">{selectedExam.academicYear}</span> • Type: <span className="font-semibold text-[#102033]">{selectedExam.examType}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedExam?.status === 'PUBLISHED' ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Lock className="w-3.5 h-3.5" /> Sealed & Published
                        </span>
                      ) : (
                        <>
                          {unverifiedCount > 0 && (
                            <button
                              onClick={handleBatchVerifyMarks}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#006AC7] hover:bg-[#005299] text-white transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Batch Verify ({unverifiedCount})
                            </button>
                          )}
                          {selectedExamId && (
                            <button
                              onClick={() => handlePublishGazette(selectedExamId)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#4B7F3A] hover:bg-[#3d682f] text-white transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                            >
                              <Award className="w-3.5 h-3.5" /> Publish Gazette
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {selectedExamId && totalCandidates > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200/50 shadow-xs">
                        <span className="text-[10px] uppercase font-bold text-[#8094A8] block">Candidates</span>
                        <span className="text-sm font-bold text-[#102033]">{totalCandidates}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200/50 shadow-xs">
                        <span className="text-[10px] uppercase font-bold text-[#8094A8] block">Pass Rate</span>
                        <span className="text-sm font-bold text-emerald-600">{passRate}% <span className="text-[10px] font-normal text-[#526477]">({passedCandidates})</span></span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200/50 shadow-xs">
                        <span className="text-[10px] uppercase font-bold text-[#8094A8] block">Failed</span>
                        <span className="text-sm font-bold text-rose-600">{failedCandidates}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200/50 shadow-xs">
                        <span className="text-[10px] uppercase font-bold text-[#8094A8] block">Avg Score</span>
                        <span className="text-sm font-bold text-[#006AC7]">{avgScore}%</span>
                      </div>
                    </div>
                  )}

                  {selectedExamId && (
                    <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-[#526477]">Class:</span>
                          <select
                            value={examClassFilter}
                            onChange={(e) => handleExamFilterChange(e.target.value, examSectionFilter)}
                            className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                          >
                            <option value="">All Classes</option>
                            {classes.map((cls) => (
                              <option key={cls._id} value={cls._id}>{cls.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-[#526477]">Section:</span>
                          <select
                            value={examSectionFilter}
                            onChange={(e) => handleExamFilterChange(examClassFilter, e.target.value)}
                            className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                          >
                            <option value="">All Sections</option>
                            {sections
                              .filter((sec) => !examClassFilter || String(sec.classId?._id || sec.classId) === String(examClassFilter))
                              .map((sec) => (
                                <option key={sec._id} value={sec._id}>{sec.name}</option>
                              ))}
                          </select>
                        </div>
                        {(examClassFilter || examSectionFilter) && (
                          <button
                            onClick={() => handleExamFilterChange('', '')}
                            className="text-[11px] text-[#006AC7] font-semibold hover:underline cursor-pointer"
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>

                      {/* View Mode Toggle */}
                      <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                        <button
                          onClick={() => setExamViewMode('list')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            examViewMode === 'list'
                              ? 'bg-[#006AC7] text-white shadow-xs'
                              : 'text-[#526477] hover:text-[#102033]'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" /> Candidate Gazette
                        </button>
                        <button
                          onClick={() => {
                            setExamViewMode('tabulation');
                            if (selectedExamId && examClassFilter) {
                              loadTabulationSheetData(selectedExamId, examClassFilter, examSectionFilter);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            examViewMode === 'tabulation'
                              ? 'bg-[#15803d] text-white shadow-xs'
                              : 'text-[#526477] hover:text-[#102033]'
                          }`}
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" /> Tabulation Sheet (Legal Excel)
                        </button>
                      </div>
                    </div>
                  )}

                  {!selectedExamId ? (
                    <div className="p-8 text-center text-sm text-[#8094A8]">Select an examination on the left to review student marks.</div>
                  ) : examViewMode === 'list' ? (
                    examResultsList.length === 0 ? (
                      <div className="p-8 text-center text-sm text-[#8094A8]">No submitted student marks found for this examination.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200/80 text-[#8094A8] uppercase text-[10px] font-bold">
                              <th className="py-2 px-2">Student</th>
                              <th className="py-2 px-2">Class</th>
                              <th className="py-2 px-2">Obtained / Total</th>
                              <th className="py-2 px-2">Percentage</th>
                              <th className="py-2 px-2">Grade</th>
                              <th className="py-2 px-2">Status</th>
                              <th className="py-2 px-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {examResultsList.map((res) => (
                              <tr key={res._id} className="hover:bg-slate-50/60">
                                <td className="py-2 px-2">
                                  <span className="font-bold text-[#102033] block">{res.studentId?.fullName}</span>
                                  {res.studentId?.rollNumber ? (
                                    <span className="text-[10px] text-[#8094A8] font-mono">Roll #{res.studentId.rollNumber}</span>
                                  ) : null}
                                </td>
                                <td className="py-2 px-2">
                                  <span>{res.classId?.name}</span>
                                  {res.sectionId?.name ? (
                                    <span className="text-[#8094A8] text-[11px] ml-1">({res.sectionId.name})</span>
                                  ) : null}
                                </td>
                                <td className="py-2 px-2 font-mono">{res.totalObtainedMarks} / {res.totalMaxMarks}</td>
                                <td className="py-2 px-2 font-bold text-[#006AC7]">{res.percentage}%</td>
                                <td className="py-2 px-2 font-mono font-bold">{res.grade}</td>
                                <td className="py-2 px-2">
                                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                    res.status === 'PUBLISHED' ? 'bg-emerald-50 text-[#4B7F3A]' :
                                    res.status === 'VERIFIED_BY_HM' ? 'bg-blue-50 text-[#006AC7]' :
                                    'bg-amber-50 text-amber-700'
                                  }`}>
                                    {res.status}
                                  </span>
                                </td>
                                <td className="py-2 px-2 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {['VERIFIED_BY_HM', 'PUBLISHED'].includes(res.status) && (
                                      <button
                                        onClick={() => handleDownloadStudentMarksheet(selectedExamId, res.studentId?._id || res.studentId, res.studentId?.fullName)}
                                        disabled={downloadingPdf}
                                        title="Download Official A4 Marksheet PDF (Image 1 Replica)"
                                        className="px-2 py-1 rounded bg-emerald-50 text-[#15803d] border border-emerald-200 text-[10px] font-bold hover:bg-emerald-100 transition cursor-pointer flex items-center gap-1"
                                      >
                                        <Download className="w-3 h-3" /> Marksheet
                                      </button>
                                    )}
                                    {res.status === 'SUBMITTED' && selectedExam?.status !== 'PUBLISHED' && (
                                      <button
                                        onClick={() => handleVerifyMarks(res._id)}
                                        className="px-2 py-1 rounded bg-[#006AC7] text-white text-[10px] font-bold hover:bg-[#005299] transition cursor-pointer"
                                      >
                                        Verify
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : (
                    /* ═══ TABULATION SPREADSHEET VIEW (IMAGE 2 REPLICA) ═══ */
                    !examClassFilter ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                        <FileSpreadsheet className="w-10 h-10 text-[#006AC7] mx-auto" />
                        <h4 className="text-sm font-bold text-[#102033]">Select a Class to Compile the Elementary Board Tabulation Sheet</h4>
                        <p className="text-xs text-[#526477] max-w-md mx-auto">
                          Centralized Elementary Board Tabulation Sheets are compiled class-wise in <strong>Legal Landscape format (14" × 8.5")</strong> with Islamiat sub-components (Nazra & Written), Drawing letter grade, auto-calculated percentage, Sindh Board grades, class rankings, and municipal statistics.
                        </p>
                      </div>
                    ) : tabulationLoading ? (
                      <div className="p-12 text-center text-sm text-[#526477] flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-[#006AC7]" /> Compiling Elementary Board Tabulation Sheet...
                      </div>
                    ) : !tabulationData || (tabulationData.rankedResults || []).length === 0 ? (
                      <div className="p-8 text-center text-sm text-[#8094A8] space-y-2">
                        <p>No student results recorded for this class in this examination.</p>
                        <button
                          onClick={() => loadTabulationSheetData(selectedExamId, examClassFilter, examSectionFilter)}
                          className="text-xs text-[#006AC7] font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Retry Loading
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Tabulation Sheet Header & Export Bar */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#15803d] block">
                              Elementary Board District Municipal Corporation Karachi (Central)
                            </span>
                            <h4 className="text-sm font-black text-[#102033]">
                              Tabulation Sheet of {tabulationData.exam?.title || selectedExam?.title} ({tabulationData.exam?.academicYear || selectedExam?.academicYear})
                            </h4>
                            <p className="text-xs text-[#526477]">
                              Class: <span className="font-bold text-[#102033]">{classes.find((c) => String(c._id) === String(examClassFilter))?.name}</span>
                              {examSectionFilter && (
                                <span> • Section: <span className="font-bold text-[#102033]">{sections.find((s) => String(s._id) === String(examSectionFilter))?.name}</span></span>
                              )}
                              <span> • Candidates: <span className="font-bold text-[#102033]">{tabulationData.rankedResults?.length || 0}</span></span>
                            </p>
                          </div>

                          <button
                            onClick={() => handleDownloadClassTabulationSheet(selectedExamId, examClassFilter, examSectionFilter)}
                            disabled={downloadingPdf}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#15803d] hover:bg-[#166534] text-white transition flex items-center gap-2 shadow-sm cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                            Download Legal Tabulation Sheet (PDF)
                            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">14" × 8.5"</span>
                          </button>
                        </div>

                        {/* Interactive Spreadsheet Grid matching Image 2 */}
                        <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                          <table className="w-full text-center text-[11px] border-collapse bg-white">
                            <thead>
                              <tr className="bg-slate-100 text-[#102033] font-bold border-b border-slate-300 text-[10px]">
                                <th rowSpan={2} className="py-2 px-1.5 border-r border-slate-300 w-10">S.NO</th>
                                <th rowSpan={2} className="py-2 px-1.5 border-r border-slate-300 w-14">GR. NO</th>
                                <th rowSpan={2} className="py-2 px-3 border-r border-slate-300 text-left min-w-[140px]">NAME OF STUDENTS</th>
                                <th rowSpan={2} className="py-2 px-3 border-r border-slate-300 text-left min-w-[130px]">FATHER'S NAME</th>
                                <th colSpan={3} className="py-1 px-1 border-r border-slate-300 bg-amber-50/70 text-amber-900">ISLAMIAT</th>
                                <th rowSpan={2} className="py-2 px-1.5 border-r border-slate-300">S.St<br/><span className="text-[9px] font-normal text-slate-500">100</span></th>
                                <th rowSpan={2} className="py-2 px-1.5 border-r border-slate-300">SINDHI<br/><span className="text-[9px] font-normal text-slate-500">100</span></th>
                                <th rowSpan={2} className="py-2 px-1.5 border-r border-slate-300">ENGLISH<br/><span className="text-[9px] font-normal text-slate-500">100</span></th>
                                <th rowSpan={2} className="py-2 px-1.5 border-r border-slate-300">SCIENCE<br/><span className="text-[9px] font-normal text-slate-500">100</span></th>
                                <th rowSpan={2} className="py-2 px-1.5 border-r border-slate-300">MATH<br/><span className="text-[9px] font-normal text-slate-500">100</span></th>
                                <th rowSpan={2} className="py-2 px-1.5 border-r border-slate-300">URDU<br/><span className="text-[9px] font-normal text-slate-500">100</span></th>
                                <th rowSpan={2} className="py-2 px-1.5 border-r border-slate-300 bg-purple-50/70 text-purple-900">DRAWING<br/><span className="text-[9px] font-normal">GRADE</span></th>
                                <th rowSpan={2} className="py-2 px-1.5 border-r border-slate-300 font-black">Grand Total<br/><span className="text-[9px] font-normal text-slate-500">700</span></th>
                                <th rowSpan={2} className="py-2 px-1.5 border-r border-slate-300 font-bold">% AGE</th>
                                <th rowSpan={2} className="py-2 px-2 border-r border-slate-300 font-bold">Overall Result</th>
                                <th rowSpan={2} className="py-2 px-1.5 border-r border-slate-300 font-bold">GRADE</th>
                                <th rowSpan={2} className="py-2 px-1.5 border-r border-slate-300 font-bold text-emerald-700">Rank</th>
                                <th rowSpan={2} className="py-2 px-2 text-right">Marksheet</th>
                              </tr>
                              <tr className="bg-amber-50/50 text-[#102033] font-semibold border-b border-slate-300 text-[9px]">
                                <th className="py-1 px-1 border-r border-slate-300">Nazra<br/>20</th>
                                <th className="py-1 px-1 border-r border-slate-300">Written<br/>80</th>
                                <th className="py-1 px-1 border-r border-slate-300 font-bold">Total<br/>100</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {(tabulationData.rankedResults || []).map((row, idx) => {
                                const subjects = row.subjectMarks || [];
                                const findSubj = (name) => subjects.find((s) => (s.subjectName || '').toLowerCase().includes(name));

                                const isl = findSubj('islamiat');
                                const isNaz = isl?.subComponents ? isl.subComponents.nazra : Math.round((isl?.obtainedMarks || 0) * 0.2);
                                const isWri = isl?.subComponents ? isl.subComponents.written : ((isl?.obtainedMarks || 0) - isNaz);
                                const isTot = isl?.obtainedMarks || 0;

                                const sst = findSubj('social') || findSubj('s.st');
                                const sindhi = findSubj('sindhi');
                                const eng = findSubj('english');
                                const sci = findSubj('science');
                                const math = findSubj('math');
                                const urdu = findSubj('urdu');
                                const draw = findSubj('drawing');

                                const studentProf = row.studentProfile || {};
                                const studentUsr = row.studentId || {};
                                const studentName = studentProf.studentFullName || studentUsr.fullName || 'Student';
                                const fatherName = studentProf.fatherFullName || studentProf.fatherOrGuardianName || '-';
                                const grNum = studentProf.grNumber || studentProf.rollNumber || (idx + 1);

                                const isPassed = row.isOverallPassed;

                                return (
                                  <tr key={row._id || idx} className={`hover:bg-slate-50 transition ${idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}`}>
                                    <td className="py-2 px-1 border-r border-slate-200 text-slate-500 font-mono text-[10px]">{idx + 1}</td>
                                    <td className="py-2 px-1 border-r border-slate-200 font-mono font-bold text-[#102033]">{grNum}</td>
                                    <td className="py-2 px-2.5 border-r border-slate-200 text-left font-bold text-[#102033]">{studentName}</td>
                                    <td className="py-2 px-2.5 border-r border-slate-200 text-left text-slate-600">{fatherName}</td>

                                    {/* Islamiat Nazra, Written, Total with Red styling for failing */}
                                    <td className={`py-2 px-1 border-r border-slate-200 font-mono ${isNaz < 7 ? 'text-rose-600 font-bold' : ''}`}>{isNaz}</td>
                                    <td className={`py-2 px-1 border-r border-slate-200 font-mono ${isWri < 27 ? 'text-rose-600 font-bold' : ''}`}>{isWri}</td>
                                    <td className={`py-2 px-1 border-r border-slate-200 font-mono font-bold ${isTot < 33 ? 'text-rose-600' : ''}`}>{isTot}</td>

                                    {/* Standard Subjects (Red if < 33) */}
                                    <td className={`py-2 px-1 border-r border-slate-200 font-mono ${(sst?.obtainedMarks ?? 0) < 33 ? 'text-rose-600 font-bold' : ''}`}>{sst?.obtainedMarks ?? '-'}</td>
                                    <td className={`py-2 px-1 border-r border-slate-200 font-mono ${(sindhi?.obtainedMarks ?? 0) < 33 ? 'text-rose-600 font-bold' : ''}`}>{sindhi?.obtainedMarks ?? '-'}</td>
                                    <td className={`py-2 px-1 border-r border-slate-200 font-mono ${(eng?.obtainedMarks ?? 0) < 33 ? 'text-rose-600 font-bold' : ''}`}>{eng?.obtainedMarks ?? '-'}</td>
                                    <td className={`py-2 px-1 border-r border-slate-200 font-mono ${(sci?.obtainedMarks ?? 0) < 33 ? 'text-rose-600 font-bold' : ''}`}>{sci?.obtainedMarks ?? '-'}</td>
                                    <td className={`py-2 px-1 border-r border-slate-200 font-mono ${(math?.obtainedMarks ?? 0) < 33 ? 'text-rose-600 font-bold' : ''}`}>{math?.obtainedMarks ?? '-'}</td>
                                    <td className={`py-2 px-1 border-r border-slate-200 font-mono ${(urdu?.obtainedMarks ?? 0) < 33 ? 'text-rose-600 font-bold' : ''}`}>{urdu?.obtainedMarks ?? '-'}</td>

                                    {/* Drawing (Letter Grade) */}
                                    <td className="py-2 px-1 border-r border-slate-200 font-bold text-purple-700 bg-purple-50/20">{draw?.letterGrade || 'A'}</td>

                                    {/* Grand Total (out of 700) */}
                                    <td className={`py-2 px-1 border-r border-slate-200 font-mono font-black ${row.totalObtainedMarks < 231 ? 'text-rose-600' : 'text-[#102033]'}`}>
                                      {row.totalObtainedMarks ?? 0}
                                    </td>

                                    {/* % AGE */}
                                    <td className="py-2 px-1 border-r border-slate-200 font-bold text-[#006AC7]">
                                      {row.percentage}%
                                    </td>

                                    {/* Overall Result */}
                                    <td className="py-2 px-1.5 border-r border-slate-200 font-bold">
                                      <span className={`px-2 py-0.5 rounded text-[10px] ${isPassed ? 'bg-emerald-50 text-[#15803d]' : 'bg-rose-50 text-rose-700 font-bold'}`}>
                                        {isPassed ? 'PASSED' : 'FAILED'}
                                      </span>
                                    </td>

                                    {/* GRADE */}
                                    <td className={`py-2 px-1 border-r border-slate-200 font-black ${isPassed ? 'text-[#102033]' : 'text-rose-600'}`}>
                                      {row.grade || (isPassed ? 'D' : 'FAIL')}
                                    </td>

                                    {/* Rank */}
                                    <td className="py-2 px-1 border-r border-slate-200 font-bold">
                                      {isPassed ? (
                                        <span className="bg-emerald-50 text-emerald-700 font-black px-1.5 py-0.5 rounded text-[10px]">
                                          {row.rankFormatted || `${row.rank}th`}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 font-normal">-</span>
                                      )}
                                    </td>

                                    {/* Individual Marksheet PDF Download */}
                                    <td className="py-2 px-2 text-right">
                                      {['VERIFIED_BY_HM', 'PUBLISHED'].includes(row.status) ? (
                                        <button
                                          onClick={() => handleDownloadStudentMarksheet(selectedExamId, row.studentId?._id || row.studentId, studentName)}
                                          disabled={downloadingPdf}
                                          title="Download Official A4 Marksheet PDF"
                                          className="px-2 py-1 rounded bg-emerald-50 text-[#15803d] border border-emerald-200 text-[10px] font-bold hover:bg-emerald-100 transition cursor-pointer inline-flex items-center gap-1"
                                        >
                                          <Download className="w-3 h-3" /> Marksheet
                                        </button>
                                      ) : (
                                        <span className="text-[10px] text-amber-600 italic">Verify First</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Bottom Municipal Statistics Box matching Image 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                          <div>
                            <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#8094A8] mb-2">
                              Official Municipal Examination Statistics
                            </h5>
                            <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                              <div className="grid grid-cols-2 border-b border-slate-300 bg-white">
                                <div className="p-2 border-r border-slate-300 flex justify-between">
                                  <span className="text-slate-500 font-semibold">No. of Students:</span>
                                  <span className="font-bold text-[#102033]">{tabulationData.classStatistics?.totalEnrolled || 0}</span>
                                </div>
                                <div className="p-2 flex justify-between">
                                  <span className="text-slate-500 font-semibold">No. Appeared:</span>
                                  <span className="font-bold text-[#102033]">{tabulationData.classStatistics?.appearedCount || 0}</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 border-b border-slate-300 bg-white">
                                <div className="p-2 border-r border-slate-300 flex justify-between">
                                  <span className="text-slate-500 font-semibold">No. of Absentees:</span>
                                  <span className="font-bold text-[#102033]">{tabulationData.classStatistics?.absenteesCount || 0}</span>
                                </div>
                                <div className="p-2 flex justify-between">
                                  <span className="text-slate-500 font-semibold">Passing %Age:</span>
                                  <span className="font-bold text-emerald-600">{tabulationData.classStatistics?.passingPercentage || 0}%</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 bg-white">
                                <div className="p-2 border-r border-slate-300 flex justify-between">
                                  <span className="text-slate-500 font-semibold">Students Passed:</span>
                                  <span className="font-bold text-emerald-600">{tabulationData.classStatistics?.passedCount || 0}</span>
                                </div>
                                <div className="p-2 flex justify-between">
                                  <span className="text-slate-500 font-semibold">Students Failed:</span>
                                  <span className="font-bold text-rose-600">{tabulationData.classStatistics?.failedCount || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col justify-between p-3 rounded-lg bg-white border border-slate-200">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8094A8] block">
                                Municipal Certification & Official Signatures
                              </span>
                              <p className="text-xs text-[#526477] mt-1">
                                Consolidated Elementary Board Tabulation Sheet conforms to the official 4-tier municipal authority certification:
                              </p>
                              <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] text-[#102033]">
                                <div className="p-2 rounded bg-slate-50 border border-slate-100 font-semibold">
                                  1. Signature of H.M / Principal
                                </div>
                                <div className="p-2 rounded bg-slate-50 border border-slate-100 font-semibold">
                                  2. Signature of Deputy Controller
                                </div>
                                <div className="p-2 rounded bg-slate-50 border border-slate-100 font-semibold">
                                  3. Signature of Supervisor
                                </div>
                                <div className="p-2 rounded bg-slate-50 border border-slate-100 font-semibold">
                                  4. Signature of Deputy Director Education
                                </div>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 text-right italic">
                              Generated automatically via Elementary Board DMC Liaquatabad / Karachi Central Engine
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 7: FACULTY TRANSFERS & INSTITUTIONAL MOVEMENT LEDGER            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'transfers' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-[#006AC7]" />
                Faculty Transfer Lifecycle & Institutional Movement Ledger
              </h3>
              <p className="text-xs text-[#526477] mt-0.5">
                Official DMC Liaquatabad Town transfer governance: certify asset clearance for departures and verify physical arrivals for joining.
              </p>
            </div>
            <button
              onClick={() => dispatch(fetchIncomingTransfers({ direction: transferViewDirection }))}
              className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#526477] hover:text-[#102033] hover:bg-slate-50 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${transfersLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Direction Navigation Pills */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
            <button
              onClick={() => setTransferViewDirection('incoming')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                transferViewDirection === 'incoming'
                  ? 'bg-white text-[#006AC7] shadow-sm'
                  : 'text-[#526477] hover:text-[#102033]'
              }`}
            >
              <span>Incoming Faculty (Arrivals)</span>
              {summary?.metrics?.pendingQueues?.incomingTransfers > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
                  {summary.metrics.pendingQueues.incomingTransfers}
                </span>
              )}
            </button>
            <button
              onClick={() => setTransferViewDirection('outgoing')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                transferViewDirection === 'outgoing'
                  ? 'bg-white text-[#006AC7] shadow-sm'
                  : 'text-[#526477] hover:text-[#102033]'
              }`}
            >
              <span>Outgoing Faculty (Clearance & Relieving)</span>
            </button>
            <button
              onClick={() => setTransferViewDirection('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                transferViewDirection === 'history'
                  ? 'bg-white text-[#006AC7] shadow-sm'
                  : 'text-[#526477] hover:text-[#102033]'
              }`}
            >
              <span>Movement History & Archival Ledger</span>
            </button>
          </div>

          {/* Transfer List Container */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            {transfersLoading ? (
              <div className="py-12 text-center text-sm text-[#526477] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#006AC7]" />
                Querying institutional transfer directive ledger...
              </div>
            ) : transfers.length === 0 ? (
              <div className="p-12 text-center text-sm text-[#8094A8] bg-slate-50 rounded-2xl space-y-2">
                <ArrowLeftRight className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-[#102033]">
                  {transferViewDirection === 'incoming'
                    ? 'No incoming faculty transfers awaiting arrival for your school.'
                    : transferViewDirection === 'outgoing'
                    ? 'No departing faculty members currently scheduled for relieving.'
                    : 'No historical transfer movement records found for your school.'}
                </p>
                <p className="text-xs text-[#8094A8]">
                  Official transfer orders issued by Town Administration will appear in this registry.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transfers.map((tr) => {
                  const isIncoming = String(tr.toSchoolId?._id || tr.toSchoolId) === String(user?.schoolId?._id || user?.schoolId);
                  const isOutgoing = String(tr.fromSchoolId?._id || tr.fromSchoolId) === String(user?.schoolId?._id || user?.schoolId);

                  const canRelieve = isOutgoing && ['APPROVED', 'INITIATED', 'TRANSFER_REQUESTED'].includes(tr.status);
                  const canJoin = isIncoming && ['RELIEVED', 'AWAITING_DESTINATION_HM'].includes(tr.status);
                  const canReject = isIncoming && ['RELIEVED', 'AWAITING_DESTINATION_HM'].includes(tr.status);

                  return (
                    <div
                      key={tr._id}
                      className="p-5 rounded-2xl border border-slate-200/80 hover:bg-slate-50/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#102033] text-sm">
                            {tr.teacherUserId?.fullName || 'Faculty Member'}
                          </span>
                          {tr.teacherUserId?.designation && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-[#526477]">
                              {tr.teacherUserId.designation}
                            </span>
                          )}
                          {tr.officialOrderNumber && (
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-[#006AC7] border border-blue-200">
                              Order #{tr.officialOrderNumber}
                            </span>
                          )}
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                              tr.status === 'JOINED' || tr.status === 'JOINING_APPROVED'
                                ? 'bg-emerald-50 text-[#4B7F3A] border-emerald-200'
                                : tr.status === 'RELIEVED' || tr.status === 'AWAITING_DESTINATION_HM'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : tr.status === 'APPROVED'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : tr.status === 'REJECTED_BY_HM'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {tr.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-[#526477]">
                          <span className="font-medium text-[#102033]">
                            {tr.fromSchoolId?.name || 'Previous School'}
                          </span>
                          <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-[#006AC7]">
                            {tr.toSchoolId?.name || 'Destination School'}
                          </span>
                        </div>

                        <p className="text-xs text-[#8094A8]">
                          <span className="font-semibold text-[#526477]">Reason:</span> {tr.reason}
                        </p>

                        {tr.relievingDetails?.relievedAt && (
                          <p className="text-[11px] text-[#526477]">
                            <span className="font-semibold">Relieved:</span> {new Date(tr.relievingDetails.relievedAt).toLocaleDateString()}
                            {tr.relievingDetails.relievingOrderNumber ? ` • Ref: ${tr.relievingDetails.relievingOrderNumber}` : ''}
                          </p>
                        )}

                        {tr.destinationHMReview?.joiningDateConfirmed && (
                          <p className="text-[11px] text-[#4B7F3A]">
                            <span className="font-semibold">Joined:</span> {new Date(tr.destinationHMReview.joiningDateConfirmed).toLocaleDateString()}
                            {tr.destinationHMReview.hmRemarks ? ` • "${tr.destinationHMReview.hmRemarks}"` : ''}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        {canRelieve && (
                          <button
                            onClick={() =>
                              setRelieveModal({
                                open: true,
                                transfer: tr,
                                relievingDate: new Date().toISOString().split('T')[0],
                                relievingRemarks: '',
                                relievingOrderNumber: tr.officialOrderNumber || '',
                                clearanceCertified: false,
                              })
                            }
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#006AC7] hover:bg-[#005299] text-white transition cursor-pointer shadow-sm"
                          >
                            Certify Clearance & Relieve
                          </button>
                        )}

                        {canJoin && (
                          <button
                            onClick={() =>
                              setJoiningModal({
                                open: true,
                                transfer: tr,
                                remarks: '',
                                joiningDate: new Date().toISOString().split('T')[0],
                              })
                            }
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#4B7F3A] hover:bg-[#3d682f] text-white transition cursor-pointer shadow-sm"
                          >
                            Approve Physical Joining
                          </button>
                        )}

                        {canReject && (
                          <button
                            onClick={() =>
                              setRejectJoiningModal({
                                open: true,
                                transfer: tr,
                                rejectionReason: '',
                              })
                            }
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer border border-rose-200"
                          >
                            Reject Arrival
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 8: SCHOOL CIRCULARS & NOTICES                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'notices' && (
        <div className="space-y-6">
          {/* Header & Publish Button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#006AC7]" />
                School Circulars & Official Notice Board
              </h3>
              <p className="text-xs text-[#526477]">
                Authoritative internal circulars, operational notices, and municipality directives for your school.
              </p>
            </div>
            <button
              onClick={() => setNewNoticeModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#006AC7] hover:bg-[#005299] text-white flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Publish Circular
            </button>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Scope Category Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setNoticeCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  noticeCategoryFilter === 'all'
                    ? 'bg-white text-[#006AC7] shadow-sm'
                    : 'text-[#526477] hover:text-[#102033]'
                }`}
              >
                All Communications
              </button>
              <button
                onClick={() => setNoticeCategoryFilter('school')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  noticeCategoryFilter === 'school'
                    ? 'bg-white text-[#4B7F3A] shadow-sm'
                    : 'text-[#526477] hover:text-[#102033]'
                }`}
              >
                School Notices
              </button>
              <button
                onClick={() => setNoticeCategoryFilter('department')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  noticeCategoryFilter === 'department'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-[#526477] hover:text-[#102033]'
                }`}
              >
                Department Directives
              </button>
            </div>

            {/* Document Type Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#8094A8]" />
                <select
                  value={noticeTypeFilter}
                  onChange={(e) => setNoticeTypeFilter(e.target.value)}
                  className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-medium text-[#102033] focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
                >
                  <option value="">All Document Types</option>
                  <option value="CIRCULAR">Circulars</option>
                  <option value="NOTIFICATION">Notifications</option>
                  <option value="POLICY">Policies</option>
                  <option value="EVENT_NOTICE">Event Notices</option>
                </select>
              </div>

              <div className="relative min-w-[200px] flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8094A8]" />
                <input
                  type="text"
                  value={noticeSearchQuery}
                  onChange={(e) => setNoticeSearchQuery(e.target.value)}
                  placeholder="Search notices..."
                  maxLength={100}
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
                />
              </div>
            </div>
          </div>

          {/* Active Notices List */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-[#8094A8] tracking-wider">
                Official Documents & Notices ({notices.length})
              </h4>
            </div>

            {noticesLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-sm text-[#526477]">
                <Loader2 className="w-5 h-5 animate-spin text-[#006AC7]" /> Loading official notice board...
              </div>
            ) : notices.length === 0 ? (
              <div className="p-12 text-center text-sm text-[#8094A8] bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No notices found matching the selected scope and criteria.
              </div>
            ) : (
              <div className="space-y-3">
                {notices.map((doc) => {
                  const isSchoolNotice = doc.scope === 'SCHOOL' || String(doc.schoolId?._id || doc.schoolId) === String(user?.schoolId?._id || user?.schoolId);
                  const isPinned = doc.isPinned || doc.priority === 'URGENT';
                  const isArchived = doc.status === 'ARCHIVED';

                  return (
                    <div
                      key={doc._id}
                      className={`p-5 rounded-2xl border transition hover:shadow-sm ${
                        isPinned
                          ? 'border-amber-300 bg-amber-50/20'
                          : isSchoolNotice
                          ? 'border-slate-200/90 bg-white hover:bg-slate-50/40'
                          : 'border-indigo-200 bg-indigo-50/20'
                      }`}
                    >
                      {/* Top Meta Bar: Badges & Date */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {isPinned && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <Pin className="w-3 h-3 text-amber-700" /> PINNED / URGENT
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              doc.scope === 'GLOBAL'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : doc.scope === 'TOWN'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : 'bg-emerald-100 text-[#4B7F3A] border border-emerald-200'
                            }`}
                          >
                            {doc.scope === 'GLOBAL'
                              ? 'GLOBAL DIRECTIVE'
                              : doc.scope === 'TOWN'
                              ? 'DEPARTMENT DIRECTIVE'
                              : 'SCHOOL CIRCULAR'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {doc.documentType}
                          </span>
                          {isArchived && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                              ARCHIVED
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-[#8094A8]">
                          {new Date(doc.createdAt).toLocaleDateString('en-PK', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Title & Reference Number */}
                      <div className="mb-2">
                        <h5 className="font-bold text-[#102033] text-sm sm:text-base flex items-center gap-2">
                          {doc.title}
                          {doc.referenceNumber && (
                            <span className="font-mono text-xs font-semibold text-[#006AC7] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              Ref: {doc.referenceNumber}
                            </span>
                          )}
                        </h5>
                        {doc.description && (
                          <p className="text-xs text-[#526477] mt-1 leading-relaxed">{doc.description}</p>
                        )}
                      </div>

                      {/* Detail Metadata & Actions Footer */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#8094A8]">
                          <span>
                            Audience:{' '}
                            <strong className="text-[#102033]">
                              {Array.isArray(doc.targetAudience) ? doc.targetAudience.join(', ') : doc.targetAudience || 'ALL'}
                            </strong>
                          </span>
                          {doc.publishedBy?.fullName && (
                            <span>
                              By: <strong className="text-[#102033]">{doc.publishedBy.fullName}</strong>
                            </span>
                          )}
                          {doc.fileSizeBytes && (
                            <span className="flex items-center gap-1">
                              <Paperclip className="w-3 h-3 text-[#006AC7]" />
                              {(doc.fileSizeBytes / 1024).toFixed(0)} KB
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          {/* View Attachment Button */}
                          {(doc.fileUrl || doc.fileMimeType) && (
                            <button
                              onClick={() => handleViewNoticeAttachment(doc._id)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#006AC7] bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center gap-1.5 transition cursor-pointer"
                              title="Securely view verified document attachment"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> View File
                            </button>
                          )}

                          {/* HM Administrative Actions for Own School Notices */}
                          {isSchoolNotice ? (
                            <>
                              {!isArchived && (
                                <button
                                  onClick={() => handleArchiveNoticeSubmit(doc._id)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center gap-1.5 transition cursor-pointer"
                                  title="Archive circular"
                                >
                                  <Archive className="w-3.5 h-3.5" /> Archive
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteNoticeSubmit(doc._id)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1.5 transition cursor-pointer"
                                title="Permanently delete circular & attachment"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-[#8094A8] flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg border border-slate-200">
                              <Lock className="w-3 h-3 text-slate-400" /> Municipality Directive (Read-Only)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODALS                                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* Approval Decision Modal */}
      {approvalModal.open && approvalModal.user && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#102033]">
              Review Application: {approvalModal.user.fullName}
            </h3>
            <div className="text-xs text-[#526477] space-y-1 bg-slate-50 p-3 rounded-xl border">
              <p><span className="font-semibold text-[#102033]">Role:</span> {approvalModal.user.role}</p>
              <p><span className="font-semibold text-[#102033]">Email:</span> {approvalModal.user.email}</p>
              <p><span className="font-semibold text-[#102033]">CNIC:</span> {approvalModal.user.cnicMasked || 'Protected'}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Administrative Remarks</label>
              <textarea
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                placeholder="Required when rejecting or requesting correction..."
                rows={3}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setApprovalModal({ open: false, user: null, type: 'staff' })}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#526477] hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleProcessApproval('REJECT')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer"
              >
                Reject
              </button>
              <button
                onClick={() => handleProcessApproval('APPROVE')}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#4B7F3A] hover:bg-[#3d682f] text-white cursor-pointer"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Class Modal */}
      {newClassModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateClassSubmit} className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#102033]">Add Academic Class</h3>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Class Name</label>
              <input
                type="text"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="e.g. Class 6"
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Numeric Grade Level (1 - 12)</label>
              <input
                type="number"
                min={1}
                max={12}
                value={newClassGrade}
                onChange={(e) => setNewClassGrade(e.target.value)}
                placeholder="e.g. 6"
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setNewClassModal(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#526477]">Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#006AC7] text-white">Create Class</button>
            </div>
          </form>
        </div>
      )}

      {/* New Section Modal */}
      {newSectionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateSectionSubmit} className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#102033]">Add Section</h3>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Select Class</label>
              <select
                value={newSectionData.classId}
                onChange={(e) => setNewSectionData({ ...newSectionData, classId: e.target.value })}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              >
                <option value="">-- Choose Class --</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Section Name</label>
              <input
                type="text"
                value={newSectionData.name}
                onChange={(e) => setNewSectionData({ ...newSectionData, name: e.target.value })}
                placeholder="e.g. A, B, Green"
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setNewSectionModal(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#526477]">Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#006AC7] text-white">Create Section</button>
            </div>
          </form>
        </div>
      )}

      {/* New Subject Modal */}
      {newSubjectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateSubjectSubmit} className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#102033]">Add Subject</h3>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Select Class</label>
              <select
                value={newSubjectData.classId}
                onChange={(e) => setNewSubjectData({ ...newSubjectData, classId: e.target.value })}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              >
                <option value="">-- Choose Class --</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Subject Name</label>
              <input
                type="text"
                value={newSubjectData.name}
                onChange={(e) => setNewSubjectData({ ...newSubjectData, name: e.target.value })}
                placeholder="e.g. Mathematics, Science"
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setNewSubjectModal(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#526477]">Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#006AC7] text-white">Add Subject</button>
            </div>
          </form>
        </div>
      )}

      {/* Assign Teaching Duty Modal */}
      {assignDutyModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAssignDutySubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#102033]">Allocate Teaching Assignment</h3>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Select Class</label>
              <select
                value={dutyData.classId}
                onChange={(e) => setDutyData({ ...dutyData, classId: e.target.value })}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              >
                <option value="">-- Choose Class --</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Select Section</label>
              <select
                value={dutyData.sectionId}
                onChange={(e) => setDutyData({ ...dutyData, sectionId: e.target.value })}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              >
                <option value="">-- Choose Section --</option>
                {sections
                  .filter((s) => !dutyData.classId || String(s.classId) === String(dutyData.classId) || String(s.classId?._id) === String(dutyData.classId))
                  .map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Select Subject</label>
              <select
                value={dutyData.subjectId}
                onChange={(e) => setDutyData({ ...dutyData, subjectId: e.target.value })}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              >
                <option value="">-- Choose Subject --</option>
                {subjects.map((sub) => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Select Teaching Faculty Member</label>
              <select
                id="hm-assign-duty-teacher-select"
                value={dutyData.teacherId}
                onChange={(e) => setDutyData({ ...dutyData, teacherId: e.target.value })}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
              >
                <option value="">-- Choose Faculty Teacher --</option>
                {faculty.map((teacher) => (
                  <option key={teacher.userId} value={teacher.userId}>
                    {teacher.fullName} ({teacher.employeeId || 'ID Pending'}) — {teacher.designation || 'Teacher'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setAssignDutyModal(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#526477]">Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#006AC7] text-white">Confirm Assignment</button>
            </div>
          </form>
        </div>
      )}

      {/* Schedule Exam Modal */}
      {newExamModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleScheduleExamSubmit} className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#102033]">Schedule Examination</h3>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Exam Title</label>
              <input
                type="text"
                value={examData.title}
                onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                placeholder="e.g. Mid-Term Examination 2025"
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Academic Year</label>
              <select
                value={examData.academicYear}
                onChange={(e) => setExamData({ ...examData, academicYear: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              >
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
                <option value="2027-2028">2027-2028</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Exam Type</label>
              <select
                value={examData.examType}
                onChange={(e) => setExamData({ ...examData, examType: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              >
                <option value="MID_TERM">Mid-Term</option>
                <option value="FINAL_TERM">Final-Term</option>
                <option value="MONTHLY_TEST">Monthly Test</option>
                <option value="ASSESSMENT">Diagnostic Assessment</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Start Date</label>
              <input
                type="date"
                value={examData.startDate}
                onChange={(e) => setExamData({ ...examData, startDate: e.target.value })}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">End Date</label>
              <input
                type="date"
                value={examData.endDate}
                onChange={(e) => setExamData({ ...examData, endDate: e.target.value })}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setNewExamModal(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#526477]">Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#006AC7] text-white">Schedule</button>
            </div>
          </form>
        </div>
      )}

      {/* Transfer Joining Modal */}
      {joiningModal.open && joiningModal.transfer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#102033]">
              Confirm Faculty Arrival & Joining
            </h3>
            <div className="text-xs text-[#526477] bg-slate-50 p-3 rounded-xl border space-y-1">
              <p><span className="font-semibold text-[#102033]">Teacher:</span> {joiningModal.transfer.teacherUserId?.fullName}</p>
              <p><span className="font-semibold text-[#102033]">Source School:</span> {joiningModal.transfer.fromSchoolId?.name}</p>
              <p><span className="font-semibold text-[#102033]">Destination:</span> {joiningModal.transfer.toSchoolId?.name}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Confirmed Joining Date</label>
              <input
                type="date"
                value={joiningModal.joiningDate}
                onChange={(e) => setJoiningModal({ ...joiningModal, joiningDate: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Head Master Joining Remarks</label>
              <input
                type="text"
                value={joiningModal.remarks}
                onChange={(e) => setJoiningModal({ ...joiningModal, remarks: e.target.value })}
                placeholder="e.g. Physical report submitted and accepted"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setJoiningModal({ open: false, transfer: null, remarks: '', joiningDate: '' })} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#526477]">Cancel</button>
              <button onClick={handleConfirmJoining} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#4B7F3A] text-white">Approve Joining</button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Relieving Modal */}
      {relieveModal.open && relieveModal.transfer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-[#006AC7]" />
              Issue Official Relieving Order
            </h3>
            <div className="text-xs text-[#526477] bg-slate-50 p-3 rounded-xl border space-y-1">
              <p><span className="font-semibold text-[#102033]">Departing Teacher:</span> {relieveModal.transfer.teacherUserId?.fullName}</p>
              <p><span className="font-semibold text-[#102033]">Source School:</span> {relieveModal.transfer.fromSchoolId?.name}</p>
              <p><span className="font-semibold text-[#102033]">Target School:</span> {relieveModal.transfer.toSchoolId?.name}</p>
              {relieveModal.transfer.officialOrderNumber && (
                <p><span className="font-semibold text-[#102033]">Town Order Ref:</span> #{relieveModal.transfer.officialOrderNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#102033] block mb-1">Relieving Date</label>
                <input
                  type="date"
                  value={relieveModal.relievingDate}
                  onChange={(e) => setRelieveModal({ ...relieveModal, relievingDate: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#102033] block mb-1">Relieving Order #</label>
                <input
                  type="text"
                  placeholder="e.g. REL/2026/042"
                  value={relieveModal.relievingOrderNumber}
                  onChange={(e) => setRelieveModal({ ...relieveModal, relievingOrderNumber: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Handover & Relieving Remarks</label>
              <textarea
                rows={2}
                value={relieveModal.relievingRemarks}
                onChange={(e) => setRelieveModal({ ...relieveModal, relievingRemarks: e.target.value })}
                placeholder="Certified all gradebooks, examination registers, and municipal assets handed over."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={relieveModal.clearanceCertified}
                  onChange={(e) => setRelieveModal({ ...relieveModal, clearanceCertified: e.target.checked })}
                  className="mt-0.5 rounded text-[#006AC7] focus:ring-[#006AC7]"
                />
                <span className="text-xs font-semibold text-amber-900 leading-tight">
                  I formally certify that this faculty member has completed all institutional clearances, returned school keys/registers, and has no pending disciplinary holds.
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRelieveModal({ open: false, transfer: null, relievingDate: '', relievingRemarks: '', relievingOrderNumber: '', clearanceCertified: false })}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#526477] hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRelieving}
                disabled={!relieveModal.clearanceCertified}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#006AC7] hover:bg-[#005299] disabled:bg-slate-300 text-white transition shadow-sm cursor-pointer"
              >
                Issue Relieving Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Rejection Modal */}
      {rejectJoiningModal.open && rejectJoiningModal.transfer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Reject Faculty Physical Arrival
            </h3>
            <p className="text-xs text-[#526477]">
              State the exact institutional, documentation, or procedural discrepancies observed. The transfer directive will be referred to Town Administration for formal inquiry.
            </p>
            <div className="text-xs text-[#526477] bg-slate-50 p-3 rounded-xl border space-y-1">
              <p><span className="font-semibold text-[#102033]">Candidate:</span> {rejectJoiningModal.transfer.teacherUserId?.fullName}</p>
              <p><span className="font-semibold text-[#102033]">Origin School:</span> {rejectJoiningModal.transfer.fromSchoolId?.name}</p>
            </div>

            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">
                Detailed Rejection Reason <span className="text-rose-500">* (Min 10 chars)</span>
              </label>
              <textarea
                rows={3}
                value={rejectJoiningModal.rejectionReason}
                onChange={(e) => setRejectJoiningModal({ ...rejectJoiningModal, rejectionReason: e.target.value })}
                placeholder="e.g. Discrepancy in relieving order credentials; subject quota full; identity mismatch."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRejectJoiningModal({ open: false, transfer: null, rejectionReason: '' })}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#526477] hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejectJoining}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm cursor-pointer"
              >
                Confirm Rejection & Refer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Notice Modal */}
      {newNoticeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <form onSubmit={handlePublishNoticeSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#006AC7]" />
                Publish School Circular
              </h3>
              <button
                type="button"
                onClick={() => setNewNoticeModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">
                Circular / Notice Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={noticeData.title}
                onChange={(e) => setNoticeData({ ...noticeData, title: e.target.value })}
                placeholder="e.g. Annual Sports Day Schedule 2026"
                required
                maxLength={200}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#102033] block mb-1">Reference Number</label>
                <input
                  type="text"
                  value={noticeData.referenceNumber}
                  onChange={(e) => setNoticeData({ ...noticeData, referenceNumber: e.target.value })}
                  placeholder="e.g. HM/CIR/2026/01"
                  maxLength={50}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#102033] block mb-1">Document Type</label>
                <select
                  value={noticeData.documentType}
                  onChange={(e) => setNoticeData({ ...noticeData, documentType: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-[#102033] focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
                >
                  <option value="CIRCULAR">Circular</option>
                  <option value="NOTIFICATION">Notification</option>
                  <option value="POLICY">Policy</option>
                  <option value="EVENT_NOTICE">Event Notice</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#102033] block mb-1">Priority</label>
                <select
                  value={noticeData.priority}
                  onChange={(e) => setNoticeData({ ...noticeData, priority: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-[#102033] focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
                >
                  <option value="NORMAL">Normal Priority</option>
                  <option value="URGENT">Urgent (Pins Notice)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#102033] block mb-1">Jurisdiction Scope</label>
                <div className="text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-[#4B7F3A]">
                  SCHOOL (Locked)
                </div>
              </div>
            </div>

            {/* Target Audience Multi-Checkboxes */}
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1.5">
                Target Audience <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                {['TEACHERS', 'STUDENTS', 'PARENTS'].map((role) => (
                  <label key={role} className="flex items-center gap-1.5 text-xs text-[#526477] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noticeData.targetAudience.includes(role)}
                      onChange={() => handleToggleAudience(role)}
                      className="rounded text-[#006AC7] focus:ring-[#006AC7]"
                    />
                    <span className="font-semibold capitalize">{role.toLowerCase()}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Notice Description / Remarks</label>
              <textarea
                value={noticeData.description}
                onChange={(e) => setNoticeData({ ...noticeData, description: e.target.value })}
                rows={3}
                placeholder="Detailed instructions or description..."
                maxLength={2000}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
              />
            </div>

            {/* File Attachment Upload */}
            <div>
              <label className="text-xs font-bold text-[#102033] block mb-1">Document Attachment (Optional)</label>
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setSelectedNoticeFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#006AC7] hover:file:bg-blue-100 cursor-pointer"
              />
              <p className="text-[10px] text-[#8094A8] mt-1">
                Supported: PDF, JPEG, PNG, WebP (Max: 10MB). Magic bytes validation active.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setNewNoticeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#526477] hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#006AC7] hover:bg-[#005299] text-white shadow-sm transition cursor-pointer"
              >
                Publish Circular
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Add Student Modal ──────────────────────────────────────────────── */}
      <HmAddStudentModal
        isOpen={addStudentModalOpen}
        onClose={() => setAddStudentModalOpen(false)}
        schoolId={user?.schoolId?._id || user?.schoolId}
        classes={classes}
        sections={sections}
        onSuccess={() => {
          loadStudents({ page: 1 });
          dispatch(fetchHmSummary());
        }}
      />

      {/* ── Set School Code Modal ──────────────────────────────────────────── */}
      {schoolCodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#006AC7]" />
                Configure School Code
              </h3>
              <button onClick={() => setSchoolCodeModalOpen(false)} className="text-[#8094A8] hover:text-[#102033] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#526477]">
              Setting the school code establishes the authoritative prefix for Global Student IDs (e.g. <strong>LMGA-0001</strong>). Existing enrolled students will be automatically assigned their sequential ID.
            </p>
            <form onSubmit={handleUpdateSchoolCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#102033] mb-1">School Code (2-10 Uppercase Alphanumeric)</label>
                <input
                  type="text"
                  value={newSchoolCodeInput}
                  onChange={(e) => setNewSchoolCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. LMGA"
                  maxLength={10}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono uppercase text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSchoolCodeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#526477] hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#006AC7] hover:bg-[#005299] text-white transition cursor-pointer"
                >
                  Save & Backfill IDs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default HmDashboard;
