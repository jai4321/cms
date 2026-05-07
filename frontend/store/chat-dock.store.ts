import { create } from 'zustand';
import type { DmParticipant } from '@/lib/types';

export interface ChatBox {
  conversationId: string;
  minimized: boolean;
  unreadCount: number;
  participants: DmParticipant[];
  workspaceId: string;
}

interface ChatDockState {
  openBoxes: ChatBox[];
  openDm: (box: Omit<ChatBox, 'minimized' | 'unreadCount'>) => void;
  closeDm: (conversationId: string) => void;
  toggleMinimize: (conversationId: string) => void;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
}

const MAX_VISIBLE = 3;

export const useChatDockStore = create<ChatDockState>()((set) => ({
  openBoxes: [],

  openDm: (box) =>
    set((state) => {
      const exists = state.openBoxes.find(
        (b) => b.conversationId === box.conversationId,
      );
      if (exists) {
        // Un-minimize if already open
        return {
          openBoxes: state.openBoxes.map((b) =>
            b.conversationId === box.conversationId
              ? { ...b, minimized: false }
              : b,
          ),
        };
      }
      const newBox: ChatBox = { ...box, minimized: false, unreadCount: 0 };
      return { openBoxes: [...state.openBoxes, newBox] };
    }),

  closeDm: (conversationId) =>
    set((state) => ({
      openBoxes: state.openBoxes.filter(
        (b) => b.conversationId !== conversationId,
      ),
    })),

  toggleMinimize: (conversationId) =>
    set((state) => ({
      openBoxes: state.openBoxes.map((b) =>
        b.conversationId === conversationId
          ? { ...b, minimized: !b.minimized }
          : b,
      ),
    })),

  incrementUnread: (conversationId) =>
    set((state) => ({
      openBoxes: state.openBoxes.map((b) =>
        b.conversationId === conversationId
          ? { ...b, unreadCount: b.unreadCount + 1 }
          : b,
      ),
    })),

  clearUnread: (conversationId) =>
    set((state) => ({
      openBoxes: state.openBoxes.map((b) =>
        b.conversationId === conversationId ? { ...b, unreadCount: 0 } : b,
      ),
    })),
}));

export { MAX_VISIBLE };
