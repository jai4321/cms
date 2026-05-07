'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspace.store';

export default function WorkspacesIndexPage() {
  const router = useRouter();
  const { workspaces, workspacesFetched, setActiveWorkspace } = useWorkspaceStore();

  useEffect(() => {
    if (!workspacesFetched) return;
    if (workspaces.length > 0) {
      setActiveWorkspace(workspaces[0]);
      router.replace(`/workspaces/${workspaces[0].id}/settings`);
    } else {
      router.replace('/workspaces/new');
    }
  }, [workspacesFetched, workspaces]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600" />
    </div>
  );
}
