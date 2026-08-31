import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { incidentService, userService } from '../services/api';
import { IIncident, IncidentType, IncidentPriority, IncidentStatus, IUser } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  User,
  ShieldAlert,
  Send,
  Building2,
  FileText,
  MessageSquare,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const IncidentsPage: React.FC = () => {
  const { user, isStaff, isAdminOrSecurity } = useAuth();

  const [incidents, setIncidents] = useState<IIncident[]>([]);
  const [securityStaff, setSecurityStaff] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [selectedIncident, setSelectedIncident] = useState<IIncident | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string>('');

  // Report Form State
  const [reportFormData, setReportFormData] = useState({
    incidentType: 'Phishing' as IncidentType,
    title: '',
    description: '',
    priority: 'Medium' as IncidentPriority,
  });

  // Admin Update Form State
  const [updateFormData, setUpdateFormData] = useState({
    status: 'In Review' as IncidentStatus,
    assignedTo: '',
    resolutionNotes: '',
    note: '',
  });

  const incidentTypes: IncidentType[] = [
    'Phishing',
    'Suspicious Email',
    'Lost Device',
    'Unauthorized Access',
    'Password/Security Issue',
    'Other',
  ];

  const fetchIncidents = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedPriority) params.priority = selectedPriority;

      const res = await incidentService.getIncidents(params);
      if (res.data.success) {
        setIncidents(res.data.incidents);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [searchTerm, selectedStatus, selectedPriority]);

  useEffect(() => {
    if (isAdminOrSecurity) {
      const fetchStaff = async () => {
        try {
          const res = await userService.getUsers({ role: 'IT_SECURITY_ADMIN' });
          if (res.data.success) setSecurityStaff(res.data.users);
        } catch (err) {
          console.error(err);
        }
      };
      fetchStaff();
    }
  }, [isAdminOrSecurity]);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await incidentService.reportIncident(reportFormData);
      if (res.data.success) {
        setIsReportModalOpen(false);
        setActionSuccessMessage(`Incident reported successfully. Assigned number: ${res.data.incident.incidentNumber}`);
        setTimeout(() => setActionSuccessMessage(''), 5000);
        setReportFormData({
          incidentType: 'Phishing',
          title: '',
          description: '',
          priority: 'Medium',
        });
        fetchIncidents();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to report incident');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDetails = (incident: IIncident) => {
    setSelectedIncident(incident);
    setUpdateFormData({
      status: incident.status,
      assignedTo: incident.assignedTo?._id || '',
      resolutionNotes: incident.resolutionNotes || '',
      note: '',
    });
    setIsDetailsModalOpen(true);
  };

  const handleUpdateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    setIsSubmitting(true);
    try {
      const res = await incidentService.updateStatus(selectedIncident._id, updateFormData);
      if (res.data.success) {
        setIsDetailsModalOpen(false);
        setActionSuccessMessage(`Incident ${selectedIncident.incidentNumber} updated successfully.`);
        setTimeout(() => setActionSuccessMessage(''), 4000);
        fetchIncidents();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update incident');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (priority: IncidentPriority) => {
    switch (priority) {
      case 'Critical':
        return <Badge variant="danger" size="sm" dot>Critical</Badge>;
      case 'High':
        return <Badge variant="warning" size="sm">High</Badge>;
      case 'Medium':
        return <Badge variant="info" size="sm">Medium</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Low</Badge>;
    }
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'Resolved':
        return <Badge variant="success" size="sm" dot>Resolved</Badge>;
      case 'In Review':
        return <Badge variant="info" size="sm">In Review</Badge>;
      default:
        return <Badge variant="warning" size="sm">Open</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Cybersecurity Incidents
            </h1>
            <Badge variant="danger" size="sm">
              {incidents.length} Records
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rapid reporting and triage of suspicious emails, lost hospital devices, and unauthorized access attempts.
          </p>
        </div>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Report Security Incident
        </button>
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
            placeholder="Search by incident #, title, keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Review">In Review</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      {isLoading ? (
        <LoadingSpinner message="Fetching hospital incident register..." />
      ) : incidents.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Incidents Reported</h3>
          <p className="text-xs text-slate-400 mt-1">No security events match your filter query.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Incident ID</th>
                  <th className="px-6 py-3.5">Type & Title</th>
                  <th className="px-6 py-3.5">Priority</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Reported By</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {incidents.map((incident) => (
                  <tr
                    key={incident._id}
                    onClick={() => handleOpenDetails(incident)}
                    className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {incident.incidentNumber}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-semibold text-slate-500 block">
                        {incident.incidentType}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">
                        {incident.title}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getPriorityBadge(incident.priority)}</td>
                    <td className="px-6 py-4">{getStatusBadge(incident.status)}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">
                        {incident.reportedBy?.fullName || 'Anonymous'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {incident.reportedBy?.position}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(incident.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-brand-600 hover:text-brand-800 font-bold inline-flex items-center gap-1">
                        Details <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT INCIDENT MODAL (Staff & Admin) */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Report Cybersecurity Incident"
        subtitle="Immediately alert IT Security regarding suspicious emails, lost devices, or unauthorized access."
        maxWidth="lg"
      >
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Incident Type *
              </label>
              <select
                value={reportFormData.incidentType}
                onChange={(e) =>
                  setReportFormData({
                    ...reportFormData,
                    incidentType: e.target.value as IncidentType,
                  })
                }
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                {incidentTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Estimated Priority *
              </label>
              <select
                value={reportFormData.priority}
                onChange={(e) =>
                  setReportFormData({
                    ...reportFormData,
                    priority: e.target.value as IncidentPriority,
                  })
                }
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Incident Summary / Subject *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Received phishing email regarding fake lab supply invoice"
              value={reportFormData.title}
              onChange={(e) =>
                setReportFormData({ ...reportFormData, title: e.target.value })
              }
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Detailed Description & Indicators *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe what occurred, any links clicked, sender email addresses, device serial numbers, or workstation locations..."
              value={reportFormData.description}
              onChange={(e) =>
                setReportFormData({ ...reportFormData, description: e.target.value })
              }
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              If this incident involves an active ransomware infection, disconnect your computer from the network cable/Wi-Fi immediately and call IT hotline Ext. 4444.
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Reporting...' : 'Submit Incident Report'}
            </button>
          </div>
        </form>
      </Modal>

      {/* INCIDENT DETAILS & TRIAGE MODAL */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Incident Details: ${selectedIncident?.incidentNumber || ''}`}
        subtitle={`Type: ${selectedIncident?.incidentType || ''} • Reported: ${
          selectedIncident ? new Date(selectedIncident.createdAt).toLocaleString() : ''
        }`}
        maxWidth="2xl"
      >
        {selectedIncident && (
          <div className="space-y-5">
            {/* Header badges */}
            <div className="flex items-center justify-between gap-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Status:</span>
                {getStatusBadge(selectedIncident.status)}
                <span className="text-xs text-slate-500 ml-2">Priority:</span>
                {getPriorityBadge(selectedIncident.priority)}
              </div>

              <div className="text-right text-xs text-slate-500">
                <span>Reporter: </span>
                <span className="font-bold text-slate-800">
                  {selectedIncident.reportedBy?.fullName}
                </span>
              </div>
            </div>

            {/* Title & Description */}
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {selectedIncident.title}
              </h3>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed bg-slate-50/50 p-3.5 rounded-xl border border-slate-200">
                {selectedIncident.description}
              </p>
            </div>

            {/* Resolution Notes if resolved */}
            {selectedIncident.resolutionNotes && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                <span className="font-bold block mb-1">Resolution Summary:</span>
                {selectedIncident.resolutionNotes}
                {selectedIncident.resolvedAt && (
                  <span className="text-[10px] text-emerald-700 block mt-1">
                    Resolved on {new Date(selectedIncident.resolvedAt).toLocaleString()}
                  </span>
                )}
              </div>
            )}

            {/* Admin Management Section */}
            {isAdminOrSecurity && (
              <form onSubmit={handleUpdateIncident} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Security Triage & Status Update
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Update Workflow Status
                    </label>
                    <select
                      value={updateFormData.status}
                      onChange={(e) =>
                        setUpdateFormData({
                          ...updateFormData,
                          status: e.target.value as IncidentStatus,
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="Open">Open</option>
                      <option value="In Review">In Review</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Assign Security Responder
                    </label>
                    <select
                      value={updateFormData.assignedTo}
                      onChange={(e) =>
                        setUpdateFormData({
                          ...updateFormData,
                          assignedTo: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="">Unassigned</option>
                      {securityStaff.map((sec) => (
                        <option key={sec._id} value={sec._id}>
                          {sec.fullName} ({sec.position})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Resolution Notes (Visible to Reporter upon resolution)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Malicious sender blocked on perimeter gateway..."
                    value={updateFormData.resolutionNotes}
                    onChange={(e) =>
                      setUpdateFormData({
                        ...updateFormData,
                        resolutionNotes: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Add Internal Security Investigation Note
                  </label>
                  <input
                    type="text"
                    placeholder="Internal forensic details..."
                    value={updateFormData.note}
                    onChange={(e) =>
                      setUpdateFormData({
                        ...updateFormData,
                        note: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Updating...' : 'Save Triage Update'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
