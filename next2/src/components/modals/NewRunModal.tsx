'use client';

import React, { useState } from 'react';
import { useApp, type ModularTaskType } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import { Icon } from '@/components/Icon';
import { Dialog } from '@/components/Overlay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';

const TASK_OPTIONS: {
  type: ModularTaskType;
  title: string;
  desc: string;
  icon: Parameters<typeof Icon>[0]['name'];
  badge: string;
}[] = [
  {
    type: 'extract_intents',
    title: 'Extract Intents',
    desc: 'Parse customer conversation transcripts to discover unique caller intents.',
    icon: 'search',
    badge: 'Step 1 · Analysis',
  },
  {
    type: 'cluster_intents',
    title: 'Cluster Intents',
    desc: 'Already have intents? Group them into semantic L1, L2 & L3 categories.',
    icon: 'chart',
    badge: 'Step 2 · Taxonomy',
  },
  {
    type: 'design_flow',
    title: 'Design Process Flow',
    desc: 'Generate interactive process maps & business rules from intents/clusters.',
    icon: 'flow',
    badge: 'Step 3 · Design',
  },
  {
    type: 'generate_agent',
    title: 'Generate Agent Code',
    desc: 'Turn approved flows into production agent scaffolds (ADK, Bedrock, LangGraph).',
    icon: 'code',
    badge: 'Step 4 · Develop',
  },
  {
    type: 'full_pipeline',
    title: 'Full Pipeline (End-to-End)',
    desc: 'Run raw interaction data through all stages to code generation automatically.',
    icon: 'bolt',
    badge: 'Automated E2E',
  },
];

