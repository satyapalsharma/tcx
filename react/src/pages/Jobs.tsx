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
        <span className="badge badge-warn badge-run" style={{ marginRight: 8 }}>
          <span className="dot" />2 running
        </span>
      }
    >
      <div className="page" data-od-id="jobs-page">
        <div className="page-h">
          <div style={{ flex: 1 }}>
            <h1 data-od-id="page-title">Jobs</h1>
            <p className="sub">Every pipeline run, map generation and agent build in one place — with live status, client cost tag and the ability to cancel, rerun or delete a job.</p>
          </div>
          <button type="button" className="btn" onClick={() => toast('Job history exported as jobs-30d.csv', 'download')}>
            <Icon name="download" />Export CSV
          </button>
          <OpenButton className="btn btn-primary" target="dlg-newjob" data-od-id="new-job-btn">
            <Icon name="plus" />New job
          </OpenButton>
        </div>

        <div className="grid-4" style={{ marginBottom: 18 }} data-od-id="job-kpis">
          <div className="card kpi"><div className="k">Running now</div><div className="v">2</div><div className="d">1 queued behind RUN-4821</div></div>
          <div className="card kpi"><div className="k">Completed · 30d</div><div className="v">1,204</div><div className="d">98.1% success rate</div></div>
          <div className="card kpi"><div className="k">Failed · 30d</div><div className="v">23</div><div className="d">mostly Bedrock auth scope</div></div>
          <div className="card kpi"><div className="k">Spend · 30d</div><div className="v">₹10.7L</div><div className="d">across 4 clients</div></div>
        </div>

        <div className="card">
          <div className="card-h" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <h3>All jobs</h3>
            <div className="toolbar">
              <div style={{ position: 'relative' }}>
                <Icon name="search" style={{ position: 'absolute', left: 9, top: 9, color: 'var(--muted)' }} />
                <input
                  className="input"
                  id="j-search"
                  style={{ height: 30, paddingLeft: 30, width: 190 }}
                  placeholder="Search job or project"
                  aria-label="Search jobs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select className="input" id="j-status" style={{ height: 30, width: 140 }} aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All statuses</option>
                <option value="run">Running</option>
                <option value="queued">Queued</option>
                <option value="done">Completed</option>
                <option value="failed">Failed</option>
              </select>
              <select className="input" id="j-client" style={{ height: 30, width: 150 }} aria-label="Filter by client" value={client} onChange={(e) => setClient(e.target.value)}>
                <option value="">All clients</option>
                <option>Skyline Broadband</option>
                <option>Northwind Retail</option>
                <option>Helios Health</option>
              </select>
              <select className="input" id="j-pipe" style={{ height: 30, width: 140 }} aria-label="Filter by pipeline" value={pipe} onChange={(e) => setPipe(e.target.value)}>
                <option value="">All pipelines</option>
                <option>Analysis</option>
                <option>Design</option>
                <option>Develop</option>
              </select>
              <span className="hint"><span id="j-count">{filtered.length}</span> shown</span>
            </div>
          </div>
          <table className="table jtable" style={{ marginTop: 8 }} id="jobs-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Client</th>
                <th>Pipeline</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Started</th>
                <th className="num">Cost</th>
                <th style={{ width: 96 }} />
              </tr>
            </thead>
            <tbody id="jobs-body">
              {filtered.map((j) => (
                <tr
                  key={j.id}
                  className="jrow"
                  data-status={j.status}
                  data-client={j.client}
                  data-pipe={j.pipe}
                  data-od-id={`job-${j.id.split('-')[1]}`}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('[data-del-job]')) return;
                    openJob(j);
                  }}
                >
                  <td>
                    <div style={{ fontWeight: 560 }} className="mono">{j.id}</div>
                    <div className="hint" style={{ fontSize: '11.5px' }}>{j.subtitle}</div>
                  </td>
                  <td>{j.client}</td>
                  <td>{j.pipeline}</td>
                  <td><span className={j.badgeClass}><span className="dot" />{j.statusLabel}</span></td>
                  <td>
                    <div className="meter prog">
                      <div className="track">
                        <div className={`fill ${j.progressFill ?? ''}`.trim()} style={{ width: `${j.progress}%` }} />
                      </div>
                      <span className="tabular muted" style={{ fontSize: '11.5px' }}>{j.progressLabel}</span>
                    </div>
                  </td>
                  <td className="muted">{j.started}</td>
                  <td className={`num${j.costMuted ? ' muted' : ''}`}>{j.cost}</td>
                  <td>
                    <div className="row" style={{ gap: 2 }}>
                      <button type="button" className="icon-btn" data-open-job aria-label="Job details" onClick={(e) => { e.stopPropagation(); openJob(j); }}>
                        <Icon name="eye" />
                      </button>
                      <button type="button" className="icon-btn" data-del-job aria-label="Delete job" onClick={(e) => askDelete(j, e)}>
                        <Icon name="trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty" id="jobs-empty" data-od-id="jobs-empty">
              <div style={{ marginBottom: 8 }}><Icon name="filter" large /></div>
              No jobs match these filters.
              <div style={{ marginTop: 10 }}>
                <button type="button" className="btn btn-sm" id="jobs-reset" onClick={resetFilters}>Reset filters</button>
              </div>
            </div>
          )}
          <div className="row" style={{ padding: '10px 16px', justifyContent: 'flex-end' }}>
            <span className="hint">Showing <span id="j-shown">{filtered.length}</span> of 1,229 jobs · older pages load on scroll</span>
          </div>
        </div>
      </div>

      <Drawer id="dw-job" dataOdId="job-drawer">
        {selected && (
          <>
            <div className="drawer-h">
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="caps">Job</div>
                <div id="jd-id" style={{ fontSize: 15, fontWeight: 620, letterSpacing: '-0.01em', marginTop: 2 }} className="mono">{selected.id}</div>
              </div>
              <CloseButton className="icon-btn" aria-label="Close"><Icon name="x" /></CloseButton>
            </div>
            <div className="drawer-b">
              <div className="grid-2" style={{ marginBottom: 14 }}>
                <div className="card" style={{ padding: '10px 12px' }}>
                  <div className="caps" style={{ fontSize: 10 }}>Status</div>
                  <div id="jd-status" style={{ marginTop: 4 }}>
                    <span className={selected.badgeClass}><span className="dot" />{selected.statusLabel}</span>
                  </div>
                </div>
                <div className="card" style={{ padding: '10px 12px' }}>
                  <div className="caps" style={{ fontSize: 10 }}>Cost so far</div>
                  <div className="tabular" id="jd-cost" style={{ fontSize: 15, fontWeight: 620, marginTop: 3 }}>{selected.cost}</div>
                </div>
              </div>
              <div className="card-b" style={{ padding: '0 0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="mini-kv"><span className="k">Client</span><span id="jd-client">{selected.client}</span></div>
                <div className="mini-kv"><span className="k">Pipeline</span><span id="jd-pipe">{selected.pipeline}</span></div>
                <div className="mini-kv"><span className="k">Started</span><span id="jd-started">{selected.started}</span></div>
                <div className="mini-kv"><span className="k">Records processed</span><span className="tabular">18,442</span></div>
              </div>
              <div className="caps" style={{ margin: '6px 0 8px' }}>Step timeline</div>
              <div id="jd-steps">
                {(JOB_STEPS[selected.id] ?? [['done', 'Run completed']]).map(([st, label]) => (
                  <div key={label} className={`job-line${st === 'wait' ? ' muted' : ''}`}>
                    <span className={`st ${st}`}><Icon name={STEP_ICONS[st]} /></span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="drawer-f" style={{ flexWrap: 'wrap' }}>
              <button type="button" className="btn" id="jd-cancel" onClick={() => { close(); toast('Run cancellation requested', 'x'); }}>
                <Icon name="x" />Cancel job
              </button>
              <button type="button" className="btn" id="jd-logs" onClick={() => toast('job-logs.zip downloading', 'download')}>
                <Icon name="download" />Download logs
              </button>
              <button type="button" className="btn btn-primary" id="jd-rerun" onClick={() => { close(); toast('Rerun queued with the same inputs', 'sync'); }}>
                <Icon name="sync" />Rerun
              </button>
            </div>
          </>
        )}
      </Drawer>

      <Dialog id="dlg-newjob" dataOdId="newjob-dialog">
        <div className="dialog-h">
          <h2>New job</h2>
          <p className="hint">Runs against an existing project. The client tag decides who the cost is billed to.</p>
        </div>
        <div className="dialog-b">
          <div className="field">
            <label className="label" htmlFor="nj-project">Project</label>
            <select className="input" id="nj-project">
              <option>Skyline Broadband — Winter CX Automation</option>
              <option>Network Ops Copilot — outage triage</option>
              <option>Escalation Playbooks refresh</option>
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="nj-client">
              Client <span className="muted" style={{ fontWeight: 460 }}>· cost tag</span>
            </label>
            <select className="input" id="nj-client" value={njClient} onChange={(e) => setNjClient(e.target.value)}>
              <option>Skyline Broadband</option>
              <option>Northwind Retail</option>
              <option>Helios Health</option>
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="nj-pipe">Pipeline</label>
            <select className="input" id="nj-pipe">
              <option>Analysis — intents + clustering</option>
              <option>Design — process map + UML</option>
              <option>Develop — agent codegen</option>
            </select>
          </div>
          <div className="row" style={{ justifyContent: 'space-between', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '11px 12px', background: 'var(--surface-inset)' }}>
            <div>
              <div className="label">Express mode</div>
              <div className="hint">Runs intent → clustering → map → UML with no review gates.</div>
            </div>
            <Switch checked={express} onChange={setExpress} label="Express mode" />
          </div>
        </div>
        <div className="dialog-f">
          <CloseButton className="btn">Cancel</CloseButton>
          <button type="button" className="btn btn-primary" id="nj-start" data-od-id="nj-start" onClick={startJob}>Start job</button>
        </div>
      </Dialog>

      <Dialog id="dlg-confirm" dataOdId="confirm-dialog">
        <div className="dialog-h">
          <h2 id="cf-title">Delete {deleteTarget?.id ?? 'job'}?</h2>
          <p className="hint" id="cf-body">The job and its step timeline are removed from this list. Outputs already handed to Design or Develop are not affected. This is written to the audit log.</p>
        </div>
        <div className="dialog-f">
          <CloseButton className="btn">Cancel</CloseButton>
          <button
            type="button"
            className="btn"
            id="cf-ok"
            style={{ color: 'var(--danger-fg)', borderColor: 'oklch(87% 0.05 27)', background: 'var(--danger-soft)' }}
            onClick={confirmDelete}
          >
            Delete job
          </button>
        </div>
      </Dialog>
    </AppShell>
  );
}
