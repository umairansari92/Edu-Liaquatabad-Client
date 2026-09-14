import apiClient from './apiClient.js';

/**
 * BFF Admin Service
 * Mediates all privileged operations between Redux thunks and Server API
 * Education Department Liaquatabad Town Centre (DMC)
 */
export const adminService = {
  getOverview: async () => {
    const response = await apiClient.get('/admin/super-admins/overview');
    return response.data;
  },

  getAnalytics: async () => {
    const response = await apiClient.get('/admin/super-admins/analytics');
    return response.data;
  },

  getSuperAdmins: async () => {
    const response = await apiClient.get('/admin/super-admins');
    return response.data;
  },

  disableSuperAdmin: async (id, reason) => {
    const response = await apiClient.patch(`/admin/super-admins/${id}/disable`, { reason });
    return response.data;
  },

  demoteSuperAdmin: async (id, reason) => {
    const response = await apiClient.patch(`/admin/super-admins/${id}/demote`, { reason });
    return response.data;
  },

  grantAuthority: async (userId, payload) => {
    const response = await apiClient.post(`/admin/users/${userId}/authority`, payload);
    return response.data;
  },

  getUsers: async (params = {}) => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  updateUserLifecycle: async (id, payload) => {
    const response = await apiClient.patch(`/users/${id}/lifecycle`, payload);
    return response.data;
  },

  getSchools: async (params = {}) => {
    const response = await apiClient.get('/schools', { params });
    return response.data;
  },

  createSchool: async (data) => {
    const response = await apiClient.post('/schools', data);
    return response.data;
  },

  getPendingUsers: async () => {
    const response = await apiClient.get('/admin/super-admins/pending-users');
    return response.data;
  },

  getAuditLogs: async (params = {}) => {
    const response = await apiClient.get('/admin/super-admins/audit-logs', { params });
    return response.data;
  },

  flushLockouts: async (payload) => {
    const response = await apiClient.post('/admin/super-admins/flush-lockouts', payload);
    return response.data;
  },

  broadcastAlert: async (payload) => {
    const response = await apiClient.post('/admin/super-admins/broadcast', payload);
    return response.data;
  },
};

export default adminService;
