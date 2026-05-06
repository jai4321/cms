'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { useWorkspaceStore } from '@/store/workspace.store';
import type { Workspace } from '@/lib/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  iconUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  workspace: Workspace;
}

export default function GeneralSection({ workspace }: Props) {
  const { setActiveWorkspace, workspaces, setWorkspaces } = useWorkspaceStore();
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: workspace.name,
      iconUrl: workspace.iconUrl ?? '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError('');
    setSaved(false);
    try {
      const { data } = await api.patch<Workspace>(`/workspaces/${workspace.id}`, {
        name: values.name,
        ...(values.iconUrl ? { iconUrl: values.iconUrl } : {}),
      });
      const updated = { ...data, role: workspace.role };
      setActiveWorkspace(updated);
      setWorkspaces(workspaces.map((w) => (w.id === data.id ? updated : w)));
      setSaved(true);
    } catch (err: any) {
      setServerError(err?.response?.data?.message ?? 'Failed to save');
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-5 text-base font-semibold text-slate-900">
        General settings
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
        <div className="space-y-1.5">
          <Label htmlFor="name">Workspace name</Label>
          <Input id="name" {...register('name')} aria-invalid={!!errors.name} />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="iconUrl">
            Icon URL{' '}
            <span className="font-normal text-slate-400">(optional)</span>
          </Label>
          <Input
            id="iconUrl"
            placeholder="https://example.com/logo.png"
            {...register('iconUrl')}
            aria-invalid={!!errors.iconUrl}
          />
          {errors.iconUrl && (
            <p className="text-xs text-red-500">{errors.iconUrl.message}</p>
          )}
        </div>

        {serverError && (
          <p className="text-sm text-red-600">{serverError}</p>
        )}
        {saved && (
          <p className="text-sm text-green-600">Changes saved.</p>
        )}

        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </section>
  );
}
