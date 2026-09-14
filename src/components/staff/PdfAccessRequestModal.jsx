import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { requestPdfAccess } from '../../store/slices/staffProfileSlice.js';
import {
  FileText,
  ShieldAlert,
  Send,
  X,
  Loader2,
  Clock,
  Briefcase,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const PdfAccessRequestModal = ({
  isOpen,
  onClose,
  targetId,
  targetName,
}) => {
  const dispatch = useDispatch();
  const { isRequestingPdf } = useSelector((state) => state.staffProfile);

  const [purpose, setPurpose] = useState('');
  const [requestedScope, setRequestedScope] = useState('OFFICIAL_SERVICE_RECORD');
  const [expirationHours, setExpirationHours] = useState(48);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!purpose.trim() || purpose.trim().length < 5) {
      toast.error('Please specify a legitimate official purpose (min 5 characters).');
      return;
    }

    try {
      await dispatch(
        requestPdfAccess({
          targetId,
          payload: {
            purpose: purpose.trim(),
            requestedScope,
            expirationHours: Number(expirationHours),
          },
        })
      ).unwrap();

      toast.success(`Access consent request dispatched to ${targetName || 'staff member'}.`);
      onClose();
    } catch (err) {
      toast.error(err || 'Failed to submit official PDF access request.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-50/80 via-white to-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#102033]">Official PDF Access Request</h2>
              <p className="text-xs text-[#526477]">Consent required by staff privacy policy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 leading-relaxed">
            <span className="font-bold block mb-1">Consent Authorization Policy</span>
            <span className="text-[11px] text-amber-800">
              <strong>{targetName || 'This staff member'}</strong> has configured their service record PDF to require individual approval prior to export. An official notification will be dispatched immediately.
            </span>
          </div>

          {/* Official Purpose */}
          <div className="space-y-1.5">
            <label className="font-bold text-[#102033] block">
              Official Purpose &amp; Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., Annual Performance Audit, Promotion Review, Administrative Verification for LTC..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-[#102033] placeholder-slate-400 focus:ring-1 focus:ring-[#006AC7] outline-none"
            />
          </div>

          {/* Scope Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-[#102033] block">Requested Audit Scope</label>
            <select
              value={requestedScope}
              onChange={(e) => setRequestedScope(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-[#102033] bg-white font-medium focus:ring-1 focus:ring-[#006AC7]"
            >
              <option value="OFFICIAL_SERVICE_RECORD">Comprehensive Official Service Record</option>
              <option value="QUALIFICATION_AUDIT">Academic Qualifications &amp; Subject Specialization</option>
              <option value="PAYROLL_VERIFICATION">Employment &amp; Payroll Verification</option>
            </select>
          </div>

          {/* Expiration Hours */}
          <div className="space-y-1.5">
            <label className="font-bold text-[#102033] block">Requested Window Duration</label>
            <select
              value={expirationHours}
              onChange={(e) => setExpirationHours(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-[#102033] bg-white font-medium focus:ring-1 focus:ring-[#006AC7]"
            >
              <option value={24}>24 Hours from approval</option>
              <option value={48}>48 Hours from approval</option>
              <option value={72}>72 Hours (3 Days)</option>
              <option value={168}>7 Days</option>
            </select>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-[#526477] font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRequestingPdf}
              className="px-5 py-2 rounded-xl bg-[#006AC7] hover:bg-[#005299] text-white font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isRequestingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Dispatching Request...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Submit Official Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PdfAccessRequestModal;
