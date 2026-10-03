import assert from 'node:assert/strict';
import { getErrorMessage, installSafeToastSafeguards } from '../src/utils/errorUtils.js';

console.log('🧪 Starting Error Utilities & Safe Toast Test Suite...\n');

// ── Test 1: Direct string handling
assert.strictEqual(
  getErrorMessage('Direct error message'),
  'Direct error message',
  'Should return string as-is'
);

assert.strictEqual(
  getErrorMessage('   Trimmed message   '),
  'Trimmed message',
  'Should trim string message'
);

// ── Test 2: Null and undefined fallbacks
assert.strictEqual(
  getErrorMessage(null, 'Custom fallback'),
  'Custom fallback',
  'Should return custom fallback for null'
);

assert.strictEqual(
  getErrorMessage(undefined),
  'An unexpected error occurred.',
  'Should return default fallback for undefined'
);

assert.strictEqual(
  getErrorMessage('   ', 'Whitespace fallback'),
  'Whitespace fallback',
  'Should return fallback when string is only whitespace'
);

// ── Test 3: Standard JavaScript Error objects
const standardError = new Error('Database connection timed out');
assert.strictEqual(
  getErrorMessage(standardError),
  'Database connection timed out',
  'Should extract message from standard Error'
);

// ── Test 4: Network Error handling
const networkError = new Error('Network Error');
assert.strictEqual(
  getErrorMessage(networkError),
  'Network connection issue. Please check your internet connectivity.',
  'Should return friendly network error for Network Error'
);

const codeNetworkError = new Error('Random message');
codeNetworkError.code = 'ERR_NETWORK';
assert.strictEqual(
  getErrorMessage(codeNetworkError),
  'Network connection issue. Please check your internet connectivity.',
  'Should return friendly network error for ERR_NETWORK'
);

// ── Test 5: Axios response with data.message
const axiosErrorWithMessage = {
  response: {
    status: 401,
    data: {
      success: false,
      message: 'Authentication token is required.',
    },
  },
};
assert.strictEqual(
  getErrorMessage(axiosErrorWithMessage),
  'Authentication token is required.',
  'Should extract response.data.message from AxiosError'
);

// ── Test 6: Axios response with data.error
const axiosErrorWithErrorField = {
  response: {
    status: 403,
    data: {
      success: false,
      error: 'Permission denied: HOMEWORK_CREATE required',
    },
  },
};
assert.strictEqual(
  getErrorMessage(axiosErrorWithErrorField),
  'Permission denied: HOMEWORK_CREATE required',
  'Should extract response.data.error from AxiosError'
);

// ── Test 7: RTK rejected action data.message
const rtkErrorPayload = {
  data: {
    message: 'Failed to assign homework section conflict',
  },
};
assert.strictEqual(
  getErrorMessage(rtkErrorPayload),
  'Failed to assign homework section conflict',
  'Should extract data.message from RTK rejected payload'
);

// ── Test 8: Empty or invalid object fallback
const unknownObject = { foo: 'bar', timestamp: 12345 };
assert.strictEqual(
  getErrorMessage(unknownObject, 'Safe fallback message'),
  'Safe fallback message',
  'Should return fallback for unrecognized object structure'
);

// ── Test 9: Global Toast Safeguard intercepts and sanitizes
let capturedToastMessage = null;
let capturedToastOptions = null;

const mockToast = {
  error: (msg, opts) => {
    capturedToastMessage = msg;
    capturedToastOptions = opts;
    return 'toast-id-123';
  },
};

installSafeToastSafeguards(mockToast);

// Trigger toast.error with a raw Error object (the exact cause of React child crash!)
mockToast.error(new Error('Objects are not valid as React child test!'), { duration: 3000 });
assert.strictEqual(typeof capturedToastMessage, 'string', 'Captured toast message MUST be a string');
assert.strictEqual(capturedToastMessage, 'Objects are not valid as React child test!');
assert.deepStrictEqual(capturedToastOptions, { duration: 3000 });

// Trigger toast.error with an Axios 401 error
mockToast.error(axiosErrorWithMessage);
assert.strictEqual(typeof capturedToastMessage, 'string', 'Captured message must be string');
assert.strictEqual(capturedToastMessage, 'Authentication token is required.');

// Trigger toast.error with null
mockToast.error(null);
assert.strictEqual(typeof capturedToastMessage, 'string', 'Captured message must be string on null');
assert.strictEqual(capturedToastMessage, 'An unexpected error occurred.');

console.log('✅ ALL ERROR UTILITY & TOAST SAFEGUARD TESTS PASSED (9/9)!\n');
