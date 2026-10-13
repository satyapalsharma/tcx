'use client';

import { useSyncExternalStore } from 'react';
import Image from 'next/image';
import { Link } from '../lib/navigation';
import { Icon } from '../components/Icon';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const SCREENS = [
  {
    to: '/login',
    pri: true,
    od: 'scr-login',
    icon: 'lock' as const,
    name: 'Login',
    desc: 'Passwordless demo entry · no real authentication',
  },
  {
    to: '/projects',
    od: 'scr-projects',
    icon: 'grid' as const,
    name: 'Projects home',
    desc: 'Projects · pipeline status',
  },
  {
    to: '/jobs',
    od: 'scr-jobs',
    icon: 'clock' as const,
    name: 'Jobs',
    desc: 'Start a task · track runs in this project',
  },
  {
    to: '/dashboard',
    od: 'scr-dashboard',
    icon: 'chart' as const,
    name: 'Dashboard',
    desc: 'Intents · L1→L2→L3 clusters · agent builds',
  },
  {
    to: '/analysis',
    od: 'scr-analysis',
    icon: 'search' as const,
    name: 'Intent Discovery',
    desc: 'Extract intents or cluster existing taxonomy',
  },
  {
    to: '/design',
    od: 'scr-design',
    icon: 'flow' as const,
    name: 'Process Designer',
    desc: 'Process map + UML · review & approve workflow',
  },
  {
    to: '/develop',
    od: 'scr-develop',
    icon: 'code' as const,
    name: 'Agent Builder',
    desc: 'ADK / Bedrock / LangGraph code generation',
  },
  {
    to: '/connectors',
    od: 'scr-connectors',
    icon: 'plug' as const,
    name: 'Connections',
    desc: 'Local demo entries for S3, Salesforce, HubSpot & contact centers',
  },
  {
    to: '/rbac',
    od: 'scr-rbac',
    icon: 'users' as const,
    name: 'Members',
    desc: 'Manage demo members and product-guidance roles',
  },
  {
    to: '/settings',
    od: 'scr-settings',
    icon: 'gear' as const,
    name: 'Settings',
    desc: 'Organization profile, members & projects',
  },
  {
    to: '/audit-log',
    od: 'scr-audit',
    icon: 'scroll' as const,
    name: 'Audit Log',
    desc: 'Search the local demo activity timeline',
  },
];

const subscribeToLastPage = (callback: () => void) => {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
};
const getLastPage = () => {
  try {
    const page = localStorage.getItem('tx-last-page');
    return SCREENS.some((screen) => screen.to.slice(1) === page) ? page : null;
  } catch {
    return null;
  }
};

export default function Launcher() {
  const lastPage = useSyncExternalStore(
    subscribeToLastPage,
    getLastPage,
    () => null,
  );

  const lastLabel = lastPage
    ? lastPage.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase())
    : '';

  return (
    <main
      className="min-h-screen grid place-items-center p-6 sm:p-12 bg-background text-foreground"
      data-od-id="launcher"
    >
      <div className="w-full max-w-[760px]">
        <div className="flex items-center gap-2.5">
          <Image
            className="block h-[22px] w-auto shrink-0"
            src="/EXL_Service_logo.svg.webp"
            alt="EXL"
            width={1280}
            height={477}
            priority
          />
          <span className="w-px h-5.5 bg-border shrink-0" aria-hidden="true" />
          <div>
            <div className="font-bold text-base tracking-tight text-foreground">
              Transform.cx
            </div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-muted mt-0.5">
              Prototype v1 · EXL
            </div>
          </div>
          <Badge
            variant="outline"
            className="ml-auto inline-flex items-center gap-1.5 h-5.5 px-2 text-xs font-medium rounded-full bg-surface-inset border-border text-foreground"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-muted" />
            {SCREENS.length} screens
          </Badge>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-4 leading-tight">
          Conversation-to-automation pipeline,
          <br className="hidden sm:inline" /> broken into clean stages
        </h1>

        <p className="text-muted text-sm sm:text-[14.5px] mt-2 max-w-[58ch] leading-relaxed">
          Customer interactions in → intents extracted → L1→L2→L3 clusters →
          process maps → agent code. Three umbrellas — <strong>Analysis</strong>{' '}
          (Analysts), <strong>Design</strong> (CX Designers),{' '}
          <strong>Develop</strong> (Developers) — each usable on its own or
          stacked end-to-end. Demo tells the Skyline Broadband story throughout.
        </p>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-8"
          data-od-id="screen-list"
        >
          {SCREENS.map((s) => (
            <Card
              key={s.to}
              className={`p-0 overflow-hidden border transition-all duration-150 active:translate-y-px shadow-xs ${
                s.pri
                  ? 'border-accent-border bg-accent-soft hover:border-accent'
                  : 'bg-surface border-border hover:border-border-strong hover:bg-surface-hover'
              }`}
            >
              <Link
                className="group flex items-center gap-3 p-3.5 text-foreground w-full h-full"
                to={s.to}
                data-od-id={s.od}
                onClick={() => {
                  try {
                    localStorage.setItem('tx-last-page', s.to.slice(1));
                  } catch {
                    /* noop */
                  }
                }}
              >
                <span
                  className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${s.pri ? 'bg-accent-strong text-white' : 'bg-surface-inset text-muted'}`}
                >
                  <Icon name={s.icon} className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs sm:text-[13px] text-foreground">
                    {s.name}
                  </div>
                  <div className="text-xs text-muted truncate mt-0.5">
                    {s.desc}
                  </div>
                </div>
                <Icon
                  name="arrowr"
                  className="ml-auto text-muted w-4 h-4 transition-colors group-hover:text-foreground shrink-0"
                />
              </Link>
            </Card>
          ))}
        </div>

        {lastPage && (
          <Card
            className="mt-6 p-3.5 sm:px-4 bg-surface-inset border border-border/70 rounded-lg text-xs text-muted flex flex-row items-center gap-2 flex-wrap shadow-none"
            data-od-id="resume-note"
          >
            <Icon name="clock" className="w-3.5 h-3.5 text-muted shrink-0" />
            <span>Last opened:</span>
            <Link
              className="text-accent-strong hover:underline font-medium"
              to={`/${lastPage}`}
            >
              {lastLabel}
            </Link>
            <span className="text-border">·</span>
            <span>sidebar also returns you to any stage directly</span>
          </Card>
        )}
      </div>
    </main>
  );
}
