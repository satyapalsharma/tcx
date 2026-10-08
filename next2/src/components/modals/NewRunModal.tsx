'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, type ModularTaskType, type Workspace } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import { Icon, type IconName } from '@/components/Icon';
import { SelectField } from '@/components/common';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const TASKS: { type: ModularTaskType; title: string; desc: string; icon: IconName; route: string; namePrefix: string }[] = [
  { type: 'extract_intents', title: 'Intent analysis', desc: 'Find intents, resolutions & pain points from transcripts or live streams', icon: 'search', route: '/analysis', namePrefix: 'Intent analysis' },
  { type: 'cluster_intents', title: 'Cluster intents', desc: 'Group intents into L1 → L2 → L3 taxonomy', icon: 'chart', route: '/analysis', namePrefix: 'Intent clustering' },
  { type: 'design_flow', title: 'Flow design', desc: 'Create process maps & UML diagrams from clusters', icon: 'flow', route: '/design', namePrefix: 'Flow design' },
  { type: 'generate_agent', title: 'Agent build', desc: 'Generate ADK, Bedrock, LangGraph agent code', icon: 'code', route: '/develop', namePrefix: 'Agent build' },
  { type: 'full_pipeline', title: 'End to end', desc: 'Conversations → intents → clusters → flows → agent', icon: 'bolt', route: '/jobs', namePrefix: 'End to end' },
];

const RUNTIMES = ['Google ADK', 'Amazon Bedrock', 'CX Agent Studio', 'LangGraph'];

const CONNECTORS = [
  { value: 'genesys_live', label: 'Genesys Cloud · Real-time Audio Stream' },
  { value: 'nice_cxone', label: 'NICE CXone · Real-time Event Bridge' },
  { value: 's3_bucket', label: 'Amazon S3 · Audio & Transcript Vault' },
  { value: 'zendesk_webhook', label: 'Zendesk Support · Live Ticket Stream' },
  { value: 'salesforce_crm', label: 'Salesforce CRM · Cases & Chat Logs' },
];

