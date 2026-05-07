'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, ChevronUp } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import api from '@/lib/api';

function Avatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string | null;
}) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-8 w-8 rounded-full object-cover ring-2 ring-white"
      />
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white ring-2 ring-white">
      {initials}
    </span>
  );
}

export default function SidebarUserFooter() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { activeWorkspace, clearWorkspaces } = useWorkspaceStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    logout();
    clearWorkspaces();
    router.replace('/login');
  };

  if (!user) return null;

  return (
    <div ref={ref} className="relative shrink-0 border-t border-slate-100">
      {/* Popup menu */}
      {open && (
        <div className="absolute bottom-full left-2 right-2 mb-1 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
          {/* User info header in popup */}
          <div className="flex items-center gap-3 px-4 py-2.5">
            <Avatar name={user.username} avatarUrl={user.avatarUrl} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user.username}
              </p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="my-1 border-t border-slate-100" />

          {activeWorkspace && (
            <button
              onClick={() => {
                setOpen(false);
                router.push('/settings');
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              Account settings
            </button>
          )}

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}

      {/* Footer trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <Avatar name={user.username} avatarUrl={user.avatarUrl} />
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold text-slate-900">
            {user.username}
          </p>
          <p className="truncate text-xs text-slate-400">{user.email}</p>
        </div>
        <ChevronUp
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
    </div>
  );
}
