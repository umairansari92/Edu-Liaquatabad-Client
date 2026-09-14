import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import notificationReducer from './slices/notificationSlice.js';
import staffProfileReducer from './slices/staffProfileSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationReducer,
    staffProfile: staffProfileReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
