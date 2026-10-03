import {
  saveDraftRecord,
  getDraftRecord,
  deleteDraftRecord,
  listDraftRecordsForUser,
  purgeExpiredDrafts,
} from './draftStorage.js';
import { RELIABILITY_CONFIG, RELIABILITY_DRAFT_STATUS } from './reliabilityConstants.js';
import { isPayloadSizePermitted } from './reliabilitySecurity.js';

const debounceTimers = new Map();

/**
 * Builds a deterministic draft ID bound to the user session, module, and entity
 * @param {string} userSessionBinding
 * @param {string} module
 * @param {string} entityId
 * @returns {string}
 */
export const buildDraftId = (userSessionBinding, module, entityId = 'primary') => {
  return `${userSessionBinding}::${module}::${entityId}`;
};

/**
 * Saves a form draft with debounce protection to prevent disk churn during rapid typing
 * @param {Object} options
 * @param {string} options.userSessionBinding Authenticated actor identifier
 * @param {string} options.module Module name (e.g. 'attendance', 'homework', 'marks')
 * @param {string} [options.entityId='primary'] Scoped entity identifier
 * @param {any} options.payload Form state object
 * @param {number} [options.schemaVersion=1]
 * @param {number} [options.debounceMs=800]
 * @returns {Promise<boolean>}
 */
export const saveFormDraft = ({
  userSessionBinding,
  module,
  entityId = 'primary',
  payload,
  schemaVersion = 1,
  debounceMs = RELIABILITY_CONFIG.DRAFT_DEBOUNCE_MS,
}) => {
  if (!userSessionBinding || !module || !payload) {
    return Promise.resolve(false);
  }

  // Check bounded payload limit (5MB ceiling)
  if (!isPayloadSizePermitted(payload)) {
    console.warn('[DraftManager] Draft payload exceeds safety size limits, skipping autosave.');
    return Promise.resolve(false);
  }

  const draftId = buildDraftId(userSessionBinding, module, entityId);

  return new Promise((resolve) => {
    if (debounceTimers.has(draftId)) {
      clearTimeout(debounceTimers.get(draftId));
    }

    const timerId = setTimeout(async () => {
      debounceTimers.delete(draftId);

      const draftRecord = {
        draftId,
        userSessionBinding,
        module,
        entityId,
        payload,
        schemaVersion,
        status: RELIABILITY_DRAFT_STATUS.DRAFT,
        clientUpdatedAt: Date.now(),
      };

      const saveSuccess = await saveDraftRecord(draftRecord);
      resolve(saveSuccess);
    }, debounceMs);

    debounceTimers.set(draftId, timerId);
  });
};

/**
 * Retrieves an existing draft for the active user session and module
 * @param {string} userSessionBinding
 * @param {string} module
 * @param {string} [entityId='primary']
 * @returns {Promise<Object|null>} Draft payload or null
 */
export const loadFormDraft = async (userSessionBinding, module, entityId = 'primary') => {
  if (!userSessionBinding || !module) return null;

  const draftId = buildDraftId(userSessionBinding, module, entityId);
  const draftRecord = await getDraftRecord(draftId);

  if (!draftRecord) return null;

  // Verify account isolation (must match current authenticated session)
  if (draftRecord.userSessionBinding !== userSessionBinding) {
    console.warn('[DraftManager] Account isolation violation prevented: Draft user mismatch.');
    return null;
  }

  // Discard expired drafts (> 7 days)
  const draftAge = Date.now() - (draftRecord.updatedAt || draftRecord.clientUpdatedAt || 0);
  const maxAge = RELIABILITY_CONFIG.DRAFT_TTL_DAYS * 24 * 60 * 60 * 1000;
  if (draftAge > maxAge) {
    await deleteDraftRecord(draftId);
    return null;
  }

  return draftRecord;
};

/**
 * Discards a draft once the server mutation has succeeded
 * @param {string} userSessionBinding
 * @param {string} module
 * @param {string} [entityId='primary']
 * @returns {Promise<boolean>}
 */
export const clearFormDraft = async (userSessionBinding, module, entityId = 'primary') => {
  const draftId = buildDraftId(userSessionBinding, module, entityId);

  if (debounceTimers.has(draftId)) {
    clearTimeout(debounceTimers.get(draftId));
    debounceTimers.delete(draftId);
  }

  return deleteDraftRecord(draftId);
};

/**
 * Lists all active drafts for a given user
 * @param {string} userSessionBinding
 * @param {string} [module]
 * @returns {Promise<Array>}
 */
export const getUserDrafts = async (userSessionBinding, module = null) => {
  return listDraftRecordsForUser(userSessionBinding, module);
};

/**
 * Periodically prunes expired drafts
 */
export const runDraftMaintenance = async () => {
  return purgeExpiredDrafts(RELIABILITY_CONFIG.DRAFT_TTL_DAYS);
};
