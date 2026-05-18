import { create } from 'zustand';
import type { Notification } from '@/lib/types';
import api from '@/lib/api';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  addNotification: (n: Notification) => void;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (ids: string[]) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  addNotification: (n) =>
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<Notification[]>('/notifications?limit=30');
      set({ notifications: data });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    const { data } = await api.get<{ count: number }>('/notifications/unread-count');
    set({ unreadCount: data.count ?? (data as unknown as number) });
  },

  markAllRead: async () => {
    await api.patch('/notifications/read', {});
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  markRead: async (ids) => {
    await api.patch('/notifications/read', { ids });
    set((state) => ({
      notifications: state.notifications.map((n) =>
        ids.includes(n.id) ? { ...n, isRead: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - ids.length),
    }));
  },
}));
