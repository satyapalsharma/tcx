'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link } from '../lib/navigation';
import { AppShell } from '../components/AppShell';
import { ClusterMapSvg } from '../components/ClusterMapSvg';
import { Icon } from '../components/Icon';
import { CloseButton, Dialog, Drawer, OpenButton, useOverlay } from '../components/Overlay';
import { ChipGroup } from '../components/ui';
import { Switch } from '@/components/ui/switch';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';
import { KpiCard, PageHeader, StatusBadge, EmptyState } from '@/components/common';
import { Card } from '@/components/ui/card';

type Intent = { name: string; l1: string; vol: string; share: string; conf: string; esc: string; status: string; badge: string };

const INTENTS: Intent[] = [
  { name: 'Charged for a cancelled service line', l1: 'Billing & Payments', vol: '1,842', share: '10.0%', conf: '0.96', esc: '41%', status: 'Canonical', badge: 'bg-success-soft text-success-fg' },
  { name: 'Invoice higher than agreed promo price', l1: 'Billing & Payments', vol: '1,631', share: '8.8%', conf: '0.94', esc: '33%', status: 'Canonical', badge: 'bg-success-soft text-success-fg' },
  { name: 'Internet down — area outage (NOIA)', l1: 'Connectivity & Outages', vol: '1,530', share: '8.3%', conf: '0.97', esc: '22%', status: 'Canonical', badge: 'bg-success-soft text-success-fg' },
  { name: 'Slow speeds at peak hours', l1: 'Connectivity & Outages', vol: '1,118', share: '6.1%', conf: '0.92', esc: '18%', status: 'New · wk26', badge: 'bg-accent-soft text-accent-strong' },
  { name: 'Book new fiber installation slot', l1: 'New Installation', vol: '1,043', share: '5.7%', conf: '0.95', esc: '9%', status: 'Canonical', badge: 'bg-success-soft text-success-fg' },
  { name: 'Port number out to another provider', l1: 'Cancellation & Port-out', vol: '976', share: '5.3%', conf: '0.93', esc: '57%', status: 'New · wk26', badge: 'bg-accent-soft text-accent-strong' },
  { name: 'Auto-pay failed but card is valid', l1: 'Billing & Payments', vol: '892', share: '4.8%', conf: '0.91', esc: '26%', status: 'Canonical', badge: 'bg-success-soft text-success-fg' },
  { name: 'Router returns after plan upgrade', l1: 'Plan Changes', vol: '640', share: '3.5%', conf: '0.89', esc: '12%', status: 'Canonical', badge: 'bg-success-soft text-success-fg' },
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
  const [piiEmbed, setPiiEmbed] = useState(true);
  const [piiIngest, setPiiIngest] = useState(true);
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
      <div key={c.id} className="border-b border-border last:border-b-0" data-od-id={c.id}>
        <div className="flex items-center gap-2 p-2.5 hover:bg-surface-hover/70 transition-colors">
          <Icon name="chev" className="w-3.5 h-3.5 text-muted shrink-0" />
          <strong className="text-xs sm:text-sm font-semibold text-foreground">{name}</strong>
          {'approved' in c && c.approved && (
            <span className="inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-success-soft text-success-fg">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />Approved
            </span>
          )}
          <span className="flex-1" />
          <span className="text-xs font-mono text-muted tabular-nums">{vol}</span>
          <div className="w-24 sm:w-28 h-1.5 bg-surface-inset rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${'approved' in c && c.approved ? 'bg-success' : 'bg-accent-strong'}`} style={{ width: `${pctW}%` }} />
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
            aria-label="Rename or merge cluster"
            onClick={(e) => { e.stopPropagation(); openClusterDlg(c.id, name); }}
          >
            <Icon name="edit" className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <AppShell
      crumb="Analysis"
      badge={
        <StatusBadge status="warn" pulse className="mr-2">
          RUN-4821 · {pct}% · ETA 14 min
        </StatusBadge>
      }
    >
      <div className="p-4 sm:p-6 lg:p-7 max-w-[1240px] mx-auto w-full pb-16" data-od-id="analysis-page">
        <PageHeader
          title="Analysis"
          description="Customer interactions flow in from connectors, intents get extracted, then clustered into L1 → L2 → L3. Approve clusters to unblock the Design team."
          dataOdId="page-title"
          actions={
            <>
              <OpenButton
                className="inline-flex items-center justify-center gap-2 h-9 px-3.5 bg-surface hover:bg-surface-hover border border-border text-foreground text-xs sm:text-sm font-medium rounded-md shadow-xs transition-colors cursor-pointer"
                target="dlg-upload"
                data-od-id="upload-btn"
              >
                <Icon name="upload" className="w-4 h-4 text-muted" />Upload data
              </OpenButton>
              <OpenButton
                className="inline-flex items-center justify-center gap-2 h-9 px-3.5 bg-accent-strong hover:bg-accent-hover active:bg-accent-active text-white text-xs sm:text-sm font-medium rounded-md shadow-xs transition-colors cursor-pointer"
                target="dlg-run"
                data-od-id="run-btn"
              >
                <Icon name="play" className="w-4 h-4" />Run pipeline
              </OpenButton>
            </>
          }
        />

        {/* Pipeline Stage Bar */}
        <div className="p-3.5 sm:px-5 bg-surface border border-border rounded-xl shadow-xs mb-4.5 overflow-x-auto" data-od-id="stage-strip">
          <div className="flex items-center justify-between min-w-[580px] gap-2">
            <span className="inline-flex items-center gap-1.5 h-6.5 px-3 text-xs font-medium rounded-full bg-success-soft text-success-fg shrink-0">
              <span className="w-3.5 h-3.5 rounded-full bg-success text-white grid place-items-center">
                <Icon name="check" style={{ width: 10, height: 10 }} />
              </span>
              Upload &amp; connect
            </span>
            <span className="flex-1 h-px bg-border min-w-4" />
            <span className="inline-flex items-center gap-1.5 h-6.5 px-3 text-xs font-medium rounded-full bg-success-soft text-success-fg shrink-0">
              <span className="w-3.5 h-3.5 rounded-full bg-success text-white grid place-items-center">
                <Icon name="check" style={{ width: 10, height: 10 }} />
              </span>
              Intent extraction
            </span>
            <span className="flex-1 h-px bg-border min-w-4" />
            <span className="inline-flex items-center gap-1.5 h-6.5 px-3 text-xs font-semibold rounded-full border border-foreground text-foreground bg-surface shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse" />
              Clustering
            </span>
            <span className="flex-1 h-px bg-border min-w-4" />
            <span className={`inline-flex items-center gap-1.5 h-6.5 px-3 text-xs font-medium rounded-full border shrink-0 ${
              reviewStageLive ? 'border-foreground text-foreground bg-surface font-semibold' : 'border-border text-muted bg-surface'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Review &amp; approve
            </span>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-4.5" data-od-id="kpi-row">
          <KpiCard
            label="Records in dataset"
            value="18,442"
            description="3 sources · updated 12 min ago"
            dataOdId="kpi-records"
          />
          <KpiCard
            label="Canonical intents"
            value="286"
            description="3,214 raw → deduped"
            dataOdId="kpi-intents"
          />
          <KpiCard
            label="Cluster coverage"
            value="94.6%"
            description="of volume assigned to a cluster"
            dataOdId="kpi-coverage"
          />
          <KpiCard
            label="Escalation-flagged"
            value="1,244"
            description="6.7% of all interactions"
            dataOdId="kpi-escalation"
          />
        </div>

        {/* Work Area Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_330px] gap-4 items-start">
          <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden" data-tab-scope data-od-id="work-area">
            <div className="flex items-center gap-1 border-b border-border px-3 bg-surface overflow-x-auto scrollbar-none" data-tabs>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'intents'}
                data-tab="intents"
                data-od-id="tab-intents"
                onClick={() => setTab('intents')}
                className={`h-9 px-3.5 text-xs sm:text-[13px] font-medium border-b-2 -mb-px flex items-center gap-2 transition-colors cursor-pointer ${
                  tab === 'intents' ? 'border-foreground text-foreground font-semibold' : 'border-transparent text-muted hover:text-foreground'
                }`}
              >
                Intents <span className="ml-1 px-1.5 py-0.5 rounded-full bg-surface-inset text-[11px] font-mono text-muted">286</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'clusters'}
                data-tab="clusters"
                data-od-id="tab-clusters"
                onClick={() => setTab('clusters')}
                className={`h-9 px-3.5 text-xs sm:text-[13px] font-medium border-b-2 -mb-px flex items-center gap-2 transition-colors cursor-pointer ${
                  tab === 'clusters' ? 'border-foreground text-foreground font-semibold' : 'border-transparent text-muted hover:text-foreground'
                }`}
              >
                Clusters <span className="ml-1 px-1.5 py-0.5 rounded-full bg-surface-inset text-[11px] font-mono text-muted">6 L1</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'review'}
                data-tab="review"
                data-od-id="tab-review"
                onClick={() => setTab('review')}
                className={`h-9 px-3.5 text-xs sm:text-[13px] font-medium border-b-2 -mb-px flex items-center gap-2 transition-colors cursor-pointer ${
                  tab === 'review' ? 'border-foreground text-foreground font-semibold' : 'border-transparent text-muted hover:text-foreground'
                }`}
              >
                Review queue <span className="ml-1 px-1.5 py-0.5 rounded-full bg-surface-inset text-[11px] font-mono text-muted">3</span>
              </button>
            </div>

            {tab === 'intents' && (
              <div data-panel="intents" data-od-id="panel-intents">
                <div className="p-3 sm:px-4 border-b border-border/70 flex flex-wrap items-center gap-2.5">
                  <div className="relative flex-1 min-w-[180px]">
                    <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
                    <input
                      className="h-8 pl-8 pr-3 w-full bg-surface-inset border border-border rounded-md text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                      placeholder="Search intents"
                      aria-label="Search intents"
                      value={intentSearch}
                      onChange={(e) => setIntentSearch(e.target.value)}
                    />
                  </div>
                  <select
                    className="h-8 px-2.5 bg-surface-inset border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                    value={confFilter}
                    onChange={(e) => setConfFilter(e.target.value)}
                  >
                    <option value="all">All confidence</option>
                    <option value="high">High (≥ 0.9)</option>
                    <option value="mid">Medium</option>
                    <option value="low">Low (&lt; 0.7)</option>
                  </select>
                  <span className="text-xs text-muted whitespace-nowrap pl-1">
                    <span id="intent-count" className="font-semibold text-foreground">{filteredIntents.length}</span> shown · click row for transcripts
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse min-w-[720px]" id="intent-table">
                    <thead className="bg-surface border-b border-border">
                      <tr className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                        <th className="px-4 py-2.5">Intent</th>
                        <th className="px-4 py-2.5">L1 cluster</th>
                        <th className="px-4 py-2.5 text-right">Volume</th>
                        <th className="px-4 py-2.5 text-right">Share</th>
                        <th className="px-4 py-2.5 text-right">Conf.</th>
                        <th className="px-4 py-2.5 text-right">Escalation</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-3 py-2.5 w-10 text-right" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredIntents.map((i) => (
                        <tr
                          key={i.name}
                          data-filter-row
                          className="hover:bg-surface-hover/70 transition-colors cursor-pointer group"
                          onClick={() => openTranscript(i)}
                        >
                          <td className="px-4 py-3 font-medium text-xs sm:text-sm text-foreground">{i.name}</td>
                          <td className="px-4 py-3 text-xs sm:text-sm text-muted">{i.l1}</td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-foreground">{i.vol}</td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-foreground">{i.share}</td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-foreground">{i.conf}</td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-foreground">{i.esc}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full ${i.badge}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />{i.status}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                              aria-label="View transcripts"
                              onClick={(e) => { e.stopPropagation(); openTranscript(i); }}
                            >
                              <Icon name="eye" className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredIntents.length === 0 && (
                  <div className="p-12 text-center text-muted text-xs sm:text-sm flex flex-col items-center justify-center gap-2" id="intent-empty" data-od-id="intent-empty">
                    <Icon name="filter" className="w-6 h-6 text-muted mb-1" />
                    <span>No intents match this search.</span>
                  </div>
                )}
              </div>
            )}

            {tab === 'clusters' && (
              <div data-panel="clusters" data-od-id="panel-clusters">
                <div className="p-3.5 sm:px-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-muted max-w-[480px]">
                    L1 → L2 → L3. Open a cluster to inspect breakdowns, rename or merge it, then approve the handoff to Design.
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex p-0.5 bg-surface-inset border border-border rounded-lg gap-0.5" data-od-id="cluster-view-toggle">
                      <button
                        type="button"
                        className={`h-6.5 px-2.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                          clusterView === 'tree' ? 'bg-surface text-foreground shadow-xs font-semibold' : 'text-muted hover:text-foreground'
                        }`}
                        onClick={() => setClusterView('tree')}
                      >
                        Tree
                      </button>
                      <button
                        type="button"
                        className={`h-6.5 px-2.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                          clusterView === 'map' ? 'bg-surface text-foreground shadow-xs font-semibold' : 'text-muted hover:text-foreground'
                        }`}
                        onClick={() => setClusterView('map')}
                      >
                        Cluster map
                      </button>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer"
                      id="new-cluster"
                      data-od-id="new-cluster-btn"
                      onClick={() => openClusterDlg(null)}
                    >
                      <Icon name="plus" className="w-3.5 h-3.5" />New cluster
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-accent-strong hover:bg-accent-hover active:bg-accent-active text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
                      id="approve-design"
                      data-od-id="approve-clusters-btn"
                      onClick={() => { toast('4 clusters locked & shared with Design umbrella', 'check'); setReviewStageLive(true); }}
                    >
                      <Icon name="check" className="w-3.5 h-3.5" />Approve clusters
                    </button>
                  </div>
                </div>

                <div className="m-3 p-3 bg-surface-inset border border-border rounded-lg flex items-start gap-2.5 text-xs" data-od-id="cluster-threshold">
                  <Icon name="info" className="w-4 h-4 text-muted mt-0.5 shrink-0" />
                  <div className="flex-1 leading-relaxed">
                    <strong>Auto-clustering runs at ≥50 canonical intents.</strong> This run extracted 286 → clustering ran and produced 6 L1 clusters.
                  </div>
                  <span className="inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-success-soft text-success-fg shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />Eligible · 286
                  </span>
                </div>

                {clusterView === 'tree' && (
                  <div className="p-3 divide-y divide-border">
                    {!hiddenClusters.has('cluster-billing') && (
                      <div className="rounded-lg overflow-hidden border border-border/60 mb-2" data-od-id="cluster-billing">
                        <div
                          className="flex items-center gap-2 p-2.5 bg-surface hover:bg-surface-hover transition-colors cursor-pointer"
                          onClick={() => setBillingOpen(!billingOpen)}
                        >
                          <Icon name="chev" className={`w-3.5 h-3.5 text-muted transition-transform ${billingOpen ? 'rotate-180' : ''}`} />
                          <strong className="text-xs sm:text-sm font-semibold text-foreground">
                            {clusterNames['cluster-billing'] ?? 'Billing & Payments'}
                          </strong>
                          <span className="inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-success-soft text-success-fg">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" />Approved
                          </span>
                          <span className="flex-1" />
                          <span className="text-xs font-mono text-muted tabular-nums">7,045 · 38.2%</span>
                          <div className="w-24 sm:w-28 h-1.5 bg-surface-inset rounded-full overflow-hidden">
                            <div className="h-full bg-success rounded-full" style={{ width: '38.2%' }} />
                          </div>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                            aria-label="Rename or merge cluster"
                            onClick={(e) => { e.stopPropagation(); openClusterDlg('cluster-billing'); }}
                          >
                            <Icon name="edit" className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {billingOpen && (
                          <div className="p-2.5 bg-surface-inset/50 space-y-2 border-t border-border">
                            <div className="rounded-md border border-border bg-surface p-2">
                              <div
                                className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer"
                                onClick={() => setInvoiceOpen(!invoiceOpen)}
                              >
                                <Icon name="chev" className={`w-3.5 h-3.5 text-muted transition-transform ${invoiceOpen ? 'rotate-180' : ''}`} />
                                <span>Invoice Disputes</span>
                                <span className="ml-auto font-mono text-muted">2,847</span>
                              </div>
                              {invoiceOpen && (
                                <div className="mt-2 pl-5 space-y-1.5 border-t border-border/60 pt-2 text-xs text-muted">
                                  <div className="flex items-center gap-2">
                                    <Icon name="dot" className="w-3 h-3 text-muted shrink-0" />
                                    <span>Charged for cancelled service line · <span className="font-mono">1,842 calls</span></span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Icon name="dot" className="w-3 h-3 text-muted shrink-0" />
                                    <span>Promotional credit missing · <span className="font-mono">641 calls</span></span>
                                  </div>
                                </div>
                              )}
                            </div>
                            {['Late fees & credits', 'Auto-pay failures', 'Refunds & reversals'].map((label, idx) => (
                              <div key={label} className="flex items-center gap-2 p-2 rounded-md border border-border bg-surface text-xs font-medium text-foreground">
                                <Icon name="chev" className="w-3.5 h-3.5 text-muted" />
                                <span>{label}</span>
                                <span className="ml-auto font-mono text-muted">{['1,206', '1,033', '958'][idx]}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {!hiddenClusters.has('cluster-connectivity') && (
                      <div className="rounded-lg overflow-hidden border border-border/60 mb-2" data-od-id="cluster-connectivity">
                        <div className="flex items-center gap-2 p-2.5 bg-surface hover:bg-surface-hover transition-colors">
                          <Icon name="chev" className="w-3.5 h-3.5 text-muted" />
                          <strong className="text-xs sm:text-sm font-semibold text-foreground">
                            {clusterNames['cluster-connectivity'] ?? 'Connectivity & Outages'}
                          </strong>
                          <span className="flex-1" />
                          <span className="text-xs font-mono text-muted tabular-nums">4,445 · 24.1%</span>
                          <div className="w-24 sm:w-28 h-1.5 bg-surface-inset rounded-full overflow-hidden">
                            <div className="h-full bg-accent-strong rounded-full" style={{ width: '24.1%' }} />
                          </div>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                            aria-label="Rename or merge cluster"
                            onClick={(e) => { e.stopPropagation(); openClusterDlg('cluster-connectivity'); }}
                          >
                            <Icon name="edit" className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                    {L1_CLUSTERS.filter((c) => !['cluster-billing', 'cluster-connectivity'].includes(c.id)).map(renderClusterRow)}
                    {extraClusters.map(renderClusterRow)}
                  </div>
                )}

                {clusterView === 'map' && (
                  <div className="p-4 overflow-x-auto scrollbar-none" data-od-id="cluster-map">
                    <ClusterMapSvg />
                    <p className="text-xs text-muted mt-3">
                      Hub = 286 canonical intents. Node width and the filled bar show each L1 cluster&apos;s share of labelled volume; L2 / L3 counts sit inside each node.
                    </p>
                  </div>
                )}
              </div>
            )}

            {tab === 'review' && (
              <div className="divide-y divide-border" data-panel="review" data-od-id="panel-review">
                <div className="p-4 text-xs text-muted bg-surface-inset/40">
                  Low-confidence extractions that need an analyst decision before they enter the taxonomy.
                </div>
                {REVIEW_ITEMS.map((rv) => (
                  <div key={rv.id} className={`p-4 transition-opacity ${reviewResolved[rv.id] ? 'opacity-55' : ''}`} data-rv data-od-id={rv.id}>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <strong className="text-xs sm:text-sm font-semibold text-foreground">{rv.title}</strong>
                      <span className="inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-surface-inset text-foreground border border-border">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted" />{rv.records}
                      </span>
                      <span className="flex-1" />
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-surface-inset rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${parseFloat(rv.conf) < 0.75 ? 'bg-warn' : 'bg-success'}`}
                            style={{ width: `${parseFloat(rv.conf) * 100}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-muted">{rv.conf}</span>
                      </div>
                    </div>
                    <p className="border-l-2 border-border pl-3 my-2 text-xs italic text-muted leading-relaxed">
                      {rv.quote}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      {reviewResolved[rv.id] ? (
                        <span className="inline-flex items-center gap-1.5 h-5.5 px-2 text-xs font-medium rounded-full bg-success-soft text-success-fg">
                          <span className="w-1.5 h-1.5 rounded-full bg-success" />{reviewResolved[rv.id]}
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center h-7 px-2.5 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer"
                            data-rv-act="new"
                            onClick={() => reviewAction(rv.id, 'new')}
                          >
                            Accept as new
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center h-7 px-2.5 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer"
                            data-rv-act="merge"
                            onClick={() => reviewAction(rv.id, 'merge')}
                          >
                            {rv.merge}
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center h-7 px-2.5 rounded-md bg-danger-soft hover:bg-danger-soft/80 border border-danger/30 text-danger-fg text-xs font-medium transition-colors cursor-pointer"
                            data-rv-act="reject"
                            onClick={() => reviewAction(rv.id, 'reject')}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Rail */}
          <div className="space-y-4 min-w-0">
            {/* Live Run Card */}
            <div className="p-4 bg-surface border border-border rounded-xl shadow-xs space-y-3" data-od-id="live-run-card">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Live run</h3>
                  <span className={`inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full ${
                    paused ? 'bg-surface-inset text-foreground' : 'bg-warn-soft text-warn-fg'
                  }`} id="run-badge">
                    <span className={`w-1.5 h-1.5 rounded-full ${paused ? 'bg-muted' : 'bg-warn animate-pulse'}`} />
                    {paused ? 'Paused' : 'RUN-4821'}
                  </span>
                </div>
                <button
                  type="button"
                  className="h-7 px-2.5 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer"
                  id="run-toggle"
                  onClick={() => setPaused(!paused)}
                >
                  {paused ? 'Resume' : 'Pause'}
                </button>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-medium text-foreground">
                  <span>Week-26 clustering refresh</span>
                  <span className="font-mono text-muted" id="run-pct">{pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-surface-inset rounded-full overflow-hidden my-2">
                  <div className="h-full bg-accent-strong rounded-full transition-all duration-300" id="run-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[11.5px] text-muted" id="run-eta">ETA ~14 min · new wave of records only</div>
              </div>

              <div className="border-t border-border pt-3 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-success-soft text-success grid place-items-center shrink-0">
                    <Icon name="check" style={{ width: 10, height: 10 }} />
                  </span>
                  <span className="text-foreground">Ingestion</span>
                  <span className="ml-auto font-mono text-muted text-[11px]">18,442 rows</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-success-soft text-success grid place-items-center shrink-0">
                    <Icon name="check" style={{ width: 10, height: 10 }} />
                  </span>
                  <span className="text-foreground">PII redaction</span>
                  <span className="ml-auto font-mono text-muted text-[11px]">3,104 masked</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-success-soft text-success grid place-items-center shrink-0">
                    <Icon name="check" style={{ width: 10, height: 10 }} />
                  </span>
                  <span className="text-foreground">Embedding</span>
                  <span className="ml-auto font-mono text-muted text-[11px]">768-dim</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-accent-soft text-accent-strong grid place-items-center shrink-0 animate-spin">
                    <Icon name="sync" style={{ width: 10, height: 10 }} />
                  </span>
                  <span className="text-foreground font-medium">Clustering</span>
                  <span className="ml-auto font-mono text-muted text-[11px]">{pct}% done</span>
                </div>
                <div className="flex items-center gap-2 opacity-50">
                  <span className="w-4 h-4 rounded-full bg-surface-inset text-muted grid place-items-center shrink-0">
                    <Icon name="dot" style={{ width: 10, height: 10 }} />
                  </span>
                  <span className="text-muted">Coverage report</span>
                  <span className="ml-auto text-[11px] text-muted">queued</span>
                </div>
              </div>
            </div>

            {/* Sources Card */}
            <div className="p-4 bg-surface border border-border rounded-xl shadow-xs space-y-3" data-od-id="sources-card">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Sources</h3>
                <Link className="text-xs text-accent-strong hover:underline font-medium" to="/connectors">Manage</Link>
              </div>
              <div className="divide-y divide-border">
                <div className="flex items-center gap-2.5 py-2">
                  <span className="inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-success-soft text-success-fg shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />Live
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">Genesys Cloud — calls</div>
                    <div className="text-[11px] text-muted truncate">4,812 transcripts · 12 min ago</div>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                    title="Download as .xlsx"
                    onClick={() => toast('genesys-calls-w26.xlsx downloading', 'download')}
                  >
                    <Icon name="download" className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2.5 py-2">
                  <span className="inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-success-soft text-success-fg shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />Live
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">Zendesk — conversations</div>
                    <div className="text-[11px] text-muted truncate">9,205 threads · 38 min ago</div>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                    title="Download as .xlsx"
                    onClick={() => toast('zendesk-threads-w26.xlsx downloading', 'download')}
                  >
                    <Icon name="download" className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2.5 py-2">
                  <span className="inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-warn-soft text-warn-fg shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-warn" />Re-auth
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">CSV — CRM notes batch</div>
                    <div className="text-[11px] text-muted truncate">4,425 rows · manual upload</div>
                  </div>
                  <OpenButton className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer" target="dlg-upload" title="Re-upload">
                    <Icon name="upload" className="w-3.5 h-3.5" />
                  </OpenButton>
                </div>
              </div>
            </div>

            {/* Advanced Settings Disclosure */}
            <details className="border border-border rounded-xl bg-surface group" data-od-id="adv-settings">
              <summary className="flex items-center gap-2 p-3.5 text-xs font-semibold text-muted hover:text-foreground cursor-pointer select-none">
                <Icon name="gear" className="w-3.5 h-3.5 text-muted" />
                <span>Advanced pipeline settings</span>
                <Icon name="chev" className="w-3.5 h-3.5 ml-auto text-muted group-open:rotate-180 transition-transform" />
              </summary>
              <div className="p-3.5 border-t border-border space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground tracking-wide mb-1" htmlFor="adv-model">Extraction model</label>
                  <select className="w-full h-8 px-2.5 bg-surface-inset border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-accent" id="adv-model">
                    <option>tx-intent-v3.2 (recommended)</option>
                    <option>tx-intent-v3.1 — pinned</option>
                    <option>claude-sonnet — sandbox</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground tracking-wide mb-1" htmlFor="adv-conf">Min. clustering confidence</label>
                  <input className="w-full h-8 px-2.5 bg-surface-inset border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-accent" id="adv-conf" defaultValue="0.72" inputMode="decimal" />
                  <span className="text-[11px] text-muted mt-0.5 block">Records below this go to review queue.</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-foreground tracking-wide mb-1">Languages</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" className={`h-6 px-2 text-xs font-medium rounded-full border transition-colors ${langChips.en ? 'bg-foreground text-surface border-foreground' : 'bg-surface border-border text-muted'}`} onClick={() => setLangChips((p) => ({ ...p, en: !p.en }))}>English</button>
                    <button type="button" className={`h-6 px-2 text-xs font-medium rounded-full border transition-colors ${langChips.hi ? 'bg-foreground text-surface border-foreground' : 'bg-surface border-border text-muted'}`} onClick={() => setLangChips((p) => ({ ...p, hi: !p.hi }))}>Hindi · transliterated</button>
                    <button type="button" className={`h-6 px-2 text-xs font-medium rounded-full border transition-colors ${langChips.reg ? 'bg-foreground text-surface border-foreground' : 'bg-surface border-border text-muted'}`} onClick={() => setLangChips((p) => ({ ...p, reg: !p.reg }))}>Regional mixed</button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="text-xs font-semibold text-foreground">PII redaction before embedding</div>
                    <div className="text-[11px] text-muted">Numbers, IDs and addresses masked.</div>
                  </div>
                  <Switch checked={piiEmbed} onCheckedChange={setPiiEmbed} aria-label="PII redaction before embedding" />
                </div>
                <button
                  type="button"
                  className="h-7.5 px-3 rounded-md bg-surface hover:bg-surface-hover border border-border text-xs font-medium text-foreground transition-colors cursor-pointer"
                  onClick={() => toast('Advanced settings saved for next run', 'gear')}
                >
                  Save for next run
                </button>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog id="dlg-upload" dataOdId="upload-dialog">
        <div className="p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground tracking-tight">Upload interaction data</h2>
          <p className="text-xs text-muted mt-1">Files land in a staging bucket, get PII-redacted, then join the next pipeline run.</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <span className="block text-xs font-semibold text-foreground tracking-wide mb-1.5">Where is the data?</span>
            <ChipGroup
              value={uploadSrc}
              onChange={setUploadSrc}
              swapPrefix="upsrc"
              options={[
                { val: 'local', label: 'Upload files' },
                { val: 's3', label: 'Amazon S3' },
                { val: 'gcs', label: 'Google Cloud Storage' },
              ]}
            />
          </div>

          {uploadSrc === 'local' && (
            <div data-swap-panel="upsrc-local" data-od-id="upload-local">
              <div
                className={`border-2 border-dashed rounded-xl p-7 text-center transition-all ${
                  dropOver ? 'border-accent-strong bg-accent-soft text-foreground' : 'border-border text-muted hover:border-muted'
                }`}
                id="drop-zone"
                data-od-id="drop-zone"
                onDragOver={(e) => { e.preventDefault(); setDropOver(true); }}
                onDragEnter={(e) => { e.preventDefault(); setDropOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDropOver(false); }}
                onDrop={(e) => { e.preventDefault(); setDropOver(false); setDropText('genesys_Aug_w26.jsonl staged — 4,120 rows detected'); }}
              >
                <Icon name="upload" className="w-8 h-8 mx-auto text-muted mb-2" />
                <div className="text-xs sm:text-sm font-medium text-foreground">
                  {dropText ?? (
                    <>Drop exports here, or <button type="button" className="text-accent-strong hover:underline font-semibold" id="browse-btn" onClick={() => toast('File picker is stubbed in this demo', 'info')}>browse files</button></>
                  )}
                </div>
                <div className="text-xs text-muted mt-1">CSV · JSON · JSONL · PDF · DOC · DOCX · WAV/MP3 — up to 2 GB per file</div>
              </div>
            </div>
          )}

          {uploadSrc === 's3' && (
            <div className="space-y-3" data-swap-panel="upsrc-s3" data-od-id="upload-s3">
              <div>
                <label className="block text-xs font-semibold text-foreground tracking-wide mb-1" htmlFor="up-s3-bucket">Bucket</label>
                <select className="w-full h-8 px-2.5 bg-surface border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-accent" id="up-s3-bucket">
                  <option>s3://skyline-cx-exports (ap-south-1)</option>
                  <option>s3://skyline-genesys-recordings (ap-south-1)</option>
                  <option>s3://skyline-nuance-sops (us-east-1)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground tracking-wide mb-1" htmlFor="up-s3-prefix">Prefix</label>
                <input className="w-full h-8 px-2.5 bg-surface border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-accent" id="up-s3-prefix" defaultValue="zendesk/2026-w26/" />
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="h-7.5 px-3 rounded-md bg-surface hover:bg-surface-hover border border-border text-xs font-medium text-foreground transition-colors cursor-pointer" id="up-s3-scan" onClick={() => scanBucket('s3', 's3://skyline-cx-exports (ap-south-1)')}>
                  <Icon name="sync" className="w-3.5 h-3.5 inline mr-1" />Scan bucket
                </button>
                <span className="text-[11px] text-muted">Read-only via IAM role attached on Connectors.</span>
              </div>
              <div className="text-xs text-muted p-2 bg-surface-inset rounded-md" id="up-s3-result" dangerouslySetInnerHTML={{ __html: s3Result }} />
            </div>
          )}

          {uploadSrc === 'gcs' && (
            <div className="space-y-3" data-swap-panel="upsrc-gcs" data-od-id="upload-gcs">
              <div>
                <label className="block text-xs font-semibold text-foreground tracking-wide mb-1" htmlFor="up-gcs-bucket">Bucket</label>
                <select className="w-full h-8 px-2.5 bg-surface border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-accent" id="up-gcs-bucket">
                  <option>gs://skyline-cx-archive (asia-south1)</option>
                  <option>gs://skyline-nuance-docs (asia-south1)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground tracking-wide mb-1" htmlFor="up-gcs-prefix">Folder prefix</label>
                <input className="w-full h-8 px-2.5 bg-surface border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-accent" id="up-gcs-prefix" defaultValue="cx/sops/2026/" />
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="h-7.5 px-3 rounded-md bg-surface hover:bg-surface-hover border border-border text-xs font-medium text-foreground transition-colors cursor-pointer" id="up-gcs-scan" onClick={() => scanBucket('gcs', 'gs://skyline-cx-archive (asia-south1)')}>
                  <Icon name="sync" className="w-3.5 h-3.5 inline mr-1" />Scan bucket
                </button>
                <span className="text-[11px] text-muted">Uses service account with objectViewer on bucket.</span>
              </div>
              <div className="text-xs text-muted p-2 bg-surface-inset rounded-md" id="up-gcs-result" dangerouslySetInnerHTML={{ __html: gcsResult }} />
            </div>
          )}

          <div>
            <span className="block text-xs font-semibold text-foreground tracking-wide mb-1">
              Nuance document flow <span className="text-muted font-normal">· PDF / DOC / DOCX only</span>
            </span>
            <ChipGroup
              value={nuance}
              onChange={setNuance}
              options={[
                { val: 'synth', label: 'Synthetic calls' },
                { val: 'doc', label: 'Document process' },
              ]}
            />
            <span className="text-[11px] text-muted mt-1 block leading-relaxed" id="nuance-hint">
              {nuance === 'synth' ? 'Synthetic calls: convert SOPs and policy docs into representative call audio, then run the normal intent pipeline over them.' : 'Document process: extract the process steps straight from the SOPs — no call audio and clustering is skipped.'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-surface-inset">
            <div>
              <div className="text-xs font-semibold text-foreground">Redact PII on ingest</div>
              <div className="text-[11px] text-muted">Recommended for calls with card numbers.</div>
            </div>
            <Switch checked={piiIngest} onCheckedChange={setPiiIngest} aria-label="Redact PII on ingest" />
          </div>
        </div>
        <div className="p-4 border-t border-border bg-surface-inset/40 flex items-center justify-end gap-2.5 rounded-b-xl">
          <CloseButton className="inline-flex items-center justify-center px-3.5 h-8.5 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer">
            Cancel
          </CloseButton>
          <button
            type="button"
            className="inline-flex items-center justify-center px-3.5 h-8.5 rounded-md bg-accent-strong hover:bg-accent-hover active:bg-accent-active text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
            id="upload-confirm"
            data-od-id="upload-confirm"
            onClick={() => { close(); toast('1 file added to staging — joins the next run', 'upload'); }}
          >
            Add to staging
          </button>
        </div>
      </Dialog>

      {/* Run Pipeline Dialog */}
      <Dialog id="dlg-run" dataOdId="run-dialog">
        <div className="p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground tracking-tight">Run pipeline</h2>
          <p className="text-xs text-muted mt-1">Long-running — you&apos;ll get live progress in this panel and in the top bar.</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <span className="block text-xs font-semibold text-foreground tracking-wide mb-1.5">Scope</span>
            <div className="flex items-center gap-2" data-chips data-od-id="run-scope">
              <button type="button" className="h-6.5 px-3 rounded-full bg-foreground text-surface text-xs font-semibold">New records only</button>
              <button type="button" className="h-6.5 px-3 rounded-full border border-border bg-surface text-muted text-xs hover:text-foreground">Full re-cluster</button>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-surface-inset">
            <div>
              <div className="text-xs font-semibold text-foreground">Express mode</div>
              <div className="text-[11px] text-muted">Runs intent extraction → clustering → process map → UML end-to-end with no manual review gates.</div>
            </div>
            <Switch checked={express} onCheckedChange={setExpress} aria-label="Express mode" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5" htmlFor="run-note">Run note (shows in audit log)</label>
            <input className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs sm:text-sm text-foreground focus:outline-none focus:border-accent" id="run-note" placeholder="e.g. Week-27 refresh after retention campaign" />
          </div>
        </div>
        <div className="p-4 border-t border-border bg-surface-inset/40 flex items-center justify-end gap-2.5 rounded-b-xl">
          <CloseButton className="inline-flex items-center justify-center px-3.5 h-8.5 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer">
            Cancel
          </CloseButton>
          <button
            type="button"
            className="inline-flex items-center justify-center px-3.5 h-8.5 rounded-md bg-accent-strong hover:bg-accent-hover active:bg-accent-active text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
            id="run-confirm"
            data-od-id="run-confirm"
            onClick={() => { close(); toast(express ? 'Express run queued — full pipeline completes without manual gates' : 'RUN-4822 queued behind RUN-4821', 'play'); }}
          >
            Start run
          </button>
        </div>
      </Dialog>

      {/* Cluster Rename/Merge Dialog */}
      <Dialog id="dlg-cluster" dataOdId="cluster-dialog">
        <div className="p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground tracking-tight" id="cl-title">{clTitle}</h2>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            Renaming keeps the cluster ID stable. Merging folds volume and L2 / L3 nodes into the target, then archives this cluster.
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5" htmlFor="cl-name">Cluster name</label>
            <input className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs sm:text-sm text-foreground focus:outline-none focus:border-accent" id="cl-name" placeholder="e.g. Billing & Payments" value={clName} onChange={(e) => setClName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5" htmlFor="cl-level">Level</label>
            <select className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs sm:text-sm text-foreground focus:outline-none focus:border-accent" id="cl-level">
              <option>L1 · top-level cluster</option>
              <option>L2 · sub-cluster</option>
              <option>L3 · leaf node</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5" htmlFor="cl-merge">Merge into (optional)</label>
            <select className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs sm:text-sm text-foreground focus:outline-none focus:border-accent" id="cl-merge" value={clMerge} onChange={(e) => setClMerge(e.target.value)}>
              <option value="">— Don&apos;t merge —</option>
              <option>Connectivity & Outages</option>
              <option>New Installation & Provisioning</option>
              <option>Plan Changes & Upgrades</option>
              <option>Cancellation & Port-out</option>
              <option>Account & Identity</option>
            </select>
            <span className="text-[11px] text-muted mt-1 block">All L3 nodes and their volume move to the target cluster.</span>
          </div>
        </div>
        <div className="p-4 border-t border-border bg-surface-inset/40 flex items-center justify-between gap-2.5 rounded-b-xl">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 px-3 h-8.5 rounded-md bg-danger-soft hover:bg-danger-soft/80 border border-danger/30 text-danger-fg text-xs font-medium transition-colors cursor-pointer"
            id="cl-delete"
            data-od-id="cluster-delete"
            onClick={() => { close(); if (clTarget) setHiddenClusters((prev) => new Set(prev).add(clTarget)); toast('Cluster archived — moved to the review queue', 'trash'); }}
          >
            <Icon name="trash" className="w-3.5 h-3.5" />Delete
          </button>
          <div className="flex items-center gap-2">
            <CloseButton className="inline-flex items-center justify-center px-3.5 h-8.5 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer">
              Cancel
            </CloseButton>
            <button
              type="button"
              className="inline-flex items-center justify-center px-3.5 h-8.5 rounded-md bg-accent-strong hover:bg-accent-hover active:bg-accent-active text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
              id="cl-save"
              data-od-id="cluster-save"
              onClick={saveCluster}
            >
              Save cluster
            </button>
          </div>
        </div>
      </Dialog>

      {/* Transcript Drawer */}
      <Drawer id="dw-transcript" dataOdId="transcript-drawer">
        {transcript && (
          <>
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-muted">Intent · transcript evidence</div>
                <div id="tr-title" className="text-sm sm:text-base font-bold text-foreground tracking-tight mt-0.5">&ldquo;{transcript.name}&rdquo;</div>
              </div>
              <CloseButton className="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer" aria-label="Close">
                <Icon name="x" className="w-4 h-4" />
              </CloseButton>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-surface border border-border rounded-lg shadow-xs">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-muted">Matching calls</div>
                  <div className="font-mono text-base font-bold text-foreground mt-1" id="tr-count">{transcript.count}</div>
                </div>
                <div className="p-3 bg-surface border border-border rounded-lg shadow-xs">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-muted">Avg. confidence</div>
                  <div className="font-mono text-base font-bold text-foreground mt-1" id="tr-conf">{transcript.conf}</div>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-foreground tracking-wide mb-1.5">Sample call</span>
                <div className="flex items-center gap-1.5 mb-1.5" id="tr-picker" data-od-id="tr-picker">
                  {['Call 1', 'Call 2', 'Call 3'].map((v, i) => (
                    <button
                      key={v}
                      type="button"
                      className={`h-6.5 px-3 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                        trVar === i ? 'bg-foreground text-surface border-foreground font-semibold' : 'bg-surface border-border text-muted hover:text-foreground'
                      }`}
                      onClick={() => setTrVar(i)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-muted">Highlighted line is the span the classifier matched to this intent.</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-surface-inset border border-border text-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted" />Genesys Cloud · recording
                </span>
                <span className="inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-surface-inset border border-border text-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted" />PII redacted
                </span>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer"
                  id="tr-play"
                  onClick={() => toast('Recording playback is stubbed in this demo', 'info')}
                >
                  <Icon name="play" className="w-3 h-3 text-muted" /><span id="tr-dur">Play 3:41</span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer"
                  onClick={() => toast('Transcript exported as call-98231.txt', 'download')}
                >
                  <Icon name="download" className="w-3 h-3 text-muted" />Download .txt
                </button>
              </div>

              <div id="tr-thread" className="space-y-1.5 pt-2 border-t border-border">
                {thread.map((l, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-[64px_1fr] gap-2.5 p-2 rounded-md text-xs leading-relaxed transition-colors ${
                      i === 1 ? 'bg-warn-soft/80 border-l-2 border-warn font-medium' : 'hover:bg-surface-hover'
                    }`}
                  >
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${l[0] === 'Customer' ? 'text-accent-strong' : 'text-muted'}`}>
                      {l[0]}
                    </div>
                    <div className="text-foreground">{l[1]}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-border bg-surface-inset/40 flex items-center justify-end gap-2.5 rounded-b-xl">
              <CloseButton className="inline-flex items-center justify-center px-3.5 h-8.5 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer">
                Close
              </CloseButton>
              <button
                type="button"
                className="inline-flex items-center justify-center px-3.5 h-8.5 rounded-md bg-accent-strong hover:bg-accent-hover active:bg-accent-active text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
                id="tr-confirm"
                data-od-id="tr-confirm"
                onClick={() => { close(); toast('Intent match confirmed — evidence attached to the taxonomy', 'check'); }}
              >
                Confirm intent match
              </button>
            </div>
          </>
        )}
      </Drawer>
    </AppShell>
  );
}
