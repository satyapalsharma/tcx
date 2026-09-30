'use client';

import { useState } from 'react';
import { Link } from '../lib/navigation';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { ProcessMapSvg } from '../components/ProcessMapSvg';
import { UmlSequenceSvg } from '../components/UmlSequenceSvg';
import { CloseButton, Dialog, Drawer, OpenButton, useOverlay } from '../components/Overlay';
import { ChipGroup } from '../components/ui';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';
import { PageHeader, StatusBadge } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MAPS = [
  { id: 'mi-billing', name: 'Billing Dispute Resolution', badge: 'bg-warn-soft text-warn-fg', status: 'In review', hint: 'v3 · from Invoice Disputes' },
  { id: 'mi-outage', name: 'Outage Triage & Status', badge: 'bg-surface-inset text-foreground', status: 'Needs review', hint: 'v1 · early draft' },
  { id: 'mi-install', name: 'New Installation Booking', badge: 'bg-success-soft text-success-fg', status: 'Approved', hint: 'v2 · yesterday' },
  { id: 'mi-portout', name: 'Port-out Retention', badge: 'bg-surface-inset text-muted', status: 'Not generated', hint: 'cluster approved' },
];

const NODES: Record<string, { name: string; aht: string; res: string; tool: string; desc: string; phrases: string[] }> = {
  'pn-start': { name: 'START · Call connected', aht: '—', res: '—', tool: 'ivr.entry(context)', desc: 'Entry point. Caller is routed from the Genesys IVR. If phone number matches a CRM record, account context comes in with the call.', phrases: ['—'] },
  'pn-auth': { name: 'Authenticate caller', aht: '42s', res: '91% first-try', tool: 'crm.verify_identity(msisdn, factor)', desc: 'Verify identity with the registered number plus one secondary factor — email OTP or last billed amount. After two failed tries, hand off to a human with partial context.', phrases: ['i forgot my customer id', 'verify me another way', 'why do you need that'] },
  'pn-fetch': { name: 'Fetch invoice', aht: '3s', res: '99.4% success', tool: 'crm.get_invoice(inv_98231)', desc: 'Pull the current invoice for the verified account. If the number is on multiple lines, ask which line the dispute is about.', phrases: ['my bill this month', 'the latest invoice', 'charges on my account'] },
  'pn-valid': { name: 'Dispute valid?', aht: '—', res: '63% valid', tool: 'policy.dispute_rules', desc: 'Valid if the charge appeared after the cancellation effective date, or a promo credit is missing past 30 days. Borderline routes to Billing Specialist with a summary.', phrases: ['—'] },
  'pn-credit': { name: 'Issue credit', aht: '4s', res: '₹212 avg credit', tool: 'billing.apply_credit(invoice_id, amount)', desc: 'Apply credit to the invoice and note it on the account. Anything above ₹2,500 requires a supervisor token before release.', phrases: ['—'] },
  'pn-confirm': { name: 'Send confirmation', aht: '12s', res: '98%', tool: 'comms.send_receipt(sms, email, ref)', desc: 'Summarise the adjustment verbally, send SMS and email with the reference number, and set a 7-day follow-up task.', phrases: ['—'] },
  'pn-end': { name: 'END · Case resolved', aht: '—', res: '—', tool: 'wrapup.tag(disposition)', desc: 'Close with a wrap-up code, trigger the CSAT prompt, and tag the disposition back into the intent ledger.', phrases: ['—'] },
  'pn-explain': { name: 'Explain charges', aht: '1m 35s', res: '37% accept', tool: 'kb.get_terms(plan_id)', desc: 'Walk the caller through disputed lines in plain language. Offer a one-time goodwill adjustment when sentiment dips.', phrases: ["that doesn't make sense", 'i disagree', 'never agreed to this'] },
  'pn-retain': { name: 'Escalate to retention', aht: 'handoff', res: '11% of calls', tool: 'queue.route(retention)', desc: 'Warm-transfer to the retention queue with full context and dispute summary. Only after the explanation is declined twice.', phrases: ['i want to cancel then', 'just close it'] },
};

