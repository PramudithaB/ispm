import mongoose, { Schema, Document, Types } from 'mongoose';

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

export interface IAuditLog extends Document {
  userId?: Types.ObjectId | null;
  userEmail: string;
  userRole: string;
  action: AuditAction;
  module: AuditModule;
  entityId?: string;
  timestamp: Date;
  ipAddress?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
    },
    userRole: {
      type: String,
      required: true,
      default: 'SYSTEM',
    },
    action: {
      type: String,
      required: true,
    },
    module: {
      type: String,
      enum: [
        'AUTH',
        'POLICIES',
        'TRAINING',
        'COMPLIANCE',
        'INCIDENTS',
        'USERS',
        'DEPARTMENTS',
        'REPORTS',
        'SYSTEM',
      ],
      required: true,
    },
    entityId: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable audit log
  }
);

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ module: 1 });
AuditLogSchema.index({ userEmail: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
