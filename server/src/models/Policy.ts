import { Policy as PrismaPolicy, PolicyVersion as PrismaPolicyVersion } from '@prisma/client';

export type PolicyStatus = 'Draft' | 'Published' | 'Archived';
export type PolicyCategory =
  | 'Data Privacy & Confidentiality'
  | 'Access Control & Passwords'
  | 'Device & Endpoint Security'
  | 'Incident Response'
  | 'Physical & Environmental Security'
  | 'Acceptable Use Policy';

export type IPolicyVersion = PrismaPolicyVersion & {
  _id?: string;
};

export type IPolicy = PrismaPolicy & {
  _id?: string;
  department?: any;
  createdBy?: any;
  updatedBy?: any;
  versions?: IPolicyVersion[];
  previousVersions?: any[];
  isAcknowledged?: boolean;
  acknowledgementDetails?: any;
};
