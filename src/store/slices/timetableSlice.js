import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import timetableService from '../../services/timetableService.js';

export const fetchSchoolTimetable = createAsyncThunk(
  'timetable/fetchSchoolTimetable',
  async ({ schoolId, academicYear }, { rejectWithValue }) => {
    try {
      const response = await timetableService.getSchoolTimetable(schoolId, academicYear);
      return response.data;
    } catch (apiRequestError) {
      const errorMessage =
        error.response?.data?.message || 'Failed to retrieve school timetable.';
      return rejectWithValue(errorMessage);
    }
  }
);

export const saveTimetable = createAsyncThunk(
  'timetable/saveTimetable',
  async (timetablePayload, { rejectWithValue }) => {
    try {
      const response = await timetableService.manageTimetable(timetablePayload);
      return response.data;
    } catch (apiRequestError) {
      const errorData = error.response?.data;
      const errorMessage =
        errorData?.message || 'Failed to save timetable.';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchTownLiveMonitor = createAsyncThunk(
  'timetable/fetchTownLiveMonitor',
  async (_, { rejectWithValue }) => {
    try {
      const response = await timetableService.getTownLiveMonitor();
      return response.data;
    } catch (apiRequestError) {
      const errorMessage =
        error.response?.data?.message || 'Failed to fetch live monitoring matrix.';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchMySchedule = createAsyncThunk(
  'timetable/fetchMySchedule',
  async (queryParams = {}, { rejectWithValue }) => {
    try {
      const response = await timetableService.getMySchedule(queryParams);
      return response.data;
    } catch (apiRequestError) {
      const errorMessage =
        error.response?.data?.message || 'Failed to load personal schedule.';
      return rejectWithValue(errorMessage);
    }
  }
);

const initialState = {
  schoolTimetable: null,
  liveStatus: null,
  townLiveMonitor: [],
  personalScheduleData: null,
  isLoading: false,
  isSaving: false,
  error: null,
  saveSuccess: false,
};

export const timetableSlice = createSlice({
  name: 'timetable',
  initialState,
  reducers: {
    clearTimetableError: (state) => {
      state.error = null;
    },
    resetSaveSuccess: (state) => {
      state.saveSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // ─── Fetch School Timetable ───────────────────────────────────────────
      .addCase(fetchSchoolTimetable.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSchoolTimetable.fulfilled, (state, action) => {
        state.isLoading = false;
        state.schoolTimetable = action.payload;
        state.liveStatus = action.payload?.liveStatus || null;
      })
      .addCase(fetchSchoolTimetable.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ─── Save Timetable ───────────────────────────────────────────────────
      .addCase(saveTimetable.pending, (state) => {
        state.isSaving = true;
        state.error = null;
        state.saveSuccess = false;
      })
      .addCase(saveTimetable.fulfilled, (state, action) => {
        state.isSaving = false;
        state.schoolTimetable = action.payload;
        state.saveSuccess = true;
      })
      .addCase(saveTimetable.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
        state.saveSuccess = false;
      })

      // ─── Town Live Monitor ────────────────────────────────────────────────
      .addCase(fetchTownLiveMonitor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTownLiveMonitor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.townLiveMonitor = action.payload || [];
      })
      .addCase(fetchTownLiveMonitor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ─── Personal Schedule ────────────────────────────────────────────────
      .addCase(fetchMySchedule.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMySchedule.fulfilled, (state, action) => {
        state.isLoading = false;
        state.personalScheduleData = action.payload;
      })
      .addCase(fetchMySchedule.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearTimetableError, resetSaveSuccess } = timetableSlice.actions;

export default timetableSlice.reducer;
