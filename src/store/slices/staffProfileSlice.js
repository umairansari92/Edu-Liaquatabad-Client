import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import staffProfileService from '../../services/staffProfileService.js';

export const fetchStaffProfile = createAsyncThunk(
  'staffProfile/fetchStaffProfile',
  async (targetId = 'me', { rejectWithValue }) => {
    try {
      const response = await staffProfileService.getStaffProfile(targetId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch staff profile dossier');
    }
  }
);

export const updateStaffPrivacySettings = createAsyncThunk(
  'staffProfile/updateStaffPrivacySettings',
  async ({ targetId, privacySettings }, { rejectWithValue }) => {
    try {
      const response = await staffProfileService.updatePrivacySettings(targetId, privacySettings);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update privacy settings');
    }
  }
);

export const requestPdfAccess = createAsyncThunk(
  'staffProfile/requestPdfAccess',
  async ({ targetId, payload }, { rejectWithValue }) => {
    try {
      const response = await staffProfileService.requestPdfAccess(targetId, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit official PDF access request');
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
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to download official PDF service record');
    }
  }
);

export const fetchStaffAccessHistory = createAsyncThunk(
  'staffProfile/fetchStaffAccessHistory',
  async (targetId = 'me', { rejectWithValue }) => {
    try {
      const response = await staffProfileService.getStaffAccessHistory(targetId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch access audit history');
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
};

const staffProfileSlice = createSlice({
  name: 'staffProfile',
  initialState,
  reducers: {
    clearStaffProfileState: (state) => {
      state.profileData = null;
      state.error = null;
      state.accessHistory = [];
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
        if (state.profileData?.profile) {
          state.profileData.profile.privacySettings = action.payload;
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
      });
  },
});

export const {
  clearStaffProfileState,
  resetPdfRequestState,
  resetPdfDownloadState,
  resetPrivacyUpdateState,
} = staffProfileSlice.actions;

export default staffProfileSlice.reducer;
