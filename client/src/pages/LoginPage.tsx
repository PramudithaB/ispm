import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  KeyRound,
  UserPlus,
  HelpCircle,
  Send,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState<string>('admin@securehemas.local');
  const [password, setPassword] = useState<string>('Password123!');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<{
    isUnverified?: boolean;
    isPending?: boolean;
    isRejected?: boolean;
    isLocked?: boolean;
  }>({});
  const [resendStatus, setResendStatus] = useState<string>('');
  const [isResending, setIsResending] = useState<boolean>(false);

  const searchParams = new URLSearchParams(location.search);
  const isExpired = searchParams.get('expired') === 'true';
  const resetSuccess = searchParams.get('reset') === 'success';

  const demoAccounts = [
    {
      role: 'Hospital Admin',
      email: 'admin@securehemas.local',
      position: 'CMIO & Compliance Lead',
      color: 'border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-900',
    },
    {
      role: 'IT Security Admin',
      email: 'security@securehemas.local',
      position: 'Cybersecurity Officer',
      color: 'border-purple-200 bg-purple-50/70 hover:bg-purple-100/70 text-purple-900',
    },
    {
      role: 'Department Head',
      email: 'head@securehemas.local',
      position: 'Head of Emergency & Trauma',
      color: 'border-teal-200 bg-teal-50/70 hover:bg-teal-100/70 text-teal-900',
    },
    {
      role: 'Hospital Staff',
      email: 'staff@securehemas.local',
      position: 'Senior Nursing Officer',
      color: 'border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-900',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setErrorDetails({});
    setResendStatus('');

    try {
      const res = await login(email, password);
      setIsLoading(false);

      if (res.success) {
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        setErrorMessage(res.message || 'Login failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setIsLoading(false);
      const data = err.response?.data;
      const msg = data?.message || 'Login failed. Please verify your credentials.';
      setErrorMessage(msg);
      setErrorDetails({
        isUnverified: data?.isUnverified,
        isPending: data?.isPending,
        isRejected: data?.isRejected,
        isLocked: data?.isLocked,
      });
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    setIsResending(true);
    setResendStatus('');
    try {
      const res = await authService.resendVerification(email);
      setResendStatus(res.data.message || 'A new verification link has been sent to your email.');
    } catch (err: any) {
      setResendStatus(err.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSelectDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setErrorMessage('');
    setErrorDetails({});
    setResendStatus('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-hemas-navy to-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-xl shadow-brand-500/25 mb-4 ring-4 ring-white/10">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Secure<span className="text-brand-400">Hemas</span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-300 font-medium">
          Information Security Policy Awareness & Compliance Portal
        </p>
        <p className="text-[11px] text-brand-300/80 font-mono mt-0.5">
          Hemas Hospitals PLC • Clinical Cybersecurity
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white/95 backdrop-blur-md py-7 px-6 shadow-2xl rounded-3xl sm:px-9 border border-white/20">
          {/* Notifications / Alerts */}
          {resetSuccess && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Your password has been reset successfully. Please sign in with your new password.</span>
            </div>
          )}

          {isExpired && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Your session expired due to inactivity. Please log in again.</span>
            </div>
          )}

          {errorMessage && (
            <div className={`mb-4 p-4 rounded-2xl border text-xs flex flex-col gap-2 ${
              errorDetails.isPending
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : errorDetails.isUnverified
                ? 'bg-blue-50 border-blue-300 text-blue-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{errorMessage}</span>
              </div>

              {/* Resend verification action if unverified */}
              {errorDetails.isUnverified && (
                <div className="pt-2 border-t border-blue-200/80 flex items-center justify-between">
                  <span className="text-[11px] text-blue-700">Didn't receive email?</span>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="text-[11px] font-bold text-brand-700 hover:text-brand-900 underline flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>{isResending ? 'Sending...' : 'Resend Verification Link'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {resendStatus && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{resendStatus}</span>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hospital Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@securehemas.local"
                  className="block w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-lg shadow-brand-600/25 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Sign In to SecureHemas</span>
                </>
              )}
            </button>
          </form>

          {/* Link to Staff Registration */}
          <div className="mt-5 text-center p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <p className="text-xs text-slate-600">
              New Hospital Employee?{' '}
              <Link
                to="/register"
                className="font-bold text-brand-600 hover:text-brand-800 hover:underline inline-flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5 inline" />
                <span>Register as Staff</span> →
              </Link>
            </p>
          </div>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center mb-2.5">
              ⚡ University Evaluation Accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleSelectDemo(account.email)}
                  className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between ${account.color} ${
                    email === account.email ? 'ring-2 ring-brand-500 shadow-sm font-bold' : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold">{account.role}</span>
                    {email === account.email && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-600 truncate mt-0.5">
                    {account.position}
                  </p>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Default password: <code className="text-slate-600 bg-slate-100 px-1 py-0.5 rounded font-mono">Password123!</code>
            </p>
          </div>
        </div>

        {/* Security Notice Footer */}
        <div className="mt-5 text-center text-xs text-slate-400">
          <p className="flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Protected by JWT RBAC • Email Verification • Admin Approval</span>
          </p>
        </div>
      </div>
    </div>
  );
};
