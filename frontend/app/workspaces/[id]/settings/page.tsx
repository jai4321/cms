'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useAuthStore } from '@/store/auth.store';
import { GeneralSection, InviteSection, MembersSection } from './components/WorkspaceSettings';
import type { Workspace, WorkspaceMember } from '@/lib/types';

export default function WorkspaceSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { workspaces, setActiveWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const cached = workspaces.find((w) => w.id === id);
    if (cached) setWorkspace(cached);

    Promise.all([
      api.get<Workspace>(`/workspaces/${id}`, { signal: controller.signal }),
      api.get<WorkspaceMember[]>(`/workspaces/${id}/members`, { signal: controller.signal }),
    ])
      .then(([wsRes, membersRes]) => {
        // Derive role from the members list (current user's membership) so a
        // hard reload doesn't lose the role when the store cache is empty.
        const myMembership = membersRes.data.find((m) => m.user.id === user?.id);
        const role = myMembership?.role ?? cached?.role ?? 'member';
        const ws = { ...wsRes.data, role };
        setWorkspace(ws);
        setActiveWorkspace(ws);
        setMembers(membersRes.data);
        setLoading(false);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setLoading(false);
          router.replace('/workspaces');
        }
      });

    return () => controller.abort();
  }, [id]);

  if (loading || !workspace) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8">
      <h1 className="mb-6 text-xl font-bold text-slate-900">
        Workspace settings
      </h1>

      <div className="space-y-6 max-w-2xl">
        <GeneralSection workspace={workspace} />

        <InviteSection
          workspace={workspace}
          onInvited={() =>
            api
              .get<WorkspaceMember[]>(`/workspaces/${id}/members`)
              .then((res) => setMembers(res.data))
              .catch(() => {})
          }
        />

        <MembersSection
          workspace={workspace}
          members={members}
          onMembersChange={setMembers}
        />
      </div>
    </div>
  );
}
