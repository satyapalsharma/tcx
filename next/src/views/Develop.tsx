'use client';

import { useCallback, useRef, useState } from 'react';
import { Link } from '../lib/navigation';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { CloseButton, Dialog, OpenButton, useOverlay } from '../components/Overlay';
import { Switch, Tabs } from '../components/ui';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';

const TARGETS = [
  { id: 'adk', name: 'Google ADK', desc: 'Python agents with FunctionTools, direct Vertex AI deploy.', badge: 'badge-acc', badgeText: 'Recommended' },
  { id: 'cx', name: 'CX Agent Studio', desc: 'Google Contact Center AI flows and playbooks.', badge: 'badge', badgeText: 'Flows' },
  { id: 'bedrock', name: 'Amazon Bedrock', desc: 'Agents for Bedrock with action groups wired to Lambda tools.', badge: 'badge', badgeText: 'AWS stack' },
  { id: 'langgraph', name: 'LangGraph', desc: 'Stateful graph runtime, bring-your-own LLM with checkpoints.', badge: 'badge', badgeText: 'OSS' },
];

const FILES: Record<string, string> = {
  agent: `<span class="c-c"># Generated from process map v3 — Billing Dispute Resolution</span>
<span class="c-c"># Snapshot: approved by Devika Sharma · UML v3 · 5 tools · 2 sub-agent routes</span>

<span class="c-k">from</span> google.adk <span class="c-k">import</span> Agent
<span class="c-k">from</span> google.adk.tools <span class="c-k">import</span> FunctionTool
<span class="c-k">from</span> policies <span class="c-k">import</span> GUARDRAILS

billing_dispute_agent = <span class="c-f">Agent</span>(
    name=<span class="c-s">"billing_dispute_agent"</span>,
    model=<span class="c-s">"gemini-2.0-flash"</span>,
    instruction=<span class="c-s">"""Resolve billing disputes. Verify identity, fetch the
       invoice, check dispute_rules, apply credit inside guardrails.
       Escalate to retention after two declined offers."""</span>,
    tools=GUARDRAILS.wired_tools,
)`,
  tools: `<span class="c-c"># tools.py — bound tools with scopes from the UML diagram</span>

<span class="c-k">async def</span> <span class="c-f">get_invoice</span>(msisdn: <span class="c-t">str</span>) -> <span class="c-t">dict</span>:
    <span class="c-c">"""Fetch the current invoice for the verified account."""</span>
    <span class="c-k">return</span> crm.invoices.latest(msisdn=msisdn)

<span class="c-k">async def</span> <span class="c-f">apply_credit</span>(invoice_id: <span class="c-t">str</span>, amount: <span class="c-t">float</span>) -> <span class="c-t">dict</span>:
    <span class="c-k">if</span> amount > <span class="c-n">2500</span>:
        <span class="c-k">return</span> <span class="c-f">escalate</span>(reason=<span class="c-s">"supervisor_token_required"</span>)
    <span class="c-k">return</span> billing.credit(invoice_id=invoice_id, amount=amount)

<span class="c-k">async def</span> <span class="c-f">route_retention</span>(context: <span class="c-t">dict</span>) -> <span class="c-t">dict</span>:
    <span class="c-k">return</span> queue.route(<span class="c-s">"retention"</span>, context=context)`,
  policy: `<span class="c-c"># policies.py — guardrails baked into the build</span>

GUARDRAILS = <span class="c-t">dict</span>(
    credit_cap_inr=<span class="c-n">2500</span>,
    max_agent_turns=<span class="c-n">14</span>,
    redact_pii=<span class="c-k">True</span>,
    escalation=<span class="c-t">dict</span>(
        after_declined_offers=<span class="c-n">2</span>,
        queue=<span class="c-s">"retention"</span>,
        carry_context=<span class="c-k">True</span>,
    ),
)`,
  test: `<span class="c-c"># tests/test_flow.py — happy path + 3 edge cases</span>

<span class="c-k">class</span> <span class="c-t">TestBillingDispute</span>:

    <span class="c-k">def</span> <span class="c-f">test_valid_dispute_gets_credit</span>(self):
        out = run_scenario(<span class="c-s">"charged_after_cancel"</span>)
        <span class="c-k">assert</span> out.tool_calls[<span class="c-s">"apply_credit"</span>].amount == <span class="c-n">412.0</span>

    <span class="c-k">def</span> <span class="c-f">test_over_cap_escalates</span>(self):
        out = run_scenario(<span class="c-s">"credit_above_2500"</span>)
        <span class="c-k">assert</span> out.last_action == <span class="c-s">"escalate"</span>

    <span class="c-k">def</span> <span class="c-f">test_two_declines_route_retention</span>(self):
        out = run_scenario(<span class="c-s">"declined_twice"</span>)
        <span class="c-k">assert</span> out.queue == <span class="c-s">"retention"</span>`,
};

