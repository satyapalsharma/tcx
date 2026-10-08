'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon, type IconName } from '../components/Icon';
import { CloseButton, Dialog, Drawer, useOverlay } from '../components/Overlay';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';
import { useApp, type ModularTaskType, type WorkspaceJob } from '@/context/AppContext';
import { JOB_STEPS, type StepStatus } from '../data/jobs';
import { KpiCard, PageHeader, StatusBadge, EmptyState, SearchToolbar, SelectField } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from 'cn';

const STEP_ICONS: Record<StepStatus, Parameters<typeof Icon>[0]['name']> = {
  done: 'check',
  run: 'sync',
  wait: 'dot',
  failed: 'x',
};

const QUICK_LAUNCH: { type: ModularTaskType; label: string; hint: string; icon: IconName }[] = [
  { type: 'extract_intents', label: 'Extract intents', hint: 'From transcripts', icon: 'search' },
  { type: 'cluster_intents', label: 'Cluster intents', hint: 'L1 / L2 taxonomy', icon: 'chart' },
  { type: 'design_flow', label: 'Design flow', hint: 'Process map', icon: 'flow' },
  { type: 'generate_agent', label: 'Generate agent', hint: 'ADK / Bedrock', icon: 'code' },
  { type: 'full_pipeline', label: 'Full pipeline', hint: 'End to end', icon: 'bolt' },
];

const parseCost = (c: string) => Number(c.replace(/[^\d.]/g, '')) || 0;

type Job = WorkspaceJob;

