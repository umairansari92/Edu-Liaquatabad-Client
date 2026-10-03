import { SENSITIVE_PROHIBITED_KEYS } from './reliabilityConstants.js';

const PROTOTYPE_POLLUTION_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Recursively cleans draft payloads before saving to IndexedDB
 * 1. Blocks prototype pollution keys (__proto__, constructor, prototype)
 * 2. Purges sensitive authentication secrets (passwords, tokens, OTPs, MFA secrets)
 * 3. Strips NoSQL injection operators ($)
 * 4. Preserves multilingual strings (Urdu, Sindhi, Arabic, English, emoji, numbers)
 * 
 * @param {any} targetValue
 * @returns {any} Sanitized value
 */
export const sanitizeDraftPayload = (targetValue) => {
  if (targetValue === null || targetValue === undefined) {
    return targetValue;
  }

  // Primitive strings, numbers, booleans, dates
  if (typeof targetValue !== 'object') {
    return targetValue;
  }

  if (targetValue instanceof Date) {
    return targetValue;
  }

  if (Array.isArray(targetValue)) {
    return targetValue.map((element) => sanitizeDraftPayload(element));
  }

  const cleanedObject = {};
  for (const [key, value] of Object.entries(targetValue)) {
    // 1. Prototype pollution defense
    if (PROTOTYPE_POLLUTION_KEYS.has(key)) {
      console.warn(`[ReliabilitySecurity] Prototype pollution key [${key}] blocked from local draft.`);
      continue;
    }

    // 2. Sensitive credential leakage defense
    if (SENSITIVE_PROHIBITED_KEYS.has(key.toLowerCase())) {
      console.warn(`[ReliabilitySecurity] Sensitive credential key [${key}] stripped from local draft.`);
      continue;
    }

    // 3. NoSQL operator injection defense
    if (key.startsWith('$')) {
      console.warn(`[ReliabilitySecurity] NoSQL operator key [${key}] stripped from local draft.`);
      continue;
    }

    cleanedObject[key] = sanitizeDraftPayload(value);
  }

  return cleanedObject;
};

/**
 * Validates payload bounded memory limits to prevent local IndexedDB exhaustion attacks
 * @param {any} payload
 * @param {number} maxBytesLimit
 * @returns {boolean}
 */
export const isPayloadSizePermitted = (payload, maxBytesLimit = 5 * 1024 * 1024) => {
  try {
    const stringified = JSON.stringify(payload);
    return stringified.length <= maxBytesLimit;
  } catch (errorObject) {
    console.error('[ReliabilitySecurity] Payload size validation error:', errorObject);
    return false;
  }
};
