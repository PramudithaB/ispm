"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyCompliance = exports.getDepartmentStaffCompliance = exports.getDepartmentCompliance = exports.getComplianceSummary = void 0;
const User_1 = require("../models/User");
const Policy_1 = require("../models/Policy");
const PolicyAcknowledgement_1 = require("../models/PolicyAcknowledgement");
const TrainingModule_1 = require("../models/TrainingModule");
const TrainingProgress_1 = require("../models/TrainingProgress");
const Department_1 = require("../models/Department");
const Incident_1 = require("../models/Incident");
const getComplianceSummary = async (req, res) => {
    try {
        const [totalStaff, publishedPolicies, publishedTrainings, totalAcks, completedProgresses, openIncidents,] = await Promise.all([
            User_1.User.countDocuments({ isActive: true }),
            Policy_1.Policy.find({ status: 'Published' }),
            TrainingModule_1.TrainingModule.find({ status: 'Published' }),
            PolicyAcknowledgement_1.PolicyAcknowledgement.countDocuments(),
            TrainingProgress_1.TrainingProgress.countDocuments({ status: 'Completed' }),
            Incident_1.Incident.countDocuments({ status: { $in: ['Open', 'In Review'] } }),
        ]);
        const totalPolicyExpectations = totalStaff * publishedPolicies.length;
        const policyAckRate = totalPolicyExpectations > 0
            ? Math.min(100, Math.round((totalAcks / totalPolicyExpectations) * 100))
            : 100;
        const totalTrainingExpectations = totalStaff * publishedTrainings.length;
        const trainingCompletionRate = totalTrainingExpectations > 0
            ? Math.min(100, Math.round((completedProgresses / totalTrainingExpectations) * 100))
            : 100;
        const overallComplianceScore = Math.round(policyAckRate * 0.5 + trainingCompletionRate * 0.5);
        // Overdue count
        const now = new Date();
        const overdueTrainings = await TrainingProgress_1.TrainingProgress.countDocuments({
            status: { $ne: 'Completed' },
            dueDate: { $lt: now },
        });
        res.status(200).json({
            success: true,
            summary: {
                totalStaff,
                publishedPoliciesCount: publishedPolicies.length,
                publishedTrainingsCount: publishedTrainings.length,
                policyAckRate,
                trainingCompletionRate,
                overallComplianceScore,
                openIncidents,
                overdueTrainings,
                totalAcks,
                completedProgresses,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate compliance summary.',
            error: error.message,
        });
    }
};
exports.getComplianceSummary = getComplianceSummary;
const getDepartmentCompliance = async (req, res) => {
    try {
        const departments = await Department_1.Department.find().sort({ name: 1 });
        const publishedPolicies = await Policy_1.Policy.find({ status: 'Published' });
        const publishedTrainings = await TrainingModule_1.TrainingModule.find({ status: 'Published' });
        const departmentStats = await Promise.all(departments.map(async (dept) => {
            const staff = await User_1.User.find({ department: dept._id, isActive: true });
            const staffCount = staff.length;
            const staffIds = staff.map((s) => s._id);
            if (staffCount === 0) {
                return {
                    _id: dept._id,
                    name: dept.name,
                    site: dept.site,
                    staffCount: 0,
                    policyAckRate: 100,
                    trainingCompletionRate: 100,
                    overallCompliance: 100,
                    overdueCount: 0,
                };
            }
            const [acksCount, completionsCount, overdueCount] = await Promise.all([
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
            const policyAckRate = expectedAcks > 0
                ? Math.min(100, Math.round((acksCount / expectedAcks) * 100))
                : 100;
            const expectedTrainings = staffCount * publishedTrainings.length;
            const trainingCompletionRate = expectedTrainings > 0
                ? Math.min(100, Math.round((completionsCount / expectedTrainings) * 100))
                : 100;
            const overallCompliance = Math.round(policyAckRate * 0.5 + trainingCompletionRate * 0.5);
            return {
                _id: dept._id,
                name: dept.name,
                site: dept.site,
                staffCount,
                policyAckRate,
                trainingCompletionRate,
                overallCompliance,
                overdueCount,
            };
        }));
        res.status(200).json({
            success: true,
            departments: departmentStats,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch department compliance statistics.',
            error: error.message,
        });
    }
};
exports.getDepartmentCompliance = getDepartmentCompliance;
const getDepartmentStaffCompliance = async (req, res) => {
    try {
        const deptId = req.params.deptId;
        const department = await Department_1.Department.findById(deptId);
        if (!department) {
            res.status(404).json({ success: false, message: 'Department not found.' });
            return;
        }
        const [staff, publishedPolicies, publishedTrainings] = await Promise.all([
            User_1.User.find({ department: deptId, isActive: true }),
            Policy_1.Policy.find({ status: 'Published' }),
            TrainingModule_1.TrainingModule.find({ status: 'Published' }),
        ]);
        const staffComplianceList = await Promise.all(staff.map(async (member) => {
            const [acks, progresses] = await Promise.all([
                PolicyAcknowledgement_1.PolicyAcknowledgement.find({ userId: member._id }),
                TrainingProgress_1.TrainingProgress.find({ userId: member._id }),
            ]);
            const acksCount = acks.length;
            const totalPolicies = publishedPolicies.length;
            const policyRate = totalPolicies > 0 ? Math.min(100, Math.round((acksCount / totalPolicies) * 100)) : 100;
            const completedTrainingsCount = progresses.filter((p) => p.status === 'Completed').length;
            const totalTrainings = publishedTrainings.length;
            const trainingRate = totalTrainings > 0
                ? Math.min(100, Math.round((completedTrainingsCount / totalTrainings) * 100))
                : 100;
            const overallScore = Math.round(policyRate * 0.5 + trainingRate * 0.5);
            const overdueCount = progresses.filter((p) => p.status !== 'Completed' && p.dueDate && new Date(p.dueDate).getTime() < Date.now()).length;
            return {
                _id: member._id,
                employeeId: member.employeeId,
                fullName: member.fullName,
                email: member.email,
                position: member.position,
                policyRate,
                trainingRate,
                overallScore,
                acknowledgedPoliciesCount: acksCount,
                totalPoliciesCount: totalPolicies,
                completedTrainingsCount,
                totalTrainingsCount: totalTrainings,
                overdueCount,
            };
        }));
        res.status(200).json({
            success: true,
            department: {
                _id: department._id,
                name: department.name,
                site: department.site,
            },
            staff: staffComplianceList,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch department staff compliance breakdown.',
            error: error.message,
        });
    }
};
exports.getDepartmentStaffCompliance = getDepartmentStaffCompliance;
const getMyCompliance = async (req, res) => {
    try {
        const userId = req.user._id;
        const [publishedPolicies, publishedTrainings, userAcks, userProgresses] = await Promise.all([
            Policy_1.Policy.find({ status: 'Published' }),
            TrainingModule_1.TrainingModule.find({ status: 'Published' }),
            PolicyAcknowledgement_1.PolicyAcknowledgement.find({ userId }),
            TrainingProgress_1.TrainingProgress.find({ userId }).populate('trainingModuleId', 'title category dueDate'),
        ]);
        const ackPolicyIds = new Set(userAcks.map((a) => a.policyId.toString()));
        const completedProgressMap = new Map(userProgresses.map((p) => [p.trainingModuleId?._id?.toString() || p.trainingModuleId.toString(), p]));
        const totalPolicies = publishedPolicies.length;
        const acknowledgedCount = publishedPolicies.filter((p) => ackPolicyIds.has(p._id.toString())).length;
        const policyRate = totalPolicies > 0 ? Math.min(100, Math.round((acknowledgedCount / totalPolicies) * 100)) : 100;
        const totalTrainings = publishedTrainings.length;
        const completedTrainingsCount = publishedTrainings.filter((t) => {
            const p = completedProgressMap.get(t._id.toString());
            return p && p.status === 'Completed';
        }).length;
        const trainingRate = totalTrainings > 0
            ? Math.min(100, Math.round((completedTrainingsCount / totalTrainings) * 100))
            : 100;
        const overallScore = Math.round(policyRate * 0.5 + trainingRate * 0.5);
        // Pending Policies Checklist
        const pendingPolicies = publishedPolicies
            .filter((p) => !ackPolicyIds.has(p._id.toString()))
            .map((p) => ({
            _id: p._id,
            title: p.title,
            category: p.category,
            version: p.version,
            effectiveDate: p.effectiveDate,
        }));
        // Pending / Due Trainings Checklist
        const pendingTrainings = publishedTrainings
            .filter((t) => {
            const p = completedProgressMap.get(t._id.toString());
            return !p || p.status !== 'Completed';
        })
            .map((t) => {
            const p = completedProgressMap.get(t._id.toString());
            const isOverdue = t.dueDate && new Date(t.dueDate).getTime() < Date.now();
            return {
                _id: t._id,
                title: t.title,
                category: t.category,
                dueDate: t.dueDate,
                durationMinutes: t.durationMinutes,
                status: isOverdue ? 'Overdue' : p?.status || 'Not Started',
                score: p?.score || 0,
            };
        });
        res.status(200).json({
            success: true,
            myCompliance: {
                overallScore,
                policyRate,
                trainingRate,
                acknowledgedCount,
                totalPolicies,
                completedTrainingsCount,
                totalTrainings,
                pendingPolicies,
                pendingTrainings,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch personal compliance profile.',
            error: error.message,
        });
    }
};
exports.getMyCompliance = getMyCompliance;
