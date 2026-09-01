"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = void 0;
const db_1 = require("../config/db");
const getAuditLogs = async (req, res) => {
    try {
        const { action, module, userEmail, startDate, endDate, search, limit = '100', page = '1' } = req.query;
        const where = {};
        if (action)
            where.action = action;
        if (module)
            where.module = module;
        if (userEmail)
            where.userEmail = { contains: userEmail };
        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate)
                where.timestamp.gte = new Date(startDate);
            if (endDate)
                where.timestamp.lte = new Date(endDate);
        }
        if (search) {
            const q = String(search);
            where.OR = [
                { action: { contains: q } },
                { module: { contains: q } },
                { userEmail: { contains: q } },
                { ipAddress: { contains: q } },
                { entityId: { contains: q } },
            ];
        }
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 100;
        const skip = (pageNum - 1) * limitNum;
        const [logs, total] = await Promise.all([
            db_1.prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, fullName: true, employeeId: true, position: true },
                    },
                },
                orderBy: { timestamp: 'desc' },
                skip,
                take: limitNum,
            }),
            db_1.prisma.auditLog.count({ where }),
        ]);
        res.status(200).json({
            success: true,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            count: logs.length,
            logs: logs.map((l) => ({
                ...l,
                _id: l.id,
                user: l.user ? { ...l.user, _id: l.user.id } : null,
            })),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit trail records from MySQL.',
            error: error.message,
        });
    }
};
exports.getAuditLogs = getAuditLogs;
