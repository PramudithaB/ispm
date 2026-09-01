"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = void 0;
const db_1 = require("../config/db");
const logAudit = async (params) => {
    try {
        let ip = params.ipAddress;
        if (!ip && params.req) {
            ip = params.req.headers['x-forwarded-for'] || params.req.socket.remoteAddress || '127.0.0.1';
        }
        await db_1.prisma.auditLog.create({
            data: {
                userId: params.userId || null,
                userEmail: params.userEmail,
                userRole: params.userRole || 'SYSTEM',
                action: params.action,
                module: params.module,
                entityId: params.entityId || '',
                ipAddress: ip || '127.0.0.1',
                metadata: params.metadata || {},
                timestamp: new Date(),
            },
        });
    }
    catch (error) {
        console.error('⚠️ Failed to write audit log entry to MySQL:', error);
    }
};
exports.logAudit = logAudit;