const EX_HINT: Record<string, string> = {
  PNG: 'PNG raster of the current canvas at 2× resolution — good for slides and tickets.',
  SVG: 'SVG vector — editable in Figma or Illustrator, scales without loss.',
  PDF: 'PDF — map plus UML on separate pages, ready for sign-off packs.',
  JSON: 'JSON — structured map data: nodes, edges, bound tools, guardrails and metrics.',
  CSV: 'CSV — flat step table (node, type, tool, volume, handle time) for spreadsheets.',
};

export default function Design() {
  useReveal();
  const toast = useToast();
  const { open, close } = useOverlay();
  const [tab, setTab] = useState('pmap');
  const [activeMap, setActiveMap] = useState('mi-billing');
  const [mapStatus, setMapStatus] = useState<'review' | 'approved' | 'changes'>('review');
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [nodeDesc, setNodeDesc] = useState('');
  const [exportFmt, setExportFmt] = useState('PNG');
  const [exportName, setExportName] = useState('billing-dispute-design-v3');
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [severity, setSeverity] = useState('minor');
  const [exportScope, setExportScope] = useState('current');

  const openNode = (id: string) => {
    const d = NODES[id];
    if (!d) return;
    setActiveNode(id);
    setNodeDesc(d.desc);
    open('dw-node');
  };

  const pickMap = (id: string, name: string) => {
    setActiveMap(id);
    if (!name.startsWith('Billing')) {
      toast(`'${name}' — sample geometry stays Billing for this demo`, 'info');
    }
  };

  const node = activeNode ? NODES[activeNode] : null;
  const statusBadge = mapStatus === 'approved'
    ? { className: 'bg-success-soft text-success-fg', text: 'Approved · handed to Develop' }
    : mapStatus === 'changes'
      ? { className: 'bg-warn-soft text-warn-fg', text: 'Changes requested' }
      : { className: 'bg-warn-soft text-warn-fg', text: 'In review' };

  return (
    <AppShell
      crumb="Design"
      badge={
        <StatusBadge status="warn" pulse className="mr-2">
          RUN-4821 · Analysis 68%
        </StatusBadge>
      }
    >
      <div className="p-4 sm:p-6 lg:p-7 max-w-[1240px] mx-auto w-full pb-16" data-od-id="design-page">
        <PageHeader
          title="Design"
          description="Verify and edit process maps generated from approved Analysis clusters, then review the UML sequence headers before handing off to Develop."
          dataOdId="page-title"
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <OpenButton
                variant="outline"
                className="gap-2 h-9 px-3.5 text-xs sm:text-sm font-medium mr-1 cursor-pointer"
                target="dlg-export"
                data-od-id="export-btn"
              >
                <Icon name="download" className="w-4 h-4 text-muted" />Export
              </OpenButton>
              <OpenButton
                variant="warn"
                className="gap-2 h-9 px-3.5 text-xs sm:text-sm font-medium cursor-pointer"
                target="dlg-changes"
                data-od-id="request-changes-btn"
              >
                <Icon name="mail" className="w-4 h-4" />Request changes
              </OpenButton>
              <OpenButton
                variant="accent"
                className="gap-2 h-9 px-3.5 text-xs sm:text-sm font-medium cursor-pointer"
                target="dlg-approve"
                data-od-id="approve-btn"
              >
                <Icon name="check" className="w-4 h-4" />Approve &amp; hand off
              </OpenButton>
            </div>
          }
        />

        {/* Upstream Strip */}
        <div className="p-3.5 sm:px-4 bg-surface border border-border rounded-xl shadow-xs mb-4 flex items-center gap-3 flex-wrap" data-od-id="upstream-strip">
          <Icon name="lock" className="w-4 h-4 text-muted shrink-0" />
          <div className="text-xs flex-1 min-w-[200px]">
            <strong className="text-foreground">Inherited from Analysis · 4 approved clusters</strong>
            <div className="text-muted mt-0.5">Last verified by Riya Menon · 2 days ago. If upstream clusters change, maps are queued for regen — your edits stay as overlays.</div>
          </div>
          <div className="flex items-center gap-2 origin-right scale-90 sm:scale-95">
            <Link
              to="/analysis"
              title="View upstream clusters in Analysis"
              className="inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-medium rounded-full bg-success-soft text-success-fg hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="w-3.5 h-3.5 rounded-full bg-success text-white grid place-items-center">
                <Icon name="check" style={{ width: 9, height: 9 }} />
              </span>
              Analysis
            </Link>
            <span className="w-3.5 h-px bg-border shrink-0" />
            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-semibold rounded-full border border-foreground text-foreground bg-surface">
              <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse" />
              Design
            </span>
            <span className="w-3.5 h-px bg-border shrink-0" />
            <Link
              to="/develop"
              title="View agent codegen in Develop"
              className="inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-medium rounded-full border border-border text-muted bg-surface hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
            >
              Develop
            </Link>
          </div>
        </div>

        {/* 2-Column Work Area */}
        <div className="grid grid-cols-1 md:grid-cols-[268px_minmax(0,1fr)] gap-4 items-start" data-tab-scope>
          <div className="space-y-3 min-w-0">
            <Tabs value={tab} onValueChange={(v) => setTab(v as 'pmap' | 'uml')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 p-0.5 h-8 bg-surface-inset border border-border rounded-lg" data-tabs>
                <TabsTrigger
                  value="pmap"
                  data-tab="pmap"
                  data-od-id="tab-pmap"
                  className="h-7 text-xs font-medium rounded-md data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-xs data-[state=active]:font-semibold"
                >
                  Process maps <span className="ml-1 px-1.5 py-0.2 rounded-full bg-surface-inset text-[10px] font-mono text-muted">4</span>
                </TabsTrigger>
                <TabsTrigger
                  value="uml"
                  data-tab="uml"
                  data-od-id="tab-uml"
                  className="h-7 text-xs font-medium rounded-md data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-xs data-[state=active]:font-semibold"
                >
                  UML diagrams <span className="ml-1 px-1.5 py-0.2 rounded-full bg-surface-inset text-[10px] font-mono text-muted">2</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden divide-y divide-border" data-od-id="map-rail">
              {MAPS.map((m) => {
                const isSelected = activeMap === m.id;
                return (
                  <div
                    key={m.id}
                    className={`p-3 transition-colors cursor-pointer select-none ${
                      isSelected ? 'bg-surface-inset/80 border-l-2 border-foreground' : 'hover:bg-surface-hover/70'
                    }`}
                    data-od-id={m.id}
                    onClick={() => pickMap(m.id, m.name)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') pickMap(m.id, m.name); }}
                  >
                    <strong className="text-xs font-semibold text-foreground block">{m.name}</strong>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`inline-flex items-center gap-1.5 h-4.5 px-2 text-[11px] font-medium rounded-full ${m.badge}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />{m.status}
                      </span>
                      <span className="text-[11px] text-muted truncate">{m.hint}</span>
                    </div>
                  </div>
                );
              })}
              <div className="p-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full h-8 gap-1.5 cursor-pointer"
                  data-od-id="new-map-btn"
                  onClick={() => toast('Choose an approved cluster in Analysis first', 'info')}
                >
                  <Icon name="plus" className="w-3.5 h-3.5" />Generate new map
                </Button>
              </div>
            </div>
          </div>

          {tab === 'pmap' && (
            <div data-panel="pmap" data-od-id="panel-pmap">
              <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
                <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Billing Dispute Resolution <span className="text-muted font-normal">· v3</span>
                    </h3>
                    <div className="text-xs text-muted mt-0.5">
                      Generated from cluster &ldquo;Invoice Disputes&rdquo; (2,847 calls) · 5 tools · 2 sub-agent routes
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-medium rounded-full ${statusBadge.className}`} id="map-status">
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />{statusBadge.text}
                    </span>
                    <OpenButton
                      variant="outline"
                      size="sm"
                      className="gap-1.5 h-8 px-2.5 cursor-pointer"
                      target="dlg-export"
                    >
                      <Icon name="download" className="w-3.5 h-3.5 text-muted" />Export
                    </OpenButton>
                  </div>
                </div>
                <div className="p-4 sm:p-6 overflow-x-auto scrollbar-none flex justify-center bg-surface-inset/30">
                  <div className="w-full max-w-[800px] min-w-[580px]">
                    <ProcessMapSvg activeNode={activeNode} onNodeClick={openNode} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'uml' && (
            <div data-panel="uml" data-od-id="panel-uml">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_250px] gap-4 items-start">
                <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">UML sequence — Billing Dispute</h3>
                      <div className="text-xs text-muted mt-0.5">Synced with process map v3 · flow between user, orchestrator, tools</div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 h-8 px-2.5 cursor-pointer"
                      onClick={() => toast('Sequence regenerated from map v3', 'sync')}
                    >
                      <Icon name="sync" className="w-3.5 h-3.5 text-muted" />Regenerate
                    </Button>
                  </div>
                  <div className="p-4 sm:p-6 overflow-x-auto scrollbar-none">
                    <UmlSequenceSvg />
                  </div>
                </div>

                <div className="p-4 bg-surface border border-border rounded-xl shadow-xs space-y-3" data-od-id="uml-guardrails">
                  <div className="pb-2 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">Handoff guardrails</h3>
                  </div>
                  <div className="space-y-3 text-xs leading-relaxed">
                    <div>
                      <span className="text-muted block">Escalation agent joins after</span>
                      <span className="text-foreground font-medium">2 declined offers or account value &gt; ₹8,000/mo</span>
                    </div>
                    <div>
                      <span className="text-muted block">Tools in scope</span>
                      <span className="font-mono text-muted text-[11px] block mt-0.5">crm.get_customer · crm.get_invoice · billing.apply_credit · comms.send_receipt</span>
                    </div>
                    <div>
                      <span className="text-muted block">Coverage</span>
                      <span className="text-foreground font-medium">63% of disputes resolve without escalation</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-accent-border bg-accent-soft text-accent-strong flex items-start gap-2">
                      <Icon name="info" className="w-4 h-4 mt-0.5 shrink-0" />
                      <div className="text-[11.5px]">Ready for Develop — snapshot locks on approval. Regen keeps your overlays.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Node Inspector Drawer */}
      <Drawer id="dw-node" dataOdId="node-inspector">
        {node && (
          <>
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-muted">Process map node</div>
                <div id="node-name" className="text-sm sm:text-base font-bold text-foreground tracking-tight mt-0.5">{node.name}</div>
              </div>
              <CloseButton className="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer" title="Close">
                <Icon name="x" className="w-4 h-4" />
              </CloseButton>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-surface border border-border rounded-lg shadow-xs">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-muted">Avg. handle time</div>
                  <div className="font-mono text-base font-bold text-foreground mt-1" id="node-aht">{node.aht}</div>
                </div>
                <div className="p-3 bg-surface border border-border rounded-lg shadow-xs">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-muted">Resolution share</div>
                  <div className="font-mono text-base font-bold text-foreground mt-1" id="node-res">{node.res}</div>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-foreground tracking-wide mb-1">Bound tool</span>
                <div className="font-mono text-xs text-foreground bg-surface-inset border border-border rounded-md px-3 py-2 overflow-x-auto whitespace-nowrap" id="node-tool">
                  {node.tool}
                </div>
              </div>

              <div>
                <Label className="block text-xs font-semibold text-foreground tracking-wide mb-1" htmlFor="node-desc">
                  Step instructions (what the agent does here)
                </Label>
                <Textarea
                  className="w-full p-2.5 bg-surface text-xs sm:text-sm"
                  id="node-desc"
                  rows={4}
                  value={nodeDesc}
                  onChange={(e) => setNodeDesc(e.target.value)}
                />
                <span className="text-[11px] text-muted mt-1 block">Saving bumps the map to v3.1 and re-syncs the UML diagram.</span>
              </div>

              <div>
                <span className="block text-xs font-semibold text-foreground tracking-wide mb-1.5">Common caller phrases at this step</span>
                <div className="flex flex-wrap gap-1.5" id="node-phrases">
                  {node.phrases.map((p) => (
                    <span key={p} className="h-6 px-2.5 rounded-full border border-border bg-surface-inset text-xs text-foreground inline-flex items-center">
                      &ldquo;{p}&rdquo;
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-warn bg-warn-soft/80 text-warn-fg flex items-start gap-2 text-xs">
                <Icon name="warn" className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="leading-relaxed">
                  Upstream Analysis is re-running (RUN-4821 · 68%). Cluster drift over 5% queues a regen after you approve.
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border bg-surface-inset/40 flex items-center justify-end gap-2.5 rounded-b-xl">
              <CloseButton
                variant="outline"
                className="px-3.5 h-8.5 rounded-md text-foreground text-xs font-medium cursor-pointer"
              >
                Close
              </CloseButton>
              <Button
                type="button"
                variant="accent"
                className="px-3.5 h-8.5 rounded-md text-xs font-medium cursor-pointer"
                id="node-save"
                data-od-id="node-save"
                onClick={() => { close(); toast('Node saved — map v3.1 drafted, UML re-sync queued', 'check'); }}
              >
                Save changes
              </Button>
            </div>
          </>
        )}
      </Drawer>

      {/* Request Changes Dialog */}
      <Dialog id="dlg-changes" dataOdId="changes-dialog">
        <div className="p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground tracking-tight">Request changes</h2>
          <p className="text-xs text-muted mt-1">Goes back to the owning analyst with your comment.</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <span className="block text-xs font-semibold text-foreground tracking-wide mb-1.5">Severity</span>
            <ChipGroup
              value={severity}
              onChange={setSeverity}
              options={[
                { val: 'minor', label: 'Minor — wording only' },
                { val: 'major', label: 'Major — regenerate branch' },
              ]}
            />
          </div>
          <div>
            <Label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5" htmlFor="ch-note">What should change?</Label>
            <Textarea
              className="w-full p-2.5 bg-surface border-border text-xs sm:text-sm text-foreground focus-visible:border-accent"
              id="ch-note"
              rows={3}
              placeholder="e.g. Retention escalation should only trigger after two declined offers, not one."
            />
          </div>
        </div>
        <div className="p-4 border-t border-border bg-surface-inset/40 flex items-center justify-end gap-2.5 rounded-b-xl">
          <CloseButton
            variant="outline"
            className="px-3.5 h-8.5 rounded-md text-foreground text-xs font-medium cursor-pointer"
          >
            Cancel
          </CloseButton>
          <Button
            type="button"
            variant="accent"
            className="px-3.5 h-8.5 rounded-md text-xs font-medium cursor-pointer"
            id="ch-send"
            data-od-id="changes-send"
            onClick={() => { close(); setMapStatus('changes'); toast('Change request sent to Riya Menon (Analysis)', 'mail'); }}
          >
            Send request
          </Button>
        </div>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog id="dlg-approve" dataOdId="approve-dialog">
        <div className="p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground tracking-tight">Approve &amp; hand off to Develop</h2>
          <p className="text-xs text-muted mt-1">Both artifacts lock at the current version. The Develop umbrella gets a read-only snapshot.</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <span className="block text-xs font-semibold text-foreground tracking-wide mb-1.5">Approving</span>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 h-5.5 px-2.5 text-xs font-medium rounded-full bg-surface-inset border border-border text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />Process map v3 — Billing Dispute Resolution
              </span>
              <span className="inline-flex items-center gap-1.5 h-5.5 px-2.5 text-xs font-medium rounded-full bg-surface-inset border border-border text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />UML sequence — Billing Dispute v3
              </span>
            </div>
          </div>
          <div>
            <Label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5" htmlFor="ap-note">Handoff note (optional)</Label>
            <Textarea
              className="w-full p-2.5 bg-surface border-border text-xs sm:text-sm text-foreground focus-visible:border-accent"
              id="ap-note"
              rows={3}
              placeholder="e.g. Start with the Google ADK target — Bedrock follows next sprint."
            />
          </div>
        </div>
        <div className="p-4 border-t border-border bg-surface-inset/40 flex items-center justify-end gap-2.5 rounded-b-xl">
          <CloseButton
            variant="outline"
            className="px-3.5 h-8.5 rounded-md text-foreground text-xs font-medium cursor-pointer"
          >
            Cancel
          </CloseButton>
          <Button
            type="button"
            variant="accent"
            className="px-3.5 h-8.5 rounded-md text-xs font-medium cursor-pointer"
            id="ap-confirm"
            data-od-id="approve-confirm"
            onClick={() => { close(); setMapStatus('approved'); toast('Approved — snapshot v3 shared with Develop (Develop is next in the sidebar)', 'check'); }}
          >
            Approve &amp; notify Dev team
          </Button>
        </div>
      </Dialog>

      {/* Export Dialog */}
      <Dialog id="dlg-export" dataOdId="export-dialog">
        <div className="p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground tracking-tight">Export design data</h2>
          <p className="text-xs text-muted mt-1">Take the process maps and UML diagrams out of Transform.cx.</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <span className="block text-xs font-semibold text-foreground tracking-wide mb-1.5">What to export</span>
            <ChipGroup
              value={exportScope}
              onChange={setExportScope}
              options={[
                { val: 'current', label: 'Current map + UML' },
                { val: 'approved', label: 'All approved maps' },
                { val: 'full', label: 'Full design bundle' },
              ]}
            />
          </div>
          <div>
            <span className="block text-xs font-semibold text-foreground tracking-wide mb-1.5">Format</span>
            <ChipGroup
              value={exportFmt}
              onChange={setExportFmt}
              options={[
                { val: 'PNG', label: 'PNG' },
                { val: 'SVG', label: 'SVG' },
                { val: 'PDF', label: 'PDF' },
                { val: 'JSON', label: 'JSON' },
                { val: 'CSV', label: 'CSV' },
              ]}
            />
            <span className="text-[11px] text-muted mt-1 block" id="export-hint">{EX_HINT[exportFmt] ?? EX_HINT.PNG}</span>
          </div>
          <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-surface-inset">
            <div>
              <div className="text-xs font-semibold text-foreground">Include metrics &amp; call evidence</div>
              <div className="text-[11px] text-muted">Volume, handle time and confidence columns where available.</div>
            </div>
            <Switch checked={includeMetrics} onCheckedChange={setIncludeMetrics} aria-label="Include metrics" />
          </div>
          <div>
            <Label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5" htmlFor="export-name">File name</Label>
            <Input
              className="w-full h-9 px-3 bg-surface border-border text-xs sm:text-sm text-foreground focus-visible:border-accent"
              id="export-name"
              value={exportName}
              onChange={(e) => setExportName(e.target.value)}
            />
          </div>
        </div>
        <div className="p-4 border-t border-border bg-surface-inset/40 flex items-center justify-end gap-2.5 rounded-b-xl">
          <CloseButton
            variant="outline"
            className="px-3.5 h-8.5 rounded-md text-foreground text-xs font-medium cursor-pointer"
          >
            Cancel
          </CloseButton>
          <Button
            type="button"
            variant="accent"
            className="gap-1.5 px-3.5 h-8.5 rounded-md text-xs font-medium cursor-pointer"
            id="export-confirm"
            data-od-id="export-confirm"
            onClick={() => { close(); toast(`${exportName}.${exportFmt.toLowerCase()} downloading`, 'download'); }}
          >
            <Icon name="download" className="w-3.5 h-3.5" />Export
          </Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
