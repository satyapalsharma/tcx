'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, type ModularTaskType } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import { Icon, type IconName } from '@/components/Icon';
import { SelectField } from '@/components/common';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const TASKS: { type: ModularTaskType; title: string; desc: string; icon: IconName; route: string; namePrefix: string }[] = [
  { type: 'extract_intents', title: 'Extract intents', desc: 'Transcripts or audio → discovered intents', icon: 'search', route: '/analysis', namePrefix: 'Intent discovery' },
  { type: 'cluster_intents', title: 'Cluster intents', desc: 'Existing intents → L1 / L2 / L3 taxonomy', icon: 'chart', route: '/analysis', namePrefix: 'Taxonomy' },
  { type: 'design_flow', title: 'Design flow', desc: 'Cluster → process map & rules', icon: 'flow', route: '/design', namePrefix: 'Flow design' },
  { type: 'generate_agent', title: 'Generate agent', desc: 'Approved flow → agent code', icon: 'code', route: '/develop', namePrefix: 'Agent build' },
  { type: 'full_pipeline', title: 'Full pipeline', desc: 'Raw data → intents → flows → agent code', icon: 'bolt', route: '/jobs', namePrefix: 'Pipeline run' },
];

const SOURCES = [
  { value: 'genesys', label: 'Genesys Cloud · 18,442 interactions' },
  { value: 'zendesk', label: 'Zendesk · 6,211 tickets' },
  { value: 's3', label: 'AWS S3 bucket' },
  { value: 'upload', label: 'Upload file (CSV, JSON, audio)' },
];
const INTENT_SOURCES = [
  { value: 'latest', label: 'Latest discovered intents (286)' },
  { value: 'upload', label: 'Upload intent list (CSV / JSON)' },
];
const CLUSTERS = ['Billing & Payments', 'Connectivity & Outages', 'New Installation', 'Cancellation & Port-out'];
const RUNTIMES = [
  { value: 'Google ADK', label: 'Google ADK (recommended)' },
  { value: 'Amazon Bedrock', label: 'Amazon Bedrock' },
  { value: 'CX Agent Studio', label: 'CX Agent Studio' },
  { value: 'LangGraph', label: 'LangGraph' },
];

const defaultName = (type: ModularTaskType) => {
  const t = TASKS.find((x) => x.type === type)!;
  const d = new Date();
  return `${t.namePrefix} · ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
};

export function NewRunModal() {
  const { isNewRunOpen, closeNewRun, newRunDefaultType, currentWorkspace, addJob } = useApp();
  const toast = useToast();
  const router = useRouter();

  const [taskType, setTaskType] = useState<ModularTaskType>(newRunDefaultType);
  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [source, setSource] = useState('genesys');
  const [intentSource, setIntentSource] = useState('latest');
  const [cluster, setCluster] = useState(CLUSTERS[0]);
  const [runtime, setRuntime] = useState('Google ADK');
  const [express, setExpress] = useState(false);

  // Reset every time the dialog opens with the requested mode preselected.
  useEffect(() => {
    if (!isNewRunOpen) return;
    setTaskType(newRunDefaultType);
    setName(defaultName(newRunDefaultType));
    setNameTouched(false);
    setExpress(false);
  }, [isNewRunOpen, newRunDefaultType]);

  const selectTask = (v: string) => {
    if (!v) return; // ToggleGroup emits '' when the active item is clicked again
    const t = v as ModularTaskType;
    setTaskType(t);
    if (!nameTouched) setName(defaultName(t));
  };

  const task = TASKS.find((t) => t.type === taskType)!;

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const job = addJob({ name: name.trim() || defaultName(taskType), type: taskType });
    closeNewRun();
    toast(`${job.id} queued in ${currentWorkspace.name}`, 'play');
    router.push(task.route);
  };

  return (
    <Dialog open={isNewRunOpen} onOpenChange={(o) => !o && closeNewRun()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>
            Runs in <span className="font-medium text-foreground">{currentWorkspace.name}</span>. Pick one stage, or run them all.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleStart} className="space-y-4">
          <ToggleGroup
            type="single"
            value={taskType}
            onValueChange={selectTask}
            className="grid w-full grid-cols-1 sm:grid-cols-2 gap-2"
            aria-label="Task type"
          >
            {TASKS.map((t) => (
              <ToggleGroupItem
                key={t.type}
                value={t.type}
                variant="outline"
                className={`h-auto justify-start gap-2.5 rounded-lg! p-3 text-left whitespace-normal data-[state=on]:border-foreground data-[state=on]:bg-surface-inset ${
                  t.type === 'full_pipeline' ? 'sm:col-span-2' : ''
                }`}
              >
                <Icon name={t.icon} className="w-4 h-4 shrink-0 text-muted" />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-foreground">{t.title}</span>
                  <span className="block text-[11px] text-muted font-normal">{t.desc}</span>
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div className="space-y-1.5">
            <Label htmlFor="run-name" className="text-xs">Name</Label>
            <Input
              id="run-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameTouched(true);
              }}
              className="h-9 text-sm"
              required
            />
          </div>

          {(taskType === 'extract_intents' || taskType === 'full_pipeline') && (
            <div className="space-y-1.5">
              <Label htmlFor="run-source" className="text-xs">Data source</Label>
              <SelectField id="run-source" value={source} onValueChange={setSource} options={SOURCES} size="default" className="w-full h-9" />
            </div>
          )}

          {taskType === 'cluster_intents' && (
            <div className="space-y-1.5">
              <Label htmlFor="run-intents" className="text-xs">Intents to cluster</Label>
              <SelectField id="run-intents" value={intentSource} onValueChange={setIntentSource} options={INTENT_SOURCES} size="default" className="w-full h-9" />
            </div>
          )}

          {taskType === 'design_flow' && (
            <div className="space-y-1.5">
              <Label htmlFor="run-cluster" className="text-xs">Cluster</Label>
              <SelectField id="run-cluster" value={cluster} onValueChange={setCluster} options={CLUSTERS} size="default" className="w-full h-9" />
            </div>
          )}

          {taskType === 'generate_agent' && (
            <div className="space-y-1.5">
              <Label htmlFor="run-runtime" className="text-xs">Runtime</Label>
              <SelectField id="run-runtime" value={runtime} onValueChange={setRuntime} options={RUNTIMES} size="default" className="w-full h-9" />
            </div>
          )}

          {taskType === 'full_pipeline' && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <Label htmlFor="run-express" className="flex-col items-start gap-0.5">
                <span className="text-xs font-medium">Skip review gates</span>
                <span className="text-[11px] text-muted font-normal">Run all stages without pausing for approval.</span>
              </Label>
              <Switch id="run-express" checked={express} onCheckedChange={setExpress} />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeNewRun}>Cancel</Button>
            <Button type="submit" variant="accent" className="gap-1.5">
              <Icon name="play" className="w-3.5 h-3.5" />
              Start
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
