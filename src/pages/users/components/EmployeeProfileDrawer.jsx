import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Shield,
  School,
  Briefcase,
  Calendar,
  CreditCard,
  History,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';

export const EmployeeProfileDrawer = ({
  isOpen,
  onClose,
  employee,
  onAssignSchool,
  onTransfer,
  onManageAuthority,
  onViewAudit,
}) => {
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  if (!isOpen || !employee) return null;

  const currentSchool = employee.schoolId?.name || 'Unassigned';
  const teacherProfile = employee.teacherProfile || {};

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/80 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#006AC7] to-[#004B8C] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/10">
                {employee.fullName?.charAt(0) || 'E'}
              </div>
              <div>
                <h2 className="text-base font-bold text-[#102033]">{employee.fullName}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    {employee.designation || 'Teacher'}
                  </span>
                  <span className="text-[10px] font-mono text-[#526477]">
                    ID: {teacherProfile.employeeId || employee._id?.slice(-6).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#102033] hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Bar */}
          <div className="p-3 bg-blue-50/60 border-b border-blue-100 flex items-center gap-1.5 justify-around">
            <button
              type="button"
              onClick={() => {
                onClose();
                onAssignSchool?.(employee);
              }}
              className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-white border border-blue-200 py-1.5 px-2 text-[11px] font-bold text-[#006AC7] hover:bg-blue-50 transition shadow-xs"
            >
              <School className="w-3.5 h-3.5" />
              <span>{employee.schoolId ? 'Change School' : 'Assign School'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onTransfer?.(employee);
              }}
              className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-white border border-blue-200 py-1.5 px-2 text-[11px] font-bold text-[#006AC7] hover:bg-blue-50 transition shadow-xs"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onManageAuthority?.(employee);
              }}
              className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-white border border-blue-200 py-1.5 px-2 text-[11px] font-bold text-[#006AC7] hover:bg-blue-50 transition shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Authority</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-[#526477]">
            {/* Identity Details */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#102033] border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#006AC7]" />
                <span>Personnel Identity</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Official Email</div>
                  <div className="font-semibold text-[#102033] text-[11px] break-all mt-0.5">
                    {employee.email}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Phone Number</div>
                  <div className="font-semibold text-[#102033] text-[11px] mt-0.5">
                    {employee.phoneNumber || 'Not Registered'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">CNIC Number</div>
                  <div className="font-semibold text-[#102033] text-[11px] mt-0.5">
                    {teacherProfile.cnic || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Employee / Personal ID</div>
                  <div className="font-mono font-bold text-[#006AC7] text-[11px] mt-0.5">
                    {teacherProfile.employeeId || 'EMP-' + employee._id?.slice(-6).toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            {/* Employment & School Placement */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#102033] border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-[#006AC7]" />
                <span>Institutional Placement</span>
              </h3>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">Current School</span>
                  <span className="font-bold text-[#102033] text-right">
                    {currentSchool}
                  </span>
                </div>
                {employee.schoolId?.schoolCode && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">School Code</span>
                    <span className="font-mono text-[#006AC7] font-bold">
                      {employee.schoolId.schoolCode}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">Civil Designation</span>
                  <span className="font-bold text-amber-700">
                    {employee.designation || 'Teacher'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">Employment Status</span>
                  <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-[#4B7F3A] border border-emerald-200">
                    {employee.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Access & System Authority */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#102033] border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#006AC7]" />
                <span>Security & Authority Governance</span>
              </h3>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">System Authority (Role)</span>
                  <span className="font-mono font-bold text-[#006AC7] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full text-[10px]">
                    {employee.role}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">Base Role (Onboarding)</span>
                  <span className="font-mono text-[#526477]">
                    {employee.baseRole || 'TEACHER'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">Jurisdictional Scope</span>
                  <span className="font-mono text-[#526477]">
                    {employee.scope || 'CLASS_SECTION'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">Security Token Version</span>
                  <span className="font-mono text-slate-500 font-semibold">
                    v{employee.tokenVersion ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Audit History Link */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewAudit?.(employee);
                }}
                className="w-full flex items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-[#526477] hover:text-[#102033] transition shadow-xs"
              >
                <History className="w-4 h-4 text-slate-400" />
                <span>View Complete Immutable Audit History</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfileDrawer;
