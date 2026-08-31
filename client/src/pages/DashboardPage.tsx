import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { complianceService, policyService, trainingService, incidentService, auditService } from '../services/api';
import { IComplianceSummary, IDepartmentCompliance, IPolicy, ITrainingModule, IIncident, IAuditLog } from '../types';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  ShieldCheck,
  FileText,
  GraduationCap,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Activity,
  AlertCircle,
  ExternalLink,
  ChevronRight,
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user, isStaff, isAdminOrSecurity, isDeptHead } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<IComplianceSummary | null>(null);
  const [departments, setDepartments] = useState<IDepartmentCompliance[]>([]);
  const [myCompliance, setMyCompliance] = useState<any>(null);
  const [recentIncidents, setRecentIncidents] = useState<IIncident[]>([]);
  const [recentAudits, setRecentAudits] = useState<IAuditLog[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        if (isStaff) {
          const res = await complianceService.getMyCompliance();
          if (res.data.success) {
            setMyCompliance(res.data.myCompliance);
          }
        } else {
          const [sumRes, deptRes, incRes, audRes] = await Promise.all([
            complianceService.getSummary(),
            complianceService.getDepartmentCompliance(),
            incidentService.getIncidents({ limit: 5 }),
            isAdminOrSecurity ? auditService.getLogs({ limit: 5 }) : Promise.resolve({ data: { logs: [] } }),
          ]);

          if (sumRes.data.success) setSummary(sumRes.data.summary);
          if (deptRes.data.success) setDepartments(deptRes.data.departments);
          if (incRes.data.success) setRecentIncidents(incRes.data.incidents);
          if (audRes.data?.success) setRecentAudits(audRes.data.logs);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user, isStaff, isAdminOrSecurity]);

  if (isLoading) {
    return <LoadingSpinner message="Aggregating clinical compliance metrics..." />;
  }

  // ==========================================
  // STAFF DASHBOARD (MOBILE-FIRST)
  // ==========================================
  if (isStaff) {
    const overallScore = myCompliance?.overallScore || 0;
    const pendingPolicies = myCompliance?.pendingPolicies || [];
    const pendingTrainings = myCompliance?.pendingTrainings || [];

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Welcome Section */}
        <div className="rounded-3xl bg-gradient-to-r from-hemas-navy via-slate-900 to-brand-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-brand-300 mb-3 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Staff Compliance Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {user?.fullName}
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-xl">
                {user?.position} • {user?.site} • Employee ID: <span className="font-mono text-white font-semibold">{user?.employeeId}</span>
              </p>
            </div>

            {/* Circular Gauge */}
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/20"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={
                      overallScore >= 80
                        ? 'text-emerald-400'
                        : overallScore >= 50
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }
                    strokeDasharray={`${overallScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-sm font-bold">{overallScore}%</span>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-300">My Compliance</p>
                <p className="text-sm font-bold text-white">
                  {overallScore >= 80 ? 'Fully Compliant' : 'Action Required'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Policy Acknowledgement"
            value={`${myCompliance?.acknowledgedCount || 0} / ${myCompliance?.totalPolicies || 0}`}
            subtitle={`${myCompliance?.policyRate || 0}% acknowledged`}
            icon={<FileCheck2 className="w-6 h-6" />}
            iconBgColor="bg-blue-50 text-blue-600"
            onClick={() => navigate('/policies')}
          />
          <StatCard
            title="Training Completed"
            value={`${myCompliance?.completedTrainingsCount || 0} / ${myCompliance?.totalTrainings || 0}`}
            subtitle={`${myCompliance?.trainingRate || 0}% completion rate`}
            icon={<GraduationCap className="w-6 h-6" />}
            iconBgColor="bg-emerald-50 text-emerald-600"
            onClick={() => navigate('/training')}
          />
          <StatCard
            title="Pending Actions"
            value={pendingPolicies.length + pendingTrainings.length}
            subtitle={`${pendingPolicies.length} policies, ${pendingTrainings.length} modules`}
            icon={<AlertCircle className="w-6 h-6" />}
            iconBgColor="bg-amber-50 text-amber-600"
          />
          <StatCard
            title="Security Score"
            value={`${overallScore}/100`}
            subtitle="Hemas Hospital Benchmark: 80"
            icon={<ShieldCheck className="w-6 h-6" />}
            iconBgColor="bg-purple-50 text-purple-600"
            onClick={() => navigate('/compliance')}
          />
        </div>

        {/* Quick Action Shortcuts (Mobile-friendly buttons) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/policies"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-brand-400 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">Read Policies</p>
                <p className="text-[11px] text-slate-500">Review & acknowledge</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/training"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">Security Training</p>
                <p className="text-[11px] text-slate-500">Take awareness quizzes</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/incidents"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-rose-400 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">Report Incident</p>
                <p className="text-[11px] text-slate-500">Phishing, lost device, etc.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

        {/* Two-Column: Pending Policies & Pending Training */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Policies */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Policies Requiring Acknowledgement
                </h2>
              </div>
              <Link
                to="/policies"
                className="text-xs text-brand-600 hover:text-brand-800 font-semibold"
              >
                View all ({myCompliance?.totalPolicies || 0})
              </Link>
            </div>

            {pendingPolicies.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-emerald-50/50 border border-emerald-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-emerald-900">
                  All Policies Acknowledged!
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  You are up to date with all hospital security guidelines.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPolicies.map((policy: any) => (
                  <div
                    key={policy._id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-brand-300 transition-colors flex items-center justify-between gap-3 bg-slate-50/50"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {policy.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="neutral" size="sm">
                          v{policy.version}
                        </Badge>
                        <span className="text-[11px] text-slate-500 truncate">
                          {policy.category}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/policies/${policy._id}`}
                      className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shrink-0 transition-colors shadow-sm"
                    >
                      Acknowledge
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Training Modules */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Assigned Security Training Modules
                </h2>
              </div>
              <Link
                to="/training"
                className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold"
              >
                View all ({myCompliance?.totalTrainings || 0})
              </Link>
            </div>

            {pendingTrainings.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-emerald-50/50 border border-emerald-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-emerald-900">
                  All Training Modules Completed!
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Great job maintaining hospital information security awareness.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTrainings.map((module: any) => (
                  <div
                    key={module._id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors flex items-center justify-between gap-3 bg-slate-50/50"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {module.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={module.status === 'Overdue' ? 'danger' : 'warning'}
                          size="sm"
                        >
                          {module.status}
                        </Badge>
                        <span className="text-[11px] text-slate-500">
                          {module.durationMinutes} mins
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/training/${module._id}`}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0 transition-colors shadow-sm"
                    >
                      {module.status === 'In Progress' ? 'Continue' : 'Start'}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ADMIN / IT SECURITY POWER DASHBOARD
  // ==========================================
  const departmentChartData = departments.map((dept) => ({
    name: dept.name.split('&')[0].trim(), // Short name for bar chart
    Compliance: dept.overallCompliance,
    PolicyAck: dept.policyAckRate,
    Training: dept.trainingCompletionRate,
    Staff: dept.staffCount,
  }));

  const pieData = [
    { name: 'Acknowledged', value: summary?.totalAcks || 0, color: '#0ea5e9' },
    {
      name: 'Pending Acks',
      value: Math.max(
        0,
        (summary?.totalStaff || 0) * (summary?.publishedPoliciesCount || 0) -
          (summary?.totalAcks || 0)
      ),
      color: '#e2e8f0',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Executive Compliance & Security Dashboard
            </h1>
            <Badge variant="purple" size="sm">
              Live MongoDB Analytics
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time compliance monitoring, policy governance, and threat triage for Hemas Hospitals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/reports"
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Activity className="w-4 h-4 text-slate-500" /> Export Reports
          </Link>
          <Link
            to="/policies"
            className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" /> Manage Policies
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Hospital Compliance Rate"
          value={`${summary?.overallComplianceScore || 0}%`}
          subtitle="Target threshold: 85%"
          icon={<ShieldCheck className="w-6 h-6" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
          trend={{ value: '3.4%', isPositive: true }}
          onClick={() => navigate('/compliance')}
        />
        <StatCard
          title="Policy Acknowledgement"
          value={`${summary?.policyAckRate || 0}%`}
          subtitle={`${summary?.totalAcks || 0} acknowledgements on record`}
          icon={<FileCheck2 className="w-6 h-6" />}
          iconBgColor="bg-blue-50 text-blue-600"
          onClick={() => navigate('/policies')}
        />
        <StatCard
          title="Training Completion Rate"
          value={`${summary?.trainingCompletionRate || 0}%`}
          subtitle={`${summary?.completedProgresses || 0} modules completed`}
          icon={<GraduationCap className="w-6 h-6" />}
          iconBgColor="bg-purple-50 text-purple-600"
          onClick={() => navigate('/training')}
        />
        <StatCard
          title="Open Security Incidents"
          value={summary?.openIncidents || 0}
          subtitle={summary?.openIncidents ? 'Requires security triage' : 'All incidents resolved'}
          icon={<AlertTriangle className="w-6 h-6" />}
          iconBgColor={summary?.openIncidents ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}
          onClick={() => navigate('/incidents')}
        />
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Compliance Comparison Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Department Compliance Comparison
              </h3>
              <p className="text-xs text-slate-500">
                Policy acknowledgement & training completion rates by clinical unit
              </p>
            </div>
            <Link
              to="/compliance"
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1"
            >
              Full matrix <ChevronRight className="w-3.5 h-3.5" />
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

        {/* Policy vs Training Metrics Donut */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              System Breakdown
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Active hospital assets & security metrics
            </p>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [val, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Active Hospital Personnel</span>
              <span className="font-bold text-slate-900">{summary?.totalStaff || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Published Security Policies</span>
              <span className="font-bold text-slate-900">{summary?.publishedPoliciesCount || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Awareness Training Modules</span>
              <span className="font-bold text-slate-900">{summary?.publishedTrainingsCount || 0}</span>
            </div>
            <div className="flex items-center justify-between text-amber-700 bg-amber-50 p-2 rounded-lg font-medium">
              <span>Overdue Training Modules</span>
              <span className="font-bold">{summary?.overdueTrainings || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Incidents & Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Incidents Requiring Attention */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Recent Security Incidents
              </h3>
            </div>
            <Link
              to="/incidents"
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1"
            >
              All incidents <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentIncidents.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No security incidents currently reported.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentIncidents.map((incident) => (
                <div
                  key={incident._id}
                  onClick={() => navigate('/incidents')}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {incident.incidentNumber}
                      </span>
                      <Badge
                        variant={
                          incident.priority === 'Critical'
                            ? 'danger'
                            : incident.priority === 'High'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {incident.priority}
                      </Badge>
                      <Badge
                        variant={
                          incident.status === 'Resolved'
                            ? 'success'
                            : incident.status === 'In Review'
                            ? 'info'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {incident.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-700 truncate mt-0.5 font-medium">
                      {incident.title}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(incident.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Audit Trail Log Entries */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Audit Trail & Access Log
              </h3>
            </div>
            {isAdminOrSecurity && (
              <Link
                to="/audit-logs"
                className="text-xs text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1"
              >
                Inspect logs <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {recentAudits.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No recent audit records found.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentAudits.map((audit) => (
                <div key={audit._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 font-mono text-[11px]">
                        {audit.action}
                      </span>
                      <Badge variant="neutral" size="sm">
                        {audit.module}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {audit.userEmail} ({audit.userRole})
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {new Date(audit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
