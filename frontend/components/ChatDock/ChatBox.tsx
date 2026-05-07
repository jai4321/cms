'use client';

import { Minus, X, Send, Maximize2 } from 'lucide-react';
import type { ChatBox as ChatBoxType } from '@/store/chat-dock.store';
import { useChatDockStore } from '@/store/chat-dock.store';
import { useAuthStore } from '@/store/auth.store';

interface Props {
  box: ChatBoxType;
}

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-7 w-7 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
      {initials}
    </span>
  );
}

export default function ChatBox({ box }: Props) {
  const { toggleMinimize, closeDm, setFullscreen } = useChatDockStore();
  const { user } = useAuthStore();

  const others = box.participants.filter((p) => p.userId !== user?.id);
  const label =
    others.length === 0
      ? 'You (yourself)'
      : others.length === 1
        ? others[0].username
        : `${others[0].username} +${others.length - 1}`;

  return (
    <div className="flex w-72 flex-col rounded-t-xl border border-b-0 border-slate-300 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-2 rounded-t-xl bg-slate-800 px-3 py-2">
        <div className="flex -space-x-1.5">
          {(others.length > 0 ? others : box.participants).slice(0, 2).map((p) => (
            <span key={p.userId} className="ring-2 ring-slate-800 rounded-full">
              <Avatar name={p.username} avatarUrl={p.avatarUrl} />
            </span>
          ))}
        </div>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
          {label}
        </span>
        {box.unreadCount > 0 && (
          <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
            {box.unreadCount}
          </span>
        )}
        <button
          onClick={() => setFullscreen(box.conversationId)}
          className="rounded p-0.5 text-slate-400 hover:text-white transition-colors"
          title="Open full screen"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => toggleMinimize(box.conversationId)}
          className="rounded p-0.5 text-slate-400 hover:text-white transition-colors"
          title={box.minimized ? 'Expand' : 'Minimize'}
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={() => closeDm(box.conversationId)}
          className="rounded p-0.5 text-slate-400 hover:text-white transition-colors"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body (hidden when minimized) */}
      {!box.minimized && (
        <>
          {/* Message area */}
          <div className="flex h-64 flex-col-reverse overflow-y-auto p-3">
            <p className="text-center text-xs text-slate-400">
              Messages coming in Phase 4
            </p>
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-slate-200 p-3">
            <input
              type="text"
              placeholder="Write a message…"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              disabled
            />
            <button
              disabled
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
