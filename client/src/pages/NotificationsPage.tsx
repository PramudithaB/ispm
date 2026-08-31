import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/api';
import { INotification } from '../types';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Bell,
  CheckCircle2,
  FileText,
  GraduationCap,
  AlertTriangle,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterUnread, setFilterUnread] = useState<boolean>(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await notificationService.getNotifications(
        filterUnread ? { unreadOnly: 'true' } : {}
      );
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filterUnread]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClickNotification = async (notif: INotification) => {
    if (!notif.isRead) {
      try {
        await notificationService.markRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'policy':
        return <FileText className="w-5 h-5 text-brand-600" />;
      case 'training':
        return <GraduationCap className="w-5 h-5 text-purple-600" />;
      case 'incident':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      default:
        return <Shield className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Hospital Security Notifications
            </h1>
            {unreadCount > 0 && (
              <Badge variant="danger" size="sm">
                {unreadCount} Unread
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time notifications regarding newly published policies, training deadlines, and incident triage updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-brand-600" /> Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilterUnread(false)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            !filterUnread
              ? 'bg-brand-50 text-brand-700 border border-brand-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilterUnread(true)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterUnread
              ? 'bg-brand-50 text-brand-700 border border-brand-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <LoadingSpinner message="Fetching notifications..." />
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Notifications</h3>
          <p className="text-xs text-slate-400 mt-1">You are completely up to date.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => handleClickNotification(notif)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                !notif.isRead
                  ? 'bg-white border-brand-200 shadow-sm ring-1 ring-brand-100 hover:border-brand-300'
                  : 'bg-white/80 border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  !notif.isRead ? 'bg-brand-50' : 'bg-slate-100'
                }`}
              >
                {getNotificationIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {notif.title}
                  </h4>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {notif.message}
                </p>
                {notif.link && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-brand-600 font-semibold mt-2 hover:underline">
                    Open related module <ExternalLink className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
