import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPolicyAcknowledgement extends Document {
  policyId: Types.ObjectId;
  policyVersion: string;
  userId: Types.ObjectId;
  acknowledgedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PolicyAcknowledgementSchema = new Schema<IPolicyAcknowledgement>(
  {
    policyId: {
      type: Schema.Types.ObjectId,
      ref: 'Policy',
      required: true,
    },
    policyVersion: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    acknowledgedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate acknowledgement for the exact same policy version by the same user
PolicyAcknowledgementSchema.index(
  { policyId: 1, policyVersion: 1, userId: 1 },
  { unique: true }
);

PolicyAcknowledgementSchema.index({ userId: 1 });
PolicyAcknowledgementSchema.index({ policyId: 1 });

export const PolicyAcknowledgement = mongoose.model<IPolicyAcknowledgement>(
  'PolicyAcknowledgement',
  PolicyAcknowledgementSchema
);
