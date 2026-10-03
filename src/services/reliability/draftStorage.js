import { RELIABILITY_CONFIG } from './reliabilityConstants.js';
import { sanitizeDraftPayload } from './reliabilitySecurity.js';

let databaseInstance = null;
let isIndexedDbSupported = typeof window !== 'undefined' && 'indexedDB' in window;

// In-Memory Fallback Map (for private browsing restrictions or non-browser environments)
const inMemoryStore = {
  drafts: new Map(),
  mutationQueue: new Map(),
};

/**
 * Initializes and opens the native IndexedDB database
 * @returns {Promise<IDBDatabase|null>}
 */
export const openReliabilityDatabase = () => {
  if (!isIndexedDbSupported) {
    return Promise.resolve(null);
  }

  if (databaseInstance) {
    return Promise.resolve(databaseInstance);
  }

  return new Promise((resolve) => {
    try {
      const openRequest = window.indexedDB.open(
        RELIABILITY_CONFIG.DB_NAME,
        RELIABILITY_CONFIG.DB_VERSION
      );

      openRequest.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 1. Drafts Store: Unsubmitted forms & work-in-progress state
        if (!db.objectStoreNames.contains(RELIABILITY_CONFIG.STORE_DRAFTS)) {
          const draftsStore = db.createObjectStore(RELIABILITY_CONFIG.STORE_DRAFTS, {
            keyPath: 'draftId',
          });
          draftsStore.createIndex('userSessionBinding', 'userSessionBinding', { unique: false });
          draftsStore.createIndex('module', 'module', { unique: false });
          draftsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          draftsStore.createIndex('status', 'status', { unique: false });
        }

        // 2. Mutation Queue Store: Offline operations awaiting server sync
        if (!db.objectStoreNames.contains(RELIABILITY_CONFIG.STORE_MUTATIONS)) {
          const queueStore = db.createObjectStore(RELIABILITY_CONFIG.STORE_MUTATIONS, {
            keyPath: 'queueId',
          });
          queueStore.createIndex('userSessionBinding', 'userSessionBinding', { unique: false });
          queueStore.createIndex('status', 'status', { unique: false });
          queueStore.createIndex('createdAt', 'createdAt', { unique: false });
          queueStore.createIndex('idempotencyKey', 'idempotencyKey', { unique: true });
        }
      };

      openRequest.onsuccess = (event) => {
        databaseInstance = event.target.result;
        resolve(databaseInstance);
      };

      openRequest.onerror = (event) => {
        console.warn('[DraftStorage] IndexedDB open error, falling back to memory store:', event.target?.error);
        isIndexedDbSupported = false;
        resolve(null);
      };
    } catch (openException) {
      console.warn('[DraftStorage] IndexedDB initialization failed:', openException);
      isIndexedDbSupported = false;
      resolve(null);
    }
  });
};

// ─── DRAFT OPERATIONS ────────────────────────────────────────────────────────

/**
 * Saves a draft to IndexedDB
 * @param {Object} draftRecord
 * @returns {Promise<boolean>}
 */
export const saveDraftRecord = async (draftRecord) => {
  const sanitizedRecord = {
    ...draftRecord,
    payload: sanitizeDraftPayload(draftRecord.payload),
    updatedAt: Date.now(),
  };

  const db = await openReliabilityDatabase();
  if (!db) {
    inMemoryStore.drafts.set(sanitizedRecord.draftId, sanitizedRecord);
    return true;
  }

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([RELIABILITY_CONFIG.STORE_DRAFTS], 'readwrite');
      const store = transaction.objectStore(RELIABILITY_CONFIG.STORE_DRAFTS);
      const putRequest = store.put(sanitizedRecord);

      putRequest.onsuccess = () => resolve(true);
      putRequest.onerror = (putError) => {
        console.error('[DraftStorage] Failed to save draft:', putError);
        inMemoryStore.drafts.set(sanitizedRecord.draftId, sanitizedRecord);
        resolve(false);
      };
    } catch (txError) {
      console.error('[DraftStorage] Transaction error in saveDraft:', txError);
      inMemoryStore.drafts.set(sanitizedRecord.draftId, sanitizedRecord);
      resolve(false);
    }
  });
};

/**
 * Retrieves a single draft by ID
 * @param {string} draftId
 * @returns {Promise<Object|null>}
 */
