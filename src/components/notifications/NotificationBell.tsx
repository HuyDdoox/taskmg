'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/app/actions/notification-actions';
import { getSocket } from '@/lib/socket';

interface NotificationBellProps {
  isDark?: boolean;
}

export function NotificationBell({ isDark = true }: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const ref = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    const res = await getMyNotifications();
    if (res.success) {
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    }
  };

  useEffect(() => {
    loadNotifications();

    const s = getSocket();
    const handleRealtimeNotif = () => {
      loadNotifications();
    };
    s.on('notification_received', handleRealtimeNotif);
    window.addEventListener('taskmg:notification', handleRealtimeNotif);

    return () => {
      s.off('notification_received', handleRealtimeNotif);
      window.removeEventListener('taskmg:notification', handleRealtimeNotif);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleOpenToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadNotifications();
  };

  const handleClickItem = async (item: any) => {
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      await markNotificationRead(item.id);
    }
    setOpen(false);
    if (item.projectId) {
      router.push(`/projects/${item.projectId}`);
    }
  };

  const handleMarkAll = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsRead();
  };

  const visibleItems =
    tab === 'UNREAD' ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpenToggle}
        className={`relative p-1.5 rounded-lg border transition-colors cursor-pointer ${
          isDark
            ? 'bg-[#22272B] border-[#38414A] text-[#B6C2CF] hover:text-white hover:bg-[#2C333A]'
            : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
        }`}
        title="Thông báo dự án"
      >
        <i className="fa-solid fa-bell text-sm" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border shadow-2xl z-50 overflow-hidden ${
            isDark
              ? 'bg-[#22272B] border-[#38414A] text-[#DEE4EA] shadow-black/60'
              : 'bg-white border-gray-200 text-gray-800 shadow-gray-300/60'
          }`}
        >
          {/* Header */}
          <div
            className={`px-4 py-3 border-b flex items-center justify-between ${
              isDark ? 'border-[#2C333A] bg-[#1D2125]' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-bell text-sm text-[#579DFF]" />
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Thông báo ({unreadCount} chưa đọc)
              </span>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#579DFF] hover:underline cursor-pointer"
              >
                <i className="fa-solid fa-check-double text-xs" /> Đọc tất cả
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div
            className={`px-4 py-2 border-b flex items-center gap-2 text-xs ${
              isDark ? 'border-[#2C333A]' : 'border-gray-100'
            }`}
          >
            <button
              type="button"
              onClick={() => setTab('ALL')}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                tab === 'ALL'
                  ? 'bg-[#0C66E4] text-white'
                  : isDark
                  ? 'text-[#9FADBC] hover:bg-[#2C333A]'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setTab('UNREAD')}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                tab === 'UNREAD'
                  ? 'bg-[#0C66E4] text-white'
                  : isDark
                  ? 'text-[#9FADBC] hover:bg-[#2C333A]'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {/* Notification Items */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#2C333A]/50">
            {visibleItems.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-1.5 opacity-65">
                <i className="fa-solid fa-wand-magic-sparkles text-base text-[#579DFF]" />
                <div className="text-xs font-medium">Chưa có thông báo mới nào</div>
              </div>
            ) : (
              visibleItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleClickItem(item)}
                  className={`w-full p-3.5 text-left transition-colors flex items-start gap-2.5 cursor-pointer ${
                    !item.isRead
                      ? isDark
                        ? 'bg-[#0C66E4]/10 hover:bg-[#0C66E4]/20'
                        : 'bg-blue-50/60 hover:bg-blue-50'
                      : isDark
                      ? 'hover:bg-[#2C333A]/60'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      !item.isRead ? 'bg-[#579DFF]' : 'bg-transparent'
                    }`}
                  />
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div
                      className={`text-xs font-semibold truncate ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {item.title}
                    </div>
                    <p
                      className={`text-[11px] leading-snug line-clamp-2 ${
                        isDark ? 'text-[#9FADBC]' : 'text-gray-600'
                      }`}
                    >
                      {item.message}
                    </p>
                    <div className="text-[10px] opacity-60 flex items-center gap-1 pt-0.5">
                      <i className="fa-regular fa-clock text-[10px]" />
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
