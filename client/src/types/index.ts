export type UserRole = 'STAFF' | 'DEPARTMENT_HEAD' | 'ADMIN' | 'IT_SECURITY_ADMIN';

export interface IDepartment {
  _id: string;
  name: string;
  description?: string;
  site: string;
  staffCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IUser {
  _id: string;
  employeeId: string;
  fullName: string;
  email: string;
  role: UserRole;
  department?: IDepartment | string | null;
  site: string;
  position: string;
  isActive: boolean;
  failedLoginAttempts?: number;
  lockUntil?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

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
  publishedAt?: string;
  archivedAt?: string;
  changedBy?: any;
}

export interface IPolicy {
  _id: string;
  title: string;
  description: string;
  content: string;
  category: PolicyCategory;
  department?: IDepartment | null;
  version: string;
  status: PolicyStatus;
  effectiveDate: string;
  publishedAt?: string | null;
  changelog?: string;
  previousVersions?: IPolicyVersion[];
  createdBy?: IUser;
  updatedBy?: IUser;
  isAcknowledged?: boolean;
  acknowledgementDetails?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPolicyAcknowledgement {
  _id: string;
  policyId: string | IPolicy;
  policyVersion: string;
  userId: string | IUser;
  acknowledgedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

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

export interface ITrainingModule {
  _id: string;
  title: string;
  description: string;
  category: TrainingCategory;
  durationMinutes: number;
  content: ITrainingContent;
  assignedRoles: string[];
  assignedDepartments?: IDepartment[];
  dueDate?: string | null;
  passingScore: number;
  version: string;
  status: 'Draft' | 'Published' | 'Archived';
  pdfFileName?: string | null;
  pdfFilePath?: string | null;
  createdBy?: IUser;
  userStatus?: 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';
  userScore?: number;
  userAttempts?: number;
  progress?: ITrainingProgress | null;
  hasQuiz?: boolean;
  questionCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IQuizQuestion {
  questionId: string;
  question: string;
  options: string[];
  correctAnswer?: number;
  explanation?: string;
}

export interface IQuiz {
  trainingModuleId: string;
  passingScore: number;
  questionCount: number;
  questions: IQuizQuestion[];
}

export interface ITrainingProgress {
  _id: string;
  userId: string | IUser;
  trainingModuleId: string | ITrainingModule;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';
  score: number;
  attempts: number;
  startedAt?: string | null;
  completedAt?: string | null;
  dueDate?: string | null;
}

export interface IQuizSubmissionResult {
  passed: boolean;
  score: number;
  passingScore: number;
  correctCount: number;
  totalQuestions: number;
  attempts: number;
  completedAt?: string;
  questions: Array<{
    questionId: string;
    question: string;
    options: string[];
    selectedOption: number;
    correctAnswer: number;
    isCorrect: boolean;
    explanation: string;
  }>;
}

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
  author: IUser;
  note: string;
  createdAt: string;
}

export interface IIncident {
  _id: string;
  incidentNumber: string;
  reportedBy: IUser;
  incidentType: IncidentType;
  title: string;
  description: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  department?: IDepartment | null;
  assignedTo?: IUser | null;
  resolutionNotes?: string;
  notes?: IIncidentNote[];
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface INotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'policy' | 'training' | 'incident' | 'system' | 'alert';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface IAuditLog {
  _id: string;
  userId?: IUser | null;
  userEmail: string;
  userRole: string;
  action: string;
  module: string;
  entityId?: string;
  timestamp: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export interface IComplianceSummary {
  totalStaff: number;
  publishedPoliciesCount: number;
  publishedTrainingsCount: number;
  policyAckRate: number;
  trainingCompletionRate: number;
  overallComplianceScore: number;
  openIncidents: number;
  overdueTrainings: number;
  totalAcks: number;
  completedProgresses: number;
}

export interface IDepartmentCompliance {
  _id: string;
  name: string;
  site: string;
  staffCount: number;
  policyAckRate: number;
  trainingCompletionRate: number;
  overallCompliance: number;
  overdueCount: number;
}

export interface IStaffComplianceDrilldown {
  _id: string;
  employeeId: string;
  fullName: string;
  email: string;
  position: string;
  policyRate: number;
  trainingRate: number;
  overallScore: number;
  acknowledgedPoliciesCount: number;
  totalPoliciesCount: number;
  completedTrainingsCount: number;
  totalTrainingsCount: number;
  overdueCount: number;
}
