import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { ShieldAlert, Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated, sessionChecked } = useSelector((state) => state.auth);

  // Show smooth loading state while verifying initial session
  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-[#F8FBFD] flex flex-col items-center justify-center p-4">
        <div className="flex items-center space-x-3 text-[#006AC7]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm font-medium tracking-wide text-[#526477]">
            Verifying Government Portal Security Session...
          </span>
        </div>
      </div>
    );
  }

  // Not authenticated -> redirect to Login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Role validation
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-[#F8FBFD] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-slate-200/80 text-center shadow-xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-5 shadow-sm">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#102033] tracking-tight">403 - Access Denied</h2>
          <p className="text-sm text-[#526477] mt-2 leading-relaxed">
            Your authenticated role (<span className="text-[#006AC7] font-mono font-semibold bg-[#F0F8FF] px-2 py-0.5 rounded border border-blue-200">{user.role}</span>) does not possess authorization to view this departmental resource.
          </p>
          <div className="mt-6">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#006AC7] hover:bg-[#00529B] text-white text-xs font-semibold tracking-wide transition-colors shadow-sm"
            >
              Return to Authorized Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
