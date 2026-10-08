'use client';

import React from 'react';
import { Link, usePathname } from '../lib/navigation';
import { Icon } from './Icon';
import { useToast } from './Toast';
import { useApp } from '@/context/AppContext';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NewRunModal } from './modals/NewRunModal';
import { CreateOrgModal } from './modals/CreateOrgModal';
import { CreateWorkspaceModal } from './modals/CreateWorkspaceModal';
import { InviteMemberModal } from './modals/InviteMemberModal';

type NavItem = { to: string; icon: Parameters<typeof Icon>[0]['name']; label: string };

const NAV_GROUPS: { section: string; items: NavItem[] }[] = [
  {
    section: 'Workspace',
    items: [
      { to: '/dashboard', icon: 'chart', label: 'Dashboard' },
      { to: '/jobs', icon: 'clock', label: 'Jobs' },
      { to: '/projects', icon: 'grid', label: 'Projects' },
    ],
  },
  {
    section: 'Studio',
    items: [
      { to: '/analysis', icon: 'search', label: 'Intent Discovery' },
      { to: '/design', icon: 'flow', label: 'Process Designer' },
      { to: '/develop', icon: 'code', label: 'Agent Builder' },
    ],
  },
  {
    section: 'Organization',
    items: [
      { to: '/rbac', icon: 'users', label: 'Members' },
      { to: '/connectors', icon: 'plug', label: 'Integrations' },
      { to: '/settings', icon: 'gear', label: 'Settings' },
      { to: '/audit-log', icon: 'scroll', label: 'Audit Log' },
    ],
  },
];

