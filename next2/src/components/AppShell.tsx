'use client';

import React from 'react';
import { Link, usePathname } from '../lib/navigation';
import { Icon } from './Icon';
import { useToast } from './Toast';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type Persona = { initials: string; name: string; role: string };

const PERSONAS: Record<string, Persona> = {
  projects: { initials: 'PN', name: 'Priya Nair', role: 'Admin' },
  jobs: { initials: 'PN', name: 'Priya Nair', role: 'Admin' },
  dashboard: { initials: 'PN', name: 'Priya Nair', role: 'Admin' },
  analysis: { initials: 'RM', name: 'Riya Menon', role: 'Business Analyst' },
  design: { initials: 'DS', name: 'Devika Sharma', role: 'CX Designer' },
  develop: { initials: 'AS', name: 'Arjun Shah', role: 'Developer' },
  connectors: { initials: 'PN', name: 'Priya Nair', role: 'Admin' },
  settings: { initials: 'PN', name: 'Priya Nair', role: 'Admin' },
  rbac: { initials: 'PN', name: 'Priya Nair', role: 'Admin' },
  'audit-log': { initials: 'PN', name: 'Priya Nair', role: 'Admin' },
};

type NavItem = { to: string; icon: Parameters<typeof Icon>[0]['name']; label: string; tail?: string };

const NAV: { section?: string; items: NavItem[] }[] = [
  { items: [{ to: '/projects', icon: 'grid', label: 'Projects' }] },
  { section: 'Workspace', items: [
    { to: '/jobs', icon: 'clock', label: 'Jobs' },
    { to: '/dashboard', icon: 'chart', label: 'Dashboard' },
  ]},
  { section: 'Pipeline · Skyline Broadband', items: [
    { to: '/analysis', icon: 'chart', label: 'Analysis', tail: '68%' },
    { to: '/design', icon: 'flow', label: 'Design', tail: 'Review' },
    { to: '/develop', icon: 'code', label: 'Develop', tail: 'Ready' },
  ]},
  { section: 'Data', items: [
    { to: '/connectors', icon: 'plug', label: 'Connectors', tail: '5' },
  ]},
  { section: 'Admin', items: [
    { to: '/settings', icon: 'gear', label: 'Settings' },
    { to: '/rbac', icon: 'users', label: 'Team & roles' },
    { to: '/audit-log', icon: 'scroll', label: 'Audit log' },
  ]},
];

export function AppShell({ children, crumb, middleCrumb, badge, actions }: {
  children: React.ReactNode;
  crumb: string;
  middleCrumb?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const toast = useToast();
  const key = pathname.replace(/^\//, '') || 'projects';
  const persona = PERSONAS[key] ?? PERSONAS.projects;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background text-foreground" data-od-id="app-shell">
        <Sidebar data-od-id="sidebar" className="border-r border-border bg-surface">
          {/* Header */}
          <SidebarHeader className="border-b border-border p-3.5">
            <div className="flex items-center gap-2.5">
              <img className="h-4.5 w-auto block shrink-0" src="/EXL_Service_logo.svg.webp" alt="EXL" />
              <span className="w-px h-4 bg-border shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm tracking-tight text-foreground">Transform.cx</div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-muted">Skyline workspace</div>
              </div>
            </div>
          </SidebarHeader>

          {/* Navigation content */}
          <SidebarContent className="p-2" data-od-id="side-nav">
            {NAV.map((group, gi) => (
              <SidebarGroup key={gi} className="p-0 mb-2">
                {group.section && (
                  <SidebarGroupLabel className="px-2.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted h-auto">
                    {group.section}
                  </SidebarGroupLabel>
                )}
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
                                try { localStorage.setItem('tx-last-page', item.to.slice(1)); } catch { /* noop */ }
                              }}
                            >
                              <Icon
                                name={item.icon}
                                className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-surface' : 'text-muted'}`}
                              />
                              <span className="truncate">{item.label}</span>
                              {item.tail && (
                                <SidebarMenuBadge
                                  className={`ml-auto text-[11px] font-medium px-1.5 py-0.5 rounded ${
                                    isActive
                                      ? 'text-[oklch(80%_0.04_250)] bg-transparent'
                                      : 'text-muted bg-surface-inset'
                                  }`}
                                >
                                  {item.tail}
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

          {/* User profile footer */}
          <SidebarFooter className="p-2.5 border-t border-border mt-auto">
            <div className="flex items-center gap-2.5 p-1 rounded-md">
              <Avatar className="w-7 h-7 text-[10.5px] font-bold bg-foreground text-surface">
                <AvatarFallback className="bg-foreground text-surface font-bold text-[10.5px]">
                  {persona.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-foreground truncate">{persona.name}</div>
                <div className="text-[11px] text-muted truncate">{persona.role}</div>
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

        {/* Main Area */}
        <SidebarInset className="min-w-0 flex-1 flex flex-col bg-background">
          <header className="sticky top-0 z-30 h-[52px] px-4 sm:px-6 bg-surface/85 backdrop-blur-md border-b border-border flex items-center gap-3.5" data-od-id="topbar">
            <SidebarTrigger className="text-muted hover:text-foreground" />
            <Breadcrumb className="flex items-center">
              <BreadcrumbList className="text-xs sm:text-sm">
                <BreadcrumbItem className="hidden sm:inline-flex">
                  <BreadcrumbLink href="/projects" className="text-muted hover:text-foreground">
                    Skyline workspace
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:inline-flex" />
                {middleCrumb ? (
                  <>
                    <BreadcrumbItem className="hidden md:inline-flex max-w-[200px] truncate">
                      {middleCrumb}
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:inline-flex" />
                  </>
                ) : null}
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-foreground truncate">
                    {crumb}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              {actions}
              <div className="hidden sm:flex items-center gap-2">
                {badge}
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                  title="Notifications"
                  aria-label="Notifications"
                  onClick={() => toast('No new notifications', 'bell')}
                >
                  <Icon name="bell" className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
          </header>
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
