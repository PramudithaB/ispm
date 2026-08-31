import mongoose, { Schema, Document, Types } from 'mongoose';

export type IncidentType =
  | 'Lost Device'
  | 'Phishing'
  | 'Suspicious Email'
  | 'Unauthorized Access'
  | 'Password/Security Issue'
  | 'Other';

export type IncidentPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type IncidentStatus = 'Open' | 'In Review' | 'Resolved';

export interface IIncidentNote {
  author: Types.ObjectId;
  note: string;
  createdAt: Date;
}

export interface IIncident extends Document {
  incidentNumber: string;
  reportedBy: Types.ObjectId;
  incidentType: IncidentType;
  title: string;
  description: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  department?: Types.ObjectId | null;
  assignedTo?: Types.ObjectId | null;
  resolutionNotes?: string;
  notes: IIncidentNote[];
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const IncidentNoteSchema = new Schema<IIncidentNote>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const IncidentSchema = new Schema<IIncident>(
  {
    incidentNumber: {
      type: String,
      unique: true,
      required: true,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    incidentType: {
      type: String,
      enum: [
        'Lost Device',
        'Phishing',
        'Suspicious Email',
        'Unauthorized Access',
        'Password/Security Issue',
        'Other',
      ],
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Incident title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Incident description is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      required: true,
    },
    status: {
      type: String,
      enum: ['Open', 'In Review', 'Resolved'],
      default: 'Open',
      required: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    notes: [IncidentNoteSchema],
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

IncidentSchema.index({ status: 1, priority: 1 });
IncidentSchema.index({ reportedBy: 1 });

export const Incident = mongoose.model<IIncident>('Incident', IncidentSchema);
