'use client';

import { useChatDockStore, MAX_VISIBLE } from '@/store/chat-dock.store';
import ChatBox from './ChatBox';
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
      <img src={avatarUrl} alt={name} className="h-9 w-9 rounded-full object-cover" />
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
      {initials}
    </span>
  );
}

export default function ChatDock() {
  const { openBoxes, openDm, toggleMinimize } = useChatDockStore();
  const { user } = useAuthStore();

  if (openBoxes.length === 0) return null;

  const visible = openBoxes.slice(-MAX_VISIBLE);
  const overflow = openBoxes.slice(0, openBoxes.length - MAX_VISIBLE);
  const overflowUnread = overflow.reduce((sum, b) => sum + b.unreadCount, 0);

  return (
    <div className="fixed bottom-0 right-4 z-40 flex items-end gap-3">
      {/* Overflow icon strip */}
      {overflow.length > 0 && (
        <div className="flex flex-col-reverse items-center gap-1 pb-1">
          {overflow.map((box) => {
            const others = box.participants.filter((p) => p.userId !== user?.id);
            const first = others[0] ?? box.participants[0];
            return (
              <button
                key={box.conversationId}
                onClick={() => toggleMinimize(box.conversationId)}
                className="relative"
                title={first?.username ?? 'DM'}
              >
                <Avatar name={first?.username ?? '?'} avatarUrl={first?.avatarUrl} />
                {box.unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {box.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
          {overflow.length > 0 && (
            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs font-bold text-white">
              +{overflow.length}
            </span>
          )}
        </div>
      )}

      {/* Visible chat boxes */}
      {visible.map((box) => (
        <ChatBox key={box.conversationId} box={box} />
      ))}
    </div>
  );
}
