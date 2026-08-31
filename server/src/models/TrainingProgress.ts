import mongoose, { Schema, Document, Types } from 'mongoose';

export type ProgressStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';

export interface IUserQuizAnswer {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
}

export interface ITrainingProgress extends Document {
  userId: Types.ObjectId;
  trainingModuleId: Types.ObjectId;
  status: ProgressStatus;
  score: number;
  attempts: number;
  quizAnswers: IUserQuizAnswer[];
  startedAt?: Date | null;
  completedAt?: Date | null;
  dueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserQuizAnswerSchema = new Schema<IUserQuizAnswer>(
  {
    questionId: { type: String, required: true },
    selectedOption: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const TrainingProgressSchema = new Schema<ITrainingProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    trainingModuleId: {
      type: Schema.Types.ObjectId,
      ref: 'TrainingModule',
      required: true,
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'Overdue'],
      default: 'Not Started',
      required: true,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    quizAnswers: [UserQuizAnswerSchema],
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

TrainingProgressSchema.index(
  { userId: 1, trainingModuleId: 1 },
  { unique: true }
);

TrainingProgressSchema.index({ status: 1 });
TrainingProgressSchema.index({ userId: 1 });
TrainingProgressSchema.index({ trainingModuleId: 1 });

export const TrainingProgress = mongoose.model<ITrainingProgress>(
  'TrainingProgress',
  TrainingProgressSchema
);
