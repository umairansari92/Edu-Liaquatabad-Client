import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import notificationReducer from './slices/notificationSlice.js';
import staffProfileReducer from './slices/staffProfileSlice.js';
import adminReducer from './slices/adminSlice.js';
import hmReducer from './slices/hmSlice.js';
import teacherReducer from './slices/teacherSlice.js';
import studentReducer from './slices/studentSlice.js';
import supervisorReducer from './slices/supervisorSlice.js';
import parentReducer from './slices/parentSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationReducer,
    staffProfile: staffProfileReducer,
    admin: adminReducer,
    hm: hmReducer,
    teacher: teacherReducer,
    student: studentReducer,
    supervisor: supervisorReducer,
    parent: parentReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
