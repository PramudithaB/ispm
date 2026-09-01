import { PolicyAcknowledgement as PrismaPolicyAcknowledgement } from '@prisma/client';

export type IPolicyAcknowledgement = PrismaPolicyAcknowledgement & {
  _id?: string;
  policy?: any;
  user?: any;
};
