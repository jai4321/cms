'use client';

import { Minus, X } from 'lucide-react';
import { useChatDockStore, type ChatBox } from '@/store/chat-dock.store';
import { useAuthStore } from '@/store/auth.store';
import { useConversation } from '@/hooks/useConversation';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import type { User } from '@/lib/types';

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="h-9 w-9 rounded-full object-cover" />;
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">
      {initials}
    </span>
  );
}

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

  const others = box.participants.filter((p) => p.userId !== user.id);
  const label =
    others.length === 0 ? 'You (yourself)' : others.map((p) => p.username).join(', ');

  const typingLabel =
    typingUsers.length === 0
      ? null
      : typingUsers.length === 1
        ? `${typingUsers[0].username} is typing…`
        : `${typingUsers.length} people are typing…`;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex -space-x-2">
          {(others.length > 0 ? others : box.participants).slice(0, 4).map((p) => (
            <span key={p.userId} className="rounded-full ring-2 ring-white">
              <Avatar name={p.username} avatarUrl={p.avatarUrl} />
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-slate-900">{label}</h2>
          {typingLabel ? (
            <p className="text-sm italic text-slate-500">{typingLabel}</p>
          ) : others.length > 1 ? (
            <p className="text-sm text-slate-500">{others.length + 1} participants</p>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
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
        className="flex-1"
      />

      {/* Input bar */}
      <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
        <MessageInput
          onSend={sendMessage}
          onTyping={emitTyping}
          placeholder={`Message ${label}…`}
        />
      </div>
    </div>
  );
}
