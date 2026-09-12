import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import RootAdminDashboard from './RootAdminDashboard.jsx';
import TeacherDashboard from './TeacherDashboard.jsx';
import HmDashboard from './HmDashboard.jsx';
import StudentDashboard from './StudentDashboard.jsx';
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

  useEffect(() => {
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
  }, []);

  if (!user) return null;

  // Supreme Governance & High Operational Admin Dashboard
  if (user.role === 'ROOT_ADMIN' || user.role === 'SUPER_ADMIN') {
    return <RootAdminDashboard />;
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

  // HM / ADMIN / SUPERVISOR — General scoped dashboard (placeholder until dedicated dashboards are built)
  return (
    <PageContainer
      title={`${user.role.replace(/_/g, ' ')} DASHBOARD`}
      subtitle={`Education Department Liaquatabad Town Centre (DMC) • Scope: ${user.scope}`}
      actions={
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 border border-emerald-700 text-emerald-400">
            System Online
          </span>
        </div>
      }
    >
      {/* Top Metric Cards — Real-time Scoped Aggregation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Registered Schools</span>
            <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400">
              <School className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-white mt-3">{stats.totalSchools}</p>
          <p className="text-xs text-emerald-400 mt-1">Liaquatabad Town Centre</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Active Faculty</span>
            <div className="p-2 rounded-lg bg-teal-950 text-teal-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-white mt-3">{stats.totalTeachers}</p>
          <p className="text-xs text-teal-400 mt-1">Verified & Assigned</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Total Enrollment</span>
            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-white mt-3">{stats.enrolledStudents}</p>
          <p className="text-xs text-cyan-400 mt-1">Municipal Students</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Today's Attendance</span>
            <div className="p-2 rounded-lg bg-amber-950 text-amber-400">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-white mt-3">{stats.digitalAttendanceRate || '98%'}</p>
          <p className="text-xs text-amber-400 mt-1">Town Average</p>
        </div>
      </div>

      {/* Role Context & Actions Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Active Governance Session
          </h2>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Logged in Authority:</span>
                <span className="font-semibold text-white">{user.fullName}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-400 font-medium">Civil Service Title (Designation):</span>
                <span className="font-semibold text-amber-400">{user.designation || 'None'}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-400 font-medium">Base Registration Role:</span>
                <span className="font-mono text-cyan-400 font-semibold">{user.baseRole || 'TEACHER'}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-400 font-medium">Granted System Authority:</span>
                <span className="font-mono text-emerald-400 font-semibold">{user.role}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-400 font-medium">Data Boundary Scope:</span>
                <span className="font-mono text-purple-400">{user.scope}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/30 text-emerald-300 text-xs flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span>
                All interactions within this dashboard are strictly mediated by the BFF Gateway and logged to the immutable audit trail.
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            Quick Access
          </h2>
          <div className="space-y-2.5">
            <button className="w-full text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 transition-colors text-sm font-medium text-slate-200 flex items-center justify-between">
              <span>View Municipal Circulars</span>
              <span className="text-xs text-slate-500">Official</span>
            </button>
            <button className="w-full text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 transition-colors text-sm font-medium text-slate-200 flex items-center justify-between">
              <span>Attendance Verification</span>
              <span className="text-xs text-slate-500">Daily</span>
            </button>
            <button className="w-full text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 transition-colors text-sm font-medium text-slate-200 flex items-center justify-between">
              <span>Transfer Directives</span>
              <span className="text-xs text-slate-500">Records</span>
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default DashboardRouter;
