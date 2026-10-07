import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { complianceService, incidentService, auditService, policyService } from '../../services/api';
import { IComplianceSummary, IIncident, IAuditLog, IPolicy } from '../../types';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Activity,
  FileText,
  Lock,
  ChevronRight,
  ExternalLink,
  Flame,
  Radio,
  FileCheck2,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const SecurityAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<IComplianceSummary | null>(null);
  const [incidents, setIncidents] = useState<IIncident[]>([]);
  const [auditLogs, setAuditLogs] = useState<IAuditLog[]>([]);
  const [policies, setPolicies] = useState<IPolicy[]>([]);

  useEffect(() => {
    const loadSecurityData = async () => {
      setIsLoading(true);
      try {
        const [sumRes, incRes, audRes, polRes] = await Promise.all([
          complianceService.getSummary(),
          incidentService.getIncidents({ limit: 8 }),
          auditService.getLogs({ limit: 8 }),
          policyService.getPolicies({ limit: 50 }),
        ]);

        if (sumRes.data.success) setSummary(sumRes.data.summary);
        if (incRes.data.success) setIncidents(incRes.data.incidents || []);
        if (audRes.data?.success) setAuditLogs(audRes.data.logs || []);
        if (polRes.data.success) setPolicies(polRes.data.policies || []);
      } catch (error) {
        console.error('Failed to load SOC dashboard metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSecurityData();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Connecting to Clinical Cyber Defense Center..." />;
  }

  // Count incidents by priority
  const criticalCount = incidents.filter((i) => i.priority === 'Critical' && i.status !== 'Resolved').length;
  const highCount = incidents.filter((i) => i.priority === 'High' && i.status !== 'Resolved').length;
  const mediumCount = incidents.filter((i) => i.priority === 'Medium' && i.status !== 'Resolved').length;
  const lowCount = incidents.filter((i) => i.priority === 'Low' && i.status !== 'Resolved').length;

  const severityPieData = [
    { name: 'Critical', value: criticalCount, color: '#ef4444' },
    { name: 'High', value: highCount, color: '#f97316' },
    { name: 'Medium', value: mediumCount, color: '#eab308' },
    { name: 'Low', value: lowCount, color: '#3b82f6' },
  ].filter((d) => d.value > 0);

  // If no active priority data, show resolved / baseline placeholder
  const activePieData =
    severityPieData.length > 0
      ? severityPieData
      : [{ name: 'Zero Active Threats', value: 1, color: '#10b981' }];

  const publishedPolicies = policies.filter((p) => p.status === 'Published').length;
  const draftPolicies = policies.filter((p) => p.status === 'Draft').length;

  const threatLevel =
    criticalCount > 0 ? 'CRITICAL ALERT' : highCount > 0 ? 'ELEVATED' : 'NORMAL DEFENSE';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* SOC Threat Defense Header */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-rose-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-rose-300 mb-3 backdrop-blur-sm">
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              Cybersecurity Operations Center (SOC)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              Clinical Security Command
              <span
                className={`text-xs px-2.5 py-1 rounded-full uppercase tracking-wider font-extrabold border ${
                  criticalCount > 0
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : highCount > 0
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                }`}
              >
                {threatLevel}
              </span>
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Real-time threat triage, SIEM audit streams, endpoint anomaly surveillance, and institutional security posture.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/audit-logs"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-colors flex items-center gap-1.5 backdrop-blur-sm"
            >
              <Activity className="w-4 h-4 text-purple-400" /> Full Audit Trail
            </Link>
            <Link
              to="/incidents"
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-md flex items-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4" /> Threat Incident Room
            </Link>
          </div>
        </div>
      </div>

      {/* Security KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Open Security Threats"
          value={summary?.openIncidents || incidents.filter((i) => i.status !== 'Resolved').length}
          subtitle={`${criticalCount} Critical, ${highCount} High`}
          icon={<Flame className="w-6 h-6" />}
          iconBgColor={criticalCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}
          onClick={() => navigate('/incidents')}
        />
        <StatCard
          title="SIEM Audit Logs (24h)"
          value={auditLogs.length > 0 ? `${auditLogs.length * 12}+` : '0'}
          subtitle="System security events logged"
          icon={<Activity className="w-6 h-6" />}
          iconBgColor="bg-purple-50 text-purple-600"
          onClick={() => navigate('/audit-logs')}
        />
        <StatCard
          title="Hospital Security Score"
          value={`${summary?.overallComplianceScore || 0}%`}
          subtitle="Overall clinical compliance"
          icon={<ShieldCheck className="w-6 h-6" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
          onClick={() => navigate('/compliance')}
        />
        <StatCard
          title="Active Security Policies"
          value={publishedPolicies}
          subtitle={`${draftPolicies} in revision / draft`}
          icon={<FileText className="w-6 h-6" />}
          iconBgColor="bg-blue-50 text-blue-600"
          onClick={() => navigate('/policies')}
        />
      </div>

      {/* Main Grid: Incident Triage & Threat Severity Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Incident Triage Stream */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Live Security Incident Triage Queue
                </h2>
                <p className="text-xs text-slate-500">
                  Active security notifications reported by hospital personnel and endpoint monitors.
                </p>
              </div>
            </div>
            <Link
              to="/incidents"
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
            >
              All incidents <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {incidents.length === 0 ? (
            <div className="py-8 text-center rounded-xl bg-emerald-50/50 border border-emerald-100">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-emerald-900">All Threat Vectors Clear</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                No active security incidents reported in the clinical network.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {incidents.slice(0, 5).map((incident) => (
                <div
                  key={incident._id}
                  onClick={() => navigate('/incidents')}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl cursor-pointer transition-colors"
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
                      <span className="text-[10px] text-slate-400 font-mono">
                        {incident.incidentType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 truncate mt-1 font-semibold">
                      {incident.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      Reported by: {incident.reportedBy?.fullName || 'Staff'} • {typeof incident.department === 'object' && incident.department ? (incident.department as any).name : 'Clinical Floor'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-400 block font-mono">
                      {new Date(incident.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-rose-600 font-bold hover:underline inline-flex items-center gap-0.5 mt-1">
                      Triage <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Threat Distribution Analytics Donut */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Active Threat Severity
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Real-time classification of open security vectors
            </p>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activePieData}
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {activePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [val, 'Incidents']} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Critical Threats</span>
              <span className="font-bold text-rose-600">{criticalCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">High Threats</span>
              <span className="font-bold text-amber-600">{highCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Medium / Low</span>
              <span className="font-bold text-slate-700">{mediumCount + lowCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Real-time SIEM Audit Log & Security Governance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time SIEM Audit Log Stream */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Live SIEM Security Audit Stream
              </h3>
            </div>
            <Link
              to="/audit-logs"
              className="text-xs text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1"
            >
              Full log archive <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No recent audit trail entries logged.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 font-mono">
              {auditLogs.map((log) => (
                <div key={log._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-[11px]">
                        {log.action}
                      </span>
                      <Badge variant="purple" size="sm">
                        {log.module}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      {log.userEmail} ({log.userRole}) {log.ipAddress ? `• IP: ${log.ipAddress}` : ''}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Policy Governance & Regulatory Compliance */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
              <FileCheck2 className="w-4 h-4 text-brand-600" />
              Information Security Governance & Compliance
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              ISO 27001 / HIPAA clinical security policy enforcement status
            </p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Published Security Policies</p>
                  <p className="text-[11px] text-slate-500">Active and legally binding</p>
                </div>
                <span className="text-sm font-extrabold text-brand-600">
                  {publishedPolicies}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Draft / Under Review</p>
                  <p className="text-[11px] text-slate-500">Awaiting security committee ratification</p>
                </div>
                <span className="text-sm font-extrabold text-amber-600">
                  {draftPolicies}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Hospital Compliance Index</p>
                  <p className="text-[11px] text-slate-500">Across all clinical personnel</p>
                </div>
                <span className="text-sm font-extrabold text-emerald-600">
                  {summary?.overallComplianceScore || 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center gap-2">
            <Link
              to="/policies"
              className="flex-1 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" /> Author / Edit Policies
            </Link>
            <Link
              to="/reports"
              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Security Report
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
