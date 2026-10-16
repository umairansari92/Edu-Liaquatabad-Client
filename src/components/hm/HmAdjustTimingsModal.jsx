import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Clock, Calendar, ShieldAlert, Save, X, Info, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateSchoolTimings } from '../../store/slices/hmSlice.js';

export const HmAdjustTimingsModal = ({ isOpen, onClose, school }) => {
  const dispatch = useDispatch();

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

  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

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
    setReason('');
    setValidationError('');
  }, [school, isOpen]);

  if (!isOpen || !school) return null;

  const handleSubmit = async (submitEvent) => {
    submitEvent.preventDefault();
    setValidationError('');

    const trimmedReason = reason.trim();
    if (!trimmedReason || trimmedReason.length < 5) {
      setValidationError('A meaningful justification reason of at least 5 characters is mandatory.');
      return;
    }

    // Client-side window validation
    if (formData.regular.attendanceWindowEnd <= formData.regular.attendanceWindowStart) {
      setValidationError('Regular days attendance window close time must be later than opening time.');
      return;
    }
    if (formData.regular.endTime <= formData.regular.startTime) {
      setValidationError('Regular days school closing time must be later than opening time.');
      return;
    }
    if (formData.friday.attendanceWindowEnd <= formData.friday.attendanceWindowStart) {
      setValidationError('Friday attendance window close time must be later than opening time.');
      return;
    }
    if (formData.friday.endTime <= formData.friday.startTime) {
      setValidationError('Friday school dismissal time must be later than opening time.');
      return;
    }

    setIsSubmitting(true);
    try {
      const schoolId = school._id || school.id;
      const resultAction = await dispatch(
        updateSchoolTimings({
          schoolId,
          timings: formData,
          reason: trimmedReason,
        })
      );

      if (updateSchoolTimings.fulfilled.match(resultAction)) {
        toast.success('School attendance windows updated and logged successfully.');
        onClose();
      } else {
        const errorMessage = resultAction.payload || 'Failed to update attendance timings.';
        setValidationError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (unexpectedError) {
      const message = unexpectedError.message || 'Server error while updating attendance timings.';
      setValidationError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 text-[#102033] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-[#006AC7] border border-blue-200">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Adjust School Attendance Windows</h3>
              <p className="text-xs text-slate-500">
                Official Head Master timing configuration for{' '}
                <span className="font-semibold text-[#006AC7]">{school.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Legal/Audit Notice */}
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-semibold">Institutional Governance Notice (Article V):</p>
            <p className="mt-0.5 text-amber-800">
              Attendance timings are enforced in <strong>Pakistan Standard Time (Asia/Karachi PKT, UTC+5)</strong>.
              Every Head Master adjustment requires a verified official reason and is recorded permanently in the municipal audit trail.
            </p>
          </div>
        </div>

        {validationError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Section 1: Regular Working Days */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#006AC7]" />
                <h4 className="font-bold uppercase tracking-wider text-slate-900">
                  Regular Working Days (Mon – Thu, Sat)
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Standard Hours</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700">School Gate Opening</label>
                <input
                  type="time"
                  required
                  value={formData.regular.startTime}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      regular: { ...formData.regular, startTime: event.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900 focus:border-[#006AC7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700">School Gate Dismissal</label>
                <input
                  type="time"
                  required
                  value={formData.regular.endTime}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      regular: { ...formData.regular, endTime: event.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900 focus:border-[#006AC7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-[#4B7F3A]">Attendance Window Opens</label>
                <input
                  type="time"
                  required
                  value={formData.regular.attendanceWindowStart}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      regular: { ...formData.regular, attendanceWindowStart: event.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 font-mono text-slate-900 focus:border-[#4B7F3A] focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Earliest submission time</span>
              </div>

              <div>
                <label className="block font-medium text-rose-600">Attendance Window Closes</label>
                <input
                  type="time"
                  required
                  value={formData.regular.attendanceWindowEnd}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      regular: { ...formData.regular, attendanceWindowEnd: event.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-rose-300 bg-white px-3 py-2 font-mono text-slate-900 focus:border-rose-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Late cutoff boundary</span>
              </div>
            </div>
          </div>

          {/* Section 2: Friday Special Schedule */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#006AC7]" />
                <h4 className="font-bold uppercase tracking-wider text-slate-900">
                  Friday Special Schedule (Jummah Timing)
                </h4>
              </div>
              <span className="text-[11px] text-[#006AC7] font-semibold">Automatic Activation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700">Friday School Opening</label>
                <input
                  type="time"
                  required
                  value={formData.friday.startTime}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      friday: { ...formData.friday, startTime: event.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900 focus:border-[#006AC7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700">Friday School Dismissal</label>
                <input
                  type="time"
                  required
                  value={formData.friday.endTime}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      friday: { ...formData.friday, endTime: event.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900 focus:border-[#006AC7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-[#006AC7]">Friday Window Opens</label>
                <input
                  type="time"
                  required
                  value={formData.friday.attendanceWindowStart}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      friday: { ...formData.friday, attendanceWindowStart: event.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 font-mono text-slate-900 focus:border-[#006AC7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-rose-600">Friday Window Closes</label>
                <input
                  type="time"
                  required
                  value={formData.friday.attendanceWindowEnd}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      friday: { ...formData.friday, attendanceWindowEnd: event.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-rose-300 bg-white px-3 py-2 font-mono text-slate-900 focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Mandatory Justification Reason */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800">
              Mandatory Justification Reason *
              <span className="font-normal text-slate-500 ml-1.5">(Required for Head Master adjustments, min. 5 characters)</span>
            </label>
            <textarea
              required
              rows={3}
              minLength={5}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (validationError) setValidationError('');
              }}
              placeholder="e.g. Adjusted school opening and attendance gate forward due to extreme winter fog per town directive."
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-[#006AC7] focus:outline-none"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>This statement will be permanently recorded in the municipal audit log.</span>
              <span className={reason.trim().length >= 5 ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                {reason.trim().length}/5 chars min
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || reason.trim().length < 5}
              className="inline-flex items-center gap-2 rounded-lg bg-[#4B7F3A] hover:bg-[#3d682f] px-5 py-2 font-semibold text-white shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving & Auditing...' : 'Save & Enforce Timings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HmAdjustTimingsModal;
