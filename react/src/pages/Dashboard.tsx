import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { Tabs } from '../components/ui';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';

type IntentRow = {
  intent: string;
  l1: string;
  vol: number;
  conf: number;
  esc: number;
  status: { label: string; badge: string };
};

const INTENTS: IntentRow[] = [
  { intent: 'Charged for a cancelled service line', l1: 'Billing & Payments', vol: 1842, conf: 0.96, esc: 41, status: { label: 'Canonical', badge: 'badge badge-ok' } },
  { intent: 'Invoice higher than agreed promo price', l1: 'Billing & Payments', vol: 1631, conf: 0.94, esc: 33, status: { label: 'Canonical', badge: 'badge badge-ok' } },
  { intent: 'Internet down — area outage (NOIA)', l1: 'Connectivity & Outages', vol: 1530, conf: 0.97, esc: 22, status: { label: 'Canonical', badge: 'badge badge-ok' } },
  { intent: 'Slow speeds at peak hours', l1: 'Connectivity & Outages', vol: 1118, conf: 0.92, esc: 18, status: { label: 'New · wk26', badge: 'badge badge-acc' } },
  { intent: 'Book new fiber installation slot', l1: 'New Installation', vol: 1043, conf: 0.95, esc: 9, status: { label: 'Canonical', badge: 'badge badge-ok' } },
  { intent: 'Port number out to another provider', l1: 'Cancellation & Port-out', vol: 976, conf: 0.93, esc: 57, status: { label: 'New · wk26', badge: 'badge badge-acc' } },
  { intent: 'Auto-pay failed but card is valid', l1: 'Billing & Payments', vol: 892, conf: 0.91, esc: 26, status: { label: 'Canonical', badge: 'badge badge-ok' } },
  { intent: 'Router returns after plan upgrade', l1: 'Plan Changes', vol: 640, conf: 0.89, esc: 12, status: { label: 'Canonical', badge: 'badge badge-ok' } },
  { intent: 'Password reset for MySkyline app', l1: 'Account & Identity', vol: 388, conf: 0.84, esc: 15, status: { label: 'Review', badge: 'badge' } },
  { intent: 'Duplicate charge after plan change', l1: 'Cancellation & Port-out', vol: 214, conf: 0.68, esc: 48, status: { label: 'Low confidence', badge: 'badge badge-warn' } },
];

const L1_OPTIONS = [
  'Billing & Payments',
  'Connectivity & Outages',
  'New Installation',
  'Plan Changes',
  'Cancellation & Port-out',
  'Account & Identity',
];

