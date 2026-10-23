import React from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { getNavigationItemsForRole } from '../../utils/navigationConfig.js';

export { getNavigationItemsForRole };

export const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);
  const hmSchool = useSelector((state) => state.hm?.summary?.school);
  const location = useLocation();

  if (!user) return null;

  const navigationItems = getNavigationItemsForRole(user.role);

  const resolvedSchoolName =
    user.schoolId?.name ||
    hmSchool?.name ||
    user.schoolName ||
    (typeof user.schoolId === 'string' && !/^[0-9a-fA-F]{24}$/.test(user.schoolId) ? user.schoolId : null);
  const schoolCode =
    user.schoolId?.code ||
    user.schoolId?.schoolCode ||
    hmSchool?.schoolCode ||
    hmSchool?.code ||
    null;

  const currentParams = new URLSearchParams(location.search);
  let currentTab = currentParams.get('tab');
  if (!currentTab && location.pathname === '/directory') {
    currentTab = user?.role === 'HM' ? 'students' : 'staff';
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 text-[#526477] h-[calc(100vh-4rem)] sticky top-16 shrink-0 flex flex-col justify-between p-4 overflow-y-auto z-30 select-none shadow-xs">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#8094A8]">
          Navigation &amp; Modules
        </div>

        {navigationItems.map((navItem) => {
          const Icon = navItem.icon;
          let isActive = false;
          if (navItem.path.includes('?')) {
            const [targetPath, targetQuery] = navItem.path.split('?');
            const targetParams = new URLSearchParams(targetQuery);
            const targetTab = targetParams.get('tab');
            const normalizedCurrentTab = (currentTab || '').toLowerCase();
            const normalizedTargetTab = (targetTab || '').toLowerCase();
            isActive = location.pathname === targetPath && normalizedCurrentTab === normalizedTargetTab;

            // Also match if user is viewing this tab within /dashboard
            if (!isActive && location.pathname === '/dashboard') {
              if (navItem.path === '/directory?tab=students' && currentTab === 'students') isActive = true;
              if (navItem.path === '/directory?tab=staff' && currentTab === 'faculty') isActive = true;
            }
          } else if (navItem.path === '/directory') {
            isActive = location.pathname === '/directory';
          } else {
            // Also match standalone pages when accessed via dashboard tabs
            const isTabAlias =
              location.pathname === '/dashboard' &&
              ((navItem.path === '/my-classes' && currentTab === 'classes') ||
               (navItem.path === '/transfers' && currentTab === 'transfers') ||
               (navItem.path === '/exams' && (currentTab === 'exams' || currentTab === 'results')) ||
               (navItem.path === '/approvals' && currentTab === 'approvals') ||
               (navItem.path === '/attendance' && currentTab === 'attendance') ||
               (navItem.path === '/documents' && (currentTab === 'notices' || currentTab === 'circulars')) ||
               (navItem.path === '/profile' && (currentTab === 'service' || currentTab === 'profile')));
            isActive = isTabAlias || (location.pathname === navItem.path && (!location.search || !location.search.includes('tab=')));
          }
          return (
            <Link
              key={navItem.path}
              to={navItem.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#F0F8FF] text-[#006AC7] border border-[#B9DEFF] font-semibold shadow-xs'
                  : 'hover:bg-[#F8FBFD] hover:text-[#102033] text-[#526477]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#006AC7]' : 'text-[#8094A8]'}`} />
              <span>{navItem.label}</span>
            </Link>
          );
        })}
      </div>

      {/* ── Active Jurisdiction & School Context ── */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
        <p className="font-bold text-slate-900 truncate">
          {resolvedSchoolName || 'Liaquatabad Town Centre'}
        </p>
        <p className="mt-0.5 text-slate-500 text-[11px] truncate">
          {schoolCode ? `School code: ${schoolCode}` : 'TMC • Education Department Liaquatabad Town'}
        </p>
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/60 pt-2">
          <span>School access:</span>
          <span className="font-semibold text-emerald-700">Active</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
