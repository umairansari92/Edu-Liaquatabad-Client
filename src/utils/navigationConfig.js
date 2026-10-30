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
  GraduationCap,
  BookOpen,
  CalendarDays,
  BookMarked,
} from 'lucide-react';

/**
 * Authoritative Role-to-Navigation Mapping
 * Education Department Liaquatabad Town Centre (DMC)
 *
 * Implements strict RBAC navigation groups in accordance with docs/RBAC.md:
 * - STUDENT: Personal workspace, attendance, holidays, circulars.
 * - TEACHER: Teaching workspace, classes, attendance, exams, homework, timetable, circulars, service.
 * - PARENT: Ward workspace, ward attendance, academic results, holidays, circulars.
 * - HM: School management, student/staff directories, duties, timetable, academics, circulars, profile.
 * - SUPERVISOR: Cluster inspection, assigned schools & classes, directory, attendance, transfers, documents.
 * - ADMIN / SUPER_ADMIN / ROOT_ADMIN: Municipal administration, schools, users, directory, approvals.
 * - PEON: Facilities logistics, circulars, duty roster, personal attendance.
 * - SAFE DEFAULT: Self-service items only, zero administrative escalation.
 *
 * @param {string} userRole - User system role
 * @returns {Array<{ label: string, path: string, icon: any }>}
 */
export const getNavigationItemsForRole = (userRole) => {
  if (userRole === 'STUDENT') {
    return [
      { label: 'Student Workspace', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Attendance', path: '/attendance', icon: ClipboardCheck },
      { label: 'Holidays & Calendar', path: '/holidays', icon: Calendar },
      { label: 'Official Circulars', path: '/documents', icon: FileText },
      { label: 'Personal Profile', path: '/profile', icon: IdCard },
    ];
  }

  if (userRole === 'TEACHER') {
    return [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'My Classes', path: '/my-classes', icon: GraduationCap },
      { label: 'School Directory', path: '/directory', icon: BookUser },
      { label: 'Daily Attendance', path: '/dashboard?tab=attendance', icon: ClipboardCheck },
      { label: 'Exam Marks', path: '/dashboard?tab=exams', icon: Award },
      { label: 'Homework', path: '/dashboard?tab=homework', icon: BookOpen },
      { label: 'Class Timetable', path: '/dashboard?tab=timetable', icon: CalendarDays },
      { label: 'Notice Board', path: '/dashboard?tab=circulars', icon: FileText },
      { label: 'Holidays & Calendar', path: '/holidays', icon: Calendar },
      { label: 'Personal Profile', path: '/profile', icon: IdCard },
    ];
  }

  if (userRole === 'PARENT') {
    return [
      { label: 'Parent Workspace', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Ward Attendance', path: '/attendance', icon: ClipboardCheck },
      { label: 'Academic Results', path: '/exams', icon: Award },
      { label: 'Holidays & Calendar', path: '/holidays', icon: Calendar },
      { label: 'Official Circulars', path: '/documents', icon: FileText },
    ];
  }

  if (userRole === 'HM') {
    return [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Student directory', path: '/directory?tab=students', icon: GraduationCap },
      { label: 'Teaching staff', path: '/directory?tab=staff', icon: Users },
      { label: 'Teaching duties', path: '/dashboard?tab=assignments', icon: BookOpen },
      { label: 'School timetable', path: '/dashboard?tab=timetable', icon: CalendarDays },
      { label: 'Daily attendance', path: '/dashboard?tab=attendance', icon: ClipboardCheck },
      { label: 'Academic structure', path: '/dashboard?tab=academics', icon: BookMarked },
      { label: 'Exams & results', path: '/dashboard?tab=exams', icon: Award },
      { label: 'Incoming staff', path: '/transfers', icon: ArrowLeftRight },
      { label: 'Approvals queue', path: '/approvals', icon: ShieldCheck },
      { label: 'Notices & circulars', path: '/dashboard?tab=notices', icon: FileText },
      { label: 'School profile', path: '/dashboard?tab=profile', icon: Building2 },
      { label: 'Holidays & calendar', path: '/holidays', icon: Calendar },
      { label: 'Personal Profile', path: '/profile', icon: IdCard },
    ];
  }

  if (userRole === 'SUPERVISOR') {
    return [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Schools & classes', path: '/schools', icon: Building2 },
      { label: 'Institutional directory', path: '/directory', icon: BookUser },
      { label: 'Attendance', path: '/attendance', icon: ClipboardCheck },
      { label: 'Holidays & calendar', path: '/holidays', icon: Calendar },
      { label: 'Exams & results', path: '/exams', icon: Award },
      { label: 'Staff transfers', path: '/transfers', icon: ArrowLeftRight },
      { label: 'Personal Profile', path: '/profile', icon: IdCard },
      { label: 'Notices & circulars', path: '/documents', icon: FileText },
    ];
  }

  if (['ROOT_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
    const adminItems = [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Approvals', path: '/approvals', icon: ShieldCheck },
      { label: 'Schools & classes', path: '/schools', icon: Building2 },
      { label: 'Account governance', path: '/users', icon: Users },
      { label: 'Institutional directory', path: '/directory', icon: BookUser },
      { label: 'Attendance', path: '/attendance', icon: ClipboardCheck },
      { label: 'Holidays & calendar', path: '/holidays', icon: Calendar },
      { label: 'Exams & results', path: '/exams', icon: Award },
      { label: 'Staff transfers', path: '/transfers', icon: ArrowLeftRight },
      { label: 'Personal Profile', path: '/profile', icon: IdCard },
      { label: 'Notices & circulars', path: '/documents', icon: FileText },
    ];

    if (['ROOT_ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      adminItems.push({ label: 'Platform & audit', path: '/audit-logs', icon: ShieldAlert });
    }

    return adminItems;
  }

  if (userRole === 'PEON') {
    return [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Attendance', path: '/attendance', icon: ClipboardCheck },
      { label: 'Official Circulars', path: '/documents', icon: FileText },
      { label: 'Holidays & Calendar', path: '/holidays', icon: Calendar },
      { label: 'Personal Profile', path: '/profile', icon: IdCard },
    ];
  }

  // Safe fallback for any unrecognized role — strictly self-service, NO administrative items
  return [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Holidays & Calendar', path: '/holidays', icon: Calendar },
    { label: 'Official Circulars', path: '/documents', icon: FileText },
    { label: 'Personal Profile', path: '/profile', icon: IdCard },
  ];
};
