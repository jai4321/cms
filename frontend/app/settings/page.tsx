'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useEffect } from 'react';
import { User, Shield, ChevronRight, ArrowLeft } from 'lucide-react';

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || !user) return null;

  const initials = user.username
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900">
            Account settings
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-8 space-y-4">
        {/* Profile card */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Profile
            </span>
          </div>

          {/* Avatar + info */}
          <div className="flex items-center gap-5 px-5 py-5">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="h-16 w-16 rounded-full object-cover ring-4 ring-indigo-50"
              />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xl font-bold text-white ring-4 ring-indigo-50">
                {initials}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xl font-bold text-slate-900 truncate">
                {user.username}
              </p>
              <p className="mt-0.5 text-sm text-slate-500 truncate">
                {user.email}
              </p>
              <span
                className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  user.isEmailVerified
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {user.isEmailVerified ? 'Email verified' : 'Email not verified'}
              </span>
            </div>
          </div>

          {/* Info rows */}
          <div className="border-t border-slate-100 divide-y divide-slate-100">
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-slate-500">Username</span>
              <span className="text-sm font-medium text-slate-900">
                {user.username}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-slate-500">Email</span>
              <span className="text-sm font-medium text-slate-900">
                {user.email}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-slate-500">Member since</span>
              <span className="text-sm font-medium text-slate-900">
                {new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Security card */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <Shield className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Security
            </span>
          </div>

          <Link
            href="/settings/security"
            className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Two-factor authentication
                </p>
                <p className="text-xs text-slate-500">
                  {user.twoFactorEnabled
                    ? 'Enabled — your account is protected'
                    : 'Not enabled — add an extra layer of security'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  user.twoFactorEnabled
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {user.twoFactorEnabled ? 'On' : 'Off'}
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
