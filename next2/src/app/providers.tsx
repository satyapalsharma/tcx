'use client';

import { AppSidebarProvider } from '@/components/layout/AppSidebarProvider';
import { ToastProvider } from '@/components/Toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PipelineProvider } from '@/context/PipelineContext';
import { AppProvider } from '@/context/AppContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <ToastProvider>
        <AppProvider>
          <PipelineProvider>
            <AppSidebarProvider>{children}</AppSidebarProvider>
          </PipelineProvider>
        </AppProvider>
      </ToastProvider>
    </TooltipProvider>
  );
}
