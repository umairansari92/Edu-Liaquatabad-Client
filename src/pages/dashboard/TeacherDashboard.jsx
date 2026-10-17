import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  ClipboardList,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  BookOpen,
  FileText,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Info,
  CalendarDays,
  School,
  Award,
  PlusCircle,
  Search,
  Check,
  X,
  FileSpreadsheet,
  IdCard,
  Send,
  Trash2,
  Download,
  RotateCcw,
  Eye,
  CalendarCheck,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageContainer from '../../components/layout/PageContainer.jsx';
import PersonalScheduleView from '../../components/timetable/PersonalScheduleView.jsx';
import HomeworkAttachmentUploader from '../../components/common/HomeworkAttachmentUploader.jsx';
import HomeworkAttachmentsViewer from '../../components/common/HomeworkAttachmentsViewer.jsx';
import { revokePreviewUrl } from '../../utils/imageCompressor.js';
import { getErrorMessage } from '../../utils/errorUtils.js';
import useReliabilityDraft from '../../hooks/useReliabilityDraft.js';
import DraftRecoveryBanner from '../../components/common/DraftRecoveryBanner.jsx';
import DraftStatusIndicator from '../../components/common/DraftStatusIndicator.jsx';
import {
  fetchTeacherSummary,
  fetchSectionRoster,
  fetchAttendanceSheet,
  submitStudentAttendance,
  fetchSchoolExams,
  fetchExamMarksRoster,
  bulkSubmitExamMarks,
  fetchMyHomework,
  createHomework,
  cancelHomework,
  fetchTeacherCirculars,
  fetchTeacherSelfAttendance,
  fetchClBalance,
  fetchMyLeaveRequests,
  submitLeaveRequest,
  selectTeacherSummary,
  selectTeacherSummaryLoading,
  selectAttendanceSheet,
  selectAttendanceLoading,
  selectAttendanceSubmitting,
  selectSchoolExams,
  selectExamRoster,
  selectExamRosterLoading,
  selectExamMarksSubmitting,
  selectTeacherHomework,
  selectHomeworkLoading,
  selectTeacherCirculars,
  selectTeacherSelfAttendance,
  selectTeacherSectionRoster,
  selectTeacherClBalance,
  selectTeacherClBalanceLoading,
  selectTeacherLeaveRequests,
  selectTeacherLeaveLoading,
  selectTeacherLeaveSubmitting,
} from '../../store/slices/teacherSlice.js';

