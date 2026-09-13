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
  Eye,
  EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { setCredentials, setError } from '../../store/slices/authSlice.js';
import apiClient from '../../services/apiClient.js';
import { loginSchema } from '../../validations/authSchemas.js';

export const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  // lockoutSeconds: null = no lockout, number = live countdown in seconds
  const [lockoutSeconds, setLockoutSeconds] = useState(null);
  // captchaCooldown: 0 = ready to refresh, >0 = seconds until next allowed refresh
  const [captchaCooldown, setCaptchaCooldown] = useState(0);

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

  // Fetch Math CAPTCHA with 5-second refresh cooldown (industry standard anti-spam)
  const CAPTCHA_REFRESH_COOLDOWN = 5; // seconds
  const fetchCaptcha = async (triggeredByUser = false) => {
    if (triggeredByUser && captchaCooldown > 0) return; // ignore spam clicks
    setCaptchaLoading(true);
    try {
      const captchaResponse = await apiClient.get('/auth/captcha');
      if (captchaResponse.data?.success && captchaResponse.data?.data) {
        setCaptcha(captchaResponse.data.data);
      }
    } catch {
      // Fallback — server rate limited or offline
    } finally {
      setCaptchaLoading(false);
      if (triggeredByUser) {
        setCaptchaCooldown(CAPTCHA_REFRESH_COOLDOWN);
      }
    }
  };

  useEffect(() => {
    fetchCaptcha(false); // initial load — no cooldown
  }, []);

  // CAPTCHA refresh cooldown ticker — 1 tick/sec until 0
  useEffect(() => {
    if (captchaCooldown <= 0) return;
    const cooldownTicker = setInterval(() => {
      setCaptchaCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownTicker); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownTicker);
  }, [captchaCooldown]);

  // Live countdown ticker — runs every second when lockoutSeconds > 0
  useEffect(() => {
    if (lockoutSeconds === null || lockoutSeconds <= 0) {
      if (lockoutSeconds === 0) {
        setLockoutSeconds(null);
        setErrorMessage('');
      }
      return;
    }
    const ticker = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(ticker);
          setErrorMessage('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ticker);
  }, [lockoutSeconds]);

  // Format seconds into MM:SS display
  const formatCountdown = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return '00:00';
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

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
        const trimmedAnswer = String(loginFormData.captchaAnswer || '').trim();
        if (trimmedAnswer !== '') {
          payload.captchaAnswer = trimmedAnswer;
          payload.captchaChallengeToken = captcha.challengeToken;
        }
      }

      const response = await apiClient.post('/auth/login', payload);

      if (response.data?.success && response.data?.data) {
        const { user, accessToken } = response.data.data;
        dispatch(setCredentials({ user, accessToken }));
        toast.success(`Welcome back, ${user.fullName}!`);
        navigate('/dashboard');
      }
    } catch (loginError) {
      const status = loginError.response?.status;
      const errorNotificationMessage = loginError.response?.data?.message || 'Authentication failed. Please verify credentials.';

      if (status === 423) {
        const minuteMatch = errorNotificationMessage.match(/(\d+)\s*minute/);
        const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 15;
        setLockoutSeconds(minutes * 60);
        setErrorMessage(errorNotificationMessage);
      } else {
        setLockoutSeconds(null);
        setErrorMessage(errorNotificationMessage);
      }

      dispatch(setError(errorNotificationMessage));
      fetchCaptcha(false);
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
          Official Portal Sign In
        </h2>
        <p className="mt-1.5 text-xs text-[#526477] font-medium">
          Education Department Liaquatabad Town Centre (DMC)
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200/80">
          {errorMessage && (
            <div className={`mb-5 p-3.5 rounded-xl text-xs flex flex-col gap-2.5 ${
              lockoutSeconds
                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}>
              <div className="flex items-start gap-2.5">
                {lockoutSeconds ? (
                  <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                )}
                <span>{lockoutSeconds
                  ? 'Account temporarily locked due to excessive failed attempts.'
                  : errorMessage
                }</span>
              </div>
              {lockoutSeconds > 0 && (
                <div className="flex items-center justify-between pl-6">
                  <span className="text-amber-700 font-medium">Retry available in:</span>
                  <div className="flex items-center gap-1.5 bg-amber-100/80 border border-amber-300 rounded-lg px-3 py-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                    <span className="font-mono font-bold text-amber-900 text-sm tracking-widest">
                      {formatCountdown(lockoutSeconds)}
                    </span>
                  </div>
                </div>
              )}
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
                Official Email or Student GR Number
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  {...register('email')}
                  placeholder="Official email or GR Number (e.g. 1045)"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-[#102033] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#006AC7] focus:ring-1 focus:ring-[#006AC7] text-xs font-medium"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#526477]">
                  Secure Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-[#006AC7] hover:underline font-bold transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-[#102033] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#006AC7] focus:ring-1 focus:ring-[#006AC7] text-xs font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  tabIndex="-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.password.message}</p>
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
                    onClick={() => fetchCaptcha(true)}
                    disabled={captchaLoading || captchaCooldown > 0}
                    className={`text-[11px] flex items-center gap-1 font-bold transition-colors ${
                      captchaCooldown > 0
                        ? 'text-slate-400 cursor-not-allowed'
                        : 'text-[#006AC7] hover:underline'
                    }`}
                  >
                    <RefreshCw className={`w-3 h-3 ${captchaLoading ? 'animate-spin' : ''}`} />
                    {captchaCooldown > 0 ? `Wait ${captchaCooldown}s` : 'Refresh'}
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
                disabled={loading || lockoutSeconds > 0}
                className={`w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-sm transition-all ${
                  lockoutSeconds > 0
                    ? 'bg-slate-300 cursor-not-allowed opacity-70 text-slate-600'
                    : 'bg-[#006AC7] hover:bg-[#00529B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#006AC7]'
                }`}
              >
                {lockoutSeconds > 0 ? (
                  <>
                    <Clock className="w-4 h-4 animate-pulse" />
                    Locked — {formatCountdown(lockoutSeconds)}
                  </>
                ) : loading ? (
                  'Authenticating...'
                ) : (
                  <>
                    Sign In to Official Portal
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-[#526477] space-y-2 font-medium">
            <p>
              Student Self-Registration?{' '}
              <Link to="/register-student" className="text-[#006AC7] hover:underline font-bold">
                Register Student Account
              </Link>
            </p>
            <p>
              Faculty Registration?{' '}
              <Link to="/register-teacher" className="text-[#006AC7] hover:underline font-bold">
                Register Faculty Account
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#526477] font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-[#4B7F3A]" />
          <span>Protected by Triple-Lock Rate Limiting & 256-bit Encryption</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
