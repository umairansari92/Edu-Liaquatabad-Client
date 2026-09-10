import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  User,
  Building,
  CheckCircle2,
  X,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient.js';

// Authority Hierarchy Levels
const AUTHORITY_LEVELS = {
  ROOT_ADMIN: 100,
  SUPER_ADMIN: 90,
  ADMIN: 80,
  SUPERVISOR: 60,
  HM: 50,
  TEACHER: 30,
  PEON: 20,
  STUDENT: 10,
  PARENT: 10,
};

// Permissible scopes per granted authority
const VALID_SCOPES_PER_AUTHORITY = {
  SUPER_ADMIN: ['GLOBAL', 'TOWN'],
  ADMIN: ['TOWN'],
  SUPERVISOR: ['ASSIGNED_SCHOOLS'],
  HM: ['SCHOOL'],
  TEACHER: ['CLASS_SECTION'],
  PEON: ['SCHOOL'],
  STUDENT: ['SELF'],
  PARENT: ['CHILD'],
};

export const UserAuthorityModal = ({
  isOpen,
  onClose,
  targetUser,
  currentUser,
  onAuthorityUpdated,
}) => {
  const [selectedAuthority, setSelectedAuthority] = useState('');
  const [selectedScope, setSelectedScope] = useState('');
  const [designationText, setDesignationText] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (targetUser) {
      setSelectedAuthority(targetUser.role || 'TEACHER');
      setSelectedScope(targetUser.scope || 'SCHOOL');
      setDesignationText(targetUser.designation || '');
      setReasonText('');
      setIsConfirming(false);
    }
  }, [targetUser]);

  if (!isOpen || !targetUser) return null;

  const actorLevel = currentUser?.roleLevel || AUTHORITY_LEVELS[currentUser?.role] || 0;
  const targetLevel = AUTHORITY_LEVELS[targetUser.role] || 0;

  // Actor cannot manage users of equal or higher authority (unless ROOT_ADMIN)
  const canActorManageTarget = currentUser?.role === 'ROOT_ADMIN' || actorLevel > targetLevel;

  // Authorities actor is permitted to grant (strictly lower than actor's own level, excluding ROOT_ADMIN)
  const assignableAuthorities = Object.keys(AUTHORITY_LEVELS).filter((authKey) => {
    if (authKey === 'ROOT_ADMIN') return false; // Root Admin can NEVER be granted via web UI
    if (currentUser?.role === 'ROOT_ADMIN') return true;
    return AUTHORITY_LEVELS[authKey] < actorLevel;
  });

  // Valid scopes for currently selected authority
  const availableScopes = VALID_SCOPES_PER_AUTHORITY[selectedAuthority] || ['SCHOOL'];

  const handleAuthoritySelect = (newAuth) => {
    setSelectedAuthority(newAuth);
    const validScopes = VALID_SCOPES_PER_AUTHORITY[newAuth] || ['SCHOOL'];
    if (!validScopes.includes(selectedScope)) {
      setSelectedScope(validScopes[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reasonText || reasonText.trim().length < 10) {
      toast.error('A mandatory justification reason (min 10 characters) is required.');
      return;
    }

    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.patch(`/users/${targetUser._id}/role-designation`, {
        designation: designationText.trim(),
        role: selectedAuthority,
        scope: selectedScope,
        reason: reasonText.trim(),
      });

      toast.success('User organizational authority & designation updated successfully.');
      if (onAuthorityUpdated) {
        onAuthorityUpdated(response.data?.data?.user || targetUser);
      }
      onClose();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Failed to update user authorization.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-800/60 text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-white">
                Enterprise Authority & Designation Management
              </h2>
              <p className="text-xs text-slate-400">
                Liaquatabad Town Centre Education Directorate • Tier Separation Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Target Identity Overview Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-base">{targetUser.fullName}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {targetUser.email}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Civil Designation</span>
                    <span className="font-medium text-amber-400">{targetUser.designation || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Base Role</span>
                    <span className="font-mono text-cyan-400">{targetUser.baseRole || 'TEACHER'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Current Authority</span>
                    <span className="font-mono font-bold text-emerald-400">{targetUser.role}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Current Scope</span>
                    <span className="font-mono text-purple-400">{targetUser.scope}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!canActorManageTarget ? (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/40 text-red-300 text-sm flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 flex-shrink-0 text-red-400" />
              <div>
                <p className="font-semibold">Hierarchy Guard Enforcement</p>
                <p className="text-xs text-red-400/90 mt-0.5">
                  You cannot modify this account. Your authority level ({actorLevel}) is equal to or lower than the target account ({targetLevel}).
                </p>
              </div>
            </div>
          ) : (
            <form id="authority-form" onSubmit={handleSubmit} className="space-y-5">
              {/* Civil Designation Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Civil Service Designation (Organizational Descriptive Title)
                </label>
                <input
                  type="text"
                  value={designationText}
                  onChange={(e) => setDesignationText(e.target.value)}
                  placeholder="e.g. DDO, Senior Clerk, Accountant, Head Master, Assistant HM"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                />
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-500" />
                  <span>Designation is descriptive civil title and confers ZERO technical permissions.</span>
                </p>
              </div>

              {/* Authority Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Grant System Authority (Technical Access Boundary)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {assignableAuthorities.map((authKey) => {
                    const isSelected = selectedAuthority === authKey;
                    return (
                      <button
                        type="button"
                        key={authKey}
                        onClick={() => handleAuthoritySelect(authKey)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-left flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300 shadow-md shadow-emerald-950/50'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <span className="font-mono">{authKey}</span>
                        <span className="text-[10px] text-slate-500 mt-1">Level {AUTHORITY_LEVELS[authKey]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scope Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Jurisdictional Scope Boundary
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableScopes.map((scopeKey) => {
                    const isSelected = selectedScope === scopeKey;
                    return (
                      <button
                        type="button"
                        key={scopeKey}
                        onClick={() => setSelectedScope(scopeKey)}
                        className={`p-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                          isSelected
                            ? 'bg-cyan-950/60 border-cyan-600 text-cyan-300 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <span className="font-mono">{scopeKey}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mandatory Justification Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Mandatory Justification Reason (Required for Audit Log)
                </label>
                <textarea
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  rows={2}
                  placeholder="Official notification reference or departmental rationale (min 10 characters)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Confirmation Step Diff */}
              {isConfirming && (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2 font-bold text-amber-200">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Please Confirm Authority Reassignment</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-amber-800/30">
                    <div>
                      <span className="text-slate-400 block">Target:</span>
                      <span className="font-medium text-white">{targetUser.fullName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Transition:</span>
                      <span className="font-mono text-slate-400">{targetUser.role}</span>
                      <ArrowRight className="inline w-3 h-3 mx-1 text-amber-400" />
                      <span className="font-mono font-bold text-emerald-400">{selectedAuthority}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Scope:</span>
                      <span className="font-mono text-cyan-300">{selectedScope}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Designation:</span>
                      <span className="text-white">{designationText || 'Unchanged'}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-400/80 pt-1">
                    * Submitting will increment the user's tokenVersion and immediately revoke all existing sessions across all devices.
                  </p>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/60">
          <button
            type="button"
            onClick={() => {
              if (isConfirming) setIsConfirming(false);
              else onClose();
            }}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isConfirming ? 'Back to Edit' : 'Cancel'}
          </button>

          {canActorManageTarget && (
            <button
              type="submit"
              form="authority-form"
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                isConfirming
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Recording Audit...</span>
                </>
              ) : isConfirming ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Execute Authority Grant</span>
                </>
              ) : (
                <>
                  <span>Review Authority Change</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAuthorityModal;
