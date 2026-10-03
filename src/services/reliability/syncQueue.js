import {
  enqueueMutationRecord,
  listPendingMutationsForUser,
  updateMutationRecord,
  deleteMutationRecord,
} from './draftStorage.js';
import { clearFormDraft } from './draftManager.js';
import { RELIABILITY_CONFIG, RELIABILITY_DRAFT_STATUS, CONNECTION_STATUS } from './reliabilityConstants.js';
import { getOrCreateOperationKey, releaseOperationKey } from './idempotencyManager.js';
import { isRetryableError, computeBackoffDelay, delay } from './retryManager.js';
import { getCurrentConnectionStatus, setConnectionStatus, subscribeToConnectionStatus } from './connectionMonitor.js';

let isSyncInProgress = false;
let broadcastChannelInstance = null;

// Multi-Tab Coordination via Native BroadcastChannel
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannelInstance = new BroadcastChannel(RELIABILITY_CONFIG.BROADCAST_CHANNEL_NAME);
    broadcastChannelInstance.onmessage = (event) => {
      const message = event.data;
      if (message?.type === 'SYNC_STARTED') {
        isSyncInProgress = true;
      } else if (message?.type === 'SYNC_COMPLETED') {
        isSyncInProgress = false;
      }
    };
  } catch (bcError) {
    console.warn('[SyncQueue] BroadcastChannel unavailable, using in-tab sync locking.');
  }
}

const broadcastSyncMessage = (type, payload = {}) => {
  if (broadcastChannelInstance) {
    try {
      broadcastChannelInstance.postMessage({ type, payload, timestamp: Date.now() });
    } catch (e) {
      // Ignore broadcast errors
    }
  }
};

/**
 * Enqueues a failed or offline mutation for automated background synchronization
 * @param {Object} options
 * @param {string} options.userSessionBinding
 * @param {string} options.endpoint API URL (e.g. '/homework')
 * @param {string} options.method HTTP method (POST, PATCH, PUT, DELETE)
 * @param {any} options.payload Mutation payload
 * @param {string} options.module Module identifier
 * @param {string} [options.entityId='primary']
 * @param {string} [options.idempotencyKey]
 * @returns {Promise<string>} Queue ID
 */
export const queueOfflineMutation = async ({
  userSessionBinding,
  endpoint,
  method = 'POST',
  payload,
  module,
  entityId = 'primary',
  idempotencyKey = null,
}) => {
  const queueId = `${userSessionBinding}::${module}::${entityId}::${Date.now()}`;
  const stableIdempotencyKey = idempotencyKey || getOrCreateOperationKey(queueId);

  const mutationItem = {
    queueId,
    userSessionBinding,
    endpoint,
    method: method.toUpperCase(),
    payload,
    module,
    entityId,
    idempotencyKey: stableIdempotencyKey,
    status: RELIABILITY_DRAFT_STATUS.PENDING,
    retryCount: 0,
    createdAt: Date.now(),
    lastErrorCode: null,
    lastErrorMessage: null,
  };

  await enqueueMutationRecord(mutationItem);
  broadcastSyncMessage('MUTATION_QUEUED', { queueId, module });
  return queueId;
};

/**
 * Executes synchronization sweep across pending mutations for the active user
 * @param {Object} apiClient Axios API client instance
 * @param {string} userSessionBinding Active user identifier
 * @returns {Promise<{ total: number, succeeded: number, failed: number }>}
 */
export const processPendingSyncQueue = async (apiClient, userSessionBinding) => {
  if (isSyncInProgress || !userSessionBinding || !apiClient) {
    return { total: 0, succeeded: 0, failed: 0 };
  }

  const connectionState = getCurrentConnectionStatus();
  if (connectionState === CONNECTION_STATUS.OFFLINE) {
    return { total: 0, succeeded: 0, failed: 0 };
  }

  isSyncInProgress = true;
  setConnectionStatus(CONNECTION_STATUS.SYNCING);
  broadcastSyncMessage('SYNC_STARTED', { userSessionBinding });

  let succeeded = 0;
  let failed = 0;

  try {
    const pendingList = await listPendingMutationsForUser(userSessionBinding);
    const eligibleMutations = pendingList.filter((item) =>
      [RELIABILITY_DRAFT_STATUS.PENDING, RELIABILITY_DRAFT_STATUS.RETRY_WAIT].includes(item.status)
    );

    for (const mutationItem of eligibleMutations) {
      await updateMutationRecord(mutationItem.queueId, {
        status: RELIABILITY_DRAFT_STATUS.SYNCING,
      });

      try {
        const response = await apiClient({
          method: mutationItem.method,
          url: mutationItem.endpoint,
          data: mutationItem.payload,
          headers: {
            'Idempotency-Key': mutationItem.idempotencyKey,
          },
        });

        // ✅ Success: 2xx response from server
        if (response.status >= 200 && response.status < 300) {
          await deleteMutationRecord(mutationItem.queueId);
          await clearFormDraft(userSessionBinding, mutationItem.module, mutationItem.entityId);
          releaseOperationKey(mutationItem.queueId);
          succeeded++;
        }
      } catch (mutationError) {
        const isTransient = isRetryableError(mutationError);
        const retryCount = (mutationItem.retryCount || 0) + 1;
        const statusCode = mutationError.response?.status;
        const errorMessage = mutationError.response?.data?.message || mutationError.message;

        if (isTransient && retryCount <= RELIABILITY_CONFIG.MAX_RETRY_ATTEMPTS) {
          // Transient error: Backoff and retry on next sweep
          const retryAfterHeader = mutationError.response?.headers?.['retry-after'];
          const backoffMs = computeBackoffDelay(retryCount, retryAfterHeader);

          await updateMutationRecord(mutationItem.queueId, {
            status: RELIABILITY_DRAFT_STATUS.RETRY_WAIT,
            retryCount,
            lastErrorCode: statusCode || 'NETWORK_ERROR',
            lastErrorMessage: errorMessage,
          });

          await delay(backoffMs);
        } else {
          // Permanent failure: Authorization / BOLA / Validation
          const finalStatus =
            statusCode === 403
              ? RELIABILITY_DRAFT_STATUS.FORBIDDEN
              : statusCode === 409
              ? RELIABILITY_DRAFT_STATUS.CONFLICT
              : statusCode === 400
              ? RELIABILITY_DRAFT_STATUS.VALIDATION_FAILED
              : RELIABILITY_DRAFT_STATUS.PERMANENT_FAILURE;

          await updateMutationRecord(mutationItem.queueId, {
            status: finalStatus,
            retryCount,
            lastErrorCode: statusCode || 'CLIENT_ERROR',
            lastErrorMessage: errorMessage,
          });
          failed++;
        }
      }
    }

    return { total: eligibleMutations.length, succeeded, failed };
  } finally {
    isSyncInProgress = false;
    setConnectionStatus(CONNECTION_STATUS.ONLINE);
    broadcastSyncMessage('SYNC_COMPLETED', { succeeded, failed });
  }
};

/**
 * Initializes automatic background synchronization triggered on connection recovery
 * @param {Object} apiClient
 * @param {Function} getUserBindingFunction Returns current userSessionBinding
 */
export const initAutoSync = (apiClient, getUserBindingFunction) => {
  subscribeToConnectionStatus(async (status) => {
    if (status === CONNECTION_STATUS.ONLINE || status === CONNECTION_STATUS.RECONNECTING) {
      const binding = getUserBindingFunction();
      if (binding) {
        await processPendingSyncQueue(apiClient, binding);
      }
    }
  });
};
