'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import type { DmConversation } from '@/lib/types';

interface Props {
  conversation: DmConversation;
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
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
      {initials}
    </span>
  );
}

export default function DmHeader({ conversation }: Props) {
  const { user } = useAuthStore();
  const others = conversation.participants.filter((p) => p.userId !== user?.id);
  const label =
    others.length === 0
      ? 'You (yourself)'
      : others.map((p) => p.username).join(', ');

  return (
    <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex -space-x-2">
        {(others.length > 0 ? others : conversation.participants)
          .slice(0, 3)
          .map((p) => (
            <span key={p.userId} className="ring-2 ring-white rounded-full">
              <Avatar name={p.username} avatarUrl={p.avatarUrl} />
            </span>
          ))}
      </div>
      <div>
        <h1 className="text-base font-semibold text-slate-900">{label}</h1>
        {others.length > 1 && (
          <p className="text-xs text-slate-500">{others.length + 1} people</p>
        )}
      </div>
    </header>
  );
}
