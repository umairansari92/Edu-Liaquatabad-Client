import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  BookOpen,
  ClipboardCheck,
  CalendarDays,
  GraduationCap,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Clock,
  FileText,
  Paperclip,
  RefreshCw,
  School,
  Award,
  Download,
  IdCard,
  Bell,
  Printer,
  ChevronRight,
  ShieldCheck,
  Building,
  UserCheck,
  Calendar,
  Sparkles,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageContainer from '../../components/layout/PageContainer.jsx';
import {
  fetchStudentProfile,
  fetchStudentExamResults,
  downloadStudentMarksheet,
  fetchStudentHomework,
  fetchStudentAttendance,
  fetchStudentCirculars,
  setSelectedExamId,
} from '../../store/slices/studentSlice.js';

// ─── Tab Button Component ───────────────────────────────────────────────────────
const NavigationTabButton = ({ label, active, onClick, icon: TabIcon, badgeCount, isAlert }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 select-none shadow-xs ${
      active
        ? 'bg-[#006AC7] text-white shadow-sm ring-2 ring-[#006AC7]/20'
        : 'bg-white text-[#526477] hover:text-[#102033] hover:bg-slate-50 border border-slate-200/80'
    }`}
  >
    {TabIcon && <TabIcon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#8094A8]'}`} />}
    <span>{label}</span>
    {badgeCount != null && badgeCount > 0 && (
      <span
        className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
          isAlert
            ? 'bg-rose-500 text-white'
            : active
            ? 'bg-white/20 text-white'
            : 'bg-[#006AC7] text-white'
        }`}
      >
        {badgeCount}
      </span>
    )}
  </button>
);

// ─── Student Information Row ────────────────────────────────────────────────────
const StudentInformationRow = ({ label, value, isMonospace, isHighlight }) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
    <span className="text-xs text-[#526477] font-medium">{label}</span>
    <span
      className={`text-xs font-bold truncate max-w-[200px] sm:max-w-[260px] ${
        isHighlight
          ? 'text-[#006AC7]'
          : isMonospace
          ? 'font-mono text-[#102033]'
          : 'text-[#102033]'
      }`}
    >
      {value || '—'}
    </span>
  </div>
);

// ─── Loading State Spinner ──────────────────────────────────────────────────────
const ComponentLoadingSpinner = ({ messageLabel }) => (
  <div className="flex flex-col items-center justify-center p-12 text-[#526477] space-y-3">
    <Loader2 className="w-8 h-8 animate-spin text-[#006AC7]" />
    <span className="font-semibold text-sm">{messageLabel}</span>
  </div>
);

// ─── Student Dashboard Main Component ───────────────────────────────────────────
export const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    profile,
    examinationResults,
    homework,
    attendance,
    circulars,
  } = useSelector((state) => state.student);

  const [searchParams, setSearchParams] = useSearchParams();
  const urlTabKey = searchParams.get('tab');
  const validTabKeys = ['overview', 'exams', 'homework', 'attendance', 'notices', 'id_card'];

  const [activeTabKey, setActiveTabKey] = useState(
    urlTabKey && validTabKeys.includes(urlTabKey) ? urlTabKey : 'overview'
  );
  const [circularSearchQuery, setCircularSearchQuery] = useState('');
  const [homeworkStatusFilter, setHomeworkStatusFilter] = useState('ALL');

  // Synchronize state when URL query parameter changes
  useEffect(() => {
    if (urlTabKey && validTabKeys.includes(urlTabKey) && urlTabKey !== activeTabKey) {
      setActiveTabKey(urlTabKey);
    }
  }, [urlTabKey]);

  // Tab change handler updates both local state and URL query param
  const handleTabChange = useCallback((newTabKey) => {
    setActiveTabKey(newTabKey);
    setSearchParams({ tab: newTabKey });
  }, [setSearchParams]);

  // Clean up print classes on component unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('print-student-card-mode');
    };
  }, []);

  // ── Initial Data Synchronization ────────────────────────────────────────────
  const refreshAllStudentData = useCallback(() => {
    dispatch(fetchStudentProfile());
    dispatch(fetchStudentExamResults());
    dispatch(fetchStudentHomework());
    dispatch(fetchStudentAttendance());
    dispatch(fetchStudentCirculars());
  }, [dispatch]);

  useEffect(() => {
    refreshAllStudentData();
  }, [refreshAllStudentData]);

  // ── Derived Particulars ─────────────────────────────────────────────────────
  const studentProfileData = profile.data;
  const publishedExamRecords = examinationResults.records;
  const activeSelectedExamId = examinationResults.selectedExamId;
  const isMarksheetDownloading = examinationResults.isDownloadingMarksheet;
  const homeworkList = homework.items;
  const attendanceAnalytics = attendance.analytics;
  const circularsList = circulars.documents;

  // Selected Exam Record
  const currentExamRecord = useMemo(() => {
    if (!publishedExamRecords || publishedExamRecords.length === 0) return null;
    if (!activeSelectedExamId) return publishedExamRecords[0];
    return (
      publishedExamRecords.find(
        (examinationItem) =>
          examinationItem.exam?._id === activeSelectedExamId ||
          examinationItem._id === activeSelectedExamId
      ) || publishedExamRecords[0]
    );
  }, [publishedExamRecords, activeSelectedExamId]);

  // Authoritative Academic Session (Derived strictly from attendance or examination records — zero invented data)
  const activeAcademicSession = useMemo(() => {
    return (
      attendanceAnalytics?.academicSession ||
      attendanceAnalytics?.academicYear?.session ||
      currentExamRecord?.exam?.session ||
      currentExamRecord?.exam?.academicYear ||
      publishedExamRecords?.[0]?.exam?.session ||
      publishedExamRecords?.[0]?.exam?.academicYear ||
      'Not Available'
    );
  }, [attendanceAnalytics, currentExamRecord, publishedExamRecords]);

  // Homework due soon (< 48 hours) and overdue calculations
  const homeworkCalculations = useMemo(() => {
    const currentTimeMs = Date.now();
    let dueSoonCounter = 0;
    let overdueCounter = 0;

    const classifiedHomeworkList = homeworkList.map((homeworkItem) => {
      const dueTimestampMs = new Date(homeworkItem.dueDate).getTime();
      const timeRemainingMs = dueTimestampMs - currentTimeMs;
      const isOverdue = timeRemainingMs < 0;
      const isDueSoon = !isOverdue && timeRemainingMs <= 48 * 60 * 60 * 1000;

      if (isOverdue) overdueCounter += 1;
      if (isDueSoon) dueSoonCounter += 1;

      return {
        ...homeworkItem,
        isOverdue,
        isDueSoon,
        dueTimestampMs,
      };
    });

    return {
      classifiedList: classifiedHomeworkList,
      dueSoonCount: dueSoonCounter,
      overdueCount: overdueCounter,
    };
  }, [homeworkList]);

  // Filtered Homework
  const filteredHomeworkList = useMemo(() => {
    if (homeworkStatusFilter === 'DUE_SOON') {
      return homeworkCalculations.classifiedList.filter((item) => item.isDueSoon);
    }
    if (homeworkStatusFilter === 'OVERDUE') {
      return homeworkCalculations.classifiedList.filter((item) => item.isOverdue);
    }
    if (homeworkStatusFilter === 'ACTIVE') {
      return homeworkCalculations.classifiedList.filter((item) => !item.isOverdue);
    }
    return homeworkCalculations.classifiedList;
  }, [homeworkCalculations.classifiedList, homeworkStatusFilter]);

  // Emergency Directive Check: Strictly scans for urgent or emergency directives
  const emergencyCircular = useMemo(() => {
    if (!circularsList || circularsList.length === 0) return null;
    return circularsList.find((documentItem) => {
      const isUrgentPriority = documentItem.priority === 'URGENT';
      const searchContent = `${documentItem.title || ''} ${documentItem.description || ''}`.toUpperCase();
      const hasEmergencyKeyword =
        searchContent.includes('HEAVY RAIN') ||
        searchContent.includes('RAIN EMERGENCY') ||
        searchContent.includes('WEATHER EMERGENCY') ||
        searchContent.includes('HEATWAVE') ||
        searchContent.includes('FLOOD') ||
        searchContent.includes('EMERGENCY CLOSURE') ||
        searchContent.includes('CYCLONE') ||
        (searchContent.includes('RAIN') && searchContent.includes('CLOSURE'));
      return isUrgentPriority || hasEmergencyKeyword;
    });
  }, [circularsList]);

  // Filtered Circulars
  const filteredCircularsList = useMemo(() => {
    if (!circularSearchQuery.trim()) return circularsList;
    const sanitizedSearch = circularSearchQuery.toLowerCase().trim();
    return circularsList.filter((documentItem) => {
      const titleMatches = documentItem.title?.toLowerCase().includes(sanitizedSearch);
      const referenceMatches = documentItem.referenceNumber?.toLowerCase().includes(sanitizedSearch);
      const descriptionMatches = documentItem.description?.toLowerCase().includes(sanitizedSearch);
      return titleMatches || referenceMatches || descriptionMatches;
    });
  }, [circularsList, circularSearchQuery]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleDownloadMarksheet = async () => {
    if (!currentExamRecord || !currentExamRecord.exam?._id) {
      toast.error('No examination result selected for marksheet download.');
      return;
    }
    const studentUserId = user?._id || user?.userId;
    const studentIdentifier = studentProfileData?.grNumber
      ? `GR_${studentProfileData.grNumber}`
      : studentProfileData?.rollNumber || 'Student';

    try {
      await dispatch(
        downloadStudentMarksheet({
          examinationId: currentExamRecord.exam._id,
          studentUserId,
          studentIdentifierLabel: studentIdentifier,
        })
      ).unwrap();
      toast.success('Official computerized marksheet downloaded successfully.');
    } catch (downloadErrorMessage) {
      toast.error(typeof downloadErrorMessage === 'string' ? downloadErrorMessage : 'Failed to download marksheet PDF.');
    }
  };

  const handlePrintStudentIdCard = () => {
    let hasCleanedUp = false;
    const cleanupPrintMode = () => {
      if (!hasCleanedUp) {
        hasCleanedUp = true;
        document.body.classList.remove('print-student-card-mode');
        window.removeEventListener('afterprint', cleanupPrintMode);
      }
    };

    window.addEventListener('afterprint', cleanupPrintMode);
    document.body.classList.add('print-student-card-mode');
    window.print();
    // Safety fallback for browsers that do not fire afterprint reliably
    setTimeout(cleanupPrintMode, 4000);
  };

  return (
    <PageContainer
      title="Student Operational Workspace"
      subtitle={`${user?.fullName || 'Student'} • GR #${studentProfileData?.grNumber || '—'} • ${studentProfileData?.school?.name || user?.schoolId?.name || 'Municipal School'} • Liaquatabad Town Centre`}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={refreshAllStudentData}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-[#526477] hover:text-[#102033] shadow-xs transition-colors"
            title="Refresh All Student Workspace Data"
          >
            <RefreshCw className={`w-4 h-4 ${profile.isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }
    >
      {/* ── Emergency Weather / Rain Alert Banner ────────────────────────────── */}
      {emergencyCircular && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-start gap-3.5 shadow-xs">
          <div className="p-2 rounded-xl bg-amber-500 text-white flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-600 text-white">
                Urgent Directive
              </span>
              <span className="text-xs font-bold text-amber-900">
                Liaquatabad Town Centre Municipal Education Alert
              </span>
            </div>
            <h4 className="text-sm font-black text-amber-950 mt-1">
              {emergencyCircular.title}
            </h4>
            <p className="text-xs text-amber-900/80 mt-0.5 line-clamp-2">
              {emergencyCircular.description || 'Official emergency circular issued for students and school staff.'}
            </p>
          </div>
          <button
            onClick={() => handleTabChange('notices')}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors shadow-xs"
          >
            View Notice
          </button>
        </div>
      )}

      {/* ── Navigation Tabs ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6">
        <NavigationTabButton
          label="Overview"
          icon={GraduationCap}
          active={activeTabKey === 'overview'}
          onClick={() => handleTabChange('overview')}
        />
        <NavigationTabButton
          label="Exams & Marksheet"
          icon={Award}
          active={activeTabKey === 'exams'}
          onClick={() => handleTabChange('exams')}
          badgeCount={publishedExamRecords.length}
        />
        <NavigationTabButton
          label="My Homework"
          icon={BookOpen}
          active={activeTabKey === 'homework'}
          onClick={() => handleTabChange('homework')}
          badgeCount={homeworkCalculations.dueSoonCount + homeworkCalculations.overdueCount}
          isAlert={homeworkCalculations.overdueCount > 0}
        />
        <NavigationTabButton
          label="Attendance"
          icon={ClipboardCheck}
          active={activeTabKey === 'attendance'}
          onClick={() => handleTabChange('attendance')}
        />
        <NavigationTabButton
          label="Official Circulars"
          icon={FileText}
          active={activeTabKey === 'notices'}
          onClick={() => handleTabChange('notices')}
          badgeCount={circularsList.length}
        />
        <NavigationTabButton
          label="Digital Student ID Card"
          icon={IdCard}
          active={activeTabKey === 'id_card'}
          onClick={() => handleTabChange('id_card')}
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 1: OVERVIEW
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTabKey === 'overview' && (
        <div className="space-y-6">
          {/* Welcome Hero Card */}
          <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#006AC7] via-[#005299] to-[#003F75] text-white shadow-md">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-white tracking-wide">
                  <School className="w-3.5 h-3.5" />
                  <span>DMC Liaquatabad Town Centre • Student Portal</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Welcome back, {studentProfileData?.studentFullName || user?.fullName || 'Student'}!
                </h2>
                <p className="text-sm text-blue-100 max-w-xl leading-relaxed">
                  Class: <strong className="text-white">{studentProfileData?.class?.name || 'Class'}</strong> • Section:{' '}
                  <strong className="text-white">{studentProfileData?.section?.name || 'Section'}</strong> • Roll #{' '}
                  <strong className="text-white">{studentProfileData?.rollNumber || studentProfileData?.grNumber || '—'}</strong>
                </p>
              </div>

              {/* Quick Action Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleTabChange('id_card')}
                  className="px-4 py-2.5 rounded-2xl bg-white text-[#006AC7] text-xs font-black hover:bg-blue-50 transition-all shadow-sm flex items-center gap-2"
                >
                  <IdCard className="w-4 h-4" />
                  <span>View Digital ID</span>
                </button>
                <button
                  onClick={() => handleTabChange('exams')}
                  className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black backdrop-blur-md border border-white/20 transition-all shadow-sm flex items-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  <span>Exam Gazette</span>
                </button>
              </div>
            </div>

            {/* Background Decorative Circles */}
            <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute right-32 -top-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
          </div>

          {/* Quick Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Attendance KPI */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-[#526477] tracking-wider">Session Attendance</span>
                <div className="p-2.5 rounded-xl bg-blue-50 text-[#006AC7]">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-black text-[#102033]">
                  {attendanceAnalytics?.academicYear?.percentage != null
                    ? `${attendanceAnalytics.academicYear.percentage}%`
                    : '—'}
                </p>
                <span className="text-xs text-[#526477] font-medium mt-1 block">
                  {attendanceAnalytics?.academicYear?.present || 0} / {attendanceAnalytics?.academicYear?.totalWorkingDays || 0} working days
                </span>
              </div>
            </div>

            {/* 2. Active Homework */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-[#526477] tracking-wider">Active Homework</span>
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-black text-[#102033]">{homeworkList.length}</p>
                <div className="flex items-center gap-2 mt-1">
                  {homeworkCalculations.overdueCount > 0 ? (
                    <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {homeworkCalculations.overdueCount} Overdue
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      All on track
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Published Exams */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-[#526477] tracking-wider">Latest Exam Result</span>
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black text-[#102033]">
                  {publishedExamRecords.length > 0
                    ? publishedExamRecords[0].grade || 'Certified'
                    : 'Awaiting'}
                </p>
                <span className="text-xs text-[#526477] font-medium mt-1 block truncate">
                  {publishedExamRecords.length > 0
                    ? `${publishedExamRecords[0].exam?.name || 'Published Result'} (${publishedExamRecords[0].percentage}%)`
                    : 'No gazette published'}
                </span>
              </div>
            </div>

            {/* 4. Circulars & Notices */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-[#526477] tracking-wider">Official Notices</span>
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-black text-[#102033]">{circularsList.length}</p>
                <span className="text-xs text-[#526477] font-medium mt-1 block">
                  Municipal circulars & directives
                </span>
              </div>
            </div>
          </div>

          {/* Student Profile Particulars & Security Isolation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student Particulars */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#006AC7]" />
                  Academic Profile & Enrollment Record
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {studentProfileData?.lifecycleStatus || 'ACTIVE'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <StudentInformationRow label="Full Name" value={studentProfileData?.studentFullName || user?.fullName} />
                <StudentInformationRow label="General Register (GR) #" value={studentProfileData?.grNumber} isMonospace isHighlight />
                <StudentInformationRow label="Roll Number" value={studentProfileData?.rollNumber} isMonospace />
                <StudentInformationRow label="Global Student ID" value={studentProfileData?.globalStudentId} isMonospace />
                <StudentInformationRow label="Class & Grade" value={studentProfileData?.class ? `${studentProfileData.class.name} (Grade ${studentProfileData.class.numericGrade})` : '—'} />
                <StudentInformationRow label="Section" value={studentProfileData?.section?.name} />
                <StudentInformationRow label="School Name" value={studentProfileData?.school?.name || user?.schoolId?.name} />
                <StudentInformationRow label="School Code" value={studentProfileData?.school?.code} isMonospace />
                <StudentInformationRow label="Father / Guardian" value={studentProfileData?.guardian?.fullName} />
                <StudentInformationRow label="Guardian Contact" value={studentProfileData?.guardian?.cellNumber} isMonospace />
                <StudentInformationRow label="Religion" value={studentProfileData?.religion} />
                <StudentInformationRow label="B-Form / CNIC #" value={studentProfileData?.bFormNumber} isMonospace />
              </div>
            </div>

            {/* Institutional Security Notice */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-[#102033] mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#4B7F3A]" />
                  Data Privacy & Shield
                </h3>
                <p className="text-xs text-[#526477] leading-relaxed mb-4">
                  Under the authority of the Education Department, Liaquatabad Town Centre (DMC), student identity is cryptographically bound to session authentication.
                </p>
                <ul className="space-y-2 text-xs text-[#526477]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#4B7F3A] flex-shrink-0 mt-0.5" />
                    <span>Peer examination results and class tabulation sheets remain strictly private.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#4B7F3A] flex-shrink-0 mt-0.5" />
                    <span>Classroom rosters cannot be scraped or accessed by student accounts.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#4B7F3A] flex-shrink-0 mt-0.5" />
                    <span>Official computerized marksheets bear an immutable verification signature.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-5 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-[#006AC7] font-medium">
                Questions about marks or attendance? Contact your school Headmaster directly.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 2: EXAMINATION & OFFICIAL MARKSHEET
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTabKey === 'exams' && (
        <div className="space-y-6">
          {examinationResults.isLoading ? (
            <ComponentLoadingSpinner messageLabel="Retrieving official published examination results..." />
          ) : publishedExamRecords.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white border border-slate-200/80 shadow-xs text-center max-w-xl mx-auto">
              <Award className="w-12 h-12 text-[#8094A8] mx-auto mb-4" />
              <h3 className="text-lg font-bold text-[#102033]">No Published Results Available Yet</h3>
              <p className="text-xs text-[#526477] mt-2 leading-relaxed">
                Examination results are visible once teachers submit marks, the Headmaster certifies the gazette, and the Education Department officially publishes the results.
              </p>
              <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs text-[#526477] font-medium inline-block">
                Draft or intermediate mark entries remain hidden until authorized publication.
              </div>
            </div>
          ) : (
            <>
              {/* Examination Selector (if multiple exams published) */}
              {publishedExamRecords.length > 1 && (
                <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  {publishedExamRecords.map((examResultItem) => {
                    const examinationId = examResultItem.exam?._id || examResultItem._id;
                    const isSelected = currentExamRecord?.exam?._id === examinationId;
                    return (
                      <button
                        key={examinationId}
                        onClick={() => dispatch(setSelectedExamId(examinationId))}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-[#006AC7] text-white shadow-xs'
                            : 'bg-slate-50 text-[#526477] hover:bg-slate-100 hover:text-[#102033]'
                        }`}
                      >
                        {examResultItem.exam?.name || 'Examination'} ({examResultItem.exam?.academicYear || 'Session'})
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Current Selected Examination Result Card */}
              {currentExamRecord && (
                <div className="space-y-6">
                  {/* Top Gazette Summary Banner */}
                  <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-[#4B7F3A] border border-emerald-200">
                            CERTIFIED &amp; PUBLISHED
                          </span>
                          <span className="text-xs text-[#526477] font-medium">
                            Session: <strong>{currentExamRecord.exam?.session || currentExamRecord.exam?.academicYear || '2025-2026'}</strong>
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-[#102033]">
                          {currentExamRecord.exam?.name || 'Academic Assessment Gazette'}
                        </h3>
                        <p className="text-xs text-[#526477] mt-1">
                          School: {currentExamRecord.school?.name} • Class: {currentExamRecord.class?.name} • Section: {currentExamRecord.section?.name}
                        </p>
                      </div>

                      {/* 1-Click Official Marksheet Download Button */}
                      <button
                        onClick={handleDownloadMarksheet}
                        disabled={isMarksheetDownloading}
                        className="px-5 py-3 rounded-2xl bg-[#006AC7] hover:bg-[#005299] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                      >
                        {isMarksheetDownloading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span>{isMarksheetDownloading ? 'Generating Marksheet...' : 'Download Official Marksheet (PDF)'}</span>
                      </button>
                    </div>

                    {/* Aggregate KPI Strip (DMC Liaquatabad 700-Aggregate Standards) */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6 text-center">
                      <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100">
                        <span className="text-[11px] font-bold text-[#006AC7] uppercase tracking-wider block">Aggregate Marks</span>
                        <p className="text-2xl font-black text-[#102033] mt-1">
                          {currentExamRecord.totalObtainedMarks} <span className="text-sm font-bold text-[#8094A8]">/ {currentExamRecord.totalMaxMarks}</span>
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                        <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">Percentage</span>
                        <p className="text-2xl font-black text-[#102033] mt-1">
                          {currentExamRecord.percentage}%
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Grade</span>
                        <p className="text-2xl font-black text-emerald-700 mt-1">
                          {currentExamRecord.grade || '—'}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100">
                        <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Class Rank</span>
                        <p className="text-xl sm:text-2xl font-black text-amber-800 mt-1">
                          {currentExamRecord.rankFormatted || (currentExamRecord.rank ? `#${currentExamRecord.rank}` : '—')}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
                        <span className="text-[11px] font-bold text-[#526477] uppercase tracking-wider block">Result Status</span>
                        <p className={`text-xl sm:text-2xl font-black mt-1 ${
                          currentExamRecord.resultStatus === 'PASS' ? 'text-emerald-700' : 'text-rose-600'
                        }`}>
                          {currentExamRecord.resultStatus || 'PASS'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Subject-Wise Gazette Table with Municipal Standards (Islamiat split & Drawing grade) */}
                  <div className="overflow-hidden rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#102033] flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#006AC7]" />
                        Official Subject Breakdown
                      </h4>
                      <span className="text-xs text-[#8094A8] font-medium">
                        Standard Total: {currentExamRecord.totalMaxMarks} Marks
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-200/60 text-[#526477] uppercase text-[11px] font-bold tracking-wider">
                            <th className="py-3 px-4 sm:px-6">Subject</th>
                            <th className="py-3 px-4">Component Breakdown</th>
                            <th className="py-3 px-4 text-center">Max Marks</th>
                            <th className="py-3 px-4 text-center">Obtained Marks</th>
                            <th className="py-3 px-4 text-center">Status / Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(currentExamRecord.subjectMarks || []).map((subjectMarkItem, arrayIndex) => {
                            const isIslamiatSubject =
                              subjectMarkItem.subjectName?.toUpperCase().includes('ISLAMIAT') ||
                              subjectMarkItem.subComponents != null;
                            const isDrawingSubject =
                              subjectMarkItem.isGradedOnly ||
                              subjectMarkItem.subjectName?.toUpperCase().includes('DRAWING');

                            return (
                              <tr key={subjectMarkItem.subjectId || arrayIndex} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-3.5 px-4 sm:px-6 font-bold text-[#102033]">
                                  {subjectMarkItem.subjectName}
                                  {subjectMarkItem.subjectCode && (
                                    <span className="text-[11px] font-mono text-[#8094A8] ml-2">
                                      ({subjectMarkItem.subjectCode})
                                    </span>
                                  )}
                                </td>

                                <td className="py-3.5 px-4 text-xs text-[#526477]">
                                  {isIslamiatSubject && subjectMarkItem.subComponents ? (
                                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-50/80 border border-blue-100 text-[11px] text-[#006AC7] font-medium">
                                      <span>Nazra Quran: <strong>{subjectMarkItem.subComponents.nazra ?? 0}/20</strong></span>
                                      <span>•</span>
                                      <span>Written Theory: <strong>{subjectMarkItem.subComponents.written ?? 0}/80</strong></span>
                                    </div>
                                  ) : isDrawingSubject ? (
                                    <span className="text-xs text-[#8094A8] italic">
                                      Evaluated on visual arts &amp; motor creativity
                                    </span>
                                  ) : (
                                    <span className="text-xs text-[#8094A8]">Theory Examination</span>
                                  )}
                                </td>

                                <td className="py-3.5 px-4 text-center font-medium text-[#526477]">
                                  {isDrawingSubject ? '—' : subjectMarkItem.maxMarks}
                                </td>

                                <td className="py-3.5 px-4 text-center font-bold text-[#102033]">
                                  {isDrawingSubject ? (
                                    <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 font-bold">
                                      Grade {subjectMarkItem.letterGrade || 'A'}
                                    </span>
                                  ) : (
                                    subjectMarkItem.obtainedMarks
                                  )}
                                </td>

                                <td className="py-3.5 px-4 text-center">
                                  {isDrawingSubject ? (
                                    <span className="text-xs font-bold text-purple-700">Graded Only</span>
                                  ) : subjectMarkItem.isPassed ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Pass
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                      Fail
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Remarks Section */}
                    {currentExamRecord.remarks && (
                      <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-start gap-2.5 text-xs text-[#526477]">
                        <CheckCircle2 className="w-4 h-4 text-[#4B7F3A] flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[#102033]">Headmaster / Examiner Remarks:</strong> {currentExamRecord.remarks}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 3: MY HOMEWORK
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTabKey === 'homework' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'ALL', label: 'All Assignments' },
                { key: 'ACTIVE', label: 'Active' },
                { key: 'DUE_SOON', label: 'Due Soon (48h)', count: homeworkCalculations.dueSoonCount },
                { key: 'OVERDUE', label: 'Overdue', count: homeworkCalculations.overdueCount },
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setHomeworkStatusFilter(filterOption.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    homeworkStatusFilter === filterOption.key
                      ? 'bg-[#006AC7] text-white shadow-xs'
                      : 'bg-slate-50 text-[#526477] hover:bg-slate-100'
                  }`}
                >
                  <span>{filterOption.label}</span>
                  {filterOption.count != null && filterOption.count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold leading-none">
                      {filterOption.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <span className="text-xs text-[#8094A8] font-medium pr-2">
              Showing {filteredHomeworkList.length} assignment{filteredHomeworkList.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Homework Items */}
          {homework.isLoading ? (
            <ComponentLoadingSpinner messageLabel="Loading class homework assignments..." />
          ) : filteredHomeworkList.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white border border-slate-200/80 shadow-xs text-center max-w-lg mx-auto">
              <CheckCircle2 className="w-12 h-12 text-[#4B7F3A] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#102033]">All caught up!</h3>
              <p className="text-xs text-[#526477] mt-1">No homework matching this filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHomeworkList.map((homeworkItem) => {
                const dueDateObject = new Date(homeworkItem.dueDate);
                return (
                  <div
                    key={homeworkItem._id}
                    className={`p-5 rounded-2xl border transition-all shadow-xs ${
                      homeworkItem.isOverdue
                        ? 'bg-rose-50/40 border-rose-200'
                        : homeworkItem.isDueSoon
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-white border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#006AC7] border border-blue-100">
                            {homeworkItem.subjectId?.name || 'Subject'}
                          </span>
                          <span className="text-xs text-[#526477] font-medium">
                            By: {homeworkItem.teacherId?.fullName || 'Class Teacher'}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-[#102033] mb-1">{homeworkItem.title}</h4>
                        {homeworkItem.description && (
                          <p className="text-xs text-[#526477] leading-relaxed mb-3 whitespace-pre-line">
                            {homeworkItem.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                            homeworkItem.isOverdue
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : homeworkItem.isDueSoon
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {homeworkItem.isOverdue ? 'Overdue' : homeworkItem.isDueSoon ? 'Due Soon' : 'Active'}
                        </span>
                        <span className="text-[11px] text-[#8094A8] font-medium">
                          Due: {dueDateObject.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Attachments */}
                    {homeworkItem.attachments?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                        <span className="text-[11px] font-bold text-[#8094A8] uppercase tracking-wider block">
                          Attached Materials:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {homeworkItem.attachments.map((attachmentItem, attachmentIndex) => (
                            <a
                              key={attachmentIndex}
                              href={attachmentItem.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 text-xs font-semibold text-[#006AC7] transition-colors"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span className="truncate max-w-[180px]">{attachmentItem.fileName || 'Attachment'}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 4: ATTENDANCE INTELLIGENCE
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTabKey === 'attendance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#102033] flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#006AC7]" />
                Multi-Tier Attendance Intelligence
              </h3>
              <p className="text-xs text-[#526477] mt-0.5">
                Official attendance analytics computed pursuant to municipal education governance standards.
              </p>
            </div>
            <button
              onClick={() => dispatch(fetchStudentAttendance())}
              disabled={attendance.isLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-[#526477] hover:text-[#102033] hover:bg-slate-50 border border-slate-200/80 shadow-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${attendance.isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {attendance.isLoading && !attendanceAnalytics ? (
            <ComponentLoadingSpinner messageLabel="Calculating attendance records..." />
          ) : !attendanceAnalytics ? (
            <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs text-center text-[#526477]">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="font-medium text-sm">Attendance records not yet initialized for your profile.</p>
            </div>
          ) : (
            <>
              {/* 3 Core Intelligence Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Current Month */}
                <div className="p-5 rounded-3xl bg-white border border-blue-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#006AC7] uppercase tracking-wider">Current Month</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-[#006AC7] border border-blue-200 font-bold">
                      {attendanceAnalytics.currentMonth?.monthLabel || 'This Month'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-black text-[#102033]">
                      {attendanceAnalytics.currentMonth?.percentage}%
                    </span>
                    <span className="text-xs text-[#526477] font-medium">
                      ({attendanceAnalytics.currentMonth?.present}/{attendanceAnalytics.currentMonth?.workingDays} days)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 text-center text-xs">
                    <div className="p-1.5 rounded-xl bg-emerald-50 border border-emerald-100">
                      <span className="text-emerald-700 font-bold">{attendanceAnalytics.currentMonth?.present || 0}</span>
                      <p className="text-[10px] text-[#526477]">Present</p>
                    </div>
                    <div className="p-1.5 rounded-xl bg-rose-50 border border-rose-100">
                      <span className="text-rose-700 font-bold">{attendanceAnalytics.currentMonth?.absent || 0}</span>
                      <p className="text-[10px] text-[#526477]">Absent</p>
                    </div>
                    <div className="p-1.5 rounded-xl bg-amber-50 border border-amber-100">
                      <span className="text-amber-700 font-bold">{attendanceAnalytics.currentMonth?.leave || 0}</span>
                      <p className="text-[10px] text-[#526477]">Leave</p>
                    </div>
                  </div>
                </div>

                {/* 2. Last Month */}
                <div className="p-5 rounded-3xl bg-white border border-indigo-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Last Month</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                      {attendanceAnalytics.lastMonth?.monthLabel || 'Previous Month'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-black text-[#102033]">
                      {attendanceAnalytics.lastMonth?.percentage}%
                    </span>
                    <span className="text-xs text-[#526477] font-medium">
                      ({attendanceAnalytics.lastMonth?.present}/{attendanceAnalytics.lastMonth?.workingDays} days)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 text-center text-xs">
                    <div className="p-1.5 rounded-xl bg-emerald-50 border border-emerald-100">
                      <span className="text-emerald-700 font-bold">{attendanceAnalytics.lastMonth?.present || 0}</span>
                      <p className="text-[10px] text-[#526477]">Present</p>
                    </div>
                    <div className="p-1.5 rounded-xl bg-rose-50 border border-rose-100">
                      <span className="text-rose-700 font-bold">{attendanceAnalytics.lastMonth?.absent || 0}</span>
                      <p className="text-[10px] text-[#526477]">Absent</p>
                    </div>
                    <div className="p-1.5 rounded-xl bg-amber-50 border border-amber-100">
                      <span className="text-amber-700 font-bold">{attendanceAnalytics.lastMonth?.leave || 0}</span>
                      <p className="text-[10px] text-[#526477]">Leave</p>
                    </div>
                  </div>
                </div>

                {/* 3. Academic Year Overall */}
                <div className="p-5 rounded-3xl bg-white border border-amber-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Academic Session</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                      {attendanceAnalytics.academicSession || 'Session'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-black text-[#102033]">
                      {attendanceAnalytics.academicYear?.percentage}%
                    </span>
                    <span className="text-xs text-[#526477] font-medium">
                      ({attendanceAnalytics.academicYear?.present}/{attendanceAnalytics.academicYear?.totalWorkingDays} days)
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 mb-3 font-medium">
                    Calculated from admission date: {attendanceAnalytics.academicYear?.calculatedFromAdmissionDate || 'N/A'}
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 text-center text-xs">
                    <div className="p-1.5 rounded-xl bg-emerald-50 border border-emerald-100">
                      <span className="text-emerald-700 font-bold">{attendanceAnalytics.academicYear?.present || 0}</span>
                      <p className="text-[10px] text-[#526477]">Total P</p>
                    </div>
                    <div className="p-1.5 rounded-xl bg-rose-50 border border-rose-100">
                      <span className="text-rose-700 font-bold">{attendanceAnalytics.academicYear?.absent || 0}</span>
                      <p className="text-[10px] text-[#526477]">Total A</p>
                    </div>
                    <div className="p-1.5 rounded-xl bg-amber-50 border border-amber-100">
                      <span className="text-amber-700 font-bold">{attendanceAnalytics.academicYear?.leave || 0}</span>
                      <p className="text-[10px] text-[#526477]">Total L</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Progression History */}
              {attendanceAnalytics.monthlyHistory?.length > 0 && (
                <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                  <h4 className="text-sm font-bold text-[#102033] mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#006AC7]" />
                    Session Attendance History
                  </h4>
                  <div className="space-y-3">
                    {attendanceAnalytics.monthlyHistory.map((monthlyAttendanceItem, arrayIndex) => (
                      <div
                        key={arrayIndex}
                        className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/60"
                      >
                        <span className="w-16 text-xs font-bold text-[#526477]">{monthlyAttendanceItem.monthLabel}</span>
                        <div className="flex-1">
                          <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                monthlyAttendanceItem.percentage >= 85
                                  ? 'bg-[#4B7F3A]'
                                  : monthlyAttendanceItem.percentage >= 75
                                  ? 'bg-[#006AC7]'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, monthlyAttendanceItem.percentage)}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right w-24">
                          <span className="text-xs font-bold text-[#102033]">{monthlyAttendanceItem.percentage}%</span>
                          <span className="text-[10px] text-[#8094A8] block font-medium">
                            ({monthlyAttendanceItem.presentDays}/{monthlyAttendanceItem.totalWorkingDays} d)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 5: OFFICIAL CIRCULARS & NOTICES
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTabKey === 'notices' && (
        <div className="space-y-4">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#006AC7]" />
                Official Notices &amp; Department Directives
              </h3>
              <p className="text-xs text-[#526477]">
                Scoped communications authorized for student circulation by Liaquatabad Town Centre.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#8094A8] absolute left-3 top-2.5" />
              <input
                type="text"
                value={circularSearchQuery}
                onChange={(event) => setCircularSearchQuery(event.target.value)}
                placeholder="Search circulars..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-[#102033] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20"
              />
            </div>
          </div>

          {/* Circulars List */}
          {circulars.isLoading ? (
            <ComponentLoadingSpinner messageLabel="Loading official circulars..." />
          ) : filteredCircularsList.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white border border-slate-200/80 shadow-xs text-center max-w-lg mx-auto">
              <FileText className="w-12 h-12 text-[#8094A8] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#102033]">No Circulars Found</h3>
              <p className="text-xs text-[#526477] mt-1">There are no notices matching your search criteria.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCircularsList.map((circularDocument) => {
                const publicationDateString = circularDocument.createdAt
                  ? new Date(circularDocument.createdAt).toLocaleDateString('en-PK', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—';

                return (
                  <div
                    key={circularDocument._id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-200 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#006AC7] border border-blue-100">
                            {circularDocument.scope || 'SCHOOL'}
                          </span>
                          {circularDocument.referenceNumber && (
                            <span className="font-mono text-xs text-[#8094A8] font-bold">
                              Ref: {circularDocument.referenceNumber}
                            </span>
                          )}
                          <span className="text-xs text-[#8094A8]">• {publicationDateString}</span>
                        </div>

                        <h4 className="text-base font-bold text-[#102033] mb-1">
                          {circularDocument.title}
                        </h4>

                        {circularDocument.description && (
                          <p className="text-xs text-[#526477] leading-relaxed mb-3 whitespace-pre-line">
                            {circularDocument.description}
                          </p>
                        )}
                      </div>

                      {/* Attachment Link if any */}
                      {circularDocument.fileUrl && (
                        <a
                          href={circularDocument.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-xs font-bold text-[#006AC7] border border-slate-200/80 transition-colors flex items-center gap-1.5"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>View Attachment</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 6: DIGITAL STUDENT ID CARD
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTabKey === 'id_card' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                <IdCard className="w-5 h-5 text-[#006AC7]" />
                Official Student Identity Card
              </h3>
              <p className="text-xs text-[#526477]">
                Certified computerized student credential issued by DMC Liaquatabad Town Centre.
              </p>
            </div>

            <button
              onClick={handlePrintStudentIdCard}
              className="px-4 py-2 rounded-xl bg-[#006AC7] hover:bg-[#005299] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Card</span>
            </button>
          </div>

          {/* Card Preview Container */}
          <div className="flex justify-center p-4 sm:p-8 bg-slate-100 rounded-3xl border border-slate-200">
            {/* The Actual Printable ID Card */}
            <div className="printable-student-id-card w-full max-w-[420px] bg-white rounded-3xl border-2 border-slate-300 shadow-xl overflow-hidden text-[#102033]">
              {/* Card Header Bar (DMC Palette) */}
              <div className="bg-gradient-to-r from-[#006AC7] via-[#005299] to-[#003F75] text-white p-4 text-center relative">
                <div className="text-[10px] uppercase font-black tracking-widest text-blue-200">
                  DISTRICT MUNICIPAL CORPORATION LIAQUATABAD
                </div>
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-tight mt-0.5">
                  DEPARTMENT OF PRIMARY &amp; SECONDARY EDUCATION
                </h4>
                <div className="text-[9px] font-bold text-blue-200 uppercase tracking-wider mt-1">
                  Official Student Identity Card
                </div>
              </div>

              {/* Sub-Header / School Identification */}
              <div className="bg-[#F0F8FF] px-4 py-2 border-b border-blue-100 text-center">
                <p className="text-xs font-black text-[#006AC7] uppercase truncate">
                  {studentProfileData?.school?.name || user?.schoolId?.name || 'Municipal Model School'}
                </p>
                {studentProfileData?.school?.code && (
                  <p className="text-[10px] font-mono text-[#526477]">
                    School Code: {studentProfileData.school.code}
                  </p>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-4">
                  {/* Student Photo / Avatar */}
                  <div className="w-24 h-28 rounded-2xl bg-slate-100 border-2 border-slate-200 flex-shrink-0 overflow-hidden flex flex-col items-center justify-center text-center">
                    {studentProfileData?.studentPhotoUrl ? (
                      <img
                        src={studentProfileData.studentPhotoUrl}
                        alt="Student"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-2 text-[#8094A8]">
                        <GraduationCap className="w-8 h-8 text-[#006AC7] mb-1" />
                        <span className="text-[9px] font-bold uppercase">Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Primary Particulars */}
                  <div className="flex-1 min-w-0 space-y-1.5 text-xs">
                    <div>
                      <span className="text-[10px] text-[#8094A8] font-bold uppercase tracking-wider block">
                        Student Full Name
                      </span>
                      <p className="text-sm font-black text-[#102033] truncate">
                        {studentProfileData?.studentFullName || user?.fullName || 'Student'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[9px] text-[#8094A8] font-bold uppercase tracking-wider block">GR #</span>
                        <p className="text-xs font-mono font-black text-[#006AC7]">
                          {studentProfileData?.grNumber || '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#8094A8] font-bold uppercase tracking-wider block">Roll #</span>
                        <p className="text-xs font-mono font-bold text-[#102033]">
                          {studentProfileData?.rollNumber || studentProfileData?.grNumber || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[9px] text-[#8094A8] font-bold uppercase tracking-wider block">Class</span>
                        <p className="text-xs font-bold text-[#102033]">
                          {studentProfileData?.class?.name || 'Class'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#8094A8] font-bold uppercase tracking-wider block">Section</span>
                        <p className="text-xs font-bold text-[#102033]">
                          {studentProfileData?.section?.name || 'Section'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secondary Particulars Table */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#8094A8] font-medium">Father / Guardian:</span>
                    <span className="font-bold text-[#102033] truncate max-w-[200px]">
                      {studentProfileData?.guardian?.fullName || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8094A8] font-medium">Emergency Contact:</span>
                    <span className="font-mono font-bold text-[#102033]">
                      {studentProfileData?.guardian?.cellNumber || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8094A8] font-medium">Global Student ID:</span>
                    <span className="font-mono text-[#006AC7] font-bold">
                      {studentProfileData?.globalStudentId || `LTC-${studentProfileData?.grNumber || '000'}`}
                    </span>
                  </div>
                </div>

                {/* Card Footer Bar */}
                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-[9px] text-[#8094A8]">
                  <div>
                    <span>Valid for Academic Session</span>
                    <p className="font-bold text-[#102033]">2025 – 2026</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#006AC7] uppercase">Headmaster Signature</div>
                    <span className="italic">Authorized Signatory</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default StudentDashboard;
