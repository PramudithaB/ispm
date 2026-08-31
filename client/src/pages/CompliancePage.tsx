import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { complianceService } from '../services/api';
import { IComplianceSummary, IDepartmentCompliance, IStaffComplianceDrilldown } from '../types';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  User,
  GraduationCap,
  FileCheck2,
  Download,
  Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const CompliancePage: React.FC = () => {
  const { user, isStaff } = useAuth();

  const [summary, setSummary] = useState<IComplianceSummary | null>(null);
  const [departments, setDepartments] = useState<IDepartmentCompliance[]>([]);
  const [myCompliance, setMyCompliance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Drilldown Modal
  const [isDrilldownOpen, setIsDrilldownOpen] = useState<boolean>(false);
  const [drilldownDeptName, setDrilldownDeptName] = useState<string>('');
  const [staffList, setStaffList] = useState<IStaffComplianceDrilldown[]>([]);
  const [isDrilldownLoading, setIsDrilldownLoading] = useState<boolean>(false);
  const [staffSearchTerm, setStaffSearchTerm] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (isStaff) {
          const res = await complianceService.getMyCompliance();
          if (res.data.success) setMyCompliance(res.data.myCompliance);
        } else {
          const [sumRes, deptRes] = await Promise.all([
            complianceService.getSummary(),
            complianceService.getDepartmentCompliance(),
          ]);
          if (sumRes.data.success) setSummary(sumRes.data.summary);
          if (deptRes.data.success) setDepartments(deptRes.data.departments);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isStaff]);

  const handleOpenDrilldown = async (deptId: string, deptName: string) => {
    setDrilldownDeptName(deptName);
    setIsDrilldownOpen(true);
    setIsDrilldownLoading(true);
    setStaffSearchTerm('');
    try {
      const res = await complianceService.getDepartmentStaff(deptId);
      if (res.data.success) {
        setStaffList(res.data.staff);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDrilldownLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Calculating real-time hospital compliance metrics..." />;
  }

  // ==========================================
  // STAFF PERSONAL COMPLIANCE VIEW
  // ==========================================
  if (isStaff) {
    const score = myCompliance?.overallScore || 0;
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              My Compliance Profile
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Personal cybersecurity accountability & training records for {user?.fullName}.
            </p>
          </div>
          <Badge
            variant={score >= 80 ? 'success' : score >= 50 ? 'warning' : 'danger'}
            size="lg"
            dot
          >
            {score}% Compliant
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Overall Score"
            value={`${score}/100`}
            subtitle="Standard threshold: 80%"
            icon={<ShieldCheck className="w-6 h-6" />}
            iconBgColor="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            title="Policy Acknowledgement"
            value={`${myCompliance?.acknowledgedCount || 0} / ${myCompliance?.totalPolicies || 0}`}
            subtitle={`${myCompliance?.policyRate || 0}% rate`}
            icon={<FileCheck2 className="w-6 h-6" />}
            iconBgColor="bg-blue-50 text-blue-600"
          />
          <StatCard
            title="Training Modules"
            value={`${myCompliance?.completedTrainingsCount || 0} / ${myCompliance?.totalTrainings || 0}`}
            subtitle={`${myCompliance?.trainingRate || 0}% completed`}
            icon={<GraduationCap className="w-6 h-6" />}
            iconBgColor="bg-purple-50 text-purple-600"
          />
        </div>

        {/* Action List */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Compliance Status Checklist
          </h2>

          <div className="divide-y divide-slate-100">
            <div className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="font-bold text-slate-800">Information Security Policies</p>
                  <p className="text-slate-500">{myCompliance?.acknowledgedCount} of {myCompliance?.totalPolicies} acknowledged</p>
                </div>
              </div>
              <Link to="/policies" className="text-brand-600 hover:text-brand-800 font-semibold">
                Manage Policies →
              </Link>
            </div>

            <div className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="font-bold text-slate-800">Security Awareness Training</p>
                  <p className="text-slate-500">{myCompliance?.completedTrainingsCount} of {myCompliance?.totalTrainings} completed</p>
                </div>
              </div>
              <Link to="/training" className="text-purple-600 hover:text-purple-800 font-semibold">
                View Courses →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ADMIN & DEPT HEAD COMPLIANCE MATRIX VIEW
  // ==========================================
  const filteredStaffList = staffList.filter((s) => {
    if (!staffSearchTerm) return true;
    const term = staffSearchTerm.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(term) ||
      s.employeeId.toLowerCase().includes(term) ||
      s.position.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Hospital Compliance Matrix
            </h1>
            <Badge variant="teal" size="sm">
              Live Live Drilldown
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Department-by-department compliance statistics with individual employee drill-down auditing.
          </p>
        </div>

        <Link
          to="/reports"
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Download className="w-4 h-4 text-slate-500" /> Export Compliance Matrix (CSV)
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Compliance"
          value={`${summary?.overallComplianceScore || 0}%`}
          subtitle="Hospital average"
          icon={<ShieldCheck className="w-6 h-6" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Policy Acknowledgement"
          value={`${summary?.policyAckRate || 0}%`}
          subtitle={`${summary?.totalAcks || 0} total records`}
          icon={<FileCheck2 className="w-6 h-6" />}
          iconBgColor="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Training Completion"
          value={`${summary?.trainingCompletionRate || 0}%`}
          subtitle={`${summary?.completedProgresses || 0} completed`}
          icon={<GraduationCap className="w-6 h-6" />}
          iconBgColor="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Overdue Modules"
          value={summary?.overdueTrainings || 0}
          subtitle="Requires departmental follow-up"
          icon={<AlertTriangle className="w-6 h-6" />}
          iconBgColor={summary?.overdueTrainings ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}
        />
      </div>

      {/* Department Compliance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Department Compliance Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Click any department row to view individual staff compliance records.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Facility Site</th>
                <th className="px-6 py-3.5 text-center">Staff Count</th>
                <th className="px-6 py-3.5 text-center">Policy Ack %</th>
                <th className="px-6 py-3.5 text-center">Training Complete %</th>
                <th className="px-6 py-3.5 text-center">Overall Compliance</th>
                <th className="px-6 py-3.5 text-right">Drill Down</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {departments.map((dept) => (
                <tr
                  key={dept._id}
                  onClick={() => handleOpenDrilldown(dept._id, dept.name)}
                  className="hover:bg-brand-50/40 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
                    <span>{dept.name}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{dept.site}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-semibold text-slate-800">{dept.staffCount}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-emerald-600 font-semibold">{dept.policyAckRate}%</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-purple-600 font-semibold">{dept.trainingCompletionRate}%</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-2">
                      <span className="font-bold text-slate-900">{dept.overallCompliance}%</span>
                      <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className={`h-full rounded-full ${
                            dept.overallCompliance >= 80
                              ? 'bg-emerald-500'
                              : dept.overallCompliance >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${dept.overallCompliance}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-brand-600 hover:text-brand-800 font-bold inline-flex items-center gap-1">
                      View Staff <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INDIVIDUAL STAFF DRILLDOWN MODAL */}
      <Modal
        isOpen={isDrilldownOpen}
        onClose={() => setIsDrilldownOpen(false)}
        title={`Staff Compliance Drilldown: ${drilldownDeptName}`}
        subtitle="Individual employee policy acknowledgements and training completions"
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search staff by name, employee ID, position..."
              value={staffSearchTerm}
              onChange={(e) => setStaffSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
            />
          </div>

          {isDrilldownLoading ? (
            <LoadingSpinner message="Fetching department staff compliance records..." />
          ) : filteredStaffList.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400">
              No staff members found for this query.
            </p>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Position</th>
                    <th className="px-4 py-3 text-center">Policies</th>
                    <th className="px-4 py-3 text-center">Training</th>
                    <th className="px-4 py-3 text-center">Overall</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredStaffList.map((member) => (
                    <tr key={member._id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{member.fullName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{member.employeeId}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{member.position}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-emerald-700">
                          {member.acknowledgedPoliciesCount}/{member.totalPoliciesCount} ({member.policyRate}%)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-purple-700">
                          {member.completedTrainingsCount}/{member.totalTrainingsCount} ({member.trainingRate}%)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-900">
                        {member.overallScore}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={
                            member.overallScore >= 80
                              ? 'success'
                              : member.overallScore >= 50
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {member.overallScore >= 80
                            ? 'Compliant'
                            : member.overallScore >= 50
                            ? 'In Progress'
                            : 'Non-Compliant'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
