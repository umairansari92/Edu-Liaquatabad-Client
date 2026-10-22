import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import staffProfileService from '../../services/staffProfileService.js';

export const fetchStaffProfile = createAsyncThunk(
  'staffProfile/fetchStaffProfile',
  async (targetId = 'me', { rejectWithValue }) => {
    try {
      const response = await staffProfileService.getStaffProfile(targetId);
      return response.data;
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to fetch staff profile dossier');
    }
  }
);

export const updateStaffPrivacySettings = createAsyncThunk(
  'staffProfile/updateStaffPrivacySettings',
  async ({ targetId, privacySettings }, { rejectWithValue }) => {
    try {
      const response = await staffProfileService.updatePrivacySettings(targetId, privacySettings);
      return response.data;
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to update privacy settings');
    }
  }
);

export const requestPdfAccess = createAsyncThunk(
  'staffProfile/requestPdfAccess',
  async ({ targetId, payload }, { rejectWithValue }) => {
    try {
      const response = await staffProfileService.requestPdfAccess(targetId, payload);
      return response.data;
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to submit official PDF access request');
    }
  }
);

/**
 * downloadStaffPdf thunk
 * CRITICAL: The PDF blob is handled ephemerally by the BFF service and NEVER stored in Redux.
 * Redux receives only metadata/status flags.
 */
export const downloadStaffPdf = createAsyncThunk(
  'staffProfile/downloadStaffPdf',
  async ({ targetId, employeeId }, { rejectWithValue }) => {
    try {
      const result = await staffProfileService.downloadProfilePdf(targetId, employeeId);
      return result; // { success: true, downloadedAt: '...' }
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to download official PDF service record');
    }
  }
);

export const fetchStaffAccessHistory = createAsyncThunk(
  'staffProfile/fetchStaffAccessHistory',
  async (targetId = 'me', { rejectWithValue }) => {
    try {
      const response = await staffProfileService.getStaffAccessHistory(targetId);
      return response.data;
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to fetch access audit history');
    }
  }
);

export const fetchProfileAttendance = createAsyncThunk(
  'staffProfile/fetchProfileAttendance',
  async ({ month, year, isTeachingStaff = true }, { rejectWithValue }) => {
    try {
      const data = await staffProfileService.getMyAttendance(month, year, isTeachingStaff);
      return data;
    } catch (attendanceError) {
      return rejectWithValue(attendanceError.message || 'Failed to fetch attendance muster record');
    }
  }
);

export const fetchProfileLeaveSummary = createAsyncThunk(
  'staffProfile/fetchProfileLeaveSummary',
  async (_, { rejectWithValue }) => {
    try {
      const data = await staffProfileService.getMyLeaveSummary();
      return data;
    } catch (leaveError) {
      return rejectWithValue(leaveError.message || 'Failed to fetch casual leave quota summary');
    }
  }
);

const initialState = {
  profileData: null,
  loading: false,
  error: null,

  // Privacy update state
  isUpdatingPrivacy: false,
  privacyUpdateSuccess: false,
  privacyUpdateError: null,

  // PDF access request state
  isRequestingPdf: false,
  pdfRequestSuccess: false,
  pdfRequestData: null,
  pdfRequestError: null,

  // PDF download state (NO BINARY IN STATE)
  isDownloadingPdf: false,
  pdfDownloadSuccess: false,
  pdfDownloadError: null,

  // Access audit history state
  accessHistory: [],
  loadingAccessHistory: false,
  accessHistoryError: null,

  // Attendance muster state for profile card
  attendanceData: null,
  loadingAttendance: false,
  attendanceError: null,

  // Casual leave state for profile card
  leaveSummary: { clBalance: null, leaveRequests: [] },
  loadingLeave: false,
  leaveError: null,
};

