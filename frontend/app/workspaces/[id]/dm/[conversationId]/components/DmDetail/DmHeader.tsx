'use client';

import { Info } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import type { DmConversation } from '@/lib/types';
import Avatar from '@/components/Avatar';

interface Props {
  conversation: DmConversation;
  onToggleInfo?: () => void;
}

export default function DmHeader({ conversation, onToggleInfo }: Props) {
  const { user } = useAuthStore();
  const others = conversation.participants.filter((p) => p.userId !== user?.id);
  const isGroup = others.length >= 2;
  const label =
    conversation.name ||
    (others.length === 0 ? 'You (yourself)' : others.map((p) => p.username).join(', '));

  return (
    <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex shrink-0">
        {conversation.name ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            {conversation.name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
          </span>
        ) : (
          <div className="flex -space-x-2">
            {(others.length > 0 ? others : conversation.participants)
              .slice(0, 3)
              .map((p) => (
                <span key={p.userId} className="ring-2 ring-white rounded-full">
                  <Avatar name={p.username} avatarUrl={p.avatarUrl} />
                </span>
              ))}
          </div>
        )}
      </div>
      <div className="flex-1">
        <h1 className="text-base font-semibold text-slate-900">{label}</h1>
        {isGroup && (
          <p className="text-xs text-slate-500">{conversation.participants.length} people</p>
        )}
      </div>
      {isGroup && onToggleInfo && (
        <button
          onClick={onToggleInfo}
          title="Group info"
          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <Info className="h-5 w-5" />
        </button>
      )}
    </header>
  );
}
