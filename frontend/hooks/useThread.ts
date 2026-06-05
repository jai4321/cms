import { useState, useCallback, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { getSocket } from '@/lib/socket';
import type { ThreadMessage, Reaction, ReactionSummary, Message, MessageSender } from '@/lib/types';

export interface AncestorMessage {
  id: string;
  content: string;
  createdAt: string;
  replyToMessageId?: string | null;
  sender: MessageSender;
}

interface ThreadState {
  ancestors: AncestorMessage[];
  replies: ThreadMessage[];
  isLoading: boolean;
  isSending: boolean;
}

// Walk up the replyTo chain until replyToMessageId is null
async function fetchAncestorChain(startMessage: Message): Promise<AncestorMessage[]> {
  const ancestors: AncestorMessage[] = [];
  let currentReplyToId = startMessage.replyTo?.id ?? null;
  const MAX_DEPTH = 20;

  for (let i = 0; i < MAX_DEPTH && currentReplyToId; i++) {
    const res = await api.get<AncestorMessage>(`/messages/${currentReplyToId}`);
    ancestors.unshift(res.data); // prepend → oldest first: [A, B] for clicking C
    currentReplyToId = res.data.replyToMessageId ?? null;
  }

  return ancestors;
}

export function useThread(parentMessage: Message | null) {
  const { user } = useAuthStore();
  const [state, setState] = useState<ThreadState>({
    ancestors: [],
    replies: [],
    isLoading: false,
    isSending: false,
  });

  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!parentMessage) {
      hasLoaded.current = false;
      setState({ ancestors: [], replies: [], isLoading: false, isSending: false });
      return;
    }
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    setState((s) => ({ ...s, isLoading: true }));

    Promise.all([
      fetchAncestorChain(parentMessage),
      api.get<ThreadMessage[]>(`/messages/${parentMessage.id}/replies`).then((r) => r.data),
    ])
      .then(([ancestors, replies]) => {
        setState({ ancestors, replies, isLoading: false, isSending: false });
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

export function useReactions(messageId: string, currentUserId: string, initialReactions?: Reaction[]) {
  const [reactions, setReactions] = useState<ReactionSummary[]>(() =>
    initialReactions ? summarise(initialReactions, currentUserId) : [],
  );

  const isOptimistic = messageId.startsWith('optimistic-');

  // Real-time: apply reaction events from other users directly to local state
  useEffect(() => {
    if (isOptimistic) return;
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) return;
    const socket = getSocket(accessToken);
    const handler = (data: {
      messageId: string;
      action: 'add' | 'remove';
      reaction?: { emoji: string; userId: string };
      emoji?: string;
      userId?: string;
    }) => {
      if (data.messageId !== messageId) return;
      const emoji = data.action === 'add' ? data.reaction!.emoji : data.emoji!;
      const userId = data.action === 'add' ? data.reaction!.userId : data.userId!;

      setReactions((prev) => {
        if (data.action === 'add') {
          const existing = prev.find((r) => r.emoji === emoji);
          // Deduplicate: addReaction() already updated state for currentUser
          if (existing) {
            if (existing.userIds.includes(userId)) return prev;
            return prev.map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.count + 1, reactedByMe: r.reactedByMe || userId === currentUserId, userIds: [...r.userIds, userId] }
                : r,
            );
          }
          return [...prev, { emoji, count: 1, reactedByMe: userId === currentUserId, userIds: [userId] }];
        } else {
          return prev
            .map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.count - 1, reactedByMe: r.reactedByMe && userId !== currentUserId, userIds: r.userIds.filter((id) => id !== userId) }
                : r,
            )
            .filter((r) => r.count > 0);
        }
      });
    };
    socket.on('reaction:update', handler);
    return () => { socket.off('reaction:update', handler); };
  }, [messageId, currentUserId, isOptimistic]);

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

  return { reactions, addReaction, removeReaction, toggleReaction };
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
