import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import studentService from '../../services/studentService.js';
import { logout, logoutUser } from './authSlice.js';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchStudentProfile = createAsyncThunk(
  'student/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await studentService.getMyProfile();
    } catch (errorObject) {
      const errorMessage =
        errorObject.response?.data?.message || errorObject.message || 'Failed to retrieve student profile record.';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchStudentExamResults = createAsyncThunk(
  'student/fetchExamResults',
  async (examinationId, { rejectWithValue }) => {
    try {
      return await studentService.getMyExamResults(examinationId);
    } catch (errorObject) {
      const errorMessage =
        errorObject.response?.data?.message || errorObject.message || 'Failed to retrieve published examination results.';
      return rejectWithValue(errorMessage);
    }
  }
);

export const downloadStudentMarksheet = createAsyncThunk(
  'student/downloadMarksheet',
  async ({ examinationId, studentUserId, studentIdentifierLabel }, { rejectWithValue }) => {
    try {
      return await studentService.downloadMyMarksheetPdf(
        examinationId,
        studentUserId,
        studentIdentifierLabel
      );
    } catch (errorObject) {
      const errorMessage =
        errorObject.message || errorObject.response?.data?.message || 'Failed to download official marksheet PDF.';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchStudentHomework = createAsyncThunk(
  'student/fetchHomework',
  async (_, { rejectWithValue }) => {
    try {
      return await studentService.getMyHomework();
    } catch (errorObject) {
      const errorMessage =
        errorObject.response?.data?.message || 'Failed to load assigned homework.';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchStudentAttendance = createAsyncThunk(
  'student/fetchAttendance',
  async (_, { rejectWithValue }) => {
    try {
      return await studentService.getMyAttendanceAnalytics();
    } catch (errorObject) {
      const errorMessage =
        errorObject.response?.data?.message || 'Failed to calculate attendance intelligence.';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchStudentCirculars = createAsyncThunk(
  'student/fetchCirculars',
  async (queryFilters, { rejectWithValue }) => {
    try {
      return await studentService.getStudentCirculars(queryFilters);
    } catch (errorObject) {
      const errorMessage =
        errorObject.response?.data?.message || 'Failed to retrieve official circulars.';
      return rejectWithValue(errorMessage);
    }
  }
);

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  profile: {
    data: null,
    isLoading: false,
    error: null,
  },
  examinationResults: {
    records: [],
    totalCount: 0,
    selectedExamId: null,
    isLoading: false,
    error: null,
    isDownloadingMarksheet: false,
  },
  homework: {
    items: [],
    isLoading: false,
    error: null,
  },
  attendance: {
    analytics: null,
    isLoading: false,
    error: null,
  },
  circulars: {
    documents: [],
    isLoading: false,
    error: null,
  },
};

// ─── Student Slice Definition ─────────────────────────────────────────────────

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    setSelectedExamId: (stateDraft, action) => {
      stateDraft.examinationResults.selectedExamId = action.payload;
    },
    clearStudentErrors: (stateDraft) => {
      stateDraft.profile.error = null;
      stateDraft.examinationResults.error = null;
      stateDraft.homework.error = null;
      stateDraft.attendance.error = null;
      stateDraft.circulars.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── Profile ─────────────────────────────────────────────────────────────
    builder
      .addCase(fetchStudentProfile.pending, (stateDraft) => {
        stateDraft.profile.isLoading = true;
        stateDraft.profile.error = null;
      })
      .addCase(fetchStudentProfile.fulfilled, (stateDraft, action) => {
        stateDraft.profile.isLoading = false;
        stateDraft.profile.data = action.payload;
      })
      .addCase(fetchStudentProfile.rejected, (stateDraft, action) => {
        stateDraft.profile.isLoading = false;
        stateDraft.profile.error = action.payload;
      });

    // ── Examination Results ─────────────────────────────────────────────────
    builder
      .addCase(fetchStudentExamResults.pending, (stateDraft) => {
        stateDraft.examinationResults.isLoading = true;
        stateDraft.examinationResults.error = null;
      })
      .addCase(fetchStudentExamResults.fulfilled, (stateDraft, action) => {
        stateDraft.examinationResults.isLoading = false;
        stateDraft.examinationResults.records = action.payload?.results || [];
        stateDraft.examinationResults.totalCount = action.payload?.totalCount || 0;
        // Default select first exam if none selected
        if (!stateDraft.examinationResults.selectedExamId && action.payload?.results?.length > 0) {
          stateDraft.examinationResults.selectedExamId = action.payload.results[0].exam?._id || null;
        }
      })
      .addCase(fetchStudentExamResults.rejected, (stateDraft, action) => {
        stateDraft.examinationResults.isLoading = false;
        stateDraft.examinationResults.error = action.payload;
      });

    // ── Download Marksheet ──────────────────────────────────────────────────
    builder
      .addCase(downloadStudentMarksheet.pending, (stateDraft) => {
        stateDraft.examinationResults.isDownloadingMarksheet = true;
      })
      .addCase(downloadStudentMarksheet.fulfilled, (stateDraft) => {
        stateDraft.examinationResults.isDownloadingMarksheet = false;
      })
      .addCase(downloadStudentMarksheet.rejected, (stateDraft, action) => {
        stateDraft.examinationResults.isDownloadingMarksheet = false;
        stateDraft.examinationResults.error = action.payload;
      });

    // ── Homework ────────────────────────────────────────────────────────────
    builder
      .addCase(fetchStudentHomework.pending, (stateDraft) => {
        stateDraft.homework.isLoading = true;
        stateDraft.homework.error = null;
      })
      .addCase(fetchStudentHomework.fulfilled, (stateDraft, action) => {
        stateDraft.homework.isLoading = false;
        stateDraft.homework.items = action.payload || [];
      })
      .addCase(fetchStudentHomework.rejected, (stateDraft, action) => {
        stateDraft.homework.isLoading = false;
        stateDraft.homework.error = action.payload;
      });

    // ── Attendance ──────────────────────────────────────────────────────────
    builder
      .addCase(fetchStudentAttendance.pending, (stateDraft) => {
        stateDraft.attendance.isLoading = true;
        stateDraft.attendance.error = null;
      })
      .addCase(fetchStudentAttendance.fulfilled, (stateDraft, action) => {
        stateDraft.attendance.isLoading = false;
        stateDraft.attendance.analytics = action.payload;
      })
      .addCase(fetchStudentAttendance.rejected, (stateDraft, action) => {
        stateDraft.attendance.isLoading = false;
        stateDraft.attendance.error = action.payload;
      });

    // ── Circulars ───────────────────────────────────────────────────────────
    builder
      .addCase(fetchStudentCirculars.pending, (stateDraft) => {
        stateDraft.circulars.isLoading = true;
        stateDraft.circulars.error = null;
      })
      .addCase(fetchStudentCirculars.fulfilled, (stateDraft, action) => {
        stateDraft.circulars.isLoading = false;
        stateDraft.circulars.documents = action.payload || [];
      })
      .addCase(fetchStudentCirculars.rejected, (stateDraft, action) => {
        stateDraft.circulars.isLoading = false;
        stateDraft.circulars.error = action.payload;
      });

    // ── Clear Student State on Logout ─────────────────────────────────────
    builder
      .addCase(logout, () => initialState)
      .addCase(logoutUser.fulfilled, () => initialState)
      .addCase(logoutUser.rejected, () => initialState);
  },
});

export const { setSelectedExamId, clearStudentErrors } = studentSlice.actions;
export default studentSlice.reducer;
