import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import notificationReducer from './slices/notificationSlice.js';
import staffProfileReducer from './slices/staffProfileSlice.js';
import adminReducer from './slices/adminSlice.js';
import hmReducer from './slices/hmSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationReducer,
    staffProfile: staffProfileReducer,
    admin: adminReducer,
    hm: hmReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
