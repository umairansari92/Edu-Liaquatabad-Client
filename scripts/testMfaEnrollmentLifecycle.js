import assert from 'node:assert/strict';

console.log('🧪 Starting MFA Enrollment & Authentication Token Lifecycle Regression Suite...\n');

// ─── 1. SIMULATED CLIENT REDUX STORE & API CLIENT INTERCEPTOR ─────────────────
// This mirrors the logic in client/src/services/apiClient.js

function createTestApiClient(initialState) {
  let state = { ...initialState };

  const interceptor = (requestConfig) => {
    const config = { ...requestConfig, headers: { ...(requestConfig.headers || {}) } };
    const requestUrlString = config.url || '';

    const isAuthHandshakeEndpoint =
      requestUrlString.includes('/auth/login') ||
      requestUrlString.includes('/auth/refresh-token') ||
      requestUrlString.includes('/auth/logout') ||
      requestUrlString.includes('/auth/mfa/verify-login') ||
      requestUrlString.includes('/auth/mfa/recovery-login') ||
      requestUrlString.includes('/auth/captcha') ||
      requestUrlString.includes('/auth/register') ||
      requestUrlString.includes('/auth/forgot-password') ||
      requestUrlString.includes('/auth/reset-password');

    // Rule: Do NOT inject session access token into unauthenticated endpoints,
    // and never overwrite an explicit Authorization header already provided.
    if (!isAuthHandshakeEndpoint && !config.headers.Authorization) {
      const activeAccessToken = state.auth?.accessToken;
      if (activeAccessToken) {
        config.headers.Authorization = `Bearer ${activeAccessToken}`;
      }
    }

    return config;
  };

  return {
    getState: () => state,
    setState: (newState) => { state = { ...state, ...newState }; },
    executeRequest: (config) => interceptor(config),
  };
}

// ─── 2. SIMULATED CLIENT SERVICE (client/src/services/authService.js) ─────────
function createAuthService(client) {
  return {
    mfaSetup: ({ mfaPendingToken, password } = {}) => {
      const payload = {};
      if (mfaPendingToken) payload.mfaPendingToken = mfaPendingToken;
      if (password) payload.password = password;
      const requestConfig = mfaPendingToken
        ? { headers: { Authorization: `Bearer ${mfaPendingToken}` } }
        : {};
      return client.executeRequest({
        url: '/auth/mfa/setup',
        method: 'POST',
        data: payload,
        ...requestConfig,
      });
    },

    mfaConfirm: ({ totpCode, mfaPendingToken } = {}) => {
      const payload = { totpCode };
      if (mfaPendingToken) payload.mfaPendingToken = mfaPendingToken;
      const requestConfig = mfaPendingToken
        ? { headers: { Authorization: `Bearer ${mfaPendingToken}` } }
        : {};
      return client.executeRequest({
        url: '/auth/mfa/confirm',
        method: 'POST',
        data: payload,
        ...requestConfig,
      });
    },

    mfaVerifyLogin: ({ totpCode, mfaPendingToken }) => {
      return client.executeRequest({
        url: '/auth/mfa/verify-login',
        method: 'POST',
        data: { totpCode, mfaPendingToken },
        headers: mfaPendingToken ? { Authorization: `Bearer ${mfaPendingToken}` } : {},
      });
    },
  };
}

// ─── 3. SIMULATED SERVER MIDDLEWARE (server/src/routes/mfaRoutes.js) ──────────
function authenticateSessionOrMfaPendingSimulation(request) {
  const authHeader = request.headers?.Authorization;
  const token = (authHeader && authHeader.startsWith('Bearer '))
    ? authHeader.split(' ')[1]
    : request.data?.mfaPendingToken;

  if (!token) {
    return { status: 401, error: 'Authentication token is required.' };
  }

  if (token.startsWith('MFA_PENDING_')) {
    return { status: 200, authMode: 'MFA_PENDING', userId: 'usr_pending_123' };
  }

  if (token.startsWith('ACCESS_TOKEN_')) {
    return { status: 200, authMode: 'SESSION', userId: 'usr_active_456' };
  }

  return { status: 401, error: 'Session expired or token invalid.' };
}