const defaultName = (type: ModularTaskType) => {
  const task = TASKS.find((item) => item.type === type)!;
  return `${task.namePrefix} · ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
};

export function NewRunModal() {
  const { isNewRunOpen, newRunDefaultType, currentWorkspace } = useApp();
  if (!isNewRunOpen) return null;

  return (
    <NewJobDialog
      key={`${newRunDefaultType}-${currentWorkspace.id}`}
      initialType={newRunDefaultType}
      workspace={currentWorkspace}
    />
  );
}

function NewJobDialog({ initialType, workspace }: { initialType: ModularTaskType; workspace: Workspace }) {
  const { closeNewRun, addJob } = useApp();
  const toast = useToast();
  const router = useRouter();

  const [taskType, setTaskType] = useState<ModularTaskType>(initialType);
  const [name, setName] = useState('');
  const [ingestType, setIngestType] = useState<'upload' | 'connector'>('upload');
  const [connector, setConnector] = useState(CONNECTORS[0].value);
  const [runtime, setRuntime] = useState(RUNTIMES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [model, setModel] = useState('Gemini 2.5 Flash');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isIntentAnalysis = taskType === 'extract_intents';

  const selectTask = (value: string) => {
    if (!value) return;
    setTaskType(value as ModularTaskType);
    setFile(null);
  };

  const handleStart = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const task = TASKS.find((t) => t.type === taskType)!;

    const sourceLabel = ingestType === 'connector'
      ? CONNECTORS.find((c) => c.value === connector)?.label ?? connector
      : file ? file.name : 'Genesys_March_Q1_Calls.csv';

    const input = {
      source: sourceLabel,
      fileName: file ? file.name : 'Genesys_March_Q1_Calls.csv',
      ...(taskType === 'generate_agent' ? { runtime } : {}),
    };

    const job = addJob({
      name: name.trim() || defaultName(taskType),
      type: taskType,
      input,
    });

    closeNewRun();
    toast(`${job.id} started in ${workspace.name}`, 'play');
    router.push(task.route);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && closeNewRun()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
          <DialogDescription>
            Runs in <span className="font-medium text-foreground">{workspace.name}</span>. Start a standalone tool or full pipeline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleStart} className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-foreground">Select Pipeline Stage</legend>
            <ToggleGroup type="single" value={taskType} onValueChange={selectTask} className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2" aria-label="Job type">
              {TASKS.map((task) => (
                <ToggleGroupItem
                  key={task.type}
                  value={task.type}
                  variant="outline"
                  className={`h-auto min-w-0 justify-start gap-3 rounded-lg! p-3 text-left whitespace-normal ${task.type === 'full_pipeline' ? 'sm:col-span-2' : ''}`}
                >
                  <Icon name={task.icon} className="size-4 shrink-0 text-muted" />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-foreground">{task.title}</span>
                    <span className="block text-[11px] leading-4 text-muted font-normal">{task.desc}</span>
                  </span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="job-name" className="text-xs">Task Name</Label>
            <Input
              id="job-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-9 text-sm"
              placeholder={defaultName(taskType)}
            />
          </div>

          {/* Ingestion Options: Prominent File Upload + Real-time Streaming Connector */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-foreground">
                {isIntentAnalysis ? 'Customer Interaction Source' : 'Input Source'}
              </Label>
              {isIntentAnalysis && (
                <Badge variant="outline" className="text-[10px] text-accent-strong border-accent-border font-medium">
                  Real-time &amp; Batch Supported
                </Badge>
              )}
            </div>

            {/* Toggle between Direct Upload & Connector */}
            <div className="flex rounded-lg border border-border bg-surface-inset/50 p-1">
              <Button
                type="button"
                variant={ingestType === 'upload' ? 'secondary' : 'ghost'}
                size="sm"
                className={`flex-1 h-7 text-xs font-medium ${ingestType === 'upload' ? 'bg-surface shadow-xs text-foreground' : 'text-muted'}`}
                onClick={() => setIngestType('upload')}
              >
                <Icon name="upload" className="w-3.5 h-3.5 mr-1.5" />
                Direct File Upload
              </Button>
              <Button
                type="button"
                variant={ingestType === 'connector' ? 'secondary' : 'ghost'}
                size="sm"
                className={`flex-1 h-7 text-xs font-medium ${ingestType === 'connector' ? 'bg-surface shadow-xs text-foreground' : 'text-muted'}`}
                onClick={() => setIngestType('connector')}
              >
                <Icon name="bolt" className="w-3.5 h-3.5 mr-1.5 text-accent-strong" />
                {isIntentAnalysis ? 'Real-Time Live Connector' : 'Cloud Connector'}
              </Button>
            </div>

            {ingestType === 'upload' ? (
              <div className="space-y-1.5">
                <Input
                  id="job-file"
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,.txt,.mp3,.wav,.m4a,.mp4"
                  className="h-auto min-h-9 cursor-pointer py-1.5 text-xs file:mr-3 file:rounded file:border-0 file:bg-surface-inset file:px-2 file:py-1 file:text-xs file:font-medium"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
                <p className="text-[11px] leading-4 text-muted">
                  Supports call transcripts (.csv, .json), audio recordings (.mp3, .wav), or support tickets.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <SelectField
                  id="job-connector"
                  value={connector}
                  onValueChange={setConnector}
                  options={CONNECTORS}
                  size="default"
                  className="h-9 w-full text-xs"
                />
                <p className="text-[11px] leading-4 text-muted">
                  {isIntentAnalysis
                    ? 'Connects directly to your live telephony audio stream for real-time continuous intent extraction.'
                    : 'Ingests synchronized interaction batches from your configured enterprise connectors.'}
                </p>
              </div>
            )}
          </div>

          {taskType === 'generate_agent' && (
            <div className="space-y-1.5">
              <Label htmlFor="job-runtime" className="text-xs">Target Runtime</Label>
              <SelectField id="job-runtime" value={runtime} onValueChange={setRuntime} options={RUNTIMES} size="default" className="h-9 w-full text-xs" />
            </div>
          )}

          {/* Collapsible Advanced Configuration Accordion */}
          <Accordion type="single" collapsible className="w-full border border-border rounded-lg bg-surface px-3">
            <AccordionItem value="modal-advanced" className="border-none">
              <AccordionTrigger className="text-xs font-medium text-muted hover:text-foreground py-2.5">
                <span className="flex items-center gap-1.5">
                  <Icon name="gear" className="w-3.5 h-3.5 text-muted" />
                  Advanced Parameters (Model, Granularity, PII)
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-3 space-y-3 border-t border-border">
                <div className="space-y-1.5">
                  <Label htmlFor="adv-model" className="text-xs">Underlying Foundation Model</Label>
                  <SelectField
                    id="adv-model"
                    value={model}
                    onValueChange={setModel}
                    options={['Gemini 2.5 Flash', 'Claude 3.5 Sonnet', 'GPT-4o mini']}
                    size="default"
                    className="h-8 w-full text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted">
                  <Icon name="shield" className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Automatic PCI &amp; PII token redaction active</span>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeNewRun}>Cancel</Button>
            <Button type="submit" variant="accent" className="gap-2">
              <Icon name="play" className="size-3.5 shrink-0" />
              Start Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
