'use client';

import { useMemo, useState } from 'react';
import { Link } from '../lib/navigation';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';
import { KpiCard, PageHeader, StatusBadge, EmptyState, SearchToolbar } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
      <path d="M 220 208 C 248 208, 248 50, 276 50" fill="none" stroke="var(--color-border-strong)" strokeWidth="1.5" />
      <path d="M 220 208 C 248 208, 248 114, 276 114" fill="none" stroke="var(--color-border-strong)" strokeWidth="1.5" />
      <path d="M 220 208 C 248 208, 248 178, 276 178" fill="none" stroke="var(--color-border-strong)" strokeWidth="1.5" />
      <path d="M 220 208 C 248 208, 248 242, 276 242" fill="none" stroke="var(--color-border-strong)" strokeWidth="1.5" />
      <path d="M 220 208 C 248 208, 248 306, 276 306" fill="none" stroke="var(--color-border-strong)" strokeWidth="1.5" />
      <path d="M 220 208 C 248 208, 248 370, 276 370" fill="none" stroke="var(--color-border-strong)" strokeWidth="1.5" />
      <g transform="translate(280,24)">
        <rect width="636" height="52" rx="8" fill="var(--color-surface)" stroke="var(--color-border)" />
        <rect width="4" height="52" rx="2" fill="var(--color-accent-strong)" />
        <text x="16" y="22" fontWeight="640" fontSize="13" fill="var(--color-fg)">Billing &amp; Payments</text>
        <text x="160" y="22" fontSize="11" fill="var(--color-muted)">86 intents</text>
        <text x="296" y="22" fontSize="11" fill="var(--color-muted)">3 L2 · 11 L3</text>
        <text x="620" y="22" textAnchor="end" fontSize="11.5" fontWeight="640" fill="var(--color-fg)">7,045 · 38.2%</text>
        <rect x="16" y="32" width="604" height="6" rx="3" fill="var(--color-surface-inset)" />
        <rect x="16" y="32" width="230.7" height="6" rx="3" fill="var(--color-accent-strong)" />
      </g>
      <g transform="translate(280,88)">
        <rect width="636" height="52" rx="8" fill="var(--color-surface)" stroke="var(--color-border)" />
        <rect width="4" height="52" rx="2" fill="var(--color-accent-strong)" />
        <text x="16" y="22" fontWeight="640" fontSize="13" fill="var(--color-fg)">Connectivity &amp; Outages</text>
        <text x="180" y="22" fontSize="11" fill="var(--color-muted)">74 intents</text>
        <text x="296" y="22" fontSize="11" fill="var(--color-muted)">4 L2 · 14 L3</text>
        <text x="620" y="22" textAnchor="end" fontSize="11.5" fontWeight="640" fill="var(--color-fg)">4,445 · 24.1%</text>
        <rect x="16" y="32" width="604" height="6" rx="3" fill="var(--color-surface-inset)" />
        <rect x="16" y="32" width="145.6" height="6" rx="3" fill="var(--color-accent-strong)" />
      </g>
      <g transform="translate(280,152)">
        <rect width="636" height="52" rx="8" fill="var(--color-surface)" stroke="var(--color-border)" />
        <text x="16" y="22" fontWeight="640" fontSize="13" fill="var(--color-fg)">New Installation</text>
        <text x="144" y="22" fontSize="11" fill="var(--color-muted)">41 intents</text>
        <text x="296" y="22" fontSize="11" fill="var(--color-muted)">3 L2 · 9 L3</text>
        <text x="620" y="22" textAnchor="end" fontSize="11.5" fill="var(--color-muted)">2,545 · 13.8%</text>
        <rect x="16" y="32" width="604" height="6" rx="3" fill="var(--color-surface-inset)" />
        <rect x="16" y="32" width="83.4" height="6" rx="3" fill="var(--color-accent-strong)" />
      </g>
      <g transform="translate(280,216)">
        <rect width="636" height="52" rx="8" fill="var(--color-surface)" stroke="var(--color-border)" />
        <text x="16" y="22" fontWeight="640" fontSize="13" fill="var(--color-fg)">Plan Changes</text>
        <text x="124" y="22" fontSize="11" fill="var(--color-muted)">38 intents</text>
        <text x="296" y="22" fontSize="11" fill="var(--color-muted)">4 L2 · 10 L3</text>
        <text x="620" y="22" textAnchor="end" fontSize="11.5" fill="var(--color-muted)">1,697 · 9.2%</text>
        <rect x="16" y="32" width="604" height="6" rx="3" fill="var(--color-surface-inset)" />
        <rect x="16" y="32" width="55.6" height="6" rx="3" fill="var(--color-accent-strong)" />
      </g>
      <g transform="translate(280,280)">
        <rect width="636" height="52" rx="8" fill="var(--color-surface)" stroke="var(--color-border)" />
        <text x="16" y="22" fontWeight="640" fontSize="13" fill="var(--color-fg)">Cancellation &amp; Port-out</text>
        <text x="180" y="22" fontSize="11" fill="var(--color-muted)">27 intents</text>
        <text x="296" y="22" fontSize="11" fill="var(--color-muted)">3 L2 · 8 L3</text>
        <text x="620" y="22" textAnchor="end" fontSize="11.5" fill="var(--color-muted)">1,550 · 8.4%</text>
        <rect x="16" y="32" width="604" height="6" rx="3" fill="var(--color-surface-inset)" />
        <rect x="16" y="32" width="50.7" height="6" rx="3" fill="var(--color-accent-strong)" />
      </g>
      <g transform="translate(280,344)">
        <rect width="636" height="52" rx="8" fill="var(--color-surface)" stroke="var(--color-border)" />
        <text x="16" y="22" fontWeight="640" fontSize="13" fill="var(--color-fg)">Account &amp; Identity</text>
        <text x="156" y="22" fontSize="11" fill="var(--color-muted)">20 intents</text>
        <text x="296" y="22" fontSize="11" fill="var(--color-muted)">2 L2 · 5 L3</text>
        <text x="620" y="22" textAnchor="end" fontSize="11.5" fill="var(--color-muted)">1,160 · 6.3%</text>
        <rect x="16" y="32" width="604" height="6" rx="3" fill="var(--color-surface-inset)" />
        <rect x="16" y="32" width="38.1" height="6" rx="3" fill="var(--color-accent-strong)" />
      </g>
    </svg>
  );
}

