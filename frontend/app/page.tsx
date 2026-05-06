'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    if (isAuthenticated) {
      router.replace('/workspaces');
    } else {
      router.replace('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600" />
    </div>
  );
}
