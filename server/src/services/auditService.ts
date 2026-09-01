import { Request } from 'express';
import { prisma } from '../config/db';

export type AuditAction =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'CREATE_POLICY'
  | 'UPDATE_POLICY'
  | 'PUBLISH_POLICY'
  | 'ARCHIVE_POLICY'
  | 'ACKNOWLEDGE_POLICY'
  | 'CREATE_TRAINING'
  | 'UPDATE_TRAINING'
  | 'COMPLETE_TRAINING'
  | 'QUIZ_SUBMISSION'
  | 'CREATE_INCIDENT'
  | 'UPDATE_INCIDENT'
  | 'RESOLVE_INCIDENT'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_LOCKED'
  | 'USER_UNLOCKED'
  | 'EXPORT_REPORT';

export type AuditModule =
  | 'AUTH'
  | 'POLICIES'
  | 'TRAINING'
  | 'COMPLIANCE'
  | 'INCIDENTS'
  | 'USERS'
  | 'DEPARTMENTS'
  | 'REPORTS'
  | 'SYSTEM';

interface LogAuditParams {
  userId?: string | null;
  userEmail: string;
  userRole?: string;
  action: AuditAction | string;
  module: AuditModule | string;
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

    await prisma.auditLog.create({
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
  } catch (error) {
    console.error('⚠️ Failed to write audit log entry to MySQL:', error);
  }
};
