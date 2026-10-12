'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { useApp } from '@/context/AppContext';
import { usePipeline } from '@/context/PipelineContext';
import { TASK_LABELS, STAGE_OUTPUT, type Artifact, type PipelineRun, type StageType } from '@/data/pipeline';
import { getJobAnalytics, summarizeTranscripts, downloadData, type JobAnalytics, type ClusterMetric, type TranscriptRecord } from '@/lib/job-analytics';
import { OpportunityCharts } from '@/components/analytics/OpportunityCharts';
import { AnalyticsSummary } from '@/components/analytics/AnalyticsSummary';
import { ClusterExplorer, type ClusterFilters } from '@/components/analytics/ClusterExplorer';
import { CostEstimator } from '@/components/analytics/CostEstimator';
import { PivotBuilder } from '@/components/analytics/PivotBuilder';
import { TranscriptExplorer } from '@/components/analytics/TranscriptExplorer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, ChevronDown, ArrowRight, Check, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type AnalyticsTab = 'overview' | 'clusters' | 'transcripts';
const DEFAULT_FILTERS: ClusterFilters = { search: '', level: 'all', minComplexity: '', maxComplexity: '', minAutomation: '' };
const SOURCE_LABEL: Record<string, string> = { sample: 'Synthetic sample', 'transcript estimate': 'Transcript-based estimate', backend: 'Backend analytics', unavailable: 'Unavailable' };

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp);
}
function matchesClusterBranch(cluster: ClusterMetric, selected: ClusterMetric | undefined, allClusters: ClusterMetric[]) {
  if (!selected) return true;
  let current: ClusterMetric | undefined = cluster;
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    if (current.id === selected.id) return true;
    seen.add(current.id);
    current = allClusters.find(item => item.id === current?.parentId);
  }
  return false;
}
function recordInBranch(record: TranscriptRecord, selected: ClusterMetric | undefined) {
  if (!selected) return true;
  if (selected.level === 'L1') return record.l1Id === selected.id;
  if (selected.level === 'L2') return record.l2Id === selected.id;
  return record.l3Id === selected.id;
}
function currentStep(run: PipelineRun) {
  return run.steps.find((step) => step.status === 'running') ?? run.steps.find((step) => step.status === 'waiting');
}

