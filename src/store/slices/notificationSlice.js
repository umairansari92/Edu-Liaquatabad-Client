import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  unreadCount: 0,
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
      const targetNotification = state.notifications.find((notification) => notification._id === targetNotificationId);
      if (targetNotification && !targetNotification.isRead) {
        targetNotification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
  },
});

export const { setNotifications, markAsRead } = notificationSlice.actions;
export default notificationSlice.reducer;
