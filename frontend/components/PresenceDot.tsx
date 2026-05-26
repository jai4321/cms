'use client';

import type { PresenceStatus } from '@/lib/types';
import { STATUS_OPTIONS } from '@/lib/types';

interface PresenceDotProps {
  status: PresenceStatus;
  className?: string;
}

const colorMap = Object.fromEntries(
  STATUS_OPTIONS.map((opt) => [opt.value, opt.color]),
) as Record<PresenceStatus, string>;

export default function PresenceDot({ status, className = '' }: PresenceDotProps) {
  return (
    <span
      className={`block h-2.5 w-2.5 rounded-full ring-2 ring-white ${colorMap[status]} ${className}`}
      title={status}
    />
  );
}
