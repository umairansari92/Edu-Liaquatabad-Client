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
      const res = await apiClient.get('/auth/captcha');
      if (res.data?.success && res.data?.data) {
        setCaptcha(res.data.data);
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

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const payload = {
        email: data.email,
        _gotcha: data._gotcha || '',
      };

      if (captcha) {
        payload.captchaAnswer = data.captchaAnswer || '';
        payload.captchaChallengeToken = captcha.challengeToken;
      }

      await apiClient.post('/auth/forgot-password', payload);
      toast.success('Security reset code dispatched to your email.');
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to dispatch password recovery code. Please verify the email address.';
      setErrorMessage(msg);
      fetchCaptcha();
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
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight flex items-center justify-center gap-2">
          <KeyRound className="w-6 h-6 text-emerald-400" />
          Password Recovery
        </h2>
        <p className="mt-1.5 text-xs text-slate-400">
          Education Department Liaquatabad Town Centre (DMC)
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-800">
          <p className="text-xs text-slate-300 mb-5 leading-relaxed">
            Enter your official registered email address. We will dispatch a 6-digit cryptographic security code to authorize your password reset.
          </p>

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
                Official Registered Email
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

            {/* Math Security CAPTCHA */}
            {captcha && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                    Security Math Challenge
                  </label>
                  <button
                    type="button"
                    onClick={fetchCaptcha}
                    disabled={captchaLoading}
                    className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${captchaLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs font-bold tracking-wider select-none shadow-inner">
                    {captcha.question} = ?
                  </div>
                  <input
                    type="text"
                    {...register('captchaAnswer')}
                    placeholder="Result"
                    className="block flex-1 px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs text-center font-mono"
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50"
              >
                {loading ? 'Dispatching Reset Code...' : 'Dispatch Verification Code'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-800/80 pt-5 text-center text-xs text-slate-400">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Official Sign In
            </Link>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Encrypted Password Recovery Protected by DMC Security</span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
