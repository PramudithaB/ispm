import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/api';
import {
  Shield,
  Mail,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Send,
  HelpCircle,
} from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await authService.forgotPassword(email.toLowerCase().trim());
      setIsLoading(false);
      setIsSubmitted(true);
      setMessage(
        res.data.message ||
          'If an account with that email exists, a password reset link has been sent.'
      );
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(
        err.response?.data?.message || 'Failed to process password reset request.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-hemas-navy to-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-xl shadow-brand-500/25 mb-3 ring-4 ring-white/10">
          <KeyRound className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Forgot Password
        </h1>
        <p className="mt-1 text-xs text-slate-300 font-medium">
          Hemas Hospitals Healthcare Cybersecurity Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-3xl sm:px-9 border border-white/20">
          {isSubmitted ? (
            <div className="text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Password Reset Email Sent
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  {message}
                </p>
                <p className="text-xs font-bold text-brand-700 bg-brand-50 py-1.5 px-3 rounded-xl border border-brand-200 inline-block mt-3 font-mono">
                  {email}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Security Notes:</p>
                <p>• The reset link is single-use and will expire in 1 hour.</p>
                <p>• Check your spam or junk folder if you do not see the email.</p>
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your registered hospital email address below. We'll send you a secure link to reset your account password.
              </p>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}

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
                    required
                    placeholder="name@securehemas.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-lg shadow-brand-600/25 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Password Reset Link</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs font-bold text-slate-600 hover:text-brand-600 inline-flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
