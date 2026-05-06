'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import WorkspaceSwitcher from './components/WorkspaceSwitcher';

export default function WorkspacesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Left sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <WorkspaceSwitcher />
        {/* Phase 3 will add DMs list here */}
      </aside>

      {/* Main content */}
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
