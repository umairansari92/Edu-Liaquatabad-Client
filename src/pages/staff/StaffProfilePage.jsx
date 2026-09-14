import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchStaffProfile,
  downloadStaffPdf,
} from '../../store/slices/staffProfileSlice.js';
import {
  User,
  ShieldCheck,
  ShieldAlert,
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageContainer from '../../components/layout/PageContainer.jsx';
import ProfilePrivacySettingsModal from '../../components/staff/ProfilePrivacySettingsModal.jsx';
import PdfAccessRequestModal from '../../components/staff/PdfAccessRequestModal.jsx';
import StaffAccessHistoryModal from '../../components/staff/StaffAccessHistoryModal.jsx';

export const StaffProfilePage = () => {
  const { id } = useParams();
  const targetId = id || 'me';
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.auth?.user);
  const {
    profileData,
    loading,
    error,
    isDownloadingPdf,
    pdfDownloadError,
  } = useSelector((state) => state.staffProfile);

  const [showSensitive, setShowSensitive] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchStaffProfile(targetId));
  }, [targetId, dispatch]);

  useEffect(() => {
    if (pdfDownloadError) {
      toast.error(pdfDownloadError);
    }
  }, [pdfDownloadError]);

  const handleDownloadClick = () => {
    if (!profileData) return;

    const { pdfAccess, profile, user } = profileData;
    const employeeId = profile?.employeeId || user?.fullName || 'Staff';

    // Check if official PDF download is permitted
    if (pdfAccess?.allowed) {
      dispatch(downloadStaffPdf({ targetId, employeeId }))
        .unwrap()
        .then(() => {
          toast.success('Official Service Record PDF downloaded successfully.');
        })
        .catch((err) => {
          toast.error(err || 'Failed to download official PDF.');
        });
    } else {
      // Consent required - open request modal
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
          <h3 className="text-lg font-bold text-[#102033]">Staff Record Restricted</h3>
          <p className="text-xs text-[#526477]">
            {error || 'The requested profile could not be found or you do not have permission to view it.'}
          </p>
          <Link
            to="/directory"
            className="inline-block text-xs font-bold text-[#006AC7] hover:underline"
          >
            &larr; Return to Staff Directory
          </Link>
        </div>
      </PageContainer>
    );
  }

  const { user, profile, assignments, pdfAccess } = profileData;
  const isOwner = currentUser && (currentUser._id === user?._id || targetId === 'me');
  const canManagePrivacy = isOwner || ['ADMIN', 'SUPER_ADMIN'].includes(currentUser?.role);

  return (
    <PageContainer title="Staff Service Record" subtitle="Official institutional profile dossier">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Navigation & Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link
            to="/directory"
            className="inline-flex items-center gap-1.5 text-xs text-[#526477] hover:text-[#102033] font-bold transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Directory
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Access History Transparency Button */}
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#526477] text-xs font-semibold transition-colors shadow-xs"
            >
              <History className="w-4 h-4 text-[#526477]" />
              Access History
            </button>

            {/* Privacy Settings Modal Button */}
            {canManagePrivacy && (
              <button
                onClick={() => setIsPrivacyModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#102033] text-xs font-semibold transition-colors shadow-xs"
              >
                <Settings className="w-4 h-4 text-[#006AC7]" />
                Privacy &amp; Consent Settings
              </button>
            )}

            {/* Download Official PDF Button */}
            <button
              onClick={handleDownloadClick}
              disabled={isDownloadingPdf}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 ${
                pdfAccess?.allowed
                  ? 'bg-[#006AC7] hover:bg-[#005299]'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {pdfAccess?.allowed ? (
                <Download className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {isDownloadingPdf
                ? 'Generating PDF...'
                : pdfAccess?.allowed
                ? 'Download Official Record (PDF)'
                : 'Request PDF Access Consent'}
            </button>
          </div>
        </div>

        {/* Consent / Access Policy Notice Banner */}
        {!pdfAccess?.allowed && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Individual PDF Consent Protection Active</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                {pdfAccess?.activeRequest?.status === 'PENDING' ? (
                  <>
                    An official access request was dispatched on{' '}
                    <strong>{new Date(pdfAccess.activeRequest.createdAt).toLocaleDateString()}</strong> and is currently{' '}
                    <span className="font-bold underline">PENDING STAFF APPROVAL</span>.
                  </>
                ) : (
                  'Direct PDF download is restricted by staff privacy preference. To export this dossier, click "Request PDF Access Consent" to state your official justification.'
                )}
              </p>
            </div>
          </div>
        )}

        {/* Official Header Banner */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-100 pb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#006AC7] font-bold text-2xl flex-shrink-0">
                {user?.fullName ? user.fullName.charAt(0) : 'S'}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-[#102033] tracking-tight">{user?.fullName}</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-[#4B7F3A] border border-emerald-200 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {user?.status || 'ACTIVE'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#526477] mt-1">
                  <span className="font-bold text-[#102033]">{user?.designation || 'Staff'}</span>
                  <span>&bull;</span>
                  <span className="font-mono font-bold text-[#006AC7]">
                    Personal ID: {profile?.employeeId || 'N/A'}
                  </span>
                  <span>&bull;</span>
                  <span className="text-[#526477]">
                    {user?.school?.name || 'Unassigned School'}{' '}
                    {user?.school?.code && `(${user.school.code})`}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6 text-xs space-y-1">
              <div className="text-[#8094A8] text-[10px] uppercase font-bold tracking-wider">
                CIVIL APPOINTMENT
              </div>
              <div className="text-[#102033] font-bold">
                {profile?.isTeachingStaff ? 'Teaching Faculty' : 'Non-Teaching Support'}
              </div>
              <div className="text-[11px] text-[#526477]">System Role: {user?.role}</div>
            </div>
          </div>

          {/* Sensitive Field Toggle */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-[#8094A8] text-[11px] font-medium">
              Official Government Record &bull; Education Department Liaquatabad Town Centre (DMC)
            </span>
            {profile?.cnic && !profile.cnic.includes('Masked') && (
              <button
                onClick={() => setShowSensitive(!showSensitive)}
                className="inline-flex items-center gap-1.5 text-xs text-[#006AC7] hover:underline font-bold self-start sm:self-auto"
              >
                {showSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showSensitive ? 'Hide Sensitive Fields' : 'Reveal Sensitive Fields'}
              </button>
            )}
          </div>
        </div>

        {/* Section 1: Personal & Employment Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Details */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-[#102033] flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <IdCard className="w-4 h-4 text-[#006AC7]" />
              1. Personal Identification
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#526477] block text-[11px] font-medium">Full Name</span>
                <span className="font-bold text-[#102033]">{user?.fullName}</span>
              </div>
              <div>
                <span className="text-[#526477] block text-[11px] font-medium">Father's Name</span>
                <span className="font-bold text-[#102033]">{profile?.fatherName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[#526477] block text-[11px] font-medium">CNIC (National ID)</span>
                <span className="font-mono font-bold text-[#006AC7]">
                  {profile?.cnic ? (showSensitive ? profile.cnic : profile.cnic) : 'Masked / Restricted'}
                </span>
              </div>
              <div>
                <span className="text-[#526477] block text-[11px] font-medium">Date of Birth</span>
                <span className="font-bold text-[#102033]">
                  {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[#526477] block text-[11px] font-medium">Official Email</span>
                <span className="text-[#102033] font-medium">{user?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[#526477] block text-[11px] font-medium">Contact Phone</span>
                <span className="text-[#102033] font-medium">{user?.phoneNumber || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Employment & Service Details */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-[#102033] flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Briefcase className="w-4 h-4 text-[#006AC7]" />
              2. Employment &amp; Service Details
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#526477] block text-[11px] font-medium">Personal / Employee No</span>
                <span className="font-mono font-bold text-[#102033]">{profile?.employeeId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[#526477] block text-[11px] font-medium">Official Designation</span>
                <span className="font-bold text-[#006AC7]">{user?.designation || 'Staff'}</span>
              </div>
              <div>
                <span className="text-[#526477] block text-[11px] font-medium">Date of Appointment</span>
                <span className="font-bold text-[#102033]">
                  {profile?.appointmentDate
                    ? new Date(profile.appointmentDate).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[#526477] block text-[11px] font-medium">Educational Qualification</span>
                <span className="font-bold text-[#102033]">{profile?.qualification || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[#526477] block text-[11px] font-medium">Institution</span>
                <span className="text-[#102033] font-medium">{user?.school?.name || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-[#526477] block text-[11px] font-medium">Jurisdiction Scope</span>
                <span className="text-[#102033] font-medium">
                  {user?.role} ({user?.baseRole})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Bank / Payroll Disbursement */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-[#102033] flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <CreditCard className="w-4 h-4 text-[#006AC7]" />
            3. Bank &amp; Payroll Disbursement Information
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#526477] block text-[11px] font-medium">Bank Name</span>
              <span className="font-bold text-[#102033]">{profile?.bankName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[#526477] block text-[11px] font-medium">Branch &amp; Code</span>
              <span className="font-bold text-[#102033]">{profile?.branchName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[#526477] block text-[11px] font-medium">Account Title</span>
              <span className="font-bold text-[#102033]">{profile?.accountTitle || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[#526477] block text-[11px] font-medium">Account Number / IBAN</span>
              <span className="font-mono font-bold text-[#006AC7]">
                {profile?.accountNumber
                  ? showSensitive
                    ? profile.accountNumber
                    : profile.accountNumber
                  : 'Masked / Restricted'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Teaching Subject Assignments (Teachers Only) */}
        {profile?.isTeachingStaff && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-[#102033] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#006AC7]" />
                4. Authoritative Teaching Subject Assignments &amp; History
              </h3>
              <span className="text-[11px] text-[#526477] font-medium">
                {assignments?.active?.length || 0} Active &bull; {assignments?.history?.length || 0} Historical
              </span>
            </div>

            <div className="space-y-4">
              {/* Active Assignments */}
              <div>
                <h4 className="text-xs font-bold text-[#526477] uppercase tracking-wider mb-2">
                  Current Active Assignments
                </h4>
                {!assignments?.active || assignments.active.length === 0 ? (
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
                          {assignmentItem.subjectId?.name} [{assignmentItem.subjectId?.code || 'GEN'}]
                        </div>
                        <div className="text-[10px] text-[#526477]">
                          Session:{' '}
                          <span className="font-mono font-bold text-[#102033]">
                            {assignmentItem.academicSession}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8094A8]">
                          Effective from:{' '}
                          {assignmentItem.effectiveFrom
                            ? new Date(assignmentItem.effectiveFrom).toLocaleDateString()
                            : 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Historical Assignments */}
              {assignments?.history && assignments.history.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-[#526477] uppercase tracking-wider mb-2">
                    Historical Teaching Assignments (Archived)
                  </h4>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50 text-xs">
                    {assignments.history.map((ha) => (
                      <div
                        key={ha._id}
                        className="p-3 flex items-center justify-between text-[#526477] text-[11px]"
                      >
                        <div>
                          <span className="font-bold text-[#102033]">
                            {ha.classId?.name} (Sec {ha.sectionId?.name}) &bull; {ha.subjectId?.name}
                          </span>
                          <span className="ml-2 text-[10px] text-[#8094A8]">
                            ({ha.academicSession})
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-[#8094A8]">
                            {ha.effectiveFrom ? new Date(ha.effectiveFrom).toLocaleDateString() : ''} -{' '}
                            {ha.effectiveTo ? new Date(ha.effectiveTo).toLocaleDateString() : 'Ended'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[#526477] text-[10px] font-bold">
                            {ha.status}
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
    </PageContainer>
  );
};

export default StaffProfilePage;
