import apiClient from './apiClient.js';

/**
 * Supervisor Service
 * Dedicated API wrapper for Supervisor Operational Workspace.
 * Education Department Liaquatabad Town Centre (DMC)
 */
export const supervisorService = {
  /**
   * Fetch municipal schools assigned to this supervisor's cluster
   */
  async getAssignedSchools(params = {}) {
    const response = await apiClient.get('/schools', { params });
    return response.data?.data;
  },

  /**
   * Fetch detailed profile of a single municipal school (includes faculty roster)
   */
  async getSchoolDetails(schoolId) {
    const response = await apiClient.get(`/schools/${schoolId}`);
    return response.data?.data;
  },

  /**
   * Fetch attendance analytics for a specific assigned school
   */
  async getSchoolAttendanceAnalytics(schoolId) {
    const response = await apiClient.get(`/attendance/analytics/school/${schoolId}`);
    return response.data?.data;
  },

  /**
   * Fetch town-wide / cluster attendance overview
   */
  async getTownAttendanceOverview() {
    const response = await apiClient.get('/attendance/analytics/town-overview');
    return response.data?.data;
  },

  /**
   * Fetch section attendance intelligence
   */
  async getSectionAttendanceAnalytics(sectionId) {
    const response = await apiClient.get(`/attendance/analytics/section/${sectionId}`);
    return response.data?.data;
  },

  /**
   * Fetch inspection logs for supervisor's cluster
   */
  async getInspections(params = {}) {
    const response = await apiClient.get('/inspections', { params });
    return response.data?.data;
  },

  /**
   * Fetch single inspection report by ID
   */
  async getInspectionById(inspectionId) {
    const response = await apiClient.get(`/inspections/${inspectionId}`);
    return response.data?.data;
  },

  /**
   * Create a new school inspection record
   */
  async createInspection(payload) {
    const response = await apiClient.post('/inspections', payload);
    return response.data?.data;
  },

  /**
   * Update a draft inspection report
   */
  async updateInspection(inspectionId, payload) {
    const response = await apiClient.patch(`/inspections/${inspectionId}`, payload);
    return response.data?.data;
  },

  /**
   * Submit and finalize an inspection
   */
  async submitInspection(inspectionId) {
    const response = await apiClient.post(`/inspections/${inspectionId}/submit`);
    return response.data?.data;
  },

  /**
   * Formally close an inspection after directive remediation
   */
  async closeInspection(inspectionId, payload) {
    const response = await apiClient.patch(`/inspections/${inspectionId}/close`, payload);
    return response.data?.data;
  },

  /**
   * Fetch teacher transfer requests involving schools in the cluster
   */
  async getTransfers(params = {}) {
    const response = await apiClient.get('/transfers', { params });
    return response.data?.data;
  },

  /**
   * Fetch faculty/staff users across assigned cluster
   */
  async getFacultyUsers(params = {}) {
    const response = await apiClient.get('/users', { params });
    return response.data?.data;
  },
};

export default supervisorService;
