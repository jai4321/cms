'use client';

import type { ReactionSummary } from '@/lib/types';

interface Props {
  reactions: ReactionSummary[];
  onToggle: (emoji: string, reactedByMe: boolean) => void;
}

export default function ReactionBar({ reactions, onToggle }: Props) {
  if (reactions.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => onToggle(r.emoji, r.reactedByMe)}
          title={r.userIds.length <= 5 ? r.userIds.join(', ') : `${r.count} reactions`}
          className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs transition-colors ${
            r.reactedByMe
              ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
          }`}
        >
          <span>{r.emoji}</span>
          <span className="font-medium">{r.count}</span>
        </button>
      ))}
    </div>
  );
}
