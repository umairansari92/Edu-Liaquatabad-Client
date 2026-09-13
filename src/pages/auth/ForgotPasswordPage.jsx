import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  School,
  Mail,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  RefreshCw,
  Calculator,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient.js';
import { passwordResetRequestSchema } from '../../validations/authSchemas.js';

export const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [captcha, setCaptcha] = useState(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordResetRequestSchema),
  });

  const fetchCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const captchaResponse = await apiClient.get('/auth/captcha');
      if (captchaResponse.data?.success && captchaResponse.data?.data) {
        setCaptcha(captchaResponse.data.data);
      }
    } catch {
      // Quiet fallback
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const onSubmit = async (recoveryFormData) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const payload = {
        email: recoveryFormData.email,
        _gotcha: recoveryFormData._gotcha || '',
      };

      if (captcha) {
        payload.captchaAnswer = recoveryFormData.captchaAnswer || '';
        payload.captchaChallengeToken = captcha.challengeToken;
      }

      await apiClient.post('/auth/forgot-password', payload);
      toast.success('Security reset code dispatched to your email.');
      navigate(`/reset-password?email=${encodeURIComponent(recoveryFormData.email)}`);
    } catch (dispatchError) {
      const errorNotificationMessage = dispatchError.response?.data?.message || 'Failed to dispatch password recovery code. Please verify the email address.';
      setErrorMessage(errorNotificationMessage);
      fetchCaptcha();
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
        <h2 className="text-2xl sm:text-3xl font-bold text-[#102033] tracking-tight flex items-center justify-center gap-2">
          <KeyRound className="w-6 h-6 text-[#006AC7]" />
          Password Recovery
        </h2>
        <p className="mt-1.5 text-xs text-[#526477] font-medium">
          Education Department Liaquatabad Town Centre (DMC)
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200/80">
          <p className="text-xs text-[#526477] mb-5 leading-relaxed font-medium">
            Enter your official registered email address. We will dispatch a 6-digit cryptographic security code to authorize your password reset.
          </p>

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
                Official Registered Email
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

            {/* Math Security CAPTCHA */}
            {captcha && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#526477] flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-[#006AC7]" />
                    Security Math Challenge
                  </label>
                  <button
                    type="button"
                    onClick={fetchCaptcha}
                    disabled={captchaLoading}
                    className="text-[11px] text-[#006AC7] hover:underline font-bold flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${captchaLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-[#006AC7] font-mono text-xs font-bold tracking-wider select-none shadow-sm">
                    {captcha.question} = ?
                  </div>
                  <input
                    type="text"
                    {...register('captchaAnswer')}
                    placeholder="Result"
                    className="block flex-1 px-3 py-2 bg-slate-50/50 border border-slate-300 rounded-xl text-[#102033] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#006AC7] focus:ring-1 focus:ring-[#006AC7] text-xs text-center font-mono font-bold"
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#006AC7] hover:bg-[#00529B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#006AC7] shadow-sm transition-all disabled:opacity-50"
              >
                {loading ? 'Dispatching Reset Code...' : 'Dispatch Verification Code'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-[#526477]">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-[#006AC7] hover:underline font-bold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Official Sign In
            </Link>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#526477] font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-[#4B7F3A]" />
          <span>Encrypted Password Recovery Protected by DMC Security</span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