export function AppShell({
  children,
  crumb,
  middleCrumb,
  badge,
  actions,
}: {
  children: React.ReactNode;
  crumb: string;
  middleCrumb?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const toast = useToast();
  const {
    organizations,
    currentOrg,
    switchOrg,
    workspacesForCurrentOrg,
    currentWorkspace,
    switchWorkspace,
    openNewRun,
    setIsNewOrgOpen,
    setIsNewWsOpen,
    jobsForCurrentWorkspace,
  } = useApp();
  const runningCount = jobsForCurrentWorkspace.filter((j) => j.status === 'run').length;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background text-foreground" data-od-id="app-shell">
        <Sidebar data-od-id="sidebar" className="border-r border-border bg-surface">
          {/* Organization & Workspace Switcher Header */}
          <SidebarHeader className="border-b border-border p-3 gap-1.5">
            <SidebarMenu>
              <SidebarMenuItem>
                {/* Org Switcher */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton size="lg" className="border border-border cursor-pointer" data-od-id="org-switcher">
                      <span className="w-8 h-8 rounded-md bg-foreground text-surface font-bold text-xs grid place-items-center shrink-0">
                        {currentOrg.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1 text-left leading-tight">
                        <span className="block font-semibold text-xs text-foreground truncate">{currentOrg.name}</span>
                        <span className="block text-[11px] text-muted truncate">
                          {currentOrg.plan} · {currentOrg.memberCount} members
                        </span>
                      </span>
                      <Icon name="chev" className="w-3.5 h-3.5 text-muted shrink-0" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuLabel className="text-[11px] text-muted font-normal">Organizations</DropdownMenuLabel>
                    <DropdownMenuGroup>
                      {organizations.map((org) => (
                        <DropdownMenuItem
                          key={org.id}
                          onClick={() => switchOrg(org.id)}
                          className="flex items-center justify-between text-xs py-2 cursor-pointer"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded bg-surface-inset border border-border font-bold text-[10px] grid place-items-center shrink-0">
                              {org.name.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="font-medium truncate">{org.name}</span>
                          </span>
                          {org.id === currentOrg.id && <Icon name="check" className="w-3.5 h-3.5 text-accent-strong" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsNewOrgOpen(true)} className="text-xs py-1.5 cursor-pointer gap-2">
                      <Icon name="plus" className="w-3.5 h-3.5" />
                      New organization
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-xs py-1.5 cursor-pointer gap-2">
                      <Link to="/settings">
                        <Icon name="gear" className="w-3.5 h-3.5" />
                        Organization settings
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>

              <SidebarMenuItem>
                {/* Workspace Switcher */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton size="sm" className="text-xs cursor-pointer" data-od-id="workspace-switcher">
                      <Icon name="folder" className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span className="font-medium text-foreground truncate flex-1">{currentWorkspace.name}</span>
                      <Icon name="chev" className="w-3 h-3 text-muted shrink-0" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-60">
                    <DropdownMenuLabel className="text-[11px] text-muted font-normal">Workspaces</DropdownMenuLabel>
                    <DropdownMenuGroup>
                      {workspacesForCurrentOrg.map((ws) => (
                        <DropdownMenuItem
                          key={ws.id}
                          onClick={() => switchWorkspace(ws.id)}
                          className="flex items-center justify-between text-xs py-1.5 cursor-pointer"
                        >
                          <span className="min-w-0">
                            <span className="block font-medium truncate">{ws.name}</span>
                            <span className="block text-[10px] text-muted">{ws.jobCount} jobs</span>
                          </span>
                          {ws.id === currentWorkspace.id && (
                            <Icon name="check" className="w-3.5 h-3.5 text-accent-strong shrink-0" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsNewWsOpen(true)} className="text-xs py-1.5 cursor-pointer gap-2">
                      <Icon name="plus" className="w-3.5 h-3.5" />
                      New workspace
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>

            <Button
              variant="accent"
              size="sm"
              onClick={() => openNewRun()}
              className="w-full h-8 text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
              data-od-id="side-quick-run"
            >
              <Icon name="plus" className="w-3.5 h-3.5" />
              New task
            </Button>
          </SidebarHeader>

          {/* Navigation content */}
          <SidebarContent className="p-2" data-od-id="side-nav">
            {NAV_GROUPS.map((group) => (
              <SidebarGroup key={group.section} className="p-0 mb-3">
                <SidebarGroupLabel className="px-2.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted h-auto">
                  {group.section}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const isActive = pathname === item.to;
                      return (
                        <SidebarMenuItem key={item.to}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            className={`h-8 px-2.5 my-0.5 rounded-md text-xs sm:text-[13px] font-medium transition-colors ${
                              isActive
                                ? 'bg-foreground text-surface font-semibold shadow-xs hover:bg-foreground hover:text-surface'
                                : 'text-foreground hover:bg-surface-hover'
                            }`}
                          >
                            <Link
                              to={item.to}
                              onClick={() => {
                                try {
                                  localStorage.setItem('tx-last-page', item.to.slice(1));
                                } catch {
                                  /* noop */
                                }
                              }}
                            >
                              <Icon
                                name={item.icon}
                                className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-surface' : 'text-muted'}`}
                              />
                              <span className="truncate">{item.label}</span>
                              {item.to === '/jobs' && runningCount > 0 && (
                                <SidebarMenuBadge
                                  className={`ml-auto text-[10.5px] font-medium px-1.5 py-0.2 rounded ${
                                    isActive
                                      ? 'text-[oklch(80%_0.04_250)] bg-transparent'
                                      : 'text-muted bg-surface-inset'
                                  }`}
                                >
                                  {runningCount} running
                                </SidebarMenuBadge>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          {/* User Profile Footer */}
          <SidebarFooter className="p-2.5 border-t border-border mt-auto">
            <div className="flex items-center gap-2.5 p-1 rounded-md">
              <Avatar className="w-7 h-7 text-[10.5px] font-bold bg-foreground text-surface">
                <AvatarFallback className="bg-foreground text-surface font-bold text-[10.5px]">PN</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-foreground truncate">Priya Nair</div>
                <div className="text-[11px] text-muted truncate">Admin · {currentOrg.name}</div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                    to="/login"
                    title="Sign out"
                    aria-label="Sign out"
                  >
                    <Icon name="out" className="w-3.5 h-3.5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Sign out</TooltipContent>
              </Tooltip>
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        {/* Main Workspace Area */}
        <SidebarInset className="min-w-0 flex-1 flex flex-col bg-background">
          <header
            className="sticky top-0 z-30 h-[52px] px-4 sm:px-6 bg-surface/85 backdrop-blur-md border-b border-border flex items-center gap-3.5"
            data-od-id="topbar"
          >
            <SidebarTrigger className="text-muted hover:text-foreground" />
            <Breadcrumb className="flex items-center">
              <BreadcrumbList className="text-xs sm:text-sm">
                <BreadcrumbItem className="hidden sm:inline-flex">
                  <span className="font-medium text-muted">{currentOrg.name}</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:inline-flex" />
                <BreadcrumbItem className="hidden md:inline-flex">
                  <span className="text-muted">{currentWorkspace.name}</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:inline-flex" />
                {middleCrumb ? (
                  <>
                    <BreadcrumbItem className="hidden md:inline-flex max-w-[180px] truncate">
                      {middleCrumb}
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:inline-flex" />
                  </>
                ) : null}
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-foreground truncate">{crumb}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <Button
                variant="accent"
                size="icon-sm"
                onClick={() => openNewRun()}
                className="md:hidden cursor-pointer"
                aria-label="New task"
                data-od-id="top-quick-run"
              >
                <Icon name="plus" className="w-4 h-4" />
              </Button>
              {actions}
              <div className="hidden sm:flex items-center gap-2">{badge}</div>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="w-8 h-8 text-muted hover:text-foreground cursor-pointer"
                  title="Notifications"
                  aria-label="Notifications"
                  onClick={() => toast('No new notifications', 'bell')}
                >
                  <Icon name="bell" className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
          </header>

          {children}

          {/* Global Modals for Organization, Workspace, and Modular Task Runs */}
          <NewRunModal />
          <CreateOrgModal />
          <CreateWorkspaceModal />
          <InviteMemberModal />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
