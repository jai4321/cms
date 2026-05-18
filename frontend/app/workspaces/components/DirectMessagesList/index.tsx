'use client';

import { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useChatDockStore } from '@/store/chat-dock.store';
import type { DmConversation, PresenceStatus } from '@/lib/types';
import { useMessageStore } from '@/store/message.store';

import api from '@/lib/api';
import Avatar from '@/components/Avatar';
import PresenceDot from '@/components/PresenceDot';
import { usePresenceStore } from '@/store/presence.store';
import { getSocket } from '@/lib/socket';

interface Props {
  onStartDm: () => void;
}

function groupInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function GroupAvatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'xs' }) {
  const sizeClass = size === 'xs' ? 'h-5 w-5 text-[10px]' : 'h-7 w-7 text-xs';
  return (
    <span
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-md bg-indigo-600 font-bold text-white`}
    >
      {groupInitials(name)}
    </span>
  );
}

function dmLabel(conversation: DmConversation, currentUserId: string): string {
  if (conversation.name) return conversation.name;
  const others = conversation.participants.filter(
    (p) => p.userId !== currentUserId,
  );
  if (others.length === 0) return 'You (yourself)';
  return others.map((p) => p.username).join(', ');
}

export default function DirectMessagesList({ onStartDm }: Props) {
  const { user, accessToken } = useAuthStore();
  const { activeWorkspace, conversations, setConversations } = useWorkspaceStore();
  const { openDm, openBoxes } = useChatDockStore();
  const { sidebarUnread } = useMessageStore();
  const { getStatus, setStatuses } = usePresenceStore();

  useEffect(() => {
    if (!activeWorkspace || !accessToken) return;
    api
      .get<DmConversation[]>(`/workspaces/${activeWorkspace.id}/dm`)
      .then((res) => {
        setConversations(res.data);
        // Fetch current presence for all participants after conversations load
        const userIds = [
          ...new Set(res.data.flatMap((c) => c.participants.map((p) => p.userId))),
        ];
        if (userIds.length === 0) return;
        const socket = getSocket(accessToken);
        socket.emit(
          'presence:get',
          { userIds },
          (statuses: Record<string, PresenceStatus>) => {
            if (statuses && typeof statuses === 'object') {
              setStatuses(statuses);
            }
          },
        );
      })
      .catch(() => {});
  }, [activeWorkspace?.id]);

  const handleOpen = (conversation: DmConversation) => {
    if (!activeWorkspace) return;
    openDm({
      conversationId: conversation.id,
      participants: conversation.participants,
      workspaceId: activeWorkspace.id,
      name: conversation.name ?? null,
      createdBy: conversation.createdBy ?? null,
      createdAt: conversation.createdAt,
    });
  };

  if (!user) return null;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Direct Messages
        </span>
        <button
          onClick={onStartDm}
          className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="New direct message"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* DM entries */}
      <ul className="flex flex-col gap-0.5 px-2">
        {conversations.length === 0 && (
          <li className="px-2 py-1 text-xs text-slate-400">
            No direct messages yet
          </li>
        )}
        {conversations.map((conv) => {
          const others = conv.participants.filter(
            (p) => p.userId !== user.id,
          );
          const label = dmLabel(conv, user.id);
          const dockedBox = openBoxes.find((b) => b.conversationId === conv.id);
          const unread = dockedBox ? dockedBox.unreadCount : (sidebarUnread[conv.id] ?? 0);

          return (
            <li key={conv.id}>
              <button
                onClick={() => handleOpen(conv)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
              >
                {/* Avatar */}
                <div className="relative flex shrink-0">
                  {conv.name ? (
                    <GroupAvatar name={conv.name} size="sm" />
                  ) : (
                    <>
                      {others.slice(0, 2).map((p, i) => (
                        <span
                          key={p.userId}
                          className={`relative ${i === 1 ? '-ml-2' : ''}`}
                          style={{ zIndex: 2 - i }}
                        >
                          <Avatar name={p.username} avatarUrl={p.avatarUrl} size="sm" />
                          {others.length === 1 && (
                            <PresenceDot
                              status={getStatus(p.userId)}
                              className="absolute -bottom-0.5 -right-0.5"
                            />
                          )}
                        </span>
                      ))}
                      {others.length === 0 && (
                        <Avatar name={user.username} avatarUrl={user.avatarUrl} size="sm" />
                      )}
                    </>
                  )}
                </div>
                <span className="min-w-0 flex-1 truncate text-left">
                  {label}
                </span>
                {unread > 0 && (
                  <span className="ml-auto shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
