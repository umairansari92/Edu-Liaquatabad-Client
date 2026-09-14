import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminService from '../../services/adminService.js';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchAdminOverview = createAsyncThunk(
  'admin/fetchAdminOverview',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getOverview();
      return response.data?.overview || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch platform governance overview');
    }
  }
);

export const fetchAdminAnalytics = createAsyncThunk(
  'admin/fetchAdminAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getAnalytics();
      return response.data?.analytics || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch platform analytics');
    }
  }
);

export const fetchSuperAdminsList = createAsyncThunk(
  'admin/fetchSuperAdminsList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getSuperAdmins();
      return response.data?.superAdmins || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch Super Admins list');
    }
  }
);

export const disableSuperAdminAccount = createAsyncThunk(
  'admin/disableSuperAdminAccount',
  async ({ id, reason }, { rejectWithValue, dispatch }) => {
    try {
      const response = await adminService.disableSuperAdmin(id, reason);
      dispatch(fetchSuperAdminsList());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to suspend Super Admin account');
    }
  }
);

export const demoteSuperAdminAccount = createAsyncThunk(
  'admin/demoteSuperAdminAccount',
  async ({ id, reason }, { rejectWithValue, dispatch }) => {
    try {
      const response = await adminService.demoteSuperAdmin(id, reason);
      dispatch(fetchSuperAdminsList());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to demote Super Admin account');
    }
  }
);

export const grantUserAuthority = createAsyncThunk(
  'admin/grantUserAuthority',
  async ({ userId, authority, reason, scope }, { rejectWithValue, dispatch }) => {
    try {
      const response = await adminService.grantAuthority(userId, { authority, reason, scope });
      dispatch(fetchSuperAdminsList());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to grant authority to user');
    }
  }
);

export const fetchAdminUsersList = createAsyncThunk(
  'admin/fetchAdminUsersList',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminService.getUsers(params);
      return response.data || { users: [], total: 0 };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users list');
    }
  }
);

export const fetchAdminSchoolsList = createAsyncThunk(
  'admin/fetchAdminSchoolsList',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminService.getSchools(params);
      return response.data?.schools || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch municipal schools registry');
    }
  }
);

export const createSchoolEntity = createAsyncThunk(
  'admin/createSchoolEntity',
  async (formData, { rejectWithValue, dispatch }) => {
    try {
      const response = await adminService.createSchool(formData);
      dispatch(fetchAdminSchoolsList());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to register municipal school');
    }
  }
);

export const fetchPendingApprovalsList = createAsyncThunk(
  'admin/fetchPendingApprovalsList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getPendingUsers();
      return response.data?.pendingUsers || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pending approvals');
    }
  }
);

export const fetchSystemAuditLogs = createAsyncThunk(
  'admin/fetchSystemAuditLogs',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminService.getAuditLogs(params);
      return response.data || { auditLogs: [], totalRecords: 0 };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch system audit logs');
    }
  }
);

export const updateUserLifecycleState = createAsyncThunk(
  'admin/updateUserLifecycleState',
  async ({ id, status, reason }, { rejectWithValue, dispatch }) => {
    try {
      const response = await adminService.updateUserLifecycle(id, { status, reason });
      dispatch(fetchAdminUsersList());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user lifecycle state');
    }
  }
);

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  overview: null,
  isOverviewLoading: false,
  overviewError: null,

  analytics: null,
  isAnalyticsLoading: false,
  analyticsError: null,

  superAdmins: [],
  isSuperAdminsLoading: false,
  superAdminsError: null,

  users: [],
  usersTotal: 0,
  isUsersLoading: false,
  usersError: null,

  schools: [],
  isSchoolsLoading: false,
  schoolsError: null,

  pendingUsers: [],
  isPendingUsersLoading: false,
  pendingUsersError: null,

  auditLogs: [],
  auditTotalRecords: 0,
  isAuditLogsLoading: false,
  auditLogsError: null,

  actionInProgress: false,
  actionError: null,
};

