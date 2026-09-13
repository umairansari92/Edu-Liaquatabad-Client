import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  School,
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient.js';
import { passwordResetConfirmSchema } from '../../validations/authSchemas.js';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordResetConfirmSchema),
    defaultValues: {
      email: initialEmail,
    },
  });

  const onSubmit = async (resetPasswordFormData) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const payload = {
        email: resetPasswordFormData.email,
        otpCode: resetPasswordFormData.otpCode,
        newPassword: resetPasswordFormData.newPassword,
        confirmPassword: resetPasswordFormData.confirmPassword,
        _gotcha: resetPasswordFormData._gotcha || '',
      };

      await apiClient.post('/auth/reset-password', payload);
      toast.success('Password reset successfully!');
      setSuccess(true);
    } catch (resetPasswordError) {
      setErrorMessage(
        resetPasswordError.response?.data?.message || 'Password reset failed. Please verify your OTP code and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FBFD] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-[#006AC7] selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center justify-center space-x-3 mb-5 group">
          <div className="w-12 h-12 rounded-2xl bg-[#006AC7] flex items-center justify-center shadow-md group-hover:bg-[#00529B] transition-colors">
            <School className="w-6 h-6 text-white" />
          </div>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#102033] tracking-tight">
          Set New Password
        </h2>
        <p className="mt-1.5 text-xs text-[#526477] font-medium">
          Education Department Liaquatabad Town Centre (DMC)
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200/80">
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#4B7F3A]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#102033] mb-2">Password Updated!</h3>
              <p className="text-xs text-[#526477] mb-6 leading-relaxed font-medium">
                Your account password has been successfully updated. All previous active sessions have been securely invalidated. You may now sign in with your new password.
              </p>
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#006AC7] hover:bg-[#00529B] shadow-sm transition-all"
              >
                Sign In With New Password
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                {/* Honeypot field */}
                <input
                  type="text"
                  {...register('_gotcha')}
                  tabIndex="-1"
                  autoComplete="off"
                  className="hidden"
                />

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#526477] mb-1.5">
                    Official Email Address
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="name@liaquatabad-schools.gov.pk"
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-[#102033] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#006AC7] focus:ring-1 focus:ring-[#006AC7] text-xs font-medium"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#526477] mb-1.5">
                    6-Digit Security OTP Code
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      {...register('otpCode')}
                      placeholder="e.g. 583921"
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-[#102033] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#006AC7] focus:ring-1 focus:ring-[#006AC7] text-xs font-mono font-bold tracking-widest"
                    />
                  </div>
                  {errors.otpCode && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{errors.otpCode.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#526477] mb-1.5">
                    New Secure Password
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      {...register('newPassword')}
                      placeholder="Min 8 chars, 1 uppercase, 1 digit"
                      className="block w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-[#102033] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#006AC7] focus:ring-1 focus:ring-[#006AC7] text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      tabIndex="-1"
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{errors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#526477] mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      placeholder="Re-type new password"
                      className="block w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-[#102033] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#006AC7] focus:ring-1 focus:ring-[#006AC7] text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      tabIndex="-1"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#006AC7] hover:bg-[#00529B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#006AC7] shadow-sm transition-all disabled:opacity-50"
                  >
                    {loading ? 'Updating Password...' : 'Confirm & Update Password'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-[#526477]">
                <Link
                  to="/login"
                  className="text-[#006AC7] hover:underline font-bold transition-colors"
                >
                  Remember your password? Sign In
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Security badge footer */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#526477] font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-[#4B7F3A]" />
          <span>Single-use OTP Verification with Automatic Session Invalidation</span>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
