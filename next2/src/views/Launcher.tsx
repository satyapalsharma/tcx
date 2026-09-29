'use client';

import { useEffect, useState } from 'react';
import { Link } from '../lib/navigation';
import { Icon } from '../components/Icon';

const SCREENS = [
  { to: '/login', pri: true, od: 'scr-login', icon: 'lock' as const, name: 'Login', desc: 'Sign in · SSO + SAML stubs · demo gate' },
  { to: '/projects', od: 'scr-projects', icon: 'grid' as const, name: 'Projects home', desc: '3 umbrellas · project cards · pipeline status' },
  { to: '/jobs', od: 'scr-jobs', icon: 'clock' as const, name: 'Jobs', desc: 'All runs · status, cost tag, cancel / rerun / delete' },
  { to: '/dashboard', od: 'scr-dashboard', icon: 'chart' as const, name: 'Run dashboard', desc: 'Intents · L1→L2→L3 clusters · agents with filters + sort' },
  { to: '/analysis', od: 'scr-analysis', icon: 'chart' as const, name: "Analysis · Riya's view", desc: 'Intents · L1→L2→L3 clusters · live run progress' },
  { to: '/design', od: 'scr-design', icon: 'flow' as const, name: "Design · Devika's view", desc: 'Process map + UML · review & approve workflow' },
  { to: '/develop', od: 'scr-develop', icon: 'code' as const, name: "Develop · Arjun's view", desc: 'ADK / Bedrock / LangGraph code gen · build tracking' },
  { to: '/connectors', od: 'scr-connectors', icon: 'plug' as const, name: "Connectors · Priya's view", desc: 'S3 · Genesys · Salesforce · sync health' },
  { to: '/rbac', od: 'scr-rbac', icon: 'users' as const, name: 'Team & roles (RBAC)', desc: 'Members · umbrella chips · permission matrix' },
  { to: '/settings', od: 'scr-settings', icon: 'gear' as const, name: 'Settings', desc: 'Clients · cost tagging · workspace defaults' },
  { to: '/audit-log', od: 'scr-audit', icon: 'scroll' as const, name: 'Audit log', desc: 'Filterable timeline · actor + scope filters · export' },
];

export default function Launcher() {
  const [lastPage, setLastPage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const lp = localStorage.getItem('tx-last-page');
      if (lp && lp !== 'index') setLastPage(lp);
    } catch { /* noop */ }
  }, []);

  const lastLabel = lastPage ? lastPage.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()) : '';

  return (
    <main className="min-h-screen grid place-items-center p-6 sm:p-12 bg-background text-foreground" data-od-id="launcher">
      <div className="w-full max-w-[760px]">
        <div className="flex items-center gap-2.5">
          <img className="h-5.5 w-auto block shrink-0" src="/EXL_Service_logo.svg.webp" alt="EXL" />
          <span className="w-px h-5.5 bg-border shrink-0" aria-hidden="true" />
          <div>
            <div className="font-bold text-base tracking-tight text-foreground">Transform.cx</div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-muted mt-0.5">Prototype v1 · EXL</div>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 h-5.5 px-2 text-xs font-medium rounded-full bg-surface-inset border border-border text-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-muted" />12 screens
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-4 leading-tight">
          Conversation-to-automation pipeline,<br className="hidden sm:inline" /> broken into clean stages
        </h1>

        <p className="text-muted text-sm sm:text-[14.5px] mt-2 max-w-[58ch] leading-relaxed">
          Customer interactions in → intents extracted → L1→L2→L3 clusters → process maps → agent code. Three umbrellas — <strong>Analysis</strong> (Analysts), <strong>Design</strong> (CX Designers), <strong>Develop</strong> (Developers) — each usable on its own or stacked end-to-end. Demo tells the Skyline Broadband story throughout.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-8" data-od-id="screen-list">
          {SCREENS.map((s) => (
            <Link
              key={s.to}
              className={`group flex items-center gap-3 p-3.5 rounded-lg border text-foreground transition-all duration-150 active:translate-y-px ${
                s.pri
                  ? 'border-accent-border bg-accent-soft hover:bg-accent-soft hover:border-accent'
                  : 'bg-surface border-border hover:border-[oklch(85%_0.008_250)] hover:bg-surface-hover'
              }`}
              to={s.to}
              data-od-id={s.od}
              onClick={() => { try { localStorage.setItem('tx-last-page', s.to.slice(1)); } catch { /* noop */ } }}
            >
              <span className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${s.pri ? 'bg-accent-strong text-white' : 'bg-surface-inset text-muted'}`}>
                <Icon name={s.icon} className="w-4 h-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs sm:text-[13px] text-foreground">{s.name}</div>
                <div className="text-xs text-muted truncate mt-0.5">{s.desc}</div>
              </div>
              <Icon name="arrowr" className="ml-auto text-muted w-4 h-4 transition-colors group-hover:text-foreground shrink-0" />
            </Link>
          ))}
        </div>

        {lastPage && (
          <div className="mt-6 p-3.5 sm:px-4 bg-surface-inset border border-border/70 rounded-lg text-xs text-muted flex items-center gap-2 flex-wrap" data-od-id="resume-note">
            <Icon name="clock" className="w-3.5 h-3.5 text-muted shrink-0" />
            <span>Last opened in this session:</span>
            <Link className="text-accent-strong hover:underline font-medium" to={`/${lastPage}`}>{lastLabel}</Link>
            <span className="text-border">·</span>
            <span>sidebar also returns you to any stage directly</span>
          </div>
        )}
      </div>
    </main>
  );
}
