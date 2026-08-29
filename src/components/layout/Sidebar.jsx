import React from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  ClipboardCheck,
  Award,
  ArrowLeftRight,
  FileText,
  ShieldAlert,
  Settings,
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!user) return null;

  const navigationItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Schools & Classes', path: '/schools', icon: Building2 },
    { label: 'Faculty & Users', path: '/users', icon: Users },
    { label: 'Attendance', path: '/attendance', icon: ClipboardCheck },
    { label: 'Exams & Results', path: '/exams', icon: Award },
    { label: 'Transfers', path: '/transfers', icon: ArrowLeftRight },
    { label: 'Circulars & Docs', path: '/documents', icon: FileText },
  ];

  // Super Admin additional item
  if (user.role === 'SUPER_ADMIN') {
    navigationItems.push({ label: 'Platform & Audit', path: '/audit-logs', icon: ShieldAlert });
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Navigation & Modules
        </div>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400">
        <p className="font-semibold text-slate-200">Active Jurisdiction</p>
        <p className="mt-0.5">Liaquatabad Town Centre</p>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-700/50 pt-2">
          <span>Scope:</span>
          <span className="font-mono text-emerald-400">{user.scope}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
