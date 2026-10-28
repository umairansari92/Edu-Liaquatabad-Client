import apiClient from './apiClient.js';

export const announcementService = {
  /**
   * Public: Fetch currently active executive announcement
   * GET /api/v1/announcements/active
   */
  async getActiveAnnouncement() {
    try {
      const response = await apiClient.get('/announcements/active');
      return response.data?.data || null;
    } catch (fetchError) {
      // Safe fallback for network or server offline scenarios
      return null;
    }
  },

  /**
   * Protected: Fetch archived announcement history
   * GET /api/v1/announcements/history
   */
  async getAnnouncementHistory(page = 1, limit = 20) {
    const response = await apiClient.get('/announcements/history', {
      params: { page, limit },
    });
    return response.data?.data;
  },

  /**
   * Protected: Create executive announcement (Admins)
   * POST /api/v1/announcements
   */
  async createAnnouncement(payload) {
    const response = await apiClient.post('/announcements', payload);
    return response.data?.data;
  },

  /**
   * Protected: Archive executive announcement
   * PATCH /api/v1/announcements/:id/archive
   */
  async archiveAnnouncement(id) {
    const response = await apiClient.patch(`/announcements/${id}/archive`);
    return response.data?.data;
  },
};

export default announcementService;

