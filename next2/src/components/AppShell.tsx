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
    <div className="app" data-od-id="app-shell">
      <div
        className={`side-scrim${mobileOpen ? ' open' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <aside className={`side${mobileOpen ? ' mobile-open' : ''}`} data-od-id="sidebar">
        <div className="side-brand">
          <img className="exl-logo" src="/EXL_Service_logo.svg.webp" alt="EXL" />
          <span className="brand-div" aria-hidden="true" />
          <div className="brand-text">
            <div className="brand-prod">Transform.cx</div>
            <div className="caps" style={{ marginTop: 0 }}>Skyline workspace</div>
          </div>
          <button
            type="button"
            className="icon-btn side-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <Icon name="x" />
          </button>
        </div>
        <nav className="nav" data-od-id="side-nav">
          {NAV.map((group, gi) => (
            <div key={gi}>
              {group.section && <div className="sec">{group.section}</div>}
              {group.items.map((item) => (
                <Link
                  key={item.to}
                  className={`nlink${pathname === item.to ? ' active' : ''}`}
                  to={item.to}
                  onClick={() => {
                    setMobileOpen(false);
                    try { localStorage.setItem('tx-last-page', item.to.slice(1)); } catch { /* noop */ }
                  }}
                >
                  <Icon name={item.icon} />
                  <span className="nlabel">{item.label}</span>
                  {item.tail && <span className="tail">{item.tail}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-foot">
          <div className="listitem" style={{ border: 0, padding: '4px 8px' }}>
            <span className="avatar avatar-sm">{persona.initials}</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '12.5px', fontWeight: 560 }}>{persona.name}</div>
              <div className="hint" style={{ fontSize: '11px' }}>{persona.role}</div>
            </div>
            <Link className="icon-btn" to="/login" title="Sign out" aria-label="Sign out">
              <Icon name="out" />
            </Link>
          </div>
        </div>
      </aside>
      <div className="main">
        <header className="topbar" data-od-id="topbar">
          <button
            type="button"
            className="icon-btn mobile-menu-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <Icon name="menu" />
          </button>
          <div className="crumbs">
            <span className="crumb-root">Skyline workspace</span><span className="sep crumb-root-sep">/</span>
            {middleCrumb ? (<><span className="crumb-mid">{middleCrumb}</span><span className="sep crumb-mid-sep">/</span></>) : null}
            <span className="here">{crumb}</span>
          </div>
          <div className="spacer" />
          <div className="topbar-actions">
            {actions}
            {badge}
          </div>
          <button type="button" className="icon-btn" title="Notifications" onClick={() => toast('No new notifications', 'bell')}>
            <Icon name="bell" />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
