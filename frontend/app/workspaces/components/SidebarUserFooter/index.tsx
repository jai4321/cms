'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, ChevronUp } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { usePresenceStore } from '@/store/presence.store';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';
import Avatar from '@/components/Avatar';
import PresenceDot from '@/components/PresenceDot';
import type { PresenceStatus } from '@/lib/types';
import { STATUS_OPTIONS } from '@/lib/types';

export default function SidebarUserFooter() {
  const router = useRouter();
  const { user, logout, accessToken } = useAuthStore();
  const { activeWorkspace, clearWorkspaces } = useWorkspaceStore();
  const { getStatus, setStatus } = usePresenceStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const myStatus = user ? getStatus(user.id) : 'offline';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleStatusChange = (status: PresenceStatus) => {
    if (!user || !accessToken) return;
    const socket = getSocket(accessToken);
    socket.emit('presence:update', { status });
    setStatus(user.id, status);
  };

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
            <Avatar
              name={user.username}
              avatarUrl={user.avatarUrl}
              userId={user.id}
              showPresence
              className="ring-2 ring-white"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user.username}
              </p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>

          {/* Status selector */}
          <div className="my-1 border-t border-slate-100" />
          <p className="px-4 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Status
          </p>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                handleStatusChange(opt.value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                myStatus === opt.value
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${opt.color}`} />
              {opt.label}
              {myStatus === opt.value && (
                <span className="ml-auto text-[10px] font-semibold text-indigo-400">current</span>
              )}
            </button>
          ))}

          <div className="my-1 border-t border-slate-100" />

          {activeWorkspace && (
            <button
              onClick={() => {
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
        <div className="relative shrink-0">
          <Avatar name={user.username} avatarUrl={user.avatarUrl} />
          <PresenceDot status={myStatus} className="absolute -bottom-0.5 -right-0.5" />
        </div>
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