function ClusterMap() {
  return (
    <svg className="cluster-map" viewBox="0 0 940 430" role="img" aria-label="Cluster map: 286 canonical intents grouped into 6 L1 clusters sized by share of volume">
      <g className="cm-hub" transform="translate(24,160)">
        <rect width="196" height="96" rx="12" />
        <text x="98" y="40" textAnchor="middle" fontSize="30" fontWeight="640">286</text>
        <text x="98" y="62" textAnchor="middle" fontSize="12">canonical intents</text>
        <text x="98" y="80" textAnchor="middle" fontSize="11" fill="oklch(80% 0.02 250)">6 L1 · 19 L2 · 57 L3</text>
      </g>
      <path className="cm-link" d="M220 208 C260 208 260 35 300 35" />
      <path className="cm-link" d="M220 208 C260 208 260 103 300 103" />
      <path className="cm-link" d="M220 208 C260 208 260 171 300 171" />
      <path className="cm-link" d="M220 208 C260 208 260 239 300 239" />
      <path className="cm-link" d="M220 208 C260 208 260 307 300 307" />
      <path className="cm-link" d="M220 208 C260 208 260 375 300 375" />
      <g className="cm-l1 on" transform="translate(300,8)">
        <rect width="616" height="54" rx="10" /><text x="16" y="22" fontSize="12.5" fontWeight="580">Billing &amp; Payments</text>
        <text x="296" y="22" fontSize="11" fill="var(--muted)">4 L2 · 12 L3</text><text x="600" y="22" textAnchor="end" fontSize="11.5" fill="var(--muted)" className="tabular">7,045 · 38.2%</text>
        <rect className="cm-bar" x="16" y="32" width="584" height="6" rx="3" /><rect className="cm-bar-fill" x="16" y="32" width="584" height="6" rx="3" />
      </g>
      <g className="cm-l1" transform="translate(300,76)">
        <rect width="616" height="54" rx="10" /><text x="16" y="22" fontSize="12.5" fontWeight="580">Connectivity &amp; Outages</text>
        <text x="296" y="22" fontSize="11" fill="var(--muted)">5 L2 · 18 L3</text><text x="600" y="22" textAnchor="end" fontSize="11.5" fill="var(--muted)" className="tabular">4,445 · 24.1%</text>
        <rect className="cm-bar" x="16" y="32" width="584" height="6" rx="3" /><rect className="cm-bar-fill" x="16" y="32" width="368.5" height="6" rx="3" />
      </g>
      <g className="cm-l1" transform="translate(300,144)">
        <rect width="616" height="54" rx="10" /><text x="16" y="22" fontSize="12.5" fontWeight="580">New Installation &amp; Provisioning</text>
        <text x="296" y="22" fontSize="11" fill="var(--muted)">3 L2 · 9 L3</text><text x="600" y="22" textAnchor="end" fontSize="11.5" fill="var(--muted)" className="tabular">2,545 · 13.8%</text>
        <rect className="cm-bar" x="16" y="32" width="584" height="6" rx="3" /><rect className="cm-bar-fill" x="16" y="32" width="211" height="6" rx="3" />
      </g>
      <g className="cm-l1" transform="translate(300,212)">
        <rect width="616" height="54" rx="10" /><text x="16" y="22" fontSize="12.5" fontWeight="580">Plan Changes &amp; Upgrades</text>
        <text x="296" y="22" fontSize="11" fill="var(--muted)">3 L2 · 7 L3</text><text x="600" y="22" textAnchor="end" fontSize="11.5" fill="var(--muted)" className="tabular">1,697 · 9.2%</text>
        <rect className="cm-bar" x="16" y="32" width="584" height="6" rx="3" /><rect className="cm-bar-fill" x="16" y="32" width="140.6" height="6" rx="3" />
      </g>
      <g className="cm-l1" transform="translate(300,280)">
        <rect width="616" height="54" rx="10" /><text x="16" y="22" fontSize="12.5" fontWeight="580">Cancellation &amp; Port-out</text>
        <text x="296" y="22" fontSize="11" fill="var(--muted)">2 L2 · 6 L3</text><text x="600" y="22" textAnchor="end" fontSize="11.5" fill="var(--muted)" className="tabular">1,550 · 8.4%</text>
        <rect className="cm-bar" x="16" y="32" width="584" height="6" rx="3" /><rect className="cm-bar-fill" x="16" y="32" width="128.4" height="6" rx="3" />
      </g>
      <g className="cm-l1" transform="translate(300,348)">
        <rect width="616" height="54" rx="10" /><text x="16" y="22" fontSize="12.5" fontWeight="580">Account &amp; Identity</text>
        <text x="296" y="22" fontSize="11" fill="var(--muted)">2 L2 · 5 L3</text><text x="600" y="22" textAnchor="end" fontSize="11.5" fill="var(--muted)" className="tabular">1,160 · 6.3%</text>
        <rect className="cm-bar" x="16" y="32" width="584" height="6" rx="3" /><rect className="cm-bar-fill" x="16" y="32" width="96.3" height="6" rx="3" />
      </g>
    </svg>
  );
}

