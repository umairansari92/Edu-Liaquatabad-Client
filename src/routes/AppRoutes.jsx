import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
import HolidaysGovernancePage from '../pages/holidays/HolidaysGovernancePage.jsx';
import MyClassesPage from '../pages/classes/MyClassesPage.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

/**
 * Session-Aware Dynamic Redirects:
 * Prevent authenticated users from ever being kicked to /login due to unknown URLs or notification clicks.
 */
const RootRedirect = () => {
  const { isAuthenticated, user, sessionChecked } = useSelector((state) => state.auth);
  if (!sessionChecked) return null;
  return isAuthenticated && user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

const WildcardRedirect = () => {
  const { isAuthenticated, user, sessionChecked } = useSelector((state) => state.auth);
  if (!sessionChecked) return null;
  return isAuthenticated && user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

/**
 * Client Portal Routes (SPA)
 * Note: The single public main landing page of the entire platform is the Next.js 15 app (landing-page/).
 * The React client (client/) serves strictly as the authenticated workspace & login portal.
 */
export const AppRoutes = () => {
  return (
    <Routes>
      {/* Root of client portal routes dynamically based on active session */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register-student" element={<RegisterStudentPage />} />
      <Route path="/register-teacher" element={<RegisterTeacherPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Core Dashboard & Dedicated Module Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/my-classes" element={<MyClassesPage />} />
        <Route path="/schools" element={<SchoolsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/approvals" element={<PendingApprovalsPage />} />
        <Route path="/staff/:id/profile" element={<StaffProfilePage />} />
        <Route path="/profile" element={<StaffProfilePage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/holidays" element={<HolidaysGovernancePage />} />
        <Route path="/exams" element={<ExamsPage />} />
        <Route path="/transfers" element={<TransfersPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/directory" element={<DirectoryPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />

        {/* Canonical Notification & Legacy URL Aliases (Deep Links) */}
        <Route path="/classes" element={<Navigate to="/my-classes" replace />} />
        <Route path="/leave/my-requests" element={<Navigate to="/dashboard?tab=service" replace />} />
        <Route path="/leave/pending" element={<Navigate to="/approvals" replace />} />
        <Route path="/staff-attendance/pending" element={<Navigate to="/attendance" replace />} />
        <Route path="/staff-attendance/my-record" element={<Navigate to="/dashboard?tab=attendance" replace />} />
        <Route path="/hm/parent-links" element={<Navigate to="/dashboard?tab=approvals" replace />} />
        <Route path="/parent/dashboard" element={<Navigate to="/dashboard" replace />} />
        <Route path="/homework" element={<Navigate to="/dashboard?tab=homework" replace />} />
      </Route>

      {/* Safe Dynamic Fallback: Never log out authenticated users on unrecognized routes */}
      <Route path="*" element={<WildcardRedirect />} />
    </Routes>
  );
};

export default AppRoutes;
