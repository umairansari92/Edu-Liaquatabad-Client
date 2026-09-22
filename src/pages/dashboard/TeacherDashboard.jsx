import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  TrendingUp,
  Award,
  PlusCircle,
  Search,
  Check,
  X,
  FileSpreadsheet,
  IdCard,
  Send,
  Calendar,
  Lock,
  ChevronRight,
  UserCheck,
  Eye,
  Trash2,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageContainer from '../../components/layout/PageContainer.jsx';
import {
  fetchTeacherSummary,
  fetchTeachingAssignments,
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
} from '../../store/slices/teacherSlice.js';

// ─── Utility Helpers ─────────────────────────────────────────────────────────
const fmtDate = (dateVal) => {
  const d = dateVal ? new Date(dateVal) : new Date();
  return d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'PRESENT':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'ABSENT':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'LEAVE':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'LATE':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, sub, color = 'blue' }) => {
  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-[#006AC7]', border: 'border-blue-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-[#4B7F3A]', border: 'border-emerald-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
  };
  const theme = colorMap[color] || colorMap.blue;
  return (
    <div className="relative p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden hover:shadow transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#526477]">{label}</span>
        <div className={`p-2.5 rounded-xl ${theme.bg}`}>
          <Icon className={`w-4 h-4 ${theme.text}`} />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-black text-[#102033] tracking-tight">{value}</p>
      {sub && <p className="text-xs text-[#8094A8] mt-1 font-medium">{sub}</p>}
    </div>
  );
};

// ─── Main Teacher Dashboard ──────────────────────────────────────────────────
export const TeacherDashboard = () => {
  const dispatch = useDispatch();
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

  // Active Tab
  const [activeTab, setActiveTab] = useState('CLASSES'); // CLASSES, ATTENDANCE, EXAMS, HOMEWORK, CIRCULARS, SERVICE

  // Modal States
  const [rosterModalSection, setRosterModalSection] = useState(null);
  const [assignHomeworkModal, setAssignHomeworkModal] = useState(false);

  // Attendance Form Local State
  const [selectedAttendanceSectionId, setSelectedAttendanceSectionId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [localAttendanceRecords, setLocalAttendanceRecords] = useState([]);

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

  // ─── Handlers: Attendance ──────────────────────────────────────────────────
  const handleMarkAllAttendance = (targetStatus) => {
    setLocalAttendanceRecords((prev) =>
      prev.map((rec) => ({ ...rec, status: targetStatus }))
    );
  };

  const handleUpdateRecordStatus = (studentProfileId, newStatus) => {
    setLocalAttendanceRecords((prev) =>
      prev.map((rec) => (rec.studentProfileId === studentProfileId ? { ...rec, status: newStatus } : rec))
    );
  };

  const handleUpdateRecordRemarks = (studentProfileId, newRemarks) => {
    setLocalAttendanceRecords((prev) =>
      prev.map((rec) => (rec.studentProfileId === studentProfileId ? { ...rec, remarks: newRemarks } : rec))
    );
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
      const payload = {
        sectionId: selectedAttendanceSectionId,
        date: attendanceDate,
        records: localAttendanceRecords.map((r) => ({
          studentProfileId: r.studentProfileId,
          status: r.status,
          remarks: r.remarks || '',
        })),
      };
      await dispatch(submitStudentAttendance(payload)).unwrap();
      toast.success('Attendance submitted successfully.');
      dispatch(fetchTeacherSummary());
    } catch (err) {
      toast.error(err || 'Failed to submit attendance.');
    }
  };

  // ─── Handlers: Examination ─────────────────────────────────────────────────
  const handleLoadExamMarksRoster = () => {
    if (!selectedExamId || !selectedExamSectionId) {
      toast.error('Please select both Examination and Class Section.');
      return;
    }
    const sec = assignedSections.find((s) => String(s._id) === String(selectedExamSectionId));
    const classId = sec?.class?._id || sec?.class;
    dispatch(fetchExamMarksRoster({
      examId: selectedExamId,
      classId,
      sectionId: selectedExamSectionId,
      subjectId: selectedExamSubjectId || undefined,
    }));
  };

  const handleUpdateMarksEntry = (studentId, field, value) => {
    setLocalMarksEntries((prev) =>
      prev.map((entry) => {
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
      })
    );
  };

  const handleBulkSubmitMarks = async () => {
    if (!selectedExamId || !selectedExamSectionId) {
      toast.error('Exam and Section must be selected.');
      return;
    }
    const sec = assignedSections.find((s) => String(s._id) === String(selectedExamSectionId));
    const classId = sec?.class?._id || sec?.class;

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

      toast.success('Exam marks submitted successfully!');
    } catch (err) {
      toast.error(err || 'Failed to submit exam marks.');
    }
  };

  // ─── Handlers: Homework ────────────────────────────────────────────────────
  const handleCreateHomework = async (e) => {
    e.preventDefault();
    if (!newHwSectionId || !newHwSubjectId || !newHwTitle || !newHwDueDate) {
      toast.error('Please fill all required homework fields.');
      return;
    }
    const sec = assignedSections.find((s) => String(s._id) === String(newHwSectionId));
    const classId = sec?.class?._id || sec?.class;

    try {
      await dispatch(createHomework({
        classId,
        sectionId: newHwSectionId,
        subjectId: newHwSubjectId,
        title: newHwTitle.trim(),
        description: newHwDescription.trim(),
        dueDate: newHwDueDate,
      })).unwrap();

      toast.success('Homework assigned successfully.');
      setAssignHomeworkModal(false);
      setNewHwTitle('');
      setNewHwDescription('');
      setNewHwDueDate('');
      dispatch(fetchMyHomework());
    } catch (err) {
      toast.error(err || 'Failed to assign homework.');
    }
  };

  const handleCancelHomework = async (homeworkId) => {
    if (!window.confirm('Are you sure you want to cancel this homework assignment?')) return;
    try {
      await dispatch(cancelHomework(homeworkId)).unwrap();
      toast.success('Homework cancelled.');
      dispatch(fetchMyHomework());
    } catch (err) {
      toast.error(err || 'Failed to cancel homework.');
    }
  };

  // ─── Roster Modal ──────────────────────────────────────────────────────────
  const handleOpenRosterModal = (section) => {
    setRosterModalSection(section);
    dispatch(fetchSectionRoster(section._id));
  };

  // Summary Metrics
  const activeKPIs = summary?.summary || {};
  const totalAssignedStudents = activeKPIs.totalAssignedStudents || 0;
  const assignedSectionCount = activeKPIs.assignedSectionCount || 0;
  const pendingAttendanceCount = activeKPIs.pendingAttendanceCount || 0;
  const activeAssignmentsCount = activeKPIs.activeAssignmentsCount || 0;

  return (
    <PageContainer
      title="TEACHER OPERATIONAL WORKSPACE"
      subtitle={`Education Department Liaquatabad Town Centre (DMC) · ${authenticatedUser?.fullName || 'Faculty Member'}`}
      actions={
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(fetchTeacherSummary())}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-[#526477] hover:text-[#102033] shadow-sm transition"
            title="Refresh Workspace Data"
          >
            <RefreshCw className={`w-4 h-4 ${summaryLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }
    >
      {/* ─── Top KPI Bar ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={School}
          label="My Classes"
          value={assignedSectionCount}
          sub="Authorized Sections"
          color="blue"
        />
        <KpiCard
          icon={Users}
          label="Total Students"
          value={totalAssignedStudents}
          sub="Active Section Enrollment"
          color="emerald"
        />
        <KpiCard
          icon={ClipboardList}
          label="Attendance Pending"
          value={pendingAttendanceCount}
          sub={pendingAttendanceCount === 0 ? 'All Completed Today ✓' : 'Sections Needing Roster'}
          color={pendingAttendanceCount > 0 ? 'amber' : 'emerald'}
        />
        <KpiCard
          icon={BookOpen}
          label="Teaching Duties"
          value={activeAssignmentsCount}
          sub="Active Subject Assignments"
          color="indigo"
        />
      </div>

      {/* ─── Tabs Navigation ─────────────────────────────────────────────────── */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-100/80 rounded-2xl mb-6 border border-slate-200/60 text-sm font-semibold">
        {[
          { id: 'CLASSES', label: 'My Classes', icon: GraduationCap },
          { id: 'ATTENDANCE', label: 'Classroom Attendance', icon: ClipboardList },
          { id: 'EXAMS', label: 'Internal Examination', icon: Award },
          { id: 'HOMEWORK', label: 'Homework Workspace', icon: FileText },
          { id: 'CIRCULARS', label: 'Official Circulars', icon: FileSpreadsheet },
          { id: 'SERVICE', label: 'My Service Record', icon: IdCard },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white text-[#006AC7] shadow-sm font-bold'
                  : 'text-[#526477] hover:text-[#102033] hover:bg-white/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: MY CLASSES ───────────────────────────────────────────────── */}
      {activeTab === 'CLASSES' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#102033]">Assigned Classes & Academic Duties</h2>
              <p className="text-xs text-[#526477]">Unified view of Class Teacher roles and Subject Teaching assignments</p>
            </div>
            <span className="text-xs font-semibold text-[#8094A8]">{fmtDate()}</span>
          </div>

          {assignedSections.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-slate-200/80 text-center shadow-sm">
              <School className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#102033]">No Active Teaching Assignments</h3>
              <p className="text-sm text-[#526477] max-w-md mx-auto mt-1">
                You are currently not designated as Class Teacher or assigned subjects for any section. Please contact your Head Master.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {assignedSections.map((sec) => {
                const isCT = sec.isClassTeacher;
                const subjects = sec.assignedSubjects || [];
                const att = sec.todayAttendance;
                return (
                  <div
                    key={String(sec._id)}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-[#006AC7]/40 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className="text-xs font-bold text-[#006AC7] uppercase tracking-wide">
                            {sec.class?.name || 'Class'}
                          </span>
                          <h3 className="text-xl font-black text-[#102033] mt-0.5">Section {sec.name}</h3>
                          {sec.roomNumber && (
                            <p className="text-xs text-[#8094A8] mt-0.5">Room {sec.roomNumber}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          {isCT ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-[#4B7F3A] border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Class Teacher
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#006AC7] border border-blue-200">
                              Subject Teacher
                            </span>
                          )}
                          <span className="text-xs font-semibold text-[#526477]">
                            {sec.studentCount} Students
                          </span>
                        </div>
                      </div>

                      {/* Subjects Badges */}
                      <div className="mb-4">
                        <p className="text-xs font-bold text-[#8094A8] mb-1.5 uppercase tracking-wider">
                          Assigned Subjects
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {subjects.length > 0 ? (
                            subjects.map((sub, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                              >
                                {sub.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              {isCT ? 'General Classroom Oversight' : 'None specified'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Today's Attendance Metric */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 text-xs flex items-center justify-between">
                        <span className="text-[#526477] font-medium">Today's Attendance:</span>
                        {att?.submitted ? (
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Submitted ({att.presentCount}P / {att.absentCount}A)
                          </span>
                        ) : (
                          <span className="font-bold text-rose-600 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-rose-500" /> Pending
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setSelectedAttendanceSectionId(String(sec._id));
                          setActiveTab('ATTENDANCE');
                        }}
                        className="py-2 px-3 rounded-xl bg-[#006AC7] hover:bg-[#00529B] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <ClipboardList className="w-3.5 h-3.5" /> Mark Roster
                      </button>
                      <button
                        onClick={() => handleOpenRosterModal(sec)}
                        className="py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition flex items-center justify-center gap-1.5"
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

      {/* ─── TAB 2: ATTENDANCE ───────────────────────────────────────────────── */}
      {activeTab === 'ATTENDANCE' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-[#102033] flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-[#006AC7]" />
                  Classroom Daily Attendance
                </h2>
                <p className="text-xs text-[#526477]">
                  Record student presence, absence, and authorized leave with individual remarks
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#526477] mb-1">Section</label>
                  <select
                    value={selectedAttendanceSectionId}
                    onChange={(e) => setSelectedAttendanceSectionId(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#102033] focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                  >
                    {assignedSections.map((sec) => (
                      <option key={String(sec._id)} value={String(sec._id)}>
                        {sec.class?.name} - Section {sec.name} ({sec.studentCount} students)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#526477] mb-1">Date</label>
                  <input
                    type="date"
                    value={attendanceDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#102033] focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                  />
                </div>
              </div>
            </div>

            {/* Attendance Top Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 py-4 border-b border-slate-100">
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="text-emerald-700">
                  ✓ {localAttendanceRecords.filter((r) => r.status === 'PRESENT').length} Present
                </span>
                <span className="text-rose-700">
                  ✗ {localAttendanceRecords.filter((r) => r.status === 'ABSENT').length} Absent
                </span>
                <span className="text-amber-700">
                  ◌ {localAttendanceRecords.filter((r) => r.status === 'LEAVE').length} Leave
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8094A8] font-bold uppercase tracking-wider mr-1">
                  1-Click Action:
                </span>
                <button
                  type="button"
                  onClick={() => handleMarkAllAttendance('PRESENT')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAllAttendance('ABSENT')}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition"
                >
                  Mark All Absent
                </button>
              </div>
            </div>

            {/* Attendance Roster Table */}
            {attendanceLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#526477]">
                <Loader2 className="w-8 h-8 animate-spin text-[#006AC7]" />
                <p className="text-xs font-medium">Loading classroom attendance roster…</p>
              </div>
            ) : localAttendanceRecords.length === 0 ? (
              <div className="py-12 text-center text-[#8094A8] text-sm">
                No active students enrolled in this section.
              </div>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {localAttendanceRecords.map((student, idx) => (
                  <div
                    key={String(student.studentProfileId)}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-xl transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-xs font-mono font-bold text-[#8094A8]">
                        #{student.rollNumber || idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-[#102033]">{student.fullName}</p>
                        <p className="text-xs text-[#8094A8]">GR: {student.grNumber || '—'}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Status Pills */}
                      <div className="flex items-center gap-1.5">
                        {['PRESENT', 'ABSENT', 'LEAVE', 'LATE'].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleUpdateRecordStatus(student.studentProfileId, st)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                              student.status === st
                                ? getStatusBadge(st) + ' ring-2 ring-offset-1 ring-slate-400'
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      {/* Remarks Input */}
                      <input
                        type="text"
                        placeholder="Optional remarks (e.g. sick leave)"
                        value={student.remarks}
                        onChange={(e) =>
                          handleUpdateRecordRemarks(student.studentProfileId, e.target.value)
                        }
                        className="px-3 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006AC7] w-48 text-[#102033]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Submit Attendance Button */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-[#8094A8]">
                {localAttendanceRecords.length} students ready for submission
              </span>
              <button
                type="button"
                onClick={handleSubmitAttendanceForm}
                disabled={attendanceSubmitting || localAttendanceRecords.length === 0}
                className="px-6 py-2.5 rounded-xl bg-[#4B7F3A] hover:bg-[#3D692F] disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
              >
                {attendanceSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {attendanceSubmitting ? 'Submitting…' : 'Submit Daily Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: EXAMINATION ──────────────────────────────────────────────── */}
      {activeTab === 'EXAMS' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="pb-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-[#102033] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#006AC7]" />
                Internal School Examination Marks Entry
              </h2>
              <p className="text-xs text-[#526477] mt-0.5">
                School-level 700-mark evaluation with Islamiat (Nazra 20 / Written 80), Drawing grade, and HM verification gate
              </p>

              {/* Selector Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-[#526477] mb-1">Select Exam</label>
                  <select
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#102033] focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                  >
                    <option value="">-- Choose Exam --</option>
                    {examsList.map((ex) => (
                      <option key={String(ex._id)} value={String(ex._id)}>
                        {ex.title} ({ex.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#526477] mb-1">Select Section</label>
                  <select
                    value={selectedExamSectionId}
                    onChange={(e) => {
                      setSelectedExamSectionId(e.target.value);
                      setSelectedExamSubjectId('');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#102033] focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                  >
                    <option value="">-- Choose Section --</option>
                    {assignedSections.map((sec) => (
                      <option key={String(sec._id)} value={String(sec._id)}>
                        {sec.class?.name} - {sec.name} {sec.isClassTeacher ? '(Class Teacher)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#526477] mb-1">Select Subject</label>
                  <select
                    value={selectedExamSubjectId}
                    onChange={(e) => setSelectedExamSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#102033] focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                  >
                    <option value="">-- Single Subject (or Multi if CT) --</option>
                    {(() => {
                      const sec = assignedSections.find((s) => String(s._id) === String(selectedExamSectionId));
                      const subs = sec?.assignedSubjects || [];
                      return subs.map((sub) => (
                        <option key={String(sub._id)} value={String(sub._id)}>
                          {sub.name} ({sub.code || 'SUB'})
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
                    className="w-full py-2 px-4 rounded-xl bg-[#006AC7] hover:bg-[#00529B] disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Search className="w-3.5 h-3.5" /> Load Roster
                  </button>
                </div>
              </div>
            </div>

            {/* Exam Roster Table */}
            {examRosterLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#526477]">
                <Loader2 className="w-8 h-8 animate-spin text-[#006AC7]" />
                <p className="text-xs font-medium">Fetching examination students roster…</p>
              </div>
            ) : localMarksEntries.length === 0 ? (
              <div className="py-12 text-center text-[#8094A8] text-sm">
                Select an examination and section above, then click "Load Roster" to enter marks.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[#526477] font-bold uppercase tracking-wider">
                      <th className="py-3 px-2">Roll</th>
                      <th className="py-3 px-2">Student Name / GR</th>
                      {examRosterData?.isIslamiat ? (
                        <>
                          <th className="py-3 px-2">Nazra (0-20)</th>
                          <th className="py-3 px-2">Written (0-80)</th>
                          <th className="py-3 px-2">Total (100)</th>
                        </>
                      ) : examRosterData?.isDrawing ? (
                        <th className="py-3 px-2">Letter Grade</th>
                      ) : (
                        <>
                          <th className="py-3 px-2">Obtained Marks</th>
                          <th className="py-3 px-2">Max Marks</th>
                          <th className="py-3 px-2">Percentage</th>
                        </>
                      )}
                      <th className="py-3 px-2">Conduct / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localMarksEntries.map((entry, idx) => {
                      const isIslamiat = examRosterData?.isIslamiat;
                      const isDrawing = examRosterData?.isDrawing || entry.isGradedOnly;
                      const nazra = Number(entry.subComponents?.nazra) || 0;
                      const written = Number(entry.subComponents?.written) || 0;
                      const obtained = isIslamiat ? nazra + written : Number(entry.obtainedMarks) || 0;
                      const max = Number(entry.maxMarks) || 100;
                      const pct = max > 0 ? ((obtained / max) * 100).toFixed(1) : 0;

                      return (
                        <tr key={String(entry.studentId)} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-2 font-mono font-bold text-[#8094A8]">
                            #{entry.rollNumber || idx + 1}
                          </td>
                          <td className="py-3 px-2">
                            <p className="font-bold text-[#102033]">{entry.fullName}</p>
                            <p className="text-[11px] text-[#8094A8]">GR: {entry.grNumber || '—'}</p>
                          </td>

                          {/* Islamiat Split */}
                          {isIslamiat && (
                            <>
                              <td className="py-3 px-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="20"
                                  value={entry.subComponents?.nazra ?? ''}
                                  onChange={(e) =>
                                    handleUpdateMarksEntry(
                                      entry.studentId,
                                      'subComponents.nazra',
                                      e.target.value
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
                                  value={entry.subComponents?.written ?? ''}
                                  onChange={(e) =>
                                    handleUpdateMarksEntry(
                                      entry.studentId,
                                      'subComponents.written',
                                      e.target.value
                                    )
                                  }
                                  placeholder="0-80"
                                  className="w-20 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
                                />
                              </td>
                              <td className="py-3 px-2 font-bold text-[#102033]">
                                {obtained} / 100
                              </td>
                            </>
                          )}

                          {/* Drawing Grade */}
                          {isDrawing && (
                            <td className="py-3 px-2">
                              <select
                                value={entry.letterGrade || 'A'}
                                onChange={(e) =>
                                  handleUpdateMarksEntry(entry.studentId, 'letterGrade', e.target.value)
                                }
                                className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold text-[#006AC7] focus:outline-none"
                              >
                                {['A+', 'A', 'B', 'C', 'D', 'FAIL'].map((g) => (
                                  <option key={g} value={g}>
                                    Grade {g}
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
                                  max={max}
                                  value={entry.obtainedMarks ?? ''}
                                  onChange={(e) =>
                                    handleUpdateMarksEntry(
                                      entry.studentId,
                                      'obtainedMarks',
                                      e.target.value
                                    )
                                  }
                                  placeholder="Marks"
                                  className="w-24 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
                                />
                              </td>
                              <td className="py-3 px-2 text-[#526477] font-semibold">{max}</td>
                              <td className="py-3 px-2 font-bold text-[#102033]">{pct}%</td>
                            </>
                          )}

                          {/* Remarks */}
                          <td className="py-3 px-2">
                            <input
                              type="text"
                              placeholder="Academic / conduct remarks"
                              value={entry.remarks ?? ''}
                              onChange={(e) =>
                                handleUpdateMarksEntry(entry.studentId, 'remarks', e.target.value)
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
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-[#8094A8]">
                    Ready to submit marks for {localMarksEntries.length} students
                  </span>
                  <button
                    type="button"
                    onClick={handleBulkSubmitMarks}
                    disabled={examMarksSubmitting || localMarksEntries.length === 0}
                    className="px-6 py-2.5 rounded-xl bg-[#006AC7] hover:bg-[#00529B] disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
                  >
                    {examMarksSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {examMarksSubmitting ? 'Saving Marks…' : 'Save & Bulk Submit Marks'}
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#102033]">Homework & Lesson Assignments</h2>
              <p className="text-xs text-[#526477]">Assign curriculum tasks to your authorized sections and subjects</p>
            </div>
            <button
              type="button"
              onClick={() => setAssignHomeworkModal(true)}
              className="px-4 py-2 rounded-xl bg-[#006AC7] hover:bg-[#00529B] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Assign New Homework
            </button>
          </div>

          {homeworkLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#526477]">
              <Loader2 className="w-8 h-8 animate-spin text-[#006AC7]" />
              <p className="text-xs font-medium">Loading assigned homework…</p>
            </div>
          ) : homeworkList.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-slate-200/80 text-center shadow-sm">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#102033]">No Active Homework Assigned</h3>
              <p className="text-sm text-[#526477] max-w-md mx-auto mt-1">
                You haven't assigned any homework yet. Click "Assign New Homework" to post curriculum tasks.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {homeworkList.map((hw) => (
                <div
                  key={String(hw._id)}
                  className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#006AC7] border border-blue-200">
                        {hw.subjectId?.name || 'Subject'}
                      </span>
                      <span className="text-xs font-semibold text-[#8094A8]">
                        Due: {fmtDate(hw.dueDate)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#102033] mt-2">{hw.title}</h3>
                    <p className="text-xs text-[#526477] mt-1 line-clamp-3">{hw.description}</p>

                    <div className="mt-3 text-xs text-[#8094A8] font-medium">
                      <span>{hw.classId?.name} · Section {hw.sectionId?.name}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[#8094A8]">Posted {fmtDate(hw.createdAt)}</span>
                    <button
                      type="button"
                      onClick={() => handleCancelHomework(hw._id)}
                      className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Cancel Task
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 5: CIRCULARS ────────────────────────────────────────────────── */}
      {activeTab === 'CIRCULARS' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#102033]">Official Circulars & Notices</h2>
            <p className="text-xs text-[#526477]">
              Administrative notifications from the Education Department Liaquatabad Town Centre (DMC)
            </p>
          </div>

          {circularsList.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-slate-200/80 text-center shadow-sm">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#102033]">No Recent Circulars</h3>
              <p className="text-sm text-[#526477] max-w-md mx-auto mt-1">
                There are no new administrative circulars or notices issued for faculty members at this time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {circularsList.map((doc) => (
                <div
                  key={String(doc._id)}
                  className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        {doc.category || 'NOTICE'}
                      </span>
                      <span className="text-xs text-[#8094A8]">{fmtDate(doc.createdAt)}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#102033]">{doc.title}</h3>
                    <p className="text-xs text-[#526477] mt-1">{doc.description || doc.content}</p>
                  </div>
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Circular
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
                  <span className="text-[#8094A8] font-medium">Employee / Teacher ID</span>
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
                  <span className="text-[#8094A8] font-medium">Posting Station</span>
                  <span className="font-bold text-[#006AC7]">
                    {summary?.school?.name || 'Liaquatabad Primary'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-[#8094A8] font-medium">Cadre / BPS Scale</span>
                  <span className="font-bold text-emerald-700">PST (BPS-14)</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#8094A8] font-medium">Service Status</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ACTIVE MUNICIPAL CADRE
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly Attendance Breakdown */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-[#006AC7]" />
                    My Faculty Attendance Log
                  </h3>
                  <p className="text-xs text-[#526477]">
                    Recorded by Head Master under official municipal biometric/daily roster
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
                <Info className="w-4 h-4 text-[#006AC7] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#102033] mb-0.5">Municipal Service Guarantee</p>
                  <p>
                    Faculty attendance records are officially submitted and locked by the School Head Master on a daily basis. For attendance discrepancies, contact your administrative head master or the Liaquatabad Town Education Office.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
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
                <h3 className="text-base font-bold text-[#102033]">
                  Enrolled Students · Section {rosterModalSection.name}
                </h3>
                <p className="text-xs text-[#526477]">
                  {rosterModalSection.class?.name} · {rosterModalSection.studentCount} Students
                </p>
              </div>
              <button
                onClick={() => setRosterModalSection(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-slate-100 text-xs">
              {sectionRosterData.length === 0 ? (
                <div className="py-8 text-center text-[#8094A8]">
                  No active students enrolled in this section.
                </div>
              ) : (
                sectionRosterData.map((st, idx) => (
                  <div key={String(st._id)} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 font-mono font-bold text-[#8094A8]">
                        #{st.rollNumber || idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-[#102033]">{st.fullName}</p>
                        <p className="text-[11px] text-[#8094A8]">
                          GR: {st.grNumber || '—'} · Gender: {st.gender || '—'}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ACTIVE
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
            onClick={() => setAssignHomeworkModal(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-[#102033]">Assign New Homework</h3>
              <button
                onClick={() => setAssignHomeworkModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHomework} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#526477] mb-1">Class Section *</label>
                <select
                  value={newHwSectionId}
                  onChange={(e) => {
                    setNewHwSectionId(e.target.value);
                    setNewHwSubjectId('');
                  }}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                >
                  <option value="">-- Choose Section --</option>
                  {assignedSections.map((sec) => (
                    <option key={String(sec._id)} value={String(sec._id)}>
                      {sec.class?.name} - Section {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#526477] mb-1">Subject *</label>
                <select
                  value={newHwSubjectId}
                  onChange={(e) => setNewHwSubjectId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                >
                  <option value="">-- Choose Subject --</option>
                  {(() => {
                    const sec = assignedSections.find((s) => String(s._id) === String(newHwSectionId));
                    return (sec?.assignedSubjects || []).map((sub) => (
                      <option key={String(sub._id)} value={String(sub._id)}>
                        {sub.name}
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
                  onChange={(e) => setNewHwTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#526477] mb-1">Instructions / Description</label>
                <textarea
                  rows="3"
                  placeholder="Provide specific exercises, page numbers, or guidelines..."
                  value={newHwDescription}
                  onChange={(e) => setNewHwDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#526477] mb-1">Submission Due Date *</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={newHwDueDate}
                  onChange={(e) => setNewHwDueDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006AC7]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignHomeworkModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#006AC7] hover:bg-[#00529B] text-white font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" /> Post Homework
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