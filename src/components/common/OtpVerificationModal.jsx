import React, { useState, useEffect, useRef } from 'react';
import { Mail, CheckCircle2, RefreshCw, AlertCircle, X } from 'lucide-react';
import apiClient from '../../services/apiClient.js';

export const OtpVerificationModal = ({ isOpen, onClose, email, onVerified, purpose = 'REGISTRATION' }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    let interval;
    if (isOpen && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [isOpen, timer]);

  if (!isOpen) return null;

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      if (onVerified) {
        await onVerified(code);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setErrorMessage('');
    try {
      await apiClient.post('/auth/send-otp', {
        email,
        purpose,
      });
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mb-3">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-display font-bold text-white">Email Verification Required</h3>
          <p className="text-xs text-slate-400 mt-1">
            We dispatched a 6-digit security code to: <br />
            <span className="font-semibold text-emerald-400 font-mono">{email}</span>
          </p>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 6-Box OTP Inputs */}
        <div className="flex justify-center gap-2.5 my-6" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-11 h-13 text-center text-xl font-bold bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-white outline-none transition-all"
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleVerify}
          disabled={loading || otp.join('').length !== 6}
          className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'Validating Security Code...' : 'Verify & Continue'}
        </button>

        {/* Resend Controls */}
        <div className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <span>Didn't receive the email?</span>
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              Resend Code
            </button>
          ) : (
            <span className="text-slate-500 font-mono">Resend in {timer}s</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OtpVerificationModal;
