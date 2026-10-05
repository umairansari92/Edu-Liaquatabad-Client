import React from 'react';
import {
  History,
  CheckCircle2,
  ArrowLeftRight,
  ClipboardCheck,
  FileText,
  UserCheck,
  Calendar,
} from 'lucide-react';

export const HmActivityLogTab = ({ notices = [], transfers = [], teacherAttendance }) => {
  // Aggregate real events from state
  const activities = [];

  if (teacherAttendance?.records?.length > 0) {
    activities.push({
      id: 'att-today',
      type: 'attendance',
      title: 'Faculty attendance recorded',
      description: `${teacherAttendance.records.length} faculty member attendance statuses submitted for ${teacherAttendance.date || 'today'}.`,
      icon: ClipboardCheck,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    });
  }

  (notices || []).slice(0, 3).forEach((noticeItem) => {
    activities.push({
      id: `notice-${noticeItem._id}`,
      type: 'notice',
      title: `Notice published: "${noticeItem.title}"`,
      description: `Official school circular issued to ${Array.isArray(noticeItem.targetAudience) ? noticeItem.targetAudience.join(', ') : 'school community'}.`,
      icon: FileText,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    });
  });

  (transfers || []).slice(0, 3).forEach((transferItem) => {
    activities.push({
      id: `transfer-${transferItem._id}`,
      type: 'transfer',
      title: `Transfer record: ${transferItem.studentName || 'Student'}`,
      description: `Status: ${transferItem.status || 'Under review'}. Transfer reference for municipal tracking.`,
      icon: ArrowLeftRight,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    });
  });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-50 text-[#006AC7] border border-blue-200/60">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">School activity log</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Recent operational events and administrative submissions within this school
            </p>
          </div>
        </div>
      </div>

      {/* ── Activities List ── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        {activities.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700">No recent activity</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Administrative actions such as attendance submissions, notices, and transfer approvals will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {activities.map((activityItem) => {
              const Icon = activityItem.icon;
              return (
                <div key={activityItem.id} className="relative flex items-start gap-4">
                  <div
                    className={`-ml-6 w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${activityItem.color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-slate-900">{activityItem.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{activityItem.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HmActivityLogTab;
