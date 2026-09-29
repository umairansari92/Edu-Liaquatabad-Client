import React from 'react';
import {
  Users,
  GraduationCap,
  Users2,
  Shield,
  Briefcase,
  Building,
  School,
  CheckCircle2,
} from 'lucide-react';

export const CategoryKpiCards = ({ activeCategory, summaryCounts = {} }) => {
  const {
    totalAccounts = 0,
    totalEmployees = 0,
    totalTeachers = 0,
    totalHMs = 0,
    totalAdminStaff = 0,
    totalStudents = 0,
    totalParents = 0,
  } = summaryCounts;

  if (activeCategory === 'EMPLOYEES') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/80 to-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#006AC7]">
              Total Personnel
            </span>
            <div className="p-2 rounded-xl bg-blue-100/80 text-[#006AC7]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#102033]">{totalEmployees}</div>
          <div className="text-[10px] text-[#526477] mt-0.5 font-medium">
            Active Department Workforce
          </div>
        </div>

        {/* Teachers */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#526477]">
              Teaching Faculty
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-[#4B7F3A]">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#102033]">{totalTeachers}</div>
          <div className="text-[10px] text-[#526477] mt-0.5 font-medium">
            PST, EST, JST, Subject Teachers
          </div>
        </div>

        {/* Leadership (HM) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#526477]">
              Institutional Heads
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <School className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#102033]">{totalHMs}</div>
          <div className="text-[10px] text-[#526477] mt-0.5 font-medium">
            Head Masters & Principals
          </div>
        </div>

        {/* Admin Staff */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#526477]">
              Governance & Support
            </span>
            <div className="p-2 rounded-xl bg-slate-100 text-[#102033]">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#102033]">{totalAdminStaff}</div>
          <div className="text-[10px] text-[#526477] mt-0.5 font-medium">
            Admins, Supervisors & Peons
          </div>
        </div>
      </div>
    );
  }

  if (activeCategory === 'STUDENTS') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50/80 to-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
              Total Enrolled Students
            </span>
            <div className="p-2 rounded-xl bg-purple-100/80 text-purple-700">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#102033]">{totalStudents}</div>
          <div className="text-[10px] text-[#526477] mt-0.5 font-medium">
            Registered Across Municipal Schools
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#526477]">
              Academic Status
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-[#4B7F3A]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#102033]">100%</div>
          <div className="text-[10px] text-[#526477] mt-0.5 font-medium">
            Active Class Placements
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#526477]">
              Campus Coverage
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#006AC7]">
              <School className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#102033]">Liaquatabad DMC</div>
          <div className="text-[10px] text-[#526477] mt-0.5 font-medium">
            Town Primary & Secondary Institutions
          </div>
        </div>
      </div>
    );
  }

  if (activeCategory === 'PARENTS') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4B7F3A]">
              Registered Guardians
            </span>
            <div className="p-2 rounded-xl bg-emerald-100/80 text-[#4B7F3A]">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#102033]">{totalParents}</div>
          <div className="text-[10px] text-[#526477] mt-0.5 font-medium">
            Active Parent Accounts
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#526477]">
              HM Verification
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#006AC7]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#102033]">Verified</div>
          <div className="text-[10px] text-[#526477] mt-0.5 font-medium">
            Dual Register Linkage Standard
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#526477]">
              Child Oversight
            </span>
            <div className="p-2 rounded-xl bg-slate-100 text-[#102033]">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#102033]">Active</div>
          <div className="text-[10px] text-[#526477] mt-0.5 font-medium">
            Attendance & Result Access Granted
          </div>
        </div>
      </div>
    );
  }

  // ALL ACCOUNTS
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#526477]">
            Total Global Accounts
          </span>
          <div className="p-2 rounded-xl bg-slate-200/70 text-[#102033]">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-black text-[#102033]">{totalAccounts}</div>
        <div className="text-[10px] text-[#526477] mt-0.5 font-medium">All System Roles</div>
      </div>

      <div className="rounded-2xl border border-blue-200/80 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#006AC7]">
            Employees & Faculty
          </span>
          <div className="p-2 rounded-xl bg-blue-50 text-[#006AC7]">
            <Briefcase className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-black text-[#102033]">{totalEmployees}</div>
        <div className="text-[10px] text-[#526477] mt-0.5 font-medium">Teachers & Staff</div>
      </div>

      <div className="rounded-2xl border border-purple-200/80 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
            Students
          </span>
          <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
            <GraduationCap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-black text-[#102033]">{totalStudents}</div>
        <div className="text-[10px] text-[#526477] mt-0.5 font-medium">Enrolled Wards</div>
      </div>

      <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#4B7F3A]">
            Parents
          </span>
          <div className="p-2 rounded-xl bg-emerald-50 text-[#4B7F3A]">
            <Users2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-black text-[#102033]">{totalParents}</div>
        <div className="text-[10px] text-[#526477] mt-0.5 font-medium">Legal Guardians</div>
      </div>
    </div>
  );
};

export default CategoryKpiCards;
