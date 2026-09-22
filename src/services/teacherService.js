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
   * Fetch daily student attendance marking sheet for an assigned section on a specific date.
   */
  async getAttendanceSheet(sectionId, date) {
    const response = await apiClient.get('/attendance/sheet', {
      params: { sectionId, date },
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
   */
  async createHomework(payload) {
    const response = await apiClient.post('/homework', payload);
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
};

export default teacherService;
