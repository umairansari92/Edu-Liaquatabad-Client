import React, { useState, useEffect } from 'react';
import {
  subscribeToConnectionStatus,
  getCurrentConnectionStatus,
  verifyConnectionState,
} from '../../services/reliability/connectionMonitor.js';
import { CONNECTION_STATUS } from '../../services/reliability/reliabilityConstants.js';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const ConnectionStatusBadge = () => {
  const [status, setStatus] = useState(getCurrentConnectionStatus);

  useEffect(() => {
    const unsubscribe = subscribeToConnectionStatus((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  const handleManualCheck = () => {
    verifyConnectionState();
  };

  if (status === CONNECTION_STATUS.ONLINE) {
    return (
      <div
        className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[10.5px] sm:text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs shrink-0 select-none transition-all"
        title="Live connection to platform server established (Municipal Data Sync Active)"
        aria-label="Connection Status: Online"
      >
        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
        <span className="font-semibold text-emerald-800">Online</span>
      </div>
    );
  }

  if (status === CONNECTION_STATUS.SYNCING) {
    return (
      <div
        className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[10.5px] sm:text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 animate-pulse shadow-2xs shrink-0 select-none"
        title="Synchronizing local drafts and marks with server..."
        aria-label="Connection Status: Syncing"
      >
        <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 animate-spin shrink-0" />
        <span className="hidden xs:inline sm:inline">Syncing...</span>
        <span className="xs:hidden">Sync</span>
      </div>
    );
  }

  if (status === CONNECTION_STATUS.RECONNECTING) {
    return (
      <button
        type="button"
        onClick={handleManualCheck}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[10.5px] sm:text-xs font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs cursor-pointer hover:bg-amber-100 transition-colors shrink-0 select-none"
        title="Reconnecting to municipal server. Click to retry."
        aria-label="Connection Status: Reconnecting. Tap to retry"
      >
        <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 animate-spin shrink-0" />
        <span className="hidden xs:inline sm:inline">Reconnecting...</span>
        <span className="xs:hidden">Retry</span>
      </button>
    );
  }

  // OFFLINE
  return (
    <button
      type="button"
      onClick={handleManualCheck}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[10.5px] sm:text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs cursor-pointer hover:bg-rose-100 transition-colors shrink-0 select-none"
      title="Offline Mode Active. Your drafts and work are safely stored on this device. Click to verify connection."
      aria-label="Connection Status: Offline. Your drafts and work are safely stored locally. Tap to verify connection"
    >
      <WifiOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600 shrink-0" />
      <span className="hidden sm:inline">Offline • Work Safe</span>
      <span className="sm:hidden font-bold">Offline</span>
    </button>
  );
};

export default ConnectionStatusBadge;
