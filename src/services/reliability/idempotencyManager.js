const activeOperationKeys = new Map();

/**
 * Generates an RFC 4122 v4 UUID for request idempotency
 * @returns {string}
 */
export const generateIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Cryptographically secure fallback
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // Deterministic timestamp-random fallback
  return `01J${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;
};

/**
 * Returns existing stable idempotency key for an in-flight operation, or registers a new one
 * Guarantees identical key is transmitted across network retries
 * @param {string} operationId Unique operation identifier (e.g. "attendance_507f_2026-10-04")
 * @returns {string} Idempotency Key
 */
export const getOrCreateOperationKey = (operationId) => {
  if (!operationId) return generateIdempotencyKey();

  if (activeOperationKeys.has(operationId)) {
    return activeOperationKeys.get(operationId);
  }

  const newKey = generateIdempotencyKey();
  activeOperationKeys.set(operationId, newKey);
  return newKey;
};

/**
 * Clears the cached key when operation succeeds or is cancelled
 * @param {string} operationId
 */
export const releaseOperationKey = (operationId) => {
  if (operationId) {
    activeOperationKeys.delete(operationId);
  }
};
