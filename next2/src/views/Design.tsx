'use client';

import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { ProcessMapSvg } from '../components/ProcessMapSvg';
import { UmlSequenceSvg } from '../components/UmlSequenceSvg';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';
import { useApp } from '@/context/AppContext';
import { PageHeader, SelectField } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface FlowNode {
  id: string;
  title: string;
  type: 'start' | 'message' | 'tool' | 'decision' | 'handoff' | 'end';
  subtitle: string;
  tool?: string;
  rule?: string;
  retryLimit?: number;
  subAgent?: string;
}

const INITIAL_NODES: FlowNode[] = [
  {
    id: 'n-start',
    title: 'Call Connected & Identity Auth',
    type: 'start',
    subtitle: 'IVR match · MSISDN verified',
    tool: 'auth.verify_caller_jwt',
    rule: 'Pass session token if authenticated in IVR; else prompt OTP',
  },
  {
    id: 'n-intent',
    title: 'Verify Caller Intent',
    type: 'message',
    subtitle: 'Extract disputed invoice ID & billing cycle',
    rule: 'LLM intent confidence must exceed 0.85',
  },
  {
    id: 'n-fetch',
    title: 'Fetch Customer Invoice',
    type: 'tool',
    subtitle: 'Query billing CRM for latest statements',
    tool: 'crm.invoices.latest(msisdn)',
    rule: 'Retrieve charges, itemized taxes, and active promo discounts',
  },
  {
    id: 'n-decision',
    title: 'Dispute Validity & Credit Check',
    type: 'decision',
    subtitle: 'Is overcharge valid & amount <= ₹2,500?',
    rule: 'Branch A: Auto-apply credit if <= ₹2,500\nBranch B: Escalate if > ₹2,500 or repeated dispute',
    retryLimit: 1,
  },
  {
    id: 'n-credit',
    title: 'Apply Automated Credit',
    type: 'tool',
    subtitle: 'Credit adjustment via Billing Gateway',
    tool: 'billing.apply_credit(invoice_id, amount)',
    rule: 'Generate instant credit memo and send WhatsApp receipt',
  },
  {
    id: 'n-handoff',
    title: 'Retention Sub-Agent Handoff',
    type: 'handoff',
    subtitle: 'Specialized retention queue negotiation',
    subAgent: 'retention_negotiator_agent',
    rule: 'Carry full conversation context and max discount tier matrix',
  },
  {
    id: 'n-end',
    title: 'Resolution Confirmed & End Call',
    type: 'end',
    subtitle: 'Update CRM disposition & close session',
    tool: 'crm.tickets.resolve(ticket_id)',
    rule: 'Send CSAT survey link via SMS within 2 minutes',
  },
];

