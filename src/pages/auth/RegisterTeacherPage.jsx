import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { School, UserCheck, Phone, Mail, Lock, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import apiClient from '../../services/apiClient.js';
import OtpVerificationModal from '../../components/common/OtpVerificationModal.jsx';
import { teacherFormSchema } from '../../validations/authSchemas.js';

export const RegisterTeacherPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingFormData, setPendingFormData] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [schools, setSchools] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(teacherFormSchema),
  });

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const schoolsResponse = await apiClient.get('/public/schools');
        if (schoolsResponse.data?.success && Array.isArray(schoolsResponse.data?.data)) {
          setSchools(schoolsResponse.data.data);
        }
      } catch {
        // Quiet fallback if offline or seeding
      }
    };
    fetchSchools();
  }, []);

  const onInitiateSubmit = async (teacherFormData) => {
    setLoading(true);
    setErrorMessage('');
    try {
      // Step 1: Send OTP to teacher email
      await apiClient.post('/auth/send-otp', {
        email: teacherFormData.email,
        purpose: 'REGISTRATION',
      });
      setPendingFormData(teacherFormData);
      setShowOtpModal(true);
    } catch (dispatchError) {
      setErrorMessage(dispatchError.response?.data?.message || 'Failed to dispatch verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = async (otpCode) => {
    // Step 2: Finalize faculty registration with verified OTP
    await apiClient.post('/auth/register-teacher', {
      ...pendingFormData,
      otpCode,
    });
    setShowOtpModal(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-teal-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <Link to="/" className="inline-flex items-center justify-center space-x-3 mb-4 group">
          <div className="w-11 h-11 rounded-2xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-900/30 group-hover:bg-teal-500 transition-colors">
            <School className="w-6 h-6 text-white" />
          </div>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
          Faculty / Teacher Registration
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Education Department Liaquatabad Town Centre (DMC)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-slate-900 py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-800">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-teal-500/10 border border-teal-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-teal-400">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Faculty Application Received!</h3>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                Your email has been verified via 6-digit OTP. Your faculty profile is now awaiting Head Master (HM) &amp; Admin verification.
              </p>
              <Link
                to="/login"
                className="inline-block py-2.5 px-6 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-all shadow-lg shadow-teal-900/40"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onInitiateSubmit)} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Honeypot field */}
              <input
                type="text"
                {...register('_gotcha')}
                tabIndex="-1"
                autoComplete="off"
                className="hidden"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name & Title
                  </label>
                  <input
                    {...register('fullName')}
                    type="text"
                    placeholder="e.g. Sir Aslam Khan"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  {errors.fullName && <p className="mt-1 text-xs text-rose-400">{errors.fullName.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Official Email
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="teacher@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Account Password
                  </label>
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Contact Phone Number
                  </label>
                  <input
                    {...register('phoneNumber')}
                    type="tel"
                    placeholder="03009876543"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  {errors.phoneNumber && <p className="mt-1 text-xs text-rose-400">{errors.phoneNumber.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Designation / Subject Specialization
                  </label>
                  <input
                    {...register('designation')}
                    type="text"
                    placeholder="e.g. Senior Science Teacher (SST)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  {errors.designation && <p className="mt-1 text-xs text-rose-400">{errors.designation.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Assigned Municipal School
                  </label>
                  <select
                    {...register('schoolId')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Select Municipal School (Optional)</option>
                    {schools.map((school) => (
                      <option key={school._id} value={school._id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Highest Qualification
                </label>
                <input
                  {...register('qualification')}
                  type="text"
                  placeholder="e.g. M.Sc Physics / B.Ed"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
                {errors.qualification && <p className="mt-1 text-xs text-rose-400">{errors.qualification.message}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all shadow-lg shadow-teal-900/30 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {loading ? 'Dispatching Verification Code...' : 'Verify Email via OTP & Submit Application'}
                </button>
              </div>

              <div className="text-center pt-2 text-xs text-slate-400">
                Already registered?{' '}
                <Link to="/login" className="text-teal-400 hover:text-teal-300 font-semibold">
                  Sign in here
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* OTP Verification Modal */}
      <OtpVerificationModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        email={pendingFormData?.email || ''}
        onVerified={handleOtpVerified}
        purpose="REGISTRATION"
      />
    </div>
  );
};

export default RegisterTeacherPage;
