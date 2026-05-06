'use client';

import { useUiStore } from '@/store/ui.store';

export default function GlobalLoader() {
  const pendingRequests = useUiStore((state) => state.pendingRequests);
  const isLoading = pendingRequests > 0;

  if (!isLoading) return null;

  return (
    <>
      <div className="fixed left-0 top-0 z-[100] h-1 w-full overflow-hidden bg-primary/20">
        <div className="h-full w-full animate-pulse bg-primary" />
      </div>

      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    </>
  );
}
