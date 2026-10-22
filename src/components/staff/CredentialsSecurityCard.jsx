import React, { useState } from 'react';
import {
  Lock,
  Key,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Laptop,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService.js';
import { getErrorMessage } from '../../utils/errorUtils.js';

/**
 * 🔐 CredentialsSecurityCard
 * Zone 5 of the Personal Profile & Service Dossier:
 * - Inline authenticated password update with Argon2id backend enforcement
 * - Session invalidation checkbox (terminateOtherSessions)
 * - Quick access tiles to Active Remote Sessions & Two-Factor Authentication (MFA / TOTP)
 */
export const CredentialsSecurityCard = ({
  isOwner = false,
  onOpenSecurityModal = () => {},
  userRole = 'Staff',
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [terminateOtherSessions, setTerminateOtherSessions] = useState(true);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Password Strength Calculation
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handlePasswordSubmit = async (submitEvent) => {
    submitEvent.preventDefault();
    setValidationError('');

    if (!currentPassword) {
      setValidationError('Please enter your current password.');
      return;
    }

    if (!hasMinLength || !hasUpperCase || !hasNumber) {
      setValidationError('New password must be at least 8 characters with 1 uppercase letter and 1 number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError('New password and confirmation do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setValidationError('New password must be different from your current password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const updateResponse = await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
        terminateOtherSessions,
      });

      if (updateResponse?.success) {
        toast.success(
          updateResponse.message ||
            'Password updated successfully. Other active sessions were revoked.'
        );
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setValidationError('');
      } else {
        toast.error(updateResponse?.message || 'Password update failed.');
      }
    } catch (submitError) {
      const errorMessage = getErrorMessage(submitError, 'Failed to update password.');
      setValidationError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#102033]">
              Credentials &amp; Authentication Governance
            </h3>
            <p className="text-xs text-[#526477]">
              Security credentials and access control parameters
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#526477] flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p>
            Credential modification, active token introspection, and multi-factor authentication (MFA)
            configuration are restricted to the account owner and central municipal administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#006AC7]">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#102033]">
              Credentials &amp; Security Governance
            </h3>
            <p className="text-xs text-[#526477]">
              Manage password, active login sessions, and two-factor authentication (MFA)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#4B7F3A] border border-emerald-200 text-[11px] font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Argon2id Protected
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Inline Password Change Form (7 cols) */}
        <div className="lg:col-span-7 bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#006AC7]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#102033]">
                Change Account Password
              </h4>
            </div>
            <span className="text-[11px] text-[#526477]">Encrypted in transit &amp; rest</span>
          </div>

          {validationError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-3.5 text-xs">
            {/* Current Password */}
            <div>
              <label className="block text-[11px] font-bold text-[#102033] mb-1">
                Current Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(inputEvent) => setCurrentPassword(inputEvent.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 bg-white text-[#102033] placeholder:text-slate-400 focus:outline-none focus:border-[#006AC7] focus:ring-1 focus:ring-[#006AC7] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-[11px] font-bold text-[#102033] mb-1">
                New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(inputEvent) => setNewPassword(inputEvent.target.value)}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  required
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 bg-white text-[#102033] placeholder:text-slate-400 focus:outline-none focus:border-[#006AC7] focus:ring-1 focus:ring-[#006AC7] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Requirement Chips */}
              <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px]">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                    hasMinLength
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  &ge; 8 characters
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                    hasUpperCase
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  1 uppercase
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                    hasNumber
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  1 number
                </span>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[11px] font-bold text-[#102033] mb-1">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(inputEvent) => setConfirmPassword(inputEvent.target.value)}
                  placeholder="Re-type new password"
                  required
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 bg-white text-[#102033] placeholder:text-slate-400 focus:outline-none focus:border-[#006AC7] focus:ring-1 focus:ring-[#006AC7] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <div className="mt-1">
                  {passwordsMatch ? (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Passwords do not match
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Terminate Other Sessions Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={terminateOtherSessions}
                  onChange={(checkboxEvent) =>
                    setTerminateOtherSessions(checkboxEvent.target.checked)
                  }
                  className="mt-0.5 w-4 h-4 rounded text-[#006AC7] border-slate-300 focus:ring-[#006AC7]"
                />
                <span className="text-[11px] text-[#526477]">
                  <strong className="text-[#102033]">Revoke all other active sessions:</strong>{' '}
                  Immediately log out from all other browsers, mobile devices, and office computers.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !hasMinLength || !passwordsMatch}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#006AC7] hover:bg-[#005299] text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Update Password &amp; Protect Account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Quick Security Governance Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Sessions Quick Tile */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-[#006AC7]/30 transition-all space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#102033]">
                    Active Remote Sessions
                  </h4>
                  <p className="text-[11px] text-[#526477]">
                    Multi-device login inspection
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                JWT / Token
              </span>
            </div>

            <p className="text-[11px] text-[#526477]">
              Inspect connected devices, IP locations, user agent strings, and terminate remote sessions immediately.
            </p>

            <button
              type="button"
              onClick={onOpenSecurityModal}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-[#102033] text-xs font-semibold transition-colors"
            >
              <Laptop className="w-3.5 h-3.5 text-[#006AC7]" />
              Manage Active Sessions
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* MFA / TOTP Quick Tile */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-[#006AC7]/30 transition-all space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#4B7F3A]">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#102033]">
                    Two-Factor Authentication
                  </h4>
                  <p className="text-[11px] text-[#526477]">
                    Time-based OTP (TOTP)
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                Recommended
              </span>
            </div>

            <p className="text-[11px] text-[#526477]">
              Protect your administrative profile using Google Authenticator or Microsoft Authenticator with offline recovery codes.
            </p>

            <button
              type="button"
              onClick={onOpenSecurityModal}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-[#102033] text-xs font-semibold transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#4B7F3A]" />
              Configure 2FA / Recovery Codes
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CredentialsSecurityCard;
