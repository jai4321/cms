'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { useWorkspaceStore } from '@/store/workspace.store';
import type { Workspace } from '@/lib/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  iconUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CreateWorkspaceForm() {
  const router = useRouter();
  const { setWorkspaces, setActiveWorkspace, workspaces } = useWorkspaceStore();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('name', e.target.value);
    setValue('slug', slugify(e.target.value));
  };

  const onSubmit = async (values: FormValues) => {
    setServerError('');
    try {
      const { data } = await api.post<Workspace>('/workspaces', {
        name: values.name,
        slug: values.slug,
        ...(values.iconUrl ? { iconUrl: values.iconUrl } : {}),
      });
      const updated = [...workspaces, { ...data, role: 'owner' as const }];
      setWorkspaces(updated);
      setActiveWorkspace({ ...data, role: 'owner' as const });
      router.push(`/workspaces/${data.id}/settings`);
    } catch (err: any) {
      setServerError(
        err?.response?.data?.message ?? 'Failed to create workspace',
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Create a workspace</h1>
        <p className="mt-2 text-sm text-slate-500">
          A workspace is your team&apos;s shared space for conversations.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name">Workspace name</Label>
          <Input
            id="name"
            placeholder="Acme Corp"
            {...register('name')}
            onChange={handleNameChange}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Slug */}
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug</Label>
          <div className="flex items-center rounded-lg border border-input bg-background text-sm">
            <span className="select-none border-r border-input px-3 py-2 text-slate-400">
              workspace/
            </span>
            <Input
              id="slug"
              className="border-0 shadow-none focus-visible:ring-0"
              placeholder="acme-corp"
              {...register('slug')}
              aria-invalid={!!errors.slug}
            />
          </div>
          {errors.slug && (
            <p className="text-xs text-red-500">{errors.slug.message}</p>
          )}
        </div>

        {/* Icon URL (optional) */}
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
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create workspace'}
        </Button>
      </form>
    </div>
  );
}
