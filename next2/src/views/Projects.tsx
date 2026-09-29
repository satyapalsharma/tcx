'use client';

import { useState } from 'react';
import { Link, useNavigate } from '../lib/navigation';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { CloseButton, Dialog, OpenButton, useOverlay } from '../components/Overlay';
import { ChipGroup, Switch, useTextFilter } from '../components/ui';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';

type StageNode = { kind: 'live' | 'done' | 'empty' | 'dash'; label: string };

type Project = {
  id: string;
  name: string;
  hint: string;
  stages: StageNode[];
  records: string;
  recordsMuted?: boolean;
  intents: string;
  intentsMuted?: boolean;
  ownerInitials: string;
  owner: string;
  activity: string;
  statusClass: string;
  statusText: string;
  href: string;
};

const PROJECTS: Project[] = [
  {
    id: 'proj-row-skyline',
    name: 'Skyline Broadband — Winter CX Automation',
    hint: 'Genesys + Zendesk · quarterly intent refresh',
    stages: [
      { kind: 'live', label: 'Analysis' },
      { kind: 'done', label: 'Design' },
      { kind: 'empty', label: 'Develop' },
    ],
    records: '18,442',
    intents: '286',
    ownerInitials: 'PN',
    owner: 'Priya N.',
    activity: '12 min ago',
    statusClass: 'badge-warn badge-run',
    statusText: 'RUN-4821 68%',
    href: '/analysis',
  },
  {
    id: 'proj-row-netops',
    name: 'Network Ops Copilot — outage triage',
    hint: 'Analysis only · NICE CXone calls · pilot scope',
    stages: [
      { kind: 'live', label: 'Analysis' },
      { kind: 'dash', label: '—' },
      { kind: 'dash', label: '—' },
    ],
    records: '6,211',
    intents: '118',
    ownerInitials: 'RM',
    owner: 'Riya M.',
    activity: '1 h ago',
    statusClass: 'badge-acc',
    statusText: 'Intents ready',
    href: '/analysis',
  },
  {
    id: 'proj-row-playbooks',
    name: 'Escalation Playbooks refresh',
    hint: 'Design only · imported maps (CSV) · maintained by CX team',
    stages: [
      { kind: 'dash', label: '—' },
      { kind: 'done', label: 'Design' },
      { kind: 'dash', label: '—' },
    ],
    records: '—',
    recordsMuted: true,
    intents: '—',
    intentsMuted: true,
    ownerInitials: 'DS',
    owner: 'Devika S.',
    activity: '3 days ago',
    statusClass: 'badge-ok',
    statusText: '5 maps approved',
    href: '/design',
  },
];

const CLIENTS = ['Skyline Broadband', 'Northwind Retail', 'Helios Health'];

