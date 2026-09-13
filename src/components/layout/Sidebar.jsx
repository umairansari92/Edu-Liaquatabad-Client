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
  const location = useLocation();

  if (!user) return null;

  const isTeacher = user.role === 'TEACHER';

  const navigationItems = isTeacher
    ? [
        { label: 'Workspace', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Institutional Approvals Queue', path: '/approvals', icon: ShieldCheck },
        { label: 'Attendance', path: '/attendance', icon: ClipboardCheck },
        { label: 'Holidays & Calendar', path: '/holidays', icon: Calendar },
        { label: 'Exams & Results', path: '/exams', icon: Award },
        { label: 'My Service Record', path: '/profile', icon: IdCard },
        { label: 'Circulars & Docs', path: '/documents', icon: FileText },
      ]
    : [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Institutional Approvals Queue', path: '/approvals', icon: ShieldCheck },
        { label: 'Schools & Classes', path: '/schools', icon: Building2 },
        { label: 'Faculty & Users', path: '/users', icon: Users },
        { label: 'Directory & Export', path: '/directory', icon: BookUser },
        { label: 'Attendance', path: '/attendance', icon: ClipboardCheck },
        { label: 'Holidays & Calendar', path: '/holidays', icon: Calendar },
        { label: 'Exams & Results', path: '/exams', icon: Award },
        { label: 'Transfers', path: '/transfers', icon: ArrowLeftRight },
        { label: 'My Profile', path: '/profile', icon: IdCard },
        { label: 'Circulars & Docs', path: '/documents', icon: FileText },
      ];

  // Super Admin & Root Admin additional items
  if (['ROOT_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    navigationItems.push({ label: 'Platform & Audit', path: '/audit-logs', icon: ShieldAlert });
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 text-[#526477] h-[calc(100vh-4rem)] sticky top-16 shrink-0 flex flex-col justify-between p-4 overflow-y-auto z-30 select-none shadow-xs">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#8094A8]">
          Navigation &amp; Modules
        </div>

        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#F0F8FF] text-[#006AC7] border border-[#B9DEFF] font-semibold shadow-xs'
                  : 'hover:bg-[#F8FBFD] hover:text-[#102033] text-[#526477]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#006AC7]' : 'text-[#8094A8]'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-3.5 rounded-xl bg-[#F8FBFD] border border-slate-200 text-xs text-[#526477]">
        <p className="font-bold text-[#102033]">Active Jurisdiction</p>
        <p className="mt-0.5 text-[#526477]">Liaquatabad Town Centre</p>
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#526477] border-t border-slate-200 pt-2">
          <span>Scope:</span>
          <span className="font-mono font-bold text-[#006AC7]">{user.scope}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
