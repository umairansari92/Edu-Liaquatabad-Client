import apiClient from './apiClient.js';

export const staffProfileService = {
  /**
   * Get authorized staff profile dossier
   * @param {string} targetId - User ID or 'me'
   */
  getStaffProfile: async (targetId = 'me') => {
    const response = await apiClient.get(`/staff/${targetId}/profile`);
    return response.data;
  },

  /**
   * Update staff privacy settings and PDF consent toggle
   * @param {string} targetId
   * @param {Object} privacySettings
   */
  updatePrivacySettings: async (targetId = 'me', privacySettings) => {
    const response = await apiClient.patch(`/staff/${targetId}/privacy`, privacySettings);
    return response.data;
  },

  /**
   * Submit an official Profile Access / PDF Request
   * @param {string} targetId
   * @param {Object} payload - { purpose, requestedScope, expirationHours }
   */
  requestPdfAccess: async (targetId, payload) => {
    const response = await apiClient.post(`/staff/${targetId}/request-pdf-access`, payload);
    return response.data;
  },

  /**
   * Get audit access history for a staff profile
   * @param {string} targetId
   */
  getStaffAccessHistory: async (targetId = 'me') => {
    const response = await apiClient.get(`/staff/${targetId}/access-history`);
    return response.data;
  },

  /**
   * Download official Staff Service Record PDF
   * Temporary binary response - NEVER stored in Redux or persisted.
   * @param {string} targetId
   * @param {string} employeeId - For naming the downloaded file
   */
  downloadProfilePdf: async (targetId = 'me', employeeId = 'Staff') => {
    const response = await apiClient.get(`/staff/${targetId}/pdf`, {
      responseType: 'blob',
    });

    // Create transient browser object URL
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `ServiceRecord_${employeeId}_${Date.now()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Immediate revocation of temporary URL - no blob persists
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true, downloadedAt: new Date().toISOString() };
  },
};

export default staffProfileService;
