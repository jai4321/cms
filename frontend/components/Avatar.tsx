'use client';

import { usePresenceStore } from '@/store/presence.store';
import PresenceDot from './PresenceDot';

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  userId?: string;
  showPresence?: boolean;
}

const sizeMap = {
  xs: { box: 'h-5 w-5', text: 'text-[10px]' },
  sm: { box: 'h-7 w-7', text: 'text-xs' },
  md: { box: 'h-8 w-8', text: 'text-xs' },
  lg: { box: 'h-9 w-9', text: 'text-sm' },
};

export default function Avatar({
  name,
  avatarUrl,
  size = 'md',
  className = '',
  userId,
  showPresence = false,
}: AvatarProps) {
  const getStatus = usePresenceStore((s) => s.getStatus);
  const status = showPresence && userId ? getStatus(userId) : null;

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const { box, text } = sizeMap[size];

  const img = avatarUrl ? (
    <img
      src={avatarUrl}
      alt={name}
      className={`${box} rounded-full object-cover ${className}`}
    />
  ) : (
    <span
      className={`${box} ${text} flex shrink-0 items-center justify-center rounded-full bg-indigo-500 font-bold text-white ${className}`}
    >
      {initials}
    </span>
  );

  if (!status) return img;

  return (
    <span className="relative inline-flex shrink-0">
      {img}
      <PresenceDot
        status={status}
        className="absolute -bottom-0.5 -right-0.5"
      />
    </span>
  );
}
