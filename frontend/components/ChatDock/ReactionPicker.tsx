'use client';

import { useEffect, useRef } from 'react';

const COMMON_EMOJIS = [
  '👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏',
  '😍', '🤔', '👎', '💯', '🙏', '✅', '🚀', '⭐',
];

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  align?: 'left' | 'right';
}

export default function ReactionPicker({ onSelect, onClose, align = 'left' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`absolute top-full z-50 mt-1 grid grid-cols-8 gap-0.5 rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl ${
        align === 'right' ? 'right-0' : 'left-0'
      }`}
      style={{ minWidth: '16rem' }}
    >
      {COMMON_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => { onSelect(emoji); onClose(); }}
          className="flex h-7 w-7 items-center justify-center rounded text-base transition-colors hover:bg-slate-100"
          title={emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
