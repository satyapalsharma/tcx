'use client';

import { useCallback, useRef, useState } from 'react';
import { Link } from '../lib/navigation';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { CloseButton, Dialog, OpenButton, useOverlay } from '../components/Overlay';
import { Tabs } from '../components/ui';
import { Switch } from '@/components/ui/switch';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';
import { PageHeader, StatusBadge } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';

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
        <StatusBadge status="ok" className="mr-2">
          Snapshot v3 locked
        </StatusBadge>
      }
    >
      <div className="p-4 sm:p-6 lg:p-7 max-w-[1240px] mx-auto w-full pb-16" data-od-id="develop-page">
        <PageHeader
          title="Develop"
          description="Generate production agent code from the approved process map and UML snapshot. Pick a target runtime, review the scaffold, then deploy to staging."
          dataOdId="page-title"
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                className="gap-2 h-9 px-3.5 text-xs sm:text-sm font-medium cursor-pointer"
                onClick={() => toast('Runtime docs open in vendor documentation (stub for demo)', 'ext')}
              >
                <Icon name="ext" className="w-4 h-4 text-muted" />Runtime docs
              </Button>
              <OpenButton
                variant="accent"
                className="gap-2 h-9 px-3.5 text-xs sm:text-sm font-medium cursor-pointer"
                target="dlg-gen"
                data-od-id="generate-btn"
              >
                <Icon name="bolt" className="w-4 h-4" />Generate agent build
              </OpenButton>
            </>
          }
        />

        {/* Handoff Banner */}
        <div className="p-3.5 sm:px-4 bg-surface border border-border rounded-xl shadow-xs mb-4 flex items-center gap-3 flex-wrap" data-od-id="handoff-banner">
          <Icon name="check" className="w-4 h-4 text-success shrink-0" />
          <div className="text-xs flex-1 min-w-[220px]">
            <strong className="text-foreground">From Design · approved 1 h ago by Devika Sharma</strong>
            <div className="text-muted mt-0.5">Process map v3 (Billing Dispute Resolution) + UML sequence v3 — read-only snapshot. Source edits in Design queue a new snapshot.</div>
          </div>
          <div className="flex items-center gap-2 origin-right scale-90 sm:scale-95">
            <Link to="/analysis" title="View upstream clusters in Analysis" className="inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-medium rounded-full bg-success-soft text-success-fg hover:opacity-80 transition-opacity cursor-pointer">
              <span className="w-3.5 h-3.5 rounded-full bg-success text-white grid place-items-center"><Icon name="check" style={{ width: 9, height: 9 }} /></span>Analysis
            </Link>
            <span className="w-3.5 h-px bg-border shrink-0" />
            <Link to="/design" title="View approved map & UML in Design" className="inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-medium rounded-full bg-success-soft text-success-fg hover:opacity-80 transition-opacity cursor-pointer">
              <span className="w-3.5 h-3.5 rounded-full bg-success text-white grid place-items-center"><Icon name="check" style={{ width: 9, height: 9 }} /></span>Design
            </Link>
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
              <Card
                key={t.id}
                tabIndex={0}
                role="button"
                className={`p-3.5 border rounded-xl transition-all cursor-pointer flex flex-col gap-2 text-left shadow-xs ${
                  isSelected
                    ? 'border-accent-strong bg-accent-soft/30 ring-2 ring-accent-soft'
                    : 'border-border bg-surface hover:bg-surface-hover/70'
                }`}
                data-od-id={`tg-${t.id}`}
                onClick={() => setTarget(t.name)}
                onKeyDown={(e) => e.key === 'Enter' && setTarget(t.name)}
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
              </Card>
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
                  <Progress value={genPct} className="h-1.5 w-full" />
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
                <Table className="w-full text-left text-sm min-w-[620px]">
                  <TableHeader className="bg-surface">
                    <TableRow className="border-b border-border">
                      <TableHead className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Build</TableHead>
                      <TableHead className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Runtime</TableHead>
                      <TableHead className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">From</TableHead>
                      <TableHead className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted text-right">Tests</TableHead>
                      <TableHead className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Status</TableHead>
                      <TableHead className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Created</TableHead>
                      <TableHead className="px-3 py-2.5 w-20 text-right" />
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border">
                    {showRow143 && (
                      <TableRow className="hover:bg-surface-hover/70 transition-colors">
                        <TableCell className="px-4 py-3 font-mono text-xs text-foreground font-semibold">ADK-0143</TableCell>
                        <TableCell className="px-4 py-3 text-xs sm:text-sm text-foreground">Google ADK</TableCell>
                        <TableCell className="px-4 py-3 font-mono text-xs text-muted">map v3</TableCell>
                        <TableCell className="px-4 py-3 text-right font-mono text-xs">4/4</TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-success-soft text-success-fg">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" />Ready
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs text-muted">just now</TableCell>
                        <TableCell className="px-3 py-3 text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="accent"
                            className="h-7 px-2.5 text-xs"
                            onClick={startDeploy}
                          >
                            Deploy
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow className="hover:bg-surface-hover/70 transition-colors">
                      <TableCell className="px-4 py-3 font-mono text-xs text-foreground font-semibold">ADK-0142</TableCell>
                      <TableCell className="px-4 py-3 text-xs sm:text-sm text-foreground">Google ADK</TableCell>
                      <TableCell className="px-4 py-3 font-mono text-xs text-muted">map v2</TableCell>
                      <TableCell className="px-4 py-3 text-right font-mono text-xs">4/4</TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-success-soft text-success-fg">
                          <span className="w-1.5 h-1.5 rounded-full bg-success" />Deployed · staging
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-muted">2 days ago</TableCell>
                      <TableCell className="px-3 py-3 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs"
                          onClick={() => toast('Already live on staging — promote from Cloud Run', 'info')}
                        >
                          Live
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-surface-hover/70 transition-colors">
                      <TableCell className="px-4 py-3 font-mono text-xs text-foreground font-semibold">LGR-0091</TableCell>
                      <TableCell className="px-4 py-3 text-xs sm:text-sm text-foreground">LangGraph</TableCell>
                      <TableCell className="px-4 py-3 font-mono text-xs text-muted">map v2</TableCell>
                      <TableCell className="px-4 py-3 text-right font-mono text-xs">3/4</TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-warn-soft text-warn-fg">
                          <span className="w-1.5 h-1.5 rounded-full bg-warn" />1 flaky test
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-muted">3 days ago</TableCell>
                      <TableCell className="px-3 py-3 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs"
                          onClick={() => toast('Rerun queued with fixed seed 42', 'sync')}
                        >
                          Rerun
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-surface-hover/70 transition-colors">
                      <TableCell className="px-4 py-3 font-mono text-xs text-foreground font-semibold">BRK-0037</TableCell>
                      <TableCell className="px-4 py-3 text-xs sm:text-sm text-foreground">Amazon Bedrock</TableCell>
                      <TableCell className="px-4 py-3 font-mono text-xs text-muted">map v1</TableCell>
                      <TableCell className="px-4 py-3 text-right font-mono text-xs">2/4</TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 h-5 px-2 text-xs font-medium rounded-full bg-danger-soft text-danger-fg">
                          <span className="w-1.5 h-1.5 rounded-full bg-danger" />Failed · auth scope
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-muted">last week</TableCell>
                      <TableCell className="px-3 py-3 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs"
                          onClick={() => toast('Fix: allow bedrock:InvokeModel on the tool role, then rerun', 'info')}
                        >
                          Fix
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Scaffold Review */}
            <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden" data-od-id="code-card">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">3 · Review generated scaffold</h3>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => toast('agent.py copied to clipboard', 'copy')}
                  >
                    <Icon name="copy" className="w-3.5 h-3.5 text-muted" />Copy
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => toast('Package downloaded as adk-billing-dispute-v3.zip', 'download')}
                  >
                    <Icon name="download" className="w-3.5 h-3.5 text-muted" />Download .zip
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[170px_minmax(0,1fr)]">
                <div className="p-2 bg-surface-inset border-r border-border flex md:flex-col gap-1 overflow-x-auto" data-od-id="file-tree">
                  {(['agent', 'tools', 'policy', 'test'] as const).map((k) => (
                    <Button
                      key={k}
                      variant={file === k ? 'default' : 'ghost'}
                      size="sm"
                      className={`h-8 px-2.5 rounded-md text-xs font-mono justify-start gap-2 whitespace-nowrap cursor-pointer ${
                        file === k
                          ? 'bg-foreground text-surface font-semibold shadow-xs hover:bg-foreground hover:text-surface'
                          : 'text-foreground hover:bg-surface-hover'
                      }`}
                      onClick={() => setFile(k)}
                    >
                      <Icon name="file" className={`w-3.5 h-3.5 shrink-0 ${file === k ? 'text-surface' : 'text-muted'}`} />
                      {k === 'policy' ? 'policies.py' : k === 'test' ? 'test_flow.py' : `${k}.py`}
                    </Button>
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
                  <Button
                    type="button"
                    variant="accent"
                    size="sm"
                    className="h-8 px-3 text-xs"
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
                  </Button>
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
                          <Button
                            type="button"
                            variant={improve ? 'warn' : 'outline'}
                            size="sm"
                            className="h-6.5 px-2.5 rounded-full text-xs"
                            data-od-id="improve-btn"
                            onClick={() => {
                              const next = !improve;
                              setImprove(next);
                              setImproveHint(next ? 'Improve experience ON — click any agent reply to attach a gap pointer.' : 'Turn on “Improve experience”, then click any agent reply to attach a gap pointer.');
                              toast(next ? 'Improve experience on — click an agent reply to flag a gap' : 'Improve experience off', 'flag');
                            }}
                          >
                            <Icon name="flag" className="w-3 h-3" />Improve experience
                          </Button>
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
                          <Input
                            className="w-full h-9 bg-surface text-xs sm:text-sm"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendChat(); } }}
                            placeholder="Chat with the deployed agent…"
                            aria-label="Message the deployed agent"
                          />
                          <Button
                            type="button"
                            size="sm"
                            className="h-9 px-3.5 bg-foreground text-surface hover:bg-foreground/90 shrink-0"
                            data-od-id="chat-send"
                            onClick={sendChat}
                            aria-label="Send message"
                          >
                            <Icon name="send" className="w-3.5 h-3.5" />
                            <span>Send</span>
                          </Button>
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
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                className="text-muted hover:text-foreground"
                                aria-label="Remove pointer"
                                onClick={() => setGaps((gs) => gs.filter((_, j) => j !== i))}
                              >
                                <Icon name="x" className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-2 flex-wrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={() => {
                              if (!gaps.length) { toast('Mark at least one gap first', 'info'); return; }
                              toast(`${gaps.length} gap${gaps.length > 1 ? 's' : ''} sent to Design — map v3.1 queued`, 'flow');
                            }}
                          >
                            <Icon name="flow" className="w-3.5 h-3.5 text-muted" />Send to Design
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={() => {
                              if (!gaps.length) { toast('Mark at least one gap first', 'info'); return; }
                              toast(`${gaps.length} gap${gaps.length > 1 ? 's' : ''} sent to Analysis — filed against the review queue`, 'chart');
                            }}
                          >
                            <Icon name="chart" className="w-3.5 h-3.5 text-muted" />Send to Analysis
                          </Button>
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
                  <Label className="block text-xs font-semibold text-foreground tracking-wide mb-1">Model</Label>
                  <select className="w-full h-8 px-2.5 bg-surface-inset border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-accent" defaultValue="gemini-2.0-flash">
                    <option>gemini-2.0-flash</option>
                    <option>gemini-2.5-pro</option>
                    <option>claude-sonnet via Bedrock</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="block text-xs font-semibold text-foreground tracking-wide mb-1">Temperature</Label>
                    <Input className="w-full h-8 px-2.5 bg-surface-inset text-xs" defaultValue="0.2" inputMode="decimal" />
                  </div>
                  <div>
                    <Label className="block text-xs font-semibold text-foreground tracking-wide mb-1">Max turns</Label>
                    <Input className="w-full h-8 px-2.5 bg-surface-inset text-xs" defaultValue="14" inputMode="numeric" />
                  </div>
                </div>
                <div>
                  <Label className="block text-xs font-semibold text-foreground tracking-wide mb-1">Deploy region</Label>
                  <select className="w-full h-8 px-2.5 bg-surface-inset border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-accent">
                    <option>asia-south1 (Mumbai)</option>
                    <option>us-central1</option>
                  </select>
                </div>
                <div>
                  <Label className="block text-xs font-semibold text-foreground tracking-wide mb-1">Eval harness</Label>
                  <div className="flex gap-1.5">
                    <Button type="button" size="sm" className="h-6 px-2.5 rounded-full text-xs font-semibold">Golden set · 24</Button>
                    <Button type="button" variant="outline" size="sm" className="h-6 px-2.5 rounded-full text-muted text-xs hover:text-foreground">Adversarial · 40</Button>
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
            <Switch checked={includeTests} onCheckedChange={setIncludeTests} aria-label="Include unit tests" />
          </div>
          <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-surface-inset">
            <div>
              <div className="text-xs font-semibold text-foreground">Apply guardrails policy</div>
              <div className="text-[11px] text-muted">₹2,500 credit cap · escalate after 2 declines.</div>
            </div>
            <Switch checked={applyGuardrails} onCheckedChange={setApplyGuardrails} aria-label="Apply guardrails policy" />
          </div>
          <div>
            <Label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5" htmlFor="gen-env">Environment</Label>
            <select className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs sm:text-sm text-foreground focus:outline-none focus:border-accent" id="gen-env">
              <option>staging (default)</option>
              <option>production</option>
            </select>
          </div>
        </div>
        <div className="p-4 border-t border-border bg-surface-inset/40 flex items-center justify-end gap-2.5 rounded-b-xl">
          <CloseButton variant="outline" size="sm" className="h-8.5 px-3.5 text-xs">
            Cancel
          </CloseButton>
          <Button
            type="button"
            variant="accent"
            size="sm"
            className="h-8.5 px-3.5 text-xs gap-1.5"
            data-od-id="gen-start-btn"
            onClick={startGeneration}
          >
            <Icon name="bolt" className="w-3.5 h-3.5" />Start generation
          </Button>
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
            <Label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5">Gap type</Label>
            <div className="flex flex-wrap gap-1.5" data-od-id="gap-sev">
              {GAP_TYPES.map((t) => (
                <Toggle
                  key={t}
                  pressed={gapType === t}
                  onPressedChange={() => setGapType(t)}
                  variant="outline"
                  size="sm"
                  className="h-6.5 px-3 rounded-full text-xs font-medium border border-border data-[state=on]:bg-foreground data-[state=on]:text-surface data-[state=on]:border-foreground cursor-pointer"
                >
                  {t}
                </Toggle>
              ))}
            </div>
          </div>
          <div>
            <Label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5" htmlFor="gap-note">
              What should the agent do instead?
            </Label>
            <Textarea
              className="w-full bg-surface text-xs sm:text-sm"
              id="gap-note"
              rows={3}
              placeholder="e.g. Ask for the cancellation date before quoting the credit amount."
              value={gapNote}
              onChange={(e) => setGapNote(e.target.value)}
            />
          </div>
        </div>
        <div className="p-4 border-t border-border bg-surface-inset/40 flex items-center justify-end gap-2.5 rounded-b-xl">
          <CloseButton variant="outline" size="sm" className="h-8.5 px-3.5 text-xs">
            Cancel
          </CloseButton>
          <Button
            type="button"
            variant="accent"
            size="sm"
            className="h-8.5 px-3.5 text-xs"
            data-od-id="gap-save"
            onClick={saveGap}
          >
            Add pointer
          </Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
