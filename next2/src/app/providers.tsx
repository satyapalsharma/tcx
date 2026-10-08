'use client';

import { OverlayProvider } from '@/components/Overlay';
import { ToastProvider } from '@/components/Toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppProvider } from '@/context/AppContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <ToastProvider>
        <AppProvider>
          <OverlayProvider>{children}</OverlayProvider>
        </AppProvider>
      </ToastProvider>
    </TooltipProvider>
  );
}
