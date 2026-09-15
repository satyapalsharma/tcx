import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { ProcessMapSvg } from '../components/ProcessMapSvg';
import { UmlSequenceSvg } from '../components/UmlSequenceSvg';
import { CloseButton, Dialog, Drawer, OpenButton, useOverlay } from '../components/Overlay';
import { ChipGroup, Switch } from '../components/ui';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';

const MAPS = [
  { id: 'mi-billing', name: 'Billing Dispute Resolution', badge: 'badge-warn', status: 'In review', hint: 'v3 · from Invoice Disputes' },
  { id: 'mi-outage', name: 'Outage Triage & Status', badge: '', status: 'Needs review', hint: 'v1 · early draft' },
  { id: 'mi-install', name: 'New Installation Booking', badge: 'badge-ok', status: 'Approved', hint: 'v2 · yesterday' },
  { id: 'mi-portout', name: 'Port-out Retention', badge: '', status: 'Not generated', hint: 'cluster approved' },
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
    ? { className: 'badge badge-ok', text: 'Approved · handed to Develop' }
    : mapStatus === 'changes'
      ? { className: 'badge badge-warn badge-run', text: 'Changes requested' }
      : { className: 'badge badge-warn', text: 'In review' };

  return (
    <AppShell crumb="Design" badge={<span className="badge badge-warn badge-run"><span className="dot" />RUN-4821 · Analysis 68%</span>}>
      <div className="page" data-od-id="design-page">
        <div className="page-h">
          <div style={{ flex: 1 }}>
            <h1 data-od-id="page-title">Design</h1>
            <p className="sub">Verify and edit process maps generated from approved Analysis clusters, then review the UML sequence headers before handing off to Develop.</p>
          </div>
          <OpenButton className="btn" target="dlg-export" data-od-id="export-btn"><Icon name="download" />Export</OpenButton>
          <OpenButton className="btn" target="dlg-changes" data-od-id="request-changes-btn"><Icon name="mail" />Request changes</OpenButton>
          <OpenButton className="btn btn-primary" target="dlg-approve" data-od-id="approve-btn"><Icon name="check" />Approve &amp; hand off</OpenButton>
        </div>

        <div className="card card-b" style={{ marginBottom: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }} data-od-id="upstream-strip">
          <Icon name="lock" style={{ color: 'var(--muted)' }} />
          <div style={{ fontSize: '12.5px', flex: 1 }}>
            <strong>Inherited from Analysis · 4 approved clusters</strong>
            <div className="hint">Last verified by Riya Menon · 2 days ago. If upstream clusters change, maps are queued for regen — your edits stay as overlays.</div>
          </div>
          <div className="stage-flow">
            <span className="snode done"><span className="glyph"><Icon name="check" style={{ width: 10, height: 10 }} /></span>Analysis</span>
            <span className="slink" />
            <span className="snode live"><span className="glyph"><span className="mini" /></span>Design</span>
            <span className="slink" />
            <span className="snode"><span className="glyph" />Develop</span>
          </div>
        </div>

        <div className="dm-grid" data-tab-scope>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            <div className="tabs" style={{ borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface)' }} data-tabs>
              <button type="button" role="tab" aria-selected={tab === 'pmap'} data-tab="pmap" data-od-id="tab-pmap" onClick={() => setTab('pmap')}>Process maps <span className="count">4</span></button>
              <button type="button" role="tab" aria-selected={tab === 'uml'} data-tab="uml" data-od-id="tab-uml" onClick={() => setTab('uml')}>UML diagrams <span className="count">2</span></button>
            </div>
            <div className="card maps-rail" data-od-id="map-rail">
              {MAPS.map((m) => (
                <div key={m.id} className={`mi${activeMap === m.id ? ' on' : ''}`} data-od-id={m.id} onClick={() => pickMap(m.id, m.name)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') pickMap(m.id, m.name); }}>
                  <strong style={{ fontSize: '12.5px' }}>{m.name}</strong>
                  <div className="row" style={{ gap: 6 }}>
                    <span className={`badge${m.badge ? ` ${m.badge}` : ''}`}><span className="dot" />{m.status}</span>
                    <span className="hint" style={{ fontSize: 11 }}>{m.hint}</span>
                  </div>
                </div>
              ))}
              <div style={{ padding: '10px 12px' }}>
                <button type="button" className="btn btn-sm" style={{ width: '100%', justifyContent: 'center' }} data-od-id="new-map-btn" onClick={() => toast('Choose an approved cluster in Analysis first', 'info')}><Icon name="plus" />Generate new map</button>
              </div>
            </div>
          </div>

          {tab === 'pmap' && (
            <div data-panel="pmap" data-od-id="panel-pmap">
              <div className="card">
                <div className="card-h" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h3 style={{ fontSize: 14 }}>Billing Dispute Resolution <span className="muted" style={{ fontWeight: 460 }}>· v3</span></h3>
                    <div className="hint" style={{ fontSize: '11.5px' }}>Generated from cluster &ldquo;Invoice Disputes&rdquo; (2,847 calls) · 5 tools · 2 sub-agent routes</div>
                  </div>
                  <div className="stage-acts">
                    <span className={statusBadge.className} id="map-status"><span className="dot" />{statusBadge.text}</span>
                    <OpenButton className="btn btn-sm" target="dlg-export"><Icon name="download" />Export</OpenButton>
                  </div>
                </div>
                <div className="card-b">
                  <div className="canvas-box">
                    <ProcessMapSvg activeNode={activeNode} onNodeClick={openNode} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'uml' && (
            <div data-panel="uml" data-od-id="panel-uml">
              <div className="ud-grid">
                <div className="card">
                  <div className="card-h" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: 14 }}>UML sequence — Billing Dispute</h3>
                      <div className="hint" style={{ fontSize: '11.5px' }}>Synced with process map v3 · information flow between user, orchestrator, tools and sub-agents</div>
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                      <button type="button" className="btn btn-sm" onClick={() => toast('Sequence regenerated from map v3', 'sync')}><Icon name="sync" />Regenerate</button>
                    </div>
                  </div>
                  <div className="card-b">
                    <div className="canvas-box">
                      <UmlSequenceSvg />
                    </div>
                  </div>
                </div>
                <div className="card" data-od-id="uml-guardrails">
                  <div className="card-h"><h3>Handoff guardrails</h3></div>
                  <div className="card-b meta-list">
                    <div><span className="k">Escalation agent joins after</span><br />2 declined offers or account value &gt; ₹8,000/mo</div>
                    <div><span className="k">Tools in scope</span><br /><span className="mono" style={{ fontSize: '11.5px' }}>crm.get_customer · crm.get_invoice · billing.apply_credit · comms.send_receipt</span></div>
                    <div><span className="k">Coverage</span><br />63% of disputes resolve without the escalation path</div>
                    <div className="rag-row" style={{ border: '1px solid var(--accent-border)', background: 'var(--accent-soft)', borderRadius: 8, padding: '10px 12px', gap: 8 }}>
                      <Icon name="info" style={{ color: 'var(--accent-strong)', marginTop: 1 }} />
                      <div style={{ fontSize: 12, color: 'var(--accent-strong)' }}>Ready for Develop — snapshot locks on approval. Regen keeps your overlays.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Drawer id="dw-node" data-od-id="node-inspector">
        {node && (
          <>
            <div className="drawer-h">
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="caps">Process map node</div>
                <div id="node-name" style={{ fontSize: 15, fontWeight: 620, letterSpacing: '-0.01em', marginTop: 2 }}>{node.name}</div>
              </div>
              <CloseButton className="icon-btn" title="Close"><Icon name="x" /></CloseButton>
            </div>
            <div className="drawer-b">
              <div className="grid-2" style={{ marginBottom: 14 }}>
                <div className="card" style={{ padding: '10px 12px' }}><div className="caps" style={{ fontSize: 10 }}>Avg. handle time</div><div className="tabular" id="node-aht" style={{ fontSize: 15, fontWeight: 620, marginTop: 3 }}>{node.aht}</div></div>
                <div className="card" style={{ padding: '10px 12px' }}><div className="caps" style={{ fontSize: 10 }}>Resolution share</div><div className="tabular" id="node-res" style={{ fontSize: 15, fontWeight: 620, marginTop: 3 }}>{node.res}</div></div>
              </div>
              <div className="field" style={{ marginBottom: 12 }}>
                <span className="label">Bound tool</span>
                <div className="mono" id="node-tool" style={{ background: 'var(--surface-inset)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', whiteSpace: 'nowrap', overflow: 'auto' }}>{node.tool}</div>
              </div>
              <div className="field" style={{ marginBottom: 12 }}>
                <label className="label" htmlFor="node-desc">Step instructions (what the agent does here)</label>
                <textarea className="input" id="node-desc" rows={4} value={nodeDesc} onChange={(e) => setNodeDesc(e.target.value)} />
                <span className="hint">Saving bumps the map to v3.1 and re-syncs the UML diagram.</span>
              </div>
              <div className="field" style={{ marginBottom: 12 }}>
                <span className="label">Common caller phrases at this step</span>
                <div className="row" id="node-phrases" style={{ gap: 6, flexWrap: 'wrap' }}>
                  {node.phrases.map((p) => (
                    <span key={p} className="chip" style={{ cursor: 'default' }} aria-pressed="false">&ldquo;{p}&rdquo;</span>
                  ))}
                </div>
              </div>
              <div className="rag-row" style={{ border: '1px solid var(--warn)', background: 'var(--warn-soft)', borderRadius: 8, padding: '10px 12px', gap: 8 }}>
                <Icon name="warn" style={{ color: 'var(--warn-fg)', marginTop: 1 }} />
                <div style={{ fontSize: 12, color: 'var(--warn-fg)' }}>Upstream Analysis is re-running (RUN-4821 · 68%). Cluster drift over 5% queues a regen after you approve — your overlays persist.</div>
              </div>
            </div>
            <div className="drawer-f">
              <CloseButton className="btn">Close</CloseButton>
              <button type="button" className="btn btn-primary" id="node-save" data-od-id="node-save" onClick={() => { close(); toast('Node saved — map v3.1 drafted, UML re-sync queued', 'check'); }}>Save changes</button>
            </div>
          </>
        )}
      </Drawer>

      <Dialog id="dlg-changes" data-od-id="changes-dialog">
        <div className="dialog-h">
          <h2>Request changes</h2>
          <p className="hint">Goes back to the owning analyst with your comment. Major asks re-run the branch — long-running jobs show in the top bar.</p>
        </div>
        <div className="dialog-b">
          <div className="field">
            <span className="label">Severity</span>
            <ChipGroup value={severity} onChange={setSeverity} options={[
              { val: 'minor', label: 'Minor — wording only' },
              { val: 'major', label: 'Major — regenerate branch' },
            ]} />
          </div>
          <div className="field">
            <label className="label" htmlFor="ch-note">What should change?</label>
            <textarea className="input" id="ch-note" rows={3} placeholder="e.g. Retention escalation should only trigger after two declined offers, not one." />
          </div>
        </div>
        <div className="dialog-f">
          <CloseButton className="btn">Cancel</CloseButton>
          <button type="button" className="btn btn-primary" id="ch-send" data-od-id="changes-send" onClick={() => { close(); setMapStatus('changes'); toast('Change request sent to Riya Menon (Analysis)', 'mail'); }}>Send request</button>
        </div>
      </Dialog>

      <Dialog id="dlg-approve" data-od-id="approve-dialog">
        <div className="dialog-h">
          <h2>Approve &amp; hand off to Develop</h2>
          <p className="hint">Both artifacts lock at the current version. The Develop umbrella gets a read-only snapshot it can generate code against.</p>
        </div>
        <div className="dialog-b">
          <div className="field">
            <span className="label">Approving</span>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              <span className="badge"><span className="dot" />Process map v3 — Billing Dispute Resolution</span>
              <span className="badge"><span className="dot" />UML sequence — Billing Dispute v3</span>
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="ap-note">Handoff note (optional)</label>
            <textarea className="input" id="ap-note" rows={3} placeholder="e.g. Start with the Google ADK target — Bedrock follows next sprint." />
          </div>
        </div>
        <div className="dialog-f">
          <CloseButton className="btn">Cancel</CloseButton>
          <button type="button" className="btn btn-primary" id="ap-confirm" data-od-id="approve-confirm" onClick={() => { close(); setMapStatus('approved'); toast('Approved — snapshot v3 shared with Develop (Develop is next in the sidebar)', 'check'); }}>Approve &amp; notify Dev team</button>
        </div>
      </Dialog>

      <Dialog id="dlg-export" data-od-id="export-dialog">
        <div className="dialog-h">
          <h2>Export design data</h2>
          <p className="hint">Take the process maps and UML diagrams out of Transform.cx — as diagrams for documentation, or as structured data for your own tooling.</p>
        </div>
        <div className="dialog-b">
          <div className="field">
            <span className="label">What to export</span>
            <ChipGroup value={exportScope} onChange={setExportScope} options={[
              { val: 'current', label: 'Current map + UML' },
              { val: 'approved', label: 'All approved maps' },
              { val: 'full', label: 'Full design bundle' },
            ]} />
          </div>
          <div className="field">
            <span className="label">Format</span>
            <ChipGroup value={exportFmt} onChange={setExportFmt} options={[
              { val: 'PNG', label: 'PNG' }, { val: 'SVG', label: 'SVG' }, { val: 'PDF', label: 'PDF' }, { val: 'JSON', label: 'JSON' }, { val: 'CSV', label: 'CSV' },
            ]} />
            <span className="hint" id="export-hint">{EX_HINT[exportFmt] ?? EX_HINT.PNG}</span>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div><div className="label">Include metrics &amp; call evidence</div><div className="hint">Volume, handle time and confidence columns where available.</div></div>
            <Switch checked={includeMetrics} onChange={setIncludeMetrics} label="Include metrics" />
          </div>
          <div className="field">
            <label className="label" htmlFor="export-name">File name</label>
            <input className="input" id="export-name" value={exportName} onChange={(e) => setExportName(e.target.value)} />
          </div>
        </div>
        <div className="dialog-f">
          <CloseButton className="btn">Cancel</CloseButton>
          <button type="button" className="btn btn-primary" id="export-confirm" data-od-id="export-confirm" onClick={() => { close(); toast(`${exportName}.${exportFmt.toLowerCase()} downloading`, 'download'); }}><Icon name="download" />Export</button>
        </div>
      </Dialog>
    </AppShell>
  );
}