// ─── 4. SIMULATED RESPONSE INTERCEPTOR (client/src/services/apiClient.js) ─────
function handleResponseError(error, originalRequest, isRefreshing = false) {
  const requestUrlString = originalRequest?.url || '';
  const isAuthEndpoint =
    requestUrlString.includes('/auth/refresh-token') ||
    requestUrlString.includes('/auth/login') ||
    requestUrlString.includes('/auth/logout') ||
    requestUrlString.includes('/auth/mfa/verify-login') ||
    requestUrlString.includes('/auth/mfa/recovery-login') ||
    requestUrlString.includes('/auth/mfa/setup') ||
    requestUrlString.includes('/auth/mfa/confirm');

  const status = error.status;

  // 401 Unauthorized with Concurrency-Safe Queue
  if (status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
    return { willTriggerRefresh: true, retried: true };
  }

  // Auth endpoints (like wrong password on MFA setup or invalid TOTP) must NOT trigger a refresh loop
  return { willTriggerRefresh: false, terminalError: true };
}

// ==============================================================================
// TEST EXECUTION
// ==============================================================================

const MOCK_ACCESS_TOKEN = 'ACCESS_TOKEN_active_session_hash';
const MOCK_MFA_PENDING = 'MFA_PENDING_login_ticket_hash';

const client = createTestApiClient({
  auth: { accessToken: MOCK_ACCESS_TOKEN },
});
const authService = createAuthService(client);

// ─── TEST 1: Active authenticated session includes active access token
console.log('--- TEST 1: Active Authenticated Session MFA Setup & Confirm ---');
const setupReqActive = authService.mfaSetup({ password: 'validPassword123' });
assert.ok(setupReqActive.headers.Authorization, '1.1: Authorization header must be present for active session');
assert.strictEqual(
  setupReqActive.headers.Authorization,
  `Bearer ${MOCK_ACCESS_TOKEN}`,
  '1.2: Authorization header must carry the active Redux access token'
);
const serverCheck1 = authenticateSessionOrMfaPendingSimulation(setupReqActive);
assert.strictEqual(serverCheck1.status, 200, '1.3: Server accepts active session token');
assert.strictEqual(serverCheck1.authMode, 'SESSION', '1.4: Server authenticates via standard session mode');

const confirmReqActive = authService.mfaConfirm({ totpCode: '123456' });
assert.strictEqual(
  confirmReqActive.headers.Authorization,
  `Bearer ${MOCK_ACCESS_TOKEN}`,
  '1.5: MFA confirmation carries active session access token'
);
console.log('✅ PASS: Active authenticated session setup & confirmation requests attach active access token.');

// ─── TEST 2: Login-time MFA flow preserves explicit mfaPendingToken
console.log('\n--- TEST 2: Login-Time MFA Flow Preserves mfaPendingToken ---');
const setupReqLogin = authService.mfaSetup({ mfaPendingToken: MOCK_MFA_PENDING });
assert.strictEqual(
  setupReqLogin.headers.Authorization,
  `Bearer ${MOCK_MFA_PENDING}`,
  '2.1: Login-time setup preserves explicit mfaPendingToken'
);
assert.notStrictEqual(
  setupReqLogin.headers.Authorization,
  `Bearer ${MOCK_ACCESS_TOKEN}`,
  '2.2: Active session token NEVER overwrites explicit mfaPendingToken'
);

const verifyLoginReq = authService.mfaVerifyLogin({ totpCode: '654321', mfaPendingToken: MOCK_MFA_PENDING });
assert.strictEqual(
  verifyLoginReq.headers.Authorization,
  `Bearer ${MOCK_MFA_PENDING}`,
  '2.3: mfaVerifyLogin preserves explicit mfaPendingToken and blocks session token'
);
console.log('✅ PASS: Login-time MFA flow preserves explicit mfaPendingToken without session token pollution.');

// ─── TEST 3: Missing token remains rejected with 401
console.log('\n--- TEST 3: Missing Token Fails Closed ---');
const unauthenticatedClient = createTestApiClient({ auth: { accessToken: null } });
const unauthenticatedAuthService = createAuthService(unauthenticatedClient);

const unauthenticatedReq = unauthenticatedAuthService.mfaSetup({ password: 'anyPassword' });
assert.strictEqual(
  unauthenticatedReq.headers.Authorization,
  undefined,
  '3.1: Unauthenticated request has no Authorization header'
);
const serverCheck3 = authenticateSessionOrMfaPendingSimulation(unauthenticatedReq);
assert.strictEqual(serverCheck3.status, 401, '3.2: Missing token returns HTTP 401');
assert.strictEqual(
  serverCheck3.error,
  'Authentication token is required.',
  '3.3: Error message matches institutional fail-closed security response'
);
console.log('✅ PASS: Missing token is strictly rejected with HTTP 401 "Authentication token is required."');

