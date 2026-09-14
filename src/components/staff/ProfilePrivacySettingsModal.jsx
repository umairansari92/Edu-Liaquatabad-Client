import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateStaffPrivacySettings } from '../../store/slices/staffProfileSlice.js';
import {
  Shield,
  Lock,
  Eye,
  Building,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ProfilePrivacySettingsModal = ({
  isOpen,
  onClose,
  targetId,
  initialSettings,
}) => {
  const dispatch = useDispatch();
  const { isUpdatingPrivacy } = useSelector((state) => state.staffProfile);

  const [allowAuthorizedPdfDownload, setAllowAuthorizedPdfDownload] = useState(
    initialSettings?.allowAuthorizedPdfDownload ?? false
  );

  const [fieldVisibility, setFieldVisibility] = useState({
    profilePhoto: initialSettings?.fieldVisibility?.profilePhoto || 'PUBLIC',
    designation: initialSettings?.fieldVisibility?.designation || 'PUBLIC',
    qualification: initialSettings?.fieldVisibility?.qualification || 'PUBLIC',
    phoneNumber: initialSettings?.fieldVisibility?.phoneNumber || 'SCHOOL',
    email: initialSettings?.fieldVisibility?.email || 'SCHOOL',
    cnic: initialSettings?.fieldVisibility?.cnic || 'AUTHORIZED_ROLE',
    bankDetails: initialSettings?.fieldVisibility?.bankDetails || 'AUTHORIZED_ROLE',
    residentialAddress: initialSettings?.fieldVisibility?.residentialAddress || 'PRIVATE',
  });

  if (!isOpen) return null;

  const handleFieldChange = (field, value) => {
    // Client-side guard on security ceilings
    if ((field === 'cnic' || field === 'bankDetails') && (value === 'PUBLIC' || value === 'SCHOOL')) {
      toast.error('CNIC and Bank Details cannot be set to Public or School visibility per DMC Security Policy.');
      return;
    }
    setFieldVisibility((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        updateStaffPrivacySettings({
          targetId,
          privacySettings: {
            allowAuthorizedPdfDownload,
            fieldVisibility,
          },
        })
      ).unwrap();

      toast.success('Privacy & consent settings updated successfully.');
      onClose();
    } catch (error) {
      toast.error(error || 'Failed to update privacy settings.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-50/80 via-white to-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#006AC7]/10 flex items-center justify-center text-[#006AC7]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#102033]">Staff Privacy &amp; Consent Center</h2>
              <p className="text-xs text-[#526477]">Manage visibility of your service dossier and PDF download permissions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Section 1: PDF Download Consent Toggle */}
          <div className="p-4 rounded-2xl bg-[#F0F8FF] border border-[#B9DEFF] space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="allowAuthorizedPdfDownload"
                checked={allowAuthorizedPdfDownload}
                onChange={(e) => setAllowAuthorizedPdfDownload(e.target.checked)}
                className="mt-1 w-4 h-4 text-[#006AC7] rounded border-slate-300 focus:ring-[#006AC7]"
              />
              <label htmlFor="allowAuthorizedPdfDownload" className="cursor-pointer">
                <span className="font-bold text-[#102033] block text-sm">
                  Allow Direct Official PDF Download by Authorized Leadership
                </span>
                <span className="text-[#526477] text-xs leading-relaxed block mt-0.5">
                  When enabled, your Headmaster and Town Officers can download your official Service Record PDF directly for administrative reviews.
                  When disabled, they must submit a formal consent request and obtain your approval first.
                </span>
              </label>
            </div>
          </div>

          {/* Section 2: Field Visibility Matrix */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-[#102033] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#006AC7]" />
                Field-Level Visibility Matrix
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Policy-enforced ceilings apply</span>
            </div>

            <div className="space-y-3">
              {/* Profile Photo */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="font-bold text-[#102033] block">Profile Photograph</span>
                  <span className="text-[11px] text-slate-500">Avatar displayed across directory and cards</span>
                </div>
                <select
                  value={fieldVisibility.profilePhoto}
                  onChange={(e) => handleFieldChange('profilePhoto', e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-[#102033] focus:ring-1 focus:ring-[#006AC7]"
                >
                  <option value="PUBLIC">Public (Everyone)</option>
                  <option value="SCHOOL">School Members</option>
                  <option value="PRIVATE">Private (Only Me)</option>
                </select>
              </div>

              {/* Designation */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="font-bold text-[#102033] block">Official Designation</span>
                  <span className="text-[11px] text-slate-500">Teaching rank or support staff title</span>
                </div>
                <select
                  value={fieldVisibility.designation}
                  onChange={(e) => handleFieldChange('designation', e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-[#102033] focus:ring-1 focus:ring-[#006AC7]"
                >
                  <option value="PUBLIC">Public (Everyone)</option>
                  <option value="SCHOOL">School Members</option>
                  <option value="PRIVATE">Private (Only Me)</option>
                </select>
              </div>

              {/* Qualification */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="font-bold text-[#102033] block">Educational Qualifications</span>
                  <span className="text-[11px] text-slate-500">Degrees, certifications, and institutions</span>
                </div>
                <select
                  value={fieldVisibility.qualification}
                  onChange={(e) => handleFieldChange('qualification', e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-[#102033] focus:ring-1 focus:ring-[#006AC7]"
                >
                  <option value="PUBLIC">Public (Everyone)</option>
                  <option value="SCHOOL">School Members</option>
                  <option value="AUTHORIZED_ROLE">Authorized Officials Only</option>
                  <option value="PRIVATE">Private (Only Me)</option>
                </select>
              </div>

              {/* Phone Number */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="font-bold text-[#102033] block">Mobile Phone Number</span>
                  <span className="text-[11px] text-slate-500">Restricted from Public directory</span>
                </div>
                <select
                  value={fieldVisibility.phoneNumber}
                  onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-[#102033] focus:ring-1 focus:ring-[#006AC7]"
                >
                  <option value="SCHOOL">School Members</option>
                  <option value="AUTHORIZED_ROLE">Authorized Leadership Only</option>
                  <option value="PRIVATE">Private (Only Me)</option>
                </select>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="font-bold text-[#102033] block">Official Email Address</span>
                  <span className="text-[11px] text-slate-500">Contact address for communications</span>
                </div>
                <select
                  value={fieldVisibility.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-[#102033] focus:ring-1 focus:ring-[#006AC7]"
                >
                  <option value="SCHOOL">School Members</option>
                  <option value="AUTHORIZED_ROLE">Authorized Leadership Only</option>
                  <option value="PRIVATE">Private (Only Me)</option>
                </select>
              </div>

              {/* CNIC (Strict Security Ceiling) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 border border-rose-200">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-rose-900 block">CNIC / National ID</span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[9px] font-bold">
                      PROTECTED PII
                    </span>
                  </div>
                  <span className="text-[11px] text-rose-700/80">
                    High Security: Public &amp; School access disabled by institutional policy
                  </span>
                </div>
                <select
                  value={fieldVisibility.cnic}
                  onChange={(e) => handleFieldChange('cnic', e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-rose-300 bg-white font-bold text-rose-900 focus:ring-1 focus:ring-rose-500"
                >
                  <option value="AUTHORIZED_ROLE">Authorized Leadership Only (HM / DDO)</option>
                  <option value="PRIVATE">Strictly Private (Only Me)</option>
                </select>
              </div>

              {/* Bank Account Details (Strict Security Ceiling) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 border border-amber-200">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-amber-900 block">Bank Account &amp; Payroll Info</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                      FINANCIAL PII
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-800/80">
                    High Security: Public &amp; School access disabled by institutional policy
                  </span>
                </div>
                <select
                  value={fieldVisibility.bankDetails}
                  onChange={(e) => handleFieldChange('bankDetails', e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white font-bold text-amber-900 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="AUTHORIZED_ROLE">Authorized Leadership Only (DDO / Accounts)</option>
                  <option value="PRIVATE">Strictly Private (Only Me)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-[#526477] font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingPrivacy}
              className="px-5 py-2 rounded-xl bg-[#006AC7] hover:bg-[#005299] text-white font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isUpdatingPrivacy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Settings...
                </>
              ) : (
                'Save Privacy Preferences'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePrivacySettingsModal;
