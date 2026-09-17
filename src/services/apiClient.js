import axios from 'axios';
import toast from 'react-hot-toast';
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

// Concurrency-safe Token Refresh Queue (Industry Standard Mutex Pattern)
let isRefreshing = false;
let failedQueue = [];
let lastRateLimitToastTime = 0;

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Auto Refresh on 401 with Queueing & 429/403 Security Handling
apiClient.interceptors.response.use(
  (successfulResponse) => successfulResponse,
  async (error) => {
    const originalRequest = error.config;
    const requestUrlString = originalRequest?.url || '';
    const isAuthEndpoint =
      requestUrlString.includes('/auth/refresh-token') ||
      requestUrlString.includes('/auth/login') ||
      requestUrlString.includes('/auth/logout') ||
      requestUrlString.includes('/auth/mfa/verify-login') ||
      requestUrlString.includes('/auth/mfa/recovery-login') ||
      requestUrlString.includes('/auth/mfa/setup') ||
      requestUrlString.includes('/auth/mfa/confirm');

    const status = error.response?.status;

    // ─── 429 Too Many Requests Handling ──────────────────────────────────────────
    if (status === 429) {
      const retryAfter = error.response?.headers?.['retry-after'] || '60';
      const now = Date.now();
      // Throttle warning toast to avoid spamming user
      if (now - lastRateLimitToastTime > 5000) {
        lastRateLimitToastTime = now;
        const msg = error.response?.data?.message || `Request rate limit exceeded. Please wait ${retryAfter}s before retrying.`;
        toast.error(msg, { id: 'rate-limit-toast', duration: 4000 });
      }
      return Promise.reject(error);
    }

    // ─── 403 Forbidden / Jurisdictional Policy Enforcement ───────────────────────
    if (status === 403) {
      const forbiddenMessage = error.response?.data?.message;
      if (
        forbiddenMessage &&
        (forbiddenMessage.includes('ROOT_ADMIN') ||
          forbiddenMessage.includes('jurisdiction') ||
          forbiddenMessage.includes('assigned town') ||
          forbiddenMessage.includes('Self-role reassignment'))
      ) {
        toast.error(forbiddenMessage, { id: 'auth-policy-toast', duration: 5000 });
      }
    }

    // ─── 401 Unauthorized with Concurrency-Safe Queue ─────────────────────────────
    if (status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Refresh already underway; enqueue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use raw axios to prevent interceptor loops
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data?.data?.accessToken;
        if (!newAccessToken) {
          throw new Error('No access token returned from refresh endpoint');
        }

        store.dispatch(setAccessToken(newAccessToken));
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(logout());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
