import apiClient from './apiClient.js';

export const notificationService = {
  /**
   * Fetch paginated notifications for current user
   * @param {Object} params - { page, limit, category, unreadOnly }
   */
  getNotifications: async (params = {}) => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  /**
   * Mark a single notification as read
   * @param {string} notificationId
   */
  markAsRead: async (notificationId) => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read for current user
   */
  markAllAsRead: async () => {
    const response = await apiClient.patch('/notifications/mark-all-read');
    return response.data;
  },

  /**
   * Respond to a staff profile PDF access consent request
   * @param {string} requestId
   * @param {Object} payload - { decision: 'ALLOW' | 'DENY', decisionRemarks }
   */
  respondToAccessRequest: async (requestId, payload) => {
    const response = await apiClient.post(`/notifications/access-requests/${requestId}/respond`, payload);
    return response.data;
  },
};

export default notificationService;
