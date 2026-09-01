import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { unreadOnly } = req.query;

    const where: any = { userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications: notifications.map((n) => ({
        ...n,
        _id: n.id,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications.',
      error: error.message,
    });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notificationId = req.params.id;
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update notification.',
      error: error.message,
    });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read.',
      error: error.message,
    });
  }
};
