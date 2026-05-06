import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workspace } from '@/lib/types';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (workspace: Workspace) => void;
  clearWorkspaces: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspaces: [],
      activeWorkspace: null,
      setWorkspaces: (workspaces) => set({ workspaces }),
      setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
      clearWorkspaces: () => set({ workspaces: [], activeWorkspace: null }),
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({ activeWorkspace: state.activeWorkspace }),
    },
  ),
);
