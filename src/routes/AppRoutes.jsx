import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage.jsx';
import RegisterStudentPage from '../pages/auth/RegisterStudentPage.jsx';
import RegisterTeacherPage from '../pages/auth/RegisterTeacherPage.jsx';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage.jsx';
import DashboardRouter from '../pages/dashboard/DashboardRouter.jsx';
import SchoolsPage from '../pages/schools/SchoolsPage.jsx';
import UsersPage from '../pages/users/UsersPage.jsx';
import TransfersPage from '../pages/transfers/TransfersPage.jsx';
import AttendancePage from '../pages/attendance/AttendancePage.jsx';
import ExamsPage from '../pages/exams/ExamsPage.jsx';
import DocumentsPage from '../pages/documents/DocumentsPage.jsx';
import AuditLogsPage from '../pages/audit/AuditLogsPage.jsx';
import DirectoryPage from '../pages/directory/DirectoryPage.jsx';
import PendingApprovalsPage from '../pages/approvals/PendingApprovalsPage.jsx';
import StaffProfilePage from '../pages/staff/StaffProfilePage.jsx';
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

      {/* Protected Core Dashboard & Dedicated Module Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/schools" element={<SchoolsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/approvals" element={<PendingApprovalsPage />} />
        <Route path="/staff/:id/profile" element={<StaffProfilePage />} />
        <Route path="/profile" element={<StaffProfilePage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/exams" element={<ExamsPage />} />
        <Route path="/transfers" element={<TransfersPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/directory" element={<DirectoryPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
      </Route>

      {/* Fallback to Login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
