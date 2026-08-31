"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportAuditLogsReport = exports.exportTrainingReport = exports.exportIncidentsReport = exports.exportComplianceReport = void 0;
const User_1 = require("../models/User");
const Department_1 = require("../models/Department");
const Policy_1 = require("../models/Policy");
const PolicyAcknowledgement_1 = require("../models/PolicyAcknowledgement");
const TrainingModule_1 = require("../models/TrainingModule");
const TrainingProgress_1 = require("../models/TrainingProgress");
const Incident_1 = require("../models/Incident");
const AuditLog_1 = require("../models/AuditLog");
const auditService_1 = require("../services/auditService");
// Helper to convert array of objects into CSV string
const jsonToCsv = (data) => {
    if (!data || data.length === 0)
        return '';
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map((row) => headers
            .map((header) => {
            let val = row[header];
            if (val === null || val === undefined)
                val = '';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
        })
            .join(',')),
    ];
    return csvRows.join('\r\n');
};
const exportComplianceReport = async (req, res) => {
    try {
        const { format = 'json' } = req.query;
        const [departments, publishedPolicies, publishedTrainings] = await Promise.all([
            Department_1.Department.find().sort({ name: 1 }),
            Policy_1.Policy.find({ status: 'Published' }),
            TrainingModule_1.TrainingModule.find({ status: 'Published' }),
        ]);
        const reportData = await Promise.all(departments.map(async (dept) => {
            const staff = await User_1.User.find({ department: dept._id, isActive: true });
            const staffCount = staff.length;
            const staffIds = staff.map((s) => s._id);
            let policyAckRate = 100;
            let trainingCompletionRate = 100;
            let overdueCount = 0;
            if (staffCount > 0) {
                const [acks, completions, overdue] = await Promise.all([
                    PolicyAcknowledgement_1.PolicyAcknowledgement.countDocuments({ userId: { $in: staffIds } }),
                    TrainingProgress_1.TrainingProgress.countDocuments({
                        userId: { $in: staffIds },
                        status: 'Completed',
                    }),
                    TrainingProgress_1.TrainingProgress.countDocuments({
                        userId: { $in: staffIds },
                        status: { $ne: 'Completed' },
                        dueDate: { $lt: new Date() },
                    }),
                ]);
                const expectedAcks = staffCount * publishedPolicies.length;
                policyAckRate = expectedAcks > 0 ? Math.min(100, Math.round((acks / expectedAcks) * 100)) : 100;
                const expectedTrainings = staffCount * publishedTrainings.length;
                trainingCompletionRate =
                    expectedTrainings > 0
                        ? Math.min(100, Math.round((completions / expectedTrainings) * 100))
                        : 100;
                overdueCount = overdue;
            }
            const overallCompliance = Math.round(policyAckRate * 0.5 + trainingCompletionRate * 0.5);
            return {
                Department: dept.name,
                HospitalSite: dept.site,
                StaffCount: staffCount,
                PolicyAckRate: `${policyAckRate}%`,
                TrainingCompletionRate: `${trainingCompletionRate}%`,
                OverallCompliance: `${overallCompliance}%`,
                OverdueModules: overdueCount,
            };
        }));
        await (0, auditService_1.logAudit)({
            userId: req.user?._id,
            userEmail: req.user?.email || 'SYSTEM',
            userRole: req.user?.role,
            action: 'EXPORT_REPORT',
            module: 'REPORTS',
            metadata: { reportType: 'Department Compliance', format },
            req,
        });
        if (format === 'csv') {
            const csv = jsonToCsv(reportData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="SecureHemas_Compliance_Report_${Date.now()}.csv"`);
            res.status(200).send(csv);
            return;
        }
        res.status(200).json({
            success: true,
            reportType: 'Department Compliance',
            generatedAt: new Date(),
            data: reportData,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to export compliance report.',
            error: error.message,
        });
    }
};
exports.exportComplianceReport = exportComplianceReport;
const exportIncidentsReport = async (req, res) => {
    try {
        const { format = 'json' } = req.query;
        const incidents = await Incident_1.Incident.find()
            .populate('reportedBy', 'fullName employeeId email')
            .populate('assignedTo', 'fullName email')
            .populate('department', 'name site')
            .sort({ createdAt: -1 });
        const reportData = incidents.map((inc) => ({
            IncidentNumber: inc.incidentNumber,
            Type: inc.incidentType,
            Title: inc.title,
            Priority: inc.priority,
            Status: inc.status,
            ReportedBy: inc.reportedBy?.fullName || 'Unknown',
            EmployeeID: inc.reportedBy?.employeeId || 'N/A',
            Department: inc.department?.name || 'N/A',
            AssignedTo: inc.assignedTo?.fullName || 'Unassigned',
            ResolutionNotes: inc.resolutionNotes || '',
            ReportedDate: new Date(inc.createdAt).toISOString(),
            ResolvedDate: inc.resolvedAt ? new Date(inc.resolvedAt).toISOString() : 'N/A',
        }));
        await (0, auditService_1.logAudit)({
            userId: req.user?._id,
            userEmail: req.user?.email || 'SYSTEM',
            userRole: req.user?.role,
            action: 'EXPORT_REPORT',
            module: 'REPORTS',
            metadata: { reportType: 'Incident Register', format },
            req,
        });
        if (format === 'csv') {
            const csv = jsonToCsv(reportData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="SecureHemas_Incidents_Report_${Date.now()}.csv"`);
            res.status(200).send(csv);
            return;
        }
        res.status(200).json({
            success: true,
            reportType: 'Incident Register',
            generatedAt: new Date(),
            data: reportData,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to export incidents report.',
            error: error.message,
        });
    }
};
exports.exportIncidentsReport = exportIncidentsReport;
const exportTrainingReport = async (req, res) => {
    try {
        const { format = 'json' } = req.query;
        const progresses = await TrainingProgress_1.TrainingProgress.find()
            .populate('userId', 'fullName employeeId email department position')
            .populate('trainingModuleId', 'title category passingScore durationMinutes')
            .sort({ updatedAt: -1 });
        const reportData = progresses.map((p) => ({
            EmployeeName: p.userId?.fullName || 'Unknown',
            EmployeeID: p.userId?.employeeId || 'N/A',
            Email: p.userId?.email || 'N/A',
            TrainingTitle: p.trainingModuleId?.title || 'Unknown',
            Category: p.trainingModuleId?.category || 'N/A',
            Status: p.status,
            Score: `${p.score || 0}%`,
            Attempts: p.attempts || 0,
            StartedAt: p.startedAt ? new Date(p.startedAt).toISOString() : 'N/A',
            CompletedAt: p.completedAt ? new Date(p.completedAt).toISOString() : 'N/A',
            DueDate: p.dueDate ? new Date(p.dueDate).toISOString() : 'N/A',
        }));
        await (0, auditService_1.logAudit)({
            userId: req.user?._id,
            userEmail: req.user?.email || 'SYSTEM',
            userRole: req.user?.role,
            action: 'EXPORT_REPORT',
            module: 'REPORTS',
            metadata: { reportType: 'Training Completion Matrix', format },
            req,
        });
        if (format === 'csv') {
            const csv = jsonToCsv(reportData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="SecureHemas_Training_Report_${Date.now()}.csv"`);
            res.status(200).send(csv);
            return;
        }
        res.status(200).json({
            success: true,
            reportType: 'Training Completion Matrix',
            generatedAt: new Date(),
            data: reportData,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to export training report.',
            error: error.message,
        });
    }
};
exports.exportTrainingReport = exportTrainingReport;
const exportAuditLogsReport = async (req, res) => {
    try {
        const { format = 'json' } = req.query;
        const logs = await AuditLog_1.AuditLog.find()
            .populate('userId', 'fullName employeeId')
            .sort({ timestamp: -1 })
            .limit(1000);
        const reportData = logs.map((log) => ({
            Timestamp: new Date(log.timestamp).toISOString(),
            Action: log.action,
            Module: log.module,
            UserEmail: log.userEmail,
            UserRole: log.userRole,
            IPAddress: log.ipAddress || '',
            EntityID: log.entityId || '',
            Metadata: JSON.stringify(log.metadata || {}),
        }));
        await (0, auditService_1.logAudit)({
            userId: req.user?._id,
            userEmail: req.user?.email || 'SYSTEM',
            userRole: req.user?.role,
            action: 'EXPORT_REPORT',
            module: 'REPORTS',
            metadata: { reportType: 'Audit Log Trail', format },
            req,
        });
        if (format === 'csv') {
            const csv = jsonToCsv(reportData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="SecureHemas_Audit_Trail_${Date.now()}.csv"`);
            res.status(200).send(csv);
            return;
        }
        res.status(200).json({
            success: true,
            reportType: 'Audit Log Trail',
            generatedAt: new Date(),
            data: reportData,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to export audit report.',
            error: error.message,
        });
    }
};
exports.exportAuditLogsReport = exportAuditLogsReport;
