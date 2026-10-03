/**
 * Central Reliability Engine
 * Education Department Liaquatabad Town Centre (DMC)
 */

export * from './reliabilityConstants.js';
export * from './reliabilitySecurity.js';
export * from './draftStorage.js';
export * from './connectionMonitor.js';
export * from './idempotencyManager.js';
export * from './retryManager.js';
export * from './draftManager.js';
export * from './syncQueue.js';

import { initConnectionMonitor } from './connectionMonitor.js';
import { runDraftMaintenance } from './draftManager.js';

/**
 * Initializes the global Reliability Engine on application bootstrap
 */
export const initializeReliabilityEngine = () => {
  if (typeof window !== 'undefined') {
    initConnectionMonitor();
    runDraftMaintenance().catch((err) => {
      console.warn('[ReliabilityEngine] Draft maintenance error:', err);
    });
  }
};
