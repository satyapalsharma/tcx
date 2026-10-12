'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../components/AppShell';
import { useApp } from '@/context/AppContext';
import { usePipeline } from '@/context/PipelineContext';
import { DEMO_CLUSTERS, DEMO_INSIGHTS, ARTIFACT_LABELS, type Artifact, type ArtifactKind, type ClusterNode } from '@/data/pipeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { getJobAnalytics, summarizeTranscripts } from '@/lib/job-analytics';
import { TranscriptExplorer } from '@/components/analytics/TranscriptExplorer';
import { ClusterManager } from '@/components/analytics/ClusterManager';
import { JobOutputPicker, ValidationBadge } from '@/components/pipeline/JobOutputPicker';

type Signal = 'intent' | 'resolution' | 'escalation' | 'hold' | 'pain';
const ANALYSIS_KINDS: ArtifactKind[] = ['insights', 'clusters'];
const SIGNALS: { id: Signal; label: string; field: keyof (typeof DEMO_INSIGHTS)[number] }[] = [
  { id: 'intent', label: 'Intents', field: 'intent' },
  { id: 'resolution', label: 'Resolutions', field: 'resolution' },
  { id: 'escalation', label: 'Escalation reasons', field: 'escalation' },
  { id: 'hold', label: 'Hold reasons', field: 'hold' },
  { id: 'pain', label: 'Pain points', field: 'painPoint' },
];

function isAnalysisArtifact(artifact: Artifact) {
  return artifact.kind === 'insights' || artifact.kind === 'clusters';
}

function parseJson<T>(content: string | undefined): T | null {
  if (!content) return null;
  try { return JSON.parse(content) as T; } catch { return null; }
}

function isInsightList(value: unknown): value is typeof DEMO_INSIGHTS {
  return Array.isArray(value) && value.every((row) => row && typeof row.id === 'string' && typeof row.intent === 'string' && typeof row.quote === 'string' && typeof row.confidence === 'number');
}

function isClusterList(value: unknown): value is ClusterNode[] {
  return Array.isArray(value) && value.every((row) => row && typeof row.id === 'string' && typeof row.name === 'string' && ['L1', 'L2', 'L3'].includes(row.level) && typeof row.volume === 'number');
}

