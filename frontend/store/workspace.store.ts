import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workspace } from '@/lib/types';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  workspacesFetched: boolean;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (workspace: Workspace) => void;
  setWorkspacesFetched: (v: boolean) => void;
  clearWorkspaces: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspaces: [],
      activeWorkspace: null,
      workspacesFetched: false,
      setWorkspaces: (workspaces) => set({ workspaces }),
      setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
      setWorkspacesFetched: (v) => set({ workspacesFetched: v }),
      clearWorkspaces: () => set({ workspaces: [], activeWorkspace: null, workspacesFetched: false }),
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({ activeWorkspace: state.activeWorkspace }),
    },
  ),
);
