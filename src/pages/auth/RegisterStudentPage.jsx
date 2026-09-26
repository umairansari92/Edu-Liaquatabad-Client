import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSelector } from 'react-redux';
import {
  School,
  User,
  Phone,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Calendar,
  CreditCard,
  BookOpen,
  FileText,
  MapPin,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  IdCard,
  Printer,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient.js';
import OtpVerificationModal from '../../components/common/OtpVerificationModal.jsx';
import HmAddStudentModal from '../../components/hm/HmAddStudentModal.jsx';
import CnicSegmentedInput from '../../components/common/CnicSegmentedInput.jsx';
import OfficialAdmissionDocument from '../../components/common/OfficialAdmissionDocument.jsx';
import {
  studentAdmissionWizardSchema,
  studentPortalActivationSchema,
} from '../../validations/authSchemas.js';
import { convertDateToWords } from '../../utils/dateToWords.js';

export const GRADE_TIERS = {
  ECE: [
    'Nursery',
    'KG-1',
    'KG-2',
  ],
  PRIMARY: [
    'Nursery',
    'KG-1',
    'KG-2',
    'Class 1',
    'Class 2',
    'Class 3',
    'Class 4',
    'Class 5',
  ],
  ELEMENTARY: [
    'KG-1',
    'KG-2',
    'Class 1',
    'Class 2',
    'Class 3',
    'Class 4',
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
  ],
  SECONDARY: [
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9 (Science)',
    'Class 9 (General)',
    'Class 10 (Science)',
    'Class 10 (General)',
  ],
  ALL: [
    'Nursery',
    'KG-1',
    'KG-2',
    'Class 1',
    'Class 2',
    'Class 3',
    'Class 4',
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9 (Science)',
    'Class 9 (General)',
    'Class 10 (Science)',
    'Class 10 (General)',
  ],
};

export const SCHOOL_TYPE_LABELS = {
  ECE: 'ECE (Nursery - KG-2)',
  PRIMARY: 'Primary (KG-1 - 5th)',
  ELEMENTARY: 'Elementary (KG-1 - 8th)',
  SECONDARY: 'Secondary (6th - 10th)',
};

export const RegisterStudentPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // Active Tab: 'new-admission' (Flow A) vs 'activate-account' (Flow B)
  const initialTab = searchParams.get('tab') === 'activate-account' ? 'activate-account' : 'new-admission';
  const [activeTab, setActiveTab] = useState(initialTab);

  // HM direct modal state (if logged in HM is visiting)
  const [showHmModal, setShowHmModal] = useState(false);

  // Flow A Wizard Step: 1 = Student, 2 = Parents/Guardian, 3 = Academic, 4 = Credentials, 5 = Review
  const [wizardStep, setWizardStep] = useState(1);

  // Shared state
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingSubmissionPayload, setPendingSubmissionPayload] = useState(null);
  const [otpTargetEmail, setOtpTargetEmail] = useState('');

  // Success summary state
  const [submissionSuccess, setSubmissionSuccess] = useState(null);

  // Official Admission Form Print / Document Preview Modal
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // ─── Form Handlers ────────────────────────────────────────────────────────
  // Form A: New Admission Wizard
  const formA = useForm({
    resolver: zodResolver(studentAdmissionWizardSchema),
    defaultValues: {
      studentFullName: '',
      bFormNumber: '',
      gender: 'MALE',
      dateOfBirth: '',
      dateOfBirthInWords: '',
      religion: 'ISLAM',
      placeOfBirth: 'Karachi',
      studentPhotoUrl: '',
      fatherFullName: '',
      motherFullName: '',
      relationshipWithStudent: 'FATHER',
      guardianCnicNumber: '',
      fatherQualification: '',
      motherQualification: '',
      fatherOccupation: '',
      permanentResidentialAddress: '',
      parentOfficeAddress: '',
      guardianCellNumber: '',
      residencePhoneNumber: '',
      businessPhoneNumber: '',
      schoolId: '',
      mediumRequested: 'URDU',
      admissionClassRequested: 'Class 1',
      lastSchoolAttended: '',
      admissionDate: new Date().toISOString().slice(0, 10),
      admissionRemarks: '',
      guardianEmail: '',
      password: '',
      confirmPassword: '',
      otpCode: '',
      _gotcha: '',
    },
    mode: 'onChange',
  });

  // Form B: Portal Account Activation
  const formB = useForm({
    resolver: zodResolver(studentPortalActivationSchema),
    defaultValues: {
      schoolId: '',
      grNumber: '',
      globalStudentId: '',
      dateOfBirth: '',
      email: '',
      password: '',
      confirmPassword: '',
      otpCode: '',
      _gotcha: '',
    },
    mode: 'onChange',
  });

  // Watchers for dynamic behavior
  const watchedDob = formA.watch('dateOfBirth');
  const watchedDobWords = formA.watch('dateOfBirthInWords');
  const watchedSchoolId = formA.watch('schoolId');
  const watchedFormAValues = formA.watch();

  const selectedSchool = schools.find((s) => String(s._id) === String(watchedSchoolId));
  const availableGrades = (selectedSchool?.schoolType && GRADE_TIERS[selectedSchool.schoolType])
    ? GRADE_TIERS[selectedSchool.schoolType]
    : GRADE_TIERS.ALL;

  // Auto-align admissionClassRequested when school changes
  useEffect(() => {
    if (selectedSchool) {
      const currentClass = formA.getValues('admissionClassRequested');
      if (!availableGrades.includes(currentClass)) {
        formA.setValue('admissionClassRequested', availableGrades[0] || 'Class 1', { shouldValidate: true });
      }
    }
  }, [watchedSchoolId, selectedSchool, availableGrades, formA]);

  // Auto-derive DOB in words when DOB figures change
  useEffect(() => {
    if (watchedDob) {
      const derived = convertDateToWords(watchedDob);
      formA.setValue('dateOfBirthInWords', derived, { shouldValidate: true });
    }
  }, [watchedDob, formA]);

  // Sync tab with URL query parameter
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
    setErrorMessage('');
    setSubmissionSuccess(null);
  };

  // Fetch schools list
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await apiClient.get('/public/schools');
        const list = response.data?.data?.schools || response.data?.data || [];
        if (Array.isArray(list)) {
          setSchools(list);
        }
      } catch {
        // Quiet fallback
      }
    };
    fetchSchools();
  }, []);

  // ─── Flow A Step Navigation Validation ────────────────────────────────────
  const validateCurrentStep = async () => {
    setErrorMessage('');
    if (wizardStep === 1) {
      const valid = await formA.trigger(['studentFullName', 'bFormNumber', 'gender', 'dateOfBirth']);
      return valid;
    }
    if (wizardStep === 2) {
      const valid = await formA.trigger([
        'fatherFullName',
        'motherFullName',
        'relationshipWithStudent',
        'guardianCnicNumber',
        'permanentResidentialAddress',
        'guardianCellNumber',
      ]);
      return valid;
    }
    if (wizardStep === 3) {
      const valid = await formA.trigger(['schoolId', 'mediumRequested', 'admissionClassRequested']);
      return valid;
    }
    if (wizardStep === 4) {
      const valid = await formA.trigger(['guardianEmail', 'password', 'confirmPassword']);
      return valid;
    }
    return true;
  };

  const handleNextStep = async () => {
    const isStepValid = await validateCurrentStep();
    if (isStepValid) {
      setWizardStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handlePrevStep = () => {
    setWizardStep((prev) => Math.max(prev - 1, 1));
  };

  // ─── Flow A: Submission & OTP Dispatch ────────────────────────────────────
  const onInitiateNewAdmission = async (formData) => {
    setLoading(true);
    setErrorMessage('');
    try {
      // Step 1: Dispatch OTP to guardian email
      await apiClient.post('/auth/send-otp', {
        email: formData.guardianEmail,
        purpose: 'REGISTRATION',
      });
      setOtpTargetEmail(formData.guardianEmail);
      setPendingSubmissionPayload({ type: 'FLOW_A', data: formData });
      setShowOtpModal(true);
    } catch (dispatchError) {
      setErrorMessage(
        dispatchError.response?.data?.message || 'Failed to dispatch verification code to email.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Flow B: Submission & OTP Dispatch ────────────────────────────────────
  const onInitiatePortalActivation = async (formData) => {
    setLoading(true);
    setErrorMessage('');
    try {
      await apiClient.post('/auth/send-otp', {
        email: formData.email,
        purpose: 'REGISTRATION',
      });
      setOtpTargetEmail(formData.email);
      setPendingSubmissionPayload({ type: 'FLOW_B', data: formData });
      setShowOtpModal(true);
    } catch (dispatchError) {
      setErrorMessage(
        dispatchError.response?.data?.message || 'Failed to dispatch verification code to email.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Finalize on OTP Verified ─────────────────────────────────────────────
  const handleOtpVerified = async (otpCode) => {
    setShowOtpModal(false);
    setLoading(true);
    setErrorMessage('');

    try {
      if (pendingSubmissionPayload?.type === 'FLOW_A') {
        const payload = {
          ...pendingSubmissionPayload.data,
          otpCode,
          email: pendingSubmissionPayload.data.guardianEmail,
        };
        const response = await apiClient.post('/auth/register-student', payload);
        if (response.data?.success) {
          setSubmissionSuccess({
            type: 'FLOW_A',
            grNumber: response.data.data?.grNumber,
            admissionRegisterNumber: response.data.data?.admissionRegisterNumber,
            globalStudentId: response.data.data?.globalStudentId,
            email: response.data.data?.email,
          });
          toast.success('Admission application submitted successfully!');
        }
      } else if (pendingSubmissionPayload?.type === 'FLOW_B') {
        const payload = {
          ...pendingSubmissionPayload.data,
          otpCode,
        };
        const response = await apiClient.post('/auth/activate-student-portal', payload);
        if (response.data?.success) {
          setSubmissionSuccess({
            type: 'FLOW_B',
            grNumber: response.data.data?.grNumber,
            admissionRegisterNumber: response.data.data?.admissionRegisterNumber,
            globalStudentId: response.data.data?.globalStudentId,
            email: response.data.data?.email,
          });
          toast.success('Student portal account activated successfully!');
        }
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FBFD] py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#006AC7] selection:text-white">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-3xl text-center mb-6">
        <Link to="/" className="inline-flex items-center justify-center space-x-3 mb-3 group">
          <div className="w-12 h-12 rounded-2xl bg-[#006AC7] flex items-center justify-center shadow-lg shadow-[#006AC7]/20 group-hover:bg-[#00529B] transition-colors">
            <School className="w-6 h-6 text-white" />
          </div>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#102033] tracking-tight">
          Student Admission & Portal Registration
        </h1>
        <p className="mt-1 text-xs text-[#526477]">
          Government of Sindh • Education Department Liaquatabad Town Centre (DMC)
        </p>

        {/* Head Master Direct Console Shortcut Banner (If HM is logged in) */}
        {user && (user.role === 'HM' || user.baseRole === 'HM') && (
          <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[#006AC7] flex items-center justify-between gap-2 text-left">
            <div className="flex items-center gap-2">
              <IdCard className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Head Master Detected:</strong> You can directly enroll new admissions or migrate paper register records into your school.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowHmModal(true)}
              className="px-3 py-1 bg-[#006AC7] text-white rounded-lg font-semibold hover:bg-[#00529B] transition-colors flex-shrink-0"
            >
              Open HM Modal
            </button>
          </div>
        )}

        {/* Top Segmented Mode Switcher & Official Paper Form Preview */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex p-1 rounded-xl bg-slate-200/80 border border-slate-300/80 shadow-inner">
            <button
              type="button"
              onClick={() => handleTabChange('new-admission')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'new-admission'
                  ? 'bg-white text-[#006AC7] shadow-sm'
                  : 'text-[#526477] hover:text-[#102033]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Admission (نیا داخلہ)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('activate-account')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'activate-account'
                  ? 'bg-white text-[#006AC7] shadow-sm'
                  : 'text-[#526477] hover:text-[#102033]'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Activate Existing Account (اکاؤنٹ ایکٹیویشن)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowPrintPreview(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300/80 text-xs font-bold text-[#006AC7] shadow-2xs hover:bg-[#F0F8FF] hover:border-[#006AC7]/40 transition-all"
            title="View or print official institutional paper admission form matching physical paper register"
          >
            <FileText className="w-4 h-4 text-[#006AC7]" />
            <span>Official Paper Form (پرنٹ فارم)</span>
          </button>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200/80">
          {/* Error notification */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* SUCCESS SCREEN */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {submissionSuccess ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-[#4B7F3A]/10 border border-[#4B7F3A]/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#4B7F3A]">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-display font-bold text-[#102033] mb-2">
                {submissionSuccess.type === 'FLOW_A'
                  ? 'Admission Application Submitted!'
                  : 'Student Portal Account Activated!'}
              </h2>
              <p className="text-xs text-[#526477] max-w-md mx-auto mb-6 leading-relaxed">
                {submissionSuccess.type === 'FLOW_A'
                  ? 'Your digital admission application has been registered. The Head Master (HM) will verify your physical records to activate portal access.'
                  : 'Your physical admission has been verified and your portal login credentials are now active! You may proceed directly to sign in.'}
              </p>

              {/* Identifier Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto mb-6 text-left">
                <div className="p-3.5 rounded-xl bg-[#F0F8FF] border border-blue-200">
                  <span className="text-[10px] uppercase font-bold text-[#006AC7] tracking-wider block">
                    Admission Register No. (G.R.)
                  </span>
                  <span className="font-mono text-base font-bold text-[#102033]">
                    {submissionSuccess.admissionRegisterNumber || `GR-${submissionSuccess.grNumber}`}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-[#526477] tracking-wider block">
                    Global Student ID
                  </span>
                  <span className="font-mono text-base font-bold text-[#102033]">
                    {submissionSuccess.globalStudentId || 'Allocated on Verification'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPrintPreview(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-xs font-bold text-white bg-[#4B7F3A] hover:bg-[#38662D] shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Official Admission Form (A4 پرنٹ کریں)</span>
                </button>
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl text-xs font-semibold text-white bg-[#006AC7] hover:bg-[#00529B] shadow-sm transition-all"
                >
                  Proceed to Sign In
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSubmissionSuccess(null);
                    setWizardStep(1);
                    formA.reset();
                    formB.reset();
                  }}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-semibold text-[#526477] hover:text-[#102033] hover:bg-slate-100 transition-colors"
                >
                  Submit Another Record
                </button>
              </div>
            </div>
          ) : activeTab === 'new-admission' ? (
            /* ═══════════════════════════════════════════════════════════════════ */
            /* FLOW A: NEW ADMISSION MULTI-STEP WIZARD */
            /* ═══════════════════════════════════════════════════════════════════ */
            <div>
              {/* Wizard Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 w-full z-0" />
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#006AC7] transition-all duration-300 z-0"
                    style={{ width: `${((wizardStep - 1) / 4) * 100}%` }}
                  />

                  {[
                    { step: 1, label: 'Student', icon: User },
                    { step: 2, label: 'Parents', icon: Building2 },
                    { step: 3, label: 'Academic', icon: School },
                    { step: 4, label: 'Security', icon: Lock },
                    { step: 5, label: 'Review', icon: FileText },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isCompleted = wizardStep > item.step;
                    const isCurrent = wizardStep === item.step;
                    return (
                      <div key={item.step} className="relative z-10 flex flex-col items-center">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                            isCompleted
                              ? 'bg-[#4B7F3A] text-white shadow-md shadow-[#4B7F3A]/20'
                              : isCurrent
                              ? 'bg-[#006AC7] text-white ring-4 ring-blue-100 shadow-md shadow-[#006AC7]/25'
                              : 'bg-white text-slate-400 border border-slate-300'
                          }`}
                        >
                          {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <span
                          className={`mt-1.5 text-[11px] font-semibold ${
                            isCurrent ? 'text-[#006AC7]' : isCompleted ? 'text-[#4B7F3A]' : 'text-slate-400'
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={formA.handleSubmit(onInitiateNewAdmission)} className="space-y-6">
                {/* Honeypot field */}
                <input type="text" {...formA.register('_gotcha')} tabIndex="-1" className="hidden" />

                {/* ── STEP 1: Student Identity ── */}
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-2 mb-4">
                      <h2 className="text-base font-bold text-[#102033]">1. Student Personal Identity</h2>
                      <p className="text-xs text-[#526477]">Official student identity matching B-Form records</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Student Full Name */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Student Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          {...formA.register('studentFullName')}
                          type="text"
                          placeholder="e.g. Muhammad Bilal"
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                        />
                        {formA.formState.errors.studentFullName && (
                          <p className="mt-1 text-xs text-rose-600">{formA.formState.errors.studentFullName.message}</p>
                        )}
                      </div>

                      {/* Student B-Form Number (ب فارم نمبر) */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Student B-Form # <span className="font-urdu text-[11px] font-normal">(ب فارم نمبر / CRC)</span>
                          <span className="ml-2 text-[10px] text-slate-400 font-normal">
                            (Optional: NADRA Child Registration Certificate • 15 Segmented Digit Boxes)
                          </span>
                        </label>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 inline-block w-full sm:w-auto">
                          <CnicSegmentedInput
                            value={formA.watch('bFormNumber')}
                            onChange={(val) => formA.setValue('bFormNumber', val, { shouldValidate: true })}
                            hasError={!!formA.formState.errors.bFormNumber}
                          />
                        </div>
                        {formA.formState.errors.bFormNumber && (
                          <p className="mt-1 text-xs text-rose-600">{formA.formState.errors.bFormNumber.message}</p>
                        )}
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Gender <span className="text-rose-500">*</span>
                        </label>
                        <select
                          {...formA.register('gender')}
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                        >
                          <option value="MALE">Male (طالب علم)</option>
                          <option value="FEMALE">Female (طالبہ)</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>

                      {/* Religion */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Religion
                        </label>
                        <input
                          {...formA.register('religion')}
                          type="text"
                          placeholder="e.g. Islam"
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                        />
                      </div>

                      {/* Date of Birth (Figures) */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Date of Birth (Figures) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          {...formA.register('dateOfBirth')}
                          type="date"
                          max={new Date().toISOString().slice(0, 10)}
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                        />
                        {formA.formState.errors.dateOfBirth && (
                          <p className="mt-1 text-xs text-rose-600">{formA.formState.errors.dateOfBirth.message}</p>
                        )}
                      </div>

                      {/* Place of Birth */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Place of Birth
                        </label>
                        <input
                          {...formA.register('placeOfBirth')}
                          type="text"
                          placeholder="e.g. Karachi"
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                        />
                      </div>

                      {/* Date of Birth in Words (Auto-Derived Read-Only) */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Date of Birth (In Words) — Auto-Derived
                        </label>
                        <div className="px-3.5 py-2.5 bg-[#F0F8FF] border border-blue-200 rounded-lg text-xs font-medium text-[#006AC7] flex items-center gap-2">
                          <BookOpen className="w-4 h-4 flex-shrink-0" />
                          <span>{watchedDobWords || 'Select Date of Birth above to generate words automatically'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Parents & Guardian Information ── */}
                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-2 mb-4">
                      <h2 className="text-base font-bold text-[#102033]">2. Parents & Guardian Information</h2>
                      <p className="text-xs text-[#526477]">Contact & identity details for official communication</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Father's Name */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Father's Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          {...formA.register('fatherFullName')}
                          type="text"
                          placeholder="e.g. Tariq Mehmood"
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                        />
                        {formA.formState.errors.fatherFullName && (
                          <p className="mt-1 text-xs text-rose-600">{formA.formState.errors.fatherFullName.message}</p>
                        )}
                      </div>

                      {/* Mother's Name */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Mother's Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          {...formA.register('motherFullName')}
                          type="text"
                          placeholder="e.g. Nasreen Tariq"
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                        />
                        {formA.formState.errors.motherFullName && (
                          <p className="mt-1 text-xs text-rose-600">{formA.formState.errors.motherFullName.message}</p>
                        )}
                      </div>

                      {/* Relationship with Student */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Primary Guardian Relationship <span className="text-rose-500">*</span>
                        </label>
                        <select
                          {...formA.register('relationshipWithStudent')}
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                        >
                          <option value="FATHER">Father (والد)</option>
                          <option value="MOTHER">Mother (والدہ)</option>
                          <option value="GUARDIAN">Legal Guardian (سرپرست)</option>
                        </select>
                      </div>

                      {/* Guardian CNIC (Protected & Masked in Audit • Segmented Box Format) */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Guardian's CNIC (شناختی کارڈ نمبر) <span className="text-rose-500">*</span>
                          <span className="ml-2 text-[10px] text-slate-400 font-normal">
                            (Official 15-digit segmented box format: 5 - 7 - 1)
                          </span>
                        </label>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 inline-block w-full sm:w-auto">
                          <CnicSegmentedInput
                            value={formA.watch('guardianCnicNumber')}
                            onChange={(val) => formA.setValue('guardianCnicNumber', val, { shouldValidate: true })}
                            hasError={!!formA.formState.errors.guardianCnicNumber}
                          />
                        </div>
                        {formA.formState.errors.guardianCnicNumber && (
                          <p className="mt-1 text-xs text-rose-600">{formA.formState.errors.guardianCnicNumber.message}</p>
                        )}
                      </div>

                      {/* Father's Qualification & Mother's Qualification (Field 8 on physical form) */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Father's Qualification <span className="font-urdu text-[11px] font-normal">(والد کی تعلیم)</span>
                        </label>
                        <input
                          {...formA.register('fatherQualification')}
                          type="text"
                          placeholder="e.g. Matric / Graduate"
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Mother's Qualification <span className="font-urdu text-[11px] font-normal">(والدہ کی تعلیم)</span>
                        </label>
                        <input
                          {...formA.register('motherQualification')}
                          type="text"
                          placeholder="e.g. Intermediate / Graduate"
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                        />
                      </div>

                      {/* Father's Occupation (Field 9 on physical form) */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Father's Occupation <span className="font-urdu text-[11px] font-normal">(والد کا پیشہ / ملازمت)</span>
                        </label>
                        <input
                          {...formA.register('fatherOccupation')}
                          type="text"
                          placeholder="e.g. Government Service / Business / Private"
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                        />
                      </div>

                      {/* Guardian Mobile / Cell (Field 15 on physical form) */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Cell / Mobile Number <span className="font-urdu text-[11px] font-normal">(موبائل نمبر)</span> <span className="text-rose-500">*</span>
                        </label>
                        <input
                          {...formA.register('guardianCellNumber')}
                          type="tel"
                          placeholder="03001234567"
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] font-mono focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                        />
                        {formA.formState.errors.guardianCellNumber && (
                          <p className="mt-1 text-xs text-rose-600">{formA.formState.errors.guardianCellNumber.message}</p>
                        )}
                      </div>

                      {/* Residence Phone (Field 14 on physical form) */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Phone No. Residence <span className="font-urdu text-[11px] font-normal">(رہائشی فون نمبر - اختیاری)</span>
                        </label>
                        <input
                          {...formA.register('residencePhoneNumber')}
                          type="tel"
                          placeholder="02134567890"
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] font-mono focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                        />
                      </div>

                      {/* Business Phone (Field 14 on physical form) */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Phone No. Business <span className="font-urdu text-[11px] font-normal">(کاروباری فون نمبر - اختیاری)</span>
                        </label>
                        <input
                          {...formA.register('businessPhoneNumber')}
                          type="tel"
                          placeholder="02134567890"
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] font-mono focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                        />
                      </div>

                      {/* Permanent Residential Address (Field 12 on physical form) */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Permanent Residential Address <span className="font-urdu text-[11px] font-normal">(مستقل رہائشی پتہ)</span> <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          {...formA.register('permanentResidentialAddress')}
                          rows={2}
                          placeholder="House / Flat No., Street, Block, Liaquatabad Town, Karachi"
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                        />
                        {formA.formState.errors.permanentResidentialAddress && (
                          <p className="mt-1 text-xs text-rose-600">{formA.formState.errors.permanentResidentialAddress.message}</p>
                        )}
                      </div>

                      {/* Office Address (Field 13 on physical form) */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Office / Work Address <span className="font-urdu text-[11px] font-normal">(دفتر یا ملازمت کا پتہ - اختیاری)</span>
                        </label>
                        <textarea
                          {...formA.register('parentOfficeAddress')}
                          rows={2}
                          placeholder="Office / Business address in Karachi (Optional)"
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: Academic & School Details ── */}
                {wizardStep === 3 && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-2 mb-4">
                      <h2 className="text-base font-bold text-[#102033]">3. School & Academic Details</h2>
                      <p className="text-xs text-[#526477]">Select target government institution and grade</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Target School */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Select School <span className="text-rose-500">*</span>
                        </label>
                        <select
                          {...formA.register('schoolId')}
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none font-medium"
                        >
                          <option value="">-- Choose Government School in Town --</option>
                          {schools.map((school) => (
                            <option key={school._id} value={school._id}>
                              {school.name} ({school.schoolCode || school.code || 'LTC'}) — {SCHOOL_TYPE_LABELS[school.schoolType] || school.schoolType || 'General'}
                            </option>
                          ))}
                        </select>
                        {formA.formState.errors.schoolId && (
                          <p className="mt-1 text-xs text-rose-600">{formA.formState.errors.schoolId.message}</p>
                        )}

                        {/* Selected School Info Badge */}
                        {selectedSchool && (
                          <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#102033]">{selectedSchool.name}</span>
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#006AC7] font-bold text-[10px] border border-blue-200">
                                {SCHOOL_TYPE_LABELS[selectedSchool.schoolType] || selectedSchool.schoolType}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <span>Instruction Mediums:</span>
                              <span className="font-semibold text-slate-700">
                                {(selectedSchool.supportedMediums || ['URDU', 'ENGLISH']).join(', ')}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Medium of Instruction (تعلیم کا ذریعہ) */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Medium of Instruction (تعلیم کا ذریعہ) <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {[
                            { id: 'URDU', name: 'Urdu Medium', urdu: 'اردو میڈیم', desc: 'Syllabus & instruction in Urdu' },
                            { id: 'ENGLISH', name: 'English Medium', urdu: 'انگلش میڈیم', desc: 'English medium curriculum' },
                            { id: 'SINDHI', name: 'Sindhi Medium', urdu: 'سنڌي ميڊيم', desc: 'Sindhi language instruction' },
                          ].map((med) => {
                            const isSelected = formA.watch('mediumRequested') === med.id;
                            const isSupported = !selectedSchool?.supportedMediums || selectedSchool.supportedMediums.includes(med.id);
                            return (
                              <button
                                key={med.id}
                                type="button"
                                onClick={() => formA.setValue('mediumRequested', med.id, { shouldValidate: true })}
                                className={`p-3 rounded-xl border text-left transition-all relative ${
                                  isSelected
                                    ? 'border-[#006AC7] bg-blue-50/70 text-[#006AC7] ring-2 ring-[#006AC7]/20 shadow-sm'
                                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-bold">{med.name}</span>
                                  <span className="text-xs font-urdu font-medium text-slate-500">{med.urdu}</span>
                                </div>
                                <p className="text-[10px] text-slate-400">{med.desc}</p>
                                {selectedSchool && (
                                  <span className={`inline-block mt-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                                    isSupported ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {isSupported ? 'Offered at School' : 'General Request'}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {formA.formState.errors.mediumRequested && (
                          <p className="mt-1 text-xs text-rose-600">{formA.formState.errors.mediumRequested.message}</p>
                        )}
                      </div>

                      {/* Class Required (Dynamically filtered by School Type) */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Admission Class Required <span className="text-rose-500">*</span>
                        </label>
                        <select
                          {...formA.register('admissionClassRequested')}
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none font-medium"
                        >
                          {availableGrades.map((cls) => (
                            <option key={cls} value={cls}>
                              {cls}
                            </option>
                          ))}
                        </select>
                        {selectedSchool && (
                          <p className="mt-1 text-[10px] text-slate-400">
                            Available grades aligned with {SCHOOL_TYPE_LABELS[selectedSchool.schoolType] || selectedSchool.schoolType} structure.
                          </p>
                        )}
                      </div>

                      {/* Date of Admission */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Date of Admission
                        </label>
                        <input
                          {...formA.register('admissionDate')}
                          type="date"
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                        />
                      </div>

                      {/* Last School Attended */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Last School Attended (If Applicable)
                        </label>
                        <input
                          {...formA.register('lastSchoolAttended')}
                          type="text"
                          placeholder="e.g. Government Primary School No. 2 Liaquatabad"
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                        />
                      </div>

                      {/* Remarks */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Special Remarks / Medical Considerations
                        </label>
                        <textarea
                          {...formA.register('admissionRemarks')}
                          rows={2}
                          placeholder="Any special educational needs, medical allergies, or sibling references"
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 4: Portal Account Setup & Security ── */}
                {wizardStep === 4 && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-2 mb-4">
                      <h2 className="text-base font-bold text-[#102033]">4. Portal Login Credentials</h2>
                      <p className="text-xs text-[#526477]">Set up credentials for the student / parent portal</p>
                    </div>

                    <div className="space-y-4">
                      {/* Guardian Email */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Guardian / Account Email <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            {...formA.register('guardianEmail')}
                            type="email"
                            placeholder="guardian@example.com"
                            className="block w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                          />
                        </div>
                        {formA.formState.errors.guardianEmail && (
                          <p className="mt-1 text-xs text-rose-600">{formA.formState.errors.guardianEmail.message}</p>
                        )}
                        <p className="mt-1 text-[11px] text-slate-400">
                          A 6-digit cryptographic verification code will be dispatched to this email address.
                        </p>
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Portal Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            {...formA.register('password')}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••••••"
                            className="block w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {formA.formState.errors.password && (
                          <p className="mt-1 text-xs text-rose-600">{formA.formState.errors.password.message}</p>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                          Confirm Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            {...formA.register('confirmPassword')}
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Re-enter password"
                            className="block w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {formA.formState.errors.confirmPassword && (
                          <p className="mt-1 text-xs text-rose-600">{formA.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 5: Review & Submit ── */}
                {wizardStep === 5 && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-2 mb-4">
                      <h2 className="text-base font-bold text-[#102033]">5. Review Admission Record</h2>
                      <p className="text-xs text-[#526477]">
                        Verify all information prior to cryptographic OTP email dispatch
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
                      <div className="flex justify-between border-b border-slate-200/60 pb-2">
                        <span className="text-slate-500">Student Name:</span>
                        <span className="font-bold text-[#102033]">{watchedFormAValues.studentFullName}</span>
                      </div>
                      {watchedFormAValues.bFormNumber && (
                        <div className="flex justify-between border-b border-slate-200/60 pb-2">
                          <span className="text-slate-500">Student B-Form #:</span>
                          <span className="font-mono font-semibold text-[#102033]">{watchedFormAValues.bFormNumber}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-b border-slate-200/60 pb-2">
                        <span className="text-slate-500">Gender & DOB:</span>
                        <span className="font-medium text-[#102033]">
                          {watchedFormAValues.gender} • {watchedFormAValues.dateOfBirth} ({watchedDobWords})
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-2">
                        <span className="text-slate-500">Father's Name & CNIC:</span>
                        <span className="font-medium text-[#102033]">
                          {watchedFormAValues.fatherFullName} ({watchedFormAValues.guardianCnicNumber})
                          {watchedFormAValues.fatherQualification && ` • ${watchedFormAValues.fatherQualification}`}
                        </span>
                      </div>
                      {watchedFormAValues.motherFullName && (
                        <div className="flex justify-between border-b border-slate-200/60 pb-2">
                          <span className="text-slate-500">Mother's Name:</span>
                          <span className="font-medium text-[#102033]">
                            {watchedFormAValues.motherFullName}
                            {watchedFormAValues.motherQualification && ` • ${watchedFormAValues.motherQualification}`}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between border-b border-slate-200/60 pb-2">
                        <span className="text-slate-500">Residential Address:</span>
                        <span className="font-medium text-[#102033] max-w-xs text-right truncate">
                          {watchedFormAValues.permanentResidentialAddress}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-2">
                        <span className="text-slate-500">Guardian Contact:</span>
                        <span className="font-medium text-[#102033]">
                          {watchedFormAValues.guardianCellNumber}
                          {watchedFormAValues.residencePhoneNumber && ` • Res: ${watchedFormAValues.residencePhoneNumber}`}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-2">
                        <span className="text-slate-500">Medium of Instruction:</span>
                        <span className="font-bold text-[#4B7F3A]">
                          {watchedFormAValues.mediumRequested === 'ENGLISH'
                            ? 'English Medium (انگلش میڈیم)'
                            : watchedFormAValues.mediumRequested === 'SINDHI'
                            ? 'Sindhi Medium (سنڌي ميڊيم)'
                            : 'Urdu Medium (اردو میڈیم)'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-2">
                        <span className="text-slate-500">Admission Grade:</span>
                        <span className="font-bold text-[#006AC7]">{watchedFormAValues.admissionClassRequested}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Target School:</span>
                        <span className="font-medium text-[#102033]">
                          {selectedSchool?.name || schools.find((s) => s._id === watchedFormAValues.schoolId)?.name || 'Selected School'}
                          {selectedSchool?.schoolType && ` (${SCHOOL_TYPE_LABELS[selectedSchool.schoolType] || selectedSchool.schoolType})`}
                        </span>
                      </div>
                    </div>

                    {/* Automatic Generation Notice */}
                    <div className="p-3.5 rounded-xl bg-[#F0F8FF] border border-blue-200 text-[#006AC7] text-xs flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>System Invariant:</strong> The Admission Register Number (GR Number) and Global Student ID will be generated atomically by the server upon OTP verification.
                      </span>
                    </div>

                    {/* Authentic Paper Admission Form Preview */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                      <div className="flex items-center gap-2.5 text-xs">
                        <FileText className="w-4 h-4 text-[#006AC7] flex-shrink-0" />
                        <div>
                          <span className="font-bold text-[#102033] block">
                            TMC Liaquatabad Official Admission Form (Paper Layout)
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            Preview your application mapped directly onto the physical government register form.
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPrintPreview(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#006AC7] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all flex-shrink-0"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Preview & Print Form (پرنٹ فارم)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Wizard Controls */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  {wizardStep > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#526477] hover:text-[#102033] hover:bg-slate-100 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Previous Step
                    </button>
                  ) : <div />}

                  {wizardStep < 5 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#006AC7] hover:bg-[#00529B] shadow-sm transition-all"
                    >
                      Next Step
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#4B7F3A] hover:bg-[#38662D] shadow-sm transition-all disabled:opacity-50"
                    >
                      {loading ? 'Dispatching OTP...' : 'Verify Email & Submit Admission'}
                      {!loading && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            /* ═══════════════════════════════════════════════════════════════════ */
            /* FLOW B: PORTAL ACCOUNT ACTIVATION */
            /* ═══════════════════════════════════════════════════════════════════ */
            <div>
              <div className="border-b border-slate-100 pb-3 mb-6">
                <div className="flex items-center gap-2 text-[#006AC7] mb-1">
                  <KeyRound className="w-4 h-4" />
                  <h2 className="text-base font-bold text-[#102033]">
                    Activate Existing Student Portal Account
                  </h2>
                </div>
                <p className="text-xs text-[#526477] leading-relaxed">
                  For students already physically enrolled in school or migrated from paper registers. Enter your school details and date of birth to establish online portal login credentials.
                </p>
              </div>

              <form onSubmit={formB.handleSubmit(onInitiatePortalActivation)} className="space-y-4">
                <input type="text" {...formB.register('_gotcha')} tabIndex="-1" className="hidden" />

                {/* Target School */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                    School <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...formB.register('schoolId')}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                  >
                    <option value="">-- Choose School --</option>
                    {schools.map((school) => (
                      <option key={school._id} value={school._id}>
                        {school.name} ({school.code || 'LTC'})
                      </option>
                    ))}
                  </select>
                  {formB.formState.errors.schoolId && (
                    <p className="mt-1 text-xs text-rose-600">{formB.formState.errors.schoolId.message}</p>
                  )}
                </div>

                {/* Primary Identifier (GR Number or Global Student ID) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                      G.R. Number (General Register)
                    </label>
                    <input
                      {...formB.register('grNumber')}
                      type="text"
                      placeholder="e.g. 1045 or LTC045-2026-0001"
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] font-mono focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                    />
                    {formB.formState.errors.grNumber && (
                      <p className="mt-1 text-xs text-rose-600">{formB.formState.errors.grNumber.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                      OR Global Student ID
                    </label>
                    <input
                      {...formB.register('globalStudentId')}
                      type="text"
                      placeholder="e.g. MMHA-0001"
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] font-mono uppercase focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                    />
                  </div>
                </div>

                {/* 2nd Factor: Date of Birth (Anti-Enumeration Guard) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477]">
                      Student Date of Birth <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-[#006AC7] font-semibold">2nd Factor Verification</span>
                  </div>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      {...formB.register('dateOfBirth')}
                      type="date"
                      className="block w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                    />
                  </div>
                  {formB.formState.errors.dateOfBirth && (
                    <p className="mt-1 text-xs text-rose-600">{formB.formState.errors.dateOfBirth.message}</p>
                  )}
                  <p className="mt-1 text-[11px] text-slate-400">
                    Must match the student's physical admission record on file in the school register.
                  </p>
                </div>

                {/* Portal Email */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                    Your Portal Login Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      {...formB.register('email')}
                      type="email"
                      placeholder="parent@example.com"
                      className="block w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                    />
                  </div>
                  {formB.formState.errors.email && (
                    <p className="mt-1 text-xs text-rose-600">{formB.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                      New Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        {...formB.register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        className="block w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {formB.formState.errors.password && (
                      <p className="mt-1 text-xs text-rose-600">{formB.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#526477] mb-1.5">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        {...formB.register('confirmPassword')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        className="block w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-[#102033] focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {formB.formState.errors.confirmPassword && (
                      <p className="mt-1 text-xs text-rose-600">{formB.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#006AC7] hover:bg-[#00529B] shadow-sm transition-all disabled:opacity-50"
                  >
                    {loading ? 'Dispatching OTP...' : 'Verify Email & Activate Portal Account'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Already have account footer */}
          {!submissionSuccess && (
            <div className="mt-6 border-t border-slate-200/80 pt-4 text-center text-xs text-[#526477]">
              Already have an activated account?{' '}
              <Link to="/login" className="text-[#006AC7] hover:underline font-semibold">
                Sign in here
              </Link>
            </div>
          )}
        </div>

        {/* Security badge footer */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#8094A8]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#4B7F3A]" />
          <span>Official Student Identity Portal • DMC Liaquatabad Town Centre</span>
        </div>
      </div>

      {/* Cryptographic OTP Verification Modal */}
      <OtpVerificationModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        email={otpTargetEmail}
        purpose="REGISTRATION"
        onVerified={handleOtpVerified}
      />

      {/* HM Add Student Modal (When triggered by logged-in Head Master) */}
      {showHmModal && (
        <HmAddStudentModal
          isOpen={showHmModal}
          onClose={() => setShowHmModal(false)}
          schoolId={user?.schoolId}
          onSuccess={() => {
            setShowHmModal(false);
            toast.success('Student record enrolled in school register!');
          }}
        />
      )}

      {/* Official Admission Document Modal (A4 Printable Layout) */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[96vh] flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <OfficialAdmissionDocument
                data={{
                  ...watchedFormAValues,
                  admissionRegisterNumber: submissionSuccess?.admissionRegisterNumber,
                  grNumber: submissionSuccess?.grNumber,
                }}
                school={selectedSchool}
                onClose={() => setShowPrintPreview(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterStudentPage;
