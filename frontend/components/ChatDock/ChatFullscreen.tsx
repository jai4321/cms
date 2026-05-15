'use client';

import { useState } from 'react';
import { Minus, X, Info } from 'lucide-react';
import { useChatDockStore, type ChatBox } from '@/store/chat-dock.store';
import { useAuthStore } from '@/store/auth.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useConversation } from '@/hooks/useConversation';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import GroupInfoPanel from './GroupInfoPanel';
import ThreadPanel from './ThreadPanel';
import type { DmConversation, Message, User } from '@/lib/types';
import Avatar from '@/components/Avatar';

export default function ChatFullscreen() {
  const { openBoxes, fullscreenConversationId, setFullscreen, closeDm } = useChatDockStore();
  const { user } = useAuthStore();

  if (!fullscreenConversationId) return null;
  const box = openBoxes.find((b) => b.conversationId === fullscreenConversationId);
  if (!box || !user) return null;

  return (
    <ChatFullscreenInner
      box={box}
      user={user}
      setFullscreen={setFullscreen}
      closeDm={closeDm}
    />
  );
}

function ChatFullscreenInner({
  box,
  user,
  setFullscreen,
  closeDm,
}: {
  box: ChatBox;
  user: User;
  setFullscreen: (id: string | null) => void;
  closeDm: (id: string) => void;
}) {
  const { activeWorkspace } = useWorkspaceStore();
  const { updateBox } = useChatDockStore();
  const {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    typingUsers,
    sendMessage,
    loadMore,
    emitTyping,
  } = useConversation(box.conversationId);

  const [infoOpen, setInfoOpen] = useState(false);
  const [threadMessage, setThreadMessage] = useState<Message | null>(null);

  const others = box.participants.filter((p) => p.userId !== user.id);
  const isGroup = others.length >= 2;
  const label = box.name || (others.length === 0 ? 'You (yourself)' : others.map((p) => p.username).join(', '));

  const typingLabel =
    typingUsers.length === 0
      ? null
      : typingUsers.length === 1
        ? `${typingUsers[0].username} is typing…`
        : `${typingUsers.length} people are typing…`;

  // Build a DmConversation shape for GroupInfoPanel from box data
  const conversation: DmConversation = {
    id: box.conversationId,
    workspaceId: box.workspaceId,
    name: box.name,
    createdBy: box.createdBy,
    createdAt: box.createdAt ?? new Date().toISOString(),
    participants: box.participants,
  };

  const handleConversationUpdate = (updated: Partial<DmConversation>) => {
    updateBox(box.conversationId, {
      ...(updated.name !== undefined ? { name: updated.name } : {}),
      ...(updated.participants !== undefined ? { participants: updated.participants } : {}),
    });
  };

  const handleLeave = () => {
    closeDm(box.conversationId);
    setFullscreen(null);
  };

  return (
    <div className="absolute inset-0 z-50 flex bg-white">
      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex shrink-0">
            {box.name ? (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                {box.name.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
              </span>
            ) : (
              <div className="flex -space-x-2">
                {(others.length > 0 ? others : box.participants).slice(0, 4).map((p) => (
                  <span key={p.userId} className="rounded-full ring-2 ring-white">
                    <Avatar name={p.username} avatarUrl={p.avatarUrl} size="lg" />
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-slate-900">{label}</h2>
            {typingLabel ? (
              <p className="text-sm italic text-slate-500">{typingLabel}</p>
            ) : isGroup ? (
              <p className="text-sm text-slate-500">{box.participants.length} participants</p>
            ) : null}
          </div>

          <div className="flex items-center gap-1">
            {isGroup && (
              <button
                onClick={() => setInfoOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                title="Group info"
              >
                <Info className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => setFullscreen(null)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              title="Minimize to dock"
            >
              <Minus className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                closeDm(box.conversationId);
                setFullscreen(null);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Close conversation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Message area */}
        <MessageList
          messages={messages}
          currentUser={user}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          isLoading={isLoading}
          onLoadMore={loadMore}
          onReply={setThreadMessage}
          className="flex-1"
        />

        {/* Input bar */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
          <MessageInput
            onSend={sendMessage}
            onTyping={emitTyping}
            placeholder={`Message ${label}…`}
            workspaceId={box.workspaceId}
          />
        </div>
      </div>

      {/* Thread panel */}
      {threadMessage && (
        <ThreadPanel
          parentMessage={threadMessage}
          onClose={() => setThreadMessage(null)}
        />
      )}

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
