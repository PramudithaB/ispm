import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQuizQuestion {
  questionId: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-based index
  explanation: string;
}

export interface IQuiz extends Document {
  trainingModuleId: Types.ObjectId;
  passingScore: number;
  questions: IQuizQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>(
  {
    questionId: { type: String, required: true },
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

const QuizSchema = new Schema<IQuiz>(
  {
    trainingModuleId: {
      type: Schema.Types.ObjectId,
      ref: 'TrainingModule',
      required: true,
      unique: true,
    },
    passingScore: {
      type: Number,
      default: 80,
      min: 50,
      max: 100,
      required: true,
    },
    questions: {
      type: [QuizQuestionSchema],
      required: true,
      validate: [
        (val: IQuizQuestion[]) => val.length > 0,
        'Quiz must contain at least one question',
      ],
    },
  },
  {
    timestamps: true,
  }
);

export const Quiz = mongoose.model<IQuiz>('Quiz', QuizSchema);
