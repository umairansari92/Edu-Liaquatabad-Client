
import apiClient from './apiClient.js';

/**
 * BFF Head Master (HM) Service
 * Mediates all school operational governance between Redux thunks and Server API.
 * Education Department Liaquatabad Town Centre (DMC)
 */
export const hmService = {
  // ─── 1. Command Center & KPI Overview ─────────────────────────────────────────
  getSchoolSummary: async () => {
    const response = await apiClient.get('/academic/hm-summary');
    return response.data;
  },

  // ─── 2. Staff & Student Approvals ─────────────────────────────────────────────
  getPendingApprovals: async (type = 'staff') => {
    const response = await apiClient.get('/approvals/pending', { params: { type } });
    return response.data;
  },

  getApprovalDetail: async (userId) => {
    const response = await apiClient.get(`/approvals/${userId}/detail`);
    return response.data;
  },

  processApprovalDecision: async (userId, payload) => {
    const response = await apiClient.post(`/approvals/${userId}/decision`, payload);
    return response.data;
  },

  // ─── 3. Academic Structure (Classes, Sections, Subjects) ──────────────────────
  getClasses: async (params = {}) => {
    const response = await apiClient.get('/academic/classes', { params });
    return response.data;
  },

  createClass: async (data) => {
    const response = await apiClient.post('/academic/classes', data);
    return response.data;
  },

  updateClass: async (id, data) => {
    const response = await apiClient.patch(`/academic/classes/${id}`, data);
    return response.data;
  },

  getSections: async (params = {}) => {
    const response = await apiClient.get('/academic/sections', { params });
    return response.data;
  },

  createSection: async (data) => {
    const response = await apiClient.post('/academic/sections', data);
    return response.data;
  },

  updateSection: async (id, data) => {
    const response = await apiClient.patch(`/academic/sections/${id}`, data);
    return response.data;
  },

  getSubjects: async (params = {}) => {
    const response = await apiClient.get('/academic/subjects', { params });
    return response.data;
  },

  createSubject: async (data) => {
    const response = await apiClient.post('/academic/subjects', data);
    return response.data;
  },

  updateSubject: async (id, data) => {
    const response = await apiClient.patch(`/academic/subjects/${id}`, data);
    return response.data;
  },

  // ─── 4. Teaching Assignments (The Security Anchor) ────────────────────────────
  getSchoolTeachingAssignments: async () => {
    const response = await apiClient.get('/assignments/school');
    return response.data;
  },

  addTeachingAssignment: async (data) => {
    const response = await apiClient.post('/assignments', data);
    return response.data;
  },

  endTeachingAssignment: async (id, reason) => {
    const response = await apiClient.patch(`/assignments/${id}/end`, { reason });
    return response.data;
  },

  // ─── 5. Attendance Verification & Operations ──────────────────────────────────
  getSchoolAttendanceAnalytics: async () => {
    const response = await apiClient.get('/attendance/analytics/school');
    return response.data;
  },

  verifyAttendance: async (id, remarks = '') => {
    const response = await apiClient.patch(`/attendance/${id}/verify`, { remarks });
    return response.data;
  },

  uploadAttendanceSheet: async (data) => {
    const response = await apiClient.post('/attendance/upload-sheet', data);
    return response.data;
  },

  // ─── 6. Examinations & Results ────────────────────────────────────────────────
  getExams: async () => {
    const response = await apiClient.get('/exams');
    return response.data;
  },

  createExam: async (data) => {
    const response = await apiClient.post('/exams', data);
    return response.data;
  },

  getExamResults: async (examId, params = {}) => {
    const response = await apiClient.get(`/exams/${examId}/results`, { params });
    return response.data;
  },

  submitStudentMarks: async (examId, data) => {
    const response = await apiClient.post(`/exams/${examId}/results`, data);
    return response.data;
  },

  verifyExamResult: async (resultId, remarks = '') => {
    const response = await apiClient.patch(`/exams/results/${resultId}/verify`, { remarks });
    return response.data;
  },

  batchVerifyExamResults: async (examId, data = {}) => {
    const response = await apiClient.post(`/exams/${examId}/results/batch-verify`, data);
    return response.data;
  },

  publishExamResults: async (examId) => {
    const response = await apiClient.post(`/exams/${examId}/publish`);
    return response.data;
  },

  downloadStudentMarksheetPdf: async (examId, studentId) => {
    const response = await apiClient.get(`/exams/${examId}/results/${studentId}/marksheet`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `Marksheet_${studentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
    return true;
  },

  downloadClassTabulationPdf: async (examId, classId, sectionId) => {
    const params = { classId };
    if (sectionId) params.sectionId = sectionId;
    const response = await apiClient.get(`/exams/${examId}/tabulation-sheet`, {
      params,
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `TabulationSheet_${classId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
    return true;
  },

  getClassTabulationData: async (examId, params = {}) => {
    const response = await apiClient.get(`/exams/${examId}/tabulation-data`, { params });
    return response.data;
  },

  // ─── 7. Faculty Transfers & Postings ─────────────────────────────────────────
  getTransfers: async (params = {}) => {
    const response = await apiClient.get('/transfers', { params });
    return response.data;
  },

  getTransferById: async (id) => {
    const response = await apiClient.get(`/transfers/${id}`);
    return response.data;
  },

  relieveTransferFaculty: async (id, payload) => {
    const response = await apiClient.patch(`/transfers/${id}/relieve`, payload);
    return response.data;
  },

  approveTransferJoining: async (id, payload) => {
    const response = await apiClient.patch(`/transfers/${id}/approve-joining`, payload);
    return response.data;
  },

  rejectTransferJoining: async (id, payload) => {
    const response = await apiClient.patch(`/transfers/${id}/reject`, payload);
    return response.data;
  },

  // ─── 8. School Circulars & Notices ────────────────────────────────────────────
  getDocuments: async (params = {}) => {
    const response = await apiClient.get('/documents', { params });
    return response.data;
  },

  createDocument: async (data) => {
    // Automatically handles FormData (multipart/form-data) or JSON payload
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const response = await apiClient.post('/documents', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  archiveDocument: async (id) => {
    const response = await apiClient.patch(`/documents/${id}/archive`);
    return response.data;
  },

  deleteDocument: async (id, reason = '') => {
    const response = await apiClient.delete(`/documents/${id}`, { data: { reason } });
    return response.data;
  },

  getViewDocumentUrl: async (id) => {
    const response = await apiClient.get(`/documents/${id}/view`);
    return response.data;
  },

  // ─── 9. Student Directory & Identity Management ──────────────────────────────
  getSchoolStudents: async (params = {}, options = {}) => {
    const response = await apiClient.get('/students/school', {
      params,
      signal: options.signal,
    });
    return response.data;
  },

  setSchoolCode: async (schoolId, schoolCode) => {
    const response = await apiClient.patch(`/students/schools/${schoolId}/code`, { schoolCode });
    return response.data;
  },

  // ─── 10. Teaching Faculty & Daily Staff Attendance ───────────────────────────
  getSchoolFaculty: async (params = {}, options = {}) => {
    const response = await apiClient.get('/staff/school', {
      params,
      signal: options.signal,
    });
    return response.data;
  },

  getTeacherDailyAttendance: async (params = {}) => {
    const response = await apiClient.get('/attendance/teachers/daily', { params });
    return response.data;
  },

  saveTeacherDailyAttendance: async (payload) => {
    const response = await apiClient.post('/attendance/teachers/daily', payload);
    return response.data;
  },
};

export default hmService;