// ─── Utility Helpers ─────────────────────────────────────────────────────────
const formatDate = (dateValue) => {
  const dateInstance = dateValue ? new Date(dateValue) : new Date();
  return dateInstance.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Dashboard Tabs Definition ────────────────────────────────────────────────
const DASHBOARD_TABS = [
  { id: 'CLASSES', label: 'My Classes', icon: GraduationCap },
  { id: 'ATTENDANCE', label: 'Daily Attendance', icon: ClipboardList },
  { id: 'EXAMS', label: 'Exam Marks', icon: Award },
  { id: 'HOMEWORK', label: 'Homework', icon: FileText },
  { id: 'TIMETABLE', label: 'Timetable', icon: CalendarDays },
  { id: 'CIRCULARS', label: 'Notice Board', icon: FileSpreadsheet },
  { id: 'SERVICE', label: 'My Service Record', icon: IdCard },
];

// ─── KPI Summary Card ────────────────────────────────────────────────────────
const KpiCard = ({ icon: IconComponent, label, value, sub, color = 'blue', loading = false }) => {
  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-[#006AC7]', border: 'border-blue-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-[#4B7F3A]', border: 'border-emerald-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
  };
  const theme = colorMap[color] || colorMap.blue;

  return (
    <div className="relative p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden hover:shadow-sm transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#526477]">{label}</span>
        <div className={`p-2.5 rounded-xl ${theme.bg}`}>
          <IconComponent className={`w-4 h-4 ${theme.text}`} />
        </div>
      </div>
      {loading ? (
        <div className="h-8 flex items-center">
          <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
        </div>
      ) : (
        <p className="text-2xl sm:text-3xl font-black text-[#102033] tracking-tight">{value}</p>
      )}
      {sub && <p className="text-xs text-[#8094A8] mt-1 font-medium">{sub}</p>}
    </div>
  );
};

// ─── Main Teacher Dashboard ──────────────────────────────────────────────────
export const TeacherDashboard = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: authenticatedUser } = useSelector((state) => state.auth);

  // Redux Selectors
  const summary = useSelector(selectTeacherSummary);
  const summaryLoading = useSelector(selectTeacherSummaryLoading);
  const attendanceSheetData = useSelector(selectAttendanceSheet);
  const attendanceLoading = useSelector(selectAttendanceLoading);
  const attendanceSubmitting = useSelector(selectAttendanceSubmitting);
  const examsList = useSelector(selectSchoolExams);
  const examRosterData = useSelector(selectExamRoster);
  const examRosterLoading = useSelector(selectExamRosterLoading);
  const examMarksSubmitting = useSelector(selectExamMarksSubmitting);
  const homeworkList = useSelector(selectTeacherHomework);
  const homeworkLoading = useSelector(selectHomeworkLoading);
  const circularsList = useSelector(selectTeacherCirculars);
  const selfAttendance = useSelector(selectTeacherSelfAttendance);
  const sectionRosterData = useSelector(selectTeacherSectionRoster);
  const clBalance = useSelector(selectTeacherClBalance);
  const clBalanceLoading = useSelector(selectTeacherClBalanceLoading);
  const myLeaveRequests = useSelector(selectTeacherLeaveRequests);
  const leaveRequestsLoading = useSelector(selectTeacherLeaveLoading);
  const leaveSubmitting = useSelector(selectTeacherLeaveSubmitting);

  // Derive initial tab from URL param or default to CLASSES
  const resolveTabFromParam = useCallback((paramValue) => {
    if (!paramValue) return 'CLASSES';
    const normalized = paramValue.toUpperCase();
    if (normalized === 'ATTENDANCE') return 'ATTENDANCE';
    if (normalized === 'EXAMS' || normalized === 'RESULTS') return 'EXAMS';
    if (normalized === 'HOMEWORK') return 'HOMEWORK';
    if (normalized === 'TIMETABLE' || normalized === 'SCHEDULE') return 'TIMETABLE';
    if (normalized === 'CIRCULARS' || normalized === 'NOTICES') return 'CIRCULARS';
    if (normalized === 'SERVICE' || normalized === 'PROFILE') return 'SERVICE';
    return 'CLASSES';
  }, []);

  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(() => resolveTabFromParam(urlTab));

  // Sync activeTab with URL search params
  useEffect(() => {
    if (urlTab) {
      const resolvedTab = resolveTabFromParam(urlTab);
      setActiveTab(resolvedTab);
    }
  }, [urlTab, resolveTabFromParam]);

  const handleTabChange = (tabIdentifier) => {
    setActiveTab(tabIdentifier);
    setSearchParams({ tab: tabIdentifier.toLowerCase() });
  };

  // Modal States
  const [rosterModalSection, setRosterModalSection] = useState(null);
  const [assignHomeworkModal, setAssignHomeworkModal] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  // Leave Form Local State
  const [leaveType, setLeaveType] = useState('CASUAL_LEAVE');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const calculatedLeaveDays = useMemo(() => {
    if (!leaveStartDate || !leaveEndDate) return 0;
    const start = new Date(leaveStartDate);
    const end = new Date(leaveEndDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [leaveStartDate, leaveEndDate]);

  const handleOpenLeaveModal = () => {
    setLeaveType('CASUAL_LEAVE');
    const today = new Date().toISOString().split('T')[0];
    setLeaveStartDate(today);
    setLeaveEndDate(today);
    setLeaveReason('');
    setLeaveModalOpen(true);
  };

  const handleSubmitLeaveForm = async (submitEvent) => {
    submitEvent.preventDefault();
    if (!leaveStartDate || !leaveEndDate || !leaveReason?.trim()) {
      toast.error('Please fill all required leave application fields.');
      return;
    }
    if (leaveReason.trim().length < 5) {
      toast.error('Please provide a meaningful reason (minimum 5 characters).');
      return;
    }
    if (leaveType === 'CASUAL_LEAVE' && calculatedLeaveDays > 3) {
      toast.error('Casual Leave (CL) cannot exceed 3 consecutive calendar days under municipal regulations. Please select Earned Leave (EL).');
      return;
    }
    if (leaveType === 'CASUAL_LEAVE' && clBalance && calculatedLeaveDays > (clBalance.remainingDays ?? 0)) {
      toast.error(`Requested ${calculatedLeaveDays} day(s) exceeds your remaining CL balance of ${clBalance.remainingDays} day(s).`);
      return;
    }
    try {
      await dispatch(submitLeaveRequest({
        leaveType,
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        reason: leaveReason.trim(),
      })).unwrap();
      toast.success('Leave application submitted successfully. Pending Head Master approval.');
      setLeaveModalOpen(false);
      setLeaveReason('');
    } catch (errorObject) {
      toast.error(getErrorMessage(errorObject, 'Failed to submit leave application.'));
    }
  };

  // Attendance Form Local State
  const [selectedAttendanceSectionId, setSelectedAttendanceSectionId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [localAttendanceRecords, setLocalAttendanceRecords] = useState([]);
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState('');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('ALL'); // ALL, EXCEPTIONS, PRESENT, ABSENT, LEAVE

  // Examination Form Local State
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedExamSectionId, setSelectedExamSectionId] = useState('');
  const [selectedExamSubjectId, setSelectedExamSubjectId] = useState('');
  const [localMarksEntries, setLocalMarksEntries] = useState([]);

  // Homework Form Local State
  const [newHwSectionId, setNewHwSectionId] = useState('');
  const [newHwSubjectId, setNewHwSubjectId] = useState('');
  const [newHwTitle, setNewHwTitle] = useState('');
  const [newHwDescription, setNewHwDescription] = useState('');
  const [newHwDueDate, setNewHwDueDate] = useState('');
  const [newHwAttachments, setNewHwAttachments] = useState([]);

  // ─── Reliability & Offline Draft Hooks ────────────────────────────────────
  const attendanceDraftKey = selectedAttendanceSectionId && attendanceDate
    ? `${selectedAttendanceSectionId}_${attendanceDate}`
    : null;

  const {
    draft: attendanceDraft,
    hasDraft: hasAttendanceDraft,
    isAutosaving: isAttendanceAutosaving,
    lastSavedAt: attendanceLastSavedAt,
    saveDraft: saveAttendanceDraft,
    discardDraft: discardAttendanceDraft,
    restoreDraft: restoreAttendanceDraft,
  } = useReliabilityDraft('teacher_attendance', attendanceDraftKey, {
    debounceMs: 1000,
    enableAutosave: true,
  });

  const homeworkDraftKey = 'create_homework_modal';
  const {
    draft: homeworkDraft,
    hasDraft: hasHomeworkDraft,
    isAutosaving: isHomeworkAutosaving,
    lastSavedAt: homeworkLastSavedAt,
    saveDraft: saveHomeworkDraft,
    discardDraft: discardHomeworkDraft,
    restoreDraft: restoreHomeworkDraft,
  } = useReliabilityDraft('teacher_homework', homeworkDraftKey, {
    debounceMs: 800,
    enableAutosave: false,
  });

  const marksDraftKey = selectedExamId && selectedExamSectionId
    ? `${selectedExamId}_${selectedExamSectionId}_${selectedExamSubjectId || 'all'}`
    : null;

  const {
    draft: marksDraft,
    hasDraft: hasMarksDraft,
    isAutosaving: isMarksAutosaving,
    lastSavedAt: marksLastSavedAt,
    saveDraft: saveMarksDraft,
    discardDraft: discardMarksDraft,
    restoreDraft: restoreMarksDraft,
  } = useReliabilityDraft('teacher_exam_marks', marksDraftKey, {
    debounceMs: 1000,
    enableAutosave: true,
  });

  const handleUpdateHomeworkDraft = (updates) => {
    const payload = {
      sectionId: updates.sectionId !== undefined ? updates.sectionId : newHwSectionId,
      subjectId: updates.subjectId !== undefined ? updates.subjectId : newHwSubjectId,
      title: updates.title !== undefined ? updates.title : newHwTitle,
      description: updates.description !== undefined ? updates.description : newHwDescription,
      dueDate: updates.dueDate !== undefined ? updates.dueDate : newHwDueDate,
    };
    if (payload.title || payload.description || payload.sectionId) {
      saveHomeworkDraft(payload);
    }
  };

  // Initial Load
  useEffect(() => {
    dispatch(fetchTeacherSummary());
    dispatch(fetchSchoolExams());
    dispatch(fetchMyHomework());
    dispatch(fetchTeacherCirculars());
    dispatch(fetchTeacherSelfAttendance({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    }));
    dispatch(fetchClBalance());
    dispatch(fetchMyLeaveRequests());
  }, [dispatch]);

  // Sync sections list
  const assignedSections = useMemo(() => summary?.sections || [], [summary]);

  // Pre-select first section when summary loads
  useEffect(() => {
    if (assignedSections.length > 0 && !selectedAttendanceSectionId) {
      setSelectedAttendanceSectionId(String(assignedSections[0]._id));
    }
  }, [assignedSections, selectedAttendanceSectionId]);

  // Load Attendance Sheet on Section/Date Change
  useEffect(() => {
    if (selectedAttendanceSectionId && attendanceDate) {
      dispatch(fetchAttendanceSheet({ sectionId: selectedAttendanceSectionId, date: attendanceDate }));
    }
  }, [dispatch, selectedAttendanceSectionId, attendanceDate]);

  // Sync Local Attendance Roster from Redux
  useEffect(() => {
    if (attendanceSheetData?.roster) {
      setLocalAttendanceRecords(
        attendanceSheetData.roster.map((student) => ({
          studentProfileId: student.studentProfileId,
          fullName: student.fullName,
          rollNumber: student.rollNumber,
          grNumber: student.grNumber,
          status: student.currentStatus || 'PRESENT',
          remarks: student.remarks || '',
        }))
      );
    }
  }, [attendanceSheetData]);

  // Sync Local Marks Entries from Redux
  useEffect(() => {
    if (examRosterData?.roster) {
      setLocalMarksEntries(
        examRosterData.roster.map((student) => ({
          studentId: student.studentId,
          fullName: student.fullName,
          grNumber: student.grNumber,
          rollNumber: student.rollNumber,
          obtainedMarks: student.existingMarks?.obtainedMarks ?? '',
          maxMarks: student.existingMarks?.maxMarks ?? (examRosterData.subjectConfig?.totalMarks || 100),
          isGradedOnly: student.existingMarks?.isGradedOnly ?? (examRosterData.subjectConfig?.isGradedOnly || false),
          letterGrade: student.existingMarks?.letterGrade ?? 'A',
          subComponents: student.existingMarks?.subComponents ?? {
            nazra: student.existingMarks?.subComponents?.nazra ?? '',
            written: student.existingMarks?.subComponents?.written ?? '',
          },
          remarks: student.existingMarks?.remarks ?? '',
        }))
      );
    }
  }, [examRosterData]);

  // ─── Live Attendance Derivations ──────────────────────────────────────────
  const totalStudentsCount = localAttendanceRecords.length;
  const absentStudentsCount = localAttendanceRecords.filter((attendanceItem) => attendanceItem.status === 'ABSENT').length;
  const leaveStudentsCount = localAttendanceRecords.filter((attendanceItem) => attendanceItem.status === 'LEAVE').length;
  const presentStudentsCount = Math.max(0, totalStudentsCount - absentStudentsCount - leaveStudentsCount);

  // Memoized filtered attendance records for fast client search & filter
  const filteredAttendanceRecords = useMemo(() => {
    return localAttendanceRecords.filter((attendanceRecord) => {
      // 1. Status Filter
      if (attendanceStatusFilter === 'EXCEPTIONS' && attendanceRecord.status === 'PRESENT') return false;
      if (attendanceStatusFilter === 'PRESENT' && attendanceRecord.status !== 'PRESENT') return false;
      if (attendanceStatusFilter === 'ABSENT' && attendanceRecord.status !== 'ABSENT') return false;
      if (attendanceStatusFilter === 'LEAVE' && attendanceRecord.status !== 'LEAVE') return false;

      // 2. Search Query (GR #, Roll #, or Student Name)
      if (attendanceSearchQuery.trim()) {
        const query = attendanceSearchQuery.trim().toLowerCase();
        const nameMatch = (attendanceRecord.fullName || '').toLowerCase().includes(query);
        const grMatch = String(attendanceRecord.grNumber || '').toLowerCase().includes(query);
        const rollMatch = String(attendanceRecord.rollNumber || '').toLowerCase().includes(query);
        return nameMatch || grMatch || rollMatch;
      }
      return true;
    });
  }, [localAttendanceRecords, attendanceStatusFilter, attendanceSearchQuery]);

  // ─── Handlers: Attendance ──────────────────────────────────────────────────
  const handleResetAllToPresent = () => {
    const updated = localAttendanceRecords.map((attendanceRecord) => ({ ...attendanceRecord, status: 'PRESENT' }));
    setLocalAttendanceRecords(updated);
    saveAttendanceDraft({ records: updated });
    toast.success('All students reset to Present.');
  };

  const handleUpdateRecordStatus = (studentProfileId, newStatus) => {
    setLocalAttendanceRecords((prev) => {
      const updated = prev.map((attendanceRecord) => (attendanceRecord.studentProfileId === studentProfileId ? { ...attendanceRecord, status: newStatus } : attendanceRecord));
      saveAttendanceDraft({ records: updated });
      return updated;
    });
  };

  const handleUpdateRecordRemarks = (studentProfileId, newRemarks) => {
    setLocalAttendanceRecords((prev) => {
      const updated = prev.map((attendanceRecord) => (attendanceRecord.studentProfileId === studentProfileId ? { ...attendanceRecord, remarks: newRemarks } : attendanceRecord));
      saveAttendanceDraft({ records: updated });
      return updated;
    });
  };

  const handleSubmitAttendanceForm = async () => {
    if (!selectedAttendanceSectionId) {
      toast.error('Please select a class section.');
      return;
    }
    if (localAttendanceRecords.length === 0) {
      toast.error('No students available to submit attendance.');
      return;
    }

    try {
      const absentStudentProfileIds = localAttendanceRecords
        .filter((attendanceRecord) => attendanceRecord.status === 'ABSENT')
        .map((attendanceRecord) => attendanceRecord.studentProfileId);
      const leaveStudentProfileIds = localAttendanceRecords
        .filter((attendanceRecord) => attendanceRecord.status === 'LEAVE')
        .map((attendanceRecord) => attendanceRecord.studentProfileId);
      const recordsWithRemarks = localAttendanceRecords
        .filter((attendanceRecord) => attendanceRecord.remarks && attendanceRecord.remarks.trim().length > 0)
        .map((attendanceRecord) => ({
          studentProfileId: attendanceRecord.studentProfileId,
          status: attendanceRecord.status,
          remarks: attendanceRecord.remarks.trim(),
        }));

      // Lightweight exception payload: server derives PRESENT for all other active students
      const payload = {
        sectionId: selectedAttendanceSectionId,
        date: attendanceDate,
        absentStudentProfileIds,
        leaveStudentProfileIds,
        records: recordsWithRemarks,
      };
      await dispatch(submitStudentAttendance(payload)).unwrap();
      discardAttendanceDraft();
      toast.success(`Attendance submitted: ${presentStudentsCount} Present, ${absentStudentsCount} Absent, ${leaveStudentsCount} Leave.`);
      dispatch(fetchTeacherSummary());
    } catch (errorObject) {
      toast.error(getErrorMessage(errorObject, 'Failed to submit attendance.'));
    }
  };

  // ─── Handlers: Examination ─────────────────────────────────────────────────
  const handleLoadExamMarksRoster = () => {
    if (!selectedExamId || !selectedExamSectionId) {
      toast.error('Please select both Examination and Class Section.');
      return;
    }
    const targetSection = assignedSections.find((sectionItem) => String(sectionItem._id) === String(selectedExamSectionId));
    const classId = targetSection?.class?._id || targetSection?.class;
    dispatch(fetchExamMarksRoster({
      examId: selectedExamId,
      classId,
      sectionId: selectedExamSectionId,
      subjectId: selectedExamSubjectId || undefined,
    }));
  };

  const handleUpdateMarksEntry = (studentId, field, value) => {
    setLocalMarksEntries((prev) => {
      const updated = prev.map((entry) => {
        if (entry.studentId !== studentId) return entry;
        if (field.startsWith('subComponents.')) {
          const subKey = field.split('.')[1];
          return {
            ...entry,
            subComponents: {
              ...entry.subComponents,
              [subKey]: value,
            },
          };
        }
        return { ...entry, [field]: value };
      });
      saveMarksDraft({ entries: updated });
      return updated;
    });
  };

  const handleBulkSubmitMarks = async () => {
    if (!selectedExamId || !selectedExamSectionId) {
      toast.error('Exam and Section must be selected.');
      return;
    }
    const targetSection = assignedSections.find((sectionItem) => String(sectionItem._id) === String(selectedExamSectionId));
    const classId = targetSection?.class?._id || targetSection?.class;

    try {
      const payload = {
        classId,
        sectionId: selectedExamSectionId,
        subjectId: selectedExamSubjectId || undefined,
        results: localMarksEntries.map((entry) => {
          if (entry.isGradedOnly) {
            return {
              studentId: entry.studentId,
              isGradedOnly: true,
              letterGrade: entry.letterGrade,
              remarks: entry.remarks || '',
            };
          }
          if (examRosterData?.isIslamiat) {
            return {
              studentId: entry.studentId,
              subComponents: {
                nazra: Number(entry.subComponents?.nazra) || 0,
                written: Number(entry.subComponents?.written) || 0,
              },
              remarks: entry.remarks || '',
            };
          }
          return {
            studentId: entry.studentId,
            obtainedMarks: Number(entry.obtainedMarks) || 0,
            maxMarks: Number(entry.maxMarks) || 100,
            remarks: entry.remarks || '',
          };
        }),
      };

      await dispatch(bulkSubmitExamMarks({
        examId: selectedExamId,
        payload,
        classId,
        sectionId: selectedExamSectionId,
        subjectId: selectedExamSubjectId || undefined,
      })).unwrap();

      discardMarksDraft();
      toast.success('Exam marks submitted successfully!');
    } catch (errorObject) {
      toast.error(getErrorMessage(errorObject, 'Failed to submit exam marks.'));
    }
  };

  const handleCloseAssignModal = () => {
    newHwAttachments.forEach((att) => {
      if (att.previewUrl) revokePreviewUrl(att.previewUrl);
    });
    setNewHwAttachments([]);
    setAssignHomeworkModal(false);
  };

  // ─── Handlers: Homework ────────────────────────────────────────────────────
  const handleCreateHomework = async (submitEvent) => {
    submitEvent.preventDefault();
    if (!newHwSectionId || !newHwSubjectId || !newHwTitle || !newHwDueDate) {
      toast.error('Please fill all required homework fields.');
      return;
    }
    const targetSection = assignedSections.find((sectionItem) => String(sectionItem._id) === String(newHwSectionId));
    const classId = targetSection?.class?._id || targetSection?.class;

    try {
      if (newHwAttachments.length > 0) {
        const formData = new FormData();
        formData.append('classId', classId);
        formData.append('sectionId', newHwSectionId);
        formData.append('subjectId', newHwSubjectId);
        formData.append('title', newHwTitle.trim());
        formData.append('description', newHwDescription.trim());
        formData.append('dueDate', newHwDueDate);

        newHwAttachments.forEach((attItem) => {
          if (attItem.file) {
            formData.append('attachments', attItem.file);
          }
        });

        await dispatch(createHomework(formData)).unwrap();
      } else {
        await dispatch(createHomework({
          classId,
          sectionId: newHwSectionId,
          subjectId: newHwSubjectId,
          title: newHwTitle.trim(),
          description: newHwDescription.trim(),
          dueDate: newHwDueDate,
        })).unwrap();
      }

      toast.success('Homework assigned successfully.');
      discardHomeworkDraft();
      handleCloseAssignModal();
      setNewHwTitle('');
      setNewHwDescription('');
      setNewHwDueDate('');
      dispatch(fetchMyHomework());
    } catch (errorObject) {
      toast.error(getErrorMessage(errorObject, 'Failed to assign homework.'));
    }
  };

  const handleCancelHomework = async (homeworkId) => {
    if (!window.confirm('Are you sure you want to cancel this homework assignment?')) return;
    try {
      await dispatch(cancelHomework(homeworkId)).unwrap();
      toast.success('Homework cancelled.');
      dispatch(fetchMyHomework());
    } catch (errorObject) {
      toast.error(getErrorMessage(errorObject, 'Failed to cancel homework.'));
    }
  };

  // ─── Roster Modal ──────────────────────────────────────────────────────────
  const handleOpenRosterModal = (sectionRecord) => {
    setRosterModalSection(sectionRecord);
    dispatch(fetchSectionRoster(sectionRecord._id));
  };

  // Summary Metrics Derived from Active Data
  const summaryData = summary?.summary || {};
  const totalAssignedStudents = summaryData.totalAssignedStudents || 0;
  const assignedSectionCount = summaryData.assignedSectionCount || 0;
  const pendingAttendanceCount = summaryData.pendingAttendanceCount || 0;
  const activeAssignmentsCount = summaryData.activeAssignmentsCount || 0;

  return (
    <PageContainer
      title="Teacher Dashboard"
      subtitle={`${authenticatedUser?.fullName || 'Teacher'} · ${summary?.school?.name || authenticatedUser?.schoolName || 'Liaquatabad Town'}`}
      actions={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              dispatch(fetchTeacherSummary());
              toast.success('Dashboard refreshed');
            }}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-[#526477] hover:text-[#102033] shadow-xs transition"
            title="Refresh dashboard"
            aria-label="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 ${summaryLoading ? 'animate-spin text-[#006AC7]' : ''}`} />
          </button>
        </div>
      }
    >
      {/* ─── Top Summary Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={School}
          label="My Classes"
          value={assignedSectionCount}
          sub="Assigned classes & sections"
          color="blue"
          loading={summaryLoading}
        />
        <KpiCard
          icon={Users}
          label="Total Students"
          value={totalAssignedStudents}
          sub="Enrolled across your classes"
          color="emerald"
          loading={summaryLoading}
        />
        <KpiCard
          icon={ClipboardList}
          label="Today's Attendance"
          value={pendingAttendanceCount === 0 ? 'All Done ✓' : `${pendingAttendanceCount} Pending`}
          sub={pendingAttendanceCount === 0 ? 'Completed for today' : `${pendingAttendanceCount} class${pendingAttendanceCount > 1 ? 'es' : ''} pending`}
          color={pendingAttendanceCount > 0 ? 'amber' : 'emerald'}
          loading={summaryLoading}
        />
        <KpiCard
          icon={BookOpen}
          label="Assigned Subjects"
          value={activeAssignmentsCount}
          sub="Active subject allocations"
          color="indigo"
          loading={summaryLoading}
        />
      </div>

      {/* ─── Responsive Tab Navigation Bar ───────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Dashboard sections"
        className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl mb-6 border border-slate-200/70 overflow-x-auto scrollbar-thin select-none"
      >
        {DASHBOARD_TABS.map((tabItem) => {
          const IconComponent = tabItem.icon;
          const isActiveTab = activeTab === tabItem.id;
          return (
            <button
              key={tabItem.id}
              role="tab"
              aria-selected={isActiveTab}
              type="button"
              onClick={() => handleTabChange(tabItem.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all whitespace-nowrap text-xs sm:text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006AC7] shrink-0 ${
                isActiveTab
                  ? 'bg-white text-[#006AC7] shadow-xs font-bold border border-slate-200/60'
                  : 'text-[#526477] hover:text-[#102033] hover:bg-white/60'
              }`}
            >
              <IconComponent className="w-4 h-4 shrink-0" />
              <span>{tabItem.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: MY CLASSES ───────────────────────────────────────────────── */}
      {activeTab === 'CLASSES' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-[#102033]">My Classes</h2>
              <p className="text-xs text-[#526477]">Classes and sections assigned to you for this academic year</p>
            </div>
            <span className="text-xs font-semibold text-[#8094A8]">{formatDate()}</span>
          </div>

          {assignedSections.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-slate-200/80 text-center shadow-sm">
              <School className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#102033]">No Classes Assigned</h3>
              <p className="text-sm text-[#526477] max-w-md mx-auto mt-1">
                You are not currently assigned to any classes or sections. Please contact your Head Master if you need your teaching schedule updated.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {assignedSections.map((sectionItem) => {
                const isClassTeacher = sectionItem.isClassTeacher;
                const assignedSubjects = sectionItem.assignedSubjects || [];
                const todayAttendance = sectionItem.todayAttendance;
                const sectionDisplayName = sectionItem.name && sectionItem.name !== 'null' && sectionItem.name.toLowerCase() !== 'default'
                  ? `Section ${sectionItem.name}`
                  : 'Whole Class (Single Cohort)';

                return (
                  <div
                    key={String(sectionItem._id)}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-[#006AC7]/40 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className="text-xs font-bold text-[#006AC7] uppercase tracking-wide">
                            {sectionItem.class?.name || 'Class'}
                          </span>
                          <h3 className="text-xl font-black text-[#102033] mt-0.5">{sectionDisplayName}</h3>
                          {sectionItem.roomNumber && (
                            <p className="text-xs text-[#8094A8] mt-0.5">Room {sectionItem.roomNumber}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          {isClassTeacher ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-[#4B7F3A] border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Class Teacher
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#006AC7] border border-blue-200">
                              Subject Teacher
                            </span>
                          )}
                          <span className="text-xs font-semibold text-[#526477]">
                            {sectionItem.studentCount} Students
                          </span>
                        </div>
                      </div>

                      {/* Subjects Badges */}
                      <div className="mb-4">
                        <p className="text-xs font-bold text-[#8094A8] mb-1.5 uppercase tracking-wider">
                          Assigned Subjects
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {assignedSubjects.length > 0 ? (
                            assignedSubjects.map((subjectItem, subjectIndex) => (
                              <span
                                key={subjectIndex}
                                className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                              >
                                {subjectItem.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              {isClassTeacher ? 'Class Teacher (All subjects)' : 'No subjects assigned'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Today's Attendance Metric */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 text-xs flex items-center justify-between">
                        <span className="text-[#526477] font-medium">Today's Attendance:</span>
                        {todayAttendance?.submitted ? (
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Submitted ({todayAttendance.presentCount} Present, {todayAttendance.absentCount} Absent)
                          </span>
                        ) : (
                          <span className="font-bold text-amber-700 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAttendanceSectionId(String(sectionItem._id));
                          handleTabChange('ATTENDANCE');
                        }}
                        className="py-2 px-3 rounded-xl bg-[#006AC7] hover:bg-[#00529B] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <ClipboardList className="w-3.5 h-3.5" /> Mark Attendance
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenRosterModal(sectionItem)}
                        className="py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Students
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: ATTENDANCE (DAILY ATTENDANCE) ───────────────────────────── */}
      {activeTab === 'ATTENDANCE' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-[#102033] flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-[#006AC7]" />
                  Daily Student Attendance
                </h2>
                <p className="text-xs text-[#526477] mt-0.5">
                  All enrolled students default to <strong className="text-emerald-700 font-bold">Present (P)</strong>. Mark any students who are <strong className="text-rose-700 font-bold">Absent (A)</strong> or on <strong className="text-amber-700 font-bold">Approved Leave (L)</strong>, then submit.
                </p>
              </div>

              {/* Controls: Section & Date */}
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#526477] mb-1">Class & Section</label>
                  <select
                    value={selectedAttendanceSectionId}
                    onChange={(changeEvent) => setSelectedAttendanceSectionId(changeEvent.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#102033] focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                  >
                    {assignedSections.map((sectionItem) => {
                      const sectionLabel = sectionItem.name && sectionItem.name !== 'null' && sectionItem.name.toLowerCase() !== 'default'
                        ? `Section ${sectionItem.name}`
                        : 'Whole Class';
                      return (
                        <option key={String(sectionItem._id)} value={String(sectionItem._id)}>
                          {sectionItem.class?.name} - {sectionLabel} ({sectionItem.studentCount} students)
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#526477] mb-1">Attendance Date</label>
                  <input
                    type="date"
                    value={attendanceDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(changeEvent) => setAttendanceDate(changeEvent.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#102033] focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                  />
                </div>
              </div>
            </div>

            {/* Attendance Summary Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#526477]">Total Students</span>
                <p className="text-2xl font-black text-[#102033] mt-0.5">{totalStudentsCount}</p>
                <span className="text-[11px] text-[#8094A8] font-medium">Enrolled in class</span>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Present (P)</span>
                <p className="text-2xl font-black text-emerald-700 mt-0.5">{presentStudentsCount}</p>
                <span className="text-[11px] text-emerald-600 font-medium">In attendance</span>
              </div>
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Absent (A)</span>
                <p className="text-2xl font-black text-rose-700 mt-0.5">{absentStudentsCount}</p>
                <span className="text-[11px] text-rose-600 font-medium">Marked absent</span>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">On Leave (L)</span>
                <p className="text-2xl font-black text-amber-700 mt-0.5">{leaveStudentsCount}</p>
                <span className="text-[11px] text-amber-600 font-medium">Approved leave</span>
              </div>
            </div>

            {/* Search Bar & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-3 border-y border-slate-100">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by name, roll number, or GR number…"
                  value={attendanceSearchQuery}
                  onChange={(changeEvent) => setAttendanceSearchQuery(changeEvent.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-medium text-[#102033] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                />
                {attendanceSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setAttendanceSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Tabs & Reset Action */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
                  {[
                    { id: 'ALL', label: `All (${totalStudentsCount})` },
                    { id: 'EXCEPTIONS', label: `Absences & Leave (${absentStudentsCount + leaveStudentsCount})` },
                    { id: 'PRESENT', label: `P (${presentStudentsCount})` },
                    { id: 'ABSENT', label: `A (${absentStudentsCount})` },
                    { id: 'LEAVE', label: `L (${leaveStudentsCount})` },
                  ].map((filterTab) => (
                    <button
                      key={filterTab.id}
                      type="button"
                      onClick={() => setAttendanceStatusFilter(filterTab.id)}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        attendanceStatusFilter === filterTab.id
                          ? 'bg-white text-[#006AC7] shadow-xs'
                          : 'text-[#526477] hover:text-[#102033]'
                      }`}
                    >
                      {filterTab.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleResetAllToPresent}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Reset all students to Present"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  Reset All to Present
                </button>
              </div>
            </div>

            {/* Attendance Draft Recovery Banner */}
            <DraftRecoveryBanner
              hasDraft={hasAttendanceDraft}
              lastSavedAt={attendanceLastSavedAt}
              onRestore={() => {
                const restoredData = restoreAttendanceDraft();
                if (restoredData?.records && Array.isArray(restoredData.records)) {
                  setLocalAttendanceRecords(restoredData.records);
                  toast.success('Offline attendance draft restored.');
                }
              }}
              onDiscard={() => {
                discardAttendanceDraft();
                toast.success('Offline draft discarded.');
              }}
            />

            {/* Attendance Roster Table */}
            {attendanceLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#526477]">
                <Loader2 className="w-8 h-8 animate-spin text-[#006AC7]" />
                <p className="text-xs font-medium">Loading class attendance roster…</p>
              </div>
            ) : filteredAttendanceRecords.length === 0 ? (
              <div className="py-12 text-center text-[#8094A8] text-sm">
                {attendanceSearchQuery || attendanceStatusFilter !== 'ALL'
                  ? 'No students found matching your search or filter.'
                  : 'No active students enrolled in this section.'}
              </div>
            ) : (
              <div className="mt-3 divide-y divide-slate-100">
                {filteredAttendanceRecords.map((studentRecord, studentIndex) => (
                  <div
                    key={String(studentRecord.studentProfileId)}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition"
                  >
                    {/* Student Identity */}
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-center text-xs font-mono font-bold text-[#8094A8] bg-slate-100 py-1 rounded-lg">
                        #{studentRecord.rollNumber || studentIndex + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-[#102033]">{studentRecord.fullName}</p>
                        <p className="text-xs text-[#8094A8]">GR: {studentRecord.grNumber || '—'}</p>
                      </div>
                    </div>

                    {/* Status Controls (P / A / L) & Remarks */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleUpdateRecordStatus(studentRecord.studentProfileId, 'PRESENT')}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            studentRecord.status === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400 ring-offset-1'
                              : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                          title="Mark Present"
                        >
                          P
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateRecordStatus(studentRecord.studentProfileId, 'ABSENT')}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            studentRecord.status === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400 ring-offset-1'
                              : 'text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                          title="Mark Absent"
                        >
                          A
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateRecordStatus(studentRecord.studentProfileId, 'LEAVE')}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            studentRecord.status === 'LEAVE'
                              ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400 ring-offset-1'
                              : 'text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                          }`}
                          title="Mark Approved Leave"
                        >
                          L
                        </button>
                      </div>

                      {/* Remarks Input */}
                      <input
                        type="text"
                        placeholder="Notes (optional, e.g. sick leave, late)"
                        value={studentRecord.remarks}
                        onChange={(changeEvent) =>
                          handleUpdateRecordRemarks(studentRecord.studentProfileId, changeEvent.target.value)
                        }
                        className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006AC7] w-48 sm:w-56 text-[#102033]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Submit Attendance Bar */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <DraftStatusIndicator
                  isAutosaving={isAttendanceAutosaving}
                  lastSavedAt={attendanceLastSavedAt}
                  hasDraft={hasAttendanceDraft}
                />
                <div className="text-xs text-[#526477]">
                  Ready to submit: <strong className="text-emerald-700 font-bold">{presentStudentsCount} Present</strong>, <strong className="text-rose-700 font-bold">{absentStudentsCount} Absent</strong>, <strong className="text-amber-700 font-bold">{leaveStudentsCount} On Leave</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSubmitAttendanceForm}
                disabled={attendanceSubmitting || localAttendanceRecords.length === 0}
                className="px-6 py-2.5 rounded-xl bg-[#4B7F3A] hover:bg-[#3D692F] disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {attendanceSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {attendanceSubmitting
                  ? 'Submitting Attendance…'
                  : `Submit Attendance (${presentStudentsCount} Present, ${absentStudentsCount} Absent, ${leaveStudentsCount} On Leave)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: EXAMINATION (ENTER EXAM MARKS) ─────────────────────────── */}
      {activeTab === 'EXAMS' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="pb-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-[#102033] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#006AC7]" />
                Enter Exam Marks
              </h2>
              <p className="text-xs text-[#526477] mt-0.5">
                Enter student marks for school examinations. Marks are submitted to the Head Master for review and final approval.
              </p>

              {/* Selector Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-[#526477] mb-1">Examination</label>
                  <select
                    value={selectedExamId}
                    onChange={(changeEvent) => setSelectedExamId(changeEvent.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#102033] focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                  >
                    <option value="">-- Select Examination --</option>
                    {examsList.map((examItem) => (
                      <option key={String(examItem._id)} value={String(examItem._id)}>
                        {examItem.title} ({examItem.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#526477] mb-1">Class & Section</label>
                  <select
                    value={selectedExamSectionId}
                    onChange={(changeEvent) => {
                      setSelectedExamSectionId(changeEvent.target.value);
                      setSelectedExamSubjectId('');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#102033] focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                  >
                    <option value="">-- Select Class & Section --</option>
                    {assignedSections.map((sectionItem) => {
                      const sectionLabel = sectionItem.name && sectionItem.name !== 'null' && sectionItem.name.toLowerCase() !== 'default'
                        ? `Section ${sectionItem.name}`
                        : 'Whole Class';
                      return (
                        <option key={String(sectionItem._id)} value={String(sectionItem._id)}>
                          {sectionItem.class?.name} - {sectionLabel} {sectionItem.isClassTeacher ? '(Class Teacher)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#526477] mb-1">Subject</label>
                  <select
                    value={selectedExamSubjectId}
                    onChange={(changeEvent) => setSelectedExamSubjectId(changeEvent.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#102033] focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                  >
                    <option value="">-- Select Subject --</option>
                    {(() => {
                      const matchedSection = assignedSections.find((sectionItem) => String(sectionItem._id) === String(selectedExamSectionId));
                      const assignedSubjectsList = matchedSection?.assignedSubjects || [];
                      return assignedSubjectsList.map((subjectItem) => (
                        <option key={String(subjectItem._id)} value={String(subjectItem._id)}>
                          {subjectItem.name} ({subjectItem.code || 'SUB'})
                        </option>
                      ));
                    })()}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleLoadExamMarksRoster}
                    disabled={!selectedExamId || !selectedExamSectionId}
                    className="w-full py-2 px-4 rounded-xl bg-[#006AC7] hover:bg-[#00529B] disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" /> Load Students
                  </button>
                </div>
              </div>
            </div>

            {/* Exam Marks Draft Recovery Banner */}
            <DraftRecoveryBanner
              hasDraft={hasMarksDraft}
              lastSavedAt={marksLastSavedAt}
              onRestore={() => {
                const restoredData = restoreMarksDraft();
                if (restoredData?.entries && Array.isArray(restoredData.entries)) {
                  setLocalMarksEntries(restoredData.entries);
                  toast.success('Offline examination marks draft restored.');
                }
              }}
              onDiscard={() => {
                discardMarksDraft();
                toast.success('Offline marks draft discarded.');
              }}
            />

            {/* Exam Marks Entry Table */}
            {examRosterLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#526477]">
                <Loader2 className="w-8 h-8 animate-spin text-[#006AC7]" />
                <p className="text-xs font-medium">Loading student list for marks entry…</p>
              </div>
            ) : localMarksEntries.length === 0 ? (
              <div className="py-12 text-center text-[#8094A8] text-sm">
                Select an examination, class, and subject above, then click "Load Students" to enter marks.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[#526477] font-bold uppercase tracking-wider">
                      <th className="py-3 px-2">Roll #</th>
                      <th className="py-3 px-2">Student Name & GR</th>
                      {examRosterData?.isIslamiat ? (
                        <>
                          <th className="py-3 px-2">Nazra (0–20)</th>
                          <th className="py-3 px-2">Written (0–80)</th>
                          <th className="py-3 px-2">Total (100)</th>
                        </>
                      ) : examRosterData?.isDrawing ? (
                        <th className="py-3 px-2">Grade</th>
                      ) : (
                        <>
                          <th className="py-3 px-2">Marks Obtained</th>
                          <th className="py-3 px-2">Total Marks</th>
                          <th className="py-3 px-2">Percentage</th>
                        </>
                      )}
                      <th className="py-3 px-2">Teacher Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localMarksEntries.map((markEntry, studentIndex) => {
                      const isIslamiat = examRosterData?.isIslamiat;
                      const isDrawing = examRosterData?.isDrawing || markEntry.isGradedOnly;
                      const nazraScore = Number(markEntry.subComponents?.nazra) || 0;
                      const writtenScore = Number(markEntry.subComponents?.written) || 0;
                      const totalObtainedMarks = isIslamiat ? nazraScore + writtenScore : Number(markEntry.obtainedMarks) || 0;
                      const maximumMarks = Number(markEntry.maxMarks) || 100;
                      const percentageScore = maximumMarks > 0 ? ((totalObtainedMarks / maximumMarks) * 100).toFixed(1) : 0;

                      return (
                        <tr key={String(markEntry.studentId)} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-2 font-mono font-bold text-[#8094A8]">
                            #{markEntry.rollNumber || studentIndex + 1}
                          </td>
                          <td className="py-3 px-2">
                            <p className="font-bold text-[#102033]">{markEntry.fullName}</p>
                            <p className="text-[11px] text-[#8094A8]">GR: {markEntry.grNumber || '—'}</p>
                          </td>

                          {/* Islamiat Split */}
                          {isIslamiat && (
                            <>
                              <td className="py-3 px-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="20"
                                  value={markEntry.subComponents?.nazra ?? ''}
                                  onChange={(changeEvent) =>
                                    handleUpdateMarksEntry(
                                      markEntry.studentId,
                                      'subComponents.nazra',
                                      changeEvent.target.value
                                    )
                                  }
                                  placeholder="0-20"
                                  className="w-20 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
                                />
                              </td>
                              <td className="py-3 px-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="80"
                                  value={markEntry.subComponents?.written ?? ''}
                                  onChange={(changeEvent) =>
                                    handleUpdateMarksEntry(
                                      markEntry.studentId,
                                      'subComponents.written',
                                      changeEvent.target.value
                                    )
                                  }
                                  placeholder="0-80"
                                  className="w-20 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
                                />
                              </td>
                              <td className="py-3 px-2 font-bold text-[#102033]">
                                {totalObtainedMarks} / 100
                              </td>
                            </>
                          )}

                          {/* Drawing Grade */}
                          {isDrawing && (
                            <td className="py-3 px-2">
                              <select
                                value={markEntry.letterGrade || 'A'}
                                onChange={(changeEvent) =>
                                  handleUpdateMarksEntry(markEntry.studentId, 'letterGrade', changeEvent.target.value)
                                }
                                className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold text-[#006AC7] focus:outline-none"
                              >
                                {['A+', 'A', 'B', 'C', 'D', 'FAIL'].map((gradeOption) => (
                                  <option key={gradeOption} value={gradeOption}>
                                    Grade {gradeOption}
                                  </option>
                                ))}
                              </select>
                            </td>
                          )}

                          {/* Regular Marks */}
                          {!isIslamiat && !isDrawing && (
                            <>
                              <td className="py-3 px-2">
                                <input
                                  type="number"
                                  min="0"
                                  max={maximumMarks}
                                  value={markEntry.obtainedMarks ?? ''}
                                  onChange={(changeEvent) =>
                                    handleUpdateMarksEntry(
                                      markEntry.studentId,
                                      'obtainedMarks',
                                      changeEvent.target.value
                                    )
                                  }
                                  placeholder="Marks"
                                  className="w-24 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
                                />
                              </td>
                              <td className="py-3 px-2 text-[#526477] font-semibold">{maximumMarks}</td>
                              <td className="py-3 px-2 font-bold text-[#102033]">{percentageScore}%</td>
                            </>
                          )}

                          {/* Remarks */}
                          <td className="py-3 px-2">
                            <input
                              type="text"
                              placeholder="Notes or performance remarks"
                              value={markEntry.remarks ?? ''}
                              onChange={(changeEvent) =>
                                handleUpdateMarksEntry(markEntry.studentId, 'remarks', changeEvent.target.value)
                              }
                              className="w-48 px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Bulk Submit Button */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <DraftStatusIndicator
                      isAutosaving={isMarksAutosaving}
                      lastSavedAt={marksLastSavedAt}
                      hasDraft={hasMarksDraft}
                    />
                    <span className="text-xs text-[#526477]">
                      Ready to submit marks for <strong className="text-[#102033] font-bold">{localMarksEntries.length}</strong> student{localMarksEntries.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleBulkSubmitMarks}
                    disabled={examMarksSubmitting || localMarksEntries.length === 0}
                    className="px-6 py-2.5 rounded-xl bg-[#006AC7] hover:bg-[#00529B] disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    {examMarksSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {examMarksSubmitting ? 'Saving Marks…' : 'Submit Marks'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 4: HOMEWORK ─────────────────────────────────────────────────── */}
      {activeTab === 'HOMEWORK' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#102033]">Homework</h2>
              <p className="text-xs text-[#526477]">Create and track homework assignments for your classes</p>
            </div>
            <button
              type="button"
              onClick={() => setAssignHomeworkModal(true)}
              className="px-4 py-2 rounded-xl bg-[#006AC7] hover:bg-[#00529B] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" /> Assign Homework
            </button>
          </div>

          {homeworkLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#526477]">
              <Loader2 className="w-8 h-8 animate-spin text-[#006AC7]" />
              <p className="text-xs font-medium">Loading homework assignments…</p>
            </div>
          ) : homeworkList.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-slate-200/80 text-center shadow-sm">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#102033]">No Homework Assigned</h3>
              <p className="text-sm text-[#526477] max-w-md mx-auto mt-1">
                You haven't posted any homework assignments yet. Click "Assign Homework" to create one.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {homeworkList.map((homeworkItem) => {
                const sectionName = homeworkItem.sectionId?.name && homeworkItem.sectionId?.name !== 'null' && homeworkItem.sectionId?.name.toLowerCase() !== 'default'
                  ? `Section ${homeworkItem.sectionId.name}`
                  : 'Whole Class';

                return (
                  <div
                    key={String(homeworkItem._id)}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#006AC7] border border-blue-200">
                          {homeworkItem.subjectId?.name || 'Subject'}
                        </span>
                        <span className="text-xs font-semibold text-[#8094A8]">
                          Due: {formatDate(homeworkItem.dueDate)}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[#102033] mt-2">{homeworkItem.title}</h3>
                      <p className="text-xs text-[#526477] mt-1 line-clamp-3">{homeworkItem.description}</p>

                      <div className="mt-3 text-xs text-[#8094A8] font-medium">
                        <span>{homeworkItem.classId?.name} · {sectionName}</span>
                      </div>

                      {/* Attached Learning Materials */}
                      {homeworkItem.attachments?.length > 0 && (
                        <HomeworkAttachmentsViewer attachments={homeworkItem.attachments} isCompact />
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[#8094A8]">Posted {formatDate(homeworkItem.createdAt)}</span>
                      <button
                        type="button"
                        onClick={() => handleCancelHomework(homeworkItem._id)}
                        className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Assignment
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 5: NOTICE BOARD (CIRCULARS) ─────────────────────────────────── */}
      {activeTab === 'CIRCULARS' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#102033]">Notice Board</h2>
            <p className="text-xs text-[#526477]">
              Official announcements and notifications from school administration and the Education Department
            </p>
          </div>

          {circularsList.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-slate-200/80 text-center shadow-sm">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#102033]">No Notices Posted</h3>
              <p className="text-sm text-[#526477] max-w-md mx-auto mt-1">
                There are no official notices or announcements at this time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {circularsList.map((documentItem) => (
                <div
                  key={String(documentItem._id)}
                  className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        {documentItem.category || 'NOTICE'}
                      </span>
                      <span className="text-xs text-[#8094A8]">{formatDate(documentItem.createdAt)}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#102033]">{documentItem.title}</h3>
                    <p className="text-xs text-[#526477] mt-1">{documentItem.description || documentItem.content}</p>
                  </div>
                  {documentItem.fileUrl && (
                    <a
                      href={documentItem.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Notice
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 6: SERVICE RECORD ───────────────────────────────────────────── */}
      {activeTab === 'SERVICE' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#006AC7] font-black text-lg">
                  {(authenticatedUser?.fullName || 'T')[0]}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102033]">{authenticatedUser?.fullName}</h3>
                  <p className="text-xs text-[#526477]">{authenticatedUser?.designation || 'Teacher'}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-[#8094A8] font-medium">Employee ID</span>
                  <span className="font-mono font-bold text-[#102033]">
                    {authenticatedUser?._id?.slice(-8).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-[#8094A8] font-medium">National CNIC</span>
                  <span className="font-mono font-bold text-[#102033]">
                    {authenticatedUser?.cnic ? `42101-*******-${authenticatedUser.cnic.slice(-1)}` : 'Verified on File'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-[#8094A8] font-medium">Current School</span>
                  <span className="font-bold text-[#006AC7]">
                    {summary?.school?.name || authenticatedUser?.schoolId?.name || 'Assigned School'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-[#8094A8] font-medium">Cadre & Grade</span>
                  <span className="font-bold text-emerald-700">PST (BPS-14)</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#8094A8] font-medium">Service Status</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active Staff
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly Attendance Breakdown */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-[#006AC7]" />
                    My Attendance Record
                  </h3>
                  <p className="text-xs text-[#526477]">
                    Monthly attendance recorded by your Head Master
                  </p>
                </div>
                <span className="text-xs font-bold text-[#006AC7]">
                  {new Date().toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}
                </span>
              </div>

              {/* Attendance Mini KPIs */}
              <div className="grid grid-cols-3 gap-3 my-5">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <p className="text-xl font-black text-emerald-700">
                    {selfAttendance?.summary?.presentCount ?? selfAttendance?.summary?.presentDays ?? 0}
                  </p>
                  <p className="text-xs text-[#526477] font-semibold mt-0.5">Days Present</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <p className="text-xl font-black text-rose-700">
                    {selfAttendance?.summary?.absentCount ?? selfAttendance?.summary?.absentDays ?? 0}
                  </p>
                  <p className="text-xs text-[#526477] font-semibold mt-0.5">Days Absent</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <p className="text-xl font-black text-amber-700">
                    {selfAttendance?.summary?.leaveCount ?? selfAttendance?.summary?.leaveDays ?? 0}
                  </p>
                  <p className="text-xs text-[#526477] font-semibold mt-0.5">Approved Leave</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-[#526477] flex items-start gap-3">
                <Info className="w-4 h-4 text-[#006AC7] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#102033] mb-0.5">Official Attendance Record</p>
                  <p>
                    Faculty attendance records are officially submitted and locked by the School Head Master on a daily basis. If you notice any discrepancy, please contact your Head Master.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Municipal Casual Leave (CL) Balance & Application Section */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
              <div>
                <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-[#006AC7]" />
                  Municipal Casual Leave (CL) Quota &amp; Applications
                </h3>
                <p className="text-xs text-[#526477]">
                  Education Department Liaquatabad Town Centre — Annual casual leave entitlement for faculty
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLeaveStartDate(new Date().toISOString().split('T')[0]);
                  setLeaveEndDate(new Date().toISOString().split('T')[0]);
                  setLeaveReason('');
                  setLeaveModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#006AC7] hover:bg-[#00529B] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                Apply for Casual / Medical Leave
              </button>
            </div>

            {/* Quota KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#526477]">Total Entitlement</span>
                <p className="text-2xl font-black text-[#006AC7] mt-1">
                  {clBalance?.entitlementDays ?? clBalance?.totalEntitlement ?? 24} <span className="text-xs font-bold text-[#526477]">Days</span>
                </p>
                <p className="text-[10px] text-[#8094A8] mt-1">Academic Year {clBalance?.year ?? new Date().getFullYear()}</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Remaining Balance</span>
                <p className="text-2xl font-black text-emerald-700 mt-1">
                  {clBalance?.remainingDays ?? clBalance?.entitlementDays ?? 24} <span className="text-xs font-bold text-emerald-800">Days</span>
                </p>
                <p className="text-[10px] text-emerald-600 mt-1">Available for application</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#526477]">Days Utilized</span>
                <p className="text-2xl font-black text-[#102033] mt-1">
                  {clBalance?.usedDays ?? 0} <span className="text-xs font-bold text-[#526477]">Days</span>
                </p>
                <p className="text-[10px] text-[#8094A8] mt-1">Approved by Head Master</p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Pending Review</span>
                <p className="text-2xl font-black text-amber-700 mt-1">
                  {clBalance?.pendingDays ?? 0} <span className="text-xs font-bold text-amber-800">Days</span>
                </p>
                <p className="text-[10px] text-amber-600 mt-1">Awaiting HM decision</p>
              </div>
            </div>

            {/* Quota Progress Bar */}
            {clBalance && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-[#526477]">
                  <span>Annual Quota Utilization</span>
                  <span>
                    {Math.round(((clBalance.usedDays || 0) / (clBalance.entitlementDays || clBalance.totalEntitlement || 24)) * 100)}% utilized
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-[#006AC7] rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round(((clBalance.usedDays || 0) / (clBalance.entitlementDays || clBalance.totalEntitlement || 24)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Recent Leave Requests Roster */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#526477]">
                Leave Application History ({myLeaveRequests.length})
              </h4>

              {leaveRequestsLoading ? (
                <div className="py-8 flex items-center justify-center gap-2 text-xs text-[#526477]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#006AC7]" />
                  <span>Loading leave application history...</span>
                </div>
              ) : myLeaveRequests.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-[#8094A8]">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-[#102033]">No Leave Applications on File</p>
                  <p className="mt-1">You have not submitted any casual or medical leave requests this academic year.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-[#526477] font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Leave Type</th>
                        <th className="px-4 py-3">Dates &amp; Duration</th>
                        <th className="px-4 py-3">Reason / Purpose</th>
                        <th className="px-4 py-3">Submitted On</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myLeaveRequests.map((requestItem) => {
                        const statusConfig = {
                          PENDING: requestItem.leaveType === 'EARNED_LEAVE'
                            ? requestItem.forwardedByHm
                              ? { label: 'Forwarded to Town Office (Pending Sanction)', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
                              : { label: 'Pending HM Recommendation', bg: 'bg-amber-50 text-amber-700 border-amber-200' }
                            : { label: 'Pending HM Approval', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
                          APPROVED: { label: 'Approved', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                          REJECTED: { label: 'Rejected', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
                          CANCELLED: { label: 'Cancelled', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
                        };
                        const currentStatus = statusConfig[requestItem.status] || statusConfig.PENDING;
                        return (
                          <tr key={String(requestItem._id)} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-bold text-[#102033]">
                              {requestItem.leaveType === 'CASUAL_LEAVE' ? 'Casual Leave (CL)' : requestItem.leaveType === 'EARNED_LEAVE' ? 'Earned Leave (EL)' : requestItem.leaveType}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-[#102033]">
                                {formatDate(requestItem.startDate)}
                              </span>
                              {requestItem.startDate !== requestItem.endDate && (
                                <span className="text-[#526477]"> to {formatDate(requestItem.endDate)}</span>
                              )}
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-[#526477]">
                                {requestItem.durationDays ?? requestItem.duration ?? 1} Day(s)
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[#526477] max-w-xs truncate" title={requestItem.reason}>
                              {requestItem.reason}
                            </td>
                            <td className="px-4 py-3 text-[#8094A8]">
                              {formatDate(requestItem.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${currentStatus.bg}`}>
                                {currentStatus.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: MY TIMETABLE ──────────────────────────────────────────────── */}
      {activeTab === 'TIMETABLE' && (
        <PersonalScheduleView role="TEACHER" />
      )}

      {/* ─── MODAL: VIEW SECTION STUDENT ROSTER ─────────────────────────────── */}
      {rosterModalSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setRosterModalSection(null)}
          />
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                {(() => {
                  const sectionLabel = rosterModalSection.name && rosterModalSection.name !== 'null' && rosterModalSection.name.toLowerCase() !== 'default'
                    ? `Section ${rosterModalSection.name}`
                    : 'Whole Class (Single Cohort)';
                  return (
                    <h3 className="text-base font-bold text-[#102033]">
                      Class Roster · {rosterModalSection.class?.name} ({sectionLabel})
                    </h3>
                  );
                })()}
                <p className="text-xs text-[#526477]">
                  {rosterModalSection.studentCount} Enrolled Students
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRosterModalSection(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-slate-100 text-xs">
              {sectionRosterData.length === 0 ? (
                <div className="py-8 text-center text-[#8094A8]">
                  No enrolled students found in this class.
                </div>
              ) : (
                sectionRosterData.map((studentItem, studentIndex) => (
                  <div key={String(studentItem._id)} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 font-mono font-bold text-[#8094A8]">
                        #{studentItem.rollNumber || studentIndex + 1}
                      </span>
                      <div>
                        <p className="font-bold text-[#102033]">{studentItem.fullName}</p>
                        <p className="text-[11px] text-[#8094A8]">
                          GR: {studentItem.grNumber || '—'} · Gender: {studentItem.gender || '—'}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: ASSIGN HOMEWORK ─────────────────────────────────────────── */}
      {assignHomeworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={handleCloseAssignModal}
          />
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-[#102033]">Assign Homework</h3>
                <DraftStatusIndicator
                  isAutosaving={isHomeworkAutosaving}
                  lastSavedAt={homeworkLastSavedAt}
                  hasDraft={hasHomeworkDraft}
                />
              </div>
              <button
                type="button"
                onClick={handleCloseAssignModal}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <DraftRecoveryBanner
              hasDraft={hasHomeworkDraft}
              lastSavedAt={homeworkLastSavedAt}
              onRestore={() => {
                const restoredData = restoreHomeworkDraft();
                if (restoredData) {
                  if (restoredData.sectionId) setNewHwSectionId(restoredData.sectionId);
                  if (restoredData.subjectId) setNewHwSubjectId(restoredData.subjectId);
                  if (restoredData.title) setNewHwTitle(restoredData.title);
                  if (restoredData.description) setNewHwDescription(restoredData.description);
                  if (restoredData.dueDate) setNewHwDueDate(restoredData.dueDate);
                  toast.success('Offline homework draft restored.');
                }
              }}
              onDiscard={() => {
                discardHomeworkDraft();
                toast.success('Offline homework draft discarded.');
              }}
            />

            <form onSubmit={handleCreateHomework} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#526477] mb-1">Class & Section *</label>
                <select
                  value={newHwSectionId}
                  onChange={(changeEvent) => {
                    const selectedSectionId = changeEvent.target.value;
                    setNewHwSectionId(selectedSectionId);
                    setNewHwSubjectId('');
                    handleUpdateHomeworkDraft({ sectionId: selectedSectionId, subjectId: '' });
                  }}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                >
                  <option value="">-- Choose Class & Section --</option>
                  {assignedSections.map((sectionItem) => {
                    const sectionLabel = sectionItem.name && sectionItem.name !== 'null' && sectionItem.name.toLowerCase() !== 'default'
                      ? `Section ${sectionItem.name}`
                      : 'Whole Class';
                    return (
                      <option key={String(sectionItem._id)} value={String(sectionItem._id)}>
                        {sectionItem.class?.name} - {sectionLabel}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#526477] mb-1">Subject *</label>
                <select
                  value={newHwSubjectId}
                  onChange={(changeEvent) => {
                    const selectedSubjectId = changeEvent.target.value;
                    setNewHwSubjectId(selectedSubjectId);
                    handleUpdateHomeworkDraft({ subjectId: selectedSubjectId });
                  }}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                >
                  <option value="">-- Choose Subject --</option>
                  {(() => {
                    const matchedSection = assignedSections.find((sectionItem) => String(sectionItem._id) === String(newHwSectionId));
                    return (matchedSection?.assignedSubjects || []).map((subjectItem) => (
                      <option key={String(subjectItem._id)} value={String(subjectItem._id)}>
                        {subjectItem.name}
                      </option>
                    ));
                  })()}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#526477] mb-1">Homework Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 4 Exercise Questions"
                  value={newHwTitle}
                  onChange={(changeEvent) => {
                    const enteredTitle = changeEvent.target.value;
                    setNewHwTitle(enteredTitle);
                    handleUpdateHomeworkDraft({ title: enteredTitle });
                  }}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#526477] mb-1">Instructions (optional)</label>
                <textarea
                  rows="3"
                  placeholder="Provide specific exercises, page numbers, or guidelines..."
                  value={newHwDescription}
                  onChange={(changeEvent) => {
                    const enteredDescription = changeEvent.target.value;
                    setNewHwDescription(enteredDescription);
                    handleUpdateHomeworkDraft({ description: enteredDescription });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#526477] mb-1">Due Date *</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={newHwDueDate}
                  onChange={(changeEvent) => {
                    const selectedDate = changeEvent.target.value;
                    setNewHwDueDate(selectedDate);
                    handleUpdateHomeworkDraft({ dueDate: selectedDate });
                  }}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                />
              </div>

              {/* Attachments & Learning Material Uploader */}
              <div className="pt-2 border-t border-slate-100">
                <HomeworkAttachmentUploader
                  attachments={newHwAttachments}
                  onChange={setNewHwAttachments}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseAssignModal}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#006AC7] hover:bg-[#00529B] text-white font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Post Homework
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: APPLY FOR CASUAL / MEDICAL LEAVE ────────────────────────── */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setLeaveModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-[#006AC7]" />
                  Apply for Leave
                </h3>
                <p className="text-xs text-[#526477]">
                  Submit formal leave request to School Head Master
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLeaveModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLeaveForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#526477] mb-1">Leave Category *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                >
                  <option value="CASUAL_LEAVE">Casual Leave (CL) — Municipal Entitlement</option>
                  <option value="MEDICAL_LEAVE">Medical Leave (ML)</option>
                  <option value="EARNED_LEAVE">Earned Leave (EL)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#526477] mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setLeaveStartDate(newStart);
                      if (newStart > leaveEndDate) {
                        setLeaveEndDate(newStart);
                      }
                    }}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#526477] mb-1">End Date *</label>
                  <input
                    type="date"
                    min={leaveStartDate}
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                  />
                </div>
              </div>

              {/* Duration & Quota Status Indicator */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#526477]">Calculated Duration</span>
                  <p className="text-base font-black text-[#102033]">
                    {calculatedLeaveDays} {calculatedLeaveDays === 1 ? 'Day' : 'Days'}
                  </p>
                </div>
                {leaveType === 'CASUAL_LEAVE' && clBalance && (
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-[#526477]">Remaining CL Balance</span>
                    <p className={`text-base font-black ${calculatedLeaveDays > (clBalance.remainingDays ?? 0) ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {clBalance.remainingDays ?? clBalance.entitlementDays ?? 24} Days
                    </p>
                  </div>
                )}
              </div>

              {leaveType === 'CASUAL_LEAVE' && calculatedLeaveDays > 3 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                  <div>
                    <span className="font-bold">Casual Leave Limit Exceeded ({calculatedLeaveDays} Days):</span>
                    <p className="mt-0.5 text-amber-800">
                      Municipal regulations limit Casual Leave (CL) to a maximum of 3 consecutive calendar days. For leaves of 4 or more days, please select <strong>Earned Leave (EL)</strong> above, which will be forwarded by your Head Master to the Town Education Office.
                    </p>
                  </div>
                </div>
              )}

              {leaveType === 'CASUAL_LEAVE' && clBalance && calculatedLeaveDays <= 3 && calculatedLeaveDays > (clBalance.remainingDays ?? 0) && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Warning: You are requesting {calculatedLeaveDays} day(s), which exceeds your remaining balance of {clBalance.remainingDays} day(s).
                  </span>
                </div>
              )}

              <div>
                <label className="block font-bold text-[#526477] mb-1">Reason / Institutional Justification *</label>
                <textarea
                  rows="3"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Explain the reason for leave request (minimum 5 characters)..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLeaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    leaveSubmitting ||
                    (leaveType === 'CASUAL_LEAVE' && (calculatedLeaveDays > 3 || (clBalance && calculatedLeaveDays > (clBalance.remainingDays ?? 0))))
                  }
                  className="px-5 py-2 rounded-xl bg-[#006AC7] hover:bg-[#00529B] disabled:opacity-50 text-white font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {leaveSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit Leave Application
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default TeacherDashboard;