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
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [schoolsList, setSchoolsList] = useState([]);
  const [designationText, setDesignationText] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await apiClient.get('/schools');
        if (response.data?.success) {
          setSchoolsList(response.data.data?.schools || response.data.data || []);
        }
      } catch (error) {
        console.error('Failed to load schools for authority modal:', error);
      }
    };
    if (isOpen) {
      fetchSchools();
    }
  }, [isOpen]);

  useEffect(() => {
    if (targetUser) {
      setSelectedAuthority(targetUser.role || 'TEACHER');
      setSelectedScope(targetUser.scope || 'SCHOOL');
      const currentSchool = targetUser.schoolId?._id || targetUser.schoolId || '';
      setSelectedSchoolId(currentSchool);
      setDesignationText(targetUser.designation || '');
      setReasonText('');
      setIsConfirming(false);
    }
  }, [targetUser]);

  if (!isOpen || !targetUser) return null;

  const isTargetAcademicEntity =
    ['STUDENT', 'PARENT'].includes(targetUser.role) ||
    ['STUDENT', 'PARENT'].includes(targetUser.baseRole);

  const actorLevel = currentUser?.roleLevel || AUTHORITY_LEVELS[currentUser?.role] || 0;
  const targetLevel = AUTHORITY_LEVELS[targetUser.role] || 0;

  // Actor cannot manage users of equal or higher authority (unless ROOT_ADMIN)
  const canActorManageTarget = currentUser?.role === 'ROOT_ADMIN' || actorLevel > targetLevel;

  // Authorities actor is permitted to grant (strictly lower than actor's own level, excluding ROOT_ADMIN, STUDENT, PARENT)
  const assignableAuthorities = Object.keys(AUTHORITY_LEVELS).filter((authKey) => {
    if (authKey === 'ROOT_ADMIN') return false; // Root Admin can NEVER be granted via web UI
    if (authKey === 'STUDENT' || authKey === 'PARENT') return false; // Staff cannot be demoted to student/parent
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

  const handleSubmit = async (submitEvent) => {
    submitEvent.preventDefault();

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
      // Canonical role & designation assignment endpoint
      // Updates role, scope, designation, and schoolId atomically in a single audit-logged operation.
      const response = await apiClient.patch(`/users/${targetUser._id}/role-designation`, {
        role: selectedAuthority,
        scope: selectedScope,
        designation: designationText.trim() || undefined,
        schoolId: selectedSchoolId || undefined,
        reason: reasonText.trim(),
      });

      toast.success(
        `Designation & System Authority "${selectedAuthority}" updated successfully. Active sessions revoked.`
      );
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
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
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
                  <div>
                    <span className="text-slate-500 block">Assigned School</span>
                    <span className="font-medium text-emerald-400 truncate block" title={targetUser.schoolId?.name || 'None'}>
                      {targetUser.schoolId?.name || 'None'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isTargetAcademicEntity ? (
            <div className="p-5 rounded-2xl bg-sky-950/30 border border-sky-800/40 text-sky-200 text-sm space-y-3">
              <div className="flex items-center gap-2.5 font-bold text-sky-300">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Academic Entity Boundary Protection</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>{targetUser.fullName}</strong> is registered as a <span className="text-cyan-300 font-semibold">{targetUser.role}</span>. 
                Students and Parents are external academic beneficiaries and cannot hold civil service posts, teaching assignments, or institutional administrative authorities.
              </p>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 space-y-1">
                <p className="text-amber-300 font-medium">Looking for Student Academic Promotion?</p>
                <p>
                  Student grade progression (e.g. promoting from Class 5 to Class 6 at the end of an academic term) is managed through the <strong>Academic & Examinations Module</strong>, not system authority grants.
                </p>
              </div>
            </div>
          ) : !canActorManageTarget ? (
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
              {/* Civil Designation — Fully Editable with Quick Presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Civil Service Designation (Official Job Title)
                  </label>
                  <span className="text-[11px] text-amber-400 font-medium">
                    Supports multiple titles (e.g. Head Master / DDO)
                  </span>
                </div>
                <input
                  type="text"
                  value={designationText}
                  onChange={(inputChangeEvent) => setDesignationText(inputChangeEvent.target.value)}
                  placeholder="e.g. Senior Clerk, Head Master, PST, JST, DDO, Supervisor..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-amber-300 text-sm font-medium focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                />

                {/* Quick Title Presets */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-500 mr-1">Quick presets:</span>
                  {['PST', 'JST', 'SST', 'Head Master', 'Senior Clerk', 'Junior Clerk', 'DDO', 'Accountant', 'Supervisor'].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => {
                        if (!designationText.trim()) {
                          setDesignationText(preset);
                        } else if (!designationText.includes(preset)) {
                          setDesignationText(`${designationText} / ${preset}`);
                        }
                      }}
                      className="px-2 py-0.5 rounded-md bg-slate-950 hover:bg-amber-950/60 hover:text-amber-300 text-slate-400 text-[11px] font-mono border border-slate-800 transition"
                    >
                      + {preset}
                    </button>
                  ))}
                  {designationText && (
                    <button
                      type="button"
                      onClick={() => setDesignationText('')}
                      className="px-1.5 py-0.5 rounded text-[10px] text-red-400 hover:bg-red-950/40 ml-auto"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Civil service designation is the employee's official public/departmental title. You can assign single or combined titles (e.g., "Senior Clerk / DDO" or "Head Master / In-charge").
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

              {/* School Assignment Selector (for HM or SCHOOL Scope) */}
              {(selectedAuthority === 'HM' || selectedScope === 'SCHOOL') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Assigned Municipal School (Jurisdiction)</span>
                    <span className="text-[11px] text-emerald-400 font-normal">Operational boundary</span>
                  </label>
                  <select
                    value={selectedSchoolId}
                    onChange={(selectChangeEvent) => setSelectedSchoolId(selectChangeEvent.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="">-- Select Municipal School --</option>
                    {schoolsList.map((sch) => (
                      <option key={sch._id} value={sch._id}>
                        {sch.name} ({sch.schoolCode || sch.emisCode})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Head Master will hold administrative jurisdiction and oversight for this specific school.
                  </p>
                </div>
              )}

              {/* Mandatory Justification Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Mandatory Justification Reason (Required for Audit Log)
                </label>
                <textarea
                  value={reasonText}
                  onChange={(textareaChangeEvent) => setReasonText(textareaChangeEvent.target.value)}
                  rows={2}
                  placeholder="Official notification reference or departmental rationale (min 10 characters)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Confirmation Step Diff */}
              {isConfirming && (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 font-bold text-amber-200">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Please Confirm Designation & Authority Updates</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-800/30">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Target Personnel:</span>
                      <span className="font-semibold text-white text-sm">{targetUser.fullName}</span>
                      <span className="text-[10px] text-slate-500 block font-mono">{targetUser.email}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Civil Designation (Official Title):</span>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-slate-400 text-xs line-through">{targetUser.designation || 'None'}</span>
                        <ArrowRight className="inline w-3 h-3 text-amber-400 shrink-0" />
                        <span className="font-bold text-amber-300 text-xs bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/50">
                          {designationText.trim() || targetUser.designation || 'None'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">System Technical Authority:</span>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="font-mono text-slate-400 text-xs">
                          {targetUser.role} <span className="text-[10px] text-slate-500">(Lvl {AUTHORITY_LEVELS[targetUser.role] || 0})</span>
                        </span>
                        <ArrowRight className="inline w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="font-mono font-bold text-emerald-400 text-xs bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50">
                          {selectedAuthority} <span className="text-[10px] text-emerald-500">(Lvl {AUTHORITY_LEVELS[selectedAuthority] || 0})</span>
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Jurisdictional Scope:</span>
                      <span className="font-mono text-cyan-300 text-xs">{selectedScope}</span>
                    </div>

                    {(selectedAuthority === 'HM' || selectedScope === 'SCHOOL' || selectedSchoolId) && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block text-[11px]">Assigned School Jurisdiction:</span>
                        <span className="font-medium text-emerald-300 text-xs">
                          {schoolsList.find((schoolItem) => String(schoolItem._id) === String(selectedSchoolId))?.name ||
                            targetUser.schoolId?.name ||
                            'Unassigned'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <p>
                      <strong className="text-cyan-300">Designation vs System Authority:</strong>{' '}
                      Civil Designation (<span className="text-amber-300 font-semibold">{designationText.trim() || targetUser.designation}</span>) is their official governmental title. System Authority (<span className="text-emerald-400 font-mono font-semibold">{selectedAuthority}</span>) grants software permissions in the portal.
                    </p>
                    <p className="text-amber-400/80 text-[10px]">
                      * Executing this update will increment tokenVersion and revoke existing active login sessions for security compliance.
                    </p>
                  </div>
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

          {canActorManageTarget && !isTargetAcademicEntity && (
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
