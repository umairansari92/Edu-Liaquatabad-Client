import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Search,
  School,
  IdCard,
  CreditCard,
  BookOpen,
  Calendar,
  Eye,
  Clock,
  Check,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient.js';
import PageContainer from '../../components/layout/PageContainer.jsx';

export const PendingApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState('staff');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [applicantDetail, setApplicantDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Decision Modal State
  const [decisionModal, setDecisionModal] = useState({
    isOpen: false,
    decision: null, // 'APPROVE' | 'REQUEST_CORRECTION' | 'REJECT'
    reason: '',
    submitting: false,
  });

  const fetchPendingList = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/approvals/pending?type=${activeTab}`);
      if (res.data?.success && res.data?.data?.items) {
        setItems(res.data.data.items);
      } else {
        setItems([]);
      }
    } catch (pendingListError) {
      toast.error('Failed to load pending approvals list.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingList();
  }, [activeTab]);

  const handleInspect = async (item) => {
    setSelectedApplicant(item);
    setDetailLoading(true);
    try {
      const res = await apiClient.get(`/approvals/${item.userId}/detail`);
      if (res.data?.success && res.data?.data) {
        setApplicantDetail(res.data.data);
      }
    } catch (detailInspectionError) {
      toast.error('Failed to fetch detailed profile inspection.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExecuteDecision = async () => {
    if (!selectedApplicant || !decisionModal.decision) return;

    if (
      ['REQUEST_CORRECTION', 'REJECT'].includes(decisionModal.decision) &&
      (!decisionModal.reason || decisionModal.reason.trim().length < 5)
    ) {
      toast.error('Please provide mandatory remarks (minimum 5 characters).');
      return;
    }

    setDecisionModal((prev) => ({ ...prev, submitting: true }));
    try {
      const res = await apiClient.post(`/approvals/${selectedApplicant.userId}/decision`, {
        decision: decisionModal.decision,
        reason: decisionModal.reason.trim(),
      });

      if (res.data?.success) {
        toast.success(
          decisionModal.decision === 'APPROVE'
            ? 'Applicant approved and activated successfully!'
            : decisionModal.decision === 'REQUEST_CORRECTION'
            ? 'Correction request sent to applicant.'
            : 'Registration rejected and archived.'
        );
        setDecisionModal({ isOpen: false, decision: null, reason: '', submitting: false });
        setSelectedApplicant(null);
        setApplicantDetail(null);
        fetchPendingList();
      }
    } catch (decisionError) {
      toast.error(decisionError.response?.data?.message || 'Failed to process decision.');
      setDecisionModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const filteredItems = items.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.fullName?.toLowerCase().includes(query) ||
      item.email?.toLowerCase().includes(query) ||
      item.employeeId?.toLowerCase().includes(query) ||
      item.claimedSchool?.name?.toLowerCase().includes(query) ||
      item.designation?.toLowerCase().includes(query)
    );
  });

  return (
    <PageContainer title="Institutional Approvals Queue" subtitle="Official verification workstation for incoming faculty, staff, and student applications">
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-teal-400" />
            Institutional Approvals Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official verification workstation for incoming faculty, staff, and student applications
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start">
          <button
            onClick={() => {
              setActiveTab('staff');
              setSelectedApplicant(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'staff'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Faculty &amp; Staff
          </button>
          <button
            onClick={() => {
              setActiveTab('student');
              setSelectedApplicant(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'student'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <School className="w-4 h-4" />
            Students
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-3 rounded-xl border border-slate-800">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(inputChangeEvent) => setSearchQuery(inputChangeEvent.target.value)}
          placeholder="Search by applicant name, employee ID, designation, or institution..."
          className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-200">
            Clear
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Applicant</th>
                <th className="py-3.5 px-4 font-semibold">Employee ID / Identity</th>
                <th className="py-3.5 px-4 font-semibold">Designation</th>
                <th className="py-3.5 px-4 font-semibold">Institution Claim</th>
                <th className="py-3.5 px-4 font-semibold">Masked CNIC</th>
                <th className="py-3.5 px-4 font-semibold">Submitted</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-400" />
                    Loading pending applications...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No applications currently awaiting verification in this queue.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.userId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white">
                      <div>{item.fullName}</div>
                      <div className="text-[10px] text-slate-400">{item.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-teal-400">
                      {item.employeeId || item.grNumber || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-semibold">
                        {item.designation || 'Staff'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {item.claimedSchool ? item.claimedSchool.name : 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {item.cnicMasked || '*****-*******-*'}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-400">
                      {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleInspect(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect &amp; Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Inspection Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                  Official Record Verification Dossier
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">{selectedApplicant.fullName}</h3>
                <p className="text-xs text-slate-400">
                  {selectedApplicant.designation} &bull; Claimed School:{' '}
                  <span className="text-slate-200 font-medium">
                    {selectedApplicant.claimedSchool?.name || 'Unassigned'}
                  </span>
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedApplicant(null);
                  setApplicantDetail(null);
                }}
                className="text-slate-400 hover:text-white text-sm p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                &times; Close
              </button>
            </div>

            {detailLoading ? (
              <div className="py-12 text-center text-slate-400">
                <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-400" />
                Retrieving full profile inspection...
              </div>
            ) : applicantDetail ? (
              <div className="space-y-6 text-xs">
                {/* 1. Identification & Civil Appointment */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="font-bold text-slate-200 flex items-center gap-2 text-xs">
                    <IdCard className="w-4 h-4 text-teal-400" />
                    Identification &amp; Civil Service Appointment
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Father's Name:</span>
                      <span className="font-semibold text-white">{applicantDetail.profile?.fatherName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">CNIC (Verified View):</span>
                      <span className="font-mono font-semibold text-teal-300">
                        {applicantDetail.profile?.cnic || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Date of Birth:</span>
                      <span className="font-semibold text-white">
                        {applicantDetail.profile?.dateOfBirth
                          ? new Date(applicantDetail.profile.dateOfBirth).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Employee Number:</span>
                      <span className="font-mono font-bold text-white">
                        {applicantDetail.profile?.employeeId || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Appointment Date:</span>
                      <span className="font-semibold text-white">
                        {applicantDetail.profile?.appointmentDate
                          ? new Date(applicantDetail.profile.appointmentDate).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Highest Qualification:</span>
                      <span className="font-semibold text-white">
                        {applicantDetail.profile?.qualification || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Contact Phone:</span>
                      <span className="font-semibold text-white">
                        {applicantDetail.user?.phoneNumber || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Staff Classification:</span>
                      <span className="font-semibold text-white">
                        {applicantDetail.profile?.isTeachingStaff ? 'Teaching Faculty' : 'Non-Teaching Support'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Bank & Payroll */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="font-bold text-slate-200 flex items-center gap-2 text-xs">
                    <CreditCard className="w-4 h-4 text-teal-400" />
                    Bank &amp; Payroll Disbursement
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Bank Name:</span>
                      <span className="font-semibold text-white">{applicantDetail.profile?.bankName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Branch &amp; Code:</span>
                      <span className="font-semibold text-white">{applicantDetail.profile?.branchName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Account Title:</span>
                      <span className="font-semibold text-white">{applicantDetail.profile?.accountTitle || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Account Number / IBAN:</span>
                      <span className="font-mono font-semibold text-teal-300">
                        {applicantDetail.profile?.accountNumber || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Proposed Teaching Assignments */}
                {applicantDetail.profile?.isTeachingStaff && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="font-bold text-slate-200 flex items-center gap-2 text-xs">
                      <BookOpen className="w-4 h-4 text-teal-400" />
                      Declared Teaching Subject Assignments
                    </h4>
                    {(!applicantDetail.proposedAssignments || applicantDetail.proposedAssignments.length === 0) ? (
                      <p className="text-[11px] text-slate-500">No initial teaching assignments declared.</p>
                    ) : (
                      <div className="divide-y divide-slate-800/60 border border-slate-800 rounded-lg overflow-hidden">
                        {applicantDetail.proposedAssignments.map((pa) => (
                          <div key={pa._id} className="p-2.5 flex items-center justify-between text-[11px]">
                            <div>
                              <span className="font-bold text-white">
                                {pa.classId?.name} (Section {pa.sectionId?.name})
                              </span>
                              <span className="mx-2 text-slate-600">&bull;</span>
                              <span className="text-teal-300 font-medium">
                                {pa.subjectId?.name} [{pa.subjectId?.code || 'GEN'}]
                              </span>
                            </div>
                            <span className="font-mono text-slate-400">Session {pa.academicSession}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons Strip */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={() =>
                      setDecisionModal({
                        isOpen: true,
                        decision: 'REQUEST_CORRECTION',
                        reason: '',
                        submitting: false,
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Request Correction
                  </button>

                  <button
                    onClick={() =>
                      setDecisionModal({
                        isOpen: true,
                        decision: 'REJECT',
                        reason: '',
                        submitting: false,
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject Registration
                  </button>

                  <button
                    onClick={() =>
                      setDecisionModal({
                        isOpen: true,
                        decision: 'APPROVE',
                        reason: 'Verified and approved by institutional authority.',
                        submitting: false,
                      })
                    }
                    className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-900/40 flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve &amp; Activate Account
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Decision Execution Confirmation Modal */}
      {decisionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {decisionModal.decision === 'APPROVE' && <CheckCircle className="w-5 h-5 text-teal-400" />}
              {decisionModal.decision === 'REQUEST_CORRECTION' && (
                <RotateCcw className="w-5 h-5 text-amber-400" />
              )}
              {decisionModal.decision === 'REJECT' && <XCircle className="w-5 h-5 text-rose-400" />}
              Confirm Action: {decisionModal.decision}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              {decisionModal.decision === 'APPROVE'
                ? `You are confirming the institutional credentials of ${selectedApplicant?.fullName}. The account will become ACTIVE and granted login access.`
                : decisionModal.decision === 'REQUEST_CORRECTION'
                ? `Specify the corrections required from ${selectedApplicant?.fullName}. The applicant will receive a notification to resubmit.`
                : `You are rejecting the application of ${selectedApplicant?.fullName}. An immutable audit log will be created.`}
            </p>

            {['REQUEST_CORRECTION', 'REJECT'].includes(decisionModal.decision) && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mandatory Justification / Remarks *
                </label>
                <textarea
                  rows={3}
                  value={decisionModal.reason}
                  onChange={(textareaChangeEvent) =>
                    setDecisionModal((prev) => ({ ...prev, reason: textareaChangeEvent.target.value }))
                  }
                  placeholder="Enter specific discrepancy or reason (minimum 5 characters)..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  setDecisionModal({ isOpen: false, decision: null, reason: '', submitting: false })
                }
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={decisionModal.submitting}
                onClick={handleExecuteDecision}
                className={`py-2 px-5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50 ${
                  decisionModal.decision === 'APPROVE'
                    ? 'bg-teal-600 hover:bg-teal-500 shadow-teal-900/40 shadow-lg'
                    : decisionModal.decision === 'REQUEST_CORRECTION'
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40 shadow-lg'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40 shadow-lg'
                }`}
              >
                {decisionModal.submitting ? 'Processing...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PageContainer>
  );
};

export default PendingApprovalsPage;
