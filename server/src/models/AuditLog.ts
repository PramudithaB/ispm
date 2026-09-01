import { AuditLog as PrismaAuditLog } from '@prisma/client';
import { AuditAction, AuditModule } from '../services/auditService';

export { AuditAction, AuditModule };

export type IAuditLog = PrismaAuditLog & {
  _id?: string;
  user?: any;
};
