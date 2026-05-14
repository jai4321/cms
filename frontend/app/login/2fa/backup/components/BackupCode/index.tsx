'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const schema = z.object({
  code: z.string().min(1, 'Required'),
});

type FormValues = z.infer<typeof schema>;

export default function BackupCodeForm() {
  const router = useRouter();
  const { preAuthToken, setAuth } = useAuthStore();
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (!preAuthToken) router.replace('/login');
  }, [preAuthToken, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError('');
    try {
      const { data } = await api.post(
        '/auth/2fa/backup',
        { code: values.code },
        { headers: { Authorization: `Bearer ${preAuthToken}` } },
      );
      const meResp = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${data.accessToken}` },
      });
      setAuth(meResp.data, data.accessToken);
      router.push('/');
    } catch (err: any) {
      setServerError(err?.response?.data?.message ?? 'Invalid backup code');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="code">Backup code</Label>
        <Input id="code" placeholder="xxxxxxxx" {...register('code')} />
        {errors.code && <p className="text-destructive text-xs">{errors.code.message}</p>}
      </div>

      {serverError && <p className="text-destructive text-sm">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Verifying…' : 'Use backup code'}
      </Button>
    </form>
  );
}
