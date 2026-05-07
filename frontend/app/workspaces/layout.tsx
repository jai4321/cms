'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import WorkspaceSwitcher from './components/WorkspaceSwitcher';
import DirectMessagesList from './components/DirectMessagesList';
import StartDmModal from './components/StartDmModal';
import SidebarUserFooter from './components/SidebarUserFooter';
import ChatFullscreen from '@/components/ChatDock/ChatFullscreen';

export default function WorkspacesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const [dmModalOpen, setDmModalOpen] = useState(false);

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
        <div className="mt-2 flex-1 overflow-y-auto">
          <DirectMessagesList onStartDm={() => setDmModalOpen(true)} />
        </div>
        <SidebarUserFooter />
      </aside>

      {/* Main content — relative so ChatFullscreen is scoped here */}
      <main className="relative flex min-w-0 flex-1 flex-col">
        <ChatFullscreen />
        {children}
      </main>

      {/* Start DM modal */}
      <StartDmModal
        open={dmModalOpen}
        onClose={() => setDmModalOpen(false)}
      />
    </div>
  );
}
