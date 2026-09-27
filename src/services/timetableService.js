import apiClient from './apiClient.js';

/**
 * BFF Timetable Service
 * Mediates all timetable management, live monitoring, and schedule retrieval.
 * Education Department Liaquatabad Town Centre (DMC)
 */
export const timetableService = {
  /**
   * Retrieves active timetable for a specific municipal school
   * @param {string} schoolId
   * @param {string} [academicYear]
   */
  getSchoolTimetable: async (schoolId, academicYear) => {
    const queryParams = {};
    if (academicYear) queryParams.academicYear = academicYear;
    const response = await apiClient.get(`/timetables/school/${schoolId}`, { params: queryParams });
    return response.data;
  },

  /**
   * Authoritative creation or in-place update of school timetable
   * @param {object} timetablePayload
   */
  manageTimetable: async (timetablePayload) => {
    const response = await apiClient.post('/timetables/manage', timetablePayload);
    return response.data;
  },

  /**
   * High-level live classroom monitor for Supervisors and Administrators
   */
  getTownLiveMonitor: async () => {
    const response = await apiClient.get('/timetables/town-live-monitor');
    return response.data;
  },

  /**
   * Personalized schedule resolver for Teachers, Students, and Parents
   * @param {object} [queryParams] - e.g. { studentId } for parents
   */
  getMySchedule: async (queryParams = {}) => {
    const response = await apiClient.get('/timetables/my-schedule', { params: queryParams });
    return response.data;
  },
};

export default timetableService;
