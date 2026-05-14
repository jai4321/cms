'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const schema = z.object({
  code: z.string().length(6, 'Enter the 6-digit code'),
});

type FormValues = z.infer<typeof schema>;

export default function TwoFAForm() {
  const router = useRouter();
  const { preAuthToken, isAuthenticated, setAuth } = useAuthStore();
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (!preAuthToken && !isAuthenticated) router.replace('/login');
  }, [preAuthToken, isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError('');
    try {
      const { data } = await api.post(
        '/auth/2fa/verify',
        { code: values.code },
        { headers: { Authorization: `Bearer ${preAuthToken}` } },
      );
      const meResp = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${data.accessToken}` },
      });
      setAuth(meResp.data, data.accessToken);
      router.push('/');
    } catch (err: any) {
      setServerError(err?.response?.data?.message ?? 'Verification failed');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="code">6-digit code</Label>
        <Input
          id="code"
          placeholder="000000"
          maxLength={6}
          inputMode="numeric"
          autoComplete="one-time-code"
          {...register('code')}
        />
        {errors.code && <p className="text-destructive text-xs">{errors.code.message}</p>}
      </div>

      {serverError && <p className="text-destructive text-sm">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Verifying…' : 'Verify'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Lost your authenticator?{' '}
        <Link href="/login/2fa/backup" className="underline">
          Use a backup code
        </Link>
      </p>
    </form>
  );
}
