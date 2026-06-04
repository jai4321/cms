'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Disable2FADialog } from './Disable2FADialog';

type Step = 'idle' | 'qr' | 'backup';

interface SetupData {
  secret: string;
  qrCodeUrl: string;
}

export default function TwoFASetup() {
  const { user, setAuth, accessToken } = useAuthStore();
  const [step, setStep] = useState<Step>('idle');
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disableError, setDisableError] = useState('');

  async function startSetup() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post<SetupData>('/auth/2fa/setup');
      setSetupData(data);
      setStep('qr');
    } catch {
      setError('Failed to start 2FA setup');
    } finally {
      setLoading(false);
    }
  }

  async function confirmEnable() {
    if (!setupData) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post<{ backupCodes: string[] }>('/auth/2fa/enable', {
        secret: setupData.secret,
        code,
      });
      setBackupCodes(data.backupCodes);
      setStep('backup');
      if (user && accessToken) {
        const meResp = await api.get('/auth/me');
        setAuth(meResp.data, accessToken);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  }

  async function disable2FA(password: string) {
    setLoading(true);
    setDisableError('');
    try {
      await api.post('/auth/2fa/disable', { password });
      if (user && accessToken) {
        const meResp = await api.get('/auth/me');
        setAuth(meResp.data, accessToken);
      }
      setStep('idle');
      setSetupData(null);
      setShowDisableDialog(false);
    } catch (err: any) {
      setDisableError(err?.response?.data?.message ?? 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  if (step === 'backup') {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold">Save your backup codes</h3>
        <p className="text-sm text-muted-foreground">
          Store these somewhere safe. Each code can only be used once.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {backupCodes.map((c) => (
            <code key={c} className="bg-muted rounded px-2 py-1 text-sm font-mono">
              {c}
            </code>
          ))}
        </div>
        <Button onClick={() => setStep('idle')} className="w-full">
          Done
        </Button>
      </div>
    );
  }

  if (step === 'qr' && setupData) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold">Scan with your authenticator app</h3>
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setupData.qrCodeUrl} alt="QR code" width={180} height={180} />
        </div>
        <p className="text-xs text-muted-foreground break-all">
          Manual key: <span className="font-mono">{setupData.secret}</span>
        </p>
        <div className="space-y-1">
          <Label htmlFor="verify-code">Enter 6-digit code to confirm</Label>
          <Input
            id="verify-code"
            maxLength={6}
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000000"
          />
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button onClick={confirmEnable} disabled={loading || code.length !== 6} className="w-full">
          {loading ? 'Enabling…' : 'Enable 2FA'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Two-factor authentication</p>
          <p className="text-sm text-muted-foreground">
            {user.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
          </p>
        </div>
        <Switch
          checked={user.twoFactorEnabled}
          disabled={loading}
          onCheckedChange={(checked) => {
            if (checked) {
              startSetup();
            } else {
              setDisableError('');
              setShowDisableDialog(true);
            }
          }}
        />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Disable2FADialog
        open={showDisableDialog}
        onOpenChange={(open) => { setShowDisableDialog(open); if (!open) setDisableError(''); }}
        onConfirm={disable2FA}
        loading={loading}
        error={disableError}
      />
    </div>
  );
}
