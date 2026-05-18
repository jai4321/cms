'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import WorkspaceSwitcher from './components/WorkspaceSwitcher';
import DirectMessagesList from './components/DirectMessagesList';
import StartDmModal from './components/StartDmModal';
import SidebarUserFooter from './components/SidebarUserFooter';
import ChatFullscreen from '@/components/ChatDock/ChatFullscreen';
import SocketManager from '@/components/SocketManager';
import PageLoader from '@/components/PageLoader';

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

  if (!hasHydrated) return <PageLoader fullScreen />;

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <SocketManager />
      {/* Left sidebar — fixed height, inner list scrolls. relative+z-30 creates stacking context above main content so notifications/popups layer on top */}
      <aside className="relative z-30 flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <WorkspaceSwitcher />
        <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
          <DirectMessagesList onStartDm={() => setDmModalOpen(true)} />
        </div>
        <SidebarUserFooter />
      </aside>

      {/* Main content — relative so ChatFullscreen is scoped here */}
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <ChatFullscreen />
        {children}
      </main>

      {/* Start DM modal */}
      {dmModalOpen && (
        <StartDmModal onClose={() => setDmModalOpen(false)} />
      )}
    </div>
  );
}
