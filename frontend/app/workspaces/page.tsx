'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspace.store';
import PageLoader from '@/components/PageLoader';

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

  return <PageLoader />;
}
