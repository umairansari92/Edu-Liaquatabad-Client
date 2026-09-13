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

  const handleSubmit = async (submitEvent) => {
    submitEvent.preventDefault();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 text-[#102033] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-[#006AC7] border border-blue-200">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#102033]">School Operational Timings &amp; Attendance Windows</h3>
              <p className="text-xs text-[#526477]">
                Configure official gates &amp; teacher attendance windows for <span className="text-[#006AC7] font-semibold">{school.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#102033] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-[#006AC7]">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            All times are enforced strictly in <strong>Pakistan Standard Time (Asia/Karachi PKT, UTC+5)</strong>.
            Teachers are blocked from submitting attendance before the window opens or after it closes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Regular Schedule (Monday - Thursday, Saturday) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#006AC7]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#102033]">
                  Regular Working Days (Monday – Thursday, Saturday)
                </h4>
              </div>
              <span className="text-[11px] text-[#526477]">Standard School Hours</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#526477]">School Gate Opening (Start Time)</label>
                <input
                  type="time"
                  required
                  value={formData.regular.startTime}
                  onChange={(inputChangeEvent) =>
                    setFormData({
                      ...formData,
                      regular: { ...formData.regular, startTime: inputChangeEvent.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-[#102033] focus:border-[#006AC7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#526477]">School Gate Closing (End Time)</label>
                <input
                  type="time"
                  required
                  value={formData.regular.endTime}
                  onChange={(inputChangeEvent) =>
                    setFormData({
                      ...formData,
                      regular: { ...formData.regular, endTime: inputChangeEvent.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-[#102033] focus:border-[#006AC7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4B7F3A]">Attendance Window Opens</label>
                <input
                  type="time"
                  required
                  value={formData.regular.attendanceWindowStart}
                  onChange={(inputChangeEvent) =>
                    setFormData({
                      ...formData,
                      regular: { ...formData.regular, attendanceWindowStart: inputChangeEvent.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-mono text-[#102033] focus:border-[#4B7F3A] focus:outline-none"
                />
                <span className="text-[10px] text-[#8094A8] mt-1 block">Earliest time teachers can mark attendance</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-rose-600">Attendance Window Closes</label>
                <input
                  type="time"
                  required
                  value={formData.regular.attendanceWindowEnd}
                  onChange={(inputChangeEvent) =>
                    setFormData({
                      ...formData,
                      regular: { ...formData.regular, attendanceWindowEnd: inputChangeEvent.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-mono text-[#102033] focus:border-rose-500 focus:outline-none"
                />
                <span className="text-[10px] text-[#8094A8] mt-1 block">Late cutoff; submissions blocked afterwards</span>
              </div>
            </div>
          </div>

          {/* Section 2: Friday (Jummah) Schedule */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#006AC7]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#102033]">
                  Friday Special Schedule (Jummah Timing)
                </h4>
              </div>
              <span className="text-[11px] text-[#006AC7] font-semibold">Automatic Activation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#526477]">Friday School Opening</label>
                <input
                  type="time"
                  required
                  value={formData.friday.startTime}
                  onChange={(inputChangeEvent) =>
                    setFormData({
                      ...formData,
                      friday: { ...formData.friday, startTime: inputChangeEvent.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-[#102033] focus:border-[#006AC7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#526477]">Friday School Dismissal</label>
                <input
                  type="time"
                  required
                  value={formData.friday.endTime}
                  onChange={(inputChangeEvent) =>
                    setFormData({
                      ...formData,
                      friday: { ...formData.friday, endTime: inputChangeEvent.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-[#102033] focus:border-[#006AC7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#006AC7]">Friday Window Opens</label>
                <input
                  type="time"
                  required
                  value={formData.friday.attendanceWindowStart}
                  onChange={(inputChangeEvent) =>
                    setFormData({
                      ...formData,
                      friday: { ...formData.friday, attendanceWindowStart: inputChangeEvent.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-mono text-[#102033] focus:border-[#006AC7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-rose-600">Friday Window Closes (Pre-Jummah)</label>
                <input
                  type="time"
                  required
                  value={formData.friday.attendanceWindowEnd}
                  onChange={(inputChangeEvent) =>
                    setFormData({
                      ...formData,
                      friday: { ...formData.friday, attendanceWindowEnd: inputChangeEvent.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-mono text-[#102033] focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Headmaster Late Clearance Privilege */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-[#102033] flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#4B7F3A]" />
                Allow HM Same-Day Emergency Late Clearance
              </label>
              <p className="text-[11px] text-[#526477] max-w-md">
                Enables the Headmaster to clear late attendance on the same calendar day (until 23:59 PKT) in case of power or internet disruptions.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowHmLateOverride}
                onChange={(checkboxChangeEvent) =>
                  setFormData({ ...formData, allowHmLateOverride: checkboxChangeEvent.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4B7F3A]"></div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-[#526477] hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-[#4B7F3A] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#3d682f] transition disabled:opacity-50"
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