// ─── Slice Definition ─────────────────────────────────────────────────────────

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearActionError: (state) => {
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    // Overview
    builder
      .addCase(fetchAdminOverview.pending, (state) => {
        state.isOverviewLoading = true;
        state.overviewError = null;
      })
      .addCase(fetchAdminOverview.fulfilled, (state, action) => {
        state.isOverviewLoading = false;
        state.overview = action.payload;
      })
      .addCase(fetchAdminOverview.rejected, (state, action) => {
        state.isOverviewLoading = false;
        state.overviewError = action.payload;
      });

    // Analytics
    builder
      .addCase(fetchAdminAnalytics.pending, (state) => {
        state.isAnalyticsLoading = true;
        state.analyticsError = null;
      })
      .addCase(fetchAdminAnalytics.fulfilled, (state, action) => {
        state.isAnalyticsLoading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchAdminAnalytics.rejected, (state, action) => {
        state.isAnalyticsLoading = false;
        state.analyticsError = action.payload;
      });

    // Super Admins List
    builder
      .addCase(fetchSuperAdminsList.pending, (state) => {
        state.isSuperAdminsLoading = true;
        state.superAdminsError = null;
      })
      .addCase(fetchSuperAdminsList.fulfilled, (state, action) => {
        state.isSuperAdminsLoading = false;
        state.superAdmins = action.payload;
      })
      .addCase(fetchSuperAdminsList.rejected, (state, action) => {
        state.isSuperAdminsLoading = false;
        state.superAdminsError = action.payload;
      });

    // Users List
    builder
      .addCase(fetchAdminUsersList.pending, (state) => {
        state.isUsersLoading = true;
        state.usersError = null;
      })
      .addCase(fetchAdminUsersList.fulfilled, (state, action) => {
        state.isUsersLoading = false;
        state.users = action.payload.users || [];
        state.usersTotal = action.payload.total || 0;
      })
      .addCase(fetchAdminUsersList.rejected, (state, action) => {
        state.isUsersLoading = false;
        state.usersError = action.payload;
      });

    // Schools List
    builder
      .addCase(fetchAdminSchoolsList.pending, (state) => {
        state.isSchoolsLoading = true;
        state.schoolsError = null;
      })
      .addCase(fetchAdminSchoolsList.fulfilled, (state, action) => {
        state.isSchoolsLoading = false;
        state.schools = action.payload;
      })
      .addCase(fetchAdminSchoolsList.rejected, (state, action) => {
        state.isSchoolsLoading = false;
        state.schoolsError = action.payload;
      });

    // Pending Approvals
    builder
      .addCase(fetchPendingApprovalsList.pending, (state) => {
        state.isPendingUsersLoading = true;
        state.pendingUsersError = null;
      })
      .addCase(fetchPendingApprovalsList.fulfilled, (state, action) => {
        state.isPendingUsersLoading = false;
        state.pendingUsers = action.payload;
      })
      .addCase(fetchPendingApprovalsList.rejected, (state, action) => {
        state.isPendingUsersLoading = false;
        state.pendingUsersError = action.payload;
      });

    // Audit Logs
    builder
      .addCase(fetchSystemAuditLogs.pending, (state) => {
        state.isAuditLogsLoading = true;
        state.auditLogsError = null;
      })
      .addCase(fetchSystemAuditLogs.fulfilled, (state, action) => {
        state.isAuditLogsLoading = false;
        state.auditLogs = action.payload.auditLogs || [];
        state.auditTotalRecords = action.payload.totalRecords || 0;
      })
      .addCase(fetchSystemAuditLogs.rejected, (state, action) => {
        state.isAuditLogsLoading = false;
        state.auditLogsError = action.payload;
      });

    // Actions in progress
    builder
      .addCase(disableSuperAdminAccount.pending, (state) => {
        state.actionInProgress = true;
        state.actionError = null;
      })
      .addCase(disableSuperAdminAccount.fulfilled, (state) => {
        state.actionInProgress = false;
      })
      .addCase(disableSuperAdminAccount.rejected, (state, action) => {
        state.actionInProgress = false;
        state.actionError = action.payload;
      })
      .addCase(demoteSuperAdminAccount.pending, (state) => {
        state.actionInProgress = true;
        state.actionError = null;
      })
      .addCase(demoteSuperAdminAccount.fulfilled, (state) => {
        state.actionInProgress = false;
      })
      .addCase(demoteSuperAdminAccount.rejected, (state, action) => {
        state.actionInProgress = false;
        state.actionError = action.payload;
      })
      .addCase(grantUserAuthority.pending, (state) => {
        state.actionInProgress = true;
        state.actionError = null;
      })
      .addCase(grantUserAuthority.fulfilled, (state) => {
        state.actionInProgress = false;
      })
      .addCase(grantUserAuthority.rejected, (state, action) => {
        state.actionInProgress = false;
        state.actionError = action.payload;
      });
  },
});

export const { clearActionError } = adminSlice.actions;
export default adminSlice.reducer;
