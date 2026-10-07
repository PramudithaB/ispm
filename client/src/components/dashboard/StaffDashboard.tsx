import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { complianceService, incidentService } from '../../services/api';
import { IIncident } from '../../types';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import {
  ShieldCheck,
  FileText,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  FileCheck2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [myCompliance, setMyCompliance] = useState<any>(null);
  const [myIncidents, setMyIncidents] = useState<IIncident[]>([]);

  useEffect(() => {
    const loadStaffData = async () => {
      setIsLoading(true);
      try {
        const [compRes, incRes] = await Promise.all([
          complianceService.getMyCompliance(),
          incidentService.getIncidents({ limit: 4 }),
        ]);

        if (compRes.data.success) {
          setMyCompliance(compRes.data.myCompliance);
        }
        if (incRes.data.success) {
          setMyIncidents(incRes.data.incidents || []);
        }
      } catch (error) {
        console.error('Failed to load staff dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStaffData();
  }, [user]);

  if (isLoading) {
    return <LoadingSpinner message="Loading your personal compliance records..." />;
  }

  const overallScore = myCompliance?.overallScore || 0;
  const pendingPolicies = myCompliance?.pendingPolicies || [];
  const pendingTrainings = myCompliance?.pendingTrainings || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Personalized Welcome Banner */}
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
              {user?.position} • {typeof user?.department === 'object' ? user?.department?.name : 'Clinical Staff'} • {user?.site} • Employee ID:{' '}
              <span className="font-mono text-white font-semibold">{user?.employeeId}</span>
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

      {/* Quick Action Shortcuts */}
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
};
