import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { complianceService, userService, departmentService } from '../../services/api';
import { IComplianceSummary, IDepartmentCompliance, IUser } from '../../types';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import {
  Users,
  Building2,
  UserCheck,
  UserX,
  ShieldCheck,
  AlertCircle,
  FileCheck2,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle2,
  Plus,
  ExternalLink,
  ShieldAlert,
  FileSpreadsheet,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<IComplianceSummary | null>(null);
  const [departments, setDepartments] = useState<IDepartmentCompliance[]>([]);
  const [pendingUsers, setPendingUsers] = useState<IUser[]>([]);
  const [allUsers, setAllUsers] = useState<IUser[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadAdminData = async () => {
    try {
      const [sumRes, deptRes, pendingRes, usersRes] = await Promise.all([
        complianceService.getSummary(),
        complianceService.getDepartmentCompliance(),
        userService.getPendingRegistrations(),
        userService.getUsers({ limit: 50 }),
      ]);

      if (sumRes.data.success) setSummary(sumRes.data.summary);
      if (deptRes.data.success) setDepartments(deptRes.data.departments || []);
      if (pendingRes.data.success) setPendingUsers(pendingRes.data.users || []);
      if (usersRes.data.success) setAllUsers(usersRes.data.users || []);
    } catch (error) {
      console.error('Failed to load admin operations metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoadingId(id);
    setActionMessage(null);
    try {
      const res = await userService.approveRegistration(id);
      if (res.data.success) {
        setPendingUsers((prev) => prev.filter((u) => u._id !== id));
        setActionMessage('Staff registration approved successfully.');
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (error: any) {
      console.error('Failed to approve registration:', error);
      alert(error.response?.data?.message || 'Failed to approve registration.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to reject this staff registration?')) return;
    setActionLoadingId(id);
    setActionMessage(null);
    try {
      const res = await userService.rejectRegistration(id, { reason: 'Application rejected by Hospital Admin.' });
      if (res.data.success) {
        setPendingUsers((prev) => prev.filter((u) => u._id !== id));
        setActionMessage('Registration rejected.');
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (error: any) {
      console.error('Failed to reject registration:', error);
      alert(error.response?.data?.message || 'Failed to reject registration.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Aggregating hospital workforce and system metrics..." />;
  }

  // Department chart comparison data
  const departmentChartData = departments.slice(0, 6).map((dept) => ({
    name: dept.name.length > 14 ? dept.name.substring(0, 12) + '...' : dept.name,
    Compliance: dept.overallCompliance,
    PolicyAck: dept.policyAckRate,
    Training: dept.trainingCompletionRate,
  }));

  const lockedUsers = allUsers.filter(
    (u) => u.lockUntil && new Date(u.lockUntil).getTime() > Date.now()
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-hemas-navy to-brand-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-brand-300 mb-3 backdrop-blur-sm">
              <Users className="w-3.5 h-3.5 text-brand-400" />
              Hospital Administration & Operations
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Workforce & Operations Center
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Oversee staff onboarding, clinical department performance, user access credentials, and institutional compliance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/admin/registrations"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-colors flex items-center gap-1.5 backdrop-blur-sm relative"
            >
              <UserCheck className="w-4 h-4" /> Review Registrations
              {pendingUsers.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 absolute -top-1 -right-1 animate-ping" />
              )}
            </Link>
            <Link
              to="/users"
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors shadow-md flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" /> Manage Staff Directory
            </Link>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {actionMessage}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Hospital Workforce"
          value={summary?.totalStaff || allUsers.length}
          subtitle="Registered staff members"
          icon={<Users className="w-6 h-6" />}
          iconBgColor="bg-blue-50 text-blue-600"
          onClick={() => navigate('/users')}
        />
        <StatCard
          title="Pending Registrations"
          value={pendingUsers.length}
          subtitle={pendingUsers.length > 0 ? 'Awaiting identity verification' : 'All accounts verified'}
          icon={<UserCheck className="w-6 h-6" />}
          iconBgColor={pendingUsers.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}
          onClick={() => navigate('/admin/registrations')}
        />
        <StatCard
          title="Clinical Departments"
          value={departments.length}
          subtitle="Operational hospital units"
          icon={<Building2 className="w-6 h-6" />}
          iconBgColor="bg-purple-50 text-purple-600"
          onClick={() => navigate('/departments')}
        />
        <StatCard
          title="Overall Compliance"
          value={`${summary?.overallComplianceScore || 0}%`}
          subtitle="Hospital target: 85%"
          icon={<ShieldCheck className="w-6 h-6" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
          onClick={() => navigate('/compliance')}
        />
      </div>

      {/* Pending Staff Registrations Quick Approval Queue */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Staff Registrations Awaiting Approval
              </h2>
              <p className="text-xs text-slate-500">
                Newly registered hospital personnel needing identity clearance before clinical access.
              </p>
            </div>
          </div>
          <Link
            to="/admin/registrations"
            className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1"
          >
            Full review queue ({pendingUsers.length}) <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="py-8 text-center rounded-xl bg-emerald-50/50 border border-emerald-100">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-emerald-900">
              No Pending Registrations
            </p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              All staff accounts have been reviewed and approved.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingUsers.slice(0, 5).map((staff) => (
              <div
                key={staff._id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900">{staff.fullName}</p>
                    <Badge variant="warning" size="sm">
                      {staff.position}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Employee ID: <span className="font-mono text-slate-700 font-semibold">{staff.employeeId}</span> •{' '}
                    {staff.email} • {typeof staff.department === 'object' && staff.department ? (staff.department as any).name : 'Department Pending'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => handleApprove(staff._id, e)}
                    disabled={actionLoadingId === staff._id}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1 shadow-sm"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={(e) => handleReject(staff._id, e)}
                    disabled={actionLoadingId === staff._id}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <UserX className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two Columns: Department Compliance Comparison Chart & Account Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Compliance Comparison Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Department Performance Leaderboard
              </h3>
              <p className="text-xs text-slate-500">
                Institutional compliance and policy acknowledgment rates by clinical department
              </p>
            </div>
            <Link
              to="/departments"
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1"
            >
              All departments <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, '']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Compliance" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Overall Compliance %" />
                <Bar dataKey="PolicyAck" fill="#10b981" radius={[4, 4, 0, 0]} name="Policy Ack %" />
                <Bar dataKey="Training" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Training Complete %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Account Health & Operations Shortcuts */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Workforce Account Health
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Real-time user activation and security states
            </p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Active Staff Accounts</p>
                  <p className="text-[11px] text-slate-500">Authorized clinical personnel</p>
                </div>
                <span className="text-sm font-extrabold text-emerald-600">
                  {allUsers.filter((u) => u.isActive).length}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Locked / Flagged Accounts</p>
                  <p className="text-[11px] text-slate-500">Failed authentication limit reached</p>
                </div>
                <span className={`text-sm font-extrabold ${lockedUsers.length > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                  {lockedUsers.length}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Pending Verification</p>
                  <p className="text-[11px] text-slate-500">Staff registration queue</p>
                </div>
                <span className="text-sm font-extrabold text-amber-600">
                  {pendingUsers.length}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
            <Link
              to="/users"
              className="w-full py-2 px-3 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" /> Full Staff Management
            </Link>
            <Link
              to="/departments"
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5" /> Manage Hospital Departments
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
