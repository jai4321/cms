'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DmHeader, GroupInfoPanel } from './components/DmDetail';
import type { DmConversation } from '@/lib/types';
import api from '@/lib/api';
import PageLoader from '@/components/PageLoader';

export default function DmConversationPage() {
  const router = useRouter();
  const { id: workspaceId, conversationId } = useParams<{
    id: string;
    conversationId: string;
  }>();
  const [conversation, setConversation] = useState<DmConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    api
      .get<DmConversation>(`/dm/${conversationId}`)
      .then((res) => setConversation(res.data))
      .catch(() => setConversation(null))
      .finally(() => setLoading(false));
  }, [conversationId]);

  const handleConversationUpdate = (updated: Partial<DmConversation>) => {
    setConversation((prev) => prev ? { ...prev, ...updated } : prev);
  };

  const handleLeave = () => {
    router.replace(`/workspaces/${workspaceId}`);
  };

  if (loading) return <PageLoader />;

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-500">
        Conversation not found or you are not a participant.
      </div>
    );
  }

  const isGroup = conversation.participants.length >= 3;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main area */}
      <div className="flex flex-1 flex-col">
        <DmHeader
          conversation={conversation}
          onToggleInfo={isGroup ? () => setInfoOpen((v) => !v) : undefined}
        />
        {/* Message area — Phase 4 will populate this */}
        <div className="flex flex-1 items-center justify-center text-slate-400 text-sm">
          Messages coming in Phase 4
        </div>
      </div>

      {/* Group info panel */}
      {isGroup && infoOpen && (
        <GroupInfoPanel
          conversation={conversation}
          onClose={() => setInfoOpen(false)}
          onConversationUpdate={handleConversationUpdate}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
}