function DistributionSvg() {
  return (
    <svg className="w-full h-8 block" viewBox="0 0 600 32" preserveAspectRatio="none">
      <rect x="0" y="4" width="229.2" height="24" rx="4" fill="var(--color-accent-strong)" />
      <rect x="231.2" y="4" width="144.6" height="24" fill="var(--color-accent-hover)" />
      <rect x="377.8" y="4" width="82.8" height="24" fill="var(--color-accent-active)" />
      <rect x="462.6" y="4" width="55.2" height="24" fill="var(--color-border-strong)" />
      <rect x="519.8" y="4" width="50.4" height="24" fill="var(--color-muted)" />
      <rect x="572.2" y="4" width="27.8" height="24" rx="4" fill="var(--color-surface-inset)" stroke="var(--color-border)" />
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
      <Card className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden p-0 gap-0">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">Intent ledger</h3>
          <SearchToolbar
            query={search}
            onQueryChange={setSearch}
            placeholder="Search intent"
            count={filtered.length}
            countLabel="shown"
          >
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
          </SearchToolbar>
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <Table id="d-table" className="min-w-[720px]">
            <TableHeader className="bg-surface border-b border-border">
              <TableRow className="text-[11px] font-semibold uppercase tracking-wider text-muted hover:bg-transparent">
                <TableHead className="px-4 py-2.5 text-muted">Intent</TableHead>
                <TableHead className="px-4 py-2.5 text-muted">L1 cluster</TableHead>
                <TableHead
                  className={`px-4 py-2.5 text-right cursor-pointer hover:text-foreground transition-colors select-none ${sortKey === 'vol' ? 'text-foreground' : 'text-muted'}`}
                  role="button"
                  tabIndex={0}
                  data-sort="vol"
                  data-od-id="sort-vol"
                  onClick={() => doSort('vol')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSort('vol'); } }}
                >
                  Volume <span className="text-[10px] ml-0.5">{sortArc('vol')}</span>
                </TableHead>
                <TableHead
                  className={`px-4 py-2.5 text-right cursor-pointer hover:text-foreground transition-colors select-none ${sortKey === 'conf' ? 'text-foreground' : 'text-muted'}`}
                  role="button"
                  tabIndex={0}
                  data-sort="conf"
                  data-od-id="sort-conf"
                  onClick={() => doSort('conf')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSort('conf'); } }}
                >
                  Conf. <span className="text-[10px] ml-0.5">{sortArc('conf')}</span>
                </TableHead>
                <TableHead
                  className={`px-4 py-2.5 text-right cursor-pointer hover:text-foreground transition-colors select-none ${sortKey === 'esc' ? 'text-foreground' : 'text-muted'}`}
                  role="button"
                  tabIndex={0}
                  data-sort="esc"
                  data-od-id="sort-esc"
                  onClick={() => doSort('esc')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSort('esc'); } }}
                >
                  Escalation <span className="text-[10px] ml-0.5">{sortArc('esc')}</span>
                </TableHead>
                <TableHead className="px-4 py-2.5 text-muted">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody id="d-body" className="divide-y divide-border">
              {filtered.map((r) => {
                const isOk = r.status.badge.includes('bg-success');
                const isWarn = r.status.badge.includes('bg-warn');
                const isAcc = r.status.badge.includes('bg-accent');
                const statusType = isOk ? 'ok' : isWarn ? 'warn' : isAcc ? 'accent' : 'neutral';

                return (
                  <TableRow key={r.intent} className="hover:bg-surface-hover/70 transition-colors" data-l1={r.l1} data-conf={r.conf} data-vol={r.vol} data-esc={r.esc}>
                    <TableCell className="px-4 py-3 font-medium text-foreground text-xs sm:text-sm">{r.intent}</TableCell>
                    <TableCell className="px-4 py-3 text-muted text-xs sm:text-sm">{r.l1}</TableCell>
                    <TableCell className="px-4 py-3 text-right font-mono text-xs text-foreground">{r.vol.toLocaleString()}</TableCell>
                    <TableCell className="px-4 py-3 text-right font-mono text-xs text-foreground">{r.conf.toFixed(2)}</TableCell>
                    <TableCell className="px-4 py-3 text-right font-mono text-xs text-foreground">{r.esc}%</TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusBadge status={statusType}>
                        {r.status.label}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden divide-y divide-border" id="d-mobile-cards">
          {filtered.map((r) => {
            const isOk = r.status.badge.includes('bg-success');
            const isWarn = r.status.badge.includes('bg-warn');
            const isAcc = r.status.badge.includes('bg-accent');
            const statusType = isOk ? 'ok' : isWarn ? 'warn' : isAcc ? 'accent' : 'neutral';

            return (
              <div
                key={r.intent}
                className="p-3.5 hover:bg-surface-hover/70 transition-colors space-y-2.5"
                data-l1={r.l1}
                data-conf={r.conf}
                data-vol={r.vol}
                data-esc={r.esc}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-foreground leading-snug">{r.intent}</div>
                    <div className="text-[11px] text-muted mt-0.5">{r.l1}</div>
                  </div>
                  <StatusBadge status={statusType} className="shrink-0 text-[11px]">
                    {r.status.label}
                  </StatusBadge>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40 text-center font-mono">
                  <div className="bg-surface-inset/60 rounded px-2 py-1.5">
                    <span className="block text-[10px] uppercase font-sans tracking-wider text-muted">Vol</span>
                    <span className="text-xs font-semibold text-foreground">{r.vol.toLocaleString()}</span>
                  </div>
                  <div className="bg-surface-inset/60 rounded px-2 py-1.5">
                    <span className="block text-[10px] uppercase font-sans tracking-wider text-muted">Conf</span>
                    <span className="text-xs font-semibold text-foreground">{r.conf.toFixed(2)}</span>
                  </div>
                  <div className="bg-surface-inset/60 rounded px-2 py-1.5">
                    <span className="block text-[10px] uppercase font-sans tracking-wider text-muted">Esc</span>
                    <span className="text-xs font-semibold text-foreground">{r.esc}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <EmptyState
            icon="filter"
            title="No intents match these filters."
            dataOdId="d-empty"
            action={
              <button
                type="button"
                className="mt-2 h-7.5 px-3 rounded-md border border-border bg-surface hover:bg-surface-hover text-xs font-medium text-foreground transition-colors cursor-pointer"
                id="d-reset"
                onClick={resetFilters}
              >
                Reset filters
              </button>
            }
          />
        )}
      </Card>
    </div>
  );

  const clustersPanel = (
    <div data-od-id="panel-d-clusters" className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <Card className="p-4 sm:p-5 bg-surface border border-border rounded-xl shadow-xs" data-od-id="dash-cluster-map">
          <div className="pb-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Cluster hierarchy</h3>
            <p className="text-xs text-muted mt-0.5">286 canonical intents grouped into six L1 clusters sized by volume.</p>
          </div>
          <div className="pt-3 overflow-x-auto">
            <ClusterMap />
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4 sm:p-5 bg-surface border border-border rounded-xl shadow-xs" data-od-id="dash-cluster-distribution">
            <h3 className="text-sm font-semibold text-foreground mb-1">Volume share</h3>
            <div className="mt-3">
              <DistributionSvg />
            </div>
            <p className="text-xs text-muted mt-2">
              Bar width is proportional to each L1 cluster&apos;s share of the 18,442 labelled records.
            </p>
          </Card>

          <Card className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden p-0 gap-0">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">L1 → L2 → L3 breakdown</h3>
            </div>
            <Table className="min-w-[420px]">
              <TableHeader className="bg-surface border-b border-border">
                <TableRow className="text-[11px] font-semibold uppercase tracking-wider text-muted hover:bg-transparent">
                  <TableHead className="px-4 py-2.5 text-muted">Cluster</TableHead>
                  <TableHead className="px-4 py-2.5 text-right text-muted">Intents</TableHead>
                  <TableHead className="px-4 py-2.5 text-right text-muted">Volume</TableHead>
                  <TableHead className="px-4 py-2.5 text-right text-muted">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                <TableRow className="hover:bg-surface-hover/70 transition-colors bg-surface">
                  <TableCell className="px-4 py-2.5 font-semibold text-foreground text-xs sm:text-sm">
                    Billing &amp; Payments <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted bg-surface-inset px-1.5 py-0.5 rounded">L1</span>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-right font-mono text-xs">86</TableCell>
                  <TableCell className="px-4 py-2.5 text-right font-mono text-xs">7,045</TableCell>
                  <TableCell className="px-4 py-2.5 text-right font-mono text-xs font-semibold">38.2%</TableCell>
                </TableRow>
                <TableRow className="hover:bg-surface-hover/70 transition-colors">
                  <TableCell className="px-4 py-2 pl-8 text-foreground text-xs font-medium">
                    Invoice Disputes <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted bg-surface-inset px-1.5 py-0.5 rounded">L2</span>
                  </TableCell>
                  <TableCell className="px-4 py-2 text-right font-mono text-xs text-muted">34</TableCell>
                  <TableCell className="px-4 py-2 text-right font-mono text-xs text-muted">2,847</TableCell>
                  <TableCell className="px-4 py-2 text-right font-mono text-xs text-muted">15.4%</TableCell>
                </TableRow>
                <TableRow className="hover:bg-surface-hover/70 transition-colors">
                  <TableCell className="px-4 py-1.5 pl-14 text-muted text-xs">
                    Charged for cancelled line <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted/70 bg-surface-inset px-1 py-0.5 rounded">L3</span>
                  </TableCell>
                  <TableCell className="px-4 py-1.5 text-right font-mono text-xs text-muted">—</TableCell>
                  <TableCell className="px-4 py-1.5 text-right font-mono text-xs text-muted">1,842</TableCell>
                  <TableCell className="px-4 py-1.5 text-right font-mono text-xs text-muted">10.0%</TableCell>
                </TableRow>
                <TableRow className="hover:bg-surface-hover/70 transition-colors">
                  <TableCell className="px-4 py-1.5 pl-14 text-muted text-xs">
                    Promotional credit missing <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted/70 bg-surface-inset px-1 py-0.5 rounded">L3</span>
                  </TableCell>
                  <TableCell className="px-4 py-1.5 text-right font-mono text-xs text-muted">—</TableCell>
                  <TableCell className="px-4 py-1.5 text-right font-mono text-xs text-muted">641</TableCell>
                  <TableCell className="px-4 py-1.5 text-right font-mono text-xs text-muted">3.5%</TableCell>
                </TableRow>
                <TableRow className="hover:bg-surface-hover/70 transition-colors">
                  <TableCell className="px-4 py-2 pl-8 text-foreground text-xs font-medium">
                    Late fees &amp; credits <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted bg-surface-inset px-1.5 py-0.5 rounded">L2</span>
                  </TableCell>
                  <TableCell className="px-4 py-2 text-right font-mono text-xs text-muted">21</TableCell>
                  <TableCell className="px-4 py-2 text-right font-mono text-xs text-muted">1,206</TableCell>
                  <TableCell className="px-4 py-2 text-right font-mono text-xs text-muted">6.5%</TableCell>
                </TableRow>
                <TableRow className="hover:bg-surface-hover/70 transition-colors">
                  <TableCell className="px-4 py-2 pl-8 text-foreground text-xs font-medium">
                    Auto-pay failures <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted bg-surface-inset px-1.5 py-0.5 rounded">L2</span>
                  </TableCell>
                  <TableCell className="px-4 py-2 text-right font-mono text-xs text-muted">18</TableCell>
                  <TableCell className="px-4 py-2 text-right font-mono text-xs text-muted">1,033</TableCell>
                  <TableCell className="px-4 py-2 text-right font-mono text-xs text-muted">5.6%</TableCell>
                </TableRow>
                <TableRow className="hover:bg-surface-hover/70 transition-colors bg-surface">
                  <TableCell className="px-4 py-2.5 font-semibold text-foreground text-xs sm:text-sm">
                    Connectivity &amp; Outages <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted bg-surface-inset px-1.5 py-0.5 rounded">L1</span>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-right font-mono text-xs">74</TableCell>
                  <TableCell className="px-4 py-2.5 text-right font-mono text-xs">4,445</TableCell>
                  <TableCell className="px-4 py-2.5 text-right font-mono text-xs font-semibold">24.1%</TableCell>
                </TableRow>
                <TableRow className="hover:bg-surface-hover/70 transition-colors">
                  <TableCell className="px-4 py-2 pl-8 text-foreground text-xs font-medium">
                    NOIA / area outage <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted bg-surface-inset px-1.5 py-0.5 rounded">L2</span>
                  </TableCell>
                  <TableCell className="px-4 py-2 text-right font-mono text-xs text-muted">29</TableCell>
                  <TableCell className="px-4 py-2 text-right font-mono text-xs text-muted">2,104</TableCell>
                  <TableCell className="px-4 py-2 text-right font-mono text-xs text-muted">11.4%</TableCell>
                </TableRow>
                <TableRow className="hover:bg-surface-hover/70 transition-colors bg-surface">
                  <TableCell className="px-4 py-2.5 font-semibold text-foreground text-xs sm:text-sm">
                    New Installation <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted bg-surface-inset px-1.5 py-0.5 rounded">L1</span>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-right font-mono text-xs">41</TableCell>
                  <TableCell className="px-4 py-2.5 text-right font-mono text-xs">2,545</TableCell>
                  <TableCell className="px-4 py-2.5 text-right font-mono text-xs font-semibold">13.8%</TableCell>
                </TableRow>
                <TableRow className="hover:bg-surface-hover/70 transition-colors bg-surface">
                  <TableCell className="px-4 py-2.5 font-semibold text-foreground text-xs sm:text-sm">
                    Plan Changes <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted bg-surface-inset px-1.5 py-0.5 rounded">L1</span>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-right font-mono text-xs">38</TableCell>
                  <TableCell className="px-4 py-2.5 text-right font-mono text-xs">1,697</TableCell>
                  <TableCell className="px-4 py-2.5 text-right font-mono text-xs font-semibold">9.2%</TableCell>
                </TableRow>
                <TableRow className="hover:bg-surface-hover/70 transition-colors bg-surface">
                  <TableCell className="px-4 py-2.5 font-semibold text-foreground text-xs sm:text-sm">
                    Cancellation &amp; Port-out <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted bg-surface-inset px-1.5 py-0.5 rounded">L1</span>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-right font-mono text-xs">27</TableCell>
                  <TableCell className="px-4 py-2.5 text-right font-mono text-xs">1,550</TableCell>
                  <TableCell className="px-4 py-2.5 text-right font-mono text-xs font-semibold">8.4%</TableCell>
                </TableRow>
                <TableRow className="hover:bg-surface-hover/70 transition-colors bg-surface">
                  <TableCell className="px-4 py-2.5 font-semibold text-foreground text-xs sm:text-sm">
                    Account &amp; Identity <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-muted bg-surface-inset px-1.5 py-0.5 rounded">L1</span>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-right font-mono text-xs">20</TableCell>
                  <TableCell className="px-4 py-2.5 text-right font-mono text-xs">1,160</TableCell>
                  <TableCell className="px-4 py-2.5 text-right font-mono text-xs font-semibold">6.3%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );

  const agentsPanel = (
    <div data-od-id="panel-d-agents" className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4 bg-surface border border-border rounded-xl shadow-xs flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Icon name="robot" className="w-5 h-5 text-foreground shrink-0" />
            <strong className="text-xs sm:text-sm font-semibold text-foreground truncate">Billing Dispute Agent</strong>
            <StatusBadge status="ok" className="ml-auto shrink-0">
              Deployed
            </StatusBadge>
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
        </Card>

        <Card className="p-4 bg-surface border border-border rounded-xl shadow-xs flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Icon name="robot" className="w-5 h-5 text-foreground shrink-0" />
            <strong className="text-xs sm:text-sm font-semibold text-foreground truncate">Outage Triage Agent</strong>
            <StatusBadge status="ok" className="ml-auto shrink-0">
              Deployed
            </StatusBadge>
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
        </Card>

        <Card className="p-4 bg-surface border border-border rounded-xl shadow-xs flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Icon name="robot" className="w-5 h-5 text-foreground shrink-0" />
            <strong className="text-xs sm:text-sm font-semibold text-foreground truncate">Retention Save Agent</strong>
            <StatusBadge status="warn" className="ml-auto shrink-0">
              1 flaky test
            </StatusBadge>
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
        </Card>
      </div>

      <Card className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden p-0 gap-0">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">All builds from this run</h3>
        </div>
        <Table className="min-w-[640px]">
          <TableHeader className="bg-surface border-b border-border">
            <TableRow className="text-[11px] font-semibold uppercase tracking-wider text-muted hover:bg-transparent">
              <TableHead className="px-4 py-2.5 text-muted">Build</TableHead>
              <TableHead className="px-4 py-2.5 text-muted">Agent</TableHead>
              <TableHead className="px-4 py-2.5 text-muted">Runtime</TableHead>
              <TableHead className="px-4 py-2.5 text-muted">From map</TableHead>
              <TableHead className="px-4 py-2.5 text-right text-muted">Tests</TableHead>
              <TableHead className="px-4 py-2.5 text-muted">Environment</TableHead>
              <TableHead className="px-4 py-2.5 text-muted">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            <TableRow className="hover:bg-surface-hover/70 transition-colors">
              <TableCell className="px-4 py-3 font-mono text-xs text-foreground">ADK-0143</TableCell>
              <TableCell className="px-4 py-3 font-medium text-xs sm:text-sm text-foreground">Billing Dispute Agent</TableCell>
              <TableCell className="px-4 py-3 text-xs sm:text-sm text-foreground">Google ADK</TableCell>
              <TableCell className="px-4 py-3 font-mono text-xs text-muted">billing-dispute@v3</TableCell>
              <TableCell className="px-4 py-3 text-right font-mono text-xs">4/4</TableCell>
              <TableCell className="px-4 py-3 text-xs text-muted">staging</TableCell>
              <TableCell className="px-4 py-3">
                <StatusBadge status="ok">
                  Deployed
                </StatusBadge>
              </TableCell>
            </TableRow>
            <TableRow className="hover:bg-surface-hover/70 transition-colors">
              <TableCell className="px-4 py-3 font-mono text-xs text-foreground">ADK-0142</TableCell>
              <TableCell className="px-4 py-3 font-medium text-xs sm:text-sm text-foreground">Billing Dispute Agent</TableCell>
              <TableCell className="px-4 py-3 text-xs sm:text-sm text-foreground">Google ADK</TableCell>
              <TableCell className="px-4 py-3 font-mono text-xs text-muted">billing-dispute@v2</TableCell>
              <TableCell className="px-4 py-3 text-right font-mono text-xs">4/4</TableCell>
              <TableCell className="px-4 py-3 text-xs text-muted">staging</TableCell>
              <TableCell className="px-4 py-3">
                <StatusBadge status="ok">
                  Deployed
                </StatusBadge>
              </TableCell>
            </TableRow>
            <TableRow className="hover:bg-surface-hover/70 transition-colors">
              <TableCell className="px-4 py-3 font-mono text-xs text-foreground">CXA-0031</TableCell>
              <TableCell className="px-4 py-3 font-medium text-xs sm:text-sm text-foreground">Outage Triage Agent</TableCell>
              <TableCell className="px-4 py-3 text-xs sm:text-sm text-foreground">CX Agent Studio</TableCell>
              <TableCell className="px-4 py-3 font-mono text-xs text-muted">outage-triage@v2</TableCell>
              <TableCell className="px-4 py-3 text-right font-mono text-xs">5/5</TableCell>
              <TableCell className="px-4 py-3 text-xs text-muted">production</TableCell>
              <TableCell className="px-4 py-3">
                <StatusBadge status="ok">
                  Deployed
                </StatusBadge>
              </TableCell>
            </TableRow>
            <TableRow className="hover:bg-surface-hover/70 transition-colors">
              <TableCell className="px-4 py-3 font-mono text-xs text-foreground">BRK-0037</TableCell>
              <TableCell className="px-4 py-3 font-medium text-xs sm:text-sm text-foreground">Invoice Explanation Agent</TableCell>
              <TableCell className="px-4 py-3 text-xs sm:text-sm text-foreground">Amazon Bedrock</TableCell>
              <TableCell className="px-4 py-3 font-mono text-xs text-muted">billing-dispute@v2</TableCell>
              <TableCell className="px-4 py-3 text-right font-mono text-xs">2/4</TableCell>
              <TableCell className="px-4 py-3 text-xs text-muted">—</TableCell>
              <TableCell className="px-4 py-3">
                <StatusBadge status="danger">
                  Failed · auth scope
                </StatusBadge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
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
        <StatusBadge status="ok">
          Completed · 18 Jul, 14:32
        </StatusBadge>
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
        <PageHeader
          title="Run dashboard"
          description="Everything the finished run produced — 286 canonical intents, six L1 clusters with their L2 / L3 shape, and the agent builds generated from them. Filter or sort any column."
          dataOdId="page-title"
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-medium rounded-full bg-surface-inset border border-border text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-muted" />Client · Skyline Broadband
              </span>
              <span className="inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-medium rounded-full bg-surface-inset border border-border text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-muted" />42 min · ₹1,284
              </span>
            </div>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-6" data-od-id="dash-kpis">
          <KpiCard
            label="Records processed"
            value="18,442"
            description="3 sources · 24.7k events"
          />
          <KpiCard
            label="Canonical intents"
            value="286"
            description="3,214 raw → deduped"
          />
          <KpiCard
            label="L1 clusters"
            value="6"
            description="19 L2 · 57 L3 nodes"
          />
          <KpiCard
            label="Agent builds"
            value="9"
            description="4 runtimes · 7 deployed"
          />
        </div>

        <div className="mb-4" data-od-id="dash-tabs">
          <Tabs defaultValue="intents" className="w-full">
            <TabsList variant="line" className="border-b border-border w-full justify-start rounded-none h-10 p-0 gap-4">
              <TabsTrigger value="intents" className="h-10 px-3 border-b-2 border-transparent data-[state=active]:border-foreground rounded-none font-medium text-xs sm:text-sm">
                Intents <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-surface-inset text-[11px] font-mono text-muted">286</span>
              </TabsTrigger>
              <TabsTrigger value="clusters" className="h-10 px-3 border-b-2 border-transparent data-[state=active]:border-foreground rounded-none font-medium text-xs sm:text-sm">
                Clusters <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-surface-inset text-[11px] font-mono text-muted">6 L1</span>
              </TabsTrigger>
              <TabsTrigger value="agents" className="h-10 px-3 border-b-2 border-transparent data-[state=active]:border-foreground rounded-none font-medium text-xs sm:text-sm">
                Agents <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-surface-inset text-[11px] font-mono text-muted">9</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="intents" className="mt-4">{intentsPanel}</TabsContent>
            <TabsContent value="clusters" className="mt-4">{clustersPanel}</TabsContent>
            <TabsContent value="agents" className="mt-4">{agentsPanel}</TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}
