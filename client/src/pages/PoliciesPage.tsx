import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { policyService, departmentService } from '../services/api';
import { IPolicy, IDepartment, PolicyCategory, PolicyStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  FileText,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  Archive,
  Send,
  Eye,
  Edit,
  History,
  Users,
  AlertCircle,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const PoliciesPage: React.FC = () => {
  const { user, isAdminOrSecurity } = useAuth();
  const navigate = useNavigate();

  const [policies, setPolicies] = useState<IPolicy[]>([]);
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isAckListModalOpen, setIsAckListModalOpen] = useState<boolean>(false);
  const [selectedPolicy, setSelectedPolicy] = useState<IPolicy | null>(null);
  const [acknowledgementsData, setAcknowledgementsData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: 'Data Privacy & Confidentiality' as PolicyCategory,
    department: '',
    version: '1.0',
    status: 'Published' as PolicyStatus,
    changelog: 'Initial version',
    newVersion: '',
  });

  const categories: PolicyCategory[] = [
    'Data Privacy & Confidentiality',
    'Access Control & Passwords',
    'Device & Endpoint Security',
    'Incident Response',
    'Physical & Environmental Security',
    'Acceptable Use Policy',
  ];

  const fetchPolicies = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedDepartment) params.department = selectedDepartment;
      if (selectedStatus) params.status = selectedStatus;

      const res = await policyService.getPolicies(params);
      if (res.data.success) {
        setPolicies(res.data.policies);
      }
    } catch (err) {
      console.error('Failed to fetch policies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [searchTerm, selectedCategory, selectedDepartment, selectedStatus]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await departmentService.getDepartments();
        if (res.data.success) setDepartments(res.data.departments);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDepts();
  }, []);

  const handleOpenCreateModal = () => {
    setFormData({
      title: '',
      description: '',
      content: '### 1. Purpose & Scope\n\n### 2. Mandatory Security Requirements\n\n### 3. Compliance & Enforcement\n',
      category: 'Data Privacy & Confidentiality',
      department: '',
      version: '1.0',
      status: 'Published',
      changelog: 'Initial baseline creation',
      newVersion: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (policy: IPolicy) => {
    setSelectedPolicy(policy);
    setFormData({
      title: policy.title,
      description: policy.description,
      content: policy.content,
      category: policy.category,
      department: policy.department?._id || '',
      version: policy.version,
      status: policy.status,
      changelog: `Updated policy guidelines`,
      newVersion: (parseFloat(policy.version) + 0.1).toFixed(1),
    });
    setIsEditModalOpen(true);
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await policyService.createPolicy({
        title: formData.title,
        description: formData.description,
        content: formData.content,
        category: formData.category,
        department: formData.department || null,
        version: formData.version,
        status: formData.status,
      });
      setIsCreateModalOpen(false);
      setActionSuccessMessage('Policy created successfully.');
      setTimeout(() => setActionSuccessMessage(''), 4000);
      fetchPolicies();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create policy');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicy) return;
    setIsSubmitting(true);
    try {
      await policyService.updatePolicy(selectedPolicy._id, {
        title: formData.title,
        description: formData.description,
        content: formData.content,
        category: formData.category,
        department: formData.department || null,
        changelog: formData.changelog,
        newVersion: formData.newVersion,
        status: formData.status,
      });
      setIsEditModalOpen(false);
      setActionSuccessMessage('Policy updated and version archived successfully.');
      setTimeout(() => setActionSuccessMessage(''), 4000);
      fetchPolicies();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update policy');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishPolicy = async (id: string, title: string) => {
    if (!confirm(`Publish policy "${title}"? All staff will be notified to acknowledge.`)) return;
    try {
      await policyService.publishPolicy(id);
      setActionSuccessMessage(`Policy "${title}" published successfully.`);
      setTimeout(() => setActionSuccessMessage(''), 4000);
      fetchPolicies();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to publish policy');
    }
  };

  const handleArchivePolicy = async (id: string, title: string) => {
    if (!confirm(`Archive policy "${title}"? Staff will no longer see archived policies.`)) return;
    try {
      await policyService.archivePolicy(id);
      setActionSuccessMessage(`Policy "${title}" archived.`);
      setTimeout(() => setActionSuccessMessage(''), 4000);
      fetchPolicies();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to archive policy');
    }
  };

  const handleAcknowledge = async (id: string, title: string) => {
    try {
      await policyService.acknowledgePolicy(id);
      setActionSuccessMessage(`Policy "${title}" acknowledged successfully.`);
      setTimeout(() => setActionSuccessMessage(''), 4000);
      fetchPolicies();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to acknowledge policy');
    }
  };

  const handleViewAcknowledgements = async (policy: IPolicy) => {
    setSelectedPolicy(policy);
    try {
      const res = await policyService.getAcknowledgements(policy._id);
      if (res.data.success) {
        setAcknowledgementsData(res.data);
        setIsAckListModalOpen(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to fetch acknowledgements');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Information Security Policies
            </h1>
            <Badge variant="teal" size="sm">
              {policies.length} Policies
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mandatory clinical cybersecurity rules, data governance, and regulatory standards for Hemas Hospitals.
          </p>
        </div>

        {isAdminOrSecurity && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Create New Policy
          </button>
        )}
      </div>

      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search policies by title, topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Hospital Units</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Status Filter (Admin Only) */}
          {isAdminOrSecurity && (
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          )}
        </div>
      </div>

      {/* Policies List */}
      {isLoading ? (
        <LoadingSpinner message="Fetching hospital policies from MongoDB..." />
      ) : policies.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Policies Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No policy documents match your search criteria. Try clearing search filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {policies.map((policy) => (
            <div
              key={policy._id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <Badge
                    variant={
                      policy.status === 'Published'
                        ? 'success'
                        : policy.status === 'Draft'
                        ? 'warning'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {policy.status}
                  </Badge>
                  <Badge variant="purple" size="sm">
                    v{policy.version}
                  </Badge>
                  <span className="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full">
                    {policy.category}
                  </span>
                  {policy.department && (
                    <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {policy.department.name}
                    </span>
                  )}
                </div>

                <Link
                  to={`/policies/${policy._id}`}
                  className="text-base font-bold text-slate-900 hover:text-brand-600 transition-colors block"
                >
                  {policy.title}
                </Link>

                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {policy.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-slate-400 font-medium">
                  <span>
                    Effective: {new Date(policy.effectiveDate).toLocaleDateString()}
                  </span>
                  {policy.publishedAt && (
                    <span>
                      Published: {new Date(policy.publishedAt).toLocaleDateString()}
                    </span>
                  )}
                  {policy.previousVersions && policy.previousVersions.length > 0 && (
                    <span className="text-purple-600 flex items-center gap-1 font-semibold">
                      <History className="w-3.5 h-3.5" /> {policy.previousVersions.length} archived versions
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                {/* Acknowledgement Status Pill for current user */}
                {policy.isAcknowledged ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Acknowledged
                  </span>
                ) : policy.status === 'Published' ? (
                  <button
                    onClick={() => handleAcknowledge(policy._id, policy.title)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Acknowledge
                  </button>
                ) : null}

                <Link
                  to={`/policies/${policy._id}`}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Read
                </Link>

                {/* Admin Operations */}
                {isAdminOrSecurity && (
                  <div className="flex items-center gap-1.5">
                    {policy.status === 'Draft' && (
                      <button
                        onClick={() => handlePublishPolicy(policy._id, policy.title)}
                        className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1"
                        title="Publish Policy"
                      >
                        <Send className="w-3.5 h-3.5" /> Publish
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEditModal(policy)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      title="Edit / New Version"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleViewAcknowledgements(policy)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-brand-600 transition-colors"
                      title="View Staff Acknowledgements"
                    >
                      <Users className="w-4 h-4" />
                    </button>

                    {policy.status === 'Published' && (
                      <button
                        onClick={() => handleArchivePolicy(policy._id, policy.title)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-rose-600 transition-colors"
                        title="Archive Policy"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE POLICY MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Information Security Policy"
        subtitle="Define policy rules and publish or save as draft."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreatePolicy} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Policy Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Clinical Workstation MFA & Password Policy"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as PolicyCategory })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Applicable Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="">All Hospital Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Executive Summary / Description *
            </label>
            <textarea
              required
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief summary displayed on staff dashboard cards..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Policy Content (Markdown Supported) *
            </label>
            <textarea
              required
              rows={8}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3.5 py-2 font-mono text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Initial Version
              </label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Publication Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as PolicyStatus })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
              >
                <option value="Published">Published (Staff can see & acknowledge)</option>
                <option value="Draft">Draft (Only Admins can see)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Create Policy'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT / VERSION POLICY MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Update Policy: ${selectedPolicy?.title}`}
        subtitle={`Current version: v${selectedPolicy?.version}. Archiving creates an immutable audit trail.`}
        maxWidth="2xl"
      >
        <form onSubmit={handleUpdatePolicy} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Policy Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                New Version Number *
              </label>
              <input
                type="text"
                required
                value={formData.newVersion}
                onChange={(e) => setFormData({ ...formData, newVersion: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as PolicyStatus })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
              >
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Version Changelog *
            </label>
            <input
              type="text"
              required
              value={formData.changelog}
              onChange={(e) => setFormData({ ...formData, changelog: e.target.value })}
              placeholder="e.g. Updated password expiry to 60 days per audit finding."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Policy Content *
            </label>
            <textarea
              required
              rows={8}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3.5 py-2 font-mono text-xs rounded-xl border border-slate-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Archiving & Updating...' : 'Save & Publish New Version'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ACKNOWLEDGEMENTS LIST MODAL */}
      <Modal
        isOpen={isAckListModalOpen}
        onClose={() => setIsAckListModalOpen(false)}
        title={`Staff Acknowledgement Audit: ${acknowledgementsData?.policyTitle || ''}`}
        subtitle={`Compliance Rate: ${acknowledgementsData?.complianceRate || 0}% (${acknowledgementsData?.acknowledgedCount || 0} / ${acknowledgementsData?.totalStaff || 0} hospital staff)`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${acknowledgementsData?.complianceRate || 0}%` }}
            />
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {acknowledgementsData?.acknowledgements?.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">
                No staff acknowledgements recorded yet for this version.
              </p>
            ) : (
              acknowledgementsData?.acknowledgements?.map((ack: any) => (
                <div key={ack._id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800">
                      {ack.userId?.fullName} ({ack.userId?.employeeId})
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      {ack.userId?.position} • {ack.userId?.site}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged v{ack.policyVersion}
                    </span>
                    <p className="text-[10px] text-slate-400">
                      {new Date(ack.acknowledgedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
