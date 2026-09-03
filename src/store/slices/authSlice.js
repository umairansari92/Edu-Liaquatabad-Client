import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  sessionChecked: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken || state.accessToken;
      state.isAuthenticated = Boolean(user && (accessToken || state.accessToken));
      state.isLoading = false;
      state.sessionChecked = true;
      state.error = null;
    },
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
      state.isAuthenticated = Boolean(action.payload && state.user);
    },
    updateUserProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setSessionChecked: (state, action) => {
      state.sessionChecked = action.payload;
      state.isLoading = false;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.sessionChecked = true;
      state.error = null;
    },
  },
});

export const {
  setCredentials,
  setAccessToken,
  updateUserProfile,
  setSessionChecked,
  setLoading,
  setError,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
