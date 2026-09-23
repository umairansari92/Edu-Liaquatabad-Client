import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import supervisorService from '../../services/supervisorService.js';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchAssignedSchools = createAsyncThunk(
  'supervisor/fetchAssignedSchools',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await supervisorService.getAssignedSchools(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch assigned schools');
    }
  }
);

export const fetchSchoolDetails = createAsyncThunk(
  'supervisor/fetchSchoolDetails',
  async (schoolId, { rejectWithValue }) => {
    try {
      return await supervisorService.getSchoolDetails(schoolId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch school details');
    }
  }
);

export const fetchClusterAttendance = createAsyncThunk(
  'supervisor/fetchClusterAttendance',
  async (_, { rejectWithValue }) => {
    try {
      return await supervisorService.getTownAttendanceOverview();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cluster attendance');
    }
  }
);

export const fetchSchoolAttendance = createAsyncThunk(
  'supervisor/fetchSchoolAttendance',
  async (schoolId, { rejectWithValue }) => {
    try {
      return await supervisorService.getSchoolAttendanceAnalytics(schoolId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch school attendance');
    }
  }
);

export const fetchInspections = createAsyncThunk(
  'supervisor/fetchInspections',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await supervisorService.getInspections(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch inspections');
    }
  }
);

export const fetchInspectionById = createAsyncThunk(
  'supervisor/fetchInspectionById',
  async (inspectionId, { rejectWithValue }) => {
    try {
      return await supervisorService.getInspectionById(inspectionId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch inspection report');
    }
  }
);

export const createInspection = createAsyncThunk(
  'supervisor/createInspection',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response = await supervisorService.createInspection(payload);
      dispatch(fetchInspections());
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create inspection report');
    }
  }
);

export const updateInspection = createAsyncThunk(
  'supervisor/updateInspection',
  async ({ id, payload }, { rejectWithValue, dispatch }) => {
    try {
      const response = await supervisorService.updateInspection(id, payload);
      dispatch(fetchInspections());
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update inspection report');
    }
  }
);

export const submitInspection = createAsyncThunk(
  'supervisor/submitInspection',
  async (inspectionId, { rejectWithValue, dispatch }) => {
    try {
      const response = await supervisorService.submitInspection(inspectionId);
      dispatch(fetchInspections());
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit inspection report');
    }
  }
);

export const closeInspection = createAsyncThunk(
  'supervisor/closeInspection',
  async ({ id, payload }, { rejectWithValue, dispatch }) => {
    try {
      const response = await supervisorService.closeInspection(id, payload);
      dispatch(fetchInspections());
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to close inspection report');
    }
  }
);

export const fetchClusterTransfers = createAsyncThunk(
  'supervisor/fetchClusterTransfers',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await supervisorService.getTransfers(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transfers');
    }
  }
);

export const fetchClusterFaculty = createAsyncThunk(
  'supervisor/fetchClusterFaculty',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await supervisorService.getFacultyUsers(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cluster faculty');
    }
  }
);

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  assignedSchools: [],
  totalSchools: 0,
  selectedSchool: null,
  schoolDetailsLoading: false,

  clusterAttendance: null,
  selectedSchoolAttendance: null,

  inspections: [],
  totalInspections: 0,
  activeInspection: null,
  inspectionLoading: false,

  transfers: [],
  facultyRoster: [],

  loading: false,
  error: null,
  saveSuccess: false,
};

// ─── Slice Definition ─────────────────────────────────────────────────────────

const supervisorSlice = createSlice({
  name: 'supervisor',
  initialState,
  reducers: {
    clearActiveInspection: (state) => {
      state.activeInspection = null;
    },
    clearSelectedSchool: (state) => {
      state.selectedSchool = null;
      state.selectedSchoolAttendance = null;
    },
    clearSupervisorError: (state) => {
      state.error = null;
    },
    resetSaveSuccess: (state) => {
      state.saveSuccess = false;
    },
    resetSupervisorState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Assigned Schools
      .addCase(fetchAssignedSchools.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignedSchools.fulfilled, (state, action) => {
        state.loading = false;
        state.assignedSchools = action.payload?.schools || [];
        state.totalSchools = action.payload?.total || 0;
      })
      .addCase(fetchAssignedSchools.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // School Details
      .addCase(fetchSchoolDetails.pending, (state) => {
        state.schoolDetailsLoading = true;
      })
      .addCase(fetchSchoolDetails.fulfilled, (state, action) => {
        state.schoolDetailsLoading = false;
        state.selectedSchool = action.payload?.school || action.payload;
      })
      .addCase(fetchSchoolDetails.rejected, (state, action) => {
        state.schoolDetailsLoading = false;
        state.error = action.payload;
      })

      // Cluster Attendance
      .addCase(fetchClusterAttendance.fulfilled, (state, action) => {
        state.clusterAttendance = action.payload;
      })

      // Single School Attendance
      .addCase(fetchSchoolAttendance.fulfilled, (state, action) => {
        state.selectedSchoolAttendance = action.payload;
      })

      // Inspections
      .addCase(fetchInspections.pending, (state) => {
        state.inspectionLoading = true;
      })
      .addCase(fetchInspections.fulfilled, (state, action) => {
        state.inspectionLoading = false;
        state.inspections = action.payload?.inspections || [];
        state.totalInspections = action.payload?.total || 0;
      })
      .addCase(fetchInspections.rejected, (state, action) => {
        state.inspectionLoading = false;
        state.error = action.payload;
      })

      // Inspection Detail
      .addCase(fetchInspectionById.fulfilled, (state, action) => {
        state.activeInspection = action.payload?.inspection || action.payload;
      })

      // Create / Update / Submit / Close Inspection
      .addCase(createInspection.fulfilled, (state) => {
        state.saveSuccess = true;
      })
      .addCase(updateInspection.fulfilled, (state) => {
        state.saveSuccess = true;
      })
      .addCase(submitInspection.fulfilled, (state) => {
        state.saveSuccess = true;
      })
      .addCase(closeInspection.fulfilled, (state) => {
        state.saveSuccess = true;
      })

      // Transfers
      .addCase(fetchClusterTransfers.fulfilled, (state, action) => {
        state.transfers = action.payload?.transfers || [];
      })

      // Faculty Roster
      .addCase(fetchClusterFaculty.fulfilled, (state, action) => {
        state.facultyRoster = action.payload?.users || [];
      });
  },
});

export const {
  clearActiveInspection,
  clearSelectedSchool,
  clearSupervisorError,
  resetSaveSuccess,
  resetSupervisorState,
} = supervisorSlice.actions;

export default supervisorSlice.reducer;
