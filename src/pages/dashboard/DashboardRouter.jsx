import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import RootAdminDashboard from './RootAdminDashboard.jsx';
import SuperAdminDashboard from './SuperAdminDashboard.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import TeacherDashboard from './TeacherDashboard.jsx';
import HmDashboard from './HmDashboard.jsx';
import StudentDashboard from './StudentDashboard.jsx';
import SupervisorDashboard from './SupervisorDashboard.jsx';
import PageContainer from '../../components/layout/PageContainer.jsx';
import apiClient from '../../services/apiClient.js';
import {
  School,
  Users,
  GraduationCap,
  ClipboardCheck,
  Award,
  ArrowLeftRight,
  ShieldCheck,
  TrendingUp,
  FileText,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export const DashboardRouter = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    totalSchools: '...',
    totalTeachers: '...',
    enrolledStudents: '...',
    digitalAttendanceRate: '...',
  });
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const isDedicatedRole = user && ['ROOT_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'TEACHER', 'HM', 'STUDENT', 'SUPERVISOR'].includes(user.role);

  useEffect(() => {
    // Only fetch live stats if the user falls into the unmapped fallback dashboard view
    if (!user || isDedicatedRole) {
      setIsStatsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchLiveStats = async () => {
      try {
        const response = await apiClient.get('/public/stats');
        if (response.data?.success && response.data?.data && isMounted) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error('Failed to load live statistics:', error);
      } finally {
        if (isMounted) setIsStatsLoading(false);
      }
    };

    fetchLiveStats();
    return () => { isMounted = false; };
  }, [user, isDedicatedRole]);

  if (!user) return null;

  // Supreme Governance Platform Architect Dashboard
  if (user.role === 'ROOT_ADMIN') {
    return <RootAdminDashboard />;
  }

  // Primary Operational Super Admin Command Center
  if (user.role === 'SUPER_ADMIN') {
    return <SuperAdminDashboard />;
  }

  // Municipal Town Admin Workspace
  if (user.role === 'ADMIN') {
    return <AdminDashboard />;
  }

  // Teacher Operational Workspace
  if (user.role === 'TEACHER') {
    return <TeacherDashboard />;
  }

  // HM: School authority
  if (user.role === 'HM') {
    return <HmDashboard />;
  }

  // STUDENT: Read-only student workspace
  if (user.role === 'STUDENT') {
    return <StudentDashboard />;
  }

  // SUPERVISOR: Cluster Oversight & School Inspections
  if (user.role === 'SUPERVISOR') {
    return <SupervisorDashboard />;
  }

  // HM / ADMIN / SUPERVISOR — General scoped dashboard (placeholder until dedicated dashboards are built)
  return (
    <PageContainer
      title={`${user.role.replace(/_/g, ' ')} DASHBOARD`}
      subtitle={`Education Department Liaquatabad Town Centre (DMC) • Scope: ${user.scope}`}
      actions={
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-[#4B7F3A]">
            System Online
          </span>
        </div>
      }
    >
      {/* Top Metric Cards — Real-time Scoped Aggregation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#526477] tracking-wider">Registered Schools</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#006AC7]">
              <School className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#102033] mt-3">{stats.totalSchools}</p>
          <p className="text-xs text-[#526477] font-medium mt-1">Liaquatabad Town Centre</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#526477] tracking-wider">Active Faculty</span>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#102033] mt-3">{stats.totalTeachers}</p>
          <p className="text-xs text-teal-700 font-medium mt-1">Verified & Assigned</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#526477] tracking-wider">Total Enrollment</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#102033] mt-3">{stats.enrolledStudents}</p>
          <p className="text-xs text-indigo-700 font-medium mt-1">Municipal Students</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#526477] tracking-wider">Today's Attendance</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#102033] mt-3">{stats.digitalAttendanceRate || '98%'}</p>
          <p className="text-xs text-amber-700 font-medium mt-1">Town Average</p>
        </div>
      </div>

      {/* Role Context & Actions Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <h2 className="text-lg font-bold text-[#102033] mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#4B7F3A]" />
            Active Governance Session
          </h2>
          <div className="space-y-3 text-sm text-[#526477]">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[#526477] font-medium">Logged in Authority:</span>
                <span className="font-bold text-[#102033]">{user.fullName}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <span className="text-[#526477] font-medium">Civil Service Title (Designation):</span>
                <span className="font-bold text-amber-700">{user.designation || 'None'}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <span className="text-[#526477] font-medium">Base Registration Role:</span>
                <span className="font-mono text-[#006AC7] font-bold">{user.baseRole || 'TEACHER'}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <span className="text-[#526477] font-medium">Granted System Authority:</span>
                <span className="font-mono text-[#4B7F3A] font-bold">{user.role}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <span className="text-[#526477] font-medium">Data Boundary Scope:</span>
                <span className="font-mono text-purple-700 font-bold">{user.scope}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-[#4B7F3A] text-xs font-medium flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 text-[#4B7F3A]" />
              <span>
                All interactions within this dashboard are strictly mediated by the BFF Gateway and logged to the immutable audit trail.
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <h2 className="text-lg font-bold text-[#102033] mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#006AC7]" />
            Quick Access
          </h2>
          <div className="space-y-2.5">
            <button className="w-full text-left p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 transition-colors text-sm font-bold text-[#102033] flex items-center justify-between">
              <span>View Municipal Circulars</span>
              <span className="text-xs text-[#8094A8] font-medium">Official</span>
            </button>
            <button className="w-full text-left p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 transition-colors text-sm font-bold text-[#102033] flex items-center justify-between">
              <span>Attendance Verification</span>
              <span className="text-xs text-[#8094A8] font-medium">Daily</span>
            </button>
            <button className="w-full text-left p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 transition-colors text-sm font-bold text-[#102033] flex items-center justify-between">
              <span>Transfer Directives</span>
              <span className="text-xs text-[#8094A8] font-medium">Records</span>
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default DashboardRouter;
