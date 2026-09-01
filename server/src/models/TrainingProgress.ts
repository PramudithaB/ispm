import { TrainingProgress as PrismaTrainingProgress } from '@prisma/client';

export type ProgressStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';

export interface IUserQuizAnswer {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
}

export type ITrainingProgress = PrismaTrainingProgress & {
  _id?: string;
  quizAnswers?: IUserQuizAnswer[];
  user?: any;
  trainingModule?: any;
};
