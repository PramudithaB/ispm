import { UserRole, User as PrismaUser } from '@prisma/client';

export { UserRole };
export type IUser = PrismaUser & {
  _id?: string;
  department?: any;
};
