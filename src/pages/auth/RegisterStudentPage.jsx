import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { School, User, Lock, CheckCircle, AlertCircle, ArrowRight, ShieldCheck, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient.js';
import { studentRegistrationSchema } from '../../validations/authSchemas.js';

export const RegisterStudentPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [registeredGr, setRegisteredGr] = useState('');
  const [schools, setSchools] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(studentRegistrationSchema),
  });

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const res = await apiClient.get('/public/schools');
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setSchools(res.data.data);
        }
      } catch {
        // Fallback default if schools not yet seeded
      }
    };
    fetchSchools();
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const payload = {
        fullName: data.fullName,
        fatherOrGuardianName: data.fatherOrGuardianName,
        schoolId: data.schoolId,
        grNumber: data.grNumber,
        password: data.password,
        confirmPassword: data.confirmPassword,
        _gotcha: data._gotcha || '',
      };

      const res = await apiClient.post('/auth/register-student', payload);
      if (res.data?.success) {
        setRegisteredGr(data.grNumber);
        setSubmitted(true);
        toast.success('Student registration submitted successfully!');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Registration failed. Please verify your GR Number and School selection.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-emerald-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center justify-center space-x-3 mb-4 group">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/40 group-hover:bg-emerald-500 transition-colors">
            <School className="w-6 h-6 text-white" />
          </div>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
          Student Registration
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Education Department Liaquatabad Town Centre (DMC)
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-800">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-2">Registration Submitted!</h3>
              <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                Your student profile with GR Number{' '}
                <span className="font-mono text-emerald-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {registeredGr}
                </span>{' '}
                has been registered in{' '}
                <span className="text-amber-400 font-semibold">PENDING_APPROVAL</span> status.
              </p>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs text-left mb-6 space-y-1">
                <p className="font-semibold text-slate-300">Next Step:</p>
                <p>
                  Your Head Master (HM) will verify your physical GR record against the official school register to activate your account.
                </p>
              </div>
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/50 transition-all"
              >
                Proceed to Sign In
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Honeypot field */}
              <input
                type="text"
                {...register('_gotcha')}
                tabIndex="-1"
                autoComplete="off"
                className="hidden"
              />

              {/* Student Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Student Name
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    {...register('fullName')}
                    type="text"
                    placeholder="e.g. Muhammad Ali"
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs"
                  />
                </div>
                {errors.fullName && <p className="mt-1 text-xs text-rose-400">{errors.fullName.message}</p>}
              </div>

              {/* Father / Guardian Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Father / Guardian Name
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    {...register('fatherOrGuardianName')}
                    type="text"
                    placeholder="e.g. Tariq Mehmood"
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs"
                  />
                </div>
                {errors.fatherOrGuardianName && (
                  <p className="mt-1 text-xs text-rose-400">{errors.fatherOrGuardianName.message}</p>
                )}
              </div>

              {/* School */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  School
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <School className="w-4 h-4" />
                  </div>
                  <select
                    {...register('schoolId')}
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs"
                  >
                    <option value="">Select School</option>
                    {schools.map((school) => (
                      <option key={school._id} value={school._id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.schoolId && <p className="mt-1 text-xs text-rose-400">{errors.schoolId.message}</p>}
              </div>

              {/* GR Number (Traceable Identifier) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    GR Number
                  </label>
                  <span className="text-[10px] text-emerald-400">Official Student Tracking ID</span>
                </div>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    {...register('grNumber')}
                    type="text"
                    placeholder="e.g. 1045 or GR-1045"
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs font-mono"
                  />
                </div>
                {errors.grNumber && <p className="mt-1 text-xs text-rose-400">{errors.grNumber.message}</p>}
              </div>

              {/* Account Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Account Password
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••••••"
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs"
                  />
                </div>
                {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>}
              </div>

              {/* Retype Account Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Retype Account Password
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    {...register('confirmPassword')}
                    type="password"
                    placeholder="Re-enter your password"
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
                  {loading ? 'Submitting Registration...' : 'Register Student Account'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>

              <div className="mt-6 border-t border-slate-800/80 pt-4 text-center text-xs text-slate-400">
                Already registered?{' '}
                <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold">
                  Sign in here
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Security badge footer */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Official Student Identity Portal • DMC Liaquatabad</span>
        </div>
      </div>
    </div>
  );
};

export default RegisterStudentPage;
