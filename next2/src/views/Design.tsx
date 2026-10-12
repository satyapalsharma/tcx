'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../components/AppShell';
import { PageHeader, StatusBadge } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useApp } from '@/context/AppContext';
import { usePipeline } from '@/context/PipelineContext';
import { ARTIFACT_LABELS, type Artifact, type ArtifactKind, type StageType } from '@/data/pipeline';
import { DiagramPreview } from '@/components/pipeline/DiagramPreview';
import { JobOutputPicker, ValidationBadge } from '@/components/pipeline/JobOutputPicker';
import { addProcessNode, connectProcessNodes, disconnectProcessNodes, parseDiagramSteps, parseProcessConnections, parseProcessNodes, removeProcessNode, replaceDiagramSteps } from '@/lib/diagram-source';

type DesignKind = Extract<ArtifactKind, 'process_map' | 'uml'>;
const kindLabels: Record<DesignKind, string> = { process_map: 'Process map', uml: 'UML sequence' };
const designKinds: ArtifactKind[] = ['process_map', 'uml'];
const nextStage: Record<DesignKind, Exclude<StageType, 'full_pipeline'>> = {
  process_map: 'generate_uml', uml: 'generate_agent',
};

export default function Design() {
  const { currentWorkspace, openNewRun } = useApp();
  const { artifacts, runs, selectedArtifactId, handoffArtifact, updateArtifact, approveArtifact, retryRun } = usePipeline();
  const designArtifacts = artifacts.filter((item) => item.kind === 'process_map' || item.kind === 'uml');
  const selected = designArtifacts.find((item) => item.id === selectedArtifactId) ?? designArtifacts[0];
  const [tab, setTab] = useState<DesignKind>(selected?.kind === 'uml' ? 'uml' : 'process_map');
  const [editing, setEditing] = useState(false);
  const [stepNames, setStepNames] = useState<string[]>([]);
  const [editContent, setEditContent] = useState('');
  const [newStepName, setNewStepName] = useState('');
  const [connectFrom, setConnectFrom] = useState('');
  const [connectTo, setConnectTo] = useState('');
  const [notes, setNotes] = useState('');
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [sourceDraft, setSourceDraft] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const selectedForTab = designArtifacts.find((item) => item.kind === tab && item.id === selectedArtifactId);
  // Keep the initially selected artifact visible, but never silently replace a
  // job-specific selection with an unrelated artifact when switching tabs.
  const current = selectedForTab ?? (!designArtifacts.some((item) => item.id === selectedArtifactId) ? designArtifacts.find((item) => item.kind === tab) : undefined);

  const related = useMemo(() => artifacts.filter((item) => item.kind === 'clusters'), [artifacts]);
  const sourceRun = runs.find((run) => run.id === current?.runId);
  const stageType: StageType = tab === 'process_map' ? 'design_flow' : 'generate_uml';
  const stageRun = [...runs].filter((run) => run.type === stageType || run.plannedStages?.includes(stageType)).sort((a, b) => b.createdAt - a.createdAt)[0];
  const runIsActive = stageRun && ['queued', 'running', 'paused'].includes(stageRun.status);
  const selectedPipelineActive = Boolean(current && sourceRun && ['queued', 'running', 'paused'].includes(sourceRun.status) && (sourceRun.type === 'full_pipeline' || sourceRun.plannedStages?.includes(nextStage[current.kind as DesignKind])));
  const draftNodes = current?.kind === 'process_map' ? parseProcessNodes(editContent) : [];
  const draftConnections = current?.kind === 'process_map' ? parseProcessConnections(editContent) : [];
  const startEdit = (artifact: Artifact, label?: string) => {
    const content = artifact.content ?? '';
    setEditContent(content);
    setStepNames(parseDiagramSteps(content));
    const nodes = artifact.kind === 'process_map' ? parseProcessNodes(content) : [];
    setConnectFrom(nodes[0]?.id ?? '');
    setConnectTo(nodes[1]?.id ?? nodes[0]?.id ?? '');
    setEditingLabel(label ?? null);
    setNotes(artifact.notes ?? '');
    setNameDraft(artifact.name);
    setEditing(true);
  };
  const updateProcessDraft = (content: string) => {
    setEditContent(content);
    setStepNames(parseDiagramSteps(content));
    const nodes = parseProcessNodes(content);
    setConnectFrom((value) => nodes.some((node) => node.id === value) ? value : nodes[0]?.id ?? '');
    setConnectTo((value) => nodes.some((node) => node.id === value) ? value : nodes[1]?.id ?? nodes[0]?.id ?? '');
  };
  const saveEdit = () => {
    if (!current) return;
    updateArtifact(current.id, { name: nameDraft.trim() || current.name, content: replaceDiagramSteps(editContent || current.content || '', stepNames), notes });
    setEditing(false);
  };

  return <AppShell crumb="Design">
    <main className="mx-auto w-full max-w-[1280px] space-y-6 p-5 sm:p-8" data-od-id="design-page">
      <PageHeader title="Design" description={`Turn shared analysis into process maps and UML sequences for Project ${currentWorkspace.name}.`} actions={selectedPipelineActive && sourceRun ? <Button asChild variant="accent"><a href={`/jobs?jobId=${encodeURIComponent(sourceRun.id)}`}>View pipeline progress</a></Button> : current ? <Button variant="accent" onClick={() => handoffArtifact(current.id, nextStage[current.kind as DesignKind])}>{current.kind === 'process_map' ? 'Continue to UML' : 'Continue to Develop'}</Button> : <Button variant="accent" onClick={() => openNewRun('design_flow')}>Create a process map</Button>} />

      {related.length > 0 && <details className="rounded-xl border border-border bg-surface px-4"><summary className="cursor-pointer py-3 text-sm font-medium">Advanced · reuse Analysis outputs ({related.length})</summary><div className="grid gap-3 border-t border-border py-3 sm:grid-cols-2 lg:grid-cols-3">{related.slice(0, 6).map((item) => <div key={item.id} className="rounded-xl border border-border bg-surface p-3"><div className="flex justify-between gap-2"><span className="text-sm font-semibold">{item.name}</span><StatusBadge status={item.status === 'approved' ? 'success' : item.status === 'review' ? 'warn' : 'muted'}>{item.status}</StatusBadge></div><p className="mt-1 text-xs text-muted">{ARTIFACT_LABELS[item.kind]}</p><Button size="sm" variant="outline" className="mt-3" onClick={() => handoffArtifact(item.id, 'design_flow')}>Reuse in a flow</Button></div>)}</div></details>}

      {runIsActive && stageRun && <Card className="space-y-3 border-accent-border/60 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-sm font-semibold">{stageRun.status === 'paused' ? 'Design run paused' : 'Design in progress'}</h2><p className="mt-1 text-xs text-muted">{stageRun.name} · {stageRun.progress}%</p></div><Link href={`/jobs?jobId=${encodeURIComponent(stageRun.id)}`} className="text-xs font-medium text-accent-strong hover:underline">Open job details</Link></div><div className="flex flex-wrap gap-2">{stageRun.steps.map((step) => <Badge key={step.id} variant="outline" className="capitalize">{step.label} · {step.status}</Badge>)}</div></Card>}
      {stageRun?.status === 'failed' && <Card className="flex flex-wrap items-center justify-between gap-3 border-danger/30 p-4"><div><h2 className="text-sm font-semibold text-danger-fg">Design run failed</h2><p className="mt-1 text-xs text-muted">{stageRun.error || `${stageRun.name} could not produce an output.`}</p></div><Button size="sm" variant="outline" onClick={() => retryRun(stageRun.id)}>Retry run</Button></Card>}

      <JobOutputPicker key={currentWorkspace.id} kinds={designKinds} selectedId={current?.id ?? null} title="Process maps and UML" description="Choose a specific output from a job or imported flow." emptyMessage="No process map or UML output yet." onSelect={(id) => { const found = designArtifacts.find((item) => item.id === id); if (found) setTab(found.kind as DesignKind); }} />

      <div className="space-y-4">
        <div className="flex justify-end"><details className="relative"><summary className="cursor-pointer list-none rounded-lg border border-border px-3 py-2 text-xs font-medium">More options</summary><div className="absolute right-0 z-10 mt-1 w-48 rounded-lg border border-border bg-surface p-2 shadow-lg"><Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => openNewRun(tab === 'uml' ? 'generate_uml' : 'design_flow')}>Create {tab === 'uml' ? 'UML sequence' : 'process map'}</Button>{current && current.status !== 'approved' && <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => approveArtifact(current.id)}>Mark validated</Button>}</div></details></div>
          <Tabs value={tab} onValueChange={(value) => setTab(value as DesignKind)}>
            <TabsList><TabsTrigger value="process_map">Process maps</TabsTrigger><TabsTrigger value="uml">UML sequences</TabsTrigger></TabsList>
            {(['process_map', 'uml'] as const).map((kind) => <TabsContent value={kind} key={kind} className="space-y-4">
              {current && current.kind === kind ? <>
                <Card className="overflow-hidden"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold">{current.name}</h2><StatusBadge status={current.status === 'approved' ? 'success' : current.status === 'review' ? 'warn' : 'muted'}>{current.status}</StatusBadge>{current.sample && <Badge variant="outline">Sample</Badge>}</div></div><Button variant="outline" size="sm" onClick={() => startEdit(current)}>Edit {kind === 'process_map' ? 'process map' : 'sequence'}</Button></div>
                  <div className="p-3 sm:p-5"><DiagramPreview key={current.id} content={current.content ?? ''} kind={kind} onEdit={(label) => startEdit(current, label)} /></div>
                {current.sample && <p className="border-t border-border px-4 py-2 text-xs text-muted">Sample content for exploring the designer.</p>}
                </Card>
                <details className="rounded-xl border border-border bg-surface p-4"><summary className="cursor-pointer text-sm font-medium">Advanced details and editing</summary><p className="mt-2 text-xs text-muted">Version {current.version} · Updated by {current.updatedBy ?? current.createdBy}{sourceRun && <> · {sourceRun.name} · {sourceRun.id}</>}{current.validatedBy && <> · Validated by {current.validatedBy} at v{current.validatedVersion ?? current.version}</>}</p><ValidationBadge status={current.status} /><p className="mt-2 text-xs text-muted">The source editor supports a limited Mermaid subset; other syntax remains visible as source preview. Source changes create a new revision.</p><Button size="sm" variant="outline" className="mt-3" onClick={() => { setSourceDraft(current.content ?? ''); setSourceOpen(true); }}>Edit {kind === 'process_map' ? 'Mermaid' : 'sequence'} source</Button></details>
              </> : <Card className="p-10 text-center"><h2 className="font-semibold">No {kindLabels[kind].toLowerCase()} output yet</h2><p className="mt-1 text-sm text-muted">{stageRun?.status === 'failed' ? 'Review the failed run above and retry, or start another run.' : 'Start from an existing Project input or import your own definition.'}</p><Button variant="outline" className="mt-4" onClick={() => openNewRun(kind === 'uml' ? 'generate_uml' : 'design_flow')}>{kind === 'uml' ? 'Create UML' : 'Create process map'}</Button></Card>}
            </TabsContent>)}
          </Tabs>
      </div>

      <Dialog open={editing && Boolean(current)} onOpenChange={(open) => { if (!open) setEditing(false); }}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <div>
            <DialogTitle className="text-lg">Edit {current ? kindLabels[current.kind as DesignKind].toLowerCase() : 'design'}</DialogTitle>
            <DialogDescription>{editingLabel ? `Editing “${editingLabel}” · ` : ''}Save creates a new shared revision; teammates can review it.</DialogDescription>
          </div>
          {current && <>
            <label className="block space-y-1 text-sm">Name<Input value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} /></label>
            <div className="space-y-2">
              <p className="text-sm font-medium">{current.kind === 'process_map' ? 'Process steps' : 'Participants and messages'}</p>
              {stepNames.map((step, index) => <div key={`${current.id}-${index}`} className="flex gap-2">
                <Input aria-label={`${current.kind === 'process_map' ? 'Step' : 'Participant or message'} ${index + 1} name`} autoFocus={Boolean(editingLabel && (step === editingLabel || step.endsWith(editingLabel)))} value={step} onChange={(event) => setStepNames((prev) => prev.map((value, i) => i === index ? event.target.value : value))} />
                {current.kind === 'process_map' && <Button type="button" variant="ghost" size="sm" aria-label={`Remove ${step}`} onClick={() => updateProcessDraft(removeProcessNode(replaceDiagramSteps(editContent, stepNames), draftNodes[index]?.id ?? ''))}>Remove</Button>}
              </div>)}
            </div>
            {current.kind === 'process_map' && <div className="space-y-3 rounded-lg border border-border bg-surface-inset/30 p-3">
              <div>
                <p className="text-sm font-medium">Add a process step</p>
                <div className="mt-2 flex gap-2"><Input value={newStepName} onChange={(event) => setNewStepName(event.target.value)} placeholder="Step name" aria-label="New process step name" /><Button type="button" variant="outline" onClick={() => { if (!newStepName.trim()) return; updateProcessDraft(addProcessNode(replaceDiagramSteps(editContent, stepNames), newStepName).content); setNewStepName(''); }}>Add step</Button></div>
              </div>
              <details>
                <summary className="cursor-pointer text-sm font-medium">Connections · add or remove links</summary>
                <div className="space-y-3 pt-3">
                  <div>
                    <p className="text-sm font-medium">Connect steps</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <select aria-label="Connection source step" className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 text-xs" value={connectFrom} onChange={(event) => setConnectFrom(event.target.value)}>{draftNodes.map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}</select>
                      <span aria-hidden="true" className="text-muted">→</span>
                      <select aria-label="Connection target step" className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 text-xs" value={connectTo} onChange={(event) => setConnectTo(event.target.value)}>{draftNodes.map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}</select>
                      <Button type="button" variant="outline" size="sm" onClick={() => updateProcessDraft(connectProcessNodes(replaceDiagramSteps(editContent, stepNames), connectFrom, connectTo))} disabled={!connectFrom || !connectTo || connectFrom === connectTo}>Connect</Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Current connections</p>
                    {draftConnections.length ? <ul className="mt-2 space-y-1">{draftConnections.map((edge, index) => <li key={`${edge.from}-${edge.to}-${index}`} className="flex items-center justify-between gap-2 rounded bg-surface px-2 py-1.5 text-xs"><span>{draftNodes.find((node) => node.id === edge.from)?.label ?? edge.from} → {draftNodes.find((node) => node.id === edge.to)?.label ?? edge.to}</span><Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => updateProcessDraft(disconnectProcessNodes(replaceDiagramSteps(editContent, stepNames), edge.from, edge.to))}>Remove link</Button></li>)}</ul> : <p className="mt-1 text-xs text-muted">No connections yet.</p>}
                  </div>
                </div>
              </details>
            </div>}
            <label className="block space-y-1 text-sm">Review notes<Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Context for the next teammate" /></label>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button><Button variant="accent" onClick={saveEdit}>Save revision</Button></div>
          </>}
        </DialogContent>
      </Dialog>

      <Dialog open={sourceOpen && Boolean(current)} onOpenChange={(open) => { if (!open) setSourceOpen(false); }}><DialogContent className="max-w-3xl"><DialogTitle>Edit source</DialogTitle><DialogDescription>Advanced source editor · saving updates the shared preview.</DialogDescription><Textarea rows={18} className="font-mono text-xs" value={sourceDraft} onChange={(event) => setSourceDraft(event.target.value)} /><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setSourceOpen(false)}>Cancel</Button><Button variant="accent" onClick={() => { if (current) updateArtifact(current.id, { content: sourceDraft }); setSourceOpen(false); }}>Save source</Button></div></DialogContent></Dialog>
    </main>
  </AppShell>;
}
