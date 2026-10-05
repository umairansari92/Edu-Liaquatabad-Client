import React from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  BookUser,
  ClipboardCheck,
  Award,
  ArrowLeftRight,
  FileText,
  ShieldAlert,
  ShieldCheck,
  IdCard,
  Calendar,
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);
  const hmSchool = useSelector((state) => state.hm?.summary?.school);
  const location = useLocation();

  if (!user) return null;

  const isStudent = user.role === 'STUDENT';
  const isTeacher = user.role === 'TEACHER';
  const isParent = user.role === 'PARENT';

  let navigationItems = [];
  if (isStudent) {
    navigationItems = [
      { label: 'Student Workspace', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Attendance', path: '/attendance', icon: ClipboardCheck },
      { label: 'Holidays & Calendar', path: '/holidays', icon: Calendar },
      { label: 'Official Circulars', path: '/documents', icon: FileText },
    ];
  } else if (isTeacher) {
    navigationItems = [
      { label: 'Workspace', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Institutional Approvals Queue', path: '/approvals', icon: ShieldCheck },
      { label: 'Attendance', path: '/attendance', icon: ClipboardCheck },
      { label: 'Holidays & Calendar', path: '/holidays', icon: Calendar },
      { label: 'Exams & Results', path: '/exams', icon: Award },
      { label: 'My Service Record', path: '/profile', icon: IdCard },
      { label: 'Circulars & Docs', path: '/documents', icon: FileText },
    ];
  } else if (isParent) {
    navigationItems = [
      { label: 'Parent Workspace', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Ward Attendance', path: '/attendance', icon: ClipboardCheck },
      { label: 'Academic Results', path: '/exams', icon: Award },
      { label: 'Holidays & Calendar', path: '/holidays', icon: Calendar },
      { label: 'Official Circulars', path: '/documents', icon: FileText },
    ];
  } else {
    navigationItems = [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Approvals', path: '/approvals', icon: ShieldCheck },
      { label: 'Schools & classes', path: '/schools', icon: Building2 },
      { label: 'Faculty & staff', path: '/users', icon: Users },
      { label: 'Student directory', path: '/directory', icon: BookUser },
      { label: 'Attendance', path: '/attendance', icon: ClipboardCheck },
      { label: 'Holidays & calendar', path: '/holidays', icon: Calendar },
      { label: 'Exams & results', path: '/exams', icon: Award },
      { label: user?.role === 'HM' ? 'Incoming staff' : 'Staff transfers', path: '/transfers', icon: ArrowLeftRight },
      { label: 'My profile', path: '/profile', icon: IdCard },
      { label: 'Notices & circulars', path: '/documents', icon: FileText },
    ];
  }

  // Super Admin & Root Admin additional items
  if (['ROOT_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    navigationItems.push({ label: 'Platform & audit', path: '/audit-logs', icon: ShieldAlert });
  }

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

  return (
    <aside className="w-64 bg-white border-r border-slate-200 text-[#526477] h-[calc(100vh-4rem)] sticky top-16 shrink-0 flex flex-col justify-between p-4 overflow-y-auto z-30 select-none shadow-xs">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#8094A8]">
          Navigation &amp; Modules
        </div>

        {navigationItems.map((navItem) => {
          const Icon = navItem.icon;
          const isActive = location.pathname === navItem.path;
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
          {schoolCode ? `School code: ${schoolCode}` : 'Education Department (DMC)'}
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