export default function Dashboard() {
  useReveal();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [l1, setL1] = useState('');
  const [conf, setConf] = useState('');
  const [esc, setEsc] = useState('');
  const [sortKey, setSortKey] = useState<'vol' | 'conf' | 'esc' | null>(null);
  const [sortDir, setSortDir] = useState(-1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = INTENTS.filter((r) => {
      const okConf = !conf
        || (conf === 'high' && r.conf >= 0.9)
        || (conf === 'mid' && r.conf >= 0.7 && r.conf < 0.9)
        || (conf === 'low' && r.conf < 0.7);
      const text = `${r.intent} ${r.l1}`.toLowerCase();
      return (!q || text.includes(q))
        && (!l1 || r.l1 === l1)
        && okConf
        && (!esc || r.esc >= parseFloat(esc));
    });
    if (sortKey) {
      rows = [...rows].sort((a, b) => sortDir * (a[sortKey] - b[sortKey]));
    }
    return rows;
  }, [search, l1, conf, esc, sortKey, sortDir]);

  const doSort = (key: 'vol' | 'conf' | 'esc') => {
    setSortDir(sortKey === key ? -sortDir : -1);
    setSortKey(key);
  };

  const resetFilters = () => {
    setSearch('');
    setL1('');
    setConf('');
    setEsc('');
  };

  const sortArc = (key: 'vol' | 'conf' | 'esc') => {
    if (sortKey !== key) return '↓';
    return sortDir === -1 ? '↓' : '↑';
  };

  const intentsPanel = (
    <div data-od-id="panel-d-intents">
      <div className="card">
        <div className="card-h" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <h3>Intent ledger</h3>
          <div className="toolbar">
            <div style={{ position: 'relative' }}>
              <Icon name="search" style={{ position: 'absolute', left: 9, top: 9, color: 'var(--muted)' }} />
              <input
                className="input"
                id="d-search"
                style={{ height: 30, paddingLeft: 30, width: 190 }}
                placeholder="Search intent"
                aria-label="Search intents"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="input" id="d-l1" style={{ height: 30, width: 180 }} aria-label="Filter by L1 cluster" value={l1} onChange={(e) => setL1(e.target.value)}>
              <option value="">All L1 clusters</option>
              {L1_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
            <select className="input" id="d-conf" style={{ height: 30, width: 150 }} aria-label="Filter by confidence" value={conf} onChange={(e) => setConf(e.target.value)}>
              <option value="">All confidence</option>
              <option value="high">High (≥ 0.9)</option>
              <option value="mid">Medium (0.7–0.9)</option>
              <option value="low">Low (&lt; 0.7)</option>
            </select>
            <select className="input" id="d-esc" style={{ height: 30, width: 160 }} aria-label="Filter by escalation" value={esc} onChange={(e) => setEsc(e.target.value)}>
              <option value="">Any escalation</option>
              <option value="40">Escalation ≥ 40%</option>
              <option value="20">Escalation ≥ 20%</option>
            </select>
            <span className="hint"><span id="d-count">{filtered.length}</span> shown</span>
          </div>
        </div>
        <table className="table" id="d-table" style={{ marginTop: 8 }}>
          <thead>
            <tr>
              <th>Intent</th>
              <th>L1 cluster</th>
              <th className={`num sortable${sortKey === 'vol' ? ` sort-${sortDir === -1 ? 'desc' : 'asc'}` : ''}`} role="button" tabIndex={0} data-sort="vol" data-od-id="sort-vol" onClick={() => doSort('vol')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSort('vol'); } }}>Volume <span className="arc">{sortArc('vol')}</span></th>
              <th className={`num sortable${sortKey === 'conf' ? ` sort-${sortDir === -1 ? 'desc' : 'asc'}` : ''}`} role="button" tabIndex={0} data-sort="conf" data-od-id="sort-conf" onClick={() => doSort('conf')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSort('conf'); } }}>Conf. <span className="arc">{sortArc('conf')}</span></th>
              <th className={`num sortable${sortKey === 'esc' ? ` sort-${sortDir === -1 ? 'desc' : 'asc'}` : ''}`} role="button" tabIndex={0} data-sort="esc" data-od-id="sort-esc" onClick={() => doSort('esc')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSort('esc'); } }}>Escalation <span className="arc">{sortArc('esc')}</span></th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="d-body">
            {filtered.map((r) => (
              <tr key={r.intent} data-l1={r.l1} data-conf={r.conf} data-vol={r.vol} data-esc={r.esc}>
                <td style={{ fontWeight: 520 }}>{r.intent}</td>
                <td className="muted">{r.l1}</td>
                <td className="num">{r.vol.toLocaleString()}</td>
                <td className="num">{r.conf.toFixed(2)}</td>
                <td className="num">{r.esc}%</td>
                <td><span className={r.status.badge}><span className="dot" />{r.status.label}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty" id="d-empty">
            <div style={{ marginBottom: 8 }}><Icon name="filter" large /></div>
            No intents match these filters.
            <div style={{ marginTop: 10 }}><button type="button" className="btn btn-sm" id="d-reset" onClick={resetFilters}>Reset filters</button></div>
          </div>
        )}
      </div>
    </div>
  );

  const clustersPanel = (
    <div data-od-id="panel-d-clusters">
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card card-b" data-od-id="dash-cluster-map">
          <div className="card-h" style={{ padding: '0 0 10px' }}><h3>Cluster shape</h3></div>
          <div className="cl-map-wrap">
            <ClusterMap />
          </div>
          <p className="hint" style={{ marginTop: 6 }}>Bar width is proportional to each L1 cluster&apos;s share of the 18,442 labelled records.</p>
        </div>
        <div className="card">
          <div className="card-h"><h3>L1 → L2 → L3 breakdown</h3></div>
          <table className="table ctree" style={{ marginTop: 6 }}>
            <thead><tr><th>Cluster</th><th className="num">Intents</th><th className="num">Volume</th><th className="num">Share</th></tr></thead>
            <tbody>
              <tr><td>Billing &amp; Payments <span className="lvl">L1</span></td><td className="num">86</td><td className="num">7,045</td><td className="num">38.2%</td></tr>
              <tr className="kid"><td>Invoice Disputes <span className="lvl">L2</span></td><td className="num">34</td><td className="num">2,847</td><td className="num">15.4%</td></tr>
              <tr className="leaf"><td>Charged for cancelled line <span className="lvl">L3</span></td><td className="num">—</td><td className="num">1,842</td><td className="num">10.0%</td></tr>
              <tr className="leaf"><td>Promotional credit missing <span className="lvl">L3</span></td><td className="num">—</td><td className="num">641</td><td className="num">3.5%</td></tr>
              <tr className="kid"><td>Late fees &amp; credits <span className="lvl">L2</span></td><td className="num">21</td><td className="num">1,206</td><td className="num">6.5%</td></tr>
              <tr className="kid"><td>Auto-pay failures <span className="lvl">L2</span></td><td className="num">18</td><td className="num">1,033</td><td className="num">5.6%</td></tr>
              <tr><td>Connectivity &amp; Outages <span className="lvl">L1</span></td><td className="num">74</td><td className="num">4,445</td><td className="num">24.1%</td></tr>
              <tr className="kid"><td>NOIA / area outage <span className="lvl">L2</span></td><td className="num">29</td><td className="num">2,104</td><td className="num">11.4%</td></tr>
              <tr><td>New Installation <span className="lvl">L1</span></td><td className="num">41</td><td className="num">2,545</td><td className="num">13.8%</td></tr>
              <tr><td>Plan Changes <span className="lvl">L1</span></td><td className="num">38</td><td className="num">1,697</td><td className="num">9.2%</td></tr>
              <tr><td>Cancellation &amp; Port-out <span className="lvl">L1</span></td><td className="num">27</td><td className="num">1,550</td><td className="num">8.4%</td></tr>
              <tr><td>Account &amp; Identity <span className="lvl">L1</span></td><td className="num">20</td><td className="num">1,160</td><td className="num">6.3%</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const agentsPanel = (
    <div data-od-id="panel-d-agents">
      <div className="grid-3">
        <div className="card agent-card">
          <div className="head"><Icon name="robot" large /><strong style={{ fontSize: '13.5px' }}>Billing Dispute Agent</strong><span className="badge badge-ok" style={{ marginLeft: 'auto' }}><span className="dot" />Deployed</span></div>
          <div className="mini-kv"><span className="k">Runtime</span><span className="mono">Google ADK</span></div>
          <div className="mini-kv"><span className="k">Build</span><span className="mono">ADK-0143</span></div>
          <div className="mini-kv"><span className="k">Tests</span><span className="tabular">4/4</span></div>
          <div className="mini-kv"><span className="k">Environment</span><span>staging · asia-south1</span></div>
          <Link className="row" to="/develop" style={{ gap: 6, fontSize: '12.5px', fontWeight: 540, marginTop: 2 }}><Icon name="code" />Open in Develop<Icon name="chevr" style={{ marginLeft: 'auto' }} /></Link>
        </div>
        <div className="card agent-card">
          <div className="head"><Icon name="robot" large /><strong style={{ fontSize: '13.5px' }}>Outage Triage Agent</strong><span className="badge badge-ok" style={{ marginLeft: 'auto' }}><span className="dot" />Deployed</span></div>
          <div className="mini-kv"><span className="k">Runtime</span><span className="mono">CX Agent Studio</span></div>
          <div className="mini-kv"><span className="k">Build</span><span className="mono">CXA-0031</span></div>
          <div className="mini-kv"><span className="k">Tests</span><span className="tabular">5/5</span></div>
          <div className="mini-kv"><span className="k">Environment</span><span>production</span></div>
          <Link className="row" to="/develop" style={{ gap: 6, fontSize: '12.5px', fontWeight: 540, marginTop: 2 }}><Icon name="code" />Open in Develop<Icon name="chevr" style={{ marginLeft: 'auto' }} /></Link>
        </div>
        <div className="card agent-card">
          <div className="head"><Icon name="robot" large /><strong style={{ fontSize: '13.5px' }}>Retention Save Agent</strong><span className="badge badge-warn" style={{ marginLeft: 'auto' }}><span className="dot" />1 flaky test</span></div>
          <div className="mini-kv"><span className="k">Runtime</span><span className="mono">LangGraph</span></div>
          <div className="mini-kv"><span className="k">Build</span><span className="mono">LGR-0091</span></div>
          <div className="mini-kv"><span className="k">Tests</span><span className="tabular">3/4</span></div>
          <div className="mini-kv"><span className="k">Environment</span><span>not deployed</span></div>
          <Link className="row" to="/develop" style={{ gap: 6, fontSize: '12.5px', fontWeight: 540, marginTop: 2 }}><Icon name="code" />Open in Develop<Icon name="chevr" style={{ marginLeft: 'auto' }} /></Link>
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-h"><h3>All builds from this run</h3></div>
        <table className="table" style={{ marginTop: 6 }}>
          <thead><tr><th>Build</th><th>Agent</th><th>Runtime</th><th>From map</th><th className="num">Tests</th><th>Environment</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td className="mono">ADK-0143</td><td>Billing Dispute Agent</td><td>Google ADK</td><td className="mono">billing-dispute@v3</td><td className="num">4/4</td><td>staging</td><td><span className="badge badge-ok"><span className="dot" />Deployed</span></td></tr>
            <tr><td className="mono">ADK-0142</td><td>Billing Dispute Agent</td><td>Google ADK</td><td className="mono">billing-dispute@v2</td><td className="num">4/4</td><td>staging</td><td><span className="badge badge-ok"><span className="dot" />Deployed</span></td></tr>
            <tr><td className="mono">CXA-0031</td><td>Outage Triage Agent</td><td>CX Agent Studio</td><td className="mono">outage-triage@v2</td><td className="num">5/5</td><td>production</td><td><span className="badge badge-ok"><span className="dot" />Deployed</span></td></tr>
            <tr><td className="mono">BRK-0037</td><td>Invoice Explanation Agent</td><td>Amazon Bedrock</td><td className="mono">billing-dispute@v2</td><td className="num">2/4</td><td>—</td><td><span className="badge badge-err"><span className="dot" />Failed · auth scope</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <AppShell
      crumb="Dashboard"
      middleCrumb={(
        <select aria-label="Switch completed job" style={{ maxWidth: 280 }} className="input" defaultValue="run-4821">
          <option value="run-4821">RUN-4821 · Week-26 clustering refresh</option>
          <option value="run-4792">RUN-4792 · Network Ops Copilot</option>
          <option value="run-4770">RUN-4770 · Northwind first pass</option>
        </select>
      )}
      badge={<span className="badge badge-ok"><span className="dot" />Completed · 18 Jul, 14:32</span>}
      actions={(
        <button type="button" className="btn btn-sm" onClick={() => toast('Dashboard exported as skyline-run-4821.pdf', 'download')}>
          <Icon name="download" />Export
        </button>
      )}
    >
      <div className="page" data-od-id="dashboard-page">
        <div className="page-h">
          <div style={{ flex: 1 }}>
            <h1 data-od-id="page-title">Run dashboard</h1>
            <p className="sub">Everything the finished run produced — 286 canonical intents, six L1 clusters with their L2 / L3 shape, and the agent builds generated from them. Filter or sort any column.</p>
          </div>
          <span className="badge"><span className="dot" />Client · Skyline Broadband</span>
          <span className="badge"><span className="dot" />42 min · ₹1,284</span>
        </div>

        <div className="grid-4" style={{ marginBottom: 18 }} data-od-id="dash-kpis">
          <div className="card kpi"><div className="k">Records processed</div><div className="v">18,442</div><div className="d">3 sources · 24.7k events</div></div>
          <div className="card kpi"><div className="k">Canonical intents</div><div className="v">286</div><div className="d">3,214 raw → deduped</div></div>
          <div className="card kpi"><div className="k">L1 clusters</div><div className="v">6</div><div className="d">19 L2 · 57 L3 nodes</div></div>
          <div className="card kpi"><div className="k">Agent builds</div><div className="v">9</div><div className="d">4 runtimes · 7 deployed</div></div>
        </div>

        <div style={{ marginBottom: 16 }} data-od-id="dash-tabs">
          <Tabs
            tabs={[
              { id: 'intents', label: <>Intents <span className="count">286</span></> },
              { id: 'clusters', label: <>Clusters <span className="count">6 L1</span></> },
              { id: 'agents', label: <>Agents <span className="count">9</span></> },
            ]}
            panels={{ intents: intentsPanel, clusters: clustersPanel, agents: agentsPanel }}
            defaultTab="intents"
          />
        </div>
      </div>
    </AppShell>
  );
}
