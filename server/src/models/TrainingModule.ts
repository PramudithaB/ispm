import { TrainingModule as PrismaTrainingModule } from '@prisma/client';

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

export type ITrainingModule = PrismaTrainingModule & {
  _id?: string;
  content: ITrainingContent | any;
  assignedRoles: string[] | any;
  assignedDepartmentIds?: string[] | any;
  assignedDepartments?: any[];
  createdBy?: any;
  userStatus?: string;
  userScore?: number;
  userAttempts?: number;
  progress?: any;
  hasQuiz?: boolean;
  questionCount?: number;
};
