'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  toggleEmailNotificationSetting,
  sendTestNotificationEmail,
} from '@/app/actions/notification-actions';
import { Bell, CheckCheck, Mail, Send, Sparkles, Clock } from 'lucide-react';

interface NotificationBellProps {
  isDark?: boolean;
}

export function NotificationBell({ isDark = true }: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{ type: 'ok' | 'warn'; text: string } | null>(
    null
  );

  const ref = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    const res = await getMyNotifications();
    if (res.success) {
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
      setEmailEnabled(res.emailNotifyEnabled);
      setSmtpConfigured(res.smtpConfigured);
    }
  };

  useEffect(() => {
    loadNotifications();
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
    setStatusBanner(null);
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

  const handleToggleEmail = async () => {
    const next = !emailEnabled;
    setEmailEnabled(next);
    await toggleEmailNotificationSetting(next);
  };

  const handleSendTestMail = async () => {
    setSendingTest(true);
    setStatusBanner(null);
    const res = await sendTestNotificationEmail();
    setSendingTest(false);
    loadNotifications();

    if (res.success) {
      setStatusBanner({ type: 'ok', text: res.message || 'Đã gửi email thành công!' });
    } else {
      setStatusBanner({
        type: 'warn',
        text: res.error || 'Chưa cấu hình SMTP_USER / SMTP_PASS trên Vercel',
      });
    }
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
        title="Thông báo & Cài đặt Gmail"
      >
        <Bell className="w-4 h-4" />
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
              <Bell className="w-4 h-4 text-[#579DFF]" />
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
                <CheckCheck className="w-3.5 h-3.5" /> Đọc tất cả
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

          {/* Status Banner */}
          {statusBanner && (
            <div
              className={`px-4 py-2 text-[11px] border-b ${
                statusBanner.type === 'ok'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              {statusBanner.text}
            </div>
          )}

          {/* Notification Items */}
          <div className="max-h-72 overflow-y-auto divide-y divide-[#2C333A]/50">
            {visibleItems.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-1.5 opacity-65">
                <Sparkles className="w-5 h-5 mx-auto text-[#579DFF]" />
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
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer: Email Preference & Test Mail Button */}
          <div
            className={`px-4 py-3 border-t flex items-center justify-between gap-2 text-[11px] ${
              isDark ? 'border-[#2C333A] bg-[#1D2125]' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={handleToggleEmail}
                className="accent-[#0C66E4] w-3.5 h-3.5 rounded cursor-pointer"
              />
              <span className="inline-flex items-center gap-1 font-medium">
                <Mail className="w-3.5 h-3.5 text-[#579DFF]" />
                Gửi về Gmail
              </span>
            </label>

            <button
              type="button"
              disabled={sendingTest}
              onClick={handleSendTestMail}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                smtpConfigured
                  ? 'bg-[#0C66E4] hover:bg-[#0055CC] text-white'
                  : isDark
                  ? 'bg-[#2C333A] hover:bg-[#38414A] text-[#B6C2CF]'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
              title="Gửi thử 1 email kiểm tra tới Gmail của bạn"
            >
              <Send className="w-3 h-3" />
              {sendingTest ? 'Đang gửi...' : 'Test Mail'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
