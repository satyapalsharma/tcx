'use client';

import { OverlayProvider } from '@/components/Overlay';
import { ToastProvider } from '@/components/Toast';
import { TooltipProvider } from '@/components/ui/tooltip';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <ToastProvider>
        <OverlayProvider>{children}</OverlayProvider>
      </ToastProvider>
    </TooltipProvider>
  );
}
