import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice.js';
import { Bell, User, LogOut, School, Loader2, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import NotificationDropdown from '../notifications/NotificationDropdown.jsx';
import SecuritySettingsModal from '../common/SecuritySettingsModal.jsx';

export const Navbar = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notifications);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success('Signed out successfully.');
    } catch {
      toast.success('Signed out.');
    } finally {
      navigate('/login');
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-[#102033] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#006AC7] flex items-center justify-center shadow-md group-hover:bg-[#005299] transition-colors">
            <School className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-base sm:text-lg leading-tight tracking-tight text-[#102033] flex items-center gap-1.5">
              Education Department
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#E3F0DC] text-[#4B7F3A] border border-[#C9DFBC] font-semibold">
                DMC
              </span>
            </div>
            <p className="text-xs text-[#526477] font-medium tracking-wide">
              Liaquatabad Town Centre
            </p>
          </div>
        </Link>

        {/* Right Navigation Controls */}
        <div className="flex items-center space-x-4">
          {isAuthenticated && user ? (
            <>
              {/* Notification Indicator & Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications((prev) => !prev)}
                  className="relative p-2 text-[#526477] hover:text-[#006AC7] rounded-xl hover:bg-slate-100 transition-colors"
                  title="Notifications"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#006AC7] ring-2 ring-white" />
                  )}
                </button>

                <NotificationDropdown
                  isOpen={showNotifications}
                  onClose={() => setShowNotifications(false)}
                />
              </div>

              {/* Account Security & Active Sessions Button */}
              <button
                onClick={() => setShowSecurityModal(true)}
                className="p-2 text-[#526477] hover:text-[#006AC7] rounded-xl hover:bg-slate-100 transition-colors"
                title="Account Security & Active Sessions"
                aria-label="Account Security & Active Sessions"
              >
                <Shield className="w-5 h-5" />
              </button>

              {/* User Profile Pill */}
              <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-[#102033] leading-tight">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-[#006AC7] font-semibold">
                    {user.designation
                      ? user.designation.replace(/\s*\(Break-Glass Recovery\)/i, '')
                      : user.role}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#F0F8FF] border border-[#B9DEFF] flex items-center justify-center text-[#006AC7] font-bold">
                  <User className="w-5 h-5" />
                </div>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="p-2 text-[#8094A8] hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors disabled:opacity-50"
                  title="Sign Out"
                  aria-label="Sign out"
                >
                  {loggingOut ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <LogOut className="w-5 h-5" />
                  )}
                </button>
              </div>

              <SecuritySettingsModal
                isOpen={showSecurityModal}
                onClose={() => setShowSecurityModal(false)}
              />
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-sm font-semibold text-[#526477] hover:text-[#006AC7] px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register-student"
                className="btn-primary text-sm shadow-md"
              >
                Register Portal
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
