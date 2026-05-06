'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { Workspace, WorkspaceMember, WorkspaceRole } from '@/lib/types';

interface Props {
  workspace: Workspace;
  members: WorkspaceMember[];
  onMembersChange: (members: WorkspaceMember[]) => void;
}

const ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

export default function MembersSection({
  workspace,
  members,
  onMembersChange,
}: Props) {
  const { user } = useAuthStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const canManage =
    workspace.role === 'owner' || workspace.role === 'admin';

  const handleRoleChange = async (
    memberId: string,
    userId: string,
    role: 'admin' | 'member',
  ) => {
    setLoadingId(memberId);
    try {
      await api.patch(`/workspaces/${workspace.id}/members/${userId}`, { role });
      onMembersChange(
        members.map((m) => (m.id === memberId ? { ...m, role } : m)),
      );
    } catch {
      // silently ignore
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemove = async (memberId: string, userId: string) => {
    setLoadingId(memberId);
    try {
      await api.delete(`/workspaces/${workspace.id}/members/${userId}`);
      onMembersChange(members.filter((m) => m.id !== memberId));
    } catch {
      // silently ignore
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-5 text-base font-semibold text-slate-900">
        Members{' '}
        <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
          {members.length}
        </span>
      </h2>

      <div className="divide-y divide-slate-100">
        {members.map((m) => {
          const isMe = m.user.id === user?.id;
          const isOwner = m.role === 'owner';
          const busy = loadingId === m.id;

          return (
            <div
              key={m.id}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              {/* Avatar */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                {m.user.avatarUrl ? (
                  <img
                    src={m.user.avatarUrl}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  m.user.username.slice(0, 2).toUpperCase()
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {m.user.username}
                  {isMe && (
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      (you)
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-slate-500">{m.user.email}</p>
              </div>

              {/* Role badge / selector */}
              {canManage && !isOwner && workspace.role === 'owner' ? (
                <select
                  value={m.role}
                  disabled={busy}
                  onChange={(e) =>
                    handleRoleChange(
                      m.id,
                      m.user.id,
                      e.target.value as 'admin' | 'member',
                    )
                  }
                  className="rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
              ) : (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {ROLE_LABELS[m.role]}
                </span>
              )}

              {/* Remove button */}
              {canManage && !isOwner && !isMe && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => handleRemove(m.id, m.user.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
