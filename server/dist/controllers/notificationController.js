"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const db_1 = require("../config/db");
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { unreadOnly } = req.query;
        const where = { userId };
        if (unreadOnly === 'true') {
            where.isRead = false;
        }
        const [notifications, unreadCount] = await Promise.all([
            db_1.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: 50,
            }),
            db_1.prisma.notification.count({
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications.',
            error: error.message,
        });
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.id;
        await db_1.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true },
        });
        res.status(200).json({
            success: true,
            message: 'Notification marked as read.',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update notification.',
            error: error.message,
        });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await db_1.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        res.status(200).json({
            success: true,
            message: 'All notifications marked as read.',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to mark notifications as read.',
            error: error.message,
        });
    }
};
exports.markAllAsRead = markAllAsRead;
