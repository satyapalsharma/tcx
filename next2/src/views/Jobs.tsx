'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../components/AppShell';
import { useApp } from '@/context/AppContext';
import { usePipeline } from '@/context/PipelineContext';
import { ARTIFACT_LABELS, TASK_LABELS, type Artifact, type PipelineRun, type StageType } from '@/data/pipeline';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/common';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const NEXT_STAGE: Partial<Record<Artifact['kind'], StageType>> = {insights:'cluster_intents',clusters:'design_flow',process_map:'generate_uml',uml:'generate_agent'};
const STATUS_LABEL: Record<PipelineRun['status'], string> = { queued: 'Queued', running: 'Running', paused: 'Paused', completed: 'Completed', failed: 'Failed', cancelled: 'Cancelled' };
const STATUS_STYLE: Record<PipelineRun['status'], string> = {
  queued: 'border-border text-muted', running: 'border-accent-border bg-accent-soft text-accent-strong', paused: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
  completed: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700', failed: 'border-destructive/30 bg-destructive/5 text-destructive', cancelled: 'border-border text-muted',
};
function elapsed(run: PipelineRun) {
  const end = ['completed', 'failed', 'cancelled'].includes(run.status) ? run.updatedAt : Date.now();
  const seconds = Math.max(0, Math.floor((end - run.createdAt) / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes < 1) return `${remainder}s`;
  if (minutes < 60) return `${minutes}m ${remainder}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
function dateTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp);
}
function resultRoute(kind: Artifact['kind']) {
  if (kind === 'insights' || kind === 'clusters') return '/analysis';
  if (kind === 'process_map' || kind === 'uml') return '/design';
  return '/develop';
}
function currentStep(run: PipelineRun) {
  return run.steps.find((step) => step.status === 'running') ?? run.steps.find((step) => step.status === 'waiting');
}

export default function Jobs() {
  const { openNewRun, currentWorkspace } = useApp();
  const { runs, artifacts, connections, pauseRun, resumeRun, cancelRun, retryRun, selectArtifact, handoffArtifact } = usePipeline();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(() => searchParams.get('jobId'));
  const [confirmCancel, setConfirmCancel] = useState(false);
  const visibleRuns = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return runs.filter((run) => {
      const matchesQuery = !normalized || `${run.id} ${run.name} ${TASK_LABELS[run.type]} ${run.fileName ?? ''}`.toLowerCase().includes(normalized);
      return matchesQuery && (!statusFilter || run.status === statusFilter);
    });
  }, [runs, query, statusFilter]);
  const selectedRun = runs.find((run) => run.id === selectedRunId) ?? null;
  const sourceArtifact = selectedRun?.sourceArtifactId ? artifacts.find((artifact) => artifact.id === selectedRun.sourceArtifactId) : undefined;
  const sourceConnection = selectedRun?.sourceConnectionId ? connections.find((connection) => connection.id === selectedRun.sourceConnectionId) : undefined;
  const outputs = selectedRun ? artifacts.filter((artifact) => artifact.runId === selectedRun.id) : [];

  const openOutput = (artifact: Artifact) => {
    selectArtifact(artifact.id);
    setSelectedRunId(null);
    router.push(resultRoute(artifact.kind));
  };
  const runAction = (action: 'pause' | 'resume' | 'cancel' | 'retry') => {
    if (!selectedRun) return;
    if (action === 'pause') pauseRun(selectedRun.id);
    if (action === 'resume') resumeRun(selectedRun.id);
    if (action === 'cancel') { cancelRun(selectedRun.id); setConfirmCancel(false); }
    if (action === 'retry') retryRun(selectedRun.id);
  };
  const openRun = (run: PipelineRun) => { setConfirmCancel(false); setSelectedRunId(run.id); };

  return <AppShell crumb="Jobs">
    <main className="mx-auto w-full max-w-[1280px] space-y-6 p-5 pb-16 sm:p-8" data-od-id="jobs-page">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{currentWorkspace.name}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Jobs</h1></div><Button variant="accent" onClick={() => openNewRun('full_pipeline')}>Start pipeline</Button></header>

      <Card className="overflow-hidden border-border p-0">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold">Project jobs <span className="font-normal text-muted">({visibleRuns.length})</span></h2></div><div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><Input aria-label="Search jobs" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search jobs…" className="sm:w-64"/><SelectField id="job-status-filter" aria-label="Filter jobs by status" value={statusFilter} onValueChange={setStatusFilter} options={[{ value: '', label: 'Any status' }, { value: 'queued', label: 'Queued' }, { value: 'running', label: 'Running' }, { value: 'paused', label: 'Paused' }, { value: 'completed', label: 'Completed' }, { value: 'failed', label: 'Failed' }, { value: 'cancelled', label: 'Cancelled' }]} className="sm:w-40"/></div></div>
        {visibleRuns.length ? <div className="divide-y divide-border">{visibleRuns.map((run) => {
          const activeStep = currentStep(run);
          const runOutputs = artifacts.filter((artifact) => artifact.runId === run.id);
          return <div key={run.id} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">{run.name}</h3><p className="mt-1 text-xs text-muted">{TASK_LABELS[run.type]} · {run.id} · {runOutputs.length} outputs</p></div><Badge variant="outline" className={STATUS_STYLE[run.status]}>{STATUS_LABEL[run.status]}</Badge>{run.status==='completed'&&runOutputs.length>0?<Button asChild variant="accent" size="sm"><Link href={`/job-analytics?jobId=${encodeURIComponent(run.id)}`}>View results</Link></Button>:<Button type="button" variant="outline" size="sm" onClick={()=>openRun(run)}>{['running','queued','paused'].includes(run.status)?'View progress':'View details'}</Button>}</div>
            {['running','queued','paused'].includes(run.status) && <div className="mt-3"><div className="flex items-center justify-between text-xs text-muted"><span>{run.status==='paused'?'Paused':activeStep?.label??'Waiting to start'}</span><span>{run.progress}%</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-inset"><div className="h-full rounded-full bg-accent-strong" style={{width:`${run.progress}%`}}/></div></div>}
            {run.status==='failed' && <p className="mt-2 text-xs text-destructive">{run.error??'This job needs attention. Open details to retry.'}</p>}
          </div>;
        })}</div> : <div className="px-5 py-12 text-center"><p className="text-sm font-semibold">{runs.length ? 'No jobs match these filters' : `No jobs in ${currentWorkspace.name} yet`}</p><p className="mt-1 text-xs text-muted">{runs.length ? 'Adjust search or status to find a job.' : 'Start with a project output, file, or connected source.'}</p>{runs.length ? <Button className="mt-4" variant="outline" size="sm" onClick={() => { setQuery(''); setStatusFilter(''); }}>Clear filters</Button> : <Button className="mt-4" variant="accent" size="sm" onClick={() => openNewRun()}>Create first job</Button>}</div>}
      </Card>
    </main>

    <Dialog open={Boolean(selectedRun)} onOpenChange={(open) => { if (!open) { setSelectedRunId(null); setConfirmCancel(false); } }}>
      {selectedRun && <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className={STATUS_STYLE[selectedRun.status]}>{STATUS_LABEL[selectedRun.status]}</Badge><span className="font-mono text-xs text-muted">{selectedRun.id}</span></div><DialogTitle>{selectedRun.name}</DialogTitle><DialogDescription>{TASK_LABELS[selectedRun.type]} · Started {dateTime(selectedRun.createdAt)}</DialogDescription></DialogHeader>
        <div className="space-y-5">
          <section className="rounded-xl border border-border p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">Progress</h3><span className="text-xs tabular-nums text-muted">{selectedRun.progress}% · {elapsed(selectedRun)} elapsed</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-inset"><div className="h-full rounded-full bg-accent-strong transition-all" style={{ width: `${selectedRun.progress}%` }}/></div><ol className="mt-4 space-y-3">{selectedRun.steps.map((item, index) => <li key={item.id} className="flex items-start gap-3"><span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] ${item.status === 'completed' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' : item.status === 'running' ? 'border-accent-border bg-accent-soft text-accent-strong' : item.status === 'failed' ? 'border-destructive/30 text-destructive' : 'border-border text-muted'}`}>{item.status === 'completed' ? '✓' : index + 1}</span><span className="min-w-0 flex-1 text-sm">{item.label}</span><span className="text-xs capitalize text-muted">{item.status}</span></li>)}</ol>{selectedRun.error && <p role="alert" className="mt-3 text-sm text-destructive">{selectedRun.error}</p>}</section>
          <details className="rounded-xl border border-border p-3"><summary className="cursor-pointer text-sm font-medium">Input and advanced settings</summary><div className="mt-3">          <section className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-border p-3"><p className="text-xs text-muted">Input</p>{sourceArtifact ? <div className="mt-1"><p className="text-sm font-medium">{sourceArtifact.name}</p><p className="mt-1 text-xs text-muted">{ARTIFACT_LABELS[sourceArtifact.kind]} · v{selectedRun?.sourceVersion ?? sourceArtifact.version} · {sourceArtifact.createdBy} · {sourceArtifact.status}</p></div> : sourceConnection ? <div className="mt-1"><p className="text-sm font-medium">{sourceConnection.name}</p><p className="text-xs text-muted">{sourceConnection.provider}</p></div> : <p className="mt-1 text-sm font-medium">{selectedRun.fileName ?? 'Project input'}</p>}</div><div className="rounded-xl border border-border p-3"><p className="text-xs text-muted">Job settings</p>{selectedRun.inputKind && <p className="mt-1 text-xs text-muted">Input type: {selectedRun.inputKind === 'nuance' ? 'Nuance document' : selectedRun.inputKind === 'ivr' ? 'IVR data' : 'Conversations / Excel'}</p>}<p className="mt-1 text-sm font-medium">{selectedRun.runtime ?? 'Default workflow'}</p>{selectedRun.advanced && Object.entries(selectedRun.advanced).map(([key, value]) => <p key={key} className="mt-1 text-xs text-muted">{key.replace(/[A-Z]/g, (char) => ` ${char.toLowerCase()}`)}: {String(value)}</p>)}</div></section></div></details>
          <section className="space-y-2"><h3 className="text-sm font-semibold">Outputs <span className="font-normal text-muted">({outputs.length})</span></h3>{outputs.length ? outputs.map((artifact) => <div key={artifact.id} className="flex flex-col justify-between gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-medium">{artifact.name}</p><Badge variant="outline">{artifact.status === 'approved' ? 'Validated' : 'Not validated'}</Badge>{artifact.sample && <Badge variant="outline" className="border-accent-border bg-accent-soft text-accent-strong">Sample</Badge>}</div><p className="mt-1 text-xs text-muted">{ARTIFACT_LABELS[artifact.kind]} · v{artifact.version} · {artifact.createdBy}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => openOutput(artifact)}>Open in {artifact.kind === 'insights' || artifact.kind === 'clusters' ? 'Analysis' : artifact.kind === 'process_map' || artifact.kind === 'uml' ? 'Design' : 'Develop'}</Button>{NEXT_STAGE[artifact.kind] && <Button size="sm" variant="accent-soft" onClick={()=>{setSelectedRunId(null);handoffArtifact(artifact.id,NEXT_STAGE[artifact.kind]!);}}>Next step: {TASK_LABELS[NEXT_STAGE[artifact.kind]!]}</Button>}</div></div>) : <p className="rounded-lg border border-dashed border-border p-4 text-xs text-muted">Outputs appear here as each stage completes.</p>}</section>

        </div>
        <DialogFooter className="flex-wrap">
          <Button asChild variant="outline"><Link href={`/job-analytics?jobId=${encodeURIComponent(selectedRun.id)}`}>View results dashboard</Link></Button>
          {selectedRun.status === 'running' || selectedRun.status === 'queued' ? <Button variant="outline" onClick={() => runAction('pause')}>Pause</Button> : selectedRun.status === 'paused' ? <Button variant="outline" onClick={() => runAction('resume')}>Resume</Button> : null}
          {['queued', 'running', 'paused'].includes(selectedRun.status) && (confirmCancel ? <div className="flex items-center gap-2"><span className="text-xs text-muted">Cancel this job?</span><Button variant="outline" onClick={() => setConfirmCancel(false)}>Keep job</Button><Button variant="destructive" onClick={() => runAction('cancel')}>Confirm cancel</Button></div> : <Button variant="outline" onClick={() => setConfirmCancel(true)}>Cancel job</Button>)}
          {['failed', 'cancelled'].includes(selectedRun.status) && <Button variant="accent" onClick={() => runAction('retry')}>Retry job</Button>}
        </DialogFooter>
      </DialogContent>}
    </Dialog>
  </AppShell>;
}
