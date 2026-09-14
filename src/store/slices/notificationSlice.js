import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationService from '../../services/notificationService.js';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await notificationService.getNotifications(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markNotificationAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      await notificationService.markAsRead(notificationId);
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllNotificationsAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllAsRead();
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark all as read');
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
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to respond to consent request');
    }
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
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
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter((notification) => !notification.isRead).length;
    },
    markAsRead: (state, action) => {
      const targetNotificationId = action.payload;
      const targetNotification = state.notifications.find(
        (notification) => notification._id === targetNotificationId
      );
      if (targetNotification && !targetNotification.isRead) {
        targetNotification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    setActiveCategory: (state, action) => {
      state.activeCategory = action.payload;
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
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Mark single read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const id = action.payload;
        const target = state.notifications.find((n) => n._id === id);
        if (target && !target.isRead) {
          target.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })

      // Mark all read
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.isRead = true;
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
        state.notifications.forEach((n) => {
          if (n.metadata?.accessRequestId === requestId || n._id === requestId) {
            n.metadata = {
              ...n.metadata,
              status: decision === 'ALLOW' ? 'APPROVED' : 'DENIED',
            };
            n.isRead = true;
          }
        });
        state.unreadCount = state.notifications.filter((n) => !n.isRead).length;
      })
      .addCase(respondToAccessRequest.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setNotifications, markAsRead, setActiveCategory } = notificationSlice.actions;
export default notificationSlice.reducer;
