import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Laptop,
  Globe,
  Trash2,
  RefreshCw,
  X,
  Lock,
  Key,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService.js';

export const SecuritySettingsModal = ({ isOpen, onClose }) => {
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'mfa'
  const [loading, setLoading] = useState(false);

  // Sessions State
  const [sessions, setSessions] = useState([]);
  const [terminatingSessionId, setTerminatingSessionId] = useState(null);

  // MFA Status State
  const [mfaStatus, setMfaStatus] = useState(null); // { mfaEnabled, requiresMfa, recoveryCodesRemaining }
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);
  const [setupStep, setSetupStep] = useState(1); // 1: Password Prompt, 2: Secret & TOTP, 3: Recovery Codes
  const [stepUpPassword, setStepUpPassword] = useState('');
  const [pendingSecret, setPendingSecret] = useState(null);
  const [confirmTotpCode, setConfirmTotpCode] = useState('');
  const [freshRecoveryCodes, setFreshRecoveryCodes] = useState(null);
  const [hasCopiedSecret, setHasCopiedSecret] = useState(false);
  const [hasCopiedRecovery, setHasCopiedRecovery] = useState(false);
  const [actionError, setActionError] = useState('');

  // Fetch Session Records
  const loadSessions = useCallback(async () => {
    try {
      const res = await authService.getActiveSessions();
      if (res.success && res.data) {
        setSessions(res.data.sessions || []);
      }
    } catch (err) {
      console.error('Failed to load active sessions:', err);
    }
  }, []);

  // Fetch MFA Status
  const loadMfaStatus = useCallback(async () => {
    try {
      const res = await authService.getMfaStatus();
      if (res.success && res.data) {
        setMfaStatus(res.data);
      }
    } catch (err) {
      console.error('Failed to load MFA status:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setActionError('');
      setIsSetupWizardOpen(false);
      setFreshRecoveryCodes(null);
      setStepUpPassword('');
      Promise.all([loadSessions(), loadMfaStatus()]).finally(() => setLoading(false));
    }
  }, [isOpen, loadSessions, loadMfaStatus]);

  if (!isOpen) return null;

  // Terminate a Remote Session
  const handleTerminateSession = async (sessionId) => {
    setTerminatingSessionId(sessionId);
    try {
      const res = await authService.terminateSession(sessionId);
      if (res.success) {
        toast.success('Remote session terminated successfully.');
        await loadSessions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to terminate session.');
    } finally {
      setTerminatingSessionId(null);
    }
  };

  // Start MFA Enrollment (Step 1: Password step-up)
  const handleInitiateMfaSetup = async (e) => {
    e.preventDefault();
    if (!stepUpPassword) {
      setActionError('Password is required to initiate MFA enrollment.');
      return;
    }
    setLoading(true);
    setActionError('');
    try {
      const res = await authService.mfaSetup({ password: stepUpPassword });
      if (res.success && res.data) {
        setPendingSecret(res.data.secret);
        setSetupStep(2);
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Password authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Confirm MFA Enrollment with TOTP Code (Step 2)
  const handleConfirmMfaSetup = async (e) => {
    e.preventDefault();
    const cleanCode = confirmTotpCode.replace(/\D/g, '').trim();
    if (cleanCode.length !== 6) {
      setActionError('Please enter a valid 6-digit authentication code.');
      return;
    }
    setLoading(true);
    setActionError('');
    try {
      const res = await authService.mfaConfirm({ totpCode: cleanCode });
      if (res.success && res.data) {
        setFreshRecoveryCodes(res.data.recoveryCodes || []);
        setSetupStep(3);
        toast.success('Two-factor authentication enabled!');
        await loadMfaStatus();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // Regenerate Recovery Codes (Requires step-up password)
  const handleRegenerateCodes = async () => {
    const password = prompt('Enter your current account password to regenerate emergency recovery codes:');
    if (!password) return;
    setLoading(true);
    try {
      const res = await authService.regenerateRecoveryCodes(password);
      if (res.success && res.data) {
        setFreshRecoveryCodes(res.data.recoveryCodes || []);
        toast.success('New emergency recovery codes generated.');
        await loadMfaStatus();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to regenerate recovery codes.');
    } finally {
      setLoading(false);
    }
  };

  // Disable MFA (Requires step-up password)
  const handleDisableMfa = async () => {
    if (mfaStatus?.requiresMfa) {
      toast.error('MFA is mandatory for your role level and cannot be disabled.');
      return;
    }
    const password = prompt('Enter your current account password to disable Two-Factor Authentication:');
    if (!password) return;
    setLoading(true);
    try {
      const res = await authService.disableMfa(password);
      if (res.success) {
        toast.success('Two-Factor Authentication disabled.');
        await loadMfaStatus();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disable MFA.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRecoveryCodes = () => {
    if (!freshRecoveryCodes || freshRecoveryCodes.length === 0) return;
    navigator.clipboard.writeText(freshRecoveryCodes.join('\n'));
    setHasCopiedRecovery(true);
    toast.success('Recovery codes copied to clipboard.');
    setTimeout(() => setHasCopiedRecovery(false), 2000);
  };

  const handleDownloadRecoveryCodes = () => {
    if (!freshRecoveryCodes || freshRecoveryCodes.length === 0) return;
    const content = [
      '========================================================================',
      'EDUCATION DEPARTMENT LIAQUATABAD TOWN CENTRE (DMC)',
      'EMERGENCY MFA BACKUP RECOVERY CODES',
      '========================================================================',
      `Account: ${user?.email || 'Administrator'}`,
      `Date Generated: ${new Date().toUTCString()}`,
      '',
      'RECOVERY CODES:',
      ...freshRecoveryCodes.map((c, i) => `  [${i + 1}] ${c}`),
      '',
      'Notice: Each code is single-use. Store this document securely.',
      '========================================================================',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = `dmc-recovery-codes-${Date.now()}.txt`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);
    toast.success('Recovery codes file downloaded.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 my-8 text-[#102033]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-2 text-[#006AC7]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#102033]">
                Account Security &amp; Device Sessions
              </h3>
              <p className="text-xs text-[#526477]">
                Multi-Factor Authentication (MFA), active devices, and cryptographic token lifecycle
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#102033] cursor-pointer transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('sessions');
              setIsSetupWizardOpen(false);
              setActionError('');
            }}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'sessions'
                ? 'border-[#006AC7] text-[#006AC7]'
                : 'border-transparent text-[#526477] hover:text-[#102033]'
            }`}
          >
            <Laptop className="h-4 w-4" />
            <span>Active Sessions ({sessions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('mfa');
              setIsSetupWizardOpen(false);
              setActionError('');
            }}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'mfa'
                ? 'border-[#006AC7] text-[#006AC7]'
                : 'border-transparent text-[#526477] hover:text-[#102033]'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Two-Factor Authentication</span>
            {mfaStatus?.mfaEnabled ? (
              <span className="h-2 w-2 rounded-full bg-[#4B7F3A]" title="Active" />
            ) : (
              <span className="h-2 w-2 rounded-full bg-amber-400" title="Disabled" />
            )}
          </button>
        </div>

        {/* Tab 1: Active Sessions */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[#526477]">
              <p>
                All devices currently authenticated with active refresh token families. Terminating a
                device revokes its credentials immediately.
              </p>
              <button
                type="button"
                onClick={loadSessions}
                className="flex items-center gap-1 font-bold text-[#006AC7] hover:underline"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-xs text-[#526477]">
                  <RefreshCw className="mx-auto h-5 w-5 animate-spin text-[#006AC7] mb-2" />
                  <span>Loading active sessions...</span>
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#526477]">
                  <span>No other active sessions detected.</span>
                </div>
              ) : (
                sessions.map((sessionItem) => (
                  <div
                    key={sessionItem.sessionId}
                    className={`p-3.5 flex items-center justify-between transition ${
                      sessionItem.isCurrentSession ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-xl mt-0.5 ${
                          sessionItem.isCurrentSession
                            ? 'bg-blue-100 text-[#006AC7]'
                            : 'bg-slate-100 text-[#526477]'
                        }`}
                      >
                        {sessionItem.deviceLabel?.toLowerCase().includes('mobile') ? (
                          <Smartphone className="h-4 w-4" />
                        ) : (
                          <Laptop className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#102033]">
                            {sessionItem.deviceLabel || 'Web Browser'}
                          </span>
                          {sessionItem.isCurrentSession && (
                            <span className="rounded-full bg-[#E3F0DC] border border-[#C9DFBC] px-2 py-0.5 text-[10px] font-bold text-[#4B7F3A]">
                              This Device
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#526477] flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>
                            Logged in: {new Date(sessionItem.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!sessionItem.isCurrentSession && (
                      <button
                        type="button"
                        disabled={terminatingSessionId === sessionItem.sessionId}
                        onClick={() => handleTerminateSession(sessionItem.sessionId)}
                        className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                        title="Terminate this session"
                      >
                        {terminatingSessionId === sessionItem.sessionId ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        <span className="hidden sm:inline">Terminate</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Two-Factor Authentication */}
        {activeTab === 'mfa' && (
          <div className="space-y-4">
            {/* MFA Status Banner */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      mfaStatus?.mfaEnabled
                        ? 'bg-emerald-100 text-[#4B7F3A]'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {mfaStatus?.mfaEnabled ? (
                      <ShieldCheck className="h-6 w-6" />
                    ) : (
                      <ShieldAlert className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#102033]">
                      Two-Factor Authentication is{' '}
                      <span
                        className={mfaStatus?.mfaEnabled ? 'text-[#4B7F3A]' : 'text-amber-700'}
                      >
                        {mfaStatus?.mfaEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </h4>
                    <p className="text-xs text-[#526477] mt-0.5">
                      {mfaStatus?.requiresMfa
                        ? 'Mandatory high-security requirement for Supreme Root Admin accounts.'
                        : 'Protects account access using TOTP authenticator apps (Google Authenticator, etc.).'}
                    </p>
                  </div>
                </div>

                {mfaStatus?.requiresMfa && (
                  <span className="rounded-full bg-blue-50 border border-blue-200 text-[#006AC7] px-2.5 py-0.5 text-[10px] font-bold">
                    Role-Mandated
                  </span>
                )}
              </div>

              {mfaStatus?.mfaEnabled && (
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-[#526477]">
                  <span>
                    Backup Recovery Codes Remaining:{' '}
                    <strong className="text-[#102033]">
                      {mfaStatus.recoveryCodesRemaining ?? 'Active'} of 8
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleRegenerateCodes}
                    className="text-[#006AC7] hover:underline font-bold"
                  >
                    Regenerate Backup Codes
                  </button>
                </div>
              )}
            </div>

            {/* Freshly Generated Recovery Codes Vault Modal (Inline) */}
            {freshRecoveryCodes && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 space-y-3 text-xs text-emerald-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="h-4 w-4 text-[#4B7F3A]" />
                    <span>Emergency Recovery Codes Vault</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyRecoveryCodes}
                      className="font-bold text-[#006AC7] hover:underline flex items-center gap-1"
                    >
                      {hasCopiedRecovery ? <Check className="h-3 w-3 text-[#4B7F3A]" /> : <Copy className="h-3 w-3" />}
                      <span>{hasCopiedRecovery ? 'Copied' : 'Copy All'}</span>
                    </button>
                    <span>|</span>
                    <button
                      type="button"
                      onClick={handleDownloadRecoveryCodes}
                      className="font-bold text-[#006AC7] hover:underline flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download .txt</span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-emerald-200 font-mono text-xs select-all text-[#102033]">
                  {freshRecoveryCodes.map((codeItem, index) => (
                    <div key={index} className="px-2 py-1 bg-slate-50 rounded">
                      <span className="text-[10px] text-slate-400 mr-1">{index + 1}.</span>
                      <span className="font-bold">{codeItem}</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setFreshRecoveryCodes(null)}
                  className="w-full py-1.5 bg-[#4B7F3A] text-white rounded-lg font-bold hover:bg-[#3D692F] transition"
                >
                  Done (I have safely stored these codes)
                </button>
              </div>
            )}

            {/* Setup Wizard for Non-Enrolled Users */}
            {!mfaStatus?.mfaEnabled && !isSetupWizardOpen && (
              <button
                type="button"
                onClick={() => {
                  setIsSetupWizardOpen(true);
                  setSetupStep(1);
                  setActionError('');
                }}
                className="w-full py-2.5 px-4 bg-[#006AC7] text-white rounded-xl text-xs font-bold hover:bg-[#00529B] transition flex items-center justify-center gap-2 shadow-xs"
              >
                <Key className="h-4 w-4" />
                <span>Configure Two-Factor Authentication</span>
              </button>
            )}

            {/* Step-by-Step Enrollment Wizard */}
            {isSetupWizardOpen && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                {actionError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                    {actionError}
                  </div>
                )}

                {setupStep === 1 && (
                  <form onSubmit={handleInitiateMfaSetup} className="space-y-3 text-xs">
                    <p className="text-[#526477]">
                      Please confirm your account password to begin MFA registration:
                    </p>
                    <input
                      type="password"
                      placeholder="Current Account Password"
                      value={stepUpPassword}
                      onChange={(e) => setStepUpPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#006AC7]"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loading || !stepUpPassword}
                        className="flex-1 py-2 bg-[#006AC7] text-white font-bold rounded-lg hover:bg-[#00529B] disabled:opacity-50 transition"
                      >
                        {loading ? 'Verifying Password...' : 'Proceed to Authenticator Setup'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSetupWizardOpen(false)}
                        className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {setupStep === 2 && pendingSecret && (
                  <form onSubmit={handleConfirmMfaSetup} className="space-y-3 text-xs">
                    <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#526477]">
                        <span>Manual Setup Key</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(pendingSecret);
                            setHasCopiedSecret(true);
                            setTimeout(() => setHasCopiedSecret(false), 2000);
                          }}
                          className="text-[#006AC7] hover:underline font-bold"
                        >
                          {hasCopiedSecret ? 'Copied!' : 'Copy Key'}
                        </button>
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-200 text-center font-mono font-bold text-sm tracking-widest text-[#102033]">
                        {pendingSecret}
                      </div>
                      <p className="text-[11px] text-[#526477]">
                        Enter this key into Google Authenticator or Microsoft Authenticator, then input
                        the 6-digit verification code below:
                      </p>
                    </div>

                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={confirmTotpCode}
                      onChange={(e) => setConfirmTotpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2.5 text-center font-mono text-xl tracking-[0.3em] font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-[#006AC7]"
                    />

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loading || confirmTotpCode.length !== 6}
                        className="flex-1 py-2 bg-[#006AC7] text-white font-bold rounded-lg hover:bg-[#00529B] disabled:opacity-50 transition"
                      >
                        {loading ? 'Confirming...' : 'Verify Code & Complete Setup'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSetupWizardOpen(false)}
                        className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Disable 2FA Action (For non-Root Admin only) */}
            {mfaStatus?.mfaEnabled && !mfaStatus?.requiresMfa && (
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleDisableMfa}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline"
                >
                  Disable Two-Factor Authentication
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer Close */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#526477] hover:bg-slate-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettingsModal;
