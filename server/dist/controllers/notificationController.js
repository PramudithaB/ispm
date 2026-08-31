"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const Notification_1 = require("../models/Notification");
const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const { unreadOnly } = req.query;
        const filter = { userId };
        if (unreadOnly === 'true') {
            filter.isRead = false;
        }
        const notifications = await Notification_1.Notification.find(filter)
            .sort({ createdAt: -1 })
            .limit(50);
        const unreadCount = await Notification_1.Notification.countDocuments({
            userId,
            isRead: false,
        });
        res.status(200).json({
            success: true,
            unreadCount,
            count: notifications.length,
            notifications,
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
        const notification = await Notification_1.Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { isRead: true }, { new: true });
        if (!notification) {
            res.status(404).json({ success: false, message: 'Notification not found.' });
            return;
        }
        res.status(200).json({
            success: true,
            notification,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read.',
            error: error.message,
        });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        await Notification_1.Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
        res.status(200).json({
            success: true,
            message: 'All notifications marked as read.',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update notifications.',
            error: error.message,
        });
    }
};
exports.markAllAsRead = markAllAsRead;
