import React, { useState, useRef, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Globe,
  Building,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Check,
  Info,
} from 'lucide-react';

/**
 * 👁️ FieldVisibilityEye
 * Accessible inline visibility control for profile fields.
 * Distinguishes user-configurable privacy from administrator-managed invariants.
 * Strictly adheres to DMC security ceilings (CNIC and Bank details can NEVER be PUBLIC).
 */
export const FieldVisibilityEye = ({
  field,
  label = '',
  currentTier = 'PUBLIC',
  isOwner = false,
  isLocked = false,
  lockReason = 'Managed by Education Department Administration. Non-editable.',
  onUpdate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const popoverRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);


  // Tier configuration definitions (Strictly adhering to DMC 4-Tier Privacy Standard)
  const tierConfigs = {
    SCHOOL: {
      label: 'School Based',
      shortLabel: 'School Based',
      desc: 'Visible only to verified faculty, staff, and administrators within your school',
      icon: Building,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    PRIVATE: {
      label: 'Private',
      shortLabel: 'Private',
      desc: 'Strictly confidential. Masked from all users and visible unmasked only to you',
      icon: EyeOff,
      color: 'text-rose-700 bg-rose-50 border-rose-200',
    },
    AUTHORIZED_ROLE: {
      label: 'Officials',
      shortLabel: 'Officials',
      desc: 'Visible only to Head Master, Cluster Supervisor, DDO, and Town Administration',
      icon: ShieldCheck,
      color: 'text-amber-800 bg-amber-50 border-amber-200',
    },
    PUBLIC: {
      label: 'Public',
      shortLabel: 'Public',
      desc: 'Visible to authenticated municipal personnel across the town directory',
      icon: Globe,
      color: 'text-[#006AC7] bg-blue-50 border-blue-200',
    },
  };

  const activeConfig = tierConfigs[currentTier] || tierConfigs.PUBLIC;
  const ActiveIcon = currentTier === 'PRIVATE' ? EyeOff : Eye;

  // Handle selection
  const handleSelectTier = async (newTier) => {
    if (newTier === currentTier || isSaving) return;
    setIsSaving(true);
    try {
      if (onUpdate) {
        await onUpdate(field, newTier);
      }
      setIsOpen(false);
    } catch {
      // Error handled by parent toast
    } finally {
      setIsSaving(false);
    }
  };

  // Case 1: Field is administrator-controlled / system invariant
  if (isLocked) {
    return (
      <span
        title={lockReason}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 cursor-help"
        aria-label={`${label || field}: ${lockReason}`}
      >
        <Lock className="w-3 h-3 text-slate-400" />
        <span className="sr-only">Locked:</span>
        Admin Managed
      </span>
    );
  }

  // Case 2: Read-only for non-owners (viewers)
  if (!isOwner) {
    return (
      <span
        title={`Visibility: ${activeConfig.label}`}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${activeConfig.color}`}
        aria-label={`${label || field} visibility: ${activeConfig.label}`}
      >
        <ActiveIcon className="w-3 h-3" />
        <span>{activeConfig.shortLabel}</span>
      </span>
    );
  }

  // Institutional Security Ceilings:
  // National identity, financial, and residential records possess hard ceilings.
  // Permitted options are restricted to 'Officials' (AUTHORIZED_ROLE) or 'Private' (PRIVATE).
  // Standard contact and professional credentials support all 4 tiers: 'School Based', 'Private', 'Officials', 'Public'.
  const isStrictlySensitive = ['cnic', 'bFormNumber', 'bankDetails', 'residentialAddress'].includes(field);
  const permittedTiers = isStrictlySensitive
    ? ['AUTHORIZED_ROLE', 'PRIVATE']
    : ['SCHOOL', 'PRIVATE', 'AUTHORIZED_ROLE', 'PUBLIC'];

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSaving}
        title={`Field Visibility: ${activeConfig.label}. Click to modify.`}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all hover:shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#006AC7]/30 ${
          activeConfig.color
        } ${isSaving ? 'opacity-70 cursor-wait' : 'cursor-pointer hover:brightness-95'}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Configure visibility for ${label || field}. Currently: ${activeConfig.label}`}
      >
        {isSaving ? (
          <Loader2 className="w-3 h-3 animate-spin text-[#006AC7]" />
        ) : (
          <ActiveIcon className="w-3 h-3" />
        )}
        <span>{activeConfig.shortLabel}</span>
      </button>

      {/* Popover Selection Menu */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 top-full mt-1.5 z-40 w-64 p-2 bg-white rounded-xl shadow-xl border border-slate-200 text-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 border-b border-slate-100 mb-1.5">
            <span className="font-bold text-[#102033] block text-[11px]">
              {label || 'Field'} Visibility Setting
            </span>
            <span className="text-[10px] text-[#526477]">
              Choose who can view this information
            </span>
          </div>

          <div className="space-y-1">
            {permittedTiers.map((tierKey) => {
              const config = tierConfigs[tierKey];
              const isSelected = tierKey === currentTier;
              const OptionIcon = config.icon;

              return (
                <button
                  key={tierKey}
                  type="button"
                  onClick={() => handleSelectTier(tierKey)}
                  className={`w-full text-left p-2 rounded-lg transition-colors flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-blue-50/80 border border-blue-200 text-[#006AC7]'
                      : 'hover:bg-slate-50 text-[#102033]'
                  }`}
                >
                  <OptionIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isSelected ? 'text-[#006AC7]' : 'text-slate-400'}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px]">{config.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-[#006AC7]" />}
                    </div>
                    <p className="text-[10px] text-[#526477] leading-tight mt-0.5">
                      {config.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Security Ceiling Notice for Sensitive Fields */}
          {isStrictlySensitive && (
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-start gap-1.5 text-[9px] text-amber-800 bg-amber-50/50 p-1.5 rounded-lg">
              <Info className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                Per Institutional Civil Service Policy, national identity &amp; bank records are capped and cannot be exposed publicly.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FieldVisibilityEye;
