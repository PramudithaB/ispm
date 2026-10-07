import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Mail,
  Send,
  UserCheck,
} from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [resendEmail, setResendEmail] = useState<string>('');
  const [resendMessage, setResendMessage] = useState<string>('');
  const [isResending, setIsResending] = useState<boolean>(false);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setIsLoading(false);
        setErrorMessage('No email verification token was found in the link.');
        return;
      }

      try {
        const res = await authService.verifyEmail(token);
        setIsLoading(false);
        if (res.data.success) {
          setIsSuccess(true);
        } else {
          setErrorMessage(res.data.message || 'Email verification failed.');
        }
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(
          err.response?.data?.message ||
            'Invalid or expired verification link. Please request a new verification email.'
        );
      }
    };

    verify();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;
    setIsResending(true);
    setResendMessage('');
    try {
      const res = await authService.resendVerification(resendEmail);
      setResendMessage(
        res.data.message || 'If an unverified account exists, a new verification email has been sent.'
      );
    } catch (err: any) {
      setResendMessage(err.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-hemas-navy to-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-xl shadow-brand-500/25 mb-3 ring-4 ring-white/10">
          <Shield className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Email Verification
        </h1>
        <p className="mt-1 text-xs text-slate-300 font-medium">
          Hemas Hospitals Information Security Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-3xl sm:px-9 border border-white/20 text-center">
          {isLoading ? (
            <div className="py-8 space-y-4">
              <div className="w-12 h-12 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-700">
                Verifying your hospital email address...
              </p>
              <p className="text-[11px] text-slate-400">
                Securing cryptographic tokens with MySQL database
              </p>
            </div>
          ) : isSuccess ? (
            <div className="space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Email Verified Successfully!
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Your hospital email address has been confirmed.
                </p>
              </div>

              {/* Status explanation */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-left space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Pending Administrator Review</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Your account is waiting for administrator approval. Once the IT Security Admin confirms your employee details, your account will be activated and you can sign in.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition-all"
                >
                  <span>Go to Login Page</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/20">
                <AlertTriangle className="w-9 h-9" />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {errorMessage.includes('already verified')
                    ? 'Account Already Verified'
                    : 'Verification Link Expired or Invalid'}
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                  {errorMessage}
                </p>
              </div>

              {/* Resend Verification Form */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Request New Verification Link
                </p>

                {resendMessage && (
                  <p className="text-xs text-brand-700 font-medium bg-brand-50 p-2 rounded-lg border border-brand-200">
                    {resendMessage}
                  </p>
                )}

                <form onSubmit={handleResend} className="space-y-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered hospital email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isResending}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isResending ? 'Sending...' : 'Resend Verification Email'}</span>
                  </button>
                </form>
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline"
                >
                  ← Return to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
