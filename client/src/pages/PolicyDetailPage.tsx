import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { policyService } from '../services/api';
import { IPolicy } from '../types';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  FileText,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  History,
  AlertCircle,
  Building2,
  Printer,
} from 'lucide-react';

export const PolicyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [policy, setPolicy] = useState<IPolicy | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAcknowledging, setIsAcknowledging] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const fetchPolicy = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await policyService.getPolicyById(id);
      if (res.data.success) {
        setPolicy(res.data.policy);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, [id]);

  const handleAcknowledge = async () => {
    if (!policy) return;
    setIsAcknowledging(true);
    try {
      const res = await policyService.acknowledgePolicy(policy._id);
      if (res.data.success) {
        setSuccessMessage(`Policy "${policy.title}" version ${policy.version} successfully acknowledged.`);
        fetchPolicy();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to acknowledge policy.');
    } finally {
      setIsAcknowledging(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading policy document..." />;
  }

  if (!policy) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Policy Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">The requested policy document does not exist or has been archived.</p>
        <Link
          to="/policies"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Policies
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Back button */}
      <button
        onClick={() => navigate('/policies')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Policies List
      </button>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-card">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge
            variant={
              policy.status === 'Published'
                ? 'success'
                : policy.status === 'Draft'
                ? 'warning'
                : 'neutral'
            }
            size="md"
          >
            {policy.status}
          </Badge>
          <Badge variant="purple" size="md">
            Version {policy.version}
          </Badge>
          <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200/60">
            {policy.category}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
          {policy.title}
        </h1>

        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          {policy.description}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Effective Date</span>
            <span className="font-semibold text-slate-800">
              {new Date(policy.effectiveDate).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Published Date</span>
            <span className="font-semibold text-slate-800">
              {policy.publishedAt ? new Date(policy.publishedAt).toLocaleDateString() : 'Unpublished Draft'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Hospital Unit</span>
            <span className="font-semibold text-slate-800">
              {policy.department ? policy.department.name : 'All Facilities'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Author</span>
            <span className="font-semibold text-slate-800">
              {policy.createdBy?.fullName || 'IT Security Team'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Document Content */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-card prose prose-slate max-w-none">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6 not-prose">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">
              Policy Standards & Guidelines
            </h2>
          </div>
          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Print Policy
          </button>
        </div>

        {/* Content Body formatted */}
        <div className="whitespace-pre-line text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
          {policy.content}
        </div>
      </div>

      {/* Staff Acknowledgement Action Box */}
      <div className="bg-gradient-to-br from-slate-900 to-hemas-navy rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold">
              Staff Policy Acknowledgement
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-lg">
              By acknowledging, you confirm you have read, understood, and agree to strictly comply with all provisions in Version {policy.version} of this policy.
            </p>
            {policy.isAcknowledged && policy.acknowledgementDetails && (
              <p className="text-[11px] text-emerald-400 font-semibold mt-2">
                ✓ Acknowledged on {new Date(policy.acknowledgementDetails.acknowledgedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div>
          {policy.isAcknowledged ? (
            <div className="px-5 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-2 shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Acknowledged
            </div>
          ) : (
            <button
              onClick={handleAcknowledge}
              disabled={isAcknowledging || policy.status !== 'Published'}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              {isAcknowledging ? 'Recording...' : 'Acknowledge Policy'}
            </button>
          )}
        </div>
      </div>

      {/* Version History & Changelog */}
      {policy.previousVersions && policy.previousVersions.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Version History & Changelog (Audit Archive)
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {policy.previousVersions.map((v, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral" size="sm">
                      v{v.version}
                    </Badge>
                    <span className="font-semibold text-slate-800">{v.title}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">{v.changelog}</p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {v.archivedAt ? new Date(v.archivedAt).toLocaleDateString() : 'Archived'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
