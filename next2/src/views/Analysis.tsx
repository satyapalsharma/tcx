'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';
import { PageHeader, SelectField, StatusBadge } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useApp } from '@/context/AppContext';

type TabView = 'intents' | 'taxonomy' | 'pain-points' | 'hold-reasons';

interface IntentItem {
  id: string;
  name: string;
  l1: string;
  l2: string;
  l3: string;
  volume: number;
  confidence: number;
  escalationRate: number;
  resolutionRate: number;
  holdReason: string;
  painPoint: string;
}

const INTENT_DATA: IntentItem[] = [
  {
    id: 'int-1',
    name: 'Charged for a cancelled service line',
    l1: 'Billing & Payments',
    l2: 'Dispute Handling',
    l3: 'Post-termination billing glitch',
    volume: 1842,
    confidence: 0.96,
    escalationRate: 41,
    resolutionRate: 58,
    holdReason: 'Supervisor credit approval for > ₹2,500',
    painPoint: 'Customer surprised by auto-debit 30 days after cancellation confirmation',
  },
  {
    id: 'int-2',
    name: 'Invoice higher than agreed promo price',
    l1: 'Billing & Payments',
    l2: 'Promotion Discrepancy',
    l3: 'Expired discount coupon code',
    volume: 1631,
    confidence: 0.94,
    escalationRate: 33,
    resolutionRate: 72,
    holdReason: 'Verifying original sales campaign terms in legacy CRM',
    painPoint: 'Told ₹999 on sales call, billed ₹1,499 with unitemized addons',
  },
  {
    id: 'int-3',
    name: 'Internet down — area outage (NOIA)',
    l1: 'Connectivity & Outages',
    l2: 'Area Infrastructure',
    l3: 'Fiber optic cut in node sector 4',
    volume: 1530,
    confidence: 0.97,
    escalationRate: 22,
    resolutionRate: 88,
    holdReason: 'Checking NOC network ticket dispatch status',
    painPoint: 'No proactive SMS sent when sector went down during work hours',
  },
  {
    id: 'int-4',
    name: 'Slow speeds at peak evening hours',
    l1: 'Connectivity & Outages',
    l2: 'Bandwidth & Performance',
    l3: 'Contention ratio throttling',
    volume: 1118,
    confidence: 0.92,
    escalationRate: 18,
    resolutionRate: 79,
    holdReason: 'Running remote router line diagnostics test',
    painPoint: 'Speed drops from 300 Mbps to 18 Mbps between 8 PM and 11 PM',
  },
  {
    id: 'int-5',
    name: 'Book new fiber installation slot',
    l1: 'Installation & Provisioning',
    l2: 'Slot Booking',
    l3: 'Technician availability check',
    volume: 1043,
    confidence: 0.95,
    escalationRate: 9,
    resolutionRate: 94,
    holdReason: 'Dispatch schedule calendar latency',
    painPoint: 'Weekend installation slots unavailable for 2 consecutive weeks',
  },
  {
    id: 'int-6',
    name: 'Port number out to another provider (MNP)',
    l1: 'Cancellation & Retention',
    l2: 'Port-out Request',
    l3: 'UPC code generation block',
    volume: 976,
    confidence: 0.93,
    escalationRate: 57,
    resolutionRate: 39,
    holdReason: 'Retention discount matrix negotiation lookup',
    painPoint: 'UPC SMS delayed past 15-minute regulation window',
  },
  {
    id: 'int-7',
    name: 'Auto-pay failed but card is valid',
    l1: 'Billing & Payments',
    l2: 'Payment Gateway',
    l3: 'Recurring token mandate rejected',
    volume: 892,
    confidence: 0.91,
    escalationRate: 26,
    resolutionRate: 82,
    holdReason: 'Merchant gateway response code query',
    painPoint: 'Customer penalized with ₹250 late fee despite active e-mandate',
  },
  {
    id: 'int-8',
    name: 'Router replacement after plan upgrade',
    l1: 'Plan Changes & Upgrades',
    l2: 'Hardware Dispatch',
    l3: 'Wi-Fi 6 router delivery delay',
    volume: 640,
    confidence: 0.89,
    escalationRate: 15,
    resolutionRate: 86,
    holdReason: 'Warehouse stock confirmation for dual-band ONT',
    painPoint: 'Paid for 1 Gbps upgrade but still using older 100 Mbps single-band router',
  },
];

