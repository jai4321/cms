'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function VerifyEmailStatus() {
  const params = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found.');
      return;
    }
    api
      .get(`/auth/verify-email?token=${token}`)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err?.response?.data?.message ?? 'Verification failed.');
      });
  }, [token]);

  return (
    <div className="text-center space-y-4">
      {status === 'loading' && <p className="text-muted-foreground">Verifying…</p>}
      {status === 'success' && (
        <>
          <p className="text-green-600 font-medium">{message}</p>
          <Link href="/login" className="text-sm underline">
            Sign in
          </Link>
        </>
      )}
      {status === 'error' && <p className="text-destructive">{message}</p>}
    </div>
  );
}
