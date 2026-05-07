import { create } from 'zustand';
import type { Message } from '@/lib/types';

interface TypingUser {
  userId: string;
  username: string;
}

interface ConversationState {
  items: Message[]; // oldest-first for display
  nextCursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  typingUsers: TypingUser[];
}

const defaultConvState = (): ConversationState => ({
  items: [],
  nextCursor: null,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  typingUsers: [],
});

interface MessageStore {
  conversations: Record<string, ConversationState>;
  // Per-conversation sidebar unread (for conversations not open in dock)
  sidebarUnread: Record<string, number>;

  setLoading: (id: string, loading: boolean) => void;
  setLoadingMore: (id: string, loading: boolean) => void;
  setInitialMessages: (
    id: string,
    items: Message[],
    nextCursor: string | null,
    hasMore: boolean,
  ) => void;
  prependMessages: (
    id: string,
    items: Message[],
    nextCursor: string | null,
    hasMore: boolean,
  ) => void;
  addMessage: (id: string, message: Message) => void;
  addOptimistic: (
    id: string,
    tempId: string,
    senderId: string,
    senderUsername: string,
    senderAvatarUrl: string | null,
    content: string,
  ) => void;
  replaceOptimistic: (id: string, tempId: string, message: Message) => void;
  addTypingUser: (id: string, user: TypingUser) => void;
  removeTypingUser: (id: string, userId: string) => void;
  incrementSidebarUnread: (id: string) => void;
  clearSidebarUnread: (id: string) => void;
}

export const useMessageStore = create<MessageStore>()((set, get) => ({
  conversations: {},
  sidebarUnread: {},

  setLoading: (id, loading) =>
    set((s) => ({
      conversations: {
        ...s.conversations,
        [id]: { ...(s.conversations[id] ?? defaultConvState()), isLoading: loading },
      },
    })),

  setLoadingMore: (id, loading) =>
    set((s) => ({
      conversations: {
        ...s.conversations,
        [id]: { ...(s.conversations[id] ?? defaultConvState()), isLoadingMore: loading },
      },
    })),

  setInitialMessages: (id, items, nextCursor, hasMore) =>
    set((s) => ({
      conversations: {
        ...s.conversations,
        [id]: {
          ...(s.conversations[id] ?? defaultConvState()),
          items: [...items].reverse(), // API returns newest-first; reverse for display
          nextCursor,
          hasMore,
          isLoading: false,
        },
      },
    })),

  prependMessages: (id, items, nextCursor, hasMore) =>
    set((s) => {
      const existing = s.conversations[id] ?? defaultConvState();
      return {
        conversations: {
          ...s.conversations,
          [id]: {
            ...existing,
            items: [...items].reverse().concat(existing.items),
            nextCursor,
            hasMore,
            isLoadingMore: false,
          },
        },
      };
    }),

  addMessage: (id, message) =>
    set((s) => {
      const existing = s.conversations[id] ?? defaultConvState();
      if (existing.items.some((m) => m.id === message.id)) return s;
      return {
        conversations: {
          ...s.conversations,
          [id]: { ...existing, items: [...existing.items, message] },
        },
      };
    }),

  addOptimistic: (id, tempId, senderId, senderUsername, senderAvatarUrl, content) =>
    set((s) => {
      const existing = s.conversations[id] ?? defaultConvState();
      const optimistic: Message = {
        id: tempId,
        conversationId: id,
        senderId,
        content,
        editedAt: null,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        sender: { id: senderId, username: senderUsername, avatarUrl: senderAvatarUrl },
        _optimistic: true,
      };
      return {
        conversations: {
          ...s.conversations,
          [id]: { ...existing, items: [...existing.items, optimistic] },
        },
      };
    }),

  replaceOptimistic: (id, tempId, message) =>
    set((s) => {
      const existing = s.conversations[id] ?? defaultConvState();
      const items = existing.items.filter((m) => m.id !== tempId);
      if (!items.some((m) => m.id === message.id)) {
        items.push(message);
      }
      return {
        conversations: {
          ...s.conversations,
          [id]: { ...existing, items },
        },
      };
    }),

  addTypingUser: (id, user) =>
    set((s) => {
      const existing = s.conversations[id] ?? defaultConvState();
      const without = existing.typingUsers.filter((u) => u.userId !== user.userId);
      return {
        conversations: {
          ...s.conversations,
          [id]: { ...existing, typingUsers: [...without, user] },
        },
      };
    }),

  removeTypingUser: (id, userId) =>
    set((s) => {
      const existing = s.conversations[id] ?? defaultConvState();
      return {
        conversations: {
          ...s.conversations,
          [id]: {
            ...existing,
            typingUsers: existing.typingUsers.filter((u) => u.userId !== userId),
          },
        },
      };
    }),

  incrementSidebarUnread: (id) =>
    set((s) => ({
      sidebarUnread: { ...s.sidebarUnread, [id]: (s.sidebarUnread[id] ?? 0) + 1 },
    })),

  clearSidebarUnread: (id) =>
    set((s) => ({ sidebarUnread: { ...s.sidebarUnread, [id]: 0 } })),
}));