const TAXONOMY_TREE = [
  {
    l1: 'Billing & Payments',
    totalVolume: 7045,
    subClusters: [
      {
        l2: 'Dispute Handling',
        volume: 2410,
        nodes: ['Post-termination billing glitch', 'Double charge on invoice', 'Refund SLA breach'],
      },
      {
        l2: 'Payment Gateway & Mandates',
        volume: 2180,
        nodes: ['Recurring token mandate rejected', 'UPI mandate pending', 'Netbanking timeout'],
      },
      {
        l2: 'Promotion Discrepancy',
        volume: 1840,
        nodes: ['Expired discount coupon code', 'Free trial rollover billing', 'Hidden router rental charge'],
      },
    ],
  },
  {
    l1: 'Connectivity & Outages',
    totalVolume: 4445,
    subClusters: [
      {
        l2: 'Area Infrastructure',
        volume: 2540,
        nodes: ['Fiber optic cut in node sector 4', 'Local transformer power fault', 'Scheduled maintenance overrun'],
      },
      {
        l2: 'Bandwidth & Performance',
        volume: 1905,
        nodes: ['Contention ratio throttling', 'DNS resolution lag', 'High ping during online gaming'],
      },
    ],
  },
  {
    l1: 'Installation & Provisioning',
    totalVolume: 2545,
    subClusters: [
      {
        l2: 'Slot Booking & Rescheduling',
        volume: 1480,
        nodes: ['Technician availability check', 'Customer unavailable reschedule', 'Building society NOC delay'],
      },
      {
        l2: 'Hardware Provisioning',
        volume: 1065,
        nodes: ['Fiber drop cable shortage', 'ONT device serial binding', 'Wired Ethernet test failure'],
      },
    ],
  },
];

const PAIN_POINTS = [
  {
    id: 'pp-1',
    title: 'Repeated identity verification across department transfers',
    category: 'Verification & Auth',
    affectedVolume: 4820,
    frustrationScore: 84,
    rootCause: 'Caller authenticated in IVR, but authentication token is dropped when transferred to retention queue.',
    suggestedAction: 'Forward JWT authentication token into agent session context.',
  },
  {
    id: 'pp-2',
    title: 'Surprise charges after cancellation confirmation',
    category: 'Billing Policy',
    affectedVolume: 2640,
    frustrationScore: 92,
    rootCause: 'Cancellation order takes 48 hours to sync with automated billing engine; next cycle generated prematurely.',
    suggestedAction: 'Trigger immediate billing suspension upon cancellation order creation.',
  },
  {
    id: 'pp-3',
    title: 'Lack of proactive notification during localized fiber cuts',
    category: 'Outage Communication',
    affectedVolume: 3120,
    frustrationScore: 78,
    rootCause: 'NOC incidents are not automatically linked to customer MSISDN sector mapping for bulk SMS.',
    suggestedAction: 'Enable automated WhatsApp/SMS broadcast within 3 minutes of sector alarm.',
  },
  {
    id: 'pp-4',
    title: 'Mandatory technician visit for simple Wi-Fi SSID reconfiguration',
    category: 'Self-Service Deficit',
    affectedVolume: 1890,
    frustrationScore: 65,
    rootCause: 'Mobile app lacks remote TR-069 router management API trigger for non-tech-savvy users.',
    suggestedAction: 'Expose remote Wi-Fi credential reset tool via conversational agent.',
  },
];

