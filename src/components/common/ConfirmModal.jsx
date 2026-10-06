import React, { useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, Trash2, X, Loader2 } from 'lucide-react';

/**
 * Reusable accessible modal dialog to replace native browser `window.confirm`.
 * Adheres to the municipal SaaS theme and provides clear visual states for destructive/confirmative actions.
 */
export const ConfirmModal = ({
  isOpen,
  title,
  message,
  note,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen || isLoading) return;
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-200/70',
      icon: <Trash2 className="w-5 h-5" />,
      buttonBg: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs',
    },
    warning: {
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/70',
      icon: <AlertTriangle className="w-5 h-5" />,
      buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs',
    },
    primary: {
      iconBg: 'bg-blue-50 text-[#006AC7] border border-blue-200/70',
      icon: <Info className="w-5 h-5" />,
      buttonBg: 'bg-[#006AC7] hover:bg-[#00529B] text-white shadow-xs',
    },
  }[confirmVariant] || {
    iconBg: 'bg-blue-50 text-[#006AC7] border border-blue-200/70',
    icon: <AlertCircle className="w-5 h-5" />,
    buttonBg: 'bg-[#006AC7] hover:bg-[#00529B] text-white shadow-xs',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs transition-opacity"
      onClick={(clickEvent) => {
        if (clickEvent.target === clickEvent.currentTarget && !isLoading) {
          onCancel();
        }
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl p-2.5 ${variantStyles.iconBg}`}>
              {variantStyles.icon}
            </div>
            <div>
              <h3 id="confirm-modal-title" className="text-base font-bold text-slate-900 leading-snug">
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer disabled:opacity-40"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-slate-600 leading-relaxed font-normal">
          {message}
        </div>

        {note && (
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-[11px] text-slate-600 leading-relaxed">
            {note}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-40"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${variantStyles.buttonBg}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
