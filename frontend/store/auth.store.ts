import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  requires2FA: boolean;
  preAuthToken: string | null;

  setAuth: (user: User, accessToken: string) => void;
  setTokens: (accessToken: string) => void;
  setPreAuth: (preAuthToken: string) => void;
  setHasHydrated: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      hasHydrated: false,
      requires2FA: false,
      preAuthToken: null,

      setAuth: (user, accessToken) =>
        set({
          user,
          accessToken,
          isAuthenticated: true,
          requires2FA: false,
          preAuthToken: null,
        }),

      setTokens: (accessToken) =>
        set({ accessToken }),

      setPreAuth: (preAuthToken) =>
        set({ requires2FA: true, preAuthToken, isAuthenticated: false }),

      setHasHydrated: (value) => set({ hasHydrated: value }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          hasHydrated: true,
          requires2FA: false,
          preAuthToken: null,
        }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
