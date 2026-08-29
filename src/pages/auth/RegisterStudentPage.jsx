import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { School, User, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import apiClient from '../../services/apiClient.js';
import OtpVerificationModal from '../../components/common/OtpVerificationModal.jsx';
import { registerStudentSchema } from '../../validations/authSchemas.js';

export const RegisterStudentPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingFormData, setPendingFormData] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerStudentSchema),
  });

  const onInitiateSubmit = async (data) => {
    setLoading(true);
    setErrorMessage('');
    try {
      // Step 1: Send OTP to applicant email
      await apiClient.post('/auth/send-otp', {
        email: data.email,
        purpose: 'REGISTRATION',
      });
      setPendingFormData(data);
      setShowOtpModal(true);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to dispatch verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = async (otpCode) => {
    setShowOtpModal(false);
    setLoading(true);
    try {
      // Step 2: Finalize registration with verified OTP
      await apiClient.post('/auth/register-student', {
        ...pendingFormData,
        otpCode,
      });
      setSubmitted(true);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-emerald-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <Link to="/" className="inline-flex items-center justify-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/30">
            <School className="w-6 h-6 text-white" />
          </div>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
          Student Registration
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Education Department Liaquatabad Town Centre (DMC)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-slate-900 py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-800">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Registration Submitted!</h3>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                Your email has been verified via 6-digit OTP. Your application is now in <span className="text-amber-400 font-semibold">PENDING_APPROVAL</span> status awaiting Head Master (HM) verification.
              </p>
              <Link
                to="/login"
                className="inline-block py-2.5 px-6 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-900/40"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Student Full Name
                  </label>
                  <input
                    {...register('fullName')}
                    type="text"
                    placeholder="e.g. Muhammad Ali"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  {errors.fullName && <p className="mt-1 text-xs text-rose-400">{errors.fullName.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="student@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Father / Guardian Name
                  </label>
                  <input
                    {...register('fatherOrGuardianName')}
                    type="text"
                    placeholder="e.g. Tariq Mehmood"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  {errors.fatherOrGuardianName && <p className="mt-1 text-xs text-rose-400">{errors.fatherOrGuardianName.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Guardian Phone
                  </label>
                  <input
                    {...register('guardianContactNumber')}
                    type="tel"
                    placeholder="03001234567"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  {errors.guardianContactNumber && <p className="mt-1 text-xs text-rose-400">{errors.guardianContactNumber.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Class
                  </label>
                  <input
                    {...register('className')}
                    type="text"
                    placeholder="e.g. Class 9"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  {errors.className && <p className="mt-1 text-xs text-rose-400">{errors.className.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Section
                  </label>
                  <input
                    {...register('sectionName')}
                    type="text"
                    placeholder="e.g. Section A"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  {errors.sectionName && <p className="mt-1 text-xs text-rose-400">{errors.sectionName.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Roll Number
                </label>
                <input
                  {...register('rollNumber')}
                  type="text"
                  placeholder="e.g. 1045"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                {errors.rollNumber && <p className="mt-1 text-xs text-rose-400">{errors.rollNumber.message}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all shadow-lg shadow-emerald-900/30 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {loading ? 'Sending Verification Code...' : 'Verify Email via OTP & Register'}
                </button>
              </div>

              <div className="text-center pt-2 text-xs text-slate-400">
                Already registered?{' '}
                <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold">
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

export default RegisterStudentPage;
