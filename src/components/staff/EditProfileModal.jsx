import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateStaffProfile } from '../../store/slices/staffProfileSlice.js';
import {
  UserCheck,
  Building2,
  CreditCard,
  Lock,
  Phone,
  Home,
  GraduationCap,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorUtils.js';

export const EditProfileModal = ({
  isOpen,
  onClose,
  targetId = 'me',
  userData = {},
  profileData = {},
}) => {
  const dispatch = useDispatch();
  const { isUpdatingProfile } = useSelector((state) => state.staffProfile);

  // Form State for self-managed fields
  const [formData, setFormData] = useState({
    phoneNumber: userData.phoneNumber || '',
    fatherName: profileData.fatherName || '',
    residentialAddress: profileData.residentialAddress || '',
    qualification: profileData.qualification || '',
    bankName: profileData.bankName === 'Provided' ? '' : profileData.bankName || '',
    branchName: profileData.branchName === '****' ? '' : profileData.branchName || '',
    accountTitle: profileData.accountTitle === '****' ? '' : profileData.accountTitle || '',
    accountNumber: profileData.accountNumber?.includes('****') ? '' : profileData.accountNumber || '',
  });

  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'banking' | 'official'

  if (!isOpen) return null;

  const handleInputChange = (changeEvent) => {
    const { name, value } = changeEvent.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (submitEvent) => {
    submitEvent.preventDefault();

    // Basic client validations
    if (formData.phoneNumber && !/^[0-9+\s-]{7,20}$/.test(formData.phoneNumber.trim())) {
      toast.error('Please provide a valid contact phone number format.');
      return;
    }

    const payload = {};
    if (formData.phoneNumber !== undefined) payload.phoneNumber = formData.phoneNumber.trim();
    if (formData.fatherName !== undefined) payload.fatherName = formData.fatherName.trim();
    if (formData.residentialAddress !== undefined) payload.residentialAddress = formData.residentialAddress.trim();
    if (formData.qualification !== undefined) payload.qualification = formData.qualification.trim();
    if (formData.bankName !== undefined && formData.bankName.trim()) payload.bankName = formData.bankName.trim();
    if (formData.branchName !== undefined && formData.branchName.trim()) payload.branchName = formData.branchName.trim();
    if (formData.accountTitle !== undefined && formData.accountTitle.trim()) payload.accountTitle = formData.accountTitle.trim();
    if (formData.accountNumber !== undefined && formData.accountNumber.trim()) payload.accountNumber = formData.accountNumber.trim();

    try {
      await dispatch(
        updateStaffProfile({
          targetId,
          profilePayload: payload,
        })
      ).unwrap();

      toast.success('Personal profile details updated successfully.');
      onClose();
    } catch (updateError) {
      toast.error(getErrorMessage(updateError, 'Failed to update personal profile details.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-50/80 via-white to-slate-50 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#006AC7]/10 flex items-center justify-center text-[#006AC7]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#102033]">Edit Personal Profile</h2>
              <p className="text-xs text-[#526477]">Manage self-maintained contact &amp; personal information</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUpdatingProfile}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'personal'
                ? 'border-[#006AC7] text-[#006AC7]'
                : 'border-transparent text-[#526477] hover:text-[#102033]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Personal &amp; Contact
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('banking')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'banking'
                ? 'border-[#006AC7] text-[#006AC7]'
                : 'border-transparent text-[#526477] hover:text-[#102033]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Bank &amp; Payroll
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('official')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'official'
                ? 'border-[#006AC7] text-[#006AC7]'
                : 'border-transparent text-[#526477] hover:text-[#102033]'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            Authoritative Records
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: Personal & Contact */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#102033] mb-1.5">
                    Full Name (Official)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={userData.fullName || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs font-medium cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Verified national identity record
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102033] mb-1.5">
                    Father's / Guardian Name
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleInputChange}
                    placeholder="e.g. Muhammad Iqbal"
                    maxLength={100}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#006AC7] focus:ring-1 focus:ring-[#006AC7] outline-none text-xs font-semibold text-[#102033]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#102033] mb-1.5">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. 03138521722"
                      maxLength={20}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#006AC7] focus:ring-1 focus:ring-[#006AC7] outline-none text-xs font-semibold text-[#102033]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102033] mb-1.5">
                    Highest Educational Qualification
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleInputChange}
                      placeholder="e.g. M.Ed / B.Sc / M.Phil"
                      maxLength={100}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#006AC7] focus:ring-1 focus:ring-[#006AC7] outline-none text-xs font-semibold text-[#102033]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102033] mb-1.5">
                  Residential Address
                </label>
                <div className="relative">
                  <Home className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <textarea
                    rows={2}
                    name="residentialAddress"
                    value={formData.residentialAddress}
                    onChange={handleInputChange}
                    placeholder="Enter permanent or current residential address"
                    maxLength={300}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#006AC7] focus:ring-1 focus:ring-[#006AC7] outline-none text-xs font-semibold text-[#102033]"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Confidential field governed by your privacy preference (Protected from public disclosure).
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: Bank & Payroll */}
          {activeTab === 'banking' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/60 flex items-start gap-2.5 text-xs text-[#006AC7]">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Salary disbursement account records. For compliance and security, sensitive bank numbers are always masked for non-authorized viewers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#102033] mb-1.5">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder="e.g. National Bank of Pakistan (NBP)"
                    maxLength={100}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#006AC7] focus:ring-1 focus:ring-[#006AC7] outline-none text-xs font-semibold text-[#102033]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102033] mb-1.5">
                    Branch Name &amp; Branch Code
                  </label>
                  <input
                    type="text"
                    name="branchName"
                    value={formData.branchName}
                    onChange={handleInputChange}
                    placeholder="e.g. Liaquatabad Branch (0142)"
                    maxLength={100}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#006AC7] focus:ring-1 focus:ring-[#006AC7] outline-none text-xs font-semibold text-[#102033]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#102033] mb-1.5">
                    Account Title
                  </label>
                  <input
                    type="text"
                    name="accountTitle"
                    value={formData.accountTitle}
                    onChange={handleInputChange}
                    placeholder="e.g. Umair Ahmed"
                    maxLength={100}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#006AC7] focus:ring-1 focus:ring-[#006AC7] outline-none text-xs font-semibold text-[#102033]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102033] mb-1.5">
                    Account Number / IBAN
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. PK36NBPA00012345678901"
                    maxLength={50}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#006AC7] focus:ring-1 focus:ring-[#006AC7] outline-none text-xs font-semibold text-[#102033]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Authoritative Records (Read-Only Policy Badges) */}
          {activeTab === 'official' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  These authoritative fields are legally controlled civil service attributes. They cannot be updated via personal profile forms. Changes require Gazetted notification, official transfer orders, or administrative verification.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">
                    National Identity (CNIC / B-Form)
                  </span>
                  <span className="font-mono font-bold text-[#102033] text-xs">
                    {profileData.cnic || 'Restricted'}
                  </span>
                  <span className="text-[10px] text-amber-700 block font-medium">
                    Verified NADRA Identity &bull; Read-only
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">
                    Civil Service Personal ID
                  </span>
                  <span className="font-mono font-bold text-[#006AC7] text-xs">
                    {profileData.employeeId || 'ID-PENDING'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Government Personal Number &bull; DDO Record
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">
                    Official Designation
                  </span>
                  <span className="font-bold text-[#102033] text-xs">
                    {userData.designation || 'Staff'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Appointed Cadre / BPS Scale &bull; Read-only
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">
                    Assigned Institution
                  </span>
                  <span className="font-bold text-[#102033] text-xs truncate block">
                    {userData.school?.name || 'Education Department LTC'}
                  </span>
                  <span className="text-[10px] text-blue-700 block font-medium">
                    Managed through Transfer Directive Workflows
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-shrink-0">
            <span className="text-[10px] text-[#526477]">
              All edits are logged in the municipal audit register.
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isUpdatingProfile}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-[#526477] hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#006AC7] hover:bg-[#005299] text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {isUpdatingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Save Profile Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
