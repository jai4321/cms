import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workspace, DmConversation } from '@/lib/types';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  workspacesFetched: boolean;
  conversations: DmConversation[];
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (workspace: Workspace) => void;
  setWorkspacesFetched: (v: boolean) => void;
  clearWorkspaces: () => void;
  setConversations: (conversations: DmConversation[]) => void;
  addConversation: (conversation: DmConversation) => void;
  updateConversation: (id: string, patch: Partial<DmConversation>) => void;
  removeConversation: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspaces: [],
      activeWorkspace: null,
      workspacesFetched: false,
      conversations: [],
      setWorkspaces: (workspaces) => set({ workspaces }),
      setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
      setWorkspacesFetched: (v) => set({ workspacesFetched: v }),
      clearWorkspaces: () => set({ workspaces: [], activeWorkspace: null, workspacesFetched: false }),
      setConversations: (conversations) => set({ conversations }),
      addConversation: (conversation) =>
        set((state) => {
          const exists = state.conversations.some((c) => c.id === conversation.id);
          if (exists) return state;
          return { conversations: [conversation, ...state.conversations] };
        }),
      updateConversation: (id, patch) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        })),
      removeConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
        })),
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({ activeWorkspace: state.activeWorkspace }),
    },
  ),
);
