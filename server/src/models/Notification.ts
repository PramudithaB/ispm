import { Notification as PrismaNotification } from '@prisma/client';

export type NotificationType = 'policy' | 'training' | 'incident' | 'system' | 'alert';

export type INotification = PrismaNotification & {
  _id?: string;
  user?: any;
};