function JobOutputView({ run, analytics }: { run: PipelineRun; analytics: JobAnalytics }) {
  const [tab, setTab] = useState<AnalyticsTab>('overview');
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ClusterFilters>(DEFAULT_FILTERS);
  const { artifacts, selectArtifact, handoffArtifact } = usePipeline();
  const router = useRouter();
  const summary = useMemo(() => summarizeTranscripts(analytics.transcripts), [analytics.transcripts]);
  const selectedCluster = analytics.clusters.find((cluster) => cluster.id === selectedClusterId);
  const filteredClusters = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const minComplexity = filters.minComplexity === '' ? null : Number(filters.minComplexity);
    const maxComplexity = filters.maxComplexity === '' ? null : Number(filters.maxComplexity);
    const minAutomation = filters.minAutomation === '' ? null : Number(filters.minAutomation);
    return analytics.clusters.filter((cluster) => {
      if (!matchesClusterBranch(cluster, selectedCluster, analytics.clusters)) return false;
      if (filters.level !== 'all' && cluster.level !== filters.level) return false;
      const path = [cluster.name, cluster.l1, cluster.l2, cluster.l3].filter(Boolean).join(' ').toLowerCase();
      if (query && !path.includes(query)) return false;
      if (minComplexity !== null && cluster.complexity < minComplexity) return false;
      if (maxComplexity !== null && cluster.complexity > maxComplexity) return false;
      if (minAutomation !== null && cluster.automationPotential < minAutomation) return false;
      return true;
    });
  }, [analytics.clusters, filters, selectedCluster]);
  const filteredTranscripts = useMemo(() => {
    if (!selectedCluster && Object.entries(filters).every(([key,value])=>key==='level'?value==='all':value==='')) return analytics.transcripts;
    const matchingLevel = filters.level === 'all' ? 'L3' : filters.level;
    const allowedIds = new Set(filteredClusters.filter((cluster) => cluster.level === matchingLevel).map((cluster) => cluster.id));
    return analytics.transcripts.filter((record) => {
      if (!recordInBranch(record, selectedCluster)) return false;
      const recordClusterId = filters.level === 'L1' ? record.l1Id : filters.level === 'L2' ? record.l2Id : record.l3Id;
      if (!allowedIds.has(recordClusterId)) return false;
      return true;
    });
  }, [analytics.transcripts, filters, filteredClusters, selectedCluster]);
  const uniqueIntents = new Set(analytics.transcripts.map((record) => record.intent).filter(Boolean)).size;
  const notes = analytics.issues.filter(issue=>!analytics.sample || !/synthetic|local demo|sample analytics/i.test(issue));
  const sourceMetric = SOURCE_LABEL[analytics.metricSource] ?? analytics.metricSource;
  const step = currentStep(run);
  const openTranscripts = (cluster: ClusterMetric) => { setSelectedClusterId(cluster.id);setFilters(DEFAULT_FILTERS); setTab('transcripts'); };
  const downloadRawJson = () => downloadData(`job-${run.id}-analytics.json`, JSON.stringify({ job: run, sourceLabel: analytics.sourceLabel, metricSource: analytics.metricSource, sample: analytics.sample, transcripts: analytics.transcripts, clusters: analytics.clusters, issues: analytics.issues }, null, 2), 'application/json');

  const filtered = Boolean(selectedCluster || Object.entries(filters).some(([key, value]) => key === 'level' ? value !== 'all' : value !== ''));
  const drillInto = (cluster: ClusterMetric) => { setSelectedClusterId(cluster.id); setFilters(DEFAULT_FILTERS); setTab('clusters'); };
  const ownOutputs = artifacts.filter(artifact => artifact.runId === run.id && artifact.workspaceId === run.workspaceId);
  const relatedOutputs = new Map(ownOutputs.map(artifact => [artifact.id, artifact]));
  const addAncestors = (sourceId?: string) => {
    const seen = new Set<string>();
    let id = sourceId;
    while (id && !seen.has(id)) {
      seen.add(id);
      const source = artifacts.find(artifact => artifact.id === id && artifact.workspaceId === run.workspaceId);
      if (!source) break;
      relatedOutputs.set(source.id, source);
      id = source.sourceId;
    }
  };
  ownOutputs.forEach(output => addAncestors(output.sourceId));
  addAncestors(run.sourceArtifactId);
  const stages = [
    { stage: 'extract_intents', label: 'Intents' }, { stage: 'cluster_intents', label: 'Clusters' },
    { stage: 'design_flow', label: 'Process map' }, { stage: 'generate_uml', label: 'System flow' },
    { stage: 'generate_agent', label: 'Agent' },
  ] as const;
  const planned = run.plannedStages ?? (run.type === 'full_pipeline' ? stages.map(item => item.stage) : [run.type]);
  const stageOutputs = stages.map(item => ({ ...item, output: [...relatedOutputs.values()].filter(output => output.kind === STAGE_OUTPUT[item.stage]).sort((a, b) => Number(b.runId === run.id) - Number(a.runId === run.id) || b.version - a.version)[0] }));
  const latest = [...stageOutputs].reverse().find(item => item.output?.runId === run.id)?.output;
  const latestIndex = latest ? stages.findIndex(item => STAGE_OUTPUT[item.stage] === latest.kind) : -1;
  const nextStage: StageType | undefined = latestIndex >= 0 ? stages[latestIndex + 1]?.stage : undefined;
  const active = ['queued', 'running', 'paused'].includes(run.status);
  const openOutput = (output: Artifact) => {
    selectArtifact(output.id);
    router.push(output.kind === 'insights' || output.kind === 'clusters' ? '/analysis' : output.kind === 'agent_code' ? '/develop' : '/design');
  };
  const resultLabel = latest?.kind === 'agent_code' ? 'Open agent code' : latest?.kind === 'process_map' || latest?.kind === 'uml' ? 'Open design' : 'Review analysis';

  return <div className="space-y-5">
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="min-w-0"><div className="flex items-center gap-2 text-xs text-muted"><Badge variant="outline" className="capitalize">{run.status}</Badge><span>{TASK_LABELS[run.type]}</span></div><h2 className="mt-3 text-xl font-semibold tracking-tight">{run.name}</h2><p className="mt-1 text-sm text-muted">{active ? `${step?.label ?? 'Preparing your results'} · ${run.progress}% complete` : run.status === 'completed' ? 'Your results are ready to explore.' : run.error ?? 'Open job details to continue.'}</p></div>
        <div className="flex shrink-0 items-center gap-2">
          {latest && !active ? <Button variant="accent" onClick={() => openOutput(latest)}>{resultLabel}<ArrowRight className="size-4"/></Button> : <Button asChild variant="accent"><Link href={`/jobs?jobId=${encodeURIComponent(run.id)}`}>{active ? 'View progress' : 'View job details'}<ArrowRight className="size-4"/></Link></Button>}
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="More job options"><MoreHorizontal className="size-4"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link href={`/jobs?jobId=${encodeURIComponent(run.id)}`}>Job details</Link></DropdownMenuItem><DropdownMenuItem onClick={downloadRawJson}>Download all analytics (JSON)</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </div>
      </div>
      {active && <div role="progressbar" aria-label="Job progress" aria-valuenow={run.progress} aria-valuemin={0} aria-valuemax={100} className="h-1 bg-surface-inset"><div className="h-full bg-accent-strong transition-all" style={{ width: `${run.progress}%` }}/></div>}
      <ol aria-label="Pipeline results" className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-5">{stageOutputs.map((item, index) => <li key={item.stage} className="min-w-0 bg-surface"><button type="button" disabled={!item.output} onClick={() => item.output && openOutput(item.output)} className="flex w-full items-center gap-2.5 px-4 py-3 text-left enabled:hover:bg-accent-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:text-muted"><span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs ${item.output ? 'bg-accent-soft text-accent-strong' : 'bg-surface-inset text-muted'}`}>{item.output ? <Check className="size-3.5"/> : index + 1}</span><span><span className="block text-xs font-medium">{item.label}</span><span className="mt-0.5 block text-[10px] text-muted">{item.output ? item.output.runId === run.id ? 'Open result' : 'Source result' : planned.includes(item.stage) ? run.status === 'completed' ? 'Unavailable' : 'Pending' : 'Not included'}</span></span></button></li>)}</ol>
    </Card>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted"><p>{analytics.sample ? `Demo · ${summary.conversationCount} synthetic conversations. Scores are estimates.` : `${sourceMetric} · ${summary.conversationCount} unique conversations`}</p>{latest && nextStage && run.status === 'completed' && <button type="button" onClick={() => handoffArtifact(latest.id, nextStage)} className="font-medium text-accent-strong hover:underline">Continue to {TASK_LABELS[nextStage].toLowerCase()} →</button>}</div>
    {notes.length > 0 && <details className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3"><summary className="cursor-pointer text-xs font-medium">Data notes ({notes.length})</summary><ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-muted">{notes.map(issue => <li key={issue}>{issue}</li>)}</ul></details>}
    {analytics.transcripts.length > 0 ? <Tabs value={tab} onValueChange={value => setTab(value as AnalyticsTab)} className="gap-5">
      <TabsList aria-label="Job result views" variant="line" className="h-11 w-full justify-start gap-4 border-b border-border"><TabsTrigger value="overview" className="flex-none px-1">Overview</TabsTrigger><TabsTrigger value="clusters" className="flex-none px-1">Clusters</TabsTrigger><TabsTrigger value="transcripts" className="flex-none px-1">Transcripts</TabsTrigger></TabsList>
      {filtered && <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-inset/60 px-3 py-2 text-xs text-muted"><span>Exploring {selectedCluster?.name ?? 'filtered clusters'} · {filteredTranscripts.length} transcript records{tab === 'overview' && ' · Summary totals show the whole job'}</span><Button size="sm" variant="ghost" onClick={() => { setSelectedClusterId(null); setFilters(DEFAULT_FILTERS); }}>Reset view</Button></div>}
      <TabsContent value="overview" className="space-y-5">
        <AnalyticsSummary summary={summary} clusters={analytics.clusters} intents={uniqueIntents} onSelectCluster={drillInto}/>
        <details className="group rounded-xl border border-border bg-surface p-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-3"><span><span className="block text-sm font-semibold">Advanced analysis</span><span className="mt-1 block text-xs text-muted">Compare clusters, create a pivot table, or estimate savings.</span></span><ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180"/></summary><Tabs defaultValue="charts" className="mt-5 gap-4"><TabsList aria-label="Advanced analysis tools" variant="line" className="max-w-full justify-start overflow-x-auto"><TabsTrigger value="charts" className="px-3">Charts</TabsTrigger><TabsTrigger value="pivot" className="px-3">Pivot table</TabsTrigger><TabsTrigger value="costs" className="px-3">Savings estimate</TabsTrigger></TabsList><TabsContent value="charts"><OpportunityCharts clusters={filteredClusters} onSelect={drillInto}/></TabsContent><TabsContent value="pivot"><PivotBuilder records={filteredTranscripts} sample={analytics.sample} jobId={run.id}/></TabsContent><TabsContent value="costs"><CostEstimator key={selectedCluster?.id ?? 'all'} clusters={analytics.clusters} summary={summary} sample={analytics.sample} defaultClusterId={selectedCluster?.id}/></TabsContent></Tabs></details>
      </TabsContent>
      <TabsContent value="clusters"><ClusterExplorer clusters={filteredClusters} allClusters={analytics.clusters} filters={filters} onFiltersChange={setFilters} selectedClusterId={selectedClusterId} onSelectCluster={cluster => { setSelectedClusterId(cluster?.id ?? null); setFilters(DEFAULT_FILTERS); }} onViewTranscripts={openTranscripts} jobId={run.id}/></TabsContent>
      <TabsContent value="transcripts"><TranscriptExplorer records={filteredTranscripts}/></TabsContent>
    </Tabs> : <Card className="gap-2 border-dashed p-7"><h3 className="font-semibold">{active ? 'Your analysis is on its way' : 'No conversation analytics yet'}</h3><p className="max-w-xl text-sm leading-6 text-muted">{active ? 'Results will appear here as the job progresses. You can leave this page and return later.' : latest ? 'Open the result above. Conversation analytics appear when transcript data is included in this job or its source.' : 'This job does not have transcript results to explore yet. Check its progress or input in job details.'}</p>{run.error && <p className="text-sm text-destructive">{run.error}</p>}</Card>}
    <details className="border-t border-border pt-4 text-xs text-muted"><summary className="cursor-pointer">About this data</summary><div className="mt-3 space-y-2 leading-5"><p>{run.id} · Started {formatDate(run.createdAt)}</p><p>Source: {analytics.sourceLabel}</p><p>Metrics: {sourceMetric}. {analytics.sample && 'Synthetic examples for this demo; uploaded customer content has not been analyzed.'}</p></div></details>
  </div>;
}

