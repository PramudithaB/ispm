import { Request } from 'express';
import { Types } from 'mongoose';
import { AuditLog, AuditAction, AuditModule } from '../models/AuditLog';

interface LogAuditParams {
  userId?: Types.ObjectId | string | null;
  userEmail: string;
  userRole?: string;
  action: AuditAction;
  module: AuditModule;
  entityId?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  req?: Request;
}

export const logAudit = async (params: LogAuditParams): Promise<void> => {
  try {
    let ip = params.ipAddress;
    if (!ip && params.req) {
      ip = (params.req.headers['x-forwarded-for'] as string) || params.req.socket.remoteAddress || '127.0.0.1';
    }

    await AuditLog.create({
      userId: params.userId ? new Types.ObjectId(params.userId.toString()) : null,
      userEmail: params.userEmail,
      userRole: params.userRole || 'SYSTEM',
      action: params.action,
      module: params.module,
      entityId: params.entityId || '',
      ipAddress: ip || '127.0.0.1',
      metadata: params.metadata || {},
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('⚠️ Failed to write audit log entry:', error);
  }
};
