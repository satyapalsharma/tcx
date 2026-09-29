'use client';

import { useMemo, useState } from 'react';
import { Link } from '../lib/navigation';
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
  { intent: 'Charged for a cancelled service line', l1: 'Billing & Payments', vol: 1842, conf: 0.96, esc: 41, status: { label: 'Canonical', badge: 'bg-success-soft text-success-fg' } },
  { intent: 'Invoice higher than agreed promo price', l1: 'Billing & Payments', vol: 1631, conf: 0.94, esc: 33, status: { label: 'Canonical', badge: 'bg-success-soft text-success-fg' } },
  { intent: 'Internet down — area outage (NOIA)', l1: 'Connectivity & Outages', vol: 1530, conf: 0.97, esc: 22, status: { label: 'Canonical', badge: 'bg-success-soft text-success-fg' } },
  { intent: 'Slow speeds at peak hours', l1: 'Connectivity & Outages', vol: 1118, conf: 0.92, esc: 18, status: { label: 'New · wk26', badge: 'bg-accent-soft text-accent-strong' } },
  { intent: 'Book new fiber installation slot', l1: 'New Installation', vol: 1043, conf: 0.95, esc: 9, status: { label: 'Canonical', badge: 'bg-success-soft text-success-fg' } },
  { intent: 'Port number out to another provider', l1: 'Cancellation & Port-out', vol: 976, conf: 0.93, esc: 57, status: { label: 'New · wk26', badge: 'bg-accent-soft text-accent-strong' } },
  { intent: 'Auto-pay failed but card is valid', l1: 'Billing & Payments', vol: 892, conf: 0.91, esc: 26, status: { label: 'Canonical', badge: 'bg-success-soft text-success-fg' } },
  { intent: 'Router returns after plan upgrade', l1: 'Plan Changes', vol: 640, conf: 0.89, esc: 12, status: { label: 'Canonical', badge: 'bg-success-soft text-success-fg' } },
  { intent: 'Password reset for MySkyline app', l1: 'Account & Identity', vol: 388, conf: 0.84, esc: 15, status: { label: 'Review', badge: 'bg-surface-inset text-foreground' } },
  { intent: 'Duplicate charge after plan change', l1: 'Cancellation & Port-out', vol: 214, conf: 0.68, esc: 48, status: { label: 'Low confidence', badge: 'bg-warn-soft text-warn-fg' } },
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
    <svg className="min-w-[660px] w-full block" viewBox="0 0 940 430" role="img" aria-label="Cluster map: 286 canonical intents grouped into 6 L1 clusters sized by share of volume">
      <g transform="translate(24,160)">
        <rect width="196" height="96" rx="12" fill="var(--color-fg)" />
        <text x="98" y="40" textAnchor="middle" fontSize="30" fontWeight="640" fill="var(--color-surface)">286</text>
        <text x="98" y="62" textAnchor="middle" fontSize="12" fill="var(--color-surface)">canonical intents</text>
        <text x="98" y="80" textAnchor="middle" fontSize="11" fill="oklch(80% 0.02 250)">6 L1 · 19 L2 · 57 L3</text>
      </g>
      <path d="M220 208 C260 208 260 35 300 35" fill="none" stroke="var(--color-border)" strokeWidth="1.5" />
      <path d="M220 208 C260 208 260 103 300 103" fill="none" stroke="var(--color-border)" strokeWidth="1.5" />
      <path d="M220 208 C260 208 260 171 300 171" fill="none" stroke="var(--color-border)" strokeWidth="1.5" />
      <path d="M220 208 C260 208 260 239 300 239" fill="none" stroke="var(--color-border)" strokeWidth="1.5" />
      <path d="M220 208 C260 208 260 307 300 307" fill="none" stroke="var(--color-border)" strokeWidth="1.5" />
      <path d="M220 208 C260 208 260 375 300 375" fill="none" stroke="var(--color-border)" strokeWidth="1.5" />
      <g transform="translate(300,8)">
        <rect width="616" height="54" rx="10" fill="var(--color-surface)" stroke="var(--color-accent-strong)" strokeWidth="1.5" />
        <text x="16" y="22" fontSize="12.5" fontWeight="580" fill="var(--color-fg)">Billing &amp; Payments</text>
        <text x="296" y="22" fontSize="11" fill="var(--color-muted)">4 L2 · 12 L3</text>
        <text x="600" y="22" textAnchor="end" fontSize="11.5" fill="var(--color-muted)">7,045 · 38.2%</text>
        <rect x="16" y="32" width="584" height="6" rx="3" fill="var(--color-surface-inset)" />
        <rect x="16" y="32" width="584" height="6" rx="3" fill="var(--color-accent-strong)" />
      </g>
      <g transform="translate(300,76)">
        <rect width="616" height="54" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="1" />
        <text x="16" y="22" fontSize="12.5" fontWeight="580" fill="var(--color-fg)">Connectivity &amp; Outages</text>
        <text x="296" y="22" fontSize="11" fill="var(--color-muted)">5 L2 · 18 L3</text>
        <text x="600" y="22" textAnchor="end" fontSize="11.5" fill="var(--color-muted)">4,445 · 24.1%</text>
        <rect x="16" y="32" width="584" height="6" rx="3" fill="var(--color-surface-inset)" />
        <rect x="16" y="32" width="368.5" height="6" rx="3" fill="var(--color-accent-strong)" />
      </g>
      <g transform="translate(300,144)">
        <rect width="616" height="54" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="1" />
        <text x="16" y="22" fontSize="12.5" fontWeight="580" fill="var(--color-fg)">New Installation &amp; Provisioning</text>
        <text x="296" y="22" fontSize="11" fill="var(--color-muted)">3 L2 · 9 L3</text>
        <text x="600" y="22" textAnchor="end" fontSize="11.5" fill="var(--color-muted)">2,545 · 13.8%</text>
        <rect x="16" y="32" width="584" height="6" rx="3" fill="var(--color-surface-inset)" />
        <rect x="16" y="32" width="211" height="6" rx="3" fill="var(--color-accent-strong)" />
      </g>
      <g transform="translate(300,212)">
        <rect width="616" height="54" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="1" />
        <text x="16" y="22" fontSize="12.5" fontWeight="580" fill="var(--color-fg)">Plan Changes &amp; Upgrades</text>
        <text x="296" y="22" fontSize="11" fill="var(--color-muted)">3 L2 · 7 L3</text>
        <text x="600" y="22" textAnchor="end" fontSize="11.5" fill="var(--color-muted)">1,697 · 9.2%</text>
        <rect x="16" y="32" width="584" height="6" rx="3" fill="var(--color-surface-inset)" />
        <rect x="16" y="32" width="140.6" height="6" rx="3" fill="var(--color-accent-strong)" />
      </g>
      <g transform="translate(300,280)">
        <rect width="616" height="54" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="1" />
        <text x="16" y="22" fontSize="12.5" fontWeight="580" fill="var(--color-fg)">Cancellation &amp; Port-out</text>
        <text x="296" y="22" fontSize="11" fill="var(--color-muted)">2 L2 · 6 L3</text>
        <text x="600" y="22" textAnchor="end" fontSize="11.5" fill="var(--color-muted)">1,550 · 8.4%</text>
        <rect x="16" y="32" width="584" height="6" rx="3" fill="var(--color-surface-inset)" />
        <rect x="16" y="32" width="128.4" height="6" rx="3" fill="var(--color-accent-strong)" />
      </g>
      <g transform="translate(300,348)">
        <rect width="616" height="54" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="1" />
        <text x="16" y="22" fontSize="12.5" fontWeight="580" fill="var(--color-fg)">Account &amp; Identity</text>
        <text x="296" y="22" fontSize="11" fill="var(--color-muted)">2 L2 · 5 L3</text>
        <text x="600" y="22" textAnchor="end" fontSize="11.5" fill="var(--color-muted)">1,160 · 6.3%</text>
        <rect x="16" y="32" width="584" height="6" rx="3" fill="var(--color-surface-inset)" />
        <rect x="16" y="32" width="96.3" height="6" rx="3" fill="var(--color-accent-strong)" />
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
    <div data-od-id="panel-d-intents" className="mt-4">
      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">Intent ledger</h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
              <input
                className="h-8 pl-8 pr-3 w-[180px] sm:w-[190px] bg-surface-inset border border-border rounded-md text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                id="d-search"
                placeholder="Search intent"
                aria-label="Search intents"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-8 px-2.5 bg-surface-inset border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              id="d-l1"
              aria-label="Filter by L1 cluster"
              value={l1}
              onChange={(e) => setL1(e.target.value)}
            >
              <option value="">All L1 clusters</option>
              {L1_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
            <select
              className="h-8 px-2.5 bg-surface-inset border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              id="d-conf"
              aria-label="Filter by confidence"
              value={conf}
              onChange={(e) => setConf(e.target.value)}
            >
              <option value="">All confidence</option>
              <option value="high">High (≥ 0.9)</option>
              <option value="mid">Medium (0.7–0.9)</option>
              <option value="low">Low (&lt; 0.7)</option>
            </select>
            <select
              className="h-8 px-2.5 bg-surface-inset border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              id="d-esc"
              aria-label="Filter by escalation"
              value={esc}
              onChange={(e) => setEsc(e.target.value)}
            >
              <option value="">Any escalation</option>
              <option value="40">Escalation ≥ 40%</option>
              <option value="20">Escalation ≥ 20%</option>
            </select>
            <span className="text-xs text-muted whitespace-nowrap pl-1">
              <span id="d-count" className="font-semibold text-foreground">{filtered.length}</span> shown
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[720px]" id="d-table">
            <thead className="bg-surface border-b border-border">
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                <th className="px-4 py-2.5">Intent</th>
                <th className="px-4 py-2.5">L1 cluster</th>
                <th
                  className={`px-4 py-2.5 text-right cursor-pointer hover:text-foreground transition-colors select-none ${sortKey === 'vol' ? 'text-foreground' : ''}`}
                  role="button"
                  tabIndex={0}
                  data-sort="vol"
                  data-od-id="sort-vol"
                  onClick={() => doSort('vol')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSort('vol'); } }}
                >
                  Volume <span className="text-[10px] ml-0.5">{sortArc('vol')}</span>
                </th>
                <th
                  className={`px-4 py-2.5 text-right cursor-pointer hover:text-foreground transition-colors select-none ${sortKey === 'conf' ? 'text-foreground' : ''}`}
                  role="button"
                  tabIndex={0}
                  data-sort="conf"
                  data-od-id="sort-conf"
                  onClick={() => doSort('conf')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSort('conf'); } }}
                >
                  Conf. <span className="text-[10px] ml-0.5">{sortArc('conf')}</span>
                </th>
                <th
                  className={`px-4 py-2.5 text-right cursor-pointer hover:text-foreground transition-colors select-none ${sortKey === 'esc' ? 'text-foreground' : ''}`}
                  role="button"
                  tabIndex={0}
                  data-sort="esc"
                  data-od-id="sort-esc"
                  onClick={() => doSort('esc')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSort('esc'); } }}
                >
                  Escalation <span className="text-[10px] ml-0.5">{sortArc('esc')}</span>
                </th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody id="d-body" className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.intent} className="hover:bg-surface-hover/70 transition-colors" data-l1={r.l1} data-conf={r.conf} data-vol={r.vol} data-esc={r.esc}>
                  <td className="px-4 py-3 font-medium text-foreground text-xs sm:text-sm">{r.intent}</td>
                  <td className="px-4 py-3 text-muted text-xs sm:text-sm">{r.l1}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-foreground">{r.vol.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-foreground">{r.conf.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-foreground">{r.esc}%</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 h-5.5 px-2 text-xs font-medium rounded-full ${r.status.badge}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {r.status.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted text-xs sm:text-sm flex flex-col items-center justify-center gap-2" id="d-empty">
            <Icon name="filter" className="w-6 h-6 text-muted mb-1" />
            <span>No intents match these filters.</span>
            <button
              type="button"
              className="mt-2 h-7.5 px-3 rounded-md border border-border bg-surface hover:bg-surface-hover text-xs font-medium text-foreground transition-colors cursor-pointer"
              id="d-reset"
              onClick={resetFilters}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const clustersPanel = (
    <div data-od-id="panel-d-clusters" className="mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className="p-4 sm:p-5 bg-surface border border-border rounded-xl shadow-xs" data-od-id="dash-cluster-map">
          <div className="pb-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Cluster shape</h3>
          </div>
          <div className="overflow-x-auto py-2 scrollbar-none">
            <ClusterMap />
          </div>
          <p className="text-xs text-muted mt-2">
            Bar width is proportional to each L1 cluster&apos;s share of the 18,442 labelled records.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">L1 → L2 → L3 breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[420px]">
              <thead className="bg-surface border-b border-border">
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="px-4 py-2.5">Cluster</th>
                  <th className="px-4 py-2.5 text-right">Intents</th>
                  <th className="px-4 py-2.5 text-right">Volume</th>
                  <th className="px-4 py-2.5 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-surface-hover/70 transition-colors bg-surface">
                  <td className="px-4 py-2.5 font-semibold text-foreground text-xs sm:text-sm">
                    Billing &amp; Payments <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted bg-surface-inset px-1.5 py-0.5 rounded">L1</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">86</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">7,045</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold">38.2%</td>
                </tr>
                <tr className="hover:bg-surface-hover/70 transition-colors">
                  <td className="px-4 py-2 pl-8 text-foreground text-xs font-medium">
                    Invoice Disputes <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted bg-surface-inset px-1.5 py-0.5 rounded">L2</span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-muted">34</td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-muted">2,847</td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-muted">15.4%</td>
                </tr>
                <tr className="hover:bg-surface-hover/70 transition-colors">
                  <td className="px-4 py-1.5 pl-14 text-muted text-xs">
                    Charged for cancelled line <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted/70 bg-surface-inset px-1 py-0.5 rounded">L3</span>
                  </td>
                  <td className="px-4 py-1.5 text-right font-mono text-xs text-muted">—</td>
                  <td className="px-4 py-1.5 text-right font-mono text-xs text-muted">1,842</td>
                  <td className="px-4 py-1.5 text-right font-mono text-xs text-muted">10.0%</td>
                </tr>
                <tr className="hover:bg-surface-hover/70 transition-colors">
                  <td className="px-4 py-1.5 pl-14 text-muted text-xs">
                    Promotional credit missing <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted/70 bg-surface-inset px-1 py-0.5 rounded">L3</span>
                  </td>
                  <td className="px-4 py-1.5 text-right font-mono text-xs text-muted">—</td>
                  <td className="px-4 py-1.5 text-right font-mono text-xs text-muted">641</td>
                  <td className="px-4 py-1.5 text-right font-mono text-xs text-muted">3.5%</td>
                </tr>
                <tr className="hover:bg-surface-hover/70 transition-colors">
                  <td className="px-4 py-2 pl-8 text-foreground text-xs font-medium">
                    Late fees &amp; credits <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted bg-surface-inset px-1.5 py-0.5 rounded">L2</span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-muted">21</td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-muted">1,206</td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-muted">6.5%</td>
                </tr>
                <tr className="hover:bg-surface-hover/70 transition-colors">
                  <td className="px-4 py-2 pl-8 text-foreground text-xs font-medium">
                    Auto-pay failures <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted bg-surface-inset px-1.5 py-0.5 rounded">L2</span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-muted">18</td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-muted">1,033</td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-muted">5.6%</td>
                </tr>
                <tr className="hover:bg-surface-hover/70 transition-colors bg-surface">
                  <td className="px-4 py-2.5 font-semibold text-foreground text-xs sm:text-sm">
                    Connectivity &amp; Outages <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted bg-surface-inset px-1.5 py-0.5 rounded">L1</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">74</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">4,445</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold">24.1%</td>
                </tr>
                <tr className="hover:bg-surface-hover/70 transition-colors">
                  <td className="px-4 py-2 pl-8 text-foreground text-xs font-medium">
                    NOIA / area outage <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted bg-surface-inset px-1.5 py-0.5 rounded">L2</span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-muted">29</td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-muted">2,104</td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-muted">11.4%</td>
                </tr>
                <tr className="hover:bg-surface-hover/70 transition-colors bg-surface">
                  <td className="px-4 py-2.5 font-semibold text-foreground text-xs sm:text-sm">
                    New Installation <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted bg-surface-inset px-1.5 py-0.5 rounded">L1</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">41</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">2,545</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold">13.8%</td>
                </tr>
                <tr className="hover:bg-surface-hover/70 transition-colors bg-surface">
                  <td className="px-4 py-2.5 font-semibold text-foreground text-xs sm:text-sm">
                    Plan Changes <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted bg-surface-inset px-1.5 py-0.5 rounded">L1</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">38</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">1,697</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold">9.2%</td>
                </tr>
                <tr className="hover:bg-surface-hover/70 transition-colors bg-surface">
                  <td className="px-4 py-2.5 font-semibold text-foreground text-xs sm:text-sm">
                    Cancellation &amp; Port-out <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted bg-surface-inset px-1.5 py-0.5 rounded">L1</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">27</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">1,550</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold">8.4%</td>
                </tr>
                <tr className="hover:bg-surface-hover/70 transition-colors bg-surface">
                  <td className="px-4 py-2.5 font-semibold text-foreground text-xs sm:text-sm">
                    Account &amp; Identity <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted bg-surface-inset px-1.5 py-0.5 rounded">L1</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">20</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">1,160</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold">6.3%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const agentsPanel = (
    <div data-od-id="panel-d-agents" className="mt-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 bg-surface border border-border rounded-xl shadow-xs flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Icon name="robot" className="w-5 h-5 text-foreground shrink-0" />
            <strong className="text-xs sm:text-sm font-semibold text-foreground truncate">Billing Dispute Agent</strong>
            <span className="ml-auto inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-success-soft text-success-fg shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />Deployed
            </span>
          </div>
          <div className="space-y-1.5 py-2 border-y border-border text-xs">
            <div className="flex justify-between items-center"><span className="text-muted">Runtime</span><span className="font-mono text-foreground">Google ADK</span></div>
            <div className="flex justify-between items-center"><span className="text-muted">Build</span><span className="font-mono text-foreground">ADK-0143</span></div>
            <div className="flex justify-between items-center"><span className="text-muted">Tests</span><span className="font-mono text-foreground">4/4</span></div>
            <div className="flex justify-between items-center"><span className="text-muted">Environment</span><span className="text-foreground">staging · asia-south1</span></div>
          </div>
          <Link className="flex items-center gap-1.5 text-xs font-medium text-accent-strong hover:underline mt-auto pt-1" to="/develop">
            <Icon name="code" className="w-3.5 h-3.5" />Open in Develop<Icon name="chevr" className="w-3.5 h-3.5 ml-auto" />
          </Link>
        </div>

        <div className="p-4 bg-surface border border-border rounded-xl shadow-xs flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Icon name="robot" className="w-5 h-5 text-foreground shrink-0" />
            <strong className="text-xs sm:text-sm font-semibold text-foreground truncate">Outage Triage Agent</strong>
            <span className="ml-auto inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-success-soft text-success-fg shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />Deployed
            </span>
          </div>
          <div className="space-y-1.5 py-2 border-y border-border text-xs">
            <div className="flex justify-between items-center"><span className="text-muted">Runtime</span><span className="font-mono text-foreground">CX Agent Studio</span></div>
            <div className="flex justify-between items-center"><span className="text-muted">Build</span><span className="font-mono text-foreground">CXA-0031</span></div>
            <div className="flex justify-between items-center"><span className="text-muted">Tests</span><span className="font-mono text-foreground">5/5</span></div>
            <div className="flex justify-between items-center"><span className="text-muted">Environment</span><span className="text-foreground">production</span></div>
          </div>
          <Link className="flex items-center gap-1.5 text-xs font-medium text-accent-strong hover:underline mt-auto pt-1" to="/develop">
            <Icon name="code" className="w-3.5 h-3.5" />Open in Develop<Icon name="chevr" className="w-3.5 h-3.5 ml-auto" />
          </Link>
        </div>

        <div className="p-4 bg-surface border border-border rounded-xl shadow-xs flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Icon name="robot" className="w-5 h-5 text-foreground shrink-0" />
            <strong className="text-xs sm:text-sm font-semibold text-foreground truncate">Retention Save Agent</strong>
            <span className="ml-auto inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-warn-soft text-warn-fg shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-warn" />1 flaky test
            </span>
          </div>
          <div className="space-y-1.5 py-2 border-y border-border text-xs">
            <div className="flex justify-between items-center"><span className="text-muted">Runtime</span><span className="font-mono text-foreground">LangGraph</span></div>
            <div className="flex justify-between items-center"><span className="text-muted">Build</span><span className="font-mono text-foreground">LGR-0091</span></div>
            <div className="flex justify-between items-center"><span className="text-muted">Tests</span><span className="font-mono text-foreground">3/4</span></div>
            <div className="flex justify-between items-center"><span className="text-muted">Environment</span><span className="text-muted">not deployed</span></div>
          </div>
          <Link className="flex items-center gap-1.5 text-xs font-medium text-accent-strong hover:underline mt-auto pt-1" to="/develop">
            <Icon name="code" className="w-3.5 h-3.5" />Open in Develop<Icon name="chevr" className="w-3.5 h-3.5 ml-auto" />
          </Link>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">All builds from this run</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[640px]">
            <thead className="bg-surface border-b border-border">
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                <th className="px-4 py-2.5">Build</th>
                <th className="px-4 py-2.5">Agent</th>
                <th className="px-4 py-2.5">Runtime</th>
                <th className="px-4 py-2.5">From map</th>
                <th className="px-4 py-2.5 text-right">Tests</th>
                <th className="px-4 py-2.5">Environment</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-surface-hover/70 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-foreground">ADK-0143</td>
                <td className="px-4 py-3 font-medium text-xs sm:text-sm text-foreground">Billing Dispute Agent</td>
                <td className="px-4 py-3 text-xs sm:text-sm text-foreground">Google ADK</td>
                <td className="px-4 py-3 font-mono text-xs text-muted">billing-dispute@v3</td>
                <td className="px-4 py-3 text-right font-mono text-xs">4/4</td>
                <td className="px-4 py-3 text-xs text-muted">staging</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-success-soft text-success-fg">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />Deployed
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-surface-hover/70 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-foreground">ADK-0142</td>
                <td className="px-4 py-3 font-medium text-xs sm:text-sm text-foreground">Billing Dispute Agent</td>
                <td className="px-4 py-3 text-xs sm:text-sm text-foreground">Google ADK</td>
                <td className="px-4 py-3 font-mono text-xs text-muted">billing-dispute@v2</td>
                <td className="px-4 py-3 text-right font-mono text-xs">4/4</td>
                <td className="px-4 py-3 text-xs text-muted">staging</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-success-soft text-success-fg">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />Deployed
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-surface-hover/70 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-foreground">CXA-0031</td>
                <td className="px-4 py-3 font-medium text-xs sm:text-sm text-foreground">Outage Triage Agent</td>
                <td className="px-4 py-3 text-xs sm:text-sm text-foreground">CX Agent Studio</td>
                <td className="px-4 py-3 font-mono text-xs text-muted">outage-triage@v2</td>
                <td className="px-4 py-3 text-right font-mono text-xs">5/5</td>
                <td className="px-4 py-3 text-xs text-muted">production</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-success-soft text-success-fg">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />Deployed
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-surface-hover/70 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-foreground">BRK-0037</td>
                <td className="px-4 py-3 font-medium text-xs sm:text-sm text-foreground">Invoice Explanation Agent</td>
                <td className="px-4 py-3 text-xs sm:text-sm text-foreground">Amazon Bedrock</td>
                <td className="px-4 py-3 font-mono text-xs text-muted">billing-dispute@v2</td>
                <td className="px-4 py-3 text-right font-mono text-xs">2/4</td>
                <td className="px-4 py-3 text-xs text-muted">—</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-danger-soft text-danger-fg">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger" />Failed · auth scope
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <AppShell
      crumb="Dashboard"
      middleCrumb={(
        <select
          aria-label="Switch completed job"
          className="h-8 max-w-[280px] px-2.5 bg-surface-inset border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-accent transition-colors"
          defaultValue="run-4821"
        >
          <option value="run-4821">RUN-4821 · Week-26 clustering refresh</option>
          <option value="run-4792">RUN-4792 · Network Ops Copilot</option>
          <option value="run-4770">RUN-4770 · Northwind first pass</option>
        </select>
      )}
      badge={
        <span className="inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-medium rounded-full bg-success-soft text-success-fg">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />Completed · 18 Jul, 14:32
        </span>
      }
      actions={(
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer"
          onClick={() => toast('Dashboard exported as skyline-run-4821.pdf', 'download')}
        >
          <Icon name="download" className="w-3.5 h-3.5 text-muted" />Export
        </button>
      )}
    >
      <div className="p-4 sm:p-6 lg:p-7 max-w-[1240px] mx-auto w-full pb-16" data-od-id="dashboard-page">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground" data-od-id="page-title">Run dashboard</h1>
            <p className="text-xs sm:text-sm text-muted mt-1 max-w-[660px]">
              Everything the finished run produced — 286 canonical intents, six L1 clusters with their L2 / L3 shape, and the agent builds generated from them. Filter or sort any column.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-medium rounded-full bg-surface-inset border border-border text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-muted" />Client · Skyline Broadband
            </span>
            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-medium rounded-full bg-surface-inset border border-border text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-muted" />42 min · ₹1,284
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6" data-od-id="dash-kpis">
          <div className="p-4 bg-surface border border-border rounded-xl shadow-xs flex flex-col gap-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Records processed</div>
            <div className="text-2xl font-bold tracking-tight text-foreground">18,442</div>
            <div className="text-xs text-muted">3 sources · 24.7k events</div>
          </div>
          <div className="p-4 bg-surface border border-border rounded-xl shadow-xs flex flex-col gap-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Canonical intents</div>
            <div className="text-2xl font-bold tracking-tight text-foreground">286</div>
            <div className="text-xs text-muted">3,214 raw → deduped</div>
          </div>
          <div className="p-4 bg-surface border border-border rounded-xl shadow-xs flex flex-col gap-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">L1 clusters</div>
            <div className="text-2xl font-bold tracking-tight text-foreground">6</div>
            <div className="text-xs text-muted">19 L2 · 57 L3 nodes</div>
          </div>
          <div className="p-4 bg-surface border border-border rounded-xl shadow-xs flex flex-col gap-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Agent builds</div>
            <div className="text-2xl font-bold tracking-tight text-foreground">9</div>
            <div className="text-xs text-muted">4 runtimes · 7 deployed</div>
          </div>
        </div>

        <div className="mb-4" data-od-id="dash-tabs">
          <Tabs
            tabs={[
              { id: 'intents', label: <>Intents <span className="ml-1 px-1.5 py-0.5 rounded-full bg-surface-inset text-[11px] font-mono text-muted">286</span></> },
              { id: 'clusters', label: <>Clusters <span className="ml-1 px-1.5 py-0.5 rounded-full bg-surface-inset text-[11px] font-mono text-muted">6 L1</span></> },
              { id: 'agents', label: <>Agents <span className="ml-1 px-1.5 py-0.5 rounded-full bg-surface-inset text-[11px] font-mono text-muted">9</span></> },
            ]}
            panels={{ intents: intentsPanel, clusters: clustersPanel, agents: agentsPanel }}
            defaultTab="intents"
          />
        </div>
      </div>
    </AppShell>
  );
}
