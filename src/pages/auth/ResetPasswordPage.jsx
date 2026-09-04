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

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const payload = {
        email: data.email,
        otpCode: data.otpCode,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
        _gotcha: data._gotcha || '',
      };

      await apiClient.post('/auth/reset-password', payload);
      toast.success('Password reset successfully!');
      setSuccess(true);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Password reset failed. Please verify your OTP code and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-emerald-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center justify-center space-x-3 mb-5 group">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg group-hover:bg-emerald-500 transition-colors">
            <School className="w-6 h-6 text-white" />
          </div>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
          Set New Password
        </h2>
        <p className="mt-1.5 text-xs text-slate-400">
          Education Department Liaquatabad Town Centre (DMC)
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-800">
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Password Updated!</h3>
              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                Your account password has been successfully updated. All previous active sessions have been securely invalidated. You may now sign in with your new password.
              </p>
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/50 transition-all"
              >
                Sign In With New Password
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Official Email Address
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="name@liaquatabad-schools.gov.pk"
                      className="block w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    6-Digit Security OTP Code
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      {...register('otpCode')}
                      placeholder="e.g. 583921"
                      className="block w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs font-mono tracking-widest"
                    />
                  </div>
                  {errors.otpCode && (
                    <p className="mt-1 text-xs text-rose-400">{errors.otpCode.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    New Secure Password
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      {...register('newPassword')}
                      placeholder="Min 8 chars, 1 uppercase, 1 digit"
                      className="block w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs"
                    />
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1 text-xs text-rose-400">{errors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      {...register('confirmPassword')}
                      placeholder="Re-type new password"
                      className="block w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-rose-400">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Updating Password...' : 'Confirm & Update Password'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>

              <div className="mt-6 border-t border-slate-800/80 pt-5 text-center text-xs text-slate-400">
                <Link
                  to="/login"
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  Remember your password? Sign In
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Security badge footer */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Single-use OTP Verification with Automatic Session Invalidation</span>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
