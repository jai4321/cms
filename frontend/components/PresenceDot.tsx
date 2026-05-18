'use client';

import type { PresenceStatus } from '@/lib/types';

interface PresenceDotProps {
  status: PresenceStatus;
  className?: string;
}

const colorMap: Record<PresenceStatus, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-400',
  dnd: 'bg-red-500',
  offline: 'bg-slate-400',
};

export default function PresenceDot({ status, className = '' }: PresenceDotProps) {
  return (
    <span
      className={`block h-2.5 w-2.5 rounded-full ring-2 ring-white ${colorMap[status]} ${className}`}
      title={status}
    />
  );
}
