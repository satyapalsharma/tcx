'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, type ModularTaskType, type Workspace } from '@/context/AppContext';
import { usePipeline } from '@/context/PipelineContext';
import { ARTIFACT_LABELS, STAGE_INPUT, TASK_LABELS, type ArtifactKind, type StageType } from '@/data/pipeline';
import { useToast } from '@/components/Toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SelectField } from '@/components/common';

const GROUPS: { title: string; types: { type: StageType; description: string }[] }[] = [
  { title: 'Analysis', types: [
    { type: 'extract_intents', description: 'Find intents, resolutions, escalation and friction signals.' },
    { type: 'cluster_intents', description: 'Group intents into an L1 → L2 → L3 taxonomy.' },
  ] },
  { title: 'Design', types: [
    { type: 'design_flow', description: 'Create or refine a customer process map.' },
    { type: 'generate_uml', description: 'Create a UML sequence from a process map.' },
  ] },
  { title: 'Develop', types: [
    { type: 'generate_agent', description: 'Prepare an agent scaffold for your chosen runtime.' },
  ] },
];
const TYPES = [...GROUPS.flatMap((group) => group.types), { type: 'full_pipeline' as const, description: 'Run intent discovery, clustering, process maps, UML and agent generation in one job.' }];
const RUNTIMES = ['Google ADK', 'CX Agent Studio', 'Amazon Bedrock', 'LangGraph'];
const STAGE_ORDER: Exclude<StageType, 'full_pipeline'>[] = ['extract_intents', 'cluster_intents', 'design_flow', 'generate_uml', 'generate_agent'];
const ACCEPT: Record<StageType, string> = {
  extract_intents: '.xlsx,.xls,.csv,.json,.txt,.eml,.mp3,.wav,.m4a,.mp4',
  cluster_intents: '.csv,.json',
  design_flow: '.json,.csv',
  generate_uml: '.json,.puml,.mmd,.txt',
  generate_agent: '.json,.mmd,.puml,.txt,.yaml,.yml,.py,.ts',
  full_pipeline: '.xlsx,.xls,.csv,.json,.txt,.eml,.mp3,.wav,.m4a,.mp4',
};
const FORMAT_HELP: Record<StageType, string> = {
  extract_intents: 'Conversation data: Excel, CSV, JSON, TXT, EML, or audio.',
  cluster_intents: 'Intent lists: CSV or JSON.',
  design_flow: 'Cluster lists: JSON or CSV. You can start without running Analysis.',
  generate_uml: 'Process maps or diagram definitions: JSON, PlantUML, Mermaid, or text.',
  generate_agent: 'Process maps or UML definitions: JSON, Mermaid, PlantUML, or text.',
  full_pipeline: 'Conversation data: Excel, CSV, JSON, TXT, EML, or audio.',
};
function defaultName(type: StageType) {
  return `${TASK_LABELS[type]} · ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
}
function defaultAdvanced(type: StageType): Record<string, string | boolean> {
  if (type === 'extract_intents' || type === 'full_pipeline') return { language: 'Auto-detect', redaction: 'Standard masking' };
  if (type === 'cluster_intents') return { groupDepth: 'All three levels (L1–L2–L3)' };
  if (type === 'design_flow') return { mapDetail: 'Balanced' };
  if (type === 'generate_uml') return { diagramDetail: 'Standard' };
  return { includeToolStubs: true };
}

export function NewRunModal() {
  const { isNewRunOpen, newRunDefaultType, currentWorkspace } = useApp();
  if (!isNewRunOpen) return null;
  return <NewJobDialog key={`${newRunDefaultType}-${currentWorkspace.id}`} initialType={newRunDefaultType} workspace={currentWorkspace} />;
}

function NewJobDialog({ initialType, workspace }: { initialType: ModularTaskType; workspace: Workspace }) {
  const { closeNewRun } = useApp();
  const { artifacts, connections, selectedArtifactId, startRun } = usePipeline();
  const toast = useToast();
  const router = useRouter();
  const [taskType, setTaskType] = useState<StageType>(initialType);
  const [name, setName] = useState('');
  const [sourceMode, setSourceMode] = useState<'artifact' | 'file' | 'connection'>(() => artifacts.some(a => STAGE_INPUT[initialType].includes(a.kind)) ? 'artifact' : 'file');
  const [showTools, setShowTools] = useState(false);
  const [artifactId, setArtifactId] = useState('');
  const [connectionId, setConnectionId] = useState('');
  const [clusterTarget, setClusterTarget] = useState('all');
  const [file, setFile] = useState<File | null>(null);
  const [inputKind, setInputKind] = useState<'conversations' | 'nuance' | 'ivr'>('conversations');
  const [endStage, setEndStage] = useState<Exclude<StageType, 'full_pipeline'>>(initialType === 'full_pipeline' ? 'generate_agent' : initialType);
  const [runtime, setRuntime] = useState(RUNTIMES[0]);
  const [advanced, setAdvanced] = useState<Record<string, string | boolean>>(() => defaultAdvanced(initialType));
  const [error, setError] = useState('');
  const compatibleArtifacts = useMemo(() => artifacts.filter((artifact) => STAGE_INPUT[taskType].includes(artifact.kind as ArtifactKind)), [artifacts, taskType]);
  const hasConnections = taskType === 'extract_intents' || taskType === 'full_pipeline';
  const compatibleSelected = compatibleArtifacts.find((artifact) => artifact.id === selectedArtifactId);
  const chosenArtifact = compatibleArtifacts.find((artifact) => artifact.id === artifactId) ?? compatibleSelected ?? compatibleArtifacts[0];
  const clusterOptions = useMemo(() => {
    if (taskType !== 'design_flow' || sourceMode !== 'artifact' || chosenArtifact?.kind !== 'clusters') return [];
    try {
      const nodes: unknown = JSON.parse(chosenArtifact.content ?? '[]');
      if (!Array.isArray(nodes)) return [];
      const options: {value:string;label:string}[] = [];
      const visit = (items: unknown[], path = '') => {
        for (const item of items) {
          if (!item || typeof item !== 'object' || !('id' in item) || !('name' in item) || typeof item.id !== 'string' || typeof item.name !== 'string') continue;
          const name = path ? `${path} / ${item.name}` : item.name;
          options.push({value:item.id,label:name});
          if ('children' in item && Array.isArray(item.children)) visit(item.children,name);
        }
      };
      visit(nodes);
      return options;
    } catch { return []; }
  }, [taskType, sourceMode, chosenArtifact]);
  const effectiveClusterTarget = clusterOptions.some(option => option.value === clusterTarget) ? clusterTarget : 'all';
  const chosenConnection = connections.find((connection) => connection.id === connectionId && connection.status === 'connected');
  const hasInput = sourceMode === 'file' ? Boolean(file) : sourceMode === 'artifact' ? Boolean(chosenArtifact) : Boolean(chosenConnection);
  const startIndex = STAGE_ORDER.indexOf(taskType === 'full_pipeline' ? 'extract_intents' : taskType);
  const endIndex = Math.max(startIndex, STAGE_ORDER.indexOf(endStage));
  const plannedStages = STAGE_ORDER.slice(startIndex, endIndex + 1);
  const isRuntimeTask = plannedStages.includes('generate_agent');

  const changeType = (type: StageType) => {
    setTaskType(type);
    setEndStage(type === 'full_pipeline' ? 'generate_agent' : type);
    setShowTools(false);
    setAdvanced(defaultAdvanced(type));
    setArtifactId('');
    setClusterTarget('all');
    setConnectionId('');
    setFile(null);
    setError('');
    if (type === 'extract_intents' || type === 'full_pipeline') setSourceMode('file');
    else setSourceMode(artifacts.some(a => STAGE_INPUT[type].includes(a.kind)) ? 'artifact' : 'file');
  };
  const selectSourceMode = (mode: 'artifact' | 'file' | 'connection') => {
    setSourceMode(mode);
    setError('');
  };
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      const run = startRun({
        name: name.trim() || defaultName(taskType),
        type: taskType,
        inputKind: hasConnections && sourceMode === 'file' ? inputKind : undefined,
        plannedStages,
        sourceArtifactId: sourceMode === 'artifact' ? chosenArtifact?.id : undefined,
        sourceConnectionId: sourceMode === 'connection' ? chosenConnection?.id : undefined,
        fileName: sourceMode === 'file' ? file?.name : undefined,
        runtime: isRuntimeTask ? runtime : undefined,
        advanced: clusterOptions.length ? {...advanced, clusterTarget: effectiveClusterTarget, clusterName: clusterOptions.find(option=>option.value===effectiveClusterTarget)?.label ?? 'All clusters'} : advanced,
      });
      closeNewRun();
      toast(`${run.id} queued in ${workspace.name}`, 'play');
      router.push('/jobs');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create this job. Check the input and try again.');
    }
  };

  return <Dialog open onOpenChange={(open) => !open && closeNewRun()}>
    <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{taskType === 'full_pipeline' ? 'Start a pipeline' : TASK_LABELS[taskType]}</DialogTitle>
      <DialogDescription>{taskType === 'full_pipeline' ? <>Start with your conversation data in <span className="font-medium text-foreground">{workspace.name}</span>. Choose your file to get started.</> : <>Create a {TASK_LABELS[taskType].toLowerCase()} job in <span className="font-medium text-foreground">{workspace.name}</span>.</>}</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-border bg-surface-inset/50 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted">{GROUPS.find(g => g.types.some(t => t.type === taskType))?.title ?? 'Recommended workflow'}</p>
          <p className="text-sm font-semibold">{TASK_LABELS[taskType]}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{plannedStages.map(stage => ({extract_intents:'Find intents',cluster_intents:'Group intents',design_flow:'Process map',generate_uml:'System flow',generate_agent:'Agent code'})[stage]).join(' → ')}{isRuntimeTask && ` · ${runtime}`}</p>
        </div>

        

        <fieldset className="space-y-3"><legend className="text-sm font-medium">Your input</legend>
          {sourceMode !== 'file' && <div className="flex flex-wrap gap-2" role="group" aria-label="Input source">{([...(STAGE_INPUT[taskType].length ? ['artifact'] : []), 'file', ...(hasConnections ? ['connection'] : [])] as ('artifact' | 'file' | 'connection')[]).map((mode) => <Button key={mode} type="button" size="sm" variant={sourceMode === mode ? 'secondary' : 'outline'} aria-pressed={sourceMode === mode} onClick={() => selectSourceMode(mode)}>{mode === 'artifact' ? 'Project output' : mode === 'file' ? 'Upload a file' : 'Connected source'}</Button>)}</div>}
          {sourceMode === 'artifact' && <div className="space-y-2">{compatibleArtifacts.length ? <><SelectField id="job-artifact" aria-label="Choose a compatible project output" value={artifactId || chosenArtifact?.id || ''} onValueChange={setArtifactId} options={compatibleArtifacts.map((artifact) => ({ value: artifact.id, label: `${artifact.name} · v${artifact.version}` }))} className="h-10 w-full"/><div className="flex flex-wrap gap-2">{chosenArtifact && <Badge variant="outline">{chosenArtifact.status === 'approved' ? 'Validated' : 'Not validated'} · {chosenArtifact.createdBy} · v{chosenArtifact.version}</Badge>}</div></> : <p className="rounded-lg border border-dashed border-border p-3 text-xs leading-5 text-muted">No {STAGE_INPUT[taskType].map((kind) => ARTIFACT_LABELS[kind]).join(' or ')} in this project yet. Upload your own input file or continue in another stage.</p>}</div>}
          {sourceMode === 'file' && <div className="space-y-2">{hasConnections && <fieldset><legend className="mb-2 text-xs font-medium">Data type</legend><div className="flex flex-wrap gap-2">{(['conversations','nuance','ivr'] as const).map(kind=><Button key={kind} type="button" size="sm" variant={inputKind===kind?'accent-soft':'outline'} aria-pressed={inputKind===kind} onClick={()=>{setInputKind(kind);setFile(null);}}>{kind==='conversations'?'Excel / conversations':kind==='nuance'?'Nuance document':'IVR data'}</Button>)}</div></fieldset>}<Input key={`${taskType}-${inputKind}`}  aria-label="Choose an input file" type="file" accept={hasConnections && inputKind === 'nuance' ? '.doc,.docx,.pdf,.txt,.xml' : hasConnections && inputKind === 'ivr' ? '.xlsx,.xls,.csv,.json,.xml,.txt' : ACCEPT[taskType]} onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="h-auto min-h-10 cursor-pointer py-2 text-xs file:mr-3 file:rounded file:border-0 file:bg-surface-inset file:px-2 file:py-1 file:text-xs file:font-medium"/><p className="text-xs text-muted">{hasConnections && inputKind === 'nuance' ? 'Nuance documents: DOC, DOCX, PDF, TXT or XML.' : hasConnections && inputKind === 'ivr' ? 'IVR flows and interaction logs: Excel, CSV, JSON, XML or TXT.' : FORMAT_HELP[taskType]} {file && <span className="font-medium text-foreground">Selected: {file.name} ({Math.max(1, Math.round(file.size / 1024))} KB)</span>}</p></div>}
          {sourceMode === 'connection' && <div className="space-y-2">{connections.filter((connection) => connection.status === 'connected').length ? <><SelectField id="job-connection" aria-label="Choose a connected source" value={connectionId} onValueChange={setConnectionId} options={connections.filter((connection) => connection.status === 'connected').map((connection) => ({ value: connection.id, label: `${connection.name} · ${connection.provider}` }))} placeholder="Choose connected source" className="h-10 w-full"/><p className="text-xs text-muted">Uses an existing organization connection. This demo does not sync external data.</p></> : <p className="rounded-lg border border-dashed border-border p-3 text-xs leading-5 text-muted">No connected sources are set up for this organization. Add one in Connections, or upload a file.</p>}</div>}
          {sourceMode === 'artifact' && chosenArtifact && <p className="text-[11px] leading-4 text-muted">Shared drafts can be used directly. Reviews are optional.</p>}
          {sourceMode === 'file' && <details className="rounded-lg border border-border px-3"><summary className="cursor-pointer py-2 text-xs font-medium text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong">{hasConnections ? 'Use a connected source instead' : 'Use a project output instead'}</summary><div className="flex flex-wrap gap-2 border-t border-border py-3" role="group" aria-label="Alternative input source">{([...(STAGE_INPUT[taskType].length ? ['artifact'] : []), ...(hasConnections ? ['connection'] : [])] as ('artifact' | 'connection')[]).map(mode => <Button key={mode} type="button" size="sm" variant="outline" onClick={() => selectSourceMode(mode)}>{mode === 'artifact' ? 'Project output' : 'Connected source'}</Button>)}</div></details>}
        </fieldset>

        <details className="rounded-xl border border-border px-3"><summary className="cursor-pointer py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong">Customize pipeline <span className="ml-2 text-xs font-normal text-muted">Choose tools, steps and runtime</span></summary><div className="space-y-4 border-t border-border py-3">
          <div className="space-y-1.5"><Label htmlFor="job-name">Job name <span className="font-normal text-muted">(optional)</span></Label><Input id="job-name" value={name} onChange={(event) => setName(event.target.value)} placeholder={defaultName(taskType)} maxLength={100} /></div>
          <Button type="button" size="sm" variant="outline" aria-expanded={showTools} onClick={() => setShowTools(!showTools)}>{showTools ? 'Hide tool choices' : 'Choose a specific tool'}</Button>
          {showTools && <div className="space-y-3">
          <button type="button" aria-pressed={taskType === 'full_pipeline'} onClick={() => changeType('full_pipeline')} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong ${taskType === 'full_pipeline' ? 'border-accent-strong bg-accent-soft/50' : 'border-border hover:bg-surface-hover/40'}`}><span className="mt-0.5 rounded-md bg-accent-soft px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent-strong">Recommended</span><span><span className="block text-sm font-medium">{TASK_LABELS.full_pipeline}</span><span className="mt-1 block text-xs text-muted">{TYPES.find((item) => item.type === 'full_pipeline')?.description}</span></span></button>
          {GROUPS.map((group) => <fieldset key={group.title} className="space-y-2"><legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{group.title}</legend><div className="grid gap-2 sm:grid-cols-2">{group.types.map((item) => <button key={item.type} type="button" aria-pressed={taskType === item.type} onClick={() => changeType(item.type)} className={`rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong ${taskType === item.type ? 'border-accent-strong bg-accent-soft/50' : 'border-border hover:bg-surface-hover/40'}`}><span className="block text-sm font-medium">{TASK_LABELS[item.type]}</span><span className="mt-1 block text-xs leading-5 text-muted">{item.description}</span></button>)}</div></fieldset>)}
          </div>}
          {clusterOptions.length > 1 && <div className="space-y-2"><Label htmlFor="job-cluster">Cluster to map</Label><SelectField id="job-cluster" value={effectiveClusterTarget} onValueChange={setClusterTarget} options={[{value:'all',label:'All clusters'},...clusterOptions]} className="h-10 w-full"/><p className="text-xs text-muted">Choose the branch you want to design. Each generated map will remain a separate output under this job.</p></div>}
          <div className="space-y-2"><Label htmlFor="job-end-stage">Run through</Label><SelectField id="job-end-stage" value={STAGE_ORDER[endIndex]} onValueChange={value=>setEndStage(value as Exclude<StageType,'full_pipeline'>)} options={STAGE_ORDER.slice(startIndex).map(stage=>({value:stage,label:stage===taskType?`${TASK_LABELS[stage]} only`:TASK_LABELS[stage]}))} className="h-10 w-full"/><p className="text-xs text-muted">{plannedStages.map(stage=>TASK_LABELS[stage]).join(' → ')}. Only upcoming steps are included; validation is optional.</p></div>
          {isRuntimeTask && <div className="space-y-1.5"><Label htmlFor="job-runtime">Target runtime</Label><SelectField id="job-runtime" value={runtime} onValueChange={setRuntime} options={RUNTIMES} className="h-10 w-full" /></div>}

        <details className="rounded-xl border border-border px-3"><summary className="cursor-pointer py-3 text-sm font-medium text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong">Advanced options <span className="ml-2 text-xs font-normal">Defaults are suitable for most jobs</span></summary><div className="grid gap-3 border-t border-border py-3 sm:grid-cols-2">
          {(taskType === 'extract_intents' || taskType === 'full_pipeline') && <><div className="space-y-1.5"><Label htmlFor="job-language">Conversation language</Label><SelectField id="job-language" value={String(advanced.language)} onValueChange={(value) => setAdvanced((current) => ({ ...current, language: value }))} options={['Auto-detect', 'English', 'Hindi', 'Spanish']} className="h-9 w-full"/></div><div className="space-y-1.5"><Label htmlFor="job-redaction">Sensitive data masking</Label><SelectField id="job-redaction" value={String(advanced.redaction)} onValueChange={(value) => setAdvanced((current) => ({ ...current, redaction: value }))} options={['Standard masking', 'Strict masking', 'Minimal masking']} className="h-9 w-full"/></div></>}
          {taskType === 'cluster_intents' && <div className="space-y-1.5"><Label htmlFor="job-depth">Taxonomy depth</Label><SelectField id="job-depth" value={String(advanced.groupDepth)} onValueChange={(value) => setAdvanced({ groupDepth: value })} options={['L1 only', 'L1 and L2', 'All three levels (L1–L2–L3)']} className="h-9 w-full"/></div>}
          {taskType === 'design_flow' && <div className="space-y-1.5"><Label htmlFor="job-map-detail">Process map detail</Label><SelectField id="job-map-detail" value={String(advanced.mapDetail)} onValueChange={(value) => setAdvanced({ mapDetail: value })} options={['Concise', 'Balanced', 'Detailed']} className="h-9 w-full"/></div>}
          {taskType === 'generate_uml' && <div className="space-y-1.5"><Label htmlFor="job-uml-detail">Diagram detail</Label><SelectField id="job-uml-detail" value={String(advanced.diagramDetail)} onValueChange={(value) => setAdvanced({ diagramDetail: value })} options={['Standard', 'Detailed interactions']} className="h-9 w-full"/></div>}
          {taskType === 'generate_agent' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(advanced.includeToolStubs)} onChange={(event) => setAdvanced({ includeToolStubs: event.target.checked })} className="accent-[var(--accent-strong)]"/>Include example tool stubs</label>}
          <p className="text-xs leading-5 text-muted sm:col-span-2">These settings are saved with the job so teammates can understand how it was configured.</p>
        </div></details>
        </div></details>

        <p className="text-[11px] leading-4 text-muted">Demo project: uploaded file contents are not processed. Jobs create clearly labeled sample outputs.</p>
        {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
        <DialogFooter><Button type="button" variant="outline" onClick={closeNewRun}>Close</Button><Button type="submit" variant="accent" disabled={!hasInput}>{taskType === 'full_pipeline' ? 'Start pipeline' : 'Queue job'}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
