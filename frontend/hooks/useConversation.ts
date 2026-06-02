import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useChatDockStore } from '@/store/chat-dock.store';
import { useMessageStore } from '@/store/message.store';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';
import type { Message } from '@/lib/types';

interface MessagesResponse {
  items: Message[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function useConversation(conversationId: string) {
  const { user, accessToken } = useAuthStore();
  const { clearUnread } = useChatDockStore();
  const {
    conversations,
    setLoading,
    setLoadingMore,
    setInitialMessages,
    prependMessages,
    addOptimistic,
    replaceOptimistic,
    clearSidebarUnread,
  } = useMessageStore();

  const conv = conversations[conversationId];
  const hasLoadedRef = useRef(false);

  // Load initial messages once
  useEffect(() => {
    if (hasLoadedRef.current || conv?.items.length) {
      hasLoadedRef.current = true;
      return;
    }
    hasLoadedRef.current = true;
    setLoading(conversationId, true);
    api
      .get<MessagesResponse>(`/dm/${conversationId}/messages`, {
        params: { limit: 50 },
      })
      .then((res) => {
        setInitialMessages(conversationId, res.data.items, res.data.nextCursor, res.data.hasMore);
      })
      .catch(() => {
        setLoading(conversationId, false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Clear unread whenever this conversation is open
  useEffect(() => {
    clearUnread(conversationId);
    clearSidebarUnread(conversationId);
  }, [conversationId, clearUnread, clearSidebarUnread]);

  // Ensure the socket is in the correct DM room whenever a chat box opens.
  // joinUserRooms on the server only covers rooms that existed at connect time,
  // so we must re-join explicitly for new or late-joined conversations.
  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);
    socket.emit('dm:join', { conversationId });
  }, [conversationId, accessToken]);

  const loadMore = useCallback(async () => {
    if (!conv?.hasMore || conv?.isLoadingMore) return;
    setLoadingMore(conversationId, true);
    try {
      const res = await api.get<MessagesResponse>(`/dm/${conversationId}/messages`, {
        params: { cursor: conv.nextCursor, limit: 50 },
      });
      prependMessages(conversationId, res.data.items, res.data.nextCursor, res.data.hasMore);
    } catch {
      setLoadingMore(conversationId, false);
    }
  }, [conversationId, conv?.hasMore, conv?.isLoadingMore, conv?.nextCursor]);

  const sendMessage = useCallback(
    (content: string, attachmentIds?: string[], replyToMessageId?: string, replyTo?: Message['replyTo']) => {
      if (!user || !accessToken) return;
      const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      addOptimistic(conversationId, tempId, user.id, user.username, user.avatarUrl ?? null, content, replyTo);
      const socket = getSocket(accessToken);
      socket.emit(
        'message:send',
        { conversationId, content, attachmentIds, replyToMessageId },
        (msg: Message) => {
          replaceOptimistic(conversationId, tempId, msg);
        },
      );
    },
    [conversationId, user, accessToken, addOptimistic, replaceOptimistic],
  );

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!accessToken) return;
      const socket = getSocket(accessToken);
      socket.emit('message:typing', { conversationId, isTyping });
    },
    [conversationId, accessToken],
  );

  return {
    messages: conv?.items ?? [],
    isLoading: conv?.isLoading ?? false,
    isLoadingMore: conv?.isLoadingMore ?? false,
    hasMore: conv?.hasMore ?? false,
    typingUsers: conv?.typingUsers ?? [],
    sendMessage,
    loadMore,
    emitTyping,
  };
}
