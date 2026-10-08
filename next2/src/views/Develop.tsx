'use client';

import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';
import { useApp } from '@/context/AppContext';
import { PageHeader, SelectField } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CodeFile {
  id: string;
  name: string;
  runtime: string;
  description: string;
  code: string;
}

const RUNTIMES = ['Google ADK', 'Amazon Bedrock', 'LangGraph', 'CX Agent Studio'];

const CODE_FILES: Record<string, CodeFile[]> = {
  'Google ADK': [
    {
      id: 'agent-py',
      name: 'agent.py',
      runtime: 'Google ADK',
      description: 'Agent definition, prompt, and tool wiring',
      code: `# Generated from approved Design Blueprint: Billing Dispute Resolution v3
# Upstream: Derived from Analysis L1 Cluster "Billing & Payments"
# Target Runtime: Google ADK (Vertex AI)

from google.adk import Agent
from google.adk.tools import FunctionTool
from tools import get_invoice, apply_credit, route_retention
from policies import GUARDRAILS

billing_agent = Agent(
    name="billing_dispute_agent",
    model="gemini-2.5-flash",
    description="Resolves consumer billing discrepancies, validates overcharges, and applies credits within policy limits.",
    system_instruction="""
    You are an automated billing dispute specialist for Skyline Communications.
    1. Authenticate the caller and verify the disputed billing cycle.
    2. Call 'get_invoice' to inspect itemized line items and promo credits.
    3. If overcharge is confirmed and amount <= ₹2,500, call 'apply_credit' immediately.
    4. If overcharge > ₹2,500 or customer rejects credit offer twice, call 'route_retention'.
    5. Always maintain professional, empathetic tone and mask account numbers.
    """,
    tools=[
        FunctionTool(get_invoice),
        FunctionTool(apply_credit),
        FunctionTool(route_retention),
    ],
    guardrails=GUARDRAILS,
)

if __name__ == "__main__":
    billing_agent.run_local_server(port=8080)
`,
    },
    {
      id: 'tools-py',
      name: 'tools.py',
      runtime: 'Google ADK',
      description: 'Tool implementations bound to enterprise CRM & Billing API',
      code: `# External Tool implementations for Billing Agent

import os
from typing import Dict, Any

async def get_invoice(msisdn: str, cycle: str = "latest") -> Dict[str, Any]:
    """Fetch itemized invoice from CRM for the authenticated customer MSISDN."""
    # In production, queries enterprise Billing Gateway via mTLS
    return {
        "msisdn": msisdn,
        "invoice_id": "INV-2026-0841",
        "billed_amount": 1499.00,
        "expected_promo_amount": 999.00,
        "discrepancy": 500.00,
        "reason": "Expired promo coupon code rollover",
        "status": "unpaid",
    }

async def apply_credit(invoice_id: str, amount: float) -> Dict[str, Any]:
    """Apply an automated billing credit memo against a verified disputed invoice."""
    if amount > 2500.0:
        raise PermissionError("Amount exceeds supervisor policy delegation limit of ₹2,500.")
    
    return {
        "status": "success",
        "credit_memo_id": "CR-78219",
        "adjusted_balance": 999.00,
        "sms_notification_dispatched": True,
    }

async def route_retention(msisdn: str, reason: str, conversation_summary: str) -> Dict[str, Any]:
    """Escalate to specialized retention negotiation sub-agent."""
    return {
        "queue": "retention_specialist_tier2",
        "priority": "P1",
        "context_transferred": True,
        "jwt_session_token": "valid",
    }
`,
    },
    {
      id: 'policies-py',
      name: 'policies.py',
      runtime: 'Google ADK',
      description: 'Execution guardrails, credit limits, and escalation rules',
      code: `# Enterprise Safety & Policy Guardrails

GUARDRAILS = {
    "max_credit_inr": 2500.00,
    "max_turns_per_session": 14,
    "pii_redaction": {
        "mask_payment_card": True,
        "mask_aadhaar_ssn": True,
        "mask_bank_account": True,
    },
    "escalation_triggers": {
        "dispute_amount_threshold": 2500.00,
        "sentiment_score_threshold": -0.65,
        "customer_declined_offers_max": 2,
    },
    "compliance": {
        "iso_27001_audit_log": True,
        "pci_dss_level_1": True,
    }
}
`,
    },
    {
      id: 'test-py',
      name: 'test_agent.py',
      runtime: 'Google ADK',
      description: 'Automated scenario test suite verifying happy & unhappy paths',
      code: `# Automated Test Scenarios for Billing Dispute Agent

import pytest
from agent import billing_agent

@pytest.mark.asyncio
async def test_valid_dispute_auto_credit():
    """Verify customer under ₹2,500 gets auto-credit without agent intervention."""
    response = await billing_agent.simulate(
        user_message="I cancelled my add-on pack last month but got charged ₹500 again."
    )
    assert "CR-78219" in response.text
    assert response.tool_calls[0].name == "get_invoice"
    assert response.tool_calls[1].name == "apply_credit"

@pytest.mark.asyncio
async def test_high_value_dispute_escalation():
    """Verify disputes over ₹2,500 automatically route to retention with context."""
    response = await billing_agent.simulate(
        user_message="I was wrongfully billed ₹4,500 for international roaming."
    )
    assert response.tool_calls[-1].name == "route_retention"
`,
    },
  ],
  'Amazon Bedrock': [
    {
      id: 'bedrock-agent',
      name: 'bedrock_agent.json',
      runtime: 'Amazon Bedrock',
      description: 'Bedrock Agent OpenAPI schema and Action Group wiring',
      code: `{
  "agentName": "SkylineBillingDisputeAgent",
  "foundationModel": "anthropic.claude-3-5-sonnet-20241022-v2:0",
  "instruction": "Resolve billing disputes, verify invoices with get_invoice, and apply credit memos up to ₹2,500.",
  "actionGroups": [
    {
      "actionGroupName": "BillingActions",
      "actionGroupExecutor": {
        "lambda": "arn:aws:lambda:ap-south-1:123456789012:function:billing-tools-executor"
      },
      "apiSchema": {
        "s3": {
          "s3BucketName": "skyline-agent-blueprints",
          "s3ObjectKey": "schemas/billing_tools_v3.json"
        }
      }
    }
  ]
}`,
    },
  ],
  LangGraph: [
    {
      id: 'langgraph-graph',
      name: 'graph.py',
      runtime: 'LangGraph',
      description: 'StateGraph definition with memory checkpoints and routing edges',
      code: `from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], "add_messages"]
    invoice_id: str
    amount: float
    dispute_valid: bool

workflow = StateGraph(AgentState)
workflow.add_node("verify_invoice", verify_node)
workflow.add_node("apply_credit", credit_node)
workflow.add_node("escalate_retention", retention_node)

workflow.set_entry_point("verify_invoice")
workflow.add_conditional_edges(
    "verify_invoice",
    route_dispute,
    {"valid_under_limit": "apply_credit", "exceeds_limit": "escalate_retention"}
)
workflow.add_edge("apply_credit", END)
workflow.add_edge("escalate_retention", END)

app = workflow.compile(checkpointer=MemorySaver())
`,
    },
  ],
  'CX Agent Studio': [
    {
      id: 'cx-playbook',
      name: 'playbook.json',
      runtime: 'CX Agent Studio',
      description: 'Google Contact Center AI dialog flow and playbook configuration',
      code: `{
  "name": "BillingDisputePlaybook",
  "goal": "Handle caller invoice discrepancies and apply eligible refunds",
  "steps": [
    "Authenticate caller MSISDN via IVR token",
    "Identify disputed billing period and fetch statement details",
    "Evaluate dispute validity against campaign terms",
    "Apply credit if under policy ceiling or transition to retention flow"
  ]
}`,
    },
  ],
};

