'use client';

import { Minus, X, Send } from 'lucide-react';
import { useChatDockStore } from '@/store/chat-dock.store';
import { useAuthStore } from '@/store/auth.store';

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
        className="h-9 w-9 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">
      {initials}
    </span>
  );
}

export default function ChatFullscreen() {
  const { openBoxes, fullscreenConversationId, setFullscreen, closeDm } =
    useChatDockStore();
  const { user } = useAuthStore();

  if (!fullscreenConversationId) return null;

  const box = openBoxes.find(
    (b) => b.conversationId === fullscreenConversationId,
  );
  if (!box) return null;

  const others = box.participants.filter((p) => p.userId !== user?.id);
  const label =
    others.length === 0
      ? 'You (yourself)'
      : others.map((p) => p.username).join(', ');

  const handleMinimize = () => {
    setFullscreen(null);
  };

  const handleClose = () => {
    closeDm(box.conversationId);
    setFullscreen(null);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6 py-4">
        {/* Avatars */}
        <div className="flex -space-x-2">
          {(others.length > 0 ? others : box.participants).slice(0, 4).map((p) => (
            <span key={p.userId} className="ring-2 ring-white rounded-full">
              <Avatar name={p.username} avatarUrl={p.avatarUrl} />
            </span>
          ))}
        </div>

        {/* Name */}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-slate-900">
            {label}
          </h2>
          {others.length > 1 && (
            <p className="text-sm text-slate-500">
              {others.length + 1} participants
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleMinimize}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Minimize to dock"
          >
            <Minus className="h-5 w-5" />
          </button>
          <button
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Close conversation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Message area */}
      <div className="flex flex-1 flex-col-reverse overflow-y-auto px-6 py-4">
        <p className="text-center text-sm text-slate-400">
          Messages coming in Phase 4
        </p>
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
          <input
            type="text"
            placeholder={`Message ${label}…`}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            disabled
          />
          <button
            disabled
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
