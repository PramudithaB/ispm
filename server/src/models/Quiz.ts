import { Quiz as PrismaQuiz, QuizQuestion as PrismaQuizQuestion, QuizAttempt as PrismaQuizAttempt } from '@prisma/client';

export interface IQuizQuestion {
  questionId: string;
  question: string;
  options: string[];
  correctAnswer?: number;
  explanation?: string;
  orderIndex?: number;
}

export type IQuiz = PrismaQuiz & {
  _id?: string;
  questions?: IQuizQuestion[] | PrismaQuizQuestion[];
  questionCount?: number;
};

export type IQuizAttempt = PrismaQuizAttempt & {
  _id?: string;
};
