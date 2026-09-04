import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage.jsx';
import RegisterStudentPage from '../pages/auth/RegisterStudentPage.jsx';
import RegisterTeacherPage from '../pages/auth/RegisterTeacherPage.jsx';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage.jsx';
import DashboardRouter from '../pages/dashboard/DashboardRouter.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

/**
 * Client Portal Routes (SPA)
 * Note: The single public main landing page of the entire platform is the Next.js 15 app (landing-page/).
 * The React client (client/) serves strictly as the authenticated workspace & login portal.
 */
export const AppRoutes = () => {
  return (
    <Routes>
      {/* Root of client portal routes directly to Login / Auth */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register-student" element={<RegisterStudentPage />} />
      <Route path="/register-teacher" element={<RegisterTeacherPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Core Dashboard Route */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/schools" element={<DashboardRouter />} />
        <Route path="/users" element={<DashboardRouter />} />
        <Route path="/attendance" element={<DashboardRouter />} />
        <Route path="/exams" element={<DashboardRouter />} />
        <Route path="/transfers" element={<DashboardRouter />} />
        <Route path="/documents" element={<DashboardRouter />} />
        <Route path="/audit-logs" element={<DashboardRouter />} />
      </Route>

      {/* Fallback to Login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
