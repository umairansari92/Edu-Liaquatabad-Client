import apiClient from './apiClient.js';

/**
 * Teacher Service
 * Authoritative API client wrapper for Teacher Operational Workspace.
 */
export const teacherService = {
  /**
   * Fetch authenticated teacher's workspace overview, assigned classes & sections,
   * active subjects, student counts, and today's attendance status.
   */
  async getTeacherWorkspaceSummary() {
    const response = await apiClient.get('/academic/teacher-summary');
    return response.data?.data;
  },

  /**
   * Fetch current authenticated teacher's formal teaching duties & subject assignments.
   */
  async getMyTeachingAssignments() {
    const response = await apiClient.get('/assignments/my');
    return response.data?.data;
  },

  /**
   * Fetch enrolled students roster for an assigned section.
   */
  async getSectionStudentRoster(sectionId) {
    const response = await apiClient.get(`/students/section/${sectionId}`);
    return response.data?.data;
  },

  /**
   * Fetch daily student attendance marking sheet for an assigned section or authorized proxy section on a specific date.
   */
  async getAttendanceSheet(sectionId, date, options = {}) {
    const params = { sectionId, date };
    if (options.isProxy) {
      params.isProxy = true;
      if (options.proxyReason) params.proxyReason = options.proxyReason;
    }
    const response = await apiClient.get('/attendance/sheet', {
      params,
    });
    return response.data?.data;
  },

  /**
   * Fetch eligible classes/sections whose assigned teacher is on leave or absent today for proxy coverage.
   */
  async getEligibleProxySections(date = '') {
    const response = await apiClient.get('/attendance/eligible-proxy-sections', {
      params: date ? { date } : {},
    });
    return response.data?.data;
  },

  /**
   * Submit classroom attendance for enrolled students.
   */
  async submitStudentAttendance(payload) {
    const response = await apiClient.post('/attendance/submit', payload);
    return response.data;
  },

  /**
   * Fetch monthly attendance register matrix for an assigned section.
   */
  async getAttendanceRegister(sectionId, month, year) {
    const response = await apiClient.get('/attendance/register', {
      params: { sectionId, month, year },
    });
    return response.data?.data;
  },

  /**
   * Clear missed attendance for an unrecorded past working day (HM / Admin only).
   */
  async clearMissedAttendance(payload) {
    const response = await apiClient.post('/attendance/clear-missed', payload);
    return response.data;
  },

  /**
   * Fetch scheduled examinations list for the teacher's school.
   */
  async getSchoolExams() {
    const response = await apiClient.get('/exams');
    return response.data?.data?.exams || [];
  },

  /**
   * Fetch exam marks entry roster for an exam + class + section + optional subject.
   */
  async getExamMarksEntryRoster(examId, classId, sectionId, subjectId) {
    const response = await apiClient.get(`/exams/${examId}/entry-roster`, {
      params: { classId, sectionId, subjectId },
    });
    return response.data?.data;
  },

  /**
   * Submit marks for a single student.
   */
  async submitSingleStudentMarks(examId, payload) {
    const response = await apiClient.post(`/exams/${examId}/results`, payload);
    return response.data;
  },

  /**
   * Bulk submit marks for an entire section/subject.
   */
  async bulkSubmitExamMarks(examId, payload) {
    const response = await apiClient.post(`/exams/${examId}/results/bulk`, payload);
    return response.data;
  },

  /**
   * Fetch active and past homework assignments created by this teacher.
   */
  async getMyHomework() {
    const response = await apiClient.get('/homework/my');
    return response.data?.data;
  },

  /**
   * Create a new homework assignment for an assigned class, section, and subject.
   * Supports both JSON and FormData multipart payloads.
   */
  async createHomework(payload) {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const requestConfig = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await apiClient.post('/homework', payload, requestConfig);
    return response.data?.data;
  },

  /**
   * Update an existing homework assignment.
   */
  async updateHomework(homeworkId, payload) {
    const response = await apiClient.patch(`/homework/${homeworkId}`, payload);
    return response.data?.data;
  },

  /**
   * Cancel or archive a homework assignment.
   */
  async cancelHomework(homeworkId) {
    const response = await apiClient.delete(`/homework/${homeworkId}`);
    return response.data;
  },

  /**
   * Fetch official circulars and notices targeted to TEACHERS audience.
   */
  async getTeacherCirculars() {
    const response = await apiClient.get('/documents', {
      params: { category: 'all' },
    });
    return response.data?.data?.documents || [];
  },

  /**
   * Fetch authenticated teacher's own attendance history as recorded by HM.
   */
  async getTeacherSelfAttendance(month, year) {
    const response = await apiClient.get('/attendance/teachers/my-attendance', {
      params: { month, year },
    });
    return response.data?.data;
  },

  /**
   * Fetch authenticated teacher's Casual Leave (CL) balance.
   */
  async getClBalance(year) {
    const response = await apiClient.get('/leave/cl-balance', {
      params: year ? { year } : {},
    });
    return response.data?.clBalance;
  },

  /**
   * Fetch authenticated teacher's leave history & application statuses.
   */
  async getMyLeaveRequests(params = {}) {
    const response = await apiClient.get('/leave/my-requests', { params });
    return response.data?.leaveRequests || [];
  },

  /**
   * Submit a new Casual Leave (CL) or Earned Leave (EL) application.
   */
  async submitLeaveRequest(payload) {
    const response = await apiClient.post('/leave/submit', payload);
    return response.data;
  },

  /**
   * Request late attendance clearance from Head Master after submission window closes.
   */
  async requestLateAttendanceClearance(payload) {
    const response = await apiClient.post('/attendance/late-clearance/request', payload);
    return response.data;
  },

  /**
   * Fetch current late clearance request status for a section and attendance date.
   */
  async getLateAttendanceClearanceStatus(sectionId, date) {
    const response = await apiClient.get('/attendance/late-clearance/status', {
      params: { sectionId, date },
    });
    return response.data?.data?.clearance;
  },
};

export default teacherService;
