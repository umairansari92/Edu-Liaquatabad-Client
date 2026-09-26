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
        setTimer((previousTimerSeconds) => previousTimerSeconds - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [isOpen, timer]);

  if (!isOpen) return null;

  const handleChange = (digitIndex, characterValue) => {
    if (!/^\d*$/.test(characterValue)) return;

    const newOtp = [...otp];
    newOtp[digitIndex] = characterValue.slice(-1);
    setOtp(newOtp);

    // Auto-focus next box
    if (characterValue && digitIndex < 5) {
      inputRefs.current[digitIndex + 1]?.focus();
    }
  };

  const handleKeyDown = (digitIndex, keyboardEvent) => {
    if (keyboardEvent.key === 'Backspace' && !otp[digitIndex] && digitIndex > 0) {
      inputRefs.current[digitIndex - 1]?.focus();
    }
  };

  const handlePaste = (clipboardEvent) => {
    clipboardEvent.preventDefault();
    const pastedData = clipboardEvent.clipboardData.getData('text').trim();
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
    } catch (verificationError) {
      setErrorMessage(verificationError.response?.data?.message || verificationError.message || 'Verification failed. Please check the code and try again.');
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
    } catch (resendError) {
      setErrorMessage(resendError.response?.data?.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-modal-backdrop">
      <div className="relative w-full max-w-md p-6 bg-white border border-slate-200 rounded-2xl shadow-2xl text-[#102033] animate-modal-card">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-[#102033] p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 border border-emerald-200 text-[#4B7F3A] flex items-center justify-center mb-3">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#102033]">Email Verification Required</h3>
          <p className="text-xs text-[#526477] mt-1">
            We dispatched a 6-digit security code to: <br />
            <span className="font-semibold text-[#006AC7] font-mono">{email}</span>
          </p>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 6-Box OTP Inputs */}
        <div className="flex justify-center gap-2.5 my-6" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(inputElement) => (inputRefs.current[index] = inputElement)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(changeEvent) => handleChange(index, changeEvent.target.value)}
              onKeyDown={(keyboardEvent) => handleKeyDown(index, keyboardEvent)}
              className="w-11 h-13 text-center text-xl font-bold bg-white border border-slate-300 focus:border-[#006AC7] focus:ring-2 focus:ring-blue-100 rounded-xl text-[#102033] outline-none transition-all"
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleVerify}
          disabled={loading || otp.join('').length !== 6}
          className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-[#006AC7] hover:bg-[#00529B] text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
        >
          {loading ? 'Validating Security Code...' : 'Verify & Continue'}
        </button>

        {/* Resend Controls */}
        <div className="mt-4 text-center text-xs text-[#526477] flex items-center justify-center gap-1.5">
          <span>Didn't receive the email?</span>
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-[#006AC7] hover:underline font-semibold inline-flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              Resend Code
            </button>
          ) : (
            <span className="text-[#8094A8] font-mono">Resend in {timer}s</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OtpVerificationModal;
