import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  School,
  User,
  Phone,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  Building2,
  Calendar,
  CreditCard,
  BookOpen,
  Plus,
  Trash2,
  Briefcase,
  IdCard,
} from 'lucide-react';
import apiClient from '../../services/apiClient.js';
import OtpVerificationModal from '../../components/common/OtpVerificationModal.jsx';
import { teacherFormSchema } from '../../validations/authSchemas.js';

export const RegisterTeacherPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [schools, setSchools] = useState([]);
  const [schoolStructure, setSchoolStructure] = useState({ classes: [], sections: [], subjects: [] });
  const [activeStep, setActiveStep] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      isTeachingStaff: true,
      teachingAssignments: [],
      designation: 'PST',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'teachingAssignments',
  });

  const isTeachingStaff = watch('isTeachingStaff');
  const selectedSchoolId = watch('schoolId');

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const schoolsResponse = await apiClient.get('/public/schools');
        const list = schoolsResponse.data?.data?.schools || schoolsResponse.data?.data || [];
        if (Array.isArray(list)) {
          setSchools(list);
        }
      } catch {
        // Fallback quiet
      }
    };
    fetchSchools();
  }, []);

  // When school changes, load class/section/subject dropdowns
  useEffect(() => {
    if (!selectedSchoolId) {
      setSchoolStructure({ classes: [], sections: [], subjects: [] });
      return;
    }
    const fetchStructure = async () => {
      try {
        const res = await apiClient.get(`/public/schools/${selectedSchoolId}/structure`);
        if (res.data?.success && res.data?.data) {
          setSchoolStructure(res.data.data);
        }
      } catch {
        // Fallback quiet
      }
    };
    fetchStructure();
  }, [selectedSchoolId]);

  const onInitiateSubmit = async (formData) => {
    setLoading(true);
    setErrorMessage('');
    try {
      // Step 1: Send OTP to official email
      const response = await apiClient.post('/auth/send-otp', {
        email: formData.email,
        purpose: 'REGISTRATION',
      });
      if (response.data?.data?.devOtp) {
        setDevOtp(response.data.data.devOtp);
      }
      setPendingFormData(formData);
      setShowOtpModal(true);
    } catch (dispatchError) {
      setErrorMessage(
        dispatchError.response?.data?.message || 'Failed to dispatch verification code. Please check your email.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = async (otpCode) => {
    // Step 2: Finalize staff registration with verified OTP
    await apiClient.post('/auth/register-teacher', {
      ...pendingFormData,
      otpCode,
    });
    setShowOtpModal(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FBFD] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#006AC7] selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-3xl text-center">
        <Link to="/" className="inline-flex items-center justify-center space-x-3 mb-3 group">
          <div className="w-12 h-12 rounded-2xl bg-[#006AC7] flex items-center justify-center shadow-lg shadow-[#006AC7]/20 group-hover:bg-[#00529B] transition-colors">
            <School className="w-6 h-6 text-white" />
          </div>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#102033] tracking-tight">
          Official Staff &amp; Faculty Registration
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-[#526477]">
          Education Department Liaquatabad Town Centre (DMC) — Institutional Service Record Portal
        </p>

        {/* Step Indicator Tabs */}
        {!submitted && (
          <div className="mt-6 flex justify-center items-center gap-2 max-w-xl mx-auto">
            {[
              { num: 1, title: 'Personal' },
              { num: 2, title: 'Employment' },
              { num: 3, title: 'Bank / Payroll' },
              ...(isTeachingStaff ? [{ num: 4, title: 'Teaching Duties' }] : []),
              { num: isTeachingStaff ? 5 : 4, title: 'Credentials' },
            ].map((step) => (
              <button
                key={step.num}
                type="button"
                onClick={() => setActiveStep(step.num)}
                className={`flex-1 py-2 px-2 text-xs font-semibold rounded-lg border transition-all ${
                  activeStep === step.num
                    ? 'bg-blue-50 border-[#006AC7] text-[#006AC7] shadow-sm'
                    : 'bg-white border-slate-200 text-[#526477] hover:text-[#102033] hover:bg-slate-50'
                }`}
              >
                <span className="block text-[10px] opacity-75">STEP {step.num}</span>
                {step.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-3xl">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200/80">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-[#4B7F3A]/10 border border-[#4B7F3A]/30 rounded-3xl flex items-center justify-center mx-auto mb-5 text-[#4B7F3A]">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-[#102033] mb-2">Staff Application Submitted!</h3>
              <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-left my-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#526477]">Applicant Name:</span>
                  <span className="font-semibold text-[#102033]">{pendingFormData?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#526477]">Employee No:</span>
                  <span className="font-mono font-semibold text-[#006AC7]">{pendingFormData?.employeeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#526477]">Designation:</span>
                  <span className="font-semibold text-[#102033]">{pendingFormData?.designation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#526477]">Account Status:</span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                    PENDING_APPROVAL
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#526477] mb-6 max-w-lg mx-auto leading-relaxed">
                Your email has been verified via 6-digit OTP. Your institutional profile is now in{' '}
                <strong className="text-amber-700">PENDING_APPROVAL</strong> status. The Head Master or Municipal
                Education Officer for your selected institution will verify your credentials before granting access.
              </p>
              <Link
                to="/login"
                className="inline-block py-2.5 px-8 rounded-xl text-xs font-semibold bg-[#006AC7] hover:bg-[#00529B] text-white transition-all shadow-sm"
              >
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onInitiateSubmit)} className="space-y-6">
              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* ─── STEP 1: Personal Information ─────────────────────────────────── */}
              {activeStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="border-b border-slate-200 pb-2 mb-4">
                    <h4 className="text-sm font-bold text-[#102033] flex items-center gap-2">
                      <IdCard className="w-4 h-4 text-[#006AC7]" />
                      Section 1: Personal &amp; Identification Details
                    </h4>
                    <p className="text-[11px] text-[#526477]">Official identification per Government CNIC record</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#526477] mb-1">Full Legal Name *</label>
                      <input
                        type="text"
                        {...register('fullName')}
                        placeholder="e.g. Muhammad Aslam"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/50 border border-slate-300 text-[#102033] text-xs focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:border-transparent outline-none"
                      />
                      {errors.fullName && <p className="text-[11px] text-rose-600 mt-1">{errors.fullName.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#526477] mb-1">Father's Name *</label>
                      <input
                        type="text"
                        {...register('fatherName')}
                        placeholder="e.g. Abdul Karim"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/50 border border-slate-300 text-[#102033] text-xs focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:border-transparent outline-none"
                      />
                      {errors.fatherName && <p className="text-[11px] text-rose-600 mt-1">{errors.fatherName.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#526477] mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        {...register('dateOfBirth')}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/50 border border-slate-300 text-[#102033] text-xs focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:border-transparent outline-none"
                      />
                      {errors.dateOfBirth && <p className="text-[11px] text-rose-600 mt-1">{errors.dateOfBirth.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#526477] mb-1">CNIC (National ID) *</label>
                      <input
                        type="text"
                        {...register('cnic')}
                        placeholder="42101-1234567-1"
                        maxLength={15}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/50 border border-slate-300 text-[#102033] text-xs font-mono focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:border-transparent outline-none"
                      />
                      {errors.cnic && <p className="text-[11px] text-rose-600 mt-1">{errors.cnic.message}</p>}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="py-2.5 px-6 rounded-xl bg-[#006AC7] hover:bg-[#00529B] text-white text-xs font-semibold transition-all shadow-sm"
                    >
                      Next: Employment Details &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* ─── STEP 2: Employment Information ───────────────────────────────── */}
              {activeStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="border-b border-slate-200 pb-2 mb-4">
                    <h4 className="text-sm font-bold text-[#102033] flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#006AC7]" />
                      Section 2: Employment &amp; Institutional Assignment
                    </h4>
                    <p className="text-[11px] text-[#526477]">Civil service appointment &amp; school affiliation</p>
                  </div>

                  {/* Teaching Staff Toggle */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-[#102033] block">Staff Classification</span>
                      <span className="text-[11px] text-[#526477]">
                        Is this employee appointed to teaching duties or support staff?
                      </span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('isTeachingStaff')}
                        className="w-4 h-4 rounded text-[#006AC7] border-slate-300 focus:ring-[#006AC7]"
                      />
                      <span className="text-xs font-medium text-[#102033]">
                        {isTeachingStaff ? 'Teaching Faculty' : 'Non-Teaching Support Staff'}
                      </span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#526477] mb-1">Employee Number (Personal No.) *</label>
                      <input
                        type="text"
                        {...register('employeeId')}
                        placeholder="e.g. EMP-10492"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/50 border border-slate-300 text-[#102033] text-xs font-mono uppercase focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:border-transparent outline-none"
                      />
                      {errors.employeeId && <p className="text-[11px] text-rose-600 mt-1">{errors.employeeId.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#526477] mb-1">Official Designation *</label>
                      <input
                        type="text"
                        {...register('designation')}
                        placeholder="e.g. PST, JST, HST, Senior Clerk, Peon"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/50 border border-slate-300 text-[#102033] text-xs focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:border-transparent outline-none"
                      />
                      {errors.designation && <p className="text-[11px] text-rose-600 mt-1">{errors.designation.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#526477] mb-1">School Affiliation (Claimed) *</label>
                      <select
                        {...register('schoolId')}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/50 border border-slate-300 text-[#102033] text-xs focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:border-transparent outline-none"
                      >
                        <option value="">Select your institution</option>
                        {schools.map((schoolItem) => (
                          <option key={schoolItem._id} value={schoolItem._id}>
                            {schoolItem.name} ({schoolItem.schoolCode || 'DMC'})
                          </option>
                        ))}
                      </select>
                      {errors.schoolId && <p className="text-[11px] text-rose-600 mt-1">{errors.schoolId.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#526477] mb-1">Date of Appointment *</label>
                      <input
                        type="date"
                        {...register('appointmentDate')}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/50 border border-slate-300 text-[#102033] text-xs focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:border-transparent outline-none"
                      />
                      {errors.appointmentDate && <p className="text-[11px] text-rose-600 mt-1">{errors.appointmentDate.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#526477] mb-1">Highest Qualification *</label>
                      <input
                        type="text"
                        {...register('qualification')}
                        placeholder="e.g. M.Sc Mathematics, B.Ed"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/50 border border-slate-300 text-[#102033] text-xs focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:border-transparent outline-none"
                      />
                      {errors.qualification && <p className="text-[11px] text-rose-600 mt-1">{errors.qualification.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#526477] mb-1">Contact Phone Number *</label>
                      <input
                        type="tel"
                        {...register('phoneNumber')}
                        placeholder="03001234567"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/50 border border-slate-300 text-[#102033] text-xs focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:border-transparent outline-none"
                      />
                      {errors.phoneNumber && <p className="text-[11px] text-rose-600 mt-1">{errors.phoneNumber.message}</p>}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-[#526477] mb-1">Official Email Address *</label>
                      <input
                        type="email"
                        {...register('email')}
                        placeholder="faculty@liaquatabad-schools.gov.pk"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/50 border border-slate-300 text-[#102033] text-xs focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:border-transparent outline-none"
                      />
                      {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#526477] text-xs font-semibold transition-all"
                    >
                      &larr; Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      className="py-2.5 px-6 rounded-xl bg-[#006AC7] hover:bg-[#00529B] text-white text-xs font-semibold transition-all shadow-sm"
                    >
                      Next: Bank / Payroll &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* ─── STEP 3: Bank & Payroll Information ───────────────────────────── */}
              {activeStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="border-b border-slate-200 pb-2 mb-4">
                    <h4 className="text-sm font-bold text-[#102033] flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#006AC7]" />
                      Section 3: Bank &amp; Payroll Disbursement Details
                    </h4>
                    <p className="text-[11px] text-[#526477]">
                      Official bank account information for salary and government disbursements
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#526477] mb-1">Bank Name *</label>
                      <input
                        type="text"
                        {...register('bankName')}
                        placeholder="e.g. National Bank of Pakistan (NBP)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/50 border border-slate-300 text-[#102033] text-xs focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:border-transparent outline-none"
                      />
                      {errors.bankName && <p className="text-[11px] text-rose-600 mt-1">{errors.bankName.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#526477] mb-1">Branch Name &amp; Code *</label>
                      <input
                        type="text"
                        {...register('branchName')}
                        placeholder="e.g. Liaquatabad Main Branch (0123)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/50 border border-slate-300 text-[#102033] text-xs focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:border-transparent outline-none"
                      />
                      {errors.branchName && <p className="text-[11px] text-rose-600 mt-1">{errors.branchName.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#526477] mb-1">Account Title *</label>
                      <input
                        type="text"
                        {...register('accountTitle')}
                        placeholder="e.g. Muhammad Aslam"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/50 border border-slate-300 text-[#102033] text-xs focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:border-transparent outline-none"
                      />
                      {errors.accountTitle && <p className="text-[11px] text-rose-600 mt-1">{errors.accountTitle.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#526477] mb-1">Bank Account Number / IBAN *</label>
                      <input
                        type="text"
                        {...register('accountNumber')}
                        placeholder="e.g. PK36NBPA00000012345678"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/50 border border-slate-300 text-[#102033] text-xs font-mono focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:border-transparent outline-none"
                      />
                      {errors.accountNumber && <p className="text-[11px] text-rose-600 mt-1">{errors.accountNumber.message}</p>}
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#526477] text-xs font-semibold transition-all"
                    >
                      &larr; Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStep(isTeachingStaff ? 4 : 4)}
                      className="py-2.5 px-6 rounded-xl bg-[#006AC7] hover:bg-[#00529B] text-white text-xs font-semibold transition-all shadow-sm"
                    >
                      {isTeachingStaff ? 'Next: Teaching Duties \u2192' : 'Next: Credentials \u2192'}
                    </button>
                  </div>
                </div>
              )}

              {/* ─── STEP 4: Teaching Assignments (Teachers Only) ─────────────────── */}
              {isTeachingStaff && activeStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="border-b border-slate-200 pb-2 mb-4 flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-[#102033] flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#006AC7]" />
                        Section 4: Proposed Teaching Assignments
                      </h4>
                      <p className="text-[11px] text-[#526477]">
                        Declare classes, sections, and subjects taught (history is preserved)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        append({
                          classId: schoolStructure.classes[0]?._id || '',
                          sectionId: schoolStructure.sections[0]?._id || '',
                          subjectId: schoolStructure.subjects[0]?._id || '',
                          academicSession: '2025-2026',
                        })
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-[#006AC7] border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Subject Assignment
                    </button>
                  </div>

                  {fields.length === 0 ? (
                    <div className="p-6 rounded-xl border border-dashed border-slate-300 text-center text-xs text-[#526477]">
                      No teaching assignments added yet. Click &quot;Add Subject Assignment&quot; above to declare your
                      teaching duties (e.g. Class 5-A English, Class 6-B Science).
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {fields.map((item, index) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center"
                        >
                          <div>
                            <label className="block text-[10px] font-medium text-[#526477] mb-0.5">Class</label>
                            <select
                              {...register(`teachingAssignments.${index}.classId`)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-[#102033] text-xs outline-none focus:ring-1 focus:ring-[#006AC7]"
                            >
                              <option value="">Select Class</option>
                              {schoolStructure.classes.map((classItem) => (
                                <option key={classItem._id} value={classItem._id}>
                                  {classItem.name} (Grade {classItem.numericGrade})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-medium text-[#526477] mb-0.5">Section</label>
                            <select
                              {...register(`teachingAssignments.${index}.sectionId`)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-[#102033] text-xs outline-none focus:ring-1 focus:ring-[#006AC7]"
                            >
                              <option value="">Select Section</option>
                              {schoolStructure.sections.map((sec) => (
                                <option key={sec._id} value={sec._id}>
                                  Section {sec.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-medium text-[#526477] mb-0.5">Subject</label>
                            <select
                              {...register(`teachingAssignments.${index}.subjectId`)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-[#102033] text-xs outline-none focus:ring-1 focus:ring-[#006AC7]"
                            >
                              <option value="">Select Subject</option>
                              {schoolStructure.subjects.map((sub) => (
                                <option key={sub._id} value={sub._id}>
                                  {sub.name} ({sub.code || 'GEN'})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <label className="block text-[10px] font-medium text-[#526477] mb-0.5">Session</label>
                              <input
                                type="text"
                                {...register(`teachingAssignments.${index}.academicSession`)}
                                placeholder="2025-2026"
                                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-[#102033] text-xs outline-none font-mono focus:ring-1 focus:ring-[#006AC7]"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="mt-3 p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#526477] text-xs font-semibold transition-all"
                    >
                      &larr; Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStep(5)}
                      className="py-2.5 px-6 rounded-xl bg-[#006AC7] hover:bg-[#00529B] text-white text-xs font-semibold transition-all shadow-sm"
                    >
                      Next: Set Password &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* ─── STEP 5: Password & Submit (or Step 4 if non-teaching) ───────── */}
              {((isTeachingStaff && activeStep === 5) || (!isTeachingStaff && activeStep === 4)) && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="border-b border-slate-200 pb-2 mb-4">
                    <h4 className="text-sm font-bold text-[#102033] flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#006AC7]" />
                      Final Step: Security Credentials &amp; Verification
                    </h4>
                    <p className="text-[11px] text-[#526477]">
                      Set account password and dispatch email verification code
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#526477] mb-1">Account Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          {...register('password')}
                          placeholder="••••••••"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/50 border border-slate-300 text-[#102033] text-xs pr-10 focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:border-transparent outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-[#8094A8] hover:text-[#102033]"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-[11px] text-rose-600 mt-1">{errors.password.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#526477] mb-1">Confirm Password *</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          {...register('confirmPassword')}
                          placeholder="••••••••"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/50 border border-slate-300 text-[#102033] text-xs pr-10 focus:bg-white focus:ring-2 focus:ring-[#006AC7] focus:border-transparent outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-2.5 text-[#8094A8] hover:text-[#102033]"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-[11px] text-rose-600 mt-1">{errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
                    <strong>Notice:</strong> Upon submitting, a 6-digit verification code (OTP) will be dispatched to
                    your official email. Your account will be created in <strong>PENDING_APPROVAL</strong> status until
                    an authorized institutional officer verifies your official credentials.
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveStep(isTeachingStaff ? 4 : 3)}
                      className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#526477] text-xs font-semibold transition-all"
                    >
                      &larr; Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="py-2.5 px-8 rounded-xl bg-[#006AC7] hover:bg-[#00529B] text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? 'Dispatching OTP...' : 'Verify Email & Submit Profile'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-200 text-center">
            <p className="text-xs text-[#526477]">
              Already have an active account?{' '}
              <Link to="/login" className="text-[#006AC7] hover:underline font-semibold">
                Sign In to Portal
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* 6-Digit OTP Verification Modal */}
      {showOtpModal && (
        <OtpVerificationModal
          isOpen={showOtpModal}
          onClose={() => setShowOtpModal(false)}
          email={pendingFormData?.email}
          purpose="REGISTRATION"
          devOtp={devOtp}
          onVerified={handleOtpVerified}
        />
      )}
    </div>
  );
};

export default RegisterTeacherPage;
