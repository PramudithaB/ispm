"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = void 0;
const AuditLog_1 = require("../models/AuditLog");
const getAuditLogs = async (req, res) => {
    try {
        const { action, module, userEmail, startDate, endDate, search, limit = '100', page = '1' } = req.query;
        const filter = {};
        if (action)
            filter.action = action;
        if (module)
            filter.module = module;
        if (userEmail)
            filter.userEmail = new RegExp(userEmail, 'i');
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate)
                filter.timestamp.$gte = new Date(startDate);
            if (endDate)
                filter.timestamp.$lte = new Date(endDate);
        }
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [
                { action: searchRegex },
                { module: searchRegex },
                { userEmail: searchRegex },
                { ipAddress: searchRegex },
                { entityId: searchRegex },
            ];
        }
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 100;
        const skip = (pageNum - 1) * limitNum;
        const [logs, total] = await Promise.all([
            AuditLog_1.AuditLog.find(filter)
                .populate('userId', 'fullName employeeId position')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limitNum),
            AuditLog_1.AuditLog.countDocuments(filter),
        ]);
        res.status(200).json({
            success: true,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            count: logs.length,
            logs,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit trail records.',
            error: error.message,
        });
    }
};
exports.getAuditLogs = getAuditLogs;