export const getDraftRecord = async (draftId) => {
  const db = await openReliabilityDatabase();
  if (!db) {
    return inMemoryStore.drafts.get(draftId) || null;
  }

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([RELIABILITY_CONFIG.STORE_DRAFTS], 'readonly');
      const store = transaction.objectStore(RELIABILITY_CONFIG.STORE_DRAFTS);
      const getRequest = store.get(draftId);

      getRequest.onsuccess = () => resolve(getRequest.result || inMemoryStore.drafts.get(draftId) || null);
      getRequest.onerror = () => resolve(inMemoryStore.drafts.get(draftId) || null);
    } catch (txError) {
      resolve(inMemoryStore.drafts.get(draftId) || null);
    }
  });
};

/**
 * Removes a draft by ID upon successful submission or user discard
 * @param {string} draftId
 * @returns {Promise<boolean>}
 */
export const deleteDraftRecord = async (draftId) => {
  inMemoryStore.drafts.delete(draftId);

  const db = await openReliabilityDatabase();
  if (!db) return true;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([RELIABILITY_CONFIG.STORE_DRAFTS], 'readwrite');
      const store = transaction.objectStore(RELIABILITY_CONFIG.STORE_DRAFTS);
      const deleteRequest = store.delete(draftId);

      deleteRequest.onsuccess = () => resolve(true);
      deleteRequest.onerror = () => resolve(false);
    } catch (txError) {
      resolve(false);
    }
  });
};

/**
 * Lists all active drafts belonging to a specific user and optional module
 * @param {string} userSessionBinding
 * @param {string} [targetModule]
 * @returns {Promise<Array>}
 */
export const listDraftRecordsForUser = async (userSessionBinding, targetModule = null) => {
  const db = await openReliabilityDatabase();
  if (!db) {
    const memoryDrafts = Array.from(inMemoryStore.drafts.values()).filter(
      (draft) => draft.userSessionBinding === userSessionBinding && (!targetModule || draft.module === targetModule)
    );
    return memoryDrafts;
  }

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([RELIABILITY_CONFIG.STORE_DRAFTS], 'readonly');
      const store = transaction.objectStore(RELIABILITY_CONFIG.STORE_DRAFTS);
      const userIndex = store.index('userSessionBinding');
      const queryRequest = userIndex.getAll(userSessionBinding);

      queryRequest.onsuccess = () => {
        let results = queryRequest.result || [];
        if (targetModule) {
          results = results.filter((draft) => draft.module === targetModule);
        }
        resolve(results);
      };
      queryRequest.onerror = () => resolve([]);
    } catch (txError) {
      resolve([]);
    }
  });
};

// ─── MUTATION QUEUE OPERATIONS ───────────────────────────────────────────────

/**
 * Enqueues an offline mutation awaiting network transmission
 * @param {Object} mutationRecord
 * @returns {Promise<boolean>}
 */
export const enqueueMutationRecord = async (mutationRecord) => {
  const sanitizedRecord = {
    ...mutationRecord,
    payload: sanitizeDraftPayload(mutationRecord.payload),
    createdAt: mutationRecord.createdAt || Date.now(),
    retryCount: mutationRecord.retryCount || 0,
  };

  const db = await openReliabilityDatabase();
  if (!db) {
    inMemoryStore.mutationQueue.set(sanitizedRecord.queueId, sanitizedRecord);
    return true;
  }

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([RELIABILITY_CONFIG.STORE_MUTATIONS], 'readwrite');
      const store = transaction.objectStore(RELIABILITY_CONFIG.STORE_MUTATIONS);
      const putRequest = store.put(sanitizedRecord);

      putRequest.onsuccess = () => resolve(true);
      putRequest.onerror = () => {
        inMemoryStore.mutationQueue.set(sanitizedRecord.queueId, sanitizedRecord);
        resolve(false);
      };
    } catch (txError) {
      inMemoryStore.mutationQueue.set(sanitizedRecord.queueId, sanitizedRecord);
      resolve(false);
    }
  });
};

/**
 * Retrieves pending mutations for a specific user
 * @param {string} userSessionBinding
 * @returns {Promise<Array>}
 */
export const listPendingMutationsForUser = async (userSessionBinding) => {
  const db = await openReliabilityDatabase();
  if (!db) {
    return Array.from(inMemoryStore.mutationQueue.values()).filter(
      (item) => item.userSessionBinding === userSessionBinding
    );
  }

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([RELIABILITY_CONFIG.STORE_MUTATIONS], 'readonly');
      const store = transaction.objectStore(RELIABILITY_CONFIG.STORE_MUTATIONS);
      const userIndex = store.index('userSessionBinding');
      const queryRequest = userIndex.getAll(userSessionBinding);

      queryRequest.onsuccess = () => resolve(queryRequest.result || []);
      queryRequest.onerror = () => resolve([]);
    } catch (txError) {
      resolve([]);
    }
  });
};

