'use client';

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  xs: { box: 'h-5 w-5', text: 'text-[10px]' },
  sm: { box: 'h-7 w-7', text: 'text-xs' },
  md: { box: 'h-8 w-8', text: 'text-xs' },
  lg: { box: 'h-9 w-9', text: 'text-sm' },
};

export default function Avatar({ name, avatarUrl, size = 'md', className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const { box, text } = sizeMap[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${box} rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <span
      className={`${box} ${text} flex shrink-0 items-center justify-center rounded-full bg-indigo-500 font-bold text-white ${className}`}
    >
      {initials}
    </span>
  );
}
