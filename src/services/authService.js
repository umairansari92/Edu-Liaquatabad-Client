import apiClient from './apiClient.js';

export const authService = {
  // ─── Authentication ─────────────────────────────────────────────────────────
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh-token', {});
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  getCaptcha: async () => {
    const response = await apiClient.get('/auth/captcha');
    return response.data;
  },

  // ─── Multi-Factor Authentication (MFA) ──────────────────────────────────────
  mfaSetup: async ({ mfaPendingToken, password } = {}) => {
    const payload = {};
    if (mfaPendingToken) payload.mfaPendingToken = mfaPendingToken;
    if (password) payload.password = password;
    const response = await apiClient.post('/auth/mfa/setup', payload);
    return response.data;
  },

  mfaConfirm: async ({ totpCode, mfaPendingToken }) => {
    const payload = { totpCode };
    if (mfaPendingToken) payload.mfaPendingToken = mfaPendingToken;
    const response = await apiClient.post('/auth/mfa/confirm', payload);
    return response.data;
  },

  mfaVerifyLogin: async ({ totpCode, mfaPendingToken }) => {
    const response = await apiClient.post('/auth/mfa/verify-login', {
      totpCode,
      mfaPendingToken,
    });
    return response.data;
  },

  mfaRecoveryLogin: async ({ recoveryCode, mfaPendingToken }) => {
    const response = await apiClient.post('/auth/mfa/recovery-login', {
      recoveryCode,
      mfaPendingToken,
    });
    return response.data;
  },

  getMfaStatus: async () => {
    const response = await apiClient.get('/auth/mfa/status');
    return response.data;
  },

  disableMfa: async (currentPassword) => {
    const response = await apiClient.post('/auth/mfa/disable', { currentPassword });
    return response.data;
  },

  regenerateRecoveryCodes: async (currentPassword) => {
    const response = await apiClient.post('/auth/mfa/regenerate-recovery-codes', {
      currentPassword,
    });
    return response.data;
  },

  // ─── Multi-Device Session Management ────────────────────────────────────────
  getActiveSessions: async () => {
    const response = await apiClient.get('/auth/sessions');
    return response.data;
  },

  terminateSession: async (sessionId) => {
    const response = await apiClient.delete(`/auth/sessions/${sessionId}`);
    return response.data;
  },
};

export default authService;