export default function Analysis() {
  const { currentWorkspace, openNewRun } = useApp();
  const { artifacts, runs, selectedArtifactId, selectArtifact, handoffArtifact, approveArtifact } = usePipeline();
  const [signal, setSignal] = useState<Signal>('intent');
  const [query, setQuery] = useState('');
  const [clusterDirty, setClusterDirty] = useState(false);
  const [requestedView, setRequestedView] = useState<{ artifactId: string; view: 'insights'|'clusters'|'transcripts' } | null>(null);
  const [transcriptClusterId, setTranscriptClusterId] = useState<string|null>(null);
  const [selectedInsight, setSelectedInsight] = useState<(typeof DEMO_INSIGHTS)[number] | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const scopedArtifacts = useMemo(() => artifacts.filter((artifact) => artifact.workspaceId === currentWorkspace.id && isAnalysisArtifact(artifact)), [artifacts, currentWorkspace.id]);
  const selectedArtifact = scopedArtifacts.find((artifact) => artifact.id === selectedArtifactId) ?? scopedArtifacts[0];
  const analysisView = requestedView?.artifactId === selectedArtifact?.id ? requestedView.view : selectedArtifact?.kind === 'clusters' ? 'clusters' : 'insights';
  const setAnalysisView = (view: 'insights'|'clusters'|'transcripts') => { if (selectedArtifact) setRequestedView({ artifactId: selectedArtifact.id, view }); };
  const insightArtifact = selectedArtifact?.kind === 'insights'
    ? selectedArtifact
    : selectedArtifact?.kind === 'clusters'
      ? scopedArtifacts.find((artifact) => artifact.id === selectedArtifact.sourceId && artifact.kind === 'insights')
      : scopedArtifacts.find((artifact) => artifact.kind === 'insights');
  const clusterArtifact = selectedArtifact?.kind === 'clusters'
    ? selectedArtifact
    : scopedArtifacts.find((artifact) => artifact.kind === 'clusters' && artifact.sourceId === insightArtifact?.id) ?? (selectedArtifact?.kind === 'insights' ? undefined : scopedArtifacts.find((artifact) => artifact.kind === 'clusters'));
  const insightAnalytics = useMemo(() => {
    const run = runs.find(item => item.id === insightArtifact?.runId);
    return run ? getJobAnalytics(run, artifacts) : undefined;
  }, [runs, artifacts, insightArtifact]);
  const clusterAnalytics = useMemo(() => {
    const run = runs.find(item => item.id === clusterArtifact?.runId);
    return run ? getJobAnalytics(run, artifacts) : undefined;
  }, [runs, artifacts, clusterArtifact]);
  const clusterMetrics = new Map(clusterAnalytics?.clusters.map(item => [item.id, item]) ?? []);
  const intentCounts = useMemo(() => new Map(summarizeTranscripts(insightAnalytics?.transcripts ?? []).intentCounts.map(item => [item.label, item.conversations])), [insightAnalytics]);
  const transcriptAnalytics = clusterAnalytics?.transcripts.length ? clusterAnalytics : insightAnalytics;
  const allTranscripts = transcriptAnalytics?.transcripts ?? [];
  const activeTranscriptCluster = transcriptAnalytics?.clusters.find(cluster => cluster.id === transcriptClusterId);
  const visibleTranscripts = activeTranscriptCluster ? allTranscripts.filter(record => [record.l1Id, record.l2Id, record.l3Id].includes(activeTranscriptCluster.id)) : allTranscripts;
  const insightData = useMemo(() => {
    if (!insightArtifact) return [] as typeof DEMO_INSIGHTS;
    const parsed = parseJson<unknown>(insightArtifact.content);
    if (isInsightList(parsed)) return insightAnalytics?.transcripts.length ? parsed.map(item => ({...item,volume:intentCounts.get(item.intent) ?? 0})) : parsed;
    return insightArtifact.sample ? DEMO_INSIGHTS : [];
  }, [insightArtifact, insightAnalytics, intentCounts]);
  const clusterData = useMemo(() => {
    if (!clusterArtifact) return [] as ClusterNode[];
    const parsed = parseJson<unknown>(clusterArtifact.content);
    if (isClusterList(parsed)) return parsed;
    return clusterArtifact.sample ? DEMO_CLUSTERS : [];
  }, [clusterArtifact]);
  const analysisRuns = runs.filter((run) => run.workspaceId === currentWorkspace.id && (run.type === 'extract_intents' || run.type === 'cluster_intents' || run.type === 'full_pipeline' || run.plannedStages?.some(stage => stage === 'extract_intents' || stage === 'cluster_intents')));
  const notableRuns = analysisRuns.filter((run) => ['queued', 'running', 'paused', 'failed'].includes(run.status)).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3);
  const selectedArtifactRun = selectedArtifact?.runId ? runs.find((run) => run.id === selectedArtifact.runId) : undefined;
  const selectedPipelineActive = Boolean(selectedArtifactRun && ['queued', 'running', 'paused'].includes(selectedArtifactRun.status) && (selectedArtifact?.kind === 'insights' ? (selectedArtifactRun.type === 'full_pipeline' || selectedArtifactRun.plannedStages?.includes('cluster_intents')) : (selectedArtifactRun.type === 'full_pipeline' || selectedArtifactRun.plannedStages?.includes('design_flow'))));
  const rows = useMemo(() => {
    const field = SIGNALS.find((item) => item.id === signal)?.field ?? 'intent';
    return insightData.filter((item) => String(item[field]).toLowerCase().includes(query.trim().toLowerCase()));
  }, [insightData, query, signal]);

  const exportArtifact = (artifact: Artifact) => {
    const payload = {
      artifact: { id: artifact.id, name: artifact.name, kind: artifact.kind, status: artifact.status, version: artifact.version, sample: artifact.sample },
      content: artifact.content,
      insights: artifact.kind === 'insights' ? parseJson(artifact.content) ?? (artifact.sample ? DEMO_INSIGHTS : undefined) : undefined,
      clusters: artifact.kind === 'clusters' ? parseJson(artifact.content) ?? (artifact.sample ? DEMO_CLUSTERS : undefined) : undefined,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${artifact.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderCluster = (node: (typeof DEMO_CLUSTERS)[number], depth = 0) => {
    const children = node.children ?? [];
    const metric = clusterMetrics.get(node.id);
    const volume = metric?.volume ?? node.volume;
    const total = clusterAnalytics?.transcripts.length ? summarizeTranscripts(clusterAnalytics.transcripts).conversationCount : clusterData.reduce((sum, root) => sum + root.volume, 0);
    const coverage = metric ? metric.coverage * 100 : (total ? volume / total * 100 : 0);
    const complexity = metric?.complexity ?? node.complexity;
    const automation = metric?.automationScore ?? node.automationScore;
    const open = expanded[node.id] ?? depth < 1;
    return <div key={node.id} className="space-y-1" style={{ marginLeft: depth ? 18 : 0 }}>
      <button type="button" aria-expanded={children.length ? open : undefined} onClick={() => children.length && setExpanded((state) => ({ ...state, [node.id]: !open }))} className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-left hover:bg-surface-hover/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong">
        <span className="w-8 shrink-0 rounded-md bg-accent-soft px-1.5 py-1 text-center text-[10px] font-semibold text-accent-strong">{node.level}</span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-foreground">{node.name}</span><span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] tabular-nums text-muted"><span>{volume.toLocaleString()} conversations · {coverage.toFixed(1)}% of total</span><span>Complexity: {complexity === undefined ? 'Unavailable' : `${Math.round(complexity)}/100`}</span><span>Automation score: {automation === undefined ? 'Unavailable' : `${Math.round(automation)}/100`}</span></span></span>
        {children.length > 0 && <span className="text-xs text-muted">{open ? '−' : '+'}</span>}
      </button>
      {open && children.length > 0 && <div className="space-y-1 border-l border-border pl-2">{children.map((child) => renderCluster(child, depth + 1))}</div>}
    </div>;
  };

  return <AppShell crumb="Analysis">
    <main className="mx-auto w-full max-w-[1280px] space-y-6 p-5 pb-16 sm:p-8" data-od-id="analysis-page">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Analysis · {currentWorkspace.name}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Conversation insights</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted">Find recurring needs, friction, and the reasons conversations slow down. Share an insight or taxonomy output with Design when it is ready.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">{selectedPipelineActive && selectedArtifactRun ? clusterDirty ? <Button disabled>Save taxonomy changes first</Button> : <Button asChild><Link href={`/jobs?jobId=${encodeURIComponent(selectedArtifactRun.id)}`}>View pipeline progress</Link></Button> : clusterArtifact ? <Button disabled={clusterDirty} onClick={() => handoffArtifact(clusterArtifact.id, 'design_flow')}>Continue to Design</Button> : insightArtifact ? <Button disabled={clusterDirty} onClick={() => handoffArtifact(insightArtifact.id, 'cluster_intents')}>Build taxonomy from insights</Button> : <Button disabled={clusterDirty} onClick={() => openNewRun('extract_intents')}>Start with conversation insights</Button>}<details className="relative"><summary aria-disabled={clusterDirty} className={`list-none rounded-lg border border-border px-3 py-2 text-sm ${clusterDirty ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`} onClick={(event) => clusterDirty && event.preventDefault()}>More options</summary><div hidden={clusterDirty} className="absolute right-0 z-20 mt-1 w-52 rounded-lg border border-border bg-surface p-2 shadow-lg"><Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => openNewRun('extract_intents')}>Extract insights</Button><Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => openNewRun('cluster_intents')}>Build taxonomy</Button><Link href={`/job-analytics${selectedArtifact?.runId ? `?jobId=${encodeURIComponent(selectedArtifact.runId)}` : ''}`} className="block rounded-md px-3 py-2 text-sm hover:bg-surface-inset">Job dashboard</Link></div></details></div>
      </header>

      {notableRuns.length > 0 && <section aria-label="Analysis job updates" className="space-y-2">{notableRuns.map((run) => <Card key={run.id} className="flex flex-col gap-3 border-border p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`h-2 w-2 rounded-full ${run.status === 'failed' ? 'bg-destructive' : 'bg-accent-strong'}`}/><p className="truncate text-sm font-medium">{run.name}</p><Badge variant="outline" className="capitalize">{run.status}</Badge><span className="text-xs text-muted">{run.id}</span></div>{run.status === 'failed' ? <p className="mt-1 text-xs text-destructive">{run.error ?? 'This job needs attention.'}</p> : <><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-inset"><div className="h-full rounded-full bg-accent-strong transition-all" style={{ width: `${run.progress}%` }}/></div><p className="mt-1 text-xs text-muted">{run.status === 'queued' ? 'Waiting to start' : run.status === 'paused' ? 'Paused' : `${run.progress}% complete`}</p></>}</div><Link href="/jobs" className="text-sm font-medium text-accent-strong underline-offset-4 hover:underline">View job details</Link></Card>)}</section>}

      <section aria-label="Analysis artifacts" className="grid gap-4">
        <Card className="min-w-0 space-y-4 border-border p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-base font-semibold">Analysis outputs</h2><p className="mt-1 text-xs text-muted">Results shared by your team in this project.</p></div>
            {selectedArtifact && <details className="relative"><summary aria-disabled={clusterDirty} className={`list-none rounded-lg border border-border px-3 py-2 text-xs ${clusterDirty ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`} onClick={(event) => clusterDirty && event.preventDefault()}>Output options</summary><div hidden={clusterDirty} className="absolute right-0 z-10 mt-1 w-48 rounded-lg border border-border bg-surface p-2 shadow-lg"><Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => exportArtifact(selectedArtifact)}>Download output JSON</Button>{selectedArtifact.status !== 'approved' && <Button variant="ghost" size="sm" className="w-full justify-start" disabled={clusterDirty} onClick={() => approveArtifact(selectedArtifact.id)}>Mark validated</Button>}</div></details>}
          </div>
          <fieldset disabled={clusterDirty}><JobOutputPicker key={currentWorkspace.id} kinds={ANALYSIS_KINDS} selectedId={selectedArtifact?.id ?? null} onSelect={(id) => { selectArtifact(id); setSelectedInsight(null);setTranscriptClusterId(null); }} title="Choose an analysis output" description="Outputs from each job and imported shared files stay available here. Drafts are reusable; validation is optional." emptyMessage="No insights or taxonomy outputs in this project yet." /></fieldset>
          {selectedArtifact && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"><div className="space-y-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs text-muted">Selected: <span className="font-medium text-foreground">{selectedArtifact.name}</span></p><ValidationBadge status={selectedArtifact.status}/></div></div><details className="text-xs"><summary className="cursor-pointer font-medium text-muted">Output details</summary><p className="mt-2 text-muted">{ARTIFACT_LABELS[selectedArtifact.kind]} · version {selectedArtifact.version} · created by {selectedArtifact.createdBy}{selectedArtifactRun && <> · job {selectedArtifactRun.id} ({selectedArtifactRun.status})</>}{selectedArtifact.validatedBy && <> · validated by {selectedArtifact.validatedBy} at version {selectedArtifact.validatedVersion}</>}</p></details></div>}
        </Card>
      </section>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Analysis stage view"><Button variant={analysisView === 'insights' ? 'accent-soft' : 'outline'} aria-pressed={analysisView === 'insights'} disabled={clusterDirty} title={clusterDirty ? 'Save or discard taxonomy changes first' : undefined} onClick={() => setAnalysisView('insights')}>Insights</Button><Button variant={analysisView === 'clusters' ? 'accent-soft' : 'outline'} aria-pressed={analysisView === 'clusters'} disabled={clusterDirty} title={clusterDirty ? 'Save or discard taxonomy changes first' : undefined} onClick={() => setAnalysisView('clusters')}>Taxonomy</Button><Button variant={analysisView === 'transcripts' ? 'accent-soft' : 'outline'} aria-pressed={analysisView === 'transcripts'} disabled={clusterDirty} title={clusterDirty ? 'Save or discard taxonomy changes first' : undefined} onClick={() => setAnalysisView('transcripts')}>Transcripts ({allTranscripts.length})</Button></div>
      {analysisView === 'insights' && insightArtifact && <section className="space-y-4" aria-label="Insight signals">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Signals</p><h2 className="mt-1 text-xl font-semibold">What conversations reveal</h2></div><label className="w-full sm:max-w-xs"><span className="sr-only">Search insights</span><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this signal…" /></label></div>
        <div role="group" aria-label="Filter by insight signal" className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1">{SIGNALS.map((item) => <button key={item.id} type="button" aria-pressed={signal === item.id} onClick={() => setSignal(item.id)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong ${signal === item.id ? 'bg-accent-soft text-accent-strong' : 'text-muted hover:text-foreground'}`}>{item.label}</button>)}</div>
        <Card className="overflow-hidden border-border p-0">
          <div className="divide-y divide-border">{rows.map((item) => <button type="button" key={item.id} onClick={() => setSelectedInsight(item)} className="flex w-full flex-col gap-2 p-4 text-left hover:bg-surface-hover/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-strong sm:flex-row sm:items-center sm:gap-4">
            <span className="min-w-0 flex-1 text-sm font-medium text-foreground">{String(item[SIGNALS.find((entry) => entry.id === signal)?.field ?? 'intent'])}</span>
            <span className="shrink-0 text-xs text-muted">{item.volume.toLocaleString()} conversations</span><span className="shrink-0 text-xs font-medium text-accent-strong">{Math.round(item.confidence * 100)}% confidence</span><span className="text-xs text-accent-strong">View evidence →</span>
          </button>)}</div>
          {!rows.length && <p className="p-8 text-center text-sm text-muted">{insightData.length ? 'No matching signals. Try another search.' : 'This artifact has no structured insight preview yet. Download its source content or select another shared artifact.'}</p>}
          <p className="border-t border-border px-4 py-3 text-[11px] text-muted">{insightArtifact.sample ? 'Sample data from the project demo.' : 'Insight details loaded from this shared artifact.'}</p>
        </Card>
      </section>}

      {analysisView !== 'insights' && <section className="space-y-4" aria-label={analysisView === 'clusters' ? 'Cluster taxonomy' : 'Conversation transcripts'}>
        {analysisView==='clusters' && (clusterArtifact ? clusterAnalytics?.transcripts.length ? <ClusterManager key={clusterArtifact.id} artifact={clusterArtifact} records={clusterAnalytics.transcripts} onDirtyChange={setClusterDirty} onViewTranscripts={id=>{setTranscriptClusterId(id);setAnalysisView('transcripts');}}/> : <Card className="space-y-2 p-4">{clusterData.map(node=>renderCluster(node))}<p className="text-xs text-muted">Transcript-linked editing is available when this job includes full transcript assignments.</p></Card> : <Card className="p-6 text-center"><h3 className="font-medium">No clusters for this output yet</h3><p className="mt-1 text-sm text-muted">Group these intents into an L1 / L2 / L3 taxonomy to start reviewing clusters.</p>{insightArtifact && <Button className="mt-3" onClick={()=>handoffArtifact(insightArtifact.id,'cluster_intents')}>Cluster these intents</Button>}</Card>)}
        {analysisView==='transcripts' && <div className="space-y-3">{activeTranscriptCluster && <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface p-3"><p className="text-sm">Transcripts in <strong>{activeTranscriptCluster.name}</strong></p><Button size="sm" variant="outline" onClick={()=>setTranscriptClusterId(null)}>Show all transcripts</Button></div>}<TranscriptExplorer key={`${selectedArtifact?.id}-${activeTranscriptCluster?.id??'all'}`} records={visibleTranscripts} sample={Boolean(transcriptAnalytics?.sample)}/></div>}
      </section>}

      {insightArtifact && <details className="rounded-xl border border-border bg-surface px-4"><summary className="cursor-pointer list-none py-4 text-sm font-medium text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong">Advanced insight details <span className="ml-2 text-xs font-normal">confidence distribution and evidence data</span></summary><div className="grid gap-4 border-t border-border py-4 sm:grid-cols-3"><div><p className="text-xs text-muted">Confidence range</p><p className="mt-1 text-sm font-medium">{insightData.length ? `${Math.round(Math.min(...insightData.map((item) => item.confidence)) * 100)}–${Math.round(Math.max(...insightData.map((item) => item.confidence)) * 100)}%` : 'Not available'}</p></div><div><p className="text-xs text-muted">Evidence examples</p><p className="mt-1 text-sm font-medium">{insightData.length} conversation excerpts</p></div><div><p className="text-xs text-muted">Artifact revision</p><p className="mt-1 text-sm font-medium">v{selectedArtifact?.version} · {selectedArtifact?.updatedAt}</p></div></div></details>}
    </main>
    <Sheet open={Boolean(selectedInsight)} onOpenChange={(open) => !open && setSelectedInsight(null)}><SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg"><SheetHeader className="pr-10"><p className="text-xs font-semibold uppercase tracking-wider text-muted">Conversation evidence</p><SheetTitle>{selectedInsight?.intent}</SheetTitle><SheetDescription>Evidence linked to the selected project artifact.</SheetDescription></SheetHeader>{selectedInsight && <div className="space-y-5 px-4 pb-6"><div className="rounded-xl bg-surface-inset/50 p-4"><p className="text-xs font-medium text-muted">Example quote</p><blockquote className="mt-2 text-sm leading-6 text-foreground">“{selectedInsight.quote}”</blockquote></div><div className="grid grid-cols-2 gap-3"><div className="rounded-lg border border-border p-3"><p className="text-xs text-muted">Confidence</p><p className="mt-1 text-lg font-semibold">{Math.round(selectedInsight.confidence * 100)}%</p></div><div className="rounded-lg border border-border p-3"><p className="text-xs text-muted">Conversations</p><p className="mt-1 text-lg font-semibold">{selectedInsight.volume.toLocaleString()}</p></div></div><div className="space-y-3 text-sm"><div><p className="text-xs font-medium text-muted">Resolution</p><p className="mt-1">{selectedInsight.resolution}</p></div><div><p className="text-xs font-medium text-muted">Escalation reason</p><p className="mt-1">{selectedInsight.escalation}</p></div><div><p className="text-xs font-medium text-muted">Hold reason</p><p className="mt-1">{selectedInsight.hold}</p></div><div><p className="text-xs font-medium text-muted">Pain point</p><p className="mt-1">{selectedInsight.painPoint}</p></div></div>{insightArtifact?.sample && <p className="text-xs text-muted">This quote and confidence value are examples included with the demo artifact.</p>}</div>}</SheetContent></Sheet>
  </AppShell>;
}
