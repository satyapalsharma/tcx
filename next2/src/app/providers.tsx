'use client';

import { OverlayProvider } from '@/components/Overlay';
import { ToastProvider } from '@/components/Toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <OverlayProvider>{children}</OverlayProvider>
    </ToastProvider>
  );
}
