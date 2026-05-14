'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Search, Check } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useAuthStore } from '@/store/auth.store';
import { useChatDockStore } from '@/store/chat-dock.store';
import type { WorkspaceMember, DmConversation } from '@/lib/types';
import api from '@/lib/api';

interface Props {
  onClose: () => void;
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

export default function StartDmModal({ onClose }: Props) {
  const { user } = useAuthStore();
  const { activeWorkspace } = useWorkspaceStore();
  const { openDm } = useChatDockStore();

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch members on mount
  useEffect(() => {
    if (!activeWorkspace) return;
    api
      .get<WorkspaceMember[]>(`/workspaces/${activeWorkspace.id}/members`)
      .then((res) => {
        // Exclude current user
        setMembers(res.data.filter((m) => m.user.id !== user?.id));
      })
      .catch(() => {});
  }, [activeWorkspace?.id]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const filtered = members.filter(
    (m) =>
      m.user.username.toLowerCase().includes(query.toLowerCase()) ||
      m.user.email.toLowerCase().includes(query.toLowerCase()),
  );

  const toggleSelect = (userId: string) => {
    setSelected((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleOpen = async () => {
    if (!activeWorkspace || selected.length === 0) return;
    if (selected.length >= 2 && !groupName.trim()) return;
    setLoading(true);
    try {
      const body: { userIds: string[]; name?: string } = { userIds: selected };
      if (selected.length >= 2) {
        body.name = groupName.trim();
      }
      const res = await api.post<DmConversation>(
        `/workspaces/${activeWorkspace.id}/dm`,
        body,
      );
      const conversation = res.data;
      openDm({
        conversationId: conversation.id,
        participants: conversation.participants ?? [],
        workspaceId: activeWorkspace.id,
        name: conversation.name ?? null,
        createdBy: conversation.createdBy ?? null,
        createdAt: conversation.createdAt,
      });
      onClose();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-md flex-col rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            New Direct Message
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by name or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Group name — required when 2+ people selected */}
        {selected.length >= 2 && (
          <div className="border-b border-slate-100 px-4 py-3">
            <input
              type="text"
              placeholder="Group name (required)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={100}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        )}

        {/* Member list */}
        <ul className="max-h-64 overflow-y-auto py-2">
          {filtered.length === 0 && (
            <li className="px-5 py-3 text-sm text-slate-400">
              No members found
            </li>
          )}
          {filtered.map((member) => {
            const isSelected = selected.includes(member.user.id);
            return (
              <li key={member.user.id}>
                <button
                  onClick={() => toggleSelect(member.user.id)}
                  className="flex w-full items-center gap-3 px-5 py-2.5 hover:bg-slate-50 transition-colors"
                >
                  <Avatar
                    name={member.user.username}
                    avatarUrl={member.user.avatarUrl}
                  />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {member.user.username}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {member.user.email}
                    </p>
                  </div>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600'
                        : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
          <span className="text-sm text-slate-500">
            {selected.length === 0
              ? 'Select people to message'
              : `${selected.length} selected`}
          </span>
          <button
            onClick={handleOpen}
            disabled={selected.length === 0 || loading || (selected.length >= 2 && !groupName.trim())}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {loading ? 'Opening…' : 'Open Chat'}
          </button>
        </div>
      </div>
    </div>
  );
}
