import { create } from 'zustand';
import type { PresenceStatus } from '@/lib/types';

interface PresenceState {
  statuses: Record<string, PresenceStatus>;
  setStatus: (userId: string, status: PresenceStatus) => void;
  setStatuses: (map: Record<string, PresenceStatus>) => void;
  getStatus: (userId: string) => PresenceStatus;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  statuses: {},

  setStatus: (userId, status) =>
    set((state) => ({ statuses: { ...state.statuses, [userId]: status } })),

  setStatuses: (map) =>
    set((state) => ({ statuses: { ...state.statuses, ...map } })),

  getStatus: (userId) => get().statuses[userId] ?? 'offline',
}));
