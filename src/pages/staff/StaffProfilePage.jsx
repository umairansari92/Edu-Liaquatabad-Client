import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import apiClient from '../../services/apiClient.js';

export const StaffProfilePage = () => {
  const { id } = useParams();
  const targetId = id || 'me';
  const currentUser = useSelector((state) => state.auth?.user);

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/staff/${targetId}/profile`);
        if (res.data?.success && res.data?.data) {
          setProfileData(res.data.data);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to retrieve staff profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [targetId]);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const response = await apiClient.get(`/staff/${targetId}/pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const empId = profileData?.profile?.employeeId || 'Staff';
      link.setAttribute('download', `ServiceRecord_${empId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Official Service Record PDF downloaded successfully.');
    } catch (err) {
      toast.error('Failed to generate official PDF record.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Clock className="w-8 h-8 animate-spin mx-auto mb-3 text-teal-400" />
        <p className="text-xs">Loading official service record dossier...</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
          <IdCard className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white">Staff Record Not Available</h3>
        <p className="text-xs text-slate-400">
          The requested profile could not be found or you do not have authorization to view it.
        </p>
        <Link to="/directory" className="inline-block text-xs text-teal-400 hover:text-teal-300 font-semibold">
          &larr; Back to Directory
        </Link>
      </div>
    );
  }

  const { user, profile, assignments } = profileData;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Back link & Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          to="/directory"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Directory
        </Link>

        {/* Download Official PDF Button */}
        <button
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-900/40 disabled:opacity-50 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          {downloadingPdf ? 'Generating PDF...' : 'Download Official Service Record (PDF)'}
        </button>
      </div>

      {/* Official Government Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-800 pb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-600/20 border border-teal-500/30 flex items-center justify-center text-teal-300 font-display font-bold text-2xl flex-shrink-0">
              {user.fullName ? user.fullName.charAt(0) : 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-display font-bold text-white tracking-tight">{user.fullName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {user.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                <span className="font-semibold text-slate-300">{user.designation || 'Staff'}</span>
                <span>&bull;</span>
                <span className="font-mono text-teal-400">Personal ID: {profile?.employeeId || 'N/A'}</span>
                <span>&bull;</span>
                <span className="text-slate-300">
                  {user.school?.name || 'Unassigned School'} {user.school?.code && `(${user.school.code})`}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6 text-xs space-y-1">
            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">CIVIL APPOINTMENT</div>
            <div className="text-white font-semibold">
              {profile?.isTeachingStaff ? 'Teaching Faculty' : 'Non-Teaching Support'}
            </div>
            <div className="text-[11px] text-slate-400">System Role: {user.role}</div>
          </div>
        </div>

        {/* Sensitive Field Toggle */}
        <div className="pt-4 flex justify-between items-center text-xs">
          <span className="text-slate-400 text-[11px]">
            Official Government Record &bull; Education Department Liaquatabad Town Centre (DMC)
          </span>
          {profile?.cnic && (
            <button
              onClick={() => setShowSensitive(!showSensitive)}
              className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-medium"
            >
              {showSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showSensitive ? 'Hide Sensitive Fields' : 'Reveal Sensitive Fields'}
            </button>
          )}
        </div>
      </div>

      {/* Grid: 1. Personal & Employment Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
            <IdCard className="w-4 h-4 text-teal-400" />
            1. Personal Identification
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Full Name</span>
              <span className="font-semibold text-white">{user.fullName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Father's Name</span>
              <span className="font-semibold text-white">{profile?.fatherName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">CNIC (National ID)</span>
              <span className="font-mono font-semibold text-teal-300">
                {showSensitive ? profile?.cnic : profile?.cnic}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Date of Birth</span>
              <span className="font-semibold text-white">
                {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Official Email</span>
              <span className="text-slate-300">{user.email}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Contact Phone</span>
              <span className="text-slate-300">{user.phoneNumber || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Employment & Service Records */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
            <Briefcase className="w-4 h-4 text-teal-400" />
            2. Employment &amp; Service Details
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Personal / Employee No</span>
              <span className="font-mono font-bold text-white">{profile?.employeeId || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Official Designation</span>
              <span className="font-semibold text-teal-300">{user.designation || 'Staff'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Date of Appointment</span>
              <span className="font-semibold text-white">
                {profile?.appointmentDate ? new Date(profile.appointmentDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Educational Qualification</span>
              <span className="font-semibold text-white">{profile?.qualification || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Institution</span>
              <span className="text-slate-300">{user.school?.name || 'Unassigned'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Jurisdiction Scope</span>
              <span className="text-slate-300">{user.role} ({user.baseRole})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 2. Bank / Payroll Disbursement */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
          <CreditCard className="w-4 h-4 text-teal-400" />
          3. Bank &amp; Payroll Disbursement Information
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Bank Name</span>
            <span className="font-semibold text-white">{profile?.bankName || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Branch &amp; Code</span>
            <span className="font-semibold text-white">{profile?.branchName || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Account Title</span>
            <span className="font-semibold text-white">{profile?.accountTitle || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Account Number / IBAN</span>
            <span className="font-mono font-semibold text-teal-300">
              {showSensitive ? profile?.accountNumber : profile?.accountNumber}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Teaching Assignments History (Teachers Only) */}
      {profile?.isTeachingStaff && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-400" />
              4. Authoritative Teaching Subject Assignments &amp; History
            </h3>
            <span className="text-[11px] text-slate-400">
              {assignments?.active?.length || 0} Active &bull; {assignments?.history?.length || 0} Historical
            </span>
          </div>

          <div className="space-y-4">
            {/* Active Assignments */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Current Active Assignments</h4>
              {(!assignments?.active || assignments.active.length === 0) ? (
                <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-950 border border-slate-800">
                  No active subject assignments assigned to this teacher currently.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {assignments.active.map((a) => (
                    <div
                      key={a._id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs hover:border-teal-500/30 transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">
                          {a.classId?.name} (Sec {a.sectionId?.name})
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 text-[10px] font-bold">
                          ACTIVE
                        </span>
                      </div>
                      <div className="text-teal-300 font-semibold">
                        {a.subjectId?.name} [{a.subjectId?.code || 'GEN'}]
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Session: <span className="font-mono text-slate-300">{a.academicSession}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Effective from: {a.effectiveFrom ? new Date(a.effectiveFrom).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historical Assignments (Immutable Archive) */}
            {assignments?.history && assignments.history.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Historical Teaching Assignments (Archived)
                </h4>
                <div className="divide-y divide-slate-800/60 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 text-xs">
                  {assignments.history.map((ha) => (
                    <div key={ha._id} className="p-3 flex items-center justify-between text-slate-400 text-[11px]">
                      <div>
                        <span className="font-semibold text-slate-200">
                          {ha.classId?.name} (Sec {ha.sectionId?.name}) &bull; {ha.subjectId?.name}
                        </span>
                        <span className="ml-2 text-[10px] text-slate-500">({ha.academicSession})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px]">
                          {ha.effectiveFrom ? new Date(ha.effectiveFrom).toLocaleDateString() : ''} -{' '}
                          {ha.effectiveTo ? new Date(ha.effectiveTo).toLocaleDateString() : 'Ended'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
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
  );
};

export default StaffProfilePage;
