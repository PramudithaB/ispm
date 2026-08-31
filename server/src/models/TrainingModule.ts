import mongoose, { Schema, Document, Types } from 'mongoose';

export type TrainingCategory =
  | 'Patient Data Confidentiality'
  | 'Phishing Awareness'
  | 'Social Engineering'
  | 'Password Hygiene'
  | 'Device Security'
  | 'Physical Security';

export interface ILearningSection {
  title: string;
  body: string;
  icon?: string;
  highlights?: string[];
}

export interface ISecurityExample {
  scenario: string;
  correctAction: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  clinicalImpact?: string;
}

export interface ITrainingContent {
  introduction: string;
  sections: ILearningSection[];
  examples: ISecurityExample[];
  keyTakeaways: string[];
}

export interface ITrainingModule extends Document {
  title: string;
  description: string;
  category: TrainingCategory;
  durationMinutes: number;
  content: ITrainingContent;
  assignedRoles: string[];
  assignedDepartments: Types.ObjectId[];
  dueDate?: Date | null;
  passingScore: number;
  version: string;
  status: 'Draft' | 'Published' | 'Archived';
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LearningSectionSchema = new Schema<ILearningSection>(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    icon: { type: String, default: 'book' },
    highlights: [{ type: String }],
  },
  { _id: false }
);

const SecurityExampleSchema = new Schema<ISecurityExample>(
  {
    scenario: { type: String, required: true },
    correctAction: { type: String, required: true },
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    clinicalImpact: { type: String },
  },
  { _id: false }
);

const TrainingContentSchema = new Schema<ITrainingContent>(
  {
    introduction: { type: String, required: true },
    sections: [LearningSectionSchema],
    examples: [SecurityExampleSchema],
    keyTakeaways: [{ type: String }],
  },
  { _id: false }
);

const TrainingModuleSchema = new Schema<ITrainingModule>(
  {
    title: {
      type: String,
      required: [true, 'Training title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Training description is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Patient Data Confidentiality',
        'Phishing Awareness',
        'Social Engineering',
        'Password Hygiene',
        'Device Security',
        'Physical Security',
      ],
      required: true,
    },
    durationMinutes: {
      type: Number,
      default: 15,
      required: true,
    },
    content: {
      type: TrainingContentSchema,
      required: true,
    },
    assignedRoles: {
      type: [String],
      default: [], // Empty array = all roles
    },
    assignedDepartments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Department',
      },
    ],
    dueDate: {
      type: Date,
      default: null,
    },
    passingScore: {
      type: Number,
      default: 80,
      min: 50,
      max: 100,
      required: true,
    },
    version: {
      type: String,
      default: '1.0',
      required: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Archived'],
      default: 'Published',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

TrainingModuleSchema.index({ status: 1, category: 1 });

export const TrainingModule = mongoose.model<ITrainingModule>(
  'TrainingModule',
  TrainingModuleSchema
);
