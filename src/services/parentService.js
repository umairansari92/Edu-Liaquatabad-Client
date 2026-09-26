import apiClient from './apiClient.js';

/**
 * 🏛️ PARENT SERVICE (Frontend API Bridge)
 * Education Department Liaquatabad Town Centre (DMC) — School Management System
 *
 * Implements authoritative Parent Portal and Parent BFF communication:
 *   - Ward linking, claims, candidate lookup, OTP verification
 *   - Per-ward attendance intelligence, marksheet viewing, 1-click PDF download,
 *     homework assignments, and school circulars.
 */
const parentService = {
  /**
   * Fetch all authoritative verified wards linked to the authenticated parent.
   */
  async getMyWards() {
    const apiResponse = await apiClient.get('/parent/my-wards');
    return apiResponse.data?.data?.wards || [];
  },

  /**
   * Fetch all claims (PENDING_OTP, PENDING_HM_APPROVAL, VERIFIED, REJECTED, REVOKED).
   */
  async getMyClaims() {
    const apiResponse = await apiClient.get('/parent/my-claims');
    return apiResponse.data?.data?.claims || [];
  },

  /**
   * Anti-Enumeration Ward Candidate Lookup.
   */
  async lookupWard({ schoolId, grNumber }) {
    const apiResponse = await apiClient.post('/parent/lookup-ward', {
      schoolId,
      grNumber: Number(grNumber),
    });
    return apiResponse.data?.data;
  },

  /**
   * Initiate Ward Claim & Dispatch OTP to Official Guardian Phone.
   */
  async initiateClaim({ studentProfileId, relationship }) {
    const apiResponse = await apiClient.post('/parent/initiate-claim', {
      studentProfileId,
      relationship,
    });
    return apiResponse.data?.data;
  },

  /**
   * Verify Contact OTP to transition claim to PENDING_HM_APPROVAL.
   */
  async verifyClaimOtp({ linkId, otp }) {
    const apiResponse = await apiClient.post('/parent/verify-claim-otp', {
      linkId,
      otp: String(otp).trim(),
    });
    return apiResponse.data?.data;
  },

  /**
   * Fetch Ward Profile Particulars.
   */
  async getWardProfile(studentProfileId) {
    const apiResponse = await apiClient.get(`/parent/wards/${studentProfileId}/profile`);
    return apiResponse.data?.data;
  },

  /**
   * Fetch Ward Attendance Intelligence & History.
   */
  async getWardAttendance(studentProfileId) {
    const apiResponse = await apiClient.get(`/parent/wards/${studentProfileId}/attendance`);
    return apiResponse.data?.data;
  },

  /**
   * Fetch Ward Examination Marksheets (Published Only).
   */
  async getWardMarksheets(studentProfileId) {
    const apiResponse = await apiClient.get(`/parent/wards/${studentProfileId}/marksheets`);
    return apiResponse.data?.data?.marksheets || [];
  },

  /**
   * Stream & Download Official A4 Marksheet PDF for Ward.
   */
  async downloadWardMarksheetPdf(studentProfileId, examId, filename = 'Official_Marksheet.pdf') {
    try {
      const apiResponse = await apiClient.get(
        `/parent/wards/${studentProfileId}/marksheets/${examId}/download`,
        { responseType: 'blob' }
      );

      const downloadBlobUrl = window.URL.createObjectURL(
        new Blob([apiResponse.data], { type: 'application/pdf' })
      );
      const downloadAnchorLink = document.createElement('a');
      downloadAnchorLink.href = downloadBlobUrl;
      downloadAnchorLink.setAttribute('download', filename);
      document.body.appendChild(downloadAnchorLink);
      downloadAnchorLink.click();
      downloadAnchorLink.remove();
      window.URL.revokeObjectURL(downloadBlobUrl);

      return true;
    } catch (errorObject) {
      if (errorObject.response && errorObject.response.data instanceof Blob) {
        try {
          const rawTextContent = await errorObject.response.data.text();
          const parsedErrorJson = JSON.parse(rawTextContent);
          if (parsedErrorJson?.message) {
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
   * Fetch Ward Homework Assignments.
   */
  async getWardHomework(studentProfileId, queryParams = {}) {
    const apiResponse = await apiClient.get(`/parent/wards/${studentProfileId}/homework`, {
      params: queryParams,
    });
    return apiResponse.data?.data?.homework || [];
  },

  /**
   * Fetch Ward School & Municipal Circulars.
   */
  async getWardCirculars(studentProfileId) {
    const apiResponse = await apiClient.get(`/parent/wards/${studentProfileId}/circulars`);
    return apiResponse.data?.data?.circulars || [];
  },
};

export default parentService;
