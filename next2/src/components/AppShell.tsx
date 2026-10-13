'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from './layout/AppSidebar';
import { AppBreadcrumb } from './layout/AppBreadcrumb';
import { isOrganizationPage } from './layout/sidebar-navigation';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Icon } from './Icon';
import { useApp } from '@/context/AppContext';
import { NewRunModal } from './modals/NewRunModal';
import { CreateOrgModal } from './modals/CreateOrgModal';
import { CreateWorkspaceModal } from './modals/CreateWorkspaceModal';
import { InviteMemberModal } from './modals/InviteMemberModal';

type ShellProps = {
  children: ReactNode;
  crumb: string;
  middleCrumb?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
};

/** Page shell composes the shared shadcn navigation and product-level modals. */
export function AppShell({
  children,
  crumb,
  middleCrumb,
  badge,
  actions,
}: ShellProps) {
  const organizationPage = isOrganizationPage(usePathname());
  const {
    openNewRun,
    hasOrganization,
    hasProject,
    setIsNewOrgOpen,
    setIsNewWsOpen,
    accountEmail,
    storageScope,
    currentOrg,
  } = useApp();
  const showPageExtras = hasOrganization && (hasProject || organizationPage);
  return (
    <div
      className="flex min-h-screen w-full bg-background"
      data-od-id="app-shell"
    >
      <AppSidebar />
      <SidebarInset className="min-w-0 flex-1 bg-background">
        <header
          className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-7"
          data-od-id="topbar"
        >
          <SidebarTrigger className="text-muted" />
          <AppBreadcrumb
            crumb={crumb}
            middleCrumb={middleCrumb}
            organizationPage={organizationPage}
          />
          <div className="flex-1" />
          <div className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface-inset px-2.5 py-1 text-[10px] font-medium text-muted sm:flex">
            <span className="size-1.5 rounded-full bg-accent-strong" />
            {!hasOrganization
              ? storageScope
                ? 'Workspace setup'
                : 'Demo organization'
              : !hasProject
                ? currentOrg.name
                : storageScope
                  ? 'Project · local'
                  : 'Demo project'}
          </div>
          {showPageExtras && actions}
          {showPageExtras && badge}
          {hasProject && (
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              aria-label="New job"
              onClick={() => openNewRun()}
            >
              <Icon name="plus" className="size-4" />
            </Button>
          )}
        </header>
        {!hasOrganization && (
          <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-5 sm:p-10">
            <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-7 shadow-sm sm:p-10">
              <span className="grid size-12 place-items-center rounded-xl bg-accent-soft text-accent-strong">
                <Icon name="bolt" className="size-6" />
              </span>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[.14em] text-accent-strong">
                Your workspace starts here
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Create your organization
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
                Bring your team’s customer experience work together. You can
                create projects and invite teammates after setup.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button variant="accent" onClick={() => setIsNewOrgOpen(true)}>
                  <Icon name="plus" className="mr-2 size-4" />
                  Create organization
                </Button>
                <span className="text-xs text-muted">
                  Signed in as {accountEmail}
                </span>
              </div>
            </div>
          </div>
        )}
        {hasOrganization && !hasProject && !organizationPage && (
          <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-5 sm:p-10">
            <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-7 shadow-sm sm:p-10">
              <span className="grid size-12 place-items-center rounded-xl bg-accent-soft text-accent-strong">
                <Icon name="folder" className="size-6" />
              </span>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[.14em] text-accent-strong">
                {currentOrg.name}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Create your first project
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
                Projects keep jobs, process maps, and agent outputs organized
                for a specific team or customer journey.
              </p>
              <Button
                className="mt-6"
                variant="accent"
                onClick={() => setIsNewWsOpen(true)}
              >
                <Icon name="plus" className="mr-2 size-4" />
                Create project
              </Button>
            </div>
          </div>
        )}
        {hasOrganization && (hasProject || organizationPage) && children}
      </SidebarInset>
      <NewRunModal />
      <CreateOrgModal />
      <CreateWorkspaceModal />
      <InviteMemberModal />
    </div>
  );
}
