import React from 'react';
import { History, CheckCircle2, Trash2 } from 'lucide-react';

export const DraftRecoveryBanner = ({
  timestamp,
  onRestore,
  onDiscard,
  formLabel = 'form',
}) => {
  if (!timestamp) return null;

  const formattedDate = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="mb-4 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-900 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0">
          <History className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-bold leading-tight">
            Unsaved Local Draft Found ({formattedDate})
          </p>
          <p className="text-2xs text-amber-700/90 mt-0.5">
            Your previous {formLabel} work was safely preserved during offline or refresh.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        <button
          type="button"
          onClick={onDiscard}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-800 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Discard</span>
        </button>

        <button
          type="button"
          onClick={onRestore}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Restore Draft</span>
        </button>
      </div>
    </div>
  );
};

export default DraftRecoveryBanner;
