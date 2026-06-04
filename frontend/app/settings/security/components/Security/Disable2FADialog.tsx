'use client';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Disable2FADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (password: string) => Promise<void>;
  loading: boolean;
  error: string;
}

export function Disable2FADialog({ onConfirm, ...props }: Disable2FADialogProps) {
  return (
    <ConfirmDialog
      {...props}
      title="Disable Two-Factor Authentication"
      description="This will remove the extra layer of security from your account. Enter your password to confirm."
      withInput
      onConfirm={(value) => onConfirm(value ?? '')}
    />
  );
}
