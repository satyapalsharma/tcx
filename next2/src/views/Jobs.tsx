'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { CloseButton, Dialog, Drawer, OpenButton, useOverlay } from '../components/Overlay';
import { Switch } from '../components/ui';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';
import { JOBS, JOB_STEPS, type Job, type StepStatus } from '../data/jobs';

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
        <span className="inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-semibold rounded-full bg-warn-soft text-warn-fg mr-2">
          <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse" />
          2 running
        </span>
      }
    >
      <div className="p-4 sm:p-6 lg:p-7 max-w-[1240px] mx-auto w-full pb-16" data-od-id="jobs-page">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground" data-od-id="page-title">Jobs</h1>
            <p className="text-xs sm:text-sm text-muted mt-1 max-w-[660px]">
              Every pipeline run, map generation and agent build in one place — with live status, client cost tag and the ability to cancel, rerun or delete a job.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
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
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6" data-od-id="job-kpis">
          <div className="p-4 bg-surface border border-border rounded-xl shadow-xs flex flex-col gap-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Running now</div>
            <div className="text-2xl font-bold tracking-tight text-foreground">2</div>
            <div className="text-xs text-muted">1 queued behind RUN-4821</div>
          </div>
          <div className="p-4 bg-surface border border-border rounded-xl shadow-xs flex flex-col gap-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Completed · 30d</div>
            <div className="text-2xl font-bold tracking-tight text-foreground">1,204</div>
            <div className="text-xs text-muted">98.1% success rate</div>
          </div>
          <div className="p-4 bg-surface border border-border rounded-xl shadow-xs flex flex-col gap-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Failed · 30d</div>
            <div className="text-2xl font-bold tracking-tight text-foreground">23</div>
            <div className="text-xs text-muted">mostly Bedrock auth scope</div>
          </div>
          <div className="p-4 bg-surface border border-border rounded-xl shadow-xs flex flex-col gap-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Spend · 30d</div>
            <div className="text-2xl font-bold tracking-tight text-foreground">₹10.7L</div>
            <div className="text-xs text-muted">across 4 clients</div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">All jobs</h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
                <input
                  className="h-8 pl-8 pr-3 w-[180px] sm:w-[190px] bg-surface-inset border border-border rounded-md text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  id="j-search"
                  placeholder="Search job or project"
                  aria-label="Search jobs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
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
              <span className="text-xs text-muted whitespace-nowrap pl-1">
                <span id="j-count" className="font-semibold text-foreground">{filtered.length}</span> shown
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[760px]" id="jobs-table">
              <thead className="bg-surface border-b border-border">
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="px-4 py-2.5">Job</th>
                  <th className="px-4 py-2.5">Client</th>
                  <th className="px-4 py-2.5">Pipeline</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 min-w-[130px]">Progress</th>
                  <th className="px-4 py-2.5">Started</th>
                  <th className="px-4 py-2.5 text-right">Cost</th>
                  <th className="px-3 py-2.5 w-24 text-right" />
                </tr>
              </thead>
              <tbody id="jobs-body" className="divide-y divide-border">
                {filtered.map((j) => (
                  <tr
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
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs sm:text-sm font-semibold text-foreground">{j.id}</div>
                      <div className="text-[11.5px] text-muted mt-0.5">{j.subtitle}</div>
                    </td>
                    <td className="px-4 py-3 text-xs sm:text-sm text-foreground">{j.client}</td>
                    <td className="px-4 py-3 text-xs sm:text-sm text-foreground">{j.pipeline}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 h-5.5 px-2 text-xs font-medium rounded-full whitespace-nowrap ${
                        j.badgeClass.includes('badge-warn') ? 'bg-warn-soft text-warn-fg' :
                        j.badgeClass.includes('badge-ok') ? 'bg-success-soft text-success-fg' :
                        j.badgeClass.includes('badge-err') ? 'bg-danger-soft text-danger-fg' :
                        j.badgeClass.includes('badge-acc') ? 'bg-accent-soft text-accent-strong' :
                        'bg-surface-inset text-foreground'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          j.badgeClass.includes('badge-run') ? 'bg-warn animate-pulse' :
                          j.badgeClass.includes('badge-ok') ? 'bg-success' :
                          j.badgeClass.includes('badge-err') ? 'bg-danger' :
                          j.badgeClass.includes('badge-acc') ? 'bg-accent' :
                          'bg-muted'
                        }`} />
                        {j.statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                    <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{j.started}</td>
                    <td className={`px-4 py-3 text-right font-mono text-xs ${j.costMuted ? 'text-muted' : 'text-foreground'}`}>
                      {j.cost}
                    </td>
                    <td className="px-3 py-3 text-right">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="p-12 text-center text-muted text-xs sm:text-sm flex flex-col items-center justify-center gap-2" id="jobs-empty" data-od-id="jobs-empty">
              <Icon name="filter" className="w-6 h-6 text-muted mb-1" />
              <span>No jobs match these filters.</span>
              <button
                type="button"
                className="mt-2 h-7.5 px-3 rounded-md border border-border bg-surface hover:bg-surface-hover text-xs font-medium text-foreground transition-colors cursor-pointer"
                id="jobs-reset"
                onClick={resetFilters}
              >
                Reset filters
              </button>
            </div>
          )}

          <div className="p-3.5 border-t border-border bg-surface-inset/30 flex justify-end">
            <span className="text-xs text-muted">
              Showing <span id="j-shown" className="font-semibold text-foreground">{filtered.length}</span> of 1,229 jobs · older pages load on scroll
            </span>
          </div>
        </div>
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
                <div className="p-3 bg-surface border border-border rounded-lg shadow-xs">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-muted">Status</div>
                  <div id="jd-status" className="mt-1.5">
                    <span className={`inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full ${
                      selected.badgeClass.includes('badge-warn') ? 'bg-warn-soft text-warn-fg' :
                      selected.badgeClass.includes('badge-ok') ? 'bg-success-soft text-success-fg' :
                      selected.badgeClass.includes('badge-err') ? 'bg-danger-soft text-danger-fg' :
                      'bg-surface-inset text-foreground'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />{selected.statusLabel}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-surface border border-border rounded-lg shadow-xs">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-muted">Cost so far</div>
                  <div className="font-mono text-base font-bold text-foreground mt-1" id="jd-cost">{selected.cost}</div>
                </div>
              </div>

              <div className="space-y-2 py-3 border-y border-border text-xs">
                <div className="flex justify-between items-center"><span className="text-muted">Client</span><span className="font-medium text-foreground" id="jd-client">{selected.client}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted">Pipeline</span><span className="font-medium text-foreground" id="jd-pipe">{selected.pipeline}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted">Started</span><span className="font-medium text-foreground" id="jd-started">{selected.started}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted">Records processed</span><span className="font-mono text-foreground">18,442</span></div>
              </div>

              <div>
                <div className="text-[10.5px] uppercase tracking-wider font-semibold text-muted mb-2">Step timeline</div>
                <div id="jd-steps" className="space-y-1.5">
                  {(JOB_STEPS[selected.id] ?? [['done', 'Run completed']]).map(([st, label]) => (
                    <div key={label} className={`flex items-center gap-2.5 py-1 text-xs ${st === 'wait' ? 'text-muted' : 'text-foreground'}`}>
                      <span className={`w-5 h-5 rounded-full grid place-items-center text-xs shrink-0 ${
                        st === 'done' ? 'bg-success-soft text-success' :
                        st === 'run' ? 'bg-accent-soft text-accent-strong animate-spin' :
                        st === 'failed' ? 'bg-danger-soft text-danger' :
                        'bg-surface-inset text-muted'
                      }`}>
                        <Icon name={STEP_ICONS[st]} className="w-3 h-3" />
                      </span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-surface-inset/40 flex items-center justify-end gap-2 flex-wrap">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-1.5 h-8.5 px-3 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer"
                id="jd-cancel"
                onClick={() => { close(); toast('Run cancellation requested', 'x'); }}
              >
                <Icon name="x" className="w-3.5 h-3.5 text-muted" />Cancel job
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-1.5 h-8.5 px-3 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer"
                id="jd-logs"
                onClick={() => toast('job-logs.zip downloading', 'download')}
              >
                <Icon name="download" className="w-3.5 h-3.5 text-muted" />Download logs
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-1.5 h-8.5 px-3 rounded-md bg-accent-strong hover:bg-accent-hover active:bg-accent-active text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
                id="jd-rerun"
                onClick={() => { close(); toast('Rerun queued with the same inputs', 'sync'); }}
              >
                <Icon name="sync" className="w-3.5 h-3.5" />Rerun
              </button>
            </div>
          </>
        )}
      </Drawer>

      <Dialog id="dlg-newjob" dataOdId="newjob-dialog">
        <div className="p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground tracking-tight">New job</h2>
          <p className="text-xs text-muted mt-1">Runs against an existing project. The client tag decides who the cost is billed to.</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5" htmlFor="nj-project">Project</label>
            <select
              className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs sm:text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              id="nj-project"
            >
              <option>Skyline Broadband — Winter CX Automation</option>
              <option>Network Ops Copilot — outage triage</option>
              <option>Escalation Playbooks refresh</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5" htmlFor="nj-client">
              Client <span className="text-muted font-normal">· cost tag</span>
            </label>
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
            <label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5" htmlFor="nj-pipe">Pipeline</label>
            <select
              className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs sm:text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              id="nj-pipe"
            >
              <option>Analysis — intents + clustering</option>
              <option>Design — process map + UML</option>
              <option>Develop — agent codegen</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-surface-inset">
            <div>
              <div className="text-xs font-semibold text-foreground">Express mode</div>
              <div className="text-[11px] text-muted leading-tight mt-0.5">Runs intent → clustering → map → UML with no review gates.</div>
            </div>
            <Switch checked={express} onChange={setExpress} label="Express mode" />
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
            data-od-id="nj-start"
            onClick={startJob}
          >
            Start job
          </button>
        </div>
      </Dialog>

      <Dialog id="dlg-confirm" dataOdId="confirm-dialog">
        <div className="p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground tracking-tight" id="cf-title">Delete {deleteTarget?.id ?? 'job'}?</h2>
          <p className="text-xs text-muted mt-1 leading-relaxed" id="cf-body">
            The job and its step timeline are removed from this list. Outputs already handed to Design or Develop are not affected. This is written to the audit log.
          </p>
        </div>
        <div className="p-4 border-t border-border bg-surface-inset/40 flex items-center justify-end gap-2.5 rounded-b-xl">
          <CloseButton className="inline-flex items-center justify-center px-3.5 h-8.5 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer">
            Cancel
          </CloseButton>
          <button
            type="button"
            className="inline-flex items-center justify-center px-3.5 h-8.5 rounded-md bg-danger-soft hover:bg-danger-soft/80 border border-danger/30 text-danger-fg text-xs font-medium transition-colors cursor-pointer"
            id="cf-ok"
            onClick={confirmDelete}
          >
            Delete job
          </button>
        </div>
      </Dialog>
    </AppShell>
  );
}
