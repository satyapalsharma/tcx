import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    statusClass: 'badge badge-warn badge-run',
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
    statusClass: 'badge badge-acc',
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
    statusClass: 'badge badge-ok',
    statusText: '5 maps approved',
    href: '/design',
  },
];

const CLIENTS = ['Skyline Broadband', 'Northwind Retail', 'Helios Health'];

function StageFlow({ stages }: { stages: StageNode[] }) {
  return (
    <div className="stage-flow proj-stage">
      {stages.flatMap((s, i) => {
        const node = (
          <span key={`node-${i}`} className={`snode${s.kind === 'live' ? ' live' : ''}${s.kind === 'done' ? ' done' : ''}`}>
            <span className="glyph">
              {s.kind === 'live' && <span className="mini" />}
              {s.kind === 'done' && <Icon name="check" style={{ width: 9, height: 9 }} />}
            </span>
            {s.kind === 'dash' ? '—' : s.label}
          </span>
        );
        return i === 0 ? [node] : [<span key={`link-${i}`} className="slink" />, node];
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
        <span className="badge badge-run badge-warn" style={{ marginRight: 8 }}>
          <span className="dot" />RUN-4821 · clustering 68%
        </span>
      }
    >
      <div className="page" data-od-id="projects-page">
        <div className="page-h">
          <div style={{ flex: 1 }}>
            <h1 data-od-id="page-title">Projects</h1>
            <p className="sub">Each project is one CX transformation. Teams pick up the pipeline at the stage they own — Analysis, Design, or Develop — and build on approved work from the last stage.</p>
          </div>
          <OpenButton className="btn btn-primary" target="dlg-new-project" data-od-id="new-project-btn">
            <Icon name="plus" />New project
          </OpenButton>
        </div>

        <div className="grid-4" style={{ marginBottom: 22 }} data-od-id="kpi-row">
          <div className="card kpi" data-od-id="kpi-projects"><div className="k">Active projects</div><div className="v">3</div><div className="d">2 running pipelines</div></div>
          <div className="card kpi" data-od-id="kpi-records"><div className="k">Records processed</div><div className="v">24.7k</div><div className="d">calls · emails · CRM notes</div></div>
          <div className="card kpi" data-od-id="kpi-intents"><div className="k">Canonical intents</div><div className="v">286</div><div className="d">across 6 L1 clusters</div></div>
          <div className="card kpi" data-od-id="kpi-builds"><div className="k">Agent builds</div><div className="v">9</div><div className="d">ADK · Bedrock · LangGraph</div></div>
        </div>

        <div className="grid-3" style={{ marginBottom: 26 }} data-od-id="umbrella-strip">
          <Link className="card umb-card" to="/analysis" data-od-id="umb-analysis">
            <div className="row" style={{ gap: 8 }}>
              <Icon name="chart" large />
              <strong style={{ fontSize: 14, fontWeight: 620 }}>Analysis</strong>
              <span className="badge badge-ok" style={{ marginLeft: 'auto' }}><span className="dot" />4 clusters approved</span>
            </div>
            <p className="who">Upload interactions → extract intents, resolutions and pain points → shape L1 / L2 / L3 clusters. Owned by Business Analysts.</p>
            <span className="row muted" style={{ fontSize: '12.5px', gap: 6 }}>Open workspace<Icon name="arrowr" /></span>
          </Link>
          <Link className="card umb-card" to="/design" data-od-id="umb-design">
            <div className="row" style={{ gap: 8 }}>
              <Icon name="flow" large />
              <strong style={{ fontSize: 14, fontWeight: 620 }}>Design</strong>
              <span className="badge badge-acc" style={{ marginLeft: 'auto' }}><span className="dot" />2 maps in review</span>
            </div>
            <p className="who">Verify and edit process maps generated from approved clusters, then trace information flow in UML sequence diagrams. Owned by CX Designers.</p>
            <span className="row muted" style={{ fontSize: '12.5px', gap: 6 }}>Open workspace<Icon name="arrowr" /></span>
          </Link>
          <Link className="card umb-card" to="/develop" data-od-id="umb-develop">
            <div className="row" style={{ gap: 8 }}>
              <Icon name="code" large />
              <strong style={{ fontSize: 14, fontWeight: 620 }}>Develop</strong>
              <span className="badge" style={{ marginLeft: 'auto' }}><span className="dot" />Next handoff</span>
            </div>
            <p className="who">Generate production agent code — Google ADK, CX Agent Studio, Amazon Bedrock, LangGraph — from approved maps. Owned by Developers.</p>
            <span className="row muted" style={{ fontSize: '12.5px', gap: 6 }}>Open workspace<Icon name="arrowr" /></span>
          </Link>
        </div>

        <div className="card" data-od-id="project-list">
          <div className="card-h" style={{ justifyContent: 'space-between' }}>
            <h3>All projects</h3>
            <div className="row" style={{ gap: 8 }}>
              <div className="field" style={{ position: 'relative' }}>
                <Icon name="search" style={{ position: 'absolute', left: 9, top: 9, color: 'var(--muted)' }} />
                <input
                  className="input"
                  style={{ height: 30, paddingLeft: 30, width: 210 }}
                  placeholder="Search projects"
                  aria-label="Search projects"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <span className="hint"><span id="proj-count">{count}</span> of {PROJECTS.length}</span>
            </div>
          </div>
          <table className="table" id="proj-table" style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>Project</th>
                <th>Pipeline stage</th>
                <th className="num">Records</th>
                <th className="num">Intents</th>
                <th>Owner</th>
                <th>Last activity</th>
                <th>Status</th>
                <th style={{ width: 36 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="proj-row"
                  data-od-id={p.id}
                  onClick={() => navigate(p.href)}
                >
                  <td>
                    <div style={{ fontWeight: 580 }}>{p.name}</div>
                    <div className="hint">{p.hint}</div>
                  </td>
                  <td><StageFlow stages={p.stages} /></td>
                  <td className={`num${p.recordsMuted ? ' muted' : ''}`}>{p.records}</td>
                  <td className={`num${p.intentsMuted ? ' muted' : ''}`}>{p.intents}</td>
                  <td>
                    <div className="row" style={{ gap: 7 }}>
                      <span className="avatar avatar-sm">{p.ownerInitials}</span>
                      <span>{p.owner}</span>
                    </div>
                  </td>
                  <td className="muted">{p.activity}</td>
                  <td><span className={p.statusClass}><span className="dot" />{p.statusText}</span></td>
                  <td><Icon name="chevr" className="go" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty" id="proj-empty" data-od-id="proj-empty">
              <div style={{ marginBottom: 8 }}><Icon name="filter" large /></div>
              No projects match this search.
            </div>
          )}
        </div>
      </div>

      <Dialog id="dlg-new-project" dataOdId="new-project-dialog">
        <div className="dialog-h">
          <h2 id="np-title">New project</h2>
          <p className="hint">Projects hold one customer&apos;s pipeline — you can run the full flow or start at any stage.</p>
        </div>
        <div className="dialog-b">
          <div className="field">
            <label className="label" htmlFor="np-name">Project name</label>
            <input className="input" id="np-name" placeholder="e.g. Retention Desk — Q3 automation" value={projName} onChange={(e) => setProjName(e.target.value)} />
          </div>
          <div className="field">
            <label className="label" htmlFor="np-client">
              Client <span className="muted" style={{ fontWeight: 460 }}>· required for cost tagging</span>
            </label>
            <div className="row" style={{ gap: 8 }}>
              <select className="input" id="np-client" data-od-id="np-client" value={client} onChange={handleClientChange}>
                {CLIENTS.map((c) => <option key={c}>{c}</option>)}
                <option value="__new__">+ Add new client…</option>
              </select>
              <Link className="btn btn-sm" to="/settings" title="Manage clients"><Icon name="gear" />Manage</Link>
            </div>
            <span className="hint">Every job run under this project is tagged to this client so cost reporting stays accurate.</span>
          </div>
          <div className="field">
            <span className="label">Where does this team start?</span>
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
          <div className="field">
            <label className="label" htmlFor="np-source">First data source</label>
            <select className="input" id="np-source">
              <option>Genesys Cloud — call recordings</option>
              <option>Zendesk — conversations export</option>
              <option>Amazon S3 — transcripts bucket</option>
              <option>Google Cloud Storage — bucket prefix</option>
              <option>CSV / manual upload</option>
            </select>
          </div>
          <div className="row" style={{ justifyContent: 'space-between', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '11px 12px', background: 'var(--surface-inset)' }}>
            <div>
              <div className="label">Express mode</div>
              <div className="hint">Auto-runs intent extraction → clustering → process map → UML with no manual review gates.</div>
            </div>
            <span data-od-id="np-express"><Switch checked={express} onChange={setExpress} label="Express mode" /></span>
          </div>
        </div>
        <div className="dialog-f">
          <CloseButton className="btn">Cancel</CloseButton>
          <button type="button" className="btn btn-primary" id="np-create" data-od-id="np-create-btn" onClick={create}>Create project</button>
        </div>
      </Dialog>
    </AppShell>
  );
}
