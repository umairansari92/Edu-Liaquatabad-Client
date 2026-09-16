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

  // Functional MFA State (unblocks Root Admin mandatory 2FA)
  const [mfaChallenge, setMfaChallenge] = useState(null); // { mfaPendingToken, requiresSetup, secret, otpAuthUri }
  const [totpCode, setTotpCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [unmaskedRecoveryCodes, setUnmaskedRecoveryCodes] = useState(null);

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
        if (response.data.data.mfaRequired) {
          const { mfaPendingToken } = response.data.data;
          const requiresSetup = !!(response.data.data.requiresSetup || response.data.data.setupRequired);
          setMfaError('');
          if (requiresSetup) {
            try {
              const setupRes = await apiClient.post('/auth/mfa/setup', { mfaPendingToken });
              setMfaChallenge({
                mfaPendingToken,
                requiresSetup: true,
                secret: setupRes.data?.data?.secret,
                otpAuthUri: setupRes.data?.data?.otpAuthUri,
              });
            } catch (setupErr) {
              setMfaChallenge({
                mfaPendingToken,
                requiresSetup: true,
                secret: null,
              });
              setMfaError(setupErr.response?.data?.message || 'Failed to initiate MFA setup.');
            }
          } else {
            setMfaChallenge({
              mfaPendingToken,
              requiresSetup: false,
            });
          }
          return;
        }

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

  const handleVerifyTotp = async (e) => {
    e.preventDefault();
    if (!totpCode || totpCode.trim().length !== 6) {
      setMfaError('Please enter a valid 6-digit authentication code.');
      return;
    }
    setMfaLoading(true);
    setMfaError('');
    try {
      if (mfaChallenge.requiresSetup) {
        const confirmRes = await apiClient.post('/auth/mfa/confirm', {
          totpCode: totpCode.trim(),
          mfaPendingToken: mfaChallenge.mfaPendingToken,
        });
        if (confirmRes.data?.success) {
          const { user, accessToken, recoveryCodes } = confirmRes.data.data;
          if (recoveryCodes && recoveryCodes.length > 0) {
            setUnmaskedRecoveryCodes(recoveryCodes);
          }
          if (accessToken && user) {
            dispatch(setCredentials({ user, accessToken }));
            toast.success('MFA enrolled successfully! Welcome back.');
            if (!recoveryCodes || recoveryCodes.length === 0) {
              navigate('/dashboard');
            }
          }
        }
      } else {
        const verifyRes = await apiClient.post('/auth/mfa/verify-login', {
          totpCode: totpCode.trim(),
          mfaPendingToken: mfaChallenge.mfaPendingToken,
        });
        if (verifyRes.data?.success && verifyRes.data?.data) {
          const { user, accessToken } = verifyRes.data.data;
          dispatch(setCredentials({ user, accessToken }));
          toast.success(`Welcome back, ${user.fullName}!`);
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setMfaError(err.response?.data?.message || 'Verification failed. Please check your code.');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyRecovery = async (e) => {
    e.preventDefault();
    if (!recoveryCode || recoveryCode.trim().length < 16) {
      setMfaError('Please enter a valid 16-character recovery code.');
      return;
    }
    setMfaLoading(true);
    setMfaError('');
    try {
      const recRes = await apiClient.post('/auth/mfa/recovery-login', {
        recoveryCode: recoveryCode.trim(),
        mfaPendingToken: mfaChallenge.mfaPendingToken,
      });
      if (recRes.data?.success && recRes.data?.data) {
        const { user, accessToken } = recRes.data.data;
        dispatch(setCredentials({ user, accessToken }));
        toast.success(`Recovery successful! Welcome back, ${user.fullName}.`);
        navigate('/dashboard');
      }
    } catch (err) {
      setMfaError(err.response?.data?.message || 'Recovery code verification failed.');
    } finally {
      setMfaLoading(false);
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

          {/* ─── Functional MFA Challenge UI (Unblocks Login) ─── */}
          {mfaChallenge ? (
            <div className="space-y-4">
              {unmaskedRecoveryCodes ? (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                    <p className="font-bold">MFA Setup Successful!</p>
                    <p className="mt-1">Save these emergency recovery codes in a secure location:</p>
                  </div>
                  <pre className="p-3 bg-slate-100 rounded-xl text-xs font-mono select-all overflow-x-auto border border-slate-200">
                    {unmaskedRecoveryCodes.join('\n')}
                  </pre>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-2.5 px-4 bg-[#006AC7] text-white text-xs font-bold rounded-xl shadow hover:bg-[#00529B] transition"
                  >
                    Continue to Dashboard
                  </button>
                </div>
              ) : (
                <form onSubmit={recoveryMode ? handleVerifyRecovery : handleVerifyTotp} className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#102033]">
                      {mfaChallenge.requiresSetup
                        ? 'MFA Setup Required'
                        : recoveryMode
                        ? 'Emergency Recovery Login'
                        : 'Two-Factor Authentication'}
                    </h3>
                    <p className="text-xs text-[#526477] mt-1">
                      {mfaChallenge.requiresSetup
                        ? 'Enter this secret key into your authenticator app (Google Authenticator, etc.):'
                        : recoveryMode
                        ? 'Enter your 16-character backup recovery code:'
                        : 'Enter the 6-digit code from your authenticator app:'}
                    </p>
                  </div>

                  {mfaChallenge.requiresSetup && mfaChallenge.secret && (
                    <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-center">
                      <span className="text-xs font-mono font-bold text-[#102033] select-all tracking-wider">
                        {mfaChallenge.secret}
                      </span>
                    </div>
                  )}

                  {mfaError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                      {mfaError}
                    </div>
                  )}

                  {recoveryMode ? (
                    <div>
                      <input
                        type="text"
                        placeholder="ABCD-EFGH-1234-5678"
                        value={recoveryCode}
                        onChange={(e) => setRecoveryCode(e.target.value)}
                        className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-center tracking-widest focus:bg-white focus:outline-none focus:border-[#006AC7]"
                      />
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                        className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-lg font-mono font-bold text-center tracking-widest focus:bg-white focus:outline-none focus:border-[#006AC7]"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={mfaLoading}
                    className="w-full py-2.5 px-4 bg-[#006AC7] text-white text-xs font-bold rounded-xl shadow hover:bg-[#00529B] transition disabled:opacity-50"
                  >
                    {mfaLoading ? 'Verifying...' : mfaChallenge.requiresSetup ? 'Confirm & Enable MFA' : 'Verify & Sign In'}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    {!mfaChallenge.requiresSetup && (
                      <button
                        type="button"
                        onClick={() => {
                          setRecoveryMode(!recoveryMode);
                          setMfaError('');
                        }}
                        className="text-[#006AC7] hover:underline font-medium"
                      >
                        {recoveryMode ? 'Use Authenticator Code' : 'Use Recovery Code'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMfaChallenge(null);
                        setMfaError('');
                        setTotpCode('');
                        setRecoveryCode('');
                        setRecoveryMode(false);
                      }}
                      className="text-slate-500 hover:text-slate-700 ml-auto"
                    >
                      Cancel & Return
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
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
          )}

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
