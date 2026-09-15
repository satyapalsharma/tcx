import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { ClusterMapSvg } from '../components/ClusterMapSvg';
import { Icon } from '../components/Icon';
import { CloseButton, Dialog, Drawer, OpenButton, useOverlay } from '../components/Overlay';
import { ChipGroup, Switch } from '../components/ui';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';

type Intent = { name: string; l1: string; vol: string; share: string; conf: string; esc: string; status: string; badge: string };

const INTENTS: Intent[] = [
  { name: 'Charged for a cancelled service line', l1: 'Billing & Payments', vol: '1,842', share: '10.0%', conf: '0.96', esc: '41%', status: 'Canonical', badge: 'badge-ok' },
  { name: 'Invoice higher than agreed promo price', l1: 'Billing & Payments', vol: '1,631', share: '8.8%', conf: '0.94', esc: '33%', status: 'Canonical', badge: 'badge-ok' },
  { name: 'Internet down — area outage (NOIA)', l1: 'Connectivity & Outages', vol: '1,530', share: '8.3%', conf: '0.97', esc: '22%', status: 'Canonical', badge: 'badge-ok' },
  { name: 'Slow speeds at peak hours', l1: 'Connectivity & Outages', vol: '1,118', share: '6.1%', conf: '0.92', esc: '18%', status: 'New · wk26', badge: 'badge-acc' },
  { name: 'Book new fiber installation slot', l1: 'New Installation', vol: '1,043', share: '5.7%', conf: '0.95', esc: '9%', status: 'Canonical', badge: 'badge-ok' },
  { name: 'Port number out to another provider', l1: 'Cancellation & Port-out', vol: '976', share: '5.3%', conf: '0.93', esc: '57%', status: 'New · wk26', badge: 'badge-acc' },
  { name: 'Auto-pay failed but card is valid', l1: 'Billing & Payments', vol: '892', share: '4.8%', conf: '0.91', esc: '26%', status: 'Canonical', badge: 'badge-ok' },
  { name: 'Router returns after plan upgrade', l1: 'Plan Changes', vol: '640', share: '3.5%', conf: '0.89', esc: '12%', status: 'Canonical', badge: 'badge-ok' },
];

const CUST: Record<string, string> = {
  'Charged for a cancelled service line': "I cancelled the line back in June, but this month's bill still shows the 799 plan and two rental charges.",
  'Invoice higher than agreed promo price': 'The promo you sold me was 599 for six months, but the invoice shows 899 plus a setup fee I never agreed to.',
  'Internet down — area outage (NOIA)': "The whole street has been down since last night — there's no sync light on the router at all.",
  'Slow speeds at peak hours': 'Every evening between eight and eleven the speed drops to a crawl and streaming just buffers.',
  'Book new fiber installation slot': 'I want to book the fibre install — the society office says the ducting is ready now.',
  'Port number out to another provider': "I'm moving to another provider and need to port this number out — please give me the UPC code.",
  'Auto-pay failed but card is valid': 'Auto-pay failed again this month but the card is fine — I used the same card at a store an hour ago.',
  'Router returns after plan upgrade': 'Since the upgrade the old router has to go back — how do I return it and get the deposit adjusted?',
};

const REVIEW_ITEMS = [
  { id: 'rv-1', title: '“Duplicate charge after plan change”', records: '214 records', conf: '0.71', quote: '“…I only asked to upgrade the plan, why is the old line still billed — this is the second month…”', merge: 'Merge with “Invoice higher than promo”' },
  { id: 'rv-2', title: '“Static line noise on VoIP desk phone”', records: '86 records', conf: '0.66', quote: '“…the wired phone crackles whenever the broadband syncs, it started after the firmware push…”', merge: 'Merge with “Connectivity & Outages”' },
  { id: 'rv-3', title: '“Installation technician no-show”', records: '147 records', conf: '0.79', quote: '“…the engineer never turned up in the 9–1 window and nobody called, we still have no internet upstairs…”', merge: 'Merge with “Book installation slot”' },
];

const L1_CLUSTERS = [
  { id: 'cluster-billing', name: 'Billing & Payments', vol: '7,045 · 38.2%', pct: 38.2, approved: true },
  { id: 'cluster-connectivity', name: 'Connectivity & Outages', vol: '4,445 · 24.1%', pct: 24.1 },
  { id: 'cluster-install', name: 'New Installation & Provisioning', vol: '2,545 · 13.8%', pct: 13.8 },
  { id: 'cluster-upgrade', name: 'Plan Changes & Upgrades', vol: '1,697 · 9.2%', pct: 9.2 },
  { id: 'cluster-cancel', name: 'Cancellation & Port-out', vol: '1,550 · 8.4%', pct: 8.4 },
  { id: 'cluster-account', name: 'Account & Identity', vol: '1,160 · 6.3%', pct: 6.3 },
];

function buildThread(name: string, variant: number) {
  const cust = CUST[name] || `Hi, I need help with ${name.charAt(0).toLowerCase()}${name.slice(1)}.`;
  const lines: [string, string][] = [
    ['Agent', "Thanks for calling Skyline Broadband, this is Neha. Can I take the number you're calling about?"],
    ['Customer', cust],
    ['Agent', 'Thanks — account verified. Let me pull up the account and the last two invoices.'],
    ['Tool · crm.get_invoice', 'inv_98231 · 2 lines · outstanding ₹1,384.00'],
    ['Agent', "I'm checking the applicable plan terms before I action anything."],
    ['Customer', "Okay — I just want it corrected, I've been going back and forth on this."],
    ['Agent', "Understood. I've raised the correction and it will reflect on the next statement with a reference you can track."],
    ['Tool · comms.send_receipt', 'SMS + email sent · ref SBB-2026-44817'],
  ];
  if (variant === 1) {
    lines[1] = ['Customer', "Same issue as my last call — nobody has fixed it and I'm not paying for a service I cancelled."];
    lines[4] = ['Agent', "I can see the previous case from last week. I'm sorry it reopened — I'll keep it on the same case and escalate the credit today."];
  }
  if (variant === 2) {
    lines[1] = ['Customer', "Before you start — I've spent forty minutes on this across two calls. Please just tell me the fix."];
    lines[4] = ['Agent', "You're right to be frustrated. I'm applying the correction now and waiving the late fee that was added in error."];
  }
  return lines;
}

