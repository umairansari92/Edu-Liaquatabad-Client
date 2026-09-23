import apiClient from './apiClient.js';

/**
 * Student Service
 * Authoritative API client wrapper for Student Operational Workspace.
 * Mediates communication with the BFF for student profile, examination results,
 * marksheet generation, homework, attendance analytics, and official circulars.
 */
export const studentService = {
  /**
   * Fetch authenticated student's sanitized profile and academic particulars.
   * Identity is derived strictly from session tokens on the server.
   */
  async getMyProfile() {
    const apiResponse = await apiClient.get('/students/my-profile');
    return apiResponse.data?.data;
  },

  /**
   * Fetch authenticated student's published examination results.
   * Unpublished drafts (DRAFT, SUBMITTED, VERIFIED_BY_HM) remain strictly filtered out.
   */
  async getMyExamResults(examinationId = null) {
    const requestParameters = {};
    if (examinationId) {
      requestParameters.examId = examinationId;
    }
    const apiResponse = await apiClient.get('/exams/my-results', {
      params: requestParameters,
    });
    return apiResponse.data?.data;
  },

  /**
   * Download authenticated student's computerized A4 official marksheet PDF.
   * Security: The server verifies that studentId matches request.user._id and status is PUBLISHED.
   * Validates MIME type to prevent accidental downloading of 403/404/500 JSON error responses as PDF blobs.
   */
  async downloadMyMarksheetPdf(examinationId, studentUserId, studentIdentifierLabel = 'Student') {
    try {
      const apiResponse = await apiClient.get(`/exams/${examinationId}/results/${studentUserId}/marksheet`, {
        responseType: 'blob',
      });

      // Defensive check: If server returned JSON with a 200 status, abort PDF download
      if (apiResponse.data?.type === 'application/json') {
        const errorText = await apiResponse.data.text();
        const parsedJson = JSON.parse(errorText);
        throw new Error(parsedJson.message || 'Server returned an error instead of a marksheet PDF.');
      }

      const marksheetBlob = new Blob([apiResponse.data], { type: 'application/pdf' });
      const objectUrlReference = window.URL.createObjectURL(marksheetBlob);
      const downloadAnchorElement = document.createElement('a');
      downloadAnchorElement.href = objectUrlReference;
      downloadAnchorElement.download = `Official_Marksheet_${studentIdentifierLabel}.pdf`;
      document.body.appendChild(downloadAnchorElement);
      downloadAnchorElement.click();
      downloadAnchorElement.remove();
      window.URL.revokeObjectURL(objectUrlReference);
      return true;
    } catch (errorObject) {
      // When axios uses responseType: 'blob', error responses are also delivered as Blobs
      if (errorObject.response?.data instanceof Blob) {
        try {
          const rawBlobText = await errorObject.response.data.text();
          const parsedErrorJson = JSON.parse(rawBlobText);
          if (parsedErrorJson.message) {
            errorObject.message = parsedErrorJson.message;
            if (errorObject.response.data) {
              errorObject.response.data.message = parsedErrorJson.message;
            }
          }
        } catch {
          // If blob text parsing fails, preserve original error message
        }
      }
      throw errorObject;
    }
  },

  /**
   * Fetch active classroom homework assignments assigned to the student's class and section.
   */
  async getMyHomework() {
    const apiResponse = await apiClient.get('/homework/student');
    return apiResponse.data?.data?.homework || [];
  },

  /**
   * Fetch multi-tier attendance analytics (Current Month, Last Month, Academic Session, Monthly Progression).
   */
  async getMyAttendanceAnalytics() {
    const apiResponse = await apiClient.get('/attendance/analytics/student');
    return apiResponse.data?.data;
  },

  /**
   * Fetch official circulars and documents published for students or general town circulation.
   */
  async getStudentCirculars(queryFilters = {}) {
    const apiResponse = await apiClient.get('/documents', {
      params: {
        category: 'all',
        status: 'PUBLISHED',
        ...queryFilters,
      },
    });
    return apiResponse.data?.data?.documents || [];
  },
};

export default studentService;
