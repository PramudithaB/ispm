import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService, departmentService } from '../services/api';
import { IDepartment } from '../types';
import {
  Shield,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Briefcase,
  MapPin,
  IdCard,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
  Send,
  UserCheck,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [site, setSite] = useState<string>('Hemas Hospital Wattala');
  const [position, setPosition] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>('');

  const sites = [
    'Hemas Hospital Wattala',
    'Hemas Hospital Thalawathugoda',
    'Hemas Laboratory Network - Colombo',
    'Hemas Medical Diagnostics Center',
  ];

  const commonPositions = [
    'Senior Nursing Officer',
    'Staff Nurse / Ward Nurse',
    'Emergency Triage Nurse',
    'Resident Medical Officer (RMO)',
    'Medical Officer / Registrar',
    'Radiographer / PACS Operator',
    'Clinical Pharmacist / Dispenser',
    'Laboratory Technologist (MLT)',
    'Billing & Patient Admissions Officer',
    'Health Informatics & Records Assistant',
  ];

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await departmentService.getPublicDepartments();
        if (res.data.success) {
          setDepartments(res.data.departments);
          if (res.data.departments.length > 0) {
            setDepartment(res.data.departments[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.register({
        fullName: fullName.trim(),
        employeeId: employeeId.trim(),
        email: email.toLowerCase().trim(),
        password,
        confirmPassword,
        department,
        site,
        position: position.trim() || 'Clinical Staff',
      });

      setIsLoading(false);

      if (res.data.success) {
        setIsSuccess(true);
        setRegisteredEmail(res.data.email || email);
      } else {
        setErrorMessage(res.data.message || 'Registration failed.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(
        err.response?.data?.message || 'Registration failed. Please check your details.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-hemas-navy to-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-xl shadow-brand-500/25 mb-3 ring-4 ring-white/10">
          <Shield className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Staff Registration
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-300 font-medium">
          Create your SecureHemas clinical employee account
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-950/70 border border-brand-500/30 text-brand-300 text-[11px] font-semibold mt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
          <span>Restricted to Hospital Staff Users Only</span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl z-10">
        <div className="bg-white/95 backdrop-blur-md py-7 px-6 shadow-2xl rounded-3xl sm:px-10 border border-white/20">
          {/* SUCCESS SCREEN */}
          {isSuccess ? (
            <div className="text-center py-4 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Registration Successful!
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 mt-2 max-w-md mx-auto leading-relaxed font-medium">
                  Registration successful. Please check your email and verify your email address. Your account will then be reviewed by an administrator.
                </p>
                <p className="text-sm font-bold text-brand-700 bg-brand-50 py-1.5 px-4 rounded-xl border border-brand-200 inline-block mt-3 font-mono">
                  {registeredEmail}
                </p>
              </div>

              {/* Registration Lifecycle Progress Steps */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-3 max-w-md mx-auto">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                  Account Activation Steps:
                </p>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Email Verification</p>
                    <p className="text-[11px] text-slate-500">
                      Open the email sent to your inbox and click the verification link.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Administrator Approval</p>
                    <p className="text-[11px] text-slate-500">
                      The Hospital IT Security Admin will review and approve your registration.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Account Activated</p>
                    <p className="text-[11px] text-slate-500">
                      You will receive an approval confirmation email and can log in to SecureHemas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition-all"
                >
                  <span>Return to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}

              {/* Full Name & Employee ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Kasun Perera"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Employee ID *
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <IdCard className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HEM-DOC-890"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none uppercase font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Hospital Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Hospital Email Address *
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="name@securehemas.local (or hospital email)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Department & Site */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Department *
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white font-medium"
                    >
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hospital Site *
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <select
                      value={site}
                      onChange={(e) => setSite(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white font-medium"
                    >
                      {sites.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Position / Designation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Clinical Position / Designation *
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    list="positions-list"
                    placeholder="e.g. Senior Nursing Officer, Resident Medical Officer"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <datalist id="positions-list">
                    {commonPositions.map((pos) => (
                      <option key={pos} value={pos} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password *
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-lg shadow-brand-600/25 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Registering Staff Account...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Submit Staff Registration</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Already have an approved account?{' '}
                  <Link
                    to="/login"
                    className="font-bold text-brand-600 hover:text-brand-800 hover:underline"
                  >
                    Sign In here →
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
