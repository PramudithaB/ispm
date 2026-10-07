import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { complianceService, incidentService, departmentService } from '../../services/api';
import { IIncident, IStaffComplianceDrilldown, IDepartmentCompliance } from '../../types';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import {
  Users,
  Building2,
  ShieldCheck,
  GraduationCap,
  FileCheck2,
  AlertTriangle,
  FileSpreadsheet,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const DepartmentHeadDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [departmentData, setDepartmentData] = useState<IDepartmentCompliance | null>(null);
  const [staffMembers, setStaffMembers] = useState<IStaffComplianceDrilldown[]>([]);
  const [departmentIncidents, setDepartmentIncidents] = useState<IIncident[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'needs-attention' | 'compliant'>('all');

  const deptId =
    typeof user?.department === 'object' && user?.department
      ? (user.department as any)._id || (user.department as any).id
      : (user?.department as string);

  const deptName =
    typeof user?.department === 'object' && user?.department
      ? (user.department as any).name
      : 'My Department';

  useEffect(() => {
    const loadDepartmentData = async () => {
      setIsLoading(true);
      try {
        const promises: Promise<any>[] = [
          complianceService.getDepartmentCompliance(),
          incidentService.getIncidents({ limit: 6 }),
        ];

        if (deptId) {
          promises.push(complianceService.getDepartmentStaff(deptId));
        }

        const [deptsRes, incRes, staffRes] = await Promise.all(promises);

        if (deptsRes.data.success && deptsRes.data.departments) {
          const matchedDept = deptsRes.data.departments.find(
            (d: any) => d._id === deptId || d.id === deptId || d.name === deptName
          );
          if (matchedDept) {
            setDepartmentData(matchedDept);
          } else if (deptsRes.data.departments.length > 0) {
            setDepartmentData(deptsRes.data.departments[0]);
          }
        }

        if (incRes.data.success) {
          setDepartmentIncidents(incRes.data.incidents || []);
        }

        if (staffRes && staffRes.data.success) {
          setStaffMembers(staffRes.data.staff || []);
        }
      } catch (error) {
        console.error('Failed to load department dashboard metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDepartmentData();
  }, [deptId, deptName]);

  if (isLoading) {
    return <LoadingSpinner message="Aggregating department clinical compliance analytics..." />;
  }

  // Filtered staff list
  const filteredStaff = staffMembers.filter((staff) => {
    const matchesSearch =
      staff.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.position.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'needs-attention') {
      return staff.overallScore < 80 || staff.overdueCount > 0;
    }
    if (selectedFilter === 'compliant') {
      return staff.overallScore >= 80;
    }
    return true;
  });

  const compliantCount = staffMembers.filter((s) => s.overallScore >= 80).length;
  const overdueCountTotal = staffMembers.reduce((sum, s) => sum + (s.overdueCount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Department Oversight Header */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-hemas-navy to-indigo-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-brand-300 mb-3 backdrop-blur-sm">
              <Building2 className="w-3.5 h-3.5 text-brand-400" />
              Department Head Command Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {deptName} Oversight
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Supervising department-wide policy adherence, staff training milestones, and incident response for {user?.site}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/reports"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-colors flex items-center gap-1.5 backdrop-blur-sm"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Department Report
            </Link>
            <Link
              to="/compliance"
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors shadow-md flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" /> Full Compliance Matrix
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Department Compliance"
          value={`${departmentData?.overallCompliance || 0}%`}
          subtitle="Hospital Target: 85%"
          icon={<ShieldCheck className="w-6 h-6" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
          trend={{ value: `${compliantCount}/${staffMembers.length} Staff`, isPositive: true }}
          onClick={() => navigate('/compliance')}
        />
        <StatCard
          title="Department Staff"
          value={staffMembers.length || departmentData?.staffCount || 0}
          subtitle="Active personnel registered"
          icon={<Users className="w-6 h-6" />}
          iconBgColor="bg-blue-50 text-blue-600"
          onClick={() => navigate('/users')}
        />
        <StatCard
          title="Policy Acknowledged"
          value={`${departmentData?.policyAckRate || 0}%`}
          subtitle="Across active policies"
          icon={<FileCheck2 className="w-6 h-6" />}
          iconBgColor="bg-indigo-50 text-indigo-600"
          onClick={() => navigate('/policies')}
        />
        <StatCard
          title="Overdue Modules"
          value={overdueCountTotal || departmentData?.overdueCount || 0}
          subtitle="Pending staff training deadlines"
          icon={<AlertTriangle className="w-6 h-6" />}
          iconBgColor={overdueCountTotal > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}
          onClick={() => navigate('/training')}
        />
      </div>

      {/* Department Staff Compliance Drilldown Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" />
              Department Team Compliance Tracker
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status of each clinical staff member's policies and cybersecurity training modules.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name or ID..."
                className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-48 sm:w-60 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  selectedFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({staffMembers.length})
              </button>
              <button
                onClick={() => setSelectedFilter('needs-attention')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  selectedFilter === 'needs-attention'
                    ? 'bg-white text-amber-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Attention ({staffMembers.filter((s) => s.overallScore < 80 || s.overdueCount > 0).length})
              </button>
              <button
                onClick={() => setSelectedFilter('compliant')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  selectedFilter === 'compliant'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Compliant ({compliantCount})
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {filteredStaff.length === 0 ? (
          <div className="py-12 text-center rounded-xl bg-slate-50/50 border border-slate-100">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No staff members found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {searchQuery ? 'Try adjusting your search criteria.' : 'No active staff assigned to this department.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4">Policy Ack</th>
                  <th className="py-3 px-4">Training Completion</th>
                  <th className="py-3 px-4">Overdue Tasks</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((staff) => (
                  <tr key={staff._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-slate-900">{staff.fullName}</p>
                        <p className="font-mono text-[11px] text-slate-400">{staff.employeeId} • {staff.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {staff.position}
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-28">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-slate-700">{staff.policyRate}%</span>
                          <span className="text-slate-400 text-[10px]">
                            {staff.acknowledgedPoliciesCount}/{staff.totalPoliciesCount}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              staff.policyRate >= 80 ? 'bg-emerald-500' : staff.policyRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${staff.policyRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-28">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-slate-700">{staff.trainingRate}%</span>
                          <span className="text-slate-400 text-[10px]">
                            {staff.completedTrainingsCount}/{staff.totalTrainingsCount}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              staff.trainingRate >= 80 ? 'bg-indigo-500' : staff.trainingRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${staff.trainingRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {staff.overdueCount > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-[11px]">
                          <AlertTriangle className="w-3 h-3" /> {staff.overdueCount} overdue
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-extrabold text-xs ${
                        staff.overallScore >= 80 ? 'text-emerald-600' : staff.overallScore >= 50 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {staff.overallScore}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge
                        variant={staff.overallScore >= 80 ? 'success' : staff.overallScore >= 50 ? 'warning' : 'danger'}
                        size="sm"
                      >
                        {staff.overallScore >= 80 ? 'Compliant' : staff.overallScore >= 50 ? 'In Progress' : 'Action Needed'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Two Columns: Department Incidents & Quick Management Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Incidents */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Department Incident Log
              </h3>
            </div>
            <Link
              to="/incidents"
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1"
            >
              Report / View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {departmentIncidents.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-50/50 border border-slate-100">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No active incidents reported</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Your department maintains clean security operational hygiene.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {departmentIncidents.map((incident) => (
                <div
                  key={incident._id}
                  onClick={() => navigate('/incidents')}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors"
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
                        variant={incident.status === 'Resolved' ? 'success' : 'warning'}
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

        {/* Quick Department Action Hub */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-brand-600" />
              Department Actions & Compliance Hub
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Quick access shortcuts for department operations and training oversight.
            </p>

            <div className="space-y-3">
              <Link
                to="/users"
                className="p-3.5 rounded-xl border border-slate-200/80 hover:border-brand-400 hover:bg-brand-50/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">View Staff Directory</p>
                    <p className="text-[11px] text-slate-500">Contact or check clinical credentials</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                to="/policies"
                className="p-3.5 rounded-xl border border-slate-200/80 hover:border-brand-400 hover:bg-brand-50/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Clinical Policies Library</p>
                    <p className="text-[11px] text-slate-500">Review departmental and hospital-wide standards</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                to="/reports"
                className="p-3.5 rounded-xl border border-slate-200/80 hover:border-brand-400 hover:bg-brand-50/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Audit Reports & Export</p>
                    <p className="text-[11px] text-slate-500">Generate CSV exports for accreditation audits</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Hemas Clinical Information Security Protocol</span>
            <span className="font-semibold text-brand-600">v2.4 Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
