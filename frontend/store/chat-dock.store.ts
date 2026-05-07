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
  fullscreenConversationId: string | null;
  openDm: (box: Omit<ChatBox, 'minimized' | 'unreadCount'>) => void;
  closeDm: (conversationId: string) => void;
  toggleMinimize: (conversationId: string) => void;
  setFullscreen: (conversationId: string | null) => void;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
}

export const MAX_BOXES = 4;

export const useChatDockStore = create<ChatDockState>()((set) => ({
  openBoxes: [],
  fullscreenConversationId: null,

  openDm: (box) =>
    set((state) => {
      const exists = state.openBoxes.find(
        (b) => b.conversationId === box.conversationId,
      );
      if (exists) {
        // Already open — un-minimize and bring to fullscreen
        return {
          openBoxes: state.openBoxes.map((b) =>
            b.conversationId === box.conversationId
              ? { ...b, minimized: false }
              : b,
          ),
          fullscreenConversationId: box.conversationId,
        };
      }
      const newBox: ChatBox = { ...box, minimized: false, unreadCount: 0 };
      // Hard cap: evict oldest (first) box if already at max
      const trimmed =
        state.openBoxes.length >= MAX_BOXES
          ? state.openBoxes.slice(1)
          : state.openBoxes;
      return {
        openBoxes: [...trimmed, newBox],
        fullscreenConversationId: box.conversationId,
      };
    }),

  closeDm: (conversationId) =>
    set((state) => ({
      openBoxes: state.openBoxes.filter(
        (b) => b.conversationId !== conversationId,
      ),
      fullscreenConversationId:
        state.fullscreenConversationId === conversationId
          ? null
          : state.fullscreenConversationId,
    })),

  toggleMinimize: (conversationId) =>
    set((state) => ({
      openBoxes: state.openBoxes.map((b) =>
        b.conversationId === conversationId
          ? { ...b, minimized: !b.minimized }
          : b,
      ),
    })),

  setFullscreen: (conversationId) =>
    set({ fullscreenConversationId: conversationId }),

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
