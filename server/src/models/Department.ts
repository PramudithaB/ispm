import { Department as PrismaDepartment } from '@prisma/client';

export type IDepartment = PrismaDepartment & {
  _id?: string;
};
