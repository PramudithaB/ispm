"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = void 0;
const mongoose_1 = require("mongoose");
const AuditLog_1 = require("../models/AuditLog");
const logAudit = async (params) => {
    try {
        let ip = params.ipAddress;
        if (!ip && params.req) {
            ip = params.req.headers['x-forwarded-for'] || params.req.socket.remoteAddress || '127.0.0.1';
        }
        await AuditLog_1.AuditLog.create({
            userId: params.userId ? new mongoose_1.Types.ObjectId(params.userId.toString()) : null,
            userEmail: params.userEmail,
            userRole: params.userRole || 'SYSTEM',
            action: params.action,
            module: params.module,
            entityId: params.entityId || '',
            ipAddress: ip || '127.0.0.1',
            metadata: params.metadata || {},
            timestamp: new Date(),
        });
    }
    catch (error) {
        console.error('⚠️ Failed to write audit log entry:', error);
    }
};
exports.logAudit = logAudit;
