import mongoose, { Schema, Document, Types } from 'mongoose';

export type PolicyStatus = 'Draft' | 'Published' | 'Archived';
export type PolicyCategory =
  | 'Data Privacy & Confidentiality'
  | 'Access Control & Passwords'
  | 'Device & Endpoint Security'
  | 'Incident Response'
  | 'Physical & Environmental Security'
  | 'Acceptable Use Policy';

export interface IPolicyVersion {
  version: string;
  title: string;
  content: string;
  changelog?: string;
  publishedAt?: Date;
  archivedAt?: Date;
  changedBy?: Types.ObjectId;
}

export interface IPolicy extends Document {
  title: string;
  description: string;
  content: string;
  category: PolicyCategory;
  department?: Types.ObjectId | null;
  version: string;
  status: PolicyStatus;
  effectiveDate: Date;
  publishedAt?: Date | null;
  changelog?: string;
  previousVersions: IPolicyVersion[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PolicyVersionSchema = new Schema<IPolicyVersion>(
  {
    version: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    changelog: { type: String, default: '' },
    publishedAt: { type: Date },
    archivedAt: { type: Date },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const PolicySchema = new Schema<IPolicy>(
  {
    title: {
      type: String,
      required: [true, 'Policy title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Policy description is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Policy content is required'],
    },
    category: {
      type: String,
      enum: [
        'Data Privacy & Confidentiality',
        'Access Control & Passwords',
        'Device & Endpoint Security',
        'Incident Response',
        'Physical & Environmental Security',
        'Acceptable Use Policy',
      ],
      required: true,
      default: 'Data Privacy & Confidentiality',
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      default: null, // null means applies to all departments
    },
    version: {
      type: String,
      required: true,
      default: '1.0',
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Archived'],
      default: 'Draft',
      required: true,
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    changelog: {
      type: String,
      default: 'Initial policy creation',
    },
    previousVersions: [PolicyVersionSchema],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

PolicySchema.index({ status: 1, category: 1 });
PolicySchema.index({ department: 1 });

export const Policy = mongoose.model<IPolicy>('Policy', PolicySchema);
