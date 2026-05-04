import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VerifyEmailStatus } from './components/VerifyEmail';

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Email verification</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
            <VerifyEmailStatus />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
