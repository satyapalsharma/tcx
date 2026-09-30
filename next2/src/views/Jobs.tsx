'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { CloseButton, Dialog, Drawer, OpenButton, useOverlay } from '../components/Overlay';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';
import { JOBS, JOB_STEPS, type Job, type StepStatus } from '../data/jobs';
import { KpiCard, PageHeader, StatusBadge, EmptyState, SearchToolbar } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';

const STEP_ICONS: Record<StepStatus, Parameters<typeof Icon>[0]['name']> = {
  done: 'check',
  run: 'sync',
  wait: 'dot',
  failed: 'x',
};

export default function Jobs() {
  useReveal();
  const toast = useToast();
  const { open, close } = useOverlay();
  const [jobs, setJobs] = useState(JOBS);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [client, setClient] = useState('');
  const [pipe, setPipe] = useState('');
  const [selected, setSelected] = useState<Job | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [express, setExpress] = useState(false);
  const [njClient, setNjClient] = useState('Skyline Broadband');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      const text = `${j.id} ${j.subtitle} ${j.client} ${j.pipeline}`.toLowerCase();
      return (!q || text.includes(q))
        && (!status || j.status === status)
        && (!client || j.client === client)
        && (!pipe || j.pipe === pipe);
    });
  }, [jobs, search, status, client, pipe]);

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
    setJobs((prev) => prev.filter((j) => j.id !== deleteTarget.id));
    toast(`${deleteTarget.id} deleted`, 'trash');
    setDeleteTarget(null);
    close();
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setClient('');
    setPipe('');
  };

  const startJob = () => {
    close();
    toast(`Job queued and tagged to ${njClient}`, 'play');
  };

  return (
    <AppShell
      crumb="Jobs"
      badge={
        <StatusBadge status="warn" pulse className="mr-2">
          2 running
        </StatusBadge>
      }
    >
      <div className="p-4 sm:p-6 lg:p-7 max-w-[1240px] mx-auto w-full pb-16" data-od-id="jobs-page">
        <PageHeader
          title="Jobs"
          description="Every pipeline run, map generation and agent build in one place — with live status, client cost tag and the ability to cancel, rerun or delete a job."
          dataOdId="page-title"
          actions={
            <>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 h-9 px-3.5 bg-surface hover:bg-surface-hover border border-border text-foreground text-xs sm:text-sm font-medium rounded-md shadow-xs transition-colors cursor-pointer"
                onClick={() => toast('Job history exported as jobs-30d.csv', 'download')}
              >
                <Icon name="download" className="w-4 h-4 text-muted" />Export CSV
              </button>
              <OpenButton
                className="inline-flex items-center justify-center gap-2 h-9 px-3.5 bg-accent-strong hover:bg-accent-hover active:bg-accent-active text-white text-xs sm:text-sm font-medium rounded-md shadow-xs transition-colors cursor-pointer"
                target="dlg-newjob"
                data-od-id="new-job-btn"
              >
                <Icon name="plus" className="w-4 h-4" />New job
              </OpenButton>
            </>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-6" data-od-id="job-kpis">
          <KpiCard
            label="Running now"
            value="2"
            description="1 queued behind RUN-4821"
          />
          <KpiCard
            label="Completed · 30d"
            value="1,204"
            description="98.1% success rate"
          />
          <KpiCard
            label="Failed · 30d"
            value="23"
            description="mostly Bedrock auth scope"
          />
          <KpiCard
            label="Spend · 30d"
            value="₹10.7L"
            description="across 4 clients"
          />
        </div>

        <Card className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden p-0 gap-0">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">All jobs</h3>
            <SearchToolbar
              query={search}
              onQueryChange={setSearch}
              placeholder="Search job or project"
              count={filtered.length}
              countLabel="shown"
            >
              <select
                className="h-8 px-2.5 bg-surface-inset border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                id="j-status"
                aria-label="Filter by status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="run">Running</option>
                <option value="queued">Queued</option>
                <option value="done">Completed</option>
                <option value="failed">Failed</option>
              </select>
              <select
                className="h-8 px-2.5 bg-surface-inset border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                id="j-client"
                aria-label="Filter by client"
                value={client}
                onChange={(e) => setClient(e.target.value)}
              >
                <option value="">All clients</option>
                <option>Skyline Broadband</option>
                <option>Northwind Retail</option>
                <option>Helios Health</option>
              </select>
              <select
                className="h-8 px-2.5 bg-surface-inset border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                id="j-pipe"
                aria-label="Filter by pipeline"
                value={pipe}
                onChange={(e) => setPipe(e.target.value)}
              >
                <option value="">All pipelines</option>
                <option>Analysis</option>
                <option>Design</option>
                <option>Develop</option>
              </select>
            </SearchToolbar>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <Table id="jobs-table" className="min-w-[760px]">
              <TableHeader className="bg-surface border-b border-border">
                <TableRow className="text-[11px] font-semibold uppercase tracking-wider text-muted hover:bg-transparent">
                  <TableHead className="px-4 py-2.5 text-muted">Job</TableHead>
                  <TableHead className="px-4 py-2.5 text-muted">Client</TableHead>
                  <TableHead className="px-4 py-2.5 text-muted">Pipeline</TableHead>
                  <TableHead className="px-4 py-2.5 text-muted">Status</TableHead>
                  <TableHead className="px-4 py-2.5 min-w-[130px] text-muted">Progress</TableHead>
                  <TableHead className="px-4 py-2.5 text-muted">Started</TableHead>
                  <TableHead className="px-4 py-2.5 text-right text-muted">Cost</TableHead>
                  <TableHead className="px-3 py-2.5 w-24 text-right" />
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
                      data-client={j.client}
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
                      <TableCell className="px-4 py-3 text-xs sm:text-sm text-foreground">{j.client}</TableCell>
                      <TableCell className="px-4 py-3 text-xs sm:text-sm text-foreground">{j.pipeline}</TableCell>
                      <TableCell className="px-4 py-3">
                        <StatusBadge status={statusType} pulse={j.badgeClass.includes('badge-run')}>
                          {j.statusLabel}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-1.5 flex-1 bg-surface-inset rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                j.progressFill === 'fill-ok' ? 'bg-success' :
                                j.progressFill === 'fill-warn' ? 'bg-warn' :
                                'bg-accent-strong'
                              }`}
                              style={{ width: `${j.progress}%` }}
                            />
                          </div>
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
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                            data-open-job
                            aria-label="Job details"
                            onClick={() => openJob(j)}
                          >
                            <Icon name="eye" className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-danger-fg hover:bg-danger-soft transition-colors cursor-pointer"
                            data-del-job
                            aria-label="Delete job"
                            onClick={(e) => askDelete(j, e)}
                          >
                            <Icon name="trash" className="w-3.5 h-3.5" />
                          </button>
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
                    <span className="text-foreground font-medium">{j.client}</span>
                    <span>{j.pipeline}</span>
                  </div>

                  {j.progress > 0 && j.status === 'run' && (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-surface-inset rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-warn transition-all duration-300"
                          style={{ width: `${j.progress}%` }}
                        />
                      </div>
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
                      <button
                        type="button"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                        data-open-job
                        aria-label="Job details"
                        onClick={() => openJob(j)}
                      >
                        <Icon name="eye" className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-danger-fg hover:bg-danger-soft transition-colors cursor-pointer"
                        data-del-job
                        aria-label="Delete job"
                        onClick={(e) => askDelete(j, e)}
                      >
                        <Icon name="trash" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <EmptyState
              icon="filter"
              title="No jobs match these filters."
              dataOdId="jobs-empty"
              action={
                <button
                  type="button"
                  className="mt-2 h-7.5 px-3 rounded-md border border-border bg-surface hover:bg-surface-hover text-xs font-medium text-foreground transition-colors cursor-pointer"
                  id="jobs-reset"
                  onClick={resetFilters}
                >
                  Reset filters
                </button>
              }
            />
          )}

          <div className="p-3.5 border-t border-border bg-surface-inset/30 flex justify-end">
            <span className="text-xs text-muted">
              Showing <span id="j-shown" className="font-semibold text-foreground">{filtered.length}</span> of 1,229 jobs · older pages load on scroll
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
                <div className="flex justify-between items-center"><span className="text-muted">Client</span><span className="font-medium text-foreground" id="jd-client">{selected.client}</span></div>
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
              <button
                type="button"
                className="h-8 px-3 rounded-md border border-border bg-surface hover:bg-surface-hover text-xs font-medium text-foreground transition-colors cursor-pointer"
                onClick={() => toast(`Raw log for ${selected.id} downloaded`, 'download')}
              >
                Download log
              </button>
              <div className="flex items-center gap-2">
                {selected.status === 'run' ? (
                  <button
                    type="button"
                    className="h-8 px-3 rounded-md bg-danger-soft hover:bg-danger/20 text-danger-fg text-xs font-medium transition-colors cursor-pointer"
                    id="jd-action-btn"
                    onClick={() => {
                      setJobs((prev) => prev.map((j) => (j.id === selected.id ? { ...j, status: 'failed', statusLabel: 'Cancelled', badgeClass: 'badge-err' } : j)));
                      toast(`${selected.id} cancelled`, 'x');
                      close();
                    }}
                  >
                    Cancel job
                  </button>
                ) : (
                  <button
                    type="button"
                    className="h-8 px-3 rounded-md bg-accent-strong hover:bg-accent-hover text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
                    id="jd-action-btn"
                    onClick={() => {
                      toast(`Rerun queued for ${selected.id}`, 'play');
                      close();
                    }}
                  >
                    Rerun job
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </Drawer>

      <Dialog id="dlg-confirm" dataOdId="confirm-dialog">
        <div className="p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground tracking-tight">Delete job record?</h2>
          <p className="text-xs text-muted mt-1">This removes the job from the ledger. Cost tracking remains recorded under the client.</p>
        </div>
        <div className="p-5 text-xs text-foreground">
          Are you sure you want to delete <strong className="font-mono">{deleteTarget?.id}</strong> ({deleteTarget?.subtitle})? This cannot be undone.
        </div>
        <div className="p-4 border-t border-border bg-surface-inset/40 flex items-center justify-end gap-2.5 rounded-b-xl">
          <CloseButton className="inline-flex items-center justify-center px-3.5 h-8.5 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer">
            Cancel
          </CloseButton>
          <button
            type="button"
            className="inline-flex items-center justify-center px-3.5 h-8.5 rounded-md bg-danger-fg hover:opacity-90 text-white text-xs font-medium shadow-xs transition-opacity cursor-pointer"
            id="dlg-confirm-del"
            onClick={confirmDelete}
          >
            Delete job
          </button>
        </div>
      </Dialog>

      <Dialog id="dlg-newjob" dataOdId="new-job-dialog">
        <div className="p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground tracking-tight">Start a new job</h2>
          <p className="text-xs text-muted mt-1">Run any pipeline stage against connected interaction data.</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5" htmlFor="nj-client">Client</label>
            <select
              className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs sm:text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              id="nj-client"
              value={njClient}
              onChange={(e) => setNjClient(e.target.value)}
            >
              <option>Skyline Broadband</option>
              <option>Northwind Retail</option>
              <option>Helios Health</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5" htmlFor="nj-pipe">Pipeline stage</label>
            <select
              className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs sm:text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              id="nj-pipe"
            >
              <option>Analysis — intent extraction &amp; clustering</option>
              <option>Design — process map &amp; UML generation</option>
              <option>Develop — agent code generation (ADK / Bedrock)</option>
              <option>Full pipeline (Analysis → Design → Develop)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5" htmlFor="nj-source">Data source</label>
            <select
              className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs sm:text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              id="nj-source"
            >
              <option>Genesys Cloud — last 30 days (18,442 records)</option>
              <option>Zendesk — last 14 days (6,211 records)</option>
              <option>Manual CSV upload</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-surface-inset">
            <div>
              <div className="text-xs font-semibold text-foreground">Express mode</div>
              <div className="text-[11px] text-muted leading-tight mt-0.5">Runs all stages without pausing for manual review gates.</div>
            </div>
            <span data-od-id="nj-express">
              <Switch checked={express} onCheckedChange={setExpress} aria-label="Express mode" />
            </span>
          </div>
        </div>
        <div className="p-4 border-t border-border bg-surface-inset/40 flex items-center justify-end gap-2.5 rounded-b-xl">
          <CloseButton className="inline-flex items-center justify-center px-3.5 h-8.5 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer">
            Cancel
          </CloseButton>
          <button
            type="button"
            className="inline-flex items-center justify-center px-3.5 h-8.5 rounded-md bg-accent-strong hover:bg-accent-hover active:bg-accent-active text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
            id="nj-start"
            onClick={startJob}
          >
            Start job
          </button>
        </div>
      </Dialog>
    </AppShell>
  );
}
