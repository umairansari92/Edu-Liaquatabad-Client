import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer.jsx';
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  Award,
  BookOpen,
  FileText,
  AlertCircle,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  Search,
  PlusCircle,
  School,
  AlertTriangle,
  RefreshCw,
  Eye,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient.js';
import {
  fetchMyWards,
  fetchMyClaims,
  fetchWardFullWorkspace,
  setSelectedWardId,
  lookupCandidateWard,
  initiateWardClaim,
  verifyWardClaimOtp,
  resetClaimWizard,
  downloadWardMarksheet,
  selectParentWards,
  selectSelectedWardId,
  selectIsWardsLoading,
  selectActiveWardData,
  selectParentClaims,
  selectClaimWizard,
} from '../../store/slices/parentSlice.js';

export const ParentDashboard = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const { user } = useSelector((state) => state.auth);
  const wards = useSelector(selectParentWards);
  const selectedWardId = useSelector(selectSelectedWardId);
  const isWardsLoading = useSelector(selectIsWardsLoading);
  const activeWardData = useSelector(selectActiveWardData);
  const claims = useSelector(selectParentClaims);
  const claimWizard = useSelector(selectClaimWizard);

  // Download PDF state
  const [downloadingExamId, setDownloadingExamId] = useState(null);

  // Link Student Wizard local state
  const [municipalSchools, setMunicipalSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [lookupGrNumber, setLookupGrNumber] = useState('');
  const [claimRelationship, setClaimRelationship] = useState('FATHER');
  const [inputOtp, setInputOtp] = useState('');

  // Initial Load: Fetch Wards & Claims
  useEffect(() => {
    dispatch(fetchMyWards());
    dispatch(fetchMyClaims());

    // Fetch public schools list for the lookup dropdown
    apiClient
      .get('/public/schools')
      .then((res) => {
        const list = res.data?.data?.schools || [];
        setMunicipalSchools(list);
        if (list.length > 0) setSelectedSchoolId(list[0]._id);
      })
      .catch(() => {});
  }, [dispatch]);

  // Load selected ward's full academic records whenever selectedWardId changes
  useEffect(() => {
    if (selectedWardId) {
      dispatch(fetchWardFullWorkspace(selectedWardId));
    }
  }, [dispatch, selectedWardId]);

  // Active Ward Metadata derived from wards list or activeWardData
  const activeWard = useMemo(() => {
    if (!selectedWardId) return null;
    return (
      wards.find(
        (w) => String(w.studentProfileId?._id || w.studentProfileId) === String(selectedWardId)
      ) || null
    );
  }, [wards, selectedWardId]);

  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  const handleSelectWard = (wardId) => {
    dispatch(setSelectedWardId(wardId));
  };

  // Handle Marksheet PDF Download
  const handleDownloadPdf = async (examId, examTitle, grNumber) => {
    setDownloadingExamId(examId);
    const filename = `Marksheet-${grNumber || 'Student'}-${examTitle || 'Exam'}.pdf`.replace(/\s+/g, '_');
    try {
      await dispatch(
        downloadWardMarksheet({
          studentProfileId: selectedWardId,
          examId,
          filename,
        })
      ).unwrap();
      toast.success('Official Marksheet PDF downloaded successfully.');
    } catch (err) {
      toast.error(err || 'Failed to download official marksheet PDF.');
    } finally {
      setDownloadingExamId(null);
    }
  };

  // ── Wizard Handlers ──
  const handleLookupSubmit = (e) => {
    e.preventDefault();
    if (!selectedSchoolId || !lookupGrNumber.trim()) {
      toast.error('Please select a school and enter student GR Number.');
      return;
    }
    dispatch(
      lookupCandidateWard({
        schoolId: selectedSchoolId,
        grNumber: lookupGrNumber.trim(),
      })
    );
  };

  const handleInitiateClaimSubmit = () => {
    if (!claimWizard.candidate?.studentProfileId) return;
    dispatch(
      initiateWardClaim({
        studentProfileId: claimWizard.candidate.studentProfileId,
        relationship: claimRelationship,
      })
    );
  };

  const handleVerifyOtpSubmit = (e) => {
    e.preventDefault();
    const linkId = claimWizard.initiatedClaim?._id;
    if (!linkId || !inputOtp.trim()) {
      toast.error('Please enter the 6-digit verification code.');
      return;
    }
    dispatch(verifyWardClaimOtp({ linkId, otp: inputOtp.trim() }))
      .unwrap()
      .then(() => {
        toast.success('Contact verified! Claim routed to Head Master for physical approval.');
        dispatch(fetchMyClaims());
        dispatch(fetchMyWards());
      })
      .catch((err) => {
        toast.error(err || 'OTP verification failed.');
      });
  };

  const handleResetWizard = () => {
    dispatch(resetClaimWizard());
    setLookupGrNumber('');
    setInputOtp('');
  };

  // ───────────────────────────────────────────────────────────────────────────
  // UI Sub-Views
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <PageContainer
      title="PARENT & GUARDIAN WORKSPACE"
      subtitle={`Education Department Liaquatabad Town Centre (DMC) • Welcome, ${user?.fullName || 'Parent'}`}
      actions={
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 border border-blue-200 text-[#006AC7]">
            Active Guardian Session
          </span>
          <button
            type="button"
            onClick={() => {
              if (selectedWardId) dispatch(fetchWardFullWorkspace(selectedWardId));
              dispatch(fetchMyWards());
              dispatch(fetchMyClaims());
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#526477] transition shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      }
    >
      {/* ── Top Multi-Ward Switcher Bar ── */}
      <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#006AC7]/10 flex items-center justify-center text-[#006AC7]">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#102033]">Verified Student Wards</h2>
            <p className="text-xs text-[#526477]">
              {wards.length === 0
                ? 'No verified wards linked yet'
                : `Select a student to monitor records (${wards.length} linked)`}
            </p>
          </div>
        </div>

        {wards.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {wards.map((wardItem) => {
              const profile = wardItem.studentProfileId;
              const wardId = String(profile?._id || wardItem.studentProfileId);
              const isSelected = String(selectedWardId) === wardId;
              const studentName = profile?.userId?.fullName || 'Student Ward';
              const grNumber = profile?.grNumber || 'N/A';
              const schoolCode = profile?.schoolId?.code || 'School';

              return (
                <button
                  key={wardId}
                  type="button"
                  onClick={() => handleSelectWard(wardId)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                    isSelected
                      ? 'bg-[#006AC7] text-white border-[#006AC7] shadow-sm'
                      : 'bg-slate-50 text-[#102033] border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>{studentName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-[#526477]'
                    }`}
                  >
                    GR: {grNumber} • {schoolCode}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => handleTabChange('link_ward')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#006AC7] bg-blue-50/60 hover:bg-blue-100/60 border border-blue-200 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Link Another Student
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleTabChange('link_ward')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#006AC7] hover:bg-[#005299] transition shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            Link Your Child Now
          </button>
        )}
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto gap-2">
        <button
          type="button"
          onClick={() => handleTabChange('overview')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-[#006AC7] text-[#006AC7]'
              : 'border-transparent text-[#526477] hover:text-[#102033]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Ward Overview
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('attendance')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'border-[#006AC7] text-[#006AC7]'
              : 'border-transparent text-[#526477] hover:text-[#102033]'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          Attendance Intelligence
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('marksheets')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'marksheets'
              ? 'border-[#006AC7] text-[#006AC7]'
              : 'border-transparent text-[#526477] hover:text-[#102033]'
          }`}
        >
          <Award className="w-4 h-4" />
          Academic Marksheets
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('homework')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'homework'
              ? 'border-[#006AC7] text-[#006AC7]'
              : 'border-transparent text-[#526477] hover:text-[#102033]'
          }`}
        >
          <FileText className="w-4 h-4" />
          Homework &amp; Diary
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('circulars')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'circulars'
              ? 'border-[#006AC7] text-[#006AC7]'
              : 'border-transparent text-[#526477] hover:text-[#102033]'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          School Circulars
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('link_ward')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'link_ward'
              ? 'border-[#006AC7] text-[#006AC7]'
              : 'border-transparent text-[#526477] hover:text-[#102033]'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Link Student &amp; Claims ({claims.length})
        </button>
      </div>

      {/* ── Tab Content Views ── */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {activeWardData.isLoading ? (
            <div className="p-12 text-center text-[#526477] text-xs font-bold flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#006AC7]" />
              Loading ward particulars...
            </div>
          ) : !activeWard ? (
            <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-4">
              <GraduationCap className="w-12 h-12 text-[#8094A8] mx-auto" />
              <h3 className="text-base font-bold text-[#102033]">No Verified Student Ward Selected</h3>
              <p className="text-xs text-[#526477] max-w-md mx-auto">
                You do not have an active verified ward link selected. If you have already submitted a claim, please check the status under the Link Student tab.
              </p>
              <button
                type="button"
                onClick={() => handleTabChange('link_ward')}
                className="px-4 py-2 rounded-xl bg-[#006AC7] text-white text-xs font-bold hover:bg-[#005299] transition shadow-xs"
              >
                Go to Link Student Wizard
              </button>
            </div>
          ) : (
            <>
              {/* Primary Ward Profile Hero Card */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#006AC7] to-blue-400 text-white flex items-center justify-center font-display font-black text-2xl shadow-sm">
                    {(activeWardData.profile?.fullName || 'S')[0].toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-[#102033]">
                        {activeWardData.profile?.fullName || 'Student Ward'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-[#4B7F3A] border border-emerald-200">
                        {activeWardData.profile?.lifecycleStatus || 'ACTIVE'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#006AC7] border border-blue-200">
                        {activeWardData.profile?.relationship || 'WARD'}
                      </span>
                    </div>
                    <p className="text-xs text-[#526477]">
                      GR Number: <span className="font-bold text-[#102033]">{activeWardData.profile?.grNumber}</span> • Class:{' '}
                      <span className="font-bold text-[#102033]">{activeWardData.profile?.class?.name || 'Class 5'}</span> (
                      {activeWardData.profile?.section?.name || 'A'})
                    </p>
                    <p className="text-xs text-[#526477] flex items-center gap-1.5">
                      <School className="w-3.5 h-3.5 text-[#8094A8]" />
                      <span>{activeWardData.profile?.school?.name}</span>
                      <span className="text-[10px] text-[#8094A8]">({activeWardData.profile?.school?.code})</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-[#8094A8]">EMIS Code</p>
                    <p className="text-sm font-black text-[#102033]">{activeWardData.profile?.school?.emisCode || '4080101'}</p>
                    <p className="text-[10px] text-[#526477] mt-0.5">Municipal Registry</p>
                  </div>
                </div>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-[#526477] uppercase tracking-wider mb-2">
                    <span>Attendance Rate</span>
                    <div className="p-2 rounded-xl bg-emerald-50 text-[#4B7F3A]">
                      <ClipboardCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-[#102033]">
                    {activeWardData.attendance?.summary?.overall?.percentage || 94}%
                  </div>
                  <p className="text-xs text-[#526477] mt-1">
                    {activeWardData.attendance?.summary?.overall?.presentCount || 0} Present /{' '}
                    {activeWardData.attendance?.summary?.overall?.totalDays || 0} Days
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-[#526477] uppercase tracking-wider mb-2">
                    <span>Latest Exam Grade</span>
                    <div className="p-2 rounded-xl bg-blue-50 text-[#006AC7]">
                      <Award className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-[#102033]">
                    {activeWardData.marksheets[0]?.grade || 'A-1'}
                  </div>
                  <p className="text-xs text-[#526477] mt-1">
                    {activeWardData.marksheets[0]?.exam?.term || 'Mid-Term'} •{' '}
                    {activeWardData.marksheets[0]?.rankFormatted || 'Rank Verified'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-[#526477] uppercase tracking-wider mb-2">
                    <span>Active Homework</span>
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-[#102033]">
                    {activeWardData.homework?.length || 0} Tasks
                  </div>
                  <p className="text-xs text-[#526477] mt-1">Classroom assignments assigned</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-[#526477] uppercase tracking-wider mb-2">
                    <span>Official Notices</span>
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-[#102033]">
                    {activeWardData.circulars?.length || 0}
                  </div>
                  <p className="text-xs text-[#526477] mt-1">Town &amp; School circulars</p>
                </div>
              </div>

              {/* Quick Glance: Next Due Homework & Recent Attendance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Homework */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#102033] flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#006AC7]" />
                      Pending Homework Assignments
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleTabChange('homework')}
                      className="text-xs font-bold text-[#006AC7] hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  {activeWardData.homework.length === 0 ? (
                    <p className="text-xs text-[#526477] italic py-4">No active homework tasks assigned right now.</p>
                  ) : (
                    <div className="space-y-3">
                      {activeWardData.homework.slice(0, 3).map((hw) => (
                        <div
                          key={hw.id}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#006AC7]">
                              {hw.subject?.name || 'General'}
                            </span>
                            <p className="text-xs font-bold text-[#102033]">{hw.title}</p>
                            <p className="text-[11px] text-[#526477]">Teacher: {hw.teacher?.fullName}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                              Due: {new Date(hw.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Attendance */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#102033] flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-[#4B7F3A]" />
                      Recent Attendance Records
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleTabChange('attendance')}
                      className="text-xs font-bold text-[#006AC7] hover:underline"
                    >
                      Full History
                    </button>
                  </div>

                  {!activeWardData.attendance?.history || activeWardData.attendance.history.length === 0 ? (
                    <p className="text-xs text-[#526477] italic py-4">No recent attendance records found.</p>
                  ) : (
                    <div className="space-y-2">
                      {activeWardData.attendance.history.slice(0, 4).map((att, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <Calendar className="w-3.5 h-3.5 text-[#8094A8]" />
                            <span className="font-medium text-[#102033]">
                              {new Date(att.date).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {att.remarks && <span className="text-[10px] text-[#526477] italic">({att.remarks})</span>}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                att.status === 'PRESENT'
                                  ? 'bg-emerald-50 text-[#4B7F3A] border-emerald-200'
                                  : att.status === 'ABSENT'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {att.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 2. ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#102033] flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-[#4B7F3A]" />
              Detailed Attendance Telemetry &amp; Monthly Rollup
            </h3>
            <p className="text-xs text-[#526477]">
              Records are verified daily by the class teacher during official attendance hours under municipal policy.
            </p>

            {/* Summary statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-[#526477]">Working Days</span>
                <p className="text-xl font-black text-[#102033] mt-1">
                  {activeWardData.attendance?.summary?.overall?.totalDays || 0}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-[10px] font-bold uppercase text-[#4B7F3A]">Days Present</span>
                <p className="text-xl font-black text-[#4B7F3A] mt-1">
                  {activeWardData.attendance?.summary?.overall?.presentCount || 0}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100">
                <span className="text-[10px] font-bold uppercase text-rose-700">Days Absent</span>
                <p className="text-xl font-black text-rose-700 mt-1">
                  {activeWardData.attendance?.summary?.overall?.absentCount || 0}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100">
                <span className="text-[10px] font-bold uppercase text-amber-700">Approved Leave</span>
                <p className="text-xl font-black text-amber-700 mt-1">
                  {activeWardData.attendance?.summary?.overall?.leaveCount || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Daily Records History Table */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-[#102033]">Daily Attendance Records (Last 30 Days)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[#526477] font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Day</th>
                    <th className="py-3 px-4">Official Status</th>
                    <th className="py-3 px-4">Teacher Remarks / Leave Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!activeWardData.attendance?.history || activeWardData.attendance.history.length === 0) ? (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-[#526477] italic">
                        No daily records found for this period.
                      </td>
                    </tr>
                  ) : (
                    activeWardData.attendance.history.map((record, index) => {
                      const d = new Date(record.date);
                      return (
                        <tr key={index} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-bold text-[#102033]">
                            {d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="py-3 px-4 text-[#526477]">
                            {d.toLocaleDateString(undefined, { weekday: 'long' })}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                record.status === 'PRESENT'
                                  ? 'bg-emerald-50 text-[#4B7F3A] border-emerald-200'
                                  : record.status === 'ABSENT'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {record.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#526477]">
                            {record.remarks || <span className="text-[#8094A8] italic">—</span>}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. MARKSHEETS TAB */}
      {activeTab === 'marksheets' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <h3 className="text-sm font-bold text-[#102033] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#006AC7]" />
              Official Academic Marksheets &amp; Transcripts
            </h3>
            <p className="text-xs text-[#526477]">
              Only examination results formally published and verified by the Head Master are displayed. You can download the official board-standard A4 PDF marksheet below.
            </p>
          </div>

          {activeWardData.marksheets.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center text-[#526477] text-xs">
              No published examination results available for this student yet.
            </div>
          ) : (
            activeWardData.marksheets.map((marksheet) => (
              <div
                key={marksheet.resultId}
                className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6"
              >
                {/* Header Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#006AC7] uppercase">
                      {marksheet.exam?.academicYear || '2025-2026'} • {marksheet.exam?.term || 'Annual'}
                    </span>
                    <h4 className="text-base font-bold text-[#102033]">{marksheet.exam?.title}</h4>
                    <p className="text-xs text-[#526477]">
                      Status: <span className="font-bold text-[#4B7F3A]">{marksheet.status}</span> • Rank:{' '}
                      <span className="font-bold text-[#102033]">{marksheet.rankFormatted}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-[#8094A8] uppercase">Grade &amp; Score</p>
                      <p className="text-lg font-black text-[#102033]">
                        {marksheet.grade} <span className="text-xs font-normal text-[#526477]">({marksheet.percentage}%)</span>
                      </p>
                      <p className="text-[10px] text-[#526477]">
                        {marksheet.totalMarksObtained} / {marksheet.totalMaxMarks}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={downloadingExamId === marksheet.exam?.id}
                      onClick={() =>
                        handleDownloadPdf(
                          marksheet.exam?.id,
                          marksheet.exam?.title,
                          activeWardData.profile?.grNumber
                        )
                      }
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#006AC7] hover:bg-[#005299] text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                    >
                      {downloadingExamId === marksheet.exam?.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>

                {/* Subject Marks Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-[#526477] font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Theory</th>
                        <th className="py-3 px-4">Practical</th>
                        <th className="py-3 px-4">Total Obtained</th>
                        <th className="py-3 px-4">Max Marks</th>
                        <th className="py-3 px-4">Grade</th>
                        <th className="py-3 px-4">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(marksheet.subjectMarks || []).map((sub, sIdx) => (
                        <tr key={sIdx} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-bold text-[#102033]">{sub.subjectName}</td>
                          <td className="py-3 px-4 text-[#526477] font-mono">{sub.subjectCode}</td>
                          <td className="py-3 px-4 text-[#102033]">{sub.theoryMarks}</td>
                          <td className="py-3 px-4 text-[#102033]">{sub.practicalMarks || '—'}</td>
                          <td className="py-3 px-4 font-bold text-[#102033]">{sub.totalObtained}</td>
                          <td className="py-3 px-4 text-[#526477]">{sub.maxMarks}</td>
                          <td className="py-3 px-4 font-bold text-[#006AC7]">{sub.grade}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                sub.isPassed
                                  ? 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {sub.isPassed ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. HOMEWORK TAB */}
      {activeTab === 'homework' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <h3 className="text-sm font-bold text-[#102033] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#006AC7]" />
              Classroom Homework &amp; Diary Assignments
            </h3>
            <p className="text-xs text-[#526477]">
              Assigned directly by subject teachers for Class {activeWardData.profile?.class?.name || '5'} Section{' '}
              {activeWardData.profile?.section?.name || 'A'}.
            </p>
          </div>

          {activeWardData.homework.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center text-[#526477] text-xs">
              No active homework assignments for this section at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeWardData.homework.map((hw) => (
                <div
                  key={hw.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#006AC7]">
                        {hw.subject?.name || 'Subject'}
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Due: {new Date(hw.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#102033]">{hw.title}</h4>
                    <p className="text-xs text-[#526477] leading-relaxed whitespace-pre-line">{hw.description}</p>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-[#526477]">
                    <span>Teacher: {hw.teacher?.fullName} ({hw.teacher?.designation})</span>
                    <span className="text-[10px] text-[#8094A8]">
                      Assigned: {new Date(hw.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. CIRCULARS TAB */}
      {activeTab === 'circulars' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <h3 className="text-sm font-bold text-[#102033] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#006AC7]" />
              Official Circulars, Advisories &amp; Holiday Directives
            </h3>
            <p className="text-xs text-[#526477]">
              Notices issued by Town Education Office (TEO) Liaquatabad and {activeWardData.profile?.school?.name}.
            </p>
          </div>

          {activeWardData.circulars.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center text-[#526477] text-xs">
              No circulars or directives currently published for this institution.
            </div>
          ) : (
            <div className="space-y-3">
              {activeWardData.circulars.map((circ) => (
                <div
                  key={circ.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 uppercase">
                        {circ.category || 'NOTICE'} • {circ.scope}
                      </span>
                      <span className="text-[11px] text-[#8094A8]">
                        {new Date(circ.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#102033]">{circ.title}</h4>
                    {circ.summary && <p className="text-xs text-[#526477] leading-relaxed">{circ.summary}</p>}
                    <p className="text-[11px] text-[#8094A8]">
                      Issued by: {circ.publisher?.name} ({circ.publisher?.designation})
                    </p>
                  </div>

                  {circ.fileUrl && (
                    <a
                      href={circ.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-xs font-bold text-[#006AC7] border border-slate-200 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Document</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. LINK WARD & CLAIMS TAB */}
      {activeTab === 'link_ward' && (
        <div className="space-y-8">
          {/* Step-by-Step Linking Wizard */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-[#102033] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#006AC7]" />
                Link a Student Ward to Your Account
              </h3>
              <p className="text-xs text-[#526477] mt-1">
                Enter your child's municipal school and General Register (GR) Number to verify your relationship through our 3-Layer Security standard (Lookup → Contact OTP → Head Master Approval).
              </p>
            </div>

            {/* Step 1: Candidate Lookup */}
            {!claimWizard.candidate && !claimWizard.initiatedClaim && (
              <form onSubmit={handleLookupSubmit} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-bold text-[#102033] mb-1.5">Municipal School</label>
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[#102033] focus:border-[#006AC7] focus:outline-none"
                  >
                    {municipalSchools.map((sch) => (
                      <option key={sch._id} value={sch._id}>
                        {sch.name} ({sch.schoolCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102033] mb-1.5">
                    Student General Register (GR) Number
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1042"
                    value={lookupGrNumber}
                    onChange={(e) => setLookupGrNumber(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[#102033] focus:border-[#006AC7] focus:outline-none"
                    required
                  />
                  <p className="text-[11px] text-[#8094A8] mt-1">
                    Found on the student's admission receipt, monthly fee challan, or report card.
                  </p>
                </div>

                {claimWizard.lookupError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                    {claimWizard.lookupError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={claimWizard.isLookingUp}
                  className="px-5 py-2.5 rounded-xl bg-[#006AC7] hover:bg-[#005299] text-white text-xs font-bold transition shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {claimWizard.isLookingUp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Search Student</span>
                </button>
              </form>
            )}

            {/* Step 2: Review Candidate & Select Relationship */}
            {claimWizard.candidate && !claimWizard.initiatedClaim && (
              <div className="p-5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-4 max-w-xl">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#006AC7] uppercase">Student Record Located</h4>
                  <button
                    type="button"
                    onClick={handleResetWizard}
                    className="text-xs text-[#526477] hover:underline"
                  >
                    Change Search
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="text-sm font-black text-[#102033]">
                    {claimWizard.candidate.maskedName}
                  </p>
                  <p className="text-[#526477]">
                    School: <span className="font-bold text-[#102033]">{claimWizard.candidate.schoolName}</span>
                  </p>
                  <p className="text-[#526477]">
                    Admission Class:{' '}
                    <span className="font-bold text-[#102033]">Class {claimWizard.candidate.admissionClass}</span>
                  </p>
                  <p className="text-[11px] text-[#8094A8] pt-1">
                    Anti-enumeration protection is active: Sensitive particulars remain shielded until verification.
                  </p>
                </div>

                <div className="border-t border-blue-100 pt-3 space-y-3">
                  <label className="block text-xs font-bold text-[#102033]">Your Relationship with Student</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['FATHER', 'MOTHER', 'LEGAL_GUARDIAN'].map((rel) => (
                      <button
                        key={rel}
                        type="button"
                        onClick={() => setClaimRelationship(rel)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                          claimRelationship === rel
                            ? 'bg-[#006AC7] text-white border-[#006AC7]'
                            : 'bg-white text-[#102033] border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {rel.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  {claimWizard.initiateError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                      {claimWizard.initiateError}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={claimWizard.isInitiating}
                    onClick={handleInitiateClaimSubmit}
                    className="w-full py-2.5 rounded-xl bg-[#006AC7] hover:bg-[#005299] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {claimWizard.isInitiating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    <span>Send Verification Code to Phone on Record</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Enter OTP */}
            {claimWizard.initiatedClaim && !claimWizard.isCompleted && (
              <form onSubmit={handleVerifyOtpSubmit} className="p-5 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-4 max-w-xl">
                <div>
                  <h4 className="text-xs font-bold text-[#4B7F3A] uppercase">Verification Code Dispatched</h4>
                  <p className="text-xs text-[#526477] mt-1">
                    A 6-digit cryptographic verification code has been dispatched to the official guardian mobile number on file.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102033] mb-1">Enter 6-Digit Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 123456"
                    value={inputOtp}
                    onChange={(e) => setInputOtp(e.target.value)}
                    className="w-full text-center tracking-widest font-mono text-base font-black rounded-xl border border-slate-200 bg-white px-3 py-2 text-[#102033] focus:border-[#4B7F3A] focus:outline-none"
                    required
                  />
                </div>

                {claimWizard.verifyError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                    {claimWizard.verifyError}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={claimWizard.isVerifyingOtp}
                    className="flex-1 py-2.5 rounded-xl bg-[#4B7F3A] hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {claimWizard.isVerifyingOtp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Verify Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetWizard}
                    className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#526477] hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Step 4: Completion Notice */}
            {claimWizard.isCompleted && (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#4B7F3A] space-y-2 max-w-xl">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-[#4B7F3A]" />
                  Claim Successfully Submitted
                </div>
                <p className="text-[#526477]">
                  Your claim has successfully passed contact OTP verification and is currently placed in the{' '}
                  <span className="font-bold text-[#102033]">Head Master Verification Queue</span>. The HM will verify your child's physical enrollment records before granting full portal access.
                </p>
                <button
                  type="button"
                  onClick={handleResetWizard}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-[#4B7F3A] text-white text-xs font-bold"
                >
                  Link Another Student
                </button>
              </div>
            )}
          </div>

          {/* All Claims Status History */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-[#102033]">My Link Claims &amp; Verification Status</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[#526477] font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">GR Number</th>
                    <th className="py-3 px-4">School</th>
                    <th className="py-3 px-4">Relationship</th>
                    <th className="py-3 px-4">Verification Status</th>
                    <th className="py-3 px-4">Submitted Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {claims.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-6 text-center text-[#526477] italic">
                        No claims submitted yet.
                      </td>
                    </tr>
                  ) : (
                    claims.map((claimItem) => {
                      const profile = claimItem.studentProfileId;
                      const status = claimItem.verificationStatus;
                      return (
                        <tr key={claimItem._id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-bold text-[#102033]">
                            {profile?.userId?.fullName || 'Student'}
                          </td>
                          <td className="py-3 px-4 text-[#526477] font-mono">{profile?.grNumber || '—'}</td>
                          <td className="py-3 px-4 text-[#526477]">{profile?.schoolId?.name || 'School'}</td>
                          <td className="py-3 px-4 font-bold text-[#006AC7]">{claimItem.relationship}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                status === 'VERIFIED'
                                  ? 'bg-emerald-50 text-[#4B7F3A] border-emerald-200'
                                  : status === 'PENDING_HM_APPROVAL'
                                  ? 'bg-blue-50 text-[#006AC7] border-blue-200'
                                  : status === 'PENDING_OTP'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#8094A8]">
                            {new Date(claimItem.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default ParentDashboard;
