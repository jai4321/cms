'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Plus, Settings, LogOut } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useAuthStore } from '@/store/auth.store';
import type { Workspace } from '@/lib/types';
import api from '@/lib/api';

export default function WorkspaceSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { workspaces, activeWorkspace, setWorkspaces, setActiveWorkspace } =
    useWorkspaceStore();
  const { logout } = useAuthStore();

  useEffect(() => {
    api.get<Workspace[]>('/workspaces').then((res) => {
      setWorkspaces(res.data);
      if (!activeWorkspace && res.data.length > 0) {
        setActiveWorkspace(res.data[0]);
      }
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (ws: Workspace) => {
    setActiveWorkspace(ws);
    setOpen(false);
    router.push(`/workspaces/${ws.id}/settings`);
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    logout();
    router.replace('/login');
  };

  const initials = (name: string) =>
    name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();

  return (
    <div ref={ref} className="relative px-3 py-3">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium hover:bg-slate-100 transition-colors"
      >
        {activeWorkspace ? (
          <>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">
              {activeWorkspace.iconUrl ? (
                <img src={activeWorkspace.iconUrl} alt="" className="h-7 w-7 rounded-md object-cover" />
              ) : (
                initials(activeWorkspace.name)
              )}
            </span>
            <span className="min-w-0 flex-1 truncate">{activeWorkspace.name}</span>
          </>
        ) : (
          <span className="flex-1 text-slate-400">Select workspace…</span>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-3 right-3 top-full z-50 mt-1 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => handleSelect(ws)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-indigo-100 text-xs font-bold text-indigo-700">
                {initials(ws.name)}
              </span>
              <span className="min-w-0 flex-1 truncate">{ws.name}</span>
              {ws.id === activeWorkspace?.id && (
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
              )}
            </button>
          ))}

          <div className="my-1 border-t border-slate-100" />

          <Link
            href="/workspaces/new"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New workspace
          </Link>

          {activeWorkspace && (
            <Link
              href={`/workspaces/${activeWorkspace.id}/settings`}
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          )}

          <div className="my-1 border-t border-slate-100" />

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