/**
 * Updates a mutation queue record
 * @param {string} queueId
 * @param {Object} updates
 * @returns {Promise<boolean>}
 */
export const updateMutationRecord = async (queueId, updates) => {
  const db = await openReliabilityDatabase();
  if (!db) {
    const existing = inMemoryStore.mutationQueue.get(queueId);
    if (existing) {
      inMemoryStore.mutationQueue.set(queueId, { ...existing, ...updates });
    }
    return true;
  }

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([RELIABILITY_CONFIG.STORE_MUTATIONS], 'readwrite');
      const store = transaction.objectStore(RELIABILITY_CONFIG.STORE_MUTATIONS);
      const getRequest = store.get(queueId);

      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (!record) return resolve(false);

        const updatedRecord = { ...record, ...updates };
        const putRequest = store.put(updatedRecord);
        putRequest.onsuccess = () => resolve(true);
        putRequest.onerror = () => resolve(false);
      };
      getRequest.onerror = () => resolve(false);
    } catch (txError) {
      resolve(false);
    }
  });
};

/**
 * Removes a mutation from queue on final completion
 * @param {string} queueId
 * @returns {Promise<boolean>}
 */
export const deleteMutationRecord = async (queueId) => {
  inMemoryStore.mutationQueue.delete(queueId);

  const db = await openReliabilityDatabase();
  if (!db) return true;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([RELIABILITY_CONFIG.STORE_MUTATIONS], 'readwrite');
      const store = transaction.objectStore(RELIABILITY_CONFIG.STORE_MUTATIONS);
      const deleteRequest = store.delete(queueId);

      deleteRequest.onsuccess = () => resolve(true);
      deleteRequest.onerror = () => resolve(false);
    } catch (txError) {
      resolve(false);
    }
  });
};

// ─── LIFECYCLE & ACCOUNT ISOLATION ──────────────────────────────────────────

/**
 * Account Isolation: Purges all drafts and queued mutations for a user upon sign-out
 * Prevents subsequent users on a shared terminal from accessing prior drafts
 * @param {string} userSessionBinding
 * @returns {Promise<void>}
 */
export const clearUserRecords = async (userSessionBinding) => {
  // Clear from memory store
  for (const [draftId, draft] of inMemoryStore.drafts.entries()) {
    if (draft.userSessionBinding === userSessionBinding) inMemoryStore.drafts.delete(draftId);
  }
  for (const [queueId, mut] of inMemoryStore.mutationQueue.entries()) {
    if (mut.userSessionBinding === userSessionBinding) inMemoryStore.mutationQueue.delete(queueId);
  }

  const db = await openReliabilityDatabase();
  if (!db) return;

  try {
    const userDrafts = await listDraftRecordsForUser(userSessionBinding);
    for (const draftItem of userDrafts) {
      await deleteDraftRecord(draftItem.draftId);
    }

    const userMutations = await listPendingMutationsForUser(userSessionBinding);
    for (const mutationItem of userMutations) {
      await deleteMutationRecord(mutationItem.queueId);
    }
  } catch (clearError) {
    console.warn('[DraftStorage] Failed to clear user records on sign out:', clearError);
  }
};

/**
 * Purges drafts older than the configured TTL (7 days)
 * @param {number} [ttlDays=7]
 * @returns {Promise<number>} Count of purged drafts
 */
export const purgeExpiredDrafts = async (ttlDays = RELIABILITY_CONFIG.DRAFT_TTL_DAYS) => {
  const cutoffTime = Date.now() - ttlDays * 24 * 60 * 60 * 1000;
  let purgedCount = 0;

  // Purge from memory store
  for (const [draftId, draft] of inMemoryStore.drafts.entries()) {
    if (draft.updatedAt < cutoffTime) {
      inMemoryStore.drafts.delete(draftId);
      purgedCount++;
    }
  }

  const db = await openReliabilityDatabase();
  if (!db) return purgedCount;

  try {
    const transaction = db.transaction([RELIABILITY_CONFIG.STORE_DRAFTS], 'readwrite');
    const store = transaction.objectStore(RELIABILITY_CONFIG.STORE_DRAFTS);
    const updatedIndex = store.index('updatedAt');
    const keyRange = IDBKeyRange.upperBound(cutoffTime);
    const cursorRequest = updatedIndex.openCursor(keyRange);

    cursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        purgedCount++;
        cursor.continue();
      }
    };
  } catch (purgeError) {
    console.warn('[DraftStorage] Automated draft expiration sweep encountered error:', purgeError);
  }

  return purgedCount;
};
