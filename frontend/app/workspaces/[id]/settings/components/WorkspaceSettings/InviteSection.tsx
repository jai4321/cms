'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import type { Workspace } from '@/lib/types';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  role: z.enum(['admin', 'member']),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  workspace: Workspace;
  onInvited: () => void;
}

export default function InviteSection({ workspace, onInvited }: Props) {
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'member' },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError('');
    setSuccess('');
    try {
      await api.post(`/workspaces/${workspace.id}/invite`, values);
      onInvited();
      setSuccess(`${values.email} has been invited.`);
      reset();
    } catch (err: any) {
      setServerError(err?.response?.data?.message ?? 'Failed to invite member');
    }
  };

  const canInvite = workspace.role === 'owner' || workspace.role === 'admin';
  if (!canInvite) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-5 text-base font-semibold text-slate-900">
        Invite members
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5 min-w-[200px] flex-1">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="colleague@company.com"
            {...register('email')}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            {...register('role')}
            className="flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Inviting…' : 'Invite'}
        </Button>
      </form>

      {serverError && (
        <p className="mt-3 text-sm text-red-600">{serverError}</p>
      )}
      {success && (
        <p className="mt-3 text-sm text-green-600">{success}</p>
      )}
    </section>
  );
}
