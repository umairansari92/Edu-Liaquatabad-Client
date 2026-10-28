import React, { useRef } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  ClipboardCheck,
  UserCheck,
  CalendarDays,
  BookOpen,
  BookMarked,
  Award,
  ArrowLeftRight,
  FileText,
  TrendingUp,
  Building2,
  History,
  Calendar,
  IdCard,
} from 'lucide-react';

export const HM_NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: GraduationCap, badgeKey: 'students' },
  { id: 'faculty', label: 'Teaching Staff', icon: Users, badgeKey: 'faculty' },
  { id: 'attendance', label: 'Daily Attendance', icon: ClipboardCheck },
  { id: 'approvals', label: 'Approvals & Claims', icon: UserCheck, badgeKey: 'approvals' },
  { id: 'timetable', label: 'School Timetable', icon: CalendarDays },
  { id: 'assignments', label: 'Teaching Duties', icon: BookOpen },
  { id: 'academics', label: 'Academic Structure', icon: BookMarked },
  { id: 'exams', label: 'Exams & Results', icon: Award },
  { id: 'transfers', label: 'Incoming Staff', icon: ArrowLeftRight, badgeKey: 'transfers' },
  { id: 'notices', label: 'Circulars & Notices', icon: FileText },
  { id: 'reports', label: 'Reports', icon: TrendingUp },
  { id: 'profile', label: 'School Profile', icon: Building2 },
  { id: 'holidays', label: 'Holidays & Calendar', icon: Calendar, path: '/holidays' },
  { id: 'personal-profile', label: 'Personal Profile', icon: IdCard, path: '/profile' },
  { id: 'activity', label: 'Activity Log', icon: History },
];

export const HmNavigation = ({ activeTab, onSelectTab, badges = {} }) => {
  const scrollContainerRef = useRef(null);

  return (
    <nav
      role="tablist"
      aria-label="Head Master Module Navigation"
      className="w-full mb-6 lg:hidden print:hidden"
    >
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/70 overflow-x-auto scrollbar-thin select-none shadow-2xs"
      >
        {HM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const badgeCount = item.badgeKey ? badges[item.badgeKey] : null;

          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => onSelectTab(item.id, item.path)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap text-xs sm:text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4B7F3A] shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-white text-[#38662D] shadow-xs font-bold border border-[#C9DFBC]'
                  : 'text-[#526477] hover:text-[#102033] hover:bg-white/60'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-[#38662D]' : 'text-[#8094A8]'
                }`}
              />
              <span>{item.label}</span>

              {/* Dynamic Badge Counter */}
              {badgeCount != null && badgeCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                    isActive
                      ? 'bg-[#E3F0DC] text-[#38662D]'
                      : item.id === 'approvals' || item.id === 'transfers'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                  title={`${badgeCount} ${item.label.toLowerCase()}`}
                >
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default HmNavigation;
