import { CONNECTION_STATUS, RELIABILITY_CONFIG } from './reliabilityConstants.js';

let currentStatus = typeof navigator !== 'undefined' && navigator.onLine ? CONNECTION_STATUS.ONLINE : CONNECTION_STATUS.OFFLINE;
const subscribers = new Set();
let pingIntervalId = null;

/**
 * Notifies all subscribed UI components and sync workers of state transition
 * @param {string} newStatus
 */
const notifySubscribers = (newStatus) => {
  currentStatus = newStatus;
  subscribers.forEach((callback) => {
    try {
      callback(newStatus);
    } catch (subscriberError) {
      console.error('[ConnectionMonitor] Subscriber error:', subscriberError);
    }
  });
};

/**
 * Actively probes backend health endpoint to verify actual HTTP reachability
 * (Guards against captive portals, dead Wi-Fi routers, and gateway interruptions)
 * @returns {Promise<boolean>}
 */
export const checkServerReachability = async () => {
  if (typeof fetch === 'undefined') return true;

  try {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), RELIABILITY_CONFIG.HEALTH_CHECK_TIMEOUT_MS);

    const healthUrl = `${RELIABILITY_CONFIG.HEALTH_CHECK_ENDPOINT}?_t=${Date.now()}`;
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache, no-store' },
      signal: abortController.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (probeError) {
    return false;
  }
};

/**
 * Evaluates connection and transitions state with active probing
 */
export const verifyConnectionState = async () => {
  const browserIsOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (!browserIsOnline) {
    if (currentStatus !== CONNECTION_STATUS.OFFLINE) {
      notifySubscribers(CONNECTION_STATUS.OFFLINE);
    }
    return false;
  }

  // Probe server
  const isServerReachable = await checkServerReachability();
  if (isServerReachable) {
    if (currentStatus !== CONNECTION_STATUS.ONLINE) {
      notifySubscribers(CONNECTION_STATUS.ONLINE);
    }
    return true;
  } else {
    if (currentStatus !== CONNECTION_STATUS.OFFLINE) {
      notifySubscribers(CONNECTION_STATUS.OFFLINE);
    }
    return false;
  }
};

/**
 * Initializes window event listeners and background ping probe
 */
export const initConnectionMonitor = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', async () => {
    notifySubscribers(CONNECTION_STATUS.RECONNECTING);
    await verifyConnectionState();
  });

  window.addEventListener('offline', () => {
    notifySubscribers(CONNECTION_STATUS.OFFLINE);
  });

  // Background active reachability check
  if (!pingIntervalId) {
    pingIntervalId = setInterval(() => {
      // Only verify if browser believes it is online
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        verifyConnectionState();
      }
    }, RELIABILITY_CONFIG.PING_INTERVAL_MS);
  }
};

/**
 * Subscribes a listener to connection status changes
 * @param {Function} callback (status) => void
 * @returns {Function} Unsubscribe cleanup function
 */
export const subscribeToConnectionStatus = (callback) => {
  subscribers.add(callback);
  callback(currentStatus); // Immediate invocation with current state
  return () => subscribers.delete(callback);
};

/**
 * Returns instantaneous connection state
 * @returns {string}
 */
export const getCurrentConnectionStatus = () => currentStatus;

/**
 * Manually updates connection state (e.g. while syncing)
 * @param {string} status
 */
export const setConnectionStatus = (status) => {
  notifySubscribers(status);
};
