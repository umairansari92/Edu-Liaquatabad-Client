import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { ShieldAlert, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

// Privileged roles that are legally allowed to capture screens / take records
const PRIVILEGED_ROLES = ['ROOT_ADMIN', 'SUPER_ADMIN', 'ADMIN'];

export const ScreenCaptureProtection = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const isPrivileged = user && PRIVILEGED_ROLES.includes(user.role);

  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [showCaptureWarning, setShowCaptureWarning] = useState(false);

  // Security Toast throttler to prevent spamming
  const notifyCaptureBlocked = useCallback(() => {
    toast.error('Screenshot & screen recording are restricted under Municipal Security Policy.', {
      id: 'screen-capture-blocked',
      duration: 3500,
    });
  }, []);

  useEffect(() => {
    // If user is ROOT_ADMIN, SUPER_ADMIN, or ADMIN, bypass all capture guards
    if (isPrivileged) {
      document.body.classList.remove('screen-protected');
      setIsWindowBlurred(false);
      return;
    }

    // Apply CSS-level protections to body
    document.body.classList.add('screen-protected');

    // 1. Intercept PrintScreen and Screenshot Hotkeys
    const handleKeyDown = (event) => {
      const isPrintScreen = event.key === 'PrintScreen' || event.keyCode === 44;
      const isPrintShortcut = (event.ctrlKey || event.metaKey) && event.key?.toLowerCase() === 'p';
      const isSnippingShortcut = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key?.toLowerCase() === 's';
      const isSaveShortcut = (event.ctrlKey || event.metaKey) && event.key?.toLowerCase() === 's';
      const isDevToolsShortcut =
        event.key === 'F12' ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && ['i', 'c', 'j'].includes(event.key?.toLowerCase()));

      if (isPrintScreen || isPrintShortcut || isSnippingShortcut || isSaveShortcut || isDevToolsShortcut) {
        event.preventDefault();
        event.stopPropagation();

        // Clear clipboard immediately to sanitize any OS-buffered screen snapshot
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }

        setShowCaptureWarning(true);
        notifyCaptureBlocked();

        setTimeout(() => {
          setShowCaptureWarning(false);
        }, 1800);

        return false;
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === 'PrintScreen' || event.keyCode === 44) {
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }
        setShowCaptureWarning(true);
        notifyCaptureBlocked();
        setTimeout(() => {
          setShowCaptureWarning(false);
        }, 1800);
      }
    };

    // 2. Window Blur & Visibility (Defends against Windows Snipping Tool, screen grabbers & app-switchers)
    const handleWindowBlur = () => {
      setIsWindowBlurred(true);
    };

    const handleWindowFocus = () => {
      setIsWindowBlurred(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsWindowBlurred(true);
      } else {
        setIsWindowBlurred(false);
      }
    };

    // 3. Block Right-Click Context Menu (Prevents "Save Image As", "Print", "Inspect")
    const handleContextMenu = (event) => {
      event.preventDefault();
      return false;
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.body.classList.remove('screen-protected');
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isPrivileged, notifyCaptureBlocked]);

  // Privileged actors experience completely normal, unobstructed UI
  if (isPrivileged) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen">
      {/* ── Dynamic Anti-Leak Civic Watermark ── */}
      <div
        className="pointer-events-none fixed inset-0 z-40 overflow-hidden opacity-[0.035] select-none flex flex-wrap gap-24 p-8"
        aria-hidden="true"
      >
        {Array.from({ length: 18 }).map((_, index) => (
          <div
            key={index}
            className="transform -rotate-25 text-xs font-mono font-bold tracking-wider text-slate-400 uppercase"
          >
            LIAQUATABAD DMC • {user?.fullName || user?.role || 'CIVIC USER'} • CONFIDENTIAL
          </div>
        ))}
      </div>

      {/* ── Active Screen Content ── */}
      <div className={isWindowBlurred ? 'filter blur-2xl transition-all duration-150' : 'transition-all duration-150'}>
        {children}
      </div>

      {/* ── Privacy Shield (Triggered when window loses focus e.g. Snipping Tool / Screen Grabber) ── */}
      {isWindowBlurred && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-6 text-center select-none animate-in fade-in duration-100">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 mb-4 shadow-xl">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            Liaquatabad Municipal Platform • Privacy Guard
          </h2>
          <p className="mt-2 max-w-md text-xs text-slate-400 leading-relaxed">
            Content is obscured while the application window is out of focus to prevent unauthorized screen capture or external recording.
          </p>
          <p className="mt-4 text-[11px] font-mono text-emerald-400 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
            Click anywhere on this window to resume viewing.
          </p>
        </div>
      )}

      {/* ── Flash Capture Warning (Triggered on PrintScreen / Screenshot shortcuts) ── */}
      {showCaptureWarning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-6 text-center animate-in fade-in zoom-in-95 duration-75">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10 text-red-400 mb-4 animate-bounce">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-wide uppercase">
            Screenshot Prohibited
          </h2>
          <p className="mt-2 max-w-md text-xs text-slate-300">
            Capturing or redistributing municipal education records is prohibited under official administrative data policy.
          </p>
        </div>
      )}
    </div>
  );
};

export default ScreenCaptureProtection;
