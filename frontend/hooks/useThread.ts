import { useState, useCallback, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { getSocket } from '@/lib/socket';
import type { ThreadMessage, Reaction, ReactionSummary, Message } from '@/lib/types';

interface ThreadState {
  replies: ThreadMessage[];
  isLoading: boolean;
  isSending: boolean;
}

export function useThread(parentMessage: Message | null) {
  const { user } = useAuthStore();
  const [state, setState] = useState<ThreadState>({
    replies: [],
    isLoading: false,
    isSending: false,
  });

  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!parentMessage) {
      hasLoaded.current = false;
      setState({ replies: [], isLoading: false, isSending: false });
      return;
    }
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    setState((s) => ({ ...s, isLoading: true }));
    api
      .get<ThreadMessage[]>(`/messages/${parentMessage.id}/replies`)
      .then((res) => {
        setState({ replies: res.data, isLoading: false, isSending: false });
      })
      .catch(() => {
        setState((s) => ({ ...s, isLoading: false }));
      });
  }, [parentMessage]);

  const postReply = useCallback(
    async (content: string) => {
      if (!parentMessage || !user) return;
      setState((s) => ({ ...s, isSending: true }));
      try {
        const res = await api.post<ThreadMessage>(`/messages/${parentMessage.id}/replies`, {
          content,
        });
        setState((s) => ({ ...s, replies: [...s.replies, res.data], isSending: false }));
      } catch {
        setState((s) => ({ ...s, isSending: false }));
      }
    },
    [parentMessage, user],
  );

  return { ...state, postReply };
}

// ─── Reactions hook ───────────────────────────────────────────────────────────

export function useReactions(messageId: string, currentUserId: string) {
  const [reactions, setReactions] = useState<ReactionSummary[]>([]);

  const loadReactions = useCallback(async () => {
    try {
      const res = await api.get<Reaction[]>(`/messages/${messageId}/reactions`);
      setReactions(summarise(res.data, currentUserId));
    } catch {
      // silently ignore
    }
  }, [messageId, currentUserId]);

  // Auto-load on mount
  useEffect(() => {
    void loadReactions();
  }, [loadReactions]);

  // Real-time: reload when any user reacts/un-reacts on this message
  useEffect(() => {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) return;
    const socket = getSocket(accessToken);
    const handler = (data: { messageId: string }) => {
      if (data.messageId === messageId) void loadReactions();
    };
    socket.on('reaction:update', handler);
    return () => { socket.off('reaction:update', handler); };
  }, [messageId, loadReactions]);

  const addReaction = useCallback(
    async (emoji: string) => {
      try {
        await api.post(`/messages/${messageId}/reactions`, { emoji });
        setReactions((prev) => {
          const existing = prev.find((r) => r.emoji === emoji);
          if (existing) {
            return prev.map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.count + 1, reactedByMe: true, userIds: [...r.userIds, currentUserId] }
                : r,
            );
          }
          return [...prev, { emoji, count: 1, reactedByMe: true, userIds: [currentUserId] }];
        });
      } catch {
        // ignore 409 (already reacted)
      }
    },
    [messageId, currentUserId],
  );

  const removeReaction = useCallback(
    async (emoji: string) => {
      try {
        await api.delete(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
        setReactions((prev) =>
          prev
            .map((r) =>
              r.emoji === emoji
                ? {
                    ...r,
                    count: r.count - 1,
                    reactedByMe: false,
                    userIds: r.userIds.filter((id) => id !== currentUserId),
                  }
                : r,
            )
            .filter((r) => r.count > 0),
        );
      } catch {
        // ignore
      }
    },
    [messageId, currentUserId],
  );

  const toggleReaction = useCallback(
    (emoji: string, reactedByMe: boolean) => {
      if (reactedByMe) removeReaction(emoji);
      else addReaction(emoji);
    },
    [addReaction, removeReaction],
  );

  return { reactions, loadReactions, addReaction, removeReaction, toggleReaction };
}

function summarise(raw: Reaction[], currentUserId: string): ReactionSummary[] {
  const map = new Map<string, ReactionSummary>();
  for (const r of raw) {
    const existing = map.get(r.emoji);
    if (existing) {
      existing.count += 1;
      existing.userIds.push(r.user.id);
      if (r.user.id === currentUserId) existing.reactedByMe = true;
    } else {
      map.set(r.emoji, {
        emoji: r.emoji,
        count: 1,
        reactedByMe: r.user.id === currentUserId,
        userIds: [r.user.id],
      });
    }
  }
  return [...map.values()];
}