export function NewRunModal() {
  const { isNewRunOpen, closeNewRun, newRunDefaultType, currentWorkspace, currentOrg } = useApp();
  const toast = useToast();
  const router = useRouter();

  const [taskType, setTaskType] = useState<ModularTaskType>(newRunDefaultType);
  const [jobName, setJobName] = useState('');
  const [dataSource, setDataSource] = useState('genesys');
  const [selectedCluster, setSelectedCluster] = useState('Billing Disputes');
  const [targetRuntime, setTargetRuntime] = useState('adk');
  const [autoReview, setAutoReview] = useState(false);

  // Sync default type when opened
  React.useEffect(() => {
    if (isNewRunOpen) {
      setTaskType(newRunDefaultType);
      const randomId = Math.floor(1000 + Math.random() * 9000);
      if (newRunDefaultType === 'extract_intents') setJobName(`Intent-Discovery-${randomId}`);
      else if (newRunDefaultType === 'cluster_intents') setJobName(`Cluster-Taxonomy-${randomId}`);
      else if (newRunDefaultType === 'design_flow') setJobName(`Flow-Design-${randomId}`);
      else if (newRunDefaultType === 'generate_agent') setJobName(`Agent-Build-${randomId}`);
      else setJobName(`Pipeline-Run-${randomId}`);
    }
  }, [isNewRunOpen, newRunDefaultType]);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    closeNewRun();

    const name = jobName.trim() || 'Custom Task';

    if (taskType === 'extract_intents') {
      toast(`Started intent extraction: "${name}"`, 'check');
      router.push('/analysis');
    } else if (taskType === 'cluster_intents') {
      toast(`Clustering queued for: "${name}"`, 'check');
      router.push('/analysis');
    } else if (taskType === 'design_flow') {
      toast(`Generating process flow for "${selectedCluster}"`, 'flow');
      router.push('/design');
    } else if (taskType === 'generate_agent') {
      toast(`Scaffolding agent code for ${targetRuntime.toUpperCase()}`, 'code');
      router.push('/develop');
    } else {
      toast(`Full pipeline queued: "${name}"`, 'bolt');
      router.push('/jobs');
    }
  };

  if (!isNewRunOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
      <Card className="w-full max-w-2xl bg-surface border border-border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-surface-inset/20">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">Start a New Task or Pipeline</h2>
            <p className="text-xs text-muted mt-0.5">
              Workspace: <span className="font-semibold text-foreground">{currentWorkspace.name}</span> · Org:{' '}
              <span className="font-semibold text-foreground">{currentOrg.name}</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={closeNewRun}
            aria-label="Close"
            className="text-muted hover:text-foreground"
          >
            <Icon name="x" className="w-4 h-4" />
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleStart} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Step 1: Select Modular Mode */}
          <div>
            <Label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">
              1 · Select Task or Pipeline Mode
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TASK_OPTIONS.map((opt) => {
                const isSelected = taskType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => {
                      setTaskType(opt.type);
                      const randomId = Math.floor(1000 + Math.random() * 9000);
                      if (opt.type === 'extract_intents') setJobName(`Intent-Discovery-${randomId}`);
                      else if (opt.type === 'cluster_intents') setJobName(`Cluster-Taxonomy-${randomId}`);
                      else if (opt.type === 'design_flow') setJobName(`Flow-Design-${randomId}`);
                      else if (opt.type === 'generate_agent') setJobName(`Agent-Build-${randomId}`);
                      else setJobName(`Pipeline-Run-${randomId}`);
                    }}
                    className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-foreground bg-surface-inset ring-1 ring-foreground/20 font-medium'
                        : 'border-border bg-surface hover:bg-surface-hover hover:border-border-strong'
                    } ${opt.type === 'full_pipeline' ? 'sm:col-span-2' : ''}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-md grid place-items-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-foreground text-surface' : 'bg-surface-inset text-muted'
                      }`}
                    >
                      <Icon name={opt.icon} className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-foreground">{opt.title}</span>
                        <span className="text-[10px] text-muted px-1.5 py-0.2 rounded bg-surface-inset border border-border">
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-muted line-clamp-1 mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Essential Inputs Based on Mode (Occam's Razor!) */}
          <div className="p-4 border border-border rounded-lg bg-surface-inset/30 space-y-4">
            <Label className="text-xs font-semibold text-muted uppercase tracking-wider block">
              2 · Task Configuration
            </Label>

            <div>
              <Label htmlFor="run-name" className="text-xs font-medium text-foreground mb-1 block">
                Job / Run Name
              </Label>
              <Input
                id="run-name"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="e.g. Q4-Billing-Inquiries"
                className="bg-surface h-9 text-xs sm:text-sm"
                required
              />
            </div>

            {/* If Mode is Extract Intents or Full Pipeline: Need Data Source */}
            {(taskType === 'extract_intents' || taskType === 'full_pipeline') && (
              <div>
                <Label htmlFor="data-src" className="text-xs font-medium text-foreground mb-1 block">
                  Interaction Data Source
                </Label>
                <select
                  id="data-src"
                  value={dataSource}
                  onChange={(e) => setDataSource(e.target.value)}
                  className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="genesys">Genesys Cloud (18,442 recordings &amp; transcripts sync)</option>
                  <option value="s3">AWS S3 Raw Ingestion Bucket (weekly wave jsonl)</option>
                  <option value="zendesk">Zendesk Tickets (6,211 support exports)</option>
                  <option value="upload">Upload local file (CSV, JSON, Audio)</option>
                </select>
              </div>
            )}

            {/* If Mode is Cluster Intents: Source intents */}
            {taskType === 'cluster_intents' && (
              <div>
                <Label htmlFor="cluster-src" className="text-xs font-medium text-foreground mb-1 block">
                  Input Intent Source
                </Label>
                <select
                  id="cluster-src"
                  className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option>Latest discovered intents (286 unclustered items)</option>
                  <option>Upload custom CSV / JSON of intent labels</option>
                  <option>Import from external taxonomy</option>
                </select>
                <p className="text-[11px] text-muted mt-1">
                  Clusters will automatically partition into L1 macro themes and granular L2/L3 intents.
                </p>
              </div>
            )}

            {/* If Mode is Design Flow: Select Cluster */}
            {taskType === 'design_flow' && (
              <div>
                <Label htmlFor="flow-cluster" className="text-xs font-medium text-foreground mb-1 block">
                  Select Cluster to Map
                </Label>
                <select
                  id="flow-cluster"
                  value={selectedCluster}
                  onChange={(e) => setSelectedCluster(e.target.value)}
                  className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option>Billing &amp; Invoice Disputes (38.2% volume · 8 intents)</option>
                  <option>Connectivity &amp; Wi-Fi Outages (24.1% volume · 6 intents)</option>
                  <option>New Fiber Installation (13.8% volume · 4 intents)</option>
                  <option>Port-out &amp; Retention (8.4% volume · 3 intents)</option>
                </select>
              </div>
            )}

            {/* If Mode is Generate Agent: Target Runtime */}
            {taskType === 'generate_agent' && (
              <div>
                <Label htmlFor="agent-runtime" className="text-xs font-medium text-foreground mb-1 block">
                  Target Agent Framework
                </Label>
                <select
                  id="agent-runtime"
                  value={targetRuntime}
                  onChange={(e) => setTargetRuntime(e.target.value)}
                  className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="adk">Google ADK (Python Vertex AI Agents · Recommended)</option>
                  <option value="bedrock">Amazon Bedrock (Action Groups + Lambda tools)</option>
                  <option value="cx">CX Agent Studio (Google CCAI flows &amp; playbooks)</option>
                  <option value="langgraph">LangGraph (Stateful graph with Python checkpoints)</option>
                </select>
              </div>
            )}

            {/* Simple toggle: Human review vs Autonomous */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div>
                <div className="text-xs font-medium text-foreground">Express Mode</div>
                <div className="text-[11px] text-muted">Proceed automatically without pausing for manual review gates.</div>
              </div>
              <Switch checked={autoReview} onCheckedChange={setAutoReview} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={closeNewRun}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" size="sm" className="gap-1.5 font-medium">
              <Icon name="play" className="w-3.5 h-3.5" />
              Start Task
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
