import axios from 'axios';
import { store } from '../store/index.js';
import { setAccessToken, logout } from '../store/slices/authSlice.js';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send HttpOnly refresh cookies to BFF
});

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (requestConfig) => {
    const applicationState = store.getState();
    const activeAccessToken = applicationState.auth.accessToken;
    if (activeAccessToken) {
      requestConfig.headers.Authorization = `Bearer ${activeAccessToken}`;
    }
    return requestConfig;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto Refresh on 401 via BFF
apiClient.interceptors.response.use(
  (successfulResponse) => successfulResponse,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.data.accessToken;
        store.dispatch(setAccessToken(newAccessToken));

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
