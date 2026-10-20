import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  ClipboardList,
  CheckCircle2,
  Clock,
  BookOpen,
  Search,
  X,
  Eye,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Building,
  AlertCircle,
  HelpCircle,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageContainer from '../../components/layout/PageContainer.jsx';
import {
  fetchTeacherSummary,
  fetchSectionRoster,
  selectTeacherSummary,
  selectTeacherSummaryLoading,
  selectTeacherSectionRoster,
} from '../../store/slices/teacherSlice.js';

// ─── Utility Helpers ─────────────────────────────────────────────────────────
const formatDate = (dateValue) => {
  const dateInstance = dateValue ? new Date(dateValue) : new Date();
  return dateInstance.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const MyClassesPage = ({
  embedded = false,
  onNavigateTab = null,
  onSelectAttendanceSection = null,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user: authenticatedUser } = useSelector((state) => state.auth);

  const summary = useSelector(selectTeacherSummary);
  const summaryLoading = useSelector(selectTeacherSummaryLoading);
  const sectionRosterData = useSelector(selectTeacherSectionRoster);

  // Local Roster Modal State
  const [rosterModalSection, setRosterModalSection] = useState(null);
  const [rosterSearchQuery, setRosterSearchQuery] = useState('');

  // Initial Load
  useEffect(() => {
    if (!summary) {
      dispatch(fetchTeacherSummary());
    }
  }, [dispatch, summary]);

  // Handle Roster Open
  const handleOpenRosterModal = (sectionRecord) => {
    setRosterModalSection(sectionRecord);
    setRosterSearchQuery('');
    dispatch(fetchSectionRoster(sectionRecord._id));
  };

  const handleCloseRosterModal = () => {
    setRosterModalSection(null);
    setRosterSearchQuery('');
  };

  // Handle Attendance Action Navigation
  const handleMarkAttendance = (sectionId) => {
    if (onSelectAttendanceSection && onNavigateTab) {
      onSelectAttendanceSection(String(sectionId));
      onNavigateTab('ATTENDANCE');
    } else {
      navigate(`/dashboard?tab=attendance&sectionId=${sectionId}`);
    }
  };

  // Filter roster by search query
  const filteredRosterStudents = useMemo(() => {
    const students = sectionRosterData?.students || [];
    if (!rosterSearchQuery.trim()) return students;
    const lowerQuery = rosterSearchQuery.toLowerCase();
    return students.filter((studentItem) => {
      const name = (studentItem.fullName || '').toLowerCase();
      const gr = String(studentItem.grNumber || '');
      const guardian = (studentItem.fatherOrGuardianName || '').toLowerCase();
      return name.includes(lowerQuery) || gr.includes(lowerQuery) || guardian.includes(lowerQuery);
    });
  }, [sectionRosterData, rosterSearchQuery]);

  // Derived Sections Grouping
  const assignedSections = useMemo(() => summary?.sections || [], [summary]);

  const primaryClassTeacherSections = useMemo(
    () => assignedSections.filter((sectionItem) => sectionItem.isClassTeacher),
    [assignedSections]
  );

  const subjectTeacherSections = useMemo(
    () => assignedSections.filter((sectionItem) => !sectionItem.isClassTeacher),
    [assignedSections]
  );

  const totalStudentsCount = summary?.summary?.totalAssignedStudents || 0;

  // Render Section Card Helper
  const renderSectionCard = (sectionItem, isPrimary) => {
    const assignedSubjects = sectionItem.assignedSubjects || [];
    const todayAttendance = sectionItem.todayAttendance;
    const sectionDisplayName = sectionItem.name && sectionItem.name !== 'null' && sectionItem.name.toLowerCase() !== 'default'
      ? `Section ${sectionItem.name}`
      : 'Whole Class (Single Cohort)';

    return (
      <div
        key={String(sectionItem._id)}
        className={`p-5 rounded-2xl bg-white border transition-all flex flex-col justify-between shadow-xs hover:shadow-md ${
          isPrimary
            ? 'border-emerald-200/90 hover:border-emerald-400'
            : 'border-slate-200/90 hover:border-[#006AC7]/40'
        }`}
      >
        <div>
          {/* Card Top Badges & Titles */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <span className="text-xs font-bold text-[#006AC7] uppercase tracking-wide">
                {sectionItem.class?.name || 'Class'}
              </span>
              <h3 className="text-xl font-black text-[#102033] mt-0.5">{sectionDisplayName}</h3>
              {sectionItem.roomNumber && (
                <p className="text-xs text-[#8094A8] mt-0.5 flex items-center gap-1 font-medium">
                  <Building className="w-3.5 h-3.5" /> Room {sectionItem.roomNumber}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {isPrimary ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#4B7F3A] border border-emerald-200 flex items-center gap-1 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Class Teacher
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#006AC7] border border-blue-200 flex items-center gap-1 shadow-2xs">
                  <BookOpen className="w-3.5 h-3.5" /> Subject Teacher
                </span>
              )}
              <span className="text-xs font-semibold text-[#526477] flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                {sectionItem.studentCount} Students
              </span>
            </div>
          </div>

          {/* Assigned Subjects Chips */}
          <div className="mb-4">
            <p className="text-[11px] font-bold text-[#8094A8] mb-1.5 uppercase tracking-wider">
              {isPrimary ? 'Subjects You Teach in this Class' : 'Assigned Teaching Subjects'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {assignedSubjects.length > 0 ? (
                assignedSubjects.map((subjectItem, subjectIndex) => (
                  <span
                    key={subjectIndex}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 flex items-center gap-1"
                  >
                    <BookOpen className="w-3 h-3 text-slate-500" />
                    {subjectItem.name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">
                  {isPrimary ? 'Primary Class In-Charge' : 'No specific subjects logged'}
                </span>
              )}
            </div>
          </div>

          {/* Attendance Responsibility Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 mb-4 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#526477] font-semibold">
                {isPrimary ? "Today's Attendance (Your Duty):" : "Section Attendance Duty:"}
              </span>

              {isPrimary ? (
                todayAttendance?.submitted ? (
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Submitted ({todayAttendance.presentCount} Present, {todayAttendance.absentCount} Absent)
                  </span>
                ) : (
                  <span className="font-bold text-amber-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Daily Duty Pending
                  </span>
                )
              ) : (
                todayAttendance?.submitted ? (
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Marked ({todayAttendance.presentCount}P / {todayAttendance.absentCount}A)
                  </span>
                ) : (
                  <span className="font-medium text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Not yet marked
                  </span>
                )
              )}
            </div>

            {!isPrimary && (
              <p className="text-[11px] text-[#8094A8] pt-0.5 border-t border-slate-200/50 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-slate-400" />
                <span>
                  Primary In-Charge:{' '}
                  <strong className="text-slate-700 font-semibold">
                    {sectionItem.classTeacher?.fullName || 'Assigned Class Teacher'}
                  </strong>
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Card Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => handleMarkAttendance(sectionItem._id)}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer ${
              isPrimary
                ? 'bg-[#006AC7] hover:bg-[#00529B] text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80'
            }`}
            title={isPrimary ? 'Mark classroom daily attendance' : 'Submit attendance as authorized Subject Teacher proxy'}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            {isPrimary ? 'Mark Attendance' : 'Take Proxy Attendance'}
          </button>

          <button
            type="button"
            onClick={() => handleOpenRosterModal(sectionItem)}
            className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/90 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            title="Inspect enrolled student roster"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" /> View Roster
          </button>
        </div>
      </div>
    );
  };

  const pageContent = (
    <div className="space-y-8">
      {/* ─── Metric Strip ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-50 text-[#006AC7] shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#102033] tracking-tight">{assignedSections.length}</div>
            <div className="text-xs font-semibold text-[#526477]">Total Classes</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 text-[#4B7F3A] shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#102033] tracking-tight">{primaryClassTeacherSections.length}</div>
            <div className="text-xs font-semibold text-[#526477]">Class Teacher Duty</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#102033] tracking-tight">{subjectTeacherSections.length}</div>
            <div className="text-xs font-semibold text-[#526477]">Subject Allocations</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-slate-100 text-slate-700 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#102033] tracking-tight">{totalStudentsCount}</div>
            <div className="text-xs font-semibold text-[#526477]">Enrolled Students</div>
          </div>
        </div>
      </div>

      {/* ─── Empty State ─── */}
      {assignedSections.length === 0 && !summaryLoading ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#102033]">No Teaching Classes Assigned</h3>
          <p className="text-sm text-[#526477] max-w-md mx-auto mt-1">
            You do not currently have any active class or subject allocations. Please contact your Head Master to assign your classrooms for this academic year.
          </p>
        </div>
      ) : null}

      {/* ─── Section 1: Primary Class In-Charge (Class Teacher Duties) ─── */}
      {primaryClassTeacherSections.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
            <div>
              <h2 className="text-base font-bold text-[#102033] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Primary Class In-Charge (Class Teacher Duties)
              </h2>
              <p className="text-xs text-[#526477] mt-0.5">
                Classes where you hold full operational leadership, pastoral care, and daily attendance duty.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {primaryClassTeacherSections.length} Class{primaryClassTeacherSections.length > 1 ? 'es' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {primaryClassTeacherSections.map((sec) => renderSectionCard(sec, true))}
          </div>
        </div>
      )}

      {/* ─── Section 2: Subject Teacher Allocations ─── */}
      {subjectTeacherSections.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
            <div>
              <h2 className="text-base font-bold text-[#102033] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                Subject Teacher Allocations
              </h2>
              <p className="text-xs text-[#526477] mt-0.5">
                Classes where you teach specific academic subjects. Daily morning attendance is managed by the appointed Class Teacher.
              </p>
            </div>
            <span className="text-xs font-bold text-[#006AC7] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              {subjectTeacherSections.length} Allocation{subjectTeacherSections.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjectTeacherSections.map((sec) => renderSectionCard(sec, false))}
          </div>
        </div>
      )}

      {/* ─── Student Roster Modal ─── */}
      {rosterModalSection && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <span className="text-xs font-bold text-[#006AC7] uppercase tracking-wide">
                  {rosterModalSection.class?.name || 'Class'}
                </span>
                <h3 className="text-lg font-bold text-[#102033]">
                  {rosterModalSection.name ? `Section ${rosterModalSection.name}` : 'Student Roster'}
                </h3>
                <p className="text-xs text-[#526477]">
                  {sectionRosterData?.totalCount || 0} enrolled students · Active municipal registry
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseRosterModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={rosterSearchQuery}
                  onChange={(e) => setRosterSearchQuery(e.target.value)}
                  placeholder="Filter by student name, GR number, or guardian..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006AC7] focus:bg-white transition"
                />
              </div>
            </div>

            {/* Modal Content Table */}
            <div className="p-5 overflow-y-auto flex-1">
              {filteredRosterStudents.length === 0 ? (
                <div className="text-center py-8 text-sm text-[#8094A8]">
                  {rosterSearchQuery ? 'No students match your filter.' : 'No enrolled students found in this section.'}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredRosterStudents.map((studentItem, studentIdx) => (
                    <div
                      key={String(studentItem._id || studentIdx)}
                      className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-blue-50 text-[#006AC7] font-bold text-xs flex items-center justify-center shrink-0">
                          {studentIdx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-[#102033]">{studentItem.fullName}</p>
                          <p className="text-[11px] text-[#8094A8]">
                            GR #{studentItem.grNumber} · Guardian: {studentItem.fatherOrGuardianName || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {studentItem.gender && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase">
                            {studentItem.gender}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end">
              <button
                type="button"
                onClick={handleCloseRosterModal}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 shadow-2xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return pageContent;
  }

  return (
    <PageContainer
      title="My Classes & Teaching Duties"
      subtitle={`${authenticatedUser?.fullName || 'Teacher'} · ${summary?.school?.name || authenticatedUser?.schoolName || 'Liaquatabad Town Centre'}`}
      maxWidth="max-w-7xl"
      actions={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              dispatch(fetchTeacherSummary());
              toast.success('Classes refreshed');
            }}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-[#526477] hover:text-[#102033] shadow-xs transition cursor-pointer"
            title="Refresh classes data"
          >
            <RefreshCw className={`w-4 h-4 ${summaryLoading ? 'animate-spin text-[#006AC7]' : ''}`} />
          </button>
        </div>
      }
    >
      {pageContent}
    </PageContainer>
  );
};

export default MyClassesPage;
