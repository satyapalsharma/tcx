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
  { id: 'adk', name: 'Google ADK', desc: 'Python agents with FunctionTools, direct Vertex AI deploy.', badge: 'bg-accent-soft text-accent-strong', badgeText: 'Recommended' },
  { id: 'cx', name: 'CX Agent Studio', desc: 'Google Contact Center AI flows and playbooks.', badge: 'bg-surface-inset text-foreground', badgeText: 'Flows' },
  { id: 'bedrock', name: 'Amazon Bedrock', desc: 'Agents for Bedrock with action groups wired to Lambda tools.', badge: 'bg-surface-inset text-foreground', badgeText: 'AWS stack' },
  { id: 'langgraph', name: 'LangGraph', desc: 'Stateful graph runtime, bring-your-own LLM with checkpoints.', badge: 'bg-surface-inset text-foreground', badgeText: 'OSS' },
];

const FILES: Record<string, string> = {
  agent: `# Generated from process map v3 — Billing Dispute Resolution
# Snapshot: approved by Devika Sharma · UML v3 · 5 tools · 2 sub-agent routes

from google.adk import Agent
from google.adk.tools import FunctionTool
from policies import GUARDRAILS

billing_dispute_agent = Agent(
    name="billing_dispute_agent",
    model="gemini-2.0-flash",
    instruction="""Resolve billing disputes. Verify identity, fetch the
       invoice, check dispute_rules, apply credit inside guardrails.
       Escalate to retention after two declined offers.""",
    tools=GUARDRAILS.wired_tools,
)`,
  tools: `# tools.py — bound tools with scopes from the UML diagram

async def get_invoice(msisdn: str) -> dict:
    """Fetch the current invoice for the verified account."""
    return crm.invoices.latest(msisdn=msisdn)

async def apply_credit(invoice_id: str, amount: float) -> dict:
    if amount > 2500:
        return escalate(reason="supervisor_token_required")
    return billing.credit(invoice_id=invoice_id, amount=amount)

async def route_retention(context: dict) -> dict:
    return queue.route("retention", context=context)`,
  policy: `# policies.py — guardrails baked into the build

GUARDRAILS = dict(
    credit_cap_inr=2500,
    max_agent_turns=14,
    redact_pii=True,
    escalation=dict(
        after_declined_offers=2,
        queue="retention",
        carry_context=True,
    ),
)`,
  test: `# tests/test_flow.py — happy path + 3 edge cases

class TestBillingDispute:

    def test_valid_dispute_gets_credit(self):
        out = run_scenario("charged_after_cancel")
        assert out.tool_calls["apply_credit"].amount == 412.0

    def test_over_cap_escalates(self):
        out = run_scenario("credit_above_2500")
        assert out.last_action == "escalate"

    def test_two_declines_route_retention(self):
        out = run_scenario("declined_twice")
        assert out.queue == "retention"`,
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

  return (
    <AppShell
      middleCrumb="Skyline Broadband — Winter CX"
      crumb="Develop"
      badge={
        <span className="inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-semibold rounded-full bg-success-soft text-success-fg mr-2">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />Snapshot v3 locked
        </span>
      }
    >
      <div className="p-4 sm:p-6 lg:p-7 max-w-[1240px] mx-auto w-full pb-16" data-od-id="develop-page">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground" data-od-id="page-title">Develop</h1>
            <p className="text-xs sm:text-sm text-muted mt-1 max-w-[660px]">
              Generate production agent code from the approved process map and UML snapshot. Pick a target runtime, review the scaffold, then deploy to staging.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 h-9 px-3.5 bg-surface hover:bg-surface-hover border border-border text-foreground text-xs sm:text-sm font-medium rounded-md shadow-xs transition-colors cursor-pointer"
              onClick={() => toast('Runtime docs open in vendor documentation (stub for demo)', 'ext')}
            >
              <Icon name="ext" className="w-4 h-4 text-muted" />Runtime docs
            </button>
            <OpenButton
              className="inline-flex items-center justify-center gap-2 h-9 px-3.5 bg-accent-strong hover:bg-accent-hover active:bg-accent-active text-white text-xs sm:text-sm font-medium rounded-md shadow-xs transition-colors cursor-pointer"
              target="dlg-gen"
              data-od-id="generate-btn"
            >
              <Icon name="bolt" className="w-4 h-4" />Generate agent build
            </OpenButton>
          </div>
        </div>

        {/* Handoff Banner */}
        <div className="p-3.5 sm:px-4 bg-surface border border-border rounded-xl shadow-xs mb-4 flex items-center gap-3 flex-wrap" data-od-id="handoff-banner">
          <Icon name="check" className="w-4 h-4 text-success shrink-0" />
          <div className="text-xs flex-1 min-w-[220px]">
            <strong className="text-foreground">From Design · approved 1 h ago by Devika Sharma</strong>
            <div className="text-muted mt-0.5">Process map v3 (Billing Dispute Resolution) + UML sequence v3 — read-only snapshot. Source edits in Design queue a new snapshot.</div>
          </div>
          <div className="flex items-center gap-2 origin-right scale-90 sm:scale-95">
            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-medium rounded-full bg-success-soft text-success-fg">
              <span className="w-3.5 h-3.5 rounded-full bg-success text-white grid place-items-center"><Icon name="check" style={{ width: 9, height: 9 }} /></span>Analysis
            </span>
            <span className="w-3.5 h-px bg-border shrink-0" />
            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-medium rounded-full bg-success-soft text-success-fg">
              <span className="w-3.5 h-3.5 rounded-full bg-success text-white grid place-items-center"><Icon name="check" style={{ width: 9, height: 9 }} /></span>Design
            </span>
            <span className="w-3.5 h-px bg-border shrink-0" />
            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-semibold rounded-full border border-foreground text-foreground bg-surface">
              <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse" />Develop
            </span>
          </div>
        </div>

        {/* Runtime Target Picker */}
        <h2 className="text-xs sm:text-sm font-semibold text-foreground mb-2.5" data-od-id="target-heading">1 · Choose target runtime</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4.5" data-od-id="target-grid">
          {TARGETS.map((t) => {
            const isSelected = target === t.name;
            return (
              <button
                key={t.id}
                type="button"
                className={`p-3.5 border rounded-xl transition-all cursor-pointer flex flex-col gap-2 text-left ${
                  isSelected
                    ? 'border-accent-strong bg-accent-soft/30 ring-2 ring-accent-soft'
                    : 'border-border bg-surface hover:bg-surface-hover/70'
                }`}
                data-od-id={`tg-${t.id}`}
                onClick={() => setTarget(t.name)}
              >
                <div className="flex items-center justify-between w-full">
                  <strong className="text-xs sm:text-sm font-semibold text-foreground">{t.name}</strong>
                  <span className={`w-4.5 h-4.5 rounded-full border grid place-items-center text-xs transition-colors ${
                    isSelected ? 'bg-accent-strong border-accent-strong text-white' : 'border-border text-transparent'
                  }`}>
                    <Icon name="check" style={{ width: 10, height: 10 }} />
                  </span>
                </div>
                <span className="text-xs text-muted leading-relaxed">{t.desc}</span>
                <span className={`inline-flex items-center gap-1 h-5 px-2 text-[11px] font-medium rounded-full mt-auto ${t.badge}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />{t.badgeText}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main 2-Column Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start" data-od-id="develop-grid">
          <div className="space-y-4 min-w-0">
            {/* Builds Card */}
            <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden" data-od-id="builds-card">
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">2 · Generate &amp; track builds</h3>
              </div>

              {genLive && (
                <div className="p-4 bg-accent-soft/40 border-b border-accent-border space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold text-foreground">
                    <span>GEN-0143 — generating {target} build from snapshot v3</span>
                    <span className="font-mono text-accent-strong">{genPct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-accent-strong rounded-full transition-all duration-200" style={{ width: `${genPct}%` }} />
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {GEN_STEPS.map((step, i) => (
                      <div key={step.label} className={`flex items-center gap-2 text-xs ${genStage < i ? 'text-muted' : 'text-foreground'}`}>
                        <span className={`w-4 h-4 rounded-full grid place-items-center shrink-0 ${
                          genStage > i ? 'bg-success-soft text-success' :
                          genStage === i ? 'bg-accent-soft text-accent-strong animate-spin' :
                          'bg-surface-inset text-muted'
                        }`}>
                          <Icon name={stepIcon(i)} style={{ width: 10, height: 10 }} />
                        </span>
                        <span>{step.label}</span>
                        <span className="ml-auto font-mono text-[11px] text-muted">{step.meta}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse min-w-[620px]">
                  <thead className="bg-surface border-b border-border">
                    <tr className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      <th className="px-4 py-2.5">Build</th>
                      <th className="px-4 py-2.5">Runtime</th>
                      <th className="px-4 py-2.5">From</th>
                      <th className="px-4 py-2.5 text-right">Tests</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Created</th>
                      <th className="px-3 py-2.5 w-20 text-right" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {showRow143 && (
                      <tr className="hover:bg-surface-hover/70 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-foreground font-semibold">ADK-0143</td>
                        <td className="px-4 py-3 text-xs sm:text-sm text-foreground">Google ADK</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted">map v3</td>
                        <td className="px-4 py-3 text-right font-mono text-xs">4/4</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-success-soft text-success-fg">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" />Ready
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted">just now</td>
                        <td className="px-3 py-3 text-right">
                          <button
                            type="button"
                            className="h-7 px-2.5 rounded-md bg-accent-strong hover:bg-accent-hover text-white text-xs font-medium transition-colors cursor-pointer"
                            onClick={startDeploy}
                          >
                            Deploy
                          </button>
                        </td>
                      </tr>
                    )}
                    <tr className="hover:bg-surface-hover/70 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-foreground font-semibold">ADK-0142</td>
                      <td className="px-4 py-3 text-xs sm:text-sm text-foreground">Google ADK</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">map v2</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">4/4</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-success-soft text-success-fg">
                          <span className="w-1.5 h-1.5 rounded-full bg-success" />Deployed · staging
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">2 days ago</td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          className="h-7 px-2.5 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer"
                          onClick={() => toast('Already live on staging — promote from Cloud Run', 'info')}
                        >
                          Live
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-hover/70 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-foreground font-semibold">LGR-0091</td>
                      <td className="px-4 py-3 text-xs sm:text-sm text-foreground">LangGraph</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">map v2</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">3/4</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-warn-soft text-warn-fg">
                          <span className="w-1.5 h-1.5 rounded-full bg-warn" />1 flaky test
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">3 days ago</td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          className="h-7 px-2.5 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer"
                          onClick={() => toast('Rerun queued with fixed seed 42', 'sync')}
                        >
                          Rerun
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-hover/70 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-foreground font-semibold">BRK-0037</td>
                      <td className="px-4 py-3 text-xs sm:text-sm text-foreground">Amazon Bedrock</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">map v1</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">2/4</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-danger-soft text-danger-fg">
                          <span className="w-1.5 h-1.5 rounded-full bg-danger" />Failed · auth scope
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">last week</td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          className="h-7 px-2.5 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer"
                          onClick={() => toast('Fix: allow bedrock:InvokeModel on the tool role, then rerun', 'info')}
                        >
                          Fix
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Scaffold Review */}
            <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden" data-od-id="code-card">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">3 · Review generated scaffold</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer"
                    onClick={() => toast('agent.py copied to clipboard', 'copy')}
                  >
                    <Icon name="copy" className="w-3.5 h-3.5 text-muted" />Copy
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer"
                    onClick={() => toast('Package downloaded as adk-billing-dispute-v3.zip', 'download')}
                  >
                    <Icon name="download" className="w-3.5 h-3.5 text-muted" />Download .zip
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[170px_minmax(0,1fr)]">
                <div className="p-2 bg-surface-inset border-r border-border flex md:flex-col gap-1 overflow-x-auto" data-od-id="file-tree">
                  {(['agent', 'tools', 'policy', 'test'] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      className={`h-8 px-2.5 rounded-md text-xs font-mono flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
                        file === k
                          ? 'bg-foreground text-surface font-semibold shadow-xs'
                          : 'text-foreground hover:bg-surface-hover'
                      }`}
                      onClick={() => setFile(k)}
                    >
                      <Icon name="file" className={`w-3.5 h-3.5 shrink-0 ${file === k ? 'text-surface' : 'text-muted'}`} />
                      {k === 'policy' ? 'policies.py' : k === 'test' ? 'test_flow.py' : `${k}.py`}
                    </button>
                  ))}
                </div>
                <div className="bg-surface-inset/70">
                  <pre className="max-h-[430px] overflow-auto min-h-[360px] m-0 p-4 font-mono text-xs text-foreground leading-relaxed">
                    {FILES[file]}
                  </pre>
                </div>
              </div>
            </div>

            {/* Deploy, Test & Improve */}
            <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden" data-tab-scope data-od-id="deploy-test-card">
              <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">4 · Deploy, test &amp; improve</h3>
                  <div className="text-xs text-muted mt-0.5">Ship a ready build to staging, chat with the live agent, then mark the gaps you want fixed.</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-medium rounded-full ${
                    deployBadge === 'live' ? 'bg-success-soft text-success-fg' :
                    deployBadge === 'deploying' ? 'bg-warn-soft text-warn-fg' :
                    'bg-surface-inset text-foreground'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {deployBadge === 'live' ? 'Live on staging' : deployBadge === 'deploying' ? 'Deploying to staging…' : 'Not deployed'}
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-accent-strong hover:bg-accent-hover text-white text-xs font-medium shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    data-od-id="deploy-btn"
                    disabled={deploying}
                    onClick={startDeploy}
                  >
                    {deploying ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Deploying…
                      </>
                    ) : (
                      <>
                        <Icon name="rocket" className="w-3.5 h-3.5" />
                        {deployBadge === 'live' ? 'Redeploy' : 'Deploy to staging'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {!deployed && (
                <div className="p-5 text-xs text-muted space-y-3">
                  <div className="flex gap-2.5 items-start">
                    <Icon name="info" className="w-4 h-4 text-muted mt-0.5 shrink-0" />
                    <p className="leading-relaxed">
                      Pick a completed build and deploy it to staging to test the real conversation. Deploys are logged in the audit trail and roll back to the previous revision in one click.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 h-5 px-2 text-[11px] font-medium rounded-full bg-surface-inset border border-border text-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted" />ADK-0143 · 4/4 tests
                    </span>
                    <span className="inline-flex items-center gap-1.5 h-5 px-2 text-[11px] font-medium rounded-full bg-surface-inset border border-border text-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted" />snapshot v3
                    </span>
                    <span className="inline-flex items-center gap-1.5 h-5 px-2 text-[11px] font-medium rounded-full bg-surface-inset border border-border text-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted" />asia-south1 (Mumbai)
                    </span>
                  </div>
                </div>
              )}

              {deployed && (
                <Tabs
                  defaultTab="chat"
                  tabs={[
                    { id: 'chat', label: <>Chat <span className="ml-1 px-1.5 py-0.2 rounded-full bg-surface-inset text-[10px] font-mono text-muted">{chat.length}</span></> },
                    { id: 'gaps', label: <>Improvement gaps <span className="ml-1 px-1.5 py-0.2 rounded-full bg-surface-inset text-[10px] font-mono text-muted">{gaps.length}</span></> },
                  ]}
                  panels={{
                    chat: (
                      <div>
                        <div className="p-3 border-b border-border flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 h-5 px-2 text-[11px] font-medium rounded-full bg-success-soft text-success-fg">
                              <span className="w-1.5 h-1.5 rounded-full bg-success" />Live on staging
                            </span>
                            <span className="text-muted text-[11.5px]">revision adk-billing-dispute-00014 · gemini-2.0-flash</span>
                          </div>
                          <button
                            type="button"
                            className={`h-6.5 px-2.5 rounded-full border text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                              improve ? 'bg-warn text-white border-warn font-semibold' : 'bg-surface border-border text-muted hover:text-foreground'
                            }`}
                            data-od-id="improve-btn"
                            onClick={() => {
                              const next = !improve;
                              setImprove(next);
                              setImproveHint(next ? 'Improve experience ON — click any agent reply to attach a gap pointer.' : 'Turn on “Improve experience”, then click any agent reply to attach a gap pointer.');
                              toast(next ? 'Improve experience on — click an agent reply to flag a gap' : 'Improve experience off', 'flag');
                            }}
                          >
                            <Icon name="flag" className="w-3 h-3" />Improve experience
                          </button>
                        </div>
                        <div className="p-4 flex flex-col gap-2.5 max-h-[300px] overflow-y-auto bg-surface-inset/30" ref={chatRef} role="log" aria-label="Conversation with the deployed agent">
                          {chat.map((m, i) => (
                            <div
                              key={i}
                              className={`flex flex-col ${m.isBot ? 'items-start' : 'items-end'}`}
                            >
                              <div
                                className={`p-3 rounded-xl text-xs max-w-[85%] leading-relaxed transition-all ${
                                  m.isBot
                                    ? `bg-surface border border-border text-foreground shadow-xs ${improve && !m.typing ? 'cursor-pointer hover:border-warn hover:ring-2 hover:ring-warn-soft' : ''}`
                                    : 'bg-accent-strong text-white'
                                }`}
                                onClick={() => { if (m.isBot && improve && !m.typing) markGap(m.text); }}
                              >
                                <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${m.isBot ? 'text-muted' : 'text-white/80'}`}>{m.who}</div>
                                {m.typing ? (
                                  <div className="flex gap-1 py-1">
                                    <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:0.4s]" />
                                  </div>
                                ) : (
                                  <div>{m.text}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-3 border-t border-border flex gap-2">
                          <input
                            className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs sm:text-sm text-foreground focus:outline-none focus:border-accent"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendChat(); } }}
                            placeholder="Chat with the deployed agent…"
                            aria-label="Message the deployed agent"
                          />
                          <button
                            type="button"
                            className="h-9 px-3.5 rounded-md bg-foreground text-surface hover:bg-foreground/90 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                            data-od-id="chat-send"
                            onClick={sendChat}
                            aria-label="Send message"
                          >
                            <Icon name="send" className="w-3.5 h-3.5" />
                            <span>Send</span>
                          </button>
                        </div>
                        <div className="px-3 pb-3 text-[11px] text-muted">{improveHint}</div>
                      </div>
                    ),
                    gaps: (
                      <div className="p-4 space-y-3">
                        <div className="text-xs text-muted leading-relaxed">
                          Gaps you mark while testing. Send them to Design to update the process map, or to Analysis to add a missing intent.
                        </div>
                        <div className="space-y-2">
                          {gaps.map((g, i) => (
                            <div key={i} className="p-3 border border-border rounded-lg bg-surface flex items-start gap-2.5 text-xs">
                              <Icon name="flag" className="w-4 h-4 text-warn shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-warn">{g.sev}</span>
                                  <span className="text-[11px] text-muted">from staging chat</span>
                                </div>
                                <div className="text-foreground mt-0.5 font-medium">{g.note}</div>
                                <div className="text-[11px] text-muted mt-0.5 truncate">On: &ldquo;{String(g.quote || '').slice(0, 74)}…&rdquo;</div>
                              </div>
                              <button
                                type="button"
                                className="inline-flex items-center justify-center w-6 h-6 rounded text-muted hover:text-foreground cursor-pointer"
                                aria-label="Remove pointer"
                                onClick={() => setGaps((gs) => gs.filter((_, j) => j !== i))}
                              >
                                <Icon name="x" className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-2 flex-wrap">
                          <button
                            type="button"
                            className="h-8 px-3 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                            onClick={() => {
                              if (!gaps.length) { toast('Mark at least one gap first', 'info'); return; }
                              toast(`${gaps.length} gap${gaps.length > 1 ? 's' : ''} sent to Design — map v3.1 queued`, 'flow');
                            }}
                          >
                            <Icon name="flow" className="w-3.5 h-3.5 text-muted" />Send to Design
                          </button>
                          <button
                            type="button"
                            className="h-8 px-3 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                            onClick={() => {
                              if (!gaps.length) { toast('Mark at least one gap first', 'info'); return; }
                              toast(`${gaps.length} gap${gaps.length > 1 ? 's' : ''} sent to Analysis — filed against the review queue`, 'chart');
                            }}
                          >
                            <Icon name="chart" className="w-3.5 h-3.5 text-muted" />Send to Analysis
                          </button>
                          {gaps.length === 0 && <span className="text-xs text-muted ml-auto">No gaps marked yet.</span>}
                        </div>
                      </div>
                    ),
                  }}
                />
              )}
            </div>
          </div>

          {/* Right Rail */}
          <div className="space-y-4 min-w-0">
            <div className="p-4 bg-surface border border-border rounded-xl shadow-xs space-y-3" data-od-id="guardrails-card">
              <div className="pb-2 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Guardrails in this build</h3>
              </div>
              <div className="space-y-2.5 text-xs text-foreground">
                <div className="flex items-center gap-2.5"><Icon name="shield" className="w-4 h-4 text-muted shrink-0" /><span>Credit cap ₹2,500 without supervisor token</span></div>
                <div className="flex items-center gap-2.5"><Icon name="branch" className="w-4 h-4 text-muted shrink-0" /><span>Retention escalation after 2 declined offers</span></div>
                <div className="flex items-center gap-2.5"><Icon name="lock" className="w-4 h-4 text-muted shrink-0" /><span>PII redaction on every outbound message</span></div>
                <div className="flex items-center gap-2.5"><Icon name="clock" className="w-4 h-4 text-muted shrink-0" /><span>Hard stop at 14 agent turns</span></div>
              </div>
            </div>

            <div className="p-4 bg-surface border border-border rounded-xl shadow-xs space-y-3" data-od-id="snapshot-card">
              <div className="pb-2 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Snapshot inputs</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center"><span className="text-muted">Process map</span><span className="font-mono text-foreground">billing-dispute@v3</span></div>
                <div className="flex justify-between items-center"><span className="text-muted">UML sequence</span><span className="font-mono text-foreground">billing-dispute-uml@v3</span></div>
                <div className="flex justify-between items-center"><span className="text-muted">Tools bound</span><span className="font-mono text-foreground">5</span></div>
                <div className="flex justify-between items-center"><span className="text-muted">Sub-agent routes</span><span className="font-mono text-foreground">2</span></div>
                <div className="pt-2 border-t border-border">
                  <Link className="flex items-center gap-1.5 text-xs text-accent-strong hover:underline font-medium" to="/design">
                    <Icon name="flow" className="w-3.5 h-3.5" />Open source in Design<Icon name="chevr" className="w-3.5 h-3.5 ml-auto" />
                  </Link>
                </div>
              </div>
            </div>

            <details className="border border-border rounded-xl bg-surface group" data-od-id="adv-gen-settings">
              <summary className="flex items-center gap-2 p-3.5 text-xs font-semibold text-muted hover:text-foreground cursor-pointer select-none">
                <Icon name="gear" className="w-3.5 h-3.5 text-muted" />
                <span>Advanced generation</span>
                <Icon name="chev" className="w-3.5 h-3.5 ml-auto text-muted group-open:rotate-180 transition-transform" />
              </summary>
              <div className="p-3.5 border-t border-border space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground tracking-wide mb-1">Model</label>
                  <select className="w-full h-8 px-2.5 bg-surface-inset border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-accent" defaultValue="gemini-2.0-flash">
                    <option>gemini-2.0-flash</option>
                    <option>gemini-2.5-pro</option>
                    <option>claude-sonnet via Bedrock</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-foreground tracking-wide mb-1">Temperature</label>
                    <input className="w-full h-8 px-2.5 bg-surface-inset border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-accent" defaultValue="0.2" inputMode="decimal" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground tracking-wide mb-1">Max turns</label>
                    <input className="w-full h-8 px-2.5 bg-surface-inset border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-accent" defaultValue="14" inputMode="numeric" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground tracking-wide mb-1">Deploy region</label>
                  <select className="w-full h-8 px-2.5 bg-surface-inset border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-accent">
                    <option>asia-south1 (Mumbai)</option>
                    <option>us-central1</option>
                  </select>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-foreground tracking-wide mb-1">Eval harness</span>
                  <div className="flex gap-1.5">
                    <button type="button" className="h-6 px-2.5 rounded-full bg-foreground text-surface text-xs font-semibold">Golden set · 24</button>
                    <button type="button" className="h-6 px-2.5 rounded-full border border-border bg-surface text-muted text-xs hover:text-foreground">Adversarial · 40</button>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Generate Dialog */}
      <Dialog id="dlg-gen" dataOdId="gen-dialog">
        <div className="p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground tracking-tight">Generate agent build</h2>
          <p className="text-xs text-muted mt-1">From approved snapshot v3 · target: <span className="font-mono text-foreground font-semibold">{target}</span></p>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-surface-inset">
            <div>
              <div className="text-xs font-semibold text-foreground">Include unit tests</div>
              <div className="text-[11px] text-muted">4 scenarios incl. supervisor-token edge case.</div>
            </div>
            <Switch checked={includeTests} onChange={setIncludeTests} />
          </div>
          <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-surface-inset">
            <div>
              <div className="text-xs font-semibold text-foreground">Apply guardrails policy</div>
              <div className="text-[11px] text-muted">₹2,500 credit cap · escalate after 2 declines.</div>
            </div>
            <Switch checked={applyGuardrails} onChange={setApplyGuardrails} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5" htmlFor="gen-env">Environment</label>
            <select className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs sm:text-sm text-foreground focus:outline-none focus:border-accent" id="gen-env">
              <option>staging (default)</option>
              <option>production</option>
            </select>
          </div>
        </div>
        <div className="p-4 border-t border-border bg-surface-inset/40 flex items-center justify-end gap-2.5 rounded-b-xl">
          <CloseButton className="inline-flex items-center justify-center px-3.5 h-8.5 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer">
            Cancel
          </CloseButton>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 h-8.5 rounded-md bg-accent-strong hover:bg-accent-hover active:bg-accent-active text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
            data-od-id="gen-start-btn"
            onClick={startGeneration}
          >
            <Icon name="bolt" className="w-3.5 h-3.5" />Start generation
          </button>
        </div>
      </Dialog>

      {/* Attach Improvement Pointer Dialog */}
      <Dialog id="dlg-gap" dataOdId="gap-dialog">
        <div className="p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground tracking-tight">Attach improvement pointer</h2>
          <p className="text-xs text-muted mt-1 truncate">&ldquo;{pendingGap.slice(0, 120)}{pendingGap.length > 120 ? '…' : ''}&rdquo;</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <span className="block text-xs font-semibold text-foreground tracking-wide mb-1.5">Gap type</span>
            <div className="flex flex-wrap gap-1.5" data-od-id="gap-sev">
              {GAP_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`h-6.5 px-3 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    gapType === t ? 'bg-foreground text-surface border-foreground font-semibold' : 'bg-surface border-border text-muted hover:text-foreground'
                  }`}
                  onClick={() => setGapType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5" htmlFor="gap-note">
              What should the agent do instead?
            </label>
            <textarea
              className="w-full p-2.5 bg-surface border border-border rounded-md text-xs sm:text-sm text-foreground focus:outline-none focus:border-accent"
              id="gap-note"
              rows={3}
              placeholder="e.g. Ask for the cancellation date before quoting the credit amount."
              value={gapNote}
              onChange={(e) => setGapNote(e.target.value)}
            />
          </div>
        </div>
        <div className="p-4 border-t border-border bg-surface-inset/40 flex items-center justify-end gap-2.5 rounded-b-xl">
          <CloseButton className="inline-flex items-center justify-center px-3.5 h-8.5 rounded-md border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors cursor-pointer">
            Cancel
          </CloseButton>
          <button
            type="button"
            className="inline-flex items-center justify-center px-3.5 h-8.5 rounded-md bg-accent-strong hover:bg-accent-hover active:bg-accent-active text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
            data-od-id="gap-save"
            onClick={saveGap}
          >
            Add pointer
          </button>
        </div>
      </Dialog>
    </AppShell>
  );
}
