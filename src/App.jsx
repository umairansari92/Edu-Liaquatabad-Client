import React, { useEffect, useRef } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes.jsx';
import AppFooter from './components/layout/AppFooter.jsx';
import ScreenCaptureProtection from './components/common/ScreenCaptureProtection.jsx';
import apiClient from './services/apiClient.js';
import { setCredentials, setSessionChecked } from './store/slices/authSlice.js';

function App() {
  const dispatch = useDispatch();
  const sessionInitializedReference = useRef(false);

  useEffect(() => {
    if (sessionInitializedReference.current) {
      return;
    }
    sessionInitializedReference.current = true;

    const initializeSession = async () => {
      try {
        // Attempt silent refresh token exchange via HttpOnly cookie
        const refreshResponse = await apiClient.post('/auth/refresh-token');
        if (refreshResponse?.data?.success && refreshResponse?.data?.data) {
          const { user, accessToken } = refreshResponse.data.data;
          dispatch(setCredentials({ user, accessToken }));
        } else {
          dispatch(setSessionChecked(true));
        }
      } catch {
        // No active session or cookie expired
        dispatch(setSessionChecked(true));
      }
    };

    initializeSession();
  }, [dispatch]);

  return (
    <BrowserRouter>
      <ScreenCaptureProtection>
        <div className="min-h-screen flex flex-col bg-[#F8FBFD] text-[#102033]">
          <div className="flex-1">
            <AppRoutes />
          </div>
          <AppFooter />
        </div>
      </ScreenCaptureProtection>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFFFFF',
            color: '#102033',
            border: '1px solid rgba(0, 106, 199, 0.15)',
            boxShadow: '0 8px 30px rgba(0, 33, 61, 0.08)',
            borderRadius: '12px',
            fontSize: '13px',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: '500',
          },
          success: {
            iconTheme: { primary: '#4B7F3A', secondary: '#FFFFFF' },
          },
          error: {
            iconTheme: { primary: '#DC2626', secondary: '#FFFFFF' },
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;