export default function Design() {
  useReveal();
  const toast = useToast();
  const { currentWorkspace, openNewRun } = useApp();

  const [nodes, setNodes] = useState<FlowNode[]>(INITIAL_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('n-decision');
  const [activeTab, setActiveTab] = useState<'canvas' | 'diagram' | 'uml'>('canvas');
  const [isHandedOff, setIsHandedOff] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? nodes[0];

  const updateSelectedNode = (patch: Partial<FlowNode>) => {
    setNodes((prev) => prev.map((n) => (n.id === selectedNodeId ? { ...n, ...patch } : n)));
    toast('Node updated', 'check');
  };

  const moveNode = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= nodes.length) return;
    const copy = [...nodes];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    setNodes(copy);
    toast('Step reordered', 'flow');
  };

  const addStep = (type: FlowNode['type']) => {
    const newId = `node-${Date.now()}`;
    const newNode: FlowNode = {
      id: newId,
      title: type === 'decision' ? 'New Decision Gate' : type === 'tool' ? 'New Tool Action' : 'New Interaction Step',
      type,
      subtitle: type === 'tool' ? 'Call external API' : 'Conversational branching logic',
      tool: type === 'tool' ? 'crm.custom_api()' : undefined,
      rule: 'Define evaluation criteria and rules',
    };
    setNodes((prev) => [...prev.slice(0, -1), newNode, prev[prev.length - 1]]);
    setSelectedNodeId(newId);
    toast('New node added to flow', 'plus');
  };

  const handleHandoff = () => {
    setIsHandedOff(true);
    toast('Flow & UML blueprint approved! Handed off to Developers in Agent Builder', 'check');
  };

  return (
    <AppShell crumb="Process Designer">
      <main className="p-4 sm:p-6 lg:p-8 max-w-[1240px] mx-auto w-full pb-20 space-y-6" data-od-id="design-page">
        {/* Header with Actions */}
        <PageHeader
          title="Process Flow Designer"
          description={`Workspace: ${currentWorkspace.name} · Visually design and edit conversational flows, decision gates, and UML sequence diagrams.`}
          dataOdId="page-title"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-1.5 h-9 text-xs sm:text-sm"
                onClick={() => openNewRun('design_flow')}
              >
                <Icon name="flow" className="w-3.5 h-3.5" />
                New Flow Template
              </Button>
              <Button
                type="button"
                variant="accent"
                className="gap-1.5 h-9 text-xs sm:text-sm font-medium shadow-xs"
                onClick={handleHandoff}
              >
                <Icon name="check" className="w-3.5 h-3.5" />
                {isHandedOff ? 'Handoff Approved (v3)' : 'Approve & Hand off to Develop'}
              </Button>
            </div>
          }
        />

        {/* Upstream Provenance Banner */}
        <Card className="bg-surface-inset/60 border border-border p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-surface border border-border grid place-items-center shrink-0">
              <Icon name="flow" className="w-4 h-4 text-accent-strong" />
            </span>
            <div>
              <div className="font-semibold text-foreground flex items-center gap-2">
                <span>Derived from Analysis: L1 Cluster &ldquo;Billing Dispute Resolution&rdquo;</span>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 text-[10px] py-0 px-1.5">
                  Verified Snapshot v3
                </Badge>
              </div>
              <p className="text-muted mt-0.5">Approved by Riya Menon (Business Analyst) · 2,847 calls synthesized into this conversational blueprint.</p>
            </div>
          </div>
          <Badge variant="outline" className="border-border text-muted font-mono text-[11px] self-start sm:self-auto">
            5 tools · 2 sub-agents
          </Badge>
        </Card>

        {/* Main View Tabs: Visual Canvas Editor vs Diagram vs UML Sequence */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border mb-4">
            <div className="overflow-x-auto w-full sm:w-auto">
              <TabsList variant="line" className="w-max justify-start gap-4 h-10 bg-transparent p-0 whitespace-nowrap">
                <TabsTrigger value="canvas" className="text-xs sm:text-sm font-medium">
                  <Icon name="flow" className="w-3.5 h-3.5 mr-1.5" />
                  Flow Canvas
                </TabsTrigger>
                <TabsTrigger value="diagram" className="text-xs sm:text-sm font-medium">
                  <Icon name="chart" className="w-3.5 h-3.5 mr-1.5" />
                  Process Map
                </TabsTrigger>
                <TabsTrigger value="uml" className="text-xs sm:text-sm font-medium">
                  <Icon name="code" className="w-3.5 h-3.5 mr-1.5" />
                  UML Sequence
                </TabsTrigger>
              </TabsList>
            </div>

            {activeTab === 'canvas' && (
              <div className="flex items-center gap-2 pb-2 sm:pb-0">
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => addStep('tool')}>
                  <Icon name="plus" className="w-3 h-3 mr-1" />
                  Add Tool Step
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => addStep('decision')}>
                  <Icon name="plus" className="w-3 h-3 mr-1" />
                  Add Decision Gate
                </Button>
              </div>
            )}
          </div>

          {/* TAB 1: INTERACTIVE VISUAL NODE CANVAS + INSPECTOR PANEL */}
          <TabsContent value="canvas" className="m-0">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
              {/* Left: Interactive Visual Flow Nodes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted px-1">
                  <span>Conversational Nodes Sequence ({nodes.length} steps)</span>
                  <span>Click any step to inspect &amp; edit properties</span>
                </div>

                <div className="space-y-2.5">
                  {nodes.map((node, index) => {
                    const isSelected = node.id === selectedNodeId;
                    return (
                      <div key={node.id} className="relative group">
                        <Card
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`p-3.5 border transition-all cursor-pointer rounded-xl ${
                            isSelected
                              ? 'border-accent-strong bg-accent-soft/30 shadow-xs'
                              : 'bg-surface border-border hover:border-border-strong hover:bg-surface-hover/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-md bg-surface-inset border border-border text-[11px] font-mono font-semibold text-muted grid place-items-center shrink-0 mt-0.5">
                                {index + 1}
                              </span>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-xs sm:text-sm font-semibold text-foreground">{node.title}</h4>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] py-0 px-1.5 uppercase font-medium ${
                                      node.type === 'tool'
                                        ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                                        : node.type === 'decision'
                                        ? 'border-amber-500/30 text-amber-600 bg-amber-500/10'
                                        : node.type === 'handoff'
                                        ? 'border-purple-500/30 text-purple-600 bg-purple-500/10'
                                        : 'border-border text-muted bg-surface-inset'
                                    }`}
                                  >
                                    {node.type}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted mt-0.5">{node.subtitle}</p>

                                {node.tool && (
                                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-inset border border-border font-mono text-[11px] text-foreground">
                                    <Icon name="bolt" className="w-3 h-3 text-accent-strong" />
                                    {node.tool}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Reorder Up / Down Controls */}
                            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                className="h-6 w-6 text-muted hover:text-foreground cursor-pointer"
                                aria-label="Move step up"
                                disabled={index === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveNode(index, 'up');
                                }}
                              >
                                &uarr;
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                className="h-6 w-6 text-muted hover:text-foreground cursor-pointer"
                                aria-label="Move step down"
                                disabled={index === nodes.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveNode(index, 'down');
                                }}
                              >
                                &darr;
                              </Button>
                            </div>
                          </div>
                        </Card>

                        {/* Connector line between steps */}
                        {index < nodes.length - 1 && (
                          <div className="w-0.5 h-2.5 bg-border mx-auto my-0.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Node Inspector & Property Editor */}
              <Card className="bg-surface border border-border rounded-xl p-4 sticky top-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-foreground">Node Inspector</h3>
                    <p className="text-[11px] text-muted">Configure step rules &amp; tools</p>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono uppercase">
                    {selectedNode.type}
                  </Badge>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="node-title" className="text-xs">Step Title</Label>
                    <Input
                      id="node-title"
                      value={selectedNode.title}
                      onChange={(e) => updateSelectedNode({ title: e.target.value })}
                      className="h-8 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="node-subtitle" className="text-xs">Summary Description</Label>
                    <Input
                      id="node-subtitle"
                      value={selectedNode.subtitle}
                      onChange={(e) => updateSelectedNode({ subtitle: e.target.value })}
                      className="h-8 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="node-type" className="text-xs">Step Type</Label>
                    <SelectField
                      id="node-type"
                      value={selectedNode.type}
                      onValueChange={(val) => updateSelectedNode({ type: val as FlowNode['type'] })}
                      options={[
                        { value: 'start', label: 'Start / Intake Trigger' },
                        { value: 'message', label: 'Message & Prompt' },
                        { value: 'tool', label: 'Tool Call / API Trigger' },
                        { value: 'decision', label: 'Decision Gate / Branch' },
                        { value: 'handoff', label: 'Sub-agent Handoff' },
                        { value: 'end', label: 'End / Resolution Call' },
                      ]}
                      className="h-8 text-xs w-full"
                    />
                  </div>

                  {selectedNode.type === 'tool' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="node-tool" className="text-xs">Bound API Tool</Label>
                      <Input
                        id="node-tool"
                        value={selectedNode.tool || ''}
                        onChange={(e) => updateSelectedNode({ tool: e.target.value })}
                        placeholder="e.g. billing.apply_credit(amount)"
                        className="h-8 font-mono text-xs"
                      />
                    </div>
                  )}

                  {selectedNode.type === 'handoff' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="node-agent" className="text-xs">Target Sub-agent</Label>
                      <Input
                        id="node-agent"
                        value={selectedNode.subAgent || ''}
                        onChange={(e) => updateSelectedNode({ subAgent: e.target.value })}
                        placeholder="e.g. retention_negotiator_agent"
                        className="h-8 font-mono text-xs"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="node-rules" className="text-xs">Branching Rules &amp; Policy</Label>
                    <Textarea
                      id="node-rules"
                      value={selectedNode.rule || ''}
                      onChange={(e) => updateSelectedNode({ rule: e.target.value })}
                      rows={3}
                      className="text-xs"
                    />
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted">ID: <code className="font-mono">{selectedNode.id}</code></span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-danger-fg hover:bg-danger-soft"
                      onClick={() => {
                        if (nodes.length <= 2) {
                          toast('Cannot delete root start or end nodes', 'warn');
                          return;
                        }
                        setNodes(nodes.filter((n) => n.id !== selectedNodeId));
                        setSelectedNodeId(nodes[0].id);
                        toast('Node removed', 'trash');
                      }}
                    >
                      Delete Node
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: SVG PROCESS MAP VIEW */}
          <TabsContent value="diagram" className="m-0">
            <Card className="bg-surface border border-border rounded-xl p-4 sm:p-6 overflow-x-auto">
              <div className="w-full max-w-[880px] min-w-[620px] mx-auto">
                <ProcessMapSvg activeNode="pn-valid" />
              </div>
            </Card>
          </TabsContent>

          {/* TAB 3: UML SEQUENCE DIAGRAM */}
          <TabsContent value="uml" className="m-0">
            <Card className="bg-surface border border-border rounded-xl p-4 sm:p-6 overflow-x-auto">
              <div className="min-w-[620px] max-w-[880px] mx-auto">
                <UmlSequenceSvg />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </AppShell>
  );
}