export default function Analysis() {
  useReveal();
  const toast = useToast();
  const { open, close } = useOverlay();
  const [pct, setPct] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tab, setTab] = useState('intents');
  const [clusterView, setClusterView] = useState('tree');
  const [intentSearch, setIntentSearch] = useState('');
  const [confFilter, setConfFilter] = useState('all');
  const [uploadSrc, setUploadSrc] = useState('local');
  const [nuance, setNuance] = useState('synth');
  const [piiIngest, setPiiIngest] = useState(true);
  const [piiEmbed, setPiiEmbed] = useState(true);
  const [express, setExpress] = useState(false);
  const [dropOver, setDropOver] = useState(false);
  const [dropText, setDropText] = useState<string | null>(null);
  const [s3Result, setS3Result] = useState('Not scanned yet.');
  const [gcsResult, setGcsResult] = useState('Not scanned yet.');
  const [reviewResolved, setReviewResolved] = useState<Record<string, string>>({});
  const [billingOpen, setBillingOpen] = useState(true);
  const [invoiceOpen, setInvoiceOpen] = useState(true);
  const [hiddenClusters, setHiddenClusters] = useState<Set<string>>(new Set());
  const [extraClusters, setExtraClusters] = useState<{ id: string; name: string }[]>([]);
  const [clusterNames, setClusterNames] = useState<Record<string, string>>({});
  const [reviewStageLive, setReviewStageLive] = useState(false);
  const [clTarget, setClTarget] = useState<string | null>(null);
  const [clName, setClName] = useState('');
  const [clMerge, setClMerge] = useState('');
  const [clTitle, setClTitle] = useState('Rename cluster');
  const [transcript, setTranscript] = useState<{ name: string; count: string; conf: string } | null>(null);
  const [trVar, setTrVar] = useState(0);
  const [langChips, setLangChips] = useState({ en: true, hi: true, reg: false });

  useEffect(() => {
    if (paused || pct >= 68) return;
    const delay = pct === 0 ? 350 : 26;
    const t = setTimeout(() => setPct((p) => Math.min(p + 1, 68)), delay);
    return () => clearTimeout(t);
  }, [pct, paused]);

  const filteredIntents = useMemo(() => {
    const q = intentSearch.trim().toLowerCase();
    return INTENTS.filter((i) => {
      if (q && !i.name.toLowerCase().includes(q)) return false;
      const c = parseFloat(i.conf);
      if (confFilter === 'high' && c < 0.9) return false;
      if (confFilter === 'mid' && (c < 0.7 || c >= 0.9)) return false;
      if (confFilter === 'low' && c >= 0.7) return false;
      return true;
    });
  }, [intentSearch, confFilter]);

  const openTranscript = (intent: Intent) => {
    setTranscript({ name: intent.name, count: intent.vol, conf: intent.conf });
    setTrVar(0);
    open('dw-transcript');
  };

  const reviewAction = (id: string, act: string) => {
    const labels: Record<string, string> = { new: 'Kept as a new intent — queued for naming', merge: 'Merged — taxonomy updated', reject: 'Rejected — excluded from taxonomy' };
    setReviewResolved((prev) => ({ ...prev, [id]: labels[act] }));
    toast(labels[act], act === 'reject' ? 'x' : 'check');
  };

  const openClusterDlg = (id: string | null, name = '') => {
    setClTarget(id);
    setClTitle(id ? 'Rename cluster' : 'New cluster');
    setClName(name || (id ? clusterNames[id] ?? L1_CLUSTERS.find((c) => c.id === id)?.name ?? '' : ''));
    setClMerge('');
    open('dlg-cluster');
  };

  const saveCluster = () => {
    const name = clName.trim() || 'Untitled cluster';
    close();
    if (clTarget && clMerge) {
      setHiddenClusters((prev) => new Set(prev).add(clTarget));
      toast(`Merged into "${clMerge}" — L2/L3 nodes and volume moved`, 'merge');
    } else if (clTarget) {
      setClusterNames((prev) => ({ ...prev, [clTarget]: name }));
      toast(`Cluster renamed to "${name}"`, 'edit');
    } else {
      setExtraClusters((prev) => [...prev, { id: `cluster-new-${Date.now()}`, name }]);
      toast(`New cluster "${name}" created as a draft`, 'plus');
    }
  };

  const scanBucket = (type: 's3' | 'gcs', bucket: string) => {
    const set = type === 's3' ? setS3Result : setGcsResult;
    set(`Scanning ${bucket}…`);
    setTimeout(() => {
      set('<strong>14 files found</strong> · 8 PDF · 3 DOCX · 3 JSONL · 1.9 GB · ready to stage');
      toast('Bucket scan complete — 14 files ready to stage', 'cloud');
    }, 700);
  };

  const thread = transcript ? buildThread(transcript.name, trVar) : [];

  const renderClusterRow = (c: typeof L1_CLUSTERS[0] | { id: string; name: string; vol?: string; pct?: number; approved?: boolean }) => {
    if (hiddenClusters.has(c.id)) return null;
    const name = clusterNames[c.id] ?? c.name;
    const vol = 'vol' in c && c.vol ? c.vol : '0 · 0.0%';
    const pctW = 'pct' in c && c.pct ? c.pct : 0;
    return (
      <div key={c.id} className="tree-item" data-od-id={c.id}>
        <div className="trow" aria-expanded="false">
          <Icon name="chev" className="chev" />
          <strong style={{ fontSize: 13 }}>{name}</strong>
          {'approved' in c && c.approved && <span className="badge badge-ok" style={{ marginLeft: 2 }}><span className="dot" />Approved</span>}
          <span style={{ flex: 1 }} />
          <span className="muted tabular" style={{ fontSize: 12 }}>{vol}</span>
          <div className="meter" style={{ width: 110 }}><div className="track"><div className={`fill${'approved' in c && c.approved ? ' fill-ok' : ''}`} style={{ width: `${pctW}%` }} /></div></div>
          <button type="button" className="icon-btn" aria-label="Rename or merge cluster" onClick={(e) => { e.stopPropagation(); openClusterDlg(c.id, name); }}><Icon name="edit" /></button>
        </div>
        <div className="tree-kids" />
      </div>
    );
  };

  return (
    <AppShell crumb="Analysis" badge={<span className="badge badge-warn badge-run"><span className="dot" />RUN-4821 · {pct}% · ETA 14 min</span>}>
      <div className="page" data-od-id="analysis-page">
        <div className="page-h">
          <div style={{ flex: 1 }}>
            <h1 data-od-id="page-title">Analysis</h1>
            <p className="sub">Customer interactions flow in from connectors, intents get extracted, then clustered into L1 → L2 → L3. Approve clusters to unblock the Design team.</p>
          </div>
          <OpenButton className="btn" target="dlg-upload" data-od-id="upload-btn"><Icon name="upload" />Upload data</OpenButton>
          <OpenButton className="btn btn-primary" target="dlg-run" data-od-id="run-btn"><Icon name="play" />Run pipeline</OpenButton>
        </div>

        <div className="card card-b" style={{ marginBottom: 18, padding: '14px 16px 12px' }} data-od-id="stage-strip">
          <div className="stage-flow" style={{ justifyContent: 'space-between' }}>
            <span className="snode done"><span className="glyph"><Icon name="check" style={{ width: 10, height: 10 }} /></span>Upload &amp; connect</span>
            <span className="slink" style={{ flex: 1 }} />
            <span className="snode done"><span className="glyph"><Icon name="check" style={{ width: 10, height: 10 }} /></span>Intent extraction</span>
            <span className="slink" style={{ flex: 1 }} />
            <span className="snode live"><span className="glyph"><span className="mini" /></span>Clustering</span>
            <span className="slink" style={{ flex: 1 }} />
            <span className={`snode${reviewStageLive ? ' live' : ''}`}><span className="glyph">{reviewStageLive ? <span className="mini" /> : null}</span>Review &amp; approve</span>
          </div>
        </div>

        <div className="grid-4" style={{ marginBottom: 18 }} data-od-id="kpi-row">
          <div className="card kpi" data-od-id="kpi-records"><div className="k">Records in dataset</div><div className="v">18,442</div><div className="d">3 sources · updated 12 min ago</div></div>
          <div className="card kpi" data-od-id="kpi-intents"><div className="k">Canonical intents</div><div className="v">286</div><div className="d">3,214 raw → deduped</div></div>
          <div className="card kpi" data-od-id="kpi-coverage"><div className="k">Cluster coverage</div><div className="v">94.6%</div><div className="d">of volume assigned to a cluster</div></div>
          <div className="card kpi" data-od-id="kpi-escalation"><div className="k">Escalation-flagged</div><div className="v">1,244</div><div className="d">6.7% of all interactions</div></div>
        </div>

        <div className="ua-grid">
          <div className="card" data-tab-scope data-od-id="work-area">
            <div className="tabs" data-tabs style={{ padding: '0 8px' }}>
              <button type="button" role="tab" aria-selected={tab === 'intents'} data-tab="intents" data-od-id="tab-intents" onClick={() => setTab('intents')}>Intents <span className="count">286</span></button>
              <button type="button" role="tab" aria-selected={tab === 'clusters'} data-tab="clusters" data-od-id="tab-clusters" onClick={() => setTab('clusters')}>Clusters <span className="count">6 L1</span></button>
              <button type="button" role="tab" aria-selected={tab === 'review'} data-tab="review" data-od-id="tab-review" onClick={() => setTab('review')}>Review queue <span className="count">3</span></button>
            </div>

            {tab === 'intents' && (
              <div data-panel="intents" data-od-id="panel-intents">
                <div className="row" style={{ gap: 8, padding: '12px 16px 0', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                    <Icon name="search" style={{ position: 'absolute', left: 9, top: 9, color: 'var(--muted)' }} />
                    <input className="input" style={{ height: 30, paddingLeft: 30 }} placeholder="Search intents" aria-label="Search intents" value={intentSearch} onChange={(e) => setIntentSearch(e.target.value)} />
                  </div>
                  <select className="input" style={{ height: 30, width: 150 }} value={confFilter} onChange={(e) => setConfFilter(e.target.value)}>
                    <option value="all">All confidence</option><option value="high">High (≥ 0.9)</option><option value="mid">Medium</option><option value="low">Low (&lt; 0.7)</option>
                  </select>
                  <span className="hint"><span id="intent-count">{filteredIntents.length}</span> shown · click a row for transcripts</span>
                </div>
                <table className="table" id="intent-table" style={{ marginTop: 8 }}>
                  <thead><tr><th>Intent</th><th>L1 cluster</th><th className="num">Volume</th><th className="num">Share</th><th className="num">Conf.</th><th className="num">Escalation</th><th>Status</th><th style={{ width: 40 }} /></tr></thead>
                  <tbody>
                    {filteredIntents.map((i) => (
                      <tr key={i.name} data-filter-row style={{ cursor: 'pointer' }} onClick={() => openTranscript(i)}>
                        <td style={{ fontWeight: 520 }}>{i.name}</td>
                        <td className="muted">{i.l1}</td>
                        <td className="num">{i.vol}</td>
                        <td className="num">{i.share}</td>
                        <td className="num">{i.conf}</td>
                        <td className="num">{i.esc}</td>
                        <td><span className={`badge ${i.badge}`}><span className="dot" />{i.status}</span></td>
                        <td><button type="button" className="icon-btn" aria-label="View transcripts" onClick={(e) => { e.stopPropagation(); openTranscript(i); }}><Icon name="eye" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredIntents.length === 0 && (
                  <div className="empty" id="intent-empty" data-od-id="intent-empty">
                    <div style={{ marginBottom: 8 }}><Icon name="filter" large /></div>
                    No intents match this search.
                  </div>
                )}
              </div>
            )}

            {tab === 'clusters' && (
              <div data-panel="clusters" data-od-id="panel-clusters">
                <div className="row toolbar" style={{ padding: '14px 16px 8px', gap: 8 }}>
                  <div className="hint" style={{ flex: 1, minWidth: 180 }}>L1 → L2 → L3. Open a cluster to inspect breakdowns, rename or merge it, then approve the handoff to Design.</div>
                  <div className="row" style={{ gap: 6 }} data-chips data-swap="cview" data-od-id="cluster-view-toggle">
                    <button type="button" className="chip" aria-pressed={clusterView === 'tree'} data-val="tree" onClick={() => setClusterView('tree')}>Tree</button>
                    <button type="button" className="chip" aria-pressed={clusterView === 'map'} data-val="map" onClick={() => setClusterView('map')}>Cluster map</button>
                  </div>
                  <button type="button" className="btn btn-sm" id="new-cluster" data-od-id="new-cluster-btn" onClick={() => openClusterDlg(null)}><Icon name="plus" />New cluster</button>
                  <button type="button" className="btn btn-sm" id="approve-design" data-od-id="approve-clusters-btn" onClick={() => { toast('4 clusters locked & shared with Design umbrella', 'check'); setReviewStageLive(true); }}><Icon name="check" />Approve clusters &amp; send to Design</button>
                </div>
                <div className="rag-row" style={{ border: '1px solid var(--border)', background: 'var(--surface-inset)', borderRadius: 8, padding: '10px 12px', gap: 9, margin: '0 16px 6px' }} data-od-id="cluster-threshold">
                  <Icon name="info" style={{ color: 'var(--muted)' }} />
                  <div style={{ fontSize: 12, flex: 1, minWidth: 200 }}><strong>Auto-clustering runs at ≥50 canonical intents.</strong> This run extracted 286 → clustering ran and produced 6 L1 clusters. Projects below the threshold (e.g. Network Ops Copilot · 41 intents) <strong>skip clustering</strong> and go straight to review with a flat intent list.</div>
                  <span className="badge badge-ok"><span className="dot" />Eligible · 286</span>
                </div>
                {clusterView === 'tree' && (
                  <div data-swap-panel="cview-tree" style={{ padding: '10px 12px 14px' }}>
                    {!hiddenClusters.has('cluster-billing') && (
                      <div className="tree-item" data-od-id="cluster-billing">
                        <div className="trow" aria-expanded={billingOpen} onClick={() => setBillingOpen(!billingOpen)}>
                          <Icon name="chev" className="chev" style={{ transform: billingOpen ? 'rotate(180deg)' : undefined }} />
                          <strong style={{ fontSize: 13 }}>{clusterNames['cluster-billing'] ?? 'Billing & Payments'}</strong>
                          <span className="badge badge-ok" style={{ marginLeft: 2 }}><span className="dot" />Approved</span>
                          <span style={{ flex: 1 }} />
                          <span className="muted tabular" style={{ fontSize: 12 }}>7,045 · 38.2%</span>
                          <div className="meter" style={{ width: 110 }}><div className="track"><div className="fill fill-ok" style={{ width: '38.2%' }} /></div></div>
                          <button type="button" className="icon-btn" aria-label="Rename or merge cluster" onClick={(e) => { e.stopPropagation(); openClusterDlg('cluster-billing'); }}><Icon name="edit" /></button>
                        </div>
                        {billingOpen && (
                          <div className="tree-kids open">
                            <div className="tree-item" style={{ background: 'var(--surface-inset)' }}>
                              <div className="trow" aria-expanded={invoiceOpen} onClick={() => setInvoiceOpen(!invoiceOpen)}>
                                <Icon name="chev" className="chev" style={{ transform: invoiceOpen ? 'rotate(180deg)' : undefined }} />
                                <span>Invoice Disputes</span>
                                <span style={{ flex: 1 }} /><span className="muted tabular" style={{ fontSize: 12 }}>2,847</span>
                              </div>
                              {invoiceOpen && (
                                <div className="tree-kids open">
                                  <div className="rag-row" style={{ borderBottom: 0 }}><Icon name="dot" style={{ margin: 2, color: 'var(--muted)' }} /><div>Charged for cancelled service line<br /><span className="hint">1,842 calls · conf 0.96</span></div></div>
                                  <div className="rag-row" style={{ borderBottom: 0 }}><Icon name="dot" style={{ margin: 2, color: 'var(--muted)' }} /><div>Promotional credit missing<br /><span className="hint">641 calls · conf 0.92</span></div></div>
                                  <div className="rag-row" style={{ borderBottom: 0 }}><Icon name="dot" style={{ margin: 2, color: 'var(--muted)' }} /><div>Prorated amount mismatch<br /><span className="hint">364 calls · conf 0.88</span></div></div>
                                </div>
                              )}
                            </div>
                            {['Late fees & credits', 'Auto-pay failures', 'Refunds & reversals'].map((label, idx) => (
                              <div key={label} className="tree-item" style={{ background: 'var(--surface-inset)' }}>
                                <div className="trow" aria-expanded="false"><Icon name="chev" className="chev" /><span>{label}</span><span style={{ flex: 1 }} /><span className="muted tabular" style={{ fontSize: 12 }}>{['1,206', '1,033', '958'][idx]}</span></div>
                                <div className="tree-kids" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {!hiddenClusters.has('cluster-connectivity') && (
                      <div className="tree-item" data-od-id="cluster-connectivity">
                        <div className="trow" aria-expanded="false">
                          <Icon name="chev" className="chev" />
                          <strong style={{ fontSize: 13 }}>{clusterNames['cluster-connectivity'] ?? 'Connectivity & Outages'}</strong>
                          <span style={{ flex: 1 }} /><span className="muted tabular" style={{ fontSize: 12 }}>4,445 · 24.1%</span>
                          <div className="meter" style={{ width: 110 }}><div className="track"><div className="fill" style={{ width: '24.1%' }} /></div></div>
                          <button type="button" className="icon-btn" aria-label="Rename or merge cluster" onClick={(e) => { e.stopPropagation(); openClusterDlg('cluster-connectivity'); }}><Icon name="edit" /></button>
                        </div>
                        <div className="tree-kids"><div className="hint" style={{ padding: '8px 0 4px' }}>5 L2 · 18 L3 — expand fetched on demand in production.</div></div>
                      </div>
                    )}
                    {L1_CLUSTERS.filter((c) => !['cluster-billing', 'cluster-connectivity'].includes(c.id)).map(renderClusterRow)}
                    {extraClusters.map(renderClusterRow)}
                  </div>
                )}
                {clusterView === 'map' && (
                  <div data-swap-panel="cview-map" className="cl-map-wrap" data-od-id="cluster-map">
                    <ClusterMapSvg />
                    <p className="hint" style={{ marginTop: 10 }}>Hub = 286 canonical intents. Node width and the filled bar show each L1 cluster&apos;s share of labelled volume; L2 / L3 counts sit inside each node.</p>
                  </div>
                )}
              </div>
            )}

            {tab === 'review' && (
              <div data-panel="review" data-od-id="panel-review">
                <div style={{ padding: '14px 16px 6px' }} className="hint">Low-confidence extractions that need an analyst decision before they enter the taxonomy.</div>
                {REVIEW_ITEMS.map((rv) => (
                  <div key={rv.id} className={`rv-card${reviewResolved[rv.id] ? ' resolved' : ''}`} data-rv data-od-id={rv.id}>
                    <div className="row" style={{ gap: 10 }}>
                      <strong style={{ fontSize: 13 }}>{rv.title}</strong>
                      <span className="badge"><span className="dot" />{rv.records}</span>
                      <span style={{ flex: 1 }} />
                      <div className="meter" style={{ width: 130 }}><div className="track"><div className={`fill${parseFloat(rv.conf) < 0.75 ? ' fill-warn' : ''}`} style={{ width: `${parseFloat(rv.conf) * 100}%` }} /></div><span className="tabular muted" style={{ fontSize: 12 }}>{rv.conf}</span></div>
                    </div>
                    <p className="quote" style={{ margin: '8px 0 10px' }}>{rv.quote}</p>
                    <div className="row rv-actions" style={{ gap: 8 }}>
                      {reviewResolved[rv.id] ? (
                        <span className="badge badge-ok"><span className="dot" />{reviewResolved[rv.id]}</span>
                      ) : (
                        <>
                          <button type="button" className="btn btn-sm" data-rv-act="new" onClick={() => reviewAction(rv.id, 'new')}>Accept as new</button>
                          <button type="button" className="btn btn-sm" data-rv-act="merge" onClick={() => reviewAction(rv.id, 'merge')}>{rv.merge}</button>
                          <button type="button" className="btn btn-sm btn-danger" data-rv-act="reject" onClick={() => reviewAction(rv.id, 'reject')}>Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            <div className="card" data-od-id="live-run-card">
              <div className="card-h">
                <h3>Live run</h3>
                <span className={`badge${paused ? '' : ' badge-warn badge-run'}`} id="run-badge"><span className="dot" />{paused ? 'Paused' : 'RUN-4821'}</span>
                <span style={{ flex: 1 }} />
                <button type="button" className="btn btn-sm" id="run-toggle" onClick={() => setPaused(!paused)}>{paused ? 'Resume' : 'Pause'}</button>
              </div>
              <div className="card-b" style={{ paddingTop: 12 }}>
                <div className="row" style={{ justifyContent: 'space-between', fontSize: '12.5px' }}>
                  <span style={{ fontWeight: 560 }}>Week-26 clustering refresh</span>
                  <span className="tabular muted" id="run-pct">{pct}%</span>
                </div>
                <div className="meter" style={{ margin: '8px 0 4px' }}><div className="track"><div className="fill" id="run-fill" style={{ width: `${pct}%` }} /></div></div>
                <div className="hint" style={{ fontSize: '11.5px' }} id="run-eta">ETA ~14 min · new wave of records only</div>
                <div className="divider" style={{ margin: '12px 0 4px' }} />
                <div className="job-line"><span className="st done"><Icon name="check" /></span>Ingestion <span className="tabular muted" style={{ fontSize: 12 }}>18,442 rows</span></div>
                <div className="job-line"><span className="st done"><Icon name="check" /></span>PII redaction <span className="tabular muted" style={{ fontSize: 12 }}>3,104 fields masked</span></div>
                <div className="job-line"><span className="st done"><Icon name="check" /></span>Embedding <span className="tabular muted" style={{ fontSize: 12 }}>768-dim vectors</span></div>
                <div className="job-line"><span className="st run" id="js-cluster"><Icon name="sync" /></span>Clustering <span className="tabular muted" style={{ fontSize: 12 }}>{pct}% · 24,190 vectors done</span></div>
                <div className="job-line muted"><span className="st"><Icon name="dot" /></span>Coverage report <span style={{ fontSize: 12 }}>queued</span></div>
              </div>
            </div>

            <div className="card" data-od-id="sources-card">
              <div className="card-h"><h3>Sources</h3><span style={{ flex: 1 }} /><Link className="btn btn-sm" to="/connectors">Manage</Link></div>
              <div className="card-b" style={{ paddingTop: 8 }}>
                <div className="src-row"><span className="badge badge-ok"><span className="dot" />Live</span><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 540 }}>Genesys Cloud — calls</div><div className="hint" style={{ fontSize: '11.5px' }}>4,812 transcripts · synced 12 min ago</div></div><button type="button" className="icon-btn" title="Download as .xlsx" onClick={() => toast('genesys-calls-w26.xlsx downloading', 'download')}><Icon name="download" /></button><button type="button" className="icon-btn" title="Sync now" onClick={() => toast('Sync requested for Genesys Cloud', 'sync')}><Icon name="sync" /></button></div>
                <div className="src-row"><span className="badge badge-ok"><span className="dot" />Live</span><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 540 }}>Zendesk — conversations</div><div className="hint" style={{ fontSize: '11.5px' }}>9,205 threads · synced 38 min ago</div></div><button type="button" className="icon-btn" title="Download as .xlsx" onClick={() => toast('zendesk-threads-w26.xlsx downloading', 'download')}><Icon name="download" /></button><button type="button" className="icon-btn" title="Sync now" onClick={() => toast('Sync requested for Zendesk', 'sync')}><Icon name="sync" /></button></div>
                <div className="src-row"><span className="badge badge-warn"><span className="dot" />Re-auth</span><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 540 }}>CSV — CRM notes batch</div><div className="hint" style={{ fontSize: '11.5px' }}>4,425 rows · manual upload · wk25</div></div><button type="button" className="icon-btn" title="Download as .xlsx" onClick={() => toast('crm-notes-wk25.xlsx downloading', 'download')}><Icon name="download" /></button><OpenButton className="icon-btn" target="dlg-upload" title="Re-upload"><Icon name="upload" /></OpenButton></div>
              </div>
            </div>

            <details className="adv" data-od-id="adv-settings">
              <summary><Icon name="gear" /><span>Advanced pipeline settings</span><Icon name="chev" className="chev" /></summary>
              <div className="adv-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="field"><label className="label" htmlFor="adv-model">Extraction model</label>
                  <select className="input" id="adv-model"><option>tx-intent-v3.2 (recommended)</option><option>tx-intent-v3.1 — pinned</option><option>claude-sonnet — sandbox</option></select>
                </div>
                <div className="field"><label className="label" htmlFor="adv-conf">Min. clustering confidence</label><input className="input" id="adv-conf" defaultValue="0.72" inputMode="decimal" /><span className="hint">Records below this go to the review queue.</span></div>
                <div className="field"><span className="label">Languages</span>
                  <div className="row" style={{ gap: 6, flexWrap: 'wrap' }} data-chips-multi>
                    <button type="button" className="chip" aria-pressed={langChips.en} onClick={() => setLangChips((p) => ({ ...p, en: !p.en }))}>English</button>
                    <button type="button" className="chip" aria-pressed={langChips.hi} onClick={() => setLangChips((p) => ({ ...p, hi: !p.hi }))}>Hindi · transliterated</button>
                    <button type="button" className="chip" aria-pressed={langChips.reg} onClick={() => setLangChips((p) => ({ ...p, reg: !p.reg }))}>Regional mixed</button>
                  </div>
                </div>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div><div className="label">PII redaction before embedding</div><div className="hint">Numbers, IDs and addresses are masked.</div></div>
                  <Switch checked={piiEmbed} onChange={setPiiEmbed} label="PII redaction before embedding" />
                </div>
                <button type="button" className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => toast('Advanced settings saved for next run', 'gear')}>Save for next run</button>
              </div>
            </details>
          </div>
        </div>
      </div>

      <Dialog id="dlg-upload" data-od-id="upload-dialog">
        <div className="dialog-h"><h2>Upload interaction data</h2><p className="hint">Files land in a staging bucket, get PII-redacted, then join the next pipeline run.</p></div>
        <div className="dialog-b">
          <div className="field">
            <span className="label">Where is the data?</span>
            <ChipGroup value={uploadSrc} onChange={setUploadSrc} swapPrefix="upsrc" options={[
              { val: 'local', label: 'Upload files' },
              { val: 's3', label: 'Amazon S3' },
              { val: 'gcs', label: 'Google Cloud Storage' },
            ]} />
          </div>
          {uploadSrc === 'local' && (
            <div data-swap-panel="upsrc-local" data-od-id="upload-local">
              <div className={`drop${dropOver ? ' over' : ''}`} id="drop-zone" data-od-id="drop-zone"
                onDragOver={(e) => { e.preventDefault(); setDropOver(true); }}
                onDragEnter={(e) => { e.preventDefault(); setDropOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDropOver(false); }}
                onDrop={(e) => { e.preventDefault(); setDropOver(false); setDropText('genesys_Aug_w26.jsonl staged — 4,120 rows detected'); }}>
                <Icon name="upload" large style={{ marginBottom: 6 }} />
                <div style={{ fontSize: 13, fontWeight: 540 }}>{dropText ?? <>Drop exports here, or <button type="button" className="link" style={{ color: 'var(--accent-strong)' }} id="browse-btn" onClick={() => toast('File picker is stubbed in this demo', 'info')}>browse files</button></>}</div>
                <div className="hint" style={{ marginTop: 4 }}>CSV · JSON · JSONL · PDF · DOC · DOCX · WAV/MP3 — up to 2 GB per file</div>
              </div>
            </div>
          )}
          {uploadSrc === 's3' && (
            <div data-swap-panel="upsrc-s3" data-od-id="upload-s3">
              <div className="field"><label className="label" htmlFor="up-s3-bucket">Bucket</label>
                <select className="input" id="up-s3-bucket"><option>s3://skyline-cx-exports (ap-south-1)</option><option>s3://skyline-genesys-recordings (ap-south-1)</option><option>s3://skyline-nuance-sops (us-east-1)</option></select>
              </div>
              <div className="field" style={{ marginTop: 12 }}><label className="label" htmlFor="up-s3-prefix">Prefix</label><input className="input" id="up-s3-prefix" defaultValue="zendesk/2026-w26/" /></div>
              <div className="row" style={{ gap: 8, marginTop: 12 }}>
                <button type="button" className="btn btn-sm" id="up-s3-scan" onClick={() => scanBucket('s3', 's3://skyline-cx-exports (ap-south-1)')}><Icon name="sync" />Scan bucket</button>
                <span className="hint">Read-only via the IAM role attached on the Connectors page.</span>
              </div>
              <div className="hint" style={{ marginTop: 10 }} id="up-s3-result" dangerouslySetInnerHTML={{ __html: s3Result }} />
            </div>
          )}
          {uploadSrc === 'gcs' && (
            <div data-swap-panel="upsrc-gcs" data-od-id="upload-gcs">
              <div className="field"><label className="label" htmlFor="up-gcs-bucket">Bucket</label>
                <select className="input" id="up-gcs-bucket"><option>gs://skyline-cx-archive (asia-south1)</option><option>gs://skyline-nuance-docs (asia-south1)</option></select>
              </div>
              <div className="field" style={{ marginTop: 12 }}><label className="label" htmlFor="up-gcs-prefix">Folder prefix</label><input className="input" id="up-gcs-prefix" defaultValue="cx/sops/2026/" /></div>
              <div className="row" style={{ gap: 8, marginTop: 12 }}>
                <button type="button" className="btn btn-sm" id="up-gcs-scan" onClick={() => scanBucket('gcs', 'gs://skyline-cx-archive (asia-south1)')}><Icon name="sync" />Scan bucket</button>
                <span className="hint">Uses a service account with objectViewer on this bucket.</span>
              </div>
              <div className="hint" style={{ marginTop: 10 }} id="up-gcs-result" dangerouslySetInnerHTML={{ __html: gcsResult }} />
            </div>
          )}
          <div className="field" data-od-id="nuance-flow">
            <span className="label">Nuance document flow <span className="muted" style={{ fontWeight: 460 }}>· PDF / DOC / DOCX only</span></span>
            <ChipGroup value={nuance} onChange={setNuance} options={[
              { val: 'synth', label: 'Synthetic calls' },
              { val: 'doc', label: 'Document process' },
            ]} />
            <span className="hint" id="nuance-hint">{nuance === 'synth' ? 'Synthetic calls: convert SOPs and policy docs into representative call audio, then run the normal intent pipeline over them.' : 'Document process: extract the process steps straight from the SOPs — no call audio and clustering is skipped.'}</span>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div><div className="label">Redact PII on ingest</div><div className="hint">Recommended for calls with card numbers.</div></div>
            <Switch checked={piiIngest} onChange={setPiiIngest} label="Redact PII on ingest" />
          </div>
        </div>
        <div className="dialog-f">
          <CloseButton className="btn">Cancel</CloseButton>
          <button type="button" className="btn btn-primary" id="upload-confirm" data-od-id="upload-confirm" onClick={() => { close(); toast('1 file added to staging — joins the next run', 'upload'); }}>Add to staging</button>
        </div>
      </Dialog>

      <Dialog id="dlg-run" data-od-id="run-dialog">
        <div className="dialog-h"><h2>Run pipeline</h2><p className="hint">Long-running — you'll get live progress in this panel and in the top bar.</p></div>
        <div className="dialog-b">
          <div className="field"><span className="label">Scope</span>
            <div className="row" style={{ gap: 8 }} data-chips data-od-id="run-scope">
              <button type="button" className="chip" aria-pressed="true">New records only</button>
              <button type="button" className="chip" aria-pressed="false">Full re-cluster</button>
            </div>
          </div>
          <div className="row" style={{ justifyContent: 'space-between', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '11px 12px', background: 'var(--surface-inset)' }}>
            <div><div className="label">Express mode</div><div className="hint">Runs intent extraction → clustering → process map → UML end-to-end with no manual review gates.</div></div>
            <Switch checked={express} onChange={setExpress} label="Express mode" />
          </div>
          <div className="field"><label className="label" htmlFor="run-note">Run note (shows in audit log)</label><input className="input" id="run-note" placeholder="e.g. Week-27 refresh after retention campaign" /></div>
        </div>
        <div className="dialog-f">
          <CloseButton className="btn">Cancel</CloseButton>
          <button type="button" className="btn btn-primary" id="run-confirm" data-od-id="run-confirm" onClick={() => { close(); toast(express ? 'Express run queued — full pipeline completes without manual gates' : 'RUN-4822 queued behind RUN-4821', 'play'); }}>Start run</button>
        </div>
      </Dialog>

      <Dialog id="dlg-cluster" data-od-id="cluster-dialog">
        <div className="dialog-h">
          <h2 id="cl-title">{clTitle}</h2>
          <p className="hint">Renaming keeps the cluster ID stable. Merging folds volume and L2 / L3 nodes into the target, then archives this cluster — the change is written to the audit log.</p>
        </div>
        <div className="dialog-b">
          <div className="field"><label className="label" htmlFor="cl-name">Cluster name</label><input className="input" id="cl-name" placeholder="e.g. Billing & Payments" value={clName} onChange={(e) => setClName(e.target.value)} /></div>
          <div className="field"><label className="label" htmlFor="cl-level">Level</label><select className="input" id="cl-level"><option>L1 · top-level cluster</option><option>L2 · sub-cluster</option><option>L3 · leaf node</option></select></div>
          <div className="field"><label className="label" htmlFor="cl-merge">Merge into (optional)</label>
            <select className="input" id="cl-merge" value={clMerge} onChange={(e) => setClMerge(e.target.value)}>
              <option value="">— Don't merge —</option>
              <option>Connectivity & Outages</option><option>New Installation & Provisioning</option><option>Plan Changes & Upgrades</option><option>Cancellation & Port-out</option><option>Account & Identity</option>
            </select>
            <span className="hint">All L3 nodes and their volume move to the target cluster.</span>
          </div>
        </div>
        <div className="dialog-f">
          <button type="button" className="btn btn-danger" id="cl-delete" data-od-id="cluster-delete" onClick={() => { close(); if (clTarget) setHiddenClusters((prev) => new Set(prev).add(clTarget)); toast('Cluster archived — moved to the review queue', 'trash'); }}><Icon name="trash" />Delete</button>
          <span style={{ flex: 1 }} />
          <CloseButton className="btn">Cancel</CloseButton>
          <button type="button" className="btn btn-primary" id="cl-save" data-od-id="cluster-save" onClick={saveCluster}>Save cluster</button>
        </div>
      </Dialog>

      <Drawer id="dw-transcript" data-od-id="transcript-drawer">
        {transcript && (
          <>
            <div className="drawer-h">
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="caps">Intent · transcript evidence</div>
                <div id="tr-title" style={{ fontSize: '14.5px', fontWeight: 620, letterSpacing: '-0.01em', marginTop: 2, lineHeight: 1.35 }}>&ldquo;{transcript.name}&rdquo;</div>
              </div>
              <CloseButton className="icon-btn" aria-label="Close"><Icon name="x" /></CloseButton>
            </div>
            <div className="drawer-b">
              <div className="grid-2" style={{ marginBottom: 14 }}>
                <div className="card" style={{ padding: '10px 12px' }}><div className="caps" style={{ fontSize: 10 }}>Matching calls</div><div className="tabular" id="tr-count" style={{ fontSize: 15, fontWeight: 620, marginTop: 3 }}>{transcript.count}</div></div>
                <div className="card" style={{ padding: '10px 12px' }}><div className="caps" style={{ fontSize: 10 }}>Avg. confidence</div><div className="tabular" id="tr-conf" style={{ fontSize: 15, fontWeight: 620, marginTop: 3 }}>{transcript.conf}</div></div>
              </div>
              <div className="field" style={{ marginBottom: 12 }}>
                <span className="label">Sample call</span>
                <div className="row tr-tabs" id="tr-picker" data-chips data-od-id="tr-picker">
                  {['Call 1', 'Call 2', 'Call 3'].map((v, i) => (
                    <button key={v} type="button" className="chip" aria-pressed={trVar === i} onClick={() => setTrVar(i)}>{v}</button>
                  ))}
                </div>
                <span className="hint">Highlighted line is the span the classifier matched to this intent.</span>
              </div>
              <div className="row" style={{ gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <span className="badge"><span className="dot" />Genesys Cloud · recording</span>
                <span className="badge"><span className="dot" />PII redacted</span>
                <button type="button" className="btn btn-sm" id="tr-play" onClick={() => toast('Recording playback is stubbed in this demo', 'info')}><Icon name="play" /><span id="tr-dur">Play 3:41</span></button>
                <button type="button" className="btn btn-sm" onClick={() => toast('Transcript exported as call-98231.txt', 'download')}><Icon name="download" />Download .txt</button>
              </div>
              <div id="tr-thread">
                {thread.map((l, i) => (
                  <div key={i} className={`tr-line${l[0] === 'Customer' ? ' cust' : ''}${i === 1 ? ' hit' : ''}`}>
                    <div className="sp">{l[0]}</div>
                    <div>{l[1]}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="drawer-f">
              <CloseButton className="btn">Close</CloseButton>
              <button type="button" className="btn btn-primary" id="tr-confirm" data-od-id="tr-confirm" onClick={() => { close(); toast('Intent match confirmed — evidence attached to the taxonomy', 'check'); }}>Confirm intent match</button>
            </div>
          </>
        )}
      </Drawer>
    </AppShell>
  );
}
