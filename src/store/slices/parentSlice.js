import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import parentService from '../../services/parentService.js';
import { logout, logoutUser } from './authSlice.js';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchMyWards = createAsyncThunk(
  'parent/fetchMyWards',
  async (_, { rejectWithValue }) => {
    try {
      return await parentService.getMyWards();
    } catch (errorObject) {
      return rejectWithValue(
        errorObject.response?.data?.message || errorObject.message || 'Failed to retrieve verified wards.'
      );
    }
  }
);

export const fetchMyClaims = createAsyncThunk(
  'parent/fetchMyClaims',
  async (_, { rejectWithValue }) => {
    try {
      return await parentService.getMyClaims();
    } catch (errorObject) {
      return rejectWithValue(
        errorObject.response?.data?.message || errorObject.message || 'Failed to retrieve ward link claims.'
      );
    }
  }
);

export const lookupCandidateWard = createAsyncThunk(
  'parent/lookupCandidateWard',
  async ({ schoolId, grNumber }, { rejectWithValue }) => {
    try {
      return await parentService.lookupWard({ schoolId, grNumber });
    } catch (errorObject) {
      return rejectWithValue(
        errorObject.response?.data?.message || errorObject.message || 'Student candidate not found in municipal roster.'
      );
    }
  }
);

export const initiateWardClaim = createAsyncThunk(
  'parent/initiateWardClaim',
  async ({ studentProfileId, relationship }, { rejectWithValue }) => {
    try {
      return await parentService.initiateClaim({ studentProfileId, relationship });
    } catch (errorObject) {
      return rejectWithValue(
        errorObject.response?.data?.message || errorObject.message || 'Failed to initiate ward link claim.'
      );
    }
  }
);

export const verifyWardClaimOtp = createAsyncThunk(
  'parent/verifyWardClaimOtp',
  async ({ linkId, otp }, { rejectWithValue }) => {
    try {
      return await parentService.verifyClaimOtp({ linkId, otp });
    } catch (errorObject) {
      return rejectWithValue(
        errorObject.response?.data?.message || errorObject.message || 'Verification failed. Please check the code.'
      );
    }
  }
);

export const fetchWardFullWorkspace = createAsyncThunk(
  'parent/fetchWardFullWorkspace',
  async (studentProfileId, { rejectWithValue }) => {
    try {
      const [profile, attendance, marksheets, homework, circulars] = await Promise.all([
        parentService.getWardProfile(studentProfileId).catch(() => null),
        parentService.getWardAttendance(studentProfileId).catch(() => null),
        parentService.getWardMarksheets(studentProfileId).catch(() => []),
        parentService.getWardHomework(studentProfileId).catch(() => []),
        parentService.getWardCirculars(studentProfileId).catch(() => []),
      ]);

      return {
        studentProfileId,
        profile,
        attendance,
        marksheets,
        homework,
        circulars,
      };
    } catch (errorObject) {
      return rejectWithValue(
        errorObject.response?.data?.message || errorObject.message || 'Failed to load ward academic records.'
      );
    }
  }
);

export const downloadWardMarksheet = createAsyncThunk(
  'parent/downloadWardMarksheet',
  async ({ studentProfileId, examId, filename }, { rejectWithValue }) => {
    try {
      return await parentService.downloadWardMarksheetPdf(studentProfileId, examId, filename);
    } catch (errorObject) {
      return rejectWithValue(
        errorObject.message || errorObject.response?.data?.message || 'Failed to download official marksheet PDF.'
      );
    }
  }
);

// ─── Initial State ────────────────────────────────────────────────────────────

const initialParentState = {
  wards: {
    list: [],
    selectedWardId: null,
    isLoading: false,
    error: null,
  },
  claims: {
    list: [],
    isLoading: false,
    error: null,
  },
  activeWardData: {
    profile: null,
    attendance: null,
    marksheets: [],
    homework: [],
    circulars: [],
    isLoading: false,
    error: null,
  },
  claimWizard: {
    candidate: null,
    isLookingUp: false,
    lookupError: null,
    initiatedClaim: null,
    isInitiating: false,
    initiateError: null,
    isVerifyingOtp: false,
    verifyError: null,
    isCompleted: false,
  },
};

// ─── Slice Definition ─────────────────────────────────────────────────────────

