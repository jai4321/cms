'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Workspace</p>
          <h1 className="mt-2 text-xl font-semibold">Teams Chat</h1>
        </div>
        <div className="flex-1 px-4 py-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium">Welcome{user?.username ? `, ${user.username}` : ''}</p>
            <p className="mt-1 text-sm text-slate-500">
              This area will hold channels, DMs, and navigation in the next phases.
            </p>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Main Chat</p>
              <h2 className="mt-1 text-xl font-semibold">Message Box</h2>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600">
              {user?.email}
            </div>
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-between px-6 py-6">
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-3xl rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <h3 className="text-2xl font-semibold">Chat area ready</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                This `/` route is now reserved for the main message box page. We can build channels,
                threads, and real-time messages on top of this shell in the next phase.
              </p>
            </div>
          </div>

          <div className="mx-auto mt-6 flex w-full max-w-3xl items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="h-10 flex-1 rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-400">
              Message input will be enabled in the messaging phase...
            </div>
            <button
              type="button"
              className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white"
            >
              Send
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