const GEN_STEPS = [
  { label: 'Scaffold agent package', meta: 'agent.py · state.py · tools.py' },
  { label: 'Wire tools and sub-agent routes', meta: '5 tools · 2 queues' },
  { label: 'Apply guardrails policy', meta: 'credit cap + escalation rules' },
  { label: 'Unit tests', meta: 'happy path + 3 edge cases' },
];

const GAP_TYPES = ['Wording', 'Missing step', 'Wrong tool / data', 'Guardrail gap'];

type ChatMsg = { who: string; text: string; isBot: boolean; typing?: boolean };
type Gap = { sev: string; note: string; quote: string };

function agentReply(q: string) {
  const s = q.toLowerCase();
  if (s.includes('hi') || s.includes('hello')) return "Hello — you're through to the Skyline billing agent. I can help with invoice disputes, credits and cancellations. What's the issue today?";
  if (s.includes('cancel') || s.includes('still')) return 'I can see the line was cancelled on 12 June, but billing continued to 31 July. I can apply a pro-rata credit of ₹412.00 to invoice INV-98231 — shall I go ahead?';
  if (s.includes('credit') || s.includes('refund') || s.includes('apply')) return 'Credit of ₹412.00 applied to invoice INV-98231. A confirmation is on its way by SMS and email with reference SBB-2026-44817.';
  if (s.includes('supervisor') || s.includes('human') || s.includes('escalate')) return "I'll pass this to a supervisor with the full transcript and the invoice in context so you don't have to repeat anything.";
  if (s.includes('port')) return "Port-out needs a UPC code. I can generate one valid for 30 days and email it, or hold the port if you'd like to talk about retention first.";
  return 'Let me check the account. I can see the last invoice and the plan history — could you confirm the phone number the account is under?';
}

