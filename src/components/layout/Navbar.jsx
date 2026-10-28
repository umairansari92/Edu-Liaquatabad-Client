import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice.js';
import { fetchNotifications } from '../../store/slices/notificationSlice.js';
import { Bell, User, LogOut, School, Loader2, Shield, Download, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import NotificationDropdown from '../notifications/NotificationDropdown.jsx';
import SecuritySettingsModal from '../common/SecuritySettingsModal.jsx';
import ConnectionStatusBadge from '../common/ConnectionStatusBadge.jsx';
import { usePwaInstall } from '../../hooks/usePwaInstall.js';
import { clearUserRecords } from '../../services/reliability/draftStorage.js';

export const Navbar = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notifications);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const { canInstallApplication, triggerInstallPrompt } = usePwaInstall();

  // Initial and periodic refresh of in-app notifications
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Initial fetch on mount
    dispatch(fetchNotifications({ limit: 20 }));

    // Periodic 60s background refresh (non-blocking)
    const pollInterval = setInterval(() => {
      dispatch(fetchNotifications({ limit: 20 }));
    }, 60000);

    // Refresh when user returns to tab
    const handleWindowFocus = () => {
      dispatch(fetchNotifications({ limit: 20 }));
    };
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isAuthenticated, user?._id, dispatch]);

  const handleLogout = async () => {
    setLoggingOut(true);

    // Clear IndexedDB offline queue for this user session.
    // This is deliberately non-blocking: an IndexedDB failure must NEVER
    // prevent the server-side session from being terminated. The server
    // holds the authoritative session state; local storage is secondary.
    const userSessionBinding = user?._id || user?.userId;
    if (userSessionBinding) {
      clearUserRecords(userSessionBinding).catch((storageCleanupError) => {
        console.warn('[Logout] IndexedDB offline queue cleanup failed (non-blocking):', storageCleanupError);
      });
    }

    try {
      await dispatch(logoutUser()).unwrap();
    } catch (logoutDispatchError) {
      // Log dispatch failure but do NOT abort navigation.
      // The server may have already invalidated the session cookie;
      // keeping the user on the authenticated page would be worse.
      console.error('[Logout] Server session termination failed:', logoutDispatchError);
    } finally {
      setLoggingOut(false);
      navigate('/login');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-[#102033] shadow-sm">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-2 md:py-0 md:h-16 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 md:gap-4">
        {/* Row 1: Brand / Logo */}
        <Link to="/" className="flex items-start sm:items-center space-x-2.5 sm:space-x-3 group shrink-0 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#4B7F3A] flex items-center justify-center shadow-md group-hover:bg-[#38662D] transition-colors shrink-0 mt-0.5 sm:mt-0">
            <School className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm sm:text-base md:text-lg leading-tight tracking-tight text-[#102033] flex items-center gap-1.5 flex-wrap">
              <span>School Management System</span>
              <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-[#E3F0DC] text-[#4B7F3A] border border-[#C9DFBC] font-semibold shrink-0">
                TMC
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#526477] font-medium tracking-wide mt-0.5 leading-snug break-words">
              Town Municipal Corporation (TMC) • Education Department Liaquatabad Town
            </p>
          </div>
        </Link>

        {/* Global Search Bar (Supported directory search on Enter - Desktop only) */}
        {isAuthenticated && user && (
          <div className="hidden md:flex items-center flex-1 max-w-sm mx-4 lg:mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students, staff or records..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#4B7F3A]/20 focus:border-[#4B7F3A] focus:bg-white transition"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && event.target.value.trim()) {
                    navigate(`/directory?search=${encodeURIComponent(event.target.value.trim())}`);
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Row 2 on Mobile / Right Navigation Controls on Desktop */}
        <div className="flex items-center justify-between md:justify-end w-full md:w-auto pt-2 md:pt-0 border-t border-slate-100 md:border-t-0 gap-2 shrink-0">
          {isAuthenticated && user ? (
            <>
              {/* Teacher Profile Identity (Left on mobile, Right before logout on desktop) */}
              <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0 order-1 md:order-2 md:pl-3 md:border-l md:border-slate-200">
                {/* On desktop: name & designation appear to the left of the avatar */}
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-[#102033] leading-tight">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-[#38662D] font-semibold">
                    {user.designation
                      ? user.designation.replace(/\s*\(Break-Glass Recovery\)/i, '')
                      : user.role}
                  </p>
                </div>

                {/* Avatar (visible on both mobile and desktop) */}
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#F2F8EF] border border-[#C9DFBC] flex items-center justify-center text-[#38662D] font-bold shrink-0">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                {/* On mobile: name & designation appear to the right of the avatar */}
                <div className="min-w-0 md:hidden">
                  <p className="text-xs sm:text-sm font-bold text-[#102033] leading-tight truncate">
                    {user.fullName}
                  </p>
                  <p className="text-[10px] sm:text-xs text-[#38662D] font-semibold truncate">
                    {user.designation
                      ? user.designation.replace(/\s*\(Break-Glass Recovery\)/i, '')
                      : user.role}
                  </p>
                </div>
              </div>

              {/* Status & Action Controls (Right on mobile, Left of profile on desktop) */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 shrink-0 order-2 md:order-1">
                {/* Live Connection Status Badge */}
                <ConnectionStatusBadge />

                {/* PWA Direct Installation Prompt Button */}
                {canInstallApplication && (
                  <button
                    onClick={triggerInstallPrompt}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-xl bg-blue-50 text-[#006AC7] border border-[#B9DEFF] hover:bg-blue-100 transition-colors shadow-xs btn-tactile"
                    title="Install School Portal on this device"
                    aria-label="Install School Portal"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Install App</span>
                  </button>
                )}

                {/* Notification Indicator & Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications((prev) => !prev)}
                    className={`relative p-1.5 sm:p-2 rounded-xl transition-all ${
                      showNotifications
                        ? 'text-[#38662D] bg-[#F2F8EF] ring-2 ring-[#4B7F3A]/20'
                        : 'text-[#526477] hover:text-[#38662D] hover:bg-slate-100'
                    }`}
                    title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'Notifications'}
                    aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
                    aria-expanded={showNotifications}
                    aria-haspopup="dialog"
                  >
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5 transition-transform active:scale-95" />
                    {unreadCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] px-1 flex items-center justify-center text-[9px] sm:text-[10px] font-extrabold text-white bg-rose-600 rounded-full shadow-xs ring-2 ring-white animate-in zoom-in-75 duration-150"
                        aria-hidden="true"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
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
                  className={`p-1.5 sm:p-2 rounded-xl transition-all ${
                    showSecurityModal
                      ? 'text-[#38662D] bg-[#F2F8EF] ring-2 ring-[#4B7F3A]/20'
                      : 'text-[#526477] hover:text-[#38662D] hover:bg-slate-100'
                  }`}
                  title="Account Security & Active Sessions"
                  aria-label="Account Security & Active Sessions"
                  aria-expanded={showSecurityModal}
                  aria-haspopup="dialog"
                >
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 transition-transform active:scale-95" />
                </button>
              </div>

              {/* Logout Button (Order 3: after action buttons on mobile, after avatar on desktop) */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="p-1.5 sm:p-2 text-[#8094A8] hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors disabled:opacity-50 order-3 md:order-3"
                title="Sign Out"
                aria-label="Sign out"
              >
                {loggingOut ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>

              <SecuritySettingsModal
                isOpen={showSecurityModal}
                onClose={() => setShowSecurityModal(false)}
              />
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-sm font-semibold text-[#526477] hover:text-[#38662D] px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors"
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