function StageFlow({ stages }: { stages: StageNode[] }) {
  return (
    <div className="flex items-center origin-left scale-90 sm:scale-95">
      {stages.flatMap((s, i) => {
        const isLive = s.kind === 'live';
        const isDone = s.kind === 'done';
        const isDash = s.kind === 'dash';
        const node = (
          <span
            key={`node-${i}`}
            className={`inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-medium rounded-full border whitespace-nowrap transition-colors ${
              isDone
                ? 'border-transparent bg-success-soft text-success-fg'
                : isLive
                ? 'border-foreground text-foreground bg-surface font-semibold'
                : 'border-border bg-surface text-muted'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full grid place-items-center shrink-0 ${
                isDone ? 'bg-success text-white' : ''
              }`}
            >
              {isLive && <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse" />}
              {isDone && <Icon name="check" style={{ width: 9, height: 9 }} />}
            </span>
            {isDash ? '—' : s.label}
          </span>
        );
        return i === 0 ? [node] : [
          <span key={`link-${i}`} className="w-3.5 h-px bg-border shrink-0" />,
          node
        ];
      })}
    </div>
  );
}

export default function Projects() {
  useReveal();
  const navigate = useNavigate();
  const toast = useToast();
  const { close } = useOverlay();
  const { query, setQuery, filtered, count } = useTextFilter(PROJECTS, (p) => `${p.name} ${p.hint} ${p.owner}`);
  const [startMode, setStartMode] = useState('full');
  const [express, setExpress] = useState(false);
  const [projName, setProjName] = useState('');
  const [client, setClient] = useState(CLIENTS[0]);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === '__new__') {
      navigate('/settings#clients');
      return;
    }
    setClient(e.target.value);
  };

  const create = () => {
    const name = projName.trim() || 'Untitled project';
    close();
    toast(`"${name}" created · client ${client}${express ? ' · express mode on' : ''}`, 'plus');
  };

  return (
    <AppShell
      crumb="Projects"
      badge={
        <span className="inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-semibold rounded-full bg-warn-soft text-warn-fg mr-2">
          <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse" />
          RUN-4821 · clustering 68%
        </span>
      }
    >
      <div className="p-4 sm:p-6 lg:p-7 max-w-[1240px] mx-auto w-full pb-16" data-od-id="projects-page">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground" data-od-id="page-title">Projects</h1>
            <p className="text-xs sm:text-sm text-muted mt-1 max-w-[660px]">
              Each project is one CX transformation. Teams pick up the pipeline at the stage they own — Analysis, Design, or Develop — and build on approved work from the last stage.
            </p>
          </div>
          <OpenButton
            className="inline-flex items-center justify-center gap-2 h-9 px-3.5 bg-accent-strong hover:bg-accent-hover active:bg-accent-active text-white text-xs sm:text-sm font-medium rounded-md shadow-xs transition-colors cursor-pointer shrink-0"
            target="dlg-new-project"
            data-od-id="new-project-btn"
          >
            <Icon name="plus" className="w-4 h-4" />
            New project
          </OpenButton>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6" data-od-id="kpi-row">
          <div className="p-4 bg-surface border border-border rounded-xl shadow-xs flex flex-col gap-1" data-od-id="kpi-projects">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Active projects</div>
            <div className="text-2xl font-bold tracking-tight text-foreground">3</div>
            <div className="text-xs text-muted">2 running pipelines</div>
          </div>
          <div className="p-4 bg-surface border border-border rounded-xl shadow-xs flex flex-col gap-1" data-od-id="kpi-records">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Records processed</div>
            <div className="text-2xl font-bold tracking-tight text-foreground">24.7k</div>
            <div className="text-xs text-muted">calls · emails · CRM notes</div>
          </div>
          <div className="p-4 bg-surface border border-border rounded-xl shadow-xs flex flex-col gap-1" data-od-id="kpi-intents">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Canonical intents</div>
            <div className="text-2xl font-bold tracking-tight text-foreground">286</div>
            <div className="text-xs text-muted">across 6 L1 clusters</div>
          </div>
          <div className="p-4 bg-surface border border-border rounded-xl shadow-xs flex flex-col gap-1" data-od-id="kpi-builds">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Agent builds</div>
            <div className="text-2xl font-bold tracking-tight text-foreground">9</div>
            <div className="text-xs text-muted">ADK · Bedrock · LangGraph</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6" data-od-id="umbrella-strip">
          <Link
            className="p-4.5 bg-surface border border-border rounded-xl shadow-xs hover:border-[oklch(85%_0.008_250)] hover:bg-surface-hover/50 transition-all flex flex-col gap-2.5 text-inherit group"
            to="/analysis"
            data-od-id="umb-analysis"
          >
            <div className="flex items-center gap-2.5">
              <Icon name="chart" className="w-5 h-5 text-foreground" />
              <strong className="text-sm font-semibold text-foreground">Analysis</strong>
              <span className="ml-auto inline-flex items-center gap-1.5 h-5.5 px-2 text-xs font-medium rounded-full bg-success-soft text-success-fg">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                4 clusters approved
              </span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Upload interactions → extract intents, resolutions and pain points → shape L1 / L2 / L3 clusters. Owned by Business Analysts.
            </p>
            <span className="flex items-center gap-1.5 text-xs text-muted font-medium group-hover:text-accent-strong transition-colors mt-auto">
              Open workspace<Icon name="arrowr" className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            className="p-4.5 bg-surface border border-border rounded-xl shadow-xs hover:border-[oklch(85%_0.008_250)] hover:bg-surface-hover/50 transition-all flex flex-col gap-2.5 text-inherit group"
            to="/design"
            data-od-id="umb-design"
          >
            <div className="flex items-center gap-2.5">
              <Icon name="flow" className="w-5 h-5 text-foreground" />
              <strong className="text-sm font-semibold text-foreground">Design</strong>
              <span className="ml-auto inline-flex items-center gap-1.5 h-5.5 px-2 text-xs font-medium rounded-full bg-accent-soft text-accent-strong">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                2 maps in review
              </span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Verify and edit process maps generated from approved clusters, then trace information flow in UML sequence diagrams. Owned by CX Designers.
            </p>
            <span className="flex items-center gap-1.5 text-xs text-muted font-medium group-hover:text-accent-strong transition-colors mt-auto">
              Open workspace<Icon name="arrowr" className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            className="p-4.5 bg-surface border border-border rounded-xl shadow-xs hover:border-[oklch(85%_0.008_250)] hover:bg-surface-hover/50 transition-all flex flex-col gap-2.5 text-inherit group"
            to="/develop"
            data-od-id="umb-develop"
          >
            <div className="flex items-center gap-2.5">
              <Icon name="code" className="w-5 h-5 text-foreground" />
              <strong className="text-sm font-semibold text-foreground">Develop</strong>
              <span className="ml-auto inline-flex items-center gap-1.5 h-5.5 px-2 text-xs font-medium rounded-full bg-surface-inset border border-border text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-muted" />
                Next handoff
              </span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Generate production agent code — Google ADK, CX Agent Studio, Amazon Bedrock, LangGraph — from approved maps. Owned by Developers.
            </p>
            <span className="flex items-center gap-1.5 text-xs text-muted font-medium group-hover:text-accent-strong transition-colors mt-auto">
              Open workspace<Icon name="arrowr" className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>

        <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden" data-od-id="project-list">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">All projects</h3>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
                <input
                  className="h-8 pl-8 pr-3 w-full sm:w-[210px] bg-surface-inset border border-border rounded-md text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  placeholder="Search projects"
                  aria-label="Search projects"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <span className="text-xs text-muted whitespace-nowrap">
                <span id="proj-count" className="font-semibold text-foreground">{count}</span> of {PROJECTS.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[680px]" id="proj-table">
              <thead className="bg-surface border-b border-border">
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="px-4 py-2.5">Project</th>
                  <th className="px-4 py-2.5">Pipeline stage</th>
                  <th className="px-4 py-2.5 text-right">Records</th>
                  <th className="px-4 py-2.5 text-right">Intents</th>
                  <th className="px-4 py-2.5">Owner</th>
                  <th className="px-4 py-2.5">Last activity</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-3 py-2.5 w-9" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const isWarn = p.statusClass.includes('badge-warn');
                  const isOk = p.statusClass.includes('badge-ok');
                  const isAcc = p.statusClass.includes('badge-acc');
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-surface-hover/70 transition-colors cursor-pointer group"
                      data-od-id={p.id}
                      onClick={() => navigate(p.href)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-xs sm:text-sm text-foreground">{p.name}</div>
                        <div className="text-xs text-muted mt-0.5">{p.hint}</div>
                      </td>
                      <td className="px-4 py-3"><StageFlow stages={p.stages} /></td>
                      <td className={`px-4 py-3 text-right font-mono text-xs ${p.recordsMuted ? 'text-muted' : 'text-foreground'}`}>
                        {p.records}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono text-xs ${p.intentsMuted ? 'text-muted' : 'text-foreground'}`}>
                        {p.intents}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-foreground text-surface grid place-items-center text-[10px] font-bold shrink-0">
                            {p.ownerInitials}
                          </span>
                          <span className="text-xs text-foreground font-medium">{p.owner}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{p.activity}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 h-5.5 px-2 text-xs font-medium rounded-full whitespace-nowrap ${
                            isWarn
                              ? 'bg-warn-soft text-warn-fg'
                              : isOk
                              ? 'bg-success-soft text-success-fg'
                              : isAcc
                              ? 'bg-accent-soft text-accent-strong'
                              : 'bg-surface-inset text-foreground'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.statusClass.includes('badge-run')
                                ? 'bg-warn animate-pulse'
                                : isOk
                                ? 'bg-success'
                                : isAcc
                                ? 'bg-accent'
                                : 'bg-muted'
                            }`}
                          />
                          {p.statusText}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Icon name="chevr" className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="p-12 text-center text-muted text-xs sm:text-sm flex flex-col items-center justify-center gap-2" id="proj-empty" data-od-id="proj-empty">
              <Icon name="filter" className="w-6 h-6 text-muted mb-1" />
              <span>No projects match this search.</span>
            </div>
          )}
        </div>
      </div>

      <Dialog id="dlg-new-project" dataOdId="new-project-dialog">
        <div className="p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground tracking-tight" id="np-title">New project</h2>
          <p className="text-xs text-muted mt-1">Projects hold one customer&apos;s pipeline — you can run the full flow or start at any stage.</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5" htmlFor="np-name">Project name</label>
            <input
              className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs sm:text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              id="np-name"
              placeholder="e.g. Retention Desk — Q3 automation"
              value={projName}
              onChange={(e) => setProjName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5" htmlFor="np-client">
              Client <span className="text-muted font-normal">· required for cost tagging</span>
            </label>
            <div className="flex items-center gap-2">
              <select
                className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs sm:text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                id="np-client"
                data-od-id="np-client"
                value={client}
                onChange={handleClientChange}
              >
                {CLIENTS.map((c) => <option key={c}>{c}</option>)}
                <option value="__new__">+ Add new client…</option>
              </select>
              <Link
                className="inline-flex items-center justify-center gap-1.5 h-9 px-3 border border-border rounded-md bg-surface hover:bg-surface-hover text-xs font-medium text-foreground transition-colors shrink-0"
                to="/settings"
                title="Manage clients"
              >
                <Icon name="gear" className="w-3.5 h-3.5 text-muted" />
                Manage
              </Link>
            </div>
            <p className="text-xs text-muted mt-1 leading-relaxed">Every job run under this project is tagged to this client so cost reporting stays accurate.</p>
          </div>
          <div>
            <span className="block text-xs font-semibold text-foreground tracking-wide mb-1.5">Where does this team start?</span>
            <div data-od-id="np-start-chips">
              <ChipGroup
                value={startMode}
                onChange={setStartMode}
                options={[
                  { val: 'full', label: 'Full pipeline' },
                  { val: 'analysis', label: 'Analysis only' },
                  { val: 'design', label: 'Design only' },
                  { val: 'develop', label: 'Develop only' },
                ]}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5" htmlFor="np-source">First data source</label>
            <select
              className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs sm:text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              id="np-source"
            >
              <option>Genesys Cloud — call recordings</option>
              <option>Zendesk — conversations export</option>
              <option>Amazon S3 — transcripts bucket</option>
              <option>Google Cloud Storage — bucket prefix</option>
              <option>CSV / manual upload</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-surface-inset">
            <div>
              <div className="text-xs font-semibold text-foreground">Express mode</div>
              <div className="text-[11px] text-muted leading-tight mt-0.5">Auto-runs intent extraction → clustering → process map → UML with no manual review gates.</div>
            </div>
            <span data-od-id="np-express">
              <Switch checked={express} onChange={setExpress} label="Express mode" />
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
            id="np-create"
            data-od-id="np-create-btn"
            onClick={create}
          >
            Create project
          </button>
        </div>
      </Dialog>
    </AppShell>
  );
}
