'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useBrowserState } from '@/hooks/use-browser-state';

const readPreference = (value: unknown) =>
  typeof value === 'boolean' ? value : null;

/** A shared provider retains desktop visibility across route changes and reloads. */
export function AppSidebarProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useBrowserState(
    'tx-sidebar-open',
    true,
    readPreference,
  );
  if (['/login', '/onboarding'].includes(pathname)) return <>{children}</>;
  return (
    <SidebarProvider
      open={open}
      onOpenChange={setOpen}
      style={{ display: 'block' }}
    >
      {children}
    </SidebarProvider>
  );
}
