'use client';

import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { PageHeader } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from '../lib/navigation';
import { useApp } from '@/context/AppContext';
import { usePipeline } from '@/context/PipelineContext';

export default function Projects() {
  const navigate = useNavigate();
  const {
    currentOrg,
    currentWorkspace,
    workspacesForCurrentOrg,
    switchWorkspace,
    setIsNewWsOpen,
  } = useApp();
  const { runs, artifacts } = usePipeline();

  return (
    <AppShell crumb="Projects">
      <div
        className="mx-auto w-full max-w-[1320px] space-y-6 p-5 sm:p-8"
        data-od-id="projects-page"
      >
        <PageHeader
          title="Projects"
          description={`Projects keep ${currentOrg.name}’s shared outputs and team work organized.`}
          actions={
            <Button
              variant="accent"
              className="gap-2"
              onClick={() => setIsNewWsOpen(true)}
            >
              <Icon name="plus" className="size-4" />
              New project
            </Button>
          }
        />
        {workspacesForCurrentOrg.length ? (
          <section
            aria-label="Projects"
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
          >
            {workspacesForCurrentOrg.map((workspace) => {
              const isCurrent = workspace.id === currentWorkspace.id;
              return (
                <Card
                  key={workspace.id}
                  className={`flex h-full flex-col p-5 transition-colors ${isCurrent ? 'border-accent-border bg-accent-soft/20' : 'hover:border-border-strong'}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-inset">
                      <Icon name="folder" className="size-5 text-muted" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-semibold">
                          {workspace.name}
                        </h2>
                        {isCurrent && (
                          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-strong">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-muted">
                        {workspace.description || 'No description added.'}
                      </p>
                    </div>
                  </div>
                  {isCurrent ? (
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-surface-inset/60 p-3">
                        <p className="text-lg font-semibold">
                          {artifacts.length}
                        </p>
                        <p className="text-xs text-muted">Shared outputs</p>
                      </div>
                      <div className="rounded-lg bg-surface-inset/60 p-3">
                        <p className="text-lg font-semibold">{runs.length}</p>
                        <p className="text-xs text-muted">Runs</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-5 rounded-lg bg-surface-inset/50 p-3 text-xs text-muted">
                      Open this project to view its shared outputs and runs.
                    </p>
                  )}
                  <div className="mt-auto flex justify-end pt-5">
                    <Button
                      type="button"
                      variant={isCurrent ? 'outline' : 'secondary'}
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        switchWorkspace(workspace.id);
                        navigate('/dashboard');
                      }}
                    >
                      Open project
                      <Icon name="arrowr" className="size-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </section>
        ) : (
          <Card className="mt-8 border-dashed p-8 text-center">
            <span className="mx-auto grid size-10 place-items-center rounded-full bg-surface-inset">
              <Icon name="folder" className="size-5 text-muted" />
            </span>
            <h2 className="mt-4 text-sm font-semibold">No projects yet</h2>
            <p className="mt-1 text-sm text-muted">
              Create a project to organize shared customer work for this
              organization.
            </p>
            <Button
              variant="accent"
              className="mt-4 gap-2"
              onClick={() => setIsNewWsOpen(true)}
            >
              <Icon name="plus" className="size-4" />
              New project
            </Button>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