const parentSlice = createSlice({
  name: 'parent',
  initialState: initialParentState,
  reducers: {
    setSelectedWardId: (stateDraft, action) => {
      stateDraft.wards.selectedWardId = action.payload;
    },
    resetClaimWizard: (stateDraft) => {
      stateDraft.claimWizard = {
        candidate: null,
        isLookingUp: false,
        lookupError: null,
        initiatedClaim: null,
        isInitiating: false,
        initiateError: null,
        isVerifyingOtp: false,
        verifyError: null,
        isCompleted: false,
      };
    },
    clearActiveWardError: (stateDraft) => {
      stateDraft.activeWardData.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── Fetch Wards ──
    builder
      .addCase(fetchMyWards.pending, (stateDraft) => {
        stateDraft.wards.isLoading = true;
        stateDraft.wards.error = null;
      })
      .addCase(fetchMyWards.fulfilled, (stateDraft, action) => {
        stateDraft.wards.isLoading = false;
        stateDraft.wards.list = action.payload || [];
        if (!stateDraft.wards.selectedWardId && stateDraft.wards.list.length > 0) {
          stateDraft.wards.selectedWardId = stateDraft.wards.list[0].studentProfileId?._id || stateDraft.wards.list[0].studentProfileId;
        }
      })
      .addCase(fetchMyWards.rejected, (stateDraft, action) => {
        stateDraft.wards.isLoading = false;
        stateDraft.wards.error = action.payload;
      });

    // ── Fetch Claims ──
    builder
      .addCase(fetchMyClaims.pending, (stateDraft) => {
        stateDraft.claims.isLoading = true;
        stateDraft.claims.error = null;
      })
      .addCase(fetchMyClaims.fulfilled, (stateDraft, action) => {
        stateDraft.claims.isLoading = false;
        stateDraft.claims.list = action.payload || [];
      })
      .addCase(fetchMyClaims.rejected, (stateDraft, action) => {
        stateDraft.claims.isLoading = false;
        stateDraft.claims.error = action.payload;
      });

    // ── Lookup Candidate ──
    builder
      .addCase(lookupCandidateWard.pending, (stateDraft) => {
        stateDraft.claimWizard.isLookingUp = true;
        stateDraft.claimWizard.lookupError = null;
        stateDraft.claimWizard.candidate = null;
      })
      .addCase(lookupCandidateWard.fulfilled, (stateDraft, action) => {
        stateDraft.claimWizard.isLookingUp = false;
        stateDraft.claimWizard.candidate = action.payload?.candidate || null;
      })
      .addCase(lookupCandidateWard.rejected, (stateDraft, action) => {
        stateDraft.claimWizard.isLookingUp = false;
        stateDraft.claimWizard.lookupError = action.payload;
      });

    // ── Initiate Claim ──
    builder
      .addCase(initiateWardClaim.pending, (stateDraft) => {
        stateDraft.claimWizard.isInitiating = true;
        stateDraft.claimWizard.initiateError = null;
      })
      .addCase(initiateWardClaim.fulfilled, (stateDraft, action) => {
        stateDraft.claimWizard.isInitiating = false;
        stateDraft.claimWizard.initiatedClaim = action.payload?.link || action.payload;
        if (action.payload?.status === 'PENDING_HM_APPROVAL') {
          stateDraft.claimWizard.isCompleted = true;
        }
      })
      .addCase(initiateWardClaim.rejected, (stateDraft, action) => {
        stateDraft.claimWizard.isInitiating = false;
        stateDraft.claimWizard.initiateError = action.payload;
      });

    // ── Verify Claim OTP ──
    builder
      .addCase(verifyWardClaimOtp.pending, (stateDraft) => {
        stateDraft.claimWizard.isVerifyingOtp = true;
        stateDraft.claimWizard.verifyError = null;
      })
      .addCase(verifyWardClaimOtp.fulfilled, (stateDraft) => {
        stateDraft.claimWizard.isVerifyingOtp = false;
        stateDraft.claimWizard.isCompleted = true;
      })
      .addCase(verifyWardClaimOtp.rejected, (stateDraft, action) => {
        stateDraft.claimWizard.isVerifyingOtp = false;
        stateDraft.claimWizard.verifyError = action.payload;
      });

    // ── Fetch Ward Full Workspace ──
    builder
      .addCase(fetchWardFullWorkspace.pending, (stateDraft) => {
        stateDraft.activeWardData.isLoading = true;
        stateDraft.activeWardData.error = null;
      })
      .addCase(fetchWardFullWorkspace.fulfilled, (stateDraft, action) => {
        stateDraft.activeWardData.isLoading = false;
        stateDraft.activeWardData.profile = action.payload.profile;
        stateDraft.activeWardData.attendance = action.payload.attendance;
        stateDraft.activeWardData.marksheets = action.payload.marksheets || [];
        stateDraft.activeWardData.homework = action.payload.homework || [];
        stateDraft.activeWardData.circulars = action.payload.circulars || [];
      })
      .addCase(fetchWardFullWorkspace.rejected, (stateDraft, action) => {
        stateDraft.activeWardData.isLoading = false;
        stateDraft.activeWardData.error = action.payload;
      });

    // ── Instant Sanitization on Logout ──
    builder
      .addCase(logout, () => initialParentState)
      .addCase(logoutUser.fulfilled, () => initialParentState);
  },
});

export const { setSelectedWardId, resetClaimWizard, clearActiveWardError } = parentSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectParentWards = (state) => state.parent.wards.list;
export const selectSelectedWardId = (state) => state.parent.wards.selectedWardId;
export const selectIsWardsLoading = (state) => state.parent.wards.isLoading;
export const selectWardsError = (state) => state.parent.wards.error;

export const selectParentClaims = (state) => state.parent.claims.list;
export const selectIsClaimsLoading = (state) => state.parent.claims.isLoading;

export const selectActiveWardData = (state) => state.parent.activeWardData;
export const selectActiveWardProfile = (state) => state.parent.activeWardData.profile;
export const selectActiveWardAttendance = (state) => state.parent.activeWardData.attendance;
export const selectActiveWardMarksheets = (state) => state.parent.activeWardData.marksheets;
export const selectActiveWardHomework = (state) => state.parent.activeWardData.homework;
export const selectActiveWardCirculars = (state) => state.parent.activeWardData.circulars;
export const selectIsWardDataLoading = (state) => state.parent.activeWardData.isLoading;

export const selectClaimWizard = (state) => state.parent.claimWizard;

export default parentSlice.reducer;
