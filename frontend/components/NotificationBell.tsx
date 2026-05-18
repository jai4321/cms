'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, AtSign, MessageSquare, GitBranch, Check } from 'lucide-react';
import { useNotificationStore } from '@/store/notification.store';
import type { Notification, NotificationType } from '@/lib/types';

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function typeIcon(type: NotificationType) {
  switch (type) {
    case 'mention':
      return <AtSign className="h-4 w-4 text-indigo-500" />;
    case 'thread_reply':
      return <GitBranch className="h-4 w-4 text-purple-500" />;
    case 'dm':
      return <MessageSquare className="h-4 w-4 text-sky-500" />;
  }
}

function typeLabel(type: NotificationType) {
  switch (type) {
    case 'mention':
      return 'Mentioned you';
    case 'thread_reply':
      return 'Replied in thread';
    case 'dm':
      return 'New message';
  }
}

interface NotificationRowProps {
  notification: Notification;
  onRead: (id: string) => void;
}

function NotificationRow({ notification, onRead }: NotificationRowProps) {
  const preview = (notification.payload.preview as string | undefined) ?? '';

  return (
    <button
      onClick={() => onRead(notification.id)}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
        !notification.isRead ? 'bg-indigo-50/60' : ''
      }`}
    >
      <span className="mt-0.5 shrink-0">{typeIcon(notification.type)}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-700">{typeLabel(notification.type)}</p>
        {preview && (
          <p className="mt-0.5 truncate text-xs text-slate-500">{preview}</p>
        )}
        <p className="mt-1 text-[10px] text-slate-400">{relativeTime(notification.createdAt)}</p>
      </div>
      {!notification.isRead && (
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
      )}
    </button>
  );
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAllRead,
    markRead,
  } = useNotificationStore();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch unread count on mount
  useEffect(() => {
    void fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Fetch full list when opening
  useEffect(() => {
    if (open) void fetchNotifications();
  }, [open, fetchNotifications]);

  const handleRead = (id: string) => {
    void markRead([id]);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-50 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-slate-800">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => void markAllRead()}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
              >
                <Check className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {isLoading ? (
              <p className="px-4 py-6 text-center text-xs text-slate-400">Loadingâ€¦</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-slate-400">
                No notifications yet
              </p>
            ) : (
              notifications.map((n) => (
                <NotificationRow key={n.id} notification={n} onRead={handleRead} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
