'use client';

import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useReveal } from '../hooks/useReveal';
import { PageHeader, StatusBadge } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '../lib/navigation';
import { useApp, type ModularTaskType } from '@/context/AppContext';

const ACTIONS: { type: ModularTaskType; title: string; description: string; icon: 'search' | 'chart' }[] = [
  { type: 'extract_intents', title: 'Analyze intents', description: 'Find intents and themes in customer conversations.', icon: 'search' },
  { type: 'cluster_intents', title: 'Cluster existing intents', description: 'Group existing intents into a clear taxonomy.', icon: 'chart' },
];

const SECONDARY_ACTIONS: { type: ModularTaskType; label: string; icon: 'flow' | 'code' | 'bolt' }[] = [
  { type: 'design_flow', label: 'Design a flow', icon: 'flow' },
  { type: 'generate_agent', label: 'Build an agent', icon: 'code' },
  { type: 'full_pipeline', label: 'Run the full pipeline', icon: 'bolt' },
];

export default function Dashboard() {
  useReveal();
  const { currentWorkspace, jobsForCurrentWorkspace: jobs, openNewRun } = useApp();
  const recentJobs = [...jobs].slice(0, 5);

  return (
    <AppShell crumb="Workspace">
      <main className="p-5 sm:p-8 lg:p-10 max-w-[1120px] mx-auto w-full pb-16" data-od-id="dashboard-page">
        <PageHeader
          title={currentWorkspace.name}
          description={currentWorkspace.description || 'A place to analyze customer conversations and build CX workflows.'}
          dataOdId="page-title"
          actions={
            <Button type="button" variant="accent" className="gap-2 h-10 px-4" onClick={() => openNewRun()}>
              <Icon name="plus" className="w-4 h-4" />New job
            </Button>
          }
        />

        <section aria-labelledby="start-heading" className="mt-10">
          <div className="mb-4">
            <h2 id="start-heading" className="text-base font-semibold text-foreground">What would you like to do?</h2>
            <p className="mt-1 text-sm text-muted">Start with the customer data or intents you already have.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ACTIONS.map((action) => (
              <Button
                type="button"
                variant="ghost"
                key={action.type}
                onClick={() => openNewRun(action.type)}
                className="h-auto p-0 text-left rounded-xl hover:bg-transparent cursor-pointer block w-full whitespace-normal"
                aria-label={`${action.title}: ${action.description}`}
              >
                <Card className="h-full min-h-36 gap-2 p-5 bg-surface border border-border rounded-xl shadow-xs hover:border-accent/50 hover:bg-surface-hover/50 transition-colors group">
                  <span className="w-10 h-10 rounded-lg bg-surface-inset grid place-items-center mb-2">
                    <Icon name={action.icon} className="w-5 h-5 text-foreground" />
                  </span>
                  <span className="flex items-center gap-2 text-base font-semibold text-foreground">
                    {action.title}<Icon name="arrowr" className="w-4 h-4 text-muted group-hover:text-accent-strong transition-colors" />
                  </span>
                  <span className="block mt-1.5 text-sm leading-relaxed text-muted">{action.description}</span>
                </Card>
              </Button>
            ))}
          </div>
        </section>

        <section aria-labelledby="more-heading" className="mt-9">
          <h2 id="more-heading" className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">More ways to continue</h2>
          <div className="flex flex-wrap gap-2">
            {SECONDARY_ACTIONS.map((action) => (
              <Button key={action.type} type="button" variant="outline" className="gap-2" onClick={() => openNewRun(action.type)}>
                <Icon name={action.icon} className="w-4 h-4 text-muted" />{action.label}
              </Button>
            ))}
          </div>
        </section>

        <section aria-labelledby="recent-jobs-heading" className="mt-12">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <h2 id="recent-jobs-heading" className="text-base font-semibold text-foreground">Recent jobs</h2>
              <p className="mt-1 text-sm text-muted">Work started in this workspace.</p>
            </div>
            {recentJobs.length > 0 && <Link to="/jobs" className="text-sm font-medium text-accent-strong hover:underline">View all jobs</Link>}
          </div>
          {recentJobs.length ? (
            <Card className="bg-surface border border-border rounded-xl shadow-xs divide-y divide-border overflow-hidden p-0 gap-0">
              {recentJobs.map((job) => (
                <Link key={`${job.id}-${job.started}`} to="/jobs" className="flex items-center gap-4 px-4 sm:px-5 py-4 hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground truncate">{job.subtitle}</span>
                    <span className="block mt-1 text-xs text-muted">{job.id} · {job.pipeline} · {job.started}</span>
                  </span>
                  <StatusBadge status={job.status === 'done' ? 'ok' : job.status === 'failed' ? 'danger' : job.status === 'run' ? 'warn' : 'neutral'}>
                    {job.statusLabel}
                  </StatusBadge>
                  <Icon name="chevr" className="w-4 h-4 text-muted shrink-0" />
                </Link>
              ))}
            </Card>
          ) : (
            <Card className="p-7 sm:p-9 bg-surface border border-border border-dashed rounded-xl shadow-xs text-center">
              <span className="mx-auto w-10 h-10 rounded-full bg-surface-inset grid place-items-center">
                <Icon name="clock" className="w-5 h-5 text-muted" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-foreground">No jobs yet</h3>
              <p className="mt-1 text-sm text-muted">Choose an action above to start work in this workspace.</p>
            </Card>
          )}
        </section>
      </main>
    </AppShell>
  );
}
