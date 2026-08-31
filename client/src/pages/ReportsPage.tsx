import React, { useState } from 'react';
import { reportService } from '../services/api';
import { Badge } from '../components/common/Badge';
import {
  FileSpreadsheet,
  Download,
  ShieldCheck,
  AlertTriangle,
  GraduationCap,
  Activity,
  CheckCircle2,
  Table,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleExport = async (type: 'compliance' | 'incidents' | 'training' | 'audit') => {
    setDownloadingReport(type);
    try {
      let res;
      let filename = `SecureHemas_${type}_report_${Date.now()}.csv`;

      if (type === 'compliance') res = await reportService.exportCompliance('csv');
      else if (type === 'incidents') res = await reportService.exportIncidents('csv');
      else if (type === 'training') res = await reportService.exportTraining('csv');
      else res = await reportService.exportAudit('csv');

      triggerDownload(new Blob([res.data], { type: 'text/csv' }), filename);
      setSuccessMessage(`${type.toUpperCase()} report exported successfully.`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      alert('Failed to generate report export.');
      console.error(err);
    } finally {
      setDownloadingReport(null);
    }
  };

  const reportCards = [
    {
      type: 'compliance' as const,
      title: 'Department Compliance Matrix',
      description:
        'Comprehensive breakdown of staff counts, policy acknowledgement percentages, training completion rates, and overall compliance scores per department.',
      icon: <ShieldCheck className="w-6 h-6" />,
      iconColor: 'bg-emerald-50 text-emerald-600',
      fields: ['Department', 'Hospital Site', 'Staff Count', 'Policy Ack %', 'Training Complete %', 'Overall Compliance %'],
    },
    {
      type: 'incidents' as const,
      title: 'Cybersecurity Incident Register',
      description:
        'Detailed log of all reported hospital security events including phishing attempts, lost devices, triage priority, status, and resolution details.',
      icon: <AlertTriangle className="w-6 h-6" />,
      iconColor: 'bg-rose-50 text-rose-600',
      fields: ['Incident #', 'Type', 'Title', 'Priority', 'Status', 'Reporter', 'Assigned To', 'Resolution Notes'],
    },
    {
      type: 'training' as const,
      title: 'Staff Training Completion Matrix',
      description:
        'Individual staff training progress tracking, quiz scores, attempt counts, completion dates, and overdue alert flags.',
      icon: <GraduationCap className="w-6 h-6" />,
      iconColor: 'bg-purple-50 text-purple-600',
      fields: ['Employee Name', 'Employee ID', 'Email', 'Training Course', 'Status', 'Score', 'Attempts', 'Completed Date'],
    },
    {
      type: 'audit' as const,
      title: 'Tamper-Evident Audit Trail Log',
      description:
        'Immutable chronological security log of logins, policy publications, acknowledgements, quiz evaluations, and admin operations.',
      icon: <Activity className="w-6 h-6" />,
      iconColor: 'bg-blue-50 text-blue-600',
      fields: ['Timestamp', 'Action', 'Module', 'User Email', 'Security Role', 'IP Address', 'Entity ID', 'Metadata'],
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Compliance & Audit Reports Export
            </h1>
            <Badge variant="purple" size="sm">
              Live CSV Data
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Export comprehensive compliance records, incident logs, and training matrices for hospital governance and regulatory audits.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCards.map((card) => (
          <div
            key={card.type}
            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.iconColor} shrink-0`}
                >
                  {card.icon}
                </div>
                <Badge variant="neutral" size="sm">
                  CSV Format
                </Badge>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1">
                {card.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                {card.description}
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 mb-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Table className="w-3 h-3" /> Included Data Columns:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {card.fields.map((f, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-mono"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleExport(card.type)}
              disabled={downloadingReport === card.type}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {downloadingReport === card.type ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating CSV...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download {card.title}</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