const staffProfileSlice = createSlice({
  name: 'staffProfile',
  initialState,
  reducers: {
    clearStaffProfileState: (state) => {
      state.profileData = null;
      state.error = null;
      state.accessHistory = [];
      state.attendanceData = null;
      state.leaveSummary = { clBalance: null, leaveRequests: [] };
    },
    resetPdfRequestState: (state) => {
      state.isRequestingPdf = false;
      state.pdfRequestSuccess = false;
      state.pdfRequestData = null;
      state.pdfRequestError = null;
    },
    resetPdfDownloadState: (state) => {
      state.isDownloadingPdf = false;
      state.pdfDownloadSuccess = false;
      state.pdfDownloadError = null;
    },
    resetPrivacyUpdateState: (state) => {
      state.isUpdatingPrivacy = false;
      state.privacyUpdateSuccess = false;
      state.privacyUpdateError = null;
    },
    updateFieldVisibilityOptimistic: (state, action) => {
      const { field, value } = action.payload;
      if (state.profileData?.profile?.privacySettings?.fieldVisibility) {
        state.profileData.profile.privacySettings.fieldVisibility[field] = value;
      }
      if (state.profileData?.privacySettings?.fieldVisibility) {
        state.profileData.privacySettings.fieldVisibility[field] = value;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile Dossier
      .addCase(fetchStaffProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaffProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profileData = action.payload;
      })
      .addCase(fetchStaffProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Privacy Settings
      .addCase(updateStaffPrivacySettings.pending, (state) => {
        state.isUpdatingPrivacy = true;
        state.privacyUpdateSuccess = false;
        state.privacyUpdateError = null;
      })
      .addCase(updateStaffPrivacySettings.fulfilled, (state, action) => {
        state.isUpdatingPrivacy = false;
        state.privacyUpdateSuccess = true;
        const updatedPrivacy = action.payload?.privacySettings || action.payload;
        if (state.profileData?.profile) {
          state.profileData.profile.privacySettings = updatedPrivacy;
        }
        if (state.profileData) {
          state.profileData.privacySettings = updatedPrivacy;
        }
      })
      .addCase(updateStaffPrivacySettings.rejected, (state, action) => {
        state.isUpdatingPrivacy = false;
        state.privacyUpdateError = action.payload;
      })

      // Request PDF Access
      .addCase(requestPdfAccess.pending, (state) => {
        state.isRequestingPdf = true;
        state.pdfRequestSuccess = false;
        state.pdfRequestError = null;
      })
      .addCase(requestPdfAccess.fulfilled, (state, action) => {
        state.isRequestingPdf = false;
        state.pdfRequestSuccess = true;
        state.pdfRequestData = action.payload;
        if (state.profileData?.pdfAccess) {
          state.profileData.pdfAccess.activeRequest = action.payload;
        }
      })
      .addCase(requestPdfAccess.rejected, (state, action) => {
        state.isRequestingPdf = false;
        state.pdfRequestError = action.payload;
      })

      // Download PDF (NO BINARY STORAGE)
      .addCase(downloadStaffPdf.pending, (state) => {
        state.isDownloadingPdf = true;
        state.pdfDownloadSuccess = false;
        state.pdfDownloadError = null;
      })
      .addCase(downloadStaffPdf.fulfilled, (state) => {
        state.isDownloadingPdf = false;
        state.pdfDownloadSuccess = true;
      })
      .addCase(downloadStaffPdf.rejected, (state, action) => {
        state.isDownloadingPdf = false;
        state.pdfDownloadError = action.payload;
      })

      // Fetch Access History
      .addCase(fetchStaffAccessHistory.pending, (state) => {
        state.loadingAccessHistory = true;
        state.accessHistoryError = null;
      })
      .addCase(fetchStaffAccessHistory.fulfilled, (state, action) => {
        state.loadingAccessHistory = false;
        state.accessHistory = action.payload;
      })
      .addCase(fetchStaffAccessHistory.rejected, (state, action) => {
        state.loadingAccessHistory = false;
        state.accessHistoryError = action.payload;
      })

      // Fetch Profile Attendance
      .addCase(fetchProfileAttendance.pending, (state) => {
        state.loadingAttendance = true;
        state.attendanceError = null;
      })
      .addCase(fetchProfileAttendance.fulfilled, (state, action) => {
        state.loadingAttendance = false;
        state.attendanceData = action.payload;
      })
      .addCase(fetchProfileAttendance.rejected, (state, action) => {
        state.loadingAttendance = false;
        state.attendanceError = action.payload;
      })

      // Fetch Profile Leave Summary
      .addCase(fetchProfileLeaveSummary.pending, (state) => {
        state.loadingLeave = true;
        state.leaveError = null;
      })
      .addCase(fetchProfileLeaveSummary.fulfilled, (state, action) => {
        state.loadingLeave = false;
        state.leaveSummary = action.payload || { clBalance: null, leaveRequests: [] };
      })
      .addCase(fetchProfileLeaveSummary.rejected, (state, action) => {
        state.loadingLeave = false;
        state.leaveError = action.payload;
      });
  },
});

export const {
  clearStaffProfileState,
  resetPdfRequestState,
  resetPdfDownloadState,
  resetPrivacyUpdateState,
  updateFieldVisibilityOptimistic,
} = staffProfileSlice.actions;

export default staffProfileSlice.reducer;
