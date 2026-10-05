import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { ShieldAlert, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

// Privileged roles (retained for administrative audit logging and scoped workflow authority)
const PRIVILEGED_ROLES = ['ROOT_ADMIN', 'SUPER_ADMIN', 'ADMIN'];

// Sensitive municipal routes requiring elevated attribution density
const SENSITIVE_ROUTE_PREFIXES = [
  '/examinations',
  '/results',
  '/audit',
  '/approvals',
  '/transfers',
  '/finance',
  '/payroll',
];

export const ScreenCaptureProtection = ({ children }) => {
  // ── TEMPORARY BYPASS (FOR DEVELOPER TESTING & AUDITING) ──────────────────────
  // Temporarily commented out per developer instruction to allow unrestricted screenshots
  // and screen capture during dashboard audits and module finishing.
  // Re-enable before final production deployment (Tracked in docs/TODO_MASTER.md Step 8).
  return <>{children}</>;

  /*
  // ── ORIGINAL RESTRICTION LOGIC (RE-ENABLE BEFORE PRODUCTION LAUNCH) ───────────
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const isPrivileged = Boolean(user && PRIVILEGED_ROLES.includes(user.role));
  const isDev = Boolean(import.meta.env.DEV);

  // Heuristic states
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [showCaptureWarning, setShowCaptureWarning] = useState(false);
  // Developer ergonomics toggle (Alt+Shift+D): allows temporarily pausing window-blur heuristics during coding
  const [devHeuristicsPaused, setDevHeuristicsPaused] = useState(false);

  // Security Toast throttler to prevent spamming
  const notifyCaptureBlocked = useCallback(() => {
    toast.error('Screenshot & screen capture are restricted under Municipal Security Policy.', {
      id: 'screen-capture-blocked',
      duration: 3500,
    });
  }, []);

  // Check if current route is in a high-sensitivity municipal module
  const isSensitiveModule = useMemo(() => {
    return SENSITIVE_ROUTE_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));
  }, [location.pathname]);

  // Dynamic forensic watermark text resolved per authentication state
  const currentDateString = useMemo(() => new Date().toISOString().split('T')[0], []);
  const watermarkText = useMemo(() => {
    if (!user) {
      return `LIAQUATABAD DMC • OFFICIAL PORTAL • CONFIDENTIAL`;
    }

    const schoolIdentity = user.schoolId?.name
      ? user.schoolId.name
      : user.schoolId?.code
      ? user.schoolId.code
      : typeof user.schoolId === 'string' && user.schoolId
      ? user.schoolId.slice(-6).toUpperCase()
      : Array.isArray(user.assignedSchools) && user.assignedSchools.length > 0
      ? `${user.assignedSchools.length} Assigned Schools`
      : 'CENTRAL HQ';

    const actorName = user.fullName || 'OFFICIAL ACTOR';
    const actorRole = user.role || 'CIVIL_USER';
    const classification = isSensitiveModule ? 'SENSITIVE MUNICIPAL RECORD • CONFIDENTIAL' : 'CONFIDENTIAL';

    return `${actorName} • ${actorRole} • ${schoolIdentity} • ${currentDateString} • ${classification}`;
  }, [user, isSensitiveModule, currentDateString]);

  useEffect(() => {
    // Apply CSS-level body protection class
    document.body.classList.add('screen-protected');

    // 1. Intercept Screenshot & Print Hotkeys
    const handleKeyDown = (event) => {
      const isPrintScreen = event.key === 'PrintScreen' || event.keyCode === 44;
      const isPrintShortcut = (event.ctrlKey || event.metaKey) && event.key?.toLowerCase() === 'p';
      const isSnippingShortcut = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key?.toLowerCase() === 's';
      const isSaveShortcut = (event.ctrlKey || event.metaKey) && event.key?.toLowerCase() === 's';

      // Developer mode shortcut to toggle heuristics while inspecting UI (Alt + Shift + D)
      if (isDev && event.altKey && event.shiftKey && event.key?.toLowerCase() === 'd') {
        event.preventDefault();
        setDevHeuristicsPaused((previous) => {
          const nextState = !previous;
          toast.success(
            nextState
              ? 'Dev Mode: Heuristic screen blur paused for debugging.'
              : 'Dev Mode: Heuristic screen blur re-enabled.',
            { id: 'dev-heuristics-toggle', duration: 2500 }
          );
          if (nextState) setIsWindowBlurred(false);
          return nextState;
        });
        return false;
      }

      // DevTools keys: blocked in production only; allowed in development for engineering convenience
      const isDevToolsShortcut =
        !isDev &&
        (event.key === 'F12' ||
          ((event.ctrlKey || event.metaKey) && event.shiftKey && ['i', 'c', 'j'].includes(event.key?.toLowerCase())));

      if (isPrintScreen || isPrintShortcut || isSnippingShortcut || isSaveShortcut || isDevToolsShortcut) {
        event.preventDefault();
        event.stopPropagation();

        // Sanitize clipboard immediately to flush any OS-buffered screenshot
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

    // 2. Window Blur, Mouseleave & Visibility Heuristics
    let mouseLeaveTimer = null;

    const handleWindowBlur = () => {
      if (devHeuristicsPaused) return;
      setIsWindowBlurred(true);
    };

    const handleWindowFocus = () => {
      setIsWindowBlurred(false);
    };

    const handleMouseLeave = () => {
      if (devHeuristicsPaused) return;
      // In dev mode, apply a slight 200ms debounce so rapid cursor transitions don't jarringly flash
      if (isDev) {
        mouseLeaveTimer = setTimeout(() => {
          setIsWindowBlurred(true);
        }, 200);
      } else {
        setIsWindowBlurred(true);
      }
    };

    const handleMouseEnter = () => {
      if (mouseLeaveTimer) {
        clearTimeout(mouseLeaveTimer);
        mouseLeaveTimer = null;
      }
      setIsWindowBlurred(false);
    };

    const handleVisibilityChange = () => {
      if (devHeuristicsPaused) return;
      if (document.hidden) {
        setIsWindowBlurred(true);
      } else {
        setIsWindowBlurred(false);
      }
    };

    // 3. Block Right-Click Context Menu (Prevents "Save Image As", "Print", "Inspect" in Prod)
    const handleContextMenu = (event) => {
      if (isDev && devHeuristicsPaused) return;
      event.preventDefault();
      return false;
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      if (mouseLeaveTimer) clearTimeout(mouseLeaveTimer);
      document.body.classList.remove('screen-protected');
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isDev, devHeuristicsPaused, notifyCaptureBlocked]);

  return (
    <div className="relative min-h-screen select-none">
      {/* ── Dynamic Anti-Leak Forensic Civic Watermark (ALWAYS Rendered for Forensic Attribution) ── */}
      <div
        className={`pointer-events-none fixed inset-0 z-40 overflow-hidden select-none flex flex-wrap gap-x-16 gap-y-12 p-4 transition-opacity duration-200 ${
          isSensitiveModule ? 'opacity-[0.065]' : 'opacity-[0.045]'
        }`}
        aria-hidden="true"
      >
        {Array.from({ length: 36 }).map((_, index) => (
          <div
            key={index}
            className={`transform -rotate-25 text-[10px] sm:text-[11px] font-mono tracking-widest text-slate-800 dark:text-slate-300 uppercase whitespace-nowrap ${
              isSensitiveModule ? 'font-extrabold' : 'font-bold'
            }`}
          >
            {watermarkText}
          </div>
        ))}
      </div>

      {/* ── Active Screen Content ── */}
      <div className={isWindowBlurred ? 'filter blur-2xl transition-all duration-150' : 'transition-all duration-150'}>
        {children}
      </div>

      {/* ── Privacy Shield (Triggered when window loses focus e.g. Snipping Tool / External App Switcher) ── */}
      {isWindowBlurred && (
        <div
          onClick={() => setIsWindowBlurred(false)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-2xl p-6 text-center select-none cursor-pointer animate-in fade-in duration-100"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300 bg-amber-50 text-amber-600 mb-4 shadow-sm">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-[#102033] tracking-wide">
            Liaquatabad Municipal Platform • Privacy Guard
          </h2>
          <p className="mt-2 max-w-md text-xs text-[#526477] leading-relaxed">
            Content is obscured while the application window is out of focus to prevent unauthorized screen capture or external recording.
          </p>
          <p className="mt-4 text-[11px] font-mono text-[#006AC7] bg-[#F0F8FF] border border-blue-200 rounded-lg px-3 py-1.5 shadow-xs">
            Click anywhere on this window to resume viewing.
          </p>
          {isDev && (
            <p className="mt-3 text-[10px] font-mono text-slate-400">
              [Dev Tip: Press Alt + Shift + D to toggle heuristic blur during development]
            </p>
          )}
        </div>
      )}

      {/* ── Flash Capture Warning (Triggered on PrintScreen / Screenshot shortcuts) ── */}
      {showCaptureWarning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md p-6 text-center animate-in fade-in zoom-in-95 duration-75">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 mb-4 animate-bounce shadow-sm">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-extrabold text-[#102033] tracking-wide uppercase">
            Screenshot Prohibited
          </h2>
          <p className="mt-2 max-w-md text-xs text-[#526477]">
            Capturing or redistributing municipal education records is prohibited under official administrative data policy.
          </p>
        </div>
      )}
    </div>
  );
  */
};

export default ScreenCaptureProtection;
