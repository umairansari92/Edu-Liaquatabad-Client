import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes.jsx';
import AppFooter from './components/layout/AppFooter.jsx';
import apiClient from './services/apiClient.js';
import { setCredentials, setSessionChecked } from './store/slices/authSlice.js';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Attempt silent refresh token exchange via HttpOnly cookie
        const res = await apiClient.post('/auth/refresh-token');
        if (res?.data?.success && res?.data?.data) {
          const { user, accessToken } = res.data.data;
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
      <div className="min-h-screen flex flex-col bg-slate-950">
        <div className="flex-1">
          <AppRoutes />
        </div>
        <AppFooter />
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0F172A',
            color: '#F8FAFC',
            border: '1px solid #1E293B',
            borderRadius: '12px',
            fontSize: '13px',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
          success: {
            iconTheme: { primary: '#10B981', secondary: '#F8FAFC' },
          },
          error: {
            iconTheme: { primary: '#F43F5E', secondary: '#F8FAFC' },
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;

