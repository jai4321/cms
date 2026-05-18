'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useChatDockStore } from '@/store/chat-dock.store';
import { useMessageStore } from '@/store/message.store';
import { usePresenceStore } from '@/store/presence.store';
import { useNotificationStore } from '@/store/notification.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { getSocket, disconnectSocket } from '@/lib/socket';
import type { Message, PresenceStatus, Notification } from '@/lib/types';

interface TypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

interface PresenceUpdateEvent {
  userId: string;
  status: PresenceStatus;
}

const HEARTBEAT_INTERVAL = 20_000; // 20 s

function fireBrowserNotification(title: string, body: string) {
  if (typeof window === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  if (!document.hidden) return; // only fire when tab is not focused
  new Notification(title, { body, icon: '/favicon.ico' });
}

export default function SocketManager() {
  const { accessToken, isAuthenticated, user } = useAuthStore();
  const { openBoxes, incrementUnread } = useChatDockStore();
  const { addMessage, addTypingUser, removeTypingUser, incrementSidebarUnread } =
    useMessageStore();
  const { setStatus } = usePresenceStore();
  const { addNotification } = useNotificationStore();

  const openBoxesRef = useRef(openBoxes);
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    openBoxesRef.current = openBoxes;
  }, [openBoxes]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socket = getSocket(accessToken);

    // ── Message handler ───────────────────────────────────────────────────────
    const onMessage = (msg: Message) => {
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

      const box = openBoxesRef.current.find((b) => b.conversationId === msg.conversationId);
      if (!box) {
        incrementSidebarUnread(msg.conversationId);
      } else if (box.minimized) {
        incrementUnread(msg.conversationId);
      }
    };

    // ── Typing handler ────────────────────────────────────────────────────────
    const onTyping = (event: TypingEvent) => {
      const { conversationId, userId, isTyping } = event;
      const key = `${conversationId}:${userId}`;

      if (!isTyping) {
        removeTypingUser(conversationId, userId);
        clearTimeout(typingTimers.current[key]);
        return;
      }

      const box = openBoxesRef.current.find((b) => b.conversationId === conversationId);
      const participant = box?.participants.find((p) => p.userId === userId);
      const username = participant?.username ?? '…';

      addTypingUser(conversationId, { userId, username });

      clearTimeout(typingTimers.current[key]);
      typingTimers.current[key] = setTimeout(() => {
        removeTypingUser(conversationId, userId);
      }, 3000);
    };

    // ── Presence handler ──────────────────────────────────────────────────────
    const onPresenceUpdate = ({ userId, status }: PresenceUpdateEvent) => {
      setStatus(userId, status);
    };

    // ── Notification handler ──────────────────────────────────────────────────
    const onNotification = (notification: Notification) => {
      addNotification(notification);

      // Fire OS notification when tab is unfocused
      const payload = notification.payload;
      const preview = (payload.preview as string | undefined) ?? '';
      if (notification.type === 'mention') {
        fireBrowserNotification('You were mentioned', preview);
      } else if (notification.type === 'dm') {
        fireBrowserNotification('New message', preview);
      }
    };

    socket.on('message:new', onMessage);
    socket.on('message:typing', onTyping);
    socket.on('presence:update', onPresenceUpdate);
    socket.on('notification:new', onNotification);

    // ── On (re)connect: refresh presence for all known participants ───────────
    const onConnect = () => {
      const convos = useWorkspaceStore.getState().conversations;
      const userIds = [
        ...new Set(convos.flatMap((c) => c.participants.map((p) => p.userId))),
      ];
      if (userIds.length === 0) return;
      socket.emit(
        'presence:get',
        { userIds },
        (statuses: Record<string, PresenceStatus>) => {
          if (statuses && typeof statuses === 'object') {
            usePresenceStore.getState().setStatuses(statuses);
          }
        },
      );
    };

    socket.on('connect', onConnect);
    // If already connected when this effect runs, fetch immediately
    if (socket.connected) onConnect();

    // ── Heartbeat ─────────────────────────────────────────────────────────────
    heartbeatTimer.current = setInterval(() => {
      if (socket.connected) {
        socket.emit('presence:heartbeat');
      }
    }, HEARTBEAT_INTERVAL);

    return () => {
      socket.off('message:new', onMessage);
      socket.off('message:typing', onTyping);
      socket.off('presence:update', onPresenceUpdate);
      socket.off('notification:new', onNotification);
      socket.off('connect', onConnect);
      if (heartbeatTimer.current) {
        clearInterval(heartbeatTimer.current);
        heartbeatTimer.current = null;
      }
    };
  }, [isAuthenticated, accessToken]);

  // ── Request browser notification permission on login ──────────────────────
  useEffect(() => {
    if (isAuthenticated && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        void Notification.requestPermission();
      }
    }
  }, [isAuthenticated]);

  // ── Disconnect on logout ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
    }
  }, [isAuthenticated]);

  // ── Cleanup timers on unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      Object.values(typingTimers.current).forEach(clearTimeout);
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    };
  }, []);

  return null;
}
