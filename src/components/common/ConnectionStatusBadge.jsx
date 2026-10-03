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
        className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs"
        title="Live connection to DMC Liaquatabad Town Server established"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <Wifi className="w-3.5 h-3.5 text-emerald-600" />
        <span className="font-semibold">Online</span>
      </div>
    );
  }

  if (status === CONNECTION_STATUS.SYNCING) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 animate-pulse shadow-2xs"
        title="Synchronizing local drafts with DMC server..."
      >
        <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (status === CONNECTION_STATUS.RECONNECTING) {
    return (
      <button
        onClick={handleManualCheck}
        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs cursor-pointer hover:bg-amber-100 transition-colors"
        title="Reconnecting to municipal server. Click to retry."
      >
        <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
        <span>Reconnecting...</span>
      </button>
    );
  }

  // OFFLINE
  return (
    <button
      onClick={handleManualCheck}
      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs cursor-pointer hover:bg-rose-100 transition-colors"
      title="Offline Mode Active. Your drafts and work are safely stored on this device."
    >
      <WifiOff className="w-3.5 h-3.5 text-rose-600" />
      <span>Offline • Work Safe</span>
    </button>
  );
};

export default ConnectionStatusBadge;