export default function Jobs() {
  useReveal();
  const toast = useToast();
  const { open, close } = useOverlay();
  const { openNewRun, currentWorkspace, jobsForCurrentWorkspace: jobs, updateJob, removeJob } = useApp();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [pipe, setPipe] = useState('');
  const [selected, setSelected] = useState<Job | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      const text = `${j.id} ${j.subtitle} ${j.pipeline}`.toLowerCase();
      return (!q || text.includes(q))
        && (!status || j.status === status)
        && (!pipe || j.pipe === pipe);
    });
  }, [jobs, search, status, pipe]);

  const stats = useMemo(() => {
    const finished = jobs.filter((j) => j.status === 'done' || j.status === 'failed');
    const done = jobs.filter((j) => j.status === 'done').length;
    return {
      running: jobs.filter((j) => j.status === 'run').length,
      queued: jobs.filter((j) => j.status === 'queued').length,
      done,
      failed: jobs.filter((j) => j.status === 'failed').length,
      successRate: finished.length ? Math.round((done / finished.length) * 100) : 0,
      spend: jobs.reduce((s, j) => s + parseCost(j.cost), 0),
    };
  }, [jobs]);

  const openJob = (job: Job) => {
    setSelected(job);
    open('dw-job');
  };

  const askDelete = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(job);
    open('dlg-confirm');
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    removeJob(deleteTarget.id);
    toast(`${deleteTarget.id} deleted`, 'trash');
    setDeleteTarget(null);
    close();
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setPipe('');
  };

  return (
    <AppShell
      crumb="Jobs"
      badge={
        stats.running > 0 ? (
          <StatusBadge status="warn" pulse className="mr-2">
            {stats.running} running
          </StatusBadge>
        ) : undefined
      }
    >
      <div className="p-4 sm:p-6 lg:p-7 max-w-[1240px] mx-auto w-full pb-16" data-od-id="jobs-page">
        <PageHeader
          title="Jobs"
          description={`Every task run in ${currentWorkspace.name}. Open a job for its steps and logs.`}
          dataOdId="page-title"
          actions={
            <Button
              type="button"
              variant="outline"
              className="gap-2 h-9 px-3.5 text-xs sm:text-sm font-medium cursor-pointer"
              onClick={() => toast('Job history exported as jobs.csv', 'download')}
            >
              <Icon name="download" className="w-4 h-4 text-muted" />Export CSV
            </Button>
          }
        />

        <section className="mb-6" aria-labelledby="quick-launch-h">
          <h2 id="quick-launch-h" className="text-xs font-semibold text-muted mb-2">Start a task</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2" data-od-id="new-job-btn">
            {QUICK_LAUNCH.map((q) => (
              <Button
                key={q.type}
                type="button"
                variant="outline"
                onClick={() => openNewRun(q.type)}
                className={cn(
                  'h-auto justify-start gap-2.5 p-3 text-left cursor-pointer',
                  q.type === 'full_pipeline' && 'col-span-2 sm:col-span-1 border-accent/40'
                )}
              >
                <Icon name={q.icon} className={cn('w-4 h-4 shrink-0', q.type === 'full_pipeline' ? 'text-accent-strong' : 'text-muted')} />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-foreground truncate">{q.label}</span>
                  <span className="block text-[11px] text-muted font-normal truncate">{q.hint}</span>
                </span>
              </Button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-6" data-od-id="job-kpis">
          <KpiCard label="Running" value={String(stats.running)} description={`${stats.queued} queued`} />
          <KpiCard label="Completed" value={String(stats.done)} description={`${stats.successRate}% success rate`} />
          <KpiCard label="Failed" value={String(stats.failed)} description={stats.failed ? 'Open a job to see why' : 'All clear'} />
          <KpiCard label="Spend" value={`₹${stats.spend.toLocaleString('en-IN')}`} description={`across ${jobs.length} jobs`} />
        </div>

        <Card className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden p-0 gap-0">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">All jobs</h3>
            <SearchToolbar
              query={search}
              onQueryChange={setSearch}
              placeholder="Search jobs"
              count={filtered.length}
              countLabel="shown"
            >
              <SelectField
                id="j-status"
                aria-label="Filter by status"
                value={status}
                onValueChange={setStatus}
                className="h-8 w-[130px]"
                options={[
                  { value: '', label: 'All statuses' },
                  { value: 'run', label: 'Running' },
                  { value: 'queued', label: 'Queued' },
                  { value: 'done', label: 'Completed' },
                  { value: 'failed', label: 'Failed' },
                ]}
              />
              <SelectField
                id="j-pipe"
                aria-label="Filter by stage"
                value={pipe}
                onValueChange={setPipe}
                className="h-8 w-[130px]"
                options={[{ value: '', label: 'All stages' }, 'Analysis', 'Design', 'Develop']}
              />
            </SearchToolbar>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <Table id="jobs-table" className="min-w-[720px]">
              <TableHeader className="bg-surface border-b border-border">
                <TableRow className="text-[11px] font-semibold uppercase tracking-wider text-muted hover:bg-transparent">
                  <TableHead className="px-4 py-2.5 text-muted">Job</TableHead>
                  <TableHead className="px-4 py-2.5 text-muted">Task</TableHead>
                  <TableHead className="px-4 py-2.5 text-muted">Status</TableHead>
                  <TableHead className="px-4 py-2.5 min-w-[130px] text-muted">Progress</TableHead>
                  <TableHead className="px-4 py-2.5 text-muted">Started</TableHead>
                  <TableHead className="px-4 py-2.5 text-right text-muted">Cost</TableHead>
                  <TableHead className="px-3 py-2.5 w-24 text-right"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody id="jobs-body" className="divide-y divide-border">
                {filtered.map((j) => {
                  const isWarn = j.badgeClass.includes('badge-warn');
                  const isOk = j.badgeClass.includes('badge-ok');
                  const isErr = j.badgeClass.includes('badge-err');
                  const isAcc = j.badgeClass.includes('badge-acc');
                  const statusType = isWarn ? 'warn' : isOk ? 'ok' : isErr ? 'danger' : isAcc ? 'accent' : 'neutral';

                  return (
                    <TableRow
                      key={j.id}
                      className="hover:bg-surface-hover/70 transition-colors cursor-pointer group"
                      data-status={j.status}
                      data-pipe={j.pipe}
                      data-od-id={`job-${j.id.split('-')[1]}`}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('[data-del-job]')) return;
                        openJob(j);
                      }}
                    >
                      <TableCell className="px-4 py-3">
                        <div className="font-mono text-xs sm:text-sm font-semibold text-foreground">{j.id}</div>
                        <div className="text-[11.5px] text-muted mt-0.5">{j.subtitle}</div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs sm:text-sm text-foreground">{j.pipeline}</TableCell>
                      <TableCell className="px-4 py-3">
                        <StatusBadge status={statusType} pulse={j.badgeClass.includes('badge-run')}>
                          {j.statusLabel}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Progress
                            value={j.progress}
                            className={cn(
                              'h-1.5 flex-1 bg-surface-inset',
                              j.progressFill === 'fill-ok' && '[&>[data-slot=progress-indicator]]:bg-success',
                              j.progressFill === 'fill-warn' && '[&>[data-slot=progress-indicator]]:bg-warn',
                              j.progressFill !== 'fill-ok' && j.progressFill !== 'fill-warn' && '[&>[data-slot=progress-indicator]]:bg-accent-strong'
                            )}
                          />
                          <span className="text-[11.5px] font-mono text-muted tabular-nums whitespace-nowrap">
                            {j.progressLabel}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-muted whitespace-nowrap">{j.started}</TableCell>
                      <TableCell className={`px-4 py-3 text-right font-mono text-xs ${j.costMuted ? 'text-muted' : 'text-foreground'}`}>
                        {j.cost}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted hover:text-foreground hover:bg-surface-hover cursor-pointer"
                            data-open-job
                            aria-label="Job details"
                            onClick={() => openJob(j)}
                          >
                            <Icon name="eye" className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted hover:text-danger-fg hover:bg-danger-soft cursor-pointer"
                            data-del-job
                            aria-label="Delete job"
                            onClick={(e) => askDelete(j, e)}
                          >
                            <Icon name="trash" className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-border">
            {filtered.map((j) => {
              const isWarn = j.badgeClass.includes('badge-warn');
              const isOk = j.badgeClass.includes('badge-ok');
              const isErr = j.badgeClass.includes('badge-err');
              const isAcc = j.badgeClass.includes('badge-acc');
              const statusType = isWarn ? 'warn' : isOk ? 'ok' : isErr ? 'danger' : isAcc ? 'accent' : 'neutral';

              return (
                <div
                  key={j.id}
                  className="p-3.5 hover:bg-surface-hover/70 transition-colors cursor-pointer space-y-2.5"
                  data-status={j.status}
                  data-od-id={`job-${j.id.split('-')[1]}`}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('[data-del-job]')) return;
                    openJob(j);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-xs font-semibold text-foreground">{j.id}</div>
                      <div className="text-[11px] text-muted mt-0.5">{j.subtitle}</div>
                    </div>
                    <StatusBadge status={statusType} pulse={j.badgeClass.includes('badge-run')} className="shrink-0 text-[11px]">
                      {j.statusLabel}
                    </StatusBadge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted">
                    <span className="text-foreground font-medium">{j.pipeline}</span>
                  </div>

                  {j.progress > 0 && j.status === 'run' && (
                    <div className="flex items-center gap-2">
                      <Progress
                        value={j.progress}
                        className="h-1.5 flex-1 bg-surface-inset [&>[data-slot=progress-indicator]]:bg-warn"
                      />
                      <span className="text-[11px] font-mono text-muted">{j.progressLabel}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-muted pt-1 border-t border-border/40">
                    <div className="flex items-center gap-2">
                      <span>{j.started}</span>
                      <span>·</span>
                      <span className="font-mono font-medium text-foreground">{j.cost}</span>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted hover:text-foreground hover:bg-surface-hover cursor-pointer"
                        data-open-job
                        aria-label="Job details"
                        onClick={() => openJob(j)}
                      >
                        <Icon name="eye" className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted hover:text-danger-fg hover:bg-danger-soft cursor-pointer"
                        data-del-job
                        aria-label="Delete job"
                        onClick={(e) => askDelete(j, e)}
                      >
                        <Icon name="trash" className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {jobs.length === 0 ? (
            <EmptyState
              icon="play"
              title={`No jobs in ${currentWorkspace.name} yet.`}
              dataOdId="jobs-empty"
              action={
                <Button type="button" variant="accent" size="sm" className="mt-2 text-xs cursor-pointer" onClick={() => openNewRun()}>
                  Run your first task
                </Button>
              }
            />
          ) : filtered.length === 0 && (
            <EmptyState
              icon="filter"
              title="No jobs match these filters."
              dataOdId="jobs-empty"
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs font-medium cursor-pointer"
                  id="jobs-reset"
                  onClick={resetFilters}
                >
                  Reset filters
                </Button>
              }
            />
          )}

          <div className="p-3.5 border-t border-border bg-surface-inset/30 flex justify-end">
            <span className="text-xs text-muted">
              Showing <span id="j-shown" className="font-semibold text-foreground">{filtered.length}</span> of {jobs.length} jobs
            </span>
          </div>
        </Card>
      </div>

      <Drawer id="dw-job" dataOdId="job-drawer">
        {selected && (
          <>
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-muted">Job</div>
                <div id="jd-id" className="font-mono text-base font-bold text-foreground tracking-tight mt-0.5">{selected.id}</div>
              </div>
              <CloseButton className="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer" aria-label="Close">
                <Icon name="x" className="w-4 h-4" />
              </CloseButton>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-2.5">
                <Card className="p-3 bg-surface border border-border rounded-lg shadow-xs">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-muted">Status</div>
                  <div id="jd-status" className="mt-1.5">
                    <StatusBadge
                      status={
                        selected.badgeClass.includes('badge-warn') ? 'warn' :
                        selected.badgeClass.includes('badge-ok') ? 'ok' :
                        selected.badgeClass.includes('badge-err') ? 'danger' : 'neutral'
                      }
                      pulse={selected.badgeClass.includes('badge-run')}
                    >
                      {selected.statusLabel}
                    </StatusBadge>
                  </div>
                </Card>
                <Card className="p-3 bg-surface border border-border rounded-lg shadow-xs">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-muted">Cost so far</div>
                  <div className="font-mono text-base font-bold text-foreground mt-1" id="jd-cost">{selected.cost}</div>
                </Card>
              </div>

              <div className="space-y-2 py-3 border-y border-border text-xs">
                <div className="flex justify-between items-center"><span className="text-muted">Pipeline</span><span className="font-medium text-foreground" id="jd-pipe">{selected.pipeline}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted">Started</span><span className="font-medium text-foreground" id="jd-started">{selected.started}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted">Records processed</span><span className="font-mono text-foreground">18,442</span></div>
              </div>

              <div>
                <div className="text-xs font-semibold text-foreground mb-2">Execution steps</div>
                <div className="space-y-1.5" id="jd-steps">
                  {(JOB_STEPS[selected.id] ?? [['done', 'Run completed']]).map(([st, label], idx) => {
                    const icon = STEP_ICONS[st];
                    const isRun = st === 'run';
                    const isDone = st === 'done';
                    const isFailed = st === 'failed';
                    return (
                      <div key={idx} className="flex items-center gap-2.5 p-2 rounded-md bg-surface-inset text-xs">
                        <span className={`w-5 h-5 rounded-full grid place-items-center shrink-0 ${
                          isDone ? 'bg-success text-white' :
                          isRun ? 'bg-warn text-warn-fg' :
                          isFailed ? 'bg-danger text-white' :
                          'bg-border text-muted'
                        }`}>
                          <Icon name={icon} style={{ width: 11, height: 11 }} className={isRun ? 'animate-spin' : ''} />
                        </span>
                        <span className="font-medium text-foreground flex-1 truncate">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-surface-inset rounded-lg text-xs space-y-1">
                <div className="font-semibold text-foreground">Worker pod</div>
                <div className="font-mono text-[11px] text-muted">ip-10-42-8-19.ap-south-1 · 4 vCPU · 16 GB</div>
              </div>
            </div>

            <div className="sticky bottom-0 p-3 sm:p-4 border-t border-border flex items-center justify-between gap-2 bg-surface/95 backdrop-blur-sm z-10">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-medium cursor-pointer"
                onClick={() => toast(`Raw log for ${selected.id} downloaded`, 'download')}
              >
                Download log
              </Button>
              <div className="flex items-center gap-2">
                {selected.status === 'run' ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="text-xs font-medium cursor-pointer"
                    id="jd-action-btn"
                    onClick={() => {
                      updateJob(selected.id, { status: 'failed', statusLabel: 'Cancelled', badgeClass: 'badge badge-err', progressFill: '' });
                      toast(`${selected.id} cancelled`, 'x');
                      close();
                    }}
                  >
                    Cancel job
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="accent"
                    size="sm"
                    className="text-xs font-medium cursor-pointer"
                    id="jd-action-btn"
                    onClick={() => {
                      toast(`Rerun queued for ${selected.id}`, 'play');
                      close();
                    }}
                  >
                    Rerun job
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </Drawer>

      <Dialog id="dlg-confirm" dataOdId="confirm-dialog">
        <div className="p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground tracking-tight">Delete job record?</h2>
          <p className="text-xs text-muted mt-1">This removes the job from the ledger. Spend already incurred stays on the organization invoice.</p>
        </div>
        <div className="p-5 text-xs text-foreground">
          Are you sure you want to delete <strong className="font-mono">{deleteTarget?.id}</strong> ({deleteTarget?.subtitle})? This cannot be undone.
        </div>
        <div className="p-4 border-t border-border bg-surface-inset/40 flex items-center justify-end gap-2.5 rounded-b-xl">
          <CloseButton
            variant="outline"
            className="px-3.5 h-8.5 rounded-md text-foreground text-xs font-medium cursor-pointer"
          >
            Cancel
          </CloseButton>
          <Button
            type="button"
            variant="destructive"
            className="px-3.5 h-8.5 rounded-md text-xs font-medium cursor-pointer"
            id="dlg-confirm-del"
            onClick={confirmDelete}
          >
            Delete job
          </Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