const HOLD_REASONS = [
  {
    id: 'hr-1',
    reason: 'Supervisor override token for invoice credit adjustment > ₹2,500',
    avgDuration: '4m 15s',
    frequency: '34% of billing calls',
    bottleneck: 'Senior team leads handle approval requests asynchronously via internal chat.',
    automationOpportunity: 'High: Policy-based automated credit delegation for high-LTV customers.',
  },
  {
    id: 'hr-2',
    reason: 'Checking NOC network ticket dispatch and optical line terminal (OLT) telemetry',
    avgDuration: '3m 48s',
    frequency: '28% of outage calls',
    bottleneck: 'Agent switches between CRM and legacy network monitoring GUI to verify optical loss readings.',
    automationOpportunity: 'High: Real-time OLT telemetry fetch tool directly injected in agent workspace.',
  },
  {
    id: 'hr-3',
    reason: 'Retrieving original sales call recording / promo commitment from archive',
    avgDuration: '5m 10s',
    frequency: '18% of promo dispute calls',
    bottleneck: 'Cold storage audio archive retrieval latency takes up to 4 minutes.',
    automationOpportunity: 'Medium: Pre-indexed transcript summary linked to customer account history.',
  },
];

export default function Analysis() {
  useReveal();
  const toast = useToast();
  const { currentWorkspace, openNewRun } = useApp();

  const [activeTab, setActiveTab] = useState<TabView>('intents');
  const [ingestMode, setIngestMode] = useState<'batch' | 'stream'>('batch');
  const [streamActive, setStreamActive] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [clusterFilter, setClusterFilter] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('');

  // Advanced Options
  const [model, setModel] = useState('Gemini 2.5 Flash');
  const [clusterGranularity, setClusterGranularity] = useState('Balanced (L1/L2/L3)');
  const [piiRedaction, setPiiRedaction] = useState('Full redaction (PCI + PII)');

  const filteredIntents = useMemo(() => {
    return INTENT_DATA.filter((item) => {
      const matchesSearch =
        !search.trim() ||
        `${item.name} ${item.l1} ${item.l2} ${item.l3} ${item.painPoint}`.toLowerCase().includes(search.toLowerCase());
      const matchesCluster = !clusterFilter || clusterFilter === '__all__' || item.l1 === clusterFilter;
      const matchesConfidence =
        !confidenceFilter ||
        confidenceFilter === '__all__' ||
        (confidenceFilter === 'high' && item.confidence >= 0.94) ||
        (confidenceFilter === 'mid' && item.confidence < 0.94);
      return matchesSearch && matchesCluster && matchesConfidence;
    });
  }, [search, clusterFilter, confidenceFilter]);

  const handleHandoff = () => {
    toast(`Taxonomy snapshot approved & ready for CX Designers in Design studio`, 'flow');
  };

  return (
    <AppShell crumb="Intent Discovery">
      <main className="p-4 sm:p-6 lg:p-8 max-w-[1240px] mx-auto w-full pb-20 space-y-6" data-od-id="analysis-page">
        {/* Page Header with Action CTA */}
        <PageHeader
          title="Intent Discovery & Taxonomy"
          description={`Workspace: ${currentWorkspace.name} · Extract intents, resolutions, pain points, and build L1 → L2 → L3 clusters from customer interactions.`}
          dataOdId="page-title"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-1.5 h-9 text-xs sm:text-sm"
                onClick={() => openNewRun('extract_intents')}
              >
                <Icon name="search" className="w-3.5 h-3.5" />
                New Extraction
              </Button>
              <Button
                type="button"
                variant="accent"
                className="gap-1.5 h-9 text-xs sm:text-sm font-medium shadow-xs"
                onClick={handleHandoff}
              >
                <Icon name="check" className="w-3.5 h-3.5" />
                Approve & Hand off to Design
              </Button>
            </div>
          }
        />

        {/* Ingestion Source Switcher (Batch Upload vs Real-time Streaming Connector) */}
        <Card className="bg-surface border border-border p-4 rounded-xl shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-x-auto">
              <div className="flex rounded-lg border border-border bg-surface-inset/50 p-1 shrink-0">
                <Button
                  type="button"
                  variant={ingestMode === 'batch' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`h-7 px-3 text-xs font-medium ${ingestMode === 'batch' ? 'bg-surface shadow-xs text-foreground' : 'text-muted'}`}
                  onClick={() => setIngestMode('batch')}
                >
                  <Icon name="upload" className="w-3.5 h-3.5 mr-1.5" />
                  Batch File Upload
                </Button>
                <Button
                  type="button"
                  variant={ingestMode === 'stream' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`h-7 px-3 text-xs font-medium ${ingestMode === 'stream' ? 'bg-surface shadow-xs text-foreground' : 'text-muted'}`}
                  onClick={() => setIngestMode('stream')}
                >
                  <Icon name="bolt" className="w-3.5 h-3.5 mr-1.5 text-accent-strong" />
                  Real-time Stream Connector
                </Button>
              </div>
            </div>

            {ingestMode === 'batch' ? (
              <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted flex-wrap">
                <Badge variant="outline" className="border-border text-foreground font-mono text-[11px] py-0.5">
                  Genesys_March_Q1_Calls.csv
                </Badge>
                <span>18,442 calls</span>
                <span className="text-border">·</span>
                <span>Ingested 24 min ago</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap">
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                  <span className={`w-2 h-2 rounded-full ${streamActive ? 'bg-emerald-500 animate-pulse' : 'bg-muted'}`} />
                  Genesys Cloud Audio Websocket
                </span>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 text-[10px]">
                  42 calls/min
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs ml-auto"
                  onClick={() => {
                    setStreamActive(!streamActive);
                    toast(streamActive ? 'Streaming paused' : 'Live stream connected', 'bolt');
                  }}
                >
                  {streamActive ? 'Pause Stream' : 'Resume Stream'}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* 4 Core Discovery KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4 bg-surface border border-border rounded-xl">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-muted">Canonical Intents</div>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-1">286</div>
            <div className="text-xs text-muted mt-0.5">3,214 raw variants clustered</div>
          </Card>
          <Card className="p-4 bg-surface border border-border rounded-xl">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-muted">Avg Resolution Rate</div>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-1">74.2%</div>
            <div className="text-xs text-muted mt-0.5">FCR identified in transcripts</div>
          </Card>
          <Card className="p-4 bg-surface border border-border rounded-xl">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-muted">Top Pain Points</div>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-1">12 flagged</div>
            <div className="text-xs text-muted mt-0.5">Friction points driving churn</div>
          </Card>
          <Card className="p-4 bg-surface border border-border rounded-xl">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-muted">Taxonomy Clusters</div>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-1">6 L1 · 19 L2</div>
            <div className="text-xs text-muted mt-0.5">57 granular L3 leaf nodes</div>
          </Card>
        </div>

        {/* Main Tabs: Intents Ledger, Taxonomy Hierarchy, Pain Points, Hold Reasons */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabView)} className="w-full">
          <div className="border-b border-border mb-4 overflow-x-auto">
            <TabsList variant="line" className="w-max justify-start gap-4 h-10 bg-transparent p-0 whitespace-nowrap">
              <TabsTrigger value="intents" className="text-xs sm:text-sm font-medium">
                <Icon name="search" className="w-3.5 h-3.5 mr-1.5" />
                Intents Ledger ({filteredIntents.length})
              </TabsTrigger>
              <TabsTrigger value="taxonomy" className="text-xs sm:text-sm font-medium">
                <Icon name="chart" className="w-3.5 h-3.5 mr-1.5" />
                L1 → L2 → L3 Taxonomy
              </TabsTrigger>
              <TabsTrigger value="pain-points" className="text-xs sm:text-sm font-medium">
                <Icon name="warn" className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                Customer Pain Points ({PAIN_POINTS.length})
              </TabsTrigger>
              <TabsTrigger value="hold-reasons" className="text-xs sm:text-sm font-medium">
                <Icon name="clock" className="w-3.5 h-3.5 mr-1.5 text-muted" />
                Hold Reasons &amp; Bottlenecks ({HOLD_REASONS.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: Intents Ledger */}
          <TabsContent value="intents" className="m-0 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3 border border-border rounded-xl">
              <div className="relative flex-1 max-w-sm">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search intent, cluster, pain point..."
                  className="pl-9 h-8 text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <SelectField
                  value={clusterFilter}
                  onValueChange={setClusterFilter}
                  placeholder="All L1 clusters"
                  options={[
                    { value: '', label: 'All L1 clusters' },
                    'Billing & Payments',
                    'Connectivity & Outages',
                    'Installation & Provisioning',
                    'Cancellation & Retention',
                    'Plan Changes & Upgrades',
                  ]}
                  className="h-8 w-[170px] text-xs"
                />
                <SelectField
                  value={confidenceFilter}
                  onValueChange={setConfidenceFilter}
                  placeholder="All confidence"
                  options={[
                    { value: '', label: 'All confidence' },
                    { value: 'high', label: 'High confidence (≥0.94)' },
                    { value: 'mid', label: 'Mid confidence (<0.94)' },
                  ]}
                  className="h-8 w-[160px] text-xs"
                />
              </div>
            </div>

            <Card className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[840px]">
                  <TableHeader className="bg-surface-inset/50 border-b border-border">
                    <TableRow className="text-[11px] font-semibold uppercase tracking-wider text-muted hover:bg-transparent">
                      <TableHead className="px-4 py-3">Discovered Intent</TableHead>
                      <TableHead className="px-4 py-3">Taxonomy Cluster</TableHead>
                      <TableHead className="px-4 py-3 text-right">Volume</TableHead>
                      <TableHead className="px-4 py-3 text-center">Resolution</TableHead>
                      <TableHead className="px-4 py-3 text-center">Escalation</TableHead>
                      <TableHead className="px-4 py-3">Identified Customer Pain Point</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/60">
                    {filteredIntents.map((item) => (
                      <TableRow key={item.id} className="hover:bg-surface-hover/40 transition-colors">
                        <TableCell className="px-4 py-3">
                          <div className="font-semibold text-xs text-foreground">{item.name}</div>
                          <div className="text-[11px] text-muted font-mono mt-0.5">L3: {item.l3}</div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-inset border border-border text-[11px] font-medium text-foreground">
                            {item.l1} &rarr; {item.l2}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right tabular-nums text-xs font-mono">
                          {item.volume.toLocaleString()}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <Badge variant="outline" className={`text-[11px] font-medium ${item.resolutionRate >= 70 ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20'}`}>
                            {item.resolutionRate}%
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <span className={`text-[11px] font-mono font-medium ${item.escalationRate > 30 ? 'text-rose-500' : 'text-muted'}`}>
                            {item.escalationRate}%
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs text-muted max-w-[280px] truncate" title={item.painPoint}>
                          {item.painPoint}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 2: L1 -> L2 -> L3 Taxonomy Hierarchy */}
          <TabsContent value="taxonomy" className="m-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TAXONOMY_TREE.map((cluster) => (
                <Card key={cluster.l1} className="bg-surface border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{cluster.l1}</h4>
                      <p className="text-xs text-muted">L1 Domain Cluster</p>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono">
                      {cluster.totalVolume.toLocaleString()} calls
                    </Badge>
                  </div>

                  <div className="space-y-3 pt-1">
                    {cluster.subClusters.map((sub) => (
                      <div key={sub.l2} className="p-2.5 rounded-lg bg-surface-inset/60 border border-border/80 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-medium text-foreground">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-strong" />
                            L2: {sub.l2}
                          </span>
                          <span className="text-[11px] text-muted font-mono">{sub.volume}</span>
                        </div>
                        <div className="pl-3 border-l-2 border-border/70 space-y-1">
                          {sub.nodes.map((node) => (
                            <div key={node} className="text-[11px] text-muted hover:text-foreground transition-colors flex items-center gap-1.5">
                              <span className="text-border">&bull;</span>
                              <span>{node}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB 3: Customer Pain Points & Friction */}
          <TabsContent value="pain-points" className="m-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PAIN_POINTS.map((pp) => (
                <Card key={pp.id} className="p-4 bg-surface border border-border rounded-xl space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="outline" className="text-[10px] text-muted border-border mb-1">
                        {pp.category}
                      </Badge>
                      <h4 className="text-sm font-semibold text-foreground leading-snug">{pp.title}</h4>
                    </div>
                    <Badge variant="outline" className="text-xs border-rose-500/30 text-rose-600 bg-rose-500/10 font-mono shrink-0">
                      {pp.frustrationScore}% friction
                    </Badge>
                  </div>

                  <div className="text-xs space-y-1.5 bg-surface-inset/50 p-2.5 rounded-lg border border-border/60">
                    <div>
                      <span className="font-semibold text-foreground">Root Cause: </span>
                      <span className="text-muted">{pp.rootCause}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-accent-strong">Recommended CX Action: </span>
                      <span className="text-muted">{pp.suggestedAction}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted pt-1">
                    <span>Impact: <strong>{pp.affectedVolume.toLocaleString()}</strong> calls affected</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-accent-strong hover:text-accent-strong"
                      onClick={() => toast(`Created design task for "${pp.title}"`, 'flow')}
                    >
                      <Icon name="flow" className="w-3.5 h-3.5 mr-1" />
                      Map in Designer
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB 4: Hold Reasons & Bottlenecks */}
          <TabsContent value="hold-reasons" className="m-0 space-y-4">
            <div className="space-y-3">
              {HOLD_REASONS.map((hr) => (
                <Card key={hr.id} className="p-4 bg-surface border border-border rounded-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-surface-inset grid place-items-center text-muted">
                        <Icon name="clock" className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{hr.reason}</h4>
                        <p className="text-xs text-muted">{hr.frequency}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono border-amber-500/30 text-amber-600 bg-amber-500/10 self-start sm:self-auto">
                      Avg Hold: {hr.avgDuration}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs">
                    <div>
                      <span className="font-medium text-foreground block">System Bottleneck</span>
                      <span className="text-muted">{hr.bottleneck}</span>
                    </div>
                    <div>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400 block">Automation Potential</span>
                      <span className="text-muted">{hr.automationOpportunity}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Collapsible Advanced Extraction & Tuning Options */}
        <Accordion type="single" collapsible className="w-full border border-border rounded-xl bg-surface px-4 shadow-xs">
          <AccordionItem value="advanced-options" className="border-none">
            <AccordionTrigger className="text-xs sm:text-sm font-semibold text-muted hover:text-foreground py-3">
              <span className="flex items-center gap-2">
                <Icon name="gear" className="w-4 h-4 text-muted" />
                Advanced Pipeline Options (LLM Models, Clustering Thresholds & PII)
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-4 border-t border-border">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Extraction LLM Model</label>
                  <SelectField
                    value={model}
                    onValueChange={setModel}
                    options={['Gemini 2.5 Flash', 'Claude 3.5 Sonnet', 'GPT-4o mini']}
                    className="h-8 text-xs w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Clustering Granularity</label>
                  <SelectField
                    value={clusterGranularity}
                    onValueChange={setClusterGranularity}
                    options={['Coarse (L1 only)', 'Balanced (L1/L2/L3)', 'Fine (Deep Leaf Nodes)']}
                    className="h-8 text-xs w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">PII Masking Preset</label>
                  <SelectField
                    value={piiRedaction}
                    onValueChange={setPiiRedaction}
                    options={['Full redaction (PCI + PII)', 'Light redaction (PCI only)', 'Custom redaction']}
                    className="h-8 text-xs w-full"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </main>
    </AppShell>
  );
}
