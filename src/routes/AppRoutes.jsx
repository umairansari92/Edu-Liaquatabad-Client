import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import RegisterStudentPage from '../pages/auth/RegisterStudentPage.jsx';
import RegisterTeacherPage from '../pages/auth/RegisterTeacherPage.jsx';
import DashboardRouter from '../pages/dashboard/DashboardRouter.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register-student" element={<RegisterStudentPage />} />
      <Route path="/register-teacher" element={<RegisterTeacherPage />} />

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

      {/* Fallback to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
