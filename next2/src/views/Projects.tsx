'use client';

import { useState } from 'react';
import { Link, useNavigate } from '../lib/navigation';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { CloseButton, Dialog, OpenButton, useOverlay } from '../components/Overlay';
import { ChipGroup, useTextFilter } from '../components/ui';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';
import { KpiCard, PageHeader, StatusBadge, EmptyState, SearchToolbar } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';

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
            className={`inline-flex items-center gap-1 h-5 px-1.5 rounded-full text-[11px] font-medium whitespace-nowrap ${
              isLive
                ? 'bg-foreground text-surface font-semibold shadow-xs'
                : isDone
                ? 'bg-surface-inset border border-border text-foreground'
                : isDash
                ? 'bg-transparent text-muted'
                : 'bg-surface-inset text-muted'
            }`}
          >
            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse" />}
            {isDone && <Icon name="check" className="w-2.5 h-2.5 text-success" />}
            {s.label}
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
        <StatusBadge status="warn" pulse className="mr-2">
          RUN-4821 · clustering 68%
        </StatusBadge>
      }
    >
      <div className="p-4 sm:p-6 lg:p-7 max-w-[1240px] mx-auto w-full pb-16" data-od-id="projects-page">
        <PageHeader
          title="Projects"
          description="Each project is one CX transformation. Teams pick up the pipeline at the stage they own — Analysis, Design, or Develop — and build on approved work from the last stage."
          dataOdId="page-title"
          actions={
            <OpenButton
              className="inline-flex items-center justify-center gap-2 h-9 px-3.5 bg-accent-strong hover:bg-accent-hover active:bg-accent-active text-white text-xs sm:text-sm font-medium rounded-md shadow-xs transition-colors cursor-pointer shrink-0"
              target="dlg-new-project"
              data-od-id="new-project-btn"
            >
              <Icon name="plus" className="w-4 h-4" />
              New project
            </OpenButton>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6" data-od-id="kpi-row">
          <KpiCard
            label="Active projects"
            value="3"
            description="2 running pipelines"
            dataOdId="kpi-projects"
          />
          <KpiCard
            label="Records processed"
            value="24.7k"
            description="calls · emails · CRM notes"
            dataOdId="kpi-records"
          />
          <KpiCard
            label="Canonical intents"
            value="286"
            description="across 6 L1 clusters"
            dataOdId="kpi-intents"
          />
          <KpiCard
            label="Agent builds"
            value="9"
            description="ADK · Bedrock · LangGraph"
            dataOdId="kpi-builds"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6" data-od-id="umbrella-strip">
          <Card className="p-4.5 bg-surface border border-border rounded-xl shadow-xs hover:border-[oklch(85%_0.008_250)] hover:bg-surface-hover/50 transition-all flex flex-col gap-2.5 group">
            <Link to="/analysis" data-od-id="umb-analysis" className="flex flex-col gap-2.5 h-full">
              <div className="flex items-center gap-2.5">
                <Icon name="chart" className="w-5 h-5 text-foreground" />
                <strong className="text-sm font-semibold text-foreground">Analysis</strong>
                <StatusBadge status="ok" className="ml-auto">
                  4 clusters approved
                </StatusBadge>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Upload interactions → extract intents, resolutions and pain points → shape L1 / L2 / L3 clusters. Owned by Business Analysts.
              </p>
              <span className="flex items-center gap-1.5 text-xs text-muted font-medium group-hover:text-accent-strong transition-colors mt-auto">
                Open workspace<Icon name="arrowr" className="w-3.5 h-3.5" />
              </span>
            </Link>
          </Card>

          <Card className="p-4.5 bg-surface border border-border rounded-xl shadow-xs hover:border-[oklch(85%_0.008_250)] hover:bg-surface-hover/50 transition-all flex flex-col gap-2.5 group">
            <Link to="/design" data-od-id="umb-design" className="flex flex-col gap-2.5 h-full">
              <div className="flex items-center gap-2.5">
                <Icon name="flow" className="w-5 h-5 text-foreground" />
                <strong className="text-sm font-semibold text-foreground">Design</strong>
                <StatusBadge status="accent" className="ml-auto">
                  2 maps in review
                </StatusBadge>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Verify and edit process maps generated from approved clusters, then trace information flow in UML sequence diagrams. Owned by CX Designers.
              </p>
              <span className="flex items-center gap-1.5 text-xs text-muted font-medium group-hover:text-accent-strong transition-colors mt-auto">
                Open workspace<Icon name="arrowr" className="w-3.5 h-3.5" />
              </span>
            </Link>
          </Card>

          <Card className="p-4.5 bg-surface border border-border rounded-xl shadow-xs hover:border-[oklch(85%_0.008_250)] hover:bg-surface-hover/50 transition-all flex flex-col gap-2.5 group">
            <Link to="/develop" data-od-id="umb-develop" className="flex flex-col gap-2.5 h-full">
              <div className="flex items-center gap-2.5">
                <Icon name="code" className="w-5 h-5 text-foreground" />
                <strong className="text-sm font-semibold text-foreground">Develop</strong>
                <StatusBadge status="neutral" dot={false} className="ml-auto">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted mr-1.5" />
                  Next handoff
                </StatusBadge>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Generate production agent code — Google ADK, CX Agent Studio, Amazon Bedrock, LangGraph — from approved maps. Owned by Developers.
              </p>
              <span className="flex items-center gap-1.5 text-xs text-muted font-medium group-hover:text-accent-strong transition-colors mt-auto">
                Open workspace<Icon name="arrowr" className="w-3.5 h-3.5" />
              </span>
            </Link>
          </Card>
        </div>

        <Card className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden p-0 gap-0" data-od-id="project-list">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">All projects</h3>
            <SearchToolbar
              query={query}
              onQueryChange={setQuery}
              placeholder="Search projects"
              count={count}
              totalCount={PROJECTS.length}
            />
          </div>

          <Table id="proj-table" className="min-w-[680px]">
            <TableHeader className="bg-surface border-b border-border">
              <TableRow className="text-[11px] font-semibold uppercase tracking-wider text-muted hover:bg-transparent">
                <TableHead className="px-4 py-2.5 text-muted">Project</TableHead>
                <TableHead className="px-4 py-2.5 text-muted">Pipeline stage</TableHead>
                <TableHead className="px-4 py-2.5 text-right text-muted">Records</TableHead>
                <TableHead className="px-4 py-2.5 text-right text-muted">Intents</TableHead>
                <TableHead className="px-4 py-2.5 text-muted">Owner</TableHead>
                <TableHead className="px-4 py-2.5 text-muted">Last activity</TableHead>
                <TableHead className="px-4 py-2.5 text-muted">Status</TableHead>
                <TableHead className="px-3 py-2.5 w-9" />
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {filtered.map((p) => {
                const isWarn = p.statusClass.includes('badge-warn');
                const isOk = p.statusClass.includes('badge-ok');
                const isAcc = p.statusClass.includes('badge-acc');
                const statusType = isWarn ? 'warn' : isOk ? 'ok' : isAcc ? 'accent' : 'neutral';
                return (
                  <TableRow
                    key={p.id}
                    className="hover:bg-surface-hover/70 transition-colors cursor-pointer group"
                    data-od-id={p.id}
                    onClick={() => navigate(p.href)}
                  >
                    <TableCell className="px-4 py-3">
                      <div className="font-semibold text-xs sm:text-sm text-foreground">{p.name}</div>
                      <div className="text-xs text-muted mt-0.5">{p.hint}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3"><StageFlow stages={p.stages} /></TableCell>
                    <TableCell className={`px-4 py-3 text-right font-mono text-xs ${p.recordsMuted ? 'text-muted' : 'text-foreground'}`}>
                      {p.records}
                    </TableCell>
                    <TableCell className={`px-4 py-3 text-right font-mono text-xs ${p.intentsMuted ? 'text-muted' : 'text-foreground'}`}>
                      {p.intents}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6 text-[10px] font-bold bg-foreground text-surface">
                          <AvatarFallback className="bg-foreground text-surface font-bold text-[10px]">
                            {p.ownerInitials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-foreground font-medium">{p.owner}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-muted whitespace-nowrap">{p.activity}</TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusBadge status={statusType} pulse={p.statusClass.includes('badge-run')}>
                        {p.statusText}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right">
                      <Icon name="chevr" className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filtered.length === 0 && (
            <EmptyState
              icon="filter"
              title="No projects match this search."
              dataOdId="proj-empty"
            />
          )}
        </Card>
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