export default function JobAnalytics() {
  const { currentWorkspace } = useApp();
  const { runs, artifacts } = usePipeline();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedJobId = searchParams.get('jobId') ?? '';
  const projectRuns = useMemo(() => runs.filter((run) => run.workspaceId === currentWorkspace.id).sort((a, b) => b.createdAt - a.createdAt), [runs, currentWorkspace.id]);
  const projectArtifacts = useMemo(() => artifacts.filter((artifact) => artifact.workspaceId === currentWorkspace.id), [artifacts, currentWorkspace.id]);
  const analyticsForRuns = useMemo(() => projectRuns.map((run) => ({ run, analytics: getJobAnalytics(run, projectArtifacts) })), [projectRuns, projectArtifacts]);
  const requested = requestedJobId ? analyticsForRuns.find((item) => item.run.id === requestedJobId) : undefined;
  const defaultResult = analyticsForRuns.find((item) => item.analytics.transcripts.length > 0) ?? analyticsForRuns[0];
  const selectedResult = requestedJobId ? requested : defaultResult;
  const selectedRun = selectedResult?.run;

  return <AppShell crumb="Job results"><main className="mx-auto w-full max-w-[1180px] space-y-5 p-5 pb-16 sm:p-8">
    <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><Link href="/jobs" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground"><ArrowLeft className="size-3.5"/>All jobs</Link><h1 className="mt-3 text-2xl font-semibold tracking-tight">Job results</h1></div>{projectRuns.length > 0 && <label className="w-full space-y-1 text-xs text-muted md:max-w-xs"><span>Job · {currentWorkspace.name}</span><select aria-label="Choose analytics job" value={selectedRun?.id ?? ''} onChange={event => router.replace(`/job-analytics?jobId=${encodeURIComponent(event.target.value)}`, { scroll: false })} className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="" disabled>Choose a job</option>{projectRuns.map(run => <option key={run.id} value={run.id}>{run.name}</option>)}</select></label>}</header>
    {requestedJobId && !requested && <Card className="border-amber-500/30 bg-amber-500/5 p-5"><h2 className="text-sm font-semibold">Job not found in this project</h2><p className="mt-1 text-xs leading-5 text-muted">The requested job ID does not belong to the currently selected project. Choose a job above to continue, or return to the <Link className="font-medium text-accent-strong hover:underline" href="/jobs">Jobs list</Link>.</p></Card>}
    {selectedRun && selectedResult ? <JobOutputView key={selectedRun.id} run={selectedRun} analytics={selectedResult.analytics}/> : projectRuns.length === 0 ? <Card className="border-dashed border-border p-8 text-center"><h2 className="text-base font-semibold">No jobs in this project yet</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">Once a job is created, its own linked analytics will appear here when available.</p><Link href="/jobs" className="mt-4 inline-flex h-9 items-center rounded-lg bg-accent-strong px-3 text-sm font-medium text-white hover:bg-accent-hover">Open Jobs</Link></Card> : null}
  </main></AppShell>;
}
