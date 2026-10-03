/**
 * Central Reliability Engine Constants
 * Education Department Liaquatabad Town Centre (DMC)
 */

export const RELIABILITY_DRAFT_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  SYNCING: 'SYNCING',
  SYNCED: 'SYNCED',
  RETRY_WAIT: 'RETRY_WAIT',
  CONFLICT: 'CONFLICT',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  AUTH_FAILED: 'AUTH_FAILED',
  FORBIDDEN: 'FORBIDDEN',
  PERMANENT_FAILURE: 'PERMANENT_FAILURE',
});

export const CONNECTION_STATUS = Object.freeze({
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  RECONNECTING: 'RECONNECTING',
  SYNCING: 'SYNCING',
});

export const RELIABILITY_CONFIG = Object.freeze({
  DB_NAME: 'LiaquatabadSMS_ReliabilityDB',
  DB_VERSION: 1,
  STORE_DRAFTS: 'drafts',
  STORE_MUTATIONS: 'mutationQueue',
  DRAFT_TTL_DAYS: 7,
  DRAFT_DEBOUNCE_MS: 800,
  MAX_RETRY_ATTEMPTS: 5,
  INITIAL_RETRY_DELAY_MS: 1500,
  MAX_RETRY_DELAY_MS: 30000,
  BACKOFF_MULTIPLIER: 2,
  JITTER_RATIO: 0.25,
  BROADCAST_CHANNEL_NAME: 'liaquatabad_reliability_channel',
  HEALTH_CHECK_ENDPOINT: '/api/v1/health',
  HEALTH_CHECK_TIMEOUT_MS: 3500,
  PING_INTERVAL_MS: 25000,
});

export const SENSITIVE_PROHIBITED_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'otp',
  'devOtp',
  'mfaSecret',
  'mfaToken',
  'recoveryCodes',
  'secret',
  'apiSecret',
]);
