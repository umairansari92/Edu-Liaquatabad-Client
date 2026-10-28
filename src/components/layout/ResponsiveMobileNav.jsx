import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { getNavigationItemsForRole } from '../../utils/navigationConfig.js';

/**
 * Checks whether a navigation item path is currently active
 * matching both standalone routes and dashboard tab aliases.
 */
const isNavItemActive = (navItemPath, currentPathname, currentSearch) => {
  const currentParams = new URLSearchParams(currentSearch);
  const currentTab = currentParams.get('tab');

  if (navItemPath.includes('?')) {
    const [targetPath, targetQuery] = navItemPath.split('?');
    const targetParams = new URLSearchParams(targetQuery);
    const targetTab = targetParams.get('tab');
    const normalizedCurrentTab = (currentTab || '').toLowerCase();
    const normalizedTargetTab = (targetTab || '').toLowerCase();
    
    if (currentPathname === targetPath && normalizedCurrentTab === normalizedTargetTab) {
      return true;
    }
    // Also match if user is viewing this tab within /dashboard
    if (currentPathname === '/dashboard') {
      if (navItemPath === '/directory?tab=students' && currentTab === 'students') return true;
      if (navItemPath === '/directory?tab=staff' && currentTab === 'faculty') return true;
    }
    return false;
  }

  // Exact path match when no tab query
  if (navItemPath === '/dashboard') {
    return (
      currentPathname === '/dashboard' &&
      (!currentTab || currentTab.toLowerCase() === 'overview' || currentTab.toLowerCase() === 'dashboard')
    );
  }

  // Alias matching (e.g. /my-classes matched by ?tab=classes on /dashboard)
  if (currentPathname === '/dashboard') {
    if (navItemPath === '/my-classes' && currentTab === 'classes') return true;
    if (navItemPath === '/transfers' && currentTab === 'transfers') return true;
    if (navItemPath === '/exams' && (currentTab === 'exams' || currentTab === 'results')) return true;
    if (navItemPath === '/approvals' && currentTab === 'approvals') return true;
    if (navItemPath === '/attendance' && currentTab === 'attendance') return true;
    if (navItemPath === '/documents' && (currentTab === 'notices' || currentTab === 'circulars')) return true;
    if (navItemPath === '/profile' && (currentTab === 'service' || currentTab === 'profile')) return true;
  }

  return currentPathname === navItemPath;
};

/**
 * ResponsiveMobileNav Component
 *
 * Displays a sleek horizontal navigation bar on mobile and tablet devices (< 1024px)
 * where the desktop sidebar is hidden. Automatically populates all tabs matching the
 * user's institutional role and highlights the active route/tab.
 *
 * Preserves the Government Green palette (#38662D, #4B7F3A, #C9DFBC).
 */
export const ResponsiveMobileNav = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const activeTabElementRef = useRef(null);

  // HM Dashboard has its own dedicated HmNavigation bar with live count badges
  if (!user || (user.role === 'HM' && location.pathname === '/dashboard')) {
    return null;
  }

  const navigationItems = getNavigationItemsForRole(user.role);
  if (!navigationItems || navigationItems.length === 0) {
    return null;
  }

  // Smoothly center the active tab into the visible viewport on navigation
  useEffect(() => {
    if (activeTabElementRef.current) {
      activeTabElementRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [location.pathname, location.search]);

  return (
    <nav
      role="tablist"
      aria-label="Responsive Module Navigation"
      className="w-full mb-4 sm:mb-6 lg:hidden print:hidden"
    >
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/70 overflow-x-auto scrollbar-thin select-none shadow-2xs">
        {navigationItems.map((navItem) => {
          const IconComponent = navItem.icon;
          const isActive = isNavItemActive(navItem.path, location.pathname, location.search);

          return (
            <Link
              key={navItem.path}
              ref={isActive ? activeTabElementRef : null}
              to={navItem.path}
              role="tab"
              aria-selected={isActive}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap text-xs sm:text-sm font-semibold shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4B7F3A] ${
                isActive
                  ? 'bg-white text-[#38662D] font-bold border border-[#C9DFBC] shadow-xs'
                  : 'text-[#526477] hover:text-[#102033] hover:bg-white/60'
              }`}
            >
              {IconComponent && (
                <IconComponent
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#38662D]' : 'text-[#8094A8]'}`}
                />
              )}
              <span>{navItem.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default ResponsiveMobileNav;

