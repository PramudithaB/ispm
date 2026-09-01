import { Incident as PrismaIncident } from '@prisma/client';

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
  author: any;
  note: string;
  createdAt: string | Date;
}

export type IIncident = PrismaIncident & {
  _id?: string;
  reportedBy?: any;
  assignedTo?: any;
  department?: any;
  notes: IIncidentNote[] | any;
};
