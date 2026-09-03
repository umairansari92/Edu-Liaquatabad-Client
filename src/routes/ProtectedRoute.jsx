import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { ShieldAlert, Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated, sessionChecked } = useSelector((state) => state.auth);

  // Show smooth loading state while verifying initial session
  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex items-center space-x-3 text-emerald-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm font-medium tracking-wide text-slate-300">
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-5 shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">403 - Access Denied</h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Your authenticated role (<span className="text-emerald-400 font-mono font-semibold">{user.role}</span>) does not possess authorization to view this departmental resource.
          </p>
          <div className="mt-6">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold tracking-wide transition-colors"
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