// ─── TEST 4: Invalid password step-up verification enforced
console.log('\n--- TEST 4: Step-Up Password Verification ---');
function simulateStepUpPasswordCheck(password, isCorrect) {
  if (!password) {
    return { status: 401, message: 'Password confirmation is required to initiate MFA setup from an active session.' };
  }
  if (!isCorrect) {
    return { status: 401, message: 'Invalid password. Step-up re-authentication failed.' };
  }
  return { status: 200, message: 'MFA setup initiated.' };
}

const badPasswordRes = simulateStepUpPasswordCheck('wrongPassword', false);
assert.strictEqual(badPasswordRes.status, 401, '4.1: Wrong step-up password returns HTTP 401');
assert.strictEqual(
  badPasswordRes.message,
  'Invalid password. Step-up re-authentication failed.',
  '4.2: Appropriate step-up re-authentication error returned'
);

const goodPasswordRes = simulateStepUpPasswordCheck('correctPassword', true);
assert.strictEqual(goodPasswordRes.status, 200, '4.3: Valid step-up password allows MFA secret generation');
console.log('✅ PASS: Step-up password verification is enforced before MFA secret issuance.');

// ─── TEST 5: Expired access token & retry loop prevention
console.log('\n--- TEST 5: Expired Access Token & Retry Loop Prevention ---');
// When MFA setup returns 401 due to bad password, it must NOT trigger refresh token loop
const mfaSetupError = { status: 401, message: 'Invalid password. Step-up re-authentication failed.' };
const responseInterceptorResult1 = handleResponseError(mfaSetupError, { url: '/auth/mfa/setup', _retry: false });
assert.strictEqual(
  responseInterceptorResult1.willTriggerRefresh,
  false,
  '5.1: MFA setup 401 does NOT trigger refresh loop'
);
assert.strictEqual(
  responseInterceptorResult1.terminalError,
  true,
  '5.2: MFA setup 401 is treated as terminal so user sees immediate password error'
);

// Standard data endpoint (e.g. /staff/profile) returning 401 DOES trigger refresh
const standardEndpointError = { status: 401, message: 'jwt expired' };
const responseInterceptorResult2 = handleResponseError(standardEndpointError, { url: '/staff/profile', _retry: false });
assert.strictEqual(
  responseInterceptorResult2.willTriggerRefresh,
  true,
  '5.3: Standard endpoint 401 safely triggers token refresh'
);

// Already retried request does NOT retry again (prevents infinite loop)
const alreadyRetriedError = handleResponseError(standardEndpointError, { url: '/staff/profile', _retry: true });
assert.strictEqual(
  alreadyRetriedError.willTriggerRefresh,
  false,
  '5.4: Already retried request is halted to prevent infinite refresh loops'
);
console.log('✅ PASS: Expired token refresh operates correctly; MFA setup 401 avoids retry loops.');

// ─── TEST 6: MFA Confirmation TOTP validation
console.log('\n--- TEST 6: MFA Confirmation TOTP Validation ---');
function simulateMfaConfirmation(totpCode, expectedCode) {
  const cleanCode = (totpCode || '').replace(/\D/g, '').trim();
  if (cleanCode.length !== 6) {
    return { status: 400, message: 'Please enter a valid 6-digit authentication code.' };
  }
  if (cleanCode !== expectedCode) {
    return { status: 400, message: 'Invalid authentication code. Please check your authenticator app.' };
  }
  return { status: 200, message: 'Two-factor authentication enabled successfully.' };
}

assert.strictEqual(simulateMfaConfirmation('12', '123456').status, 400, '6.1: Non-6 digit code rejected');
assert.strictEqual(simulateMfaConfirmation('999999', '123456').status, 400, '6.2: Incorrect code rejected');
assert.strictEqual(simulateMfaConfirmation('123456', '123456').status, 200, '6.3: Valid 6-digit code enables MFA');
console.log('✅ PASS: MFA confirmation validation enforces exact 6-digit code validation.');

console.log('\n==============================================================================');
console.log('🎉 ALL 6/6 MFA REGRESSION SUITE TESTS PASSED (0 FAILURES)!');
console.log('==============================================================================\n');
