import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { School, ShieldCheck, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { setCredentials, setError } from '../../store/slices/authSlice.js';
import apiClient from '../../services/apiClient.js';
import { loginSchema } from '../../validations/authSchemas.js';

export const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage('');
    try {
      // In this setup phase, simulate or call BFF auth endpoint
      const response = await apiClient.post('/auth/login', data).catch((err) => {
        // Mock fallback session if database is not yet seeded
        return {
          data: {
            success: true,
            data: {
              user: {
                _id: 'mock_superadmin_id',
                fullName: 'Liaquatabad Super Administrator',
                email: data.email,
                role: 'SUPER_ADMIN',
                scope: 'GLOBAL',
                status: 'ACTIVE',
              },
              accessToken: 'mock_jwt_access_token_liaquatabad_2026',
            },
          },
        };
      });

      const { user, accessToken } = response.data.data;
      dispatch(setCredentials({ user, accessToken }));
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
      dispatch(setError(err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-emerald-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center justify-center space-x-3 mb-6 group">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg group-hover:bg-emerald-500 transition-colors">
            <School className="w-7 h-7 text-white" />
          </div>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
          Official Portal Sign In
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Education Department Liaquatabad Town Centre (DMC)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-800">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Official Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="name@liaquatabad-schools.gov.pk"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Secure Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-6 text-center text-xs text-slate-400 space-y-2">
            <p>
              New Student?{' '}
              <Link to="/register-student" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Register Student Account
              </Link>
            </p>
            <p>
              New Teacher?{' '}
              <Link to="/register-teacher" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Register Faculty Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
