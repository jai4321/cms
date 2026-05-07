'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useChatDockStore } from '@/store/chat-dock.store';
import { useMessageStore } from '@/store/message.store';
import { getSocket, disconnectSocket } from '@/lib/socket';
import type { Message } from '@/lib/types';

interface TypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export default function SocketManager() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const { openBoxes, incrementUnread } = useChatDockStore();
  const { addMessage, addTypingUser, removeTypingUser, incrementSidebarUnread } =
    useMessageStore();

  const openBoxesRef = useRef(openBoxes);
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    openBoxesRef.current = openBoxes;
  }, [openBoxes]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socket = getSocket(accessToken);

    const onMessage = (msg: Message) => {
      // Try to replace an optimistic message from the current user
      const currentUserId = useAuthStore.getState().user?.id;
      if (msg.sender.id === currentUserId) {
        const conv = useMessageStore.getState().conversations[msg.conversationId];
        const optimistic = conv?.items.find(
          (m) => m._optimistic && m.senderId === currentUserId && m.content === msg.content,
        );
        if (optimistic) {
          useMessageStore.getState().replaceOptimistic(msg.conversationId, optimistic.id, msg);
          return;
        }
      }

      addMessage(msg.conversationId, msg);

      // Update unread counts
      const box = openBoxesRef.current.find((b) => b.conversationId === msg.conversationId);
      if (!box) {
        // Not open in dock at all → sidebar unread
        incrementSidebarUnread(msg.conversationId);
      } else if (box.minimized) {
        // Open in dock but minimized → dock badge
        incrementUnread(msg.conversationId);
      }
      // else: box is open and visible → no badge
    };

    const onTyping = (event: TypingEvent) => {
      const { conversationId, userId, isTyping } = event;
      const key = `${conversationId}:${userId}`;

      if (!isTyping) {
        removeTypingUser(conversationId, userId);
        clearTimeout(typingTimers.current[key]);
        return;
      }

      // Resolve username from participants in open boxes
      const box = openBoxesRef.current.find((b) => b.conversationId === conversationId);
      const participant = box?.participants.find((p) => p.userId === userId);
      const username = participant?.username ?? '…';

      addTypingUser(conversationId, { userId, username });

      clearTimeout(typingTimers.current[key]);
      typingTimers.current[key] = setTimeout(() => {
        removeTypingUser(conversationId, userId);
      }, 3000);
    };

    socket.on('message:new', onMessage);
    socket.on('message:typing', onTyping);

    return () => {
      socket.off('message:new', onMessage);
      socket.off('message:typing', onTyping);
    };
  }, [isAuthenticated, accessToken]);

  // Disconnect on logout
  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
    }
  }, [isAuthenticated]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(typingTimers.current).forEach(clearTimeout);
    };
  }, []);

  return null;
}
