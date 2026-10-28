import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchStaffProfile,
  downloadStaffPdf,
  updateStaffPrivacySettings,
  updateFieldVisibilityOptimistic,
  fetchProfileAttendance,
  fetchProfileLeaveSummary,
} from '../../store/slices/staffProfileSlice.js';
import {
  User,
  ShieldCheck,
  Building2,
  FileText,
  Download,
  Calendar,
  CreditCard,
  BookOpen,
  Phone,
  Mail,
  Award,
  IdCard,
  Briefcase,
  CheckCircle,
  Eye,
  EyeOff,
  Clock,
  ChevronLeft,
  Settings,
  History,
  Lock,
  AlertCircle,
  Shield,
  MapPin,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorUtils.js';
import PageContainer from '../../components/layout/PageContainer.jsx';

// Core Profile Cards (Directly modeled after the hand-drawn architectural sketch)
import { ProfilePhotoCard } from '../../components/staff/ProfilePhotoCard.jsx';
import { FieldVisibilityEye } from '../../components/staff/FieldVisibilityEye.jsx';
import { TransferTimelineCard } from '../../components/staff/TransferTimelineCard.jsx';
import { MonthlyAttendanceCard } from '../../components/staff/MonthlyAttendanceCard.jsx';
import { CasualLeaveQuotaCard } from '../../components/staff/CasualLeaveQuotaCard.jsx';
import { CredentialsSecurityCard } from '../../components/staff/CredentialsSecurityCard.jsx';

// Modals
import ProfilePrivacySettingsModal from '../../components/staff/ProfilePrivacySettingsModal.jsx';
import PdfAccessRequestModal from '../../components/staff/PdfAccessRequestModal.jsx';
import StaffAccessHistoryModal from '../../components/staff/StaffAccessHistoryModal.jsx';
import SecuritySettingsModal from '../../components/common/SecuritySettingsModal.jsx';

export const StaffProfilePage = () => {
  const { id: parameterId } = useParams();
  const targetId = parameterId || 'me';
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentUser = useSelector((state) => state.auth?.user);
  const canAccessDirectory = ['ROOT_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'HM', 'TEACHER'].includes(currentUser?.role);
  const {
    profileData,
    loading,
    error,
    isDownloadingPdf,
    pdfDownloadError,
    attendanceData,
    loadingAttendance,
    leaveSummary,
    loadingLeave,
  } = useSelector((state) => state.staffProfile);

  const isOwner = Boolean(
    currentUser &&
      (targetId === 'me' ||
        (profileData?.user?.id && String(currentUser._id) === String(profileData.user.id)) ||
        (profileData?.user?._id && String(currentUser._id) === String(profileData.user._id)) ||
        String(currentUser._id) === String(targetId))
  );
  const isColleagueView = !isOwner && currentUser?.role === 'TEACHER';

  const [showSensitiveFields, setShowSensitiveFields] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // 1. Parent Isolation Guard: Parents do not have staff dossiers and view verified wards via Parent Portal
  useEffect(() => {
    if (currentUser?.role === 'PARENT') {
      toast('Parent accounts view student records directly in the Parent Portal.', {
        icon: 'ℹ️',
      });
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  // 2. Fetch Profile Dossier
  useEffect(() => {
    dispatch(fetchStaffProfile(targetId));
  }, [targetId, dispatch]);

  // 3. Fetch Monthly Attendance & Casual Leave Quota ONLY for the profile owner
  useEffect(() => {
    if (profileData && isOwner && currentUser?.role !== 'PARENT') {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const isTeaching = profileData.profile?.isTeachingStaff ?? true;

      dispatch(
        fetchProfileAttendance({
          month: currentMonth,
          year: currentYear,
          isTeachingStaff: isTeaching,
        })
      );

      // Casual Leave Quota applies to municipal employees (teachers, HMs, staff)
      if (profileData.user?.role !== 'STUDENT') {
        dispatch(fetchProfileLeaveSummary());
      }
    }
  }, [profileData, isOwner, currentUser, dispatch]);

  useEffect(() => {
    if (pdfDownloadError) {
      toast.error(getErrorMessage(pdfDownloadError, 'Failed to download official PDF dossier.'));
    }
  }, [pdfDownloadError]);

  const handleMonthChange = (selectedMonth, selectedYear) => {
    const isTeaching = profileData?.profile?.isTeachingStaff ?? true;
    dispatch(
      fetchProfileAttendance({
        month: selectedMonth,
        year: selectedYear,
        isTeachingStaff: isTeaching,
      })
    );
  };

  // Inline field visibility modifier with optimistic UI feedback
  const handleFieldVisibilityUpdate = async (fieldName, newTier) => {
    dispatch(updateFieldVisibilityOptimistic({ field: fieldName, value: newTier }));

    const existingPrivacy =
      profileData?.profile?.privacySettings || profileData?.privacySettings || {};
    const existingFieldVisibility = existingPrivacy.fieldVisibility || {};

    const updatedPrivacyPayload = {
      ...existingPrivacy,
      fieldVisibility: {
        ...existingFieldVisibility,
        [fieldName]: newTier,
      },
    };

    try {
      await dispatch(
        updateStaffPrivacySettings({
          targetId,
          privacySettings: updatedPrivacyPayload,
        })
      ).unwrap();
      toast.success(
        `Updated visibility for ${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()} to ${newTier.replace(
          '_',
          ' '
        )}.`
      );
    } catch (visibilityUpdateError) {
      toast.error(
        getErrorMessage(visibilityUpdateError, 'Failed to update visibility settings.')
      );
      dispatch(fetchStaffProfile(targetId));
    }
  };

  const handleDownloadClick = () => {
    if (!profileData) return;

    const { pdfAccess, profile, user } = profileData;
    const employeeIdentifier = profile?.employeeId || user?.fullName || 'Staff';
    const canDownload = Boolean(pdfAccess?.allowed || pdfAccess?.canDirectDownload || isOwner);

    if (canDownload) {
      dispatch(downloadStaffPdf({ targetId, employeeId: employeeIdentifier }))
        .unwrap()
        .then(() => {
          toast.success('Official Service Record PDF downloaded successfully.');
        })
        .catch((downloadError) => {
          toast.error(getErrorMessage(downloadError, 'Failed to download official PDF.'));
        });
    } else {
      setIsRequestModalOpen(true);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="p-16 text-center text-[#526477]">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-3 text-[#006AC7]" />
          <p className="text-xs font-semibold">Loading official service record dossier...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !profileData) {
    return (
      <PageContainer>
        <div className="p-10 max-w-md mx-auto text-center space-y-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm mt-8">
          <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto text-rose-600">
            <IdCard className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#102033]">Personal Record Restricted</h3>
          <p className="text-xs text-[#526477]">
            {error || 'The requested profile could not be found or you do not have permission to view it.'}
          </p>
          <Link
            to={canAccessDirectory ? '/directory' : '/dashboard'}
            className="inline-block text-xs font-bold text-[#006AC7] hover:underline"
          >
            &larr; {canAccessDirectory ? 'Return to Staff Directory' : 'Return to Dashboard'}
          </Link>
        </div>
      </PageContainer>
    );
  }

  const { user, profile, assignments, pdfAccess } = profileData;
  const canManagePrivacy = isOwner || ['ADMIN', 'SUPER_ADMIN', 'ROOT_ADMIN'].includes(currentUser?.role);
  const isStudentProfile = user?.role === 'STUDENT';
  const student = profileData?.studentProfile;
  const privacySettings = profile?.privacySettings || profileData?.privacySettings || {};
  const fieldVisibility = privacySettings.fieldVisibility || {};
  const canDirectDownloadPdf = Boolean(pdfAccess?.allowed || pdfAccess?.canDirectDownload || isOwner);

  return (
    <PageContainer
      title={
        isStudentProfile
          ? 'Student Academic Profile'
          : isColleagueView
            ? 'School Directory — Faculty Profile'
            : 'Personal Profile & Service Record'
      }
      subtitle={
        isStudentProfile
          ? 'Official student academic and enrollment record'
          : isColleagueView
            ? 'Official faculty directory record — Liaquatabad Town'
            : 'Official faculty and staff service record dossier — Liaquatabad Town'
      }
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Navigation & Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link
            to={isStudentProfile || isOwner || !canAccessDirectory ? '/dashboard' : '/directory?tab=staff'}
            className="inline-flex items-center gap-1.5 text-xs text-[#526477] hover:text-[#102033] font-bold transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {isStudentProfile || isOwner || !canAccessDirectory ? 'Back to Dashboard' : 'Back to Staff Directory'}
          </Link>

          {/* Action buttons (Audit History, Privacy Settings, Security, PDF Download) - NEVER shown to colleague teachers */}
          {!isColleagueView && (
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Access History Transparency Button (Owner & Privileged Admins) */}
              {!isStudentProfile && (isOwner || ['ROOT_ADMIN', 'SUPER_ADMIN'].includes(currentUser?.role)) && (
                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#526477] text-xs font-semibold transition-colors shadow-xs"
                >
                  <History className="w-4 h-4 text-[#526477]" />
                  Access Audit History
                </button>
              )}

              {/* Privacy Settings Modal Button (Owner & Admins) */}
              {canManagePrivacy && (
                <button
                  type="button"
                  onClick={() => setIsPrivacyModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#102033] text-xs font-semibold transition-colors shadow-xs"
                >
                  <Settings className="w-4 h-4 text-[#006AC7]" />
                  Privacy &amp; ABAC Settings
                </button>
              )}

              {/* Account Security & Sessions Button (Owner Only) */}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setIsSecurityModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#102033] text-xs font-semibold transition-colors shadow-xs"
                >
                  <Shield className="w-4 h-4 text-[#006AC7]" />
                  Security &amp; Sessions
                </button>
              )}

              {/* Download Official PDF Button (Owner, HM, Admin - NOT Colleague Teacher) */}
              {!isStudentProfile && (
                <button
                  type="button"
                  onClick={handleDownloadClick}
                  disabled={isDownloadingPdf}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 ${canDirectDownloadPdf
                      ? 'bg-[#006AC7] hover:bg-[#005299]'
                      : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                >
                  {canDirectDownloadPdf ? (
                    <Download className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  {isDownloadingPdf
                    ? 'Generating PDF...'
                    : canDirectDownloadPdf
                      ? 'Download Official Record (PDF)'
                      : 'Request PDF Consent'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Consent / Access Policy Notice Banner: Displayed ONLY when viewing an external staff profile that requires consent (and NOT in colleague view) */}
        {!isStudentProfile && !isOwner && !isColleagueView && !canDirectDownloadPdf && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Individual PDF Consent Protection Active</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                {pdfAccess?.activeRequest?.status === 'PENDING' ? (
                  <>
                    An official access request was dispatched on{' '}
                    <strong>
                      {new Date(pdfAccess.activeRequest.createdAt).toLocaleDateString()}
                    </strong>{' '}
                    and is currently{' '}
                    <span className="font-bold underline">PENDING STAFF APPROVAL</span>.
                  </>
                ) : (
                  'Direct PDF download is restricted by staff privacy preference. Click "Request PDF Consent" to state your official purpose.'
                )}
              </p>
            </div>
          </div>
        )}

        {/* ZONE 1: TOP IDENTITY & SERVICE DOSSIER (Prominent Photo on Left + Structured Dossier on Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Prominent Profile Photo Card (Left Column - Directly from User Sketch) */}
          <div className="lg:col-span-4 xl:col-span-3">
            <ProfilePhotoCard
              user={user}
              profile={profile}
              studentProfile={profileData?.studentProfile}
              targetId={targetId}
              isOwner={isOwner}
              canManagePrivacy={canManagePrivacy}
              onVisibilityChange={handleFieldVisibilityUpdate}
              fieldVisibility={fieldVisibility}
              isColleagueView={isColleagueView}
            />
          </div>

          {/* Right Column: Identification, Civil Service, and Bank Dossier Cards */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {isColleagueView ? (
              <div className="space-y-6">
                {/* Academic Coordination Banner */}
                <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between text-xs text-[#006AC7]">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 flex-shrink-0" />
                    <span className="font-semibold">
                      School Directory &bull; Academic Coordination &amp; Teaching Roster
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#005299] text-[10px] font-bold">
                    Faculty View
                  </span>
                </div>

                {/* Academic & Faculty Details Card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#102033] flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <GraduationCap className="w-4 h-4 text-[#006AC7]" />
                    Faculty Academic Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[#526477] block text-[11px] font-medium">Full Name</span>
                      <span className="font-bold text-[#102033] text-sm">{user?.fullName}</span>
                    </div>

                    <div>
                      <span className="text-[#526477] block text-[11px] font-medium">Official Designation</span>
                      <span className="font-bold text-[#006AC7]">{user?.designation || 'Teacher'}</span>
                    </div>

                    <div>
                      <span className="text-[#526477] block text-[11px] font-medium">Assigned Institution</span>
                      <span className="font-semibold text-[#102033]">
                        {user?.school?.name || 'Assigned Institution'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#526477] block text-[11px] font-medium">Educational Qualification</span>
                      <span className="font-semibold text-[#102033]">
                        {profile?.qualification || 'Not Recorded'}
                      </span>
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <span className="text-[#526477] block text-[11px] font-medium">Administrative Jurisdiction</span>
                      <span className="text-[#102033] font-medium">
                        Town Municipal Corporation (TMC) Liaquatabad &bull; Education Department
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Sensitive Fields Visibility Toggle Bar */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="text-[#8094A8] text-[11px] font-medium flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#006AC7]" />
                    Education Department Liaquatabad Town Centre &bull; Field-Level ABAC Protection
                  </span>

                  {profile?.cnic && !profile.cnic.includes('Masked') && (
                    <button
                      type="button"
                      onClick={() => setShowSensitiveFields(!showSensitiveFields)}
                      className="inline-flex items-center gap-1.5 text-xs text-[#006AC7] hover:underline font-bold self-start sm:self-auto"
                    >
                      {showSensitiveFields ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      {showSensitiveFields ? 'Hide Sensitive Fields' : 'Reveal Sensitive Fields'}
                    </button>
                  )}
                </div>

                {/* Section 1 & 2: Personal Identification & Service/Academic Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Identification (Card 1) */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3.5 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#102033] flex items-center gap-2 border-b border-slate-100 pb-2.5">
                      <IdCard className="w-4 h-4 text-[#006AC7]" />
                      1. Personal Identification
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      <div>
                        <span className="text-[#526477] block text-[11px] font-medium">Full Name</span>
                        <span className="font-bold text-[#102033]">{user?.fullName}</span>
                      </div>

                      <div>
                        <span className="text-[#526477] block text-[11px] font-medium">
                          {isStudentProfile ? "Guardian's Name" : "Father's Name"}
                        </span>
                        <span className="font-bold text-[#102033]">
                          {isStudentProfile
                            ? student?.fatherFullName || student?.guardianName || 'Not Recorded'
                            : profile?.fatherName || 'Not Recorded'}
                        </span>
                      </div>

                      {/* CNIC / B-Form with Eye Control */}
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-[#526477] text-[11px] font-medium">
                            {isStudentProfile ? 'B-Form / CRC' : 'CNIC (National ID)'}
                          </span>
                          <FieldVisibilityEye
                            field={isStudentProfile ? 'bFormNumber' : 'cnic'}
                            label={isStudentProfile ? 'B-Form' : 'CNIC'}
                            currentTier={
                              fieldVisibility[isStudentProfile ? 'bFormNumber' : 'cnic'] ||
                              'AUTHORIZED_ROLE'
                            }
                            isOwner={isOwner}
                            onUpdate={handleFieldVisibilityUpdate}
                          />
                        </div>
                        <span className="font-mono font-bold text-[#006AC7]">
                          {isStudentProfile
                            ? student?.bFormNumber || 'Masked / Restricted'
                            : profile?.cnic || 'Masked / Restricted'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[#526477] block text-[11px] font-medium">
                          Date of Birth
                        </span>
                        <span className="font-bold text-[#102033]">
                          {isStudentProfile
                            ? student?.dateOfBirth
                              ? new Date(student.dateOfBirth).toLocaleDateString()
                              : 'Not Recorded'
                            : profile?.dateOfBirth
                              ? new Date(profile.dateOfBirth).toLocaleDateString()
                              : 'Not Recorded'}
                        </span>
                      </div>

                      {/* Email with Eye Control */}
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-[#526477] text-[11px] font-medium">Official Email</span>
                          <FieldVisibilityEye
                            field="email"
                            label="Email"
                            currentTier={fieldVisibility.email || 'PUBLIC'}
                            isOwner={isOwner}
                            onUpdate={handleFieldVisibilityUpdate}
                          />
                        </div>
                        <span className="text-[#102033] font-medium break-all">
                          {user?.email || 'N/A'}
                        </span>
                      </div>

                      {/* Phone Number with Eye Control */}
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-[#526477] text-[11px] font-medium">
                            {isStudentProfile ? 'Guardian Phone' : 'Contact Phone'}
                          </span>
                          <FieldVisibilityEye
                            field={isStudentProfile ? 'guardianCellNumber' : 'phoneNumber'}
                            label="Phone Number"
                            currentTier={
                              fieldVisibility[
                              isStudentProfile ? 'guardianCellNumber' : 'phoneNumber'
                              ] || 'SCHOOL'
                            }
                            isOwner={isOwner}
                            onUpdate={handleFieldVisibilityUpdate}
                          />
                        </div>
                        <span className="text-[#102033] font-medium">
                          {isStudentProfile
                            ? student?.guardianCellNumber || 'Not Recorded'
                            : user?.phoneNumber || 'Not Recorded'}
                        </span>
                      </div>

                      {/* Residential Address with Eye Control */}
                      <div className="col-span-1 sm:col-span-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[#526477] text-[11px] font-medium">
                            Residential Address
                          </span>
                          <FieldVisibilityEye
                            field="residentialAddress"
                            label="Residential Address"
                            currentTier={fieldVisibility.residentialAddress || 'AUTHORIZED_ROLE'}
                            isOwner={isOwner}
                            onUpdate={handleFieldVisibilityUpdate}
                          />
                        </div>
                        <span className="text-[#102033] font-medium">
                          {isStudentProfile
                            ? student?.residentialAddress || student?.permanentResidentialAddress || 'Confidential / Not Recorded'
                            : profile?.residentialAddress || 'Confidential / Restricted to Authorized Officials'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Employment / Service Details or Student Academic Details (Card 2) */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3.5 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#102033] flex items-center gap-2 border-b border-slate-100 pb-2.5">
                      <Briefcase className="w-4 h-4 text-[#006AC7]" />
                      {isStudentProfile ? '2. Academic & Enrollment Details' : '2. Civil Service & Employment'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      <div>
                        <span className="text-[#526477] block text-[11px] font-medium">
                          {isStudentProfile ? 'General Register (GR) No' : 'Personal / Employee No'}
                        </span>
                        <span className="font-mono font-bold text-[#102033]">
                          {isStudentProfile
                            ? (student?.grNumber ? `GR-${student.grNumber}` : student?.admissionRegisterNumber || 'Not Assigned')
                            : profile?.employeeId || 'Not Assigned'}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-[#526477] text-[11px] font-medium">
                            {isStudentProfile ? 'Medium of Instruction' : 'Official Designation'}
                          </span>
                          {!isStudentProfile && (
                            <FieldVisibilityEye
                              field="designation"
                              label="Designation"
                              currentTier={fieldVisibility.designation || 'PUBLIC'}
                              isOwner={isOwner}
                              onUpdate={handleFieldVisibilityUpdate}
                            />
                          )}
                        </div>
                        <span className="font-bold text-[#006AC7]">
                          {isStudentProfile
                            ? student?.mediumOfInstruction || 'Not Specified'
                            : user?.designation || 'Staff'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[#526477] block text-[11px] font-medium">
                          {isStudentProfile ? 'Admission Date' : 'Date of Appointment'}
                        </span>
                        <span className="font-bold text-[#102033]">
                          {isStudentProfile
                            ? student?.admissionDate
                              ? new Date(student.admissionDate).toLocaleDateString()
                              : 'Not Recorded'
                            : profile?.appointmentDate
                              ? new Date(profile.appointmentDate).toLocaleDateString()
                              : 'Not Recorded'}
                        </span>
                      </div>

                      {/* Qualification / Enrolled Class with Eye Control */}
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-[#526477] text-[11px] font-medium">
                            {isStudentProfile ? 'Enrolled Class & Section' : 'Educational Qualification'}
                          </span>
                          {!isStudentProfile && (
                            <FieldVisibilityEye
                              field="qualification"
                              label="Qualification"
                              currentTier={fieldVisibility.qualification || 'PUBLIC'}
                              isOwner={isOwner}
                              onUpdate={handleFieldVisibilityUpdate}
                            />
                          )}
                        </div>
                        <span className="font-bold text-[#102033]">
                          {isStudentProfile
                            ? (student?.class?.name && student?.section?.name
                              ? `${student.class.name} (${student.section.name})`
                              : student?.class?.name || 'Unassigned Class')
                            : profile?.qualification || 'Not Recorded'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[#526477] block text-[11px] font-medium">
                          Assigned Institution
                        </span>
                        <span className="text-[#102033] font-medium">
                          {student?.school?.name || user?.school?.name || 'Unassigned Institution'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[#526477] block text-[11px] font-medium">
                          Institutional District
                        </span>
                        <span className="text-[#102033] font-medium">
                          Town Municipal Corporation (TMC) Liaquatabad
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Bank / Payroll Disbursement (Staff Only - Card 3) */}
                {!isStudentProfile && (
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3.5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#102033] flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#006AC7]" />
                        3. Bank &amp; Payroll Disbursement Information
                      </h3>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-[#526477]">Bank Details Privacy:</span>
                        <FieldVisibilityEye
                          field="bankDetails"
                          label="Bank Account Details"
                          currentTier={fieldVisibility.bankDetails || 'AUTHORIZED_ROLE'}
                          isOwner={isOwner}
                          onUpdate={handleFieldVisibilityUpdate}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-[#526477] block text-[11px] font-medium">Bank Name</span>
                        <span className="font-bold text-[#102033]">{profile?.bankName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[#526477] block text-[11px] font-medium">
                          Branch &amp; Code
                        </span>
                        <span className="font-bold text-[#102033]">
                          {profile?.branchName || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#526477] block text-[11px] font-medium">Account Title</span>
                        <span className="font-bold text-[#102033]">
                          {profile?.accountTitle || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#526477] block text-[11px] font-medium">
                          Account Number / IBAN
                        </span>
                        <span className="font-mono font-bold text-[#006AC7]">
                          {profile?.accountNumber || 'Masked / Restricted'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* TEACHER ONLY: Authoritative Subject Assignments */}
        {profile?.isTeachingStaff && assignments && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-[#102033] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#006AC7]" />
                Teaching Subject Assignments
              </h3>
              <span className="text-[11px] text-[#526477] font-medium">
                {assignments.active?.length || 0} Active
                {!isColleagueView && ` • ${assignments.history?.length || 0} Historical`}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-[#526477] uppercase tracking-wider mb-2">
                  Current Active Assignments
                </h4>
                {!assignments.active || assignments.active.length === 0 ? (
                  <p className="text-xs text-[#8094A8] italic p-4 rounded-xl bg-slate-50 border border-slate-200">
                    No active subject assignments assigned to this teacher currently.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {assignments.active.map((assignmentItem) => (
                      <div
                        key={assignmentItem._id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs hover:border-[#006AC7]/40 transition-all"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#102033]">
                            {assignmentItem.classId?.name} (Sec {assignmentItem.sectionId?.name})
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#4B7F3A] border border-emerald-200 text-[10px] font-bold">
                            ACTIVE
                          </span>
                        </div>
                        <div className="text-[#006AC7] font-bold">
                          {assignmentItem.subjectId?.name} [
                          {assignmentItem.subjectId?.code || 'GEN'}]
                        </div>
                        <div className="text-[10px] text-[#526477]">
                          Session:{' '}
                          <span className="font-mono font-bold text-[#102033]">
                            {assignmentItem.academicSession}
                          </span>
                        </div>
                        {!isColleagueView && (
                          <div className="text-[10px] text-[#8094A8]">
                            Effective from:{' '}
                            {assignmentItem.effectiveFrom
                              ? new Date(assignmentItem.effectiveFrom).toLocaleDateString()
                              : 'N/A'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!isColleagueView && assignments.history && assignments.history.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-[#526477] uppercase tracking-wider mb-2">
                    Historical Subject Assignments (Archived)
                  </h4>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50 text-xs">
                    {assignments.history.map((historicalAssignment) => (
                      <div
                        key={historicalAssignment._id}
                        className="p-3 flex items-center justify-between text-[#526477] text-[11px]"
                      >
                        <div>
                          <span className="font-bold text-[#102033]">
                            {historicalAssignment.classId?.name} (Sec{' '}
                            {historicalAssignment.sectionId?.name}) &bull;{' '}
                            {historicalAssignment.subjectId?.name}
                          </span>
                          <span className="ml-2 text-[10px] text-[#8094A8]">
                            ({historicalAssignment.academicSession})
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-[#8094A8]">
                            {historicalAssignment.effectiveFrom
                              ? new Date(historicalAssignment.effectiveFrom).toLocaleDateString()
                              : ''}{' '}
                            -{' '}
                            {historicalAssignment.effectiveTo
                              ? new Date(historicalAssignment.effectiveTo).toLocaleDateString()
                              : 'Ended'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[#526477] text-[10px] font-bold">
                            {historicalAssignment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ZONE 2: TRANSFER & POSTING DETAILS (Owner & Administrative Staff View Only) */}
        {!isStudentProfile && !isColleagueView && (
          <TransferTimelineCard
            transferHistory={profile?.transferHistory || []}
            currentSchool={user?.school}
            appointmentDate={profile?.appointmentDate}
            joiningDate={profile?.joiningDate}
            employeeId={profile?.employeeId}
          />
        )}

        {/* ZONE 3: MONTHLY ATTENDANCE RECORD (Profile Owner Only) */}
        {isOwner && (
          <MonthlyAttendanceCard
            attendanceData={attendanceData}
            loading={loadingAttendance}
            onMonthChange={handleMonthChange}
            isTeachingStaff={profile?.isTeachingStaff ?? true}
            schoolName={user?.school?.name || 'Assigned School'}
          />
        )}

        {/* ZONE 4: CASUAL LEAVE QUOTA & APPLICATIONS (Profile Owner Only) */}
        {isOwner && !isStudentProfile && (
          <CasualLeaveQuotaCard
            leaveSummary={leaveSummary}
            loading={loadingLeave}
            isOwner={isOwner}
          />
        )}

        {/* ZONE 5: CREDENTIALS & SECURITY GOVERNANCE (Profile Owner Only) */}
        {isOwner && (
          <CredentialsSecurityCard
            isOwner={isOwner}
            onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
            userRole={user?.role}
          />
        )}
      </div>

      {/* Modals */}
      <ProfilePrivacySettingsModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        targetId={targetId}
        initialSettings={profile?.privacySettings}
      />

      <PdfAccessRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        targetId={targetId}
        targetName={user?.fullName}
      />

      <StaffAccessHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        targetId={targetId}
        staffName={user?.fullName}
      />

      <SecuritySettingsModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </PageContainer>
  );
};

export default StaffProfilePage;