export default function Develop() {
  useReveal();
  const toast = useToast();
  const { open, close } = useOverlay();
  const chatRef = useRef<HTMLDivElement>(null);

  const [target, setTarget] = useState('Google ADK');
  const [file, setFile] = useState('agent');
  const [genLive, setGenLive] = useState(false);
  const [genPct, setGenPct] = useState(2);
  const [genStage, setGenStage] = useState(0);
  const [showRow143, setShowRow143] = useState(false);
  const [includeTests, setIncludeTests] = useState(true);
  const [applyGuardrails, setApplyGuardrails] = useState(true);

  const [deployed, setDeployed] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployBadge, setDeployBadge] = useState<'idle' | 'deploying' | 'live'>('idle');

  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [improve, setImprove] = useState(false);
  const [improveHint, setImproveHint] = useState('Turn on “Improve experience”, then click any agent reply to attach a gap pointer.');
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [pendingGap, setPendingGap] = useState('');
  const [gapType, setGapType] = useState('Wording');
  const [gapNote, setGapNote] = useState('');

  const startGeneration = useCallback(() => {
    close();
    setGenLive(true);
    setGenPct(2);
    setGenStage(0);
    let p = 2;
    const tick = () => {
      p += Math.floor(3 + Math.random() * 5);
      if (p > 100) p = 100;
      setGenPct(p);
      const stage = p < 30 ? 0 : p < 62 ? 1 : p < 86 ? 2 : 3;
      setGenStage(stage);
      if (p < 100) {
        setTimeout(tick, 200);
      } else {
        setGenStage(4);
        setShowRow143(true);
        toast('ADK-0143 ready — 4/4 tests passing', 'check');
        setTimeout(() => setGenLive(false), 1800);
      }
    };
    setTimeout(tick, 220);
  }, [close, toast]);

  const startDeploy = useCallback(() => {
    if (deployBadge === 'live') {
      toast('Already live on staging — use Redeploy for a new revision', 'info');
      return;
    }
    setDeploying(true);
    setDeployBadge('deploying');
    setTimeout(() => {
      setDeployed(true);
      setDeploying(false);
      setDeployBadge('live');
      setChat([{ who: 'Skyline billing agent', text: "Hello — you're through to the Skyline billing agent. I can help with invoice disputes, credits and cancellations. What's the issue today?", isBot: true }]);
      toast('ADK-0143 deployed to staging — revision 00014 live', 'rocket');
    }, 1600);
  }, [deployBadge, toast]);

  const sendChat = () => {
    const q = chatInput.trim();
    if (!q) return;
    setChat((c) => [...c, { who: 'You', text: q, isBot: false }]);
    setChatInput('');
    setChat((c) => [...c, { who: 'Skyline billing agent', text: '', isBot: true, typing: true }]);
    setTimeout(() => {
      setChat((c) => {
        const next = c.filter((m) => !m.typing);
        return [...next, { who: 'Skyline billing agent', text: agentReply(q), isBot: true }];
      });
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
    }, 850);
  };

  const markGap = (text: string) => {
    setPendingGap(text);
    setGapNote('');
    setGapType('Wording');
    open('dlg-gap');
  };

  const saveGap = () => {
    setGaps((g) => [...g, { sev: gapType, note: gapNote.trim() || '(no note added)', quote: pendingGap }]);
    close();
    toast("Pointer added — send gaps to Design when you're done", 'flag');
  };

  const stepIcon = (i: number) => {
    if (genStage > i) return 'check';
    if (genStage === i) return 'sync';
    return 'dot';
  };

  const stepClass = (i: number) => {
    if (genStage > i) return 'st done';
    if (genStage === i) return 'st run';
    return 'st';
  };

  return (
    <AppShell
      middleCrumb="Skyline Broadband — Winter CX"
      crumb="Develop"
      badge={<span className="badge badge-ok"><span className="dot" />Snapshot v3 locked</span>}
    >
      <div className="page" data-od-id="develop-page">
        <div className="page-h">
          <div style={{ flex: 1 }}>
            <h1 data-od-id="page-title">Develop</h1>
            <p className="sub">Generate production agent code from the approved process map and UML snapshot. Pick a target runtime, review the scaffold, then deploy to staging.</p>
          </div>
          <button type="button" className="btn" onClick={() => toast('Runtime docs open in vendor documentation (stub for demo)', 'ext')}><Icon name="ext" />Runtime docs</button>
          <OpenButton className="btn btn-primary" target="dlg-gen" data-od-id="generate-btn"><Icon name="bolt" />Generate agent build</OpenButton>
        </div>

        <div className="card card-b" style={{ marginBottom: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }} data-od-id="handoff-banner">
          <Icon name="check" style={{ color: 'var(--success)' }} />
          <div style={{ fontSize: '12.5px', flex: 1, minWidth: 220 }}>
            <strong>From Design · approved 1 h ago by Devika Sharma</strong>
            <div className="hint">Process map v3 (Billing Dispute Resolution) + UML sequence v3 — read-only snapshot. Source edits in Design queue a new snapshot.</div>
          </div>
          <div className="stage-flow">
            <span className="snode done"><span className="glyph"><Icon name="check" style={{ width: 10, height: 10 }} /></span>Analysis</span>
            <span className="slink" />
            <span className="snode done"><span className="glyph"><Icon name="check" style={{ width: 10, height: 10 }} /></span>Design</span>
            <span className="slink" />
            <span className="snode live"><span className="glyph"><span className="mini" /></span>Develop</span>
          </div>
        </div>

        <h2 style={{ fontSize: '13.5px', fontWeight: 600, marginBottom: 10 }} data-od-id="target-heading">1 · Choose target runtime</h2>
        <div className="tg-grid" data-od-id="target-grid">
          {TARGETS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tg-card${target === t.name ? ' on' : ''}`}
              data-od-id={`tg-${t.id}`}
              onClick={() => setTarget(t.name)}
            >
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong style={{ fontSize: 13 }}>{t.name}</strong>
                <span className="tick"><Icon name="check" style={{ width: 11, height: 11 }} /></span>
              </div>
              <span className="muted" style={{ fontSize: 12 }}>{t.desc}</span>
              <span className={`badge ${t.badge}`} style={{ alignSelf: 'flex-start' }}><span className="dot" />{t.badgeText}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 16, alignItems: 'start' }} data-od-id="develop-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            <div className="card" data-od-id="builds-card">
              <div className="card-h"><h3>2 · Generate &amp; track builds</h3></div>
              <div className={`gen-live card-b${genLive ? ' on' : ''}`} style={{ paddingTop: 12 }}>
                <div className="row" style={{ justifyContent: 'space-between', fontSize: '12.5px', marginBottom: 6 }}>
                  <strong>GEN-0143 — generating {genLive ? `${target} build from snapshot v3` : 'from snapshot v3'}</strong>
                  <span className="tabular muted">{genPct}%</span>
                </div>
                <div className="meter"><div className="track"><div className="fill" style={{ width: `${genPct}%` }} /></div></div>
                <div className="divider" style={{ margin: '12px 0 4px' }} />
                {GEN_STEPS.map((step, i) => (
                  <div key={step.label} className={`bstep${genStage < i && genLive ? ' muted' : ''}`}>
                    <span className={stepClass(i)}><Icon name={stepIcon(i)} /></span>
                    {step.label}
                    <span className="tabular muted" style={{ fontSize: 12 }}>{step.meta}</span>
                  </div>
                ))}
              </div>
              <table className="table" style={{ marginTop: 6 }}>
                <thead><tr><th>Build</th><th>Runtime</th><th>From</th><th className="num">Tests</th><th>Status</th><th>Created</th><th style={{ width: 84 }} /></tr></thead>
                <tbody>
                  {showRow143 && (
                    <tr>
                      <td className="mono">ADK-0143</td><td>Google ADK</td><td className="mono">map v3</td><td className="num">4/4</td>
                      <td><span className="badge badge-ok"><span className="dot" />Ready</span></td><td className="muted">just now</td>
                      <td><button type="button" className="btn btn-sm" onClick={startDeploy}>Deploy</button></td>
                    </tr>
                  )}
                  <tr>
                    <td className="mono">ADK-0142</td><td>Google ADK</td><td className="mono">map v2</td><td className="num">4/4</td>
                    <td><span className="badge badge-ok"><span className="dot" />Deployed · staging</span></td><td className="muted">2 days ago</td>
                    <td><button type="button" className="btn btn-sm" onClick={() => toast('Already live on staging — promote from Cloud Run', 'info')}>Live</button></td>
                  </tr>
                  <tr>
                    <td className="mono">LGR-0091</td><td>LangGraph</td><td className="mono">map v2</td><td className="num">3/4</td>
                    <td><span className="badge badge-warn"><span className="dot" />1 flaky test</span></td><td className="muted">3 days ago</td>
                    <td><button type="button" className="btn btn-sm" onClick={() => toast('Rerun queued with fixed seed 42', 'sync')}>Rerun</button></td>
                  </tr>
                  <tr>
                    <td className="mono">BRK-0037</td><td>Amazon Bedrock</td><td className="mono">map v1</td><td className="num">2/4</td>
                    <td><span className="badge badge-err"><span className="dot" />Failed · auth scope</span></td><td className="muted">last week</td>
                    <td><button type="button" className="btn btn-sm" onClick={() => toast('Fix: allow bedrock:InvokeModel on the tool role, then rerun', 'info')}>Fix</button></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card" data-od-id="code-card">
              <div className="card-h" style={{ justifyContent: 'space-between' }}>
                <h3>3 · Review generated scaffold</h3>
                <div className="row" style={{ gap: 8 }}>
                  <button type="button" className="btn btn-sm" onClick={() => toast('agent.py copied to clipboard', 'copy')}><Icon name="copy" />Copy</button>
                  <button type="button" className="btn btn-sm" onClick={() => toast('Package downloaded as adk-billing-dispute-v3.zip', 'download')}><Icon name="download" />Download .zip</button>
                </div>
              </div>
              <div className="oc-outer">
                <div className="ftree" data-od-id="file-tree">
                  {(['agent', 'tools', 'policy', 'test'] as const).map((k) => (
                    <button key={k} type="button" className={file === k ? 'on' : ''} onClick={() => setFile(k)}>
                      <Icon name="file" className="i" />{k === 'policy' ? 'policies.py' : k === 'test' ? 'test_flow.py' : `${k}.py`}
                    </button>
                  ))}
                </div>
                <div className="code-pane codebox"><pre dangerouslySetInnerHTML={{ __html: FILES[file] }} /></div>
              </div>
            </div>

            <div className="card" data-tab-scope data-od-id="deploy-test-card">
              <div className="card-h" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h3>4 · Deploy, test &amp; improve</h3>
                  <div className="hint" style={{ fontSize: '11.5px', marginTop: 2 }}>Ship a ready build to staging, chat with the live agent, then mark the gaps you want fixed.</div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <span className={`badge${deployBadge === 'live' ? ' badge-ok' : deployBadge === 'deploying' ? ' badge-warn badge-run' : ''}`}>
                    <span className="dot" />
                    {deployBadge === 'live' ? 'Live on staging' : deployBadge === 'deploying' ? 'Deploying to staging…' : 'Not deployed'}
                  </span>
                  <button type="button" className="btn btn-sm" data-od-id="deploy-btn" disabled={deploying} onClick={startDeploy}>
                    {deploying ? <><span className="spinner" style={{ borderColor: 'oklch(18% 0.012 250 / .3)', borderTopColor: 'var(--fg)' }} />Deploying…</> : <><Icon name="rocket" />{deployBadge === 'live' ? 'Redeploy' : 'Deploy to staging'}</>}
                  </button>
                </div>
              </div>

              {!deployed && (
                <div className="card-b" style={{ paddingTop: 12 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Icon name="info" style={{ color: 'var(--muted)', marginTop: 1 }} />
                    <p className="hint" style={{ fontSize: '12.5px' }}>Pick a completed build and deploy it to staging to test the real conversation. Deploys are logged in the audit trail and roll back to the previous revision in one click.</p>
                  </div>
                  <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    <span className="badge"><span className="dot" />ADK-0143 · 4/4 tests</span>
                    <span className="badge"><span className="dot" />snapshot v3</span>
                    <span className="badge"><span className="dot" />asia-south1 (Mumbai)</span>
                  </div>
                </div>
              )}

              {deployed && (
                <Tabs
                  defaultTab="chat"
                  tabs={[
                    { id: 'chat', label: <>Chat <span className="count">{chat.length}</span></> },
                    { id: 'gaps', label: <>Improvement gaps <span className="count">{gaps.length}</span></> },
                  ]}
                  panels={{
                    chat: (
                      <>
                        <div className="row" style={{ padding: '10px 14px', gap: 8, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
                          <span className="badge badge-ok badge-run"><span className="dot" />Live on staging</span>
                          <span className="hint" style={{ fontSize: '11.5px' }}>revision adk-billing-dispute-00014 · gemini-2.0-flash</span>
                          <span style={{ flex: 1 }} />
                          <button
                            type="button"
                            className="chip"
                            aria-pressed={improve}
                            data-od-id="improve-btn"
                            onClick={() => {
                              const next = !improve;
                              setImprove(next);
                              setImproveHint(next ? 'Improve experience ON — click any agent reply to attach a gap pointer.' : 'Turn on “Improve experience”, then click any agent reply to attach a gap pointer.');
                              toast(next ? 'Improve experience on — click an agent reply to flag a gap' : 'Improve experience off', 'flag');
                            }}
                          >
                            <Icon name="flag" style={{ width: 13, height: 13 }} />Improve experience
                          </button>
                        </div>
                        <div className="chat" ref={chatRef} role="log" aria-label="Conversation with the deployed agent">
                          {chat.map((m, i) => (
                            <div
                              key={i}
                              className={`msg ${m.isBot ? 'msg-bot' : 'msg-user'}${m.isBot && improve && !m.typing ? ' pick' : ''}`}
                              onClick={() => { if (m.isBot && improve && !m.typing) markGap(m.text); }}
                            >
                              <div className="bubble">
                                <div className="who">{m.who}</div>
                                {m.typing ? <div className="typing"><span /><span /><span /></div> : <div className="body">{m.text}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="chat-bar">
                          <input className="input" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendChat(); } }} placeholder="Chat with the deployed agent…" aria-label="Message the deployed agent" />
                          <button type="button" className="btn" data-od-id="chat-send" onClick={sendChat} aria-label="Send message"><Icon name="send" /><span>Send</span></button>
                        </div>
                        <div className="hint" style={{ padding: '0 16px 12px', fontSize: '11.5px' }}>{improveHint}</div>
                      </>
                    ),
                    gaps: (
                      <>
                        <div style={{ padding: '14px 16px 4px' }} className="hint">Gaps you mark while testing. Send them to Design to update the process map, or to Analysis to add a missing intent.</div>
                        <div>
                          {gaps.map((g, i) => (
                            <div key={i} className="pointer" style={{ margin: '10px 16px' }}>
                              <Icon name="flag" style={{ color: 'var(--warn-fg)', marginTop: 1 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="row" style={{ gap: 8 }}>
                                  <span className="sev" style={{ color: 'var(--warn-fg)' }}>{g.sev}</span>
                                  <span className="hint" style={{ fontSize: 11 }}>from staging chat</span>
                                </div>
                                <div style={{ fontSize: '12.5px', marginTop: 3 }}>{g.note}</div>
                                <div className="hint" style={{ fontSize: '11.5px', marginTop: 3 }}>On: &ldquo;{String(g.quote || '').slice(0, 74)}…&rdquo;</div>
                              </div>
                              <button type="button" className="icon-btn" aria-label="Remove pointer" onClick={() => setGaps((gs) => gs.filter((_, j) => j !== i))}><Icon name="x" /></button>
                            </div>
                          ))}
                        </div>
                        <div className="row" style={{ padding: '12px 16px', gap: 8, flexWrap: 'wrap' }}>
                          <button type="button" className="btn btn-sm" onClick={() => { if (!gaps.length) { toast('Mark at least one gap first', 'info'); return; } toast(`${gaps.length} gap${gaps.length > 1 ? 's' : ''} sent to Design — map v3.1 queued`, 'flow'); }}><Icon name="flow" />Send to Design</button>
                          <button type="button" className="btn btn-sm" onClick={() => { if (!gaps.length) { toast('Mark at least one gap first', 'info'); return; } toast(`${gaps.length} gap${gaps.length > 1 ? 's' : ''} sent to Analysis — filed against the review queue`, 'chart'); }}><Icon name="chart" />Send to Analysis</button>
                          <span style={{ flex: 1 }} />
                          {gaps.length === 0 && <span className="hint">No gaps marked yet.</span>}
                        </div>
                      </>
                    ),
                  }}
                />
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            <div className="card" data-od-id="guardrails-card">
              <div className="card-h"><h3>Guardrails in this build</h3></div>
              <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '12.5px' }}>
                <div className="row" style={{ gap: 9 }}><Icon name="shield" style={{ color: 'var(--muted)' }} /><span>Credit cap ₹2,500 without supervisor token</span></div>
                <div className="row" style={{ gap: 9 }}><Icon name="branch" style={{ color: 'var(--muted)' }} /><span>Retention escalation after 2 declined offers</span></div>
                <div className="row" style={{ gap: 9 }}><Icon name="lock" style={{ color: 'var(--muted)' }} /><span>PII redaction on every outbound message</span></div>
                <div className="row" style={{ gap: 9 }}><Icon name="clock" style={{ color: 'var(--muted)' }} /><span>Hard stop at 14 agent turns</span></div>
              </div>
            </div>

            <div className="card" data-od-id="snapshot-card">
              <div className="card-h"><h3>Snapshot inputs</h3></div>
              <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '12.5px' }}>
                <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">Process map</span><span className="mono">billing-dispute@v3</span></div>
                <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">UML sequence</span><span className="mono">billing-dispute-uml@v3</span></div>
                <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">Tools bound</span><span className="tabular">5</span></div>
                <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">Sub-agent routes</span><span className="tabular">2</span></div>
                <div className="divider" style={{ margin: '4px 0' }} />
                <Link className="row" to="/design" style={{ gap: 7, fontSize: '12.5px' }}><Icon name="flow" />Open source in Design<Icon name="chevr" style={{ marginLeft: 'auto' }} /></Link>
              </div>
            </div>

            <details className="adv" data-od-id="adv-gen-settings">
              <summary><Icon name="gear" /><span>Advanced generation</span><Icon name="chev" className="chev" /></summary>
              <div className="adv-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="field"><label className="label">Model</label><select className="input" defaultValue="gemini-2.0-flash"><option>gemini-2.0-flash</option><option>gemini-2.5-pro</option><option>claude-sonnet via Bedrock</option></select></div>
                <div className="grid-2">
                  <div className="field"><label className="label">Temperature</label><input className="input" defaultValue="0.2" inputMode="decimal" /></div>
                  <div className="field"><label className="label">Max turns</label><input className="input" defaultValue="14" inputMode="numeric" /></div>
                </div>
                <div className="field"><label className="label">Deploy region</label><select className="input"><option>asia-south1 (Mumbai)</option><option>us-central1</option></select></div>
                <div className="field">
                  <span className="label">Eval harness</span>
                  <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    <button type="button" className="chip" aria-pressed={true}>Golden set · 24</button>
                    <button type="button" className="chip" aria-pressed={false}>Adversarial · 40</button>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>

      <Dialog id="dlg-gen" data-od-id="gen-dialog">
        <div className="dialog-h">
          <h2>Generate agent build</h2>
          <p className="hint">From approved snapshot v3 · target: <span className="mono">{target}</span></p>
        </div>
        <div className="dialog-b">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div><div className="label">Include unit tests</div><div className="hint">4 scenarios incl. supervisor-token edge case.</div></div>
            <Switch checked={includeTests} onChange={setIncludeTests} />
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div><div className="label">Apply guardrails policy</div><div className="hint">₹2,500 credit cap · escalate after 2 declines.</div></div>
            <Switch checked={applyGuardrails} onChange={setApplyGuardrails} />
          </div>
          <div className="field">
            <label className="label" htmlFor="gen-env">Environment</label>
            <select className="input" id="gen-env"><option>staging (default)</option><option>production</option></select>
          </div>
        </div>
        <div className="dialog-f">
          <CloseButton className="btn">Cancel</CloseButton>
          <button type="button" className="btn btn-primary" data-od-id="gen-start-btn" onClick={startGeneration}><Icon name="bolt" />Start generation</button>
        </div>
      </Dialog>

      <Dialog id="dlg-gap" data-od-id="gap-dialog">
        <div className="dialog-h">
          <h2>Attach improvement pointer</h2>
          <p className="hint">&ldquo;{pendingGap.slice(0, 120)}{pendingGap.length > 120 ? '…' : ''}&rdquo;</p>
        </div>
        <div className="dialog-b">
          <div className="field">
            <span className="label">Gap type</span>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }} data-od-id="gap-sev">
              {GAP_TYPES.map((t) => (
                <button key={t} type="button" className="chip" aria-pressed={gapType === t} onClick={() => setGapType(t)}>{t}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="gap-note">What should the agent do instead?</label>
            <textarea className="input" id="gap-note" rows={3} placeholder="e.g. Ask for the cancellation date before quoting the credit amount." value={gapNote} onChange={(e) => setGapNote(e.target.value)} />
          </div>
        </div>
        <div className="dialog-f">
          <CloseButton className="btn">Cancel</CloseButton>
          <button type="button" className="btn btn-primary" data-od-id="gap-save" onClick={saveGap}>Add pointer</button>
        </div>
      </Dialog>
    </AppShell>
  );
}
