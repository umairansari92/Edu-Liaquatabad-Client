/**
 * Staff Attendance Service
 * Education Department Liaquatabad Town Centre (DMC)
 *
 * Handles staff self-submissions, approval queues, office staff terminal marking,
 * and Super Admin direct attendance flows.
 */

import apiClient from './apiClient.js';

export const staffAttendanceService = {
  /**
   * School staff member self-submits attendance for the day (awaiting HM approval)
   * @param {Object} payload { attendanceDate: 'YYYY-MM-DD' }
   */
  submitStaffAttendance: async (payload = {}) => {
    const response = await apiClient.post('/staff-attendance/submit', payload);
    return response.data;
  },

  /**
   * View authenticated staff member's own attendance history with timestamps and approver details
   * @param {Object} params { month, year, page, limit }
   */
  getMyStaffAttendanceHistory: async (params = {}) => {
    const response = await apiClient.get('/staff-attendance/my-history', { params });
    return response.data;
  },

  /**
   * Super Admin marks attendance for office staff member from the office terminal
   * @param {Object} payload { staffUserId, attendanceDate, status, remarks }
   */
  superAdminMarkOfficeStaff: async (payload = {}) => {
    const response = await apiClient.post('/staff-attendance/office-mark', payload);
    return response.data;
  },

  /**
   * Super Admin marks their own daily attendance (self-effective, immediately approved)
   * @param {Object} payload { attendanceDate: 'YYYY-MM-DD' }
   */
  superAdminSelfAttendance: async (payload = {}) => {
    const response = await apiClient.post('/staff-attendance/super-admin-self', payload);
    return response.data;
  },

  /**
   * View office staff attendance roster for a given date (Super Admin terminal view)
   * @param {Object} params { date: 'YYYY-MM-DD' }
   */
  getOfficeStaffAttendanceRoster: async (params = {}) => {
    const response = await apiClient.get('/staff-attendance/office-roster', { params });
    return response.data;
  },

  /**
   * Scoped query of staff attendance records with status, date, and pagination filters
   * @param {Object} params { date, status, staffCategory, page, limit, schoolId }
   */
  getStaffAttendanceRecords: async (params = {}) => {
    const response = await apiClient.get('/staff-attendance/records', { params });
    return response.data;
  },
};

export default staffAttendanceService;
