import { RELIABILITY_CONFIG } from './reliabilityConstants.js';

/**
 * Determines whether an API error represents a transient failure eligible for automatic retry
 * 
 * Retryable:
 * - Network drops, connection resets, DNS failures, timeouts
 * - 408 Request Timeout
 * - 429 Too Many Requests
 * - 500 Internal Server Error (transient)
 * - 502 Bad Gateway
 * - 503 Service Unavailable (System outage)
 * - 504 Gateway Timeout
 * 
 * Non-Retryable (Halts auto-retry to prevent abuse/privilege bypass):
 * - 400 Bad Request / Schema validation failure
 * - 401 Unauthorized (Triggers token refresh, not queue replay)
 * - 403 Forbidden / BOLA tripwire / Scope boundary
 * - 404 Not Found
 * - 409 Conflict (Idempotency mismatch / optimistic concurrency collision)
 * - 422 Unprocessable Entity
 * 
 * @param {Object} error
 * @returns {boolean}
 */
export const isRetryableError = (error) => {
  if (!error) return false;

  // 1. Connection / Timeout / Network errors (no HTTP response received)
  if (!error.response) {
    return true;
  }

  const statusCode = error.response.status;

  if (statusCode === 408 || statusCode === 429) {
    return true;
  }

  // 409 Conflict with explicit retryable flag (e.g. server-side MUTATION_IN_FLIGHT in-flight lease)
  // allows client to backoff and reconcile the in-flight execution result rather than hard-failing
  if (statusCode === 409 && error.response?.data?.retryable === true) {
    return true;
  }

  // 5xx Server Errors
  if (statusCode >= 500 && statusCode <= 504) {
    return true;
  }

  // Explicit non-retryable status codes
  return false;
};

/**
 * Computes exponential backoff delay with randomized jitter to prevent thundering herd
 * @param {number} retryCount Current retry attempt (0-indexed)
 * @param {string|number} [retryAfterHeader] Value of HTTP 'Retry-After' header if present
 * @returns {number} Delay in milliseconds
 */
export const computeBackoffDelay = (retryCount, retryAfterHeader = null) => {
  if (retryAfterHeader) {
    const parsedSeconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
      return parsedSeconds * 1000;
    }
  }

  const exponentialDelay =
    RELIABILITY_CONFIG.INITIAL_RETRY_DELAY_MS *
    Math.pow(RELIABILITY_CONFIG.BACKOFF_MULTIPLIER, Math.min(retryCount, 6));

  // Add random jitter (+/- jitterRatio)
  const jitterRange = exponentialDelay * RELIABILITY_CONFIG.JITTER_RATIO;
  const randomizedJitter = (Math.random() * 2 - 1) * jitterRange;
  const totalDelay = exponentialDelay + randomizedJitter;

  return Math.min(
    Math.max(totalDelay, RELIABILITY_CONFIG.INITIAL_RETRY_DELAY_MS),
    RELIABILITY_CONFIG.MAX_RETRY_DELAY_MS
  );
};

/**
 * Asynchronous pause helper
 * @param {number} delayMilliseconds
 * @returns {Promise<void>}
 */
export const delay = (delayMilliseconds) =>
  new Promise((resolve) => setTimeout(resolve, delayMilliseconds));
