'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import PageLoader from '@/components/PageLoader';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();

  useEffect(() => {
    console.log('Auth state hydrated:', hasHydrated);
    if (!hasHydrated) return;
    if (isAuthenticated) {
      router.replace('/workspaces');
    } else {
      router.replace('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  return <PageLoader fullScreen />;
}
