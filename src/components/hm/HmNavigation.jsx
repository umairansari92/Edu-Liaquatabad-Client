import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookMarked,
  BookOpen,
  CalendarDays,
  Award,
  ClipboardCheck,
  UserCheck,
  ArrowLeftRight,
  FileText,
  TrendingUp,
  Building2,
  History,
} from 'lucide-react';

export const HM_NAV_GROUPS = [
  {
    id: 'command',
    label: 'Overview',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    id: 'people',
    label: 'People',
    items: [
      { id: 'students', label: 'Students', icon: GraduationCap, badgeKey: 'students' },
      { id: 'faculty', label: 'Teaching staff', icon: Users, badgeKey: 'faculty' },
    ],
  },
  {
    id: 'academics',
    label: 'Academics',
    items: [
      { id: 'academics', label: 'Academic structure', icon: BookMarked },
      { id: 'assignments', label: 'Teaching assignments', icon: BookOpen },
      { id: 'timetable', label: 'Timetable', icon: CalendarDays },
      { id: 'exams', label: 'Exams & results', icon: Award },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
      { id: 'approvals', label: 'Approvals', icon: UserCheck, badgeKey: 'approvals' },
      { id: 'transfers', label: 'Incoming staff', icon: ArrowLeftRight, badgeKey: 'transfers' },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    items: [
      { id: 'notices', label: 'Notices & circulars', icon: FileText },
    ],
  },
  {
    id: 'records',
    label: 'Reports & records',
    items: [
      { id: 'reports', label: 'Reports', icon: TrendingUp },
      { id: 'profile', label: 'School profile', icon: Building2 },
      { id: 'activity', label: 'Activity log', icon: History },
    ],
  },
];

export const HmNavigation = ({ activeTab, onSelectTab, badges = {} }) => {
  return (
    <nav
      className="w-full bg-white border border-slate-200/80 rounded-2xl p-2 sm:p-3 mb-6 shadow-xs select-none"
      aria-label="Head Master Module Navigation"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Navigation Groups Container */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {HM_NAV_GROUPS.map((group) => (
            <div key={group.id} className="flex items-center gap-1.5 flex-wrap">
              {/* Group Heading (Accessible & Visual Category Label) */}
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 hidden xl:inline-block">
                {group.label}
              </span>

              {/* Group Items */}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const badgeCount = item.badgeKey ? badges[item.badgeKey] : null;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#006AC7] focus:ring-offset-1 ${
                      isActive
                        ? 'bg-[#006AC7] text-white shadow-xs'
                        : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>

                    {/* Dynamic Real Badge Counter */}
                    {badgeCount != null && badgeCount > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                          isActive
                            ? 'bg-white/25 text-white'
                            : item.id === 'approvals' || item.id === 'transfers'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                        title={`${badgeCount} items`}
                      >
                        {badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Subtle divider between groups on wide screens */}
              <div className="h-4 w-px bg-slate-200 mx-1 hidden lg:block" aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default HmNavigation;
