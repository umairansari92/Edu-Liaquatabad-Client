import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationService from '../../services/notificationService.js';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await notificationService.getNotifications(params);
      return response.data;
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markNotificationAsRead',
  async (payload, { rejectWithValue }) => {
    const notificationId = typeof payload === 'string' ? payload : payload?.notificationId;
    const isRead = typeof payload === 'object' && payload?.isRead !== undefined ? payload.isRead : true;
    try {
      const response = await notificationService.markAsRead(notificationId, isRead);
      return {
        notificationId,
        isRead,
        unreadCount: response.data?.unreadCount,
      };
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to update notification');
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllNotificationsAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllAsRead();
      return true;
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to mark all as read');
    }
  }
);

export const respondToAccessRequest = createAsyncThunk(
  'notifications/respondToAccessRequest',
  async ({ requestId, decision, decisionRemarks }, { rejectWithValue }) => {
    try {
      const response = await notificationService.respondToAccessRequest(requestId, {
        decision,
        decisionRemarks,
      });
      return { requestId, decision, updatedRequest: response.data };
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to respond to consent request');
    }
  }
);

export const respondToLateAttendanceRequest = createAsyncThunk(
  'notifications/respondToLateAttendanceRequest',
  async ({ requestId, decision, remarks }, { rejectWithValue }) => {
    try {
      const response = await notificationService.respondToLateAttendanceRequest(requestId, {
        decision,
        remarks,
      });
      return { requestId, decision, remarks, updatedRequest: response.data };
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to decide late clearance request');
    }
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  activeTab: 'ALL', // 'ALL' | 'UNREAD'
  activeCategory: 'ALL',
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  },
  actionLoading: false,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload || [];
      state.unreadCount = (action.payload || []).filter((notification) => !notification.isRead).length;
    },
    markAsRead: (state, action) => {
      const targetNotificationId = typeof action.payload === 'string' ? action.payload : action.payload?.id;
      const targetIsRead = typeof action.payload === 'object' && action.payload?.isRead !== undefined ? action.payload.isRead : true;
      const targetNotification = state.notifications.find(
        (notification) => notification._id === targetNotificationId
      );
      if (targetNotification && targetNotification.isRead !== targetIsRead) {
        targetNotification.isRead = targetIsRead;
        state.unreadCount = targetIsRead
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount + 1;
      }
    },
    setActiveCategory: (state, action) => {
      state.activeCategory = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload?.notifications || [];
        state.unreadCount = action.payload?.unreadCount ?? 0;
        state.pagination = action.payload?.pagination || state.pagination;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Mark single read / unread toggle
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const { notificationId, isRead, unreadCount } = action.payload;
        const target = state.notifications.find((notificationItem) => notificationItem._id === notificationId);
        if (target) {
          target.isRead = isRead;
        }
        if (typeof unreadCount === 'number') {
          state.unreadCount = unreadCount;
        } else {
          state.unreadCount = state.notifications.filter((notificationItem) => !notificationItem.isRead).length;
        }
      })

      // Mark all read
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach((notificationItem) => {
          notificationItem.isRead = true;
        });
        state.unreadCount = 0;
      })

      // Respond to access request
      .addCase(respondToAccessRequest.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(respondToAccessRequest.fulfilled, (state, action) => {
        state.actionLoading = false;
        const { requestId, decision } = action.payload;
        // Update any notification referencing this accessRequestId
        state.notifications.forEach((notificationItem) => {
          if (notificationItem.metadata?.accessRequestId === requestId || notificationItem._id === requestId) {
            notificationItem.metadata = {
              ...notificationItem.metadata,
              status: decision === 'ALLOW' ? 'APPROVED' : 'DENIED',
            };
            notificationItem.isRead = true;
          }
        });
        state.unreadCount = state.notifications.filter((notificationItem) => !notificationItem.isRead).length;
      })
      .addCase(respondToAccessRequest.rejected, (state) => {
        state.actionLoading = false;
      })

      // Respond to late attendance clearance request
      .addCase(respondToLateAttendanceRequest.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(respondToLateAttendanceRequest.fulfilled, (state, action) => {
        state.actionLoading = false;
        const { requestId, decision, remarks, updatedRequest } = action.payload;
        const effectiveStatus = updatedRequest?.request?.status || (decision === 'APPROVE' ? 'APPROVED' : 'REJECTED');
        state.notifications.forEach((notificationItem) => {
          if (notificationItem.metadata?.requestId === requestId || notificationItem._id === requestId) {
            notificationItem.metadata = {
              ...notificationItem.metadata,
              status: effectiveStatus,
              rejectionReason: decision === 'REJECT' ? remarks : notificationItem.metadata?.rejectionReason,
            };
            notificationItem.isRead = true;
          }
        });
        state.unreadCount = state.notifications.filter((notificationItem) => !notificationItem.isRead).length;
      })
      .addCase(respondToLateAttendanceRequest.rejected, (state, action) => {
        state.actionLoading = false;
        // If the request was already decided, sync the notification locally so buttons disappear
        const requestId = action.meta?.arg?.requestId;
        if (requestId) {
          state.notifications.forEach((notificationItem) => {
            if (notificationItem.metadata?.requestId === requestId || notificationItem._id === requestId) {
              notificationItem.isRead = true;
              if (!notificationItem.metadata?.status || notificationItem.metadata.status === 'PENDING') {
                notificationItem.metadata = { ...notificationItem.metadata, status: 'APPROVED' };
              }
            }
          });
          state.unreadCount = state.notifications.filter((notificationItem) => !notificationItem.isRead).length;
        }
      });
  },
});

export const { setNotifications, markAsRead, setActiveCategory, setActiveTab } = notificationSlice.actions;
export default notificationSlice.reducer;
