'use client';

import { useState, useEffect } from 'react';
import { Link, usePathname } from '../lib/navigation';
import { Icon } from './Icon';
import { useToast } from './Toast';

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const key = pathname.replace(/^\//, '') || 'projects';
  const persona = PERSONAS[key] ?? PERSONAS.projects;

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[232px_1fr] bg-background text-foreground" data-od-id="app-shell">
      {/* Mobile Backdrop Scrim */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-200 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-[260px] lg:w-[232px] bg-surface border-r border-border flex flex-col z-50 lg:z-auto transition-transform duration-200 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
        data-od-id="sidebar"
      >
        <div className="flex items-center gap-2.5 p-3.5 border-b border-border">
          <img className="h-4.5 w-auto block shrink-0" src="/EXL_Service_logo.svg.webp" alt="EXL" />
          <span className="w-px h-4 bg-border shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm tracking-tight text-foreground">Transform.cx</div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted">Skyline workspace</div>
          </div>
          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-foreground hover:bg-surface-hover cursor-pointer transition-colors"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        <nav className="p-2 flex-1 overflow-y-auto space-y-2" data-od-id="side-nav">
          {NAV.map((group, gi) => (
            <div key={gi}>
              {group.section && (
                <div className="px-2.5 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {group.section}
                </div>
              )}
              {group.items.map((item) => {
                const isActive = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    className={`flex items-center gap-2.5 w-full h-8 px-2.5 my-0.5 rounded-md text-xs sm:text-[13px] font-medium transition-colors ${
                      isActive
                        ? 'bg-foreground text-surface font-semibold shadow-xs'
                        : 'text-foreground hover:bg-surface-hover'
                    }`}
                    to={item.to}
                    onClick={() => {
                      setMobileOpen(false);
                      try { localStorage.setItem('tx-last-page', item.to.slice(1)); } catch { /* noop */ }
                    }}
                  >
                    <Icon name={item.icon} className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-surface' : 'text-muted'}`} />
                    <span className="truncate">{item.label}</span>
                    {item.tail && (
                      <span className={`ml-auto text-[11px] ${isActive ? 'text-[oklch(80%_0.04_250)] font-medium' : 'text-muted'}`}>
                        {item.tail}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-2.5 border-t border-border mt-auto">
          <div className="flex items-center gap-2.5 p-1 rounded-md">
            <span className="w-7 h-7 rounded-full bg-foreground text-surface grid place-items-center text-[10.5px] font-bold shrink-0">
              {persona.initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-foreground truncate">{persona.name}</div>
              <div className="text-[11px] text-muted truncate">{persona.role}</div>
            </div>
            <Link
              className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
              to="/login"
              title="Sign out"
              aria-label="Sign out"
            >
              <Icon name="out" className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="min-w-0 flex-1 flex flex-col">
        <header className="sticky top-0 z-30 h-[52px] px-4 sm:px-6 bg-surface/85 backdrop-blur-md border-b border-border flex items-center gap-3.5" data-od-id="topbar">
          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <Icon name="menu" className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0 text-muted">
            <span className="hidden sm:inline hover:text-foreground transition-colors">Skyline workspace</span>
            <span className="hidden sm:inline text-border">/</span>
            {middleCrumb ? (
              <>
                <span className="hover:text-foreground transition-colors">{middleCrumb}</span>
                <span className="text-border">/</span>
              </>
            ) : null}
            <span className="font-semibold text-foreground truncate">{crumb}</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            {actions}
            {badge}
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
            title="Notifications"
            onClick={() => toast('No new notifications', 'bell')}
          >
            <Icon name="bell" className="w-4 h-4" />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
