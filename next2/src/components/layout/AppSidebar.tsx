'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { BrandLockup } from '@/components/BrandLockup';
import { Icon } from '@/components/Icon';
import { SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  useSidebar,
} from '@/components/ui/sidebar';
import { useApp } from '@/context/AppContext';
import { usePipeline } from '@/context/PipelineContext';
import { SidebarScopeSwitcher } from './SidebarScopeSwitcher';
import {
  PROJECT_LINKS,
  TOOL_LINKS,
  ORGANIZATION_LINKS,
  type NavigationItem,
} from './sidebar-navigation';

function SidebarLinks({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { runs } = usePipeline();
  const activeCount = runs.filter(
    (run) => run.status === 'queued' || run.status === 'running',
  ).length;
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.to}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.to}
            tooltip={item.label}
            className="h-10 rounded-lg px-3"
          >
            <Link
              href={item.to}
              onClick={() => setOpenMobile(false)}
              aria-current={pathname === item.to ? 'page' : undefined}
              className="gap-3 no-underline"
            >
              <Icon name={item.icon} className="size-4" />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
          {item.to === '/jobs' && activeCount > 0 && (
            <SidebarMenuBadge className="bg-white/10 text-white">
              {activeCount}
            </SidebarMenuBadge>
          )}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function NavigationGroup({
  label,
  items,
  collapsible = false,
}: {
  label: string;
  items: NavigationItem[];
  collapsible?: boolean;
}) {
  const pathname = usePathname();
  const routeActive = items.some((item) => item.to === pathname);
  const [disclosure, setDisclosure] = useState({ pathname, open: routeActive });
  const open = disclosure.pathname === pathname ? disclosure.open : routeActive;
  const labelClass =
    'h-8 px-3 text-[10px] font-semibold uppercase tracking-[.13em] text-white/55';
  if (!collapsible)
    return (
      <SidebarGroup className="p-0 pt-3">
        <SidebarGroupLabel className={labelClass}>{label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarLinks items={items} />
        </SidebarGroupContent>
      </SidebarGroup>
    );
  return (
    <Collapsible
      open={open}
      onOpenChange={(value) => setDisclosure({ pathname, open: value })}
      className="group/navigation"
    >
      <SidebarGroup className="p-0 pt-3">
        <SidebarGroupLabel
          asChild
          className={`${labelClass} cursor-pointer rounded-md hover:text-white/80`}
        >
          <CollapsibleTrigger>
            {label}
            <ChevronDown className="ml-auto size-3 transition-transform group-data-[state=open]/navigation:rotate-180" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarLinks items={items} />
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function AppSidebar() {
  const { setOpenMobile, isMobile } = useSidebar();
  const {
    organizations,
    hasOrganization,
    hasProject,
    currentOrg,
    membersForCurrentOrg,
    workspacesForCurrentOrg,
    currentWorkspace,
    switchOrg,
    switchWorkspace,
    setIsNewOrgOpen,
    setIsNewWsOpen,
    openNewRun,
    accountEmail,
    storageScope,
  } = useApp();
  const closeMobile = () => setOpenMobile(false);
  const demoUser =
    membersForCurrentOrg.find(
      (member) => member.status === 'active' && member.role === 'Admin',
    ) ?? membersForCurrentOrg[0];
  return (
    <Sidebar
      className="app-navigation border-r border-border"
      data-od-id="sidebar"
    >
      <SidebarHeader className="gap-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/dashboard"
            onClick={closeMobile}
            className="flex items-center gap-3 py-2 no-underline"
          >
            <BrandLockup inverse />
          </Link>
          {isMobile && (
            <SheetClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Close navigation"
                className="text-white/70 hover:bg-white/10 hover:text-white"
              >
                <Icon name="x" className="size-4" />
              </Button>
            </SheetClose>
          )}
        </div>
        {hasOrganization && (
          <SidebarScopeSwitcher
            kind="organization"
            current={currentOrg}
            options={organizations}
            memberCount={currentOrg.memberCount}
            onSelect={(id) => {
              switchOrg(id);
              closeMobile();
            }}
            onCreate={() => {
              closeMobile();
              setIsNewOrgOpen(true);
            }}
          />
        )}
        {hasOrganization && (
          <SidebarScopeSwitcher
            kind="project"
            current={currentWorkspace}
            options={workspacesForCurrentOrg}
            onSelect={(id) => {
              switchWorkspace(id);
              closeMobile();
            }}
            onCreate={() => {
              closeMobile();
              setIsNewWsOpen(true);
            }}
          />
        )}
        {!hasOrganization ? (
          <Button
            variant="accent"
            className="h-10 w-full justify-center gap-2"
            onClick={() => setIsNewOrgOpen(true)}
          >
            <Icon name="plus" className="size-4" />
            Create organization
          </Button>
        ) : !hasProject ? (
          <Button
            variant="accent"
            className="h-10 w-full justify-center gap-2"
            onClick={() => setIsNewWsOpen(true)}
          >
            <Icon name="plus" className="size-4" />
            Create project
          </Button>
        ) : (
          <Button
            variant="accent"
            className="h-10 w-full justify-center gap-2"
            onClick={() => {
              closeMobile();
              openNewRun();
            }}
          >
            <Icon name="play" className="size-4" />
            Start pipeline
          </Button>
        )}
      </SidebarHeader>
      <SidebarContent className="px-3 pb-3">
        {hasOrganization && (
          <nav aria-label="Main navigation">
            {hasProject && (
              <>
                <NavigationGroup label="Project" items={PROJECT_LINKS} />
                <NavigationGroup
                  label="Explore tools"
                  items={TOOL_LINKS}
                  collapsible
                />
              </>
            )}
            <NavigationGroup
              label="Organization"
              items={ORGANIZATION_LINKS}
              collapsible
            />
          </nav>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-white/10 p-4">
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-accent-soft text-xs font-semibold text-accent-strong">
              {demoUser?.initials ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium text-white">
              {demoUser?.name ?? accountEmail}
            </span>
            <span className="block text-[11px] text-white/55">
              {storageScope ? 'Account workspace' : 'Demo access'}
            </span>
          </span>
          <Button
            asChild
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <Link href="/login" aria-label="Open login" title="Open login">
              <Icon name="out" className="size-4" />
            </Link>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
