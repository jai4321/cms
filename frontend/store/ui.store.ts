import { create } from 'zustand';

interface UiState {
  pendingRequests: number;
  startLoading: () => void;
  stopLoading: () => void;
  resetLoading: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  pendingRequests: 0,
  startLoading: () => set((state) => ({ pendingRequests: state.pendingRequests + 1 })),
  stopLoading: () =>
    set((state) => ({
      pendingRequests: Math.max(0, state.pendingRequests - 1),
    })),
  resetLoading: () => set({ pendingRequests: 0 }),
}));
