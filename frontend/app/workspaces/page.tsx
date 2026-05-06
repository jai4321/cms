'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useWorkspaceStore } from '@/store/workspace.store';
import type { Workspace } from '@/lib/types';

export default function WorkspacesIndexPage() {
  const router = useRouter();
  const { setWorkspaces, setActiveWorkspace } = useWorkspaceStore();

  useEffect(() => {
    api.get<Workspace[]>('/workspaces').then((res) => {
      const list = res.data;
      setWorkspaces(list);
      if (list.length > 0) {
        setActiveWorkspace(list[0]);
        router.replace(`/workspaces/${list[0].id}/settings`);
      } else {
        router.replace('/workspaces/new');
      }
    });
  }, []);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600" />
    </div>
  );
}
