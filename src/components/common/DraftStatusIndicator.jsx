import React from 'react';
import { Loader2, Check } from 'lucide-react';

export const DraftStatusIndicator = ({ status = 'idle' }) => {
  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-2xs text-[#8094A8] font-medium">
        <Loader2 className="w-3 h-3 animate-spin text-[#006AC7]" />
        <span>Saving draft...</span>
      </span>
    );
  }

  if (status === 'saved') {
    return (
      <span className="inline-flex items-center gap-1 text-2xs text-emerald-600 font-medium">
        <Check className="w-3 h-3 text-emerald-500" />
        <span>Draft saved locally</span>
      </span>
    );
  }

  return null;
};

export default DraftStatusIndicator;
