'use client';

import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useReveal } from '../hooks/useReveal';
import { PageHeader } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from '../lib/navigation';
import { useApp } from '@/context/AppContext';

export default function Projects() {
  useReveal();
  const navigate = useNavigate();
  const { currentOrg, currentWorkspace, workspacesForCurrentOrg, jobs, switchWorkspace, setIsNewWsOpen } = useApp();

  return (
    <AppShell crumb="Workspaces">
      <main className="p-5 sm:p-8 lg:p-10 max-w-[1120px] mx-auto w-full pb-16" data-od-id="workspaces-page">
        <PageHeader
          title="Workspaces"
          description={`Workspaces keep ${currentOrg.name}’s jobs and customer work organized.`}
          dataOdId="page-title"
          actions={
            <Button type="button" variant="accent" className="gap-2 h-10 px-4" onClick={() => setIsNewWsOpen(true)}>
              <Icon name="plus" className="w-4 h-4" />New workspace
            </Button>
          }
        />

        {workspacesForCurrentOrg.length ? (
          <section aria-label="Workspaces" className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
            {workspacesForCurrentOrg.map((workspace) => {
              const jobCount = jobs.filter((job) => job.workspaceId === workspace.id).length;
              const isCurrent = workspace.id === currentWorkspace.id;
              return (
                <Card key={workspace.id} className="p-5 sm:p-6 bg-surface border border-border rounded-xl shadow-xs hover:border-accent/40 transition-colors">
                  <div className="flex items-start gap-4">
                    <span className="w-10 h-10 rounded-lg bg-surface-inset grid place-items-center shrink-0">
                      <Icon name="folder" className="w-5 h-5 text-muted" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-semibold text-foreground truncate">{workspace.name}</h2>
                        {isCurrent && <span className="text-[11px] font-medium rounded-full bg-accent-soft text-accent-strong px-2 py-0.5">Current</span>}
                      </div>
                      <p className="mt-1 text-sm text-muted leading-relaxed">{workspace.description || 'No description added.'}</p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-xs text-muted">{jobCount} {jobCount === 1 ? 'job' : 'jobs'}</span>
                        <Button
                          type="button"
                          variant={isCurrent ? 'outline' : 'secondary'}
                          size="sm"
                          className="gap-2"
                          onClick={() => { switchWorkspace(workspace.id); navigate('/dashboard'); }}
                        >
                          Open workspace<Icon name="arrowr" className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </section>
        ) : (
          <Card className="mt-8 p-8 sm:p-10 bg-surface border border-border border-dashed rounded-xl shadow-xs text-center">
            <span className="mx-auto w-10 h-10 rounded-full bg-surface-inset grid place-items-center">
              <Icon name="folder" className="w-5 h-5 text-muted" />
            </span>
            <h2 className="mt-4 text-sm font-semibold text-foreground">No workspaces yet</h2>
            <p className="mt-1 text-sm text-muted">Create a workspace to organize jobs for this organization.</p>
            <Button type="button" variant="accent" className="mt-4 gap-2" onClick={() => setIsNewWsOpen(true)}>
              <Icon name="plus" className="w-4 h-4" />New workspace
            </Button>
          </Card>
        )}
      </main>
    </AppShell>
  );
}
