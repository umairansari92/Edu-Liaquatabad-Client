import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, UserPlus, Users, ClipboardList, Hash, AlertCircle,
  CheckCircle, Loader2, ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '../../services/apiClient.js';
import { enrollStudentFormSchema } from '../../validations/studentSchemas.js';
import './HmAddStudentModal.css';

/**
 * HmAddStudentModal
 * Opened by HM from the dashboard "Add Student" button.
 *
 * Two admission types:
 *  - NEW_ADMISSION  → GR auto-generated (shown as preview, readonly)
 *  - EXISTING_ENTRY → HM inputs original GR from paper records; live uniqueness check
 *
 * Global Student ID (e.g. MMHA-0001) is ALWAYS system-generated — never shown in form.
 */
const HmAddStudentModal = ({ isOpen, onClose, schoolId, classes = [], onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Type select, 2: Fill form, 3: Success
  const [nextGrPreview, setNextGrPreview] = useState(null);
  const [grCheckState, setGrCheckState] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [submitting, setSubmitting] = useState(false);
  const [enrolledStudent, setEnrolledStudent] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(enrollStudentFormSchema),
    defaultValues: { admissionType: 'NEW_ADMISSION' },
  });

  const admissionType = watch('admissionType');
  const manualGrNumber = watch('manualGrNumber');
  const selectedClassId = watch('classId');

  // Fetch next GR preview when modal opens
  useEffect(() => {
    if (isOpen && schoolId) {
      apiClient.get(`/students/next-gr/${schoolId}`)
        .then((r) => setNextGrPreview(r.data?.data?.suggestedGrNumber))
        .catch(() => setNextGrPreview(null));
    }
  }, [isOpen, schoolId]);

  // Live GR uniqueness check for EXISTING_ENTRY
  useEffect(() => {
    if (admissionType !== 'EXISTING_ENTRY' || !manualGrNumber || !schoolId) {
      setGrCheckState(null);
      return;
    }
    const debounce = setTimeout(async () => {
      setGrCheckState('checking');
      try {
        const res = await apiClient.get('/students/check-gr', {
          params: { schoolId, grNumber: manualGrNumber },
        });
        setGrCheckState(res.data?.data?.available ? 'available' : 'taken');
      } catch {
        setGrCheckState(null);
      }
    }, 600);
    return () => clearTimeout(debounce);
  }, [manualGrNumber, admissionType, schoolId]);

  const onSubmit = async (data) => {
    if (admissionType === 'EXISTING_ENTRY' && grCheckState === 'taken') {
      toast.error('This GR number is already assigned. Please use a different one.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post('/students/enroll', data);
      setEnrolledStudent(res.data?.data);
      setStep(3);
      toast.success('Student enrolled successfully!');
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setStep(1);
    setNextGrPreview(null);
    setGrCheckState(null);
    setEnrolledStudent(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="hm-modal-overlay"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="hm-modal-card"
        >
          {/* ── Header ── */}
          <div className="hm-modal-header">
            <div className="hm-modal-title-group">
              <div className="hm-modal-icon">
                <UserPlus size={20} />
              </div>
              <div>
                <h2 className="hm-modal-title">Enroll Student</h2>
                <p className="hm-modal-subtitle">
                  {step === 1 && 'Select admission type to begin'}
                  {step === 2 && (admissionType === 'NEW_ADMISSION' ? 'New Admission' : 'Existing Student Entry')}
                  {step === 3 && 'Enrollment Complete'}
                </p>
              </div>
            </div>
            <button onClick={handleClose} className="hm-modal-close">
              <X size={18} />
            </button>
          </div>

          {/* ── Step 1: Admission Type Selection ── */}
          {step === 1 && (
            <div className="hm-step-select">
              <p className="hm-step-label">What type of enrollment is this?</p>
              <div className="hm-type-cards">
                <button
                  className="hm-type-card"
                  onClick={() => { setValue('admissionType', 'NEW_ADMISSION'); setStep(2); }}
                >
                  <div className="hm-type-card-icon new">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <h3>New Admission</h3>
                    <p>Fresh student joining. GR number will be auto-generated by the system.</p>
                  </div>
                  <ChevronRight size={18} className="hm-type-arrow" />
                </button>

                <button
                  className="hm-type-card"
                  onClick={() => { setValue('admissionType', 'EXISTING_ENTRY'); setStep(2); }}
                >
                  <div className="hm-type-card-icon existing">
                    <ClipboardList size={24} />
                  </div>
                  <div>
                    <h3>Existing Student Entry</h3>
                    <p>Enter a student already in school records. You will provide their original GR number.</p>
                  </div>
                  <ChevronRight size={18} className="hm-type-arrow" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Enrollment Form ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit(onSubmit)} className="hm-enroll-form">
              <input type="hidden" {...register('admissionType')} />

              {/* GR Number Info Banner */}
              <div className={`hm-gr-banner ${admissionType === 'NEW_ADMISSION' ? 'auto' : 'manual'}`}>
                <Hash size={16} />
                {admissionType === 'NEW_ADMISSION' ? (
                  <span>
                    GR Number will be <strong>auto-assigned</strong> by system
                    {nextGrPreview && <> — suggested: <strong>GR-{nextGrPreview}</strong></>}
                  </span>
                ) : (
                  <span>Enter the original GR number from school paper records</span>
                )}
              </div>

              {/* Manual GR Input (EXISTING_ENTRY only) */}
              {admissionType === 'EXISTING_ENTRY' && (
                <div className="hm-field-group">
                  <label className="hm-label">
                    GR Number <span className="req">*</span>
                  </label>
                  <div className="hm-gr-input-wrap">
                    <input
                      type="number"
                      {...register('manualGrNumber', { valueAsNumber: true })}
                      className={`hm-input ${grCheckState === 'taken' ? 'error' : grCheckState === 'available' ? 'success' : ''}`}
                      placeholder="e.g. 126"
                      min={1}
                    />
                    <div className="hm-gr-status">
                      {grCheckState === 'checking' && <Loader2 size={16} className="spin" />}
                      {grCheckState === 'available' && <CheckCircle size={16} className="text-green" />}
                      {grCheckState === 'taken' && <AlertCircle size={16} className="text-red" />}
                    </div>
                  </div>
                  {grCheckState === 'taken' && (
                    <p className="hm-field-error">This GR number is already taken in this school.</p>
                  )}
                  {grCheckState === 'available' && (
                    <p className="hm-field-hint-green">GR number is available.</p>
                  )}
                  {errors.manualGrNumber && (
                    <p className="hm-field-error">{errors.manualGrNumber.message}</p>
                  )}
                </div>
              )}

              {/* Full Name */}
              <div className="hm-field-group">
                <label className="hm-label">Full Name <span className="req">*</span></label>
                <input {...register('fullName')} className="hm-input" placeholder="Muhammad Ali Khan" />
                {errors.fullName && <p className="hm-field-error">{errors.fullName.message}</p>}
              </div>

              {/* Gender + Date of Birth */}
              <div className="hm-row-2">
                <div className="hm-field-group">
                  <label className="hm-label">Gender</label>
                  <select {...register('gender')} className="hm-input">
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="hm-field-group">
                  <label className="hm-label">Date of Birth</label>
                  <input type="date" {...register('dateOfBirth')} className="hm-input" />
                </div>
              </div>

              {/* Guardian */}
              <div className="hm-field-group">
                <label className="hm-label">Father/Guardian Name <span className="req">*</span></label>
                <input {...register('guardianName')} className="hm-input" placeholder="Muhammad Hussain" />
                {errors.guardianName && <p className="hm-field-error">{errors.guardianName.message}</p>}
              </div>

              <div className="hm-field-group">
                <label className="hm-label">Guardian Contact <span className="req">*</span></label>
                <input {...register('guardianContact')} className="hm-input" placeholder="03001234567" />
                {errors.guardianContact && <p className="hm-field-error">{errors.guardianContact.message}</p>}
              </div>

              {/* Class + Section */}
              <div className="hm-row-2">
                <div className="hm-field-group">
                  <label className="hm-label">Class <span className="req">*</span></label>
                  <select {...register('classId')} className="hm-input">
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>{cls.name}</option>
                    ))}
                  </select>
                  {errors.classId && <p className="hm-field-error">{errors.classId.message}</p>}
                </div>
                <div className="hm-field-group">
                  <label className="hm-label">Section <span className="req">*</span></label>
                  <select {...register('sectionId')} className="hm-input">
                    <option value="">Select Section</option>
                    {classes
                      .find((c) => c._id === selectedClassId)
                      ?.sections?.map((sec) => (
                        <option key={sec._id} value={sec._id}>{sec.name}</option>
                      ))}
                  </select>
                  {errors.sectionId && <p className="hm-field-error">{errors.sectionId.message}</p>}
                </div>
              </div>

              {/* Admission Date */}
              <div className="hm-field-group">
                <label className="hm-label">Admission Date</label>
                <input type="date" {...register('admissionDate')} className="hm-input"
                  defaultValue={new Date().toISOString().split('T')[0]} />
              </div>

              {/* Residential Address */}
              <div className="hm-field-group">
                <label className="hm-label">Residential Address</label>
                <textarea {...register('residentialAddress')} className="hm-input hm-textarea"
                  placeholder="House #, Street, Area, City" rows={2} />
              </div>

              {/* Actions */}
              <div className="hm-form-actions">
                <button type="button" onClick={() => setStep(1)} className="hm-btn-secondary">
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || (admissionType === 'EXISTING_ENTRY' && grCheckState === 'taken')}
                  className="hm-btn-primary"
                >
                  {submitting ? (
                    <><Loader2 size={16} className="spin" /> Enrolling...</>
                  ) : (
                    <><UserPlus size={16} /> Enroll Student</>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && enrolledStudent && (
            <div className="hm-success">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="hm-success-icon"
              >
                <CheckCircle size={48} />
              </motion.div>
              <h3>Student Enrolled!</h3>

              <div className="hm-success-numbers">
                <div className="hm-number-card">
                  <span className="hm-number-label">GR Number</span>
                  <span className="hm-number-value">GR-{enrolledStudent.grNumber}</span>
                </div>
                <div className="hm-number-card">
                  <span className="hm-number-label">Global Student ID</span>
                  <span className="hm-number-value">
                    {enrolledStudent.globalStudentId || 'Pending (school code not set)'}
                  </span>
                </div>
              </div>

              <p className="hm-success-name">{enrolledStudent.fullName}</p>
              <p className="hm-success-note">
                These numbers are permanently assigned. The student's profile is now active.
              </p>

              <button onClick={handleClose} className="hm-btn-primary" style={{ marginTop: '1.5rem' }}>
                Done
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HmAddStudentModal;
