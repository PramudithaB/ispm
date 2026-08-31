import React, { useState, useEffect } from 'react';
import { auditService } from '../services/api';
import { IAuditLog } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Activity,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  Calendar,
  User,
  Download,
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Metadata Modal
  const [selectedLog, setSelectedLog] = useState<IAuditLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const actionsList = [
    'LOGIN',
    'LOGIN_FAILED',
    'LOGOUT',
    'CREATE_POLICY',
    'UPDATE_POLICY',
    'PUBLISH_POLICY',
    'ARCHIVE_POLICY',
    'ACKNOWLEDGE_POLICY',
    'CREATE_TRAINING',
    'UPDATE_TRAINING',
    'COMPLETE_TRAINING',
    'QUIZ_SUBMISSION',
    'CREATE_INCIDENT',
    'UPDATE_INCIDENT',
    'RESOLVE_INCIDENT',
    'USER_CREATED',
    'USER_UPDATED',
    'USER_LOCKED',
    'USER_UNLOCKED',
    'EXPORT_REPORT',
  ];

  const modulesList = [
    'AUTH',
    'POLICIES',
    'TRAINING',
    'COMPLIANCE',
    'INCIDENTS',
    'USERS',
    'DEPARTMENTS',
    'REPORTS',
  ];

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 50 };
      if (searchTerm) params.search = searchTerm;
      if (selectedAction) params.action = selectedAction;
      if (selectedModule) params.module = selectedModule;

      const res = await auditService.getLogs(params);
      if (res.data.success) {
        setLogs(res.data.logs);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [searchTerm, selectedAction, selectedModule, page]);

  const handleInspect = (log: IAuditLog) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const getActionBadge = (action: string) => {
    if (action.includes('FAIL') || action.includes('LOCK')) {
      return <Badge variant="danger" size="sm">{action}</Badge>;
    }
    if (action.includes('PUBLISH') || action.includes('COMPLETE') || action.includes('RESOLVE')) {
      return <Badge variant="success" size="sm">{action}</Badge>;
    }
    if (action.includes('ACKNOWLEDGE')) {
      return <Badge variant="teal" size="sm">{action}</Badge>;
    }
    if (action.includes('CREATE')) {
      return <Badge variant="purple" size="sm">{action}</Badge>;
    }
    return <Badge variant="neutral" size="sm">{action}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Tamper-Evident Audit Trail
            </h1>
            <Badge variant="purple" size="sm">
              {total} Log Entries
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable chronological access logs recording security events, acknowledgements, and administrative changes.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by action, email, IP, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Actions</option>
            {actionsList.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Modules</option>
            {modulesList.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <LoadingSpinner message="Querying immutable audit logs..." />
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Audit Logs Found</h3>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Module</th>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">IP Address</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr
                    key={log._id}
                    onClick={() => handleInspect(log)}
                    className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3.5 text-slate-500 font-sans text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 font-sans">{getActionBadge(log.action)}</td>
                    <td className="px-6 py-3.5 text-slate-600 font-sans">{log.module}</td>
                    <td className="px-6 py-3.5 text-slate-900 font-bold">{log.userEmail}</td>
                    <td className="px-6 py-3.5 text-slate-500 font-sans">{log.userRole}</td>
                    <td className="px-6 py-3.5 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="px-6 py-3.5 text-right font-sans">
                      <button className="text-brand-600 hover:text-brand-800 font-bold inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* METADATA INSPECTOR MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Audit Event: ${selectedLog?.action || ''}`}
        subtitle={`Timestamp: ${selectedLog ? new Date(selectedLog.timestamp).toISOString() : ''}`}
        maxWidth="lg"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs font-sans">
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">User</span>
                <span className="font-bold text-slate-900">{selectedLog.userEmail}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Role</span>
                <span className="font-bold text-slate-900">{selectedLog.userRole}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Module</span>
                <span className="font-bold text-slate-900">{selectedLog.module}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">IP Address</span>
                <span className="font-mono text-slate-900">{selectedLog.ipAddress || '127.0.0.1'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px] uppercase font-bold mb-1">
                Event Metadata (JSON Payload)
              </span>
              <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed">
                {JSON.stringify(selectedLog.metadata || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