export default function Develop() {
  useReveal();
  const toast = useToast();
  const { currentWorkspace, openNewRun } = useApp();

  const [selectedRuntime, setSelectedRuntime] = useState<string>('Google ADK');
  const [selectedFileId, setSelectedFileId] = useState<string>('agent-py');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(100);

  const availableFiles = CODE_FILES[selectedRuntime] ?? CODE_FILES['Google ADK'];
  const activeFile = availableFiles.find((f) => f.id === selectedFileId) ?? availableFiles[0];

  const handleRuntimeChange = (rt: string) => {
    setSelectedRuntime(rt);
    const files = CODE_FILES[rt] ?? CODE_FILES['Google ADK'];
    setSelectedFileId(files[0].id);
    toast(`Target runtime set to ${rt}`, 'code');
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.code);
      toast(`${activeFile.name} copied to clipboard`, 'check');
    } catch {
      toast('Clipboard access unavailable', 'warn');
    }
  };

  const downloadCode = () => {
    const url = URL.createObjectURL(new Blob([activeFile.code], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Downloaded ${activeFile.name}`, 'download');
  };

  const regenerateBuild = () => {
    setIsGenerating(true);
    setProgress(15);
    toast('Synthesizing agent scaffold from latest Design blueprint...', 'sync');

    setTimeout(() => setProgress(55), 400);
    setTimeout(() => setProgress(85), 800);
    setTimeout(() => {
      setProgress(100);
      setIsGenerating(false);
      toast('Build refreshed successfully · 4/4 scenario tests passed', 'check');
    }, 1200);
  };

  return (
    <AppShell crumb="Agent Builder">
      <main className="p-4 sm:p-6 lg:p-8 max-w-[1240px] mx-auto w-full pb-20 space-y-6" data-od-id="develop-page">
        {/* Header with Actions */}
        <PageHeader
          title="Agent Builder & Code Generation"
          description={`Workspace: ${currentWorkspace.name} · Generate production conversational AI agent code from verified Process Maps and UML blueprints.`}
          dataOdId="page-title"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-1.5 h-9 text-xs sm:text-sm"
                onClick={regenerateBuild}
                disabled={isGenerating}
              >
                <Icon name="sync" className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Generating...' : 'Regenerate Build'}
              </Button>
              <Button
                type="button"
                variant="accent"
                className="gap-1.5 h-9 text-xs sm:text-sm font-medium shadow-xs"
                onClick={() => {
                  toast('Package exported! Ready for Vertex AI / AWS staging deploy.', 'rocket');
                }}
              >
                <Icon name="rocket" className="w-3.5 h-3.5" />
                Deploy to Staging
              </Button>
            </div>
          }
        />

        {/* Upstream Provenance Banner */}
        <Card className="bg-surface-inset/60 border border-border p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-surface border border-border grid place-items-center shrink-0">
              <Icon name="code" className="w-4 h-4 text-accent-strong" />
            </span>
            <div>
              <div className="font-semibold text-foreground flex items-center gap-2">
                <span>Inherited from Design: Flow Blueprint &ldquo;Billing Dispute Resolution v3&rdquo;</span>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 text-[10px] py-0 px-1.5">
                  UML Sequence Verified
                </Badge>
              </div>
              <p className="text-muted mt-0.5">Approved by Devika Sharma (CX Designer) · Includes tool schemas, prompt guardrails &amp; escalation contracts.</p>
            </div>
          </div>
          <Badge variant="outline" className="border-border text-foreground font-mono text-[11px] self-start sm:self-auto">
            Build ADK-0142 · 4/4 Tests Passing
          </Badge>
        </Card>

        {/* Target Runtime Selector Tabs */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted">1 · Select Target Framework</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {RUNTIMES.map((rt) => {
              const isSelected = selectedRuntime === rt;
              return (
                <Card
                  key={rt}
                  onClick={() => handleRuntimeChange(rt)}
                  className={`p-3.5 border transition-all cursor-pointer rounded-xl ${
                    isSelected
                      ? 'border-accent-strong bg-accent-soft/30 shadow-xs ring-1 ring-accent-strong/40'
                      : 'bg-surface border-border hover:border-border-strong hover:bg-surface-hover/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-semibold text-foreground">{rt}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-accent-strong" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted mt-1">
                    {rt === 'Google ADK'
                      ? 'Python · Vertex AI deploy'
                      : rt === 'Amazon Bedrock'
                      ? 'Action Groups · Claude 3.5'
                      : rt === 'LangGraph'
                      ? 'StateGraph · Checkpointing'
                      : 'CCAI Dialogflow Playbook'}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Live Generation Progress Bar (visible during generation) */}
        {isGenerating && (
          <Card className="p-4 bg-surface border border-accent-border/50 rounded-xl space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-foreground flex items-center gap-2">
                <Icon name="bolt" className="w-3.5 h-3.5 text-accent-strong animate-bounce" />
                Synthesizing agent state machine &amp; tool bindings...
              </span>
              <span className="font-mono text-muted">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </Card>
        )}

        {/* Main Code Studio: Multi-File Navigator + Code Viewer + Guardrails Card */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_300px] gap-4 items-start">
          {/* File Navigator */}
          <Card className="bg-surface border border-border rounded-xl p-0 overflow-hidden shadow-xs">
            <div className="p-3 border-b border-border bg-surface-inset/40">
              <h3 className="text-xs font-semibold text-foreground">Scaffold Files</h3>
              <p className="text-[11px] text-muted">{selectedRuntime}</p>
            </div>
            <div className="p-2 space-y-1">
              {availableFiles.map((f) => (
                <Button
                  key={f.id}
                  type="button"
                  variant={selectedFileId === f.id ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`w-full justify-start text-xs font-mono h-8 px-2.5 ${
                    selectedFileId === f.id ? 'bg-surface-inset text-foreground font-semibold shadow-xs' : 'text-muted'
                  }`}
                  onClick={() => setSelectedFileId(f.id)}
                >
                  <Icon name="code" className="w-3.5 h-3.5 mr-2 shrink-0 text-muted" />
                  <span className="truncate">{f.name}</span>
                </Button>
              ))}
            </div>
          </Card>

          {/* Code Viewer */}
          <Card className="bg-surface border border-border rounded-xl p-0 overflow-hidden shadow-xs">
            <div className="p-3 border-b border-border flex items-center justify-between gap-3 bg-surface-inset/30 flex-wrap">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-border text-foreground font-mono text-xs">
                  {activeFile.name}
                </Badge>
                <span className="text-xs text-muted hidden sm:inline">{activeFile.description}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={copyCode}>
                  <Icon name="copy" className="w-3 h-3" />
                  Copy
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={downloadCode}>
                  <Icon name="download" className="w-3 h-3" />
                  Download
                </Button>
              </div>
            </div>
            <pre className="p-4 sm:p-5 overflow-x-auto max-h-[600px] bg-surface-inset/20 text-xs font-mono leading-relaxed text-foreground">
              <code>{activeFile.code}</code>
            </pre>
          </Card>

          {/* Active Policies & Safety Guardrails Card */}
          <Card className="bg-surface border border-border rounded-xl p-4 shadow-xs space-y-4">
            <div className="pb-2 border-b border-border">
              <h3 className="text-xs sm:text-sm font-semibold text-foreground">Active Guardrails</h3>
              <p className="text-[11px] text-muted">Execution limits &amp; safety policies</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-surface-inset/50 border border-border/70 space-y-1">
                <div className="flex items-center justify-between font-medium text-foreground">
                  <span>Credit Limit Cap</span>
                  <Badge variant="outline" className="text-[10px] font-mono text-foreground border-border">₹2,500</Badge>
                </div>
                <p className="text-[11px] text-muted">Amounts &gt; ₹2,500 require supervisor delegation token.</p>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-inset/50 border border-border/70 space-y-1">
                <div className="flex items-center justify-between font-medium text-foreground">
                  <span>Max Turns Limit</span>
                  <Badge variant="outline" className="text-[10px] font-mono text-foreground border-border">14 turns</Badge>
                </div>
                <p className="text-[11px] text-muted">Prevents infinite conversational loops and hallucinations.</p>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-inset/50 border border-border/70 space-y-1">
                <div className="flex items-center justify-between font-medium text-foreground">
                  <span>PII Redaction</span>
                  <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-500/10 border-emerald-500/20 font-medium">PCI / Aadhaar</Badge>
                </div>
                <p className="text-[11px] text-muted">Tokens masked in prompt memory before LLM inference.</p>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-inset/50 border border-border/70 space-y-1">
                <div className="flex items-center justify-between font-medium text-foreground">
                  <span>Escalation Queue</span>
                  <Badge variant="outline" className="text-[10px] font-mono text-foreground border-border">retention_tier2</Badge>
                </div>
                <p className="text-[11px] text-muted">Auto-triggers if caller rejects 2 consecutive credit offers.</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}
