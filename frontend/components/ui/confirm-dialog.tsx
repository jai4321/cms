'use client';

import { useEffect, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: (value?: string) => void | Promise<void>;
  withInput?: boolean;
  onDecline?: () => void;
  loading?: boolean;
  error?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  withInput = false,
  onDecline,
  loading = false,
  error,
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (!open) setInputValue('');
  }, [open]);

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onDecline?.();
    onOpenChange(isOpen);
  }

  async function handleConfirm() {
    if ((withInput && !inputValue) || loading) return;
    await onConfirm(withInput ? inputValue : undefined);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-6 shadow-xl">
          <div className="space-y-4">
            <div className="space-y-1">
              <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {description}
              </Dialog.Description>
            </div>

            {withInput && (
              <div className="space-y-1.5">
                <Label htmlFor="confirm-dialog-input">Password</Label>
                <Input
                  id="confirm-dialog-input"
                  type="password"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                  placeholder="Enter your password"
                  autoFocus
                />
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Dialog.Close
                render={
                  <Button variant="outline" disabled={loading}>
                    Cancel
                  </Button>
                }
              />
              <Button
                onClick={handleConfirm}
                disabled={(withInput && !inputValue) || loading}
              >
                {loading ? 'Please wait…' : 'Confirm'}
              </Button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
