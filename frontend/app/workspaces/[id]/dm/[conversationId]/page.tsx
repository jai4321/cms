'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DmHeader } from './components/DmDetail';
import type { DmConversation, DmParticipant } from '@/lib/types';
import api from '@/lib/api';

export default function DmConversationPage() {
  const { id: workspaceId, conversationId } = useParams<{
    id: string;
    conversationId: string;
  }>();
  const [conversation, setConversation] = useState<DmConversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<
        { userId: string; username: string; avatarUrl: string | null; joinedAt: string }[]
      >(`/dm/${conversationId}/participants`)
      .then((res) => {
        setConversation({
          id: conversationId,
          workspaceId,
          createdAt: new Date().toISOString(),
          participants: res.data.map((p) => ({
            userId: p.userId,
            username: p.username,
            avatarUrl: p.avatarUrl,
          })),
        });
      })
      .catch(() => {
        setConversation(null);
      })
      .finally(() => setLoading(false));
  }, [conversationId, workspaceId]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-500">
        Conversation not found or you are not a participant.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <DmHeader conversation={conversation} />
      {/* Message area — Phase 4 will populate this */}
      <div className="flex flex-1 items-center justify-center text-slate-400 text-sm">
        Messages coming in Phase 4
      </div>
    </div>
  );
}
