import React, { useState, useEffect } from 'react';
import { Clock, Save, X, AlertTriangle, ShieldCheck, Calendar, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient.js';

export const SchoolTimingsModal = ({ isOpen, onClose, school, onTimingsUpdated }) => {
  const [formData, setFormData] = useState({
    regular: {
      startTime: '08:00',
      endTime: '13:30',
      attendanceWindowStart: '07:45',
      attendanceWindowEnd: '14:00',
    },
    friday: {
      startTime: '07:30',
      endTime: '12:00',
      attendanceWindowStart: '07:15',
      attendanceWindowEnd: '12:30',
    },
    allowHmLateOverride: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (school?.timings) {
      setFormData({
        regular: {
          startTime: school.timings.regular?.startTime || '08:00',
          endTime: school.timings.regular?.endTime || '13:30',
          attendanceWindowStart: school.timings.regular?.attendanceWindowStart || '07:45',
          attendanceWindowEnd: school.timings.regular?.attendanceWindowEnd || '14:00',
        },
        friday: {
          startTime: school.timings.friday?.startTime || '07:30',
          endTime: school.timings.friday?.endTime || '12:00',
          attendanceWindowStart: school.timings.friday?.attendanceWindowStart || '07:15',
          attendanceWindowEnd: school.timings.friday?.attendanceWindowEnd || '12:30',
        },
        allowHmLateOverride: school.timings.allowHmLateOverride ?? true,
      });
    }
  }, [school]);

  if (!isOpen || !school) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await apiClient.patch(`/schools/${school._id}/timings`, formData);
      if (response.data?.success) {
        toast.success(`Timings updated for ${school.name}`);
        if (onTimingsUpdated) onTimingsUpdated(response.data.data?.school);
        onClose();
      }
    } catch (error) {
      console.error('Failed to update school timings:', error);
      toast.error(error.response?.data?.message || 'Failed to update school timings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-2xl border border-emerald-500/40 bg-slate-900 p-6 shadow-2xl space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/20">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">School Operational Timings &amp; Attendance Windows</h3>
              <p className="text-xs text-slate-400">
                Configure official gates &amp; teacher attendance windows for <span className="text-emerald-300 font-semibold">{school.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-2.5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs text-cyan-300">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            All times are enforced strictly in <strong>Pakistan Standard Time (Asia/Karachi PKT, UTC+5)</strong>.
            Teachers are blocked from submitting attendance before the window opens or after it closes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Regular Schedule (Monday - Thursday, Saturday) */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Regular Working Days (Monday – Thursday, Saturday)
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">Standard School Hours</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">School Gate Opening (Start Time)</label>
                <input
                  type="time"
                  required
                  value={formData.regular.startTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      regular: { ...formData.regular, startTime: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">School Gate Closing (End Time)</label>
                <input
                  type="time"
                  required
                  value={formData.regular.endTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      regular: { ...formData.regular, endTime: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-emerald-400">Attendance Window Opens</label>
                <input
                  type="time"
                  required
                  value={formData.regular.attendanceWindowStart}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      regular: { ...formData.regular, attendanceWindowStart: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-emerald-500/50 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-emerald-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Earliest time teachers can mark attendance</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-rose-400">Attendance Window Closes</label>
                <input
                  type="time"
                  required
                  value={formData.regular.attendanceWindowEnd}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      regular: { ...formData.regular, attendanceWindowEnd: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-rose-500/50 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-rose-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Late cutoff; submissions blocked afterwards</span>
              </div>
            </div>
          </div>

          {/* Section 2: Friday (Jummah) Schedule */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Friday Special Schedule (Jummah Timing)
                </h4>
              </div>
              <span className="text-[11px] text-cyan-400 font-semibold">Automatic Activation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">Friday School Opening</label>
                <input
                  type="time"
                  required
                  value={formData.friday.startTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      friday: { ...formData.friday, startTime: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Friday School Dismissal</label>
                <input
                  type="time"
                  required
                  value={formData.friday.endTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      friday: { ...formData.friday, endTime: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cyan-400">Friday Window Opens</label>
                <input
                  type="time"
                  required
                  value={formData.friday.attendanceWindowStart}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      friday: { ...formData.friday, attendanceWindowStart: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-cyan-500/50 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-rose-400">Friday Window Closes (Pre-Jummah)</label>
                <input
                  type="time"
                  required
                  value={formData.friday.attendanceWindowEnd}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      friday: { ...formData.friday, attendanceWindowEnd: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-rose-500/50 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-rose-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Headmaster Late Clearance Privilege */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/40 p-4">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Allow HM Same-Day Emergency Late Clearance
              </label>
              <p className="text-[11px] text-slate-400 max-w-md">
                Enables the Headmaster to clear late attendance on the same calendar day (until 23:59 PKT) in case of power or internet disruptions.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowHmLateOverride}
                onChange={(e) =>
                  setFormData({ ...formData, allowHmLateOverride: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-lg hover:bg-emerald-500 transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving Timings...' : 'Save & Enforce Timings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchoolTimingsModal;
