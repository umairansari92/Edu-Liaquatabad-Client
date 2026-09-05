import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  School,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Calculator,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { setCredentials, setError } from '../../store/slices/authSlice.js';
import apiClient from '../../services/apiClient.js';
import { loginSchema } from '../../validations/authSchemas.js';

export const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [captcha, setCaptcha] = useState(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // Fetch Math CAPTCHA
  const fetchCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const captchaResponse = await apiClient.get('/auth/captcha');
      if (captchaResponse.data?.success && captchaResponse.data?.data) {
        setCaptcha(captchaResponse.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const onSubmit = async (loginFormData) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const payload = {
        email: loginFormData.email,
        password: loginFormData.password,
        _gotcha: loginFormData._gotcha || '',
      };

      if (captcha) {
        payload.captchaAnswer = loginFormData.captchaAnswer || '';
        payload.captchaChallengeToken = captcha.challengeToken;
      }

      const response = await apiClient.post('/auth/login', payload);

      if (response.data?.success && response.data?.data) {
        const { user, accessToken } = response.data.data;
        dispatch(setCredentials({ user, accessToken }));
        toast.success(`Welcome back, ${user.fullName}!`);
        navigate('/dashboard');
      }
    } catch (loginError) {
      const errorNotificationMessage = loginError.response?.data?.message || 'Authentication failed. Please verify credentials.';
      setErrorMessage(errorNotificationMessage);
      dispatch(setError(errorNotificationMessage));
      // Refresh CAPTCHA on failed attempt
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
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
          Official Portal Sign In
        </h2>
        <p className="mt-1.5 text-xs text-slate-400">
          Education Department Liaquatabad Town Centre (DMC)
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-800">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Honeypot field (hidden from legitimate users) */}
            <input
              type="text"
              {...register('_gotcha')}
              tabIndex="-1"
              autoComplete="off"
              className="hidden"
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Official Email or Student GR Number
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  {...register('email')}
                  placeholder="Official email or GR Number (e.g. 1045)"
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Secure Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>
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
                {loading ? 'Authenticating...' : 'Sign In to Official Portal'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-800/80 pt-5 text-center text-xs text-slate-400 space-y-2">
            <p>
              Student Self-Registration?{' '}
              <Link to="/register-student" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Register Student Account
              </Link>
            </p>
            <p>
              Faculty Registration?{' '}
              <Link to="/register-teacher" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Register Faculty Account
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Protected by Triple-Lock Rate Limiting & 256-bit Encryption</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
