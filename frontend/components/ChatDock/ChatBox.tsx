'use client';

import { Minus, X, Maximize2 } from 'lucide-react';
import type { ChatBox as ChatBoxType } from '@/store/chat-dock.store';
import { useChatDockStore } from '@/store/chat-dock.store';
import { useAuthStore } from '@/store/auth.store';
import { useConversation } from '@/hooks/useConversation';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import Avatar from '@/components/Avatar';

interface Props {
  box: ChatBoxType;
}

export default function ChatBox({ box }: Props) {
  const { toggleMinimize, closeDm, setFullscreen } = useChatDockStore();
  const { user } = useAuthStore();

  const { messages, isLoading, isLoadingMore, hasMore, typingUsers, sendMessage, loadMore, emitTyping } =
    useConversation(box.conversationId);

  const others = box.participants.filter((p) => p.userId !== user?.id);
  const label =
    box.name ||
    (others.length === 0
      ? 'You (yourself)'
      : others.length === 1
        ? others[0].username
        : `${others[0].username} +${others.length - 1}`);

  const typingLabel =
    typingUsers.length === 0
      ? null
      : typingUsers.length === 1
        ? `${typingUsers[0].username} is typing…`
        : `${typingUsers.length} people are typing…`;

  if (!user) return null;

  return (
    <div className="flex w-72 flex-col rounded-t-xl border border-b-0 border-slate-300 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-2 rounded-t-xl bg-slate-800 px-3 py-2">
        <div className="flex shrink-0">
          {box.name ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">
              {box.name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
            </span>
          ) : (
            <div className="flex -space-x-1.5">
              {(others.length > 0 ? others : box.participants).slice(0, 2).map((p) => (
                <span key={p.userId} className="rounded-full ring-2 ring-slate-800">
                  <Avatar name={p.username} avatarUrl={p.avatarUrl} size="sm" />
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-white">{label}</span>
          {typingLabel && (
            <span className="block truncate text-[10px] italic text-slate-400">
              {typingLabel}
            </span>
          )}
        </div>
        {box.unreadCount > 0 && (
          <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
            {box.unreadCount}
          </span>
        )}
        <button
          onClick={() => setFullscreen(box.conversationId)}
          className="rounded p-0.5 text-slate-400 transition-colors hover:text-white"
          title="Open full screen"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => toggleMinimize(box.conversationId)}
          className="rounded p-0.5 text-slate-400 transition-colors hover:text-white"
          title={box.minimized ? 'Expand' : 'Minimize'}
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={() => closeDm(box.conversationId)}
          className="rounded p-0.5 text-slate-400 transition-colors hover:text-white"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      {!box.minimized && (
        <>
          <MessageList
            messages={messages}
            currentUser={user}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            isLoading={isLoading}
            onLoadMore={loadMore}
            className="h-64"
          />
          <div className="border-t border-slate-200 p-3">
            <MessageInput
              onSend={sendMessage}
              onTyping={emitTyping}
              placeholder={`Message ${label}…`}
            />
          </div>
        </>
      )}
    </div>
  );
}
